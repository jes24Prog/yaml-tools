import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  DocLanguage,
  NotificationItem,
  NotifyKind,
  WorkbenchDocument,
  WorkbenchSettings,
} from "../types/workbench";
import { downloadYaml } from "../utils/download";
import {
  languageFromFileName,
  loadSettings,
  parseWorkspace,
  saveSettings,
  serializeWorkspace,
} from "../services/workspaceService";
import { yamlToJson, yamlToToml, yamlToEnv, yamlToProperties, yamlToXml } from "../services/converterService";

const DOCS_KEY = "yaml-workbench:documents";
const FAVORITES_KEY = "yaml-workbench:favorites";
const RECENTS_KEY = "yaml-workbench:recents";
const ACTIVE_DOC_KEY = "yaml-workbench:activeDoc";

function uniqueId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function newDocument(name?: string, content = "", language: DocLanguage = "yaml"): WorkbenchDocument {
  const now = Date.now();
  return {
    id: uniqueId(),
    name: name ?? "untitled.yaml",
    content,
    language,
    isModified: false,
    createdAt: now,
    updatedAt: now,
  };
}

function loadStoredDocuments(): WorkbenchDocument[] {
  try {
    const raw = window.localStorage.getItem(DOCS_KEY);
    if (!raw) {
      return [newDocument()];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [newDocument()];
    }
    return parsed.map((doc) => {
      const record = doc as Partial<WorkbenchDocument>;
      return {
        id: String(record.id ?? uniqueId()),
        name: String(record.name ?? "untitled.yaml"),
        content: String(record.content ?? ""),
        language: (record.language as DocLanguage) ?? "yaml",
        isModified: Boolean(record.isModified),
        createdAt: Number(record.createdAt ?? Date.now()),
        updatedAt: Number(record.updatedAt ?? Date.now()),
      };
    });
  } catch {
    return [newDocument()];
  }
}

function loadActiveDocId(documents: WorkbenchDocument[]): string {
  try {
    const stored = window.localStorage.getItem(ACTIVE_DOC_KEY);
    if (stored && documents.some((doc) => doc.id === stored)) {
      return stored;
    }
  } catch {
    // ignore
  }
  return documents[0]?.id ?? "";
}

