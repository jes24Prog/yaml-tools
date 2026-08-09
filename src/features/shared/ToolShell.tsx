import { useCallback, useState, type ReactNode } from "react";
import { ToolGlyph } from "../../components/Icons";
import { YamlEditor } from "../../components/YamlEditor";
import type { ToolIcon } from "../../types/workbench";
import { copyToClipboard } from "../../utils/clipboard";
import { downloadYaml } from "../../utils/download";

export function editorThemeFor(themeMode: "dark" | "light"): "yaml-tool-dark" | "yaml-tool-light" {
  return themeMode === "dark" ? "yaml-tool-dark" : "yaml-tool-light";
}

export function ToolPage({
  icon,
  title,
  description,
  children,
  actions,
}: {
  icon: ToolIcon;
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-none flex-wrap items-start justify-between gap-3 border-b border-edge-1 bg-surface-1/60 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-edge-1 bg-surface-2 text-emerald-400">
            <ToolGlyph icon={icon} className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink-strong">{title}</h2>
            <p className="mt-0.5 max-w-3xl text-xs leading-relaxed text-ink-muted">{description}</p>
          </div>
        </div>
        {actions && <div className="flex flex-none items-center gap-2">{actions}</div>}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
    </div>
  );
}

export function ToolActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export function ToolButton({
  children,
  onClick,
  variant = "secondary",
  disabled = false,
  title,
  primary = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  title?: string;
  primary?: boolean;
}) {
  const variantClass = primary
    ? "bg-emerald-600 text-white hover:bg-emerald-500 border border-emerald-500/40 shadow-sm shadow-emerald-950/40"
    : variant === "danger"
      ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
      : variant === "ghost"
        ? "bg-transparent text-ink-muted hover:text-ink-strong hover:bg-surface-2 border border-transparent"
        : "bg-surface-2 text-ink-strong hover:bg-surface-3 border border-edge-1";
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50 ${variantClass}`}
    >
      {children}
    </button>
  );
}

export function YamlSourcePanel({
  title,
  value,
  onChange,
  error,
  readOnly = false,
  toolbar,
  theme,
  minHeight = "min-h-72",
  description,
}: {
  title: string;
  value: string;
  onChange?: (value: string) => void;
  error?: string | null;
  readOnly?: boolean;
  toolbar?: ReactNode;
  theme: "yaml-tool-dark" | "yaml-tool-light";
  minHeight?: string;
  description?: string;
}) {
  return (
    <section className={`flex flex-col overflow-hidden rounded-xl border border-edge-1 bg-surface-1 shadow-lg shadow-black/20 ${minHeight}`}>
      <header className="flex flex-none flex-wrap items-center justify-between gap-2 border-b border-edge-1 bg-surface-2 px-4 py-2.5">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">{title}</h3>
          {description && <p className="text-[11px] text-ink-muted">{description}</p>}
        </div>
        {toolbar}
      </header>
      <div className="min-h-0 flex-1">
        <YamlEditor
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          theme={theme}
          ariaLabel={`${title} editor`}
        />
      </div>
      {error && (
        <div role="alert" className="flex-none border-t border-red-500/40 bg-red-500/10 px-4 py-2 text-xs text-red-300">
          {error}
        </div>
      )}
    </section>
  );
}

export function PlainTextPanel({
  title,
  value,
  onChange,
  readOnly = false,
  toolbar,
  placeholder,
  minHeight = "min-h-72",
  mono = true,
}: {
  title: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  toolbar?: ReactNode;
  placeholder?: string;
  minHeight?: string;
  mono?: boolean;
}) {
  return (
    <section className={`flex flex-col overflow-hidden rounded-xl border border-edge-1 bg-surface-1 shadow-lg shadow-black/20 ${minHeight}`}>
      <header className="flex flex-none flex-wrap items-center justify-between gap-2 border-b border-edge-1 bg-surface-2 px-4 py-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">{title}</h3>
        {toolbar}
      </header>
      <textarea
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        aria-label={title}
        className={`min-h-0 w-full flex-1 resize-none bg-transparent px-4 py-3 text-ink outline-none placeholder:text-ink-faint ${
          mono ? "font-mono text-xs leading-relaxed" : "text-sm"
        }`}
        spellCheck={false}
      />
    </section>
  );
}

export function OutputView({
  title,
  value,
  error,
  note,
  onApply,
  applyLabel = "Apply to active document",
  emptyHint = "No output yet.",
}: {
  title: string;
  value: string;
  error?: string | null;
  note?: string | null;
  onApply?: () => void;
  applyLabel?: string;
  emptyHint?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(value);
    setCopied(ok);
    window.setTimeout(() => setCopied(false), 1600);
  }, [value]);

  const hasContent = value.trim() !== "";

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-edge-1 bg-surface-1 shadow-lg shadow-black/20">
      <header className="flex flex-none flex-wrap items-center justify-between gap-2 border-b border-edge-1 bg-surface-2 px-4 py-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">{title}</h3>
        <div className="flex items-center gap-1.5">
          {onApply && (
            <ToolButton variant="ghost" onClick={onApply} disabled={!hasContent || !!error} title={applyLabel}>
              <ToolGlyph icon="file" className="h-3.5 w-3.5" />
              {applyLabel}
            </ToolButton>
          )}
          <ToolButton variant="ghost" onClick={handleCopy} disabled={!hasContent} title="Copy to clipboard">
            {copied ? "Copied!" : "Copy"}
          </ToolButton>
          <ToolButton
            variant="ghost"
            onClick={() => downloadYaml("output.yaml", value)}
            disabled={!hasContent}
            title="Download output"
          >
            Download
          </ToolButton>
        </div>
      </header>
      {error && (
        <div role="alert" className="flex-none border-b border-red-500/40 bg-red-500/10 px-4 py-2 text-xs text-red-300">
          {error}
        </div>
      )}
      {note && !error && (
        <div className="flex-none border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs text-amber-300">{note}</div>
      )}
      <div className="min-h-0 flex-1 overflow-auto">
        {hasContent ? (
          <pre className="whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed text-ink">{value}</pre>
        ) : (
          <div className="flex h-full min-h-28 items-center justify-center p-4 text-center text-xs text-ink-faint">
            {emptyHint}
          </div>
        )}
      </div>
    </section>
  );
}

export function SplitLayout({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="flex min-h-0 flex-col gap-4">{left}</div>
      <div className="flex min-h-0 flex-col gap-4">{right}</div>
    </div>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-x-5 gap-y-2">{children}</div>;
}

export function Stat({ label, value, accent = "text-ink-strong" }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`font-mono text-sm font-semibold ${accent}`}>{value}</span>
      <span className="text-xs text-ink-muted">{label}</span>
    </div>
  );
}

export function SeverityBadge({ severity }: { severity: "error" | "warning" | "info" | "high" | "medium" | "low" }) {
  const style =
    severity === "error" || severity === "high"
      ? "border-red-500/40 bg-red-500/10 text-red-400"
      : severity === "warning" || severity === "medium"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
        : "border-sky-500/40 bg-sky-500/10 text-sky-400";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style}`}>
      {severity}
    </span>
  );
}

export function PathTag({ path }: { path: string }) {
  return <code className="break-all font-mono text-xs text-amber-400">{path}</code>;
}

export function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-edge-1 p-6 text-center text-xs text-ink-faint">
      {message}
    </div>
  );
}
