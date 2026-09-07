import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import vm from "node:vm";
import {guidedRuntimeWaitHelpers} from "./support/side-panel-schema-fixture-primitives.mjs";

const original=execFileSync("git",["show","c55ba9a6b11a92efa25005194be84c4abc7a5a4b:test/support/side-panel-schema-fixture-primitives.mjs"],{encoding:"utf8"});
const oldProgram=(await import(`data:text/javascript;base64,${Buffer.from(original).toString("base64")}`)).guidedRuntimeWaitHelpers;
async function observe(program){
  let ready=false,settle;
  const pending=new Promise(resolve=>{settle=resolve;});
  const button={disabled:true,scrollIntoView(){},focus(){},addEventListener(){},getBoundingClientRect:()=>({left:0,top:0,width:20,height:20}),outerHTML:"<button>Request access</button>"};
  const context={document:{querySelector:selector=>selector==="#start-data-layer-testing:not(:disabled)"?(ready?{disabled:false}:null):selector.includes("permission-recovery")?button:null,elementFromPoint:()=>button},navigator:{userActivation:{isActive:true}},requestAnimationFrame:callback=>queueMicrotask(callback),setTimeout:callback=>queueMicrotask(callback),__swarmforgePermissionRequestPromise:pending};
  const timer=setTimeout(()=>{ready=true;settle(true);},15);
  try{await vm.runInNewContext(`${program}; waitForStartableSelectedTarget()`,context);return {startReady:true,prematureTimeout:false};}
  catch(error){assert.match(error.message,/Timed out waiting/);return {startReady:false,prematureTimeout:!ready};}
  finally{clearTimeout(timer);settle(true);}
}
const before=await observe(oldProgram),after=await observe(guidedRuntimeWaitHelpers);
assert.deepEqual(before,{startReady:false,prematureTimeout:true});
assert.deepEqual(after,{startReady:true,prematureTimeout:false},"The native permission phase must settle before the page readiness budget runs");
const normalize=value=>Array.isArray(value)?value.map(normalize):value&&typeof value==="object"?Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,normalize(v)])):value;
const digest=value=>createHash("sha256").update(JSON.stringify(normalize(value))).digest("hex");
if(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION){
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const fixture={id:"native-permission-before-page-readiness-v1",causalCategory:context.causalCategory,diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{readinessPolls:150,nativeRequest:"pending until after the original readiness budget"},expectedPreRepairFailure:before,expectedRepairResult:after};
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,preRepairResult:{status:"failed",fixtureDigest:digest(fixture),observed:before},repairResult:{status:"passed",fixtureDigest:digest(fixture),observed:after}}}));
}
console.log("Native permission request and page readiness use separate phases.");
