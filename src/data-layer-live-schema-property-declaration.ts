import { guidedPropertyDocument, mergeGuidedDocument } from "./data-layer-guided-nested-property-merge.js";
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

function valueAt(payload: unknown, path: string): unknown {
  return segments(path).reduce<unknown>((value, segment) => {
    if (Array.isArray(value) && /^\d+$/.test(segment)) return value[Number(segment)];
    if (value && typeof value === "object") return (value as Record<string, unknown>)[segment];
    return undefined;
  }, payload);
}

function detectedType(value: unknown): GuidedValueType {
  if (Array.isArray(value)) return "Array";
  if (value !== null && typeof value === "object") return "Object";
  if (typeof value === "number") return "Number";
  if (typeof value === "boolean") return "Boolean";
  return "String";
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
    detectedType:detectedType(valueAt(payload, concretePath)),
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
