// filepath: /home/mahmoud/Desktop/front/EduTrakerFront/src/components/shared/Communication/CommunicationForm.jsx
import { useState } from 'react';
import { Search, Send, ShieldCheck } from 'lucide-react';
import Button from '../../ui/Button';
import styles from './Communication.module.css';
import { api } from '../../../utils/api';
import { useTheme } from '../../../context/ThemeContext';

const CommunicationForm = ({
    onSuccess,
    onCancel,
    initialRecipient = null,
    isReply = false,
    parentMessage = null
}) => {
    const { t } = useTheme();
    const [recipientSearchTerm, setRecipientSearchTerm] = useState('');
    const [recipientSearchResults, setRecipientSearchResults] = useState([]);
    const [_isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [formData, setFormData] = useState({
        recipient_id: initialRecipient?.id || null,
        recipient_name: initialRecipient?.full_name || initialRecipient?.email || '',
        subject: isReply ? `Re: ${parentMessage?.subject}` : '',
        body: ''
    });

    const handleUserSearch = async (term) => {
        setRecipientSearchTerm(term);
        if (term.length < 2) {
            setRecipientSearchResults([]);
            return;
        }

        setIsSearchingUsers(true);
        try {
            const response = await api.get('/user-messages/search/', { params: { search: term } });
            const results = response.results || response;
            setRecipientSearchResults(Array.isArray(results) ? results : []);
        } catch (err) {
            console.error('Error searching users:', err);
        } finally {
            setIsSearchingUsers(false);
        }
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
        if (!formData.body.trim()) return;

        // Determine recipient payload
        let recipientPayload = {};
        if (formData.recipient_id) {
            recipientPayload = { recipient_ids: [formData.recipient_id] };
        } else {
            const emailInput = (recipientSearchTerm.trim() || formData.recipient_name || '').trim();
            if (emailInput) {
                recipientPayload = { recipient_emails: [emailInput] };
            } else {
                alert(t('communication.noRecipient') || 'Please select or type a recipient email.');
                return;
            }
        }

        try {
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
            if (onSuccess) onSuccess();

            // Clear form body if it was a success
            setFormData(prev => ({ ...prev, body: '' }));
        } catch (err) {
            console.error('Failed to send message:', err);
            const detail = err?.response?.data;
            if (detail) {
                const errorMsg = detail.recipient_emails
                    ? (Array.isArray(detail.recipient_emails) ? detail.recipient_emails.join(', ') : detail.recipient_emails)
                    : (typeof detail === 'string' ? detail : JSON.stringify(detail));
                alert(errorMsg);
            }
        }
    };

    const handleContactAdmin = async () => {
        try {
            const response = await api.get('/users/', { params: { role: 'super_admin', limit: 1 } });
            const admins = response.results || response;
            if (admins && admins.length > 0) {
                handleSelectRecipient(admins[0]);
            }
        } catch (err) {
            console.error('Error finding admin:', err);
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
                                <div className={styles.adminShortcut} onClick={handleContactAdmin}>
                                    <ShieldCheck size={16} />
                                    <span>{t('communication.contactAdmin')}</span>
                                </div>
                                <div className={styles.searchContainer}>
                                    <Search size={18} className={styles.searchIcon} />
                                    <input
                                        type="text"
                                        className={styles.searchInput}
                                        placeholder={t('communication.searchPlaceholder')}
                                        value={recipientSearchTerm}
                                        onChange={(e) => handleUserSearch(e.target.value)}
                                    />
                                    {recipientSearchTerm.length >= 2 && (
                                        <div className={styles.searchResults}>
                                            {recipientSearchResults.length > 0 ? (
                                                recipientSearchResults.map(user => (
                                                    <div key={user.id} onClick={() => handleSelectRecipient(user)} className={styles.searchResultItem}>
                                                        <div className={styles.resultName}>{user.full_name}</div>
                                                        <div className={styles.resultEmail}>{user.email}</div>
                                                        <div className={styles.resultRole}>{user.role}</div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className={styles.searchResultItem} style={{ opacity: 0.7, cursor: 'default' }}>
                                                    <div className={styles.resultName}>{t('communication.noResults') || 'No users found'}</div>
                                                    <div className={styles.resultEmail}>{t('communication.typeEmailHint') || 'Type a full email and click Send'}</div>
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
                    disabled={false} // always clickable
                >
                    {t('communication.send')}
                </Button>
            </div>
        </div>
    );
};

export default CommunicationForm;
