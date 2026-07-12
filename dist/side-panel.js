import { listCommands, runCommandById, } from "./commands.js";
import { createPaletteController } from "./command-palette-ui.js";
import { advanceHotkeySequence, blankHotkeyKeymap, duplicateSequences, HOTKEY_KEYMAP_STORAGE_KEY, keyTokenFromKeyboardEvent, updateHotkeyKeymap, validateHotkeyKeymap, } from "./hotkey-keymap.js";
import { createHotkeyEditor } from "./hotkey-editor.js";
import { createWorkspaceTabsController } from "./workspace-tabs-ui.js";
import { tabPageObservation, } from "./active-page-observation.js";
import { attachedObservationTarget, attachSelectedObservationTarget, createObservationTarget, createObservationTargetState, findObservationTargets, navigateObservationTarget, refreshDiscoveredObservationTargets, registerObservationTarget, restoreAttachedObservationTarget, selectObservationTarget, selectedObservationTarget, updateObservationTargetAccess, } from "./data-layer-observation-targets.js";
import { closeDetachTargetConfirmation, closeObservationTargetPicker, findObservationTargetElements, handleObservationTargetDialogKeydown, handleObservationTargetListKeydown, handleObservationTargetSearchKeydown, renderObservationTargetPicker as renderObservationTargetPickerUi, setObservationTargetResult as setObservationTargetResultUi, showDetachTargetConfirmation, showObservationTargetPicker, } from "./data-layer-observation-targets-ui.js";
import { getHistoryArrayPath, samplePageObject, setHistoryArrayPath, } from "./data-layer.js";
import { appendObservedHistoryEntry, attachHistoryArrayObserver, stopHistoryArrayObserver, } from "./data-layer-observer.js";
import { beginObservedPageLoad, initialObservationRefreshState, markObservationRefreshPageEntryCaptured, nextObservationRefreshAttempt, observationRefreshDelay, observationRefreshRequestForPageLoad, observationRefreshRequestIsCurrent, shouldRetryObservationRefresh, } from "./data-layer-observation-refresh.js";
import { startLiveHistoryPushCapture, } from "./data-layer-live-observation.js";
import { observerAttachmentStatus, restartObservation, } from "./data-layer-recovery.js";
import { captureEntry, DATA_LAYER_SESSION_STORAGE_KEY, navigateSession, persistSession, restoreSession, sessionScope, } from "./data-layer-session.js";
import { beginDataLayerTestingSession } from "./data-layer-session-start.js";
import { endLiveSession } from "./data-layer-live-session-end.js";
import { liveGuidedWorkflow } from "./data-layer-live-guided-workflow.js";
import { findLiveGuidedWorkflowElements, renderLiveGuidedWorkflow, } from "./data-layer-live-guided-workflow-ui.js";
import { renderLiveSessionControls } from "./data-layer-live-session-controls-ui.js";
import { canonicalLiveObserverStatus, createLiveSessionSummary, } from "./data-layer-live-session-summary.js";
import { createLiveNotificationController } from "./data-layer-live-notifications.js";
import { createTargetPathStatusController, targetPathStatusForObservation, } from "./data-layer-target-path-status.js";
import { copyLivePageUrl as copyLivePageUrlAction } from "./data-layer-live-session-summary-actions.js";
import { findLiveSessionSummaryElements, renderLiveSessionSummary, } from "./data-layer-live-session-summary-ui.js";
import { nestedTimeline, timelineEventHeading, } from "./data-layer-timeline.js";
import { createLiveObserverState, closeLiveInspector, dataLayerViewForNavigationKey, dataLayerViews, pauseCapture, recordLiveEvent, resumeCapture, setLiveFilter, selectLiveEvent, } from "./data-layer-live-observer.js";
import { confirmSavedSessionDeletion, cancelSavedSessionDeletion, createSavedSessionLibrary, exportSavedSession, importSavedSession, openSavedSession, requestSavedSessionDeletion, renameSavedSession, resumeSavedSession, saveCompletedSession, searchSavedSessions, savedSessionSummary, } from "./data-layer-saved-sessions.js";
import { findLiveObserverElements, renderDataLayerView, renderLiveInspector, renderLiveObserverState, renderLiveSessionMessage, updateLiveInspectorValidation, } from "./data-layer-live-observer-ui.js";
import { createLiveInspectorActions } from "./data-layer-live-inspector-actions.js";
import { captureInspectorReturn, restoreInspectorReturn, } from "./data-layer-live-inspector-return.js";
import { restoreInspectorReturnUi } from "./data-layer-live-inspector-return-ui.js";
import { createNewEventEditor, discardDraft, openPropertyEditor, saveAsTemplateCopy, saveDraftRevision, searchEventTemplates, restoreEventTemplateLibrary, serializeEventTemplateLibrary, setPushDestination, setNewEventField, setTemplateIdentity, setTemplateSchemaAttachment, templateIdentityValidation, saveNewEvent, updateDraftJson, EVENT_TEMPLATE_LIBRARY_STORAGE_KEY, } from "./data-layer-event-library-editor.js";
import { appendImportedTemplates, eventLibraryExport, eventLibraryImport, replaceImportedTemplates, } from "./data-layer-event-library-transfer.js";
import { clearEventLibrary, deleteEventTemplate } from "./data-layer-event-library-deletion.js";
import { createSchema, duplicateSchema, importSchema, reviseSchema, schemaInheritanceConflict, schemaInheritanceError, searchSchemas, serializeSchemaLibrary, serializeSchemaLibraryExport, restoreSchemaLibrary, validateEvent, validateWithSchema, SCHEMA_LIBRARY_STORAGE_KEY } from "./data-layer-schema-verification.js";
import { createSequence, readiness, runSequence } from "./data-layer-sequence-replay.js";
import { findSequenceReplayElements, renderSequenceReplay, setSequenceReplayResult, } from "./data-layer-sequence-replay-ui.js";
import { findEventLibraryEditorElements, focusTemplateEditAction, focusTemplateRenameAction, renderEventLibraryEditor, setEventLibraryResult, setEventLibraryValidation, setPushDestinationValidation, } from "./data-layer-event-library-editor-ui.js";
import { beginTemplateRename, renameValidation, saveTemplateRename, } from "./data-layer-event-template-renaming.js";
import { closePushReview, handlePushReviewKeydown, openPushReview, } from "./data-layer-workflow-focus-ui.js";
import { pushTemplateToSelectedTarget, } from "./data-layer-selected-target-push.js";
import { createPushDraftReview, } from "./data-layer-push-draft-review.js";
import { findPushDraftReviewElements, renderPushDraftReview, } from "./data-layer-push-draft-review-ui.js";
import { createTemplateChangeReview } from "./data-layer-template-change-review.js";
import { renderTemplateChangeReview } from "./data-layer-template-change-review-ui.js";
import { pushPayloadInPage, } from "./data-layer-selected-target-push-page.js";
import { panelEmptyState } from "./panel-empty-states.js";
import { findPanelEmptyStateElements, renderPanelEmptyState, } from "./panel-empty-states-ui.js";
const PROJECT_NAME = "my-chrome-utilities";
const app = document.querySelector("#app");
const panelRoot = document.querySelector("#side-panel-root");
const sidePanelContent = document.querySelector("#side-panel-content");
const commandLog = document.querySelector("#command-log");
const startTestingButton = document.querySelector("#start-data-layer-testing");
const endTestingButton = document.querySelector("#end-data-layer-testing");
const historyPathInput = document.querySelector("#history-path");
const historyPathDisplay = document.querySelector("#history-path-display");
const historyPathStatus = document.querySelector("#history-path-status");
const sessionHistoryPath = document.querySelector("#session-history-path");
const sessionTimeline = document.querySelector("#session-timeline");
const sessionWarning = document.querySelector("#session-warning");
const restartObservationButton = document.querySelector("#restart-observation");
const observationTargetElements = findObservationTargetElements();
const { chooseButton: chooseObservationTargetButton, browseButton: browseObservationTargetsButton, closePickerButton: closeObservationTargetPickerButton, picker: observationTargetPicker, search: observationTargetSearch, list: observationTargetList, cancelDetachButton: cancelDetachTargetButton, confirmDetachButton: confirmDetachTargetButton, } = observationTargetElements;
const createKeymapButton = document.querySelector("#create-keymap");
const updateKeymapButton = document.querySelector("#update-keymap");
const loadKeymapButton = document.querySelector("#load-keymap");
const keymapFileInput = document.querySelector("#keymap-file");
const keymapStatus = document.querySelector("#keymap-status");
const keymapWarning = document.querySelector("#keymap-warning");
const workspaceTabList = document.querySelector("#workspace-tabs");
const hotkeyEditorFilter = document.querySelector("#hotkey-editor-filter");
const hotkeyEditorCommands = document.querySelector("#hotkey-editor-commands");
const liveObserverElements = findLiveObserverElements();
const liveSessionSummaryElements = findLiveSessionSummaryElements();
const liveGuidedWorkflowElements = findLiveGuidedWorkflowElements();
const { viewList: dataLayerViewList, backToEventsButton, pauseCaptureButton, resumeCaptureButton, } = liveObserverElements;
const { copyPageUrlButton } = liveSessionSummaryElements;
const liveNotificationController = createLiveNotificationController((message) => renderLiveSessionMessage(liveObserverElements, message), (clear, delayMs) => { globalThis.setTimeout(clear, delayMs); });
const saveLiveSessionButton = document.querySelector("#save-live-session");
const savedSessionSearch = document.querySelector("#saved-session-search");
const importSavedSessionButton = document.querySelector("#import-saved-session");
const savedSessionFileInput = document.querySelector("#saved-session-file");
const savedSessionList = document.querySelector("#saved-session-list");
const savedSessionCount = document.querySelector("#saved-session-count");
const savedSessionConfirmation = document.querySelector("#saved-session-confirmation");
const cancelSavedSessionDeleteButton = document.querySelector("#cancel-saved-session-delete");
const confirmSavedSessionDeleteButton = document.querySelector("#confirm-saved-session-delete");
const eventLibraryEditorElements = findEventLibraryEditorElements();
const libraryDraftSchemaSelector = document.createElement("select");
libraryDraftSchemaSelector.id = "library-draft-schema-selector";
libraryDraftSchemaSelector.setAttribute("aria-label", "Schema for Library draft validation");
const refreshLibraryDraftValidationButton = document.createElement("button");
refreshLibraryDraftValidationButton.id = "refresh-library-draft-validation";
refreshLibraryDraftValidationButton.type = "button";
refreshLibraryDraftValidationButton.textContent = "Refresh validation";
eventLibraryEditorElements.validation?.after(libraryDraftSchemaSelector, refreshLibraryDraftValidationButton);
const liveEventsEmptyState = document.querySelector("#live-events-empty-state");
const liveSourceErrorState = document.querySelector("#live-source-error-state");
const templateEmptyStateElements = findPanelEmptyStateElements("#event-template-empty-state", "#event-template-empty-recovery");
const templateEmptyRecovery = templateEmptyStateElements.recovery;
const exportEventLibraryButton = document.querySelector("#export-event-library");
const importEventLibraryButton = document.querySelector("#import-event-library");
const eventLibraryFile = document.querySelector("#event-library-file");
const eventLibraryTransferResult = document.querySelector("#event-library-transfer-result");
const clearEventLibraryButton = document.querySelector("#clear-event-library");
const eventLibraryDeleteReview = document.querySelector("#event-library-delete-review");
const eventLibraryDeleteReviewHeading = document.querySelector("#event-library-delete-review-heading");
const eventLibraryDeleteReviewSummary = document.querySelector("#event-library-delete-review-summary");
const confirmEventLibraryDeleteButton = document.querySelector("#confirm-event-library-delete");
const cancelEventLibraryDeleteButton = document.querySelector("#cancel-event-library-delete");
const eventLibraryImportReview = document.querySelector("#event-library-import-review");
const eventLibraryImportReviewHeading = document.querySelector("#event-library-import-review-heading");
const eventLibraryImportReviewSummary = document.querySelector("#event-library-import-review-summary");
const replaceEventLibraryButton = document.querySelector("#replace-event-library");
const appendEventLibraryButton = document.querySelector("#append-event-library");
const cancelEventLibraryImportButton = document.querySelector("#cancel-event-library-import");
const savedSessionEmptyState = document.querySelector("#saved-session-empty-state");
const schemaEmptyState = document.querySelector("#schema-empty-state");
const sequenceEmptyState = document.querySelector("#sequence-empty-state");
const { search: eventTemplateSearch, addNewButton, templateName: eventTemplateName, eventName: eventTemplateEventName, source: eventTemplateSource, json: eventTemplateJson, pushDestination: eventTemplatePushDestination, saveRevisionButton: saveTemplateRevisionButton, saveCopyButton: saveTemplateCopyButton, pushDraftButton: pushTemplateDraftButton, discardDraftButton: discardTemplateDraftButton, closeEditorButton: closeTemplateEditorButton, backToCapturedEventButton, } = eventLibraryEditorElements;
const schemaSearch = document.querySelector("#schema-search");
const liveValidationFilter = document.querySelector("#live-validation-filter");
const schemaSubviews = Array.from(document.querySelectorAll("#schema-subviews [role=tab]"));
const schemaPanels = Array.from(document.querySelectorAll("#schema-master, #schema-rule-library, #schema-assignments"));
const schemaEditor = document.querySelector("#schema-editor");
const schemaDetailEmpty = document.querySelector("#schema-detail-empty");
const schemaEditorName = document.querySelector("#schema-editor-name");
const schemaEditorTarget = document.querySelector("#schema-editor-target");
const saveSchemaButton = document.querySelector("#save-schema");
const saveSchemaReason = document.querySelector("#save-schema-reason");
const schemaRevisionReview = document.querySelector("#schema-revision-review");
const schemaRevisionReviewSummary = document.querySelector("#schema-revision-review-summary");
const confirmSchemaRevisionButton = document.querySelector("#confirm-schema-revision");
const cancelSchemaRevisionButton = document.querySelector("#cancel-schema-revision");
const schemaCloseReview = document.querySelector("#close-schema-editor-review");
const schemaCloseReviewSummary = document.querySelector("#schema-close-review-summary");
const discardSchemaDraftButton = document.querySelector("#discard-schema-draft");
const keepEditingSchemaButton = document.querySelector("#keep-editing-schema");
const closeSchemaEditorButton = document.querySelector("#close-schema-editor");
const saveAndCloseSchemaButton = document.querySelector("#save-and-close-schema");
const saveSchemaCloseReviewButton = document.querySelector("#save-schema-close-review");
const addSchemaRuleButton = document.querySelector("#add-schema-rule");
const schemaPropertyTree = document.createElement("ul");
schemaPropertyTree.id = "schema-property-tree";
addSchemaRuleButton?.after(schemaPropertyTree);
let selectedSchemaPropertyPath = "example";
const createSchemaAssignmentButton = document.querySelector("#create-schema-assignment");
const createSchemaRuleButton = document.querySelector("#create-schema-rule");
const schemaRuleEditor = document.querySelector("#schema-rule-editor");
const schemaRuleName = document.querySelector("#schema-rule-name");
const schemaRuleParameters = document.querySelector("#schema-rule-parameters");
const schemaRuleTypes = document.querySelector("#schema-rule-types");
const schemaRuleOperator = document.querySelector("#schema-rule-operator");
const schemaRuleSeverity = document.querySelector("#schema-rule-severity");
const schemaRuleMessage = document.querySelector("#schema-rule-message");
const schemaRuleExamples = document.querySelector("#schema-rule-examples");
const saveSchemaRuleButton = document.querySelector("#save-schema-rule");
const schemaRuleList = document.querySelector("#schema-rule-list");
const schemaRuleSearch = document.querySelector("#schema-rule-search");
const schemaRuleAttachments = document.querySelector("#schema-rule-attachments");
const updateSchemaRuleAttachments = document.querySelector("#update-schema-rule-attachments");
const schemaRuleUpgradeReview = document.querySelector("#schema-rule-upgrade-review");
const schemaRuleUpgradeReviewSummary = document.querySelector("#schema-rule-upgrade-review-summary");
const confirmSchemaRuleUpgradeButton = document.querySelector("#confirm-schema-rule-upgrade");
const cancelSchemaRuleUpgradeButton = document.querySelector("#cancel-schema-rule-upgrade");
const schemaRuleRevisionReview = document.createElement("dialog");
schemaRuleRevisionReview.id = "schema-rule-revision-review";
const schemaRuleRevisionReviewSummary = document.createElement("output");
schemaRuleRevisionReviewSummary.id = "schema-rule-revision-review-summary";
const confirmSchemaRuleRevisionButton = document.createElement("button");
confirmSchemaRuleRevisionButton.id = "confirm-schema-rule-revision-review";
confirmSchemaRuleRevisionButton.type = "button";
confirmSchemaRuleRevisionButton.textContent = "Save rule revision";
const cancelSchemaRuleRevisionButton = document.createElement("button");
cancelSchemaRuleRevisionButton.type = "button";
cancelSchemaRuleRevisionButton.textContent = "Cancel";
schemaRuleRevisionReview.append(Object.assign(document.createElement("h4"), { textContent: "Review rule revision" }), schemaRuleRevisionReviewSummary, confirmSchemaRuleRevisionButton, cancelSchemaRuleRevisionButton);
document.body.append(schemaRuleRevisionReview);
const exportSchemaRulesButton = document.querySelector("#export-schema-rules");
const schemaRuleDeleteReview = document.querySelector("#schema-rule-delete-review");
const schemaRuleDeleteReviewSummary = document.querySelector("#schema-rule-delete-review-summary");
const confirmSchemaRuleDeleteButton = document.querySelector("#confirm-schema-rule-delete");
const cancelSchemaRuleDeleteButton = document.querySelector("#cancel-schema-rule-delete");
const schemaAssignmentEditor = document.querySelector("#schema-assignment-editor");
const schemaAssignmentSource = document.querySelector("#schema-assignment-source");
const schemaAssignmentEvent = document.querySelector("#schema-assignment-event");
const schemaAssignmentPriority = document.querySelector("#schema-assignment-priority");
const saveSchemaAssignmentButton = document.querySelector("#save-schema-assignment");
const schemaAssignmentTarget = document.querySelector("#schema-assignment-target");
const schemaAssignmentDomain = document.querySelector("#schema-assignment-domain");
const schemaAssignmentPathname = document.querySelector("#schema-assignment-pathname");
const schemaAssignmentVersionPolicy = document.querySelector("#schema-assignment-version-policy");
const schemaAssignmentEnabled = document.querySelector("#schema-assignment-enabled");
const schemaAssignmentList = document.querySelector("#schema-assignment-list");
const schemaAssignmentConflicts = document.querySelector("#schema-assignment-conflicts");
const schemaAssignmentSchema = document.querySelector("#schema-assignment-schema");
const pushDraftReview = document.querySelector("#push-draft-review");
const pushDraftReviewHeading = document.querySelector("#push-draft-review-heading");
const pushDraftReviewSummary = document.querySelector("#push-draft-review-summary");
const pushDraftReviewElements = findPushDraftReviewElements();
const confirmPushDraftButton = document.querySelector("#confirm-push-draft");
const cancelPushDraftButton = document.querySelector("#cancel-push-draft");
const revisionChangeReview = document.querySelector("#revision-change-review");
const revisionChangeReviewHeading = document.querySelector("#revision-change-review-heading");
const confirmRevisionChangeButton = document.querySelector("#confirm-revision-change");
const cancelRevisionChangeButton = document.querySelector("#cancel-revision-change");
const closeTemplateEditorConfirmation = document.querySelector("#close-template-editor-confirmation");
const closeTemplateEditorSummary = document.querySelector("#close-template-editor-summary");
const keepEditingTemplateButton = document.querySelector("#keep-editing-template");
const saveAndCloseTemplateButton = document.querySelector("#save-and-close-template");
const discardAndCloseTemplateButton = document.querySelector("#discard-and-close-template");
const templateRenameDialog = document.querySelector("#event-template-rename");
const templateRenameHeading = document.querySelector("#event-template-rename-heading");
const templateRenameName = document.querySelector("#event-template-rename-name");
const templateRenameEventName = document.querySelector("#event-template-rename-event-name");
const templateRenameNameError = document.querySelector("#event-template-rename-name-error");
const templateRenameEventNameError = document.querySelector("#event-template-rename-event-name-error");
const saveTemplateNamesButton = document.querySelector("#save-template-names");
const cancelTemplateRenameButton = document.querySelector("#cancel-template-rename");
const templateRenameReview = document.querySelector("#event-template-rename-review");
const templateRenameReviewHeading = document.querySelector("#event-template-rename-review-heading");
const templateRenameReviewSummary = document.querySelector("#event-template-rename-review-summary");
const confirmTemplateRenameButton = document.querySelector("#confirm-template-rename");
const cancelTemplateRenameReviewButton = document.querySelector("#cancel-template-rename-review");
const createSchemaButton = document.querySelector("#create-schema");
const importSchemaButton = document.querySelector("#import-schema");
const schemaLibraryImportFile = document.querySelector("#schema-library-import-file");
const exportSchemaButton = document.querySelector("#export-schema");
const recheckSchemaValidationButton = document.querySelector("#recheck-schema-validation");
const schemaValidationIssues = document.querySelector("#schema-validation-issues");
const schemaValidationRecordList = document.querySelector("#schema-validation-record-list");
const schemaInheritanceProvenance = document.querySelector("#schema-inheritance-provenance");
const schemaRuleOverrides = document.querySelector("#schema-rule-overrides");
const schemaRuleOverrideList = document.querySelector("#schema-rule-override-list");
const schemaInheritedRuleGroups = document.createElement("section");
schemaInheritedRuleGroups.id = "schema-inherited-rule-groups";
schemaInheritedRuleGroups.setAttribute("aria-label", "Inherited rule states");
const schemaEffectiveRulePreview = document.createElement("section");
schemaEffectiveRulePreview.id = "schema-effective-rule-preview";
schemaEffectiveRulePreview.setAttribute("aria-label", "Effective-rule preview");
schemaRuleOverrides?.after(schemaInheritedRuleGroups, schemaEffectiveRulePreview);
const schemaImportReview = document.querySelector("#schema-import-review");
const schemaImportReviewSummary = document.querySelector("#schema-import-review-summary");
const replaceSchemaLibraryButton = document.querySelector("#replace-schema-library");
const appendSchemaLibraryButton = document.querySelector("#append-schema-library");
const cancelSchemaImportButton = document.querySelector("#cancel-schema-import");
const schemaDeleteReview = document.querySelector("#schema-delete-review");
const schemaDeleteReviewSummary = document.querySelector("#schema-delete-review-summary");
const confirmSchemaDeleteButton = document.querySelector("#confirm-schema-delete");
const cancelSchemaDeleteButton = document.querySelector("#cancel-schema-delete");
const schemaEditorParent = document.querySelector("#schema-editor-parent");
const schemaOnlyDeclaredProperties = document.querySelector("#schema-only-declared-properties");
const schemaCount = document.querySelector("#schema-count");
const schemaList = document.querySelector("#schema-list");
const schemaResult = document.querySelector("#schema-result");
const sequenceReplayElements = findSequenceReplayElements();
const allCommands = [...listCommands()];
let activeHotkeyKeymap = loadStoredHotkeyKeymap() ?? blankHotkeyKeymap(allCommands);
let pendingHotkeySequence = [];
let dataLayerSessionState = restoreSession();
let dataLayerObserverState = {
    pageObject: samplePageObject(),
    observedEntries: [],
    sourceEvents: [],
};
let stopLiveHistoryPushCapture = () => { };
let liveHistoryCaptureGeneration = 0;
let presentedSourceEventCount = 0;
let observationRefreshTimeoutId;
let observationRefreshState = initialObservationRefreshState;
let liveObserverState = createLiveObserverState({
    pageUrl: globalThis.location.href,
    sources: [{ id: "event-history", name: "Event history", status: "Connected" }],
});
let inspectorReturnSnapshot;
let savedSessionLibrary = createSavedSessionLibrary();
let archivedSavedSession;
let eventTemplates = restoreEventTemplateLibrary(localStorage.getItem(EVENT_TEMPLATE_LIBRARY_STORAGE_KEY));
let propertyEditorState;
let pendingPushDraftReview;
let pendingRevisionChangeReview;
let pendingTemplateRename;
let pendingEventLibraryImport;
let replaceEventLibraryArmed = false;
let pendingEventLibraryDeletion;
let templateEditorReturnTemplateId;
let savedInspectorTemplateId;
let schemas = restoreSchemaLibrary(localStorage.getItem(SCHEMA_LIBRARY_STORAGE_KEY));
let schemaDraft;
let pendingSchemaImport;
let pendingSchemaDeletion;
let editingSchemaAssignment;
let editingReusableSchemaRuleId;
let pendingReusableSchemaRuleDeletionId;
let approvedRuleRevisionId;
let approvedRuleAttachmentUpdateId;
const MANUAL_SCHEMA_OVERRIDE_STORAGE_KEY = "my-chrome-utilities.manual-schema-overrides.v1";
let manualSchemaOverrides = (() => { try {
    const stored = JSON.parse(localStorage.getItem(MANUAL_SCHEMA_OVERRIDE_STORAGE_KEY) ?? "{}");
    return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
}
catch {
    return {};
} })();
const SCHEMA_VALIDATION_RECORD_STORAGE_KEY = "my-chrome-utilities.schema-validation-records.v1";
let schemaValidationRecords = (() => { try {
    const stored = JSON.parse(localStorage.getItem(SCHEMA_VALIDATION_RECORD_STORAGE_KEY) ?? "[]");
    return Array.isArray(stored) ? stored.filter((record) => !!record && typeof record.eventId === "string" && typeof record.eventName === "string" && typeof record.state === "string" && typeof record.checkedAt === "string") : [];
}
catch {
    return [];
} })();
const SCHEMA_RULE_STORAGE_KEY = "my-chrome-utilities.schema-rule-library.v1";
let reusableSchemaRules = (() => { try {
    const saved = JSON.parse(localStorage.getItem(SCHEMA_RULE_STORAGE_KEY) ?? "[]");
    return Array.isArray(saved) ? saved : [];
}
catch {
    return [];
} })();
let replaySequences = [];
let observationTargetState = restoredObservationTargetState();
let pendingObservationTargetSwitchId;
let nextSessionSequence = 0;
let currentTargetPathStatus = "Selection required";
function newDataLayerSessionId(tabId) {
    nextSessionSequence += 1;
    const unique = globalThis.crypto?.randomUUID?.()
        ?? `${Date.now()}-${nextSessionSequence}`;
    return `tab-${tabId}-session-${unique}`;
}
if (app) {
    app.textContent = PROJECT_NAME;
}
function renderHistoryPath(path, fieldValue = path, status = "Selection required") {
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
function restoredObservationTargetState() {
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
function setObservationTargetResult(result) {
    setObservationTargetResultUi(observationTargetElements, result);
}
function renderObservationTargetContext() {
    renderLiveContextActions();
}
function renderLiveContextActions() {
    const activeSession = dataLayerSessionState.session?.status === "active";
    const selectedTarget = selectedObservationTarget(observationTargetState);
    renderLiveSessionControls({
        startTestingButton,
        endTestingButton,
        pauseCaptureButton,
        resumeCaptureButton,
    }, { activeSession, captureStatus: liveObserverState.status });
    renderLiveGuidedWorkflow(liveGuidedWorkflowElements, liveGuidedWorkflow({
        activeSession,
        ...(selectedTarget ? { selectedTarget } : {}),
        pathStatus: currentTargetPathStatus,
    }));
}
function targetFromTab(tab, currentWindow = false) {
    if (tab.id === undefined || tab.windowId === undefined || !tab.url)
        return undefined;
    return createObservationTarget({
        tabId: tab.id,
        windowId: tab.windowId,
        pageUrl: tab.url,
        title: tab.title || tab.url,
        activeTab: tab.active,
        currentWindow,
    });
}
function registerTargetTabs(tabs, options = {}) {
    const targets = tabs.flatMap((tab) => {
        const target = targetFromTab(tab, tab.windowId === options.currentWindowId);
        return target ? [target] : [];
    });
    if (options.replaceDiscovery) {
        observationTargetState = refreshDiscoveredObservationTargets(observationTargetState, targets);
    }
    else {
        for (const target of targets) {
            observationTargetState = registerObservationTarget(observationTargetState, target);
        }
    }
    renderObservationTargetPicker();
    renderObservationTargetContext();
}
async function discoverCurrentObservationTarget() {
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
    }
    else {
        setObservationTargetResult("Selection required");
    }
    renderObservationTargetPicker();
    renderObservationTargetContext();
    if (target)
        refreshSelectedTargetPathStatus();
}
async function browseObservationTargets() {
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
function renderObservationTargetPicker() {
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
async function requestSelectedTargetAccess(target) {
    if (typeof chrome === "undefined" || !chrome.permissions)
        return;
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
async function recoverAttachedObservationTarget() {
    const target = attachedObservationTarget(observationTargetState);
    if (!target || typeof chrome === "undefined" || !chrome.tabs?.get)
        return;
    try {
        const tab = await chrome.tabs.get(target.tabId);
        const recovered = targetFromTab(tab, target.currentWindow) ?? target;
        observationTargetState = restoreAttachedObservationTarget({
            ...recovered,
            priorSession: true,
        });
        const session = dataLayerSessionState.session;
        if (session?.status === "active") {
            const observation = await tabPageObservation(recovered.tabId, recovered.pageUrl, session.historyPath);
            if (observation.pageAccessStatus === "page access available") {
                dataLayerObserverState = attachHistoryArrayObserver({
                    ...dataLayerObserverState,
                    sessionState: dataLayerSessionState,
                }, { ...observation, importExisting: false });
                updateSessionFromObserverState();
                await startLiveHistoryCapture(observation);
                persistAndRenderObservationState();
                setObservationTargetResult(`Recovered ${recovered.title}`);
            }
            else {
                observationTargetState = updateObservationTargetAccess(observationTargetState, recovered.id, "Permission required");
                setObservationTargetResult("Permission required — Request access");
            }
        }
    }
    catch {
        observationTargetState = updateObservationTargetAccess(observationTargetState, target.id, "Closed");
        stopLiveHistoryCapture();
        setObservationTargetResult("Target unavailable — Choose target");
    }
    renderObservationTargetPicker();
    renderObservationTargetContext();
}
function revokeObservationTargetOrigins(origins) {
    const affected = observationTargetState.targets.filter((target) => origins.some((originPattern) => originPattern.startsWith(target.origin)));
    for (const target of affected) {
        const attached = observationTargetState.attachedTargetId === target.id;
        observationTargetState = updateObservationTargetAccess(observationTargetState, target.id, "Permission required");
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
async function attachSelectedTarget() {
    const decision = attachSelectedObservationTarget(observationTargetState);
    if (decision.result === "End current session before attaching selected target") {
        const current = attachedObservationTarget(observationTargetState);
        const next = selectedObservationTarget(observationTargetState);
        if (current && next) {
            pendingObservationTargetSwitchId = next.id;
            showDetachTargetConfirmation(observationTargetElements, `Keep ${current.title}, or end its session and attach to ${next.title}?`, { cancel: "Keep current session", confirm: "End and attach" });
        }
        setObservationTargetResult(decision.result);
        return;
    }
    if (decision.result !== "Attached") {
        setObservationTargetResult(decision.result);
        return;
    }
    const target = selectedObservationTarget(decision.state);
    if (!target)
        return;
    const sessionWasActive = dataLayerSessionState.session?.status === "active";
    if (sessionWasActive) {
        setObservationTargetResult("End current session before attaching selected target");
        return;
    }
    const observation = await tabPageObservation(target.tabId, target.pageUrl, getHistoryArrayPath());
    if (observation.pageAccessStatus !== "page access available") {
        observationTargetState = updateObservationTargetAccess(observationTargetState, target.id, "Permission required");
        setObservationTargetResult("Permission required");
        renderObservationTargetContext();
        return;
    }
    currentTargetPathStatus = targetPathStatusForObservation(observation, getHistoryArrayPath());
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
    persistAndRenderObservationState();
    setObservationTargetResult("");
    setLiveSessionMessage("Testing started");
    renderObservationTargetContext();
}
function beginDetachSelectedTarget() {
    const target = attachedObservationTarget(observationTargetState);
    if (!target) {
        setObservationTargetResult("No target is attached");
        return;
    }
    pendingObservationTargetSwitchId = undefined;
    showDetachTargetConfirmation(observationTargetElements, `Detach ${target.title} from the active testing session?`);
}
async function confirmDetachSelectedTarget() {
    const switchTargetId = pendingObservationTargetSwitchId;
    pendingObservationTargetSwitchId = undefined;
    ({ sessionState: dataLayerSessionState, targetState: observationTargetState } =
        endLiveSession(dataLayerSessionState, observationTargetState, () => stopLiveHistoryCapture()));
    persistAndRenderObservationState();
    closeDetachTargetConfirmation(observationTargetElements);
    if (switchTargetId) {
        observationTargetState = selectObservationTarget(observationTargetState, switchTargetId);
        await attachSelectedTarget();
        return;
    }
    setObservationTargetResult("");
    setLiveSessionMessage("Testing ended");
    renderObservationTargetContext();
}
function showDataLayerView(view, focus = false) {
    liveObserverState = { ...liveObserverState, view };
    localStorage.setItem("my-chrome-utilities.data-layer-view.v1", view);
    renderDataLayerView(liveObserverElements, view, focus);
}
function renderLiveObserver() {
    renderLiveObserverState(liveObserverElements, liveObserverState, openLiveInspector);
    if (liveEventsEmptyState)
        liveEventsEmptyState.hidden = liveObserverState.events.length > 0;
    if (liveSourceErrorState)
        liveSourceErrorState.hidden = !liveObserverState.sources.some(({ status }) => status !== "Connected");
    renderLiveSessionSummary(liveSessionSummaryElements, currentLiveSessionSummary());
    renderLiveContextActions();
}
function currentLiveSessionSummary() {
    const session = dataLayerSessionState.session;
    const target = attachedObservationTarget(observationTargetState)
        ?? selectedObservationTarget(observationTargetState);
    return createLiveSessionSummary({
        testingState: session?.status === "active"
            ? (liveObserverState.status === "Paused" ? "Paused" : "Active")
            : "Ended",
        observerStatus: canonicalLiveObserverStatus(observerAttachmentStatus(dataLayerSessionState, dataLayerObserverState)),
        targetPage: session?.targetTitle ?? target?.title ?? "No target selected",
        pageUrl: session?.currentUrl ?? target?.pageUrl ?? "",
        observerPath: session?.historyPath ?? getHistoryArrayPath(),
        capturedEventCount: liveObserverState.events.length,
        connectedSourceCount: liveObserverState.sources.filter(({ status }) => status === "Connected").length,
    });
}
function closeInspectorAndReturnToEvents() {
    const returnSnapshot = inspectorReturnSnapshot;
    liveObserverState = closeLiveInspector(liveObserverState);
    renderLiveObserver();
    if (returnSnapshot) {
        const restored = restoreInspectorReturn(returnSnapshot);
        restoreInspectorReturnUi(liveObserverElements, restored);
    }
    inspectorReturnSnapshot = undefined;
}
function openLiveInspector(eventId) {
    inspectorReturnSnapshot = captureInspectorReturn(eventId, liveObserverElements.eventList?.scrollTop ?? 0);
    const split = globalThis.innerWidth >= 700;
    liveObserverState = selectLiveEvent(liveObserverState, eventId, split ? "split" : "stacked");
    const event = liveObserverState.events.find(({ id }) => id === eventId);
    if (event)
        renderLiveInspector(liveObserverElements, event, createLiveInspectorActions({
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
            validationAvailable: (selected) => Boolean(validateEvent({
                sourceId: selected.sourceId,
                eventName: selected.name,
                payload: selected.payload,
                rawInput: selected.rawInput,
            }, schemas).schema) || Boolean(manualSchemaOverrides[selected.id]),
            validationState: (selected) => {
                const event = { sourceId: selected.sourceId, eventName: selected.name, payload: selected.payload, rawInput: selected.rawInput };
                const manual = schemas.find((schema) => schema.id === manualSchemaOverrides[selected.id]);
                return manual ? validateWithSchema(event, manual, schemas).state : validateEvent(event, schemas).state;
            },
            manualSchemaChoices: () => schemas.map((schema) => ({ id: schema.id, label: `${schema.name} v${schema.version}` })),
            selectManualSchema: (eventId, schemaId) => { const { [eventId]: _previous, ...remaining } = manualSchemaOverrides; manualSchemaOverrides = schemaId ? { ...remaining, [eventId]: schemaId } : remaining; localStorage.setItem(MANUAL_SCHEMA_OVERRIDE_STORAGE_KEY, JSON.stringify(manualSchemaOverrides)); },
            updateValidation: (selectedId, validation) => {
                const selected = liveObserverState.events.find((candidate) => candidate.id === selectedId);
                const event = selected && { sourceId: selected.sourceId, eventName: selected.name, payload: selected.payload, rawInput: selected.rawInput };
                const manual = selected && schemas.find((schema) => schema.id === manualSchemaOverrides[selected.id]);
                const result = event ? (manual ? validateWithSchema(event, manual, schemas) : validateEvent(event, schemas, selected?.pageUrl)) : undefined;
                liveObserverState = { ...liveObserverState, events: liveObserverState.events.map((candidate) => candidate.id === selectedId ? { ...candidate, validation } : candidate) };
                renderLiveObserver();
                updateLiveInspectorValidation(liveObserverElements, validation, result?.issues, result?.assignment);
            },
        }));
    renderLiveObserver();
    backToEventsButton?.focus({ preventScroll: true });
}
function appendOpenInLibraryAction(eventId, templateName) {
    const action = document.createElement("button");
    action.type = "button";
    action.textContent = "Open in Library";
    action.addEventListener("click", () => {
        const template = eventTemplates.find(({ id }) => id === savedInspectorTemplateId)
            ?? eventTemplates.find(({ originatingEventId }) => originatingEventId === eventId);
        if (!template)
            return;
        showDataLayerView("Library");
        openTemplateEditor(template);
    });
    liveObserverElements.eventInspector?.append(action);
    setLiveSessionMessage(`Saved ${templateName} to Library. Open in Library is available.`);
}
function setLiveSessionMessage(message) {
    liveNotificationController.announce(message);
}
async function copyLivePageUrl() {
    const pageUrl = currentLiveSessionSummary().pageUrl;
    const writeText = navigator.clipboard?.writeText.bind(navigator.clipboard);
    const result = await copyLivePageUrlAction(pageUrl, writeText);
    if (result === "copied")
        setLiveSessionMessage("Page URL copied");
    if (result === "failed")
        setLiveSessionMessage("Page URL could not be copied");
}
function renderEventTemplateLibrary() {
    const templates = searchEventTemplates(eventTemplates, eventTemplateSearch?.value ?? "");
    const empty = panelEmptyState("templates", templates.length, Boolean(eventTemplateSearch?.value.trim()));
    renderPanelEmptyState(templateEmptyStateElements, empty);
    if (exportEventLibraryButton)
        exportEventLibraryButton.disabled = eventTemplates.length === 0;
    if (clearEventLibraryButton)
        clearEventLibraryButton.disabled = eventTemplates.length === 0;
    renderEventLibraryEditor(eventLibraryEditorElements, templates, propertyEditorState, {
        edit: openTemplateEditor,
        rename: openTemplateRename,
        duplicate: (template) => {
            const copy = saveAsTemplateCopy(openPropertyEditor(template), `${template.name} copy`);
            eventTemplates = [...eventTemplates, copy];
            persistEventTemplateLibrary();
            renderEventTemplateLibrary();
        },
        push: (template) => {
            openTemplateEditor(template);
            void pushCurrentTemplateDraft();
        },
        delete: requestEventTemplateDeletion,
        createSchema: (template) => openSchemaFromSource({
            name: template.name,
            sourceId: template.sourceId,
            eventName: template.eventName,
            payload: template.payload,
            label: "Library template",
        }),
    });
    const editor = propertyEditorState;
    const selectable = Boolean(editor && !editor.isNew);
    libraryDraftSchemaSelector.hidden = refreshLibraryDraftValidationButton.hidden = !selectable;
    if (selectable && editor) {
        const selected = editor.template.schemaId ?? "";
        libraryDraftSchemaSelector.replaceChildren(Object.assign(document.createElement("option"), { value: "", textContent: "Automatic schema" }), ...schemas.map((schema) => Object.assign(document.createElement("option"), { value: schema.id, textContent: `${schema.name} v${schema.version}` })));
        libraryDraftSchemaSelector.value = selected;
    }
}
libraryDraftSchemaSelector.addEventListener("change", () => {
    const editor = propertyEditorState;
    if (!editor || editor.isNew)
        return;
    propertyEditorState = setTemplateSchemaAttachment(editor, libraryDraftSchemaSelector.value);
    renderEventTemplateLibrary();
});
function refreshLibraryDraftValidation() {
    const editor = propertyEditorState;
    if (!editor || editor.isNew)
        return;
    const schema = schemas.find((candidate) => candidate.id === editor.template.schemaId);
    if (!schema) {
        setEventLibraryValidation(eventLibraryEditorElements, "Select a schema to refresh Library draft validation.");
        return;
    }
    const result = validateWithSchema({ sourceId: editor.template.sourceId, eventName: editor.template.eventName, payload: editor.draft, rawInput: [] }, schema, schemas);
    setEventLibraryValidation(eventLibraryEditorElements, `Library draft validation: ${result.state} · ${schema.name} v${schema.version}.`);
}
refreshLibraryDraftValidationButton.addEventListener("click", refreshLibraryDraftValidation);
function renderSchemas() {
    const visible = searchSchemas(schemas, schemaSearch?.value ?? "");
    if (schemaEmptyState)
        schemaEmptyState.hidden = visible.length > 0;
    if (schemaCount)
        schemaCount.textContent = `${visible.length} schemas`;
    if (schemaList)
        schemaList.replaceChildren(...visible.map((schema) => {
            const item = document.createElement("li");
            const revise = document.createElement("button");
            const duplicate = document.createElement("button");
            const remove = document.createElement("button");
            const parent = schema.parentSchemaId ? schemas.find((candidate) => candidate.id === schema.parentSchemaId) : undefined;
            item.textContent = `${schema.name} v${schema.version}${parent ? ` inherits ${parent.name} v${parent.version}` : ""}: ${schema.assignments.map((assignment) => `${assignment.sourceId}/${assignment.eventName}/${assignment.target}`).join(", ") || "unassigned"}. `;
            revise.type = duplicate.type = remove.type = "button";
            revise.textContent = "Edit as new version";
            duplicate.textContent = "Duplicate";
            remove.textContent = "Delete";
            revise.addEventListener("click", () => {
                schemaDraft = structuredClone(schema);
                renderSchemaDraft();
                if (schemaRevisionReviewSummary)
                    schemaRevisionReviewSummary.textContent = `${schema.name} will be saved as version ${schema.version + 1}; version ${schema.version} remains available.`;
                if (schemaRevisionReview) {
                    schemaRevisionReview.hidden = false;
                    schemaRevisionReview.showModal();
                }
            });
            duplicate.addEventListener("click", () => { schemas = [...schemas, duplicateSchema(schema, `${schema.name} copy`)]; persistSchemaLibrary(); renderSchemas(); });
            remove.addEventListener("click", () => {
                const children = schemas.filter((candidate) => candidate.parentSchemaId === schema.id);
                if (children.length) {
                    if (schemaResult)
                        schemaResult.textContent = `Cannot delete ${schema.name}: it is the parent of ${children.map(({ name }) => name).join(", ")}.`;
                    return;
                }
                pendingSchemaDeletion = schema;
                if (schemaDeleteReviewSummary)
                    schemaDeleteReviewSummary.textContent = `${schema.name} v${schema.version} and its assignments will be removed.`;
                if (schemaDeleteReview) {
                    schemaDeleteReview.hidden = false;
                    schemaDeleteReview.showModal();
                }
            });
            item.append(revise, duplicate, remove);
            return item;
        }));
}
function showSchemaSubview(id) {
    schemaPanels.forEach((panel) => { panel.hidden = panel.id !== id; });
    schemaSubviews.forEach((tab) => {
        const active = tab.getAttribute("aria-controls") === id;
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
    });
}
function renderSchemaDraft() {
    const draft = schemaDraft;
    if (schemaEditor)
        schemaEditor.hidden = !draft;
    if (closeSchemaEditorButton)
        closeSchemaEditorButton.hidden = !draft;
    if (saveAndCloseSchemaButton)
        saveAndCloseSchemaButton.hidden = !draft;
    if (schemaDetailEmpty)
        schemaDetailEmpty.hidden = Boolean(draft);
    if (!draft)
        return;
    if (schemaEditorName)
        schemaEditorName.value = draft.name;
    if (schemaEditorTarget)
        schemaEditorTarget.value = draft.assignments[0]?.target ?? "payload";
    if (schemaOnlyDeclaredProperties)
        schemaOnlyDeclaredProperties.checked = draft.document.additionalProperties === false;
    const paths = (document, prefix = "") => Object.entries(document.properties ?? {}).flatMap(([name, child]) => {
        const path = prefix ? `${prefix}.${name}` : name;
        return [path, ...paths(child, path)];
    });
    const propertyPaths = paths(draft.document);
    if (!propertyPaths.includes(selectedSchemaPropertyPath))
        selectedSchemaPropertyPath = propertyPaths[0] ?? "example";
    schemaPropertyTree.replaceChildren(...propertyPaths.map((path) => {
        const item = document.createElement("li");
        item.dataset.schemaPropertyPath = path;
        item.tabIndex = -1;
        const label = document.createElement("strong");
        label.textContent = path;
        const attached = (draft.attachedRules ?? []).filter((rule) => rule.propertyPath === path);
        const count = document.createElement("span");
        count.textContent = ` (${attached.filter((rule) => rule.enabled !== false).length} active rules)`;
        const menu = document.createElement("details");
        menu.dataset.ruleMenu = "true";
        menu.setAttribute("aria-label", `${path} rule menu`);
        const add = document.createElement("summary");
        add.textContent = "Add validation rule";
        menu.append(add);
        add.addEventListener("click", (event) => { event.preventDefault(); menu.open = !menu.open; });
        const rules = reusableSchemaRules.filter((rule) => rule.enabled !== false);
        if (rules.length) {
            menu.append(...rules.map((rule) => {
                const attach = document.createElement("button");
                attach.type = "button";
                attach.textContent = `Attach ${rule.name} v${rule.version ?? 1}`;
                attach.addEventListener("click", () => attachReusableRule(path, rule));
                return attach;
            }));
        }
        else {
            const create = document.createElement("button");
            create.type = "button";
            create.textContent = "Create reusable rule";
            create.addEventListener("click", () => { selectedSchemaPropertyPath = path; showSchemaSubview("schema-rule-library"); createSchemaRuleButton?.click(); });
            menu.append(create);
        }
        menu.addEventListener("toggle", () => { if (!menu.open)
            focusSchemaPropertyRow(path); });
        const view = document.createElement("details");
        view.dataset.attachedRules = "true";
        const summary = document.createElement("summary");
        summary.textContent = `View attached rules (${attached.length})`;
        view.append(summary);
        if (!attached.length)
            view.append("No rules attached to this property.");
        for (const rule of attached) {
            const row = document.createElement("div");
            row.textContent = `${rule.id} v${rule.version} · ${rule.operator ?? "rule"} · ${rule.parameters ?? "no parameters"} · ${rule.severity ?? "error"} · ${rule.enabled === false ? "disabled" : "active"} `;
            const toggle = document.createElement("button");
            toggle.type = "button";
            toggle.textContent = rule.enabled === false ? "Re-enable" : "Disable";
            toggle.addEventListener("click", () => updateAttachedRule(path, rule.id, (item) => ({ ...item, enabled: item.enabled === false })));
            const remove = document.createElement("button");
            remove.type = "button";
            remove.textContent = "Remove";
            remove.addEventListener("click", () => updateAttachedRule(path, rule.id, () => undefined));
            row.append(toggle, remove);
            view.append(row);
        }
        item.append(label, count, add, menu, view);
        return item;
    }));
    const existing = schemas.find((schema) => schema.name === draft.name);
    const candidate = { ...draft, id: existing?.id ?? createSchema(draft.name, 1, draft.document).id };
    if (schemaEditorParent) {
        const parents = schemas.filter((schema) => schema.id !== candidate.id);
        schemaEditorParent.replaceChildren(Object.assign(document.createElement("option"), { value: "", textContent: "No parent" }), ...parents.map((schema) => Object.assign(document.createElement("option"), { value: schema.id, textContent: `${schema.name} v${schema.version}` })));
        schemaEditorParent.value = draft.parentSchemaId ?? "";
    }
    const parent = draft.parentSchemaId ? schemas.find((schema) => schema.id === draft.parentSchemaId) : undefined;
    if (schemaInheritanceProvenance)
        schemaInheritanceProvenance.textContent = parent ? `Inherited rules originate in ${parent.name} v${parent.version}. Local rules override only after conflicts are resolved.` : "Local schema only";
    if (schemaRuleOverrides)
        schemaRuleOverrides.hidden = !parent;
    if (schemaRuleOverrideList)
        schemaRuleOverrideList.replaceChildren(...Object.keys(parent?.document.properties ?? {}).map((property) => {
            const label = document.createElement("label");
            const select = document.createElement("select");
            select.setAttribute("aria-label", `${property} inherited rule override`);
            select.replaceChildren(...["inherit", "enabled", "disabled"].map((state) => Object.assign(document.createElement("option"), { value: state, textContent: state === "inherit" ? "Inherit" : state === "enabled" ? "Enabled in this schema" : "Disabled in this schema" })));
            select.value = draft.inheritedRuleOverrides?.[property] ?? "inherit";
            select.addEventListener("change", () => { if (schemaDraft) {
                schemaDraft = { ...schemaDraft, inheritedRuleOverrides: { ...(schemaDraft.inheritedRuleOverrides ?? {}), [property]: select.value } };
                renderSchemaDraft();
            } });
            label.append(`${property}: `, select);
            return label;
        }));
    renderSchemaInheritancePresentation(draft);
    const candidates = [...schemas.filter((schema) => schema.id !== candidate.id), candidate];
    const inheritanceError = schemaInheritanceError(candidate, candidates) ?? schemaInheritanceConflict(candidate, candidates);
    const ready = Boolean(draft.name.trim() && Object.keys(draft.document.properties ?? {}).length && !inheritanceError);
    const reason = !draft.name.trim() ? "Enter a schema name" : !Object.keys(draft.document.properties ?? {}).length ? "Add at least one validation rule" : inheritanceError ?? "Ready to save";
    if (saveSchemaButton)
        saveSchemaButton.disabled = !ready;
    if (saveSchemaReason)
        saveSchemaReason.textContent = reason;
}
function renderSchemaInheritancePresentation(draft) {
    const ancestors = [];
    const seen = new Set([draft.id]);
    let parentId = draft.parentSchemaId;
    while (parentId && !seen.has(parentId)) {
        seen.add(parentId);
        const parent = schemas.find((schema) => schema.id === parentId);
        if (!parent)
            break;
        ancestors.push(parent);
        parentId = parent.parentSchemaId;
    }
    const inherited = ancestors.flatMap((origin) => (origin.attachedRules ?? []).map((rule) => {
        const override = rule.propertyPath ? draft.inheritedRuleOverrides?.[rule.propertyPath] : undefined;
        return { path: rule.propertyPath ?? "root", rule, origin, state: override === "disabled" ? "disabled-inherited" : override === "enabled" ? "explicitly-reenabled" : "active-inherited" };
    }));
    const local = (draft.attachedRules ?? []).map((rule) => ({ path: rule.propertyPath ?? "root", rule, origin: draft, state: "local" }));
    const groups = {
        "active-inherited": inherited.filter((entry) => entry.state === "active-inherited" && entry.rule.enabled !== false),
        "disabled-inherited": inherited.filter((entry) => entry.state === "disabled-inherited" || (entry.state === "active-inherited" && entry.rule.enabled === false)),
        "explicitly-reenabled": inherited.filter((entry) => entry.state === "explicitly-reenabled"),
        local,
    };
    const labels = {
        "active-inherited": "Active inherited",
        "disabled-inherited": "Disabled inherited",
        "explicitly-reenabled": "Explicitly re-enabled",
        local: "Local",
    };
    schemaInheritedRuleGroups.hidden = ancestors.length === 0;
    schemaEffectiveRulePreview.hidden = ancestors.length === 0;
    schemaInheritedRuleGroups.replaceChildren(...["active-inherited", "disabled-inherited", "explicitly-reenabled", "local"].map((state) => {
        const group = document.createElement("section");
        group.dataset.inheritedRuleGroup = state;
        const entries = groups[state];
        const heading = document.createElement("h5");
        heading.textContent = `${labels[state]} (${entries.length})`;
        const list = document.createElement("ul");
        const empty = state === "local" ? "No local rules." : state === "explicitly-reenabled" ? "No explicitly re-enabled inherited rules." : `No ${labels[state].toLowerCase()} rules.`;
        list.replaceChildren(...(entries.length ? entries.map((entry) => Object.assign(document.createElement("li"), { textContent: displaySchemaRule(entry) })) : [Object.assign(document.createElement("li"), { textContent: empty })]));
        group.append(heading, list);
        return group;
    }));
    const effective = [...groups["active-inherited"], ...groups["explicitly-reenabled"], ...groups.local];
    const previewHeading = document.createElement("h4");
    previewHeading.textContent = "Effective-rule preview";
    const previewList = document.createElement("ul");
    previewList.replaceChildren(...(effective.length ? effective.map((entry) => Object.assign(document.createElement("li"), { textContent: `${entry.path} · ${schemaRuleLabel(entry)} v${entry.rule.version} · ${entry.state === "local" ? "local" : `inherited from ${entry.origin.name} v${entry.origin.version}`}` })) : [Object.assign(document.createElement("li"), { textContent: "No effective rules." })]));
    schemaEffectiveRulePreview.replaceChildren(previewHeading, previewList);
}
function displaySchemaRule(entry) {
    return `${schemaRuleLabel(entry)} v${entry.rule.version} · ${entry.path} · ${entry.origin.name} v${entry.origin.version}`;
}
function schemaRuleLabel(entry) {
    return reusableSchemaRules.find((candidate) => candidate.id === entry.rule.id)?.name ?? entry.rule.id;
}
function schemaDocumentFromValue(value) {
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
function openSchemaFromSource(source) {
    const document = schemaDocumentFromValue(source.payload);
    const objectDocument = document.type === "object"
        ? document
        : { type: "object", properties: { value: document } };
    schemaDraft = {
        ...createSchema(`${source.name} schema`, 1, objectDocument),
        assignments: [{ sourceId: source.sourceId, eventName: source.eventName, target: "payload" }],
    };
    selectedSchemaPropertyPath = Object.keys(objectDocument.properties ?? {})[0] ?? "value";
    showDataLayerView("Schemas");
    renderSchemaDraft();
    if (schemaResult)
        schemaResult.textContent = `${source.label} fields loaded into a new schema draft.`;
    schemaEditorName?.focus({ preventScroll: true });
}
function openNewSchemaEditor() {
    schemaDraft = createSchema("", 1, { type: "object" });
    renderSchemaDraft();
    schemaEditorName?.focus({ preventScroll: true });
}
function persistSchemaLibrary() {
    localStorage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, serializeSchemaLibrary(schemas));
}
function withSchemaParent(schema, parentSchemaId) {
    const { parentSchemaId: _previousParentSchemaId, ...withoutParent } = schema;
    return parentSchemaId ? { ...withoutParent, parentSchemaId } : withoutParent;
}
function defineSchemaProperty(document, path) {
    const [name, ...rest] = path;
    if (!name)
        return document;
    const properties = document.properties ?? {};
    if (rest.length === 0)
        return { ...document, type: document.type ?? "object", properties: { ...properties, [name]: properties[name] ?? { type: "string" } } };
    return { ...document, type: document.type ?? "object", properties: { ...properties, [name]: defineSchemaProperty(properties[name] ?? { type: "object" }, rest) } };
}
function attachReusableRule(path, rule) {
    if (!schemaDraft)
        return;
    const attachment = {
        id: rule.id,
        name: rule.name,
        version: rule.version ?? 1,
        propertyPath: path,
        ...(rule.operator ? { operator: rule.operator } : {}),
        ...(rule.parameters ? { parameters: rule.parameters } : {}),
        ...(rule.severity ? { severity: rule.severity } : {}),
        ...(rule.message ? { message: rule.message } : {}),
        enabled: true,
    };
    schemaDraft = { ...schemaDraft, document: defineSchemaProperty(schemaDraft.document, path.split(".")), attachedRules: [...(schemaDraft.attachedRules ?? []).filter((item) => item.id !== rule.id || item.propertyPath !== path), attachment] };
    renderSchemaDraft();
    focusSchemaPropertyRow(path);
}
function updateAttachedRule(path, id, update) {
    if (!schemaDraft)
        return;
    const attachedRules = (schemaDraft.attachedRules ?? []).flatMap((rule) => {
        if (rule.id !== id || rule.propertyPath !== path)
            return [rule];
        const next = update(rule);
        return next ? [next] : [];
    });
    schemaDraft = { ...schemaDraft, attachedRules };
    renderSchemaDraft();
    focusSchemaPropertyRow(path);
}
function focusSchemaPropertyRow(path) {
    Array.from(schemaPropertyTree.querySelectorAll("li[data-schema-property-path]"))
        .find((row) => row.dataset.schemaPropertyPath === path)
        ?.focus({ preventScroll: true });
}
function renderSchemaWorkflowRows() {
    if (schemaAssignmentSchema)
        schemaAssignmentSchema.replaceChildren(...schemas.map((schema) => Object.assign(document.createElement("option"), { value: schema.id, textContent: `${schema.name} version ${schema.version}` })));
    const visibleRules = reusableSchemaRules.filter((rule) => `${rule.name} ${rule.kind}`.toLowerCase().includes(schemaRuleSearch?.value.toLowerCase() ?? ""));
    schemaRuleList?.replaceChildren(...visibleRules.map((rule) => {
        const item = document.createElement("li");
        const summary = document.createElement("span");
        summary.textContent = `${rule.name} v${rule.version ?? 1} · ${rule.kind}${rule.operator ? ` · ${rule.operator}` : ""}${rule.attachments?.length ? ` · ${rule.attachments.length} attachments` : ""}${rule.enabled === false ? " · disabled" : ""}${rule.revisionHistory?.length ? ` · ${rule.revisionHistory.length} prior versions` : ""}`;
        const edit = document.createElement("button");
        const duplicate = document.createElement("button");
        const exportRule = document.createElement("button");
        const disable = document.createElement("button");
        const remove = document.createElement("button");
        edit.type = duplicate.type = exportRule.type = disable.type = remove.type = "button";
        edit.textContent = "Edit";
        duplicate.textContent = "Duplicate";
        exportRule.textContent = "Export";
        disable.textContent = rule.enabled === false ? "Enable" : "Disable";
        remove.textContent = "Delete";
        edit.addEventListener("click", () => { editingReusableSchemaRuleId = rule.id; if (schemaRuleName)
            schemaRuleName.value = rule.name; if (schemaRuleTypes)
            schemaRuleTypes.value = rule.kind.includes("Allowed values") ? "Allowed values" : rule.kind.includes("Regular expression") ? "Regular expression" : "Required"; if (schemaRuleOperator)
            schemaRuleOperator.value = rule.operator ?? "required"; if (schemaRuleParameters)
            schemaRuleParameters.value = rule.parameters ?? ""; if (schemaRuleSeverity)
            schemaRuleSeverity.value = rule.severity ?? "error"; if (schemaRuleMessage)
            schemaRuleMessage.value = rule.message ?? ""; if (schemaRuleExamples)
            schemaRuleExamples.value = rule.examples ?? ""; if (schemaRuleAttachments) {
            schemaRuleAttachments.replaceChildren(...schemas.map((schema) => Object.assign(document.createElement("option"), { value: schema.id, textContent: `${schema.name} v${schema.version}`, selected: rule.attachments?.includes(schema.id) ?? false })));
        } if (schemaRuleEditor)
            schemaRuleEditor.hidden = false; schemaRuleName?.focus({ preventScroll: true }); });
        duplicate.addEventListener("click", () => { reusableSchemaRules = [...reusableSchemaRules, { ...rule, id: `rule:${crypto.randomUUID()}`, name: `${rule.name} copy`, version: 1, enabled: true }]; localStorage.setItem(SCHEMA_RULE_STORAGE_KEY, JSON.stringify(reusableSchemaRules)); renderSchemaWorkflowRows(); });
        exportRule.addEventListener("click", () => { const blob = new Blob([`${JSON.stringify(rule, null, 2)}\n`], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${rule.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-v${rule.version ?? 1}.json`; link.click(); URL.revokeObjectURL(url); });
        disable.addEventListener("click", () => { reusableSchemaRules = reusableSchemaRules.map((candidate) => candidate.id === rule.id ? { ...candidate, enabled: candidate.enabled === false } : candidate); localStorage.setItem(SCHEMA_RULE_STORAGE_KEY, JSON.stringify(reusableSchemaRules)); renderSchemaWorkflowRows(); });
        remove.addEventListener("click", () => { const attached = schemas.filter((schema) => rule.attachments?.includes(schema.id) || JSON.stringify(schema.document).includes(rule.id)); if (attached.length) {
            if (schemaResult)
                schemaResult.textContent = `Cannot delete ${rule.name}: attached to ${attached.map((schema) => schema.name).join(", ")}.`;
            return;
        } pendingReusableSchemaRuleDeletionId = rule.id; if (schemaRuleDeleteReviewSummary)
            schemaRuleDeleteReviewSummary.textContent = `${rule.name} v${rule.version ?? 1} will be removed.`; if (schemaRuleDeleteReview) {
            schemaRuleDeleteReview.hidden = false;
            schemaRuleDeleteReview.showModal();
        } });
        item.append(summary, edit, duplicate, exportRule, disable, remove);
        return item;
    }));
    const assignments = schemas.flatMap((schema) => schema.assignments.map((assignment) => ({ schema, assignment })));
    schemaAssignmentList?.replaceChildren(...assignments.map(({ schema, assignment }) => {
        const item = document.createElement("li");
        const summary = document.createElement("span");
        summary.textContent = `${assignment.name ?? assignment.id ?? "Assignment"} · ${assignment.sourceId}/${assignment.eventName} · ${assignment.target} · ${assignment.domainCondition ?? "any"}${assignment.pathnameCondition ?? "any"} · priority ${assignment.priority ?? 0} · ${assignment.versionPolicy ?? "pinned"} · ${assignment.enabled === false ? "disabled" : "enabled"} · ${schema.name}`;
        const edit = document.createElement("button");
        const duplicate = document.createElement("button");
        const disable = document.createElement("button");
        const remove = document.createElement("button");
        edit.type = duplicate.type = disable.type = remove.type = "button";
        edit.textContent = "Edit";
        duplicate.textContent = "Duplicate";
        disable.textContent = assignment.enabled === false ? "Enable" : "Disable";
        remove.textContent = "Delete";
        edit.addEventListener("click", () => { editingSchemaAssignment = assignment.id ? { schemaId: schema.id, assignmentId: assignment.id } : { schemaId: schema.id }; if (schemaAssignmentSchema)
            schemaAssignmentSchema.value = schema.id; if (schemaAssignmentSource)
            schemaAssignmentSource.value = assignment.sourceId; if (schemaAssignmentEvent)
            schemaAssignmentEvent.value = assignment.eventName; if (schemaAssignmentTarget)
            schemaAssignmentTarget.value = assignment.target; if (schemaAssignmentDomain)
            schemaAssignmentDomain.value = assignment.domainCondition ?? ""; if (schemaAssignmentPathname)
            schemaAssignmentPathname.value = assignment.pathnameCondition ?? ""; if (schemaAssignmentPriority)
            schemaAssignmentPriority.value = String(assignment.priority ?? 0); if (schemaAssignmentVersionPolicy)
            schemaAssignmentVersionPolicy.value = assignment.versionPolicy ?? "pinned"; if (schemaAssignmentEnabled)
            schemaAssignmentEnabled.checked = assignment.enabled !== false; if (schemaAssignmentEditor)
            schemaAssignmentEditor.hidden = false; });
        duplicate.addEventListener("click", () => { schemas = schemas.map((candidate) => candidate.id === schema.id ? { ...candidate, assignments: [...candidate.assignments, { ...assignment, id: `${assignment.id ?? "assignment"}:copy`, name: `${assignment.name ?? "Assignment"} copy` }] } : candidate); persistSchemaLibrary(); renderSchemaWorkflowRows(); });
        disable.addEventListener("click", () => { schemas = schemas.map((candidate) => candidate.id === schema.id ? { ...candidate, assignments: candidate.assignments.map((item) => item === assignment ? { ...item, enabled: item.enabled === false } : item) } : candidate); persistSchemaLibrary(); renderSchemaWorkflowRows(); });
        remove.addEventListener("click", () => { schemas = schemas.map((candidate) => candidate.id === schema.id ? { ...candidate, assignments: candidate.assignments.filter((item) => item !== assignment) } : candidate); persistSchemaLibrary(); renderSchemaWorkflowRows(); });
        item.append(summary, edit, duplicate, disable, remove);
        return item;
    }));
    const collisions = new Map();
    for (const { schema, assignment } of assignments.filter(({ assignment }) => assignment.enabled !== false)) {
        const key = [assignment.sourceId, assignment.eventName, assignment.target, assignment.priority ?? 0, assignment.domainCondition ?? "any", assignment.pathnameCondition ?? "any"].join("|");
        collisions.set(key, [...(collisions.get(key) ?? []), `${schema.name}/${assignment.name ?? assignment.id ?? "unnamed"}`]);
    }
    const conflicts = [...collisions.values()].filter((matches) => matches.length > 1);
    if (schemaAssignmentConflicts)
        schemaAssignmentConflicts.textContent = conflicts.length ? `Assignment conflict: ${conflicts.map((matches) => matches.join(", ")).join("; ")}. Edit priorities before validation.` : "";
}
function recheckCapturedSchemaValidation() {
    const events = liveObserverState.events;
    if (!events.length) {
        if (schemaResult)
            schemaResult.textContent = "No captured events are available to recheck.";
        return;
    }
    let checked = 0;
    const issueRows = [];
    const checkedAt = new Date().toISOString();
    const records = [];
    liveObserverState = {
        ...liveObserverState,
        events: events.map((event) => {
            const validation = validateEvent({ sourceId: event.sourceId, eventName: event.name, payload: event.payload, rawInput: event.rawInput }, schemas, event.pageUrl);
            if (validation.state !== "Not checked")
                checked += 1;
            const assignment = validation.assignment;
            const assignmentDetails = assignment ? `assignment id ${assignment.id ?? "none"} · name ${assignment.name ?? "none"} · source ${assignment.sourceId} · event ${assignment.eventName} · target ${assignment.target} · priority ${assignment.priority ?? 0} · domain ${assignment.domainCondition ?? "any"} · pathname ${assignment.pathnameCondition ?? "any"} · policy ${assignment.versionPolicy ?? "pinned"} · ${assignment.enabled === false ? "disabled" : "enabled"}` : `assignment ${validation.target ?? "automatic"}`;
            issueRows.push(...validation.issues.map((issue) => Object.assign(document.createElement("li"), { textContent: `${event.name} · ${issue.instancePath || "root"} · ${issue.message}: expected ${issue.expected}, received ${issue.actual} · rule ${issue.rule ?? "schema"} · severity ${issue.severity ?? "error"} · ${issue.origin ?? `${issue.schemaName} v${issue.schemaVersion}`} · ${issue.schemaLocation} · ${assignmentDetails}` })));
            records.push({ eventId: event.id, eventName: event.name, state: validation.state, checkedAt, ...(validation.schema ? { schemaName: validation.schema.name, schemaVersion: validation.schema.version } : {}), ...(validation.target ? { target: validation.target } : {}) });
            return { ...event, validation: validation.state };
        }),
    };
    renderLiveObserver();
    schemaValidationIssues?.replaceChildren(...issueRows);
    schemaValidationRecords = [...schemaValidationRecords, ...records].slice(-50);
    localStorage.setItem(SCHEMA_VALIDATION_RECORD_STORAGE_KEY, JSON.stringify(schemaValidationRecords));
    renderSchemaValidationRecords();
    if (schemaResult)
        schemaResult.textContent = checked ? `Rechecked ${checked} captured ${checked === 1 ? "event" : "events"}.` : "No captured events matched a schema assignment.";
}
function renderSchemaValidationRecords() {
    schemaValidationRecordList?.replaceChildren(...schemaValidationRecords.map((record) => Object.assign(document.createElement("li"), { textContent: `${record.eventName} · ${record.state} · ${record.schemaName ? `${record.schemaName} v${record.schemaVersion} · ${record.target}` : "No matching schema"} · ${record.checkedAt}` })));
}
function persistEventTemplateLibrary() {
    localStorage.setItem(EVENT_TEMPLATE_LIBRARY_STORAGE_KEY, serializeEventTemplateLibrary(eventTemplates));
}
function downloadEventLibrary() {
    const blob = new Blob([`${JSON.stringify(eventLibraryExport(eventTemplates), null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "event-library.json";
    link.click();
    URL.revokeObjectURL(url);
}
async function reviewEventLibraryImport() {
    const file = eventLibraryFile?.files?.[0];
    if (!file)
        return;
    try {
        pendingEventLibraryImport = eventLibraryImport(await file.text());
        replaceEventLibraryArmed = false;
        if (replaceEventLibraryButton)
            replaceEventLibraryButton.textContent = "Replace entire Library";
        if (eventLibraryImportReviewSummary)
            eventLibraryImportReviewSummary.textContent = `Format version ${pendingEventLibraryImport.version}; ${pendingEventLibraryImport.templates.length} templates; ${pendingEventLibraryImport.templates.reduce((count, template) => count + (template.revisionHistory?.length ?? 0), 0)} revisions; valid.`;
        showDialog(eventLibraryImportReview, eventLibraryImportReviewHeading);
    }
    catch (error) {
        if (eventLibraryTransferResult)
            eventLibraryTransferResult.textContent = error instanceof Error ? error.message : "Select a valid Library JSON file";
    }
    finally {
        if (eventLibraryFile)
            eventLibraryFile.value = "";
    }
}
function commitEventLibraryImport(mode) {
    if (!pendingEventLibraryImport)
        return;
    const importCount = pendingEventLibraryImport.templates.length;
    const previous = eventTemplates.length;
    const result = mode === "replace"
        ? { templates: replaceImportedTemplates(eventTemplates, pendingEventLibraryImport.templates), remapped: 0 }
        : appendImportedTemplates(eventTemplates, pendingEventLibraryImport.templates, () => `template:import:${crypto.randomUUID()}`);
    eventTemplates = result.templates;
    persistEventTemplateLibrary();
    pendingEventLibraryImport = undefined;
    replaceEventLibraryArmed = false;
    hideDialog(eventLibraryImportReview);
    renderEventTemplateLibrary();
    if (eventLibraryTransferResult)
        eventLibraryTransferResult.textContent = mode === "replace"
            ? `${eventTemplates.length} imported and ${previous} replaced.`
            : `${importCount} appended and ${result.remapped} identity remapped.`;
}
function requestEventTemplateDeletion(template) {
    pendingEventLibraryDeletion = { id: template.id, name: template.name, count: 1 };
    if (eventLibraryDeleteReviewSummary)
        eventLibraryDeleteReviewSummary.textContent = `${template.name}; event ${template.eventName}; ${template.version} saved versions will be deleted. Captured events, saved sessions, and execution records remain unchanged.`;
    if (confirmEventLibraryDeleteButton)
        confirmEventLibraryDeleteButton.textContent = `Delete ${template.name}`;
    showDialog(eventLibraryDeleteReview, eventLibraryDeleteReviewHeading);
}
function requestClearEventLibrary() {
    if (eventTemplates.length === 0)
        return;
    pendingEventLibraryDeletion = { count: eventTemplates.length };
    if (eventLibraryDeleteReviewSummary)
        eventLibraryDeleteReviewSummary.textContent = `All ${eventTemplates.length} templates and their saved revisions will be removed.`;
    if (confirmEventLibraryDeleteButton)
        confirmEventLibraryDeleteButton.textContent = `Delete all ${eventTemplates.length} events`;
    showDialog(eventLibraryDeleteReview, eventLibraryDeleteReviewHeading);
}
function commitEventLibraryDeletion() {
    const pending = pendingEventLibraryDeletion;
    if (!pending)
        return;
    eventTemplates = pending.id ? deleteEventTemplate(eventTemplates, pending.id) : clearEventLibrary(eventTemplates);
    persistEventTemplateLibrary();
    pendingEventLibraryDeletion = undefined;
    hideDialog(eventLibraryDeleteReview);
    if (propertyEditorState && pending.id === propertyEditorState.template.id)
        propertyEditorState = undefined;
    renderEventTemplateLibrary();
    if (eventLibraryTransferResult)
        eventLibraryTransferResult.textContent = pending.id ? `Deleted ${pending.name}.` : `${pending.count} events deleted.`;
    if (!pending.id)
        addNewButton?.focus({ preventScroll: true });
}
function renderSequences() {
    if (sequenceEmptyState)
        sequenceEmptyState.hidden = replaySequences.length > 0;
    renderSequenceReplay(sequenceReplayElements, replaySequences, (sequence) => {
        const templates = eventTemplates.map((template) => ({
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
            capabilities: ["push"],
        }));
        const ready = readiness(sequence, templates, adapters);
        if (!ready.runnable) {
            setSequenceReplayResult(sequenceReplayElements, `Not runnable: ${ready.blocked.join(", ")}`);
            return;
        }
        const record = runSequence(sequence, templates, adapters, liveObserverState.pageUrl, "Run all");
        setSequenceReplayResult(sequenceReplayElements, `${record.result}: ${record.steps.length} steps.`);
    });
}
function resetTemplateEditorDisclosures() {
    document.querySelectorAll("#event-property-editor details").forEach((disclosure) => {
        disclosure.open = false;
    });
}
function openTemplateEditor(template) {
    templateEditorReturnTemplateId = template.id;
    propertyEditorState = openPropertyEditor(template);
    resetTemplateEditorDisclosures();
    setEventLibraryResult(eventLibraryEditorElements, "");
    renderEventTemplateLibrary();
    eventLibraryEditorElements.editorTitle?.focus({ preventScroll: true });
}
function openNewEventEditor() {
    templateEditorReturnTemplateId = undefined;
    propertyEditorState = createNewEventEditor();
    resetTemplateEditorDisclosures();
    setEventLibraryResult(eventLibraryEditorElements, "");
    renderEventTemplateLibrary();
    eventTemplateName?.focus({ preventScroll: true });
}
function closeTemplateEditor() {
    const wasNew = propertyEditorState?.isNew;
    propertyEditorState = undefined;
    resetTemplateEditorDisclosures();
    if (eventLibraryEditorElements.propertyEditor) {
        eventLibraryEditorElements.propertyEditor.hidden = true;
    }
    if (closeTemplateEditorConfirmation)
        closeTemplateEditorConfirmation.hidden = true;
    setEventLibraryResult(eventLibraryEditorElements, "");
    renderEventTemplateLibrary();
    if (templateEditorReturnTemplateId) {
        focusTemplateEditAction(eventLibraryEditorElements, templateEditorReturnTemplateId);
    }
    if (wasNew)
        addNewButton?.focus({ preventScroll: true });
    templateEditorReturnTemplateId = undefined;
}
function hideDialog(dialog) {
    if (dialog?.open)
        dialog.close();
    if (dialog)
        dialog.hidden = true;
}
function showDialog(dialog, focus) {
    if (!dialog)
        return;
    dialog.hidden = false;
    if (!dialog.open)
        dialog.showModal();
    focus?.focus({ preventScroll: true });
}
function renderTemplateRenameValidation() {
    if (!pendingTemplateRename)
        return false;
    const errors = renameValidation(pendingTemplateRename.draft);
    const fields = [
        [templateRenameName, templateRenameNameError, errors.templateName],
        [templateRenameEventName, templateRenameEventNameError, errors.eventName],
    ];
    for (const [input, message, error] of fields) {
        if (!input)
            continue;
        input.setCustomValidity(error ?? "");
        input.setAttribute("aria-invalid", String(Boolean(error)));
        if (message)
            message.textContent = error ?? "";
    }
    const firstError = errors.templateName ?? errors.eventName;
    if (saveTemplateNamesButton) {
        saveTemplateNamesButton.disabled = Boolean(firstError);
        if (firstError)
            saveTemplateNamesButton.setAttribute("aria-describedby", errors.templateName ? "event-template-rename-name-error" : "event-template-rename-event-name-error");
        else
            saveTemplateNamesButton.removeAttribute("aria-describedby");
    }
    return !firstError;
}
function openTemplateRename(template) {
    pendingTemplateRename = {
        editor: openPropertyEditor(template),
        draft: beginTemplateRename(template),
        templateId: template.id,
    };
    if (templateRenameName)
        templateRenameName.value = pendingTemplateRename.draft.templateName;
    if (templateRenameEventName)
        templateRenameEventName.value = pendingTemplateRename.draft.eventName;
    renderTemplateRenameValidation();
    showDialog(templateRenameDialog, templateRenameName ?? templateRenameHeading);
}
function closeTemplateRename() {
    hideDialog(templateRenameDialog);
    const templateId = pendingTemplateRename?.templateId;
    pendingTemplateRename = undefined;
    if (templateId)
        focusTemplateRenameAction(eventLibraryEditorElements, templateId);
}
function commitTemplateRename() {
    if (!pendingTemplateRename)
        return;
    const renamed = saveTemplateRename(pendingTemplateRename.editor, pendingTemplateRename.draft);
    eventTemplates = eventTemplates.map((template) => template.id === renamed.template.id ? renamed.template : template);
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
function requestTemplateRenameSave() {
    if (!pendingTemplateRename || !renderTemplateRenameValidation())
        return;
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
function returnToTemplateRename() {
    hideDialog(templateRenameReview);
    showDialog(templateRenameDialog, saveTemplateNamesButton);
}
async function pushPayloadToSelectedTargetPage(request) {
    if (typeof chrome === "undefined" || !chrome.scripting?.executeScript) {
        throw new Error("Selected-page push is unavailable.");
    }
    const [injection] = await chrome.scripting.executeScript({
        target: { tabId: request.tabId },
        world: "MAIN",
        args: [request.destination, request.eventName, request.payload],
        func: pushPayloadInPage,
    });
    const result = injection?.result;
    if (!result?.success) {
        throw new Error(result?.result ?? "Selected-page push failed.");
    }
}
async function pushCurrentTemplateDraft(editor = propertyEditorState, target = selectedObservationTarget(observationTargetState)) {
    if (!editor)
        return;
    const record = await pushTemplateToSelectedTarget(editor, target, pushPayloadToSelectedTargetPage);
    setPushDestinationValidation(eventLibraryEditorElements, record.fieldError ?? "");
    if (record.fieldError)
        setEventLibraryValidation(eventLibraryEditorElements, record.fieldError);
    setEventLibraryResult(eventLibraryEditorElements, record.summary);
}
function openRevisionChangeReview() {
    if (!propertyEditorState || propertyEditorState.isNew)
        return;
    if (propertyEditorState.jsonError) {
        setEventLibraryValidation(eventLibraryEditorElements, "Correct the JSON draft.");
        return;
    }
    const identityError = Object.values(templateIdentityValidation(propertyEditorState))[0];
    if (identityError) {
        setEventLibraryValidation(eventLibraryEditorElements, identityError);
        return;
    }
    pendingRevisionChangeReview = { editor: structuredClone(propertyEditorState), review: createTemplateChangeReview(propertyEditorState, "revision") };
    renderTemplateChangeReview(revisionChangeReview ?? document, pendingRevisionChangeReview.review);
    if (confirmRevisionChangeButton)
        confirmRevisionChangeButton.textContent = `Save revision ${pendingRevisionChangeReview.review.resultingVersion}`;
    showDialog(revisionChangeReview, revisionChangeReviewHeading);
}
function closeRevisionChangeReview() {
    pendingRevisionChangeReview = undefined;
    hideDialog(revisionChangeReview);
    saveTemplateRevisionButton?.focus({ preventScroll: true });
}
function commitRevisionChangeReview() {
    const pending = pendingRevisionChangeReview;
    if (!pending)
        return;
    propertyEditorState = saveDraftRevision(pending.editor);
    eventTemplates = eventTemplates.map((template) => template.id === propertyEditorState?.template.id ? propertyEditorState.template : template);
    persistEventTemplateLibrary();
    hideDialog(revisionChangeReview);
    pendingRevisionChangeReview = undefined;
    setEventLibraryResult(eventLibraryEditorElements, `Saved version ${propertyEditorState.template.version}; identity, execution, and payload changes applied.`);
    renderEventTemplateLibrary();
}
function openPushDraftReview() {
    if (!propertyEditorState)
        return;
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
    if (pushDraftReviewSummary)
        pushDraftReviewSummary.textContent = "";
    if (confirmPushDraftButton)
        confirmPushDraftButton.textContent = pendingPushDraftReview.confirmLabel;
    openPushReview({ dialog: pushDraftReview, heading: pushDraftReviewHeading, trigger: pushTemplateDraftButton });
}
function renderSavedSessions() {
    const sessions = searchSavedSessions(savedSessionLibrary, savedSessionSearch?.value ?? "");
    if (savedSessionEmptyState)
        savedSessionEmptyState.hidden = sessions.length > 0;
    if (savedSessionCount)
        savedSessionCount.textContent = `${sessions.length} saved sessions`;
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
            open.textContent = `Open ${session.name}`;
            open.addEventListener("click", () => {
                archivedSavedSession = openSavedSession(savedSessionLibrary, session.id);
                if (savedSessionConfirmation) {
                    savedSessionConfirmation.textContent = `Archived session: ${session.name}. Live observer is not running.`;
                }
                showDataLayerView("Sessions");
            });
            rename.type = "button";
            rename.textContent = "Rename";
            rename.addEventListener("click", () => {
                const name = globalThis.prompt("Saved session name", session.name);
                if (name?.trim()) {
                    savedSessionLibrary = renameSavedSession(savedSessionLibrary, session.id, name.trim());
                    renderSavedSessions();
                }
            });
            exportButton.type = "button";
            exportButton.textContent = "Export";
            exportButton.addEventListener("click", () => {
                downloadSavedSessionFile(session);
                if (savedSessionConfirmation)
                    savedSessionConfirmation.textContent = `Exported saved session ${session.name}.`;
            });
            resumeCapture.type = "button";
            resumeCapture.textContent = "Resume capture";
            resumeCapture.addEventListener("click", () => {
                const archived = openSavedSession(savedSessionLibrary, session.id);
                const resumed = resumeSavedSession(archived, globalThis.location.href);
                archivedSavedSession = archived;
                liveObserverState = {
                    ...liveObserverState,
                    view: "Live",
                    status: "Live",
                    pageUrl: resumed.activeSession.pageUrl,
                    events: [],
                };
                setLiveSessionMessage(`Capture resumed from ${session.name}; new session linked to archive.`);
                renderLiveObserver();
                showDataLayerView("Live");
            });
            createSequenceButton.type = "button";
            createSequenceButton.textContent = "Create sequence";
            createSequenceButton.addEventListener("click", () => {
                const templates = eventTemplates.filter((template) => session.events.some((event) => `template:${event.id}` === template.id)).map((template) => ({ id: template.id, name: template.name, version: template.version, sourceId: template.sourceId, destination: template.destination, payload: template.payload }));
                replaySequences = [...replaySequences, createSequence(`sequence:${session.id}`, `${session.name} sequence`, session.id, templates)];
                renderSequences();
                if (savedSessionConfirmation)
                    savedSessionConfirmation.textContent = `Created sequence from ${session.name}; saved session remains unchanged.`;
            });
            remove.type = "button";
            remove.textContent = "Delete";
            remove.addEventListener("click", () => {
                savedSessionLibrary = requestSavedSessionDeletion(savedSessionLibrary, session.id);
                if (savedSessionConfirmation)
                    savedSessionConfirmation.textContent = `Delete saved session ${session.name}?`;
                if (cancelSavedSessionDeleteButton)
                    cancelSavedSessionDeleteButton.hidden = false;
                if (confirmSavedSessionDeleteButton)
                    confirmSavedSessionDeleteButton.hidden = false;
            });
            const summary = savedSessionSummary(session);
            item.textContent = `${session.name}: ${summary.captureDate}, ${summary.pageScope}, ${summary.duration}, ${summary.sourceCount} sources, ${summary.eventCount} events, ${summary.validationSummary}. `;
            item.append(open, rename, exportButton, resumeCapture, createSequenceButton, remove);
            return item;
        }));
    }
}
function savedSessionFileName(name) {
    return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "saved-session"}.json`;
}
function downloadSavedSessionFile(session) {
    const blob = new Blob([`${exportSavedSession(session)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = savedSessionFileName(session.name);
    link.click();
    URL.revokeObjectURL(url);
}
async function loadSavedSessionFile() {
    const file = savedSessionFileInput?.files?.[0];
    if (!file)
        return;
    try {
        savedSessionLibrary = importSavedSession(savedSessionLibrary, await file.text());
        if (savedSessionConfirmation)
            savedSessionConfirmation.textContent = "Saved session imported as an immutable archive.";
        renderSavedSessions();
    }
    catch {
        if (savedSessionConfirmation)
            savedSessionConfirmation.textContent = "Saved session file must contain valid JSON.";
    }
    finally {
        if (savedSessionFileInput)
            savedSessionFileInput.value = "";
    }
}
function expandedTimelinePageIndexes() {
    const expandedIndexes = new Set();
    if (!sessionTimeline) {
        return expandedIndexes;
    }
    const pages = Array.from(sessionTimeline.querySelectorAll(":scope > li > details"));
    pages.forEach((page, index) => {
        if (page.open) {
            expandedIndexes.add(index);
        }
    });
    return expandedIndexes;
}
function renderSessionState() {
    const session = dataLayerSessionState.session;
    if (sessionHistoryPath) {
        sessionHistoryPath.textContent = session?.historyPath ?? "";
    }
    if (sessionTimeline) {
        const expandedPageIndexes = expandedTimelinePageIndexes();
        sessionTimeline.replaceChildren(...nestedTimeline(session?.timeline ?? []).map((page, index) => renderTimelinePage(page, expandedPageIndexes.has(index))));
    }
    if (sessionWarning) {
        sessionWarning.textContent = dataLayerSessionState.warning ?? "";
    }
    renderLiveContextActions();
}
function renderTimelinePage(page, expanded = false) {
    const item = document.createElement("li");
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    const eventList = document.createElement("ul");
    details.open = expanded;
    summary.textContent = page.url;
    eventList.append(...page.events.map(renderTimelineEvent));
    details.append(summary, eventList);
    item.append(details);
    return item;
}
function renderTimelineEvent(event) {
    const item = document.createElement("li");
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    const definitionList = document.createElement("dl");
    summary.textContent = timelineEventHeading(event);
    appendDefinition(definitionList, "Event", event.name);
    appendDefinition(definitionList, "URL", event.url);
    appendDefinition(definitionList, "Time", event.timestamp);
    appendDefinition(definitionList, "Path", event.observerPath);
    appendDefinition(definitionList, "Payload", event.payload);
    appendDefinition(definitionList, "Raw", event.rawValue);
    details.append(summary, definitionList);
    if (event.payloadProperties.length > 0) {
        details.append(renderPayloadProperties(event.payloadProperties));
    }
    item.append(details);
    return item;
}
function renderPayloadProperties(properties) {
    const list = document.createElement("ul");
    list.append(...properties.map(renderPayloadProperty));
    return list;
}
function renderPayloadProperty(property) {
    const item = document.createElement("li");
    item.textContent = `${property.name}: ${property.value}`;
    return item;
}
function appendDefinition(list, label, value) {
    if (!value) {
        return;
    }
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    list.append(term, description);
}
function renderObserverState() {
    renderLiveSessionSummary(liveSessionSummaryElements, currentLiveSessionSummary());
}
function updateSessionFromObserverState() {
    dataLayerSessionState =
        dataLayerObserverState.sessionState ?? dataLayerSessionState;
    syncCapturedEventsToLive();
}
function syncCapturedEventsToLive() {
    const events = dataLayerObserverState.sourceEvents ?? [];
    const pendingEvents = events.slice(presentedSourceEventCount);
    presentedSourceEventCount = events.length;
    for (const event of pendingEvents) {
        const source = liveObserverState.sources.find(({ id }) => id === event.sourceId);
        liveObserverState = recordLiveEvent(liveObserverState, {
            ...event,
            sourceName: source?.name ?? event.sourceId,
            ...(dataLayerObserverState.observer
                ? { destination: dataLayerObserverState.observer.historyPath }
                : {}),
        });
    }
    if (pendingEvents.length > 0)
        renderLiveObserver();
}
function persistAndRenderSessionState() {
    persistSession(dataLayerSessionState);
    renderSessionState();
}
function persistAndRenderObservationState() {
    persistAndRenderSessionState();
    renderObserverState();
}
function restartLiveHistoryCaptureIfActive(observation) {
    if (dataLayerSessionState.session?.status === "active") {
        void startLiveHistoryCapture(observation);
    }
}
async function currentTargetObservation(historyPath) {
    const target = attachedObservationTarget(observationTargetState)
        ?? selectedObservationTarget(observationTargetState);
    if (!target) {
        setObservationTargetResult("Selection required");
        return undefined;
    }
    return tabPageObservation(target.tabId, target.pageUrl, historyPath);
}
function cancelLiveHistoryCaptureRuntime() {
    liveHistoryCaptureGeneration += 1;
    stopLiveHistoryPushCapture();
    stopLiveHistoryPushCapture = () => { };
}
function stopLiveHistoryCapture() {
    cancelLiveHistoryCaptureRuntime();
    dataLayerObserverState = stopHistoryArrayObserver(dataLayerObserverState);
}
async function startLiveHistoryCapture(observation) {
    cancelLiveHistoryCaptureRuntime();
    const captureGeneration = liveHistoryCaptureGeneration;
    try {
        const stopCapture = await startLiveHistoryPushCapture({
            ...(observation.tabId === undefined ? {} : { tabId: observation.tabId }),
            historyPath: observation.historyPath,
            onEntry: ({ rawValue, timestamp }) => {
                dataLayerObserverState = appendObservedHistoryEntry(dataLayerObserverState, rawValue, timestamp);
                updateSessionFromObserverState();
                persistAndRenderObservationState();
            },
        });
        if (captureGeneration !== liveHistoryCaptureGeneration) {
            stopCapture();
            return;
        }
        stopLiveHistoryPushCapture = stopCapture;
    }
    catch {
        if (captureGeneration === liveHistoryCaptureGeneration) {
            stopLiveHistoryPushCapture = () => { };
        }
    }
}
function clearScheduledObservationRefresh() {
    if (observationRefreshTimeoutId !== undefined) {
        globalThis.clearTimeout(observationRefreshTimeoutId);
        observationRefreshTimeoutId = undefined;
    }
}
function activeSessionTabMatches(tabId) {
    const session = dataLayerSessionState.session;
    return session?.status === "active" && session.tabId === tabId;
}
function capturePageEntryForRefresh(request) {
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
function scheduleObservationRefresh(request) {
    clearScheduledObservationRefresh();
    const delay = observationRefreshDelay(request.attempt);
    observationRefreshTimeoutId = globalThis.setTimeout(() => {
        observationRefreshTimeoutId = undefined;
        void runObservationRefresh(request);
    }, delay);
}
function refreshObservationAfterPageLoad(tabId, pageUrl, pageLoadSequence) {
    if (!activeSessionTabMatches(tabId)) {
        return;
    }
    const schedule = observationRefreshRequestForPageLoad(observationRefreshState, tabId, pageUrl, pageLoadSequence);
    observationRefreshState = schedule.state;
    if (schedule.request) {
        scheduleObservationRefresh(schedule.request);
    }
}
async function runObservationRefresh(request) {
    if (!observationRefreshRequestIsCurrent(observationRefreshState, request) ||
        !activeSessionTabMatches(request.tabId)) {
        return;
    }
    const session = dataLayerSessionState.session;
    if (!session) {
        return;
    }
    const nextRequest = capturePageEntryForRefresh(request);
    const observation = await tabPageObservation(nextRequest.tabId, nextRequest.pageUrl, session.historyPath);
    if (!observationRefreshRequestIsCurrent(observationRefreshState, nextRequest) ||
        !activeSessionTabMatches(nextRequest.tabId)) {
        return;
    }
    dataLayerObserverState = restartObservation(dataLayerSessionState, dataLayerObserverState, observation);
    updateSessionFromObserverState();
    persistAndRenderObservationState();
    if (dataLayerObserverState.observer?.status === "ready") {
        await startLiveHistoryCapture(observation);
        return;
    }
    if (shouldRetryObservationRefresh(observation.pageAccessStatus, nextRequest.attempt)) {
        scheduleObservationRefresh(nextObservationRefreshAttempt(nextRequest));
    }
}
async function recordDataLayerCommandRun(entry) {
    if (entry.commandId === "data-layer.start-testing") {
        await attachSelectedTarget();
    }
    if (entry.commandId === "data-layer.end-testing") {
        ({ sessionState: dataLayerSessionState, targetState: observationTargetState } =
            endLiveSession(dataLayerSessionState, observationTargetState, () => stopLiveHistoryCapture()));
        persistAndRenderObservationState();
        renderObservationTargetContext();
        setObservationTargetResult("");
        setLiveSessionMessage("Testing ended");
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
function recordCommandRun(entry) {
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
function setKeymapStatus(message) {
    if (keymapStatus) {
        keymapStatus.textContent = message;
    }
}
function setKeymapWarning(message) {
    if (keymapWarning) {
        keymapWarning.textContent = message;
    }
}
const workspaceTabsController = createWorkspaceTabsController(workspaceTabList, localStorage);
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
function showWorkspace(tab, focus = false) {
    workspaceTabsController.show(tab, focus);
}
function activateHotkeyFocus() {
    if (!panelRoot) {
        return;
    }
    panelRoot.focus();
    panelRoot.dataset.hotkeyFocus = "active";
}
function hotkeyFocusActive() {
    return panelRoot?.dataset.hotkeyFocus === "active";
}
function clearPendingHotkeySequence() {
    pendingHotkeySequence = [];
}
function keymapFileName() {
    return `${PROJECT_NAME}-hotkey-keymap.json`;
}
function downloadHotkeyKeymapFile(keymap) {
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
function updateKeymapStatus(added, removed) {
    setKeymapStatus(`Keymap updated: added ${added.length}, removed ${removed.length}`);
}
function shouldIgnoreHotkeyTarget(target) {
    if (!(target instanceof Element)) {
        return false;
    }
    return (target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable));
}
function storeHotkeyKeymap(keymap) {
    localStorage.setItem(HOTKEY_KEYMAP_STORAGE_KEY, JSON.stringify(keymap));
}
function loadStoredHotkeyKeymap() {
    const stored = localStorage.getItem(HOTKEY_KEYMAP_STORAGE_KEY);
    if (!stored) {
        return undefined;
    }
    try {
        const validation = validateHotkeyKeymap(JSON.parse(stored), allCommands);
        return validation.valid ? validation.keymap : undefined;
    }
    catch {
        return undefined;
    }
}
function loadHotkeyKeymap(value) {
    const validation = validateHotkeyKeymap(value, allCommands);
    const duplicates = validation.keymap
        ? duplicateSequences(validation.keymap)
        : validation.duplicateSequences;
    if (!validation.valid || !validation.keymap) {
        const duplicateSequence = duplicates[0]?.sequence;
        setKeymapWarning(duplicateSequence
            ? `Duplicate key sequence: ${duplicateSequence}`
            : (validation.error ?? "Invalid hotkey keymap."));
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
function createHotkeyKeymapFile() {
    activeHotkeyKeymap = blankHotkeyKeymap(allCommands);
    downloadHotkeyKeymapFile(activeHotkeyKeymap);
    hotkeyEditor.render();
    setKeymapWarning("");
    setKeymapStatus("Blank keymap created");
}
function updateHotkeyKeymapFile() {
    const summary = updateHotkeyKeymap(activeHotkeyKeymap, allCommands);
    activeHotkeyKeymap = summary.keymap;
    downloadHotkeyKeymapFile(activeHotkeyKeymap);
    hotkeyEditor.render();
    setKeymapWarning("");
    updateKeymapStatus(summary.added, summary.removed);
}
async function loadHotkeyKeymapFile() {
    const file = keymapFileInput?.files?.[0];
    if (!file) {
        return;
    }
    try {
        loadHotkeyKeymap(JSON.parse(await file.text()));
    }
    catch {
        setKeymapWarning("Keymap file must contain valid JSON.");
    }
    finally {
        if (keymapFileInput) {
            keymapFileInput.value = "";
        }
    }
}
function handleHotkeyKeydown(event) {
    if (!hotkeyFocusActive() || shouldIgnoreHotkeyTarget(event.target)) {
        return;
    }
    if (event.key === "Escape" && pendingHotkeySequence.length > 0) {
        event.preventDefault();
        clearPendingHotkeySequence();
        return;
    }
    const hadPendingSequence = pendingHotkeySequence.length > 0;
    const advance = advanceHotkeySequence(activeHotkeyKeymap, pendingHotkeySequence, keyTokenFromKeyboardEvent(event));
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
function isFocusHotkeysMessage(message) {
    return (typeof message === "object" &&
        message !== null &&
        "type" in message &&
        message.type === "focus-app-hotkeys");
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
    const button = event.target.closest("[role=tab]");
    const view = button?.textContent;
    if (view && dataLayerViews.includes(view))
        showDataLayerView(view, true);
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
liveValidationFilter?.addEventListener("change", () => {
    liveObserverState = setLiveFilter(liveObserverState, liveValidationFilter.value ? { kind: "validation state", value: liveValidationFilter.value } : undefined);
    renderLiveObserver();
});
copyPageUrlButton?.addEventListener("click", () => {
    void copyLivePageUrl();
});
saveLiveSessionButton?.addEventListener("click", () => {
    const completed = {
        id: `live-${Date.now()}`,
        pageScope: liveObserverState.pageUrl,
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        events: liveObserverState.events.map((event, index) => ({
            id: event.id,
            sourceId: event.sourceId,
            sourceName: event.sourceName ?? event.sourceId,
            name: event.name,
            payload: event.payload,
            rawInput: event.rawInput ?? event,
            pageUrl: event.pageUrl ?? liveObserverState.pageUrl,
            captureOrder: index + 1,
            provenance: event.provenance ?? {
                source: "live-observer",
                capturedAt: event.captureTime,
            },
        })),
        provenance: { source: "live-observer", capturedAt: new Date().toISOString() },
    };
    savedSessionLibrary = saveCompletedSession(savedSessionLibrary, completed, `Session ${savedSessionLibrary.sessions.length + 1}`);
    renderSavedSessions();
    setLiveSessionMessage("Saved session created");
});
savedSessionSearch?.addEventListener("input", renderSavedSessions);
eventTemplateSearch?.addEventListener("input", renderEventTemplateLibrary);
templateEmptyRecovery?.addEventListener("click", () => {
    if (eventTemplateSearch?.value.trim()) {
        eventTemplateSearch.value = "";
        renderEventTemplateLibrary();
    }
    else {
        showDataLayerView("Live");
    }
});
schemaSearch?.addEventListener("input", renderSchemas);
schemaSubviews.forEach((tab) => tab.addEventListener("click", () => showSchemaSubview(tab.getAttribute("aria-controls"))));
schemaEditorName?.addEventListener("input", () => { if (schemaDraft) {
    schemaDraft = { ...schemaDraft, name: schemaEditorName.value };
    renderSchemaDraft();
} });
schemaEditorTarget?.addEventListener("input", renderSchemaDraft);
schemaEditorParent?.addEventListener("change", () => { if (schemaDraft) {
    schemaDraft = withSchemaParent(schemaDraft, schemaEditorParent.value || undefined);
    renderSchemaDraft();
} });
schemaOnlyDeclaredProperties?.addEventListener("change", () => { if (schemaDraft) {
    const { additionalProperties: _previous, ...document } = schemaDraft.document;
    schemaDraft = { ...schemaDraft, document: schemaOnlyDeclaredProperties.checked ? { ...document, additionalProperties: false } : document };
    renderSchemaDraft();
} });
createSchemaButton?.addEventListener("click", openNewSchemaEditor);
addSchemaRuleButton?.addEventListener("click", () => {
    if (!schemaDraft)
        return;
    if (!Object.keys(schemaDraft.document.properties ?? {}).length) {
        selectedSchemaPropertyPath = "example";
        schemaDraft = { ...schemaDraft, document: defineSchemaProperty(schemaDraft.document, [selectedSchemaPropertyPath]) };
        renderSchemaDraft();
    }
    if (schemaResult)
        schemaResult.textContent = "Choose a property row, then attach a reusable rule from its menu.";
});
saveSchemaButton?.addEventListener("click", () => {
    if (!schemaDraft || saveSchemaButton.disabled)
        return;
    const draft = schemaDraft;
    if (schemaRevisionReview) {
        const existing = schemas.find((schema) => schema.name === draft.name);
        if (schemaRevisionReviewSummary)
            schemaRevisionReviewSummary.textContent = existing ? `${draft.name} will be saved as version ${existing.version + 1}; version ${existing.version} remains available.` : `${draft.name} will be created as version 1.`;
        schemaRevisionReview.hidden = false;
        schemaRevisionReview.showModal();
        return;
    }
    confirmSchemaRevisionButton?.click();
});
confirmSchemaRevisionButton?.addEventListener("click", () => {
    if (!schemaDraft)
        return;
    const draft = schemaDraft;
    const target = schemaEditorTarget?.value === "raw input" ? "raw input" : "payload";
    const existing = schemas.find((schema) => schema.name === draft.name);
    const candidate = { ...draft, id: existing?.id ?? createSchema(draft.name, 1, draft.document).id };
    const candidates = [...schemas.filter((schema) => schema.id !== candidate.id), candidate];
    const inheritanceError = schemaInheritanceError(candidate, candidates) ?? schemaInheritanceConflict(candidate, candidates);
    if (inheritanceError) {
        if (schemaResult)
            schemaResult.textContent = inheritanceError;
        return;
    }
    const saved = existing
        ? withSchemaParent({
            ...reviseSchema(existing, draft.document),
            assignments: draft.assignments,
            ...(draft.attachedRules ? { attachedRules: draft.attachedRules } : {}),
            ...(draft.inheritedRuleOverrides ? { inheritedRuleOverrides: draft.inheritedRuleOverrides } : {}),
        }, draft.parentSchemaId)
        : { ...draft, id: `schema:${draft.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}:1`, assignments: draft.assignments.length ? draft.assignments : [{ sourceId: "", eventName: "", target: target }] };
    schemas = existing ? schemas.map((schema) => schema.id === existing.id ? saved : schema.parentSchemaId === existing.id ? { ...schema, parentSchemaId: saved.id } : schema) : [...schemas, saved];
    persistSchemaLibrary();
    schemaDraft = undefined;
    renderSchemaDraft();
    renderSchemas();
    if (schemaResult)
        schemaResult.textContent = `Saved ${saved.name} version ${saved.version}.`;
    if (schemaRevisionReview?.open)
        schemaRevisionReview.close();
    if (schemaRevisionReview)
        schemaRevisionReview.hidden = true;
});
cancelSchemaRevisionButton?.addEventListener("click", () => { if (schemaRevisionReview?.open)
    schemaRevisionReview.close(); if (schemaRevisionReview)
    schemaRevisionReview.hidden = true; });
discardSchemaDraftButton?.addEventListener("click", () => { schemaDraft = undefined; renderSchemaDraft(); if (schemaCloseReview?.open)
    schemaCloseReview.close(); if (schemaCloseReview)
    schemaCloseReview.hidden = true; });
keepEditingSchemaButton?.addEventListener("click", () => { if (schemaCloseReview?.open)
    schemaCloseReview.close(); if (schemaCloseReview)
    schemaCloseReview.hidden = true; schemaEditorName?.focus({ preventScroll: true }); });
closeSchemaEditorButton?.addEventListener("click", () => { if (!schemaDraft)
    return; if (schemaCloseReviewSummary)
    schemaCloseReviewSummary.textContent = `Discard unsaved schema ${schemaDraft.name || "draft"}?`; if (schemaCloseReview) {
    schemaCloseReview.hidden = false;
    schemaCloseReview.showModal();
} });
saveAndCloseSchemaButton?.addEventListener("click", () => { saveSchemaButton?.click(); });
saveSchemaCloseReviewButton?.addEventListener("click", () => { if (schemaCloseReview?.open)
    schemaCloseReview.close(); if (schemaCloseReview)
    schemaCloseReview.hidden = true; saveSchemaButton?.click(); });
createSchemaRuleButton?.addEventListener("click", () => { editingReusableSchemaRuleId = undefined; schemaRuleAttachments?.replaceChildren(...schemas.map((schema) => Object.assign(document.createElement("option"), { value: schema.id, textContent: `${schema.name} v${schema.version}` }))); if (schemaRuleEditor)
    schemaRuleEditor.hidden = false; schemaRuleName?.focus({ preventScroll: true }); });
let pendingRuleSnapshotMetadata;
saveSchemaRuleButton?.addEventListener("pointerdown", () => { if (editingReusableSchemaRuleId) {
    const previous = reusableSchemaRules.find((candidate) => candidate.id === editingReusableSchemaRuleId);
    if (previous)
        pendingRuleSnapshotMetadata = { id: previous.id, ...(previous.severity ? { severity: previous.severity } : {}), ...(previous.message ? { message: previous.message } : {}) };
} });
schemaRuleEditor?.addEventListener("click", (event) => { if (event.target.id === "schema-rule-save" && editingReusableSchemaRuleId) {
    const previous = reusableSchemaRules.find((candidate) => candidate.id === editingReusableSchemaRuleId);
    if (previous)
        pendingRuleSnapshotMetadata = { id: previous.id, ...(previous.severity ? { severity: previous.severity } : {}), ...(previous.message ? { message: previous.message } : {}) };
} });
saveSchemaRuleButton?.addEventListener("click", () => { const name = schemaRuleName?.value.trim(); if (!name)
    return; const parameters = schemaRuleParameters?.value.trim(); const operator = schemaRuleOperator?.value; const severity = schemaRuleSeverity?.value; const message = schemaRuleMessage?.value.trim(); const examples = schemaRuleExamples?.value.trim(); const metadata = [schemaRuleTypes?.value, operator, severity, message, examples].filter(Boolean).join(" · "); const previous = reusableSchemaRules.find((candidate) => candidate.id === editingReusableSchemaRuleId); const rule = { id: editingReusableSchemaRuleId ?? `rule:${crypto.randomUUID()}`, name, kind: `${document.querySelector("#schema-rule-kind")?.value ?? "Required"}${parameters ? ` (${parameters})` : ""}${metadata ? ` · ${metadata}` : ""}`, version: (previous?.version ?? 0) + 1, enabled: previous?.enabled ?? true, ...(operator ? { operator } : {}), ...(parameters ? { parameters } : {}), ...(severity ? { severity } : {}), ...(message ? { message } : {}), ...(examples ? { examples } : {}), attachments: Array.from(schemaRuleAttachments?.selectedOptions ?? []).map((option) => option.value), ...(previous ? { revisionHistory: [...(previous.revisionHistory ?? []), { name: previous.name, kind: previous.kind, version: previous.version ?? 1, ...(previous.enabled === false ? { enabled: false } : {}) }] } : {}) }; reusableSchemaRules = editingReusableSchemaRuleId ? reusableSchemaRules.map((candidate) => candidate.id === editingReusableSchemaRuleId ? rule : candidate) : [...reusableSchemaRules, rule]; if (!previous || updateSchemaRuleAttachments?.checked)
    schemas = schemas.map((schema) => { const { attachedRules: _attachedRules, ...withoutAttachments } = schema; const attached = [...(schema.attachedRules ?? []).filter((item) => item.id !== rule.id), ...(rule.attachments?.includes(schema.id) ? [{ id: rule.id, name: rule.name, version: rule.version ?? 1, ...(operator ? { operator } : {}), ...(parameters ? { parameters } : {}), ...(severity ? { severity } : {}), ...(message ? { message } : {}), enabled: rule.enabled !== false }] : [])]; return attached.length ? { ...withoutAttachments, attachedRules: attached } : withoutAttachments; }); editingReusableSchemaRuleId = undefined; localStorage.setItem(SCHEMA_RULE_STORAGE_KEY, JSON.stringify(reusableSchemaRules)); persistSchemaLibrary(); renderSchemaWorkflowRows(); if (schemaResult)
    schemaResult.textContent = `Saved reusable rule ${name}.`; if (schemaRuleEditor)
    schemaRuleEditor.hidden = true; });
saveSchemaRuleButton?.addEventListener("click", () => { if (!pendingRuleSnapshotMetadata)
    return; reusableSchemaRules = reusableSchemaRules.map((rule) => rule.id === pendingRuleSnapshotMetadata?.id && rule.revisionHistory?.length ? { ...rule, revisionHistory: rule.revisionHistory.map((snapshot, index) => index === rule.revisionHistory.length - 1 ? { ...snapshot, ...(pendingRuleSnapshotMetadata?.severity ? { severity: pendingRuleSnapshotMetadata.severity } : {}), ...(pendingRuleSnapshotMetadata?.message ? { message: pendingRuleSnapshotMetadata.message } : {}) } : snapshot) } : rule); localStorage.setItem(SCHEMA_RULE_STORAGE_KEY, JSON.stringify(reusableSchemaRules)); pendingRuleSnapshotMetadata = undefined; });
saveSchemaRuleButton?.addEventListener("click", (event) => {
    const previous = reusableSchemaRules.find((rule) => rule.id === editingReusableSchemaRuleId);
    if (!previous)
        return;
    if (updateSchemaRuleAttachments?.checked && approvedRuleAttachmentUpdateId !== previous.id) {
        event.stopImmediatePropagation();
        if (schemaRuleUpgradeReviewSummary)
            schemaRuleUpgradeReviewSummary.textContent = `Confirm updating pinned attachments for ${previous.name} v${previous.version ?? 1}.`;
        if (schemaRuleUpgradeReview && !schemaRuleUpgradeReview.open) {
            schemaRuleUpgradeReview.hidden = false;
            schemaRuleUpgradeReview.showModal();
        }
        return;
    }
    if (approvedRuleRevisionId === previous.id) {
        approvedRuleRevisionId = undefined;
        return;
    }
    event.stopImmediatePropagation();
    const nextName = schemaRuleName?.value.trim() || previous.name;
    const nextParameters = schemaRuleParameters?.value.trim() ?? previous.parameters ?? "";
    const nextExamples = schemaRuleExamples?.value.trim() ?? previous.examples ?? "";
    schemaRuleRevisionReviewSummary.textContent = `${previous.name} v${previous.version ?? 1} will become ${nextName} v${(previous.version ?? 0) + 1}; parameters ${previous.parameters ?? "none"} → ${nextParameters || "none"}; examples ${previous.examples ?? "none"} → ${nextExamples || "none"}.`;
    schemaRuleRevisionReview.showModal();
}, true);
confirmSchemaRuleRevisionButton.addEventListener("click", () => {
    if (!editingReusableSchemaRuleId)
        return;
    approvedRuleRevisionId = editingReusableSchemaRuleId;
    schemaRuleRevisionReview.close();
    saveSchemaRuleButton?.click();
});
cancelSchemaRuleRevisionButton.addEventListener("click", () => schemaRuleRevisionReview.close());
schemaRuleSearch?.addEventListener("input", renderSchemaWorkflowRows);
updateSchemaRuleAttachments?.addEventListener("change", () => { approvedRuleAttachmentUpdateId = undefined; if (updateSchemaRuleAttachments.checked && schemaRuleUpgradeReview) {
    const affected = Array.from(schemaRuleAttachments?.selectedOptions ?? []).map((option) => { const schema = schemas.find((candidate) => candidate.id === option.value); const pinned = schema?.attachedRules?.find((rule) => rule.id === editingReusableSchemaRuleId)?.version; return `${option.textContent}${pinned ? ` (pinned v${pinned})` : " (new attachment)"}`; });
    if (schemaRuleUpgradeReviewSummary)
        schemaRuleUpgradeReviewSummary.textContent = affected.length ? `Saving will update: ${affected.join(", ")}.` : "Saving will remove this rule from all selected schema attachments.";
    schemaRuleUpgradeReview.hidden = false;
    schemaRuleUpgradeReview.showModal();
} });
confirmSchemaRuleUpgradeButton?.addEventListener("click", () => { approvedRuleAttachmentUpdateId = editingReusableSchemaRuleId; if (schemaRuleUpgradeReview?.open)
    schemaRuleUpgradeReview.close(); if (schemaRuleUpgradeReview)
    schemaRuleUpgradeReview.hidden = true; });
cancelSchemaRuleUpgradeButton?.addEventListener("click", () => { if (updateSchemaRuleAttachments)
    updateSchemaRuleAttachments.checked = false; if (schemaRuleUpgradeReview?.open)
    schemaRuleUpgradeReview.close(); if (schemaRuleUpgradeReview)
    schemaRuleUpgradeReview.hidden = true; });
exportSchemaRulesButton?.addEventListener("click", () => { const blob = new Blob([`${JSON.stringify(reusableSchemaRules, null, 2)}\n`], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "schema-rules.json"; link.click(); URL.revokeObjectURL(url); });
confirmSchemaRuleDeleteButton?.addEventListener("click", () => { if (!pendingReusableSchemaRuleDeletionId)
    return; reusableSchemaRules = reusableSchemaRules.filter((rule) => rule.id !== pendingReusableSchemaRuleDeletionId); pendingReusableSchemaRuleDeletionId = undefined; localStorage.setItem(SCHEMA_RULE_STORAGE_KEY, JSON.stringify(reusableSchemaRules)); renderSchemaWorkflowRows(); if (schemaRuleDeleteReview?.open)
    schemaRuleDeleteReview.close(); if (schemaRuleDeleteReview)
    schemaRuleDeleteReview.hidden = true; });
cancelSchemaRuleDeleteButton?.addEventListener("click", () => { pendingReusableSchemaRuleDeletionId = undefined; if (schemaRuleDeleteReview?.open)
    schemaRuleDeleteReview.close(); if (schemaRuleDeleteReview)
    schemaRuleDeleteReview.hidden = true; });
createSchemaAssignmentButton?.addEventListener("click", () => { if (schemaAssignmentEditor)
    schemaAssignmentEditor.hidden = false; schemaAssignmentSource?.focus({ preventScroll: true }); });
saveSchemaAssignmentButton?.addEventListener("click", () => {
    const schema = schemas.find((candidate) => candidate.id === schemaAssignmentSchema?.value) ?? schemas[0];
    if (!schema)
        return;
    const sourceId = schemaAssignmentSource?.value.trim() || "event-history";
    const eventName = schemaAssignmentEvent?.value.trim() || "page_view";
    const priority = Number(schemaAssignmentPriority?.value ?? 10);
    const target = schemaAssignmentTarget?.value === "raw input" ? "raw input" : "payload";
    const domainCondition = schemaAssignmentDomain?.value.trim();
    const pathnameCondition = schemaAssignmentPathname?.value.trim();
    const next = { sourceId, eventName, target, id: editingSchemaAssignment?.assignmentId ?? `assignment:${schema.id}:${eventName}`, name: `${schema.name} automatic`, priority, ...(domainCondition ? { domainCondition } : {}), ...(pathnameCondition ? { pathnameCondition } : {}), versionPolicy: schemaAssignmentVersionPolicy?.value === "follow latest" ? "follow latest" : "pinned", enabled: schemaAssignmentEnabled?.checked ?? true };
    schemas = schemas.map((candidate) => candidate.id === schema.id ? { ...candidate, assignments: editingSchemaAssignment?.schemaId === schema.id ? candidate.assignments.map((assignment) => assignment.id === editingSchemaAssignment?.assignmentId ? next : assignment) : [...candidate.assignments, next] } : candidate);
    editingSchemaAssignment = undefined;
    persistSchemaLibrary();
    renderSchemas();
    renderSchemaWorkflowRows();
    if (schemaAssignmentEditor)
        schemaAssignmentEditor.hidden = true;
});
importSchemaButton?.addEventListener("click", () => schemaLibraryImportFile?.click());
schemaLibraryImportFile?.addEventListener("change", async () => {
    const file = schemaLibraryImportFile.files?.[0];
    if (!file)
        return;
    try {
        const archive = JSON.parse(await file.text());
        if (archive.version !== 1 || !Array.isArray(archive.schemas) || !Array.isArray(archive.rules))
            throw new Error("Choose a version 1 Schema Library export.");
        const importedSchemas = archive.schemas.map((schema) => importSchema(JSON.stringify(schema)));
        const candidates = [...schemas.filter((schema) => !importedSchemas.some((item) => item.id === schema.id)), ...importedSchemas];
        for (const schema of importedSchemas) {
            const issue = schemaInheritanceError(schema, candidates) ?? schemaInheritanceConflict(schema, candidates);
            if (issue)
                throw new Error(issue);
        }
        pendingSchemaImport = { schemas: importedSchemas, rules: archive.rules };
        if (schemaImportReviewSummary)
            schemaImportReviewSummary.textContent = `${importedSchemas.length} schemas and ${pendingSchemaImport.rules.length} reusable rules are ready to import.`;
        if (schemaImportReview) {
            schemaImportReview.hidden = false;
            schemaImportReview.showModal();
        }
    }
    catch (error) {
        if (schemaResult)
            schemaResult.textContent = error instanceof Error ? error.message : "Schema Library import failed.";
    }
    schemaLibraryImportFile.value = "";
});
exportSchemaButton?.addEventListener("click", () => { const blob = new Blob([serializeSchemaLibraryExport(schemas, reusableSchemaRules)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "schema-library-v1.json"; link.click(); URL.revokeObjectURL(url); if (schemaResult)
    schemaResult.textContent = `Exported ${schemas.length} schemas and ${reusableSchemaRules.length} rules.`; });
recheckSchemaValidationButton?.addEventListener("click", recheckCapturedSchemaValidation);
replaceSchemaLibraryButton?.addEventListener("click", () => { if (!pendingSchemaImport)
    return; schemas = pendingSchemaImport.schemas; reusableSchemaRules = pendingSchemaImport.rules; pendingSchemaImport = undefined; persistSchemaLibrary(); localStorage.setItem(SCHEMA_RULE_STORAGE_KEY, JSON.stringify(reusableSchemaRules)); renderSchemas(); renderSchemaWorkflowRows(); if (schemaImportReview?.open)
    schemaImportReview.close(); if (schemaImportReview)
    schemaImportReview.hidden = true; if (schemaResult)
    schemaResult.textContent = "Schema Library replaced."; });
appendSchemaLibraryButton?.addEventListener("click", () => { if (!pendingSchemaImport)
    return; schemas = [...schemas.filter((schema) => !pendingSchemaImport.schemas.some((item) => item.id === schema.id)), ...pendingSchemaImport.schemas]; reusableSchemaRules = [...reusableSchemaRules.filter((rule) => !pendingSchemaImport.rules.some((item) => item.id === rule.id)), ...pendingSchemaImport.rules]; pendingSchemaImport = undefined; persistSchemaLibrary(); localStorage.setItem(SCHEMA_RULE_STORAGE_KEY, JSON.stringify(reusableSchemaRules)); renderSchemas(); renderSchemaWorkflowRows(); if (schemaImportReview?.open)
    schemaImportReview.close(); if (schemaImportReview)
    schemaImportReview.hidden = true; if (schemaResult)
    schemaResult.textContent = "Schema Library appended."; });
cancelSchemaImportButton?.addEventListener("click", () => { pendingSchemaImport = undefined; if (schemaImportReview?.open)
    schemaImportReview.close(); if (schemaImportReview)
    schemaImportReview.hidden = true; });
confirmSchemaDeleteButton?.addEventListener("click", () => { const schema = pendingSchemaDeletion; if (!schema)
    return; schemas = schemas.filter(({ id }) => id !== schema.id); pendingSchemaDeletion = undefined; persistSchemaLibrary(); renderSchemas(); if (schemaDeleteReview?.open)
    schemaDeleteReview.close(); if (schemaDeleteReview)
    schemaDeleteReview.hidden = true; if (schemaResult)
    schemaResult.textContent = `Deleted ${schema.name}.`; });
cancelSchemaDeleteButton?.addEventListener("click", () => { pendingSchemaDeletion = undefined; if (schemaDeleteReview?.open)
    schemaDeleteReview.close(); if (schemaDeleteReview)
    schemaDeleteReview.hidden = true; });
addNewButton?.addEventListener("click", openNewEventEditor);
exportEventLibraryButton?.addEventListener("click", downloadEventLibrary);
importEventLibraryButton?.addEventListener("click", () => eventLibraryFile?.click());
eventLibraryFile?.addEventListener("change", () => { void reviewEventLibraryImport(); });
replaceEventLibraryButton?.addEventListener("click", () => {
    if (!pendingEventLibraryImport)
        return;
    if (!replaceEventLibraryArmed) {
        replaceEventLibraryArmed = true;
        replaceEventLibraryButton.textContent = `Confirm replace ${eventTemplates.length} with ${pendingEventLibraryImport.templates.length}`;
        if (eventLibraryImportReviewSummary)
            eventLibraryImportReviewSummary.textContent = `${eventTemplates.length} current templates will be removed and ${pendingEventLibraryImport.templates.length} imported templates will be added.`;
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
    if (!propertyEditorState)
        return;
    setEventLibraryResult(eventLibraryEditorElements, "");
    propertyEditorState = updateDraftJson(propertyEditorState, eventTemplateJson.value);
    renderEventTemplateLibrary();
    refreshLibraryDraftValidation();
});
eventTemplatePushDestination?.addEventListener("input", () => {
    if (!propertyEditorState)
        return;
    setEventLibraryResult(eventLibraryEditorElements, "");
    propertyEditorState = setPushDestination(propertyEditorState, eventTemplatePushDestination.value);
    setPushDestinationValidation(eventLibraryEditorElements, "");
    renderEventTemplateLibrary();
});
templateRenameName?.addEventListener("input", () => {
    if (!pendingTemplateRename)
        return;
    pendingTemplateRename.draft = {
        ...pendingTemplateRename.draft,
        templateName: templateRenameName.value,
    };
    renderTemplateRenameValidation();
});
templateRenameEventName?.addEventListener("input", () => {
    if (!pendingTemplateRename)
        return;
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
    if (!propertyEditorState)
        return;
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
    }
    catch (error) {
        setEventLibraryValidation(eventLibraryEditorElements, error instanceof Error ? error.message : "Draft is invalid.");
    }
});
saveTemplateCopyButton?.addEventListener("click", () => {
    if (!propertyEditorState)
        return;
    try {
        const copy = saveAsTemplateCopy(propertyEditorState, `${propertyEditorState.template.name} copy`);
        eventTemplates = [...eventTemplates, copy];
        persistEventTemplateLibrary();
        setEventLibraryResult(eventLibraryEditorElements, `Saved ${copy.name} as a distinct template.`);
        renderEventTemplateLibrary();
    }
    catch (error) {
        setEventLibraryValidation(eventLibraryEditorElements, error instanceof Error ? error.message : "Draft is invalid.");
    }
});
pushTemplateDraftButton?.addEventListener("click", () => {
    openPushDraftReview();
});
confirmPushDraftButton?.addEventListener("click", () => {
    const review = pendingPushDraftReview;
    pendingPushDraftReview = undefined;
    closePushReview({ dialog: pushDraftReview, heading: pushDraftReviewHeading, trigger: pushTemplateDraftButton }, false);
    if (review)
        void pushCurrentTemplateDraft(review.editor, review.target);
});
cancelPushDraftButton?.addEventListener("click", () => {
    pendingPushDraftReview = undefined;
    closePushReview({ dialog: pushDraftReview, heading: pushDraftReviewHeading, trigger: pushTemplateDraftButton });
});
confirmRevisionChangeButton?.addEventListener("click", commitRevisionChangeReview);
cancelRevisionChangeButton?.addEventListener("click", closeRevisionChangeReview);
revisionChangeReview?.addEventListener("cancel", (event) => { event.preventDefault(); closeRevisionChangeReview(); });
pushDraftReview?.addEventListener("keydown", (event) => {
    if (event.key === "Escape")
        pendingPushDraftReview = undefined;
    handlePushReviewKeydown({ dialog: pushDraftReview, heading: pushDraftReviewHeading, trigger: pushTemplateDraftButton }, event);
});
discardTemplateDraftButton?.addEventListener("click", () => {
    if (!propertyEditorState)
        return;
    propertyEditorState = discardDraft(propertyEditorState);
    setEventLibraryResult(eventLibraryEditorElements, "Draft discarded.");
    renderEventTemplateLibrary();
});
closeTemplateEditorButton?.addEventListener("click", () => {
    if (!propertyEditorState?.dirty) {
        closeTemplateEditor();
        return;
    }
    if (propertyEditorState.isNew) {
        if (saveAndCloseTemplateButton)
            saveAndCloseTemplateButton.textContent = "Save new event";
        if (discardAndCloseTemplateButton)
            discardAndCloseTemplateButton.textContent = "Discard new event";
    }
    if (closeTemplateEditorSummary)
        closeTemplateEditorSummary.textContent = `Unsaved changes: ${Object.keys(propertyEditorState.draft).join(", ")}.`;
    if (closeTemplateEditorConfirmation)
        closeTemplateEditorConfirmation.hidden = false;
});
keepEditingTemplateButton?.addEventListener("click", () => { if (closeTemplateEditorConfirmation)
    closeTemplateEditorConfirmation.hidden = true; });
saveAndCloseTemplateButton?.addEventListener("click", () => {
    if (!propertyEditorState)
        return;
    try {
        if (propertyEditorState.isNew) {
            const template = saveNewEvent(propertyEditorState, () => `template:library:${crypto.randomUUID()}`);
            eventTemplates = [...eventTemplates, template];
            persistEventTemplateLibrary();
            closeTemplateEditor();
            return;
        }
        propertyEditorState = saveDraftRevision(propertyEditorState);
        eventTemplates = eventTemplates.map((template) => template.id === propertyEditorState?.template.id ? propertyEditorState.template : template);
        persistEventTemplateLibrary();
        closeTemplateEditor();
    }
    catch (error) {
        setEventLibraryValidation(eventLibraryEditorElements, error instanceof Error ? error.message : "Draft is invalid.");
    }
});
discardAndCloseTemplateButton?.addEventListener("click", () => closeTemplateEditor());
backToCapturedEventButton?.addEventListener("click", () => {
    const eventId = propertyEditorState?.template.originatingEventId;
    if (!eventId)
        return;
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
    if (savedSessionConfirmation)
        savedSessionConfirmation.textContent = "";
    cancelSavedSessionDeleteButton.hidden = true;
    if (confirmSavedSessionDeleteButton)
        confirmSavedSessionDeleteButton.hidden = true;
    renderSavedSessions();
});
confirmSavedSessionDeleteButton?.addEventListener("click", () => {
    savedSessionLibrary = confirmSavedSessionDeletion(savedSessionLibrary);
    if (savedSessionConfirmation)
        savedSessionConfirmation.textContent = "Saved session deleted.";
    confirmSavedSessionDeleteButton.hidden = true;
    if (cancelSavedSessionDeleteButton)
        cancelSavedSessionDeleteButton.hidden = true;
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
        dataLayerObserverState = attachHistoryArrayObserver(dataLayerObserverState, observation);
        updateSessionFromObserverState();
        persistAndRenderSessionState();
        restartLiveHistoryCaptureIfActive(observation);
        renderObserverState();
    },
});
function refreshSelectedTargetPathStatus() {
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
        if (!observation)
            return;
        dataLayerObserverState = restartObservation(dataLayerSessionState, dataLayerObserverState, observation);
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
observationTargetSearch?.addEventListener("keydown", (event) => handleObservationTargetSearchKeydown(observationTargetElements, event));
observationTargetList?.addEventListener("keydown", (event) => handleObservationTargetListKeydown(observationTargetElements, event));
observationTargetPicker?.addEventListener("keydown", (event) => handleObservationTargetDialogKeydown(observationTargetElements, event));
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
    chrome.runtime.onMessage.addListener((message) => {
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
                observationTargetState = navigateObservationTarget(observationTargetState, tabId, changeInfo.url);
                const updated = observationTargetState.targets.find((target) => target.tabId === tabId);
                if (updated && tab.title) {
                    observationTargetState = registerObservationTarget(observationTargetState, { ...updated, title: tab.title });
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
                dataLayerSessionState = navigateSession(dataLayerSessionState, changeInfo.url);
                persistAndRenderSessionState();
            }
        }
        if (changeInfo.status === "complete") {
            const pageUrl = tab.url ??
                changeInfo.url ??
                dataLayerSessionState.session?.currentUrl ??
                globalThis.location.href;
            refreshObservationAfterPageLoad(tabId, pageUrl, observationRefreshState.observedPageLoadSequence);
        }
    });
}
if (typeof chrome !== "undefined" && chrome.tabs?.onRemoved) {
    chrome.tabs.onRemoved.addListener((tabId) => {
        const target = observationTargetState.targets.find((candidate) => candidate.tabId === tabId);
        if (!target)
            return;
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
void recoverAttachedObservationTarget();
renderSessionState();
renderObserverState();
showWorkspace(workspaceTabsController.activeTab());
hotkeyEditor.render();
showDataLayerView("Live");
renderLiveObserver();
renderSavedSessions();
renderEventTemplateLibrary();
renderSchemas();
renderSchemaWorkflowRows();
renderSchemaValidationRecords();
renderSequences();
activateHotkeyFocus();
export { DATA_LAYER_SESSION_STORAGE_KEY, HOTKEY_KEYMAP_STORAGE_KEY, navigateSession, sessionScope, };
//# sourceMappingURL=side-panel.js.map