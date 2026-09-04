import { importSchema, schemaInheritanceConflict, schemaInheritanceError, type SchemaDefinition, } from "../../utilities/data-layer/schemas.js";
import type { ReusableSchemaRule } from "./contracts.js";
export interface SchemaLibraryImportSet {
    schemas: SchemaDefinition[];
    rules: ReusableSchemaRule[];
}
/** Parses and validates one portable archive without UI or controller access. */
export function inspectSchemaLibraryImport(serialized: string, current: readonly SchemaDefinition[]): SchemaLibraryImportSet {
    const archive = JSON.parse(serialized) as {
        version?: number;
        schemas?: unknown;
        rules?: unknown;
    };
    if (archive.version !== 1 ||
        !Array.isArray(archive.schemas) ||
        !Array.isArray(archive.rules)) {
        throw new Error("Choose a version 1 Schema Library export.");
    }
    const schemas = archive.schemas.map((item) => importSchema(JSON.stringify(item)));
    const candidates = [
        ...current.filter((schema) => !schemas.some(({ id }) => id === schema.id)),
        ...schemas,
    ];
    for (const schema of schemas) {
        const issue = schemaInheritanceError(schema, candidates) ??
            schemaInheritanceConflict(schema, candidates);
        if (issue)
            throw new Error(issue);
    }
    const rules = archive.rules.filter((rule): rule is ReusableSchemaRule => Boolean(rule &&
        typeof rule === "object" &&
        "id" in rule &&
        "name" in rule &&
        "kind" in rule &&
        "version" in rule &&
        "enabled" in rule));
    return { schemas, rules: structuredClone(rules) };
}
/** Computes the replacement projection without storage, DOM, or controller access. */
export function replaceSchemaLibraryImport(imported: SchemaLibraryImportSet): SchemaLibraryImportSet {
    return structuredClone(imported);
}
/** Computes an ID-based append projection without storage, DOM, or controller access. */
export function appendSchemaLibraryImport(currentSchemas: readonly SchemaDefinition[], currentRules: readonly ReusableSchemaRule[],
     imported: SchemaLibraryImportSet): SchemaLibraryImportSet {
    return {
        schemas: [
            ...currentSchemas.filter((schema) => !imported.schemas.some(({ id }) => id === schema.id)),
            ...structuredClone(imported.schemas),
        ],
        rules: [
            ...currentRules.filter((rule) => !imported.rules.some(({ id }) => id === rule.id)),
            ...structuredClone(imported.rules),
        ],
    };
}
