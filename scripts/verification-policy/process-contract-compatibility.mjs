import {validateExactSliceAggregate} from
  "../verification-execution/exact-slice-control.mjs";
import {verificationProcessTransitionSuccessors} from "./contracts.mjs";

export function runVerificationProcessCompatibility({
  successors=verificationProcessTransitionSuccessors,tasks,results,
}={}) {
  if (!Array.isArray(tasks)||!Array.isArray(results)) {
    throw new Error("Verification process compatibility requires bound child tasks and results; use the canonical exact-slice runner");
  }
  const expectedKeys=successors.map((path)=>`unit:${path}`);
  if (tasks.length!==expectedKeys.length||tasks.some(({key},index)=>key!==expectedKeys[index])) {
    throw new Error("Verification process compatibility tasks do not match the canonical child order");
  }
  return validateExactSliceAggregate(tasks,results);
}
