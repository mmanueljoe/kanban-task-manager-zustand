import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Modal } from '@components/ui/Modal';
import { Button } from '@components/ui/Button';
import iconCross from '@assets/icon-cross.svg';
import { useBoards } from '@/hooks/useBoards';
import { useUi } from '@/hooks/useUi';
import type { Board } from '@/types/types';

type AddBoardModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AddBoardModal({ open, onClose }: AddBoardModalProps) {
  const { boards, dispatch } = useBoards();
  const { startLoading, stopLoading, showToast } = useUi();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [columns, setColumns] = useState<string[]>(['Todo', 'Doing']);

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

    const trimmedName = name.trim();
    if (!trimmedName) {
      showToast({
        type: 'error',
        message: 'Please provide a name for the board.',
      });
      return;
    }

    const cleanedColumns = columns
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (cleanedColumns.length === 0) {
      showToast({
        type: 'error',
        message: 'Please add at least one column for the new board.',
      });
      return;
    }

    const newBoardIndex = boards.length;

    const newBoard: Board = {
      name: trimmedName,
      columns: cleanedColumns.map((colName) => ({
        name: colName,
        tasks: [],
      })),
    };

    startLoading('addBoard');
    try {
      dispatch({
        type: 'ADD_BOARD',
        payload: newBoard,
      });
      showToast({ type: 'success', message: 'Board created' });
      void navigate(`/board/${newBoardIndex}`);
    } finally {
      stopLoading('addBoard');
      onClose();
      setName('');
      setColumns(['Todo', 'Doing']);
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
          <Button type="submit" variant="primary" size="large">
            Create Board
          </Button>
        </div>
      </form>
    </Modal>
  );
}
