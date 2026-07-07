import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { BoardDTO, ColumnDTO } from "@kanban/shared";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import iconCross from "@assets/icon-cross.svg";
import { api } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useUi } from "@/hooks/useUi";

type EditBoardModalProps = {
  open: boolean;
  onClose: () => void;
  board: BoardDTO;
  columns: ColumnDTO[];
};

// A column being edited: existing ones carry their id, new ones have id: null.
type EditableColumn = { id: string | null; name: string };

export function EditBoardModal({
  open,
  onClose,
  board,
  columns,
}: EditBoardModalProps) {
  const qc = useQueryClient();
  const { showToast } = useUi();
  const [name, setName] = useState(board.name);
  const [cols, setCols] = useState<EditableColumn[]>(
    columns.map((c) => ({ id: c.id, name: c.name }))
  );
  const [submitting, setSubmitting] = useState(false);

  const addColumn = () => setCols((c) => [...c, { id: null, name: "" }]);
  const removeColumn = (i: number) =>
    setCols((c) => c.filter((_, idx) => idx !== i));
  const updateColumn = (i: number, v: string) =>
    setCols((c) =>
      c.map((col, idx) => (idx === i ? { ...col, name: v } : col))
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast({ type: "error", message: "A board needs a name." });
      return;
    }

    setSubmitting(true);
    try {
      if (name.trim() !== board.name) {
        await api.patch(`/boards/${board.id}`, { name: name.trim() });
      }
      // Columns the user removed (originals no longer present) → delete (cascades tasks).
      const keptIds = new Set(cols.filter((c) => c.id).map((c) => c.id));
      for (const original of columns) {
        if (!keptIds.has(original.id)) {
          await api.delete(`/columns/${original.id}`);
        }
      }
      // Rename changed existing columns; create the new ones.
      for (const c of cols) {
        const columnName = c.name.trim();
        if (!columnName) continue;
        if (c.id) {
          const original = columns.find((o) => o.id === c.id);
          if (original && original.name !== columnName) {
            await api.patch(`/columns/${c.id}`, { name: columnName });
          }
        } else {
          await api.post(`/boards/${board.id}/columns`, { name: columnName });
        }
      }
      qc.invalidateQueries({ queryKey: keys.columns(board.id) });
      qc.invalidateQueries({ queryKey: keys.boardList() });
      qc.invalidateQueries({ queryKey: keys.board(board.id) });
      showToast({ type: "success", message: "Board updated" });
      onClose();
    } catch {
      showToast({ type: "error", message: "Couldn't update the board." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} aria-label="Edit board">
      <h2 className="app-modal-title">Edit Board</h2>
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
          {cols.map((col, i) => (
            <div key={col.id ?? `new-${i}`} className="app-modal-sublist-row">
              <input
                type="text"
                className="input app-modal-sublist-input"
                value={col.name}
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
            {submitting ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
