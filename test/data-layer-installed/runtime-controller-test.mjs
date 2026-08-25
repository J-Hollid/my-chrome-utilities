import assert from "node:assert/strict";

const { createInstalledSidePanelShellController, createChromeRuntimeMessagePort } =
  await import("../../dist/data-layer-installed/runtime.js");

const events = new Map(), calls = [];
const lifecycle = (name, extra = {}) => ({
  mount:()=>calls.push(`mount:${name}`), dispose:()=>calls.push(`dispose:${name}`), ...extra,
});
const commandLog = { textContent:"" };
const controller = createInstalledSidePanelShellController({
  pageLifecycle:{
    addEventListener:(type, listener)=>events.set(type, listener),
    removeEventListener:(type, listener)=>{if(events.get(type)===listener)events.delete(type);},
  },
  commandLog,
  palette:lifecycle("palette"),
  workspaceTabs:lifecycle("tabs", { show:(tab, focus)=>calls.push(`show:${tab}:${Boolean(focus)}`) }),
  hotkeys:lifecycle("hotkeys"),
  captureCommands:{
    startTesting:async()=>calls.push("command:start"), endTesting:async()=>calls.push("command:end"),
    chooseObservationTarget:async()=>calls.push("command:choose"), attachSelectedTarget:async()=>calls.push("command:attach"),
    detachObservationTarget:()=>calls.push("command:detach"),
  },
  showDataLayerView:(view)=>calls.push(`view:${view}`),
});
controller.mount(); controller.mount();
assert.deepEqual(calls.slice(0, 3), ["mount:tabs", "mount:hotkeys", "mount:palette"]);
assert.equal(events.size, 1);
controller.commandContext.record({ commandId:"data-layer.start-testing", message:"Started" });
controller.commandContext.record({ commandId:"data-layer.detach-observation-target", message:"Detached" });
controller.commandContext.showWorkspace("data-layer");
controller.commandContext.showDataLayerView("Projects");
await Promise.resolve(); await Promise.resolve();
assert.equal(commandLog.textContent, "Detached");
assert.ok(calls.includes("command:start")); assert.ok(calls.includes("command:detach"));
assert.ok(calls.includes("show:data-layer:false")); assert.ok(calls.includes("view:Projects"));
events.get("pagehide")(); assert.ok(calls.includes("dispose:palette"));
controller.dispose(); controller.dispose(); assert.equal(events.size, 0);
assert.equal(calls.filter((call)=>call==="dispose:tabs").length, 1);
assert.equal(calls.filter((call)=>call==="dispose:hotkeys").length, 1);

const runtimeListeners = new Set();
const runtimeMessages = createChromeRuntimeMessagePort({
  addListener:(listener)=>runtimeListeners.add(listener), removeListener:(listener)=>runtimeListeners.delete(listener),
});
const listener = ()=>{};
runtimeMessages.addListener(listener); assert.equal(runtimeListeners.has(listener), true);
runtimeMessages.removeListener(listener); assert.equal(runtimeListeners.size, 0);
