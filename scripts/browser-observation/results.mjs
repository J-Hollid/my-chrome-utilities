export function mergeObservationDocument(target, observed) {
  for (const [key, value] of Object.entries(observed)) {
    if (target[key] && value && typeof target[key] === "object" && typeof value === "object" &&
        !Array.isArray(target[key]) && !Array.isArray(value)) Object.assign(target[key], value);
    else target[key] = structuredClone(value);
  }
}

function evidenceLeafValue(document, segments, index = 0) {
  if (index === segments.length) return document;
  if (!document || typeof document !== "object") return undefined;
  if (Object.hasOwn(document, segments[index])) {
    const nested = evidenceLeafValue(document[segments[index]], segments, index + 1);
    if (nested !== undefined) return nested;
  }
  for (let end = segments.length; end > index + 1; end -= 1) {
    const literalKey = segments.slice(index, end).join(".");
    if (Object.hasOwn(document, literalKey)) {
      const nested = evidenceLeafValue(document[literalKey], segments, end);
      if (nested !== undefined) return nested;
    }
  }
  return undefined;
}

export function parseBrowserObservationOutput(stdout, observation) {
  const lines = stdout.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
  const keys = observation.observationKeys ?? [observation.observationKey].filter(Boolean);
  const document = {}, fallback = {};
  let found = false, pendingObserved;
  for (const line of lines) {
    try {
      const candidate = JSON.parse(line);
      if (candidate?.swarmforgeBrowserTargetResult?.id === observation.id) {
        if (pendingObserved && keys.every((key) => Object.hasOwn(pendingObserved, key))) {
          mergeObservationDocument(document, pendingObserved);
          found = true;
        }
        pendingObserved = undefined;
        continue;
      }
      if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
        const observed = Object.fromEntries(Object.entries(candidate)
          .filter(([key]) => key !== "swarmforgeBrowserTargetTiming" &&
            key !== "swarmforgeBrowserTargetResult"));
        const targetObserved = Object.fromEntries(Object.entries(observed)
          .filter(([key]) => keys.includes(key)));
        if (Object.keys(targetObserved).length) {
          pendingObserved = targetObserved;
          mergeObservationDocument(fallback, targetObserved);
        } else if (Object.keys(observed).length) pendingObserved = undefined;
      }
    } catch { /* diagnostic output may precede the adapter JSON */ }
  }
  if (!found && Object.keys(fallback).length) {
    mergeObservationDocument(document, fallback);
    found = true;
  }
  if (!found) throw new Error(`Browser observation ${observation.id} did not emit a JSON object`);
  const missing = keys.filter((key) => !Object.hasOwn(document, key) || document[key] == null);
  if (missing.length) {
    throw new Error(`Browser observation ${observation.id} omitted required key(s): ${missing.join(", ")}`);
  }
  const missingLeaves = (observation.evidenceLeaves ?? []).filter((leaf) => {
    return evidenceLeafValue(document, leaf) !== true;
  });
  if (missingLeaves.length) {
    throw new Error(`Browser observation ${observation.id} omitted or failed assigned assertion leaf(s): ${missingLeaves.map((leaf) => leaf.join(" → ")).join(", ")}`);
  }
  return document;
}

export function parseBrowserObservationBatchOutput(stdout, observations) {
  const document = {};
  const results = {};
  const failures = [];
  const targetResults = new Map();
  for (const line of stdout.split(/\r?\n/u)) {
    try {
      const result = JSON.parse(line).swarmforgeBrowserTargetResult;
      if (typeof result?.id === "string") targetResults.set(result.id, result);
    } catch { /* ordinary browser diagnostics are not target results */ }
  }
  for (const observation of observations) {
    const targetResult = targetResults.get(observation.id);
    if (targetResult?.status === "failed") {
      failures.push({ id:observation.id,
        message:targetResult.error ?? `${observation.id} browser target failed` });
      continue;
    }
    try {
      const result = parseBrowserObservationOutput(stdout, observation);
      results[observation.id] = result;
      mergeObservationDocument(document, result);
    } catch (error) {
      failures.push({ id:observation.id, message:error.message });
    }
  }
  return { document, results, failures };
}


export function emitBrowserObservationResultFailures(stdout,observations,failures,emit=console.log) {
  const allowed=new Set(observations.map(({id})=>id)),results=new Map();
  for(const line of stdout.split(/\r?\n/u)) {
    try {const result=JSON.parse(line).swarmforgeBrowserTargetResult;
      if(allowed.has(result?.id))results.set(result.id,result);
    } catch { /* Ordinary child diagnostics are not result records. */ }
  }
  for(const failure of failures) {
    if(!allowed.has(failure.id))throw new Error("Result failure names an undeclared browser target");
    const previous=results.get(failure.id);
    if(previous?.status==="failed")continue;
    emit(JSON.stringify({swarmforgeBrowserTargetResult:{id:failure.id,status:"failed",
      phase:"result-validation",error:failure.message,
      ...(Number.isFinite(previous?.durationMs)?{durationMs:previous.durationMs}:{})}}));
  }
}

export function emitValidatedBrowserObservationResults(stdout,observations,parsed,emit=console.log) {
  emitBrowserObservationResultFailures(stdout,observations,parsed.failures,emit);
  const passed=new Map();
  for(const line of stdout.split(/\r?\n/u)) {
    try {
      const result=JSON.parse(line).swarmforgeBrowserTargetResult;
      if(Object.hasOwn(parsed.results,result?.id)&&result.status==="passed")passed.set(result.id,result);
    } catch { /* Ordinary child diagnostics are not result records. */ }
  }
  for(const result of passed.values())emit(JSON.stringify({swarmforgeBrowserTargetResult:result}));
}
