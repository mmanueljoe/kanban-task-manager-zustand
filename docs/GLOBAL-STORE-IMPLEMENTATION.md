# Global Store Implementation Guide (Zustand)

This document walks you through refactoring the Kanban app from React Context + `useReducer` to a central Zustand store. It explains **what** to do, **why** each step matters, and **how** it fits React best practices. Use it as both a checklist and a learning reference.

**New to Zustand?** Start with [Section 0: Plain-English concepts](#0-plain-english-concepts-start-here). It explains what the store is, how reading and updating work, and what “connect to the store” means in practice.

---

## Table of contents

0. [Plain-English concepts (start here)](#0-plain-english-concepts-start-here)
1. [Concepts you need](#1-concepts-you-need)
2. [Setup: Install and create the store](#2-setup-install-and-create-the-store)
3. [Define state and actions (reuse your reducer)](#3-define-state-and-actions-reuse-your-reducer)
4. [Persistence: Load and save to localStorage](#4-persistence-load-and-save-to-localstorage)
5. [Wire the app: Remove Context, connect components](#5-wire-the-app-remove-context-connect-components)
6. [Optimize: Selectors and minimal re-renders](#6-optimize-selectors-and-minimal-re-renders)
7. [Optional: Theme in global state](#7-optional-theme-in-global-state)
8. [Optional: Drag-and-drop for moving tasks](#8-optional-drag-and-drop-for-moving-tasks)
9. [Checklist and file map](#9-checklist-and-file-map)

---

## 0. Plain-English concepts (start here)

This section explains Zustand in everyday language. No jargon first—just what the store is and what happens when you use it.

### What is the store?

Think of the store as **one shared box** that sits outside your React tree. Inside the box you put your Kanban data: the list of boards, and each board’s columns and tasks. That’s it. One place, one copy of the data. That’s what “single source of truth” means: the real list of boards lives only in this box, not in multiple components.

- **Before (Context):** The “box” was React Context. A Provider component held the data and passed it down. Any component that wanted the data had to live under that Provider and use `useContext`.
- **After (Zustand):** The “box” is the Zustand store. There is no Provider. The data lives in a plain JavaScript object. Any component can open the box and read or update the data by using the store (via a hook).

So when the doc says “the store contains boards, columns, and tasks,” it means: the store is that one box, and inside it you keep `boards` (and each board has columns, each column has tasks). Nothing else in the app should keep its own copy of that list.

### What does “reading from the store” mean?

“Reading” means: **your component asks the store “what are the boards right now?”** and uses that value to render.

In code you do that with a **hook** that Zustand gives you. You pass a function that says “give me the part I care about.” For example: “give me the boards.” The store runs that function, gets the current `boards` from the box, and returns it to your component. Your component then uses that value (e.g. to show the list on screen).

Important: **Zustand remembers which component asked for which part.** When that part of the store changes later, Zustand tells React “this component’s data changed,” and React re-renders that component with the new value. So the UI stays in sync with the store without you writing extra code.

In short: **read from the store** = use a hook that returns a piece of the store’s data; when that piece changes, your component re-renders with the new data.

### What does “updating the store” mean?

“Updating” means: **something in your app (e.g. a button click) says “add a task” or “delete a board.”** That message is an **action**. The store receives the action, runs your **reducer** (a function that knows how to compute the new state from the old state and the action), and then replaces the old state in the box with the new state.

So:

1. User does something (e.g. clicks “Add task”).
2. Your component calls `dispatch({ type: 'ADD_TASK', payload: { ... } })`.
3. The store’s `dispatch` runs your `boardsReducer` with the current state and that action.
4. The reducer returns the new state (same boards, but one column now has one more task).
5. The store saves that new state in the box (so `boards` is now the new array).
6. Every component that is “reading” `boards` (or a part of it) from the store gets notified and re-renders. The UI updates.

So: **update the store** = call `dispatch` with an action; the store runs the reducer, puts the new state in the box, and all components that read from the store get the new data and re-render.

### How do I “connect” a component to the store?

“Connect” here just means:

1. **Reading:** The component gets its data from the store (via a hook) instead of from props or from React Context. So instead of `useBoards()` reading from Context, you change `useBoards()` so it reads from the Zustand store. Any component that already uses `useBoards()` then automatically gets data from the store.
2. **Updating:** When the user does something that should change the data (add task, move task, etc.), the component calls `dispatch(action)` instead of setting local state or calling some other function. The store is the only thing that changes the boards.

So “connect BoardView to the store” means: BoardView uses a hook that reads `boards` (and maybe `dispatch`) from the store, and when the user does something, BoardView calls `dispatch` with the right action. No prop drilling: BoardView doesn’t get `boards` from its parent; it gets them directly from the store.

### What is a “selector”?

A **selector** is the function you pass when you read from the store. It “selects” a piece of the state. Example: `(state) => state.boards` means “give me the boards.” Another example: `(state) => state.boards.length` means “give me only the number of boards.”

Why does it matter? Zustand re-renders your component only when the **value your selector returns** changes. If you select `state.boards`, then whenever `boards` is a new array reference (after any update), your component re-renders. If you select `state.boards.length`, your component re-renders only when the length changes. So “use a selector” means: pick the smallest piece of data you need, so you get minimal re-renders.

### One complete example: “Add task” from start to finish

1. User fills the “Add task” form and clicks Submit.
2. The modal component (e.g. AddTaskModal) has a handler. It calls `dispatch({ type: 'ADD_TASK', payload: { boardIndex, columnName, task: newTask } })`.
3. The store’s `dispatch` runs: `set((state) => boardsReducer(state, action))`. So it takes the current state from the box, runs your reducer with the ADD_TASK action, gets back the new state (with the new task in the right column).
4. The store saves that new state (e.g. replaces `boards` in the box with the new array).
5. Components that read `boards` from the store (e.g. BoardView, the sidebar, the modal if it reads from the store) get the new value and re-render. The new task appears on the board and in the UI.
6. No parent component had to pass data down; the modal and the board both get data from the same store.

That’s the whole flow. **Store = one box. Read = use a hook with a selector. Update = dispatch an action. Connect = use that hook and dispatch in your components.**

### What you already have vs what you still do

You already created the store in `src/store/useStore.ts`. It has:

- **State:** `boards` (initially an empty array).
- **Update function:** `dispatch`. When you call `dispatch(action)`, the store runs `boardsReducer` and puts the new state in the box.

What’s left:

1. **Load initial data** into the box (from localStorage or `data.json`) so the store isn’t empty on first load.
2. **Save the box to localStorage** when `boards` changes (persistence), so data survives refresh.
3. **Change your app** so components stop getting data from BoardsContext and instead get it from this store (by refactoring `useBoards` to read from the store and removing the BoardsProvider).

Once you’ve read this section, the rest of the doc (persistence, wiring, optional theme and drag-and-drop) is “how to do those three things” in code. When the doc says “read from the store,” you now know that means “use the store hook with a selector.” When it says “dispatch updates,” you know that means “call `dispatch(action)` so the reducer runs and the box updates.”

---

## 1. Concepts you need

### Why a global store?

Right now, boards state lives in **React Context** (`BoardsContext`) and is updated via a **reducer** (`boardsReducer`). That works, but:

- **Provider nesting:** The app wraps the tree in `ThemeProvider` → `UiProvider` → `AuthProvider` → `BoardsProvider`. Any component that needs boards must live under `BoardsProvider`. A store has no Provider; any component can read from it.
- **Single source of truth:** The lab asks that “all updates go through” one place. A Zustand store is that place: one object in memory, one set of actions. No duplicate state in Context + local state.
- **Easier testing and DevTools:** You can inspect and replay actions in Redux DevTools (Zustand can plug into it). The same actions your UI dispatches can be used in tests.

**Takeaway:** The store holds `boards` (and optionally `theme`). Components **read** from the store and **dispatch actions** to change it. They do not own a copy of the data.

### Why keep the reducer?

You already have `boardsReducer` and `BoardsAction` types. They are **pure**: `(state, action) => newState`, no side effects. That gives you:

- **Predictable updates:** Same action + same state always yields the same new state.
- **Immutable updates:** The reducer returns new objects/arrays (spread, `map`, `filter`), so React can detect changes and re-render only what’s needed.
- **Clear audit trail:** Actions describe _what_ happened (`ADD_TASK`, `MOVE_TASK`), not _how_. That matches the lab’s “minimal and focused” actions.

Zustand does not require a reducer; you could write a store with mutable updates. Using your existing reducer keeps the same mental model and satisfies “single source of truth” and “actions describe what happens.”

### Separation of concerns

| Concern                            | Where it lives                 | Reason                                                                                                |
| ---------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| **State shape and actions**        | `src/types/types.ts`           | Types are shared by store, reducer, and components. One place to change the “contract.”               |
| **Update logic**                   | `src/utils/boardsReducer.ts`   | Pure function; no React, no store API. Easy to test and reuse.                                        |
| **Store creation and persistence** | `src/store/`                   | Store is the only place that knows about Zustand and (optionally) `persist` middleware.               |
| **Reading from the store**         | Custom hooks, e.g. `useBoards` | Components use hooks, not raw `useStore`. Hooks can hide selector details and keep components stable. |

This keeps the store thin: it holds state, runs the reducer, and (optionally) persists. Business logic stays in the reducer; components stay in the UI layer.

---

## 2. Setup: Install and create the store

### Step 2.1: Install Zustand

```bash
yarn add zustand
```

**Why:** Zustand is the library that provides `create` (store factory) and the React hook to subscribe to the store. No Provider is required.

### Step 2.2: Create the store file

Create `src/store/useStore.ts` (or `src/store/boardsStore.ts`). We will build it step by step in the next sections; for now, the goal is to have a **single store** that:

- Holds `boards: Board[]`.
- Exposes a way to run your existing reducer (so all updates go through it).
- Can be read and updated from any component.

**Why one file under `src/store/`:** Keeps all store-related code (state shape, reducer wiring, persistence) in one place. If you add theme later, you can add it in the same store or a separate slice; one file keeps the “single source of truth” easy to find.

---

## 3. Define state and actions (reuse your reducer)

### Step 3.1: State shape

Use your existing types from `src/types/types.ts`:

- `BoardsState`: `{ boards: Board[] }`
- `BoardsAction`: union of all action types (`ADD_BOARD`, `ADD_TASK`, `MOVE_TASK`, etc.)
- `Board`, `Column`, `Task`: already defined there.

The store state should match `BoardsState` so the reducer can be reused without adaptation.

### Step 3.2: Use the reducer inside the store

Zustand’s `create` accepts a function that receives `set` (and optionally `get`). To keep using your reducer:

1. **Initial state:** Either `{ boards: [] }` or, if you hydrate synchronously (see [Section 4](#4-persistence-load-and-save-to-localstorage)), the result of `getBoards()` or `data.json`.
2. **Updating:** When the app dispatches an action, call `set` with the result of `boardsReducer(get(), action)`. That way every change goes through the reducer (immutable, predictable).

Example pattern (you will adapt this to your actual `create` + persist setup):

```ts
import { create } from "zustand";
import type { BoardsState, BoardsAction } from "@/types/types";
import { boardsReducer } from "@/utils/boardsReducer";

const initialState: BoardsState = { boards: [] };

export const useStore = create<
  BoardsState & { dispatch: (action: BoardsAction) => void }
>((set, get) => ({
  ...initialState,
  dispatch: (action: BoardsAction) => {
    set((state) => boardsReducer(state, action));
  },
}));
```

**Why this shape:** Components can keep calling `dispatch({ type: 'ADD_TASK', payload: { ... } })` as they do today. The store is the only place that knows about Zustand; the rest of the app still thinks in “actions.”

**Why `set((state) => boardsReducer(state, action))`:** Zustand’s `set` can accept a function `(state) => newState`. That matches the reducer signature and avoids reading stale state.

### Step 3.3: Expose boards and dispatch

Components need:

- `boards` — to read the list and current board/columns/tasks.
- `dispatch` — to send actions.

So the store type is effectively `BoardsState & { dispatch: (action: BoardsAction) => void }`. Your hook `useBoards()` will return `{ boards, dispatch }` from this store so that existing components need minimal changes.

---

## 4. Persistence: Load and save to localStorage

The lab requires that Kanban data survives a refresh. You have two options.

### Option A: Zustand `persist` middleware (recommended)

Use `persist` from `zustand/middleware` so the store automatically:

- **Rehydrates** on load: reads from `localStorage` and merges into the store.
- **Persists** on change: when `boards` (or selected slice) changes, it writes to `localStorage`.

Steps:

1. Wrap your store with `persist`, and configure:
   - `name`: e.g. `'kanban-boards'` (localStorage key).
   - `storage`: `localStorage` (from the browser).
   - `partialize`: include only `boards` (and optionally `theme` later). Exclude `dispatch` so you don’t persist functions.

2. **Hydration:** `persist` runs after the first render. Your initial state in `create` can still be `{ boards: [] }`. When the persisted state is loaded, Zustand replaces the state (or merges, depending on config). To avoid a flash of “no boards,” you can:
   - Show a loading overlay until `persist` has finished rehydrating (Zustand exposes `onRehydrateStorage` or you can check a “rehydrated” flag), or
   - Use the same short delay you use today in `BoardsContext` for the loading overlay, then rely on `persist` to have run by then.

3. **Fallback to `data.json`:** If localStorage is empty (first visit), you still want default boards. You can:
   - Set initial state in `create` by reading `getBoards() ?? data.boards` and passing that as the initial `boards`, or
   - After rehydration, if `boards.length === 0`, dispatch `SET_BOARDS` with `data.json` in an effect or in the rehydration callback.

**Why Option A:** The lab mentions “built-in middleware (e.g., persist in Zustand).” It keeps persistence in one place (the store config) and avoids manual `useEffect` + `setBoards`.

### Option B: Manual sync

Keep using `getBoards()` and `setBoards()` from `src/utils/localStorage.ts`:

1. **Initial load:** When creating the store, set initial `boards` from `getBoards()?.boards ?? data.boards` (same as in `BoardsContext` today).
2. **On change:** Use `useStore.subscribe` (or a small helper component / effect) so that whenever `boards` in the store changes, you call `setBoards({ boards })`.

**Why Option B:** No dependency on `persist`; you already have the localStorage helpers. Slightly more code and you must ensure subscribe runs in a safe place (e.g. inside the app tree or in the store factory).

### Loading overlay

Today `BoardsContext` calls `startLoading('initBoards')` and `stopLoading('initBoards')` around the initial load. After moving to the store:

- If you use **persist**: run the same start/stop loading around the rehydration (e.g. in `onRehydrateStorage` or where you detect “first load done”). That keeps the same UX.
- If you use **manual sync**: keep a short delay and call start/stop in the same place you dispatch `SET_BOARDS` (e.g. in `main.tsx` or a small “HydrateBoards” component that runs once).

---

## 5. Wire the app: Remove Context, connect components

### Step 5.1: Remove BoardsContext and its Provider

1. **Delete or stop using:**
   - `src/context/BoardsContext.tsx`
   - `src/utils/boardsContext.ts`
2. **Update `App.tsx`:** Remove `BoardsProvider` and its import. The tree should no longer wrap children in `BoardsProvider`; the store is used without a Provider.

**Why:** The store is the single source of truth. Context was only a way to “provide” that state; with Zustand, components get it from the store directly (or via a hook).

### Step 5.2: Refactor `useBoards` to use the store

Change `src/hooks/useBoards.ts` so that it:

- Reads `boards` and `dispatch` from the Zustand store (e.g. `useStore((s) => ({ boards: s.boards, dispatch: s.dispatch }))` or two separate selectors).
- Returns the same shape as before: `{ boards, dispatch }` so that `BoardsContextType` is still satisfied.

**Why keep the hook:** Components already use `useBoards()`. If the hook continues to return `{ boards, dispatch }`, you don’t have to change component code for the _interface_; only the implementation of the hook changes. This is a small refactor with minimal call-site churn.

**Important:** Do not read the whole store in one selector if you only need `boards` and `dispatch`. Prefer something like:

- `useStore((s) => s.boards)` and `useStore((s) => s.dispatch)` in the hook, or
- One selector that returns `{ boards: s.boards, dispatch: s.dispatch }`.

So the hook subscribes only to what it needs. We’ll refine selectors further in [Section 6](#6-optimize-selectors-and-minimal-re-renders).

### Step 5.3: Ensure initial data is loaded

- If you use **persist**: rehydration populates the store; optionally show loading until rehydration is done, then dispatch `SET_BOARDS` with `data.json` when `boards.length === 0` if you want a default first load.
- If you use **manual sync**: the store’s initial state should be set from `getBoards() ?? data.json` when you call `create`, or you dispatch `SET_BOARDS` once in a top-level effect (e.g. in `App` or a dedicated component). Reuse the same loading overlay logic as before so the UX stays consistent.

### Step 5.4: Components that use boards

All of these currently use `useBoards()` (or could use it after you refactor the hook):

- **Pages:** `Dashboard`, `BoardView`
- **Layout:** `Layout`, `Header`, `Aside`
- **Modals:** `AddTaskModal`, `EditTaskModal`, `TaskDetailsModal`, `EditBoardModal`, `DeleteBoardModal`, `AddColumnModal`

No need to change their _calls_ to `useBoards()` if the hook returns the same shape. Only ensure:

- They do not assume they are inside `BoardsProvider` (the error in `useBoards` that threw when context was null can be removed; instead, the hook always reads from the store).
- Any component that only needs `boards.length` or a single board can later be optimized with a more specific selector (see Section 6).

**Why no prop drilling:** Data flows from the store to the hook to the component. Parent components do not need to pass `boards` or `dispatch` as props; each component that needs them calls `useBoards()` (or a dedicated selector). That satisfies “all data from the global store” and “avoid prop drilling.”

---

## 6. Optimize: Selectors and minimal re-renders

### Why selectors matter

Zustand re-renders a component when the **selected value** changes (by reference). If you do:

```ts
const { boards, dispatch } = useStore((s) => ({
  boards: s.boards,
  dispatch: s.dispatch,
}));
```

then every time _any_ part of the store changes, `boards` is a new array reference and the component re-renders. That’s correct but can be more than needed: e.g. a component that only shows `boards.length` re-renders when a task inside a board changes.

**Best practice:** Select only what the component needs.

- A component that only needs the list length: `useStore((s) => s.boards.length)`.
- A component that needs one board: `useStore((s) => s.boards[boardIndex])` (with a stable `boardIndex`, e.g. from the URL). It will re-render only when that board reference changes.
- A component that needs `boards` and `dispatch`: keep `useBoards()` but implement it with two subscriptions or one selector that returns `{ boards: s.boards, dispatch: s.dispatch }`. If you add a “selector layer” (e.g. `getBoardByIndex`), the hook can use that so call sites stay simple.

### Immutability and no duplication

Your `boardsReducer` already returns new state for every action (spread, `map`, `filter`). So:

- **Immutability:** Keep using the reducer in the store; do not mutate `state` inside the store.
- **No duplication:** Components should not copy `boards` into local state for “editing.” They should read from the store and dispatch updates (e.g. `UPDATE_TASK`, `UPDATE_BOARD`). The only “local” state in components should be UI state (e.g. modal open, form fields) that hasn’t been committed to the store yet.

### Optional: Selector helpers

You can add small functions in the store file or a separate `src/store/selectors.ts`:

- `getBoardByIndex(state, index): Board | undefined`
- `getBoardsLength(state): number`

Then in components (or in `useBoards`), use `useStore(getBoardByIndex)` with a fixed index. This keeps components clean and centralizes “how we derive this from state.”

---

## 7. Optional: Theme in global state

The extension asks for a theme toggle stored in global state. You currently have `ThemeContext` and `localStorage` for theme.

### Option A: Move theme into the same Zustand store

1. **Extend store state:** e.g. `theme: 'light' | 'dark'`.
2. **Add action:** `setTheme(theme: 'light' | 'dark')` that calls `set({ theme })`.
3. **Persistence:** If you use `persist`, add `theme` to `partialize` so it’s saved. On rehydration, the stored theme is applied.
4. **Replace ThemeContext:** In `App.tsx`, read `theme` from the store (e.g. `useStore((s) => s.theme)`) and set `data-theme={theme}` on the root. For the toggle, call `useStore.getState().setTheme(next)` or expose `setTheme` from a hook. Remove `ThemeProvider` and `useTheme` (or make `useTheme` a thin wrapper around the store).

**Why:** One store for “app preferences” (boards + theme) keeps the lab’s “UI preferences in global state” in one place and one persistence config.

### Option B: Keep ThemeContext, sync from store

Keep `ThemeContext` for React-based subscription and keep using your existing `setTheme` in localStorage. Optionally, the store could still hold `theme` and persist it, and ThemeProvider reads from the store on mount and subscribes to store changes. This is a half-step if you want theme in the store but don’t want to touch every `useTheme()` call yet.

---

## 8. Optional: Drag-and-drop for moving tasks

The extension suggests adding drag-and-drop (e.g. with `@dnd-kit/core` or `react-beautiful-dnd`) for moving tasks between columns.

### Design principle

The store remains the single source of truth. Moving a task is still a **state change**: same as when the user picks “Move to column X” in the UI. So the only new piece is **how** the user triggers that change (drag vs dropdown). The action is the same: `MOVE_TASK` with `boardIndex`, `fromColumn`, `toColumn`, `taskTitle`.

### Implementation outline

1. **Install a DnD library** (e.g. `@dnd-kit/core` and `@dnd-kit/sortable`).
2. **Wrap columns (or the list of tasks)** in the DnD provider and make each task (or column) a draggable/droppable.
3. **On drop:** In the drop handler, determine the source and target column and task title, then call `dispatch({ type: 'MOVE_TASK', payload: { boardIndex, fromColumn, toColumn, taskTitle } })`. No local state for “moving”; the store is updated and the UI re-renders from the new state.
4. **Optimization:** You might derive `boardIndex` from the route and pass it into the component that owns the DnD logic, so the drop handler has everything it needs to dispatch.

**Why this keeps the store correct:** All moves go through `MOVE_TASK`. The reducer already implements the move (remove from source column, add to target with updated status). DnD is just another way to call that same action.

---

## 9. Checklist and file map

Use this as a quick reference while implementing.

### Setup and store

- [ ] `yarn add zustand`
- [ ] Create `src/store/useStore.ts` (or `boardsStore.ts`)
- [ ] Define store state: `BoardsState` + `dispatch`
- [ ] Wire `boardsReducer` so `dispatch(action)` calls `set(boardsReducer(state, action))`
- [ ] Add persistence: either `persist` middleware (Option A) or manual `getBoards`/`setBoards` + subscribe (Option B)
- [ ] Handle initial load: rehydration or manual `SET_BOARDS` with `data.json` when empty; keep loading overlay behavior

### Wiring

- [ ] Remove `BoardsProvider` from `App.tsx` and delete (or stop using) `BoardsContext.tsx` and `boardsContext.ts`
- [ ] Refactor `useBoards` to read `boards` and `dispatch` from the store; keep return type `BoardsContextType`
- [ ] Confirm all components that need boards use `useBoards()` (or a selector) and no longer depend on BoardsProvider

### Optimization and integrity

- [ ] Ensure no component copies `boards` into local state for editing; use dispatch for all updates
- [ ] Use selectors so components that only need `boards.length` or one board subscribe to the minimum state
- [ ] (Optional) Add selector helpers, e.g. `getBoardByIndex`, and use them where appropriate

### Optional extensions

- [ ] **Theme:** Add `theme` and `setTheme` to the store; persist; replace ThemeContext usage with store (or keep useTheme as a wrapper)
- [ ] **DnD:** Add `@dnd-kit/core` (or similar); on drop, dispatch `MOVE_TASK` with the correct payload; no duplicate “moving” state

### File-level summary

| Action                     | Files                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| Add dependency             | `package.json` (zustand)                                                                         |
| Create store + persistence | `src/store/useStore.ts` (or `boardsStore.ts`)                                                    |
| Remove Context             | `src/context/BoardsContext.tsx`, `src/utils/boardsContext.ts`; `App.tsx` (remove BoardsProvider) |
| Refactor hook              | `src/hooks/useBoards.ts` → read from store                                                       |
| Optional selectors         | `src/store/selectors.ts` (optional)                                                              |
| Optional theme in store    | Extend store; update `App.tsx`, remove or wrap ThemeContext                                      |
| Optional DnD               | Install DnD lib; in BoardView (or task list), on drop dispatch `MOVE_TASK`                       |

---

## Quick “why” summary for your lab explanation

- **Why Zustand:** The lab allows Redux or Zustand; Task 4 mentions “persist in Zustand.” The app already had reducer-style logic; Zustand lets us keep that with less boilerplate (no Provider, no slices) and add persistence via built-in middleware.
- **Why a single store:** So there is one source of truth for boards (and optionally theme). All updates go through the store via actions; no duplicate or scattered state.
- **Why keep the reducer:** Actions stay minimal and descriptive; updates are immutable and predictable; the same logic can be tested and reused.
- **Why persist:** So Kanban data (and optionally theme) survives refresh; we used Zustand’s `persist` middleware (or manual localStorage sync) to satisfy the lab.
- **Why selectors:** So components re-render only when the slice they use changes, keeping the UI responsive and aligned with React best practices.

Good luck with the implementation. Follow the sections in order for a smooth refactor, and use the checklist to track progress.
