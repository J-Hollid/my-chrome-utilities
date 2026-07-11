export type ActionVariant = "primary" | "secondary" | "quiet" | "destructive";

export interface ActionTreatment {
  variant: ActionVariant;
  disabled: boolean;
  disabledReason?: string;
}

export function actionTreatment(variant: ActionVariant): ActionTreatment {
  return { variant, disabled: false };
}

export function templateActionHierarchy(editor: {
  dirty: boolean;
  jsonError?: string;
}): Record<"saveRevision" | "pushDraft" | "discardDraft", ActionTreatment> {
  return {
    saveRevision: editor.dirty
      ? actionTreatment("primary")
      : { variant: "primary", disabled: true, disabledReason: "The draft has no unsaved changes." },
    pushDraft: editor.jsonError
      ? {
        variant: editor.dirty ? "secondary" : "primary",
        disabled: true,
        disabledReason: "The JSON draft must be valid.",
      }
      : actionTreatment(editor.dirty ? "secondary" : "primary"),
    discardDraft: actionTreatment("destructive"),
  };
}
