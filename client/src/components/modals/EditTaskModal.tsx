import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDTO, TaskDTO } from "@kanban/shared";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { Dropdown } from "@components/ui/Dropdown";
import { api } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useUi } from "@/hooks/useUi";

type EditTaskModalProps = {
  open: boolean;
  onClose: () => void;
  task: TaskDTO;
  columns: ColumnDTO[];
};

export function EditTaskModal({
  open,
  onClose,
  task,
  columns,
}: EditTaskModalProps) {
  const qc = useQueryClient();
  const { showToast } = useUi();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [columnId, setColumnId] = useState(task.columnId);
  const [submitting, setSubmitting] = useState(false);

  const options = columns.map((c) => ({ value: c.id, label: c.name }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast({ type: "error", message: "A task needs a title." });
      return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/tasks/${task.id}`, {
        title: title.trim(),
        description: description.trim(),
      });
      const movedColumns = columnId !== task.columnId;
      if (movedColumns) {
        const toTasks = qc.getQueryData<TaskDTO[]>(keys.tasks(columnId)) ?? [];
        const lastPos = toTasks.length
          ? Math.max(...toTasks.map((t) => t.position))
          : 0;
        await api.patch(`/tasks/${task.id}/move`, {
          toColumnId: columnId,
          position: lastPos + 1000,
        });
      }
      qc.invalidateQueries({ queryKey: keys.tasks(task.columnId) });
      if (movedColumns) {
        qc.invalidateQueries({ queryKey: keys.tasks(columnId) });
      }
      showToast({ type: "success", message: "Task updated" });
      onClose();
    } catch {
      showToast({ type: "error", message: "Couldn't update the task." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} aria-label="Edit task">
      <h2 className="app-modal-title">Edit Task</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-wrap app-modal-field">
          <label className="input-label">Title</label>
          <input
            type="text"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="input-wrap app-modal-field">
          <label className="input-label">Description</label>
          <textarea
            className="input input-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
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
            {submitting ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
