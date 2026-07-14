import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const schemaWorkspaceAdapterObservations = [];
let guidedValidationObservation;
let guidedSchemaPickerObservation;
let liveValidationVisualsObservation;
let singleLiveEventFeedObservation;
let schemaViewContainmentObservation;
let payloadPathFilterPickerObservation;
const reproductionStepActionRowsObservations = [];
let schemaRevisionLifecycleObservation;
let schemaRevisionLifecycleUiObservation;
let guidedDraftContinuationObservation;
let guidedDraftContinuationInitialObservation;
let guidedDraftContinuationReloadObservation;
let schemaPropertyRulePickerObservation;
let schemaManualPropertyObservation;
let schemaNestedPathObservation;
let savedSessionLiveFeedObservation;
let savedSessionLiveFeedReloadObservation;
let workspacePanelContainmentObservation;
const requestedBrowserAdapter = Object.entries(process.env).some(([name, value]) => name.endsWith("_BROWSER_ADAPTER") && value === "1");
const runGuidedDraftContinuationRuntime = process.env.GUIDED_DRAFT_CONTINUATION_BROWSER_ADAPTER === "1" || !requestedBrowserAdapter;
const runSchemaRevisionLifecycleRuntime = process.env.SCHEMA_REVISION_LIFECYCLE_BROWSER_ADAPTER === "1" || !requestedBrowserAdapter;
const runExtendedSchemaWorkspaceRuntime = process.env.SCHEMA_WORKSPACE_BROWSER_ADAPTER === "1" || !requestedBrowserAdapter;
const runSchemaViewContainmentRuntime = process.env.SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER === "1" || runExtendedSchemaWorkspaceRuntime;
const componentWidths = process.env.GUIDED_VALIDATION_BROWSER_ADAPTER === "1" ? [320, 720]
  : process.env.WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER === "1" ? [720]
  : process.env.SAVED_SESSION_LIVE_FEED_BROWSER_ADAPTER === "1" ? [720]
  : process.env.SCHEMA_NESTED_PATH_BROWSER_ADAPTER === "1" ? [720]
  : process.env.SCHEMA_MANUAL_PROPERTY_BROWSER_ADAPTER === "1" ? [320]
  : process.env.SCHEMA_PROPERTY_RULE_PICKER_BROWSER_ADAPTER === "1" ? [320]
  : process.env.REPRODUCTION_STEP_ACTION_ROWS_BROWSER_ADAPTER === "1" ? [360, 520]
    : process.env.GUIDED_DRAFT_CONTINUATION_BROWSER_ADAPTER === "1" || process.env.SCHEMA_REVISION_LIFECYCLE_BROWSER_ADAPTER === "1" ? [720]
      : [320, 360, 520, 720];
const schemaLibraryExportFixture = process.env.SCHEMA_LIBRARY_EXPORT_FIXTURE ?? "2:4";

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

const panelReadyAttempts = 300;

