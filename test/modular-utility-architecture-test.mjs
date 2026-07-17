import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { utilityRegistry, composeUtilityShell, extensionShell } from "../dist/utility-registry.js";
import { bindUtilityPanels, mountUtility, mountUtilityShell, renderUtilityDirectory } from "../dist/platform/utility-shell-dom.js";
import { createUtilityStorage } from "../dist/platform/utility-storage.js";
import { dataLayerUtility } from "../dist/utilities/data-layer/index.js";
import { commandPaletteUtility, commandsForUtilityShell, listCommands } from "../dist/utilities/command-palette/index.js";
import { loadVerificationPacks, planVerification, validateVerificationPacks } from "../scripts/verification-packs.mjs";
import { architectureViolations } from "../scripts/check-architecture.mjs";

assert.deepEqual(utilityRegistry.map(({id})=>id),["command-palette","hotkeys","data-layer"]);
for(const utility of utilityRegistry){
  assert.equal(typeof utility.identity.name,"string");assert.equal(Array.isArray(utility.commands),true);assert.equal(Array.isArray(utility.panels),true);
  assert.equal(typeof utility.lifecycle.activate,"function");assert.equal(typeof utility.lifecycle.mount,"function");assert.match(utility.storage.namespace,/^my-chrome-utilities\./);
}
assert.equal(new Set(utilityRegistry.map(({storage})=>storage.namespace)).size,utilityRegistry.length);
assert.deepEqual(new Set(extensionShell.commands),new Set(listCommands().map(({id})=>id)),"Every product command is owned by a registered utility");
assert.deepEqual(commandsForUtilityShell(listCommands(),extensionShell.commands).map(({id})=>id),listCommands().map(({id})=>id));
assert.deepEqual(commandsForUtilityShell(listCommands(),["demo.say-hello"]).map(({id})=>id),["demo.say-hello"]);
assert.throws(()=>commandsForUtilityShell(listCommands(),["missing.command"]),/commands are unavailable/);
assert.deepEqual(composeUtilityShell(utilityRegistry).utilityIds,["command-palette","hotkeys","data-layer"]);
const lifecycle=[];
const lifecycleShell=composeUtilityShell([
  {...utilityRegistry[0],id:"first",storage:{namespace:"test.first",version:1},lifecycle:{activate(){lifecycle.push("activate:first");},deactivate(){lifecycle.push("deactivate:first");}}},
  {...utilityRegistry[1],id:"second",storage:{namespace:"test.second",version:1},lifecycle:{activate(){lifecycle.push("activate:second");},deactivate(){lifecycle.push("deactivate:second");}}},
]);
assert.deepEqual(lifecycleShell.activate(),["first","second"]);
assert.deepEqual(lifecycleShell.activate(),["first","second"],"activation is idempotent");
lifecycleShell.deactivate();lifecycleShell.deactivate();
assert.deepEqual(lifecycle,["activate:first","activate:second","deactivate:second","deactivate:first"]);
const root={dataset:{}};let pagehide;
const mountedShell=composeUtilityShell(utilityRegistry);
mountUtilityShell(mountedShell,root,{addEventListener(type,listener){if(type==="pagehide")pagehide=listener;}});
assert.equal(root.dataset.registeredUtilities,"command-palette,hotkeys,data-layer");
assert.equal(root.dataset.activeUtilities,"command-palette,hotkeys,data-layer");
pagehide();assert.equal(root.dataset.activeUtilities,"");
const created=[];
const elementFactory={createElement(tag){const node={tag,dataset:{},children:[],append(...children){this.children.push(...children);}};created.push(node);return node;}};
const directory={children:[],replaceChildren(...children){this.children=children;}};
renderUtilityDirectory(utilityRegistry,directory,elementFactory);
assert.deepEqual(directory.children.map(({dataset,textContent})=>[dataset.utilityId,textContent]),[["command-palette","Command palette"],["hotkeys","Hotkeys"],["data-layer","Data layer"]]);
const values=new Map();
const backing={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
backing.setItem("legacy.data","before");
const ownedStorage=createUtilityStorage(backing,{namespace:"test.data",version:1,legacyKeys:["legacy.data"]});
assert.equal(ownedStorage.getItem("legacy.data"),"before");
ownedStorage.setItem("legacy.data","after");
assert.equal(backing.getItem("legacy.data"),"after","legacy storage remains compatible");
assert.equal(JSON.parse(backing.getItem("test.data"))["legacy.data"],"after","utility serialization is namespaced");
assert.throws(()=>ownedStorage.getItem("legacy.hotkeys"),/does not own storage key/);
const panelElements=new Map(extensionShell.panels.map((id)=>[id,{dataset:{}}]));
bindUtilityPanels(utilityRegistry,{querySelector(selector){return panelElements.get(selector.slice(1))??null;}});
for(const utility of utilityRegistry)for(const panel of utility.panels)assert.equal(panelElements.get(panel).dataset.utilityOwner,utility.id);
assert.throws(()=>bindUtilityPanels([{...utilityRegistry[0],panels:["missing-panel"]}],{querySelector(){return null;}}),/missing-panel/);
let standalonePagehide;
const standalonePanel={dataset:{}};
const standaloneRoot={dataset:{},querySelector(selector){return selector==="#palette"?standalonePanel:null;}};
const standaloneMount=mountUtility(commandPaletteUtility,standaloneRoot,{addEventListener(type,listener){if(type==="pagehide")standalonePagehide=listener;}});
assert.equal(standaloneRoot.dataset.registeredUtilities,"command-palette");
assert.equal(standaloneRoot.dataset.activeUtilities,"command-palette");
assert.equal(standalonePanel.dataset.utilityOwner,"command-palette");
standaloneMount.unmount();standalonePagehide();
assert.equal(standaloneRoot.dataset.activeUtilities,"");
const directLifecycleRoot={dataset:{},querySelector(selector){return selector==="#palette"?{dataset:{}}:null;}};
const directMount=commandPaletteUtility.lifecycle.mount(directLifecycleRoot,{addEventListener(){}});
assert.equal(directLifecycleRoot.dataset.activeUtilities,"command-palette","public lifecycle mounts without shell composition");
directMount.unmount();
assert.deepEqual(architectureViolations(new Map([["src/side-panel.ts",'import "./data-layer-session.js";']])),[{file:"src/side-panel.ts",dependency:"./data-layer-session.js",reason:"shell composition must use public utility entries"}]);
assert.deepEqual(architectureViolations(new Map([["src/utilities/data-layer/layers/core/demo.ts",'import "../browser/demo.js";']])),[{file:"src/utilities/data-layer/layers/core/demo.ts",dependency:"../browser/demo.js",reason:"core may not depend on browser"}]);
assert.deepEqual(architectureViolations(new Map([["src/utilities/data-layer/layers/application/demo.ts",'import "../browser/demo.js";']])),[{file:"src/utilities/data-layer/layers/application/demo.ts",dependency:"../browser/demo.js",reason:"application may not depend on browser"}]);
assert.deepEqual(architectureViolations(new Map([["src/utilities/hotkeys/demo.ts",'import "../command-palette/index.js";']])),[{file:"src/utilities/hotkeys/demo.ts",dependency:"../command-palette/index.js",reason:"utilities may not import another utility"}]);
assert.deepEqual(dataLayerUtility.modules.map(({id})=>id),["capture","live-inspection","event-library","schemas","defect-reporting","replay"]);
const sidePanelSource=await readFile(new URL("../src/side-panel.ts",import.meta.url),"utf8");
assert.doesNotMatch(sidePanelSource,/from "\.\/data-layer-/,"The shell must use data-layer public entries instead of implementation modules");
assert.doesNotMatch(sidePanelSource,/from "\.\/command-palette/,"The shell must use the command-palette public entry");
for(const facade of ["capture","live-inspection","event-library","schemas","defect-reporting","replay"]){
  const source=await readFile(new URL(`../src/utilities/data-layer/${facade}.ts`,import.meta.url),"utf8");
  assert.doesNotMatch(source,/export \* from/,`${facade} must expose a narrow explicit interface`);
}

const packs=await loadVerificationPacks();
await validateVerificationPacks(packs);
await assert.rejects(()=>validateVerificationPacks(packs,{inventory:{features:[...packs.flatMap(({features})=>features),"features/unassigned.feature"],handlers:packs.flatMap(({handlers})=>handlers)}}),/Unassigned features path: features\/unassigned\.feature/);
await assert.rejects(()=>validateVerificationPacks(packs,{inventory:{features:packs.flatMap(({features})=>features),handlers:[...packs.flatMap(({handlers})=>handlers),"acceptance/src/acceptance/steps/unassigned.clj"]}}),/Unassigned handlers path/);
await assert.rejects(()=>validateVerificationPacks([...packs,{...packs[0],id:"duplicate",features:packs[0].features}]),/exactly one pack/);
assert.equal(packs.length>=6,true);for(const pack of packs)for(const key of ["source","unit","property","features","handlers","browserAdapters","dependencies"])assert.equal(Array.isArray(pack[key]),true,`${pack.id}.${key}`);
const focused=planVerification(packs,{packIds:["schemas"]});assert.equal(focused.packIds.includes("schemas"),true);assert.equal(focused.packIds.includes("defects"),false);
const changed=planVerification(packs,{changedPaths:["src/data-layer-schema-verification.ts"]});assert.equal(changed.packIds.includes("schemas"),true);
const full=planVerification(packs,{terminalFull:true});assert.deepEqual(full.packIds,packs.map(({id})=>id));
assert.equal(new Set(full.commands).size,full.commands.length);assert.equal(full.commands.filter((command)=>command==="npm run build").length,1);
assert.throws(()=>planVerification(packs,{changedPaths:["src/unowned-module.ts"]}),/Assign every source path to one pack/);
console.log("modular utility architecture tests passed");
