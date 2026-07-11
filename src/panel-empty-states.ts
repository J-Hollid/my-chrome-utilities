export type EmptyStateCollection = "templates" | "sessions" | "schemas" | "sequences";

export interface PanelEmptyState { message: string; recoveryAction: string; }

const states: Record<EmptyStateCollection, PanelEmptyState> = {
  templates: { message: "No templates saved yet", recoveryAction: "Open Live" },
  sessions: { message: "No sessions saved yet", recoveryAction: "Import session" },
  schemas: { message: "No schemas saved yet", recoveryAction: "Create schema" },
  sequences: { message: "No sequences saved yet", recoveryAction: "Create sequence" },
};

export function panelEmptyState(collection: EmptyStateCollection, visibleCount: number, filtered: boolean): PanelEmptyState | undefined {
  if (visibleCount > 0) return undefined;
  if (collection === "templates" && filtered) return { message: "No templates match these filters", recoveryAction: "Clear filters" };
  return states[collection];
}
