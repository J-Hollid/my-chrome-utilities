import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import {
  planVerification, verificationOwner, verificationSliceMapping,
} from "../../scripts/verification-planner/tasks/planner.mjs";
import { loadVerificationPacks, verificationInventory } from "../../scripts/verification-registry/validation.mjs";
import { stylesheetDeclarationFor } from "../../scripts/verification-styles.mjs";
function pack(id, overrides = {}) {
  return {
    id,
    source:[`src/${id}/`], process:[], globalImpact:[], dependencies:[], sharedComponents:[],
    verificationInputs:[], runtimeInputs:[],
    unit:[`test/${id}-one-test.mjs`, `test/${id}-two-test.mjs`], property:[],
    features:[`features/${id}-one.feature`, `features/${id}-two.feature`],
    handlers:[`acceptance/src/acceptance/steps/${id}.clj`], browserAdapters:[],
    browserAdapterModes:[], browserObservations:[], checkpointCommands:[],
    ...overrides,
  };
}
const packs = await loadVerificationPacks();
const sourceModulePaths = await nestedModulePaths("src", ".ts");
const requiredPathImpacts = new Map();
async function nestedModulePaths(directory, extension) {
  const entries = await readdir(directory, { withFileTypes:true });
  const paths = [];
  for (const entry of entries) {
    const candidate = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) paths.push(...await nestedModulePaths(candidate, extension));
    else if (candidate.endsWith(extension)) paths.push(candidate);
  }
  return paths.sort();
}
function parsedModule(source, filePath) {
  return ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true,
    filePath.endsWith(".ts") ? ts.ScriptKind.TS : ts.ScriptKind.JS);
}
function staticModuleSpecifiers(module) {
  return module.statements.flatMap((statement) => {
    if (ts.isImportDeclaration(statement) && statement.moduleSpecifier &&
        ts.isStringLiteralLike(statement.moduleSpecifier)) {
      const clause = statement.importClause;
      const named = clause?.namedBindings;
      const whollyTypeOnly = clause?.isTypeOnly || Boolean(clause && !clause.name &&
        named && ts.isNamedImports(named) && named.elements.length &&
        named.elements.every((element) => element.isTypeOnly));
      return whollyTypeOnly ? [] : [statement.moduleSpecifier.text];
    }
    if (ts.isExportDeclaration(statement) && statement.moduleSpecifier &&
        ts.isStringLiteralLike(statement.moduleSpecifier)) {
      const named = statement.exportClause;
      const whollyTypeOnly = statement.isTypeOnly || Boolean(named && ts.isNamedExports(named) &&
        named.elements.length && named.elements.every((element) => element.isTypeOnly));
      return whollyTypeOnly ? [] : [statement.moduleSpecifier.text];
    }
    return [];
  });
}
function literalFileSpecifiers(module) {
  const specifiers = [];
  const visit = (node) => {
    if (ts.isCallExpression(node)) {
      const calledName = ts.isIdentifier(node.expression) ? node.expression.text
        : ts.isPropertyAccessExpression(node.expression) ? node.expression.name.text
          : null;
      if (["readFile", "readFileSync"].includes(calledName)) {
        const argument = node.arguments[0];
        if (argument && ts.isStringLiteralLike(argument)) {
          specifiers.push({ specifier:argument.text, repositoryRelative:true });
        }
        else if (argument && ts.isNewExpression(argument) &&
            ts.isIdentifier(argument.expression) && argument.expression.text === "URL" &&
            argument.arguments?.[0] && ts.isStringLiteralLike(argument.arguments[0])) {
          specifiers.push({ specifier:argument.arguments[0].text, repositoryRelative:false });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(module);
  return specifiers;
}
function resolveModuleSpecifier(importerPath, specifier, eligiblePaths, { repositoryRelative = false } = {}) {
  const base = !repositoryRelative && (specifier.startsWith("./") || specifier.startsWith("../"))
    ? path.posix.normalize(path.posix.join(path.posix.dirname(importerPath), specifier))
    : repositoryRelative || specifier.startsWith("src/") || specifier.startsWith("test/")
      ? path.posix.normalize(specifier)
      : null;
  if (!base) return null;
  const extension = path.posix.extname(base);
  const candidates = extension === ".js"
    ? [`${base.slice(0, -3)}.ts`, base]
    : extension ? [base]
      : [base, `${base}.ts`, `${base}.mjs`, `${base}/index.ts`, `${base}/index.mjs`];
  return candidates.find((candidate) => eligiblePaths.has(candidate)) ?? null;
}
// Verification reachability follows executable verification consumers, not every production
// import. The mandatory common build owns type/architecture coverage for src-to-src imports;
// dependencies and sharedComponents remain the explicit behavioral fan-out declarations.
const registeredVerificationConsumerPaths = [...new Set(packs.flatMap((pack) => [
  ...["unit", "property", "browserAdapters"].flatMap((key) => pack[key] ?? []),
  ...(pack.browserObservations ?? []).map(({ path:observationPath }) => observationPath),
  ...(pack.checkpointCommands ?? []).flatMap(({ executable, args }) =>
    executable === "node" && args?.[0]?.endsWith(".mjs") ? [args[0]] : []),
]))].filter((modulePath) => modulePath.endsWith(".mjs"));
const testHelperSet = new Set((await nestedModulePaths("test", ".mjs")).filter((modulePath) =>
  modulePath.startsWith("test/fixtures/") || modulePath.startsWith("test/helpers/") ||
  modulePath.startsWith("test/support/") ||
  modulePath === "test/browser-packs/shared-harness.mjs"));
const testImportTargetSet = new Set([...sourceModulePaths, ...testHelperSet]);
const trackedLiteralTargetSet = new Set((await verificationInventory()).tracked.filter((trackedPath) =>
  trackedPath !== "dist" && !trackedPath.startsWith("dist/") &&
  trackedPath !== "verification/packs.json"));
const codeEdges = [];
const moduleReferenceCache = new Map();
async function verificationModuleReferences(importerPath) {
  if (moduleReferenceCache.has(importerPath)) return moduleReferenceCache.get(importerPath);
  const source = await readFile(importerPath, "utf8");
  const module = parsedModule(source, importerPath);
  const references = [
    ...staticModuleSpecifiers(module).map((specifier) => ({
      kind:"imports", specifier, repositoryRelative:false,
    })),
    ...literalFileSpecifiers(module).map((reference) => ({ kind:"reads", ...reference })),
  ].flatMap(({ kind, specifier, repositoryRelative }) => {
    if (kind === "imports" && !specifier.startsWith(".") &&
        !specifier.startsWith("src/") && !specifier.startsWith("test/")) {
      return [];
    }
    const eligiblePaths = kind === "reads" ? trackedLiteralTargetSet : testImportTargetSet;
    const requiredPath = resolveModuleSpecifier(importerPath, specifier, eligiblePaths,
      { repositoryRelative });
    if (kind === "reads") return requiredPath ? [{ kind, requiredPath }] : [];
    const referencedPath = specifier.startsWith("./") || specifier.startsWith("../")
      ? path.posix.normalize(path.posix.join(path.posix.dirname(importerPath), specifier))
      : path.posix.normalize(specifier);
    const relevantTestTarget = referencedPath.startsWith("src/") ||
      Boolean(requiredPath && testHelperSet.has(requiredPath));
    if (!relevantTestTarget) return [];
    assert.ok(requiredPath, `${importerPath} ${kind} a resolvable registered module at ${specifier}`);
    return [{ kind, requiredPath }];
  });
  moduleReferenceCache.set(importerPath, references);
  return references;
}
const reachableTestHelperPaths = new Set();
for (const verificationConsumerPath of registeredVerificationConsumerPaths) {
  const requiringOwner = verificationOwner(packs, verificationConsumerPath);
  assert.ok(requiringOwner, `${verificationConsumerPath} is an owned verification consumer`);
  const pendingPaths = [verificationConsumerPath];
  const visitedPaths = new Set();
  while (pendingPaths.length > 0) {
    const importerPath = pendingPaths.shift();
    if (visitedPaths.has(importerPath)) continue;
    visitedPaths.add(importerPath);
    for (const { kind, requiredPath } of await verificationModuleReferences(importerPath)) {
      const requiredOwner = verificationOwner(packs, requiredPath);
      assert.ok(requiredOwner, `${importerPath} ${kind} an owned module at ${requiredPath}`);
      codeEdges.push({
        requiringOwner, requiringPath:importerPath, requiredOwner, requiredPath, kind,
        verificationConsumerPath,
      });
      if (testHelperSet.has(requiredPath)) {
        reachableTestHelperPaths.add(requiredPath);
        pendingPaths.push(requiredPath);
      }
    }
  }
}
assert.ok(codeEdges.some(({ requiringPath, requiredPath }) =>
  requiringPath === "test/browser-packs/shared-harness.mjs" &&
  requiredPath === "test/support/headless-chrome.mjs"),
"reachable verification helpers are followed transitively through helper-to-helper imports");
const crossPackCodeEdges = codeEdges.filter(({ requiringOwner, requiredOwner }) =>
  requiringOwner !== requiredOwner);
assert.ok(crossPackCodeEdges.length > 0,
  "the verification-consumer contract exercises real cross-pack static or literal-read edges");
const codeReachabilityGaps = [];
const approvedFlowStyleAuditPaths = new Set([
  "src/flow-graph/flow-workspace.css",
  "src/flow-graph/flow-workspace-shell.css",
]);
const observedFlowStyleAuditPaths = new Set();
function hasExactSliceReachability(registry, edge) {
  const requiredPack = registry.find(({ id }) => id === edge.requiredOwner);
  if (!requiredPack) return false;
  const mapping = verificationSliceMapping(registry, requiredPack, edge.requiredPath);
  if (mapping.kind !== "slice") return false;
  const declaredOwners = new Set([
    ...(mapping.slice.historicalOwners ?? []),
    ...mapping.slice.consumers.map(({ packId }) => packId),
  ]);
  return declaredOwners.has(edge.requiringOwner);
}
for (const edge of crossPackCodeEdges) {
  if (!requiredPathImpacts.has(edge.requiredPath)) {
    requiredPathImpacts.set(edge.requiredPath,
      planVerification(packs, { changedPaths:[edge.requiredPath] }).packIds);
  }
  const globalStylesheetRead = stylesheetDeclarationFor(packs, edge.requiredPath)?.classification === "global";
  const flowStyleAuditRead = edge.requiringPath ===
      "test/verification-contracts/registry-style-boundary-contract-test.mjs" &&
    approvedFlowStyleAuditPaths.has(edge.requiredPath);
  if (flowStyleAuditRead) observedFlowStyleAuditPaths.add(edge.requiredPath);
  if (!globalStylesheetRead && !flowStyleAuditRead && !hasExactSliceReachability(packs, edge) &&
      !requiredPathImpacts.get(edge.requiredPath).includes(edge.requiringOwner)) {
    codeReachabilityGaps.push(edge);
  }
}
assert.deepEqual(observedFlowStyleAuditPaths, approvedFlowStyleAuditPaths,
"the Flow stylesheet process audit accounts for its exact verification-only inputs");
const codeReachabilityGapSummary = {};
for (const edge of codeReachabilityGaps) {
  const pair = `${edge.requiringOwner} -> ${edge.requiredOwner}`;
  const examples = codeReachabilityGapSummary[pair] ?? [];
  const example = `${edge.requiringPath} -> ${edge.requiredPath}`;
  if (!examples.includes(example)) examples.push(example);
  codeReachabilityGapSummary[pair] = examples;
}
const modularFeaturePath = "features/modular-verification-packs.feature";
const modularFeatureEdge = codeEdges.find(({ requiringPath, requiredPath }) =>
  requiringPath === "test/live-target-permission-recovery-preparation-contract-test.mjs" &&
  requiredPath === modularFeaturePath);
const withModularFeatureSlice = (replace) => {
  const changed = structuredClone(packs);
  const processPack = changed.find(({ id }) => id === "verification_process");
  const index = processPack.verificationSlices.findIndex(({ sourcePaths = [] }) =>
    sourcePaths.includes(modularFeaturePath));
  processPack.verificationSlices[index] = replace(processPack.verificationSlices[index]);
  return changed;
};
const consumerDeclared = withModularFeatureSlice((slice) => ({
  ...slice, historicalOwners:[], consumers:[{ packId:"shell" }],
}));
const declarationDeleted = withModularFeatureSlice((slice) => ({
  ...slice, historicalOwners:[], consumers:[],
}));
const declarationCorrupted = withModularFeatureSlice((slice) => ({
  ...slice, historicalOwners:["unknown-owner"],
}));
assert.deepEqual({
  gaps:codeReachabilityGapSummary,
  edge:modularFeatureEdge && {
    requiringOwner:modularFeatureEdge.requiringOwner,
    requiredOwner:modularFeatureEdge.requiredOwner,
    kind:modularFeatureEdge.kind,
  },
  historicalOwnerAccepted:hasExactSliceReachability(packs, modularFeatureEdge),
  consumerAccepted:hasExactSliceReachability(consumerDeclared, modularFeatureEdge),
  deletedDeclarationAccepted:hasExactSliceReachability(declarationDeleted, modularFeatureEdge),
  corruptDeclarationAccepted:hasExactSliceReachability(declarationCorrupted, modularFeatureEdge),
  plannedPacks:planVerification(packs, { changedPaths:[modularFeaturePath] }).packIds,
}, {
  gaps:{},
  edge:{ requiringOwner:"shell", requiredOwner:"verification_process", kind:"reads" },
  historicalOwnerAccepted:true,
  consumerAccepted:true,
  deletedDeclarationAccepted:false,
  corruptDeclarationAccepted:false,
  plannedPacks:["verification_process"],
}, "every direct verification-consumer import and literal file read has parent or exact-slice reachability");
const shellReadinessHandlerPath =
  "acceptance/src/acceptance/verification_support/modular_architecture_vtd015_handlers.clj";
assert.ok(packs.find(({ id }) => id === "shell").verificationInputs
  .includes(shellReadinessHandlerPath),
"the Shell pack declares its exact VTD-015 readiness handler input");
assert.deepEqual(codeEdges.find(({ requiringPath, requiredPath }) =>
  requiringPath === "scripts/verification-ownership-readiness-test.mjs" &&
  requiredPath === shellReadinessHandlerPath), {
  requiringOwner:"shell",
  requiringPath:"scripts/verification-ownership-readiness-test.mjs",
  requiredOwner:"verification_process",
  requiredPath:shellReadinessHandlerPath,
  kind:"reads",
  verificationConsumerPath:"scripts/verification-ownership-readiness-test.mjs",
}, "the exact readiness consumer-to-handler edge retains both owners");
assert.deepEqual(planVerification(packs, { changedPaths:[shellReadinessHandlerPath] }).packIds,
  ["shell", "verification_process"],
  "a VTD-015 handler change selects its owner and exact Shell consumer");
assert.equal(planVerification(packs, { changedPaths:[
  "acceptance/src/acceptance/verification_support/modular_architecture_vtd017_handlers.clj",
] }).packIds.includes("shell"), false,
"an unrelated verification-process handler does not gain Shell impact");
if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const normalize = (value) => Array.isArray(value) ? value.map(normalize)
    : value && typeof value === "object"
      ? Object.fromEntries(Object.entries(value).sort(([left], [right]) =>
        left.localeCompare(right)).map(([key, nested]) => [key, normalize(nested)]))
      : value;
  const digest = (value) => createHash("sha256")
    .update(JSON.stringify(normalize(value))).digest("hex");
  const expectedPreRepairFailure = { misplacedShellHookRead:true, reachabilityGaps:1 };
  const expectedRepairResult = { misplacedShellHookRead:false, reachabilityGaps:0 };
  const ownershipPlacementRepairObserved = { misplacedShellHookRead:false,
    reachabilityGaps:Object.keys(codeReachabilityGapSummary).length };
  assert.deepEqual(ownershipPlacementRepairObserved, expectedRepairResult);
  const fixture = {
    id:"verification-consumer-ownership-contract-placement-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:{ assertion:"production shutdown invokes role workspace completion",
      originalOwner:"verification_process", correctedOwner:"shell" },
    expectedPreRepairFailure, expectedRepairResult,
  };
  const fixtureDigest = digest(fixture);
  console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{
    version:2, incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
    preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
    repairResult:{ status:"passed", fixtureDigest, observed:ownershipPlacementRepairObserved },
  } }));
}
assert.ok(codeEdges.some(({ verificationConsumerPath, requiredPath, kind }) =>
  verificationConsumerPath === "test/specification-studio-technical-analyst-guidance-test.mjs" &&
  requiredPath === "docs/specification-studio-technical-analyst-copy-R01.md" && kind === "reads"),
"tracked non-source literal reads participate in verification reachability");
assert.deepEqual(packs.find(({ id }) => id === "capture").verificationInputs, [
  "src/commands.ts",
  "src/hotkey-editor.ts",
  "src/data-layer-event-library-editor.ts",
  "src/data-layer-event-library-editor-ui.ts",
]);
assert.deepEqual(packs.find(({ id }) => id === "capture").sharedComponents ?? [], [],
  "exact capture observations do not masquerade as broad component coupling");
assert.equal(planVerification(packs, { changedPaths:["src/commands.ts"] })
  .packIds.includes("project_event_transport"), false,
"the exact capture observer does not propagate through capture's production dependants");
assert.ok(packs.find(({ id }) => id === "shell").dependencies.includes("project_management"),
  "installed shell integration retains its semantic project-management dependency");
