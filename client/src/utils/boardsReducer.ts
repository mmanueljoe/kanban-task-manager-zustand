import type { BoardsAction, BoardsState } from '@/types/types';

export function boardsReducer(
  state: BoardsState,
  action: BoardsAction
): BoardsState {
  switch (action.type) {
    case 'ADD_BOARD':
      return {
        ...state,
        boards: [...state.boards, action.payload],
      };
    case 'UPDATE_BOARD':
      return {
        ...state,
        boards: state.boards.map((board, index) =>
          index === action.payload.boardIndex ? action.payload.board : board
        ),
      };
    case 'DELETE_BOARD':
      return {
        ...state,
        boards: state.boards.filter(
          (_, index) => index !== action.payload.boardIndex
        ),
      };
    case 'ADD_TASK':
      return {
        ...state,
        boards: state.boards.map((board, index) =>
          index === action.payload.boardIndex
            ? {
                ...board,
                columns: board.columns.map((column) =>
                  action.payload.columnName === column.name
                    ? {
                        ...column,
                        tasks: [...column.tasks, action.payload.task],
                      }
                    : column
                ),
              }
            : board
        ),
      };
    case 'UPDATE_TASK':
      return {
        ...state,
        boards: state.boards.map((board, index) =>
          index === action.payload.boardIndex
            ? {
                ...board,
                columns: board.columns.map((column) =>
                  action.payload.columnName === column.name
                    ? {
                        ...column,
                        tasks: column.tasks.map((task) =>
                          task.title === action.payload.taskTitle
                            ? action.payload.task
                            : task
                        ),
                      }
                    : column
                ),
              }
            : board
        ),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        boards: state.boards.map((board, index) =>
          index === action.payload.boardIndex
            ? {
                ...board,
                columns: board.columns.map((column) =>
                  action.payload.columnName === column.name
                    ? {
                        ...column,
                        tasks: column.tasks.filter(
                          (task) => task.title !== action.payload.taskTitle
                        ),
                      }
                    : column
                ),
              }
            : board
        ),
      };
    case 'MOVE_TASK': {
      const { boardIndex, fromColumn, toColumn, taskTitle } = action.payload;

      const board = state.boards[boardIndex];
      if (!board) return state;

      const fromCol = board.columns.find((c) => c.name === fromColumn);
      if (!fromCol) return state;

      const taskToMove = fromCol.tasks.find((t) => t.title === taskTitle);
      if (!taskToMove) return state;

      return {
        ...state,
        boards: state.boards.map((board, index) =>
          index === action.payload.boardIndex
            ? {
                ...board,
                columns: board.columns.map((column) => {
                  if (column.name === fromColumn) {
                    return {
                      ...column,
                      tasks: column.tasks.filter((t) => t.title !== taskTitle),
                    };
                  }
                  if (column.name === toColumn) {
                    return {
                      ...column,
                      tasks: [
                        ...column.tasks,
                        { ...taskToMove, status: toColumn },
                      ],
                    };
                  }
                  return column;
                }),
              }
            : board
        ),
      };
    }
    case 'TOOGLE_SUBTASK':
      return {
        ...state,
        boards: state.boards.map((board, index) =>
          index === action.payload.boardIndex
            ? {
                ...board,
                columns: board.columns.map((column) =>
                  action.payload.columnName === column.name
                    ? {
                        ...column,
                        tasks: column.tasks.map((task) =>
                          task.title === action.payload.taskTitle
                            ? {
                                ...task,
                                subtasks: task.subtasks?.map((subtask) =>
                                  subtask.title === action.payload.subtaskTitle
                                    ? {
                                        ...subtask,
                                        isCompleted: !subtask.isCompleted,
                                      }
                                    : subtask
                                ),
                              }
                            : task
                        ),
                      }
                    : column
                ),
              }
            : board
        ),
      };
    case 'ADD_COLUMN': {
      const { boardIndex, columnName } = action.payload;

      if (!columnName.trim()) return state;

      return {
        ...state,
        boards: state.boards.map((board, index) =>
          index === boardIndex
            ? {
                ...board,
                columns: [...board.columns, { name: columnName, tasks: [] }],
              }
            : board
        ),
      };
    }
    case 'SET_BOARDS':
      return {
        ...state,
        boards: action.payload.boards,
      };
    default:
      return state;
  }
}
