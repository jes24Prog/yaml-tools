import type { ReactNode } from "react";
import type { EditorKind } from "../types/yaml";

export interface ToolbarActionHandlers {
  onUpdateValues: () => void;
  onFormat: (target: EditorKind) => void;
  onCopyOutput: () => void;
  onDownloadOutput: () => void;
  onClear: () => void;
  onSwapInputs: () => void;
  onLoadExample: () => void;
  onClearSavedData: () => void;
  onToggleAutoUpdate: (value: boolean) => void;
  onToggleShowChanges: (value: boolean) => void;
  onToggleTheme: (theme: "dark" | "light") => void;
}

interface ToolbarProps {
  autoUpdate: boolean;
  showChanges: boolean;
  theme: "dark" | "light";
  isProcessing: boolean;
  copyStatus: "idle" | "copied" | "failed";
  formatTarget: EditorKind;
  onFormatTargetChange: (target: EditorKind) => void;
  handlers: ToolbarActionHandlers;
}

const FORMAT_TARGETS: { value: EditorKind; label: string }[] = [
  { value: "primary", label: "Primary" },
  { value: "target", label: "Target" },
  { value: "output", label: "Output" },
];

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  icon?: ReactNode;
}

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-400/60 shadow-md shadow-emerald-950/40 border border-emerald-500/40",
  secondary:
    "bg-surface-2 text-ink-strong hover:bg-surface-3 focus-visible:ring-edge-1 border border-edge-1",
  ghost:
    "bg-transparent text-ink-muted hover:text-ink-strong hover:bg-surface-2 focus-visible:ring-edge-1 border border-transparent",
  danger:
    "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30",
};

function ToolbarButton({
  label,
  onClick,
  variant = "secondary",
  disabled = false,
  icon,
}: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]}`}
    >
      {icon}
      {label}
    </button>
  );
}

function Toggle({
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

function IconCopy() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z" />
      <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M2.75 14A1.75 1.75 0 011 12.25v-2.5a.75.75 0 011.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 00.25-.25v-2.5a.75.75 0 011.5 0v2.5A1.75 1.75 0 0113.25 14H2.75z" />
      <path d="M7.25 1.75a.75.75 0 011.5 0v5.19l1.72-1.72a.75.75 0 111.06 1.06l-3 3a.75.75 0 01-1.06 0l-3-3a.75.75 0 111.06-1.06l1.72 1.72V1.75z" />
    </svg>
  );
}

function IconSwap() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M4.22 1.22a.75.75 0 011.06 0l2.5 2.5a.75.75 0 010 1.06L5.28 7.28a.75.75 0 01-1.06-1.06L5.94 4.75H1.75A.75.75 0 011 4c0-.414.336-.75.75-.75h4.19L4.22 2.28a.75.75 0 010-1.06z" />
      <path d="M10.72 1.5H9.25a.75.75 0 000 1.5h1.47c.138 0 .25.112.25.25v6.19l-1.72-1.72a.75.75 0 00-1.06 1.06l3 3c.293.293.767.293 1.06 0l3-3a.75.75 0 10-1.06-1.06l-1.72 1.72V3.25A1.75 1.75 0 0010.72 1.5z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M11 1.75V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675l.66 6.6a1.75 1.75 0 001.743 1.65h2.202c.9 0 1.652-.681 1.743-1.57l.66-6.6a.75.75 0 011.497.15l-.66 6.6A3.25 3.25 0 019.102 16H6.899a3.25 3.25 0 01-3.24-2.925l-.66-6.6a.75.75 0 111.497-.15z" />
    </svg>
  );
}

function IconSparkle() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0l1.669 5.081L14.75 6.75l-5.081 1.669L8 13.5 6.331 8.419L1.25 6.75l5.081-1.669L8 0z" />
    </svg>
  );
}

export function Toolbar({
  autoUpdate,
  showChanges,
  theme,
  isProcessing,
  copyStatus,
  formatTarget,
  onFormatTargetChange,
  handlers,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <ToolbarButton
          label="Update Values"
          variant="primary"
          disabled={isProcessing}
          onClick={handlers.onUpdateValues}
          icon={<IconSparkle />}
        />
        <div className="flex items-center overflow-hidden rounded-lg border border-edge-1 bg-surface-2">
          <select
            aria-label="Format target"
            value={formatTarget}
            onChange={(event) => onFormatTargetChange(event.target.value as EditorKind)}
            className="cursor-pointer bg-transparent px-1.5 py-1.5 text-xs font-medium text-ink outline-none hover:text-ink-strong"
          >
            {FORMAT_TARGETS.map((target) => (
              <option key={target.value} value={target.value} className="bg-surface-2">
                {target.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => handlers.onFormat(formatTarget)}
            className="inline-flex items-center gap-1.5 border-l border-edge-1 px-3 py-1.5 text-xs font-semibold text-ink-strong transition-colors hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-1"
          >
            Format
          </button>
        </div>
        <ToolbarButton label="Copy Output" onClick={handlers.onCopyOutput} icon={<IconCopy />} />
        <ToolbarButton
          label="Download YAML"
          onClick={handlers.onDownloadOutput}
          icon={<IconDownload />}
        />
      </div>

      <div className="hidden h-5 w-px bg-edge-1 sm:block" aria-hidden="true" />

      <div className="flex flex-wrap items-center gap-2">
        <ToolbarButton
          label="Load Example"
          onClick={handlers.onLoadExample}
          icon={<IconSparkle />}
        />
        <ToolbarButton label="Swap Inputs" onClick={handlers.onSwapInputs} icon={<IconSwap />} />
        <ToolbarButton label="Clear" variant="danger" onClick={handlers.onClear} icon={<IconTrash />} />
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2">
        <Toggle
          checked={autoUpdate}
          onChange={handlers.onToggleAutoUpdate}
          label="Auto Update"
        />
        <Toggle
          checked={showChanges}
          onChange={handlers.onToggleShowChanges}
          label="Show Changes"
        />
        <div className="flex items-center gap-1 rounded-lg border border-edge-1 bg-surface-2 p-0.5">
          <button
            type="button"
            onClick={() => handlers.onToggleTheme("dark")}
            aria-label="Dark theme"
            className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              theme === "dark" ? "bg-surface-3 text-ink-strong" : "text-ink-muted hover:text-ink"
            }`}
          >
            Dark
          </button>
          <button
            type="button"
            onClick={() => handlers.onToggleTheme("light")}
            aria-label="Light theme"
            className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              theme === "light" ? "bg-surface-3 text-ink-strong" : "text-ink-muted hover:text-ink"
            }`}
          >
            Light
          </button>
        </div>
        {copyStatus !== "idle" && (
          <span
            className={`text-xs font-semibold ${
              copyStatus === "copied" ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {copyStatus === "copied" ? "Copied!" : "Copy failed"}
          </span>
        )}
      </div>
    </div>
  );
}
