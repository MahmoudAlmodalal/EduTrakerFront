import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, GraduationCap, Lock, Upload } from 'lucide-react';
import Button from '../../components/ui/Button';
import authService from '../../services/authService';
import styles from './WorkstreamStudentApplication.module.css';

const GENDER_OPTIONS = [
    { value: '', label: 'Select Gender' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
];

const stringifyApiValue = (value) => {
    if (Array.isArray(value)) {
        return value.map((item) => stringifyApiValue(item)).filter(Boolean).join(', ');
    }

    if (value && typeof value === 'object') {
        return Object.values(value)
            .map((item) => stringifyApiValue(item))
            .filter(Boolean)
            .join(', ');
    }

    if (value === null || value === undefined) {
        return '';
    }

    return String(value);
};

const getApiErrorMessage = (error, fallbackMessage) => {
    const payload = error?.response?.data ?? error?.data;

    if (typeof payload === 'string' && payload.trim()) {
        return payload.trim();
    }

    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
        const formattedEntries = Object.entries(payload)
            .map(([field, value]) => {
                const formattedValue = stringifyApiValue(value);
                if (!formattedValue) {
                    return '';
                }

                return `${field}: ${formattedValue}`;
            })
            .filter(Boolean);

        if (formattedEntries.length) {
            return formattedEntries.join(' | ');
        }
    }

    if (typeof error?.message === 'string' && error.message.trim()) {
        return error.message.trim();
    }

    return fallbackMessage;
};

const createDefaultFormState = () => ({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    school_id: '',
    grade_id: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    address: '',
    national_id: '',
    emergency_contact: '',
    medical_notes: '',
    birth_certificate: null,
});

