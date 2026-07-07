import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDTO, TaskDTO } from "@kanban/shared";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { Dropdown } from "@components/ui/Dropdown";
import iconCross from "@assets/icon-cross.svg";
import { api } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useUi } from "@/hooks/useUi";

type AddTaskModalProps = {
  open: boolean;
  onClose: () => void;
  columns: ColumnDTO[];
};

export function AddTaskModal({ open, onClose, columns }: AddTaskModalProps) {
  const qc = useQueryClient();
  const { showToast } = useUi();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subtasks, setSubtasks] = useState(["", ""]);
  const [columnId, setColumnId] = useState(columns[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);

  const options = columns.map((c) => ({ value: c.id, label: c.name }));

  const addSubtask = () => setSubtasks((s) => [...s, ""]);
  const removeSubtask = (i: number) =>
    setSubtasks((s) => s.filter((_, idx) => idx !== i));
  const updateSubtask = (i: number, v: string) =>
    setSubtasks((s) => s.map((st, idx) => (idx === i ? v : st)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = columnId || columns[0]?.id;
    if (!target || !title.trim()) {
      showToast({
        type: "error",
        message: "Please provide a title and a column for the task.",
      });
      return;
    }
    const cleanedSubtasks = subtasks.map((s) => s.trim()).filter(Boolean);

    setSubmitting(true);
    try {
      const task = await api.post<TaskDTO>(`/columns/${target}/tasks`, {
        title: title.trim(),
        description: description.trim(),
      });
      for (const st of cleanedSubtasks) {
        await api.post(`/tasks/${task.id}/subtasks`, { title: st });
      }
      qc.invalidateQueries({ queryKey: keys.tasks(target) });
      showToast({ type: "success", message: "Task created" });
      setTitle("");
      setDescription("");
      setSubtasks(["", ""]);
      onClose();
    } catch {
      showToast({ type: "error", message: "Couldn't create the task." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} aria-label="Add new task">
      <h2 className="app-modal-title">Add New Task</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-wrap app-modal-field">
          <label className="input-label">Title</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Take coffee break."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="input-wrap app-modal-field">
          <label className="input-label">Description</label>
          <textarea
            className="input input-textarea"
            placeholder="e.g. It's always good to take a break."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <div className="app-modal-sublist">
          <label className="input-label app-modal-sublist-label">
            Subtasks
          </label>
          {subtasks.map((val, i) => (
            <div key={i} className="app-modal-sublist-row">
              <input
                type="text"
                className="input app-modal-sublist-input"
                placeholder={
                  i === 0 ? "e.g. Make coffee." : "e.g. Drink coffee & smile."
                }
                value={val}
                onChange={(e) => updateSubtask(i, e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeSubtask(i)}
                aria-label="Remove subtask"
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
            onClick={addSubtask}
            className="btn-block"
          >
            + Add New Subtask
          </Button>
        </div>
        <div className="input-wrap app-modal-field">
          <label className="input-label">Status</label>
          <Dropdown
            options={options}
            value={columnId}
            onChange={setColumnId}
            placeholder="Select a column"
          />
        </div>
        <div className="app-modal-actions">
          <Button
            type="submit"
            variant="primary"
            size="large"
            disabled={submitting}
          >
            {submitting ? "Creating…" : "Create Task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
