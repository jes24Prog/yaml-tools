import { useMemo, useState } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { substituteYaml, variablesFromEnvText } from "../../services/envService";
import { ToolPage, YamlSourcePanel, OutputView, editorThemeFor, ToolButton, Stat } from "../shared/ToolShell";
import { useToolSource } from "../shared/hooks";

export default function EnvSubstitutionTool() {
  const { themeMode } = useWorkbench();
  const { source, setSource, loadFromActive, applyToActive } = useToolSource();
  const theme = editorThemeFor(themeMode);

  const [variablesText, setVariablesText] = useState(
    "API_URL=https://api.example.com\nAPI_KEY=secret-123\nMODE=production\nPORT=8080",
  );

  const variables = useMemo(() => variablesFromEnvText(variablesText), [variablesText]);
  const result = useMemo(() => substituteYaml(source, variables), [source, variables]);

  return (
    <ToolPage
      icon="env"
      title="Env Substitution"
      description="Replace ${VAR}, ${VAR:-default} and $VAR placeholders in YAML using variables from .env text."
      actions={<ToolButton onClick={loadFromActive}>Load from active doc</ToolButton>}
    >
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex flex-none flex-wrap items-center gap-5 rounded-xl border border-edge-1 bg-surface-1 px-4 py-3 shadow-lg shadow-black/20">
          <Stat label="variables" value={Object.keys(variables).length} accent="text-sky-400" />
          <Stat label="substitutions" value={result.substitutions.length} accent="text-emerald-400" />
          <Stat label="missing" value={result.missing.length} accent={result.missing.length > 0 ? "text-amber-400" : "text-ink-faint"} />
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-2">
          <YamlSourcePanel
            title="Template"
            description="YAML with ${VAR} placeholders"
            value={source}
            onChange={setSource}
            theme={theme}
            minHeight="min-h-72"
          />
          <YamlSourcePanel
            title="Variables (.env)"
            description="KEY=VALUE per line"
            value={variablesText}
            onChange={setVariablesText}
            theme={theme}
            minHeight="min-h-72"
          />
        </div>

        {result.ok && result.substitutions.length > 0 && (
          <div className="flex-none overflow-hidden rounded-xl border border-edge-1 bg-surface-1 shadow-lg shadow-black/20">
            <header className="flex-none border-b border-edge-1 bg-surface-2 px-4 py-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">Substitutions</h3>
            </header>
            <ul className="max-h-40 divide-y divide-edge-0 overflow-auto">
              {result.substitutions.map((substitution, index) => (
                <li key={index} className="flex items-center gap-2 px-4 py-1.5 font-mono text-xs">
                  <span className="text-ink-faint line-through">{substitution.from}</span>
                  <span className="text-ink-faint">→</span>
                  <span className="text-emerald-400">{substitution.to}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="min-h-0 flex-1">
          <OutputView
            title="Result"
            value={result.ok ? result.text : source}
            error={result.ok ? null : (result.error ?? null)}
            onApply={() => {
              if (result.ok) applyToActive(result.text);
            }}
          />
        </div>
      </div>
    </ToolPage>
  );
}
