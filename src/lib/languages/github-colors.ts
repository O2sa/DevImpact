/**
 * GitHub Linguist canonical language colors mapping.
 * Sourced from github-linguist/linguist/lib/linguist/languages.yml
 */
export const GITHUB_LANGUAGE_COLORS: Record<string, string> = {
  // Common Web & Application Languages
  typescript: "#3178c6",
  javascript: "#f1e05a",
  python: "#3572A5",
  java: "#b07219",
  c: "#555555",
  "c++": "#f34b7d",
  "c#": "#178600",
  go: "#00ADD8",
  rust: "#dea584",
  php: "#4F5D95",
  ruby: "#701516",
  swift: "#F05138",
  kotlin: "#A97BFF",
  dart: "#00B4AB",
  html: "#e34c26",
  css: "#563d7c",
  scss: "#c6538c",
  sass: "#a53b70",
  less: "#1d365d",
  vue: "#41b883",
  svelte: "#ff3e00",
  astro: "#ff5a03",

  // Shell & Scripting
  shell: "#89e051",
  bash: "#89e051",
  zsh: "#89e051",
  fish: "#4aae47",
  powershell: "#012456",
  batchfile: "#C1F12E",
  batch: "#C1F12E",
  awk: "#c30e9b",
  sed: "#64b970",
  lua: "#000080",
  r: "#198CE7",
  julia: "#a270ba",
  perl: "#0298c3",
  raku: "#0000fb",
  applescript: "#101F1F",
  autohotkey: "#6594b9",
  autoit: "#1C3552",

  // JVM Languages
  scala: "#c22d40",
  groovy: "#4298b8",
  clojure: "#db5855",
  xtend: "#24255d",

  // Systems, Low-Level & Native
  zig: "#ec915c",
  nim: "#ffc200",
  d: "#ba595e",
  v: "#4f87c4",
  crystal: "#000100",
  carbon: "#222222",
  assembly: "#6E4C13",
  webassembly: "#04133b",
  "objective-c": "#438eff",
  "objective-c++": "#6866fb",
  fortran: "#4d41b1",
  pascal: "#E3F171",
  ada: "#02f88c",
  pony: "#4a8b7c",

  // Functional Languages
  elixir: "#6e4a7e",
  erlang: "#B83998",
  haskell: "#5e5086",
  ocaml: "#ef7a08",
  "f#": "#b845fc",
  elm: "#60B5CC",
  purescript: "#1D222D",
  rescript: "#ed5051",
  reason: "#ff5847",
  "common lisp": "#3fb68b",
  "emacs lisp": "#c065db",
  scheme: "#1e4aec",
  racket: "#3c5caa",
  coq: "#d0b68c",
  agda: "#315665",
  idris: "#b30000",

  // Modern & Emerging
  gleam: "#ffaff3",
  mojo: "#ff4b00",
  cairo: "#ff4a2b",
  move: "#4a90e2",
  solidity: "#AA6746",
  vyper: "#2980b9",
  clarity: "#5546ff",
  ballerina: "#ff5000",
  vala: "#a56de2",
  wren: "#383838",
  ring: "#2D54CB",
  red: "#f50000",

  // Data, Query, Database
  sql: "#e38c00",
  plpgsql: "#336790",
  plsql: "#dad8d8",
  tsql: "#e38c00",
  graphql: "#e10098",
  prisma: "#0c344b",
  "protocol buffer": "#e75429",
  protobuf: "#e75429",
  matlab: "#e16737",
  stan: "#b2011d",

  // DevOps, Infrastructure & Config
  dockerfile: "#384d54",
  makefile: "#427819",
  cmake: "#DA3434",
  meson: "#007800",
  bazel: "#003990",
  nix: "#7e7eff",
  hcl: "#844fba",
  terraform: "#844fba",
  starlark: "#76d275",
  jsonnet: "#0064b5",
  yaml: "#cb171e",
  json: "#292929",
  toml: "#9c4221",
  xml: "#0060ac",
  ini: "#d1dbe0",

  // Template & UI
  blade: "#f7523f",
  jinja: "#b41717",
  liquid: "#67b8de",
  mustache: "#724b3b",
  handlebars: "#f7931e",
  ejs: "#a91e50",
  pug: "#a86454",
  haml: "#ece2a9",

  // Game Dev & Graphics
  gdscript: "#355570",
  hlsl: "#aace60",
  glsl: "#5686a5",
  wgsl: "#1a1a1a",
  shaderlab: "#222c37",

  // Hardware & Embedded
  verilog: "#b2b7f8",
  systemverilog: "#DAE1C2",
  vhdl: "#49f6eb",
  opencl: "#ed2e2d",

  // Document & Text
  markdown: "#083fa1",
  tex: "#3D6117",
  latex: "#3D6117",
  typst: "#239dad",
  "vim script": "#199f4b",
  vim: "#199f4b",
  "visual basic .net": "#945db7",
  "visual basic": "#945db7",
  vb: "#945db7",
  "vb.net": "#945db7",
  coffeescript: "#244776",
  apex: "#1797c0",
  qml: "#44a51c",
  haxe: "#df7900",
  hack: "#878787",
  actionscript: "#882B0F",
  coldfusion: "#ed2f00",
  smalltalk: "#596706",
};

/**
 * Normalizes language names for case-insensitive and symbol-friendly lookup.
 */
export function normalizeLanguageName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Generates a consistent, deterministic HSL color for any language
 * not explicitly included in the Linguist dictionary.
 */
export function hashStringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 48%)`;
}

/**
 * Returns the canonical GitHub color for a programming language,
 * or a deterministic fallback color if unknown.
 */
export function getLanguageColor(name: string): string {
  if (!name || !name.trim()) {
    return "#8b949e";
  }

  const normalized = normalizeLanguageName(name);

  // Exact match
  if (GITHUB_LANGUAGE_COLORS[normalized]) {
    return GITHUB_LANGUAGE_COLORS[normalized];
  }

  // Common alias normalization
  if (normalized === "js") return GITHUB_LANGUAGE_COLORS.javascript;
  if (normalized === "ts") return GITHUB_LANGUAGE_COLORS.typescript;
  if (normalized === "py") return GITHUB_LANGUAGE_COLORS.python;
  if (normalized === "golang") return GITHUB_LANGUAGE_COLORS.go;
  if (normalized === "rs") return GITHUB_LANGUAGE_COLORS.rust;
  if (normalized === "rb") return GITHUB_LANGUAGE_COLORS.ruby;
  if (normalized === "sh") return GITHUB_LANGUAGE_COLORS.shell;
  if (normalized === "csharp" || normalized === "cs") return GITHUB_LANGUAGE_COLORS["c#"];
  if (normalized === "cpp" || normalized === "cplusplus") return GITHUB_LANGUAGE_COLORS["c++"];
  if (normalized === "fsharp" || normalized === "fs") return GITHUB_LANGUAGE_COLORS["f#"];

  // Fallback to deterministic vibrant color
  return hashStringToColor(normalized);
}
