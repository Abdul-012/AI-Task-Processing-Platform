import { RotateCcw, TerminalSquare } from "lucide-react";
import type { Task } from "../types/api";
import { StatusBadge } from "./StatusBadge";

interface TaskDetailProps {
  task?: Task;
  onRetry(taskId: string): void;
}

function renderResult(result: Task["result"]) {
  if (result === null || result === undefined) {
    return "No result yet";
  }

  return typeof result === "number" ? result.toString() : result;
}

export function TaskDetail({ task, onRetry }: TaskDetailProps) {
  if (!task) {
    return (
      <section className="panel detail-panel" aria-label="Task details">
        <div className="empty-state">Select a task to inspect its input, logs, and result.</div>
      </section>
    );
  }

  return (
    <section className="panel detail-panel" aria-labelledby="task-detail-title">
      <div className="detail-header">
        <div>
          <h2 id="task-detail-title">{task.title}</h2>
          <p>{task.operation.replace("_", " ")}</p>
        </div>
        <StatusBadge status={task.status} />
      </div>

      <div className="detail-grid">
        <div>
          <span className="field-label">Created</span>
          <strong>{new Date(task.createdAt).toLocaleString()}</strong>
        </div>
        <div>
          <span className="field-label">Completed</span>
          <strong>{task.completedAt ? new Date(task.completedAt).toLocaleString() : "Waiting"}</strong>
        </div>
      </div>

      {task.error ? <p className="task-error">{task.error}</p> : null}

      {task.status === "failed" ? (
        <button className="secondary-action" type="button" onClick={() => onRetry(task._id)}>
          <RotateCcw size={18} aria-hidden="true" />
          Retry
        </button>
      ) : null}

      <div className="result-block">
        <span className="field-label">Result</span>
        <pre>{renderResult(task.result)}</pre>
      </div>

      {task.inputText ? (
        <div className="result-block">
          <span className="field-label">Input</span>
          <pre>{task.inputText}</pre>
        </div>
      ) : null}

      <div className="logs">
        <div className="section-heading">
          <TerminalSquare size={20} aria-hidden="true" />
          <h3>Logs</h3>
        </div>
        {task.logs.length === 0 ? (
          <div className="empty-state compact">No logs recorded.</div>
        ) : (
          task.logs.map((log, index) => (
            <div className={`log-line log-${log.level}`} key={`${log.timestamp}-${index}`}>
              <time>{new Date(log.timestamp).toLocaleTimeString()}</time>
              <span>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
