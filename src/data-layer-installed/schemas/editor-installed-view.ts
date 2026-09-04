/** Owns installed Schema shell, editor, and revision DOM. */
export function installSchemaEditorElements(root:ParentNode) {
  const schemaSearch = root.querySelector<HTMLInputElement>("#schema-search");
  const schemaCategoryFilter = root.querySelector<HTMLSelectElement>("#schema-category-filter");
  const schemaEmptyState = root.querySelector<HTMLElement>("#schema-empty-state");
  const schemaCount = root.querySelector<HTMLElement>("#schema-count");
  const schemaList = root.querySelector<HTMLElement>("#schema-list");
  const schemaResult = root.querySelector<HTMLElement>("#schema-result");
  const createSchemaButton = root.querySelector<HTMLButtonElement>("#create-schema");
  const recheckSchemaValidationButton = root.querySelector<HTMLButtonElement>("#recheck-schema-validation");
  const schemaValidationIssues = root.querySelector<HTMLElement>("#schema-validation-issues");
  const schemaValidationRecordList = root.querySelector<HTMLElement>("#schema-validation-record-list");
  const guidedValidationRoot = root.querySelector<HTMLElement>("#guided-validation-flow");
  const schemaEditor = root.querySelector<HTMLElement>("#schema-editor");
  const schemaEditorStatus = root.querySelector<HTMLElement>("#schema-editor-status");
  const schemaDetail = root.querySelector<HTMLElement>("#schema-detail");
  const schemaTreeScrollOwner = root.querySelector<HTMLElement>("#workspace-panel-data-layer");
  const schemaPanel = root.querySelector<HTMLElement>("#data-layer-panel-schemas");
  const sidePanelLayeredProfileEditorHost = root.querySelector<HTMLElement>("#side-panel-layered-profile-editor");
  const liveEventQuery = root.querySelector<HTMLElement>("#live-event-query");
  const schemaSubviews = Array.from(root.querySelectorAll<HTMLButtonElement>("#schema-subviews [role=tab]"));
  const schemaPanels = Array.from(root.querySelectorAll<HTMLElement>("#schema-master, #schema-rule-library, #schema-assignments"));
  if (sidePanelLayeredProfileEditorHost && schemaDetail && !schemaDetail.contains(sidePanelLayeredProfileEditorHost))
    schemaDetail.prepend(sidePanelLayeredProfileEditorHost);
  const schemaDetailEmpty = root.querySelector<HTMLElement>("#schema-detail-empty");
  const schemaInheritanceProvenance = root.querySelector<HTMLElement>("#schema-inheritance-provenance");
  const schemaRuleOverrides = root.querySelector<HTMLElement>("#schema-rule-overrides");
  const schemaRuleOverrideList = root.querySelector<HTMLElement>("#schema-rule-override-list");
  const schemaEditorParent = root.querySelector<HTMLSelectElement>("#schema-editor-parent");
  const schemaOnlyDeclaredProperties = root.querySelector<HTMLInputElement>("#schema-only-declared-properties");
  const schemaEditorName = root.querySelector<HTMLInputElement>("#schema-editor-name");
  const schemaEditorDescription = root.querySelector<HTMLTextAreaElement>("#schema-editor-description");
  const saveSchemaDescriptionButton = root.querySelector<HTMLButtonElement>("#save-schema-description");
  const schemaDescriptionOrigin = root.querySelector<HTMLElement>("#schema-description-origin");
  const schemaEditorTarget = root.querySelector<HTMLSelectElement>("#schema-editor-target");
  const saveSchemaButton = root.querySelector<HTMLButtonElement>("#save-schema");
  const saveSchemaReason = root.querySelector<HTMLElement>("#save-schema-reason");
  const schemaRevisionReview = root.querySelector<HTMLDialogElement>("#schema-revision-review");
  const schemaRevisionReviewSummary = root.querySelector<HTMLElement>("#schema-revision-review-summary");
  const confirmSchemaRevisionButton = root.querySelector<HTMLButtonElement>("#confirm-schema-revision");
  const cancelSchemaRevisionButton = root.querySelector<HTMLButtonElement>("#cancel-schema-revision");
  const schemaCloseReview = root.querySelector<HTMLDialogElement>("#close-schema-editor-review");
  const schemaCloseReviewSummary = root.querySelector<HTMLElement>("#schema-close-review-summary");
  const discardSchemaDraftButton = root.querySelector<HTMLButtonElement>("#discard-schema-draft");
  const keepEditingSchemaButton = root.querySelector<HTMLButtonElement>("#keep-editing-schema");
  const closeSchemaEditorButton = root.querySelector<HTMLButtonElement>("#close-schema-editor");
  const saveAndCloseSchemaButton = root.querySelector<HTMLButtonElement>("#save-and-close-schema");
  const saveSchemaCloseReviewButton = root.querySelector<HTMLButtonElement>("#save-schema-close-review");
  const discardWorkingSchemaDraftButton = root.querySelector<HTMLButtonElement>("#discard-working-schema-draft");
  const schemaRevisionSelector = root.querySelector<HTMLSelectElement>("#schema-revision-selector");
  const schemaRevisionComparison = root.querySelector<HTMLElement>("#schema-revision-comparison");
  const duplicateSchemaRevisionButton = root.querySelector<HTMLButtonElement>("#duplicate-schema-revision");
  const restoreSchemaRevisionButton = root.querySelector<HTMLButtonElement>("#restore-schema-revision");
  const schemaOwnerDocument = (root as ParentNode & { ownerDocument?:Document }).ownerDocument
    ?? ("createElement" in root ? root as Document : undefined);
  const owned = <K extends keyof HTMLElementTagNameMap>(selector:string, tag:K):HTMLElementTagNameMap[K] | null =>
    root.querySelector<HTMLElementTagNameMap[K]>(selector) ?? schemaOwnerDocument?.createElement(tag) ?? null;
  const schemaEditorNameAssistance = owned("#schema-editor-name-assistance", "output");
  if (schemaEditorNameAssistance && !schemaEditorNameAssistance.isConnected) {
    schemaEditorNameAssistance.id = "schema-editor-name-assistance"; schemaEditorName?.after(schemaEditorNameAssistance);
  }
  const schemaInheritedRuleGroups = owned("#schema-inherited-rule-groups", "section");
  const schemaEffectiveRulePreview = owned("#schema-effective-rule-preview", "section");
  const schemaSpecificationBuilder = owned("#schema-specification-builder", "section");
  const buildSpecificationButton = owned("#build-specification", "button");
  const buildHistoricalSpecificationButton = owned("#build-historical-specification", "button");
  const compactCanonicalContext = owned("#compact-canonical-context", "section");
  if (schemaInheritedRuleGroups) { schemaInheritedRuleGroups.id = "schema-inherited-rule-groups";
    schemaInheritedRuleGroups.setAttribute("aria-label", "Inherited rule states"); }
  if (schemaEffectiveRulePreview) { schemaEffectiveRulePreview.id = "schema-effective-rule-preview";
    schemaEffectiveRulePreview.setAttribute("aria-label", "Effective-rule preview"); }
  if (schemaRuleOverrides && schemaInheritedRuleGroups && schemaEffectiveRulePreview)
    schemaRuleOverrides.after(schemaInheritedRuleGroups, schemaEffectiveRulePreview);
  if (schemaSpecificationBuilder) { schemaSpecificationBuilder.id = "schema-specification-builder";
    schemaSpecificationBuilder.hidden = true; schemaDetail?.append(schemaSpecificationBuilder); }
  if (buildSpecificationButton) { buildSpecificationButton.id = "build-specification"; buildSpecificationButton.type = "button";
    buildSpecificationButton.textContent = "Build specification"; schemaEditor?.prepend(buildSpecificationButton); }
  if (buildHistoricalSpecificationButton) { buildHistoricalSpecificationButton.id = "build-historical-specification";
    buildHistoricalSpecificationButton.type = "button"; buildHistoricalSpecificationButton.textContent = "Build specification";
    restoreSchemaRevisionButton?.after(buildHistoricalSpecificationButton); }
  if (compactCanonicalContext) { compactCanonicalContext.id = "compact-canonical-context";
    compactCanonicalContext.setAttribute("aria-label", "Compact canonical schema context"); compactCanonicalContext.hidden = true;
    schemaEditor?.prepend(compactCanonicalContext); }
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
