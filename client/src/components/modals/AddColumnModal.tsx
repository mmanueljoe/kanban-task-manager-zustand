import { useState } from "react";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { useAddColumn } from "@/hooks/useColumnQueries";
import { useUi } from "@/hooks/useUi";

type AddColumnModalProps = {
  open: boolean;
  onClose: () => void;
  boardId: string | null;
};

export function AddColumnModal({
  open,
  onClose,
  boardId,
}: AddColumnModalProps) {
  const { showToast } = useUi();
  const addColumn = useAddColumn(boardId ?? "");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardId || !name.trim()) {
      showToast({
        type: "error",
        message: "Please provide a name for the new column.",
      });
      return;
    }

    addColumn.mutate(name.trim(), {
      onSuccess: () => {
        showToast({ type: "success", message: "Column added" });
        setName("");
        onClose();
      },
      onError: () =>
        showToast({ type: "error", message: "Couldn't add the column." }),
    });
  };

  return (
    <Modal open={open} onClose={onClose} aria-label="Add column">
      <h2 className="app-modal-title">Add New Column</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-wrap app-modal-field">
          <label className="input-label">Column Name</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. In Review"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="app-modal-actions">
          <Button
            type="submit"
            variant="primary"
            size="large"
            disabled={addColumn.isPending}
          >
            {addColumn.isPending ? "Adding…" : "Create Column"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
