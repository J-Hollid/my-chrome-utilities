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
  const durations = new Map(targetPhaseNames.map((name) => [name, 0]));
  const started = now();
  let phaseStarted = started;
  let activePhase = "target setup";
  let finished = false;
  const record = (ended) => {
    durations.set(activePhase, durations.get(activePhase) + finiteDuration(ended - phaseStarted, activePhase));
    phaseStarted = ended;
  };
  return {
    transition(nextPhase) {
      if (finished) throw new Error("Flow examples phase timing is already complete");
      if (!targetPhaseNames.includes(nextPhase)) throw new Error(`Unknown Flow examples phase: ${nextPhase}`);
      const timestamp = now();
      record(timestamp);
      activePhase = nextPhase;
    },
    finish() {
      if (finished) throw new Error("Flow examples phase timing is already complete");
      const ended = now();
      record(ended);
      finished = true;
      const durationMs = Math.round(ended - started);
      const targetPhases = targetPhaseNames.map((name) => ({
        name, scope:"target", durationMs:Number(durations.get(name).toFixed(3)),
      }));
      const targetSum = targetPhases.reduce((sum, phase) => sum + phase.durationMs, 0);
      const adjustment = Number((durationMs - targetSum).toFixed(3));
      if (adjustment) {
        const largest = targetPhases.reduce((left, right) =>
          right.durationMs > left.durationMs ? right : left);
        largest.durationMs = Number((largest.durationMs + adjustment).toFixed(3));
      }
      return validateFlowExamplesPhaseTiming({
        durationMs,
        phases:[
          { name:"browser startup", scope:"process", durationMs:Number(browserStartupMs.toFixed(3)) },
          ...targetPhases,
        ],
      });
    },
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

function boundedSnapshot(value, maximumCharacters) {
  let serialized;
  try { serialized = JSON.stringify(value); }
  catch { serialized = String(value); }
  return serialized.length <= maximumCharacters
    ? serialized : `${serialized.slice(0, maximumCharacters - 1)}…`;
}

export async function boundedFlowExamplesReadiness({
  targetId,
  phase,
  predicate,
  observe,
  timeoutMs,
  intervalMs = 25,
  maximumSnapshotCharacters = 400,
  now = () => performance.now(),
  sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
}) {
  const started = now();
  const deadline = started + timeoutMs;
  let lastState;
  while (true) {
    lastState = await observe();
    if (lastState?.ready) return lastState;
    const current = now();
    if (current >= deadline) {
      throw new Error(
        `${targetId} ${phase} timed out waiting for ${predicate} after ` +
        `${Math.round(current - started)}ms; last state ${boundedSnapshot(lastState, maximumSnapshotCharacters)}`,
      );
    }
    await sleep(Math.min(intervalMs, deadline - current));
  }
}
