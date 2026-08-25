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
  let defectLibrary = restoreDefectLibrary(ports.storage.getItem(DEFECT_LIBRARY_STORAGE_KEY));
  let selectedDefectId: string | undefined;
  let defectReturn: DefectReturnPosition | undefined;
  let defectListScrollTop = 0;
  let mounted = false;
  const now = ports.now ?? (() => new Date().toISOString());

  const persistDefectLibrary = (): void => {
    ports.storage.setItem(DEFECT_LIBRARY_STORAGE_KEY, serializeDefectLibrary(defectLibrary));
  };
  const filteredDefectLibrary = (): ReportedDefect[] => searchDefects(defectLibrary, {
    query:search?.value ?? "",
    status:(status?.value || "All") as DefectStatus | "All",
    type:(type?.value || "All") as ReportedDefect["type"] | "All",
    eventName:event?.value ?? "",
    schema:schema?.value ?? "",
    path:path?.value ?? "",
  });
  const matchingEventForDefect = (defect: ReportedDefect): LiveEvent | undefined => {
    const events = ports.liveEvents();
    if (defect.occurrenceMatch) {
      const capturedId = String(defect.report?.actual?.id ?? "");
      return events.find((candidate) => candidate.id === capturedId && eventMatchesOccurrenceDefect(candidate, defect))
        ?? events.find((candidate) => eventMatchesOccurrenceDefect(candidate, defect));
    }
    return events.find((candidate) => eventContainsDefectIssue(candidate, defect));
  };
  const openDefect = (id: string, options: { trigger?: HTMLButtonElement; returnPosition?: DefectReturnPosition } = {}): void => {
    selectedDefectId = id;
    if (options.returnPosition) defectReturn = { ...options.returnPosition };
    if (!defectReturn) {
      defectListScrollTop = ports.root.querySelector<HTMLElement>("#defect-library-master")?.scrollTop ?? 0;
    }
    ports.showDefectsView();
    renderDefects();
    if (options.trigger) options.trigger.dataset.openedDefect = id;
  };
  const closeDefect = (): void => {
    const returning = defectReturn;
    selectedDefectId = undefined;
    defectReturn = undefined;
    if (returning) {
      ports.returnToLive(returning);
      return;
    }
    renderDefects();
    const master = ports.root.querySelector<HTMLElement>("#defect-library-master");
    if (master) master.scrollTop = defectListScrollTop;
  };
  const triagedEvent = (candidate: LiveEvent): LiveEvent => ({ ...candidate,
    defectTriage:presentedEventTriage(candidate, defectLibrary) });
  const recopyDefect = async (id: string): Promise<string> => {
    const defect = defectLibrary.defects.find((candidate) => candidate.id === id);
    return defect ? ports.recopy(defect) : "Defect unavailable";
  };
  function renderDefects(): void {
    if (!mounted) return;
    const filtered = filteredDefectLibrary();
    const selected = selectedDefectId ? defectLibrary.defects.find(({ id }) => id === selectedDefectId) : undefined;
    const presented = selected && !filtered.some(({ id }) => id === selected.id) ? [...filtered, selected] : filtered;
    renderDefectLibrary(elements, presented, selectedDefectId, defectLibrary.deletionConfirmationId, {
      open:(id, trigger) => openDefect(id, { trigger }), close:closeDefect,
      save:(id, report, notes) => { defectLibrary = editDefect(defectLibrary, id, { report, notes }, now()); persistDefectLibrary(); renderDefects(); },
      recopy:recopyDefect,
      updateStatus:(id, next) => { defectLibrary = updateDefectStatus(defectLibrary, id, next, now()); persistDefectLibrary(); renderDefects(); ports.renderLive(); },
      attachCurrentSession:ports.attachCurrentSession,
      openLinkedSession:ports.openLinkedSession,
      requestDelete:(id) => { defectLibrary = requestDefectDeletion(defectLibrary, id); renderDefects(); },
      cancelDelete:() => { defectLibrary = cancelDefectDeletion(defectLibrary); renderDefects(); },
      confirmDelete:() => {
        const deleted = defectLibrary.deletionConfirmationId;
        defectLibrary = confirmDefectDeletion(defectLibrary);
        if (selectedDefectId === deleted) selectedDefectId = undefined;
        persistDefectLibrary(); renderDefects(); ports.renderLive();
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
        control.addEventListener("input", renderDefects);
        control.addEventListener("change", renderDefects);
      }
      renderDefects();
    },
    dispose(): void {
      if (!mounted) return;
      mounted = false;
      for (const control of controls) {
        control.removeEventListener("input", renderDefects);
        control.removeEventListener("change", renderDefects);
      }
      elements.list?.replaceChildren();
      elements.detail?.replaceChildren();
      elements.confirmation?.replaceChildren();
    },
    library:() => structuredClone(defectLibrary),
    replace(next): void { defectLibrary = structuredClone(next); persistDefectLibrary(); renderDefects(); },
    add(defect, saveSeparately = false) {
      const result = addDefect(defectLibrary, defect, saveSeparately);
      if (result.added) { defectLibrary = result.library; persistDefectLibrary(); renderDefects(); ports.renderLive(); }
      return result;
    },
    edit(id, changes): void { defectLibrary = editDefect(defectLibrary, id, changes, now()); persistDefectLibrary(); renderDefects(); },
    open:openDefect, close:closeDefect, render:renderDefects, triage:triagedEvent,
    matchingEvent:matchingEventForDefect,
    selectedId:() => selectedDefectId,
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"defects",
  capabilities:["defect state", "presentation", "copy", "export"],
});
