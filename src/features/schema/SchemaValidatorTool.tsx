import { useMemo, useState } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { validateYamlAgainstSchema } from "../../services/schemaValidator";
import { ToolPage, YamlSourcePanel, editorThemeFor, ToolButton, Stat } from "../shared/ToolShell";
import { useToolSource } from "../shared/hooks";

export default function SchemaValidatorTool() {
  const { themeMode } = useWorkbench();
  const { source, setSource, loadFromActive } = useToolSource();
  const theme = editorThemeFor(themeMode);

  const [schema, setSchema] = useState(`type: object
required:
  - name
properties:
  name:
    type: string
  replicas:
    type: integer
    minimum: 1
`);

  const result = useMemo(() => validateYamlAgainstSchema(source, schema), [source, schema]);

  return (
    <ToolPage
      icon="schema"
      title="Schema Validator"
      description="Validate the document against a JSON Schema written in YAML or JSON."
      actions={<ToolButton onClick={loadFromActive}>Load from active doc</ToolButton>}
    >
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex flex-none flex-wrap items-center gap-3 rounded-xl border border-edge-1 bg-surface-1 px-4 py-3 shadow-lg shadow-black/20">
          {result.error ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
              Schema error
            </span>
          ) : result.valid ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              Valid
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
              Invalid
            </span>
          )}
          <Stat label="issues" value={result.error ? 0 : result.issues.length} accent="text-ink-strong" />
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-2">
          <YamlSourcePanel
            title="Document"
            value={source}
            onChange={setSource}
            theme={theme}
            minHeight="min-h-72"
          />
          <YamlSourcePanel
            title="JSON Schema (YAML or JSON)"
            value={schema}
            onChange={setSchema}
            theme={theme}
            minHeight="min-h-72"
          />
        </div>

        {result.issues.length > 0 && (
          <div className="flex-none overflow-hidden rounded-xl border border-edge-1 bg-surface-1 shadow-lg shadow-black/20">
            <header className="flex-none border-b border-edge-1 bg-surface-2 px-4 py-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">Issues ({result.issues.length})</h3>
            </header>
            <ul className="max-h-72 divide-y divide-edge-0 overflow-auto">
              {result.issues.map((issue, index) => (
                <li key={index} className="flex items-start gap-2 px-4 py-2.5">
                  <span className="mt-0.5 shrink-0 rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] uppercase text-amber-400">
                    {issue.keyword}
                  </span>
                  <code className="min-w-0 flex-1 break-all font-mono text-xs text-ink">
                    {issue.path} <span className="text-ink-muted">— {issue.message}</span>
                  </code>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ToolPage>
  );
}
