import {readFile} from "node:fs/promises";

export async function sourcePlannerReceipt(source) {
  if (typeof source !== "string" || !/^tmp\/verification-receipts\/[A-Za-z0-9._-]+\.json$/u.test(source)) {
    throw new Error("Unverified planner-projection source identity");
  }
  return JSON.parse(await readFile(new URL(`../${source}`, import.meta.url), "utf8"));
}

function registryBindsBrowserTask(identity, packs, same) {
  if (identity?.stage !== "browser-observation" || identity.executable !== "node" ||
      !Array.isArray(identity.logicalTargetIds) || !identity.logicalTargetIds.length ||
      new Set(identity.logicalTargetIds).size !== identity.logicalTargetIds.length) return false;
  const pack = packs.find((candidate) => candidate.id === identity.packId);
  if (!pack) return false;
  const observations = identity.logicalTargetIds.map((target) => (pack.browserObservations ?? [])
    .filter(({id}) => id === target));
  if (observations.some((matches) => matches.length !== 1)) return false;
  const rows = observations.flat();
  const path = rows[0].path;
  const session = rows[0].sessionBatch;
  const environment = Object.assign({}, ...rows.map((row) => row.environment));
  return rows.every((row) => row.path === path && row.sessionBatch === session) &&
    identity.args?.[0] === "scripts/run-browser-observation.mjs" &&
    same(identity.args.slice(1), identity.logicalTargetIds) &&
    identity.target === identity.logicalTargetIds.join(",") && same(identity.environment, environment) &&
    same(identity.requiredCapabilities, ["local-loopback"]);
}

export async function sameTargetPlannerProjection({incident,currentIdentities,currentPacks,
  loadHistoricalPacks,loadSourceReceipt,operations}) {
  const {browserTargetBoundary,boundaryDigest,digest,executionFor,same,taskDigest} = operations;
  const targets = incident.failure.retryScope?.logicalTargetIds ?? [];
  if (targets.length !== 1) throw new Error("Same-target planner projection requires one diagnosed target");
  const target = targets[0];
  const current = currentIdentities.filter((identity) =>
    identity.stage === "browser-observation" && identity.logicalTargetIds?.includes(target));
  if (current.length === 0) throw new Error(`Missing current target boundary for ${target}`);
  if (current.length !== 1) throw new Error(`Ambiguous current target boundary for ${target}`);
  let receipt;
  let historicalPacks;
  try {
    [receipt, historicalPacks] = await Promise.all([
      loadSourceReceipt(incident.failure.sourceReceipt),
      loadHistoricalPacks(incident.failure.lineage.commit, "verification/packs.json"),
    ]);
  } catch {
    throw new Error("Unverified planner-projection source identity");
  }
  const source = incident.failure.task;
  const recorded = receipt?.tasks?.[source.key];
  if (receipt?.candidate?.commit !== incident.failure.lineage.commit ||
      receipt?.candidate?.tree !== incident.failure.lineage.tree || recorded?.status !== "failed" ||
      !same(recorded.identity, source) || !registryBindsBrowserTask(source, historicalPacks, same)) {
    throw new Error("Unverified planner-projection source identity");
  }
  const historicalDigest = boundaryDigest(browserTargetBoundary(historicalPacks, target));
  const currentDigest = boundaryDigest(browserTargetBoundary(currentPacks, target));
  if (historicalDigest !== currentDigest) throw new Error(`Changed target boundary for ${target}`);
  const sourceTaskDigest = taskDigest(source);
  const destinationIdentity = current[0];
  const destinationTaskDigest = taskDigest(destinationIdentity);
  const logicalSlice = {kind:"browser-target", logicalTargetIds:[target]};
  const chain = [{
    id:`same-target-planner-projection:${sourceTaskDigest.slice(0, 12)}:${destinationTaskDigest.slice(0, 12)}:${target}`,
    sourceTaskDigest, destinationTaskDigest, conservedBoundaryDigest:historicalDigest,
    logicalSlice:structuredClone(logicalSlice),
  }];
  const conservationDigest = digest({version:1, sourceTaskDigest, destinationTaskDigest, chain,
    logicalSlice, boundaryDigest:historicalDigest});
  return {version:1, projection:"same-target-planner-projection", sourceTaskDigest,
    destinationTaskDigest, chain, logicalSlice, conservationDigest,
    destinationIdentity:structuredClone(destinationIdentity),
    execution:executionFor(destinationIdentity, logicalSlice)};
}
