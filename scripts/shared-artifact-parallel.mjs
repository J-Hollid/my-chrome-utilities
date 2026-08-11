function positiveWorkerCount(value) {
  if (!Number.isInteger(value) || value < 1) {
    throw new TypeError(`Worker count must be a positive integer; received ${value}.`);
  }
  return value;
}

function measuredTask(task) {
  if (typeof task?.key !== "string" || !Number.isFinite(task.durationMs) || task.durationMs < 0) {
    throw new TypeError("A scheduled browser task requires a key and non-negative measured duration.");
  }
  return task;
}

export function deterministicBrowserWorkerSchedule(tasks, workerCount) {
  positiveWorkerCount(workerCount);
  const measured = tasks.map(measuredTask);
  const eligible = measured.filter(({isolated}) => isolated).sort((left, right) =>
    right.durationMs - left.durationMs || left.key.localeCompare(right.key));
  const parallel = Array.from({length:Math.min(workerCount, eligible.length)}, () => ({
    loadMs:0,
    taskKeys:[],
  }));
  for (const task of eligible) {
    const worker = parallel.reduce((selected, candidate, index) =>
      candidate.loadMs < parallel[selected].loadMs ? index : selected, 0);
    parallel[worker].taskKeys.push(task.key);
    parallel[worker].loadMs += task.durationMs;
  }
  return {
    parallel,
    serial:measured.filter(({isolated}) => !isolated).map(({key}) => key).sort(),
  };
}

function validLayeredSample(sample, mode) {
  return sample?.mode === mode && sample.packId === "layered_schema" &&
    Number.isFinite(sample.durationMs) && sample.durationMs >= 0 && sample.passed === true &&
    Array.isArray(sample.collisions ?? []) && (sample.collisions ?? []).length === 0;
}

export function decideBrowserObservationWorkers({
  acceptedTwoWorker,
  candidateThreeWorkerNormal,
  candidateThreeWorkerLoaded,
  minimumSavingsMs = 60_000,
}) {
  const comparableBaseline = validLayeredSample({ ...acceptedTwoWorker, collisions:[] }, "normal");
  const normalPassed = validLayeredSample(candidateThreeWorkerNormal, "normal");
  const loadedPassed = validLayeredSample(candidateThreeWorkerLoaded, "loaded");
  const savingsMs = comparableBaseline && normalPassed
    ? acceptedTwoWorker.durationMs - candidateThreeWorkerNormal.durationMs
    : 0;
  const accepted = normalPassed && loadedPassed && savingsMs >= minimumSavingsMs;
  return {
    workerCount:accepted ? 3 : 2,
    savingsMs,
    normalPassed,
    loadedPassed,
    retryAtLowerConcurrency:false,
  };
}
