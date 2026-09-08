import {createCaptureObservationRuntime} from "./runtime.js";
import type {ActivePageObservationResult} from "../../../active-page-observation.js";
import {captureSourceEvent, endDataLayerTestingSession, type DataLayerSessionState} from "../../../data-layer-session.js";
import type {DataLayerHistoryObserverState} from "../../../data-layer-observer.js";
import type {LiveObserverState} from "../../../data-layer-live-observer.js";
import type {CaptureInstalledPorts} from "../index.js";

export function createInstalledObservationBinding(ports: CaptureInstalledPorts, state: {
  active(): boolean;
  session(): DataLayerSessionState;
  observer(): DataLayerHistoryObserverState;
  live(): LiveObserverState;
  setSession(value: DataLayerSessionState): void;
  setObserver(value: DataLayerHistoryObserverState): void;
  setLive(value: LiveObserverState): void;
  changed(): void;
  render(): void;
}) {
  let projectId: string | undefined;
  const runtime=createCaptureObservationRuntime({
    runtime:ports.observerRuntime,active:state.active,session:state.session,observer:state.observer,
    replaceObserver:state.setObserver,changed:state.changed,configuration:() => ports.sourceConfiguration?.(),
    event:event => {
      if (!state.active() || state.session().session?.status !== "active") return;
      const session=captureSourceEvent(state.session(),event,event.sourcePath);
      state.setSession(session);
      state.setObserver({...state.observer(),sessionState:session,sourceEvents:[...(state.observer().sourceEvents??[]),event]});
      ports.observerRuntime.recordCapture({sessionId:event.sessionId,pageUrl:event.pageUrl,sourceId:event.sourceId,rawValue:event.rawInput});
      state.changed();
    },
    status:(source,status) => {
      ports.sourceStatus?.(source,status);
      const configured=ports.sourceConfiguration?.()?.sources ?? [], live=state.live();
      state.setLive({...live,sources:configured.map(item=>({
        id:item.id,name:item.name,path:item.path,status:item.id===source.id ? status :
          live.sources.find(previous=>previous.id===item.id)?.status ?? (item.enabled?"Waiting for path":"Disabled"),
      }))});
      state.render();
    },
  });
  function enforceProject(): boolean {
    const config=ports.sourceConfiguration?.();
    if (ports.sourceConfiguration && (!config || projectId!==undefined && projectId!==config.projectId)) {
      runtime.stop();
      const ended = endDataLayerTestingSession(state.session());
      state.setSession(ended); state.setObserver({...state.observer(),sessionState:ended});
      state.changed(); return false;
    }
    return true;
  }
  return {
    stop:runtime.stop, generation:runtime.generation,
    beginProject(): void { projectId=ports.sourceConfiguration?.()?.projectId; },
    async start(observation: ActivePageObservationResult): Promise<void> {
      if (enforceProject()) await runtime.start(observation);
    },
    configurationChanged(): void {
      const config=ports.sourceConfiguration?.();
      if (state.session().session?.status==="active") enforceProject();
      state.setLive({...state.live(),sources:(config?.sources??[]).map(source=>({
        id:source.id,name:source.name,path:source.path,status:source.enabled?"Waiting for path":"Disabled",
      }))});
      runtime.configurationChanged(); state.render();
    },
  };
}
