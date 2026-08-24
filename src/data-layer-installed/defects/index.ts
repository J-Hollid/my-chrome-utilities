import {
  DEFECT_LIBRARY_STORAGE_KEY,
  cancelDefectDeletion,
  confirmDefectDeletion,
  editDefect,
  findDefectLibraryElements,
  renderDefectLibrary,
  requestDefectDeletion,
  restoreDefectLibrary,
  searchDefects,
  serializeDefectLibrary,
  updateDefectStatus,
  type DefectLibrary,
  type DefectStatus,
  type ReportedDefect,
} from "../../utilities/data-layer/defect-reporting.js";

export interface DefectsInstalledPorts {
  root: ParentNode;
  storage: Pick<Storage, "getItem" | "setItem">;
  recopy(defect: ReportedDefect): Promise<string> | string;
  attachCurrentSession(defectId: string): void;
  openLinkedSession(defectId: string): void;
  now?(): string;
}

export interface DefectsInstalledController {
  mount(): void;
  dispose(): void;
  library(): DefectLibrary;
  replace(library: DefectLibrary): void;
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
  const render = (): void => {
    if (!mounted) return;
    renderDefectLibrary(elements, visible(), selectedId, library.deletionConfirmationId, {
      open:(id) => { selectedId = id; render(); },
      close:() => { selectedId = undefined; render(); },
      save:(id, report, notes) => { library = editDefect(library, id, { report, notes }, now()); persist(); render(); },
      recopy:(id) => {
        const defect = library.defects.find((candidate) => candidate.id === id);
        return defect ? ports.recopy(defect) : "Defect unavailable";
      },
      updateStatus:(id, next) => { library = updateDefectStatus(library, id, next, now()); persist(); render(); },
      attachCurrentSession:ports.attachCurrentSession,
      openLinkedSession:ports.openLinkedSession,
      requestDelete:(id) => { library = requestDefectDeletion(library, id); render(); },
      cancelDelete:() => { library = cancelDefectDeletion(library); render(); },
      confirmDelete:() => { library = confirmDefectDeletion(library); persist(); selectedId = undefined; render(); },
    });
  };
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
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"defects",
  capabilities:["defect state", "presentation", "copy", "export"],
});
