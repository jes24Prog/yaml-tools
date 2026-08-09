import { parseAllDocuments } from "yaml";
import { stringify } from "yaml";
import { isPlainObject } from "../utils/yamlParser";

export const K8S_WORKLOAD_KINDS = [
  "Deployment",
  "StatefulSet",
  "DaemonSet",
  "ReplicaSet",
  "Pod",
  "Job",
  "CronJob",
];

export const K8S_KINDS = [
  ...K8S_WORKLOAD_KINDS,
  "Service",
  "ConfigMap",
  "Secret",
  "Namespace",
  "Ingress",
  "PersistentVolume",
  "PersistentVolumeClaim",
  "HorizontalPodAutoscaler",
  "ServiceAccount",
  "Role",
  "ClusterRole",
  "RoleBinding",
  "ClusterRoleBinding",
  "NetworkPolicy",
  "IngressClass",
  "ResourceQuota",
  "LimitRange",
];

export interface ContainerSummary {
  name: string;
  image: string;
  ports: string[];
  resources: { requests?: string; limits?: string };
}

export interface K8sResourceSummary {
  index: number;
  kind: string;
  apiVersion: string;
  name: string;
  namespace?: string;
  replicas?: number;
  containers: ContainerSummary[];
  labels: string[];
  annotations: string[];
}

export interface K8sIssue {
  path: string;
  severity: "error" | "warning" | "info";
  message: string;
}

export interface K8sInspectResult {
  resources: K8sResourceSummary[];
  issues: K8sIssue[];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return isPlainObject(value) ? (value as Record<string, unknown>) : null;
}

function containersOf(resource: Record<string, unknown>): ContainerSummary[] {
  const spec = asRecord(resource.spec);
  if (!spec) {
    return [];
  }
  if (resource.kind === "Pod") {
    const template = asRecord(spec.template) ?? resource;
    const containers = template.spec && asRecord(template.spec) ? asRecord(template.spec) : spec;
    return containers ? listContainers(containers) : [];
  }
  const template = asRecord(spec.template);
  if (!template) {
    return [];
  }
  const podSpec = asRecord(template.spec);
  return podSpec ? listContainers(podSpec) : [];
}

function listContainers(podSpec: Record<string, unknown>): ContainerSummary[] {
  const raw = Array.isArray(podSpec.containers) ? podSpec.containers : [];
  return raw.map((container) => {
    const c = asRecord(container) ?? {};
    const ports = Array.isArray(c.ports)
      ? (c.ports as unknown[]).map((port) => {
          const p = asRecord(port) ?? {};
          return `${p.name ? `${String(p.name)}:` : ""}${String(p.containerPort ?? "?")}/${String(p.protocol ?? "TCP")}`;
        })
      : [];
    const resources = asRecord(c.resources);
    return {
      name: typeof c.name === "string" ? c.name : "?",
      image: typeof c.image === "string" ? c.image : "?",
      ports,
      resources: {
        requests: resources && resources.requests ? String((resources.requests as Record<string, unknown>).cpu ?? "") : undefined,
        limits: resources && resources.limits ? String((resources.limits as Record<string, unknown>).cpu ?? "") : undefined,
      },
    };
  });
}

function dns1123(name: string): boolean {
  return /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/u.test(name);
}

