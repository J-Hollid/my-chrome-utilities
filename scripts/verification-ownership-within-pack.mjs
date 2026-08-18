import {verificationPackTaskKeys} from "./verification-packs.mjs";
import {canonicalValues,stableSliceId,uniqueStrings} from "./verification-ownership-paths.mjs";

const arrayOrEmpty=(value)=>value??[];

function validatePrimaryIdentity(value) {
  if (!value||Array.isArray(value)) return false;
  return stableSliceId(value.sliceId)&&typeof value.parentPackId==="string";
}

function validateDirectTasks(value) {
  if (!uniqueStrings(value.directTaskKeys)||!value.directTaskKeys.length) return false;
  return uniqueStrings(arrayOrEmpty(value.prerequisiteTaskKeys));
}

function validateUnrelatedTasks(value) {
  return uniqueStrings(value.unrelatedTaskKeys)&&value.unrelatedTaskKeys.length>0;
}

function validateIdentityShape(value) {
  return validatePrimaryIdentity(value)&&validateDirectTasks(value)&&validateUnrelatedTasks(value);
}

function validateMeaningShape(value) {
  if (typeof value.observableBoundary!=="string") return false;
  if (!value.observableBoundary.trim()) return false;
  return value.meaningPreserved===true;
}

function validateDeclaration(value,intent,packs) {
  const pack=packs.find(({id})=>id===value.parentPackId);
  if (!pack||!intent.approvedPackIds.includes(pack.id)) {
    throw new Error("Within-pack materiality requires an approved parent pack");
  }
  const declared=(pack.verificationSlices??[]).find(({id})=>id===value.sliceId);
  const proposed=intent.proposedPrefixes.find(({parentPackId,sliceId})=>
    parentPackId===pack.id&&sliceId===value.sliceId);
  if (!declared&&!proposed) {
    throw new Error("Within-pack materiality requires a declared or structured proposed slice");
  }
  return {pack,declared};
}

function validateDeclaredTasks(value,declared) {
  if (!declared) return;
  if (JSON.stringify(canonicalValues(arrayOrEmpty(declared.tasks)))!==
      JSON.stringify(canonicalValues(value.directTaskKeys))) {
    throw new Error("Within-pack materiality conflicts with the current slice declaration");
  }
  if (JSON.stringify(canonicalValues(arrayOrEmpty(declared.prerequisites)))!==
      JSON.stringify(canonicalValues(arrayOrEmpty(value.prerequisiteTaskKeys)))) {
    throw new Error("Within-pack materiality conflicts with the current slice declaration");
  }
  if (declared.observableBoundary!==value.observableBoundary) {
    throw new Error("Within-pack materiality conflicts with the current slice declaration");
  }
}

function taskConservation(value,pack) {
  const complete=[...verificationPackTaskKeys(pack)].sort();
  const prerequisites=arrayOrEmpty(value.prerequisiteTaskKeys);
  const selected=canonicalValues([...value.directTaskKeys,...prerequisites]);
  const unrelated=complete.filter((key)=>!selected.includes(key));
  if (value.directTaskKeys.some((key)=>prerequisites.includes(key))) return null;
  if (selected.some((key)=>!complete.includes(key))) return null;
  if (JSON.stringify(canonicalValues(value.unrelatedTaskKeys))!==JSON.stringify(unrelated)) return null;
  return {complete,selected,unrelated};
}

export function validateWithinPackMateriality(value,intent,packs) {
  if (value===undefined) return undefined;
  if (!validateIdentityShape(value)||!validateMeaningShape(value)) {
    throw new Error("Within-pack materiality requires a stable observable slice and exact task families");
  }
  const {pack,declared}=validateDeclaration(value,intent,packs);
  validateDeclaredTasks(value,declared);
  const conserved=taskConservation(value,pack);
  if (!conserved) throw new Error("Within-pack materiality must conserve the parent pack task closure");
  return {parentPackId:pack.id,sliceId:value.sliceId,directTaskKeys:canonicalValues(value.directTaskKeys),
    prerequisiteTaskKeys:canonicalValues(arrayOrEmpty(value.prerequisiteTaskKeys)),
    unrelatedTaskKeys:conserved.unrelated,observableBoundary:value.observableBoundary,
    unrelatedCompleteTaskFamily:true,stableObservableBoundary:true,
    reducesTaskScope:conserved.selected.length<conserved.complete.length,meaningPreserved:true};
}
