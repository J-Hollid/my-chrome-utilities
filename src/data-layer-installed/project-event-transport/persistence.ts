import {durableDraftCommand} from "../../data-layer-durable-project-repository.js";
import type {ProjectObservationSource} from "../../data-layer-project-observation-sources/model.js";
import {projectEventTransport, configureProjectEventTransport} from "../../data-layer-project-event-transport.js";
import {configureObservationSources, projectObservationSources} from "../../data-layer-project-observation-sources/settings.js";
import {commitCanonicalProjectState, restoreCanonicalProjectEnvelope} from "../../data-layer-specification-repository.js";
import type {ProjectState} from "../../data-layer-specification-project.js";
import type {DurableProjectRuntime} from "../../data-layer-durable-project-runtime.js";
import type {InstalledSourceSettingsPorts} from "./source-controller.js";

export function createInstalledTransportPersistence(ports: {
  currentProject(): ProjectState | undefined;
  storage: Pick<Storage,"getItem" | "setItem">;
  durable: Pick<DurableProjectRuntime,"settled" | "ensureProject" | "refreshProject" | "repository">;
  capture(state: ProjectState, revision: number): void;
}) {
  async function commit(next: ProjectState): Promise<void> {
    const base = ports.currentProject();
    const envelope = restoreCanonicalProjectEnvelope(ports.storage.getItem("my-chrome-utilities.specification-project.v1"));
    if (!base || !envelope || base.project.id !== next.project.id) throw new Error("Open project");
    const result = commitCanonicalProjectState(ports.storage,next,{
      expectedRevision:envelope.revision,pendingLabel:"Save project event transport settings",base,
    });
    if (result.status === "conflict") throw new Error("Project transport settings changed in a newer Draft.");
    ports.capture(next,result.revision);
    await ports.durable.settled();
  }
  async function saveSources(projectId: string, sources: readonly ProjectObservationSource[]): Promise<void> {
    await ports.durable.settled();
    if (ports.currentProject()?.project.id !== projectId) throw new Error("The active project changed");
    const loaded=await ports.durable.repository.loadProject(projectId);
    const next=configureObservationSources(loaded.state,sources);
    const result=await ports.durable.repository.saveDraft(durableDraftCommand(loaded,next,{
      commandId:"observation-sources:"+crypto.randomUUID(),label:"Save observation sources",
    }));
    if (result.status==="conflict") throw new Error("Observation sources changed in a newer Draft. Reload and retry.");
    const stored=await ports.durable.repository.loadProject(projectId);
    if (JSON.stringify(projectObservationSources(stored.state.project))!==JSON.stringify(projectObservationSources(next.project)))
      throw new Error("Saved observation sources could not be verified. Retry.");
    if (ports.currentProject()?.project.id===projectId) {
      await ports.durable.refreshProject(projectId);
    }
  }
  const sources: InstalledSourceSettingsPorts = {
    projectId:() => ports.currentProject()?.project.id,
    async load() {
      const projectId = ports.currentProject()?.project.id;
      if (!projectId) return undefined;
      await ports.durable.settled();
      await ports.durable.ensureProject(projectId);
      let loaded = await ports.durable.repository.loadProject(projectId);
      if (ports.currentProject()?.project.id !== projectId) return undefined;
      if (loaded.state.project.eventTransport?.observationSources === undefined) {
        await saveSources(projectId,projectObservationSources(loaded.state.project));
        loaded = await ports.durable.repository.loadProject(projectId);
        if (loaded.state.project.eventTransport?.observationSources === undefined) throw new Error("Observation source migration could not be verified");
      }
      return {projectId,sources:projectObservationSources(loaded.state.project)};
    },
    save:saveSources,
  };
  return {
    sources,
    loadPaths() {
      const project = ports.currentProject()?.project;
      const settings = project ? projectEventTransport(project) : undefined;
      return {observationPath:settings?.observationHistoryPath ?? "",pushPath:settings?.defaultPushPath ?? ""};
    },
    async savePaths(paths: {observationPath: string;pushPath: string}) {
      const state = ports.currentProject(); if (!state) throw new Error("Open project");
      await commit(configureProjectEventTransport(state,{
        observationHistoryPath:paths.observationPath, defaultPushPath:paths.pushPath,
      }));
    },
  };
}
