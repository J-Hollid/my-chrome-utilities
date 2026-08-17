import assert from "node:assert/strict";

import {createProjectAssetBodyStaging} from "../dist/durable-project/project-asset-body-staging.js";

const identity=(projectId,digest)=>({projectId,namespace:"documentation-template",digest});
const text=async body=>body.text();

const staging=createProjectAssetBodyStaging();
const original=new Blob(["first"],{type:"application/octet-stream"});
staging.stage(identity("project-a","first"),original);
const first=staging.attach("project-a");
assert.equal(first.bodies.length,1);
assert.notEqual(first.bodies[0].body,original,"staging owns a defensive Blob copy");
assert.equal(await text(first.bodies[0].body),"first");
assert.deepEqual(staging.attach("project-b").bodies,[],"attachments are project scoped");

staging.stage(identity("project-a","first"),new Blob(["replacement"]));
first.commit();
const replacement=staging.attach("project-a");
assert.equal(await text(replacement.bodies[0].body),"replacement","an older success cannot clear a newer staged generation");

const failed=staging.attach("project-a");
assert.equal(await text(staging.attach("project-a").bodies[0].body),"replacement","failure retains the exact staged generation until an explicit outcome");
failed.discard();
assert.deepEqual(staging.attach("project-a").bodies,[],"reviewed rejection discards the failed command bodies");

staging.stage(identity("project-a","second"),new Blob(["second"]));
const successful=staging.attach("project-a");
successful.commit();
assert.deepEqual(staging.attach("project-a").bodies,[],"success clears only its committed bodies");

staging.stage(identity("project-a","third"),new Blob(["third"]));
staging.discard(identity("project-a","third"));
assert.deepEqual(staging.attach("project-a").bodies,[],"caller discard removes the matching pending body");

console.log("project asset-body staging unit test passed");
