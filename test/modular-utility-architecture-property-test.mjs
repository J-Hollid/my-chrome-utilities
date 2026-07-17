import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { architectureViolations } from "../scripts/check-architecture.mjs";
import { planVerification } from "../scripts/verification-packs.mjs";
import { composeUtilityShell } from "../dist/utility-registry.js";
import { commandsForUtilityShell } from "../dist/utilities/command-palette/index.js";
import { bindUtilityPanels, mountUtility, renderUtilityDirectory } from "../dist/platform/utility-shell-dom.js";
import { createDomUtilityLifecycle } from "../dist/platform/utility-lifecycle-dom.js";
import {
  retainControlledElement,
  retainUtilityElement,
  utilityDomScopeFromSearch,
} from "../dist/platform/utility-dom-isolation.js";
import { shellRuntimeCapabilities } from "../dist/platform/shell-runtime-capabilities.js";
import { createUtilityStorage } from "../dist/platform/utility-storage.js";
import { mountDataLayerNavigation } from "../dist/utilities/data-layer/layers/browser/navigation.js";

const closure = (packs, initial, direction) => {
  const selected = new Set(initial);
  let changed = true;
  while (changed) {
    changed = false;
    for (const pack of packs) {
      const additions = direction === "dependencies"
        ? selected.has(pack.id) ? pack.dependencies : []
        : pack.dependencies.some((id) => selected.has(id)) ? [pack.id] : [];
      for (const id of additions) if (!selected.has(id)) { selected.add(id); changed = true; }
    }
  }
  return selected;
};

const declaredBoundaries = JSON.parse(await readFile(
  new URL("../architecture/data-layer-boundaries.json", import.meta.url),
  "utf8",
));
const importSource = (target) => `import "./${target.slice("src/".length).replace(/\.ts$/, ".js")}";`;
const declaredContracts = Object.entries(declaredBoundaries).flatMap(([file, boundary]) =>
  (boundary.contracts ?? []).map((target) => ({ file, target }))
);
for (const { file, target } of declaredContracts) {
  assert.deepEqual(architectureViolations(new Map([[file, importSource(target)]])), []);
}

const directCrossModulePairs = Object.entries(declaredBoundaries).flatMap(([file, boundary]) =>
  Object.entries(declaredBoundaries)
    .filter(([target, targetBoundary]) =>
      boundary.layer === targetBoundary.layer &&
      boundary.module !== targetBoundary.module &&
      !(boundary.contracts ?? []).includes(target)
    )
    .map(([target]) => ({ file, target }))
).slice(0, 100);
assert.equal(directCrossModulePairs.length, 100);
for (const { file, target } of directCrossModulePairs) {
  assert.deepEqual(architectureViolations(new Map([[file, importSource(target)]])), [{
    file,
    dependency:`./${target.slice("src/".length).replace(/\.ts$/, ".js")}`,
    reason:"cross-module import must use the module public API",
  }]);
}

const modules = ["capture", "live-inspection", "event-library", "schemas", "defect-reporting", "replay"];
const undeclaredContractPairs = Object.entries(declaredBoundaries).flatMap(([file, boundary]) =>
  modules
    .filter((module) => module !== boundary.module)
    .map((module) => ({ file, target:`src/utilities/data-layer/${module}.ts` }))
    .filter(({ target }) => !(boundary.contracts ?? []).includes(target))
).slice(0, 100);
assert.equal(undeclaredContractPairs.length, 100);
for (const { file, target } of undeclaredContractPairs) {
  assert.deepEqual(architectureViolations(new Map([[file, importSource(target)]])), [{
    file,
    dependency:`./${target.slice("src/".length).replace(/\.ts$/, ".js")}`,
    reason:"cross-module import requires a declared contract",
  }]);
}

for (let sample = 0; sample < 100; sample += 1) {
  const file = `src/data-layer-unclassified-${sample}.ts`;
  const source = "export function typeOf(document){ return document.type; }";
  assert.deepEqual(architectureViolations(new Map([[file, source]])), [{
    file,
    dependency:"architecture/data-layer-boundaries.json",
    reason:"data-layer file must declare its module and layer",
  }]);
}

for (let sample = 0; sample < 100; sample += 1) {
  const ids = Array.from({ length:1 + sample % 8 }, (_, index) => `controlled-${sample}-${index}`);
  const availableIds = new Set(ids);
  assert.equal(retainControlledElement(ids.join(" "), availableIds), true,
    "controls must remain when every referenced target exists");
  assert.equal(retainControlledElement(`${ids.join(" ")} missing-${sample}`, availableIds), false,
    "controls must be removed when any referenced target is absent");
  assert.equal(retainControlledElement(null, availableIds), true,
    "elements without a control relationship must remain");
}

