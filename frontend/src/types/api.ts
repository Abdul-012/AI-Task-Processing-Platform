export type TaskStatus = "pending" | "running" | "success" | "failed";

export type Operation = "uppercase" | "lowercase" | "reverse" | "word_count";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface TaskLog {
  level: "info" | "warn" | "error";
  message: string;
  meta?: Record<string, unknown>;
  timestamp: string;
}

export interface Task {
  _id: string;
  user: string;
  title: string;
  inputText?: string;
  operation: Operation;
  status: TaskStatus;
  result: string | number | null;
  error: string | null;
  logs: TaskLog[];
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskListResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
