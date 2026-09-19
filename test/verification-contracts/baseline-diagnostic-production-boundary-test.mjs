import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";

import {canonicalBaselineDiagnostic,executeCanonicalDiagnosticAtCommit} from
  "../../scripts/verification-policy/reliability/baseline-diagnostic-authentication.mjs";
import {timeoutIncidentDigest} from "../../scripts/verification-reliability-values.mjs";

const git=(...args)=>execFileSync("git",args,{encoding:"utf8"}).trim();
const gitBytes=(...args)=>execFileSync("git",args);
const commit=git("rev-parse","HEAD^{commit}");
const receipt={commit,checkKey:"acceptance-session:verification_process",
  toolchainDigest:timeoutIncidentDigest(gitBytes("show",`${commit}:swarmforge/toolchain.lock.json`))};
const canonical=await canonicalBaselineDiagnostic(process.cwd(),receipt);

const missingPreparation=await executeCanonicalDiagnosticAtCommit(process.cwd(),commit,
  {...canonical,preparationTasks:[]});
assert.equal(missingPreparation.status,"preparation-failed",
  "missing generated input preparation is rejected before the canonical check");

const staleDependencies=await executeCanonicalDiagnosticAtCommit(process.cwd(),commit,
  {...canonical,dependencyPreparation:{...canonical.dependencyPreparation,
    lockDigest:"0".repeat(64)}});
assert.equal(staleDependencies.status,"preparation-failed",
  "dependencies from a different lock are rejected before the canonical check");

const preparedExecution=await executeCanonicalDiagnosticAtCommit(process.cwd(),commit,canonical);
assert.equal(preparedExecution.status,"failed");
assert.match(preparedExecution.diagnostic.stderr,/Acceptance pack session failed/u,
  "the prepared production executor reaches the canonical acceptance assertions");
assert.doesNotMatch(preparedExecution.diagnostic.stderr,
  /ERR_MODULE_NOT_FOUND|No such file|missing-generated-input/u,
  "the canonical failure is not caused by missing or stale prepared inputs");

console.log("baseline diagnostic production boundary passed");