for (let sample = 0; sample < 100; sample += 1) {
  const enabled = Array.from({ length:6 }, (_, bit) => Boolean(sample & (1 << bit)));
  const listener = (available) => ({ addListener:available ? () => {} : undefined });
  const runtime = {
    runtime:{ onMessage:listener(enabled[0]) },
    tabs:{
      query:enabled[1] ? () => {} : undefined,
      onUpdated:listener(enabled[2]),
      onRemoved:listener(enabled[3]),
    },
    permissions:{ onRemoved:listener(enabled[4]) },
    scripting:{ executeScript:enabled[5] ? () => {} : undefined },
  };
  const expected = [
    enabled[0] && "runtime.messaging",
    enabled[1] && "tabs.query",
    enabled[2] && enabled[3] && "tabs.lifecycle",
    enabled[4] && "permissions.lifecycle",
    enabled[5] && "scripting.execute",
  ].filter(Boolean);
  assert.deepEqual(shellRuntimeCapabilities(runtime), expected,
    "shell capabilities must include exactly the callable runtime APIs in stable order");
}

for (let sample = 0; sample < 100; sample += 1) {
  const scope = {
    utilityId:`isolation-owner-${sample % 7}`,
    panelIds:Array.from({ length:1 + sample % 5 }, (_, index) => `isolation-panel-${sample}-${index}`),
  };
  const candidates = [
    ...scope.panelIds.map((id) => ({ id, owner:scope.utilityId, expected:true })),
    { id:scope.panelIds[0], owner:`other-owner-${sample}`, expected:false },
    { id:`other-panel-${sample}`, owner:scope.utilityId, expected:false },
    { id:scope.panelIds[0], owner:undefined, expected:false },
  ];

  for (const { id, owner, expected } of candidates) {
    assert.equal(retainUtilityElement({ id, owner }, scope), expected,
      "DOM isolation must retain exactly the panels owned by its utility scope");
  }

  const removeSelectors = Array.from(
    { length:sample % 4 },
    (_, index) => `#excluded-${sample}-${index} > [data-kind="${index}"]`,
  );
  const parameters = new URLSearchParams({ utility:scope.utilityId });
  for (const panelId of scope.panelIds) parameters.append("panel", panelId);
  for (const selector of removeSelectors) parameters.append("remove", selector);
  assert.deepEqual(utilityDomScopeFromSearch(`?${parameters}`), {
    ...scope,
    ...(removeSelectors.length > 0 ? { removeSelectors } : {}),
  }, "utility scopes must survive URL encoding and parsing");
}

for (let sample = 0; sample < 100; sample += 1) {
  const count = 2 + sample % 9;
  const packs = Array.from({ length:count }, (_, index) => ({
    id:`pack-${index}`,
    source:[`src/generated-${sample}/pack-${index}`],
    dependencies:Array.from({ length:index }, (_, dependency) => dependency)
      .filter((dependency) => (sample + index + dependency) % 3 === 0)
      .map((dependency) => `pack-${dependency}`),
    unit:[`test/unit-${sample}-${index}.mjs`],
    property:[`test/property-${sample}-${index}.mjs`],
    features:Array.from(
      { length:1 + (sample + index) % 3 },
      (_, featureIndex) => `features/feature-${sample}-${index}-${featureIndex}.feature`,
    ),
    handlers:[`acceptance/handler-${sample}-${index}.clj`],
    browserAdapters:[`test/browser-${sample}-${index}.mjs`],
  }));
  const ownerIndex = sample % count;
  const changedPath = `${packs[ownerIndex].source[0]}/implementation.ts`;
  const dependantClosure = closure(packs, [packs[ownerIndex].id], "dependants");
  const expected = closure(packs, dependantClosure, "dependencies");
  const plan = planVerification(packs, { changedPaths:[changedPath] });

  assert.deepEqual(plan.packIds, packs.filter(({ id }) => expected.has(id)).map(({ id }) => id),
    "generated impact plans must include transitive dependants and dependencies in registry order");
  assert.deepEqual(plan.handlers,
    packs.filter(({ id }) => expected.has(id)).flatMap(({ handlers }) => handlers),
    "generated impact plans must preserve handler ownership across the selected closure");
  assert.equal(plan.commands[0], "npm run build");
  assert.equal(plan.commands.filter((command) => command === "npm run build").length, 1,
    "generated plans must compile exactly once");
  assert.equal(new Set(plan.commands).size, plan.commands.length,
    "generated plans must schedule each command once");
  assert.deepEqual(plan.features, packs.filter(({ id }) => expected.has(id)).flatMap(({ features }) => features).sort());
  const parseCommands = plan.commands.filter((command) => command.startsWith("bb gherkin-parser "));
  const generateCommands = plan.commands.filter((command) => command.startsWith("bb acceptance-entrypoint-generator "));
  const executeCommands = plan.commands.filter((command) => command.includes("_acceptance_test.clj "));
  assert.equal(parseCommands.length, plan.features.length);
  assert.equal(generateCommands.length, plan.features.length);
  assert.equal(executeCommands.length, expected.size,
    "generated plans must schedule one acceptance session per selected pack");
  for (const feature of plan.features) {
    const generated = `${feature.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-+|-+$)/g, "")}_acceptance_test.clj`;
    assert.equal(executeCommands.filter((command) => command.includes(generated)).length, 1,
      "each generated entry point must belong to exactly one acceptance session");
  }
  assert.ok(plan.commands.indexOf(parseCommands.at(-1)) < plan.commands.indexOf(generateCommands[0]));
  assert.ok(plan.commands.indexOf(generateCommands.at(-1)) < plan.commands.indexOf(executeCommands[0]));

  const changedFeature = packs[ownerIndex].features[0];
  const featurePlan = planVerification(packs, { changedPaths:[changedFeature] });
  assert.deepEqual(featurePlan.features, [changedFeature]);
  assert.deepEqual(featurePlan.handlers, packs[ownerIndex].handlers);

  const full = planVerification(packs, { terminalFull:true });
  assert.deepEqual(full.packIds, packs.map(({ id }) => id),
    "terminal plans must retain every generated pack in registry order");
  assert.throws(() => planVerification(packs, { changedPaths:[`src/unowned-${sample}.ts`] }),
    /Assign every source path to one pack/);
}

