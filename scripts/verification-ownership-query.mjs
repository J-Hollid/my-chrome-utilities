#!/usr/bin/env node
import {pathToFileURL} from "node:url";
import {ownershipQuery} from "./verification-ownership-query/query.mjs";
import {presentQuery,queryText} from "./verification-ownership-query/presentation.mjs";
export function parseQueryArgs(args) {
  const [mode,...rest]=args,options={mode,packs:[]};
  if(mode==="path")options.path=rest.shift();
  while(rest.length) {
    const key=rest.shift();
    if(key==="--json"){options.json=true;continue;}
    if(!["--base","--task","--pack","--expand"].includes(key))throw new Error(`Unknown query option: ${key}`);
    const value=rest.shift();if(!value||value.startsWith("--"))throw new Error(`${key} requires a value`);
    if(key==="--pack")options.packs.push(value);else options[key.slice(2)]=value;
  }
  if(mode==="path"&&(options.base||options.task||options.packs.length))throw new Error("Path queries do not accept change options");
  return options;
}
export async function runOwnershipQuery(args,{cwd=process.cwd()}={}) {
  const options=parseQueryArgs(args),answer=presentQuery(await ownershipQuery(options,{cwd}),options);
  return options.json?JSON.stringify(answer,null,2)+"\n":queryText(answer);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
  runOwnershipQuery(process.argv.slice(2)).then(out=>process.stdout.write(out)).catch(error=>{
    console.error(error.message);process.exitCode=1;
  });
