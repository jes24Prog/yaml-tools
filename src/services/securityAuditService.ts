import { parseAllDocuments, parseDocument } from "yaml";
import { isPlainObject } from "../utils/yamlParser";

export interface SecurityIssue {
  path: string;
  severity: "high" | "medium" | "low";
  message: string;
}

export interface SecurityAuditResult {
  issues: SecurityIssue[];
  error?: string;
}

export function auditYamlSecurity(source: string): SecurityAuditResult {
  const doc = parseDocument(source);
  if (doc.errors.length > 0) {
    return { issues: [{ path: "$", severity: "high", message: doc.errors[0].message }] };
  }
  const value = doc.toJS();
  const issues: SecurityIssue[] = [];

  const walk = (node: unknown, path: string): void => {
    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, `${path}[${index}]`));
      return;
    }
    if (!isPlainObject(node)) {
      return;
    }
    const record = node as Record<string, unknown>;

    if (record.securityContext && isPlainObject(record.securityContext)) {
      const securityContext = record.securityContext as Record<string, unknown>;
      if (securityContext.privileged === true) {
        issues.push({ path: `${path}.securityContext.privileged`, severity: "high", message: "Container runs as privileged." });
      }
      if (securityContext.runAsNonRoot === false) {
        issues.push({ path: `${path}.securityContext.runAsNonRoot`, severity: "medium", message: "Container explicitly allows running as root." });
      }
      const capabilities = securityContext.capabilities;
      if (isPlainObject(capabilities)) {
        const add = capabilities.add;
        if (Array.isArray(add) && add.some((cap) => cap === "ALL" || cap === "SYS_ADMIN" || cap === "NET_ADMIN")) {
          issues.push({ path: `${path}.securityContext.capabilities.add`, severity: "high", message: `Container adds privileged capabilities: ${add.join(", ")}.` });
        }
      }
    }

    if (record.hostNetwork === true) {
      issues.push({ path: `${path}.hostNetwork`, severity: "medium", message: "Pod uses host networking." });
    }
    if (record.hostPID === true || record.hostIPC === true) {
      issues.push({ path: `${path}.hostPID/hostIPC`, severity: "medium", message: "Pod shares host process/IPC namespaces." });
    }

    if (Array.isArray(record.volumes)) {
      for (const volume of record.volumes) {
        if (isPlainObject(volume) && "hostPath" in volume) {
          issues.push({ path: `${path}.volumes.${String(volume.name ?? "?")}`, severity: "medium", message: "Pod mounts a hostPath volume." });
        }
      }
    }

    if (isPlainObject(record.containerPort) || Array.isArray(record.containerPort)) {
      // Not a real shape — guarded against false traversal below.
    }

    if (typeof record.image === "string" && record.image.endsWith(":latest")) {
      issues.push({ path: `${path}.image`, severity: "low", message: `Image uses unpinned 'latest' tag: ${record.image}.` });
    }
    if (typeof record.image === "string" && !record.image.includes(":")) {
      issues.push({ path: `${path}.image`, severity: "low", message: `Image tag is not pinned: ${record.image}.` });
    }

    for (const key of Object.keys(record)) {
      const childPath = path === "" ? key : `${path}.${key}`;
      if (isPlainObject(record[key]) || Array.isArray(record[key])) {
        walk(record[key], childPath);
      }
    }
  };

  walk(value, "");
  return { issues };
}

export function auditKubernetesSecrets(source: string): SecurityAuditResult {
  const docs = parseAllDocuments(source);
  const issues: SecurityIssue[] = [];
  docs.forEach((doc, index) => {
    if (doc.errors.length > 0) {
      return;
    }
    const value = doc.toJS();
    if (!isPlainObject(value)) {
      return;
    }
    const record = value as Record<string, unknown>;
    if (typeof record.kind === "string" && (record.kind === "Secret" || record.kind === "ConfigMap")) {
      const data = record.data;
      if (isPlainObject(data)) {
        for (const key of Object.keys(data)) {
          if (/password|secret|token|api[_-]?key|private/iu.test(key)) {
            issues.push({
              path: `#${index + 1}.data.${key}`,
              severity: "medium",
              message: `Secret key '${key}' detected in ${record.kind} '${String((record.metadata as Record<string, unknown> | undefined)?.name ?? "?")}'.`,
            });
          }
        }
      }
      if (record.kind === "Secret" && data && isPlainObject(data) && !Object.keys(data).every((k) => isBase64(String(data[k])))) {
        issues.push({
          path: `#${index + 1}.data`,
          severity: "medium",
          message: "Secret data should be base64-encoded.",
        });
      }
    }
  });
  return { issues };
}

function isBase64(value: string): boolean {
  return /^[A-Za-z0-9+/]*={0,2}$/u.test(value) && value.length % 4 === 0;
}