for (let sample = 0; sample < 100; sample += 1) {
  const count = 1 + sample % 12;
  const calls = [];
  const utilities = Array.from({ length:count }, (_, index) => ({
    id:`utility-${sample}-${index}`,
    identity:{ name:`Utility ${index}`, description:"Generated lifecycle utility" },
    commands:[],
    panels:[],
    lifecycle:{
      activate(){ calls.push(`activate:${index}`); },
      deactivate(){ calls.push(`deactivate:${index}`); },
    },
    storage:{ namespace:`property.${sample}.${index}`, version:1 },
  }));
  const shell = composeUtilityShell(utilities);
  const ids = utilities.map(({ id }) => id);

  assert.deepEqual(shell.activate(), ids);
  assert.deepEqual(shell.activate(), ids, "generated utility activation must be idempotent");
  shell.deactivate();
  shell.deactivate();
  assert.deepEqual(calls, [
    ...utilities.map((_, index) => `activate:${index}`),
    ...utilities.map((_, index) => `deactivate:${count - index - 1}`),
  ], "generated utilities must deactivate once in reverse activation order");
}

for (let sample = 0; sample < 100; sample += 1) {
  const count = 2 + sample % 11;
  const failureIndex = sample % count;
  const calls = [];
  const utilities = Array.from({ length:count }, (_, index) => ({
    id:`rollback-${sample}-${index}`,
    identity:{ name:`Rollback ${index}`, description:"Generated rollback utility" },
    commands:[],
    panels:[],
    lifecycle:{
      activate(){
        calls.push(`activate:${index}`);
        if (index === failureIndex) throw new Error(`failure:${index}`);
      },
      deactivate(){ calls.push(`deactivate:${index}`); },
    },
    storage:{ namespace:`rollback.${sample}.${index}`, version:1 },
  }));
  const shell = composeUtilityShell(utilities);

  assert.throws(() => shell.activate(), new RegExp(`failure:${failureIndex}`));
  assert.deepEqual(calls, [
    ...utilities.slice(0, failureIndex + 1).map((_, index) => `activate:${index}`),
    ...utilities.slice(0, failureIndex).map((_, index) => `deactivate:${failureIndex - index - 1}`),
  ], "failed activation must roll back only previously activated utilities in reverse order");
  shell.deactivate();
  assert.equal(calls.filter((call) => call.startsWith("deactivate:")).length, failureIndex,
    "failed activation must leave no utility marked active");
}

