import { useState, useCallback, memo } from "react";
import { Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { BoardContentsDTO, ColumnDTO, TaskDTO } from "@kanban/shared";
import { Button } from "@components/ui/Button";
import { AddColumnModal } from "@components/modals/AddColumnModal";
import { TaskDetailsModal } from "@components/modals/TaskDetailsModal";
import { useCurrentBoard } from "@/hooks/useCurrentBoard";
import { useBoardContents } from "@/hooks/useBoardQueries";
import { useTasks } from "@/hooks/useTaskQueries";
import { api } from "@/lib/api";
import { keys } from "@/lib/keys";
import { positionBetween } from "@/lib/position";
import { useUi } from "@/hooks/useUi";
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const COLUMN_DOT_COLORS = [
  "#49C4E5",
  "#635FC7",
  "#67E2AE",
  "#E5A449",
  "#2A3FDB",
];

const SortableTask = memo(function SortableTask({
  task,
  columnId,
  onOpen,
}: {
  task: TaskDTO;
  columnId: string;
  onOpen: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: "task", columnId } });
  const done = task.subtasks.filter((s) => s.isCompleted).length;
  const total = task.subtasks.length;

  return (
    <li
      ref={setNodeRef}
      className="app-board-task"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <button type="button" className="app-board-task-open" onClick={onOpen}>
        <span className="app-board-task-title">{task.title}</span>
        <span className="app-board-task-subtasks">
          {done} of {total} subtask{total !== 1 ? "s" : ""}
        </span>
      </button>
      <button
        type="button"
        ref={setActivatorNodeRef}
        className="app-board-task-handle"
        aria-label={`Drag ${task.title}`}
        {...attributes}
        {...listeners}
      >
        <span aria-hidden="true">⠿</span>
      </button>
    </li>
  );
});

const DroppableColumn = memo(function DroppableColumn({
  column,
  colorIndex,
  index,
  columnCount,
  onOpenTask,
  onMoveColumn,
}: {
  column: ColumnDTO;
  colorIndex: number;
  index: number;
  columnCount: number;
  onOpenTask: (task: TaskDTO, columnId: string, columnName: string) => void;
  onMoveColumn: (columnId: string, direction: -1 | 1) => void;
}) {
  const { data: tasks = [] } = useTasks(column.id);
  // The task list is the drop target — id is the column, so an empty column
  // still accepts drops.
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", columnId: column.id },
  });
  return (
    <section
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
        {columnCount > 1 && (
          <div className="app-board-column-actions">
            <button
              type="button"
              className="app-board-column-move"
              aria-label={`Move ${column.name} left`}
              disabled={index === 0}
              onClick={() => onMoveColumn(column.id, -1)}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              className="app-board-column-move"
              aria-label={`Move ${column.name} right`}
              disabled={index === columnCount - 1}
              onClick={() => onMoveColumn(column.id, 1)}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        )}
      </div>
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul ref={setNodeRef} className="app-board-tasks">
          {tasks.map((task) => (
            <SortableTask
              key={task.id}
              task={task}
              columnId={column.id}
              onOpen={() => onOpenTask(task, column.id, column.name)}
            />
          ))}
        </ul>
      </SortableContext>
    </section>
  );
});

