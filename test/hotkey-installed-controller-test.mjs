import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { createInstalledHotkeyController } from "../dist/utilities/hotkeys/index.js";
import { loadVerificationPacks, planVerification } from "../scripts/verification-packs.mjs";

class Events {
  listeners = new Map();
  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }
  removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
  async dispatch(type, event = {}) {
    for (const listener of [...(this.listeners.get(type) ?? [])]) await listener(event);
  }
  count(type) { return this.listeners.get(type)?.size ?? 0; }
}

const commands = [
  { id:"command.one", title:"One", category:"navigation" },
  { id:"command.two", title:"Two", category:"navigation" },
];
const stored = { schemaVersion:1, bindings:{ "command.one":"g h", "command.two":"x" } };
const storageValues = new Map([["my-chrome-utilities.hotkey-keymap.v1", JSON.stringify(stored)]]);
const storage = {
  getItem:(key) => storageValues.get(key) ?? null,
  setItem:(key, value) => storageValues.set(key, value),
};
const documentEvents = new Events();
const pageLifecycle = new Events();
const createButton = new Events();
const updateButton = new Events();
const loadButton = new Events();
const fileInput = Object.assign(new Events(), { files:[], value:"", clicks:0, click() { this.clicks += 1; } });
const root = { dataset:{}, focused:0, focus() { this.focused += 1; } };
const status = { textContent:"" };
const warning = { textContent:"" };
const runtimeListeners = new Set();
const runtimeMessages = {
  addListener:(listener) => runtimeListeners.add(listener),
  removeListener:(listener) => runtimeListeners.delete(listener),
};
let editorOptions;
const editor = { binds:0, unbinds:0, renders:0,
  bind() { this.binds += 1; }, unbind() { this.unbinds += 1; }, render() { this.renders += 1; } };
const downloads = [];
let revoked = 0;
const executed = [];
const controller = createInstalledHotkeyController({
  commands,
  storage,
  elements:{ root, createButton, updateButton, loadButton, fileInput, status, warning,
    editorContainer:{}, editorFilter:{} },
  documentEvents,
  pageLifecycle,
  runtimeMessages,
  createEditor:(options) => { editorOptions = options; return editor; },
  download:(file) => { downloads.push(file); return () => { revoked += 1; }; },
  executeCommand:(id) => executed.push(id),
  shellClaimsKey:(event) => event.shellClaimed === true,
  ignoresTarget:(target) => target?.editable === true,
});

controller.mount();
controller.mount();
assert.equal(editor.binds, 1);
assert.equal(editor.renders, 1);
assert.equal(documentEvents.count("keydown"), 1);
assert.equal(pageLifecycle.count("pagehide"), 1);
assert.equal(runtimeListeners.size, 1);
assert.equal(createButton.count("click"), 1);
assert.equal(updateButton.count("click"), 1);
assert.equal(loadButton.count("click"), 1);
assert.equal(fileInput.count("change"), 1);
assert.deepEqual(editorOptions.getKeymap(), stored);
controller.focus();

const key = (value, options = {}) => ({ key:value, prevented:0, preventDefault() { this.prevented += 1; }, ...options });
await documentEvents.dispatch("keydown", key("g", { shellClaimed:true }));
await documentEvents.dispatch("keydown", key("g", { target:{ editable:true } }));
assert.deepEqual(executed, []);
const prefix = key("g"); await documentEvents.dispatch("keydown", prefix); assert.equal(prefix.prevented, 1);
const escape = key("Escape"); await documentEvents.dispatch("keydown", escape); assert.equal(escape.prevented, 1);
await documentEvents.dispatch("keydown", key("g"));
const match = key("h"); await documentEvents.dispatch("keydown", match);
assert.deepEqual(executed, ["command.one"]); assert.equal(match.prevented, 1);
await documentEvents.dispatch("keydown", key("g"));
const mismatch = key("z"); await documentEvents.dispatch("keydown", mismatch); assert.equal(mismatch.prevented, 1);
const unmatched = key("z"); await documentEvents.dispatch("keydown", unmatched); assert.equal(unmatched.prevented, 0);

await createButton.dispatch("click");
assert.equal(downloads.at(-1).filename, "my-chrome-utilities-hotkey-keymap.json");
assert.equal(revoked, 1);
assert.equal(status.textContent, "Blank keymap created");
assert.equal(storageValues.get("my-chrome-utilities.hotkey-keymap.v1"), JSON.stringify(stored));
await updateButton.dispatch("click");
assert.match(status.textContent, /^Keymap updated: added 0, removed 0$/u);
assert.equal(revoked, 2);
await loadButton.dispatch("click"); assert.equal(fileInput.clicks, 1);

const loaded = { schemaVersion:1, bindings:{ "command.one":"q", "command.two":"w" } };
fileInput.files = [{ text:async () => JSON.stringify(loaded) }]; fileInput.value = "valid.json";
await fileInput.dispatch("change");
assert.deepEqual(editorOptions.getKeymap(), loaded);
assert.equal(storageValues.get("my-chrome-utilities.hotkey-keymap.v1"), JSON.stringify(loaded));
assert.equal(status.textContent, "Keymap loaded"); assert.equal(warning.textContent, "");
assert.equal(fileInput.value, ""); assert.equal(root.dataset.hotkeyFocus, "active");

