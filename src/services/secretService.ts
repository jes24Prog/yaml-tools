import { parseDocument, stringify } from "yaml";
import { isPlainObject } from "../utils/yamlParser";

export interface SecretMatch {
  path: string;
  key: string;
  reason: string;
  risk: "high" | "medium" | "low";
}

export interface ScanResult {
  matches: SecretMatch[];
  error?: string;
}

export interface MaskResult {
  ok: boolean;
  text: string;
  masked: number;
  error?: string;
}

const KEY_PATTERNS: Array<{ pattern: RegExp; reason: string; risk: SecretMatch["risk"] }> = [
  { pattern: /password|passwd|pwd/iu, reason: "Key name suggests a password.", risk: "high" },
  { pattern: /(^|[^a-z])secret/i, reason: "Key name suggests a secret.", risk: "high" },
  { pattern: /token/i, reason: "Key name suggests an authentication token.", risk: "high" },
  { pattern: /api[_-]?key|apikey/i, reason: "Key name suggests an API key.", risk: "high" },
  { pattern: /access[_-]?key/i, reason: "Key name suggests an access key.", risk: "high" },
  { pattern: /client[_-]?secret/i, reason: "Key name suggests a client secret.", risk: "high" },
  { pattern: /credential|authorization|auth/i, reason: "Key name suggests credentials.", risk: "medium" },
  { pattern: /private[_-]?key|ssh/i, reason: "Key name suggests a private key.", risk: "high" },
];

const VALUE_PATTERNS: Array<{ pattern: RegExp; reason: string; risk: SecretMatch["risk"] }> = [
  { pattern: /BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY/, reason: "Contains a private key block.", risk: "high" },
  { pattern: /^eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}$/u, reason: "Looks like a JSON Web Token (JWT).", risk: "high" },
  { pattern: /^AKIA[0-9A-Z]{16}$/u, reason: "Looks like an AWS access key ID.", risk: "high" },
  { pattern: /^ghp_[A-Za-z0-9]{36}$/u, reason: "Looks like a GitHub personal access token.", risk: "high" },
  { pattern: /^xox[baprs]-[A-Za-z0-9-]{10,}$/u, reason: "Looks like a Slack token.", risk: "high" },
  { pattern: /^sk-(?:live|test)-[A-Za-z0-9]{20,}$/u, reason: "Looks like a Stripe secret key.", risk: "high" },
  { pattern: /^[0-9a-f]{32,}$/iu, reason: "Looks like a hex-encoded secret.", risk: "medium" },
  { pattern: /^[A-Za-z0-9+/]{40,}={0,2}$/u, reason: "Looks like a long base64-encoded value.", risk: "medium" },
  { pattern: /[a-z]+:\/\/[^:\s/]+:[^@\s]+@/iu, reason: "Connection string embeds credentials.", risk: "high" },
];

export function scanSecrets(source: string): ScanResult {
  const doc = parseDocument(source);
  if (doc.errors.length > 0) {
    return { matches: [], error: doc.errors[0].message };
  }
  const value = doc.toJS();
  const matches: SecretMatch[] = [];

  const walk = (node: unknown, path: string, key: string): void => {
    if (isPlainObject(node)) {
      for (const childKey of Object.keys(node)) {
        const childPath = path === "" ? childKey : `${path}.${childKey}`;
        walk(node[childKey], childPath, childKey);
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, `${path}[${index}]`, key));
      return;
    }
    if (typeof node !== "string") {
      return;
    }
    const lower = node;
    for (const rule of KEY_PATTERNS) {
      if (rule.pattern.test(key)) {
        matches.push({ path, key, reason: rule.reason, risk: rule.risk });
        return;
      }
    }
    for (const rule of VALUE_PATTERNS) {
      if (rule.pattern.test(lower)) {
        matches.push({ path, key, reason: rule.reason, risk: rule.risk });
        return;
      }
    }
  };

  walk(value, "", "");
  return { matches };
}

const MASK = "***REDACTED***";

export function maskSecrets(source: string): MaskResult {
  const scanned = scanSecrets(source);
  if (scanned.error) {
    return { ok: false, text: source, masked: 0, error: scanned.error };
  }
  if (scanned.matches.length === 0) {
    return { ok: true, text: source, masked: 0 };
  }
  const doc = parseDocument(source);
  const value = doc.toJS();
  const maskedPaths = new Set(scanned.matches.map((match) => match.path));

  const walk = (node: unknown, path: string): unknown => {
    if (isPlainObject(node)) {
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(node)) {
        const childPath = path === "" ? key : `${path}.${key}`;
        out[key] = maskedPaths.has(childPath) ? MASK : walk(node[key], childPath);
      }
      return out;
    }
    if (Array.isArray(node)) {
      return node.map((item, index) => walk(item, `${path}[${index}]`));
    }
    return node;
  };

  const result = walk(value, "");
  const text = stringify(result, { lineWidth: 0 });
  return { ok: true, text: text.endsWith("\n") ? text : `${text}\n`, masked: maskedPaths.size };
}
