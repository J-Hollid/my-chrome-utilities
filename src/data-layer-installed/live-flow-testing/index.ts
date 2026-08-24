export interface LiveFlowTestingInstalledPorts {
  beginTest(): Promise<void>;
  currentSummary(): Readonly<Record<string, unknown>> | undefined;
  projectEventResult(): Readonly<Record<string, unknown>> | undefined;
  openProjectEntity(id: string): void;
}

export const installedControllerDefinition = Object.freeze({
  id:"live-flow-testing",
  capabilities:["test lifecycle", "summary", "result projection", "project actions"],
});
