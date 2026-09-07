import assert from "node:assert/strict";
import {EventEmitter} from "node:events";
import {PassThrough} from "node:stream";
import {collectBrowserObservationOutput} from "../scripts/browser-observation/collect-output.mjs";
import {emitBrowserObservationResultFailures,emitValidatedBrowserObservationResults,parseBrowserObservationBatchOutput} from
  "../scripts/browser-observation/results.mjs";
import {createBrowserObservationOutputForwarder} from "../scripts/browser-observation/forward-output.mjs";
import {deriveObservationResultRepairProof,validateObservationResultRepairProof} from
  "../scripts/verification-reliability-observation-result-proof.mjs";
import {diagnosticRetryScope} from "../scripts/verification-reliability-progress.mjs";
import {timeoutIncidentDigest} from "../scripts/verification-reliability-values.mjs";
import {eligibleRepairCausalKey} from "../scripts/verification-policy/reliability/eligible-repair-admission.mjs";
import {waitForSchemaCopyPresentation} from "./support/schema-copy-presentation.mjs";

function presentationFixture() {
  let nextId=0;
  const frames=new Map(),timers=new Map(),cancelled=[];
  return {frames,timers,cancelled,scope:{
    requestAnimationFrame(callback){const id=++nextId;frames.set(id,callback);return id;},
    cancelAnimationFrame(id){cancelled.push(id);frames.delete(id);},
    setTimeout(callback,delay){assert.equal(delay,2000);timers.set(1,callback);return 1;},
    clearTimeout(id){timers.delete(id);},
  },frame(){const pending=[...frames.values()];frames.clear();for(const callback of pending)callback();}};
}
const presentation=presentationFixture(),scroll={editor:657,tree:268};
presentation.scope.requestAnimationFrame(()=>{
  presentation.scope.requestAnimationFrame(()=>Object.assign(scroll,{editor:51,tree:37}));
});
const beforePresentation={...scroll};
const settledPresentation=waitForSchemaCopyPresentation(presentation.scope);
presentation.frame();
assert.deepEqual(scroll,beforePresentation,"One frame can precede scroll restoration");
presentation.frame();
await settledPresentation;
assert.deepEqual(scroll,{editor:51,tree:37});
assert.equal(presentation.timers.size,0);
assert.equal(presentation.frames.size,0);
for(const completedFrames of [0,1]) {
  const stalled=presentationFixture();
  const rejected=assert.rejects(waitForSchemaCopyPresentation(stalled.scope),/Timed out/);
  if(completedFrames)stalled.frame();
  stalled.timers.get(1)();
  await rejected;
  assert.equal(stalled.frames.size,0);
  assert.equal(stalled.cancelled.length,1);
}

const observations=[{id:"FIRST",observationKey:"first",evidenceLeaves:[["first","ready"]]},
  {id:"SECOND",observationKey:"second",evidenceLeaves:[["second","ready"]]}];
const stdout=[...observations.flatMap(({id,observationKey})=>[
  JSON.stringify({[observationKey]:{ready:id==="FIRST"}}),
  JSON.stringify({swarmforgeBrowserTargetResult:{id,status:"passed",durationMs:2}}),
]),JSON.stringify({swarmforgeVerificationProgress:{version:1,sequence:10,monotonicMs:10,
  boundary:"cleanup",phase:"process-shutdown",completed:true}})].join("\n");
const parsed=parseBrowserObservationBatchOutput(stdout,observations),emitted=[];
assert.deepEqual(parsed.failures.map(({id})=>id),["SECOND"]);
assert.equal(parsed.document.first.ready,true);
emitBrowserObservationResultFailures(stdout,observations,parsed.failures,line=>emitted.push(JSON.parse(line)));
assert.equal(emitted.length,1);
assert.equal(emitted[0].swarmforgeBrowserTargetResult.id,"SECOND");
assert.equal(emitted[0].swarmforgeBrowserTargetResult.status,"failed");
assert.equal(emitted[0].swarmforgeBrowserTargetResult.phase,"result-validation");
assert.deepEqual(diagnosticRetryScope({task:{stage:"browser-observation"},
  lastProgress:{boundary:"target",logicalTargetId:"SECOND"}}),
  {kind:"target",logicalTargetIds:["SECOND"],executionArgs:["scripts/run-browser-observation.mjs","SECOND"]});
