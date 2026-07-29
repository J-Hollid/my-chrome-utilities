import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const side=await readFile(new URL("../side-panel-brand.css",import.meta.url),"utf8");
const studio=await readFile(new URL("../specification-builder-brand.css",import.meta.url),"utf8");
const studioBase=await readFile(new URL("../specification-builder.css",import.meta.url),"utf8");

for(const [name,source,scope] of[
  ["side panel",side,".twatility-side-panel"],
  ["Studio",studio,".twatility-studio"],
]){
  assert.match(source,/Slice 6:/u,`${name} must declare its Slice 6 layer`);
  assert.match(source,/@media \(prefers-reduced-motion: reduce\)/u,`${name} must preserve reduced-motion presentation`);
  assert.match(source,/@media \(forced-colors: active\)/u,`${name} must preserve forced-colors presentation`);
  const slice=source.slice(source.lastIndexOf("Slice 6:"));
  const unsafe=slice.split(/\r?\n/u).filter((line)=>/^[.#[]/u.test(line)&&!line.startsWith(scope));
  assert.deepEqual(unsafe,[],`${name} Slice 6 selectors must remain under ${scope}`);
}

for(const selector of[
  "#project-transport-context",
  "#history-path",
  "#default-push-path",
  "#schema-tree-controls",
  "#schema-list[role=\"tree\"]",
  "#event-template-master",
  "#saved-session-master",
  "#defect-library-master",
  "#schema-rule-library",
  "#schema-assignments",
]) assert.match(side,new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/gu,"\\$&"),"u"),`missing side-panel Slice 6 seam ${selector}`);

for(const selector of[
  "#flow-graph-workspace",
  ".flow-canvas-scroll",
  "[aria-label=\"Project Documentation workspace\"]",
  ".coverage-grid",
  "#release-review",
  "#import-review",
  "#project-conflict-review",
  "#builder-storage-recovery",
]) assert.match(studio,new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/gu,"\\$&"),"u"),`missing Studio Slice 6 seam ${selector}`);

assert.doesNotMatch(side,/\.twatility-side-panel\s+#schema-list\[role="tree"\][^{]*\{[^}]*overflow-y\s*:\s*(?:auto|scroll)/su,"relationship tree must not gain a second vertical scroll owner");
assert.match(studio,/\.twatility-studio \.flow-canvas-scroll\s*\{[^}]*max-width\s*:\s*100%/su,"Flow canvas branding must stay contained by its production scroll owner");
assert.doesNotMatch(studio,/\.twatility-studio\s+table\s*\{/u,"wide table styling must remain locally scoped");
assert.match(studioBase,/\.studio-choice-row\s*\{[^}]*min-height\s*:\s*36px[^}]*column-gap\s*:\s*8px/su,"Studio choice rows must provide the fine-pointer target and exact label gap");
assert.match(studioBase,/\.studio-choice-indicator\s*\{[^}]*inline-size\s*:\s*18px[^}]*block-size\s*:\s*18px/su,"Studio checkbox indicators must remain compact");
assert.match(studioBase,/@media[^{]*\(pointer:\s*coarse\)[^{]*\{[\s\S]*?\.studio-choice-row\s*\{[^}]*min-height\s*:\s*44px/su,"coarse-pointer choice rows must provide a 44 CSS pixel target");
assert.doesNotMatch(side,/studio-choice-row|studio-choice-indicator/u,"Studio choice presentation must not alter side-panel CSS");

console.log("TWAtility Belt Slice 6 polish selector tests passed");
