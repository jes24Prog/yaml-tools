import { useMemo } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { diffYamlSources, type DiffChange } from "../../services/diffService";
import { ToolButton, ToolPage, YamlSourcePanel, editorThemeFor, Stat } from "../shared/ToolShell";
import { useToolSources } from "../shared/hooks";

const KIND_STYLE: Record<DiffChange["kind"], string> = {
  added: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  removed: "border-red-500/40 bg-red-500/10 text-red-400",
  changed: "border-amber-500/40 bg-amber-500/10 text-amber-400",
};

export default function DiffTool() {
  const { themeMode } = useWorkbench();
  const { left, setLeft, right, setRight, loadLeftFromActive, loadRightFromActive } = useToolSources();
  const theme = editorThemeFor(themeMode);

  const result = useMemo(() => diffYamlSources(left, right), [left, right]);

  return (
    <ToolPage
      icon="diff"
      title="Diff YAML"
      description="Compare two YAML documents. The tree diff lists added, removed and changed values; the unified view shows a line diff."
      actions={
        <>
          <ToolButton onClick={loadLeftFromActive}>Left ← active doc</ToolButton>
          <ToolButton onClick={loadRightFromActive}>Right ← active doc</ToolButton>
        </>
      }
    >
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex flex-none flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-edge-1 bg-surface-1 px-4 py-2.5 text-xs shadow-lg shadow-black/20">
          <Stat label="added" value={result.addedCount} accent="text-emerald-400" />
          <Stat label="removed" value={result.removedCount} accent="text-red-400" />
          <Stat label="changed" value={result.changedCount} accent="text-amber-400" />
          <Stat label="total changes" value={result.changes.length} accent="text-ink-strong" />
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-2">
          <YamlSourcePanel
            title="Left (before)"
            description="Original document"
            value={left}
            onChange={setLeft}
            theme={theme}
            minHeight="min-h-64"
          />
          <YamlSourcePanel
            title="Right (after)"
            description="Updated document"
            value={right}
            onChange={setRight}
            theme={theme}
            minHeight="min-h-64"
          />
        </div>

        {result.changes.length > 0 && (
          <>
            <div className="flex-none overflow-hidden rounded-xl border border-edge-1 bg-surface-1 shadow-lg shadow-black/20">
              <header className="flex-none border-b border-edge-1 bg-surface-2 px-4 py-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">Tree diff ({result.changes.length})</h3>
              </header>
              <div className="max-h-80 overflow-auto">
                <ul className="divide-y divide-edge-0">
                  {result.changes.map((change) => (
                    <li key={`${change.kind}-${change.path}`} className="px-4 py-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${KIND_STYLE[change.kind]}`}>
                          {change.kind}
                        </span>
                        <code className="break-all font-mono text-xs text-amber-400">{change.path}</code>
                      </div>
                      <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {change.oldValue !== "" && (
                          <div className="rounded-md border border-red-500/30 bg-red-500/5 p-2">
                            <div className="text-[10px] font-semibold uppercase text-red-400">Old</div>
                            <pre className="mt-0.5 whitespace-pre-wrap break-all font-mono text-xs text-ink-muted">{change.oldValue}</pre>
                          </div>
                        )}
                        {change.newValue !== "" && (
                          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2">
                            <div className="text-[10px] font-semibold uppercase text-emerald-400">New</div>
                            <pre className="mt-0.5 whitespace-pre-wrap break-all font-mono text-xs text-ink">{change.newValue}</pre>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex-none overflow-hidden rounded-xl border border-edge-1 bg-surface-1 shadow-lg shadow-black/20">
              <header className="flex-none border-b border-edge-1 bg-surface-2 px-4 py-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">Unified diff</h3>
              </header>
              <pre className="max-h-72 overflow-auto p-4 font-mono text-xs leading-relaxed text-ink">{result.unified}</pre>
            </div>
          </>
        )}
        {result.changes.length === 0 && (
          <div className="flex-none rounded-xl border border-dashed border-edge-1 p-6 text-center text-xs text-ink-faint">
            {left.trim() === "" && right.trim() === ""
              ? "Load two documents to compare."
              : "No differences detected."}
          </div>
        )}
      </div>
    </ToolPage>
  );
}
