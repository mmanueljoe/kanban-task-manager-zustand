import { useState, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from '@components/layout/Header';
import { Aside } from '@components/layout/Aside';
import { AddTaskModal } from '@components/modals/AddTaskModal';
import { EditBoardModal } from '@components/modals/EditBoardModal';
import { DeleteBoardModal } from '@components/modals/DeleteBoardModal';
import { AddBoardModal } from '@components/modals/AddBoardModal';
import { useCurrentBoard } from '@/hooks/useCurrentBoard';
import iconShowSidebar from '@assets/icon-show-sidebar.svg';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -20,
  },
};

const pageTransition = {
  type: 'tween' as const,
  ease: 'easeInOut' as const,
  duration: 0.3,
};

function AnimatedOutlet() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={pageTransition}
        className="app-animated-outlet"
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}

export function Layout() {
  const { board, boardIndex } = useCurrentBoard();
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addBoardOpen, setAddBoardOpen] = useState(false);
  const [editBoardOpen, setEditBoardOpen] = useState(false);
  const [deleteBoardOpen, setDeleteBoardOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const currentBoard = board;

  const columnOptions = useMemo(
    () =>
      currentBoard?.columns.map((c) => ({ value: c.name, label: c.name })) ??
      [],
    [currentBoard?.columns]
  );

  return (
    <div
      className={`app-layout ${sidebarOpen ? '' : 'app-sidebar-hidden'}`}
      data-sidebar-open={sidebarOpen}
    >
      <Aside
        onHideSidebar={() => setSidebarOpen(false)}
        onCreateBoard={() => setAddBoardOpen(true)}
      />
      <button
        type="button"
        className="app-show-sidebar-tab"
        onClick={() => setSidebarOpen(true)}
        aria-label="Show sidebar"
      >
        <img src={iconShowSidebar} alt="" width={16} height={11} />
      </button>
      <div className="app-layout-right">
        <Header
          onAddTask={() => setAddTaskOpen(true)}
          onCreateBoard={() => setAddBoardOpen(true)}
          onEditBoard={() => setEditBoardOpen(true)}
          onDeleteBoard={() => setDeleteBoardOpen(true)}
          canEditBoard={currentBoard != null}
        />
        <main className="app-layout-main">
          <AnimatedOutlet />
        </main>
      </div>
      <AddBoardModal
        open={addBoardOpen}
        onClose={() => setAddBoardOpen(false)}
      />
      <AddTaskModal
        open={addTaskOpen}
        onClose={() => setAddTaskOpen(false)}
        columnOptions={
          columnOptions.length > 0
            ? columnOptions
            : [{ value: 'Todo', label: 'Todo' }]
        }
        boardIndex={boardIndex}
      />
      {currentBoard && (
        <>
          <EditBoardModal
            open={editBoardOpen}
            onClose={() => setEditBoardOpen(false)}
            boardName={currentBoard.name}
            columnNames={currentBoard.columns.map((c) => c.name)}
            boardIndex={boardIndex}
            originalBoard={currentBoard}
          />
          <DeleteBoardModal
            open={deleteBoardOpen}
            onClose={() => setDeleteBoardOpen(false)}
            onConfirm={() => {
              void navigate('/', { replace: true });
            }}
            boardName={currentBoard.name}
            boardIndex={boardIndex}
          />
        </>
      )}
    </div>
  );
}
