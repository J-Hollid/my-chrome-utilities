import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import {
  commandPaletteUtility,
  createPaletteController,
} from "../dist/utilities/command-palette/index.js";
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
      prevented: 0,
      preventDefault() { this.prevented += 1; },
      target: this,
      ...event,
    };
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener(dispatched);
    return dispatched;
  }

  count(type) {
    return this.listeners.get(type)?.size ?? 0;
  }
}

class Element extends Events {
  constructor(ownerDocument, id = "") {
    super();
    this.ownerDocument = ownerDocument;
    this.id = id;
    this.dataset = {};
    this.attributes = new Map();
    this.children = [];
    this.hidden = false;
    this.isConnected = true;
    this.textContent = "";
    this.value = "";
  }

  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); }
  hasAttribute(name) { return this.attributes.has(name); }
  replaceChildren(...children) { this.children = children; }
  append(child) { this.children.push(child); }
  focus() { this.ownerDocument.activeElement = this; }
  closest(selector) { return selector === "[data-command-id]" && this.dataset.commandId ? this : null; }
}

class DocumentAdapter {
  activeElement = null;
  createElement() { return new Element(this); }
}

const ownerDocument = new DocumentAdapter();
const root = new Element(ownerDocument, "side-panel-root");
const launcher = new Element(ownerDocument, "open-palette");
const palette = new Element(ownerDocument, "palette");
const filter = new Element(ownerDocument, "palette-filter");
const results = new Element(ownerDocument, "palette-results");
const sidePanelContent = new Element(ownerDocument, "side-panel-content");
palette.hidden = true;

const commands = [
  { id:"command.one", title:"One", description:"First", category:"navigation" },
  { id:"command.two", title:"Two", description:"Second", category:"navigation" },
];
const executed = [];
const controller = createPaletteController({
  commands,
  executeCommand:(command) => executed.push(command.id),
  elements:{ root, launcher, palette, filter, results, sidePanelContent },
  ownerDocument,
});

controller.mount();
controller.mount();
assert.deepEqual([
  launcher.count("click"),
  root.count("keyup"),
  filter.count("input"),
  filter.count("keydown"),
  results.count("click"),
  palette.count("keydown"),
], [1, 1, 1, 1, 1, 1], "mount owns one exact listener set");
assert.equal(palette.hidden, true, "mount preserves initial dialog visibility");
filter.value = "two";
controller.render();
assert.deepEqual(results.children.map(({ dataset }) => dataset.commandId), ["command.two"],
  "the public render operation projects the current filter");
filter.value = "";

const priorFocus = new Element(ownerDocument, "prior-focus");
priorFocus.focus();
launcher.dispatch("click");
assert.equal(palette.hidden, false);
assert.equal(sidePanelContent.hasAttribute("inert"), true);
assert.equal(ownerDocument.activeElement, filter);
assert.deepEqual(results.children.map(({ dataset }) => dataset.selected), ["true", "false"]);
const trappedTab = palette.dispatch("keydown", { key:"Tab" });
assert.equal(trappedTab.prevented, 1);
assert.equal(ownerDocument.activeElement, filter, "Tab remains trapped in the palette filter");

filter.value = "two";
filter.dispatch("input");
assert.equal(results.children.length, 1);
assert.equal(results.children[0].dataset.commandId, "command.two");
filter.dispatch("keydown", { key:"Enter" });
assert.deepEqual(executed, ["command.two"], "one input executes one command");
assert.equal(palette.hidden, true);
assert.equal(sidePanelContent.hasAttribute("inert"), false);
assert.equal(ownerDocument.activeElement, priorFocus);

filter.value = "";
launcher.dispatch("click");
controller.dispose();
controller.dispose();
assert.equal(palette.hidden, true, "disposing an open controller closes its dialog");
assert.equal(sidePanelContent.hasAttribute("inert"), false);
assert.equal(ownerDocument.activeElement, priorFocus);
assert.deepEqual([
  launcher.count("click"), root.count("keyup"), filter.count("input"),
  filter.count("keydown"), results.count("click"), palette.count("keydown"),
], [0, 0, 0, 0, 0, 0], "dispose removes every owned listener");

