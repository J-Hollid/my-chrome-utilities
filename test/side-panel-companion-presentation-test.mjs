import {verifyLegacyPreviewContainment} from "./support/side-panel-companion/legacy-expectation-regression.mjs";
import assert from "node:assert/strict";
import {createSchemaLibraryFakeDocument} from "./support/schema-library-fake-dom.mjs";
import {renderProjectLibraryPresentation} from "../dist/data-layer-project-library-presentation-ui.js";

const {document,element}=createSchemaLibraryFakeDocument();
globalThis.document=document;
const hosts={activeHeader:element(),activeCard:element(),list:element()};
const calls=[];
const callbacks=Object.fromEntries(["focusSearch","createProject","openProject","editProject",
  "exportProject","closeProject","switchProject"].map(name=>[name,(...args)=>calls.push([name,...args])]));
const entry=(id,active)=>({id,name:`Project ${id}`,summary:"example.test · Saved Draft · Published revision 2",
  savedAt:"2026-09-06T01:23:45.678Z",active});
const model={activeHeader:"Active project: Project one · Saved Draft",active:entry("one",true),
  entries:[entry("one",true),entry("two",false),entry("three",false)],blocked:false};
const find=(node,tag)=>node.find(child=>child.tagName===tag);
renderProjectLibraryPresentation(hosts,model,callbacks);
assert.equal(hosts.activeCard.children.length,0,"the active record must not have a separate featured copy");
assert.equal(hosts.list.children.length,3);
for(const row of hosts.list.children){
  const value=model.entries.find(({id})=>id===row.dataset.projectId);
  assert.equal(find(row,"h4").textContent,value.name,"names must be separate from metadata");
  assert.equal(find(row,"p").textContent,value.summary);
  const details=find(row,"details");
  assert.ok(details,"each record must expose native keyboard-operated details");
  assert.equal(Boolean(details.open),false);
  assert.equal(find(details,"code").textContent,value.id);
  assert.equal(find(details,"time").textContent,value.savedAt,"the complete exact timestamp must remain available");
}
const active=hosts.list.children[0];
assert.equal(active.dataset.active,"true");
assert.equal(find(active,"strong").textContent,"Active project");
assert.deepEqual(active.querySelectorAll("button").map(x=>x.textContent),
  ["Open in Specification Studio","Edit details","Export","Close project"]);
for(const control of active.querySelectorAll("button"))control.click();
assert.deepEqual(calls.map(([name,id])=>[name,typeof id==="string"?id:undefined]),
  [["openProject","one"],["editProject","one"],["exportProject","one"],["closeProject",undefined]]);
const edit=active.querySelectorAll("button")[1];
assert.equal(calls[1][2],edit,"the callback retains its focus-return control");
calls.length=0;
const saved=hosts.list.children[1];
for(const control of saved.querySelectorAll("button"))control.click();
assert.deepEqual(calls.map(([name,id])=>[name,id]),
  [["switchProject","two"],["editProject","two"],["exportProject","two"]]);
renderProjectLibraryPresentation(hosts,{...model,blocked:true},callbacks);
assert.ok(hosts.list.children[0].querySelectorAll("button").filter(x=>x.textContent!=="Export").every(x=>x.disabled));
assert.equal(Boolean(hosts.list.children[0].querySelectorAll("button").find(x=>x.textContent==="Export").disabled),false);
renderProjectLibraryPresentation(hosts,{...model,entries:[model.entries[1]]},callbacks);
assert.equal(hosts.list.children.length,1,"filtering must not add a duplicate active row");
assert.equal(hosts.activeCard.children.length,0);
assert.equal(model.active.id,"one");
console.log("Project companion presentation tests passed");

const repairContext=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
  ?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):null;
if(repairContext?.causalCategory==="other:companion hidden preview output geometry")
  await verifyLegacyPreviewContainment(repairContext);
