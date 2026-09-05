import assert from "node:assert/strict";
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import path from "node:path";
const script=path.resolve("swarmforge/scripts/role-agent-instruction.bb");
const root=await mkdtemp(path.resolve("tmp/serena-reading-"));
const files=["swarmforge/constitution.prompt","swarmforge/constitution/articles/project.prompt",
  "swarmforge/scripts/shared-articles/handoffs.prompt","swarmforge/scripts/shared-articles/tool-use.prompt",
  ...["specifier","coder","refactorer","architect"].map(r=>`swarmforge/roles/${r}.prompt`)];
try {
  for(const f of files) {await mkdir(path.dirname(path.join(root,f)),{recursive:true}); await writeFile(path.join(root,f),"Ordinary reference: docs/history.md\n");}
  await writeFile(path.join(root,files[0]),"Required instruction: swarmforge/constitution/articles/project.prompt\n");
  await writeFile(path.join(root,files[1]),"Required instruction: swarmforge/constitution.prompt\nRequired instruction: extra.prompt\nRequired instruction: alias.prompt\n");
  await writeFile(path.join(root,"extra.prompt"),"Required instruction: swarmforge/constitution.prompt\n");
  await symlink("extra.prompt",path.join(root,"alias.prompt"));
  for(const role of ["specifier","coder","refactorer","architect"]) {
    const out=path.join(root,"instruction.md");
    execFileSync("bb",[script,role,out],{cwd:root});
    const text=await readFile(out,"utf8");
    for(const f of [...files.slice(0,4),`swarmforge/roles/${role}.prompt`]) assert.equal(text.split(`Read ${f};`).length-1,1,f);
    assert.equal(text.split("Read extra.prompt;").length-1,1);
    assert.doesNotMatch(text,/docs\/history|refers to recursively/);
    for(const other of ["specifier","coder","refactorer","architect"].filter(r=>r!==role)) assert.ok(!text.includes(`roles/${other}.prompt`));
    assert.match(text,/selected task/);
    assert.match(text,/progress-lease instructions/);
  }
  await rm(path.join(root,files[3]));
  assert.throws(()=>execFileSync("bb",[script,"coder",path.join(root,"out")],{cwd:root,stdio:"pipe"}),/Required instruction is missing/);
  console.log(JSON.stringify({serenaReading:{roles:4,requiredOnce:true,cycles:true,referenceOnlyIgnored:true,
    missingRejected:true,selectedTask:true}}));
} finally {await rm(root,{recursive:true,force:true});}
