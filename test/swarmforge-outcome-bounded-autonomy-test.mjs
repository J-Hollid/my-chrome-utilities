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
  unblockerContentDigest,
  validateAuthorityClaim,
  validateUnblockerDraft,
  claimUnblocker,
} from "../swarmforge/scripts/unblocker-control.mjs";
import { runUnblockerJournal } from "../swarmforge/scripts/unblocker-journal.mjs";
import { withQueueLock } from "../swarmforge/scripts/unblocker-queue-storage.mjs";
import {
  aggregateCampsiteAssessment,
  createRemainderManifest,
  recordDisposition,
  resumeRemainder,
} from "../scripts/stacked-campsite-control.mjs";

const exec=promisify(execFile);
const unblockerControl=path.resolve("swarmforge/scripts/unblocker-control.mjs");
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
for (const field of ["id","from","recipient","created_at","enqueued_at","dequeued_at",
  "completed_at","content-digest","unexpected-field"]) {
  assert.throws(()=>validateUnblockerDraft({...validHeaders,[field]:"agent-authored"},""),
    /reserved|unknown|generated/i,field);
}
const rejectedSendRoot=await mkdtemp(path.join(os.tmpdir(),"swarmforge-unblocker-send-reject-"));
for (const field of ["id","from","recipient","created_at","enqueued_at","dequeued_at",
  "completed_at","content-digest","unexpected-field"]) {
  const draft=path.join(rejectedSendRoot,`${field}.handoff`);
  await writeFile(draft,`${Object.entries({...validHeaders,[field]:"agent-authored"})
    .map(([key,value])=>`${key}: ${value}`).join("\n")}\n\nbounded`);
  await assert.rejects(exec(process.execPath,[unblockerControl,"send",draft],{
    cwd:rejectedSendRoot,env:{...process.env,SWARMFORGE_ROLE:"specifier"}}),
  /reserved|unknown|generated/i,field);
}
assert.equal((await readdir(rejectedSendRoot)).some((name)=>name===".swarmforge"),false,
  "draft rejection occurs before sequence allocation or outbox creation");
await rm(rejectedSendRoot,{recursive:true,force:true});
for (const [field,value] of [["to","coder,refactorer"],["priority","01"],["mode","run"],
  ["message","x".repeat(81)]]) {
  assert.throws(()=>validateUnblockerDraft({...validHeaders,[field]:value},""),/unblocker/i);
}
assert.equal(validateAuthorityClaim({headers:validHeaders,grant,active,
  authorityCommitPresentOnBase:true,authorityCommitAncestral:true}).trusted,true);
assert.equal(validateAuthorityClaim({headers:{...validHeaders,from:"specifier"},grant,
  active:{...active,from:"coder"},authorityCommitPresentOnBase:true,
  authorityCommitAncestral:true}).trusted,true);
assert.throws(()=>validateAuthorityClaim({headers:{...validHeaders,from:"specifier",mode:"replace",
  supersedes:active.id,"replacement-handoff":"replacement"},grant,active:{...active,from:"coder"},
  authorityCommitPresentOnBase:true,authorityCommitAncestral:true}),/replace.*sender|sender.*replace/i);
const crossRoleRoot=await mkdtemp(path.join(os.tmpdir(),"swarmforge-unblocker-cross-role-"));
const crossRoleActive={...active,from:"coder"};
assert.equal((await deliverUnblocker({queueRoot:crossRoleRoot,
  headers:{...validHeaders,from:"specifier",name:"cross-role-resume"},body:"bounded",grant,
  active:crossRoleActive,authorityCommitPresentOnBase:true,
  authorityCommitAncestral:true})).status,"queued");
assert.equal((await claimUnblocker({queueRoot:crossRoleRoot,active:crossRoleActive,grant,
  authorityCommitPresentOnBase:true,authorityCommitAncestral:true})).status,"claimed");
await rm(crossRoleRoot,{recursive:true,force:true});
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

