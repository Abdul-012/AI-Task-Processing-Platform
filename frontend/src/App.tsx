import { LogOut, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthPanel } from "./components/AuthPanel";
import { TaskComposer } from "./components/TaskComposer";
import { TaskDetail } from "./components/TaskDetail";
import { TaskList } from "./components/TaskList";
import { api, ApiError } from "./lib/api";
import type { Operation, Task, TaskStatus, User } from "./types/api";

const TOKEN_KEY = "taskforge.token";

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [bootstrapping, setBootstrapping] = useState(Boolean(token));
  const selectedTaskId = selectedTask?._id;

  const metrics = useMemo(() => {
    return {
      pending: tasks.filter((task) => task.status === "pending").length,
      running: tasks.filter((task) => task.status === "running").length,
      success: tasks.filter((task) => task.status === "success").length,
      failed: tasks.filter((task) => task.status === "failed").length
    };
  }, [tasks]);

  const refreshTasks = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setNotice("");

    try {
      const response = await api.listTasks(token, statusFilter);
      setTasks(response.tasks);

      if (selectedTaskId) {
        const current = response.tasks.find((task) => task._id === selectedTaskId);
        if (current) {
          const detail = await api.getTask(token, current._id);
          setSelectedTask(detail.task);
        }
      }
    } catch (error) {
      setNotice(error instanceof ApiError ? error.message : "Could not load tasks");
    } finally {
      setLoading(false);
    }
  }, [selectedTaskId, statusFilter, token]);

  useEffect(() => {
    if (!token) {
      setBootstrapping(false);
      return;
    }

    api.me(token)
      .then((response) => setUser(response.user))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      })
      .finally(() => setBootstrapping(false));
  }, [token]);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  useEffect(() => {
    if (!token || tasks.every((task) => !["pending", "running"].includes(task.status))) {
      return undefined;
    }

    const timer = window.setInterval(refreshTasks, 3000);
    return () => window.clearInterval(timer);
  }, [refreshTasks, tasks, token]);

  function handleAuthenticated(nextUser: User, nextToken: string) {
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setTasks([]);
    setSelectedTask(undefined);
  }

  async function createTask(input: { title: string; inputText: string; operation: Operation }) {
    if (!token) {
      return;
    }

    setNotice("");
    try {
      const response = await api.createTask(token, input);
      setTasks((current) => [response.task, ...current]);
      setSelectedTask(response.task);
      setNotice("Task queued successfully.");
    } catch (error) {
      setNotice(error instanceof ApiError ? error.message : "Could not create task");
    }
  }

  async function selectTask(task: Task) {
    if (!token) {
      return;
    }

    setSelectedTask(task);
    try {
      const response = await api.getTask(token, task._id);
      setSelectedTask(response.task);
    } catch (error) {
      setNotice(error instanceof ApiError ? error.message : "Could not load task");
    }
  }

  async function retryTask(taskId: string) {
    if (!token) {
      return;
    }

    try {
      const response = await api.retryTask(token, taskId);
      setSelectedTask(response.task);
      await refreshTasks();
    } catch (error) {
      setNotice(error instanceof ApiError ? error.message : "Could not retry task");
    }
  }

  if (bootstrapping) {
    return (
      <div className="loading-screen">
        <RefreshCw className="spin" size={24} aria-hidden="true" />
      </div>
    );
  }

  if (!token || !user) {
    return <AuthPanel onAuthenticated={handleAuthenticated} />;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">TaskForge</p>
          <h1>Processing console</h1>
        </div>
        <div className="topbar-actions">
          <span>{user.name}</span>
          <button className="icon-button" type="button" onClick={logout} title="Logout">
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      {notice ? <div className="notice">{notice}</div> : null}

      <section className="metrics" aria-label="Task status summary">
        <div className="metric">
          <span>Pending</span>
          <strong>{metrics.pending}</strong>
        </div>
        <div className="metric">
          <span>Running</span>
          <strong>{metrics.running}</strong>
        </div>
        <div className="metric">
          <span>Success</span>
          <strong>{metrics.success}</strong>
        </div>
        <div className="metric">
          <span>Failed</span>
          <strong>{metrics.failed}</strong>
        </div>
      </section>

      <div className="workspace-grid">
        <TaskComposer onCreate={createTask} />
        <TaskList
          tasks={tasks}
          activeTaskId={selectedTask?._id}
          statusFilter={statusFilter}
          loading={loading}
          onRefresh={refreshTasks}
          onSelect={selectTask}
          onStatusFilter={setStatusFilter}
        />
        <TaskDetail task={selectedTask} onRetry={retryTask} />
      </div>
    </main>
  );
}
