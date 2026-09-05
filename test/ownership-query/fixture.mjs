import {mkdtemp,mkdir,writeFile,rm} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import path from "node:path";
import {writeCompiledVerificationRegistry} from "../../scripts/verification-registry/compiler.mjs";
export async function queryFixture() {
  const root=await mkdtemp(path.resolve("tmp/ownership-query-"));
  const write=async(p,value)=>{await mkdir(path.dirname(path.join(root,p)),{recursive:true});await writeFile(path.join(root,p),typeof value==="string"?value:JSON.stringify(value,null,2)+"\n");};
  const git=(...args)=>execFileSync("git",args,{cwd:root,encoding:"utf8"}).trim();
  git("init","-q");git("config","user.email","fixture@example.invalid");git("config","user.name","Fixture");
  const pack=(id)=>({id,source:[`${id}/`],dependencies:[],unit:Array.from({length:12},(_,i)=>`test/${id}-${i}.mjs`),
    property:[`test/${id}-property.mjs`],features:[],handlers:[],process:[],verificationSlices:[{
      id:"slice_a",sourcePrefixes:[`${id}/sliced/`],tasks:[`unit:test/${id}-0.mjs`,`property:test/${id}-property.mjs`],
      prerequisites:[`unit:test/${id}-1.mjs`],consumers:[],observableBoundary:"Fixture slice"}]});
  const packs=[pack("pack_a"),pack("pack_b"),pack("pack_c")];
  packs[2].source.push("verification/");
  packs[0].verificationSlices[0].consumers=[{packId:"pack_b",sliceId:"slice_a"}];
  await write("verification/packs.base.json",[]);
  const compile=async()=>{for(const [i,p] of packs.entries())await write(`verification/manifests/${p.id}.json`,{version:1,order:i,pack:p});await writeCompiledVerificationRegistry({repositoryRoot:root});};
  await write("pack_a/sliced/value.mjs","export const value=1;\n");
  await compile();
  const commit=()=>{git("add",".");git("commit","-qm","Fixture change");return git("rev-parse","HEAD");};
  const base=commit();
  return {root,packs,write,git,compile,commit,base,close:()=>rm(root,{recursive:true,force:true})};
}
