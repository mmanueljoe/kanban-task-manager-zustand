import { useState, useCallback, memo } from "react";
import { Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDTO, TaskDTO } from "@kanban/shared";
import { Button } from "@components/ui/Button";
import { AddColumnModal } from "@components/modals/AddColumnModal";
import { TaskDetailsModal } from "@components/modals/TaskDetailsModal";
import { useCurrentBoard } from "@/hooks/useCurrentBoard";
import { useColumns } from "@/hooks/useColumnQueries";
import { useTasks, useMoveTask } from "@/hooks/useTaskQueries";
import { useUi } from "@/hooks/useUi";
import { keys } from "@/lib/keys";
import { positionBetween } from "@/lib/position";
import {
  DndContext,
  type DragEndEvent,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

const COLUMN_DOT_COLORS = [
  "#49C4E5",
  "#635FC7",
  "#67E2AE",
  "#E5A449",
  "#2A3FDB",
];

const DraggableTask = memo(function DraggableTask({
  task,
  columnId,
  onOpen,
}: {
  task: TaskDTO;
  columnId: string;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task, columnId },
  });
  const done = task.subtasks.filter((s) => s.isCompleted).length;
  const total = task.subtasks.length;
  return (
    <li
      ref={setNodeRef}
      className="app-board-task"
      style={{ opacity: isDragging ? 0.5 : 1 }}
      onClick={onOpen}
      {...listeners}
      {...attributes}
    >
      <p className="app-board-task-title">{task.title}</p>
      <p className="app-board-task-subtasks">
        {done} of {total} subtask{total !== 1 ? "s" : ""}
      </p>
    </li>
  );
});

// Each column fetches its own tasks — the per-column query keys that make the
// optimistic move touch exactly two caches.
const DroppableColumn = memo(function DroppableColumn({
  column,
  colorIndex,
  onOpenTask,
}: {
  column: ColumnDTO;
  colorIndex: number;
  onOpenTask: (task: TaskDTO, columnId: string, columnName: string) => void;
}) {
  const { data: tasks = [] } = useTasks(column.id);
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <section
      ref={setNodeRef}
      className="app-board-column"
      style={{
        outline: isOver ? "2px dashed var(--accent, #635FC7)" : undefined,
        outlineOffset: 4,
      }}
    >
      <div className="app-board-column-header">
        <span
          className="app-board-column-dot"
          style={{
            backgroundColor:
              COLUMN_DOT_COLORS[colorIndex % COLUMN_DOT_COLORS.length],
          }}
        />
        <h2 className="app-board-column-title">
          {column.name} ({tasks.length})
        </h2>
      </div>
      <ul className="app-board-tasks">
        {tasks.map((task) => (
          <DraggableTask
            key={task.id}
            task={task}
            columnId={column.id}
            onOpen={() => onOpenTask(task, column.id, column.name)}
          />
        ))}
      </ul>
    </section>
  );
});

export function BoardView() {
  const { boardId, board, isPending } = useCurrentBoard();
  const columnsQuery = useColumns(boardId ?? "");
  const move = useMoveTask();
  const qc = useQueryClient();
  const { showToast } = useUi();
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [selected, setSelected] = useState<{
    taskId: string;
    columnId: string;
    columnName: string;
  } | null>(null);

  const openTask = useCallback(
    (task: TaskDTO, columnId: string, columnName: string) =>
      setSelected({ taskId: task.id, columnId, columnName }),
    []
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const data = active.data.current as
      | { task: TaskDTO; columnId: string }
      | undefined;
    if (!data) return;

    const toColumnId = String(over.id);
    if (data.columnId === toColumnId) return; // same column: no reorder yet

    // Append to the end of the destination column.
    const toTasks = qc.getQueryData<TaskDTO[]>(keys.tasks(toColumnId)) ?? [];
    const lastPos = toTasks.length
      ? Math.max(...toTasks.map((t) => t.position))
      : null;

    move.mutate(
      {
        task: data.task,
        fromColumnId: data.columnId,
        toColumnId,
        position: positionBetween(lastPos, null),
      },
      {
        onError: () =>
          showToast({ type: "error", message: "Couldn't move the task." }),
      }
    );
  };

  if (isPending || (boardId && columnsQuery.isPending)) {
    return <div className="app-main app-main-board">Loading board…</div>;
  }

  if (!board) {
    return (
      <div className="app-main app-main-board">
        <h1 className="heading-xl app-section-title">Board not found</h1>
        <p className="body-l">This board does not exist or was removed.</p>
        <Link to="/">
          <Button variant="primary" size="large">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const columns = columnsQuery.data ?? [];

  if (columns.length === 0) {
    return (
      <div className="app-main app-main-board">
        <div className="app-empty-board">
          <h2 className="heading-l">
            This board is empty. Create a new column to get started.
          </h2>
          <Button
            variant="primary"
            size="large"
            onClick={() => setAddColumnOpen(true)}
          >
            + Add New Column
          </Button>
        </div>
        <AddColumnModal
          open={addColumnOpen}
          onClose={() => setAddColumnOpen(false)}
          boardId={boardId}
        />
      </div>
    );
  }

  return (
    <div className="app-main app-main-board">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="app-board-columns">
          {columns.map((col, i) => (
            <DroppableColumn
              key={col.id}
              column={col}
              colorIndex={i}
              onOpenTask={openTask}
            />
          ))}
          <button
            type="button"
            className="app-board-new-column"
            aria-label="Add new column"
            onClick={() => setAddColumnOpen(true)}
          >
            + New Column
          </button>
        </div>
      </DndContext>

      <AddColumnModal
        open={addColumnOpen}
        onClose={() => setAddColumnOpen(false)}
        boardId={boardId}
      />

      {selected && (
        <TaskDetailsModal
          open
          onClose={() => setSelected(null)}
          taskId={selected.taskId}
          columnId={selected.columnId}
          columnName={selected.columnName}
        />
      )}
    </div>
  );
}
