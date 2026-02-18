import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, Eye, UserCheck, XCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import secretaryService from '../../services/secretaryService';
import {
    AlertBanner,
    ConfirmModal,
    LoadingSpinner,
    PageHeader,
    StatusBadge,
} from './components';
import './Secretary.css';

const normalizeStatus = (value = '') => value.toString().trim().toLowerCase();

const formatDateValue = (value) => {
    if (!value) {
        return 'N/A';
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return 'N/A';
    }

    return parsedDate.toLocaleDateString();
};

const formatTextValue = (value) => {
    if (value === null || value === undefined) {
        return 'N/A';
    }

    const normalized = String(value).trim();
    return normalized || 'N/A';
};

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
    const apiErrors = error?.response?.data ?? error?.data;

    if (typeof apiErrors === 'string' && apiErrors.trim()) {
        return apiErrors.trim();
    }

    if (apiErrors && typeof apiErrors === 'object' && !Array.isArray(apiErrors)) {
        const formattedEntries = Object.entries(apiErrors)
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

const StudentApplicationReview = () => {
    const navigate = useNavigate();
    const { applicationId } = useParams();
    const { showError, showSuccess } = useToast();
    const [application, setApplication] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showRejectConfirm, setShowRejectConfirm] = useState(false);
    const [banner, setBanner] = useState({ type: 'error', message: '' });

    const setFeedback = useCallback((type, message) => {
        setBanner({ type, message });
        if (type === 'error') {
            showError(message);
            return;
        }
        showSuccess(message);
    }, [showError, showSuccess]);

    const loadApplication = useCallback(async () => {
        if (!applicationId) {
            setFeedback('error', 'Missing application id.');
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const payload = await secretaryService.getStudentApplicationDetail(applicationId);
            setApplication(payload);
        } catch (error) {
            const message = getApiErrorMessage(error, 'Failed to load application details.');
            setFeedback('error', message);
        } finally {
            setIsLoading(false);
        }
    }, [applicationId, setFeedback]);

    useEffect(() => {
        loadApplication();
    }, [loadApplication]);

    const currentStatus = normalizeStatus(application?.status || 'unknown');
    const isPending = currentStatus === 'pending';
    const isEnrolled = currentStatus === 'enrolled';
    const canEnroll = Boolean(application?.id) && isPending && !isSubmitting;
    const canReject = Boolean(application?.id) && isPending && !isSubmitting;
    const hasCertificate = Boolean(application?.birth_certificate_url);

    const certificateFileName = useMemo(() => {
        const baseName = formatTextValue(application?.full_name)
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9_]/g, '');
        return `${baseName || 'student'}_birth_certificate.pdf`;
    }, [application?.full_name]);

    const handleUpdateStatus = useCallback(async (targetStatus, successMessage, { redirect = false } = {}) => {
        if (!application?.id) {
            setFeedback('error', 'Could not determine application id.');
            return;
        }

        try {
            setIsSubmitting(true);
            const updated = await secretaryService.updateStudentApplicationStatus(application.id, targetStatus);

            if (updated?.detail) {
                setFeedback('success', updated.detail);
                navigate('/secretary/admissions');
                return;
            }

            setApplication(updated);
            setFeedback('success', successMessage);
            if (redirect) {
                navigate('/secretary/admissions');
            }
        } catch (error) {
            const message = getApiErrorMessage(error, 'Failed to update application status.');
            setFeedback('error', message);
        } finally {
            setIsSubmitting(false);
        }
    }, [application?.id, navigate, setFeedback]);

    return (
        <div className="secretary-dashboard secretary-admissions-page">
            <PageHeader
                title="Application Review"
                subtitle="Validate student data and confirm enrollment."
                action={(
                    <button type="button" className="btn-secondary" onClick={() => navigate('/secretary/admissions')}>
                        <ArrowLeft size={16} />
                        Back to Admissions
                    </button>
                )}
            />

            <AlertBanner
                type={banner.type}
                message={banner.message}
                onDismiss={() => setBanner((previous) => ({ ...previous, message: '' }))}
            />

            {isLoading ? (
                <LoadingSpinner message="Loading application details..." />
            ) : (
                <section className="management-card sec-application-review-shell">
                    <div className="sec-application-review-head">
                        <div>
                            <h2>{formatTextValue(application?.full_name)}</h2>
                            <p>{formatTextValue(application?.email)}</p>
                        </div>
                        <StatusBadge status={currentStatus} />
                    </div>

                    <div className="sec-application-review-grid">
                        <article className="sec-card sec-application-review-card">
                            <h3>Applicant Information</h3>
                            <dl className="sec-review-list">
                                <div><dt>Date of Birth</dt><dd>{formatDateValue(application?.date_of_birth)}</dd></div>
                                <div><dt>Gender</dt><dd>{formatTextValue(application?.gender)}</dd></div>
                                <div><dt>Phone</dt><dd>{formatTextValue(application?.phone)}</dd></div>
                                <div><dt>Address</dt><dd>{formatTextValue(application?.address)}</dd></div>
                                <div><dt>National ID</dt><dd>{formatTextValue(application?.national_id)}</dd></div>
                                <div><dt>Emergency Contact</dt><dd>{formatTextValue(application?.emergency_contact)}</dd></div>
                                <div><dt>Medical Notes</dt><dd>{formatTextValue(application?.medical_notes)}</dd></div>
                            </dl>
                        </article>

                        <article className="sec-card sec-application-review-card">
                            <h3>Application Details</h3>
                            <dl className="sec-review-list">
                                <div><dt>School</dt><dd>{formatTextValue(application?.school_name)}</dd></div>
                                <div><dt>Grade</dt><dd>{formatTextValue(application?.grade_name)}</dd></div>
                                <div><dt>Submitted On</dt><dd>{formatDateValue(application?.created_at)}</dd></div>
                                <div><dt>Reviewed By</dt><dd>{formatTextValue(application?.reviewed_by_name)}</dd></div>
                                <div><dt>Reviewed At</dt><dd>{formatDateValue(application?.reviewed_at)}</dd></div>
                                <div><dt>Enrolled Student ID</dt><dd>{formatTextValue(application?.enrolled_student_id)}</dd></div>
                            </dl>
                        </article>

                        <article className="sec-card sec-application-review-card">
                            <h3>Birth Certificate</h3>
                            <p className="sec-application-review-hint">
                                Review the uploaded PDF before enrollment.
                            </p>
                            <div className="sec-review-actions-row">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    disabled={!hasCertificate}
                                    onClick={() => window.open(application.birth_certificate_url, '_blank', 'noopener,noreferrer')}
                                >
                                    <Eye size={16} />
                                    View Certificate
                                </button>
                                <a
                                    className={`btn-primary ${!hasCertificate ? 'sec-btn-disabled-link' : ''}`}
                                    href={hasCertificate ? application.birth_certificate_url : undefined}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download={certificateFileName}
                                    aria-disabled={!hasCertificate}
                                    onClick={(event) => {
                                        if (!hasCertificate) {
                                            event.preventDefault();
                                        }
                                    }}
                                >
                                    <Download size={16} />
                                    Download Certificate
                                </a>
                            </div>
                        </article>
                    </div>

                    <div className="sec-review-actions">
                        <button
                            type="button"
                            className="btn-secondary"
                            disabled={!canReject}
                            onClick={() => setShowRejectConfirm(true)}
                        >
                            <XCircle size={16} />
                            Reject
                        </button>
                        <button
                            type="button"
                            className="btn-primary"
                            disabled={!canEnroll}
                            onClick={() => handleUpdateStatus('enrolled', 'Application enrolled successfully.', { redirect: true })}
                        >
                            <UserCheck size={16} />
                            {isSubmitting ? 'Saving...' : (isEnrolled ? 'Already Enrolled' : 'Approve & Enroll')}
                        </button>
                    </div>
                </section>
            )}

            <ConfirmModal
                isOpen={showRejectConfirm}
                title="Reject Application"
                message={`Are you sure you want to reject ${application?.full_name || 'this student'}'s application? If a student account was created, it will be removed.`}
                confirmLabel={isSubmitting ? 'Rejecting...' : 'Yes, Reject'}
                cancelLabel="Cancel"
                danger
                confirmDisabled={isSubmitting}
                onCancel={() => setShowRejectConfirm(false)}
                onConfirm={async () => {
                    setShowRejectConfirm(false);
                    await handleUpdateStatus('rejected', 'Application rejected successfully.', { redirect: true });
                }}
            />
        </div>
    );
};

export default StudentApplicationReview;
