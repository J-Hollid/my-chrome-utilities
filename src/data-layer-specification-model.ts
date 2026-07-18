import type {
  ProjectEntity,
  ProjectState,
  SpecificationProject,
} from "./data-layer-specification-project.js";

export interface CanonicalProjectEnvelope {
  format: "my-chrome-utilities.canonical-specification-project";
  version: 2;
  revision: number;
  draftId: string;
  project: SpecificationProject;
  entityRevisions: Record<string, number>;
}

export type CanonicalCommand = {
  baseRevision: number;
  entityId: string;
  entityRevision: number;
  kind: "rename";
  name: string;
};

export type CanonicalCommandResult =
  | { status: "applied"; envelope: CanonicalProjectEnvelope }
  | {
      status: "conflict";
      envelope: CanonicalProjectEnvelope;
      pending: CanonicalCommand;
      changedFields: string[];
    };

const clone = <T>(value: T): T => structuredClone(value);

function allEntities(project: SpecificationProject): ProjectEntity[] {
  return (Object.values(project.collections) as ProjectEntity[][]).flat();
}

export function createCanonicalProjectEnvelope(
  project: SpecificationProject,
  draftId: string,
): CanonicalProjectEnvelope {
  return {
    format: "my-chrome-utilities.canonical-specification-project",
    version: 2,
    revision: 1,
    draftId,
    project: clone(project),
    entityRevisions: Object.fromEntries(
      allEntities(project).map(({ id }) => [id, 1]),
    ),
  };
}

export function applyCanonicalCommand(
  envelope: CanonicalProjectEnvelope,
  command: CanonicalCommand,
): CanonicalCommandResult {
  const currentEntityRevision = envelope.entityRevisions[command.entityId] ?? 0;
  if (
    command.baseRevision !== envelope.revision
    || command.entityRevision !== currentEntityRevision
  ) {
    return {
      status: "conflict",
      envelope,
      pending: clone(command),
      changedFields: ["name"],
    };
  }

  let found = false;
  const collections = Object.fromEntries(
    Object.entries(envelope.project.collections).map(([kind, entities]) => [
      kind,
      (entities as ProjectEntity[]).map((entity) => {
        if (entity.id !== command.entityId) return entity;
        found = true;
        return { ...entity, name: command.name };
      }),
    ]),
  ) as unknown as SpecificationProject["collections"];

  if (!found) {
    return {
      status: "conflict",
      envelope,
      pending: clone(command),
      changedFields: ["entityId"],
    };
  }

  return {
    status: "applied",
    envelope: {
      ...envelope,
      revision: envelope.revision + 1,
      project: { ...envelope.project, collections },
      entityRevisions: {
        ...envelope.entityRevisions,
        [command.entityId]: currentEntityRevision + 1,
      },
    },
  };
}

export function migrateCanonicalProject(input: {
  projectEnvelope: CanonicalProjectEnvelope;
  schemaLibrary: ProjectEntity[];
}): {
  status: "ready" | "review-required";
  sourceProject: SpecificationProject;
  sourceLibrary: ProjectEntity[];
  conflicts: {
    schemaId: string;
    projectRevision: number;
    libraryRevision: number;
  }[];
} {
  const projectSchemas = input.projectEnvelope.project.collections.schemaDrafts;
  const byId = new Map(input.schemaLibrary.map((schema) => [schema.id, schema]));
  const conflicts = projectSchemas.flatMap((schema) => {
    const library = byId.get(schema.id);
    return library && JSON.stringify(library) !== JSON.stringify(schema)
      ? [{
          schemaId: schema.id,
          projectRevision: Number(schema.version ?? 0),
          libraryRevision: Number(library.version ?? 0),
        }]
      : [];
  });
  return {
    status: conflicts.length ? "review-required" : "ready",
    sourceProject: clone(input.projectEnvelope.project),
    sourceLibrary: clone(input.schemaLibrary),
    conflicts,
  };
}

export function applyCanonicalSchemaDraftEdits(
  state: ProjectState,
  editedSchemas: readonly { id: string }[],
): ProjectState {
  const byId = new Map(editedSchemas.map((schema) => [schema.id, schema]));
  const schemaDrafts = state.project.collections.schemaDrafts.map((schema) => (
    byId.has(schema.id)
      ? clone(byId.get(schema.id)!) as unknown as ProjectEntity
      : schema
  ));
  return {
    ...state,
    project: {
      ...state.project,
      collections: { ...state.project.collections, schemaDrafts },
    },
    ...(state.draft
      ? { draft: { ...state.draft, status: "Saved" as const, updatedAt: new Date().toISOString() } }
      : {}),
  };
}
