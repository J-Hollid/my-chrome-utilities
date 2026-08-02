import {link,mkdir,open,readFile,rename,rm,stat,writeFile} from "node:fs/promises";

const lockDirectory=new URL("../tmp/.dist-artifact.lock/",import.meta.url);
const heldEnvironmentKey="MY_CHROME_UTILITIES_DIST_LOCK_HELD";
const pause=(milliseconds)=>new Promise((resolve)=>setTimeout(resolve,milliseconds));
const processStartTime=async(pid)=>{const fields=(await readFile(`/proc/${pid}/stat`,"utf8")).trim().split(" ");return fields[21];};

async function staleOwner(directory,ownerFile){
  try{
    const source=await readFile(ownerFile,"utf8"),owner=JSON.parse(source);
    if(!Number.isInteger(owner.pid)||owner.pid<1||typeof owner.startTime!=="string")return {source};
    try{return await processStartTime(owner.pid)!==owner.startTime?{source}:undefined;}catch(error){return error?.code==="ENOENT"||error?.code==="ESRCH"?{source}:undefined;}
  }catch{try{return Date.now()-(await stat(directory)).mtimeMs>1000?{source:undefined}:undefined;}catch{return {source:undefined};}}
}

async function staleClaim(claimFile){
  try{
    const owner=JSON.parse(await readFile(claimFile,"utf8"));
    if(!Number.isInteger(owner.pid)||owner.pid<1||typeof owner.startTime!=="string")return Date.now()-(await stat(claimFile)).mtimeMs>1000;
    try{return await processStartTime(owner.pid)!==owner.startTime;}catch(error){return error?.code==="ENOENT"||error?.code==="ESRCH";}
  }catch{try{return Date.now()-(await stat(claimFile)).mtimeMs>1000;}catch{return true;}}
}

async function recoverStaleClaim(directory,claimFile){
  let observed;try{observed=await open(claimFile,"r");}catch(error){if(error?.code==="ENOENT")return true;throw error;}
  const observedStat=await observed.stat();if(!await staleClaim(claimFile)){await observed.close();return false;}
  const quarantine=new URL(`reclaim.claim.recovery-${process.pid}-${Date.now()}-${Math.random()}`,directory);
  try{await rename(claimFile,quarantine);}catch(error){await observed.close();if(error?.code==="ENOENT")return true;throw error;}
  const movedStat=await stat(quarantine),sameClaim=observedStat.dev===movedStat.dev&&observedStat.ino===movedStat.ino;await observed.close();
  if(!sameClaim){try{await link(quarantine,claimFile);}catch(error){if(error?.code!=="EEXIST")throw error;}await rm(quarantine);return false;}
  await rm(quarantine);return true;
}

async function reclaimObservedOwner(directory,ownerFile,observed){
  const claimFile=new URL("reclaim.claim",directory),claimToken=`${process.pid}:${Date.now()}:${Math.random()}`,claimOwner={pid:process.pid,startTime:await processStartTime(process.pid),token:claimToken};let claim;
  try{claim=await open(claimFile,"wx");await claim.writeFile(JSON.stringify(claimOwner));}
  catch(error){if(error?.code==="EEXIST"){if(!await recoverStaleClaim(directory,claimFile))await pause(25);return false;}if(error?.code==="ENOENT")return false;throw error;}
  finally{await claim?.close();}
  try{
    let current;try{current=await readFile(ownerFile,"utf8");}catch(error){if(error?.code!=="ENOENT")throw error;}
    if(current!==observed.source)return false;
    await rm(directory,{recursive:true});return true;
  }finally{
    try{if(JSON.parse(await readFile(claimFile,"utf8")).token===claimToken)await rm(claimFile);}catch(error){if(error?.code!=="ENOENT")throw error;}
  }
}

export async function acquireDistArtifactLock(directory=lockDirectory){
  const ownerFile=new URL("owner.json",directory);
  await mkdir(new URL("../",directory),{recursive:true});
  for(;;){
    try{
      await mkdir(directory);
      const token=`${process.pid}:${Date.now()}:${Math.random()}`;
      await writeFile(ownerFile,JSON.stringify({pid:process.pid,startTime:await processStartTime(process.pid),token}));
      let released=false;
      return async()=>{if(released)return;released=true;try{const owner=JSON.parse(await readFile(ownerFile,"utf8"));if(owner.token===token)await rm(directory,{recursive:true,force:true});}catch(error){if(error?.code!=="ENOENT")throw error;}};
    }catch(error){
      if(error?.code!=="EEXIST")throw error;
      const observed=await staleOwner(directory,ownerFile);if(observed){await reclaimObservedOwner(directory,ownerFile,observed);continue;}
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