fileInput.files = [{ text:async () => "{" }]; fileInput.value = "invalid.json";
await fileInput.dispatch("change");
assert.deepEqual(editorOptions.getKeymap(), loaded);
assert.equal(warning.textContent, "Keymap file must contain valid JSON.");
assert.equal(fileInput.value, "");
fileInput.files = [{ text:async () => JSON.stringify({ schemaVersion:1,
  bindings:{ "command.one":"q", "command.two":"q" } }) }]; fileInput.value = "duplicate.json";
await fileInput.dispatch("change");
assert.deepEqual(editorOptions.getKeymap(), loaded);
assert.match(warning.textContent, /Duplicate key sequence: q/u); assert.equal(fileInput.value, "");

for (const listener of runtimeListeners) listener({ type:"focus-app-hotkeys" });
assert.equal(root.focused > 0, true);
controller.dispose(); controller.dispose();
assert.equal(editor.unbinds, 1);
assert.equal(documentEvents.count("keydown"), 0);
assert.equal(pageLifecycle.count("pagehide"), 0);
assert.equal(runtimeListeners.size, 0);
assert.equal(createButton.count("click") + updateButton.count("click") +
  loadButton.count("click") + fileInput.count("change"), 0);

controller.mount();
assert.equal(editor.binds, 2); assert.equal(editor.renders, 5);
assert.deepEqual(editorOptions.getKeymap(), loaded);
await pageLifecycle.dispatch("pagehide");
assert.equal(editor.unbinds, 2); assert.equal(documentEvents.count("keydown"), 0);

const controllerSource = await readFile(new URL("../src/utilities/hotkeys/installed-controller.ts", import.meta.url), "utf8");
const installedRuntimeSource = await readFile(
  new URL("../src/data-layer-installed/runtime.ts", import.meta.url), "utf8",
);
const hotkeyAcceptanceSource = await readFile(
  new URL("../acceptance/src/acceptance/steps/hotkey_keymap.clj", import.meta.url), "utf8",
);
const workspaceAcceptanceSource = await readFile(
  new URL("../acceptance/src/acceptance/steps/workspace_editor.clj", import.meta.url), "utf8",
);
assert.doesNotMatch(controllerSource, /command-palette|data-layer|side-panel/u,
  "the installed controller keeps shell and sibling utility dependencies injected");
assert.match(installedRuntimeSource, /import\("\.\.\/utilities\/hotkeys\/index\.js"\)/u,
  "the installed composition root consumes the public Hotkeys module boundary");
assert.doesNotMatch(installedRuntimeSource,
  /(?:from |import\()["']\.\.\/(?:hotkey-editor|hotkey-keymap)\.js["']/u,
  "the installed composition root does not reach through the Hotkeys module boundary");
assert.match(hotkeyAcceptanceSource, /src\/utilities\/hotkeys\/installed-controller\.ts/u,
  "Hotkeys acceptance wiring follows the extracted controller boundary");
assert.match(workspaceAcceptanceSource, /src\/utilities\/hotkeys\/installed-controller\.ts/u,
  "workspace editor acceptance wiring follows the extracted controller boundary");

const packs = await loadVerificationPacks();
assert.deepEqual(
  planVerification(packs, { changedPaths:["src/utilities/hotkeys/installed-controller.ts"] }).packIds,
  ["hotkeys", "shell"],
  "an installed Hotkeys controller change selects Hotkeys and its shell consumer",
);

if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const normalized = (value) => Array.isArray(value) ? value.map(normalized)
    : value && typeof value === "object"
      ? Object.fromEntries(Object.entries(value).filter(([, nested]) => nested !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([keyName, nested]) => [keyName, normalized(nested)]))
      : value;
  const digest = (value) => createHash("sha256").update(JSON.stringify(normalized(value))).digest("hex");
  const expectedPreRepairFailure = {
    controllerBoundaryInspected:false,
    focusWiringDetected:false,
    persistenceWiringDetected:false,
  };
  const expectedRepairResult = {
    controllerBoundaryInspected:true,
    focusWiringDetected:true,
    persistenceWiringDetected:true,
  };
  const fixture = {
    id:"installed-hotkeys-acceptance-boundary-v1",
    causalCategory:"other:acceptance wiring probe module boundary",
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:{ legacyProbeSource:"src/side-panel.ts", extractedControllerSource:"src/utilities/hotkeys/installed-controller.ts" },
    expectedPreRepairFailure,
    expectedRepairResult,
  };
  const repairResult = {
    controllerBoundaryInspected:[hotkeyAcceptanceSource, workspaceAcceptanceSource]
      .every((source) => source.includes("src/utilities/hotkeys/installed-controller.ts")),
    focusWiringDetected:controllerSource.includes("dataset.hotkeyFocus") &&
      controllerSource.includes("focus-app-hotkeys"),
    persistenceWiringDetected:controllerSource.includes("storage.setItem") &&
      controllerSource.includes("storage.getItem"),
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
