import { exportJsonSchemaResource, JSON_SCHEMA_2020_12_DIALECT, jsonSchemaResourceId } from "../data-layer-json-schema-export.js";
import { canonicalExportDocument } from "./canonical-document.js";
import { assertSourceReferences } from "./source-errors.js";
import { savedCanonicalExportDocument } from "./saved-canonical-document.js";
export function contextExportIdentity(source) {
    const canonical = source.canonical ? structuredClone(source.canonical) : undefined;
    if (canonical) {
        delete canonical.selectedPropertyId;
        delete canonical.changes;
        canonical.view = "tree";
    }
    return JSON.stringify({ key: source.key, name: source.name, role: source.role, context: source.context, version: source.version, canonical, schema: source.schema, schemas: source.schemas, errors: source.errors });
}
export function createContextExportSnapshot(source) {
    if (source.unconfirmed)
        throw new Error("Confirm or cancel the property edits before export.");
    if (source.pending)
        throw new Error("Wait for the current save to finish.");
    if (source.errors?.length)
        throw new Error(source.errors.join("; "));
    assertSourceReferences(source);
    const identity = contextExportIdentity(source), frozen = structuredClone(source);
    const result = frozen.canonical ? (frozen.schema ? savedCanonicalExportDocument(frozen) : canonicalExportDocument(frozen.canonical)) : frozen.schema ? exportJsonSchemaResource(frozen.schema, frozen.schemas ?? [frozen.schema]) : undefined;
    if (!result)
        throw new Error("The selected schema is no longer available.");
    const document = { $schema: JSON_SCHEMA_2020_12_DIALECT, ...result.document, title: frozen.name };
    if (frozen.version === "Draft")
        delete document.$id;
    else
        document.$id = jsonSchemaResourceId({ id: frozen.schema?.id ?? frozen.canonical.contributorId, version: frozen.version });
    const version = frozen.version === "Draft" ? "Draft" : `revision ${frozen.version}`;
    const baseName = [frozen.context, frozen.name].filter(Boolean).join(" ").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 140) || "schema";
    const slug = `${baseName}-${version.toLowerCase().replaceAll(" ", "-")}`;
    const filename = frozen.version !== "Draft" && frozen.schema ? exportJsonSchemaResource(frozen.schema, frozen.schemas ?? [frozen.schema]).filename : `${slug}.schema.json`;
    return { identity, label: [frozen.name, frozen.role, frozen.context, version].filter(Boolean).join(" · "), document, text: `${JSON.stringify(document, null, 2)}\n`, filename, compatibility: result.compatibility };
}
//# sourceMappingURL=snapshot.js.map