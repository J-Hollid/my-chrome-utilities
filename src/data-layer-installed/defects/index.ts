import {
  DEFECT_LIBRARY_STORAGE_KEY,
  addDefect,
  cancelDefectDeletion,
  confirmDefectDeletion,
  editDefect,
  eventContainsDefectIssue,
  eventMatchesOccurrenceDefect,
  findDefectLibraryElements,
  renderDefectLibrary,
  requestDefectDeletion,
  restoreDefectLibrary,
  searchDefects,
  serializeDefectLibrary,
  presentedEventTriage,
  updateDefectStatus,
  type DefectLibrary,
  type DefectStatus,
  type ReportedDefect,
} from "../../utilities/data-layer/defect-reporting.js";
import type { LiveEvent } from "../../utilities/data-layer/live-inspection.js";

export interface DefectReturnPosition {
  eventId: string;
  issueIndex: number;
  listScrollTop: number;
}

export interface DefectsInstalledPorts {
  root: ParentNode;
  storage: Pick<Storage, "getItem" | "setItem">;
  recopy(defect: ReportedDefect): Promise<string> | string;
  attachCurrentSession(defectId: string): void;
  openLinkedSession(defectId: string): void;
  liveEvents(): readonly LiveEvent[];
  showDefectsView(): void;
  returnToLive(position: DefectReturnPosition): void;
  renderLive(): void;
  now?(): string;
}

export interface DefectsInstalledController {
  mount(): void;
  dispose(): void;
  library(): DefectLibrary;
  replace(library: DefectLibrary): void;
  add(defect: ReportedDefect, saveSeparately?: boolean): ReturnType<typeof addDefect>;
  edit(defectId: string, changes: Parameters<typeof editDefect>[2]): void;
  open(defectId: string, options?: { trigger?: HTMLButtonElement; returnPosition?: DefectReturnPosition }): void;
  close(): void;
  render(): void;
  triage(event: LiveEvent): LiveEvent;
  matchingEvent(defect: ReportedDefect): LiveEvent | undefined;
  selectedId(): string | undefined;
}

export function createDefectsInstalledController(
  ports: DefectsInstalledPorts,
): DefectsInstalledController {
  const elements = findDefectLibraryElements(ports.root);
  const search = ports.root.querySelector<HTMLInputElement>("#defect-library-search");
  const status = ports.root.querySelector<HTMLSelectElement>("#defect-library-status");
  const type = ports.root.querySelector<HTMLSelectElement>("#defect-library-type");
  const event = ports.root.querySelector<HTMLInputElement>("#defect-library-event");
  const schema = ports.root.querySelector<HTMLInputElement>("#defect-library-schema");
  const path = ports.root.querySelector<HTMLInputElement>("#defect-library-path");
  let library = restoreDefectLibrary(ports.storage.getItem(DEFECT_LIBRARY_STORAGE_KEY));
  let selectedId: string | undefined;
  let returnPosition: DefectReturnPosition | undefined;
  let listScrollTop = 0;
  let mounted = false;
  const now = ports.now ?? (() => new Date().toISOString());

  const persist = (): void => {
    ports.storage.setItem(DEFECT_LIBRARY_STORAGE_KEY, serializeDefectLibrary(library));
  };
  const visible = (): ReportedDefect[] => searchDefects(library, {
    query:search?.value ?? "",
    status:(status?.value || "All") as DefectStatus | "All",
    type:(type?.value || "All") as ReportedDefect["type"] | "All",
    eventName:event?.value ?? "",
    schema:schema?.value ?? "",
    path:path?.value ?? "",
  });
  const matchingEvent = (defect: ReportedDefect): LiveEvent | undefined => {
    const events = ports.liveEvents();
    if (defect.occurrenceMatch) {
      const capturedId = String(defect.report?.actual?.id ?? "");
      return events.find((candidate) => candidate.id === capturedId && eventMatchesOccurrenceDefect(candidate, defect))
        ?? events.find((candidate) => eventMatchesOccurrenceDefect(candidate, defect));
    }
    return events.find((candidate) => eventContainsDefectIssue(candidate, defect));
  };
  const open = (id: string, options: { trigger?: HTMLButtonElement; returnPosition?: DefectReturnPosition } = {}): void => {
    selectedId = id;
    if (options.returnPosition) returnPosition = { ...options.returnPosition };
    if (!returnPosition) {
      listScrollTop = ports.root.querySelector<HTMLElement>("#defect-library-master")?.scrollTop ?? 0;
    }
    ports.showDefectsView();
    render();
    if (options.trigger) options.trigger.dataset.openedDefect = id;
  };
  const close = (): void => {
    const returning = returnPosition;
    selectedId = undefined;
    returnPosition = undefined;
    if (returning) {
      ports.returnToLive(returning);
      return;
    }
    render();
    const master = ports.root.querySelector<HTMLElement>("#defect-library-master");
    if (master) master.scrollTop = listScrollTop;
  };
  function render(): void {
    if (!mounted) return;
    const filtered = visible();
    const selected = selectedId ? library.defects.find(({ id }) => id === selectedId) : undefined;
    const presented = selected && !filtered.some(({ id }) => id === selected.id) ? [...filtered, selected] : filtered;
    renderDefectLibrary(elements, presented, selectedId, library.deletionConfirmationId, {
      open:(id, trigger) => open(id, { trigger }),
      close,
      save:(id, report, notes) => { library = editDefect(library, id, { report, notes }, now()); persist(); render(); },
      recopy:(id) => {
        const defect = library.defects.find((candidate) => candidate.id === id);
        return defect ? ports.recopy(defect) : "Defect unavailable";
      },
      updateStatus:(id, next) => { library = updateDefectStatus(library, id, next, now()); persist(); render(); ports.renderLive(); },
      attachCurrentSession:ports.attachCurrentSession,
      openLinkedSession:ports.openLinkedSession,
      requestDelete:(id) => { library = requestDefectDeletion(library, id); render(); },
      cancelDelete:() => { library = cancelDefectDeletion(library); render(); },
      confirmDelete:() => {
        const deleted = library.deletionConfirmationId;
        library = confirmDefectDeletion(library);
        if (selectedId === deleted) selectedId = undefined;
        persist(); render(); ports.renderLive();
      },
    });
  }
  const controls = [search, status, type, event, schema, path].filter(
    (control): control is HTMLInputElement | HTMLSelectElement => Boolean(control));

  return {
    mount(): void {
      if (mounted) return;
      mounted = true;
      for (const control of controls) {
        control.addEventListener("input", render);
        control.addEventListener("change", render);
      }
      render();
    },
    dispose(): void {
      if (!mounted) return;
      mounted = false;
      for (const control of controls) {
        control.removeEventListener("input", render);
        control.removeEventListener("change", render);
      }
      elements.list?.replaceChildren();
      elements.detail?.replaceChildren();
      elements.confirmation?.replaceChildren();
    },
    library:() => structuredClone(library),
    replace(next): void { library = structuredClone(next); persist(); render(); },
    add(defect, saveSeparately = false) {
      const result = addDefect(library, defect, saveSeparately);
      if (result.added) { library = result.library; persist(); render(); ports.renderLive(); }
      return result;
    },
    edit(id, changes): void { library = editDefect(library, id, changes, now()); persist(); render(); },
    open,
    close,
    render,
    triage:(candidate) => ({ ...candidate, defectTriage:presentedEventTriage(candidate, library) }),
    matchingEvent,
    selectedId:() => selectedId,
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"defects",
  capabilities:["defect state", "presentation", "copy", "export"],
});
