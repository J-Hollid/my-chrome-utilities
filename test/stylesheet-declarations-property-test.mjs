import assert from "node:assert/strict";

import {
  stylesheetPlanFor,
  validateStylesheetDeclarations,
  validateStylesheetOwnership,
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
const keyframesRule = (root, index) =>
  `${root} { animation: feature-${index} 1s; } @keyframes feature-${index} { ` +
  `from { opacity: 0; } 50% { opacity: .5; } to { opacity: 1; } }`;

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

assert.doesNotThrow(() => validateStylesheetDeclarations([{
  source:"keyframes.css", destination:"keyframes.css", classification:"feature-local", owner:"shell",
  consumers:[], qaTargets:[], scopeRoot:".documentary-flow",
}], {
  packIds:["shell"], sourcePaths:["keyframes.css"],
  stylesheetContents:{ "keyframes.css":keyframesRule(".documentary-flow", 1) },
}), "keyframe from/to/percentage blocks are not escaping selectors");

assert.doesNotThrow(() => validateStylesheetDeclarations([{
  source:"after-keyframes.css", destination:"after-keyframes.css", classification:"feature-local", owner:"shell",
  consumers:[], qaTargets:[], scopeRoot:".documentary-flow",
}], {
  packIds:["shell"], sourcePaths:["after-keyframes.css"],
  stylesheetContents:{
    "after-keyframes.css":`${keyframesRule(".documentary-flow", 2)} ` +
      ".documentary-flow .after-keyframes { display: block; }",
  },
}), "a scoped selector after keyframes remains in scope");

assert.throws(() => validateStylesheetDeclarations([{
  source:"after-keyframes-escape.css", destination:"after-keyframes-escape.css",
  classification:"feature-local", owner:"shell", consumers:[], qaTargets:[], scopeRoot:".documentary-flow",
}], {
  packIds:["shell"], sourcePaths:["after-keyframes-escape.css"],
  stylesheetContents:{
    "after-keyframes-escape.css":`${keyframesRule(".documentary-flow", 3)} ` +
      "@media (forced-colors: active) { body { color: red; } }",
  },
}), /escaping scope root/u, "an escaping selector after keyframes is still rejected");

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
assert.doesNotThrow(() => validateStylesheetDeclarations([{
  source:"functional-pseudo.css", destination:"functional-pseudo.css",
  classification:"feature-local", owner:"flow_graph", consumers:[], qaTargets:[],
  scopeRoot:".documentary-flow",
}], {
  packIds:["flow_graph"], sourcePaths:["functional-pseudo.css"],
  stylesheetContents:{
    "functional-pseudo.css":
      ".documentary-flow .flow-node:is(:hover, :focus, .is-selected) circle, " +
      ".documentary-flow [data-port]:not([hidden], [aria-disabled=true]) { stroke: green; }",
  },
}), "commas inside functional pseudo-classes do not split the selector list");
assert.throws(() => validateStylesheetOwnership([
  { id:"shell", stylesheets:[{ ...global[0], owner:"flow_graph" }] },
  { id:"flow_graph" },
]), /declared by its owner pack/u,
"a stylesheet declaration cannot be stored under a pack other than its declared owner");

console.log("stylesheet declaration property tests passed");
