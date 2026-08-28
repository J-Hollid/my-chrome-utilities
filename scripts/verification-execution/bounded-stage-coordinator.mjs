import { invokeVerificationTask } from "../shared-artifact-parallel.mjs";

export async function runIncidentAwareBoundedStage(
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
  let cancellationPromise = Promise.resolve();
  const closeStage = (task) => {
    if (closed) return;
    closed = true;
    causalFailedTaskKey = task.key;
    cancellationPromise = Promise.resolve(runCommand.cancelStage?.({
      stage:task.stage, failedTaskKey:task.key,
    }));
  };
  const runWorker = async() => {
    while (!closed && next < tasks.length) {
      const index = next++;
      const task = tasks[index];
      startedTaskKeys.add(task.key);
      const startedAt = Date.now();
      try {
        const stageAwareRunCommand = (display, executableTask) => runCommand(
          display,
          executableTask,
          { onManifestedFailure:() => closeStage(task) },
        );
        await invokeVerificationTask(task, stageAwareRunCommand, artifactLease);
      } catch (error) {
        if (error?.verificationCoordinatorCancellation) {
          cancellations.push({ task, ...error.verificationCoordinatorCancellation });
        } else {
          failures.push({ task, error });
          closeStage(task);
          await cancellationPromise;
        }
      } finally {
        intervals.push({ taskKey:task.key, startedAt, completedAt:Date.now() });
      }
    }
  };
  const workers = Array.from(
    { length:Math.min(Math.max(1, concurrency), tasks.length) },
    runWorker,
  );
  await Promise.all(workers);
  await cancellationPromise;
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
    throw new AggregateError(
      failures.map(({ error }) => error),
      `Verification failed in ${failures.length} independent command(s): ${failedTaskKeys.join(", ")}`,
    );
  }
  return intervals;
}
