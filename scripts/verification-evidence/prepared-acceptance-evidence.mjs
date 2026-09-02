function hasValue(value) {
  if (Array.isArray(value) || typeof value === "string") return value.length > 0;
  return value !== null && typeof value === "object" ? Object.keys(value).length > 0 : value !== undefined;
}

export function validatePreparedEvidence(value, contract, path = []) {
  for (const [key, requirement] of Object.entries(contract)) {
    const nextPath = [...path, key];
    const actual = value?.[key];
    if (requirement?.requirement === "true" && actual !== true) {
      throw new Error(`Prepared evidence must be true at ${nextPath.join(".")}`);
    }
    if (requirement?.requirement === "nonempty" && !hasValue(actual)) {
      throw new Error(`Prepared evidence must be nonempty at ${nextPath.join(".")}`);
    }
    if (requirement?.requirement === "present" && actual === undefined) {
      throw new Error(`Prepared evidence is missing at ${nextPath.join(".")}`);
    }
    if (!requirement?.requirement) validatePreparedEvidence(actual, requirement, nextPath);
  }
  return value;
}

export function emitPreparedEvidence(name, value, contract) {
  validatePreparedEvidence(value, contract);
  console.log(JSON.stringify({ [name]:value }));
}
