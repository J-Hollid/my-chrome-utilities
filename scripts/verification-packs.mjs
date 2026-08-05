import { execFile } from "node:child_process";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const registryUrl = new URL("../verification/packs.json", import.meta.url);
const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const exactOwnedPathKeys = ["unit", "property", "features", "handlers", "browserAdapters"];
const testPathKeys = ["unit", "property", "browserAdapters"];
const prefixOwnedPathKeys = ["source", "process"];
const reservedTaskEnvironment = new Set([
  "PATH", "NODE_OPTIONS", "MY_CHROME_UTILITIES_DIST_LOCK_HELD",
  "SWARMFORGE_VERIFICATION_RECEIPT", "SWARMFORGE_STRICT_VERIFICATION_RECEIPT",
]);
const allowedSwarmforgeTaskEnvironment = new Set([
  "SWARMFORGE_BUILD_PREPARED", "SWARMFORGE_PACK_RUNNER_OWNS_JS",
]);
const browserAdapterModeNames = new Set(["shared", "shared-wrapper", "integration"]);
const sharedBrowserHarnessPath = "test/browser-packs/shared-harness.mjs";

const values = (pack, key) => pack[key] ?? [];
const canonicalPaths = (paths) => [...new Set(paths)].sort();

export function staticallyResolvableModuleImports(source, importerPath) {
  const sourceFile = ts.createSourceFile(
    importerPath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  if (sourceFile.parseDiagnostics.length) {
    const diagnostic = sourceFile.parseDiagnostics[0];
    throw new Error(
      `Cannot parse browser adapter imports for ${importerPath}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`,
    );
  }
  const imported = new Set();
  const add = (specifier) => {
    if (!specifier?.startsWith(".")) return;
    imported.add(path.posix.normalize(path.posix.join(path.posix.dirname(importerPath), specifier)));
  };
  const visit = (node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) {
      add(node.moduleSpecifier.text);
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments.length === 1 && ts.isStringLiteralLike(node.arguments[0])) {
      // Literal dynamic imports are supported for same-pack shard wrappers and
      // remain statically resolvable without executing adapter code.
      add(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return [...imported].sort();
}

export function browserAdapterUsesSharedHarness(source, adapterPath) {
  return staticallyResolvableModuleImports(source, adapterPath).includes(sharedBrowserHarnessPath);
}

export async function loadVerificationPacks() {
  return JSON.parse(await readFile(registryUrl, "utf8"));
}

async function repositoryPaths(directory, suffix = "") {
  const paths = [];
  let entries;
  try {
    entries = await readdir(new URL(`../${directory}/`, import.meta.url), {
      withFileTypes:true,
    });
  } catch (error) {
    if (error.code === "ENOENT") return paths;
    throw error;
  }

  for (const entry of entries) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) paths.push(...await repositoryPaths(path, suffix));
    else if (!suffix || path.endsWith(suffix)) paths.push(path);
  }
  return paths.sort();
}

async function trackedRepositoryPaths() {
  const listed = await new Promise((resolve, reject) => {
    execFile("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
      { cwd:repositoryRoot, maxBuffer:16 * 1024 * 1024 },
      (error, stdout, stderr) => error
        ? reject(new Error(stderr.trim() || error.message))
        : resolve(stdout.split("\0").filter(Boolean).sort()));
  });
  const existing = [];
  for (const candidate of listed) {
    try {
      await access(path.join(repositoryRoot, candidate));
      existing.push(candidate);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return existing;
}

export async function verificationInventory() {
  const testPaths = await repositoryPaths("test", ".mjs");
  const rootProcessPaths = [
    ".gitignore", ".nvmrc", "README.md", "bb.edn", "deps.edn", "package.json", "package-lock.json",
    "swarm", "tsconfig.json", "manifest.json",
    "side-panel.html", "side-panel.css", "specification-builder.html",
    "specification-builder.css", "specification-builder-guidance.css", "layered-schema.css",
    "twatility-brand.css", "schema-authoring-brand.css", "side-panel-brand.css",
    "specification-builder-brand.css",
  ];
  const existingRootProcessPaths = [];
  for (const path of rootProcessPaths) {
    try {
      await access(new URL(`../${path}`, import.meta.url));
      existingRootProcessPaths.push(path);
    } catch { /* optional in generated test repositories */ }
  }
  return {
    source:await repositoryPaths("src", ".ts"),
    tests:testPaths.filter((path) =>
      path.endsWith("-test.mjs") ||
      (path.startsWith("test/browser-packs/") && !path.endsWith("shared-harness.mjs"))
    ),
    features:await repositoryPaths("features", ".feature"),
    handlers:await repositoryPaths("acceptance/src/acceptance/steps", ".clj"),
    checkpoints:await repositoryPaths("acceptance/runtime", ".mjs"),
    tracked:await trackedRepositoryPaths(),
    process:[
      ...existingRootProcessPaths,
      ...await repositoryPaths(".github"),
      ...await repositoryPaths("acceptance/src/acceptance"),
      ...await repositoryPaths("architecture"),
      ...await repositoryPaths("assets"),
      ...await repositoryPaths("docs"),
      ...await repositoryPaths("project-briefs"),
      ...await repositoryPaths("scripts", ".mjs"),
      ...await repositoryPaths("swarmforge"),
      ...await repositoryPaths("test/acceptance", ".clj"),
      ...await repositoryPaths("test/fixtures"),
      ...await repositoryPaths("test/hardening", ".clj"),
      ...await repositoryPaths("test/helpers", ".mjs"),
      ...await repositoryPaths("test/mutation", ".clj"),
      ...await repositoryPaths("test/project_tools", ".clj"),
      ...await repositoryPaths("test/support", ".mjs"),
      "test/browser-packs/shared-harness.mjs",
      ...await repositoryPaths("vendor/acceptance-pipeline-specification"),
      ...await repositoryPaths("verification"),
    ].sort(),
  };
}

function prefixMatches(prefix, path) {
  return path === prefix || path.startsWith(prefix);
}

function processPrefixMatches(prefix, path) {
  if (prefix.endsWith("/")) return path.startsWith(prefix);
  return path === prefix;
}

function assignedPaths(packs, keys) {
  const owners = new Map();
  for (const pack of packs) {
    for (const key of keys) {
      for (const path of values(pack, key)) {
        const pathOwners = owners.get(path) ?? [];
        pathOwners.push(pack.id);
        owners.set(path, pathOwners);
      }
    }
  }
  return owners;
}

async function validateRegisteredPaths(packs) {
  const owners = new Map();
  for (const pack of packs) {
    for (const key of exactOwnedPathKeys) {
      for (const path of values(pack, key)) {
        if (owners.has(path)) {
          throw new Error(`Assign every ${key} path to exactly one pack: ${path}`);
        }
        owners.set(path, pack.id);
        try {
          await access(new URL(`../${path}`, import.meta.url));
        } catch {
          throw new Error(`Correct the missing ${key} path: ${path}`);
        }
      }
    }
    for (const prefix of values(pack, "process")) {
      try {
        await access(new URL(`../${prefix}`, import.meta.url));
      } catch {
        throw new Error(`Correct the missing process path: ${prefix}`);
      }
    }
  }
}

function validateDependencies(packs, ids) {
  for (const pack of packs) {
    for (const dependency of values(pack, "dependencies")) {
      if (!ids.has(dependency)) throw new Error(`Register every direct dependency: ${dependency}`);
    }
    for (const component of values(pack, "sharedComponents")) {
      if (!ids.has(component)) throw new Error(`Register every shared verification component: ${component}`);
      if (values(pack, "dependencies").includes(component)) {
        throw new Error(`Choose dependency or shared component semantics once: ${pack.id} -> ${component}`);
      }
    }
  }
}

function validateImpactBoundaries(packs) {
  const ids = new Set();
  for (const pack of packs) {
    for (const boundary of values(pack, "impactBoundaries")) {
      if (!boundary || Array.isArray(boundary) ||
          Object.keys(boundary).sort().join(",") !== "id,prefixes,propagateDependants" ||
          !/^[a-z0-9][a-z0-9_-]*$/u.test(boundary.id ?? "") || ids.has(boundary.id) ||
          !Array.isArray(boundary.prefixes) || !boundary.prefixes.length ||
          boundary.prefixes.some((prefix) => typeof prefix !== "string" || !prefix ||
            !values(pack, "source").some((owned) =>
              prefixMatches(owned, prefix) || prefixMatches(prefix, owned))) ||
          typeof boundary.propagateDependants !== "boolean") {
        throw new Error(`Use exact owned impact boundaries in pack ${pack.id}`);
      }
      ids.add(boundary.id);
    }
  }
}

function validateVerificationInputs(packs, trackedPaths) {
  const tracked = new Set(trackedPaths);
  for (const pack of packs) {
    const inputs = values(pack, "verificationInputs");
    if (new Set(inputs).size !== inputs.length) {
      throw new Error(`Declare every verification input once in pack ${pack.id}`);
    }
    if (inputs.length && !runnable(pack)) {
      throw new Error(`Verification inputs require runnable checks in pack ${pack.id}`);
    }
    for (const input of inputs) {
      if (typeof input !== "string" || !input || path.isAbsolute(input) || input.includes("\\") ||
          input.includes("\0") || input === "." || input === ".." || input.startsWith("../") ||
          path.posix.normalize(input) !== input || input === "dist" || input.startsWith("dist/")) {
        throw new Error(`Use an exact normalized non-generated verification input in pack ${pack.id}`);
      }
      if (!tracked.has(input)) {
        throw new Error(`Correct the missing verification input in pack ${pack.id}: ${input}`);
      }
      const owner = ownerOf(packs, input);
      if (!owner) throw new Error(`Assign verification input ${input} to one verification owner`);
      if (owner.id === pack.id) {
        throw new Error(`Remove self-owned verification input from pack ${pack.id}: ${input}`);
      }
    }
  }
}

function validateRuntimeInputs(packs, trackedPaths) {
  const tracked = new Set(trackedPaths);
  for (const pack of packs) {
    const inputs = values(pack, "runtimeInputs");
    if (new Set(inputs).size !== inputs.length) {
      throw new Error(`Declare every runtime input once in pack ${pack.id}`);
    }
    for (const input of inputs) {
      if (typeof input !== "string" || !input || path.isAbsolute(input) || input.includes("\\") ||
          input.includes("\0") || input === "." || input === ".." || input.startsWith("../") ||
          path.posix.normalize(input) !== input || input === "dist" || input.startsWith("dist/")) {
        throw new Error(`Use an exact normalized runtime input in pack ${pack.id}`);
      }
      if (!tracked.has(input)) {
        throw new Error(`Correct the missing runtime input in pack ${pack.id}: ${input}`);
      }
      if (!ownerOf(packs, input)) throw new Error(`Assign runtime input ${input} to one verification owner`);
    }
  }
}

async function validateVerificationHelpers(packs) {
  const declarations = new Map();
  for (const owner of packs) {
    for (const declaration of values(owner, "verificationHelpers")) {
      if (!declaration || Array.isArray(declaration) ||
          Object.keys(declaration).sort().join(",") !== "consumers,path" ||
          typeof declaration.path !== "string" || !Array.isArray(declaration.consumers) ||
          !declaration.consumers.length || new Set(declaration.consumers).size !== declaration.consumers.length) {
        throw new Error(`Use an exact verification helper declaration in pack ${owner.id}`);
      }
      if (declarations.has(declaration.path)) {
        throw new Error(`Declare verification helper once: ${declaration.path}`);
      }
      if (ownerOf(packs, declaration.path)?.id !== owner.id) {
        throw new Error(`Declare verification helper under its owning pack: ${declaration.path}`);
      }
      declarations.set(declaration.path, { ownerId:owner.id, consumers:[...declaration.consumers].sort() });
    }
  }
  const actual = new Map();
  for (const consumer of packs) {
    for (const testPath of testPathKeys.flatMap((key) => values(consumer, key))) {
      const source = await readFile(path.join(repositoryRoot, testPath), "utf8");
      for (const importedPath of staticallyResolvableModuleImports(source, testPath)) {
        const helper = importedPath === sharedBrowserHarnessPath || importedPath.startsWith("test/support/")
          ? importedPath : null;
        if (!helper) continue;
        const consumers = actual.get(helper) ?? new Set();
        consumers.add(consumer.id);
        actual.set(helper, consumers);
      }
    }
  }
  for (const [helper, consumers] of actual) {
    const declaration = declarations.get(helper);
    if (!declaration) throw new Error(`Declare every imported verification helper consumer: ${helper}`);
    const actualConsumers = [...consumers].sort();
    if (actualConsumers.join("\0") !== declaration.consumers.join("\0")) {
      throw new Error(`Correct verification helper consumers for ${helper}: ` +
        `declared ${declaration.consumers.join(", ")}; imported by ${actualConsumers.join(", ")}`);
    }
  }
  for (const helper of declarations.keys()) {
    if (!actual.has(helper)) throw new Error(`Remove stale verification helper declaration: ${helper}`);
  }
}

async function validateBrowserAdapterModes(packs) {
  const modesByPath = new Map();
  for (const pack of packs) {
    const adapters = values(pack, "browserAdapters");
    const classifications = values(pack, "browserAdapterModes");
    if (classifications.length !== adapters.length) {
      throw new Error(`Classify every browser adapter in pack ${pack.id}`);
    }
    const classifiedPaths = new Set();
    for (const classification of classifications) {
      if (!classification || Array.isArray(classification) ||
          Object.keys(classification).sort().join(",") !== "mode,path" ||
          typeof classification.path !== "string" ||
          !browserAdapterModeNames.has(classification.mode)) {
        throw new Error(`Use an exact browser adapter mode in pack ${pack.id}`);
      }
      if (!adapters.includes(classification.path)) {
        throw new Error(`Classified browser adapter is not owned by pack ${pack.id}: ${classification.path}`);
      }
      if (classifiedPaths.has(classification.path)) {
        throw new Error(`Classify browser adapter once in pack ${pack.id}: ${classification.path}`);
      }
      classifiedPaths.add(classification.path);
      if (ownerOf(packs, classification.path)?.id !== pack.id) {
        throw new Error(`Classified browser adapter has the wrong owner: ${classification.path}`);
      }
      modesByPath.set(classification.path, classification.mode);
    }
  }

  for (const pack of packs) {
    for (const adapter of values(pack, "browserAdapters")) {
      const mode = modesByPath.get(adapter);
      const source = await readFile(path.join(repositoryRoot, adapter), "utf8");
      const imported = staticallyResolvableModuleImports(source, adapter);
      const usesSharedHarness = imported.includes(sharedBrowserHarnessPath);
      if (mode === "shared" && !usesSharedHarness) {
        throw new Error(`Shared browser adapter does not use the shared harness: ${adapter}`);
      }
      if (mode === "shared-wrapper") {
        if (!imported.some((importedPath) => modesByPath.get(importedPath) === "shared" &&
            ownerOf(packs, importedPath)?.id === pack.id)) {
          throw new Error(`Shared-wrapper browser adapter does not import a shared adapter: ${adapter}`);
        }
      }
      if (mode === "integration" && usesSharedHarness) {
        throw new Error(`Integration browser adapter must not masquerade as a shared adapter: ${adapter}`);
      }
    }
  }
}

export function validateBrowserPerformanceDeclarations(packs) {
  for (const pack of packs) {
    const observations = new Map(values(pack, "browserObservations").map((item) => [item.id, item]));
    for (const performance of values(pack, "browserAdapterPerformance")) {
      if (!performance || Array.isArray(performance) || typeof performance.path !== "string" ||
          !values(pack, "browserAdapters").includes(performance.path) ||
          !Number.isFinite(performance.singleTargetP90Milliseconds) ||
          !Number.isFinite(performance.maximumSingleTargetP90Milliseconds)) {
        throw new Error(`Use an exact browser adapter performance declaration in pack ${pack.id}`);
      }
      if (performance.singleTargetP90Milliseconds <= performance.maximumSingleTargetP90Milliseconds) continue;
      if (!Array.isArray(performance.targetIds) || new Set(performance.targetIds).size < 2 ||
          typeof performance.sessionBatch !== "string" || !performance.sessionBatch.trim()) {
        throw new Error(`Split slow browser adapter ${performance.path} into independently selectable targets with a reusable session batch`);
      }
      for (const targetId of performance.targetIds) {
        const observation = observations.get(targetId);
        if (!observation || observation.path !== performance.path ||
            observation.sessionBatch !== performance.sessionBatch) {
          throw new Error(`Map slow browser adapter target ${targetId} to ${performance.path} and batch ${performance.sessionBatch}`);
        }
      }
    }
  }
}

function validatePrefixOwnership(packs, inventory, key) {
  const matches = key === "process" ? processPrefixMatches : prefixMatches;
  for (const pack of packs) {
    for (const prefix of values(pack, key)) {
      if (!inventory.some((path) => matches(prefix, path))) {
        throw new Error(`Correct the missing ${key} path: ${prefix}`);
      }
    }
  }
  for (const path of inventory) {
    const owners = packs.filter((pack) =>
      values(pack, key).some((prefix) => matches(prefix, path))
    );
    if (owners.length !== 1) throw new Error(`Assign every ${key} path to one pack: ${path}`);
  }
}

function validateInventoryPaths(packs, inventory) {
  const tests = assignedPaths(packs, testPathKeys);
  for (const path of inventory.tests) {
    if ((tests.get(path)?.length ?? 0) !== 1) {
      throw new Error(`Assign every test path to exactly one pack: ${path}`);
    }
  }
  for (const key of ["features", "handlers"]) {
    const assigned = new Set(packs.flatMap((pack) => values(pack, key)));
    for (const path of inventory[key]) {
      if (!assigned.has(path)) throw new Error(`Unassigned ${key} path: ${path}`);
    }
    for (const path of assigned) {
      if (!inventory[key].includes(path)) {
        throw new Error(`Assigned ${key} path is not in the repository: ${path}`);
      }
    }
  }
  const checkpointOwners = assignedPaths(
    packs.map((pack) => ({
      ...pack,
      checkpoints:values(pack, "checkpointCommands")
        .filter(({ executable, args }) => executable === "node" && args?.[0]?.startsWith("acceptance/runtime/"))
        .map(({ args }) => args[0]),
    })),
    ["checkpoints"],
  );
  for (const path of inventory.checkpoints) {
    if ((checkpointOwners.get(path)?.length ?? 0) !== 1) {
      throw new Error(`Assign every acceptance runtime checkpoint to exactly one pack: ${path}`);
    }
  }
}

function validateTrackedOwnership(packs, trackedPaths) {
  for (const path of trackedPaths) {
    if (path === "dist" || path.startsWith("dist/")) continue;
    if (!ownerOf(packs, path)) throw new Error(`Assign every tracked repository path to one verification owner: ${path}`);
  }
}

function validateDeclaredTasks(packs) {
  const observationIds = new Set();
  const registeredTestPaths = new Set(packs.flatMap((pack) => testPathKeys.flatMap((key) => values(pack, key))));
  for (const pack of packs) {
    for (const observation of values(pack, "browserObservations")) {
      if (!observation || !/^[A-Za-z0-9][A-Za-z0-9_:.-]*$/u.test(observation.id ?? "")) {
        throw new Error(`Use a stable browser observation id in pack ${pack.id}`);
      }
      if (observationIds.has(observation.id)) {
        throw new Error(`Browser observation ids must be globally unique: ${observation.id}`);
      }
      observationIds.add(observation.id);
      if (!registeredTestPaths.has(observation.path)) {
        throw new Error(`Register browser observation path as a verification test: ${observation.path}`);
      }
      if (!observation.environment || Array.isArray(observation.environment) ||
          Object.entries(observation.environment).some(([name, value]) =>
            !/^[A-Z][A-Z0-9_]*$/u.test(name) || typeof value !== "string" ||
            reservedTaskEnvironment.has(name) ||
            name.startsWith("SWARMFORGE_") && !allowedSwarmforgeTaskEnvironment.has(name))) {
        throw new Error(`Use an exact environment object for browser observation ${observation.id}`);
      }
      const observationKeys = observation.observationKeys ?? [observation.observationKey].filter(Boolean);
      if (!observationKeys.length || observationKeys.some((key) => typeof key !== "string" || !key.trim())) {
        throw new Error(`Provide observation key(s) for browser observation ${observation.id}`);
      }
      if (!Array.isArray(observation.features) || !observation.features.length ||
          observation.features.some((feature) => !values(pack, "features").includes(feature))) {
        throw new Error(`Map browser observation ${observation.id} to registered features in its pack`);
      }
      if (observation.sessionBatch !== undefined &&
          (typeof observation.sessionBatch !== "string" || !observation.sessionBatch.trim())) {
        throw new Error(`Use a stable reusable session batch for browser observation ${observation.id}`);
      }
    }
    const checkpointIds = new Set();
    for (const checkpoint of values(pack, "checkpointCommands")) {
      if (!checkpoint || !/^[a-z0-9][a-z0-9_-]*$/u.test(checkpoint.id ?? "") || checkpointIds.has(checkpoint.id)) {
        throw new Error(`Use unique stable checkpoint command ids in pack ${pack.id}`);
      }
      checkpointIds.add(checkpoint.id);
      if (!checkpoint.executable?.trim() || !Array.isArray(checkpoint.args) ||
          checkpoint.args.some((argument) => typeof argument !== "string" || !argument)) {
        throw new Error(`Provide executable and args for checkpoint ${pack.id}:${checkpoint.id}`);
      }
      if (checkpoint.features && (!Array.isArray(checkpoint.features) ||
          checkpoint.features.some((feature) => !values(pack, "features").includes(feature)))) {
        throw new Error(`Map checkpoint ${pack.id}:${checkpoint.id} to registered pack features`);
      }
      if (checkpoint.environment && (Array.isArray(checkpoint.environment) ||
          Object.entries(checkpoint.environment).some(([name, value]) =>
            !/^[A-Z][A-Z0-9_]*$/u.test(name) || typeof value !== "string" ||
            reservedTaskEnvironment.has(name) ||
            name.startsWith("SWARMFORGE_") && !allowedSwarmforgeTaskEnvironment.has(name)))) {
        throw new Error(`Use a safe exact environment object for checkpoint ${pack.id}:${checkpoint.id}`);
      }
    }
  }
}

export async function validateVerificationPacks(packs, { inventory } = {}) {
  const ids = new Set();
  for (const pack of packs) {
    if (ids.has(pack.id)) throw new Error(`Verification pack ids must be unique: ${pack.id}`);
    ids.add(pack.id);
  }
  await validateRegisteredPaths(packs);
  validateDependencies(packs, ids);
  validateImpactBoundaries(packs);
  validateDeclaredTasks(packs);
  await validateBrowserAdapterModes(packs);
  validateBrowserPerformanceDeclarations(packs);
  await validateVerificationHelpers(packs);

  const repositoryInventory = { ...await verificationInventory(), ...inventory };
  validatePrefixOwnership(packs, repositoryInventory.source, "source");
  validatePrefixOwnership(packs, repositoryInventory.process, "process");
  validateInventoryPaths(packs, repositoryInventory);
  validateTrackedOwnership(packs, repositoryInventory.tracked);
  validateVerificationInputs(packs, repositoryInventory.tracked);
  validateRuntimeInputs(packs, repositoryInventory.tracked);
  return packs;
}

function ownersAtPriority(packs, path) {
  const levels = [
    packs.filter((pack) => exactOwnedPathKeys.some((key) => values(pack, key).includes(path)) ||
      values(pack, "checkpointCommands").some(({ executable, args }) => executable === "node" && args?.[0] === path)),
    packs.filter((pack) => values(pack, "source").some((prefix) => prefixMatches(prefix, path))),
    packs.filter((pack) => values(pack, "process").some((prefix) => processPrefixMatches(prefix, path))),
  ];
  return levels.find((owners) => owners.length) ?? [];
}

function ownerOf(packs, path) {
  const owners = ownersAtPriority(packs, path);
  const ids = [...new Set(owners.map(({ id }) => id))];
  if (ids.length > 1) {
    throw new Error(`Ambiguous verification ownership for ${path}: ${ids.join(", ")}`);
  }
  return owners[0];
}

function globalImpact(packs, path) {
  return packs.some((pack) => values(pack, "globalImpact").some((prefix) => prefixMatches(prefix, path)));
}

function exactVerificationConsumers(packs, path) {
  return packs.filter((pack) =>
    values(pack, "verificationInputs").includes(path) ||
    values(pack, "browserObservations").some((observation) => observation.path === path) ||
    values(pack, "checkpointCommands").some(({ executable, args }) => executable === "node" && args?.[0] === path)
  ).map(({ id }) => id);
}

function exactRuntimeConsumers(packs, path) {
  return packs.filter((pack) => values(pack, "runtimeInputs").includes(path)).map(({ id }) => id);
}

function impactBoundaryFor(pack, changedPath) {
  const matches = values(pack, "impactBoundaries").filter((boundary) =>
    boundary.prefixes.some((prefix) => prefixMatches(prefix, changedPath)));
  if (!matches.length) return null;
  return matches.sort((left, right) =>
    Math.max(...right.prefixes.map((prefix) => prefix.length)) -
    Math.max(...left.prefixes.map((prefix) => prefix.length)))[0];
}

export function verificationOwner(packs, path) {
  if (path === "dist" || path.startsWith("dist/")) return "generated-artifact";
  return ownerOf(packs, path)?.id;
}

function bootstrapPackWeight(pack) {
  if (Number.isFinite(pack.measuredWeightMs) && pack.measuredWeightMs > 0) return pack.measuredWeightMs;
  return values(pack, "unit").length * 250 + values(pack, "property").length * 500 +
    values(pack, "browserAdapters").length * 15_000 +
    values(pack, "browserObservations").length * 2_000 +
    values(pack, "features").length * 200 + values(pack, "checkpointCommands").length * 2_000 + 1;
}

function shardedPacks(packs, shard) {
  if (!shard) return packs;
  const lanes = Array.from({ length:shard.count }, (_, index) => ({ index, weight:0, ids:new Set() }));
  const weighted = [...packs].sort((left, right) =>
    bootstrapPackWeight(right) - bootstrapPackWeight(left) || left.id.localeCompare(right.id));
  for (const pack of weighted) {
    lanes.sort((left, right) => left.weight - right.weight || left.index - right.index);
    lanes[0].ids.add(pack.id);
    lanes[0].weight += bootstrapPackWeight(pack);
  }
  const selected = lanes.find(({ index }) => index === shard.index)?.ids ?? new Set();
  return packs.filter(({ id }) => selected.has(id));
}

function expandDependencies(packs, ids) {
  const selected = new Set(ids);
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of [...selected]) {
      const pack = packs.find((item) => item.id === id);
      if (!pack) throw new Error(`Register every direct dependency: ${id}`);
      for (const dependency of values(pack, "dependencies")) {
        if (!selected.has(dependency)) { selected.add(dependency); changed = true; }
      }
    }
  }
  return selected;
}

function expandDependants(packs, ids) {
  const selected = new Set(ids);
  let changed = true;
  while (changed) {
    changed = false;
    for (const pack of packs) {
      const upstream = [...values(pack, "dependencies"), ...values(pack, "sharedComponents")];
      if (upstream.some((id) => selected.has(id)) && !selected.has(pack.id)) {
        selected.add(pack.id);
        changed = true;
      }
    }
  }
  return selected;
}

function expandDependantsAcross(registries, ids) {
  const selected = new Set(ids);
  let changed = true;
  while (changed) {
    changed = false;
    for (const registry of registries) {
      for (const id of expandDependants(registry, selected)) {
        if (!selected.has(id)) { selected.add(id); changed = true; }
      }
    }
  }
  return selected;
}

function acceptanceArtifacts(feature) {
  const basename = feature.slice(feature.lastIndexOf("/") + 1).replace(/\.feature$/u, "");
  const slug = feature.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/(^-+|-+$)/gu, "");
  return {
    ir:`build/acceptance/ir/${basename}.json`,
    generated:`build/acceptance/generated/${slug}_acceptance_test.clj`,
  };
}

