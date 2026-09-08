import type {ObservationTargetState} from "../../../data-layer-observation-targets.js";
import type {ObservationSourceConfiguration} from "../../../data-layer-project-observation-sources/editor-state.js";

export function createObservationSessionStart(ports: {
  targets(): ObservationTargetState;
  projectId(): string | undefined;
  configuration(): ObservationSourceConfiguration | undefined;
  readiness(): string | undefined;
  path(): string;
}) {
  return async () => {
    const state = ports.targets();
    const target = state.targets.find(candidate => candidate.id === (state.attachedTargetId ?? state.selectedTargetId));
    if (!target) throw new Error("Select a target before testing.");
    const configuration = ports.configuration();
    if (!configuration || configuration.projectId !== ports.projectId()) throw new Error("Loading project observation sources");
    const readiness = ports.readiness();
    if (readiness !== "Ready") throw new Error(readiness ?? "Enable an observation source");
    return {
      id:`tab-${target.tabId}-session-${crypto.randomUUID()}`,tabId:target.tabId,url:target.pageUrl,
      historyPath:ports.path(),windowId:target.windowId,targetTitle:target.title,targetOrigin:target.origin,
    };
  };
}
