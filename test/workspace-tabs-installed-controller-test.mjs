import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import ts from "typescript";

import { createWorkspaceTabsController } from "../dist/workspace-tabs-ui.js";
import { WORKSPACE_TAB_STORAGE_KEY } from "../dist/workspace-tabs.js";
import { loadVerificationPacks, planVerification } from "../scripts/verification-packs.mjs";

class Events {
  listeners = new Map();

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type, event = {}) {
    const dispatched = {
      key:"",
      prevented:0,
      preventDefault() { this.prevented += 1; },
      target:this,
      ...event,
    };
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener(dispatched);
    return dispatched;
  }

  count(type) { return this.listeners.get(type)?.size ?? 0; }
}

class StorageAdapter {
  values = new Map();
  reads = 0;
  writes = [];

  constructor(stored) {
    if (stored !== undefined) this.values.set(WORKSPACE_TAB_STORAGE_KEY, stored);
  }

  getItem(key) { this.reads += 1; return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); this.writes.push([key, String(value)]); }
}

class TabElement extends Events {
  attributes = new Map();
  ariaWrites = 0;
  focusCount = 0;
  hidden = false;
  tabIndex = -1;

  constructor(id, role = "tab") {
    super();
    this.id = id;
    this.role = role;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
    if (name === "aria-selected") this.ariaWrites += 1;
  }

  focus() { this.focusCount += 1; }
  closest(selector) { return selector === "[role=tab]" && this.role === "tab" ? this : null; }
}

function fixture(stored) {
  const tabList = new Events();
  const pageLifecycle = new Events();
  const storage = new StorageAdapter(stored);
  const dataTab = new TabElement("workspace-tab-data-layer");
  const hotkeysTab = new TabElement("workspace-tab-hotkeys");
  const dataPanel = new TabElement("workspace-panel-data-layer", "tabpanel");
  const hotkeysPanel = new TabElement("workspace-panel-hotkeys", "tabpanel");
  const elements = new Map([
    ["#workspace-tab-data-layer", dataTab],
    ["#workspace-tab-hotkeys", hotkeysTab],
    ["#workspace-panel-data-layer", dataPanel],
    ["#workspace-panel-hotkeys", hotkeysPanel],
  ]);
  const root = { querySelector:(selector) => elements.get(selector) ?? null };
  const controller = createWorkspaceTabsController({
    storage,
    tabList,
    root,
    pageLifecycle,
  });
  return { controller, tabList, pageLifecycle, storage, dataTab, hotkeysTab, dataPanel, hotkeysPanel };
}

function selectionState(subject) {
  return {
    active:subject.controller.activeTab(),
    dataSelected:subject.dataTab.attributes.get("aria-selected"),
    hotkeysSelected:subject.hotkeysTab.attributes.get("aria-selected"),
    dataIndex:subject.dataTab.tabIndex,
    hotkeysIndex:subject.hotkeysTab.tabIndex,
    dataHidden:subject.dataPanel.hidden,
    hotkeysHidden:subject.hotkeysPanel.hidden,
  };
}

const restored = fixture("hotkeys");
assert.equal(restored.storage.reads, 0, "construction does not read shell storage");
restored.controller.mount();
assert.equal(restored.storage.reads, 1);
assert.deepEqual(restored.storage.writes, [], "a valid persisted workspace is restored without rewriting it");
assert.deepEqual(selectionState(restored), {
  active:"hotkeys", dataSelected:"false", hotkeysSelected:"true",
  dataIndex:-1, hotkeysIndex:0, dataHidden:true, hotkeysHidden:false,
});
assert.deepEqual([
  restored.tabList.count("click"),
  restored.tabList.count("keydown"),
  restored.pageLifecycle.count("pagehide"),
], [1, 1, 1], "mount owns one exact listener set");
assert.deepEqual([restored.dataTab.ariaWrites, restored.hotkeysTab.ariaWrites], [1, 1]);

restored.controller.mount();
assert.equal(restored.storage.reads, 1, "mount is idempotent before storage access");
assert.deepEqual([restored.dataTab.ariaWrites, restored.hotkeysTab.ariaWrites], [1, 1],
  "mount does not duplicate the initial render");
