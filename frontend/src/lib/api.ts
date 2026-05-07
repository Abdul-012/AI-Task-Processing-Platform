import type { Operation, Task, TaskListResponse, TaskStatus, User } from "../types/api";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown = undefined) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      payload?.error?.message || "Request failed",
      response.status,
      payload?.error?.details
    );
  }

  return payload as T;
}

export const api = {
  register(input: { name: string; email: string; password: string }) {
    return request<{ user: User; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },
  login(input: { email: string; password: string }) {
    return request<{ user: User; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },
  me(token: string) {
    return request<{ user: User }>("/auth/me", {}, token);
  },
  listTasks(token: string, status?: TaskStatus | "all") {
    const query = status && status !== "all" ? `?status=${status}` : "";
    return request<TaskListResponse>(`/tasks${query}`, {}, token);
  },
  getTask(token: string, id: string) {
    return request<{ task: Task }>(`/tasks/${id}`, {}, token);
  },
  createTask(
    token: string,
    input: { title: string; inputText: string; operation: Operation }
  ) {
    return request<{ task: Task }>("/tasks", {
      method: "POST",
      body: JSON.stringify(input)
    }, token);
  },
  retryTask(token: string, id: string) {
    return request<{ task: Task }>(`/tasks/${id}/retry`, {
      method: "POST",
      body: JSON.stringify({})
    }, token);
  }
};
