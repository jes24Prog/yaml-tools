import { parseAllDocuments, parseDocument } from "yaml";
import { isPlainObject } from "../utils/yamlParser";

export type DetectedType =
  | "kubernetes"
  | "docker-compose"
  | "github-actions"
  | "gitlab-ci"
  | "azure-pipelines"
  | "openapi"
  | "generic";

export interface DetectionResult {
  type: DetectedType;
  label: string;
  detail: string;
}

const TYPE_LABELS: Record<DetectedType, string> = {
  kubernetes: "Kubernetes manifest",
  "docker-compose": "Docker Compose",
  "github-actions": "GitHub Actions workflow",
  "gitlab-ci": "GitLab CI pipeline",
  "azure-pipelines": "Azure Pipelines",
  openapi: "OpenAPI specification",
  generic: "Generic YAML document",
};

function firstObjectValue(source: string): Record<string, unknown> | null {
  const doc = parseDocument(source);
  if (doc.errors.length > 0) {
    return null;
  }
  const value = doc.toJS();
  return isPlainObject(value) ? (value as Record<string, unknown>) : null;
}

export function detectDocumentType(source: string): DetectionResult {
  const root = firstObjectValue(source);

  if (root) {
    if (typeof root.openapi === "string" && root.openapi.startsWith("3")) {
      return { type: "openapi", label: TYPE_LABELS.openapi, detail: `OpenAPI ${root.openapi}` };
    }
    if (typeof root.swagger === "string") {
      return { type: "openapi", label: TYPE_LABELS.openapi, detail: `Swagger ${root.swagger}` };
    }
    if (isPlainObject(root.services) && (root.services as Record<string, unknown>)[""]) {
      // Compose file with a service named "" (edge case) — fall through.
    }
    if (isPlainObject(root.services)) {
      return { type: "docker-compose", label: TYPE_LABELS["docker-compose"], detail: `${Object.keys(root.services as Record<string, unknown>).length} service(s) defined` };
    }
    if ("on" in root && (isPlainObject(root.on) || typeof root.on === "string")) {
      return { type: "github-actions", label: TYPE_LABELS["github-actions"], detail: "GitHub Actions workflow" };
    }
    if ("jobs" in root && isPlainObject(root.jobs)) {
      return { type: "github-actions", label: TYPE_LABELS["github-actions"], detail: `${Object.keys(root.jobs as Record<string, unknown>).length} job(s) defined` };
    }
    if ("trigger" in root || ("pool" in root && ("steps" in root || "jobs" in root))) {
      return { type: "azure-pipelines", label: TYPE_LABELS["azure-pipelines"], detail: "Azure Pipelines definition" };
    }
    if ("stages" in root || ("script" in root && isPlainObject(root.script)) || isPlainObject(root["before_script"]) || "image" in root) {
      return { type: "gitlab-ci", label: TYPE_LABELS["gitlab-ci"], detail: "GitLab CI pipeline" };
    }
  }

  // Kubernetes manifests may be multi-document.
  const allDocs = parseAllDocuments(source);
  let k8sCount = 0;
  for (const doc of allDocs) {
    if (doc.errors.length > 0) {
      continue;
    }
    const value = doc.toJS();
    if (isPlainObject(value)) {
      const record = value as Record<string, unknown>;
      if (typeof record.apiVersion === "string" && typeof record.kind === "string") {
        k8sCount += 1;
      }
    }
  }
  if (k8sCount > 0) {
    return { type: "kubernetes", label: TYPE_LABELS.kubernetes, detail: `${k8sCount} resource document(s)` };
  }

  return { type: "generic", label: TYPE_LABELS.generic, detail: "No known schema detected" };
}
