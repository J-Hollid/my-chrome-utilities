import { appendObservedHistoryEntry, attachHistoryArraySnapshot, beginDataLayerTestingSession, beginObservedPageLoad, captureEntry, canonicalLiveObserverStatus, createLiveSessionSummary, createLiveNotificationController, findLiveGuidedWorkflowElements, findLiveSessionSummaryElements, findObservationTargetElements, findObservationTargets, handleObservationTargetDialogKeydown, handleObservationTargetListKeydown, handleObservationTargetSearchKeydown, createObservationTarget, createObservationTargetState, restoreAttachedObservationTarget, registerObservationTarget, refreshDiscoveredObservationTargets, selectObservationTarget, selectedObservationTarget, attachedObservationTarget, attachSelectedObservationTarget, updateObservationTargetAccess, initialObservationActivationState, initialObservationRefreshState, markObservationRefreshPageEntryCaptured, liveGuidedWorkflow, navigateObservationTarget, navigateSession, nextObservationActivation, nextObservationRefreshAttempt, observationActivationIsCurrent, observationRefreshDelay, observationRefreshRequestForPageLoad, observationRefreshRequestIsCurrent, observerAttachmentStatus, persistSession, restartObservation as restartHistoryObservation, restoreSession, samplePageObject, shouldRetryObservationRefresh, stopHistoryArrayObserver, renderLiveGuidedWorkflow, renderLiveSessionControls, renderLiveSessionSummary, } from "../../utilities/data-layer/capture.js";
import { detachObservationTarget, endAndAttachObservationTarget } from "../../data-layer-observation-targets.js";
import { SAVED_EVENT_FEED_FILTER_STORAGE_KEY, SAVED_EVENT_FEED_FILTER_WORKING_STORAGE_KEY, SAVED_SESSION_LIBRARY_STORAGE_KEY, SAVED_SESSION_LIVE_FEED_STORAGE_KEY, applySavedEventFeedFilter, cancelSavedSessionDeletion, captureInspectorReturn, closeLiveInspector, commitSavedEventFeedFilterLibrary, confirmSavedSessionDeletion, confirmSessionSave, createSavedEventFeedFilter, createSessionSaveDraft, createLiveObserverState, exportSavedSession, deleteSavedEventFeedFilter, findLiveObserverElements, importSavedSession, openSavedSession, openSavedSessionLiveFeed, pauseCapture, recordBackgroundLiveEvent, recordLiveEvent, resetLiveObserverForSession, renameSavedEventFeedFilter, renameSavedSession, renderLiveObserverState, requestSavedSessionDeletion, restoreSavedEventFeedFilterLibrary, restoreSavedEventFeedWorkingView, restoreSavedSessionLibrary, restoreSavedSessionLiveFeed, restoreInspectorReturn, resumeSavedSession, resumeCapture, returnToCurrentLiveFeed, revalidateSavedSessionLiveFeed, savedSessionSummary, searchSavedSessions, selectLiveEvent, dataLayerViewForNavigationKey, serializeSavedSessionLibrary, serializeSavedSessionLiveFeed, serializeSavedEventFeedWorkingView, setDefaultSavedEventFeedFilter, setLiveQuery, updateSavedEventFeedFilter, updateSavedSessionLiveFeedView, } from "../../utilities/data-layer/live-inspection.js";
import { endDataLayerTestingSession } from "../../data-layer-session.js";
export function createCaptureInstalledController(ports) {
    const SAVED_THROUGH_EVENT_COUNT_STORAGE_KEY = "my-chrome-utilities.saved-through-event-count.v1";
    const startTestingButton = ports.root.querySelector("#start-data-layer-testing");
    const endTestingButton = ports.root.querySelector("#end-data-layer-testing");
    const liveObserverElements = findLiveObserverElements(ports.root);
    const historyPathDisplay = ports.root.querySelector("#history-path-display");
    const historyPathStatus = ports.root.querySelector("#history-path-status");
    const sessionHistoryPath = ports.root.querySelector("#session-history-path");
    const sessionWarning = ports.root.querySelector("#session-warning");
    const restartObservationButton = ports.root.querySelector("#restart-observation");
    const observationTargetElements = findObservationTargetElements(ports.root);
    const { chooseButton: chooseObservationTargetButton, browseButton: browseObservationTargetsButton, closePickerButton: closeObservationTargetPickerButton, picker: observationTargetPicker, search: observationTargetSearch, list: observationTargetList, cancelDetachButton: cancelDetachTargetButton, confirmDetachButton: confirmDetachTargetButton, } = observationTargetElements;
    const pauseCaptureButton = liveObserverElements.pauseCaptureButton;
    const resumeCaptureButton = liveObserverElements.resumeCaptureButton;
    const liveSessionSummaryElements = findLiveSessionSummaryElements(ports.root);
    const liveGuidedWorkflowElements = findLiveGuidedWorkflowElements(ports.root);
    const dataLayerViewList = liveObserverElements.viewList;
    const backToEventsButton = liveObserverElements.backToEventsButton;
    const copyPageUrlButton = liveSessionSummaryElements.copyPageUrlButton;
    const saveLiveSessionButton = ports.root.querySelector("#save-live-session");
    const startFreshSessionButton = ports.root.querySelector("#start-fresh-session");
    const reportMissingEventButton = ports.root.querySelector("#report-missing-event");
    const saveLiveSessionDialog = ports.root.querySelector("#save-live-session-dialog");
    const saveLiveSessionForm = ports.root.querySelector("#save-live-session-form");
    const saveLiveSessionHeading = ports.root.querySelector("#save-live-session-heading");
    const saveLiveSessionName = ports.root.querySelector("#save-live-session-name");
    const saveLiveSessionSummary = ports.root.querySelector("#save-live-session-summary");
    const confirmSaveLiveSessionButton = ports.root.querySelector("#confirm-save-live-session");
    const cancelSaveLiveSessionButton = ports.root.querySelector("#cancel-save-live-session");
    const freshSessionConfirmation = ports.root.querySelector("#fresh-session-confirmation");
    const freshSessionConfirmationHeading = ports.root.querySelector("#fresh-session-confirmation-heading");
    const freshSessionConfirmationSummary = ports.root.querySelector("#fresh-session-confirmation-summary");
    const saveAndStartFreshSessionButton = ports.root.querySelector("#save-and-start-fresh-session");
    const discardAndStartFreshSessionButton = ports.root.querySelector("#discard-and-start-fresh-session");
    const cancelFreshSessionButton = ports.root.querySelector("#cancel-fresh-session");
    const savedSessionLiveBanner = ports.root.querySelector("#saved-session-live-banner");
    const savedSessionLiveSummary = ports.root.querySelector("#saved-session-live-summary");
    const savedSessionBackgroundStatus = ports.root.querySelector("#saved-session-background-status");
    const returnToCurrentLiveFeedButton = ports.root.querySelector("#return-to-current-live-feed");
    const revalidateSavedSessionButton = ports.root.querySelector("#revalidate-saved-session");
    const savedSessionValidationComparison = ports.root.querySelector("#saved-session-validation-comparison");
    const savedSessionSearch = ports.root.querySelector("#saved-session-search");
    const importSavedSessionButton = ports.root.querySelector("#import-saved-session");
    const savedSessionFileInput = ports.root.querySelector("#saved-session-file");
    const savedSessionList = ports.root.querySelector("#saved-session-list");
    const savedSessionCount = ports.root.querySelector("#saved-session-count");
    const savedSessionConfirmation = ports.root.querySelector("#saved-session-confirmation");
    const cancelSavedSessionDeleteButton = ports.root.querySelector("#cancel-saved-session-delete");
    const confirmSavedSessionDeleteButton = ports.root.querySelector("#confirm-saved-session-delete");
    const liveEventsEmptyState = ports.root.querySelector("#live-events-empty-state");
    const liveSourceErrorState = ports.root.querySelector("#live-source-error-state");
    const savedSessionEmptyState = ports.root.querySelector("#saved-session-empty-state");
    const liveNotificationController = createLiveNotificationController((message) => ports.setLiveSessionMessage(message), (clear, delayMs) => { globalThis.setTimeout(clear, delayMs); });
    let mounted = false;
    let unsubscribe;
    let dataLayerSessionState = restoreSession(ports.storage);
    let liveObserverState = createLiveObserverState({ pageUrl: ports.initialPageUrl(), sources: ports.initialSources() });
    let dataLayerObserverState = {
        pageObject: samplePageObject(), observedEntries: [], sourceEvents: [],
    };
    let stopLiveHistoryPushCapture = () => { };
    let liveHistoryActivationState = initialObservationActivationState;
    let presentedSourceEventCount = 0;
    let observationRefreshState = initialObservationRefreshState;
    let savedEventFeedFilterLibrary = restoreSavedEventFeedFilterLibrary(ports.storage.getItem(SAVED_EVENT_FEED_FILTER_STORAGE_KEY));
    let savedEventFeedFilterFeedback = "";
    let restoredSavedEventFeedWorkingView = false;
    const restoredSavedEventFeedView = restoreSavedEventFeedWorkingView(ports.storage.getItem(SAVED_EVENT_FEED_FILTER_WORKING_STORAGE_KEY), dataLayerSessionState.session?.id, savedEventFeedFilterLibrary);
    if (restoredSavedEventFeedView) {
        liveObserverState = { ...liveObserverState, query: restoredSavedEventFeedView.query,
            ...(restoredSavedEventFeedView.activeFilterId ? { savedFilterId: restoredSavedEventFeedView.activeFilterId } : {}) };
        restoredSavedEventFeedWorkingView = true;
    }
    if (!restoredSavedEventFeedWorkingView && savedEventFeedFilterLibrary.defaultFilterId) {
        const defaultFilter = savedEventFeedFilterLibrary.filters.find(({ id }) => id === savedEventFeedFilterLibrary.defaultFilterId);
        if (defaultFilter)
            liveObserverState = { ...liveObserverState,
                query: applySavedEventFeedFilter({ conditions: [] }, defaultFilter), savedFilterId: defaultFilter.id };
    }
    let savedSessionLibrary = restoreSavedSessionLibrary(ports.storage.getItem(SAVED_SESSION_LIBRARY_STORAGE_KEY));
    let savedSessionLiveFeed = restoreSavedSessionLiveFeed(ports.storage.getItem(SAVED_SESSION_LIVE_FEED_STORAGE_KEY), savedSessionLibrary);
    if (savedSessionLiveFeed)
        liveObserverState = savedSessionLiveFeed.savedView;
    let archivedSavedSession;
    let pendingSessionSaveDraft;
    let startFreshAfterSessionSave = false;
    let nextSessionSequence = 0;
    let savedThroughEventCount = Math.max(0, Number(ports.storage.getItem(SAVED_THROUGH_EVENT_COUNT_STORAGE_KEY)) || 0);
    let inspectorReturnSnapshot;
    const liveInspectorPresentation = new Map();
    let importGeneration = 0;
    let observationRefreshTimeoutId;
    let unsubscribeTabUpdated;
    let unsubscribeTabRemoved;
    let unsubscribePermissionsRemoved;
    let attachedTargetRecoveryGeneration = 0;
    function restoredObservationTargetState() {
        const session = dataLayerSessionState.session;
        return session?.status === "active" && session.windowId !== undefined
            ? restoreAttachedObservationTarget(createObservationTarget({ tabId: session.tabId, windowId: session.windowId,
                pageUrl: session.currentUrl, title: session.targetTitle ?? session.currentUrl,
                ...(session.targetOrigin ? { origin: session.targetOrigin } : {}), priorSession: true }))
            : createObservationTargetState();
    }
    let observationTargetState = restoredObservationTargetState();
    let pendingObservationTargetSwitchId;
    let targetDiscoveryGeneration = 0;
    function renderHistoryPath(path, fieldValue = path, status = "Selection required") {
        if (historyPathDisplay)
            historyPathDisplay.textContent = path;
        if (historyPathStatus)
            historyPathStatus.textContent = status === "Waiting for path"
                ? "Waiting for observation path" : status;
        if (sessionHistoryPath)
            sessionHistoryPath.textContent = fieldValue;
        if (sessionWarning)
            sessionWarning.hidden = status !== "Unavailable";
    }
    const setObservationTargetResult = (result) => { if (observationTargetElements.result)
        observationTargetElements.result.textContent = result; };
    const renderObservationTargetContext = () => {
        const context = ports.ui.historyPath();
        renderHistoryPath(context.path, context.fieldValue, context.status);
        observationTargetList?.setAttribute("aria-live", "polite");
        renderLiveContextActions();
    };
    async function restartObservationAction() {
        const observation = await currentTargetObservation(ports.ui.historyPath().path);
        if (!mounted || !observation)
            return;
        dataLayerObserverState = restartHistoryObservation(dataLayerSessionState, dataLayerObserverState, observation);
        updateSessionFromObserverState();
        persistAndRenderSessionState();
        restartLiveHistoryCaptureIfActive(observation);
        renderObserverState();
    }
    const requestObservationRestart = () => { restartObservationAction().catch(() => { }); };
    function targetFromTab(tab) {
        return createObservationTarget({ tabId: tab.tabId, windowId: tab.windowId, pageUrl: tab.pageUrl, title: tab.title,
            ...(tab.activeTab !== undefined ? { activeTab: tab.activeTab } : {}), ...(tab.currentWindow !== undefined ? { currentWindow: tab.currentWindow } : {}) });
    }
    function registerTargetTabs(tabs, replaceDiscovery = false) {
        const targets = tabs.map(targetFromTab);
        observationTargetState = replaceDiscovery
            ? refreshDiscoveredObservationTargets(observationTargetState, targets)
            : targets.reduce(registerObservationTarget, observationTargetState);
        renderObservationTargetPicker();
    }
    async function discoverCurrentObservationTarget() {
        const generation = ++targetDiscoveryGeneration;
        const tabs = await ports.observation.discover("current");
        if (!mounted || generation !== targetDiscoveryGeneration)
            return;
        registerTargetTabs(tabs);
        const target = tabs[0] ? targetFromTab(tabs[0]) : undefined;
        if (target) {
            observationTargetState = selectObservationTarget(observationTargetState, target.id);
            setObservationTargetResult(`Selected ${target.title}`);
        }
        else
            setObservationTargetResult("Selection required");
        renderObservationTargetPicker();
    }
    const chooseObservationTarget = () => { void discoverCurrentObservationTarget(); };
    async function browseObservationTargets() {
        const generation = ++targetDiscoveryGeneration;
        if (!await ports.observation.requestTabsAccess()) {
            if (generation === targetDiscoveryGeneration)
                setObservationTargetResult("Registered targets remain available");
            return;
        }
        const tabs = await ports.observation.discover("all");
        if (!mounted || generation !== targetDiscoveryGeneration)
            return;
        registerTargetTabs(tabs, true);
        setObservationTargetResult(`${observationTargetState.targets.length} eligible targets`);
        if (observationTargetPicker)
            observationTargetPicker.hidden = false;
    }
    const closeObservationTargetPicker = () => {
        if (observationTargetPicker)
            observationTargetPicker.hidden = true;
        ports.ui.closeObservationTargetPicker();
    };
    function renderObservationTargetPicker() {
        const targets = findObservationTargets(observationTargetState, observationTargetSearch?.value ?? "");
        ports.observation.render(targets, { select: (id) => {
                observationTargetState = selectObservationTarget(observationTargetState, id);
                setObservationTargetResult(`Selected ${selectedObservationTarget(observationTargetState)?.title ?? id}`);
                renderObservationTargetPicker();
            },
            requestAccess: (id) => { const target = observationTargetState.targets.find((candidate) => candidate.id === id); if (target)
                void requestSelectedTargetAccess(target); } });
    }
    const searchObservationTargets = () => renderObservationTargetPicker();
    const navigateObservationTargetSearch = (event) => handleObservationTargetSearchKeydown(observationTargetElements, event);
    const navigateObservationTargetList = (event) => handleObservationTargetListKeydown(observationTargetElements, event);
    const navigateObservationTargetDialog = (event) => handleObservationTargetDialogKeydown(observationTargetElements, event);
    async function requestSelectedTargetAccess(target) {
        const granted = await ports.observation.requestOriginAccess(target.origin);
        if (!mounted)
            return;
        if (!granted) {
            setObservationTargetResult("Permission required");
            return;
        }
        observationTargetState = updateObservationTargetAccess(observationTargetState, target.id, "Ready");
        setObservationTargetResult(`Access granted for ${target.origin}`);
        renderObservationTargetPicker();
    }
    async function attachSelectedTarget() {
        const decision = attachSelectedObservationTarget(observationTargetState);
        if (decision.result === "End current session before attaching selected target") {
            pendingObservationTargetSwitchId = decision.state.selectedTargetId;
            setObservationTargetResult(decision.result);
            return;
        }
        const target = selectedObservationTarget(decision.state);
        if (decision.result !== "Attached" || !target) {
            setObservationTargetResult(decision.result);
            return;
        }
        if (!await ports.observation.attach(target)) {
            observationTargetState = updateObservationTargetAccess(observationTargetState, target.id, "Permission required");
            setObservationTargetResult("Permission required");
            return;
        }
        observationTargetState = decision.state;
        setObservationTargetResult("Attached");
        renderObservationTargetPicker();
    }
    function beginDetachSelectedTarget() {
        pendingObservationTargetSwitchId = undefined;
        setObservationTargetResult(attachedObservationTarget(observationTargetState) ? "Confirm detach target" : "No target is attached");
    }
    async function confirmDetachSelectedTarget() {
        const attached = attachedObservationTarget(observationTargetState);
        if (attached)
            await ports.observation.detach(attached);
        const switchId = pendingObservationTargetSwitchId;
        pendingObservationTargetSwitchId = undefined;
        observationTargetState = detachObservationTarget(observationTargetState);
        if (switchId) {
            const decision = endAndAttachObservationTarget(observationTargetState, switchId);
            observationTargetState = decision.state;
            const target = attachedObservationTarget(observationTargetState);
            if (target && !await ports.observation.attach(target))
                observationTargetState = updateObservationTargetAccess(observationTargetState, target.id, "Permission required");
        }
        setObservationTargetResult(switchId ? "Attached" : "Detached");
        renderObservationTargetPicker();
    }
    const cancelDetachTarget = () => { pendingObservationTargetSwitchId = undefined; setObservationTargetResult("Detach cancelled"); };
    const confirmDetachTarget = () => { void confirmDetachSelectedTarget(); };
    function showDataLayerView(view) { ports.ui.showDataLayerView(view); }
    const selectDataLayerView = (event) => {
        const button = event.target?.closest("[role=tab]");
        if (button?.textContent)
            showDataLayerView(button.textContent);
    };
    const navigateDataLayerView = (event) => {
        const next = dataLayerViewForNavigationKey(liveObserverState.view, event.key);
        if (!next)
            return;
        event.preventDefault();
        showDataLayerView(next);
    };
    function renderLiveContextActions() {
        const activeSession = dataLayerSessionState.session?.status === "active";
        const selectedTarget = selectedObservationTarget(observationTargetState);
        const status = ports.ui.historyPath().status;
        const pathStatus = status === "Ready" || status === "Waiting for path" || status === "Selection required"
            ? status : "Selection required";
        renderLiveSessionControls({ startTestingButton, endTestingButton, pauseCaptureButton, resumeCaptureButton }, { activeSession, captureStatus: liveObserverState.status });
        renderLiveGuidedWorkflow(liveGuidedWorkflowElements, liveGuidedWorkflow({ activeSession,
            ...(selectedTarget ? { selectedTarget } : {}), pathStatus }));
        if (startFreshSessionButton) {
            startFreshSessionButton.hidden = !activeSession;
            startFreshSessionButton.disabled = Boolean(savedSessionLiveFeed);
        }
    }
    function currentLiveSessionSummary() {
        if (savedSessionLiveFeed)
            return createLiveSessionSummary({ testingState: "Ended", observerStatus: "Disconnected",
                targetPage: `${savedSessionLiveFeed.session.name} · Read-only archive`, pageUrl: savedSessionLiveFeed.session.pageScope,
                observerPath: "Saved session", capturedEventCount: savedSessionLiveFeed.savedView.events.length, connectedSourceCount: 0 });
        const session = dataLayerSessionState.session;
        const target = attachedObservationTarget(observationTargetState) ?? selectedObservationTarget(observationTargetState);
        return createLiveSessionSummary({ testingState: session?.status === "active"
                ? (liveObserverState.status === "Paused" ? "Paused" : "Active") : "Ended",
            observerStatus: canonicalLiveObserverStatus(observerAttachmentStatus(dataLayerSessionState, dataLayerObserverState)),
            targetPage: session?.targetTitle ?? target?.title ?? "No target selected",
            pageUrl: session?.currentUrl ?? target?.pageUrl ?? "", observerPath: session?.historyPath ?? ports.ui.historyPath().path,
            capturedEventCount: liveObserverState.events.length,
            connectedSourceCount: liveObserverState.sources.filter(({ status }) => status === "Connected").length });
    }
    function persistSavedEventFeedWorkingView() {
        if (savedSessionLiveFeed) {
            synchronizeSavedSessionFeedView();
            return;
        }
        const sessionId = dataLayerSessionState.session?.id;
        if (!sessionId) {
            if (ports.storage.removeItem)
                ports.storage.removeItem(SAVED_EVENT_FEED_FILTER_WORKING_STORAGE_KEY);
            else
                ports.storage.setItem(SAVED_EVENT_FEED_FILTER_WORKING_STORAGE_KEY, "");
            return;
        }
        ports.storage.setItem(SAVED_EVENT_FEED_FILTER_WORKING_STORAGE_KEY, serializeSavedEventFeedWorkingView(sessionId, liveObserverState.query ?? { conditions: [] }, liveObserverState.savedFilterId));
    }
    function installSavedEventFeedWorkingQuery(query, activeFilterId) {
        const { savedFilterId: _previous, ...state } = setLiveQuery(liveObserverState, query);
        liveObserverState = { ...state, ...(activeFilterId ? { savedFilterId: activeFilterId } : {}) };
        persistSavedEventFeedWorkingView();
    }
    function installDefaultSavedEventFeedFilterForNewSession() {
        const filter = savedEventFeedFilterLibrary.filters.find(({ id }) => id === savedEventFeedFilterLibrary.defaultFilterId);
        installSavedEventFeedWorkingQuery(filter ? applySavedEventFeedFilter({ conditions: [] }, filter) : { conditions: [] }, filter?.id);
    }
    function commitSavedEventFeedFilters(proposed, failureFeedback) {
        const result = commitSavedEventFeedFilterLibrary(savedEventFeedFilterLibrary, proposed, (serialized) => ports.storage.setItem(SAVED_EVENT_FEED_FILTER_STORAGE_KEY, serialized), failureFeedback);
        savedEventFeedFilterLibrary = result.library;
        savedEventFeedFilterFeedback = result.feedback;
        return result.committed;
    }
    function applyConfiguredSavedEventFeedFilter(filterId) {
        const filter = savedEventFeedFilterLibrary.filters.find(({ id }) => id === filterId);
        installSavedEventFeedWorkingQuery(filter
            ? applySavedEventFeedFilter(liveObserverState.query ?? { conditions: [] }, filter) : { conditions: [] }, filter?.id);
        savedEventFeedFilterFeedback = filter ? `${filter.name} applied` : "All events applied";
        renderLiveObserver();
    }
    function renderSavedEventFeedFilterResult() { renderLiveObserver(); }
    function savedEventFeedFilterControls() {
        return { library: savedEventFeedFilterLibrary,
            ...(liveObserverState.savedFilterId ? { activeFilterId: liveObserverState.savedFilterId } : {}),
            feedback: savedEventFeedFilterFeedback,
            select: applyConfiguredSavedEventFeedFilter,
            create: (name) => {
                try {
                    const created = createSavedEventFeedFilter(savedEventFeedFilterLibrary, name, liveObserverState.query ?? { conditions: [] }, ports.savedFilters.createId());
                    if (commitSavedEventFeedFilters(created.library, "Saving saved filter failed")) {
                        installSavedEventFeedWorkingQuery(applySavedEventFeedFilter({ conditions: [] }, created.filter), created.filter.id);
                        savedEventFeedFilterFeedback = `Saved ${created.filter.name}`;
                    }
                }
                catch (error) {
                    savedEventFeedFilterFeedback = error instanceof Error ? error.message : "Saving saved filter failed";
                }
                renderSavedEventFeedFilterResult();
            },
            update: () => {
                if (!liveObserverState.savedFilterId)
                    return false;
                let committed = false;
                try {
                    const updated = updateSavedEventFeedFilter(savedEventFeedFilterLibrary, liveObserverState.savedFilterId, liveObserverState.query ?? { conditions: [] });
                    if (commitSavedEventFeedFilters(updated.library, "Updating saved filter failed")) {
                        installSavedEventFeedWorkingQuery(applySavedEventFeedFilter({ conditions: [] }, updated.filter), updated.filter.id);
                        savedEventFeedFilterFeedback = `Updated ${updated.filter.name}`;
                        committed = true;
                    }
                }
                catch {
                    savedEventFeedFilterFeedback = "Updating saved filter failed";
                }
                renderSavedEventFeedFilterResult();
                return committed;
            },
            revert: () => {
                const filter = savedEventFeedFilterLibrary.filters.find(({ id }) => id === liveObserverState.savedFilterId);
                if (filter) {
                    installSavedEventFeedWorkingQuery(applySavedEventFeedFilter({ conditions: [] }, filter), filter.id);
                    savedEventFeedFilterFeedback = `Reverted ${filter.name}`;
                }
                renderSavedEventFeedFilterResult();
            },
            rename: (name) => {
                if (!liveObserverState.savedFilterId)
                    return;
                try {
                    const renamed = renameSavedEventFeedFilter(savedEventFeedFilterLibrary, liveObserverState.savedFilterId, name);
                    if (commitSavedEventFeedFilters(renamed.library, "Renaming saved filter failed"))
                        savedEventFeedFilterFeedback = `Renamed to ${renamed.filter.name}`;
                }
                catch (error) {
                    savedEventFeedFilterFeedback = error instanceof Error ? error.message : "Renaming saved filter failed";
                }
                renderSavedEventFeedFilterResult();
            },
            delete: () => {
                if (!liveObserverState.savedFilterId)
                    return;
                const deleted = deleteSavedEventFeedFilter(savedEventFeedFilterLibrary, liveObserverState.savedFilterId, liveObserverState.query ?? { conditions: [] });
                if (commitSavedEventFeedFilters(deleted.library, "Deleting saved filter failed")) {
                    installSavedEventFeedWorkingQuery(deleted.workingQuery);
                    savedEventFeedFilterFeedback = "Saved filter deleted; working conditions retained";
                }
                renderSavedEventFeedFilterResult();
            },
            setDefault: (filterId) => {
                try {
                    const proposed = setDefaultSavedEventFeedFilter(savedEventFeedFilterLibrary, filterId).library;
                    if (commitSavedEventFeedFilters(proposed, "Setting default failed"))
                        savedEventFeedFilterFeedback = filterId ? "Default saved filter set" : "Default saved filter removed";
                }
                catch {
                    savedEventFeedFilterFeedback = "Setting default failed";
                }
                renderSavedEventFeedFilterResult();
            },
        };
    }
    function persistSavedSessionLibrary() {
        ports.storage.setItem(SAVED_SESSION_LIBRARY_STORAGE_KEY, serializeSavedSessionLibrary(savedSessionLibrary));
    }
    function persistSavedSessionFeed() {
        if (savedSessionLiveFeed) {
            ports.storage.setItem(SAVED_SESSION_LIVE_FEED_STORAGE_KEY, serializeSavedSessionLiveFeed(savedSessionLiveFeed));
        }
        else if (ports.storage.removeItem)
            ports.storage.removeItem(SAVED_SESSION_LIVE_FEED_STORAGE_KEY);
        else
            ports.storage.setItem(SAVED_SESSION_LIVE_FEED_STORAGE_KEY, "");
    }
    function currentUnsavedEventCount() {
        const events = savedSessionLiveFeed?.currentView.events ?? liveObserverState.events;
        return Math.max(0, events.length - savedThroughEventCount);
    }
    function testingEndedMessage() {
        const unsaved = currentUnsavedEventCount();
        return unsaved ? `Testing ended; ${unsaved} captured events remain unsaved.` : "Testing ended";
    }
    function synchronizeSavedSessionFeedView(scrollTop = liveObserverElements.eventList?.scrollTop ?? 0) {
        if (!savedSessionLiveFeed)
            return;
        savedSessionLiveFeed = updateSavedSessionLiveFeedView(savedSessionLiveFeed, {
            query: liveObserverState.query,
            ...(liveObserverState.inspectorEventId ? { inspectorEventId: liveObserverState.inspectorEventId } : {}),
            listVisible: liveObserverState.listVisible,
            scrollTop,
        });
        persistSavedSessionFeed();
    }
    const synchronizeSavedSessionFeedScroll = () => synchronizeSavedSessionFeedView();
    function openSessionInLiveFeed(session) {
        const currentView = savedSessionLiveFeed?.currentView ?? liveObserverState;
        savedSessionLiveFeed = openSavedSessionLiveFeed(currentView, session, {
            scrollTop: liveObserverElements.eventList?.scrollTop ?? 0,
        });
        liveObserverState = savedSessionLiveFeed.savedView;
        persistSavedSessionFeed();
        showDataLayerView("Live");
        renderLiveObserver();
        if (liveObserverElements.eventList)
            liveObserverElements.eventList.scrollTop = savedSessionLiveFeed.savedScrollTop;
        renderSavedSessionLiveBanner();
    }
    function startLinkedCaptureFromSavedSession(session) {
        const archived = openSavedSession(savedSessionLibrary, session.id);
        const resumed = resumeSavedSession(archived, ports.initialPageUrl());
        const currentView = savedSessionLiveFeed?.currentView ?? liveObserverState;
        const previousSession = dataLayerSessionState.session;
        archivedSavedSession = archived;
        savedSessionLiveFeed = undefined;
        persistSavedSessionFeed();
        savedThroughEventCount = 0;
        ports.storage.setItem(SAVED_THROUGH_EVENT_COUNT_STORAGE_KEY, "0");
        liveObserverState = { ...currentView, view: "Live", status: "Live", pageUrl: resumed.activeSession.pageUrl,
            events: [], listVisible: true };
        dataLayerSessionState = { session: { id: resumed.activeSession.id, status: "active",
                tabId: previousSession?.tabId ?? 0,
                ...(previousSession?.windowId === undefined ? {} : { windowId: previousSession.windowId }),
                historyPath: previousSession?.historyPath ?? "",
                startUrl: resumed.activeSession.pageUrl, currentUrl: resumed.activeSession.pageUrl,
                targetTitle: previousSession?.targetTitle ?? resumed.activeSession.pageUrl,
                parentSavedSessionId: resumed.activeSession.parentSavedSessionId, timeline: [] } };
        ports.savedSessions.resetFlowTesting();
        installDefaultSavedEventFeedFilterForNewSession();
        publish();
        ports.setLiveSessionMessage(`Linked capture started from ${session.name}; 0 events in the new session.`);
        showDataLayerView("Live");
        renderSavedSessionLiveBanner();
    }
    function savedSessionFileName(name) {
        return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "saved-session"}.json`;
    }
    function downloadSavedSessionFile(session) {
        ports.savedSessions.download(savedSessionFileName(session.name), `${exportSavedSession(session)}\n`);
    }
    function renderSavedSessions() {
        const sessions = searchSavedSessions(savedSessionLibrary, savedSessionSearch?.value ?? "");
        if (savedSessionEmptyState)
            savedSessionEmptyState.hidden = sessions.length > 0;
        if (savedSessionCount)
            savedSessionCount.textContent = `${sessions.length} saved sessions`;
        ports.savedSessions.render(sessions, {
            open: (id) => {
                const session = savedSessionLibrary.sessions.find((candidate) => candidate.id === id);
                if (session)
                    openSessionInLiveFeed(session);
            },
            rename: (id, name) => {
                if (!name.trim())
                    return;
                savedSessionLibrary = renameSavedSession(savedSessionLibrary, id, name.trim());
                persistSavedSessionLibrary();
                renderSavedSessions();
            },
            export: (id) => {
                const session = savedSessionLibrary.sessions.find((candidate) => candidate.id === id);
                if (!session)
                    return;
                downloadSavedSessionFile(session);
                if (savedSessionConfirmation)
                    savedSessionConfirmation.textContent = `Exported saved session ${session.name}.`;
            },
            resume: (id) => {
                const session = savedSessionLibrary.sessions.find((candidate) => candidate.id === id);
                if (session)
                    startLinkedCaptureFromSavedSession(session);
            },
            createSequence: (id) => {
                const session = savedSessionLibrary.sessions.find((candidate) => candidate.id === id);
                if (!session)
                    return;
                ports.savedSessions.createReplaySequence(session);
                if (savedSessionConfirmation)
                    savedSessionConfirmation.textContent = `Created sequence from ${session.name}; saved session remains unchanged.`;
            },
            requestDelete: (id) => {
                savedSessionLibrary = requestSavedSessionDeletion(savedSessionLibrary, id);
                const session = savedSessionLibrary.deletionConfirmation;
                if (savedSessionConfirmation)
                    savedSessionConfirmation.textContent = session ? `Delete saved session ${session.name}?` : "";
                if (cancelSavedSessionDeleteButton)
                    cancelSavedSessionDeleteButton.hidden = !session;
                if (confirmSavedSessionDeleteButton)
                    confirmSavedSessionDeleteButton.hidden = !session;
            },
        });
    }
    function renderSavedSessionLiveBanner() {
        const feed = savedSessionLiveFeed;
        if (savedSessionLiveBanner)
            savedSessionLiveBanner.hidden = !feed;
        if (feed) {
            const summary = savedSessionSummary(feed.session);
            if (savedSessionLiveSummary)
                savedSessionLiveSummary.textContent = `${feed.session.name} · Read-only archive · ${summary.eventCount} events · captured ${summary.captureDate}`;
            if (savedSessionBackgroundStatus)
                savedSessionBackgroundStatus.textContent = dataLayerSessionState.session?.status === "active"
                    ? `Live capture continues in the background · ${feed.backgroundEventCount} new events`
                    : "No observer was started or attached for this saved session.";
            if (returnToCurrentLiveFeedButton)
                returnToCurrentLiveFeedButton.textContent = feed.backgroundEventCount
                    ? `Return to current Live feed · ${feed.backgroundEventCount} new events` : "Return to current Live feed";
            if (savedSessionValidationComparison)
                savedSessionValidationComparison.textContent = feed.comparison
                    ? `Separate validation comparison · revisions ${feed.comparison.revisions.join(" and ")} · ${feed.comparison.results.length} saved events · original results unchanged` : "";
        }
        if (saveLiveSessionDialog)
            saveLiveSessionDialog.dataset.controllerOwned = "capture";
        if (freshSessionConfirmation)
            freshSessionConfirmation.dataset.controllerOwned = "capture";
        if (confirmSaveLiveSessionButton)
            confirmSaveLiveSessionButton.disabled = !(saveLiveSessionName?.value.trim());
        savedSessionList?.setAttribute("aria-live", "polite");
        liveGuidedWorkflowElements.setupSteps?.setAttribute("data-session-owner", "capture");
        for (const button of [pauseCaptureButton, resumeCaptureButton, saveLiveSessionButton, startFreshSessionButton]) {
            if (button)
                button.disabled = Boolean(feed);
        }
    }
    function closeInspectorAndReturnToEvents() {
        const selectedId = liveObserverState.inspectorEventId;
        if (selectedId)
            liveInspectorPresentation.set(selectedId, ports.inspector.capturePresentation());
        const returnSnapshot = inspectorReturnSnapshot;
        liveObserverState = closeLiveInspector(liveObserverState);
        synchronizeSavedSessionFeedView();
        renderLiveObserver();
        if (returnSnapshot)
            ports.inspector.restoreReturn(restoreInspectorReturn(returnSnapshot));
        inspectorReturnSnapshot = undefined;
    }
    function openLiveInspector(eventId, preserveReturnSnapshot = false) {
        const previousEventId = liveObserverState.inspectorEventId;
        if (previousEventId)
            liveInspectorPresentation.set(previousEventId, ports.inspector.capturePresentation());
        if (!preserveReturnSnapshot)
            inspectorReturnSnapshot = captureInspectorReturn(eventId, liveObserverElements.eventList?.scrollTop ?? 0);
        liveObserverState = selectLiveEvent(liveObserverState, eventId, ports.inspector.splitView() ? "split" : "stacked");
        synchronizeSavedSessionFeedView();
        const event = liveObserverState.events.find(({ id }) => id === eventId);
        if (event)
            ports.inspector.render(event);
        ports.inspector.restorePresentation(liveInspectorPresentation.get(eventId));
    }
    const backToEvents = () => closeInspectorAndReturnToEvents();
    function copyLivePageUrl() { ports.ui.copyPageUrl(); }
    const openMissingEventBuilder = () => ports.ui.reportMissingEvent();
    function currentSessionSaveDraft() {
        const now = ports.savedSessions.now();
        const flowTests = ports.savedSessions.flowTests?.();
        return createSessionSaveDraft({ id: `live-${Date.parse(now)}`, pageScope: liveObserverState.pageUrl,
            startedAt: liveObserverState.events[0]?.captureTime ?? now,
            endedAt: liveObserverState.events.at(-1)?.captureTime ?? now,
            events: liveObserverState.events.map((event, index) => ({ ...structuredClone(event),
                sourceName: event.sourceName ?? event.sourceId, payload: event.payload, rawInput: event.rawInput ?? event,
                pageUrl: event.pageUrl ?? liveObserverState.pageUrl, captureOrder: index + 1,
                provenance: event.provenance ?? { source: "live-observer", capturedAt: event.captureTime } })),
            provenance: { source: "live-observer", capturedAt: now },
            ...(flowTests?.length ? { flowTests: structuredClone(flowTests) } : {}) });
    }
    function openSessionSaveDialog(startFreshAfterSave = false) {
        if (savedSessionLiveFeed)
            return;
        startFreshAfterSessionSave = startFreshAfterSave;
        pendingSessionSaveDraft = currentSessionSaveDraft();
        if (saveLiveSessionName)
            saveLiveSessionName.value = "";
        if (confirmSaveLiveSessionButton) {
            confirmSaveLiveSessionButton.disabled = true;
            confirmSaveLiveSessionButton.textContent = startFreshAfterSave ? "Save and start fresh" : "Save snapshot";
        }
        if (saveLiveSessionHeading)
            saveLiveSessionHeading.textContent = startFreshAfterSave ? "Save session before starting fresh" : "Save session snapshot";
        if (saveLiveSessionSummary) {
            const summary = pendingSessionSaveDraft.summary;
            saveLiveSessionSummary.textContent = `${summary.pageScope} · ${summary.eventCount} events · ${summary.sourceCount} sources · ${summary.validationSummary}`;
        }
        saveLiveSessionDialog?.showModal();
        saveLiveSessionHeading?.focus({ preventScroll: true });
    }
    const requestSessionSave = () => openSessionSaveDialog();
    function startFreshSession() {
        if (savedSessionLiveFeed)
            return;
        const previous = dataLayerSessionState.session;
        if (!previous || previous.status !== "active")
            return;
        dataLayerSessionState = { session: { id: newDataLayerSessionId(previous.tabId), status: "active", freshBoundary: true,
                tabId: previous.tabId, historyPath: previous.historyPath, startUrl: previous.currentUrl, currentUrl: previous.currentUrl,
                ...(previous.windowId === undefined ? {} : { windowId: previous.windowId }),
                ...(previous.targetTitle === undefined ? {} : { targetTitle: previous.targetTitle }),
                ...(previous.targetOrigin === undefined ? {} : { targetOrigin: previous.targetOrigin }), timeline: [] } };
        liveObserverState = resetLiveObserverForSession(liveObserverState);
        archivedSavedSession = undefined;
        savedThroughEventCount = 0;
        ports.storage.setItem(SAVED_THROUGH_EVENT_COUNT_STORAGE_KEY, "0");
        ports.savedSessions.resetFlowTesting();
        installDefaultSavedEventFeedFilterForNewSession();
        publish();
        if (liveObserverElements.eventList)
            liveObserverElements.eventList.scrollTop = 0;
        ports.setLiveSessionMessage("Fresh session started with 0 captured events.");
        startFreshSessionButton?.focus({ preventScroll: true });
    }
    function requestFreshSession() {
        if (savedSessionLiveFeed)
            return;
        const unsaved = currentUnsavedEventCount();
        if (!unsaved) {
            startFreshSession();
            return;
        }
        if (freshSessionConfirmationSummary)
            freshSessionConfirmationSummary.textContent = `${unsaved} unsaved events would be discarded.`;
        freshSessionConfirmation?.showModal();
        freshSessionConfirmationHeading?.focus({ preventScroll: true });
    }
    const updateSaveConfirmation = () => { if (confirmSaveLiveSessionButton)
        confirmSaveLiveSessionButton.disabled = !(saveLiveSessionName?.value.trim()); };
    const confirmSessionSaveSubmission = (event) => {
        event.preventDefault();
        const name = saveLiveSessionName?.value.trim() ?? "";
        if (!pendingSessionSaveDraft || !name)
            return;
        savedSessionLibrary = confirmSessionSave(savedSessionLibrary, pendingSessionSaveDraft, name);
        savedThroughEventCount = pendingSessionSaveDraft.completed.events.length;
        ports.storage.setItem(SAVED_THROUGH_EVENT_COUNT_STORAGE_KEY, String(savedThroughEventCount));
        pendingSessionSaveDraft = undefined;
        persistSavedSessionLibrary();
        saveLiveSessionDialog?.close();
        renderSavedSessions();
        if (startFreshAfterSessionSave) {
            startFreshAfterSessionSave = false;
            startFreshSession();
            return;
        }
        ports.setLiveSessionMessage(`Saved immutable snapshot ${name}; capture state unchanged.`);
        saveLiveSessionButton?.focus({ preventScroll: true });
    };
    function closeSaveLiveSessionDialog(event) {
        event?.preventDefault();
        pendingSessionSaveDraft = undefined;
        const returnToFreshAction = startFreshAfterSessionSave;
        startFreshAfterSessionSave = false;
        if (saveLiveSessionDialog?.open)
            saveLiveSessionDialog.close();
        (returnToFreshAction ? startFreshSessionButton : saveLiveSessionButton)?.focus({ preventScroll: true });
    }
    const saveAndStartFreshSession = () => { if (freshSessionConfirmation?.open)
        freshSessionConfirmation.close(); openSessionSaveDialog(true); };
    const discardAndStartFreshSession = () => { if (freshSessionConfirmation?.open)
        freshSessionConfirmation.close(); startFreshSession(); };
    function closeFreshSessionConfirmation(event) {
        event?.preventDefault();
        if (freshSessionConfirmation?.open)
            freshSessionConfirmation.close();
        startFreshSessionButton?.focus({ preventScroll: true });
    }
    function returnToCurrentLiveFeedAction() {
        if (!savedSessionLiveFeed)
            return;
        const returned = returnToCurrentLiveFeed(savedSessionLiveFeed);
        savedSessionLiveFeed = undefined;
        persistSavedSessionFeed();
        liveObserverState = returned.state;
        renderLiveObserver();
        if (liveObserverElements.eventList)
            liveObserverElements.eventList.scrollTop = returned.scrollTop;
        ports.setLiveSessionMessage(`Returned to current Live feed${returned.newEventCount ? ` with ${returned.newEventCount} new events` : ""}.`);
        renderSavedSessionLiveBanner();
    }
    function revalidateSavedSession() {
        if (!savedSessionLiveFeed)
            return;
        savedSessionLiveFeed = revalidateSavedSessionLiveFeed(savedSessionLiveFeed, ports.savedSessions.validate);
        persistSavedSessionFeed();
        renderSavedSessionLiveBanner();
    }
    const searchSavedSessionsAction = () => renderSavedSessions();
    const beginSavedSessionImport = () => savedSessionFileInput?.click();
    async function loadSavedSessionFile() {
        const generation = ++importGeneration;
        try {
            const serialized = await ports.savedSessions.readImportFile();
            if (!mounted || generation !== importGeneration || !serialized)
                return;
            savedSessionLibrary = importSavedSession(savedSessionLibrary, serialized);
            persistSavedSessionLibrary();
            if (savedSessionConfirmation)
                savedSessionConfirmation.textContent = "Saved session imported as an immutable archive.";
            renderSavedSessions();
        }
        catch {
            if (mounted && generation === importGeneration && savedSessionConfirmation)
                savedSessionConfirmation.textContent = "Saved session file must contain valid JSON.";
        }
        finally {
            if (mounted && generation === importGeneration && savedSessionFileInput)
                savedSessionFileInput.value = "";
        }
    }
    const requestSavedSessionImport = async () => { await loadSavedSessionFile(); };
    const selectSavedSession = (event) => {
        const id = event.target?.closest("[data-session-id]")?.dataset.sessionId;
        const session = savedSessionLibrary.sessions.find((candidate) => candidate.id === id);
        if (session)
            openSessionInLiveFeed(session);
    };
    const cancelSavedSessionDelete = () => {
        savedSessionLibrary = cancelSavedSessionDeletion(savedSessionLibrary);
        if (savedSessionConfirmation)
            savedSessionConfirmation.textContent = "";
        if (cancelSavedSessionDeleteButton)
            cancelSavedSessionDeleteButton.hidden = true;
        if (confirmSavedSessionDeleteButton)
            confirmSavedSessionDeleteButton.hidden = true;
        renderSavedSessions();
    };
    const confirmSavedSessionDelete = () => {
        savedSessionLibrary = confirmSavedSessionDeletion(savedSessionLibrary);
        persistSavedSessionLibrary();
        if (savedSessionConfirmation)
            savedSessionConfirmation.textContent = "Saved session deleted.";
        if (cancelSavedSessionDeleteButton)
            cancelSavedSessionDeleteButton.hidden = true;
        if (confirmSavedSessionDeleteButton)
            confirmSavedSessionDeleteButton.hidden = true;
        renderSavedSessions();
    };
    const renderLiveObserver = () => {
        if (mounted)
            renderLiveObserverState(liveObserverElements, liveObserverState, openLiveInspector);
        if (mounted)
            ports.savedFilters.render(liveObserverState.events, liveObserverState.query ?? { conditions: [] }, savedEventFeedFilterControls(), (query) => {
                liveObserverState = setLiveQuery(liveObserverState, query);
                persistSavedEventFeedWorkingView();
                renderLiveObserver();
            });
        if (liveEventsEmptyState)
            liveEventsEmptyState.hidden = liveObserverState.events.length > 0;
        if (liveSourceErrorState)
            liveSourceErrorState.hidden = Boolean(savedSessionLiveFeed)
                || !liveObserverState.sources.some(({ status }) => status !== "Connected");
        renderSavedSessionLiveBanner();
    };
    const publish = () => {
        persistSession(dataLayerSessionState, ports.storage);
        ports.changed(dataLayerSessionState, liveObserverState);
        renderLiveObserver();
    };
    const recordCapturedLiveEvent = (event) => {
        const previousCount = savedSessionLiveFeed?.currentView.events.length ?? liveObserverState.events.length;
        if (savedSessionLiveFeed) {
            savedSessionLiveFeed = recordBackgroundLiveEvent(savedSessionLiveFeed, event);
            persistSavedSessionFeed();
        }
        else
            liveObserverState = recordLiveEvent(liveObserverState, event);
        const nextCount = savedSessionLiveFeed?.currentView.events.length ?? liveObserverState.events.length;
        if (nextCount !== previousCount && dataLayerSessionState.session?.status === "active") {
            dataLayerSessionState = { ...dataLayerSessionState, session: { ...dataLayerSessionState.session,
                    currentUrl: event.pageUrl ?? dataLayerSessionState.session.currentUrl,
                    timeline: [...dataLayerSessionState.session.timeline, { ...event, type: "observed", url: event.pageUrl ?? dataLayerSessionState.session.currentUrl,
                            timestamp: event.captureTime, rawValue: event.rawInput }] } };
        }
        publish();
    };
    const startTesting = () => ports.runCommand("data-layer.start-testing");
    const endTesting = () => ports.runCommand("data-layer.end-testing");
    const setLiveSessionMessage = (message) => liveNotificationController.announce(message);
    const pauseInstalledCapture = () => {
        liveObserverState = pauseCapture(liveObserverState);
        setLiveSessionMessage("Capture paused");
        publish();
    };
    const resumeInstalledCapture = () => {
        liveObserverState = resumeCapture(liveObserverState);
        setLiveSessionMessage("Capture resumed");
        publish();
    };
    function newDataLayerSessionId(tabId) {
        nextSessionSequence += 1;
        const unique = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${nextSessionSequence}`;
        return `tab-${tabId}-session-${unique}`;
    }
    function renderSessionState() { renderObservationTargetContext(); }
    function renderObserverState() { renderLiveSessionSummary(liveSessionSummaryElements, currentLiveSessionSummary()); renderLiveObserver(); }
    function syncCapturedEventsToLive() {
        dataLayerSessionState = dataLayerObserverState.sessionState ?? dataLayerSessionState;
        const events = dataLayerObserverState.sourceEvents ?? [];
        const pendingEvents = events.slice(presentedSourceEventCount);
        presentedSourceEventCount = events.length;
        for (const event of pendingEvents) {
            const presented = ports.observerRuntime.present(event, dataLayerObserverState.observer?.historyPath);
            if (savedSessionLiveFeed) {
                savedSessionLiveFeed = recordBackgroundLiveEvent(savedSessionLiveFeed, presented);
                persistSavedSessionFeed();
            }
            else
                liveObserverState = recordLiveEvent(liveObserverState, presented);
        }
    }
    function updateSessionFromObserverState() { syncCapturedEventsToLive(); }
    function persistAndRenderSessionState() { persistSession(dataLayerSessionState, ports.storage); renderSessionState(); publish(); }
    function persistAndRenderObservationState() { persistAndRenderSessionState(); renderObserverState(); }
    function restartLiveHistoryCaptureIfActive(observation) {
        if (dataLayerSessionState.session?.status === "active")
            startLiveHistoryCapture(observation).catch(() => { });
    }
    function observationPageLoadId(tabId) {
        return `tab:${tabId}:page-load:${observationRefreshState.observedPageLoadSequence}`;
    }
    async function currentTargetObservation(historyPath) {
        const target = attachedObservationTarget(observationTargetState) ?? selectedObservationTarget(observationTargetState);
        if (!target) {
            setObservationTargetResult("Selection required");
            return undefined;
        }
        return ports.observerRuntime.read({ tabId: target.tabId, pageUrl: target.pageUrl, historyPath,
            pageLoadId: observationPageLoadId(target.tabId) });
    }
    async function recoverAttachedObservationTarget() {
        const generation = ++attachedTargetRecoveryGeneration;
        const target = attachedObservationTarget(observationTargetState);
        const session = dataLayerSessionState.session;
        if (!target || session?.status !== "active")
            return;
        try {
            const observation = await ports.observerRuntime.read({ tabId: target.tabId, pageUrl: target.pageUrl,
                historyPath: session.historyPath, pageLoadId: observationPageLoadId(target.tabId) });
            if (!mounted || generation !== attachedTargetRecoveryGeneration
                || attachedObservationTarget(observationTargetState)?.id !== target.id)
                return;
            if (observation.pageAccessStatus === "page access unavailable") {
                observationTargetState = updateObservationTargetAccess(observationTargetState, target.id, "Permission required");
                stopLiveHistoryCapture();
                setObservationTargetResult("Permission required — Request access");
            }
            else {
                dataLayerObserverState = restartHistoryObservation(dataLayerSessionState, dataLayerObserverState, observation);
                updateSessionFromObserverState();
                await startLiveHistoryCapture(observation);
                if (!mounted || generation !== attachedTargetRecoveryGeneration)
                    return;
                persistAndRenderObservationState();
                setObservationTargetResult(`Recovered ${target.title}`);
            }
        }
        catch {
            if (!mounted || generation !== attachedTargetRecoveryGeneration)
                return;
            observationTargetState = updateObservationTargetAccess(observationTargetState, target.id, "Closed");
            stopLiveHistoryCapture();
            setObservationTargetResult("Target unavailable — Choose target");
        }
        renderObservationTargetPicker();
        renderObservationTargetContext();
    }
    function cancelLiveHistoryCaptureRuntime() {
        liveHistoryActivationState = nextObservationActivation(liveHistoryActivationState).state;
        stopLiveHistoryPushCapture();
        stopLiveHistoryPushCapture = () => { };
    }
    function stopLiveHistoryCapture() {
        cancelLiveHistoryCaptureRuntime();
        dataLayerObserverState = stopHistoryArrayObserver(dataLayerObserverState);
    }
    async function startLiveHistoryCapture(observation) {
        cancelLiveHistoryCaptureRuntime();
        const captureGeneration = liveHistoryActivationState.generation;
        try {
            const stopCapture = await ports.observerRuntime.startPush({
                ...(observation.tabId === undefined ? {} : { tabId: observation.tabId }), historyPath: observation.historyPath,
                onSnapshot: ({ historyPath, rawValues }) => {
                    if (!mounted || !observationActivationIsCurrent(liveHistoryActivationState, captureGeneration))
                        return;
                    dataLayerObserverState = attachHistoryArraySnapshot({ ...dataLayerObserverState, sessionState: dataLayerSessionState }, { pageUrl: observation.pageUrl, ...(observation.pageLoadId ? { pageLoadId: observation.pageLoadId } : {}),
                        historyPath, rawValues, requestId: `activation:${captureGeneration}` });
                    updateSessionFromObserverState();
                    persistAndRenderObservationState();
                },
                onEntry: ({ rawValue, timestamp }) => {
                    if (!mounted || !observationActivationIsCurrent(liveHistoryActivationState, captureGeneration))
                        return;
                    dataLayerObserverState = appendObservedHistoryEntry(dataLayerObserverState, rawValue, timestamp);
                    ports.observerRuntime.recordCapture({
                        sessionId: `tab:${observation.tabId ?? dataLayerSessionState.session?.tabId ?? "active"}`,
                        pageUrl: dataLayerSessionState.session?.currentUrl ?? observation.pageUrl,
                        sourceId: dataLayerSessionState.session?.historyPath ?? observation.historyPath, rawValue,
                    });
                    updateSessionFromObserverState();
                    persistAndRenderObservationState();
                },
            });
            if (!mounted || !observationActivationIsCurrent(liveHistoryActivationState, captureGeneration)) {
                stopCapture();
                return;
            }
            stopLiveHistoryPushCapture = stopCapture;
        }
        catch {
            if (observationActivationIsCurrent(liveHistoryActivationState, captureGeneration))
                stopLiveHistoryPushCapture = () => { };
        }
    }
    function clearScheduledObservationRefresh() {
        if (observationRefreshTimeoutId !== undefined) {
            globalThis.clearTimeout(observationRefreshTimeoutId);
            observationRefreshTimeoutId = undefined;
        }
    }
    function scheduleObservationRefresh(request) {
        clearScheduledObservationRefresh();
        const delay = observationRefreshDelay(request.attempt);
        observationRefreshTimeoutId = globalThis.setTimeout(() => {
            observationRefreshTimeoutId = undefined;
            runObservationRefresh(request).catch(() => { });
        }, delay);
    }
    function activeSessionTabMatches(tabId) {
        const session = dataLayerSessionState.session;
        return session?.status === "active" && session.tabId === tabId;
    }
    function capturePageEntryForRefresh(request) {
        if (request.pageEntryCaptured)
            return request;
        dataLayerSessionState = navigateSession(dataLayerSessionState, request.pageUrl);
        dataLayerSessionState = captureEntry(dataLayerSessionState, { type: "page", url: request.pageUrl });
        persistAndRenderSessionState();
        return markObservationRefreshPageEntryCaptured(request);
    }
    function refreshObservationAfterPageLoad(tabId, pageUrl, pageLoadSequence) {
        if (!activeSessionTabMatches(tabId))
            return;
        const schedule = observationRefreshRequestForPageLoad(observationRefreshState, tabId, pageUrl, pageLoadSequence);
        observationRefreshState = schedule.state;
        if (schedule.request)
            scheduleObservationRefresh(schedule.request);
    }
    async function runObservationRefresh(request) {
        if (!observationRefreshRequestIsCurrent(observationRefreshState, request) || !activeSessionTabMatches(request.tabId))
            return;
        const session = dataLayerSessionState.session;
        if (!session)
            return;
        const nextRequest = capturePageEntryForRefresh(request);
        const observation = await ports.observerRuntime.read({ tabId: nextRequest.tabId, pageUrl: nextRequest.pageUrl,
            historyPath: session.historyPath, pageLoadId: observationPageLoadId(nextRequest.tabId) });
        if (!mounted || !observationRefreshRequestIsCurrent(observationRefreshState, nextRequest)
            || !activeSessionTabMatches(nextRequest.tabId))
            return;
        dataLayerObserverState = restartHistoryObservation(dataLayerSessionState, dataLayerObserverState, observation);
        updateSessionFromObserverState();
        persistAndRenderObservationState();
        if (observation.pageAccessStatus === "page access unavailable") {
            const target = attachedObservationTarget(observationTargetState) ?? selectedObservationTarget(observationTargetState);
            if (target)
                observationTargetState = updateObservationTargetAccess(observationTargetState, target.id, "Permission required");
            setObservationTargetResult("Permission required — Request access");
            renderObservationTargetPicker();
            renderObservationTargetContext();
            return;
        }
        if (dataLayerObserverState.observer?.status === "ready") {
            await startLiveHistoryCapture(observation);
            return;
        }
        if (shouldRetryObservationRefresh(observation.pageAccessStatus, nextRequest.attempt)) {
            scheduleObservationRefresh(nextObservationRefreshAttempt(nextRequest));
        }
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
        if (affected.length) {
            renderObservationTargetPicker();
            renderObservationTargetContext();
        }
    }
    function handleTabUpdated(tabId, changeInfo, tab) {
        if (changeInfo.url !== undefined) {
            const current = observationTargetState.targets.find((target) => target.tabId === tabId);
            if (current) {
                observationTargetState = navigateObservationTarget(observationTargetState, tabId, changeInfo.url);
                const updated = observationTargetState.targets.find((target) => target.tabId === tabId);
                if (updated && tab.title)
                    observationTargetState = registerObservationTarget(observationTargetState, { ...updated, title: tab.title });
                renderObservationTargetPicker();
                renderObservationTargetContext();
            }
        }
        if (!activeSessionTabMatches(tabId))
            return;
        if (changeInfo.status === "loading" || changeInfo.url !== undefined) {
            observationRefreshState = beginObservedPageLoad(observationRefreshState);
            clearScheduledObservationRefresh();
            stopLiveHistoryCapture();
            if (changeInfo.url !== undefined) {
                dataLayerSessionState = navigateSession(dataLayerSessionState, changeInfo.url);
                ports.observerRuntime.recordNavigation({ sessionId: `tab:${tabId}`, pageUrl: changeInfo.url });
                persistAndRenderSessionState();
            }
        }
        if (changeInfo.status === "complete") {
            refreshObservationAfterPageLoad(tabId, tab.url ?? changeInfo.url
                ?? dataLayerSessionState.session?.currentUrl ?? ports.initialPageUrl(), observationRefreshState.observedPageLoadSequence);
        }
    }
    function handleTabRemoved(tabId) {
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
    }
    return {
        mount() {
            if (mounted)
                return;
            mounted = true;
            unsubscribe = ports.subscribeToLiveFeed(recordCapturedLiveEvent);
            unsubscribeTabUpdated = ports.observerRuntime.subscribeTabUpdated(handleTabUpdated);
            unsubscribeTabRemoved = ports.observerRuntime.subscribeTabRemoved(handleTabRemoved);
            unsubscribePermissionsRemoved = ports.observerRuntime.subscribePermissionsRemoved(revokeObservationTargetOrigins);
            startTestingButton?.addEventListener("click", startTesting);
            endTestingButton?.addEventListener("click", endTesting);
            pauseCaptureButton?.addEventListener("click", pauseInstalledCapture);
            resumeCaptureButton?.addEventListener("click", resumeInstalledCapture);
            restartObservationButton?.addEventListener("click", requestObservationRestart);
            chooseObservationTargetButton?.addEventListener("click", chooseObservationTarget);
            browseObservationTargetsButton?.addEventListener("click", browseObservationTargets);
            closeObservationTargetPickerButton?.addEventListener("click", closeObservationTargetPicker);
            observationTargetSearch?.addEventListener("input", searchObservationTargets);
            observationTargetSearch?.addEventListener("keydown", navigateObservationTargetSearch);
            observationTargetList?.addEventListener("keydown", navigateObservationTargetList);
            observationTargetPicker?.addEventListener("keydown", navigateObservationTargetDialog);
            cancelDetachTargetButton?.addEventListener("click", cancelDetachTarget);
            confirmDetachTargetButton?.addEventListener("click", confirmDetachTarget);
            dataLayerViewList?.addEventListener("click", selectDataLayerView);
            dataLayerViewList?.addEventListener("keydown", navigateDataLayerView);
            backToEventsButton?.addEventListener("click", backToEvents);
            copyPageUrlButton?.addEventListener("click", copyLivePageUrl);
            saveLiveSessionButton?.addEventListener("click", requestSessionSave);
            startFreshSessionButton?.addEventListener("click", requestFreshSession);
            reportMissingEventButton?.addEventListener("click", openMissingEventBuilder);
            saveLiveSessionName?.addEventListener("input", updateSaveConfirmation);
            saveLiveSessionForm?.addEventListener("submit", confirmSessionSaveSubmission);
            cancelSaveLiveSessionButton?.addEventListener("click", closeSaveLiveSessionDialog);
            saveLiveSessionDialog?.addEventListener("cancel", closeSaveLiveSessionDialog);
            saveAndStartFreshSessionButton?.addEventListener("click", saveAndStartFreshSession);
            discardAndStartFreshSessionButton?.addEventListener("click", discardAndStartFreshSession);
            cancelFreshSessionButton?.addEventListener("click", closeFreshSessionConfirmation);
            freshSessionConfirmation?.addEventListener("cancel", closeFreshSessionConfirmation);
            returnToCurrentLiveFeedButton?.addEventListener("click", returnToCurrentLiveFeedAction);
            revalidateSavedSessionButton?.addEventListener("click", revalidateSavedSession);
            liveObserverElements.eventList?.addEventListener("scroll", synchronizeSavedSessionFeedScroll);
            savedSessionSearch?.addEventListener("input", searchSavedSessionsAction);
            importSavedSessionButton?.addEventListener("click", beginSavedSessionImport);
            savedSessionFileInput?.addEventListener("change", requestSavedSessionImport);
            savedSessionList?.addEventListener("click", selectSavedSession);
            cancelSavedSessionDeleteButton?.addEventListener("click", cancelSavedSessionDelete);
            confirmSavedSessionDeleteButton?.addEventListener("click", confirmSavedSessionDelete);
            renderObservationTargetContext();
            renderObservationTargetPicker();
            if (attachedObservationTarget(observationTargetState))
                recoverAttachedObservationTarget().catch(() => { });
            renderSavedSessions();
            renderSavedSessionLiveBanner();
            ports.changed(dataLayerSessionState, liveObserverState);
            renderLiveObserver();
        },
        dispose() {
            if (!mounted)
                return;
            mounted = false;
            unsubscribe?.();
            unsubscribe = undefined;
            unsubscribeTabUpdated?.();
            unsubscribeTabUpdated = undefined;
            unsubscribeTabRemoved?.();
            unsubscribeTabRemoved = undefined;
            unsubscribePermissionsRemoved?.();
            unsubscribePermissionsRemoved = undefined;
            startTestingButton?.removeEventListener("click", startTesting);
            endTestingButton?.removeEventListener("click", endTesting);
            pauseCaptureButton?.removeEventListener("click", pauseInstalledCapture);
            resumeCaptureButton?.removeEventListener("click", resumeInstalledCapture);
            restartObservationButton?.removeEventListener("click", requestObservationRestart);
            chooseObservationTargetButton?.removeEventListener("click", chooseObservationTarget);
            browseObservationTargetsButton?.removeEventListener("click", browseObservationTargets);
            closeObservationTargetPickerButton?.removeEventListener("click", closeObservationTargetPicker);
            observationTargetSearch?.removeEventListener("input", searchObservationTargets);
            observationTargetSearch?.removeEventListener("keydown", navigateObservationTargetSearch);
            observationTargetList?.removeEventListener("keydown", navigateObservationTargetList);
            observationTargetPicker?.removeEventListener("keydown", navigateObservationTargetDialog);
            cancelDetachTargetButton?.removeEventListener("click", cancelDetachTarget);
            confirmDetachTargetButton?.removeEventListener("click", confirmDetachTarget);
            dataLayerViewList?.removeEventListener("click", selectDataLayerView);
            dataLayerViewList?.removeEventListener("keydown", navigateDataLayerView);
            backToEventsButton?.removeEventListener("click", backToEvents);
            copyPageUrlButton?.removeEventListener("click", copyLivePageUrl);
            saveLiveSessionButton?.removeEventListener("click", requestSessionSave);
            startFreshSessionButton?.removeEventListener("click", requestFreshSession);
            reportMissingEventButton?.removeEventListener("click", openMissingEventBuilder);
            saveLiveSessionName?.removeEventListener("input", updateSaveConfirmation);
            saveLiveSessionForm?.removeEventListener("submit", confirmSessionSaveSubmission);
            cancelSaveLiveSessionButton?.removeEventListener("click", closeSaveLiveSessionDialog);
            saveLiveSessionDialog?.removeEventListener("cancel", closeSaveLiveSessionDialog);
            saveAndStartFreshSessionButton?.removeEventListener("click", saveAndStartFreshSession);
            discardAndStartFreshSessionButton?.removeEventListener("click", discardAndStartFreshSession);
            cancelFreshSessionButton?.removeEventListener("click", closeFreshSessionConfirmation);
            freshSessionConfirmation?.removeEventListener("cancel", closeFreshSessionConfirmation);
            returnToCurrentLiveFeedButton?.removeEventListener("click", returnToCurrentLiveFeedAction);
            revalidateSavedSessionButton?.removeEventListener("click", revalidateSavedSession);
            liveObserverElements.eventList?.removeEventListener("scroll", synchronizeSavedSessionFeedScroll);
            savedSessionSearch?.removeEventListener("input", searchSavedSessionsAction);
            importSavedSessionButton?.removeEventListener("click", beginSavedSessionImport);
            savedSessionFileInput?.removeEventListener("change", requestSavedSessionImport);
            savedSessionList?.removeEventListener("click", selectSavedSession);
            cancelSavedSessionDeleteButton?.removeEventListener("click", cancelSavedSessionDelete);
            confirmSavedSessionDeleteButton?.removeEventListener("click", confirmSavedSessionDelete);
            savedSessionList?.removeAttribute("aria-live");
            liveGuidedWorkflowElements.setupSteps?.removeAttribute("data-session-owner");
            observationTargetList?.removeAttribute("aria-live");
            ports.savedFilters.dispose();
            targetDiscoveryGeneration += 1;
            importGeneration += 1;
            attachedTargetRecoveryGeneration += 1;
            pendingObservationTargetSwitchId = undefined;
            clearScheduledObservationRefresh();
            stopLiveHistoryCapture();
        },
        async begin() {
            const started = beginDataLayerTestingSession(dataLayerSessionState, liveObserverState, await ports.sessionStart());
            dataLayerSessionState = started.sessionState;
            liveObserverState = started.liveObserverState;
            publish();
        },
        end() {
            dataLayerSessionState = endDataLayerTestingSession(dataLayerSessionState);
            ports.setLiveSessionMessage(testingEndedMessage());
            publish();
        },
        pause: pauseInstalledCapture,
        resume: resumeInstalledCapture,
        capture: recordCapturedLiveEvent,
        discoverTargets: discoverCurrentObservationTarget,
        browseTargets: browseObservationTargets,
        selectTarget(id) { observationTargetState = selectObservationTarget(observationTargetState, id); renderObservationTargetPicker(); },
        requestTargetAccess(id) {
            const target = observationTargetState.targets.find((candidate) => candidate.id === id);
            return target ? requestSelectedTargetAccess(target) : Promise.reject(new Error(`Unknown target ${id}`));
        },
        attachTarget: attachSelectedTarget,
        beginDetachTarget: beginDetachSelectedTarget,
        confirmDetachTarget: confirmDetachSelectedTarget,
        openInspector: openLiveInspector,
        closeInspector: closeInspectorAndReturnToEvents,
        scheduleObservationRefresh,
        refreshPresentation() { renderLiveObserver(); renderSavedSessionLiveBanner(); },
        state: () => ({ session: structuredClone(dataLayerSessionState), observer: structuredClone(liveObserverState),
            targets: structuredClone(observationTargetState), savedSessions: structuredClone(savedSessionLibrary),
            savedFeed: structuredClone(savedSessionLiveFeed), archivedSavedSession: structuredClone(archivedSavedSession),
            savedFilters: structuredClone(savedEventFeedFilterLibrary), savedEventFeedFilterFeedback,
            historyObserver: structuredClone(dataLayerObserverState), observationRefresh: structuredClone(observationRefreshState),
            liveHistoryGeneration: liveHistoryActivationState.generation,
            inspectorReturnSnapshot: structuredClone(inspectorReturnSnapshot),
            savedThroughEventCount, pendingObservationTargetSwitchId }),
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "capture",
    capabilities: ["observation targets", "sessions", "Live feed", "saved sessions", "refresh lifecycle"],
});
//# sourceMappingURL=index.js.map