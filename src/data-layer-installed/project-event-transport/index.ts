export interface ProjectEventTransportInstalledPorts {
  observationPath(): string;
  pushPath(): string;
  settleTransport(): Promise<void>;
  refreshTargetPath(): Promise<void>;
}

export const installedControllerDefinition = Object.freeze({
  id:"project-event-transport",
  capabilities:["observation path", "push path", "settlement", "target refresh"],
});
