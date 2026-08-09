import type { ReactNode } from "react";
import type { YamlParseError } from "../types/yaml";
import { YamlEditor } from "./YamlEditor";
import { ErrorMessage } from "./ErrorMessage";

export type PanelTone = "primary" | "target" | "output";

interface EditorPanelProps {
  title: string;
  description: string;
  value: string;
  onChange?: (value: string) => void;
  error?: YamlParseError | null;
  readOnly?: boolean;
  tone: PanelTone;
  theme: "yaml-tool-dark" | "yaml-tool-light";
  toolbar?: ReactNode;
}

const TONE_BADGE: Record<PanelTone, string> = {
  primary: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  target: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  output: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const TONE_DOT: Record<PanelTone, string> = {
  primary: "bg-violet-400",
  target: "bg-sky-400",
  output: "bg-emerald-400",
};

export function EditorPanel({
  title,
  description,
  value,
  onChange,
  error,
  readOnly = false,
  tone,
  theme,
  toolbar,
}: EditorPanelProps) {
  return (
    <section className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-edge-1 bg-surface-1 shadow-lg shadow-black/20">
      <header className="flex flex-none flex-col gap-2 border-b border-edge-1 bg-surface-2 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-4 items-center gap-1.5 rounded-full border px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider ${TONE_BADGE[tone]}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[tone]}`} aria-hidden="true" />
              {tone}
            </span>
            <h2 className="text-sm font-semibold text-ink-strong">{title}</h2>
          </div>
          {toolbar}
        </div>
        <p className="text-xs leading-relaxed text-ink-muted">{description}</p>
      </header>

      <div className="relative min-h-0 flex-1">
        <YamlEditor
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          error={error}
          theme={theme}
          ariaLabel={`${title} editor`}
        />
      </div>

      <ErrorMessage error={error} heading={readOnly ? "Unable to generate output" : "Invalid YAML"} />
    </section>
  );
}
