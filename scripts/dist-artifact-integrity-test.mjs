import assert from "node:assert/strict";
import {chmod, mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {performance} from "node:perf_hooks";
import {fileURLToPath} from "node:url";

import {
  assertFreshDist,
  atomicWriteFile,
  DIST_ARTIFACT_MANIFEST,
  makeDistDirectoryPublishable,
  promoteDistDirectory,
  writeDistArtifactManifest,
} from "./dist-artifact.mjs";
import {
  acquireDistArtifactLock,
  distArtifactOwnerRecord,
  inheritedDistArtifactLockIsHeld,
} from "./dist-artifact-lock.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "dist-artifact-integrity-"));
const testToolchain = {node: "test-node", typescript: "test-typescript"};

try {
  const fixtureRoot = path.join(temporaryRoot, "fixture");
  const fixtureDist = path.join(fixtureRoot, "dist");
  await mkdir(path.join(fixtureRoot, "src"), {recursive: true});
  await mkdir(fixtureDist, {recursive: true});
  await writeFile(path.join(fixtureRoot, "src", "example.ts"), "export const value = 1;\n");
  await mkdir(path.join(fixtureRoot, "architecture"), {recursive: true});
  await mkdir(path.join(fixtureRoot, "scripts"), {recursive: true});
  await writeFile(
    path.join(fixtureRoot, "architecture", "boundaries.json"),
    "{\"src/example.ts\":\"core\"}\n",
  );
  await writeFile(path.join(fixtureRoot, "scripts", "build.mjs"), "// fixture build\n");
  await writeFile(path.join(fixtureDist, "example.js"), "export const value = 1;\n");

  const manifestOptions = {
    root: fixtureRoot,
    distDirectory: fixtureDist,
    inputPaths: ["src", "architecture", "scripts/build.mjs"],
    toolchain: testToolchain,
  };
  const firstManifest = await writeDistArtifactManifest(manifestOptions);
  const firstManifestBytes = await readFile(
    path.join(fixtureDist, DIST_ARTIFACT_MANIFEST),
    "utf8",
  );
  const validated = await assertFreshDist(manifestOptions);
  assert.equal(validated.buildIdentity, firstManifest.buildIdentity);
  assert.match(validated.buildIdentity, /^[a-f\d]{64}$/u);

  await writeDistArtifactManifest(manifestOptions);
  assert.equal(
    await readFile(path.join(fixtureDist, DIST_ARTIFACT_MANIFEST), "utf8"),
    firstManifestBytes,
    "success manifests are deterministic for identical inputs and outputs",
  );

  await writeFile(path.join(fixtureRoot, "src", "example.ts"), "export const value = 2;\n");
  await assert.rejects(
    assertFreshDist(manifestOptions),
    /dist artifact is stale/u,
    "source changes invalidate a completed dist artifact",
  );
  await writeFile(path.join(fixtureRoot, "src", "example.ts"), "export const value = 1;\n");
  await assertFreshDist(manifestOptions);

  await writeFile(
    path.join(fixtureRoot, "architecture", "boundaries.json"),
    "{\"src/example.ts\":\"browser\"}\n",
  );
  await assert.rejects(
    assertFreshDist(manifestOptions),
    /dist artifact is stale/u,
    "architecture policy changes invalidate a completed dist artifact",
  );
  await writeFile(
    path.join(fixtureRoot, "architecture", "boundaries.json"),
    "{\"src/example.ts\":\"core\"}\n",
  );
  await assertFreshDist(manifestOptions);

  await writeFile(path.join(fixtureRoot, "scripts", "build.mjs"), "// changed fixture build\n");
  await assert.rejects(
    assertFreshDist(manifestOptions),
    /dist artifact is stale/u,
    "build-tool changes invalidate a completed dist artifact",
  );
  await writeFile(path.join(fixtureRoot, "scripts", "build.mjs"), "// fixture build\n");
  await assertFreshDist(manifestOptions);

  await writeFile(path.join(fixtureDist, "example.js"), "export const value = 999;\n");
  await assert.rejects(
    assertFreshDist(manifestOptions),
    /contents do not match/u,
    "output corruption is distinct from source staleness",
  );
  await writeFile(path.join(fixtureDist, "example.js"), "export const value = 1;\n");
  await assertFreshDist(manifestOptions);

  const promotionRoot = path.join(temporaryRoot, "promotion");
  const destination = path.join(promotionRoot, "dist");
  const candidate = path.join(promotionRoot, "candidate");
  await mkdir(destination, {recursive: true});
  await mkdir(candidate, {recursive: true});
  await chmod(candidate, 0o700);
  await writeFile(path.join(destination, "version"), "old");
  await writeFile(path.join(candidate, "version"), "new");
  await makeDistDirectoryPublishable(candidate);
  await promoteDistDirectory(candidate, destination);
  assert.equal(await readFile(path.join(destination, "version"), "utf8"), "new");
  assert.equal((await stat(destination)).mode & 0o777, 0o755);
  await assert.rejects(readFile(path.join(candidate, "version"), "utf8"), /ENOENT/u);

  const recoveredDestination = path.join(promotionRoot, "recovered-dist");
  const strandedBackup = `${recoveredDestination}.previous-crashed-build`;
  const recoveredCandidate = path.join(promotionRoot, "recovered-candidate");
  await mkdir(strandedBackup, {recursive: true});
  await mkdir(recoveredCandidate, {recursive: true});
  await writeFile(path.join(strandedBackup, "version"), "recoverable-old");
  await writeFile(path.join(recoveredCandidate, "version"), "recovered-new");
  await promoteDistDirectory(recoveredCandidate, recoveredDestination);
  assert.equal(await readFile(path.join(recoveredDestination, "version"), "utf8"), "recovered-new");
  assert.deepEqual(
    (await readdir(promotionRoot)).filter((entry) => entry.startsWith("recovered-dist.previous-")),
    [],
    "a locked promotion recovers and removes a backup stranded between directory renames",
  );

  const missingCandidate = path.join(promotionRoot, "missing-candidate");
  await assert.rejects(promoteDistDirectory(missingCandidate, destination), /ENOENT/u);
  assert.equal(
    await readFile(path.join(destination, "version"), "utf8"),
    "new",
    "a failed promotion restores the previously published artifact",
  );

  const archivePath = path.join(temporaryRoot, "package", "artifact.zip");
  await atomicWriteFile(archivePath, Buffer.from("old"));
  await atomicWriteFile(archivePath, Buffer.from("new"));
  assert.equal(await readFile(archivePath, "utf8"), "new");
  assert.deepEqual(await readdir(path.dirname(archivePath)), ["artifact.zip"]);

  await assert.rejects(
    acquireDistArtifactLock(path.join(temporaryRoot, "invalid-timeout"), {timeoutMs: 0}),
    /finite positive/u,
  );
  await assert.rejects(
    acquireDistArtifactLock(path.join(temporaryRoot, "invalid-report"), {
      timeoutMs: 100,
      reportAfterMs: Number.NaN,
    }),
    /finite positive/u,
  );

  const contestedLock = path.join(temporaryRoot, "contested.lock");
  const releaseContested = await acquireDistArtifactLock(contestedLock);
  assert.equal(
    await inheritedDistArtifactLockIsHeld(contestedLock, "forged-token"),
    false,
    "an inherited environment value cannot bypass a live lock without its owner token",
  );
  assert.equal(
    await inheritedDistArtifactLockIsHeld(contestedLock, releaseContested.token),
    true,
    "a live parent's exact owner token authorizes a nested artifact consumer",
  );
  const contestedAt = performance.now();
  try {
    await assert.rejects(
      acquireDistArtifactLock(contestedLock, {timeoutMs: 60, reportAfterMs: 1000}),
      /Timed out waiting/u,
    );
  } finally {
    await releaseContested();
  }
  assert.ok(
    performance.now() - contestedAt < 500,
    "ordinary lock contention observes its configured global deadline",
  );

  const staleLock = path.join(temporaryRoot, "stale.lock");
  await mkdir(staleLock, {recursive: true});
  await writeFile(
    path.join(staleLock, "owner.json"),
    JSON.stringify({pid: 999999999, startTime: "dead", token: "stale"}),
  );
  assert.equal(
    await inheritedDistArtifactLockIsHeld(staleLock, "stale"),
    false,
    "a matching token from a dead owner cannot authorize lock bypass",
  );
  const releaseRecovered = await acquireDistArtifactLock(staleLock, {
    timeoutMs: 500,
    reportAfterMs: 1000,
  });
  await releaseRecovered();

  const stuckReclaimerLock = path.join(temporaryRoot, "stuck-reclaimer.lock");
  await mkdir(stuckReclaimerLock, {recursive: true});
  await writeFile(
    path.join(stuckReclaimerLock, "owner.json"),
    JSON.stringify({pid: 999999999, startTime: "dead", token: "stale"}),
  );
  await writeFile(
    path.join(
      stuckReclaimerLock,
      "reclaim.000000000000000000000000.active.claim",
    ),
    JSON.stringify(await distArtifactOwnerRecord("active-reclaimer")),
  );
  const reclaimAt = performance.now();
  await assert.rejects(
    acquireDistArtifactLock(stuckReclaimerLock, {timeoutMs: 70, reportAfterMs: 1000}),
    /Timed out waiting/u,
  );
  assert.ok(
    performance.now() - reclaimAt < 500,
    "stale-owner claim arbitration cannot outlive the acquisition deadline",
  );

  const browserWrapper = await readFile(
    path.join(projectRoot, "swarmforge", "scripts", "browser-test"),
    "utf8",
  );
  assert.match(browserWrapper, /dist-artifact\.mjs run -- node/u);

  console.log("dist artifact integrity tests passed");
} finally {
  await rm(temporaryRoot, {recursive: true, force: true});
}
