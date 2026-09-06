import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {readFile} from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";
import {timeoutIncidentDigest} from "../../scripts/verification-reliability-values.mjs";
import {verificationPolicyContracts} from "../../scripts/verification-policy/contracts.mjs";
import {planVerification} from "../../scripts/verification-planner/tasks/planner.mjs";
import {planPackageTask,selectFocusedVerificationTasks} from "../../scripts/run-focused-acceptance.mjs";
import {registryPlannerPreparationFocusedPlan,registryPlannerPreparationTaskKeys,
  registryPlannerPreparationEvidenceTask} from "../../scripts/verification-policy/reliability/run-intent.mjs";
import {verificationContractSyntaxLeaves} from "../../scripts/verification-registry/contract-conservation.mjs";
import {retainedChildDispatchTransition,validateRetainedOwnerTransition} from "../../scripts/verification-registry/retained-owner-transition.mjs";
const declaration=structuredClone(retainedChildDispatchTransition);
const source=execFileSync("git",["cat-file","blob",declaration.sourceBlob],{encoding:"utf8"});
const start=source.indexOf("let childDispatchRepairEvidence;");
const end=source.indexOf("const changeRepository =",start);
const child=verificationContractSyntaxLeaves(source.slice(start,end),declaration.toOwner);
const parent=verificationContractSyntaxLeaves(source.slice(0,start)+source.slice(end),declaration.fromOwner);
const document={compatibility:{retainedOwnerTransitions:[declaration]}};
const state={leavesByOwner:{[declaration.fromOwner]:parent,[declaration.toOwner]:child}};
assert.equal(validateRetainedOwnerTransition(document,state),true);
assert.deepEqual(Object.fromEntries(Object.entries(child).map(([k,v])=>[k,v.length])),
  {assertions:8,fixtures:1,evidence:0});
for(const owner of [declaration.fromOwner,declaration.toOwner]){
 const lost=structuredClone(state);lost.leavesByOwner[owner].assertions.pop();
 assert.throws(()=>validateRetainedOwnerTransition(document,lost),/population/u);
}
const wrong=structuredClone(document);wrong.compatibility.retainedOwnerTransitions[0].authority.commit="0".repeat(40);
assert.throws(()=>validateRetainedOwnerTransition(wrong,state),/authority/u);
assert.throws(()=>validateRetainedOwnerTransition({compatibility:{}},state),/missing/u);
const duplicate=structuredClone(document);duplicate.compatibility.retainedOwnerTransitions.push(declaration);
assert.throws(()=>validateRetainedOwnerTransition(duplicate,state),/authority/u);
const contract=verificationPolicyContracts.find(({id})=>id==="historical_planning");
assert.equal(contract.retainsParent,true);
assert.deepEqual([...contract.testPaths],[declaration.fromOwner,declaration.toOwner]);
const packs=JSON.parse(await readFile("verification/packs.json","utf8"));
const slice=packs.find(({id})=>id==="verification_process").verificationSlices
  .find(({id})=>id==="historical_planning");
for(const owner of contract.testPaths){
  assert(slice.sourcePaths.includes(owner));
  assert(slice.tasks.includes(`unit:${owner}`));
}
console.log(JSON.stringify({retainedOwnerTransition:{authorized:true,parentRetained:true,childAssertions:8,childFixtures:1,lossRejected:true,wrongAuthorityRejected:true}}));

// Construct plans only. Never execute the aggregate represented by these keys.
function preparationAdmitted(registry){
  const canonical=planVerification(registry,{packIds:["shell","verification_process"]});
  const focused=planPackageTask(selectFocusedVerificationTasks(canonical,
    registryPlannerPreparationTaskKeys),canonical);
  return registryPlannerPreparationFocusedPlan(focused,registryPlannerPreparationEvidenceTask);
}
const priorPacks=JSON.parse(execFileSync("git",["show","c9b3db9e:verification/packs.json"],
  {encoding:"utf8",timeout:10000,maxBuffer:4*1024*1024}));
const priorAdmission=preparationAdmitted(priorPacks);
const currentAdmission=preparationAdmitted(packs);
assert.equal(priorAdmission,false,"the appended child violates canonical owner order");
assert.equal(currentAdmission,true,"the child follows its retained parent in canonical order");
const orderRepairContext=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
  ?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):undefined;
if(orderRepairContext?.causalCategory==="other:retained child registry order"){
  const fixture={id:"retained-child-registry-order-v1",causalCategory:orderRepairContext.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(orderRepairContext.diagnosedBoundary),
    expectedPreRepairFailure:{admitted:false},expectedRepairResult:{admitted:true}};
  const fixtureDigest=timeoutIncidentDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:orderRepairContext.incidentId,failureDigest:orderRepairContext.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:{admitted:priorAdmission}},
    repairResult:{status:"passed",fixtureDigest,observed:{admitted:currentAdmission}}}}));
}

function reportingGuard(source){
  const file=ts.createSourceFile("parent.mjs",source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  const guards=[];
  function visit(node){
    if(ts.isIfStatement(node)&&ts.isExpressionStatement(node.thenStatement)&&
        ts.isCallExpression(node.thenStatement.expression)&&
        node.thenStatement.expression.expression.getText(file)==="emitVerificationAdministrationRepairProtocol")
      guards.push(node.getText(file));
    ts.forEachChild(node,visit);
  }
  visit(file);assert.equal(guards.length,1);return guards[0];
}
const priorGuard=reportingGuard(execFileSync("git",["show",
  `81619370:${declaration.fromOwner}`],{encoding:"utf8"}));
const currentGuard=reportingGuard(await readFile(declaration.fromOwner,"utf8"));
function executeGuard(guard,category){
  let calls=0;
  vm.runInNewContext(guard,{process:{env:category?{
    SWARMFORGE_TIMEOUT_REPAIR_REGRESSION:JSON.stringify({causalCategory:category})}:{}},
  emitVerificationAdministrationRepairProtocol:()=>{calls+=1;}},{timeout:1000});
  return calls;
}
assert.throws(()=>executeGuard(priorGuard),/reportChildDispatchRepair is not defined/u);
const observed={ordinaryCalls:executeGuard(currentGuard),
  childRepairCalls:executeGuard(currentGuard,"duplicated or unbounded workload")};
assert.deepEqual(observed,{ordinaryCalls:1,childRepairCalls:0});
const repairContext=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
  ?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):undefined;
if(repairContext?.causalCategory==="other:extracted child-dispatch guard scope"){
  const fixture={id:"retained-parent-reporting-guard-v1",causalCategory:repairContext.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(repairContext.diagnosedBoundary),
    expectedPreRepairFailure:{missingGuard:true},
    expectedRepairResult:{ordinaryCalls:1,childRepairCalls:0}};
  const fixtureDigest=timeoutIncidentDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:repairContext.incidentId,failureDigest:repairContext.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:{missingGuard:true}},
    repairResult:{status:"passed",fixtureDigest,observed}}}));
}
