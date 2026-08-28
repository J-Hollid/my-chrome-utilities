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
  { onFailureQuiesced } = {},
) {
  let next = 0;
  let closed = false;
  let causalFailedTaskKey;
  const failures = [];
  const cancellations = [];
  const intervals = [];
  const startedTaskKeys = new Set();
  const runWorker = async() => {
    while (!closed && next < tasks.length) {
      const index = next++;
      const task = tasks[index];
      startedTaskKeys.add(task.key);
      const startedAt = Date.now();
      try {
        await invokeVerificationTask(task, runCommand, artifactLease);
      } catch (error) {
        if (error?.verificationCoordinatorCancellation) {
          cancellations.push({ task, ...error.verificationCoordinatorCancellation });
        } else {
          failures.push({ task, error });
          if (!closed) {
            closed = true;
            causalFailedTaskKey = task.key;
            await runCommand.cancelStage?.({ stage:task.stage, failedTaskKey:task.key });
          }
        }
      } finally {
        intervals.push({taskKey:task.key, startedAt, completedAt:Date.now()});
      }
    }
  };
  const workers = Array.from(
    {length:Math.min(Math.max(1, concurrency), tasks.length)},
    runWorker,
  );
  await Promise.all(workers);
  if (failures.length) {
    const failedTaskKeys = failures.map(({ task }) => task.key ?? task.display);
    const cancelledTaskKeys = cancellations.map(({ task }) => task.key).sort();
    const unstartedTaskKeys = tasks.map(({ key }) => key)
      .filter((key) => !startedTaskKeys.has(key)).sort();
    await onFailureQuiesced?.({
      version:1,
      stage:tasks.find(({ key }) => key === causalFailedTaskKey)?.stage ?? null,
      failedTaskKeys:[...failedTaskKeys].sort(),
      causalFailedTaskKey,
      cancelledTaskKeys,
      unstartedTaskKeys,
      terminationResults:cancellations.map(({ task, signal, escalatedTo }) => ({
        taskKey:task.key, signal:signal ?? null, escalatedTo:escalatedTo ?? null,
      })).sort((left, right) => left.taskKey.localeCompare(right.taskKey)),
      quiesced:true,
    });
    const failedKeys = failures.map(({task}) => task.key ?? task.display);
    throw new AggregateError(
      failures.map(({error}) => error),
      `Verification failed in ${failures.length} independent command(s): ${failedKeys.join(", ")}`,
    );
  }
  return intervals;
}
