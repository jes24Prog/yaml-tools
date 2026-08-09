import { parseDocument } from "yaml";
import { isPlainObject } from "../utils/yamlParser";

export interface OpenApiPath {
  path: string;
  methods: string[];
  summary?: string;
}

export interface OpenApiInspectResult {
  detected: boolean;
  version?: string;
  title?: string;
  versionNumber?: string;
  servers: string[];
  paths: OpenApiPath[];
  securitySchemes: string[];
  componentsCount: number;
  errors: string[];
}

const HTTP_METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];

export function inspectOpenApi(source: string): OpenApiInspectResult {
  const doc = parseDocument(source);
  const errors: string[] = [];
  if (doc.errors.length > 0) {
    return { detected: false, servers: [], paths: [], securitySchemes: [], componentsCount: 0, errors: [doc.errors[0].message] };
  }
  const value = doc.toJS();
  if (!isPlainObject(value)) {
    return { detected: false, servers: [], paths: [], securitySchemes: [], componentsCount: 0, errors };
  }
  const root = value as Record<string, unknown>;
  const isOpenApi = typeof root.openapi === "string" && root.openapi.startsWith("3");
  const isSwagger = typeof root.swagger === "string";
  if (!isOpenApi && !isSwagger) {
    return { detected: false, servers: [], paths: [], securitySchemes: [], componentsCount: 0, errors };
  }

  const info = isPlainObject(root.info) ? (root.info as Record<string, unknown>) : {};
  const servers: string[] = [];
  if (Array.isArray(root.servers)) {
    for (const server of root.servers) {
      if (isPlainObject(server) && typeof server.url === "string") {
        servers.push(server.url);
      }
    }
  } else if (typeof root.host === "string") {
    servers.push(root.host);
  }

  const paths: OpenApiPath[] = [];
  if (isPlainObject(root.paths)) {
    const pathsObj = root.paths as Record<string, unknown>;
    for (const path of Object.keys(pathsObj)) {
      const item = pathsObj[path];
      if (!isPlainObject(item)) {
        continue;
      }
      const methods = HTTP_METHODS.filter((method) => method in (item as Record<string, unknown>));
      let summary: string | undefined;
      const itemRecord = item as Record<string, unknown>;
      if (isPlainObject(itemRecord.get)) {
        const getOp = itemRecord.get as Record<string, unknown>;
        if (typeof getOp.summary === "string") {
          summary = getOp.summary;
        }
      }
      paths.push({ path, methods, summary });
    }
  }

  const securitySchemes: string[] = [];
  const components = isPlainObject(root.components) ? (root.components as Record<string, unknown>) : {};
  if (isPlainObject(components.securitySchemes)) {
    securitySchemes.push(...Object.keys(components.securitySchemes));
  } else if (isPlainObject(root.securityDefinitions)) {
    securitySchemes.push(...Object.keys(root.securityDefinitions));
  }

  const componentsCount = Object.keys(components).length;

  return {
    detected: true,
    version: isOpenApi ? `OpenAPI ${root.openapi}` : `Swagger ${root.swagger}`,
    title: typeof info.title === "string" ? info.title : undefined,
    versionNumber: typeof info.version === "string" ? info.version : undefined,
    servers,
    paths,
    securitySchemes,
    componentsCount,
    errors,
  };
}
