// OpenAPI 3.1 description of the whole HTTP API — the machine-readable contract.
//
// It's authored as a plain object (not a static .yaml) for one reason: the
// success envelope `{ status, data }` wraps every response, and repeating that
// wrapper ~30 times by hand is exactly the kind of thing a spec-as-code file
// lets us factor into a helper. The object is still a portable artifact — it's
// served verbatim at GET /api/docs.json, so any external tool (Postman, code
// generators) can import it.

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

// A 2xx body: the success envelope wrapping whatever `data` shape is given.
const ok = (data: object, description = "Success") => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: ["status", "data"],
        properties: {
          status: { type: "string", enum: ["success"] },
          data,
        },
      },
    },
  },
});

const okItem = (name: string, description?: string) =>
  ok(ref(name), description);
const okList = (name: string, description?: string) =>
  ok({ type: "array", items: ref(name) }, description);
const okNull = (description = "Success") => ok({ type: "null" }, description);

// A JSON request body wrapper.
const body = (schema: object) => ({
  required: true,
  content: { "application/json": { schema } },
});

// Reusable error responses, referenced by name from each path.
const errors = {
  ValidationError: { $ref: "#/components/responses/ValidationError" },
  NotAuthenticated: { $ref: "#/components/responses/NotAuthenticated" },
  Forbidden: { $ref: "#/components/responses/Forbidden" },
  NotFound: { $ref: "#/components/responses/NotFound" },
  Conflict: { $ref: "#/components/responses/Conflict" },
};

