# Routing and file structure

## How the app is wired

1. **main.tsx** – Renders `<BrowserRouter><App /></BrowserRouter>`. Only the router and the root component.
2. **App.tsx** – Root shell: `<ThemeProvider>` → `<AppContent>` (which uses `useTheme()` and wraps with `<AuthProvider>` → `<RouteProvider />`). The root `<div>` has `data-theme={theme}` so light/dark applies everywhere.
3. **RouteProvider** – Defines all routes. Layout routes (Dashboard, BoardView, Admin) use `<Layout />` as the parent; `/login` and `*` (NotFound) are outside the layout so they have no sidebar/header.
4. **Layout** – Shared shell for main routes: Header (logo + theme toggle) + Aside (board list with active state) + `<Outlet />` (the current page).
5. **Pages** – One component per screen; they use `Link`, `useParams`, `useNavigate`, and hooks (e.g. `useAuth`) but do not define routes.

## File groups

| Folder / file                     | Role                                                                                                                         |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **pages/**                        | One component per route: Dashboard, BoardView, Login, Admin, NotFound. Handle empty states and data loading inside the page. |
| **components/layout/**            | Layout, Header, Aside. Shared chrome; Header uses ThemeContext; Aside uses `data.json` and `useLocation()` for active link.  |
| **components/ui/**                | Design system atoms: Button, Input, Checkbox, Dropdown.                                                                      |
| **components/ProtectedRoute.tsx** | Wraps protected content; redirects to `/login` if not logged in.                                                             |
| **routes/RouteProvider.tsx**      | Single place that declares all routes and which component/layout each uses.                                                  |
| **context/**                      | AuthContext (auth state + persistence), ThemeContext (light/dark). Both export a Provider and a hook (useAuth, useTheme).    |
| **hooks/useAuth.ts**              | Re-exports `useAuth` from AuthContext so the rest of the app imports from `@hooks/useAuth`.                                  |
| **utils/localStorage.ts**         | getAuth / setAuth for persisting login state.                                                                                |
| **data/data.json**                | Static boards (name, columns, tasks). Dashboard and BoardView read from it; board “id” in the URL is the array index.        |

## Routes

- `/` – Dashboard (list of boards; empty state when none).
- `/board/:boardId` – BoardView (board by index; “Board not found” if invalid).
- `/login` – Login (mock login; then redirect to `/`).
- `/admin` – Admin (protected; logout button).
- `*` – NotFound (“Go to Dashboard” link).

## Auth flow

- **AuthProvider** wraps the app (inside App). On first render it initializes state from `getAuth()` (no effect; lazy initial state).
- **login(user)** – Updates state and calls `setAuth()` so refresh keeps the user.
- **logout()** – Clears state and `setAuth({ isLoggedIn: false, user: null })`.
- **ProtectedRoute** – Uses `useAuth()`; if `!isLoggedIn` renders `<Navigate to="/login" />`; otherwise renders children. Used for `/admin`.

## Responsive layout

- **index.css** – `.app-layout` is column on small screens (Aside above main), row on `md:` (Aside left, main right). `.app-aside-link.active` highlights the current board. Board view uses `.app-board-columns` (horizontal scroll) and `.app-board-task` for cards.
