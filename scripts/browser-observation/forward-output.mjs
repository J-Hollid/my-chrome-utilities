import {StringDecoder} from "node:string_decoder";

// Timing and progress remain live. A child's pass is provisional until the
// wrapper has checked the registered evidence leaves.
export function createBrowserObservationOutputForwarder(targetIds,write) {
  const ids=new Set(targetIds),decoder=new StringDecoder("utf8");
  let pending="";
  const line=value=>{
    try {
      const result=JSON.parse(value).swarmforgeBrowserTargetResult;
      if(ids.has(result?.id)&&result.status==="passed")return;
    } catch { /* Preserve ordinary diagnostics. */ }
    write(value);
  };
  return {
    write(chunk) {
      pending+=decoder.write(chunk);
      let end;
      while((end=pending.indexOf("\n"))!==-1) {
        line(pending.slice(0,end+1));pending=pending.slice(end+1);
      }
    },
    end() {pending+=decoder.end();if(pending)line(pending);pending="";},
  };
}