const noEmission=[];
emitBrowserObservationResultFailures(stdout,observations,[],line=>noEmission.push(line));
assert.deepEqual(noEmission,[]);
const originalFailure=JSON.stringify({swarmforgeBrowserTargetResult:{id:"SECOND",status:"failed",assertionSite:"fixture:1"}});
emitBrowserObservationResultFailures(`${stdout}\n${originalFailure}`,observations,parsed.failures,line=>noEmission.push(line));
assert.deepEqual(noEmission,[],"Keep the original target failure details");
assert.throws(()=>emitBrowserObservationResultFailures(stdout,observations,[{id:"UNRELATED"}]),/undeclared/);
let forwarded="";
const forward=createBrowserObservationOutputForwarder(["FIRST","SECOND"],line=>{forwarded+=line;});
const fragmented=Buffer.from(`État\n${stdout}\n${originalFailure}\n`);
for(let offset=0;offset<fragmented.length;offset+=7)forward.write(fragmented.subarray(offset,offset+7));
forward.end();
assert.ok(forwarded.startsWith("État\n"),"Chunk boundaries preserve UTF-8 diagnostics");
assert.ok(!forwarded.includes('"status":"passed"'),"No provisional pass escapes before evidence validation");
assert.ok(forwarded.includes('"assertionSite":"fixture:1"'));
const validated=[];
emitValidatedBrowserObservationResults(stdout,observations,parsed,line=>validated.push(JSON.parse(line)));
assert.deepEqual(validated.filter(record=>record.swarmforgeBrowserTargetResult)
  .map(({swarmforgeBrowserTargetResult:r})=>[r.id,r.status]),
  [["SECOND","failed"],["FIRST","passed"]]);

const variants=[{id:"VARIANT_ONE",observationKey:"library"},
  {id:"VARIANT_TWO",observationKey:"library"}];
const variantOutput=variants.flatMap(({id},index)=>[
  JSON.stringify({library:{count:index+1}}),
  JSON.stringify({swarmforgeBrowserTargetResult:{id,status:"passed",durationMs:1}}),
]).join("\n")+"\n";
const variantResults=parseBrowserObservationBatchOutput(variantOutput,variants);
let variantForwarded="";
const variantForward=createBrowserObservationOutputForwarder(variants.map(({id})=>id),
  line=>{variantForwarded+=line;});
variantForward.write(Buffer.from(variantOutput));variantForward.end();
const unpaired=variantForwarded+variants.map(({id})=>JSON.stringify({
  swarmforgeBrowserTargetResult:{id,status:"passed",durationMs:1}})).join("\n");
assert.equal(parseBrowserObservationBatchOutput(unpaired,variants).results.VARIANT_ONE.library.count,2,
  "The old deferred stream incorrectly paired the first target with the last variant");
emitValidatedBrowserObservationResults(variantOutput,variants,variantResults,
  line=>{variantForwarded+=`${line}\n`;});
const pairedResults=parseBrowserObservationBatchOutput(variantForwarded,variants).results;
assert.deepEqual(pairedResults,variantResults.results,
  "A deferred pass retains its own observation document for downstream consumers");

