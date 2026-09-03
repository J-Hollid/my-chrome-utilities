import assert from "node:assert/strict";

import {timeoutIncidentDigest} from "../../scripts/verification-reliability-incidents.mjs";
import {verificationTaskDigest} from "../../scripts/verification-task-succession.mjs";

export function verifyEligibleRepairReceiptValidation({
  admissions, admittedReceipt, selectedTask, validate,
}) {
  assert.equal(validate(admittedReceipt, admissions), admissions,
    "the receipt requires the selected admission leaf and package to pass freshly");
  assert.throws(()=>validate(admittedReceipt, {
    ...admissions, entries:[...admissions.entries, structuredClone(admissions.entries[0])],
  }), /sorted and unique/iu, "duplicate admission entries fail closed");
  assert.throws(()=>validate(admittedReceipt, {
    ...admissions, entries:[{...admissions.entries[0],coverageKind:"invented-coverage"}],
  }), /malformed or causally conflicting/iu, "unknown coverage kinds fail closed");
  assert.throws(()=>validate(admittedReceipt, {
    ...admissions, entries:[{...admissions.entries[0],selectedTaskKey:"package:canonical",
      selectedTaskDigest:verificationTaskDigest({key:"package:canonical",stage:"package"})}],
  }), /malformed or causally conflicting/iu,
  "regression coverage cannot name an unrelated freshly passing task");
  assert.throws(()=>validate(admittedReceipt, {
    ...admissions,entries:[{...admissions.entries[0],unexpected:true}],
  }), /malformed or causally conflicting/iu, "extra admission fields fail closed");
  assert.throws(()=>validate(admittedReceipt, {
    ...admissions,entries:[{...admissions.entries[0],coverageKind:"successor"}],
  }), /malformed or causally conflicting/iu,
  "successor coverage requires exact conservation fields");

  const successorIdentity={...selectedTask,prerequisiteTaskKeys:["build:dist"]};
  const selectedTaskDigest=verificationTaskDigest(successorIdentity);
  const sourceEntry=admissions.entries[0];
  const compatibilityUnsigned={version:1,kind:"ancestor-eligible-repair",
    repairCandidateCommit:"a".repeat(40),repairCandidateTree:"b".repeat(40),
    currentCandidateCommit:admissions.candidateCommit,
    currentCandidateTree:admissions.candidateTree,ancestry:"git-merge-base-is-ancestor",
    regressionReceiptSha256:"c".repeat(64),focusedReceiptSha256:"d".repeat(64),
    repairDigest:sourceEntry.repairDigest,sourceTaskDigest:sourceEntry.governedTaskDigest,
    selectedTaskDigest,packageTaskDigest:"e".repeat(64),coverageKind:"successor",
    destinationTaskDigest:selectedTaskDigest,conservationDigest:"f".repeat(64)};
  const successorEntry={...sourceEntry,selectedTaskDigest,coverageKind:"successor",
    destinationTaskDigest:selectedTaskDigest,conservationDigest:"f".repeat(64),
    ancestorRepairCompatibility:{...compatibilityUnsigned,
      digest:timeoutIncidentDigest(compatibilityUnsigned)}};
  const successorAdmissions={...admissions,entries:[successorEntry]};
  const successorReceipt={...admittedReceipt,eligibleRepairAdmissions:successorAdmissions,
    tasks:{...admittedReceipt.tasks,[selectedTask.key]:{identity:successorIdentity,
      status:"passed",provenance:"fresh"}}};
  assert.equal(validate(successorReceipt,successorAdmissions),successorAdmissions,
    "authenticated succession may keep the task key when the task identity changes");
  const {ancestorRepairCompatibility,...unauthenticatedSuccessor}=successorEntry;
  assert.throws(()=>validate(successorReceipt,{...successorAdmissions,
    entries:[unauthenticatedSuccessor]}),/malformed or causally conflicting/iu,
  "same-key succession requires authenticated ancestor compatibility");
  assert.throws(()=>validate(successorReceipt,{...successorAdmissions,entries:[{
    ...successorEntry,ancestorRepairCompatibility:{...ancestorRepairCompatibility,
      digest:"0".repeat(64)},
  }]}),/malformed or causally conflicting/iu,
  "same-key succession rejects an invalid compatibility digest");
}
