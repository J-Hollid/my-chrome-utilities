import {expandVerificationTaskPrerequisites} from
  "../verification-execution-prerequisites.mjs";
import {createVerificationPackCardinalityAdapter} from
  "../verification-pack-cardinality/contract.mjs";
import {planVerification} from "../verification-packs.mjs";

const evidenceTaskGroups = [
  "preparationTasks", "unitTasks", "propertyTasks", "browserTasks", "observationTasks",
  "parserTasks", "generatorTasks", "checkpointTasks", "sessionTasks", "packageTasks",
];

function closeEvidencePlanPrerequisites(plan, canonicalPlan, {
  allowMissingAcceptanceSessionExternalPrerequisites = false,
} = {}) {
  const tasks = expandVerificationTaskPrerequisites(plan.tasks, canonicalPlan.tasks,
    {mode:plan.mode, allowMissingAcceptanceSessionExternalPrerequisites});
  const groupsByTask = new Map();
  for (const source of [canonicalPlan, plan]) {
    for (const group of evidenceTaskGroups) {
      for (const task of source[group] ?? []) groupsByTask.set(task.key, group);
    }
  }
  const groups = Object.fromEntries(evidenceTaskGroups.map((group) => [group,
    tasks.filter(({key}) => groupsByTask.get(key) === group)]));
  return {...plan, ...groups, tasks:evidenceTaskGroups.flatMap((group) => groups[group])};
}

export function closeCanonicalEvidencePlanPrerequisites(plan, candidatePacks, {
  allowLegacySourceLess = false,
  allowMissingAcceptanceSessionExternalPrerequisites = false,
} = {}) {
  const runnablePackIds = createVerificationPackCardinalityAdapter(candidatePacks,
    {allowLegacySourceLess}).runnablePackIds;
  return closeEvidencePlanPrerequisites(plan, planVerification(candidatePacks, {
    packIds:runnablePackIds,
    includeProperties:true,
  }), {allowMissingAcceptanceSessionExternalPrerequisites});
}
