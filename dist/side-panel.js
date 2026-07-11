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
import { createLiveObserverState, closeLiveInspector, dataLayerViewForNavigationKey, dataLayerViews, pauseCapture, recordLiveEvent, resumeCapture, selectLiveEvent, } from "./data-layer-live-observer.js";
import { confirmSavedSessionDeletion, cancelSavedSessionDeletion, createSavedSessionLibrary, exportSavedSession, importSavedSession, openSavedSession, requestSavedSessionDeletion, renameSavedSession, resumeSavedSession, saveCompletedSession, searchSavedSessions, savedSessionSummary, } from "./data-layer-saved-sessions.js";
import { findLiveObserverElements, renderDataLayerView, renderLiveInspector, renderLiveObserverState, renderLiveSessionMessage, updateLiveInspectorValidation, } from "./data-layer-live-observer-ui.js";
import { createLiveInspectorActions } from "./data-layer-live-inspector-actions.js";
import { captureInspectorReturn, restoreInspectorReturn, } from "./data-layer-live-inspector-return.js";
import { restoreInspectorReturnUi } from "./data-layer-live-inspector-return-ui.js";
import { createEditableTemplate, discardDraft, openPropertyEditor, saveAsTemplateCopy, saveDraftRevision, searchEventTemplates, restoreEventTemplateLibrary, serializeEventTemplateLibrary, setPushDestination, updateDraftJson, EVENT_TEMPLATE_LIBRARY_STORAGE_KEY, } from "./data-layer-event-library-editor.js";
import { createSchema, duplicateSchema, exportSchema, importSchema, reviseSchema, searchSchemas, validateEvent } from "./data-layer-schema-verification.js";
import { createSequence, readiness, runSequence } from "./data-layer-sequence-replay.js";
import { findSequenceReplayElements, renderSequenceReplay, setSequenceReplayResult, } from "./data-layer-sequence-replay-ui.js";
import { findEventLibraryEditorElements, renderEventLibraryEditor, setEventLibraryResult, setEventLibraryValidation, setPushDestinationValidation, } from "./data-layer-event-library-editor-ui.js";
import { pushTemplateToSelectedTarget, } from "./data-layer-selected-target-push.js";
import { createPushDraftReview, } from "./data-layer-push-draft-review.js";
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
const liveEventsEmptyState = document.querySelector("#live-events-empty-state");
const liveSourceErrorState = document.querySelector("#live-source-error-state");
const templateEmptyStateElements = findPanelEmptyStateElements("#event-template-empty-state", "#event-template-empty-recovery");
const templateEmptyRecovery = templateEmptyStateElements.recovery;
const savedSessionEmptyState = document.querySelector("#saved-session-empty-state");
const schemaEmptyState = document.querySelector("#schema-empty-state");
const sequenceEmptyState = document.querySelector("#sequence-empty-state");
const { search: eventTemplateSearch, saveLatestButton: saveLatestTemplateButton, json: eventTemplateJson, pushDestination: eventTemplatePushDestination, saveRevisionButton: saveTemplateRevisionButton, saveCopyButton: saveTemplateCopyButton, pushDraftButton: pushTemplateDraftButton, discardDraftButton: discardTemplateDraftButton, closeEditorButton: closeTemplateEditorButton, backToCapturedEventButton, } = eventLibraryEditorElements;
const schemaSearch = document.querySelector("#schema-search");
const pushDraftReview = document.querySelector("#push-draft-review");
const pushDraftReviewSummary = document.querySelector("#push-draft-review-summary");
const confirmPushDraftButton = document.querySelector("#confirm-push-draft");
const cancelPushDraftButton = document.querySelector("#cancel-push-draft");
const createSchemaButton = document.querySelector("#create-schema");
const importSchemaButton = document.querySelector("#import-schema");
const exportSchemaButton = document.querySelector("#export-schema");
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
let savedInspectorTemplateId;
let schemas = [];
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
    const split = globalThis.innerWidth >= 800;
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
            validationAvailable: (selected) => Boolean(validateEvent({
                sourceId: selected.sourceId,
                eventName: selected.name,
                payload: selected.payload,
                rawInput: selected.rawInput,
            }, schemas).schema),
            validationState: (selected) => validateEvent({
                sourceId: selected.sourceId,
                eventName: selected.name,
                payload: selected.payload,
                rawInput: selected.rawInput,
            }, schemas).state,
            updateValidation: (selectedId, validation) => {
                liveObserverState = { ...liveObserverState, events: liveObserverState.events.map((candidate) => candidate.id === selectedId ? { ...candidate, validation } : candidate) };
                renderLiveObserver();
                updateLiveInspectorValidation(liveObserverElements, validation);
            },
        }));
    renderLiveObserver();
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
    renderEventLibraryEditor(eventLibraryEditorElements, templates, propertyEditorState, {
        edit: openTemplateEditor,
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
    });
}
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
            item.textContent = `${schema.name} v${schema.version}: ${schema.assignments.map((assignment) => `${assignment.sourceId}/${assignment.eventName}/${assignment.target}`).join(", ") || "unassigned"}. `;
            revise.type = duplicate.type = remove.type = "button";
            revise.textContent = "Edit as new version";
            duplicate.textContent = "Duplicate";
            remove.textContent = "Delete";
            revise.addEventListener("click", () => { const next = reviseSchema(schema, schema.document); schemas = [...schemas.filter(({ id }) => id !== schema.id), next]; renderSchemas(); });
            duplicate.addEventListener("click", () => { schemas = [...schemas, duplicateSchema(schema, `${schema.name} copy`)]; renderSchemas(); });
            remove.addEventListener("click", () => { schemas = schemas.filter(({ id }) => id !== schema.id); renderSchemas(); });
            item.append(revise, duplicate, remove);
            return item;
        }));
}
function persistEventTemplateLibrary() {
    localStorage.setItem(EVENT_TEMPLATE_LIBRARY_STORAGE_KEY, serializeEventTemplateLibrary(eventTemplates));
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
function openTemplateEditor(template) {
    propertyEditorState = openPropertyEditor(template);
    setEventLibraryResult(eventLibraryEditorElements, "");
    renderEventTemplateLibrary();
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
    if (pushDraftReviewSummary)
        pushDraftReviewSummary.textContent = pendingPushDraftReview.summary;
    if (confirmPushDraftButton)
        confirmPushDraftButton.textContent = pendingPushDraftReview.confirmLabel;
    if (pushDraftReview)
        pushDraftReview.hidden = false;
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
createSchemaButton?.addEventListener("click", () => { const schema = createSchema(`Schema ${schemas.length + 1}`, 1, { type: "object" }); schemas = [...schemas, schema]; if (schemaResult)
    schemaResult.textContent = `Created ${schema.name}.`; renderSchemas(); });
importSchemaButton?.addEventListener("click", () => { const serialized = globalThis.prompt("Paste schema JSON"); if (!serialized)
    return; try {
    schemas = [...schemas, importSchema(serialized)];
    renderSchemas();
}
catch {
    if (schemaResult)
        schemaResult.textContent = "Schema import must contain valid JSON.";
} });
exportSchemaButton?.addEventListener("click", () => { const schema = schemas[0]; if (schemaResult)
    schemaResult.textContent = schema ? exportSchema(schema) : "No schema to export."; });
saveLatestTemplateButton?.addEventListener("click", () => {
    const event = liveObserverState.events.at(-1);
    if (!event) {
        setEventLibraryResult(eventLibraryEditorElements, "Capture an event before saving a template.");
        return;
    }
    const source = liveObserverState.sources.find(({ id }) => id === event.sourceId);
    const template = createEditableTemplate({
        id: event.id,
        sessionId: event.sessionId ?? `live:${liveObserverState.pageUrl}`,
        sourceId: event.sourceId,
        sourceKind: event.sourceKind ?? "page",
        name: event.name,
        captureTime: event.captureTime,
        pageUrl: event.pageUrl ?? liveObserverState.pageUrl,
        payload: event.payload,
        rawInput: event.rawInput ?? event,
        validation: event.validation ?? "Not checked",
        provenance: event.provenance ?? `captured:${event.sourceId}`,
    }, {
        name: event.name,
        destination: "event.history",
        sourceName: source?.name ?? event.sourceId,
    });
    eventTemplates = [...eventTemplates, template];
    persistEventTemplateLibrary();
    setEventLibraryResult(eventLibraryEditorElements, `Saved ${template.name} to Library.`);
    renderEventTemplateLibrary();
});
eventTemplateJson?.addEventListener("input", () => {
    if (!propertyEditorState)
        return;
    setEventLibraryResult(eventLibraryEditorElements, "");
    propertyEditorState = updateDraftJson(propertyEditorState, eventTemplateJson.value);
    renderEventTemplateLibrary();
});
eventTemplatePushDestination?.addEventListener("input", () => {
    if (!propertyEditorState)
        return;
    setEventLibraryResult(eventLibraryEditorElements, "");
    propertyEditorState = setPushDestination(propertyEditorState, eventTemplatePushDestination.value);
    setPushDestinationValidation(eventLibraryEditorElements, "");
    renderEventTemplateLibrary();
});
saveTemplateRevisionButton?.addEventListener("click", () => {
    if (!propertyEditorState)
        return;
    try {
        propertyEditorState = saveDraftRevision(propertyEditorState);
        eventTemplates = eventTemplates.map((template) => template.id === propertyEditorState?.template.id ? propertyEditorState.template : template);
        persistEventTemplateLibrary();
        setEventLibraryResult(eventLibraryEditorElements, `Saved ${propertyEditorState.template.name} as version ${propertyEditorState.template.version}.`);
        renderEventTemplateLibrary();
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
    if (pushDraftReview)
        pushDraftReview.hidden = true;
    if (review)
        void pushCurrentTemplateDraft(review.editor, review.target);
});
cancelPushDraftButton?.addEventListener("click", () => {
    pendingPushDraftReview = undefined;
    if (pushDraftReview)
        pushDraftReview.hidden = true;
});
discardTemplateDraftButton?.addEventListener("click", () => {
    if (!propertyEditorState)
        return;
    propertyEditorState = discardDraft(propertyEditorState);
    setEventLibraryResult(eventLibraryEditorElements, "Draft discarded.");
    renderEventTemplateLibrary();
});
closeTemplateEditorButton?.addEventListener("click", () => {
    propertyEditorState = undefined;
    setEventLibraryResult(eventLibraryEditorElements, "");
    renderEventTemplateLibrary();
});
backToCapturedEventButton?.addEventListener("click", () => {
    const eventId = propertyEditorState?.template.originatingEventId;
    if (!eventId)
        return;
    showDataLayerView("Live");
    openLiveInspector(eventId);
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
renderSequences();
activateHotkeyFocus();
export { DATA_LAYER_SESSION_STORAGE_KEY, HOTKEY_KEYMAP_STORAGE_KEY, navigateSession, sessionScope, };
//# sourceMappingURL=side-panel.js.map