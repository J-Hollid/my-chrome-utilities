import { emitPreparedEvidence } from
  "../../scripts/verification-evidence/prepared-acceptance-evidence.mjs";

const vtd014ExecutionPreparedEvidenceContract = {
  prerequisites:{
    workspaceNarrow:{ requirement:"true" },
    mixedRouteObservation:{
      scoped:{ requirement:"nonempty" },
      workspace:{ requirement:"nonempty" },
    },
  },
  runIntent:{ requirement:"nonempty" },
};

export function emitVtd014ExecutionPreparedEvidence({ prerequisites, runIntent }) {
  emitPreparedEvidence("vtd014ExecutionAcceptance", { prerequisites, runIntent },
    vtd014ExecutionPreparedEvidenceContract);
}
