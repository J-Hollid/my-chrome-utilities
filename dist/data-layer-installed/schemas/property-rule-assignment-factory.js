import { SchemaAssignmentController } from "./assignment-controller.js";
import { SchemaPropertyController } from "./property-controller.js";
import { SchemaPropertyRuleWorkflow } from "./property-rule-workflow.js";
import { SchemaPropertyView } from "./property-view.js";
import { SchemaRuleController } from "./rule-controller.js";
import { SchemaRuleInstalledPresentation } from "./rule-installed-view.js";
import { SchemaRulePickerView } from "./rule-picker-view.js";
import { schemaEditorDraft, schemaPropertyType } from "./schema-model.js";
import { addManualCanonical, removeCanonicalDocumentation } from "./property-canonical-adapter.js";
/** Owns complete property, rule, and assignment composition. */
export function createSchemaPropertyRuleAssignmentDomain(storage, ruleElements, schemas, assignmentPorts) {
    const property = new SchemaPropertyController();
    const rule = new SchemaRuleController(storage);
    const rulePresentation = new SchemaRuleInstalledPresentation(rule, ruleElements, schemas);
    const assignment = new SchemaAssignmentController(assignmentPorts);
    let propertyView;
    let rulePicker;
    let workflow;
    return { property, rule, rulePresentation, assignment,
        connect(p) {
            rule.configure({
                elements: p.ruleElements,
                presentation: rulePresentation,
                schemas: () => p.library.schemas,
                replaceSchemas: (schemas) => p.library.replaceSchemas(schemas),
                persistRules: () => rule.persist(),
                persistLibrary: p.persistLibrary,
                renderAll: p.renderAll,
                renderDraft: p.renderDraft,
                createId: p.createRuleId,
                download: p.download,
                createRuleId: p.createRuleId,
                capturedValue: p.capturedValue,
                editableSchema: () => p.library.draft ?? schemaEditorDraft(p.active()),
                propertyType: schemaPropertyType,
                draft: () => p.library.draft,
                replaceDraft: (schema) => p.library.setDraft(schema),
                presentDraft: schemaEditorDraft,
                activeSchemaId: () => p.library.activeSchemaId,
                promotionDialog: p.promotionDialog,
                detail: p.schemaDetail,
                root: p.root,
                scheduleFrame: p.scheduleFrame,
                result: (message) => { if (p.result)
                    p.result.textContent = message; },
                commitPromotion: (...args) => p.canonicalPersistence.promote(...args),
                ...(p.settleCanonical ? { settleCanonical: p.settleCanonical } : {}),
            });
            rulePicker = new SchemaRulePickerView(rule, {
                picker: p.elements.schemaPropertyRulePicker,
                active: p.active,
                draft: () => p.library.draft,
                capturedValue: () => p.capturedValue("payload"),
                propertyType: schemaPropertyType,
                incrementRender: () => { property.renderSequence += 1; },
                close: () => workflow.close(),
                closeForCommit: () => workflow.closeForCommit(),
                createConfigured: () => workflow.createConfigured(),
            });
            property.configure({
                root: p.root,
                active: p.active,
                schemas: () => p.library.schemas,
                ruleIds: () => rule.rules.map(({ id }) => id),
                replaceActive: (schema) => p.library.replaceActive(schema),
                replaceSchemas: (schemas) => p.library.replaceSchemas(schemas),
                persist: p.persistLibrary,
                renderAll: p.renderAll,
                renderView: p.renderProperty,
                renderRules: () => rule.render(),
                openRulePicker: (path, trigger) => workflow.open(path, trigger),
                queuePersistence: (id) => p.canonicalPersistence.queueLibraryPersistence(id),
                canonicalUndo: () => {
                    if (!p.canonical.editor?.onUndo)
                        return false;
                    p.canonical.editor.onUndo();
                    return true;
                },
                removeCanonicalDocumentation: (schema, path) => removeCanonicalDocumentation(p.canonical, schema, path),
                addManualCanonical: (schema, document, path) => addManualCanonical(p.canonical, schema, document, path),
                scheduleFrame: p.scheduleFrame,
                ...(p.settleCanonical ? { settle: p.settleCanonical } : {}),
            });
            propertyView = new SchemaPropertyView({
                root: p.root, document: p.document, library: p.library, property, rules: rule, canonical: p.canonical,
                active: p.active, editorDraft: schemaEditorDraft, parentDocuments: () => property.parentDocuments(),
                normalizedPath: (path) => workflow.normalizedPath(path), replaceActive: (schema) => p.library.replaceActive(schema),
                persistLibrary: p.persistLibrary, persistLibraries: p.persistLibraries,
                queuePersistence: (id) => p.canonicalPersistence.queueLibraryPersistence(id), renderAll: p.renderAll,
                createId: p.createRuleId, settleCanonical: Boolean(p.settleCanonical),
                openCanonicalActions: (path, trigger) => { p.canonicalView.openPropertyActions(path, trigger); },
                openCanonicalRule: (path, trigger) => { p.canonicalView.openRule(path, trigger); },
                openManual: (path, trigger) => property.openManual(path, trigger),
                openRulePicker: (path, trigger) => workflow.open(path, trigger),
                openSpecificIndex: (path, trigger) => property.openSpecificIndex(path, trigger),
                openCopy: (path, trigger) => property.openCopy(path, trigger),
                requestRemoval: (path, trigger) => property.requestRemoval(path, trigger),
                requestDocumentationRemoval: (path, trigger) => property.requestDocumentationRemoval(path, trigger),
                updateAttachedRule: (schemaId, ruleId, enabled) => { rule.updateAttached(schemaId, ruleId, enabled); },
                openAttachedRule: (schemaId, ruleId, path, trigger) => { workflow.openAttached(schemaId, ruleId, path, trigger); },
                promoteRule: (path, ruleId) => { rule.openPromotion(path, ruleId); },
            });
            workflow = new SchemaPropertyRuleWorkflow({
                rule, property, canonical: p.canonical, canonicalView: p.canonicalView, pickerView: rulePicker,
                picker: p.elements.schemaPropertyRulePicker, propertyTree: p.elements.schemaPropertyTree,
                schemaEditor: p.schemaEditor, schemaDetail: p.schemaDetail, document: p.document, active: p.active,
                activeSchemaId: () => p.library.activeSchemaId, draft: () => p.library.draft,
                schemas: () => p.library.schemas, renderSchemas: p.renderAll,
                showSubview: (subview) => p.editor().showSubview(subview),
                attach: (schemaId, ruleId, path, supplied) => rule.attach(schemaId, ruleId, path, supplied),
                propertyType: (schema, path) => rule.typeForAttachment(schema, path),
            });
            return { propertyView, rulePicker, workflow };
        },
        views: () => ({ propertyView, rulePicker, workflow }),
        dispose: () => {
            propertyView?.dispose();
            rulePresentation.dispose();
            rule.dispose();
            property.dispose();
            assignment.dispose();
        }, };
}
//# sourceMappingURL=property-rule-assignment-factory.js.map