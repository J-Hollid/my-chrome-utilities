import assert from "node:assert/strict";

const { createInstalledSidePanelShellController, createChromeRuntimeMessagePort, createDefectCaptureCoordination,
  createEventLibrarySchemaCoordination } =
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
assert.ok(controller.commands().some(({ id }) => id === "data-layer.show-projects"));
await Promise.resolve(); await Promise.resolve();
assert.equal(commandLog.textContent, "Detached");
controller.runCommand("data-layer.show-projects"); assert.equal(commandLog.textContent, "data-layer.show-projects ran");
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

const defect = { id:"defect:1", type:"Missing event", status:"Saved", createdAt:"2026-01-01T00:00:00.000Z",
  updatedAt:"2026-01-01T00:00:00.000Z", report:{}, notes:"", issues:[] };
let defectLibrary = { defects:[defect] }, savedSessions = { sessions:[] }, openedSession, openedInspector;
const captureOwner = { currentSessionDraft:() => ({ completed:{ id:"session:1", pageScope:"https://example.test", startedAt:"start",
  endedAt:"end", events:[] }, summary:{ pageScope:"https://example.test", eventCount:0, sourceCount:0, validationSummary:"Not checked" } }),
savedSessions:() => structuredClone(savedSessions), replaceSavedSessions:(next) => { savedSessions = next; },
openSavedSession:(id) => { openedSession = id; return savedSessions.sessions.some((session) => session.id === id); },
openInspector:(id) => { openedInspector = id; } };
const defectOwner = { library:() => structuredClone(defectLibrary), replace:(next) => { defectLibrary = next; },
  matchingEvent:() => ({ id:"capture:matching" }) };
const defectCapture = createDefectCaptureCoordination({ capture:captureOwner, defects:defectOwner }, () => "2026-02-01T00:00:00.000Z");
defectCapture.attachCurrentSession("defect:1");
assert.equal(savedSessions.sessions[0].name, "Evidence for defect:1");
assert.equal(defectLibrary.defects[0].savedSession.id, savedSessions.sessions[0].id,
  "Defects and Capture settle one real saved-session attachment through their public owners");
assert.equal(defectCapture.openLinkedSession("defect:1"), true);
assert.deepEqual([openedSession, openedInspector], [savedSessions.sessions[0].id, "capture:matching"],
  "linked-session navigation opens the Capture-owned session before its matching inspector event");
assert.equal(defectCapture.openLinkedSession("defect:missing"), false);

let validatedEvent, openedSchema;
const eventSchemas = createEventLibrarySchemaCoordination({ schemas:{
  schemas:() => [{ id:"schema:checkout", name:"Checkout", version:2 }],
  validateAgainstSchema:(event, schemaId) => { validatedEvent = { event, schemaId }; return { message:"Library draft validation: Valid · Checkout v2." }; },
  openSchemaFromSource:(name, value) => { openedSchema = { name, value }; },
} });
assert.deepEqual(eventSchemas.schemas(), [{ id:"schema:checkout", name:"Checkout", version:2 }]);
assert.match(eventSchemas.validateDraft({ schemaId:"schema:checkout", sourceId:"history", eventName:"checkout",
  payload:{ total:12 } }).message, /Valid/);
assert.deepEqual(validatedEvent, { schemaId:"schema:checkout",
  event:{ sourceId:"history", eventName:"checkout", payload:{ total:12 }, rawInput:[] } },
"Event Library validation delegates the real draft to the Schema owner");
eventSchemas.createSchema({ id:"template:checkout", name:"Checkout", eventName:"checkout", sourceId:"history",
  sourceName:"History", destination:"event.history", tags:[], validation:"Not checked", payload:{ total:12 }, version:1, provenance:"captured" });
assert.deepEqual(openedSchema, { name:"Checkout", value:{ total:12 } },
  "Create schema transfers the actual Library payload into Schema ownership");
