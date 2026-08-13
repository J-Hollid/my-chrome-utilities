import assert from "node:assert/strict";

import {
  stylesheetPlanFor,
  validateStylesheetDeclarations,
} from "../scripts/verification-packs.mjs";

let seed = 0x51e7a11e;
const next = (limit) => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed % limit;
};
const roots = [".documentary-flow", ".surface-root", ".nested-panel"];
const nestedRule = (root, index) =>
  `${root} { color: rgb(${index % 255}, 10, 20); @media (forced-colors: active) { ` +
  `${root} .control-${index} { color: CanvasText; } } @media (prefers-reduced-motion: reduce) { ` +
  `${root} .motion-${index} { transition: none; } } }`;

for (let sample = 0; sample < 200; sample += 1) {
  const root = roots[next(roots.length)];
  const source = `feature-${sample}.css`;
  assert.doesNotThrow(() => validateStylesheetDeclarations([{
    source, destination:source, classification:"feature-local", owner:"shell",
    consumers:[], qaTargets:[], scopeRoot:root,
  }], {
    packIds:["shell"], sourcePaths:[source], stylesheetContents:{ [source]:nestedRule(root, sample) },
  }), "nested responsive selectors remain inside their declared scope root");
}

assert.throws(() => validateStylesheetDeclarations([{
  source:"escape.css", destination:"escape.css", classification:"feature-local", owner:"shell",
  consumers:[], qaTargets:[], scopeRoot:".documentary-flow",
}], {
  packIds:["shell"], sourcePaths:["escape.css"],
  stylesheetContents:{"escape.css":".documentary-flow { @media (forced-colors: active) { body { color: red; } } }"},
}), /escaping scope root/u);

const global = [{
  source:"global.css", destination:"global.css", classification:"global", owner:"shell",
  consumers:[], qaTargets:["STUDIO_GLOBAL_STYLE_SMOKE_TARGET"], scopeRoot:null,
}];
assert.doesNotThrow(() => validateStylesheetDeclarations(global, {
  packIds:["shell"], sourcePaths:["global.css"],
}));
assert.deepEqual(stylesheetPlanFor([{ id:"shell", stylesheets:global }], "global.css").selected, []);
assert.throws(() => validateStylesheetDeclarations([{ ...global[0], consumers:["shell"] }], {
  packIds:["shell"], sourcePaths:["global.css"],
}), /consumer/u);
assert.throws(() => validateStylesheetDeclarations([{ ...global[0], qaTargets:[] }], {
  packIds:["shell"], sourcePaths:["global.css"],
}), /QA smoke targets/u);

console.log("stylesheet declaration property tests passed");
