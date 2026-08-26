import { execFile } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";

function gitListedPaths(repositoryRoot) {
  return new Promise((resolve, reject) => {
    execFile("git", ["ls-files", "--cached", "-z"],
      { cwd:repositoryRoot, maxBuffer:16 * 1024 * 1024 },
      (error, stdout, stderr) => error
        ? reject(new Error(stderr.trim() || error.message))
        : resolve(stdout.split("\0").filter(Boolean).sort()));
  });
}

export async function candidateRepositoryPaths({ repositoryRoot }) {
  const existing = [];
  for (const candidate of await gitListedPaths(repositoryRoot)) {
    try {
      await access(path.join(repositoryRoot, candidate));
      existing.push(candidate);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return existing;
}
