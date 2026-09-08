import type {ActivePageObservationResult} from "../../../active-page-observation.js";
import {appendObservedHistoryEntry, attachHistoryArraySnapshot, type DataLayerHistoryObserverState} from "../../../data-layer-observer.js";
import type {DataLayerSessionState} from "../../../data-layer-session.js";
import type {CaptureObserverRuntimePorts} from "../index.js";
import type {ProjectObservationSource} from "../../../data-layer-project-observation-sources/model.js";
import {createObservationSourceCoordinator, type ProjectSourceEvent, type ObservationSourceStatus} from "./coordinator.js";

export interface CaptureSourceConfiguration {
  projectId: string;
  sources: readonly ProjectObservationSource[];
}
export function createCaptureObservationRuntime(ports: {
  runtime: CaptureObserverRuntimePorts;
  active(): boolean;
  session(): DataLayerSessionState;
  observer(): DataLayerHistoryObserverState;
  replaceObserver(state: DataLayerHistoryObserverState): void;
  changed(): void;
  configuration(): CaptureSourceConfiguration | undefined;
  event(event: ProjectSourceEvent): void;
  status(source: ProjectObservationSource, status: ObservationSourceStatus): void;
}) {
  let lastObservation: ActivePageObservationResult | undefined;
  let generation = 0, dispose: (() => void) | undefined;
  const coordinator = createObservationSourceCoordinator({
    start:options => {
      if (!ports.runtime.startSource) throw new Error("Observation source runtime is unavailable");
      return ports.runtime.startSource(options);
    },
    event:ports.event, status:ports.status, now:() => new Date().toISOString(),
  });
  function stop(): void {
    generation += 1; dispose?.(); dispose = undefined; coordinator.stop();
  }
  async function start(observation: ActivePageObservationResult): Promise<void> {
    lastObservation=observation;
    const configuration = ports.configuration(), session = ports.session().session;
    if (ports.runtime.startSource && !configuration) { stop(); return; }
    if (configuration && session?.status === "active") {
      await coordinator.synchronize({
        projectId:configuration.projectId, sessionId:session.id, tabId:session.tabId,
        pageUrl:observation.pageUrl, pageLoadId:observation.pageLoadId ?? observation.pageUrl,
      }, configuration.sources);
      return;
    }
    stop();
    const operation = generation;
    const current = (): boolean => ports.active() && operation === generation;
    try {
      const stopCapture = await ports.runtime.startPush({
        ...(observation.tabId === undefined ? {} : {tabId:observation.tabId}), historyPath:observation.historyPath,
        onSnapshot:({historyPath, rawValues}) => {
          if (!current()) return;
          ports.replaceObserver(attachHistoryArraySnapshot({...ports.observer(), sessionState:ports.session()},
            {pageUrl:observation.pageUrl, ...(observation.pageLoadId ? {pageLoadId:observation.pageLoadId} : {}),
              historyPath, rawValues, requestId:`activation:${operation}`}));
          ports.changed();
        },
        onEntry:({rawValue, timestamp}) => {
          if (!current()) return;
          ports.replaceObserver(appendObservedHistoryEntry(ports.observer(), rawValue, timestamp));
          ports.runtime.recordCapture({
            sessionId:`tab:${observation.tabId ?? ports.session().session?.tabId ?? "active"}`,
            pageUrl:ports.session().session?.currentUrl ?? observation.pageUrl,
            sourceId:ports.session().session?.historyPath ?? observation.historyPath, rawValue,
          });
          ports.changed();
        },
      });
      if (current()) dispose = stopCapture; else stopCapture();
    } catch { if (current()) dispose = undefined; }
  }
  return {start, stop, generation:() => generation,
    configurationChanged(): void {
      if (lastObservation && ports.session().session?.status === "active") void start(lastObservation);
      else if (!ports.configuration()) stop();
    },
  };
}
