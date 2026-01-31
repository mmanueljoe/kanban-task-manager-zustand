import { Route, Routes } from 'react-router';
import { Layout } from '@components/layout/Layout';
import { Dashboard } from '@pages/Dashboard';
import { BoardView } from '@pages/BoardView';
import { Login } from '@pages/Login';
import { Admin } from '@pages/Admin';
import { NotFound } from '@pages/NotFound';
import { ProtectedRoute } from '@components/ProtectedRoute';

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
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