const staleClaimRoot=await mkdtemp(path.join(os.tmpdir(),"swarmforge-unblocker-stale-claim-"));
await deliverUnblocker({queueRoot:staleClaimRoot,
  headers:{...validHeaders,from:"specifier",name:"queued-before-active-changed"},body:"bounded",grant,active,
  authorityCommitPresentOnBase:true,authorityCommitAncestral:true});
assert.equal((await claimUnblocker({queueRoot:staleClaimRoot,active:{...active,id:"new-active"}})).status,"none");
const [staleClaimFile]=await readdir(path.join(staleClaimRoot,"unblockers","failed"));
assert.match(await readFile(path.join(staleClaimRoot,"unblockers","failed",staleClaimFile),"utf8"),
  /failure-reason: stale binding/u);
await rm(staleClaimRoot,{recursive:true,force:true});

const bindingRecoveryRoot=await mkdtemp(path.join(os.tmpdir(),"swarmforge-unblocker-binding-recovery-"));
await deliverUnblocker({queueRoot:bindingRecoveryRoot,
  headers:{...validHeaders,from:"specifier",name:"binding-specific-recovery"},body:"bounded",grant,active,
  authorityCommitPresentOnBase:true,authorityCommitAncestral:true});
await assert.rejects(runUnblockerJournal(bindingRecoveryRoot,{version:1,id:"unrelated-claim",kind:"claim",
  operations:[{type:"write",target:path.join(bindingRecoveryRoot,"unrelated.marker"),content:"done\n",
    boundary:"claim-written"}],result:{kind:"claim",status:"claimed",file:"unrelated",
    binding:{activeHandoff:"another-active",task:"another-task"}}},"claim-journal-written"),/injected/ui);
const bindingClaim=await claimUnblocker({queueRoot:bindingRecoveryRoot,active,grant,
  authorityCommitPresentOnBase:true,authorityCommitAncestral:true});
assert.equal(bindingClaim.headers.name,"binding-specific-recovery");
assert.equal(await readFile(path.join(bindingRecoveryRoot,"unrelated.marker"),"utf8"),"done\n");
await rm(bindingRecoveryRoot,{recursive:true,force:true});

const lockRaceRoot=await mkdtemp(path.join(os.tmpdir(),"swarmforge-unblocker-lock-race-"));
await mkdir(path.join(lockRaceRoot,"unblockers.lock"));
await writeFile(path.join(lockRaceRoot,"unblockers.lock","owner.json"),
  JSON.stringify({pid:99999999,token:"dead-owner"}));
let inside=0,maximumInside=0,staleObservations=0;
const contenders=Array.from({length:2},(_,index)=>withQueueLock(lockRaceRoot,async()=>{
  inside+=1; maximumInside=Math.max(maximumInside,inside);
  await new Promise((resolve)=>setTimeout(resolve,30));
  inside-=1; return index;
},{afterStaleObserved:async()=>{staleObservations+=1; await new Promise((resolve)=>setTimeout(resolve,30));}}));
assert.deepEqual((await Promise.all(contenders)).sort(),[0,1]);
assert.equal(maximumInside,1,"stale-owner recovery never removes a successor's lock");
assert.equal(staleObservations,1,"one guarded waiter retires the exact observed stale token");
await rm(lockRaceRoot,{recursive:true,force:true});

const tamperRoot=await mkdtemp(path.join(os.tmpdir(),"swarmforge-unblocker-tamper-"));
await deliverUnblocker({queueRoot:tamperRoot,headers:{...validHeaders,from:"specifier"},body:"bounded",
  grant,active,authorityCommitPresentOnBase:true,authorityCommitAncestral:true});
const [tamperFile]=await readdir(path.join(tamperRoot,"unblockers","new"));
const tamperPath=path.join(tamperRoot,"unblockers","new",tamperFile);
await writeFile(tamperPath,(await readFile(tamperPath,"utf8")).replace("mode: resume","mode: replace"));
await assert.rejects(claimUnblocker({queueRoot:tamperRoot,active,grant,
  authorityCommitPresentOnBase:true,authorityCommitAncestral:true}),/digest|modified/i);
await rm(tamperRoot,{recursive:true,force:true});

