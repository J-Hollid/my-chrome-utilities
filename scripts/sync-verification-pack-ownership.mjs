import { readFile, readdir, writeFile } from "node:fs/promises";

const root=new URL("../",import.meta.url);
async function paths(directory,suffix){
  const found=[];
  for(const entry of await readdir(new URL(directory+"/",root),{withFileTypes:true})){
    const path=`${directory}/${entry.name}`;
    if(entry.isDirectory())found.push(...await paths(path,suffix));
    else if(path.endsWith(suffix))found.push(path);
  }
  return found.sort();
}
function owner(path){
  const name=path.split("/").at(-1).toLowerCase();
  if(/command[_-]?palette|command[_-]?registry|typed[_-]?command/.test(name))return "command-palette";
  if(/hotkey|keymap|keyboard/.test(name))return "hotkeys";
  if(/replay|sequence/.test(name))return "replay";
  if(/defect|missing[_-]?event|jira|occurrence[_-]?report/.test(name))return "defects";
  if(/schema|validation|cardinality|conditional|allowed[_-]?value|rule[_-]|json[_-]?schema|manual[_-]?property|guided/.test(name))return "schemas";
  if(/event[_-]?(library|template)|template[_-]?(editor|revision|push)|push[_-]?event/.test(name))return "event-library";
  if(/data[_-]?layer|session|observation|observer|capture|live|event[_-]?feed|active[_-]?page|source[_-]?target|saved[_-]?session/.test(name))return "capture";
  return "shell";
}

const packs=JSON.parse(await readFile(new URL("verification/packs.json",root),"utf8"));
for(const pack of packs){pack.features=[];pack.handlers=[];}
for(const path of await paths("features",".feature"))packs.find(({id})=>id===owner(path)).features.push(path);
for(const path of await paths("acceptance/src/acceptance/steps",".clj"))packs.find(({id})=>id===owner(path)).handlers.push(path);
await writeFile(new URL("verification/packs.json",root),JSON.stringify(packs,null,2)+"\n");