const boardIdParam = {
  name: "boardId",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
};
const columnIdParam = {
  name: "columnId",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
};
const taskIdParam = {
  name: "taskId",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
};
const userIdParam = {
  name: "userId",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
};
const subtaskIdParam = {
  name: "subtaskId",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
};

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Kanban Task Management API",
    version: "1.0.0",
    description:
      "REST API for the Kanban app. Authentication is a JWT stored in an " +
      "httpOnly cookie named `token`. To try protected endpoints here: call " +
      "`POST /auth/login` first (the seed accounts use password `Password123!`) " +
      "— the browser stores the cookie and sends it automatically on the " +
      "requests below.",
  },
  servers: [
    { url: "http://localhost:3000/api", description: "Local development" },
  ],
  // Applied to every operation unless overridden with `security: []`.
  security: [{ cookieAuth: [] }],
  tags: [
    { name: "Auth", description: "Registration, login, session" },
    { name: "Boards", description: "Board CRUD and collaborators" },
    { name: "Columns", description: "Column CRUD and reorder" },
    { name: "Tasks", description: "Task CRUD, move, and subtasks" },
  ],
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        security: [],
        requestBody: body({
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", minLength: 1, example: "Alice Johnson" },
            email: {
              type: "string",
              format: "email",
              example: "alice@example.com",
            },
            password: { type: "string", minLength: 8, example: "Password123!" },
          },
        }),
        responses: {
          "201": okItem("UserDTO", "Registered; sets the auth cookie"),
          "400": errors.ValidationError,
          "409": errors.Conflict,
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in",
        security: [],
        requestBody: body({
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "alice@example.com",
            },
            password: { type: "string", example: "Password123!" },
          },
        }),
        responses: {
          "200": okItem("UserDTO", "Logged in; sets the auth cookie"),
          "400": errors.ValidationError,
          "401": errors.NotAuthenticated,
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Log out",
        security: [],
        responses: { "200": okNull("Logged out; clears the auth cookie") },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Current authenticated user",
        responses: {
          "200": okItem("UserDTO"),
          "401": errors.NotAuthenticated,
        },
      },
    },

    "/boards": {
      get: {
        tags: ["Boards"],
        summary: "List boards the user owns or collaborates on",
        responses: {
          "200": okList("BoardDTO"),
          "401": errors.NotAuthenticated,
        },
      },
      post: {
        tags: ["Boards"],
        summary: "Create a board",
        requestBody: body({
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", minLength: 1, example: "Product Roadmap" },
          },
        }),
        responses: {
          "201": okItem("BoardDTO"),
          "400": errors.ValidationError,
          "401": errors.NotAuthenticated,
        },
      },
    },
    "/boards/{boardId}": {
      parameters: [boardIdParam],
      get: {
        tags: ["Boards"],
        summary: "Get a board",
        responses: {
          "200": okItem("BoardDTO"),
          "403": errors.Forbidden,
          "404": errors.NotFound,
        },
      },
      patch: {
        tags: ["Boards"],
        summary: "Rename a board",
        requestBody: body({
          type: "object",
          required: ["name"],
          properties: { name: { type: "string", minLength: 1 } },
        }),
        responses: {
          "200": okItem("BoardDTO"),
          "400": errors.ValidationError,
          "403": errors.Forbidden,
          "404": errors.NotFound,
        },
      },
      delete: {
        tags: ["Boards"],
        summary: "Delete a board (owner only)",
        responses: {
          "200": okNull(),
          "403": errors.Forbidden,
          "404": errors.NotFound,
        },
      },
    },
    "/boards/{boardId}/full": {
      parameters: [boardIdParam],
      get: {
        tags: ["Boards"],
        summary: "Board with all columns and tasks in one payload",
        responses: {
          "200": okItem("BoardContentsDTO"),
          "403": errors.Forbidden,
          "404": errors.NotFound,
        },
      },
    },
    "/boards/{boardId}/columns": {
      parameters: [boardIdParam],
      get: {
        tags: ["Columns"],
        summary: "List a board's columns",
        responses: {
          "200": okList("ColumnDTO"),
          "403": errors.Forbidden,
          "404": errors.NotFound,
        },
      },
      post: {
        tags: ["Columns"],
        summary: "Add a column",
        requestBody: body({
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", minLength: 1, example: "Todo" },
          },
        }),
        responses: {
          "201": okItem("ColumnDTO"),
          "400": errors.ValidationError,
          "403": errors.Forbidden,
          "404": errors.NotFound,
        },
      },
    },
    "/boards/{boardId}/members": {
      parameters: [boardIdParam],
      get: {
        tags: ["Boards"],
        summary: "List board members (owner + collaborators)",
        responses: {
          "200": okList("BoardMemberDTO"),
          "403": errors.Forbidden,
          "404": errors.NotFound,
        },
      },
    },
    "/boards/{boardId}/collaborators": {
      parameters: [boardIdParam],
      post: {
        tags: ["Boards"],
        summary: "Invite a collaborator by email (owner only)",
        requestBody: body({
          type: "object",
          required: ["email", "role"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "bob@example.com",
            },
            role: { type: "string", enum: ["EDITOR", "VIEWER"] },
          },
        }),
        responses: {
          "201": okNull("Invited"),
          "400": errors.ValidationError,
          "403": errors.Forbidden,
          "404": errors.NotFound,
          "409": errors.Conflict,
        },
      },
    },
    "/boards/{boardId}/collaborators/{userId}": {
      parameters: [boardIdParam, userIdParam],
      patch: {
        tags: ["Boards"],
        summary: "Change a collaborator's role (owner only)",
        requestBody: body({
          type: "object",
          required: ["role"],
          properties: { role: { type: "string", enum: ["EDITOR", "VIEWER"] } },
        }),
        responses: {
          "200": okNull(),
          "400": errors.ValidationError,
          "403": errors.Forbidden,
          "404": errors.NotFound,
        },
      },
      delete: {
        tags: ["Boards"],
        summary: "Remove a collaborator (owner only)",
        responses: {
          "200": okNull(),
          "403": errors.Forbidden,
          "404": errors.NotFound,
        },
      },
    },
    "/boards/{boardId}/transfer": {
      parameters: [boardIdParam],
      post: {
        tags: ["Boards"],
        summary: "Transfer board ownership (owner only)",
        requestBody: body({
          type: "object",
          required: ["newOwnerId"],
          properties: { newOwnerId: { type: "string", format: "uuid" } },
        }),
        responses: {
          "200": okNull(),
          "400": errors.ValidationError,
          "403": errors.Forbidden,
          "404": errors.NotFound,
        },
      },
    },

    "/columns/{columnId}": {
      parameters: [columnIdParam],
      patch: {
        tags: ["Columns"],
        summary: "Rename a column",
        requestBody: body({
          type: "object",
          required: ["name"],
          properties: { name: { type: "string", minLength: 1 } },
        }),
        responses: {
          "200": okItem("ColumnDTO"),
          "400": errors.ValidationError,
          "403": errors.Forbidden,
          "404": errors.NotFound,
        },
      },
      delete: {
        tags: ["Columns"],
        summary: "Delete a column",
        responses: {
          "200": okNull(),
          "403": errors.Forbidden,
          "404": errors.NotFound,
        },
      },
    },
    "/columns/{columnId}/position": {
      parameters: [columnIdParam],
      patch: {
        tags: ["Columns"],
        summary: "Reorder a column",
        requestBody: body({
          type: "object",
          required: ["position"],
          properties: {
            position: {
              type: "number",
              description: "New sort position among the board's columns.",
              example: 1500,
            },
          },
        }),
        responses: {
          "200": okItem("ColumnDTO"),
          "400": errors.ValidationError,
          "403": errors.Forbidden,
          "404": errors.NotFound,
        },
      },
    },
    "/columns/{columnId}/tasks": {
      parameters: [columnIdParam],
      get: {
        tags: ["Tasks"],
        summary: "List a column's tasks",
        responses: {
          "200": okList("TaskDTO"),
          "403": errors.Forbidden,
          "404": errors.NotFound,
        },
      },
      post: {
        tags: ["Tasks"],
        summary: "Create a task in a column",
        requestBody: body({
          type: "object",
          required: ["title"],
          properties: {
            title: {
              type: "string",
              minLength: 1,
              example: "Design the landing page",
            },
            description: {
              type: "string",
              example: "First impression for new visitors.",
            },
          },
        }),
        responses: {
          "201": okItem("TaskDTO"),
          "400": errors.ValidationError,
          "403": errors.Forbidden,
          "404": errors.NotFound,
        },
      },
    },

    "/tasks/{taskId}": {
      parameters: [taskIdParam],
      patch: {
        tags: ["Tasks"],
        summary: "Edit a task's title and/or description",
        requestBody: body({
          type: "object",
          minProperties: 1,
          properties: {
            title: { type: "string", minLength: 1 },
            description: { type: "string" },
          },
        }),
        responses: {
          "200": okItem("TaskDTO"),
          "400": errors.ValidationError,
          "403": errors.Forbidden,
          "404": errors.NotFound,
        },
      },
      delete: {
        tags: ["Tasks"],
        summary: "Delete a task",
        responses: {
          "200": okNull(),
          "403": errors.Forbidden,
          "404": errors.NotFound,
        },
      },
    },
    "/tasks/{taskId}/move": {
      parameters: [taskIdParam],
      patch: {
        tags: ["Tasks"],
        summary: "Move a task to a column and position (drag-and-drop)",
        requestBody: body({
          type: "object",
          required: ["toColumnId", "position"],
          properties: {
            toColumnId: { type: "string", format: "uuid" },
            position: {
              type: "number",
              description: "New sort position within the destination column.",
              example: 1500,
            },
          },
        }),
        responses: {
          "200": okItem("TaskDTO"),
          "400": errors.ValidationError,
          "403": errors.Forbidden,
          "404": errors.NotFound,
        },
      },
    },
    "/tasks/{taskId}/subtasks": {
      parameters: [taskIdParam],
      post: {
        tags: ["Tasks"],
        summary: "Add a subtask",
        requestBody: body({
          type: "object",
          required: ["title"],
          properties: { title: { type: "string", minLength: 1 } },
        }),
        responses: {
          "201": okItem(
            "TaskDTO",
            "The parent task, including the new subtask"
          ),
          "400": errors.ValidationError,
          "403": errors.Forbidden,
          "404": errors.NotFound,
        },
      },
    },
    "/tasks/{taskId}/subtasks/{subtaskId}": {
      parameters: [taskIdParam, subtaskIdParam],
      patch: {
        tags: ["Tasks"],
        summary: "Toggle a subtask's completed state",
        responses: {
          "200": okItem("TaskDTO"),
          "403": errors.Forbidden,
          "404": errors.NotFound,
        },
      },
      delete: {
        tags: ["Tasks"],
        summary: "Remove a subtask",
        responses: {
          "200": okItem("TaskDTO"),
          "403": errors.Forbidden,
          "404": errors.NotFound,
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token",
        description:
          "JWT set by /auth/login and /auth/register as an httpOnly cookie.",
      },
    },
    responses: {
      ValidationError: {
        description: "Request failed validation",
        content: {
          "application/json": {
            schema: ref("ErrorResponse"),
            example: {
              status: "error",
              message: "Validation failed",
              errors: { email: "A valid email is required" },
            },
          },
        },
      },
      NotAuthenticated: {
        description:
          "Not authenticated — missing, invalid, or expired session.",
        content: {
          "application/json": {
            schema: ref("ErrorResponse"),
            example: { status: "error", message: "Authentication required" },
          },
        },
      },
      Forbidden: {
        description: "Authenticated but not allowed",
        content: {
          "application/json": {
            schema: ref("ErrorResponse"),
            example: {
              status: "error",
              message: "You can't modify this board",
            },
          },
        },
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: ref("ErrorResponse"),
            example: { status: "error", message: "Board not found" },
          },
        },
      },
      Conflict: {
        description: "Conflicts with existing state",
        content: {
          "application/json": {
            schema: ref("ErrorResponse"),
            example: {
              status: "error",
              message: "That email is already registered",
            },
          },
        },
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        required: ["status", "message"],
        properties: {
          status: { type: "string", enum: ["error"] },
          message: { type: "string" },
          errors: {
            type: "object",
            additionalProperties: { type: "string" },
            description: "Per-field validation messages, keyed by field name.",
          },
        },
      },
      UserDTO: {
        type: "object",
        required: ["id", "name", "email", "role"],
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["ADMIN", "USER"] },
        },
      },
      CollaboratorDTO: {
        type: "object",
        required: ["userId", "role"],
        properties: {
          userId: { type: "string", format: "uuid" },
          role: { type: "string", enum: ["EDITOR", "VIEWER"] },
        },
      },
      BoardDTO: {
        type: "object",
        required: ["id", "ownerId", "name", "collaborators"],
        properties: {
          id: { type: "string", format: "uuid" },
          ownerId: { type: "string", format: "uuid" },
          name: { type: "string" },
          collaborators: { type: "array", items: ref("CollaboratorDTO") },
        },
      },
      BoardMemberDTO: {
        type: "object",
        required: ["userId", "name", "email", "role"],
        properties: {
          userId: { type: "string", format: "uuid" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["OWNER", "EDITOR", "VIEWER"] },
        },
      },
      ColumnDTO: {
        type: "object",
        required: ["id", "boardId", "name", "position"],
        properties: {
          id: { type: "string", format: "uuid" },
          boardId: { type: "string", format: "uuid" },
          name: { type: "string" },
          position: { type: "number" },
        },
      },
      SubtaskDTO: {
        type: "object",
        required: ["id", "title", "isCompleted"],
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          isCompleted: { type: "boolean" },
        },
      },
      TaskDTO: {
        type: "object",
        required: [
          "id",
          "columnId",
          "title",
          "description",
          "position",
          "subtasks",
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          columnId: { type: "string", format: "uuid" },
          title: { type: "string" },
          description: { type: "string" },
          position: { type: "number" },
          subtasks: { type: "array", items: ref("SubtaskDTO") },
        },
      },
      BoardContentsDTO: {
        type: "object",
        required: ["board", "columns", "tasks"],
        properties: {
          board: ref("BoardDTO"),
          columns: { type: "array", items: ref("ColumnDTO") },
          tasks: { type: "array", items: ref("TaskDTO") },
        },
      },
    },
  },
} satisfies Record<string, unknown>;
