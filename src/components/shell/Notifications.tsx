import { useWorkbench } from "../../app/workbenchContext";
import type { NotifyKind } from "../../types/workbench";
import { IconButton } from "../ui";

const KIND_STYLE: Record<NotifyKind, { dot: string; border: string }> = {
  success: { dot: "bg-emerald-400", border: "border-emerald-500/30" },
  info: { dot: "bg-sky-400", border: "border-sky-500/30" },
  warning: { dot: "bg-amber-400", border: "border-amber-500/30" },
  error: { dot: "bg-red-400", border: "border-red-500/30" },
};

export function Notifications() {
  const { notifications, dismissNotification } = useWorkbench();

  return (
    <div className="pointer-events-none fixed right-4 top-14 z-50 flex w-80 flex-col gap-2">
      {notifications.map((notification) => {
        const style = KIND_STYLE[notification.kind];
        return (
          <div
            key={notification.id}
            className={`pointer-events-auto flex items-start gap-2 rounded-lg border ${style.border} bg-surface-2 px-3 py-2.5 shadow-lg`}
            role="status"
          >
            <span className={`mt-1.5 h-2 w-2 flex-none rounded-full ${style.dot}`} />
            <span className="flex-1 text-xs leading-relaxed text-ink">{notification.message}</span>
            <IconButton title="Dismiss" onClick={() => dismissNotification(notification.id)}>
              <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor" aria-hidden="true">
                <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
              </svg>
            </IconButton>
          </div>
        );
      })}
    </div>
  );
}
