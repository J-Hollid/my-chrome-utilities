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

function selectorLeavesRoot(selector, scopeRoot) {
  const root = scopeRoot.trim();
  return selector.split(",").map((part) => part.trim()).filter(Boolean).every((part) => {
    if (part.startsWith("@")) return true;
    return part === root || part.startsWith(`${root} `) || part.startsWith(`${root}>`) ||
      part.startsWith(`${root}:`) || part.startsWith(`${root}[`);
  });
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
        declaration.consumers.some((id) => !knownPacks.has(id))) {
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
    if (declaration.classification !== "global" && declaration.qaTargets.length) {
      throw new Error(`Non-global stylesheet ${source} cannot declare QA smoke targets`);
    }
    if (declaration.classification === "feature-local" && scopeRoot && stylesheetContents[source]) {
      const rules = stylesheetContents[source]
        .replace(/\/\*[\s\S]*?\*\//gu, "")
        .split("{").slice(0, -1);
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
  const selected = [declaration.owner, ...declaration.consumers];
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