const completionTamperRoot=await mkdtemp(path.join(os.tmpdir(),"swarmforge-unblocker-complete-tamper-"));
await deliverUnblocker({queueRoot:completionTamperRoot,
  headers:{...validHeaders,from:"specifier",name:"completion-tamper"},body:"bounded",grant,active,
  authorityCommitPresentOnBase:true,authorityCommitAncestral:true});
const completionTamperClaim=await claimUnblocker({queueRoot:completionTamperRoot,active,grant,
  authorityCommitPresentOnBase:true,authorityCommitAncestral:true});
await writeFile(completionTamperClaim.file,(await readFile(completionTamperClaim.file,"utf8"))
  .replace("message: Resume bounded repair","message: Altered authority"));
await assert.rejects(completeUnblocker({queueRoot:completionTamperRoot,active,grant,
  authorityCommitPresentOnBase:true,authorityCommitAncestral:true}),/digest|modified/i);
await rm(completionTamperRoot,{recursive:true,force:true});
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
  completedDir:ordinaryCompleted,inProcessDir:ordinaryCurrent},grant,
  authorityCommitPresentOnBase:true,authorityCommitAncestral:true});
assert.equal(replaced.status,"replace");
assert.equal(await readFile(path.join(ordinaryCompleted,"active.handoff"),"utf8"),"active\n");
assert.equal(await readFile(path.join(ordinaryCurrent,"replacement.handoff"),"utf8"),"replacement\n");

for (const faultAt of ["claim-journal-written","claim-moved","claim-written"]) {
  const crashRoot=await mkdtemp(path.join(os.tmpdir(),"swarmforge-unblocker-claim-crash-"));
  const crashHeaders={...validHeaders,from:"specifier",name:`claim-crash-${faultAt}`};
  await deliverUnblocker({queueRoot:crashRoot,headers:crashHeaders,body:"bounded",grant,active,
    authorityCommitPresentOnBase:true,authorityCommitAncestral:true});
  await assert.rejects(claimUnblocker({queueRoot:crashRoot,active,grant,
    authorityCommitPresentOnBase:true,authorityCommitAncestral:true,faultAt}),/injected crash/i);
  const recovered=await claimUnblocker({queueRoot:crashRoot,active,grant,
    authorityCommitPresentOnBase:true,authorityCommitAncestral:true});
  assert.ok(["claimed","already-claimed"].includes(recovered.status),faultAt);
  assert.equal((await readdir(path.join(crashRoot,"unblockers","new"))).length,0,faultAt);
  assert.equal((await readdir(path.join(crashRoot,"unblockers","in_process"))).length,1,faultAt);
  await rm(crashRoot,{recursive:true,force:true});
}

const legacyDuplicateRoot=await mkdtemp(path.join(os.tmpdir(),"swarmforge-unblocker-legacy-duplicate-"));
const legacyDelivery=await deliverUnblocker({queueRoot:legacyDuplicateRoot,
  headers:{...validHeaders,from:"specifier",name:"legacy-copy-delete-crash"},body:"bounded",grant,active,
  authorityCommitPresentOnBase:true,authorityCommitAncestral:true});
const legacyNew=path.join(legacyDuplicateRoot,"unblockers","new",legacyDelivery.filename);
const legacyQueuedContent=await readFile(legacyNew,"utf8");
await claimUnblocker({queueRoot:legacyDuplicateRoot,active,grant,
  authorityCommitPresentOnBase:true,authorityCommitAncestral:true});
await writeFile(legacyNew,legacyQueuedContent);
assert.equal((await claimUnblocker({queueRoot:legacyDuplicateRoot,active,grant,
  authorityCommitPresentOnBase:true,authorityCommitAncestral:true})).status,"already-claimed");
assert.equal((await readdir(path.join(legacyDuplicateRoot,"unblockers","new"))).length,0,
  "a legacy copy-then-delete crash is retired exactly once");
await rm(legacyDuplicateRoot,{recursive:true,force:true});

