import { invokeVerificationTask } from "../shared-artifact-parallel.mjs";
import { runIncidentAwareBoundedStage } from "./bounded-stage-coordinator.mjs";

function legacyTasks(commands, stage) {
  return (commands ?? []).map((display, index) => ({ display, key:`legacy:${stage}:${index}`, stage }));
}

export async function executeAcceptancePlan(
  plan,
  { runCommand, concurrency = 4, observationConcurrency = 2, afterPreparation,
    acquireArtifactLease, onMetrics, onFailureQuiesced } = {},
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
    await runIncidentAwareBoundedStage(
      group("unitTasks", "unitCommands", "unit"), concurrency, runCommand, artifactLease,
      { onFailureQuiesced },
    );
    await runIncidentAwareBoundedStage(
      group("propertyTasks", "propertyCommands", "property"), concurrency, runCommand, artifactLease,
      { onFailureQuiesced },
    );

    await runIncidentAwareBoundedStage(
      group("browserTasks", "browserCommands", "browser"), 1, runCommand, artifactLease,
      { onFailureQuiesced },
    );
    const observationStartedAt = Date.now();
    const observationIntervals = await runIncidentAwareBoundedStage(
      group("observationTasks", "observationCommands", "browser-observation"),
      observationConcurrency,
      runCommand,
      artifactLease,
      { onFailureQuiesced },
    );
    metrics.browserObservationStageMs = Date.now() - observationStartedAt;
    const observationWorkMs = observationIntervals.reduce(
      (total, interval) => total + interval.completedAt - interval.startedAt, 0);
    metrics.usefulOverlapMs = Math.max(0, observationWorkMs - metrics.browserObservationStageMs);
    await runIncidentAwareBoundedStage(group("parserTasks", "parserCommands", "acceptance-parse"),
      concurrency, runCommand, artifactLease, { onFailureQuiesced });
    await runIncidentAwareBoundedStage(group("generatorTasks", "generatorCommands", "acceptance-generate"),
      concurrency, runCommand, artifactLease, { onFailureQuiesced });
    for (const task of group("checkpointTasks", "checkpointCommands", "checkpoint")) {
      await invokeVerificationTask(task, runCommand, artifactLease);
    }
    await runIncidentAwareBoundedStage(group("sessionTasks", "sessionCommands", "acceptance-session"),
      concurrency, runCommand, artifactLease, { onFailureQuiesced });
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
