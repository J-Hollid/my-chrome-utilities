import {access, readFile} from "node:fs/promises";
import path from "node:path";

export const stylesheetClassifications = new Set(["feature-local", "shell-bridge", "global"]);
export const stylesheetQaTargets = new Set([
  "STUDIO_GLOBAL_STYLE_SMOKE_TARGET",
  "SIDE_PANEL_GLOBAL_STYLE_SMOKE_TARGET",
]);

const declarationKeys = new Set([
  "source", "destination", "classification", "owner", "consumers", "qaTargets", "scopeRoot",
]);

export function stylesheetDeclarations(registry) {
  if (Array.isArray(registry)) return registry.flatMap((pack) => pack?.stylesheets ?? []);
  return registry?.stylesheets ?? [];
}

function relativePath(value, field) {
  if (typeof value !== "string" || !value || path.posix.normalize(value) !== value ||
      path.posix.isAbsolute(value) || value.startsWith("../") || value.includes("\\") || value.includes("\0")) {
    throw new Error(`Stylesheet ${field} must be a normalized repository-relative path: ${value}`);
  }
  return value;
}

function selectorList(selector) {
  const selectors = [];
  let start = 0;
  let quote = null;
  let parentheses = 0;
  let brackets = 0;
  for (let index = 0; index < selector.length; index += 1) {
    const character = selector[index];
    if (character === "\\") { index += 1; continue; }
    if (quote) {
      if (character === quote) quote = null;
      continue;
    }
    if (character === "\"" || character === "'") { quote = character; continue; }
    if (character === "(") { parentheses += 1; continue; }
    if (character === ")") { parentheses = Math.max(0, parentheses - 1); continue; }
    if (character === "[") { brackets += 1; continue; }
    if (character === "]") { brackets = Math.max(0, brackets - 1); continue; }
    if (character === "," && parentheses === 0 && brackets === 0) {
      selectors.push(selector.slice(start, index).trim());
      start = index + 1;
    }
  }
  selectors.push(selector.slice(start).trim());
  return selectors.filter(Boolean);
}

function selectorLeavesRoot(selector, scopeRoot) {
  const root = scopeRoot.trim();
  return selectorList(selector).every((part) => {
    if (part.startsWith("@")) return true;
    return part === root || part.startsWith(`${root} `) || part.startsWith(`${root}>`) ||
      part.startsWith(`${root}:`) || part.startsWith(`${root}[`);
  });
}

export function validateStylesheetOwnership(registry) {
  if (!Array.isArray(registry)) return registry;
  for (const pack of registry) {
    for (const declaration of pack?.stylesheets ?? []) {
      if (declaration?.owner !== pack?.id) {
        throw new Error(`Stylesheet ${declaration?.source ?? "declaration"} must be declared by its owner pack ${declaration?.owner}`);
      }
    }
  }
  return registry;
}

export function cssRuleHeaders(source) {
  const headers = [];
  let segmentStart = 0;
  let quote = null;
  let comment = false;
  let parentheses = 0;
  let braceDepth = 0;
  let keyframesBodyDepth = null;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (comment) {
      if (character === "*" && next === "/") { comment = false; index += 1; }
      continue;
    }
    if (quote) {
      if (character === "\\") index += 1;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === "/" && next === "*") { comment = true; index += 1; continue; }
    if (character === "\"" || character === "'") { quote = character; continue; }
    if (character === "(") { parentheses += 1; continue; }
    if (character === ")") { parentheses = Math.max(0, parentheses - 1); continue; }
    if (parentheses > 0) continue;
    if (character === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      if (keyframesBodyDepth !== null && braceDepth < keyframesBodyDepth) keyframesBodyDepth = null;
      segmentStart = index + 1;
      continue;
    }
    if (character === ";") segmentStart = index + 1;
    if (character !== "{") continue;
    const header = source.slice(segmentStart, index).trim().split(";").at(-1).trim();
    const keyframesRule = /^@(?:-[\w]+-)?keyframes\b/iu.test(header);
    if (keyframesRule) keyframesBodyDepth = braceDepth + 1;
    else if (!keyframesBodyDepth && header) headers.push(header);
    segmentStart = index + 1;
    braceDepth += 1;
    continue;
  }
  return headers;
}

