import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import {
  authorityDigest,
  boundedExecutionScope,
  classifyOutcome,
  completeUnblocker,
  deliverUnblocker,
  validateAuthorityClaim,
  validateUnblockerDraft,
  claimUnblocker,
} from "../swarmforge/scripts/unblocker-control.mjs";
import {
  aggregateCampsiteAssessment,
  createRemainderManifest,
  recordDisposition,
  resumeRemainder,
} from "../scripts/stacked-campsite-control.mjs";

const exec=promisify(execFile);
async function git(cwd,...args){return (await exec("git",args,{cwd,encoding:"utf8"})).stdout.trim();}

const grantWithoutDigest = {
  version:1,
  name:"outcome-bounded-autonomy-v1",
  approvedBy:"user",
  approvedAt:"2026-08-17",
  issuerRoles:["specifier"],
  outcomeBoundaries:{
    reversible:true,
    preserveApprovedUserVisibleBehavior:true,
    noMaterialExternalRiskIncrease:true,
    noUserOnlyAuthorityCredentialOrInformation:true,
    noMaterialGlobalScopeOrCostExpansion:true,
    preserveOrStrengthenSafetyAndEvidence:true,
  },
  doesNotAuthorize:["product behavior changes"],
  acceptanceFeature:"features/swarmforge-outcome-bounded-autonomy-and-unblockers.feature",
  digestAlgorithm:"sha256-canonical-json-without-digest",
};
const grant = { ...grantWithoutDigest, digest:`sha256:${authorityDigest(grantWithoutDigest)}` };
const active = {
  id:"20260818T010000Z_000001_from_specifier",
  from:"specifier", recipient:"coder", task:"documentation-templates",
  commit:"b".repeat(40), path:"active.handoff",
};
const validHeaders = {
  type:"unblocker", to:"coder", priority:"00", name:"documentation-causal-repair-route",
  authority:"outcome-bounded-autonomy-v1", "authority-commit":"a".repeat(40),
  task:active.task, "active-handoff":active.id, mode:"resume",
  supersedes:"waiting-for-causal-disposition", message:"Resume bounded repair",
};

// 001-002: semantic outcomes, rather than unfamiliar labels, decide autonomy.
assert.equal(classifyOutcome({ reversible:true, preservesBehavior:true, externalRiskIncrease:false,
  needsUserOnlyAuthority:false, materiallyExpandsScope:false, weakensEvidence:false }).decision,"proceed");
for (const crossing of ["reversible", "preservesBehavior", "externalRiskIncrease",
  "needsUserOnlyAuthority", "materiallyExpandsScope", "weakensEvidence"]) {
  const safe={reversible:true,preservesBehavior:true,externalRiskIncrease:false,
    needsUserOnlyAuthority:false,materiallyExpandsScope:false,weakensEvidence:false};
  safe[crossing]=["externalRiskIncrease","needsUserOnlyAuthority","materiallyExpandsScope",
    "weakensEvidence"].includes(crossing);
  assert.equal(classifyOutcome(safe).decision,"escalate", crossing);
}

// 003-004 and 010-011: authority is structured, immutable, ancestral, and issuer-bound.
assert.equal(validateUnblockerDraft(validHeaders,"bounded detail").mode,"resume");
for (const [field,value] of [["to","coder,refactorer"],["priority","01"],["mode","run"],
  ["message","x".repeat(81)]]) {
  assert.throws(()=>validateUnblockerDraft({...validHeaders,[field]:value},""),/unblocker/i);
}
assert.equal(validateAuthorityClaim({headers:validHeaders,grant,active,
  authorityCommitPresentOnBase:true,authorityCommitAncestral:true}).trusted,true);
for (const change of [
  {authorityCommitPresentOnBase:false}, {authorityCommitAncestral:false},
  {headers:{...validHeaders,from:"coder"}},
  {grant:{...grant,digest:"sha256:"+"0".repeat(64)}},
]) assert.throws(()=>validateAuthorityClaim({headers:change.headers??validHeaders,
  grant:change.grant??grant,active,authorityCommitPresentOnBase:change.authorityCommitPresentOnBase??true,
  authorityCommitAncestral:change.authorityCommitAncestral??true}),/authority|issuer|digest|ancestr|candidate/i);

// 005-008: ordinary mail stays idle-only while nested unblockers are atomic and resumable.
const queueRoot=await mkdtemp(path.join(os.tmpdir(),"swarmforge-unblocker-contract-"));
const activeDir=path.join(queueRoot,"ordinary","in_process");
await mkdir(activeDir,{recursive:true});
await writeFile(path.join(activeDir,"active.handoff"),Object.entries(active)
  .filter(([key])=>key!=="path").map(([key,value])=>`${key}: ${value}`).join("\n")+"\n\nwork\n");
const delivered=await deliverUnblocker({queueRoot,headers:{...validHeaders,from:"specifier"},body:"bounded",
  grant,active,authorityCommitPresentOnBase:true,authorityCommitAncestral:true});