function displayArgument(argument) {
  return /^[A-Za-z0-9_./:=@+-]+$/u.test(argument) ? argument : JSON.stringify(argument);
}

function commandTask({
  key, stage, packId = null, executable, args, target = null, environment = null,
  logicalTargetIds = undefined,
}) {
  const task = { key, stage, packId, executable, args:[...args], target, environment };
  if (logicalTargetIds) task.logicalTargetIds = [...logicalTargetIds];
  return { ...task, display:[executable, ...args].map(displayArgument).join(" ") };
}

export function verificationTaskIdentity(task) {
  const identity = {
    key:task.key,
    stage:task.stage,
    packId:task.packId ?? null,
    executable:task.executable,
    args:[...task.args],
    target:task.target ?? null,
    environment:task.environment ?? null,
  };
  if (task.logicalTargetIds) identity.logicalTargetIds = [...task.logicalTargetIds];
  return identity;
}

function featureTasks(features, packs) {
  const artifacts = features.map((feature) => ({ feature, ...acceptanceArtifacts(feature) }));
  const parser = artifacts.map(({ feature, ir }) => commandTask({
    key:`acceptance-parse:${feature}`, stage:"acceptance-parse", executable:"bb",
    args:["gherkin-parser", feature, ir], target:feature,
  }));
  const generator = artifacts.map(({ feature, ir }) => commandTask({
    key:`acceptance-generate:${feature}`, stage:"acceptance-generate", executable:"bb",
    args:["acceptance-entrypoint-generator", ir, "build/acceptance/generated"], target:feature,
  }));
  const sessions = packs.map((pack) => {
    const packArtifacts = artifacts.filter(({ feature }) => values(pack, "features").includes(feature));
    if (!packArtifacts.length) return null;
    return commandTask({
      key:`acceptance-session:${pack.id}`, stage:"acceptance-session", packId:pack.id,
      executable:"bb",
      args:["acceptance-pack-runner", pack.id, ...packArtifacts.flatMap(({ generated, ir }) => [generated, ir])],
      target:packArtifacts.map(({ feature }) => feature).join(","),
    });
  }).filter(Boolean);
  return { parser, generator, sessions };
}

