import { useMemo, useState } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { flattenYamlText, unflattenYamlText } from "../../services/flattenService";
import { ToolPage, YamlSourcePanel, OutputView, editorThemeFor, ToolButton, Stat } from "../shared/ToolShell";
import { useToolSource } from "../shared/hooks";

type Mode = "flatten" | "unflatten";

export default function FlattenTool() {
  const { themeMode } = useWorkbench();
  const { source, setSource, loadFromActive, applyToActive } = useToolSource();
  const theme = editorThemeFor(themeMode);

  const [mode, setMode] = useState<Mode>("flatten");

  const result = useMemo(() => {
    if (mode === "flatten") {
      return flattenYamlText(source);
    }
    return unflattenYamlText(source);
  }, [source, mode]);

  const ok = "ok" in result && result.ok;

  return (
    <ToolPage
      icon="flatten"
      title="Flatten / Unflatten"
      description="Flatten nested YAML into dotted keys, or rebuild nested structure from a flat map."
      actions={<ToolButton onClick={loadFromActive}>Load from active doc</ToolButton>}
    >
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex flex-none flex-wrap items-center gap-3 rounded-xl border border-edge-1 bg-surface-1 px-4 py-3 shadow-lg shadow-black/20">
          <div className="flex items-center overflow-hidden rounded-lg border border-edge-1 bg-surface-2">
            {(["flatten", "unflatten"] as Mode[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  mode === value ? "bg-emerald-600 text-white" : "text-ink-muted hover:text-ink"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          {ok && "count" in result && (
            <Stat
              label="keys flattened"
              value={(result as { count: number }).count}
              accent="text-emerald-400"
            />
          )}
          <p className="text-xs text-ink-faint">
            {mode === "flatten"
              ? "Nested keys become a.b.c dotted paths; arrays become a[0].b."
              : "Dotted keys rebuild nested objects."}
          </p>
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
            title="Output"
            value={ok ? result.text : ""}
            error={!ok && "error" in result ? result.error : null}
            onApply={() => {
              if (ok) applyToActive(result.text);
            }}
          />
        </div>
      </div>
    </ToolPage>
  );
}
