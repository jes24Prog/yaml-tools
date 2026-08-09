import { useMemo, useState } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { stringify } from "yaml";
import {
  MERGE_STRATEGIES,
  RESOLUTION_OPTIONS,
  mergeDocuments,
  type MergeStrategy,
  type ResolutionChoice,
} from "../../services/mergeService";
import { parseYamlObject } from "../../utils/yamlParser";
import { ToolButton, ToolPage, YamlSourcePanel, OutputView, editorThemeFor, Stat } from "../shared/ToolShell";
import { useToolSources } from "../shared/hooks";

export default function MergeTool() {
  const { themeMode, replaceActiveDocument, notify } = useWorkbench();
  const { left, setLeft, right, setRight, loadLeftFromActive, loadRightFromActive } = useToolSources();
  const theme = editorThemeFor(themeMode);

  const [strategy, setStrategy] = useState<MergeStrategy>("right-wins");
  const [resolutions, setResolutions] = useState<Record<string, ResolutionChoice>>({});

  const parsed = useMemo(() => {
    const leftResult = parseYamlObject(left);
    const rightResult = parseYamlObject(right);
    return { leftResult, rightResult };
  }, [left, right]);

  const merged = useMemo(() => {
    if (!parsed.leftResult.value || !parsed.rightResult.value || parsed.leftResult.error || parsed.rightResult.error) {
      return null;
    }
    return mergeDocuments(parsed.leftResult.value, parsed.rightResult.value, strategy, resolutions);
  }, [parsed, strategy, resolutions]);

  const outputText = merged ? stringify(merged.output, { lineWidth: 0 }) : "";

  const setResolution = (path: string, value: ResolutionChoice) => {
    setResolutions((current) => ({ ...current, [path]: value }));
  };

  const errorText = parsed.leftResult.error?.message ?? parsed.rightResult.error?.message ?? null;

  return (
    <ToolPage
      icon="merge"
      title="Merge YAML"
      description="Merge two documents with a configurable strategy. Conflicts can be resolved per path."
      actions={
        <>
          <ToolButton onClick={loadLeftFromActive}>Left ← active doc</ToolButton>
          <ToolButton onClick={loadRightFromActive}>Right ← active doc</ToolButton>
        </>
      }
    >
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex flex-none flex-wrap items-center gap-4 rounded-xl border border-edge-1 bg-surface-1 px-4 py-3 shadow-lg shadow-black/20">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink-muted">Strategy</span>
            <select
              value={strategy}
              onChange={(event) => setStrategy(event.target.value as MergeStrategy)}
              className="cursor-pointer rounded-md border border-edge-1 bg-surface-0 px-2.5 py-1.5 text-sm text-ink outline-none focus:border-emerald-500/50"
            >
              {MERGE_STRATEGIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <p className="max-w-md flex-1 text-xs leading-relaxed text-ink-faint">
            {MERGE_STRATEGIES.find((option) => option.value === strategy)?.hint}
          </p>
          {merged && (
            <div className="flex items-center gap-5 text-xs">
              <Stat label="conflicts" value={merged.conflicts.length} accent={merged.conflicts.length > 0 ? "text-amber-400" : "text-emerald-400"} />
              <Stat label="values updated" value={merged.keysUpdated} accent="text-emerald-400" />
            </div>
          )}
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-2">
          <YamlSourcePanel
            title="Left (input 1)"
            value={left}
            onChange={setLeft}
            error={parsed.leftResult.error?.message ?? null}
            theme={theme}
            minHeight="min-h-64"
          />
          <YamlSourcePanel
            title="Right (input 2)"
            value={right}
            onChange={setRight}
            error={parsed.rightResult.error?.message ?? null}
            theme={theme}
            minHeight="min-h-64"
          />
        </div>

        {merged && merged.conflicts.length > 0 && (
          <div className="flex-none overflow-hidden rounded-xl border border-edge-1 bg-surface-1 shadow-lg shadow-black/20">
            <header className="flex-none border-b border-edge-1 bg-surface-2 px-4 py-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">Conflicts ({merged.conflicts.length})</h3>
            </header>
            <ul className="max-h-80 divide-y divide-edge-0 overflow-auto">
              {merged.conflicts.map((conflict) => (
                <li key={conflict.path} className="px-4 py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <code className="break-all font-mono text-xs text-amber-400">{conflict.path}</code>
                    <select
                      value={resolutions[conflict.path] ?? conflict.resolved}
                      onChange={(event) => setResolution(conflict.path, event.target.value as ResolutionChoice)}
                      className="cursor-pointer rounded-md border border-edge-1 bg-surface-0 px-2 py-1 text-xs text-ink outline-none focus:border-emerald-500/50"
                    >
                      {RESOLUTION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded-md border border-edge-0 bg-surface-2 p-2">
                      <div className="text-[10px] font-semibold uppercase text-ink-faint">Left</div>
                      <pre className="mt-0.5 whitespace-pre-wrap break-all font-mono text-xs text-ink-muted">{conflict.left}</pre>
                    </div>
                    <div className="rounded-md border border-edge-0 bg-surface-2 p-2">
                      <div className="text-[10px] font-semibold uppercase text-ink-faint">Right</div>
                      <pre className="mt-0.5 whitespace-pre-wrap break-all font-mono text-xs text-ink-muted">{conflict.right}</pre>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <OutputView
          title="Merged output"
          value={outputText}
          error={errorText}
          onApply={() => {
            if (outputText) {
              replaceActiveDocument(outputText);
              notify("Applied merged output to the active document.", "success");
            }
          }}
          emptyHint="Both documents must be valid maps to produce a merge."
        />
      </div>
    </ToolPage>
  );
}
