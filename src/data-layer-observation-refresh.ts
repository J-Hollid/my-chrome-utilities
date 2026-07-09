import type { PageAccessStatus } from "./data-layer-observer.js";

export const OBSERVATION_REFRESH_RETRY_DELAY_MS = 500;
export const OBSERVATION_REFRESH_MAX_ATTEMPTS = 10;

export interface ObservationRefreshState {
  readonly token: number;
  readonly observedPageLoadSequence: number;
  readonly scheduledPageLoadSequence?: number;
}

export interface ObservationRefreshRequest {
  readonly token: number;
  readonly tabId: number;
  readonly pageUrl: string;
  readonly attempt: number;
  readonly pageEntryCaptured: boolean;
}

export interface ObservationRefreshSchedule {
  readonly state: ObservationRefreshState;
  readonly request?: ObservationRefreshRequest;
}

export const initialObservationRefreshState: ObservationRefreshState = {
  token: 0,
  observedPageLoadSequence: 0,
};

export function beginObservedPageLoad(
  state: ObservationRefreshState,
): ObservationRefreshState {
  return {
    token: state.token + 1,
    observedPageLoadSequence: state.observedPageLoadSequence + 1,
  };
}

export function observationRefreshRequestForPageLoad(
  state: ObservationRefreshState,
  tabId: number,
  pageUrl: string,
  pageLoadSequence: number,
): ObservationRefreshSchedule {
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

export function observationRefreshDelay(attempt: number): number {
  return attempt === 0 ? 0 : OBSERVATION_REFRESH_RETRY_DELAY_MS;
}

export function observationRefreshRequestIsCurrent(
  state: ObservationRefreshState,
  request: ObservationRefreshRequest,
): boolean {
  return request.token === state.token;
}

export function markObservationRefreshPageEntryCaptured(
  request: ObservationRefreshRequest,
): ObservationRefreshRequest {
  return request.pageEntryCaptured
    ? request
    : { ...request, pageEntryCaptured: true };
}

export function shouldRetryObservationRefresh(
  pageAccessStatus: PageAccessStatus | undefined,
  attempt: number,
): boolean {
  return (
    pageAccessStatus !== "page access unavailable" &&
    attempt + 1 < OBSERVATION_REFRESH_MAX_ATTEMPTS
  );
}

export function nextObservationRefreshAttempt(
  request: ObservationRefreshRequest,
): ObservationRefreshRequest {
  return {
    ...request,
    attempt: request.attempt + 1,
  };
}
