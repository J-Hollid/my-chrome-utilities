import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { assertFreshDist } from "./dist-artifact.mjs";
import { withDistArtifactLock } from "./dist-artifact-lock.mjs";
import {
  browserObservationEvidenceLeaves,
  browserObservationSessionBatch,
  loadVerificationPacks,
} from "./verification-packs.mjs";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));

function observationById(packs, id) {
  const matches = packs.flatMap((pack) => (pack.browserObservations ?? [])
    .filter((observation) => observation.id === id)
    .map((observation) => ({ packId:pack.id, observation })));
  if (matches.length !== 1) throw new Error(`Unknown or ambiguous browser observation id: ${id}`);
  const match = matches[0];
  const observation = {
    ...match.observation,
    evidenceLeaves:browserObservationEvidenceLeaves(
      packs.find(({ id }) => id === match.packId), match.observation,
    ),
    sessionBatch:browserObservationSessionBatch(
      packs.find(({ id }) => id === match.packId), match.observation,
    ),
  };
  if (!observation.path || !observation.environment || Array.isArray(observation.environment) ||
      !(observation.observationKeys ?? [observation.observationKey].filter(Boolean)).length) {
    throw new Error(`Invalid browser observation registry entry: ${id}`);
  }
  return { ...match, observation };
}

export function exactObservationEnvironment(packs, observation, inherited = process.env) {
  const environment = { ...inherited };
  for (const name of new Set(packs.flatMap((pack) => (pack.browserObservations ?? [])
    .flatMap((candidate) => Object.keys(candidate.environment ?? {}))))) delete environment[name];
  for (const name of Object.keys(environment)) {
    if (name.endsWith("_BROWSER_ADAPTER")) delete environment[name];
  }
  return { ...environment, ...observation.environment };
}

export function browserTargetConfigurations(observations) {
  return Object.fromEntries(observations.map(({ id, environment }) => [id, { ...environment }]));
}

export function validateBrowserObservationBatch(matches) {
  const ids = matches.map(({ observation }) => observation.id);
  const observations = matches.map(({ observation }) => observation);
  if (new Set(ids).size !== ids.length) {
    throw new Error(`Browser observation batch must select every target once: ${ids.join(", ")}`);
  }
  if (new Set(observations.map(({ path }) => path)).size !== 1) {
    throw new Error(`Browser observation batch must use one program: ${ids.join(", ")}`);
  }
  if (matches.length > 1) {
    if (new Set(matches.map(({ packId }) => packId)).size !== 1) {
      throw new Error(`Browser observation batch must use one owning pack: ${ids.join(", ")}`);
    }
    const sessionBatches = observations.map(({ sessionBatch }) => sessionBatch);
    if (sessionBatches.some((batch) => typeof batch !== "string" || !batch.trim()) ||
        new Set(sessionBatches).size !== 1) {
      throw new Error(`Browser observation batch must use one declared non-empty session batch: ${ids.join(", ")}`);
    }
  }
  return observations;
}

function runObservationProcess(packs, observations) {
  const combined = {
    id:observations.map(({ id }) => id).join(","),
    path:observations[0].path,
    environment:Object.assign({}, ...observations.map(({ environment }) => environment)),
  };
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const child = spawn(process.execPath, [combined.path], {
      cwd:repositoryRoot,
      shell:false,
      stdio:["inherit", "pipe", "pipe"],
      env:{
        ...exactObservationEnvironment(packs, combined),
        SWARMFORGE_BROWSER_TARGET_IDS:JSON.stringify(observations.map(({ id }) => id)),
        SWARMFORGE_BROWSER_TARGET_CONFIGURATIONS:JSON.stringify(
          browserTargetConfigurations(observations),
        ),
      },
    });
    const stdout = [];
    child.stdout.on("data", (chunk) => {
      stdout.push(chunk);
      process.stdout.write(chunk);
    });
    child.stderr.on("data", (chunk) => process.stderr.write(chunk));
    child.once("error", reject);
    child.once("close", (code, signal) => {
      const original = Buffer.concat(stdout).toString();
      try {
        const completed = completeBrowserObservationOutput(
          original, observations, Math.round(performance.now() - started),
        );
        resolve({ stdout:completed, code, signal });
      } catch (error) { reject(error); }
    });
  });
}

export function completeBrowserObservationOutput(stdout, observations, durationMs) {
  const timed = new Set();
  const resulted = new Set();
  for (const line of stdout.split(/\r?\n/u)) {
    try {
      const record = JSON.parse(line);
      const timingId = record.swarmforgeBrowserTargetTiming?.id;
      const resultId = record.swarmforgeBrowserTargetResult?.id;
      if (typeof timingId === "string") timed.add(timingId);
      if (typeof resultId === "string") resulted.add(resultId);
    } catch { /* ordinary browser diagnostics are not timing records */ }
  }
  const missing = observations.filter(({ id }) => !timed.has(id));
  if (missing.length) {
    throw new Error(
      `Browser observation target(s) ${missing.map(({ id }) => id).join(", ")} must emit their own timing; ` +
      `aggregate process duration ${durationMs}ms is not target evidence`,
    );
  }
  if (observations.length > 1) {
    const missingResults = observations.filter(({ id }) => !resulted.has(id));
    if (missingResults.length) {
      throw new Error(`Browser observation target(s) ${missingResults.map(({ id }) => id).join(", ")} must emit their own pass or failure result`);
    }
  }
  return stdout;
}

function mergeObservationDocument(target, observed) {
  for (const [key, value] of Object.entries(observed)) {
    if (target[key] && value && typeof target[key] === "object" && typeof value === "object" &&
        !Array.isArray(target[key]) && !Array.isArray(value)) Object.assign(target[key], value);
    else target[key] = value;
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

export async function runBrowserObservation(...ids) {
  if (!ids.length || ids.some((id) => !id)) {
    throw new Error("Use: run-browser-observation.mjs <observation-id> [<observation-id> ...]");
  }
  const packs = await loadVerificationPacks();
  const matches = ids.map((id) => observationById(packs, id));
  const observations = validateBrowserObservationBatch(matches);
  await assertFreshDist({ root:repositoryRoot });
  const processResult = await runObservationProcess(packs, observations);
  const parsed = parseBrowserObservationBatchOutput(processResult.stdout, observations);
  const failures = [...parsed.failures];
  if (processResult.code !== 0 && !failures.length) {
    failures.push({ id:"batch-program-or-cleanup",
      message:`Browser observation program failed (${processResult.signal ?? processResult.code})` });
  }
  if (failures.length) {
    const error = new AggregateError(failures.map(({ message }) => new Error(message)),
      `Browser observation batch failed: ${failures.map(({ id }) => id).join(", ")}`);
    error.partialDocument = parsed.document;
    throw error;
  }
  return parsed.document;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length < 3) {
    console.error("Use: run-browser-observation.mjs <observation-id> [<observation-id> ...]");
    process.exitCode = 1;
  } else {
    withDistArtifactLock(() => runBrowserObservation(...process.argv.slice(2)))
      .then((document) => console.log(JSON.stringify(document)))
      .catch((error) => {
      if (error.partialDocument && Object.keys(error.partialDocument).length) {
        console.log(JSON.stringify(error.partialDocument));
      }
      console.error(error.message);
      process.exitCode = 1;
      });
  }
}
