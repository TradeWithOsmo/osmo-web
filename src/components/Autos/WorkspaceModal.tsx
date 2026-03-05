import React, { useState } from 'react';
import styles from './WorkspaceModal.module.css';

interface WorkspaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string) => void;
}

const WorkspaceModal: React.FC<WorkspaceModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [error, setError] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || name.trim() === '') {
            setError(true);
            return;
        }
        onSubmit(name.trim());
        setName('');
        setError(false);
    };

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Create New Workspace</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <form className={styles.content} onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Workspace Name</label>
                        <input
                            autoFocus
                            type="text"
                            className={`${styles.input} ${error ? styles.inputError : ''}`}
                            placeholder="Enter workspace name..."
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (error) setError(false);
                            }}
                        />
                        {error && <p className={styles.errorMessage}>pembikinan workspace gagal: Nama tidak boleh kosong</p>}
                    </div>

                    <div className={styles.infoBox}>
                        <span className={styles.infoIcon}>💡</span>
                        <p className={styles.infoText}>
                            Folders help you organize your chat sessions into logical groups like projects or topics.
                        </p>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelButton} onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.submitButton}>
                            Create Workspace
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WorkspaceModal;
