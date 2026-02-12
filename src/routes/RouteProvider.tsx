import { Route, Routes, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { Layout } from '@components/layout/Layout';
import { Login } from '@pages/Login';
import { NotFound } from '@pages/NotFound';
import { Dashboard } from '@pages/Dashboard';
import { BoardView } from '@pages/BoardView';
import { Admin } from '@pages/Admin';
import { ProtectedRoute } from '@components/ProtectedRoute';

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

function AnimatedPage({ children }: { children: React.ReactNode }) {
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
        className="app-animated-page"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function RouteProvider() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route
          path="board/:boardId"
          element={
            <ProtectedRoute>
              <BoardView />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route
        path="/login"
        element={
          <AnimatedPage>
            <Login />
          </AnimatedPage>
        }
      />
      <Route
        path="*"
        element={
          <AnimatedPage>
            <NotFound />
          </AnimatedPage>
        }
      />
    </Routes>
  );
}
