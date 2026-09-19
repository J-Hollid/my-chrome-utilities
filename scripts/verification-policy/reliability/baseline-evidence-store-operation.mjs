import {timeoutIncidentDigest} from "../../verification-reliability-values.mjs";
import {transition} from "../../verification-reliability-persistence.mjs";
import {createDeterministicBaselineAdmission} from "./baseline-evidence-admission.mjs";

export function createRecordDeterministicBaselineProof({read,update,now}) {
  return async(id,{binding,baseReceipt,candidateReceipt,baseSource,candidateSource})=>{
    const incident=await read(id);
    const admission=createDeterministicBaselineAdmission({...binding,
      incidentId:id,failureDigest:incident.failureDigest,
      baseReceipt,candidateReceipt,baseSource,candidateSource});
    return update(id,(current)=>{
      if(current.state!=="unresolved"||current.failureDigest!==incident.failureDigest) {
        throw new Error(`Reliability incident ${id} changed before baseline classification`);
      }
      const recordedAt=now();
      const unsigned={version:1,status:"eligible",incidentId:id,failureDigest:current.failureDigest,
        binding:structuredClone(binding),baseReceipt:structuredClone(baseReceipt),
        candidateReceipt:structuredClone(candidateReceipt),baseSource:structuredClone(baseSource),
        candidateSource:structuredClone(candidateSource),admissionDigest:timeoutIncidentDigest(admission),
        recordedAt};
      const proof={...unsigned,digest:timeoutIncidentDigest(unsigned)};
      return transition({...current,deterministicBaselineProof:proof},
        "deterministic-baseline-classified",recordedAt,{admissionDigest:proof.admissionDigest});
    });
  };
}
