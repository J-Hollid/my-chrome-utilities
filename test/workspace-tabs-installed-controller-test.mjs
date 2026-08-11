import assert from "node:assert/strict";
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
const syntax = ts.createSourceFile("src/side-panel.ts", sidePanelSource,
  ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const calledMethods = [];
function visit(node) {
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
    ts.isIdentifier(node.expression.expression) &&
    node.expression.expression.text === "workspaceTabsController") {
    calledMethods.push(node.expression.name.text);
  }
  ts.forEachChild(node, visit);
}
visit(syntax);
assert.doesNotMatch(controllerSource, /command-palette|hotkey|data-layer-|utility-registry|side-panel/u,
  "the controller imports no sibling utility or composition state");
assert.match(sidePanelSource, /createWorkspaceTabsController\(\{/u);
assert.match(sidePanelSource, /pageLifecycle:\s*window/u);
assert.deepEqual(calledMethods.sort(), ["mount", "show"],
  "the composition root retains only controller construction, command routing, and mounting");
assert.doesNotMatch(sidePanelSource, /workspaceTabsController\.(?:bind|dispose|activeTab)/u,
  "workspace cleanup and initial rendering remain controller-owned");

const packs = await loadVerificationPacks();
const shellPlan = planVerification(packs, {
  changedPaths:["src/workspace-tabs-ui.ts"], includeProperties:true,
});
assert.deepEqual(shellPlan.packIds, ["shell"]);
assert.equal(shellPlan.tasks.length, 60);
assert.equal(shellPlan.unitTasks.filter(({ key }) =>
  key === "unit:test/workspace-tabs-installed-controller-test.mjs").length, 1,
"the focused controller unit is registered exactly once");
assert.deepEqual(
  planVerification(packs, { changedPaths:["src/workspace-tabs.ts"] }).packIds,
  ["command-palette", "hotkeys", "shell"],
  "workspace-navigation semantics retain their existing consumers",
);

console.log("workspace tabs installed controller tests passed");
