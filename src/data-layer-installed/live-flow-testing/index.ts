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
  const refresh = (): void => { summary = ports.currentSummary(); result = ports.projectEventResult(); };
  return {
    mount(): void { if (!mounted) { mounted = true; unsubscribe = ports.subscribe(refresh); refresh(); } },
    dispose(): void { if (mounted) { mounted = false; unsubscribe?.(); unsubscribe = undefined; } },
    begin:ports.beginTest,
    refresh,
    openProjectEntity:ports.openProjectEntity,
    state:() => ({ ...(summary ? { summary:structuredClone(summary) } : {}),
      ...(result ? { result:structuredClone(result) } : {}) }),
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"live-flow-testing",
  capabilities:["test lifecycle", "summary", "result projection", "project actions"],
});
