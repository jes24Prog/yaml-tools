import { stringify } from "yaml";

export interface GeneratorField {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "select";
  options?: string[];
  default?: string;
  placeholder?: string;
  hint?: string;
}

export interface GeneratorDefinition {
  id: string;
  name: string;
  description: string;
  fields: GeneratorField[];
  generate: (values: Record<string, string>) => string;
}

const GENERATOR_FIELDS: Record<string, GeneratorField[]> = {
  dockerCompose: [
    { key: "project", label: "Project name", type: "text", default: "myapp", placeholder: "myapp" },
    { key: "services", label: "Services (name=image:tag[,port:target[,env K=V]] per line)", type: "textarea", default: "web=nginx:1.27,8080:80\napi=node:20-alpine,3000:3000", placeholder: "web=nginx:1.27,8080:80", hint: "One service per line: name=image[,hostPort:containerPort[,ENV=value]]" },
  ],
  githubActions: [
    { key: "name", label: "Workflow name", type: "text", default: "CI", placeholder: "CI" },
    { key: "branch", label: "Trigger branch", type: "text", default: "main", placeholder: "main" },
    { key: "runsOn", label: "Runner", type: "select", options: ["ubuntu-latest", "ubuntu-22.04", "macos-latest", "windows-latest"], default: "ubuntu-latest" },
    { key: "nodeVersion", label: "Node version", type: "select", options: ["20", "22", "24"], default: "20" },
    { key: "commands", label: "Commands (one per line)", type: "textarea", default: "npm ci\nnpm run lint\nnpm test", placeholder: "npm ci" },
  ],
  springBoot: [
    { key: "appName", label: "Application name", type: "text", default: "my-service", placeholder: "my-service" },
    { key: "port", label: "Server port", type: "number", default: "8080", placeholder: "8080" },
    { key: "activeProfile", label: "Active profile", type: "select", options: ["dev", "test", "prod"], default: "dev" },
    { key: "dbUrl", label: "Database URL", type: "text", default: "jdbc:postgresql://localhost:5432/app", placeholder: "jdbc:postgresql://localhost:5432/app" },
    { key: "dbUsername", label: "Database username", type: "text", default: "app", placeholder: "app" },
    { key: "logLevel", label: "Log level", type: "select", options: ["TRACE", "DEBUG", "INFO", "WARN", "ERROR"], default: "INFO" },
  ],
  k8sDeployment: [
    { key: "name", label: "Name", type: "text", default: "my-app", placeholder: "my-app" },
    { key: "image", label: "Image", type: "text", default: "nginx:1.27", placeholder: "nginx:1.27" },
    { key: "replicas", label: "Replicas", type: "number", default: "3", placeholder: "3" },
    { key: "containerPort", label: "Container port", type: "number", default: "8080", placeholder: "8080" },
    { key: "servicePort", label: "Service port", type: "number", default: "80", placeholder: "80" },
  ],
};

export const CONFIG_GENERATORS: GeneratorDefinition[] = [
  {
    id: "docker-compose",
    name: "Docker Compose",
    description: "Generate a docker-compose.yml from a compact service list.",
    fields: GENERATOR_FIELDS.dockerCompose,
    generate: (values) => {
      const services: Record<string, unknown> = {};
      const lines = (values.services ?? "").split(/\r?\n/u).filter((line) => line.trim() !== "");
      for (const line of lines) {
        const [header, ...envParts] = line.split(",");
        const [name, image] = header.split("=").map((part) => part.trim());
        if (!name || !image) {
          continue;
        }
        const envRecord: Record<string, string> = {};
        const ports: string[] = [];
        for (const part of envParts) {
          const trimmed = part.trim();
          if (/^\d+:\d+$/u.test(trimmed)) {
            ports.push(`"${trimmed}"`);
          } else if (trimmed.includes("=")) {
            const eq = trimmed.indexOf("=");
            envRecord[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
          }
        }
        const service: Record<string, unknown> = { image };
        if (ports.length > 0) {
          service.ports = ports.map((port) => port.replace(/^"|"$/gu, ""));
        }
        if (Object.keys(envRecord).length > 0) {
          service.environment = envRecord;
        }
        services[name] = service;
      }
      const compose: Record<string, unknown> = { services };
      if (values.project) {
        compose.name = values.project;
      }
      return stringify(compose, { lineWidth: 0 });
    },
  },
  {
    id: "github-actions",
    name: "GitHub Actions CI",
    description: "Generate a GitHub Actions workflow with a Node build/test job.",
    fields: GENERATOR_FIELDS.githubActions,
    generate: (values) => {
      const commands = (values.commands ?? "npm ci").split(/\r?\n/u).filter((line) => line.trim() !== "");
      const workflow: Record<string, unknown> = {
        name: values.name || "CI",
        on: {
          push: { branches: [values.branch || "main"] },
          pull_request: null,
        },
        jobs: {
          build: {
            "runs-on": values.runsOn || "ubuntu-latest",
            steps: [
              { uses: "actions/checkout@v4" },
              {
                name: "Setup Node",
                uses: "actions/setup-node@v4",
                with: { "node-version": values.nodeVersion || "20", "cache": "npm" },
              },
              ...commands.map((command) => ({ run: command })),
            ],
          },
        },
      };
      return stringify(workflow, { lineWidth: 0 });
    },
  },
  {
    id: "spring-boot",
    name: "Spring Boot config",
    description: "Generate a typical Spring Boot application.yml.",
    fields: GENERATOR_FIELDS.springBoot,
    generate: (values) => {
      const config: Record<string, unknown> = {
        server: { port: Number(values.port || 8080) },
        spring: {
          application: { name: values.appName || "my-service" },
          profiles: { active: values.activeProfile || "dev" },
          datasource: {
            url: values.dbUrl || "jdbc:postgresql://localhost:5432/app",
            username: values.dbUsername || "app",
            password: "${DB_PASSWORD}",
          },
        },
        logging: {
          level: {
            root: values.logLevel || "INFO",
          },
        },
      };
      return stringify(config, { lineWidth: 0 });
    },
  },
  {
    id: "k8s-app",
    name: "Kubernetes app (Deployment + Service)",
    description: "Generate a Deployment and a Service manifest pair.",
    fields: GENERATOR_FIELDS.k8sDeployment,
    generate: (values) => {
      const name = values.name || "my-app";
      const labels = { app: name };
      const deployment = {
        apiVersion: "apps/v1",
        kind: "Deployment",
        metadata: { name, labels },
        spec: {
          replicas: Number(values.replicas || 3),
          selector: { matchLabels: labels },
          template: {
            metadata: { labels },
            spec: {
              containers: [
                {
                  name,
                  image: values.image || "nginx:1.27",
                  ports: [{ containerPort: Number(values.containerPort || 8080) }],
                },
              ],
            },
          },
        },
      };
      const service = {
        apiVersion: "v1",
        kind: "Service",
        metadata: { name, labels },
        spec: {
          selector: labels,
          ports: [
            {
              port: Number(values.servicePort || 80),
              targetPort: Number(values.containerPort || 8080),
            },
          ],
        },
      };
      return `${stringify(deployment, { lineWidth: 0 })}---\n${stringify(service, { lineWidth: 0 })}`;
    },
  },
];
