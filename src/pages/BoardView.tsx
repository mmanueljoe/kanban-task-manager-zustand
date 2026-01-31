import { Link, useParams } from 'react-router';
import data from '@data/data.json';
import { Button } from '@components/ui/Button';
import type { Board, BoardsData, Task } from '@/types/types';

const boardsData = data as BoardsData;

const COLUMN_DOT_COLORS = [
  '#49C4E5',
  '#635FC7',
  '#67E2AE',
  '#E5A449',
  '#2A3FDB',
];

function subtaskSummary(task: Task): string {
  const total = task.subtasks?.length ?? 0;
  const done = task.subtasks?.filter((s) => s.isCompleted).length ?? 0;
  return `${done} of ${total} substask${total !== 1 ? 's' : ''}`;
}

export function BoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const index = boardId != null ? parseInt(boardId, 10) : NaN;
  const board: Board | null =
    Number.isFinite(index) && index >= 0 && index < boardsData.boards.length
      ? boardsData.boards[index]
      : null;

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
                <li key={task.title} className="app-board-task">
                  <p className="app-board-task-title">{task.title}</p>
                  <p className="app-board-task-subtasks">
                    {subtaskSummary(task)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <button
          type="button"
          className="app-board-new-column"
          aria-label="Add new column"
        >
          + New Column
        </button>
      </div>
    </div>
  );
}
