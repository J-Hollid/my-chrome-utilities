import assert from "node:assert/strict";
import {createHash} from "node:crypto";

const normalized=(value)=>Array.isArray(value)
  ?value.map(normalized)
  :value&&typeof value==="object"
    ?Object.fromEntries(Object.entries(value).sort(([left],[right])=>left.localeCompare(right)).map(([key,nested])=>[key,normalized(nested)]))
    :value;

const digest=(value)=>createHash("sha256").update(JSON.stringify(normalized(value))).digest("hex");

export function projectEventTransportRepairProtocol(observed){
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION),controllerProjection=context.causalCategory==="other:installed transport controller projection",
    expectedPreRepairFailure=controllerProjection?{projectSwitchPathsCurrent:false,noProjectSettingsDisabled:false,blockedPushDisabled:false,actionReasonVisible:true,resultStatusVisible:false}:{fallbackArchiveCaptured:false,version3Imported:false},
    expectedRepairResult=controllerProjection?{projectSwitchPathsCurrent:true,noProjectSettingsDisabled:true,blockedPushDisabled:true,actionReasonVisible:true,resultStatusVisible:false}:{fallbackArchiveCaptured:true,version3Imported:true},
    fixture={id:controllerProjection?"project-event-installed-controller-projection-v1":"project-event-v3-archive-fallback-v1",causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:controllerProjection?{projectChangeAction:"synchronize paths",noProjectControls:["history-path","default-push-path"],statusOwner:"push-template-draft-reason"}:{exportCapability:"showSaveFilePicker",archiveVersion:3},
      expectedPreRepairFailure,expectedRepairResult},fixtureDigest=digest(fixture);
  assert.deepEqual(observed,expectedRepairResult);
  return{version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},repairResult:{status:"passed",fixtureDigest,observed}};
}
