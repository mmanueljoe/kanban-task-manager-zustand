import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Header } from "@components/layout/Header";
import { Aside } from "@components/layout/Aside";
import { AddTaskModal } from "@components/modals/AddTaskModal";
import { DeleteBoardModal } from "@components/modals/DeleteBoardModal";
import { EditBoardModal } from "@components/modals/EditBoardModal";
import { ManageCollaboratorsModal } from "@components/modals/ManageCollaboratorsModal";
import { ActivityModal } from "@components/modals/ActivityModal";
import { AddBoardModal } from "@components/modals/AddBoardModal";
import { useCurrentBoard } from "@/hooks/useCurrentBoard";
import { useBoardContents } from "@/hooks/useBoardQueries";
import iconShowSidebar from "@assets/icon-show-sidebar.svg";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const pageTransition = {
  type: "tween" as const,
  ease: "easeInOut" as const,
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
  const { board, boardId } = useCurrentBoard();
  const contents = useBoardContents(boardId ?? "");
  const columns = contents.data?.columns ?? [];
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addBoardOpen, setAddBoardOpen] = useState(false);
  const [editBoardOpen, setEditBoardOpen] = useState(false);
  const [collaboratorsOpen, setCollaboratorsOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [deleteBoardOpen, setDeleteBoardOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  return (
    <div
      className={`app-layout ${sidebarOpen ? "" : "app-sidebar-hidden"}`}
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
          onManageCollaborators={() => setCollaboratorsOpen(true)}
          onViewActivity={() => setActivityOpen(true)}
          onDeleteBoard={() => setDeleteBoardOpen(true)}
          canEditBoard={board != null}
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
        columns={columns}
      />
      {board && (
        <>
          <EditBoardModal
            open={editBoardOpen}
            onClose={() => setEditBoardOpen(false)}
            board={board}
            columns={columns}
          />
          <ManageCollaboratorsModal
            open={collaboratorsOpen}
            onClose={() => setCollaboratorsOpen(false)}
            boardId={board.id}
          />
          <ActivityModal
            open={activityOpen}
            onClose={() => setActivityOpen(false)}
            boardId={board.id}
          />
          <DeleteBoardModal
            open={deleteBoardOpen}
            onClose={() => setDeleteBoardOpen(false)}
            onConfirm={() => void navigate("/", { replace: true })}
            boardName={board.name}
            boardId={boardId}
          />
        </>
      )}
    </div>
  );
}
