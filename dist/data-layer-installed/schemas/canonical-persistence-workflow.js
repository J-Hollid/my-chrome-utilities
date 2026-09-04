import { persistLocalRulePromotion } from "../../data-layer-local-rule-promotion.js";
import { SCHEMA_LIBRARY_STORAGE_KEY, serializeSchemaLibrary } from "../../utilities/data-layer/schemas.js";
import { SchemaPersistenceController } from "./persistence-controller.js";
import { SCHEMA_RULE_STORAGE_KEY } from "./rule-controller.js";
/** Coordinates canonical editor delegation with durable settlement transactions. */
export class SchemaCanonicalPersistenceWorkflow {
    #ports;
    #persistence;
    constructor(ports) {
        this.#ports = ports;
        this.#persistence = new SchemaPersistenceController({ root: ports.root, storage: ports.storage, library: ports.library, rules: ports.rules,
            property: ports.property, canonical: ports.canonical, scheduleFrame: ports.scheduleFrame, renderAll: ports.renderAll,
            renderRules: () => ports.rules.render(), renderCanonical: () => this.render(), clearCanonicalSettlement: (schemaId, settlement) => { this.clearSettlement(schemaId, settlement); }, editorDraft: ports.editorDraft });
    }
    projection(adapter, canonical = adapter.load()) { return this.#ports.view.projection(adapter, canonical); }
    facet(canonical, node) { return this.#ports.view.facet(canonical, node); }
    renderContext() { this.#ports.view.renderContext(); }
    render() { this.#ports.view.render(); }
    open(adapter) { this.#ports.view.open(adapter); }
    close(clearSchemaSelection = true) { this.#ports.view.close(clearSchemaSelection); }
    openSaved(schema) { this.#ports.view.openSaved(schema); }
    beginSettlement(schemaId) { const settlement = this.#ports.canonical.beginSettlement(schemaId); this.#ports.editor?.setAttribute("aria-busy", "true"); if (this.#ports.save)
        this.#ports.save.disabled = true; return settlement; }
    clearSettlement(schemaId, settlement) { return this.#ports.canonical.clearSettlement(schemaId, settlement); }
    queueLibraryPersistence(schemaId) { this.#ports.canonical.queueLibraryPersistence(schemaId, this.#ports.library.schemas, () => this.#ports.library.persist()); }
    apply(schemas, rules) { this.#persistence.apply(schemas, rules); }
    begin(kind, schemaId, previousSchemas, previousRules, nextSchemas, nextRules) {
        return this.#persistence.begin(kind, schemaId, previousSchemas, previousRules, nextSchemas, nextRules);
    }
    promote(schemaId, previousSchemas, previousRules, nextSchemas, nextRules) {
        const completion = this.begin("promotion", schemaId, previousSchemas, previousRules, nextSchemas, nextRules);
        persistLocalRulePromotion(this.#ports.storage, { schemaKey: SCHEMA_LIBRARY_STORAGE_KEY, schemaValue: serializeSchemaLibrary(nextSchemas), ruleKey: SCHEMA_RULE_STORAGE_KEY, ruleValue: JSON.stringify(nextRules) });
        this.#ports.library.replaceSchemas(nextSchemas);
        this.#ports.rules.replaceRules(nextRules);
        this.#ports.renderAll();
        this.#ports.rules.render();
        return completion;
    }
    settle(event) { return this.#persistence.settle(event); }
    dispose(error) { this.#persistence.dispose(error); }
}
//# sourceMappingURL=canonical-persistence-workflow.js.map