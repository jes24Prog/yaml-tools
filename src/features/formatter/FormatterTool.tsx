import { useState } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { formatYamlText, type QuoteStyle, type SortMode } from "../../services/formatterService";
import { ToolButton, ToolPage, YamlSourcePanel, OutputView, editorThemeFor } from "../shared/ToolShell";
import { useToolSource } from "../shared/hooks";

export default function FormatterTool() {
  const { themeMode } = useWorkbench();
  const { source, setSource, loadFromActive, applyToActive } = useToolSource();
  const theme = editorThemeFor(themeMode);

  const [indent, setIndent] = useState(2);
  const [quoteStyle, setQuoteStyle] = useState<QuoteStyle>("auto");
  const [sortMode, setSortMode] = useState<SortMode>("none");
  const [priority, setPriority] = useState("apiVersion, kind, metadata, spec, template");
  const [finalNewline, setFinalNewline] = useState(true);

  const result = formatYamlText(source, {
    indent,
    quoteStyle,
    sortMode,
    keyPriority: priority.split(",").map((key) => key.trim()).filter(Boolean),
    finalNewline,
  });

  return (
    <ToolPage
      icon="format"
      title="YAML Formatter"
      description="Re-indent, choose quote style, sort keys and normalize the active document."
      actions={<ToolButton onClick={loadFromActive}>Load from active document</ToolButton>}
    >
      <div className="grid h-full min-h-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col gap-4">
          <div className="flex flex-none flex-wrap items-end gap-x-6 gap-y-4 rounded-xl border border-edge-1 bg-surface-1 px-4 py-3 shadow-lg shadow-black/20">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-ink-muted">Indent</span>
              <input
                type="number"
                value={indent}
                min={1}
                max={8}
                onChange={(event) => setIndent(Number(event.target.value))}
                className="w-20 rounded-md border border-edge-1 bg-surface-0 px-2.5 py-1.5 text-sm text-ink outline-none focus:border-emerald-500/50"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-ink-muted">Quote style</span>
              <select
                value={quoteStyle}
                onChange={(event) => setQuoteStyle(event.target.value as QuoteStyle)}
                className="cursor-pointer rounded-md border border-edge-1 bg-surface-0 px-2.5 py-1.5 text-sm text-ink outline-none focus:border-emerald-500/50"
              >
                <option value="auto">Auto</option>
                <option value="single">Single quotes</option>
                <option value="double">Double quotes</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-ink-muted">Sort keys</span>
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
                className="cursor-pointer rounded-md border border-edge-1 bg-surface-0 px-2.5 py-1.5 text-sm text-ink outline-none focus:border-emerald-500/50"
              >
                <option value="none">None</option>
                <option value="alpha-asc">Alphabetical (A–Z)</option>
                <option value="alpha-desc">Alphabetical (Z–A)</option>
                <option value="priority">Priority list</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-ink-muted">Final newline</span>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={finalNewline}
                  onChange={(event) => setFinalNewline(event.target.checked)}
                  className="h-3.5 w-3.5 rounded accent-emerald-500"
                />
                Include
              </label>
            </label>
            {sortMode === "priority" && (
              <label className="flex min-w-[220px] flex-col gap-1">
                <span className="text-xs font-semibold text-ink-muted">Key priority (comma separated)</span>
                <input
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  className="w-full rounded-md border border-edge-1 bg-surface-0 px-2.5 py-1.5 font-mono text-xs text-ink outline-none focus:border-emerald-500/50"
                />
              </label>
            )}
          </div>
          <YamlSourcePanel
            title="Input"
            description="YAML to format"
            value={source}
            onChange={setSource}
            theme={theme}
            minHeight="min-h-72"
          />
        </div>
        <OutputView
          title="Formatted output"
          value={result.ok ? result.text : ""}
          error={result.ok ? null : result.error}
          onApply={() => applyToActive(result.ok ? result.text : source)}
        />
      </div>
    </ToolPage>
  );
}