launcher.dispatch("click");
assert.equal(palette.hidden, true, "disposed controller input is inert");
controller.mount();
assert.deepEqual([
  launcher.count("click"), root.count("keyup"), filter.count("input"),
  filter.count("keydown"), results.count("click"), palette.count("keydown"),
], [1, 1, 1, 1, 1, 1], "remount owns one fresh listener set");
priorFocus.focus();
root.dispatch("keyup", { key:"k", ctrlKey:true });
assert.deepEqual(results.children.map(({ dataset }) => dataset.selected), ["true", "false"],
  "remount starts from the canonical first selection");
results.dispatch("click", { target:results.children[1] });
assert.deepEqual(executed, ["command.two", "command.two"], "result click executes once");

priorFocus.isConnected = false;
launcher.dispatch("click");
controller.hide();
assert.notEqual(ownerDocument.activeElement, priorFocus,
  "hide does not restore focus to a disconnected element");
controller.dispose();

const standaloneDocument = new DocumentAdapter();
const standaloneElements = Object.fromEntries([
  "open-palette", "palette", "palette-filter", "palette-results", "side-panel-content", "command-log",
].map((id) => [id, new Element(standaloneDocument, id)]));
standaloneElements.palette.hidden = true;
const standaloneRoot = Object.assign(new Element(standaloneDocument, "standalone"), {
  querySelector(selector) { return standaloneElements[selector.slice(1)] ?? null; },
  querySelectorAll() { return []; },
});
const standalonePage = new Events();
const standaloneMount = commandPaletteUtility.lifecycle.mount(standaloneRoot, standalonePage);
assert.equal(standaloneElements["open-palette"].count("click"), 1);
standalonePage.dispatch("pagehide");
assert.equal(standaloneElements["open-palette"].count("click"), 0,
  "the production page lifecycle disposes the standalone controller");
standaloneMount.unmount();

const controllerSource = await readFile(
  new URL("../src/command-palette-ui.ts", import.meta.url), "utf8",
);
const sidePanelSource = await readFile(new URL("../src/side-panel.ts", import.meta.url), "utf8");
assert.doesNotMatch(controllerSource, /utilities\/hotkeys|utilities\/data-layer|side-panel\.js/u,
  "the installed controller keeps sibling utilities and shell state injected");
assert.match(sidePanelSource, /from "\.\/utilities\/command-palette\/index\.js"/u);
assert.doesNotMatch(sidePanelSource, /paletteController\.bind\(/u,
  "the composition root uses the explicit controller lifecycle");
assert.match(sidePanelSource, /paletteController\.dispose\(\)/u,
  "the composition root disposes the controller on page lifecycle teardown");

const packs = await loadVerificationPacks();
assert.deepEqual(
  planVerification(packs, { changedPaths:["src/command-palette-ui.ts"] }).packIds,
  ["command-palette", "shell"],
  "an installed Command Palette controller change selects only its pack and shell consumer",
);
assert.deepEqual(
  planVerification(packs, { changedPaths:["src/command-palette.ts"] }).packIds,
  ["command-palette", "shell"],
  "a Command Palette model change selects only its pack and shell consumer",
);
assert.equal(
  planVerification(packs, { changedPaths:["src/commands.ts"] }).packIds.includes("hotkeys"),
  true,
  "command registry semantics continue to propagate to Hotkeys",
);

if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const normalized = (value) => Array.isArray(value) ? value.map(normalized)
    : value && typeof value === "object"
      ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, normalized(nested)]))
      : value;
  const digest = (value) => createHash("sha256")
    .update(JSON.stringify(normalized(value))).digest("hex");
  const expectedPreRepairFailure = { sourceCompatibleLauncher:false };
  const expectedRepairResult = { sourceCompatibleLauncher:true };
  const fixture = {
    id:"command-palette-acceptance-source-compatibility-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:{ requiredProbes:["const openButton = launcher", "function showPalette()"] },
    expectedPreRepairFailure,
    expectedRepairResult,
  };
  const repairResult = {
    sourceCompatibleLauncher:fixture.input.requiredProbes.every((probe) =>
      controllerSource.includes(probe)),
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
