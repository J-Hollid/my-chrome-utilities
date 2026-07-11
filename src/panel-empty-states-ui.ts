import type { PanelEmptyState } from "./panel-empty-states.js";

export interface PanelEmptyStateElements {
  container: HTMLElement | null;
  heading: HTMLElement | null;
  detail: HTMLElement | null;
  recovery: HTMLButtonElement | null;
}

export function findPanelEmptyStateElements(
  containerSelector: string,
  recoverySelector: string,
  root: ParentNode = document,
): PanelEmptyStateElements {
  const container = root.querySelector<HTMLElement>(containerSelector);
  return {
    container,
    heading: container?.querySelector<HTMLElement>("h4, h5") ?? null,
    detail: container?.querySelector<HTMLElement>("p") ?? null,
    recovery: root.querySelector<HTMLButtonElement>(recoverySelector),
  };
}

export function renderPanelEmptyState(
  elements: PanelEmptyStateElements,
  state: PanelEmptyState | undefined,
): void {
  if (elements.container) elements.container.hidden = !state;
  if (!state) return;
  if (elements.heading) elements.heading.textContent = state.message;
  if (elements.detail) elements.detail.textContent = `${state.recoveryAction} can resolve this state.`;
  if (elements.recovery) elements.recovery.textContent = state.recoveryAction;
}
