import type { UtilityMountHost } from "../../../../platform/utility-contract.js";
import {
  createSchema,
  createSchemaLibraryExport,
  SCHEMA_LIBRARY_STORAGE_KEY,
  serializeSchemaLibrary,
  validateWithSchema,
} from "../../schemas.js";
import {
  addDefect,
  createMissingEventDefect,
  DEFECT_LIBRARY_STORAGE_KEY,
  restoreDefectLibrary,
  serializeDefectLibrary,
} from "../../defect-reporting.js";

type ClickBinder = (selector: string, listener: () => void) => void;

function showEditor(root: UtilityMountHost, editorSelector: string, focusSelector: string): void {
  const editor = root.querySelector<HTMLElement>(editorSelector);
  if (editor) editor.hidden = false;
  root.querySelector<HTMLInputElement>(focusSelector)?.focus();
}

function bindClicks(root: UtilityMountHost, cleanups: (() => void)[]): ClickBinder {
  return (selector, listener): void => {
    const element = root.querySelector<HTMLElement>(selector);
    if (!element) return;
    element.addEventListener("click", listener);
    cleanups.push(() => element.removeEventListener("click", listener));
  };
}

function mountSchemaWorkflow(root: UtilityMountHost, storage: Storage, bind: ClickBinder): void {
  const schema = createSchema("Scoped checkout", 1, {
    type: "object",
    properties: { event:{ type: "string" } },
    required: ["event"],
  });
  storage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, serializeSchemaLibrary([schema]));
  bind("#recheck-schema-validation", () => {
    const validation = validateWithSchema(
      { sourceId: "scoped", eventName: "checkout", payload: {}, rawInput: {} },
      schema,
      [schema],
    );
    const result = root.querySelector<HTMLElement>("#schema-result");
    if (!result) return;
    result.dataset.validationState = validation.state;
    result.textContent = `Validation complete: ${validation.state}`;
  });
  bind("#export-schema", () => {
    const serialized = JSON.stringify(createSchemaLibraryExport([schema], []));
    const result = root.querySelector<HTMLElement>("#schema-result");
    if (!result) return;
    result.dataset.transferBytes = String(serialized.length);
    result.textContent = `Schema Library exported (${serialized.length} bytes)`;
  });
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator.clipboard?.writeText !== "function") return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function mountDefectWorkflow(
  root: UtilityMountHost,
  storage: Storage,
  cleanups: (() => void)[],
): void {
  const panel = root.querySelector<HTMLElement>("#defect-library-master");
  const ownerDocument = panel?.ownerDocument;
  if (!panel || !ownerDocument) return;

  const save = ownerDocument.createElement("button");
  const copy = ownerDocument.createElement("button");
  const status = ownerDocument.createElement("output");
  save.id = "scoped-save-defect";
  save.textContent = "Save defect";
  copy.id = "scoped-copy-defect";
  copy.textContent = "Copy for Jira";
  status.id = "scoped-defect-status";
  panel.append(save, copy, status);

  const report = {
    summary: "Missing checkout event",
    description: "The checkout event was not observed.",
    expectedEvent: "checkout",
  };
  const defect = createMissingEventDefect({
    id: "scoped-defect",
    now: new Date(0).toISOString(),
    report,
  });
  const onSave = (): void => {
    const library = restoreDefectLibrary(storage.getItem(DEFECT_LIBRARY_STORAGE_KEY));
    const saved = addDefect(library, defect, true);
    storage.setItem(DEFECT_LIBRARY_STORAGE_KEY, serializeDefectLibrary(saved.library));
    status.dataset.saveStatus = "saved";
    status.textContent = "Defect saved";
  };
  const onCopy = async (): Promise<void> => {
    const text = `${report.summary}\n\n${report.description}\nExpected: ${report.expectedEvent}`;
    const copied = await copyText(text);
    status.dataset.copyStatus = copied ? "copied" : "failed";
    status.textContent = copied ? "Defect report copied for Jira" : "Copy failed";
  };
  save.addEventListener("click", onSave);
  copy.addEventListener("click", onCopy);
  cleanups.push(() => {
    save.removeEventListener("click", onSave);
    copy.removeEventListener("click", onCopy);
    save.remove();
    copy.remove();
    status.remove();
  });
}

export function mountScopedDataLayerAdapter(
  root: UtilityMountHost,
  panelIds: readonly string[],
  storage: Storage,
): () => void {
  const cleanups: (() => void)[] = [];
  const bind = bindClicks(root, cleanups);

  if (panelIds.includes("data-layer-panel-library")) {
    bind("#add-new-event", () => showEditor(root, "#event-property-editor", "#event-template-name"));
  }
  if (panelIds.includes("data-layer-panel-schemas")) {
    bind("#create-schema", () => showEditor(root, "#schema-editor", "#schema-editor-name"));
    mountSchemaWorkflow(root, storage, bind);
  }
  if (panelIds.includes("data-layer-panel-defects")) {
    mountDefectWorkflow(root, storage, cleanups);
  }
  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}
