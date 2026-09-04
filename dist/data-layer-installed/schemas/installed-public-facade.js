import { createSchemaAuthoringPublicOperations } from "./authoring-public-operations.js";
import { createCanonicalPublicOperations } from "./canonical-public-operations.js";
import { createGuidedPublicOperations } from "./guided-public-operations.js";
import { createSchemaLibraryPublicOperations } from "./library-public-operations.js";
/** Builds the installed controller's public operation surface from domain facades. */
export function createSchemasInstalledPublicFacade(p) {
    const active = () => p.library.active(), activeIndex = () => p.library.activeIndex();
    const promotionRules = () => structuredClone(p.rule.rules);
    const focus = (path) => { p.property.selectedPath = path.replace(/^\//, "").replaceAll("/", "."); p.render(); };
    return {
        ...createSchemaLibraryPublicOperations({ library: p.library, active, activeIndex, persist: () => p.library.persist(), render: p.render, publish: () => p.editorWorkflow.publish(), exportButton: p.exportButton, mounted: () => p.lifecycle.isMounted() }),
        ...createSchemaAuthoringPublicOperations({ property: p.property, rule: p.rule, canonical: p.canonical, renderRulePicker: () => p.propertyWorkflow.render() }, {
            openSchemaFromSource: (source) => p.source.open(source), requestPropertyRemoval: (path, trigger) => p.editorWorkflow.requestRemoval(path, trigger), requestDocumentationRemoval: (path, trigger) => p.editorWorkflow.requestDocumentationRemoval(path, trigger),
            requestPropertyCopy: (path, target) => p.editorWorkflow.openCopy(path, target), confirmPropertyCopy: () => p.editorWorkflow.confirmCopy(), openSpecificIndex: (path, trigger) => p.editorWorkflow.openSpecificIndex(path, trigger), openManualProperty: (path, trigger) => p.editorWorkflow.openManual(path, trigger), openContextualManualProperty: (path, trigger) => p.editorWorkflow.openManual(path, trigger),
            capturePropertyReturn: (path, label) => p.propertyWorkflow.captureReturn(path, label), restorePropertyReturn: () => p.propertyWorkflow.restoreReturn(), closeRulePickerForCommit: () => p.propertyWorkflow.closeForCommit(), openRulePicker: (path, trigger) => p.propertyWorkflow.open(path, trigger),
            openCanonicalRuleEditor: (path, trigger) => p.canonicalView.openRule(path, trigger), openCanonicalPropertyActions: (path, trigger) => p.canonicalView.openPropertyActions(path, trigger), configuredRule: () => p.propertyWorkflow.configuredRule(), conditionPredicate: (path) => p.propertyWorkflow.sampledCondition(path), createConfiguredRule: () => p.propertyWorkflow.createConfigured(),
            openAttachedRule: (schemaId, ruleId, path, trigger) => p.propertyWorkflow.openAttached(schemaId, ruleId, path, trigger), attachReusableRule: (schemaId, ruleId, path, rule) => p.rule.attach(schemaId, ruleId, path, rule), updateAttachedRule: (schemaId, ruleId, enabled) => p.rule.updateAttached(schemaId, ruleId, enabled),
            focusPropertyRule: focus, focusPropertyRow: focus, promotionRules, renderWorkflow: () => { p.rule.render(); p.assignment.render(); }, editAssignment: (schemaId, assignment) => p.assignment.edit(schemaId, assignment), requestLocalRulePromotion: (path, ruleId) => p.rule.openPromotion(path, ruleId)
        }),
        ...createGuidedPublicOperations({ guided: p.guided, validation: p.validation, property: p.property, schemas: () => p.library.schemas, active, activeSchemaId: () => p.library.activeSchemaId, root: p.guidedRoot, generation: () => p.lifecycle.generation(), flow: p.guidedWorkflow.flow, candidate: (schema) => p.guidedWorkflow.candidate(schema), openProperty: (event, schema, path, restore) => p.guidedWorkflow.openProperty(event, schema, path, restore) }, {
            persistGuidedValidation: (result) => p.guidedWorkflow.persistAndFinish(result), openGuidedEvent: (event, schema) => p.guidedWorkflow.openEvent(event, schema), openGuidedProperty: (event, schema, path, restore) => p.guidedWorkflow.openProperty(event, schema, path, restore),
            openLivePropertyDeclaration: (event, path, trigger) => p.guided.openLivePropertyDeclaration(event, path, trigger), openAllowedValueExpansionReview: (eventId, schemaId, evaluation, trigger) => p.guided.openAllowedValueExpansion(eventId, schemaId, evaluation, trigger), guidedContinuation: (event) => p.guidedWorkflow.continuation(event), refreshCurrentLiveAfterSchemaPublication: p.refreshLive, hydrateActiveProjectForSchemas: () => p.projectHydration.hydrateActive()
        }),
        show() { p.render(); p.relationshipTree.restoreScroll(); },
        ...createCanonicalPublicOperations({ controller: p.canonical, schema: (id) => p.library.schemas.find((schema) => schema.id === id), openSaved: (schema) => p.canonicalPersistence.openSaved(schema), open: (adapter) => p.canonicalPersistence.open(adapter), close: (clear) => p.canonicalPersistence.close(clear), show: () => { p.render(); p.relationshipTree.restoreScroll(); }, projection: (adapter) => p.canonicalPersistence.projection(adapter), facet: (canonical, node) => p.canonicalPersistence.facet(canonical, node), render: () => p.canonicalPersistence.render() })
    };
}
//# sourceMappingURL=installed-public-facade.js.map