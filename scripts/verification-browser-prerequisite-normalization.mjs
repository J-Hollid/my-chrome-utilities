const browserTargets = (task) => task.stage === "browser-observation" &&
  Array.isArray(task.logicalTargetIds) && task.logicalTargetIds.length
  ? [...task.logicalTargetIds] : [];

function compatibleBrowserExecution(source, canonical, target) {
  return source.packId === canonical.packId && source.executable === canonical.executable &&
    source.args?.[0] === canonical.args?.[0] &&
    JSON.stringify([...(source.requiredCapabilities ?? [])].sort()) ===
      JSON.stringify([...(canonical.requiredCapabilities ?? [])].sort()) &&
    source.environment?.[target] === canonical.environment?.[target];
}

export function normalizeBrowserPrerequisiteTasks(tasks, canonicalTasks, validateTask) {
  if (!Array.isArray(tasks) || !Array.isArray(canonicalTasks)) {
    throw new Error("Browser prerequisite normalization requires task lists");
  }
  const canonicalBrowsers = canonicalTasks.filter((task) => browserTargets(task).length);
  const replacements = new Map();
  const selectedKeys = new Set();
  for (const task of tasks) {
    validateTask(task);
    const targets = browserTargets(task);
    if (!targets.length) {
      selectedKeys.add(task.key);
      continue;
    }
    if (new Set(targets).size !== targets.length) {
      throw new Error(`Ambiguous browser target declaration for ${task.key}`);
    }
    const keys = new Set();
    for (const target of targets) {
      const matches = canonicalBrowsers.filter((candidate) => browserTargets(candidate).includes(target));
      if (matches.length === 0) throw new Error(`Missing current canonical browser target boundary for ${target}`);
      if (matches.length !== 1) throw new Error(`Ambiguous current canonical browser target boundary for ${target}`);
      if (!compatibleBrowserExecution(task, matches[0], target)) {
        throw new Error(`Incompatible browser execution contract for ${target}`);
      }
      keys.add(matches[0].key);
      selectedKeys.add(matches[0].key);
    }
    replacements.set(task.key, [...keys]);
  }
  const requestedByKey = new Map(tasks.map((task) => [task.key, task]));
  const sourceFor = (key) => requestedByKey.get(key) ?? canonicalTasks.find((task) => task.key === key);
  const normalized = [];
  for (const task of [...canonicalTasks, ...tasks]) {
    if (!selectedKeys.has(task.key) || normalized.some((candidate) => candidate.key === task.key)) continue;
    const source = sourceFor(task.key) ?? task;
    const prerequisites = source.prerequisiteTaskKeys?.flatMap((key) => replacements.get(key) ?? [key]);
    normalized.push(prerequisites === undefined ? source : {
      ...source, prerequisiteTaskKeys:[...new Set(prerequisites)],
    });
  }
  if (normalized.length !== selectedKeys.size) {
    throw new Error("Browser prerequisite normalization has an ambiguous canonical task");
  }
  const assigned = new Set();
  for (const task of normalized) {
    for (const target of browserTargets(task)) {
      if (assigned.has(target)) throw new Error(`Browser target ${target} remains assigned more than once`);
      assigned.add(target);
    }
  }
  return normalized;
}
