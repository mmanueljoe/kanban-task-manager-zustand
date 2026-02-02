import { Link, useParams } from 'react-router';
import { useBoards } from '@/hooks/useBoards';
import { Button } from '@components/ui/Button';
import type { Board, Task } from '@/types/types';
import { useCallback, useState } from 'react';
import { TaskDetailsModal } from '@components/modals/TaskDetailsModal';
import { AddColumnModal } from '@components/modals/AddColumnModal';

const COLUMN_DOT_COLORS = [
  '#49C4E5',
  '#635FC7',
  '#67E2AE',
  '#E5A449',
  '#2A3FDB',
];

export function BoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const index = boardId != null ? parseInt(boardId, 10) : NaN;
  const [selectedTask, setSelectedTask] = useState<{
    boardIndex: number | null;
    columnName: string | null;
    taskTitle: string | null;
  } | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const { boards, dispatch } = useBoards();
  const boardIndex =
    Number.isFinite(index) && index >= 0 && index < boards.length
      ? index
      : null;

  const board: Board | null = boardIndex !== null ? boards[boardIndex] : null;

  const subtaskSummary = useCallback((task: Task): string => {
    const total = task.subtasks?.length ?? 0;
    const done = task.subtasks?.filter((s) => s.isCompleted).length ?? 0;
    return `${done} of ${total} substask${total !== 1 ? 's' : ''}`;
  }, []);

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
          <Button variant="primary" size="large">
            + Add New Column
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-main app-main-board">
      <div className="app-board-columns">
        {board.columns.map((col, colIndex) => (
          <section key={col.name} className="app-board-column">
            <div className="app-board-column-header">
              <span
                className="app-board-column-dot"
                style={{
                  backgroundColor:
                    COLUMN_DOT_COLORS[colIndex % COLUMN_DOT_COLORS.length],
                }}
              />
              <h2 className="app-board-column-title">
                {col.name} ({col.tasks.length})
              </h2>
            </div>
            <ul className="app-board-tasks">
              {col.tasks.map((task) => (
                <li
                  key={task.title}
                  className="app-board-task"
                  onClick={() => {
                    if (boardIndex === null) return;
                    setSelectedTask({
                      boardIndex,
                      columnName: col.name,
                      taskTitle: task.title,
                    });
                    setTaskModalOpen(true);
                  }}
                >
                  <p className="app-board-task-title">{task.title}</p>
                  <p className="app-board-task-subtasks">
                    {subtaskSummary(task)}
                  </p>
                  {boardIndex !== null &&
                    colIndex < board.columns.length - 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const fromColumn = col.name;
                          const toColumn = board.columns[colIndex + 1].name;
                          dispatch({
                            type: 'MOVE_TASK',
                            payload: {
                              boardIndex,
                              fromColumn,
                              toColumn,
                              taskTitle: task.title,
                            },
                          });
                        }}
                        className="btn btn-secondary btn-small"
                      >
                        Move to {board.columns[colIndex + 1].name}
                      </button>
                    )}
                </li>
              ))}
            </ul>
          </section>
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
