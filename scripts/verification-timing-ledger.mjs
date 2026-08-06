import { createHash } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

const sha256Pattern = /^[a-f0-9]{64}$/u;
const executionLoads = new Set(["normal", "loaded", "unclassified"]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalEnvironment(environment) {
  return {
    node:environment.node,
    typescript:environment.typescript,
    platform:environment.platform,
    executionLoad:environment.executionLoad,
    concurrency:environment.concurrency,
    observationConcurrency:environment.observationConcurrency,
    buildIdentity:environment.buildIdentity,
  };
}

export function canonicalEnvironmentClassId(environment) {
  return sha256(JSON.stringify(canonicalEnvironment(environment)));
}

export function artifactBuildIdentity(artifact) {
  return sha256(`${JSON.stringify({
    schemaVersion:artifact?.schemaVersion,
    inputDigest:artifact?.inputDigest,
    outputDigest:artifact?.outputDigest,
    toolchain:artifact?.toolchain,
  })}\n`);
}

export function receiptRejectionReason(receipt, expectedRuntime = {}) {
  const environment = receipt?.environment;
  const artifact = receipt?.artifact;
  const plan = receipt?.plan;
  const tasks = receipt?.tasks && !Array.isArray(receipt.tasks) ? Object.values(receipt.tasks) : [];
  const runtimeMatches = ["node", "typescript", "platform"].every((key) =>
    !expectedRuntime[key] || environment?.[key] === expectedRuntime[key]);
  if (receipt?.version !== 2) return "receipt-version";
  if (!runtimeMatches) return "runtime-mismatch";
  if (!receipt.tasks || Array.isArray(receipt.tasks) || !tasks.length ||
      tasks.some((result) => result?.status !== "passed" || !Number.isFinite(result.durationMs) ||
        result.durationMs < 0 || !result.identity?.key || !result.identity?.stage)) {
    return "incomplete-task-result";
  }
  const declaredLoadIsValid = environment?.executionLoad === undefined ||
    executionLoads.has(environment.executionLoad) && environment.executionLoad !== "unclassified";
  const shapeValid = ["exact", "impact", "terminal", "focused"].includes(plan?.mode) &&
    Array.isArray(plan.requestedPackIds) && Array.isArray(plan.selectedPackIds) &&
    plan.changedOwners && !Array.isArray(plan.changedOwners) &&
    (plan.changeSetDigest === null || sha256Pattern.test(plan.changeSetDigest ?? "")) &&
    Object.hasOwn(plan, "conservativeHistoricalFallbackReason") &&
    receipt.completedAt && !Number.isNaN(Date.parse(receipt.completedAt)) &&
    declaredLoadIsValid &&
    [environment?.node, environment?.typescript, environment?.platform]
      .every((value) => typeof value === "string" && value.length > 0) &&
    Number.isInteger(environment?.concurrency) && environment.concurrency > 0 &&
    Number.isInteger(environment?.observationConcurrency) && environment.observationConcurrency > 0 &&
    artifact?.toolchain?.node === environment.node &&
    artifact?.toolchain?.typescript === environment.typescript &&
    artifact?.schemaVersion === 1 &&
    [artifact?.buildIdentity, artifact?.inputDigest, artifact?.outputDigest]
      .every((value) => sha256Pattern.test(value ?? ""));
  if (!shapeValid) return "receipt-shape";
  if (artifact?.buildIdentity !== artifactBuildIdentity(artifact)) return "artifact-build-identity";
  return null;
}

export function validReceipt(receipt, expectedRuntime = {}) {
  return receiptRejectionReason(receipt, expectedRuntime) === null;
}

function normalizedSource(source) {
  if (typeof source === "string") {
    const sourcePath = path.resolve(source);
    return { id:`source-${sha256(sourcePath).slice(0, 12)}`, path:sourcePath };
  }
  if (!source?.path) throw new Error("Each timing receipt source requires a path");
  const sourcePath = path.resolve(source.path);
  return {
    id:source.id ?? `source-${sha256(sourcePath).slice(0, 12)}`,
    path:sourcePath,
    ...(source.executionLoad ? { executionLoad:source.executionLoad } : {}),
  };
}

async function sourceFiles(source) {
  let details;
  try { details = await stat(source.path); }
  catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  if (details.isFile()) return [source.path];
  if (!details.isDirectory()) throw new Error(`Timing receipt source is not a file or directory: ${source.path}`);
  return (await readdir(source.path, { withFileTypes:true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(source.path, entry.name))
    .sort();
}

function classifiedEnvironment(receipt, executionLoad) {
  return canonicalEnvironment({
    ...receipt.environment,
    executionLoad,
    buildIdentity:receipt.artifact.buildIdentity,
  });
}

function rejectionCounts(receipts) {
  const counts = {};
  for (const { rejectionReason } of receipts) {
    if (rejectionReason) counts[rejectionReason] = (counts[rejectionReason] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort());
}

export async function buildCanonicalTimingLedger({
  sources,
  expectedRuntime = {},
  legacyExecutionLoads = {},
  minimumIndependentSamples = 5,
} = {}) {
  if (!Array.isArray(sources) || !sources.length) throw new Error("Provide at least one timing receipt source");
  if (!Number.isInteger(minimumIndependentSamples) || minimumIndependentSamples < 1) {
    throw new Error("Minimum independent timing samples must be a positive integer");
  }
  const normalizedSources = sources.map(normalizedSource)
    .sort((left, right) => left.id.localeCompare(right.id) || left.path.localeCompare(right.path));
  if (new Set(normalizedSources.map(({ id }) => id)).size !== normalizedSources.length) {
    throw new Error("Timing receipt source ids must be unique");
  }
  const byDigest = new Map();
  for (const source of normalizedSources) {
    for (const sourcePath of await sourceFiles(source)) {
      const bytes = await readFile(sourcePath);
      const digest = sha256(bytes);
      let receipt;
      let parseError;
      try { receipt = JSON.parse(bytes); }
      catch (error) { parseError = error.message; }
      const declaredLoad = receipt?.environment?.executionLoad ??
        legacyExecutionLoads[digest] ?? source.executionLoad ?? "unclassified";
      const existing = byDigest.get(digest);
      if (existing) {
        if (existing.executionLoad !== declaredLoad) {
          if (existing.executionLoad === "unclassified" && executionLoads.has(declaredLoad)) {
            existing.executionLoad = declaredLoad;
            if (existing.receipt && !existing.rejectionReason) {
              existing.environment = classifiedEnvironment(existing.receipt, declaredLoad);
              existing.environmentClassId = canonicalEnvironmentClassId(existing.environment);
            }
          } else if (declaredLoad !== "unclassified") {
            throw new Error(`Conflicting execution-load declarations for receipt ${digest}`);
          }
        }
        existing.locations.push({ sourceId:source.id, sourcePath });
        continue;
      }
      const rejectionReason = receipt ? receiptRejectionReason(receipt, expectedRuntime) : null;
      const environment = receipt && !rejectionReason
        ? classifiedEnvironment(receipt, declaredLoad)
        : null;
      byDigest.set(digest, {
        digest,
        receipt,
        parseError,
        executionLoad:declaredLoad,
        rejectionReason,
        environment,
        environmentClassId:environment ? canonicalEnvironmentClassId(environment) : null,
        locations:[{ sourceId:source.id, sourcePath }],
      });
    }
  }
  const receipts = [...byDigest.values()]
    .map((entry) => ({
      ...entry,
      locations:entry.locations.sort((left, right) =>
        left.sourceId.localeCompare(right.sourceId) || left.sourcePath.localeCompare(right.sourcePath)),
      sourcePaths:entry.locations.map(({ sourcePath }) => sourcePath).sort(),
    }))
    .sort((left, right) => left.digest.localeCompare(right.digest));
  const accepted = receipts.filter(({ receipt, rejectionReason }) => receipt && !rejectionReason);
  const classes = new Map();
  for (const entry of accepted) {
    const current = classes.get(entry.environmentClassId) ?? {
      id:entry.environmentClassId,
      environment:entry.environment,
      receiptDigests:[],
    };
    current.receiptDigests.push(entry.digest);
    classes.set(entry.environmentClassId, current);
  }
  const environmentClasses = [...classes.values()]
    .map((entry) => ({ ...entry, receiptDigests:entry.receiptDigests.sort() }))
    .sort((left, right) => left.id.localeCompare(right.id));
  return {
    version:1,
    sources:normalizedSources,
    receipts,
    environmentClasses,
    acceptedReceipts:accepted.length,
    rejectedReceipts:receipts.filter(({ receipt, rejectionReason }) => receipt && rejectionReason).length,
    malformedReceipts:receipts.filter(({ receipt }) => !receipt).length,
    rejectedByReason:rejectionCounts(receipts),
    independentReceipts:receipts.length,
    independentSamples:accepted.length,
    minimumIndependentSamples,
  };
}

export function timingMaturity(independentSamples, minimumIndependentSamples = 5) {
  if (!Number.isInteger(independentSamples) || independentSamples < 0 ||
      !Number.isInteger(minimumIndependentSamples) || minimumIndependentSamples < 1) {
    throw new Error("Timing maturity requires non-negative samples and a positive integer minimum");
  }
  const provisional = independentSamples < minimumIndependentSamples;
  return {
    independentSamples,
    minimumIndependentSamples,
    provisional,
    status:provisional ? "provisional" : "non-provisional",
  };
}

function selectedClass(ledger, id) {
  if (id) return ledger.environmentClasses.find((entry) => entry.id === id);
  return [...ledger.environmentClasses]
    .sort((left, right) => right.receiptDigests.length - left.receiptDigests.length ||
      left.id.localeCompare(right.id))[0];
}

export function formatCanonicalTimingLedgerSummary(ledger, {
  selectedEnvironmentClass,
  minimumIndependentSamples = ledger.minimumIndependentSamples ?? 5,
} = {}) {
  const environmentClass = selectedClass(ledger, selectedEnvironmentClass);
  const maturity = timingMaturity(environmentClass?.receiptDigests.length ?? 0, minimumIndependentSamples);
  const reasons = Object.entries(ledger.rejectedByReason)
    .map(([reason, count]) => `${reason}=${count}`).join(", ") || "none";
  const sourceScope = ledger.sources
    .map(({ id, path:sourcePath }) => `${id}=${sourcePath}`).join(", ");
  return [
    `sources: ${ledger.sources.length} [${sourceScope}]`,
    `accepted: ${ledger.acceptedReceipts}`,
    `rejected: ${ledger.rejectedReceipts}`,
    `rejection reasons: ${reasons}`,
    `malformed: ${ledger.malformedReceipts}`,
    `environment class: ${environmentClass?.id ?? "none"}`,
    `independent samples: ${maturity.independentSamples}`,
    `timing maturity: ${maturity.status}`,
  ].join("; ");
}

function archiveCandidates(ledger) {
  return ledger.receipts
    .filter(({ receipt, rejectionReason }) => !receipt || rejectionReason)
    .flatMap((entry) => entry.sourcePaths.map((sourcePath) => ({
      sourcePath,
      digest:entry.digest,
      reason:entry.rejectionReason ?? "malformed-receipt",
    })))
    .sort((left, right) => left.sourcePath.localeCompare(right.sourcePath));
}

async function recoverableArchiveMove(source, destination, expectedDigest) {
  await copyFile(source, destination, fsConstants.COPYFILE_EXCL);
  const archivedDigest = sha256(await readFile(destination));
  if (archivedDigest !== expectedDigest) {
    await unlink(destination);
    throw new Error(`Archived receipt digest mismatch: ${destination}`);
  }
  await unlink(source);
}

export async function archiveCanonicalReceiptCandidates(ledger, {
  action = "report",
  archiveDirectory,
} = {}) {
  const candidates = archiveCandidates(ledger);
  if (action === "report") return { action, archived:false, candidates:[] };
  if (!archiveDirectory) throw new Error("Provide an archive directory for receipt maintenance");
  if (action === "preview") return { action, archived:false, candidates };
  if (action !== "archive") throw new Error(`Unknown receipt maintenance action: ${action}`);
  await mkdir(archiveDirectory, { recursive:true });
  const entries = candidates.map((candidate) => {
    const pathIdentity = sha256(candidate.sourcePath).slice(0, 12);
    return {
      originalPath:candidate.sourcePath,
      archivePath:path.join(
        path.resolve(archiveDirectory),
        `${candidate.digest.slice(0, 16)}-${pathIdentity}-${path.basename(candidate.sourcePath)}`,
      ),
      digest:candidate.digest,
      reason:candidate.reason,
    };
  });
  const manifestPath = path.join(path.resolve(archiveDirectory), "recovery-manifest.json");
  await writeFile(manifestPath, `${JSON.stringify({ version:1, entries }, null, 2)}\n`, { flag:"wx" });
  for (const entry of entries) {
    await recoverableArchiveMove(entry.originalPath, entry.archivePath, entry.digest);
  }
  return { action, archived:true, candidates, entries, manifestPath };
}