export function BoardView() {
  const { boardId, board, isPending } = useCurrentBoard();
  const contents = useBoardContents(boardId ?? "");
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

  // Reorder a column one step left (-1) or right (+1). Same shape as the task
  // move: optimistically reorder the cache, PATCH the new position, then let the
  // server's answer settle in — on failure we refetch to roll back and toast.
  const moveColumn = useCallback(
    (columnId: string, direction: -1 | 1) => {
      const contentsKey = [...keys.board(boardId ?? ""), "full"];
      const current = qc.getQueryData<BoardContentsDTO>(contentsKey);
      if (!current) return;

      const cols = current.columns;
      const from = cols.findIndex((c) => c.id === columnId);
      const to = from + direction;
      if (from === -1 || to < 0 || to >= cols.length) return;

      const reordered = arrayMove(cols, from, to);
      const before = to > 0 ? reordered[to - 1].position : null;
      const after =
        to < reordered.length - 1 ? reordered[to + 1].position : null;
      const position = positionBetween(before, after);
      const withPosition = reordered.map((c) =>
        c.id === columnId ? { ...c, position } : c
      );

      qc.setQueryData<BoardContentsDTO>(contentsKey, {
        ...current,
        columns: withPosition,
      });
      qc.setQueryData<ColumnDTO[]>(keys.columns(boardId ?? ""), withPosition);

      api
        .patch(`/columns/${columnId}/position`, { position })
        .then(() => {
          void qc.invalidateQueries({ queryKey: contentsKey });
        })
        .catch(() => {
          showToast({ type: "error", message: "Couldn't move the column." });
          void qc.invalidateQueries({ queryKey: contentsKey });
        });
    },
    [boardId, qc, showToast]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Space lifts/drops a card; Enter is left free to open task details.
      keyboardCodes: {
        start: ["Space"],
        cancel: ["Escape"],
        end: ["Space"],
      },
    })
  );

  const getList = (columnId: string) =>
    qc.getQueryData<TaskDTO[]>(keys.tasks(columnId)) ?? [];
  const columnOf = (over: DragOverEvent["over"]) =>
    (over?.data.current?.columnId as string | undefined) ??
    (over?.id as string | undefined);

  // Live cross-column preview: as a card is dragged over another column, move it
  // between the per-column caches so it visually enters that column.
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const fromCol = active.data.current?.columnId as string | undefined;
    const toCol = columnOf(over);
    if (!fromCol || !toCol || fromCol === toCol) return;

    const fromList = getList(fromCol);
    const moved = fromList.find((t) => t.id === active.id);
    if (!moved) return;

    qc.setQueryData<TaskDTO[]>(
      keys.tasks(fromCol),
      fromList.filter((t) => t.id !== active.id)
    );
    const toList = getList(toCol);
    const overIndex =
      over.data.current?.type === "task"
        ? toList.findIndex((t) => t.id === over.id)
        : toList.length;
    const next = [...toList];
    next.splice(overIndex < 0 ? next.length : overIndex, 0, {
      ...moved,
      columnId: toCol,
    });
    qc.setQueryData(keys.tasks(toCol), next);
    // Remember the new column so subsequent events resolve correctly.
    if (active.data.current) active.data.current.columnId = toCol;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const fromCol = active.data.current?.columnId as string | undefined;
    const toCol = columnOf(over) ?? fromCol;
    if (!fromCol || !toCol) return;

    const list = getList(toCol);
    const oldIndex = list.findIndex((t) => t.id === active.id);
    if (oldIndex === -1) return;
    let newIndex =
      over.data.current?.type === "task"
        ? list.findIndex((t) => t.id === over.id)
        : list.length - 1;
    if (newIndex === -1) newIndex = list.length - 1;

    const reordered = arrayMove(list, oldIndex, newIndex);
    qc.setQueryData(keys.tasks(toCol), reordered);

    const idx = reordered.findIndex((t) => t.id === active.id);
    const before = idx > 0 ? reordered[idx - 1].position : null;
    const after =
      idx < reordered.length - 1 ? reordered[idx + 1].position : null;
    const position = positionBetween(before, after);

    api
      .patch(`/tasks/${active.id}/move`, { toColumnId: toCol, position })
      .then(() => {
        void qc.invalidateQueries({ queryKey: keys.tasks(toCol) });
        if (fromCol !== toCol) {
          void qc.invalidateQueries({ queryKey: keys.tasks(fromCol) });
        }
      })
      .catch(() => {
        showToast({ type: "error", message: "Couldn't move the task." });
        void qc.invalidateQueries({ queryKey: keys.tasks(toCol) });
        void qc.invalidateQueries({ queryKey: keys.tasks(fromCol) });
      });
  };

  if (isPending || (boardId && contents.isPending)) {
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

  const columns = contents.data?.columns ?? [];

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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="app-board-columns">
          {columns.map((col, i) => (
            <DroppableColumn
              key={col.id}
              column={col}
              colorIndex={i}
              index={i}
              columnCount={columns.length}
              onOpenTask={openTask}
              onMoveColumn={moveColumn}
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
          columns={columns}
        />
      )}
    </div>
  );
}
