import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { useDeleteBoard } from "@/hooks/useBoardQueries";
import { useUi } from "@/hooks/useUi";

type DeleteBoardModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  boardName: string;
  boardId: string | null;
};

export function DeleteBoardModal({
  open,
  onClose,
  onConfirm,
  boardName,
  boardId,
}: DeleteBoardModalProps) {
  const { showToast } = useUi();
  const deleteBoard = useDeleteBoard();

  const handleConfirm = () => {
    if (!boardId) {
      showToast({ type: "error", message: "Could not delete board." });
      onClose();
      return;
    }
    deleteBoard.mutate(boardId, {
      onSuccess: () => {
        showToast({ type: "success", message: "Board deleted" });
        onClose();
        onConfirm();
      },
      onError: () =>
        showToast({ type: "error", message: "Couldn't delete the board." }),
    });
  };

  return (
    <Modal open={open} onClose={onClose} aria-label="Delete board">
      <h2 className="app-modal-title app-modal-delete-title">
        Delete this board?
      </h2>
      <p className="body-l app-modal-description">
        Are you sure you want to delete the &lsquo;{boardName}&rsquo; board?
        This action will remove all columns and tasks and cannot be reversed.
      </p>
      <div className="app-modal-actions">
        <Button
          type="button"
          variant="destructive"
          size="large"
          onClick={handleConfirm}
          disabled={deleteBoard.isPending}
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
