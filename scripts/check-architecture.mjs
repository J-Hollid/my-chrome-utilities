import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const shellFiles=new Set(["src/side-panel.ts","src/utility-registry.ts","src/background.ts"]);
const declaredBoundaries=JSON.parse(await readFile(new URL("../architecture/data-layer-boundaries.json",import.meta.url),"utf8"));
const internalUtilityImport=/^\.\/(?:data-layer-|command-palette(?:-|\.)|hotkey-)/;
const layerRank={core:0,application:1,browser:2};
const importsOf=(source)=>[...source.matchAll(/(?:from\s+)?["']([^"']+)["']/g)].map((match)=>match[1]).filter((dependency)=>dependency.startsWith("."));
const normalized=(file,dependency)=>path.posix.normalize(path.posix.join(path.posix.dirname(file),dependency.replace(/\.js$/,".ts")));
const utilityOf=(file)=>file.match(/^src\/utilities\/([^/]+)\//)?.[1];
const layerOf=(file)=>file.match(/\/layers\/(core|application|browser)\//)?.[1]??declaredBoundaries[file]?.layer;
const publicDataLayerModules=new Map([["capture","capture"],["live-inspection","live-inspection"],["event-library","event-library"],["schemas","schemas"],["defect-reporting","defect-reporting"],["replay","replay"]]);
const publicModuleOf=(file)=>file.match(/^src\/utilities\/data-layer\/(capture|live-inspection|event-library|schemas|defect-reporting|replay)\.ts$/)?.[1];
const moduleOf=(file)=>file.endsWith("/layers/browser/scoped-runtime.ts")?undefined:declaredBoundaries[file]?.module??(file.match(/^src\/utilities\/data-layer\/layers\/(?:core|application|browser)\/([^/.]+)\.ts$/)?.[1])??publicModuleOf(file);
const publicEntryFor=(module)=>publicDataLayerModules.has(module)?`src/utilities/data-layer/${publicDataLayerModules.get(module)}.ts`:undefined;
const concreteBrowserRuntime=/(?:\bdocument\.(?:activeElement|addEventListener|body|createElement|documentElement|getElementById|querySelector|querySelectorAll)\b|\bwindow\.|\bchrome\.|\blocalStorage\b|\bsessionStorage\b)/;

export function architectureViolations(files){
  const violations=[];
  for(const [file,source] of files){
    if(/^src\/data-layer-[^/]+\.ts$/.test(file)&&!declaredBoundaries[file])violations.push({file,dependency:"architecture/data-layer-boundaries.json",reason:"data-layer file must declare its module and layer"});
    for(const dependency of importsOf(source)){
      if(shellFiles.has(file)&&internalUtilityImport.test(dependency)){
        violations.push({file,dependency,reason:"shell composition must use public utility entries"});continue;
      }
      const target=normalized(file,dependency),owner=utilityOf(file),targetOwner=utilityOf(target);
      if(owner&&targetOwner&&owner!==targetOwner){violations.push({file,dependency,reason:"utilities may not import another utility"});continue;}
      const layer=layerOf(file),targetLayer=layerOf(target),module=moduleOf(file),targetModule=moduleOf(target);
      if(module&&targetModule&&module!==targetModule&&target!==publicEntryFor(targetModule))violations.push({file,dependency,reason:"cross-module import must use the module public API"});
      else if(module&&targetModule&&module!==targetModule&&!(declaredBoundaries[file]?.contracts??[]).includes(target))violations.push({file,dependency,reason:"cross-module import requires a declared contract"});
      else if(layer&&targetLayer&&layerRank[targetLayer]>layerRank[layer])violations.push({file,dependency,reason:`${layer} may not depend on ${targetLayer}`});
      else if(layer==="browser"&&file.includes("/utilities/data-layer/layers/")&&moduleOf(file)&&moduleOf(target)&&moduleOf(file)!==moduleOf(target))violations.push({file,dependency,reason:"browser adapters may not import another data-layer module"});
    }
    const layer=layerOf(file);
    if(layer==="core"&&concreteBrowserRuntime.test(source))violations.push({file,dependency:"browser runtime",reason:"core may not use DOM, Chrome, or storage implementations"});
    if(layer==="application"&&concreteBrowserRuntime.test(source))violations.push({file,dependency:"browser runtime",reason:"application may not use concrete DOM, Chrome, or storage implementations"});
  }
  return violations;
}

async function sourceFiles(directory="src"){
  const files=new Map();
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const file=`${directory}/${entry.name}`;
    if(entry.isDirectory())for(const item of await sourceFiles(file))files.set(...item);
    else if(file.endsWith(".ts"))files.set(file,await readFile(file,"utf8"));
  }
  return files;
}
export async function checkArchitecture(){const violations=architectureViolations(await sourceFiles());if(violations.length)throw new Error(violations.map(({file,dependency,reason})=>`${file}: forbidden dependency ${dependency} (${reason})`).join("\n"));}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)checkArchitecture().catch((error)=>{console.error(error.message);process.exitCode=1;});
