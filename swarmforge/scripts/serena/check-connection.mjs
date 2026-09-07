import {pathToFileURL} from "node:url";
import {refreshConfiguration} from "./refresh.mjs";
import {codexSettings} from "./config.mjs";
import {installationPaths} from "./provider.mjs";
import {upstreamCommand} from "./server.mjs";
import {connectMcp} from "./mcp-client.mjs";
import {assessSequence} from "./sequence.mjs";
export async function checkConnection(root) {
  try {
    const settings=await refreshConfiguration(root);
    const client=JSON.parse(codexSettings(root).find(v=>v.startsWith("mcp_servers.serena.enabled_tools=")).split("=")[1]);
    const spec=upstreamCommand(root,installationPaths(root).executable);
    return await assessSequence({root,...settings,client,
      connect:()=>connectMcp(spec.command,spec.args,{...spec.options,timeoutMs:45000})});
  }catch(error){return {usable:false,step:"configuration",root,reason:`Serena unavailable: ${error.message}; use ordinary tools.`};}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const args=process.argv.slice(2);
  if(args.length!==2||args[0]!=="--worktree")throw new Error("Use --worktree <absolute-path>");
  const result=await checkConnection(args[1]);
  console.log(JSON.stringify(result));if(!result.usable)process.exitCode=1;
}
