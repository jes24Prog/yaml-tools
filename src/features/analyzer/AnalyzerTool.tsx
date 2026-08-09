import { useMemo } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { analyzeYaml } from "../../services/analyzerService";
import { ToolPage, Stat } from "../shared/ToolShell";

export default function AnalyzerTool() {
  const { activeDocument } = useWorkbench();
  const { stats, error } = useMemo(() => analyzeYaml(activeDocument.content), [activeDocument.content]);

  const summary = stats
    ? [
        { label: "total keys", value: stats.totalKeys, accent: "text-ink-strong" },
        { label: "total values", value: stats.totalValues, accent: "text-emerald-400" },
        { label: "max depth", value: stats.maxDepth, accent: "text-amber-400" },
        { label: "objects", value: stats.objectCount, accent: "text-sky-400" },
        { label: "arrays", value: stats.arrayCount, accent: "text-violet-400" },
        { label: "strings", value: stats.stringCount, accent: "text-pink-400" },
        { label: "numbers", value: stats.numberCount, accent: "text-cyan-400" },
        { label: "booleans", value: stats.booleanCount, accent: "text-lime-400" },
        { label: "nulls", value: stats.nullCount, accent: "text-red-400" },
      ]
    : [];

  return (
    <ToolPage
      icon="analyze"
      title="YAML Analyzer"
      description="Structure and statistics of the active document: counts, depth, empty values and long strings."
    >
      {error ? (
        <div className="flex-none rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-400">{error}</div>
      ) : stats ? (
        <div className="flex min-h-0 flex-col gap-4">
          <div className="grid grid-cols-3 gap-3 rounded-xl border border-edge-1 bg-surface-1 p-4 shadow-lg shadow-black/20 sm:grid-cols-5 lg:grid-cols-9">
            {summary.map((item) => (
              <Stat key={item.label} label={item.label} value={item.value} accent={item.accent} />
            ))}
          </div>

          <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-edge-1 bg-surface-1 shadow-lg shadow-black/20">
              <header className="flex-none border-b border-edge-1 bg-surface-2 px-4 py-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                  Empty values ({stats.emptyValues.length})
                </h3>
              </header>
              {stats.emptyValues.length === 0 ? (
                <div className="p-4 text-xs text-ink-faint">None.</div>
              ) : (
                <ul className="min-h-0 flex-1 divide-y divide-edge-0 overflow-auto">
                  {stats.emptyValues.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 px-4 py-2">
                      <code className="min-w-0 flex-1 break-all font-mono text-xs text-ink">{item.path}</code>
                      <code className="shrink-0 font-mono text-xs text-amber-400">{item.value}</code>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-edge-1 bg-surface-1 shadow-lg shadow-black/20">
              <header className="flex-none border-b border-edge-1 bg-surface-2 px-4 py-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-sky-400">
                  Long strings &gt; 120 chars ({stats.longStrings.length})
                </h3>
              </header>
              {stats.longStrings.length === 0 ? (
                <div className="p-4 text-xs text-ink-faint">None.</div>
              ) : (
                <ul className="min-h-0 flex-1 divide-y divide-edge-0 overflow-auto">
                  {stats.longStrings.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 px-4 py-2">
                      <code className="min-w-0 flex-1 break-all font-mono text-xs text-ink">{item.path}</code>
                      <code className="shrink-0 font-mono text-xs text-sky-400">{item.length}</code>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </ToolPage>
  );
}
