import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {mkdir,readFile,writeFile,rename} from "node:fs/promises";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {randomUUID} from "node:crypto";
import {tools,projectConfig,globalConfig} from "./config.mjs";
import {installationPaths} from "./provider.mjs";
import {main as optionalTool} from "../../toolchain/cli.mjs";
const exec=promisify(execFile);
export async function readConfiguration(file) {
  const {stdout}=await exec("bb",["-e",
    '(require (quote [clj-yaml.core :as yaml]) (quote [cheshire.core :as json])) (let [v (yaml/parse-string (slurp (first *command-line-args*)))] (assert (map? v) "Serena configuration must be a map") (println (json/generate-string v)))',file],
  {timeout:5000,maxBuffer:1024*1024});
  return JSON.parse(stdout);
}
export async function refreshConfiguration(root) {
  if(!path.isAbsolute(root))throw new Error("Serena refresh requires an absolute worktree");
  const status=await optionalTool(["inspect","serena"],{repositoryRoot:root});
  if(!status.available)throw new Error(status.reason);
  const files=[[path.join(root,".serena/project.yml"),projectConfig(),true],
    [path.join(installationPaths(root).home,"serena_config.yml"),globalConfig(root),false]];
  const prepared=[];
  for(const [file,defaults,project] of files) {
    let previous="",current={};
    try {previous=await readFile(file,"utf8");current=await readConfiguration(file);}
    catch(error){if(error.code!=="ENOENT")throw error;}
    const value={...defaults,...current,fixed_tools:[...tools],...(project?{read_only:true}:{})};
    prepared.push({file,value,previous,bytes:JSON.stringify(value,null,2)+"\n"});
  }
  for(const {file,previous,bytes} of prepared)if(previous!==bytes) {
    await mkdir(path.dirname(file),{recursive:true});
    const stage=`${file}.${randomUUID()}.tmp`;
    await writeFile(stage,bytes,{flag:"wx"});await rename(stage,file);
  }
  return {project:prepared[0].value,global:prepared[1].value,
    changed:prepared.filter(({previous,bytes})=>previous!==bytes).map(({file})=>file)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const args=process.argv.slice(2);
  if(args.length!==2||args[0]!=="--worktree")throw new Error("Use --worktree <absolute-path>");
  refreshConfiguration(args[1]).then(result=>console.log(JSON.stringify(result)))
    .catch(error=>{console.error(`Serena unavailable: ${error.message}; use ordinary tools.`);process.exitCode=1;});
}
