import { parseAllDocuments } from "yaml";

export interface SplitDocument {
  index: number;
  content: string;
  valid: boolean;
  error?: string;
}

export interface SplitResult {
  count: number;
  documents: SplitDocument[];
}

export function splitYamlDocuments(source: string): SplitResult {
  const docs = parseAllDocuments(source);
  if (docs.length === 0) {
    return { count: 0, documents: [] };
  }
  const documents: SplitDocument[] = docs.map((doc, index) => {
    const range = doc.range;
    const content = range ? source.slice(range[0], range[1]) : "";
    return {
      index,
      content,
      valid: doc.errors.length === 0,
      error: doc.errors[0]?.message,
    };
  });
  return { count: documents.length, documents };
}

export function combineYamlDocuments(parts: string[]): string {
  const cleaned = parts
    .map((part) => part.trim())
    .filter((part) => part !== "");
  if (cleaned.length === 0) {
    return "";
  }
  return `${cleaned.join("\n---\n")}\n`;
}

export function countYamlDocuments(source: string): number {
  return parseAllDocuments(source).length;
}