export function validateStylesheetDeclarations(declarations, {
  packIds = [], sourcePaths = [], stylesheetContents = {},
} = {}) {
  if (!Array.isArray(declarations)) throw new Error("The verification registry must declare stylesheets as an array");
  const knownPacks = new Set(packIds);
  const sources = new Set();
  const destinations = new Set();
  for (const declaration of declarations) {
    if (!declaration || Array.isArray(declaration)) throw new Error("Use an exact stylesheet declaration object");
    const unknownKeys = Object.keys(declaration).filter((key) => !declarationKeys.has(key));
    if (unknownKeys.length) throw new Error(`Stylesheet declaration has unknown fields: ${unknownKeys.join(", ")}`);
    const source = relativePath(declaration.source, "source");
    const destination = relativePath(declaration.destination, "destination");
    if (!source.endsWith(".css") || !destination.endsWith(".css")) {
      throw new Error(`Stylesheet declaration must name CSS assets: ${source}`);
    }
    if (sources.has(source)) throw new Error(`Duplicate or ambiguous stylesheet ownership: ${source}`);
    if (destinations.has(destination)) throw new Error(`Duplicate stylesheet destination: ${destination}`);
    sources.add(source); destinations.add(destination);
    if (sourcePaths.length && !sourcePaths.includes(source)) throw new Error(`Missing declared stylesheet source: ${source}`);
    if (!stylesheetClassifications.has(declaration.classification)) {
      throw new Error(`Stylesheet ${source} has an invalid classification: ${declaration.classification}`);
    }
    if (!knownPacks.has(declaration.owner)) throw new Error(`Stylesheet ${source} has an unknown owner: ${declaration.owner}`);
    if (!Array.isArray(declaration.consumers) || new Set(declaration.consumers).size !== declaration.consumers.length ||
        declaration.consumers.some((id) => !knownPacks.has(id) || id === declaration.owner)) {
      throw new Error(`Stylesheet ${source} has an unknown or duplicate consumer`);
    }
    if (!Array.isArray(declaration.qaTargets) || new Set(declaration.qaTargets).size !== declaration.qaTargets.length ||
        declaration.qaTargets.some((target) => !stylesheetQaTargets.has(target))) {
      throw new Error(`Stylesheet ${source} has an unknown QA smoke target`);
    }
    const scopeRoot = declaration.scopeRoot;
    if (declaration.classification === "feature-local" &&
        (typeof scopeRoot !== "string" || !scopeRoot.trim())) {
      throw new Error(`Feature-local stylesheet ${source} requires a stable scope root`);
    }
    if (declaration.classification === "shell-bridge" &&
        (typeof scopeRoot !== "string" || !scopeRoot.trim())) {
      throw new Error(`Scoped stylesheet ${source} requires a stable scope root`);
    }
    if (declaration.classification === "global" && scopeRoot !== null) {
      throw new Error(`Global stylesheet ${source} must not declare a scope root`);
    }
    if (declaration.classification === "global" &&
        (declaration.consumers.length !== 0 || declaration.qaTargets.length === 0)) {
      throw new Error(`Global stylesheet ${source} requires QA smoke targets and no consumers`);
    }
    if (declaration.classification === "shell-bridge" && declaration.qaTargets.length !== 0) {
      throw new Error(`Shell-bridge stylesheet ${source} cannot declare QA smoke targets`);
    }
    if (declaration.classification !== "global" && declaration.qaTargets.length) {
      throw new Error(`Non-global stylesheet ${source} cannot declare QA smoke targets`);
    }
    if (declaration.classification === "feature-local" && scopeRoot && stylesheetContents[source]) {
      const rules = cssRuleHeaders(stylesheetContents[source]);
      for (const selector of rules) {
        if (!selectorLeavesRoot(selector, scopeRoot)) {
          throw new Error(`Feature-local stylesheet ${source} has a selector escaping scope root ${scopeRoot}`);
        }
      }
    }
  }
  return declarations;
}

export async function validateStylesheetRegistry(registry, {
  repositoryRoot = process.cwd(), packIds = [], sourcePaths = [],
} = {}) {
  validateStylesheetOwnership(registry);
  const declarations = stylesheetDeclarations(registry);
  const stylesheetContents = {};
  for (const declaration of declarations) {
    try {
      stylesheetContents[declaration.source] = await readFile(path.join(repositoryRoot, declaration.source), "utf8");
    } catch (error) {
      if (error.code === "ENOENT") throw new Error(`Missing declared stylesheet source: ${declaration.source}`);
      throw error;
    }
  }
  return validateStylesheetDeclarations(declarations, {packIds, sourcePaths, stylesheetContents});
}

export function stylesheetDeclarationFor(registry, source) {
  return stylesheetDeclarations(registry).find(({source: declared}) => declared === source);
}

export function stylesheetPlanFor(registry, source) {
  const declaration = stylesheetDeclarationFor(registry, source);
  if (!declaration) return null;
  // Global styles are QA-only boundaries. Their readers are intentionally not
  // verification pack consumers; only the declared smoke targets execute.
  const selected = declaration.classification === "global"
    ? [] : [declaration.owner, ...declaration.consumers];
  return {
    declaration,
    selected:[...new Set(selected)],
    styleSmokeTargets:declaration.classification === "global" ? [...declaration.qaTargets] : [],
    terminalFullObligation:declaration.classification === "global",
    propagateDependants:false,
  };
}

export async function declaredStylesheetFiles(registry, {repositoryRoot = process.cwd()} = {}) {
  const declarations = stylesheetDeclarations(registry);
  await validateStylesheetRegistry(registry, {
    repositoryRoot,
    packIds:[...new Set(registry.flatMap?.(({id}) => [id]) ?? [])],
    sourcePaths:declarations.map(({source}) => source),
  });
  return declarations.map(({source, destination}) => ({source, destination}));
}

export async function assertStylesheetSource(source, {repositoryRoot = process.cwd()} = {}) {
  try { await access(path.join(repositoryRoot, source)); }
  catch (error) { if (error.code === "ENOENT") throw new Error(`Missing declared stylesheet source: ${source}`); throw error; }
}
