import { readdir, readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const shellFiles=new Set(["src/side-panel.ts","src/utility-registry.ts"]);
const internalUtilityImport=/^\.\/(?:data-layer-|command-palette(?:-|\.)|hotkey-)/;

export function architectureViolations(files){
  const violations=[];
  for(const [file,source] of files){
    if(!shellFiles.has(file))continue;
    for(const match of source.matchAll(/(?:from\s+)?["']([^"']+)["']/g)){
      const dependency=match[1];
      if(internalUtilityImport.test(dependency))violations.push({file,dependency,reason:"shell composition must use public utility entries"});
    }
  }
  return violations;
}

async function sourceFiles(directory="src"){
  const files=new Map();
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const path=`${directory}/${entry.name}`;
    if(entry.isDirectory())for(const item of await sourceFiles(path))files.set(...item);
    else if(path.endsWith(".ts"))files.set(path,await readFile(path,"utf8"));
  }
  return files;
}

export async function checkArchitecture(){
  const violations=architectureViolations(await sourceFiles());
  if(violations.length)throw new Error(violations.map(({file,dependency,reason})=>`${file}: forbidden dependency ${dependency} (${reason})`).join("\n"));
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  checkArchitecture().catch((error)=>{console.error(error.message);process.exitCode=1;});
}
