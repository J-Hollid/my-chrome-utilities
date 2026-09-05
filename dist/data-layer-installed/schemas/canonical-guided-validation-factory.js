import { SCHEMA_LIBRARY_STORAGE_KEY, proposeSchemaWorkingDraftName } from "../../utilities/data-layer/schemas.js";
import { SchemaCanonicalEditorController } from "./canonical-editor-controller.js";
import { SchemaCanonicalInstalledView } from "./canonical-installed-view.js";
import { SchemaCanonicalPersistenceWorkflow } from "./canonical-persistence-workflow.js";
import { SchemaGuidedInstalledWorkflow } from "./guided-installed-workflow.js";
import { SchemaGuidedValidationController } from "./guided-validation-controller.js";
import { schemaEditorDraft, schemaPropertyAt, storedPromotionRules } from "./schema-model.js";
import { SchemaValidationController } from "./validation-controller.js";
/** Owns complete canonical, guided-validation, and validation composition. */
export function createSchemaCanonicalGuidedValidationDomain(p) {
    let persistence, guidedWorkflow;
    const validation = new SchemaValidationController(p.storage, { list: p.elements.records, issues: p.elements.issues, result: p.elements.result, guidedRoot: p.elements.guidedRoot,
        document: p.elements.document,
        ...(p.prepare ? { prepare: p.prepare } : {}), schemas: () => p.library.schemas, generation: () => p.lifecycle.generation(), isCurrent: (generation) => p.lifecycle.isCurrent(generation) });
    const guided = new SchemaGuidedValidationController(p.storage);
    const canonical = new SchemaCanonicalEditorController({ blocked: () => Boolean(p.blocked?.()), generation: () => p.lifecycle.generation(),
        isCurrent: (generation) => p.lifecycle.isCurrent(generation),
        setBusy: (busy) => { p.elements.editor?.setAttribute("aria-busy", String(busy)); if (busy && p.elements.save)
            p.elements.save.disabled = true; },
        renderContext: () => persistence.renderContext(), renderEditor: () => persistence.render(), createId: p.createId,
        writeLibrary: (schemas) => { p.storage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, p.library.serialize(schemas)); p.changed(schemas); }, ...(p.settle ? { settleLibrary: p.settle } : {}),
        mounted: () => p.lifecycle.isMounted() });
    const proposeName = (schema, proposed) => {
        const updated = proposeSchemaWorkingDraftName(schema, proposed), draft = updated.workingDraft;
        return !draft?.canonicalSchema || !proposed ? updated : { ...updated, workingDraft: { ...draft, canonicalSchema: { ...draft.canonicalSchema, contributorName: proposed } } };
    };
    const view = new SchemaCanonicalInstalledView({ controller: canonical, elements: { context: p.elements.context, editor: p.elements.editor, detail: p.elements.detail,
            detailEmpty: p.elements.detailEmpty, save: p.elements.save, list: p.elements.list, document: p.elements.document },
        activeSchemaId: () => p.library.activeSchemaId, setActiveSchemaId: (id) => { if (id)
            p.library.select(id);
        else
            p.library.clearSelection(); }, draft: () => p.library.draft,
        setDraft: (schema) => p.library.setDraft(schema), schemas: () => p.library.schemas, replaceSchemas: (schemas) => p.library.replaceSchemas(schemas),
        editorDraft: schemaEditorDraft, propertyAt: schemaPropertyAt, selectedPath: () => p.property.selectedPath, setSelectedPath: (path) => p.property.selectPath(path),
        renderDraft: p.renderDraft, renderAll: p.renderAll, persistLibrary: p.persistLibrary,
        proposeName, createId: (kind) => canonical.createCanonicalId(kind), conceptSuggestions: p.conceptSuggestions, ...(p.createTableEditor ? { createTableEditor: p.createTableEditor } : {}),
        ...(p.settle ? { settle: p.settle } : {}),
        closeRoute: (resolve) => p.editorRoute.close(resolve), generation: () => p.lifecycle.generation(), isCurrent: (generation) => p.lifecycle.isCurrent(generation),
        rulePicker: p.elements.rulePicker,
        setRulePicker: (path, trigger) => { p.rule.setPicker(path, trigger); p.rule.setConfiguration(undefined); p.rule.setEditingAttached(undefined); },
        closeRulePicker: () => p.propertyWorkflow().close() });
    persistence = new SchemaCanonicalPersistenceWorkflow({ root: p.root, storage: p.storage, library: p.library, rules: p.rule, property: p.property, canonical, view, editor: p.elements.editor,
        save: p.elements.save, scheduleFrame: p.scheduleFrame, renderAll: p.renderAll, editorDraft: schemaEditorDraft });
    guided.configure({ root: p.root, guidedRoot: p.elements.guidedRoot, document: p.elements.document ?? null, schemas: () => p.library.schemas,
        replaceSchemas: (schemas) => p.library.replaceSchemas(schemas), persistSchemas: p.persistLibraries, renderSchemas: p.renderAll,
        openDraft: (schema) => guidedWorkflow.openDraft(schema), restoreCapture: p.restoreCapture, scheduleFrame: p.scheduleFrame, generation: () => p.lifecycle.generation(),
        selectSchema: (schemaId, propertyPath) => {
            p.property.selectPath(propertyPath);
            const schema = p.library.schemas.find(({ id }) => id === schemaId);
            p.library.select(schemaId, schema && schemaEditorDraft(schema));
            p.renderAll();
        },
        result: (message) => { if (p.elements.result)
            p.elements.result.textContent = message; }, expansionRules: p.expansionRules,
        replaceExpansionRules: (rules) => p.rule.replaceRules(storedPromotionRules(rules.map((rule) => ({ ...rule, name: rule.name ?? rule.id,
            enabled: rule.enabled !== false })))),
        rules: () => p.rule.rules, replaceRules: (rules) => p.rule.replaceRules(rules), applyPersistence: (schemas, rules) => persistence.apply(schemas, rules), beginPersistence: (schemaId, previousSchemas, previousRules, nextSchemas, nextRules) => persistence.begin("guided", schemaId, previousSchemas, previousRules, nextSchemas, nextRules) });
    guidedWorkflow = new SchemaGuidedInstalledWorkflow({ controller: guided, root: p.elements.guidedRoot, schemas: () => p.library.schemas, generation: () => p.lifecycle.generation(),
        result: p.elements.result, ...(p.saved ? { saved: p.saved } : {}), restoreCapture: p.restoreCapture, openDraft: (schema) => p.editor().openDraft(schema),
        openRevisionReview: () => p.editor().openRevision(), ...(p.guidedFlowFactory ? { flowFactory: p.guidedFlowFactory } : {}) });
    return { validation, guided, canonical, view, persistence, guidedWorkflow, proposeName, dispose: () => {
            guidedWorkflow.dispose();
            persistence.close(false);
            view.dispose();
            guided.dispose();
            validation.dispose();
            canonical.disposeState();
            persistence.dispose(new Error("Schemas controller disposed before durable persistence settled"));
        } };
}
//# sourceMappingURL=canonical-guided-validation-factory.js.map