assert.match(delivered.notification,/USER-AUTHORIZED UNBLOCKER/u);
assert.match(delivered.notification,/next safe boundary/u);
assert.equal(delivered.activeRetained,true);
const claimed=await claimUnblocker({queueRoot,active});
assert.equal(claimed.status,"claimed");
const secondClaim=await claimUnblocker({queueRoot,active});
assert.equal(secondClaim.status,"already-claimed");
const resumed=await completeUnblocker({queueRoot,active});
assert.equal(resumed.status,"resume");
assert.equal(resumed.active.id,active.id);
const duplicate=await deliverUnblocker({queueRoot,headers:{...validHeaders,from:"specifier"},body:"bounded",
  grant,active,authorityCommitPresentOnBase:true,authorityCommitAncestral:true});
assert.equal(duplicate.status,"completed-duplicate");
await assert.rejects(deliverUnblocker({queueRoot,headers:{...validHeaders,from:"specifier"},body:"changed",
  grant,active,authorityCommitPresentOnBase:true,authorityCommitAncestral:true}),/collision/i);
const staleActive={...active,id:"different-active"};
const stale=await deliverUnblocker({queueRoot,headers:{...validHeaders,from:"specifier",
  name:"stale-route"},body:"",grant,active:staleActive,
  authorityCommitPresentOnBase:true,authorityCommitAncestral:true});
assert.equal(stale.status,"stale");
assert.equal(stale.activeRetained,true);
const replacement={id:"20260818T010100Z_000002_from_specifier",from:"specifier",recipient:"coder",
  task:active.task,path:"replacement.handoff"};
const replaceHeaders={...validHeaders,from:"specifier",name:"replace-stopped-candidate",mode:"replace",
  supersedes:active.id,"replacement-handoff":replacement.id};
await deliverUnblocker({queueRoot,headers:replaceHeaders,body:"replace exact binding",grant,active,
  authorityCommitPresentOnBase:true,authorityCommitAncestral:true});
const replaceClaim=await claimUnblocker({queueRoot,active});
let claimedContent=await readFile(replaceClaim.file,"utf8");
claimedContent=claimedContent.replace(/claimed_by: \d+/u,"claimed_by: 99999999");
await writeFile(replaceClaim.file,claimedContent);
assert.equal((await claimUnblocker({queueRoot,active})).reclaimed,true);
const ordinaryNew=path.join(queueRoot,"ordinary-new"),ordinaryCurrent=path.join(queueRoot,"ordinary-current"),
  ordinaryCompleted=path.join(queueRoot,"ordinary-completed");
await mkdir(ordinaryNew,{recursive:true}); await mkdir(ordinaryCurrent,{recursive:true});
const activeFile=path.join(ordinaryCurrent,"active.handoff"),replacementFile=path.join(ordinaryNew,"replacement.handoff");
await writeFile(activeFile,"active\n"); await writeFile(replacementFile,"replacement\n");
const replaced=await completeUnblocker({queueRoot,active,replacement,ordinaryState:{activeFile,replacementFile,
  completedDir:ordinaryCompleted,inProcessDir:ordinaryCurrent}});
assert.equal(replaced.status,"replace");
assert.equal(await readFile(path.join(ordinaryCompleted,"active.handoff"),"utf8"),"active\n");
assert.equal(await readFile(path.join(ordinaryCurrent,"replacement.handoff"),"utf8"),"replacement\n");

// 009: the launch plan, not catalogue or literal pack count, defines bounded scope.
assert.equal(boundedExecutionScope({catalogueSize:20,authorizedTasks:["build:dist","browser:one"],
  prerequisiteTasks:["toolchain"]}).taskCount,3);
assert.equal(boundedExecutionScope({catalogueSize:2,authorizedTasks:Array.from({length:100},(_,i)=>`t${i}`),
  prerequisiteTasks:[]}).materiallyBroad,true);

// 012-016: one assessment preserves a stack, resumes it, and prevents preparation loops.
const assessed=aggregateCampsiteAssessment({task:"documentation-templates",candidate:"c".repeat(40),
  causalPaths:["src/broad-a.ts","src/broad-b.ts","src/broad-a.ts"]});
assert.deepEqual(assessed.causalPaths,["src/broad-a.ts","src/broad-b.ts"]);
const manifest=createRemainderManifest({task:assessed.task,splitBase:"1".repeat(40),
  prerequisiteCommit:"2".repeat(40),remainderHead:"3".repeat(40),remainderTree:"4".repeat(40),
  orderedCommits:["3".repeat(40)],changeSetDigest:"5".repeat(64),causalPaths:assessed.causalPaths,
  boundaryGeneration:"shell-v1",expectedPostRebaseDelta:"6".repeat(64)});
assert.equal(manifest.remainder.task,"documentation-templates");
assert.equal(manifest.remainder.orderedCommits.length,1);
const resumedStack=resumeRemainder(manifest,{newQaHead:"7".repeat(40),
  observedPostRebaseDelta:"6".repeat(64),resumedHead:"8".repeat(40)});
assert.equal(resumedStack.reissuedTask,"documentation-templates");
assert.equal(resumedStack.status,"resumed");
const dispositions=[];
recordDisposition(dispositions,{task:manifest.task,path:"src/broad-a.ts",boundary:"shell",
  generation:"shell-v1",result:"parent-fallback",failedPremise:"no stable narrower observation",
  consumers:["shell"]});
