export const exactSliceSuccessorTask="verification-process-exact-slice-execution";
export const exactSliceSuccessorBase="4aea38cdf4899dc0a606215cc106ab743533c2fa";
export const exactSliceSuccessorFocusedTaskKeys=[
  "unit:test/verification-contracts/exact-slice-execution-contract-test.mjs",
  "unit:test/verification-bootstrap/bootstrap-fast-path-test.mjs",
  "acceptance-parse:features/verification-process-exact-slice-execution.feature",
  "acceptance-generate:features/verification-process-exact-slice-execution.feature",
  "acceptance-session:verification_process",
  "package:extension",
];
export const exactSliceSuccessorClosureTaskKeys=[
  "build:dist",
  "unit:test/verification-policy-contract-routing-test.mjs",
  "unit:test/verification-contracts/registry-core-contract-test.mjs",
  "unit:test/verification-contracts/ownership-core-contract-test.mjs",
  "unit:test/verification-contracts/ownership-priority-contract-test.mjs",
  "unit:test/verification-contracts/dependency-expansion-contract-test.mjs",
  "unit:test/verification-contracts/exact-slice-execution-contract-test.mjs",
  "unit:test/verification-bootstrap/bootstrap-fast-path-test.mjs",
  "unit:test/verification-contracts/task-batching-contract-test.mjs",
  "property:test/verification-process-property-test.mjs",
  "acceptance-parse:features/verification-process-exact-slice-execution.feature",
  "acceptance-generate:features/verification-process-exact-slice-execution.feature",
  "acceptance-session:verification_process",
  "package:extension",
];

export function bindExactSliceSuccessorPlan(plan) {
  const selectedTaskKeys=exactSliceSuccessorClosureTaskKeys.filter((key)=>
    !["build:dist","package:extension"].includes(key));
  return {...plan,packIds:["verification_process"],selectedPackIds:["verification_process"],
    requestedPackIds:["verification_process"],claimPackIds:["verification_process"],
    parentPackSliceFallbacks:[],verificationSliceDiagnostics:[],
    selectedVerificationSlices:{verification_process:["task_batching"]},
    selectedVerificationSliceTaskKeys:{verification_process:selectedTaskKeys},
    verificationSliceConservation:{verification_process:{
      completeTaskKeys:selectedTaskKeys,sliceTaskKeys:selectedTaskKeys,
      remainderTaskKeys:[],conserved:true,
    }}};
}

export function validateExactSliceSuccessor({task,baseCommit,acceptedCandidate=false,plan}) {
  if (task!==exactSliceSuccessorTask) return {active:false};
  if (baseCommit!==exactSliceSuccessorBase) {
    throw new Error("Exact-slice successor base does not match its approved QA authority");
  }
  if (acceptedCandidate) throw new Error("Exact-slice successor authority expired on QA");
  const expected=new Set(exactSliceSuccessorClosureTaskKeys);
  const actual=plan.tasks.map(({key})=>key);
  if (actual.length!==expected.size||actual.some((key)=>!expected.has(key))) {
    throw new Error("Exact-slice successor plan does not match its fixed task closure");
  }
  if (plan.packIds.length!==1||plan.packIds[0]!=="verification_process"||
      plan.requestedPackIds?.length!==1||plan.requestedPackIds[0]!=="verification_process"||
      plan.claimPackIds?.length!==1||plan.claimPackIds[0]!=="verification_process"||
      (plan.parentPackSliceFallbacks??[]).length) {
    throw new Error("Exact-slice successor plan widened beyond its process slice");
  }
  return {active:true,taskKeys:actual};
}
