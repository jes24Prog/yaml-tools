import { parseDocument } from "yaml";
import { isPlainObject } from "../utils/yamlParser";

export interface ComposeServiceSummary {
  name: string;
  image?: string;
  build?: string;
  ports: string[];
  volumes: string[];
  environmentCount: number;
  dependsOn: string[];
  restart?: string;
  healthcheck: boolean;
}

export interface ComposeIssue {
  path: string;
  severity: "error" | "warning" | "info";
  message: string;
}

export interface ComposeInspectResult {
  detected: boolean;
  services: ComposeServiceSummary[];
  issues: ComposeIssue[];
}

const PORT_RE = /^(\d+:)?\d+(\/\w+)?$/u;

export function inspectDockerCompose(source: string): ComposeInspectResult {
  const doc = parseDocument(source);
  const issues: ComposeIssue[] = [];
  if (doc.errors.length > 0) {
    return { detected: false, services: [], issues: [{ path: "$", severity: "error", message: doc.errors[0].message }] };
  }
  const value = doc.toJS();
  if (!isPlainObject(value) || !isPlainObject(value.services)) {
    return { detected: false, services: [], issues: [] };
  }
  const servicesObj = value.services as Record<string, unknown>;
  const services: ComposeServiceSummary[] = Object.keys(servicesObj).map((name) => {
    const svc = servicesObj[name];
    const record = isPlainObject(svc) ? (svc as Record<string, unknown>) : {};
    const ports = Array.isArray(record.ports) ? record.ports.map((p) => String(p)) : [];
    const volumes = Array.isArray(record.volumes) ? record.volumes.map((v) => String(v)) : [];
    const environment = record.environment;
    const environmentCount = isPlainObject(environment) ? Object.keys(environment).length : Array.isArray(environment) ? environment.length : 0;
    const dependsOn = isPlainObject(record.depends_on) ? Object.keys(record.depends_on) : Array.isArray(record.depends_on) ? record.depends_on.map((d) => String(d)) : [];
    const healthcheck = record.healthcheck !== undefined;

    if (!record.image && !record.build) {
      issues.push({ path: `services.${name}`, severity: "error", message: `Service '${name}' must define 'image' or 'build'.` });
    }
    for (const port of ports) {
      const first = String(port).split(":")[0];
      if (!PORT_RE.test(String(port)) || (port !== first && !/^\d+$/u.test(first))) {
        issues.push({ path: `services.${name}.ports`, severity: "warning", message: `Port mapping '${port}' looks unusual.` });
      }
    }

    return {
      name,
      image: typeof record.image === "string" ? record.image : undefined,
      build: typeof record.build === "string" ? record.build : isPlainObject(record.build) ? String((record.build as Record<string, unknown>).context ?? "?") : undefined,
      ports,
      volumes,
      environmentCount,
      dependsOn,
      restart: typeof record.restart === "string" ? record.restart : undefined,
      healthcheck,
    };
  });
  return { detected: true, services, issues };
}
