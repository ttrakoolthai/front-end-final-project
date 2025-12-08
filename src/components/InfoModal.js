import React from "react";

function InfoModal({ open, onClose }) {
    if (!open) return null;

    return (
        <div className="modal-backdrop" onClick={onClose} role="presentation">
            <div
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="info-modal-title"
                onClick={(e) => {
                    e.stopPropagation();
                }}
            >
                <div className="modal-header">
                    <div id="info-modal-title" className="modal-title">
                        About this dashboard
                    </div>
                    <button
                        type="button"
                        className="modal-close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>
                {/* ...rest of body... */}
            </div>
        </div>
    );
}

export default InfoModal;