for (let sample = 0; sample < 100; sample += 1) {
  const panelIds = Array.from({ length:1 + sample % 5 }, (_, index) => `standalone-${sample}-${index}`);
  const panels = new Map(panelIds.map((id) => [id, { dataset:{} }]));
  const calls = [];
  let pagehide;
  const lifecycle = createDomUtilityLifecycle(`standalone-${sample}`, panelIds, {
    onMount(){
      calls.push("mount");
      return () => calls.push("dispose");
    },
  });
  const activate = lifecycle.activate.bind(lifecycle);
  const deactivate = lifecycle.deactivate.bind(lifecycle);
  lifecycle.activate = () => { calls.push("activate"); activate(); };
  lifecycle.deactivate = () => { calls.push("deactivate"); deactivate(); };
  const utility = {
    id:`standalone-${sample}`,
    identity:{ name:`Standalone ${sample}`, description:"Generated standalone utility" },
    commands:[],
    panels:panelIds,
    lifecycle,
    storage:{ namespace:`standalone.${sample}`, version:1 },
  };
  const root = {
    dataset:{},
    querySelector(selector){ return panels.get(selector.slice(1)) ?? null; },
  };

  const mounted = mountUtility(utility, root, {
    addEventListener(type, listener, options){
      assert.equal(type, "pagehide");
      assert.deepEqual(options, { once:true });
      pagehide = listener;
    },
  });
  assert.equal(root.dataset.registeredUtilities, utility.id);
  assert.equal(root.dataset.activeUtilities, utility.id);
  assert.deepEqual(panelIds.map((id) => panels.get(id).dataset.utilityOwner),
    Array(panelIds.length).fill(utility.id));
  assert.deepEqual(calls, ["mount", "activate"]);

  if (sample % 2) pagehide(); else mounted.unmount();
  mounted.unmount();
  pagehide();
  assert.equal(root.dataset.activeUtilities, "");
  assert.deepEqual(calls, ["mount", "activate", "dispose", "deactivate"],
    "standalone utilities must deactivate exactly once regardless of unmount source");
}

for (let sample = 0; sample < 100; sample += 1) {
  const count = 1 + sample % 20;
  const commands = Array.from({ length:count }, (_, index) => ({ id:`command-${sample}-${index}` }));
  const registeredIds = commands
    .filter((_, index) => (sample + index) % 3 !== 0)
    .map(({ id }) => id);
  const selected = commandsForUtilityShell(commands, registeredIds);

  assert.deepEqual(selected.map(({ id }) => id), registeredIds,
    "generated command discovery must return exactly the registered catalog subset");
  assert.equal(new Set(selected.map(({ id }) => id)).size, selected.length,
    "generated command discovery must not duplicate catalog entries");
  assert.throws(() => commandsForUtilityShell(commands, [...registeredIds, `missing-${sample}`]),
    new RegExp(`missing-${sample}`), "generated command discovery must reject unavailable registrations");
}

for (let sample = 0; sample < 100; sample += 1) {
  const count = 1 + sample % 8;
  let clickListener;
  const tabList = {
    addEventListener(type, listener){ if (type === "click") clickListener = listener; },
    removeEventListener(type, listener){
      if (type === "click" && clickListener === listener) clickListener = undefined;
    },
  };
  const panels = new Map();
  const tabs = Array.from({ length:count }, (_, index) => {
    const panelId = `data-layer-panel-property-${sample}-${index}`;
    const attributes = new Map([
      ["aria-controls", panelId],
      ["aria-selected", String(index === sample % count)],
    ]);
    panels.set(panelId, { hidden:false });
    return {
      parentElement:tabList,
      tabIndex:0,
      getAttribute:name => attributes.get(name) ?? null,
      setAttribute:(name, value) => attributes.set(name, String(value)),
    };
  });
  const root = {
    querySelectorAll(){ return tabs; },
    querySelector(selector){ return panels.get(selector.slice(1)) ?? null; },
  };
  const selectedIndex = (sample * 7) % count;

  const dispose = mountDataLayerNavigation(root);
  clickListener({ target:{ closest:() => tabs[selectedIndex] } });
  assert.deepEqual(tabs.map((tab) => tab.getAttribute("aria-selected")),
    tabs.map((_, index) => String(index === selectedIndex)));
  assert.deepEqual(tabs.map((tab) => panels.get(tab.getAttribute("aria-controls")).hidden),
    tabs.map((_, index) => index !== selectedIndex));
  assert.deepEqual(tabs.map(({ tabIndex }) => tabIndex),
    tabs.map((_, index) => index === selectedIndex ? 0 : -1));
  dispose();
  assert.equal(clickListener, undefined, "data-layer navigation disposal must detach its click listener");
}

