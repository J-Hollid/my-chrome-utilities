import {validateBrowserObservationProcessOutput} from "./browser-observation/complete-output.mjs";
export {completeBrowserObservationOutput} from "./browser-observation/complete-output.mjs";
import {collectBrowserObservationOutput} from "./browser-observation/collect-output.mjs";
export {parseBrowserObservationOutput,parseBrowserObservationBatchOutput} from "./browser-observation/results.mjs";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { assertFreshDist } from "./dist-artifact.mjs";
import {
  inheritedDistArtifactLockIsHeld,
  withDistArtifactLock,
} from "./dist-artifact-lock.mjs";
import {
  browserObservationEvidenceLeaves,
  browserObservationSessionBatch,
  loadVerificationPacks,
} from "./verification-packs.mjs";
import { verificationProgressEmitter } from "./verification-reliability-incidents.mjs";

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

function runObservationProcess(packs, observations, progressOffsetMs = 0) {
  const combined = {
    id:observations.map(({ id }) => id).join(","),
    path:observations[0].path,
    environment:Object.assign({}, ...observations.map(({ environment }) => environment)),
  };
  return (async () => {
    const started = performance.now();
    const child = spawn(process.execPath, [combined.path], {
      cwd:repositoryRoot,
      shell:false,
      detached:process.platform!=="win32",
      stdio:["inherit", "pipe", "pipe"],
      env:{
        ...exactObservationEnvironment(packs, combined),
        SWARMFORGE_BROWSER_TARGET_IDS:JSON.stringify(observations.map(({ id }) => id)),
        SWARMFORGE_BROWSER_TARGET_CONFIGURATIONS:JSON.stringify(
          browserTargetConfigurations(observations),
        ),
        SWARMFORGE_PROGRESS_SEQUENCE_START:"1000000",
        SWARMFORGE_PROGRESS_MONOTONIC_OFFSET:String(progressOffsetMs),
      },
    });
    const result=await collectBrowserObservationOutput(child,observations.map(({id})=>id));
    return {...result,durationMs:Math.round(performance.now()-started)};
  })();
}


async function runBrowserObservationWithProgress(ids, progressOffsetMs) {
  if (!ids.length || ids.some((id) => !id)) {
    throw new Error("Use: run-browser-observation.mjs <observation-id> [<observation-id> ...]");
  }
  const packs = await loadVerificationPacks();
  const matches = ids.map((id) => observationById(packs, id));
  const observations = validateBrowserObservationBatch(matches);
  await assertFreshDist({ root:repositoryRoot });
  const processResult = await runObservationProcess(packs, observations, progressOffsetMs);
  const parsed = validateBrowserObservationProcessOutput(processResult.stdout, observations,processResult.durationMs);
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

export async function runBrowserObservation(...ids) {
  return runBrowserObservationWithProgress(ids, 0);
}

export async function runBrowserObservationSetupOnly() {
  await assertFreshDist({ root:repositoryRoot });
  return { setupOnly:true };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const progressStarted = performance.now();
  const progress = verificationProgressEmitter();
  progress({ boundary:"process", state:{ status:"started", program:"browser-observation" } });
  if (process.argv.length < 3) {
    console.error("Use: run-browser-observation.mjs <observation-id> [<observation-id> ...]");
    process.exitCode = 1;
  } else {
    const setupOnly = process.argv[2] === "--setup-only";
    const sharedCoordinatorArtifact = await inheritedDistArtifactLockIsHeld();
    progress({ boundary:"artifact/setup", phase:"dist-artifact-lock", state:sharedCoordinatorArtifact
      ? { status:"acquired", sharedCoordinatorArtifact:true, waitedMs:0 }
      : { status:"waiting" } });
    withDistArtifactLock(async() => {
      progress({ boundary:"artifact/setup", phase:"dist-artifact-lock", state:{ status:"acquired" } });
      return setupOnly
        ? runBrowserObservationSetupOnly()
        : runBrowserObservationWithProgress(
          process.argv.slice(2), Math.max(0, performance.now() - progressStarted),
        );
    }, { access:"read", onWait:({ waitedMs, owner }) => progress({
      boundary:"artifact/setup", phase:"dist-artifact-lock", state:{ status:"waiting", waitedMs, owner },
    }) })
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
