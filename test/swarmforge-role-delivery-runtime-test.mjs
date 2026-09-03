import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { resolveOrdinaryNoteDeliveryLineage } from
  "../swarmforge/scripts/ordinary-note-delivery-lineage.mjs";
import { reconcileRoleDelivery } from "../swarmforge/scripts/role-liveness-adapter.mjs";
import { handoffIdentity, handoffLineageDigest } from
  "../swarmforge/scripts/role-handoff-identity.mjs";
import { active,exec,handoff,queued,removeRoleRuntimeRoot,roleRuntimeRoot,writeHandoff } from
  "./swarmforge-role-runtime-fixtures.mjs";

const root=await roleRuntimeRoot("delivery"),inbox=path.join(root,".swarmforge/handoffs/inbox"),
  activePath=path.join(inbox,"in_process/active.handoff"),
  queuedPath=path.join(inbox,"new/queued.handoff"),activityPath=path.join(root,
    ".swarmforge/role-liveness/activity.json");
let pane;
try {
  await writeHandoff(activePath,active); await writeHandoff(queuedPath,queued);
  await mkdir(path.dirname(activityPath),{recursive:true});
  await writeFile(activityPath,`${JSON.stringify({version:1,command:{id:"unrelated",pid:999999,
    task:"other-task",handoff:"other-handoff"},progressLease:null})}\n`);
  const unrelated=await reconcileRoleDelivery({worktree:root,queuedHandoffPath:queuedPath,
    now:"2026-09-03T05:30:01.000Z"});
  assert.equal(unrelated.liveness.effectiveState,"available");
  assert.deepEqual(await readdir(path.join(inbox,"in_process")),["queued.handoff"]);
  assert.deepEqual(await readdir(path.join(inbox,"new")),["active.handoff"]);
  const history=JSON.parse(await readFile(
    path.join(root,".swarmforge/role-liveness/transitions.json"),"utf8"));
  assert.deepEqual(history.transitions[0],{version:1,priorState:"working",nextState:"available",
    task:active.task,handoff:active.id,activityIdentity:null,reason:"expired active claim",
    at:"2026-09-03T05:30:01.000Z"});

  const project=path.join(root,"project"),sender=path.join(root,"sender"),
    recipient=path.join(root,"recipient"),fakeBin=path.join(root,"bin"),tmuxLog=path.join(root,"tmux.log");
  await mkdir(path.join(project,".swarmforge"),{recursive:true});
  await mkdir(path.join(sender,".swarmforge/handoffs/outbox"),{recursive:true});
  await mkdir(path.join(sender,".swarmforge/handoffs/inbox/in_process"),{recursive:true});
  await mkdir(path.join(recipient,".swarmforge/handoffs/inbox/in_process"),{recursive:true});
  await mkdir(path.join(recipient,".swarmforge/role-liveness"),{recursive:true});
  await mkdir(fakeBin,{recursive:true});
  pane=spawn("sleep",["30"],{stdio:"ignore"});
  await new Promise((resolve,reject)=>pane.once("spawn",resolve).once("error",reject));
  await writeFile(path.join(project,".swarmforge/roles.tsv"),
    `sender\tsender\t${sender}\tsender-session\tSender\tcodex\ttask\n`+
    `coder\tcoder\t${recipient}\tcoder-session\tCoder\tsleep\ttask\n`);
  await writeFile(path.join(project,".swarmforge/tmux-socket"),"fixture-socket\n");
  await exec("git",["init","-q"],{cwd:sender});
  await exec("git",["config","user.email","test@example.invalid"],{cwd:sender});
  await exec("git",["config","user.name","Test"],{cwd:sender});
  await writeFile(path.join(sender,"source"),"source\n");
  await exec("git",["add","source"],{cwd:sender});
  await exec("git",["commit","-q","-m","source"],{cwd:sender});
  const sourceCommit=(await exec("git",["rev-parse","HEAD"],{cwd:sender})).stdout.trim(),
    sourceHandoff={id:"sender-source",from:"specifier",recipient:"sender",type:"git_handoff",
      task:"sender-task",base:sourceCommit.slice(0,10),commit:sourceCommit.slice(0,10),
      dequeued_at:"2026-09-03T05:00:00.000Z"};
  await writeHandoff(path.join(sender,".swarmforge/handoffs/inbox/in_process/source.handoff"),
    sourceHandoff);
  await writeHandoff(path.join(recipient,
    ".swarmforge/handoffs/inbox/in_process/active.handoff"),active);
  await writeFile(path.join(recipient,".swarmforge/role-liveness/activity.json"),
    `${JSON.stringify({version:1,command:{id:"dead",pid:999999,task:active.task,
      handoff:active.id},progressLease:null})}\n`);
  await writeFile(path.join(sender,".swarmforge/handoffs/outbox/00_queued.handoff"),
    handoff({...queued,to:"coder",type:"note",priority:"00",
      created_at:"2026-09-03T05:30:00.000Z"}));
  await writeFile(path.join(fakeBin,"tmux"),
    "#!/bin/sh\nprintf '%s\\n' \"$*\" >> \"$TMUX_LOG\"\nprintf '%s\\n' \"$PANE_PID\"\n",
    {mode:0o755});
  await exec("bb",[path.resolve("swarmforge/scripts/handoffd.bb"),project,"--once"],{
    cwd:path.resolve("."),env:{...process.env,PATH:`${fakeBin}${path.delimiter}${process.env.PATH}`,
      TMUX_LOG:tmuxLog,PANE_PID:String(pane.pid)}});
  assert.deepEqual(await readdir(path.join(recipient,".swarmforge/handoffs/inbox/new")),
    ["active.handoff"]);
  assert.deepEqual(await readdir(path.join(recipient,".swarmforge/handoffs/inbox/in_process")),
    ["00_queued.handoff"]);
  const deliveredText=await readFile(path.join(recipient,
    ".swarmforge/handoffs/inbox/in_process/00_queued.handoff"),"utf8"),
    delivered=handoffIdentity(deliveredText),lineage={handoff:sourceHandoff.id,
      task:sourceHandoff.task,base:sourceCommit,commit:sourceCommit};
  assert.deepEqual(delivered.lineage,lineage,
    "an older note receives its exact active source lineage before delivery");
  assert.equal(delivered["lineage-digest"],handoffLineageDigest(lineage));
  assert.match(await readFile(tmuxLog,"utf8"),/queued-handoff.*Process it now/u);
  await writeFile(path.join(recipient,".swarmforge/roles.tsv"),
    `coder\tcoder\t${recipient}\tcoder-session\tCoder\tsleep\ttask\n`);
  await exec("git",["init","-q"],{cwd:recipient});
  const received=(await exec(path.resolve("swarmforge/scripts/ready_for_next.sh"),[],{
    cwd:recipient,env:{...process.env,SWARMFORGE_ROLE:"coder"}})).stdout;
  assert.match(received,/TASK_NAME: queued-task/u);

  const completedDirectory=path.join(sender,".swarmforge/handoffs/inbox/completed");
  await mkdir(completedDirectory,{recursive:true});
  await writeHandoff(path.join(completedDirectory,"source.handoff"),{
    ...sourceHandoff,completed_at:"2026-09-03T05:30:01.000Z"});
  await rm(path.join(sender,".swarmforge/handoffs/inbox/in_process"),{recursive:true,force:true});
  const oldNote=handoff({...queued,to:"coder",type:"note",priority:"00",
    created_at:"2026-09-03T05:30:00.000Z"}),completedFallback=
      await resolveOrdinaryNoteDeliveryLineage({text:oldNote,senderWorktree:sender,
        senderRole:"sender"});
  assert.deepEqual(handoffIdentity(completedFallback.text).lineage,lineage,
    "a source completed after note creation supplies the same lineage");
  const currentText=completedFallback.text,currentResult=await resolveOrdinaryNoteDeliveryLineage({
    text:currentText,senderWorktree:sender,senderRole:"sender"});
  assert.equal(currentResult.text,currentText,"valid current lineage passes through byte-for-byte");
  await writeHandoff(path.join(completedDirectory,"ambiguous.handoff"),{
    ...sourceHandoff,id:"sender-source-two",completed_at:"2026-09-03T05:30:01.000Z"});
  await assert.rejects(resolveOrdinaryNoteDeliveryLineage({text:oldNote,
    senderWorktree:sender,senderRole:"sender"}),/exactly one completed source Git handoff/u,
  "ambiguous completed sources fail closed");
  await rm(path.join(completedDirectory,"ambiguous.handoff"));
  await writeFile(path.join(completedDirectory,"source.handoff"),handoff({
    id:sourceHandoff.id,from:sourceHandoff.from,recipient:sourceHandoff.recipient,
    type:sourceHandoff.type,base:sourceHandoff.base,commit:sourceHandoff.commit,
    dequeued_at:sourceHandoff.dequeued_at,completed_at:"2026-09-03T05:30:01.000Z"}));
  await assert.rejects(resolveOrdinaryNoteDeliveryLineage({text:oldNote,
    senderWorktree:sender,senderRole:"sender"}),/missing task, base, or commit/u,
  "an incomplete source identity fails closed");
  const orphan=(await exec("git",["commit-tree",`${sourceCommit}^{tree}`,"-m","orphan"],
    {cwd:sender})).stdout.trim();
  await writeHandoff(path.join(completedDirectory,"source.handoff"),{
    ...sourceHandoff,commit:orphan.slice(0,10),completed_at:"2026-09-03T05:30:01.000Z"});
  await assert.rejects(resolveOrdinaryNoteDeliveryLineage({text:oldNote,
    senderWorktree:sender,senderRole:"sender"}),/not ancestral/u,
  "a non-ancestral source identity fails closed");

  await rm(completedDirectory,{recursive:true,force:true});
  await writeFile(path.join(recipient,".swarmforge/role-liveness/activity.json"),
    `${JSON.stringify({version:1,command:{id:"live",pid:pane.pid,task:queued.task,
      handoff:queued.id},progressLease:null})}\n`);
  const activeBefore=await readFile(path.join(recipient,
    ".swarmforge/handoffs/inbox/in_process/00_queued.handoff"),"utf8"),
    newBefore=await readdir(path.join(recipient,".swarmforge/handoffs/inbox/new"));
  await writeFile(tmuxLog,"");
  await writeFile(path.join(sender,".swarmforge/handoffs/outbox/01_missing.handoff"),oldNote);
  await exec("bb",[path.resolve("swarmforge/scripts/handoffd.bb"),project,"--once"],{
    cwd:path.resolve("."),env:{...process.env,PATH:`${fakeBin}${path.delimiter}${process.env.PATH}`,
      TMUX_LOG:tmuxLog,PANE_PID:String(pane.pid)}});
  assert.equal(await readFile(path.join(recipient,
    ".swarmforge/handoffs/inbox/in_process/00_queued.handoff"),"utf8"),activeBefore);
  assert.deepEqual(await readdir(path.join(recipient,".swarmforge/handoffs/inbox/new")),newBefore,
    "rejection leaves the recipient queue unchanged");
  assert.deepEqual(await readdir(path.join(sender,".swarmforge/handoffs/failed")),
    ["01_missing.handoff"]);
  const failureNotice=await readFile(tmuxLog,"utf8");
  assert.match(failureNotice,/sender-session.*exactly one completed source Git handoff/u,
    "the sender receives the exact lineage failure while idle");
  assert.doesNotMatch(failureNotice,/coder-session/u,"rejection does not notify the recipient");
} finally {
  pane?.kill(); await removeRoleRuntimeRoot(root);
}

console.log("SwarmForge role delivery runtime contracts passed.");

if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const normalize=(value)=>Array.isArray(value)?value.map(normalize):value&&typeof value==="object"
    ?Object.fromEntries(Object.entries(value).sort(([left],[right])=>left.localeCompare(right))
      .map(([key,nested])=>[key,normalize(nested)])):value;
  const digest=(value)=>createHash("sha256").update(JSON.stringify(normalize(value))).digest("hex");
  const expectedPreRepairFailure={paneRoot:"pid-1",unrelatedDescendantVisible:true};
  const expectedRepairResult={paneRoot:"controlled-idle-process",unrelatedDescendantVisible:false};
  const fixture={id:"controlled-idle-pane-observation-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:{observationBoundary:"tmux pane process tree"},
    expectedPreRepairFailure,expectedRepairResult};
  const fixtureDigest=digest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed:expectedRepairResult}}}));
}
