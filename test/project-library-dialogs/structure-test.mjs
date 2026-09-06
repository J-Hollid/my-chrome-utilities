import assert from "node:assert/strict";
import fs from "node:fs/promises";
import ts from "typescript";
import {checkArchitecture} from "../../scripts/check-architecture.mjs";
const coordinatorPath="src/data-layer-project-library-ui.ts";
const declarations=JSON.parse(await fs.readFile("architecture/data-layer-boundaries.json","utf8"));
const parse=async path=>ts.createSourceFile(path,await fs.readFile(path,"utf8"),ts.ScriptTarget.Latest,true);
const coordinator=await parse(coordinatorPath);
const imports=coordinator.statements.filter(ts.isImportDeclaration).map(node=>node.moduleSpecifier.text);
for(const name of ["edit","switch","create","import"]) {
  const path=`src/project-library-dialogs/${name}.ts`;
  assert.ok(imports.includes(`./project-library-dialogs/${name}.js`));
  assert.ok(declarations[coordinatorPath].contracts.includes(path));
  const module=await parse(path);
  const dependencies=module.statements.filter(ts.isImportDeclaration).map(node=>node.moduleSpecifier.text);
  assert.ok(dependencies.includes("./focus.js"));
  assert.ok(dependencies.every(value=>value.startsWith("./")||value==="../data-layer-project-library.js"));
  assert.ok(module.statements.some(ts.isFunctionDeclaration));
}
const inspect=node=>{
  if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)&&node.expression.name.text==="createElement") {
    assert.notEqual(node.arguments[0]?.text,"dialog","the coordinator delegates every dialog, including import errors");
  }
  ts.forEachChild(node,inspect);
};
inspect(coordinator);
assert.ok(imports.includes("./data-layer-project-library-presentation-ui.js"));
assert.ok(!declarations["src/data-layer-project-library-presentation-ui.ts"].contracts?.some(path=>path.includes("project-library-dialogs")));
await checkArchitecture();
console.log(JSON.stringify({projectLibraryDialogStructure:{modules:true,callbacks:true,presentation:true,completeArchitecture:true}}));