function runnable(pack) {
  return [...exactOwnedPathKeys.filter((key) => key !== "handlers").flatMap((key) => values(pack, key)),
    ...values(pack, "browserObservations"), ...values(pack, "checkpointCommands")].length > 0;
}

function uniquePackIds(tasks) {
  return [...new Set(tasks.map(({ packId }) => packId).filter(Boolean))];
}

function historicalRegistryHasPlanningShape(packs, known) {
  const arrayKeys = [
    ...exactOwnedPathKeys, ...prefixOwnedPathKeys, "globalImpact", "features",
    "browserObservations", "checkpointCommands", "dependencies", "sharedComponents",
    "verificationInputs", "runtimeInputs", "verificationHelpers", "browserAdapterModes",
    "browserAdapterPerformance", "impactBoundaries",
  ];
  return Array.isArray(packs) && packs.length > 0 &&
    new Set(packs.map((pack) => pack?.id)).size === packs.length &&
    packs.every((pack) => pack && typeof pack.id === "string" && known.has(pack.id) &&
      arrayKeys.every((key) => pack[key] === undefined || Array.isArray(pack[key])) &&
      exactOwnedPathKeys.concat(prefixOwnedPathKeys, "globalImpact", "features", "verificationInputs", "runtimeInputs")
        .every((key) => values(pack, key).every((entry) => typeof entry === "string")) &&
      ["dependencies", "sharedComponents"].every((key) =>
        values(pack, key).every((entry) => typeof entry === "string" && known.has(entry))) &&
      values(pack, "browserAdapterModes").every((entry) => entry && !Array.isArray(entry) &&
        Object.keys(entry).sort().join(",") === "mode,path" && typeof entry.path === "string" &&
        browserAdapterModeNames.has(entry.mode)) &&
      values(pack, "verificationHelpers").every((entry) => entry && typeof entry.path === "string" &&
        Array.isArray(entry.consumers)) &&
      values(pack, "browserObservations").every((entry) => entry && typeof entry.path === "string") &&
      values(pack, "checkpointCommands").every((entry) => entry && typeof entry.executable === "string" &&
        Array.isArray(entry.args)));
}

