import {
  createBrowserPhaseTimer,
  observeBrowserReadiness,
} from "./browser-observation-control.mjs";

const targetPhaseNames = [
  "target setup",
  "fixture setup",
  "readiness",
  "example compilation",
  "rendering",
  "persistence",
  "assertion",
  "cleanup",
];

export const flowExamplesPhaseNames = ["browser startup", ...targetPhaseNames];

function finiteDuration(value, label) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must have a finite non-negative duration`);
  }
  return value;
}

export function createFlowExamplesPhaseTimer({ browserStartupMs, now = () => performance.now() } = {}) {
  finiteDuration(browserStartupMs, "browser startup");
  const timer = createBrowserPhaseTimer({
    targetId:"FLOW_GRAPH_EXAMPLES_TARGET", phaseNames:targetPhaseNames, now,
  });
  return {
    transition(nextPhase) { timer.transition(nextPhase); },
    finish(options) {
      const completed = timer.finish(options);
      const { durationMs, phases:targetPhases } = completed;
      return validateFlowExamplesPhaseTiming({
        ...completed,
        durationMs,
        phases:[
          { name:"browser startup", scope:"process", durationMs:Number(browserStartupMs.toFixed(3)) },
          ...targetPhases,
        ],
      });
    },
    get activePhase() { return timer.activePhase; },
  };
}

export function validateFlowExamplesPhaseTiming(timing) {
  if (!Number.isFinite(timing?.durationMs) || timing.durationMs < 0 || !Array.isArray(timing.phases)) {
    throw new Error("Flow examples timing requires a finite target duration and phase list");
  }
  if (timing.phases.length !== flowExamplesPhaseNames.length ||
      timing.phases.some((phase, index) => phase?.name !== flowExamplesPhaseNames[index] ||
        phase.scope !== (index === 0 ? "process" : "target") ||
        !Number.isFinite(phase.durationMs) || phase.durationMs < 0)) {
    throw new Error("Flow examples timing has an invalid phase schema");
  }
  const targetDuration = timing.phases.filter(({ scope }) => scope === "target")
    .reduce((sum, { durationMs }) => sum + durationMs, 0);
  if (Math.abs(targetDuration - timing.durationMs) > 0.001) {
    throw new Error("Flow examples target-scoped phases must cover target duration exactly once");
  }
  return timing;
}

export async function boundedFlowExamplesReadiness({
  targetId,
  phase,
  predicate,
  observe,
  timeoutMs,
  intervalMs = 25,
  maximumSnapshotCharacters = 400,
  stabilityMs = 0,
  now = () => performance.now(),
  sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
}) {
  return observeBrowserReadiness({
    targetId, phase, predicateDescription:predicate, observe,
    ready:(state) => Boolean(state?.ready), snapshot:(state) => state,
    timeoutMs, pollIntervalMs:intervalMs, maximumSnapshotCharacters, stabilityMs,
    now, sleep,
  });
}
