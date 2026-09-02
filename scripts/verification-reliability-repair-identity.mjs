import { normalized } from "./verification-reliability-values.mjs";

function orderedAcceptanceTargetSubset(priorIdentity, currentIdentity) {
  const priorTargets = priorIdentity.target?.split(",") ?? [];
  const currentTargets = currentIdentity.target?.split(",") ?? [];
  if (!priorTargets.length || priorIdentity.args?.length !== 2 + priorTargets.length * 2 ||
      currentIdentity.args?.length !== 2 + currentTargets.length * 2) return false;
  let previousIndex = -1;
  return priorTargets.every((target, index) => {
    const currentIndex = currentTargets.indexOf(target, previousIndex + 1);
    if (currentIndex < 0) return false;
    previousIndex = currentIndex;
    return priorIdentity.args[2 + index * 2] === currentIdentity.args[2 + currentIndex * 2] &&
      priorIdentity.args[3 + index * 2] === currentIdentity.args[3 + currentIndex * 2];
  });
}

export function repairIdentityCompatible(priorIdentity, currentIdentity) {
  const ignoredFields = new Set(["requiredCapabilities"]);
  if (priorIdentity?.stage === "acceptance-session" &&
      currentIdentity?.stage === "acceptance-session") {
    const currentPrerequisites = new Set(currentIdentity.prerequisiteTaskKeys ?? []);
    if ((priorIdentity.prerequisiteTaskKeys ?? [])
      .some((key) => !currentPrerequisites.has(key)) ||
      !orderedAcceptanceTargetSubset(priorIdentity, currentIdentity)) return false;
    ignoredFields.add("args");
    ignoredFields.add("target");
    ignoredFields.add("prerequisiteTaskKeys");
  }
  const comparable = (identity) => normalized(Object.fromEntries(Object.entries(identity ?? {})
    .filter(([field]) => !ignoredFields.has(field))));
  return JSON.stringify(comparable(priorIdentity)) === JSON.stringify(comparable(currentIdentity));
}

export function repairExecutionArgs({
  priorIdentity,
  currentIdentity,
  successionArgs,
  diagnosedArgs,
}) {
  if (successionArgs) return [...successionArgs];
  const currentAcceptanceExecution = priorIdentity?.stage === "acceptance-session" &&
    JSON.stringify(priorIdentity.args) !== JSON.stringify(currentIdentity.args);
  return [...(currentAcceptanceExecution ? currentIdentity.args : diagnosedArgs)];
}
