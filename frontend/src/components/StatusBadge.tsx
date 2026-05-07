import type { TaskStatus } from "../types/api";

interface StatusBadgeProps {
  status: TaskStatus;
}

const labels: Record<TaskStatus, string> = {
  pending: "Pending",
  running: "Running",
  success: "Success",
  failed: "Failed"
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status status-${status}`}>{labels[status]}</span>;
}
