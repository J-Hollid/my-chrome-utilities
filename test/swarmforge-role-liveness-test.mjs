import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  appendRoleStateTransition, completedAuthorityFollowUp, reconcileQueuedHandoff,
  roleLiveness, roleStateTransition, roleTimingSummary,
} from "../swarmforge/scripts/role-liveness.mjs";

const now="2026-09-03T05:30:00.000Z";
const handoff={ id:"20260903T051423Z_000859_from_specifier", task:"role-liveness",
  from:"architect", commit:"a".repeat(40) };

assert.equal(roleLiveness({reportedState:"working",
  command:{id:"command-1",pid:41,live:true},now}).effectiveState,"working");
assert.equal(roleLiveness({reportedState:"working",progressLease:{version:1,id:"lease-1",
  task:handoff.task,handoff:handoff.id,reason:"review",expiresAt:"2026-09-03T05:31:00.000Z"},now})
  .mailAction,"keep-queued");
assert.deepEqual(reconcileQueuedHandoff({reportedState:"working",command:{live:false},
  progressLease:{version:1,id:"lease-old",task:handoff.task,handoff:handoff.id,reason:"review",
    expiresAt:"2026-09-03T05:29:59.000Z"},queuedHandoff:handoff,now}),{
  version:1,reportedState:"working",effectiveState:"available",activityIdentity:null,
  reason:"expired active claim",mailAction:"activate-exact-handoff",nextHandoff:handoff,
  createdReceipt:false,createdReplacementHandoff:false,
});
assert.equal(roleLiveness({reportedState:"available",now}).effectiveState,"available");

assert.throws(()=>roleLiveness({reportedState:"working",command:{live:true,pid:0,id:"bad"},now}),
  /command evidence/u);
assert.throws(()=>roleLiveness({reportedState:"working",progressLease:{version:1,id:"lease"},now}),
  /incomplete identity/u);

const transition=roleStateTransition({priorState:"working",nextState:"available",
  task:handoff.task,handoff:handoff.id,activityIdentity:{kind:"command",id:"command-1"},
  reason:"command completed",at:now});
const root=await mkdtemp(path.join(os.tmpdir(),"swarmforge-role-liveness-"));
try {
  const file=path.join(root,"role-state.json");
  await appendRoleStateTransition(file,transition);
  await appendRoleStateTransition(file,{...transition,reason:"queue reconciled",
    at:"2026-09-03T05:30:01.000Z"});
  const stored=JSON.parse(await readFile(file,"utf8"));
  assert.equal(stored.transitions.length,2,"atomic writes retain complete ordered transitions");
} finally { await rm(root,{recursive:true,force:true}); }

assert.deepEqual(completedAuthorityFollowUp({status:"resume",binding:{activeHandoff:handoff.id,
  task:handoff.task}},"continue-review"),{action:"continue-review",reusedCompletion:true,
  activeHandoff:handoff.id,task:handoff.task,requestNewAuthority:false,createReceipt:false,
  createHandoff:false});

assert.deepEqual(roleTimingSummary([
  {...transition,priorState:"available",nextState:"working",at:"2026-09-03T05:00:00.000Z"},
  {...transition,priorState:"working",nextState:"waiting",reason:"review queue",
    at:"2026-09-03T05:01:00.000Z"},
  {...transition,priorState:"waiting",nextState:"available",reason:"expired active claim",
    at:"2026-09-03T05:03:00.000Z"},
],"2026-09-03T05:04:00.000Z"),{
  version:1,activeWorkMs:60000,queueWaitMs:120000,staleStateDelayMs:60000,
});

console.log("SwarmForge role liveness contracts passed.");
