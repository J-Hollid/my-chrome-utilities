function finiteNonNegative(value, name) {
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError(`${name} must be finite and non-negative`);
  }
  return value;
}

function positive(value, name) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new TypeError(`${name} must be finite and positive`);
  }
  return value;
}

function requiredText(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${name} must be non-empty text`);
  }
  return value;
}

function diagnosticText(value) {
  try {
    const json = JSON.stringify(value);
    return json === undefined ? String(value) : json;
  } catch (error) {
    const failure = errorText(error);
    try { return `${String(value)} (serialization failed: ${failure})`; }
    catch { return `unprintable diagnostic (serialization failed: ${failure})`; }
  }
}

function errorText(error) {
  try {
    if (error && typeof error.message === "string") return error.message;
    return String(error);
  } catch { return "unprintable error"; }
}

export function boundedDiagnostic(value, maximumCharacters) {
  positive(maximumCharacters, "maximumSnapshotCharacters");
  const text = diagnosticText(value);
  if (text.length <= maximumCharacters) return text;
  if (maximumCharacters === 1) return "…";
  return `${text.slice(0, maximumCharacters - 1)}…`;
}

export function browserReadinessProgramSource({
  targetId, phase, timeoutMs, pollIntervalMs, maximumSnapshotCharacters, stabilityMs = 0,
}) {
  requiredText(targetId, "targetId");
  requiredText(phase, "phase");
  finiteNonNegative(timeoutMs, "timeoutMs");
  positive(pollIntervalMs, "pollIntervalMs");
  positive(maximumSnapshotCharacters, "maximumSnapshotCharacters");
  finiteNonNegative(stabilityMs, "stabilityMs");
  const configuration = JSON.stringify({
    targetId, phase, timeoutMs, pollIntervalMs, maximumSnapshotCharacters, stabilityMs,
  });
  return `const waitFor=async(read,predicateDescription,ready=(value)=>Boolean(value),snapshot=(value)=>value,stabilityMs=${configuration}.stabilityMs)=>{const configuration=${configuration},started=performance.now(),deadline=started+configuration.timeoutMs;let last,readySince;while(true){last=await read();const observedAt=performance.now();if(ready(last)){readySince??=observedAt;if(observedAt-readySince>=stabilityMs)return last;}else readySince=undefined;if(observedAt>=deadline){let diagnostic;try{const diagnosticState=snapshot(last),encoded=JSON.stringify(diagnosticState);diagnostic=encoded===undefined?String(diagnosticState):encoded;}catch(error){let failure;try{failure=error&&typeof error.message==='string'?error.message:String(error);}catch{failure='unprintable error';}diagnostic='snapshot failed: '+failure;}if(diagnostic.length>configuration.maximumSnapshotCharacters)diagnostic=diagnostic.slice(0,configuration.maximumSnapshotCharacters-1)+'…';throw new Error(configuration.targetId+' '+configuration.phase+' timed out waiting for '+predicateDescription+' after '+Math.max(0,observedAt-started)+'ms; last state '+diagnostic);}await new Promise(resolve=>setTimeout(resolve,Math.min(configuration.pollIntervalMs,deadline-observedAt)));}};`;
}

export function observeBrowserReadiness(options) {
  const {
    targetId, phase, predicateDescription, observe, ready, snapshot,
    timeoutMs, pollIntervalMs, maximumSnapshotCharacters, stabilityMs = 0,
    now = () => performance.now(),
    sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  } = options ?? {};
  requiredText(targetId, "targetId");
  requiredText(phase, "phase");
  requiredText(predicateDescription, "predicateDescription");
  finiteNonNegative(timeoutMs, "timeoutMs");
  positive(pollIntervalMs, "pollIntervalMs");
  positive(maximumSnapshotCharacters, "maximumSnapshotCharacters");
  finiteNonNegative(stabilityMs, "stabilityMs");
  if (typeof observe !== "function") throw new TypeError("observe must be a function");
  if (typeof ready !== "function") throw new TypeError("ready must be a function");
  if (typeof snapshot !== "function") throw new TypeError("snapshot must be a function");
  if (typeof now !== "function" || typeof sleep !== "function") {
    throw new TypeError("now and sleep must be functions");
  }

  return (async() => {
    const started = finiteNonNegative(now(), "monotonic clock");
    const deadline = started + timeoutMs;
    let readySince;
    let lastObservation;
    while (true) {
      lastObservation = await observe();
      const observedAt = finiteNonNegative(now(), "monotonic clock");
      if (ready(lastObservation)) {
        readySince ??= observedAt;
        if (observedAt - readySince >= stabilityMs) return lastObservation;
      } else readySince = undefined;

      if (observedAt >= deadline) {
        let diagnostic;
        try { diagnostic = boundedDiagnostic(snapshot(lastObservation), maximumSnapshotCharacters); }
        catch (error) {
          diagnostic = boundedDiagnostic(
            `snapshot failed: ${errorText(error)}; observation ${diagnosticText(lastObservation)}`,
            maximumSnapshotCharacters,
          );
        }
        const elapsedMs = Math.max(0, observedAt - started);
        const timeout = new Error(
          `${targetId} ${phase} timed out waiting for ${predicateDescription} after ${elapsedMs}ms; ` +
          `last state ${diagnostic}`,
        );
        timeout.targetId = targetId;
        timeout.phase = phase;
        timeout.elapsedMs = elapsedMs;
        timeout.snapshot = diagnostic;
        throw timeout;
      }
      await sleep(Math.min(pollIntervalMs, deadline - observedAt));
    }
  })();
}

function roundedMilliseconds(value) {
  return Number(value.toFixed(3));
}

export function createBrowserPhaseTimer({ targetId, phaseNames, now = () => performance.now() } = {}) {
  requiredText(targetId, "targetId");
  if (!Array.isArray(phaseNames) || phaseNames.length === 0 ||
      phaseNames.some((name) => typeof name !== "string" || name.trim() === "") ||
      new Set(phaseNames).size !== phaseNames.length) {
    throw new TypeError("phaseNames must be a non-empty unique ordered schema");
  }
  const durations = new Map(phaseNames.map((name) => [name, 0]));
  const started = finiteNonNegative(now(), "monotonic clock");
  let phaseStarted = started;
  let activePhase = phaseNames[0];
  let finished = false;
  const record = (timestamp) => {
    const elapsed = finiteNonNegative(timestamp - phaseStarted, `${activePhase} duration`);
    durations.set(activePhase, durations.get(activePhase) + elapsed);
    phaseStarted = timestamp;
  };
  return {
    transition(nextPhase) {
      if (finished) throw new Error(`${targetId} phase timing is already complete`);
      if (!durations.has(nextPhase)) throw new Error(`${targetId} undeclared phase transition: ${nextPhase}`);
      const timestamp = finiteNonNegative(now(), "monotonic clock");
      record(timestamp);
      activePhase = nextPhase;
    },
    async scoped(nextPhase, work) {
      if (typeof work !== "function") throw new TypeError("scoped phase work must be a function");
      const callerPhase = activePhase;
      this.transition(nextPhase);
      try { return await work(); }
      finally {
        if (!finished) this.transition(callerPhase);
      }
    },
    finish({ status = "passed", failedAtPhase } = {}) {
      if (finished) throw new Error(`${targetId} phase timing is already complete`);
      const ended = finiteNonNegative(now(), "monotonic clock");
      record(ended);
      finished = true;
      const phases = phaseNames.map((name) => ({
        name, scope:"target", durationMs:roundedMilliseconds(durations.get(name)),
      }));
      const roundedTotal = roundedMilliseconds(phases.reduce((sum, item) => sum + item.durationMs, 0));
      const elapsedDurationMs = roundedMilliseconds(ended - started);
      if (Math.abs(roundedTotal - elapsedDurationMs) > 0.01) {
        throw new Error(`${targetId} target phases do not cover target duration exactly once`);
      }
      const durationMs = roundedTotal;
      return { targetId, status, durationMs, phases,
        ...(status === "failed" ? { activePhase:failedAtPhase ?? activePhase } : {}) };
    },
    get activePhase() { return activePhase; },
  };
}

export function browserProgram({ targetId, phase, source, shape }) {
  requiredText(targetId, "targetId");
  requiredText(phase, "phase");
  if (typeof source !== "string") throw new TypeError("source must be text");
  let program;
  try {
    if (shape === "expression") {
      Function(`return (${source});`);
      program = source;
    } else if (shape === "statements") {
      program = `(async()=>{${source}})()`;
      Function(`return ${program};`);
    } else if (shape === "script") {
      Function(source);
      program = source;
    } else throw new TypeError(`unsupported browser program shape: ${shape}`);
  } catch (error) {
    throw new SyntaxError(`${targetId} ${phase} browser program syntax is invalid: ${error.message}`,
      { cause:error });
  }
  return program;
}

export function transmitBrowserProgram({ targetId, phase, source, shape, transmit }) {
  if (typeof transmit !== "function") throw new TypeError("transmit must be a function");
  const program = browserProgram({ targetId, phase, source, shape });
  return transmit(program);
}

export function transmitDevtoolsProgram({
  targetId, phase, source, shape, call, method = "Runtime.evaluate",
  programParameter = "expression", parameters = {},
}) {
  if (typeof call !== "function") throw new TypeError("call must be a function");
  requiredText(method, "method");
  requiredText(programParameter, "programParameter");
  return transmitBrowserProgram({
    targetId, phase, source, shape,
    transmit:(program) => call(method, { ...parameters, [programParameter]:program }),
  });
}

export function validateBrowserTargetTiming(record, {
  phaseNames,
  applicableNonZeroPhases = [],
  toleranceMilliseconds = 0.01,
} = {}) {
  if (!record || !Array.isArray(record.phases)) {
    throw new TypeError("browser target timing must contain phases");
  }
  if (!Array.isArray(phaseNames) || phaseNames.length === 0) {
    throw new TypeError("phaseNames must declare the ordered timing schema");
  }
  const actualNames = record.phases.map(({ name }) => name);
  if (actualNames.length !== phaseNames.length ||
      actualNames.some((name, index) => name !== phaseNames[index])) {
    throw new Error("browser target timing phases do not match the declared ordered schema");
  }
  if (!Number.isFinite(record.durationMs) || record.durationMs < 0 ||
      record.phases.some(({ durationMs, scope }) =>
        !Number.isFinite(durationMs) || durationMs < 0 || scope !== "target")) {
    throw new Error("browser target timing durations must be finite, non-negative, and target-scoped");
  }
  const phaseTotal = record.phases.reduce((total, { durationMs }) => total + durationMs, 0);
  if (Math.abs(phaseTotal - record.durationMs) > toleranceMilliseconds) {
    throw new Error("browser target timing phases do not conserve the target duration exactly once");
  }
  const durations = new Map(record.phases.map(({ name, durationMs }) => [name, durationMs]));
  if (applicableNonZeroPhases.some((name) => !(durations.get(name) > 0))) {
    throw new Error("browser target timing did not attribute non-zero work to every applicable phase");
  }
  return { phaseNames:actualNames, phaseTotal, durationMs:record.durationMs,
    applicableNonZeroPhases:[...applicableNonZeroPhases] };
}

export function withBrowserDeadline({
  owner, targetId, limitMs, work, onTimeout = () => {},
  schedule = (callback, milliseconds) => setTimeout(callback, milliseconds),
  cancel = (handle) => clearTimeout(handle),
}) {
  requiredText(owner, "owner");
  requiredText(targetId, "targetId");
  positive(limitMs, "limitMs");
  if (typeof work !== "function" || typeof onTimeout !== "function") {
    throw new TypeError("work and onTimeout must be functions");
  }
  let handle;
  const expired = new Promise((unusedResolve, reject) => {
    handle = schedule(() => {
      try { onTimeout(); } catch { /* Deadline identity remains primary. */ }
      const error = new Error(`${targetId} ${owner} exceeded its bounded ${limitMs}ms deadline`);
      error.deadlineOwner = owner;
      error.targetId = targetId;
      reject(error);
    }, limitMs);
  });
  return Promise.race([Promise.resolve().then(work), expired]).finally(() => cancel(handle));
}

export function browserDeadlineError(owner, targetId, limitMs, details = "") {
  requiredText(owner, "owner");
  requiredText(targetId, "targetId");
  positive(limitMs, "limitMs");
  const error = new Error(
    `${targetId} ${owner} exceeded its bounded ${limitMs}ms deadline${details ? `; ${details}` : ""}`,
  );
  error.deadlineOwner = owner;
  error.targetId = targetId;
  return error;
}

export function withDevtoolsProtocolDeadline({ targetId, method, limitMs = 120_000, work,
  onTimeout = () => {}, schedule, cancel }) {
  requiredText(method, "method");
  return withBrowserDeadline({
    owner:"DevTools protocol call", targetId, limitMs, work, onTimeout, schedule, cancel,
  }).catch((error) => {
    if (error?.deadlineOwner === "DevTools protocol call") {
      error.message += ` while waiting for ${method}`;
      error.method = method;
    }
    throw error;
  });
}

export function withLogicalTargetDeadline({ targetId, limitMs = 120_000, work,
  onTimeout = () => {}, schedule, cancel }) {
  return withBrowserDeadline({
    owner:"logical target outer work", targetId, limitMs, work, onTimeout, schedule, cancel,
  });
}

export function withLogicalTargetLifecycle({
  targetId,
  boundary,
  limitMs = 120_000,
  cleanupLimitMs = Math.min(5_000, limitMs),
  work,
  cleanup,
  finalize = () => {},
  onTimeout = () => {},
  schedule,
  cancel,
  now = () => performance.now(),
}) {
  requiredText(boundary, "boundary");
  positive(limitMs, "limitMs");
  positive(cleanupLimitMs, "cleanupLimitMs");
  if (typeof work !== "function" || typeof cleanup !== "function" ||
      typeof finalize !== "function" || typeof onTimeout !== "function") {
    throw new TypeError("work, cleanup, finalize, and onTimeout must be functions");
  }
  const scheduleDeadline = schedule ?? ((callback, milliseconds) => setTimeout(callback, milliseconds));
  const cancelDeadline = cancel ?? ((handle) => clearTimeout(handle));
  const started = finiteNonNegative(now(), "monotonic clock");
  const controller = new AbortController();
  let cleanupPromise;
  let finalized = false;
  let timeoutHandle;
  let deadlineFailure;
  const remainingMilliseconds = () => Math.max(0, limitMs -
    (finiteNonNegative(now(), "monotonic clock") - started));
  const startCleanup = (failure) => {
    if (cleanupPromise) return cleanupPromise;
    try {
      cleanupPromise = Promise.resolve(cleanup({ failure, signal:controller.signal }));
    } catch (error) { cleanupPromise = Promise.reject(error); }
    return cleanupPromise;
  };
  const finalizeOnce = (failure) => {
    if (finalized) return;
    finalized = true;
    finalize({ failure });
  };
  let resolveDeadline;
  const deadline = new Promise((resolve) => { resolveDeadline = resolve; });
  timeoutHandle = scheduleDeadline(() => {
    const error = browserDeadlineError("logical target outer work", targetId, limitMs);
    error.logicalBoundary = boundary;
    deadlineFailure = error;
    controller.abort(error);
    try { onTimeout(); } catch { /* Deadline identity remains primary. */ }
    resolveDeadline({ kind:"deadline", failure:error });
  }, limitMs);
  const cleanupOutcome = (failure) => startCleanup(failure).then(
    () => ({ kind:"cleanup" }),
    (cleanupFailure) => ({ kind:"cleanup", failure:cleanupFailure }),
  );
  const finishAbortedCleanup = async (failure) => {
    let cleanupTimeoutHandle;
    const cleanupTimeout = new Promise((resolve) => {
      cleanupTimeoutHandle = scheduleDeadline(
        () => resolve({ kind:"cleanup-timeout" }), cleanupLimitMs,
      );
    });
    const outcome = await Promise.race([cleanupOutcome(failure), cleanupTimeout]);
    cancelDeadline(cleanupTimeoutHandle);
    if (outcome.kind === "cleanup-timeout") failure.cleanupTimedOut = true;
    else if (outcome.failure !== undefined) failure.cleanupFailure = outcome.failure;
  };
  const lifecycle = async () => {
    const workOutcome = Promise.resolve()
      .then(() => work({ signal:controller.signal, remainingMilliseconds }))
      .then((result) => ({ kind:"work", result }),
        (failure) => ({ kind:"work", failure }));
    const first = await Promise.race([workOutcome, deadline]);
    if (first.kind === "deadline") {
      await finishAbortedCleanup(first.failure);
      finalizeOnce(first.failure);
      throw first.failure;
    }
    const cleaned = await Promise.race([cleanupOutcome(first.failure), deadline]);
    if (cleaned.kind === "deadline") {
      await finishAbortedCleanup(cleaned.failure);
      finalizeOnce(cleaned.failure);
      throw cleaned.failure;
    }
    if (cleaned.failure !== undefined) {
      const cleanupFailure = cleaned.failure;
      if (first.failure && cleanupFailure?.cause === undefined) cleanupFailure.cause = first.failure;
      finalizeOnce(cleanupFailure);
      throw cleanupFailure;
    }
    finalizeOnce(first.failure);
    if (first.failure) throw first.failure;
    return first.result;
  };
  return lifecycle().catch((error) => {
    error.logicalBoundary ??= boundary;
    throw error;
  }).finally(() => {
    if (!deadlineFailure) cancelDeadline(timeoutHandle);
  });
}

export function waitForChromeDebuggingPort({
  chrome, targetId, limitMs = 30_000, maximumStderrCharacters = 2_000,
  schedule, cancel,
}) {
  if (!chrome?.stderr || typeof chrome.stderr.on !== "function") {
    throw new TypeError("chrome.stderr must be an event emitter");
  }
  positive(maximumStderrCharacters, "maximumStderrCharacters");
  let stderr = "";
  let removeListeners = () => {};
  const work = () => new Promise((resolve, reject) => {
    const onData = (chunk) => {
      stderr = `${stderr}${chunk}`.slice(-maximumStderrCharacters);
      const match = stderr.match(/ws:\/\/127\.0\.0\.1:(\d+)\//u);
      if (match) { removeListeners();resolve(Number(match[1])); }
    };
    const onError = (error) => { removeListeners();reject(error); };
    removeListeners = () => {
      chrome.stderr.off?.("data", onData);
      chrome.off?.("error", onError);
    };
    chrome.stderr.on("data", onData);
    chrome.once("error", onError);
  });
  return withBrowserDeadline({
    owner:"Chrome debug-port startup", targetId, limitMs, work,
    onTimeout:() => removeListeners(), schedule, cancel,
  }).catch((error) => {
    if (error?.deadlineOwner === "Chrome debug-port startup") {
      error.snapshot = boundedDiagnostic(stderr, maximumStderrCharacters);
      error.message += `; bounded stderr ${error.snapshot}`;
    }
    throw error;
  });
}
