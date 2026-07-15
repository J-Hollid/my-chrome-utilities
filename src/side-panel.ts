import {
  listCommands,
  runCommandById,
  type CommandRunRecord,
} from "./commands.js";
import { createPaletteController } from "./command-palette-ui.js";
import {
  advanceHotkeySequence,
  blankHotkeyKeymap,
  duplicateSequences,
  HOTKEY_KEYMAP_STORAGE_KEY,
  keyTokenFromKeyboardEvent,
  updateHotkeyKeymap,
  validateHotkeyKeymap,
  type HotkeyKeymap,
} from "./hotkey-keymap.js";
import { createHotkeyEditor } from "./hotkey-editor.js";
import type { WorkspaceTabId } from "./workspace-tabs.js";
import { createWorkspaceTabsController } from "./workspace-tabs-ui.js";
import {
  tabPageObservation,
} from "./active-page-observation.js";
import {
  attachedObservationTarget,
  attachSelectedObservationTarget,
  createObservationTarget,
  createObservationTargetState,
  findObservationTargets,
  navigateObservationTarget,
  refreshDiscoveredObservationTargets,
  registerObservationTarget,
  restoreAttachedObservationTarget,
  selectObservationTarget,
  selectedObservationTarget,
  updateObservationTargetAccess,
  type ObservationTarget,
  type ObservationTargetState,
} from "./data-layer-observation-targets.js";
import {
  closeDetachTargetConfirmation,
  closeObservationTargetPicker,
  findObservationTargetElements,
  handleObservationTargetDialogKeydown,
  handleObservationTargetListKeydown,
  handleObservationTargetSearchKeydown,
  renderObservationTargetPicker as renderObservationTargetPickerUi,
  setObservationTargetResult as setObservationTargetResultUi,
  showDetachTargetConfirmation,
  showObservationTargetPicker,
} from "./data-layer-observation-targets-ui.js";
import {
  getHistoryArrayPath,
  samplePageObject,
  setHistoryArrayPath,
} from "./data-layer.js";
import {
  appendObservedHistoryEntry,
  attachHistoryArrayObserver,
  attachHistoryArraySnapshot,
  stopHistoryArrayObserver,
  type DataLayerHistoryObserverState,
} from "./data-layer-observer.js";
import {
  beginObservedPageLoad,
  initialObservationRefreshState,
  markObservationRefreshPageEntryCaptured,
  nextObservationRefreshAttempt,
  observationRefreshDelay,
  observationRefreshRequestForPageLoad,
  observationRefreshRequestIsCurrent,
  shouldRetryObservationRefresh,
  type ObservationRefreshRequest,
} from "./data-layer-observation-refresh.js";
import {
  initialObservationActivationState,
  nextObservationActivation,
  observationActivationIsCurrent,
} from "./data-layer-observation-activation.js";
import {
  startLiveHistoryPushCapture,
  type StopLiveHistoryPushCapture,
} from "./data-layer-live-observation.js";
import {
  observerAttachmentStatus,
  restartObservation,
} from "./data-layer-recovery.js";
import {
  captureEntry,
  DATA_LAYER_SESSION_STORAGE_KEY,
  navigateSession,
  persistSession,
  restoreSession,
  sessionScope,
  type DataLayerSessionState,
} from "./data-layer-session.js";
import { beginDataLayerTestingSession } from "./data-layer-session-start.js";
import { freshSessionAvailability, restoreFreshSessionLiveObserver, startFreshLiveSession } from "./data-layer-fresh-session.js";
import { endLiveSession } from "./data-layer-live-session-end.js";
import {
  attachedTargetRecoveryIsCurrent,
  captureAttachedTargetRecovery,
  completeAttachedTargetRecovery,
} from "./data-layer-target-recovery.js";
import { liveGuidedWorkflow } from "./data-layer-live-guided-workflow.js";
import {
  findLiveGuidedWorkflowElements,
  renderLiveGuidedWorkflow,
} from "./data-layer-live-guided-workflow-ui.js";
import { renderLiveSessionControls } from "./data-layer-live-session-controls-ui.js";
import {
  canonicalLiveObserverStatus,
  createLiveSessionSummary,
} from "./data-layer-live-session-summary.js";
import { createLiveNotificationController } from "./data-layer-live-notifications.js";
import {
  createTargetPathStatusController,
  targetPathStatusForObservation,
  type TargetPathStatus,
} from "./data-layer-target-path-status.js";
import { copyLivePageUrl as copyLivePageUrlAction } from "./data-layer-live-session-summary-actions.js";
import {
  findLiveSessionSummaryElements,
  renderLiveSessionSummary,
} from "./data-layer-live-session-summary-ui.js";
import type { ActivePageObservationResult } from "./active-page-observation.js";
import {
  createLiveObserverState,
  closeLiveInspector,
  dataLayerViewForNavigationKey,
  dataLayerViews,
  pauseCapture,
  recordLiveEvent,
  resumeCapture,
  setLiveQuery,
  selectLiveEvent,
  updateLiveSourceStatus,
  type DataLayerView,
  type LiveEvent,
  type LiveObserverState,
} from "./data-layer-live-observer.js";
import { renderEventFeedQueryBuilder } from "./data-layer-event-feed-query-ui.js";
import type { EventFeedQuery } from "./data-layer-event-feed-query.js";
import {
  applySavedEventFeedFilter,
  commitSavedEventFeedFilterLibrary,
  createSavedEventFeedFilter,
  deleteSavedEventFeedFilter,
  renameSavedEventFeedFilter,
  restoreSavedEventFeedFilterLibrary,
  restoreSavedEventFeedWorkingView,
  serializeSavedEventFeedWorkingView,
  setDefaultSavedEventFeedFilter,
  updateSavedEventFeedFilter,
  SAVED_EVENT_FEED_FILTER_STORAGE_KEY,
  SAVED_EVENT_FEED_FILTER_WORKING_STORAGE_KEY,
  type SavedEventFeedFilterLibrary,
} from "./data-layer-saved-event-feed-filters.js";
import {
  confirmSavedSessionDeletion,
  cancelSavedSessionDeletion,
  createSavedSessionLibrary,
  exportSavedSession,
  importSavedSession,
  openSavedSession,
  requestSavedSessionDeletion,
  renameSavedSession,
  restoreSavedSessionLibrary,
  resumeSavedSession,
  searchSavedSessions,
  savedSessionSummary,
  serializeSavedSessionLibrary,
  type ArchivedSession,
  type SavedSessionLibrary,
} from "./data-layer-saved-sessions.js";
import {
  confirmSessionSave,
  createSessionSaveDraft,
  openSavedSessionLiveFeed,
  recordBackgroundLiveEvent,
  restoreSavedSessionLiveFeed,
  returnToCurrentLiveFeed,
  revalidateSavedSessionLiveFeed,
  SAVED_SESSION_LIBRARY_STORAGE_KEY,
  SAVED_SESSION_LIVE_FEED_STORAGE_KEY,
  serializeSavedSessionLiveFeed,
  updateSavedSessionLiveFeedView,
  type SavedSessionLiveFeed,
  type SessionSaveDraft,
} from "./data-layer-saved-session-live-feed.js";
import {
  findLiveObserverElements,
  renderDataLayerView,
  renderLiveInspector,
  renderLiveObserverState,
  renderLiveSessionMessage,
  setEventValidationUpdateStatus,
} from "./data-layer-live-observer-ui.js";
import { createLiveInspectorActions } from "./data-layer-live-inspector-actions.js";
import {
  captureLiveInspectorPresentation,
  restoreLiveInspectorPresentation,
  type LiveInspectorPresentationSnapshot,
} from "./data-layer-live-inspector-presentation-ui.js";
import { createLiveDefectReportNavigation, renderDefectReportBuilder } from "./data-layer-defect-report-ui.js";
import { renderOccurrenceDefectReportBuilder } from "./data-layer-event-occurrence-defect-report-ui.js";
import { renderOccurrenceReport, type OccurrenceReport } from "./data-layer-event-occurrence-defect-report.js";
import { renderJiraReport, type GeneratedDefectReport } from "./data-layer-defect-report.js";
import { browserDefectReportClipboard } from "./data-layer-defect-report-browser.js";
import { missingEventVisits, renderMissingEventDefectReportBuilder, type MissingEventBuilderController } from "./data-layer-missing-event-defect-report-ui.js";
import { generateMissingEventRepresentations, type MissingEventReport } from "./data-layer-missing-event-defect-report.js";
import {
  addDefect,
  attachSavedSessionToDefect,
  cancelDefectDeletion,
  confirmDefectDeletion,
  createMissingEventDefect,
  createOccurrenceDefect,
  createValidationDefect,
  currentDefectIssues,
  DEFECT_LIBRARY_STORAGE_KEY,
  editDefect,
  eventContainsDefectIssue,
  eventMatchesOccurrenceDefect,
  presentedEventTriage,
  requestDefectDeletion,
  restoreDefectLibrary,
  searchDefects,
  serializeDefectLibrary,
  updateDefectStatus,
  type DefectLibrary,
  type DefectStatus,
  type ReportedDefect,
} from "./data-layer-defect-library.js";
import { findDefectLibraryElements, renderDefectLibrary } from "./data-layer-defect-library-ui.js";
import { copyStoredDefectForJira } from "./data-layer-defect-library-copy.js";
import {
  captureInspectorReturn,
  restoreInspectorReturn,
  type InspectorReturnSnapshot,
} from "./data-layer-live-inspector-return.js";
import { restoreInspectorReturnUi } from "./data-layer-live-inspector-return-ui.js";
import {
  createEditableTemplate,
  createNewEventEditor,
  discardDraft,
  openPropertyEditor,
  saveAsTemplateCopy,
  saveDraftRevision,
  searchEventTemplates,
  restoreEventTemplateLibrary,
  serializeEventTemplateLibrary,
  setPushDestination,
  setNewEventField,
  setTemplateIdentity,
  setTemplateSchemaAttachment,
  templateIdentityValidation,
  saveNewEvent,
  updateDraftJson,
  EVENT_TEMPLATE_LIBRARY_STORAGE_KEY,
  type EditableEventTemplate,
  type PropertyEditorState,
} from "./data-layer-event-library-editor.js";
import {
  appendImportedTemplates,
  eventLibraryExport,
  eventLibraryImport,
  replaceImportedTemplates,
} from "./data-layer-event-library-transfer.js";
import { clearEventLibrary, deleteEventTemplate } from "./data-layer-event-library-deletion.js";
import { assignableSchemas, createSchema, createSchemaLibraryExport, discardSchemaWorkingDraft, duplicateSchema, duplicateSchemaRevision, exportSchema, importSchema, inspectSchemaRename, proposeSchemaWorkingDraftName, publishSchemaWorkingDraft, restoreSchemaRevisionDraft, reviseSchema, schemaInheritanceConflict, schemaInheritanceError, schemaLibraryExportIdentitySnapshot, schemaRevision, schemaRevisionChoices, searchSchemas, serializeSchemaLibrary, restoreSchemaLibrary, updateSchemaWorkingDraft, validateEvent, validateWithSchema, SCHEMA_LIBRARY_STORAGE_KEY, type SchemaAssignment, type SchemaDefinition, type SchemaWorkingDraft } from "./data-layer-schema-verification.js";
import { revalidateCurrentLiveSession } from "./data-layer-schema-publication-refresh.js";
import { applyAllowedValueExpansion, reviewAllowedValueExpansion, type ReusableAllowedValueRule } from "./data-layer-allowed-value-expansion.js";
import { allowedValueText, openAllowedValueExpansionDialog } from "./data-layer-allowed-value-expansion-ui.js";
import { localRulePromotionAvailability, persistLocalRulePromotion, promoteLocalRule, reviewLocalRulePromotion, type PromotableReusableRule } from "./data-layer-local-rule-promotion.js";
import { createLocalRulePromotionDialog } from "./data-layer-local-rule-promotion-ui.js";
import type { ValidationEvaluation } from "./data-layer-validation-model.js";
import { createGuidedValidationFlow } from "./data-layer-guided-validation-ui.js";
import { assignmentDraftAfterGuidedSave, guidedAssignmentsMatch, type GuidedValueType, type PublishedGuidedValidation } from "./data-layer-guided-validation.js";
import { guidedAttachedRule } from "./data-layer-guided-rule-parameter-integrity.js";
import { guidedPropertyDocument, mergeGuidedDocument } from "./data-layer-guided-nested-property-merge.js";
import { addLiveSchemaPropertyDeclaration, canonicalLivePropertyPath } from "./data-layer-live-schema-property-declaration.js";
import { openLiveSchemaPropertyDeclarationDialog } from "./data-layer-live-schema-property-declaration-ui.js";
import { GUIDED_CONTINUATION_STORAGE_KEY, restoreGuidedContinuationSelections, selectGuidedContinuation, selectedGuidedContinuation, type GuidedContinuationSelections } from "./data-layer-guided-validation-continuation.js";
import { addManualProperty, contextualManualPropertyDefinition, inspectManualProperty, manualPropertyContainerAction, manualPropertyPreview, type ManualArrayItemType, type ManualPropertyDefinition, type ManualPropertyValueType } from "./data-layer-schema-manual-property.js";
import { inspectSpecificIndexRuleTarget } from "./data-layer-schema-nested-path.js";
import { applicablePropertyTypesForRule, builtInRulesForProperty, configuredRuleDetails, createRuleConfiguration, reusableRulesForProperty, ruleConfigurationControls, validateRuleConfiguration, type RuleConfiguration, type SchemaPropertyType, type SchemaRuleType } from "./data-layer-schema-property-rule-picker.js";
import { canonicalRulePropertyPath } from "./data-layer-schema-property-path.js";
import { renderSchemaSpecificationBuilder } from "./data-layer-schema-specification-builder-ui.js";
import { attachRuleToSchemaProperty, schemaPropertyRows } from "./data-layer-schema-rule-property-identity.js";
import { filterAndSortSchemaPropertyRows, type SchemaPropertySortOrder } from "./data-layer-schema-property-view.js";
import { inspectSchemaPropertyRemoval, removeSchemaProperty, undoSchemaPropertyRemoval, type SchemaPropertyRemoval } from "./data-layer-schema-property-removal.js";
import { schemaPropertyCopySource, undoSchemaPropertyCopy, type AppliedSchemaPropertyCopy } from "./data-layer-schema-property-copy.js";
import { renderSchemaPropertyCopyReview } from "./data-layer-schema-property-copy-ui.js";
import { assignmentConditionSuggestions, assignmentDataConditionSummary, duplicateSchemaAssignment, validateAssignmentDataConditions, type AssignmentConditionTarget, type AssignmentDataConditionGroup } from "./data-layer-schema-assignment-data-conditions.js";
import { renderAssignmentDataConditionEditor, type AssignmentDataConditionEditorState } from "./data-layer-schema-assignment-data-conditions-ui.js";
import { canonicalDocumentationPath, resolveEffectiveSchemaDocumentation, setPropertyDocumentation, setSchemaDescription, type SchemaPropertyDocumentation, type SchemaPropertyExample } from "./data-layer-schema-documentation.js";
import { exampleValueFromInput, schemaPropertyExampleChoices, schemaPropertyExampleConflicts, schemaPropertyExampleInputType } from "./data-layer-schema-property-example-values.js";
import { comparisonValueFromInput, conditionGroupAppliesToValue, conditionalRuleSummary, operatorsForConditionType, typedComparisonValue, type ConditionPropertyType, type ConditionalRulePredicate } from "./data-layer-conditional-validation-rules.js";
import { createSequence, readiness, runSequence, type ReplaySequence, type ReplayTemplate } from "./data-layer-sequence-replay.js";
import {
  findSequenceReplayElements,
  renderSequenceReplay,
  setSequenceReplayResult,
} from "./data-layer-sequence-replay-ui.js";
import {
  findEventLibraryEditorElements,
  focusTemplateEditAction,
  focusTemplateRenameAction,
  renderEventLibraryEditor,
  setEventLibraryResult,
  setEventLibraryValidation,
  setPushDestinationValidation,
} from "./data-layer-event-library-editor-ui.js";
import {
  beginTemplateRename,
  renameValidation,
  saveTemplateRename,
  type TemplateRenameDraft,
} from "./data-layer-event-template-renaming.js";
import {
  closePushReview,
  handlePushReviewKeydown,
  openPushReview,
} from "./data-layer-workflow-focus-ui.js";
import {
  pushSavedTemplateToSelectedTarget,
  pushTemplateToSelectedTarget,
  type SelectedTargetPushRequest,
} from "./data-layer-selected-target-push.js";
import {
  createPushDraftReview,
  type PushDraftReview,
} from "./data-layer-push-draft-review.js";
import {
  findPushDraftReviewElements,
  renderPushDraftReview,
} from "./data-layer-push-draft-review-ui.js";
import { createTemplateChangeReview, type TemplateChangeReview } from "./data-layer-template-change-review.js";
import { renderTemplateChangeReview } from "./data-layer-template-change-review-ui.js";
import {
  pushPayloadInPage,
  type PagePushResult,
} from "./data-layer-selected-target-push-page.js";
import { panelEmptyState } from "./panel-empty-states.js";
import {
  findPanelEmptyStateElements,
  renderPanelEmptyState,
} from "./panel-empty-states-ui.js";

const PROJECT_NAME = "my-chrome-utilities";

const app = document.querySelector<HTMLElement>("#app");
const panelRoot = document.querySelector<HTMLElement>("#side-panel-root");
const sidePanelContent = document.querySelector<HTMLElement>("#side-panel-content");
const commandLog = document.querySelector<HTMLElement>("#command-log");
const startTestingButton = document.querySelector<HTMLButtonElement>("#start-data-layer-testing");
const endTestingButton = document.querySelector<HTMLButtonElement>("#end-data-layer-testing");
const historyPathInput = document.querySelector<HTMLInputElement>("#history-path");
const historyPathDisplay = document.querySelector<HTMLElement>(
  "#history-path-display",
);
const historyPathStatus = document.querySelector<HTMLElement>(
  "#history-path-status",
);
const sessionHistoryPath = document.querySelector<HTMLElement>(
  "#session-history-path",
);
const sessionWarning = document.querySelector<HTMLElement>("#session-warning");
const restartObservationButton = document.querySelector<HTMLButtonElement>(
  "#restart-observation",
);
const observationTargetElements = findObservationTargetElements();
const {
  chooseButton: chooseObservationTargetButton,
  browseButton: browseObservationTargetsButton,
  closePickerButton: closeObservationTargetPickerButton,
  picker: observationTargetPicker,
  search: observationTargetSearch,
  list: observationTargetList,
  cancelDetachButton: cancelDetachTargetButton,
  confirmDetachButton: confirmDetachTargetButton,
} = observationTargetElements;
const createKeymapButton =
  document.querySelector<HTMLButtonElement>("#create-keymap");
const updateKeymapButton =
  document.querySelector<HTMLButtonElement>("#update-keymap");
const loadKeymapButton =
  document.querySelector<HTMLButtonElement>("#load-keymap");
const keymapFileInput =
  document.querySelector<HTMLInputElement>("#keymap-file");
const keymapStatus = document.querySelector<HTMLElement>("#keymap-status");
const keymapWarning = document.querySelector<HTMLElement>("#keymap-warning");
const workspaceTabList = document.querySelector<HTMLElement>("#workspace-tabs");
const hotkeyEditorFilter = document.querySelector<HTMLInputElement>("#hotkey-editor-filter");
const hotkeyEditorCommands = document.querySelector<HTMLElement>("#hotkey-editor-commands");
const liveObserverElements = findLiveObserverElements();
const liveSessionSummaryElements = findLiveSessionSummaryElements();
const liveGuidedWorkflowElements = findLiveGuidedWorkflowElements();
const {
  viewList: dataLayerViewList,
  backToEventsButton,
  pauseCaptureButton,
  resumeCaptureButton,
} = liveObserverElements;
const { copyPageUrlButton } = liveSessionSummaryElements;
const liveNotificationController = createLiveNotificationController(
  (message) => renderLiveSessionMessage(liveObserverElements, message),
  (clear, delayMs) => { globalThis.setTimeout(clear, delayMs); },
);
const saveLiveSessionButton = document.querySelector<HTMLButtonElement>("#save-live-session");
const startFreshSessionButton = document.querySelector<HTMLButtonElement>("#start-fresh-session");
const reportMissingEventButton = document.querySelector<HTMLButtonElement>("#report-missing-event");
const saveLiveSessionDialog = document.querySelector<HTMLDialogElement>("#save-live-session-dialog");
const saveLiveSessionForm = document.querySelector<HTMLFormElement>("#save-live-session-form");
const saveLiveSessionHeading = document.querySelector<HTMLElement>("#save-live-session-heading");
const saveLiveSessionName = document.querySelector<HTMLInputElement>("#save-live-session-name");
const saveLiveSessionSummary = document.querySelector<HTMLElement>("#save-live-session-summary");
const confirmSaveLiveSessionButton = document.querySelector<HTMLButtonElement>("#confirm-save-live-session");
const cancelSaveLiveSessionButton = document.querySelector<HTMLButtonElement>("#cancel-save-live-session");
const freshSessionConfirmation = document.querySelector<HTMLDialogElement>("#fresh-session-confirmation");
const freshSessionConfirmationHeading = document.querySelector<HTMLElement>("#fresh-session-confirmation-heading");
const freshSessionConfirmationSummary = document.querySelector<HTMLElement>("#fresh-session-confirmation-summary");
const saveAndStartFreshSessionButton = document.querySelector<HTMLButtonElement>("#save-and-start-fresh-session");
const discardAndStartFreshSessionButton = document.querySelector<HTMLButtonElement>("#discard-and-start-fresh-session");
const cancelFreshSessionButton = document.querySelector<HTMLButtonElement>("#cancel-fresh-session");
const savedSessionLiveBanner = document.querySelector<HTMLElement>("#saved-session-live-banner");
const savedSessionLiveSummary = document.querySelector<HTMLElement>("#saved-session-live-summary");
const savedSessionBackgroundStatus = document.querySelector<HTMLElement>("#saved-session-background-status");
const returnToCurrentLiveFeedButton = document.querySelector<HTMLButtonElement>("#return-to-current-live-feed");
const revalidateSavedSessionButton = document.querySelector<HTMLButtonElement>("#revalidate-saved-session");
const savedSessionValidationComparison = document.querySelector<HTMLElement>("#saved-session-validation-comparison");
const savedSessionSearch = document.querySelector<HTMLInputElement>("#saved-session-search");
const importSavedSessionButton = document.querySelector<HTMLButtonElement>("#import-saved-session");
const savedSessionFileInput = document.querySelector<HTMLInputElement>("#saved-session-file");
const savedSessionList = document.querySelector<HTMLElement>("#saved-session-list");
const savedSessionCount = document.querySelector<HTMLElement>("#saved-session-count");
const savedSessionConfirmation = document.querySelector<HTMLElement>("#saved-session-confirmation");
const cancelSavedSessionDeleteButton = document.querySelector<HTMLButtonElement>("#cancel-saved-session-delete");
const confirmSavedSessionDeleteButton = document.querySelector<HTMLButtonElement>("#confirm-saved-session-delete");
const defectLibraryElements = findDefectLibraryElements();
const defectLibrarySearch = document.querySelector<HTMLInputElement>("#defect-library-search");
const defectLibraryStatus = document.querySelector<HTMLSelectElement>("#defect-library-status");
const defectLibraryType = document.querySelector<HTMLSelectElement>("#defect-library-type");
const defectLibraryEvent = document.querySelector<HTMLInputElement>("#defect-library-event");
const defectLibrarySchema = document.querySelector<HTMLInputElement>("#defect-library-schema");
const defectLibraryPath = document.querySelector<HTMLInputElement>("#defect-library-path");
const eventLibraryEditorElements = findEventLibraryEditorElements();
const libraryDraftSchemaSelector = document.createElement("select");
libraryDraftSchemaSelector.id = "library-draft-schema-selector";
libraryDraftSchemaSelector.setAttribute("aria-label", "Schema for Library draft validation");
const refreshLibraryDraftValidationButton = document.createElement("button");
refreshLibraryDraftValidationButton.id = "refresh-library-draft-validation";
refreshLibraryDraftValidationButton.type = "button";
refreshLibraryDraftValidationButton.textContent = "Refresh validation";
eventLibraryEditorElements.validation?.after(libraryDraftSchemaSelector, refreshLibraryDraftValidationButton);
const liveEventsEmptyState = document.querySelector<HTMLElement>("#live-events-empty-state");
const liveSourceErrorState = document.querySelector<HTMLElement>("#live-source-error-state");
const templateEmptyStateElements = findPanelEmptyStateElements(
  "#event-template-empty-state",
  "#event-template-empty-recovery",
);
const templateEmptyRecovery = templateEmptyStateElements.recovery;
const exportEventLibraryButton = document.querySelector<HTMLButtonElement>("#export-event-library");
const importEventLibraryButton = document.querySelector<HTMLButtonElement>("#import-event-library");
const eventLibraryFile = document.querySelector<HTMLInputElement>("#event-library-file");
const eventLibraryTransferResult = document.querySelector<HTMLElement>("#event-library-transfer-result");
const clearEventLibraryButton = document.querySelector<HTMLButtonElement>("#clear-event-library");
const eventLibraryDeleteReview = document.querySelector<HTMLDialogElement>("#event-library-delete-review");
const eventLibraryDeleteReviewHeading = document.querySelector<HTMLElement>("#event-library-delete-review-heading");
const eventLibraryDeleteReviewSummary = document.querySelector<HTMLElement>("#event-library-delete-review-summary");
const confirmEventLibraryDeleteButton = document.querySelector<HTMLButtonElement>("#confirm-event-library-delete");
const cancelEventLibraryDeleteButton = document.querySelector<HTMLButtonElement>("#cancel-event-library-delete");
const eventLibraryImportReview = document.querySelector<HTMLDialogElement>("#event-library-import-review");
const eventLibraryImportReviewHeading = document.querySelector<HTMLElement>("#event-library-import-review-heading");
const eventLibraryImportReviewSummary = document.querySelector<HTMLElement>("#event-library-import-review-summary");
const replaceEventLibraryButton = document.querySelector<HTMLButtonElement>("#replace-event-library");
const appendEventLibraryButton = document.querySelector<HTMLButtonElement>("#append-event-library");
const cancelEventLibraryImportButton = document.querySelector<HTMLButtonElement>("#cancel-event-library-import");
const savedSessionEmptyState = document.querySelector<HTMLElement>("#saved-session-empty-state");
const schemaEmptyState = document.querySelector<HTMLElement>("#schema-empty-state");
const sequenceEmptyState = document.querySelector<HTMLElement>("#sequence-empty-state");
const {
  search: eventTemplateSearch,
  addNewButton,
  templateName: eventTemplateName,
  eventName: eventTemplateEventName,
  source: eventTemplateSource,
  json: eventTemplateJson,
  pushDestination: eventTemplatePushDestination,
  saveRevisionButton: saveTemplateRevisionButton,
  saveCopyButton: saveTemplateCopyButton,
  pushDraftButton: pushTemplateDraftButton,
  discardDraftButton: discardTemplateDraftButton,
  closeEditorButton: closeTemplateEditorButton,
  backToCapturedEventButton,
} = eventLibraryEditorElements;
const schemaSearch = document.querySelector<HTMLInputElement>("#schema-search");
const liveEventQuery = document.querySelector<HTMLElement>("#live-event-query");
const schemaSubviews = Array.from(document.querySelectorAll<HTMLButtonElement>("#schema-subviews [role=tab]"));
const schemaPanels = Array.from(document.querySelectorAll<HTMLElement>("#schema-master, #schema-rule-library, #schema-assignments"));
const schemaEditor = document.querySelector<HTMLElement>("#schema-editor");
const schemaDetail = document.querySelector<HTMLElement>("#schema-detail");
const schemaDetailEmpty = document.querySelector<HTMLElement>("#schema-detail-empty");
const schemaEditorName = document.querySelector<HTMLInputElement>("#schema-editor-name");
const schemaEditorNameAssistance = document.createElement("output"); schemaEditorNameAssistance.id = "schema-editor-name-assistance"; schemaEditorNameAssistance.setAttribute("aria-live", "polite"); schemaEditorName?.setAttribute("aria-describedby", schemaEditorNameAssistance.id); schemaEditorName?.after(schemaEditorNameAssistance);
const schemaEditorDescription = document.querySelector<HTMLTextAreaElement>("#schema-editor-description");
const saveSchemaDescriptionButton = document.querySelector<HTMLButtonElement>("#save-schema-description");
const schemaDescriptionOrigin = document.querySelector<HTMLElement>("#schema-description-origin");
const schemaEditorTarget = document.querySelector<HTMLSelectElement>("#schema-editor-target");
const saveSchemaButton = document.querySelector<HTMLButtonElement>("#save-schema");
const saveSchemaReason = document.querySelector<HTMLElement>("#save-schema-reason");
const schemaRevisionReview = document.querySelector<HTMLDialogElement>("#schema-revision-review");
const schemaRevisionReviewSummary = document.querySelector<HTMLElement>("#schema-revision-review-summary");
const confirmSchemaRevisionButton = document.querySelector<HTMLButtonElement>("#confirm-schema-revision");
const cancelSchemaRevisionButton = document.querySelector<HTMLButtonElement>("#cancel-schema-revision");
const schemaCloseReview = document.querySelector<HTMLDialogElement>("#close-schema-editor-review");
const schemaCloseReviewSummary = document.querySelector<HTMLElement>("#schema-close-review-summary");
const discardSchemaDraftButton = document.querySelector<HTMLButtonElement>("#discard-schema-draft");
const keepEditingSchemaButton = document.querySelector<HTMLButtonElement>("#keep-editing-schema");
const closeSchemaEditorButton = document.querySelector<HTMLButtonElement>("#close-schema-editor");
const saveAndCloseSchemaButton = document.querySelector<HTMLButtonElement>("#save-and-close-schema");
const saveSchemaCloseReviewButton = document.querySelector<HTMLButtonElement>("#save-schema-close-review");
const discardWorkingSchemaDraftButton = document.querySelector<HTMLButtonElement>("#discard-working-schema-draft");
const schemaRevisionSelector = document.querySelector<HTMLSelectElement>("#schema-revision-selector");
const schemaRevisionComparison = document.querySelector<HTMLElement>("#schema-revision-comparison");
const duplicateSchemaRevisionButton = document.querySelector<HTMLButtonElement>("#duplicate-schema-revision");
const restoreSchemaRevisionButton = document.querySelector<HTMLButtonElement>("#restore-schema-revision");
const addSchemaPropertyButton = document.querySelector<HTMLButtonElement>("#add-schema-property");
const schemaPropertyViewControls = document.createElement("div"); schemaPropertyViewControls.id = "schema-property-view-controls";
const schemaPropertyFilterLabel = document.createElement("label"); schemaPropertyFilterLabel.htmlFor = "schema-property-filter"; schemaPropertyFilterLabel.textContent = "Filter properties";
const schemaPropertyFilter = document.createElement("input"); schemaPropertyFilter.id = "schema-property-filter"; schemaPropertyFilter.type = "search";
const schemaPropertySortLabel = document.createElement("label"); schemaPropertySortLabel.htmlFor = "schema-property-sort"; schemaPropertySortLabel.textContent = "Sort properties";
const schemaPropertySort = document.createElement("select"); schemaPropertySort.id = "schema-property-sort";
schemaPropertySort.append(
  Object.assign(document.createElement("option"), { value:"schema", textContent:"Schema order" }),
  Object.assign(document.createElement("option"), { value:"name-asc", textContent:"Name A-Z" }),
  Object.assign(document.createElement("option"), { value:"name-desc", textContent:"Name Z-A" }),
);
const schemaPropertyResultStatus = document.createElement("output"); schemaPropertyResultStatus.id = "schema-property-result-status"; schemaPropertyResultStatus.setAttribute("aria-live", "polite");
const schemaPropertyEmpty = document.createElement("div"); schemaPropertyEmpty.id = "schema-property-empty"; schemaPropertyEmpty.hidden = true;
const schemaPropertyEmptyMessage = document.createElement("p");
const clearSchemaPropertyFilter = document.createElement("button"); clearSchemaPropertyFilter.type = "button"; clearSchemaPropertyFilter.textContent = "Clear filter";
schemaPropertyEmpty.append(schemaPropertyEmptyMessage, clearSchemaPropertyFilter);
schemaPropertyViewControls.append(schemaPropertyFilterLabel, schemaPropertyFilter, schemaPropertySortLabel, schemaPropertySort, schemaPropertyResultStatus);
addSchemaPropertyButton?.before(schemaPropertyViewControls);
const schemaPropertyTree = document.createElement("ul");
schemaPropertyTree.id = "schema-property-tree";
addSchemaPropertyButton?.after(schemaPropertyTree);
schemaPropertyTree.before(schemaPropertyEmpty);
const schemaPropertyRemovalFeedback = document.createElement("output"); schemaPropertyRemovalFeedback.id = "schema-property-removal-feedback"; schemaPropertyRemovalFeedback.setAttribute("aria-live", "polite");
const undoSchemaPropertyRemovalButton = document.createElement("button"); undoSchemaPropertyRemovalButton.type = "button"; undoSchemaPropertyRemovalButton.textContent = "Undo"; undoSchemaPropertyRemovalButton.hidden = true;
schemaPropertyTree.after(schemaPropertyRemovalFeedback, undoSchemaPropertyRemovalButton);
schemaPropertyFilter.addEventListener("input", () => renderSchemaDraft());
schemaPropertySort.addEventListener("change", () => renderSchemaDraft());
clearSchemaPropertyFilter.addEventListener("click", () => {
  schemaPropertyFilter.value = "";
  renderSchemaDraft();
  schemaPropertyFilter.focus({ preventScroll:true });
});
const schemaPropertyCopyFeedback = document.createElement("output"); schemaPropertyCopyFeedback.id = "schema-property-copy-feedback"; schemaPropertyCopyFeedback.setAttribute("aria-live", "polite");
const undoSchemaPropertyCopyButton = document.createElement("button"); undoSchemaPropertyCopyButton.type = "button"; undoSchemaPropertyCopyButton.textContent = "Undo property copy"; undoSchemaPropertyCopyButton.hidden = true;
schemaPropertyRemovalFeedback.after(schemaPropertyCopyFeedback, undoSchemaPropertyCopyButton);
const schemaPropertyCopyDialog = document.createElement("dialog"); schemaPropertyCopyDialog.id = "schema-property-copy-dialog"; document.body.append(schemaPropertyCopyDialog);
const schemaPropertyRemovalDialog = document.createElement("dialog"); schemaPropertyRemovalDialog.id = "schema-property-removal-dialog"; schemaPropertyRemovalDialog.setAttribute("aria-labelledby", "schema-property-removal-heading");
const schemaPropertyRemovalHeading = document.createElement("h4"); schemaPropertyRemovalHeading.id = "schema-property-removal-heading"; schemaPropertyRemovalHeading.tabIndex = -1; schemaPropertyRemovalHeading.textContent = "Remove property?";
const schemaPropertyRemovalSummary = document.createElement("output"); schemaPropertyRemovalSummary.id = "schema-property-removal-summary"; schemaPropertyRemovalSummary.setAttribute("aria-live", "polite");
const confirmSchemaPropertyRemovalButton = document.createElement("button"); confirmSchemaPropertyRemovalButton.type = "button"; confirmSchemaPropertyRemovalButton.textContent = "Remove property";
const cancelSchemaPropertyRemovalButton = document.createElement("button"); cancelSchemaPropertyRemovalButton.type = "button"; cancelSchemaPropertyRemovalButton.textContent = "Cancel";
schemaPropertyRemovalDialog.append(schemaPropertyRemovalHeading, schemaPropertyRemovalSummary, confirmSchemaPropertyRemovalButton, cancelSchemaPropertyRemovalButton); document.body.append(schemaPropertyRemovalDialog);
let selectedSchemaPropertyPath = "example";
const expandedSchemaPropertyRulePaths = new Set<string>();
let pendingSchemaPropertyRemoval: { path:string; trigger:HTMLButtonElement } | undefined;
let lastSchemaPropertyRemoval: SchemaPropertyRemoval | undefined;
let lastSchemaPropertyCopy: AppliedSchemaPropertyCopy | undefined;
let pendingSchemaDocumentationRemoval: { path:string; trigger:HTMLElement } | undefined;
const schemaDocumentationRemovalDialog = document.createElement("dialog"); schemaDocumentationRemovalDialog.id = "schema-documentation-removal-dialog";
const schemaDocumentationRemovalHeading = document.createElement("h4"); schemaDocumentationRemovalHeading.textContent = "Remove property documentation?"; schemaDocumentationRemovalHeading.tabIndex = -1;
const schemaDocumentationRemovalSummary = document.createElement("p");
const confirmSchemaDocumentationRemoval = document.createElement("button"); confirmSchemaDocumentationRemoval.type = "button"; confirmSchemaDocumentationRemoval.textContent = "Remove documentation";
const cancelSchemaDocumentationRemoval = document.createElement("button"); cancelSchemaDocumentationRemoval.type = "button"; cancelSchemaDocumentationRemoval.textContent = "Cancel";
schemaDocumentationRemovalDialog.append(schemaDocumentationRemovalHeading, schemaDocumentationRemovalSummary, confirmSchemaDocumentationRemoval, cancelSchemaDocumentationRemoval); document.body.append(schemaDocumentationRemovalDialog);
let specificIndexArrayPath: string | undefined;
let specificIndexTrigger: HTMLButtonElement | undefined;
const schemaSpecificIndexDialog = document.createElement("dialog"); schemaSpecificIndexDialog.id = "schema-specific-index-dialog";
const schemaSpecificIndexForm = document.createElement("form");
const schemaSpecificIndexHeading = document.createElement("h4"); schemaSpecificIndexHeading.textContent = "Add specific index rule";
const schemaSpecificIndexLabel = document.createElement("label"); schemaSpecificIndexLabel.htmlFor = "schema-specific-index"; schemaSpecificIndexLabel.textContent = "Zero-based array index";
const schemaSpecificIndex = document.createElement("input"); schemaSpecificIndex.id = "schema-specific-index"; schemaSpecificIndex.type = "number"; schemaSpecificIndex.min = "0"; schemaSpecificIndex.step = "1";
const schemaSpecificIndexAssistance = document.createElement("output"); schemaSpecificIndexAssistance.textContent = "Enter a non-negative zero-based index";
const confirmSchemaSpecificIndex = document.createElement("button"); confirmSchemaSpecificIndex.type = "submit"; confirmSchemaSpecificIndex.textContent = "Choose rule"; confirmSchemaSpecificIndex.disabled = true;
const cancelSchemaSpecificIndex = document.createElement("button"); cancelSchemaSpecificIndex.type = "button"; cancelSchemaSpecificIndex.textContent = "Cancel";
schemaSpecificIndexForm.append(schemaSpecificIndexHeading, schemaSpecificIndexLabel, schemaSpecificIndex, schemaSpecificIndexAssistance, confirmSchemaSpecificIndex, cancelSchemaSpecificIndex);
schemaSpecificIndexDialog.append(schemaSpecificIndexForm); document.body.append(schemaSpecificIndexDialog);
const schemaManualPropertyDialog = document.createElement("dialog");
schemaManualPropertyDialog.id = "schema-manual-property-dialog";
schemaManualPropertyDialog.setAttribute("aria-labelledby", "schema-manual-property-heading");
const schemaManualPropertyForm = document.createElement("form"); schemaManualPropertyForm.method = "dialog";
const schemaManualPropertyHeading = document.createElement("h4"); schemaManualPropertyHeading.id = "schema-manual-property-heading"; schemaManualPropertyHeading.textContent = "Add property";
const schemaManualPropertyPathLabel = document.createElement("label"); schemaManualPropertyPathLabel.htmlFor = "schema-manual-property-path"; schemaManualPropertyPathLabel.textContent = "Property path";
const schemaManualPropertyPath = document.createElement("input"); schemaManualPropertyPath.id = "schema-manual-property-path";
const schemaManualPropertyParentContext = document.createElement("output"); schemaManualPropertyParentContext.id = "schema-manual-property-parent-context"; schemaManualPropertyParentContext.hidden = true;
const schemaManualPropertyChildNameLabel = document.createElement("label"); schemaManualPropertyChildNameLabel.htmlFor = "schema-manual-property-child-name"; schemaManualPropertyChildNameLabel.textContent = "Child property name"; schemaManualPropertyChildNameLabel.hidden = true;
const schemaManualPropertyChildName = document.createElement("input"); schemaManualPropertyChildName.id = "schema-manual-property-child-name"; schemaManualPropertyChildName.hidden = true;
const schemaManualPropertyTypeLabel = document.createElement("label"); schemaManualPropertyTypeLabel.htmlFor = "schema-manual-property-type"; schemaManualPropertyTypeLabel.textContent = "Value type";
const schemaManualPropertyType = document.createElement("select"); schemaManualPropertyType.id = "schema-manual-property-type";
schemaManualPropertyType.replaceChildren(...(["string", "number", "boolean", "object", "array"] as const).map((type) => Object.assign(document.createElement("option"), { value:type, textContent:type })));
const schemaManualArrayTypeGroup = document.createElement("label"); schemaManualArrayTypeGroup.htmlFor = "schema-manual-array-item-type"; schemaManualArrayTypeGroup.textContent = "Array item type ";
const schemaManualArrayItemType = document.createElement("select"); schemaManualArrayItemType.id = "schema-manual-array-item-type";
schemaManualArrayItemType.replaceChildren(Object.assign(document.createElement("option"), { value:"", textContent:"Select item type" }), ...(["string", "number", "boolean", "object"] as const).map((type) => Object.assign(document.createElement("option"), { value:type, textContent:type })));
schemaManualArrayTypeGroup.append(schemaManualArrayItemType);
const schemaManualPropertyPreview = document.createElement("output"); schemaManualPropertyPreview.id = "schema-manual-property-preview"; schemaManualPropertyPreview.setAttribute("aria-live", "polite");
const schemaManualPropertyAssistance = document.createElement("output"); schemaManualPropertyAssistance.id = "schema-manual-property-assistance"; schemaManualPropertyAssistance.setAttribute("aria-live", "polite");
const goToExistingSchemaPropertyButton = document.createElement("button"); goToExistingSchemaPropertyButton.type = "button"; goToExistingSchemaPropertyButton.hidden = true;
const confirmSchemaManualPropertyButton = document.createElement("button"); confirmSchemaManualPropertyButton.type = "submit"; confirmSchemaManualPropertyButton.textContent = "Add property";
const cancelSchemaManualPropertyButton = document.createElement("button"); cancelSchemaManualPropertyButton.type = "button"; cancelSchemaManualPropertyButton.textContent = "Cancel";
schemaManualPropertyForm.append(schemaManualPropertyHeading, schemaManualPropertyParentContext, schemaManualPropertyPathLabel, schemaManualPropertyPath, schemaManualPropertyChildNameLabel, schemaManualPropertyChildName, schemaManualPropertyTypeLabel, schemaManualPropertyType, schemaManualArrayTypeGroup, schemaManualPropertyPreview, schemaManualPropertyAssistance, goToExistingSchemaPropertyButton, confirmSchemaManualPropertyButton, cancelSchemaManualPropertyButton);
schemaManualPropertyDialog.append(schemaManualPropertyForm); document.body.append(schemaManualPropertyDialog);
let pendingManualPropertyContext: { parentPath:string; trigger:HTMLButtonElement } | undefined;
let schemaRulePickerPath: string | undefined;
let schemaRulePickerTrigger: HTMLButtonElement | undefined;
let schemaRuleConfiguration: RuleConfiguration | undefined;
const schemaPropertyRulePicker = document.createElement("dialog");
schemaPropertyRulePicker.id = "schema-property-rule-picker";
schemaPropertyRulePicker.setAttribute("aria-labelledby", "schema-property-rule-picker-heading");
document.body.append(schemaPropertyRulePicker);
const localRulePromotionDialog = createLocalRulePromotionDialog();
let pendingLocalRulePromotion: { trigger:HTMLButtonElement; propertyPath:string; sourceRuleId:string; scrollTop:number } | undefined;
const createSchemaAssignmentButton = document.querySelector<HTMLButtonElement>("#create-schema-assignment");
const createSchemaRuleButton = document.querySelector<HTMLButtonElement>("#create-schema-rule");
const schemaRuleEditor = document.querySelector<HTMLElement>("#schema-rule-editor");
const schemaRuleName = document.querySelector<HTMLInputElement>("#schema-rule-name");
const schemaRuleParameters = document.querySelector<HTMLInputElement>("#schema-rule-parameters");
const schemaRuleTypes = document.querySelector<HTMLSelectElement>("#schema-rule-types");
schemaRuleTypes?.replaceChildren(...(["string", "number", "array", "object", "boolean"] as const).map((type) => Object.assign(document.createElement("option"), { value:type, textContent:type })));
const schemaRuleOperator = document.querySelector<HTMLSelectElement>("#schema-rule-operator");
const schemaRuleSeverity = document.querySelector<HTMLSelectElement>("#schema-rule-severity");
const schemaRuleMessage = document.querySelector<HTMLInputElement>("#schema-rule-message");
const schemaRuleExamples = document.querySelector<HTMLInputElement>("#schema-rule-examples");
const saveSchemaRuleButton = document.querySelector<HTMLButtonElement>("#save-schema-rule");
const schemaRuleList = document.querySelector<HTMLElement>("#schema-rule-list");
const schemaRuleSearch = document.querySelector<HTMLInputElement>("#schema-rule-search");
const schemaRuleAttachments = document.querySelector<HTMLSelectElement>("#schema-rule-attachments");
const updateSchemaRuleAttachments = document.querySelector<HTMLInputElement>("#update-schema-rule-attachments");
const schemaRuleUpgradeReview = document.querySelector<HTMLDialogElement>("#schema-rule-upgrade-review");
const schemaRuleUpgradeReviewSummary = document.querySelector<HTMLElement>("#schema-rule-upgrade-review-summary");
const confirmSchemaRuleUpgradeButton = document.querySelector<HTMLButtonElement>("#confirm-schema-rule-upgrade");
const cancelSchemaRuleUpgradeButton = document.querySelector<HTMLButtonElement>("#cancel-schema-rule-upgrade");
const schemaRuleRevisionReview = document.createElement("dialog");
schemaRuleRevisionReview.id = "schema-rule-revision-review";
const schemaRuleRevisionReviewSummary = document.createElement("output");
schemaRuleRevisionReviewSummary.id = "schema-rule-revision-review-summary";
const confirmSchemaRuleRevisionButton = document.createElement("button");
confirmSchemaRuleRevisionButton.id = "confirm-schema-rule-revision-review"; confirmSchemaRuleRevisionButton.type = "button"; confirmSchemaRuleRevisionButton.textContent = "Save rule revision";
const cancelSchemaRuleRevisionButton = document.createElement("button");
cancelSchemaRuleRevisionButton.type = "button"; cancelSchemaRuleRevisionButton.textContent = "Cancel";
schemaRuleRevisionReview.append(Object.assign(document.createElement("h4"), { textContent:"Review rule revision" }), schemaRuleRevisionReviewSummary, confirmSchemaRuleRevisionButton, cancelSchemaRuleRevisionButton);
document.body.append(schemaRuleRevisionReview);
const exportSchemaRulesButton = document.querySelector<HTMLButtonElement>("#export-schema-rules");
const schemaRuleDeleteReview = document.querySelector<HTMLDialogElement>("#schema-rule-delete-review");
const schemaRuleDeleteReviewSummary = document.querySelector<HTMLElement>("#schema-rule-delete-review-summary");
const confirmSchemaRuleDeleteButton = document.querySelector<HTMLButtonElement>("#confirm-schema-rule-delete");
const cancelSchemaRuleDeleteButton = document.querySelector<HTMLButtonElement>("#cancel-schema-rule-delete");
const schemaAssignmentEditor = document.querySelector<HTMLElement>("#schema-assignment-editor");
const schemaAssignmentSource = document.querySelector<HTMLInputElement>("#schema-assignment-source");
const schemaAssignmentEvent = document.querySelector<HTMLInputElement>("#schema-assignment-event");
const schemaAssignmentPriority = document.querySelector<HTMLInputElement>("#schema-assignment-priority");
const saveSchemaAssignmentButton = document.querySelector<HTMLButtonElement>("#save-schema-assignment");
const schemaAssignmentTarget = document.querySelector<HTMLSelectElement>("#schema-assignment-target");
const schemaAssignmentDomain = document.querySelector<HTMLInputElement>("#schema-assignment-domain");
const schemaAssignmentPathname = document.querySelector<HTMLInputElement>("#schema-assignment-pathname");
const schemaAssignmentVersionPolicy = document.querySelector<HTMLSelectElement>("#schema-assignment-version-policy");
const schemaAssignmentEnabled = document.querySelector<HTMLInputElement>("#schema-assignment-enabled");
const schemaAssignmentList = document.querySelector<HTMLElement>("#schema-assignment-list");
const schemaAssignmentConflicts = document.querySelector<HTMLElement>("#schema-assignment-conflicts");
const schemaAssignmentSchema = document.querySelector<HTMLSelectElement>("#schema-assignment-schema");
const schemaAssignmentDataConditions = document.createElement("section");
schemaAssignmentDataConditions.id = "schema-assignment-data-conditions";
schemaAssignmentDataConditions.setAttribute("aria-label", "Data layer conditions");
if (schemaAssignmentEditor && saveSchemaAssignmentButton) schemaAssignmentEditor.insertBefore(schemaAssignmentDataConditions, saveSchemaAssignmentButton);
const pushDraftReview = document.querySelector<HTMLDialogElement>("#push-draft-review");
const pushDraftReviewHeading = document.querySelector<HTMLElement>("#push-draft-review-heading");
const pushDraftReviewSummary = document.querySelector<HTMLElement>("#push-draft-review-summary");
const pushDraftReviewElements = findPushDraftReviewElements();
const confirmPushDraftButton = document.querySelector<HTMLButtonElement>("#confirm-push-draft");
const cancelPushDraftButton = document.querySelector<HTMLButtonElement>("#cancel-push-draft");
const revisionChangeReview = document.querySelector<HTMLDialogElement>("#revision-change-review");
const revisionChangeReviewHeading = document.querySelector<HTMLElement>("#revision-change-review-heading");
const confirmRevisionChangeButton = document.querySelector<HTMLButtonElement>("#confirm-revision-change");
const cancelRevisionChangeButton = document.querySelector<HTMLButtonElement>("#cancel-revision-change");
const closeTemplateEditorConfirmation = document.querySelector<HTMLElement>("#close-template-editor-confirmation");
const closeTemplateEditorSummary = document.querySelector<HTMLElement>("#close-template-editor-summary");
const keepEditingTemplateButton = document.querySelector<HTMLButtonElement>("#keep-editing-template");
const saveAndCloseTemplateButton = document.querySelector<HTMLButtonElement>("#save-and-close-template");
const discardAndCloseTemplateButton = document.querySelector<HTMLButtonElement>("#discard-and-close-template");
const templateRenameDialog = document.querySelector<HTMLDialogElement>("#event-template-rename");
const templateRenameHeading = document.querySelector<HTMLElement>("#event-template-rename-heading");
const templateRenameName = document.querySelector<HTMLInputElement>("#event-template-rename-name");
const templateRenameEventName = document.querySelector<HTMLInputElement>("#event-template-rename-event-name");
const templateRenameNameError = document.querySelector<HTMLElement>("#event-template-rename-name-error");
const templateRenameEventNameError = document.querySelector<HTMLElement>("#event-template-rename-event-name-error");
const saveTemplateNamesButton = document.querySelector<HTMLButtonElement>("#save-template-names");
const cancelTemplateRenameButton = document.querySelector<HTMLButtonElement>("#cancel-template-rename");
const templateRenameReview = document.querySelector<HTMLDialogElement>("#event-template-rename-review");
const templateRenameReviewHeading = document.querySelector<HTMLElement>("#event-template-rename-review-heading");
const templateRenameReviewSummary = document.querySelector<HTMLElement>("#event-template-rename-review-summary");
const confirmTemplateRenameButton = document.querySelector<HTMLButtonElement>("#confirm-template-rename");
const cancelTemplateRenameReviewButton = document.querySelector<HTMLButtonElement>("#cancel-template-rename-review");
const createSchemaButton = document.querySelector<HTMLButtonElement>("#create-schema");
const importSchemaButton = document.querySelector<HTMLButtonElement>("#import-schema");
const schemaLibraryImportFile = document.querySelector<HTMLInputElement>("#schema-library-import-file");
const exportSchemaButton = document.querySelector<HTMLButtonElement>("#export-schema");
const recheckSchemaValidationButton = document.querySelector<HTMLButtonElement>("#recheck-schema-validation");
const schemaValidationIssues = document.querySelector<HTMLElement>("#schema-validation-issues");
const schemaValidationRecordList = document.querySelector<HTMLElement>("#schema-validation-record-list");
const schemaInheritanceProvenance = document.querySelector<HTMLElement>("#schema-inheritance-provenance");
const schemaRuleOverrides = document.querySelector<HTMLElement>("#schema-rule-overrides");
const schemaRuleOverrideList = document.querySelector<HTMLElement>("#schema-rule-override-list");
const schemaInheritedRuleGroups = document.createElement("section");
schemaInheritedRuleGroups.id = "schema-inherited-rule-groups";
schemaInheritedRuleGroups.setAttribute("aria-label", "Inherited rule states");
const schemaEffectiveRulePreview = document.createElement("section");
schemaEffectiveRulePreview.id = "schema-effective-rule-preview";
schemaEffectiveRulePreview.setAttribute("aria-label", "Effective-rule preview");
schemaRuleOverrides?.after(schemaInheritedRuleGroups, schemaEffectiveRulePreview);
const schemaImportReview = document.querySelector<HTMLDialogElement>("#schema-import-review");
const schemaImportReviewSummary = document.querySelector<HTMLElement>("#schema-import-review-summary");
const replaceSchemaLibraryButton = document.querySelector<HTMLButtonElement>("#replace-schema-library");
const appendSchemaLibraryButton = document.querySelector<HTMLButtonElement>("#append-schema-library");
const cancelSchemaImportButton = document.querySelector<HTMLButtonElement>("#cancel-schema-import");
const schemaDeleteReview = document.querySelector<HTMLDialogElement>("#schema-delete-review");
const schemaDeleteReviewSummary = document.querySelector<HTMLElement>("#schema-delete-review-summary");
const confirmSchemaDeleteButton = document.querySelector<HTMLButtonElement>("#confirm-schema-delete");
const cancelSchemaDeleteButton = document.querySelector<HTMLButtonElement>("#cancel-schema-delete");
const schemaEditorParent = document.querySelector<HTMLSelectElement>("#schema-editor-parent");
const schemaOnlyDeclaredProperties = document.querySelector<HTMLInputElement>("#schema-only-declared-properties");
const schemaSpecificationBuilder = document.createElement("section"); schemaSpecificationBuilder.id = "schema-specification-builder"; schemaSpecificationBuilder.hidden = true; schemaDetail?.append(schemaSpecificationBuilder);
const buildSpecificationButton = document.createElement("button"); buildSpecificationButton.type = "button"; buildSpecificationButton.textContent = "Build specification"; buildSpecificationButton.id = "build-specification"; schemaEditor?.prepend(buildSpecificationButton);
const buildHistoricalSpecificationButton = document.createElement("button"); buildHistoricalSpecificationButton.type = "button"; buildHistoricalSpecificationButton.textContent = "Build specification"; buildHistoricalSpecificationButton.id = "build-historical-specification"; restoreSchemaRevisionButton?.after(buildHistoricalSpecificationButton);
const schemaCount = document.querySelector<HTMLElement>("#schema-count");
const schemaList = document.querySelector<HTMLElement>("#schema-list");
const schemaResult = document.querySelector<HTMLElement>("#schema-result");
const guidedValidationRoot = document.querySelector<HTMLElement>("#guided-validation-flow");
const sequenceReplayElements = findSequenceReplayElements();
const allCommands = [...listCommands()];
let activeHotkeyKeymap: HotkeyKeymap =
  loadStoredHotkeyKeymap() ?? blankHotkeyKeymap(allCommands);
let pendingHotkeySequence: string[] = [];
let dataLayerSessionState: DataLayerSessionState = restoreSession();
let savedEventFeedFilterLibrary: SavedEventFeedFilterLibrary = restoreSavedEventFeedFilterLibrary(localStorage.getItem(SAVED_EVENT_FEED_FILTER_STORAGE_KEY));
let savedEventFeedFilterFeedback = "";
let dataLayerObserverState: DataLayerHistoryObserverState = {
  pageObject: samplePageObject(),
  observedEntries: [],
  sourceEvents: [],
};
let stopLiveHistoryPushCapture: StopLiveHistoryPushCapture = () => {};
let liveHistoryActivationState = initialObservationActivationState;
let presentedSourceEventCount = 0;
let observationRefreshTimeoutId: number | undefined;
let observationRefreshState = initialObservationRefreshState;
let liveObserverState: LiveObserverState = createLiveObserverState({
  pageUrl: globalThis.location.href,
  sources: [{ id: "event-history", name: "Event history", status: "Connected" }],
});
liveObserverState = restoreFreshSessionLiveObserver(liveObserverState, dataLayerSessionState);
let restoredSavedEventFeedWorkingView = false;
const restoredSavedEventFeedView = restoreSavedEventFeedWorkingView(
  localStorage.getItem(SAVED_EVENT_FEED_FILTER_WORKING_STORAGE_KEY),
  dataLayerSessionState.session?.id,
  savedEventFeedFilterLibrary,
);
if (restoredSavedEventFeedView) {
  liveObserverState = {
    ...liveObserverState,
    query:restoredSavedEventFeedView.query,
    ...(restoredSavedEventFeedView.activeFilterId ? { savedFilterId:restoredSavedEventFeedView.activeFilterId } : {}),
  };
  restoredSavedEventFeedWorkingView = true;
}
if (!restoredSavedEventFeedWorkingView && savedEventFeedFilterLibrary.defaultFilterId) {
  const defaultFilter = savedEventFeedFilterLibrary.filters.find(({ id }) => id === savedEventFeedFilterLibrary.defaultFilterId);
  if (defaultFilter) liveObserverState = { ...liveObserverState, query:applySavedEventFeedFilter({ conditions:[] }, defaultFilter), savedFilterId:defaultFilter.id };
}
let inspectorReturnSnapshot: InspectorReturnSnapshot | undefined;
const liveInspectorPresentation = new Map<string, LiveInspectorPresentationSnapshot>();
let savedSessionLibrary: SavedSessionLibrary = restoreSavedSessionLibrary(localStorage.getItem(SAVED_SESSION_LIBRARY_STORAGE_KEY));
let defectLibrary: DefectLibrary = restoreDefectLibrary(localStorage.getItem(DEFECT_LIBRARY_STORAGE_KEY));
let selectedDefectId: string | undefined;
let defectReturn: { eventId:string; issueIndex:number; listScrollTop:number } | undefined;
let defectListScrollTop = 0;
let savedSessionLiveFeed: SavedSessionLiveFeed | undefined = restoreSavedSessionLiveFeed(localStorage.getItem(SAVED_SESSION_LIVE_FEED_STORAGE_KEY), savedSessionLibrary);
if (savedSessionLiveFeed) liveObserverState = savedSessionLiveFeed.savedView;
let archivedSavedSession: ArchivedSession | undefined;
let pendingSessionSaveDraft: SessionSaveDraft | undefined;
let startFreshAfterSessionSave = false;
const SAVED_THROUGH_EVENT_COUNT_STORAGE_KEY = "my-chrome-utilities.saved-through-event-count.v1";
let savedThroughEventCount = Math.max(0, Number(localStorage.getItem(SAVED_THROUGH_EVENT_COUNT_STORAGE_KEY)) || 0);
let eventTemplates: EditableEventTemplate[] = restoreEventTemplateLibrary(localStorage.getItem(EVENT_TEMPLATE_LIBRARY_STORAGE_KEY));
let propertyEditorState: PropertyEditorState | undefined;
let pendingPushDraftReview: PushDraftReview | undefined;
let pendingRevisionChangeReview: { editor: PropertyEditorState; review: TemplateChangeReview } | undefined;
let pendingTemplateRename: { editor: PropertyEditorState; draft: TemplateRenameDraft; templateId: string } | undefined;
let pendingEventLibraryImport: ReturnType<typeof eventLibraryImport> | undefined;
let replaceEventLibraryArmed = false;
let pendingEventLibraryDeletion: { id?: string; name?: string; count: number } | undefined;
let templateEditorReturnTemplateId: string | undefined;
let savedInspectorTemplateId: string | undefined;
const storedSchemaLibrary = localStorage.getItem(SCHEMA_LIBRARY_STORAGE_KEY);
let schemas: SchemaDefinition[] = restoreSchemaLibrary(storedSchemaLibrary);
const restoredSchemaLibrary = serializeSchemaLibrary(schemas);
if (storedSchemaLibrary && restoredSchemaLibrary !== storedSchemaLibrary) {
  localStorage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, restoredSchemaLibrary);
}
let guidedContinuationSelections: GuidedContinuationSelections = restoreGuidedContinuationSelections(localStorage.getItem(GUIDED_CONTINUATION_STORAGE_KEY));
let guidedPropertyReturn: { eventId:string; path:string; expanded:string[]; inspectorScroll:number; feedScroll:number } | undefined;
let schemaDraft: SchemaDefinition | undefined;
let pendingSchemaImport: { schemas: SchemaDefinition[]; rules: ReusableSchemaRule[] } | undefined;
let pendingSchemaDeletion: SchemaDefinition | undefined;
let pendingSchemaRestoration: { schemaId: string; version: number } | undefined;
let editingSchemaAssignment: { schemaId: string; assignmentId?: string } | undefined;
let schemaAssignmentConditionState: AssignmentDataConditionEditorState = { target:"payload", suggestions:[] };
let editingReusableSchemaRuleId: string | undefined;
let pendingReusableSchemaRuleDeletionId: string | undefined;
let approvedRuleRevisionId: string | undefined;
let approvedRuleAttachmentUpdateId: string | undefined;
const MANUAL_SCHEMA_OVERRIDE_STORAGE_KEY = "my-chrome-utilities.manual-schema-overrides.v1";
let manualSchemaOverrides: Record<string, string> = (() => { try { const stored = JSON.parse(localStorage.getItem(MANUAL_SCHEMA_OVERRIDE_STORAGE_KEY) ?? "{}"); return stored && typeof stored === "object" && !Array.isArray(stored) ? stored as Record<string, string> : {}; } catch { return {}; } })();
const SCHEMA_VALIDATION_RECORD_STORAGE_KEY = "my-chrome-utilities.schema-validation-records.v1";
interface SchemaValidationRecord { eventId: string; eventName: string; state: string; checkedAt: string; schemaName?: string; schemaVersion?: number; target?: string; assignmentId?: string; assignmentName?: string; assignmentEvidence?: string; }
let schemaValidationRecords: SchemaValidationRecord[] = (() => { try { const stored = JSON.parse(localStorage.getItem(SCHEMA_VALIDATION_RECORD_STORAGE_KEY) ?? "[]"); return Array.isArray(stored) ? stored.filter((record): record is SchemaValidationRecord => !!record && typeof record.eventId === "string" && typeof record.eventName === "string" && typeof record.state === "string" && typeof record.checkedAt === "string") : []; } catch { return []; } })();
const SCHEMA_RULE_STORAGE_KEY = "my-chrome-utilities.schema-rule-library.v1";
interface ReusableSchemaRule { id: string; name: string; kind: string; version?: number; enabled?: boolean; operator?: string; parameters?: string; allowedValues?: readonly (string | number | boolean | null)[]; description?: string; applicableType?: SchemaPropertyType; severity?: string; message?: string; examples?: string; attachments?: readonly string[]; conditionGroup?: import("./data-layer-conditional-validation-rules.js").ConditionalRuleConditionGroup; revisionHistory?: readonly { name: string; kind: string; version: number; enabled?: boolean; operator?: string; parameters?: string; allowedValues?: readonly (string | number | boolean | null)[]; severity?: string; message?: string; conditionGroup?: import("./data-layer-conditional-validation-rules.js").ConditionalRuleConditionGroup }[]; }
let reusableSchemaRules: ReusableSchemaRule[] = (() => { try { const saved = JSON.parse(localStorage.getItem(SCHEMA_RULE_STORAGE_KEY) ?? "[]"); return Array.isArray(saved) ? saved : []; } catch { return []; } })();
const guidedValidationFlow = createGuidedValidationFlow(guidedValidationRoot, {
  schemaCandidates: guidedSchemaCandidates,
  publish: persistPublishedGuidedValidation,
  close: () => { showDataLayerView("Live"); renderLiveObserver(); restoreGuidedPropertyReturn(); },
  saved: finishGuidedValidationSave,
});
let replaySequences: ReplaySequence[] = [];
let observationTargetState: ObservationTargetState = restoredObservationTargetState();
let pendingObservationTargetSwitchId: string | undefined;
let nextSessionSequence = 0;
let currentTargetPathStatus: TargetPathStatus = "Selection required";

function newDataLayerSessionId(tabId: number): string {
  nextSessionSequence += 1;
  const unique = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now()}-${nextSessionSequence}`;
  return `tab-${tabId}-session-${unique}`;
}

if (app) {
  app.textContent = PROJECT_NAME;
}

function renderHistoryPath(path: string, fieldValue = path, status: TargetPathStatus = "Selection required"): void {
  if (historyPathInput) {
    historyPathInput.value = fieldValue;
  }

  if (historyPathDisplay) {
    historyPathDisplay.textContent = path;
  }

  if (historyPathStatus) {
    historyPathStatus.textContent = status;
  }
}

function restoredObservationTargetState(): ObservationTargetState {
  const session = dataLayerSessionState.session;
  if (session?.status !== "active" || session.windowId === undefined) {
    return createObservationTargetState();
  }
  return restoreAttachedObservationTarget(createObservationTarget({
    tabId: session.tabId,
    windowId: session.windowId,
    pageUrl: session.currentUrl,
    title: session.targetTitle ?? session.currentUrl,
    ...(session.targetOrigin ? { origin: session.targetOrigin } : {}),
    priorSession: true,
  }));
}

function setObservationTargetResult(result: string): void {
  setObservationTargetResultUi(observationTargetElements, result);
}

function renderObservationTargetContext(): void {
  renderLiveContextActions();
}

function renderLiveContextActions(): void {
  const activeSession = dataLayerSessionState.session?.status === "active";
  const selectedTarget = selectedObservationTarget(observationTargetState);
  renderLiveSessionControls(
    {
      startTestingButton,
      endTestingButton,
      pauseCaptureButton,
      resumeCaptureButton,
    },
    { activeSession, captureStatus: liveObserverState.status },
  );
  renderLiveGuidedWorkflow(
    liveGuidedWorkflowElements,
    liveGuidedWorkflow({
      activeSession,
      ...(selectedTarget ? { selectedTarget } : {}),
      pathStatus: currentTargetPathStatus,
    }),
  );
  if (startFreshSessionButton) {
    startFreshSessionButton.hidden = !activeSession;
    startFreshSessionButton.disabled = Boolean(savedSessionLiveFeed);
  }
}

function targetFromTab(
  tab: chrome.tabs.Tab,
  currentWindow = false,
): ObservationTarget | undefined {
  if (tab.id === undefined || tab.windowId === undefined || !tab.url) return undefined;
  return createObservationTarget({
    tabId: tab.id,
    windowId: tab.windowId,
    pageUrl: tab.url,
    title: tab.title || tab.url,
    activeTab: tab.active,
    currentWindow,
  });
}

function registerTargetTabs(
  tabs: readonly chrome.tabs.Tab[],
  options: { currentWindowId?: number; replaceDiscovery?: boolean } = {},
): void {
  const targets = tabs.flatMap((tab) => {
    const target = targetFromTab(tab, tab.windowId === options.currentWindowId);
    return target ? [target] : [];
  });
  if (options.replaceDiscovery) {
    observationTargetState = refreshDiscoveredObservationTargets(
      observationTargetState,
      targets,
    );
  } else {
    for (const target of targets) {
      observationTargetState = registerObservationTarget(observationTargetState, target);
    }
  }
  renderObservationTargetPicker();
  renderObservationTargetContext();
}

async function discoverCurrentObservationTarget(): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.tabs?.query) {
    setObservationTargetResult("Selection required");
    return;
  }
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const target = tabs[0] ? targetFromTab(tabs[0], true) : undefined;
  registerTargetTabs(tabs, target ? { currentWindowId: target.windowId } : {});
  if (target) {
    observationTargetState = selectObservationTarget(observationTargetState, target.id);
    setObservationTargetResult(`Selected ${target.title}`);
  } else {
    setObservationTargetResult("Selection required");
  }
  renderObservationTargetPicker();
  renderObservationTargetContext();
  if (target) refreshSelectedTargetPathStatus();
}

async function browseObservationTargets(): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.tabs?.query || !chrome.permissions) {
    setObservationTargetResult("Browse all tabs is unavailable");
    return;
  }
  const allowed = await chrome.permissions.contains({ permissions: ["tabs"] });
  const granted = allowed || await chrome.permissions.request({ permissions: ["tabs"] });
  if (!granted) {
    setObservationTargetResult("Registered targets remain available");
    return;
  }
  const currentWindow = await chrome.windows?.getCurrent?.();
  registerTargetTabs(await chrome.tabs.query({}), {
    ...(currentWindow?.id === undefined ? {} : { currentWindowId: currentWindow.id }),
    replaceDiscovery: true,
  });
  setObservationTargetResult(`${observationTargetState.targets.length} eligible targets`);
}

function renderObservationTargetPicker(): void {
  const visible = findObservationTargets(observationTargetState, observationTargetSearch?.value ?? "");
  renderObservationTargetPickerUi(observationTargetElements, visible, {
    select: (target) => {
      observationTargetState = selectObservationTarget(observationTargetState, target.id);
      setObservationTargetResult(`Selected ${target.title}`);
      renderObservationTargetPicker();
      renderObservationTargetContext();
      closeObservationTargetPicker(observationTargetElements);
      refreshSelectedTargetPathStatus();
    },
    requestAccess: (target) => void requestSelectedTargetAccess(target),
  });
}

async function requestSelectedTargetAccess(target: ObservationTarget): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.permissions) return;
  const granted = await chrome.permissions.request({ origins: [`${target.origin}/*`] });
  if (!granted) {
    setObservationTargetResult("Permission required");
    return;
  }
  observationTargetState = updateObservationTargetAccess(observationTargetState, target.id, "Ready");
  setObservationTargetResult(`Access granted for ${target.origin}`);
  renderObservationTargetPicker();
  renderObservationTargetContext();
  refreshSelectedTargetPathStatus();
}

async function recoverAttachedObservationTarget(): Promise<void> {
  const target = attachedObservationTarget(observationTargetState);
  const recoveryRequest = captureAttachedTargetRecovery(
    observationTargetState,
    dataLayerSessionState,
  );
  if (!target || !recoveryRequest || typeof chrome === "undefined" || !chrome.tabs?.get) return;
  const recoveryIsCurrent = (): boolean => attachedTargetRecoveryIsCurrent(
    observationTargetState,
    dataLayerSessionState,
    recoveryRequest,
  );
  try {
    const tab = await chrome.tabs.get(target.tabId);
    if (!recoveryIsCurrent()) return;
    const recovered = targetFromTab(tab, target.currentWindow) ?? target;
    const session = dataLayerSessionState.session;
    if (session?.status === "active") {
      const observation = await tabPageObservation(
        recovered.tabId,
        recovered.pageUrl,
        session.historyPath,
        observationPageLoadId(recovered.tabId),
      );
      if (!recoveryIsCurrent()) return;
      const recovery = completeAttachedTargetRecovery(
        observationTargetState,
        dataLayerSessionState,
        recoveryRequest,
        recovered,
      );
      if (!recovery.applied) return;
      observationTargetState = recovery.state;
      if (observation.pageAccessStatus === "page access available") {
        dataLayerObserverState = attachHistoryArrayObserver(
          {
            ...dataLayerObserverState,
            sessionState: dataLayerSessionState,
          },
          { ...observation, importExisting: false },
        );
        updateSessionFromObserverState();
        await startLiveHistoryCapture(observation);
        persistAndRenderObservationState();
        setObservationTargetResult(`Recovered ${recovered.title}`);
      } else {
        observationTargetState = updateObservationTargetAccess(
          observationTargetState,
          recovered.id,
          "Permission required",
        );
        setObservationTargetResult("Permission required — Request access");
      }
    }
  } catch {
    if (!recoveryIsCurrent()) return;
    observationTargetState = updateObservationTargetAccess(
      observationTargetState,
      target.id,
      "Closed",
    );
    stopLiveHistoryCapture();
    setObservationTargetResult("Target unavailable — Choose target");
  }
  renderObservationTargetPicker();
  renderObservationTargetContext();
}

function revokeObservationTargetOrigins(origins: readonly string[]): void {
  const affected = observationTargetState.targets.filter((target) =>
    origins.some((originPattern) => originPattern.startsWith(target.origin)));
  for (const target of affected) {
    const attached = observationTargetState.attachedTargetId === target.id;
    observationTargetState = updateObservationTargetAccess(
      observationTargetState,
      target.id,
      "Permission required",
    );
    if (attached) {
      stopLiveHistoryCapture();
      setObservationTargetResult("Permission required — Request access");
    }
  }
  if (affected.length > 0) {
    renderObservationTargetPicker();
    renderObservationTargetContext();
  }
}

async function attachSelectedTarget(): Promise<void> {
  const decision = attachSelectedObservationTarget(observationTargetState);
  if (decision.result === "End current session before attaching selected target") {
    const current = attachedObservationTarget(observationTargetState);
    const next = selectedObservationTarget(observationTargetState);
    if (current && next) {
      pendingObservationTargetSwitchId = next.id;
      showDetachTargetConfirmation(
        observationTargetElements,
        `Keep ${current.title}, or end its session and attach to ${next.title}?`,
        { cancel: "Keep current session", confirm: "End and attach" },
      );
    }
    setObservationTargetResult(decision.result);
    return;
  }
  if (decision.result !== "Attached") {
    setObservationTargetResult(decision.result);
    return;
  }
  const target = selectedObservationTarget(decision.state);
  if (!target) return;
  const sessionWasActive = dataLayerSessionState.session?.status === "active";
  if (sessionWasActive) {
    setObservationTargetResult("End current session before attaching selected target");
    return;
  }
  const observation = await tabPageObservation(
    target.tabId,
    target.pageUrl,
    getHistoryArrayPath(),
    observationPageLoadId(target.tabId),
  );
  if (observation.pageAccessStatus !== "page access available") {
    observationTargetState = updateObservationTargetAccess(observationTargetState, target.id, "Permission required");
    setObservationTargetResult("Permission required");
    renderObservationTargetContext();
    return;
  }
  currentTargetPathStatus = targetPathStatusForObservation(
    observation,
    getHistoryArrayPath(),
  );
  observationTargetState = decision.state;
  const started = beginDataLayerTestingSession(dataLayerSessionState, liveObserverState, {
    id: newDataLayerSessionId(target.tabId),
    tabId: target.tabId,
    windowId: target.windowId,
    url: target.pageUrl,
    targetTitle: target.title,
    targetOrigin: target.origin,
    historyPath: getHistoryArrayPath(),
  });
  dataLayerSessionState = started.sessionState;
  liveObserverState = started.liveObserverState;
  installDefaultSavedEventFeedFilterForNewSession();
  dataLayerSessionState = captureEntry(dataLayerSessionState, { type: "page", url: target.pageUrl });
  dataLayerObserverState = attachHistoryArrayObserver({
    pageObject: dataLayerObserverState.pageObject,
    sessionState: dataLayerSessionState,
    observedEntries: [],
    sourceEvents: [],
  }, observation);
  presentedSourceEventCount = 0;
  updateSessionFromObserverState();
  await startLiveHistoryCapture(observation);
  savedThroughEventCount = 0;
  localStorage.setItem(SAVED_THROUGH_EVENT_COUNT_STORAGE_KEY, "0");
  persistAndRenderObservationState();
  setObservationTargetResult("");
  setLiveSessionMessage("Testing started");
  renderObservationTargetContext();
}

function beginDetachSelectedTarget(): void {
  const target = attachedObservationTarget(observationTargetState);
  if (!target) {
    setObservationTargetResult("No target is attached");
    return;
  }
  pendingObservationTargetSwitchId = undefined;
  showDetachTargetConfirmation(
    observationTargetElements,
    `Detach ${target.title} from the active testing session?`,
  );
}

async function confirmDetachSelectedTarget(): Promise<void> {
  const switchTargetId = pendingObservationTargetSwitchId;
  pendingObservationTargetSwitchId = undefined;
  ({ sessionState: dataLayerSessionState, targetState: observationTargetState } =
    endLiveSession(
      dataLayerSessionState,
      observationTargetState,
      () => stopLiveHistoryCapture(),
    ));
  persistAndRenderObservationState();
  closeDetachTargetConfirmation(observationTargetElements);
  if (switchTargetId) {
    observationTargetState = selectObservationTarget(
      observationTargetState,
      switchTargetId,
    );
    await attachSelectedTarget();
    return;
  }
  setObservationTargetResult("");
  setLiveSessionMessage(testingEndedMessage());
  renderObservationTargetContext();
}

function showDataLayerView(view: DataLayerView, focus = false): void {
  if (liveObserverState.view === "Live" && view !== "Live" && liveObserverState.inspectorEventId) {
    liveInspectorPresentation.set(liveObserverState.inspectorEventId, captureLiveInspectorPresentation(liveObserverElements.eventInspector));
  }
  liveObserverState = { ...liveObserverState, view };
  if (savedSessionLiveFeed) {
    savedSessionLiveFeed = { ...savedSessionLiveFeed, savedView:structuredClone(liveObserverState) };
    persistSavedSessionFeed();
  }
  localStorage.setItem("my-chrome-utilities.data-layer-view.v1", view);
  renderDataLayerView(liveObserverElements, view, focus);
  if (view === "Live" && liveObserverState.inspectorEventId) restoreLiveInspectorPresentation(liveObserverElements.eventInspector, liveInspectorPresentation.get(liveObserverState.inspectorEventId));
  if (view === "Defects") renderDefects();
}

function persistDefectLibrary(): void {
  localStorage.setItem(DEFECT_LIBRARY_STORAGE_KEY, serializeDefectLibrary(defectLibrary));
}

function triagedEvent(event: LiveEvent): LiveEvent {
  return { ...event, defectTriage:presentedEventTriage(event, defectLibrary) };
}

function filteredDefectLibrary(): ReportedDefect[] {
  return searchDefects(defectLibrary, {
    query:defectLibrarySearch?.value ?? "",
    status:(defectLibraryStatus?.value || "All") as DefectStatus | "All",
    type:(defectLibraryType?.value || "All") as ReportedDefect["type"] | "All",
    eventName:defectLibraryEvent?.value ?? "",
    schema:defectLibrarySchema?.value ?? "",
    path:defectLibraryPath?.value ?? "",
  });
}

async function recopyDefect(defectId: string): Promise<string> {
  const defect = defectLibrary.defects.find(({ id }) => id === defectId);
  if (!defect) return "Copy failed. The saved defect is unchanged.";
  return (await copyStoredDefectForJira(defect, browserDefectReportClipboard())).feedback;
}

function openDefect(defectId: string, trigger?: HTMLButtonElement): void {
  selectedDefectId = defectId;
  if (!defectReturn) defectListScrollTop = document.querySelector<HTMLElement>("#defect-library-master")?.scrollTop ?? 0;
  showDataLayerView("Defects");
  renderDefects();
  if (trigger) trigger.dataset.openedDefect = defectId;
}

function closeDefect(): void {
  const returning = defectReturn;
  selectedDefectId = undefined;
  defectReturn = undefined;
  if (returning) {
    showDataLayerView("Live");
    openLiveInspector(returning.eventId, true);
    liveObserverElements.eventInspector?.querySelector<HTMLButtonElement>(`.live-reported-defect-link[data-issue-index="${returning.issueIndex}"]`)?.focus({ preventScroll:true });
    if (liveObserverElements.eventList) liveObserverElements.eventList.scrollTop = returning.listScrollTop;
    return;
  }
  renderDefects();
  const master = document.querySelector<HTMLElement>("#defect-library-master");
  if (master) master.scrollTop = defectListScrollTop;
}

function matchingEventForDefect(defect: ReportedDefect): LiveEvent | undefined {
  if (defect.occurrenceMatch) {
    const capturedId = String(defect.report?.actual?.id ?? "");
    return liveObserverState.events.find((event) => event.id === capturedId && eventMatchesOccurrenceDefect(event, defect))
      ?? liveObserverState.events.find((event) => eventMatchesOccurrenceDefect(event, defect));
  }
  return liveObserverState.events.find((event) => eventContainsDefectIssue(event, defect));
}

function renderDefects(): void {
  const filtered = filteredDefectLibrary();
  const selected = selectedDefectId ? defectLibrary.defects.find(({ id }) => id === selectedDefectId) : undefined;
  const visible = selected && !filtered.some(({ id }) => id === selected.id) ? [...filtered, selected] : filtered;
  renderDefectLibrary(defectLibraryElements, visible, selectedDefectId, defectLibrary.deletionConfirmationId, {
    open:(id, trigger) => openDefect(id, trigger),
    close:closeDefect,
    save:(id, report, notes) => {
      defectLibrary = editDefect(defectLibrary, id, { report, notes }, new Date().toISOString());
      persistDefectLibrary(); renderDefects();
    },
    recopy:recopyDefect,
    updateStatus:(id, status) => {
      defectLibrary = updateDefectStatus(defectLibrary, id, status, new Date().toISOString());
      persistDefectLibrary(); renderDefects(); renderLiveObserver();
    },
    attachCurrentSession:(id) => {
      const draft = currentSessionSaveDraft();
      const result = attachSavedSessionToDefect(defectLibrary, savedSessionLibrary, id, draft.completed, `Evidence for ${id}`, new Date().toISOString());
      defectLibrary = result.library; savedSessionLibrary = result.savedSessions;
      persistDefectLibrary(); persistSavedSessionLibrary(); renderSavedSessions(); renderDefects();
    },
    openLinkedSession:(id) => {
      const defect = defectLibrary.defects.find((candidate) => candidate.id === id);
      const session = savedSessionLibrary.sessions.find((candidate) => candidate.id === defect?.savedSession?.id);
      if (!defect || !session) return;
      openSessionInLiveFeed(session);
      const matching = matchingEventForDefect(defect);
      if (matching) openLiveInspector(matching.id);
    },
    requestDelete:(id) => { defectLibrary = requestDefectDeletion(defectLibrary, id); renderDefects(); },
    cancelDelete:() => { defectLibrary = cancelDefectDeletion(defectLibrary); renderDefects(); },
    confirmDelete:() => {
      const deleted = defectLibrary.deletionConfirmationId;
      defectLibrary = confirmDefectDeletion(defectLibrary);
      if (selectedDefectId === deleted) selectedDefectId = undefined;
      persistDefectLibrary(); renderDefects(); renderLiveObserver();
    },
  });
}

function renderSavedSessionLiveBanner(): void {
  const feed = savedSessionLiveFeed;
  if (savedSessionLiveBanner) savedSessionLiveBanner.hidden = !feed;
  document.querySelector("#data-layer-panel-live")?.setAttribute("data-feed-mode", feed ? "saved-session" : "current");
  if (!feed) {
    if (pauseCaptureButton) pauseCaptureButton.disabled = false;
    if (resumeCaptureButton) resumeCaptureButton.disabled = false;
    if (saveLiveSessionButton) saveLiveSessionButton.disabled = false;
    if (startFreshSessionButton) startFreshSessionButton.disabled = false;
    return;
  }
  const summary = savedSessionSummary(feed.session);
  if (savedSessionLiveSummary) savedSessionLiveSummary.textContent = `${feed.session.name} · Read-only archive · ${summary.eventCount} events · captured ${summary.captureDate}`;
  if (savedSessionBackgroundStatus) savedSessionBackgroundStatus.textContent = dataLayerSessionState.session?.status === "active"
    ? `Live capture continues in the background · ${feed.backgroundEventCount} new events`
    : "No observer was started or attached for this saved session.";
  if (returnToCurrentLiveFeedButton) returnToCurrentLiveFeedButton.textContent = feed.backgroundEventCount
    ? `Return to current Live feed · ${feed.backgroundEventCount} new events`
    : "Return to current Live feed";
  if (savedSessionValidationComparison) savedSessionValidationComparison.textContent = feed.comparison
    ? `Separate validation comparison · revisions ${feed.comparison.revisions.join(" and ")} · ${feed.comparison.results.length} saved events · original results unchanged`
    : "";
  if (pauseCaptureButton) pauseCaptureButton.disabled = true;
  if (resumeCaptureButton) resumeCaptureButton.disabled = true;
  if (saveLiveSessionButton) saveLiveSessionButton.disabled = true;
  if (startFreshSessionButton) startFreshSessionButton.disabled = true;
}

function persistSavedEventFeedWorkingView(): void {
  if (savedSessionLiveFeed) { synchronizeSavedSessionFeedView(); return; }
  const sessionId = dataLayerSessionState.session?.id;
  if (!sessionId) { localStorage.removeItem(SAVED_EVENT_FEED_FILTER_WORKING_STORAGE_KEY); return; }
  localStorage.setItem(SAVED_EVENT_FEED_FILTER_WORKING_STORAGE_KEY, serializeSavedEventFeedWorkingView(
    sessionId,
    liveObserverState.query ?? { conditions:[] },
    liveObserverState.savedFilterId,
  ));
}

function installSavedEventFeedWorkingQuery(query: EventFeedQuery, activeFilterId?: string): void {
  const { savedFilterId: _previous, ...state } = setLiveQuery(liveObserverState, query);
  liveObserverState = { ...state, ...(activeFilterId ? { savedFilterId:activeFilterId } : {}) };
  persistSavedEventFeedWorkingView();
}

function installDefaultSavedEventFeedFilterForNewSession(): void {
  const filter = savedEventFeedFilterLibrary.filters.find(({ id }) => id === savedEventFeedFilterLibrary.defaultFilterId);
  installSavedEventFeedWorkingQuery(filter ? applySavedEventFeedFilter({ conditions:[] }, filter) : { conditions:[] }, filter?.id);
}

function commitSavedEventFeedFilters(
  proposed: SavedEventFeedFilterLibrary,
  failureFeedback: string,
): boolean {
  const result = commitSavedEventFeedFilterLibrary(
    savedEventFeedFilterLibrary,
    proposed,
    (serialized) => localStorage.setItem(SAVED_EVENT_FEED_FILTER_STORAGE_KEY, serialized),
    failureFeedback,
  );
  savedEventFeedFilterLibrary = result.library;
  savedEventFeedFilterFeedback = result.feedback;
  return result.committed;
}

function applyConfiguredSavedEventFeedFilter(filterId: string | undefined): void {
  const filter = savedEventFeedFilterLibrary.filters.find(({ id }) => id === filterId);
  installSavedEventFeedWorkingQuery(filter ? applySavedEventFeedFilter(liveObserverState.query ?? { conditions:[] }, filter) : { conditions:[] }, filter?.id);
  savedEventFeedFilterFeedback = filter ? `${filter.name} applied` : "All events applied";
  renderLiveObserver();
  liveEventQuery?.querySelector<HTMLSelectElement>("#saved-event-feed-filter-selector")?.focus({ preventScroll:true });
}

function renderSavedEventFeedFilterResult(): void {
  renderLiveObserver();
  requestAnimationFrame(() => liveEventQuery?.querySelector<HTMLSelectElement>("#saved-event-feed-filter-selector")?.focus({ preventScroll:true }));
}

function savedEventFeedFilterControls() {
  return {
    library:savedEventFeedFilterLibrary,
    ...(liveObserverState.savedFilterId ? { activeFilterId:liveObserverState.savedFilterId } : {}),
    feedback:savedEventFeedFilterFeedback,
    select:applyConfiguredSavedEventFeedFilter,
    create:(name: string) => {
      try {
        const id = `saved-filter:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
        const created = createSavedEventFeedFilter(savedEventFeedFilterLibrary, name, liveObserverState.query ?? { conditions:[] }, id);
        if (commitSavedEventFeedFilters(created.library, "Saving saved filter failed")) {
          installSavedEventFeedWorkingQuery(applySavedEventFeedFilter({ conditions:[] }, created.filter), created.filter.id);
          savedEventFeedFilterFeedback = `Saved ${created.filter.name}`;
        }
      } catch (error) { savedEventFeedFilterFeedback = error instanceof Error ? error.message : "Saving saved filter failed"; }
      renderSavedEventFeedFilterResult();
    },
    update:() => {
      if (!liveObserverState.savedFilterId) return false;
      let committed = false;
      try {
        const updated = updateSavedEventFeedFilter(savedEventFeedFilterLibrary, liveObserverState.savedFilterId, liveObserverState.query ?? { conditions:[] });
        if (commitSavedEventFeedFilters(updated.library, "Updating saved filter failed")) {
          installSavedEventFeedWorkingQuery(applySavedEventFeedFilter({ conditions:[] }, updated.filter), updated.filter.id);
          savedEventFeedFilterFeedback = `Updated ${updated.filter.name}`;
          committed = true;
        }
      } catch { savedEventFeedFilterFeedback = "Updating saved filter failed"; }
      renderSavedEventFeedFilterResult();
      return committed;
    },
    revert:() => {
      const filter = savedEventFeedFilterLibrary.filters.find(({ id }) => id === liveObserverState.savedFilterId);
      if (filter) { installSavedEventFeedWorkingQuery(applySavedEventFeedFilter({ conditions:[] }, filter), filter.id); savedEventFeedFilterFeedback = `Reverted ${filter.name}`; }
      renderSavedEventFeedFilterResult();
    },
    rename:(name: string) => {
      if (!liveObserverState.savedFilterId) return;
      try {
        const renamed = renameSavedEventFeedFilter(savedEventFeedFilterLibrary, liveObserverState.savedFilterId, name);
        if (commitSavedEventFeedFilters(renamed.library, "Renaming saved filter failed")) savedEventFeedFilterFeedback = `Renamed to ${renamed.filter.name}`;
      } catch (error) { savedEventFeedFilterFeedback = error instanceof Error ? error.message : "Renaming saved filter failed"; }
      renderSavedEventFeedFilterResult();
    },
    delete:() => {
      if (!liveObserverState.savedFilterId) return;
      const deleted = deleteSavedEventFeedFilter(savedEventFeedFilterLibrary, liveObserverState.savedFilterId, liveObserverState.query ?? { conditions:[] });
      if (commitSavedEventFeedFilters(deleted.library, "Deleting saved filter failed")) {
        installSavedEventFeedWorkingQuery(deleted.workingQuery);
        savedEventFeedFilterFeedback = "Saved filter deleted; working conditions retained";
      }
      renderSavedEventFeedFilterResult();
    },
    setDefault:(filterId: string | undefined) => {
      try {
        const proposed = setDefaultSavedEventFeedFilter(savedEventFeedFilterLibrary, filterId).library;
        if (commitSavedEventFeedFilters(proposed, "Setting default failed")) savedEventFeedFilterFeedback = filterId ? "Default saved filter set" : "Default saved filter removed";
      } catch { savedEventFeedFilterFeedback = "Setting default failed"; }
      renderSavedEventFeedFilterResult();
    },
  };
}

function renderLiveObserver(): void {
  renderLiveObserverState(liveObserverElements, { ...liveObserverState, events:liveObserverState.events.map(triagedEvent) }, openLiveInspector);
  if (liveEventQuery) renderEventFeedQueryBuilder(
    liveEventQuery,
    liveObserverState.events,
    liveObserverState.query ?? { conditions: [] },
    (query) => { liveObserverState = setLiveQuery(liveObserverState, query); persistSavedEventFeedWorkingView(); renderLiveObserver(); },
    savedEventFeedFilterControls(),
  );
  if (liveEventsEmptyState) liveEventsEmptyState.hidden = liveObserverState.events.length > 0;
  if (liveSourceErrorState) liveSourceErrorState.hidden = Boolean(savedSessionLiveFeed) || !liveObserverState.sources.some(({ status }) => status !== "Connected");
  renderLiveSessionSummary(liveSessionSummaryElements, currentLiveSessionSummary());
  renderLiveContextActions();
  renderSavedSessionLiveBanner();
}

function currentLiveSessionSummary() {
  if (savedSessionLiveFeed) {
    return createLiveSessionSummary({
      testingState:"Ended",
      observerStatus:"Disconnected",
      targetPage:`${savedSessionLiveFeed.session.name} · Read-only archive`,
      pageUrl:savedSessionLiveFeed.session.pageScope,
      observerPath:"Saved session",
      capturedEventCount:savedSessionLiveFeed.savedView.events.length,
      connectedSourceCount:0,
    });
  }
  const session = dataLayerSessionState.session;
  const target = attachedObservationTarget(observationTargetState)
    ?? selectedObservationTarget(observationTargetState);
  return createLiveSessionSummary({
    testingState: session?.status === "active"
      ? (liveObserverState.status === "Paused" ? "Paused" : "Active")
      : "Ended",
    observerStatus: canonicalLiveObserverStatus(
      observerAttachmentStatus(dataLayerSessionState, dataLayerObserverState),
    ),
    targetPage: session?.targetTitle ?? target?.title ?? "No target selected",
    pageUrl: session?.currentUrl ?? target?.pageUrl ?? "",
    observerPath: session?.historyPath ?? getHistoryArrayPath(),
    capturedEventCount: liveObserverState.events.length,
    connectedSourceCount: liveObserverState.sources.filter(({ status }) => status === "Connected").length,
  });
}

let missingEventBuilderController: MissingEventBuilderController | undefined;

function currentMissingEventVisits() {
  const archived = savedSessionLiveFeed?.session;
  const visits = missingEventVisits(liveObserverState.events, currentLiveSessionSummary().pageUrl, Boolean(archived));
  return archived
    ? visits.map((visit) => ({ ...visit, startedAt:archived.startedAt, endedAt:archived.endedAt, immutable:true as const }))
    : visits;
}

function openMissingEventBuilder(entryPoint: string, initialSchemaId?: string): void {
  const inspector = liveObserverElements.eventInspector;
  if (!inspector) return;
  showDataLayerView("Live");
  const split = globalThis.innerWidth >= 700;
  if (liveObserverElements.eventList) liveObserverElements.eventList.hidden = !split;
  inspector.hidden = false;
  backToEventsButton && (backToEventsButton.hidden = split);
  missingEventBuilderController = renderMissingEventDefectReportBuilder(
    inspector,
    currentMissingEventVisits(),
    assignableSchemas(schemas),
    {
      entryPoint,
      ...(initialSchemaId ? { initialSchemaId } : {}),
      saveReportedDefect:(report) => {
        const defect = createMissingEventDefect({ id:`defect:${crypto.randomUUID()}`, now:new Date().toISOString(), report });
        defectLibrary = addDefect(defectLibrary, defect).library;
        persistDefectLibrary(); renderDefects();
      },
      navigation:{
        backToSelectedVisit:closeInspectorAndReturnToEvents,
        backToLiveFeed:closeInspectorAndReturnToEvents,
        focusReportMissingEvent:() => reportMissingEventButton?.focus({ preventScroll:true }),
        openMatchingEvent:(eventId, restoreBuilder) => {
          openLiveInspector(eventId, true);
          const returnAction = document.createElement("button"); returnAction.type = "button"; returnAction.textContent = "Return to missing-event report";
          returnAction.addEventListener("click", () => { inspector.hidden = false; restoreBuilder(); });
          inspector.append(returnAction);
        },
      },
    },
  );
}

function closeInspectorAndReturnToEvents(): void {
  const selectedId = liveObserverState.inspectorEventId;
  if (selectedId) liveInspectorPresentation.set(selectedId, captureLiveInspectorPresentation(liveObserverElements.eventInspector));
  const returnSnapshot = inspectorReturnSnapshot;
  liveObserverState = closeLiveInspector(liveObserverState);
  synchronizeSavedSessionFeedView();
  renderLiveObserver();
  if (returnSnapshot) {
    const restored = restoreInspectorReturn(returnSnapshot);
    restoreInspectorReturnUi(liveObserverElements, restored);
  }
  inspectorReturnSnapshot = undefined;
}

function expansionReusableRules(): ReusableAllowedValueRule[] {
  return reusableSchemaRules.map((rule) => ({
    ...structuredClone(rule),
    version:rule.version ?? 1,
    ...(rule.revisionHistory ? {
      revisionHistory:rule.revisionHistory.map((snapshot) => ({ ...structuredClone(snapshot), id:rule.id })),
    } : {}),
  }));
}

function storedReusableRule(rule: ReusableAllowedValueRule): ReusableSchemaRule {
  const { revisionHistory, ...current } = structuredClone(rule);
  return {
    ...current,
    name:rule.name ?? rule.id,
    version:rule.version,
    ...(revisionHistory ? {
      revisionHistory:revisionHistory.map((snapshot) => ({
        name:snapshot.name ?? rule.name ?? rule.id,
        kind:snapshot.kind ?? rule.kind,
        version:snapshot.version ?? 1,
        ...(snapshot.enabled !== undefined ? { enabled:snapshot.enabled } : {}),
        ...(snapshot.operator ? { operator:snapshot.operator } : {}),
        ...(snapshot.parameters !== undefined ? { parameters:snapshot.parameters } : {}),
        ...(snapshot.allowedValues ? { allowedValues:structuredClone(snapshot.allowedValues) } : {}),
        ...(snapshot.severity ? { severity:snapshot.severity } : {}),
        ...(snapshot.message ? { message:snapshot.message } : {}),
        ...(snapshot.conditionGroup ? { conditionGroup:structuredClone(snapshot.conditionGroup) } : {}),
      })),
    } : {}),
  };
}

function persistAllowedValueExpansion(nextSchemas: readonly SchemaDefinition[], nextRules: readonly ReusableSchemaRule[]): void {
  const previousSchemas = localStorage.getItem(SCHEMA_LIBRARY_STORAGE_KEY);
  const previousRules = localStorage.getItem(SCHEMA_RULE_STORAGE_KEY);
  try {
    localStorage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, serializeSchemaLibrary(nextSchemas));
    localStorage.setItem(SCHEMA_RULE_STORAGE_KEY, JSON.stringify(nextRules));
  } catch (error) {
    if (previousSchemas === null) localStorage.removeItem(SCHEMA_LIBRARY_STORAGE_KEY);
    else localStorage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, previousSchemas);
    if (previousRules === null) localStorage.removeItem(SCHEMA_RULE_STORAGE_KEY);
    else localStorage.setItem(SCHEMA_RULE_STORAGE_KEY, previousRules);
    throw error;
  }
}

function openAllowedValueExpansionReview(event: LiveEvent, evaluation: ValidationEvaluation, trigger: HTMLButtonElement): void {
  const assignedSchemaId = event.validationDetails?.schema?.id;
  const inspector = liveObserverElements.eventInspector;
  if (!assignedSchemaId || !inspector) return;
  const input = { schemas, reusableRules:expansionReusableRules(), assignedSchemaId, evidence:evaluation };
  let review: ReturnType<typeof reviewAllowedValueExpansion>;
  try { review = reviewAllowedValueExpansion(input); }
  catch (error) { setLiveSessionMessage(error instanceof Error ? error.message : "The allowed value review is unavailable."); return; }
  liveInspectorPresentation.set(
    event.id,
    captureLiveInspectorPresentation(liveObserverElements.eventInspector),
  );
  openAllowedValueExpansionDialog({
    inspector,
    review,
    trigger,
    confirm(destination) {
      const applied = applyAllowedValueExpansion({ ...input, destination });
      const nextRules = applied.reusableRules.map(storedReusableRule);
      persistAllowedValueExpansion(applied.schemas, nextRules);
      schemas = applied.schemas; reusableSchemaRules = nextRules;
      renderSchemas(); renderSchemaWorkflowRows();
      return () => {
        openLiveInspector(event.id, true);
        const action = liveObserverElements.eventInspector?.querySelector<HTMLButtonElement>(`.live-allowed-value-expansion[data-rule-id="${CSS.escape(evaluation.ruleId ?? "")}"]`);
        (action ?? liveObserverElements.eventInspector?.querySelector<HTMLElement>(`[data-property-path="${CSS.escape(evaluation.propertyPath)}"]`))?.focus({ preventScroll:true });
        setLiveSessionMessage(applied.changed ? `${allowedValueText(review.proposedValue)} was added to the working draft.` : "The allowed value was already pending; no duplicate was created.");
      };
    },
    openDraft(destination) {
      const targetId = destination === "parent-schema-draft" ? evaluation.schemaId : assignedSchemaId;
      const target = schemas.find(({ id }) => id === targetId && Boolean(id));
      trigger.focus({ preventScroll:true });
      if (!target) return;
      showDataLayerView("Schemas"); schemaDraft = schemaEditorDraft(target); renderSchemaDraft();
      schemaEditorName?.focus({ preventScroll:true });
    },
  });
}

function openLiveInspector(eventId: string, preserveReturnSnapshot = false): void {
  const previousEventId = liveObserverState.inspectorEventId;
  if (liveObserverState.view === "Live" && previousEventId && liveObserverElements.eventInspector && !liveObserverElements.eventInspector.hidden) {
    liveInspectorPresentation.set(previousEventId, captureLiveInspectorPresentation(liveObserverElements.eventInspector));
  }
  if (!preserveReturnSnapshot) {
    inspectorReturnSnapshot = captureInspectorReturn(
      eventId,
      liveObserverElements.eventList?.scrollTop ?? 0,
    );
  }
  const split = globalThis.innerWidth >= 700;
  liveObserverState = selectLiveEvent(liveObserverState, eventId, split ? "split" : "stacked");
  synchronizeSavedSessionFeedView();
  const event = liveObserverState.events.find(({ id }) => id === eventId);
  const presentation = liveInspectorPresentation.get(eventId);
  if (event) renderLiveInspector(liveObserverElements, triagedEvent(event), createLiveInspectorActions({
    currentPageUrl: () => liveObserverState.pageUrl,
    writeClipboard: async (text) => {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard access is unavailable.");
      }
      await navigator.clipboard.writeText(text);
    },
    storeTemplate: (template) => {
      const existing = eventTemplates.find(({ originatingEventId }) => originatingEventId === template.originatingEventId);
      eventTemplates = existing
        ? eventTemplates.map((candidate) => candidate.id === existing.id ? { ...template, id: existing.id } : candidate)
        : [...eventTemplates, template];
      persistEventTemplateLibrary();
      renderEventTemplateLibrary();
    },
    onTemplateSaved: (template) => {
      savedInspectorTemplateId = template.id;
      appendOpenInLibraryAction(event.id, template.name);
    },
    createSchema: (selected) => openSchemaFromSource({
      name: selected.name,
      sourceId: selected.sourceId,
      eventName: selected.name,
      payload: selected.payload,
      label: "Live event",
    }),
    createValidation: (selected) => {
      openGuidedValidationForEvent(selected);
    },
    addPropertyValidation: (selected, path) => openGuidedValidationForProperty(selected, path),
    addPropertyToSchema: (selected, path, trigger) => openLivePropertyDeclaration(selected, path, trigger),
    propertyDeclaration: (selected, path) => {
      const schema = selectedGuidedContinuation(guidedContinuationSelections, selected, schemas);
      if (!schema?.workingDraft) return {};
      const canonical = canonicalLivePropertyPath(path);
      return { destination:schema.name, alreadyDeclared:Boolean(schemaPropertyAt(schema.workingDraft.document, canonical)) };
    },
    expandAllowedValue: (selected, evaluation, trigger) => openAllowedValueExpansionReview(selected, evaluation, trigger),
    draftContinuation: (selected) => guidedDraftContinuationForEvent(selected),
    startDefectReport: (selected) => {
      if (liveObserverElements.eventInspector) {
        renderDefectReportBuilder(
          liveObserverElements.eventInspector,
          selected,
          undefined,
          liveObserverState.events,
          createLiveDefectReportNavigation(selected.id, {
            reopenCapturedEvent: openLiveInspector,
            createDefectReportAction: () => liveObserverElements.eventInspector
              ?.querySelector<HTMLButtonElement>("#live-inspector-action-create-defect-report") ?? null,
            closeToLiveFeed: closeInspectorAndReturnToEvents,
          }),
          {
            save:async (report, options) => {
              const selectedPointers = new Set(report.evidence.validation.map(({ pointer }) => pointer));
              const issues = currentDefectIssues(selected).filter((issue) => selectedPointers.has(issue.concretePath));
              const defect = createValidationDefect({ id:`defect:${crypto.randomUUID()}`, now:new Date().toISOString(), report, issues });
              const result = addDefect(defectLibrary, defect, options.saveSeparately);
              if (result.added) { defectLibrary = result.library; persistDefectLibrary(); renderDefects(); renderLiveObserver(); }
              if (options.copy && navigator.clipboard?.writeText) await navigator.clipboard.writeText(renderJiraReport(report).text);
              return result.added
                ? { feedback:options.copy ? "Defect saved and copied for Jira Cloud." : "Defect saved." }
                : { feedback:"A reported defect already matches the selected issue.", existing:result.existing.map((existing) => ({ id:existing.id, label:String(existing.report?.summary ?? existing.id) })) };
            },
            openExisting:(id) => openDefect(id),
            updateExisting:(id, report) => { defectLibrary = editDefect(defectLibrary, id, { report }, new Date().toISOString()); persistDefectLibrary(); openDefect(id); },
          },
        );
      }
    },
    startOccurrenceDefectReport: (selected, mode) => {
      if (!liveObserverElements.eventInspector) return;
      renderOccurrenceDefectReportBuilder(
        liveObserverElements.eventInspector,
        selected,
        mode,
        schemas,
        liveObserverState.events,
        undefined,
        createLiveDefectReportNavigation(selected.id, {
          reopenCapturedEvent: openLiveInspector,
          createDefectReportAction: () => liveObserverElements.eventInspector
            ?.querySelector<HTMLButtonElement>(`#live-inspector-action-report-${mode === "Unexpected event" ? "unexpected-event" : "wrong-event-name"}`) ?? null,
          closeToLiveFeed: closeInspectorAndReturnToEvents,
        }),
        {
          save:async (report, options) => {
            const defect = createOccurrenceDefect({ id:`defect:${crypto.randomUUID()}`, now:new Date().toISOString(), report });
            const result = addDefect(defectLibrary, defect, options.saveSeparately);
            if (result.added) { defectLibrary = result.library; persistDefectLibrary(); renderDefects(); renderLiveObserver(); }
            if (options.copy && navigator.clipboard?.writeText) await navigator.clipboard.writeText(renderOccurrenceReport(report).text);
            return result.added
              ? { feedback:options.copy ? "Occurrence defect saved and copied for Jira Cloud." : "Occurrence defect saved." }
              : { feedback:"A reported occurrence defect already matches this event.", existing:result.existing.map((existing) => ({ id:existing.id, label:String(existing.report?.summary ?? existing.id) })) };
          },
          openExisting:openDefect,
          updateExisting:(id, report) => { defectLibrary = editDefect(defectLibrary, id, { report }, new Date().toISOString()); persistDefectLibrary(); openDefect(id); },
        },
      );
    },
    openReportedDefect:(defectId, selected, issueIndex) => {
      defectReturn = { eventId:selected.id, issueIndex, listScrollTop:liveObserverElements.eventList?.scrollTop ?? 0 };
      openDefect(defectId);
    },
    validationAvailable: (selected) => Boolean(validateEvent({
        sourceId: selected.sourceId,
        eventName: selected.name,
        payload: selected.payload,
        rawInput: selected.rawInput,
      }, schemas).schema) || Boolean(manualSchemaOverrides[selected.id]),
    validationState: (selected) => {
      const event = { sourceId:selected.sourceId, eventName:selected.name, payload:selected.payload, rawInput:selected.rawInput };
      const manual = schemas.find((schema) => schema.id === manualSchemaOverrides[selected.id]);
      return manual ? validateWithSchema(event, manual, schemas).state : validateEvent(event, schemas).state;
    },
    manualSchemaChoices: () => assignableSchemas(schemas).map((schema) => ({ id:schema.id, label:`${schema.name} v${schema.version}` })),
    selectManualSchema: (eventId, schemaId) => { const { [eventId]: _previous, ...remaining } = manualSchemaOverrides; manualSchemaOverrides = schemaId ? { ...remaining, [eventId]:schemaId } : remaining; localStorage.setItem(MANUAL_SCHEMA_OVERRIDE_STORAGE_KEY, JSON.stringify(manualSchemaOverrides)); },
    updateValidation: (selectedId, validation) => {
      const selected = liveObserverState.events.find((candidate) => candidate.id === selectedId);
      const event = selected && { sourceId:selected.sourceId, eventName:selected.name, payload:selected.payload, rawInput:selected.rawInput };
      const manual = selected && schemas.find((schema) => schema.id === manualSchemaOverrides[selected.id]);
      const result = event ? (manual ? validateWithSchema(event, manual, schemas) : validateEvent(event, schemas, selected?.pageUrl)) : undefined;
      const inspectorScroll = liveObserverElements.eventInspector?.scrollTop ?? 0;
      const focusedId = document.activeElement instanceof HTMLElement ? document.activeElement.id : "";
      liveObserverState = { ...liveObserverState, events: liveObserverState.events.map((candidate) =>
        candidate.id === selectedId ? { ...candidate, validation, ...(result ? { validationDetails:{ issues:result.issues, evaluations:result.evaluations ?? [], ...(result.schema ? { schema:result.schema } : {}), ...(result.documentation ? { documentation:result.documentation } : {}), ...(result.assignment ? { assignment:result.assignment } : {}) } } : {}) } : candidate) };
      renderLiveObserver();
      if (liveObserverElements.eventInspector) liveObserverElements.eventInspector.scrollTop = inspectorScroll;
      if (focusedId) document.getElementById(focusedId)?.focus({ preventScroll:true });
      setEventValidationUpdateStatus(liveObserverElements, `Validation changed to ${validation}.`);
    },
  }), presentation ? { showNonApplicableProperties:presentation.showNonApplicableProperties } : {});
  renderLiveObserver();
  restoreLiveInspectorPresentation(liveObserverElements.eventInspector, presentation);
  if (!presentation) backToEventsButton?.focus({ preventScroll: true });
}

function appendOpenInLibraryAction(eventId: string, templateName: string): void {
  const action = document.createElement("button");
  action.type = "button";
  action.textContent = "Open in Library";
  action.addEventListener("click", () => {
    const template = eventTemplates.find(({ id }) => id === savedInspectorTemplateId)
      ?? eventTemplates.find(({ originatingEventId }) => originatingEventId === eventId);
    if (!template) return;
    showDataLayerView("Library");
    openTemplateEditor(template);
  });
  liveObserverElements.eventInspector?.append(action);
  setLiveSessionMessage(`Saved ${templateName} to Library. Open in Library is available.`);
}

function setLiveSessionMessage(message: string): void {
  liveNotificationController.announce(message);
}

async function copyLivePageUrl(): Promise<void> {
  const pageUrl = currentLiveSessionSummary().pageUrl;
  const writeText = navigator.clipboard?.writeText.bind(navigator.clipboard);
  const result = await copyLivePageUrlAction(pageUrl, writeText);
  if (result === "copied") setLiveSessionMessage("Page URL copied");
  if (result === "failed") setLiveSessionMessage("Page URL could not be copied");
}

function renderEventTemplateLibrary(): void {
  const templates = searchEventTemplates(eventTemplates, eventTemplateSearch?.value ?? "");
  const empty = panelEmptyState("templates", templates.length, Boolean(eventTemplateSearch?.value.trim()));
  renderPanelEmptyState(templateEmptyStateElements, empty);
  if (exportEventLibraryButton) exportEventLibraryButton.disabled = eventTemplates.length === 0;
  if (clearEventLibraryButton) clearEventLibraryButton.disabled = eventTemplates.length === 0;
  renderEventLibraryEditor(
    eventLibraryEditorElements,
    templates,
    propertyEditorState,
    {
      edit: openTemplateEditor,
      rename: openTemplateRename,
      duplicate: (template) => {
        const copy = saveAsTemplateCopy(openPropertyEditor(template), `${template.name} copy`);
        eventTemplates = [...eventTemplates, copy];
        persistEventTemplateLibrary();
        renderEventTemplateLibrary();
      },
      push: (template) => {
        void pushLibraryTemplate(template);
      },
      delete: requestEventTemplateDeletion,
      createSchema: (template) => openSchemaFromSource({
        name: template.name,
        sourceId: template.sourceId,
        eventName: template.eventName,
        payload: template.payload,
        label: "Library template",
      }),
    },
  );
  const editor = propertyEditorState;
  const selectable = Boolean(editor && !editor.isNew);
  libraryDraftSchemaSelector.hidden = refreshLibraryDraftValidationButton.hidden = !selectable;
  if (selectable && editor) {
    const selected = editor.template.schemaId ?? "";
    libraryDraftSchemaSelector.replaceChildren(Object.assign(document.createElement("option"), { value:"", textContent:"Automatic schema" }), ...assignableSchemas(schemas).map((schema) => Object.assign(document.createElement("option"), { value:schema.id, textContent:`${schema.name} v${schema.version}` })));
    libraryDraftSchemaSelector.value = selected;
  }
}

libraryDraftSchemaSelector.addEventListener("change", () => {
  const editor = propertyEditorState;
  if (!editor || editor.isNew) return;
  propertyEditorState = setTemplateSchemaAttachment(editor, libraryDraftSchemaSelector.value);
  renderEventTemplateLibrary();
});
function refreshLibraryDraftValidation(): void {
  const editor = propertyEditorState;
  if (!editor || editor.isNew) return;
  const schema = schemas.find((candidate) => candidate.id === editor.template.schemaId);
  if (!schema) { setEventLibraryValidation(eventLibraryEditorElements, "Select a schema to refresh Library draft validation."); return; }
  const result = validateWithSchema({ sourceId:editor.template.sourceId, eventName:editor.template.eventName, payload:editor.draft, rawInput:[] }, schema, schemas);
  setEventLibraryValidation(eventLibraryEditorElements, `Library draft validation: ${result.state} · ${schema.name} v${schema.version}.`);
}
refreshLibraryDraftValidationButton.addEventListener("click", refreshLibraryDraftValidation);

function renderSchemas(): void {
  const visible = searchSchemas(schemas, schemaSearch?.value ?? "");
  if (schemaEmptyState) schemaEmptyState.hidden = visible.length > 0;
  if (schemaCount) schemaCount.textContent = `${visible.length} schemas`;
  if (schemaList) schemaList.replaceChildren(...visible.map((schema) => {
    const item = document.createElement("li"); const revise = document.createElement("button"); const duplicate = document.createElement("button"); const build = document.createElement("button"); const reportMissing = document.createElement("button"); const remove = document.createElement("button");
    const parent = schema.parentSchemaId ? schemas.find((candidate) => candidate.id === schema.parentSchemaId) : undefined;
    const pending = schema.workingDraft?.pendingChanges.length ?? 0;
    const history = schemaRevisionChoices(schema).length;
    item.textContent = schema.published === false
      ? `${schema.name} · unpublished draft · ${pending} pending changes. `
      : `${schema.name} · current revision ${schema.version}${parent ? ` · inherits ${parent.name} v${parent.version}` : ""} · ${pending} pending draft changes · ${history} historical revisions · ${schema.assignments.map((assignment) => `${assignment.sourceId}/${assignment.eventName}/${assignment.target}`).join(", ") || "unassigned"}. `;
    revise.type = duplicate.type = build.type = reportMissing.type = remove.type = "button"; revise.textContent = "Edit working draft"; duplicate.textContent = "Duplicate"; build.textContent = "Build specification"; reportMissing.textContent = "Report missing event"; remove.textContent = "Delete";
    revise.addEventListener("click", () => {
      schemaDraft = schemaEditorDraft(schema);
      renderSchemaDraft();
    });
    duplicate.addEventListener("click", () => { schemas = [...schemas, duplicateSchemaRevision(schema, schema.version, schemas)]; persistSchemaLibrary(); renderSchemas(); });
    build.addEventListener("click", () => openSchemaSpecification(schema, `published:${schema.version}`, build));
    reportMissing.addEventListener("click", () => openMissingEventBuilder("schema row actions", schema.id));
    remove.addEventListener("click", () => {
      const children = schemas.filter((candidate) => candidate.parentSchemaId === schema.id);
      if (children.length) { if (schemaResult) schemaResult.textContent = `Cannot delete ${schema.name}: it is the parent of ${children.map(({ name }) => name).join(", ")}.`; return; }
      pendingSchemaDeletion = schema;
      if (schemaDeleteReviewSummary) schemaDeleteReviewSummary.textContent = `${schema.name} v${schema.version} and its assignments will be removed.`;
      if (schemaDeleteReview) { schemaDeleteReview.hidden = false; schemaDeleteReview.showModal(); }
    }); item.append(revise, duplicate, build, reportMissing, remove); return item;
  }));
}

function showSchemaSubview(id: "schema-master" | "schema-rule-library" | "schema-assignments"): void {
  schemaPanels.forEach((panel) => { panel.hidden = panel.id !== id; });
  schemaSubviews.forEach((tab) => {
    const active = tab.getAttribute("aria-controls") === id;
    tab.setAttribute("aria-selected", String(active)); tab.tabIndex = active ? 0 : -1;
  });
}

function schemaDocumentPaths(document: SchemaDefinition["document"]): string[] {
  return schemaPropertyRows(document).map(({ displayPath }) => displayPath);
}

function schemaPropertyAt(document: SchemaDefinition["document"], path: string, inheritedDocuments: readonly SchemaDefinition["document"][] = []): SchemaDefinition["document"] | undefined {
  const canonicalPath = canonicalRulePropertyPath(path);
  return schemaPropertyRows(document, inheritedDocuments).find((row) => row.canonicalPath === canonicalPath)?.schema;
}

function promotionReusableRules(): PromotableReusableRule[] {
  return reusableSchemaRules.map((rule) => ({
    ...structuredClone(rule),
    version:rule.version ?? 1,
    ...(rule.revisionHistory ? {
      revisionHistory:rule.revisionHistory.map((snapshot) => ({ ...structuredClone(snapshot), id:rule.id })),
    } : {}),
  }));
}

function storedPromotionRules(rules: readonly PromotableReusableRule[]): ReusableSchemaRule[] {
  return rules.map((rule) => {
    const { revisionHistory, ...current } = structuredClone(rule);
    return {
      ...current,
      ...(revisionHistory ? {
        revisionHistory:revisionHistory.map((snapshot) => ({
          name:snapshot.name ?? rule.name,
          kind:snapshot.kind ?? rule.kind,
          version:snapshot.version ?? 1,
          ...(snapshot.enabled !== undefined ? { enabled:snapshot.enabled } : {}),
          ...(snapshot.operator !== undefined ? { operator:snapshot.operator } : {}),
          ...(snapshot.parameters !== undefined ? { parameters:snapshot.parameters } : {}),
          ...(snapshot.allowedValues !== undefined ? { allowedValues:structuredClone(snapshot.allowedValues) } : {}),
          ...(snapshot.severity !== undefined ? { severity:snapshot.severity } : {}),
          ...(snapshot.message !== undefined ? { message:snapshot.message } : {}),
          ...(snapshot.conditionGroup !== undefined ? { conditionGroup:structuredClone(snapshot.conditionGroup) } : {}),
        })),
      } : {}),
    };
  });
}

function restoreLocalRulePromotionPresentation(ruleId: string, focusOrigin: boolean): void {
  const pending = pendingLocalRulePromotion;
  if (!pending) return;
  selectedSchemaPropertyPath = pending.propertyPath.slice(1).replaceAll("/", ".");
  const property = schemaPropertyTree.querySelector<HTMLElement>(`li[data-schema-property-path="${CSS.escape(selectedSchemaPropertyPath)}"]`);
  const disclosure = property?.querySelector<HTMLDetailsElement>("details[data-attached-rules]");
  if (disclosure) disclosure.open = true;
  if (schemaDetail) schemaDetail.scrollTop = pending.scrollTop;
  if (focusOrigin) pending.trigger.focus({ preventScroll:true });
  else property?.querySelector<HTMLElement>(`.schema-attached-rule[data-rule-id="${CSS.escape(ruleId)}"]`)?.focus({ preventScroll:true });
}

function openLocalRulePromotionReview(propertyPath: string, sourceRuleId: string, trigger: HTMLButtonElement): void {
  const storedSchema = schemaDraft && schemas.find(({ id }) => id === schemaDraft?.id);
  const schema = storedSchema ?? schemaDraft;
  if (!schema) return;
  const editorContext = storedSchema ? "editable" as const : "new-schema" as const;
  let review: ReturnType<typeof reviewLocalRulePromotion>;
  try {
    review = reviewLocalRulePromotion({ schema, reusableRules:promotionReusableRules(), propertyPath, sourceRuleId, editorContext });
  } catch (error) {
    if (schemaResult) schemaResult.textContent = error instanceof Error ? error.message : "Promotion is no longer available.";
    return;
  }
  pendingLocalRulePromotion = { trigger, propertyPath, sourceRuleId, scrollTop:schemaDetail?.scrollTop ?? 0 };
  localRulePromotionDialog.open({
    review,
    cancel() {
      restoreLocalRulePromotionPresentation(sourceRuleId, true);
      pendingLocalRulePromotion = undefined;
    },
    confirm(selected) {
      const result = selected.action === "create"
        ? promoteLocalRule({ schema, reusableRules:promotionReusableRules(), propertyPath, sourceRuleId, editorContext, ...selected })
        : promoteLocalRule({ schema, reusableRules:promotionReusableRules(), propertyPath, sourceRuleId, editorContext, action:"use-existing", reusableRuleId:selected.reusableRuleId });
      const nextSchemas = storedSchema
        ? schemas.map((candidate) => candidate.id === result.schema.id ? result.schema : candidate)
        : schemas;
      const nextRules = storedPromotionRules(result.reusableRules);
      persistLocalRulePromotion(localStorage, {
        schemaKey:SCHEMA_LIBRARY_STORAGE_KEY,
        schemaValue:serializeSchemaLibrary(nextSchemas),
        ruleKey:SCHEMA_RULE_STORAGE_KEY,
        ruleValue:JSON.stringify(nextRules),
      });
      schemas = nextSchemas; reusableSchemaRules = nextRules; schemaDraft = storedSchema ? schemaEditorDraft(result.schema) : result.schema;
      return () => {
        renderSchemas(); renderSchemaWorkflowRows(); renderSchemaDraft();
        restoreLocalRulePromotionPresentation(result.replacementRuleId, false);
        pendingLocalRulePromotion = undefined;
        if (schemaResult) schemaResult.textContent = `Promoted ${sourceRuleId} to reusable rule ${result.replacementRuleId}.`;
      };
    },
  });
}

function renderSchemaDraft(): void {
  const draft = schemaDraft;
  if (schemaEditor) schemaEditor.hidden = !draft;
  if (closeSchemaEditorButton) closeSchemaEditorButton.hidden = !draft;
  if (saveAndCloseSchemaButton) saveAndCloseSchemaButton.hidden = !draft;
  if (discardWorkingSchemaDraftButton) discardWorkingSchemaDraftButton.hidden = !draft || !schemas.some((schema) => schema.id === draft.id && schema.workingDraft);
  if (schemaDetailEmpty) schemaDetailEmpty.hidden = Boolean(draft);
  if (!draft) return;
  const storedSchema = schemas.find((schema) => schema.id === draft.id);
  buildSpecificationButton.hidden = !storedSchema?.workingDraft;
  buildSpecificationButton.onclick = storedSchema?.workingDraft
    ? () => openSchemaSpecification(storedSchema, "working-draft", buildSpecificationButton)
    : null;
  const pendingChanges = storedSchema?.workingDraft?.pendingChanges.length ?? 0;
  const status = document.querySelector<HTMLElement>("#schema-editor-status");
  if (status) status.textContent = storedSchema?.published === false
    ? `Unpublished new schema draft · ${pendingChanges} pending changes`
    : storedSchema?.workingDraft
      ? `Working draft based on revision ${storedSchema.version} · ${pendingChanges} pending changes`
      : storedSchema
        ? `Current revision ${storedSchema.version} · no working draft`
        : "Unsaved new schema";
  if (schemaEditorName) schemaEditorName.value = draft.name;
  const effectiveDocumentation = resolveEffectiveSchemaDocumentation(draft, [...schemas.filter(({ id }) => id !== draft.id), draft]);
  if (schemaEditorDescription) schemaEditorDescription.value = draft.documentation?.description ?? "";
  if (schemaDescriptionOrigin) schemaDescriptionOrigin.textContent = effectiveDocumentation.descriptionOrigin
    ? `${effectiveDocumentation.description ?? ""} · ${effectiveDocumentation.descriptionOrigin.name} revision ${effectiveDocumentation.descriptionOrigin.version}${effectiveDocumentation.descriptionOrigin.id === draft.id ? " · local" : " · inherited"}`
    : "No schema description.";
  if (schemaEditorTarget) schemaEditorTarget.value = draft.assignments[0]?.target ?? "payload";
  if (schemaOnlyDeclaredProperties) schemaOnlyDeclaredProperties.checked = draft.document.additionalProperties === false;
  const parentDocuments = schemaParentDocuments();
  for (const details of Array.from(schemaPropertyTree.querySelectorAll<HTMLDetailsElement>("li[data-schema-property-canonical-path] details[data-attached-rules]"))) {
    const path = details.closest<HTMLElement>("li[data-schema-property-canonical-path]")?.dataset.schemaPropertyCanonicalPath;
    if (!path) continue;
    if (details.open) expandedSchemaPropertyRulePaths.add(path);
    else expandedSchemaPropertyRulePaths.delete(path);
  }
  const excludedInheritedPaths = new Set(Object.entries(draft.inheritedRuleOverrides ?? {})
    .filter(([, state]) => state === "disabled")
    .map(([path]) => canonicalRulePropertyPath(path)));
  const allPropertyRows = schemaPropertyRows(draft.document, parentDocuments, excludedInheritedPaths);
  const propertyView = filterAndSortSchemaPropertyRows(allPropertyRows, schemaPropertyFilter.value, schemaPropertySort.value as SchemaPropertySortOrder);
  const propertyRows = propertyView.rows;
  const propertyPaths = propertyRows.map(({ displayPath }) => displayPath);
  const allPropertyPaths = allPropertyRows.map(({ displayPath }) => displayPath);
  if (!allPropertyPaths.includes(selectedSchemaPropertyPath)) selectedSchemaPropertyPath = allPropertyPaths[0] ?? "example";
  schemaPropertyResultStatus.textContent = `${propertyView.matchCount} of ${propertyView.totalCount} properties${schemaPropertyFilter.value.trim() && propertyView.matchCount ? `, ${propertyView.contextCount} context` : ""}`;
  schemaPropertyEmpty.hidden = propertyRows.length > 0;
  schemaPropertyEmptyMessage.textContent = propertyRows.length ? "" : `No properties match ${schemaPropertyFilter.value.trim()}`;
  const propertyTreeScrollTop = schemaPropertyTree.scrollTop;
  const schemaEditorScrollTop = schemaEditor?.scrollTop ?? 0;
  const propertyItems = propertyRows.map((propertyRow) => {
    const path = propertyRow.displayPath;
    const item = document.createElement("li");
    item.dataset.schemaPropertyPath = path;
    item.dataset.schemaPropertyCanonicalPath = propertyRow.canonicalPath;
    if (path === selectedSchemaPropertyPath) item.setAttribute("aria-current", "true");
    item.tabIndex = -1;
    const label = document.createElement("strong"); label.textContent = path;
    const inherited = propertyRow.origin === "inherited";
    const property = propertyRow.schema;
    const metadata = document.createElement("span"); metadata.className = "schema-property-metadata";
    metadata.textContent = `${propertyRow.filterContext ? "Filter context · " : ""}${inherited ? "Inherited" : path.endsWith(".*") ? "Every item" : property?.propertyOrigin === "manual" ? "Manual" : "Observed"} · type ${property?.type ?? "unknown"}${property?.type === "array" && property.items?.type ? ` of ${property.items.type}` : ""}`;
    const persistedPath = propertyRow.canonicalPath;
    const documentationPath = canonicalDocumentationPath(persistedPath);
    const localDocumentation = draft.documentation?.properties?.[documentationPath];
    const propertyDocumentation = effectiveDocumentation.properties[documentationPath];
    const documentationParent = draft.parentSchemaId ? schemas.find(({ id }) => id === draft.parentSchemaId) : undefined;
    const inheritedDocumentation = documentationParent ? resolveEffectiveSchemaDocumentation(documentationParent, schemas).properties[documentationPath] : undefined;
    const attached = (draft.attachedRules ?? []).filter((rule) => canonicalRulePropertyPath(rule.propertyPath ?? "") === persistedPath);
    const count = document.createElement("span"); count.textContent = ` (${attached.filter((rule) => rule.enabled !== false).length} active rules)`;
    const add = document.createElement("button"); add.type = "button"; add.textContent = "Add rule"; add.className = "schema-property-add-rule"; add.setAttribute("aria-label", `Add rule for ${path}`);
    add.addEventListener("click", () => openSchemaPropertyRulePicker(path, add));
    const containerAction = inherited ? undefined : manualPropertyContainerAction(draft.document, persistedPath);
    const addContainerChild = containerAction ? document.createElement("button") : undefined;
    if (addContainerChild && containerAction) {
      addContainerChild.type = "button";
      addContainerChild.textContent = containerAction.label;
      addContainerChild.className = "schema-property-add-child";
      addContainerChild.setAttribute("aria-label", `${containerAction.label} on ${persistedPath}`);
      addContainerChild.addEventListener("click", () => openContextualManualPropertyForm(containerAction.parentPath, addContainerChild));
    }
    const documentationSummary = document.createElement("p"); documentationSummary.className = "schema-property-documentation";
    documentationSummary.textContent = propertyDocumentation
      ? `${propertyDocumentation.displayName || path} · ${propertyDocumentation.description}${propertyDocumentation.example ? ` · Example: ${String(propertyDocumentation.example.value)}` : ""}${propertyDocumentation.inherited ? ` · inherited from ${propertyDocumentation.origin.name} revision ${propertyDocumentation.origin.version}` : " · local"}`
      : "No documentation";
    const editDocumentation = document.createElement("a"); editDocumentation.setAttribute("role", "button"); editDocumentation.tabIndex = 0; editDocumentation.className = "schema-property-documentation-control";
    editDocumentation.textContent = localDocumentation || propertyDocumentation ? "Edit documentation" : "Add documentation";
    editDocumentation.setAttribute("aria-label", `${editDocumentation.textContent} for ${documentationPath}`);
    const documentationEditor = document.createElement("fieldset"); documentationEditor.className = "schema-property-documentation-editor"; documentationEditor.hidden = true;
    const legend = document.createElement("legend"); legend.textContent = `Documentation for ${documentationPath}`;
    const displayNameLabel = document.createElement("label"); const displayName = document.createElement("input"); displayName.type = "text"; displayName.value = localDocumentation?.displayName ?? propertyDocumentation?.displayName ?? ""; displayName.id = `schema-documentation-name-${path.replace(/[^a-z0-9]+/gi, "-")}`; displayNameLabel.htmlFor = displayName.id; displayNameLabel.textContent = "Display name";
    const descriptionLabel = document.createElement("label"); const description = document.createElement("textarea"); description.value = localDocumentation?.description ?? propertyDocumentation?.description ?? ""; description.id = `schema-documentation-description-${path.replace(/[^a-z0-9]+/gi, "-")}`; descriptionLabel.htmlFor = description.id; descriptionLabel.textContent = "Description";
    const exampleGroup = document.createElement("fieldset"); exampleGroup.className = "schema-property-example-editor";
    const exampleLegend = document.createElement("legend"); exampleLegend.textContent = "Example value"; exampleGroup.append(exampleLegend);
    const exampleName = `schema-documentation-example-${path.replace(/[^a-z0-9]+/gi, "-")}`;
    const draftSchema = { ...draft, document:draft.document, ...(draft.attachedRules ? { attachedRules:draft.attachedRules } : {}) };
    const allowedExamples = schemaPropertyExampleChoices(draftSchema, persistedPath, [
      ...schemas.filter(({ id }) => id !== draft.id),
      draftSchema,
    ]);
    const exampleType = schemaPropertyExampleInputType(
      draftSchema,
      persistedPath,
      localDocumentation?.example?.value ?? propertyDocumentation?.example?.value ?? allowedExamples[0],
      [...schemas.filter(({ id }) => id !== draft.id), draftSchema],
    );
    let exampleDraft: SchemaPropertyExample | undefined = structuredClone(localDocumentation?.example ?? propertyDocumentation?.example);
    let customInitialized = exampleDraft?.selectionMethod === "custom";
    const exampleAssistance = document.createElement("output"); exampleAssistance.className = "schema-property-example-assistance"; exampleAssistance.setAttribute("aria-live", "polite");
    const noExampleLabel = document.createElement("label"); const noExample = document.createElement("input"); noExample.type = "radio"; noExample.name = exampleName; noExample.checked = !exampleDraft; noExampleLabel.append(noExample, " No example value"); exampleGroup.append(noExampleLabel);
    noExample.addEventListener("change", () => { if (noExample.checked) { exampleDraft = undefined; exampleAssistance.textContent = ""; exampleGroup.querySelector<HTMLInputElement>("[data-schema-property-example-input]")?.setAttribute("hidden", ""); } });
    for (const allowed of allowedExamples) {
      const label = document.createElement("label"); const radio = document.createElement("input"); radio.type = "radio"; radio.name = exampleName; radio.value = String(allowed); radio.dataset.exampleSelectionMethod = "allowed value"; radio.checked = exampleDraft?.selectionMethod === "allowed value" && Object.is(exampleDraft.value, allowed);
      radio.addEventListener("change", () => { if (radio.checked) { exampleDraft = { value:structuredClone(allowed), selectionMethod:"allowed value" }; exampleAssistance.textContent = ""; exampleGroup.querySelector<HTMLInputElement>("[data-schema-property-example-input]")?.setAttribute("hidden", ""); } });
      label.append(radio, ` ${String(allowed)}`); exampleGroup.append(label);
    }
    const customLabel = document.createElement("label"); const customExample = document.createElement("input"); customExample.type = "radio"; customExample.name = exampleName; customExample.dataset.exampleSelectionMethod = "custom"; customExample.checked = exampleDraft?.selectionMethod === "custom"; customLabel.append(customExample, " Custom value");
    const customInput = document.createElement("input"); customInput.dataset.schemaPropertyExampleInput = documentationPath; customInput.type = exampleType === "number" ? "number" : "text"; customInput.value = exampleDraft?.selectionMethod === "custom" ? String(exampleDraft.value) : exampleType === "null" ? "null" : ""; customInput.hidden = !customExample.checked; customInput.readOnly = exampleType === "null";
    const refreshCustomExample = () => {
      const parsed = exampleValueFromInput(customInput.value, exampleType);
      if (!parsed) { exampleDraft = undefined; exampleAssistance.textContent = `Enter a valid ${exampleType} example value`; return; }
      exampleDraft = parsed;
      exampleAssistance.textContent = schemaPropertyExampleConflicts(exampleDraft, allowedExamples) ? "Example value does not satisfy the effective Allowed values rule" : "";
    };
    customExample.addEventListener("change", () => { if (!customExample.checked) return; customInput.hidden = false; if (!customInitialized) { customInitialized = true; if (exampleType === "boolean" && !customInput.value) customInput.value = "false"; if (exampleType === "null") customInput.value = "null"; } refreshCustomExample(); customInput.focus({ preventScroll:true }); });
    customInput.addEventListener("input", refreshCustomExample);
    exampleGroup.append(customLabel, customInput, exampleAssistance);
    if (customExample.checked) refreshCustomExample();
    const saveDocumentation = document.createElement("input"); saveDocumentation.type = "button"; saveDocumentation.value = "Save documentation";
    saveDocumentation.addEventListener("click", () => {
      if (!schemaDraft) return;
      if (customExample.checked && !exampleDraft) { exampleAssistance.textContent = `Enter a valid ${exampleType} example value`; customInput.focus({ preventScroll:true }); return; }
      const entry: SchemaPropertyDocumentation = { displayName:displayName.value, description:description.value, ...(exampleDraft ? { example:structuredClone(exampleDraft) } : {}) };
      if (!entry.displayName.trim() && !entry.description.trim() && !entry.example && localDocumentation) { requestSchemaDocumentationRemoval(documentationPath, saveDocumentation); return; }
      schemaDraft = { ...schemaDraft, documentation:setPropertyDocumentation(schemaDraft.documentation ?? {}, documentationPath, entry) };
      persistSchemaEditorDraft(`Document property ${documentationPath}`); renderSchemaDraft();
    });
    const removeDocumentation = document.createElement("input"); removeDocumentation.type = "button"; removeDocumentation.value = inheritedDocumentation ? "Restore inherited documentation" : "Remove documentation";
    removeDocumentation.hidden = !localDocumentation;
    removeDocumentation.addEventListener("click", () => requestSchemaDocumentationRemoval(documentationPath, removeDocumentation));
    editDocumentation.addEventListener("click", () => { documentationEditor.hidden = false; editDocumentation.setAttribute("aria-expanded", "true"); displayName.focus({ preventScroll:true }); });
    editDocumentation.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { editDocumentation.click(); event.preventDefault(); } });
    documentationEditor.append(legend, displayNameLabel, displayName, descriptionLabel, description, exampleGroup, saveDocumentation, removeDocumentation);
    const documentationSection = document.createElement("section"); documentationSection.className = "schema-property-documentation-section"; documentationSection.setAttribute("aria-label", `Documentation for ${documentationPath}`); documentationSection.append(documentationSummary, editDocumentation, documentationEditor);
    const removeProperty = document.createElement("button"); removeProperty.type = "button";
    removeProperty.textContent = inherited ? "Exclude inherited property" : "Remove property";
    removeProperty.setAttribute("aria-label", `${removeProperty.textContent} ${path.startsWith("/") ? path : `/${path.replaceAll(".", "/")}`}`);
    removeProperty.addEventListener("click", () => {
      if (!schemaDraft) return;
      const canonicalPath = `/${path.replaceAll(".", "/")}`;
      if (inherited) {
        schemaDraft = { ...schemaDraft, inheritedRuleOverrides:{ ...(schemaDraft.inheritedRuleOverrides ?? {}), [canonicalPath]:"disabled" } };
        persistSchemaEditorDraft(`Exclude inherited property ${canonicalPath}`); renderSchemaDraft();
        schemaPropertyRemovalFeedback.textContent = `Excluded inherited property ${canonicalPath} locally; the parent schema is unchanged.`;
        return;
      }
      requestSchemaPropertyRemoval(canonicalPath, removeProperty);
    });
    const copyProperty = document.createElement("button"); copyProperty.type="button"; copyProperty.textContent="Copy to another schema";
    copyProperty.setAttribute("aria-label",`Copy ${persistedPath} to another schema`);
    copyProperty.addEventListener("click",()=>openSchemaPropertyCopyReview(persistedPath,copyProperty));
    const addSpecificIndex = property?.type === "array" ? document.createElement("button") : undefined;
    if (addSpecificIndex) {
      addSpecificIndex.type = "button"; addSpecificIndex.textContent = "Add specific index rule";
      addSpecificIndex.addEventListener("click", () => {
        specificIndexArrayPath = path; specificIndexTrigger = addSpecificIndex; schemaSpecificIndex.value = ""; confirmSchemaSpecificIndex.disabled = true;
        schemaSpecificIndexAssistance.textContent = "Enter a non-negative zero-based index"; schemaSpecificIndexDialog.showModal(); schemaSpecificIndex.focus({ preventScroll:true });
      });
    }
    const view = document.createElement("details"); view.dataset.attachedRules = "true"; view.open = expandedSchemaPropertyRulePaths.has(persistedPath); view.addEventListener("toggle", () => { if (view.open) expandedSchemaPropertyRulePaths.add(persistedPath); else expandedSchemaPropertyRulePaths.delete(persistedPath); }); const summary = document.createElement("summary"); summary.textContent = `View attached rules (${attached.length})`; view.append(summary);
    if (!attached.length) view.append("No rules attached to this property.");
    for (const rule of attached) {
      const row = document.createElement("div");
      row.className = "schema-attached-rule"; row.dataset.ruleId = rule.id; row.dataset.propertyPath = persistedPath; row.tabIndex = -1;
      const conditionSummary = rule.conditionGroup && rule.propertyPath && rule.operator
        ? conditionalRuleSummary({ conditionGroup:rule.conditionGroup, consequence:{ propertyPath:rule.propertyPath, operator:rule.operator, ...(rule.parameters !== undefined ? { parameters:rule.parameters } : {}) } })
        : undefined;
      row.textContent = `${rule.id} v${rule.version} · ${conditionSummary ?? `${rule.operator ?? "rule"} · ${rule.parameters ?? "no parameters"}`} · ${rule.severity ?? "error"} · ${rule.enabled === false ? "disabled" : "active"} `;
      const toggle = document.createElement("button"); toggle.type = "button"; toggle.textContent = rule.enabled === false ? "Re-enable" : "Disable";
      toggle.addEventListener("click", () => updateAttachedRule(persistedPath, rule.id, (item) => ({ ...item, enabled:item.enabled === false })));
      const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Remove";
      remove.addEventListener("click", () => updateAttachedRule(persistedPath, rule.id, () => undefined));
      const promotionSchema = storedSchema ?? draft;
      const promotion = localRulePromotionAvailability({ schema:promotionSchema, reusableRules:promotionReusableRules(), propertyPath:persistedPath, sourceRuleId:rule.id, editorContext:storedSchema ? "editable" : "new-schema" }).available
        ? document.createElement("button")
        : undefined;
      if (promotion) {
        promotion.type = "button"; promotion.textContent = "Promote to reusable rule"; promotion.className = "local-rule-promotion-action"; promotion.dataset.ruleId = rule.id; promotion.dataset.propertyPath = persistedPath;
        promotion.addEventListener("click", () => openLocalRulePromotionReview(persistedPath, rule.id, promotion));
      }
      row.append(...(promotion ? [promotion] : []), toggle, remove); view.append(row);
    }
    item.append(label, metadata, documentationSection, count, ...(addContainerChild ? [addContainerChild] : []), add, ...(addSpecificIndex ? [addSpecificIndex] : []), copyProperty, removeProperty, view); return item;
  });
  const itemByPath = new Map(propertyPaths.map((path, index) => [path, propertyItems[index]!]));
  const roots: HTMLLIElement[] = [];
  propertyPaths.forEach((path) => {
    const item = itemByPath.get(path)!;
    const parentPath = propertyPaths
      .filter((candidate) => candidate !== path && path.startsWith(`${candidate}.`))
      .sort((left, right) => right.length - left.length)[0];
    const parent = parentPath ? itemByPath.get(parentPath) : undefined;
    if (!parent) { roots.push(item); return; }
    let children = Array.from(parent.children).find((child): child is HTMLUListElement => child instanceof HTMLUListElement && child.classList.contains("schema-property-children"));
    if (!children) { children = document.createElement("ul"); children.className = "schema-property-children"; parent.append(children); }
    children.append(item);
  });
  schemaPropertyTree.replaceChildren(...roots);
  schemaPropertyTree.scrollTop = propertyTreeScrollTop;
  if (schemaEditor) schemaEditor.scrollTop = schemaEditorScrollTop;
  const existing = schemas.find((schema) => schema.id === draft.id);
  const candidate = { ...draft, id: existing?.id ?? createSchema(draft.name, 1, draft.document).id };
  if (schemaEditorParent) {
    const parents = schemas.filter((schema) => schema.id !== candidate.id);
    schemaEditorParent.replaceChildren(Object.assign(document.createElement("option"), { value:"", textContent:"No parent" }), ...parents.map((schema) => Object.assign(document.createElement("option"), { value:schema.id, textContent:`${schema.name} v${schema.version}` })));
    schemaEditorParent.value = draft.parentSchemaId ?? "";
  }
  const parent = draft.parentSchemaId ? schemas.find((schema) => schema.id === draft.parentSchemaId) : undefined;
  if (schemaInheritanceProvenance) schemaInheritanceProvenance.textContent = parent ? `Inherited rules originate in ${parent.name} v${parent.version}. Local rules override only after conflicts are resolved.` : "Local schema only";
  if (schemaRuleOverrides) schemaRuleOverrides.hidden = !parent;
  if (schemaRuleOverrideList) schemaRuleOverrideList.replaceChildren(...Object.keys(parent?.document.properties ?? {}).map((property) => {
    const label = document.createElement("label"); const select = document.createElement("select");
    select.setAttribute("aria-label", `${property} inherited rule override`);
    select.replaceChildren(...(["inherit", "enabled", "disabled"] as const).map((state) => Object.assign(document.createElement("option"), { value:state, textContent:state === "inherit" ? "Inherit" : state === "enabled" ? "Enabled in this schema" : "Disabled in this schema" })));
    select.value = draft.inheritedRuleOverrides?.[property] ?? "inherit";
    select.addEventListener("change", () => { if (schemaDraft) { schemaDraft = { ...schemaDraft, inheritedRuleOverrides:{ ...(schemaDraft.inheritedRuleOverrides ?? {}), [property]:select.value as "inherit" | "enabled" | "disabled" } }; renderSchemaDraft(); } });
    label.append(`${property}: `, select); return label;
  }));
  renderSchemaInheritancePresentation(draft);
  const candidates = [...schemas.filter((schema) => schema.id !== candidate.id), candidate];
  const inheritanceError = schemaInheritanceError(candidate, candidates) ?? schemaInheritanceConflict(candidate, candidates);
  const rename = inspectSchemaRename(existing ?? candidate, schemas, draft.name);
  const ready = Boolean(rename.ready && Object.keys(draft.document.properties ?? {}).length && !inheritanceError);
  const reason = !rename.ready ? rename.assistance : !Object.keys(draft.document.properties ?? {}).length ? "Add at least one property" : inheritanceError ?? "Ready to save";
  schemaEditorNameAssistance.textContent = rename.assistance;
  if (saveSchemaButton) saveSchemaButton.disabled = !ready;
  if (saveSchemaButton) saveSchemaButton.textContent = storedSchema?.published === false || !storedSchema ? "Publish schema" : "Publish revision";
  if (saveSchemaReason) saveSchemaReason.textContent = reason;
  const historyVersions = storedSchema ? schemaRevisionChoices(storedSchema) : [];
  if (schemaRevisionSelector) {
    schemaRevisionSelector.replaceChildren(...historyVersions.map((version) => Object.assign(document.createElement("option"), { value:String(version), textContent:`Revision ${version}` })));
    schemaRevisionSelector.disabled = historyVersions.length === 0;
  }
  if (duplicateSchemaRevisionButton) duplicateSchemaRevisionButton.disabled = historyVersions.length === 0;
  if (restoreSchemaRevisionButton) restoreSchemaRevisionButton.disabled = historyVersions.length === 0;
  buildHistoricalSpecificationButton.disabled = historyVersions.length === 0;
  buildHistoricalSpecificationButton.onclick = storedSchema && historyVersions.length
    ? () => openSchemaSpecification(storedSchema, `historical:${Number(schemaRevisionSelector?.value)}`, buildHistoricalSpecificationButton)
    : null;
  if (schemaRevisionComparison) schemaRevisionComparison.textContent = historyVersions.length ? `Select one historical revision to compare with current revision ${storedSchema?.version}.` : "No historical revisions.";
}

function openSchemaSpecification(source: SchemaDefinition, surface: `published:${number}` | `historical:${number}` | "working-draft", trigger: HTMLButtonElement): void {
  schemaSpecificationBuilder.hidden = false;
  if (schemaEditor) schemaEditor.hidden = true;
  if (schemaDetailEmpty) schemaDetailEmpty.hidden = true;
  renderSchemaSpecificationBuilder(schemaSpecificationBuilder, source, schemas, surface, () => {
    schemaSpecificationBuilder.hidden = true;
    renderSchemaDraft();
    trigger.focus({ preventScroll:true });
  }, {
    async writeRich(html, plain) {
      if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") throw new Error("Rich clipboard unavailable");
      await navigator.clipboard.write([new ClipboardItem({
        "text/html":new Blob([html], { type:"text/html" }),
        "text/plain":new Blob([plain], { type:"text/plain" }),
      })]);
    },
    async writePlain(plain) {
      if (!navigator.clipboard?.writeText) throw new Error("Plain clipboard unavailable");
      await navigator.clipboard.writeText(plain);
    },
  });
}

type DisplayedSchemaRule = { path: string; rule: NonNullable<SchemaDefinition["attachedRules"]>[number]; origin: SchemaDefinition; state: "active-inherited" | "disabled-inherited" | "explicitly-reenabled" | "local" };

function renderSchemaInheritancePresentation(draft: SchemaDefinition): void {
  const ancestors: SchemaDefinition[] = [];
  const seen = new Set<string>([draft.id]);
  let parentId = draft.parentSchemaId;
  while (parentId && !seen.has(parentId)) {
    seen.add(parentId);
    const parent = schemas.find((schema) => schema.id === parentId);
    if (!parent) break;
    ancestors.push(parent);
    parentId = parent.parentSchemaId;
  }
  const inherited = ancestors.flatMap((origin) => (origin.attachedRules ?? []).map((rule): DisplayedSchemaRule => {
    const override = rule.propertyPath ? draft.inheritedRuleOverrides?.[rule.propertyPath] : undefined;
    return { path:rule.propertyPath ?? "root", rule, origin, state:override === "disabled" ? "disabled-inherited" : override === "enabled" ? "explicitly-reenabled" : "active-inherited" };
  }));
  const local = (draft.attachedRules ?? []).map((rule): DisplayedSchemaRule => ({ path:rule.propertyPath ?? "root", rule, origin:draft, state:"local" }));
  const groups: Record<DisplayedSchemaRule["state"], readonly DisplayedSchemaRule[]> = {
    "active-inherited":inherited.filter((entry) => entry.state === "active-inherited" && entry.rule.enabled !== false),
    "disabled-inherited":inherited.filter((entry) => entry.state === "disabled-inherited" || (entry.state === "active-inherited" && entry.rule.enabled === false)),
    "explicitly-reenabled":inherited.filter((entry) => entry.state === "explicitly-reenabled"),
    local,
  };
  const labels: Record<DisplayedSchemaRule["state"], string> = {
    "active-inherited":"Active inherited",
    "disabled-inherited":"Disabled inherited",
    "explicitly-reenabled":"Explicitly re-enabled",
    local:"Local",
  };
  schemaInheritedRuleGroups.hidden = ancestors.length === 0;
  schemaEffectiveRulePreview.hidden = ancestors.length === 0;
  schemaInheritedRuleGroups.replaceChildren(...(["active-inherited", "disabled-inherited", "explicitly-reenabled", "local"] as const).map((state) => {
    const group = document.createElement("section"); group.dataset.inheritedRuleGroup = state;
    const entries = groups[state]; const heading = document.createElement("h5"); heading.textContent = `${labels[state]} (${entries.length})`;
    const list = document.createElement("ul");
    const empty = state === "local" ? "No local rules." : state === "explicitly-reenabled" ? "No explicitly re-enabled inherited rules." : `No ${labels[state].toLowerCase()} rules.`;
    list.replaceChildren(...(entries.length ? entries.map((entry) => Object.assign(document.createElement("li"), { textContent:displaySchemaRule(entry) })) : [Object.assign(document.createElement("li"), { textContent:empty })]));
    group.append(heading, list); return group;
  }));
  const effective = [...groups["active-inherited"], ...groups["explicitly-reenabled"], ...groups.local];
  const previewHeading = document.createElement("h4"); previewHeading.textContent = "Effective-rule preview";
  const previewList = document.createElement("ul");
  previewList.replaceChildren(...(effective.length ? effective.map((entry) => Object.assign(document.createElement("li"), { textContent:`${entry.path} · ${schemaRuleLabel(entry)} v${entry.rule.version} · ${entry.state === "local" ? "local" : `inherited from ${entry.origin.name} v${entry.origin.version}`}` })) : [Object.assign(document.createElement("li"), { textContent:"No effective rules." })]));
  schemaEffectiveRulePreview.replaceChildren(previewHeading, previewList);
}

function displaySchemaRule(entry: DisplayedSchemaRule): string {
  return `${schemaRuleLabel(entry)} v${entry.rule.version} · ${entry.path} · ${entry.origin.name} v${entry.origin.version}`;
}

function schemaRuleLabel(entry: DisplayedSchemaRule): string {
  return reusableSchemaRules.find((candidate) => candidate.id === entry.rule.id)?.name ?? entry.rule.id;
}

function schemaDocumentFromValue(value: unknown): SchemaDefinition["document"] {
  if (Array.isArray(value)) {
    return { type: "array", items: value.length ? schemaDocumentFromValue(value[0]) : {} };
  }
  if (value && typeof value === "object") {
    return {
      type: "object",
      properties: Object.fromEntries(Object.entries(value).map(([name, child]) => [name, schemaDocumentFromValue(child)])),
    };
  }
  const primitiveType = typeof value;
  return { type: primitiveType === "string" || primitiveType === "number" || primitiveType === "boolean" ? primitiveType : "string" };
}

function openSchemaFromSource(source: { name: string; sourceId: string; eventName: string; payload: unknown; label: string }): void {
  const document = schemaDocumentFromValue(source.payload);
  const objectDocument = document.type === "object"
    ? document
    : { type: "object" as const, properties: { value: document } };
  schemaDraft = {
    ...createSchema(`${source.name} schema`, 1, objectDocument),
    assignments: [{ sourceId: source.sourceId, eventName: source.eventName, target: "payload" }],
  };
  selectedSchemaPropertyPath = Object.keys(objectDocument.properties ?? {})[0] ?? "value";
  showDataLayerView("Schemas");
  renderSchemaDraft();
  if (schemaResult) schemaResult.textContent = `${source.label} fields loaded into a new schema draft.`;
  schemaEditorName?.focus({ preventScroll: true });
}

function openNewSchemaEditor(): void {
  schemaDraft = createSchema("", 1, { type: "object" });
  renderSchemaDraft(); schemaEditorName?.focus({ preventScroll: true });
}

function persistSchemaLibrary(): void {
  localStorage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, serializeSchemaLibrary(schemas));
}

function schemaEditorDraft(schema: SchemaDefinition): SchemaDefinition {
  const draft = schema.workingDraft;
  if (!draft) return structuredClone(schema);
  const { attachedRules: _attachedRules, parentSchemaId: _parentSchemaId, inheritedRuleOverrides: _overrides, documentation: _documentation, ...current } = structuredClone(schema);
  return {
    ...current,
    name:draft.name ?? current.name,
    document:structuredClone(draft.document),
    assignments:structuredClone(draft.assignments),
    ...(draft.attachedRules !== undefined ? { attachedRules:structuredClone(draft.attachedRules) } : {}),
    ...(draft.parentSchemaId !== undefined ? { parentSchemaId:draft.parentSchemaId } : {}),
    ...(draft.inheritedRuleOverrides !== undefined ? { inheritedRuleOverrides:structuredClone(draft.inheritedRuleOverrides) } : {}),
    ...(draft.documentation !== undefined ? { documentation:structuredClone(draft.documentation) } : {}),
  };
}

function persistSchemaEditorDraft(change?: string): void {
  if (!schemaDraft) return;
  const stored = schemas.find((schema) => schema.id === schemaDraft?.id);
  if (!stored) return;
  const changes: Partial<Pick<SchemaWorkingDraft, "document" | "assignments" | "attachedRules" | "parentSchemaId" | "inheritedRuleOverrides" | "documentation">> = {
    document:schemaDraft.document,
    assignments:schemaDraft.assignments,
    attachedRules:schemaDraft.attachedRules,
    parentSchemaId:schemaDraft.parentSchemaId,
    inheritedRuleOverrides:schemaDraft.inheritedRuleOverrides,
    documentation:schemaDraft.documentation,
  };
  const renamed = proposeSchemaWorkingDraftName(stored, schemaDraft.name);
  const updated = updateSchemaWorkingDraft(renamed, changes, change);
  schemas = schemas.map((schema) => schema.id === updated.id ? updated : schema);
  persistSchemaLibrary(); renderSchemas();
}

function openSchemaPropertyCopyReview(path:string, trigger:HTMLButtonElement):void {
  if(!schemaDraft)return;
  const stored=schemas.find(({id})=>id===schemaDraft?.id);
  if(!stored)return;
  const source=stored.workingDraft
    ? schemaPropertyCopySource(stored,{surface:"working draft"})
    : schemaPropertyCopySource(stored,{surface:"current"});
  const sources=[source,...(stored.workingDraft?[schemaPropertyCopySource(stored,{surface:"current"})]:[]),...schemaRevisionChoices(stored).map((version)=>schemaPropertyCopySource(stored,{surface:"historical",version}))];
  const editorScroll=schemaEditor?.scrollTop??0;const treeScroll=schemaPropertyTree.scrollTop;
  renderSchemaPropertyCopyReview(schemaPropertyCopyDialog,{
    source,sources,selectedPath:path,destinations:schemas.filter(({id})=>id!==stored.id),schemas,reusableRuleIds:reusableSchemaRules.map(({id})=>id),trigger,
    onApply:(transaction)=>{
      schemas=schemas.map((schema)=>schema.id===transaction.schema.id?transaction.schema:schema);lastSchemaPropertyCopy=transaction;
      persistSchemaLibrary();renderSchemas();renderSchemaWorkflowRows();renderSchemaDraft();undoSchemaPropertyCopyButton.hidden=false;
      schemaPropertyCopyFeedback.textContent=`Copied ${path} from ${source.label} to ${transaction.schema.name}. Published revisions are unchanged.`;
    },
    onClose:()=>{if(schemaEditor)schemaEditor.scrollTop=editorScroll;schemaPropertyTree.scrollTop=treeScroll;Array.from(schemaPropertyTree.querySelectorAll<HTMLButtonElement>("button")).find((button)=>button.getAttribute("aria-label")===`Copy ${path} to another schema`)?.focus({preventScroll:true});},
  });
}

undoSchemaPropertyCopyButton.addEventListener("click",()=>{
  if(!lastSchemaPropertyCopy)return;
  const restored=undoSchemaPropertyCopy(lastSchemaPropertyCopy).schema;
  schemas=schemas.map((schema)=>schema.id===restored.id?restored:schema);persistSchemaLibrary();renderSchemas();renderSchemaWorkflowRows();renderSchemaDraft();
  schemaPropertyCopyFeedback.textContent=`Undid property copy to ${restored.name}; the pre-copy working draft was restored.`;
  undoSchemaPropertyCopyButton.hidden=true;lastSchemaPropertyCopy=undefined;
});

function requestSchemaDocumentationRemoval(path: string, trigger: HTMLElement): void {
  pendingSchemaDocumentationRemoval = { path, trigger };
  schemaDocumentationRemovalSummary.textContent = `${path} documentation will be removed from the working draft. The schema property and validation rules remain unchanged.`;
  schemaDocumentationRemovalDialog.showModal(); schemaDocumentationRemovalHeading.focus({ preventScroll:true });
}

function closeSchemaDocumentationRemoval(restoreFocus = true): void {
  const trigger = pendingSchemaDocumentationRemoval?.trigger;
  pendingSchemaDocumentationRemoval = undefined;
  if (schemaDocumentationRemovalDialog.open) schemaDocumentationRemovalDialog.close();
  if (restoreFocus) trigger?.focus({ preventScroll:true });
}

confirmSchemaDocumentationRemoval.addEventListener("click", () => {
  if (!schemaDraft || !pendingSchemaDocumentationRemoval) return;
  const path = pendingSchemaDocumentationRemoval.path;
  closeSchemaDocumentationRemoval(false);
  schemaDraft = { ...schemaDraft, documentation:setPropertyDocumentation(schemaDraft.documentation ?? {}, path, { displayName:"", description:"" }) };
  persistSchemaEditorDraft(`Remove property documentation ${path}`); renderSchemaDraft();
});
cancelSchemaDocumentationRemoval.addEventListener("click", () => closeSchemaDocumentationRemoval());
schemaDocumentationRemovalDialog.addEventListener("cancel", (event) => { event.preventDefault(); closeSchemaDocumentationRemoval(); });

function focusAfterSchemaPropertyRemoval(path: string, previousPaths: readonly string[]): void {
  const dotted = path.slice(1).replaceAll("/", ".");
  const removedIndex = previousPaths.indexOf(dotted);
  const outsideSubtree = previousPaths.filter((candidate) => candidate !== dotted && !candidate.startsWith(`${dotted}.`));
  const destination = outsideSubtree.find((candidate) => previousPaths.indexOf(candidate) > removedIndex) ?? outsideSubtree.at(-1);
  if (!destination) { addSchemaPropertyButton?.focus({ preventScroll:true }); return; }
  const row = schemaPropertyTree.querySelector<HTMLElement>(`[data-schema-property-path="${CSS.escape(destination)}"]`);
  row?.focus({ preventScroll:true }); row?.scrollIntoView({ block:"nearest" });
}

function applySchemaPropertyRemoval(path: string): void {
  if (!schemaDraft) return;
  const previousPaths = schemaDocumentPaths(schemaDraft.document);
  const removal = removeSchemaProperty(schemaDraft.document, schemaDraft.attachedRules ?? [], path, schemaDraft.documentation);
  lastSchemaPropertyRemoval = removal;
  schemaDraft = { ...schemaDraft, document:removal.document, attachedRules:removal.attachedRules, ...(removal.documentation !== undefined ? { documentation:removal.documentation } : {}) };
  selectedSchemaPropertyPath = previousPaths.find((candidate) => candidate !== path.slice(1).replaceAll("/", ".")) ?? "example";
  persistSchemaEditorDraft(`Remove property ${removal.propertyPath} and property-specific constraints`);
  renderSchemaDraft();
  schemaPropertyRemovalFeedback.textContent = `Removed ${removal.propertyPath} from the working draft. Undo is available.`;
  undoSchemaPropertyRemovalButton.hidden = false;
  focusAfterSchemaPropertyRemoval(removal.propertyPath, previousPaths);
}

function requestSchemaPropertyRemoval(path: string, trigger: HTMLButtonElement): void {
  if (!schemaDraft) return;
  const inspection = inspectSchemaPropertyRemoval(schemaDraft.document, schemaDraft.attachedRules ?? [], path, schemaDraft.documentation);
  if (!inspection.requiresConfirmation) { applySchemaPropertyRemoval(path); return; }
  pendingSchemaPropertyRemoval = { path, trigger };
  const descendants = inspection.descendants.length ? inspection.descendants.join(", ") : "none";
  const rules = inspection.affectedRuleAttachments.length
    ? inspection.affectedRuleAttachments.map((rule) => rule.name ?? rule.id).join(", ")
    : "none";
  const documentation = inspection.affectedDocumentationPaths?.length ? inspection.affectedDocumentationPaths.join(", ") : "none";
  schemaPropertyRemovalSummary.textContent = `${inspection.propertyPath} contains ${inspection.descendants.length} descendants: ${descendants}. ${inspection.affectedRuleAttachments.length} affected rule attachments: ${rules}. Documentation entries: ${documentation}. No changes occur until confirmation.`;
  schemaPropertyRemovalDialog.showModal(); schemaPropertyRemovalHeading.focus({ preventScroll:true });
}

function closeSchemaPropertyRemovalDialog(restoreFocus = true): void {
  const trigger = pendingSchemaPropertyRemoval?.trigger;
  pendingSchemaPropertyRemoval = undefined;
  if (schemaPropertyRemovalDialog.open) schemaPropertyRemovalDialog.close();
  if (restoreFocus) trigger?.focus({ preventScroll:true });
}

confirmSchemaPropertyRemovalButton.addEventListener("click", () => {
  const path = pendingSchemaPropertyRemoval?.path;
  closeSchemaPropertyRemovalDialog(false);
  if (path) applySchemaPropertyRemoval(path);
});
cancelSchemaPropertyRemovalButton.addEventListener("click", () => closeSchemaPropertyRemovalDialog());
schemaPropertyRemovalDialog.addEventListener("cancel", (event) => { event.preventDefault(); closeSchemaPropertyRemovalDialog(); });
undoSchemaPropertyRemovalButton.addEventListener("click", () => {
  if (!schemaDraft || !lastSchemaPropertyRemoval) return;
  const restored = undoSchemaPropertyRemoval(lastSchemaPropertyRemoval);
  const path = lastSchemaPropertyRemoval.propertyPath;
  schemaDraft = { ...schemaDraft, document:restored.document, attachedRules:restored.attachedRules, ...(restored.documentation !== undefined ? { documentation:restored.documentation } : {}) };
  selectedSchemaPropertyPath = path.slice(1).replaceAll("/", ".");
  persistSchemaEditorDraft(`Undo property removal ${path}`); renderSchemaDraft();
  schemaPropertyRemovalFeedback.textContent = `Restored ${path} with its prior definition and tree position.`;
  undoSchemaPropertyRemovalButton.hidden = true; lastSchemaPropertyRemoval = undefined;
  schemaPropertyTree.querySelector<HTMLElement>(`[data-schema-property-path="${CSS.escape(selectedSchemaPropertyPath)}"]`)?.focus({ preventScroll:true });
});

function schemaParentDocuments(): SchemaDefinition["document"][] {
  const documents: SchemaDefinition["document"][] = [];
  const visited = new Set<string>();
  let parentId = schemaDraft?.parentSchemaId;
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = schemas.find(({ id }) => id === parentId);
    if (!parent) break;
    documents.push(parent.document); parentId = parent.parentSchemaId;
  }
  return documents;
}

function manualPropertyDefinition(): ManualPropertyDefinition {
  const type = schemaManualPropertyType.value as ManualPropertyValueType;
  const arrayItemType = schemaManualArrayItemType.value as ManualArrayItemType | "";
  if (pendingManualPropertyContext) {
    return contextualManualPropertyDefinition(
      pendingManualPropertyContext.parentPath,
      schemaManualPropertyChildName.value,
      type,
      type === "array" && arrayItemType ? arrayItemType : undefined,
    );
  }
  return {
    path:schemaManualPropertyPath.value,
    type,
    ...(type === "array" && arrayItemType ? { arrayItemType } : {}),
  };
}

function renderManualPropertyForm(): void {
  if (!schemaDraft) return;
  const definition = manualPropertyDefinition();
  const inspection = inspectManualProperty(schemaDraft.document, schemaParentDocuments(), definition);
  const contextual = Boolean(pendingManualPropertyContext);
  schemaManualPropertyPathLabel.hidden = contextual;
  schemaManualPropertyPath.hidden = contextual;
  schemaManualPropertyChildNameLabel.hidden = !contextual;
  schemaManualPropertyChildName.hidden = !contextual;
  schemaManualPropertyParentContext.hidden = !contextual;
  schemaManualPropertyParentContext.textContent = pendingManualPropertyContext ? `Parent path: ${pendingManualPropertyContext.parentPath}` : "";
  schemaManualArrayTypeGroup.hidden = definition.type !== "array";
  schemaManualPropertyPreview.textContent = definition.path.trim()
    ? `Normalized path: ${inspection.normalizedPath || "none"}. ${manualPropertyPreview(definition)}. Missing object path: ${inspection.missingObjectPath.join(", ") || "none"}.`
    : "Normalized path: none. Missing object path: none.";
  schemaManualPropertyAssistance.textContent = inspection.result === "blocked" ? inspection.assistance : "Ready to add";
  confirmSchemaManualPropertyButton.disabled = inspection.result === "blocked";
  goToExistingSchemaPropertyButton.hidden = inspection.result !== "blocked" || !inspection.existingPath;
  if (inspection.result === "blocked" && inspection.existingPath) {
    goToExistingSchemaPropertyButton.textContent = inspection.assistance;
    goToExistingSchemaPropertyButton.dataset.schemaPropertyPath = inspection.existingPath;
  } else delete goToExistingSchemaPropertyButton.dataset.schemaPropertyPath;
}

function closeManualPropertyForm(restoreFocus = true): void {
  const trigger = pendingManualPropertyContext?.trigger;
  pendingManualPropertyContext = undefined;
  if (schemaManualPropertyDialog.open) schemaManualPropertyDialog.close();
  if (restoreFocus) (trigger ?? addSchemaPropertyButton)?.focus({ preventScroll:true });
}

function focusSchemaPropertyRule(path: string): void {
  const trigger = Array.from(schemaPropertyTree.querySelectorAll<HTMLButtonElement>("button.schema-property-add-rule"))
    .find((button) => button.getAttribute("aria-label") === `Add rule for ${path}`);
  trigger?.scrollIntoView({ block:"nearest" });
  trigger?.focus({ preventScroll:true });
}

function openManualPropertyForm(): void {
  if (!schemaDraft) return;
  pendingManualPropertyContext = undefined;
  schemaManualPropertyHeading.textContent = confirmSchemaManualPropertyButton.textContent = "Add property";
  schemaManualPropertyPath.value = ""; schemaManualPropertyType.value = "string"; schemaManualArrayItemType.value = "";
  renderManualPropertyForm(); schemaManualPropertyDialog.showModal(); schemaManualPropertyPath.focus({ preventScroll:true });
}

function openContextualManualPropertyForm(parentPath: string, trigger: HTMLButtonElement): void {
  if (!schemaDraft) return;
  pendingManualPropertyContext = { parentPath, trigger };
  schemaManualPropertyHeading.textContent = trigger.textContent || "Add child property";
  confirmSchemaManualPropertyButton.textContent = "Add property";
  schemaManualPropertyChildName.value = ""; schemaManualPropertyType.value = "string"; schemaManualArrayItemType.value = "";
  renderManualPropertyForm(); schemaManualPropertyDialog.showModal(); schemaManualPropertyChildName.focus({ preventScroll:true });
}

schemaManualPropertyPath.addEventListener("input", renderManualPropertyForm);
schemaManualPropertyChildName.addEventListener("input", renderManualPropertyForm);
schemaManualPropertyType.addEventListener("change", renderManualPropertyForm);
schemaManualArrayItemType.addEventListener("change", renderManualPropertyForm);
schemaManualPropertyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!schemaDraft) return;
  const definition = manualPropertyDefinition();
  const inspection = inspectManualProperty(schemaDraft.document, schemaParentDocuments(), definition);
  if (inspection.result !== "ready") { renderManualPropertyForm(); return; }
  const path = inspection.normalizedPath.slice(1).replaceAll("/", ".");
  schemaDraft = { ...schemaDraft, document:addManualProperty(schemaDraft.document, schemaParentDocuments(), definition) };
  selectedSchemaPropertyPath = path;
  persistSchemaEditorDraft(`Add manual property ${inspection.normalizedPath}`);
  closeManualPropertyForm(false); renderSchemaDraft(); focusSchemaPropertyRule(path);
});
cancelSchemaManualPropertyButton.addEventListener("click", () => closeManualPropertyForm());
schemaManualPropertyDialog.addEventListener("cancel", (event) => { event.preventDefault(); closeManualPropertyForm(); });
goToExistingSchemaPropertyButton.addEventListener("click", () => {
  const path = goToExistingSchemaPropertyButton.dataset.schemaPropertyPath;
  if (!path) return;
  const displayPath = path.replace(/^\//, "").replaceAll("/", ".");
  selectedSchemaPropertyPath = displayPath; closeManualPropertyForm(false); renderSchemaDraft(); focusSchemaPropertyRule(displayPath);
});

function guidedDocumentTypes(
  document: SchemaDefinition["document"],
  prefix = "",
): Record<string, GuidedValueType> {
  return Object.entries(document.properties ?? {}).reduce<Record<string, GuidedValueType>>((types, [name, child]) => {
    const path = prefix ? `${prefix}.${name}` : name;
    const type = child.type === "string" ? "String"
      : child.type === "number" ? "Number"
        : child.type === "boolean" ? "Boolean"
          : child.type === "array" ? "Array"
            : child.type === "object" ? "Object"
              : undefined;
    if (type) types[path] = type;
    return { ...types, ...guidedDocumentTypes(child, path) };
  }, {});
}

function guidedSchemaCandidate(schema: SchemaDefinition, continueWorkingDraft = false) {
  const editable = continueWorkingDraft ? schemaEditorDraft(schema) : schema;
  return {
    id:schema.id,
    name:schema.name,
    version:schema.version,
    target:editable.assignments[0]?.target ?? "payload" as const,
    propertyTypes:guidedDocumentTypes(editable.document),
    assignments:editable.assignments.map((assignment) => ({
      ...(assignment.id ? { id:assignment.id } : {}),
      ...(assignment.name ? { name:assignment.name } : {}),
      sourceId:assignment.sourceId,
      eventName:assignment.eventName,
      target:assignment.target,
      ...(assignment.domainCondition ? { domainCondition:assignment.domainCondition } : {}),
      ...(assignment.pathnameCondition ? { pathnameCondition:assignment.pathnameCondition } : {}),
      ...(assignment.pathConditions ? { pathConditions:assignment.pathConditions } : {}),
      ...(assignment.priority !== undefined ? { priority:assignment.priority } : {}),
      ...(assignment.versionPolicy ? { versionPolicy:assignment.versionPolicy } : {}),
      ...(assignment.enabled !== undefined ? { enabled:assignment.enabled } : {}),
      ...(continueWorkingDraft && !schema.assignments.some((published) =>
        published.id && assignment.id
          ? published.id === assignment.id
          : guidedAssignmentsMatch(published, assignment))
        ? { pending:true }
        : {}),
    })),
  };
}

function guidedSchemaCandidates() {
  return assignableSchemas(schemas).map((schema) => guidedSchemaCandidate(schema));
}

function guidedEvent(event: LiveEvent) {
  return {
    id:event.id,
    name:event.name,
    sourceId:event.sourceId,
    pageUrl:event.pageUrl ?? liveObserverState.pageUrl,
    payload:event.payload && typeof event.payload === "object" && !Array.isArray(event.payload)
      ? event.payload as Record<string, unknown>
      : { value:event.payload },
  };
}

function openGuidedValidationForEvent(event: LiveEvent, schema?: SchemaDefinition): void {
  guidedValidationFlow.open(guidedEvent(event), schema ? guidedSchemaCandidate(schema, true) : undefined);
  if (liveObserverElements.eventInspector) liveObserverElements.eventInspector.hidden = true;
}

function openGuidedValidationForProperty(event: LiveEvent, path: string): void {
  const inspector = liveObserverElements.eventInspector; const feed = liveObserverElements.eventFeed;
  guidedPropertyReturn = { eventId:event.id, path, expanded:Array.from(inspector?.querySelectorAll<HTMLDetailsElement>("details[open][data-property-path]") ?? []).map(({ dataset }) => dataset.propertyPath!).filter(Boolean), inspectorScroll:inspector?.scrollTop ?? 0, feedScroll:feed?.scrollTop ?? 0 };
  const schema = selectedGuidedContinuation(guidedContinuationSelections, event, schemas);
  guidedValidationFlow.openProperty(guidedEvent(event), path, schema ? guidedSchemaCandidate(schema, true) : undefined);
  if (inspector) inspector.hidden = true;
}

function openLivePropertyDeclaration(event: LiveEvent, path: string, trigger: HTMLButtonElement): void {
  const selected = selectedGuidedContinuation(guidedContinuationSelections, event, schemas);
  if (!liveObserverElements.eventInspector) return;
  openLiveSchemaPropertyDeclarationDialog({
    inspector:liveObserverElements.eventInspector,
    trigger,
    payload:event.payload,
    concretePath:path,
    ...(selected ? { selected } : {}),
    destinations:assignableSchemas(schemas).filter(({ workingDraft }) => Boolean(workingDraft)),
    confirm:(schema, declaration) => {
      schemas = schemas.map((candidate) => candidate.id === schema.id ? addLiveSchemaPropertyDeclaration(candidate, declaration) : candidate);
      persistSchemaLibrary();
      renderSchemas();
      renderSchemaWorkflowRows();
      return () => {
        openLiveInspector(event.id, true);
        const actions = Array.from(document.querySelectorAll<HTMLButtonElement>('button[data-action="add-property-to-schema"]'));
        (actions.find((button) => button.dataset.propertyPath === declaration.concretePath)
          ?? actions.find((button) => canonicalLivePropertyPath(button.dataset.propertyPath ?? "") === declaration.canonicalPath))
          ?.focus({ preventScroll:true });
      };
    },
  });
}

function restoreGuidedPropertyReturn(): void {
  const snapshot = guidedPropertyReturn; if (!snapshot) return;
  openLiveInspector(snapshot.eventId, true);
  const inspector = liveObserverElements.eventInspector; const feed = liveObserverElements.eventFeed;
  const details = Array.from(inspector?.querySelectorAll<HTMLDetailsElement>("details[data-property-path]") ?? []);
  for (const path of snapshot.expanded) details.find(({ dataset }) => dataset.propertyPath === path)?.setAttribute("open", "");
  if (inspector) inspector.scrollTop = snapshot.inspectorScroll; if (feed) feed.scrollTop = snapshot.feedScroll;
  const focusTarget = Array.from(inspector?.querySelectorAll<HTMLButtonElement>('button[data-action="add-property-validation"]') ?? [])
    .find((button) => button.getAttribute("aria-label") === `Add validation for ${snapshot.path}`);
  focusTarget?.focus({ preventScroll:true });
  if (focusTarget) requestAnimationFrame(() => focusTarget.focus({ preventScroll:true }));
}

function persistGuidedContinuation(event: Pick<LiveEvent, "sourceId" | "name">, schemaId: string): void {
  guidedContinuationSelections = selectGuidedContinuation(guidedContinuationSelections, event, schemaId);
  localStorage.setItem(GUIDED_CONTINUATION_STORAGE_KEY, JSON.stringify(guidedContinuationSelections));
}

function openGuidedDraft(schema: SchemaDefinition): void {
  showDataLayerView("Schemas"); schemaDraft = schemaEditorDraft(schema); renderSchemaDraft();
}

function openGuidedContinuationPicker(event: LiveEvent): void {
  const inspector = liveObserverElements.eventInspector; if (!inspector) return;
  inspector.querySelector("#guided-continuation-schema-picker")?.remove();
  const trigger = inspector.querySelector<HTMLButtonElement>("#guided-draft-continuation button:last-of-type");
  const dialog = document.createElement("dialog"); dialog.id = "guided-continuation-schema-picker"; dialog.setAttribute("aria-labelledby", "guided-continuation-schema-picker-heading");
  const heading = document.createElement("h5"); heading.id = "guided-continuation-schema-picker-heading"; heading.tabIndex = -1; heading.textContent = "Choose schema destination";
  const choices = document.createElement("div"); choices.setAttribute("aria-label", "Schemas with working drafts");
  for (const schema of schemas.filter(({ workingDraft }) => Boolean(workingDraft))) {
    const choose = document.createElement("button"); choose.type = "button"; choose.textContent = `${schema.name} revision ${schema.version} · ${schema.workingDraft?.pendingChanges.length ?? 0} pending changes`;
    choose.addEventListener("click", () => {
      persistGuidedContinuation(event, schema.id); dialog.close(); dialog.remove(); openLiveInspector(event.id, true);
      liveObserverElements.eventInspector?.querySelector<HTMLButtonElement>('[data-action="add-property-validation"]')?.focus({ preventScroll:true });
    });
    choices.append(choose);
  }
  const cancel = document.createElement("button"); cancel.type = "button"; cancel.textContent = "Cancel";
  cancel.addEventListener("click", () => { dialog.close(); dialog.remove(); trigger?.focus({ preventScroll:true }); });
  dialog.append(heading, choices, cancel); inspector.append(dialog); dialog.showModal(); heading.focus({ preventScroll:true });
}

function guidedDraftContinuationForEvent(event: LiveEvent) {
  const schema = selectedGuidedContinuation(guidedContinuationSelections, event, schemas);
  if (!schema?.workingDraft) return undefined;
  return {
    schemaId:schema.id,
    schemaName:schema.name,
    schemaVersion:schema.version,
    pendingChanges:schema.workingDraft.pendingChanges.length,
    addProperty:() => openGuidedValidationForEvent(event, schema),
    review:() => openGuidedDraft(schema),
    publish:() => { openGuidedDraft(schema); saveSchemaButton?.click(); },
    useDifferent:() => openGuidedContinuationPicker(event),
  };
}

function finishGuidedValidationSave(result: PublishedGuidedValidation): void {
  const message = result.destination.kind === "new"
    ? `Draft ${result.schema.name} was created.`
    : `Validation was added to ${result.schema.name} draft.`;
  setLiveSessionMessage(message);
  const event = liveObserverState.events.find(({ sourceId, name }) => sourceId === result.assignment.sourceId && name === result.assignment.eventName);
  if (!event) return;
  persistGuidedContinuation(event, result.schema.id);
  openLiveInspector(event.id, true);
  if (guidedPropertyReturn) restoreGuidedPropertyReturn();
}

function persistPublishedGuidedValidation(result: PublishedGuidedValidation): void {
  const rule = result.schema.rules[0];
  if (!rule) return;
  const assignment: SchemaAssignment = {
    id:result.assignment.id,
    name:result.assignment.name,
    sourceId:result.assignment.sourceId,
    eventName:result.assignment.eventName,
    target:result.assignment.target,
    priority:result.assignment.priority,
    versionPolicy:result.assignment.versionPolicy,
    enabled:true,
    ...(result.assignment.domainCondition ? { domainCondition:result.assignment.domainCondition } : {}),
    ...(result.assignment.pathnameCondition ? { pathnameCondition:result.assignment.pathnameCondition } : {}),
    ...(result.assignment.pathConditions ? { pathConditions:result.assignment.pathConditions } : {}),
  };
  const ruleName = result.reusableRules[0]?.name ?? `${rule.path} requirement`;
  const attachedRule = guidedAttachedRule(rule, ruleName, `local-rule:${result.schema.id}:${rule.path}`);
  const previousSchema = result.destination.previousSchemaId
    ? schemas.find(({ id }) => id === result.destination.previousSchemaId)
    : undefined;
  const currentDraft = previousSchema?.workingDraft;
  const draftAssignments = currentDraft?.assignments ?? previousSchema?.assignments ?? [];
  const draftRules = currentDraft?.attachedRules ?? previousSchema?.attachedRules ?? [];
  const pendingAssignments = assignmentDraftAfterGuidedSave(
    draftAssignments,
    assignment,
    result.destination.assignmentAction,
  );
  const pendingDocument = mergeGuidedDocument(currentDraft?.document ?? previousSchema?.document ?? { type:"object" }, guidedPropertyDocument(rule.path, rule.expectedType));
  const pendingRules = [...draftRules.filter((candidate) => candidate.id !== attachedRule.id || candidate.propertyPath !== attachedRule.propertyPath), attachedRule];
  const schema = previousSchema
    ? updateSchemaWorkingDraft(previousSchema, { document:pendingDocument, assignments:pendingAssignments, attachedRules:pendingRules }, `Add ${rule.path} validation`)
    : {
      id:result.schema.id,
      name:result.schema.name,
      version:1,
      document:{ type:"object" as const },
      assignments:[],
      published:false,
      workingDraft:{ baseVersion:0, sourceVersion:0, document:pendingDocument, assignments:pendingAssignments, attachedRules:pendingRules, pendingChanges:[`Add ${rule.path} validation`] },
    };
  const nextSchemas = [...schemas.filter(({ id }) => id !== schema.id), schema];
  const publishedReusable = result.reusableRules[0];
  const reusableAttachmentRule = publishedReusable
    ? guidedAttachedRule({ ...rule, reusableRuleId:publishedReusable.id }, publishedReusable.name)
    : undefined;
  const nextRules: ReusableSchemaRule[] = publishedReusable
    ? [
      ...reusableSchemaRules.filter(({ id }) => id !== publishedReusable.id),
      {
        id:publishedReusable.id,
        name:publishedReusable.name,
        kind:publishedReusable.conditionGroup ? "Conditional validation" : reusableAttachmentRule?.operator ?? "Guided validation",
        version:publishedReusable.version,
        ...(reusableAttachmentRule?.operator ? { operator:reusableAttachmentRule.operator } : {}),
        ...(reusableAttachmentRule?.parameters !== undefined ? { parameters:reusableAttachmentRule.parameters } : {}),
        ...(reusableAttachmentRule?.severity ? { severity:reusableAttachmentRule.severity } : {}),
        ...(reusableAttachmentRule?.message !== undefined ? { message:reusableAttachmentRule.message } : {}),
        ...(reusableAttachmentRule?.enabled !== undefined ? { enabled:reusableAttachmentRule.enabled } : {}),
        ...(reusableAttachmentRule?.conditionGroup ? { conditionGroup:reusableAttachmentRule.conditionGroup } : {}),
        attachments:[schema.id],
      },
    ]
    : reusableSchemaRules;
  const previousSchemas = localStorage.getItem(SCHEMA_LIBRARY_STORAGE_KEY);
  const previousRules = localStorage.getItem(SCHEMA_RULE_STORAGE_KEY);
  try {
    localStorage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, serializeSchemaLibrary(nextSchemas));
    localStorage.setItem(SCHEMA_RULE_STORAGE_KEY, JSON.stringify(nextRules));
  } catch (error) {
    try {
      if (previousSchemas === null) localStorage.removeItem(SCHEMA_LIBRARY_STORAGE_KEY);
      else localStorage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, previousSchemas);
      if (previousRules === null) localStorage.removeItem(SCHEMA_RULE_STORAGE_KEY);
      else localStorage.setItem(SCHEMA_RULE_STORAGE_KEY, previousRules);
    } catch { /* Preserve the original storage failure. */ }
    throw error;
  }
  schemas = nextSchemas;
  reusableSchemaRules = nextRules;
  renderSchemas();
  renderSchemaWorkflowRows();
}

function withSchemaParent(schema: SchemaDefinition, parentSchemaId: string | undefined): SchemaDefinition {
  const { parentSchemaId: _previousParentSchemaId, ...withoutParent } = schema;
  return parentSchemaId ? { ...withoutParent, parentSchemaId } : withoutParent;
}

function defineSchemaProperty(document: SchemaDefinition["document"], path: readonly string[]): SchemaDefinition["document"] {
  const [name, ...rest] = path;
  if (!name) return document;
  const properties = document.properties ?? {};
  if (rest.length === 0) return { ...document, type:document.type ?? "object", properties:{ ...properties, [name]:properties[name] ?? { type:"string" } } };
  return { ...document, type:document.type ?? "object", properties:{ ...properties, [name]:defineSchemaProperty(properties[name] ?? { type:"object" }, rest) } };
}

function schemaPropertyType(path: string): SchemaPropertyType {
  const property = schemaDraft && schemaPropertyAt(schemaDraft.document, path, schemaParentDocuments());
  return property?.type === "number" || property?.type === "array" || property?.type === "object" || property?.type === "boolean" ? property.type : "string";
}

function closeSchemaPropertyRulePicker(): void {
  if (schemaPropertyRulePicker.open) schemaPropertyRulePicker.close();
  schemaRulePickerTrigger?.focus({ preventScroll:true });
  schemaRulePickerPath = undefined;
  schemaRuleConfiguration = undefined;
}

function configuredRuleInput(control: ReturnType<typeof ruleConfigurationControls>[number], configuration: RuleConfiguration, updateValidation: () => void): HTMLElement {
  const label = document.createElement("label");
  const input = control.inputType === "select" ? document.createElement("select") : document.createElement("input");
  input.id = `schema-local-rule-${control.key}`; label.htmlFor = input.id; label.textContent = `${control.label}${control.optional ? " (optional)" : ""}`;
  if (input instanceof HTMLInputElement) {
    input.type = control.inputType; if (control.minimum !== undefined) input.min = String(control.minimum); if (control.step !== undefined) input.step = String(control.step);
  } else input.append(Object.assign(document.createElement("option"), { value:"", textContent:"Choose a value" }), Object.assign(document.createElement("option"), { value:"true", textContent:"true" }), Object.assign(document.createElement("option"), { value:"false", textContent:"false" }));
  const current = control.key === "exactValue" ? configuration.exactValue
    : control.key === "pattern" ? configuration.pattern
      : control.key === "exactLength" ? configuration.exactLength
        : control.key === "minimum" ? configuration.minimum
          : control.key === "maximum" ? configuration.maximum
            : configuration.minimumItemCount;
  input.value = current;
  input.addEventListener("input", () => {
    if (control.key === "exactValue") configuration.exactValue = input.value;
    else if (control.key === "pattern") configuration.pattern = input.value;
    else if (control.key === "exactLength") configuration.exactLength = input.value;
    else if (control.key === "minimum") configuration.minimum = input.value;
    else if (control.key === "maximum") configuration.maximum = input.value;
    else if (control.key === "minimumItemCount") configuration.minimumItemCount = input.value;
    updateValidation();
  });
  const wrapper = document.createElement("div"); wrapper.append(label, input); return wrapper;
}

function createConfiguredSchemaRule(path: string, configuration: RuleConfiguration): void {
  if (!schemaDraft || !validateRuleConfiguration(configuration).ready) return;
  const details = configuredRuleDetails(configuration);
  const id = configuration.saveReusable ? `rule:${crypto.randomUUID()}` : `local-rule:${crypto.randomUUID()}`;
  const name = configuration.saveReusable ? configuration.reusableName.trim() : `${configuration.ruleType} for ${path}`;
  const rule: ReusableSchemaRule = {
    id, name, kind:configuration.ruleType, version:1, enabled:true,
    applicableType:configuration.propertyType,
    operator:details.operator,
    ...(details.parameters !== undefined ? { parameters:details.parameters } : {}),
    severity:configuration.severity,
    ...(configuration.message.trim() ? { message:configuration.message.trim() } : {}),
    ...(configuration.applyOnlyWhen ? { conditionGroup:{ operator:configuration.conditionGroupOperator, predicates:structuredClone(configuration.conditions) } } : {}),
    ...(configuration.saveReusable && configuration.description.trim() ? { description:configuration.description.trim() } : {}),
    ...(configuration.saveReusable && schemaDraft.id ? { attachments:[schemaDraft.id] } : {}),
  };
  if (configuration.saveReusable) {
    reusableSchemaRules = [...reusableSchemaRules.filter((candidate) => candidate.id !== id), rule];
    localStorage.setItem(SCHEMA_RULE_STORAGE_KEY, JSON.stringify(reusableSchemaRules));
    renderSchemaWorkflowRows();
  }
  closeSchemaPropertyRulePicker();
  attachReusableRule(path, rule);
  schemaPropertyTree.querySelector<HTMLButtonElement>(`button[aria-label="Add rule for ${CSS.escape(path)}"]`)?.focus({ preventScroll:true });
}

function currentConditionPayload(): unknown {
  return liveObserverState.events.find(({ id }) => id === liveObserverState.inspectorEventId)?.payload
    ?? liveObserverState.events.at(-1)?.payload
    ?? {};
}

function valueAtSchemaPath(value: unknown, path: string): { exists: boolean; value: unknown } {
  let current = value;
  for (const segment of path.split(".").filter(Boolean)) {
    if (current === null || typeof current !== "object" || !(segment in current)) return { exists:false, value:undefined };
    current = (current as Record<string, unknown>)[segment];
  }
  return { exists:true, value:current };
}

function initialConditionPredicate(consequencePath: string): ConditionalRulePredicate {
  const choices = schemaDraft ? schemaDocumentPaths(schemaDraft.document).filter((path) => path !== consequencePath) : [];
  const path = choices.find((candidate) => candidate === "page_type") ?? choices[0] ?? "";
  const detectedType = path ? schemaPropertyType(path) : "string";
  const observed = valueAtSchemaPath(currentConditionPayload(), path);
  return {
    propertyPath:path ? canonicalRulePropertyPath(path) : "",
    operator:"Equals",
    ...(observed.exists && (observed.value === null || ["string", "number", "boolean"].includes(typeof observed.value))
      ? { comparison:typedComparisonValue(observed.value as string | number | boolean | null) }
      : {}),
    detectedType,
  };
}

function renderConditionalRuleConfiguration(path: string, configuration: RuleConfiguration, refreshValidation: () => void): HTMLElement {
  const section = document.createElement("fieldset"); section.id = "schema-local-rule-conditions";
  section.append(Object.assign(document.createElement("legend"), { textContent:"Apply only when" }));
  const groupLabel = document.createElement("label"); const group = document.createElement("select");
  group.id = "schema-local-rule-condition-group"; groupLabel.htmlFor = group.id; groupLabel.textContent = "Condition group";
  group.append(...["All", "Any"].map((value) => Object.assign(document.createElement("option"), { value, textContent:value, selected:configuration.conditionGroupOperator === value })));
  group.addEventListener("change", () => { configuration.conditionGroupOperator = group.value === "Any" ? "Any" : "All"; refreshValidation(); });
  section.append(groupLabel, group);
  const choices = schemaDraft ? schemaDocumentPaths(schemaDraft.document).filter((candidate) => candidate !== path) : [];
  configuration.conditions.forEach((predicate, index) => {
    const row = document.createElement("section"); row.setAttribute("aria-label", `Condition ${index + 1}`);
    const propertyLabel = document.createElement("label"); const property = document.createElement("select");
    property.id = `schema-local-rule-condition-property-${index}`; propertyLabel.htmlFor = property.id; propertyLabel.textContent = "Condition property";
    property.append(Object.assign(document.createElement("option"), { value:"", textContent:"Choose a condition property" }), ...choices.map((choice) => Object.assign(document.createElement("option"), { value:canonicalRulePropertyPath(choice), textContent:canonicalRulePropertyPath(choice), selected:predicate.propertyPath === canonicalRulePropertyPath(choice) })));
    const operatorLabel = document.createElement("label"); const operator = document.createElement("select");
    operator.id = `schema-local-rule-condition-operator-${index}`; operatorLabel.htmlFor = operator.id; operatorLabel.textContent = "Trigger operator";
    const operators = operatorsForConditionType(predicate.detectedType ?? "string");
    operator.append(...operators.map((choice) => Object.assign(document.createElement("option"), { value:choice, textContent:choice, selected:predicate.operator === choice })));
    const valueLabel = document.createElement("label"); const comparison = document.createElement("input");
    comparison.id = `schema-local-rule-condition-value-${index}`; valueLabel.htmlFor = comparison.id; valueLabel.textContent = predicate.operator === "Is one of" ? "Comparison values" : "Comparison value";
    comparison.type = predicate.detectedType === "number" ? "number" : "text";
    comparison.value = predicate.operator === "Is one of"
      ? predicate.comparisons?.map(({ value }) => String(value)).join(", ") ?? ""
      : predicate.comparison ? String(predicate.comparison.value ?? "") : "";
    const remove = document.createElement("button"); remove.type = "button"; remove.textContent = `Remove condition ${index + 1}`;
    property.addEventListener("change", () => {
      const schemaPath = property.value.slice(1).replaceAll("/", ".");
      const detectedType = schemaPath ? schemaPropertyType(schemaPath) : "string";
      const observed = valueAtSchemaPath(currentConditionPayload(), schemaPath);
      configuration.conditions[index] = {
        propertyPath:property.value,
        operator:"Equals",
        ...(observed.exists && (observed.value === null || ["string", "number", "boolean"].includes(typeof observed.value))
          ? { comparison:typedComparisonValue(observed.value as string | number | boolean | null) }
          : {}),
        detectedType,
      };
      renderSchemaPropertyRulePicker();
    });
    operator.addEventListener("change", () => {
      predicate.operator = operator.value as ConditionalRulePredicate["operator"];
      if (predicate.operator === "Exists" || predicate.operator === "Does not exist") {
        delete predicate.comparison; delete predicate.comparisons;
      }
      renderSchemaPropertyRulePicker();
    });
    comparison.addEventListener("input", () => {
      if (predicate.operator === "Is one of") {
        const values = comparison.value.split(",").map((value) => value.trim()).filter(Boolean);
        const comparisons = values.map((value) => comparisonValueFromInput(value, predicate.detectedType ?? "string"));
        predicate.comparisons = comparisons.every((value): value is NonNullable<typeof value> => value !== undefined)
          ? comparisons
          : [];
        delete predicate.comparison;
      } else {
        const value = comparisonValueFromInput(comparison.value, predicate.detectedType ?? "string");
        if (value) predicate.comparison = value;
        else delete predicate.comparison;
        delete predicate.comparisons;
      }
      refreshValidation();
    });
    remove.addEventListener("click", () => { configuration.conditions.splice(index, 1); renderSchemaPropertyRulePicker(); });
    row.append(propertyLabel, property, operatorLabel, operator);
    if (predicate.operator !== "Exists" && predicate.operator !== "Does not exist") row.append(valueLabel, comparison);
    row.append(remove); section.append(row);
  });
  const add = document.createElement("button"); add.type = "button"; add.textContent = "Add condition";
  add.addEventListener("click", () => { configuration.conditions.push(initialConditionPredicate(path)); renderSchemaPropertyRulePicker(); });
  const preview = document.createElement("output"); preview.id = "schema-local-rule-current-preview"; preview.setAttribute("aria-live", "polite");
  section.append(add, preview);
  return section;
}

function renderSchemaLocalRuleConfiguration(path: string, configuration: RuleConfiguration): void {
  const heading = document.createElement("h4"); heading.id = "schema-property-rule-picker-heading"; heading.textContent = `Configure ${configuration.ruleType} for ${path}`;
  const context = document.createElement("p"); context.textContent = `Local ${configuration.ruleType.toLowerCase()} rule · type ${configuration.propertyType}`;
  const form = document.createElement("form"); form.id = "schema-local-rule-configuration";
  const parameters = document.createElement("fieldset"); parameters.id = "schema-local-rule-parameters";
  parameters.append(Object.assign(document.createElement("legend"), { textContent:"Rule parameters" }));
  const controls = ruleConfigurationControls(configuration.ruleType, configuration.propertyType);
  if (!controls.length) parameters.append(Object.assign(document.createElement("p"), { textContent:"No parameter controls" }));
  const status = document.createElement("p"); status.id = "schema-local-rule-assistance"; status.setAttribute("role", "status");
  const create = document.createElement("button"); create.type = "submit"; create.textContent = "Create rule";
  const refreshValidation = () => {
    const validation = validateRuleConfiguration(configuration); create.disabled = !validation.ready; status.textContent = validation.assistance;
    const preview = form.querySelector<HTMLOutputElement>("#schema-local-rule-current-preview");
    if (preview && configuration.applyOnlyWhen) {
      const applies = conditionGroupAppliesToValue(currentConditionPayload(), { operator:configuration.conditionGroupOperator, predicates:configuration.conditions });
      if (!applies) preview.textContent = "Current event preview: Not applicable";
      else {
        const observed = valueAtSchemaPath(currentConditionPayload(), path);
        const passed = configuration.ruleType === "Item count"
          ? observed.exists && Array.isArray(observed.value) && observed.value.length >= Number(configuration.minimumItemCount)
          : observed.exists;
        preview.textContent = `Current event preview: ${passed ? "Passed" : "Failed"}`;
      }
    }
  };
  for (const control of controls) {
    if (!control.repeatable) { parameters.append(configuredRuleInput(control, configuration, refreshValidation)); continue; }
    const values = document.createElement("fieldset"); values.id = "schema-local-rule-allowed-values"; values.append(Object.assign(document.createElement("legend"), { textContent:"Allowed values" }));
    configuration.allowedValues.forEach((value, index) => {
      const row = document.createElement("div"); row.className = "schema-local-rule-value";
      const label = document.createElement("label"); const input = control.inputType === "select" ? document.createElement("select") : document.createElement("input"); const remove = document.createElement("button");
      input.id = `schema-local-rule-allowed-value-${index + 1}`;
      if (input instanceof HTMLInputElement) input.type = control.inputType === "number" ? "number" : "text";
      else input.append(Object.assign(document.createElement("option"), { value:"", textContent:"Choose a value" }), Object.assign(document.createElement("option"), { value:"true", textContent:"true" }), Object.assign(document.createElement("option"), { value:"false", textContent:"false" }));
      input.value = value;
      label.htmlFor = input.id; label.textContent = `Allowed value ${index + 1}`; remove.type = "button"; remove.textContent = `Remove value ${index + 1}`;
      input.addEventListener("input", () => { configuration.allowedValues[index] = input.value; refreshValidation(); });
      remove.addEventListener("click", () => { configuration.allowedValues.splice(index, 1); renderSchemaPropertyRulePicker(); });
      row.append(label, input, remove); values.append(row);
    });
    const add = document.createElement("button"); add.type = "button"; add.textContent = "Add another value";
    add.addEventListener("click", () => { configuration.allowedValues.push(""); renderSchemaPropertyRulePicker(); schemaPropertyRulePicker.querySelector<HTMLInputElement>(`#schema-local-rule-allowed-value-${configuration.allowedValues.length}`)?.focus(); });
    values.append(add); parameters.append(values);
  }
  const severityLabel = document.createElement("label"); const severity = document.createElement("select"); severityLabel.htmlFor = severity.id = "schema-local-rule-severity"; severityLabel.textContent = "Severity";
  severity.append(...["error", "warning"].map((value) => Object.assign(document.createElement("option"), { value, textContent:value, selected:configuration.severity === value })));
  severity.addEventListener("change", () => { configuration.severity = severity.value; refreshValidation(); });
  const messageLabel = document.createElement("label"); const message = document.createElement("input"); message.id = "schema-local-rule-message"; messageLabel.htmlFor = message.id; messageLabel.textContent = "Issue message (optional)"; message.value = configuration.message;
  message.addEventListener("input", () => { configuration.message = message.value; });
  const conditionalLabel = document.createElement("label"); const conditional = document.createElement("input"); conditional.id = "schema-local-rule-conditional"; conditional.type = "checkbox"; conditional.checked = configuration.applyOnlyWhen; conditionalLabel.append(conditional, " Apply only when");
  conditional.addEventListener("change", () => {
    configuration.applyOnlyWhen = conditional.checked;
    if (conditional.checked && !configuration.conditions.length) configuration.conditions.push(initialConditionPredicate(path));
    renderSchemaPropertyRulePicker(); schemaPropertyRulePicker.querySelector<HTMLInputElement>("#schema-local-rule-conditional")?.focus();
  });
  const reusableLabel = document.createElement("label"); const reusable = document.createElement("input"); reusable.id = "schema-local-rule-reusable"; reusable.type = "checkbox"; reusable.checked = configuration.saveReusable; reusableLabel.append(reusable, " Save as reusable rule in Rule Library");
  reusable.addEventListener("change", () => { configuration.saveReusable = reusable.checked; renderSchemaPropertyRulePicker(); schemaPropertyRulePicker.querySelector<HTMLInputElement>("#schema-local-rule-reusable")?.focus(); });
  form.append(heading, context, parameters, severityLabel, severity, messageLabel, message, conditionalLabel);
  if (configuration.applyOnlyWhen) form.append(renderConditionalRuleConfiguration(path, configuration, refreshValidation));
  form.append(reusableLabel);
  if (configuration.saveReusable) {
    const explanation = document.createElement("p"); explanation.id = "schema-local-rule-reusable-explanation"; explanation.textContent = "This reusable rule will be available to other schemas.";
    const nameLabel = document.createElement("label"); const name = document.createElement("input"); name.id = "schema-local-rule-name"; name.required = true; name.value = configuration.reusableName; nameLabel.htmlFor = name.id; nameLabel.textContent = "Rule name";
    name.addEventListener("input", () => { configuration.reusableName = name.value; refreshValidation(); });
    const descriptionLabel = document.createElement("label"); const description = document.createElement("textarea"); description.id = "schema-local-rule-description"; description.value = configuration.description; descriptionLabel.htmlFor = description.id; descriptionLabel.textContent = "Description (optional)";
    description.addEventListener("input", () => { configuration.description = description.value; });
    form.append(explanation, nameLabel, name, descriptionLabel, description);
  }
  const back = document.createElement("button"); back.type = "button"; back.textContent = "Back to rule choices"; back.addEventListener("click", () => { schemaRuleConfiguration = undefined; renderSchemaPropertyRulePicker(); schemaPropertyRulePicker.querySelector<HTMLInputElement>("#schema-property-rule-search")?.focus(); });
  const cancel = document.createElement("button"); cancel.type = "button"; cancel.textContent = "Cancel"; cancel.addEventListener("click", closeSchemaPropertyRulePicker);
  form.append(status, create, back, cancel); form.addEventListener("submit", (event) => { event.preventDefault(); createConfiguredSchemaRule(path, configuration); });
  schemaPropertyRulePicker.replaceChildren(form); refreshValidation();
}

function renderSchemaPropertyRulePicker(): void {
  const path = schemaRulePickerPath;
  if (!path) return;
  const propertyType = schemaPropertyType(path);
  if (schemaRuleConfiguration) { renderSchemaLocalRuleConfiguration(path, schemaRuleConfiguration); return; }
  const previousQuery = schemaPropertyRulePicker.querySelector<HTMLInputElement>("#schema-property-rule-search")?.value ?? "";
  const heading = document.createElement("h4"); heading.id = "schema-property-rule-picker-heading"; heading.textContent = `Add rule for ${path} · type ${propertyType}`;
  const searchLabel = document.createElement("label"); searchLabel.htmlFor = "schema-property-rule-search"; searchLabel.textContent = "Search rules";
  const search = document.createElement("input"); search.id = "schema-property-rule-search"; search.type = "search"; search.value = previousQuery;
  const results = document.createElement("div"); results.id = "schema-property-rule-results";
  const normalized = previousQuery.trim().toLowerCase();
  const builtIns = builtInRulesForProperty(propertyType).filter((rule) => !normalized || [rule.name, rule.operator, rule.applicableType].join(" ").toLowerCase().includes(normalized));
  const attachedIds = new Set((schemaDraft?.attachedRules ?? []).filter((rule) => canonicalRulePropertyPath(rule.propertyPath ?? "") === canonicalRulePropertyPath(path)).map(({ id }) => id));
  const reusable = reusableRulesForProperty(reusableSchemaRules, propertyType, previousQuery, attachedIds);
  const resultButton = (label: string, metadata: string, action: () => void, disabled = false) => {
    const article = document.createElement("article"); const button = document.createElement("button"); const detail = document.createElement("p");
    button.type = "button"; button.textContent = label; button.disabled = disabled; button.addEventListener("click", action); detail.textContent = metadata; article.append(button, detail); return article;
  };
  const create = document.createElement("section"); create.setAttribute("aria-label", "Create a rule"); create.append(Object.assign(document.createElement("h5"), { textContent:"Create a rule" }), ...builtIns.map((rule) => resultButton(rule.name, `${rule.operator} · no parameters · type ${propertyType}`, () => {
    schemaRuleConfiguration = createRuleConfiguration(rule.name as SchemaRuleType, propertyType); renderSchemaPropertyRulePicker();
  })));
  const library = document.createElement("section"); library.setAttribute("aria-label", "Attach from Rule Library"); library.append(Object.assign(document.createElement("h5"), { textContent:"Attach from Rule Library" }), ...reusable.map((rule) => resultButton(
    `${rule.name} version ${rule.version ?? 1}${rule.alreadyAttached ? " · already attached" : ""}`,
    `${rule.operator ?? rule.kind} · ${rule.parameters ?? "no parameters"} · type ${rule.applicableType ?? propertyType} · version ${rule.version ?? 1}`,
    () => { closeSchemaPropertyRulePicker(); attachReusableRule(path, rule); schemaPropertyTree.querySelector<HTMLButtonElement>(`button[aria-label="Add rule for ${CSS.escape(path)}"]`)?.focus({ preventScroll:true }); },
    rule.alreadyAttached,
  )));
  if (!builtIns.length && !reusable.length) {
    const empty = document.createElement("p"); empty.id = "schema-property-rule-empty"; empty.textContent = "No compatible rules match this search";
    const clear = document.createElement("button"); clear.type = "button"; clear.textContent = "Clear search"; clear.addEventListener("click", () => { search.value = ""; renderSchemaPropertyRulePicker(); schemaPropertyRulePicker.querySelector<HTMLInputElement>("#schema-property-rule-search")?.focus(); });
    results.append(empty, clear);
  } else results.append(create, library);
  const cancel = document.createElement("button"); cancel.type = "button"; cancel.textContent = "Cancel"; cancel.addEventListener("click", closeSchemaPropertyRulePicker);
  schemaPropertyRulePicker.replaceChildren(heading, searchLabel, search, results, cancel);
  search.addEventListener("input", () => {
    const position = search.selectionStart ?? search.value.length;
    renderSchemaPropertyRulePicker();
    const replacement = schemaPropertyRulePicker.querySelector<HTMLInputElement>("#schema-property-rule-search");
    replacement?.focus({ preventScroll:true }); replacement?.setSelectionRange(position, position);
  });
}

function openSchemaPropertyRulePicker(path: string, trigger: HTMLButtonElement): void {
  selectedSchemaPropertyPath = schemaRulePickerPath = path; schemaRulePickerTrigger = trigger; schemaRuleConfiguration = undefined;
  renderSchemaPropertyRulePicker(); schemaPropertyRulePicker.showModal();
  schemaPropertyRulePicker.querySelector<HTMLInputElement>("#schema-property-rule-search")?.focus({ preventScroll:true });
}

schemaPropertyRulePicker.addEventListener("cancel", (event) => { event.preventDefault(); closeSchemaPropertyRulePicker(); });
schemaPropertyRulePicker.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Enter") return;
  const buttons = Array.from(schemaPropertyRulePicker.querySelectorAll<HTMLButtonElement>("#schema-property-rule-results button:not(:disabled)"));
  const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
  if (event.key === "Enter" && index >= 0) { event.preventDefault(); buttons[index]?.click(); return; }
  if (!buttons.length || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;
  event.preventDefault(); buttons[(index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length]?.focus();
});

schemaSpecificIndex.addEventListener("input", () => {
  if (!schemaDraft || !specificIndexArrayPath) return;
  const inspection = inspectSpecificIndexRuleTarget(schemaDraft.document, specificIndexArrayPath, schemaSpecificIndex.value);
  confirmSchemaSpecificIndex.disabled = inspection.result !== "accepted";
  schemaSpecificIndexAssistance.textContent = inspection.assistance;
});
schemaSpecificIndexForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!schemaDraft || !specificIndexArrayPath || !specificIndexTrigger) return;
  const inspection = inspectSpecificIndexRuleTarget(schemaDraft.document, specificIndexArrayPath, schemaSpecificIndex.value);
  if (inspection.result !== "accepted") return;
  schemaSpecificIndexDialog.close();
  openSchemaPropertyRulePicker(inspection.canonicalPath.slice(1).replaceAll("/", "."), specificIndexTrigger);
});
const closeSpecificIndexDialog = () => { if (schemaSpecificIndexDialog.open) schemaSpecificIndexDialog.close(); specificIndexTrigger?.focus({ preventScroll:true }); };
cancelSchemaSpecificIndex.addEventListener("click", closeSpecificIndexDialog);
schemaSpecificIndexDialog.addEventListener("cancel", (event) => { event.preventDefault(); closeSpecificIndexDialog(); });

function attachReusableRule(path: string, rule: ReusableSchemaRule): void {
  if (!schemaDraft) return;
  const attachment = {
    id: rule.id,
    name: rule.name,
    version: rule.version ?? 1,
    ...(rule.operator ? { operator:rule.operator } : {}),
    ...(rule.parameters ? { parameters:rule.parameters } : {}),
    ...(rule.severity ? { severity:rule.severity } : {}),
    ...(rule.message ? { message:rule.message } : {}),
    ...(rule.conditionGroup ? { conditionGroup:structuredClone(rule.conditionGroup) } : {}),
    enabled: true,
  };
  schemaDraft = attachRuleToSchemaProperty(schemaDraft, path, attachment);
  persistSchemaEditorDraft(`Attach ${rule.name} to ${path}`);
  renderSchemaDraft();
  focusSchemaPropertyRow(path);
}

function updateAttachedRule(path: string, id: string, update: (rule: NonNullable<SchemaDefinition["attachedRules"]>[number]) => NonNullable<SchemaDefinition["attachedRules"]>[number] | undefined): void {
  if (!schemaDraft) return;
  const attachedRules = (schemaDraft.attachedRules ?? []).flatMap((rule) => {
    if (rule.id !== id || canonicalRulePropertyPath(rule.propertyPath ?? "") !== canonicalRulePropertyPath(path)) return [rule];
    const next = update(rule);
    return next ? [next] : [];
  });
  schemaDraft = { ...schemaDraft, attachedRules };
  persistSchemaEditorDraft(`Update attached rule on ${path}`);
  renderSchemaDraft();
  focusSchemaPropertyRow(path);
}

function focusSchemaPropertyRow(path: string): void {
  const canonicalPath = canonicalRulePropertyPath(path);
  Array.from(schemaPropertyTree.querySelectorAll<HTMLElement>("li[data-schema-property-path]"))
    .find((row) => row.dataset.schemaPropertyCanonicalPath === canonicalPath)
    ?.focus({ preventScroll:true });
}

function assignmentConditionCapturedValue(target: AssignmentConditionTarget): unknown {
  const captured = liveObserverState.events.find(({ id }) => id === liveObserverState.inspectorEventId) ?? liveObserverState.events.at(-1);
  return target === "raw input" ? captured?.rawInput : captured?.payload;
}

function assignmentConditionEditorState(
  target: AssignmentConditionTarget,
  group?: AssignmentDataConditionGroup,
): AssignmentDataConditionEditorState {
  return {
    target,
    ...(group ? { group:structuredClone(group) } : {}),
    suggestions:assignmentConditionSuggestions(assignmentConditionCapturedValue(target)),
  };
}

function renderSchemaAssignmentConditionEditor(): void {
  renderAssignmentDataConditionEditor(schemaAssignmentDataConditions, schemaAssignmentConditionState, (next) => {
    schemaAssignmentConditionState = { ...next, suggestions:assignmentConditionSuggestions(assignmentConditionCapturedValue(next.target)) };
    const validation = validateAssignmentDataConditions(schemaAssignmentConditionState.group);
    if (saveSchemaAssignmentButton) { saveSchemaAssignmentButton.disabled = !validation.ready; saveSchemaAssignmentButton.title = validation.ready ? "" : validation.assistance; }
    renderSchemaAssignmentConditionEditor();
  });
  const validation = validateAssignmentDataConditions(schemaAssignmentConditionState.group);
  if (saveSchemaAssignmentButton) { saveSchemaAssignmentButton.disabled = !validation.ready; saveSchemaAssignmentButton.title = validation.ready ? "" : validation.assistance; }
}

function renderSchemaWorkflowRows(): void {
  const choices = assignableSchemas(schemas);
  if (schemaAssignmentSchema) schemaAssignmentSchema.replaceChildren(...choices.map((schema) => Object.assign(document.createElement("option"), { value:schema.id, textContent:`${schema.name} version ${schema.version}` })));
  const visibleRules = reusableSchemaRules.filter((rule) => `${rule.name} ${rule.kind}`.toLowerCase().includes(schemaRuleSearch?.value.toLowerCase() ?? ""));
  schemaRuleList?.replaceChildren(...visibleRules.map((rule) => {
    const item = document.createElement("li"); const summary = document.createElement("span"); summary.textContent = `${rule.name} v${rule.version ?? 1} · ${rule.kind}${rule.operator ? ` · ${rule.operator}` : ""}${rule.attachments?.length ? ` · ${rule.attachments.length} attachments` : ""}${rule.enabled === false ? " · disabled" : ""}${rule.revisionHistory?.length ? ` · ${rule.revisionHistory.length} prior versions` : ""}`;
    const edit = document.createElement("button"); const duplicate = document.createElement("button"); const exportRule = document.createElement("button"); const disable = document.createElement("button"); const remove = document.createElement("button"); edit.type = duplicate.type = exportRule.type = disable.type = remove.type = "button"; edit.textContent = "Edit"; duplicate.textContent = "Duplicate"; exportRule.textContent = "Export"; disable.textContent = rule.enabled === false ? "Enable" : "Disable"; remove.textContent = "Delete";
    edit.addEventListener("click", () => { editingReusableSchemaRuleId = rule.id; if (schemaRuleName) schemaRuleName.value = rule.name; if (schemaRuleTypes) schemaRuleTypes.value = rule.applicableType ?? applicablePropertyTypesForRule(rule)[0] ?? "string"; if (schemaRuleOperator) schemaRuleOperator.value = rule.operator ?? "required"; if (schemaRuleParameters) schemaRuleParameters.value = rule.parameters ?? ""; if (schemaRuleSeverity) schemaRuleSeverity.value = rule.severity ?? "error"; if (schemaRuleMessage) schemaRuleMessage.value = rule.message ?? ""; if (schemaRuleExamples) schemaRuleExamples.value = rule.examples ?? ""; if (schemaRuleAttachments) { schemaRuleAttachments.replaceChildren(...schemas.map((schema) => Object.assign(document.createElement("option"), { value:schema.id, textContent:`${schema.name} v${schema.version}`, selected:rule.attachments?.includes(schema.id) ?? false }))); } if (schemaRuleEditor) schemaRuleEditor.hidden = false; schemaRuleName?.focus({ preventScroll:true }); });
    duplicate.addEventListener("click", () => { reusableSchemaRules = [...reusableSchemaRules, { ...rule, id:`rule:${crypto.randomUUID()}`, name:`${rule.name} copy`, version:1, enabled:true }]; localStorage.setItem(SCHEMA_RULE_STORAGE_KEY, JSON.stringify(reusableSchemaRules)); renderSchemaWorkflowRows(); });
    exportRule.addEventListener("click", () => { const blob = new Blob([`${JSON.stringify(rule, null, 2)}\n`], { type:"application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${rule.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-v${rule.version ?? 1}.json`; link.click(); URL.revokeObjectURL(url); });
    disable.addEventListener("click", () => { reusableSchemaRules = reusableSchemaRules.map((candidate) => candidate.id === rule.id ? { ...candidate, enabled:candidate.enabled === false } : candidate); localStorage.setItem(SCHEMA_RULE_STORAGE_KEY, JSON.stringify(reusableSchemaRules)); renderSchemaWorkflowRows(); });
    remove.addEventListener("click", () => { const attached = schemas.filter((schema) => rule.attachments?.includes(schema.id) || JSON.stringify(schema.document).includes(rule.id)); if (attached.length) { if (schemaResult) schemaResult.textContent = `Cannot delete ${rule.name}: attached to ${attached.map((schema) => schema.name).join(", ")}.`; return; } pendingReusableSchemaRuleDeletionId = rule.id; if (schemaRuleDeleteReviewSummary) schemaRuleDeleteReviewSummary.textContent = `${rule.name} v${rule.version ?? 1} will be removed.`; if (schemaRuleDeleteReview) { schemaRuleDeleteReview.hidden = false; schemaRuleDeleteReview.showModal(); } });
    item.append(summary, edit, duplicate, exportRule, disable, remove); return item;
  }));
  const assignments = schemas.flatMap((schema) => schema.assignments.map((assignment) => ({ schema, assignment })));
  schemaAssignmentList?.replaceChildren(...assignments.map(({ schema, assignment }) => {
    const item = document.createElement("li"); const summary = document.createElement("span");
    summary.textContent = `${assignment.name ?? assignment.id ?? "Assignment"} · ${assignment.sourceId}/${assignment.eventName} · ${assignment.target} · ${assignmentDataConditionSummary(assignment)} · ${assignment.domainCondition ?? "any"}${assignment.pathnameCondition ?? "any"} · priority ${assignment.priority ?? 0} · ${assignment.versionPolicy ?? "pinned"} · ${assignment.enabled === false ? "disabled" : "enabled"} · ${schema.name}`;
    const edit = document.createElement("button"); const duplicate = document.createElement("button"); const disable = document.createElement("button"); const remove = document.createElement("button");
    edit.type = duplicate.type = disable.type = remove.type = "button"; edit.textContent = "Edit"; duplicate.textContent = "Duplicate"; disable.textContent = assignment.enabled === false ? "Enable" : "Disable"; remove.textContent = "Delete";
    edit.addEventListener("click", () => { editingSchemaAssignment = assignment.id ? { schemaId:schema.id, assignmentId:assignment.id } : { schemaId:schema.id }; if (schemaAssignmentSchema) schemaAssignmentSchema.value = schema.id; if (schemaAssignmentSource) schemaAssignmentSource.value = assignment.sourceId; if (schemaAssignmentEvent) schemaAssignmentEvent.value = assignment.eventName; if (schemaAssignmentTarget) schemaAssignmentTarget.value = assignment.target; if (schemaAssignmentDomain) schemaAssignmentDomain.value = assignment.domainCondition ?? ""; if (schemaAssignmentPathname) schemaAssignmentPathname.value = assignment.pathnameCondition ?? ""; if (schemaAssignmentPriority) schemaAssignmentPriority.value = String(assignment.priority ?? 0); if (schemaAssignmentVersionPolicy) schemaAssignmentVersionPolicy.value = assignment.versionPolicy ?? "pinned"; if (schemaAssignmentEnabled) schemaAssignmentEnabled.checked = assignment.enabled !== false; schemaAssignmentConditionState=assignmentConditionEditorState(assignment.conditionTarget ?? assignment.target, assignment.dataConditionGroup); renderSchemaAssignmentConditionEditor(); if (schemaAssignmentEditor) schemaAssignmentEditor.hidden = false; });
    duplicate.addEventListener("click", () => { schemas = schemas.map((candidate) => candidate.id === schema.id ? { ...candidate, assignments:[...candidate.assignments, duplicateSchemaAssignment(assignment, `${assignment.id ?? "assignment"}:copy`, `${assignment.name ?? "Assignment"} copy`)] } : candidate); persistSchemaLibrary(); renderSchemaWorkflowRows(); });
    disable.addEventListener("click", () => { schemas = schemas.map((candidate) => candidate.id === schema.id ? { ...candidate, assignments:candidate.assignments.map((item) => item === assignment ? { ...item, enabled:item.enabled === false } : item) } : candidate); persistSchemaLibrary(); renderSchemaWorkflowRows(); });
    remove.addEventListener("click", () => { schemas = schemas.map((candidate) => candidate.id === schema.id ? { ...candidate, assignments:candidate.assignments.filter((item) => item !== assignment) } : candidate); persistSchemaLibrary(); renderSchemaWorkflowRows(); });
    item.append(summary, edit, duplicate, disable, remove); return item;
  }));
  const collisions = new Map<string, string[]>();
  for (const { schema, assignment } of assignments.filter(({ assignment }) => assignment.enabled !== false)) {
    const key = [assignment.sourceId, assignment.eventName, assignment.target, assignment.priority ?? 0, assignment.domainCondition ?? "any", assignment.pathnameCondition ?? "any", assignmentDataConditionSummary(assignment)].join("|");
    collisions.set(key, [...(collisions.get(key) ?? []), `${schema.name}/${assignment.name ?? assignment.id ?? "unnamed"}`]);
  }
  const conflicts = [...collisions.values()].filter((matches) => matches.length > 1);
  if (schemaAssignmentConflicts) schemaAssignmentConflicts.textContent = conflicts.length ? `Assignment conflict: ${conflicts.map((matches) => matches.join(", ")).join("; ")}. Edit priorities before validation.` : "";
}

function recheckCapturedSchemaValidation(): void {
  const events = liveObserverState.events;
  if (!events.length) { if (schemaResult) schemaResult.textContent = "No captured events are available to recheck."; return; }
  let checked = 0;
  const issueRows: HTMLLIElement[] = [];
  const checkedAt = new Date().toISOString();
  const records: SchemaValidationRecord[] = [];
  liveObserverState = {
    ...liveObserverState,
    events: events.map((event) => {
      const validation = validateEvent({ sourceId:event.sourceId, eventName:event.name, payload:event.payload, rawInput:event.rawInput }, schemas, event.pageUrl);
      if (validation.state !== "Not checked") checked += 1;
      const assignment = validation.assignment;
      const assignmentDetails = assignment ? `assignment id ${assignment.id ?? "none"} · name ${assignment.name ?? "none"} · source ${assignment.sourceId} · event ${assignment.eventName} · target ${assignment.target} · priority ${assignment.priority ?? 0} · domain ${assignment.domainCondition ?? "any"} · pathname ${assignment.pathnameCondition ?? "any"} · policy ${assignment.versionPolicy ?? "pinned"} · ${assignment.enabled === false ? "disabled" : "enabled"}` : `assignment ${validation.target ?? "automatic"}`;
      issueRows.push(...validation.issues.map((issue) => Object.assign(document.createElement("li"), { textContent:`${event.name} · ${issue.templatePath ? `template ${issue.templatePath} · ` : ""}${issue.instancePath || "root"} · ${issue.message}: expected ${issue.expected}, received ${issue.actual}${issue.conditionSummary ? ` · condition ${issue.conditionSummary}` : ""} · rule ${issue.rule ?? "schema"} · severity ${issue.severity ?? "error"} · ${issue.origin ?? `${issue.schemaName} v${issue.schemaVersion}`} · ${issue.schemaLocation} · ${assignmentDetails}` })));
      records.push({ eventId:event.id, eventName:event.name, state:validation.state, checkedAt, ...(validation.schema ? { schemaName:validation.schema.name, schemaVersion:validation.schema.version } : {}), ...(validation.target ? { target:validation.target } : {}), ...(validation.assignment?.id ? { assignmentId:validation.assignment.id } : {}), ...(validation.assignment?.name ? { assignmentName:validation.assignment.name } : {}), ...(validation.assignmentEvidence ? { assignmentEvidence:validation.assignmentEvidence.summary } : {}) });
      if (validation.state === "Assignment error" && schemaAssignmentConflicts) schemaAssignmentConflicts.textContent = validation.assignmentEvidence?.summary ?? "Assignment error";
      return { ...event, validation:validation.state };
    }),
  };
  renderLiveObserver();
  schemaValidationIssues?.replaceChildren(...issueRows);
  schemaValidationRecords = [...schemaValidationRecords, ...records].slice(-50);
  localStorage.setItem(SCHEMA_VALIDATION_RECORD_STORAGE_KEY, JSON.stringify(schemaValidationRecords));
  renderSchemaValidationRecords();
  if (schemaResult) schemaResult.textContent = checked ? `Rechecked ${checked} captured ${checked === 1 ? "event" : "events"}.` : "No captured events matched a schema assignment.";
}

function refreshCurrentLiveAfterSchemaPublication(): number {
  const current = savedSessionLiveFeed?.currentView ?? liveObserverState;
  const refreshed = revalidateCurrentLiveSession(current, schemas, manualSchemaOverrides);
  if (savedSessionLiveFeed) {
    savedSessionLiveFeed = { ...savedSessionLiveFeed, currentView:refreshed.state };
    persistSavedSessionFeed();
  } else {
    liveObserverState = refreshed.state;
    renderLiveObserver();
    if (liveObserverState.inspectorEventId) openLiveInspector(liveObserverState.inspectorEventId, true);
  }
  return refreshed.revalidatedEventIds.length;
}

function renderSchemaValidationRecords(): void {
  schemaValidationRecordList?.replaceChildren(...schemaValidationRecords.map((record) => Object.assign(document.createElement("li"), { textContent:`${record.eventName} · ${record.state} · ${record.schemaName ? `${record.schemaName} v${record.schemaVersion} · ${record.target}` : "No matching schema"}${record.assignmentId ? ` · assignment ${record.assignmentName ?? record.assignmentId} (${record.assignmentId})` : ""}${record.assignmentEvidence ? ` · ${record.assignmentEvidence}` : ""} · ${record.checkedAt}` })));
}

function persistEventTemplateLibrary(): void {
  localStorage.setItem(EVENT_TEMPLATE_LIBRARY_STORAGE_KEY, serializeEventTemplateLibrary(eventTemplates));
}

function downloadEventLibrary(): void {
  const blob = new Blob([`${JSON.stringify(eventLibraryExport(eventTemplates), null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob); const link = document.createElement("a");
  link.href = url; link.download = "event-library.json"; link.click(); URL.revokeObjectURL(url);
}

async function reviewEventLibraryImport(): Promise<void> {
  const file = eventLibraryFile?.files?.[0]; if (!file) return;
  try {
    pendingEventLibraryImport = eventLibraryImport(await file.text());
    replaceEventLibraryArmed = false;
    if (replaceEventLibraryButton) replaceEventLibraryButton.textContent = "Replace entire Library";
    if (eventLibraryImportReviewSummary) eventLibraryImportReviewSummary.textContent = `Format version ${pendingEventLibraryImport.version}; ${pendingEventLibraryImport.templates.length} templates; ${pendingEventLibraryImport.templates.reduce((count, template) => count + (template.revisionHistory?.length ?? 0), 0)} revisions; valid.`;
    showDialog(eventLibraryImportReview, eventLibraryImportReviewHeading);
  } catch (error) { if (eventLibraryTransferResult) eventLibraryTransferResult.textContent = error instanceof Error ? error.message : "Select a valid Library JSON file"; }
  finally { if (eventLibraryFile) eventLibraryFile.value = ""; }
}

function commitEventLibraryImport(mode: "replace" | "append"): void {
  if (!pendingEventLibraryImport) return;
  const importCount = pendingEventLibraryImport.templates.length;
  const previous = eventTemplates.length;
  const result = mode === "replace"
    ? { templates: replaceImportedTemplates(eventTemplates, pendingEventLibraryImport.templates), remapped: 0 }
    : appendImportedTemplates(eventTemplates, pendingEventLibraryImport.templates, () => `template:import:${crypto.randomUUID()}`);
  eventTemplates = result.templates; persistEventTemplateLibrary(); pendingEventLibraryImport = undefined;
  replaceEventLibraryArmed = false;
  hideDialog(eventLibraryImportReview); renderEventTemplateLibrary();
  if (eventLibraryTransferResult) eventLibraryTransferResult.textContent = mode === "replace"
    ? `${eventTemplates.length} imported and ${previous} replaced.`
    : `${importCount} appended and ${result.remapped} identity remapped.`;
}

function requestEventTemplateDeletion(template: EditableEventTemplate): void {
  pendingEventLibraryDeletion = { id: template.id, name: template.name, count: 1 };
  if (eventLibraryDeleteReviewSummary) eventLibraryDeleteReviewSummary.textContent = `${template.name}; event ${template.eventName}; ${template.version} saved versions will be deleted. Captured events, saved sessions, and execution records remain unchanged.`;
  if (confirmEventLibraryDeleteButton) confirmEventLibraryDeleteButton.textContent = `Delete ${template.name}`;
  showDialog(eventLibraryDeleteReview, eventLibraryDeleteReviewHeading);
}

function requestClearEventLibrary(): void {
  if (eventTemplates.length === 0) return;
  pendingEventLibraryDeletion = { count: eventTemplates.length };
  if (eventLibraryDeleteReviewSummary) eventLibraryDeleteReviewSummary.textContent = `All ${eventTemplates.length} templates and their saved revisions will be removed.`;
  if (confirmEventLibraryDeleteButton) confirmEventLibraryDeleteButton.textContent = `Delete all ${eventTemplates.length} events`;
  showDialog(eventLibraryDeleteReview, eventLibraryDeleteReviewHeading);
}

function commitEventLibraryDeletion(): void {
  const pending = pendingEventLibraryDeletion; if (!pending) return;
  eventTemplates = pending.id ? deleteEventTemplate(eventTemplates, pending.id) : clearEventLibrary(eventTemplates);
  persistEventTemplateLibrary(); pendingEventLibraryDeletion = undefined; hideDialog(eventLibraryDeleteReview);
  if (propertyEditorState && pending.id === propertyEditorState.template.id) propertyEditorState = undefined;
  renderEventTemplateLibrary();
  if (eventLibraryTransferResult) eventLibraryTransferResult.textContent = pending.id ? `Deleted ${pending.name}.` : `${pending.count} events deleted.`;
  if (!pending.id) addNewButton?.focus({ preventScroll: true });
}

function renderSequences(): void {
  if (sequenceEmptyState) sequenceEmptyState.hidden = replaySequences.length > 0;
  renderSequenceReplay(sequenceReplayElements, replaySequences, (sequence) => {
    const templates: ReplayTemplate[] = eventTemplates.map((template) => ({
      id: template.id,
      name: template.name,
      version: template.version,
      sourceId: template.sourceId,
      destination: template.destination,
      payload: template.payload,
    }));
    const adapters = liveObserverState.sources.map((source) => ({
      id: source.id,
      name: source.name,
      kind: "Data Layer",
      destination: "event.history",
      enabled: true,
      status: source.status,
      capabilities: ["push"] as const,
    }));
    const ready = readiness(sequence, templates, adapters);
    if (!ready.runnable) {
      setSequenceReplayResult(
        sequenceReplayElements,
        `Not runnable: ${ready.blocked.join(", ")}`,
      );
      return;
    }
    const record = runSequence(
      sequence,
      templates,
      adapters,
      liveObserverState.pageUrl,
      "Run all",
    );
    setSequenceReplayResult(
      sequenceReplayElements,
      `${record.result}: ${record.steps.length} steps.`,
    );
  });
}

function resetTemplateEditorDisclosures(): void {
  document.querySelectorAll<HTMLDetailsElement>("#event-property-editor details").forEach((disclosure) => {
    disclosure.open = false;
  });
}

function openTemplateEditor(template: EditableEventTemplate): void {
  templateEditorReturnTemplateId = template.id;
  propertyEditorState = openPropertyEditor(template);
  resetTemplateEditorDisclosures();
  setEventLibraryResult(eventLibraryEditorElements, "");
  renderEventTemplateLibrary();
  eventLibraryEditorElements.editorTitle?.focus({ preventScroll: true });
}

function openNewEventEditor(): void {
  templateEditorReturnTemplateId = undefined;
  propertyEditorState = createNewEventEditor();
  resetTemplateEditorDisclosures();
  setEventLibraryResult(eventLibraryEditorElements, "");
  renderEventTemplateLibrary();
  eventTemplateName?.focus({ preventScroll: true });
}

function closeTemplateEditor(): void {
  const wasNew = propertyEditorState?.isNew;
  propertyEditorState = undefined;
  resetTemplateEditorDisclosures();
  if (eventLibraryEditorElements.propertyEditor) {
    eventLibraryEditorElements.propertyEditor.hidden = true;
  }
  if (closeTemplateEditorConfirmation) closeTemplateEditorConfirmation.hidden = true;
  setEventLibraryResult(eventLibraryEditorElements, "");
  renderEventTemplateLibrary();
  if (templateEditorReturnTemplateId) {
    focusTemplateEditAction(eventLibraryEditorElements, templateEditorReturnTemplateId);
  }
  if (wasNew) addNewButton?.focus({ preventScroll: true });
  templateEditorReturnTemplateId = undefined;
}

function hideDialog(dialog: HTMLDialogElement | null): void {
  if (dialog?.open) dialog.close();
  if (dialog) dialog.hidden = true;
}

function showDialog(dialog: HTMLDialogElement | null, focus: HTMLElement | null): void {
  if (!dialog) return;
  dialog.hidden = false;
  if (!dialog.open) dialog.showModal();
  focus?.focus({ preventScroll: true });
}

function renderTemplateRenameValidation(): boolean {
  if (!pendingTemplateRename) return false;
  const errors = renameValidation(pendingTemplateRename.draft);
  const fields: ReadonlyArray<readonly [HTMLInputElement | null, HTMLElement | null, string | undefined]> = [
    [templateRenameName, templateRenameNameError, errors.templateName],
    [templateRenameEventName, templateRenameEventNameError, errors.eventName],
  ];
  for (const [input, message, error] of fields) {
    if (!input) continue;
    input.setCustomValidity(error ?? "");
    input.setAttribute("aria-invalid", String(Boolean(error)));
    if (message) message.textContent = error ?? "";
  }
  const firstError = errors.templateName ?? errors.eventName;
  if (saveTemplateNamesButton) {
    saveTemplateNamesButton.disabled = Boolean(firstError);
    if (firstError) saveTemplateNamesButton.setAttribute(
      "aria-describedby",
      errors.templateName ? "event-template-rename-name-error" : "event-template-rename-event-name-error",
    );
    else saveTemplateNamesButton.removeAttribute("aria-describedby");
  }
  return !firstError;
}

function openTemplateRename(template: EditableEventTemplate): void {
  pendingTemplateRename = {
    editor: openPropertyEditor(template),
    draft: beginTemplateRename(template),
    templateId: template.id,
  };
  if (templateRenameName) templateRenameName.value = pendingTemplateRename.draft.templateName;
  if (templateRenameEventName) templateRenameEventName.value = pendingTemplateRename.draft.eventName;
  renderTemplateRenameValidation();
  showDialog(templateRenameDialog, templateRenameName ?? templateRenameHeading);
}

function closeTemplateRename(): void {
  hideDialog(templateRenameDialog);
  const templateId = pendingTemplateRename?.templateId;
  pendingTemplateRename = undefined;
  if (templateId) focusTemplateRenameAction(eventLibraryEditorElements, templateId);
}

function commitTemplateRename(): void {
  if (!pendingTemplateRename) return;
  const renamed = saveTemplateRename(
    pendingTemplateRename.editor,
    pendingTemplateRename.draft,
  );
  eventTemplates = eventTemplates.map((template) =>
    template.id === renamed.template.id ? renamed.template : template,
  );
  if (propertyEditorState?.template.id === renamed.template.id) {
    propertyEditorState = renamed;
  }
  persistEventTemplateLibrary();
  hideDialog(templateRenameDialog);
  hideDialog(templateRenameReview);
  const templateId = renamed.template.id;
  pendingTemplateRename = undefined;
  renderEventTemplateLibrary();
  focusTemplateRenameAction(eventLibraryEditorElements, templateId);
}

function requestTemplateRenameSave(): void {
  if (!pendingTemplateRename || !renderTemplateRenameValidation()) return;
  const { editor, draft } = pendingTemplateRename;
  if (draft.eventName.trim() === editor.template.eventName) {
    commitTemplateRename();
    return;
  }
  hideDialog(templateRenameDialog);
  if (templateRenameReviewSummary) {
    templateRenameReviewSummary.textContent =
      `${editor.template.eventName} changes to ${draft.eventName.trim()}. Future pushes use ${draft.eventName.trim()}. The originating captured ${editor.template.eventName} event remains unchanged.`;
  }
  if (confirmTemplateRenameButton) {
    confirmTemplateRenameButton.textContent = `Save names and use ${draft.eventName.trim()}`;
  }
  showDialog(templateRenameReview, templateRenameReviewHeading);
}

function returnToTemplateRename(): void {
  hideDialog(templateRenameReview);
  showDialog(templateRenameDialog, saveTemplateNamesButton);
}

async function pushPayloadToSelectedTargetPage(
  request: SelectedTargetPushRequest,
): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.scripting?.executeScript) {
    throw new Error("Selected-page push is unavailable.");
  }
  const [injection] = await chrome.scripting.executeScript({
    target: { tabId: request.tabId },
    world: "MAIN",
    args: [request.destination, request.eventName, request.payload],
    func: pushPayloadInPage,
  });
  const result = injection?.result as PagePushResult | undefined;
  if (!result?.success) {
    throw new Error(result?.result ?? "Selected-page push failed.");
  }
}

async function pushCurrentTemplateDraft(
  editor = propertyEditorState,
  target = selectedObservationTarget(observationTargetState),
): Promise<void> {
  if (!editor) return;
  const record = await pushTemplateToSelectedTarget(
    editor,
    target,
    pushPayloadToSelectedTargetPage,
  );
  setPushDestinationValidation(eventLibraryEditorElements, record.fieldError ?? "");
  if (record.fieldError) setEventLibraryValidation(eventLibraryEditorElements, record.fieldError);
  setEventLibraryResult(eventLibraryEditorElements, record.summary);
}

async function pushLibraryTemplate(
  template: EditableEventTemplate,
  target = selectedObservationTarget(observationTargetState),
): Promise<void> {
  const record = await pushSavedTemplateToSelectedTarget(
    template,
    target,
    pushPayloadToSelectedTargetPage,
  );
  setEventLibraryResult(eventLibraryEditorElements, record.summary);
}

function openRevisionChangeReview(): void {
  if (!propertyEditorState || propertyEditorState.isNew) return;
  if (propertyEditorState.jsonError) { setEventLibraryValidation(eventLibraryEditorElements, "Correct the JSON draft."); return; }
  const identityError = Object.values(templateIdentityValidation(propertyEditorState))[0];
  if (identityError) { setEventLibraryValidation(eventLibraryEditorElements, identityError); return; }
  pendingRevisionChangeReview = { editor: structuredClone(propertyEditorState), review: createTemplateChangeReview(propertyEditorState, "revision") };
  renderTemplateChangeReview(revisionChangeReview ?? document, pendingRevisionChangeReview.review);
  if (confirmRevisionChangeButton) confirmRevisionChangeButton.textContent = `Save revision ${pendingRevisionChangeReview.review.resultingVersion}`;
  showDialog(revisionChangeReview, revisionChangeReviewHeading);
}

function closeRevisionChangeReview(): void {
  pendingRevisionChangeReview = undefined;
  hideDialog(revisionChangeReview);
  saveTemplateRevisionButton?.focus({ preventScroll:true });
}

function commitRevisionChangeReview(): void {
  const pending = pendingRevisionChangeReview;
  if (!pending) return;
  propertyEditorState = saveDraftRevision(pending.editor);
  eventTemplates = eventTemplates.map((template) => template.id === propertyEditorState?.template.id ? propertyEditorState.template : template);
  persistEventTemplateLibrary();
  hideDialog(revisionChangeReview); pendingRevisionChangeReview = undefined;
  setEventLibraryResult(eventLibraryEditorElements, `Saved version ${propertyEditorState.template.version}; identity, execution, and payload changes applied.`);
  renderEventTemplateLibrary();
}

function openPushDraftReview(): void {
  if (!propertyEditorState) return;
  const target = selectedObservationTarget(observationTargetState);
  if (!target || target.accessState !== "Ready") {
    setEventLibraryValidation(eventLibraryEditorElements, "Select a target before pushing.");
    return;
  }
  if (propertyEditorState.jsonError) {
    setEventLibraryValidation(eventLibraryEditorElements, "Correct the JSON draft.");
    return;
  }
  pendingPushDraftReview = createPushDraftReview(propertyEditorState, target);
  renderPushDraftReview(pushDraftReviewElements, pendingPushDraftReview);
  if (pushDraftReviewSummary) pushDraftReviewSummary.textContent = "";
  if (confirmPushDraftButton) confirmPushDraftButton.textContent = pendingPushDraftReview.confirmLabel;
  openPushReview({ dialog: pushDraftReview, heading: pushDraftReviewHeading, trigger: pushTemplateDraftButton });
}

function persistSavedSessionLibrary(): void {
  localStorage.setItem(SAVED_SESSION_LIBRARY_STORAGE_KEY, serializeSavedSessionLibrary(savedSessionLibrary));
}

function persistSavedSessionFeed(): void {
  if (savedSessionLiveFeed) localStorage.setItem(SAVED_SESSION_LIVE_FEED_STORAGE_KEY, serializeSavedSessionLiveFeed(savedSessionLiveFeed));
  else localStorage.removeItem(SAVED_SESSION_LIVE_FEED_STORAGE_KEY);
}

function currentUnsavedEventCount(): number {
  const events = savedSessionLiveFeed?.currentView.events ?? liveObserverState.events;
  return Math.max(0, events.length - savedThroughEventCount);
}

function testingEndedMessage(): string {
  const unsaved = currentUnsavedEventCount();
  return unsaved ? `Testing ended; ${unsaved} captured events remain unsaved.` : "Testing ended";
}

function synchronizeSavedSessionFeedView(scrollTop = liveObserverElements.eventList?.scrollTop ?? 0): void {
  if (!savedSessionLiveFeed) return;
  savedSessionLiveFeed = updateSavedSessionLiveFeedView(savedSessionLiveFeed, {
    query:liveObserverState.query,
    ...(liveObserverState.inspectorEventId ? { inspectorEventId:liveObserverState.inspectorEventId } : {}),
    listVisible:liveObserverState.listVisible,
    scrollTop,
  });
  persistSavedSessionFeed();
}

function openSessionInLiveFeed(session: SavedSessionLibrary["sessions"][number]): void {
  const currentView = savedSessionLiveFeed?.currentView ?? liveObserverState;
  savedSessionLiveFeed = openSavedSessionLiveFeed(currentView, session, { scrollTop:liveObserverElements.eventList?.scrollTop ?? 0 });
  liveObserverState = savedSessionLiveFeed.savedView;
  persistSavedSessionFeed();
  showDataLayerView("Live");
  renderLiveObserver();
  if (liveObserverElements.eventList) liveObserverElements.eventList.scrollTop = savedSessionLiveFeed.savedScrollTop;
}

function startLinkedCaptureFromSavedSession(session: SavedSessionLibrary["sessions"][number]): void {
  const archived = openSavedSession(savedSessionLibrary, session.id);
  const resumed = resumeSavedSession(archived, globalThis.location.href);
  const currentView = savedSessionLiveFeed?.currentView ?? liveObserverState;
  const previousSession = dataLayerSessionState.session;
  archivedSavedSession = archived;
  savedSessionLiveFeed = undefined;
  persistSavedSessionFeed();
  savedThroughEventCount = 0;
  localStorage.setItem(SAVED_THROUGH_EVENT_COUNT_STORAGE_KEY, "0");
  liveObserverState = {
    ...currentView,
    view:"Live",
    status:"Live",
    pageUrl:resumed.activeSession.pageUrl,
    events:[],
    listVisible:true,
  };
  dataLayerSessionState = {
    session:{
      id:resumed.activeSession.id,
      status:"active",
      tabId:previousSession?.tabId ?? 0,
      ...(previousSession?.windowId === undefined ? {} : { windowId:previousSession.windowId }),
      historyPath:previousSession?.historyPath ?? getHistoryArrayPath(),
      startUrl:resumed.activeSession.pageUrl,
      currentUrl:resumed.activeSession.pageUrl,
      targetTitle:previousSession?.targetTitle ?? resumed.activeSession.pageUrl,
      parentSavedSessionId:resumed.activeSession.parentSavedSessionId,
      timeline:[],
    },
  };
  installDefaultSavedEventFeedFilterForNewSession();
  persistSession(dataLayerSessionState);
  setLiveSessionMessage(`Linked capture started from ${session.name}; 0 events in the new session.`);
  renderLiveObserver();
  showDataLayerView("Live");
}

function renderSavedSessions(): void {
  const sessions = searchSavedSessions(savedSessionLibrary, savedSessionSearch?.value ?? "");
  if (savedSessionEmptyState) savedSessionEmptyState.hidden = sessions.length > 0;
  if (savedSessionCount) savedSessionCount.textContent = `${sessions.length} saved sessions`;
  if (savedSessionList) {
    savedSessionList.replaceChildren(...sessions.map((session) => {
      const item = document.createElement("li");
      const open = document.createElement("button");
      const rename = document.createElement("button");
      const exportButton = document.createElement("button");
      const resumeCapture = document.createElement("button");
      const createSequenceButton = document.createElement("button");
      const remove = document.createElement("button");
      open.type = "button";
      open.textContent = "Open in Live feed";
      open.addEventListener("click", () => {
        openSessionInLiveFeed(session);
      });
      rename.type = "button";
      rename.textContent = "Rename";
      rename.addEventListener("click", () => {
        const name = globalThis.prompt("Saved session name", session.name);
        if (name?.trim()) {
          savedSessionLibrary = renameSavedSession(savedSessionLibrary, session.id, name.trim());
          persistSavedSessionLibrary();
          renderSavedSessions();
        }
      });
      exportButton.type = "button";
      exportButton.textContent = "Export";
      exportButton.addEventListener("click", () => {
        downloadSavedSessionFile(session);
        if (savedSessionConfirmation) savedSessionConfirmation.textContent = `Exported saved session ${session.name}.`;
      });
      resumeCapture.type = "button";
      resumeCapture.textContent = "Start linked capture";
      resumeCapture.addEventListener("click", () => {
        startLinkedCaptureFromSavedSession(session);
      });
      createSequenceButton.type = "button";
      createSequenceButton.textContent = "Create sequence";
      createSequenceButton.addEventListener("click", () => {
        const templates: ReplayTemplate[] = eventTemplates.filter((template) => session.events.some((event) => `template:${event.id}` === template.id)).map((template) => ({ id: template.id, name: template.name, version: template.version, sourceId: template.sourceId, destination: template.destination, payload: template.payload }));
        replaySequences = [...replaySequences, createSequence(`sequence:${session.id}`, `${session.name} sequence`, session.id, templates)];
        renderSequences();
        if (savedSessionConfirmation) savedSessionConfirmation.textContent = `Created sequence from ${session.name}; saved session remains unchanged.`;
      });
      remove.type = "button";
      remove.textContent = "Delete";
      remove.addEventListener("click", () => {
        savedSessionLibrary = requestSavedSessionDeletion(savedSessionLibrary, session.id);
        if (savedSessionConfirmation) savedSessionConfirmation.textContent = `Delete saved session ${session.name}?`;
        if (cancelSavedSessionDeleteButton) cancelSavedSessionDeleteButton.hidden = false;
        if (confirmSavedSessionDeleteButton) confirmSavedSessionDeleteButton.hidden = false;
      });
      const summary = savedSessionSummary(session);
      item.textContent = `${session.name}: ${summary.captureDate}, ${summary.pageScope}, ${summary.duration}, ${summary.sourceCount} sources, ${summary.eventCount} events, ${summary.validationSummary}. `;
      item.append(open, resumeCapture, rename, exportButton, createSequenceButton, remove);
      return item;
    }));
  }
}

function savedSessionFileName(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "saved-session"}.json`;
}

function downloadSavedSessionFile(session: Parameters<typeof exportSavedSession>[0]): void {
  const blob = new Blob([`${exportSavedSession(session)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = savedSessionFileName(session.name);
  link.click();
  URL.revokeObjectURL(url);
}

async function loadSavedSessionFile(): Promise<void> {
  const file = savedSessionFileInput?.files?.[0];
  if (!file) return;
  try {
    savedSessionLibrary = importSavedSession(savedSessionLibrary, await file.text());
    persistSavedSessionLibrary();
    if (savedSessionConfirmation) savedSessionConfirmation.textContent = "Saved session imported as an immutable archive.";
    renderSavedSessions();
  } catch {
    if (savedSessionConfirmation) savedSessionConfirmation.textContent = "Saved session file must contain valid JSON.";
  } finally {
    if (savedSessionFileInput) savedSessionFileInput.value = "";
  }
}

function renderSessionState(): void {
  const session = dataLayerSessionState.session;

  if (sessionHistoryPath) {
    sessionHistoryPath.textContent = session?.historyPath ?? "";
  }

  if (sessionWarning) {
    sessionWarning.textContent = dataLayerSessionState.warning ?? "";
  }

  renderLiveContextActions();
}

function renderObserverState(): void {
  renderLiveSessionSummary(
    liveSessionSummaryElements,
    currentLiveSessionSummary(),
  );
}

function updateSessionFromObserverState(): void {
  dataLayerSessionState =
    dataLayerObserverState.sessionState ?? dataLayerSessionState;
  syncCapturedEventsToLive();
}

function syncCapturedEventsToLive(): void {
  const events = dataLayerObserverState.sourceEvents ?? [];
  const pendingEvents = events.slice(presentedSourceEventCount);
  presentedSourceEventCount = events.length;
  for (const event of pendingEvents) {
    const source = liveObserverState.sources.find(({ id }) => id === event.sourceId);
    const validation = validateEvent({ sourceId:event.sourceId, eventName:event.name, payload:event.payload, rawInput:event.rawInput }, schemas, event.pageUrl);
    const presented: LiveEvent = {
      ...event,
      validation:validation.state,
      validationDetails:{ issues:validation.issues, evaluations:validation.evaluations ?? [], ...(validation.schema ? { schema:validation.schema } : {}), ...(validation.documentation ? { documentation:validation.documentation } : {}), ...(validation.assignment ? { assignment:validation.assignment } : {}) },
      sourceName: source?.name ?? event.sourceId,
      ...(dataLayerObserverState.observer
        ? { destination: dataLayerObserverState.observer.historyPath }
        : {}),
    };
    if (savedSessionLiveFeed) {
      savedSessionLiveFeed = recordBackgroundLiveEvent(savedSessionLiveFeed, presented);
      persistSavedSessionFeed();
    } else {
      liveObserverState = recordLiveEvent(liveObserverState, presented);
    }
  }
  if (pendingEvents.length > 0) {
    renderLiveObserver();
    if (!savedSessionLiveFeed && savedThroughEventCount > 0) setLiveSessionMessage(`${currentUnsavedEventCount()} newer events unsaved.`);
  }
}

function persistAndRenderSessionState(): void {
  persistSession(dataLayerSessionState);
  renderSessionState();
}

function persistAndRenderObservationState(): void {
  persistAndRenderSessionState();
  renderObserverState();
}

function restartLiveHistoryCaptureIfActive(
  observation: ActivePageObservationResult,
): void {
  if (dataLayerSessionState.session?.status === "active") {
    void startLiveHistoryCapture(observation);
  }
}

function observationPageLoadId(tabId: number): string {
  return `tab:${tabId}:page-load:${observationRefreshState.observedPageLoadSequence}`;
}

async function currentTargetObservation(
  historyPath: string,
): Promise<ActivePageObservationResult | undefined> {
  const target = attachedObservationTarget(observationTargetState)
    ?? selectedObservationTarget(observationTargetState);
  if (!target) {
    setObservationTargetResult("Selection required");
    return undefined;
  }
  return tabPageObservation(
    target.tabId,
    target.pageUrl,
    historyPath,
    observationPageLoadId(target.tabId),
  );
}

function cancelLiveHistoryCaptureRuntime(): void {
  liveHistoryActivationState = nextObservationActivation(
    liveHistoryActivationState,
  ).state;
  stopLiveHistoryPushCapture();
  stopLiveHistoryPushCapture = () => {};
}

function stopLiveHistoryCapture(): void {
  cancelLiveHistoryCaptureRuntime();
  dataLayerObserverState = stopHistoryArrayObserver(dataLayerObserverState);
}

async function startLiveHistoryCapture(
  observation: ActivePageObservationResult,
): Promise<void> {
  cancelLiveHistoryCaptureRuntime();
  const captureGeneration = liveHistoryActivationState.generation;
  try {
    const stopCapture = await startLiveHistoryPushCapture({
      ...(observation.tabId === undefined ? {} : { tabId: observation.tabId }),
      historyPath: observation.historyPath,
      onSnapshot: ({ historyPath, rawValues }) => {
        if (!observationActivationIsCurrent(liveHistoryActivationState, captureGeneration)) return;
        dataLayerObserverState = attachHistoryArraySnapshot(
          { ...dataLayerObserverState, sessionState:dataLayerSessionState },
          {
            pageUrl: observation.pageUrl,
            ...(observation.pageLoadId === undefined
              ? {}
              : { pageLoadId: observation.pageLoadId }),
            historyPath,
            rawValues,
            requestId:`activation:${captureGeneration}`,
          },
        );
        updateSessionFromObserverState();
        persistAndRenderObservationState();
      },
      onEntry: ({ rawValue, timestamp }) => {
        if (!observationActivationIsCurrent(liveHistoryActivationState, captureGeneration)) return;
        dataLayerObserverState = appendObservedHistoryEntry(
          dataLayerObserverState,
          rawValue,
          timestamp,
        );
        updateSessionFromObserverState();
        persistAndRenderObservationState();
      },
    });
    if (!observationActivationIsCurrent(liveHistoryActivationState, captureGeneration)) {
      stopCapture();
      return;
    }
    stopLiveHistoryPushCapture = stopCapture;
  } catch {
    if (observationActivationIsCurrent(liveHistoryActivationState, captureGeneration)) {
      stopLiveHistoryPushCapture = () => {};
    }
  }
}

function clearScheduledObservationRefresh(): void {
  if (observationRefreshTimeoutId !== undefined) {
    globalThis.clearTimeout(observationRefreshTimeoutId);
    observationRefreshTimeoutId = undefined;
  }
}

function activeSessionTabMatches(tabId: number): boolean {
  const session = dataLayerSessionState.session;

  return session?.status === "active" && session.tabId === tabId;
}

function capturePageEntryForRefresh(
  request: ObservationRefreshRequest,
): ObservationRefreshRequest {
  if (request.pageEntryCaptured) {
    return request;
  }

  dataLayerSessionState = navigateSession(dataLayerSessionState, request.pageUrl);
  dataLayerSessionState = captureEntry(dataLayerSessionState, {
    type: "page",
    url: request.pageUrl,
  });
  persistAndRenderSessionState();

  return markObservationRefreshPageEntryCaptured(request);
}

function scheduleObservationRefresh(request: ObservationRefreshRequest): void {
  clearScheduledObservationRefresh();
  const delay = observationRefreshDelay(request.attempt);

  observationRefreshTimeoutId = globalThis.setTimeout(() => {
    observationRefreshTimeoutId = undefined;
    void runObservationRefresh(request);
  }, delay);
}

function refreshObservationAfterPageLoad(
  tabId: number,
  pageUrl: string,
  pageLoadSequence: number,
): void {
  if (!activeSessionTabMatches(tabId)) {
    return;
  }

  const schedule = observationRefreshRequestForPageLoad(
    observationRefreshState,
    tabId,
    pageUrl,
    pageLoadSequence,
  );

  observationRefreshState = schedule.state;

  if (schedule.request) {
    scheduleObservationRefresh(schedule.request);
  }
}

async function runObservationRefresh(
  request: ObservationRefreshRequest,
): Promise<void> {
  if (
    !observationRefreshRequestIsCurrent(observationRefreshState, request) ||
    !activeSessionTabMatches(request.tabId)
  ) {
    return;
  }

  const session = dataLayerSessionState.session;

  if (!session) {
    return;
  }

  const nextRequest = capturePageEntryForRefresh(request);
  const observation = await tabPageObservation(
    nextRequest.tabId,
    nextRequest.pageUrl,
    session.historyPath,
    observationPageLoadId(nextRequest.tabId),
  );

  if (
    !observationRefreshRequestIsCurrent(observationRefreshState, nextRequest) ||
    !activeSessionTabMatches(nextRequest.tabId)
  ) {
    return;
  }

  dataLayerObserverState = restartObservation(
    dataLayerSessionState,
    dataLayerObserverState,
    observation,
  );
  updateSessionFromObserverState();
  persistAndRenderObservationState();

  if (dataLayerObserverState.observer?.status === "ready") {
    await startLiveHistoryCapture(observation);
    return;
  }

  if (
    shouldRetryObservationRefresh(
      observation.pageAccessStatus,
      nextRequest.attempt,
    )
  ) {
    scheduleObservationRefresh(nextObservationRefreshAttempt(nextRequest));
  }
}

async function recordDataLayerCommandRun(entry: CommandRunRecord): Promise<void> {
  if (entry.commandId === "data-layer.start-testing") {
    await attachSelectedTarget();
  }

  if (entry.commandId === "data-layer.end-testing") {
    ({ sessionState: dataLayerSessionState, targetState: observationTargetState } =
      endLiveSession(
        dataLayerSessionState,
        observationTargetState,
        () => stopLiveHistoryCapture(),
      ));
    persistAndRenderObservationState();
    renderObservationTargetContext();
    setObservationTargetResult("");
    setLiveSessionMessage(testingEndedMessage());
  }

  if (entry.commandId === "data-layer.choose-observation-target") {
    showObservationTargetPicker(observationTargetElements);
    await discoverCurrentObservationTarget();
    observationTargetSearch?.focus();
  }

  if (entry.commandId === "data-layer.attach-selected-target") {
    await attachSelectedTarget();
  }

  if (entry.commandId === "data-layer.detach-observation-target") {
    beginDetachSelectedTarget();
  }
}

function recordCommandRun(entry: CommandRunRecord): void {
  void recordDataLayerCommandRun(entry);

  if (commandLog) {
    commandLog.textContent = entry.message;
  }
}

const commandRunContext = {
  record: recordCommandRun,
  showWorkspace,
  showDataLayerView: showDataLayerView,
};

const paletteController = createPaletteController({
  root: panelRoot,
  sidePanelContent,
  commands: allCommands,
  runCommand: (command) => runCommandById(command.id, commandRunContext),
});

function setKeymapStatus(message: string): void {
  if (keymapStatus) {
    keymapStatus.textContent = message;
  }
}

function setKeymapWarning(message: string): void {
  if (keymapWarning) {
    keymapWarning.textContent = message;
  }
}

const workspaceTabsController = createWorkspaceTabsController(
  workspaceTabList,
  localStorage,
);

const hotkeyEditor = createHotkeyEditor({
  commands: allCommands,
  container: hotkeyEditorCommands,
  filter: hotkeyEditorFilter,
  getKeymap: () => activeHotkeyKeymap,
  setKeymap: (keymap) => {
    activeHotkeyKeymap = keymap;
    storeHotkeyKeymap(keymap);
  },
  setStatus: setKeymapStatus,
  setWarning: setKeymapWarning,
});

function showWorkspace(tab: WorkspaceTabId, focus = false): void {
  workspaceTabsController.show(tab, focus);
}

function activateHotkeyFocus(): void {
  if (!panelRoot) {
    return;
  }

  panelRoot.focus();
  panelRoot.dataset.hotkeyFocus = "active";
}

function hotkeyFocusActive(): boolean {
  return panelRoot?.dataset.hotkeyFocus === "active";
}

function clearPendingHotkeySequence(): void {
  pendingHotkeySequence = [];
}

function keymapFileName(): string {
  return `${PROJECT_NAME}-hotkey-keymap.json`;
}

function downloadHotkeyKeymapFile(keymap: HotkeyKeymap): void {
  const blob = new Blob([`${JSON.stringify(keymap, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = keymapFileName();
  link.click();
  URL.revokeObjectURL(url);
}

function updateKeymapStatus(
  added: readonly string[],
  removed: readonly string[],
): void {
  setKeymapStatus(
    `Keymap updated: added ${added.length}, removed ${removed.length}`,
  );
}

function shouldIgnoreHotkeyTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

function storeHotkeyKeymap(keymap: HotkeyKeymap): void {
  localStorage.setItem(HOTKEY_KEYMAP_STORAGE_KEY, JSON.stringify(keymap));
}

function loadStoredHotkeyKeymap(): HotkeyKeymap | undefined {
  const stored = localStorage.getItem(HOTKEY_KEYMAP_STORAGE_KEY);

  if (!stored) {
    return undefined;
  }

  try {
    const validation = validateHotkeyKeymap(JSON.parse(stored), allCommands);
    return validation.valid ? validation.keymap : undefined;
  } catch {
    return undefined;
  }
}

function loadHotkeyKeymap(value: unknown): boolean {
  const validation = validateHotkeyKeymap(value, allCommands);
  const duplicates = validation.keymap
    ? duplicateSequences(validation.keymap)
    : validation.duplicateSequences;

  if (!validation.valid || !validation.keymap) {
    const duplicateSequence = duplicates[0]?.sequence;
    setKeymapWarning(
      duplicateSequence
        ? `Duplicate key sequence: ${duplicateSequence}`
        : (validation.error ?? "Invalid hotkey keymap."),
    );
    return false;
  }

  activeHotkeyKeymap = validation.keymap;
  storeHotkeyKeymap(activeHotkeyKeymap);
  hotkeyEditor.render();
  clearPendingHotkeySequence();
  setKeymapWarning("");
  setKeymapStatus("Keymap loaded");
  activateHotkeyFocus();
  return true;
}

function createHotkeyKeymapFile(): void {
  activeHotkeyKeymap = blankHotkeyKeymap(allCommands);
  downloadHotkeyKeymapFile(activeHotkeyKeymap);
  hotkeyEditor.render();
  setKeymapWarning("");
  setKeymapStatus("Blank keymap created");
}

function updateHotkeyKeymapFile(): void {
  const summary = updateHotkeyKeymap(activeHotkeyKeymap, allCommands);

  activeHotkeyKeymap = summary.keymap;
  downloadHotkeyKeymapFile(activeHotkeyKeymap);
  hotkeyEditor.render();
  setKeymapWarning("");
  updateKeymapStatus(summary.added, summary.removed);
}

async function loadHotkeyKeymapFile(): Promise<void> {
  const file = keymapFileInput?.files?.[0];

  if (!file) {
    return;
  }

  try {
    loadHotkeyKeymap(JSON.parse(await file.text()));
  } catch {
    setKeymapWarning("Keymap file must contain valid JSON.");
  } finally {
    if (keymapFileInput) {
      keymapFileInput.value = "";
    }
  }
}

function handleHotkeyKeydown(event: KeyboardEvent): void {
  if (!hotkeyFocusActive() || shouldIgnoreHotkeyTarget(event.target)) {
    return;
  }

  if (event.key === "Escape" && pendingHotkeySequence.length > 0) {
    event.preventDefault();
    clearPendingHotkeySequence();
    return;
  }

  const hadPendingSequence = pendingHotkeySequence.length > 0;
  const advance = advanceHotkeySequence(
    activeHotkeyKeymap,
    pendingHotkeySequence,
    keyTokenFromKeyboardEvent(event),
  );

  if (advance.status === "pending") {
    event.preventDefault();
    pendingHotkeySequence = advance.pending;
    return;
  }

  if (advance.status === "matched" && advance.commandId) {
    event.preventDefault();
    clearPendingHotkeySequence();
    runCommandById(advance.commandId, commandRunContext);
    return;
  }

  clearPendingHotkeySequence();
  if (hadPendingSequence) {
    event.preventDefault();
  }
}

function isFocusHotkeysMessage(message: unknown): message is { type: string } {
  return (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    message.type === "focus-app-hotkeys"
  );
}

startTestingButton?.addEventListener("click", () => {
  runCommandById("data-layer.start-testing", commandRunContext);
});
endTestingButton?.addEventListener("click", () => {
  runCommandById("data-layer.end-testing", commandRunContext);
});

workspaceTabsController.bind();
hotkeyEditor.bind();
paletteController.bind();

dataLayerViewList?.addEventListener("click", (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>("[role=tab]");
  const view = button?.textContent as DataLayerView | null;
  if (view && dataLayerViews.includes(view)) showDataLayerView(view, true);
});

dataLayerViewList?.addEventListener("keydown", (event) => {
  const next = dataLayerViewForNavigationKey(liveObserverState.view, event.key);
  if (next) {
    event.preventDefault();
    showDataLayerView(next, true);
  }
});

pauseCaptureButton?.addEventListener("click", () => {
  liveObserverState = pauseCapture(liveObserverState);
  setLiveSessionMessage("Capture paused");
  renderLiveObserver();
});

resumeCaptureButton?.addEventListener("click", () => {
  liveObserverState = resumeCapture(liveObserverState);
  setLiveSessionMessage("Capture resumed");
  renderLiveObserver();
});

copyPageUrlButton?.addEventListener("click", () => {
  void copyLivePageUrl();
});

function currentSessionSaveDraft(): SessionSaveDraft {
  const now = new Date().toISOString();
  return createSessionSaveDraft({
    id: `live-${Date.now()}`,
    pageScope: liveObserverState.pageUrl,
    startedAt: liveObserverState.events[0]?.captureTime ?? now,
    endedAt: liveObserverState.events.at(-1)?.captureTime ?? now,
    events: liveObserverState.events.map((event, index) => ({
      id: event.id,
      sourceId: event.sourceId,
      sourceName: event.sourceName ?? event.sourceId,
      name: event.name,
      payload: event.payload,
      rawInput: event.rawInput ?? event,
      pageUrl: event.pageUrl ?? liveObserverState.pageUrl,
      captureOrder: index + 1,
      captureTime:event.captureTime,
      ...(event.sourceKind ? { sourceKind:event.sourceKind } : {}),
      ...(event.destination ? { destination:event.destination } : {}),
      ...(event.validation ? { validation:event.validation } : {}),
      ...(event.validationDetails ? { validationDetails:event.validationDetails } : {}),
      provenance: event.provenance ?? {
        source: "live-observer",
        capturedAt: event.captureTime,
      },
    })),
    provenance: { source: "live-observer", capturedAt: now },
  });
}

function openSessionSaveDialog(startFreshAfterSave = false): void {
  if (savedSessionLiveFeed) return;
  startFreshAfterSessionSave = startFreshAfterSave;
  pendingSessionSaveDraft = currentSessionSaveDraft();
  if (saveLiveSessionName) saveLiveSessionName.value = "";
  if (confirmSaveLiveSessionButton) confirmSaveLiveSessionButton.disabled = true;
  if (saveLiveSessionHeading) saveLiveSessionHeading.textContent = startFreshAfterSave ? "Save session before starting fresh" : "Save session snapshot";
  if (confirmSaveLiveSessionButton) confirmSaveLiveSessionButton.textContent = startFreshAfterSave ? "Save and start fresh" : "Save snapshot";
  if (saveLiveSessionSummary) {
    const summary = pendingSessionSaveDraft.summary;
    saveLiveSessionSummary.textContent = `${summary.pageScope} · ${summary.eventCount} events · ${summary.sourceCount} sources · ${summary.validationSummary}`;
  }
  saveLiveSessionDialog?.showModal();
  saveLiveSessionHeading?.focus({ preventScroll:true });
}

function startFreshSession(): void {
  if (savedSessionLiveFeed) return;
  const session = dataLayerSessionState.session;
  if (!session) return;
  const fresh = startFreshLiveSession(
    dataLayerSessionState,
    liveObserverState,
    dataLayerObserverState,
    newDataLayerSessionId(session.tabId),
  );
  if (!fresh.started) return;
  dataLayerSessionState = fresh.sessionState;
  liveObserverState = fresh.liveObserverState;
  installDefaultSavedEventFeedFilterForNewSession();
  dataLayerObserverState = fresh.observerState;
  presentedSourceEventCount = 0;
  savedThroughEventCount = 0;
  localStorage.setItem(SAVED_THROUGH_EVENT_COUNT_STORAGE_KEY, "0");
  inspectorReturnSnapshot = undefined;
  savedInspectorTemplateId = undefined;
  if (guidedValidationFlow.currentDraft()) guidedValidationFlow.close();
  persistAndRenderObservationState();
  renderLiveObserver();
  if (liveObserverElements.eventList) liveObserverElements.eventList.scrollTop = 0;
  setLiveSessionMessage("Fresh session started with 0 captured events.");
  startFreshSessionButton?.focus({ preventScroll:true });
}

saveLiveSessionButton?.addEventListener("click", () => openSessionSaveDialog());
reportMissingEventButton?.addEventListener("click", () => openMissingEventBuilder(savedSessionLiveFeed ? "saved session" : "Live session actions"));
startFreshSessionButton?.addEventListener("click", () => {
  const availability = freshSessionAvailability({
    eventCount:liveObserverState.events.length,
    savedThroughEventCount,
    savedSessionMode:Boolean(savedSessionLiveFeed),
  });
  if (availability.action === "unavailable") return;
  if (availability.action === "start") { startFreshSession(); return; }
  if (freshSessionConfirmationSummary) freshSessionConfirmationSummary.textContent = `${availability.unsavedEventCount} unsaved events would be discarded.`;
  freshSessionConfirmation?.showModal();
  freshSessionConfirmationHeading?.focus({ preventScroll:true });
});

saveLiveSessionName?.addEventListener("input", () => {
  if (confirmSaveLiveSessionButton) confirmSaveLiveSessionButton.disabled = !saveLiveSessionName.value.trim();
});
saveLiveSessionForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = saveLiveSessionName?.value.trim() ?? "";
  if (!pendingSessionSaveDraft || !name) return;
  savedSessionLibrary = confirmSessionSave(savedSessionLibrary, pendingSessionSaveDraft, name);
  savedThroughEventCount = pendingSessionSaveDraft.completed.events.length;
  localStorage.setItem(SAVED_THROUGH_EVENT_COUNT_STORAGE_KEY, String(savedThroughEventCount));
  pendingSessionSaveDraft = undefined;
  persistSavedSessionLibrary();
  saveLiveSessionDialog?.close();
  renderSavedSessions();
  if (startFreshAfterSessionSave) {
    startFreshAfterSessionSave = false;
    startFreshSession();
    return;
  }
  setLiveSessionMessage(`Saved immutable snapshot ${name}; capture state unchanged.`);
  saveLiveSessionButton?.focus({ preventScroll:true });
});
const closeSaveLiveSessionDialog = () => {
  pendingSessionSaveDraft = undefined;
  const returnToFreshAction = startFreshAfterSessionSave;
  startFreshAfterSessionSave = false;
  if (saveLiveSessionDialog?.open) saveLiveSessionDialog.close();
  (returnToFreshAction ? startFreshSessionButton : saveLiveSessionButton)?.focus({ preventScroll:true });
};
cancelSaveLiveSessionButton?.addEventListener("click", closeSaveLiveSessionDialog);
saveLiveSessionDialog?.addEventListener("cancel", (event) => { event.preventDefault(); closeSaveLiveSessionDialog(); });

const closeFreshSessionConfirmation = () => {
  if (freshSessionConfirmation?.open) freshSessionConfirmation.close();
  startFreshSessionButton?.focus({ preventScroll:true });
};
cancelFreshSessionButton?.addEventListener("click", closeFreshSessionConfirmation);
freshSessionConfirmation?.addEventListener("cancel", (event) => { event.preventDefault(); closeFreshSessionConfirmation(); });
saveAndStartFreshSessionButton?.addEventListener("click", () => {
  if (freshSessionConfirmation?.open) freshSessionConfirmation.close();
  openSessionSaveDialog(true);
});
discardAndStartFreshSessionButton?.addEventListener("click", () => {
  if (freshSessionConfirmation?.open) freshSessionConfirmation.close();
  startFreshSession();
});

returnToCurrentLiveFeedButton?.addEventListener("click", () => {
  if (!savedSessionLiveFeed) return;
  const returned = returnToCurrentLiveFeed(savedSessionLiveFeed);
  savedSessionLiveFeed = undefined;
  persistSavedSessionFeed();
  liveObserverState = returned.state;
  renderLiveObserver();
  if (liveObserverElements.eventList) liveObserverElements.eventList.scrollTop = returned.scrollTop;
  setLiveSessionMessage(`Returned to current Live feed${returned.newEventCount ? ` with ${returned.newEventCount} new events` : ""}.`);
});

revalidateSavedSessionButton?.addEventListener("click", () => {
  if (!savedSessionLiveFeed) return;
  savedSessionLiveFeed = revalidateSavedSessionLiveFeed(savedSessionLiveFeed, (event) => {
    const result = validateEvent({ sourceId:event.sourceId, eventName:event.name, payload:event.payload, rawInput:event.rawInput }, schemas, event.pageUrl);
    return { state:result.state, ...(result.schema ? { schema:{ name:result.schema.name, version:result.schema.version } } : {}) };
  });
  persistSavedSessionFeed();
  renderSavedSessionLiveBanner();
});

liveObserverElements.eventList?.addEventListener("scroll", () => synchronizeSavedSessionFeedView());

savedSessionSearch?.addEventListener("input", renderSavedSessions);
for (const filter of [defectLibrarySearch, defectLibraryStatus, defectLibraryType, defectLibraryEvent, defectLibrarySchema, defectLibraryPath]) {
  filter?.addEventListener("input", renderDefects);
  filter?.addEventListener("change", renderDefects);
}

eventTemplateSearch?.addEventListener("input", renderEventTemplateLibrary);
templateEmptyRecovery?.addEventListener("click", () => {
  if (eventTemplateSearch?.value.trim()) {
    eventTemplateSearch.value = "";
    renderEventTemplateLibrary();
  } else {
    showDataLayerView("Live");
  }
});
schemaSearch?.addEventListener("input", renderSchemas);
schemaSubviews.forEach((tab) => tab.addEventListener("click", () => showSchemaSubview(tab.getAttribute("aria-controls") as "schema-master" | "schema-rule-library" | "schema-assignments")));
schemaEditorName?.addEventListener("input", () => {
  if (!schemaDraft) return;
  schemaDraft = { ...schemaDraft, name:schemaEditorName.value };
  persistSchemaEditorDraft(); renderSchemaDraft();
});
saveSchemaDescriptionButton?.addEventListener("click", () => {
  if (!schemaDraft || !schemaEditorDescription) return;
  schemaDraft = { ...schemaDraft, documentation:setSchemaDescription(schemaDraft.documentation ?? {}, schemaEditorDescription.value) };
  persistSchemaEditorDraft("Update schema description"); renderSchemaDraft();
});
schemaEditorTarget?.addEventListener("input", () => {
  if (!schemaDraft) return;
  const target = schemaEditorTarget.value === "raw input" ? "raw input" : "payload";
  schemaDraft = {
    ...schemaDraft,
    assignments:schemaDraft.assignments.length
      ? schemaDraft.assignments.map((assignment) => ({ ...assignment, target }))
      : [{ sourceId:"", eventName:"", target }],
  };
  persistSchemaEditorDraft("Change validation target"); renderSchemaDraft();
});
schemaEditorParent?.addEventListener("change", () => { if (schemaDraft) { schemaDraft = withSchemaParent(schemaDraft, schemaEditorParent.value || undefined); persistSchemaEditorDraft("Change parent schema"); renderSchemaDraft(); } });
schemaOnlyDeclaredProperties?.addEventListener("change", () => { if (schemaDraft) { const { additionalProperties: _previous, ...document } = schemaDraft.document; schemaDraft = { ...schemaDraft, document:schemaOnlyDeclaredProperties.checked ? { ...document, additionalProperties:false } : document }; persistSchemaEditorDraft("Change additional-property policy"); renderSchemaDraft(); } });
createSchemaButton?.addEventListener("click", openNewSchemaEditor);
addSchemaPropertyButton?.addEventListener("click", openManualPropertyForm);
saveSchemaButton?.addEventListener("click", () => {
  if (!schemaDraft || saveSchemaButton.disabled) return;
  const draft = schemaDraft;
  if (schemaRevisionReview) {
    const existing = schemas.find((schema) => schema.id === draft.id);
    if (existing) persistSchemaEditorDraft();
    const persisted = schemas.find((schema) => schema.id === draft.id);
    const pendingChangeSummary = persisted?.workingDraft?.pendingChanges
      .filter((change) => !change.startsWith("Rename schema from "))
      .join("; ") ?? "";
    const proposedName = persisted?.workingDraft?.name ?? draft.name;
    const renameSummary = existing && proposedName !== existing.name ? ` Rename schema from ${existing.name} to ${proposedName}.` : "";
    if (schemaRevisionReviewSummary) schemaRevisionReviewSummary.textContent = existing?.published === false
      ? `${draft.name} draft will be published as current revision 1.`
      : existing
        ? `${existing.name} working draft will be compared with current revision ${existing.version}; confirmation publishes revision ${existing.version + 1}.${renameSummary}${pendingChangeSummary ? ` Pending changes: ${pendingChangeSummary}.` : ""}`
        : `${draft.name} will be published as current revision 1.`;
    if (confirmSchemaRevisionButton) confirmSchemaRevisionButton.textContent = existing?.published === false || !existing ? "Publish revision 1" : `Publish revision ${existing.version + 1}`;
    schemaRevisionReview.hidden = false; schemaRevisionReview.showModal(); return;
  }
  confirmSchemaRevisionButton?.click();
});
confirmSchemaRevisionButton?.addEventListener("click", () => {
  if (pendingSchemaRestoration) {
    const current = schemas.find((schema) => schema.id === pendingSchemaRestoration?.schemaId);
    if (!current) return;
    const restored = restoreSchemaRevisionDraft(current, pendingSchemaRestoration.version);
    schemas = schemas.map((schema) => schema.id === restored.id ? restored : schema);
    schemaDraft = schemaEditorDraft(restored); pendingSchemaRestoration = undefined;
    persistSchemaLibrary(); renderSchemas(); renderSchemaDraft();
    if (schemaRevisionReview?.open) schemaRevisionReview.close(); if (schemaRevisionReview) schemaRevisionReview.hidden = true;
    if (schemaResult) schemaResult.textContent = `Created ${restored.name} working draft from revision ${restored.workingDraft?.sourceVersion}; current revision ${restored.version} is unchanged.`;
    return;
  }
  if (!schemaDraft) return;
  const draft = schemaDraft;
  const target = schemaEditorTarget?.value === "raw input" ? "raw input" : "payload";
  const existing = schemas.find((schema) => schema.id === draft.id);
  const candidate = { ...draft, id:existing?.id ?? createSchema(draft.name, 1, draft.document).id };
  const candidates = [...schemas.filter((schema) => schema.id !== candidate.id), candidate];
  const inheritanceError = schemaInheritanceError(candidate, candidates) ?? schemaInheritanceConflict(candidate, candidates);
  if (inheritanceError) { if (schemaResult) schemaResult.textContent = inheritanceError; return; }
  const saved = existing
    ? publishSchemaWorkingDraft(updateSchemaWorkingDraft(existing, {
      name:draft.name.trim(),
      document:draft.document,
      assignments:draft.assignments,
      attachedRules:draft.attachedRules,
      parentSchemaId:draft.parentSchemaId,
      inheritedRuleOverrides:draft.inheritedRuleOverrides,
      documentation:draft.documentation,
    }))
    : { ...draft, id:`schema:${draft.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}:1`, published:true, assignments:draft.assignments.length ? draft.assignments : [{ sourceId:"", eventName:"", target:target as "payload" | "raw input" }] };
  schemas = existing ? schemas.map((schema) => schema.id === existing.id ? saved : schema) : [...schemas, saved];
  for (const rule of saved.attachedRules ?? []) {
    if (!rule.id.startsWith("rule:") || reusableSchemaRules.some(({ id }) => id === rule.id)) continue;
    reusableSchemaRules = [...reusableSchemaRules, { id:rule.id, name:rule.name ?? rule.id, kind:rule.operator ?? "required", version:rule.version, enabled:rule.enabled !== false, ...(rule.operator ? { operator:rule.operator } : {}), ...(rule.parameters ? { parameters:rule.parameters } : {}), ...(rule.severity ? { severity:rule.severity } : {}), ...(rule.message ? { message:rule.message } : {}), attachments:[saved.id] }];
  }
  persistSchemaLibrary(); localStorage.setItem(SCHEMA_RULE_STORAGE_KEY, JSON.stringify(reusableSchemaRules));
  const refreshedEventCount = refreshCurrentLiveAfterSchemaPublication();
  schemaDraft = undefined; renderSchemaDraft(); renderSchemas(); renderSchemaWorkflowRows();
  if (schemaResult) schemaResult.textContent = `Published ${saved.name} revision ${saved.version}. Revalidated ${refreshedEventCount} current Live ${refreshedEventCount === 1 ? "event" : "events"}.`;
  if (schemaRevisionReview?.open) schemaRevisionReview.close(); if (schemaRevisionReview) schemaRevisionReview.hidden = true;
});
cancelSchemaRevisionButton?.addEventListener("click", () => { pendingSchemaRestoration = undefined; if (schemaRevisionReview?.open) schemaRevisionReview.close(); if (schemaRevisionReview) schemaRevisionReview.hidden = true; });
schemaRevisionSelector?.addEventListener("change", () => {
  if (!schemaDraft || !schemaRevisionComparison) return;
  const current = schemas.find((schema) => schema.id === schemaDraft?.id);
  const version = Number(schemaRevisionSelector.value);
  const historical = current && schemaRevision(current, version);
  schemaRevisionComparison.textContent = historical ? `Revision ${version} compared with current revision ${current.version}. ${Object.keys(historical.document.properties ?? {}).length} historical properties; ${Object.keys(current.document.properties ?? {}).length} current properties.` : "Historical revision unavailable.";
});
duplicateSchemaRevisionButton?.addEventListener("click", () => {
  if (!schemaDraft) return;
  const current = schemas.find((schema) => schema.id === schemaDraft?.id); const version = Number(schemaRevisionSelector?.value);
  if (!current || !version) return;
  const duplicate = duplicateSchemaRevision(current, version, schemas); schemas = [...schemas, duplicate]; schemaDraft = schemaEditorDraft(duplicate);
  persistSchemaLibrary(); renderSchemas(); renderSchemaDraft(); schemaEditorName?.focus({ preventScroll:true });
});
restoreSchemaRevisionButton?.addEventListener("click", () => {
  if (!schemaDraft) return;
  const current = schemas.find((schema) => schema.id === schemaDraft?.id); const version = Number(schemaRevisionSelector?.value);
  if (!current || !version) return;
  pendingSchemaRestoration = { schemaId:current.id, version };
  if (schemaRevisionReviewSummary) schemaRevisionReviewSummary.textContent = `${current.name} revision ${version} will replace ${current.workingDraft?.pendingChanges.length ?? 0} pending draft changes and create a working draft. Current revision ${current.version} remains active; publication will create revision ${current.version + 1}.`;
  if (confirmSchemaRevisionButton) confirmSchemaRevisionButton.textContent = `Restore revision ${version} to working draft`;
  if (schemaRevisionReview) { schemaRevisionReview.hidden = false; schemaRevisionReview.showModal(); }
});
discardSchemaDraftButton?.addEventListener("click", () => { schemaDraft = undefined; renderSchemaDraft(); if (schemaCloseReview?.open) schemaCloseReview.close(); if (schemaCloseReview) schemaCloseReview.hidden = true; });
discardWorkingSchemaDraftButton?.addEventListener("click", () => {
  if (!schemaDraft) return;
  const stored = schemas.find((schema) => schema.id === schemaDraft?.id);
  if (!stored) return;
  schemas = stored.published === false ? schemas.filter((schema) => schema.id !== stored.id) : schemas.map((schema) => schema.id === stored.id ? discardSchemaWorkingDraft(stored) : schema);
  schemaDraft = undefined; persistSchemaLibrary(); renderSchemaDraft(); renderSchemas(); renderSchemaWorkflowRows();
  if (schemaResult) schemaResult.textContent = `Discarded ${stored.name} working draft; revision ${stored.version} remains current.`;
});
keepEditingSchemaButton?.addEventListener("click", () => { if (schemaCloseReview?.open) schemaCloseReview.close(); if (schemaCloseReview) schemaCloseReview.hidden = true; schemaEditorName?.focus({ preventScroll:true }); });
closeSchemaEditorButton?.addEventListener("click", () => { if (!schemaDraft) return; schemaDraft = undefined; renderSchemaDraft(); renderSchemas(); if (schemaResult) schemaResult.textContent = "Working draft retained without publishing."; });
saveAndCloseSchemaButton?.addEventListener("click", () => { saveSchemaButton?.click(); });
saveSchemaCloseReviewButton?.addEventListener("click", () => { if (schemaCloseReview?.open) schemaCloseReview.close(); if (schemaCloseReview) schemaCloseReview.hidden = true; saveSchemaButton?.click(); });
createSchemaRuleButton?.addEventListener("click", () => { editingReusableSchemaRuleId = undefined; schemaRuleAttachments?.replaceChildren(...schemas.map((schema) => Object.assign(document.createElement("option"), { value:schema.id, textContent:`${schema.name} v${schema.version}` }))); if (schemaRuleEditor) schemaRuleEditor.hidden = false; schemaRuleName?.focus({ preventScroll:true }); });
let pendingRuleSnapshotMetadata: { id: string; severity?: string; message?: string } | undefined;
saveSchemaRuleButton?.addEventListener("pointerdown", () => { if (editingReusableSchemaRuleId) { const previous = reusableSchemaRules.find((candidate) => candidate.id === editingReusableSchemaRuleId); if (previous) pendingRuleSnapshotMetadata = { id: previous.id, ...(previous.severity ? { severity: previous.severity } : {}), ...(previous.message ? { message: previous.message } : {}) }; } });
schemaRuleEditor?.addEventListener("click", (event) => { if ((event.target as HTMLElement).id === "schema-rule-save" && editingReusableSchemaRuleId) { const previous = reusableSchemaRules.find((candidate) => candidate.id === editingReusableSchemaRuleId); if (previous) pendingRuleSnapshotMetadata = { id: previous.id, ...(previous.severity ? { severity: previous.severity } : {}), ...(previous.message ? { message: previous.message } : {}) }; } });
saveSchemaRuleButton?.addEventListener("click", () => { const name = schemaRuleName?.value.trim(); if (!name) return; const parameters = schemaRuleParameters?.value.trim(); const applicableType = schemaRuleTypes?.value as SchemaPropertyType | undefined; const operator = schemaRuleOperator?.value; const severity = schemaRuleSeverity?.value; const message = schemaRuleMessage?.value.trim(); const examples = schemaRuleExamples?.value.trim(); const metadata = [applicableType, operator, severity, message, examples].filter(Boolean).join(" · "); const previous = reusableSchemaRules.find((candidate) => candidate.id === editingReusableSchemaRuleId); const rule: ReusableSchemaRule = { id:editingReusableSchemaRuleId ?? `rule:${crypto.randomUUID()}`, name, kind:`${document.querySelector<HTMLSelectElement>("#schema-rule-kind")?.value ?? "Required"}${parameters ? ` (${parameters})` : ""}${metadata ? ` · ${metadata}` : ""}`, version:(previous?.version ?? 0) + 1, enabled:previous?.enabled ?? true, ...(applicableType ? { applicableType } : {}), ...(operator ? { operator } : {}), ...(parameters ? { parameters } : {}), ...(severity ? { severity } : {}), ...(message ? { message } : {}), ...(examples ? { examples } : {}), ...(previous?.conditionGroup ? { conditionGroup:structuredClone(previous.conditionGroup) } : {}), attachments:Array.from(schemaRuleAttachments?.selectedOptions ?? []).map((option) => option.value), ...(previous ? { revisionHistory:[...(previous.revisionHistory ?? []), { name:previous.name, kind:previous.kind, version:previous.version ?? 1, ...(previous.enabled === false ? { enabled:false } : {}), ...(previous.conditionGroup ? { conditionGroup:structuredClone(previous.conditionGroup) } : {}) }] } : {}) }; reusableSchemaRules = editingReusableSchemaRuleId ? reusableSchemaRules.map((candidate) => candidate.id === editingReusableSchemaRuleId ? rule : candidate) : [...reusableSchemaRules, rule]; if (!previous || updateSchemaRuleAttachments?.checked) schemas = schemas.map((schema) => { const { attachedRules: _attachedRules, ...withoutAttachments } = schema; const attached = [...(schema.attachedRules ?? []).filter((item) => item.id !== rule.id), ...(rule.attachments?.includes(schema.id) ? [{ id:rule.id, name:rule.name, version:rule.version ?? 1, ...(operator ? { operator } : {}), ...(parameters ? { parameters } : {}), ...(severity ? { severity } : {}), ...(message ? { message } : {}), ...(rule.conditionGroup ? { conditionGroup:structuredClone(rule.conditionGroup) } : {}), enabled:rule.enabled !== false }] : [])]; return attached.length ? { ...withoutAttachments, attachedRules:attached } : withoutAttachments; }); editingReusableSchemaRuleId = undefined; localStorage.setItem(SCHEMA_RULE_STORAGE_KEY, JSON.stringify(reusableSchemaRules)); persistSchemaLibrary(); renderSchemaWorkflowRows(); if (schemaResult) schemaResult.textContent = `Saved reusable rule ${name}.`; if (schemaRuleEditor) schemaRuleEditor.hidden = true; });
saveSchemaRuleButton?.addEventListener("click", () => { if (!pendingRuleSnapshotMetadata) return; reusableSchemaRules = reusableSchemaRules.map((rule) => rule.id === pendingRuleSnapshotMetadata?.id && rule.revisionHistory?.length ? { ...rule, revisionHistory:rule.revisionHistory.map((snapshot, index) => index === rule.revisionHistory!.length - 1 ? { ...snapshot, ...(pendingRuleSnapshotMetadata?.severity ? { severity:pendingRuleSnapshotMetadata.severity } : {}), ...(pendingRuleSnapshotMetadata?.message ? { message:pendingRuleSnapshotMetadata.message } : {}) } : snapshot) } : rule); localStorage.setItem(SCHEMA_RULE_STORAGE_KEY, JSON.stringify(reusableSchemaRules)); pendingRuleSnapshotMetadata = undefined; });
saveSchemaRuleButton?.addEventListener("click", (event) => {
  const previous = reusableSchemaRules.find((rule) => rule.id === editingReusableSchemaRuleId);
  if (!previous) return;
  if (updateSchemaRuleAttachments?.checked && approvedRuleAttachmentUpdateId !== previous.id) {
    event.stopImmediatePropagation();
    if (schemaRuleUpgradeReviewSummary) schemaRuleUpgradeReviewSummary.textContent = `Confirm updating pinned attachments for ${previous.name} v${previous.version ?? 1}.`;
    if (schemaRuleUpgradeReview && !schemaRuleUpgradeReview.open) { schemaRuleUpgradeReview.hidden = false; schemaRuleUpgradeReview.showModal(); }
    return;
  }
  if (approvedRuleRevisionId === previous.id) { approvedRuleRevisionId = undefined; return; }
  event.stopImmediatePropagation();
  const nextName = schemaRuleName?.value.trim() || previous.name;
  const nextParameters = schemaRuleParameters?.value.trim() ?? previous.parameters ?? "";
  const nextExamples = schemaRuleExamples?.value.trim() ?? previous.examples ?? "";
  schemaRuleRevisionReviewSummary.textContent = `${previous.name} v${previous.version ?? 1} will become ${nextName} v${(previous.version ?? 0) + 1}; parameters ${previous.parameters ?? "none"} → ${nextParameters || "none"}; examples ${previous.examples ?? "none"} → ${nextExamples || "none"}.`;
  schemaRuleRevisionReview.showModal();
}, true);
confirmSchemaRuleRevisionButton.addEventListener("click", () => {
  if (!editingReusableSchemaRuleId) return;
  approvedRuleRevisionId = editingReusableSchemaRuleId;
  schemaRuleRevisionReview.close();
  saveSchemaRuleButton?.click();
});
cancelSchemaRuleRevisionButton.addEventListener("click", () => schemaRuleRevisionReview.close());
schemaRuleSearch?.addEventListener("input", renderSchemaWorkflowRows);
updateSchemaRuleAttachments?.addEventListener("change", () => { approvedRuleAttachmentUpdateId = undefined; if (updateSchemaRuleAttachments.checked && schemaRuleUpgradeReview) { const affected = Array.from(schemaRuleAttachments?.selectedOptions ?? []).map((option) => { const schema = schemas.find((candidate) => candidate.id === option.value); const pinned = schema?.attachedRules?.find((rule) => rule.id === editingReusableSchemaRuleId)?.version; return `${option.textContent}${pinned ? ` (pinned v${pinned})` : " (new attachment)"}`; }); if (schemaRuleUpgradeReviewSummary) schemaRuleUpgradeReviewSummary.textContent = affected.length ? `Saving will update: ${affected.join(", ")}.` : "Saving will remove this rule from all selected schema attachments."; schemaRuleUpgradeReview.hidden = false; schemaRuleUpgradeReview.showModal(); } });
confirmSchemaRuleUpgradeButton?.addEventListener("click", () => { approvedRuleAttachmentUpdateId = editingReusableSchemaRuleId; if (schemaRuleUpgradeReview?.open) schemaRuleUpgradeReview.close(); if (schemaRuleUpgradeReview) schemaRuleUpgradeReview.hidden = true; });
cancelSchemaRuleUpgradeButton?.addEventListener("click", () => { if (updateSchemaRuleAttachments) updateSchemaRuleAttachments.checked = false; if (schemaRuleUpgradeReview?.open) schemaRuleUpgradeReview.close(); if (schemaRuleUpgradeReview) schemaRuleUpgradeReview.hidden = true; });
exportSchemaRulesButton?.addEventListener("click", () => { const blob = new Blob([`${JSON.stringify(reusableSchemaRules, null, 2)}\n`], { type:"application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "schema-rules.json"; link.click(); URL.revokeObjectURL(url); });
confirmSchemaRuleDeleteButton?.addEventListener("click", () => { if (!pendingReusableSchemaRuleDeletionId) return; reusableSchemaRules = reusableSchemaRules.filter((rule) => rule.id !== pendingReusableSchemaRuleDeletionId); pendingReusableSchemaRuleDeletionId = undefined; localStorage.setItem(SCHEMA_RULE_STORAGE_KEY, JSON.stringify(reusableSchemaRules)); renderSchemaWorkflowRows(); if (schemaRuleDeleteReview?.open) schemaRuleDeleteReview.close(); if (schemaRuleDeleteReview) schemaRuleDeleteReview.hidden = true; });
cancelSchemaRuleDeleteButton?.addEventListener("click", () => { pendingReusableSchemaRuleDeletionId = undefined; if (schemaRuleDeleteReview?.open) schemaRuleDeleteReview.close(); if (schemaRuleDeleteReview) schemaRuleDeleteReview.hidden = true; });
schemaAssignmentTarget?.addEventListener("change", () => {
  if (!schemaAssignmentConditionState.group) {
    schemaAssignmentConditionState = assignmentConditionEditorState(schemaAssignmentTarget.value === "raw input" ? "raw input" : "payload");
    renderSchemaAssignmentConditionEditor();
  }
});
createSchemaAssignmentButton?.addEventListener("click", () => {
  editingSchemaAssignment = undefined;
  const target = schemaAssignmentTarget?.value === "raw input" ? "raw input" : "payload";
  schemaAssignmentConditionState = assignmentConditionEditorState(target);
  renderSchemaAssignmentConditionEditor();
  if (schemaAssignmentEditor) schemaAssignmentEditor.hidden = false;
  schemaAssignmentSource?.focus({ preventScroll:true });
});
saveSchemaAssignmentButton?.addEventListener("click", () => {
  const schema = schemas.find((candidate) => candidate.id === schemaAssignmentSchema?.value) ?? schemas[0]; if (!schema) return;
  const existingAssignment = editingSchemaAssignment?.schemaId === schema.id
    ? schema.assignments.find((assignment) => assignment.id === editingSchemaAssignment?.assignmentId)
    : undefined;
  const conditionValidation = validateAssignmentDataConditions(schemaAssignmentConditionState.group);
  if (!conditionValidation.ready) { if (schemaResult) schemaResult.textContent = conditionValidation.assistance; renderSchemaAssignmentConditionEditor(); return; }
  const sourceId = schemaAssignmentSource?.value.trim() || "event-history"; const eventName = schemaAssignmentEvent?.value.trim() || "page_view"; const priority = Number(schemaAssignmentPriority?.value ?? 10); const target: "payload" | "raw input" = schemaAssignmentTarget?.value === "raw input" ? "raw input" : "payload";
  const domainCondition = schemaAssignmentDomain?.value.trim(); const pathnameCondition = schemaAssignmentPathname?.value.trim();
  const next: SchemaAssignment = { sourceId, eventName, target, id:editingSchemaAssignment?.assignmentId ?? `assignment:${schema.id}:${eventName}`, name:existingAssignment?.name ?? `${schema.name} automatic`, priority, ...(domainCondition ? { domainCondition } : {}), ...(pathnameCondition ? { pathnameCondition } : {}), ...(schemaAssignmentConditionState.group ? { conditionTarget:schemaAssignmentConditionState.target, dataConditionGroup:structuredClone(schemaAssignmentConditionState.group) } : {}), versionPolicy:schemaAssignmentVersionPolicy?.value === "follow latest" ? "follow latest" : "pinned", enabled:schemaAssignmentEnabled?.checked ?? true };
  schemas = schemas.map((candidate) => candidate.id === schema.id ? { ...candidate, assignments:editingSchemaAssignment?.schemaId === schema.id ? candidate.assignments.map((assignment) => assignment.id === editingSchemaAssignment?.assignmentId ? next : assignment) : [...candidate.assignments, next] } : candidate);
  editingSchemaAssignment = undefined; persistSchemaLibrary(); renderSchemas(); renderSchemaWorkflowRows(); if (schemaAssignmentEditor) schemaAssignmentEditor.hidden = true; if (schemaResult) schemaResult.textContent = `Saved ${next.name} with ${assignmentDataConditionSummary(next)}.`;
});
importSchemaButton?.addEventListener("click", () => schemaLibraryImportFile?.click());
schemaLibraryImportFile?.addEventListener("change", async () => {
  const file = schemaLibraryImportFile.files?.[0]; if (!file) return;
  try {
    const archive = JSON.parse(await file.text()) as { version?: number; schemas?: unknown; rules?: unknown };
    if (archive.version !== 1 || !Array.isArray(archive.schemas) || !Array.isArray(archive.rules)) throw new Error("Choose a version 1 Schema Library export.");
    const importedSchemas = archive.schemas.map((schema) => importSchema(JSON.stringify(schema)));
    const candidates = [...schemas.filter((schema) => !importedSchemas.some((item) => item.id === schema.id)), ...importedSchemas];
    for (const schema of importedSchemas) { const issue = schemaInheritanceError(schema, candidates) ?? schemaInheritanceConflict(schema, candidates); if (issue) throw new Error(issue); }
    pendingSchemaImport = { schemas:importedSchemas, rules:archive.rules as ReusableSchemaRule[] };
    if (schemaImportReviewSummary) schemaImportReviewSummary.textContent = `${importedSchemas.length} schemas and ${pendingSchemaImport.rules.length} reusable rules are ready to import.`;
    if (schemaImportReview) { schemaImportReview.hidden = false; schemaImportReview.showModal(); }
  } catch (error) { if (schemaResult) schemaResult.textContent = error instanceof Error ? error.message : "Schema Library import failed."; }
  schemaLibraryImportFile.value = "";
});
exportSchemaButton?.addEventListener("click", () => { const archive = createSchemaLibraryExport(schemas, reusableSchemaRules); const schemaIds = schemaLibraryExportIdentitySnapshot(archive.schemas); const ruleIds = schemaLibraryExportIdentitySnapshot(archive.rules); const blob = new Blob([`${JSON.stringify(archive, null, 2)}\n`], { type:"application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "schema-library-v1.json"; link.click(); URL.revokeObjectURL(url); if (schemaResult) schemaResult.textContent = `Exported ${schemaIds.length} schemas and ${ruleIds.length} rules.`; });
recheckSchemaValidationButton?.addEventListener("click", recheckCapturedSchemaValidation);
replaceSchemaLibraryButton?.addEventListener("click", () => { if (!pendingSchemaImport) return; schemas = pendingSchemaImport.schemas; reusableSchemaRules = pendingSchemaImport.rules; pendingSchemaImport = undefined; persistSchemaLibrary(); localStorage.setItem(SCHEMA_RULE_STORAGE_KEY, JSON.stringify(reusableSchemaRules)); renderSchemas(); renderSchemaWorkflowRows(); if (schemaImportReview?.open) schemaImportReview.close(); if (schemaImportReview) schemaImportReview.hidden = true; if (schemaResult) schemaResult.textContent = "Schema Library replaced."; });
appendSchemaLibraryButton?.addEventListener("click", () => { if (!pendingSchemaImport) return; schemas = [...schemas.filter((schema) => !pendingSchemaImport!.schemas.some((item) => item.id === schema.id)), ...pendingSchemaImport.schemas]; reusableSchemaRules = [...reusableSchemaRules.filter((rule) => !pendingSchemaImport!.rules.some((item) => item.id === rule.id)), ...pendingSchemaImport.rules]; pendingSchemaImport = undefined; persistSchemaLibrary(); localStorage.setItem(SCHEMA_RULE_STORAGE_KEY, JSON.stringify(reusableSchemaRules)); renderSchemas(); renderSchemaWorkflowRows(); if (schemaImportReview?.open) schemaImportReview.close(); if (schemaImportReview) schemaImportReview.hidden = true; if (schemaResult) schemaResult.textContent = "Schema Library appended."; });
cancelSchemaImportButton?.addEventListener("click", () => { pendingSchemaImport = undefined; if (schemaImportReview?.open) schemaImportReview.close(); if (schemaImportReview) schemaImportReview.hidden = true; });
confirmSchemaDeleteButton?.addEventListener("click", () => { const schema = pendingSchemaDeletion; if (!schema) return; schemas = schemas.filter(({ id }) => id !== schema.id); pendingSchemaDeletion = undefined; persistSchemaLibrary(); renderSchemas(); if (schemaDeleteReview?.open) schemaDeleteReview.close(); if (schemaDeleteReview) schemaDeleteReview.hidden = true; if (schemaResult) schemaResult.textContent = `Deleted ${schema.name}.`; });
cancelSchemaDeleteButton?.addEventListener("click", () => { pendingSchemaDeletion = undefined; if (schemaDeleteReview?.open) schemaDeleteReview.close(); if (schemaDeleteReview) schemaDeleteReview.hidden = true; });

addNewButton?.addEventListener("click", openNewEventEditor);
exportEventLibraryButton?.addEventListener("click", downloadEventLibrary);
importEventLibraryButton?.addEventListener("click", () => eventLibraryFile?.click());
eventLibraryFile?.addEventListener("change", () => { void reviewEventLibraryImport(); });
replaceEventLibraryButton?.addEventListener("click", () => {
  if (!pendingEventLibraryImport) return;
  if (!replaceEventLibraryArmed) {
    replaceEventLibraryArmed = true;
    replaceEventLibraryButton.textContent = `Confirm replace ${eventTemplates.length} with ${pendingEventLibraryImport.templates.length}`;
    if (eventLibraryImportReviewSummary) eventLibraryImportReviewSummary.textContent = `${eventTemplates.length} current templates will be removed and ${pendingEventLibraryImport.templates.length} imported templates will be added.`;
    return;
  }
  commitEventLibraryImport("replace");
});
appendEventLibraryButton?.addEventListener("click", () => commitEventLibraryImport("append"));
cancelEventLibraryImportButton?.addEventListener("click", () => { pendingEventLibraryImport = undefined; hideDialog(eventLibraryImportReview); });
clearEventLibraryButton?.addEventListener("click", requestClearEventLibrary);
confirmEventLibraryDeleteButton?.addEventListener("click", commitEventLibraryDeletion);
cancelEventLibraryDeleteButton?.addEventListener("click", () => { pendingEventLibraryDeletion = undefined; hideDialog(eventLibraryDeleteReview); });
eventLibraryDeleteReview?.addEventListener("cancel", (event) => { event.preventDefault(); pendingEventLibraryDeletion = undefined; hideDialog(eventLibraryDeleteReview); });

eventTemplateName?.addEventListener("input", () => {
  if (propertyEditorState) {
    propertyEditorState = propertyEditorState.isNew
      ? setNewEventField(propertyEditorState, "name", eventTemplateName.value)
      : setTemplateIdentity(propertyEditorState, "name", eventTemplateName.value);
    renderEventTemplateLibrary();
  }
});
eventTemplateEventName?.addEventListener("input", () => {
  if (propertyEditorState) {
    propertyEditorState = propertyEditorState.isNew
      ? setNewEventField(propertyEditorState, "eventName", eventTemplateEventName.value)
      : setTemplateIdentity(propertyEditorState, "eventName", eventTemplateEventName.value);
    renderEventTemplateLibrary();
  }
});
eventTemplateSource?.addEventListener("input", () => {
  if (propertyEditorState?.isNew) {
    propertyEditorState = setNewEventField(propertyEditorState, "source", {
      id: eventTemplateSource.value,
      name: eventTemplateSource.selectedOptions[0]?.textContent ?? "",
    });
    renderEventTemplateLibrary();
  }
});

eventTemplateJson?.addEventListener("input", () => {
  if (!propertyEditorState) return;
  setEventLibraryResult(eventLibraryEditorElements, "");
  propertyEditorState = updateDraftJson(propertyEditorState, eventTemplateJson.value);
  renderEventTemplateLibrary();
  refreshLibraryDraftValidation();
});

eventTemplatePushDestination?.addEventListener("input", () => {
  if (!propertyEditorState) return;
  setEventLibraryResult(eventLibraryEditorElements, "");
  propertyEditorState = setPushDestination(
    propertyEditorState,
    eventTemplatePushDestination.value,
  );
  setPushDestinationValidation(eventLibraryEditorElements, "");
  renderEventTemplateLibrary();
});

templateRenameName?.addEventListener("input", () => {
  if (!pendingTemplateRename) return;
  pendingTemplateRename.draft = {
    ...pendingTemplateRename.draft,
    templateName: templateRenameName.value,
  };
  renderTemplateRenameValidation();
});
templateRenameEventName?.addEventListener("input", () => {
  if (!pendingTemplateRename) return;
  pendingTemplateRename.draft = {
    ...pendingTemplateRename.draft,
    eventName: templateRenameEventName.value,
  };
  renderTemplateRenameValidation();
});
saveTemplateNamesButton?.addEventListener("click", requestTemplateRenameSave);
cancelTemplateRenameButton?.addEventListener("click", closeTemplateRename);
templateRenameDialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeTemplateRename();
});
confirmTemplateRenameButton?.addEventListener("click", commitTemplateRename);
cancelTemplateRenameReviewButton?.addEventListener("click", returnToTemplateRename);
templateRenameReview?.addEventListener("cancel", (event) => {
  event.preventDefault();
  returnToTemplateRename();
});

saveTemplateRevisionButton?.addEventListener("click", () => {
  if (!propertyEditorState) return;
  try {
    if (propertyEditorState.isNew) {
      const template = saveNewEvent(propertyEditorState, () => `template:library:${crypto.randomUUID()}`);
      eventTemplates = [...eventTemplates, template];
      propertyEditorState = openPropertyEditor(template);
      templateEditorReturnTemplateId = template.id;
      persistEventTemplateLibrary();
      setEventLibraryResult(eventLibraryEditorElements, `Saved ${template.name} as version 1.`);
      renderEventTemplateLibrary();
      return;
    }
    openRevisionChangeReview();
  } catch (error) {
    setEventLibraryValidation(eventLibraryEditorElements,
                              error instanceof Error ? error.message : "Draft is invalid.");
  }
});

saveTemplateCopyButton?.addEventListener("click", () => {
  if (!propertyEditorState) return;
  try {
    const copy = saveAsTemplateCopy(propertyEditorState, `${propertyEditorState.template.name} copy`);
    eventTemplates = [...eventTemplates, copy];
    persistEventTemplateLibrary();
    setEventLibraryResult(eventLibraryEditorElements,
                          `Saved ${copy.name} as a distinct template.`);
    renderEventTemplateLibrary();
  } catch (error) {
    setEventLibraryValidation(eventLibraryEditorElements,
                              error instanceof Error ? error.message : "Draft is invalid.");
  }
});

pushTemplateDraftButton?.addEventListener("click", () => {
  openPushDraftReview();
});
confirmPushDraftButton?.addEventListener("click", () => {
  const review = pendingPushDraftReview;
  pendingPushDraftReview = undefined;
  closePushReview({ dialog: pushDraftReview, heading: pushDraftReviewHeading, trigger: pushTemplateDraftButton }, false);
  if (review) void pushCurrentTemplateDraft(review.editor, review.target);
});
cancelPushDraftButton?.addEventListener("click", () => {
  pendingPushDraftReview = undefined;
  closePushReview({ dialog: pushDraftReview, heading: pushDraftReviewHeading, trigger: pushTemplateDraftButton });
});
confirmRevisionChangeButton?.addEventListener("click", commitRevisionChangeReview);
cancelRevisionChangeButton?.addEventListener("click", closeRevisionChangeReview);
revisionChangeReview?.addEventListener("cancel", (event) => { event.preventDefault(); closeRevisionChangeReview(); });
pushDraftReview?.addEventListener("keydown", (event) => {
  if (event.key === "Escape") pendingPushDraftReview = undefined;
  handlePushReviewKeydown(
    { dialog: pushDraftReview, heading: pushDraftReviewHeading, trigger: pushTemplateDraftButton },
    event,
  );
});

discardTemplateDraftButton?.addEventListener("click", () => {
  if (!propertyEditorState) return;
  propertyEditorState = discardDraft(propertyEditorState);
  setEventLibraryResult(eventLibraryEditorElements, "Draft discarded.");
  renderEventTemplateLibrary();
});
closeTemplateEditorButton?.addEventListener("click", () => {
  if (!propertyEditorState?.dirty) { closeTemplateEditor(); return; }
  if (propertyEditorState.isNew) {
    if (saveAndCloseTemplateButton) saveAndCloseTemplateButton.textContent = "Save new event";
    if (discardAndCloseTemplateButton) discardAndCloseTemplateButton.textContent = "Discard new event";
  }
  if (closeTemplateEditorSummary) closeTemplateEditorSummary.textContent = `Unsaved changes: ${Object.keys(propertyEditorState.draft as Record<string, unknown>).join(", ")}.`;
  if (closeTemplateEditorConfirmation) closeTemplateEditorConfirmation.hidden = false;
});
keepEditingTemplateButton?.addEventListener("click", () => { if (closeTemplateEditorConfirmation) closeTemplateEditorConfirmation.hidden = true; });
saveAndCloseTemplateButton?.addEventListener("click", () => {
  if (!propertyEditorState) return;
  try {
    if (propertyEditorState.isNew) {
      const template = saveNewEvent(propertyEditorState, () => `template:library:${crypto.randomUUID()}`);
      eventTemplates = [...eventTemplates, template];
      persistEventTemplateLibrary();
      closeTemplateEditor();
      return;
    }
    propertyEditorState = saveDraftRevision(propertyEditorState); eventTemplates = eventTemplates.map((template) => template.id === propertyEditorState?.template.id ? propertyEditorState.template : template); persistEventTemplateLibrary(); closeTemplateEditor();
  } catch (error) { setEventLibraryValidation(eventLibraryEditorElements, error instanceof Error ? error.message : "Draft is invalid."); }
});
discardAndCloseTemplateButton?.addEventListener("click", () => closeTemplateEditor());
backToCapturedEventButton?.addEventListener("click", () => {
  const eventId = propertyEditorState?.template.originatingEventId;
  if (!eventId) return;
  const returnSnapshot = inspectorReturnSnapshot;
  showDataLayerView("Live");
  openLiveInspector(eventId);
  if (returnSnapshot) {
    restoreInspectorReturnUi(liveObserverElements, restoreInspectorReturn(returnSnapshot));
    inspectorReturnSnapshot = returnSnapshot;
  }
});

importSavedSessionButton?.addEventListener("click", () => savedSessionFileInput?.click());
savedSessionFileInput?.addEventListener("change", () => {
  void loadSavedSessionFile();
});

cancelSavedSessionDeleteButton?.addEventListener("click", () => {
  savedSessionLibrary = cancelSavedSessionDeletion(savedSessionLibrary);
  if (savedSessionConfirmation) savedSessionConfirmation.textContent = "";
  cancelSavedSessionDeleteButton.hidden = true;
  if (confirmSavedSessionDeleteButton) confirmSavedSessionDeleteButton.hidden = true;
  renderSavedSessions();
});

confirmSavedSessionDeleteButton?.addEventListener("click", () => {
  savedSessionLibrary = confirmSavedSessionDeletion(savedSessionLibrary);
  persistSavedSessionLibrary();
  if (savedSessionConfirmation) savedSessionConfirmation.textContent = "Saved session deleted.";
  confirmSavedSessionDeleteButton.hidden = true;
  if (cancelSavedSessionDeleteButton) cancelSavedSessionDeleteButton.hidden = true;
  renderSavedSessions();
});

backToEventsButton?.addEventListener("click", () => {
  closeInspectorAndReturnToEvents();
});

createKeymapButton?.addEventListener("click", createHotkeyKeymapFile);
updateKeymapButton?.addEventListener("click", updateHotkeyKeymapFile);
loadKeymapButton?.addEventListener("click", () => {
  keymapFileInput?.click();
});
keymapFileInput?.addEventListener("change", () => {
  void loadHotkeyKeymapFile();
});

const targetPathStatusController = createTargetPathStatusController({
  render: (path, fieldValue, status) => {
    currentTargetPathStatus = status;
    renderHistoryPath(path, fieldValue, status);
    renderLiveContextActions();
  },
  read: currentTargetObservation,
  apply: (observation) => {
    dataLayerObserverState = attachHistoryArrayObserver(
      dataLayerObserverState,
      observation,
    );
    updateSessionFromObserverState();
    persistAndRenderSessionState();
    restartLiveHistoryCaptureIfActive(observation);
    renderObserverState();
  },
});

function refreshSelectedTargetPathStatus(): void {
  const path = getHistoryArrayPath();
  void targetPathStatusController.configure(path, historyPathInput?.value ?? path);
}

historyPathInput?.addEventListener("input", () => {
  const typedPath = historyPathInput.value;
  const path = setHistoryArrayPath(typedPath);
  void targetPathStatusController.configure(path, typedPath);
});

restartObservationButton?.addEventListener("click", () => {
  void currentTargetObservation(getHistoryArrayPath()).then((observation) => {
    if (!observation) return;
    dataLayerObserverState = restartObservation(
      dataLayerSessionState,
      dataLayerObserverState,
      observation,
    );
    updateSessionFromObserverState();
    persistAndRenderSessionState();
    restartLiveHistoryCaptureIfActive(observation);
    renderObserverState();
  });
});

chooseObservationTargetButton?.addEventListener("click", () => {
  showObservationTargetPicker(observationTargetElements);
  void discoverCurrentObservationTarget().then(() => observationTargetSearch?.focus());
});
browseObservationTargetsButton?.addEventListener("click", () => {
  showObservationTargetPicker(observationTargetElements);
  void browseObservationTargets();
});
closeObservationTargetPickerButton?.addEventListener("click", () => {
  closeObservationTargetPicker(observationTargetElements);
});
cancelDetachTargetButton?.addEventListener("click", () => {
  pendingObservationTargetSwitchId = undefined;
  closeDetachTargetConfirmation(observationTargetElements);
});
confirmDetachTargetButton?.addEventListener("click", () => {
  void confirmDetachSelectedTarget();
});
observationTargetSearch?.addEventListener("input", renderObservationTargetPicker);
observationTargetSearch?.addEventListener("keydown", (event) =>
  handleObservationTargetSearchKeydown(observationTargetElements, event));
observationTargetList?.addEventListener("keydown", (event) =>
  handleObservationTargetListKeydown(observationTargetElements, event));
observationTargetPicker?.addEventListener("keydown", (event) =>
  handleObservationTargetDialogKeydown(observationTargetElements, event));

document.addEventListener("keydown", (event) => {
  if (pushDraftReview?.open || (observationTargetPicker && !observationTargetPicker.hidden)) {
    return;
  }
  if (event.key === "Escape" && liveObserverState.inspectorEventId) {
    event.preventDefault();
    event.stopPropagation();
    closeInspectorAndReturnToEvents();
    return;
  }
  handleHotkeyKeydown(event);
}, true);

if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message: unknown) => {
    if (isFocusHotkeysMessage(message)) {
      activateHotkeyFocus();
    }
  });
}

if (typeof chrome !== "undefined" && chrome.tabs?.onUpdated) {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url !== undefined) {
      const current = observationTargetState.targets.find((target) => target.tabId === tabId);
      if (current) {
        observationTargetState = navigateObservationTarget(
          observationTargetState,
          tabId,
          changeInfo.url,
        );
        const updated = observationTargetState.targets.find(
          (target) => target.tabId === tabId,
        );
        if (updated && tab.title) {
          observationTargetState = registerObservationTarget(
            observationTargetState,
            { ...updated, title: tab.title },
          );
        }
        renderObservationTargetPicker();
        renderObservationTargetContext();
      }
    }
    if (!activeSessionTabMatches(tabId)) {
      return;
    }

    if (changeInfo.status === "loading" || changeInfo.url !== undefined) {
      observationRefreshState = beginObservedPageLoad(observationRefreshState);
      clearScheduledObservationRefresh();
      stopLiveHistoryCapture();

      if (changeInfo.url !== undefined) {
        dataLayerSessionState = navigateSession(
          dataLayerSessionState,
          changeInfo.url,
        );
        persistAndRenderSessionState();
      }
    }

    if (changeInfo.status === "complete") {
      const pageUrl =
        tab.url ??
        changeInfo.url ??
        dataLayerSessionState.session?.currentUrl ??
        globalThis.location.href;

      refreshObservationAfterPageLoad(
        tabId,
        pageUrl,
        observationRefreshState.observedPageLoadSequence,
      );
    }
  });
}

if (typeof chrome !== "undefined" && chrome.tabs?.onRemoved) {
  chrome.tabs.onRemoved.addListener((tabId) => {
    const target = observationTargetState.targets.find((candidate) => candidate.tabId === tabId);
    if (!target) return;
    observationTargetState = updateObservationTargetAccess(observationTargetState, target.id, "Closed");
    if (dataLayerSessionState.session?.tabId === tabId) {
      stopLiveHistoryCapture();
      setObservationTargetResult("Target unavailable — Save session, End session, or Choose target");
      persistAndRenderObservationState();
    }
    renderObservationTargetPicker();
    renderObservationTargetContext();
  });
}

if (typeof chrome !== "undefined" && chrome.permissions?.onRemoved) {
  chrome.permissions.onRemoved.addListener((permissions) => {
    revokeObservationTargetOrigins(permissions.origins ?? []);
  });
}

renderHistoryPath(getHistoryArrayPath());
renderObservationTargetContext();
if (!savedSessionLiveFeed) void recoverAttachedObservationTarget();
renderSessionState();
renderObserverState();
showWorkspace(workspaceTabsController.activeTab());
hotkeyEditor.render();
showDataLayerView("Live");
renderLiveObserver();
if (savedSessionLiveFeed && liveObserverElements.eventList) liveObserverElements.eventList.scrollTop = savedSessionLiveFeed.savedScrollTop;
if (savedSessionLiveFeed?.savedView.inspectorEventId) openLiveInspector(savedSessionLiveFeed.savedView.inspectorEventId, true);
renderSavedSessions();
renderDefects();
renderEventTemplateLibrary();
renderSchemas();
renderSchemaWorkflowRows();
renderSchemaValidationRecords();
renderSequences();
activateHotkeyFocus();

export {
  DATA_LAYER_SESSION_STORAGE_KEY,
  HOTKEY_KEYMAP_STORAGE_KEY,
  navigateSession,
  sessionScope,
};
