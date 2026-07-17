import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const shellFiles = new Set([
  "src/side-panel.ts",
  "src/utility-registry.ts",
  "src/background.ts",
]);
const declaredBoundaries = JSON.parse(await readFile(
  new URL("../architecture/data-layer-boundaries.json", import.meta.url),
  "utf8",
));
const internalUtilityImport = /^\.\/(?:data-layer-|command-palette(?:-|\.)|hotkey-)/;
const topLevelDataLayerFile = /^src\/data-layer-[^/]+\.ts$/;
const concreteBrowserRuntime = /(?:\bdocument\.(?:activeElement|addEventListener|body|createElement|documentElement|getElementById|querySelector|querySelectorAll)\b|\bwindow\.|\bchrome\.|\blocalStorage\b|\bsessionStorage\b)/;
const layerRank = { core:0, application:1, browser:2 };

function importsOf(source) {
  return [...source.matchAll(/(?:from\s+)?["']([^"']+)["']/g)]
    .map((match) => match[1])
    .filter((dependency) => dependency.startsWith("."));
}

function normalized(file, dependency) {
  return path.posix.normalize(path.posix.join(
    path.posix.dirname(file),
    dependency.replace(/\.js$/, ".ts"),
  ));
}

function utilityOf(file) {
  return file.match(/^src\/utilities\/([^/]+)\//)?.[1];
}

function layerOf(file) {
  return file.match(/\/layers\/(core|application|browser)\//)?.[1]
    ?? declaredBoundaries[file]?.layer;
}

function moduleOf(file) {
  return declaredBoundaries[file]?.module
    ?? file.match(/^src\/utilities\/data-layer\/layers\/(?:core|application|browser)\/([^/.]+)\.ts$/)?.[1];
}

function dependencyViolation(file, dependency) {
  if (shellFiles.has(file) && internalUtilityImport.test(dependency)) {
    return "shell composition must use public utility entries";
  }

  const target = normalized(file, dependency);
  const owner = utilityOf(file);
  const targetOwner = utilityOf(target);
  if (owner && targetOwner && owner !== targetOwner) {
    return "utilities may not import another utility";
  }

  const layer = layerOf(file);
  const targetLayer = layerOf(target);
  if (layer && targetLayer && layerRank[targetLayer] > layerRank[layer]) {
    return `${layer} may not depend on ${targetLayer}`;
  }
  if (
    layer === "browser" &&
    file.includes("/utilities/data-layer/layers/") &&
    moduleOf(file) &&
    moduleOf(target) &&
    moduleOf(file) !== moduleOf(target)
  ) {
    return "browser adapters may not import another data-layer module";
  }
}

function runtimeViolation(file, source) {
  const layer = layerOf(file);
  if (!concreteBrowserRuntime.test(source)) return;
  if (layer === "core") return "core may not use DOM, Chrome, or storage implementations";
  if (layer === "application") {
    return "application may not use concrete DOM, Chrome, or storage implementations";
  }
}

export function architectureViolations(files) {
  const violations = [];
  for (const [file, source] of files) {
    if (topLevelDataLayerFile.test(file) && !declaredBoundaries[file]) {
      violations.push({
        file,
        dependency:"architecture/data-layer-boundaries.json",
        reason:"data-layer file must declare its module and layer",
      });
    }

    for (const dependency of importsOf(source)) {
      const reason = dependencyViolation(file, dependency);
      if (reason) violations.push({ file, dependency, reason });
    }

    const reason = runtimeViolation(file, source);
    if (reason) violations.push({ file, dependency:"browser runtime", reason });
  }
  return violations;
}

async function sourceFiles(directory = "src") {
  const files = new Map();
  for (const entry of await readdir(directory, { withFileTypes:true })) {
    const file = `${directory}/${entry.name}`;
    if (entry.isDirectory()) {
      for (const item of await sourceFiles(file)) files.set(...item);
    } else if (file.endsWith(".ts")) {
      files.set(file, await readFile(file, "utf8"));
    }
  }
  return files;
}

export async function checkArchitecture() {
  const violations = architectureViolations(await sourceFiles());
  if (violations.length) {
    throw new Error(violations.map(({ file, dependency, reason }) =>
      `${file}: forbidden dependency ${dependency} (${reason})`
    ).join("\n"));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  checkArchitecture().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
