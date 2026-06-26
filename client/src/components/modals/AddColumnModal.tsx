import { useState } from 'react';
import { Modal } from '@components/ui/Modal';
import { Button } from '@components/ui/Button';
import { useStore } from '@/store/useStore';
import { useUi } from '@/hooks/useUi';

type AddColumnModalProps = {
  open: boolean;
  onClose: () => void;
  boardIndex: number | null;
};

export function AddColumnModal({
  open,
  onClose,
  boardIndex,
}: AddColumnModalProps) {
  const dispatch = useStore((state) => state.dispatch);
  const { startLoading, stopLoading, showToast } = useUi();
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (boardIndex === null || !name.trim()) {
      showToast({
        type: 'error',
        message: 'Please provide a name for the new column.',
      });
      return;
    }

    startLoading('addColumn');
    try {
      dispatch({
        type: 'ADD_COLUMN',
        payload: {
          boardIndex,
          columnName: name.trim(),
        },
      });
      showToast({ type: 'success', message: 'Column added' });
      setName('');
    } finally {
      stopLoading('addColumn');
      onClose();
    }
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
          <Button type="submit" variant="primary" size="large">
            Create Column
          </Button>
        </div>
      </form>
    </Modal>
  );
}
