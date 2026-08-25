import { beginDataLayerTestingSession, createLiveNotificationController, findLiveGuidedWorkflowElements, findLiveSessionSummaryElements, findObservationTargetElements, observationRefreshDelay, persistSession, restoreSession, } from "../../utilities/data-layer/capture.js";
import { createLiveObserverState, findLiveObserverElements, pauseCapture, recordLiveEvent, renderLiveObserverState, resumeCapture, } from "../../utilities/data-layer/live-inspection.js";
import { endDataLayerTestingSession } from "../../data-layer-session.js";
export function createCaptureInstalledController(ports) {
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
    const liveNotificationController = createLiveNotificationController((message) => ports.setLiveSessionMessage(message), (clear, delayMs) => { globalThis.setTimeout(clear, delayMs); });
    let mounted = false;
    let unsubscribe;
    let dataLayerSessionState = restoreSession(ports.storage);
    let liveObserverState = createLiveObserverState({ pageUrl: ports.initialPageUrl(), sources: ports.initialSources() });
    let observationRefreshTimeoutId;
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
    const renderObservationTargetContext = () => {
        const context = ports.ui.historyPath();
        renderHistoryPath(context.path, context.fieldValue, context.status);
        observationTargetList?.setAttribute("aria-live", "polite");
    };
    const restartObservation = () => ports.ui.restartObservation();
    const chooseObservationTarget = () => ports.ui.chooseObservationTarget();
    const browseObservationTargets = () => ports.ui.browseObservationTargets();
    const closeObservationTargetPicker = () => {
        if (observationTargetPicker)
            observationTargetPicker.hidden = true;
        ports.ui.closeObservationTargetPicker();
    };
    const searchObservationTargets = () => ports.ui.searchObservationTargets(observationTargetSearch?.value ?? "");
    const cancelDetachTarget = () => ports.ui.cancelDetachTarget();
    const confirmDetachTarget = () => ports.ui.confirmDetachTarget();
    function showDataLayerView(view) { ports.ui.showDataLayerView(view); }
    const selectDataLayerView = (event) => {
        const button = event.target?.closest("[role=tab]");
        if (button?.textContent)
            showDataLayerView(button.textContent);
    };
    function renderSavedSessionLiveBanner() {
        const presentation = ports.ui.sessionPresentation();
        if (saveLiveSessionHeading)
            saveLiveSessionHeading.textContent = presentation.heading;
        if (saveLiveSessionSummary)
            saveLiveSessionSummary.textContent = presentation.summary;
        if (freshSessionConfirmationHeading)
            freshSessionConfirmationHeading.textContent = presentation.freshHeading;
        if (freshSessionConfirmationSummary)
            freshSessionConfirmationSummary.textContent = presentation.freshSummary;
        if (savedSessionLiveSummary)
            savedSessionLiveSummary.textContent = presentation.liveSummary;
        if (savedSessionBackgroundStatus)
            savedSessionBackgroundStatus.textContent = presentation.backgroundStatus;
        if (savedSessionValidationComparison)
            savedSessionValidationComparison.textContent = presentation.validationComparison;
        if (savedSessionCount)
            savedSessionCount.textContent = presentation.savedCount;
        if (savedSessionConfirmation)
            savedSessionConfirmation.textContent = presentation.confirmation;
        if (savedSessionLiveBanner)
            savedSessionLiveBanner.hidden = presentation.liveSummary.length === 0;
        if (saveLiveSessionDialog)
            saveLiveSessionDialog.dataset.controllerOwned = "capture";
        if (freshSessionConfirmation)
            freshSessionConfirmation.dataset.controllerOwned = "capture";
        if (confirmSaveLiveSessionButton)
            confirmSaveLiveSessionButton.disabled = !(saveLiveSessionName?.value.trim());
        savedSessionList?.setAttribute("aria-live", "polite");
        liveGuidedWorkflowElements.setupSteps?.setAttribute("data-session-owner", "capture");
    }
    const backToEvents = () => ports.ui.backToEvents();
    function copyLivePageUrl() { ports.ui.copyPageUrl(); }
    const openSessionSaveDialog = () => ports.ui.openSessionSave();
    const startFreshSession = () => ports.ui.startFreshSession();
    const openMissingEventBuilder = () => ports.ui.reportMissingEvent();
    const confirmSessionSave = (event) => {
        event.preventDefault();
        ports.ui.confirmSaveSession(saveLiveSessionName?.value.trim() ?? "");
    };
    const cancelSessionSave = () => ports.ui.cancelSaveSession();
    const saveAndStartFreshSession = () => ports.ui.saveAndStartFreshSession();
    const discardAndStartFreshSession = () => ports.ui.discardAndStartFreshSession();
    const cancelFreshSession = () => ports.ui.cancelFreshSession();
    const returnToCurrentLiveFeed = () => ports.ui.returnToCurrentLiveFeed();
    const revalidateSavedSession = () => ports.ui.revalidateSavedSession();
    const searchSavedSessions = () => ports.ui.searchSavedSessions(savedSessionSearch?.value ?? "");
    const beginSavedSessionImport = () => savedSessionFileInput?.click();
    const loadSavedSessionFile = () => ports.ui.importSavedSession();
    const selectSavedSession = (event) => {
        const id = event.target?.closest("[data-session-id]")?.dataset.sessionId;
        if (id)
            ports.ui.selectSavedSession(id);
    };
    const cancelSavedSessionDelete = () => ports.ui.cancelSavedSessionDelete();
    const confirmSavedSessionDelete = () => ports.ui.confirmSavedSessionDelete();
    const renderLiveObserver = () => {
        if (mounted)
            renderLiveObserverState(liveObserverElements, liveObserverState, () => { });
    };
    const publish = () => {
        persistSession(dataLayerSessionState, ports.storage);
        ports.changed(dataLayerSessionState, liveObserverState);
        renderLiveObserver();
    };
    const syncCapturedEventsToLive = (event) => {
        const previousCount = liveObserverState.events.length;
        liveObserverState = recordLiveEvent(liveObserverState, event);
        if (liveObserverState.events.length !== previousCount && dataLayerSessionState.session?.status === "active") {
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
            saveLiveSessionButton?.addEventListener("click", openSessionSaveDialog);
            startFreshSessionButton?.addEventListener("click", startFreshSession);
            reportMissingEventButton?.addEventListener("click", openMissingEventBuilder);
            saveLiveSessionForm?.addEventListener("submit", confirmSessionSave);
            cancelSaveLiveSessionButton?.addEventListener("click", cancelSessionSave);
            saveAndStartFreshSessionButton?.addEventListener("click", saveAndStartFreshSession);
            discardAndStartFreshSessionButton?.addEventListener("click", discardAndStartFreshSession);
            cancelFreshSessionButton?.addEventListener("click", cancelFreshSession);
            returnToCurrentLiveFeedButton?.addEventListener("click", returnToCurrentLiveFeed);
            revalidateSavedSessionButton?.addEventListener("click", revalidateSavedSession);
            savedSessionSearch?.addEventListener("input", searchSavedSessions);
            importSavedSessionButton?.addEventListener("click", beginSavedSessionImport);
            savedSessionFileInput?.addEventListener("change", loadSavedSessionFile);
            savedSessionList?.addEventListener("click", selectSavedSession);
            cancelSavedSessionDeleteButton?.addEventListener("click", cancelSavedSessionDelete);
            confirmSavedSessionDeleteButton?.addEventListener("click", confirmSavedSessionDelete);
            renderObservationTargetContext();
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
            saveLiveSessionButton?.removeEventListener("click", openSessionSaveDialog);
            startFreshSessionButton?.removeEventListener("click", startFreshSession);
            reportMissingEventButton?.removeEventListener("click", openMissingEventBuilder);
            saveLiveSessionForm?.removeEventListener("submit", confirmSessionSave);
            cancelSaveLiveSessionButton?.removeEventListener("click", cancelSessionSave);
            saveAndStartFreshSessionButton?.removeEventListener("click", saveAndStartFreshSession);
            discardAndStartFreshSessionButton?.removeEventListener("click", discardAndStartFreshSession);
            cancelFreshSessionButton?.removeEventListener("click", cancelFreshSession);
            returnToCurrentLiveFeedButton?.removeEventListener("click", returnToCurrentLiveFeed);
            revalidateSavedSessionButton?.removeEventListener("click", revalidateSavedSession);
            savedSessionSearch?.removeEventListener("input", searchSavedSessions);
            importSavedSessionButton?.removeEventListener("click", beginSavedSessionImport);
            savedSessionFileInput?.removeEventListener("change", loadSavedSessionFile);
            savedSessionList?.removeEventListener("click", selectSavedSession);
            cancelSavedSessionDeleteButton?.removeEventListener("click", cancelSavedSessionDelete);
            confirmSavedSessionDeleteButton?.removeEventListener("click", confirmSavedSessionDelete);
            savedSessionList?.removeAttribute("aria-live");
            liveGuidedWorkflowElements.setupSteps?.removeAttribute("data-session-owner");
            observationTargetList?.removeAttribute("aria-live");
            clearScheduledObservationRefresh();
        },
        async begin() {
            const started = beginDataLayerTestingSession(dataLayerSessionState, liveObserverState, await ports.sessionStart());
            dataLayerSessionState = started.sessionState;
            liveObserverState = started.liveObserverState;
            publish();
        },
        end() { dataLayerSessionState = endDataLayerTestingSession(dataLayerSessionState); publish(); },
        pause: pauseInstalledCapture,
        resume: resumeInstalledCapture,
        capture: syncCapturedEventsToLive,
        scheduleObservationRefresh,
        state: () => ({ session: structuredClone(dataLayerSessionState), observer: structuredClone(liveObserverState) }),
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "capture",
    capabilities: ["observation targets", "sessions", "Live feed", "saved sessions", "refresh lifecycle"],
});
//# sourceMappingURL=index.js.map