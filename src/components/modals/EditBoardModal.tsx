import { useState } from 'react';
import { Modal } from '@components/ui/Modal';
import { Button } from '@components/ui/Button';
import iconCross from '@assets/icon-cross.svg';
import { useStore } from '@/store/useStore';
import { useUi } from '@/hooks/useUi';
import type { Board } from '@/types/types';

type EditBoardModalProps = {
  open: boolean;
  onClose: () => void;
  boardName: string;
  columnNames: string[];
  boardIndex: number | null;
  originalBoard: Board;
};

export function EditBoardModal({
  open,
  onClose,
  boardName: initialName,
  columnNames: initialColumns,
  boardIndex,
  originalBoard,
}: EditBoardModalProps) {
  const dispatch = useStore((state) => state.dispatch);
  const { startLoading, stopLoading, showToast } = useUi();
  const [name, setName] = useState(initialName);
  const [columns, setColumns] = useState(initialColumns);

  const addColumn = () => setColumns((c) => [...c, '']);
  const removeColumn = (i: number) =>
    setColumns((c) => c.filter((_, idx) => idx !== i));
  const updateColumn = (i: number, v: string) =>
    setColumns((c) => {
      const next = [...c];
      next[i] = v;
      return next;
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (boardIndex == null) {
      showToast({
        type: 'error',
        message: 'Could not update board. Please try again.',
      });
      onClose();
      return;
    }
    const cleanedColumns = columns
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const updatedColumns = cleanedColumns.map((colName) => {
      const existing = originalBoard.columns.find((c) => c.name === colName);
      return existing
        ? { ...existing, name: colName }
        : { name: colName, tasks: [] };
    });

    const updatedBoard: Board = {
      ...originalBoard,
      name: name.trim() || originalBoard.name,
      columns: updatedColumns,
    };
    startLoading('editBoard');
    try {
      dispatch({
        type: 'UPDATE_BOARD',
        payload: { boardIndex, board: updatedBoard },
      });
      showToast({ type: 'success', message: 'Board updated' });
    } finally {
      stopLoading('editBoard');
      onClose();
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
          <Button type="submit" variant="primary" size="large">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
