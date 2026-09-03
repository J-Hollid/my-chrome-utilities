import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { authorityDigest, unblockerContentDigest } from "./unblocker-authority.mjs";
import { bindingKey, renderHandoff } from "./unblocker-format.mjs";
import { matchingBindings } from "./unblocker-queue-storage.mjs";
import { claimUnblocker, deliverUnblocker } from "./unblocker-queue.mjs";

const grantWithoutDigest={version:1,name:"outcome-bounded-autonomy-v1",approvedBy:"user",
  approvedAt:"2026-08-17",issuerRoles:["specifier"],outcomeBoundaries:{reversible:true,
    preserveApprovedUserVisibleBehavior:true,noMaterialExternalRiskIncrease:true,
    noUserOnlyAuthorityCredentialOrInformation:true,noMaterialGlobalScopeOrCostExpansion:true,
    preserveOrStrengthenSafetyAndEvidence:true},doesNotAuthorize:["product behavior changes"],
  acceptanceFeature:"features/swarmforge-outcome-bounded-autonomy-and-unblockers.feature",
  digestAlgorithm:"sha256-canonical-json-without-digest"};
const grant={...grantWithoutDigest,digest:`sha256:${authorityDigest(grantWithoutDigest)}`};
const active={id:"current-specifier-handoff",from:"specifier",recipient:"coder",
  task:"verification-process-exact-slice-execution",commit:"b".repeat(40),path:"active.handoff"};
const headers={id:"current-unblocker",from:"specifier",type:"unblocker",to:"coder",priority:"00",
  name:"phase-2-owner-transitions",authority:"outcome-bounded-autonomy-v1",
  "authority-commit":"a".repeat(40),task:active.task,"active-handoff":active.id,mode:"resume",
  supersedes:"waiting-for-owner-transition-authority",message:"Resume Phase 2 transitions"};
const stored=(source,body="bounded")=>renderHandoff({...source,
  "content-digest":unblockerContentDigest(source,body)},body);
const authorityOptions={grant,active,authorityCommitPresentOnBase:true,
  authorityCommitAncestral:true};

async function verifyLegacyClaimRecovery() {
  const root=await mkdtemp(path.join(os.tmpdir(),"swarmforge-unblocker-legacy-duplicate-"));
  try {
    const delivery=await deliverUnblocker({queueRoot:root,headers:{...headers,
      name:"legacy-copy-delete-crash"},body:"bounded",...authorityOptions});
    const queued=path.join(root,"unblockers","new",delivery.filename);
    const content=await readFile(queued,"utf8");
    await claimUnblocker({queueRoot:root,...authorityOptions});
    await writeFile(queued,content);
    assert.equal((await claimUnblocker({queueRoot:root,...authorityOptions})).status,
      "already-claimed");
    assert.equal((await readdir(path.join(root,"unblockers","new"))).length,0,
      "a legacy copy-then-delete crash is retired exactly once");
  } finally {
    await rm(root,{recursive:true,force:true});
  }
}

async function verifyRetiredHeaderCompatibility() {
  const root=await mkdtemp(path.join(os.tmpdir(),"swarmforge-unblocker-binding-compatibility-"));
  try {
    const completed=path.join(root,"unblockers","completed");
    await mkdir(completed,{recursive:true});
    const unrelatedLegacy={...headers,id:"legacy-unrelated",name:"legacy-route",
      task:"retired-task","active-handoff":"retired-handoff",
      "defect-census":"retired","repair-task":"retired"};
    await writeFile(path.join(completed,"legacy.handoff"),stored(unrelatedLegacy));
    const delivery=await deliverUnblocker({queueRoot:root,headers,body:"bounded",...authorityOptions});
    assert.equal(delivery.status,"queued",
      "an unrelated legacy completion does not block a new bound delivery");
    const matches=await matchingBindings(root,bindingKey(headers));
    assert.deepEqual(matches.map(({headers:match})=>match.id),["current-unblocker"],
      "unrelated retired headers do not block the requested current binding");

    const matchingLegacy={...unrelatedLegacy,name:headers.name,task:headers.task,
      "active-handoff":headers["active-handoff"]};
    await writeFile(path.join(completed,"legacy-matching.handoff"),stored(matchingLegacy));
    await assert.rejects(matchingBindings(root,bindingKey(headers)),/Unknown unblocker field/u,
      "a matching record with retired headers remains subject to strict validation");
  } finally {
    await rm(root,{recursive:true,force:true});
  }
}

export async function verifyLegacyUnblockerCompatibility() {
  await verifyLegacyClaimRecovery();
  await verifyRetiredHeaderCompatibility();
}
