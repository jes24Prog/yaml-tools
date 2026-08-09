import { useEffect, useMemo, useRef, useState } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { CATEGORY_LABELS, TOOLS } from "../../app/toolRegistry";
import { ToolGlyph } from "../Icons";

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, setActiveToolId, recordRecent, favorites, toggleFavorite } =
    useWorkbench();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (paletteOpen) {
      setQuery("");
      window.setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [paletteOpen]);

  useEffect(() => {
    if (!paletteOpen) {
      return;
    }
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [paletteOpen, setPaletteOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? TOOLS.filter(
          (tool) =>
            tool.name.toLowerCase().includes(q) ||
            tool.description.toLowerCase().includes(q) ||
            tool.keywords.some((keyword) => keyword.toLowerCase().includes(q)),
        )
      : TOOLS.slice(0, 12);
    const favoriteFirst = [...list].sort((a, b) => {
      const af = favorites.includes(a.id) ? 0 : 1;
      const bf = favorites.includes(b.id) ? 0 : 1;
      return af - bf;
    });
    return favoriteFirst;
  }, [query, favorites]);

  if (!paletteOpen) {
    return null;
  }

  const select = (id: string) => {
    setActiveToolId(id);
    recordRecent(id);
    setPaletteOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-20 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setPaletteOpen(false);
        }
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-edge-1 bg-surface-1 shadow-2xl">
        <div className="flex items-center gap-2 border-b border-edge-1 px-3">
          <ToolGlyph icon="search" className="h-4 w-4 shrink-0 text-ink-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tools…"
            className="w-full bg-transparent py-3 text-sm text-ink outline-none placeholder:text-ink-faint"
          />
          <kbd className="rounded border border-edge-1 bg-surface-2 px-1.5 font-mono text-[10px] text-ink-faint">
            Esc
          </kbd>
        </div>
        <ul className="max-h-96 overflow-y-auto p-1.5">
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-ink-faint">No tools match “{query}”.</li>
          )}
          {results.map((tool) => {
            const isFavorite = favorites.includes(tool.id);
            return (
              <li key={tool.id}>
                <button
                  type="button"
                  onClick={() => select(tool.id)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2"
                >
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-md bg-surface-2 text-ink-muted">
                    <ToolGlyph icon={tool.icon} className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink">{tool.name}</span>
                    <span className="block truncate text-xs text-ink-faint">{tool.description}</span>
                  </span>
                  <span className="flex-none text-[10px] uppercase tracking-wide text-ink-faint">
                    {CATEGORY_LABELS[tool.category]}
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="Toggle favorite"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleFavorite(tool.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.stopPropagation();
                        toggleFavorite(tool.id);
                      }
                    }}
                    className={`flex-none text-sm ${
                      isFavorite ? "text-amber-400" : "text-ink-faint hover:text-amber-400"
                    }`}
                  >
                    {isFavorite ? "★" : "☆"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
