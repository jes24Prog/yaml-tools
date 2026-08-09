import { substituteText } from "./envService";

export interface TemplateResult {
  ok: boolean;
  text: string;
  substitutions: Array<{ from: string; to: string }>;
  missing: string[];
  error?: string;
}

export function renderTemplate(
  source: string,
  variables: Record<string, string>,
): TemplateResult {
  try {
    const result = substituteText(source, variables);
    return {
      ok: true,
      text: result.text,
      substitutions: result.substitutions,
      missing: result.missing,
    };
  } catch (error) {
    return { ok: false, text: source, substitutions: [], missing: [], error: error instanceof Error ? error.message : String(error) };
  }
}
