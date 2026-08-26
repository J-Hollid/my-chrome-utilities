export function estimateTaskTiming(task, model) {
  const exact = model.tasks?.[task.key];
  if (exact?.samples > 0 && Number.isFinite(exact.medianMs)) {
    return { milliseconds:exact.medianMs, source:"exact task samples" };
  }
  if (task.stage === "browser-observation" && task.logicalTargetIds?.length) {
    const targetSamples = task.logicalTargetIds.map((id) => model.browserTargets?.[id]);
    if (targetSamples.every((timing) => timing?.samples > 0 && Number.isFinite(timing.medianMs))) {
      return { milliseconds:targetSamples.reduce((sum, timing) => sum + timing.medianMs, 0) +
        (model.browserObservationSessionOverheadMilliseconds ?? 0),
      source:"composed target samples" };
    }
    const targetFallbacks = task.logicalTargetIds.map((id) => model.browserTargetFallbacks?.[id]);
    if (targetFallbacks.every(Number.isFinite)) {
      return { milliseconds:targetFallbacks.reduce((sum, duration) => sum + duration, 0),
        source:"bootstrap fallback" };
    }
  }
  return { milliseconds:model.stages?.[task.stage]?.medianMs ?? 1000,
    source:"bootstrap fallback" };
}

function sequentialStageEstimate(tasks, model) {
  const timings = tasks.map((task) => estimateTaskTiming(task, model));
  return { milliseconds:timings.reduce((sum, timing) => sum + timing.milliseconds, 0), timings };
}

function boundedStageEstimate(tasks, concurrency, model) {
  if (!tasks.length) return { milliseconds:0, timings:[] };
  const workerLoads = Array.from({ length:Math.max(1, Math.min(concurrency, tasks.length)) },
    () => 0);
  const timings = tasks.map((task) => estimateTaskTiming(task, model));
  for (const timing of timings) {
    let nextWorker = 0;
    for (let index = 1; index < workerLoads.length; index += 1) {
      if (workerLoads[index] < workerLoads[nextWorker]) nextWorker = index;
    }
    workerLoads[nextWorker] += timing.milliseconds;
  }
  return { milliseconds:Math.max(...workerLoads), timings };
}

export function boundedStageMilliseconds(tasks, concurrency, model) {
  return boundedStageEstimate(tasks, concurrency, model).milliseconds;
}

export function estimatePlan(plan, model, { concurrency = 4, observationConcurrency = 2 } = {}) {
  const stages = [
    sequentialStageEstimate(plan.preparationTasks, model),
    boundedStageEstimate(plan.unitTasks, concurrency, model),
    boundedStageEstimate(plan.propertyTasks, concurrency, model),
    sequentialStageEstimate(plan.browserTasks, model),
    boundedStageEstimate(plan.observationTasks, observationConcurrency, model),
    boundedStageEstimate(plan.parserTasks, concurrency, model),
    boundedStageEstimate(plan.generatorTasks, concurrency, model),
    sequentialStageEstimate(plan.checkpointTasks, model),
    boundedStageEstimate(plan.sessionTasks, concurrency, model),
  ];
  const timingSources = {};
  for (const { timings } of stages) {
    for (const { source } of timings) timingSources[source] = (timingSources[source] ?? 0) + 1;
  }
  return { milliseconds:stages.reduce((sum, stage) => sum + stage.milliseconds, 0),
    timingSources };
}

export function estimatePlanMilliseconds(plan, model, options = {}) {
  return estimatePlan(plan, model, options).milliseconds;
}
