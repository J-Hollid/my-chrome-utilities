import {verificationTaskIdentity} from "../verification-packs.mjs";
import {verificationTaskPrerequisiteKeys} from
  "../verification-execution-prerequisites.mjs";

const maximumForecastMs=300_000;

function same(left,right) {
  return JSON.stringify(left)===JSON.stringify(right);
}

export function exactSlicePrerequisiteClosureTaskKeys(plan) {
  const actual=new Set(plan.tasks.map(({key})=>key));
  const allowed=new Set(["build:dist","package:extension",
    ...Object.values(plan.selectedVerificationSliceTaskKeys??{}).flat(),
    ...plan.tasks.filter(({stage})=>stage==="property").map(({key})=>key)]);
  const tasksByKey=new Map(plan.tasks.map((task)=>[task.key,task]));
  const pending=[...allowed];
  for(let index=0;index<pending.length;index+=1){
    const task=tasksByKey.get(pending[index]);
    if(!task)continue;
    for(const prerequisiteKey of verificationTaskPrerequisiteKeys(task,plan.tasks)){
      if(!actual.has(prerequisiteKey)||allowed.has(prerequisiteKey))continue;
      allowed.add(prerequisiteKey);
      pending.push(prerequisiteKey);
    }
  }
  return allowed;
}

export function validateExactSliceAggregate(tasks,results) {
  const expected=new Map(tasks.map((task)=>[task.key,verificationTaskIdentity(task)]));
  const counts=new Map();
  for (const result of results) counts.set(result.key,(counts.get(result.key)??0)+1);
  for (const [key,identity] of expected) {
    const result=results.find((candidate)=>candidate.key===key);
    if (!result) throw new Error(`Exact-slice aggregate is missing child: ${key}`);
    if (counts.get(key)!==1) throw new Error(`Exact-slice aggregate has duplicate child: ${key}`);
    if (result.status!=="passed") throw new Error(`Exact-slice aggregate has failed child: ${key}`);
    if (!same(result.identity,identity)) throw new Error(`Exact-slice aggregate has changed child: ${key}`);
  }
  if (results.some(({key})=>!expected.has(key))) {
    throw new Error("Exact-slice aggregate has an unselected child");
  }
  return results.map((result)=>structuredClone(result));
}

export function validateExactSliceReceiptAggregate(plan,receiptTasks) {
  const results=plan.tasks.flatMap(({key})=>Object.hasOwn(receiptTasks,key)
    ? [{key,...structuredClone(receiptTasks[key])}] : []);
  return validateExactSliceAggregate(plan.tasks,results);
}

export function validateExactSliceLaunch(plan,{forecastMs,masterMode=false}={}) {
  if (!Number.isFinite(forecastMs)||forecastMs<0||forecastMs>maximumForecastMs) {
    throw new Error("Exact-slice launch exceeds the five-minute forecast limit");
  }
  if ((plan.parentPackSliceFallbacks??[]).length) {
    throw new Error("Exact-slice launch cannot use a parent-pack fallback");
  }
  if ((plan.verificationSliceDiagnostics??[]).length) {
    throw new Error("Exact-slice launch has unresolved slice diagnostics");
  }
  const taskKeys=plan.tasks.map(({key})=>key);
  if (new Set(taskKeys).size!==taskKeys.length) {
    throw new Error("Exact-slice launch has a duplicate task identity");
  }
  const selectedSlices=plan.selectedVerificationSlices??{};
  const sliceIds=Object.values(selectedSlices).flat().sort();
  if (!masterMode&&!sliceIds.length) {
    throw new Error("Exact-slice launch has no selected process slice");
  }
  if (!masterMode) {
    const allowed=exactSlicePrerequisiteClosureTaskKeys(plan);
    const unrelated=taskKeys.filter((key)=>!allowed.has(key));
    if (unrelated.length) {
      throw new Error(`Exact-slice launch selected unrelated tasks: ${unrelated.join(", ")}`);
    }
  }
  const conservation=plan.verificationSliceConservation?.verification_process;
  if (!conservation?.conserved) throw new Error("Exact-slice task conservation failed");
  if (masterMode&&conservation.remainderTaskKeys.length) {
    throw new Error("Exact-slice parent closure does not equal the slice union");
  }
  return {taskKeys:[...taskKeys],sliceIds:[...sliceIds],forecastMs};
}

export function exactSliceLaunchRequired(plan,evidenceTask) {
  if (evidenceTask==="verification-process-exact-slice-execution") return true;
  return plan.packIds?.length===1&&plan.packIds[0]==="verification_process"&&
    Object.keys(plan.selectedVerificationSlices??{}).length>0;
}
