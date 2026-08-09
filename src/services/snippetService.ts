export interface Snippet {
  id: string;
  name: string;
  category: string;
  content: string;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "yaml-workbench:snippets";

export function loadSnippets(): Snippet[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isSnippet);
  } catch {
    return [];
  }
}

function isSnippet(value: unknown): value is Snippet {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.category === "string" &&
    typeof record.content === "string"
  );
}

export function saveSnippets(snippets: Snippet[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets));
  } catch {
    // Storage unavailable — ignore.
  }
}

export function createSnippet(name: string, category: string, content: string): Snippet {
  const now = Date.now();
  return {
    id: `snippet-${now}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    category: category || "General",
    content,
    favorite: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function upsertSnippet(snippets: Snippet[], snippet: Snippet): Snippet[] {
  const existing = snippets.findIndex((item) => item.id === snippet.id);
  const next = { ...snippet, updatedAt: Date.now() };
  if (existing === -1) {
    return [next, ...snippets];
  }
  const copy = [...snippets];
  copy[existing] = next;
  return copy;
}

export function deleteSnippet(snippets: Snippet[], id: string): Snippet[] {
  return snippets.filter((snippet) => snippet.id !== id);
}

export function toggleSnippetFavorite(snippets: Snippet[], id: string): Snippet[] {
  return snippets.map((snippet) =>
    snippet.id === id ? { ...snippet, favorite: !snippet.favorite } : snippet,
  );
}

export const DEFAULT_SNIPPETS: Snippet[] = [
  {
    id: "snippet-compose",
    name: "Docker Compose base",
    category: "Docker",
    content: `services:\n  app:\n    image: node:20-alpine\n    ports:\n      - "3000:3000"\n    volumes:\n      - ./src:/app/src\n    environment:\n      NODE_ENV: production\n`,
    favorite: true,
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: "snippet-deployment",
    name: "Kubernetes Deployment",
    category: "Kubernetes",
    content: `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: app\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: app\n  template:\n    metadata:\n      labels:\n        app: app\n    spec:\n      containers:\n        - name: app\n          image: nginx:1.27\n          ports:\n            - containerPort: 80\n`,
    favorite: true,
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: "snippet-service",
    name: "Kubernetes Service",
    category: "Kubernetes",
    content: `apiVersion: v1\nkind: Service\nmetadata:\n  name: app\nspec:\n  selector:\n    app: app\n  ports:\n    - port: 80\n      targetPort: 8080\n`,
    favorite: false,
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: "snippet-gha",
    name: "GitHub Actions CI",
    category: "CI/CD",
    content: `name: CI\non:\n  push:\n    branches: [main]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci\n      - run: npm test\n`,
    favorite: false,
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: "snippet-spring",
    name: "Spring Boot config",
    category: "Config",
    content: `server:\n  port: 8080\nspring:\n  datasource:\n    url: jdbc:postgresql://localhost:5432/app\n    username: app\n    password: \${DB_PASSWORD:-changeit}\nlogging:\n  level:\n    root: INFO\n`,
    favorite: false,
    createdAt: 0,
    updatedAt: 0,
  },
];
