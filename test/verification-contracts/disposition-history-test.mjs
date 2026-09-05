import {readFile} from "node:fs/promises";
import assert from "node:assert/strict";
import {preservesDispositionHistory} from "./disposition-history.mjs";
import {timeoutIncidentDigest} from "../../scripts/verification-reliability-values.mjs";

const entry = index => ({task:`task-${index}`,path:`src/input-${index}.ts`,
  decision:"parent-fallback",replacementPaths:[],reviewAuthority:"qa-integration",reason:"Authored example"});
const baseline = {version:1,dispositions:Array.from({length:12},(_,index)=>entry(index))};
const current = {version:1,dispositions:[...baseline.dispositions,entry(12),entry(13)]};
assert.equal(preservesDispositionHistory(current,baseline),true);
assert.equal(preservesDispositionHistory(baseline,baseline),true);
assert.equal(preservesDispositionHistory({version:1,dispositions:current.dispositions.slice(1)},baseline),false);
const changed=structuredClone(current);changed.dispositions[0].reason="Changed history";
assert.equal(preservesDispositionHistory(changed,baseline),false);
assert.throws(()=>preservesDispositionHistory({version:1,dispositions:[...current.dispositions,entry(0)]},baseline),/unique/u);
const before=JSON.stringify({current,baseline});preservesDispositionHistory(current,baseline);
assert.equal(JSON.stringify({current,baseline}),before);
const preRepairResult={historyConserved:current.dispositions.length===12};
const repairResult={historyConserved:preservesDispositionHistory(current,baseline)};
assert.deepEqual(preRepairResult,{historyConserved:false});
assert.deepEqual(repairResult,{historyConserved:true});
if(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION){
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const sourceAssertion=context.causalCategory==="other:stale disposition source assertion";
  const statement=(await readFile("scripts/verification-ownership-readiness-test.mjs","utf8"))
    .split("\n").find(line=>line.includes("durableDispositions:"));
  const legacySourceAccepted=/dispositions\.dispositions\.length===12/u.test(statement);
  const currentSourceAccepted=/preservesDispositionHistory\(dispositions,acceptedDispositions\)/u.test(statement);
  assert.equal(legacySourceAccepted,false);assert.equal(currentSourceAccepted,true);
  const before=sourceAssertion?{historyConserved:legacySourceAccepted}:preRepairResult;
  const after=sourceAssertion?{historyConserved:currentSourceAccepted}:repairResult;
  const fixture={id:sourceAssertion?"disposition-history-source-call-v1":"additive-disposition-history-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(context.diagnosedBoundary),
    input:sourceAssertion?{statement}:{baseline,current},expectedPreRepairFailure:{historyConserved:false},
    expectedRepairResult:{historyConserved:true}};
  const fixtureDigest=timeoutIncidentDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:before},
    repairResult:{status:"passed",fixtureDigest,observed:after}}}));
}
console.log("Disposition history is conserved across valid additions.");
