# Kanban Task Management Web App

This extends the kanban task manager to include real board and column management, context-based state, and a bunch of small UX touches, all built with **React**, **TypeScript**, and **Vite**. The project still focuses on **routing and navigation**, **handling incorrect routes gracefully**, and **implementing protected routes**, but now it feels much closer to a real app.

## Project focus

### Kanban boards and state

- **Boards, columns, and tasks**: The app now has real Kanban data instead of a static demo. Boards contain columns, columns contain tasks, and everything is wired through a central `BoardsContext` + `boardsReducer`.
- **Create and edit flows**: You can add/edit boards, columns, and tasks via modals (`AddBoard`, `EditBoard`, `AddColumn`, `AddTask`, `EditTask`, `TaskDetails`). State updates in one place and the UI reflects it everywhere.
- **Task details and subtasks**: A dedicated task details modal lets you see the full description, move tasks between columns, and toggle subtasks.

### UI / UX layer

- **UI state management**: A `UiContext` keeps track of which modal is open, which board/task is selected, and handles global UI bits like the loading overlay and toast notifications.
- **Shared layout and theming**: The main layout (header + sidebar) is shared across pages, with a theme toggle driven by `ThemeContext` so light/dark mode feels consistent.

### Routing and auth

- **Central route config**: Routes live in `RouteProvider`, using nested routes so the main layout wraps dashboard, board view, and admin while login/404 stay outside.
- **Graceful error routes**: Unknown URLs go to a friendly 404 page, and invalid board IDs are handled inside `BoardView` with a “Board not found” message and a way back.
- **Protected routes**: `ProtectedRoute` guards the board and admin views using `AuthContext`; unauthenticated users are redirected to `/login`.

## Screenshots

Run `yarn dev` and capture the following screens. Save images into `docs/screenshots/` (see [docs/screenshots/README.txt](docs/screenshots/README.txt) for the list).

### Dashboard

![Dashboard](docs/screenshots/dashboard.png)

_Route: `/` — List of boards and entry to the app._

### Board view

![Board view](docs/screenshots/board-view.png)

_Route: `/board/0` — Kanban board with columns and tasks (protected)._

### Login

![Login](docs/screenshots/login.png)

_Route: `/login` — Mock login; after submit, redirects to Dashboard._

### Admin (protected)

![Admin](docs/screenshots/admin.png)

_Route: `/admin` — Protected page; redirects to Login when not logged in._

### 404 – Page not found

![Not found](docs/screenshots/not-found.png)

_Route: any unknown path (e.g. `/unknown-path`) — Catch-all route._

### Board not found

![Board not found](docs/screenshots/board-not-found.png)

_Route: e.g. `/board/999` or `/board/abc` — Invalid board ID handled inside BoardView._

## What I built

This iteration turned the original routing-focused demo into a more complete Kanban task manager. I added proper board and column management with context-based state, built out modals for creating and editing tasks/columns/boards, and wired everything up to feel like a real app instead of a static example.

Under the hood, I introduced `BoardsContext` and `UiContext` so the board data and UI state (modals, toasts, loading overlays) are managed in a single place and stay in sync across pages. I also refined the layout, improved the theme/auth contexts, and tightened up types to make the codebase easier to extend.

## Lessons learnt

- **Centralized routes**: Defining all routes in one component ([RouteProvider](src/routes/RouteProvider.tsx)) keeps layout and auth decisions in one place and makes the app structure easy to follow.
- **Protected routes as a wrapper**: Using a `<ProtectedRoute>` wrapper keeps the route config declarative: wrap the component that needs auth; no extra logic inside the page.
- **Two kinds of “wrong” routes**: A catch-all `*` route handles unknown paths; validating params inside a page (e.g. board ID in BoardView) handles invalid resource IDs. Together they cover both cases without leaving users on a broken screen.
- **Auth context + persistence**: [AuthContext](src/context/AuthContext.tsx) holds login state; [localStorage](src/utils/localStorage.ts) persists it so redirects and “logged in” state survive refresh.

## Concepts to improve

- **Real authentication**: Replace mock login with a backend (e.g. JWT, session cookies) and proper sign-in/sign-out flows.
- **Role-based access**: Extend protected routes with roles (e.g. admin-only routes) and permission checks.
- **Route-level code splitting**: Use `React.lazy` and `Suspense` per route to reduce initial bundle size.
- **Error boundaries**: Add route-level or app-level error boundaries so runtime errors show a fallback UI instead of a blank screen.
- **Accessibility**: Improve focus management, ARIA labels, and keyboard navigation, especially in modals and dynamic content.
- **Testing**: Add tests for routing (e.g. correct component per URL), protected route redirect, and NotFound/board-not-found behavior.

## Areas to improve

- **Loading and skeletons**: Add loading states or skeleton UIs for boards and tasks instead of rendering raw data immediately.
- **Data source**: Replace static [data.json](src/data/data.json) with an API (REST or GraphQL) and handle loading/error states.
- **Forms**: Add validation and clear error messages on login and other forms.
- **Responsive and polish**: Refine layout and interactions on small screens and touch devices.
- **SEO and meta**: Set per-route meta tags (e.g. title, description) for better sharing and SEO.
- **CI**: Run lint and tests (e.g. Vitest, React Testing Library) in CI on push or PR.

## Quick start

```bash
# Install dependencies
yarn

# Start dev server
yarn dev
```

See [docs/SETUP-GUIDE.md](docs/SETUP-GUIDE.md) for more setup details. For routing and file structure, see [docs/ROUTING-AND-STRUCTURE.md](docs/ROUTING-AND-STRUCTURE.md).

## Expanding the ESLint configuration

This project uses the default Vite + React + TypeScript ESLint setup. For production apps, you may want to enable type-aware lint rules or extra React plugins. See [Vite’s ESLint documentation](https://vite.dev/guide/features.html#eslint) and the [TypeScript ESLint docs](https://typescript-eslint.io/) for options.
