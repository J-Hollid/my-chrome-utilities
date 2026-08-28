function positiveWorkerCount(value) {
  if (!Number.isInteger(value) || value < 1) {
    throw new TypeError(`Worker count must be a positive integer; received ${value}.`);
  }
  return value;
}

function measuredTask(task) {
  if (typeof task?.key !== "string") {
    throw new TypeError("A scheduled browser task requires a string key.");
  }
  if (!Number.isFinite(task.durationMs) || task.durationMs < 0) {
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
  if (sample?.mode !== mode) return false;
  if (sample.packId !== "layered_schema") return false;
  if (!Number.isFinite(sample.durationMs) || sample.durationMs < 0) return false;
  if (sample.passed !== true) return false;
  const collisions = sample.collisions ?? [];
  return Array.isArray(collisions) && collisions.length === 0;
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

export function artifactLeaseAccess(task) {
  if (task.stage === "build" || task.stage === "package") return "write";
  if (task.executable === "npm" && task.args?.includes("package")) return "write";
  return "read";
}

export async function invokeVerificationTask(task, runCommand, artifactLease) {
  const executableTask = artifactLease ? {
    ...task,
    artifactLease:{token:artifactLease.token, access:artifactLeaseAccess(task)},
  } : task;
  return runCommand(task.display, executableTask);
}

export async function runBoundedVerificationTasks(
  tasks,
  concurrency,
  runCommand,
  artifactLease,
) {
  let next = 0;
  const failures = [];
  const intervals = [];
  const runWorker = async() => {
    while (next < tasks.length) {
      const index = next++;
      const startedAt = Date.now();
      try {
        await invokeVerificationTask(tasks[index], runCommand, artifactLease);
      } catch (error) {
        failures.push({task:tasks[index], error});
      } finally {
        intervals.push({taskKey:tasks[index].key, startedAt, completedAt:Date.now()});
      }
    }
  };
  const workers = Array.from(
    {length:Math.min(Math.max(1, concurrency), tasks.length)},
    runWorker,
  );
  await Promise.all(workers);
  if (failures.length) {
    const failedKeys = failures.map(({task}) => task.key ?? task.display);
    throw new AggregateError(
      failures.map(({error}) => error),
      `Verification failed in ${failures.length} independent command(s): ${failedKeys.join(", ")}`,
    );
  }
  return intervals;
}
