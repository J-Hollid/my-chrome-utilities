import { execFile, spawn } from "node:child_process";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { defaultTaskExecutionPrerequisites,
  validateTaskExecutionPrerequisites } from "../verification-execution-prerequisites.mjs";
import {
  stylesheetDeclarations,
  stylesheetQaTargets,
  stylesheetPlanFor,
  stylesheetDeclarationFor,
  validateStylesheetRegistry,
  validateStylesheetDeclarations,
  validateStylesheetOwnership,
} from "../verification-styles.mjs";
export const stylesheetQaTargetIds = stylesheetQaTargets;
export {
  stylesheetDeclarationFor,
  stylesheetPlanFor,
  validateStylesheetDeclarations,
  validateStylesheetOwnership,
} from "../verification-styles.mjs";
import ts from "typescript";
import {sharedBoundaryPlanFor,validateSharedBoundaryDeclarations} from "../verification-shared-boundaries.mjs";
import { isRunnablePack, runnablePackIdsFromRegistry } from
  "../verification-pack-cardinality/contract.mjs";
import { candidateRepositoryPaths } from
  "./candidate-inventory.mjs";
import { loadCompiledVerificationRegistry } from
  "./loader.mjs";
import {
  prefixMatches,
  processPrefixMatches,
  verificationOwnerForPath,
} from "../verification-planner/ownership/resolve.mjs";
import {
  expandVerificationDependencies as expandDependencies,
  expandVerificationDependants as expandDependants,
  expandVerificationDependantsAcross as expandDependantsAcross,
} from "../verification-planner/dependencies/expand.mjs";
export {sharedBoundaryPlanFor,validateSharedBoundaryDeclarations} from "../verification-shared-boundaries.mjs";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));
export const exactOwnedPathKeys = ["unit", "property", "features", "handlers", "browserAdapters"];
export const compatibilityOwnedPathKeys = ["compatibilityTests"];
export const verificationImplementationPathKeys = ["unit", "property", "browserAdapters"];
export const focusedFeaturePolicyPaths = new Set([
  "scripts/verification-granularity-dispositions.mjs",
  "scripts/verification-ownership-readiness.mjs",
  "scripts/settled-final-verification-policy.mjs",
  "scripts/verification-packs.mjs",
  "scripts/verification-reliability-runtime.mjs",
  "scripts/verification-reliability-store.mjs",
  "swarmforge/roles/architect.prompt",
  "swarmforge/roles/coder.prompt",
  "swarmforge/roles/refactorer.prompt",
  "swarmforge/roles/specifier.prompt",
  "verification/granularity-dispositions.json",
]);
export const slicedFocusedFeaturePolicyPaths = new Set([
  "scripts/run-focused-acceptance.mjs",
  "scripts/settled-final-verification.mjs",
  "scripts/settled-final-verification-review.mjs",
  "scripts/verification-evidence.mjs",
  "scripts/verification-reliability-persistence.mjs",
  "scripts/verification-run-intent.mjs",
  "scripts/verification-task-succession.mjs",
]);
const testPathKeys = ["unit", "property", "browserAdapters"];
export const prefixOwnedPathKeys = ["source", "process"];
const reservedTaskEnvironment = new Set([
  "PATH", "NODE_OPTIONS", "MY_CHROME_UTILITIES_DIST_LOCK_HELD",
  "MY_CHROME_UTILITIES_DIST_LOCK_ACCESS",
  "SWARMFORGE_VERIFICATION_RECEIPT", "SWARMFORGE_STRICT_VERIFICATION_RECEIPT",
]);
const allowedSwarmforgeTaskEnvironment = new Set([
  "SWARMFORGE_BUILD_PREPARED", "SWARMFORGE_PACK_RUNNER_OWNS_JS",
]);
export const browserAdapterModeNames = new Set(["shared", "shared-wrapper", "integration", "compatibility"]);
const sharedBrowserHarnessPath = "test/browser-packs/shared-harness.mjs";

export const values = (pack, key) => pack[key] ?? [];
export const canonicalPaths = (paths) => [...new Set(paths)].sort();

