import { beginDataLayerTestingSession, createLiveNotificationController, findLiveGuidedWorkflowElements, findLiveSessionSummaryElements, findObservationTargetElements, findObservationTargets, createObservationTarget, createObservationTargetState, restoreAttachedObservationTarget, registerObservationTarget, refreshDiscoveredObservationTargets, selectObservationTarget, selectedObservationTarget, attachedObservationTarget, attachSelectedObservationTarget, updateObservationTargetAccess, observationRefreshDelay, persistSession, restoreSession, } from "../../utilities/data-layer/capture.js";
import { detachObservationTarget, endAndAttachObservationTarget } from "../../data-layer-observation-targets.js";
import { SAVED_SESSION_LIBRARY_STORAGE_KEY, SAVED_SESSION_LIVE_FEED_STORAGE_KEY, cancelSavedSessionDeletion, confirmSavedSessionDeletion, confirmSessionSave, createSessionSaveDraft, createLiveObserverState, exportSavedSession, findLiveObserverElements, importSavedSession, openSavedSession, openSavedSessionLiveFeed, pauseCapture, recordBackgroundLiveEvent, recordLiveEvent, resetLiveObserverForSession, renameSavedSession, renderLiveObserverState, requestSavedSessionDeletion, restoreSavedSessionLibrary, restoreSavedSessionLiveFeed, resumeSavedSession, resumeCapture, returnToCurrentLiveFeed, revalidateSavedSessionLiveFeed, savedSessionSummary, searchSavedSessions, serializeSavedSessionLibrary, serializeSavedSessionLiveFeed, updateSavedSessionLiveFeedView, } from "../../utilities/data-layer/live-inspection.js";
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
    let savedSessionLibrary = restoreSavedSessionLibrary(ports.storage.getItem(SAVED_SESSION_LIBRARY_STORAGE_KEY));
    let savedSessionLiveFeed = restoreSavedSessionLiveFeed(ports.storage.getItem(SAVED_SESSION_LIVE_FEED_STORAGE_KEY), savedSessionLibrary);
    if (savedSessionLiveFeed)
        liveObserverState = savedSessionLiveFeed.savedView;
    let archivedSavedSession;
    let pendingSessionSaveDraft;
    let startFreshAfterSessionSave = false;
    let savedThroughEventCount = Math.max(0, Number(ports.storage.getItem(SAVED_THROUGH_EVENT_COUNT_STORAGE_KEY)) || 0);
    let importGeneration = 0;
    let observationRefreshTimeoutId;
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
    };
    const restartObservation = () => ports.ui.restartObservation();
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
    const backToEvents = () => ports.ui.backToEvents();
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
        dataLayerSessionState = { session: { id: ports.savedSessions.createSessionId(previous.tabId), status: "active", freshBoundary: true,
                tabId: previous.tabId, historyPath: previous.historyPath, startUrl: previous.currentUrl, currentUrl: previous.currentUrl,
                ...(previous.windowId === undefined ? {} : { windowId: previous.windowId }),
                ...(previous.targetTitle === undefined ? {} : { targetTitle: previous.targetTitle }),
                ...(previous.targetOrigin === undefined ? {} : { targetOrigin: previous.targetOrigin }), timeline: [] } };
        liveObserverState = resetLiveObserverForSession(liveObserverState);
        archivedSavedSession = undefined;
        savedThroughEventCount = 0;
        ports.storage.setItem(SAVED_THROUGH_EVENT_COUNT_STORAGE_KEY, "0");
        ports.savedSessions.resetFlowTesting();
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
    function cancelSessionSave(event) {
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
    function cancelFreshSession(event) {
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
            renderLiveObserverState(liveObserverElements, liveObserverState, () => { });
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
    const syncCapturedEventsToLive = (event) => {
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
            void ports.runObservationRefresh(request);
        }, delay);
    }
    return {
        mount() {
            if (mounted)
                return;
            mounted = true;
            unsubscribe = ports.subscribeToLiveFeed(syncCapturedEventsToLive);
            startTestingButton?.addEventListener("click", startTesting);
            endTestingButton?.addEventListener("click", endTesting);
            pauseCaptureButton?.addEventListener("click", pauseInstalledCapture);
            resumeCaptureButton?.addEventListener("click", resumeInstalledCapture);
            restartObservationButton?.addEventListener("click", restartObservation);
            chooseObservationTargetButton?.addEventListener("click", chooseObservationTarget);
            browseObservationTargetsButton?.addEventListener("click", browseObservationTargets);
            closeObservationTargetPickerButton?.addEventListener("click", closeObservationTargetPicker);
            observationTargetSearch?.addEventListener("input", searchObservationTargets);
            cancelDetachTargetButton?.addEventListener("click", cancelDetachTarget);
            confirmDetachTargetButton?.addEventListener("click", confirmDetachTarget);
            dataLayerViewList?.addEventListener("click", selectDataLayerView);
            backToEventsButton?.addEventListener("click", backToEvents);
            copyPageUrlButton?.addEventListener("click", copyLivePageUrl);
            saveLiveSessionButton?.addEventListener("click", requestSessionSave);
            startFreshSessionButton?.addEventListener("click", requestFreshSession);
            reportMissingEventButton?.addEventListener("click", openMissingEventBuilder);
            saveLiveSessionName?.addEventListener("input", updateSaveConfirmation);
            saveLiveSessionForm?.addEventListener("submit", confirmSessionSaveSubmission);
            cancelSaveLiveSessionButton?.addEventListener("click", cancelSessionSave);
            saveLiveSessionDialog?.addEventListener("cancel", cancelSessionSave);
            saveAndStartFreshSessionButton?.addEventListener("click", saveAndStartFreshSession);
            discardAndStartFreshSessionButton?.addEventListener("click", discardAndStartFreshSession);
            cancelFreshSessionButton?.addEventListener("click", cancelFreshSession);
            freshSessionConfirmation?.addEventListener("cancel", cancelFreshSession);
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
            startTestingButton?.removeEventListener("click", startTesting);
            endTestingButton?.removeEventListener("click", endTesting);
            pauseCaptureButton?.removeEventListener("click", pauseInstalledCapture);
            resumeCaptureButton?.removeEventListener("click", resumeInstalledCapture);
            restartObservationButton?.removeEventListener("click", restartObservation);
            chooseObservationTargetButton?.removeEventListener("click", chooseObservationTarget);
            browseObservationTargetsButton?.removeEventListener("click", browseObservationTargets);
            closeObservationTargetPickerButton?.removeEventListener("click", closeObservationTargetPicker);
            observationTargetSearch?.removeEventListener("input", searchObservationTargets);
            cancelDetachTargetButton?.removeEventListener("click", cancelDetachTarget);
            confirmDetachTargetButton?.removeEventListener("click", confirmDetachTarget);
            dataLayerViewList?.removeEventListener("click", selectDataLayerView);
            backToEventsButton?.removeEventListener("click", backToEvents);
            copyPageUrlButton?.removeEventListener("click", copyLivePageUrl);
            saveLiveSessionButton?.removeEventListener("click", requestSessionSave);
            startFreshSessionButton?.removeEventListener("click", requestFreshSession);
            reportMissingEventButton?.removeEventListener("click", openMissingEventBuilder);
            saveLiveSessionName?.removeEventListener("input", updateSaveConfirmation);
            saveLiveSessionForm?.removeEventListener("submit", confirmSessionSaveSubmission);
            cancelSaveLiveSessionButton?.removeEventListener("click", cancelSessionSave);
            saveLiveSessionDialog?.removeEventListener("cancel", cancelSessionSave);
            saveAndStartFreshSessionButton?.removeEventListener("click", saveAndStartFreshSession);
            discardAndStartFreshSessionButton?.removeEventListener("click", discardAndStartFreshSession);
            cancelFreshSessionButton?.removeEventListener("click", cancelFreshSession);
            freshSessionConfirmation?.removeEventListener("cancel", cancelFreshSession);
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
            targetDiscoveryGeneration += 1;
            importGeneration += 1;
            pendingObservationTargetSwitchId = undefined;
            clearScheduledObservationRefresh();
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
        capture: syncCapturedEventsToLive,
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
        scheduleObservationRefresh,
        refreshPresentation() { renderLiveObserver(); renderSavedSessionLiveBanner(); },
        state: () => ({ session: structuredClone(dataLayerSessionState), observer: structuredClone(liveObserverState),
            targets: structuredClone(observationTargetState), savedSessions: structuredClone(savedSessionLibrary),
            savedFeed: structuredClone(savedSessionLiveFeed), archivedSavedSession: structuredClone(archivedSavedSession),
            savedThroughEventCount, pendingObservationTargetSwitchId }),
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "capture",
    capabilities: ["observation targets", "sessions", "Live feed", "saved sessions", "refresh lifecycle"],
});
//# sourceMappingURL=index.js.map