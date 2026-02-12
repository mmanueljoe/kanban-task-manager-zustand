import { useEffect } from 'react';
import { createPortal } from 'react-dom';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  'aria-label'?: string;
};

export function Modal({
  open,
  onClose,
  children,
  'aria-label': ariaLabel = 'Dialog',
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const modalContent = (
    <div
      className="app-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={onClose}
    >
      <div className="app-modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );

  // Render the modal at the document body level so it always
  // covers the full viewport and isn't clipped by layout containers.
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
