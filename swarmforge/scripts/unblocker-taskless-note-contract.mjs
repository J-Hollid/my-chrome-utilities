import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { authorityDigest, validateTransportUnblocker } from "./unblocker-authority.mjs";
import { claimActiveUnblocker, completeActiveUnblocker, deliverUnblockerFile,
  resolveActiveHandoff, sendUnblocker } from "./unblocker-adapters.mjs";
import { parseHandoff } from "./unblocker-format.mjs";
import { recordedNoteLineage } from "./unblocker-note-lineage.mjs";
import { handoffLineageDigest } from "./role-handoff-identity.mjs";

const exec=promisify(execFile),authority="outcome-bounded-autonomy-v1";
const swarmHandoff=path.resolve("swarmforge/scripts/swarm_handoff.sh");
async function git(root,...args) {
  return (await exec("git",args,{cwd:root,encoding:"utf8"})).stdout.trim();
}
async function writeActive(root,lineage,id) {
  const directory=path.join(root,".swarmforge/handoffs/inbox/in_process");
  await mkdir(directory,{recursive:true});
  const lines=[`id: ${id}`,"from: specifier","recipient: coder","type: note",
    "priority: 00",...(lineage?[`lineage-handoff: ${lineage.handoff}`,
      `lineage-task: ${lineage.task}`,`lineage-base: ${lineage.base}`,
      `lineage-commit: ${lineage.commit}`,`lineage-digest: ${handoffLineageDigest(lineage)}`]:[])];
  await writeFile(path.join(directory,"active.handoff"),`${lines.join("\n")}\n\nWait.\n`);
}
async function noteDraft(root) {
  const file=path.join(root,"note.draft");
  await writeFile(file,["type: note","to: coder","priority: 00",
    "message: Wait for authority","","Wait.",""].join("\n"));
  return file;
}
async function draft(root,activeId,name="taskless-note-resume") {
  const file=path.join(root,"unblocker.draft");
  await writeFile(file,["type: unblocker","to: coder","priority: 00",
    `name: ${name}`,`authority: ${authority}`,
    "authority-commit: AUTHORITY_COMMIT",`task: ${activeId}`,
    `active-handoff: ${activeId}`,"mode: resume","supersedes: taskless-note-wait",
    "message: Resume taskless note","","Resume the taskless note.",""].join("\n"));
  return file;
}
async function authorizedDraft(root,authorityCommit,activeId,name) {
  const file=await draft(root,activeId,name);
  await writeFile(file,(await readFile(file,"utf8")).replace("AUTHORITY_COMMIT",authorityCommit));
  return file;
}

