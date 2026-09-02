import {verificationProcessTransitionSuccessors} from
  "../verification-policy/contracts.mjs";

export const exactSliceSuccessorTask="verification-process-exact-slice-execution";
export const exactSliceSuccessorBase="4aea38cdf4899dc0a606215cc106ab743533c2fa";
export const exactSliceTransitionTaskKeys=Object.freeze(
  verificationProcessTransitionSuccessors.map((path)=>`unit:${path}`));

const exactPackIds=Object.freeze(["shell","verification_process"]);
const same=(left,right)=>JSON.stringify(left)===JSON.stringify(right);
const sorted=(values)=>[...values].sort();

function validateDerivedConservation(plan) {
  for(const packId of exactPackIds){
    const selected=sorted(plan.selectedVerificationSliceTaskKeys?.[packId]??[]);
    const conservation=plan.verificationSliceConservation?.[packId];
    const conservedSlice=new Set(conservation?.sliceTaskKeys??[]);
    if(!conservation?.conserved||selected.some((key)=>!conservedSlice.has(key))){
      throw new Error(`Exact-slice successor lacks derived ${packId} slice conservation`);
    }
    const complete=sorted(conservation.completeTaskKeys??[]);
    const slice=sorted(conservation.sliceTaskKeys??[]);
    const remainder=sorted(conservation.remainderTaskKeys??[]);
    if(new Set([...slice,...remainder]).size!==slice.length+remainder.length||
        !same(complete,sorted([...slice,...remainder]))){
      throw new Error(`Exact-slice successor ${packId} parent closure is not conserved`);
    }
  }
}

export function bindExactSliceSuccessorPlan(plan) {
  return {...plan,packIds:[...exactPackIds],selectedPackIds:[...exactPackIds],
    requestedPackIds:[...exactPackIds],claimPackIds:[...exactPackIds]};
}

export function validateExactSliceSuccessor({task,baseCommit,acceptedCandidate=false,plan}) {
  if(task!==exactSliceSuccessorTask)return {active:false};
  if(baseCommit!==exactSliceSuccessorBase){
    throw new Error("Exact-slice successor base does not match its approved QA authority");
  }
  if(acceptedCandidate)throw new Error("Exact-slice successor authority expired on QA");
  const packClaims=[plan.packIds,plan.requestedPackIds,plan.selectedPackIds,
    plan.claimPackIds??plan.packIds];
  if(packClaims.some((ids)=>!same(ids,exactPackIds))){
    throw new Error("Exact-slice successor plan widened beyond its approved pack set");
  }
  if((plan.parentPackSliceFallbacks??[]).length||(plan.verificationSliceDiagnostics??[]).length){
    throw new Error("Exact-slice successor plan has unresolved ownership or parent fallback");
  }
  validateDerivedConservation(plan);
  const actual=plan.tasks.map(({key})=>key);
  const actualSet=new Set(actual);
  if(actualSet.size!==actual.length||!actualSet.has("build:dist")||
      !actualSet.has("package:extension")){
    throw new Error("Exact-slice successor plan has an invalid task identity closure");
  }
  const selected=Object.values(plan.selectedVerificationSliceTaskKeys??{}).flat();
  const derived=new Set(["build:dist","package:extension",...selected,
    ...(plan.propertyTasks??[]).map(({key})=>key)]);
  if(derived.size!==actualSet.size||actual.some((key)=>!derived.has(key))){
    throw new Error("Exact-slice successor tasks are not derived from selected slice ownership");
  }
  const missingTransitions=exactSliceTransitionTaskKeys.filter((key)=>!actualSet.has(key));
  if(missingTransitions.length){
    throw new Error(`Exact-slice successor omits transitioned child owners: ${
      missingTransitions.join(", ")}`);
  }
  return {active:true,taskKeys:actual,transitionTaskKeys:[...exactSliceTransitionTaskKeys]};
}