export function inspectKubernetes(source: string): K8sInspectResult {
  const docs = parseAllDocuments(source);
  const resources: K8sResourceSummary[] = [];
  const issues: K8sIssue[] = [];

  docs.forEach((doc, index) => {
    if (doc.errors.length > 0) {
      issues.push({ path: `#${index + 1}`, severity: "error", message: `Document ${index + 1}: ${doc.errors[0].message}` });
      return;
    }
    const value = doc.toJS();
    const record = asRecord(value);
    if (!record) {
      issues.push({ path: `#${index + 1}`, severity: "info", message: `Document ${index + 1} is not a Kubernetes object.` });
      return;
    }
    if (typeof record.apiVersion !== "string" || typeof record.kind !== "string") {
      issues.push({ path: `#${index + 1}`, severity: "info", message: `Document ${index + 1} is not a Kubernetes object (missing apiVersion/kind).` });
      return;
    }

    const metadata = asRecord(record.metadata) ?? {};
    const name = typeof metadata.name === "string" ? metadata.name : "";
    const namespace = typeof metadata.namespace === "string" ? metadata.namespace : undefined;
    const labels = metadata.labels && asRecord(metadata.labels) ? Object.keys(metadata.labels) : [];
    const annotations = metadata.annotations && asRecord(metadata.annotations) ? Object.keys(metadata.annotations) : [];

    if (!name) {
      issues.push({ path: `#${index + 1}`, severity: "error", message: `Resource '${record.kind}' is missing metadata.name.` });
    } else if (!dns1123(name)) {
      issues.push({ path: `#${index + 1}`, severity: "error", message: `Resource name '${name}' is not a valid DNS-1123 subdomain.` });
    }

    let replicas: number | undefined;
    const spec = asRecord(record.spec);
    if (spec && typeof spec.replicas === "number") {
      replicas = spec.replicas;
      if (!Number.isInteger(replicas) || replicas < 0) {
        issues.push({ path: `#${index + 1}.spec.replicas`, severity: "error", message: `Replicas must be a non-negative integer, got '${replicas}'.` });
      }
    }

    const containers = containersOf(record);

    if (K8S_WORKLOAD_KINDS.includes(record.kind)) {
      if (containers.length === 0) {
        issues.push({ path: `#${index + 1}`, severity: "error", message: `Workload '${record.kind}' has no containers defined.` });
      }
      for (const container of containers) {
        if (container.image === "?" || container.image === "") {
          issues.push({ path: `#${index + 1}`, severity: "error", message: `Container '${container.name}' has no image.` });
        } else if (container.image.endsWith(":latest") || !container.image.includes(":")) {
          issues.push({ path: `#${index + 1}`, severity: "warning", message: `Container '${container.name}' uses an unpinned image tag '${container.image}'.` });
        }
        if (!container.resources.limits && !container.resources.requests) {
          issues.push({ path: `#${index + 1}`, severity: "warning", message: `Container '${container.name}' has no resource requests/limits.` });
        }
      }
      const selector = spec && asRecord(spec.selector);
      const templateLabelsRecord =
        record.kind === "Pod"
          ? (metadata.labels as Record<string, unknown> | undefined)
          : (asRecord(asRecord(asRecord(spec)?.template)?.metadata)?.labels as Record<string, unknown> | undefined);
      if (selector && asRecord(selector.matchLabels) && templateLabelsRecord) {
        const matchLabels = selector.matchLabels as Record<string, unknown>;
        for (const key of Object.keys(matchLabels)) {
          if (templateLabelsRecord[key] !== matchLabels[key]) {
            issues.push({ path: `#${index + 1}.spec.selector.matchLabels.${key}`, severity: "error", message: `Selector label '${key}' does not match the pod template label.` });
          }
        }
      }
    }

    if (record.kind === "Service") {
      const serviceSpec = asRecord(record.spec) ?? {};
      const ports = Array.isArray(serviceSpec.ports) ? serviceSpec.ports : [];
      for (const port of ports) {
        const p = asRecord(port) ?? {};
        if (typeof p.port !== "number" || (typeof p.targetPort === "number" && p.targetPort <= 0)) {
          issues.push({ path: `#${index + 1}.spec.ports`, severity: "error", message: "Service ports must be positive integers." });
        }
      }
    }

    if (record.kind === "CronJob") {
      const jobTemplate = spec && asRecord(spec.jobTemplate);
      const jobSpec = jobTemplate && asRecord(jobTemplate.spec);
      if (jobSpec && typeof jobSpec.backoffLimit === "number" && jobSpec.backoffLimit < 0) {
        issues.push({ path: `#${index + 1}.spec.jobTemplate.spec.backoffLimit`, severity: "error", message: "backoffLimit cannot be negative." });
      }
    }

    resources.push({
      index,
      kind: record.kind,
      apiVersion: record.apiVersion,
      name,
      namespace,
      replicas,
      containers,
      labels,
      annotations,
    });
  });

  return { resources, issues };
}

export interface K8sGeneratorForm {
  kind: string;
  name: string;
  namespace: string;
  labels: string;
  image: string;
  replicas: string;
  ports: string;
  containerPort: string;
  type: string;
  data: string;
  stringData: string;
  host: string;
  path: string;
  schedule: string;
  cpu: string;
  memory: string;
  minReplicas: string;
  maxReplicas: string;
  targetCpu: string;
  accessModes: string;
  size: string;
}

function parseLabels(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of text.split(",")) {
    const trimmed = pair.trim();
    if (!trimmed) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq > 0) {
      out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  }
  return out;
}