// These resource checks use tiny fixed buffers and fake children. No process
// is launched and no producer can loop without a bound.
function outputFixture() {
  const child=Object.assign(new EventEmitter(),{stdout:new PassThrough(),stderr:new PassThrough()});
  const signalSource=new EventEmitter(),signals=[],output=[];
  const result=collectBrowserObservationOutput(child,["FIRST"],{signalSource,
    terminate:(_child,signal)=>signals.push(signal),limitBytes:64,graceMs:5,
    writeStdout:chunk=>output.push(chunk),writeStderr:chunk=>output.push(chunk)});
  return {child,signalSource,signals,output,result};
}
const oversized=outputFixture();
const rejectedOutput=assert.rejects(oversized.result,/output exceeded 64 bytes/);
oversized.child.stdout.write(Buffer.alloc(64,65));
oversized.child.stdout.write(Buffer.alloc(1,65));
await rejectedOutput;
assert.deepEqual(oversized.signals,["SIGTERM","SIGKILL"]);
assert.deepEqual(oversized.output,[],"An incomplete oversized line is never published");
assert.equal(oversized.child.stdout.destroyed,true);
assert.equal(oversized.signalSource.listenerCount("SIGTERM"),0);
const cancelled=outputFixture(),rejectedSignal=assert.rejects(cancelled.result,/interrupted by SIGTERM/);
cancelled.signalSource.emit("SIGTERM");cancelled.child.emit("close",null,"SIGTERM");
await rejectedSignal;
assert.deepEqual(cancelled.signals,["SIGTERM","SIGKILL"]);
const normal=outputFixture();
normal.child.stdout.write(Buffer.from("ordinary output"));normal.child.emit("close",0,null);
assert.deepEqual(await normal.result,{stdout:"ordinary output",code:0,signal:null});
assert.deepEqual(normal.output,["ordinary output"]);
assert.deepEqual(normal.signals,[]);
assert.equal(normal.signalSource.listenerCount("SIGTERM"),0);

function fixture() {
  const task={key:"browser-observation:FIRST+SECOND",stage:"browser-observation",packId:"shell",
    executable:"node",args:["scripts/run-browser-observation.mjs","FIRST","SECOND"],
    logicalTargetIds:["FIRST","SECOND"],requiredCapabilities:["local-loopback"]};
  const packs=[{id:"shell",browserObservations:observations,
    browserEvidencePartitions:[{targets:observations.map(({id,observationKey})=>({id,leaves:[`${observationKey}.ready`]}))}]}];
  const plan={mode:"exact",selectedPackIds:["shell"]},lineage={commit:"a".repeat(40),tree:"b".repeat(40)};
  const stderr="Browser observation batch failed: SECOND";
  const failure={failureClass:"nonzero-exit",task,runnerRunId:"fixture-run",lineage,
    sourceReceipt:"tmp/verification-receipts/fixture-result.json",
    failedBoundary:{boundary:"cleanup",phase:"process-shutdown",completed:true},
    exitResult:{code:1,signal:null},planDigest:timeoutIncidentDigest(plan),
    registryDigest:timeoutIncidentDigest(packs),outputSha256:timeoutIncidentDigest(stdout),
    stderrSha256:timeoutIncidentDigest(stderr)};
  const incident={id:"observation-result-fixture",state:"unresolved",createdAt:"2026-09-07T00:00:00.000Z",
    failure,failureDigest:timeoutIncidentDigest(failure),transitions:[]};
  const receipt={version:2,runId:failure.runnerRunId,candidate:lineage,plan,
    registryDigest:failure.registryDigest,tasks:{[task.key]:{identity:task,status:"failed",
      exitCode:1,signal:null,output:stdout,stderr,reliabilityIncidentId:incident.id,
      reliabilityFailureDigest:incident.failureDigest}}};
  const historical={...lineage,packs,tasks:[task]};
  const loaders={sourceReceiptLoader:()=>({path:failure.sourceReceipt,bytes:JSON.stringify(receipt),receipt}),
    historicalLoader:()=>historical};
  return {incident,receipt,historical,loaders};
}
const valid=fixture(),before=JSON.stringify(valid.incident);
assert.throws(()=>diagnosticRetryScope({task:valid.incident.failure.task,
  lastProgress:valid.incident.failure.failedBoundary}),/no unambiguous trusted/);
const proof=deriveObservationResultRepairProof(valid.incident,valid.loaders);
assert.deepEqual(proof.boundary,{kind:"target",logicalTargetIds:["SECOND"],
  executionArgs:["scripts/run-browser-observation.mjs","SECOND"]});
assert.deepEqual(validateObservationResultRepairProof(valid.incident,proof,valid.loaders),proof);
const admissionKey=(incident,repair)=>eligibleRepairCausalKey(incident,repair,
  (source,provided)=>validateObservationResultRepairProof(source,provided,valid.loaders));
