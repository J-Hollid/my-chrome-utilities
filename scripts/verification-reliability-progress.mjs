import {
  boundedState, exactObject, timeoutIncidentDigest,
} from "./verification-reliability-values.mjs";

function executableCaseIdentity(record) {
  if (record.caseId === undefined && record.executionArgs === undefined) return {};
  if (typeof record.caseId !== "string" || !record.caseId || record.caseId.length > 256 ||
      /[\u0000-\u001f\u007f]/u.test(record.caseId)) {
    throw new Error("case progress requires a bounded case id");
  }
  if (record.executionArgs === undefined) return { caseId:record.caseId };
  if (!Array.isArray(record.executionArgs) || record.executionArgs.length < 1 ||
      record.executionArgs.length > 32 || record.executionArgs.some((argument) =>
        typeof argument !== "string" || !argument || argument.length > 512 ||
        /[\u0000-\u001f\u007f]/u.test(argument)) ||
      JSON.stringify(record.executionArgs).length > 4096) {
    throw new Error("case progress requires bounded executable arguments");
  }
  return { caseId:record.caseId, executionArgs:[...record.executionArgs] };
}

export function createVerificationProgressTracker({ taskKey, maximumStateCharacters = 2048 } = {}) {
  if (typeof taskKey !== "string" || !taskKey) throw new Error("Progress requires a canonical task key");
  if (!Number.isInteger(maximumStateCharacters) || maximumStateCharacters < 32) {
    throw new Error("Progress state limit must be at least 32 characters");
  }
  let last;
  const diagnostics = [];
  return {
    accept(record) {
      try {
        exactObject(record, "Progress record");
        if (record.version !== 1 || !Number.isInteger(record.sequence) || record.sequence < 1 ||
            !Number.isFinite(record.monotonicMs) || record.monotonicMs < 0 ||
            !["process", "artifact/setup", "target", "cleanup"].includes(record.boundary)) {
          throw new Error("invalid progress schema");
        }
        if (record.taskKey !== undefined && record.taskKey !== taskKey) throw new Error("cross-task progress");
        if (last && (record.sequence <= last.sequence || record.monotonicMs < last.monotonicMs ||
            last.completed === true)) throw new Error("duplicate, out-of-order, or post-completion progress");
        if (record.boundary === "target" &&
            (typeof record.logicalTargetId !== "string" || !record.logicalTargetId)) {
          throw new Error("target progress requires a logical target id");
        }
        const caseIdentity = executableCaseIdentity(record);
        last = {
          version:1, taskKey, sequence:record.sequence, monotonicMs:record.monotonicMs,
          boundary:record.boundary,
          ...(record.logicalTargetId ? { logicalTargetId:record.logicalTargetId } : {}),
          ...(record.phase ? { phase:record.phase } : {}),
          ...caseIdentity,
          ...(record.assertionSite ? { assertionSite:record.assertionSite } : {}),
          ...(record.deadlineOwner ? { deadlineOwner:record.deadlineOwner } : {}),
          ...(record.failureFingerprint ? { failureFingerprint:record.failureFingerprint } : {}),
          ...(record.completed === true ? { completed:true } : {}),
          ...(record.state === undefined ? {} : { state:boundedState(record.state, maximumStateCharacters) }),
        };
        return true;
      } catch (error) {
        diagnostics.push(error.message);
        return false;
      }
    },
    acceptLine(line) {
      try {
        const progress = JSON.parse(line)?.swarmforgeVerificationProgress;
        return progress ? this.accept(progress) : false;
      } catch { return false; }
    },
    snapshot:() => last ? structuredClone(last) : undefined,
    diagnostics:() => [...diagnostics],
  };
}

export function verificationProgressEmitter({ emit = console.log, now = () => performance.now() } = {}) {
  let sequence = Number(process.env.SWARMFORGE_PROGRESS_SEQUENCE_START ?? 0);
  const offset = Number(process.env.SWARMFORGE_PROGRESS_MONOTONIC_OFFSET ?? 0);
  const started = now();
  return (record) => emit(JSON.stringify({ swarmforgeVerificationProgress:{
    version:1, sequence:++sequence, monotonicMs:Math.max(0, offset + now() - started), ...record,
  } }));
}

export function diagnosticRetryScope({ task, lastProgress } = {}) {
  exactObject(task, "Failed task");
  if (lastProgress?.caseId && Array.isArray(lastProgress.executionArgs)) {
    return { kind:"case", caseId:lastProgress.caseId, executionArgs:[...lastProgress.executionArgs] };
  }
  if (task.stage !== "browser-observation") {
    return { kind:"task", taskKey:task.key, executionArgs:[...(task.args ?? [])] };
  }
  if (!lastProgress) throw new Error("A browser failure has no trusted progress; repair the progress contract first");
  if (lastProgress.boundary === "target" && lastProgress.logicalTargetId) {
    return {
      kind:"target", logicalTargetIds:[lastProgress.logicalTargetId],
      executionArgs:["scripts/run-browser-observation.mjs", lastProgress.logicalTargetId],
    };
  }
  if (lastProgress.boundary === "artifact/setup") {
    return {
      kind:"setup", phase:lastProgress.phase ?? "shared-setup", logicalTargetIds:[],
      executionArgs:["scripts/run-browser-observation.mjs", "--setup-only"],
    };
  }
  throw new Error("A browser failure has no unambiguous trusted target or setup boundary");
}

export function classifyHistoricalTimeoutFixture(fixture) {
  exactObject(fixture, "Historical timeout fixture");
  if (fixture.runId !== "1686032b-39aa-4140-a4db-f4f265e28eb5" ||
      fixture.durationMs !== 600014 || fixture.passedTaskCount !== 274 ||
      fixture.lastProgress?.boundary !== "artifact/setup" ||
      fixture.lastProgress?.phase !== "dist-artifact-lock") {
    throw new Error("Historical Capture timeout fixture does not match its sanitized contract");
  }
  return {
    boundary:"artifact/setup",
    retry:{ kind:"setup", phase:"dist-artifact-lock", logicalTargetIds:[] },
    excludedPassedTaskCount:fixture.passedTaskCount,
    excludedLogicalTargetIds:[...(fixture.task?.logicalTargetIds ?? [])],
    lockOwner:structuredClone(fixture.lastProgress.state?.owner),
    retroactiveIncident:false,
  };
}

export function retryIdentity(failure) {
  return timeoutIncidentDigest({
    lineage:failure.lineage, task:failure.task, configuredTimeoutMs:failure.configuredTimeoutMs,
    applicableLimit:failure.applicableLimit, fingerprint:failure.fingerprint,
    environment:failure.environment, artifact:failure.artifact, planDigest:failure.planDigest,
    scope:diagnosticRetryScope({ task:failure.task,
      lastProgress:failure.failedBoundary ?? failure.lastProgress }),
  });
}
