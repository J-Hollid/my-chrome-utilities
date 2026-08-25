export interface EventLibraryInstalledPorts {
  loadTemplates(): readonly Readonly<{ id: string; name: string }>[];
  persistTemplates(templates: readonly Readonly<{ id: string; name: string }>[]): Promise<void>;
  reviewTransfer(): Promise<void>;
  pushSelectedTemplate(): Promise<void>;
}

export function createEventLibraryInstalledController(ports: EventLibraryInstalledPorts) {
  let mounted = false;
  let templates = ports.loadTemplates().map((template) => ({ ...template }));
  let selectedId: string | undefined;
  let draftId: string | undefined;
  return {
    mount(): void { mounted = true; },
    dispose(): void { mounted = false; },
    select(id: string): void {
      if (!templates.some((template) => template.id === id)) throw new Error(`Unknown template ${id}`);
      selectedId = id;
    },
    beginDraft(id: string): void {
      if (!templates.some((template) => template.id === id)) throw new Error(`Unknown template ${id}`);
      draftId = id;
    },
    async replace(next: readonly Readonly<{ id: string; name: string }>[]): Promise<void> {
      templates = next.map((template) => ({ ...template }));
      await ports.persistTemplates(templates);
    },
    reviewTransfer:ports.reviewTransfer,
    pushSelectedTemplate:ports.pushSelectedTemplate,
    state:() => ({ ...(selectedId ? { selectedId } : {}), ...(draftId ? { draftId } : {}),
      templateCount:templates.length }),
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"event-library",
  capabilities:["templates", "reviews", "transfer", "deletion", "push"],
});
