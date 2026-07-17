import assert from "node:assert/strict";

import { planVerification } from "../scripts/verification-packs.mjs";
import { composeUtilityShell } from "../dist/utility-registry.js";
import { commandsForUtilityShell } from "../dist/utilities/command-palette/index.js";
import { bindUtilityPanels, mountUtility, renderUtilityDirectory } from "../dist/platform/utility-shell-dom.js";
import { createUtilityStorage } from "../dist/platform/utility-storage.js";

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
    features:[`features/feature-${sample}-${index}.feature`],
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
  assert.equal(plan.commands[0], "npm run build");
  assert.equal(plan.commands.filter((command) => command === "npm run build").length, 1,
    "generated plans must compile exactly once");
  assert.equal(new Set(plan.commands).size, plan.commands.length,
    "generated plans must schedule each command once");
  assert.deepEqual(plan.features, packs.filter(({ id }) => expected.has(id)).flatMap(({ features }) => features).sort());

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
  const utility = {
    id:`standalone-${sample}`,
    identity:{ name:`Standalone ${sample}`, description:"Generated standalone utility" },
    commands:[],
    panels:panelIds,
    lifecycle:{
      activate(){ calls.push("activate"); },
      deactivate(){ calls.push("deactivate"); },
    },
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
  assert.deepEqual(calls, ["activate"]);

  if (sample % 2) pagehide(); else mounted.unmount();
  mounted.unmount();
  pagehide();
  assert.equal(root.dataset.activeUtilities, "");
  assert.deepEqual(calls, ["activate", "deactivate"],
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

console.log("modular properties: 100 verification graphs, 300 lifecycle cases, 100 command registries, 100 utility directories, 100 storage models, and 100 panel models passed");
