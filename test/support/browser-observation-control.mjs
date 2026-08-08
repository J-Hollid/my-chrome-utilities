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
    try { return `${String(value)} (serialization failed: ${error.message})`; }
    catch { return `unprintable diagnostic (serialization failed: ${error.message})`; }
  }
}

export function boundedDiagnostic(value, maximumCharacters) {
  positive(maximumCharacters, "maximumSnapshotCharacters");
  const text = diagnosticText(value);
  if (text.length <= maximumCharacters) return text;
  if (maximumCharacters === 1) return "…";
  return `${text.slice(0, maximumCharacters - 1)}…`;
}

export function browserReadinessProgramSource({
  targetId, phase, timeoutMs, pollIntervalMs, maximumSnapshotCharacters,
}) {
  requiredText(targetId, "targetId");
  requiredText(phase, "phase");
  finiteNonNegative(timeoutMs, "timeoutMs");
  positive(pollIntervalMs, "pollIntervalMs");
  positive(maximumSnapshotCharacters, "maximumSnapshotCharacters");
  const configuration = JSON.stringify({
    targetId, phase, timeoutMs, pollIntervalMs, maximumSnapshotCharacters,
  });
  return `const waitFor=async(read,predicate)=>{const configuration=${configuration},started=performance.now(),deadline=started+configuration.timeoutMs;let last;while(true){last=await read();if(last)return last;const observedAt=performance.now();if(observedAt>=deadline){let diagnostic;try{const encoded=JSON.stringify(last);diagnostic=encoded===undefined?String(last):encoded;}catch(error){diagnostic='snapshot failed: '+error.message;}if(diagnostic.length>configuration.maximumSnapshotCharacters)diagnostic=diagnostic.slice(0,configuration.maximumSnapshotCharacters-1)+'…';throw new Error(configuration.targetId+' '+configuration.phase+' timed out waiting for '+predicate+' after '+Math.max(0,observedAt-started)+'ms; last state '+diagnostic);}await new Promise(resolve=>setTimeout(resolve,Math.min(configuration.pollIntervalMs,deadline-observedAt)));}};`;
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
            `snapshot failed: ${error.message}; observation ${diagnosticText(lastObservation)}`,
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