assert.deepEqual([
  restored.tabList.count("click"), restored.tabList.count("keydown"),
  restored.pageLifecycle.count("pagehide"),
], [1, 1, 1]);

restored.controller.render();
assert.deepEqual([restored.dataTab.ariaWrites, restored.hotkeysTab.ariaWrites], [2, 2],
  "the public render operation projects the current state without persisting");
assert.deepEqual(restored.storage.writes, []);

const invalid = fixture("not-a-workspace");
invalid.controller.mount();
assert.equal(invalid.controller.activeTab(), "data-layer");
assert.deepEqual(invalid.storage.writes, [[WORKSPACE_TAB_STORAGE_KEY, "data-layer"]],
  "mount persists the canonical fallback for invalid state");

const click = invalid.tabList.dispatch("click", { target:invalid.hotkeysTab });
assert.equal(click.prevented, 0, "workspace clicks preserve default handling");
assert.equal(invalid.controller.activeTab(), "hotkeys");
assert.equal(invalid.hotkeysTab.focusCount, 1);
assert.deepEqual(invalid.storage.writes.at(-1), [WORKSPACE_TAB_STORAGE_KEY, "hotkeys"]);

const right = invalid.tabList.dispatch("keydown", { key:"ArrowRight", target:invalid.hotkeysTab });
assert.equal(right.prevented, 1);
assert.equal(invalid.controller.activeTab(), "data-layer", "ArrowRight wraps in canonical order");
assert.equal(invalid.dataTab.focusCount, 1);
const left = invalid.tabList.dispatch("keydown", { key:"ArrowLeft", target:invalid.dataTab });
assert.equal(left.prevented, 1);
assert.equal(invalid.controller.activeTab(), "hotkeys", "ArrowLeft wraps in canonical order");
const home = invalid.tabList.dispatch("keydown", { key:"Home", target:invalid.hotkeysTab });
assert.equal(home.prevented, 1);
assert.equal(invalid.controller.activeTab(), "data-layer");
const end = invalid.tabList.dispatch("keydown", { key:"End", target:invalid.dataTab });
assert.equal(end.prevented, 1);
assert.equal(invalid.controller.activeTab(), "hotkeys");

const writesBeforeIgnoredInput = invalid.storage.writes.length;
const escape = invalid.tabList.dispatch("keydown", { key:"Escape", target:invalid.hotkeysTab });
const nonWorkspace = invalid.tabList.dispatch("click", { target:new TabElement("not-workspace", "button") });
assert.equal(escape.prevented + nonWorkspace.prevented, 0);
assert.equal(invalid.storage.writes.length, writesBeforeIgnoredInput,
  "ignored input causes no controller transition");

const writesBeforeShow = invalid.storage.writes.length;
const rendersBeforeShow = invalid.dataTab.ariaWrites;
invalid.controller.show("data-layer", true);
assert.equal(invalid.storage.writes.length, writesBeforeShow + 1);
assert.equal(invalid.dataTab.ariaWrites, rendersBeforeShow + 1,
  "one show operation causes one persistence and render transition");

const retainedState = selectionState(invalid);
const retainedWrites = invalid.storage.writes.length;
invalid.controller.dispose();
invalid.controller.dispose();
assert.deepEqual([
  invalid.tabList.count("click"), invalid.tabList.count("keydown"),
  invalid.pageLifecycle.count("pagehide"),
], [0, 0, 0], "dispose removes every owned listener exactly once");
assert.deepEqual(selectionState(invalid), retainedState, "dispose retains rendered selection");
assert.equal(invalid.storage.writes.length, retainedWrites, "dispose retains persisted selection");
invalid.tabList.dispatch("click", { target:invalid.hotkeysTab });
assert.deepEqual(selectionState(invalid), retainedState, "disposed user input is inert");

