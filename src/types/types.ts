export type StoredUser = {
  id: string;
  name: string;
  email: string;
};

export type Auth = {
  isLoggedIn: boolean;
  user: StoredUser | null;
};

export type User = StoredUser;

export type AuthContextType = {
  user: User | null;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
};

export type ThemeContextType = {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
};

// Board domain (matches data.json)
export type Subtask = {
  title: string;
  isCompleted: boolean;
};

export type Task = {
  title: string;
  description?: string;
  status?: string;
  subtasks?: Subtask[];
};

export type Column = {
  name: string;
  tasks: Task[];
};

export type Board = {
  name: string;
  columns: Column[];
};

export type BoardsData = {
  boards: Board[];
};
