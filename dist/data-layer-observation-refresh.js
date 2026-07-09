export const OBSERVATION_REFRESH_RETRY_DELAY_MS = 500;
export const OBSERVATION_REFRESH_MAX_ATTEMPTS = 10;
export const initialObservationRefreshState = {
    token: 0,
    observedPageLoadSequence: 0,
};
export function beginObservedPageLoad(state) {
    return {
        token: state.token + 1,
        observedPageLoadSequence: state.observedPageLoadSequence + 1,
    };
}
export function observationRefreshRequestForPageLoad(state, tabId, pageUrl, pageLoadSequence) {
    if (state.scheduledPageLoadSequence === pageLoadSequence) {
        return { state };
    }
    const token = state.token + 1;
    return {
        state: {
            ...state,
            token,
            scheduledPageLoadSequence: pageLoadSequence,
        },
        request: {
            token,
            tabId,
            pageUrl,
            attempt: 0,
            pageEntryCaptured: false,
        },
    };
}
export function observationRefreshDelay(attempt) {
    return attempt === 0 ? 0 : OBSERVATION_REFRESH_RETRY_DELAY_MS;
}
export function observationRefreshRequestIsCurrent(state, request) {
    return request.token === state.token;
}
export function markObservationRefreshPageEntryCaptured(request) {
    return request.pageEntryCaptured
        ? request
        : { ...request, pageEntryCaptured: true };
}
export function shouldRetryObservationRefresh(pageAccessStatus, attempt) {
    return (pageAccessStatus !== "page access unavailable" &&
        attempt + 1 < OBSERVATION_REFRESH_MAX_ATTEMPTS);
}
export function nextObservationRefreshAttempt(request) {
    return {
        ...request,
        attempt: request.attempt + 1,
    };
}
//# sourceMappingURL=data-layer-observation-refresh.js.map