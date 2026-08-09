import { useWorkbench } from "../../app/workbenchContext";
import { minifyYaml } from "../../services/formatterService";
import { ToolButton, ToolPage, YamlSourcePanel, OutputView, editorThemeFor, Stat } from "../shared/ToolShell";
import { useToolSource } from "../shared/hooks";

export default function MinifierTool() {
  const { themeMode } = useWorkbench();
  const { source, setSource, loadFromActive, applyToActive } = useToolSource();
  const theme = editorThemeFor(themeMode);

  const result = minifyYaml(source);

  return (
    <ToolPage
      icon="compress"
      title="YAML Minifier"
      description="Compress the active document into a single-line flow-style YAML document while preserving semantics."
      actions={<ToolButton onClick={loadFromActive}>Load from active document</ToolButton>}
    >
      <div className="grid h-full min-h-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <YamlSourcePanel
          title="Input"
          description="YAML to minify"
          value={source}
          onChange={setSource}
          theme={theme}
          minHeight="min-h-80"
        />
        <div className="flex min-h-0 flex-col gap-4">
          {result.ok && source.trim() !== "" && (
            <div className="flex flex-none flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-edge-1 bg-surface-1 px-4 py-2.5 text-xs shadow-lg shadow-black/20">
              <Stat label="lines" value={source.split("\n").length} accent="text-ink-strong" />
              <Stat label="before (chars)" value={source.length} accent="text-ink-strong" />
              <Stat label="after (chars)" value={result.text.length} accent="text-emerald-400" />
              <Stat label="saved" value={`${Math.max(0, Math.round((1 - result.text.length / Math.max(source.length, 1)) * 100))}%`} accent="text-sky-400" />
            </div>
          )}
          <OutputView
            title="Minified output"
            value={result.ok ? result.text : ""}
            error={result.ok ? null : result.error}
            onApply={() => applyToActive(result.ok ? result.text : source)}
          />
        </div>
      </div>
    </ToolPage>
  );
}
