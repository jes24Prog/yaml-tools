import { parseDocument } from "yaml";
import { isPlainObject } from "../utils/yamlParser";

export interface CiJobSummary {
  name: string;
  runsOn?: string;
  steps: number;
  usesActions: string[];
  hasScript: boolean;
}

export interface CiInspectResult {
  detected: boolean;
  platform?: "github-actions" | "gitlab-ci" | "azure-pipelines";
  name?: string;
  events: string[];
  jobs: CiJobSummary[];
  secrets: string[];
  dangers: string[];
}

const DANGER_ACTIONS = /@(main|master|latest)\b/u;

export function inspectCiCd(source: string): CiInspectResult {
  const doc = parseDocument(source);
  if (doc.errors.length > 0) {
    return { detected: false, events: [], jobs: [], secrets: [], dangers: [] };
  }
  const value = doc.toJS();
  if (!isPlainObject(value)) {
    return { detected: false, events: [], jobs: [], secrets: [], dangers: [] };
  }
  const root = value as Record<string, unknown>;

  const dangers: string[] = [];
  const secrets = new Set<string>();
  const secretPattern = /\$\{\{\s*secrets\.([A-Za-z0-9_]+)\s*\}\}/gu;

  const collectSecrets = (node: unknown): void => {
    if (typeof node === "string") {
      let match: RegExpExecArray | null;
      const regex = new RegExp(secretPattern.source, "gu");
      while ((match = regex.exec(node)) !== null) {
        secrets.add(match[1]);
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(collectSecrets);
    } else if (isPlainObject(node)) {
      Object.values(node).forEach(collectSecrets);
    }
  };
  collectSecrets(root);

  if ("on" in root || ("jobs" in root && isPlainObject(root.jobs))) {
    const events: string[] = [];
    const on = root.on;
    if (typeof on === "string") {
      events.push(on);
    } else if (isPlainObject(on)) {
      events.push(...Object.keys(on));
    }
    if (root.permissions && isPlainObject(root.permissions)) {
      const perms = root.permissions as Record<string, unknown>;
      if (perms["contents"] === "write-all" || perms["id-token"] === "write" || (isPlainObject(perms) && Object.values(perms).every((v) => v === "write-all"))) {
        dangers.push("Workflow grants write-all permissions.");
      }
    }
    const jobs = collectGithubJobs(root.jobs, dangers);
    return { detected: true, platform: "github-actions", name: typeof root.name === "string" ? root.name : undefined, events, jobs, secrets: [...secrets], dangers };
  }

  if ("stages" in root || "before_script" in root || "after_script" in root || ("default" in root && isPlainObject(root.default))) {
    const jobs: CiJobSummary[] = [];
    for (const key of Object.keys(root)) {
      if (["stages", "before_script", "after_script", "default", "variables", "include", "cache", "image"].includes(key)) {
        continue;
      }
      const job = root[key];
      if (!isPlainObject(job)) {
        continue;
      }
      const record = job as Record<string, unknown>;
      if (!("script" in record)) {
        continue;
      }
      jobs.push({
        name: key,
        steps: Array.isArray(record.script) ? record.script.length : 1,
        hasScript: true,
        usesActions: [],
      });
      const tags = record.tags;
      if (Array.isArray(tags) && tags.some((tag) => typeof tag === "string" && tag.startsWith("kubernetes"))) {
        dangers.push(`Job '${key}' runs on Kubernetes runners — review privileges.`);
      }
    }
    return { detected: true, platform: "gitlab-ci", events: [], jobs, secrets: [...secrets], dangers };
  }

  return { detected: false, events: [], jobs: [], secrets: [...secrets], dangers };
}

function collectGithubJobs(jobs: unknown, dangers: string[]): CiJobSummary[] {
  const summary: CiJobSummary[] = [];
  if (!isPlainObject(jobs)) {
    return summary;
  }
  const jobsObj = jobs as Record<string, unknown>;
  for (const name of Object.keys(jobsObj)) {
    const job = jobsObj[name];
    if (!isPlainObject(job)) {
      continue;
    }
    const record = job as Record<string, unknown>;
    const steps = Array.isArray(record.steps) ? record.steps : [];
    const usesActions: string[] = [];
    for (const step of steps) {
      if (isPlainObject(step)) {
        const stepRecord = step as Record<string, unknown>;
        if (typeof stepRecord.uses === "string") {
          usesActions.push(stepRecord.uses);
          if (DANGER_ACTIONS.test(stepRecord.uses)) {
            dangers.push(`Action '${stepRecord.uses}' is pinned to a mutable tag.`);
          }
        }
      }
    }
    summary.push({
      name,
      runsOn: typeof record["runs-on"] === "string" ? record["runs-on"] : undefined,
      steps: steps.length,
      usesActions,
      hasScript: false,
    });
  }
  return summary;
}
