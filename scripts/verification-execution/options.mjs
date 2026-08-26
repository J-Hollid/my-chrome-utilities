import path from "node:path";

function valueArgument(args, index, option) {
  const value = args[index + 1];
  if (value === undefined || value === "" || value.startsWith("--")) {
    throw new Error(`Provide a non-empty value for ${option}`);
  }
  return value;
}

function changedPath(value) {
  if (path.isAbsolute(value) || value.includes("\\") || value.includes("\0") ||
      value === "." || value === ".." || value.startsWith("../") ||
      path.posix.normalize(value) !== value) {
    throw new Error(`Use a normalized repository-relative path with --changed: ${value}`);
  }
  return value;
}

function stableTask(value) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/u.test(value)) {
    throw new Error(`Use a stable evidence task name: ${value}`);
  }
  return value;
}

export function parseFocusedAcceptanceArguments(args) {
  const options = {
    packIds:[], changedPaths:[], terminalFull:false, includeProperties:false,
    withDependencies:false, skipBuild:false, changedSince:undefined, shard:undefined,
    prepareEvidence:undefined, browserTargetIds:[], focusedTaskKeys:[],
  };
  const reliabilityOptionAliases = new Map([
    ["--reliability-diagnostic-retry", "--timeout-diagnostic-retry"],
    ["--reliability-repair-incident", "--timeout-repair-incident"],
    ["--reliability-repair-focused", "--timeout-repair-focused"],
    ["--reliability-regression", "--timeout-regression"],
    ["--reliability-causal-category", "--timeout-causal-category"],
    ["--reliability-causal-explanation", "--timeout-causal-explanation"],
  ]);
  const seen = new Set();
  const once = (name) => {
    if (seen.has(name)) throw new Error(`Specify ${name} once`);
    seen.add(name);
  };
  for (let index = 0; index < args.length; index += 1) {
    const argument = reliabilityOptionAliases.get(args[index]) ?? args[index];
    if (["--full", "--property", "--with-dependencies", "--no-build"].includes(argument)) {
      once(argument);
      if (argument === "--full") options.terminalFull = true;
      else if (argument === "--property") options.includeProperties = true;
      else if (argument === "--with-dependencies") options.withDependencies = true;
      else options.skipBuild = true;
      continue;
    }
    if (argument === "--run-intent-bootstrap") {
      once(argument);
      options.runIntentBootstrap = true;
      continue;
    }
    if (argument === "--changed-since") {
      once(argument);
      const value = valueArgument(args, index, argument);
      if (value.startsWith("-") || /\s/u.test(value)) {
        throw new Error(`Use a Git revision with ${argument}: ${value}`);
      }
      options.changedSince = value;
      index += 1;
      continue;
    }
    if (argument === "--prepare-evidence") {
      once(argument);
      options.prepareEvidence = stableTask(valueArgument(args, index, argument));
      index += 1;
      continue;
    }
    if (["--timeout-diagnostic-retry", "--timeout-repair-incident",
      "--timeout-repair-focused"].includes(argument)) {
      once(argument);
      const value = valueArgument(args, index, argument);
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u.test(value)) {
        throw new Error(`Use a stable reliability incident id with ${argument}`);
      }
      if (argument === "--timeout-diagnostic-retry") options.timeoutDiagnosticRetry = value;
      else if (argument === "--timeout-repair-incident") options.timeoutRepairIncident = value;
      else options.timeoutRepairFocused = value;
      index += 1;
      continue;
    }
    if (["--timeout-regression", "--timeout-causal-category",
      "--timeout-causal-explanation"].includes(argument)) {
      once(argument);
      const value = valueArgument(args, index, argument);
      if (argument === "--timeout-regression") options.timeoutRegression = value;
      else if (argument === "--timeout-causal-category") options.timeoutCausalCategory = value;
      else options.timeoutCausalExplanation = value;
      index += 1;
      continue;
    }
    if (argument === "--resume-receipt") {
      once(argument);
      const value = changedPath(valueArgument(args, index, argument));
      if (!/^tmp\/verification-receipts\/[A-Za-z0-9._-]+\.json$/u.test(value)) {
        throw new Error("Resume receipts must be runner-owned under tmp/verification-receipts");
      }
      options.resumeReceipt = value;
      index += 1;
      continue;
    }
    if (argument === "--record-evidence") {
      throw new Error("Use --prepare-evidence; record the pending file only after verification exits");
    }
    if (argument === "--shard") {
      once(argument);
      const value = valueArgument(args, index, argument);
      const match = /^(\d+)\/(\d+)$/u.exec(value);
      if (!match || Number(match[1]) < 1 || Number(match[1]) > Number(match[2])) {
        throw new Error(`Use --shard <index>/<count>: ${value}`);
      }
      options.shard = { index:Number(match[1]) - 1, count:Number(match[2]) };
      index += 1;
      continue;
    }
    if (argument === "--pack") {
      const value = valueArgument(args, index, argument);
      if (!/^[a-z0-9][a-z0-9_-]*$/u.test(value)) throw new Error(`Use a valid pack id: ${value}`);
      if (options.packIds.includes(value)) throw new Error(`Select every explicit pack once: ${value}`);
      options.packIds.push(value);
      index += 1;
      continue;
    }
    if (argument === "--browser-target") {
      const value = valueArgument(args, index, argument);
      if (!/^[A-Za-z0-9][A-Za-z0-9_:.-]*$/u.test(value)) {
        throw new Error(`Use a stable browser target id: ${value}`);
      }
      if (options.browserTargetIds.includes(value)) {
        throw new Error(`Select every focused browser target once: ${value}`);
      }
      options.browserTargetIds.push(value);
      index += 1;
      continue;
    }
    if (argument === "--focused-task") {
      const value = valueArgument(args, index, argument);
      if (!/^[A-Za-z0-9][A-Za-z0-9_:/+.-]{0,511}$/u.test(value)) {
        throw new Error(`Use a canonical registered task key with ${argument}: ${value}`);
      }
      if (options.focusedTaskKeys.includes(value)) {
        throw new Error(`Select every focused task once: ${value}`);
      }
      options.focusedTaskKeys.push(value);
      index += 1;
      continue;
    }
    if (argument === "--changed") {
      const value = changedPath(valueArgument(args, index, argument));
      if (options.changedPaths.includes(value)) throw new Error(`Select every changed path once: ${value}`);
      options.changedPaths.push(value);
      index += 1;
      continue;
    }
    throw new Error(`Unknown verification option: ${argument}`);
  }
  return options;
}