for (let sample = 0; sample < 100; sample += 1) {
  const count = sample % 15;
  const utilities = Array.from({ length:count }, (_, index) => ({
    id:`directory-${sample}-${index}`,
    identity:{ name:`Directory ${index}`, description:`Description ${sample}-${index}` },
    commands:[],
    panels:[],
    lifecycle:{ activate(){}, deactivate(){} },
    storage:{ namespace:`directory.${sample}.${index}`, version:1 },
  }));
  const container = { children:[{ stale:true }], replaceChildren(...children){ this.children = children; } };
  const ownerDocument = { createElement(tag){ return { tag, dataset:{} }; } };

  renderUtilityDirectory(utilities, container, ownerDocument);
  assert.deepEqual(container.children.map(({ tag }) => tag), Array(count).fill("li"));
  assert.deepEqual(container.children.map(({ dataset }) => dataset.utilityId), utilities.map(({ id }) => id));
  assert.deepEqual(container.children.map(({ textContent }) => textContent), utilities.map(({ identity }) => identity.name));
  assert.deepEqual(container.children.map(({ title }) => title), utilities.map(({ identity }) => identity.description));
}

for (let sample = 0; sample < 100; sample += 1) {
  const keys = Array.from({ length:1 + sample % 10 }, (_, index) => `legacy-${sample}-${index}`);
  const namespace = `storage.${sample}`;
  const otherNamespace = `storage.other.${sample}`;
  const otherKey = `other-${sample}`;
  const values = new Map([["unowned.sentinel", "keep"], [otherKey, "other-value"]]);
  if (sample % 2) values.set(namespace, "malformed envelope");
  const backing = {
    getItem:key => values.get(key) ?? null,
    setItem:(key, value) => values.set(key, String(value)),
    removeItem:key => values.delete(key),
  };
  const storage = createUtilityStorage(backing, { namespace, version:1, legacyKeys:keys });
  const otherStorage = createUtilityStorage(backing, { namespace:otherNamespace, version:1, legacyKeys:[otherKey] });

  assert.equal(storage.length, keys.length);
  assert.deepEqual(keys.map((_, index) => storage.key(index)), keys);
  assert.equal(storage.key(keys.length), null);
  for (const [index, key] of keys.entries()) storage.setItem(key, `value-${sample}-${index}`);
  assert.deepEqual(JSON.parse(values.get(namespace)), Object.fromEntries(
    keys.map((key, index) => [key, `value-${sample}-${index}`]),
  ));
  assert.deepEqual(keys.map((key) => storage.getItem(key)), keys.map((_, index) => `value-${sample}-${index}`));
  assert.throws(() => storage.setItem(otherKey, "cross-write"), /does not own storage key/);
  assert.equal(otherStorage.getItem(otherKey), "other-value");

  storage.removeItem(keys[0]);
  assert.equal(storage.getItem(keys[0]), null);
  storage.clear();
  assert.equal(values.has(namespace), false);
  assert.equal(values.get(otherKey), "other-value");
  assert.equal(values.get("unowned.sentinel"), "keep");
}

for (let sample = 0; sample < 100; sample += 1) {
  const utilities = Array.from({ length:1 + sample % 10 }, (_, utilityIndex) => ({
    id:`panel-owner-${sample}-${utilityIndex}`,
    identity:{ name:"Panel owner", description:"Generated panel owner" },
    commands:[],
    panels:Array.from({ length:1 + (sample + utilityIndex) % 4 },
      (_, panelIndex) => `panel-${sample}-${utilityIndex}-${panelIndex}`),
    lifecycle:{ activate(){}, deactivate(){} },
    storage:{ namespace:`panels.${sample}.${utilityIndex}`, version:1 },
  }));
  const nodes = new Map(utilities.flatMap(({ panels }) => panels.map((panel) => [panel, { dataset:{} }])));
  const root = { querySelector(selector){ return nodes.get(selector.slice(1)) ?? null; } };

  bindUtilityPanels(utilities, root);
  for (const utility of utilities) {
    assert.deepEqual(utility.panels.map((panel) => nodes.get(panel).dataset.utilityOwner),
      Array(utility.panels.length).fill(utility.id));
  }
  const missingPanel = utilities.at(-1).panels.at(-1);
  nodes.delete(missingPanel);
  assert.throws(() => bindUtilityPanels(utilities, root), new RegExp(missingPanel));
  nodes.set(missingPanel, { dataset:{} });
  assert.throws(() => bindUtilityPanels([...utilities, { ...utilities[0], id:"duplicate-owner" }], root),
    /owned by both/);
}

console.log(`modular properties: ${declaredContracts.length} declared contracts, 100 undeclared contracts, 100 direct cross-module imports, 100 architecture boundaries, 100 verification graphs, 300 lifecycle cases, 100 command registries, 100 navigation models, 100 utility directories, 100 isolation models, 100 controlled-reference models, 100 shell capability models, 100 storage models, and 100 panel models passed`);