export function declaredTaskExecutionPrerequisites(pack, target, stage) {
  const matches = values(pack, "executionPrerequisites")
    .filter(({ path:declaredPath }) => declaredPath === target);
  if (matches.length > 1) {
    throw new Error(`Verification task has duplicate execution prerequisite declarations: ${target}`);
  }
  return matches[0]?.requiredCapabilities ?? defaultTaskExecutionPrerequisites(stage);
}
export function declaredTaskTemporaryPathClass(pack, target, stage) {
  const declaration = values(pack, "executionPrerequisites")
    .find(({ path:declaredPath }) => declaredPath === target);
  return declaration?.temporaryPathClass ??
    (["browser", "browser-observation"].includes(stage) ? "chrome-short" : "workspace");
}

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

export function clojureRequiresNamespace(source, namespace) {
  const withoutStringsOrComments = source.replace(/"(?:\\\\.|[^"\\\\])*"|;[^\n\r]*/gu, " ");
  const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const token = (value) => `(?<![^\\s\\[\\](){}'\`~^@,])${escape(value)}(?![^\\s\\[\\](){}'\`~^@,])`;
  if (new RegExp(token(namespace), "u").test(withoutStringsOrComments)) return true;
  const separator = namespace.lastIndexOf(".");
  if (separator < 1 || separator === namespace.length - 1) return false;
  const prefix = namespace.slice(0, separator);
  const leaf = namespace.slice(separator + 1);
  return new RegExp(
    `\\[\\s*(?:\\^[^\\s\\[\\]]+\\s*)*${token(prefix)}[\\s\\S]*?` +
      `\\[\\s*(?:\\^[^\\s\\[\\]]+\\s*)*${token(leaf)}`,
    "u",
  ).test(withoutStringsOrComments);
}

async function loadedCrossPackStepConsumers(packs) {
  const stdout = await new Promise((resolve, reject) => {
    const child = spawn("bb", ["-m", "acceptance.verification-support.isolated-handler-audit"], {
      cwd:repositoryRoot, stdio:["pipe", "pipe", "pipe"],
    });
    let output = "";
    let diagnostics = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { diagnostics += chunk; });
    child.on("error", reject);
    child.on("close", (status) => status === 0
      ? resolve(output)
      : reject(new Error(diagnostics.trim() || output.trim() || `APS handler audit exited ${status}`)));
    child.stdin.end(JSON.stringify(packs));
  });
  const consumers = JSON.parse(stdout);
  if (!Array.isArray(consumers)) throw new Error("APS isolated-handler audit returned invalid evidence");
  return consumers;
}

export async function loadVerificationPacks() {
  const packs = await loadCompiledVerificationRegistry({ repositoryRoot });
  const { activeVerificationSliceQuarantineIds } = await import("../verification-slice-quarantine.mjs");
  Object.defineProperty(packs, "quarantinedSliceIds", {
    value:await activeVerificationSliceQuarantineIds("HEAD", { repositoryRoot }),
    enumerable:false,
  });
  return packs;
}

