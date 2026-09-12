import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdtemp} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  headlessChromeArguments,
  removeChromeProfile,
  resolveChromeExecutable,
  stopHeadlessChrome,
} from "./support/headless-chrome.mjs";
import {
  evaluate,
  extensionId,
  pageSocket,
  wait,
} from "./support/side-panel-companion/chrome.mjs";
import {fixturePrograms} from "./support/side-panel-schema-guided-targets.mjs";

const profile = await mkdtemp(path.join(os.tmpdir(), "live-add-recovery-"));
const extensionRoot = path.resolve("dist");
const chromeArguments = headlessChromeArguments(profile, extensionRoot);
chromeArguments.splice(-1, 0, `--load-extension=${extensionRoot}`);
const chrome = spawn(resolveChromeExecutable(), chromeArguments, {
  stdio: ["ignore", "ignore", "pipe"],
});

async function debuggingPort() {
  return new Promise((resolve, reject) => {
    let output = "";
    const timer = setTimeout(
      () => reject(new Error(`Chrome startup failed: ${output}`)),
      15_000,
    );
    chrome.stderr.on("data", (chunk) => {
      output += chunk;
      const match = output.match(/ws:\/\/127\.0\.0\.1:(\d+)\//u);
      if (match) {
        clearTimeout(timer);
        resolve(Number(match[1]));
      }
    });
    chrome.once("error", reject);
  });
}

async function until(socket, expression, label) {
  for (let attempt = 0; attempt < 240; attempt += 1) {
    const value = await evaluate(socket, expression);
    if (value) return value;
    await wait(25);
  }
  throw new Error(`Timed out while waiting for ${label}`);
}

async function key(socket, keyName, code = keyName, virtualKeyCode) {
  const shared = {key: keyName, code, windowsVirtualKeyCode: virtualKeyCode};
  await socket.call("Input.dispatchKeyEvent", {type: "rawKeyDown", ...shared});
  if (keyName === "Enter") {
    await socket.call("Input.dispatchKeyEvent", {
      type: "char", text: "\r", unmodifiedText: "\r", ...shared,
    });
  }
  await socket.call("Input.dispatchKeyEvent", {type: "keyUp", ...shared});
}

async function pointer(socket, expression, label) {
  const point = await evaluate(socket, `(()=>{
    const control=${expression};if(!control)return null;
    control.scrollIntoView({block:"center",inline:"center"});
    const rect=control.getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2;
    const hit=document.elementFromPoint(x,y);
    return{x,y,width:rect.width,height:rect.height,
      hit:Boolean(hit&&(hit===control||control.contains(hit)))};
  })()`);
  assert.ok(
    point && point.width > 0 && point.height > 0 && point.hit,
    `${label} must be visible and hit-testable`,
  );
  await socket.call("Page.bringToFront");
  await socket.call("Input.dispatchMouseEvent", {
    type: "mouseMoved", x: point.x, y: point.y,
  });
  await socket.call("Input.dispatchMouseEvent", {
    type: "mousePressed", x: point.x, y: point.y,
    button: "left", buttons: 1, clickCount: 1,
  });
  await socket.call("Input.dispatchMouseEvent", {
    type: "mouseReleased", x: point.x, y: point.y,
    button: "left", buttons: 0, clickCount: 1,
  });
}

async function tabTo(socket, selector, label) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (await evaluate(socket,
      `document.activeElement?.matches(${JSON.stringify(selector)})`)) return;
    await key(socket, "Tab", "Tab", 9);
  }
  throw new Error(`Keyboard focus did not reach ${label}`);
}

const savedSchemas = `(async()=>{
  const repository=await(await import("/data-layer-durable-project-repository.js"))
    .openIndexedDbProjectRepository();
  return(await repository.savedSchemaRecords()).map(({schema})=>schema);
})()`;
const reviewButton = (prefix) =>
  `[...document.querySelector(".live-schema-bulk-review").querySelectorAll("button")]
    .find(control=>control.textContent.trim().startsWith(${JSON.stringify(prefix)}))`;

