import { useMemo, useState } from "react";
import { CONFIG_GENERATORS, type GeneratorDefinition, type GeneratorField } from "../../services/configGenerators";
import { ToolPage, OutputView, ToolButton } from "../shared/ToolShell";
import { useToolSource } from "../shared/hooks";

function fieldControl(field: GeneratorField, value: string, onChange: (value: string) => void) {
  const baseClass = "w-full rounded-md border border-edge-1 bg-surface-0 px-2.5 py-1.5 font-mono text-sm text-ink outline-none focus:border-emerald-500/50";
  if (field.type === "select") {
    return (
      <select value={value} onChange={(event) => onChange(event.target.value)} className={`${baseClass} cursor-pointer`}>
        {field.options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === "textarea") {
    return (
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={Math.min(10, Math.max(3, (field.default ?? "").split("\n").length + 1))}
        spellCheck={false}
        className={`${baseClass} resize-y`}
      />
    );
  }
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      type={field.type === "number" ? "number" : "text"}
      placeholder={field.placeholder}
      spellCheck={false}
      className={baseClass}
    />
  );
}

export default function ConfigGeneratorsTool() {
  const { applyToActive } = useToolSource(false);

  const [generatorId, setGeneratorId] = useState(CONFIG_GENERATORS[0]?.id ?? "");
  const [values, setValues] = useState<Record<string, string>>({});

  const generator: GeneratorDefinition | undefined = CONFIG_GENERATORS.find((item) => item.id === generatorId);

  const selectGenerator = (id: string) => {
    setGeneratorId(id);
    const gen = CONFIG_GENERATORS.find((item) => item.id === id);
    const defaults: Record<string, string> = {};
    gen?.fields.forEach((field) => {
      defaults[field.key] = field.default ?? "";
    });
    setValues(defaults);
  };

  const output = useMemo(() => {
    if (!generator) return "";
    try {
      return generator.generate(values);
    } catch (error) {
      return `# Generation failed:\n# ${error instanceof Error ? error.message : String(error)}`;
    }
  }, [generator, values]);

  const setField = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));

  return (
    <ToolPage
      icon="generator"
      title="Config Generators"
      description="Generate common config files — docker-compose, GitHub Actions, Spring Boot, Kubernetes — from compact forms."
      actions={
        generator ? <ToolButton onClick={() => applyToActive(output)}>Apply to document</ToolButton> : undefined
      }
    >
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex flex-none flex-wrap items-center gap-2 rounded-xl border border-edge-1 bg-surface-1 px-4 py-3 shadow-lg shadow-black/20">
          {CONFIG_GENERATORS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectGenerator(item.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                item.id === generatorId ? "bg-emerald-600 text-white" : "border border-edge-1 bg-surface-2 text-ink-muted hover:text-ink"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

        {generator ? (
          <>
            <p className="flex-none text-xs text-ink-faint">{generator.description}</p>
            <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="flex min-h-0 flex-col gap-3 overflow-auto rounded-xl border border-edge-1 bg-surface-1 p-4 shadow-lg shadow-black/20">
                {generator.fields.map((field) => (
                  <label key={field.key} className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-ink-muted">
                      {field.label}
                      {field.hint && <span className="ml-2 font-normal text-ink-faint">{field.hint}</span>}
                    </span>
                    {fieldControl(field, values[field.key] ?? field.default ?? "", (value) => setField(field.key, value))}
                  </label>
                ))}
              </div>
              <OutputView title={generator.name} value={output} onApply={() => applyToActive(output)} />
            </div>
          </>
        ) : (
          <div className="flex-none rounded-xl border border-dashed border-edge-1 p-6 text-center text-xs text-ink-faint">
            No generator selected.
          </div>
        )}
      </div>
    </ToolPage>
  );
}
