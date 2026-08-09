import { useCallback, useState } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import type { ConvertResult } from "../../services/converterService";
import type { ToolIcon } from "../../types/workbench";
import { ToolButton, ToolPage, YamlSourcePanel, PlainTextPanel, editorThemeFor } from "../shared/ToolShell";
import { Segmented } from "../../components/ui";

type Direction = "yaml-to-other" | "other-to-yaml";

interface ConverterProps {
  icon: ToolIcon;
  title: string;
  description: string;
  formatName: string;
  toOther: (source: string) => ConvertResult;
  otherToYaml: (source: string) => ConvertResult;
}

export default function ConverterTool({ icon, title, description, formatName, toOther, otherToYaml }: ConverterProps) {
  const { themeMode, activeDocument, notify, replaceActiveDocument } = useWorkbench();
  const theme = editorThemeFor(themeMode);

  const [direction, setDirection] = useState<Direction>("yaml-to-other");
  const [yaml, setYaml] = useState(() => activeDocument.content);
  const [other, setOther] = useState("");

  const yamlToOther = direction === "yaml-to-other";
  const yamlResult = yamlToOther ? { ok: true, text: yaml } : otherToYaml(other);
  const otherResult = yamlToOther ? toOther(yaml) : { ok: true, text: other };

  const loadFromActive = useCallback(() => {
    if (yamlToOther) {
      setYaml(activeDocument.content);
    } else {
      setOther(activeDocument.content);
    }
    notify("Loaded content from the active document.", "info");
  }, [yamlToOther, activeDocument.content, notify]);

  const handleApply = useCallback(() => {
    const active = yamlToOther ? otherResult : yamlResult;
    if (active.ok) {
      replaceActiveDocument(active.text);
      notify(`Applied ${formatName} output to the active document.`, "success");
    }
  }, [yamlToOther, otherResult, yamlResult, replaceActiveDocument, notify, formatName]);

  return (
    <ToolPage
      icon={icon}
      title={title}
      description={description}
      actions={
        <>
          <ToolButton onClick={() => setDirection((current) => (current === "yaml-to-other" ? "other-to-yaml" : "yaml-to-other"))}>
            Swap direction
          </ToolButton>
          <ToolButton onClick={loadFromActive}>Load from active document</ToolButton>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented<Direction>
          value={direction}
          onChange={setDirection}
          ariaLabel="Conversion direction"
          options={[
            { value: "yaml-to-other", label: `YAML → ${formatName}` },
            { value: "other-to-yaml", label: `${formatName} → YAML` },
          ]}
        />
        <span className="text-xs text-ink-faint">
          {yamlToOther
            ? "Type YAML on the left; the converted output appears on the right."
            : `Type ${formatName} on the right; converted YAML appears on the left.`}
        </span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-2">
        <YamlSourcePanel
          title="YAML"
          description={yamlToOther ? "Editable input" : "Converted result (read-only)"}
          value={yamlResult.ok ? yamlResult.text : ""}
          onChange={yamlToOther ? setYaml : undefined}
          readOnly={!yamlToOther}
          error={yamlResult.ok ? null : "error" in yamlResult ? yamlResult.error : null}
          theme={theme}
          minHeight="min-h-[420px]"
        />
        <PlainTextPanel
          title={formatName}
          value={otherResult.ok ? otherResult.text : ""}
          onChange={yamlToOther ? undefined : setOther}
          readOnly={yamlToOther}
          toolbar={
            <ToolButton variant="ghost" onClick={handleApply} disabled={!yamlResult.ok && !otherResult.ok}>
              Apply to active document
            </ToolButton>
          }
          minHeight="min-h-[420px]"
        />
      </div>
    </ToolPage>
  );
}
