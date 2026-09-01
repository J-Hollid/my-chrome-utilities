import {mkdir,readFile,rename,writeFile} from "node:fs/promises";
import path from "node:path";

export function bootstrapRunPath(root,runId) {
  return path.join(root,"tmp","verification-bootstrap-runs",`${runId}.json`);
}

export async function readBootstrapRun(file) {
  try { return JSON.parse(await readFile(file,"utf8")); }
  catch (error) { if (error?.code==="ENOENT") return null;throw error; }
}

export async function writeBootstrapRun(file,value) {
  await mkdir(path.dirname(file),{recursive:true});
  const stage=`${file}.${process.pid}.tmp`;
  await writeFile(stage,`${JSON.stringify(value,null,2)}\n`,{flag:"wx",mode:0o600});
  await rename(stage,file);
}
