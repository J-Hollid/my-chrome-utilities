export interface LiveFlowTestingInstalledPorts {
  beginTest(): Promise<void>;
  currentSummary(): Readonly<Record<string, unknown>> | undefined;
  projectEventResult(): Readonly<Record<string, unknown>> | undefined;
  openProjectEntity(id: string): void;
  subscribe(listener: () => void): () => void;
}

export function createLiveFlowTestingInstalledController(ports: LiveFlowTestingInstalledPorts) {
  let mounted = false;
  let unsubscribe: (() => void) | undefined;
  let summary: Readonly<Record<string, unknown>> | undefined;
  let result: Readonly<Record<string, unknown>> | undefined;
  let generation = 0;
  let completed: Readonly<Record<string, unknown>>[] = [];
  const refresh = (): void => { if (mounted) { summary = ports.currentSummary(); result = ports.projectEventResult(); } };
  return {
    mount(): void { if (!mounted) { mounted = true; generation += 1; unsubscribe = ports.subscribe(refresh); refresh(); } },
    dispose(): void { if (mounted) { mounted = false; generation += 1; unsubscribe?.(); unsubscribe = undefined; summary = undefined; result = undefined; } },
    async begin(): Promise<void> { const operation = generation; await ports.beginTest(); if (mounted && operation === generation) refresh(); },
    refresh,
    complete(record: Readonly<Record<string, unknown>>): void { completed = [structuredClone(record)]; summary = structuredClone(record); },
    reset(): void { completed = []; summary = undefined; result = undefined; if (mounted) refresh(); },
    openProjectEntity:ports.openProjectEntity,
    state:() => ({ ...(summary ? { summary:structuredClone(summary) } : {}),
      ...(result ? { result:structuredClone(result) } : {}), completed:structuredClone(completed), mounted }),
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"live-flow-testing",
  capabilities:["test lifecycle", "summary", "result projection", "project actions"],
});
