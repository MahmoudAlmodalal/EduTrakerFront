import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, Eye, UserCheck, XCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { useTheme } from '../../context/ThemeContext';
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

const toLabelCase = (value = '') => value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const formatDateValue = (value, unavailableLabel = 'N/A') => {
    if (!value) {
        return unavailableLabel;
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return unavailableLabel;
    }

    return parsedDate.toLocaleDateString();
};

const formatTextValue = (value, unavailableLabel = 'N/A') => {
    if (value === null || value === undefined) {
        return unavailableLabel;
    }

    const normalized = String(value).trim();
    return normalized || unavailableLabel;
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
    const { t } = useTheme();
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
            setFeedback('error', t('secretary.admissions.review.error.missingApplicationId'));
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const payload = await secretaryService.getStudentApplicationDetail(applicationId);
            setApplication(payload);
        } catch (error) {
            const message = getApiErrorMessage(error, t('secretary.admissions.review.error.loadFailed'));
            setFeedback('error', message);
        } finally {
            setIsLoading(false);
        }
    }, [applicationId, setFeedback, t]);

    useEffect(() => {
        loadApplication();
    }, [loadApplication]);

    const currentStatus = normalizeStatus(application?.status || 'unknown');
    const isPending = currentStatus === 'pending';
    const isEnrolled = currentStatus === 'enrolled';
    const canEnroll = Boolean(application?.id) && isPending && !isSubmitting;
    const canReject = Boolean(application?.id) && isPending && !isSubmitting;
    const hasCertificate = Boolean(application?.birth_certificate_url);
    const notAvailableLabel = t('secretary.admissions.review.notAvailable');
    const statusLabel = useMemo(() => {
        const key = `secretary.admissions.review.status.${currentStatus}`;
        const translated = t(key);
        if (translated !== key) {
            return translated;
        }

        return currentStatus ? toLabelCase(currentStatus) : t('secretary.admissions.review.status.unknown');
    }, [currentStatus, t]);
    const formatGenderValue = useCallback((value) => {
        const normalizedGender = normalizeStatus(value);
        if (!normalizedGender) {
            return notAvailableLabel;
        }

        const key = `secretary.admissions.review.gender.${normalizedGender}`;
        const translated = t(key);
        if (translated !== key) {
            return translated;
        }

        return formatTextValue(value, notAvailableLabel);
    }, [notAvailableLabel, t]);
    const rejectModalStudentName = (typeof application?.full_name === 'string' && application.full_name.trim())
        || t('secretary.admissions.review.rejectModal.fallbackName');

    const certificateFileName = useMemo(() => {
        const baseName = (typeof application?.full_name === 'string' ? application.full_name.trim() : '')
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9_]/g, '');
        return `${baseName || 'student'}_birth_certificate.pdf`;
    }, [application?.full_name]);

    const handleUpdateStatus = useCallback(async (targetStatus, successMessage, { redirect = false } = {}) => {
        if (!application?.id) {
            setFeedback('error', t('secretary.admissions.review.error.missingResolvedApplicationId'));
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
            const message = getApiErrorMessage(error, t('secretary.admissions.review.error.updateFailed'));
            setFeedback('error', message);
        } finally {
            setIsSubmitting(false);
        }
    }, [application?.id, navigate, setFeedback, t]);

    return (
        <div className="secretary-dashboard secretary-admissions-page">
            <PageHeader
                title={t('secretary.admissions.review.title')}
                subtitle={t('secretary.admissions.review.subtitle')}
                action={(
                    <button type="button" className="btn-secondary" onClick={() => navigate('/secretary/admissions')}>
                        <ArrowLeft size={16} />
                        {t('secretary.admissions.review.backToAdmissions')}
                    </button>
                )}
            />

            <AlertBanner
                type={banner.type}
                message={banner.message}
                onDismiss={() => setBanner((previous) => ({ ...previous, message: '' }))}
            />

            {isLoading ? (
                <LoadingSpinner message={t('secretary.admissions.review.loading')} />
            ) : (
                <section className="management-card sec-application-review-shell">
                    <div className="sec-application-review-head">
                        <div>
                            <h2>{formatTextValue(application?.full_name, notAvailableLabel)}</h2>
                            <p>{formatTextValue(application?.email, notAvailableLabel)}</p>
                        </div>
                        <StatusBadge status={currentStatus} label={statusLabel} />
                    </div>

                    <div className="sec-application-review-grid">
                        <article className="sec-card sec-application-review-card">
                            <h3>{t('secretary.admissions.review.applicantInformation')}</h3>
                            <dl className="sec-review-list">
                                <div><dt>{t('secretary.admissions.review.dateOfBirth')}</dt><dd>{formatDateValue(application?.date_of_birth, notAvailableLabel)}</dd></div>
                                <div><dt>{t('secretary.admissions.review.gender')}</dt><dd>{formatGenderValue(application?.gender)}</dd></div>
                                <div><dt>{t('secretary.admissions.review.phone')}</dt><dd>{formatTextValue(application?.phone, notAvailableLabel)}</dd></div>
                                <div><dt>{t('secretary.admissions.review.address')}</dt><dd>{formatTextValue(application?.address, notAvailableLabel)}</dd></div>
                                <div><dt>{t('secretary.admissions.review.nationalId')}</dt><dd>{formatTextValue(application?.national_id, notAvailableLabel)}</dd></div>
                                <div><dt>{t('secretary.admissions.review.emergencyContact')}</dt><dd>{formatTextValue(application?.emergency_contact, notAvailableLabel)}</dd></div>
                                <div><dt>{t('secretary.admissions.review.medicalNotes')}</dt><dd>{formatTextValue(application?.medical_notes, notAvailableLabel)}</dd></div>
                            </dl>
                        </article>

                        <article className="sec-card sec-application-review-card">
                            <h3>{t('secretary.admissions.review.applicationDetails')}</h3>
                            <dl className="sec-review-list">
                                <div><dt>{t('secretary.admissions.review.school')}</dt><dd>{formatTextValue(application?.school_name, notAvailableLabel)}</dd></div>
                                <div><dt>{t('secretary.admissions.review.grade')}</dt><dd>{formatTextValue(application?.grade_name, notAvailableLabel)}</dd></div>
                                <div><dt>{t('secretary.admissions.review.submittedOn')}</dt><dd>{formatDateValue(application?.created_at, notAvailableLabel)}</dd></div>
                                <div><dt>{t('secretary.admissions.review.reviewedBy')}</dt><dd>{formatTextValue(application?.reviewed_by_name, notAvailableLabel)}</dd></div>
                                <div><dt>{t('secretary.admissions.review.reviewedAt')}</dt><dd>{formatDateValue(application?.reviewed_at, notAvailableLabel)}</dd></div>
                                <div><dt>{t('secretary.admissions.review.enrolledStudentId')}</dt><dd>{formatTextValue(application?.enrolled_student_id, notAvailableLabel)}</dd></div>
                            </dl>
                        </article>

                        <article className="sec-card sec-application-review-card">
                            <h3>{t('secretary.admissions.review.birthCertificate')}</h3>
                            <p className="sec-application-review-hint">
                                {t('secretary.admissions.review.birthCertificateHint')}
                            </p>
                            <div className="sec-review-actions-row">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    disabled={!hasCertificate}
                                    onClick={() => window.open(application.birth_certificate_url, '_blank', 'noopener,noreferrer')}
                                >
                                    <Eye size={16} />
                                    {t('secretary.admissions.review.viewCertificate')}
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
                                    {t('secretary.admissions.review.downloadCertificate')}
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
                            {t('secretary.admissions.review.reject')}
                        </button>
                        <button
                            type="button"
                            className="btn-primary"
                            disabled={!canEnroll}
                            onClick={() => handleUpdateStatus('enrolled', t('secretary.admissions.review.success.enrolled'), { redirect: true })}
                        >
                            <UserCheck size={16} />
                            {isSubmitting
                                ? t('common.saving')
                                : (isEnrolled ? t('secretary.admissions.review.alreadyEnrolled') : t('secretary.admissions.review.approveAndEnroll'))}
                        </button>
                    </div>
                </section>
            )}

            <ConfirmModal
                isOpen={showRejectConfirm}
                title={t('secretary.admissions.review.rejectModal.title')}
                message={t('secretary.admissions.review.rejectModal.message', { name: rejectModalStudentName })}
                confirmLabel={isSubmitting
                    ? t('secretary.admissions.review.rejectModal.confirming')
                    : t('secretary.admissions.review.rejectModal.confirm')}
                cancelLabel={t('common.cancel')}
                danger
                confirmDisabled={isSubmitting}
                onCancel={() => setShowRejectConfirm(false)}
                onConfirm={async () => {
                    setShowRejectConfirm(false);
                    await handleUpdateStatus('rejected', t('secretary.admissions.review.success.rejected'), { redirect: true });
                }}
            />
        </div>
    );
};

export default StudentApplicationReview;
