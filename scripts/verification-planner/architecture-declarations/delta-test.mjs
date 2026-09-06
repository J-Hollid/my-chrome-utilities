import assert from 'node:assert/strict';
import {declarationDelta} from './delta.mjs';
const source='src/owner.ts', consumer='src/consumer.ts', oldEdge='src/old.ts', newEdge='src/new.ts';
const entry=(contracts=[])=>({module:'schemas',layer:'application',contracts});
const before={[source]:entry([oldEdge]),[consumer]:entry([source])};
const after={...before,[source]:entry([newEdge])};
const result=declarationDelta(before,after);
assert.deepEqual(result.paths,[consumer,newEdge,oldEdge,source].sort());
for(const candidate of [{...before,'../bad.ts':entry()}, {...before,[source]:{...entry(),layer:'unknown'}},
 {...before,[source]:{...entry(),contracts:['../bad.ts']}}, {...before,sharedRule:true}]) {
 assert.equal(declarationDelta(before,candidate),null);
}
for(const [base,candidate,expected] of [
 [{},before,[source,consumer,oldEdge]],
 [before,{},[source,consumer,oldEdge]],
 [{[source]:entry()},{'src/renamed.ts':entry()},[source,'src/renamed.ts']],
 [before,structuredClone(before),[]],
]) assert.deepEqual(declarationDelta(base,candidate)?.paths,expected.sort());
const cycle={[source]:entry([consumer]),[consumer]:entry([source])};
assert.deepEqual(declarationDelta({},cycle).paths,[source,consumer].sort());
console.log(JSON.stringify({architectureDeclarations:{delta:true,invalid:true,cycles:true}}));
