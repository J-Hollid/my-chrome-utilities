import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {readFile,readdir} from "node:fs/promises";
import path from "node:path";
import {createHash} from "node:crypto";
import {loadCompiledVerificationRegistry} from "../verification-registry/loader.mjs";
import {activeVerificationSliceQuarantineIds} from "../verification-slice-quarantine.mjs";
const exec=promisify(execFile);
export const git=async(root,...args)=>(await exec("git",args,{cwd:root,env:{...process.env,GIT_OPTIONAL_LOCKS:"0"},encoding:"utf8",maxBuffer:16*1024*1024})).stdout;
export async function queryContext(cwd=process.cwd()) {
  const root=(await git(cwd,"rev-parse","--show-toplevel")).trim();
  const packs=await loadCompiledVerificationRegistry({repositoryRoot:root});
  const names=(await readdir(path.join(root,"verification/manifests"))).filter(f=>f.endsWith(".json")).sort();
  const inputs=["verification/packs.base.json",...names.map(f=>`verification/manifests/${f}`),"verification/packs.json"];
  const hash=createHash("sha256");
  for(const file of inputs) {hash.update(file+"\0");hash.update(await readFile(path.join(root,file)));}
  const head=(await git(root,"rev-parse","HEAD")).trim();
  const dirty=(await git(root,"status","--porcelain=v1","--untracked-files=all")).trim().length>0;
  const registryStatus=await git(root,"status","--porcelain=v1","--untracked-files=all","--",...inputs,"verification/manifests");
  const provenance={};
  const base=JSON.parse(await readFile(path.join(root,inputs[0]),"utf8"));
  for(const [index,pack] of base.entries()) provenance[pack.id]={path:inputs[0],pointer:`/${index}`};
  for(const name of names) {
    const file=`verification/manifests/${name}`,fragment=JSON.parse(await readFile(path.join(root,file),"utf8"));
    provenance[fragment.pack.id]={path:file,pointer:"/pack"};
  }
  return {root,packs,provenance,head,dirty,registryDirty:registryStatus.trim().length>0,
    registryIdentity:`sha256:${hash.digest("hex")}`,
    quarantine:await activeVerificationSliceQuarantineIds(head,{repositoryRoot:root})};
}
