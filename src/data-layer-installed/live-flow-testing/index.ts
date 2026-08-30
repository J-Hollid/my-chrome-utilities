import { mountLiveFlowTestingUi, type LiveFlowTestingUiOptions } from "../../data-layer-live-flow-testing-ui.js";
import type { LiveFlowTestingUi } from "../../data-layer-live-flow-testing-ui.js";

export interface LiveFlowTestingInstalledPorts extends Pick<LiveFlowTestingUiOptions,
  "root" | "activeProject" | "events" | "saveSummary" | "savedSummary" | "onResult" |
  "openProject" | "createProject" | "id" | "now"> {
  subscribe(listener: () => void): () => void;
  createUi?(options:LiveFlowTestingUiOptions):LiveFlowTestingUi;
}

export function createLiveFlowTestingInstalledController(ports: LiveFlowTestingInstalledPorts) {
  let mounted = false;
  let unsubscribe: (() => void) | undefined;
  let generation = 0;
  let completed: Readonly<Record<string, unknown>>[] = [];
  const liveFlowTestingUi = (ports.createUi ?? mountLiveFlowTestingUi)({
    ...ports,
    saveSummary:(summary) => {
      completed = [structuredClone(summary) as unknown as Readonly<Record<string,unknown>>];
      ports.saveSummary(summary);
    },
  });
  const refresh = (): void => {
    if (!mounted) return;
    const operation = generation;
    void liveFlowTestingUi.refreshProject().then(() => {
      if (!mounted || operation !== generation) return;
      const summary = liveFlowTestingUi.summary();
      completed = summary ? [structuredClone(summary) as unknown as Readonly<Record<string,unknown>>] : [];
    });
  };
  function resetLiveFlowTestingSession(): void {
    completed = []; liveFlowTestingUi.reset(); if (mounted) refresh();
  }
  return {
    mount(): void {
      if (mounted) return;
      mounted = true; generation += 1; unsubscribe = ports.subscribe(refresh); refresh();
    },
    dispose(): void {
      if (!mounted) return;
      mounted = false; generation += 1; unsubscribe?.(); unsubscribe = undefined;
      completed = []; liveFlowTestingUi.reset();
    },
    async begin(): Promise<void> {
      const operation = generation; await liveFlowTestingUi.open();
      if (!mounted || operation !== generation) return;
      const summary = liveFlowTestingUi.summary();
      completed = summary ? [structuredClone(summary) as unknown as Readonly<Record<string,unknown>>] : [];
    },
    refresh,
    complete(record: Readonly<Record<string, unknown>>): void {
      completed = [structuredClone(record)];
    },
    reset:resetLiveFlowTestingSession,
    renderEventDetails:liveFlowTestingUi.renderEventDetails,
    attachDefect:liveFlowTestingUi.attachDefect,
    state:() => {
      const summary = mounted ? liveFlowTestingUi.summary() : undefined;
      const result = mounted ? liveFlowTestingUi.run()?.history.at(-1) : undefined;
      return { ...(summary ? { summary:structuredClone(summary) } : {}),
        ...(result ? { result:structuredClone(result) } : {}),
        completed:structuredClone(completed), mounted };
    },
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"live-flow-testing",
  capabilities:["test lifecycle", "summary", "result projection", "project actions"],
});
