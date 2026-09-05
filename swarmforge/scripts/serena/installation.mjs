import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {mkdir,writeFile,readFile,readdir,copyFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {globalConfig} from "./config.mjs";
import {installationPaths,verifyDownload} from "./provider.mjs";
const exec=promisify(execFile),source=fileURLToPath(new URL("./",import.meta.url));
export async function installSerena({repositoryRoot,pin}) {
  if(process.platform!=="linux"||process.arch!=="x64")throw new Error("Pinned Serena bootstrap currently supports Linux x64");
  const p=installationPaths(repositoryRoot),downloads=path.join(p.local,"downloads");
  await mkdir(downloads,{recursive:true});await mkdir(p.source,{recursive:true});
  await writeFile(path.join(p.local,".gitignore"),"*\n");
  const env={...process.env,UV_CACHE_DIR:path.join(p.local,"uv-cache"),UV_PYTHON_DOWNLOADS:"never",
    PIP_CACHE_DIR:path.join(p.local,"pip-cache"),npm_config_cache:path.join(p.local,"npm-cache")};
  const run=(cmd,args,cwd=repositoryRoot)=>{console.error(`Serena provision: ${cmd.split("/").at(-1)}`);return exec(cmd,args,{cwd,env,maxBuffer:16*1024*1024});};
  const archive=path.join(downloads,"serena.tar.gz");
  await run("curl",["--fail","--location",`https://codeload.github.com/oraios/serena/tar.gz/${pin.revision}`,"--output",archive]);
  await verifyDownload(await readFile(archive),pin.sha256);
  await run("tar",["-xzf",archive,"-C",p.source,"--strip-components=1"]);
  await run("python3",["-m","pip","download","--no-deps","--only-binary=:all:","--require-hashes",
    "--dest",downloads,"-r",path.join(source,"bootstrap-requirements.txt")]);
  const wheel=(await readdir(downloads)).find(f=>f.startsWith("uv-0.8.22-")&&f.endsWith(".whl"));
  if(!wheel)throw new Error("Pinned uv bootstrap wheel is missing");
  const bootstrap=path.join(p.local,"bootstrap");
  await run("python3",["-m","pip","install","--no-deps","--no-index","--upgrade","--target",bootstrap,path.join(downloads,wheel)]);
  await run(path.join(bootstrap,"bin/uv"),["sync","--frozen","--no-dev","--no-editable"],p.source);
  await mkdir(p.languageServer,{recursive:true});
  for(const file of ["package.json","package-lock.json"])await copyFile(path.join(source,"typescript",file),path.join(p.languageServer,file));
  await run("npm",["ci","--ignore-scripts","--no-audit","--no-fund"],p.languageServer);
  await writeFile(path.join(p.home,"serena_config.yml"),JSON.stringify(globalConfig(repositoryRoot),null,2)+"\n");
  await writeFile(path.join(p.local,"installed.json"),JSON.stringify({version:1,pin,installedAt:new Date().toISOString()})+"\n");
}
