import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const packs=JSON.parse(await readFile("verification/packs.json","utf8"));
const dispositions=JSON.parse(await readFile("verification/granularity-dispositions.json","utf8"));
const projectManagement=packs.find(({id})=>id==="project_management");
const slice=projectManagement.verificationSlices.find(({id})=>id==="configuration_portability");

assert.deepEqual(projectManagement.plannedFeatures,[
  "features/complete-configuration-portability.feature",
  "features/complete-configuration-portability-runtime.feature",
],"paused product contracts remain planned and cannot execute as preparation proof");

assert.deepEqual(slice.sourcePrefixes,["src/configuration-portability/"]);
assert.deepEqual(slice.tasks,[
  "unit:test/configuration-portability-project-library-transport-test.mjs",
  "unit:test/configuration-portability-ownership-preparation-contract-test.mjs",
  "browser:test/twatility-projects-browser-test.mjs",
]);
assert.deepEqual(slice.prerequisites,["unit:test/data-layer-project-library-transport-test.mjs"]);
assert.deepEqual(slice.consumers,[],"preparation does not invent consumers before product integration");

const expected=new Map([
  ["src/data-layer-project-library-ui.ts",{decision:"integrated-seam",replacementPaths:["src/configuration-portability/project-library-transport.ts"]}],
  ["src/flow-visual-archive-export.ts",{decision:"parent-fallback",replacementPaths:[]}],
  ["src/flow-visual-asset-portability.ts",{decision:"parent-fallback",replacementPaths:[]}],
]);
for(const [path,value] of expected){
  const found=dispositions.dispositions.find(entry=>entry.task==="complete-configuration-portability"&&entry.path===path);
  assert.ok(found,`missing disposition for ${path}`);
  assert.deepEqual({decision:found.decision,replacementPaths:found.replacementPaths},value);
  assert.equal(found.reviewAuthority,"qa-integration");
}

const ui=await readFile("src/data-layer-project-library-ui.ts","utf8");
const seam=await readFile("src/configuration-portability/project-library-transport.ts","utf8");
assert.match(ui,/createCompatibilityProjectLibraryTransport/u);
assert.doesNotMatch(ui,/function compatibilityTransport|const compatibilityTransport/u);
assert.match(seam,/stageProjectImport/u);
assert.match(seam,/if\(input\.signal\?\.aborted\)/u);

console.log(JSON.stringify({configurationPortabilityOwnershipPreparation:{dispositions:3,integratedSeams:1,parentFallbacks:2,consumerCount:0,behaviorChanged:false}}));
