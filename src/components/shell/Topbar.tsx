import { useEffect, useState } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { toolById } from "../../app/toolRegistry";
import { ToolGlyph } from "../Icons";
import { Button } from "../ui";

export function Topbar() {
  const {
    activeToolId,
    documents,
    activeDocument,
    setPaletteOpen,
    updateSettings,
    settings,
    themeMode,
    createDocument,
    importFiles,
    exportDocument,
    saveWorkspace,
  } = useWorkbench();

  const activeTool = toolById(activeToolId);

  const [importKey, setImportKey] = useState(0);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setPaletteOpen]);

  const toggleTheme = () => {
    updateSettings({ theme: themeMode === "dark" ? "light" : "dark" });
  };

  return (
    <header className="flex h-12 flex-none items-center gap-3 border-b border-edge-1 bg-surface-2 px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-emerald-600/15 text-emerald-400">
          <ToolGlyph icon={activeTool?.icon ?? "file"} className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-ink">
            {activeTool?.name ?? "YAML Workbench"}
          </h1>
          <p className="truncate text-[11px] text-ink-faint">
            {activeTool?.description ?? "Multi-tool editor for YAML and friends"}
          </p>
        </div>
      </div>

      <div className="ml-auto flex flex-none items-center gap-1.5">
        <Button
          variant="ghost"
          title="New document (Ctrl+N)"
          onClick={() => createDocument()}
        >
          <ToolGlyph icon="file" className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">New</span>
        </Button>
        <label>
          <input
            key={importKey}
            type="file"
            multiple
            accept=".yaml,.yml,.json,.toml,.env,.properties,.xml,.txt"
            className="hidden"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              if (files.length > 0) {
                void importFiles(files);
              }
              setImportKey((key) => key + 1);
            }}
          />
          <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-surface-3 hover:text-ink-strong">
            <ToolGlyph icon="convert" className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Import</span>
          </span>
        </label>
        <Button
          variant="ghost"
          title="Export active document"
          onClick={() => exportDocument(activeDocument, settings.defaultExportFormat)}
        >
          <ToolGlyph icon="docs" className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Export</span>
        </Button>
        <Button variant="ghost" title="Save workspace" onClick={saveWorkspace}>
          <ToolGlyph icon="workspace" className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Save</span>
        </Button>
        <Button
          variant="ghost"
          title={themeMode === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          onClick={toggleTheme}
        >
          {themeMode === "dark" ? (
            <ToolGlyph icon="format" className="h-3.5 w-3.5" />
          ) : (
            <ToolGlyph icon="check" className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button variant="secondary" title="Open command palette (Ctrl+K)" onClick={() => setPaletteOpen(true)}>
          <ToolGlyph icon="search" className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Palette</span>
          <kbd className="ml-1 hidden rounded border border-edge-1 bg-surface-0 px-1 font-mono text-[10px] text-ink-faint md:inline">
            Ctrl K
          </kbd>
        </Button>
      </div>

      <span className="hidden text-[11px] text-ink-faint xl:inline">
        {documents.length} doc{documents.length === 1 ? "" : "s"}
      </span>
    </header>
  );
}