async function openPanel(port, width, height = 900) {
  const panelUrl = `http://127.0.0.1:${assetPort}/side-panel.html`;
  const page = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(panelUrl)}`, { method: "PUT" }).then((response) => response.json());
  const socket = new DevtoolsSocket(page.webSocketDebuggerUrl);
  await socket.connect();
  await socket.call("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
  await socket.call("Runtime.enable");
  let loaded = false;
  for (let attempt = 0; attempt < panelReadyAttempts; attempt += 1) {
    const ready = await socket.call("Runtime.evaluate", {
      expression: "document.readyState === 'complete' && document.querySelector('#side-panel-root') !== null && document.querySelector('#save-and-close-schema') !== null",
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

async function reloadPanel(socket) {
  for (let reloadAttempt = 0; reloadAttempt < 3; reloadAttempt += 1) {
    const reloadToken = `reload-${Date.now()}-${Math.random()}`;
    await evaluate(socket, `document.documentElement.dataset.componentReloadToken = ${JSON.stringify(reloadToken)}`);
    await socket.call("Page.reload");
    for (let attempt = 0; attempt < panelReadyAttempts; attempt += 1) {
      const ready = await evaluate(socket, `(() => {
        if (document.readyState !== "complete" || !document.querySelector("#side-panel-root") || document.documentElement.dataset.componentReloadToken === ${JSON.stringify(reloadToken)}) return false;
        return document.querySelector("#schema-count")?.textContent !== "";
      })()`);
      if (ready) return;
      await wait(50);
    }
  }
  throw new Error("Side panel did not finish reloading.");
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

const schemaRuleEditorVisibilityRuntime = `(() => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const visible = (element) => element.getClientRects().length > 0;
  const configuration = q("#schema-rule-fields");
  const hiddenByView = {};
  for (const view of ["Live", "Library", "Sessions", "Schemas"]) {
    q("#data-layer-view-" + view.toLowerCase()).click();
    hiddenByView[view] = !visible(configuration);
  }
  q("#schema-subview-rules").click();
  q("#create-schema-rule").click();
  return {
    hiddenByView,
    editorVisible:visible(q("#schema-rule-editor")),
    configurationVisible:visible(configuration),
    configurationInsideEditor:q("#schema-rule-editor").contains(configuration),
  };
})()`;

const schemaViewContainmentRuntime = `(() => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const schemasPanel = q("#data-layer-panel-schemas");
  q("#data-layer-view-schemas").click();
  q("#create-schema").click();
  const name = q("#schema-editor-name");
  name.value = "Unsaved checkout schema";
  name.dispatchEvent(new Event("input", { bubbles:true }));
  const containedControls = [
    "#schema-editor", "#close-schema-editor", "#save-and-close-schema",
    "#schema-assignment-editor", "#schema-assignment-version-policy",
    "#schema-revision-review", "#close-schema-editor-review",
    "#schema-import-review", "#schema-delete-review",
    "#schema-rule-delete-review", "#schema-rule-upgrade-review",
  ].every((selector) => schemasPanel.contains(q(selector)));
  const closeReviewContainsActions = [
    "#keep-editing-schema", "#discard-schema-draft", "#save-schema-close-review",
  ].every((selector) => q("#close-schema-editor-review").contains(q(selector)));
  const editorContainsActions = ["#close-schema-editor", "#save-and-close-schema"]
    .every((selector) => q("#schema-editor").contains(q(selector)));
  const assignmentContainsPolicy = q("#schema-assignment-editor").contains(q("#schema-assignment-version-policy"));
  const presentationByView = {};
  for (const view of ["Live", "Library", "Sessions"]) {
    q("#data-layer-view-" + view.toLowerCase()).click();
    const hiddenControls = Array.from(schemasPanel.querySelectorAll("button, input, select, textarea, dialog"));
    presentationByView[view] = {
      panelDisplay:getComputedStyle(schemasPanel).display,
      painted:hiddenControls.some((control) => control.getClientRects().length > 0),
      focusable:hiddenControls.some((control) => { control.focus(); return document.activeElement === control; }),
      closeReviewOpen:q("#close-schema-editor-review").open,
    };
    q("#data-layer-view-schemas").click();
  }
  const restored = {
    editorVisible:q("#schema-editor").getClientRects().length > 0,
    name:name.value,
    closeReviewOpen:q("#close-schema-editor-review").open,
  };
  q("#schema-subview-assignments").click();
  q("#create-schema-assignment").click();
  const assignmentWasOpen = !q("#schema-assignment-editor").hidden;
  q("#data-layer-view-library").click();
  const assignmentHiddenWhileAway = q("#schema-assignment-editor").getClientRects().length === 0;
  q("#data-layer-view-schemas").click();
  q("#schema-subview-rules").click();
  q("#create-schema-rule").click();
  const ruleWasOpen = !q("#schema-rule-editor").hidden;
  q("#data-layer-view-sessions").click();
  const ruleHiddenWhileAway = q("#schema-rule-editor").getClientRects().length === 0;
  return {
    containedControls,
    editorContainsActions,
    closeReviewContainsActions,
    assignmentContainsPolicy,
    standaloneAssignmentPolicy:document.querySelectorAll("#schema-assignment-policy").length,
    presentationByView,
    editorStates:{ assignmentWasOpen, assignmentHiddenWhileAway, ruleWasOpen, ruleHiddenWhileAway },
    restored,
  };
})()`;

const payloadPathFilterPickerRuntime = `(async () => {
  const queryUi = await import("/data-layer-event-feed-query-ui.js");
  const host = document.createElement("section"); host.id = "payload-path-filter-picker-fixture"; document.body.append(host);
  const baseEvents = [
    { id:"purchase", name:"purchase", sourceId:"history", captureTime:"2026-07-13T10:00:00Z", payload:{ currency:"EUR", commerce:{ total:12, order:{ id:"A-42" } }, ...Object.fromEntries(Array.from({ length:40 }, (_, index) => ["fixture_" + index, index])) } },
    { id:"checkout", name:"checkout", sourceId:"history", captureTime:"2026-07-13T10:01:00Z", payload:{ user:{ status:"member" } } },
  ];
  let events = baseEvents;
  let query = { conditions:[] };
  const render = () => queryUi.renderEventFeedQueryBuilder(host, events, query, (next) => { query = next; render(); });
  const q = (selector) => { const element = host.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const button = (label, root = host) => { const result = Array.from(root.querySelectorAll("button")).find((candidate) => candidate.textContent === label); if (!result) throw new Error("Missing " + label); return result; };
  render(); button("Add filter").click();
  let field = q("#event-feed-query-field");
  const initialFieldOptions = Array.from(field.options).map(({ textContent }) => textContent);
  field.value = "Payload property"; field.dispatchEvent(new Event("change", { bubbles:true }));
  let stage = q("#event-feed-payload-path-stage");
  let search = q("#event-feed-payload-path-search");
  let results = q("#event-feed-payload-path-results");
  const resultButtons = Array.from(results.querySelectorAll("button"));
  const presentation = {
    visible:stage.getClientRects().length > 0,
    searchAvailable:Boolean(search),
    customAvailable:Boolean(button("Enter custom path", stage)),
    pathCount:resultButtons.length,
    completeAccessibleNames:resultButtons.every((result) => result.getAttribute("aria-label") === result.textContent),
    bounded:results.scrollHeight > results.clientHeight && results.clientHeight > 0,
    overflowY:getComputedStyle(results).overflowY,
    topFieldsAbsent:resultButtons.every((result) => !initialFieldOptions.includes(result.textContent)),
    searchFocused:document.activeElement === search,
  };
  button("Back to fields", stage).click();
  const back = { stageHidden:stage.hidden, fieldFocused:document.activeElement === field, conditionCount:query.conditions.length };
  field.value = "Payload property"; field.dispatchEvent(new Event("change", { bubbles:true }));
  stage = q("#event-feed-payload-path-stage"); search = q("#event-feed-payload-path-search"); results = q("#event-feed-payload-path-results");
  const reopenedSearchFocused = document.activeElement === search;
  search.value = "commerce"; search.dispatchEvent(new Event("input", { bubbles:true }));
  const filteredPaths = Array.from(results.querySelectorAll("button")).map(({ textContent }) => textContent);
  button("commerce.total", results).click();
  const observedSelection = {
    selected:q("#event-feed-query-selected-field").textContent,
    operatorVisible:q("#event-feed-query-operator").getClientRects().length > 0,
    valueVisible:q("#event-feed-query-value").getClientRects().length > 0,
    suggestions:Array.from(q("#event-feed-query-suggestions").children).map(({ value }) => value),
  };
  field = q("#event-feed-query-field"); field.value = "Payload property"; field.dispatchEvent(new Event("change", { bubbles:true }));
  stage = q("#event-feed-payload-path-stage"); button("Enter custom path", stage).click();
  const customPath = q("#event-feed-query-custom-path");
  const addPath = button("Add property path", stage);
  const blankCustomDisabled = addPath.disabled;
  customPath.value = "commerce.coupon.code"; customPath.dispatchEvent(new Event("input", { bubbles:true })); addPath.click();
  const customSelection = { selected:q("#event-feed-query-selected-field").textContent, conditionCount:query.conditions.length };
  const operator = q("#event-feed-query-operator"); operator.value = "is"; operator.dispatchEvent(new Event("change", { bubbles:true }));
  const value = q("#event-feed-query-value"); value.value = "SUMMER"; value.dispatchEvent(new Event("input", { bubbles:true })); button("Apply condition").click();
  const beforeLaterEvent = q("#live-event-query-count").textContent;
  events = [...baseEvents, { id:"promotion", name:"promotion", sourceId:"history", captureTime:"2026-07-13T10:02:00Z", payload:{ commerce:{ coupon:{ code:"SUMMER" } } } }]; render();
  const afterLaterEvent = q("#live-event-query-count").textContent;
  host.remove();
  return { initialFieldOptions, presentation, back, reopenedSearchFocused, filteredPaths, observedSelection, blankCustomDisabled, customSelection, beforeLaterEvent, afterLaterEvent };
})()`;

const singleLiveEventFeedRuntime = `(async () => {
  const observerUi = await import("/data-layer-live-observer-ui.js");
  const savedSessions = await import("/data-layer-saved-sessions.js");
  const defectReports = await import("/data-layer-defect-report-browser.js");
  const events = [
    { id:"pageview", name:"pageview", sourceId:"event-history", sourceName:"Event history", captureTime:"2026-07-13T10:00:00Z", pageUrl:"https://shop.example/products", payload:{} },
    { id:"promotion", name:"promotion", sourceId:"event-history", sourceName:"Event history", captureTime:"2026-07-13T10:01:00Z", pageUrl:"https://shop.example/products", payload:{} },
    { id:"purchase", name:"purchase", sourceId:"event-history", sourceName:"Event history", captureTime:"2026-07-13T10:02:00Z", pageUrl:"https://shop.example/checkout", payload:{} },
  ];
  observerUi.renderLiveObserverState(observerUi.findLiveObserverElements(), {
    view:"Live", status:"Live", pageUrl:events.at(-1).pageUrl, sources:[], events, listVisible:true,
  }, () => {});
  const feed = document.querySelector("#live-event-feed");
  const completed = {
    id:"session:current", pageScope:"shop.example", startedAt:"2026-07-13T10:00:00Z", endedAt:"2026-07-13T10:03:00Z",
    events:events.map((event, captureOrder) => ({ ...event, rawInput:event.payload, captureOrder })),
  };
  const archive = savedSessions.saveCompletedSession(savedSessions.createSavedSessionLibrary(), completed, "Checkout journey").sessions[0];
  const defectContext = defectReports.defectReportContext(events, "purchase");
  return {
    liveFeedCount:document.querySelectorAll("#live-event-feed").length,
    liveFeedInsideLivePanel:Boolean(feed?.closest("#data-layer-panel-live")),
    duplicateTimelineCount:document.querySelectorAll("#session-timeline").length,
    secondaryCurrentSessionLists:["library", "sessions", "schemas"].map((view) =>
      document.querySelectorAll("#data-layer-panel-" + view + " #live-event-feed, #data-layer-panel-" + view + " #session-timeline").length
    ),
    journey:{
      visits:Array.from(feed.querySelectorAll(".pathname-visit-heading")).map((heading) => heading.querySelector(".pathname-visit-path").textContent),
      eventCount:feed.querySelectorAll("[data-event-id]").length,
    },
    archiveEventIds:archive.events.map(({ id }) => id),
    defectEventIds:defectContext.timeline.map(({ id }) => id),
  };
})()`;

const savedSessionLiveFeedRuntime = `(async () => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const click = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  let pushListener; let channelId;
  const captured = Array.from({ length:14 }, (_, index) => ({ event:index === 13 ? "purchase" : "current", index }));
  globalThis.chrome = {
    tabs:{ query:async () => [{ id:23, windowId:4, url:"http://127.0.0.1:4173/", title:"Fixture", active:true }] },
    scripting:{ executeScript:async (options) => {
      if (options.args?.[0] === "my-chrome-utilities.data-layer-history-entry") channelId = options.args[1];
      return [{ result:{ queue:{ history:captured } } }];
    } },
    runtime:{ onMessage:{ addListener:(listener) => { pushListener = listener; }, removeListener:(listener) => { if (pushListener === listener) pushListener = undefined; } } },
  };
  q("#choose-observation-target").click(); await new Promise((resolve) => setTimeout(resolve, 0));
  q("#observation-target-list [data-target-id]").click(); q("#start-data-layer-testing").click();
  await new Promise((resolve) => setTimeout(resolve, 25));
  q("#data-layer-view-sessions").click();
  const row = Array.from(q("#saved-session-list").children).find(({ textContent }) => textContent.includes("Checkout journey"));
  const actions = Array.from(row.querySelectorAll("button")).map(({ textContent }) => textContent);
  click(row, "Open in Live feed");
  if (!pushListener || !channelId) throw new Error("Production live-history callback was not attached");
  for (let index = 0; index < 4; index += 1) pushListener({ type:"my-chrome-utilities.data-layer-history-entry", channelId, rawValue:{ event:"background", index }, timestamp:"2026-07-13T10:2" + index + ":00Z" }, { tab:{ id:23 } });
  await new Promise((resolve) => setTimeout(resolve, 0));
  const productionFeed = JSON.parse(localStorage.getItem("my-chrome-utilities.saved-session-live-feed.v1"));
  const productionBackground = { background:productionFeed.backgroundEventCount, currentCount:productionFeed.currentView.events.length, savedCount:productionFeed.savedView.events.length, returnLabel:q("#return-to-current-live-feed").textContent };
  q("#return-to-current-live-feed").click(); q("#end-data-layer-testing").click(); await new Promise((resolve) => setTimeout(resolve, 0));
  q("#data-layer-view-sessions").click(); click(row, "Open in Live feed");
  const banner = q("#saved-session-live-banner");
  const open = {
    liveSelected:q("#data-layer-view-live").getAttribute("aria-selected") === "true",
    mode:q("#data-layer-panel-live").dataset.feedMode,
    banner:banner.textContent,
    eventCount:q("#live-captured-event-count").textContent,
    observer:q("#live-observer-status").textContent,
    captureDisabled:[q("#pause-capture").disabled, q("#resume-capture").disabled, q("#save-live-session").disabled],
    storedCount:JSON.parse(localStorage.getItem("my-chrome-utilities.saved-session-library.v1")).sessions[0].events.length,
  };
  const eventButton = q('[data-event-id="saved-18"]'); eventButton.click();
  const analysisActions = Array.from(q("#live-event-inspector").querySelectorAll("button")).map(({ textContent }) => textContent);
  const model = await import("/data-layer-saved-session-live-feed.js");
  const sessions = await import("/data-layer-saved-sessions.js");
  const observers = await import("/data-layer-live-observer.js");
  const library = sessions.restoreSavedSessionLibrary(localStorage.getItem(model.SAVED_SESSION_LIBRARY_STORAGE_KEY));
  const saved = library.sessions[0];
  const currentEvents = Array.from({ length:14 }, (_, index) => ({ id:index === 13 ? "purchase" : "current-" + (index + 1), name:index === 13 ? "purchase" : "current", sourceId:"history", sourceName:"Event history", captureTime:"2026-07-13T09:" + String(index).padStart(2, "0") + ":00Z", pageUrl:"https://example.test/current", payload:{ index }, rawInput:["current", index] }));
  const current = { view:"Live", status:"Live", pageUrl:"https://example.test/current", sources:[{ id:"history", name:"Event history", status:"Connected" }], events:currentEvents, query:{ conditions:[{ id:"purchase", field:"Event name", operator:"is", values:["purchase"] }] }, inspectorEventId:"purchase", listVisible:true };
  let persisted = model.openSavedSessionLiveFeed(current, saved, { scrollTop:480 });
  persisted = model.updateSavedSessionLiveFeedView(persisted, { query:{ conditions:[{ id:"saved-purchase", field:"Event name", operator:"is", values:["purchase"] }] }, inspectorEventId:"saved-18", listVisible:true, scrollTop:275 });
  for (let index = 0; index < 4; index += 1) persisted = model.recordBackgroundLiveEvent(persisted, { id:"background-" + (index + 1), name:"background", sourceId:"history", sourceName:"Event history", captureTime:"2026-07-13T10:2" + index + ":00Z", pageUrl:"https://example.test/current", payload:{ index }, rawInput:["background", index] });
  localStorage.setItem(model.SAVED_SESSION_LIVE_FEED_STORAGE_KEY, model.serializeSavedSessionLiveFeed(persisted));
  localStorage.setItem("dataLayerTestingSession", JSON.stringify({ session:{ id:"active-background", status:"active", tabId:99, historyPath:"event.history", startUrl:"https://example.test/current", currentUrl:"https://example.test/current", timeline:[] } }));
  const restored = model.restoreSavedSessionLiveFeed(model.serializeSavedSessionLiveFeed(persisted), library);
  const imported = sessions.importSavedSession(sessions.createSavedSessionLibrary(), sessions.exportSavedSession(saved)).sessions[0];
  const linked = sessions.resumeSavedSession(sessions.openSavedSession(library, saved.id), "https://example.test/confirmation");
  const draft = model.createSessionSaveDraft({ id:"active", pageScope:current.pageUrl, startedAt:currentEvents[0].captureTime, endedAt:currentEvents.at(-1).captureTime, events:currentEvents });
  return {
    actions, open, analysisActions, productionBackground,
    model:{ savedOrder:persisted.savedView.events.map(({ id }) => id), currentCount:persisted.currentView.events.length, savedCount:persisted.session.events.length, background:persisted.backgroundEventCount, currentSelected:persisted.currentView.inspectorEventId, currentFilter:persisted.currentView.query.conditions[0].values[0], currentScroll:persisted.currentScrollTop, savedSelected:restored.savedView.inspectorEventId, savedScroll:restored.savedScrollTop, observerStarts:restored.startLiveObserver },
    imported:{ ids:imported.events.map(({ id }) => id), sources:imported.events.map(({ sourceId }) => sourceId), payload:imported.events[17].payload, rawInput:imported.events[17].rawInput, pageUrl:imported.events[17].pageUrl, provenance:imported.events[17].provenance },
    linked:{ parent:linked.activeSession.parentSavedSessionId, events:linked.activeSession.events.length, savedEvents:saved.events.length },
    saveDraft:{ eventCount:draft.summary.eventCount, sourceCount:draft.summary.sourceCount, validation:draft.summary.validationSummary },
  };
})()`;

const savedSessionLiveFeedReloadRuntime = `(() => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const click = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  const restored = { mode:q("#data-layer-panel-live").dataset.feedMode, banner:q("#saved-session-live-summary").textContent, background:q("#saved-session-background-status").textContent, returnLabel:q("#return-to-current-live-feed").textContent, selected:q("#live-event-inspector h4").textContent, scrollTop:q("#live-event-list").scrollTop, observer:q("#live-observer-status").textContent };
  q("#revalidate-saved-session").click();
  const comparison = q("#saved-session-validation-comparison").textContent;
  const original = JSON.parse(localStorage.getItem("my-chrome-utilities.saved-session-library.v1")).sessions[0].events[17];
  q("#return-to-current-live-feed").click();
  const returned = { count:q("#live-captured-event-count").textContent, selected:q("#live-event-inspector h4").textContent, query:q("#live-event-query-count").textContent, hasSavedEvent:Boolean(document.querySelector('[data-event-id="saved-18"]')), message:q("#live-session-message").textContent };
  q("#save-live-session").click();
  const saveDialog = q("#save-live-session-dialog"); const name = q("#save-live-session-name"); const confirm = q("#confirm-save-live-session");
  const save = { open:saveDialog.open, focused:document.activeElement === q("#save-live-session-heading"), summary:q("#save-live-session-summary").textContent, blankDisabled:confirm.disabled };
  name.value = "Checkout journey snapshot"; name.dispatchEvent(new Event("input", { bubbles:true })); save.namedEnabled = !confirm.disabled; confirm.click();
  save.persisted = JSON.parse(localStorage.getItem("my-chrome-utilities.saved-session-library.v1")).sessions.find(({ name }) => name === "Checkout journey snapshot").events.length;
  q("#data-layer-view-sessions").click(); const originalRow = Array.from(q("#saved-session-list").children).find(({ textContent }) => textContent.includes("Checkout journey:") && !textContent.includes("snapshot")); click(originalRow, "Start linked capture");
  const linkedSession = JSON.parse(localStorage.getItem("dataLayerTestingSession")).session;
  const linked = { count:q("#live-captured-event-count").textContent, message:q("#live-session-message").textContent, savedCount:JSON.parse(localStorage.getItem("my-chrome-utilities.saved-session-library.v1")).sessions.find(({ name }) => name === "Checkout journey").events.length, parent:linkedSession.parentSavedSessionId, active:linkedSession.status };
  return { restored, comparison, original:{ validation:original.validation, version:original.validationDetails.schema.version }, returned, save, linked };
})()`;

const reproductionStepActionRowsRuntime = `(async () => {
  const ui = await import("/data-layer-defect-report-ui.js");
  const event = (id, pathname, captureTime) => ({
    id, name:id, sourceId:"dataLayer", sourceName:"Data layer", captureTime,
    pageUrl:"https://shop.example" + pathname, payload:{}, validation:"1 error",
    validationDetails:{ schema:{ name:"Checkout", version:4 }, evaluations:[], issues:[{
      instancePath:"/page_type", severity:"error", expected:"checkout", actual:"unknown",
      schemaLocation:"#/page_type", rule:"Known page types v1",
    }] },
  });
  const products = event("pageview", "/products", "2026-07-13T10:00:00Z");
  const checkout = event("purchase", "/checkout", "2026-07-13T10:01:00Z");
  const button = (root, label) => {
    const match = Array.from(root.querySelectorAll("button")).find((candidate) => candidate.textContent === label);
    if (!match) throw new Error("Missing " + label);
    return match;
  };
  const addClickStep = (root, pathname) => {
    const pathnameRow = Array.from(root.querySelectorAll('[data-reproduction-step-kind="pathname"]'))
      .find((row) => row.querySelector("input").value.endsWith(pathname));
    if (!pathnameRow) throw new Error("Missing pathname row " + pathname);
    pathnameRow.querySelector("[data-add-reproduction-step]").click();
    button(root, "Click component").click();
    const name = root.querySelector('[data-reproduction-field="componentName"]');
    name.value = "Checkout"; name.dispatchEvent(new Event("input", { bubbles:true }));
    button(root, "Add step").click();
    return Array.from(root.querySelectorAll('[data-reproduction-step-kind="manual"]')).find((row) => row.textContent.includes("Click Checkout"));
  };
  const mount = (events) => {
    const root = document.createElement("section"); root.className = "reproduction-action-rows-browser-fixture";
    document.body.append(root); ui.renderDefectReportBuilder(root, events.at(-1), { writeRich:async () => {} }, events);
    button(root, "Generate pathname steps").click(); return root;
  };
  const root = mount([products, checkout]);
  const manual = addClickStep(root, "/products");
  if (!manual) throw new Error("Missing generated manual step");
  const text = manual.querySelector(".defect-reproduction-step-text");
  const actions = manual.querySelector(".defect-reproduction-step-actions");
  const guidance = manual.querySelector(".defect-reproduction-step-guidance");
  const actionButtons = Array.from(actions.querySelectorAll("button"));
  const pathnameRows = Array.from(root.querySelectorAll('[data-reproduction-step-kind="pathname"]'));
  const rows = [...pathnameRows, manual].map((row) => ({
    kind:row.dataset.reproductionStepKind,
    textBeforeActions:Array.from(row.children).indexOf(row.querySelector(".defect-reproduction-step-text")) < Array.from(row.children).indexOf(row.querySelector(".defect-reproduction-step-actions")),
    addName:row.querySelector("[data-add-reproduction-step]").getAttribute("aria-label"),
  }));
  const textRect = text.getBoundingClientRect();
  const actionsRect = actions.getBoundingClientRect();
  const guidanceRect = guidance.getBoundingClientRect();
  const observation = {
    width:innerWidth,
    text:text.textContent,
    actionOrder:actionButtons.map(({ textContent }) => textContent),
    tabOrder:Array.from(manual.querySelectorAll("button:not([tabindex='-1'])")).map(({ textContent }) => textContent),
    textBeforeActions:textRect.bottom <= actionsRect.top + 1,
    guidanceAfterActions:actionsRect.bottom <= guidanceRect.top + 1,
    completeControls:actionButtons.every((control) => getComputedStyle(control).whiteSpace === "nowrap" && control.scrollWidth <= actions.clientWidth),
    noHorizontalOverflow:manual.scrollWidth <= manual.clientWidth && root.scrollWidth <= root.clientWidth,
    rows,
  };
  root.remove();
  const checkoutRoot = mount([checkout]);
  const checkoutManual = addClickStep(checkoutRoot, "/checkout");
  const earlier = button(checkoutManual, "Move earlier");
  const checkoutGuidance = checkoutManual.querySelector(".defect-reproduction-step-guidance").textContent;
  observation.checkoutBoundary = {
    text:checkoutManual.querySelector(".defect-reproduction-step-text").textContent,
    earlierVisible:earlier.getClientRects().length > 0,
    earlierDisabled:earlier.disabled,
    guidance:checkoutGuidance,
    chooseAnotherAbsent:!checkoutGuidance.includes("choose another pathname segment"),
  };
  checkoutRoot.remove();
  return observation;
})()`;

const guidedDestinationOptionsRuntime = `(async () => {
  const q = (selector) => { const value = document.querySelector(selector); if (!value) throw new Error("Missing " + selector); return value; };
  globalThis.chrome = {
    tabs:{ query:async () => [{ id:23, windowId:4, url:"http://127.0.0.1:4173/", title:"Fixture", active:true }] },
    scripting:{ executeScript:async () => [{ result:{ queue:{ history:[{ event:"pageview", page_type:"product_list", count:2 }] } } }] },
  };
  q("#choose-observation-target").click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  q("#observation-target-list [data-target-id]").click();
  q("#start-data-layer-testing").click();
  await new Promise((resolve) => setTimeout(resolve, 25));
  q("#live-event-feed button").click();
  Array.from(q("#live-event-inspector").querySelectorAll("button")).find(({ textContent }) => textContent === "Create validation from this event").click();
  const flow = q("#guided-validation-flow");
  flow.querySelector('input[name="guided-property"][value="page_type"]').click();
  Array.from(flow.querySelectorAll("button")).find(({ textContent }) => textContent === "Continue").click();
  flow.querySelector('input[name="guided-schema-destination"][value="existing"]').click();
  return Array.from(q("#guided-schema-results").querySelectorAll(":scope > article")).map((row) => ({
    label:row.querySelector("h6").textContent,
    disabled:row.querySelector("button").disabled,
    explanation:row.querySelectorAll("p")[1].textContent.replace("Property compatibility: ", ""),
  }));
})()`;

const guidedValidationRuntime = `(async () => {
  const q = (selector) => { const value = document.querySelector(selector); if (!value) throw new Error("Missing " + selector); return value; };
  const visible = (element) => element.getClientRects().length > 0 && !element.hidden;
  const clickButton = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find((candidate) => candidate.textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  const storedState = Object.fromEntries(Array.from({ length:localStorage.length }, (_, index) => localStorage.key(index)).filter(Boolean).map((key) => [key, localStorage.getItem(key)]));
  globalThis.chrome = {
    tabs:{ query:async () => [{ id:23, windowId:4, url:"http://127.0.0.1:4173/", title:"Fixture", active:true }] },
    scripting:{ executeScript:async () => [{ result:{ queue:{ history:[{ event:"pageview", page_type:"product_list", count:2 }] } } }] },
  };
  q("#choose-observation-target").click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  q("#observation-target-list [data-target-id]").click();
  q("#start-data-layer-testing").click();
  await new Promise((resolve) => setTimeout(resolve, 25));
  q("#live-event-feed button").click();
  const create = Array.from(q("#live-event-inspector").querySelectorAll("button")).find((button) => button.textContent === "Create validation from this event");
  if (!create) throw new Error("Missing Create validation from this event action");
  const before = {
    schemas:JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1") ?? "[]").length,
    rules:JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1") ?? "[]").length,
  };
  create.click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  const flow = q("#guided-validation-flow");
  const initial = {
    visible:visible(flow),
    heading:q("#guided-validation-heading").textContent,
    focused:document.activeElement === q("#guided-validation-heading"),
    stages:Array.from(q("#guided-validation-stages").children).map((item) => [item.textContent, item.dataset.state]),
    advancedPrimary:!q("#guided-advanced-settings").open && ["#guided-ruleName", "#guided-message", "#guided-sourceId", "#guided-target", "#guided-priority"].every((selector) => q("#guided-advanced-settings").contains(q(selector))),
    persistedUnchanged:JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1") ?? "[]").length === before.schemas && JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1") ?? "[]").length === before.rules,
  };
  Array.from(flow.querySelectorAll("button")).find((button) => button.textContent === "Continue").click();
  const invalid = {
    focused:document.activeElement === q("#guided-validation-errors"),
    link:q("#guided-validation-errors a").textContent,
  };
  flow.querySelector('input[name="guided-property"][value="page_type"]').click();
  Array.from(flow.querySelectorAll("button")).find((button) => button.textContent === "Continue").click();
  const destinationInitial = {
    heading:q("#guided-validation-heading").textContent,
    choices:Array.from(flow.querySelectorAll('input[name="guided-schema-destination"]')).map((input) => input.parentElement.textContent.trim()),
    selected:flow.querySelector('input[name="guided-schema-destination"]:checked')?.value ?? null,
    persistedUnchanged:JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1") ?? "[]").length === before.schemas,
  };
  flow.querySelector('input[name="guided-schema-destination"][value="new"]').click();
  const blankNameAssistance = q("#guided-new-schema-name-assistance").textContent;
  q("#guided-new-schema-name").value = "Existing pageview";
  q("#guided-new-schema-name").dispatchEvent(new Event("input", { bubbles:true }));
  const duplicateNameAssistance = q("#guided-new-schema-name-assistance").textContent;
  q("#guided-new-schema-name").value = "Signal Shop pageview";
  q("#guided-new-schema-name").dispatchEvent(new Event("input", { bubbles:true }));
  const newNameAssistance = q("#guided-new-schema-name-assistance").textContent;
  clickButton(flow, "Continue");
  const requirement = {
    heading:q("#guided-validation-heading").textContent,
    focused:document.activeElement === q("#guided-validation-heading"),
    detected:q("#guided-expected-type-hint").textContent,
    incompatible:Array.from(q("#guided-requirement").options).some((option) => option.textContent === "Must be within a range"),
    oldControls:["#schema-rule-kind", "#schema-rule-types", "#schema-rule-operator"].some((selector) => flow.contains(document.querySelector(selector))),
  };
  q("#guided-requirement").value = "Must be one of these values";
  q("#guided-requirement").dispatchEvent(new Event("change", { bubbles:true }));
  Array.from(flow.querySelectorAll("button")).find((button) => button.textContent === "Add another value").click();
  q("#guided-allowed-value-2").value = "homepage";
  q("#guided-allowed-value-2").focus();
  q("#guided-allowed-value-2").dispatchEvent(new Event("input", { bubbles:true }));
  const values = {
    labels:Array.from(q("#guided-allowed-values").querySelectorAll("label")).map((label) => label.textContent),
    assistance:q("#guided-validation-status").textContent,
    focusRetained:document.activeElement === q("#guided-allowed-value-2"),
    statusRole:q("#guided-validation-status").getAttribute("role"),
    removeActions:Array.from(q("#guided-allowed-values").querySelectorAll("button")).filter((button) => button.textContent === "Remove value").length,
  };
  Array.from(flow.querySelectorAll("button")).find((button) => button.textContent === "Continue").click();
  const scope = {
    heading:q("#guided-validation-heading").textContent,
    selected:flow.querySelector('input[name="guided-scope"]:checked').parentElement.textContent.trim(),
    choices:Array.from(flow.querySelectorAll('input[name="guided-scope"]')).map((input) => input.parentElement.textContent.trim()),
    prefill:"Domain " + q("#guided-scope-domain").value + "; event " + q("#guided-scope-event").value + "; source " + q("#guided-scope-source").value + "; target " + q("#guided-scope-target").value + ".",
  };
  flow.querySelector('input[name="guided-scope"][value="selected-paths"]').click();
  const pathBuilder = {
    explanation:q("#guided-path-conditions p").textContent,
    conditionLabel:q('#guided-path-conditions [aria-label="Path condition 1"]').getAttribute("aria-label"),
    matchType:q("#guided-path-type-0").value,
    expression:q("#guided-path-expression-0").value,
    result:q('#guided-path-conditions [aria-label="Path condition 1"] output').textContent,
    remove:q('#guided-path-conditions [aria-label="Path condition 1"] button').textContent,
    testButton:Array.from(q("#guided-path-conditions").querySelectorAll("button")).find((button) => button.textContent === "Test another path").textContent,
  };
  q("#guided-path-type-0").value = "Path pattern";
  q("#guided-path-type-0").dispatchEvent(new Event("change", { bubbles:true }));
  q("#guided-path-expression-0").value = "/products/*";
  q("#guided-path-expression-0").dispatchEvent(new Event("change", { bubbles:true }));
  q("#guided-test-path").value = "/products/field-notebook";
  q("#guided-test-path").dispatchEvent(new Event("input", { bubbles:true }));
  Array.from(q("#guided-path-conditions").querySelectorAll("button")).find((button) => button.textContent === "Test another path").click();
  const anotherPath = q("#guided-test-path-result").textContent;
  q("#guided-path-type-0").value = "Regular expression";
  q("#guided-path-type-0").dispatchEvent(new Event("change", { bubbles:true }));
  q("#guided-path-expression-0").value = "[";
  q("#guided-path-expression-0").dispatchEvent(new Event("change", { bubbles:true }));
  Array.from(flow.querySelectorAll("button")).find((button) => button.textContent === "Add another path condition").click();
  q("#guided-path-type-1").value = "Regular expression";
  q("#guided-path-type-1").dispatchEvent(new Event("change", { bubbles:true }));
  q("#guided-path-expression-1").value = "(";
  q("#guided-path-expression-1").dispatchEvent(new Event("change", { bubbles:true }));
  Array.from(flow.querySelectorAll("button")).find((button) => button.textContent === "Continue").click();
  const multipleInvalid = {
    focused:document.activeElement === q("#guided-validation-errors"),
    links:Array.from(q("#guided-validation-errors").querySelectorAll("a")).map((link) => [link.textContent, link.getAttribute("href")]),
    inline:Array.from(flow.querySelectorAll("[data-inline-error]")).map((error) => error.textContent),
    described:Array.from(flow.querySelectorAll('[aria-invalid="true"]')).map((field) => field.getAttribute("aria-describedby")),
  };
  flow.querySelector('input[name="guided-scope"][value="domain-all-paths"]').click();
  Array.from(flow.querySelectorAll("button")).find((button) => button.textContent === "Continue").click();
  const reviewBeforeBack = q("#guided-validation-review").textContent;
  const reviewStages = Array.from(q("#guided-validation-stages").children).map((item) => [item.textContent, item.dataset.state]);
  clickButton(flow, "Back");
  const retainedScope = flow.querySelector('input[name="guided-scope"]:checked').value;
  clickButton(flow, "Back");
  clickButton(flow, "Back");
  const retainedDestination = { kind:flow.querySelector('input[name="guided-schema-destination"]:checked').value, name:q("#guided-new-schema-name").value };
  clickButton(flow, "Continue");
  clickButton(flow, "Continue");
  clickButton(flow, "Continue");
  q("#guided-advanced-settings summary").click();
  const advanced = {
    rule:q("#guided-ruleName").value,
    source:q("#guided-sourceId").value,
    target:q("#guided-target").value,
    defaults:q("#guided-advanced-settings").querySelector(":scope > p").textContent,
  };
  const beforeFailure = { schemas:localStorage.getItem("my-chrome-utilities.schema-library.v1"), rules:localStorage.getItem("my-chrome-utilities.schema-rule-library.v1") };
  const originalSetItem = Storage.prototype.setItem;
  let failNextSchemaWrite = true;
  Storage.prototype.setItem = function (key, value) { if (failNextSchemaWrite && key === "my-chrome-utilities.schema-library.v1") { failNextSchemaWrite = false; throw new Error("Fixture storage unavailable"); } return originalSetItem.call(this, key, value); };
  clickButton(flow, "Add validation to draft");
  await new Promise((resolve) => setTimeout(resolve, 0));
  Storage.prototype.setItem = originalSetItem;
  const saveFailure = {
    flowVisible:visible(flow),
    review:q("#guided-validation-review").textContent,
    error:q("#guided-validation-errors a").textContent,
    unchanged:beforeFailure.schemas === localStorage.getItem("my-chrome-utilities.schema-library.v1") && beforeFailure.rules === localStorage.getItem("my-chrome-utilities.schema-rule-library.v1"),
  };
  const publishLabel = q("#guided-publish-rule").parentElement.textContent.trim();
  q("#guided-publish-rule").checked = true;
  clickButton(flow, "Add validation to draft");
  await new Promise((resolve) => setTimeout(resolve, 0));
  const storedSchemas = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1") ?? "[]");
  const storedRules = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1") ?? "[]");
  const newSchemaDraft = storedSchemas.at(-1);
  const saved = {
    schemas:storedSchemas.length - before.schemas,
    reusableRules:storedRules.length - before.rules,
    published:newSchemaDraft.published,
    pendingChanges:newSchemaDraft.workingDraft.pendingChanges,
    localRules:newSchemaDraft.workingDraft.attachedRules.length,
    assignment:newSchemaDraft.workingDraft.assignments[0],
    flowClosed:!visible(flow),
    inspectorRestored:visible(q("#live-event-inspector")),
    status:q("#live-session-message").textContent,
    focusReturned:document.activeElement?.dataset.action === "add-property-validation",
    nextActions:Array.from(q("#guided-draft-continuation").querySelectorAll("button")).map(({ textContent }) => textContent),
  };
  const reusableRules = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1") ?? "[]");
  const unpublishedChoiceAbsent = !Array.from(q("#schema-assignment-schema").options).some(({ textContent }) => textContent.startsWith("Signal Shop pageview"));
  clickButton(q("#guided-draft-continuation"), "Publish revision");
  q("#confirm-schema-revision").click();
  const schemasAfterPublication = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1") ?? "[]");
  const rulesAfterPublication = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1") ?? "[]");
  const publishedSchema = schemasAfterPublication.find(({ name }) => name === "Signal Shop pageview");
  const published = {
    label:publishLabel,
    reusableRules:rulesAfterPublication.length - before.rules,
    attachedRuleId:publishedSchema.attachedRules[0].id,
    reusableRuleId:rulesAfterPublication.at(-1).id,
    unpublishedChoiceAbsent,
    assignableAfterPublication:Array.from(q("#schema-assignment-schema").options).some(({ textContent }) => textContent.startsWith("Signal Shop pageview version 1")),
    currentRevision:publishedSchema.version,
    historicalRevisions:publishedSchema.revisionHistory.length,
  };
  q("#data-layer-view-live").click();
  q("#live-event-feed button").click();
  clickButton(q("#live-event-inspector"), "Create validation from this event");
  flow.querySelector('input[name="guided-property"][value="page_type"]').click();
  clickButton(flow, "Continue");
  flow.querySelector('input[name="guided-schema-destination"][value="existing"]').click();
  const existingOptions = Array.from(q("#guided-schema-results").querySelectorAll(":scope > article")).map((row) => ({
    label:row.querySelector("h6").textContent,
    disabled:row.querySelector("button").disabled,
    explanation:row.querySelectorAll("p")[1].textContent.replace("Property compatibility: ", ""),
  }));
  clickButton(q("#guided-schema-picker"), "Select Product listing version 3");
  clickButton(flow, "Continue");
  q("#guided-requirement").value = "Must be one of these values";
  q("#guided-requirement").dispatchEvent(new Event("change", { bubbles:true }));
  clickButton(flow, "Add another value");
  q("#guided-allowed-value-2").value = "homepage";
  q("#guided-allowed-value-2").dispatchEvent(new Event("input", { bubbles:true }));
  clickButton(flow, "Continue");
  clickButton(flow, "Continue");
  const existingReview = q("#guided-validation-review").textContent;
  clickButton(flow, "Add validation to draft");
  await new Promise((resolve) => setTimeout(resolve, 0));
  const afterExistingSchemas = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1") ?? "[]");
  const productVersions = afterExistingSchemas.filter((schema) => schema.name === "Product listing");
  const existingSaved = {
    versions:productVersions.map(({ version }) => version),
    currentRules:productVersions[0].attachedRules?.length ?? 0,
    draftRules:productVersions[0].workingDraft?.attachedRules?.length ?? 0,
    pendingChanges:productVersions[0].workingDraft?.pendingChanges,
    assignments:productVersions[0].workingDraft?.assignments.length,
    flowClosed:!visible(flow),
    inspectorRestored:visible(q("#live-event-inspector")),
    status:q("#live-session-message").textContent,
    focusReturned:document.activeElement?.dataset.action === "add-property-validation",
  };
  clickButton(q("#guided-draft-continuation"), "Publish revision");
  q("#confirm-schema-revision").click();
  q("#data-layer-view-live").click();
  q("#live-event-feed button").click();
  clickButton(q("#live-event-inspector"), "Create validation from this event");
  flow.querySelector('input[name="guided-property"][value="page_type"]').click();
  clickButton(flow, "Continue");
  flow.querySelector('input[name="guided-schema-destination"][value="existing"]').click();
  clickButton(q("#guided-schema-picker"), "Select Generic pageview version 4");
  clickButton(flow, "Continue");
  const schemaPrefillRequirement = {
    expectedType:q("#guided-expected-type").value,
    expectedTypeSource:q("#guided-expected-type-hint").textContent,
    target:q("#guided-target").value,
  };
  q("#guided-requirement").value = "Must be present";
  q("#guided-requirement").dispatchEvent(new Event("change", { bubbles:true }));
  clickButton(flow, "Continue");
  const schemaPrefillScope = {
    domain:q("#guided-scope-domain").value,
    domainSource:q("#guided-scope-domain-hint").textContent,
    eventName:q("#guided-scope-event").value,
    eventNameSource:q("#guided-scope-event-hint").textContent,
    source:q("#guided-scope-source").value,
    sourceSource:q("#guided-scope-source-hint").textContent,
    pathCondition:q("#guided-path-expression-0").value,
  };
  q("#guided-scope-domain").value = "operator.example";
  q("#guided-scope-domain").dispatchEvent(new Event("change", { bubbles:true }));
  clickButton(flow, "Back");
  clickButton(flow, "Back");
  clickButton(flow, "Change existing schema");
  clickButton(q("#guided-schema-picker"), "Select Product listing version 4");
  const replacementReview = {
    items:Array.from(q("#guided-prefill-replacement-review").querySelectorAll("li")).map((item) => item.textContent),
    actions:Array.from(q("#guided-prefill-replacement-review").querySelectorAll("button")).map((button) => button.textContent),
  };
  clickButton(q("#guided-prefill-replacement-review"), "Keep current values");
  const keptStatus = q("#guided-validation-status").textContent;
  clickButton(flow, "Change existing schema");
  clickButton(q("#guided-schema-picker"), "Select Generic pageview version 4");
  clickButton(q("#guided-prefill-replacement-review"), "Accept schema-derived values");
  const acceptedStatus = q("#guided-validation-status").textContent;
  const core = await import("/data-layer-guided-validation.js");
  const productionDraft = core.selectGuidedProperty(core.createGuidedValidationDraft({ id:"event:pageview", name:"pageview", sourceId:"event-history", pageUrl:"http://127.0.0.1:4173/", payload:{ page_type:"product_list" } }), "page_type");
  const overridden = core.setExpectedType(core.setGuidedRequirement(productionDraft, "Must match a pattern"), "Number");
  const configuredDestinationDraft = { ...core.setAllowedValue(core.addAllowedValue(core.setGuidedRequirement(productionDraft, "Must be one of these values")), 1, "homepage"), stage:"destination" };
  const matchingDestinationReview = core.advanceGuidedValidation(core.advanceGuidedValidation(core.advanceGuidedValidation(core.setGuidedSchemaDestination(configuredDestinationDraft, { kind:"existing", schemaId:"schema:product-listing:3", schemaName:"Product listing", schemaVersion:3, matchingAssignment:true }))));
  const absentDestinationReview = core.advanceGuidedValidation(core.advanceGuidedValidation(core.advanceGuidedValidation(core.setGuidedSchemaDestination(configuredDestinationDraft, { kind:"existing", schemaId:"schema:product-listing:3", schemaName:"Product listing", schemaVersion:3, matchingAssignment:false }))));
  const productionDestinationOptions = core.schemaDestinationOptions(configuredDestinationDraft, [
    { id:"schema:generic-pageview:1", name:"Generic pageview", version:1, target:"payload", propertyTypes:{} },
    { id:"schema:product-listing:3", name:"Product listing", version:3, target:"payload", propertyTypes:{ page_type:"String" } },
    { id:"schema:numeric-page-types:1", name:"Numeric page types", version:1, target:"payload", propertyTypes:{ page_type:"Number" } },
    { id:"schema:raw-pageview:1", name:"Raw pageview", version:1, target:"raw input", propertyTypes:{} },
  ]).map(({ name, target, propertyTypes, available, explanation }) => ({ name, target, propertyState:propertyTypes.page_type ?? "absent", available, explanation }));
  const assignmentTemplate = { id:"assignment:one", name:"Shop pages", sourceId:"event-history", eventName:"pageview", target:"payload", domainCondition:"shop.example", pathConditions:[{ matchType:"Path pattern", expression:"/products/*" }], enabled:true };
  const assignmentResolutions = [0, 1, 2].map((count) => {
    const resolved = core.applyGuidedSchemaCandidate({ ...productionDraft, stage:"destination" }, {
      id:"schema:resolution:" + count,
      name:"Resolution schema",
      version:4,
      target:"payload",
      propertyTypes:{ page_type:"String" },
      assignments:Array.from({ length:count }, (_, index) => ({ ...assignmentTemplate, id:"assignment:" + index, name:"Shop pages " + (index + 1), domainCondition:index ? "other.example" : "shop.example" })),
    });
    return { count, selection:resolved.assignmentResolution.selection, domain:resolved.scope.domain, pathConditions:resolved.scope.conditions };
  });
  const production = {
    requirements:Object.fromEntries(["String", "Number", "Array", "Object", "Boolean"].map((type) => [type, core.compatibleRequirements(type)])),
    allowedValues:[[], ["homepage", "homepage"], ["product_list", ""], ["product_list", "homepage"]].map((values) => core.validateAllowedValues(values)),
    paths:[
      ["Exact path", "/products", "/products"],
      ["Exact path", "/products", "/products/field-notebook"],
      ["Path pattern", "/products/*", "/products/field-notebook"],
      ["Regular expression", "^/products/[a-z-]+$", "/products/field-notebook"],
      ["Regular expression", "^/products/[a-z-]+$", "/shop/products/field-notebook"],
      ["Exact path", "/products", "https://127.0.0.1/products?sort=price#details"],
      ["Exact path", "/products", "https://127.0.0.1/products/field-notebook?x=1"],
    ].map(([matchType, expression, pathname]) => core.pathConditionResult({ matchType, expression }, pathname)),
    combined:core.pathConditionsResult([{ matchType:"Exact path", expression:"/" }, { matchType:"Path pattern", expression:"/products/*" }], "/products/field-notebook"),
    malformed:core.pathConditionResult({ matchType:"Regular expression", expression:"[" }, "/"),
    override:{ typeSource:overridden.property.typeSource, currentEventPasses:overridden.preview.currentEventPasses, message:overridden.preview.message, correctionRequired:overridden.requirementCorrectionRequired },
    destinationOptions:productionDestinationOptions,
    assignmentResolutions,
    destinations:{
      matching:{ review:matchingDestinationReview.review, assignmentAction:core.publishGuidedValidation(matchingDestinationReview, false).destination.assignmentAction },
      absent:{ review:absentDestinationReview.review, assignmentAction:core.publishGuidedValidation(absentDestinationReview, false).destination.assignmentAction },
    },
  };
  localStorage.clear();
  for (const [key, value] of Object.entries(storedState)) localStorage.setItem(key, value);
  return { initial, invalid, requirement, values, scope, pathBuilder, anotherPath, multipleInvalid, destinationInitial, blankNameAssistance, duplicateNameAssistance, newNameAssistance, reviewBeforeBack, reviewStages, retainedDestination, retainedScope, advanced, saveFailure, saved, published, existingOptions, existingReview, existingSaved, schemaPrefillRequirement, schemaPrefillScope, replacementReview, keptStatus, acceptedStatus, production };
})()`;

const guidedSchemaPickerRuntime = `(async () => {
  const q = (selector) => { const value = document.querySelector(selector); if (!value) throw new Error("Missing " + selector); return value; };
  const clickButton = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find((candidate) => candidate.textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  globalThis.chrome = {
    tabs:{ query:async () => [{ id:23, windowId:4, url:"http://127.0.0.1:4173/", title:"Fixture", active:true }] },
    scripting:{ executeScript:async () => [{ result:{ queue:{ history:[{ event:"pageview", page_type:"product_list" }] } } }] },
  };
  q("#choose-observation-target").click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  q("#observation-target-list [data-target-id]").click();
  q("#start-data-layer-testing").click();
  await new Promise((resolve) => setTimeout(resolve, 25));
  q("#live-event-feed button").click();
  clickButton(q("#live-event-inspector"), "Create validation from this event");
  const flow = q("#guided-validation-flow");
  flow.querySelector('input[name="guided-property"][value="page_type"]').click();
  clickButton(flow, "Continue");
  const closed = {
    searchAbsent:!document.querySelector("#guided-schema-search"),
    resultsAbsent:!document.querySelector("#guided-schema-results"),
    scrollHeight:flow.scrollHeight,
  };
  q("#guided-existing-schema-picker").click();
  let dialog = q("#guided-schema-picker");
  const search = q("#guided-schema-search");
  const opened = {
    modal:dialog.matches(":modal"),
    searchFocused:document.activeElement === search,
    resultCount:q("#guided-schema-results").querySelectorAll(":scope > article").length,
    count:q("#guided-schema-result-count").textContent,
    listScrolls:q("#guided-schema-results").scrollHeight > q("#guided-schema-results").clientHeight,
    dialogBounded:dialog.getBoundingClientRect().width <= innerWidth && dialog.getBoundingClientRect().height <= innerHeight,
    flowUnexpanded:Math.abs(flow.scrollHeight - closed.scrollHeight) <= 2,
  };
  q("#guided-validation-heading").focus();
  opened.backgroundExcluded = dialog.contains(document.activeElement);
  const searchFor = (query) => {
    const field = q("#guided-schema-search"); field.value = query; field.dispatchEvent(new Event("input", { bubbles:true }));
    return {
      names:Array.from(q("#guided-schema-results").querySelectorAll("h6")).map((node) => node.textContent),
      targets:Array.from(q("#guided-schema-results").querySelectorAll(".guided-schema-result > p:first-of-type")).map((node) => node.textContent),
      count:q("#guided-schema-result-count").textContent,
    };
  };
  const searches = {
    name:searchFor("Product listing"),
    version:searchFor("version 4"),
    target:searchFor("payload"),
    property:searchFor("page_type"),
    domain:searchFor("shop.example"),
    path:searchFor("/products/*"),
  };
  const missing = searchFor("missing-schema");
  const empty = { message:q("#guided-schema-empty-result").textContent, selected:flow.querySelector('input[name="guided-schema-destination"]:checked')?.value ?? null };
  clickButton(q("#guided-schema-results"), "Clear search");
  empty.restoredCount = q("#guided-schema-result-count").textContent;
  const rows = Array.from(q("#guided-schema-results").querySelectorAll(":scope > article"));
  const productRow = rows.find((row) => row.querySelector("h6").textContent === "Product listing version 3");
  const rawRow = rows.find((row) => row.querySelector("h6").textContent === "Raw event version 2");
  const resultPresentation = {
    product:Array.from(productRow.querySelectorAll("h6,p")).map((node) => node.textContent),
    incompatible:Array.from(rawRow.querySelectorAll("h6,p")).map((node) => node.textContent),
    incompatibleDisabled:rawRow.querySelector("button").disabled,
  };
  productRow.querySelector("button").focus();
  productRow.querySelector("button").dispatchEvent(new KeyboardEvent("keydown", { key:"ArrowDown", bubbles:true }));
  resultPresentation.skippedIncompatible = document.activeElement !== rawRow.querySelector("button") && !document.activeElement.disabled;
  productRow.querySelector("button").focus();
  productRow.querySelector("button").dispatchEvent(new KeyboardEvent("keydown", { key:"Enter", bubbles:true }));
  const enterSelection = {
    dialogClosed:!document.querySelector("#guided-schema-picker"),
    summary:q("#guided-existing-schema-summary p").textContent,
    changeFocused:document.activeElement === q("#guided-change-existing-schema"),
    target:q("#guided-target").value,
  };
  clickButton(flow, "Continue");
  enterSelection.expectedTypeSource = q("#guided-expected-type-hint").textContent;
  clickButton(flow, "Back");
  clickButton(flow, "Change existing schema");
  dialog = q("#guided-schema-picker");
  const unchangedBefore = [q("#guided-existing-schema-summary p").textContent, q("#guided-target").value];
  dialog.dispatchEvent(new Event("cancel", { cancelable:true }));
  const escapeDismissal = {
    dialogClosed:!document.querySelector("#guided-schema-picker"),
    unchanged:JSON.stringify(unchangedBefore) === JSON.stringify([q("#guided-existing-schema-summary p").textContent, q("#guided-target").value]),
    restored:document.activeElement === q("#guided-change-existing-schema"),
  };
  clickButton(flow, "Change existing schema");
  clickButton(q("#guided-schema-picker"), "Close schema picker");
  const closeDismissal = { dialogClosed:!document.querySelector("#guided-schema-picker"), restored:document.activeElement === q("#guided-change-existing-schema") };
  clickButton(flow, "Change existing schema");
  clickButton(q("#guided-schema-picker"), "Select Product listing version 3");
  const buttonSelection = { summary:q("#guided-existing-schema-summary p").textContent, changeFocused:document.activeElement === q("#guided-change-existing-schema") };
  return { closed, opened, searches, missing, empty, resultPresentation, enterSelection, escapeDismissal, closeDismissal, buttonSelection };
})()`;

const schemaAssignmentRuntime = `(() => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const input = (selector, value) => { const element = q(selector); element.value = value; element.dispatchEvent(new Event("input", { bubbles:true })); };
  q("#data-layer-view-schemas").click();
  q("#schema-subview-schemas").click();
  const schemaMasterVisible = q("#schema-master").getClientRects().length > 0 && !q("#schema-master").hidden;
  input("#schema-search", "");
  for (;;) { const remove = Array.from(q("#schema-list").querySelectorAll("button")).find((button) => button.textContent === "Delete"); if (!remove) break; remove.click(); q("#confirm-schema-delete").click(); }
  q("#create-schema").click();
  input("#schema-editor-name", "Checkout schema");
  q("#add-schema-property").click();
  input("#schema-manual-property-path", "example");
  Array.from(q("#schema-manual-property-dialog").querySelectorAll("button")).find((button) => button.textContent === "Add property").click();
  q("#save-schema").click();
  q("#confirm-schema-revision").click();
  q("#schema-subview-rules").click();
  q("#create-schema-rule").click();
  input("#schema-rule-name", "Known page types");
  input("#schema-rule-types", "string");
  q("#schema-rule-operator").value = "allowed-values";
  input("#schema-rule-parameters", "product,checkout");
  q("#schema-rule-severity").value = "warning";
  input("#schema-rule-message", "Use a known page type");
  input("#schema-rule-examples", "product, checkout");
  q("#save-schema-rule").click();
  const initialRuleSeverity = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1")).at(-1).severity;
  q("#schema-subview-schemas").click();
  Array.from(q("#schema-list").querySelectorAll("button")).find((button) => button.textContent === "Edit working draft").click();
  q("#cancel-schema-revision").click();
  const propertyAdd = q('#schema-property-tree button[aria-label="Add rule for example"]');
  propertyAdd.click();
  const propertyMenuOpen = q("#schema-property-rule-picker").open;
  const attach = Array.from(q("#schema-property-rule-picker").querySelectorAll("button")).find((button) => button.textContent === "Known page types version 1");
  if (!attach) throw new Error("Missing property rule attachment action");
  attach.click();
  const propertyReturnFocus = document.activeElement?.getAttribute("aria-label") === "Add rule for example";
  const attachedSummary = Array.from(q("#schema-property-tree").querySelectorAll("summary")).find((summary) => summary.textContent === "View attached rules (1)");
  if (!attachedSummary) throw new Error("Missing attached-rules disclosure");
  attachedSummary.click();
  const attachedRules = q("#schema-property-tree details[data-attached-rules]");
  const propertyRuleActions = Array.from(attachedRules.querySelectorAll("button")).map((button) => button.textContent);
  attachedRules.querySelector("button").click();
  const propertyStateReturnFocus = document.activeElement?.dataset.schemaPropertyPath === "example";
  Array.from(q("#schema-property-tree").querySelectorAll("summary")).find((summary) => summary.textContent === "View attached rules (1)").click();
  const reenable = q("#schema-property-tree details[data-attached-rules] button").textContent;
  q("#schema-property-tree details[data-attached-rules] button").click();
  q("#schema-subview-rules").click();
  Array.from(q("#schema-rule-list").querySelectorAll("button")).filter((button) => button.textContent === "Edit").at(-1).click();
  input("#schema-rule-parameters", "product,checkout,confirmation");
  q("#schema-rule-severity").value = "error";
  q("#save-schema-rule").click();
  const ruleRevisionReview = { open:q("#schema-rule-revision-review").open, summary:q("#schema-rule-revision-review-summary").textContent };
  q("#confirm-schema-rule-revision-review").click();
  const originalRuleExportClick = HTMLAnchorElement.prototype.click;
  let ruleExportName = "";
  HTMLAnchorElement.prototype.click = function () { ruleExportName = this.download; };
  Array.from(q("#schema-rule-list").querySelectorAll("button")).find((button) => button.textContent === "Export").click();
  HTMLAnchorElement.prototype.click = originalRuleExportClick;
  q("#schema-subview-schemas").click();
  q("#save-schema").click();
  q("#confirm-schema-revision").click();
  q("#schema-subview-assignments").click();
  q("#create-schema-assignment").click();
  input("#schema-assignment-source", "event-history");
  input("#schema-assignment-event", "page_view");
  q("#schema-assignment-target").value = "raw input";
  input("#schema-assignment-domain", "shop.example");
  input("#schema-assignment-pathname", "/order-confirmation");
  input("#schema-assignment-priority", "100");
  q("#schema-assignment-version-policy").value = "follow latest";
  q("#schema-assignment-enabled").checked = true;
  q("#save-schema-assignment").click();
  const firstRow = () => q("#schema-assignment-list li");
  const action = (label) => { const button = Array.from(firstRow().querySelectorAll("button")).find((candidate) => candidate.textContent === label); if (!button) throw new Error("Missing " + label + "; found " + Array.from(firstRow().querySelectorAll("button")).map((candidate) => candidate.textContent).join(", ")); return button; };
  const actions = Array.from(firstRow().querySelectorAll("button")).map((button) => button.textContent);
  action("Edit").click();
  input("#schema-assignment-priority", "120");
  q("#save-schema-assignment").click();
  action("Duplicate").click();
  action("Disable").click();
  const duplicateCount = document.querySelectorAll("#schema-assignment-list li").length;
  const copyRow = Array.from(document.querySelectorAll("#schema-assignment-list li")).find((row) => row.querySelector("span")?.textContent.startsWith("Checkout schema automatic copy"));
  const deleteCopy = copyRow && Array.from(copyRow.querySelectorAll("button")).find((button) => button.textContent === "Delete");
  if (!deleteCopy) throw new Error("Missing duplicate assignment delete action");
  deleteCopy.click();
  q("#schema-subview-schemas").click();
  Array.from(q("#schema-list").querySelectorAll("button")).find((button) => button.textContent === "Edit working draft").click();
  const revisionReview = { open:q("#schema-revision-review").open, summary:q("#schema-revision-review-summary").textContent, status:q("#schema-editor-status").textContent };
  q("#cancel-schema-revision").click();
  q("#create-schema").click();
  input("#schema-editor-name", "Unsaved schema");
  q("#close-schema-editor").click();
  const closeReview = { open:q("#close-schema-editor-review").open, summary:q("#schema-close-review-summary").textContent, result:q("#schema-result").textContent };
  q("#discard-schema-draft").click();
  const persistedSchemas = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"));
  const persistedRules = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1"));
  const latestRule = persistedRules.at(-1);
  const storedPropertyRule = persistedSchemas[0].attachedRules?.find((rule) => rule.propertyPath === "example");
  return {
    fields:["#schema-assignment-source", "#schema-assignment-event", "#schema-assignment-target", "#schema-assignment-domain", "#schema-assignment-pathname", "#schema-assignment-priority", "#schema-assignment-schema", "#schema-assignment-version-policy", "#schema-assignment-enabled"].map((selector) => ({ selector, required:q(selector).required })),
    schemaMasterVisible,
    actions,
    duplicateCount,
    revisionReview,
    closeReview,
    rows:Array.from(document.querySelectorAll("#schema-assignment-list li > span")).map((row) => row.textContent),
    assignment:{ ...persistedSchemas[0].assignments[0], pathnameCondition:persistedSchemas[0].assignments[0].pathnameCondition ?? null },
    propertyRule:{ menuOpen:propertyMenuOpen, returnFocus:propertyReturnFocus, stateReturnFocus:propertyStateReturnFocus, summary:attachedSummary.textContent, actions:propertyRuleActions, reenable, revisionReview:ruleRevisionReview, ruleExportName },
    storedPropertyRule:{ attached:Boolean(storedPropertyRule), version:storedPropertyRule?.version, enabled:storedPropertyRule?.enabled, propertyPath:storedPropertyRule?.propertyPath },
    rule:{ initialSeverity:initialRuleSeverity, name:latestRule.name, version:latestRule.version, enabled:latestRule.enabled, operator:latestRule.operator, parameters:latestRule.parameters, severity:latestRule.severity, message:latestRule.message, examples:latestRule.examples, attachments:latestRule.attachments },
  };
})()`;

const schemaRevisionLifecycleRuntime = `(async () => {
  const lifecycle = await import("/data-layer-schema-verification.js");
  const base = {
    ...lifecycle.createSchema("Product listing", 3, { type:"object", properties:{ product_id:{ type:"string" } } }),
    id:"schema-product-listing",
    assignments:[{ id:"assignment:product", name:"Product pages", schemaId:"schema-product-listing", schemaVersion:3, sourceId:"history", eventName:"pageview", target:"payload", versionPolicy:"pinned", enabled:true }],
  };
  const pageType = lifecycle.updateSchemaWorkingDraft(base, { document:{ type:"object", properties:{ product_id:{ type:"string" }, page_type:{ type:"string" } } } }, "Add page_type rule");
  const pageName = lifecycle.updateSchemaWorkingDraft(pageType, { document:{ type:"object", properties:{ product_id:{ type:"string" }, page_type:{ type:"string" }, page_name:{ type:"string" } } } }, "Add page_name rule");
  const pendingAssignment = { id:"assignment:checkout", schemaId:base.id, sourceId:"history", eventName:"checkout", target:"payload", versionPolicy:"follow latest", enabled:true };
  const ready = lifecycle.updateSchemaWorkingDraft(pageName, { assignments:[...pageName.workingDraft.assignments, pendingAssignment] }, "Add Checkout assignment");
  const storageKey = "schema-revision-lifecycle-browser-fixture";
  const previous = localStorage.getItem(storageKey);
  localStorage.setItem(storageKey, lifecycle.serializeSchemaLibrary([ready]));
  const reloaded = lifecycle.restoreSchemaLibrary(localStorage.getItem(storageKey))[0];
  const pendingResolution = lifecycle.resolveSchemaAssignment({ sourceId:"history", eventName:"checkout" }, "https://shop.example/checkout", [reloaded]);
  const published = lifecycle.publishSchemaWorkingDraft(reloaded);
  const pinned = lifecycle.resolveSchemaAssignment({ sourceId:"history", eventName:"pageview" }, "https://shop.example/products", [published]);
  const latest = lifecycle.resolveSchemaAssignment({ sourceId:"history", eventName:"pageview" }, "https://shop.example/products", [{ ...published, assignments:[{ ...published.assignments[0], versionPolicy:"follow latest" }] }]);
  const restored = lifecycle.restoreSchemaRevisionDraft(published, 3);
  const duplicate = lifecycle.duplicateSchemaRevision(published, 3);
  const legacy = [1, 2, 3, 4].map((version) => ({
    ...lifecycle.createSchema("Product listing", version, { type:"object", properties:{ ["revision_" + version]:{ type:"string" } } }),
    assignments:version === 3 ? [{ id:"legacy-pinned", schemaId:"schema:product-listing:" + version, sourceId:"history", eventName:"pageview", target:"payload", versionPolicy:"pinned", enabled:true }] : version === 4 ? [{ id:"legacy-latest", schemaId:"schema:product-listing:" + version, sourceId:"history", eventName:"purchase", target:"payload", versionPolicy:"follow latest", enabled:true }] : [],
  }));
  const migrated = lifecycle.migrateSchemaLibrary(legacy);
  if (previous === null) localStorage.removeItem(storageKey); else localStorage.setItem(storageKey, previous);
  return {
    workingDraft:{ identity:reloaded.id, current:reloaded.version, base:reloaded.workingDraft.baseVersion, source:reloaded.workingDraft.sourceVersion, twoPending:pageName.workingDraft.pendingChanges, pending:reloaded.workingDraft.pendingChanges, properties:Object.keys(reloaded.workingDraft.document.properties), durable:true, currentProperties:Object.keys(reloaded.document.properties), activeCheckout:Boolean(pendingResolution.schema), sameIdentity:pageType.id === pageName.id },
    publication:{ identity:published.id, current:published.version, history:lifecycle.schemaRevisionChoices(published), draftCleared:!published.workingDraft, properties:Object.keys(published.document.properties), checkoutRevision:lifecycle.resolveSchemaAssignment({ sourceId:"history", eventName:"checkout" }, "https://shop.example/checkout", [published]).schema.version, choices:lifecycle.assignableSchemas([published]).map(({ name }) => name) },
    policies:{ pinned:pinned.schema.version, latest:latest.schema.version, recorded:[pinned.schema.version, latest.schema.version] },
    history:{ choices:lifecycle.schemaRevisionChoices(published), selected:lifecycle.schemaRevision(published, 3).version, duplicate:{ name:duplicate.name, published:duplicate.published, assignable:lifecycle.assignableSchemas([duplicate]).length }, restored:{ current:restored.version, source:restored.workingDraft.sourceVersion, pending:restored.workingDraft.pendingChanges, discardCurrent:lifecycle.discardSchemaWorkingDraft(restored).version } },
    migration:{ count:migrated.length, identity:migrated[0].id, current:migrated[0].version, history:lifecycle.schemaRevisionChoices(migrated[0]), assignments:migrated[0].assignments.map(({ schemaId, schemaVersion, versionPolicy }) => ({ schemaId, schemaVersion:schemaVersion ?? null, versionPolicy })) },
  };
})()`;

const openPageviewInspector = `
  globalThis.chrome = {
    tabs:{ query:async () => [{ id:23, windowId:4, url:"http://127.0.0.1:4173/", title:"Fixture", active:true }] },
    scripting:{ executeScript:async () => [{ result:{ queue:{ history:[{ event:"pageview", page_type:"product_list", page_name:"Products" }] } } }] },
  };
  await new Promise((resolve) => setTimeout(resolve, 50));
  if (!document.querySelector("#live-event-feed button")) {
    const end = document.querySelector("#end-data-layer-testing");
    if (end && !end.hidden) { end.click(); await new Promise((resolve) => setTimeout(resolve, 25)); }
    const start = document.querySelector("#start-data-layer-testing");
    if (start.disabled) {
      document.querySelector("#choose-observation-target").click();
      for (let attempt = 0; attempt < 30 && !document.querySelector("#observation-target-list [data-target-id]"); attempt += 1) await new Promise((resolve) => setTimeout(resolve, 10));
      const target = document.querySelector("#observation-target-list [data-target-id]");
      if (!target) throw new Error("observation target was not discovered for continuation runtime");
      target.click();
    }
    start.click();
  }
  for (let attempt = 0; attempt < 20 && !document.querySelector("#live-event-feed button"); attempt += 1) await new Promise((resolve) => setTimeout(resolve, 10));
  const eventButton = document.querySelector("#live-event-feed button");
  if (!eventButton) throw new Error("pageview was not captured for continuation runtime");
  eventButton.click();`;

const guidedDraftContinuationInitialRuntime = `(async () => {
  const ui = await import("/data-layer-live-observer-ui.js");
  const actionCore = await import("/data-layer-live-inspector-actions.js");
  const event = { id:"event:pageview", name:"pageview", sourceId:"event-history", captureTime:"2026-07-13T21:00:00Z", pageUrl:"http://127.0.0.1:4173/", payload:{ page_name:"Products" }, rawInput:[], validation:"Not checked", provenance:"Captured" };
  const actions = actionCore.createLiveInspectorActions({ currentPageUrl:()=>event.pageUrl, writeClipboard:async()=>{}, storeTemplate:()=>{}, createValidation:()=>{}, validationState:()=>"Valid", updateValidation:()=>{}, manualSchemaChoices:()=>[], selectManualSchema:()=>{} });
  const elements = ui.findLiveObserverElements();
  ui.renderLiveInspector(elements, event, actions);
  const inspector = elements.eventInspector;
  return {
    createAvailable:Array.from(inspector.querySelectorAll("button")).some(({ textContent }) => textContent === "Create validation from this event"),
    continuationAbsent:!inspector.querySelector("#guided-draft-continuation"),
  };
})()`;

const guidedDraftContinuationRuntime = `(async () => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const click = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  const storedSchema = (id) => JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1") ?? "[]").find((schema) => schema.id === id);
  const reopen = () => { q("#data-layer-view-live").click(); q("#live-event-feed button").click(); };
  ${openPageviewInspector}
  const inspector = q("#live-event-inspector");
  const section = q("#guided-draft-continuation");
  const initial = {
    heading:section.querySelector("h5").textContent,
    status:section.querySelector("p").textContent,
    actions:Array.from(section.querySelectorAll("button")).map(({ textContent }) => textContent),
    sectionCount:inspector.querySelectorAll("#guided-draft-continuation").length,
    genericAbsent:!Array.from(inspector.querySelectorAll("button")).some(({ textContent }) => textContent === "Create validation from this event"),
  };
  const beforeProduct = structuredClone(storedSchema("schema-product-listing"));
  const beforeCheckout = structuredClone(storedSchema("schema-checkout"));
  click(section, "Add property from this event");
  const flow = q("#guided-validation-flow");
  const opened = {
    context:q("#guided-continuation-context").textContent,
    stages:Array.from(q("#guided-validation-stages").children).map(({ textContent }) => textContent),
  };
  flow.querySelector('input[name="guided-property"][value="page_name"]').click();
  click(flow, "Continue");
  const requirement = {
    heading:q("#guided-validation-heading").textContent,
    destinationAbsent:!flow.querySelector("#guided-schema-destination") && !flow.querySelector("#guided-schema-picker"),
    selectedSchema:JSON.parse(localStorage.getItem("my-chrome-utilities.guided-validation-continuations.v1"))["event-history\\u0000pageview"],
  };
  q("#guided-requirement").value = "Must be present";
  q("#guided-requirement").dispatchEvent(new Event("change", { bubbles:true }));
  click(flow, "Continue");
  const prefill = {
    target:q("#guided-scope-target").value,
    targetSource:q("#guided-scope-target-hint").textContent,
    source:q("#guided-scope-source").value,
    sourceSource:q("#guided-scope-source-hint").textContent,
    domain:q("#guided-scope-domain").value,
    domainSource:q("#guided-scope-domain-hint").textContent,
    eventName:q("#guided-scope-event").value,
    eventSource:q("#guided-scope-event-hint").textContent,
    path:q("#guided-path-expression-0").value,
    pathSource:q("#guided-path-expression-0-hint").textContent,
    editable:["#guided-scope-target", "#guided-scope-source", "#guided-scope-domain", "#guided-scope-event", "#guided-path-expression-0"].every((selector) => !q(selector).disabled),
  };
  click(flow, "Cancel");
  const productSection = q("#guided-draft-continuation");
  click(productSection, "Review draft");
  const review = { name:q("#schema-editor-name").value, status:q("#schema-editor-status").textContent, checkoutUnchanged:JSON.stringify(storedSchema("schema-checkout")) === JSON.stringify(beforeCheckout) };
  reopen();
  click(q("#guided-draft-continuation"), "Publish revision");
  const publication = { review:q("#schema-revision-review-summary").textContent, productCurrent:storedSchema("schema-product-listing").version, checkoutUnchanged:JSON.stringify(storedSchema("schema-checkout")) === JSON.stringify(beforeCheckout) };
  q("#cancel-schema-revision").click();
  reopen();
  click(q("#guided-draft-continuation"), "Use a different schema");
  const switcher = q("#guided-continuation-schema-picker");
  const switchOpen = { heading:switcher.querySelector("h5").textContent, choices:Array.from(switcher.querySelectorAll(":scope > div > button")).map(({ textContent }) => textContent), productUnchanged:JSON.stringify(storedSchema("schema-product-listing")) === JSON.stringify(beforeProduct) };
  click(switcher, "Cancel");
  const afterCancel = { context:q("#guided-draft-continuation h5").textContent, productUnchanged:JSON.stringify(storedSchema("schema-product-listing")) === JSON.stringify(beforeProduct) };
  click(q("#guided-draft-continuation"), "Use a different schema");
  click(q("#guided-continuation-schema-picker"), "Checkout revision 2 · 1 pending changes");
  const afterSwitch = {
    context:q("#guided-draft-continuation h5").textContent,
    sectionCount:inspector.querySelectorAll("#guided-draft-continuation").length,
    unnamedAbsent:!inspector.textContent.includes("Unnamed draft"),
    productUnchanged:JSON.stringify(storedSchema("schema-product-listing")) === JSON.stringify(beforeProduct),
  };
  const core = await import("/data-layer-guided-validation.js");
  const event = { id:"event:pageview", name:"pageview", sourceId:"event-history", pageUrl:"http://127.0.0.1:4173/", payload:{ page_name:"Products" } };
  const candidate = (assignments) => ({ id:"schema-product-listing", name:"Product listing", version:3, target:"payload", propertyTypes:{ page_name:"String" }, assignments });
  const resolution = (assignments) => {
    const schema = candidate(assignments); const draft = core.createGuidedContinuationDraft(event, schema);
    return core.selectGuidedContinuationProperty(draft, "page_name", schema).assignmentResolution.selection;
  };
  const assignmentResolution = {
    none:resolution([]),
    multiple:resolution([
      { id:"assignment:a", name:"Product pages", sourceId:"event-history", eventName:"pageview", target:"payload", enabled:true },
      { id:"assignment:b", name:"Alternate pages", sourceId:"event-history", eventName:"pageview", target:"payload", enabled:true },
    ]),
  };
  return { initial, opened, requirement, prefill, review, publication, switchOpen, afterCancel, afterSwitch, assignmentResolution };
})()`;

const guidedDraftContinuationReloadRuntime = `(async () => {
  ${openPageviewInspector}
  const section = document.querySelector("#guided-draft-continuation");
  const add = Array.from(section.querySelectorAll("button")).find(({ textContent }) => textContent === "Add property from this event");
  add.click();
  document.querySelector('input[name="guided-property"][value="page_name"]').click();
  Array.from(document.querySelector("#guided-validation-flow").querySelectorAll("button")).find(({ textContent }) => textContent === "Continue").click();
  return {
    context:section.querySelector("h5").textContent,
    heading:document.querySelector("#guided-validation-heading").textContent,
    destinationAbsent:!document.querySelector("#guided-schema-destination") && !document.querySelector("#guided-schema-picker"),
    expectedTypeSource:document.querySelector("#guided-expected-type-hint").textContent,
  };
})()`;

const schemaPropertyRulePickerRuntime = `(async () => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const click = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  q("#data-layer-view-schemas").click();
  click(q("#schema-list"), "Edit working draft");
  const trigger = q('#schema-property-tree button[aria-label="Add rule for page_type"]');
  const editorBefore = q("#schema-editor").getBoundingClientRect();
  const closed = { label:trigger.textContent, pickerAbsent:!q("#schema-property-rule-picker").open, inlineResults:!q("#schema-property-tree").querySelector("#schema-property-rule-results"), expandedMenu:!q("#schema-property-tree").querySelector("details[data-rule-menu]") };
  trigger.click();
  const dialog = q("#schema-property-rule-picker");
  const results = () => q("#schema-property-rule-results");
  const opened = { heading:q("#schema-property-rule-picker-heading").textContent, searchFocused:document.activeElement === q("#schema-property-rule-search"), bounded:dialog.getBoundingClientRect().height <= innerHeight - 8, scrolls:results().scrollHeight >= results().clientHeight, modal:dialog.matches(":modal"), backgroundExcluded:q("#schema-editor").matches(":modal") === false };
  const input = (value) => { const search = q("#schema-property-rule-search"); search.value = value; search.dispatchEvent(new Event("input", { bubbles:true })); return Array.from(document.querySelector('[aria-label="Attach from Rule Library"]')?.querySelectorAll("button") ?? []).map(({ textContent }) => textContent); };
  const searches = Object.fromEntries([["Approved pages","rule name"],["allowed values","operator"],["checkout","parameters"],["public pages","description"],["string","applicable type"],["version 2","version"]].map(([query, metadata]) => [metadata, input(query)]));
  input("");
  const groups = Array.from(results().querySelectorAll(":scope > section > h5")).map(({ textContent }) => textContent);
  const metadata = Array.from(results().querySelectorAll("article p")).map(({ textContent }) => textContent);
  click(results(), "Regular expression");
  const builtInConfiguration = q("#schema-local-rule-configuration").textContent;
  click(dialog, "Cancel");
  trigger.click();
  click(q("#schema-property-rule-picker"), "Approved pages version 2");
  const stored = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"))[0];
  const attached = { pickerClosed:!q("#schema-property-rule-picker").open, focusReturned:document.activeElement?.getAttribute("aria-label") === "Add rule for page_type", activeCount:q('#schema-property-tree [data-schema-property-path="page_type"] span:not(.schema-property-metadata)').textContent, draftRules:stored.workingDraft.attachedRules.filter(({ id, propertyPath }) => id === "rule:approved" && propertyPath === "page_type").length, currentRules:(stored.attachedRules ?? []).length, currentVersion:stored.version };
  const triggerAfter = q('#schema-property-tree button[aria-label="Add rule for page_type"]'); triggerAfter.click();
  const already = Array.from(q("#schema-property-rule-picker").querySelectorAll("button")).find(({ textContent }) => textContent.includes("Approved pages version 2"));
  const beforeEmpty = localStorage.getItem("my-chrome-utilities.schema-library.v1");
  input("missing-rule");
  const empty = { message:q("#schema-property-rule-empty").textContent, clearAvailable:Array.from(dialog.querySelectorAll("button")).some(({ textContent }) => textContent === "Clear search") };
  click(dialog, "Clear search");
  empty.restored = results().querySelectorAll("article").length > 1; empty.unchanged = beforeEmpty === localStorage.getItem("my-chrome-utilities.schema-library.v1");
  const first = results().querySelector("button:not(:disabled)"); q("#schema-property-rule-search").focus(); q("#schema-property-rule-search").dispatchEvent(new KeyboardEvent("keydown", { key:"ArrowDown", bubbles:true })); document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key:"Enter", bubbles:true }));
  const keyboard = { selected:first?.textContent, configured:Boolean(q("#schema-local-rule-configuration")) };
  dialog.dispatchEvent(new Event("cancel", { cancelable:true }));
  const editorAfter = q("#schema-editor").getBoundingClientRect(); keyboard.escapeClosed = !dialog.open; keyboard.layoutUnchanged = editorBefore.width === editorAfter.width && editorBefore.left === editorAfter.left;
  const model = await import("/data-layer-schema-property-rule-picker.js");
  const availability = Object.fromEntries([["string","Required"],["string","Exact value"],["string","Regular expression"],["string","Text length"],["string","Digits only"],["number","Numeric range"],["array","Item count"],["number","Regular expression"],["object","Allowed values"]].map(([type, rule]) => [type + ":" + rule, model.ruleTypeAvailability(type, rule)]));
  return { closed, opened, availability, searches, groups, metadata, builtInConfiguration, attached, already:{ disabled:already?.disabled, label:already?.textContent }, empty, keyboard };
})()`;

const schemaManualPropertyRuntime = `(async () => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const click = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  const input = (selector, value, eventName = "input") => { const element = q(selector); element.value = value; element.dispatchEvent(new Event(eventName, { bubbles:true })); };
  q("#data-layer-view-schemas").click();
  const pageViewRow = Array.from(q("#schema-list").children).find(({ textContent }) => textContent.includes("Page view"));
  click(pageViewRow, "Edit working draft");
  const addProperty = q("#add-schema-property");
  const tree = q("#schema-property-tree");
  const initial = {
    addProperty:addProperty.textContent,
    aboveTree:Boolean(addProperty.compareDocumentPosition(tree) & Node.DOCUMENT_POSITION_FOLLOWING),
    noGlobalValidationRule:!Array.from(q("#schema-editor").querySelectorAll("button")).some(({ textContent }) => textContent === "Add validation rule"),
    rowRule:Array.from(tree.querySelectorAll("button")).some(({ textContent }) => textContent === "Add rule"),
  };
  addProperty.click();
  const dialog = q("#schema-manual-property-dialog");
  const opened = {
    open:dialog.open,
    pathFocused:document.activeElement === q("#schema-manual-property-path"),
    types:Array.from(q("#schema-manual-property-type").options).map(({ value }) => value),
    arrayTypeHidden:q("#schema-manual-array-item-type").parentElement.hidden,
    actions:Array.from(dialog.querySelectorAll("button")).map(({ textContent }) => textContent),
  };
  const setForm = (path, type = "string", itemType = "") => {
    input("#schema-manual-property-path", path);
    input("#schema-manual-property-type", type, "change");
    if (type === "array") input("#schema-manual-array-item-type", itemType, "change");
    return { preview:q("#schema-manual-property-preview").textContent, assistance:q("#schema-manual-property-assistance").textContent, blocked:q('#schema-manual-property-dialog button[type="submit"]').disabled };
  };
  const pathPreviews = { page_category:setForm("page_category"), "commerce.order.id":setForm("commerce.order.id") };
  const manualModel = await import("/data-layer-schema-manual-property.js");
  const baseDocument = { type:"object", properties:{ page_type:{ type:"string" } } };
  const inheritedDocument = { type:"object", properties:{ page_name:{ type:"string" } } };
  const validationDefinitions = [
    ["empty path", baseDocument, { path:"", type:"string" }],
    ["commerce..id as string", baseDocument, { path:"commerce..id", type:"string" }],
    ["existing page_type as string", baseDocument, { path:"page_type", type:"string" }],
    ["commerce.order under string commerce", { type:"object", properties:{ commerce:{ type:"string" } } }, { path:"commerce.order", type:"string" }],
    ["inherited page_name as string", baseDocument, { path:"page_name", type:"string" }],
    ["items as array without item type", baseDocument, { path:"items", type:"array" }],
  ];
  const validation = Object.fromEntries(validationDefinitions.map(([name, document, definition]) => {
    const inspected = manualModel.inspectManualProperty(document, [inheritedDocument], definition);
    return [name, { result:inspected.result === "ready" ? "added" : "blocked", assistance:inspected.assistance ?? "Ready to add" }];
  }));
  const arrayItems = {};
  for (const itemType of ["string", "number", "boolean", "object"]) {
    const state = setForm("items", "array", itemType); arrayItems[itemType] = { preview:state.preview, canAdd:!state.blocked };
  }
  click(dialog, "Cancel");
  addProperty.click(); setForm("page_type");
  const beforeDuplicate = localStorage.getItem("my-chrome-utilities.schema-library.v1");
  click(dialog, "Go to existing property page_type");
  const pageTypeRow = q('#schema-property-tree [data-schema-property-path="page_type"]');
  const duplicate = { closed:!dialog.open, unchanged:beforeDuplicate === localStorage.getItem("my-chrome-utilities.schema-library.v1"), selected:pageTypeRow.getAttribute("aria-current") === "true", visible:pageTypeRow.getClientRects().length > 0, focused:document.activeElement?.getAttribute("aria-label") === "Add rule for page_type" };
  addProperty.click(); setForm("unsaved_property");
  const beforeCancel = localStorage.getItem("my-chrome-utilities.schema-library.v1"); click(dialog, "Cancel");
  const cancelled = { closed:!dialog.open, unchanged:beforeCancel === localStorage.getItem("my-chrome-utilities.schema-library.v1"), focusReturned:document.activeElement === addProperty };
  addProperty.click(); setForm("commerce.order.id", "string"); click(dialog, "Add property");
  const stored = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"));
  const pageView = stored.find(({ name }) => name === "Page view");
  const manualRow = q('#schema-property-tree [data-schema-property-path="commerce.order.id"]');
  const currentHasCommerce = Boolean(pageView.document.properties?.commerce);
  const workingLeaf = pageView.workingDraft.document.properties.commerce.properties.order.properties.id;
  const added = {
    closed:!dialog.open,
    missingObjects:[pageView.workingDraft.document.properties.commerce.type, pageView.workingDraft.document.properties.commerce.properties.order.type],
    leaf:workingLeaf,
    selected:manualRow.getAttribute("aria-current") === "true",
    metadata:manualRow.querySelector(".schema-property-metadata").textContent,
    activeCount:manualRow.querySelector("span:not(.schema-property-metadata)").textContent,
    addRule:Boolean(manualRow.querySelector('button[aria-label="Add rule for commerce.order.id"]')),
    currentVersion:pageView.version,
    currentUnchanged:!currentHasCommerce,
  };
  const schemaModel = await import("/data-layer-schema-verification.js");
  const draftSchema = { ...pageView, document:pageView.workingDraft.document, attachedRules:pageView.workingDraft.attachedRules ?? [] };
  const preview = schemaModel.validateWithSchema({ sourceId:"manual", eventName:"page_view", payload:{ page_type:"home", commerce:{ order:{ id:42 } } }, rawInput:[] }, draftSchema, [stored.find(({ name }) => name === "Base schema"), draftSchema]);
  const model = { pathType:workingLeaf.type, attachedRules:(pageView.workingDraft.attachedRules ?? []).length, issueCount:preview.issues.length, expected:preview.issues[0]?.expected, issuePath:preview.issues[0]?.instancePath };
  return { initial, opened, pathPreviews, validation, arrayItems, duplicate, cancelled, added, model };
})()`;

const schemaManualPropertyReloadRuntime = `(() => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  q("#data-layer-view-schemas").click();
  const pageViewRow = Array.from(q("#schema-list").children).find(({ textContent }) => textContent.includes("Page view"));
  Array.from(pageViewRow.querySelectorAll("button")).find(({ textContent }) => textContent === "Edit working draft").click();
  const stored = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")).find(({ name }) => name === "Page view");
  const row = q('#schema-property-tree [data-schema-property-path="commerce.order.id"]');
  return { present:true, metadata:row.querySelector(".schema-property-metadata").textContent, activeCount:row.querySelector("span:not(.schema-property-metadata)").textContent, currentVersion:stored.version, currentUnchanged:!stored.document.properties?.commerce };
})()`;

const schemaNestedPathRuntime = `(async () => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const click = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  q("#data-layer-view-schemas").click();
  const row = Array.from(q("#schema-list").children).find(({ textContent }) => textContent.includes("Product detail")); click(row, "Edit working draft");
  const tree = q("#schema-property-tree");
  const paths = Array.from(tree.children).map(({ dataset }) => dataset.schemaPropertyPath);
  const products = q('#schema-property-tree [data-schema-property-path="products"]');
  const everyItem = q('#schema-property-tree [data-schema-property-path="products.*"]');
  const advanced = { paths, arrayActions:Array.from(products.querySelectorAll("button")).map(({ textContent }) => textContent), everyItem:everyItem.querySelector(".schema-property-metadata").textContent };
  click(q('#schema-property-tree [data-schema-property-path="fruits"]'), "Add specific index rule");
  const indexDialog = q("#schema-specific-index-dialog"); const indexInput = q("#schema-specific-index");
  indexInput.value = "-1"; indexInput.dispatchEvent(new Event("input", { bubbles:true }));
  const invalidIndex = { min:indexInput.min, blocked:indexDialog.querySelector('button[type="submit"]').disabled, assistance:indexDialog.querySelector("output").textContent };
  indexInput.value = "1"; indexInput.dispatchEvent(new Event("input", { bubbles:true }));
  const validIndex = { assistance:indexDialog.querySelector("output").textContent, canContinue:!indexDialog.querySelector('button[type="submit"]').disabled };
  click(indexDialog, "Choose rule");
  const stringPicker = q("#schema-property-rule-picker");
  const exactIndex = { heading:q("#schema-property-rule-picker-heading").textContent, choices:Array.from(stringPicker.querySelectorAll('[aria-label="Create a rule"] button')).map(({ textContent }) => textContent) };
  click(stringPicker, "Cancel");
  click(q('#schema-property-tree [data-schema-property-path="products.*.id"]'), "Add rule");
  const numberPicker = q("#schema-property-rule-picker");
  const wildcardPicker = { heading:q("#schema-property-rule-picker-heading").textContent, choices:Array.from(numberPicker.querySelectorAll('[aria-label="Create a rule"] button')).map(({ textContent }) => textContent) };
  click(numberPicker, "Product ids version 1");
  const stored = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")).find(({ name }) => name === "Product detail");
  const persisted = { pendingChanges:stored.workingDraft.pendingChanges, attachmentPaths:stored.workingDraft.attachedRules.map(({ propertyPath }) => propertyPath), currentRules:(stored.attachedRules ?? []).length, currentVersion:stored.version };
  const nested = await import("/data-layer-schema-nested-path.js");
  const schemaModel = await import("/data-layer-schema-verification.js");
  const pickerModel = await import("/data-layer-schema-property-rule-picker.js");
  const payload = { fruits:["apple", "banana", "pear"], products:[{ id:1, name:"product 1" }, { id:2, name:"product 2" }], order:{ id:"12345678" } };
  const schemaDocument = stored.workingDraft.document;
  const targetChoices = nested.nestedTargetChoices(payload, "/products/1/id");
  const nestedChoice = nested.nestedTargetChoices(payload, "/order/id");
  const normalization = Object.fromEntries(["nested order id", "fruits item at zero-based index 1", "id in every products item"].map((intent) => [intent, nested.canonicalPathForTargetIntent(intent)]));
  const pathValidation = Object.fromEntries(["/order/id", "/products/*/id", "/fruits/1", "/order/*", "/fruits/name", "/fruits/-1"].map((path) => [path, nested.validateNestedRuleTarget(schemaDocument, path)]));
  const compatibility = Object.fromEntries(["/order/id", "/products/*/id", "/fruits/1"].map((path) => { const type = nested.validateNestedRuleTarget(schemaDocument, path).targetType; return [path, pickerModel.builtInRulesForProperty(type).map(({ name }) => name)]; }));
  const ensured = nested.ensureNestedSchemaPath({ type:"object" }, "/products/*/id", "number");
  const validate = (rules, value = payload, model = schemaDocument) => {
    const schema = { id:"preview", name:"Product detail", version:3, document:model, assignments:[], attachedRules:rules };
    return schemaModel.validateWithSchema({ sourceId:"event", eventName:"product_view", payload:value, rawInput:[] }, schema, [schema]);
  };
  const fruitRules = [{ id:"banana", version:1, propertyPath:"/fruits/1", operator:"exact-value", parameters:"banana" }];
  const fruits = [payload.fruits, ["apple", "orange", "pear"], ["apple"]].map((values) => { const result = validate(fruitRules, { ...payload, fruits:values }); return { state:result.state, paths:result.issues.map(({ instancePath }) => instancePath) }; });
  const productRules = [{ id:"id", version:1, propertyPath:"/products/*/id", operator:"value-type", parameters:"number" }, { id:"name", version:1, propertyPath:"/products/*/name", operator:"non-empty-string" }];
  const productsResult = validate(productRules, { ...payload, products:[payload.products[0], { name:"" }] });
  const emptyProducts = validate(productRules, { ...payload, products:[] });
  const orders = ["12345678", "1234567", "1234567a"].map((id) => { const result = validate([{ id:"length", version:1, propertyPath:"/order/id", operator:"text-length", parameters:"8" }, { id:"digits", version:1, propertyPath:"/order/id", operator:"digits-only" }], { ...payload, order:{ id } }); return { id, state:result.state, failed:result.issues[0]?.expected ?? "none" }; });
  const combined = validate([{ id:"all-fruits", version:1, propertyPath:"/fruits/*", operator:"value-type", parameters:"string" }, ...fruitRules]);
  const repeatedPayload = { orders:[{ items:[{ sku:"A" }, { sku:"" }] }, { items:[{ sku:"B" }] }] };
  const repeatedDocument = nested.ensureNestedSchemaPath({ type:"object" }, "/orders/*/items/*/sku", "string").document;
  const repeated = validate([{ id:"sku", version:1, propertyPath:"/orders/*/items/*/sku", operator:"non-empty-string" }], repeatedPayload, repeatedDocument);
  const validation = {
    fruits,
    products:productsResult.issues.map(({ instancePath, templatePath }) => ({ instancePath, templatePath })),
    emptyProducts:{ issues:emptyProducts.issues.length, itemCountAvailable:pickerModel.builtInRulesForProperty("array").some(({ name }) => name === "Item count") },
    orders,
    combined:{ wildcardMatches:nested.resolveNestedValues(payload, "/fruits/*").length, exactMatches:nested.resolveNestedValues(payload, "/fruits/1").length, issues:combined.issues.length },
    repeated:repeated.issues.map(({ instancePath, templatePath, expected, actual }) => ({ instancePath, templatePath, expected, actual })),
  };
  return { advanced, invalidIndex, validIndex, exactIndex, wildcardPicker, persisted, targetChoices, nestedChoice, normalization, pathValidation, compatibility, ensured:{ createdNodes:ensured.createdNodes, property:ensured.document.properties.products }, validation };
})()`;

const schemaRevisionLifecycleUiRuntime = `(() => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const productRow = () => Array.from(q("#schema-list").querySelectorAll("li")).find((row) => row.textContent.includes("Product listing · current revision 4"));
  const productAction = (label) => {
    const button = Array.from(productRow()?.querySelectorAll("button") ?? []).find((candidate) => candidate.textContent === label);
    if (!button) throw new Error("Missing Product listing " + label + " action");
    return button;
  };
  const storedProduct = () => JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1") ?? "[]").find(({ id }) => id === "schema-product-listing");
  q("#data-layer-view-schemas").click();
  q("#schema-subview-schemas").click();
  const beforeOpen = structuredClone(storedProduct());
  const initialRows = Array.from(q("#schema-list").querySelectorAll("li")).map((row) => row.childNodes[0]?.textContent?.trim() ?? "");
  const assignmentChoices = Array.from(q("#schema-assignment-schema").options).map((option) => option.textContent);
  productAction("Edit working draft").click();
  const opened = storedProduct();
  q("#schema-revision-history summary").click();
  const historyOptions = Array.from(q("#schema-revision-selector").options).map((option) => option.textContent);
  q("#schema-revision-selector").value = "2";
  q("#schema-revision-selector").dispatchEvent(new Event("change", { bubbles:true }));
  const history = {
    options:historyOptions,
    comparison:q("#schema-revision-comparison").textContent,
    actions:Array.from(q("#schema-revision-history").querySelectorAll("button")).map((button) => button.textContent),
    separateRows:initialRows.filter((text) => /revision [123](?:\\D|$)/i.test(text)).length,
    assignmentChoices,
    openedWithoutMutation:JSON.stringify(opened) === JSON.stringify(beforeOpen),
    status:q("#schema-editor-status").textContent,
  };
  q("#duplicate-schema-revision").click();
  const storedAfterDuplicate = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1") ?? "[]");
  const duplicate = storedAfterDuplicate.find(({ name, published }) => published === false && /revision 2 copy/.test(name));
  const duplication = {
    name:duplicate?.name,
    published:duplicate?.published,
    version:duplicate?.version,
    assignments:duplicate?.assignments?.length,
    sourceUnchanged:storedAfterDuplicate.find(({ id }) => id === "schema-product-listing")?.version,
    assignableChoices:Array.from(q("#schema-assignment-schema").options).map((option) => option.textContent),
  };
  productAction("Edit working draft").click();
  q("#schema-revision-selector").value = "2";
  q("#restore-schema-revision").click();
  const restorationReview = q("#schema-revision-review-summary").textContent;
  q("#cancel-schema-revision").click();
  const cancel = {
    dialogClosed:!q("#schema-revision-review").open,
    draftUnchanged:JSON.stringify(storedProduct().workingDraft) === JSON.stringify(beforeOpen.workingDraft),
    current:storedProduct().version,
  };
  q("#restore-schema-revision").click();
  q("#confirm-schema-revision").click();
  const restored = storedProduct();
  const restoration = {
    review:restorationReview,
    cancel,
    confirmed:{ current:restored.version, source:restored.workingDraft?.sourceVersion, pending:restored.workingDraft?.pendingChanges },
  };
  q("#save-schema").click();
  const publicationReview = q("#schema-revision-review-summary").textContent;
  q("#confirm-schema-revision").click();
  const published = storedProduct();
  return {
    history,
    duplication,
    restoration,
    publication:{ review:publicationReview, current:published.version, history:published.revisionHistory.map(({ version }) => version), draftCleared:!published.workingDraft },
  };
})()`;

const schemaSourceCreationRuntime = `(() => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const input = (selector, value) => { const element = q(selector); element.value = value; element.dispatchEvent(new Event("input", { bubbles:true })); };
  q("#data-layer-view-library").click();
  q("#add-new-event").click();
  input("#event-template-name", "Order complete");
  input("#event-template-event-name", "order_complete");
  q("#event-template-source").value = "event-history"; q("#event-template-source").dispatchEvent(new Event("input", { bubbles:true }));
  input("#push-destination-path", "dataLayer");
  input("#event-template-json", JSON.stringify({ page_type:"confirmation", page_name:"Thank you", commerce:{ order:{ id:"O-1" } } }));
  q("#save-template-revision").click();
  const schemaSelector = q("#library-draft-schema-selector");
  schemaSelector.value = Array.from(schemaSelector.options).find((option) => option.value)?.value ?? "";
  schemaSelector.dispatchEvent(new Event("change", { bubbles:true }));
  const draftBeforeRefresh = q("#event-template-json").value;
  q("#refresh-library-draft-validation").click();
  const draftRefresh = { unchanged:draftBeforeRefresh === q("#event-template-json").value, message:q("#event-template-validation").textContent };
  q("#save-template-revision").click();
  q("#confirm-revision-change").click();
  const persistedAttachment = JSON.parse(localStorage.getItem("my-chrome-utilities.event-template-library.v1") ?? "[]").find((template) => template.name === "Order complete")?.schemaId;
  const create = Array.from(q("#event-template-list").querySelectorAll("button")).find((button) => button.textContent === "Create schema");
  if (!create) throw new Error("Missing Library Create schema action");
  create.click();
  return {
    schemaView:!q("#data-layer-panel-schemas").hidden,
    editor:!q("#schema-editor").hidden,
    name:q("#schema-editor-name").value,
    paths:Array.from(q("#schema-property-tree").querySelectorAll("strong")).map((row) => row.textContent),
    assignment:q("#schema-editor-target").value,
    draftRefresh,
    persistedAttachment,
  };
})()`;

const schemaInheritanceRuntime = `(async () => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const input = (selector, value) => { const element = q(selector); element.value = value; element.dispatchEvent(new Event("input", { bubbles:true })); };
  q("#data-layer-view-schemas").click();
  q("#schema-subview-schemas").click();
  if (${JSON.stringify(schemaLibraryExportFixture)} === "1:3") {
    q("#create-schema").click();
    input("#schema-editor-name", "Order confirmation");
    const parent = Array.from(q("#schema-editor-parent").options).find((option) => option.textContent.startsWith("Checkout schema v2"));
    if (!parent) throw new Error("Missing saved parent schema option");
    q("#schema-editor-parent").value = parent.value;
    q("#schema-editor-parent").dispatchEvent(new Event("change", { bubbles:true }));
    return {
      groups:Array.from(q("#schema-inherited-rule-groups").querySelectorAll("[data-inherited-rule-group]")).map((group) => ({ state:group.dataset.inheritedRuleGroup, text:group.textContent })),
      preview:Array.from(q("#schema-effective-rule-preview").querySelectorAll("li")).map((item) => item.textContent),
    };
  }
  q("#schema-subview-rules").click();
  q("#create-schema-rule").click();
  input("#schema-rule-name", "Known channels");
  q("#schema-rule-operator").value = "allowed-values";
  input("#schema-rule-parameters", "channel:web,app");
  q("#schema-rule-severity").value = "warning";
  input("#schema-rule-message", "Choose a known channel");
  const parentAttachment = Array.from(q("#schema-rule-attachments").options).find((option) => option.textContent.startsWith("Checkout schema v2"));
  if (!parentAttachment) throw new Error("Missing parent schema attachment option");
  parentAttachment.selected = true;
  q("#save-schema-rule").click();
  q("#schema-subview-schemas").click();
  q("#create-schema").click();
  input("#schema-editor-name", "Order confirmation");
  const parent = Array.from(q("#schema-editor-parent").options).find((option) => option.textContent.startsWith("Checkout schema v2"));
  if (!parent) throw new Error("Missing saved parent schema option");
  q("#schema-editor-parent").value = parent.value;
  q("#schema-editor-parent").dispatchEvent(new Event("change", { bubbles:true }));
  q("#save-schema").click();
  q("#confirm-schema-revision").click();
  const child = Array.from(q("#schema-list").querySelectorAll("li")).find((item) => item.textContent.startsWith("Order confirmation · current revision 1"));
  if (!child) throw new Error("Missing saved child schema");
  q("#schema-subview-assignments").click();
  q("#create-schema-assignment").click();
  q("#schema-assignment-schema").value = Array.from(q("#schema-assignment-schema").options).find((option) => option.textContent.startsWith("Order confirmation version 1"))?.value ?? "";
  input("#schema-assignment-source", "event-history");
  input("#schema-assignment-event", "page_view");
  q("#schema-assignment-target").value = "payload";
  input("#schema-assignment-priority", "200");
  q("#save-schema-assignment").click();
  return {
    groups:Array.from(q("#schema-inherited-rule-groups").querySelectorAll("[data-inherited-rule-group]")).map((group) => ({ state:group.dataset.inheritedRuleGroup, text:group.textContent })),
    preview:Array.from(q("#schema-effective-rule-preview").querySelectorAll("li")).map((item) => item.textContent),
  };
})()`;

const schemaLibraryTransferRuntime = `(async () => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  q("#data-layer-view-schemas").click();
  const originalClick = HTMLAnchorElement.prototype.click;
  const originalCreateObjectURL = URL.createObjectURL;
  let downloadName = "";
  let exportedBlob;
  URL.createObjectURL = function (blob) { exportedBlob = blob; return originalCreateObjectURL.call(this, blob); };
  HTMLAnchorElement.prototype.click = function () { downloadName = this.download; };
  q("#export-schema").click();
  HTMLAnchorElement.prototype.click = originalClick;
  URL.createObjectURL = originalCreateObjectURL;
  const exported = JSON.parse(await exportedBlob.text());
  const identities = (items) => items.map((item) => item.id);
  const before = { schemas:identities(JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1") ?? "[]")), rules:identities(JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1") ?? "[]")) };
  const file = new File([JSON.stringify(exported)], "schema-library-v1.json", { type:"application/json" });
  const input = q("#schema-library-import-file");
  Object.defineProperty(input, "files", { configurable:true, value:[file] });
  input.dispatchEvent(new Event("change", { bubbles:true }));
  await new Promise((resolve) => setTimeout(resolve, 25));
  q("#replace-schema-library").click();
  const reloaded = { schemas:identities(JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1") ?? "[]")), rules:identities(JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1") ?? "[]")) };
  return {
    downloadName,
    content:{ version:exported.version, schemas:identities(exported.schemas), rules:identities(exported.rules) },
    before,
    result:q("#schema-result").textContent,
    review:q("#schema-import-review").open,
    actions:Array.from(q("#schema-import-review").querySelectorAll("button")).map((button) => button.textContent),
    reloaded,
  };
})()`;

const schemaLiveValidationRuntime = `(async () => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  globalThis.chrome = {
    tabs:{ query:async () => [{ id:17, windowId:3, url:"https://shop.example/order-confirmation", title:"Checkout", active:true }] },
    scripting:{ executeScript:async () => [{ result:{ queue:{ history:[{ event:"page_view", page_type:"checkout", channel:"email" }] } } }] },
  };
  q("#choose-observation-target").click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  q("#observation-target-list [data-target-id]").click();
  q("#start-data-layer-testing").click();
  await new Promise((resolve) => setTimeout(resolve, 25));
  const event = q("#live-event-feed button"); event.click();
  const validate = Array.from(q("#live-event-inspector").querySelectorAll("button")).find((button) => button.textContent === "Validate" || button.textContent === "Revalidate");
  if (!validate) throw new Error("Missing Validate action");
  validate.click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  const validationTerm = q('#live-event-inspector dt[data-field="validation"]');
  q("#add-event-feed-filter").click();
  const field = q("#event-feed-query-field");
  field.value = "Validation state"; field.dispatchEvent(new Event("change", { bubbles:true }));
  q("#event-feed-query-operator").value = "is";
  const value = q("#event-feed-query-value"); value.value = "Warnings"; value.dispatchEvent(new Event("input", { bubbles:true }));
  Array.from(q("#live-event-query").querySelectorAll("button")).find((button) => button.textContent === "Apply condition").click();
  return { event:event.textContent, validation:validationTerm.nextElementSibling?.textContent ?? "", detail:document.querySelector("#live-event-inspector [data-validation-details]")?.textContent ?? document.querySelector("#live-event-validation-issues")?.textContent ?? "", filtered:Array.from(q("#live-event-feed").querySelectorAll("button")).map((button) => button.textContent), queryFields:Array.from(field.options).map((option) => option.textContent) };
})()`;

const liveValidationVisualsRuntime = `(async () => {
  const ui = await import("/data-layer-live-observer-ui.js");
  const host = document.createElement("section"); host.innerHTML = '<section id="data-layer-panel-live"><ul id="live-source-statuses"></ul><section id="live-event-list"><ul id="live-event-feed"></ul></section><section id="live-event-inspector"></section><button id="back-to-events">Back to events</button><output id="live-session-message"></output></section>';
  document.body.append(host);
  const elements = ui.findLiveObserverElements(host);
  const evaluation = (propertyPath, status, message, rule, severity="error") => ({ propertyPath, status, message, expected:"expected value", actual:"actual value", rule, ruleVersion:2, severity, schemaName:"Checkout schema", schemaVersion:4 });
  const issue = (instancePath, message, severity="error", rule="Schema rule v1", expected="expected value", actual="actual value") => ({ instancePath, message, expected, actual, schemaName:"Checkout schema", schemaVersion:4, schemaLocation:"#/rules", rule, severity, origin:"Checkout schema v4" });
  const details = {
    schema:{ id:"schema:checkout:4", name:"Checkout schema", version:4 },
    assignment:{ id:"assignment:checkout", name:"Checkout pages", sourceId:"event-history", eventName:"purchase", target:"payload", domainCondition:"shop.example", enabled:true },
    evaluations:[
      evaluation("currency", "pass", "Currency is allowed", "Known currencies"), evaluation("currency", "pass", "Currency is ISO", "ISO currencies"),
      evaluation("page_title", "pass", "Title is present", "Required title"), evaluation("page_title", "warning", "Prefer a concise title", "Title guidance", "warning"),
      evaluation("page_type", "pass", "Page type is present", "Required page type"), evaluation("page_type", "warning", "Prefer checkout", "Page type guidance", "warning"), { ...evaluation("page_type", "error", "Page type is invalid", "Known page types"), expected:"checkout", actual:"legacy" },
      evaluation("commerce.order.id", "error", "Order id is invalid", "Order id"), evaluation("commerce.order.total", "warning", "Total is unusual", "Order total", "warning"), evaluation("commerce.currency", "warning", "Currency is unusual", "Commerce currency", "warning"),
    ],
    issues:[
      issue("/page_type", "Page type is invalid", "error", "Known page types v2", "checkout", "legacy"),
      issue("/page_title", "Prefer a concise title", "warning", "Title guidance v2", "short text", "A very long title"),
      issue("/commerce/order/id", "Order id is invalid", "error", "Order id v2"), issue("/commerce/order/total", "Total is unusual", "warning", "Order total v2"), issue("/commerce/currency", "Currency is unusual", "warning", "Commerce currency v2"),
      issue("/order_id", "Required property", "error", "Required fields v1", "string", "missing"),
      issue("", "Assignment requires consent", "error", "Consent pairing v1"), issue("", "Currency conflicts with country", "warning", "Country currency v1"),
    ],
  };
  const base = { sourceId:"event-history", sourceName:"Event history", captureTime:"2026-07-13T10:00:00Z", pageUrl:"https://shop.example/checkout", destination:"queue.history", provenance:"captured:event-history", rawInput:[] };
  const events = [
    { ...base, id:"valid", name:"pageview", validation:"Valid", payload:{} },
    { ...base, id:"warning", name:"checkout", validation:"2 warnings", payload:{} },
    { ...base, id:"error", name:"purchase", validation:"2 errors and 1 warning", payload:{ page_path:"/checkout", currency:"EUR", page_title:"A very long title", page_type:"legacy", commerce:{ order:{ id:"bad", total:999 }, currency:"ZZZ" }, sibling:"safe" }, validationDetails:details },
    { ...base, id:"neutral", name:"consent", validation:"Not checked", payload:{} },
    { ...base, id:"assignment", name:"refund", validation:"Assignment error", payload:{} },
  ];
  ui.renderLiveObserverState(elements, { view:"Live", status:"Live", pageUrl:base.pageUrl, sources:[], events, inspectorEventId:"error", listVisible:true }, () => {});
  const rows = Object.fromEntries(Array.from(elements.eventFeed.querySelectorAll("button[data-event-id]")).map((button) => [button.dataset.eventId, { text:button.querySelector(".live-validation-badge").textContent.trim(), symbol:button.querySelector(".live-validation-badge").dataset.symbol, treatment:button.dataset.validationTreatment, name:button.getAttribute("aria-label"), border:getComputedStyle(button).borderInlineStartColor, readable:button.scrollWidth <= button.clientWidth || getComputedStyle(button).overflowWrap === "anywhere" }]));
  const selected = elements.eventFeed.querySelector('button[data-event-id="error"]'); selected.focus();
  const rowStates = { selected:selected.getAttribute("aria-pressed"), focused:document.activeElement === selected, eventNameVisible:selected.textContent.includes("purchase"), sourceVisible:selected.textContent.includes("Event history") };
  const handlers = { copyPayload:async()=>{}, saveToLibrary:()=>{}, validationAvailability:()=>({ enabled:true }), validate:()=>{}, manualSchemaChoices:()=>[{ id:"schema:checkout:4", label:"Checkout schema v4" }], selectManualSchema:()=>{} };
  ui.renderLiveInspector(elements, events[2], handlers);
  const inspector = {
    summary:elements.eventInspector.querySelector("#live-inspector-validation-summary").textContent,
    schema:Array.from(elements.eventInspector.querySelectorAll("dt")).find((term) => term.textContent === "Assigned schema")?.nextElementSibling?.textContent,
    actions:Array.from(elements.eventInspector.querySelectorAll("button")).map((button) => button.textContent),
    changeSchema:elements.eventInspector.querySelector("#live-change-schema")?.getAttribute("aria-label"),
    presentation:Array.from(elements.eventInspector.children).map((element) => element.getAttribute("aria-label") || element.id || element.tagName),
    rawJson:elements.eventInspector.querySelector("#live-raw-json summary").textContent,
  };
  const property = (path) => elements.eventInspector.querySelector("#live-property-" + path.replace(/[^a-z0-9]+/gi, "-"));
  const properties = Object.fromEntries(["page_path","currency","page_title","page_type","commerce","commerce.order.id","sibling","order_id"].map((path) => { const row = property(path); return [path, { status:row?.querySelector(":scope > .live-validation-property-row .live-property-status")?.textContent, treatment:row?.dataset.validationTreatment, evaluations:row?.querySelectorAll(":scope > .live-property-rule-details li").length ?? 0, aggregate:row?.querySelector(":scope > .live-validation-property-row .live-property-aggregate")?.textContent ?? null, missing:row?.querySelector('[data-missing="true"]')?.textContent ?? null }]; }));
  const statusButton = property("page_type").querySelector(".live-property-status");
  statusButton.dispatchEvent(new PointerEvent("pointerenter", { bubbles:true }));
  const pointerPreview = property("page_type").querySelector("[role=tooltip]").textContent;
  statusButton.dispatchEvent(new PointerEvent("pointerleave", { bubbles:true })); statusButton.focus();
  const focusPreview = property("page_type").querySelector("[role=tooltip]").textContent;
  statusButton.dispatchEvent(new KeyboardEvent("keydown", { key:"Escape", bubbles:true }));
  const escaped = property("page_type").querySelector("[role=tooltip]").hidden;
  const disclosures = {};
  for (const [name, event] of [["enter",new KeyboardEvent("keydown", { key:"Enter", bubbles:true })],["space",new KeyboardEvent("keydown", { key:" ", bubbles:true })]]) { if (statusButton.getAttribute("aria-expanded") === "true") statusButton.click(); statusButton.dispatchEvent(event); disclosures[name] = statusButton.getAttribute("aria-expanded"); }
  if (statusButton.getAttribute("aria-expanded") === "true") statusButton.click(); statusButton.click(); disclosures.click = statusButton.getAttribute("aria-expanded");
  const evaluationText = property("page_type").querySelector(".live-property-rule-details").textContent;
  const issueRows = Array.from(elements.eventInspector.querySelectorAll("#live-event-validation-issues li")).map((item) => item.textContent);
  const issueLink = elements.eventInspector.querySelector("#live-event-validation-issues button"); issueLink.click();
  const issueFocus = document.activeElement?.id;
  const originalPayload = JSON.stringify(events[2].payload); elements.eventInspector.querySelector("#live-raw-json").open = true;
  const unchanged = JSON.stringify(events[2].payload) === originalPayload;
  const scrollBefore = 37; elements.eventInspector.scrollTop = scrollBefore; statusButton.id = "revalidation-focus"; statusButton.focus();
  const validEvent = { ...events[2], validation:"Valid", validationDetails:{ ...details, issues:[], evaluations:details.evaluations.filter(({ status }) => status === "pass") } };
  ui.renderLiveObserverState(elements, { view:"Live", status:"Live", pageUrl:base.pageUrl, sources:[], events:events.map((event) => event.id === "error" ? validEvent : event), inspectorEventId:"error", listVisible:true }, () => {});
  ui.renderLiveInspector(elements, validEvent, handlers); elements.eventInspector.querySelector(".live-property-status")?.focus({ preventScroll:true }); elements.eventInspector.scrollTop = scrollBefore; ui.setEventValidationUpdateStatus(elements, "Validation changed to Valid.");
  const revalidation = { inspector:elements.eventInspector.querySelector("#live-inspector-validation-summary").textContent, feed:elements.eventFeed.querySelector('button[data-event-id="error"] .live-validation-badge').textContent.trim(), status:elements.eventInspector.querySelector("#live-validation-update-status").textContent, live:elements.eventInspector.querySelector("#live-validation-update-status").getAttribute("aria-live"), scroll:elements.eventInspector.scrollTop, focused:Boolean(elements.eventInspector.contains(document.activeElement)) };
  host.remove();
  return { rows, rowStates, inspector, properties, pointerPreview, focusPreview, escaped, disclosures, evaluationText, issueRows, issueFocus, unchanged, revalidation };
})()`;

const naturalLibraryActionsRuntime = `(() => {
  const editor = document.querySelector("#event-property-editor");
  const actions = ["#add-new-event", "#import-event-library", "#export-event-library", "#clear-event-library"].map((selector) => {
    const button = document.querySelector(selector); return { id:button.id, visible:button.getClientRects().length > 0, disabled:button.disabled };
  });
  return {
    editorHidden:editor.hidden,
    editorDisplay:getComputedStyle(editor).display,
    editorOffsetParent:editor.offsetParent === null,
    actions,
    saveLatestPresent:Boolean(document.querySelector("#save-latest-template")),
  };
})()`;

const openLibraryRuntime = `(() => {
  const tab = document.querySelector("#data-layer-view-library");
  tab.click();
  return {
    selected:tab.getAttribute("aria-selected"),
    panelHidden:document.querySelector("#data-layer-panel-library").hidden,
  };
})()`;

const libraryActionsRecoveryRuntime = `(async () => {
  const q = (selector) => {
    const element = document.querySelector(selector);
    if (!element) throw new Error("Missing " + selector);
    return element;
  };
  const visible = (element) => {
    const rect = element.getBoundingClientRect();
    return !element.hidden && getComputedStyle(element).display !== "none" && rect.width > 0 && rect.height > 0;
  };
  const dialogState = (dialog) => {
    const rect = dialog.getBoundingClientRect();
    return {
      hidden: dialog.hidden,
      display: getComputedStyle(dialog).display,
      positiveGeometry: rect.width > 0 && rect.height > 0,
      hiddenAncestor: Boolean(dialog.parentElement?.closest("[hidden]")),
      focused: dialog.contains(document.activeElement),
    };
  };
  const setValue = (selector, value) => {
    const field = q(selector);
    field.value = value;
    field.dispatchEvent(new Event("input", { bubbles:true }));
  };
  const create = (name, eventName, destination, payload) => {
    q("#add-new-event").click();
    const initial = {
      editor: visible(q("#event-property-editor")),
      fields: ["#event-template-name", "#event-template-event-name", "#event-template-source", "#push-destination-path", "#event-template-json"].map((selector) => ({ selector, value:q(selector).value, visible:visible(q(selector)) })),
      saveDisabled:q("#save-template-revision").disabled,
      focused:document.activeElement === q("#event-template-name"),
    };
    q("#event-template-json-section summary").click();
    q("#event-template-execution-settings summary").click();
    setValue("#event-template-name", name);
    setValue("#event-template-event-name", eventName);
    const source = q("#event-template-source");
    source.value = "event-history";
    source.dispatchEvent(new Event("input", { bubbles:true }));
    setValue("#push-destination-path", destination);
    setValue("#event-template-json", JSON.stringify(payload));
    const saveEnabled = !q("#save-template-revision").disabled;
    q("#save-template-revision").click();
    return { initial, saveEnabled };
  };

  const purchase = create("Purchase confirmation", "purchase", "event.history", { ecommerce:{ value:18 }, items:[{ quantity:1 }], legacy:{ debug:true } });
  const close = q("#close-template-editor");
  close.click();
  const closeResult = {
    hidden:q("#event-property-editor").hidden,
    display:getComputedStyle(q("#event-property-editor")).display,
    offsetParent:q("#event-property-editor").offsetParent === null,
    editFocused:document.activeElement === q('[data-template-id]'),
  };
  q('[data-template-id]').click();
  const inlineIdentity = {
    noRename:Boolean(document.querySelector('[aria-label^="Rename "]')) || Boolean(document.querySelector("#event-template-rename")),
    editor:visible(q("#event-property-editor")),
    fields:[q("#event-template-name").disabled, q("#event-template-event-name").disabled],
    values:[q("#event-template-name").value, q("#event-template-event-name").value],
    disclosuresClosed:["#event-template-revision-history-section", "#event-template-properties-section", "#event-template-json-section", "#event-template-execution-settings"].every((selector) => !q(selector).open),
  };
  setValue("#event-template-name", "Completed checkout");
  setValue("#event-template-event-name", "checkout_completed");
  q("#event-template-execution-settings summary").click();
  setValue("#push-destination-path", "queue.history");
  q("#event-template-json-section summary").click();
  setValue("#event-template-json", JSON.stringify({ ecommerce:{ value:19 }, items:[{ quantity:2 }], experiment:{ variant:"treatment-b" } }));
  globalThis.chrome = {
    tabs:{ query:async () => [{ id:7, windowId:1, url:"https://signal.example.test/checkout", title:"Signal Shop", active:true }] },
    scripting:{ executeScript:async () => [{ result:{} }] },
  };
  q("#choose-observation-target").click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  q('#observation-target-list [data-target-id]').click();
  q("#push-template-draft").click();
  const pairs = (root) => [...root.querySelectorAll("dt")].map((term) => [term.textContent, term.nextElementSibling?.textContent]);
  const pushReview = {
    ...dialogState(q("#push-draft-review")),
    details:pairs(q("#push-draft-review-details")),
    changes:[...q("#push-draft-review-change-list").querySelectorAll("dl")].map(pairs),
    confirm:q("#confirm-push-draft").textContent,
  };
  q("#cancel-push-draft").click();
  const pushCancelled = { focused:document.activeElement === q("#push-template-draft"), result:q("#event-template-result").textContent };
  q("#save-template-revision").click();
  const revisionReview = {
    ...dialogState(q("#revision-change-review")),
    details:pairs(q("#revision-change-review [data-change-details]")),
    changes:[...q("#revision-change-review [data-change-list]").querySelectorAll("dl")].map(pairs),
    confirm:q("#confirm-revision-change").textContent,
  };
  q("#revision-change-review").dispatchEvent(new Event("cancel", { cancelable:true }));
  const revisionCancel = { hidden:q("#revision-change-review").hidden, draft:[q("#event-template-name").value, q("#event-template-event-name").value, q("#push-destination-path").value], focused:document.activeElement === q("#save-template-revision") };
  q("#save-template-revision").click();
  q("#confirm-revision-change").click();
  const revisionSaved = { identity:q(".event-template-identity").textContent, result:q("#event-template-result").textContent };
  q("#close-template-editor").click();

  const scroll = create("Scroll milestone", "scroll", "event.history", { scroll_percentage:25 });
  q("#close-template-editor").click();

  let exported;
  const createObjectUrl = URL.createObjectURL;
  URL.createObjectURL = (blob) => { exported = blob; return createObjectUrl.call(URL, blob); };
  try { q("#export-event-library").click(); }
  finally { URL.createObjectURL = createObjectUrl; }
  const exportData = JSON.parse(await exported.text());
  const exportResult = {
    templateNames:exportData.templates.map((template) => template.name).sort(),
    revisions:exportData.templates.map((template) => template.version).sort(),
    payloads:exportData.templates.map((template) => template.payload),
    settings:exportData.templates.map((template) => template.destination),
  };

  q("#clear-event-library").click();
  const clearReview = { ...dialogState(q("#event-library-delete-review")), summary:q("#event-library-delete-review-summary").textContent };
  q("#confirm-event-library-delete").click();
  const cleared = { count:q("#event-template-list").children.length, addAvailable:visible(q("#add-new-event")), importAvailable:visible(q("#import-event-library")) };

  const file = new File([JSON.stringify(exportData)], "event-library.json", { type:"application/json" });
  const fileInput = q("#event-library-file");
  Object.defineProperty(fileInput, "files", { configurable:true, value:[file] });
  fileInput.dispatchEvent(new Event("change", { bubbles:true }));
  await new Promise((resolve) => setTimeout(resolve, 50));
  const importReview = { ...dialogState(q("#event-library-import-review")), replaceVisible:visible(q("#replace-event-library")), appendVisible:visible(q("#append-event-library")) };
  q("#replace-event-library").click();
  const replaceArmed = q("#replace-event-library").textContent;
  q("#replace-event-library").click();
  const restored = {
    names:[...q("#event-template-list").querySelectorAll(".event-template-identity")].map((element) => element.textContent.split(" · ")[0]).sort(),
    persisted:JSON.parse(localStorage.getItem("my-chrome-utilities.event-template-library.v1") ?? "[]").map((template) => template.name).sort(),
  };

  q('[aria-label="Delete Completed checkout"]').click();
  const deleteReview = { ...dialogState(q("#event-library-delete-review")), summary:q("#event-library-delete-review-summary").textContent };
  q("#confirm-event-library-delete").click();
  const afterDelete = [...q("#event-template-list").querySelectorAll(".event-template-identity")].map((element) => element.textContent);
  q("#clear-event-library").click();
  q("#confirm-event-library-delete").click();
  const final = {
    count:q("#event-template-list").children.length,
    persisted:JSON.parse(localStorage.getItem("my-chrome-utilities.event-template-library.v1") ?? "[]").length,
    addAvailable:visible(q("#add-new-event")),
    importAvailable:visible(q("#import-event-library")),
  };
  return { purchase, closeResult, inlineIdentity, pushReview, pushCancelled, revisionReview, revisionCancel, revisionSaved, scroll, exportResult, clearReview, cleared, importReview, replaceArmed, restored, deleteReview, afterDelete, final };
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

const inspectorNavigationRuntime = `import("./data-layer-live-observer-ui.js").then(({ renderLiveInspector, renderLiveObserverState, updateLiveInspectorValidation }) => {
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
  updateLiveInspectorValidation(elements, "1 issues", [{ instancePath:"/commerce/order/id", message:"Required value", expected:"string", actual:"missing", schemaName:"Order confirmation", schemaVersion:2, schemaLocation:"#/properties/commerce" }], { id:"assignment:checkout", name:"Checkout confirmation", sourceId:"event-history", eventName:"page_view", target:"payload", priority:100, domainCondition:"shop.example", pathnameCondition:"/order-confirmation", versionPolicy:"follow latest", enabled:true });
  const hiddenAncestor = (element) => { for (let current = element; current; current = current.parentElement) if (current.hidden) return true; return false; };
  return {
    listInLayout: eventList.getClientRects().length > 0,
    inspectorInLayout: eventInspector.getClientRects().length > 0,
    backInLayout: backToEventsButton.getClientRects().length > 0,
    backHasHiddenAncestor: hiddenAncestor(backToEventsButton),
    backInsideList: eventList.contains(backToEventsButton),
    backIsFirstHeaderControl: eventInspector.firstElementChild?.firstElementChild === backToEventsButton,
    validationDetail:eventInspector.querySelector("[data-validation-details]")?.textContent,
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

const templateChangeReviewRuntime = `Promise.all([
  import("./data-layer-event-library-editor.js"),
  import("./data-layer-event-library-editor-ui.js"),
  import("./data-layer-template-change-review.js"),
]).then(([editorModel, editorUi, reviewModel]) => {
  const list = document.querySelector("#event-template-list");
  const template = { id:"template-7", name:"Purchase confirmation", eventName:"purchase", sourceId:"event-history", sourceName:"Event history", destination:"queue.history", tags:["checkout"], schemaId:"purchase", validation:"Valid", payload:{ transaction_id:"T-1" }, version:3, originatingSessionId:"session-1", originatingEventId:"event-1", provenance:"captured:event-history" };
  const elements = editorUi.findEventLibraryEditorElements();
  let editor = editorModel.openPropertyEditor(template);
  editor = editorModel.setTemplateIdentity(editor, "name", "Completed checkout");
  editor = editorModel.setTemplateIdentity(editor, "eventName", "checkout_completed");
  editorUi.renderEventLibraryEditor(elements, [template], editor, { edit:()=>{}, rename:()=>{}, duplicate:()=>{}, push:()=>{}, delete:()=>{} });
  const review = reviewModel.createTemplateChangeReview(editor, "revision");
  return { renameAction:Boolean(list.querySelector('[aria-label^="Rename "]')), renameDialog:Boolean(document.querySelector("#event-template-rename")), editable:[elements.templateName.disabled, elements.eventName.disabled], review:{ label:review.proposedLabel, version:review.resultingVersion, identity:review.identity, noPayload:review.changes.length === 0 } };
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

const workspacePanelContainmentRuntime = `(() => {
  const dataLayerPanel = document.querySelector("#workspace-panel-data-layer");
  const hotkeysPanel = document.querySelector("#workspace-panel-hotkeys");
  const hotkeysTab = document.querySelector("#workspace-tab-hotkeys");
  const peers = dataLayerPanel.parentElement === hotkeysPanel.parentElement;
  const nested = dataLayerPanel.contains(hotkeysPanel) || hotkeysPanel.contains(dataLayerPanel);
  hotkeysTab.click();
  const heading = hotkeysPanel.querySelector("h2");
  const search = hotkeysPanel.querySelector("#hotkey-editor-filter");
  const groups = [...hotkeysPanel.querySelectorAll("#hotkey-editor-commands > section")];
  const observation = {
    peers,
    nested,
    afterActivation:{
      dataLayerHidden:dataLayerPanel.hidden,
      hotkeysHidden:hotkeysPanel.hidden,
      hotkeysVisible:hotkeysPanel.checkVisibility(),
      headingVisible:heading.checkVisibility(),
      searchVisible:search.checkVisibility(),
      registeredGroupCount:groups.length,
      registeredGroupsVisible:groups.length > 0 && groups.every((group) => group.checkVisibility()),
    },
  };
  document.querySelector("#workspace-tab-data-layer").click();
  return observation;
})()`;

const within = (child, parent) => child.x >= parent.x - 1 && child.right <= parent.right + 1 && child.y >= parent.y - 1 && child.bottom <= parent.bottom + 1;
const withinColumn = (child, parent) => child.x >= parent.x - 1 && child.right <= parent.right + 1;
const overlaps = (left, right) => left.x < right.right && left.right > right.x && left.y < right.bottom && left.bottom > right.y;

try {
  const port = await debuggingPort();
  for (const width of componentWidths) {
    const socket = await openPanel(port, width);
    workspacePanelContainmentObservation = await evaluate(socket, workspacePanelContainmentRuntime);
    assert.deepEqual(workspacePanelContainmentObservation, {
      peers:true,
      nested:false,
      afterActivation:{
        dataLayerHidden:true,
        hotkeysHidden:false,
        hotkeysVisible:true,
        headingVisible:true,
        searchVisible:true,
        registeredGroupCount:3,
        registeredGroupsVisible:true,
      },
    }, `Workspace panel containment violated its ${width}px browser contract`);
    if (process.env.WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER === "1") {
      socket.close(); continue;
    }
    if (runSchemaViewContainmentRuntime) {
      schemaViewContainmentObservation = await evaluate(socket, schemaViewContainmentRuntime);
      assert.deepEqual(schemaViewContainmentObservation, {
        containedControls:true,
        editorContainsActions:true,
        closeReviewContainsActions:true,
        assignmentContainsPolicy:true,
        standaloneAssignmentPolicy:0,
        presentationByView:{
          Live:{ panelDisplay:"none", painted:false, focusable:false, closeReviewOpen:false },
          Library:{ panelDisplay:"none", painted:false, focusable:false, closeReviewOpen:false },
          Sessions:{ panelDisplay:"none", painted:false, focusable:false, closeReviewOpen:false },
        },
        editorStates:{ assignmentWasOpen:true, assignmentHiddenWhileAway:true, ruleWasOpen:true, ruleHiddenWhileAway:true },
        restored:{ editorVisible:true, name:"Unsaved checkout schema", closeReviewOpen:false },
      }, `Schema view containment violated its ${width}px browser contract`);
    }
    payloadPathFilterPickerObservation = await evaluate(socket, payloadPathFilterPickerRuntime);
    assert.deepEqual(payloadPathFilterPickerObservation, {
      initialFieldOptions:["Choose field", "Event name", "Source", "Adapter kind", "Pathname", "Payload property", "Validation state", "Schema", "Validation rule", "Rule severity", "Affected property"],
      presentation:{ visible:true, searchAvailable:true, customAvailable:true, pathCount:44, completeAccessibleNames:true, bounded:true, overflowY:"auto", topFieldsAbsent:true, searchFocused:true },
      back:{ stageHidden:true, fieldFocused:true, conditionCount:0 },
      reopenedSearchFocused:true,
      filteredPaths:["commerce.order.id", "commerce.total"],
      observedSelection:{ selected:"Selected field Payload · commerce.total", operatorVisible:true, valueVisible:true, suggestions:["12"] },
      blankCustomDisabled:true,
      customSelection:{ selected:"Selected field Payload · commerce.coupon.code", conditionCount:0 },
      beforeLaterEvent:"0 of 2 events",
      afterLaterEvent:"1 of 3 events",
    }, `Payload path filter picker violated its ${width}px browser contract`);
    if (width === 360 || width === 520) {
      const reproductionStepActionRows = await evaluate(socket, reproductionStepActionRowsRuntime);
      reproductionStepActionRowsObservations.push(reproductionStepActionRows);
      assert.equal(reproductionStepActionRows.width, width);
      assert.equal(reproductionStepActionRows.text, "2. Click Checkout");
      assert.deepEqual(reproductionStepActionRows.actionOrder, ["+", "Adjust", "Remove", "Move earlier", "Move later"]);
      assert.deepEqual(reproductionStepActionRows.tabOrder, reproductionStepActionRows.actionOrder);
      assert.equal(reproductionStepActionRows.textBeforeActions, true);
      assert.equal(reproductionStepActionRows.guidanceAfterActions, true);
      assert.equal(reproductionStepActionRows.completeControls, true);
      assert.equal(reproductionStepActionRows.noHorizontalOverflow, true);
      assert.equal(reproductionStepActionRows.rows.every(({ textBeforeActions, addName }) => textBeforeActions && /^Add step to \//.test(addName)), true);
      assert.deepEqual(reproductionStepActionRows.checkoutBoundary, {
        text:"2. Click Checkout",
        earlierVisible:true,
        earlierDisabled:true,
        guidance:"Reordering stays within /checkout.",
        chooseAnotherAbsent:true,
      });
    }
    await reloadPanel(socket);
    singleLiveEventFeedObservation = await evaluate(socket, singleLiveEventFeedRuntime);
    assert.deepEqual(singleLiveEventFeedObservation, {
      liveFeedCount:1,
      liveFeedInsideLivePanel:true,
      duplicateTimelineCount:0,
      secondaryCurrentSessionLists:[0, 0, 0],
      journey:{ visits:["/checkout", "/products"], eventCount:3 },
      archiveEventIds:["pageview", "promotion", "purchase"],
      defectEventIds:["pageview", "promotion", "purchase"],
    }, `current-session journey was duplicated outside the Live feed at ${width}px`);
    const schemaRuleEditorVisibility = await evaluate(socket, schemaRuleEditorVisibilityRuntime);
    assert.deepEqual(schemaRuleEditorVisibility, {
      hiddenByView:{ Live:true, Library:true, Sessions:true, Schemas:true },
      editorVisible:true,
      configurationVisible:true,
      configurationInsideEditor:true,
    }, `Schema rule configuration visibility violated its ${width}px browser contract`);
    await reloadPanel(socket);
    if (process.env.SAVED_SESSION_LIVE_FEED_BROWSER_ADAPTER === "1") {
      await evaluate(socket, `(() => {
        const events = Array.from({ length:18 }, (_, index) => ({ id:"saved-" + (index + 1), name:"purchase", sourceId:"history", sourceName:"Event history", sourceKind:"Data layer", captureTime:"2026-07-12T10:" + String(index).padStart(2, "0") + ":00Z", pageUrl:"https://example.test/checkout", captureOrder:index + 1, payload:{ index:index + 1 }, rawInput:["purchase", index + 1], provenance:{ adapter:"history", imported:true }, validation:index === 17 ? "1 issues" : "Valid", validationDetails:{ schema:{ id:"checkout", name:"Checkout", version:3 }, issues:index === 17 ? [{ instancePath:"/index", message:"Recorded issue", expected:"17", actual:"18", schemaName:"Checkout", schemaVersion:3, schemaLocation:"#/index" }] : [], evaluations:[] } }));
        const session = { id:"saved:checkout", name:"Checkout journey", immutable:true, pageScope:"https://example.test/checkout", startedAt:"2026-07-12T10:00:00Z", endedAt:"2026-07-12T10:18:00Z", events, provenance:{ imported:true } };
        localStorage.clear();
        localStorage.setItem("my-chrome-utilities.saved-session-library.v1", JSON.stringify({ sessions:[session] }));
        localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([{ id:"checkout", name:"Checkout", version:4, published:true, document:{ type:"object" }, assignments:[{ id:"checkout-purchases", sourceId:"history", eventName:"purchase", target:"payload", enabled:true }] }]));
        return true;
      })()`);
      await reloadPanel(socket);
      savedSessionLiveFeedObservation = await evaluate(socket, savedSessionLiveFeedRuntime);
      await reloadPanel(socket);
      savedSessionLiveFeedReloadObservation = await evaluate(socket, savedSessionLiveFeedReloadRuntime);
      socket.close(); continue;
    }
    if (process.env.SCHEMA_NESTED_PATH_BROWSER_ADAPTER === "1") {
      await evaluate(socket, `(() => {
        const document = { type:"object", properties:{ fruits:{ type:"array", items:{ type:"string" } }, products:{ type:"array", items:{ type:"object", properties:{ id:{ type:"number" }, name:{ type:"string" } } } }, order:{ type:"object", properties:{ id:{ type:"string" } } } } };
        const current = { id:"schema-product-detail", name:"Product detail", version:3, published:true, document, assignments:[], workingDraft:{ baseVersion:3, sourceVersion:3, document, assignments:[], attachedRules:[], pendingChanges:[] } };
        const rules = [{ id:"rule-product-ids", name:"Product ids", kind:"Numeric range · number", operator:"numeric range", parameters:"0-999", applicableType:"number", version:1, enabled:true }];
        localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([current]));
        localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", JSON.stringify(rules));
        return true;
      })()`);
      await reloadPanel(socket);
      schemaNestedPathObservation = await evaluate(socket, schemaNestedPathRuntime);
      socket.close(); continue;
    }
    if (width === 320) {
      const previousPickerStorage = await evaluate(socket, `(() => {
        const previous = Object.fromEntries(Array.from({ length:localStorage.length }, (_, index) => localStorage.key(index)).filter(Boolean).map((key) => [key, localStorage.getItem(key)]));
        const schemas = [
          { id:"schema:product-listing:3", name:"Product listing", version:3, document:{ type:"object", properties:{ page_type:{ type:"string" } } }, assignments:[{ id:"assignment:product", name:"Product pages", sourceId:"event-history", eventName:"pageview", target:"payload", domainCondition:"shop.example", pathConditions:[{ matchType:"Path pattern", expression:"/products/*" }], enabled:true }] },
          { id:"schema:raw-event:2", name:"Raw event", version:2, document:{ type:"object" }, assignments:[{ id:"assignment:raw", name:"Raw pages", sourceId:"event-history", eventName:"pageview", target:"raw input", enabled:true }] },
          { id:"schema:product-archive:4", name:"Product archive", version:4, document:{ type:"object", properties:{ archived:{ type:"boolean" } } }, assignments:[{ id:"assignment:archive", name:"Archive pages", sourceId:"event-history", eventName:"archive", target:"payload", domainCondition:"archive.example", enabled:true }] },
          { id:"schema:numeric:1", name:"Numeric page types", version:1, document:{ type:"object", properties:{ page_type:{ type:"number" } } }, assignments:[{ id:"assignment:numeric", name:"Numeric pages", sourceId:"event-history", eventName:"other", target:"payload", enabled:true }] },
          ...Array.from({ length:46 }, (_, index) => ({ id:"schema:filler:" + index, name:"Reference schema " + String(index + 1).padStart(2, "0"), version:1, document:{ type:"object", properties:{ reference:{ type:"string" } } }, assignments:[{ id:"assignment:filler:" + index, name:"Reference assignment " + index, sourceId:"event-history", eventName:"reference_" + index, target:"payload", domainCondition:"reference-" + index + ".example", enabled:true }] })),
        ];
        localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify(schemas));
        localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", "[]");
        return previous;
      })()`);
      await reloadPanel(socket);
      guidedSchemaPickerObservation = await evaluate(socket, guidedSchemaPickerRuntime);
      assert.deepEqual({
        closed:[guidedSchemaPickerObservation.closed.searchAbsent, guidedSchemaPickerObservation.closed.resultsAbsent],
        opened:{ ...guidedSchemaPickerObservation.opened, resultCount:guidedSchemaPickerObservation.opened.resultCount },
        searchNames:{
          name:guidedSchemaPickerObservation.searches.name.names,
          version:guidedSchemaPickerObservation.searches.version.names,
          property:guidedSchemaPickerObservation.searches.property.names,
          domain:guidedSchemaPickerObservation.searches.domain.names,
          path:guidedSchemaPickerObservation.searches.path.names,
        },
        targetOnly:guidedSchemaPickerObservation.searches.target.targets.every((value) => value === "Target: payload"),
        empty:[guidedSchemaPickerObservation.empty.message, guidedSchemaPickerObservation.empty.selected, guidedSchemaPickerObservation.empty.restoredCount],
        presentation:[guidedSchemaPickerObservation.resultPresentation.incompatibleDisabled, guidedSchemaPickerObservation.resultPresentation.skippedIncompatible],
        enter:guidedSchemaPickerObservation.enterSelection,
        escape:guidedSchemaPickerObservation.escapeDismissal,
        close:guidedSchemaPickerObservation.closeDismissal,
        button:guidedSchemaPickerObservation.buttonSelection,
      }, {
        closed:[true,true],
        opened:{ modal:true, searchFocused:true, resultCount:50, count:"50 of 50 schemas", listScrolls:true, dialogBounded:true, flowUnexpanded:true, backgroundExcluded:true },
        searchNames:{ name:["Product listing version 3"], version:["Product archive version 4"], property:["Product listing version 3", "Numeric page types version 1"], domain:["Product listing version 3"], path:["Product listing version 3"] },
        targetOnly:true,
        empty:["No schemas match the current search.", null, "50 of 50 schemas"],
        presentation:[true,true],
        enter:{ dialogClosed:true, summary:"Product listing version 3", changeFocused:true, target:"payload", expectedTypeSource:"String — Product listing version 3" },
        escape:{ dialogClosed:true, unchanged:true, restored:true },
        close:{ dialogClosed:true, restored:true },
        button:{ summary:"Product listing version 3", changeFocused:true },
      }, "Guided schema picker violated its 320px browser contract");
      if (process.env.SCHEMA_MANUAL_PROPERTY_BROWSER_ADAPTER === "1") {
        await evaluate(socket, `(() => {
          const base = { id:"schema-base", name:"Base schema", version:1, published:true, document:{ type:"object", properties:{ page_name:{ type:"string" } } }, assignments:[] };
          const current = { id:"schema-page-view", name:"Page view", version:3, published:true, parentSchemaId:"schema-base", document:{ type:"object", properties:{ page_type:{ type:"string" } } }, assignments:[], workingDraft:{ baseVersion:3, sourceVersion:3, parentSchemaId:"schema-base", document:{ type:"object", properties:{ page_type:{ type:"string" } } }, assignments:[], attachedRules:[], pendingChanges:[] } };
          localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([base, current]));
          localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", "[]");
          return true;
        })()`);
        await reloadPanel(socket);
        const interaction = await evaluate(socket, schemaManualPropertyRuntime);
        await reloadPanel(socket);
        const reload = await evaluate(socket, schemaManualPropertyReloadRuntime);
        schemaManualPropertyObservation = { interaction, reload };
      }
      if (process.env.SCHEMA_PROPERTY_RULE_PICKER_BROWSER_ADAPTER === "1") {
        await evaluate(socket, `(() => {
          const current = { id:"schema-page-view", name:"Page view", version:3, published:true, document:{ type:"object", properties:{ page_type:{ type:"string" } } }, assignments:[], workingDraft:{ baseVersion:3, sourceVersion:3, document:{ type:"object", properties:{ page_type:{ type:"string" } } }, assignments:[], attachedRules:[], pendingChanges:[] } };
          const rules = [
            { id:"rule:approved", name:"Approved pages", kind:"Allowed values · string", operator:"allowed values", parameters:"homepage, checkout", description:"Public pages", applicableType:"string", version:2, enabled:true },
            { id:"rule:number", name:"Revenue range", kind:"Numeric range · number", operator:"numeric range", parameters:"0-100", applicableType:"number", version:3, enabled:true },
            { id:"rule:array", name:"Item count", kind:"Item count · array", operator:"item count", parameters:"1-10", applicableType:"array", version:1, enabled:true },
          ];
          localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([current]));
          localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", JSON.stringify(rules));
          return true;
        })()`);
        await reloadPanel(socket);
        schemaPropertyRulePickerObservation = await evaluate(socket, schemaPropertyRulePickerRuntime);
      }
      await evaluate(socket, `(previous => { localStorage.clear(); for (const [key, value] of Object.entries(previous)) localStorage.setItem(key, value); })(${JSON.stringify(previousPickerStorage)})`);
      await reloadPanel(socket);
      socket.close();
      continue;
    }
    if (width === 720) {
      const previousGuidedStorage = await evaluate(socket, `(() => {
        const previous = Object.fromEntries(Array.from({ length:localStorage.length }, (_, index) => localStorage.key(index)).filter(Boolean).map((key) => [key, localStorage.getItem(key)]));
        const schemas = [
          { id:"schema:generic-pageview:1", name:"Generic pageview", version:1, document:{ type:"object" }, assignments:[{ sourceId:"event-history", eventName:"other", target:"payload", enabled:true }] },
          { id:"schema:product-listing:3", name:"Product listing", version:3, document:{ type:"object", properties:{ page_type:{ type:"string" } } }, assignments:[{ id:"assignment:product-listing", sourceId:"event-history", eventName:"pageview", target:"payload", domainCondition:"127.0.0.1", enabled:true }] },
          { id:"schema:numeric-page-types:1", name:"Numeric page types", version:1, document:{ type:"object", properties:{ page_type:{ type:"number" } } }, assignments:[{ sourceId:"event-history", eventName:"other", target:"payload", enabled:true }] },
          { id:"schema:raw-pageview:1", name:"Raw pageview", version:1, document:{ type:"object" }, assignments:[{ sourceId:"event-history", eventName:"other", target:"raw input", enabled:true }] },
        ];
        localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify(schemas));
        localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", "[]");
        return previous;
      })()`);
      await reloadPanel(socket);
      const guidedDestinationOptionsObservation = await evaluate(socket, guidedDestinationOptionsRuntime);
      await evaluate(socket, `(() => {
        localStorage.clear();
        for (const [key, value] of Object.entries(${JSON.stringify(previousGuidedStorage)})) localStorage.setItem(key, value);
        const schemas = [
          { id:"schema:existing-pageview:1", name:"Existing pageview", version:1, document:{ type:"object" }, assignments:[{ sourceId:"event-history", eventName:"other", target:"payload", enabled:true }] },
          { id:"schema:generic-pageview:1", name:"Generic pageview", version:1, document:{ type:"object" }, assignments:[{ sourceId:"event-history", eventName:"other", target:"payload", enabled:true }] },
          { id:"schema:generic-pageview:4", name:"Generic pageview", version:4, document:{ type:"object", properties:{ page_type:{ type:"string" } } }, assignments:[{ id:"assignment:generic-shop", name:"Generic shop pages", sourceId:"event-history", eventName:"pageview", target:"payload", domainCondition:"shop.example", pathConditions:[{ matchType:"Path pattern", expression:"/products/*" }], enabled:true }] },
          { id:"schema:product-listing:3", name:"Product listing", version:3, document:{ type:"object", properties:{ page_type:{ type:"string" } } }, assignments:[{ id:"assignment:product-listing", sourceId:"event-history", eventName:"pageview", target:"payload", domainCondition:"127.0.0.1", enabled:true }] },
          { id:"schema:numeric-page-types:1", name:"Numeric page types", version:1, document:{ type:"object", properties:{ page_type:{ type:"number" } } }, assignments:[{ sourceId:"event-history", eventName:"other", target:"payload", enabled:true }] },
          { id:"schema:raw-pageview:1", name:"Raw pageview", version:1, document:{ type:"object" }, assignments:[{ sourceId:"event-history", eventName:"other", target:"raw input", enabled:true }] },
        ];
        localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify(schemas));
        localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", "[]");
        return true;
      })()`);
      await reloadPanel(socket);
      guidedValidationObservation = await evaluate(socket, guidedValidationRuntime);
      guidedValidationObservation.existingOptions = guidedDestinationOptionsObservation;
      const { production, ...renderedGuidedValidation } = guidedValidationObservation;
      assert.deepEqual(renderedGuidedValidation, {
        initial:{
          visible:true,
          heading:"Choose properties",
          focused:true,
          stages:[["Choose properties","current"],["Choose schema destination","upcoming"],["Define requirement","upcoming"],["Choose event scope","upcoming"],["Review validation","upcoming"]],
          advancedPrimary:true,
          persistedUnchanged:true,
        },
        invalid:{ focused:true, link:"Select at least one property" },
        requirement:{ heading:"Define requirement", focused:true, detected:"String — detected from this event", incompatible:false, oldControls:false },
        values:{ labels:["Allowed value 1","Allowed value 2"], assistance:"2 allowed values", focusRetained:true, statusRole:"status", removeActions:2 },
        scope:{ heading:"Choose event scope", selected:"This domain on all paths", choices:["This domain on all paths", "Only the current path", "Selected paths or patterns", "Every domain and path"], prefill:"Domain 127.0.0.1; event pageview; source event-history; target payload." },
        pathBuilder:{ explanation:"This assignment matches when any condition matches.", conditionLabel:"Path condition 1", matchType:"Exact path", expression:"/", result:"/ is a match", remove:"Remove condition", testButton:"Test another path" },
        anotherPath:"/products/field-notebook is a match",
        multipleInvalid:{ focused:true, links:[["Path condition 1: correct the regular expression: Invalid regular expression: /[/: Unterminated character class","#guided-path-expression-0"],["Path condition 2: correct the regular expression: Invalid regular expression: /(/: Unterminated group","#guided-path-expression-1"]], inline:["Path condition 1: correct the regular expression: Invalid regular expression: /[/: Unterminated character class","Path condition 2: correct the regular expression: Invalid regular expression: /(/: Unterminated group"], described:["guided-path-expression-0-hint guided-path-expression-0-error","guided-path-expression-1-hint guided-path-expression-1-error"] },
        destinationInitial:{ heading:"Choose schema destination", choices:["Create a new schema","Add to an existing schema"], selected:null, persistedUnchanged:true },
        blankNameAssistance:"Enter a name for the new schema",
        duplicateNameAssistance:"Choose the existing schema or enter another name",
        newNameAssistance:"New schema Signal Shop pageview will be created",
        reviewBeforeBack:"pageview on 127.0.0.1 requires page_type to be product_list or homepage. page_type matches expected String. Rule attachment path: page_type. New schema draft Signal Shop pageview will be created and remain unavailable until publication.",
        reviewStages:[["Choose properties","complete"],["Choose schema destination","complete"],["Define requirement","complete"],["Choose event scope","complete"],["Review validation","current"]],
        retainedDestination:{ kind:"new", name:"Signal Shop pageview" },
        retainedScope:"domain-all-paths",
        advanced:{ rule:"pageview requirement", source:"event-history", target:"payload", defaults:"Severity Error; version policy Pinned." },
        saveFailure:{ flowVisible:true, review:"pageview on 127.0.0.1 requires page_type to be product_list or homepage. page_type matches expected String. Rule attachment path: page_type. New schema draft Signal Shop pageview will be created and remain unavailable until publication.", error:"Saving failed. Check storage access and try again.", unchanged:true },
        saved:{ schemas:1, reusableRules:0, published:false, pendingChanges:["Add page_type validation"], localRules:1, assignment:{ id:"assignment:schema:signal-shop-pageview:1:pageview", name:"Signal Shop pageview automatic", sourceId:"event-history", eventName:"pageview", target:"payload", priority:100, versionPolicy:"pinned", enabled:true, domainCondition:"127.0.0.1" }, flowClosed:true, inspectorRestored:true, status:"Draft Signal Shop pageview was created.", focusReturned:true, nextActions:["Add property from this event", "Review draft", "Publish revision", "Use a different schema"] },
        published:{ label:"Publish this rule for Rule Library reuse", reusableRules:1, attachedRuleId:"rule:pageview-requirement", reusableRuleId:"rule:pageview-requirement", unpublishedChoiceAbsent:true, assignableAfterPublication:true, currentRevision:1, historicalRevisions:0 },
        existingOptions:[
          { label:"Generic pageview version 1", disabled:false, explanation:"page_type will be added" },
          { label:"Product listing version 3", disabled:false, explanation:"page_type accepts String rules" },
          { label:"Numeric page types version 1", disabled:true, explanation:"page_type expects Number" },
          { label:"Raw pageview version 1", disabled:true, explanation:"schema validates raw input, not payload" },
        ],
        existingReview:"pageview on 127.0.0.1 requires page_type to be product_list or homepage. page_type matches expected String. Rule attachment path: page_type. The rule will be added to the Product listing working draft based on version 3. Product listing version 3 remains current until the working draft is published. Assignment action: reuse the matching enabled assignment.",
        existingSaved:{ versions:[3], currentRules:0, draftRules:1, pendingChanges:["Add page_type validation"], assignments:1, flowClosed:true, inspectorRestored:true, status:"Validation was added to Product listing draft.", focusReturned:true },
        schemaPrefillRequirement:{ expectedType:"String", expectedTypeSource:"String — Generic pageview version 4", target:"payload" },
        schemaPrefillScope:{ domain:"shop.example", domainSource:"Generic shop pages assignment", eventName:"pageview", eventNameSource:"Generic shop pages assignment", source:"event-history", sourceSource:"Generic shop pages assignment", pathCondition:"/products/*" },
        replacementReview:{
          items:["domain: operator.example would be replaced by 127.0.0.1", "path conditions: [{\"matchType\":\"Path pattern\",\"expression\":\"/products/*\"}] would be replaced by []"],
          actions:["Keep current values", "Accept schema-derived values"],
        },
        keptStatus:"Current values kept.",
        acceptedStatus:"Schema-derived values accepted.",
      }, "Guided validation browser flow violated its rendered production contract");
      assert.deepEqual(production, {
        requirements:{
          String:["Must be present", "Must be one of these values", "Must match a pattern", "Must have this length"],
          Number:["Must be present", "Must be one of these values", "Must be within a range"],
          Array:["Must be present", "Must contain this many items"],
          Object:["Must be present", "Allow only these properties"],
          Boolean:["Must be present", "Must equal this value"],
        },
        allowedValues:[
          { valid:false, assistance:"Add at least one allowed value" },
          { valid:false, assistance:"Remove or change the duplicate homepage" },
          { valid:false, assistance:"Enter a value or remove the blank item" },
          { valid:true, assistance:"2 allowed values" },
        ],
        paths:[
          { valid:true, matches:true },
          { valid:true, matches:false },
          { valid:true, matches:true },
          { valid:true, matches:true },
          { valid:true, matches:false },
          { valid:true, matches:true },
          { valid:true, matches:false },
        ],
        combined:{ valid:true, matches:true, matchingCondition:{ matchType:"Path pattern", expression:"/products/*" } },
        malformed:{ valid:false, matches:false, error:production.malformed.error },
        override:{ typeSource:"explicit override", currentEventPasses:false, message:"page_type was observed as String but Number is expected.", correctionRequired:true },
        destinationOptions:[
          { name:"Generic pageview", target:"payload", propertyState:"absent", available:true, explanation:"page_type will be added" },
          { name:"Product listing", target:"payload", propertyState:"String", available:true, explanation:"page_type accepts String rules" },
          { name:"Numeric page types", target:"payload", propertyState:"Number", available:false, explanation:"page_type expects Number" },
          { name:"Raw pageview", target:"raw input", propertyState:"absent", available:false, explanation:"schema validates raw input, not payload" },
        ],
        assignmentResolutions:[
          { count:0, selection:"Create a new assignment", domain:"127.0.0.1", pathConditions:[] },
          { count:1, selection:"the compatible assignment", domain:"shop.example", pathConditions:[{ matchType:"Path pattern", expression:"/products/*" }] },
          { count:2, selection:"required from readable assignment choices", domain:"127.0.0.1", pathConditions:[] },
        ],
        destinations:{
          matching:{ review:"pageview on 127.0.0.1 requires page_type to be product_list or homepage. page_type matches expected String. Rule attachment path: page_type. The rule will be added to the Product listing working draft based on version 3. Product listing version 3 remains current until the working draft is published. Assignment action: reuse the matching enabled assignment.", assignmentAction:"reuse the matching enabled assignment" },
          absent:{ review:"pageview on 127.0.0.1 requires page_type to be product_list or homepage. page_type matches expected String. Rule attachment path: page_type. The rule will be added to the Product listing working draft based on version 3. Product listing version 3 remains current until the working draft is published. Assignment action: add the reviewed assignment as a pending change.", assignmentAction:"add the reviewed assignment as a pending change" },
        },
      }, "Guided validation production matchers violated their browser-loaded contract");
      await evaluate(socket, `(() => { localStorage.clear(); for (const [key, value] of Object.entries(${JSON.stringify(previousGuidedStorage)})) localStorage.setItem(key, value); return true; })()`);
      await reloadPanel(socket);
      liveValidationVisualsObservation = await evaluate(socket, liveValidationVisualsRuntime);
      assert.deepEqual(Object.fromEntries(Object.entries(liveValidationVisualsObservation.rows).map(([id, row]) => [id, [row.text, row.symbol, row.treatment, row.name.includes(row.text.replace(/^·\s*/, "")), row.border !== "rgb(217, 222, 229)"]])), {
        valid:["· Valid","check","pass",true,true], warning:["· 2 warnings","warning","warning",true,true], error:["· 2 errors and 1 warning","error","error",true,true], neutral:["· Not checked","neutral","neutral",true,true], assignment:["· Assignment error","error","assignment-error",true,true],
      }, "Live validation feed badges did not expose text, symbols, treatments, and accessible state");
      assert.equal(liveValidationVisualsObservation.inspector.summary, "Validation failed, 2 errors, and 1 warning", "Live inspector omitted error and warning counts");
      assert.equal(liveValidationVisualsObservation.inspector.schema, "Checkout schema version 4", "Live inspector omitted exact schema version");
      assert.equal(liveValidationVisualsObservation.inspector.rawJson, "Raw JSON", "Live inspector omitted Raw JSON disclosure");
      assert.ok(["Show validation issues","Revalidate"].every((label) => liveValidationVisualsObservation.inspector.actions.includes(label)), "Live inspector omitted validation actions");
      assert.equal(liveValidationVisualsObservation.inspector.changeSchema, "Change schema", "Live inspector omitted Change schema");
      assert.ok(liveValidationVisualsObservation.inspector.presentation.indexOf("live-event-validation-issues") < liveValidationVisualsObservation.inspector.presentation.indexOf("Properties"), "Event-level issues were not displayed above Properties");
      assert.deepEqual({
        pagePath:liveValidationVisualsObservation.properties.page_path,
        currency:liveValidationVisualsObservation.properties.currency,
        pageTitle:liveValidationVisualsObservation.properties.page_title,
        pageType:liveValidationVisualsObservation.properties.page_type,
        commerce:liveValidationVisualsObservation.properties.commerce,
        sibling:liveValidationVisualsObservation.properties.sibling,
        missing:liveValidationVisualsObservation.properties.order_id,
        escaped:liveValidationVisualsObservation.escaped,
        disclosures:liveValidationVisualsObservation.disclosures,
        unchanged:liveValidationVisualsObservation.unchanged,
        revalidation:liveValidationVisualsObservation.revalidation,
      }, {
        pagePath:{ status:"○ No rules", treatment:"neutral", evaluations:0, aggregate:null, missing:null },
        currency:{ status:"✓ 2 rules passed", treatment:"pass", evaluations:2, aggregate:null, missing:null },
        pageTitle:{ status:"⚠ 1 warning", treatment:"warning", evaluations:2, aggregate:null, missing:null },
        pageType:{ status:"! 1 error and 1 warning", treatment:"error", evaluations:3, aggregate:null, missing:null },
        commerce:{ status:"○ No rules", treatment:"neutral", evaluations:0, aggregate:"1 error and 2 warnings", missing:null },
        sibling:{ status:"○ No rules", treatment:"neutral", evaluations:0, aggregate:null, missing:null },
        missing:{ status:"! 1 error", treatment:"error", evaluations:1, aggregate:null, missing:"Missing" },
        escaped:true, disclosures:{ enter:"true", space:"true", click:"true" }, unchanged:true,
        revalidation:{ inspector:"Validation passed", feed:"· Valid", status:"Validation changed to Valid.", live:"polite", scroll:37, focused:true },
      }, "Live validation property hierarchy, interaction, or revalidation contract failed");
    }
    assert.deepEqual(await evaluate(socket, openLibraryRuntime), {
      selected:"true",
      panelHidden:false,
    }, `Library tab did not open through its ${width}px rendered control`);
    assert.deepEqual(await evaluate(socket, naturalLibraryActionsRuntime), {
      editorHidden:true,
      editorDisplay:"none",
      editorOffsetParent:true,
      actions:[
        { id:"add-new-event", visible:true, disabled:false },
        { id:"import-event-library", visible:true, disabled:false },
        { id:"export-event-library", visible:true, disabled:true },
        { id:"clear-event-library", visible:true, disabled:true },
      ],
      saveLatestPresent:false,
    }, `natural Library action surface violated its ${width}px browser contract`);
    assert.deepEqual(await evaluate(socket, libraryActionsRecoveryRuntime), {
      purchase:{
        initial:{
          editor:true,
          fields:[
            { selector:"#event-template-name", value:"", visible:true },
            { selector:"#event-template-event-name", value:"", visible:true },
            { selector:"#event-template-source", value:"", visible:true },
            { selector:"#push-destination-path", value:"", visible:true },
            { selector:"#event-template-json", value:"{}", visible:true },
          ],
          saveDisabled:true,
          focused:true,
        },
        saveEnabled:true,
      },
      closeResult:{ hidden:true, display:"none", offsetParent:true, editFocused:true },
      inlineIdentity:{ noRename:false, editor:true, fields:[false, false], values:["Purchase confirmation", "purchase"], disclosuresClosed:true },
      pushReview:{
        hidden:false, display:"block", positiveGeometry:true, hiddenAncestor:false, focused:true,
        details:[["Event","checkout_completed"],["Target title","Signal Shop"],["Target URL","https://signal.example.test/checkout"],["Destination","queue.history"],["Version","1"],["Validation","Not checked"],["Template name","Purchase confirmation → Completed checkout"],["Event name","purchase → checkout_completed"],["Destination","event.history → queue.history"]],
        changes:[[["Path","ecommerce.value"],["Previous","18"],["Pushed","19"]],[["Path","items[0].quantity"],["Previous","1"],["Pushed","2"]],[["Path","legacy.debug"],["Previous","true"],["Pushed","Not present"]],[["Path","experiment.variant"],["Previous","Not present"],["Pushed","treatment-b"]]],
        confirm:"Push checkout_completed to the active target",
      },
      pushCancelled:{ focused:true, result:"" },
      revisionReview:{
        hidden:false, display:"block", positiveGeometry:true, hiddenAncestor:false, focused:true,
        details:[["Operation","Save revision"],["Current version","1"],["Resulting version","2"],["Validation","Not checked"],["Template name","Purchase confirmation → Completed checkout"],["Event name","purchase → checkout_completed"],["Destination","event.history → queue.history"]],
        changes:[[["Path","ecommerce.value"],["Previous","18"],["Revised","19"],["Change","changed"]],[["Path","items[0].quantity"],["Previous","1"],["Revised","2"],["Change","changed"]],[["Path","legacy.debug"],["Previous","true"],["Revised","Not present"],["Change","removed"]],[["Path","experiment.variant"],["Previous","Not present"],["Revised","treatment-b"],["Change","added"]]],
        confirm:"Save revision 2",
      },
      revisionCancel:{ hidden:true, draft:["Completed checkout", "checkout_completed", "queue.history"], focused:true },
      revisionSaved:{ identity:"Completed checkout · checkout_completed", result:"Saved version 2; identity, execution, and payload changes applied." },
      scroll:{
        initial:{
          editor:true,
          fields:[
            { selector:"#event-template-name", value:"", visible:true },
            { selector:"#event-template-event-name", value:"", visible:true },
            { selector:"#event-template-source", value:"", visible:true },
            { selector:"#push-destination-path", value:"", visible:true },
            { selector:"#event-template-json", value:"{}", visible:true },
          ],
          saveDisabled:true,
          focused:true,
        },
        saveEnabled:true,
      },
      exportResult:{
        templateNames:["Completed checkout", "Scroll milestone"],
        revisions:[1, 2],
        payloads:[{ ecommerce:{ value:19 }, items:[{ quantity:2 }], experiment:{ variant:"treatment-b" } }, { scroll_percentage:25 }],
        settings:["queue.history", "event.history"],
      },
      clearReview:{ hidden:false, display:"block", positiveGeometry:true, hiddenAncestor:false, focused:true, summary:"All 2 templates and their saved revisions will be removed." },
      cleared:{ count:0, addAvailable:true, importAvailable:true },
      importReview:{ hidden:false, display:"block", positiveGeometry:true, hiddenAncestor:false, focused:true, replaceVisible:true, appendVisible:true },
      replaceArmed:"Confirm replace 0 with 2",
      restored:{ names:["Completed checkout", "Scroll milestone"], persisted:["Completed checkout", "Scroll milestone"] },
      deleteReview:{ hidden:false, display:"block", positiveGeometry:true, hiddenAncestor:false, focused:true, summary:"Completed checkout; event checkout_completed; 2 saved versions will be deleted. Captured events, saved sessions, and execution records remain unchanged." },
      afterDelete:["Scroll milestone · scroll"],
      final:{ count:0, persisted:0, addAvailable:true, importAvailable:true },
    }, `natural Library actions failed their ${width}px browser recovery contract`);
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
    assert.deepEqual(await evaluate(socket, templateChangeReviewRuntime), {
      renameAction:false,
      renameDialog:false,
      editable:[false, false],
      review:{ label:"Revised", version:4, identity:[["Template name", "Purchase confirmation", "Completed checkout"], ["Event name", "purchase", "checkout_completed"]], noPayload:true },
    }, `inline template change review violated its ${width}px browser contract`);
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
        validationDetail:"Validation details/commerce/order/id · Required value · expected string, received missing · rule schema · severity error · Order confirmation v2 · #/properties/commerce · assignment id assignment:checkout · name Checkout confirmation · source event-history · event page_view · target payload · priority 100 · domain shop.example · pathname /order-confirmation · policy follow latest · enabled",
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
    const schemaWorkspaceRuntime = await evaluate(socket, schemaAssignmentRuntime);
    assert.deepEqual(schemaWorkspaceRuntime, {
      fields:[
        { selector:"#schema-assignment-source", required:false },
        { selector:"#schema-assignment-event", required:false },
        { selector:"#schema-assignment-target", required:false },
        { selector:"#schema-assignment-domain", required:false },
        { selector:"#schema-assignment-pathname", required:false },
        { selector:"#schema-assignment-priority", required:false },
        { selector:"#schema-assignment-schema", required:false },
        { selector:"#schema-assignment-version-policy", required:false },
        { selector:"#schema-assignment-enabled", required:false },
      ],
      schemaMasterVisible:true,
      actions:["Edit", "Duplicate", "Disable", "Delete"],
      duplicateCount:3,
      revisionReview:{ open:false, summary:"Checkout schema working draft will be compared with current revision 1; confirmation publishes revision 2.", status:"Current revision 2 · no working draft" },
      closeReview:{ open:false, summary:"", result:"Working draft retained without publishing." },
      rows:["Checkout schema automatic · event-history/page_view · payload · anyany · priority 120 · pinned · disabled · Checkout schema", "Checkout schema automatic · event-history/page_view · raw input · shop.example/order-confirmation · priority 100 · follow latest · enabled · Checkout schema"],
      assignment:{ sourceId:"event-history", eventName:"page_view", target:"payload", id:"assignment:schema:checkout-schema:1:page_view", name:"Checkout schema automatic", priority:120, versionPolicy:"pinned", enabled:false, pathnameCondition:null },
      propertyRule:{ menuOpen:true, returnFocus:true, stateReturnFocus:true, summary:"View attached rules (1)", actions:["Disable", "Remove"], reenable:"Re-enable", revisionReview:{ open:true, summary:"Known page types v1 will become Known page types v2; parameters product,checkout → product,checkout,confirmation; examples product, checkout → product, checkout." }, ruleExportName:"known-page-types-v2.json" },
      storedPropertyRule:{ attached:true, version:1, enabled:true, propertyPath:"example" },
      rule:{ initialSeverity:"warning", name:"Known page types", version:2, enabled:true, operator:"allowed-values", parameters:"product,checkout,confirmation", severity:"error", message:"Use a known page type", examples:"product, checkout", attachments:[] },
    }, `Schema rule persistence and assignment editor fields failed their ${width}px browser contract`);
    let schemaSourceCreation;
    let schemaInheritance;
    let schemaLibraryTransfer;
    let schemaReload;
    let schemaLiveValidation;
    if (width === 720 && runExtendedSchemaWorkspaceRuntime) {
      schemaSourceCreation = await evaluate(socket, schemaSourceCreationRuntime);
      assert.deepEqual(schemaSourceCreation, {
        schemaView:true,
        editor:true,
        name:"Order complete schema",
        paths:["page_type", "page_name", "commerce", "commerce.order", "commerce.order.id"],
        assignment:"payload",
        draftRefresh:{ unchanged:true, message:"Library draft validation: Valid · Checkout schema v2." },
        persistedAttachment:"schema:checkout-schema:1",
      }, "Library Create schema did not invoke the production source callback");
      schemaInheritance = await evaluate(socket, schemaInheritanceRuntime);
      assert.deepEqual(schemaInheritance, schemaLibraryExportFixture === "1:3" ? {
        groups:[
          { state:"active-inherited", text:"Active inherited (1)Known page types v1 · example · Checkout schema v2" },
          { state:"disabled-inherited", text:"Disabled inherited (0)No disabled inherited rules." },
          { state:"explicitly-reenabled", text:"Explicitly re-enabled (0)No explicitly re-enabled inherited rules." },
          { state:"local", text:"Local (0)No local rules." },
        ],
        preview:["example · Known page types v1 · inherited from Checkout schema v2"],
      } : {
        groups:[
          { state:"active-inherited", text:"Active inherited (2)Known page types v1 · example · Checkout schema v2Known channels v1 · root · Checkout schema v2" },
          { state:"disabled-inherited", text:"Disabled inherited (0)No disabled inherited rules." },
          { state:"explicitly-reenabled", text:"Explicitly re-enabled (0)No explicitly re-enabled inherited rules." },
          { state:"local", text:"Local (0)No local rules." },
        ],
        preview:["example · Known page types v1 · inherited from Checkout schema v2", "root · Known channels v1 · inherited from Checkout schema v2"],
      }, "Schema inheritance groups and effective-rule preview did not render");
      schemaLibraryTransfer = await evaluate(socket, schemaLibraryTransferRuntime);
      assert.equal(schemaLibraryTransfer.downloadName, "schema-library-v1.json", "Schema Library export did not create the download");
      assert.equal(schemaLibraryTransfer.content.version, 1, "Schema Library export used an unsupported format");
      assert.deepEqual(schemaLibraryTransfer.content.schemas, schemaLibraryTransfer.before.schemas, "Schema Library export omitted a schema identity");
      assert.deepEqual(schemaLibraryTransfer.content.rules, schemaLibraryTransfer.before.rules, "Schema Library export omitted a reusable-rule identity");
      assert.equal(schemaLibraryTransfer.result, "Schema Library replaced.", "Schema Library replacement did not complete");
      assert.equal(schemaLibraryTransfer.review, false, "Schema Library replacement review remained open");
      assert.deepEqual(schemaLibraryTransfer.actions, ["Replace Schema Library", "Append to Schema Library", "Cancel"], "Schema Library replacement actions changed");
      assert.deepEqual(schemaLibraryTransfer.reloaded, schemaLibraryTransfer.before, "Schema Library replacement did not retain exported identities");
      await reloadPanel(socket);
      schemaReload = await evaluate(socket, `(() => {
        document.querySelector("#data-layer-view-schemas").click();
        return { stored:JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1") ?? "[]").length, rendered:document.querySelectorAll("#schema-list li").length, storedRules:JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1") ?? "[]").length };
      })()`);
      assert.deepEqual(schemaReload, { stored:schemaLibraryTransfer.before.schemas.length, rendered:schemaLibraryTransfer.before.schemas.length, storedRules:schemaLibraryTransfer.before.rules.length }, "Schema Library did not survive a browser reload");
      schemaLiveValidation = await evaluate(socket, schemaLiveValidationRuntime);
      if (schemaLibraryExportFixture === "1:3") {
        assert.match(schemaLiveValidation.validation, /Not checked|Valid|warnings|issues/, "Live Validate did not render a state for the smaller export fixture");
      } else {
        assert.equal(schemaLiveValidation.validation, "1 warnings", "Live Validate did not render the inherited warning state");
        assert.match(schemaLiveValidation.detail, /Choose a known channel.*Known channels v1.*severity warning.*Checkout schema v2/, "Live Validate did not render inherited warning provenance");
        assert.equal(schemaLiveValidation.filtered.length, 1, "Warnings filter did not retain the rendered warning event");
      }
      assert.ok(schemaLiveValidation.queryFields.includes("Validation state"), "Live query builder did not expose validation state");
    }
    if (process.env.SCHEMA_WORKSPACE_BROWSER_ADAPTER === "1") {
      schemaWorkspaceAdapterObservations.push({
        fixture:schemaLibraryExportFixture,
        mounted:schemaWorkspaceRuntime.schemaMasterVisible,
        rules:schemaWorkspaceRuntime.propertyRule,
        assignment:schemaWorkspaceRuntime.assignment,
        sourceCreation:schemaSourceCreation,
        inheritance:schemaInheritance,
        transfer:schemaLibraryTransfer,
        reload:schemaReload,
        validation:schemaLiveValidation,
        ruleEditorVisibility:schemaRuleEditorVisibility,
      });
    }
    if (width === 720 && runGuidedDraftContinuationRuntime) {
      const installContinuationFixture = (selectedSchemaId) => evaluate(socket, `(() => {
        const assignment = { id:"assignment:product", name:"Product pages", schemaId:"schema-product-listing", sourceId:"event-history", eventName:"pageview", target:"payload", domainCondition:"127.0.0.1", pathConditions:[{ matchType:"Exact path", expression:"/" }], enabled:true };
        const product = { id:"schema-product-listing", name:"Product listing", version:3, published:true, document:{ type:"object", properties:{ page_type:{ type:"string" } } }, assignments:[assignment], workingDraft:{ baseVersion:3, sourceVersion:3, document:{ type:"object", properties:{ page_type:{ type:"string" }, page_name:{ type:"string" } } }, assignments:[assignment], pendingChanges:["Add page_type", "Add page_name"] } };
        const checkout = { id:"schema-checkout", name:"Checkout", version:2, published:false, document:{ type:"object", properties:{ checkout_id:{ type:"string" } } }, assignments:[], workingDraft:{ baseVersion:2, sourceVersion:2, document:{ type:"object", properties:{ checkout_id:{ type:"string" }, page_name:{ type:"string" } } }, assignments:[], pendingChanges:["Add page_name"] } };
        localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([product, checkout]));
        localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", "[]");
        localStorage.removeItem("my-chrome-utilities.guided-validation-continuations.v1");
        if (${JSON.stringify(selectedSchemaId)}) {
          const selections = { ["event-history" + String.fromCharCode(0) + "pageview"]:${JSON.stringify(selectedSchemaId)} };
          localStorage.setItem("my-chrome-utilities.guided-validation-continuations.v1", JSON.stringify(selections));
        }
        return true;
      })()`);
      await installContinuationFixture(undefined);
      await reloadPanel(socket);
      guidedDraftContinuationInitialObservation = await evaluate(socket, guidedDraftContinuationInitialRuntime);
      assert.deepEqual(guidedDraftContinuationInitialObservation, { createAvailable:true, continuationAbsent:true }, "Events without a selected draft continuation lost their generic creation action");
      await installContinuationFixture("schema-product-listing");
      await reloadPanel(socket);
      guidedDraftContinuationObservation = await evaluate(socket, guidedDraftContinuationRuntime);
      assert.deepEqual(guidedDraftContinuationObservation, {
        initial:{ heading:"Product listing working draft", status:"Current revision 3 · 2 pending changes", actions:["Add property from this event", "Review draft", "Publish revision", "Use a different schema"], sectionCount:1, genericAbsent:true },
        opened:{ context:"Adding to Product listing draft", stages:["Choose properties", "Define requirement", "Choose event scope", "Review validation"] },
        requirement:{ heading:"Define requirement", destinationAbsent:true, selectedSchema:"schema-product-listing" },
        prefill:{ target:"payload", targetSource:"Product listing version 3", source:"event-history", sourceSource:"Product pages assignment", domain:"127.0.0.1", domainSource:"Product pages assignment", eventName:"pageview", eventSource:"Product pages assignment", path:"/", pathSource:"Product pages assignment", editable:true },
        review:{ name:"Product listing", status:"Working draft based on revision 3 · 2 pending changes", checkoutUnchanged:true },
        publication:{ review:"Product listing working draft will be compared with current revision 3; confirmation publishes revision 4.", productCurrent:3, checkoutUnchanged:true },
        switchOpen:{ heading:"Choose schema destination", choices:["Product listing revision 3 · 2 pending changes", "Checkout revision 2 · 1 pending changes"], productUnchanged:true },
        afterCancel:{ context:"Product listing working draft", productUnchanged:true },
        afterSwitch:{ context:"Checkout working draft", sectionCount:1, unnamedAbsent:true, productUnchanged:true },
        assignmentResolution:{ none:"Create a new assignment", multiple:"required from readable assignment choices" },
      }, "Guided draft continuation violated its browser interaction contract");
      const continuationSchemas = await evaluate(socket, `localStorage.getItem("my-chrome-utilities.schema-library.v1")`);
      const continuationSelection = await evaluate(socket, `localStorage.getItem("my-chrome-utilities.guided-validation-continuations.v1")`);
      await evaluate(socket, `(() => { localStorage.setItem("my-chrome-utilities.schema-library.v1", ${JSON.stringify(continuationSchemas)}); localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", "[]"); localStorage.setItem("my-chrome-utilities.guided-validation-continuations.v1", ${JSON.stringify(continuationSelection)}); return true; })()`);
      await reloadPanel(socket);
      guidedDraftContinuationReloadObservation = await evaluate(socket, guidedDraftContinuationReloadRuntime);
      assert.deepEqual(guidedDraftContinuationReloadObservation, { context:"Checkout working draft", heading:"Define requirement", destinationAbsent:true, expectedTypeSource:"String — Checkout version 2" }, "Guided draft continuation did not survive reload");
    }
    if (width === 720 && runSchemaRevisionLifecycleRuntime) {
      await evaluate(socket, `(() => {
        const assignment = { id:"assignment:product", name:"Product pages", schemaId:"schema-product-listing", schemaVersion:3, sourceId:"history", eventName:"pageview", target:"payload", versionPolicy:"pinned", enabled:true };
        const revision = (version) => ({ id:"schema-product-listing", name:"Product listing", version, published:true, document:{ type:"object", properties:{ ["revision_" + version]:{ type:"string" } } }, assignments:[assignment] });
        const current = {
          ...revision(4),
          revisionHistory:[revision(1), revision(2), revision(3)],
          workingDraft:{ baseVersion:4, sourceVersion:4, document:{ type:"object", properties:{ draft_field:{ type:"string" } } }, assignments:[assignment], pendingChanges:["Add draft_a", "Add draft_b", "Add draft_c"] },
        };
        const checkout = { id:"schema:checkout:1", name:"Checkout", version:1, published:false, document:{ type:"object" }, assignments:[], workingDraft:{ baseVersion:0, sourceVersion:0, document:{ type:"object", properties:{ checkout_id:{ type:"string" } } }, assignments:[], pendingChanges:["Add checkout_id"] } };
        localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([current, checkout]));
        localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", "[]");
        return true;
      })()`);
      await reloadPanel(socket);
      schemaRevisionLifecycleUiObservation = await evaluate(socket, schemaRevisionLifecycleUiRuntime);
      assert.deepEqual(schemaRevisionLifecycleUiObservation, {
        history:{
          options:["Revision 3", "Revision 2", "Revision 1"],
          comparison:"Revision 2 compared with current revision 4. 1 historical properties; 1 current properties.",
          actions:["Duplicate from revision", "Restore this revision"],
          separateRows:0,
          assignmentChoices:["Product listing version 4"],
          openedWithoutMutation:true,
          status:"Working draft based on revision 4 · 3 pending changes",
        },
        duplication:{ name:"Product listing revision 2 copy", published:false, version:1, assignments:0, sourceUnchanged:4, assignableChoices:["Product listing version 4"] },
        restoration:{
          review:"Product listing revision 2 will replace 3 pending draft changes and create a working draft. Current revision 4 remains active; publication will create revision 5.",
          cancel:{ dialogClosed:true, draftUnchanged:true, current:4 },
          confirmed:{ current:4, source:2, pending:["Restore revision 2"] },
        },
        publication:{ review:"Product listing working draft will be compared with current revision 4; confirmation publishes revision 5.", current:5, history:[1,2,3,4], draftCleared:true },
      }, "Schema revision lifecycle UI callbacks violated their browser contract");
      schemaRevisionLifecycleObservation = await evaluate(socket, schemaRevisionLifecycleRuntime);
      assert.deepEqual(schemaRevisionLifecycleObservation, {
        workingDraft:{ identity:"schema-product-listing", current:3, base:3, source:3, twoPending:["Add page_type rule", "Add page_name rule"], pending:["Add page_type rule", "Add page_name rule", "Add Checkout assignment"], properties:["product_id", "page_type", "page_name"], durable:true, currentProperties:["product_id"], activeCheckout:false, sameIdentity:true },
        publication:{ identity:"schema-product-listing", current:4, history:[3], draftCleared:true, properties:["product_id", "page_type", "page_name"], checkoutRevision:4, choices:["Product listing"] },
        policies:{ pinned:3, latest:4, recorded:[3,4] },
        history:{ choices:[3], selected:3, duplicate:{ name:"Product listing revision 3 copy", published:false, assignable:0 }, restored:{ current:4, source:3, pending:["Restore revision 3"], discardCurrent:4 } },
        migration:{ count:1, identity:"schema-product-listing", current:4, history:[3,2,1], assignments:[{ schemaId:"schema-product-listing", schemaVersion:3, versionPolicy:"pinned" }, { schemaId:"schema-product-listing", schemaVersion:null, versionPolicy:"follow latest" }] },
      }, "Schema revision lifecycle violated its browser storage and resolution contract");
    }
    socket.close();
  }
  if (process.env.SCHEMA_WORKSPACE_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaWorkspace:schemaWorkspaceAdapterObservations.at(-1) }));
  }
  if (process.env.GUIDED_VALIDATION_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ guidedValidation:guidedValidationObservation, guidedSchemaPicker:guidedSchemaPickerObservation }));
  }
  if (process.env.LIVE_VALIDATION_VISUALS_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ liveValidationVisuals:liveValidationVisualsObservation }));
  }
  if (process.env.SINGLE_LIVE_EVENT_FEED_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ singleLiveEventFeed:singleLiveEventFeedObservation }));
  }
  if (process.env.SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaViewContainment:schemaViewContainmentObservation }));
  }
  if (process.env.PAYLOAD_PATH_FILTER_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ payloadPathFilterPicker:payloadPathFilterPickerObservation }));
  }
  if (process.env.REPRODUCTION_STEP_ACTION_ROWS_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ reproductionStepActionRows:reproductionStepActionRowsObservations }));
  }
  if (process.env.SCHEMA_REVISION_LIFECYCLE_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaRevisionLifecycle:{ ...schemaRevisionLifecycleObservation, ui:schemaRevisionLifecycleUiObservation, completionActions:(guidedValidationObservation?.saved?.nextActions ?? []).filter((label) => label !== "Use a different schema") } }));
  }
  if (process.env.GUIDED_DRAFT_CONTINUATION_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ guidedDraftContinuation:{ initial:guidedDraftContinuationInitialObservation, interaction:guidedDraftContinuationObservation, reload:guidedDraftContinuationReloadObservation } }));
  }
  if (process.env.SCHEMA_PROPERTY_RULE_PICKER_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaPropertyRulePicker:schemaPropertyRulePickerObservation }));
  }
  if (process.env.SCHEMA_MANUAL_PROPERTY_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaManualProperty:schemaManualPropertyObservation }));
  }
  if (process.env.SCHEMA_NESTED_PATH_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaNestedPath:schemaNestedPathObservation }));
  }
  if (process.env.SAVED_SESSION_LIVE_FEED_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ savedSessionLiveFeed:{ initial:savedSessionLiveFeedObservation, reload:savedSessionLiveFeedReloadObservation } }));
  }
  if (process.env.WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ workspacePanelContainment:workspacePanelContainmentObservation }));
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
