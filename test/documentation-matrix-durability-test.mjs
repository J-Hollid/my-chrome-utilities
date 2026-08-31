import assert from "node:assert/strict";
import {matrixIsolationDurabilityExpression} from "./support/documentation-matrix-durability.mjs";

const move="let moved;for(let attempt=0;attempt<120;attempt+=1){moved=await repository.loadProject(projectId);if(moved.draftSequence>before.draftSequence)break;await pause(25);}";
const deselection="let after;for(let attempt=0;attempt<120;attempt+=1){after=await repository.loadProject(projectId);if(after.draftSequence>moved.draftSequence)break;await pause(25);}const afterIds=";
const repaired=matrixIsolationDurabilityExpression(`${move}const movedIds=[];${deselection}after.state;`);

assert.match(repaired,/expectedMovedIds/);
assert.match(repaired,/Reordered matrix contexts were not durably saved/);
assert.match(repaired,/expectedCandidateIds/);
assert.match(repaired,/Deselected matrix context was not durably saved/);
assert.doesNotMatch(repaired,/draftSequence>before\.draftSequence/);
assert.doesNotMatch(repaired,/draftSequence>moved\.draftSequence/);
assert.throws(()=>matrixIsolationDurabilityExpression("unrelated probe"),/post-reorder observation/);
assert.throws(()=>matrixIsolationDurabilityExpression(move),/post-deselect observation/);

console.log("documentation matrix durability probe tests passed");
