import {
  applyCanonicalCommand,
  canonicalPropertyPath,
  savedSchemaCanonicalDocument,
  setPropertyDocumentation,
  updateSchemaWorkingDraft,
  type SchemaDefinition,
} from "../../utilities/data-layer/schemas.js";
import type { SchemaCanonicalEditorController } from "./canonical-editor-controller.js";

export function removeCanonicalDocumentation(
  controller: SchemaCanonicalEditorController,
  schema: SchemaDefinition,
  path: string,
): SchemaDefinition {
  const draft = schema.workingDraft!;
  const documentation = setPropertyDocumentation(
    draft.documentation ?? {},
    path,
    { displayName: "", description: "" },
  );
  const isOpen = controller.currentSavedSchemaId() === schema.id;
  const base = isOpen ? controller.savedDocument : draft.canonicalSchema;
  const node = base && Object.values(base.nodes).find(
    (candidate) => canonicalPropertyPath(base, candidate.id) === path,
  );
  const result = base && node ? applyCanonicalCommand(base, {
    kind: "set",
    baseRevision: base.revision,
    propertyId: node.id,
    patch: {
      documentation: {
        displayText: "",
        description: "",
        comments: "",
        example: { method: "blank" },
      },
    },
  }) : undefined;
  const canonical = result?.status === "applied" || result?.status === "rebased"
    ? result.document
    : undefined;
  if (canonical && isOpen) controller.setSavedDocument(canonical);
  return updateSchemaWorkingDraft(
    schema,
    { documentation, ...(canonical ? { canonicalSchema: canonical } : {}) },
    `Remove property documentation ${path}`,
  );
}

export function addManualCanonical(
  controller: SchemaCanonicalEditorController,
  schema: SchemaDefinition,
  document: SchemaDefinition["document"],
  path: string,
) {
  const previous = schema.workingDraft?.canonicalSchema;
  if (!previous) return;
  const draft = schema.workingDraft!;
  const projected = {
    ...schema,
    document,
    name: draft.name ?? schema.name,
    assignments: draft.assignments,
    ...(draft.attachedRules ? { attachedRules: draft.attachedRules } : {}),
    ...(draft.documentation ? { documentation: draft.documentation } : {}),
  };
  const canonical = savedSchemaCanonicalDocument(
    projected,
    (kind) => controller.createCanonicalId(kind),
    {
      id: previous.id,
      contributorId: previous.contributorId,
      contributorName: previous.contributorName,
    },
  );
  canonical.revision = previous.revision + 1;
  const selected = Object.values(canonical.nodes).find(
    (node) => canonicalPropertyPath(canonical, node.id) === path,
  )?.id;
  if (selected) canonical.selectedPropertyId = selected;
  return canonical;
}
