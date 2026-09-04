import { SCHEMA_LIBRARY_STORAGE_KEY, createExtensionSchemaPackage, createSchemaLibraryExport, exportJsonSchemaBundle, exportJsonSchemaResource, importSchema, inspectJsonSchemaExport, schemaInheritanceConflict, schemaInheritanceError, restoreSchemaLibrary, serializeSchemaLibrary, } from "../../utilities/data-layer/schemas.js";
export class SchemaLibraryController {
    #ports;
    #initialProjection;
    #schemas;
    #activeSchemaId;
    #draft;
    #behavior;
    pendingImport;
    pendingDeletion;
    pendingStandardExport;
    exportTrigger;
    constructor(ports) {
        this.#ports = ports;
        const stored = ports.storage.getItem(SCHEMA_LIBRARY_STORAGE_KEY);
        this.#schemas = restoreSchemaLibrary(stored);
        try {
            const parsed = JSON.parse(stored ?? "[]");
            this.#initialProjection = Array.isArray(parsed) ? parsed : [];
        }
        catch {
            this.#initialProjection = [];
        }
    }
    configure(behavior) { this.#behavior = behavior; }
    get schemas() { return structuredClone(this.#schemas); }
    get activeSchemaId() { return this.#activeSchemaId; }
    get draft() { return this.#draft ? structuredClone(this.#draft) : undefined; }
    replaceSchemas(next) { this.#schemas = structuredClone([...next]); }
    select(id, draft) { this.#activeSchemaId = id; this.#draft = structuredClone(draft ?? this.#schemas.find((schema) => schema.id === id)); }
    setDraft(next) { this.#draft = next ? structuredClone(next) : undefined; }
    clearSelection() { this.#activeSchemaId = undefined; this.#draft = undefined; }
    append(schema) { this.#schemas = [...this.#schemas, structuredClone(schema)]; this.select(schema.id, schema); }
    activeIndex() { return this.#schemas.findIndex(({ id }) => id === this.#activeSchemaId); }
    active() {
        const schema = this.#schemas[this.activeIndex()] ?? this.#draft;
        if (!schema)
            throw new Error("Open a schema before editing its draft");
        return schema;
    }
    replaceActive(schema) {
        const index = this.activeIndex();
        if (index < 0) {
            if (!this.#draft)
                throw new Error("Open a schema before editing its draft");
            this.#draft = structuredClone(schema);
            return;
        }
        this.#schemas = this.#schemas.map((candidate, candidateIndex) => candidateIndex === index ? schema : candidate);
        this.#draft = structuredClone(schema);
    }
    reload() { this.#schemas = restoreSchemaLibrary(this.#ports.storage.getItem(SCHEMA_LIBRARY_STORAGE_KEY)); }
    serialize(next = this.#schemas) {
        const storedById = new Map(this.#initialProjection.map((schema) => [schema.id, schema]));
        const entries = next.map((schema) => {
            const canonical = JSON.parse(serializeSchemaLibrary([schema]))[0];
            const stored = storedById.get(schema.id);
            return { canonical, changed: !stored || serializeSchemaLibrary([stored]) !== JSON.stringify([canonical]) };
        });
        return JSON.stringify([...entries.filter(({ changed }) => changed), ...entries.filter(({ changed }) => !changed)]
            .map(({ canonical }) => canonical));
    }
    persist() {
        this.#ports.storage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, this.serialize());
        this.#ports.changed(this.#schemas);
    }
    openImportFile() { this.#behavior?.elements.importFile?.click(); }
    reviewImport(serialized) {
        const behavior = this.#behavior;
        if (!behavior)
            return;
        const archive = JSON.parse(serialized);
        if (archive.version !== 1 || !Array.isArray(archive.schemas) || !Array.isArray(archive.rules))
            throw new Error("Choose a version 1 Schema Library export.");
        const imported = archive.schemas.map((schema) => importSchema(JSON.stringify(schema)));
        const candidates = [...this.#schemas.filter((schema) => !imported.some(({ id }) => id === schema.id)), ...imported];
        for (const schema of imported) {
            const issue = schemaInheritanceError(schema, candidates) ?? schemaInheritanceConflict(schema, candidates);
            if (issue)
                throw new Error(issue);
        }
        const rules = archive.rules.filter((rule) => Boolean(rule && typeof rule === "object" && "id" in rule && "name" in rule && "kind" in rule && "version" in rule && "enabled" in rule));
        this.pendingImport = { schemas: imported, rules: structuredClone(rules) };
        if (behavior.elements.importSummary)
            behavior.elements.importSummary.textContent = `${imported.length} schemas and ${rules.length} reusable rules are ready to import.`;
        behavior.elements.importReview?.showModal();
    }
    async readImportFile() {
        const behavior = this.#behavior, file = behavior?.elements.importFile?.files?.[0];
        if (!behavior || !file)
            return;
        try {
            this.reviewImport(await file.text());
        }
        catch (error) {
            if (behavior.elements.result)
                behavior.elements.result.textContent = error instanceof Error ? error.message : "Schema Library import failed.";
        }
        if (behavior.elements.importFile)
            behavior.elements.importFile.value = "";
    }
    replaceImport() {
        const behavior = this.#behavior, pending = this.pendingImport;
        if (!behavior || !pending)
            return;
        this.#schemas = structuredClone(pending.schemas);
        behavior.replaceRules(structuredClone(pending.rules));
        this.pendingImport = undefined;
        this.persist();
        behavior.persistRules();
        behavior.renderAll();
        behavior.renderRules();
        behavior.elements.importReview?.close();
        if (behavior.elements.result)
            behavior.elements.result.textContent = "Schema Library replaced.";
    }
    appendImport() {
        const behavior = this.#behavior, pending = this.pendingImport;
        if (!behavior || !pending)
            return;
        this.#schemas = [...this.#schemas.filter((schema) => !pending.schemas.some(({ id }) => id === schema.id)), ...structuredClone(pending.schemas)];
        behavior.replaceRules([...behavior.rules().filter((rule) => !pending.rules.some(({ id }) => id === rule.id)), ...structuredClone(pending.rules)]);
        this.pendingImport = undefined;
        this.persist();
        behavior.persistRules();
        behavior.renderAll();
        behavior.renderRules();
        behavior.elements.importReview?.close();
        if (behavior.elements.result)
            behavior.elements.result.textContent = "Schema Library appended.";
    }
    cancelImport() { this.pendingImport = undefined; this.#behavior?.elements.importReview?.close(); }
    requestDeletion(id) {
        const behavior = this.#behavior, schema = this.#schemas.find((candidate) => candidate.id === id);
        if (!behavior || !schema)
            return false;
        const children = this.#schemas.filter(({ parentSchemaId }) => parentSchemaId === id);
        if (children.length) {
            if (behavior.elements.result)
                behavior.elements.result.textContent = `Cannot delete ${schema.name}: it is the parent of ${children.map(({ name }) => name).join(", ")}.`;
            return false;
        }
        this.pendingDeletion = structuredClone(schema);
        if (behavior.elements.deleteSummary)
            behavior.elements.deleteSummary.textContent = `${schema.name} v${schema.version} and its assignments will be removed.`;
        behavior.elements.deleteReview?.showModal();
        return true;
    }
    confirmDeletion() {
        const behavior = this.#behavior, schema = this.pendingDeletion;
        if (!behavior || !schema)
            return;
        this.#schemas = this.#schemas.filter(({ id }) => id !== schema.id);
        this.pendingDeletion = undefined;
        if (this.#activeSchemaId === schema.id) {
            this.#activeSchemaId = undefined;
            this.#draft = undefined;
        }
        this.persist();
        behavior.renderAll();
        behavior.elements.deleteReview?.close();
        if (behavior.elements.result)
            behavior.elements.result.textContent = `Deleted ${schema.name}.`;
    }
    cancelDeletion() { this.pendingDeletion = undefined; this.#behavior?.elements.deleteReview?.close(); }
    finishExport(status) {
        const behavior = this.#behavior;
        if (!behavior)
            return;
        if (behavior.elements.result)
            behavior.elements.result.textContent = status;
        behavior.elements.exportReview?.close();
        behavior.elements.exportChoices?.close();
        this.pendingStandardExport = undefined;
        this.exportTrigger?.focus({ preventScroll: true });
        this.exportTrigger = undefined;
    }
    openStandardExport(scope, schema) {
        const behavior = this.#behavior;
        if (!behavior)
            return;
        const review = schema ? inspectJsonSchemaExport(schema, this.#schemas) : exportJsonSchemaBundle(this.#schemas).compatibility;
        this.pendingStandardExport = { scope, ...(schema ? { schema } : {}), review };
        const dialog = behavior.elements.exportReview, document = dialog?.ownerDocument;
        if (!dialog || !document)
            return;
        const heading = document.createElement("h4"), summary = document.createElement("p"), conversions = document.createElement("ul"), omitted = document.createElement("ul");
        heading.textContent = "JSON Schema Draft 2020-12 compatibility review";
        summary.textContent = scope === "library"
            ? `3rd-party validation format · ${this.#schemas.filter((item) => item.published !== false && item.version > 0).length} schema resources` : `${schema?.name} · current published revision ${schema?.version}`;
        conversions.setAttribute("aria-label", "Standard export conversions");
        conversions.append(...review.conversions.map(({ ruleId, propertyPath, conversion }) => Object.assign(document.createElement("li"), { textContent: `${ruleId} at ${propertyPath}: ${conversion}` })));
        if (!review.conversions.length)
            conversions.append(Object.assign(document.createElement("li"), { textContent: "No severity or issue-message conversions" }));
        omitted.setAttribute("aria-label", "Unsupported rules omitted from standard export");
        omitted.append(...review.omitted.map(({ ruleName, propertyPath, behavior }) => Object.assign(document.createElement("li"), { textContent: `${ruleName} at ${propertyPath}: unsupported ${behavior}; omitted` })));
        if (!review.omitted.length)
            omitted.append(Object.assign(document.createElement("li"), { textContent: "No unsupported rules" }));
        const confirm = document.createElement("button"), cancel = document.createElement("button");
        confirm.type = cancel.type = "button";
        confirm.textContent = review.omitted.length ? "Export without unsupported rules" : "Export JSON Schema Draft 2020-12";
        cancel.textContent = "Cancel";
        confirm.addEventListener("click", () => {
            const pending = this.pendingStandardExport;
            if (!pending)
                return;
            if (pending.scope === "library") {
                const exported = exportJsonSchemaBundle(this.#schemas);
                behavior.download(exported.document, exported.filename);
                this.finishExport(`Exported JSON Schema Draft 2020-12 bundle · ${exported.resourceIds.length} schemas · ${this.omittedStatus(exported.compatibility.omitted.length)}.`);
            }
            else if (pending.schema) {
                const exported = exportJsonSchemaResource(pending.schema, this.#schemas);
                behavior.download(exported.document, exported.filename);
                this.finishExport(`Exported JSON Schema Draft 2020-12 · ${pending.schema.name} revision ${pending.schema.version} · ${this.omittedStatus(exported.compatibility.omitted.length)}.`);
            }
        });
        cancel.addEventListener("click", () => { this.pendingStandardExport = undefined; dialog.close(); this.exportTrigger?.focus({ preventScroll: true }); });
        dialog.replaceChildren(heading, summary, conversions, omitted, confirm, cancel);
        dialog.showModal();
        confirm.focus({ preventScroll: true });
    }
    openExportChoices(trigger, schema) {
        const behavior = this.#behavior, dialog = behavior?.elements.exportChoices, document = dialog?.ownerDocument;
        this.exportTrigger = trigger;
        if (!behavior || !dialog || !document)
            return;
        const heading = document.createElement("h4"), extension = document.createElement("button"), extensionDescription = document.createElement("p"), standard = document.createElement("button"), standardDescription = document.createElement("p"), cancel = document.createElement("button");
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
        extension.addEventListener("click", () => {
            if (schema) {
                const archive = createExtensionSchemaPackage(schema, this.#schemas, behavior.rules());
                behavior.download(archive, `${schema.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-extension-package-v1.json`);
                this.finishExport(`Exported Extension schema package · ${schema.name} revision ${schema.version}.`);
            }
            else {
                const archive = createSchemaLibraryExport(this.#schemas, behavior.rules());
                behavior.download(archive, "schema-library-v1.json");
                this.finishExport(`Exported Extension backup · ${archive.schemas.length} schemas and ${archive.rules.length} rules.`);
            }
        });
        standard.addEventListener("click", () => { dialog.close(); this.openStandardExport(schema ? "schema" : "library", schema); });
        cancel.addEventListener("click", () => { dialog.close(); this.exportTrigger?.focus({ preventScroll: true }); this.exportTrigger = undefined; });
        dialog.replaceChildren(heading, extension, extensionDescription, standard, standardDescription, cancel);
        dialog.showModal();
        extension.focus({ preventScroll: true });
    }
    requestExport() { const button = this.#behavior?.elements.exportButton; if (button)
        this.openExportChoices(button); }
    omittedStatus(count) { return `${count} omitted ${count === 1 ? "rule" : "rules"}`; }
}
//# sourceMappingURL=library-controller.js.map