let side;
try {
  const port = await debuggingPort();
  const base = `chrome-extension://${await extensionId(port)}/`;
  side = await pageSocket(port, `${base}side-panel.html`);
  await side.call("Emulation.setDeviceMetricsOverride", {
    width: 1200, height: 900, deviceScaleFactor: 1, mobile: false,
  });
  await until(side, "document.readyState==='complete'", "side panel load");
  await evaluate(side, fixturePrograms.liveSchemaPropertyDeclarationSeedRuntime);

  await pointer(side, "document.querySelector('#data-layer-view-live')", "Live tab");
  await until(side, "document.querySelector('#live-event-feed button')", "Live feed");
  await pointer(side, "document.querySelector('#live-event-feed button')", "Live event");
  await until(side,
    "document.querySelector('#live-inspector-action-add-all-to-schema')",
    "Add all action");
  await pointer(side,
    "document.querySelector('#live-inspector-action-add-all-to-schema')",
    "Add all action");
  await until(side,
    "document.querySelector('.live-schema-bulk-review')?.matches(':modal')",
    "bulk review");

  await tabTo(side, "#live-schema-bulk-destination", "destination");
  await key(side, "Home", "Home", 36);
  await until(side,
    "document.querySelector('#live-schema-bulk-destination').value==='new'",
    "new destination");
  await tabTo(side, "#live-schema-bulk-name", "schema name");
  await side.call("Input.insertText", {text: "Failed checkout"});
  await until(side,
    "document.querySelector('#live-schema-bulk-name').value==='Failed checkout'",
    "schema name input");

  const hiddenHostState = await evaluate(side, `({
    liveSelected:document.querySelector("#data-layer-view-live").getAttribute("aria-selected"),
    liveHidden:document.querySelector("#data-layer-panel-live").hidden,
    projectsHidden:document.querySelector("#data-layer-panel-projects").hidden
  })`);
  assert.deepEqual(hiddenHostState, {
    liveSelected: "true", liveHidden: false, projectsHidden: true,
  });
  const durableBefore = JSON.stringify(await evaluate(side, savedSchemas));
  await evaluate(side, `(()=>{
    const original=IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction=function(storeNames,mode,...rest){
      const names=typeof storeNames==="string"?[storeNames]:Array.from(storeNames);
      if(mode==="readwrite"&&names.includes("savedSchemas")){
        IDBDatabase.prototype.transaction=original;
        throw new DOMException("Simulated bulk Saved Schema write failure","OperationError");
      }
      return original.call(this,storeNames,mode,...rest);
    };
    globalThis.__bulkExportBlob=undefined;
    const create=URL.createObjectURL.bind(URL);
    URL.createObjectURL=(blob)=>{globalThis.__bulkExportBlob=blob;return create(blob);};
    return true;
  })()`);

  await tabTo(side, ".live-schema-bulk-review button:not([disabled])", "confirm");
  for (let attempt = 0; attempt < 4 && !await evaluate(side,
    "document.activeElement?.textContent.trim().startsWith('Add observed properties')");
    attempt += 1) await key(side, "Tab", "Tab", 9);
  assert.equal(await evaluate(side,
    "document.activeElement?.textContent.trim().startsWith('Add observed properties')"),
  true);
  await key(side, "Enter", "Enter", 13);

  const recovery = await until(side, `(()=>{
    const dialog=document.querySelector("#durable-storage-recovery");
    const review=document.querySelector(".live-schema-bulk-review");
    if(!dialog?.matches(":modal")||!review?.open)return null;
    const rect=dialog.getBoundingClientRect(),button=document.querySelector("#export-unsaved-draft");
    const box=button.getBoundingClientRect(),x=box.left+box.width/2,y=box.top+box.height/2;
    const hit=document.elementFromPoint(x,y);
    return{outsideHiddenProjects:!dialog.closest("#data-layer-panel-projects"),
      withinViewport:rect.left>=0&&rect.top>=0&&rect.right<=innerWidth&&rect.bottom<=innerHeight,
      visible:rect.width>0&&rect.height>0,
      exportHit:Boolean(hit&&(hit===button||button.contains(hit))),
      feedback:review.querySelector("output").textContent};
  })()`, "durable recovery");
  assert.deepEqual({...recovery, feedback: ""}, {
    outsideHiddenProjects: true, withinViewport: true, visible: true,
    exportHit: true, feedback: "",
  });
  assert.equal(JSON.stringify(await evaluate(side, savedSchemas)), durableBefore,
    "failed save must not partially commit");

  await pointer(side, "document.querySelector('#export-unsaved-draft')", "export recovery");
  const exported = JSON.parse(await until(side,
    "globalThis.__bulkExportBlob?.text()", "recovery export"));
  const retained = exported.operations.upserts
    .filter(({schema}) => schema.name === "Failed checkout");
  assert.equal(retained.length, 1);
  const pending = retained[0].schema;
  assert.deepEqual(
    Object.keys(pending.workingDraft.document.properties.products.items.properties).sort(),
    ["price", "product_id", "product_name"],
  );
  assert.equal(
    pending.workingDraft.document.properties.products.items.properties.price.type,
    "number",
  );
  assert.deepEqual(
    pending.workingDraft.documentation.properties["/products/*/price"].example,
    {value: 25, selectionMethod: "custom"},
  );

  await pointer(side, "document.querySelector('#close-storage-recovery')",
    "close recovery");
  await pointer(side, reviewButton("Cancel"), "cancel failed review");
  await until(side, "!document.querySelector('.live-schema-bulk-review')",
    "review disposal");
  await pointer(side,
    "document.querySelector('#live-inspector-action-add-all-to-schema')",
    "reopen Add all action");
  await until(side,
    "document.querySelector('.live-schema-bulk-review')?.matches(':modal')",
    "reopened review");
  await key(side, "Escape", "Escape", 27);
  await until(side, "!document.querySelector('.live-schema-bulk-review')",
    "reopened review dismissal");

  const errors = side.events.filter(({method, params}) =>
    method === "Runtime.exceptionThrown" ||
    (method === "Log.entryAdded" && params.entry?.level === "error"));
  assert.deepEqual(errors, []);
  console.log("Live Add all hidden-host native recovery browser test passed");
} finally {
  side?.close();
  await stopHeadlessChrome(chrome);
  await removeChromeProfile(profile, {targetId: "live-add-recovery"});
}