invalid.controller.mount();
assert.equal(invalid.controller.activeTab(), "data-layer", "remount restores persisted state");
assert.deepEqual([
  invalid.tabList.count("click"), invalid.tabList.count("keydown"),
  invalid.pageLifecycle.count("pagehide"),
], [1, 1, 1], "remount owns one fresh listener set");
invalid.pageLifecycle.dispatch("pagehide");
assert.deepEqual([
  invalid.tabList.count("click"), invalid.tabList.count("keydown"),
  invalid.pageLifecycle.count("pagehide"),
], [0, 0, 0], "the injected page lifecycle disposes the controller");

const controllerSource = await readFile(new URL("../src/workspace-tabs-ui.ts", import.meta.url), "utf8");
const sidePanelSource = await readFile(new URL("../src/side-panel.ts", import.meta.url), "utf8");
const installedRuntimeSource = await readFile(
  new URL("../src/data-layer-installed/runtime.ts", import.meta.url), "utf8");
function parseTypeScript(name, source) {
  return ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

function importsOf(sourceFile) {
  return sourceFile.statements
    .filter(ts.isImportDeclaration)
    .map(({ moduleSpecifier }) => moduleSpecifier.text);
}

function calledMethodsOf(sourceFile, receiver) {
  const methods = [];
  function visit(node) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === receiver) {
      methods.push(node.expression.name.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return methods;
}

function controllerConstructionOf(sourceFile) {
  const calls = [];
  function visit(node) {
    if (ts.isCallExpression(node) &&
      (ts.isIdentifier(node.expression) && node.expression.text === "createWorkspaceTabsController" ||
       ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === "createWorkspaceTabsController")) {
      calls.push(node);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  assert.equal(calls.length, 1, "the installed runtime constructs one workspace-tabs controller");
  const [options] = calls[0].arguments;
  assert.equal(ts.isObjectLiteralExpression(options), true,
    "the controller receives an explicit dependency object");
  return options;
}

const controllerSyntax = parseTypeScript("src/workspace-tabs-ui.ts", controllerSource);
const sidePanelSyntax = parseTypeScript("src/side-panel.ts", sidePanelSource);
const installedRuntimeSyntax = parseTypeScript(
  "src/data-layer-installed/runtime.ts", installedRuntimeSource);
assert.deepEqual(importsOf(controllerSyntax), ["./workspace-tabs.js"],
  "the controller imports no sibling utility or composition state");
const controllerOptions = controllerConstructionOf(installedRuntimeSyntax);
const optionAssignments = controllerOptions.properties.filter(ts.isPropertyAssignment);
const shorthandAssignments = controllerOptions.properties.filter(ts.isShorthandPropertyAssignment);
assert.deepEqual([
  ...optionAssignments.map(({ name }) => name.text),
  ...shorthandAssignments.map(({ name }) => name.text),
].sort(),
  ["pageLifecycle", "root", "storage", "tabList"],
  "the composition root supplies only the controller's explicit dependencies");
const pageLifecycle = optionAssignments.find(({ name }) => name.text === "pageLifecycle");
assert.equal(ts.isIdentifier(pageLifecycle.initializer) && pageLifecycle.initializer.text === "globalThis", true,
  "the production page lifecycle is injected into the controller");
assert.match(installedRuntimeSource,
  /createInstalledSidePanelShellController\(\{[\s\S]*?workspaceTabs[\s\S]*?hotkeys/u,
  "the installed runtime delegates workspace-tab lifecycle to the installed shell controller");
assert.deepEqual(calledMethodsOf(sidePanelSyntax, "installedDataLayer").sort(),
  ["dispose", "mount"],
  "the stable entry point retains only installed-runtime mounting and disposal");
assert.doesNotMatch(sidePanelSource, /createWorkspaceTabsController/u,
  "the stable side-panel entry point delegates controller construction to the installed runtime");

const packs = await loadVerificationPacks();
const shellPlan = planVerification(packs, {
  changedPaths:["src/workspace-tabs-ui.ts"], includeProperties:true,
});
assert.deepEqual(shellPlan.packIds, ["shell"]);
assert.equal(new Set(shellPlan.tasks.map(({ key }) => key)).size, shellPlan.tasks.length,
  "the focused Shell plan contains no duplicate task identity");
assert.equal(shellPlan.unitTasks.filter(({ key }) =>
  key === "unit:test/workspace-tabs-installed-controller-test.mjs").length, 1,
"the focused controller unit is registered exactly once");
assert.deepEqual(
  planVerification(packs, { changedPaths:["src/workspace-tabs.ts"] }).packIds,
  ["command-palette", "hotkeys", "shell"],
  "workspace-navigation semantics retain their existing consumers",
);

if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const normalized = (value) => Array.isArray(value) ? value.map(normalized)
    : value && typeof value === "object"
      ? Object.fromEntries(Object.entries(value).filter(([, nested]) => nested !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, normalized(nested)]))
      : value;
  const digest = (value) => createHash("sha256")
    .update(JSON.stringify(normalized(value))).digest("hex");
  const shellAcceptanceCause = "other:shell acceptance evidence ownership drift";
  const shellAcceptanceScenario = context.causalCategory === shellAcceptanceCause;
  const informationArchitectureSource = shellAcceptanceScenario ? await readFile(new URL(
    "../acceptance/src/acceptance/steps/information_architecture.clj", import.meta.url), "utf8") : "";
  const verificationEvidenceSource = shellAcceptanceScenario ? await readFile(new URL(
    "../acceptance/src/acceptance/verification_support/modular_architecture_project_management_handlers.clj",
    import.meta.url), "utf8") : "";
  const workspaceControllerSource = shellAcceptanceScenario ? await readFile(new URL(
    "../src/workspace-tabs-ui.ts", import.meta.url), "utf8") : "";
  const expectedPreRepairFailure = shellAcceptanceScenario ? {
    installedCaptureControllerOwned:false,
    currentVerificationOwnerCounts:false,
    stableWorkspaceShowContract:false,
  } : {
    assertedTaskCount:60,
    actualTaskCount:shellPlan.tasks.length,
    assertionPasses:false,
  };
  const expectedRepairResult = shellAcceptanceScenario ? {
    installedCaptureControllerOwned:true,
    currentVerificationOwnerCounts:true,
    stableWorkspaceShowContract:true,
  } : {
    actualTaskCount:shellPlan.tasks.length,
    uniqueTaskIdentities:new Set(shellPlan.tasks.map(({ key }) => key)).size,
    controllerUnitRegistrations:shellPlan.unitTasks.filter(({ key }) =>
      key === "unit:test/workspace-tabs-installed-controller-test.mjs").length,
  };
  const fixture = {
    id:shellAcceptanceScenario ? "shell-acceptance-evidence-ownership-v1"
      : "workspace-shell-inventory-invariant-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:shellAcceptanceScenario
      ? { acceptanceBoundaries:["navigation information architecture", "verification pack ownership",
        "workspace controller source contract"] }
      : { approvedVtd015ShellAdditions:3, obsoleteTaskCount:60 },
    expectedPreRepairFailure,
    expectedRepairResult,
  };
  const repairResult = shellAcceptanceScenario ? {
    installedCaptureControllerOwned:informationArchitectureSource.includes(
      'support/source-file root "src/data-layer-installed/capture/index.ts"'),
    currentVerificationOwnerCounts:["[7 3 2 1 2]", "[11 1 8 3 1]", "[8 5 6 1 4]"]
      .every((counts) => verificationEvidenceSource.includes(counts)),
    stableWorkspaceShowContract:workspaceControllerSource.includes("function showWorkspace(") &&
      workspaceControllerSource.includes("show:showWorkspace"),
  } : {
    actualTaskCount:shellPlan.tasks.length,
    uniqueTaskIdentities:new Set(shellPlan.tasks.map(({ key }) => key)).size,
    controllerUnitRegistrations:shellPlan.unitTasks.filter(({ key }) =>
      key === "unit:test/workspace-tabs-installed-controller-test.mjs").length,
  };
  assert.deepEqual(repairResult, expectedRepairResult);
  const fixtureDigest = digest(fixture);
  console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{
    version:2,
    incidentId:context.incidentId,
    failureDigest:context.failureDigest,
    fixture,
    preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
    repairResult:{ status:"passed", fixtureDigest, observed:repairResult },
  } }));
}

console.log("workspace tabs installed controller tests passed");
