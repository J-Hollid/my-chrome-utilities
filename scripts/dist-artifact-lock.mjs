import {mkdir,readFile,readdir,rm,stat,writeFile} from "node:fs/promises";

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

const reclaimClaimPattern=/^reclaim\.\d{24}\..+\.claim$/;
const reclaimClaims=async(directory)=>{try{return(await readdir(directory)).filter((name)=>reclaimClaimPattern.test(name));}catch(error){if(error?.code==="ENOENT")return[];throw error;}};
const orderedReclaimClaims=async(directory)=>{const entries=[];for(const name of await reclaimClaims(directory))try{const details=await stat(new URL(name,directory),{bigint:true});entries.push({name,created:details.birthtimeNs,ino:details.ino});}catch(error){if(error?.code!=="ENOENT")throw error;}return entries.sort((left,right)=>left.created<right.created?-1:left.created>right.created?1:left.ino<right.ino?-1:left.ino>right.ino?1:left.name.localeCompare(right.name)).map(({name})=>name);};

async function reclaimObservedOwner(directory,ownerFile,observed){
  const claimToken=`${process.pid}:${Date.now()}:${Math.random()}`,claimName=`reclaim.${process.hrtime.bigint().toString().padStart(24,"0")}.${process.pid}.${Math.random()}.claim`,claimFile=new URL(claimName,directory),claimOwner={pid:process.pid,startTime:await processStartTime(process.pid),token:claimToken};
  try{await writeFile(claimFile,JSON.stringify(claimOwner),{flag:"wx"});}catch(error){if(error?.code==="ENOENT")return false;throw error;}
  try{
    for(;;){
      for(const name of await reclaimClaims(directory)){const candidate=new URL(name,directory);if(await staleClaim(candidate))try{await rm(candidate);}catch(error){if(error?.code!=="ENOENT")throw error;}}
      const claims=await orderedReclaimClaims(directory);if(!claims.includes(claimName))return false;if(claims[0]!==claimName){await pause(25);continue;}
      break;
    }
    let current;try{current=await readFile(ownerFile,"utf8");}catch(error){if(error?.code!=="ENOENT")throw error;}
    if(current!==observed.source)return false;
    const claim=JSON.parse(await readFile(claimFile,"utf8"));if(claim.token!==claimToken)return false;
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
