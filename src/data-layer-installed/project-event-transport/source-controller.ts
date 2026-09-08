import {createObservationSourceEditor, type ObservationSourceConfiguration} from "../../data-layer-project-observation-sources/editor-state.js";
import {createObservationSourceEditorUi} from "../../data-layer-project-observation-sources/editor-ui.js";
import {pathStatus} from "../../data-layer.js";
import type {ActivePageObservationResult} from "../../active-page-observation.js";
import type {ProjectObservationSource} from "../../data-layer-project-observation-sources/model.js";
import type {ObservationSourceStatus} from "../../data-layer-project-observation-sources/model.js";

export interface InstalledSourceSettingsPorts {
  projectId?(): string | undefined;
  configurationKey?(): string;
  load(): Promise<ObservationSourceConfiguration | undefined>;
  save(projectId: string, sources: readonly ProjectObservationSource[]): Promise<void>;
}
export function createInstalledSourceSettings(
  root: ParentNode, ports: InstalledSourceSettingsPorts,
  read: (path: string) => Promise<ActivePageObservationResult | undefined>,
  changed: () => void,
  apply: (observation: ActivePageObservationResult | undefined, path: string, status: string) => void,
) {
  const host = root.querySelector<HTMLElement>("#observation-source-settings");
  let mounted = false, timer: ReturnType<typeof setTimeout> | undefined, generation = 0;
  let applied = "", loadedKey: string | undefined;
  let identity = "", preferredPath = "", readiness = "Selection required", request = 0;
  const statuses = new Map<string, string>();
  const editor = createObservationSourceEditor({
    ...ports, id:() => "source:" + crypto.randomUUID(),
    changed:() => {
      if (!mounted) return;
      ui?.render();
      statuses.forEach((status,id) => ui?.status(id,status));
      const config = editor.configuration(), next = JSON.stringify(config);
      if (next !== identity) {
        identity = next; generation += 1; changed();
        void refreshStatus();
      }
    },
  });
  const ui = host ? createObservationSourceEditorUi(host, editor) : undefined;
  async function refreshStatus(): Promise<void> {
    const operation = generation, currentRequest = ++request;
    const config = editor.configuration();
    let first: ActivePageObservationResult | undefined, ready: ActivePageObservationResult | undefined;
    const nextStatuses = new Map<string,string>();
    for (const source of config?.sources ?? []) {
      if (!source.enabled) { nextStatuses.set(source.id, "Disabled"); continue; }
      try {
        const observation = await read(source.path);
        if (!mounted || operation !== generation || currentRequest !== request) return;
        let status = "Selection required";
        if (observation) {
          first ??= observation;
          const path = pathStatus(observation.pageObject, source.path);
          status = observation.pageAccessStatus !== "page access available" ? "Access required" :
            path === "ready" ? "Ready" : path === "path missing" ? "Waiting for path" : "Not an array";
          if (status === "Ready") ready ??= observation;
        }
        nextStatuses.set(source.id,status);
      } catch { nextStatuses.set(source.id,"Access required"); }
    }
    if (!mounted || operation !== generation || currentRequest !== request) return;
    statuses.clear(); nextStatuses.forEach((value,key) => statuses.set(key,value));
    statuses.forEach((status,id) => ui?.status(id,status));
    preferredPath = ready?.historyPath ?? config?.sources.find(source => source.enabled)?.path ?? "";
    readiness = ready ? "Ready" : !config ? "Open project" :
      !config.sources.some(source => source.enabled) ? "Enable an observation source" :
      first?.pageAccessStatus === "page access unavailable" ? "Access required" : "Waiting for path";
    ui?.readiness(readiness);
    const observation=ready??first;
    const nextApplied=JSON.stringify([config?.projectId,observation?.tabId,observation?.pageUrl,preferredPath,readiness]);
    if (nextApplied!==applied) { applied=nextApplied; apply(observation,preferredPath,readiness); }
  }
  async function refresh(): Promise<void> {
    const key = ports.configurationKey?.();
    if (key !== undefined && key === loadedKey) return;
    try { await editor.refresh(); if (key === ports.configurationKey?.()) loadedKey = key; }
    catch { readiness = "Access required"; }
  }
  const poll = (): void => {
    void refreshStatus().finally(() => { if (mounted) timer = setTimeout(poll,500); });
  };
  return {
    mount(): void {
      if (mounted) return; mounted = true;
      for (const selector of ['label[for="history-path"]', "#history-path", "#history-path-status"]) {
        const node = root.querySelector<HTMLElement>(selector); if (node) node.hidden = true;
      }
      void refresh().then(() => { if (mounted) poll(); });
    },
    dispose(): void { mounted = false; generation += 1; clearTimeout(timer); },
    refresh, refreshStatus, editor,
    configuration:editor.configuration,
    path:() => preferredPath,
    readiness:() => readiness,
    status(source: ProjectObservationSource, status: ObservationSourceStatus): void {
      statuses.set(source.id,status); ui?.status(source.id,status);
    },
  };
}