const WorkstreamStudentApplication = () => {
    const { workstreamSlug } = useParams();

    const [formState, setFormState] = useState(createDefaultFormState);
    const [schools, setSchools] = useState([]);
    const [grades, setGrades] = useState([]);
    const [workstreamName, setWorkstreamName] = useState('');

    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loadingContext, setLoadingContext] = useState(true);
    const [loadingGrades, setLoadingGrades] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadContext = async () => {
            setLoadingContext(true);
            setError('');

            try {
                const payload = await authService.getWorkstreamStudentApplicationContext(workstreamSlug);
                if (!isMounted) {
                    return;
                }

                setWorkstreamName(payload?.workstream?.name || '');
                setSchools(Array.isArray(payload?.schools) ? payload.schools : []);
            } catch (requestError) {
                if (!isMounted) {
                    return;
                }

                setError(getApiErrorMessage(requestError, 'Unable to load this workstream application form.'));
            } finally {
                if (isMounted) {
                    setLoadingContext(false);
                }
            }
        };

        loadContext();

        return () => {
            isMounted = false;
        };
    }, [workstreamSlug]);

    useEffect(() => {
        let isMounted = true;

        const loadGrades = async () => {
            if (!formState.school_id) {
                setGrades([]);
                setFormState((previous) => ({ ...previous, grade_id: '' }));
                return;
            }

            setLoadingGrades(true);
            setError('');

            try {
                const payload = await authService.getWorkstreamStudentApplicationGrades(workstreamSlug, formState.school_id);
                if (!isMounted) {
                    return;
                }

                setGrades(Array.isArray(payload?.grades) ? payload.grades : []);
                setFormState((previous) => {
                    const hasCurrentGrade = payload?.grades?.some((grade) => String(grade.id) === String(previous.grade_id));
                    return hasCurrentGrade ? previous : { ...previous, grade_id: '' };
                });
            } catch (requestError) {
                if (!isMounted) {
                    return;
                }

                setGrades([]);
                setFormState((previous) => ({ ...previous, grade_id: '' }));
                setError(getApiErrorMessage(requestError, 'Unable to load grades for this school.'));
            } finally {
                if (isMounted) {
                    setLoadingGrades(false);
                }
            }
        };

        loadGrades();

        return () => {
            isMounted = false;
        };
    }, [formState.school_id, workstreamSlug]);

    const selectedSchoolName = useMemo(() => {
        const selected = schools.find((school) => String(school.id) === String(formState.school_id));
        return selected?.school_name || '';
    }, [formState.school_id, schools]);

    const updateFormField = (field, value) => {
        setFormState((previous) => ({ ...previous, [field]: value }));

        if (error) {
            setError('');
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if ((formState.password || '').length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        if (formState.password !== formState.confirm_password) {
            setError('Passwords do not match.');
            return;
        }

        if (!formState.birth_certificate) {
            setError('Birth certificate PDF is required.');
            return;
        }

        const fileName = String(formState.birth_certificate.name || '').toLowerCase();
        if (!fileName.endsWith('.pdf')) {
            setError('Birth certificate must be a PDF file.');
            return;
        }

        const normalizedEmail = formState.email.trim().toLowerCase();
        if (!normalizedEmail) {
            setError('Email is required.');
            return;
        }

        setIsCheckingEmail(true);
        try {
            const latestEmailStatus = await authService.getWorkstreamStudentApplicationStatus(workstreamSlug, normalizedEmail);
            if (latestEmailStatus?.can_apply === false) {
                setError(latestEmailStatus.message || 'A new application cannot be submitted for this email right now.');
                return;
            }
        } catch (requestError) {
            setError(getApiErrorMessage(requestError, 'Unable to check application status for this email.'));
            return;
        } finally {
            setIsCheckingEmail(false);
        }

        const payload = new FormData();
        payload.append('full_name', formState.full_name.trim());
        payload.append('email', normalizedEmail);
        payload.append('password', formState.password);
        payload.append('confirm_password', formState.confirm_password);
        payload.append('school_id', formState.school_id);
        payload.append('grade_id', formState.grade_id);
        payload.append('date_of_birth', formState.date_of_birth);
        payload.append('birth_certificate', formState.birth_certificate);

        if (formState.gender) payload.append('gender', formState.gender);
        if (formState.phone.trim()) payload.append('phone', formState.phone.trim());
        if (formState.address.trim()) payload.append('address', formState.address.trim());
        if (formState.national_id.trim()) payload.append('national_id', formState.national_id.trim());
        if (formState.emergency_contact.trim()) payload.append('emergency_contact', formState.emergency_contact.trim());
        if (formState.medical_notes.trim()) payload.append('medical_notes', formState.medical_notes.trim());

        setIsSubmitting(true);

        try {
            await authService.submitWorkstreamStudentApplication(workstreamSlug, payload);
            setSuccess(true);
        } catch (requestError) {
            setError(getApiErrorMessage(requestError, 'Unable to submit your application right now.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingContext) {
        return (
            <div className={styles.container}>
                <div className={styles.loginWrapper}>
                    <div className={styles.card}>
                        <div className={styles.header}>
                            <div className={styles.logo}>
                                <div className={styles.logoIcon}><GraduationCap size={24} /></div>
                                <h1 className={styles.title}>EduTraker</h1>
                            </div>
                            <p className={styles.subtitle}>Loading application form...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className={styles.container}>
                <div className={styles.loginWrapper}>
                    <div className={styles.card}>
                        <div className={styles.header}>
                            <div className={styles.logo}>
                                <div className={`${styles.logoIcon} ${styles.successIcon}`}>
                                    <CheckCircle2 size={24} />
                                </div>
                                <h1 className={styles.title}>EduTraker</h1>
                            </div>
                            <h2 className={styles.subtitle}>Application Submitted</h2>
                        </div>

                        <div className={styles.form}>
                            <p className={styles.successMessage}>
                                Your application was sent to the secretary with status <strong>pending</strong>.
                            </p>
                            <Link
                                to={`/login/workstream/${workstreamSlug}`}
                                className={`${styles.backLink} ${styles.centeredBackLink}`}
                            >
                                Back to Login →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.loginWrapper}>
                <div className={styles.card}>
                    <div className={styles.header}>
                        <div className={styles.logo}>
                            <div className={styles.logoIcon}><GraduationCap size={24} /></div>
                            <h1 className={styles.title}>EduTraker</h1>
                        </div>
                        <p className={styles.subtitle}>
                            {workstreamName ? `${workstreamName} - New Student Application` : 'New Student Application'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error ? <div className={styles.error}>{error}</div> : null}

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="full_name">Full Name</label>
                            <input
                                id="full_name"
                                type="text"
                                className={styles.input}
                                value={formState.full_name}
                                onChange={(event) => updateFormField('full_name', event.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                className={styles.input}
                                value={formState.email}
                                onChange={(event) => updateFormField('email', event.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="password">
                                <Lock size={14} />
                                Password
                            </label>
                            <div className={styles.passwordWrapper}>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className={styles.input}
                                    value={formState.password}
                                    onChange={(event) => updateFormField('password', event.target.value)}
                                    placeholder="Minimum 8 characters"
                                    minLength={8}
                                    required
                                />
                                <button
                                    type="button"
                                    className={styles.passwordToggle}
                                    onClick={() => setShowPassword((previous) => !previous)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="confirm_password">Confirm Password</label>
                            <div className={styles.passwordWrapper}>
                                <input
                                    id="confirm_password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    className={`${styles.input} ${formState.confirm_password && formState.password !== formState.confirm_password ? styles.inputError : ''}`}
                                    value={formState.confirm_password}
                                    onChange={(event) => updateFormField('confirm_password', event.target.value)}
                                    placeholder="Repeat your password"
                                    required
                                />
                                <button
                                    type="button"
                                    className={styles.passwordToggle}
                                    onClick={() => setShowConfirmPassword((previous) => !previous)}
                                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {formState.confirm_password && formState.password !== formState.confirm_password ? (
                                <small className={styles.fieldError}>Passwords do not match.</small>
                            ) : null}
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="school_id">School</label>
                            <select
                                id="school_id"
                                className={styles.input}
                                value={formState.school_id}
                                onChange={(event) => updateFormField('school_id', event.target.value)}
                                required
                            >
                                <option value="">Select School</option>
                                {schools.map((school) => (
                                    <option key={school.id} value={school.id}>{school.school_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="grade_id">Grade</label>
                            <select
                                id="grade_id"
                                className={styles.input}
                                value={formState.grade_id}
                                onChange={(event) => updateFormField('grade_id', event.target.value)}
                                required
                                disabled={!formState.school_id || loadingGrades}
                            >
                                <option value="">{loadingGrades ? 'Loading Grades...' : 'Select Grade'}</option>
                                {grades.map((grade) => (
                                    <option key={grade.id} value={grade.id}>{grade.name}</option>
                                ))}
                            </select>
                            {selectedSchoolName && !loadingGrades && grades.length === 0 ? (
                                <small className={styles.helperText}>
                                    No active grades were found for {selectedSchoolName}.
                                </small>
                            ) : null}
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="date_of_birth">Date of Birth</label>
                            <input
                                id="date_of_birth"
                                type="date"
                                className={styles.input}
                                value={formState.date_of_birth}
                                onChange={(event) => updateFormField('date_of_birth', event.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="gender">Gender</label>
                            <select
                                id="gender"
                                className={styles.input}
                                value={formState.gender}
                                onChange={(event) => updateFormField('gender', event.target.value)}
                            >
                                {GENDER_OPTIONS.map((option) => (
                                    <option key={option.value || 'none'} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="phone">Phone</label>
                            <input
                                id="phone"
                                type="text"
                                className={styles.input}
                                value={formState.phone}
                                onChange={(event) => updateFormField('phone', event.target.value)}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="national_id">National ID</label>
                            <input
                                id="national_id"
                                type="text"
                                className={styles.input}
                                value={formState.national_id}
                                onChange={(event) => updateFormField('national_id', event.target.value)}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="emergency_contact">Emergency Contact</label>
                            <input
                                id="emergency_contact"
                                type="text"
                                className={styles.input}
                                value={formState.emergency_contact}
                                onChange={(event) => updateFormField('emergency_contact', event.target.value)}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="address">Address</label>
                            <textarea
                                id="address"
                                className={styles.input}
                                value={formState.address}
                                onChange={(event) => updateFormField('address', event.target.value)}
                                rows={2}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="medical_notes">Medical Notes</label>
                            <textarea
                                id="medical_notes"
                                className={styles.input}
                                value={formState.medical_notes}
                                onChange={(event) => updateFormField('medical_notes', event.target.value)}
                                rows={2}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="birth_certificate">Birth Certificate (PDF)</label>
                            <div className={styles.fileInputRow}>
                                <Upload size={16} className={styles.fileIcon} />
                                <input
                                    id="birth_certificate"
                                    type="file"
                                    className={`${styles.input} ${styles.fileInput}`}
                                    accept="application/pdf,.pdf"
                                    onChange={(event) => updateFormField('birth_certificate', event.target.files?.[0] || null)}
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" variant="primary" size="large" disabled={isSubmitting || isCheckingEmail}>
                            {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
                        </Button>

                        <div className={styles.footer}>
                            <Link to={`/login/workstream/${workstreamSlug}`} className={styles.backLink}>
                                Back to Login
                            </Link>
                            <span className={styles.separator}>•</span>
                            <Link to="/" className={styles.backLink}>
                                Portal Selection
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default WorkstreamStudentApplication;
