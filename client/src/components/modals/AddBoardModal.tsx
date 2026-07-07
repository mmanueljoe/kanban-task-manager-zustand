import { useState } from "react";
import { useNavigate } from "react-router";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import iconCross from "@assets/icon-cross.svg";
import { useCreateBoard } from "@/hooks/useBoardQueries";
import { api } from "@/lib/api";
import { useUi } from "@/hooks/useUi";

type AddBoardModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AddBoardModal({ open, onClose }: AddBoardModalProps) {
  const { showToast } = useUi();
  const createBoard = useCreateBoard();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [columns, setColumns] = useState<string[]>(["Todo", "Doing"]);
  const [submitting, setSubmitting] = useState(false);

  const addColumn = () => setColumns((c) => [...c, ""]);
  const removeColumn = (i: number) =>
    setColumns((c) => c.filter((_, idx) => idx !== i));
  const updateColumn = (i: number, v: string) =>
    setColumns((c) => c.map((col, idx) => (idx === i ? v : col)));

  const reset = () => {
    setName("");
    setColumns(["Todo", "Doing"]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      showToast({ type: "error", message: "Please provide a board name." });
      return;
    }
    const cleanedColumns = columns.map((c) => c.trim()).filter(Boolean);

    setSubmitting(true);
    try {
      const board = await createBoard.mutateAsync(trimmedName);
      // Board is created first; its columns are separate resources, appended in
      // order. (position is assigned server-side.)
      for (const columnName of cleanedColumns) {
        await api.post(`/boards/${board.id}/columns`, { name: columnName });
      }
      showToast({ type: "success", message: "Board created" });
      reset();
      onClose();
      void navigate(`/board/${board.id}`);
    } catch {
      showToast({ type: "error", message: "Couldn't create the board." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} aria-label="Add board">
      <h2 className="app-modal-title">Add New Board</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-wrap app-modal-field">
          <label className="input-label">Board Name</label>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Platform Launch"
          />
        </div>
        <div className="app-modal-sublist">
          <label className="input-label app-modal-sublist-label">
            Board Columns
          </label>
          {columns.map((val, i) => (
            <div key={i} className="app-modal-sublist-row">
              <input
                type="text"
                className="input app-modal-sublist-input"
                value={val}
                onChange={(e) => updateColumn(i, e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeColumn(i)}
                aria-label="Remove column"
                className="app-icon-button"
              >
                <img src={iconCross} alt="" width={14} height={14} />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="large"
            onClick={addColumn}
            className="btn-block"
          >
            + Add New Column
          </Button>
        </div>
        <div className="app-modal-actions">
          <Button
            type="submit"
            variant="primary"
            size="large"
            disabled={submitting}
          >
            {submitting ? "Creating…" : "Create Board"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
