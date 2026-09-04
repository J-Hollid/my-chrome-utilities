import { createExtensionSchemaPackage, createSchemaLibraryExport, exportJsonSchemaBundle, exportJsonSchemaResource, importSchema, inspectJsonSchemaExport, schemaInheritanceConflict, schemaInheritanceError, } from "../../utilities/data-layer/schemas.js";
/** Owns Schema Library import, deletion, export policy, and installed DOM dialogs. */
export class SchemaLibraryOperations {
    #library;
    #ports;
    #pendingImport;
    #pendingDeletion;
    #pendingStandardExport;
    #exportTrigger;
    constructor(library, ports) {
        this.#library = library;
        this.#ports = ports;
    }
    reset() {
        this.#pendingImport = undefined;
        this.#pendingDeletion = undefined;
        this.#pendingStandardExport = undefined;
        this.#exportTrigger = undefined;
    }
    openImportFile() { this.#ports.elements.importFile?.click(); }
    reviewImport(serialized) {
        const archive = JSON.parse(serialized);
        if (archive.version !== 1 || !Array.isArray(archive.schemas) || !Array.isArray(archive.rules)) {
            throw new Error("Choose a version 1 Schema Library export.");
        }
        const imported = archive.schemas.map((schema) => importSchema(JSON.stringify(schema)));
        const current = this.#library.schemas;
        const candidates = [...current.filter((schema) => !imported.some(({ id }) => id === schema.id)), ...imported];
        for (const schema of imported) {
            const issue = schemaInheritanceError(schema, candidates) ?? schemaInheritanceConflict(schema, candidates);
            if (issue)
                throw new Error(issue);
        }
        const rules = archive.rules.filter((rule) => Boolean(rule && typeof rule === "object" && "id" in rule && "name" in rule && "kind" in rule && "version" in rule && "enabled" in rule));
        this.#pendingImport = { schemas: imported, rules: structuredClone(rules) };
        if (this.#ports.elements.importSummary) {
            this.#ports.elements.importSummary.textContent = `${imported.length} schemas and ${rules.length} reusable rules are ready to import.`;
        }
        this.#ports.elements.importReview?.showModal();
    }
    async readImportFile() {
        const file = this.#ports.elements.importFile?.files?.[0];
        if (!file)
            return;
        try {
            this.reviewImport(await file.text());
        }
        catch (error) {
            if (this.#ports.elements.result) {
                this.#ports.elements.result.textContent = error instanceof Error ? error.message : "Schema Library import failed.";
            }
        }
        if (this.#ports.elements.importFile)
            this.#ports.elements.importFile.value = "";
    }
    replaceImport() {
        const pending = this.#pendingImport;
        if (!pending)
            return;
        this.#library.replaceSchemas(pending.schemas);
        this.#ports.replaceRules(structuredClone(pending.rules));
        this.#pendingImport = undefined;
        this.#persistImported("Schema Library replaced.");
    }
    appendImport() {
        const pending = this.#pendingImport;
        if (!pending)
            return;
        this.#library.replaceSchemas([
            ...this.#library.schemas.filter((schema) => !pending.schemas.some(({ id }) => id === schema.id)),
            ...structuredClone(pending.schemas),
        ]);
        this.#ports.replaceRules([
            ...this.#ports.rules().filter((rule) => !pending.rules.some(({ id }) => id === rule.id)),
            ...structuredClone(pending.rules),
        ]);
        this.#pendingImport = undefined;
        this.#persistImported("Schema Library appended.");
    }
    cancelImport() { this.#pendingImport = undefined; this.#ports.elements.importReview?.close(); }
    requestDeletion(id) {
        const schema = this.#library.schemas.find((candidate) => candidate.id === id);
        if (!schema)
            return false;
        const children = this.#library.schemas.filter(({ parentSchemaId }) => parentSchemaId === id);
        if (children.length) {
            if (this.#ports.elements.result) {
                this.#ports.elements.result.textContent = `Cannot delete ${schema.name}: it is the parent of ${children.map(({ name }) => name).join(", ")}.`;
            }
            return false;
        }
        this.#pendingDeletion = structuredClone(schema);
        if (this.#ports.elements.deleteSummary) {
            this.#ports.elements.deleteSummary.textContent = `${schema.name} v${schema.version} and its assignments will be removed.`;
        }
        this.#ports.elements.deleteReview?.showModal();
        return true;
    }
    confirmDeletion() {
        const schema = this.#pendingDeletion;
        if (!schema)
            return;
        this.#library.replaceSchemas(this.#library.schemas.filter(({ id }) => id !== schema.id));
        this.#pendingDeletion = undefined;
        if (this.#library.activeSchemaId === schema.id)
            this.#library.clearSelection();
        this.#library.persist();
        this.#ports.renderAll();
        this.#ports.elements.deleteReview?.close();
        if (this.#ports.elements.result)
            this.#ports.elements.result.textContent = `Deleted ${schema.name}.`;
    }
    cancelDeletion() { this.#pendingDeletion = undefined; this.#ports.elements.deleteReview?.close(); }
    openStandardExport(scope, schema) {
        const schemas = this.#library.schemas;
        const review = schema ? inspectJsonSchemaExport(schema, schemas) : exportJsonSchemaBundle(schemas).compatibility;
        this.#pendingStandardExport = { scope, ...(schema ? { schema } : {}), review };
        const dialog = this.#ports.elements.exportReview;
        const document = dialog?.ownerDocument;
        if (!dialog || !document)
            return;
        const heading = document.createElement("h4");
        const summary = document.createElement("p");
        const conversions = document.createElement("ul");
        const omitted = document.createElement("ul");
        heading.textContent = "JSON Schema Draft 2020-12 compatibility review";
        summary.textContent = scope === "library"
            ? `3rd-party validation format · ${schemas.filter((item) => item.published !== false && item.version > 0).length} schema resources`
            : `${schema?.name} · current published revision ${schema?.version}`;
        conversions.setAttribute("aria-label", "Standard export conversions");
        conversions.append(...review.conversions.map(({ ruleId, propertyPath, conversion }) => Object.assign(document.createElement("li"), { textContent: `${ruleId} at ${propertyPath}: ${conversion}` })));
        if (!review.conversions.length)
            conversions.append(Object.assign(document.createElement("li"), { textContent: "No severity or issue-message conversions" }));
        omitted.setAttribute("aria-label", "Unsupported rules omitted from standard export");
        omitted.append(...review.omitted.map(({ ruleName, propertyPath, behavior }) => Object.assign(document.createElement("li"), { textContent: `${ruleName} at ${propertyPath}: unsupported ${behavior}; omitted` })));
        if (!review.omitted.length)
            omitted.append(Object.assign(document.createElement("li"), { textContent: "No unsupported rules" }));
        const confirm = document.createElement("button");
        const cancel = document.createElement("button");
        confirm.type = cancel.type = "button";
        confirm.textContent = review.omitted.length ? "Export without unsupported rules" : "Export JSON Schema Draft 2020-12";
        cancel.textContent = "Cancel";
        confirm.addEventListener("click", () => this.#confirmStandardExport());
        cancel.addEventListener("click", () => {
            this.#pendingStandardExport = undefined;
            dialog.close();
            this.#exportTrigger?.focus({ preventScroll: true });
        });
        dialog.replaceChildren(heading, summary, conversions, omitted, confirm, cancel);
        dialog.showModal();
        confirm.focus({ preventScroll: true });
    }
    openExportChoices(trigger, schema) {
        const dialog = this.#ports.elements.exportChoices;
        const document = dialog?.ownerDocument;
        this.#exportTrigger = trigger;
        if (!dialog || !document)
            return;
        const heading = document.createElement("h4");
        const extension = document.createElement("button");
        const extensionDescription = document.createElement("p");
        const standard = document.createElement("button");
        const standardDescription = document.createElement("p");
        const cancel = document.createElement("button");
        heading.textContent = schema ? `Export ${schema.name}` : "Export Schema Library";
        extension.type = standard.type = cancel.type = "button";
        extension.textContent = schema ? "Extension schema package" : "Extension backup";
        extensionDescription.textContent = schema ? "For restoring this schema and its extension dependencies." : "For complete extension backup and restore.";
        standard.textContent = schema ? "JSON Schema Draft 2020-12" : "JSON Schema Draft 2020-12 bundle";
        standardDescription.textContent = "For third-party standards-based validation; not extension configuration.";
        if (schema?.published === false || schema?.version === 0) {
            standard.disabled = true;
            standard.title = "Publish the schema before exporting a standard revision";
            standardDescription.textContent = standard.title;
        }
        cancel.textContent = "Cancel";
        extension.addEventListener("click", () => this.#exportExtension(schema));
        standard.addEventListener("click", () => { dialog.close(); this.openStandardExport(schema ? "schema" : "library", schema); });
        cancel.addEventListener("click", () => { dialog.close(); this.#exportTrigger?.focus({ preventScroll: true }); this.#exportTrigger = undefined; });
        dialog.replaceChildren(heading, extension, extensionDescription, standard, standardDescription, cancel);
        dialog.showModal();
        extension.focus({ preventScroll: true });
    }
    requestExport() { const button = this.#ports.elements.exportButton; if (button)
        this.openExportChoices(button); }
    omittedStatus(count) { return `${count} omitted ${count === 1 ? "rule" : "rules"}`; }
    #persistImported(status) {
        this.#library.persist();
        this.#ports.persistRules();
        this.#ports.renderAll();
        this.#ports.renderRules();
        this.#ports.elements.importReview?.close();
        if (this.#ports.elements.result)
            this.#ports.elements.result.textContent = status;
    }
    #finishExport(status) {
        if (this.#ports.elements.result)
            this.#ports.elements.result.textContent = status;
        this.#ports.elements.exportReview?.close();
        this.#ports.elements.exportChoices?.close();
        this.#pendingStandardExport = undefined;
        this.#exportTrigger?.focus({ preventScroll: true });
        this.#exportTrigger = undefined;
    }
    #confirmStandardExport() {
        const pending = this.#pendingStandardExport;
        if (!pending)
            return;
        if (pending.scope === "library") {
            const exported = exportJsonSchemaBundle(this.#library.schemas);
            this.#ports.download(exported.document, exported.filename);
            this.#finishExport(`Exported JSON Schema Draft 2020-12 bundle · ${exported.resourceIds.length} schemas · ${this.omittedStatus(exported.compatibility.omitted.length)}.`);
        }
        else if (pending.schema) {
            const exported = exportJsonSchemaResource(pending.schema, this.#library.schemas);
            this.#ports.download(exported.document, exported.filename);
            this.#finishExport(`Exported JSON Schema Draft 2020-12 · ${pending.schema.name} revision ${pending.schema.version} · ${this.omittedStatus(exported.compatibility.omitted.length)}.`);
        }
    }
    #exportExtension(schema) {
        if (schema) {
            const archive = createExtensionSchemaPackage(schema, this.#library.schemas, this.#ports.rules());
            this.#ports.download(archive, `${schema.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-extension-package-v1.json`);
            this.#finishExport(`Exported Extension schema package · ${schema.name} revision ${schema.version}.`);
            return;
        }
        const archive = createSchemaLibraryExport(this.#library.schemas, this.#ports.rules());
        this.#ports.download(archive, "schema-library-v1.json");
        this.#finishExport(`Exported Extension backup · ${archive.schemas.length} schemas and ${archive.rules.length} rules.`);
    }
}
//# sourceMappingURL=library-operations.js.map