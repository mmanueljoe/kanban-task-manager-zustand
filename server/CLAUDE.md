# Server — architecture & conventions

Backend for the Kanban app. Node.js + Express + PostgreSQL (Prisma) + JWT.
Layered architecture with a real domain model — **not** the thin tutorial
style where controllers talk straight to the database.

This file is the contract for how code is organized here. When in doubt about
where something goes, the rule in §2 decides it.

---

## 1. The layers and what each one is for

```
domain/         Entities + value objects. Business rules and behaviour live here.
repositories/   All database access. Translates between domain objects and DB rows.
services/       Use cases. Orchestrates domain + repositories. Permission checks.
controllers/    HTTP in, HTTP out. Reads the request, calls a service, shapes the response.
routes/         Maps URLs to controllers.
middlewares/    Cross-cutting request handling: authentication, validation.
errors/         Domain/application error types + the HTTP mapping in one place.
config/         DB connection, environment variables.
utils/          Pure helper functions. No domain knowledge, no I/O.
```

---

## 2. The one rule: dependencies point one direction

```
routes → controllers → services → repositories → domain
                                 ↘ domain
```

Nothing points **upward**. The domain knows nothing about repositories,
HTTP, or Express. A repository knows nothing about controllers. If you find
yourself importing "up" the list, the code is in the wrong layer.

Why this matters: the domain is the part with no dependencies, so it can be
built and unit-tested in complete isolation. Every layer above it leans only
on layers already built below.

---

## 3. What does NOT belong in each layer (the common mistakes)

- **domain/** — no `prisma`, no `req`/`res`, no SQL, no HTTP status codes.
  If it imports a database or web library, it's not domain code.
- **repositories/** — no business rules ("can this user edit?"). A repo
  fetches and saves; it does not decide _whether_ something is allowed.
- **services/** — no `req`/`res` objects, no HTTP status codes. A service
  takes plain inputs and returns plain results or throws a domain error.
- **controllers/** — no business logic, no DB calls. Read the request, call
  one service, translate the result (or a thrown error) into an HTTP response.
  Nothing else.

If a controller is making decisions, that logic belongs in a service. If a
service is touching the database directly, that call belongs in a repository.

---

## 4. Domain business rules (the source of truth)

These rules live in the domain/services, never in controllers:

- A **task must belong to a column**; a **column must belong to a board**.
- Board access levels: **Owner**, **Editor**, **Viewer**.
  - Only **owners and editors** can modify content (boards, columns, tasks).
  - **Viewers** can only read.
  - Only **owners** can invite collaborators.
- App-level role on a User: **USER** or **ADMIN**. ADMIN is platform
  administration (cross-board), separate from per-board access levels.
- A task's column **is** its status. There is no separate `status` field —
  `columnId` is the single source of truth for where a task lives.

---

## 5. Error handling

- Services throw **domain errors** defined in `errors/` (e.g. `NotFoundError`,
  `NotAuthorizedError`, `ValidationError`) — never raw strings, never HTTP codes.
- A single place (an error-handling middleware) maps those domain errors to
  HTTP status codes + the structured JSON response. This is what keeps
  controllers thin: they don't translate errors, the mapper does.
- Response shape follows the project spec:
  - success: `{ "status": "success", "data": {...} }`
  - error: `{ "status": "error", "message": "..." }`

---

## 6. Build order

Bottom-up, because each layer depends only on the ones below it:

1. `domain/` — entities + value objects (start here, no tools needed)
2. `config/` + Prisma schema + migrations
3. `repositories/` — domain ⇄ DB translation
4. `services/` — use cases + permission rules
5. `controllers/` → `routes/` → `middlewares/`
6. Frontend wiring (the `client/` refactor against the live API)

Within the domain layer, build entities in dependency order:
`User → Board → Column → Task`.

---

## 7. Conventions

- Add dependencies **per layer, as you reach them** — Express/Prisma/etc. are
  not installed yet on purpose (domain-first). Don't pull in a tool before the
  layer that needs it.
- Tests live in `tests/`. Domain entities are pure logic — unit-test them
  right after writing them.
- Shared API contract types live in the workspace `@kanban/shared` package,
  imported by both client and server so the wire shapes can't drift.
