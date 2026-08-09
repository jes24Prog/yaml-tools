import { useMemo, useState } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { queryYamlSource } from "../../services/queryService";
import { ToolPage, YamlSourcePanel, editorThemeFor, ToolButton } from "../shared/ToolShell";
import { useToolSource } from "../shared/hooks";

const EXAMPLES = [
  "$.metadata",
  "$.spec.containers[*].image",
  "$..name",
  "$.items[*].metadata.name",
  "$.spec.template.spec.containers[0].image",
];

export default function QueryTool() {
  const { themeMode } = useWorkbench();
  const { source, setSource, loadFromActive } = useToolSource();
  const theme = editorThemeFor(themeMode);

  const [query, setQuery] = useState("$.metadata");
  const result = useMemo(() => queryYamlSource(source, query), [source, query]);

  return (
    <ToolPage
      icon="query"
      title="YAML Query"
      description="Query YAML with JSONPath-style selectors: $, .key, [0], [*], ..name and filters."
      actions={<ToolButton onClick={loadFromActive}>Load from active doc</ToolButton>}
    >
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex flex-none flex-col gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="$."
            spellCheck={false}
            className="w-full rounded-lg border border-edge-1 bg-surface-1 px-3 py-2 font-mono text-sm text-ink outline-none focus:border-emerald-500/50"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setQuery(example)}
                className="rounded-md border border-edge-1 bg-surface-2 px-2 py-1 font-mono text-[11px] text-ink-muted transition-colors hover:bg-surface-3 hover:text-ink"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-2">
          <YamlSourcePanel
            title="Document"
            value={source}
            onChange={setSource}
            theme={theme}
            minHeight="min-h-72"
          />
          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-edge-1 bg-surface-1 shadow-lg shadow-black/20">
            <header className="flex-none border-b border-edge-1 bg-surface-2 px-4 py-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">
                Results ({result.matches.length})
              </h3>
            </header>
            {result.error ? (
              <div className="p-4 text-xs text-red-400">{result.error}</div>
            ) : result.matches.length === 0 ? (
              <div className="p-4 text-xs text-ink-faint">No matches.</div>
            ) : (
              <ul className="min-h-0 flex-1 divide-y divide-edge-0 overflow-auto">
                {result.matches.map((match, index) => (
                  <li key={index} className="flex items-start gap-2 px-4 py-2.5">
                    <code className="min-w-0 flex-1 break-all font-mono text-xs text-emerald-400">{match.path}</code>
                    <span className="shrink-0 rounded border border-edge-1 bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase text-ink-faint">
                      {match.type}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
