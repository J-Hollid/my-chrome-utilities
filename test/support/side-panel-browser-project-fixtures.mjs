export const guidedTransportProjectSetupRuntime = `(async () => {
  const { createSpecificationProject } = await import("./data-layer-specification-project.js");
  const { configureProjectEventTransport } = await import("./data-layer-project-event-transport.js");
  const { openIndexedDbProjectRepository } = await import("./data-layer-durable-project-repository.js");
  const { serializeCanonicalProjectState } = await import("./data-layer-specification-repository.js");
  const { projectLibrary, serializeProjectLibrary } = await import("./data-layer-project-library.js");
  const repository = await openIndexedDbProjectRepository();
  const previousActiveProjectId = await repository.activeProjectId();
  const projectId = "project:guided-runtime:" + crypto.randomUUID();
  const draftToken = "guided-runtime:" + crypto.randomUUID();
  let sequence = 0;
  const id = (kind) => kind === "project" ? projectId : kind + ":guided-runtime:" + (++sequence);
  const state = configureProjectEventTransport(
    createSpecificationProject({ name:"Guided runtime", site:"shop.example", id }),
    { observationHistoryPath:"queue.history", defaultPushPath:"dataLayer" },
  );
  await repository.putProjectMetadataOnly(state, { active:true, draftToken, draftSequence:1 });
  const projectKey = "my-chrome-utilities.specification-project.v1";
  const libraryKey = "my-chrome-utilities.specification-project-library.v1";
  const previousProjectStorage = localStorage.getItem(projectKey);
  const previousLibraryStorage = localStorage.getItem(libraryKey);
  const timestamp = new Date().toISOString();
  localStorage.setItem(projectKey, serializeCanonicalProjectState(state, 1));
  localStorage.setItem(libraryKey, serializeProjectLibrary(projectLibrary([{
    state, revision:1, createdAt:timestamp, lastModifiedAt:timestamp,
  }], projectId)));
  return { previousActiveProjectId:previousActiveProjectId ?? null, fixtureProjectId:projectId,
    fixtureDraftToken:draftToken, previousProjectStorage, previousLibraryStorage };
})()`;

export const guidedTransportProjectRestoreRuntime = (fixtureContext) => `(async () => {
  const { openIndexedDbProjectRepository } = await import("./data-layer-durable-project-repository.js");
  const repository = await openIndexedDbProjectRepository();
  const fixtureContext = ${JSON.stringify(fixtureContext ?? null)};
  const previousActiveProjectId = fixtureContext?.previousActiveProjectId ?? null;
  if (previousActiveProjectId) await repository.setActiveProject(previousActiveProjectId);
  else await repository.clearActiveProject();
  const fixtureMetadata = (await repository.listProjectMetadata()).find(({ projectId }) => projectId === fixtureContext?.fixtureProjectId);
  if (fixtureMetadata) await repository.deleteProject({ projectId:fixtureMetadata.projectId, baseToken:fixtureMetadata.draftToken, label:"Delete guided runtime fixture" });
  const restore = (key, value) => value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value);
  restore("my-chrome-utilities.specification-project.v1", fixtureContext?.previousProjectStorage ?? null);
  restore("my-chrome-utilities.specification-project-library.v1", fixtureContext?.previousLibraryStorage ?? null);
  return true;
})()`;

export const projectFixturePrograms = Object.freeze({
  guidedTransportProjectSetupRuntime,
  guidedTransportProjectRestoreRuntime,
});
