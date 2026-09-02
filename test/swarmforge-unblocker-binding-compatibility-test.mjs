import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { unblockerContentDigest } from "../swarmforge/scripts/unblocker-authority.mjs";
import { bindingKey, renderHandoff } from "../swarmforge/scripts/unblocker-format.mjs";
import { matchingBindings } from "../swarmforge/scripts/unblocker-queue-storage.mjs";

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

try {
  const completed = path.join(root, "unblockers", "completed");
  const queued = path.join(root, "unblockers", "new");
  await mkdir(completed, {recursive:true});
  await mkdir(queued, {recursive:true});
  const unrelatedLegacy = {...headers, id:"legacy-unrelated", name:"legacy-route",
    task:"retired-task", "active-handoff":"retired-handoff",
    "defect-census":"retired", "repair-task":"retired"};
  await writeFile(path.join(completed, "legacy.handoff"), stored(unrelatedLegacy));
  await writeFile(path.join(queued, "current.handoff"), stored(headers));

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
