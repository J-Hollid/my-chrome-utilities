import assert from "node:assert/strict";

export function inspectUtilityEntry(utility,{modules=[]}={}){
  assert.equal(typeof utility.id,"string");
  assert.equal(typeof utility.identity?.name,"string");
  assert.equal(Array.isArray(utility.commands),true);
  assert.equal(Array.isArray(utility.panels),true);
  assert.equal(typeof utility.lifecycle?.activate,"function");
  assert.match(utility.storage?.namespace,/^my-chrome-utilities\./);
  if(modules.length)assert.deepEqual(utility.modules.map(({id})=>id),modules);
}

export function inspectBrowserPack(id,utility,options){
  inspectUtilityEntry(utility,options);
  console.log(`${id} browser adapter passed`);
}