assert.throws(()=>recordDisposition(dispositions,{task:manifest.task,path:"src/broad-a.ts",
  boundary:"shell",generation:"shell-v1",result:"slice",consumers:["shell"]}),/already has a disposition/i);
assert.equal(recordDisposition(dispositions,{task:manifest.task,path:"src/broad-a.ts",
  boundary:"shell",generation:"shell-v2",result:"slice",consumers:["shell"]}).generation,"shell-v2");
assert.throws(()=>resumeRemainder(manifest,{newQaHead:"7".repeat(40),
  observedPostRebaseDelta:"9".repeat(64),resumedHead:"8".repeat(40)}),/delta/i);

assert.equal((await readFile(path.join(queueRoot,"unblockers","completed",delivered.filename),"utf8"))
  .includes("content-digest:"),true);

// The real daemon classifies the structured type and emits trusted control input, not idle mail.
const daemonFixture=await mkdtemp(path.join(os.tmpdir(),"swarmforge-unblocker-daemon-"));
try {
  const project=path.join(daemonFixture,"project"),senderRoot=path.join(daemonFixture,"specifier"),
    recipientRoot=path.join(daemonFixture,"coder"),fakeBin=path.join(daemonFixture,"bin");
  await mkdir(path.join(project,".swarmforge"),{recursive:true});
  await mkdir(path.join(senderRoot,".swarmforge/handoffs/outbox"),{recursive:true});
  await mkdir(path.join(recipientRoot,".swarmforge/handoffs/inbox/in_process"),{recursive:true});
  await mkdir(path.join(recipientRoot,"docs/swarmforge-authorities"),{recursive:true});
  await mkdir(fakeBin,{recursive:true});
  await git(recipientRoot,"init","-q"); await git(recipientRoot,"config","user.name","Daemon Test");
  await git(recipientRoot,"config","user.email","daemon@example.test");
  await writeFile(path.join(recipientRoot,"docs/swarmforge-authorities/outcome-bounded-autonomy-v1.json"),
    `${JSON.stringify(grant,null,2)}\n`);
  await git(recipientRoot,"add","."); await git(recipientRoot,"commit","-qm","authority");
  const authorityCommit=await git(recipientRoot,"rev-parse","HEAD");
  await writeFile(path.join(recipientRoot,"base.txt"),"accepted QA base\n");
  await git(recipientRoot,"add","base.txt"); await git(recipientRoot,"commit","-qm","base");
  const acceptedBase=await git(recipientRoot,"rev-parse","HEAD");
  const daemonActive={...active,commit:acceptedBase,base:acceptedBase};
  await writeFile(path.join(recipientRoot,".swarmforge/handoffs/inbox/in_process/active.handoff"),
    Object.entries(daemonActive).filter(([key])=>key!=="path").map(([key,value])=>`${key}: ${value}`)
      .join("\n")+"\n\nactive\n");
  const daemonHeaders={...validHeaders,id:"generated-id",from:"specifier",
    "authority-commit":authorityCommit,created_at:new Date().toISOString()};
  const outboxFile=path.join(senderRoot,".swarmforge/handoffs/outbox/00_unblocker.handoff");
  await writeFile(outboxFile,Object.entries(daemonHeaders).map(([key,value])=>`${key}: ${value}`)
    .join("\n")+"\n\nbounded\n");
  await writeFile(path.join(project,".swarmforge/roles.tsv"),
    `specifier\tspecifier\t${senderRoot}\tspecifier-session\tSpecifier\tcodex\ttask\n`+
    `coder\tcoder\t${recipientRoot}\tcoder-session\tCoder\tcodex\ttask\n`);
  await writeFile(path.join(project,".swarmforge/tmux-socket"),"fixture-socket\n");
  const tmuxLog=path.join(daemonFixture,"tmux.log");
  await writeFile(path.join(fakeBin,"tmux"),'#!/bin/sh\nprintf \'%s\\n\' "$*" >> "$TMUX_LOG"\n',
    {mode:0o755});
  await exec("bb",[path.resolve("swarmforge/scripts/handoffd.bb"),project,"--once"],{
    cwd:path.resolve("."),env:{...process.env,PATH:`${fakeBin}${path.delimiter}${process.env.PATH}`,TMUX_LOG:tmuxLog}});
  const nested=await readdir(path.join(recipientRoot,".swarmforge/handoffs/inbox/unblockers/new"));
  assert.equal(nested.length,1);
  assert.equal((await readdir(path.join(senderRoot,".swarmforge/handoffs/sent"))).length,1);
  const notification=await readFile(tmuxLog,"utf8");
  assert.match(notification,/USER-AUTHORIZED UNBLOCKER/u);
  assert.match(notification,/next safe boundary/u);
  assert.doesNotMatch(notification,/If idle/u);
} finally { await rm(daemonFixture,{recursive:true,force:true}); }
console.log("SwarmForge outcome-bounded autonomy contracts passed.");