export function planVerification(
  packs,
  {
    packIds = [], changedPaths = [], terminalFull = false, includeProperties = false,
    withDependencies = false, skipBuild = false, shard, changeSet = null,
    basePacks = undefined, historicalRegistryFallback = false, browserTargetIds = [],
  } = {},
) {
  const known = new Set(packs.map(({ id }) => id));
  validateDependencies(packs, known);
  if (new Set(packIds).size !== packIds.length) throw new Error("Select every explicit verification pack once");
  if (new Set(changedPaths).size !== changedPaths.length) throw new Error("Select every changed path once");
  if (new Set(browserTargetIds).size !== browserTargetIds.length) {
    throw new Error("Select every focused browser target once");
  }
  for (const id of packIds) {
    const pack = packs.find((candidate) => candidate.id === id);
    if (!pack) throw new Error(`Unknown verification pack: ${id}`);
    if (!runnable(pack)) throw new Error(`Verification pack has no runnable checks: ${id}`);
  }
  if (terminalFull && (packIds.length || changedPaths.length || withDependencies)) {
    throw new Error("Use --full without pack, changed-path, or dependency selectors");
  }
  if (browserTargetIds.length && (terminalFull || changedPaths.length || packIds.length !== 1)) {
    throw new Error("Select focused browser targets from one exact pack");
  }
  if (shard && !terminalFull) throw new Error("Use --shard only with --full");
  if (skipBuild && !terminalFull) throw new Error("Use --no-build only for a prepared --full shard");
  if (!terminalFull && !packIds.length && !changedPaths.length) {
    throw new Error("Select an explicit pack, changed path, or terminal full plan");
  }

  if (changeSet) {
    const validEntries = Array.isArray(changeSet.entries) && changeSet.entries.every((entry) => {
      if (!entry || !/^[ACDMRTUXB]$/u.test(entry.status ?? "")) return false;
      if (entry.status === "R" || entry.status === "C") {
        return typeof entry.oldPath === "string" && typeof entry.newPath === "string" &&
          Number.isInteger(entry.score) && entry.score >= 0 && entry.score <= 100;
      }
      return typeof entry.path === "string";
    });
    const entryPaths = validEntries ? canonicalPaths(changeSet.entries.flatMap((entry) => entry.oldPath
      ? [entry.oldPath, entry.newPath]
      : [entry.path])) : [];
    if (changeSet.version !== 1 || !Array.isArray(changeSet.entries) || !Array.isArray(changeSet.paths) ||
        !/^[a-f0-9]{40,64}$/u.test(changeSet.baseCommit ?? "") ||
        !/^[a-f0-9]{40,64}$/u.test(changeSet.commit ?? "") || !validEntries ||
        entryPaths.join("\0") !== canonicalPaths(changeSet.paths).join("\0") ||
        canonicalPaths(changeSet.paths).join("\0") !== canonicalPaths(changedPaths).join("\0")) {
      throw new Error("Use the canonical version 1 Git change set for --changed-since planning");
    }
  }

  const explicit = new Set(packIds);
  let selected = terminalFull ? new Set(known) : new Set(explicit);
  const changedOwners = new Map();
  const changedBoundaries = new Map();
  const registryChanged = changedPaths.includes("verification/packs.json");
  const historicalPacksCompatible = historicalRegistryHasPlanningShape(basePacks, known);
  const historicalOwnerPaths = !changeSet || !historicalPacksCompatible ? []
    : changeSet.entries.flatMap((entry) => entry.status === "D" ? [entry.path]
      : entry.status === "R" || entry.status === "C" ? [entry.oldPath]
        : []).filter((changedPath) => changedPath !== "dist" && !changedPath.startsWith("dist/"));
  const historicalOwnershipUnavailable = historicalOwnerPaths.some((changedPath) =>
    !ownerOf(basePacks, changedPath));
  const forceAll = Boolean(changeSet) && (registryChanged || historicalRegistryFallback ||
    !historicalPacksCompatible || historicalOwnershipUnavailable);
  const conservativeHistoricalFallbackReason = !changeSet ? null
    : registryChanged ? "verification-registry-changed"
      : historicalRegistryFallback ? "historical-registry-unreadable"
        : !historicalPacksCompatible ? "historical-registry-incompatible"
          : historicalOwnershipUnavailable ? "historical-ownership-unavailable"
            : null;
  const allRunnableIds = packs.filter(runnable).map(({ id }) => id);

  const affectedFor = (registry, changedPath) => {
    if (changedPath === "dist" || changedPath.startsWith("dist/")) {
      return { semantic:[], exactSemantic:[], verificationConsumers:[], boundary:null };
    }
    const owner = ownerOf(registry, changedPath);
    if (!owner) throw new Error(`Assign every changed path to one verification pack: ${changedPath}`);
    const boundary = impactBoundaryFor(owner, changedPath);
    const runtimeConsumers = exactRuntimeConsumers(registry, changedPath);
    const semantic = globalImpact(registry, changedPath)
      ? [owner.id, ...registry.filter(runnable).map(({ id }) => id)]
      : [...(boundary && !boundary.propagateDependants ? [] : [owner.id]), ...runtimeConsumers];
    const exactSemantic = boundary && !boundary.propagateDependants ? [owner.id] : [];
    const verificationConsumers = exactVerificationConsumers(registry, changedPath);
    const unavailable = [...new Set([...semantic, ...verificationConsumers])]
      .filter((id) => !known.has(id));
    if (unavailable.length) {
      throw new Error(`Historical verification owner is unavailable for ${changedPath}: ${unavailable.join(", ")}`);
    }
    return {
      semantic:[...new Set(semantic)],
      exactSemantic:[...new Set(exactSemantic)],
      verificationConsumers:[...new Set(verificationConsumers)],
      boundary:boundary?.id ?? null,
    };
  };
  const combinedAffected = (...affected) => ({
    semantic:[...new Set(affected.flatMap((entry) => entry.semantic))],
    exactSemantic:[...new Set(affected.flatMap((entry) => entry.exactSemantic ?? []))],
    verificationConsumers:[...new Set(affected.flatMap((entry) => entry.verificationConsumers))],
    boundary:affected.map(({ boundary }) => boundary).find(Boolean) ?? null,
  });
  const applyAffected = (changedPath, affected, registries = [packs]) => {
    const semanticClosure = expandDependantsAcross(registries, affected.semantic);
    const complete = new Set([
      ...semanticClosure, ...(affected.exactSemantic ?? []), ...affected.verificationConsumers,
    ]);
    const orderedClosure = packs.filter((pack) => complete.has(pack.id) && runnable(pack))
      .map(({ id }) => id);
    const omitted = orderedClosure.filter((id) => !explicit.has(id));
    if (explicit.size && omitted.length) {
      throw new Error(`Changed path ${changedPath} affects ${orderedClosure.join(", ")}, ` +
        `outside the explicit pack set: ${omitted.join(", ")}`);
    }
    for (const id of orderedClosure) selected.add(id);
    changedOwners.set(changedPath, orderedClosure);
    if (affected.boundary) changedBoundaries.set(changedPath, affected.boundary);
  };

  if (forceAll) {
    for (const changedPath of changedPaths) {
      applyAffected(changedPath, {
        semantic:allRunnableIds, exactSemantic:[], verificationConsumers:[], boundary:null,
      });
    }
  } else if (changeSet) {
    for (const entry of changeSet.entries) {
      if (entry.status === "A") {
        applyAffected(entry.path, affectedFor(packs, entry.path));
      } else if (entry.status === "D") {
        applyAffected(entry.path, affectedFor(basePacks, entry.path), [basePacks, packs]);
      } else if (entry.status === "R" || entry.status === "C") {
        applyAffected(entry.oldPath, affectedFor(basePacks, entry.oldPath), [basePacks, packs]);
        applyAffected(entry.newPath, affectedFor(packs, entry.newPath), [packs, basePacks]);
      } else {
        const former = affectedFor(basePacks, entry.path);
        const current = affectedFor(packs, entry.path);
        const formerOwner = ownerOf(basePacks, entry.path)?.id;
        const currentOwner = ownerOf(packs, entry.path)?.id;
        if (formerOwner !== currentOwner) {
          throw new Error(`Conflicting current and historical verification ownership for ${entry.path}: ${formerOwner} -> ${currentOwner}`);
        }
        applyAffected(entry.path, combinedAffected(former, current), [basePacks, packs]);
      }
    }
  } else {
    for (const changedPath of changedPaths) applyAffected(changedPath, affectedFor(packs, changedPath));
  }
  if (terminalFull || withDependencies) selected = expandDependencies(packs, selected);

  const ordered = packs.filter(({ id }) => selected.has(id));
  const runnablePacks = ordered.filter(runnable);
  const executionPacks = shardedPacks(runnablePacks, shard);
  if (!executionPacks.some(runnable)) throw new Error("Verification plan has no runnable checks");

  const preparationTasks = skipBuild ? [] : [commandTask({
    key:"build:dist", stage:"build", executable:"npm", args:["run", "build"],
  })];
  const unitTasks = browserTargetIds.length ? [] : executionPacks.flatMap((pack) => values(pack, "unit").map((path) => commandTask({
    key:`unit:${path}`, stage:"unit", packId:pack.id, executable:"node", args:[path], target:path,
  })));
  const propertyTasks = !browserTargetIds.length && (terminalFull || includeProperties)
    ? executionPacks.flatMap((pack) => values(pack, "property").map((path) => commandTask({
      key:`property:${path}`, stage:"property", packId:pack.id, executable:"node", args:[path], target:path,
    })))
    : [];
  const browserTasks = browserTargetIds.length ? [] : executionPacks.flatMap((pack) => values(pack, "browserAdapters").map((path) => commandTask({
    key:`browser:${path}`, stage:"browser", packId:pack.id, executable:"node", args:[path], target:path,
  })));

  const acceptancePacks = browserTargetIds.length ? [] : executionPacks.filter((pack) => values(pack, "features").length);
  const features = acceptancePacks.flatMap((pack) => values(pack, "features")).sort();
  const acceptance = featureTasks(features, acceptancePacks);
  const executionIds = new Set(executionPacks.map(({ id }) => id));
  const selectedObservations = packs.flatMap((declarationPack) =>
    executionIds.has(declarationPack.id)
      ? values(declarationPack, "browserObservations")
        .filter(({ id }) => !browserTargetIds.length || browserTargetIds.includes(id))
        .map((observation) => ({ declarationPack, observation }))
      : []);
  const selectedTargetIds = new Set(selectedObservations.map(({ observation }) => observation.id));
  for (const id of browserTargetIds) {
    if (!selectedTargetIds.has(id)) throw new Error(`Unknown browser target in selected pack: ${id}`);
  }
  const observationGroups = new Map();
  for (const item of selectedObservations) {
    const { declarationPack, observation } = item;
    const groupKey = observation.sessionBatch
      ? `${declarationPack.id}\0${observation.path}\0${observation.sessionBatch}`
      : `${declarationPack.id}\0${observation.id}`;
    const group = observationGroups.get(groupKey) ?? [];
    group.push(item);
    observationGroups.set(groupKey, group);
  }
  const observationTasks = [...observationGroups.values()].map((group) => {
    const ids = group.map(({ observation }) => observation.id).sort();
    const environment = Object.assign({}, ...group.map(({ observation }) => observation.environment));
    return commandTask({
      key:`browser-observation:${ids.join("+")}`, stage:"browser-observation",
      packId:group[0].declarationPack.id, executable:"node",
      args:["scripts/run-browser-observation.mjs", ...ids], target:ids.join(","), environment,
      logicalTargetIds:ids,
    });
  });
  const mode = browserTargetIds.length ? "focused" : terminalFull ? "terminal" : explicit.size ? "exact" : "impact";
  const checkpointTasks = browserTargetIds.length ? [] : executionPacks.flatMap((pack) => values(pack, "checkpointCommands")
    .filter((checkpoint) => !checkpoint.modes || checkpoint.modes.includes(mode))
    .map((checkpoint) => commandTask({
      key:`checkpoint:${pack.id}:${checkpoint.id}`, stage:"checkpoint", packId:pack.id,
      executable:checkpoint.executable, args:checkpoint.args, target:checkpoint.id,
      environment:checkpoint.environment ?? null,
    })));

  const tasks = [
    ...preparationTasks, ...unitTasks, ...propertyTasks, ...browserTasks, ...observationTasks,
    ...acceptance.parser, ...acceptance.generator, ...checkpointTasks, ...acceptance.sessions,
  ];
  const keys = tasks.map(({ key }) => key);
  if (new Set(keys).size !== keys.length) throw new Error("Verification task identities must be unique");
  if (!tasks.some(({ stage }) => stage !== "build")) throw new Error("Verification plan has no runnable checks");

  const display = (items) => items.map(({ display:command }) => command);
  const stages = {
    build:uniquePackIds(preparationTasks), unit:uniquePackIds(unitTasks),
    property:uniquePackIds(propertyTasks), browser:uniquePackIds(browserTasks),
    browserObservation:uniquePackIds(observationTasks), acceptance:uniquePackIds(acceptance.sessions),
    checkpoint:uniquePackIds(checkpointTasks),
  };
  return {
    version:2,
    mode,
    requestedPackIds:packs.filter(({ id }) => explicit.has(id)).map(({ id }) => id),
    claimPackIds:packs.filter(({ id }) => explicit.has(id)).map(({ id }) => id),
    selectedPackIds:executionPacks.map(({ id }) => id),
    packIds:executionPacks.map(({ id }) => id),
    changedPaths:[...changedPaths].sort(),
    changeSet:changeSet ? structuredClone(changeSet) : null,
    baseCommit:changeSet?.baseCommit ?? null,
    changedOwners:Object.fromEntries([...changedOwners].sort(([left], [right]) => left.localeCompare(right))),
    changedBoundaries:Object.fromEntries([...changedBoundaries].sort(([left], [right]) => left.localeCompare(right))),
    conservativeHistoricalFallbackReason,
    features,
    handlers:acceptancePacks.flatMap((pack) => values(pack, "handlers")),
    shard:shard ?? null,
    includeProperties:Boolean(terminalFull || includeProperties),
    withDependencies:Boolean(withDependencies),
    skipBuild:Boolean(skipBuild),
    stages,
    preparationTasks, unitTasks, propertyTasks, browserTasks, observationTasks,
    parserTasks:acceptance.parser, generatorTasks:acceptance.generator,
    checkpointTasks, sessionTasks:acceptance.sessions, tasks,
    preparationCommands:display(preparationTasks),
    unitCommands:display(unitTasks), propertyCommands:display(propertyTasks),
    browserCommands:display(browserTasks), observationCommands:display(observationTasks),
    parserCommands:display(acceptance.parser), generatorCommands:display(acceptance.generator),
    checkpointCommands:display(checkpointTasks), sessionCommands:display(acceptance.sessions),
    acceptanceCommands:display([...acceptance.parser, ...acceptance.generator, ...acceptance.sessions]),
    commands:display(tasks),
  };
}

