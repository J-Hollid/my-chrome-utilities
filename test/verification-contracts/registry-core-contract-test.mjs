import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { focusedAcceptanceOptions } from "../../scripts/run-focused-acceptance.mjs";
import { planVerification } from "../../scripts/verification-planner/tasks/planner.mjs";
import { browserAdapterUsesSharedHarness, loadVerificationPacks, staticallyResolvableModuleImports, validateVerificationPacks } from "../../scripts/verification-registry/validation.mjs";
const exec = (command, args, options = {}) => new Promise((resolve, reject) => {
  execFile(command, args, options, (error, stdout, stderr) => error
    ? reject(new Error(stderr || error.message))
    : resolve(stdout.trim()));
});
const options = focusedAcceptanceOptions([
  "--pack", "capture", "--pack", "schemas", "--changed-since", "base",
  "--prepare-evidence", "task-17", "--property",
]);
let vtd014Evidence = {};
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
const synthetic = [
  pack("alpha", {
    browserObservations:[{
      id:"ALPHA_BROWSER_ADAPTER", path:"test/alpha-browser-test.mjs",
      environment:{ ALPHA_BROWSER_ADAPTER:"1" }, observationKeys:["alpha"],
      features:["features/alpha-one.feature"],
    }],
    checkpointCommands:[{
      id:"alpha-check", executable:"node", args:["acceptance/runtime/alpha.mjs"],
      features:["features/alpha-one.feature"],
    }],
  }),
  pack("beta", { dependencies:["alpha"] }),
  pack("process", {
    source:[], process:["scripts/", "acceptance/src/acceptance/"],
    globalImpact:["acceptance/src/acceptance/pack_session.clj"],
    features:[], handlers:[], unit:["test/process-test.mjs"],
    verificationOnly:{productionOwner:"alpha"},
  }),
  pack("empty", {
    source:[], unit:[], features:[], handlers:[], dependencies:["alpha"],
  }),
];
const feature = planVerification(synthetic, { changedPaths:["features/alpha-one.feature"] });
const syntheticChangeSet = (entries) => ({
  version:1,
  baseCommit:"1".repeat(40),
  commit:"2".repeat(40),
  entries,
  paths:[...new Set(entries.flatMap((entry) => entry.oldPath
    ? [entry.oldPath, entry.newPath]
    : [entry.path]))].sort(),
});
const packs = await loadVerificationPacks();
for (const modulePath of [
  "../../scripts/run-focused-acceptance.mjs",
  "../../scripts/verification-reliability-persistence.mjs",
  "../../scripts/verification-reliability-repair.mjs",
  "../../scripts/verification-reliability-store.mjs",
  "../../scripts/verification-reliability-values.mjs",
]) {
  const source = await readFile(new URL(modulePath, import.meta.url), "utf8");
  assert.doesNotMatch(source, /["'`]Timeout (?:incident|repair)/u,
    `${modulePath} exposes failure-neutral Reliability incident/repair diagnostics`);
}
const adapterModes = new Map(packs.flatMap((pack) => (pack.browserAdapterModes ?? [])
  .map(({ path:adapterPath, mode }) => [adapterPath, mode])));
assert.equal([...adapterModes.values()].filter((mode) => mode === "shared-wrapper").length, 0);
for (const program of [
  "test/browser-packs/side-panel-capture.mjs",
  "test/browser-packs/side-panel-event-library.mjs",
  "test/browser-packs/side-panel-schemas.mjs",
  "test/browser-packs/side-panel-defects.mjs",
  "test/browser-packs/side-panel-shell.mjs",
]) assert.equal(adapterModes.get(program), "integration");
assert.equal(adapterModes.get("test/browser-packs/flow-graph.mjs"), "shared");
assert.equal(adapterModes.get("test/twatility-projects-browser-test.mjs"), "integration");
assert.deepEqual(staticallyResolvableModuleImports([
  'import { wait } from "./shared-harness.mjs";',
  'import "../support/setup.mjs";',
  'export { helper } from "./reexported.mjs";',
  'await import("./literal-wrapper.mjs");',
  'await import(runtimeSelectedModule);',
].join("\n"), "test/browser-packs/example.mjs"), [
  "test/browser-packs/literal-wrapper.mjs",
  "test/browser-packs/reexported.mjs",
  "test/browser-packs/shared-harness.mjs",
  "test/support/setup.mjs",
], "supported static and literal-dynamic module imports must resolve relative to their adapter");
assert.equal(browserAdapterUsesSharedHarness([
  '// import { wait } from "./shared-harness.mjs";',
  'const diagnostic = "shared-harness import(\\\"./shared-harness.mjs\\\")";',
  'const template = `./shared-harness.mjs`;',
].join("\n"), "test/browser-packs/comment-only.mjs"), false,
  "comments, ordinary strings, and templates must not masquerade as a shared-harness import");
assert.equal(browserAdapterUsesSharedHarness(
  'import { wait } from "../browser-packs/./shared-harness.mjs";',
  "test/integration/example.mjs",
), true, "a genuine normalized static harness import must be recognized");
const replacePack = (registry, id, update) => registry.map((candidate) =>
  candidate.id === id ? { ...candidate, ...update(candidate) } : candidate);
await assert.rejects(() => validateVerificationPacks(replacePack(packs, "flow_graph", (pack) => ({
  browserAdapterModes:pack.browserAdapterModes.slice(0, -1),
}))), /Classify every browser adapter/u);
await assert.rejects(() => validateVerificationPacks(replacePack(packs, "flow_graph", (pack) => ({
  browserAdapterModes:pack.browserAdapterModes.map((entry) => entry.path ===
    "test/browser-packs/flow-graph.mjs" ? { ...entry, mode:"integration" } : entry),
}))), /Integration browser adapter must not masquerade as a shared adapter/u,
  "an integration classification must reject an adapter that genuinely imports the shared harness");
await assert.rejects(() => validateVerificationPacks(replacePack(packs, "branding_polish", (pack) => ({
  verificationInputs:[...pack.verificationInputs,
    "src/specification-studio-technical-analyst-guidance.ts"],
}))), /Remove self-owned verification input/u);
await assert.rejects(() => validateVerificationPacks(replacePack(packs, "branding_polish", (pack) => ({
  verificationInputs:[...pack.verificationInputs, ...pack.verificationInputs],
}))), /Declare every verification input once/u);
await assert.rejects(() => validateVerificationPacks(replacePack(packs,
  "selective_profile_inheritance", () => ({
    verificationInputs:["src/commands.ts"],
  }))), /Verification inputs require runnable checks/u);
await assert.rejects(() => validateVerificationPacks(replacePack(packs,
  "branding_polish", () => ({
    verificationInputs:["../outside.md"],
  }))), /exact normalized non-generated verification input/u);
await assert.rejects(() => validateVerificationPacks(replacePack(packs,
  "branding_polish", () => ({
    runtimeInputs:["../outside.css"],
}))), /exact normalized runtime input/u);
await assert.rejects(() => validateVerificationPacks(replacePack(packs,
  "flow_graph", () => ({
    isolatedVerificationHandlers:["acceptance/src/acceptance/steps/not-flow-graph.clj"],
  }))), /Isolate only exact handlers owned by pack flow_graph/u);
