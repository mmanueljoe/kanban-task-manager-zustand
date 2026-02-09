import { Link } from 'react-router';
import { useBoards } from '@/hooks/useBoards';
import { useCurrentBoard } from '@/hooks/useCurrentBoard';
import { Button } from '@components/ui/Button';
import type { Task } from '@/types/types';
import { useCallback, useState, useMemo, memo } from 'react';
import { TaskDetailsModal } from '@components/modals/TaskDetailsModal';
import { AddColumnModal } from '@components/modals/AddColumnModal';
import {
  DndContext,
  type DragEndEvent,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

const COLUMN_DOT_COLORS = [
  '#49C4E5',
  '#635FC7',
  '#67E2AE',
  '#E5A449',
  '#2A3FDB',
];

function encodeTaskId(
  boardIndex: number,
  columnName: string,
  taskTitle: string
) {
  return `${boardIndex}::${columnName}::${taskTitle}`;
}
function decodeTaskId(
  id: string
): { boardIndex: number; columnName: string; taskTitle: string } | null {
  const parts = id.split('::');
  if (parts.length < 3) return null;
  return {
    boardIndex: parseInt(parts[0], 10),
    columnName: parts[1],
    taskTitle: parts.slice(2).join('::'),
  };
}
function encodeColumnId(boardIndex: number, columnName: string) {
  return `${boardIndex}::${columnName}`;
}
function decodeColumnId(
  id: string
): { boardIndex: number; columnName: string } | null {
  const parts = id.split('::');
  if (parts.length < 2) return null;
  return { boardIndex: parseInt(parts[0], 10), columnName: parts[1] };
}

const DraggableTask = memo(function DraggableTask({
  boardIndex,
  columnName,
  task,
  subtaskSummary,
  onOpenDetails,
}: {
  boardIndex: number;
  columnName: string;
  task: Task;
  subtaskSummary: (t: Task) => string;
  onOpenDetails: () => void;
}) {
  const id = encodeTaskId(boardIndex, columnName, task.title);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
  });
  return (
    <li
      ref={setNodeRef}
      className="app-board-task"
      style={{ opacity: isDragging ? 0.5 : 1 }}
      onClick={onOpenDetails}
      {...listeners}
      {...attributes}
    >
      <p className="app-board-task-title">{task.title}</p>
      <p className="app-board-task-subtasks">{subtaskSummary(task)}</p>
    </li>
  );
});

const DroppableColumn = memo(function DroppableColumn({
  boardIndex,
  columnName,
  columnIndex,
  taskCount,
  children,
}: {
  boardIndex: number;
  columnName: string;
  columnIndex: number;
  taskCount: number;
  children: React.ReactNode;
}) {
  const id = encodeColumnId(boardIndex, columnName);
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <section
      ref={setNodeRef}
      className="app-board-column"
      style={{
        outline: isOver ? '2px dashed var(--accent, #635FC7)' : undefined,
        outlineOffset: 4,
      }}
    >
      <div className="app-board-column-header">
        <span
          className="app-board-column-dot"
          style={{
            backgroundColor:
              COLUMN_DOT_COLORS[columnIndex % COLUMN_DOT_COLORS.length],
          }}
        />
        <h2 className="app-board-column-title">
          {columnName} ({taskCount})
        </h2>
      </div>
      <ul className="app-board-tasks">{children}</ul>
    </section>
  );
});

export function BoardView() {
  const [selectedTask, setSelectedTask] = useState<{
    boardIndex: number | null;
    columnName: string | null;
    taskTitle: string | null;
  } | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const { dispatch } = useBoards();
  const { board, boardIndex } = useCurrentBoard();

  const subtaskSummary = useCallback((task: Task): string => {
    const total = task.subtasks?.length ?? 0;
    const done = task.subtasks?.filter((s) => s.isCompleted).length ?? 0;
    return `${done} of ${total} substask${total !== 1 ? 's' : ''}`;
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (boardIndex === null || !over) return;
      const taskData = decodeTaskId(String(active.id));
      const columnData = decodeColumnId(String(over.id));
      if (
        !taskData ||
        !columnData ||
        taskData.boardIndex !== boardIndex ||
        columnData.boardIndex !== boardIndex
      )
        return;
      const { columnName: fromColumn, taskTitle } = taskData;
      const toColumn = columnData.columnName;
      if (fromColumn === toColumn) return;
      dispatch({
        type: 'MOVE_TASK',
        payload: { boardIndex, fromColumn, toColumn, taskTitle },
      });
    },
    [boardIndex, dispatch]
  );

  const taskCallbacks = useMemo(() => {
    if (!board || !board.columns) {
      return new Map<string, () => void>();
    }
    const callbacks = new Map<string, () => void>();
    board.columns.forEach((col) => {
      col.tasks.forEach((task) => {
        const key = `${col.name}::${task.title}`;
        callbacks.set(key, () => {
          setSelectedTask({
            boardIndex,
            columnName: col.name,
            taskTitle: task.title,
          });
          setTaskModalOpen(true);
        });
      });
    });
    return callbacks;
  }, [board, boardIndex]);

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

  if (board.columns.length === 0) {
    return (
      <div className="app-main app-main-board">
        <div className="app-empty-board">
          <h2 className="heading-l">
            This board is empty. Create a new column to get started.
          </h2>
          <p className="body-l" style={{ marginBottom: 24 }}>
            Create a new column to get started.
          </p>
          <Button
            variant="primary"
            size="large"
            onClick={() => setAddColumnOpen(true)}
          >
            + Add New Column
          </Button>
        </div>
        {addColumnOpen && (
          <AddColumnModal
            open={addColumnOpen}
            onClose={() => setAddColumnOpen(false)}
            boardIndex={boardIndex}
          />
        )}
      </div>
    );
  }

  return (
    <div className="app-main app-main-board">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="app-board-columns">
          {board.columns.map((col, colIndex) => (
            <DroppableColumn
              key={col.name}
              boardIndex={boardIndex!}
              columnName={col.name}
              columnIndex={colIndex}
              taskCount={col.tasks.length}
            >
              {col.tasks.map((task) => {
                const callbackKey = `${col.name}::${task.title}`;
                const onOpenDetails = taskCallbacks.get(callbackKey);
                return (
                  <DraggableTask
                    key={task.title}
                    boardIndex={boardIndex!}
                    columnName={col.name}
                    task={task}
                    subtaskSummary={subtaskSummary}
                    onOpenDetails={onOpenDetails || (() => {})}
                  />
                );
              })}
            </DroppableColumn>
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

      {selectedTask && (
        <TaskDetailsModal
          open={taskModalOpen}
          onClose={() => setTaskModalOpen(false)}
          boardIndex={selectedTask.boardIndex}
          columnName={selectedTask.columnName}
          taskTitle={selectedTask.taskTitle}
        />
      )}
      {addColumnOpen && (
        <AddColumnModal
          open={addColumnOpen}
          onClose={() => setAddColumnOpen(false)}
          boardIndex={boardIndex}
        />
      )}
    </div>
  );
}
