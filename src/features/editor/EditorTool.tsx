import { useEffect, useRef, useState } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { ToolButton, ToolPage, editorThemeFor } from "../shared/ToolShell";
import { YamlEditor } from "../../components/YamlEditor";

export default function EditorTool() {
  const {
    activeDocument,
    updateDocument,
    renameDocument,
    duplicateDocument,
    createDocument,
    closeDocument,
    themeMode,
    notify,
  } = useWorkbench();

  const [draft, setDraft] = useState(activeDocument.content);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(activeDocument.name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Keep draft in sync when switching documents.
  const activeIdRef = useRef(activeDocument.id);
  useEffect(() => {
    if (activeIdRef.current !== activeDocument.id) {
      activeIdRef.current = activeDocument.id;
      setDraft(activeDocument.content);
      setNameDraft(activeDocument.name);
      setRenaming(false);
    }
  }, [activeDocument.id, activeDocument.content, activeDocument.name]);

  const handleChange = (value: string) => {
    setDraft(value);
    updateDocument(activeDocument.id, value);
  };

  const commitRename = () => {
    const next = nameDraft.trim() || activeDocument.name;
    if (next !== activeDocument.name) {
      renameDocument(activeDocument.id, next);
      notify(`Renamed to ${next}.`, "success");
    }
    setRenaming(false);
  };

  const theme = editorThemeFor(themeMode);

  return (
    <ToolPage
      icon="file"
      title="Multi-Tab Editor"
      description="Edit the active document with Monaco. Create, duplicate, rename and close documents, or switch via the tab bar above."
      actions={
        <>
          <ToolButton onClick={() => createDocument()}>New document</ToolButton>
          <ToolButton onClick={() => duplicateDocument(activeDocument.id)}>Duplicate</ToolButton>
          <ToolButton variant="danger" onClick={() => closeDocument(activeDocument.id)} title="Close active document">
            Close
          </ToolButton>
        </>
      }
    >
      <div className="flex h-full min-h-[420px] flex-col gap-3">
        <div className="flex flex-none flex-wrap items-center justify-between gap-3 rounded-xl border border-edge-1 bg-surface-1 px-4 py-2.5 shadow-lg shadow-black/20">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${activeDocument.isModified ? "bg-amber-400" : "bg-emerald-400"}`}
              title={activeDocument.isModified ? "Modified" : "Saved"}
            />
            {renaming ? (
              <input
                ref={nameInputRef}
                value={nameDraft}
                autoFocus
                onChange={(event) => setNameDraft(event.target.value)}
                onBlur={commitRename}
                onKeyDown={(event) => {
                  if (event.key === "Enter") commitRename();
                  if (event.key === "Escape") setRenaming(false);
                }}
                className="w-64 rounded-md border border-edge-1 bg-surface-0 px-2 py-1 font-mono text-xs text-ink outline-none focus:border-emerald-500/50"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setNameDraft(activeDocument.name);
                  setRenaming(true);
                  window.setTimeout(() => nameInputRef.current?.focus(), 10);
                }}
                title="Rename"
                className="max-w-md truncate rounded px-2 py-1 font-mono text-xs font-semibold text-ink-strong hover:bg-surface-2"
              >
                {activeDocument.name}
              </button>
            )}
            <span className="rounded-full border border-edge-1 bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase text-ink-muted">
              {activeDocument.language}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
            <span>{activeDocument.content.split("\n").length} lines</span>
            <span>{activeDocument.content.length} chars</span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-edge-1 bg-surface-1 shadow-lg shadow-black/20">
          <YamlEditor
            value={draft}
            onChange={handleChange}
            theme={theme}
            ariaLabel="Active document editor"
          />
        </div>

        <p className="flex-none text-xs text-ink-faint">
          Editor settings (font size, tabs, word wrap, minimap) are configured in the Settings tool.
          Changes are saved to the document automatically.
        </p>
      </div>
    </ToolPage>
  );
}
