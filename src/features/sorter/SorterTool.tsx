import { useState } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { sortYaml, type SortOrder } from "../../services/sorterService";
import { ToolButton, ToolPage, YamlSourcePanel, OutputView, editorThemeFor } from "../shared/ToolShell";
import { useToolSource } from "../shared/hooks";

export default function SorterTool() {
  const { themeMode } = useWorkbench();
  const { source, setSource, loadFromActive, applyToActive } = useToolSource();
  const theme = editorThemeFor(themeMode);

  const [order, setOrder] = useState<SortOrder>("asc");
  const [priority, setPriority] = useState("");
  const [nested, setNested] = useState(true);

  const result = sortYaml(source, {
    order,
    priority: priority.split(",").map((key) => key.trim()).filter(Boolean),
    nested,
  });

  return (
    <ToolPage
      icon="sort"
      title="YAML Sorter"
      description="Sort map keys alphabetically or by a priority list, optionally recursing into nested maps."
      actions={<ToolButton onClick={loadFromActive}>Load from active document</ToolButton>}
    >
      <div className="grid h-full min-h-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="flex min-h-0 flex-col gap-4">
          <div className="flex flex-none flex-wrap items-end gap-x-6 gap-y-4 rounded-xl border border-edge-1 bg-surface-1 px-4 py-3 shadow-lg shadow-black/20">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-ink-muted">Order</span>
              <select
                value={order}
                onChange={(event) => setOrder(event.target.value as SortOrder)}
                className="cursor-pointer rounded-md border border-edge-1 bg-surface-0 px-2.5 py-1.5 text-sm text-ink outline-none focus:border-emerald-500/50"
              >
                <option value="asc">Ascending (A–Z)</option>
                <option value="desc">Descending (Z–A)</option>
              </select>
            </label>
            <label className="flex min-w-[240px] flex-1 flex-col gap-1">
              <span className="text-xs font-semibold text-ink-muted">Priority keys (comma separated, optional)</span>
              <input
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                placeholder="e.g. apiVersion, kind, metadata"
                className="rounded-md border border-edge-1 bg-surface-0 px-2.5 py-1.5 font-mono text-xs text-ink outline-none placeholder:text-ink-faint focus:border-emerald-500/50"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={nested}
                onChange={(event) => setNested(event.target.checked)}
                className="h-3.5 w-3.5 rounded accent-emerald-500"
              />
              Sort nested maps
            </label>
          </div>
          <YamlSourcePanel
            title="Input"
            description="YAML to sort"
            value={source}
            onChange={setSource}
            theme={theme}
            minHeight="min-h-80"
          />
        </div>
        <OutputView
          title="Sorted output"
          value={result.ok ? result.text : ""}
          error={result.ok ? null : result.error}
          onApply={() => applyToActive(result.ok ? result.text : source)}
        />
      </div>
    </ToolPage>
  );
}
