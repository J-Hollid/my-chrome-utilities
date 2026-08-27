import { invokeVerificationTask, runBoundedVerificationTasks } from "../shared-artifact-parallel.mjs";

function legacyTasks(commands, stage) {
  return (commands ?? []).map((display, index) => ({ display, key:`legacy:${stage}:${index}`, stage }));
}

export async function executeAcceptancePlan(
  plan,
  { runCommand, concurrency = 4, observationConcurrency = 2, afterPreparation,
    acquireArtifactLease, onMetrics } = {},
) {
  if (typeof runCommand !== "function") throw new Error("Provide an acceptance command runner");
  if (!plan.unitCommands && !plan.parserCommands) {
    const commands = plan.commands ?? [...(plan.preparationCommands ?? ["npm run build"]), ...plan.acceptanceCommands];
    for (const command of commands) await runCommand(command);
    return;
  }
  const gateStartedAt = Date.now();
  const metrics = {
    artifactWaitMs:0,
    coordinatorArtifactWaitMs:0,
    observationWorkerCount:observationConcurrency,
    usefulOverlapMs:0,
    browserObservationStageMs:0,
    completeGateMs:0,
  };
  const group = (taskKey, commandKey, stage) => plan[taskKey] ?? legacyTasks(plan[commandKey], stage);
  for (const task of group("preparationTasks", "preparationCommands", "build")) {
    await invokeVerificationTask(task, runCommand);
  }
  const artifactLease = acquireArtifactLease ? await acquireArtifactLease() : undefined;
  metrics.coordinatorArtifactWaitMs = artifactLease?.waitMs ?? 0;
  try {
    if (afterPreparation) await afterPreparation();
    await runBoundedVerificationTasks(
      group("unitTasks", "unitCommands", "unit"), concurrency, runCommand, artifactLease,
    );
    await runBoundedVerificationTasks(
      group("propertyTasks", "propertyCommands", "property"), concurrency, runCommand, artifactLease,
    );

    const browserFailures = [];
    for (const task of group("browserTasks", "browserCommands", "browser")) {
      try { await invokeVerificationTask(task, runCommand, artifactLease); }
      catch (error) { browserFailures.push({ task, error }); }
    }
    const observationFailures = [];
    const observationStartedAt = Date.now();
    let observationIntervals = [];
    try {
      observationIntervals = await runBoundedVerificationTasks(
        group("observationTasks", "observationCommands", "browser-observation"),
        observationConcurrency,
        runCommand,
        artifactLease,
      );
    } catch (error) {
      observationFailures.push(error);
    }
    metrics.browserObservationStageMs = Date.now() - observationStartedAt;
    const observationWorkMs = observationIntervals.reduce(
      (total, interval) => total + interval.completedAt - interval.startedAt, 0);
    metrics.usefulOverlapMs = Math.max(0, observationWorkMs - metrics.browserObservationStageMs);
    if (browserFailures.length || observationFailures.length) {
      const failedDisplays = browserFailures.map(({ task }) => task.display);
      const failedObservations = observationFailures.map(({message}) => message).join("; ");
      throw new AggregateError(
        [...browserFailures.map(({ error }) => error), ...observationFailures],
        `Browser verification failed in ${browserFailures.length} adapter(s) and ${observationFailures.length} observation group(s)${failedDisplays.length ? `: ${failedDisplays.join(", ")}` : ""}${failedObservations ? `; ${failedObservations}` : ""}`,
      );
    }
    await runBoundedVerificationTasks(group("parserTasks", "parserCommands", "acceptance-parse"),
      concurrency, runCommand, artifactLease);
    await runBoundedVerificationTasks(group("generatorTasks", "generatorCommands", "acceptance-generate"),
      concurrency, runCommand, artifactLease);
    for (const task of group("checkpointTasks", "checkpointCommands", "checkpoint")) {
      await invokeVerificationTask(task, runCommand, artifactLease);
    }
    await runBoundedVerificationTasks(group("sessionTasks", "sessionCommands", "acceptance-session"),
      concurrency, runCommand, artifactLease);
    for (const task of group("packageTasks", "packageCommands", "package")) {
      await invokeVerificationTask(task, runCommand, artifactLease);
    }
    return metrics;
  } finally {
    if (artifactLease?.release) await artifactLease.release();
    metrics.completeGateMs = Date.now() - gateStartedAt;
    await onMetrics?.(structuredClone(metrics));
  }
}