assert.equal(admissionKey(valid.incident,{taskCheckpointProof:proof}),proof.digest);
assert.equal(JSON.stringify(valid.incident),before,"The immutable incident remains unchanged");
const counterfeit=structuredClone(proof);counterfeit.boundary.logicalTargetIds=["FIRST"];
assert.throws(()=>validateObservationResultRepairProof(valid.incident,counterfeit,valid.loaders),/authenticated/);
assert.throws(()=>admissionKey(valid.incident,{taskCheckpointProof:counterfeit}),/authenticated/);
assert.equal(eligibleRepairCausalKey({failure:{causalKey:"original-key"}},{}),"original-key");
assert.equal(eligibleRepairCausalKey({failure:{causalKey:"original-key"}},{taskCheckpointProof:proof}),undefined);
const corruptions=[
  value=>{value.receipt.tasks[value.incident.failure.task.key].output+="tampered";},
  value=>{value.receipt.tasks[value.incident.failure.task.key].stderr+="tampered";},
  value=>{value.receipt.candidate={...value.receipt.candidate,tree:"c".repeat(40)};},
  value=>{value.receipt.tasks[value.incident.failure.task.key].identity={...value.incident.failure.task,packId:"other"};},
  value=>{value.historical.packs[0].browserEvidencePartitions[0].targets[1].leaves=["second.unrelated"];},
  value=>{value.historical.tasks=[];},
  value=>{value.receipt.tasks[value.incident.failure.task.key].reliabilityIncidentId="other-incident";},
];
for(const corrupt of corruptions) {
  const value=fixture();corrupt(value);
  assert.throws(()=>deriveObservationResultRepairProof(value.incident,value.loaders),/authenticated/);
}
console.log("Browser result failure reporting and authenticated boundary tests passed");

const context=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
  ?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):null;
if(context?.causalCategory==="other:copy presentation observation settlement") {
  const fixture={id:"copy-presentation-settlement-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(context.diagnosedBoundary),
    input:{restorationFrames:2,timeoutMs:2000},
    expectedPreRepairFailure:beforePresentation,expectedRepairResult:{editor:51,tree:37}};
  const fixtureDigest=timeoutIncidentDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:beforePresentation},
    repairResult:{status:"passed",fixtureDigest,observed:{...scroll}}}}));
}
if(context?.causalCategory==="other:post-observation result boundary") {
  // The native command authenticates the live receipt before this isolated
  // regression starts. Exercise the old and repaired behavior on one fixed
  // receipt fixture without reaching outside the test's runtime namespace.
  assert.throws(()=>diagnosticRetryScope({task:valid.incident.failure.task,
    lastProgress:valid.incident.failure.failedBoundary}));
  const authenticated=deriveObservationResultRepairProof(valid.incident,valid.loaders);
  assert.deepEqual(authenticated.boundary,{kind:"target",logicalTargetIds:["SECOND"],
    executionArgs:["scripts/run-browser-observation.mjs","SECOND"]});
  const observed={trustedBoundary:true,receiptAuthenticated:true,negativeCasesPassed:true};
  const regressionFixture={id:"post-observation-result-boundary-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(context.diagnosedBoundary),
    input:{sourceReceipt:authenticated.sourceReceipt,failedTargets:authenticated.boundary.logicalTargetIds},
    expectedPreRepairFailure:{trustedBoundary:false},expectedRepairResult:observed};
  const fixtureDigest=timeoutIncidentDigest(regressionFixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture:regressionFixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:{trustedBoundary:false}},
    repairResult:{status:"passed",fixtureDigest,observed}}}));
}

if(context?.causalCategory==="other:validated observation document pairing") {
  const observed={counts:variants.map(({id})=>pairedResults[id].library.count)};
  assert.deepEqual(observed,{counts:[1,2]});
  const fixture={id:"validated-observation-document-pairing-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(context.diagnosedBoundary),
    input:{variants,documents:[{library:{count:1}},{library:{count:2}}]},
    expectedPreRepairFailure:{counts:[2,2]},expectedRepairResult:observed};
  const fixtureDigest=timeoutIncidentDigest(fixture);
  const prior=parseBrowserObservationBatchOutput(unpaired,variants).results;
  const before={counts:variants.map(({id})=>prior[id].library.count)};
  assert.deepEqual(before,fixture.expectedPreRepairFailure);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:before},
    repairResult:{status:"passed",fixtureDigest,observed}}}));
}
