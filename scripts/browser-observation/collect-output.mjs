import {createBrowserObservationOutputForwarder} from "./forward-output.mjs";

const outputLimitBytes=16*1024*1024;

function terminateGroup(child,signal) {
  if(process.platform!=="win32") {
    try {process.kill(-child.pid,signal);return;} catch { /* Child may already have exited. */ }
  }
  child.kill(signal);
}

// The caller starts an owned process group. Bound both retained evidence and
// the forwarder's incomplete line; also clean up that group on parent signals.
export function collectBrowserObservationOutput(child,targetIds,{
  writeStdout=chunk=>process.stdout.write(chunk),
  writeStderr=chunk=>process.stderr.write(chunk),
  signalSource=process,terminate=terminateGroup,
  limitBytes=outputLimitBytes,graceMs=500,
}={}) {
  return new Promise((resolve,reject)=>{
    const chunks=[],forward=createBrowserObservationOutputForwarder(targetIds,writeStdout);
    let bytes=0,failure,timer,settled=false;
    const handlers=new Map();
    const finish=(code,signal)=>{
      if(settled)return;
      settled=true;clearTimeout(timer);
      for(const [name,handler] of handlers)signalSource.removeListener(name,handler);
      if(failure) {
        terminate(child,"SIGKILL");
        child.stdout.destroy();child.stderr.destroy();reject(failure);
      } else {
        forward.end();resolve({stdout:Buffer.concat(chunks).toString(),code,signal});
      }
    };
    const stop=error=>{
      if(failure||settled)return;
      failure=error;
      timer=setTimeout(()=>finish(null,"SIGKILL"),graceMs);
      terminate(child,"SIGTERM");
    };
    for(const name of ["SIGHUP","SIGINT","SIGTERM"]) {
      const handler=()=>stop(new Error(`Browser observation interrupted by ${name}`));
      handlers.set(name,handler);signalSource.on(name,handler);
    }
    const accept=chunk=>{
      if(failure||settled)return false;
      bytes+=chunk.length;
      if(bytes>limitBytes) {
        stop(new Error(`Browser observation output exceeded ${limitBytes} bytes`));return false;
      }
      return true;
    };
    child.stdout.on("data",chunk=>{if(accept(chunk)){chunks.push(chunk);forward.write(chunk);}});
    child.stderr.on("data",chunk=>{if(accept(chunk))writeStderr(chunk);});
    child.once("error",stop);
    child.once("close",finish);
  });
}
