import assert from "node:assert/strict";

import { planVerification } from "../scripts/verification-packs.mjs";

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

console.log("modular verification planning properties: 100 generated graphs passed");