function loadList(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export interface WorkbenchContextValue {
  documents: WorkbenchDocument[];
  activeDocId: string;
  activeDocument: WorkbenchDocument;
  createDocument: (name?: string, content?: string, language?: DocLanguage) => string;
  updateDocument: (id: string, content: string) => void;
  renameDocument: (id: string, name: string) => void;
  duplicateDocument: (id: string) => void;
  closeDocument: (id: string) => void;
  setActiveDocument: (id: string) => void;
  replaceActiveDocument: (content: string, name?: string) => void;
  importFiles: (files: File[]) => Promise<number>;
  exportDocument: (doc: WorkbenchDocument, format?: string) => void;
  saveWorkspace: () => void;
  exportWorkspace: () => void;
  importWorkspace: (file: File) => Promise<void>;

  settings: WorkbenchSettings;
  updateSettings: (patch: Partial<WorkbenchSettings>) => void;
  themeMode: "dark" | "light";

  activeToolId: string;
  setActiveToolId: (id: string) => void;
  favorites: string[];
  toggleFavorite: (toolId: string) => void;
  recents: string[];
  recordRecent: (toolId: string) => void;

  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;

  notifications: NotificationItem[];
  notify: (message: string, kind?: NotifyKind) => void;
  dismissNotification: (id: string) => void;

  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  sidebarSearch: string;
  setSidebarSearch: (search: string) => void;
}

const WorkbenchContext = createContext<WorkbenchContextValue | null>(null);

export function useWorkbench(): WorkbenchContextValue {
  const value = useContext(WorkbenchContext);
  if (!value) {
    throw new Error("useWorkbench must be used within WorkbenchProvider.");
  }
  return value;
}

const EXPORT_TO_EXTENSION: Record<string, string> = {
  yaml: "yaml",
  json: "json",
  toml: "toml",
  env: "env",
  properties: "properties",
  xml: "xml",
};

export function WorkbenchProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<WorkbenchDocument[]>(loadStoredDocuments);
  const [activeDocId, setActiveDocId] = useState<string>("");
  const [settings, setSettings] = useState<WorkbenchSettings>(loadSettings);
  const [favorites, setFavorites] = useState<string[]>(() => loadList(FAVORITES_KEY));
  const [recents, setRecents] = useState<string[]>(() => loadList(RECENTS_KEY));
  const [activeToolId, setActiveToolIdState] = useState<string>("yaml-editor");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false,
  );
  const docsRef = useRef(documents);
  docsRef.current = documents;

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) {
      return;
    }
    const handler = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  // Initialize active document id after documents load.
  useEffect(() => {
    setActiveDocId((current) => current || loadActiveDocId(documents));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist documents (debounced) so the workspace is restored on reload.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(DOCS_KEY, JSON.stringify(documents));
      } catch {
        // storage full/unavailable — ignore
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [documents]);

  useEffect(() => {
    if (!activeDocId) {
      return;
    }
    try {
      window.localStorage.setItem(ACTIVE_DOC_KEY, activeDocId);
    } catch {
      // ignore
    }
  }, [activeDocId]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    try {
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }, [favorites]);

  useEffect(() => {
    try {
      window.localStorage.setItem(RECENTS_KEY, JSON.stringify(recents));
    } catch {
      // ignore
    }
  }, [recents]);

  const notify = useCallback((message: string, kind: NotifyKind = "info") => {
    const item: NotificationItem = {
      id: uniqueId(),
      message,
      kind,
      timestamp: Date.now(),
    };
    setNotifications((current) => [...current, item]);
    window.setTimeout(() => {
      setNotifications((current) => current.filter((n) => n.id !== item.id));
    }, 4200);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((current) => current.filter((n) => n.id !== id));
  }, []);

  const createDocument = useCallback(
    (name?: string, content = "", language: DocLanguage = "yaml") => {
      const doc = newDocument(name, content, language);
      setDocuments((current) => [...current, doc]);
      setActiveDocId(doc.id);
      return doc.id;
    },
    [],
  );

  const updateDocument = useCallback((id: string, content: string) => {
    setDocuments((current) =>
      current.map((doc) => (doc.id === id ? { ...doc, content, isModified: true, updatedAt: Date.now() } : doc)),
    );
  }, []);

  const renameDocument = useCallback((id: string, name: string) => {
    setDocuments((current) => current.map((doc) => (doc.id === id ? { ...doc, name } : doc)));
  }, []);

  const duplicateDocument = useCallback((id: string) => {
    const source = docsRef.current.find((doc) => doc.id === id);
    if (!source) {
      return;
    }
    const copy = newDocument(
      `${source.name.replace(/\.[^.]+$/u, "")}-copy.yaml`,
      source.content,
      source.language,
    );
    setDocuments((current) => [...current, copy]);
    setActiveDocId(copy.id);
  }, []);

  const closeDocument = useCallback((id: string) => {
    setDocuments((current) => {
      const next = current.filter((doc) => doc.id !== id);
      if (next.length === 0) {
        const fresh = newDocument();
        setActiveDocId(fresh.id);
        return [fresh];
      }
      if (docsRef.current.find((doc) => doc.id === id)?.id === activeDocId) {
        const index = current.findIndex((doc) => doc.id === id);
        const fallback = next[Math.min(index, next.length - 1)];
        setActiveDocId(fallback.id);
      }
      return next;
    });
  }, [activeDocId]);

  const replaceActiveDocument = useCallback((content: string, name?: string) => {
    setDocuments((current) =>
      current.map((doc) =>
        doc.id === activeDocId
          ? { ...doc, content, isModified: true, updatedAt: Date.now(), ...(name ? { name } : {}) }
          : doc,
      ),
    );
  }, [activeDocId]);

  const importFiles = useCallback(async (files: File[]) => {
    let count = 0;
    for (const file of files) {
      const text = await file.text();
      const language = languageFromFileName(file.name);
      createDocument(file.name, text, language);
      count += 1;
    }
    return count;
  }, [createDocument]);

  const exportDocument = useCallback(
    (doc: WorkbenchDocument, format?: string) => {
      const target = format ?? settings.defaultExportFormat;
      const extension = EXPORT_TO_EXTENSION[target] ?? "yaml";
      let content = doc.content;
      if (target === "json") {
        content = yamlToJson(doc.content).ok ? (yamlToJson(doc.content) as { ok: true; text: string }).text : doc.content;
      } else if (target === "toml") {
        const result = yamlToToml(doc.content);
        if (result.ok) {
          content = result.text;
        }
      } else if (target === "env") {
        const result = yamlToEnv(doc.content);
        if (result.ok) {
          content = result.text;
        }
      } else if (target === "properties") {
        const result = yamlToProperties(doc.content);
        if (result.ok) {
          content = result.text;
        }
      } else if (target === "xml") {
        const result = yamlToXml(doc.content);
        if (result.ok) {
          content = result.text;
        }
      }
      const baseName = doc.name.replace(/\.[^.]+$/u, "");
      downloadYaml(`${baseName}.${extension}`, content);
      notify(`Exported ${doc.name} as .${extension}.`, "success");
    },
    [settings.defaultExportFormat, notify],
  );

  const saveWorkspace = useCallback(() => {
    const json = serializeWorkspace(docsRef.current, activeDocId, activeToolId, settings);
    try {
      window.localStorage.setItem("yaml-workbench:workspace-snapshot", json);
      notify("Workspace saved to this browser.", "success");
    } catch {
      notify("Failed to save workspace.", "error");
    }
  }, [activeDocId, activeToolId, settings, notify]);

  const exportWorkspace = useCallback(() => {
    const json = serializeWorkspace(docsRef.current, activeDocId, activeToolId, settings);
    downloadYaml("yaml-workspace.json", json);
    notify("Workspace exported.", "success");
  }, [activeDocId, activeToolId, settings, notify]);

  const importWorkspace = useCallback(
    async (file: File) => {
      const text = await file.text();
      const result = parseWorkspace(text);
      if (!result.ok) {
        notify(`Import failed: ${result.error}`, "error");
        return;
      }
      const { snapshot } = result;
      const restored = snapshot.documents.map((doc) => ({
        ...doc,
        isModified: false,
      }));
      setDocuments(restored.length > 0 ? restored : [newDocument()]);
      const targetId = snapshot.activeDocId && restored.some((doc) => doc.id === snapshot.activeDocId)
        ? snapshot.activeDocId
        : restored[0]?.id ?? "";
      setActiveDocId(targetId);
      if (snapshot.activeToolId) {
        setActiveToolIdState(snapshot.activeToolId);
      }
      setSettings((current) => ({ ...current, ...snapshot.settings }));
      notify(`Workspace imported (${restored.length} document${restored.length === 1 ? "" : "s"}).`, "success");
    },
    [notify],
  );

  const updateSettings = useCallback((patch: Partial<WorkbenchSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const setActiveToolId = useCallback((id: string) => {
    setActiveToolIdState(id);
    setRecents((current) => [id, ...current.filter((item) => item !== id)].slice(0, 8));
  }, []);

  const toggleFavorite = useCallback((toolId: string) => {
    setFavorites((current) =>
      current.includes(toolId) ? current.filter((id) => id !== toolId) : [...current, toolId],
    );
  }, []);

  const recordRecent = useCallback((toolId: string) => {
    setRecents((current) => [toolId, ...current.filter((item) => item !== toolId)].slice(0, 8));
  }, []);

  const themeMode: "dark" | "light" =
    settings.theme === "system" ? (systemDark ? "dark" : "light") : settings.theme;

  const activeDocument =
    documents.find((doc) => doc.id === activeDocId) ?? documents[0] ?? newDocument();

  const value = useMemo<WorkbenchContextValue>(
    () => ({
      documents,
      activeDocId,
      activeDocument,
      createDocument,
      updateDocument,
      renameDocument,
      duplicateDocument,
      closeDocument,
      setActiveDocument: setActiveDocId,
      replaceActiveDocument,
      importFiles,
      exportDocument,
      saveWorkspace,
      exportWorkspace,
      importWorkspace,
      settings,
      updateSettings,
      themeMode,
      activeToolId,
      setActiveToolId,
      favorites,
      toggleFavorite,
      recents,
      recordRecent,
      paletteOpen,
      setPaletteOpen,
      notifications,
      notify,
      dismissNotification,
      sidebarCollapsed,
      setSidebarCollapsed,
      sidebarSearch,
      setSidebarSearch,
    }),
    [
      documents,
      activeDocId,
      activeDocument,
      createDocument,
      updateDocument,
      renameDocument,
      duplicateDocument,
      closeDocument,
      replaceActiveDocument,
      importFiles,
      exportDocument,
      saveWorkspace,
      exportWorkspace,
      importWorkspace,
      settings,
      updateSettings,
      themeMode,
      activeToolId,
      setActiveToolId,
      favorites,
      toggleFavorite,
      recents,
      recordRecent,
      paletteOpen,
      notifications,
      notify,
      dismissNotification,
      sidebarCollapsed,
      sidebarSearch,
    ],
  );

  return <WorkbenchContext.Provider value={value}>{children}</WorkbenchContext.Provider>;
}
