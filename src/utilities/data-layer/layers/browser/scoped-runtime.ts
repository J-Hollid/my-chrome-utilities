import type { UtilityMountHost } from "../../../../platform/utility-contract.js";

function showEditor(root: UtilityMountHost, editorSelector: string, focusSelector: string): void {
  const editor = root.querySelector<HTMLElement>(editorSelector);
  if (editor) editor.hidden = false;
  root.querySelector<HTMLInputElement>(focusSelector)?.focus();
}

export function mountScopedDataLayerAdapter(
  root: UtilityMountHost,
  panelIds: readonly string[],
): () => void {
  const cleanups: (() => void)[] = [];
  const bind = (selector: string, listener: () => void): void => {
    const element = root.querySelector<HTMLElement>(selector);
    if (!element) return;
    element.addEventListener("click", listener);
    cleanups.push(() => element.removeEventListener("click", listener));
  };

  if (panelIds.includes("data-layer-panel-library")) {
    bind("#add-new-event", () => showEditor(root, "#event-property-editor", "#event-template-name"));
  }
  if (panelIds.includes("data-layer-panel-schemas")) {
    bind("#create-schema", () => showEditor(root, "#schema-editor", "#schema-editor-name"));
  }
  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}
