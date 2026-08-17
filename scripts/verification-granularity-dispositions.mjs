import {execFile} from "node:child_process";
import {readFile} from "node:fs/promises";
import {promisify} from "node:util";

const execFileAsync = promisify(execFile);

const repositoryPath = (value) => typeof value === "string" && value.length > 0 &&
  !value.startsWith("/") && !value.startsWith(".") && !value.includes("\\") &&
  !value.includes("\0") && !value.includes("//") &&
  !value.split("/").some((segment) => segment === "." || segment === "..");
const stableIdentity = (value) => typeof value === "string" &&
  /^[a-z0-9][a-z0-9_-]*$/u.test(value);

export function validateGranularityDispositions(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.dispositions)) {
    throw new Error("Granularity dispositions require version 1");
  }
  const identities = new Set();
  const dispositions = value.dispositions.map((entry) => {
    if (!entry || !stableIdentity(entry.task) || !repositoryPath(entry.path) ||
        !["integrated-seam", "parent-fallback"].includes(entry.decision) ||
        entry.reviewAuthority !== "qa-integration" ||
        typeof entry.reason !== "string" || !entry.reason.trim() ||
        !Array.isArray(entry.replacementPaths) ||
        entry.replacementPaths.some((path) => !repositoryPath(path)) ||
        entry.replacementPaths.length !== new Set(entry.replacementPaths).size ||
        (entry.decision === "integrated-seam") !== (entry.replacementPaths.length > 0)) {
      throw new Error("Granularity disposition requires an exact reviewed seam or parent fallback");
    }
    const identity = `${entry.task}\0${entry.path}`;
    if (identities.has(identity)) throw new Error("Granularity dispositions must be unique per task and path");
    identities.add(identity);
    return {...entry, replacementPaths:[...entry.replacementPaths].sort()};
  });
  return {version:1, dispositions:dispositions.sort((left, right) =>
    `${left.task}\0${left.path}`.localeCompare(`${right.task}\0${right.path}`))};
}

export async function loadGranularityDispositions(
  path = new URL("../verification/granularity-dispositions.json", import.meta.url),
) {
  return validateGranularityDispositions(JSON.parse(await readFile(path, "utf8")));
}

export async function granularityDispositionsAtCommit(commit, {repositoryRoot = process.cwd()} = {}) {
  if (!/^[a-f0-9]{40,64}$/u.test(commit ?? "")) {
    throw new Error("Granularity dispositions require a canonical base commit");
  }
  try {
    const {stdout} = await execFileAsync("git", ["show", `${commit}:verification/granularity-dispositions.json`], {
      cwd:repositoryRoot, encoding:"utf8", maxBuffer:4 * 1024 * 1024,
    });
    return validateGranularityDispositions(JSON.parse(stdout));
  } catch (error) {
    if (error?.code === 128 || /does not exist|exists on disk, but not in/u.test(error?.stderr ?? "")) {
      return {version:1, dispositions:[]};
    }
    throw error;
  }
}

export function granularityDispositionFor(registry, task, path) {
  return registry.dispositions.find((entry) => entry.task === task && entry.path === path) ?? null;
}
