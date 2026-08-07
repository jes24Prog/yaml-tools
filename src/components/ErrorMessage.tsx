import type { YamlParseError } from "../types/yaml";

interface ErrorMessageProps {
  error?: YamlParseError | null;
  heading: string;
}

export function ErrorMessage({ error, heading }: ErrorMessageProps) {
  if (!error) {
    return null;
  }
  return (
    <div
      role="alert"
      className="rounded-b-md border border-t-0 border-red-500/40 bg-red-500/10 px-3 py-2 text-xs"
    >
      <div className="flex items-center gap-2 font-semibold text-red-400">
        <svg
          className="h-3.5 w-3.5 shrink-0"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M6.457 1.047l.659 1.234a13.488 13.488 0 00-.616.237l-.724-1.189a1.5 1.5 0 011.226-2.13l.253 1.57zm4.92.001l-1.375 1.473a13.5 13.5 0 01-.602-.21l1.273-1.49a1.5 1.5 0 011.564.168L10.76 1.85z" />
        </svg>
        {heading}
      </div>
      <div className="mt-1 pl-5 text-red-300/90">
        {error.message}
        {error.line != null && (
          <span className="ml-1 font-mono text-red-300/70">
            (line {error.line}
            {error.column != null ? `, column ${error.column}` : ""})
          </span>
        )}
      </div>
    </div>
  );
}
