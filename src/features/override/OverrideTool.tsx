import { useCallback, useMemo, useState } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { ChangeViewer } from "../../components/ChangeViewer";
import { EditorPanel } from "../../components/EditorPanel";
import { ToolPage, editorThemeFor, Stat } from "../shared/ToolShell";
import { useYamlMerge } from "../../hooks/useYamlMerge";
import { copyToClipboard } from "../../utils/clipboard";
import { downloadYaml } from "../../utils/download";
import { prettyPrintYaml } from "../../utils/yamlFormatter";

const EXAMPLE_PRIMARY = `USERNAME-USER: "value"
AGE_AGE: 15
DATABASE:
  USERNAME: "admin"
  PASSWORD: "secret"
`;

const EXAMPLE_TARGET = `PASSWORD_PASS: "12345"
USERNAME-USER: "bababab"
WHATEVER: "HELLO"
AGE_AGE: 152323
DATABASE:
  USERNAME: "olduser"
  PASSWORD: "oldpassword"
  HOST: "localhost"
`;

export default function OverrideTool() {
  const { themeMode, replaceActiveDocument, notify } = useWorkbench();
  const [primaryYaml, setPrimaryYaml] = useState(EXAMPLE_PRIMARY);
  const [targetYaml, setTargetYaml] = useState(EXAMPLE_TARGET);
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [showChanges, setShowChanges] = useState(true);
  const [addMissingKeys, setAddMissingKeys] = useState(false);
  const [formatTarget, setFormatTarget] = useState<"primary" | "target" | "output">("primary");

  const {
    outputYaml,
    setOutputYaml,
    primaryError,
    targetError,
    statistics,
    changes,
    hasMerged,
    isProcessing,
    runMerge,
    reset,
  } = useYamlMerge({
    primaryYaml,
    targetYaml,
    autoUpdate,
    trackChanges: showChanges,
    addMissingKeys,
  });

  const theme = editorThemeFor(themeMode);

  const handleFormat = useCallback(
    (target: "primary" | "target" | "output") => {
      const map = {
        primary: [primaryYaml, setPrimaryYaml] as const,
        target: [targetYaml, setTargetYaml] as const,
        output: [outputYaml, setOutputYaml] as const,
      };
      const [value, setter] = map[target];
      if (value.trim() === "") {
        notify("No content to format.", "warning");
        return;
      }
      setter(prettyPrintYaml(value));
      notify("Formatted content.", "success");
    },
    [primaryYaml, targetYaml, outputYaml, setOutputYaml, notify],
  );

  const handleCopy = useCallback(async () => {
    if (outputYaml.trim() === "") {
      notify("No output to copy. Run Update Values first.", "warning");
      return;
    }
    const ok = await copyToClipboard(outputYaml);
    notify(ok ? "Copied output to clipboard." : "Clipboard access was denied.", ok ? "success" : "error");
  }, [outputYaml, notify]);

  const handleSwap = useCallback(() => {
    const primary = primaryYaml;
    setPrimaryYaml(targetYaml);
    setTargetYaml(primary);
    notify("Swapped Primary and Target YAML.", "info");
  }, [primaryYaml, targetYaml, notify]);

  const handleClear = useCallback(() => {
    setPrimaryYaml("");
    setTargetYaml("");
    reset();
    notify("Cleared Primary and Target YAML.", "info");
  }, [reset, notify]);

  const stats = useMemo(() => statistics, [statistics]);

  return (
    <ToolPage
      icon="override"
      title="YAML Value Override"
      description="Values from the Primary YAML override matching keys in the Target YAML — the output preserves the Target structure."
      actions={
        <>
          <button
            type="button"
            onClick={runMerge}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Update Values
          </button>
          <button
            type="button"
            onClick={handleSwap}
            className="inline-flex items-center gap-1.5 rounded-lg border border-edge-1 bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink-strong transition-colors hover:bg-surface-3"
          >
            Swap Inputs
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-edge-1 bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink-strong transition-colors hover:bg-surface-3"
          >
            Copy Output
          </button>
          <button
            type="button"
            onClick={() => downloadYaml("updated-config.yaml", outputYaml)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-edge-1 bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink-strong transition-colors hover:bg-surface-3"
          >
            Download YAML
          </button>
          <button
            type="button"
            onClick={() => {
              if (outputYaml.trim() === "") {
                notify("No output to apply yet.", "warning");
                return;
              }
              replaceActiveDocument(outputYaml);
              notify("Applied output to the active document.", "success");
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-edge-1 bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink-strong transition-colors hover:bg-surface-3"
          >
            Apply to document
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
          >
            Clear
          </button>
        </>
      }
    >
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex flex-none flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-edge-1 bg-surface-1 px-4 py-2.5 text-xs shadow-lg shadow-black/20">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={autoUpdate}
              onChange={(event) => setAutoUpdate(event.target.checked)}
              className="h-3.5 w-3.5 rounded accent-emerald-500"
            />
            Auto update
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={showChanges}
              onChange={(event) => setShowChanges(event.target.checked)}
              className="h-3.5 w-3.5 rounded accent-emerald-500"
            />
            Show changes
          </label>
          <label
            className="flex cursor-pointer items-center gap-2 text-sm text-ink"
            title="When enabled, fields that exist only in the Primary YAML are appended to the output."
          >
            <input
              type="checkbox"
              checked={addMissingKeys}
              onChange={(event) => setAddMissingKeys(event.target.checked)}
              className="h-3.5 w-3.5 rounded accent-emerald-500"
            />
            Add missing fields
          </label>
          <div className="flex items-center overflow-hidden rounded-lg border border-edge-1 bg-surface-2">
            <select
              aria-label="Format target"
              value={formatTarget}
              onChange={(event) => setFormatTarget(event.target.value as "primary" | "target" | "output")}
              className="cursor-pointer bg-transparent px-1.5 py-1.5 text-xs font-medium text-ink outline-none hover:text-ink-strong"
            >
              <option value="primary" className="bg-surface-2">Primary</option>
              <option value="target" className="bg-surface-2">Target</option>
              <option value="output" className="bg-surface-2">Output</option>
            </select>
            <button
              type="button"
              onClick={() => handleFormat(formatTarget)}
              className="inline-flex items-center gap-1.5 border-l border-edge-1 px-3 py-1.5 text-xs font-semibold text-ink-strong transition-colors hover:bg-surface-3"
            >
              Format
            </button>
          </div>
          {hasMerged && stats && (
            <div className="ml-auto flex items-center gap-5">
              <Stat label="keys processed" value={stats.keysProcessed} accent="text-ink-strong" />
              <Stat label="values updated" value={stats.valuesUpdated} accent="text-emerald-400" />
              <Stat label="keys preserved" value={stats.keysPreserved} accent="text-sky-400" />
              {addMissingKeys && (
                <Stat label="fields added" value={stats.keysAdded} accent="text-violet-400" />
              )}
            </div>
          )}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
          <EditorPanel
            title="Primary YAML"
            description="Values from this YAML override matching values in the Target YAML."
            value={primaryYaml}
            onChange={setPrimaryYaml}
            error={primaryError}
            tone="primary"
            theme={theme}
          />
          <EditorPanel
            title="Target YAML"
            description="Keys and structure from this YAML are preserved in the output."
            value={targetYaml}
            onChange={setTargetYaml}
            error={targetError}
            tone="target"
            theme={theme}
          />
          <EditorPanel
            title="Output YAML"
            description="Generated YAML result."
            value={outputYaml}
            readOnly
            tone="output"
            theme={theme}
          />
        </div>

        {showChanges && <ChangeViewer changes={changes} visible />}
      </div>
    </ToolPage>
  );
}
