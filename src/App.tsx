import { useCallback, useMemo, useState } from "react";
import { ChangeViewer } from "./components/ChangeViewer";
import { EditorPanel } from "./components/EditorPanel";
import { Statistics } from "./components/Statistics";
import { StatusMessage } from "./components/StatusMessage";
import { Toolbar, type ToolbarActionHandlers } from "./components/Toolbar";
import { useYamlMerge } from "./hooks/useYamlMerge";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { EditorKind } from "./types/yaml";
import { copyToClipboard } from "./utils/clipboard";
import { downloadYaml } from "./utils/download";
import { prettyPrintYaml } from "./utils/yamlFormatter";

const STORAGE_KEYS = {
  primary: "yaml-value-override-tool:primary",
  target: "yaml-value-override-tool:target",
  autoUpdate: "yaml-value-override-tool:autoUpdate",
  theme: "yaml-value-override-tool:theme",
  showChanges: "yaml-value-override-tool:showChanges",
} as const;

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

type Status = { message: string; kind: "success" | "info" | "warning" | "error" } | null;

export default function App() {
  const [primaryYaml, setPrimaryYaml] = useLocalStorage(STORAGE_KEYS.primary, "");
  const [targetYaml, setTargetYaml] = useLocalStorage(STORAGE_KEYS.target, "");
  const [autoUpdate, setAutoUpdate] = useLocalStorage(STORAGE_KEYS.autoUpdate, false);
  const [theme, setTheme] = useLocalStorage<"dark" | "light">(STORAGE_KEYS.theme, "dark");
  const [showChanges, setShowChanges] = useLocalStorage(STORAGE_KEYS.showChanges, false);
  const [formatTarget, setFormatTarget] = useState<EditorKind>("primary");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [status, setStatus] = useState<Status>(null);

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
  });

  const flashStatus = useCallback(
    (message: string, kind: NonNullable<Status>["kind"] = "info") => {
      setStatus({ message, kind });
      window.setTimeout(() => setStatus(null), 2500);
    },
    [],
  );

  const flashCopy = useCallback((value: "copied" | "failed") => {
    setCopyStatus(value);
    window.setTimeout(() => setCopyStatus("idle"), 1800);
  }, []);

  const handleUpdateValues = useCallback(() => {
    runMerge();
  }, [runMerge]);

  const handleFormat = useCallback(
    (target: EditorKind) => {
      if (target === "primary") {
        if (primaryYaml.trim() === "") {
          flashStatus("Primary YAML is empty.", "warning");
          return;
        }
        setPrimaryYaml(prettyPrintYaml(primaryYaml));
        flashStatus("Formatted Primary YAML.", "success");
      } else if (target === "target") {
        if (targetYaml.trim() === "") {
          flashStatus("Target YAML is empty.", "warning");
          return;
        }
        setTargetYaml(prettyPrintYaml(targetYaml));
        flashStatus("Formatted Target YAML.", "success");
      } else {
        if (outputYaml.trim() === "") {
          flashStatus("No output to format yet.", "warning");
          return;
        }
        setOutputYaml(prettyPrintYaml(outputYaml));
        flashStatus("Formatted Output YAML.", "success");
      }
    },
    [primaryYaml, targetYaml, outputYaml, setPrimaryYaml, setTargetYaml, setOutputYaml, flashStatus],
  );

  const handleCopyOutput = useCallback(async () => {
    if (outputYaml.trim() === "") {
      flashStatus("No output to copy. Run Update Values first.", "warning");
      return;
    }
    const ok = await copyToClipboard(outputYaml);
    if (ok) {
      flashCopy("copied");
    } else {
      flashCopy("failed");
      flashStatus("Clipboard access was denied.", "error");
    }
  }, [outputYaml, flashCopy, flashStatus]);

  const handleDownloadOutput = useCallback(() => {
    if (outputYaml.trim() === "") {
      flashStatus("No output to download. Run Update Values first.", "warning");
      return;
    }
    downloadYaml("updated-config.yaml", outputYaml);
    flashStatus("Downloaded updated-config.yaml.", "success");
  }, [outputYaml, flashStatus]);

  const handleClear = useCallback(() => {
    setPrimaryYaml("");
    setTargetYaml("");
    reset();
    setCopyStatus("idle");
    flashStatus("Cleared all YAML content.", "info");
  }, [setPrimaryYaml, setTargetYaml, reset, flashStatus]);

  const handleSwapInputs = useCallback(() => {
    const primary = primaryYaml;
    setPrimaryYaml(targetYaml);
    setTargetYaml(primary);
    flashStatus("Swapped Primary and Target YAML.", "info");
  }, [primaryYaml, targetYaml, setPrimaryYaml, setTargetYaml, flashStatus]);

  const handleLoadExample = useCallback(() => {
    setPrimaryYaml(EXAMPLE_PRIMARY);
    setTargetYaml(EXAMPLE_TARGET);
    flashStatus("Loaded example YAML.", "success");
  }, [setPrimaryYaml, setTargetYaml, flashStatus]);

  const handleClearSavedData = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      window.localStorage.removeItem(key);
    });
    setPrimaryYaml("");
    setTargetYaml("");
    setAutoUpdate(false);
    setTheme("dark");
    setShowChanges(false);
    reset();
    flashStatus("Cleared all saved data from this browser.", "info");
  }, [
    setPrimaryYaml,
    setTargetYaml,
    setAutoUpdate,
    setTheme,
    setShowChanges,
    reset,
    flashStatus,
  ]);

  const handlers: ToolbarActionHandlers = useMemo(
    () => ({
      onUpdateValues: handleUpdateValues,
      onFormat: handleFormat,
      onCopyOutput: handleCopyOutput,
      onDownloadOutput: handleDownloadOutput,
      onClear: handleClear,
      onSwapInputs: handleSwapInputs,
      onLoadExample: handleLoadExample,
      onClearSavedData: handleClearSavedData,
      onToggleAutoUpdate: setAutoUpdate,
      onToggleShowChanges: setShowChanges,
      onToggleTheme: setTheme,
    }),
    [
      handleUpdateValues,
      handleFormat,
      handleCopyOutput,
      handleDownloadOutput,
      handleClear,
      handleSwapInputs,
      handleLoadExample,
      handleClearSavedData,
      setAutoUpdate,
      setShowChanges,
      setTheme,
    ],
  );

  const editorTheme = theme === "dark" ? "yaml-tool-dark" : "yaml-tool-light";

  return (
    <div data-theme={theme} className="flex min-h-screen flex-col bg-surface-0 text-ink">
      <header className="flex flex-none flex-col gap-1 border-b border-edge-1 bg-surface-1/60 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
              <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M2.75 14A1.75 1.75 0 011 12.25V3.75A1.75 1.75 0 012.75 2h10.5A1.75 1.75 0 0115 3.75v8.5A1.75 1.75 0 0113.25 14H2.75zM3 3.5v9h10v-9H3z" />
                <path d="M4.5 5h7v1.5h-7V5zM4.5 8h7v1.5h-7V8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight text-ink-strong">
                YAML Value Override Tool
              </h1>
              <p className="text-xs text-ink-muted">
                Primary values override matching Target keys — output preserves Target structure.
              </p>
            </div>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-edge-1 bg-surface-2 px-3 py-1 text-[11px] font-medium text-ink-muted sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
            100% client-side
          </span>
        </div>
      </header>

      <div className="flex flex-none flex-wrap items-center gap-3 border-b border-edge-1 px-4 py-3 sm:px-6">
        <Toolbar
          autoUpdate={autoUpdate}
          showChanges={showChanges}
          theme={theme}
          isProcessing={isProcessing}
          copyStatus={copyStatus}
          formatTarget={formatTarget}
          onFormatTargetChange={setFormatTarget}
          handlers={handlers}
        />
      </div>

      {(hasMerged || status) && (
        <div className="flex flex-none flex-wrap items-center gap-3 border-b border-edge-1 px-4 py-2.5 sm:px-6">
          <Statistics statistics={statistics} />
          {status && <StatusMessage message={status.message} kind={status.kind ?? "info"} />}
        </div>
      )}

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto px-4 py-4 lg:grid-cols-3 lg:grid-rows-[1fr_auto] lg:overflow-hidden sm:px-6">
        <EditorPanel
          title="Primary YAML"
          description="Values from this YAML override matching values in the Target YAML."
          value={primaryYaml}
          onChange={setPrimaryYaml}
          error={primaryError}
          tone="primary"
          theme={editorTheme}
        />
        <EditorPanel
          title="Target YAML"
          description="Keys and structure from this YAML are preserved in the output."
          value={targetYaml}
          onChange={setTargetYaml}
          error={targetError}
          tone="target"
          theme={editorTheme}
        />
        <EditorPanel
          title="Output YAML"
          description="Generated YAML result."
          value={outputYaml}
          readOnly
          tone="output"
          theme={editorTheme}
        />
        {showChanges && (
          <div className="col-span-full lg:col-span-3">
            <ChangeViewer changes={changes} visible />
          </div>
        )}
      </main>

      <footer className="flex flex-none flex-wrap items-center justify-between gap-2 border-t border-edge-1 px-4 py-2.5 text-xs text-ink-faint sm:px-6">
        <p>
          All processing happens locally in your browser. Your YAML is never sent anywhere.
        </p>
        <button
          type="button"
          onClick={handleClearSavedData}
          className="rounded-md px-2 py-1 font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink-strong"
        >
          Clear Saved Data
        </button>
      </footer>
    </div>
  );
}
