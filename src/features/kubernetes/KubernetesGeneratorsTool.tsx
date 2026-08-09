import { useMemo, useState } from "react";
import { buildKubernetesManifest, K8S_GENERATOR_KINDS, type K8sGeneratorForm } from "../../services/k8sService";
import { ToolPage, OutputView, ToolButton } from "../shared/ToolShell";
import { useToolSource } from "../shared/hooks";

const DEFAULT_FORM: K8sGeneratorForm = {
  kind: "Deployment",
  name: "example-app",
  namespace: "",
  labels: "app=example-app",
  image: "nginx:latest",
  replicas: "2",
  ports: "80",
  containerPort: "80",
  type: "ClusterIP",
  data: "KEY=value",
  stringData: "PASSWORD=supersecret",
  host: "app.example.com",
  path: "/",
  schedule: "*/5 * * * *",
  cpu: "250m",
  memory: "128Mi",
  minReplicas: "1",
  maxReplicas: "5",
  targetCpu: "70",
  accessModes: "ReadWriteOnce",
  size: "1Gi",
};

const KIND_FIELDS: Array<{ kind: string; label: string; fields: Array<{ key: keyof K8sGeneratorForm; label: string; placeholder?: string }> }> = [
  {
    kind: "Deployment",
    label: "Deployment / StatefulSet / ReplicaSet",
    fields: [
      { key: "name", label: "Name", placeholder: "example-app" },
      { key: "namespace", label: "Namespace", placeholder: "default" },
      { key: "labels", label: "Labels (k=v,k=v)", placeholder: "app=example-app" },
      { key: "image", label: "Image", placeholder: "nginx:latest" },
      { key: "replicas", label: "Replicas", placeholder: "2" },
      { key: "containerPort", label: "Container port", placeholder: "80" },
      { key: "cpu", label: "CPU request", placeholder: "250m" },
      { key: "memory", label: "Memory request", placeholder: "128Mi" },
    ],
  },
  {
    kind: "Service",
    label: "Service",
    fields: [
      { key: "name", label: "Name", placeholder: "example-app" },
      { key: "namespace", label: "Namespace", placeholder: "default" },
      { key: "labels", label: "Selector labels (k=v,k=v)", placeholder: "app=example-app" },
      { key: "type", label: "Type", placeholder: "ClusterIP" },
      { key: "ports", label: "Ports (port:target,port:target)", placeholder: "80:8080" },
    ],
  },
  {
    kind: "ConfigMap",
    label: "ConfigMap",
    fields: [
      { key: "name", label: "Name", placeholder: "app-config" },
      { key: "namespace", label: "Namespace", placeholder: "default" },
      { key: "labels", label: "Labels (k=v,k=v)", placeholder: "app=example-app" },
      { key: "data", label: "Data (KEY=value per line)", placeholder: "KEY=value" },
    ],
  },
  {
    kind: "Secret",
    label: "Secret",
    fields: [
      { key: "name", label: "Name", placeholder: "app-secret" },
      { key: "namespace", label: "Namespace", placeholder: "default" },
      { key: "labels", label: "Labels (k=v,k=v)", placeholder: "app=example-app" },
      { key: "stringData", label: "stringData (KEY=value per line)", placeholder: "PASSWORD=supersecret" },
    ],
  },
  {
    kind: "Namespace",
    label: "Namespace",
    fields: [
      { key: "name", label: "Name", placeholder: "app-namespace" },
      { key: "labels", label: "Labels (k=v,k=v)", placeholder: "app=example-app" },
    ],
  },
  {
    kind: "Ingress",
    label: "Ingress",
    fields: [
      { key: "name", label: "Name", placeholder: "app-ingress" },
      { key: "namespace", label: "Namespace", placeholder: "default" },
      { key: "labels", label: "Labels (k=v,k=v)", placeholder: "app=example-app" },
      { key: "host", label: "Host", placeholder: "app.example.com" },
      { key: "path", label: "Path", placeholder: "/" },
      { key: "containerPort", label: "Backend port", placeholder: "80" },
    ],
  },
  {
    kind: "PersistentVolumeClaim",
    label: "PersistentVolumeClaim",
    fields: [
      { key: "name", label: "Name", placeholder: "data-pvc" },
      { key: "namespace", label: "Namespace", placeholder: "default" },
      { key: "accessModes", label: "Access modes (comma separated)", placeholder: "ReadWriteOnce" },
      { key: "size", label: "Size", placeholder: "1Gi" },
    ],
  },
  {
    kind: "CronJob",
    label: "CronJob",
    fields: [
      { key: "name", label: "Name", placeholder: "backup-job" },
      { key: "namespace", label: "Namespace", placeholder: "default" },
      { key: "labels", label: "Labels (k=v,k=v)", placeholder: "app=example-app" },
      { key: "schedule", label: "Schedule (cron)", placeholder: "*/5 * * * *" },
      { key: "image", label: "Image", placeholder: "busybox" },
    ],
  },
  {
    kind: "HorizontalPodAutoscaler",
    label: "HorizontalPodAutoscaler",
    fields: [
      { key: "name", label: "Name", placeholder: "example-app-hpa" },
      { key: "namespace", label: "Namespace", placeholder: "default" },
      { key: "minReplicas", label: "Min replicas", placeholder: "1" },
      { key: "maxReplicas", label: "Max replicas", placeholder: "5" },
      { key: "targetCpu", label: "Target CPU %", placeholder: "70" },
    ],
  },
];

