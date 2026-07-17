import type { UtilityMountHost } from "../../../../platform/utility-contract.js";
import { mountScopedDefectWorkflow } from "./scoped/defect-runtime.js";
import { mountScopedEventLibraryWorkflow } from "./scoped/event-library-runtime.js";
import { mountScopedSchemaWorkflow } from "./scoped/schema-runtime.js";
import { showScopedEditor, type ScopedClickBinder } from "./scoped/runtime-support.js";

function bindClicks(root: UtilityMountHost, cleanups: (() => void)[]): ScopedClickBinder {
  return (selector, listener): void => {
    const element = root.querySelector<HTMLElement>(selector);
    if (!element) return;
    element.addEventListener("click", listener);
    cleanups.push(() => element.removeEventListener("click", listener));
  };
}

export function mountScopedDataLayerAdapter(
  root: UtilityMountHost,
  panelIds: readonly string[],
  storage: Storage,
): () => void {
  const cleanups: (() => void)[] = [];
  const bind = bindClicks(root, cleanups);

  if (panelIds.includes("data-layer-panel-library")) {
    mountScopedEventLibraryWorkflow(root, storage, bind);
  }
  if (panelIds.includes("data-layer-panel-schemas")) {
    bind("#create-schema", () => showScopedEditor(root, "#schema-editor", "#schema-editor-name"));
    mountScopedSchemaWorkflow(root, storage, bind);
  }
  if (panelIds.includes("data-layer-panel-defects")) {
    mountScopedDefectWorkflow(root, storage, cleanups);
  }
  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}
