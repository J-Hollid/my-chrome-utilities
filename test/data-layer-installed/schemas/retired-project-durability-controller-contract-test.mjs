import assert from "node:assert/strict";


{
  const { createProjectHydrationSlot } = await import("../../../dist/data-layer-installed/schemas/project-hydration.js");
  const slot = createProjectHydrationSlot();
  let releaseFirst, releaseSecond;
  let reentered;
  const first = slot.run("project:first", () => {
    reentered = slot.run("project:first", () => Promise.reject(new Error("reentrant hydration started")));
    return new Promise((resolve) => { releaseFirst = resolve; });
  });
  // retired-schema-assertion: project-hydration-durable-recovery-001
  assert.equal(reentered, first, "synchronous project notifications reuse the active contributor hydration");
  // retired-schema-assertion: project-hydration-durable-recovery-002
  assert.equal(slot.run("project:first", () => Promise.reject(new Error("duplicate hydration started"))), first,
    "one project reuses its active contributor hydration");
  const second = slot.run("project:second", () => new Promise((resolve) => { releaseSecond = resolve; }));
  // retired-schema-assertion: project-hydration-durable-recovery-003
  assert.notEqual(second, first, "a new active project supersedes an older contributor hydration");
  releaseFirst(); await first;
  // retired-schema-assertion: project-hydration-durable-recovery-004
  assert.equal(slot.run("project:second", () => Promise.reject(new Error("superseding hydration was lost"))), second,
    "settlement from an older project cannot clear the newer hydration");
  releaseSecond(); await second;
}

{
  const { createDurableSchemaPersistenceCoordination, createInstalledSchemaContributorCoordination } = await import("../../../dist/data-layer-installed/runtime.js");
  const compatibilityProject = { project:{ id:"project:one", name:"Compatibility" }, profiles:[] };
  const durableProject = { project:{ id:"project:one", name:"Durable" }, profiles:[{ id:"profile:shipping" }] };
  let capturedProject;
  const contributors = createInstalledSchemaContributorCoordination({
    activeProjectId:()=>"project:one",
    compatibilityProject:()=>compatibilityProject,
    ensureProject:async()=>{},
    loadProject:async()=>({ state:durableProject, revision:7 }),
    captureProject:(state,revision)=>{ capturedProject=[state,revision]; },
  });
  // retired-schema-assertion: project-hydration-durable-recovery-005
  assert.equal(contributors.currentProject(), compatibilityProject,
    "the installed contributor projection retains its bounded compatibility fallback before durable hydration");
  // retired-schema-assertion: project-hydration-durable-recovery-006
  assert.deepEqual(await contributors.ensureProjectContributors("project:one"), { name:"Durable" });
  // retired-schema-assertion: project-hydration-durable-recovery-007
  assert.deepEqual(capturedProject, [durableProject,7],
    "durable contributor hydration refreshes the installed project-library projection");
  // retired-schema-assertion: project-hydration-durable-recovery-008
  assert.equal(contributors.currentProject(), durableProject,
    "relationship-tree reads use the freshly hydrated durable project instead of the stale compatibility snapshot");
  const refreshedProject = { ...durableProject, profiles:[...durableProject.profiles,{ id:"profile:checkout" }] };
  contributors.captureProject(refreshedProject);
  // retired-schema-assertion: project-hydration-durable-recovery-009
  assert.equal(contributors.currentProject(), refreshedProject,
    "durable subscription updates replace the active contributor projection");
  contributors.captureProject({ project:{ id:"project:other", name:"Other" }, profiles:[] });
  // retired-schema-assertion: project-hydration-durable-recovery-010
  assert.equal(contributors.currentProject(), refreshedProject,
    "a notification for another project cannot replace the active contributor projection");
  let savedListener = () => {};
  let recovery;
  let retried = 0;
  let rejected = 0;
  let downloaded = "";
  const target = new EventTarget();
  const pending = { batch:{ upserts:[{ schema:{ id:"schema:page", name:"Page" } }], deletes:[],
    label:"Save Page in the Saved Schema Library", names:["Page"] }, error:new Error("quota") };
  let failed = pending;
  const coordination = createDurableSchemaPersistenceCoordination({
    runtime:{
      repository:{ subscribeSavedSchemas:(listener) => { savedListener = listener; return () => { savedListener = () => {}; }; } },
      failedSchemaSave:() => failed,
      retryFailedSchemaSave:async () => { retried += 1; failed = undefined;
        savedListener({ schemaId:"schema:page", token:"next", deleted:false }); },
      resolveFailedSchemaSave:async () => { rejected += 1; },
      exportUnsavedSchemas:() => "serialized batch",
    },
    repositoryUi:{ reportSaveFailure:async (input) => { recovery = input; } },
    eventTarget:target,
    origin:() => undefined,
    download:(serialized) => { downloaded = serialized; },
  });
  const persistenceEvents = [];
  coordination.subscribe((event) => persistenceEvents.push(event.type));
  let releaseRetriedSettlement;
  const retriedSettlement = new Promise((resolve) => { releaseRetriedSettlement = resolve; });
  coordination.subscribe((event) => event.type === "retried" ? retriedSettlement : undefined);
  target.dispatchEvent(new CustomEvent("durable-project-save-failed", { detail:{ error:pending.error } }));
  await Promise.resolve();
  // retired-schema-assertion: project-hydration-durable-recovery-011
  assert.deepEqual(persistenceEvents, ["failed"], "a durable schema failure pauses the installed Schema transaction");
  // retired-schema-assertion: project-hydration-durable-recovery-012
  assert.equal(recovery.kind, "saved-schema"); recovery.exportUnsaved();
  // retired-schema-assertion: project-hydration-durable-recovery-013
  assert.equal(downloaded, "serialized batch"); let recoverySettled = false;
  const recoveryCompletion = recovery.retry().then(() => { recoverySettled = true; }); await Promise.resolve(); await Promise.resolve();
  // retired-schema-assertion: project-hydration-durable-recovery-014
  assert.equal(recoverySettled, false, "Retry feedback waits for the installed Schema owner to settle its queued latest projection");
  releaseRetriedSettlement(); await recoveryCompletion;
  // retired-schema-assertion: project-hydration-durable-recovery-015
  assert.equal(retried, 1);
  // retired-schema-assertion: project-hydration-durable-recovery-016
  assert.deepEqual(persistenceEvents, ["failed", "saved", "retried"],
    "Retry settles through both durable observation and explicit recovery acknowledgement");
  await recovery.reject();
  // retired-schema-assertion: project-hydration-durable-recovery-017
assert.equal(rejected, 1);
  // retired-schema-assertion: project-hydration-durable-recovery-018
assert.equal(persistenceEvents.at(-1), "rejected");
  coordination.dispose();
}
