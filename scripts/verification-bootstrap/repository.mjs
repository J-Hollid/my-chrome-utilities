import {execFile} from "node:child_process";
import {createHash,randomUUID} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";

const exec=promisify(execFile);

export async function git(root,...args) {
  const {stdout}=await exec("git",args,{cwd:root,maxBuffer:16*1024*1024});
  return stdout.trim();
}

export async function repositoryContext(root,base,candidate="HEAD") {
  const [baseCommit,candidateCommit,candidateTree,status]=await Promise.all([
    git(root,"rev-parse",`${base}^{commit}`),git(root,"rev-parse",`${candidate}^{commit}`),
    git(root,"rev-parse",`${candidate}^{tree}`),git(root,"status","--porcelain"),
  ]);
  if (status) throw new Error("Commit bootstrap candidate changes before final proof");
  const changed=await git(root,"diff","--name-only",baseCommit,candidateCommit,"--");
  const changedPaths=changed?changed.split("\n").filter(Boolean):[];
  return {baseCommit,candidateCommit,candidateTree,changedPaths};
}

export async function fileDigest(file) {
  return createHash("sha256").update(await readFile(file)).digest("hex");
}

export async function toolchainDigest(root) {
  return fileDigest(path.join(root,"swarmforge/toolchain.lock.json"));
}

export function bootstrapReceiptPath(root) {
  return path.join(root,"tmp","verification-receipts",`${process.pid}-${randomUUID()}.json`);
}
