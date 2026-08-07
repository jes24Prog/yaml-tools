import { describe, expect, it } from "vitest";
import { mergeYamlDocuments } from "../services/yamlMergeService";
import { parseYamlObject } from "../utils/yamlParser";
import type { YamlObject } from "../types/yaml";

function mergeYaml(primary: string, target: string, trackChanges = false) {
  const p = parseYamlObject(primary);
  const t = parseYamlObject(target);
  if (p.error) {
    throw new Error(`Primary parse failed: ${p.error.message}`);
  }
  if (t.error) {
    throw new Error(`Target parse failed: ${t.error.message}`);
  }
  const result = mergeYamlDocuments(p.value as YamlObject, t.value as YamlObject, {
    trackChanges,
  });
  return {
    output: result.output as YamlObject,
    statistics: result.statistics,
    changes: result.changes,
  };
}

describe("yamlMergeService", () => {
  describe("basic replacement", () => {
    it("replaces matching values and preserves target-only keys", () => {
      const primary = 'USERNAME-USER: "value"\nAGE_AGE: 15';
      const target = 'PASSWORD_PASS: "12345"\nUSERNAME-USER: "bababab"\nWHATEVER: "HELLO"\nAGE_AGE: 152323';
      const result = mergeYaml(primary, target);
      expect(result.output).toEqual({
        PASSWORD_PASS: "12345",
        "USERNAME-USER": "value",
        WHATEVER: "HELLO",
        AGE_AGE: 15,
      });
      expect(result.statistics).toEqual({
        keysProcessed: 4,
        valuesUpdated: 2,
        keysPreserved: 2,
      });
    });
  });

  describe("no matching keys", () => {
    it("keeps the target unchanged", () => {
      const result = mergeYaml("A: 1\nB: 2", "C: 3\nD: 4");
      expect(result.output).toEqual({ C: 3, D: 4 });
      expect(result.statistics.valuesUpdated).toBe(0);
      expect(result.statistics.keysPreserved).toBe(2);
    });
  });

  describe("partial matching", () => {
    it("updates only matching keys", () => {
      const result = mergeYaml("A: 100\nC: 300", "A: 1\nB: 2\nC: 3\nD: 4");
      expect(result.output).toEqual({ A: 100, B: 2, C: 300, D: 4 });
    });
  });

  describe("input 1-only keys", () => {
    it("never adds keys that exist only in the primary document", () => {
      const result = mergeYaml("A: 100\nB: 200\nNEW: 300", "A: 1\nB: 2");
      expect(result.output).toEqual({ A: 100, B: 200 });
      expect("NEW" in result.output).toBe(false);
    });
  });

  describe("nested objects", () => {
    it("recursively merges matching objects", () => {
      const primary = "database:\n  username: admin\n  password: secret";
      const target = "database:\n  username: old\n  password: oldpass\n  host: localhost";
      const result = mergeYaml(primary, target);
      expect(result.output).toEqual({
        database: { username: "admin", password: "secret", host: "localhost" },
      });
      expect(result.statistics.keysProcessed).toBe(3);
      expect(result.statistics.valuesUpdated).toBe(2);
      expect(result.statistics.keysPreserved).toBe(1);
    });

    it("merges deep hierarchies recursively", () => {
      const primary = "a:\n  b:\n    c:\n      x: 1";
      const target = "a:\n  b:\n    c:\n      x: 99\n      y: 2\n    z: 3";
      const result = mergeYaml(primary, target);
      expect(result.output).toEqual({ a: { b: { c: { x: 1, y: 2 }, z: 3 } } });
    });
  });

  describe("arrays", () => {
    it("replaces arrays wholesale instead of merging indexes", () => {
      const primary = "servers:\n  - server1\n  - server2";
      const target = "servers:\n  - oldserver1\n  - oldserver2";
      const result = mergeYaml(primary, target);
      expect(result.output).toEqual({ servers: ["server1", "server2"] });
    });

    it("replaces arrays that are nested inside objects", () => {
      const primary = "cluster:\n  nodes:\n    - n1\n    - n2";
      const target = "cluster:\n  nodes:\n    - old\n    - old2\n  port: 8080";
      const result = mergeYaml(primary, target);
      expect(result.output).toEqual({ cluster: { nodes: ["n1", "n2"], port: 8080 } });
    });
  });

  describe("data types", () => {
    it("preserves booleans", () => {
      const result = mergeYaml("ACTIVE: true", "ACTIVE: false");
      expect(result.output.ACTIVE).toBe(true);
    });

    it("preserves integers", () => {
      const result = mergeYaml("AGE: 15", "AGE: 999");
      expect(result.output.AGE).toBe(15);
      expect(typeof result.output.AGE).toBe("number");
    });

    it("preserves floating point numbers", () => {
      const result = mergeYaml("RATE: 15.5", "RATE: 99.9");
      expect(result.output.RATE).toBe(15.5);
    });

    it("preserves null", () => {
      const result = mergeYaml("VALUE: null", 'VALUE: "something"');
      expect(result.output.VALUE).toBeNull();
    });

    it("preserves empty strings", () => {
      const result = mergeYaml('VALUE: ""', 'VALUE: "something"');
      expect(result.output.VALUE).toBe("");
    });

    it("distinguishes null from the string 'null'", () => {
      const result = mergeYaml('VALUE: "null"', "VALUE: null");
      expect(result.output.VALUE).toBe("null");
    });

    it("distinguishes null from an empty value", () => {
      const empty = parseYamlObject("VALUE:").value as YamlObject;
      const explicitNull = parseYamlObject("VALUE: null").value as YamlObject;
      const quoted = parseYamlObject('VALUE: "null"').value as YamlObject;
      expect(empty.VALUE).toBeNull();
      expect(explicitNull.VALUE).toBeNull();
      expect(quoted.VALUE).toBe("null");
      expect(quoted.VALUE).not.toBeNull();
    });

    it("preserves special characters", () => {
      const result = mergeYaml('MSG: "hello & <world> #1"', 'MSG: "old"');
      expect(result.output.MSG).toBe("hello & <world> #1");
    });

    it("preserves multiline block strings", () => {
      const primary = 'desc: |\n  line one\n  line two';
      const target = 'desc: "old"\nother: 1';
      const result = mergeYaml(primary, target);
      expect(result.output.desc).toBe("line one\nline two\n");
    });

    it("preserves quoted strings", () => {
      const result = mergeYaml('K: "quoted"', "K: old");
      expect(result.output.K).toBe("quoted");
    });

    it("preserves unquoted strings", () => {
      const result = mergeYaml("K: plain", "K: old");
      expect(result.output.K).toBe("plain");
    });
  });

  describe("key matching", () => {
    it("treats keys containing hyphens as distinct from underscore keys", () => {
      const primary = "USERNAME-USER: v1";
      const target = "USERNAME_USER: v2";
      const result = mergeYaml(primary, target);
      expect(result.output).toEqual({ USERNAME_USER: "v2" });
    });

    it("treats keys containing underscores distinctly", () => {
      const primary = "SOME_KEY: a";
      const target = "SOME-KEY: b";
      const result = mergeYaml(primary, target);
      expect(result.output).toEqual({ "SOME-KEY": "b" });
    });

    it("is case-sensitive", () => {
      const primary = "USERNAME: admin";
      const target = "username: guest";
      const result = mergeYaml(primary, target);
      expect(result.output).toEqual({ username: "guest" });
    });

    it("does not match keys with numeric suffixes loosely", () => {
      const primary = "KEY-1: a";
      const target = "KEY-2: b";
      const result = mergeYaml(primary, target);
      expect(result.output).toEqual({ "KEY-2": "b" });
    });

    it("does not normalize key names", () => {
      const primary = "a-b: 1\nc_d: 2";
      const target = "a_b: 10\nc-d: 20";
      const result = mergeYaml(primary, target);
      expect(result.output).toEqual({ a_b: 10, "c-d": 20 });
    });
  });

  describe("key ordering", () => {
    it("preserves the target key order and never sorts", () => {
      const result = mergeYaml("A: 1\nM: 2\nZ: 3", "Z: 0\nA: 1\nM: 2");
      expect(Object.keys(result.output)).toEqual(["Z", "A", "M"]);
    });

    it("preserves nested key ordering", () => {
      const primary = "db:\n  x: 1";
      const target = "db:\n  z: 0\n  x: 9\n  y: 2";
      const result = mergeYaml(primary, target);
      expect(Object.keys(result.output.db as YamlObject)).toEqual(["z", "x", "y"]);
    });
  });

  describe("mixed structures", () => {
    it("handles objects containing arrays and scalars", () => {
      const primary = "app:\n  hosts:\n    - a\n    - b\n  replicas: 3";
      const target = "app:\n  hosts:\n    - old\n  replicas: 1\n  debug: false";
      const result = mergeYaml(primary, target);
      expect(result.output).toEqual({
        app: { hosts: ["a", "b"], replicas: 3, debug: false },
      });
    });

    it("handles arrays of objects", () => {
      const primary = "users:\n  - name: bob\n    role: admin";
      const target = "users:\n  - name: alice\n    role: viewer";
      const result = mergeYaml(primary, target);
      expect(result.output.users).toEqual([{ name: "bob", role: "admin" }]);
    });
  });

  describe("edge cases", () => {
    it("replaces an object with a scalar when the override value is a scalar", () => {
      const result = mergeYaml("db: 5", "db:\n  host: localhost");
      expect(result.output).toEqual({ db: 5 });
    });

    it("replaces a scalar with an object when the override value is an object", () => {
      const result = mergeYaml("db:\n  host: localhost", "db: 5");
      expect(result.output).toEqual({ db: { host: "localhost" } });
    });

    it("merges when only the target is empty at the root", () => {
      const result = mergeYaml("a: 1", "a: 2");
      expect(result.output).toEqual({ a: 1 });
    });

    it("treats an empty override object as no overrides", () => {
      const result = mergeYaml("db: {}", "db:\n  host: localhost\n  port: 1");
      expect(result.output).toEqual({ db: { host: "localhost", port: 1 } });
    });

    it("handles a fully empty override object against a non-empty target", () => {
      const result = mergeYaml("{}", "a: 1\nb: 2");
      expect(result.output).toEqual({ a: 1, b: 2 });
    });
  });

  describe("statistics", () => {
    it("counts processed, updated and preserved keys", () => {
      const primary = "x: 1\ny: 2";
      const target = "x: 9\ny: 8\nz: 7\nw:\n  a: 1\n  b: 2";
      const result = mergeYaml(primary, target);
      // x and y updated (2), z preserved (1), w preserved whole because it
      // is absent from the override document (1).
      expect(result.statistics.keysProcessed).toBe(4);
      expect(result.statistics.valuesUpdated).toBe(2);
      expect(result.statistics.keysPreserved).toBe(2);
    });
  });

  describe("change tracking", () => {
    it("records updated and preserved changes when enabled", () => {
      const primary = "name: new\nage: 10";
      const target = "name: old\ncity: paris";
      const result = mergeYaml(primary, target, true);
      expect(result.changes).toEqual([
        { path: "name", oldValue: "old", newValue: "new", type: "updated" },
        { path: "city", oldValue: "paris", newValue: "paris", type: "preserved" },
      ]);
    });

    it("uses dotted paths for nested keys", () => {
      const primary = "db:\n  host: newhost";
      const target = "db:\n  host: oldhost";
      const result = mergeYaml(primary, target, true);
      expect(result.changes[0].path).toBe("db.host");
    });

    it("does not collect changes when tracking is disabled", () => {
      const result = mergeYaml("a: 1", "a: 2", false);
      expect(result.changes).toEqual([]);
    });

    it("exposes raw values in change records", () => {
      const primary = "n: null\nb: true";
      const target = 'n: "x"\nb: false';
      const result = mergeYaml(primary, target, true);
      expect(result.changes[0].newValue).toBe("null");
      expect(result.changes[1].newValue).toBe("true");
    });
  });
});