async function invoke(task, runCommand) {
  return runCommand(task.display, task);
}

async function runBounded(tasks, concurrency, runCommand) {
  let next = 0;
  const failures = [];
  const workers = Array.from(
    { length:Math.min(Math.max(1, concurrency), tasks.length) },
    async() => {
      while (next < tasks.length) {
        const index = next++;
        try { await invoke(tasks[index], runCommand); }
        catch (error) { failures.push({ task:tasks[index], error }); }
      }
    },
  );
  await Promise.all(workers);
  if (failures.length) {
    throw new AggregateError(
      failures.map(({ error }) => error),
      `Verification failed in ${failures.length} independent command(s): ${failures.map(({ task }) => task.key ?? task.display).join(", ")}`,
    );
  }
}

function legacyTasks(commands, stage) {
  return (commands ?? []).map((display, index) => ({ display, key:`legacy:${stage}:${index}`, stage }));
}

export async function executeAcceptancePlan(
  plan,
  { runCommand, concurrency = 4, observationConcurrency = 2 } = {},
) {
  if (typeof runCommand !== "function") throw new Error("Provide an acceptance command runner");
  if (!plan.unitCommands && !plan.parserCommands) {
    const commands = plan.commands ?? [...(plan.preparationCommands ?? ["npm run build"]), ...plan.acceptanceCommands];
    for (const command of commands) await runCommand(command);
    return;
  }
  const group = (taskKey, commandKey, stage) => plan[taskKey] ?? legacyTasks(plan[commandKey], stage);
  for (const task of group("preparationTasks", "preparationCommands", "build")) await invoke(task, runCommand);
  await runBounded(group("unitTasks", "unitCommands", "unit"), concurrency, runCommand);
  await runBounded(group("propertyTasks", "propertyCommands", "property"), concurrency, runCommand);

  const browserFailures = [];
  for (const task of group("browserTasks", "browserCommands", "browser")) {
    try { await invoke(task, runCommand); }
    catch (error) { browserFailures.push({ task, error }); }
  }
  const observationFailures = [];
  try {
    await runBounded(
      group("observationTasks", "observationCommands", "browser-observation"),
      observationConcurrency,
      runCommand,
    );
  } catch (error) {
    observationFailures.push(error);
  }
  if (browserFailures.length || observationFailures.length) {
    const failedDisplays = browserFailures.map(({ task }) => task.display);
    throw new AggregateError(
      [...browserFailures.map(({ error }) => error), ...observationFailures],
      `Browser verification failed in ${browserFailures.length} adapter(s) and ${observationFailures.length} observation group(s)${failedDisplays.length ? `: ${failedDisplays.join(", ")}` : ""}`,
    );
  }
  await runBounded(group("parserTasks", "parserCommands", "acceptance-parse"), concurrency, runCommand);
  await runBounded(group("generatorTasks", "generatorCommands", "acceptance-generate"), concurrency, runCommand);
  for (const task of group("checkpointTasks", "checkpointCommands", "checkpoint")) await invoke(task, runCommand);
  await runBounded(group("sessionTasks", "sessionCommands", "acceptance-session"), concurrency, runCommand);
}
