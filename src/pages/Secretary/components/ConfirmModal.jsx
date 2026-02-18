import React from 'react';
import Modal from '../../../components/ui/Modal';

const ConfirmModal = ({
    isOpen,
    title = 'Confirm Action',
    message = 'Are you sure you want to continue?',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = false,
    confirmDisabled = false,
    onConfirm,
    onCancel,
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onCancel} title={title}>
            <p className="sec-subtle-text">{message}</p>
            <div className="sec-modal-actions">
                <button type="button" className="btn-secondary" onClick={onCancel}>
                    {cancelLabel}
                </button>
                <button
                    type="button"
                    className={`btn-primary ${danger ? 'btn-danger' : ''}`.trim()}
                    onClick={onConfirm}
                    disabled={confirmDisabled}
                >
                    {confirmLabel}
                </button>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
