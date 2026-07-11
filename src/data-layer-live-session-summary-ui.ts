import type { LiveSessionSummary } from "./data-layer-live-session-summary.js";

export interface LiveSessionSummaryElements {
  sessionStatus: HTMLElement | null;
  observerStatus: HTMLElement | null;
  targetPage: HTMLElement | null;
  pageUrl: HTMLElement | null;
  observerPath: HTMLElement | null;
  capturedEventCount: HTMLElement | null;
  connectedSourceCount: HTMLElement | null;
  copyPageUrlButton: HTMLButtonElement | null;
}

export function findLiveSessionSummaryElements(
  root: ParentNode = document,
): LiveSessionSummaryElements {
  return {
    sessionStatus: root.querySelector<HTMLElement>("#live-session-status"),
    observerStatus: root.querySelector<HTMLElement>("#live-observer-status"),
    targetPage: root.querySelector<HTMLElement>("#live-target-page"),
    pageUrl: root.querySelector<HTMLElement>("#live-page-url"),
    observerPath: root.querySelector<HTMLElement>("#live-observer-path"),
    capturedEventCount: root.querySelector<HTMLElement>("#live-captured-event-count"),
    connectedSourceCount: root.querySelector<HTMLElement>("#live-connected-source-count"),
    copyPageUrlButton: root.querySelector<HTMLButtonElement>("#copy-live-page-url"),
  };
}

export function renderLiveSessionSummary(
  elements: LiveSessionSummaryElements,
  summary: LiveSessionSummary,
): void {
  if (elements.sessionStatus) {
    elements.sessionStatus.textContent = summary.statusLabel;
    elements.sessionStatus.dataset.status = summary.statusLabel.toLowerCase();
  }
  if (elements.observerStatus) {
    elements.observerStatus.textContent = summary.observerStatus;
    elements.observerStatus.dataset.status = summary.observerStatus.toLowerCase().replaceAll(" ", "-");
  }
  if (elements.targetPage) elements.targetPage.textContent = summary.targetPage;
  if (elements.pageUrl) elements.pageUrl.textContent = summary.pageUrl;
  if (elements.observerPath) elements.observerPath.textContent = summary.observerPath;
  if (elements.capturedEventCount) {
    elements.capturedEventCount.textContent = String(summary.capturedEventCount);
  }
  if (elements.connectedSourceCount) {
    elements.connectedSourceCount.textContent = String(summary.connectedSourceCount);
  }
  if (elements.copyPageUrlButton) {
    elements.copyPageUrlButton.disabled = summary.pageUrl.length === 0;
  }
}
