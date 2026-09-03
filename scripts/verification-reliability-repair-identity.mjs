import { normalized } from "./verification-reliability-values.mjs";

export function repairIdentityCompatible(priorIdentity, currentIdentity) {
  const ignoredFields = new Set(["requiredCapabilities"]);
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
  return [...diagnosedArgs];
}
