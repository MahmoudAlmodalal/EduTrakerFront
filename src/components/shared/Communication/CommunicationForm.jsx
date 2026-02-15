// filepath: /home/mahmoud/Desktop/front/EduTrakerFront/src/components/shared/Communication/CommunicationForm.jsx
import { useState } from 'react';
import { Search, Send } from 'lucide-react';
import Button from '../../ui/Button';
import styles from './Communication.module.css';
import { api } from '../../../utils/api';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../ui/Toast';

const CommunicationForm = ({
    onSuccess,
    onCancel,
    initialRecipient = null,
    isReply = false,
    parentMessage = null,
    role = 'user',
    allowedRoles = null
}) => {
    const { t } = useTheme();
    const { showSuccess, showError, showWarning } = useToast();
    const MIN_RECIPIENT_SEARCH_CHARS = 1;
    const [recipientSearchTerm, setRecipientSearchTerm] = useState('');
    const [recipientSearchResults, setRecipientSearchResults] = useState([]);
    const [_isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [formData, setFormData] = useState({
        recipient_id: initialRecipient?.id || null,
        recipient_name: initialRecipient?.full_name || initialRecipient?.email || '',
        subject: isReply ? `Re: ${parentMessage?.subject}` : '',
        body: ''
    });
    const requiresScopedRecipient = role === 'school_manager' || role === 'student';
    const filteredRecipientResults = allowedRoles
        ? recipientSearchResults.filter((user) =>
            allowedRoles.some((allowedRole) => user.role?.toUpperCase() === allowedRole.toUpperCase())
        )
        : recipientSearchResults;
    const recipientSearchPlaceholder = allowedRoles
        ? 'Search secretaries, teachers, school manager...'
        : t('communication.searchPlaceholder');

    const handleUserSearch = async (term) => {
        setRecipientSearchTerm(term);
        const normalizedTerm = term.trim();
        if (normalizedTerm.length < MIN_RECIPIENT_SEARCH_CHARS) {
            setRecipientSearchResults([]);
            return;
        }

        setIsSearchingUsers(true);
        try {
            const response = await api.get('/user-messages/search/', { params: { search: normalizedTerm } });
            const results = response.results || response;
            setRecipientSearchResults(Array.isArray(results) ? results : []);
        } catch (err) {
            console.error('Error searching users:', err);
            setRecipientSearchResults([]);
            showError(t('communication.searchFailed') || 'Failed to search recipients.');
        } finally {
            setIsSearchingUsers(false);
        }
    };

    const extractErrorMessage = (err) => {
        const data = err?.data || err?.response?.data;
        if (!data) return err?.message || t('communication.sendFailed') || 'Failed to send message.';

        if (typeof data === 'string') {
            return data;
        }

        if (data.detail) {
            return data.detail;
        }

        const firstKey = Object.keys(data)[0];
        if (firstKey) {
            const firstVal = data[firstKey];
            if (Array.isArray(firstVal)) return firstVal.join(', ');
            if (typeof firstVal === 'string') return firstVal;
        }

        return err?.message || t('communication.sendFailed') || 'Failed to send message.';
    };

    const handleSelectRecipient = (user) => {
        setFormData(prev => ({
            ...prev,
            recipient_id: user.id,
            recipient_name: user.full_name || user.email
        }));
        setRecipientSearchTerm('');
        setRecipientSearchResults([]);
    };

    const handleRemoveRecipient = () => {
        setFormData(prev => ({ ...prev, recipient_id: null, recipient_name: '' }));
        setRecipientSearchTerm('');
        setRecipientSearchResults([]);
    };

    const handleSend = async () => {
        if (!formData.body.trim()) {
            showWarning(t('communication.emptyMessage') || 'Please write a message before sending.');
            return;
        }

        // For School Manager and Student compose flow, force recipient selection from scoped search.
        if (!formData.recipient_id && requiresScopedRecipient) {
            showError(t('communication.noRecipient') || 'Please select a recipient from the list.');
            return;
        }

        // Determine recipient payload (fallback to email only for non-school-manager roles).
        let recipientPayload = {};
        if (formData.recipient_id) {
            recipientPayload = { recipient_ids: [formData.recipient_id] };
        } else {
            const emailInput = (recipientSearchTerm.trim() || formData.recipient_name || '').trim();
            if (!emailInput) {
                showError(t('communication.noRecipient') || 'Please select or type a recipient email.');
                return;
            }
            recipientPayload = { recipient_emails: [emailInput] };
        }

        try {
            setIsSending(true);
            const basePayload = {
                subject: formData.subject || t('communication.noSubject'),
                body: formData.body,
                ...(isReply && {
                    thread_id: parentMessage.thread_id,
                    parent_message: parentMessage.id
                })
            };

            const payload = { ...basePayload, ...recipientPayload };

            await api.post('/user-messages/', payload);
            showSuccess(
                isReply
                    ? (t('communication.replySent') || 'Reply sent successfully.')
                    : (t('communication.messageSent') || 'Message sent successfully.')
            );

            // Clear form body if it was a success
            setFormData(prev => ({ ...prev, body: '' }));
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Failed to send message:', err);
            showError(extractErrorMessage(err));
        } finally {
            setIsSending(false);
        }
    };


    const handleCancel = () => {
        if (onCancel) onCancel();
    };

    return (
        <div className={styles.formContainer}>
            <div className={isReply ? styles.replyForm : styles.modalBody}>
                {!isReply && (
                    <div className={styles.formGroup}>
                        <label>{t('communication.recipient')}</label>
                        {formData.recipient_name ? (
                            <div className={styles.selectedRecipient}>
                                <span>{formData.recipient_name}</span>
                                <button onClick={handleRemoveRecipient} className={styles.removeRecipientBtn}>×</button>
                            </div>
                        ) : (
                            <>
                                <div className={styles.searchContainer}>
                                    <Search size={18} className={styles.searchIcon} />
                                    <input
                                        type="text"
                                        className={styles.searchInput}
                                        placeholder={recipientSearchPlaceholder}
                                        value={recipientSearchTerm}
                                        onChange={(e) => handleUserSearch(e.target.value)}
                                    />
                                    {recipientSearchTerm.trim().length >= MIN_RECIPIENT_SEARCH_CHARS && (
                                        <div className={styles.searchResults}>
                                            {filteredRecipientResults.length > 0 ? (
                                                filteredRecipientResults.map(user => (
                                                    <div key={user.id} onClick={() => handleSelectRecipient(user)} className={styles.searchResultItem}>
                                                        <div className={styles.resultName}>{user.full_name}</div>
                                                        <div className={styles.resultEmail}>{user.email}</div>
                                                        <div className={styles.resultRole} data-role={user.role?.toLowerCase()}>{user.role}</div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className={styles.searchResultItem} style={{ opacity: 0.7, cursor: 'default' }}>
                                                    <div className={styles.resultName}>{t('communication.noResults') || 'No users found'}</div>
                                                    <div className={styles.resultEmail}>
                                                        {requiresScopedRecipient
                                                            ? (t('communication.recipientRequired') || 'Choose a recipient from available users.')
                                                            : (t('communication.typeEmailHint') || 'Type a full email and click Send')}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {!isReply && (
                    <div className={styles.formGroup}>
                        <label>{t('communication.subject')}</label>
                        <input
                            type="text"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            className={styles.input}
                            placeholder={t('communication.subjectPlaceholder')}
                        />
                    </div>
                )}

                <div className={styles.formGroup}>
                    {!isReply && <label>{t('communication.messageBody')}</label>}
                    <textarea
                        value={formData.body}
                        onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                        className={styles.textarea}
                        placeholder={isReply ? t('communication.typeReply') : t('communication.messagePlaceholder')}
                        rows={isReply ? 3 : 6}
                    />
                </div>
            </div>

            <div className={isReply ? styles.replyActions : styles.modalFooter}>
                {!isReply && (
                    <Button
                        variant="secondary"
                        onClick={handleCancel}
                    >
                        {t('common.cancel')}
                    </Button>
                )}
                <Button
                    variant="primary"
                    onClick={handleSend}
                    icon={Send}
                    disabled={isSending || !formData.body.trim() || (!isReply && !formData.recipient_id && requiresScopedRecipient)}
                >
                    {t('communication.send')}
                </Button>
            </div>
        </div>
    );
};

export default CommunicationForm;
