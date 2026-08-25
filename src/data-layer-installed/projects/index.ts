import {
  commitCanonicalProjectState,
  restoreCanonicalProjectEnvelope,
  restoreCanonicalProjectState,
  transactProject,
  type CanonicalSchemaDocument,
  type ProjectEntity,
  type ProjectState,
  type SidePanelContributorSelection,
} from "../../utilities/data-layer/schemas.js";

export interface ProjectsInstalledPorts {
  activeProjectId(): string | undefined;
  loadProjects(): readonly Readonly<{ id: string; name: string }>[];
  subscribe(listener: () => void): () => void;
  openProject(id: string): Promise<void>;
  navigateToProjectArea(area: string): void;
  adoptSavedSchema(projectId:string, schema:unknown):Promise<void>;
  projectStorage:Pick<Storage, "getItem" | "setItem">;
  settleProjectCommand(projectId:string, label:string):Promise<void>;
  captureProject(state:ProjectState, revision:number):void;
}

export function createProjectsInstalledController(ports: ProjectsInstalledPorts) {
  let mounted = false;
  let unsubscribe: (() => void) | undefined;
  let projects = ports.loadProjects().map((project) => ({ ...project }));
  let activeProjectId = ports.activeProjectId();
  let openingProjectId: string | undefined;
  let generation = 0;
  let pendingSchemaAdoption:{ schema:unknown; projectId:string; generation:number } | undefined;
  const unifiedContributorCommandLabels = new Map<number,string>();
  const refresh = (): void => {
    if (!mounted) return;
    projects = ports.loadProjects().map((project) => ({ ...project })); activeProjectId = ports.activeProjectId();
  };
  const projectLibraryUi = {
    render:refresh,
    library:() => ({ activeProjectId, projects:structuredClone(projects) }),
    activate:async (projectId: string) => { await ports.openProject(projectId); activeProjectId = projectId; },
  };
  function activeTransportProject(): Readonly<{ id:string; name:string }> | undefined {
    return projects.find(({ id }) => id === projectLibraryUi.library().activeProjectId);
  }
  function reviewSavedSchemaAdoption(schema:unknown, projectId=activeProjectId ?? projects[0]?.id):boolean {
    if (!projectId || !projects.some(({ id }) => id === projectId)) return false;
    pendingSchemaAdoption = { schema:structuredClone(schema), projectId, generation }; return true;
  }
  function selectAdoptionProject(projectId:string):boolean {
    if (!pendingSchemaAdoption || !projects.some(({ id }) => id === projectId)) return false;
    pendingSchemaAdoption = { ...pendingSchemaAdoption, projectId }; return true;
  }
  async function confirmSavedSchemaAdoption():Promise<boolean> {
    const pending = pendingSchemaAdoption; if (!pending || pending.generation !== generation) return false;
    await ports.adoptSavedSchema(pending.projectId, structuredClone(pending.schema));
    if (pendingSchemaAdoption === pending && pending.generation === generation) pendingSchemaAdoption = undefined; return true;
  }
  function cancelSavedSchemaAdoption():void { pendingSchemaAdoption = undefined; }
  function writeUnifiedContributorCanonical(state:ProjectState, selection:SidePanelContributorSelection,
    canonical:CanonicalSchemaDocument):ProjectState {
    const replace = (candidate:ProjectEntity):ProjectEntity => { if (candidate.id !== selection.entity.id) return candidate;
      const next:ProjectEntity = { ...candidate, canonicalSchema:canonical, compiledTargetsStale:true };
      if (selection.collectionKind === "profiles") next.requirements = []; else delete next.requirements;
      delete next.structuredSchema; delete next.structuredDraft; delete next.schemaConstraints; return next; };
    return transactProject(state, `Save canonical schema for ${selection.entity.name}`, (project) => {
      if (selection.collectionKind) { const collection = project.collections[selection.collectionKind] as ProjectEntity[];
        return { ...project, collections:{ ...project.collections, [selection.collectionKind]:collection.map(replace) } } as typeof project; }
      const graphs = project.documentationFlowGraphs as Record<string,{ pageFrames?:ProjectEntity[]; occurrences?:ProjectEntity[] }>, graph = graphs[selection.flowId!]!,
        field = selection.scope === "Flow Page-instance" ? "pageFrames" : "occurrences", entries = graph[field] ?? [];
      return { ...project, documentationFlowGraphs:{ ...graphs, [selection.flowId!]:{ ...graph, [field]:entries.map(replace) } } };
    });
  }
  function transplantUnifiedContributorEntity(state:ProjectState, selection:SidePanelContributorSelection, entity:ProjectEntity, label:string):ProjectState {
    return transactProject(state, label, (project) => { if (selection.collectionKind) { const collection = project.collections[selection.collectionKind] as ProjectEntity[];
      return { ...project, collections:{ ...project.collections, [selection.collectionKind]:collection.map((candidate) => candidate.id === selection.entity.id ? structuredClone(entity) : candidate) } } as typeof project; }
      const graphs = project.documentationFlowGraphs as Record<string,{ pageFrames?:ProjectEntity[]; occurrences?:ProjectEntity[] }>, graph = graphs[selection.flowId!]!,
        field = selection.scope === "Flow Page-instance" ? "pageFrames" : "occurrences", entries = graph[field] ?? [];
      return { ...project, documentationFlowGraphs:{ ...graphs, [selection.flowId!]:{ ...graph, [field]:entries.map((candidate) => candidate.id === selection.entity.id ? structuredClone(entity) : candidate) } } };
    });
  }
  async function settleUnifiedContributorRevision(projectId:string, revision:number):Promise<void> {
    const label = unifiedContributorCommandLabels.get(revision); if (!label) throw new Error(`Saved Draft command ${revision} has no durable acknowledgement identity.`);
    await ports.settleProjectCommand(projectId, label);
  }
  function commitUnifiedContributorState(next:ProjectState, label:string) {
    const key = "my-chrome-utilities.specification-project.v1", serialized = ports.projectStorage.getItem(key), envelope = restoreCanonicalProjectEnvelope(serialized), base = restoreCanonicalProjectState(serialized);
    if (!envelope || !base) throw new Error("The Specification Project is unavailable.");
    const result = commitCanonicalProjectState(ports.projectStorage, next, { expectedRevision:envelope.revision, pendingLabel:label, base });
    if (result.status === "conflict") throw new Error("Schema contributor changed in a newer Saved Draft; review the canonical command again.");
    unifiedContributorCommandLabels.set(result.revision, label); ports.captureProject(next, result.revision); return result;
  }
  return {
    mount(): void { if (!mounted) { mounted = true; generation += 1; unsubscribe = ports.subscribe(refresh); refresh(); } },
    dispose(): void { if (mounted) { mounted = false; generation += 1; openingProjectId = undefined; pendingSchemaAdoption = undefined; unsubscribe?.(); unsubscribe = undefined; } },
    async open(id: string): Promise<void> {
      if (!projects.some((project) => project.id === id)) throw new Error(`Unknown project ${id}`);
      const operation = generation; openingProjectId = id;
      try { await projectLibraryUi.activate(id); if (mounted && operation === generation) activeProjectId = id; }
      finally { if (operation === generation) openingProjectId = undefined; }
    },
    navigate:ports.navigateToProjectArea,
    reviewSavedSchemaAdoption, selectAdoptionProject, confirmSavedSchemaAdoption, cancelSavedSchemaAdoption,
    writeUnifiedContributorCanonical, transplantUnifiedContributorEntity, settleUnifiedContributorRevision, commitUnifiedContributorState,
    activeTransportProject,
    state:() => ({ ...(activeProjectId ? { activeProjectId } : {}), ...(openingProjectId ? { openingProjectId } : {}),
      projectCount:projects.length, mounted, adoptionPending:Boolean(pendingSchemaAdoption), adoptionProjectId:pendingSchemaAdoption?.projectId }),
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"projects",
  capabilities:["Project Library", "active project", "navigation", "coordination"],
});
