import { useMemo, useState } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import {
  createSnippet,
  deleteSnippet,
  DEFAULT_SNIPPETS,
  loadSnippets,
  saveSnippets,
  toggleSnippetFavorite,
  upsertSnippet,
  type Snippet,
} from "../../services/snippetService";
import { ToolPage, ToolButton, Stat } from "../shared/ToolShell";

type Draft = Omit<Snippet, "id" | "favorite" | "createdAt" | "updatedAt">;

const EMPTY_DRAFT: Draft = { name: "", category: "General", content: "" };

export default function SnippetsTool() {
  const { replaceActiveDocument, notify } = useWorkbench();

  const [snippets, setSnippets] = useState<Snippet[]>(() => {
    const stored = loadSnippets();
    return stored.length > 0 ? stored : DEFAULT_SNIPPETS;
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  const persist = (next: Snippet[]) => {
    setSnippets(next);
    saveSnippets(next);
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    snippets.forEach((snippet) => set.add(snippet.category || "General"));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [snippets]);

  const selected = snippets.find((snippet) => snippet.id === selectedId) ?? null;

  const selectSnippet = (snippet: Snippet) => {
    setSelectedId(snippet.id);
    setDraft({ name: snippet.name, category: snippet.category, content: snippet.content });
  };

  const startNew = () => {
    setSelectedId(null);
    setDraft(EMPTY_DRAFT);
  };

  const saveDraft = () => {
    if (draft.name.trim() === "") {
      notify("Snippet needs a name.", "warning");
      return;
    }
    const snippet = createSnippet(draft.name.trim(), draft.category.trim() || "General", draft.content);
    const next = upsertSnippet(snippets, snippet);
    persist(next);
    setSelectedId(snippet.id);
    notify("Snippet saved.", "success");
  };

  const removeSelected = () => {
    if (!selected) return;
    persist(deleteSnippet(snippets, selected.id));
    setSelectedId(null);
    setDraft(EMPTY_DRAFT);
    notify("Snippet deleted.", "info");
  };

  const toggleFavorite = (id: string) => {
    persist(toggleSnippetFavorite(snippets, id));
  };

  const insert = (content: string) => {
    replaceActiveDocument(content);
    notify("Inserted snippet into the active document.", "success");
  };

  const favorites = snippets.filter((snippet) => snippet.favorite).length;

  return (
    <ToolPage
      icon="snippets"
      title="Snippets"
      description="Reusable YAML building blocks stored locally in your browser."
      actions={
        <>
          <ToolButton onClick={startNew}>New snippet</ToolButton>
          <ToolButton primary onClick={saveDraft}>Save</ToolButton>
        </>
      }
    >
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex flex-none flex-wrap items-center gap-5 rounded-xl border border-edge-1 bg-surface-1 px-4 py-3 shadow-lg shadow-black/20">
          <Stat label="snippets" value={snippets.length} accent="text-ink-strong" />
          <Stat label="categories" value={categories.length} accent="text-sky-400" />
          <Stat label="favorites" value={favorites} accent="text-amber-400" />
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-edge-1 bg-surface-1 shadow-lg shadow-black/20">
            <div className="flex flex-none items-center gap-2 border-b border-edge-1 px-3 py-2">
              {categories.map((category) => (
                <span key={category} className="rounded border border-edge-1 bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase text-ink-muted">
                  {category}
                </span>
              ))}
            </div>
            <ul className="min-h-0 flex-1 divide-y divide-edge-0 overflow-auto">
              {snippets.map((snippet) => (
                <li
                  key={snippet.id}
                  className={`flex cursor-pointer items-center gap-2 px-3 py-2 transition-colors hover:bg-surface-2 ${
                    selectedId === snippet.id ? "bg-emerald-600/10" : ""
                  }`}
                  onClick={() => selectSnippet(snippet)}
                >
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleFavorite(snippet.id);
                    }}
                    className={`shrink-0 text-sm ${snippet.favorite ? "text-amber-400" : "text-ink-faint hover:text-ink"}`}
                    aria-label="Toggle favorite"
                  >
                    {snippet.favorite ? "★" : "☆"}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">{snippet.name}</div>
                    <div className="truncate text-[11px] text-ink-faint">{snippet.category}</div>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      insert(snippet.content);
                    }}
                    className="shrink-0 rounded-md border border-emerald-500/40 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/10"
                  >
                    Insert
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex min-h-0 flex-col gap-3 overflow-auto rounded-xl border border-edge-1 bg-surface-1 p-4 shadow-lg shadow-black/20">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-ink-muted">Name</span>
                <input
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="deployment-example"
                  className="rounded-md border border-edge-1 bg-surface-0 px-2.5 py-1.5 text-sm text-ink outline-none focus:border-emerald-500/50"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-ink-muted">Category</span>
                <input
                  value={draft.category}
                  onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
                  placeholder="General"
                  className="rounded-md border border-edge-1 bg-surface-0 px-2.5 py-1.5 text-sm text-ink outline-none focus:border-emerald-500/50"
                />
              </label>
            </div>
            <label className="flex min-h-0 flex-1 flex-col gap-1">
              <span className="text-xs font-semibold text-ink-muted">Content</span>
              <textarea
                value={draft.content}
                onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))}
                placeholder={"app:\n  image: nginx:latest\n  ports:\n    - '8080:80'"}
                spellCheck={false}
                className="min-h-0 w-full flex-1 resize-none rounded-md border border-edge-1 bg-surface-0 p-2.5 font-mono text-sm text-ink outline-none focus:border-emerald-500/50"
              />
            </label>
            <div className="flex flex-none items-center gap-2">
              <button
                type="button"
                onClick={saveDraft}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => insert(draft.content)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-edge-1 bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink-strong transition-colors hover:bg-surface-3"
              >
                Insert into document
              </button>
              {selected && (
                <button
                  type="button"
                  onClick={removeSelected}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/10"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
