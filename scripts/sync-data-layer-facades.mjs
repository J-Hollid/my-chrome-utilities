import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const root=path.resolve(new URL("..",import.meta.url).pathname);
const facadeNames=["capture","live-inspection","event-library","schemas","defect-reporting","replay"];
const sidePanel=path.join(root,"src/side-panel.ts");
const config=ts.readConfigFile(path.join(root,"tsconfig.json"),ts.sys.readFile);
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,root);
const program=ts.createProgram(parsed.fileNames,parsed.options);
const checker=program.getTypeChecker();
const source=program.getSourceFile(sidePanel);
const boundaries={};

function initialLayer(file){
  const name=path.basename(file,".ts");
  const text=program.getSourceFile(file)?.text??"";
  if(/(?:-ui|-browser)$/.test(name)||/(?:\bdocument\b|\bwindow\b|\bchrome\.|\blocalStorage\b|\bsessionStorage\b)/.test(text))return "browser";
  if(/(?:session|observer|observation|library|replay|validation|defect|report|workflow|controller|storage|assignment|template)/.test(name))return "application";
  return "core";
}
const rank={core:0,application:1,browser:2},layerNames=["core","application","browser"];
const classified=new Map(program.getSourceFiles().filter((file)=>file.fileName.startsWith(path.join(root,"src"))).map((file)=>[file.fileName,initialLayer(file.fileName)]));
let changed=true;
while(changed){changed=false;for(const file of program.getSourceFiles()){
  if(!classified.has(file.fileName))continue;
  let fileRank=rank[classified.get(file.fileName)];
  for(const statement of file.statements){if(!ts.isImportDeclaration(statement)||!statement.moduleSpecifier.text.startsWith("."))continue;const target=path.resolve(path.dirname(file.fileName),statement.moduleSpecifier.text.replace(/\.js$/,".ts"));fileRank=Math.max(fileRank,rank[classified.get(target)]??0);}
  for(const match of file.text.matchAll(/import\(["']([^"']+)["']\)/g)){const target=path.resolve(path.dirname(file.fileName),match[1].replace(/\.js$/,".ts"));fileRank=Math.max(fileRank,rank[classified.get(target)]??0);}
  const promoted=layerNames[fileRank];if(promoted!==classified.get(file.fileName)){classified.set(file.fileName,promoted);changed=true;}
}}
const layerFor=(file)=>classified.get(file)??initialLayer(file);
for(const facade of facadeNames){
  for(const layer of ["core","application","browser"])await rm(path.join(root,`src/utilities/data-layer/layers/${layer}/${facade}.ts`),{force:true});
  const requested=new Set();
  for(const statement of source.statements){
    if(!ts.isImportDeclaration(statement)||statement.moduleSpecifier.text!==`./utilities/data-layer/${facade}.js`)continue;
    const bindings=statement.importClause?.namedBindings;
    if(ts.isNamedImports(bindings))for(const element of bindings.elements)requested.add(element.propertyName?.text??element.name.text);
  }
  const barrel=program.getSourceFile(path.join(root,`src/utilities/data-layer/${facade}.ts`));
  const exports=new Map(checker.getExportsOfModule(checker.getSymbolAtLocation(barrel)).map((symbol)=>[symbol.name,symbol]));
  const grouped=new Map();
  for(const name of [...requested].sort()){
    const exported=exports.get(name);if(!exported)throw new Error(`${facade} does not export ${name}`);
    const target=(exported.flags&ts.SymbolFlags.Alias)?checker.getAliasedSymbol(exported):exported;
    const declaration=target.declarations?.[0];if(!declaration)throw new Error(`Cannot locate ${facade}.${name}`);
    const file=declaration.getSourceFile().fileName;
    const layer=layerFor(file),key=`${layer}:${file}`;
    boundaries[path.relative(root,file).replaceAll(path.sep,"/")]={module:facade,layer};
    const item=grouped.get(key)??{layer,file,names:[]};item.names.push(name);grouped.set(key,item);
  }
  const layers=new Map(["core","application","browser"].map((layer)=>[layer,[]]));
  for(const {layer,file,names} of grouped.values())layers.get(layer).push(`export { ${names.sort().join(", ")} } from "../../../../${path.basename(file,".ts")}.js";`);
  const publicLines=[];
  for(const [layer,lines] of layers)if(lines.length){
    const directory=path.join(root,`src/utilities/data-layer/layers/${layer}`);await mkdir(directory,{recursive:true});
    await writeFile(path.join(directory,`${facade}.ts`),lines.sort().join("\n")+"\n");
    const names=[...grouped.values()].filter((item)=>item.layer===layer).flatMap((item)=>item.names).sort();
    publicLines.push(`export { ${names.join(", ")} } from "./layers/${layer}/${facade}.js";`);
  }
  await writeFile(path.join(root,`src/utilities/data-layer/${facade}.ts`),publicLines.join("\n")+"\n");
}
await mkdir(path.join(root,"architecture"),{recursive:true});
await writeFile(path.join(root,"architecture/data-layer-boundaries.json"),JSON.stringify(Object.fromEntries(Object.entries(boundaries).sort()),null,2)+"\n");
