import {timeoutIncidentDigest} from "../../verification-reliability-values.mjs";
import {
  buildDeterministicBaselineAdmission,
  deterministicBaselineAdmissionEntries,
  deterministicBaselineAdmissionsEquivalent,
} from "./baseline-evidence-admission.mjs";

export function groupDeterministicBaselineAdmissions(admissions) {
  if(admissions.length>1&&!admissions.every((admission)=>
    deterministicBaselineAdmissionsEquivalent(admissions[0],admission))) {
    throw new Error("Deterministic baseline incidents do not share one authenticated identity");
  }
  return admissions.length?{
    ...admissions[0],
    ...(admissions.length>1?{equivalentAdmissions:admissions.slice(1)}:{}),
  }:null;
}

export async function buildDeterministicBaselineReviewAdmission({incidents,common,root}) {
  return groupDeterministicBaselineAdmissions(await Promise.all(incidents.map((incident)=>
    buildDeterministicBaselineAdmission({incident,...common,root}))));
}

export async function revalidateDeterministicBaselineReviewAdmission({
  admission,current,common,root,phase,
}) {
  if(!admission)return;
  const rebuilt=groupDeterministicBaselineAdmissions(await Promise.all(
    deterministicBaselineAdmissionEntries(admission).map((entry)=>
      buildDeterministicBaselineAdmission({incident:current.get(entry.incidentId),
        ...common,root}))));
  if(timeoutIncidentDigest(rebuilt)!==timeoutIncidentDigest(admission)) {
    throw new Error(`Deterministic baseline admission changed ${phase}`);
  }
}
