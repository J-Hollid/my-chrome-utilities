import path from "node:path";
import {tools} from "./config.mjs";
export const symbolQuery=Object.freeze({name_path_pattern:"renderProjectLibraryPresentation",
  relative_path:"src/data-layer-project-library-presentation-ui.ts",include_body:false});
export async function assessSequence({root,project,global,client,connect}) {
  let connection,step="server filter";
  try {
    if(!path.isAbsolute(root))throw new Error("assigned worktree must be absolute");
    for(const filter of [project.fixed_tools,global.fixed_tools])
      if(!filter?.includes("initial_instructions"))throw new Error("initial_instructions missing from server filter");
    step="client filter";
    if(!client?.includes("initial_instructions"))throw new Error("initial_instructions missing from client filter");
    step="read-only settings";
    if(project.read_only!==true||[...project.fixed_tools,...global.fixed_tools,...client].some(t=>!tools.includes(t)))
      throw new Error("unexpected capability or writable project");
    step="initialize";connection=await connect();
    if(!connection.initialized?.protocolVersion)throw new Error("server initialization missing");
    step="tools/list";
    const catalogue=(await connection.call("tools/list",{})).tools.map(t=>t.name);
    if(!catalogue.includes("initial_instructions"))throw new Error("initial_instructions missing from tool catalogue");
    if(catalogue.some(t=>!tools.includes(t))||tools.some(t=>!catalogue.includes(t)||!client.includes(t)))
      throw new Error("effective tool catalogue differs from the read-only allowlist");
    step="initial_instructions";
    const instructions=await connection.tool("initial_instructions",{});
    if(typeof instructions!=="string"||!instructions.trim())throw new Error("empty initial instructions");
    step="find_symbol";
    const response=await connection.tool("find_symbol",symbolQuery);
    const symbols=typeof response==="string"?JSON.parse(response):response;
    if(!Array.isArray(symbols)||!symbols.some(s=>s.relative_path===symbolQuery.relative_path&&
      (s.name??s.name_path)===symbolQuery.name_path_pattern))throw new Error("symbol result is outside the assigned query");
    return {usable:true,step:"complete",root,protocolVersion:connection.initialized.protocolVersion,
      tools:catalogue,instructions,symbol:symbols};
  }catch(error){return {usable:false,step,root,reason:`Serena unavailable at ${step}: ${error.message}; use ordinary tools.`};}
  finally {connection?.close();}
}