async function repositoryPaths(directory, suffix = "") {
  const paths = [];
  let entries;
  try {
    entries = await readdir(new URL(`../../${directory}/`, import.meta.url), {
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
      await access(new URL(`../../${path}`, import.meta.url));
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
    tracked:await candidateRepositoryPaths({ repositoryRoot }),
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
    for (const key of [...exactOwnedPathKeys, ...compatibilityOwnedPathKeys]) {
      for (const path of values(pack, key)) {
        if (owners.has(path)) {
          throw new Error(`Assign every ${key} path to exactly one pack: ${path}`);
        }
        owners.set(path, pack.id);
        try {
          await access(new URL(`../../${path}`, import.meta.url));
        } catch {
          throw new Error(`Correct the missing ${key} path: ${path}`);
        }
      }
    }
    for (const prefix of values(pack, "process")) {
      try {
        await access(new URL(`../../${prefix}`, import.meta.url));
      } catch {
        throw new Error(`Correct the missing process path: ${prefix}`);
      }
    }
  }
}

export function validateDependencies(packs, ids) {
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

const impactBoundarySourceClasses = [
  "core or semantic", "application controller", "browser presentation", "persistence migration",
];

export function validImpactBoundaryShape(boundary, pack) {
  return boundary && !Array.isArray(boundary) &&
    ["id,prefixes,propagateDependants", "id,prefixes,propagateDependants,sourceClass",
      "consumers,id,prefixes,propagateDependants,sourceClass"]
      .includes(Object.keys(boundary).sort().join(",")) &&
    /^[a-z0-9][a-z0-9_-]*$/u.test(boundary.id ?? "") &&
    Array.isArray(boundary.prefixes) && boundary.prefixes.length > 0 &&
    boundary.prefixes.every((prefix) => typeof prefix === "string" && prefix &&
      values(pack, "source").some((owned) =>
        prefixMatches(owned, prefix) || prefixMatches(prefix, owned))) &&
    typeof boundary.propagateDependants === "boolean" &&
    (boundary.consumers === undefined || Array.isArray(boundary.consumers) &&
      new Set(boundary.consumers).size === boundary.consumers.length &&
      boundary.consumers.every((id) => id !== pack.id && typeof id === "string")) &&
    (boundary.sourceClass === undefined || impactBoundarySourceClasses.includes(boundary.sourceClass));
}

function validateImpactBoundaries(packs, sourcePaths, representativePaths = sourcePaths) {
  const ids = new Set();
  for (const pack of packs) {
    if (pack.representativeChangedPath !== undefined &&
        (typeof pack.representativeChangedPath !== "string" ||
          !representativePaths.includes(pack.representativeChangedPath) ||
          ownerOf(packs, pack.representativeChangedPath)?.id !== pack.id)) {
      throw new Error(`Use an exact owned representative changed path in pack ${pack.id}`);
    }
    const boundaries = values(pack, "impactBoundaries");
    for (const boundary of boundaries) {
      if (!validImpactBoundaryShape(boundary, pack) || ids.has(boundary.id)) {
        throw new Error(`Use exact owned impact boundaries in pack ${pack.id}`);
      }
      const unknownConsumers = values(boundary, "consumers")
        .filter((id) => !packs.some((candidate) =>
          candidate.id === id && isRunnablePack(candidate)));
      if (unknownConsumers.length) {
        throw new Error(`Register every impact-boundary consumer for ${boundary.id}: ${unknownConsumers.join(", ")}`);
      }
      ids.add(boundary.id);
    }
    if (!boundaries.length) continue;
    for (const sourcePath of sourcePaths.filter((candidate) => ownerOf(packs, candidate)?.id === pack.id)) {
      const matches = [...boundaries,...values(pack,"sharedBoundaries")].filter((boundary) =>
        boundary.prefixes.some((prefix) => prefixMatches(prefix, sourcePath)));
      if (matches.length !== 1) {
        throw new Error(`Classify source path ${sourcePath} in exactly one impact boundary for pack ${pack.id}`);
      }
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
    if (inputs.length && !isRunnablePack(pack)) {
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

export async function validateIsolatedVerificationHandlers(
  packs,
  {
    readSource = (handler) => readFile(path.join(repositoryRoot, handler), "utf8"),
    findLoadedStepConsumers = loadedCrossPackStepConsumers,
  } = {},
) {
  let loadedStepConsumers;
  try {
    loadedStepConsumers = await findLoadedStepConsumers(packs);
  } catch (error) {
    throw new Error(`Isolation audit fails closed: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!Array.isArray(loadedStepConsumers)) {
    throw new Error("Isolation audit fails closed: parsed consumer evidence is invalid");
  }
  for (const pack of packs) {
    const isolated = values(pack, "isolatedVerificationHandlers");
    if (new Set(isolated).size !== isolated.length ||
        isolated.some((handler) => !values(pack, "handlers").includes(handler))) {
      throw new Error(`Isolate only exact handlers owned by pack ${pack.id}`);
    }
    for (const handler of isolated) {
      const stepConsumer = loadedStepConsumers.find((consumer) => consumer.handler === handler);
      if (stepConsumer) {
        throw new Error(
          `Loaded cross-pack step consumer blocks isolation of ${handler}: ` +
          `${stepConsumer.consumerPack} ${stepConsumer.feature} — ${stepConsumer.step}`,
        );
      }
      const source = await readSource(handler);
      const servedFeatures = [...source.matchAll(/"(features\/[A-Za-z0-9_./-]+\.feature)"/gu)]
        .map((match) => match[1]);
      const ownerFeatures = new Set(values(pack, "features"));
      if (servedFeatures.length === 0 || new Set(servedFeatures).size !== servedFeatures.length ||
          servedFeatures.some((feature) => !ownerFeatures.has(feature))) {
        throw new Error(
          `Owner-only served features are required for isolated handler ${handler} in ${pack.id}`,
        );
      }
      const namespace = handler.replace(/^acceptance\/src\//u, "").replace(/\.clj$/u, "")
        .replaceAll("/", ".").replaceAll("_", "-");
      for (const consumer of packs.filter(({ id }) => id !== pack.id)) {
        for (const consumerHandler of values(consumer, "handlers")) {
          if (consumerHandler === "acceptance/src/acceptance/steps/all.clj") continue;
          const consumerSource = await readSource(consumerHandler);
          if (clojureRequiresNamespace(consumerSource, namespace)) {
            throw new Error(
              `Cross-pack handler consumer blocks isolation of ${handler}: ${consumerHandler}`,
            );
          }
        }
      }
    }
  }
}

async function validateVerificationHelpers(packs, trackedPaths) {
  const knownConsumers = new Set(packs.filter(isRunnablePack).map(({ id }) => id));
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
      const unknownConsumers = declaration.consumers.filter((id) => !knownConsumers.has(id));
      if (unknownConsumers.length) {
        throw new Error(`Register every verification helper consumer for ${declaration.path}: ` +
          unknownConsumers.join(", "));
      }
      declarations.set(declaration.path, { ownerId:owner.id, consumers:[...declaration.consumers].sort() });
    }
  }
  const trackedHelpers = trackedPaths.filter((trackedPath) =>
    trackedPath.startsWith("test/support/") || trackedPath === sharedBrowserHarnessPath);
  for (const helper of trackedHelpers) {
    if (!declarations.has(helper)) {
      throw new Error(`Declare every tracked support helper: ${helper}`);
    }
  }
  const actual = new Map();
  const importedHelpers = async(testPath) => {
    const found = new Set();
    const visit = async(importerPath) => {
      const source = await readFile(path.join(repositoryRoot, importerPath), "utf8");
      for (const importedPath of staticallyResolvableModuleImports(source, importerPath)) {
        const helper = declarations.has(importedPath) ||
          importedPath === sharedBrowserHarnessPath || importedPath.startsWith("test/support/");
        if (!helper) continue;
        if (!declarations.has(importedPath)) {
          throw new Error(`Declare every imported verification helper consumer: ${importedPath}`);
        }
        if (found.has(importedPath)) continue;
        found.add(importedPath);
        await visit(importedPath);
      }
    };
    await visit(testPath);
    return found;
  };
  for (const consumer of packs) {
    const checkpointTestPaths = values(consumer, "checkpointCommands")
      .filter(({ executable, args }) => executable === "node" &&
        typeof args?.[0] === "string" && args[0].startsWith("test/"))
      .map(({ args }) => args[0]);
    const consumerTestPaths = [...new Set([
      ...testPathKeys.flatMap((key) => values(consumer, key)),
      ...checkpointTestPaths,
    ])];
    for (const testPath of consumerTestPaths) {
      for (const helper of await importedHelpers(testPath)) {
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

export function browserObservationSessionBatch(pack, observation) {
  if (observation.sessionBatch) return observation.sessionBatch;
  return values(pack, "browserObservationBatches")
    .find(({ path:program }) => program === observation.path)?.id;
}

const evidenceLeafSegments = (leaf) => typeof leaf === "string" ? leaf.split(".") : leaf;
const evidenceLeafIdentity = (leaf) => JSON.stringify(evidenceLeafSegments(leaf));

export function browserObservationEvidenceLeaves(pack, observation) {
  return values(pack, "browserEvidencePartitions")
    .flatMap(({ targets }) => targets ?? [])
    .find(({ id }) => id === observation.id)?.leaves
    ?.map(evidenceLeafSegments);
}

export function validateBrowserEvidencePartitions(packs) {
  for (const pack of packs) {
    const observations = new Map(values(pack, "browserObservations").map((item) => [item.id, item]));
    const partitions = values(pack, "browserEvidencePartitions");
    const replacedWorkflows = values(pack, "browserAdapterPerformance")
      .filter(({ targetIds }) => Array.isArray(targetIds) && targetIds.length > 0);
    for (const workflow of replacedWorkflows) {
      const matches = partitions.filter(({ path:program, sessionBatch }) =>
        program === workflow.path && sessionBatch === workflow.sessionBatch);
      if (matches.length !== 1) {
        throw new Error(`Replaced browser workflow ${pack.id}:${workflow.path} requires one exact browser evidence partition for batch ${workflow.sessionBatch}`);
      }
    }
    for (const partition of partitions) {
      if (!partition || Array.isArray(partition) || typeof partition.path !== "string" ||
          typeof partition.sessionBatch !== "string" || !partition.sessionBatch.trim() ||
          !Array.isArray(partition.originalLeaves) || !partition.originalLeaves.length ||
          !Array.isArray(partition.targets) || partition.targets.length < 1) {
        throw new Error(`Use an exact browser evidence partition in pack ${pack.id}`);
      }
      const original = partition.originalLeaves.map(evidenceLeafIdentity);
      const assigned = partition.targets.flatMap(({ leaves }) => leaves ?? [])
        .map(evidenceLeafIdentity);
      const targetIds = partition.targets.map(({ id }) => id);
      const validLeaf = (leaf) => {
        const segments = evidenceLeafSegments(leaf);
        return Array.isArray(segments) && segments.length >= 2 &&
          segments.every((segment) => typeof segment === "string" && segment.length > 0);
      };
      if (new Set(targetIds).size !== targetIds.length ||
          targetIds.some((id) => !observations.has(id)) ||
          partition.originalLeaves.some((leaf) => !validLeaf(leaf)) ||
          partition.targets.some(({ leaves }) => !Array.isArray(leaves) || !leaves.length ||
            leaves.some((leaf) => !validLeaf(leaf))) ||
          new Set(original).size !== original.length ||
          new Set(assigned).size !== assigned.length ||
          original.length !== assigned.length ||
          original.some((leaf) => !assigned.includes(leaf))) {
        throw new Error(`Browser evidence partition ${pack.id}:${partition.path} must assign every original assertion leaf exactly once`);
      }
      for (const targetId of targetIds) {
        const observation = observations.get(targetId);
        if (observation.path !== partition.path) {
          throw new Error(`Browser evidence partition target ${targetId} must use program ${partition.path}`);
        }
        if (browserObservationSessionBatch(pack, observation) !== partition.sessionBatch) {
          throw new Error(`Browser evidence partition target ${targetId} must use batch ${partition.sessionBatch}`);
        }
      }
      const declarations = replacedWorkflows.filter(({ path:program, sessionBatch }) =>
        program === partition.path && sessionBatch === partition.sessionBatch);
      if (declarations.length > 1) {
        throw new Error(`Browser evidence partition ${pack.id}:${partition.path} has ambiguous target declarations`);
      }
      if (declarations.length === 1) {
        const declared = declarations[0].targetIds;
        if (declared.length !== targetIds.length || declared.some((id) => !targetIds.includes(id))) {
          throw new Error(`Browser evidence partition ${pack.id}:${partition.path} must match its declared target set`);
        }
      }
    }
  }
}

export function validateBrowserObservationBatches(packs) {
  for (const pack of packs) {
    const batchIds = new Set();
    for (const batch of values(pack, "browserObservationBatches")) {
      if (!batch || Array.isArray(batch) ||
          !/^[a-z0-9][a-z0-9-]*$/u.test(batch.id ?? "") || batchIds.has(batch.id) ||
          typeof batch.path !== "string" || !batch.path ||
          !Number.isInteger(batch.observationCount) || batch.observationCount < 2) {
        throw new Error(`Use exact compatible browser observation batches in pack ${pack.id}`);
      }
      batchIds.add(batch.id);
      const observations = values(pack, "browserObservations")
        .filter(({ path:program }) => program === batch.path);
      if (observations.length !== batch.observationCount ||
          observations.some(({ sessionBatch }) => sessionBatch !== undefined)) {
        throw new Error(`Browser observation batch ${pack.id}:${batch.id} must own exactly ${batch.observationCount} compatible targets`);
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
  const tests = assignedPaths(packs, [...testPathKeys, ...compatibilityOwnedPathKeys]);
  for (const path of inventory.tests) {
    if ((tests.get(path)?.length ?? 0) !== 1) {
      throw new Error(`Assign every test path to exactly one pack: ${path}`);
    }
  }
  for (const key of ["features", "handlers"]) {
    const assigned = new Set(packs.flatMap((pack) => key==="features"?[...values(pack,key),...values(pack,"plannedFeatures")]:values(pack,key)));
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
    const reliabilityPrefixes = new Set();
    for (const declaration of values(pack, "reliabilityBoundaries")) {
      if (!declaration || Array.isArray(declaration) ||
          Object.keys(declaration).sort().join(",") !==
            "boundary,casePrefix,feature,ownership" ||
          !values(pack, "features").includes(declaration.feature) ||
          typeof declaration.casePrefix !== "string" || !declaration.casePrefix ||
          declaration.ownership !== "verification" ||
          declaration.boundary !== "verification-acceptance" ||
          reliabilityPrefixes.has(declaration.casePrefix)) {
        throw new Error(`Use exact unique acceptance reliability boundaries in pack ${pack.id}`);
      }
      reliabilityPrefixes.add(declaration.casePrefix);
    }
    const ownedTestPaths = new Set(testPathKeys.flatMap((key) => values(pack, key)));
    for (const declaration of values(pack, "executionPrerequisites")) {
      if (!declaration || Array.isArray(declaration) ||
          !["path,requiredCapabilities", "path,requiredCapabilities,temporaryPathClass"]
            .includes(Object.keys(declaration).sort().join(",")) ||
          typeof declaration.path !== "string" ||
          !ownedTestPaths.has(declaration.path) ||
          declaration.temporaryPathClass !== undefined &&
            !["workspace", "chrome-short"].includes(declaration.temporaryPathClass)) {
        throw new Error(`Use an exact registered test execution prerequisite in pack ${pack.id}`);
      }
      validateTaskExecutionPrerequisites({ key:`declared:${declaration.path}`, stage:"unit",
        executable:"node", args:[declaration.path],
        requiredCapabilities:declaration.requiredCapabilities });
    }
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
      if (observation.impactBoundaries !== undefined) {
        const knownBoundaries = new Set(values(pack, "impactBoundaries").map(({ id }) => id));
        if (!Array.isArray(observation.impactBoundaries) || !observation.impactBoundaries.length ||
            new Set(observation.impactBoundaries).size !== observation.impactBoundaries.length ||
            observation.impactBoundaries.some((id) => !knownBoundaries.has(id))) {
          throw new Error(`Map browser observation ${observation.id} to exact impact boundaries in pack ${pack.id}`);
        }
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
  runnablePackIdsFromRegistry(packs);
  const ids = new Set();
  for (const pack of packs) {
    if (ids.has(pack.id)) throw new Error(`Verification pack ids must be unique: ${pack.id}`);
    ids.add(pack.id);
  }
  validateSharedBoundaryDeclarations(packs);
  await validateRegisteredPaths(packs);
  validateDependencies(packs, ids);
  validateDeclaredTasks(packs);
  await validateBrowserAdapterModes(packs);
  validateBrowserPerformanceDeclarations(packs);
  validateBrowserObservationBatches(packs);
  validateBrowserEvidencePartitions(packs);
  await validateIsolatedVerificationHandlers(packs);
  const repositoryInventory = { ...await verificationInventory(), ...inventory };
  await validateStylesheetRegistry(packs, {
    repositoryRoot:repositoryRoot,
    packIds:packs.map(({ id }) => id),
    sourcePaths:repositoryInventory.tracked,
  });
  await validateVerificationHelpers(packs, repositoryInventory.tracked);
  validateImpactBoundaries(packs, repositoryInventory.source,
    repositoryInventory.tracked);
  validatePrefixOwnership(packs, repositoryInventory.source, "source");
  validatePrefixOwnership(packs, repositoryInventory.process, "process");
  validateInventoryPaths(packs, repositoryInventory);
  validateTrackedOwnership(packs, repositoryInventory.tracked);
  validateVerificationInputs(packs, repositoryInventory.tracked);
  validateRuntimeInputs(packs, repositoryInventory.tracked);
  return packs;
}

export function ownerOf(packs, path) {
  return verificationOwnerForPath(packs, path);
}

export const stableSliceId = (value) =>
  typeof value === "string" && /^[a-z0-9][a-z0-9_-]*$/u.test(value);
export const uniqueStrings = (items) => Array.isArray(items) &&
  new Set(items).size === items.length &&
  items.every((item) => typeof item === "string" && item.length > 0);


export {
  defaultTaskExecutionPrerequisites, expandDependantsAcross, expandDependencies, isRunnablePack, path,
  prefixMatches, runnablePackIdsFromRegistry, stylesheetDeclarations,
  validateTaskExecutionPrerequisites,
};
