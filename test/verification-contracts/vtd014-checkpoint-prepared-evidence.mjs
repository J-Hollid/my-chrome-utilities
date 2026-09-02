import { emitPreparedEvidence } from
  "../../scripts/verification-evidence/prepared-acceptance-evidence.mjs";

const trueResult = { requirement:"true" };
const preflightRow = {
  action:{ requirement:"nonempty" },
  taskExecution:{ requirement:"nonempty" },
  observed:trueResult,
};
const driftRow = {
  stoppedBeforeLaunch:trueResult,
  retainedForDiagnosis:trueResult,
  noFreshAttempt:trueResult,
  executionContractIncident:trueResult,
};

const vtd014CheckpointPreparedEvidenceContract = {
  singleton:trueResult,
  attachedWithoutDuplicate:trueResult,
  continuation:trueResult,
  reusedOnlyPassed:trueResult,
  interruptedAndUnstartedOnly:trueResult,
  packagePlanned:trueResult,
  promotionOnly:trueResult,
  promotionScopes:{
    "completed receipt finalization is interrupted":{ requirement:"nonempty" },
    "pending evidence creation is interrupted":{ requirement:"nonempty" },
    "Git-note recording loses its lock or permission":{ requirement:"nonempty" },
    "handoff eligibility cannot read durable evidence":{ requirement:"nonempty" },
  },
  preflightRows:{
    "every prerequisite is satisfied and no attempt exists":preflightRow,
    "one compatible incomplete attempt already exists":preflightRow,
    "another owner holds an incompatible active lease":preflightRow,
    "a lease is demonstrably stale":preflightRow,
    "a required executable or bounded output capacity is unavailable":preflightRow,
  },
  driftRows:{
    "the candidate commit or tree changes":driftRow,
    "the registry or canonical plan changes":driftRow,
    "the locked toolchain identity changes":driftRow,
    "the built artifact identity changes":driftRow,
  },
  identityDriftRejected:trueResult,
  staleOwnerRecovered:trueResult,
  forgedAttemptRejected:{
    missingResult:trueResult,
    extraResult:trueResult,
    forgedResult:trueResult,
    impossibleState:trueResult,
    reorderedTransitions:trueResult,
    duplicatedTransition:trueResult,
    promotionDrift:trueResult,
  },
};

export function emitVtd014CheckpointPreparedEvidence(checkpointEvidence) {
  emitPreparedEvidence("vtd014CheckpointAcceptance", checkpointEvidence,
    vtd014CheckpointPreparedEvidenceContract);
}
