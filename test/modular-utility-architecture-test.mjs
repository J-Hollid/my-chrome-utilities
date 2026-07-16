import assert from "node:assert/strict";
import { utilityRegistry, composeUtilityShell } from "../dist/utility-registry.js";
import { dataLayerUtility } from "../dist/utilities/data-layer/index.js";
import { loadVerificationPacks, planVerification, validateVerificationPacks } from "../scripts/verification-packs.mjs";

assert.deepEqual(utilityRegistry.map(({id})=>id),["command-palette","hotkeys","data-layer"]);
for(const utility of utilityRegistry){
  assert.equal(typeof utility.identity.name,"string");assert.equal(Array.isArray(utility.commands),true);assert.equal(Array.isArray(utility.panels),true);
  assert.equal(typeof utility.lifecycle.activate,"function");assert.match(utility.storage.namespace,/^my-chrome-utilities\./);
}
assert.equal(new Set(utilityRegistry.map(({storage})=>storage.namespace)).size,utilityRegistry.length);
assert.deepEqual(composeUtilityShell(utilityRegistry).utilityIds,["command-palette","hotkeys","data-layer"]);
assert.deepEqual(dataLayerUtility.modules.map(({id})=>id),["capture","live-inspection","event-library","schemas","defect-reporting","replay"]);

const packs=await loadVerificationPacks();
await validateVerificationPacks(packs);
await assert.rejects(()=>validateVerificationPacks([...packs,{...packs[0],id:"duplicate",features:packs[0].features}]),/exactly one pack/);
assert.equal(packs.length>=6,true);for(const pack of packs)for(const key of ["source","unit","property","features","handlers","browserAdapters","dependencies"])assert.equal(Array.isArray(pack[key]),true,`${pack.id}.${key}`);
const focused=planVerification(packs,{packIds:["schemas"]});assert.equal(focused.packIds.includes("schemas"),true);assert.equal(focused.packIds.includes("defects"),false);
const changed=planVerification(packs,{changedPaths:["src/data-layer-schema-verification.ts"]});assert.equal(changed.packIds.includes("schemas"),true);
const full=planVerification(packs,{terminalFull:true});assert.deepEqual(full.packIds,packs.map(({id})=>id));
assert.equal(new Set(full.commands).size,full.commands.length);assert.equal(full.commands.filter((command)=>command==="npm run build").length,1);
assert.throws(()=>planVerification(packs,{changedPaths:["src/unowned-module.ts"]}),/Assign every source path to one pack/);
console.log("modular utility architecture tests passed");
