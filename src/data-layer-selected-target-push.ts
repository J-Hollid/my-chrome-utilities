import type {
  JsonValue,
  PropertyEditorState,
} from "./data-layer-event-library-editor.js";
import type { ObservationTarget } from "./data-layer-observation-targets.js";

export interface SelectedTargetPushRequest {
  tabId: number;
  destination: string;
  eventName: string;
  payload: JsonValue;
}

export interface SelectedTargetPushRecord {
  success: boolean;
  result: string;
  summary: string;
  fieldError?: string;
}

export type PushToPage = (request: SelectedTargetPushRequest) => Promise<void>;

const pathSegment = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const unsafePathSegments = new Set(["__proto__", "constructor", "prototype"]);

export function pushDestinationPathError(path: string): string | undefined {
  const segments = path.split(".");
  if (
    !path.trim() ||
    segments.some((segment) => !pathSegment.test(segment) || unsafePathSegments.has(segment))
  ) {
    return "Invalid push destination path.";
  }
  return undefined;
}

function summary(target: ObservationTarget, destination: string, result: string): string {
  return `${target.title}; ${target.pageUrl}; ${destination}; ${result}.`;
}

export async function pushTemplateToSelectedTarget(
  editor: PropertyEditorState,
  target: ObservationTarget | undefined,
  pushToPage: PushToPage,
): Promise<SelectedTargetPushRecord> {
  const destination = editor.template.destination;
  if (!target || target.accessState !== "Ready") {
    const result = "A ready observation target must be selected.";
    return { success: false, result, summary: result };
  }
  const pathError = pushDestinationPathError(destination);
  if (pathError) {
    return {
      success: false,
      result: pathError,
      fieldError: pathError,
      summary: summary(target, destination, pathError),
    };
  }
  if (editor.jsonError) {
    return {
      success: false,
      result: editor.jsonError,
      summary: summary(target, destination, editor.jsonError),
    };
  }
  try {
    await pushToPage({
      tabId: target.tabId,
      destination,
      eventName: editor.template.eventName,
      payload: structuredClone(editor.draft),
    });
    return { success: true, result: "Pushed", summary: summary(target, destination, "Pushed") };
  } catch (error) {
    const result = error instanceof Error ? error.message : "Push failed";
    return { success: false, result, summary: summary(target, destination, result) };
  }
}
