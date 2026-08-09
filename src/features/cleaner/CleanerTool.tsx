import { useState } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { cleanYaml } from "../../services/cleanerService";
import { ToolButton, ToolPage, YamlSourcePanel, OutputView, editorThemeFor } from "../shared/ToolShell";
import { useToolSource } from "../shared/hooks";

export default function CleanerTool() {
  const { themeMode } = useWorkbench();
  const { source, setSource, loadFromActive, applyToActive } = useToolSource();
  const theme = editorThemeFor(themeMode);

  const [emptyValues, setEmptyValues] = useState(true);
  const [emptyArrays, setEmptyArrays] = useState(true);
  const [emptyObjects, setEmptyObjects] = useState(true);
  const [trailingSpaces, setTrailingSpaces] = useState(true);

  const result = cleanYaml(source, { emptyValues, emptyArrays, emptyObjects, trailingSpaces });

  const option = (checked: boolean, onChange: (v: boolean) => void, label: string) => (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-3.5 w-3.5 rounded accent-emerald-500"
      />
      {label}
    </label>
  );

  return (
    <ToolPage
      icon="clean"
      title="YAML Cleaner"
      description="Remove empty values, empty arrays, empty objects and trailing whitespace from the active document."
      actions={<ToolButton onClick={loadFromActive}>Load from active document</ToolButton>}
    >
      <div className="grid h-full min-h-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="flex min-h-0 flex-col gap-4">
          <div className="flex flex-none flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-edge-1 bg-surface-1 px-4 py-3 shadow-lg shadow-black/20">
            {option(emptyValues, setEmptyValues, "Empty values (null / \"\")")}
            {option(emptyArrays, setEmptyArrays, "Empty arrays")}
            {option(emptyObjects, setEmptyObjects, "Empty objects")}
            {option(trailingSpaces, setTrailingSpaces, "Trailing whitespace")}
          </div>
          <YamlSourcePanel
            title="Input"
            description="YAML to clean"
            value={source}
            onChange={setSource}
            theme={theme}
            minHeight="min-h-80"
          />
        </div>
        <div className="flex min-h-0 flex-col gap-4">
          {result.ok && result.removed.length > 0 && (
            <div className="flex-none rounded-xl border border-edge-1 bg-surface-1 px-4 py-3 shadow-lg shadow-black/20">
              <div className="mb-1.5 text-xs font-semibold text-ink">Removed paths ({result.removed.length})</div>
              <div className="max-h-28 overflow-auto">
                {result.removed.map((path) => (
                  <div key={path} className="truncate font-mono text-xs text-ink-muted">
                    {path}
                  </div>
                ))}
              </div>
            </div>
          )}
          <OutputView
            title="Cleaned output"
            value={result.ok ? result.text : ""}
            error={result.ok ? null : result.error}
            onApply={() => applyToActive(result.ok ? result.text : source)}
          />
        </div>
      </div>
    </ToolPage>
  );
}