export function buildKubernetesManifest(form: K8sGeneratorForm): string {
  const labels = parseLabels(form.labels);
  const name = form.name || "example-app";
  const base = {
    apiVersion: k8sApiVersion(form.kind),
    kind: form.kind,
    metadata: {
      name,
      ...(form.namespace ? { namespace: form.namespace } : {}),
      ...(Object.keys(labels).length > 0 ? { labels } : {}),
    },
  };

  let object: Record<string, unknown>;
  switch (form.kind) {
    case "Namespace": {
      object = { ...base, metadata: base.metadata };
      break;
    }
    case "ConfigMap": {
      object = { ...base, data: parseKeyValue(form.data) };
      break;
    }
    case "Secret": {
      object = {
        ...base,
        type: "Opaque",
        stringData: parseKeyValue(form.stringData || form.data),
      };
      break;
    }
    case "PersistentVolumeClaim": {
      object = {
        ...base,
        spec: {
          accessModes: form.accessModes ? form.accessModes.split(",").map((item) => item.trim()) : ["ReadWriteOnce"],
          resources: {
            requests: { storage: form.size || "1Gi" },
          },
        },
      };
      break;
    }
    case "Service": {
      object = {
        ...base,
        spec: {
          ...(form.type ? { type: form.type } : {}),
          selector: labels,
          ports: form.ports
            ? form.ports.split(",").map((entry) => {
                const [port, target] = entry.split(":").map((item) => item.trim());
                return {
                  port: Number(port),
                  ...(target ? { targetPort: Number(target) } : {}),
                };
              })
            : [{ port: 80 }],
        },
      };
      break;
    }
    case "Ingress": {
      object = {
        ...base,
        spec: {
          rules: [
            {
              host: form.host || "example.com",
              http: {
                paths: [
                  {
                    path: form.path || "/",
                    pathType: "Prefix",
                    backend: {
                      service: {
                        name,
                        port: { number: Number(form.containerPort || form.ports?.split(":")[0] || 80) },
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      };
      break;
    }
    case "CronJob": {
      object = {
        ...base,
        spec: {
          schedule: form.schedule || "*/5 * * * *",
          jobTemplate: {
            spec: {
              template: {
                spec: {
                  restartPolicy: "OnFailure",
                  containers: [
                    {
                      name,
                      image: form.image || "busybox",
                    },
                  ],
                },
              },
            },
          },
        },
      };
      break;
    }
    case "HorizontalPodAutoscaler": {
      object = {
        ...base,
        spec: {
          scaleTargetRef: {
            apiVersion: "apps/v1",
            kind: "Deployment",
            name,
          },
          minReplicas: Number(form.minReplicas || 1),
          maxReplicas: Number(form.maxReplicas || 3),
          targetCPUUtilizationPercentage: Number(form.targetCpu || 70),
        },
      };
      break;
    }
    case "StatefulSet":
    case "DaemonSet":
    case "Deployment":
    case "ReplicaSet":
    default: {
      object = {
        ...base,
        spec: {
          ...(form.kind !== "DaemonSet" ? { replicas: Number(form.replicas || 1) } : {}),
          selector: {
            matchLabels: labels,
          },
          template: {
            metadata: { labels },
            spec: {
              containers: [
                {
                  name,
                  image: form.image || "nginx",
                  ...(form.containerPort
                    ? { ports: [{ containerPort: Number(form.containerPort) }] }
                    : {}),
                  ...(form.cpu || form.memory
                    ? {
                        resources: {
                          requests: {
                            ...(form.cpu ? { cpu: form.cpu } : {}),
                            ...(form.memory ? { memory: form.memory } : {}),
                          },
                        },
                      }
                    : {}),
                },
              ],
            },
          },
        },
      };
    }
  }

  return stringify(object, { lineWidth: 0 });
}

function k8sApiVersion(kind: string): string {
  if (kind === "Namespace" || kind === "ConfigMap" || kind === "Secret" || kind === "Service") {
    return "v1";
  }
  if (kind === "Ingress") {
    return "networking.k8s.io/v1";
  }
  if (kind === "PersistentVolumeClaim") {
    return "v1";
  }
  if (kind === "CronJob") {
    return "batch/v1";
  }
  if (kind === "HorizontalPodAutoscaler") {
    return "autoscaling/v2";
  }
  return "apps/v1";
}

function parseKeyValue(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq > 0) {
      out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  }
  return out;
}

export const K8S_GENERATOR_KINDS = [
  "Deployment",
  "StatefulSet",
  "DaemonSet",
  "Service",
  "ConfigMap",
  "Secret",
  "Namespace",
  "Ingress",
  "PersistentVolumeClaim",
  "CronJob",
  "HorizontalPodAutoscaler",
];
