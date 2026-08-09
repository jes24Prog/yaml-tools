import { useMemo, useState } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { renderTemplate } from "../../services/templateService";
import { variablesFromEnvText } from "../../services/envService";
import { ToolPage, YamlSourcePanel, OutputView, editorThemeFor, ToolButton, Stat } from "../shared/ToolShell";
import { useToolSource } from "../shared/hooks";

export default function TemplatesTool() {
  const { themeMode } = useWorkbench();
  const { source, setSource, loadFromActive, applyToActive } = useToolSource();
  const theme = editorThemeFor(themeMode);

  const [variablesText, setVariablesText] = useState(
    "APP_NAME=My Service\nENVIRONMENT=staging\nPORT=8080\nDATABASE_URL=postgres://localhost/app",
  );

  const variables = useMemo(() => variablesFromEnvText(variablesText), [variablesText]);
  const result = useMemo(() => renderTemplate(source, variables), [source, variables]);

  return (
    <ToolPage
      icon="templates"
      title="Template Engine"
      description="Render ${VAR}, ${VAR:-default} and $VAR placeholders in plain text or YAML using variables from .env text."
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
            description="Text or YAML with ${VAR} placeholders"
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

        <div className="min-h-0 flex-1">
          <OutputView
            title="Rendered output"
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
