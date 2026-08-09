import { useMemo, useState } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { replaceYaml, searchYaml, type SearchMode } from "../../services/searchService";
import { ToolPage, YamlSourcePanel, editorThemeFor, ToolButton, Stat } from "../shared/ToolShell";
import { useToolSource } from "../shared/hooks";

const MODES: Array<{ value: SearchMode; label: string }> = [
  { value: "both", label: "Keys & values" },
  { value: "keys", label: "Keys only" },
  { value: "values", label: "Values only" },
];

export default function SearchTool() {
  const { themeMode } = useWorkbench();
  const { source, setSource, loadFromActive } = useToolSource();
  const theme = editorThemeFor(themeMode);

  const [pattern, setPattern] = useState("");
  const [replacement, setReplacement] = useState("");
  const [mode, setMode] = useState<SearchMode>("both");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [regex, setRegex] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);

  const options = { mode, caseSensitive, regex, wholeWord };
  const search = useMemo(() => searchYaml(source, pattern, options), [source, pattern, options]);
  const replace = useMemo(
    () => (pattern ? replaceYaml(source, pattern, replacement, options) : null),
    [source, pattern, replacement, options],
  );

  const runReplace = () => {
    if (!replace) return;
    if (replace.ok) {
      setSource(replace.text);
    }
  };

  return (
    <ToolPage
      icon="search"
      title="Search & Replace"
      description="Find keys and values in the document, then replace matches with fine-grained matching options."
      actions={<ToolButton onClick={loadFromActive}>Load from active doc</ToolButton>}
    >
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex flex-none flex-wrap items-end gap-3 rounded-xl border border-edge-1 bg-surface-1 px-4 py-3 shadow-lg shadow-black/20">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink-muted">Find</span>
            <input
              value={pattern}
              onChange={(event) => setPattern(event.target.value)}
              placeholder="Search term…"
              className="w-56 rounded-md border border-edge-1 bg-surface-0 px-2.5 py-1.5 text-sm text-ink outline-none focus:border-emerald-500/50"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink-muted">Replace with</span>
            <input
              value={replacement}
              onChange={(event) => setReplacement(event.target.value)}
              placeholder="Replacement…"
              className="w-56 rounded-md border border-edge-1 bg-surface-0 px-2.5 py-1.5 text-sm text-ink outline-none focus:border-emerald-500/50"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink-muted">Scope</span>
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as SearchMode)}
              className="cursor-pointer rounded-md border border-edge-1 bg-surface-0 px-2.5 py-1.5 text-sm text-ink outline-none focus:border-emerald-500/50"
            >
              {MODES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {[
            { label: "Case sensitive", checked: caseSensitive, set: setCaseSensitive },
            { label: "Regex", checked: regex, set: setRegex },
            { label: "Whole word", checked: wholeWord, set: setWholeWord },
          ].map((toggle) => (
            <label key={toggle.label} className="flex cursor-pointer items-center gap-2 pb-1.5 text-sm text-ink">
              <input
                type="checkbox"
                checked={toggle.checked}
                onChange={(event) => toggle.set(event.target.checked)}
                className="h-3.5 w-3.5 rounded accent-emerald-500"
              />
              {toggle.label}
            </label>
          ))}
          <button
            type="button"
            onClick={runReplace}
            disabled={!replace}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Replace all
          </button>
          <div className="ml-auto flex items-center gap-5">
            <Stat label="hits" value={search.ok ? search.hits.length : 0} accent="text-ink-strong" />
            {replace?.ok && replace.replaced > 0 && (
              <Stat label="replaced" value={replace.replaced} accent="text-emerald-400" />
            )}
          </div>
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-edge-1 bg-surface-1 shadow-lg shadow-black/20">
            <header className="flex-none border-b border-edge-1 bg-surface-2 px-4 py-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">Matches</h3>
            </header>
            {search.error ? (
              <div className="p-4 text-xs text-ink-faint">{search.error}</div>
            ) : search.hits.length === 0 ? (
              <div className="p-4 text-xs text-ink-faint">No matches.</div>
            ) : (
              <ul className="min-h-0 flex-1 divide-y divide-edge-0 overflow-auto">
                {search.hits.map((hit, index) => (
                  <li key={index} className="flex items-start gap-2 px-4 py-2.5">
                    <span
                      className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] uppercase ${
                        hit.field === "key" ? "border-amber-500/40 text-amber-400" : "border-sky-500/40 text-sky-400"
                      }`}
                    >
                      {hit.field}
                    </span>
                    <code className="min-w-0 flex-1 break-all font-mono text-xs text-ink">{hit.path}</code>
                    <code className="shrink-0 font-mono text-xs text-emerald-400">“{hit.match}”</code>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <YamlSourcePanel
            title="Document"
            description="Editable source"
            value={source}
            onChange={setSource}
            theme={theme}
            minHeight="min-h-72"
          />
        </div>
      </div>
    </ToolPage>
  );
}
