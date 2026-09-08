import { createCaptureObservationRuntime } from "./runtime.js";
import { captureSourceEvent, endDataLayerTestingSession } from "../../../data-layer-session.js";
export function createInstalledObservationBinding(ports, state) {
    let projectId;
    const runtime = createCaptureObservationRuntime({
        runtime: ports.observerRuntime, active: state.active, session: state.session, observer: state.observer,
        replaceObserver: state.setObserver, changed: state.changed, configuration: () => ports.sourceConfiguration?.(),
        event: event => {
            if (!state.active() || state.session().session?.status !== "active")
                return;
            const session = captureSourceEvent(state.session(), event, event.sourcePath);
            state.setSession(session);
            state.setObserver({ ...state.observer(), sessionState: session, sourceEvents: [...(state.observer().sourceEvents ?? []), event] });
            ports.observerRuntime.recordCapture({ sessionId: event.sessionId, pageUrl: event.pageUrl, sourceId: event.sourceId, rawValue: event.rawInput });
            state.changed();
        },
        status: (source, status) => {
            ports.sourceStatus?.(source, status);
            const configured = ports.sourceConfiguration?.()?.sources ?? [], live = state.live();
            state.setLive({ ...live, sources: configured.map(item => ({
                    id: item.id, name: item.name, path: item.path, status: item.id === source.id ? status :
                        live.sources.find(previous => previous.id === item.id)?.status ?? (item.enabled ? "Waiting for path" : "Disabled"),
                })) });
            state.render();
        },
    });
    function enforceProject() {
        const config = ports.sourceConfiguration?.();
        if (ports.sourceConfiguration && (!config || projectId !== undefined && projectId !== config.projectId)) {
            runtime.stop();
            const ended = endDataLayerTestingSession(state.session());
            state.setSession(ended);
            state.setObserver({ ...state.observer(), sessionState: ended });
            state.changed();
            return false;
        }
        return true;
    }
    return {
        stop: runtime.stop, generation: runtime.generation,
        beginProject() { projectId = ports.sourceConfiguration?.()?.projectId; },
        async start(observation) {
            if (enforceProject())
                await runtime.start(observation);
        },
        configurationChanged() {
            const config = ports.sourceConfiguration?.();
            if (state.session().session?.status === "active")
                enforceProject();
            state.setLive({ ...state.live(), sources: (config?.sources ?? []).map(source => ({
                    id: source.id, name: source.name, path: source.path, status: source.enabled ? "Waiting for path" : "Disabled",
                })) });
            runtime.configurationChanged();
            state.render();
        },
    };
}
//# sourceMappingURL=binding.js.map