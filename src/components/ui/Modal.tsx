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

  if (typeof document !== 'undefined') {
    const appRoot = document.querySelector('.app-root');
    return createPortal(
      modalContent,
      (appRoot as HTMLElement) ?? document.body
    );
  }

  return modalContent;
}
