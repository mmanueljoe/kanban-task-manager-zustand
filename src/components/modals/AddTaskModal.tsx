import { useState } from 'react';
import { Modal } from '@components/ui/Modal';
import { Button } from '@components/ui/Button';
import { Dropdown } from '@components/ui/Dropdown';
import iconCross from '@assets/icon-cross.svg';

type AddTaskModalProps = {
  open: boolean;
  onClose: () => void;
  columnOptions: { value: string; label: string }[];
};

export function AddTaskModal({
  open,
  onClose,
  columnOptions,
}: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subtasks, setSubtasks] = useState(['', '']);
  const [status, setStatus] = useState(columnOptions[0]?.value ?? '');

  const addSubtask = () => setSubtasks((s) => [...s, '']);
  const removeSubtask = (i: number) =>
    setSubtasks((s) => s.filter((_, idx) => idx !== i));
  const updateSubtask = (i: number, v: string) =>
    setSubtasks((s) => {
      const next = [...s];
      next[i] = v;
      return next;
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} aria-label="Add new task">
      <h2 className="app-modal-title">Add New Task</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-wrap" style={{ marginBottom: 24 }}>
          <label className="input-label">Title</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Take coffee break."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="input-wrap" style={{ marginBottom: 24 }}>
          <label className="input-label">Description</label>
          <textarea
            className="input"
            placeholder="e.g. It's always good to take a break. This 15 minute break will recharge the batteries a little."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ resize: 'vertical', minHeight: 80 }}
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label
            className="input-label"
            style={{ display: 'block', marginBottom: 8 }}
          >
            Subtasks
          </label>
          {subtasks.map((val, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}
            >
              <input
                type="text"
                className="input"
                placeholder={
                  i === 0 ? 'e.g. Make coffee.' : 'e.g. Drink coffee & smile.'
                }
                value={val}
                onChange={(e) => updateSubtask(i, e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => removeSubtask(i)}
                aria-label="Remove subtask"
                style={{
                  padding: 8,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                <img src={iconCross} alt="" width={14} height={14} />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="large"
            onClick={addSubtask}
            style={{ width: '100%' }}
          >
            + Add New Subtask
          </Button>
        </div>
        <div className="input-wrap" style={{ marginBottom: 24 }}>
          <label className="input-label">Status</label>
          <Dropdown
            options={columnOptions}
            value={status}
            onChange={setStatus}
            placeholder="Todo"
          />
        </div>
        <div className="app-modal-actions">
          <Button type="submit" variant="primary" size="large">
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
