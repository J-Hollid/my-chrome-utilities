import { spawn } from "node:child_process";

const patchIdPattern = /^[a-f0-9]{40}$/u;
const diagnosticLimit = 64 * 1024;

function collect(stream) {
  let value = "";
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    if (value.length < diagnosticLimit) value += chunk.slice(0, diagnosticLimit - value.length);
  });
  return () => value.trim();
}

function completion(child) {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => resolve({ code, signal }));
  });
}

export async function stablePatchId(repositoryRoot, baseCommit, candidateCommit) {
  const diff = spawn("git", ["diff", "--no-ext-diff", baseCommit, candidateCommit], {
    cwd:repositoryRoot,
    stdio:["ignore", "pipe", "pipe"],
  });
  const patchId = spawn("git", ["patch-id", "--stable"], {
    cwd:repositoryRoot,
    stdio:["pipe", "pipe", "pipe"],
  });
  const diffError = collect(diff.stderr);
  const patchError = collect(patchId.stderr);
  let output = "";
  patchId.stdout.setEncoding("utf8");
  patchId.stdout.on("data", (chunk) => { output += chunk; });
  diff.stdout.on("error", () => {});
  patchId.stdin.on("error", () => {});
  diff.stdout.pipe(patchId.stdin);

  const [diffResult, patchResult] = await Promise.all([completion(diff), completion(patchId)]);
  if (diffResult.code !== 0 || patchResult.code !== 0) {
    throw new Error(diffError() || patchError() ||
      `Cannot derive stable patch id (diff ${diffResult.code ?? diffResult.signal}, patch-id ${patchResult.code ?? patchResult.signal})`);
  }
  const value = output.trim().split(/\s/u)[0];
  if (!patchIdPattern.test(value ?? "")) {
    throw new Error("Cannot derive the stable blocked-aggregate consumer patch identity");
  }
  return value;
}
