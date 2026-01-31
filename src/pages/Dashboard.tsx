import { Link } from 'react-router';
import data from '@data/data.json';
import { Button } from '@components/ui/Button';
import type { Board, BoardsData } from '@/types/types';

const boards: Board[] = (data as BoardsData).boards;

export function Dashboard() {
  if (boards.length === 0) {
    return (
      <div className="app-main">
        <div className="app-empty-state">
          <h2 className="heading-m">No boards yet</h2>
          <p className="body-l">Create a board to get started.</p>
          <Button variant="primary" size="large" className="app-section-title">
            Create board (placeholder)
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-main">
      <h1 className="heading-xl app-section-title">Dashboard</h1>
      <p className="body-l">Select a board from the sidebar or below.</p>
      <div className="app-stack-4" style={{ marginTop: 24 }}>
        {boards.map((board, index) => (
          <Link
            key={board.name}
            to={`/board/${index}`}
            className="app-board-card"
          >
            <span className="heading-m">{board.name}</span>
            <span
              className="body-l"
              style={{
                display: 'block',
                marginTop: 4,
                color: 'var(--text-muted)',
              }}
            >
              {board.columns.length} columns
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
