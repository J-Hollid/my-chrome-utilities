import { guidedPropertyDocument, mergeGuidedDocument } from "./data-layer-guided-nested-property-merge.js";
import { detectedValueType } from "./data-layer-guided-validation.js";
import { resolveNestedValues } from "./data-layer-schema-nested-path.js";
import type { GuidedValueType } from "./data-layer-guided-validation-types.js";
import type { SchemaDefinition } from "./data-layer-schema-verification.js";

export interface LiveSchemaPropertyDeclaration {
  concretePath: string;
  canonicalPath: string;
  detectedType: GuidedValueType;
  schemaId: string;
  schemaName: string;
  schemaVersion: number;
}

function segments(path: string): string[] {
  return path.split("/").filter(Boolean).map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"));
}

function observedValue(payload: unknown, path: string): unknown {
  const match = resolveNestedValues(payload, path).find(({ exists }) => exists);
  if (!match) throw new Error(`Observed property ${path} is unavailable`);
  return match.value;
}

export function canonicalLivePropertyPath(path: string): string {
  return `/${segments(path).map((segment) => /^\d+$/.test(segment) ? "*" : segment).join("/")}`;
}

export function createLiveSchemaPropertyDeclaration(
  payload: unknown,
  concretePath: string,
  schema: SchemaDefinition,
): LiveSchemaPropertyDeclaration {
  if (!schema.workingDraft) throw new Error(`${schema.name} has no working draft`);
  return {
    concretePath,
    canonicalPath:canonicalLivePropertyPath(concretePath),
    detectedType:detectedValueType(observedValue(payload, concretePath)),
    schemaId:schema.id,
    schemaName:schema.name,
    schemaVersion:schema.version,
  };
}

export function addLiveSchemaPropertyDeclaration(
  schema: SchemaDefinition,
  declaration: LiveSchemaPropertyDeclaration,
): SchemaDefinition {
  if (!schema.workingDraft || schema.id !== declaration.schemaId) throw new Error("Declaration destination is unavailable");
  const document = mergeGuidedDocument(
    schema.workingDraft.document,
    guidedPropertyDocument(declaration.canonicalPath, declaration.detectedType),
  );
  return {
    ...structuredClone(schema),
    workingDraft:{
      ...structuredClone(schema.workingDraft),
      document,
      pendingChanges:[...schema.workingDraft.pendingChanges, `Declare ${declaration.canonicalPath} as ${declaration.detectedType}`],
    },
  };
}
