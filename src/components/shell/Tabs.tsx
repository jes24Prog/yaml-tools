import { useWorkbench } from "../../app/workbenchContext";
import { ToolGlyph } from "../Icons";
import { IconButton } from "../ui";
import type { DocLanguage } from "../../types/workbench";

const LANGUAGE_DOT: Record<DocLanguage, string> = {
  yaml: "bg-emerald-400",
  json: "bg-amber-400",
  toml: "bg-sky-400",
  env: "bg-violet-400",
  properties: "bg-pink-400",
  xml: "bg-orange-400",
  text: "bg-zinc-400",
};

const LANGUAGE_LABEL: Record<DocLanguage, string> = {
  yaml: "yaml",
  json: "json",
  toml: "toml",
  env: "env",
  properties: "props",
  xml: "xml",
  text: "txt",
};

export function Tabs() {
  const { documents, activeDocId, setActiveDocument, closeDocument, duplicateDocument } =
    useWorkbench();

  if (documents.length === 0) {
    return (
      <div className="flex h-9 flex-none items-center border-b border-edge-1 bg-surface-1 px-4 text-xs text-ink-faint">
        No open documents
      </div>
    );
  }

  return (
    <div className="flex h-9 flex-none items-end gap-px overflow-x-auto border-b border-edge-1 bg-surface-1 px-1">
      {documents.map((doc) => {
        const active = doc.id === activeDocId;
        return (
          <div
            key={doc.id}
            role="button"
            tabIndex={0}
            onClick={() => setActiveDocument(doc.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                setActiveDocument(doc.id);
              }
            }}
            className={`group flex max-w-52 flex-none cursor-pointer select-none items-center gap-2 rounded-t-lg border border-b-0 px-3 py-1.5 text-xs transition-colors ${
              active
                ? "border-edge-1 bg-surface-2 font-semibold text-ink"
                : "border-transparent text-ink-muted hover:bg-surface-2/60 hover:text-ink"
            }`}
            title={doc.name}
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${LANGUAGE_DOT[doc.language]}`} />
            <span className="truncate">{doc.name}</span>
            {doc.isModified && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" title="Modified" />
            )}
            <span className="hidden shrink-0 font-mono text-[10px] text-ink-faint group-hover:inline md:inline">
              {LANGUAGE_LABEL[doc.language]}
            </span>
            <IconButton title="Close document" onClick={() => closeDocument(doc.id)}>
              <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor" aria-hidden="true">
                <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
              </svg>
            </IconButton>
          </div>
        );
      })}
      <div className="flex flex-none items-center gap-0.5 px-1 pb-0.5">
        <IconButton
          title="Duplicate active document"
          onClick={() => {
            const active = documents.find((doc) => doc.id === activeDocId);
            if (active) {
              duplicateDocument(active.id);
            }
          }}
        >
          <ToolGlyph icon="file" className="h-3.5 w-3.5" />
        </IconButton>
      </div>
    </div>
  );
}
