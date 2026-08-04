import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultRepositoryRoot = fileURLToPath(new URL("../", import.meta.url));

function git(repositoryRoot, args, { encoding = "utf8" } = {}) {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd:repositoryRoot, encoding, maxBuffer:16 * 1024 * 1024 },
      (error, stdout, stderr) => error
        ? reject(new Error((Buffer.isBuffer(stderr) ? stderr.toString() : stderr).trim() || error.message))
        : resolve(stdout));
  });
}

function normalizedPath(value) {
  if (!value || path.isAbsolute(value) || value.includes("\\") || value.includes("\0") ||
      value === "." || value === ".." || value.startsWith("../") ||
      path.posix.normalize(value) !== value) {
    throw new Error(`Git reported an invalid repository-relative path: ${value}`);
  }
  return value;
}

function parseNameStatus(output) {
  const fields = output.toString().split("\0");
  if (fields.at(-1) === "") fields.pop();
  const entries = [];
  for (let index = 0; index < fields.length;) {
    const statusField = fields[index++];
    const match = /^([ACDMRTUXB])(\d{1,3})?$/u.exec(statusField);
    if (!match) throw new Error(`Git reported an unsupported change status: ${statusField}`);
    const status = match[1];
    const score = match[2] === undefined ? null : Number(match[2]);
    if (status === "R" || status === "C") {
      if (index + 1 >= fields.length) throw new Error(`Git reported an incomplete ${status} change`);
      entries.push({
        status,
        score,
        oldPath:normalizedPath(fields[index++]),
        newPath:normalizedPath(fields[index++]),
      });
    } else {
      if (index >= fields.length) throw new Error(`Git reported an incomplete ${status} change`);
      entries.push({ status, path:normalizedPath(fields[index++]) });
    }
  }
  return entries;
}

export async function canonicalGitCommit(revision, { repositoryRoot = defaultRepositoryRoot } = {}) {
  if (!revision || typeof revision !== "string") throw new Error("Provide a Git revision");
  return (await git(repositoryRoot, ["rev-parse", `${revision}^{commit}`])).trim();
}

export async function requireGitAncestor(
  baseCommit,
  commit,
  { repositoryRoot = defaultRepositoryRoot } = {},
) {
  try {
    await git(repositoryRoot, ["merge-base", "--is-ancestor", baseCommit, commit]);
  } catch {
    throw new Error(`Verification base ${baseCommit} is not an ancestor of candidate ${commit}`);
  }
}

export async function canonicalVerificationChangeSet({
  base,
  commit = "HEAD",
  repositoryRoot = defaultRepositoryRoot,
} = {}) {
  const [baseCommit, candidateCommit] = await Promise.all([
    canonicalGitCommit(base, { repositoryRoot }),
    canonicalGitCommit(commit, { repositoryRoot }),
  ]);
  await requireGitAncestor(baseCommit, candidateCommit, { repositoryRoot });
  const output = await git(repositoryRoot, [
    "diff", "--name-status", "-z", "--find-renames", "--find-copies", `${baseCommit}...${candidateCommit}`,
  ], { encoding:"buffer" });
  const entries = parseNameStatus(output);
  const paths = [...new Set(entries.flatMap((entry) => entry.oldPath
    ? [entry.oldPath, entry.newPath]
    : [entry.path]))].sort();
  return {
    version:1,
    baseCommit,
    commit:candidateCommit,
    entries,
    paths,
  };
}

export async function verificationPacksAtCommit(
  commit,
  { repositoryRoot = defaultRepositoryRoot } = {},
) {
  const output = await git(repositoryRoot, ["show", `${commit}:verification/packs.json`]);
  const packs = JSON.parse(output);
  if (!Array.isArray(packs)) throw new Error("Historical verification registry is not an array");
  return packs;
}
