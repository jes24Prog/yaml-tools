import { useCallback, type ReactNode } from "react";
import { copyToClipboard } from "../utils/clipboard";
import { ToolGlyph } from "./Icons";

const BUTTON_VARIANTS = {
  primary:
    "bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-400/60 border border-emerald-500/40",
  secondary:
    "bg-surface-2 text-ink-strong hover:bg-surface-3 focus-visible:ring-edge-1 border border-edge-1",
  ghost: "bg-transparent text-ink-muted hover:text-ink-strong hover:bg-surface-2 border border-transparent",
  danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;

export function Button({
  children,
  onClick,
  variant = "secondary",
  disabled = false,
  className = "",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function IconButton({
  onClick,
  title,
  children,
  disabled = false,
}: {
  onClick?: () => void;
  title: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-ink-muted transition-colors hover:bg-surface-3 hover:text-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-1 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors ${
          checked ? "border-emerald-500/50 bg-emerald-600" : "border-edge-1 bg-surface-3"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-[2px]"
          }`}
        />
      </button>
      <span className="text-xs font-medium text-ink">{label}</span>
    </label>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-ink-muted">{label}</span>
      {children}
      {hint && <span className="text-[11px] leading-snug text-ink-faint">{hint}</span>}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  mono = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  mono?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={`w-full rounded-lg border border-edge-1 bg-surface-1 px-3 py-1.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-edge-1 focus:ring-2 focus:ring-emerald-500/30 ${
        mono ? "font-mono" : ""
      }`}
    />
  );
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  ariaLabel,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  ariaLabel?: string;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      aria-label={ariaLabel}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-full rounded-lg border border-edge-1 bg-surface-1 px-3 py-1.5 text-sm text-ink outline-none transition-colors focus:border-edge-1 focus:ring-2 focus:ring-emerald-500/30"
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  ariaLabel?: string;
}) {
  return (
    <select
      value={value}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value)}
      className="w-full cursor-pointer rounded-lg border border-edge-1 bg-surface-1 px-3 py-1.5 text-sm text-ink outline-none transition-colors focus:border-edge-1 focus:ring-2 focus:ring-emerald-500/30"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-surface-2">
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 rounded-lg border border-edge-1 bg-surface-2 p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            value === option.value
              ? "bg-surface-3 text-ink-strong shadow-sm"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 5,
  mono = false,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
  ariaLabel?: string;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={`w-full resize-y rounded-lg border border-edge-1 bg-surface-1 px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-edge-1 focus:ring-2 focus:ring-emerald-500/30 ${
        mono ? "font-mono text-xs leading-relaxed" : ""
      }`}
    />
  );
}

export function Panel({
  title,
  toolbar,
  children,
  className = "",
  description,
}: {
  title: string;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: string;
}) {
  return (
    <section className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-edge-1 bg-surface-1 ${className}`}>
      <header className="flex flex-none flex-wrap items-center justify-between gap-2 border-b border-edge-1 bg-surface-2 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">{title}</h3>
          {description && <span className="text-[11px] text-ink-faint">{description}</span>}
        </div>
        {toolbar}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

export function CodeOutput({
  text,
  onInsert,
  insertLabel = "Insert into document",
  maxHeight = "max-h-96",
}: {
  text: string;
  onInsert?: () => void;
  insertLabel?: string;
  maxHeight?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(text);
    setCopied(ok);
    window.setTimeout(() => setCopied(false), 1600);
  }, [text]);

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-edge-1 bg-surface-0">
      <div className="flex flex-none items-center justify-between gap-2 border-b border-edge-0 bg-surface-2 px-3 py-1.5">
        <span className="font-mono text-[11px] text-ink-faint">
          {text.split("\n").length} lines · {text.length} chars
        </span>
        <div className="flex items-center gap-1">
          {onInsert && (
            <Button onClick={onInsert} variant="ghost" className="px-2 py-0.5">
              <ToolGlyph icon="file" className="h-3 w-3" />
              {insertLabel}
            </Button>
          )}
          <Button onClick={handleCopy} variant="ghost" className="px-2 py-0.5">
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </div>
      <pre className={`min-h-0 flex-1 overflow-auto p-3 font-mono text-xs leading-relaxed text-ink ${maxHeight}`}>{text}</pre>
    </div>
  );
}

import * as React from "react";

export function StatBadge({ label, value, accent = "text-ink-strong" }: { label: string; value: ReactNode; accent?: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`font-mono text-sm font-semibold ${accent}`}>{value}</span>
      <span className="text-xs text-ink-muted">{label}</span>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-24 items-center justify-center rounded-lg border border-dashed border-edge-1 px-4 py-8 text-center text-sm text-ink-muted">
      {message}
    </div>
  );
}
