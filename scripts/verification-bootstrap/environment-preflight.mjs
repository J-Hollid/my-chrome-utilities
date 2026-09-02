import {constants} from "node:fs";
import {access,readFile} from "node:fs/promises";
import path from "node:path";

import {runCompactConservationCommand} from
  "../verification-registry/compact-conservation-command.mjs";
import {createTimeoutIncidentStore} from "../verification-reliability-store.mjs";
import {fixedBootstrapRegistry} from "./fixed-registry.mjs";
import {validateBootstrapEarlyGate} from "./preflight.mjs";
import {prepareMutationCapability} from "./mutation-capability.mjs";

async function executableAvailable(executable) {
  const candidates=(process.env.PATH??"").split(path.delimiter)
    .filter(Boolean).map((directory)=>path.join(directory,executable));
  for (const candidate of candidates) {
    try { await access(candidate,constants.X_OK);return true; }
    catch { /* Continue to the next PATH entry. */ }
  }
  return false;
}

async function handlerClosure(root) {
  const [handler,session,feature]=await Promise.all([
    readFile(path.join(root,"acceptance/src/acceptance/verification_support/bootstrap_fast_path_handlers.clj"),"utf8"),
    readFile(path.join(root,"acceptance/src/acceptance/bootstrap_session.clj"),"utf8"),
    readFile(path.join(root,"features/verification-process-bootstrap-fast-path.feature"),"utf8"),
  ]);
  const entry="a user-approved process-only transition has an exact base commit and stable task";
  return {closed:handler.includes("feature-scoped-stateful-handlers")&&handler.includes(entry)&&
    handler.includes("features/verification-process-bootstrap-fast-path.feature")&&
    session.includes("bootstrap/handlers")&&session.includes("with-redefs")&&feature.includes(entry)};
}

function repairProtocols(incidents) {
  return incidents.flatMap((incident)=>{
    const key=incident.repair?.regression?.key;
    const selected=incident.repair?.focusedTaskPlan?.find(({identity})=>identity?.key===key);
    return incident.repair?.causalProtocol&&selected
      ?[{incidentId:incident.id,taskKey:selected.identity.key}]:[];
  });
}

export async function bootstrapEnvironmentState({root,plan,candidateCommit}) {
  const registry=fixedBootstrapRegistry();
  const [conservation,closure,incidents]=await Promise.all([
    runCompactConservationCommand(["check"],{root}),handlerClosure(root),
    createTimeoutIncidentStore({root}).blocking({commit:candidateCommit}),
  ]);
  const mutationCapability=await prepareMutationCapability({root});
  const names=[...new Set(plan.tasks.map(({executable})=>executable))];
  const executables=Object.fromEntries(await Promise.all(names.map(async(name)=>
    [name,await executableAvailable(name)])));
  const required=new Set(registry.requiredIncidentIds);
  const scopedIncidents=incidents.filter(({id})=>required.has(id));
  if (scopedIncidents.length!==required.size) {
    throw new Error("Bootstrap early gate required repair incident is unavailable");
  }
  return {plan,conservation,handlerClosure:closure,incidents:scopedIncidents,
    repairProtocols:repairProtocols(scopedIncidents),executables,
    availableCapabilities:[mutationCapability.capability],
    maximumOutputBytes:registry.maximumOutputBytes,
    incidentIds:scopedIncidents.map(({id})=>id).sort()};
}

export function validateBootstrapEnvironmentPreflight(state,evidenceState) {
  const gate=validateBootstrapEarlyGate({...state,evidenceState});
  return {...state,gate,evidenceState};
}
