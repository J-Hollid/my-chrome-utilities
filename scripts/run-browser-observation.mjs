import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { assertFreshDist } from "./dist-artifact.mjs";
import { withDistArtifactLock } from "./dist-artifact-lock.mjs";
import { loadVerificationPacks } from "./verification-packs.mjs";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));

function observationById(packs, id) {
  const matches = packs.flatMap((pack) => (pack.browserObservations ?? [])
    .filter((observation) => observation.id === id)
    .map((observation) => ({ packId:pack.id, observation })));
  if (matches.length !== 1) throw new Error(`Unknown or ambiguous browser observation id: ${id}`);
  const match = matches[0];
  const { observation } = match;
  if (!observation.path || !observation.environment || Array.isArray(observation.environment) ||
      !(observation.observationKeys ?? [observation.observationKey].filter(Boolean)).length) {
    throw new Error(`Invalid browser observation registry entry: ${id}`);
  }
  return match;
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

function runObservationProcess(packs, observations) {
  const combined = {
    id:observations.map(({ id }) => id).join(","),
    path:observations[0].path,
    environment:Object.assign({}, ...observations.map(({ environment }) => environment)),
  };
  return new Promise((resolve, reject) => {
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
    child.once("close", (code, signal) => code === 0
      ? resolve(Buffer.concat(stdout).toString())
      : reject(new Error(`Browser observation failed (${signal ?? code}): ${combined.id}`)));
  });
}

export function parseBrowserObservationOutput(stdout, observation) {
  const lines = stdout.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
  const document = {};
  let found = false;
  for (const line of lines) {
    try {
      const candidate = JSON.parse(line);
      if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
        const observed = Object.fromEntries(Object.entries(candidate)
          .filter(([key]) => key !== "swarmforgeBrowserTargetTiming"));
        if (Object.keys(observed).length) {
          Object.assign(document, observed);
          found = true;
        }
      }
    } catch { /* diagnostic output may precede the adapter JSON */ }
  }
  if (!found) throw new Error(`Browser observation ${observation.id} did not emit a JSON object`);
  const keys = observation.observationKeys ?? [observation.observationKey].filter(Boolean);
  const missing = keys.filter((key) => !Object.hasOwn(document, key) || document[key] == null);
  if (missing.length) {
    throw new Error(`Browser observation ${observation.id} omitted required key(s): ${missing.join(", ")}`);
  }
  return document;
}

export function parseBrowserObservationBatchOutput(stdout, observations) {
  const document = {};
  const results = {};
  const failures = [];
  for (const observation of observations) {
    try {
      const result = parseBrowserObservationOutput(stdout, observation);
      results[observation.id] = result;
      Object.assign(document, result);
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
  const observations = ids.map((id) => observationById(packs, id).observation);
  if (new Set(observations.map(({ path }) => path)).size !== 1) {
    throw new Error(`Browser observation batch must use one program: ${ids.join(", ")}`);
  }
  await assertFreshDist({ root:repositoryRoot });
  const stdout = await runObservationProcess(packs, observations);
  const parsed = parseBrowserObservationBatchOutput(stdout, observations);
  if (parsed.failures.length) {
    const error = new AggregateError(parsed.failures.map(({ message }) => new Error(message)),
      `Browser observation batch failed: ${parsed.failures.map(({ id }) => id).join(", ")}`);
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
