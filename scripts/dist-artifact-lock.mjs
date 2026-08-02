import {mkdir,readFile,rm,stat,writeFile} from "node:fs/promises";

const lockDirectory=new URL("../build/.dist-artifact.lock/",import.meta.url);
const heldEnvironmentKey="MY_CHROME_UTILITIES_DIST_LOCK_HELD";
const pause=(milliseconds)=>new Promise((resolve)=>setTimeout(resolve,milliseconds));
const processStartTime=async(pid)=>{const fields=(await readFile(`/proc/${pid}/stat`,"utf8")).trim().split(" ");return fields[21];};

async function staleOwner(directory,ownerFile){
  try{
    const owner=JSON.parse(await readFile(ownerFile,"utf8"));
    if(!Number.isInteger(owner.pid)||owner.pid<1||typeof owner.startTime!=="string")return true;
    try{return await processStartTime(owner.pid)!==owner.startTime;}catch(error){return error?.code==="ENOENT"||error?.code==="ESRCH";}
  }catch{try{return Date.now()-(await stat(directory)).mtimeMs>1000;}catch{return true;}}
}

export async function acquireDistArtifactLock(directory=lockDirectory){
  const ownerFile=new URL("owner.json",directory);
  for(;;){
    try{
      await mkdir(directory);
      const token=`${process.pid}:${Date.now()}:${Math.random()}`;
      await writeFile(ownerFile,JSON.stringify({pid:process.pid,startTime:await processStartTime(process.pid),token}));
      let released=false;
      return async()=>{if(released)return;released=true;try{const owner=JSON.parse(await readFile(ownerFile,"utf8"));if(owner.token===token)await rm(directory,{recursive:true,force:true});}catch(error){if(error?.code!=="ENOENT")throw error;}};
    }catch(error){
      if(error?.code!=="EEXIST")throw error;
      if(await staleOwner(directory,ownerFile)){try{await rm(directory,{recursive:true});}catch(error){if(error?.code!=="ENOENT")throw error;}continue;}
      await pause(25);
    }
  }
}

export async function withDistArtifactLock(operation){
  if(process.env[heldEnvironmentKey]==="1")return operation();
  const release=await acquireDistArtifactLock(),previous=process.env[heldEnvironmentKey];
  process.env[heldEnvironmentKey]="1";
  try{return await operation();}finally{if(previous===undefined)delete process.env[heldEnvironmentKey];else process.env[heldEnvironmentKey]=previous;await release();}
}
