import { Modal } from '@components/ui/Modal';
import { Button } from '@components/ui/Button';
import { useStore } from '@/store/useStore';
import { useUi } from '@/hooks/useUi';

type DeleteBoardModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  boardName: string;
  boardIndex: number | null;
};

export function DeleteBoardModal({
  open,
  onClose,
  onConfirm,
  boardName,
  boardIndex,
}: DeleteBoardModalProps) {
  const dispatch = useStore((state) => state.dispatch);
  const { startLoading, stopLoading, showToast } = useUi();
  const handleConfirm = () => {
    if (boardIndex == null) {
      showToast({
        type: 'error',
        message: 'Could not delete board. Please try again.',
      });
      onClose();
      return;
    }
    startLoading('deleteBoard');
    try {
      dispatch({ type: 'DELETE_BOARD', payload: { boardIndex } });
      onConfirm();
      showToast({ type: 'success', message: 'Board deleted' });
    } finally {
      stopLoading('deleteBoard');
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} aria-label="Delete board">
      <h2 className="app-modal-title app-modal-delete-title">
        Delete this board?
      </h2>
      <p
        className="body-l"
        style={{
          color: 'var(--text-muted)',
          margin: '0 0 24px 0',
          lineHeight: 1.6,
        }}
      >
        Are you sure you want to delete the &lsquo;{boardName}&rsquo; board?
        This action will remove all columns and tasks and cannot be reversed.
      </p>
      <div className="app-modal-actions">
        <Button
          type="button"
          variant="destructive"
          size="large"
          onClick={handleConfirm}
        >
          Delete
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="large"
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
