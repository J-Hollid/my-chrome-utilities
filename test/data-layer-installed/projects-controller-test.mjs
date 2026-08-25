import assert from "node:assert/strict";
import { verifyPreparedInstalledController } from "../support/data-layer-installed-controller-contract.mjs";
await verifyPreparedInstalledController("projects");
const { createProjectsInstalledController } = await import("../../dist/data-layer-installed/projects/index.js");
let subscribed = 0, disposed = 0;
const adoptions = [];
const projectState = { project:{ id:"project:1", name:"One", description:"", site:"https://example.test", environments:["Production"],
  namingConventions:{ property:"snake_case", event:"snake_case" }, publicationPolicy:{ warningsBlock:false, fixturesRequired:true },
  collections:{ profiles:[{ id:"profile:one", name:"Profile One", requirements:[{ path:"legacy" }], structuredSchema:{ legacy:true } }], propertySets:[], pages:[], events:[], applicabilitySets:[], flows:[], fixtures:[], assignments:[] }, releases:[] },
  draft:{ id:"draft:one", status:"Saved", updatedAt:"2026-08-25T00:00:00.000Z" }, history:{ undo:[], redo:[] } };
const projectValues = new Map([["my-chrome-utilities.specification-project.v1", JSON.stringify(projectState)]]), settledLabels = [], captures = [];
const controller = createProjectsInstalledController({ loadProjects:() => [{id:"project:1",name:"One"},{id:"project:2",name:"Two"}],
  activeProjectId:() => "project:1", subscribe:() => { subscribed += 1; return () => { disposed += 1; }; },
  openProject:async()=>{}, navigateToProjectArea() {}, adoptSavedSchema:async(projectId, schema) => { adoptions.push([projectId, schema]); },
  projectStorage:{ getItem:(key) => projectValues.get(key) ?? null, setItem:(key, value) => projectValues.set(key, value) },
  settleProjectCommand:async(projectId, label) => { settledLabels.push([projectId, label]); }, captureProject:(state, revision) => captures.push([state, revision]) });
controller.mount(); controller.mount(); assert.equal(subscribed, 1);
controller.dispose(); controller.dispose(); assert.equal(disposed, 1);
assert.equal(controller.state().activeProjectId, "project:1");
assert.equal(controller.state().mounted, false);
controller.mount(); assert.equal(controller.reviewSavedSchemaAdoption({ id:"schema:one" }), true);
assert.equal(controller.selectAdoptionProject("project:2"), true); assert.equal(await controller.confirmSavedSchemaAdoption(), true);
assert.deepEqual(adoptions, [["project:2", { id:"schema:one" }]], "reviewed adoption commits once through the Projects port");
controller.reviewSavedSchemaAdoption({ id:"schema:cancel" }); controller.cancelSavedSchemaAdoption();
assert.equal(controller.state().adoptionPending, false, "cancel leaves project state untouched");
controller.reviewSavedSchemaAdoption({ id:"schema:stale" }); controller.dispose();
assert.equal(await controller.confirmSavedSchemaAdoption(), false, "disposal invalidates stale adoption confirmation");
const canonical = { id:"canonical:profile", revision:1, state:"Draft", contributorId:"profile:one", contributorName:"Profile One", rootIds:[], nodes:{}, view:"tree" };
const selection = { entity:projectState.project.collections.profiles[0], scope:"Profile", collectionKind:"profiles" };
const canonicalState = controller.writeUnifiedContributorCanonical(projectState, selection, canonical);
assert.equal(canonicalState.project.collections.profiles[0].canonicalSchema.id, canonical.id);
assert.deepEqual(canonicalState.project.collections.profiles[0].requirements, [], "canonical ownership removes the legacy Profile requirement projection");
const transplanted = controller.transplantUnifiedContributorEntity(canonicalState, selection, { ...selection.entity, name:"Restored Profile" }, "Restore profile");
assert.equal(transplanted.project.collections.profiles[0].name, "Restored Profile");
const committed = controller.commitUnifiedContributorState(canonicalState, "Save canonical profile");
await controller.settleUnifiedContributorRevision(projectState.project.id, committed.revision);
assert.deepEqual(settledLabels.at(-1), [projectState.project.id, "Save canonical profile"], "settlement uses the exact revision-to-command identity");
assert.equal(captures.at(-1)[1], committed.revision, "committed canonical state projects its durable revision once");
await assert.rejects(() => controller.settleUnifiedContributorRevision(projectState.project.id, 999), /no durable acknowledgement identity/);