export async function verifyTasklessNoteUnblockerBinding() {
  const root=await mkdtemp(path.join(os.tmpdir(),"swarmforge-taskless-note-unblocker-"));
  const priorRole=process.env.SWARMFORGE_ROLE;
  try {
    await git(root,"init","-q"); await git(root,"config","user.email","test@example.invalid");
    await git(root,"config","user.name","Test");
    await writeFile(path.join(root,"empty"),"empty\n"); await git(root,"add","empty");
    await git(root,"commit","-q","-m","before authority");
    const missingAuthorityCommit=await git(root,"rev-parse","HEAD^{commit}");
    const grantWithoutDigest={version:1,name:authority,approvedBy:"user",approvedAt:"2026-08-17",
      issuerRoles:["specifier"],outcomeBoundaries:{reversible:true,
        preserveApprovedUserVisibleBehavior:true,noMaterialExternalRiskIncrease:true,
        noUserOnlyAuthorityCredentialOrInformation:true,noMaterialGlobalScopeOrCostExpansion:true,
        preserveOrStrengthenSafetyAndEvidence:true},doesNotAuthorize:["product behavior changes"],
      acceptanceFeature:"features/swarmforge-outcome-bounded-autonomy-and-unblockers.feature",
      digestAlgorithm:"sha256-canonical-json-without-digest"};
    const grant={...grantWithoutDigest,digest:`sha256:${authorityDigest(grantWithoutDigest)}`};
    await mkdir(path.join(root,"docs/swarmforge-authorities"),{recursive:true});
    await writeFile(path.join(root,`docs/swarmforge-authorities/${authority}.json`),
      `${JSON.stringify(grant)}\n`); await git(root,"add","docs");
    await git(root,"commit","-q","-m","authority");
    const authorityCommit=await git(root,"rev-parse","HEAD^{commit}");
    await mkdir(path.join(root,".swarmforge"),{recursive:true});
    await writeFile(path.join(root,".swarmforge/roles.tsv"),
      `specifier\tspecifier\t${root}\tspecifier-session\tSpecifier\tcodex\ttask\n`+
      `coder\tcoder\t${root}\tcoder-session\tCoder\tcodex\ttask\n`);
    await mkdir(path.join(root,".swarmforge/handoffs/inbox/in_process"),{recursive:true});
    await writeFile(path.join(root,".swarmforge/handoffs/inbox/in_process/active.handoff"),
      `id: source-specification\nfrom: specifier\nrecipient: specifier\ntype: git_handoff\n`+
      `task: source-task\nbase: ${authorityCommit}\ncommit: ${authorityCommit}\n\nWork.\n`);
    const lineageRecord=await recordedNoteLineage(root),
      lineage={handoff:lineageRecord.handoff,task:lineageRecord.task,
        base:lineageRecord.base,commit:lineageRecord.commit};
    assert.deepEqual(lineage,{handoff:"source-specification",task:"source-task",
      base:authorityCommit,commit:authorityCommit},
    "note lineage comes from the sender's recorded active handoff");
    process.env.SWARMFORGE_ROLE="specifier";
    await exec(swarmHandoff,[await noteDraft(root)],{cwd:root,encoding:"utf8",
      env:{...process.env,SWARMFORGE_ROLE:"specifier"}});
    const outbox=path.join(root,".swarmforge/handoffs/outbox"),
      queuedFiles=(await readdir(outbox)).filter((name)=>name.endsWith(".handoff"));
    assert.equal(queuedFiles.length,1);
    const queuedText=await readFile(path.join(outbox,queuedFiles[0]),"utf8"),
      queued=parseHandoff(queuedText),activeId=queued.headers.id;
    assert.equal(queued.headers["lineage-handoff"],lineage.handoff);
    assert.equal(queued.headers["lineage-task"],lineage.task);
    assert.equal(queued.headers["lineage-base"],lineage.base);
    assert.equal(queued.headers["lineage-commit"],lineage.commit);
    assert.equal(queued.headers["lineage-digest"],handoffLineageDigest(lineage),
      "queued note content contains immutable lineage before daemon delivery");
    const activeFile=path.join(root,".swarmforge/handoffs/inbox/in_process/active.handoff");
    await writeFile(activeFile,queuedText.replace("\nto: coder\n","\nto: coder\nrecipient: coder\n"));
    const draftFile=await authorizedDraft(root,authorityCommit,activeId);
    const source=await sendUnblocker(root,draftFile,{sequenceLoader:async()=>"000001"});
    const transported=parseHandoff(await readFile(source,"utf8"));
    validateTransportUnblocker(transported.headers,transported.body);
    assert.equal(transported.headers.to,"coder");
    assert.equal(transported.headers["active-handoff"],activeId);
    assert.equal(transported.headers["active-lineage-digest"],handoffLineageDigest(lineage));
    const active=await resolveActiveHandoff(root,activeId);
    assert.equal(active.task,active.id,"the taskless note uses its handoff id as its task");
    assert.equal(active.lineage.base,authorityCommit);
    assert.equal((await deliverUnblockerFile(source,root,"specifier")).status,"queued");
    assert.equal((await claimActiveUnblocker(root,active.id)).binding.task,active.id);
    assert.equal((await completeActiveUnblocker(root,active.id)).binding.task,active.id);

    const changedSource=await sendUnblocker(root,await authorizedDraft(root,authorityCommit,
      activeId,"taskless-note-changed-lineage"),
      {sequenceLoader:async()=>"000002"});
    await git(root,"commit","--allow-empty","-q","-m","changed candidate");
    const changedCommit=await git(root,"rev-parse","HEAD^{commit}");
    await writeActive(root,{...lineage,commit:changedCommit},activeId);
    await assert.rejects(deliverUnblockerFile(changedSource,root,"specifier"),
      /active note lineage/u,"a changed active-note lineage rejects the bound unblocker");
    await writeActive(root,null,activeId);
    await assert.rejects(exec(swarmHandoff,[await noteDraft(root)],{cwd:root,encoding:"utf8",
      env:{...process.env,SWARMFORGE_ROLE:"specifier"}}),
    /exact recorded base and commit/u,"note creation fails without immutable recorded lineage");
    await assert.rejects(sendUnblocker(root,await authorizedDraft(root,authorityCommit,activeId),
      {sequenceLoader:async()=>"000003"}),
      /immutable recorded lineage/u,"a missing note lineage fails closed");
    await writeActive(root,{...lineage,base:missingAuthorityCommit,commit:missingAuthorityCommit},activeId);
    await assert.rejects(sendUnblocker(root,await authorizedDraft(root,authorityCommit,activeId),
      {sequenceLoader:async()=>"000004"}),
      /Candidate-only authority grant/u,"authority must be present on the recorded lineage");
    const orphan=await git(root,"commit-tree",`${authorityCommit}^{tree}`,"-m","orphan lineage");
    await writeActive(root,{...lineage,base:orphan,commit:orphan},activeId);
    await assert.rejects(sendUnblocker(root,await authorizedDraft(root,authorityCommit,activeId),
      {sequenceLoader:async()=>"000005"}),
      /accepted ancestry/u,"the authority commit must be ancestral to the recorded lineage");
  } finally {
    if (priorRole===undefined) delete process.env.SWARMFORGE_ROLE;
    else process.env.SWARMFORGE_ROLE=priorRole;
    await rm(root,{recursive:true,force:true});
  }
}
