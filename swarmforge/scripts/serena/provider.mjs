import {readFile,access} from "node:fs/promises";
import path from "node:path";
import {createHash} from "node:crypto";
export async function verifyDownload(bytes,digest) {
  if(createHash("sha256").update(bytes).digest("hex")!==digest)throw new Error("Serena source digest mismatch");
}
export function installationPaths(root) {
  const local=path.join(root,".serena/local");
  return {local,source:path.join(local,"source"),home:path.join(local,"home"),
    executable:path.join(local,"source/.venv/bin/serena"),
    languageServer:path.join(local,"home/language_servers/static/TypeScriptLanguageServer/ts-lsp")};
}
export async function inspectSerena({repositoryRoot,pin}) {
  const p=installationPaths(repositoryRoot);
  try {
    const receipt=JSON.parse(await readFile(path.join(p.local,"installed.json"),"utf8"));
    if(JSON.stringify(receipt.pin)!==JSON.stringify(pin))return {available:false,reason:"Serena pin mismatch"};
    await access(p.executable);
    await access(path.join(p.languageServer,"node_modules/.bin/typescript-language-server"));
    await access(path.join(p.languageServer,"node_modules/typescript/lib/tsserver.js"));
    for(const [name,version] of [["typescript","5.9.3"],["typescript-language-server","5.1.3"]]) {
      const installed=JSON.parse(await readFile(path.join(p.languageServer,`node_modules/${name}/package.json`),"utf8"));
      if(installed.version!==version)return {available:false,reason:`Serena language-server pin mismatch: ${name}`};
    }
    return {available:true,executable:p.executable,revision:pin.revision};
  } catch(error) {
    if(error.code==="ENOENT")return {available:false,reason:"Serena executable or language server is missing"};
    return {available:false,reason:`Serena installation is invalid: ${error.message}`};
  }
}
export async function provisionSerena(request) {
  const {installSerena}=await import("./installation.mjs");
  await installSerena(request);
  return inspectSerena(request);
}
