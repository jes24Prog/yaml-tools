import { useRef } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { ToolPage, ToolButton } from "../shared/ToolShell";

export default function WorkspaceTool() {
  const {
    documents,
    activeDocId,
    createDocument,
    renameDocument,
    duplicateDocument,
    closeDocument,
    setActiveDocument,
    importFiles,
    saveWorkspace,
    exportWorkspace,
    importWorkspace,
    notify,
  } = useWorkbench();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const workspaceInputRef = useRef<HTMLInputElement>(null);

  const onImportFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const count = await importFiles(Array.from(files));
    notify(`Imported ${count} file${count === 1 ? "" : "s"}.`, "success");
  };

  const onImportWorkspace = async (files: FileList | null) => {
    const file = files?.[0];
    if (file) await importWorkspace(file);
  };

  return (
    <ToolPage
      icon="workspace"
      title="Workspace"
      description="Manage documents, import files and back up or restore your entire workspace."
      actions={
        <>
          <ToolButton onClick={() => createDocument()}>New document</ToolButton>
          <ToolButton onClick={() => fileInputRef.current?.click()}>Import files</ToolButton>
          <ToolButton onClick={() => workspaceInputRef.current?.click()}>Import workspace</ToolButton>
          <ToolButton onClick={saveWorkspace}>Save workspace</ToolButton>
          <ToolButton primary onClick={exportWorkspace}>Export workspace</ToolButton>
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".yaml,.yml,.json,.toml,.env,.properties,.xml,.txt"
          multiple
          className="hidden"
          onChange={(event) => {
            void onImportFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <input
          ref={workspaceInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(event) => {
            void onImportWorkspace(event.target.files);
            event.target.value = "";
          }}
        />

        <div className="flex-none overflow-hidden rounded-xl border border-edge-1 bg-surface-1 shadow-lg shadow-black/20">
          <header className="flex-none border-b border-edge-1 bg-surface-2 px-4 py-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">Documents ({documents.length})</h3>
          </header>
          <ul className="max-h-[26rem] divide-y divide-edge-0 overflow-auto">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className={`flex items-center gap-2 px-4 py-2.5 transition-colors ${
                  activeDocId === doc.id ? "bg-emerald-600/10" : ""
                }`}
              >
                <span className={`text-xs ${doc.isModified ? "text-amber-400" : "text-ink-faint"}`}>
                  {doc.isModified ? "●" : "○"}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveDocument(doc.id)}
                  className="min-w-0 flex-1 cursor-pointer truncate text-left font-mono text-sm text-ink hover:text-emerald-400"
                  title={doc.name}
                >
                  {doc.name}
                </button>
                <span className="shrink-0 rounded border border-edge-1 bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase text-ink-faint">
                  {doc.language}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const name = window.prompt("Rename document", doc.name);
                    if (name && name.trim()) renameDocument(doc.id, name.trim());
                  }}
                  className="shrink-0 rounded-md border border-edge-1 px-2 py-1 text-[11px] text-ink-muted transition-colors hover:bg-surface-3 hover:text-ink"
                >
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => duplicateDocument(doc.id)}
                  className="shrink-0 rounded-md border border-edge-1 px-2 py-1 text-[11px] text-ink-muted transition-colors hover:bg-surface-3 hover:text-ink"
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => closeDocument(doc.id)}
                  disabled={documents.length <= 1}
                  className="shrink-0 rounded-md border border-red-500/30 px-2 py-1 text-[11px] text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-30"
                >
                  Close
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex-none rounded-xl border border-edge-1 bg-surface-1 p-4 shadow-lg shadow-black/20">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink">Workspace backup</h4>
          <p className="mt-1 text-xs leading-relaxed text-ink-faint">
            Saving stores the workspace snapshot in this browser for automatic restore. Exporting downloads a
            <code className="font-mono"> yaml-workspace.json </code>
            file you can re-import on another machine.
          </p>
        </div>
      </div>
    </ToolPage>
  );
}
