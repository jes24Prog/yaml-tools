import type { languages } from "monaco-editor";

/**
 * A pragmatic Monarch tokenizer for YAML syntax highlighting.
 * Covers keys, scalars, strings, numbers, booleans, null, comments,
 * list items, document markers and block scalars.
 */
export const yamlMonarchLanguage: languages.IMonarchLanguage = {
  defaultToken: "",
  tokenPostfix: ".yaml",

  keywords: [
    "true",
    "True",
    "TRUE",
    "false",
    "False",
    "FALSE",
    "null",
    "Null",
    "NULL",
    "~",
    "yes",
    "Yes",
    "YES",
    "no",
    "No",
    "NO",
    "on",
    "On",
    "ON",
    "off",
    "Off",
    "OFF",
  ],

  tokenizer: {
    root: [
      { include: "@whitespace" },
      { include: "@comment" },
      { include: "@document" },
      { include: "@blockScalarStart" },
      { include: "@keys" },
      { include: "@listItem" },
      { include: "@values" },
      { include: "@punctuation" },
    ],

    whitespace: [[/[ \t\r\n]+/, "white"]],

    comment: [[/#.*$/, "comment"]],

    document: [
      [/^(?:---|\.\.\.)[ \t]*$/, "keyword.document"],
    ],

    keys: [
      [
        /(['"])(?:\\[\s\S]|(?!\1)[^\\])*\1(?=\s*:[ \t]*)/,
        ["string.key"],
      ],
      [
        /[A-Za-z_][A-Za-z0-9_./\-]*(?=\s*:[ \t]*(?:[^#]|$))/,
        "key",
      ],
    ],

    listItem: [
      [/^[ \t]*-[ \t]*(?=\S)/, "keyword.list"],
    ],

    values: [
      [/\b(?:[+-]?\d[\d_]*(?:\.\d[\d_]*)?(?:e[+-]?\d+)?)\b/i, "number"],
      [/\b(?:true|false|yes|no|on|off)\b/i, "keyword.true"],
      [/\b(?:null|~)\b/i, "keyword.null"],
      [/"(?:\\[\s\S]|[^"\\])*"/, "string"],
      [/'(?:[^'\\]|\\.)*'/, "string"],
      [/[^\s:,[\]{}\r\n]+/, "string"],
      [/:/, "delimiter.key"],
    ],

    blockScalarStart: [[/[|>][+-]?\d*[ \t]*(?=$)/, "keyword", "block"]],

    block: [
      [/^[ \t]+.*$/, "string"],
      [/^[ \t]*$/, "white"],
      [/^(?=[^ \t])/, "", "@pop"],
    ],

    punctuation: [
      [/[{}]/, "delimiter.bracket"],
      [/[\[\]]/, "delimiter.bracket"],
      [/,/, "delimiter"],
    ],
  },
};

export const yamlLanguageConfiguration: languages.LanguageConfiguration = {
  comments: {
    lineComment: "#",
  },
  brackets: [
    ["{", "}"],
    ["[", "]"],
  ],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  surroundingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  folding: {
    markers: {
      start: /^\s*#\s*region\b/,
      end: /^\s*#\s*endregion\b/,
    },
  },
  indentationRules: {
    increaseIndentPattern: /^\s*(?:-|\?|[^\s#]*\s*:)[ \t]*(?:\|>)?[ \t]*(?:\n.*)?$/,
    decreaseIndentPattern: /^\s*(?:-|\?)$/,
  },
};