export default function KubernetesGeneratorsTool() {
  const { applyToActive } = useToolSource(false);

  const [form, setForm] = useState<K8sGeneratorForm>(DEFAULT_FORM);

  const activeFieldSet = useMemo(
    () =>
      KIND_FIELDS.find(
        (set) => set.kind === form.kind || (form.kind === "StatefulSet" && set.kind === "Deployment") || (form.kind === "DaemonSet" && set.kind === "Deployment"),
      ) ?? KIND_FIELDS[0],
    [form.kind],
  );

  const output = useMemo(() => buildKubernetesManifest(form), [form]);

  const setField = (key: keyof K8sGeneratorForm, value: string) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <ToolPage
      icon="kubernetes"
      title="Kubernetes Generators"
      description="Generate common Kubernetes manifests from a small form."
      actions={<ToolButton onClick={() => applyToActive(output)}>Apply to document</ToolButton>}
    >
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex flex-none flex-wrap items-center gap-3 rounded-xl border border-edge-1 bg-surface-1 px-4 py-3 shadow-lg shadow-black/20">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink-muted">Kind</span>
            <select
              value={form.kind}
              onChange={(event) => setField("kind", event.target.value)}
              className="cursor-pointer rounded-md border border-edge-1 bg-surface-0 px-2.5 py-1.5 text-sm text-ink outline-none focus:border-emerald-500/50"
            >
              {K8S_GENERATOR_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-ink-faint">{activeFieldSet.label}</p>
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex min-h-0 flex-col gap-3 overflow-auto rounded-xl border border-edge-1 bg-surface-1 p-4 shadow-lg shadow-black/20">
            {activeFieldSet.fields.map((field) => (
              <label key={field.key} className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-ink-muted">{field.label}</span>
                <input
                  value={form[field.key]}
                  onChange={(event) => setField(field.key, event.target.value)}
                  placeholder={field.placeholder}
                  spellCheck={false}
                  className="rounded-md border border-edge-1 bg-surface-0 px-2.5 py-1.5 font-mono text-sm text-ink outline-none focus:border-emerald-500/50"
                />
              </label>
            ))}
          </div>
          <OutputView
            title="Generated manifest"
            value={output}
            onApply={() => applyToActive(output)}
          />
        </div>
      </div>
    </ToolPage>
  );
}
