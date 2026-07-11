import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const chromeProfile = await mkdtemp(path.join(os.tmpdir(), "side-panel-layout-"));
const assetServer = createServer(async (request, response) => {
  const requested = request.url === "/" ? "side-panel.html" : request.url?.slice(1);
  const file = path.resolve("dist", requested ?? "side-panel.html");
  if (!file.startsWith(path.resolve("dist") + path.sep)) {
    response.writeHead(404).end();
    return;
  }
  try {
    const content = await readFile(file);
    const contentType = file.endsWith(".js") ? "text/javascript"
      : file.endsWith(".css") ? "text/css"
        : "text/html";
    response.writeHead(200, { "Content-Type": contentType }).end(content);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((resolve) => assetServer.listen(0, "127.0.0.1", resolve));
const assetPort = assetServer.address().port;
const chrome = spawn("google-chrome", [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  "--remote-debugging-port=0",
  `--user-data-dir=${chromeProfile}`,
  "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function debuggingPort() {
  return new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => reject(new Error("Chrome did not expose a debugging port.")), 10000);
    chrome.stderr.on("data", (chunk) => {
      output += chunk;
      const match = output.match(/ws:\/\/127\.0\.0\.1:(\d+)\//);
      if (match) {
        clearTimeout(timeout);
        resolve(Number(match[1]));
      }
    });
    chrome.once("error", reject);
    chrome.once("exit", (code, signal) => reject(new Error(`Chrome exited before startup (${code ?? signal}). ${output.trim()}`)));
  });
}

class DevtoolsSocket {
  constructor(url) {
    this.url = new URL(url);
    this.nextId = 1;
    this.pending = new Map();
    this.buffer = Buffer.alloc(0);
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.socket = net.createConnection({ host: this.url.hostname, port: Number(this.url.port) });
      this.socket.once("error", reject);
      this.socket.once("connect", () => {
        const key = Buffer.from(String(Math.random())).toString("base64");
        this.socket.write([
          `GET ${this.url.pathname}${this.url.search} HTTP/1.1`,
          `Host: ${this.url.host}`,
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Key: ${key}`,
          "Sec-WebSocket-Version: 13",
          "\r\n",
        ].join("\r\n"));
      });
      let handshake = "";
      const receiveHandshake = (chunk) => {
        handshake += chunk.toString("binary");
        const end = handshake.indexOf("\r\n\r\n");
        if (end < 0) return;
        this.socket.off("data", receiveHandshake);
        if (!handshake.startsWith("HTTP/1.1 101")) {
          reject(new Error(`DevTools WebSocket upgrade failed: ${handshake.slice(0, end)}`));
          return;
        }
        const remaining = Buffer.from(handshake.slice(end + 4), "binary");
        this.socket.on("data", (data) => this.receive(data));
        if (remaining.length) this.receive(remaining);
        resolve();
      };
      this.socket.on("data", receiveHandshake);
    });
  }

  receive(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (this.buffer.length >= 2) {
      const first = this.buffer[0];
      let length = this.buffer[1] & 0x7f;
      let offset = 2;
      if (length === 126) {
        if (this.buffer.length < 4) return;
        length = this.buffer.readUInt16BE(2);
        offset = 4;
      } else if (length === 127) {
        if (this.buffer.length < 10) return;
        length = Number(this.buffer.readBigUInt64BE(2));
        offset = 10;
      }
      if (this.buffer.length < offset + length) return;
      const payload = this.buffer.subarray(offset, offset + length);
      this.buffer = this.buffer.subarray(offset + length);
      if ((first & 0x0f) !== 1) continue;
      const message = JSON.parse(payload.toString("utf8"));
      const pending = this.pending.get(message.id);
      if (!pending) continue;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    }
  }

  send(payload) {
    const text = Buffer.from(JSON.stringify(payload));
    const mask = Buffer.from([1, 2, 3, 4]);
    let header;
    if (text.length < 126) header = Buffer.from([0x81, 0x80 | text.length]);
    else if (text.length <= 0xffff) {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 0x80 | 126;
      header.writeUInt16BE(text.length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x81;
      header[1] = 0x80 | 127;
      header.writeBigUInt64BE(BigInt(text.length), 2);
    }
    const body = Buffer.from(text);
    for (let index = 0; index < body.length; index += 1) body[index] ^= mask[index % mask.length];
    this.socket.write(Buffer.concat([header, mask, body]));
  }

  call(method, params = {}) {
    const id = this.nextId++;
    this.send({ id, method, params });
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  close() { this.socket?.destroy(); }
}

async function openPanel(port, width, height = 900) {
  const panelUrl = `http://127.0.0.1:${assetPort}/side-panel.html`;
  const page = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(panelUrl)}`, { method: "PUT" }).then((response) => response.json());
  const socket = new DevtoolsSocket(page.webSocketDebuggerUrl);
  await socket.connect();
  await socket.call("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
  await socket.call("Runtime.enable");
  let loaded = false;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const ready = await socket.call("Runtime.evaluate", {
      expression: "document.readyState === 'complete' && document.querySelector('#side-panel-root') !== null",
      returnByValue: true,
    });
    if (ready.result.value === true) {
      loaded = true;
      break;
    }
    await wait(50);
  }
  if (!loaded) throw new Error("Side panel DOM did not finish loading.");
  return socket;
}

async function evaluate(socket, expression) {
  const result = await socket.call("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  }
  return result.result.value;
}

const fixture = `(() => {
  const text = "Long metadata and form content that must wrap within the side panel component without creating document overflow. ".repeat(8);
  for (const selector of ["#data-layer-panel-live", "#data-layer-panel-library", "#data-layer-panel-sessions", "#data-layer-panel-schemas", "#event-property-editor", "#live-event-inspector"]) document.querySelector(selector).hidden = false;
  document.querySelector("#data-layer-panel-live").dataset.liveLayout = "wide-detail";
  document.querySelector("#event-template-json").value = text;
  document.querySelector("#push-destination-path").value = "analytics.destination.with.a.deliberately.long.name";
  for (const selector of ["#live-event-feed", "#event-template-list", "#saved-session-list", "#schema-list"]) {
    const list = document.querySelector(selector);
    list.replaceChildren(...Array.from({ length: 60 }, (_, index) => {
      const item = document.createElement("li"); item.textContent = \`Fixture item \${index + 1}: \${text}\`; return item;
    }));
  }
  const code = document.createElement("pre"); code.id = "layout-code-fixture"; code.textContent = text.repeat(6); document.querySelector("#live-event-inspector").append(code);
  document.querySelector("#live-target-page").textContent = text;
  return true;
})()`;

const measurements = `(() => {
  const rect = (selector) => { const value = document.querySelector(selector).getBoundingClientRect(); return { x:value.x, y:value.y, width:value.width, height:value.height, right:value.right, bottom:value.bottom }; };
  const css = (selector) => getComputedStyle(document.querySelector(selector));
  const controls = [...document.querySelectorAll('textarea,input[type="text"]')].filter((element) => element.getClientRects().length).map((element) => {
    const parent = element.parentElement; const style = getComputedStyle(parent); const box = element.getBoundingClientRect();
    return { id: element.id, width: box.width, available: parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight), right: box.right, parentRight: parent.getBoundingClientRect().right };
  });
  const visibleText = [...document.querySelectorAll("label,button,output,dt,dd")].filter((element) => element.getClientRects().length && !element.classList.contains("visually-hidden")).map((element) => ({ text: element.textContent.trim(), clipped: element.scrollWidth > element.clientWidth + 1 }));
  return {
    document: { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth },
    root: rect("#workspace-panel-data-layer"),
    live: { header:rect("#live-session-header"), source:rect("#live-source-statuses"), master:rect("#live-event-list"), detail:rect("#live-event-inspector"), actions:rect("#live-context-actions"), areas:css("#data-layer-panel-live").gridTemplateAreas },
    library: { master:rect("#event-template-list"), detail:rect("#event-property-editor"), areas:css("#data-layer-panel-library").gridTemplateAreas },
    sessions: { master:rect("#saved-session-list"), detail:rect("#saved-session-detail"), areas:css("#data-layer-panel-sessions").gridTemplateAreas },
    schemas: { master:rect("#schema-list"), detail:rect("#schema-detail"), areas:css("#data-layer-panel-schemas").gridTemplateAreas },
    controls, visibleText,
    actionChildren: [...document.querySelector("#live-context-actions").querySelectorAll("button")].filter((button) => button.getClientRects().length).map((button) => ({ rect: { x:button.getBoundingClientRect().x, right:button.getBoundingClientRect().right }, parent:rect("#live-context-actions") })),
    overflow: ["#live-event-list", "#event-template-list", "#saved-session-list", "#schema-list", "#layout-code-fixture"].map((selector) => { const element = document.querySelector(selector); return { selector, scrollHeight:element.scrollHeight, clientHeight:element.clientHeight, overflowY:getComputedStyle(element).overflowY }; }),
  };
})()`;

const inspectorReturnRuntime = `import("./data-layer-live-inspector-return-ui.js").then(({ restoreInspectorReturnUi }) => {
  const eventList = document.createElement("section");
  eventList.style.cssText = "height:40px;overflow:auto";
  const eventFeed = document.createElement("div");
  const spacer = document.createElement("div");
  spacer.style.height = "1000px";
  const eventButton = document.createElement("button");
  eventButton.dataset.eventId = "purchase";
  eventButton.textContent = "purchase";
  eventFeed.append(spacer, eventButton);
  eventList.append(eventFeed);
  document.body.append(eventList);
  restoreInspectorReturnUi({ eventList, eventFeed }, { eventId: "purchase", scrollTop: 480 });
  const result = { scrollTop: eventList.scrollTop, focusedEventId: document.activeElement?.dataset.eventId };
  eventList.remove();
  return result;
})`;

const hiddenStateRuntime = `(() => {
  const component = document.createElement("section");
  component.hidden = true;
  component.style.display = "flex";
  const control = document.createElement("button");
  control.textContent = "Hidden control";
  component.append(control); document.body.append(component);
  control.focus();
  const result = {
    display: getComputedStyle(component).display,
    offsetParent: component.offsetParent === null,
    zeroSpace: component.getBoundingClientRect().width === 0 && component.getBoundingClientRect().height === 0,
    focusExcluded: document.activeElement !== control,
    ariaHidden: component.getAttribute("aria-hidden") !== "false",
  };
  component.remove(); return result;
})()`;

const inspectorNavigationRuntime = `import("./data-layer-live-observer-ui.js").then(({ renderLiveInspector, renderLiveObserverState }) => {
  const eventList = document.querySelector("#live-event-list");
  const eventFeed = document.querySelector("#live-event-feed");
  const eventInspector = document.querySelector("#live-event-inspector");
  const backToEventsButton = document.querySelector("#back-to-events");
  const event = { id:"purchase", name:"purchase", sourceId:"history", captureTime:"10:03:00", payload:{} };
  const elements = { eventList, eventFeed, eventInspector, backToEventsButton, sourceStatuses:null };
  renderLiveObserverState(elements, { sources:[], events:[event], inspectorEventId:"purchase", listVisible:false }, () => {});
  renderLiveInspector(elements, event, {
    copyPayload: async () => {}, saveToLibrary: () => {}, validate: () => {},
    validationAvailability: () => ({ enabled:true }),
  });
  const hiddenAncestor = (element) => { for (let current = element; current; current = current.parentElement) if (current.hidden) return true; return false; };
  return {
    listInLayout: eventList.getClientRects().length > 0,
    inspectorInLayout: eventInspector.getClientRects().length > 0,
    backInLayout: backToEventsButton.getClientRects().length > 0,
    backHasHiddenAncestor: hiddenAncestor(backToEventsButton),
    backInsideList: eventList.contains(backToEventsButton),
    backIsFirstHeaderControl: eventInspector.firstElementChild?.firstElementChild === backToEventsButton,
  };
})`;

const pathnameHeaderRuntime = `import("./data-layer-live-observer-ui.js").then(({ renderLiveObserverState }) => {
  const feed = document.createElement("ul"); const list = document.createElement("section"); list.style.cssText = "width:100%;overflow-x:hidden"; list.append(feed); document.body.append(list);
  const events = [
    { id:"event-1", name:"pageview", sourceId:"event-history", captureTime:"10:00:00", pageUrl:"https://example.test/products", payload:{ page_name:"Products", page_type:"listing", page_category:"catalog" } },
    { id:"event-2", name:"pageview", sourceId:"event-history", captureTime:"10:01:00", pageUrl:"https://example.test/products", payload:{ page_name:"Products", page_type:"detail", page_category:"product" } },
    { id:"event-3", name:"pageview", sourceId:"event-history", captureTime:"10:02:00", pageUrl:"https://example.test/checkout", payload:{ page_name:"Checkout", page_type:"form", page_category:"conversion" } },
    { id:"event-4", name:"pageview", sourceId:"event-history", captureTime:"10:03:00", pageUrl:"https://example.test/checkout", payload:{ page_name:"", page_type:"detail", page_category:"product" } },
    { id:"event-5", name:"pageview", sourceId:"event-history", captureTime:"10:04:00", pageUrl:"https://example.test/products", payload:{} },
  ];
  renderLiveObserverState({ livePanel:null, eventFeed:feed, eventList:list, eventInspector:null, backToEventsButton:null, sourceStatuses:null }, { sources:[], events, listVisible:true }, () => {});
  const headers = [...feed.querySelectorAll(".pathname-visit-heading")].map((header) => ({ text:header.textContent.trim(), name:header.getAttribute("aria-label"), associated:header.parentElement.getAttribute("aria-labelledby") === header.id }));
  const rows = [...feed.querySelectorAll(".pathname-visit button")].map((button) => button.textContent);
  renderLiveObserverState({ livePanel:null, eventFeed:feed, eventList:list, eventInspector:null, backToEventsButton:null, sourceStatuses:null }, { sources:[], events:[{ id:"long", name:"pageview", sourceId:"event-history", captureTime:"10:04:00", pageUrl:"https://example.test/products/field-notebook", payload:{} }], listVisible:true }, () => {});
  const longHeader = feed.querySelector(".pathname-visit-heading"); const headerRect = longHeader.getBoundingClientRect(); const listRect = list.getBoundingClientRect();
  const longResult = {
    bounded:headerRect.left >= listRect.left - 1 && headerRect.right <= listRect.right + 1,
    unclipped:[...longHeader.children].every((field) => field.scrollWidth <= field.clientWidth + 1),
    pathnameCount:(longHeader.textContent.match(/\\/products\\/field-notebook/g) ?? []).length,
    documentFits:document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  };
  list.remove(); return { headers, rows, longResult };
})`;

const pushDecisionRuntime = `Promise.all([
  import("./data-layer-push-draft-review.js"),
  import("./data-layer-push-draft-review-ui.js"),
]).then(([reviewModel, reviewUi]) => {
  const host = document.createElement("section"); host.id = "push-draft-review";
  host.innerHTML = '<dl id="push-draft-review-details"></dl><ul id="push-draft-review-change-list"></ul><p id="push-draft-review-no-changes" hidden>No payload changes</p>';
  document.body.append(host);
  const elements = reviewUi.findPushDraftReviewElements(host);
  const template = { eventName:"purchase", destination:"queue.history", version:3, validation:"Valid", payload:{ ecommerce:{ value:18 }, items:[{ quantity:1 }], legacy:{ debug:true } } };
  const target = { title:"Signal Shop", pageUrl:"https://signal.example.test/checkout" };
  const changed = reviewModel.createPushDraftReview({ template, draft:{ ecommerce:{ value:19 }, items:[{ quantity:2 }], experiment:{ variant:"treatment-b" } } }, target);
  reviewUi.renderPushDraftReview(elements, changed);
  const pairs = (root) => [...root.querySelectorAll("dt")].map((term) => [term.textContent, term.nextElementSibling?.textContent]);
  const detailPairs = pairs(elements.details);
  const changePairs = [...elements.changeList.querySelectorAll("dl")].map(pairs);
  const columns = getComputedStyle(elements.details).gridTemplateColumns.trim().split(/\\s+/).length;
  const readable = [...host.querySelectorAll("dt,dd")].every((value) => value.scrollWidth <= value.clientWidth + 1);
  const documentFits = document.documentElement.scrollWidth <= document.documentElement.clientWidth;
  const unchanged = reviewModel.createPushDraftReview({ template, draft:structuredClone(template.payload) }, target);
  reviewUi.renderPushDraftReview(elements, unchanged);
  const emptyResult = { text:elements.noChanges.textContent, visible:!elements.noChanges.hidden, changeCount:elements.changeList.children.length };
  host.remove();
  return { detailPairs, changePairs, columns, readable, documentFits, emptyResult };
})`;

const templateRenameRuntime = `Promise.all([
  import("./data-layer-event-library-editor-ui.js"),
  import("./data-layer-event-template-renaming.js"),
]).then(([editorUi, rename]) => {
  const list = document.querySelector("#event-template-list");
  const dialog = document.querySelector("#event-template-rename");
  const name = document.querySelector("#event-template-rename-name");
  const eventName = document.querySelector("#event-template-rename-event-name");
  const revisionHistory = document.querySelector("#event-template-revision-history");
  const template = { id:"template-7", name:"Purchase confirmation", eventName:"purchase", sourceId:"event-history", sourceName:"Event history", destination:"queue.history", tags:["checkout"], schemaId:"purchase", validation:"Valid", payload:{ transaction_id:"T-1" }, version:3, originatingSessionId:"session-1", originatingEventId:"event-1", provenance:"captured:event-history" };
  const elements = { search:null, saveLatestButton:null, count:null, list, propertyEditor:null, editorTitle:null, editorSummary:null, revisionHistory, properties:null, json:null, pushDestination:null, validation:null, saveRevisionButton:null, saveCopyButton:null, pushDraftButton:null, discardDraftButton:null, closeEditorButton:null, backToCapturedEventButton:null, result:null };
  let opened;
  editorUi.renderEventLibraryEditor(elements, [template], undefined, { edit:()=>{}, rename:(value) => {
    opened = rename.beginTemplateRename(value); name.value = opened.templateName; eventName.value = opened.eventName; dialog.hidden = false; dialog.showModal(); name.focus();
  }, duplicate:()=>{}, push:()=>{} });
  const action = list.querySelector('[aria-label="Rename Purchase confirmation"]'); action.click();
  const editor = { template, revisions:[], draft:structuredClone(template.payload), jsonDraft:JSON.stringify(template.payload), dirty:false };
  const renamed = rename.saveTemplateRename(editor, { templateName:"Completed checkout", eventName:"checkout_completed" });
  editorUi.renderEventLibraryEditor(elements, [renamed.template], renamed, { edit:()=>{}, rename:()=>{}, duplicate:()=>{}, push:()=>{} });
  const result = {
    actionText:action.textContent,
    actionName:action.getAttribute("aria-label"),
    fields:[...dialog.querySelectorAll("label")].map((label) => label.textContent),
    values:[name.value, eventName.value],
    associated:[name.getAttribute("aria-describedby"), eventName.getAttribute("aria-describedby")],
    focused:document.activeElement === name,
    modal:dialog.matches(":modal"),
    renamed:{ name:renamed.template.name, eventName:renamed.template.eventName, version:renamed.template.version, priorEvent:renamed.revisions[0].eventName, payload:renamed.template.payload.transaction_id, destination:renamed.template.destination, provenance:renamed.template.provenance },
    validation:rename.renameValidation({ templateName:"   ", eventName:"purchase" }),
    history:[...revisionHistory.children].map((item) => item.textContent),
  };
  dialog.close(); dialog.hidden = true; return result;
})`;

const jsonValidationRecoveryRuntime = `Promise.all([
  import("./data-layer-event-library-editor.js"),
  import("./data-layer-event-library-editor-ui.js"),
  import("./data-layer-push-draft-review.js"),
  import("./data-layer-push-draft-review-ui.js"),
]).then(([editorModel, editorUi, reviewModel, reviewUi]) => {
  const elements = editorUi.findEventLibraryEditorElements();
  const template = { id:"template-scroll", name:"Scroll depth", eventName:"scroll", sourceId:"history", sourceName:"Event history", destination:"queue.history", tags:[], validation:"Valid", payload:{ tealium_generated:"1", scroll_percentage:0 }, version:3, originatingSessionId:"session-1", originatingEventId:"event-1", provenance:"captured:history" };
  let state = editorModel.openPropertyEditor(template);
  const actions = { edit:()=>{}, rename:()=>{}, duplicate:()=>{}, push:()=>{} };
  const invalidSource = '{\\n  "tealium_generated": "1",\\n  "scroll_percentage": 25,\\n\\n}';
  elements.json.value = invalidSource; elements.json.dispatchEvent(new Event("input", { bubbles:true }));
  state = editorModel.updateDraftJson(state, elements.json.value);
  editorUi.renderEventLibraryEditor(elements, [template], state, actions);
  const invalid = { error:Boolean(state.jsonError), status:elements.validation.textContent, invalid:elements.json.getAttribute("aria-invalid"), saveDisabled:elements.saveRevisionButton.disabled, pushDisabled:elements.pushDraftButton.disabled, saveReason:document.querySelector("#save-template-revision-reason").textContent, pushReason:document.querySelector("#push-template-draft-reason").textContent, draft:state.draft };
  elements.json.value = '{\\n  "tealium_generated": "1",\\n  "scroll_percentage": 25\\n}'; elements.json.dispatchEvent(new Event("input", { bubbles:true }));
  state = editorModel.updateDraftJson(state, elements.json.value);
  editorUi.renderEventLibraryEditor(elements, [template], state, actions);
  const recovered = { error:Boolean(state.jsonError), status:elements.validation.textContent, invalid:elements.json.getAttribute("aria-invalid"), saveDisabled:elements.saveRevisionButton.disabled, pushDisabled:elements.pushDraftButton.disabled, draft:state.draft };
  const transitions = [];
  for (let cycle = 0; cycle < 3; cycle += 1) {
    state = editorModel.updateDraftJson(state, invalidSource); editorUi.renderEventLibraryEditor(elements, [template], state, actions);
    transitions.push(Boolean(state.jsonError) && elements.saveRevisionButton.disabled && elements.pushDraftButton.disabled);
    state = editorModel.updateDraftJson(state, '{"tealium_generated":"1","scroll_percentage":25}'); editorUi.renderEventLibraryEditor(elements, [template], state, actions);
    transitions.push(!state.jsonError && !elements.saveRevisionButton.disabled && !elements.pushDraftButton.disabled && !elements.validation.textContent.includes("Invalid JSON"));
  }
  const saved = editorModel.saveDraftRevision(state);
  const review = reviewModel.createPushDraftReview(state, { title:"Signal Shop", pageUrl:"https://signal.example.test/checkout", accessState:"Ready" });
  const reviewElements = reviewUi.findPushDraftReviewElements(); reviewUi.renderPushDraftReview(reviewElements, review);
  const reviewChanges = [...reviewElements.changeList.querySelectorAll("dl")].map((row) => [...row.querySelectorAll("dd")].map((value) => value.textContent));
  return { invalid, recovered, transitions, saved:{ version:saved.template.version, payload:saved.template.payload }, review:{ event:review.rows[0][1], draft:review.editor.draft, changes:reviewChanges } };
})`;

const libraryNewEventRuntime = `Promise.all([
  import("./data-layer-event-library-editor.js"),
  import("./data-layer-event-library-editor-ui.js"),
]).then(([model, ui]) => {
  const elements = ui.findEventLibraryEditorElements();
  let state = model.createNewEventEditor();
  ui.renderEventLibraryEditor(elements, [], state, { edit:()=>{}, rename:()=>{}, duplicate:()=>{}, push:()=>{} });
  const initial = { title:elements.editorTitle.textContent, count:elements.count.textContent, addHidden:elements.addNewButton.hidden, name:elements.templateName.value, event:elements.eventName.value, source:elements.source.value, destination:elements.pushDestination.value, json:elements.json.value, saveDisabled:elements.saveRevisionButton.disabled };
  state = model.setNewEventField(state, "name", "Scroll milestone"); state = model.setNewEventField(state, "eventName", "scroll"); state = model.setNewEventField(state, "source", { id:"event-history", name:"Event history" }); state = model.setNewEventField(state, "destination", "event.history"); state = model.updateDraftJson(state, '{"scroll_percentage":25}');
  const created = model.saveNewEvent(state, () => "template:library:new");
  return { initial, created };
})`;

const eventLibraryDeletionRuntime = `import("./data-layer-event-library-deletion.js").then((deletion) => {
  const template = (id, name) => ({ id, name, eventName:"purchase", sourceId:"history", sourceName:"Event history", destination:"event.history", tags:[], validation:"Valid", payload:{}, version:1, provenance:"library-created" });
  const first = template("template-7", "Purchase confirmation"); const sameNamed = template("template-9", "Purchase confirmation");
  return { afterDelete:deletion.deleteEventTemplate([first, sameNamed], "template-7").map((item) => item.id), afterClear:deletion.clearEventLibrary([first, sameNamed]).length };
})`;

const workflowFocusRuntime = `Promise.all([
  import("./data-layer-event-library-editor-ui.js"),
  import("./data-layer-workflow-focus-ui.js"),
  import("./data-layer-observation-targets-ui.js"),
]).then(([editorUi, pushUi, targetUi]) => {
  const workspaceData = document.querySelector("#workspace-tab-data-layer");
  const workspaceHotkeys = document.querySelector("#workspace-tab-hotkeys");
  workspaceData.focus(); workspaceData.dispatchEvent(new KeyboardEvent("keydown", { key:"ArrowRight", bubbles:true }));
  const tabResult = { workspaceRight:document.activeElement === workspaceHotkeys && workspaceHotkeys.getAttribute("aria-selected") === "true" };
  workspaceHotkeys.dispatchEvent(new KeyboardEvent("keydown", { key:"ArrowLeft", bubbles:true }));
  tabResult.workspaceLeft = document.activeElement === workspaceData && workspaceData.getAttribute("aria-selected") === "true";
  const liveTab = document.querySelector("#data-layer-view-live"); const schemasTab = document.querySelector("#data-layer-view-schemas");
  liveTab.focus(); liveTab.dispatchEvent(new KeyboardEvent("keydown", { key:"End", bubbles:true }));
  tabResult.dataLayerEnd = document.activeElement === schemasTab && schemasTab.tabIndex === 0 && !document.querySelector("#data-layer-panel-schemas").hidden;
  schemasTab.dispatchEvent(new KeyboardEvent("keydown", { key:"Home", bubbles:true }));
  tabResult.dataLayerHome = document.activeElement === liveTab && liveTab.tabIndex === 0 && !document.querySelector("#data-layer-panel-live").hidden;
  tabResult.singleDataLayerTabStop = [...document.querySelectorAll("#data-layer-views [role=tab]")].filter((tab) => tab.tabIndex === 0).length === 1;

  const host = document.createElement("section");
  host.innerHTML = '<ul data-list></ul><section data-editor><h4 data-title tabindex="-1"></h4><dl data-summary></dl><ul data-properties></ul><textarea data-json></textarea><input data-destination><output data-validation></output></section>';
  document.body.append(host);
  const template = { id:"template:purchase", name:"Purchase confirmation", eventName:"purchase", sourceName:"history", destination:"dataLayer", version:3, validation:"Valid", tags:[], provenance:"captured", originatingEventId:"purchase", originatingSessionId:"session-1", payload:{ transaction_id:"T-1", revenue:12 } };
  const editor = { template, revisions:[], draft:template.payload, jsonDraft:JSON.stringify(template.payload), dirty:false };
  const elements = { list:host.querySelector("[data-list]"), propertyEditor:host.querySelector("[data-editor]"), editorTitle:host.querySelector("[data-title]"), editorSummary:host.querySelector("[data-summary]"), properties:host.querySelector("[data-properties]"), json:host.querySelector("[data-json]"), pushDestination:host.querySelector("[data-destination]"), validation:host.querySelector("[data-validation]") };
  editorUi.renderEventLibraryEditor(elements, [template], editor, { edit:()=>{}, duplicate:()=>{}, push:()=>{} });
  elements.editorTitle.focus({ preventScroll:true });
  const editorResult = { title:elements.editorTitle.textContent, headingFocused:document.activeElement === elements.editorTitle, disclosuresClosed:!document.querySelector("#event-template-json-section").open && !document.querySelector("#event-template-execution-settings").open };
  editorUi.renderEventLibraryEditor(elements, [template], undefined, { edit:()=>{}, duplicate:()=>{}, push:()=>{} });
  editorUi.focusTemplateEditAction(elements, template.id);
  editorResult.returnedToTemplate = document.activeElement?.dataset.templateId;

  const background = document.createElement("button"); background.textContent = "Background";
  const trigger = document.createElement("button"); trigger.textContent = "Push draft";
  const dialog = document.createElement("dialog");
  dialog.innerHTML = '<h5 tabindex="-1">Review push</h5><button data-first>Confirm</button><button data-last>Cancel</button>';
  document.body.append(background, trigger, dialog);
  const pushElements = { dialog, heading:dialog.querySelector("h5"), trigger };
  dialog.addEventListener("keydown", (event) => pushUi.handlePushReviewKeydown(pushElements, event));
  trigger.focus(); pushUi.openPushReview(pushElements);
  const pushResult = { headingFocused:document.activeElement === pushElements.heading, modal:dialog.matches(":modal") };
  dialog.querySelector("[data-last]").focus(); dialog.dispatchEvent(new KeyboardEvent("keydown", { key:"Tab", bubbles:true }));
  pushResult.forwardWrapped = document.activeElement === dialog.querySelector("[data-first]");
  dialog.dispatchEvent(new KeyboardEvent("keydown", { key:"Tab", shiftKey:true, bubbles:true }));
  pushResult.backwardWrapped = document.activeElement === dialog.querySelector("[data-last]");
  background.focus(); pushResult.backgroundExcluded = document.activeElement !== background;
  dialog.dispatchEvent(new KeyboardEvent("keydown", { key:"Escape", bubbles:true }));
  pushResult.returnedToTrigger = document.activeElement === trigger;

  const sideContent = document.createElement("section"); const choose = document.createElement("button"); const picker = document.createElement("section");
  const close = document.createElement("button"); const search = document.createElement("input"); const list = document.createElement("ul");
  picker.append(close, search, list); document.body.append(sideContent, choose, picker); choose.focus();
  const targetElements = { sidePanelContent:sideContent, picker, closePickerButton:close, search, list, browseButton:null };
  picker.addEventListener("keydown", (event) => targetUi.handleObservationTargetDialogKeydown(targetElements, event));
  targetUi.showObservationTargetPicker(targetElements);
  const targetResult = { inert:sideContent.hasAttribute("inert"), searchFocused:document.activeElement === search };
  close.focus(); picker.dispatchEvent(new KeyboardEvent("keydown", { key:"Tab", shiftKey:true, bubbles:true }));
  targetResult.backwardWrapped = document.activeElement === search;
  picker.dispatchEvent(new KeyboardEvent("keydown", { key:"Escape", bubbles:true }));
  targetResult.returnedToChoose = document.activeElement === choose;
  host.remove(); background.remove(); trigger.remove(); dialog.remove(); sideContent.remove(); choose.remove(); picker.remove();
  return { tabResult, editorResult, pushResult, targetResult };
})`;

const within = (child, parent) => child.x >= parent.x - 1 && child.right <= parent.right + 1 && child.y >= parent.y - 1 && child.bottom <= parent.bottom + 1;
const withinColumn = (child, parent) => child.x >= parent.x - 1 && child.right <= parent.right + 1;
const overlaps = (left, right) => left.x < right.right && left.right > right.x && left.y < right.bottom && left.bottom > right.y;

try {
  const port = await debuggingPort();
  for (const width of [360, 520, 720]) {
    const socket = await openPanel(port, width);
    await evaluate(socket, fixture);
    const measured = await evaluate(socket, measurements);
    assert.ok(measured.document.scrollWidth <= measured.document.clientWidth, `document overflowed at ${width}px`);
    assert.deepEqual(measured.visibleText.filter(({ clipped }) => clipped), [], `component text was clipped at ${width}px`);
    assert.deepEqual(measured.controls.filter(({ width: controlWidth, available, right, parentRight }) => controlWidth + 1 < available || right > parentRight + 1), [], `form control width contract failed at ${width}px`);
    assert.ok(measured.overflow.every(({ scrollHeight, clientHeight, overflowY }) => scrollHeight > clientHeight && /auto|scroll/.test(overflowY)), `bounded overflow contract failed at ${width}px`);
    assert.deepEqual(await evaluate(socket, pushDecisionRuntime), {
      detailPairs:[["Event","purchase"],["Target title","Signal Shop"],["Target URL","https://signal.example.test/checkout"],["Destination","queue.history"],["Version","3"],["Validation","Valid"]],
      changePairs:[[["Path","ecommerce.value"],["Previous","18"],["Pushed","19"]],[["Path","items[0].quantity"],["Previous","1"],["Pushed","2"]],[["Path","legacy.debug"],["Previous","true"],["Pushed","Not present"]],[["Path","experiment.variant"],["Previous","Not present"],["Pushed","treatment-b"]]],
      columns:width === 360 ? 1 : 2,
      readable:true,
      documentFits:true,
      emptyResult:{ text:"No payload changes", visible:true, changeCount:0 },
    }, `rendered push decision data violated its ${width}px browser contract`);
    assert.deepEqual(await evaluate(socket, templateRenameRuntime), {
      actionText:"Rename",
      actionName:"Rename Purchase confirmation",
      fields:["Template name", "Event name"],
      values:["Purchase confirmation", "purchase"],
      associated:["event-template-rename-name-error", "event-template-rename-event-name-error"],
      focused:true,
      modal:true,
      renamed:{ name:"Completed checkout", eventName:"checkout_completed", version:4, priorEvent:"purchase", payload:"T-1", destination:"queue.history", provenance:"captured:event-history" },
      validation:{ templateName:"Enter a template name" },
      history:["Version 3: Purchase confirmation · purchase"],
    }, `rendered template renaming violated its ${width}px browser contract`);
    assert.deepEqual(await evaluate(socket, jsonValidationRecoveryRuntime), {
      invalid:{ error:true, status:"Invalid JSON at position 58.", invalid:"true", saveDisabled:true, pushDisabled:true, saveReason:"Correct the JSON draft.", pushReason:"Correct the JSON draft.", draft:{ tealium_generated:"1", scroll_percentage:0 } },
      recovered:{ error:false, status:"Properties, JSON, and Validation edit the same draft.", invalid:"false", saveDisabled:false, pushDisabled:false, draft:{ tealium_generated:"1", scroll_percentage:25 } },
      transitions:[true,true,true,true,true,true],
      saved:{ version:4, payload:{ tealium_generated:"1", scroll_percentage:25 } },
      review:{ event:"scroll", draft:{ tealium_generated:"1", scroll_percentage:25 }, changes:[["scroll_percentage","0","25"]] },
    }, `Library JSON validation recovery violated its ${width}px browser contract`);
    assert.deepEqual(await evaluate(socket, libraryNewEventRuntime), {
      initial:{ title:"New event", count:"0 templates", addHidden:true, name:"", event:"", source:"", destination:"", json:"{}", saveDisabled:true },
      created:{ id:"template:library:new", name:"Scroll milestone", eventName:"scroll", sourceId:"event-history", sourceName:"Event history", destination:"event.history", tags:[], validation:"Not checked", payload:{ scroll_percentage:25 }, version:1, provenance:"library-created" },
    }, `Library new event creation violated its ${width}px browser contract`);
    assert.deepEqual(await evaluate(socket, eventLibraryDeletionRuntime), {
      afterDelete:["template-9"], afterClear:0,
    }, `Library deletion violated its ${width}px browser contract`);
    if (width === 360) {
      assert.deepEqual(await evaluate(socket, hiddenStateRuntime), {
        display: "none", offsetParent: true, zeroSpace: true, focusExcluded: true, ariaHidden: true,
      }, "hidden components violated the authoritative browser contract");
      assert.deepEqual([measured.live.header, measured.live.master, measured.live.detail].filter((component) => !withinColumn(component, measured.root)), [], "compact components escaped their content column");
      assert.ok(measured.actionChildren.every(({ rect, parent }) => rect.x >= parent.x - 1 && rect.right <= parent.right + 1), "an action button escaped its wrapping action group");
      assert.deepEqual(await evaluate(socket, inspectorReturnRuntime), {
        scrollTop: 480,
        focusedEventId: "purchase",
      }, "inspector return did not restore browser scroll and focus");
      assert.deepEqual(await evaluate(socket, inspectorNavigationRuntime), {
        listInLayout: false,
        inspectorInLayout: true,
        backInLayout: true,
        backHasHiddenAncestor: false,
        backInsideList: false,
        backIsFirstHeaderControl: true,
      }, "stacked inspector navigation layout violated its browser contract");
      assert.deepEqual(await evaluate(socket, pathnameHeaderRuntime), {
        headers: [
          { text:"/productsLatest 10:04:00Events 1", name:"/products, Latest 10:04:00, Events 1", associated:true },
          { text:"/checkoutLatest 10:03:00Events 2", name:"/checkout, Latest 10:03:00, Events 2", associated:true },
          { text:"/productsLatest 10:01:00Events 2", name:"/products, Latest 10:01:00, Events 2", associated:true },
        ],
        rows:[
          "pageview · 10:04:00 · event-history · Not checked",
          "pageview · 10:03:00 · event-history · Not checked · Page Type detail, Page Category product",
          "pageview · 10:02:00 · event-history · Not checked · Page Name Checkout, Page Type form",
          "pageview · 10:01:00 · event-history · Not checked · Page Name Products, Page Type detail",
          "pageview · 10:00:00 · event-history · Not checked · Page Name Products, Page Type listing",
        ],
        longResult:{ bounded:true, unclipped:true, pathnameCount:1, documentFits:true },
      }, "rendered pathname headers omitted required visit metadata");
      assert.deepEqual(await evaluate(socket, workflowFocusRuntime), {
        tabResult: { workspaceRight:true, workspaceLeft:true, dataLayerEnd:true, dataLayerHome:true, singleDataLayerTabStop:true },
        editorResult: { title:"Purchase confirmation editor", headingFocused:true, disclosuresClosed:true, returnedToTemplate:"template:purchase" },
        pushResult: { headingFocused:true, modal:true, forwardWrapped:true, backwardWrapped:true, backgroundExcluded:true, returnedToTrigger:true },
        targetResult: { inert:true, searchFocused:true, backwardWrapped:true, returnedToChoose:true },
      }, "workflow focus callbacks violated their browser contract");
    }
    if (width === 720) {
      for (const [name, pane, masterRange, detailRange] of [["live", measured.live, [280, 320], [344, 400]], ["library", measured.library, [240, 288], [384, 448]], ["sessions", measured.sessions, [240, 300], [360, 432]], ["schemas", measured.schemas, [240, 300], [360, 432]]]) {
        assert.match(pane.areas, new RegExp(`${name}-master`), `${name} grid has no named master area`);
        assert.match(pane.areas, new RegExp(`${name}-detail`), `${name} grid has no named detail area`);
        assert.ok(pane.master.width >= masterRange[0] && pane.master.width <= masterRange[1], `${name} master width ${pane.master.width} is outside its contract`);
        assert.ok(pane.detail.width >= detailRange[0] && pane.detail.width <= detailRange[1], `${name} detail width ${pane.detail.width} is outside its contract`);
        assert.ok(!overlaps(pane.master, pane.detail), `${name} panes overlap`);
      }
    }
    socket.close();
  }
} finally {
  if (chrome.exitCode === null && !chrome.killed) {
    await Promise.race([new Promise((resolve) => {
      chrome.once("exit", resolve);
      chrome.kill("SIGTERM");
    }), wait(1000)]);
  }
  await new Promise((resolve) => assetServer.close(resolve));
  await rm(chromeProfile, { recursive: true, force: true });
}
