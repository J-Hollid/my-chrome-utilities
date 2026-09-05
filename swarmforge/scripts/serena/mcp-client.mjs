// Small stdio client for the explicit setup smoke check; it starts no role session.
import {spawn} from "node:child_process";
export async function connectMcp(command,args,{cwd,env=process.env,timeoutMs=120000}={}) {
  const child=spawn(command,args,{cwd,env,stdio:["pipe","pipe","pipe"]});
  let sequence=0,buffer="",diagnostic="";const pending=new Map();
  child.stderr.on("data",c=>{diagnostic=(diagnostic+c).slice(-2000);});
  const rejectAll=error=>{for(const p of pending.values()){clearTimeout(p.timer);p.reject(error);}pending.clear();};
  child.on("error",rejectAll);child.on("exit",()=>rejectAll(new Error(`MCP exited: ${diagnostic}`)));
  child.stdout.on("data",chunk=>{
    buffer+=chunk;let newline;
    while((newline=buffer.indexOf("\n"))>=0){const line=buffer.slice(0,newline);buffer=buffer.slice(newline+1);
      try {const message=JSON.parse(line),p=pending.get(message.id);if(!p)continue;
        clearTimeout(p.timer);pending.delete(message.id);
        if(message.error)p.reject(new Error(JSON.stringify(message.error)));else p.resolve(message.result);
      }catch(error){rejectAll(error);}}
  });
  const send=(method,params,id)=>child.stdin.write(JSON.stringify({jsonrpc:"2.0",...(id?{id}:{}),method,params})+"\n");
  const call=(method,params)=>new Promise((resolve,reject)=>{
    const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(new Error(`MCP ${method} timeout: ${diagnostic}`));},timeoutMs);
    pending.set(id,{resolve,reject,timer});send(method,params,id);
  });
  const close=()=>{rejectAll(new Error("MCP connection closed"));child.stdin.end();setTimeout(()=>child.kill("SIGTERM"),1000).unref();};
  try {
    const initialized=await call("initialize",{protocolVersion:"2024-11-05",capabilities:{},clientInfo:{name:"SwarmForge setup check",version:"1"}});
    send("notifications/initialized",{});
    return {initialized,call,close,tool:async(name,args)=>{
      const result=await call("tools/call",{name,arguments:args});
      if(result.isError)throw new Error(result.content?.map(c=>c.text??"").join("\n")??"MCP tool failed");
      return result.structuredContent?.result??result.content?.map(c=>c.text??"").join("\n");
    }};
  }catch(error){close();throw error;}
}
