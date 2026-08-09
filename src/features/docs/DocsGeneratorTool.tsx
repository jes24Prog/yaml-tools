import { useMemo } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { generateDocs } from "../../services/docsGeneratorService";
import { ToolPage, YamlSourcePanel, OutputView, editorThemeFor, ToolButton } from "../shared/ToolShell";
import { useToolSource } from "../shared/hooks";

export default function DocsGeneratorTool() {
  const { themeMode } = useWorkbench();
  const { source, setSource, loadFromActive, applyToActive } = useToolSource();
  const theme = editorThemeFor(themeMode);

  const result = useMemo(() => generateDocs(source), [source]);

  return (
    <ToolPage
      icon="docs"
      title="Docs Generator"
      description="Generate a Markdown reference document describing the structure, types and descriptions in the YAML."
      actions={<ToolButton onClick={loadFromActive}>Load from active doc</ToolButton>}
    >
      <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-2">
        <YamlSourcePanel
          title="Input"
          value={source}
          onChange={setSource}
          theme={theme}
          minHeight="min-h-72"
        />
        <OutputView
          title="Generated Markdown"
          value={result.ok ? result.text : ""}
          error={result.ok ? null : (result.error ?? null)}
          onApply={() => {
            if (result.ok) applyToActive(result.text);
          }}
        />
      </div>
    </ToolPage>
  );
}
