/** Owns installed Schema shell, editor, and revision DOM. */
export function installSchemaEditorElements(root) {
    const schemaSearch = root.querySelector("#schema-search");
    const schemaCategoryFilter = root.querySelector("#schema-category-filter");
    const schemaEmptyState = root.querySelector("#schema-empty-state");
    const schemaCount = root.querySelector("#schema-count");
    const schemaList = root.querySelector("#schema-list");
    const schemaResult = root.querySelector("#schema-result");
    const createSchemaButton = root.querySelector("#create-schema");
    const recheckSchemaValidationButton = root.querySelector("#recheck-schema-validation");
    const schemaValidationIssues = root.querySelector("#schema-validation-issues");
    const schemaValidationRecordList = root.querySelector("#schema-validation-record-list");
    const guidedValidationRoot = root.querySelector("#guided-validation-flow");
    const schemaEditor = root.querySelector("#schema-editor");
    const schemaEditorStatus = root.querySelector("#schema-editor-status");
    const schemaDetail = root.querySelector("#schema-detail");
    const schemaTreeScrollOwner = root.querySelector("#workspace-panel-data-layer");
    const schemaPanel = root.querySelector("#data-layer-panel-schemas");
    const sidePanelLayeredProfileEditorHost = root.querySelector("#side-panel-layered-profile-editor");
    const liveEventQuery = root.querySelector("#live-event-query");
    const schemaSubviews = Array.from(root.querySelectorAll("#schema-subviews [role=tab]"));
    const schemaPanels = Array.from(root.querySelectorAll("#schema-master, #schema-rule-library, #schema-assignments"));
    if (sidePanelLayeredProfileEditorHost && schemaDetail && !schemaDetail.contains(sidePanelLayeredProfileEditorHost))
        schemaDetail.prepend(sidePanelLayeredProfileEditorHost);
    const schemaDetailEmpty = root.querySelector("#schema-detail-empty");
    const schemaInheritanceProvenance = root.querySelector("#schema-inheritance-provenance");
    const schemaRuleOverrides = root.querySelector("#schema-rule-overrides");
    const schemaRuleOverrideList = root.querySelector("#schema-rule-override-list");
    const schemaEditorParent = root.querySelector("#schema-editor-parent");
    const schemaOnlyDeclaredProperties = root.querySelector("#schema-only-declared-properties");
    const schemaEditorName = root.querySelector("#schema-editor-name");
    const schemaEditorDescription = root.querySelector("#schema-editor-description");
    const saveSchemaDescriptionButton = root.querySelector("#save-schema-description");
    const schemaDescriptionOrigin = root.querySelector("#schema-description-origin");
    const schemaEditorTarget = root.querySelector("#schema-editor-target");
    const saveSchemaButton = root.querySelector("#save-schema");
    const saveSchemaReason = root.querySelector("#save-schema-reason");
    const schemaRevisionReview = root.querySelector("#schema-revision-review");
    const schemaRevisionReviewSummary = root.querySelector("#schema-revision-review-summary");
    const confirmSchemaRevisionButton = root.querySelector("#confirm-schema-revision");
    const cancelSchemaRevisionButton = root.querySelector("#cancel-schema-revision");
    const schemaCloseReview = root.querySelector("#close-schema-editor-review");
    const schemaCloseReviewSummary = root.querySelector("#schema-close-review-summary");
    const discardSchemaDraftButton = root.querySelector("#discard-schema-draft");
    const keepEditingSchemaButton = root.querySelector("#keep-editing-schema");
    const closeSchemaEditorButton = root.querySelector("#close-schema-editor");
    const saveAndCloseSchemaButton = root.querySelector("#save-and-close-schema");
    const saveSchemaCloseReviewButton = root.querySelector("#save-schema-close-review");
    const discardWorkingSchemaDraftButton = root.querySelector("#discard-working-schema-draft");
    const schemaRevisionSelector = root.querySelector("#schema-revision-selector");
    const schemaRevisionComparison = root.querySelector("#schema-revision-comparison");
    const duplicateSchemaRevisionButton = root.querySelector("#duplicate-schema-revision");
    const restoreSchemaRevisionButton = root.querySelector("#restore-schema-revision");
    const schemaOwnerDocument = root.ownerDocument
        ?? ("createElement" in root ? root : undefined);
    const owned = (selector, tag) => root.querySelector(selector) ?? schemaOwnerDocument?.createElement(tag) ?? null;
    const schemaEditorNameAssistance = owned("#schema-editor-name-assistance", "output");
    if (schemaEditorNameAssistance && !schemaEditorNameAssistance.isConnected) {
        schemaEditorNameAssistance.id = "schema-editor-name-assistance";
        schemaEditorName?.after(schemaEditorNameAssistance);
    }
    const schemaInheritedRuleGroups = owned("#schema-inherited-rule-groups", "section");
    const schemaEffectiveRulePreview = owned("#schema-effective-rule-preview", "section");
    const schemaSpecificationBuilder = owned("#schema-specification-builder", "section");
    const buildSpecificationButton = owned("#build-specification", "button");
    const buildHistoricalSpecificationButton = owned("#build-historical-specification", "button");
    const compactCanonicalContext = owned("#compact-canonical-context", "section");
    if (schemaInheritedRuleGroups) {
        schemaInheritedRuleGroups.id = "schema-inherited-rule-groups";
        schemaInheritedRuleGroups.setAttribute("aria-label", "Inherited rule states");
    }
    if (schemaEffectiveRulePreview) {
        schemaEffectiveRulePreview.id = "schema-effective-rule-preview";
        schemaEffectiveRulePreview.setAttribute("aria-label", "Effective-rule preview");
    }
    if (schemaRuleOverrides && schemaInheritedRuleGroups && schemaEffectiveRulePreview)
        schemaRuleOverrides.after(schemaInheritedRuleGroups, schemaEffectiveRulePreview);
    if (schemaSpecificationBuilder) {
        schemaSpecificationBuilder.id = "schema-specification-builder";
        schemaSpecificationBuilder.hidden = true;
        schemaDetail?.append(schemaSpecificationBuilder);
    }
    if (buildSpecificationButton) {
        buildSpecificationButton.id = "build-specification";
        buildSpecificationButton.type = "button";
        buildSpecificationButton.textContent = "Build specification";
        schemaEditor?.prepend(buildSpecificationButton);
    }
    if (buildHistoricalSpecificationButton) {
        buildHistoricalSpecificationButton.id = "build-historical-specification";
        buildHistoricalSpecificationButton.type = "button";
        buildHistoricalSpecificationButton.textContent = "Build specification";
        restoreSchemaRevisionButton?.after(buildHistoricalSpecificationButton);
    }
    if (compactCanonicalContext) {
        compactCanonicalContext.id = "compact-canonical-context";
        compactCanonicalContext.setAttribute("aria-label", "Compact canonical schema context");
        compactCanonicalContext.hidden = true;
        schemaEditor?.prepend(compactCanonicalContext);
    }
    return { schemaSearch, schemaCategoryFilter, schemaEmptyState, schemaCount, schemaList, schemaResult,
        createSchemaButton, recheckSchemaValidationButton, schemaValidationIssues, schemaValidationRecordList,
        guidedValidationRoot, schemaEditor, schemaEditorStatus, schemaDetail, schemaTreeScrollOwner, schemaPanel,
        sidePanelLayeredProfileEditorHost, liveEventQuery, schemaSubviews, schemaPanels, schemaDetailEmpty,
        schemaInheritanceProvenance, schemaRuleOverrides, schemaRuleOverrideList, schemaEditorParent,
        schemaOnlyDeclaredProperties, schemaEditorName, schemaEditorDescription, saveSchemaDescriptionButton,
        schemaDescriptionOrigin, schemaEditorTarget, saveSchemaButton, saveSchemaReason, schemaRevisionReview,
        schemaRevisionReviewSummary, confirmSchemaRevisionButton, cancelSchemaRevisionButton, schemaCloseReview,
        schemaCloseReviewSummary, discardSchemaDraftButton, keepEditingSchemaButton, closeSchemaEditorButton,
        saveAndCloseSchemaButton, saveSchemaCloseReviewButton, discardWorkingSchemaDraftButton, schemaRevisionSelector,
        schemaRevisionComparison, duplicateSchemaRevisionButton, restoreSchemaRevisionButton, schemaOwnerDocument,
        schemaEditorNameAssistance, schemaInheritedRuleGroups, schemaEffectiveRulePreview, schemaSpecificationBuilder,
        buildSpecificationButton, buildHistoricalSpecificationButton, compactCanonicalContext };
}
//# sourceMappingURL=editor-installed-view.js.map