interface StatusMessageProps {
  message: string;
  kind?: "success" | "info" | "warning" | "error";
}

const STYLES: Record<NonNullable<StatusMessageProps["kind"]>, string> = {
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  info: "border-sky-500/40 bg-sky-500/10 text-sky-400",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  error: "border-red-500/40 bg-red-500/10 text-red-400",
};

export function StatusMessage({ message, kind = "info" }: StatusMessageProps) {
  if (!message) {
    return null;
  }
  return (
    <div
      role="status"
      className={`rounded-md border px-3 py-2 text-xs font-medium ${STYLES[kind]}`}
    >
      {message}
    </div>
  );
}