for (const faultAt of ["complete-journal-written","complete-unblocker-moved",
  "complete-unblocker-written"]) {
  const crashRoot=await mkdtemp(path.join(os.tmpdir(),"swarmforge-unblocker-resume-crash-"));
  await deliverUnblocker({queueRoot:crashRoot,
    headers:{...validHeaders,from:"specifier",name:`resume-crash-${faultAt}`},body:"bounded",grant,active,
    authorityCommitPresentOnBase:true,authorityCommitAncestral:true});
  await claimUnblocker({queueRoot:crashRoot,active,grant,
    authorityCommitPresentOnBase:true,authorityCommitAncestral:true});
  await assert.rejects(completeUnblocker({queueRoot:crashRoot,active,grant,
    authorityCommitPresentOnBase:true,authorityCommitAncestral:true,faultAt}),/injected crash/i);
  assert.equal((await completeUnblocker({queueRoot:crashRoot,active,grant,
    authorityCommitPresentOnBase:true,authorityCommitAncestral:true})).status,"resume",faultAt);
  assert.equal((await readdir(path.join(crashRoot,"unblockers","in_process"))).length,0,faultAt);
  assert.equal((await readdir(path.join(crashRoot,"unblockers","completed"))).length,1,faultAt);
  await rm(crashRoot,{recursive:true,force:true});
}

