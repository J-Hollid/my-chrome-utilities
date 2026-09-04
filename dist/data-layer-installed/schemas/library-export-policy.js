import { createExtensionSchemaPackage, createSchemaLibraryExport, exportJsonSchemaBundle, exportJsonSchemaResource, } from "../../utilities/data-layer/schemas.js";
export function omittedRuleStatus(count) {
    return `${count} omitted ${count === 1 ? "rule" : "rules"}`;
}
/** Creates one standards export without DOM, focus, or download access. */
export function createStandardSchemaExport(schemas, schema) {
    if (!schema) {
        const exported = exportJsonSchemaBundle(schemas);
        return {
            document: exported.document,
            filename: exported.filename,
            status: `Exported JSON Schema Draft 2020-12 bundle · ` +
                `${exported.resourceIds.length} schemas · ` +
                `${omittedRuleStatus(exported.compatibility.omitted.length)}.`,
        };
    }
    const exported = exportJsonSchemaResource(schema, schemas);
    return {
        document: exported.document,
        filename: exported.filename,
        status: `Exported JSON Schema Draft 2020-12 · ${schema.name} revision ` +
            `${schema.version} · ` +
            `${omittedRuleStatus(exported.compatibility.omitted.length)}.`,
    };
}
/** Creates one extension-native export without DOM, focus, or download access. */
export function createExtensionSchemaExport(schemas, rules, schema) {
    if (schema) {
        return {
            document: createExtensionSchemaPackage(schema, schemas, rules),
            filename: `${schema.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-extension-package-v1.json`,
            status: `Exported Extension schema package · ${schema.name} revision ${schema.version}.`,
        };
    }
    const archive = createSchemaLibraryExport(schemas, rules);
    return {
        document: archive,
        filename: "schema-library-v1.json",
        status: `Exported Extension backup · ${archive.schemas.length} schemas and ` +
            `${archive.rules.length} rules.`,
    };
}
//# sourceMappingURL=library-export-policy.js.map