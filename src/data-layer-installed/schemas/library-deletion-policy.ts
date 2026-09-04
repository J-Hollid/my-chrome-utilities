import type { SchemaDefinition } from "../../utilities/data-layer/schemas.js";
export interface SchemaDeletionResult {
    schemas: SchemaDefinition[];
    clearSelection: boolean;
    status: string;
}
/** Computes one reviewed deletion without storage, DOM, or controller access. */
export function applySchemaDeletion(schemas: readonly SchemaDefinition[], activeSchemaId: string | undefined,
     reviewed: SchemaDefinition): SchemaDeletionResult {
    return {
        schemas: schemas.filter(({ id }) => id !== reviewed.id),
        clearSelection: activeSchemaId === reviewed.id,
        status: `Deleted ${reviewed.name}.`,
    };
}
