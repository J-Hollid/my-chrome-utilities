import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { authorityDigest, unblockerContentDigest } from
  "../swarmforge/scripts/unblocker-authority.mjs";
import { bindingKey, renderHandoff } from "../swarmforge/scripts/unblocker-format.mjs";
import { matchingBindings } from "../swarmforge/scripts/unblocker-queue-storage.mjs";
import { deliverUnblocker } from "../swarmforge/scripts/unblocker-queue.mjs";

const root = await mkdtemp(path.join(os.tmpdir(), "unblocker-binding-compatibility-"));
const headers = {
  id:"current-unblocker", from:"specifier", type:"unblocker", to:"coder", priority:"00",
  name:"phase-2-owner-transitions", authority:"outcome-bounded-autonomy-v1",
  "authority-commit":"a".repeat(40), task:"verification-process-exact-slice-execution",
  "active-handoff":"current-specifier-handoff", mode:"resume",
  supersedes:"waiting-for-owner-transition-authority", message:"Resume Phase 2 transitions",
};
const stored = (source, body = "bounded") => {
  const complete = {...source, "content-digest":unblockerContentDigest(source, body)};
  return renderHandoff(complete, body);
};
const grantWithoutDigest={version:1,name:"outcome-bounded-autonomy-v1",approvedBy:"user",
  approvedAt:"2026-08-17",issuerRoles:["specifier"],outcomeBoundaries:{reversible:true,
    preserveApprovedUserVisibleBehavior:true,noMaterialExternalRiskIncrease:true,
    noUserOnlyAuthorityCredentialOrInformation:true,noMaterialGlobalScopeOrCostExpansion:true,
    preserveOrStrengthenSafetyAndEvidence:true},doesNotAuthorize:["product behavior changes"],
  acceptanceFeature:"features/swarmforge-outcome-bounded-autonomy-and-unblockers.feature",
  digestAlgorithm:"sha256-canonical-json-without-digest"};
const grant={...grantWithoutDigest,digest:`sha256:${authorityDigest(grantWithoutDigest)}`};
const active={id:headers["active-handoff"],from:"specifier",recipient:"coder",task:headers.task,
  commit:"b".repeat(40),path:"active.handoff"};

try {
  const completed = path.join(root, "unblockers", "completed");
  const queued = path.join(root, "unblockers", "new");
  await mkdir(completed, {recursive:true});
  await mkdir(queued, {recursive:true});
  const unrelatedLegacy = {...headers, id:"legacy-unrelated", name:"legacy-route",
    task:"retired-task", "active-handoff":"retired-handoff",
    "defect-census":"retired", "repair-task":"retired"};
  await writeFile(path.join(completed, "legacy.handoff"), stored(unrelatedLegacy));
  const delivery=await deliverUnblocker({queueRoot:root,headers:{...headers,from:"specifier"},
    body:"bounded",grant,active,authorityCommitPresentOnBase:true,authorityCommitAncestral:true});
  assert.equal(delivery.status,"queued",
    "an unrelated legacy completion does not block a new bound delivery");

  const matches = await matchingBindings(root, bindingKey(headers));
  assert.deepEqual(matches.map(({headers:match}) => match.id), ["current-unblocker"],
    "unrelated legacy fields do not block the requested current binding");

  const matchingLegacy = {...unrelatedLegacy, name:headers.name, task:headers.task,
    "active-handoff":headers["active-handoff"]};
  await writeFile(path.join(completed, "legacy-matching.handoff"), stored(matchingLegacy));
  await assert.rejects(matchingBindings(root, bindingKey(headers)), /Unknown unblocker field/u,
    "a legacy record with the requested binding remains subject to strict validation");
} finally {
  await rm(root, {recursive:true, force:true});
}
