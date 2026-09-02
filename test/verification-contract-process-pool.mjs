import { execFile } from "node:child_process";

const execute=(executable,args,options)=>new Promise((resolve)=>{
  execFile(executable,args,{...options,maxBuffer:16*1024*1024},
    (error,stdout,stderr)=>resolve({
      status:error?.code ?? 0,
      signal:error?.signal ?? null,
      stdout,
      stderr,
    }));
});

export async function runVerificationContractPool(entries,{
  concurrency=4, executable=process.execPath,
}={}) {
  const results=new Array(entries.length);
  let next=0;
  const worker=async()=>{
    while(next<entries.length){
      const index=next;
      next+=1;
      const entry=entries[index];
      results[index]={...entry,result:await execute(executable,entry.args,entry.options)};
    }
  };
  await Promise.all(Array.from({length:Math.min(concurrency,entries.length)},worker));
  return results;
}
