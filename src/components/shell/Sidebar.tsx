import { useMemo } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { CATEGORY_LABELS, TOOLS, toolById } from "../../app/toolRegistry";
import { CATEGORY_ICONS, ToolGlyph } from "../Icons";
import type { ToolCategoryId } from "../../types/workbench";

const CATEGORY_ORDER: ToolCategoryId[] = [
  "editor",
  "validation",
  "formatting",
  "conversion",
  "diff-merge",
  "query",
  "transformation",
  "schema",
  "analysis",
  "environment",
  "kubernetes",
  "docker",
  "cicd",
  "openapi",
  "templates",
  "snippets",
  "generator",
  "security",
  "workspace",
  "settings",
];

export function Sidebar() {
  const {
    activeToolId,
    setActiveToolId,
    favorites,
    toggleFavorite,
    sidebarCollapsed,
    sidebarSearch,
    setSidebarSearch,
  } = useWorkbench();

  const query = sidebarSearch.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!query) return TOOLS;
    return TOOLS.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.keywords.some((keyword) => keyword.toLowerCase().includes(query)),
    );
  }, [query]);

  const favoriteTools = favorites.map((id) => toolById(id)).filter((tool) => tool !== undefined);

  if (sidebarCollapsed) {
    return null;
  }

  return (
    <aside className="flex w-64 flex-none flex-col border-r border-edge-1 bg-surface-1/40">
      <div className="flex-none px-3 pb-2 pt-3">
        <div className="relative">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint">
            <ToolGlyph icon="search" className="h-3.5 w-3.5" />
          </span>
          <input
            value={sidebarSearch}
            onChange={(event) => setSidebarSearch(event.target.value)}
            placeholder="Search tools…"
            className="w-full rounded-lg border border-edge-1 bg-surface-0 py-1.5 pl-8 pr-3 text-xs text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-edge-1 focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {favoriteTools.length > 0 && !query && (
          <div className="mb-3">
            <div className="px-1.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
              Favorites
            </div>
            <ul className="space-y-px">
              {favoriteTools.map((tool) => (
                <ToolRow
                  key={tool.id}
                  name={tool.name}
                  icon={tool.icon}
                  active={activeToolId === tool.id}
                  onSelect={() => setActiveToolId(tool.id)}
                  onToggleFavorite={() => toggleFavorite(tool.id)}
                  favorite
                />
              ))}
            </ul>
          </div>
        )}

        {CATEGORY_ORDER.map((category) => {
          const tools = filtered.filter((tool) => tool.category === category);
          if (tools.length === 0) return null;
          return (
            <div key={category} className="mb-3">
              <div className="flex items-center gap-1.5 px-1.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                <ToolGlyph icon={CATEGORY_ICONS[category] ?? "file"} className="h-3 w-3" />
                {CATEGORY_LABELS[category]}
              </div>
              <ul className="space-y-px">
                {tools.map((tool) => (
                  <ToolRow
                    key={tool.id}
                    name={tool.name}
                    icon={tool.icon}
                    active={activeToolId === tool.id}
                    onSelect={() => setActiveToolId(tool.id)}
                    onToggleFavorite={() => toggleFavorite(tool.id)}
                    favorite={favorites.includes(tool.id)}
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function ToolRow({
  name,
  icon,
  active,
  onSelect,
  onToggleFavorite,
  favorite,
}: {
  name: string;
  icon: string;
  active: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  favorite: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
          active
            ? "bg-emerald-600/15 font-semibold text-emerald-400"
            : "text-ink-muted hover:bg-surface-2 hover:text-ink"
        }`}
      >
        <ToolGlyph icon={icon as never} className="h-3.5 w-3.5 shrink-0 opacity-80" />
        <span className="min-w-0 flex-1 truncate">{name}</span>
        <span
          role="button"
          tabIndex={0}
          aria-label="Toggle favorite"
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.stopPropagation();
              onToggleFavorite();
            }
          }}
          className={`shrink-0 text-sm opacity-0 transition-opacity group-hover:opacity-100 ${
            favorite ? "text-amber-400 opacity-100" : "text-ink-faint hover:text-amber-400"
          }`}
        >
          {favorite ? "★" : "☆"}
        </span>
      </button>
    </li>
  );
}