for (const faultAt of ["complete-journal-written","complete-replacement-activated",
  "complete-active-archived","complete-unblocker-moved","complete-unblocker-written"]) {
  const crashRoot=await mkdtemp(path.join(os.tmpdir(),"swarmforge-unblocker-replace-crash-"));
  const crashReplacement={...replacement,id:`replacement-${faultAt}`};
  const crashHeaders={...validHeaders,from:"specifier",name:`replace-crash-${faultAt}`,mode:"replace",
    supersedes:active.id,"replacement-handoff":crashReplacement.id};
  await deliverUnblocker({queueRoot:crashRoot,headers:crashHeaders,body:"bounded",grant,active,
    authorityCommitPresentOnBase:true,authorityCommitAncestral:true});
  await claimUnblocker({queueRoot:crashRoot,active,grant,
    authorityCommitPresentOnBase:true,authorityCommitAncestral:true});
  const ordinaryNewDir=path.join(crashRoot,"ordinary","new");
  const ordinaryCurrentDir=path.join(crashRoot,"ordinary","in_process");
  const ordinaryCompletedDir=path.join(crashRoot,"ordinary","completed");
  await mkdir(ordinaryNewDir,{recursive:true}); await mkdir(ordinaryCurrentDir,{recursive:true});
  const crashActiveFile=path.join(ordinaryCurrentDir,"active.handoff");
  const crashReplacementFile=path.join(ordinaryNewDir,"replacement.handoff");
  await writeFile(crashActiveFile,"active\n"); await writeFile(crashReplacementFile,"replacement\n");
  const completion={queueRoot:crashRoot,active,replacement:crashReplacement,
    ordinaryState:{activeFile:crashActiveFile,replacementFile:crashReplacementFile,
      completedDir:ordinaryCompletedDir,inProcessDir:ordinaryCurrentDir},grant,
    authorityCommitPresentOnBase:true,authorityCommitAncestral:true};
  await assert.rejects(completeUnblocker({...completion,faultAt}),/injected crash/i);
  assert.equal((await completeUnblocker(completion)).status,"replace",faultAt);
  assert.equal(await readFile(path.join(ordinaryCompletedDir,"active.handoff"),"utf8"),"active\n",faultAt);
  assert.equal(await readFile(path.join(ordinaryCurrentDir,"replacement.handoff"),"utf8"),
    "replacement\n",faultAt);
  assert.equal((await readdir(path.join(crashRoot,"unblockers","in_process"))).length,0,faultAt);
  await rm(crashRoot,{recursive:true,force:true});
}

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
  observedPostRebaseDelta:"6".repeat(64),observedChangeSetDigest:"5".repeat(64),
  resumedHead:"8".repeat(40)});
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
  observedPostRebaseDelta:"9".repeat(64),observedChangeSetDigest:"5".repeat(64),
  resumedHead:"8".repeat(40)}),/delta/i);

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
  daemonHeaders["content-digest"]=unblockerContentDigest(daemonHeaders,"bounded\n");
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
  const daemonErrors=(await readdir(path.join(senderRoot,".swarmforge/handoffs/outbox")))
    .filter((name)=>name.endsWith(".error"));
  assert.deepEqual(daemonErrors,[],daemonErrors.length
    ? await readFile(path.join(senderRoot,".swarmforge/handoffs/outbox",daemonErrors[0]),"utf8") : "");
  const nested=await readdir(path.join(recipientRoot,".swarmforge/handoffs/inbox/unblockers/new"));
  assert.equal(nested.length,1);
  const helper=path.resolve("swarmforge/scripts/unblocker_claim.sh");
  const helperComplete=path.resolve("swarmforge/scripts/unblocker_complete.sh");
  assert.match((await exec(helper,[daemonActive.id],{cwd:recipientRoot})).stdout,/"status": "claimed"/u);
  assert.match((await exec(helperComplete,[daemonActive.id],{cwd:recipientRoot})).stdout,/RESUME:/u);
  const activeFile=path.join(recipientRoot,".swarmforge/handoffs/inbox/in_process/active.handoff");
  const batchDir=path.join(recipientRoot,".swarmforge/handoffs/inbox/in_process/batch_fixture");
  await mkdir(batchDir); await import("node:fs/promises").then(({rename})=>rename(activeFile,
    path.join(batchDir,"active.handoff")));
  await deliverUnblocker({queueRoot:path.join(recipientRoot,".swarmforge/handoffs/inbox"),
    headers:{...daemonHeaders,name:"installed-batch-helper",id:"installed-batch-helper"},body:"bounded\n",
    grant,active:daemonActive,authorityCommitPresentOnBase:true,authorityCommitAncestral:true});
  assert.match((await exec(helper,[daemonActive.id],{cwd:recipientRoot})).stdout,/"status": "claimed"/u);
  assert.match((await exec(helperComplete,[daemonActive.id],{cwd:recipientRoot})).stdout,/RESUME:/u);
  const installedReplacement={id:"installed-batch-replacement",from:"specifier",recipient:"coder",
    task:daemonActive.task,commit:acceptedBase,base:acceptedBase};
  const replacementPath=path.join(recipientRoot,
    ".swarmforge/handoffs/inbox/new/00_installed-batch-replacement.handoff");
  await mkdir(path.dirname(replacementPath),{recursive:true});
  await writeFile(replacementPath,Object.entries(installedReplacement).map(([key,value])=>`${key}: ${value}`)
    .join("\n")+"\n\nreplacement\n");
  await deliverUnblocker({queueRoot:path.join(recipientRoot,".swarmforge/handoffs/inbox"),
    headers:{...daemonHeaders,name:"installed-batch-replace",id:"installed-batch-replace",mode:"replace",
      supersedes:daemonActive.id,"replacement-handoff":installedReplacement.id},body:"bounded\n",
    grant,active:daemonActive,authorityCommitPresentOnBase:true,authorityCommitAncestral:true});
  assert.match((await exec(helper,[daemonActive.id],{cwd:recipientRoot})).stdout,/"status": "claimed"/u);
  assert.match((await exec(helperComplete,[daemonActive.id],{cwd:recipientRoot})).stdout,/"status":"replace"/u);
  assert.match(await readFile(path.join(batchDir,path.basename(replacementPath)),"utf8"),/replacement/u);
  assert.equal((await readdir(path.join(recipientRoot,
    ".swarmforge/handoffs/inbox/completed/batch_fixture"))).includes("active.handoff"),true);
  assert.equal((await readdir(path.join(senderRoot,".swarmforge/handoffs/sent"))).length,1);
  const notification=await readFile(tmuxLog,"utf8");
  assert.match(notification,/USER-AUTHORIZED UNBLOCKER/u);
  assert.match(notification,/next safe boundary/u);
  assert.doesNotMatch(notification,/If idle/u);
} finally { await rm(daemonFixture,{recursive:true,force:true}); }
console.log("SwarmForge outcome-bounded autonomy contracts passed.");
