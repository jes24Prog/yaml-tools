import { describe, expect, it } from "vitest";
import { parseYamlObject } from "../utils/yamlParser";

describe("yamlParser", () => {
  it("parses a simple object", () => {
    const result = parseYamlObject("a: 1\nb: two");
    expect(result.error).toBeNull();
    expect(result.value).toEqual({ a: 1, b: "two" });
  });

  it("reports invalid YAML with line and column information", () => {
    const result = parseYamlObject("a: 1\n  b: 2\nc:");
    expect(result.value).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error!.message.length).toBeGreaterThan(0);
  });

  it("rejects a root scalar", () => {
    const result = parseYamlObject("just a string");
    expect(result.value).toBeNull();
    expect(result.error!.message).toContain("object/map");
  });

  it("rejects a root array", () => {
    const result = parseYamlObject("- a\n- b");
    expect(result.value).toBeNull();
    expect(result.error!.message).toContain("object/map");
  });

  it("rejects an empty document", () => {
    const result = parseYamlObject("");
    expect(result.value).toBeNull();
    expect(result.error!.message).toContain("object/map");
  });

  it("preserves data types when parsing", () => {
    const result = parseYamlObject("i: 5\nf: 5.5\nb: true\nn: null\ns: hi");
    expect(result.value).toEqual({ i: 5, f: 5.5, b: true, n: null, s: "hi" });
  });

  it("parses nested structures and arrays", () => {
    const result = parseYamlObject("a:\n  list:\n    - 1\n    - 2\n  name: x");
    expect(result.value).toEqual({ a: { list: [1, 2], name: "x" } });
  });
});
