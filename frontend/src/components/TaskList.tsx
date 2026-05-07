import { ClipboardList, RefreshCw } from "lucide-react";
import type { Task, TaskStatus } from "../types/api";
import { StatusBadge } from "./StatusBadge";

interface TaskListProps {
  tasks: Task[];
  activeTaskId?: string;
  statusFilter: TaskStatus | "all";
  loading: boolean;
  onRefresh(): void;
  onSelect(task: Task): void;
  onStatusFilter(status: TaskStatus | "all"): void;
}

const statusOptions: Array<TaskStatus | "all"> = [
  "all",
  "pending",
  "running",
  "success",
  "failed"
];

export function TaskList({
  tasks,
  activeTaskId,
  statusFilter,
  loading,
  onRefresh,
  onSelect,
  onStatusFilter
}: TaskListProps) {
  return (
    <section className="panel tasks-panel" aria-labelledby="task-list-title">
      <div className="panel-toolbar">
        <div className="section-heading">
          <ClipboardList size={20} aria-hidden="true" />
          <h2 id="task-list-title">Tasks</h2>
        </div>
        <button className="icon-button" type="button" onClick={onRefresh} title="Refresh tasks">
          <RefreshCw size={18} className={loading ? "spin" : ""} aria-hidden="true" />
        </button>
      </div>

      <div className="filter-row" aria-label="Task status filter">
        {statusOptions.map((status) => (
          <button
            key={status}
            className={statusFilter === status ? "active" : ""}
            type="button"
            onClick={() => onStatusFilter(status)}
          >
            {status === "all" ? "All" : status}
          </button>
        ))}
      </div>

      <div className="task-list">
        {tasks.length === 0 ? (
          <div className="empty-state">No tasks match this view.</div>
        ) : (
          tasks.map((task) => (
            <button
              key={task._id}
              type="button"
              className={`task-row ${activeTaskId === task._id ? "selected" : ""}`}
              onClick={() => onSelect(task)}
            >
              <span className="task-title">{task.title}</span>
              <span className="task-meta">{task.operation.replace("_", " ")}</span>
              <StatusBadge status={task.status} />
              <span className="task-time">
                {new Intl.DateTimeFormat(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                }).format(new Date(task.createdAt))}
              </span>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
