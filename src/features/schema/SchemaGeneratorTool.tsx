import { useMemo, useState } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import {
  DEFAULT_SCHEMA_GEN_OPTIONS,
  generateSchema,
  type SchemaGenOptions,
} from "../../services/schemaGenerator";
import { ToolPage, YamlSourcePanel, OutputView, editorThemeFor, ToolButton } from "../shared/ToolShell";
import { useToolSource } from "../shared/hooks";

export default function SchemaGeneratorTool() {
  const { themeMode } = useWorkbench();
  const { source, setSource, loadFromActive, applyToActive } = useToolSource();
  const theme = editorThemeFor(themeMode);

  const [options, setOptions] = useState<SchemaGenOptions>({ ...DEFAULT_SCHEMA_GEN_OPTIONS });

  const result = useMemo(() => generateSchema(source, options), [source, options]);

  return (
    <ToolPage
      icon="schema"
      title="Schema Generator"
      description="Infer a JSON Schema from the structure of a YAML document."
      actions={<ToolButton onClick={loadFromActive}>Load from active doc</ToolButton>}
    >
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex flex-none flex-wrap items-center gap-4 rounded-xl border border-edge-1 bg-surface-1 px-4 py-3 shadow-lg shadow-black/20">
          {(
            [
              { key: "markAllRequired", label: "Mark all keys required" },
              { key: "inlineEnums", label: "Inline enums" },
            ] as const
          ).map((option) => (
            <label key={option.key} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={options[option.key]}
                onChange={(event) => setOptions((current) => ({ ...current, [option.key]: event.target.checked }))}
                className="h-3.5 w-3.5 rounded accent-emerald-500"
              />
              {option.label}
            </label>
          ))}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink-muted">Enum threshold</span>
            <input
              type="number"
              min={2}
              max={100}
              value={options.enumThreshold}
              onChange={(event) =>
                setOptions((current) => ({ ...current, enumThreshold: Math.max(2, Number(event.target.value) || 2) }))
              }
              className="w-24 rounded-md border border-edge-1 bg-surface-0 px-2.5 py-1 text-sm text-ink outline-none focus:border-emerald-500/50"
            />
          </label>
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-2">
          <YamlSourcePanel
            title="Input"
            value={source}
            onChange={setSource}
            theme={theme}
            minHeight="min-h-72"
          />
          <OutputView
            title="Inferred JSON Schema (YAML)"
            value={result.ok ? result.text : ""}
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
