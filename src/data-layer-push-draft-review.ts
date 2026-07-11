import type { PropertyEditorState } from "./data-layer-event-library-editor.js";
import type { ObservationTarget } from "./data-layer-observation-targets.js";

export interface PushDraftReview {
  editor: PropertyEditorState;
  target: ObservationTarget;
  summary: string;
  confirmLabel: string;
}

export function createPushDraftReview(
  editor: PropertyEditorState,
  target: ObservationTarget,
): PushDraftReview {
  const reviewedEditor = structuredClone(editor);
  const reviewedTarget = structuredClone(target);
  return {
    editor: reviewedEditor,
    target: reviewedTarget,
    summary: `${reviewedEditor.template.eventName}; ${reviewedTarget.title}; ${reviewedTarget.pageUrl}; ${reviewedEditor.template.destination}; version ${reviewedEditor.template.version}; ${reviewedEditor.template.validation}.`,
    confirmLabel: `Push ${reviewedEditor.template.eventName} to ${reviewedTarget.title}`,
  };
}
