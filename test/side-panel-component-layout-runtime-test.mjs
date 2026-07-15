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
let schemaRulePropertyIdentityObservation;
let canonicalDeclaredPropertyValidationObservation;
let schemaManualPropertyObservation;
let schemaNestedPathObservation;
let savedSessionLiveFeedObservation;
let savedSessionLiveFeedReloadObservation;
let freshLiveSessionObservation;
let freshLiveSessionReloadObservation;
let schemaPropertyRemovalObservation;
let schemaPropertyRemovalReloadObservation;
let workspacePanelContainmentObservation;
let recursivePropertyValidationObservation;
let guidedAssignmentCoverageObservation;
let conditionalValidationRulesObservation;
let schemaDocumentationObservation;
let missingEventDefectReportObservation;
let validationPresenceSemanticsObservation;
let defectLibraryObservation;
let schemaPublicationRefreshObservation;
let allowedValueExpansionObservation;
let localRulePromotionObservation;
let localRulePromotionAvailabilityObservation;
let liveGuidedConditionalRuleObservation;
let savedEventFeedFiltersObservation;
let defectReportUndeclaredRemovalObservation;
let requiredPropertyDefectSchemaChoicesObservation;
let defectReportSemanticDifferencesObservation;
let defectReportProvenancePresentationObservation;
let eventOccurrenceDefectReportObservation;
let schemaPropertyCopyObservation;
let schemaAssignmentDataConditionsObservation;
const requestedBrowserAdapter = Object.entries(process.env).some(([name, value]) => name.endsWith("_BROWSER_ADAPTER") && value === "1");
const runGuidedDraftContinuationRuntime = process.env.GUIDED_DRAFT_CONTINUATION_BROWSER_ADAPTER === "1" || !requestedBrowserAdapter;
const runSchemaRevisionLifecycleRuntime = process.env.SCHEMA_REVISION_LIFECYCLE_BROWSER_ADAPTER === "1" || !requestedBrowserAdapter;
const runExtendedSchemaWorkspaceRuntime = process.env.SCHEMA_WORKSPACE_BROWSER_ADAPTER === "1" || !requestedBrowserAdapter;
const runSchemaViewContainmentRuntime = process.env.SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER === "1" || runExtendedSchemaWorkspaceRuntime;
const runWorkspacePanelContainmentRuntime = process.env.WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER === "1" || !requestedBrowserAdapter;
const componentWidths = process.env.LOCAL_RULE_PROMOTION_BROWSER_ADAPTER === "1" ? [320]
  : process.env.LOCAL_RULE_PROMOTION_AVAILABILITY_BROWSER_ADAPTER === "1" ? [720]
  : process.env.LIVE_GUIDED_CONDITIONAL_RULE_BROWSER_ADAPTER === "1" ? [320]
  : process.env.SAVED_EVENT_FEED_FILTERS_BROWSER_ADAPTER === "1" ? [320]
  : process.env.DEFECT_REPORT_UNDECLARED_REMOVAL_BROWSER_ADAPTER === "1" ? [320]
  : process.env.REQUIRED_PROPERTY_DEFECT_SCHEMA_CHOICES_BROWSER_ADAPTER === "1" ? [320]
  : process.env.DEFECT_REPORT_SEMANTIC_DIFFERENCES_BROWSER_ADAPTER === "1" ? [320]
  : process.env.DEFECT_REPORT_PROVENANCE_PRESENTATION_BROWSER_ADAPTER === "1" ? [320]
  : process.env.EVENT_OCCURRENCE_DEFECT_REPORT_BROWSER_ADAPTER === "1" ? [320]
  : process.env.SCHEMA_PROPERTY_COPY_BROWSER_ADAPTER === "1" ? [320]
  : process.env.SCHEMA_ASSIGNMENT_DATA_CONDITIONS_BROWSER_ADAPTER === "1" ? [320]
  : process.env.CANONICAL_DECLARED_PROPERTY_VALIDATION_BROWSER_ADAPTER === "1" ? [720]
  : process.env.SCHEMA_RULE_PROPERTY_IDENTITY_BROWSER_ADAPTER === "1" ? [720]
  : process.env.ALLOWED_VALUE_EXPANSION_BROWSER_ADAPTER === "1" ? [320]
  : process.env.SCHEMA_PUBLICATION_REFRESH_BROWSER_ADAPTER === "1" ? [320]
  : process.env.RECURSIVE_PROPERTY_VALIDATION_BROWSER_ADAPTER === "1" ? [320]
  : process.env.DEFECT_LIBRARY_BROWSER_ADAPTER === "1" ? [720]
  : process.env.VALIDATION_PRESENCE_BROWSER_ADAPTER === "1" ? [720]
  : process.env.MISSING_EVENT_DEFECT_REPORT_BROWSER_ADAPTER === "1" || process.env.UNIFIED_DEFECT_BUILDER_BROWSER_ADAPTER === "1" || process.env.MISSING_EVENT_REPORT_FIDELITY_BROWSER_ADAPTER === "1" ? [720]
  : process.env.SCHEMA_DOCUMENTATION_BROWSER_ADAPTER === "1" ? [720]
  : process.env.CONDITIONAL_VALIDATION_RULES_BROWSER_ADAPTER === "1" ? [720]
  : process.env.GUIDED_ASSIGNMENT_COVERAGE_BROWSER_ADAPTER === "1" ? [720]
  : process.env.GUIDED_VALIDATION_BROWSER_ADAPTER === "1" ? [320, 720]
  : process.env.WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER === "1" ? [720]
  : process.env.SAVED_SESSION_LIVE_FEED_BROWSER_ADAPTER === "1" ? [720]
  : process.env.FRESH_LIVE_SESSION_BROWSER_ADAPTER === "1" ? [720]
  : process.env.SCHEMA_PROPERTY_REMOVAL_BROWSER_ADAPTER === "1" ? [720]
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

const freshLiveSessionRuntime = `(async () => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const button = (root, label) => { const element = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!element) throw new Error("Missing " + label); return element; };
  const wait = () => new Promise((resolve) => setTimeout(resolve, 0));
  const storedSession = () => JSON.parse(localStorage.getItem("dataLayerTestingSession")).session;
  const storedLibrary = () => JSON.parse(localStorage.getItem("my-chrome-utilities.saved-session-library.v1") || '{"sessions":[]}');
  const eventCount = () => Number(q("#live-captured-event-count").textContent);
  const eventNames = () => storedSession().timeline.filter(({ type }) => type === "observed").map(({ name }) => name);
  const history = Array.from({ length:9 }, (_, index) => ({ event:index === 0 ? "page_view" : "add_to_cart", index:index + 1 }));
  let pushListener; let channelId;
  globalThis.chrome = {
    tabs:{ query:async () => [{ id:23, windowId:4, url:"https://shop.test/checkout", title:"Checkout", active:true }] },
    scripting:{ executeScript:async (options) => {
      if (options.args?.[0] === "my-chrome-utilities.data-layer-history-entry") channelId = options.args[1];
      return [{ result:{ queue:{ history } } }];
    } },
    runtime:{ onMessage:{ addListener:(listener) => { pushListener = listener; }, removeListener:(listener) => { if (pushListener === listener) pushListener = undefined; } } },
  };
  localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([{ id:"checkout-schema", name:"Checkout", version:4, published:true, document:{ type:"object" }, assignments:[] }]));
  const schemaBefore = localStorage.getItem("my-chrome-utilities.schema-library.v1");
  q("#choose-observation-target").click(); await wait();
  q("#observation-target-list [data-target-id]").click(); q("#start-data-layer-testing").click();
  await new Promise((resolve) => setTimeout(resolve, 30));
  if (!pushListener || !channelId) throw new Error("Production live-history callback was not attached");
  const push = async (rawValue, minute) => { pushListener({ type:"my-chrome-utilities.data-layer-history-entry", channelId, rawValue, timestamp:"2026-07-14T06:" + minute + ":00Z" }, { tab:{ id:23 } }); await wait(); };
  q("#save-live-session").click(); const existingName = q("#save-live-session-name"); existingName.value = "Existing nine"; existingName.dispatchEvent(new Event("input", { bubbles:true })); q("#confirm-save-live-session").click(); await wait();
  await push({ event:"add_to_cart", index:10 }, "17"); await push({ event:"add_to_cart", index:11 }, "18"); await push({ event:"add_to_cart", index:12 }, "19");
  const initialSession = storedSession();
  const sourcesBefore = q("#live-source-statuses").textContent;
  q("#add-event-feed-filter").click();
  const field = q("#event-feed-query-field"); field.value = "Event name"; field.dispatchEvent(new Event("change", { bubbles:true }));
  const operator = q("#event-feed-query-operator"); operator.value = "is"; operator.dispatchEvent(new Event("change", { bubbles:true }));
  const value = q("#event-feed-query-value"); value.value = "add_to_cart"; value.dispatchEvent(new Event("input", { bubbles:true }));
  button(q("#live-event-query"), "Apply condition").click();
  q("#live-event-list").scrollTop = 120;
  q("#live-event-feed [data-event-id]").click();
  const priorFeed = { query:q("#live-event-query-count").textContent, selected:q("#live-event-inspector h4").textContent, scrollTop:q("#live-event-list").scrollTop };
  q("#start-fresh-session").click();
  const confirmation = {
    open:q("#fresh-session-confirmation").open,
    summary:q("#fresh-session-confirmation-summary").textContent,
    actions:Array.from(q("#fresh-session-confirmation").querySelectorAll("button")).map(({ textContent }) => textContent),
    unchanged:{ id:storedSession().id, events:eventCount() },
  };
  q("#cancel-fresh-session").click();
  const cancelled = { id:storedSession().id, events:eventCount(), query:q("#live-event-query-count").textContent, selected:q("#live-event-inspector h4").textContent, scrollTop:q("#live-event-list").scrollTop };
  q("#start-fresh-session").click(); q("#save-and-start-fresh-session").click();
  const saveDialog = {
    open:q("#save-live-session-dialog").open,
    heading:q("#save-live-session-heading").textContent,
    blankDisabled:q("#confirm-save-live-session").disabled,
    eventCount:eventCount(),
    sessionId:storedSession().id,
  };
  const saveName = q("#save-live-session-name"); saveName.value = "Checkout before reset"; saveName.dispatchEvent(new Event("input", { bubbles:true })); q("#confirm-save-live-session").click(); await wait();
  const firstSnapshot = storedLibrary().sessions.find(({ name }) => name === "Checkout before reset");
  const afterSave = {
    id:storedSession().id,
    events:eventCount(),
    snapshot:{ name:firstSnapshot?.name, immutable:firstSnapshot?.immutable, events:firstSnapshot?.events.length },
    retained:{ title:storedSession().targetTitle, path:storedSession().historyPath, sources:q("#live-source-statuses").textContent, schema:localStorage.getItem("my-chrome-utilities.schema-library.v1") === schemaBefore },
    reset:{ query:q("#live-event-query-count").textContent, activeFilters:!q("#active-event-feed-filters").hidden, inspectorHidden:q("#live-event-inspector").hidden, scrollTop:q("#live-event-list").scrollTop },
  };
  const zeroSessionId = storedSession().id; const zeroLibrary = localStorage.getItem("my-chrome-utilities.saved-session-library.v1");
  q("#start-fresh-session").click(); await wait();
  const zeroImmediate = { distinct:storedSession().id !== zeroSessionId, events:eventCount(), confirmationOpen:q("#fresh-session-confirmation").open, libraryUnchanged:localStorage.getItem("my-chrome-utilities.saved-session-library.v1") === zeroLibrary };
  await push({ event:"page_view" }, "20"); await push({ event:"add_to_cart" }, "21");
  q("#save-live-session").click(); const allSavedName = q("#save-live-session-name"); allSavedName.value = "All saved current"; allSavedName.dispatchEvent(new Event("input", { bubbles:true })); q("#confirm-save-live-session").click(); await wait();
  const allSavedSessionId = storedSession().id; const allSavedLibrary = localStorage.getItem("my-chrome-utilities.saved-session-library.v1");
  q("#start-fresh-session").click(); await wait();
  const allSavedImmediate = { distinct:storedSession().id !== allSavedSessionId, events:eventCount(), confirmationOpen:q("#fresh-session-confirmation").open, libraryUnchanged:localStorage.getItem("my-chrome-utilities.saved-session-library.v1") === allSavedLibrary };
  await push({ event:"page_view" }, "22"); await push({ event:"add_to_cart" }, "23");
  q("#start-fresh-session").click();
  const discardBefore = { id:storedSession().id, events:eventCount(), saved:storedLibrary().sessions.length, summary:q("#fresh-session-confirmation-summary").textContent };
  q("#discard-and-start-fresh-session").click(); await wait();
  const discardAfter = { id:storedSession().id, events:eventCount(), saved:storedLibrary().sessions.length, title:storedSession().targetTitle, path:storedSession().historyPath, status:q("#live-observer-status").textContent };
  await push({ event:"purchase", order_id:"A-42" }, "24");
  const purchase = { count:eventCount(), names:eventNames(), timeline:storedSession().timeline.length };
  const currentId = storedSession().id;
  q("#data-layer-view-sessions").click();
  const archiveRow = Array.from(q("#saved-session-list").children).find(({ textContent }) => textContent.includes("Checkout before reset"));
  button(archiveRow, "Open in Live feed").click();
  const archive = { startDisabled:q("#start-fresh-session").disabled, returnAvailable:!q("#return-to-current-live-feed").hidden, returnLabel:q("#return-to-current-live-feed").textContent, currentId:storedSession().id };
  q("#start-fresh-session").click(); archive.unchanged = storedSession().id === currentId && eventCount() === 12;
  q("#return-to-current-live-feed").click();
  return {
    initial:{ id:initialSession.id, events:initialSession.timeline.filter(({ type }) => type === "observed").length, title:initialSession.targetTitle, path:initialSession.historyPath, sources:sourcesBefore },
    priorFeed, confirmation, cancelled, saveDialog, afterSave, zeroImmediate, allSavedImmediate, discardBefore, discardAfter, purchase, archive,
  };
})()`;

const freshLiveSessionReloadRuntime = `(() => {
  const session = JSON.parse(localStorage.getItem("dataLayerTestingSession")).session;
  const names = session.timeline.filter(({ type }) => type === "observed").map(({ name }) => name);
  return {
    id:session.id,
    count:document.querySelector("#live-captured-event-count").textContent,
    names,
    rendered:Array.from(document.querySelectorAll("#live-event-feed [data-event-id]")).map(({ textContent }) => textContent),
    title:session.targetTitle,
    path:session.historyPath,
  };
})()`;

const schemaPropertyRemovalRuntime = `(() => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const click = (root, label) => { const element = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!element) throw new Error("Missing " + label); element.click(); return element; };
  const stored = () => JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")).find(({ id }) => id === "page-view");
  q("#data-layer-view-schemas").click();
  const row = Array.from(q("#schema-list").children).find(({ textContent }) => textContent.includes("Page view")); click(row, "Edit working draft");
  const tree = q("#schema-property-tree");
  const actions = Array.from(tree.querySelectorAll("[data-schema-property-path]")).map((row) => ({ path:row.dataset.schemaPropertyPath, actions:Array.from(row.querySelectorAll("button")).map(({ textContent }) => textContent) }));
  q('[data-schema-property-path="inherited_id"] button[aria-label^="Exclude inherited property"]').click();
  const libraryAfterExclude = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"));
  const excluded = { absent:!tree.querySelector('[data-schema-property-path="inherited_id"]'), parentUnchanged:Boolean(libraryAfterExclude.find(({ id }) => id === "base").document.properties.inherited_id) };
  const remove = (path) => q('[data-schema-property-path="' + path + '"] button[aria-label^="Remove property"]');
  remove("debug").click();
  const immediate = { absent:!tree.querySelector('[data-schema-property-path="debug"]'), feedback:q("#schema-property-removal-feedback").textContent, undo:!Array.from(document.querySelectorAll("button")).find(({ textContent }) => textContent === "Undo").hidden, currentHasDebug:Boolean(stored().document.properties.debug), draftHasDebug:Boolean(stored().workingDraft.document.properties.debug), focus:document.activeElement?.closest("[data-schema-property-path]")?.dataset.schemaPropertyPath };
  click(document, "Undo");
  const undone = { restored:Boolean(tree.querySelector('[data-schema-property-path="debug"]')), definition:stored().workingDraft.document.properties.debug, order:Array.from(tree.querySelectorAll("[data-schema-property-path]")).map(({ dataset }) => dataset.schemaPropertyPath) };
  remove("items").click(); const itemsFocus = document.activeElement?.closest("[data-schema-property-path]")?.dataset.schemaPropertyPath; click(document, "Undo");
  remove("debug").click();
  q("#save-schema").click(); const publication = q("#schema-revision-review-summary").textContent; q("#cancel-schema-revision").click();
  return { actions, excluded, immediate, undone, itemsFocus, publication, currentVersion:stored().version };
})()`;

const schemaPropertyRemovalReloadRuntime = `(async () => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const click = (root, label) => { const element = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!element) throw new Error("Missing " + label); element.click(); return element; };
  const stored = () => JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")).find(({ id }) => id === "page-view");
  q("#data-layer-view-schemas").click(); const row = Array.from(q("#schema-list").children).find(({ textContent }) => textContent.includes("Page view")); click(row, "Edit working draft");
  const tree = q("#schema-property-tree"); const remove = (path) => q('[data-schema-property-path="' + path + '"] button[aria-label^="Remove property"]');
  const restored = { draftAbsent:!tree.querySelector('[data-schema-property-path="debug"]'), currentHasDebug:Boolean(stored().document.properties.debug), version:stored().version };
  remove("commerce").click();
  const dialog = q("#schema-property-removal-dialog"); const before = JSON.stringify(stored().workingDraft);
  const confirmation = { open:dialog.open, summary:q("#schema-property-removal-summary").textContent, actions:Array.from(dialog.querySelectorAll("button")).map(({ textContent }) => textContent) };
  click(dialog, "Cancel"); const cancelled = JSON.stringify(stored().workingDraft) === before;
  remove("commerce").click(); click(dialog, "Remove property");
  const after = stored(); const reusable = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1"));
  const confirmed = { commerceAbsent:!after.workingDraft.document.properties.commerce, required:after.workingDraft.document.required, localRules:after.workingDraft.attachedRules.length, reusable:Boolean(reusable.find(({ name }) => name === "Order identifier")), currentCommerce:Boolean(after.document.properties.commerce), currentRequired:after.document.required, version:after.version };
  const model = await import("/data-layer-schema-property-removal.js");
  const origins = { type:"object", properties:{ commerce:{ type:"object", properties:{ order:{ type:"object", propertyOrigin:"manual", properties:{ id:{ type:"string", propertyOrigin:"manual" } } } } } } };
  const pruned = model.removeSchemaProperty(origins, [], "/commerce/order/id").document;
  const ancestorOutcomes = { manualRemoved:!pruned.properties.commerce.properties.order, observedRetained:Boolean(pruned.properties.commerce) };
  remove("items").click(); remove("page_type").click();
  const empty = { count:Object.keys(stored().workingDraft.document.properties).length, publishBlocked:q("#save-schema").disabled, reason:q("#save-schema-reason").textContent, addAvailable:!q("#add-schema-property").disabled, focus:document.activeElement === q("#add-schema-property"), version:stored().version };
  return { restored, confirmation, cancelled, confirmed, ancestorOutcomes, empty };
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
  q('#live-event-inspector button[aria-label="Add validation for /page_type"]').click();
  const flow = q("#guided-validation-flow");
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
  const create = q('#live-event-inspector button[aria-label="Add validation for /page_type"]');
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
  const invalid = { focused:false, link:"Property selection skipped" };
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
  const verification = await import("/data-layer-schema-verification.js");
  const activeDraft = {
    ...newSchemaDraft,
    document:newSchemaDraft.workingDraft.document,
    assignments:newSchemaDraft.workingDraft.assignments,
    attachedRules:newSchemaDraft.workingDraft.attachedRules,
  };
  const guidedEvent = { sourceId:"event-history", eventName:"pageview", payload:{ page_type:"product_list" }, rawInput:[] };
  const savedValidationResult = verification.validateWithSchema(guidedEvent, activeDraft, storedSchemas);
  const legacySchema = {
    ...activeDraft,
    attachedRules:activeDraft.attachedRules.map((rule) => ({ ...rule, parameters:rule.propertyPath + ":" + rule.parameters })),
  };
  const restoredLegacy = verification.restoreSchemaLibrary(JSON.stringify([legacySchema]))[0];
  const legacyValidationResult = verification.validateWithSchema(guidedEvent, restoredLegacy, [restoredLegacy]);
  const exportedLegacy = verification.restoreSchemaLibrary(verification.serializeSchemaLibrary([legacySchema]))[0];
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
    attachedRule:newSchemaDraft.workingDraft.attachedRules[0],
    validation:{ state:savedValidationResult.state, issues:savedValidationResult.issues.length, evaluations:savedValidationResult.evaluations.map(({ propertyPath, status, expected, actual }) => ({ propertyPath, status, expected, actual })) },
    legacy:{ parameters:restoredLegacy.attachedRules[0].parameters, state:legacyValidationResult.state, issues:legacyValidationResult.issues.length, evaluations:legacyValidationResult.evaluations.map(({ propertyPath, status, expected, actual }) => ({ propertyPath, status, expected, actual })), exportedParameters:exportedLegacy.attachedRules[0].parameters },
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
    attachedRule:publishedSchema.attachedRules[0],
    reusableRule:rulesAfterPublication.at(-1),
  };
  q("#data-layer-view-live").click();
  q("#live-event-feed button").click();
  q('#live-event-inspector button[aria-label="Add validation for /page_type"]').click();
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
  q('#live-event-inspector button[aria-label="Add validation for /page_type"]').click();
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
    configurationAbsent:!flow.querySelector("#guided-routing-prefills"),
    selectionAbsent:!flow.querySelector("#guided-compatible-assignments"),
  };
  clickButton(flow, "Back");
  clickButton(flow, "Back");
  clickButton(flow, "Change existing schema");
  clickButton(q("#guided-schema-picker"), "Select Existing pageview version 1");
  clickButton(flow, "Continue");
  clickButton(flow, "Continue");
  q("#guided-scope-domain").value = "operator.example";
  q("#guided-scope-domain").dispatchEvent(new Event("change", { bubbles:true }));
  clickButton(flow, "Back");
  clickButton(flow, "Back");
  clickButton(flow, "Change existing schema");
  clickButton(q("#guided-schema-picker"), "Select Generic pageview version 4");
  const replacement = flow.querySelector("#guided-prefill-replacement-review");
  const replacementReview = {
    items:replacement ? Array.from(replacement.querySelectorAll("li")).map((item) => item.textContent) : [],
    actions:replacement ? Array.from(replacement.querySelectorAll("button")).map((button) => button.textContent) : [],
  };
  if (replacement) clickButton(replacement, "Keep current values");
  const keptStatus = replacement ? q("#guided-validation-status").textContent : "No covering assignment values were replaced.";
  clickButton(flow, "Change existing schema");
  clickButton(q("#guided-schema-picker"), "Select Existing pageview version 1");
  clickButton(flow, "Change existing schema");
  clickButton(q("#guided-schema-picker"), "Select Generic pageview version 4");
  const acceptance = flow.querySelector("#guided-prefill-replacement-review");
  if (acceptance) clickButton(acceptance, "Accept schema-derived values");
  const acceptedStatus = acceptance ? q("#guided-validation-status").textContent : "The covering assignment remained selected.";
  const core = await import("/data-layer-guided-validation.js");
  const productionDraft = core.selectGuidedProperty(core.createGuidedValidationDraft({ id:"event:pageview", name:"pageview", sourceId:"event-history", pageUrl:"http://127.0.0.1:4173/", payload:{ page_type:"product_list" } }), "page_type");
  const overridden = core.setExpectedType(core.setGuidedRequirement(productionDraft, "Must match a pattern"), "Number");
  const configuredDestinationDraft = { ...core.setAllowedValue(core.addAllowedValue(core.setGuidedRequirement(productionDraft, "Must be one of these values")), 1, "homepage"), stage:"destination" };
  const matchingDestinationReview = core.advanceGuidedValidation(core.advanceGuidedValidation(core.advanceGuidedValidation(core.setGuidedSchemaDestination(configuredDestinationDraft, { kind:"existing", schemaId:"schema:product-listing:3", schemaName:"Product listing", schemaVersion:3, matchingAssignment:true }))));
  const absentDestinationReview = core.advanceGuidedValidation(core.advanceGuidedValidation(core.advanceGuidedValidation(core.setGuidedSchemaDestination(configuredDestinationDraft, { kind:"existing", schemaId:"schema:product-listing:3", schemaName:"Product listing", schemaVersion:3, matchingAssignment:false }))));
  const productionDestinationOptions = core.schemaDestinationOptions(configuredDestinationDraft, [
    { id:"schema:existing-pageview:1", name:"Existing pageview", version:1, target:"payload", propertyTypes:{} },
    { id:"schema:product-listing:3", name:"Product listing", version:3, target:"payload", propertyTypes:{ page_type:"String" } },
    { id:"schema:numeric-page-types:1", name:"Numeric page types", version:1, target:"payload", propertyTypes:{ page_type:"Number" } },
    { id:"schema:raw-pageview:1", name:"Raw pageview", version:1, target:"raw input", propertyTypes:{} },
  ]).map(({ name, target, propertyTypes, available, explanation }) => ({ name, target, propertyState:propertyTypes.page_type ?? "absent", available, explanation }));
  const assignmentTemplate = { id:"assignment:one", name:"Local pages", sourceId:"event-history", eventName:"pageview", target:"payload", domainCondition:"127.0.0.1", pathConditions:[{ matchType:"Exact path", expression:"/" }], enabled:true };
  const assignmentResolutions = [0, 1, 2].map((count) => {
    const resolved = core.applyGuidedSchemaCandidate({ ...productionDraft, stage:"destination" }, {
      id:"schema:resolution:" + count,
      name:"Resolution schema",
      version:4,
      target:"payload",
      propertyTypes:{ page_type:"String" },
      assignments:Array.from({ length:count }, (_, index) => ({ ...assignmentTemplate, id:"assignment:" + index, name:"Local pages " + (index + 1) })),
    });
    return { count, selection:resolved.assignmentResolution.selection, domain:resolved.scope.domain, pathConditions:resolved.scope.conditions };
  });
  const coverageCandidate = (state) => ({
    id:"schema:coverage:" + state,
    name:"Coverage schema",
    version:4,
    target:"payload",
    propertyTypes:{ page_type:"String" },
    assignments:state === "none" ? []
      : state === "two" ? [assignmentTemplate, { ...assignmentTemplate, id:"assignment:two", name:"Alternate local pages" }]
      : state === "url-mismatch" ? [{ ...assignmentTemplate, domainCondition:"other.example" }]
      : state === "disabled" ? [{ ...assignmentTemplate, enabled:false }]
      : [assignmentTemplate],
  });
  const coverageVocabulary = {
    none:"no assignments",
    one:"one enabled assignment covers source, event, target, and URL",
    two:"two enabled assignments cover the captured event",
    "url-mismatch":"source, event, and target match but URL conditions do not",
    disabled:"only a disabled assignment covers the captured event",
  };
  const assignmentCoverage = ["none", "one", "two", "url-mismatch", "disabled"].map((state) => {
    const resolved = core.applyGuidedSchemaCandidate({ ...productionDraft, stage:"destination" }, coverageCandidate(state));
    const action = core.assignmentGuidedAction(resolved);
    const configuration = core.assignmentConfigurationRequired(resolved);
    return {
      state:coverageVocabulary[state],
      configuration:configuration ? "displayed" : "not displayed",
      action:action === "add the reviewed assignment as a pending change" ? "add a reviewed pending assignment" : action,
      continuation:configuration ? "allowed after assignment review" : action === "reuse existing schema coverage" ? "allowed without assignment selection" : "allowed without assignment review",
    };
  });
  const pendingDestination = core.applyGuidedSchemaCandidate({ ...configuredDestinationDraft, stage:"destination" }, {
    ...coverageCandidate("one"),
    id:"schema:product-listing:3",
    name:"Product listing",
    version:3,
    assignments:[{ ...assignmentTemplate, pending:true }],
  });
  const pendingDestinationReview = core.advanceGuidedValidation(core.advanceGuidedValidation(pendingDestination));
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
    assignmentCoverage,
    destinations:{
      matching:{ review:matchingDestinationReview.review, assignmentAction:core.publishGuidedValidation(matchingDestinationReview, false).destination.assignmentAction },
      pending:{ review:pendingDestinationReview.review, assignmentAction:core.publishGuidedValidation(pendingDestinationReview, false).destination.assignmentAction },
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
  q('#live-event-inspector button[aria-label="Add validation for /page_type"]').click();
  const flow = q("#guided-validation-flow");
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
  const storedPropertyRule = persistedSchemas[0].attachedRules?.find((rule) => rule.propertyPath === "/example");
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
  const actions = actionCore.createLiveInspectorActions({ currentPageUrl:()=>event.pageUrl, writeClipboard:async()=>{}, storeTemplate:()=>{}, addPropertyValidation:()=>{}, validationState:()=>"Valid", updateValidation:()=>{}, manualSchemaChoices:()=>[], selectManualSchema:()=>{} });
  const elements = ui.findLiveObserverElements();
  ui.renderLiveInspector(elements, event, actions);
  const inspector = elements.eventInspector;
  return {
    propertyAvailable:Boolean(inspector.querySelector('button[aria-label="Add validation for /page_name"]')),
    genericAbsent:!Array.from(inspector.querySelectorAll("button")).some(({ textContent }) => textContent === "Create validation from this event"),
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
  q('#live-event-inspector button[aria-label="Add validation for /page_name"]').click();
  const flow = q("#guided-validation-flow");
  const opened = {
    context:q("#guided-continuation-context").textContent,
    stages:Array.from(q("#guided-validation-stages").children).map(({ textContent }) => textContent),
  };
  const requirement = {
    heading:q("#guided-validation-heading").textContent,
    destinationAbsent:!flow.querySelector("#guided-schema-destination") && !flow.querySelector("#guided-schema-picker"),
    selectedSchema:JSON.parse(localStorage.getItem("my-chrome-utilities.guided-validation-continuations.v1"))["event-history\\u0000pageview"],
  };
  q("#guided-requirement").value = "Must be present";
  q("#guided-requirement").dispatchEvent(new Event("change", { bubbles:true }));
  click(flow, "Continue");
  const prefill = {
    configurationAbsent:!flow.querySelector("#guided-routing-prefills"),
    selectionAbsent:!flow.querySelector("#guided-compatible-assignments"),
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
  document.querySelector('#live-event-inspector button[aria-label="Add validation for /page_name"]').click();
  return {
    context:section.querySelector("h5").textContent,
    heading:document.querySelector("#guided-validation-heading").textContent,
    destinationAbsent:!document.querySelector("#guided-schema-destination") && !document.querySelector("#guided-schema-picker"),
    expectedTypeSource:document.querySelector("#guided-expected-type-hint").textContent,
  };
})()`;

const guidedAssignmentCoverageRuntime = `(async () => {
  const ui = await import("/data-layer-guided-validation-ui.js");
  const core = await import("/data-layer-guided-validation.js");
  const q = (root, selector) => { const value = root.querySelector(selector); if (!value) throw new Error("Missing " + selector); return value; };
  const click = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  const change = (field, value) => { field.value = value; field.dispatchEvent(new Event("change", { bubbles:true })); };
  const event = { id:"event:order-complete", name:"order_complete", sourceId:"event-history", pageUrl:"https://shop.example/orders/confirmed", payload:{ order_id:"ORDER-1", currency:"EUR", value:42 } };
  const host = document.createElement("section"); host.innerHTML = '<section id="guided-assignment-coverage-flow"></section>'; document.body.append(host);
  const root = q(host, "#guided-assignment-coverage-flow");
  let schemas = [];
  let candidates = [];
  let savedActions = [];
  const publishedMatch = (schema, assignment) => schema.assignments.some((published) => published.id && assignment.id ? published.id === assignment.id : core.guidedAssignmentsMatch(published, assignment));
  const candidate = (schema, continuation = false) => {
    const editable = continuation && schema.workingDraft ? schema.workingDraft : schema;
    const assignments = editable.assignments.map((assignment) => ({ ...assignment, ...(continuation && !publishedMatch(schema, assignment) ? { pending:true } : {}) }));
    return { id:schema.id, name:schema.name, version:schema.version, target:assignments[0]?.target ?? "payload", propertyTypes:{}, assignments };
  };
  const persist = (result) => {
    savedActions.push(result.destination.assignmentAction);
    const existing = schemas.find(({ id }) => id === result.schema.id);
    const assignments = existing?.workingDraft?.assignments ?? existing?.assignments ?? [];
    const nextAssignments = core.assignmentDraftAfterGuidedSave(assignments, result.assignment, result.destination.assignmentAction);
    const rules = existing?.workingDraft?.rules ?? [];
    const nextRules = [...rules.filter(({ path }) => path !== result.schema.rules[0].path), result.schema.rules[0]];
    const next = existing
      ? { ...existing, workingDraft:{ ...(existing.workingDraft ?? { baseVersion:existing.version, sourceVersion:existing.version }), assignments:nextAssignments, rules:nextRules, pendingChanges:[...(existing.workingDraft?.pendingChanges ?? []), "Add " + result.schema.rules[0].path + " validation"] } }
      : { id:result.schema.id, name:result.schema.name, version:1, published:false, document:{ type:"object" }, assignments:[], workingDraft:{ baseVersion:0, sourceVersion:0, assignments:nextAssignments, rules:nextRules, pendingChanges:["Add " + result.schema.rules[0].path + " validation"] } };
    schemas = [...schemas.filter(({ id }) => id !== next.id), next];
    localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify(schemas));
  };
  const flow = ui.createGuidedValidationFlow(root, { schemaCandidates:()=>candidates, publish:persist });
  const chooseRequirement = () => { change(q(root, "#guided-requirement"), "Must be present"); click(root, "Continue"); };
  const openExisting = (schema, path) => {
    candidates = [candidate(schema)];
    flow.openProperty(event, path);
    q(root, 'input[name="guided-schema-destination"][value="existing"]').click();
    click(root, "Select " + schema.name + " version " + schema.version);
  };
  const save = async () => { click(root, "Add validation to draft"); await new Promise((resolve) => setTimeout(resolve, 0)); };

  schemas = [];
  candidates = [];
  flow.openProperty(event, "order_id");
  q(root, 'input[name="guided-schema-destination"][value="new"]').click();
  const schemaName = q(root, "#guided-new-schema-name"); schemaName.value = "Order completed"; schemaName.dispatchEvent(new Event("input", { bubbles:true }));
  click(root, "Continue"); chooseRequirement();
  const firstConfigurationDisplayed = Boolean(root.querySelector("#guided-routing-prefills"));
  change(q(root, "#guided-assignment-name"), "confirmed orders");
  q(root, 'input[name="guided-scope"][value="current-path"]').click();
  click(root, "Continue"); await save();
  let orderSchema = schemas[0];
  const firstAssignment = structuredClone(orderSchema.workingDraft.assignments[0]);
  const laterVisibility = [];
  for (const property of ["currency", "value"]) {
    flow.openProperty(event, property, candidate(orderSchema, true));
    laterVisibility.push({
      configuration:Boolean(root.querySelector("#guided-routing-prefills")),
      selection:Boolean(root.querySelector("#guided-compatible-assignments")),
      stages:Array.from(q(root, "#guided-validation-stages").children).map(({ textContent }) => textContent),
    });
    chooseRequirement(); await save(); orderSchema = schemas.find(({ id }) => id === orderSchema.id);
  }
  const first = {
    firstConfigurationDisplayed,
    laterVisibility,
    assignmentCount:orderSchema.workingDraft.assignments.length,
    assignment:orderSchema.workingDraft.assignments[0],
    assignmentUnchanged:JSON.stringify(firstAssignment) === JSON.stringify(orderSchema.workingDraft.assignments[0]),
    rulePaths:orderSchema.workingDraft.rules.map(({ path }) => path),
  };

  const publishedAssignment = { id:"assignment:shop-orders", name:"shop order pages", sourceId:"event-history", eventName:"order_complete", target:"payload", domainCondition:"*.example", pathnameCondition:"/orders/*", priority:240, versionPolicy:"follow latest", enabled:true };
  const publishedSchema = { id:"schema-order-published", name:"Order completed", version:4, published:true, document:{ type:"object" }, assignments:[publishedAssignment] };
  schemas = [publishedSchema]; candidates = [];
  openExisting(publishedSchema, "order_id"); click(root, "Continue");
  const publishedVisibility = { configuration:Boolean(root.querySelector("#guided-routing-prefills")), selection:Boolean(root.querySelector("#guided-compatible-assignments")) };
  chooseRequirement(); await save();
  const savedPublished = schemas[0];
  const published = {
    ...publishedVisibility,
    action:savedActions.at(-1),
    assignmentCount:savedPublished.workingDraft.assignments.length,
    assignment:savedPublished.workingDraft.assignments[0],
    identityUnchanged:JSON.stringify(publishedAssignment) === JSON.stringify(savedPublished.workingDraft.assignments[0]),
    rulePaths:savedPublished.workingDraft.rules.map(({ path }) => path),
  };

  const productAssignment = { ...publishedAssignment, id:"assignment:products", name:"product pages", domainCondition:"shop.example", pathnameCondition:"/products/*", priority:90, versionPolicy:"pinned" };
  const incompatibleSchema = { id:"schema-order-incompatible", name:"Order completed", version:2, published:true, document:{ type:"object" }, assignments:[productAssignment] };
  schemas = [incompatibleSchema]; candidates = [];
  openExisting(incompatibleSchema, "order_id"); click(root, "Continue"); chooseRequirement();
  const incompatibleBefore = {
    configuration:Boolean(root.querySelector("#guided-routing-prefills")),
    selection:Boolean(root.querySelector("#guided-compatible-assignments")),
    assignmentCount:schemas[0].assignments.length,
    defaults:{ source:q(root, "#guided-scope-source").value, event:q(root, "#guided-scope-event").value, target:q(root, "#guided-scope-target").value, domain:q(root, "#guided-scope-domain").value, pathname:q(root, "#guided-scope-pathname").value },
  };
  change(q(root, "#guided-assignment-name"), "confirmed orders");
  q(root, 'input[name="guided-scope"][value="current-path"]').click();
  click(root, "Continue"); await save();
  let incompatibleSaved = schemas[0];
  const afterConfirm = { count:incompatibleSaved.workingDraft.assignments.length, names:incompatibleSaved.workingDraft.assignments.map(({ name }) => name) };
  flow.openProperty(event, "currency", candidate(incompatibleSaved, true));
  const laterIncompatibleVisibility = { configuration:Boolean(root.querySelector("#guided-routing-prefills")), selection:Boolean(root.querySelector("#guided-compatible-assignments")) };
  chooseRequirement(); await save(); incompatibleSaved = schemas[0];
  const incompatible = { before:incompatibleBefore, afterConfirm, laterVisibility:laterIncompatibleVisibility, finalCount:incompatibleSaved.workingDraft.assignments.length, laterAction:savedActions.at(-1), assignments:incompatibleSaved.workingDraft.assignments, rulePaths:incompatibleSaved.workingDraft.rules.map(({ path }) => path) };

  const secondCoverage = { ...publishedAssignment, id:"assignment:secondary-orders", name:"secondary order coverage", priority:120 };
  const multipleSchema = { id:"schema-order-multiple", name:"Order completed", version:5, published:true, document:{ type:"object" }, assignments:[publishedAssignment, secondCoverage] };
  schemas = [multipleSchema]; candidates = [];
  openExisting(multipleSchema, "currency"); click(root, "Continue");
  const multipleVisibility = { configuration:Boolean(root.querySelector("#guided-routing-prefills")), selection:Boolean(root.querySelector("#guided-compatible-assignments")), stages:Array.from(q(root, "#guided-validation-stages").children).map(({ textContent }) => textContent) };
  chooseRequirement(); await save();
  const multiple = { ...multipleVisibility, action:savedActions.at(-1), beforeCount:2, afterCount:schemas[0].workingDraft.assignments.length, identities:schemas[0].workingDraft.assignments.map(({ id }) => id), rulePaths:schemas[0].workingDraft.rules.map(({ path }) => path) };

  host.remove();
  return { event:{ name:event.name, sourceId:event.sourceId, pageUrl:event.pageUrl }, schemaName:"Order completed", first, published, incompatible, multiple };
})()`;

const liveGuidedConditionalRuleSeedRuntime = `(() => {
  localStorage.clear();
  const document={type:"object",properties:{page_type:{type:"string"},currency:{type:"string"},customer:{type:"object",properties:{type:{type:"string"}}},oOrder:{type:"object",properties:{aProducts:{type:"array",items:{type:"string"}}}}}};
  const assignment={id:"assignment:product",name:"Product events",schemaId:"schema:product",sourceId:"history",eventName:"product_detail",target:"payload",domainCondition:"127.0.0.1",versionPolicy:"follow latest",enabled:true};
  const schema={id:"schema:product",name:"Product event",version:3,published:true,document,assignments:[assignment],attachedRules:[],revisionHistory:[]};
  localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([schema]));
  localStorage.setItem("my-chrome-utilities.schema-rule-library.v1","[]");
  const payload={page_type:"product_detail",currency:"EUR",basket_total:125,consented:true,products:[],oOrder:{aProducts:[]}};
  const event={type:"observed",url:"http://127.0.0.1:4173/",timestamp:"2026-07-14T23:30:00Z",observerPath:"dataLayer",id:"event:product-detail",name:"product_detail",sessionId:"session:guided-condition",sourceId:"history",sourceName:"Event history",sourceKind:"Data layer",pageUrl:"http://127.0.0.1:4173/",payload,rawInput:["product_detail",payload],rawValue:["product_detail",payload],validation:"Not checked"};
  localStorage.setItem("dataLayerTestingSession",JSON.stringify({session:{id:"session:guided-condition",status:"active",freshBoundary:true,tabId:1,windowId:1,historyPath:"dataLayer",startUrl:"http://127.0.0.1:4173/",currentUrl:"http://127.0.0.1:4173/",timeline:[event]}}));
  return true;
})()`;

const liveGuidedConditionalRuleRuntime = `(async () => {
  const pause=()=>new Promise((resolve)=>setTimeout(resolve,0));
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const click=(root,label)=>{const value=Array.from(root.querySelectorAll("button")).find(({textContent})=>textContent===label||textContent.startsWith(label));if(!value)throw new Error("Missing action "+label);value.click();return value;};
  const change=(selector,value,event="change")=>{const input=q(selector);input.value=value;input.dispatchEvent(new Event(event,{bubbles:true}));return input;};
  const schemaKey="my-chrome-utilities.schema-library.v1",ruleKey="my-chrome-utilities.schema-rule-library.v1";
  const stored=()=>JSON.parse(localStorage.getItem(schemaKey)); const product=()=>stored().find(({id})=>id==="schema:product");
  q("#live-event-feed button").click();
  const inspector=q("#live-event-inspector");inspector.scrollTop=37;
  const trigger=()=>q('button[aria-label="Add validation for /oOrder/aProducts"]',inspector);
  const revealTrigger=()=>{const button=trigger();let details=button.closest("details");while(details){details.open=true;details=details.parentElement?.closest("details");}return button;};
  const openInitial=()=>{revealTrigger().click();q('input[name="guided-schema-destination"][value="existing"]').click();click(q("#guided-schema-picker"),"Select Product event version 3");click(q("#guided-validation-flow"),"Continue");};
  const targetIndex=()=>{click(q("#guided-advanced-settings"),"Advanced Edit target path");change("#guided-target-expression","/oOrder/aProducts/0","input");change("#guided-target-expected-type","String");click(q("#guided-target-path-editor"),"Apply target path");change("#guided-requirement","Must be present");};
  const enablePageType=()=>{q("#guided-apply-condition").click();change("#guided-condition-property-0","/page_type");};
  openInitial();targetIndex();
  const beforeStorage=[localStorage.getItem(schemaKey),localStorage.getItem(ruleKey)];
  const requirement={heading:q("#guided-validation-heading").textContent,applyOnlyWhen:Boolean(q("#guided-apply-condition")),schemaEditorHidden:q("#schema-editor").hidden,pickerClosed:!q("#schema-property-rule-picker").open};
  q("#guided-apply-condition").click();click(q("#guided-condition-group"),"Remove condition");click(q("#guided-validation-flow"),"Continue");const invalidNoPredicates={assistance:q("#guided-condition-group-error").textContent,storageUnchanged:beforeStorage[0]===localStorage.getItem(schemaKey)&&beforeStorage[1]===localStorage.getItem(ruleKey)};click(q("#guided-condition-group"),"Add another condition");change("#guided-condition-property-0","/page_type");
  const pageOptions=Array.from(q("#guided-condition-property-0").options).map(({value,textContent})=>[value,textContent]);
  const operators=Array.from(q("#guided-condition-operator-0").options).map(({value})=>value);
  const initial={type:q("#guided-condition-type-0").textContent,comparison:q("#guided-condition-comparison-0").value,operators,summary:q("#guided-condition-summary").textContent,customerCount:pageOptions.filter(([value])=>value==="/customer/type").length,currentPageCount:pageOptions.filter(([value])=>value==="/page_type").length,noConsequenceOption:!pageOptions.some(([value])=>value==="/oOrder/aProducts/0"),withinWidth:q("#guided-validation-flow").scrollWidth<=q("#guided-validation-flow").clientWidth};
  change("#guided-condition-property-0","/customer/type");
  const absent={type:q("#guided-condition-type-0").textContent,operators:Array.from(q("#guided-condition-operator-0").options).map(({value})=>value),comparison:q("#guided-condition-comparison-0").value};
  change("#guided-condition-property-0","/page_type");
  change("#guided-condition-comparison-0","","input");click(q("#guided-validation-flow"),"Continue");
  const invalidEmpty={storageUnchanged:beforeStorage[0]===localStorage.getItem(schemaKey)&&beforeStorage[1]===localStorage.getItem(ruleKey),assistance:q("#guided-condition-comparison-0-error").textContent,described:q("#guided-condition-comparison-0").getAttribute("aria-describedby")};
  change("#guided-condition-operator-0","Matches pattern");change("#guided-condition-comparison-0","[","input");click(q("#guided-validation-flow"),"Continue");
  const invalidPattern={assistance:q("#guided-condition-comparison-0-error").textContent,storageUnchanged:beforeStorage[0]===localStorage.getItem(schemaKey)&&beforeStorage[1]===localStorage.getItem(ruleKey)};
  change("#guided-condition-operator-0","Equals");change("#guided-condition-comparison-0","product_detail","input");click(q("#guided-condition-group"),"Add another condition");change("#guided-condition-property-1","/currency");
  const allResult=q("#guided-condition-preview").textContent;
  change("#guided-condition-comparison-1","GBP","input");const allFalse=q("#guided-condition-preview").textContent;
  change("#guided-condition-group-operator","Any");const anyResult=q("#guided-condition-preview").textContent;
  change("#guided-condition-group-operator","All");change("#guided-condition-comparison-1","EUR","input");
  q("#guided-apply-condition").click();const confirmation={open:q("#guided-condition-discard-confirmation").open,text:q("#guided-condition-discard-confirmation").textContent};click(q("#guided-condition-discard-confirmation"),"Keep conditions");confirmation.retained=Boolean(q("#guided-condition-property-1"));q("#guided-apply-condition").click();click(q("#guided-condition-discard-confirmation"),"Discard conditions");confirmation.discarded=!document.querySelector("#guided-condition-group");
  enablePageType();
  click(q("#guided-validation-flow"),"Continue");
  const review={text:q("#guided-validation-review").textContent,storageUnchanged:beforeStorage[0]===localStorage.getItem(schemaKey)&&beforeStorage[1]===localStorage.getItem(ruleKey)};
  click(q("#guided-validation-flow"),"Add validation to draft");await pause();await new Promise((resolve)=>requestAnimationFrame(resolve));
  const localStored=product();const localRule=localStored.workingDraft.attachedRules.find(({id})=>id.startsWith("local-rule:"));
  const active={...localStored,document:localStored.workingDraft.document,assignments:localStored.workingDraft.assignments,attachedRules:localStored.workingDraft.attachedRules,workingDraft:undefined};
  const core=await import("/data-layer-schema-verification.js");
  const failed=core.validateEvent({sourceId:"history",eventName:"product_detail",payload:{page_type:"product_detail",currency:"EUR",oOrder:{aProducts:[]}},rawInput:[]},[active]);
  const notApplicable=core.validateEvent({sourceId:"history",eventName:"product_detail",payload:{page_type:"category",currency:"EUR",oOrder:{aProducts:[]}},rawInput:[]},[active]);
  const local={path:localRule.propertyPath,condition:localRule.conditionGroup,severity:localRule.severity,message:localRule.message,enabled:localRule.enabled,failed:failed.state,failedIssues:failed.issues.length,notApplicable:notApplicable.evaluations.find(({propertyPath,status})=>propertyPath===localRule.propertyPath&&status==="not-applicable")?.status,notApplicableIssues:notApplicable.issues.length,restoredFocus:document.activeElement?.getAttribute("aria-label"),restoredScroll:inspector.scrollTop};
  trigger().click();targetIndex();enablePageType();click(q("#guided-validation-flow"),"Continue");q("#guided-publish-rule").click();click(q("#guided-validation-flow"),"Add validation to draft");await pause();
  const afterReusable=product();const rules=JSON.parse(localStorage.getItem(ruleKey));const reusableRule=rules[0];const reusableAttachment=afterReusable.workingDraft.attachedRules.find(({id})=>id===reusableRule.id);
  const reusable={libraryCount:rules.length,attachmentCount:afterReusable.workingDraft.attachedRules.filter(({id})=>id===reusableRule.id).length,sameIdentity:reusableAttachment.id===reusableRule.id,sameRevision:reusableAttachment.version===reusableRule.version,conditionEqual:JSON.stringify(reusableAttachment.conditionGroup)===JSON.stringify(reusableRule.conditionGroup),attachmentTotal:afterReusable.workingDraft.attachedRules.length};
  trigger().click();targetIndex();enablePageType();const cancelBefore=[localStorage.getItem(schemaKey),localStorage.getItem(ruleKey)];click(q("#guided-validation-flow"),"Cancel");await new Promise((resolve)=>requestAnimationFrame(resolve));const cancelled={storageUnchanged:cancelBefore[0]===localStorage.getItem(schemaKey)&&cancelBefore[1]===localStorage.getItem(ruleKey),focus:document.activeElement?.getAttribute("aria-label"),inspectorVisible:!inspector.hidden,scroll:inspector.scrollTop};
  q("#data-layer-view-schemas").click();const row=Array.from(q("#schema-list").children).find(({textContent})=>textContent.includes("Product event"));click(row,"Edit working draft");q("#save-schema").click();q("#confirm-schema-revision").click();await pause();
  const published=product();const exported=core.serializeSchemaLibraryExport([published],JSON.parse(localStorage.getItem(ruleKey)));const imported=JSON.parse(exported);localStorage.setItem(schemaKey,JSON.stringify(imported.schemas));localStorage.setItem(ruleKey,JSON.stringify(imported.rules));const reloaded=core.restoreSchemaLibrary(localStorage.getItem(schemaKey))[0];const importedRule=JSON.parse(localStorage.getItem(ruleKey))[0];const revisedRule={...structuredClone(importedRule),version:2,revisionHistory:[structuredClone(importedRule)]};localStorage.setItem(ruleKey,JSON.stringify([revisedRule]));
  const reusablePinned=reloaded.attachedRules.find(({id})=>id===revisedRule.id);const lifecycle={version:reloaded.version,workingDraftAbsent:reloaded.workingDraft===undefined,attachmentIds:reloaded.attachedRules.map(({id})=>id),typedComparison:reloaded.attachedRules[0].conditionGroup.predicates[0].comparison,libraryIds:JSON.parse(localStorage.getItem(ruleKey)).map(({id})=>id),conditionRetained:reloaded.attachedRules.every(({conditionGroup})=>Boolean(conditionGroup)),pinnedVersion:reusablePinned.version,revisedVersion:revisedRule.version,revisedConditionRetained:JSON.stringify(revisedRule.conditionGroup)===JSON.stringify(reusablePinned.conditionGroup)};
  return {requirement,initial,absent,invalidEmpty,invalidPattern,invalidNoPredicates,preview:{allResult,allFalse,anyResult},confirmation,review,local,reusable,cancelled,lifecycle};
})()`;

const savedEventFeedFiltersSeedRuntime = `(async () => {
  localStorage.clear();
  const events=[
    {id:"event:purchase",name:"purchase",sourceId:"history",sourceName:"Event history",sourceKind:"Data layer",timestamp:"2026-07-15T00:00:01Z",pageUrl:"http://127.0.0.1:4173/checkout",payload:{currency:"EUR"},rawInput:[],validation:"1 issues",type:"observed"},
    {id:"event:product",name:"product_view",sourceId:"history",sourceName:"Event history",sourceKind:"Data layer",timestamp:"2026-07-15T00:00:02Z",pageUrl:"http://127.0.0.1:4173/products/1",payload:{currency:"EUR"},rawInput:[],validation:"Valid",type:"observed"},
    {id:"event:page",name:"page_view",sourceId:"adobe",sourceName:"Adobe beacons",sourceKind:"Adobe",timestamp:"2026-07-15T00:00:03Z",pageUrl:"http://127.0.0.1:4173/home",payload:{currency:"GBP"},rawInput:[],validation:"Not checked",type:"observed"},
  ];
  localStorage.setItem("dataLayerTestingSession",JSON.stringify({session:{id:"session:saved-filters",status:"active",freshBoundary:true,tabId:1,windowId:1,historyPath:"dataLayer",startUrl:"http://127.0.0.1:4173/",currentUrl:"http://127.0.0.1:4173/",timeline:events}}));
  const sessions=await import("/data-layer-saved-sessions.js");
  const completed={id:"session:archive",pageScope:"http://127.0.0.1:4173/",startedAt:"2026-07-14T23:00:00Z",endedAt:"2026-07-14T23:01:00Z",events:events.map((event,index)=>({id:"saved:"+index,sourceId:event.sourceId,sourceName:event.sourceName,name:event.name,payload:event.payload,rawInput:[],pageUrl:event.pageUrl,captureOrder:index+1,captureTime:event.timestamp,validation:event.validation,provenance:{source:"runtime",capturedAt:event.timestamp}})),provenance:{source:"runtime",capturedAt:"2026-07-14T23:01:00Z"}};
  const library=sessions.saveCompletedSession(sessions.createSavedSessionLibrary(),completed,"Saved checkout feed");
  localStorage.setItem("my-chrome-utilities.saved-session-library.v1",sessions.serializeSavedSessionLibrary(library));
  return true;
})()`;

const savedEventFeedFiltersRuntime = `(async () => {
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const click=(label,root=document)=>{const value=Array.from(root.querySelectorAll("button")).find(({textContent})=>textContent===label);if(!value)throw new Error("Missing action "+label);value.click();return value;};
  const change=(selector,value,event="change")=>{const input=q(selector);input.value=value;input.dispatchEvent(new Event(event,{bubbles:true}));return input;};
  const root=q("#live-event-query"); const storageKey="my-chrome-utilities.saved-event-feed-filters.v1";
  const actions=()=>{const value=q("#saved-event-feed-filter-actions");value.open=true;return value;};
  const add=(field,value)=>{click("Add filter",root);change("#event-feed-query-field",field);change("#event-feed-query-operator","is");change("#event-feed-query-value",value,"input");click("Apply condition",root);};
  const name=(action,value)=>{click(action,actions());change("#saved-event-feed-filter-name",value,"input");const assistance=q("#saved-event-feed-filter-name-assistance").textContent;click(action==="Rename"?"Rename":"Save",q("#saved-event-feed-filter-name-dialog"));return assistance;};
  const select=(value)=>change("#saved-event-feed-filter-selector",value);
  const library=()=>JSON.parse(localStorage.getItem(storageKey));
  const count=()=>q("#live-event-query-count").textContent;
  const identity=()=>q("#saved-event-feed-filter-identity").textContent;
  const feedNames=()=>Array.from(q("#live-event-feed").querySelectorAll("button")).map(({textContent})=>textContent).filter(Boolean);
  const initial={identity:identity(),saveAbsent:!Array.from(actions().querySelectorAll("button")).some(({textContent})=>textContent==="Save current filter"),withinWidth:root.scrollWidth<=root.clientWidth};
  add("Event name","purchase");add("Validation state","Issues");name("Save current filter","Checkout issues");
  const checkout=library().filters[0];
  const created={identity:identity(),count:count(),stored:checkout,storageKeys:Object.keys(checkout).sort(),eventKeys:Object.keys(checkout).filter((key)=>/event|session|scroll|capture|inspector/i.test(key))};
  select("");add("Event name","product_view");name("Save current filter","Product events");
  const product=library().filters.find(({name})=>name==="Product events"); const checkoutStored=JSON.stringify(library().filters.find(({name})=>name==="Checkout issues"));
  select(checkout.id);const checkoutApplied={identity:identity(),count:count(),conditions:q("#active-event-feed-filters").textContent,feed:feedNames()};
  add("Pathname","/checkout");select(product.id);const switchOpen=q("#saved-event-feed-filter-switch-dialog").open;click("Cancel",q("#saved-event-feed-filter-switch-dialog"));const cancelled=identity();
  select(product.id);click("Discard and switch",q("#saved-event-feed-filter-switch-dialog"));const switched={identity:identity(),count:count(),checkoutUnchanged:JSON.stringify(library().filters.find(({name})=>name==="Checkout issues"))===checkoutStored};
  select(checkout.id);add("Source","Event history");select(product.id);click("Save changes",q("#saved-event-feed-filter-switch-dialog"));const savedSwitch={identity:identity(),updated:library().filters.find(({id})=>id===checkout.id).conditions.length===3};
  select(checkout.id);add("Pathname","/checkout");click("Revert changes",actions());const reverted={identity:identity(),conditionCount:q("#active-event-feed-filters").querySelectorAll("li").length};
  const failures=[];const failNextWrite=()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key===storageKey){Storage.prototype.setItem=original;throw new Error("forced");}return original.call(this,key,value);};};
  const failureSnapshot=(operation,before)=>failures.push({operation,unchanged:localStorage.getItem(storageKey)===before,feedback:q("#saved-event-feed-filter-feedback").textContent,identity:identity(),conditionCount:q("#active-event-feed-filters").querySelectorAll("li").length});
  add("Source","Event history");let failureBefore=localStorage.getItem(storageKey);failNextWrite();click("Update",actions());failureSnapshot("update",failureBefore);click("Revert changes",actions());
  failureBefore=localStorage.getItem(storageKey);failNextWrite();name("Rename","Failure rename");failureSnapshot("rename",failureBefore);
  failureBefore=localStorage.getItem(storageKey);failNextWrite();click("Set as default",actions());failureSnapshot("default",failureBefore);
  failureBefore=localStorage.getItem(storageKey);failNextWrite();click("Delete",actions());click("Delete",q("#saved-event-feed-filter-delete-dialog"));failureSnapshot("delete",failureBefore);
  select("");add("Source","Event history");failureBefore=localStorage.getItem(storageKey);failNextWrite();name("Save current filter","Failure create");failureSnapshot("create",failureBefore);select(checkout.id);
  add("Pathname","/checkout");name("Save as new","Checkout path");const copyId=library().filters.find(({name})=>name==="Checkout path").id;const originalId=library().filters.find(({name})=>name==="Checkout issues").id;
  name("Rename","Purchase defects");click("Set as default",actions());const renamed={identity:identity(),sameId:library().filters.find(({name})=>name==="Purchase defects").id===copyId,originalUnchanged:originalId===checkout.id,defaultId:library().defaultFilterId};
  click("Delete",actions());const deleteDialog=q("#saved-event-feed-filter-delete-dialog");const scrollBefore=q("#live-event-list").scrollTop=19;click("Delete",deleteDialog);const deleted={identity:identity(),queryRetained:q("#active-event-feed-filters").querySelectorAll("li").length,defaultRemoved:library().defaultFilterId===undefined,scroll:q("#live-event-list").scrollTop,filterRemoved:!library().filters.some(({id})=>id===copyId)};
  const duplicate=name("Save current filter"," checkout ISSUES ");click("Cancel",q("#saved-event-feed-filter-name-dialog"));
  const currentWorking=q("#active-event-feed-filters").textContent;const globalBefore=localStorage.getItem(storageKey);const archiveBefore=localStorage.getItem("my-chrome-utilities.saved-session-library.v1");
  q("#data-layer-view-sessions").click();const archiveRow=Array.from(q("#saved-session-list").children).find(({textContent})=>textContent.includes("Saved checkout feed"));click("Open in Live feed",archiveRow);select(checkout.id);const savedIdentity=identity();const savedCount=count();q("#return-to-current-live-feed").click();
  const isolation={savedIdentity,savedCount,currentIdentity:identity(),currentWorkingRestored:q("#active-event-feed-filters").textContent===currentWorking,globalUnchanged:localStorage.getItem(storageKey)===globalBefore,archiveUnchanged:localStorage.getItem("my-chrome-utilities.saved-session-library.v1")===archiveBefore};
  select(product.id);click("Set as default",actions());click("Start fresh session");click("Discard and start fresh",q("#fresh-session-confirmation"));
  const fresh={identity:identity(),count:count(),defaultId:library().defaultFilterId,filters:library().filters.map(({name})=>name),working:JSON.parse(localStorage.getItem("my-chrome-utilities.saved-event-feed-filter-working.v1"))};
  return {initial,created,checkoutApplied,switchOpen,cancelled,switched,savedSwitch,reverted,failures,renamed,deleted,duplicate,isolation,fresh,selectorWidth:q("#saved-event-feed-filter-selector").getBoundingClientRect().width,rootWidth:root.getBoundingClientRect().width};
})()`;

const conditionalValidationRulesRuntime = `(async () => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const click = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  const input = (selector, value, eventName = "input") => { const element = q(selector); element.value = value; element.dispatchEvent(new Event(eventName, { bubbles:true })); return element; };
  globalThis.chrome = {
    tabs:{ query:async () => [{ id:31, windowId:5, url:"https://shop.example/products/field-notebook", title:"Product detail", active:true }] },
    scripting:{ executeScript:async () => [{ result:{ queue:{ history:[{ event:"product_detail", page_type:"product_detail", currency:"EUR", oOrder:{ aProducts:[] } }] } } }] },
  };
  await new Promise((resolve) => setTimeout(resolve, 50));
  if (!document.querySelector("#live-event-feed button")) {
    const start = q("#start-data-layer-testing");
    if (start.disabled) {
      q("#choose-observation-target").click();
      for (let attempt = 0; attempt < 30 && !document.querySelector("#observation-target-list [data-target-id]"); attempt += 1) await new Promise((resolve) => setTimeout(resolve, 10));
      q("#observation-target-list [data-target-id]").click();
    }
    start.click();
  }
  for (let attempt = 0; attempt < 30 && !document.querySelector("#live-event-feed button"); attempt += 1) await new Promise((resolve) => setTimeout(resolve, 10));
  q("#live-event-feed button").click();
  q("#data-layer-view-schemas").click();
  click(q("#schema-list"), "Edit working draft");
  q('#schema-property-tree button[aria-label="Add rule for oOrder.aProducts"]').click();
  click(q("#schema-property-rule-picker"), "Item count");
  input("#schema-local-rule-minimumItemCount", "1");
  const conditional = q("#schema-local-rule-conditional"); conditional.checked = true; conditional.dispatchEvent(new Event("change", { bubbles:true }));
  const editor = {
    applyOnlyWhen:q("#schema-local-rule-conditions").querySelector("legend").textContent,
    property:q("#schema-local-rule-condition-property-0").value,
    operators:Array.from(q("#schema-local-rule-condition-operator-0").options).map(({ textContent }) => textContent),
    operator:q("#schema-local-rule-condition-operator-0").value,
    initializedValue:q("#schema-local-rule-condition-value-0").value,
    schemaProperties:Array.from(q("#schema-local-rule-condition-property-0").options).map(({ value }) => value).filter(Boolean),
    preview:q("#schema-local-rule-current-preview").textContent,
    oneConsequence:q("#schema-local-rule-configuration").querySelectorAll("#schema-local-rule-parameters").length,
  };
  click(q("#schema-property-rule-picker"), "Create rule");
  const stored = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"))[0];
  const storedRule = stored.workingDraft.attachedRules[0];
  const core = await import("/data-layer-schema-verification.js");
  const conditionalCore = await import("/data-layer-conditional-validation-rules.js");
  const activeSchema = { ...stored, attachedRules:stored.workingDraft.attachedRules, assignments:stored.workingDraft.assignments };
  const validate = (page_type, products) => {
    const payload = { page_type, currency:"EUR", oOrder:{} };
    if (products !== "missing") payload.oOrder.aProducts = products === "empty array" ? [] : [{ sku:"ABC" }];
    const result = core.validateEvent({ sourceId:"event-history", eventName:"product_detail", payload, rawInput:[] }, [activeSchema]);
    const evaluation = result.evaluations.find(({ rule }) => rule === storedRule.name);
    return { page_type, products, result:evaluation.status === "not-applicable" ? "Not applicable" : evaluation.status === "pass" ? "Passed" : "Failed", issues:result.issues.filter(({ instancePath }) => instancePath === "/oOrder/aProducts").length };
  };
  const evaluations = [
    validate("product_detail", "missing"),
    validate("product_detail", "empty array"),
    validate("product_detail", "1 item"),
    validate("category", "empty array"),
    validate("category", "missing"),
  ];
  const product = storedRule.conditionGroup.predicates[0];
  const currency = { propertyPath:"/currency", operator:"Equals", comparison:conditionalCore.typedComparisonValue("EUR"), detectedType:"string" };
  const consequence = { propertyPath:"/oOrder/aProducts", operator:"item-count", parameters:"1" };
  const groups = [["All", "product_detail", "EUR"], ["All", "product_detail", "USD"], ["Any", "product_detail", "USD"], ["Any", "category", "USD"]].map(([operator, page_type, currencyValue]) => ({
    operator, page_type, currency:currencyValue,
    ...conditionalCore.evaluateConditionalRule({ page_type, currency:currencyValue }, { conditionGroup:{ operator, predicates:[product, currency] }, consequence }, () => true),
  }));
  const truthGroups = [["All", true, true], ["All", true, false], ["Any", true, false], ["Any", false, false]].map(([operator, first, second]) => {
    let index = 0;
    const applies = conditionalCore.conditionGroupApplies({ operator, predicates:[product, currency] }, () => [first, second][index++]);
    return { operator, first, second, behavior:applies ? "evaluated" : "Not applicable" };
  });
  const predicateCases = [
    ["present with null", "Exists", "none", { value:null, exists:true }, { propertyPath:"/trigger", operator:"Exists" }],
    ["absent", "Does not exist", "none", { value:undefined, exists:false }, { propertyPath:"/trigger", operator:"Does not exist" }],
    ["string product_detail", "Equals", "string product_detail", { value:"product_detail", exists:true }, { propertyPath:"/trigger", operator:"Equals", comparison:conditionalCore.typedComparisonValue("product_detail") }],
    ["number 1", "Equals", "string 1", { value:1, exists:true }, { propertyPath:"/trigger", operator:"Equals", comparison:conditionalCore.typedComparisonValue("1") }],
    ["absent", "Does not equal", "string internal", { value:undefined, exists:false }, { propertyPath:"/trigger", operator:"Does not equal", comparison:conditionalCore.typedComparisonValue("internal") }],
    ["string checkout", "Is one of", "page, checkout", { value:"checkout", exists:true }, { propertyPath:"/trigger", operator:"Is one of", comparisons:[conditionalCore.typedComparisonValue("page"), conditionalCore.typedComparisonValue("checkout")] }],
    ["string product_detail", "Matches pattern", "^product_", { value:"product_detail", exists:true }, { propertyPath:"/trigger", operator:"Matches pattern", comparison:conditionalCore.typedComparisonValue("^product_") }],
    ["number 6", "Is greater than", "number 5", { value:6, exists:true }, { propertyPath:"/trigger", operator:"Is greater than", comparison:conditionalCore.typedComparisonValue(5) }],
    ["number 5", "Is at least", "number 5", { value:5, exists:true }, { propertyPath:"/trigger", operator:"Is at least", comparison:conditionalCore.typedComparisonValue(5) }],
    ["number 4", "Is less than", "number 5", { value:4, exists:true }, { propertyPath:"/trigger", operator:"Is less than", comparison:conditionalCore.typedComparisonValue(5) }],
    ["number 5", "Is at most", "number 5", { value:5, exists:true }, { propertyPath:"/trigger", operator:"Is at most", comparison:conditionalCore.typedComparisonValue(5) }],
    ["string 5", "Is greater than", "number 4", { value:"5", exists:true }, { propertyPath:"/trigger", operator:"Is greater than", comparison:conditionalCore.typedComparisonValue(4) }],
  ].map(([observedState, predicate, configuredValue, observed, definition]) => ({ observedState, predicate, configuredValue, result:conditionalCore.evaluateConditionPredicate(observed, definition) }));
  const invalidBase = { conditionGroup:{ operator:"All", predicates:[product] }, consequence };
  const invalidConfigurations = [
    ["no trigger predicate", { ...invalidBase, conditionGroup:{ operator:"All", predicates:[] } }],
    ["trigger without a property path", { ...invalidBase, conditionGroup:{ operator:"All", predicates:[{ ...product, propertyPath:"" }] } }],
    ["Equals without a comparison value", { ...invalidBase, conditionGroup:{ operator:"All", predicates:[{ propertyPath:"/page_type", operator:"Equals", detectedType:"string" }] } }],
    ["malformed Matches pattern value", { ...invalidBase, conditionGroup:{ operator:"All", predicates:[{ propertyPath:"/page_type", operator:"Matches pattern", comparison:conditionalCore.typedComparisonValue("["), detectedType:"string" }] } }],
    ["Is greater than on a string trigger", { ...invalidBase, conditionGroup:{ operator:"All", predicates:[{ propertyPath:"/page_type", operator:"Is greater than", comparison:conditionalCore.typedComparisonValue(5), detectedType:"string" }] } }],
    ["consequence rule with invalid parameters", { ...invalidBase, consequence:{ ...consequence, parameters:"1.5" } }],
  ].map(([configuration, definition]) => ({ configuration, ...conditionalCore.validateConditionalRule(definition) }));
  const failed = core.validateEvent({ sourceId:"event-history", eventName:"product_detail", payload:{ page_type:"product_detail", currency:"EUR", oOrder:{ aProducts:[] } }, rawInput:[] }, [activeSchema]);
  const notApplicable = core.validateEvent({ sourceId:"event-history", eventName:"product_detail", payload:{ page_type:"category", currency:"EUR", oOrder:{} }, rawInput:[] }, [activeSchema]);
  const ui = await import("/data-layer-live-observer-ui.js");
  const actionsCore = await import("/data-layer-live-inspector-actions.js");
  const elements = ui.findLiveObserverElements();
  const actions = actionsCore.createLiveInspectorActions({ currentPageUrl:()=>"https://shop.example/products/field-notebook", writeClipboard:async()=>{}, storeTemplate:()=>{}, addPropertyValidation:()=>{}, validationState:()=>"Valid", updateValidation:()=>{}, manualSchemaChoices:()=>[], selectManualSchema:()=>{} });
  const renderResult = (result, payload) => {
    ui.renderLiveInspector(elements, { id:"conditional-event", name:"product_detail", sourceId:"event-history", captureTime:"2026-07-14T12:00:00Z", pageUrl:"https://shop.example/products/field-notebook", payload, rawInput:[], validation:result.state, validationDetails:{ issues:result.issues, evaluations:result.evaluations } }, actions);
    return elements.eventInspector.textContent;
  };
  const failedText = renderResult(failed, { page_type:"product_detail", currency:"EUR", oOrder:{ aProducts:[] } });
  const notApplicableDefaultText = renderResult(notApplicable, { page_type:"category", currency:"EUR", oOrder:{} });
  click(elements.eventInspector, "Show non-applicable properties");
  const notApplicableText = elements.eventInspector.textContent;
  const presentation = {
    issueCount:failed.issues.length,
    expectedPath:failed.issues[0].instancePath,
    conditionShown:failedText.includes("page_type equals product_detail"),
    consequenceShown:failedText.includes("minimum 1 items"),
    triggerNotFailing:!failed.evaluations.some(({ propertyPath, status }) => propertyPath === "/page_type" && (status === "error" || status === "warning")),
    notApplicableHiddenByDefault:!notApplicableDefaultText.includes("not applicable"),
    notApplicableShown:notApplicableText.includes("not applicable"),
    notApplicableIssues:notApplicable.issues.length,
  };
  const reusable = { ...structuredClone(storedRule), id:"rule:reusable-products", name:"Reusable product detail products", version:1 };
  const lifecycleSchema = { ...activeSchema, attachedRules:[storedRule, reusable] };
  const exported = core.serializeSchemaLibraryExport([lifecycleSchema], [reusable]);
  const imported = JSON.parse(exported);
  localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify(imported.schemas));
  localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", JSON.stringify(imported.rules));
  const reloadedSchemas = core.restoreSchemaLibrary(localStorage.getItem("my-chrome-utilities.schema-library.v1"));
  const reloadedRules = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1"));
  const revisedReusable = { ...structuredClone(reloadedRules[0]), version:2, message:"Revised message", revisionHistory:[structuredClone(reloadedRules[0])] };
  const lifecycle = {
    attachmentIds:reloadedSchemas[0].attachedRules.map(({ id }) => id),
    ruleIds:reloadedRules.map(({ id }) => id),
    atomic:reloadedSchemas[0].attachedRules.every(({ conditionGroup, propertyPath, operator }) => Boolean(conditionGroup && propertyPath && operator)),
    typedValue:reloadedSchemas[0].attachedRules[0].conditionGroup.predicates[0].comparison,
    pinnedVersion:reloadedSchemas[0].attachedRules.find(({ id }) => id === reusable.id).version,
    revisedVersion:revisedReusable.version,
    revisedPreserved:JSON.stringify(revisedReusable.conditionGroup) === JSON.stringify(reusable.conditionGroup),
  };
  return { editor, stored:{ count:stored.workingDraft.attachedRules.length, rule:storedRule, summary:conditionalCore.conditionalRuleSummary({ conditionGroup:storedRule.conditionGroup, consequence:{ propertyPath:storedRule.propertyPath, operator:storedRule.operator, parameters:storedRule.parameters } }) }, evaluations, groups, truthGroups, predicateCases, invalidConfigurations, presentation, lifecycle };
})()`;

const schemaDocumentationRuntime = `(async () => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const click = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  q("#data-layer-view-schemas").click();
  click(q("#schema-list"), "Edit working draft");
  q("#schema-editor-description").value = "Product detail commerce event";
  q("#save-schema-description").click();
  const propertyRow = q('[data-schema-property-path="oOrder.aProducts.*.product_id"]');
  propertyRow.querySelector(".schema-property-documentation-control").click();
  propertyRow.querySelector('input[id^="schema-documentation-name-"]').value = "Product identifier";
  propertyRow.querySelector('textarea[id^="schema-documentation-description-"]').value = "Stable identifier used by fulfilment";
  propertyRow.querySelector('input[value="Save documentation"]').click();
  const storedAfterEdit = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"));
  const productAfterEdit = storedAfterEdit.find(({ id }) => id === "schema-product-detail");
  const editor = {
    schemaDescription:productAfterEdit.workingDraft.documentation.description,
    paths:Object.keys(productAfterEdit.workingDraft.documentation.properties),
    property:productAfterEdit.workingDraft.documentation.properties["/oOrder/aProducts/*/product_id"],
    currentDescription:productAfterEdit.documentation.description,
    ruleCount:productAfterEdit.workingDraft.attachedRules.length,
    currentVersion:productAfterEdit.version,
  };

  const core = await import("/data-layer-schema-verification.js");
  const documentationCore = await import("/data-layer-schema-documentation.js");
  const ui = await import("/data-layer-live-observer-ui.js");
  const actionsCore = await import("/data-layer-live-inspector-actions.js");
  const currentProduct = { ...productAfterEdit, documentation:productAfterEdit.workingDraft.documentation };
  const payload = { page_type:"product_detail", currency:"EUR", items:[{ product_id:"SKU-1" }], oOrder:{ aProducts:[{ product_id:"P-1" }] } };
  const result = core.validateWithSchema({ sourceId:"event-history", eventName:"product_detail", payload, rawInput:[] }, currentProduct, storedAfterEdit);
  const elements = ui.findLiveObserverElements();
  const actions = actionsCore.createLiveInspectorActions({ currentPageUrl:()=>"https://shop.example/product", writeClipboard:async()=>{}, storeTemplate:()=>{}, addPropertyValidation:()=>{}, validationState:()=>result.state, updateValidation:()=>{}, manualSchemaChoices:()=>[], selectManualSchema:()=>{} });
  q("#data-layer-view-live").click(); elements.eventInspector.hidden = false;
  ui.renderLiveInspector(elements, { id:"documented", name:"product_detail", sourceId:"event-history", captureTime:"2026-07-14T12:00:00Z", pageUrl:"https://shop.example/product", payload, rawInput:[], validation:result.state, validationDetails:{ issues:result.issues, evaluations:result.evaluations ?? [], schema:result.schema, documentation:result.documentation } }, actions);
  const inspector = elements.eventInspector;
  const pageRow = q('[data-property-path="/page_type"]');
  const wildcardRow = q('[data-property-path="/items/0/product_id"]');
  const syntheticRow = q('[data-property-path="/oOrder/order_id"]');
  const currencyRow = q('[data-property-path="/currency"]');
  const information = pageRow.querySelector(".live-property-documentation-control");
  information.dispatchEvent(new Event("pointerenter", { bubbles:true }));
  const hoverText = pageRow.querySelector(".live-property-documentation-preview").textContent;
  information.focus(); const focusPreview = !pageRow.querySelector(".live-property-documentation-preview").hidden;
  information.click();
  const persistent = pageRow.querySelector(".live-property-documentation-details");
  const persistentText = persistent.querySelector("p").textContent;
  persistent.dispatchEvent(new KeyboardEvent("keydown", { key:"Escape", bubbles:true }));
  const focusAfterEscape = document.activeElement === information;
  const search = q("#live-property-search");
  const searchResults = ["page_type", "Page classification", "documentationExecuted"].map((query) => { search.value = query; search.dispatchEvent(new Event("input", { bubbles:true })); return !pageRow.hidden; });
  const unsafe = "<img src=x onerror=globalThis.documentationExecuted=true><script>globalThis.documentationExecuted=true</script>";
  const presentation = {
    schemaDescription:inspector.textContent.includes("Product detail commerce event"),
    mapped:pageRow.textContent.includes("Page classification"),
    wildcard:wildcardRow.textContent.includes("Stable product identifier"),
    synthetic:syntheticRow.textContent.includes("Stable order identifier"),
    unmatchedControl:currencyRow.querySelectorAll(".live-property-documentation-control").length,
    hoverText, persistentText, plainText:hoverText === unsafe && !pageRow.querySelector("img, script") && globalThis.documentationExecuted !== true,
    focusPreview, closed:persistent.hidden, focusReturned:focusAfterEscape,
    accessible:{ name:information.getAttribute("aria-label"), described:Boolean(information.getAttribute("aria-describedby")), expanded:information.getAttribute("aria-expanded") },
    searchVisible:searchResults.every(Boolean),
    payloadUnchanged:JSON.stringify(payload) === JSON.stringify({ page_type:"product_detail", currency:"EUR", items:[{ product_id:"SKU-1" }], oOrder:{ aProducts:[{ product_id:"P-1" }] } }),
    validationUnchanged:result.state,
  };

  const parent = storedAfterEdit.find(({ id }) => id === "schema-generic-commerce");
  const inheritedProduct = { ...currentProduct, parentSchemaId:parent.id };
  const inherited = documentationCore.resolveEffectiveSchemaDocumentation(inheritedProduct, [parent, inheritedProduct]);
  const locallyOverridden = { ...inheritedProduct, documentation:documentationCore.setPropertyDocumentation(inheritedProduct.documentation, "/currency", { displayName:"Checkout currency", description:"Local currency meaning" }) };
  const local = documentationCore.resolveEffectiveSchemaDocumentation(locallyOverridden, [parent, locallyOverridden]);
  const restoredDocumentation = documentationCore.setPropertyDocumentation(locallyOverridden.documentation, "/currency", { displayName:"", description:"" });
  const restored = documentationCore.resolveEffectiveSchemaDocumentation({ ...locallyOverridden, documentation:restoredDocumentation }, [parent, { ...locallyOverridden, documentation:restoredDocumentation }]);
  const inheritance = {
    inherited:[inherited.properties["/currency"].description, inherited.properties["/currency"].origin.name, inherited.properties["/currency"].inherited],
    local:[local.properties["/currency"].description, local.properties["/currency"].origin.name, local.properties["/currency"].inherited],
    restored:[restored.properties["/currency"].description, restored.properties["/currency"].origin.name],
    parentUnchanged:parent.documentation.properties["/currency"].description,
  };

  const pinnedAssignment = { ...currentProduct.assignments[0], schemaVersion:3, versionPolicy:"pinned" };
  const v3 = { ...currentProduct, assignments:[pinnedAssignment], documentation:documentationCore.setPropertyDocumentation(currentProduct.documentation, "/page_type", { displayName:"Page classification", description:"Revision 3 description" }) };
  const v4 = { ...currentProduct, version:4, assignments:[pinnedAssignment], revisionHistory:[core.schemaRevision(v3, 3)], documentation:documentationCore.setPropertyDocumentation(currentProduct.documentation, "/page_type", { displayName:"Page classification", description:"Revision 4 description" }) };
  const documentedEvent = { sourceId:"event-history", eventName:"product_detail", payload, rawInput:[] };
  const pinnedResult = core.validateEvent(documentedEvent, [v4], "https://shop.example/product");
  const latestV4 = { ...v4, assignments:[{ ...pinnedAssignment, versionPolicy:"follow latest", schemaVersion:undefined }] };
  const latestResult = core.validateEvent(documentedEvent, [latestV4], "https://shop.example/product");
  const manualResult = core.validateWithSchema(documentedEvent, core.schemaRevision(v4, 3), [v4]);
  const savedValidationDetails = structuredClone({ schema:pinnedResult.schema, documentation:pinnedResult.documentation });
  const revisions = {
    pinned:documentationCore.resolvePropertyDocumentation(pinnedResult.documentation, "/page_type").description,
    current:documentationCore.resolvePropertyDocumentation(latestResult.documentation, "/page_type").description,
    pinnedSource:pinnedResult.documentation.properties["/page_type"].origin.name + " revision " + pinnedResult.documentation.properties["/page_type"].origin.version,
    currentSource:latestResult.documentation.properties["/page_type"].origin.name + " revision " + latestResult.documentation.properties["/page_type"].origin.version,
    manual:documentationCore.resolvePropertyDocumentation(manualResult.documentation, "/page_type").description,
    saved:documentationCore.resolvePropertyDocumentation(savedValidationDetails.documentation, "/page_type").description,
  };

  const exported = core.serializeSchemaLibrary(storedAfterEdit);
  const reloaded = core.restoreSchemaLibrary(exported);
  const legacy = core.restoreSchemaLibrary(JSON.stringify([{ id:"legacy", name:"Legacy", version:1, document:{ type:"object" }, assignments:[] }]));
  const lifecycle = {
    current:reloaded.find(({ id }) => id === "schema-product-detail").documentation.properties["/page_type"].description,
    draft:reloaded.find(({ id }) => id === "schema-product-detail").workingDraft.documentation.properties["/oOrder/aProducts/*/product_id"].description,
    historical:reloaded.find(({ id }) => id === "schema-product-detail").revisionHistory[0].documentation.properties["/page_type"].description,
    exactlyOnce:Object.keys(reloaded.find(({ id }) => id === "schema-product-detail").workingDraft.documentation.properties).length,
    legacyDocumentation:legacy[0].documentation ?? null,
  };

  q("#data-layer-view-schemas").click();
  click(q("#schema-list"), "Edit working draft");
  const removalRow = q('[data-schema-property-path="oOrder.aProducts.*.product_id"]');
  removalRow.querySelector('button[aria-label^="Remove property"]').click();
  const removalSummary = q("#schema-property-removal-summary").textContent;
  click(q("#schema-property-removal-dialog"), "Remove property");
  const afterRemoval = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")).find(({ id }) => id === "schema-product-detail").workingDraft;
  click(document, "Undo");
  const afterUndo = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")).find(({ id }) => id === "schema-product-detail").workingDraft;
  const removal = {
    reviewShowsDocumentation:removalSummary.includes("/oOrder/aProducts/*/product_id"),
    removed:{ property:!afterRemoval.document.properties.oOrder.properties.aProducts.items.properties.product_id, rules:afterRemoval.attachedRules.length, documentation:Object.keys(afterRemoval.documentation.properties).includes("/oOrder/aProducts/*/product_id") },
    restored:{ property:Boolean(afterUndo.document.properties.oOrder.properties.aProducts.items.properties.product_id), rules:afterUndo.attachedRules.length, documentation:afterUndo.documentation.properties["/oOrder/aProducts/*/product_id"].description },
  };
  const interactionCases = [
    { interaction:"pointer hover", presentation:"a non-blocking information preview" },
    { interaction:"keyboard focus", presentation:"a non-blocking information preview" },
    { interaction:"click or Enter", presentation:"persistent additional information" },
  ];
  const mappingCases = [
    ["/page_type", "Page classification", "Business classification of page", "/page_type"],
    ["/items/*/product_id", "Product identifier", "Stable product identifier", "/items/0/product_id"],
    ["/oOrder/aProducts/*/product_id", "Product identifier", "Stable product identifier", "/oOrder/aProducts/0/product_id"],
    ["/oOrder/order_id", "Order identifier", "Stable order identifier", "/oOrder/order_id"],
    ["no matching path", "none", "none", "/currency"],
  ].map(([mappingPath, displayName, description, renderedPath]) => {
    const documentation = mappingPath === "no matching path"
      ? {}
      : { properties:{ [mappingPath]:{ displayName, description } } };
    const mappedSchema = { ...currentProduct, parentSchemaId:undefined, documentation };
    const mappedResult = core.validateWithSchema(documentedEvent, mappedSchema, [mappedSchema]);
    ui.renderLiveInspector(elements, { id:"mapping", name:"product_detail", sourceId:"event-history", captureTime:"2026-07-14T12:00:00Z", pageUrl:"https://shop.example/product", payload, rawInput:[], validation:mappedResult.state, validationDetails:{ issues:mappedResult.issues, evaluations:mappedResult.evaluations ?? [], schema:mappedResult.schema, documentation:mappedResult.documentation } }, actions);
    const row = q('[data-property-path="' + renderedPath + '"]');
    const control = row.querySelector(".live-property-documentation-control");
    const missing = Boolean(row.querySelector('[data-missing="true"]'));
    const payloadState = (missing ? "missing expected " : "observed ") + renderedPath;
    const wildcard = mappingPath.includes("*");
    return {
      mappingPath,
      displayName:row.querySelector(".live-property-display-name")?.textContent ?? "none",
      description:control ? row.querySelector(".live-property-documentation-preview").textContent : "none",
      payloadState,
      eventProperty:payloadState,
      renderedPath:row.dataset.propertyPath,
      presentation:!control ? "no documentation control" : wildcard ? "wildcard mapped information" : missing ? "mapped synthetic-row information" : "mapped name and description",
      documentationResult:!control ? "no empty documentation control" : wildcard ? "wildcard information on the concrete item" : missing ? "mapped information on the synthetic row" : "mapped information on " + renderedPath,
    };
  });
  const revisionCases = [
    { eventContext:"automatic assignment pinned to revision 3", description:revisions.pinned, source:revisions.pinnedSource },
    { eventContext:"automatic assignment following current revision 4", description:revisions.current, source:revisions.currentSource },
    { eventContext:"manual schema selection of revision 3", description:revisions.manual, source:revisions.pinnedSource },
    { eventContext:"saved event recorded with revision 3", description:revisions.saved, source:revisions.pinnedSource },
  ];
  return { editor, presentation, inheritance, revisions, lifecycle, removal, interactionCases, mappingCases, revisionCases };
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
  const attached = { pickerClosed:!q("#schema-property-rule-picker").open, focusReturned:document.activeElement?.getAttribute("aria-label") === "Add rule for page_type", activeCount:q('#schema-property-tree [data-schema-property-path="page_type"] span:not(.schema-property-metadata)').textContent, draftRules:stored.workingDraft.attachedRules.filter(({ id, propertyPath }) => id === "rule:approved" && propertyPath === "/page_type").length, currentRules:(stored.attachedRules ?? []).length, currentVersion:stored.version };
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
  const openConfiguration = (path, rule) => { q('#schema-property-tree button[aria-label="Add rule for ' + path + '"]').click(); click(dialog, rule); return q("#schema-local-rule-configuration"); };
  const parameterDescription = (rule) => {
    const parameters = q("#schema-local-rule-parameters");
    if (rule === "Required" || rule === "Digits only") return parameters.textContent.includes("No parameter controls") && parameters.querySelectorAll("input, select").length === 0 ? "no parameter controls" : "unexpected controls";
    if (rule === "Exact value") return parameters.querySelector('label[for="schema-local-rule-exactValue"]')?.textContent === "Exact value" && q("#schema-local-rule-exactValue").type === "text" ? "one type-aware Exact value field" : "missing Exact value";
    if (rule === "Allowed values") return parameters.querySelector("#schema-local-rule-allowed-values") && q("#schema-local-rule-allowed-value-1").type === "text" ? "repeatable type-aware value fields" : "missing allowed values";
    if (rule === "Regular expression") return parameters.querySelector('label[for="schema-local-rule-pattern"]')?.textContent === "Pattern" ? "Pattern" : "missing Pattern";
    if (rule === "Text length") { const input = q("#schema-local-rule-exactLength"); return input.min === "0" && input.step === "1" ? "non-negative Exact length" : "invalid Exact length"; }
    if (rule === "Numeric range") return q("#schema-local-rule-minimum").type === "number" && q("#schema-local-rule-maximum").type === "number" ? "optional Minimum and Maximum" : "missing range";
    const input = q("#schema-local-rule-minimumItemCount"); return input.min === "0" && input.step === "1" ? "non-negative Minimum item count" : "invalid item count";
  };
  const configurationControls = {};
  let configurationCommon;
  for (const [path, type, rule] of [["page_type","string","Required"],["page_type","string","Exact value"],["page_type","string","Allowed values"],["page_type","string","Regular expression"],["page_type","string","Text length"],["page_type","string","Digits only"],["revenue","number","Numeric range"],["items","array","Item count"]]) {
    const form = openConfiguration(path, rule); configurationControls[type + ":" + rule] = parameterDescription(rule);
    if (!configurationCommon) configurationCommon = {
      severity:Boolean(q("#schema-local-rule-severity")), message:q("#schema-local-rule-message").previousElementSibling.textContent,
      reusable:q("#schema-local-rule-reusable").parentElement.textContent.trim(), reusableDefault:q("#schema-local-rule-reusable").checked,
      actions:["Create rule", "Back to rule choices", "Cancel"].every((label) => Array.from(form.querySelectorAll("button")).some(({ textContent }) => textContent === label)),
      readable:form.scrollWidth <= dialog.clientWidth && dialog.getBoundingClientRect().width <= innerWidth,
    };
    click(form, "Back to rule choices"); click(dialog, "Cancel");
  }
  const validationDrafts = [
    ["Exact value:no value", model.createRuleConfiguration("Exact value", "string")],
    ["Regular expression:malformed pattern [", { ...model.createRuleConfiguration("Regular expression", "string"), pattern:"[" }],
    ["Text length:exact length -1", { ...model.createRuleConfiguration("Text length", "string"), exactLength:"-1" }],
    ["Numeric range:neither boundary", model.createRuleConfiguration("Numeric range", "number")],
    ["Numeric range:minimum 10 and maximum 5", { ...model.createRuleConfiguration("Numeric range", "number"), minimum:"10", maximum:"5" }],
    ["Item count:minimum 1.5", { ...model.createRuleConfiguration("Item count", "array"), minimumItemCount:"1.5" }],
  ];
  const validations = Object.fromEntries(validationDrafts.map(([key, draft]) => { const result = model.validateRuleConfiguration(draft); return [key, { creationResult:result.ready ? "available" : "blocked", assistance:result.assistance }]; }));
  const setValue = (selector, value, eventName = "input") => { const element = q(selector); element.value = value; element.dispatchEvent(new Event(eventName, { bubbles:true })); return element; };
  openConfiguration("product.sku", "Allowed values");
  const allowedValues = { initial:{ blocked:q("#schema-local-rule-configuration button[type=submit]").disabled, assistance:q("#schema-local-rule-assistance").textContent } };
  setValue("#schema-local-rule-allowed-value-1", "ABC-1"); click(dialog, "Add another value"); setValue("#schema-local-rule-allowed-value-2", "XYZ-2");
  const allowedInputs = Array.from(dialog.querySelectorAll("#schema-local-rule-allowed-values input"));
  allowedValues.entered = { values:allowedInputs.map(({ value }) => value), editable:allowedInputs.every(({ disabled }) => !disabled), removable:dialog.querySelectorAll("#schema-local-rule-allowed-values button").length === 3, createAvailable:!q("#schema-local-rule-configuration button[type=submit]").disabled };
  setValue("#schema-local-rule-severity", "warning", "change"); setValue("#schema-local-rule-message", "Use an approved SKU");
  q("#schema-local-rule-reusable").checked = true; q("#schema-local-rule-reusable").dispatchEvent(new Event("change", { bubbles:true }));
  const reusableToggle = { checked:{ nameRequired:q("#schema-local-rule-name").required, description:Boolean(q("#schema-local-rule-description")), explanation:q("#schema-local-rule-reusable-explanation").textContent, blankBlocked:q("#schema-local-rule-configuration button[type=submit]").disabled } };
  q("#schema-local-rule-reusable").checked = false; q("#schema-local-rule-reusable").dispatchEvent(new Event("change", { bubbles:true }));
  reusableToggle.unchecked = { fieldsHidden:!dialog.querySelector("#schema-local-rule-name") && !dialog.querySelector("#schema-local-rule-description"), values:Array.from(dialog.querySelectorAll("#schema-local-rule-allowed-values input")).map(({ value }) => value), severity:q("#schema-local-rule-severity").value, message:q("#schema-local-rule-message").value };
  const libraryBeforeLocal = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1")).length;
  click(dialog, "Create rule");
  let storedAfterLocal = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"))[0];
  const localRules = storedAfterLocal.workingDraft.attachedRules.filter(({ id, propertyPath }) => id.startsWith("local-rule:") && propertyPath === "/product/sku");
  const localCreation = {
    count:localRules.length, operator:localRules[0]?.operator, parameters:localRules[0]?.parameters, severity:localRules[0]?.severity, message:localRules[0]?.message,
    activeCount:q('#schema-property-tree [data-schema-property-path="product.sku"] span:not(.schema-property-metadata)').textContent,
    libraryUnchanged:JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1")).length === libraryBeforeLocal,
    currentRules:(storedAfterLocal.attachedRules ?? []).length, currentVersion:storedAfterLocal.version,
    closed:!dialog.open, focusReturned:document.activeElement?.getAttribute("aria-label") === "Add rule for product.sku",
  };
  openConfiguration("product.sku", "Allowed values"); setValue("#schema-local-rule-allowed-value-1", "ABC-1"); click(dialog, "Add another value"); setValue("#schema-local-rule-allowed-value-2", "XYZ-2");
  setValue("#schema-local-rule-severity", "warning", "change"); setValue("#schema-local-rule-message", "Use an approved SKU");
  q("#schema-local-rule-reusable").checked = true; q("#schema-local-rule-reusable").dispatchEvent(new Event("change", { bubbles:true }));
  setValue("#schema-local-rule-name", "Approved product SKUs"); setValue("#schema-local-rule-description", "SKUs accepted by fulfilment"); click(dialog, "Create rule");
  const libraryAfterReusable = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1"));
  const approved = libraryAfterReusable.filter(({ name }) => name === "Approved product SKUs"); storedAfterLocal = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"))[0];
  const approvedAttachments = storedAfterLocal.workingDraft.attachedRules.filter(({ id, propertyPath }) => id === approved[0]?.id && propertyPath === "/product/sku");
  const reusableCreation = {
    libraryCount:approved.length, version:approved[0]?.version, type:approved[0]?.applicableType, attachmentCount:approvedAttachments.length,
    sameIdentity:approvedAttachments[0]?.id === approved[0]?.id, localCount:storedAfterLocal.workingDraft.attachedRules.filter(({ id, propertyPath }) => id.startsWith("local-rule:") && propertyPath === "/product/sku").length,
    details:{ parameters:approved[0]?.parameters, severity:approved[0]?.severity, message:approved[0]?.message, description:approved[0]?.description },
    closed:!dialog.open, focusReturned:document.activeElement?.getAttribute("aria-label") === "Add rule for product.sku",
  };
  const beforeNavigation = { schemas:localStorage.getItem("my-chrome-utilities.schema-library.v1"), rules:localStorage.getItem("my-chrome-utilities.schema-rule-library.v1") };
  openConfiguration("product.sku", "Allowed values"); setValue("#schema-local-rule-allowed-value-1", "partial"); click(dialog, "Back to rule choices");
  const navigation = { back:{ choices:Array.from(dialog.querySelectorAll('[aria-label="Create a rule"] button')).map(({ textContent }) => textContent), heading:q("#schema-property-rule-picker-heading").textContent } };
  click(dialog, "Allowed values"); setValue("#schema-local-rule-allowed-value-1", "partial"); click(dialog, "Cancel");
  navigation.cancel = { closed:!dialog.open, focusReturned:document.activeElement?.getAttribute("aria-label") === "Add rule for product.sku" };
  navigation.unchanged = beforeNavigation.schemas === localStorage.getItem("my-chrome-utilities.schema-library.v1") && beforeNavigation.rules === localStorage.getItem("my-chrome-utilities.schema-rule-library.v1");
  return { closed, opened, availability, searches, groups, metadata, builtInConfiguration, attached, already:{ disabled:already?.disabled, label:already?.textContent }, empty, keyboard, configurationControls, configurationCommon, validations, allowedValues, reusableToggle, localCreation, reusableCreation, navigation };
})()`;

const schemaRulePropertyIdentityRuntime = `(async () => {
  const pause = () => new Promise((resolve) => setTimeout(resolve, 0));
  const q = (selector, root=document) => { const value=root.querySelector(selector); if (!value) throw new Error("Missing " + selector); return value; };
  const click = (root, label) => { const value=Array.from(root.querySelectorAll("button")).find((button)=>button.textContent === label || button.textContent.startsWith(label)); if (!value) throw new Error("Missing action " + label); value.click(); return value; };
  const runtimeErrors=[];
  addEventListener("error",(event)=>runtimeErrors.push(String(event.error ?? event.message)));
  addEventListener("unhandledrejection",(event)=>runtimeErrors.push(String(event.reason)));
  q("#data-layer-view-schemas").click(); const openPageView=()=>{ const item=Array.from(q("#schema-list").children).find((candidate)=>candidate.textContent.includes("Page view")); if(!item) throw new Error("Missing Page view schema"); click(item,"Edit working draft"); }; openPageView();
  const editor=q("#schema-editor"); const tree=q("#schema-property-tree");
  const row=(canonical)=>q('[data-schema-property-canonical-path="'+canonical+'"]',tree);
  const identities=()=>Array.from(tree.querySelectorAll("[data-schema-property-canonical-path]")).map((item)=>item.dataset.schemaPropertyCanonicalPath);
  const stored=()=>JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"))[1];
  const documentBytes=()=>JSON.stringify(stored().workingDraft.document);
  const removeRule=(id)=>{ const details=row("/page_type").querySelector("details[data-attached-rules]"); details.open=true; click(q('[data-rule-id="'+id+'"]',details),"Remove"); };
  const initialDocument=documentBytes(); const initialIdentities=identities();
  q('button[aria-label="Add rule for page_levels"]',row("/page_levels")).click();
  const arrayPicker={ heading:q("#schema-property-rule-picker-heading").textContent, itemCount:Array.from(q("#schema-property-rule-picker").querySelectorAll("button")).some(({textContent})=>textContent==="Item count"), regularExpression:Array.from(q("#schema-property-rule-picker").querySelectorAll("button")).some(({textContent})=>textContent==="Regular expression") };
  q("#schema-property-rule-picker").dispatchEvent(new Event("cancel",{cancelable:true}));
  const initial={ identities:initialIdentities, pageTypeRows:tree.querySelectorAll('[data-schema-property-canonical-path="/page_type"]').length, pageLevelRows:tree.querySelectorAll('[data-schema-property-canonical-path="/page_levels/0"]').length, nestedRows:tree.querySelectorAll('[data-schema-property-canonical-path="/products/*/name"]').length, inheritedRows:tree.querySelectorAll('[data-schema-property-canonical-path="/customer/id"]').length, metadata:row("/page_type").querySelector(".schema-property-metadata").textContent, documentation:row("/page_type").querySelector(".schema-property-documentation").textContent, arrayPicker };
  const page=row("/page_type"); page.querySelector("details[data-attached-rules]").open=true; page.setAttribute("aria-current","true"); editor.style.height="240px"; editor.style.overflow="auto"; tree.style.height="180px"; tree.style.overflow="auto"; editor.scrollTop=31; tree.scrollTop=19;
  q('button[aria-label="Add rule for page_type"]',page).click(); click(q("#schema-property-rule-picker"),"Required"); click(q("#schema-property-rule-picker"),"Create rule"); await pause();
  const afterRequiredStored=stored(); const afterRequiredRow=row("/page_type");
  const required={ rules:afterRequiredStored.workingDraft.attachedRules.filter(({propertyPath,operator})=>propertyPath==="/page_type" && operator==="required").length, documentUnchanged:documentBytes()===initialDocument, identitiesUnchanged:JSON.stringify(identities())===JSON.stringify(initialIdentities), count:afterRequiredRow.textContent.includes("1 active rules"), rows:tree.querySelectorAll('[data-schema-property-canonical-path="/page_type"]').length, selected:afterRequiredRow.getAttribute("aria-current"), expanded:afterRequiredRow.querySelector("details[data-attached-rules]").open, editorScroll:editor.scrollTop, treeScroll:tree.scrollTop, focus:document.activeElement?.getAttribute("aria-label") };
  removeRule(afterRequiredStored.workingDraft.attachedRules.find(({operator})=>operator==="required").id);
  q('button[aria-label="Add rule for page_type"]',row("/page_type")).click(); click(q("#schema-property-rule-picker"),"Approved page types version 2"); await pause();
  const afterReusable=stored();
  const reusable={ rules:afterReusable.workingDraft.attachedRules.filter(({id,version,propertyPath})=>id==="rule:approved-page-types" && version===2 && propertyPath==="/page_type").length, documentUnchanged:documentBytes()===initialDocument, count:row("/page_type").textContent.includes("1 active rules") };
  q('button[aria-label="Add rule for page_type"]',row("/page_type")).click();
  const retryButton=Array.from(q("#schema-property-rule-picker").querySelectorAll("button")).find((button)=>button.textContent.includes("Approved page types version 2"));
  reusable.retry={ disabled:retryButton?.disabled, label:retryButton?.textContent }; q("#schema-property-rule-picker").dispatchEvent(new Event("cancel",{cancelable:true}));
  removeRule("rule:approved-page-types");
  q('button[aria-label="Add rule for page_type"]',row("/page_type")).click(); click(q("#schema-property-rule-picker"),"Required"); click(q("#schema-property-rule-picker"),"Create rule"); await pause();
  q('button[aria-label="Add rule for page_type"]',row("/page_type")).click(); click(q("#schema-property-rule-picker"),"Allowed values");
  const allowed=q("#schema-local-rule-allowed-value-1"); allowed.value="homepage"; allowed.dispatchEvent(new Event("input",{bubbles:true})); click(q("#schema-property-rule-picker"),"Create rule"); await pause();
  const distinct={ rules:stored().workingDraft.attachedRules.filter(({propertyPath})=>propertyPath==="/page_type").map(({id,operator})=>({id,operator})), count:row("/page_type").textContent.includes("2 active rules"), documentUnchanged:documentBytes()===initialDocument, oneRow:tree.querySelectorAll('[data-schema-property-canonical-path="/page_type"]').length===1 };
  removeRule(distinct.rules.find(({operator})=>operator==="allowed-values").id);
  q('button[aria-label="Add rule for page_type"]',row("/page_type")).click(); click(q("#schema-property-rule-picker"),"Approved page types version 2"); await pause();
  const targets=[];
  for (const [canonical,display] of [["/page_levels/0","page_levels.0"],["/products/*/name","products.*.name"],["/customer/id","customer.id"]]) {
    const before=documentBytes(); const beforeIdentities=identities(); const target=row(canonical); const metadata=target.querySelector(".schema-property-metadata").textContent; const index=beforeIdentities.indexOf(canonical);
    q('button[aria-label="Add rule for '+display+'"]',target).click(); click(q("#schema-property-rule-picker"),"Compatible strings version 1"); await pause();
    targets.push({ canonical, attached:stored().workingDraft.attachedRules.filter(({id,propertyPath})=>id==="rule:compatible-strings" && propertyPath===canonical).length, documentUnchanged:documentBytes()===before, oneRow:tree.querySelectorAll('[data-schema-property-canonical-path="'+canonical+'"]').length===1, metadata:row(canonical).querySelector(".schema-property-metadata").textContent===metadata, position:identities().indexOf(canonical)===index });
  }
  q("#close-schema-editor").click(); openPageView();
  const reopened={ documentUnchanged:documentBytes()===initialDocument, pageTypeRows:document.querySelectorAll('[data-schema-property-canonical-path="/page_type"]').length, pageTypeRules:stored().workingDraft.attachedRules.filter(({propertyPath})=>propertyPath==="/page_type").length, identities:identities() };
  return { initial,required,reusable,distinct,targets,reopened,runtimeErrors };
})()`;

const canonicalDeclaredPropertyValidationRuntime = `(async () => {
  const pause=()=>new Promise((resolve)=>setTimeout(resolve,0));
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const click=(root,label)=>{const value=Array.from(root.querySelectorAll("button")).find((button)=>button.textContent===label||button.textContent.startsWith(label));if(!value)throw new Error("Missing action "+label);value.click();return value;};
  const runtimeErrors=[]; addEventListener("error",(event)=>runtimeErrors.push(String(event.error??event.message))); addEventListener("unhandledrejection",(event)=>runtimeErrors.push(String(event.reason)));
  const verification=await import("/data-layer-schema-verification.js");
  const stored=()=>JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"));
  const child=()=>stored()[1]; const openPageView=()=>{const item=Array.from(q("#schema-list").children).find((candidate)=>candidate.textContent.includes("Generic pageview"));if(!item)throw new Error("Missing Generic pageview");click(item,"Edit working draft");};
  const event=(payload)=>({sourceId:"history",eventName:"pageview",payload,rawInput:[]});
  const draftSchema=()=>{const schemas=stored();const current=schemas[1];return {...current,document:current.workingDraft.document,attachedRules:current.workingDraft.attachedRules,parentSchemaId:current.workingDraft.parentSchemaId??current.parentSchemaId};};
  const validate=(payload,schema=draftSchema(),schemas=[stored()[0],schema])=>verification.validateWithSchema(event(payload),schema,schemas);
  q("#data-layer-view-schemas").click();openPageView();
  const checkbox=q("#schema-only-declared-properties");const propertiesBefore=JSON.stringify(child().workingDraft.document.properties);checkbox.checked=true;checkbox.dispatchEvent(new Event("change",{bubbles:true}));await pause();
  const declared=validate({page_type:"product",login_status:"logged in",page_levels:["product"]});
  const extra=validate({page_type:"product",login_status:"logged in",page_levels:["product"],debug:true});
  const policy={checked:checkbox.checked,stored:child().workingDraft.document.additionalProperties===false,propertiesUnchanged:JSON.stringify(child().workingDraft.document.properties)===propertiesBefore,declaredIssues:declared.issues.filter(({message})=>message==="Undeclared property").map(({instancePath})=>instancePath),extraIssues:extra.issues.filter(({message})=>message==="Undeclared property").map(({instancePath,expected,actual})=>({instancePath,expected,actual}))};
  const make=(name,document,parentSchemaId)=>({id:"case:"+name,name,version:1,document,assignments:[],...(parentSchemaId?{parentSchemaId}:{})});
  const representationCases=[];
  for(const [name,document,payload,canonical] of [
    ["nested",{type:"object",additionalProperties:false,properties:{page_type:{type:"string"}}},{page_type:"product"},"/page_type"],
    ["path-keyed",{type:"object",additionalProperties:false,properties:{"/page_type":{type:"string"}}},{page_type:"product"},"/page_type"],
    ["flat-array",{type:"object",additionalProperties:false,properties:{"/page_levels":{type:"array"},"/page_levels/0":{type:"string"}}},{page_levels:["product"]},"/page_levels"],
  ]){const schema=make(name,document);const result=validate(payload,schema,[schema]);representationCases.push({name,canonical,undeclared:result.issues.filter(({message})=>message==="Undeclared property").length,documentUnchanged:JSON.stringify(schema.document)===JSON.stringify(document)});}
  const pageCases={};
  for(const [name,payload] of [["missing",{}],["numeric",{page_type:42}],["disallowed",{page_type:"internal"}],["allowed",{page_type:"product"}]]){const result=validate(payload);pageCases[name]={issues:result.issues.filter(({instancePath})=>instancePath==="/page_type").map(({message})=>message),undeclared:result.issues.some(({instancePath,message})=>instancePath==="/page_type"&&message==="Undeclared property"),evaluations:(result.evaluations??[]).filter(({propertyPath})=>propertyPath==="/page_type").map(({propertyPath,rule,ruleVersion})=>({propertyPath,rule,ruleVersion}))};}
  const parentBytes=JSON.stringify(stored()[0].document);const childBytes=JSON.stringify(child().workingDraft.document);const inherited=validate({site_id:"otelo",page_type:"product",debug:true});
  const inheritance={undeclared:inherited.issues.filter(({message})=>message==="Undeclared property").map(({instancePath})=>instancePath),parentUnchanged:JSON.stringify(stored()[0].document)===parentBytes,childUnchanged:JSON.stringify(child().workingDraft.document)===childBytes};
  checkbox.checked=false;checkbox.dispatchEvent(new Event("change",{bubbles:true}));await pause();const openResult=validate({page_type:"product",debug:true});const disabled={stored:child().workingDraft.document.additionalProperties===undefined,undeclared:openResult.issues.filter(({message})=>message==="Undeclared property").length,ruleActive:(openResult.evaluations??[]).some(({propertyPath,status})=>propertyPath==="/page_type"&&status==="pass")};
  checkbox.checked=true;checkbox.dispatchEvent(new Event("change",{bubbles:true}));q("#save-schema").click();q("#confirm-schema-revision").click();await pause();await pause();
  const published=child();const publication={version:published.version,closed:!published.workingDraft,stored:published.document.additionalProperties===false,propertiesUnchanged:JSON.stringify(published.document.properties)===propertiesBefore,result:q("#schema-result").textContent};
  q("#data-layer-view-live").click();const feed=Array.from(q("#live-event-feed").querySelectorAll("button"));const feedRows=feed.map(({textContent,dataset})=>({textContent,eventId:dataset.eventId}));const extraButton=feed.find((button)=>button.dataset.eventId==="event:extra");if(!extraButton)throw new Error("Missing extra event");extraButton.click();
  const debugRow=q('[data-property-path="/debug"]');const live={feedRows,summary:q("#live-inspector-validation-summary").textContent,debug:q(".live-property-status",debugRow).textContent,debugRows:document.querySelectorAll('[data-property-path="/debug"]').length};
  q("#data-layer-view-schemas").click();openPageView();const reopened={checked:q("#schema-only-declared-properties").checked,propertiesUnchanged:JSON.stringify(child().document.properties)===propertiesBefore};
  return{policy,representationCases,pageCases,inheritance,disabled,publication,live,reopened,runtimeErrors};
})()`;

const defectReportUndeclaredRemovalRuntime = `(async () => {
  const pause=()=>new Promise((resolve)=>setTimeout(resolve,0));
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const click=(label,root=document)=>{const value=Array.from(root.querySelectorAll("button")).find((button)=>button.textContent===label||button.textContent.startsWith(label));if(!value)throw new Error("Missing action "+label);value.click();return value;};
  const runtimeErrors=[];addEventListener("error",(event)=>runtimeErrors.push(String(event.error??event.message)));addEventListener("unhandledrejection",(event)=>runtimeErrors.push(String(event.reason)));
  const richWrites=[],plainWrites=[];let failRich=false;
  Object.defineProperty(navigator,"clipboard",{configurable:true,value:{
    write:async(items)=>{if(failRich)throw new Error("rich unavailable");const item=items[0];richWrites.push({html:await (await item.getType("text/html")).text(),text:await (await item.getType("text/plain")).text()});},
    writeText:async(text)=>plainWrites.push(text),
  }});
  const verification=await import("/data-layer-schema-verification.js");const observer=await import("/data-layer-live-observer.js");const observerUi=await import("/data-layer-live-observer-ui.js");const inspectorActions=await import("/data-layer-live-inspector-actions.js");const reportUi=await import("/data-layer-defect-report-ui.js");const defects=await import("/data-layer-defect-library.js");
  const schema=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"))[0];const payload={page_type:"product_detail",debug:true};const result=verification.validateWithSchema({sourceId:"history",eventName:"pageview",payload,rawInput:["pageview",payload]},schema,[schema]);
  const event={id:"event:undeclared",name:"pageview",sourceId:"history",sourceName:"Event history",captureTime:"2026-07-15T10:00:00Z",pageUrl:"https://shop.example/product",payload,rawInput:["pageview",payload],validation:result.state,validationDetails:{issues:result.issues,evaluations:result.evaluations,schema:result.schema}};
  const host=document.createElement("section");host.style.width="320px";host.innerHTML='<section id="data-layer-panel-live"><section id="live-event-list"><ul id="live-event-feed"></ul></section><aside id="live-event-inspector"></aside><button id="back-to-events"></button><div id="live-source-statuses"></div></section>';document.body.append(host);const elements=observerUi.findLiveObserverElements(host);observerUi.renderLiveObserverState(elements,{...observer.createLiveObserverState({pageUrl:event.pageUrl,sources:[]}),events:[event],inspectorEventId:event.id,listVisible:false},()=>{});
  let savedId="";const actions=inspectorActions.createLiveInspectorActions({currentPageUrl:()=>event.pageUrl,writeClipboard:async()=>{},storeTemplate:()=>{},startDefectReport:(selected)=>reportUi.renderDefectReportBuilder(elements.eventInspector,selected,undefined,[selected],undefined,{save:async(report)=>{const defect=defects.createValidationDefect({id:"defect:undeclared",now:"2026-07-15T10:01:00Z",report,issues:defects.currentDefectIssues(selected)});savedId=defect.id;localStorage.setItem(defects.DEFECT_LIBRARY_STORAGE_KEY,defects.serializeDefectLibrary({defects:[defect]}));return{feedback:"Reported defect saved."};},openExisting:()=>{},updateExisting:()=>{}}),validationState:()=>result.state,updateValidation:()=>{},manualSchemaChoices:()=>[],selectManualSchema:()=>{}});observerUi.renderLiveInspector(elements,event,actions);
  const inspector=q("#live-event-inspector",host);const validationText=inspector.textContent;
  const sessionBefore=JSON.parse(localStorage.getItem("dataLayerTestingSession"));
  const recordedEvent=sessionBefore.session.timeline.find(({id})=>id==="event:undeclared");
  const payloadBytes=JSON.stringify(recordedEvent.payload);
  const validationBytes=JSON.stringify(result);
  const createAction=Array.from(inspector.querySelectorAll("button")).find(({textContent})=>textContent==="Create defect report");if(!createAction)throw new Error("Missing production Create defect report action");createAction.click();await pause();
  const builder=q("#live-event-inspector",host);const preview=q('[aria-label="Final report preview"]',builder);const group=q('[aria-label="debug expected-result assistance"]',builder);const checkbox=q("#defect-issue-debug",builder);const removal=group.querySelector("input");
  const expectedSection=()=>{const heading=Array.from(preview.querySelectorAll("h2")).find(({textContent})=>textContent==="Expected result");return heading?.nextElementSibling?.nextElementSibling?.textContent??"";};
  const initial={validationText,issueLabel:checkbox.nextElementSibling?.textContent,removalLabel:group.textContent,selected:removal?.checked,inputCount:group.querySelectorAll("input").length,expected:expectedSection(),preview:preview.textContent};
  builder.style.height="600px";builder.style.overflow="auto";builder.scrollTop=41;checkbox.focus();checkbox.click();await pause();const deselected={expected:expectedSection(),scroll:builder.scrollTop,focus:document.activeElement===checkbox};checkbox.click();await pause();const reselected={expected:expectedSection(),removals:(preview.textContent.match(/was removed from the expected payload/g)||[]).length,scroll:builder.scrollTop,focus:document.activeElement===checkbox};
  click("Copy for Jira Cloud",builder);await pause();await pause();failRich=true;click("Copy for Jira Cloud",builder);await pause();await pause();
  const previewBeforeSave=preview.textContent;click("Save as reported defect",builder);await pause();await pause();
  const stored=defects.restoreDefectLibrary(localStorage.getItem(defects.DEFECT_LIBRARY_STORAGE_KEY));const saved=stored.defects.find(({id})=>id===savedId);const exportModule=await import("/data-layer-defect-report-export.js");const reopened=exportModule.renderJiraReport(saved.report).text;plainWrites.push(reopened);
  const reportBrowser=await import("/data-layer-defect-report-browser.js");const reportCore=await import("/data-layer-defect-report-core.js");const declared={...schema,version:5,document:{...schema.document,properties:{...schema.document.properties,debug:{type:"boolean"}}}};const refreshedInput={sourceId:"history",eventName:"pageview",payload:{page_type:"product_detail",debug:true},rawInput:[]};const refreshed=verification.validateWithSchema(refreshedInput,declared,[declared]);const refreshedLive={id:"event:refreshed",name:"pageview",sourceId:"history",sourceName:"Event history",captureTime:"2026-07-15T10:02:00Z",pageUrl:"https://shop.example/product",payload:refreshedInput.payload,validation:refreshed.state,validationDetails:{issues:refreshed.issues,evaluations:refreshed.evaluations,schema:refreshed.schema}};const refreshedReport=reportCore.createDefectReport(reportBrowser.defectCapturedEvent(refreshedLive));
  const afterSession=JSON.parse(localStorage.getItem("dataLayerTestingSession"));const afterEvent=afterSession.session.timeline.find(({id})=>id==="event:undeclared");
  return {initial,deselected,reselected,clipboard:{rich:richWrites[0],plain:plainWrites[0]},previewBeforeSave,saved:{expected:saved.report.expected.payload,corrections:saved.report.expected.corrections,evidence:saved.report.evidence},reopened,recopied:plainWrites.at(-1),refreshed:{issues:refreshed.issues,corrections:refreshedReport.expected.corrections},historicalExpected:saved.report.expected.payload,immutable:{payload:JSON.stringify(afterEvent.payload)===payloadBytes,validation:JSON.stringify(result)===validationBytes},layout:{body:document.documentElement.scrollWidth,width:innerWidth,group:group.getBoundingClientRect().width,builder:builder.getBoundingClientRect().width},runtimeErrors};
})()`;

const requiredPropertyDefectSchemaChoicesRuntime = `(async () => {
  const pause=()=>new Promise((resolve)=>setTimeout(resolve,0));
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const click=(label,root=document)=>{const value=Array.from(root.querySelectorAll("button")).find((button)=>button.textContent===label||button.textContent.startsWith(label));if(!value)throw new Error("Missing action "+label);value.click();return value;};
  const runtimeErrors=[];addEventListener("error",(event)=>runtimeErrors.push(String(event.error??event.message)));addEventListener("unhandledrejection",(event)=>runtimeErrors.push(String(event.reason)));
  const richWrites=[],plainWrites=[];let failRich=false;
  Object.defineProperty(navigator,"clipboard",{configurable:true,value:{
    write:async(items)=>{if(failRich)throw new Error("rich unavailable");const item=items[0];richWrites.push({html:await (await item.getType("text/html")).text(),text:await (await item.getType("text/plain")).text()});},
    writeText:async(text)=>plainWrites.push(text),
  }});
  const verification=await import("/data-layer-schema-verification.js");const observer=await import("/data-layer-live-observer.js");const observerUi=await import("/data-layer-live-observer-ui.js");const inspectorActions=await import("/data-layer-live-inspector-actions.js");const reportUi=await import("/data-layer-defect-report-ui.js");const defects=await import("/data-layer-defect-library.js");const exportModule=await import("/data-layer-defect-report-export.js");
  const assigned={id:"schema:pageview",name:"Generic pageview",version:7,published:true,document:{type:"object",required:["page_type"],properties:{page_type:{type:"string"}}},assignments:[],attachedRules:[{id:"rule:page-types",name:"Allowed page types",version:3,propertyPath:"/page_type",operator:"allowed-values",allowedValues:["product_detail","product_listing"],applicableType:"string"}]};
  const payload={};const validation=verification.validateWithSchema({sourceId:"history",eventName:"pageview",payload,rawInput:["pageview",payload]},assigned,[assigned]);
  const event={id:"event:missing-page-type",name:"pageview",sourceId:"history",sourceName:"Event history",captureTime:"2026-07-15T11:00:00Z",pageUrl:"https://shop.example/product",payload,rawInput:["pageview",payload],validation:validation.state,validationDetails:{issues:validation.issues,evaluations:validation.evaluations,schema:validation.schema}};
  const immutableBytes=JSON.stringify({payload,validation,assigned});
  const host=document.createElement("section");host.style.width="320px";host.innerHTML='<section id="required-choice-live"><section id="live-event-list"><ul id="live-event-feed"></ul></section><aside id="live-event-inspector"></aside><button id="back-to-events"></button><div id="live-source-statuses"></div></section>';document.body.append(host);const elements=observerUi.findLiveObserverElements(host);observerUi.renderLiveObserverState(elements,{...observer.createLiveObserverState({pageUrl:event.pageUrl,sources:[]}),events:[event],inspectorEventId:event.id,listVisible:false},()=>{});
  let savedReport;const persistence={save:async(report)=>{savedReport=report;const defect=defects.createValidationDefect({id:"defect:required-choice",now:"2026-07-15T11:01:00Z",report,issues:defects.currentDefectIssues(event)});localStorage.setItem(defects.DEFECT_LIBRARY_STORAGE_KEY,defects.serializeDefectLibrary({defects:[defect]}));return{feedback:"Reported defect saved."};},openExisting:()=>{},updateExisting:()=>{}};
  const actions=inspectorActions.createLiveInspectorActions({currentPageUrl:()=>event.pageUrl,writeClipboard:async()=>{},storeTemplate:()=>{},startDefectReport:(selected)=>reportUi.renderDefectReportBuilder(elements.eventInspector,selected,undefined,[selected],undefined,persistence),validationState:()=>validation.state,updateValidation:()=>{},manualSchemaChoices:()=>[],selectManualSchema:()=>{}});observerUi.renderLiveInspector(elements,event,actions);
  const inspector=q("#live-event-inspector",host);const validationText=inspector.textContent;click("Create defect report",inspector);await pause();
  const builder=q("#live-event-inspector",host);const preview=q('[aria-label="Final report preview"]',builder);const group=q('[aria-label="page_type expected-result assistance"]',builder);const issue=q("#defect-issue-page_type",builder);const productDetail=q('input[value="product_detail"]',group);const productListing=q('input[value="product_listing"]',group);
  const allowedEvaluation=validation.evaluations.find(({operator})=>operator==="allowed-values");const initial={validationText,issues:validation.issues.map(({message})=>message),evaluation:{status:allowedEvaluation?.status,reason:allowedEvaluation?.notApplicableReason},choices:Array.from(group.querySelectorAll('input[type="radio"]')).map(({value,dataset,nextSibling})=>({value,source:dataset.responseSource,label:nextSibling?.textContent??""})),issue:issue.nextElementSibling?.textContent,actual:preview.textContent};
  productDetail.click();await pause();const selectedPreview=preview.textContent;builder.style.height="600px";builder.style.overflow="auto";builder.scrollTop=43;issue.focus({preventScroll:true});issue.click();await pause();const deselected={preview:preview.textContent,scroll:builder.scrollTop,focus:document.activeElement===issue};issue.click();await pause();const reselected={preview:preview.textContent,scroll:builder.scrollTop,focus:document.activeElement===issue};productListing.focus({preventScroll:true});productListing.click();await pause();const changed={preview:preview.textContent,scroll:builder.scrollTop,focus:document.activeElement===productListing,inputs:group.querySelectorAll('input[value="product_listing"]').length};
  productDetail.click();await pause();click("Copy for Jira Cloud",builder);await pause();await pause();failRich=true;click("Copy for Jira Cloud",builder);await pause();await pause();click("Save as reported defect",builder);await pause();await pause();
  const stored=defects.restoreDefectLibrary(localStorage.getItem(defects.DEFECT_LIBRARY_STORAGE_KEY)).defects[0];const reopened=exportModule.renderJiraReport(stored.report).text;plainWrites.push(reopened);
  const renderCase=async(pointer,values,type,selected,extraRules=[])=>{const casePayload=pointer.startsWith("/products/")?{products:[{}]}:pointer.startsWith("/commerce/")?{commerce:{}}:{};const schema={id:"schema:case:"+pointer,name:"Generic pageview",version:7,published:true,document:{type:"object",properties:{}},assignments:[],attachedRules:[{id:"required:"+pointer,name:"Required property",version:1,propertyPath:pointer,operator:"required"},{id:"values:"+pointer,name:"Permitted values",version:2,propertyPath:pointer,operator:"allowed-values",allowedValues:values,applicableType:type},...extraRules]};const result=verification.validateWithSchema({sourceId:"history",eventName:"pageview",payload:casePayload,rawInput:[]},schema,[schema]);const live={id:"case:"+pointer,name:"pageview",sourceId:"history",captureTime:"2026-07-15T11:02:00Z",pageUrl:"https://shop.example/",payload:casePayload,validation:result.state,validationDetails:{issues:result.issues,evaluations:result.evaluations,schema:result.schema}};const root=document.createElement("section");document.body.append(root);let report;reportUi.renderDefectReportBuilder(root,live,undefined,[live],undefined,{save:async(value)=>{report=value;return{feedback:"saved"};},openExisting:()=>{},updateExisting:()=>{}});const control=Array.from(root.querySelectorAll('input[type="radio"]')).find((input)=>input.value===String(selected));if(!control)throw new Error("Missing rendered choice "+String(selected)+" for "+pointer);control.click();click("Save as reported defect",root);await pause();const observation={pointer,values:Array.from(root.querySelectorAll('input[type="radio"]')).map(({value})=>value).filter(Boolean),expected:report.expected.payload,type:typeof report.expected.corrections[0]?.response,operation:report.expected.corrections[0]?.operation};root.remove();return observation;};
  const typed=[await renderCase("/page_type",["product","content"],"string","content"),await renderCase("/market_id",[1,2],"number",2),await renderCase("/logged_in",[true,false],"boolean",false)];
  const pointers=[await renderCase("/commerce/currency",["EUR"],"string","EUR"),await renderCase("/products/0/name",["robot"],"string","robot",[{id:"shadow",name:"Wildcard names",version:1,propertyPath:"/products/*/name",operator:"allowed-values",allowedValues:["robot"],applicableType:"string"}]),await renderCase("/a~1b",["enabled"],"string","enabled"),await renderCase("/tilde~0name",["retained"],"string","retained")];
  const choiceModule=await import("/data-layer-defect-schema-choices.js");const evaluation=(overrides={})=>({propertyPath:"/page_type",status:"not-applicable",message:"optional target is absent",expected:"value",actual:"missing",rule:"Allowed page types",ruleVersion:3,severity:"error",schemaName:"Generic pageview",schemaVersion:7,ruleId:"rule:values",schemaId:assigned.id,operator:"allowed-values",allowedValues:["product_detail","product_listing"],notApplicableReason:"target-absent",...overrides});const resolve=(evaluations)=>choiceModule.resolveRequiredPropertySchemaChoices({issuePointer:"/page_type",assignedSchema:assigned,evaluations});
  const effectiveEvaluations=[evaluation(),evaluation({rule:"Exact page type",ruleId:"rule:exact",operator:"exact-value",allowedValues:["product_detail"]}),evaluation({rule:"Disabled",ruleId:"rule:disabled",allowedValues:["other"],notApplicableReason:"condition-not-satisfied"})];const conflictEvaluations=[evaluation({rule:"Products",allowedValues:["product_detail"]}),evaluation({rule:"Listings",ruleId:"rule:listings",allowedValues:["product_listing"]})];const retailEvaluations=[evaluation()];const tradeEvaluations=[evaluation({notApplicableReason:"condition-not-satisfied"})];const effective=resolve(effectiveEvaluations);const conflict=resolve(conflictEvaluations);const conditional={retail:resolve(retailEvaluations).values,trade:resolve(tradeEvaluations).values};
  const assistanceUi=(evaluations)=>{const root=document.createElement("section");document.body.append(root);const live={...event,id:"assistance:"+Math.random(),validationDetails:{...event.validationDetails,evaluations}};reportUi.renderDefectReportBuilder(root,live);const controls=q('[aria-label="page_type expected-result assistance"]',root);const observed={schema:Array.from(controls.querySelectorAll('input[type="radio"]')).filter(({dataset})=>dataset.responseSource==="Generic pageview revision 7").map(({value})=>value),generic:controls.textContent.includes("Use generic constraint"),custom:controls.textContent.includes("Custom value or response"),conflict:controls.querySelector('[data-schema-choice-conflict]')?.textContent??""};root.remove();return observed;};const rendered={effective:assistanceUi(effectiveEvaluations),conflict:assistanceUi(conflictEvaluations),retail:assistanceUi(retailEvaluations),trade:assistanceUi(tradeEvaluations),noRule:assistanceUi([])};
  return {initial,selectedPreview,deselected,reselected,changed,clipboard:{rich:richWrites[0],plain:plainWrites[0]},saved:{expected:savedReport.expected.payload,corrections:savedReport.expected.corrections,evidence:savedReport.evidence},reopened,recopied:plainWrites.at(-1),typed,pointers,effective,conflict,conditional,noRule:resolve([]),rendered,immutable:immutableBytes===JSON.stringify({payload,validation,assigned}),layout:{body:document.documentElement.scrollWidth,width:innerWidth,group:group.getBoundingClientRect().width,builder:builder.getBoundingClientRect().width},runtimeErrors};
})()`;

const defectReportSemanticDifferencesRuntime = `(async () => {
  const pause=()=>new Promise((resolve)=>setTimeout(resolve,0));
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const click=(label,root=document)=>{const value=Array.from(root.querySelectorAll("button")).find((button)=>button.textContent===label||button.textContent.startsWith(label));if(!value)throw new Error("Missing action "+label);value.click();return value;};
  const differences=(text)=>text.match(/Differences\\n([\\s\\S]*?)\\n\\nValidation evidence/)?.[1]??"";
  const runtimeErrors=[];addEventListener("error",(event)=>runtimeErrors.push(String(event.error??event.message)));addEventListener("unhandledrejection",(event)=>runtimeErrors.push(String(event.reason)));
  const richWrites=[],plainWrites=[];let failRich=false;
  Object.defineProperty(navigator,"clipboard",{configurable:true,value:{write:async(items)=>{if(failRich)throw new Error("rich unavailable");const item=items[0];richWrites.push({html:await (await item.getType("text/html")).text(),text:await (await item.getType("text/plain")).text()});},writeText:async(text)=>plainWrites.push(text)}});
  localStorage.clear();
  const verification=await import("/data-layer-schema-verification.js");const observer=await import("/data-layer-live-observer.js");const observerUi=await import("/data-layer-live-observer-ui.js");const inspectorActions=await import("/data-layer-live-inspector-actions.js");const reportUi=await import("/data-layer-defect-report-ui.js");const reportCore=await import("/data-layer-defect-report-core.js");const reportBrowser=await import("/data-layer-defect-report-browser.js");const exportModule=await import("/data-layer-defect-report-export.js");const defects=await import("/data-layer-defect-library.js");const defectLibraryUi=await import("/data-layer-defect-library-ui.js");
  const schema={id:"schema:error",name:"Error event",version:3,published:true,document:{type:"object",additionalProperties:false,required:["error_action","error_code"],properties:{error_action:{type:"string"},error_code:{type:"string"}}},assignments:[],attachedRules:[]};
  const payload={action:"checkout",code:500};const validation=verification.validateWithSchema({sourceId:"history",eventName:"error",payload,rawInput:["error",payload]},schema,[schema]);
  const event={id:"event:semantic",name:"error",sourceId:"history",sourceName:"Event history",captureTime:"2026-07-15T07:00:00Z",pageUrl:"https://shop.example/error",payload,rawInput:["error",payload],validation:validation.state,validationDetails:{issues:validation.issues,evaluations:validation.evaluations,schema:validation.schema}};
  const immutableBytes=JSON.stringify({payload,validation,schema});
  const host=document.createElement("section");host.style.width="320px";host.innerHTML='<section><section id="live-event-list"><ul id="live-event-feed"></ul></section><aside id="live-event-inspector"></aside><button id="back-to-events"></button><div id="live-source-statuses"></div></section>';document.body.append(host);const elements=observerUi.findLiveObserverElements(host);observerUi.renderLiveObserverState(elements,{...observer.createLiveObserverState({pageUrl:event.pageUrl,sources:[]}),events:[event],inspectorEventId:event.id,listVisible:false},()=>{});
  let savedDefect;const persistence={save:async(report)=>{savedDefect=defects.createValidationDefect({id:"defect:semantic",now:"2026-07-15T07:01:00Z",report,issues:defects.currentDefectIssues(event)});localStorage.setItem(defects.DEFECT_LIBRARY_STORAGE_KEY,defects.serializeDefectLibrary({defects:[savedDefect]}));return{feedback:"Reported defect saved."};},openExisting:()=>{},updateExisting:()=>{}};
  const actions=inspectorActions.createLiveInspectorActions({currentPageUrl:()=>event.pageUrl,writeClipboard:async()=>{},storeTemplate:()=>{},startDefectReport:(selected)=>reportUi.renderDefectReportBuilder(elements.eventInspector,selected,undefined,[selected],undefined,persistence),validationState:()=>validation.state,updateValidation:()=>{},manualSchemaChoices:()=>[],selectManualSchema:()=>{}});observerUi.renderLiveInspector(elements,event,actions);
  const inspector=q("#live-event-inspector",host);click("Create defect report",inspector);await pause();const builder=q("#live-event-inspector",host);const preview=q('[aria-label="Final report preview"]',builder);
  const chooseCustom=(issueId,value)=>{const group=q('[aria-label="'+issueId+' expected-result assistance"]',builder);q('input[data-response-source="Custom value or response"]',group).click();const response=q('input[placeholder="Custom value or response"]',group);response.value=value;response.dispatchEvent(new InputEvent("input",{bubbles:true,data:value,inputType:"insertText"}));};
  chooseCustom("error_action","checkout");chooseCustom("error_code","500");await pause();
  const lines=()=>Array.from(preview.querySelectorAll('[data-difference-group]')).map((line)=>({group:line.dataset.differenceGroup,issueId:line.dataset.issueId,pointer:line.dataset.jsonPointer,operation:line.dataset.operation??null,violation:line.dataset.violation??null,presence:line.dataset.actualPresence??null,text:line.textContent}));
  const initial={issues:validation.issues.map(({instancePath,message})=>[instancePath,message]),lines:lines()};
  builder.style.height="600px";builder.style.overflow="auto";builder.scrollTop=47;const required=q("#defect-issue-error_action",builder);required.focus({preventScroll:true});required.click();await pause();const deselected={lines:lines(),focus:document.activeElement===required,scroll:builder.scrollTop};required.click();await pause();const reselected={lines:lines(),focus:document.activeElement===required,scroll:builder.scrollTop};
  click("Copy for Jira Cloud",builder);await pause();await pause();failRich=true;click("Copy for Jira Cloud",builder);await pause();await pause();click("Save as reported defect",builder);await pause();await pause();
  const stored=defects.restoreDefectLibrary(localStorage.getItem(defects.DEFECT_LIBRARY_STORAGE_KEY)).defects[0];const savedRendered=exportModule.renderJiraReport(stored.report);let recopied="";const detail=document.createElement("section");document.body.append(detail);defectLibraryUi.renderDefectLibrary({count:null,list:null,empty:null,detail,confirmation:null},[stored],stored.id,undefined,{open:()=>{},close:()=>{},save:()=>{},recopy:()=>{recopied=exportModule.renderJiraReport(stored.report).text;},updateStatus:()=>{},attachCurrentSession:()=>{},openLinkedSession:()=>{},requestDelete:()=>{},cancelDelete:()=>{},confirmDelete:()=>{}});click("Recopy for Jira Cloud",detail);const reopened=q('[aria-label="Final report preview"]',detail);
  const semantic={rich:differences(richWrites[0].text),plain:differences(plainWrites[0]),saved:differences(savedRendered.text),reopened:Array.from(reopened.querySelectorAll('[data-difference-group]')).map(({textContent})=>textContent).join("\\n"),recopied:differences(recopied)};
  const mappings={actual:["Undeclared property","Required value","Value is not allowed","Type mismatch","Value is not exact","Value violates partner contract",undefined].map((violation)=>exportModule.actualDifferenceDescription({violation,actualPresence:violation==="Required value"?"missing":"present"})),expected:["add","replace","remove","none"].map((operation)=>exportModule.expectedDifferenceDescription({operation}))};
  const pointerCases=["/commerce/currency","/products/0/name","/a~1b","/tilde~0name"].map((pointer)=>{const generated=structuredClone(stored.report);generated.actual.differences=[{issueId:"pointer-case",pointer,violation:"Value is not allowed",actualPresence:"present",marker:"−",treatment:"red",value:"bad"}];generated.expected.corrections=[{issueId:"pointer-case",pointer,operation:"replace",marker:"+"}];const rendered=exportModule.renderJiraReport(generated);return{pointer,text:differences(rendered.text),html:(()=>{const root=document.createElement("section");root.innerHTML=rendered.html;return Array.from(root.querySelectorAll('[data-difference-group]')).map(({textContent})=>textContent).join("\\n");})()};});
  const duplicateEvent={...reportBrowser.defectCapturedEvent(event),issues:[{id:"same-a",severity:"error",pointer:"/action",violation:"Value is not allowed",constraint:"known",actual:"checkout",rule:"one",ruleVersion:1},{id:"same-b",severity:"error",pointer:"/action",violation:"Value is not exact",constraint:"exact",actual:"checkout",rule:"two",ruleVersion:1}]};const duplicate=reportCore.createDefectReport(duplicateEvent);const duplicateRendered=exportModule.renderJiraReport(exportModule.generateReportDetails(duplicate));
  const legacy=structuredClone(stored);delete legacy.report.actual.differences[0].violation;const legacyBytes=JSON.stringify(legacy);const legacyDetail=document.createElement("section");document.body.append(legacyDetail);defectLibraryUi.renderDefectLibrary({count:null,list:null,empty:null,detail:legacyDetail,confirmation:null},[legacy],legacy.id,undefined,{open:()=>{},close:()=>{},save:()=>{},recopy:()=>{},updateStatus:()=>{},attachCurrentSession:()=>{},openLinkedSession:()=>{},requestDelete:()=>{},cancelDelete:()=>{},confirmDelete:()=>{}});const legacyLine=q('[data-difference-group="actual"]',legacyDetail).textContent;
  return{initial,deselected,reselected,semantic,mappings,pointerCases,duplicate:differences(duplicateRendered.text),legacy:{line:legacyLine,unchanged:legacyBytes===JSON.stringify(legacy)},immutable:immutableBytes===JSON.stringify({payload,validation,schema}),layout:{body:document.documentElement.scrollWidth,width:innerWidth,builder:builder.getBoundingClientRect().width,lines:Array.from(preview.querySelectorAll('[data-difference-group]')).every((line)=>line.scrollWidth<=builder.scrollWidth)},runtimeErrors};
})()`;

const schemaPropertyCopyRuntime = `(async () => {
  const pause=()=>new Promise((resolve)=>setTimeout(resolve,0));const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};const click=(root,label)=>{const value=Array.from(root.querySelectorAll("button")).find((button)=>button.textContent===label||button.textContent.startsWith(label));if(!value)throw new Error("Missing action "+label);value.click();return value;};
  const runtimeErrors=[];addEventListener("error",(event)=>runtimeErrors.push(String(event.error??event.message)));addEventListener("unhandledrejection",(event)=>runtimeErrors.push(String(event.reason)));
  q("#data-layer-view-schemas").click();const schemaItem=(name)=>Array.from(q("#schema-list").children).find((item)=>item.textContent.includes(name));const open=(name)=>{const item=schemaItem(name);if(!item)throw new Error("Missing schema "+name);click(item,"Edit working draft");};open("Generic pageview");
  const editor=q("#schema-editor");const tree=q("#schema-property-tree");const row=()=>q('[data-schema-property-canonical-path="/error_message"]',tree);const action=()=>Array.from(row().querySelectorAll("button")).find((button)=>button.textContent==="Copy to another schema");if(!action())throw new Error("Missing property copy action");editor.style.height="560px";editor.style.overflow="auto";tree.style.height="300px";tree.style.overflow="auto";editor.scrollTop=51;tree.scrollTop=37;action().focus({preventScroll:true});action().click();await pause();
  const dialog=q("#schema-property-copy-dialog");const destination=q("#schema-property-copy-destination",dialog);const beforeLibrary=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"));const beforeDestination=beforeLibrary.find(({id})=>id==="schema:in-page");const beforeSource=beforeLibrary.find(({id})=>id==="schema:pageview");destination.value="schema:in-page";destination.dispatchEvent(new Event("change",{bubbles:true}));await pause();const review=q('[aria-label="Schema property copy review"]',dialog);const reviewState={open:dialog.open,text:review.textContent,source:q("p",dialog).textContent,destinations:Array.from(destination.options).map(({textContent})=>textContent),unchanged:JSON.stringify(beforeLibrary)===localStorage.getItem("my-chrome-utilities.schema-library.v1"),width:dialog.getBoundingClientRect().width,scrollWidth:dialog.scrollWidth};
  click(dialog,"Copy to selected schema");await pause();await pause();let stored=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"));let copied=stored.find(({id})=>id==="schema:in-page");const sourceAfter=stored.find(({id})=>id==="schema:pageview");const applied={publishedUnchanged:copied.version===3&&!copied.document.properties.error_message,paths:["error_message","error_action","error_type"].filter((path)=>copied.workingDraft.document.properties[path]),rules:copied.workingDraft.attachedRules.map(({id,copySourceRuleId})=>({id,copySourceRuleId})),documentation:Object.keys(copied.workingDraft.documentation.properties),pending:copied.workingDraft.pendingChanges,sourceUnchanged:JSON.stringify(sourceAfter)===JSON.stringify(beforeSource),assignment:copied.workingDraft.assignments[0].eventName,focus:document.activeElement?.getAttribute("aria-label"),scroll:{editor:editor.scrollTop,tree:tree.scrollTop}};
  q("#schema-property-copy-feedback").textContent;click(document,"Undo property copy");await pause();stored=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"));const undone=stored.find(({id})=>id==="schema:in-page");const undo={equivalent:JSON.stringify(undone)===JSON.stringify(beforeDestination),feedback:q("#schema-property-copy-feedback").textContent};
  action().click();await pause();const dialog2=q("#schema-property-copy-dialog");const destination2=q("#schema-property-copy-destination",dialog2);destination2.value="schema:in-page";destination2.dispatchEvent(new Event("change",{bubbles:true}));click(dialog2,"Copy to selected schema");await pause();stored=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"));copied=stored.find(({id})=>id==="schema:in-page");
  return{review:reviewState,applied,undo,persisted:{pending:copied.workingDraft.pendingChanges.length,path:copied.workingDraft.document.properties.error_message.type},layout:{body:document.documentElement.scrollWidth,width:innerWidth},runtimeErrors};
})()`;

const schemaAssignmentDataConditionsRuntime = `(async () => {
  const pause=()=>new Promise((resolve)=>setTimeout(resolve,0));
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const click=(root,label)=>{const value=Array.from(root.querySelectorAll("button")).find((button)=>button.textContent===label||button.textContent.startsWith(label));if(!value)throw new Error("Missing action "+label);value.click();return value;};
  const change=(control,value)=>{control.value=value;control.dispatchEvent(new Event("change",{bubbles:true}));};
  const runtimeErrors=[];addEventListener("error",(event)=>runtimeErrors.push(String(event.error??event.message)));addEventListener("unhandledrejection",(event)=>runtimeErrors.push(String(event.reason)));
  const conditions=await import("/data-layer-schema-assignment-data-conditions.js");
  const verification=await import("/data-layer-schema-verification.js");
  q("#data-layer-view-schemas").click();q("#schema-subview-assignments").click();
  const assignmentList=q("#schema-assignment-list");const legacyRow=()=>Array.from(assignmentList.children).find((item)=>item.textContent.includes("Legacy assignment"));
  click(legacyRow(),"Edit");await pause();const editor=q("#schema-assignment-editor");editor.style.height="480px";editor.style.overflow="auto";
  const absent={summary:q("#schema-assignment-condition-summary").textContent,saveDisabled:q("#save-schema-assignment").disabled};
  click(editor,"Add Data layer conditions");await pause();const empty={assistance:q("#schema-assignment-condition-assistance").textContent,saveDisabled:q("#save-schema-assignment").disabled};
  change(q("#schema-assignment-condition-group-operator"),"Any");
  const addPath=async(path)=>{click(editor,"Add condition");await pause();const rows=q("#schema-assignment-condition-predicates").children;const row=rows[rows.length-1];change(q('input[data-assignment-condition-control="path"]',row),path);await pause();};
  await addPath("/errorType");await addPath("/siteStructure");await addPath("/siteArea");
  const conditionRoot=q("#schema-assignment-data-conditions");conditionRoot.style.height="260px";conditionRoot.style.overflow="auto";conditionRoot.scrollTop=41;const secondPath=q('[data-assignment-condition-predicate="1"] input[data-assignment-condition-control="path"]',conditionRoot);secondPath.focus({preventScroll:true});change(secondPath,"/siteStructure");await pause();
  const editorState={target:q("#schema-assignment-condition-target").value,operator:q("#schema-assignment-condition-group-operator").value,paths:Array.from(conditionRoot.querySelectorAll('input[data-assignment-condition-control="path"]')).map(({value})=>value),summary:q("#schema-assignment-condition-summary").textContent,saveDisabled:q("#save-schema-assignment").disabled,focus:document.activeElement?.value,scroll:conditionRoot.scrollTop};
  click(editor,"Save assignment");await pause();
  let stored=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"));let legacy=stored.find(({id})=>id==="schema:legacy");let current=stored.find(({id})=>id==="schema:current");const saved=legacy.assignments[0];
  q("#schema-subview-assignments").click();await pause();const savedRow=()=>Array.from(q("#schema-assignment-list").children).find((item)=>item.textContent.includes("Legacy assignment"));
  const persisted={target:saved.conditionTarget,operator:saved.dataConditionGroup.operator,paths:saved.dataConditionGroup.predicates.map(({propertyPath})=>propertyPath),priority:saved.priority,summary:savedRow().textContent};
  click(savedRow(),"Duplicate");await pause();stored=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"));legacy=stored.find(({id})=>id==="schema:legacy");const duplicated=legacy.assignments.find(({id})=>id.endsWith(":copy"));const duplicate={count:legacy.assignments.length,equivalent:JSON.stringify(duplicated.dataConditionGroup)===JSON.stringify(saved.dataConditionGroup),independent:duplicated.dataConditionGroup!==saved.dataConditionGroup};
  const legacyForResolution={...legacy,assignments:[saved]};const event=(payload,rawInput=payload)=>({sourceId:"event-history",eventName:"generic_event",payload,rawInput});const url="https://shop.example/generic";
  const resolve=(payload,schemas=[legacyForResolution,current])=>verification.resolveSchemaAssignment(event(payload),url,schemas);
  const families=[{payload:{errorType:"business"},expected:"Legacy generic event"},{payload:{siteStructure:"shop",siteArea:"checkout"},expected:"Legacy generic event"},{payload:{error_type:"business"},expected:"Current generic event"},{payload:{page_levels:["one"],site_section:"checkout"},expected:"Current generic event"},{payload:{unrelated:true},expected:undefined}].map(({payload,expected})=>{const result=resolve(payload);return{expected,selected:result.schema?.name,evidence:result.evidence.summary};});
  const mixed={errorType:"legacy",error_type:"current"};const legacyWins=resolve(mixed);const currentHigh={...current,assignments:current.assignments.map((assignment)=>({...assignment,priority:30}))};const currentWins=resolve(mixed,[legacyForResolution,currentHigh]);const tied={...current,assignments:current.assignments.map((assignment)=>({...assignment,priority:20}))};const tie=resolve(mixed,[legacyForResolution,tied]);
  const priority={legacy:legacyWins.schema?.name,current:currentWins.schema?.name,tie:tie.error,legacyDiagnostic:legacyWins.evidence.summary,tieDiagnostic:tie.evidence.summary};
  const pred=(propertyPath,operator,extra={})=>({propertyPath,operator,detectedType:extra.detectedType??"string",...(extra.comparison?{comparison:extra.comparison}:{}),...(extra.comparisons?{comparisons:extra.comparisons}:{})});const any=(...predicates)=>({operator:"Any",predicates});const text=(value)=>({type:"string",value});const number=(value)=>({type:"number",value});
  const cases=[
    conditions.evaluateAssignmentDataConditions({},any(pred("/missing","Exists"))).matched,
    conditions.evaluateAssignmentDataConditions({nullable:null},any(pred("/nullable","Does not exist"))).matched,
    conditions.evaluateAssignmentDataConditions({value:"1"},any(pred("/value","Equals",{detectedType:"number",comparison:number(1)}))).matched,
    conditions.evaluateAssignmentDataConditions({value:"current"},any(pred("/value","Is one of",{comparisons:[text("legacy"),text("current")]}))).matched,
    conditions.evaluateAssignmentDataConditions({value:"legacy-page"},any(pred("/value","Matches pattern",{comparison:text("^legacy-")}))).matched,
    conditions.evaluateAssignmentDataConditions({value:12},any(pred("/value","Is at least",{detectedType:"number",comparison:number(10)}))).matched,
  ];
  const paths=[
    conditions.evaluateAssignmentDataConditions({context:{siteArea:"legacy"}},any(pred("/context/siteArea","Exists"))).predicates[0],
    conditions.evaluateAssignmentDataConditions({products:[{type:"current"},{type:"legacy"}]},any(pred("/products/*/type","Equals",{comparison:text("legacy")}))).predicates[0],
    conditions.evaluateAssignmentDataConditions({products:[]},any(pred("/products/*/type","Does not exist"))).predicates[0],
    conditions.evaluateAssignmentDataConditions({"a/b":"slash"},any(pred("/a~1b","Exists"))).predicates[0],
    conditions.evaluateAssignmentDataConditions({"tilde~name":"tilde"},any(pred("/tilde~0name","Exists"))).predicates[0],
  ].map(({propertyPath,matched,observed})=>({propertyPath,matched,observed:observed.map(({concretePath,value,exists})=>({concretePath,value,exists}))}));
  const payloadAssignment={...saved,id:"payload",name:"Payload target",priority:10,conditionTarget:"payload",dataConditionGroup:any(pred("/variant","Equals",{comparison:text("legacy")}))};const rawAssignment={...saved,id:"raw",name:"Raw target",priority:20,conditionTarget:"raw input",dataConditionGroup:any(pred("/variant","Equals",{comparison:text("legacy")}))};const payloadSchema={...legacy,assignments:[payloadAssignment]};const rawSchema={...current,assignments:[rawAssignment]};const targetResolution=verification.resolveSchemaAssignment(event({variant:"current"},{variant:"legacy"}),url,[payloadSchema,rawSchema]);
  const archivedEvent=event({errorType:"archived"},{errorType:"archived"});const archivedSnapshot=JSON.stringify(archivedEvent);const archived=verification.validateEvent(archivedEvent,[legacyForResolution,current],"https://archive.example/legacy");const active={error_type:"active"};
  const exportText=verification.exportSchema(legacy);const restored=verification.importSchema(exportText);const persistence={restored:restored.assignments[0].dataConditionGroup.predicates.map(({propertyPath})=>propertyPath),archived:archived.schema?.name,archivedEvidence:archived.assignmentEvidence?.selectedAssignmentId,immutable:archivedSnapshot===JSON.stringify(archivedEvent),activeUnchanged:active.error_type==="active"};
  return{absent,empty,editor:editorState,persisted,duplicate,families,priority,cases,paths,target:{selected:targetResolution.assignment?.id,validationTarget:targetResolution.assignment?.target,conditionTarget:targetResolution.assignment?.conditionTarget},persistence,layout:{body:document.documentElement.scrollWidth,width:innerWidth,editor:editor.scrollWidth,conditions:conditionRoot.scrollWidth},runtimeErrors};
})()`;

const eventOccurrenceDefectReportRuntime = `(async () => {
  const pause=()=>new Promise((resolve)=>setTimeout(resolve,0));
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const click=(label,root=document)=>{const value=Array.from(root.querySelectorAll("button")).find((button)=>button.textContent===label||button.textContent.startsWith(label));if(!value)throw new Error("Missing action "+label);value.click();return value;};
  const runtimeErrors=[];addEventListener("error",(event)=>runtimeErrors.push(String(event.error??event.message)));addEventListener("unhandledrejection",(event)=>runtimeErrors.push(String(event.reason)));
  const richWrites=[],plainWrites=[];Object.defineProperty(navigator,"clipboard",{configurable:true,value:{write:async(items)=>{const item=items[0];richWrites.push({html:await(await item.getType("text/html")).text(),text:await(await item.getType("text/plain")).text()});},writeText:async(text)=>plainWrites.push(text)}});
  const observer=await import("/data-layer-live-observer.js");const observerUi=await import("/data-layer-live-observer-ui.js");const inspectorActions=await import("/data-layer-live-inspector-actions.js");const occurrenceUi=await import("/data-layer-event-occurrence-defect-report-ui.js");const occurrence=await import("/data-layer-event-occurrence-defect-report.js");const defects=await import("/data-layer-defect-library.js");const defectLibraryUi=await import("/data-layer-defect-library-ui.js");
  const pageAssignment={id:"assignment:page-view",name:"Product page views",schemaId:"schema:page-view",sourceId:"event-history",eventName:"page_view",target:"payload",pathnameCondition:"/products",versionPolicy:"follow latest",enabled:true};
  const productAssignment={id:"assignment:product-view",name:"Product views",schemaId:"schema:product-view",sourceId:"event-history",eventName:"product_view",target:"payload",pathnameCondition:"/products",versionPolicy:"follow latest",enabled:true};
  const schemaDocument={type:"object",required:["page_type","product_id"],properties:{page_type:{type:"string"},product_id:{type:"string"}}};
  const schemas=[{id:"schema:page-view",name:"Page view",version:4,published:true,document:schemaDocument,assignments:[pageAssignment]},{id:"schema:product-view",name:"Product view",version:3,published:true,document:schemaDocument,assignments:[productAssignment]}];
  const payload={page_type:"product_detail",product_id:"robot-1"};const event={id:"event:page-view",name:"page_view",sourceId:"event-history",sourceName:"Event history",captureTime:"2026-07-15T07:31:00Z",pageUrl:"https://shop.example/products",payload,rawInput:["page_view",payload],validation:"Valid",validationDetails:{issues:[],evaluations:[],schema:{id:"schema:page-view",name:"Page view",version:4},assignment:pageAssignment}};
  const host=document.createElement("section");host.style.width="320px";host.innerHTML='<section><section id="live-event-list"><ul id="live-event-feed"></ul></section><aside id="live-event-inspector"></aside><button id="back-to-events"></button><div id="live-source-statuses"></div></section>';document.body.append(host);const elements=observerUi.findLiveObserverElements(host);observerUi.renderLiveObserverState(elements,{...observer.createLiveObserverState({pageUrl:event.pageUrl,sources:[]}),events:[event],inspectorEventId:event.id,listVisible:false},()=>{});
  let library=defects.createDefectLibrary();const saved=[];const persistence={save:async(report,options)=>{const defect=defects.createOccurrenceDefect({id:"defect:"+(saved.length+1),now:"2026-07-15T07:32:00Z",report});const result=defects.addDefect(library,defect,options.saveSeparately);if(result.added){library=result.library;saved.push(structuredClone(report));}return{feedback:result.added?"Occurrence defect saved.":"A reported occurrence defect already matches this event.",existing:result.existing.map(({id,report})=>({id,label:report.summary}))};},openExisting:()=>{},updateExisting:()=>{}};
  const renderInspector=()=>{const actions=inspectorActions.createLiveInspectorActions({currentPageUrl:()=>event.pageUrl,writeClipboard:async()=>{},storeTemplate:()=>{},startOccurrenceDefectReport:(selected,mode)=>occurrenceUi.renderOccurrenceDefectReportBuilder(elements.eventInspector,selected,mode,schemas,[selected],undefined,undefined,persistence),validationState:()=>"Valid",updateValidation:()=>{},manualSchemaChoices:()=>[],selectManualSchema:()=>{}});observerUi.renderLiveInspector(elements,event,actions);};
  renderInspector();const inspector=q("#live-event-inspector",host);const initial={validation:q("#live-inspector-validation-summary",inspector).textContent,actions:Array.from(inspector.querySelectorAll("button")).map(({textContent})=>textContent).filter((label)=>label.startsWith("Report "))};
  click("Report unexpected event",inspector);await pause();const unexpectedBuilder=q("#live-event-inspector",host);const unexpectedStage=q('[aria-label="Occurrence evidence"]',unexpectedBuilder).dataset.evidenceStage;const common={expected:Boolean(unexpectedBuilder.querySelector('[aria-label="Expected event occurrence"]')),steps:Boolean(unexpectedBuilder.querySelector("#defect-reproduction-start")),timeline:Boolean(unexpectedBuilder.querySelector('[aria-label="Timeline composer"]')),details:unexpectedBuilder.querySelectorAll("[data-report-field]").length};q('[data-occurrence-override="true"]',unexpectedBuilder).click();click("Confirm expectation",unexpectedBuilder);await pause();const unexpectedPreview=q('[aria-label="Final report preview"]',unexpectedBuilder).textContent;click("Copy for Jira Cloud",unexpectedBuilder);await pause();await pause();click("Save as reported defect",unexpectedBuilder);await pause();
  renderInspector();click("Report wrong event name",q("#live-event-inspector",host));await pause();const wrongBuilder=q("#live-event-inspector",host);const wrongStage=q('[aria-label="Occurrence evidence"]',wrongBuilder).dataset.evidenceStage;const identity=q('[data-occurrence-expected-identity="true"]',wrongBuilder);const payloadState=q('[data-occurrence-expected-payload="true"]',wrongBuilder).value;click("Confirm expectation",wrongBuilder);await pause();const wrongPreview=q('[aria-label="Final report preview"]',wrongBuilder).textContent;click("Save as reported defect",wrongBuilder);await pause();
  const storedWrong=library.defects.find(({type})=>type==="Wrong event name");let recopied="";const detail=document.createElement("section");document.body.append(detail);defectLibraryUi.renderDefectLibrary({count:null,list:null,empty:null,detail,confirmation:null},library.defects,storedWrong.id,undefined,{open:()=>{},close:()=>{},save:()=>{},recopy:()=>{recopied=occurrence.renderOccurrenceReport(storedWrong.report).text;},updateStatus:()=>{},attachCurrentSession:()=>{},openLinkedSession:()=>{},requestDelete:()=>{},cancelDelete:()=>{},confirmDelete:()=>{}});click("Recopy for Jira Cloud",detail);const reopened=q('[aria-label="Final report preview"]',detail).textContent;
  const immutable=JSON.stringify(payload)===JSON.stringify({page_type:"product_detail",product_id:"robot-1"});const representations=[wrongPreview,occurrence.renderOccurrenceReport(storedWrong.report).text,reopened,recopied];
  return{initial,unexpected:{stage:unexpectedStage,preview:unexpectedPreview,type:saved[0]?.type,corrections:saved[0]?.payloadCorrections},wrong:{stage:wrongStage,identity:identity.value,payloadState,preview:wrongPreview,type:storedWrong.type,representationsEquivalent:representations.every((text)=>text.includes("Captured page_view")&&text.includes("product_view"))},common,persisted:library.defects.map(({type,occurrenceMatch})=>({type,occurrenceMatch})),clipboard:{rich:richWrites.length,plain:plainWrites.length},immutable,layout:{body:document.documentElement.scrollWidth,width:innerWidth,builder:wrongBuilder.scrollWidth},runtimeErrors};
})()`;

const defectReportProvenancePresentationRuntime = `(async () => {
  const pause=()=>new Promise((resolve)=>setTimeout(resolve,0));
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const click=(label,root=document)=>{const value=Array.from(root.querySelectorAll("button")).find((button)=>button.textContent===label||button.textContent.startsWith(label));if(!value)throw new Error("Missing action "+label);value.click();return value;};
  const generated=["action response source: schema declared-property policy","error_action response source: Assigned error schema revision 7","error_message response source: operator custom override","page_type response source: schema constraint","error_action value-rule provenance: Exact error action v1"];
  const suppressed=(text)=>generated.every((line)=>!text.includes(line))&&!text.includes("value-rule provenance:");
  const operatorText="error_action response source: confirm with the implementation team";
  const runtimeErrors=[];addEventListener("error",(event)=>runtimeErrors.push(String(event.error??event.message)));addEventListener("unhandledrejection",(event)=>runtimeErrors.push(String(event.reason)));
  const richWrites=[],plainWrites=[];let failRich=false;
  Object.defineProperty(navigator,"clipboard",{configurable:true,value:{write:async(items)=>{if(failRich)throw new Error("rich unavailable");const item=items[0];richWrites.push({html:await(await item.getType("text/html")).text(),text:await(await item.getType("text/plain")).text()});},writeText:async(text)=>plainWrites.push(text)}});
  localStorage.clear();
  const verification=await import("/data-layer-schema-verification.js");const observer=await import("/data-layer-live-observer.js");const observerUi=await import("/data-layer-live-observer-ui.js");const inspectorActions=await import("/data-layer-live-inspector-actions.js");const reportUi=await import("/data-layer-defect-report-ui.js");const exportModule=await import("/data-layer-defect-report-export.js");const defects=await import("/data-layer-defect-library.js");const defectLibraryUi=await import("/data-layer-defect-library-ui.js");const missingUi=await import("/data-layer-missing-event-defect-report-ui.js");const missingModel=await import("/data-layer-missing-event-defect-report.js");
  const schema={id:"schema:error",name:"Assigned error schema",version:7,published:true,document:{type:"object",additionalProperties:false,required:["error_action","error_message"],properties:{error_action:{type:"string"},error_message:{type:"string"},page_type:{type:"string"}}},assignments:[],attachedRules:[{id:"rule:exact-action",name:"Exact error action",version:1,propertyPath:"/error_action",operator:"exact-value",parameters:"error",severity:"error"},{id:"rule:page-types",name:"Allowed page types",version:3,propertyPath:"/page_type",operator:"allowed-values",allowedValues:["error","checkout"],severity:"error"}]};
  const payload={action:"checkout",page_type:"unknown"};const validation=verification.validateWithSchema({sourceId:"history",eventName:"error",payload,rawInput:["error",payload]},schema,[schema]);const immutableBytes=JSON.stringify({payload,validation,schema});
  const event={id:"event:provenance",name:"error",sourceId:"history",sourceName:"Event history",captureTime:"2026-07-15T07:16:00Z",pageUrl:"https://shop.example/error",payload,rawInput:["error",payload],validation:validation.state,validationDetails:{issues:validation.issues,evaluations:validation.evaluations,schema:validation.schema}};
  const host=document.createElement("section");host.style.width="320px";host.innerHTML='<section><section id="live-event-list"><ul id="live-event-feed"></ul></section><aside id="live-event-inspector"></aside><button id="back-to-events"></button><div id="live-source-statuses"></div></section>';document.body.append(host);const elements=observerUi.findLiveObserverElements(host);observerUi.renderLiveObserverState(elements,{...observer.createLiveObserverState({pageUrl:event.pageUrl,sources:[]}),events:[event],inspectorEventId:event.id,listVisible:false},()=>{});
  let savedReport;const persistence={save:async(report)=>{savedReport=structuredClone(report);const defect=defects.createValidationDefect({id:"defect:provenance",now:"2026-07-15T07:17:00Z",report,issues:defects.currentDefectIssues(event)});localStorage.setItem(defects.DEFECT_LIBRARY_STORAGE_KEY,defects.serializeDefectLibrary({defects:[defect]}));return{feedback:"Reported defect saved."};},openExisting:()=>{},updateExisting:()=>{}};
  const actions=inspectorActions.createLiveInspectorActions({currentPageUrl:()=>event.pageUrl,writeClipboard:async()=>{},storeTemplate:()=>{},startDefectReport:(selected)=>reportUi.renderDefectReportBuilder(elements.eventInspector,selected,undefined,[selected],undefined,persistence),validationState:()=>validation.state,updateValidation:()=>{},manualSchemaChoices:()=>[],selectManualSchema:()=>{}});observerUi.renderLiveInspector(elements,event,actions);click("Create defect report",q("#live-event-inspector",host));await pause();
  const builder=q("#live-event-inspector",host);const preview=q('[aria-label="Final report preview"]',builder);const actionGroup=q('[aria-label="action expected-result assistance"]',builder);const schemaGroup=q('[aria-label="error_action expected-result assistance"]',builder);const customGroup=q('[aria-label="error_message expected-result assistance"]',builder);const pageTypeGroup=q('[aria-label="page_type expected-result assistance"]',builder);
  const schemaChoice=q('input[value="error"]',schemaGroup);schemaChoice.click();const customChoice=q('input[data-response-source="Custom value or response"]',customGroup);customChoice.click();const customInput=q('input[placeholder="Custom value or response"]',customGroup);customInput.value="Checkout failed";customInput.dispatchEvent(new InputEvent("input",{bubbles:true,data:"Checkout failed",inputType:"insertText"}));
  const explanation=q('[data-report-field="expectedExplanation"]',builder);explanation.value=operatorText;explanation.dispatchEvent(new InputEvent("input",{bubbles:true,data:operatorText,inputType:"insertText"}));await pause();
  builder.style.height="600px";builder.style.overflow="auto";builder.scrollTop=53;schemaChoice.focus({preventScroll:true});const beforeRefresh={scroll:builder.scrollTop,focus:document.activeElement===schemaChoice};const genericChoice=q('input[data-response-source="Use generic constraint"]',pageTypeGroup);genericChoice.focus({preventScroll:true});genericChoice.click();await pause();const afterRefresh={scroll:builder.scrollTop,focus:document.activeElement===genericChoice};
  const controls={removal:actionGroup.textContent,schema:Array.from(schemaGroup.querySelectorAll('input[type="radio"]')).map(({value,dataset})=>({value,source:dataset.responseSource})),custom:Array.from(customGroup.querySelectorAll('input[type="radio"]')).map(({dataset})=>dataset.responseSource)};
  const previewText=preview.textContent;click("Copy for Jira Cloud",builder);await pause();await pause();failRich=true;click("Copy for Jira Cloud",builder);await pause();await pause();click("Save as reported defect",builder);await pause();await pause();
  const stored=defects.restoreDefectLibrary(localStorage.getItem(defects.DEFECT_LIBRARY_STORAGE_KEY)).defects[0];const savedRendered=exportModule.renderJiraReport(stored.report);let recopied="";const detail=document.createElement("section");document.body.append(detail);defectLibraryUi.renderDefectLibrary({count:null,list:null,empty:null,detail,confirmation:null},[stored],stored.id,undefined,{open:()=>{},close:()=>{},save:()=>{},recopy:()=>{recopied=exportModule.renderJiraReport(stored.report).text;},updateStatus:()=>{},attachCurrentSession:()=>{},openLinkedSession:()=>{},requestDelete:()=>{},cancelDelete:()=>{},confirmDelete:()=>{}});click("Recopy for Jira Cloud",detail);const reopened=q('[aria-label="Final report preview"]',detail).textContent;
  const representations=[previewText,richWrites[0].html,richWrites[0].text,plainWrites[0],savedRendered.html,savedRendered.text,reopened,recopied];const expectedPayloadBytes=JSON.stringify(savedReport.expected.payload);const corrections=savedReport.expected.corrections.map(({issueId,pointer,operation,response,responseSource,responseProvenance,operatorProvided})=>({issueId,pointer,operation,response,responseSource,responseProvenance,operatorProvided}));const evidence=savedReport.evidence.validation.map(({rule,ruleVersion,severity,pointer,violation,constraint,actual})=>({rule,ruleVersion,severity,pointer,violation,constraint,actual}));
  const legacy=structuredClone(stored);const legacyBytes=JSON.stringify(legacy);const legacyRendered=exportModule.renderJiraReport(legacy.report);const legacyState={suppressed:suppressed(legacyRendered.text),metadata:legacy.report.expected.corrections.every(({responseSource})=>Boolean(responseSource)),unchanged:legacyBytes===JSON.stringify(legacy),assistance:controls.schema.some(({source})=>source==="Assigned error schema revision 7")};
  const missingHost=document.createElement("section");missingHost.style.width="320px";document.body.append(missingHost);const missingAssignment={id:"assignment:missing-error",name:"Error pages",sourceId:"history",eventName:"error",target:"payload",pathnameCondition:"/error",enabled:true};const missingSchema={...schema,id:"schema:missing-error",assignments:[missingAssignment],document:{type:"object",required:["error_action"],properties:{error_action:{type:"string"}}},attachedRules:[{...schema.attachedRules[0],operator:"allowed-values",allowedValues:["error"]}]};const visit={id:"visit:missing",pageUrl:event.pageUrl,pathname:"/error",startedAt:event.captureTime,endedAt:"2026-07-15T07:16:30Z",events:[]};let missingCopied="",missingSaved;const missingController=missingUi.renderMissingEventDefectReportBuilder(missingHost,[visit],[missingSchema],{entryPoint:"Live session actions",initialSchemaId:missingSchema.id,writeClipboard:async(text)=>{missingCopied=text;},saveReportedDefect:async(report)=>{missingSaved=structuredClone(report);}});const missingSchemaChoice=Array.from(missingHost.querySelectorAll("label")).find(({textContent})=>textContent.trim()==="Use schema value error")?.querySelector('input[type="radio"]');if(!missingSchemaChoice)throw new Error("Missing missing-event schema choice");missingSchemaChoice.click();const missingExplanation=q('[data-report-field="expectedResultAdditionalText"]',missingHost);missingExplanation.value=operatorText;missingExplanation.dispatchEvent(new InputEvent("input",{bubbles:true,data:operatorText,inputType:"insertText"}));click("Confirm at least one matching event was expected",missingHost);await pause();const missingPreview=q('[aria-label="Final report preview"]',missingHost).textContent;click("Copy for Jira Cloud",missingHost);await pause();click("Save as reported defect",missingHost);await pause();const missingDefect=defects.createMissingEventDefect({id:"defect:missing-provenance",now:"2026-07-15T07:18:00Z",report:missingSaved});let missingRecopied="";const missingDetail=document.createElement("section");document.body.append(missingDetail);defectLibraryUi.renderDefectLibrary({count:null,list:null,empty:null,detail:missingDetail,confirmation:null},[missingDefect],missingDefect.id,undefined,{open:()=>{},close:()=>{},save:()=>{},recopy:()=>{missingRecopied=missingModel.generateMissingEventRepresentations(missingSaved).jiraText;},updateStatus:()=>{},attachCurrentSession:()=>{},openLinkedSession:()=>{},requestDelete:()=>{},cancelDelete:()=>{},confirmDelete:()=>{}});click("Recopy for Jira Cloud",missingDetail);const missingReopened=q('[aria-label="Final report preview"]',missingDetail).textContent;const missingRepresentations=[missingPreview,missingCopied,missingReopened,missingRecopied];
  return{captured:{suppressed:representations.every(suppressed),operatorPreserved:representations.every((text)=>text.includes(operatorText)),expectedPayloadSame:representations.every((text)=>text.includes("error_action")&&text.includes("Checkout failed")),controls,corrections,evidence,structuredRetained:JSON.stringify(stored.report.expected.corrections)===JSON.stringify(savedReport.expected.corrections),focusScroll:{before:beforeRefresh,after:afterRefresh,scroll:builder.scrollTop},expectedPayloadBytes},missing:{suppressed:missingRepresentations.every(suppressed),operatorPreserved:missingRepresentations.every((text)=>text.includes(operatorText)),sources:missingSaved.expectedResponseSources,provenance:missingSaved.expectedResponseProvenance,payload:missingSaved.expectedPayload,reportAvailable:Boolean(missingController.report())},legacy:legacyState,immutable:immutableBytes===JSON.stringify({payload,validation,schema}),layout:{body:document.documentElement.scrollWidth,width:innerWidth,builder:builder.scrollWidth,missing:missingHost.scrollWidth},runtimeErrors};
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
  const paths = Array.from(tree.querySelectorAll("li[data-schema-property-path]")).map(({ dataset }) => dataset.schemaPropertyPath);
  const products = q('#schema-property-tree [data-schema-property-path="products"]');
  const everyItem = q('#schema-property-tree [data-schema-property-path="products.*"]');
  const advanced = { paths, arrayActions:Array.from(products.querySelectorAll(":scope > button")).map(({ textContent }) => textContent), everyItem:everyItem.querySelector(":scope > .schema-property-metadata").textContent };
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
    productsNotApplicable:productsResult.evaluations.filter(({ status }) => status === "not-applicable").map(({ propertyPath }) => propertyPath),
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

const recursivePropertyValidationRuntime = `(async () => {
  const ui = await import("/data-layer-live-observer-ui.js");
  const actionCore = await import("/data-layer-live-inspector-actions.js");
  const guidedUi = await import("/data-layer-guided-validation-ui.js");
  const targets = await import("/data-layer-recursive-property-tree.js");
  const products = Array.from({ length:6 }, (_, index) => ({ sku:"SKU-" + (index + 1), name:"Product " + (index + 1), price:index < 4 ? index + 1 : String(index + 1), productType:index === 0 ? "unknown" : "standard", pricing:{ amount:index + .5 }, details:[{ code:"A-" + index }, { code:"B-" + index, sku:"DETAIL-" + index }], "1":"number-name", "*":"literal-star", "a/b":"slash-name" }));
  const payload = { oOrder:{ orderId:"ORDER-1", aProducts:products, "a/b":{ "~name":"escaped" } }, orders:[{ items:[{ sku:"nested" }] }], tags:["one","two","three"], matrices:[[1,2],[3]], discounts:[] };
  const host = document.createElement("section"); host.innerHTML = '<section id="recursive-browser-live"><section id="live-event-inspector"></section><button id="back-to-events">Back</button><output id="live-session-message"></output><section id="guided-validation-flow"></section></section>'; document.body.append(host);
  const elements = ui.findLiveObserverElements(host);
  const event = { id:"event:order", name:"order_complete", sourceId:"event-history", sourceName:"Event history", captureTime:"2026-07-14T08:00:00Z", pageUrl:"https://shop.example/checkout", destination:"queue.history", provenance:"captured:event-history", payload, rawInput:[], validation:"2 errors and 1 warning", validationDetails:{ issues:[], evaluations:[
    { propertyPath:"oOrder.orderId", status:"pass", message:"Order id present", expected:"string", actual:"ORDER-1", rule:"Order id", ruleVersion:1, severity:"error", schemaName:"Product detail", schemaVersion:3 },
    { propertyPath:"oOrder.aProducts.*.price", status:"warning", message:"Mixed price type", expected:"Number", actual:"mixed", rule:"Price", ruleVersion:1, severity:"warning", schemaName:"Product detail", schemaVersion:3 },
    { propertyPath:"oOrder.aProducts.*.productType", status:"error", message:"Unknown product type", expected:"standard", actual:"unknown", rule:"Product type", ruleVersion:1, severity:"error", schemaName:"Product detail", schemaVersion:3 },
  ] } };
  let origin;
  const flow = guidedUi.createGuidedValidationFlow(host.querySelector("#guided-validation-flow"), { schemaCandidates:()=>[], publish:()=>{}, close:()=>origin?.focus({ preventScroll:true }) });
  const actions = actionCore.createLiveInspectorActions({ currentPageUrl:()=>event.pageUrl, writeClipboard:async()=>{}, storeTemplate:()=>{}, addPropertyValidation:(selected,path,trigger)=>{ origin=trigger; flow.openProperty({ id:selected.id, name:selected.name, sourceId:selected.sourceId, pageUrl:selected.pageUrl, payload:selected.payload }, path); }, validationState:()=>"Valid", updateValidation:()=>{}, manualSchemaChoices:()=>[], selectManualSchema:()=>{} });
  ui.renderLiveInspector(elements, event, actions);
  const inspector = elements.eventInspector;
  const row = (path) => inspector.querySelector('.live-validation-property[data-property-path="' + path + '"]');
  const paths = Array.from(inspector.querySelectorAll(".live-validation-property")).map((item) => item.dataset.propertyPath);
  const array = row("/oOrder/aProducts"); const every = row("/oOrder/aProducts/*"); const sku = row("/oOrder/aProducts/*/sku"); const price = row("/oOrder/aProducts/*/price"); const concreteSku = row("/oOrder/aProducts/1/sku");
  if (!array || !every || !sku || !price) throw new Error("Missing recursive rows: " + paths.join(", "));
  const oOrderDisclosure = inspector.querySelector('details[data-property-path="/oOrder"]'); oOrderDisclosure.open = true;
  const search = inspector.querySelector("#live-property-search"); search.value = "pricing amount"; search.dispatchEvent(new Event("input", { bubbles:true }));
  const searchOpen = Array.from(inspector.querySelectorAll("details[open]")).map((item) => item.dataset.propertyPath).filter(Boolean);
  search.value = ""; search.dispatchEvent(new Event("input", { bubbles:true }));
  const restoredOpen = Array.from(inspector.querySelectorAll("details[open]")).map((item) => item.dataset.propertyPath).filter(Boolean);
  for (const path of ["/oOrder", "/oOrder/aProducts", "/oOrder/aProducts/*"]) inspector.querySelector('details[data-property-path="' + path + '"]')?.setAttribute("open", "");
  const skuValue = sku.querySelector(":scope > .live-validation-property-row > span"); const skuStatus = sku.querySelector(".live-property-status"); const skuAdd = sku.querySelector(".live-property-add-validation");
  const valueRect = skuValue.getBoundingClientRect(); const statusRect = skuStatus.getBoundingClientRect(); const addRect = skuAdd.getBoundingClientRect();
  skuAdd.click();
  const draft = flow.currentDraft();
  const advanced = host.querySelector("#guided-advanced-settings"); advanced.open = true; Array.from(advanced.querySelectorAll("button")).find((button) => button.textContent === "Advanced Edit target path").click();
  const dialog = host.querySelector("#guided-target-path-editor"); const expression = host.querySelector("#guided-target-expression");
  const initialTarget = { expression:expression.value, segments:Array.from(host.querySelectorAll("#guided-target-segments li")).map((item) => item.textContent), preview:host.querySelector("#guided-target-preview").textContent, actions:Array.from(dialog.querySelectorAll("button")).map((button) => button.textContent) };
  expression.value = '$["oOrder"]["aProducts"][*]["details"][1]["sku"]'; expression.dispatchEvent(new Event("input", { bubbles:true }));
  const changedTarget = host.querySelector("#guided-target-preview").textContent;
  Array.from(dialog.querySelectorAll("button")).find((button) => button.textContent === "Reset to observed path").click();
  const resetTarget = { expression:expression.value, preview:host.querySelector("#guided-target-preview").textContent };
  Array.from(dialog.querySelectorAll("button")).find((button) => button.textContent === "Cancel").click();
  Array.from(host.querySelector("#guided-validation-flow").querySelectorAll("button")).find((button) => button.textContent === "Cancel").click();
  const inspections = {
    valid:targets.inspectValidationTarget(payload, "/oOrder/aProducts/*/sku"),
    mixed:targets.inspectValidationTarget(payload, "/oOrder/aProducts/*/price"),
    negative:targets.inspectValidationTarget(payload, "/oOrder/aProducts/-1"),
    decimal:targets.inspectValidationTarget(payload, "/oOrder/aProducts/1.5"),
    nonArray:targets.inspectValidationTarget(payload, "/oOrder/orderId/*"),
    missingScope:targets.inspectValidationTarget(payload, "/oOrder/aProducts/sku"),
    unobserved:targets.inspectValidationTarget(payload, '$["oOrder"]["aProducts"][*]["details"][1]["missing"]'),
  };
  const missingSkuPayload = structuredClone(payload); delete missingSkuPayload.oOrder.aProducts[0].sku;
  const missingSkuTree = targets.buildRecursivePropertyTree(missingSkuPayload); const flattenTree = (nodes) => nodes.flatMap((node) => [node, ...flattenTree(node.children), ...flattenTree(node.specificItems)]); const missingSku = flattenTree(missingSkuTree).find((node) => node.path === "/oOrder/aProducts/*/sku");
  const observation = {
    width:innerWidth,
    hierarchy:{ paths, arraySummary:array.querySelector(":scope > .live-validation-property-row > span").textContent, everySummary:every.querySelector(":scope > .live-validation-property-row > span").textContent, skuSummary:sku.querySelector(":scope > .live-validation-property-row > span").textContent, missingSkuSummary:missingSku.summary, priceSummary:price.querySelector(":scope > .live-validation-property-row > span").textContent, concrete:Boolean(concreteSku), nestedSku:paths.includes("/orders/*/items/*/sku"), empty:row("/discounts").textContent.includes("No item structure was observed"), specific:Array.from(inspector.querySelectorAll(".live-property-specific-items .live-validation-property")).some((item) => item.dataset.propertyPath === "/oOrder/aProducts/1") },
    search:{ open:searchOpen, restored:restoredOpen },
    layout:{ actionsSeparate:statusRect.top >= valueRect.bottom - 1 && addRect.top >= valueRect.bottom - 1, actionWidths:[statusRect.width,addRect.width], noOverflow:inspector.scrollWidth <= inspector.clientWidth },
    entry:{ stage:draft.stage, path:draft.property.path, detectedType:draft.property.detectedType, propertyStageAbsent:!host.querySelector('input[name="guided-property"]'), eventActions:Array.from(inspector.querySelectorAll(".live-inspector-actions button")).map((button) => button.textContent), statusIsSeparate:skuStatus !== skuAdd, statuses:{ orderId:row("/oOrder/orderId").querySelector(".live-property-status").textContent, sku:skuStatus.textContent, price:price.querySelector(".live-property-status").textContent, productType:row("/oOrder/aProducts/*/productType").querySelector(".live-property-status").textContent }, focusedAfterCancel:document.activeElement === skuAdd },
    target:{ initial:initialTarget, changed:changedTarget, reset:resetTarget, inspections, parsed:targets.parseTargetExpression('$["oOrder"]["aProducts"][0]["1"]').map((segment) => [segment.kind,segment.value]), literalStar:targets.normalizeTargetExpression('$["oOrder"]["aProducts"][0]["*"]', payload), wildcard:targets.normalizeTargetExpression('/oOrder/aProducts/*', payload), slashArray:targets.normalizeTargetExpression('/oOrder/aProducts/*/details/1', payload), slashEscaped:targets.normalizeTargetExpression('/oOrder/a~1b/~0name', payload) },
  };
  host.remove(); return observation;
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

const missingEventDefectReportRuntime = `(async () => {
  const model = await import("/data-layer-missing-event-defect-report.js");
  const ui = await import("/data-layer-missing-event-defect-report-ui.js");
  const defectLibrary = await import("/data-layer-defect-library.js");
  const defectLibraryUi = await import("/data-layer-defect-library-ui.js");
  const q = (root, selector) => { const value = root.querySelector(selector); if (!value) throw new Error("Missing " + selector); return value; };
  const button = (root, label) => { const value = Array.from(root.querySelectorAll("button")).find((candidate) => candidate.textContent === label); if (!value) throw new Error("Missing " + label); return value; };
  const enter = (root, pointer, value) => { const input=q(root, '[data-expected-payload-input="' + pointer + '"]'); input.value=value; input.dispatchEvent(new Event("input",{bubbles:true})); };
  const choose = (root, label) => { const input=Array.from(root.querySelectorAll("label")).find(({textContent})=>textContent.trim()===label)?.querySelector("input"); if(!input) throw new Error("Missing choice " + label); input.checked=true; input.dispatchEvent(new Event("change",{bubbles:true})); };
  const assignment = { id:"assignment:checkout-purchase", name:"Checkout purchase", sourceId:"event-history", eventName:"purchase", target:"payload", domainCondition:"shop.example", pathnameCondition:"/checkout", enabled:true };
  const schema = { id:"schema-checkout-purchase", name:"Checkout purchase", version:4, published:true, document:{ type:"object", required:["order_id","currency"], properties:{ order_id:{ type:"string" }, currency:{ type:"string" }, coupon:{ type:"string" } } }, assignments:[assignment], attachedRules:[{ id:"order-required", name:"Order required", version:2, propertyPath:"/order_id", operator:"required" },{ id:"currency-values", name:"Currencies", version:1, propertyPath:"/currency", operator:"allowed-values", allowedValues:["EUR","USD"] }], documentation:{ description:"Purchase expected after checkout confirmation" } };
  const pageviewAssignment = { id:"assignment:generic-pageview", name:"Generic pageview", sourceId:"event-history", eventName:"pageview", target:"payload", domainCondition:"shop.example", pathnameCondition:"/checkout", enabled:true };
  const nestedSchema = { id:"schema-generic-pageview", name:"Generic pageview", version:4, published:true, document:{type:"object",required:["page_name","products"],properties:{page_name:{type:"string"},products:{type:"array",items:{type:"object",required:["id","name"],properties:{id:{type:"number"},name:{type:"string"}}}},logged_in:{type:"boolean"}}},assignments:[pageviewAssignment],attachedRules:[{id:"page-name-values",version:1,propertyPath:"/page_name",operator:"allowed-values",allowedValues:["home","test"]},{id:"product-name-values",version:1,propertyPath:"/products/*/name",operator:"allowed-values",allowedValues:["robot","vehicle"]}] };
  const flatSchema = { id:"schema-flat-pageview", name:"Generic pageview flat", version:4, published:true, document:{type:"object",required:["/page_levels","/page_type","/page_section","/login_status","/b_id"],properties:{"/page_levels":{type:"array"},"/page_levels/0":{type:"string"},"/page_type":{type:"string"},"/page_section":{type:"string"},"/login_status":{type:"string"},"/b_id":{type:"string"},"/untyped_list":{type:"array"}}},assignments:[pageviewAssignment],attachedRules:[{id:"page-levels",name:"Page level values",version:2,propertyPath:"/page_levels/*",operator:"allowed-values",allowedValues:["d","c"]},{id:"page-type",name:"Page type values",version:3,propertyPath:"/page_type",operator:"allowed-values",allowedValues:["product_detail","content"]},{id:"login-state",name:"Login values",version:1,propertyPath:"/login_status",operator:"allowed-values",allowedValues:["not logged in","logged in"]}] };
  const pageview = { id:"pageview", name:"pageview", sourceId:"event-history", sourceName:"Event history", pageUrl:"https://shop.example/checkout", captureTime:"2026-07-14T12:00:01Z", validation:"Valid", payload:{ page_type:"checkout" } };
  const purchase = (id, seconds) => ({ id, name:"purchase", sourceId:"event-history", sourceName:"Event history", pageUrl:"https://shop.example/checkout", captureTime:"2026-07-14T12:00:" + seconds + "Z", validation:"Valid", payload:{ transaction_id:id } });
  const visit = (id, events, immutable=false) => ({ id, pageUrl:"https://shop.example/checkout", pathname:"/checkout", startedAt:"2026-07-14T12:00:00Z", endedAt:"2026-07-14T12:01:00Z", events, immutable });
  const zeroVisit = visit("visit:zero", [pageview]);
  const matchVisit = visit("visit:match", [pageview, purchase("purchase-1", "30")]);
  const productVisit = { id:"visit:products", pageUrl:"https://shop.example/products", pathname:"/products", startedAt:"2026-07-14T11:59:00Z", endedAt:"2026-07-14T11:59:59Z", events:[{...pageview,id:"products-pageview",pageUrl:"https://shop.example/products",payload:{page_type:"products"}}] };
  const host = document.createElement("section"); host.id = "missing-event-browser-fixture"; document.body.append(host);
  let copied = ""; let openedEvent; let restored = false; let focused = false;
  let savedCount=0;
  const zero = ui.renderMissingEventDefectReportBuilder(host, [productVisit,zeroVisit], [schema], {
    entryPoint:"Live session actions", initialSchemaId:schema.id,
    writeClipboard:async (text) => { copied = text; },
    saveReportedDefect:async () => { savedCount += 1; },
    navigation:{ backToSelectedVisit:()=>{}, backToLiveFeed:()=>{}, focusReportMissingEvent:()=>{ focused=true; } },
  });
  const unifiedInitial={stages:Array.from(host.querySelectorAll("h5")).map(({textContent})=>textContent),evidence:Boolean(host.querySelector('[aria-label="Expected-event confirmation and absence verification"]')),preview:host.querySelector('[aria-label="Final report preview"]')?.textContent,copyDisabled:button(host,"Copy for Jira Cloud").disabled,saveDisabled:button(host,"Save as reported defect").disabled,schemaExpected:q(host,'[aria-label="Schema-derived expected properties"]').textContent,commonControls:["Generate pathname steps","Add event to timeline"].every((label)=>Boolean(button(host,label))),from:q(host,"#defect-reproduction-start").selectedOptions[0]?.textContent,to:q(host,"#missing-event-visit").selectedOptions[0]?.textContent?.split(" · ")[0],noCreate:!Array.from(host.querySelectorAll("button")).some(({textContent})=>textContent.includes("Create missing-event report")),noInterval:!host.textContent.includes("Observation interval")};
  const navigation = Array.from(host.querySelectorAll("header button")).map(({ textContent }) => textContent);
  const noCapturedNavigation = !Array.from(host.querySelectorAll("button")).some(({ textContent }) => textContent === "Back to captured event");
  const expectedEventInput = Array.from(host.querySelectorAll("label")).find(({ textContent }) => textContent.startsWith("Expected event name"))?.querySelector("input");
  expectedEventInput.value = "custom_purchase"; expectedEventInput.dispatchEvent(new Event("input", { bubbles:true }));
  q(host, "#missing-event-schema").dispatchEvent(new Event("change", { bubbles:true }));
  const replacementReview = q(host, '[aria-label="Expected-event replacement review"]').textContent;
  button(host, "Accept schema-derived expected-event values").click();
  const acceptedEventName = Array.from(host.querySelectorAll("label")).find(({ textContent }) => textContent.startsWith("Expected event name"))?.querySelector("input")?.value;
  const intervalControls = ["Observation start (ISO)", "Observation end (ISO)"].some((label) => Array.from(host.querySelectorAll("label")).some(({ textContent }) => textContent.startsWith(label)));
  enter(host,"/order_id","A-123"); choose(host,"Use schema value EUR");
  button(host, "Confirm at least one matching event was expected").click();
  const zeroVerification = { count:zero.draft().verification.matchingCount, warning:q(host, '[aria-label="Matching event warning"]').hidden, noCreate:!Array.from(host.querySelectorAll("button")).some(({textContent})=>textContent.includes("Create missing-event report")) };
  button(host, "Generate pathname steps").click();
  button(host, "Add event to timeline").click();
  q(host, '[data-timeline-event-id="pageview"]').click();
  q(host, '[data-timeline-evidence="includeSummary"]').click();
  button(host, "Add to timeline").click();
  const unifiedJourney=Array.from(host.querySelectorAll('[data-reproduction-step-kind]')).map((row)=>row.querySelector("input")?.value ?? row.textContent);
  const unifiedComplete={copyDisabled:button(host,"Copy for Jira Cloud").disabled,saveDisabled:button(host,"Save as reported defect").disabled,preview:q(host,'[aria-label="Final report preview"]').textContent,reproduction:unifiedJourney};
  const zeroReport = zero.report(); const zeroRepresentations = model.generateMissingEventRepresentations(zeroReport);
  button(host, "Copy for Jira Cloud").click(); await new Promise((resolve) => setTimeout(resolve, 0));
  button(host, "Save as reported defect").click(); await new Promise((resolve) => setTimeout(resolve, 0));
  button(host, "Back to selected page visit").click();

  host.replaceChildren();
  const warning = ui.renderMissingEventDefectReportBuilder(host, [matchVisit, zeroVisit], [schema], {
    entryPoint:"schema row actions", initialSchemaId:schema.id,
    navigation:{ backToSelectedVisit:()=>{}, backToLiveFeed:()=>{}, openMatchingEvent:(id, restoreBuilder)=>{ openedEvent=id; restored=false; restoreBuilder(); restored=true; } },
  });
  enter(host,"/order_id","A-123"); choose(host,"Use schema value EUR");
  button(host, "Confirm at least one matching event was expected").click();
  const warningBefore = { count:warning.draft().verification.matchingCount, visible:!q(host, '[aria-label="Matching event warning"]').hidden, ordinaryAbsent:!Array.from(host.querySelectorAll("button")).some(({ textContent }) => textContent?.includes("Create missing-event report")), evidence:q(host, '[aria-label="Matching event warning"]').textContent };
  button(host, "Open matching event").click();
  button(host, "Override matching-event warning").click();
  const overrideReport = warning.report(); const overrideRepresentations = model.generateMissingEventRepresentations(overrideReport);

  host.replaceChildren();
  const scoped = ui.renderMissingEventDefectReportBuilder(host, [matchVisit, zeroVisit], [schema], { entryPoint:"Live session actions", initialSchemaId:schema.id });
  button(host, "Confirm at least one matching event was expected").click();
  const scopeSelect = q(host, "#missing-event-visit"); scopeSelect.value = zeroVisit.id; scopeSelect.dispatchEvent(new Event("change", { bubbles:true }));
  const scopeZero = { count:scoped.draft().verification.matchingCount, warning:q(host, '[aria-label="Matching event warning"]').hidden, override:scoped.draft().override ?? null };
  q(host, "#missing-event-visit").value = matchVisit.id; q(host, "#missing-event-visit").dispatchEvent(new Event("change", { bubbles:true }));
  const scopeMatch = { count:scoped.draft().verification.matchingCount, visible:!q(host, '[aria-label="Matching event warning"]').hidden, override:scoped.draft().override ?? null };

  host.replaceChildren();
  const emptyNestedVisit=visit("visit:nested",[{...pageview,id:"checkout-context",name:"checkout_context"}]);
  let nestedCopied=""; let nestedSaves=0;
  const nested=ui.renderMissingEventDefectReportBuilder(host,[productVisit,emptyNestedVisit],[nestedSchema],{entryPoint:"Live session actions",initialSchemaId:nestedSchema.id,writeClipboard:async(text)=>{nestedCopied=text;},saveReportedDefect:async()=>{nestedSaves+=1;}});
  const nestedTreeText=q(host,'[aria-label="Recursive expected payload editor"]').textContent;
  choose(host,"Use schema value test");
  button(host,"Add products item").click();
  enter(host,"/products/0/id","1");
  enter(host,"/products/0/name","robot");
  button(host,"Duplicate products item 1").click();
  const duplicatedItems=host.querySelectorAll('[data-expected-array-item]').length;
  button(host,"Remove products item 2").click();
  button(host,"Confirm at least one matching event was expected").click();
  const nestedReport=nested.report(); const nestedRepresentation=model.generateMissingEventRepresentations(nestedReport);
  const nestedActions=[button(host,"Copy for Jira Cloud").disabled,button(host,"Save as reported defect").disabled,button(host,"Save as reported defect and copy").disabled];
  button(host,"Save as reported defect and copy").click(); await new Promise((resolve)=>setTimeout(resolve,0));
  const nestedObservation={tree:nestedTreeText,payload:nestedReport.expectedPayload,sources:nestedReport.expectedResponseSources,duplicatedItems,itemCount:nestedReport.expectedPayload.products.length,preview:nestedRepresentation.previewText,html:nestedRepresentation.previewHtml,noCreate:!Array.from(host.querySelectorAll("button")).some(({textContent})=>textContent?.includes("Create missing-event report")),noInterval:!host.textContent.includes("Observation interval"),actions:nestedActions,combined:{saves:nestedSaves,copiedSame:nestedCopied===nestedRepresentation.jiraText,feedback:host.querySelector('output[aria-live="polite"]')?.textContent}};

  host.replaceChildren(); host.style.width="720px";
  const fidelitySchema={...nestedSchema,document:{type:"object",required:["page_type","products"],properties:{page_type:{type:"string"},products:nestedSchema.document.properties.products}},attachedRules:[{id:"page-type",name:"Page type requirement",version:1,propertyPath:"/page_type",operator:"allowed-values",allowedValues:["product_detail","content"]}]};
  let fidelityCopied=""; let fidelitySaved;
  const fidelity=ui.renderMissingEventDefectReportBuilder(host,[productVisit,emptyNestedVisit],[fidelitySchema],{entryPoint:"Live session actions",initialSchemaId:fidelitySchema.id,writeClipboard:async(text)=>{fidelityCopied=text;},saveReportedDefect:async(report)=>{fidelitySaved=structuredClone(report);}});
  const finalPreview=()=>q(host,'[aria-label="Final report preview"]');
  const expectedNodes=(root=finalPreview())=>{const heading=Array.from(root.querySelectorAll("h2")).find(({textContent})=>textContent==="Expected result");const nodes=[];for(let node=heading?.nextElementSibling;node&&node.tagName!=="H2";node=node.nextElementSibling)nodes.push(node);return nodes;};
  const stepNodes=(root=finalPreview())=>{const heading=Array.from(root.querySelectorAll("h2")).find(({textContent})=>textContent==="Steps to reproduce");return Array.from(heading?.nextElementSibling?.querySelectorAll("li")??[]).map(({textContent})=>textContent);};
  const additional=q(host,'[data-report-field="expectedResultAdditionalText"]');
  const incomplete={additional:{value:additional.value,tag:additional.tagName},preCount:expectedNodes().filter(({tagName})=>tagName==="PRE").length,preLines:expectedNodes().find(({tagName})=>tagName==="PRE")?.textContent.split("\\n").length,paragraphHasJson:expectedNodes().filter(({tagName})=>tagName==="P").some(({textContent})=>textContent.includes('"page_type"'))};
  choose(host,"Use schema value product_detail"); button(host,"Add products item").click(); enter(host,"/products/0/id","1"); enter(host,"/products/0/name","robot");
  button(host,"Generate pathname steps").click(); q(host,'[data-add-reproduction-step="visit:products"]').click(); button(host,"Click component").click(); const component=q(host,'[data-reproduction-field="componentName"]'); component.value="Robot"; component.dispatchEvent(new Event("input",{bubbles:true})); button(host,"Add step").click();
  const beforeConfirmation={additional:additional.value,payload:JSON.parse(expectedNodes().find(({tagName})=>tagName==="PRE").textContent),structure:expectedNodes().map(({tagName})=>tagName),steps:stepNodes()};
  additional.value="Checkout <should> & must emit it\\non the next line"; additional.dispatchEvent(new Event("input",{bubbles:true}));
  button(host,"Confirm at least one matching event was expected").click();
  const completeReport=fidelity.report(); const completeRepresentation=model.generateMissingEventRepresentations(completeReport);
  const complete={structure:expectedNodes().map(({tagName})=>tagName),steps:stepNodes(),narrativeCount:(finalPreview().textContent.match(/pageview is fired with/g)??[]).length,preCount:expectedNodes().filter(({tagName})=>tagName==="PRE").length,additionalBeforeNarrative:completeRepresentation.previewText.indexOf("Checkout <should>")<completeRepresentation.previewText.indexOf("pageview is fired with"),sources:completeReport.expectedResponseSources,provenance:completeReport.expectedResponseProvenance,literalText:finalPreview().textContent.includes("Checkout <should> & must emit it"),markupAbsent:!finalPreview().querySelector("should")};
  enter(host,"/products/0/name",'robot <&> "quoted"\\nline two'); additional.value="Edited <text> & line one\\nline two"; additional.dispatchEvent(new Event("input",{bubbles:true})); const manual=q(host,'[data-reproduction-step-kind="manual"] button[data-adjust-step]'); manual.click(); const editedComponent=q(host,'[data-reproduction-field="componentName"]'); editedComponent.value="Robot card"; editedComponent.dispatchEvent(new Event("input",{bubbles:true})); button(host,"Save changes").click();
  const editedReport=fidelity.report(); const editedRepresentation=model.generateMissingEventRepresentations(editedReport); const editedSteps=stepNodes(); const edited={payload:editedReport.expectedPayload,additional:editedReport.expectedResultAdditionalText,steps:editedSteps,preCount:expectedNodes().filter(({tagName})=>tagName==="PRE").length,narrativeCount:(finalPreview().textContent.match(/pageview is fired with/g)??[]).length,staleAbsent:!finalPreview().textContent.includes("Checkout <should>")&&!finalPreview().textContent.includes('"name": "robot"')&&!editedSteps.includes("Click Robot")};
  button(host,"Save as reported defect and copy").click(); await new Promise((resolve)=>setTimeout(resolve,0));
  const storedDefect=defectLibrary.createMissingEventDefect({id:"defect:fidelity",now:"2026-07-15T00:00:00Z",report:fidelitySaved}); const restoredLibrary=defectLibrary.restoreDefectLibrary(defectLibrary.serializeDefectLibrary({defects:[storedDefect]}));
  const detail=document.createElement("section"); document.body.append(detail); let recopied="";
  defectLibraryUi.renderDefectLibrary({count:null,list:null,empty:null,detail,confirmation:null},restoredLibrary.defects,storedDefect.id,undefined,{open:()=>{},close:()=>{},save:()=>{},recopy:(id)=>{recopied=model.generateMissingEventRepresentations(restoredLibrary.defects.find((item)=>item.id===id).report).jiraText;},updateStatus:()=>{},attachCurrentSession:()=>{},openLinkedSession:()=>{},requestDelete:()=>{},cancelDelete:()=>{},confirmDelete:()=>{}});
  button(detail,"Recopy for Jira Cloud").click(); const reopened=q(detail,'[aria-label="Final report preview"]'); const reopenedRepresentation=model.generateMissingEventRepresentations(restoredLibrary.defects[0].report);
  const expectedReopened=document.createElement("section"); expectedReopened.innerHTML=reopenedRepresentation.previewHtml;
  const persistence={savedPayload:fidelitySaved.expectedPayload,savedAdditional:fidelitySaved.expectedResultAdditionalText,savedSources:fidelitySaved.expectedResponseSources,copiedSame:fidelityCopied===editedRepresentation.jiraText,reopenedSame:reopened.innerHTML===expectedReopened.innerHTML,recopiedSame:recopied===editedRepresentation.jiraText,reopenedPre:reopened.querySelectorAll("pre").length,reopenedSteps:Array.from(reopened.querySelectorAll("ol li")).map(({textContent})=>textContent),provenanceHidden:![reopened.textContent,fidelityCopied,recopied].some((text)=>/response source|schema-provided value|operator custom response|Page type requirement revision/i.test(text)),plainBreaks:fidelityCopied.includes("Edited <text> & line one\\nline two\\npageview is fired with\\n{\\n  \\\"page_type\\\"")};
  detail.remove();

  host.replaceChildren(); host.style.width="320px";
  const storedFlatSchema=JSON.stringify(flatSchema); let flatCopied=""; let flatSaved;
  const runtimeErrors=[]; const onRuntimeError=(event)=>runtimeErrors.push(String(event.reason ?? event.error ?? event.message));
  window.addEventListener("error",onRuntimeError); window.addEventListener("unhandledrejection",onRuntimeError);
  const flat=ui.renderMissingEventDefectReportBuilder(host,[productVisit,emptyNestedVisit],[flatSchema],{entryPoint:"Live session actions",initialSchemaId:flatSchema.id,writeClipboard:async(text)=>{flatCopied=text;},saveReportedDefect:async(report)=>{flatSaved=structuredClone(report);}});
  const flatPointers=Array.from(host.querySelectorAll("[data-json-pointer]")).map(({dataset})=>dataset.jsonPointer);
  button(host,"Add page_levels item").click();
  const initialPageLevelItem=q(host,'[data-expected-array-item="/page_levels/0"]');
  const initialPageLevelInput=q(initialPageLevelItem,'[data-expected-payload-input="/page_levels/0"]');
  const initialItem={input:initialPageLevelInput.value,focused:initialPageLevelItem.contains(document.activeElement)};
  const pageLevelChoice=Array.from(host.querySelectorAll("label")).find(({textContent})=>textContent.trim()==="Use schema value d")?.querySelector("input"); if(!pageLevelChoice) throw new Error("Missing page-level choice"); pageLevelChoice.click();
  button(host,"Confirm at least one matching event was expected").click();
  enter(host,"/page_type","invalid");
  const invalidState={validation:q(host,'[data-expected-payload-validation="state"]').textContent,issue:q(host,'[data-expected-payload-issue="/page_type"]').textContent,actions:[button(host,"Copy for Jira Cloud").disabled,button(host,"Save as reported defect").disabled,button(host,"Save as reported defect and copy").disabled]};
  const loginInput=q(host,'[data-expected-payload-input="/login_status"]'); loginInput.focus(); const typed=[];
  for(const character of "logged in"){loginInput.value+=character; loginInput.setSelectionRange(loginInput.value.length,loginInput.value.length); loginInput.dispatchEvent(new InputEvent("input",{bubbles:true,data:character,inputType:"insertText"})); typed.push({value:loginInput.value,same:q(host,'[data-expected-payload-input="/login_status"]')===loginInput,focused:document.activeElement===loginInput,caret:loginInput.selectionStart});}
  choose(host,"Use schema value product_detail"); enter(host,"/page_section","product"); choose(host,"Use schema value logged in"); enter(host,"/b_id","123");
  const flatReport=flat.report(); const flatRepresentation=model.generateMissingEventRepresentations(flatReport);
  const flatActions=[button(host,"Copy for Jira Cloud").disabled,button(host,"Save as reported defect").disabled,button(host,"Save as reported defect and copy").disabled];
  button(host,"Save as reported defect and copy").click(); await new Promise((resolve)=>setTimeout(resolve,0));
  const untypedButton=button(host,"Add untyped_list item");
  window.removeEventListener("error",onRuntimeError); window.removeEventListener("unhandledrejection",onRuntimeError);
  const flatObservation={pointers:flatPointers,escapedAbsent:!flatPointers.some((pointer)=>pointer.includes("~1")),schemaUnchanged:JSON.stringify(flatSchema)===storedFlatSchema,runtimeErrors,initialItem,payload:flatReport.expectedPayload,provenance:flatReport.expectedResponseProvenance,typed,invalid:invalidState,validation:q(host,'[data-expected-payload-validation="state"]').textContent,actions:flatActions,untyped:{disabled:untypedButton.disabled,assistance:host.textContent.includes("array item type must be defined")},fits:host.scrollWidth<=320,narrativeCount:(flatRepresentation.previewText.match(/pageview is fired with/g)??[]).length,preCount:q(host,'[aria-label="Final report preview"]').querySelectorAll("pre").length,compactAbsent:!flatRepresentation.previewText.includes('{"page_levels"'),copiedSame:flatCopied===flatRepresentation.jiraText,savedPayload:flatSaved.expectedPayload};

  host.replaceChildren();
  let rejectedSaveCalls=0;
  const failures=ui.renderMissingEventDefectReportBuilder(host,[zeroVisit],[schema],{entryPoint:"Live session actions",initialSchemaId:schema.id,writeClipboard:async()=>{throw new Error("clipboard rejected");},saveReportedDefect:async()=>{rejectedSaveCalls+=1;throw new Error("persistence rejected");}});
  enter(host,"/order_id","A-123"); choose(host,"Use schema value EUR"); button(host,"Confirm at least one matching event was expected").click();
  const failurePreview=q(host,'[aria-label="Final report preview"]').textContent;
  button(host,"Copy for Jira Cloud").click(); await new Promise((resolve)=>setTimeout(resolve,0)); const copyFailure=host.querySelector('output[aria-live="polite"]')?.textContent;
  button(host,"Save as reported defect").click(); await new Promise((resolve)=>setTimeout(resolve,0)); const saveFailure=host.querySelector('output[aria-live="polite"]')?.textContent;
  const failureObservation={copyFailure,saveFailure,rejectedSaveCalls,unchanged:q(host,'[aria-label="Final report preview"]').textContent===failurePreview,reportPayload:failures.report().expectedPayload};

  const second = { ...assignment, id:"assignment:secondary", name:"Secondary checkout" };
  const disabled = { ...assignment, id:"assignment:disabled", enabled:false };
  const expectationCases = [
    { schema, action:"confirm the event expectation" },
    { schema:{ ...schema, assignments:[assignment, second] }, action:"choose an assignment and confirm expectation" },
    { schema:{ ...schema, assignments:[] }, action:"acknowledge warning and confirm expectation" },
    { schema:{ ...schema, assignments:[disabled] }, action:"disabled assignment is non-authoritative" },
  ].map(({ schema:current, action }) => { const draft=model.selectMissingEventSchema(model.createMissingEventDraft("Live session actions", [zeroVisit], [current]), current.id); return { enabled:draft.expectation.assignmentChoices.length, selected:draft.expectation.assignment?.id ?? null, disabled:draft.expectation.disabledAssignmentContext.length, action, assistance:draft.assistance }; });
  const matchCounts = [0, 1, 2].map((count) => { const events=[pageview, ...Array.from({ length:count }, (_, index) => purchase("purchase-" + (index + 1), String(20 + index)))]; const draft=model.verifyMissingEventAbsence(model.confirmMissingEventExpectation(model.selectMissingEventSchema(model.createMissingEventDraft("Live session actions", [visit("visit:count:" + count, events)], [schema]), schema.id))); return { count:draft.verification.matchingCount, warning:draft.verification.warningVisible, continuation:draft.verification.matchingCount ? "available through explicit override" : "available without override" }; });
  const savedEvents = [pageview]; const savedDraft = model.createMissingEventDraft("saved session", [visit("visit:saved", savedEvents, true)], [schema]); savedEvents.push(purchase("later-live", "40"));
  const saved = model.verifyMissingEventAbsence(model.confirmMissingEventExpectation(model.selectMissingEventSchema(savedDraft, schema.id)));
  const sideEntry = document.querySelector("#report-missing-event")?.textContent;
  document.querySelector("#data-layer-view-schemas")?.click();
  const schemaRowEntries = Array.from(document.querySelectorAll("#schema-list button")).filter(({ textContent }) => textContent === "Report missing event").length;
  host.remove();
  return {
    entries:{ sideEntry, schemaRowEntries }, navigation:{ labels:navigation, noCapturedNavigation, focused }, fidelity:{incomplete,beforeConfirmation,complete,edited,persistence}, unified:{initial:unifiedInitial,complete:unifiedComplete,nested:nestedObservation,flat:flatObservation,failures:failureObservation},
    zero:{ replacement:{ review:replacementReview, acceptedEventName, intervalControls }, verification:zeroVerification, report:{ type:zeroReport.type, capturedEventId:zeroReport.capturedEventId ?? null, actual:zeroReport.actual, absenceEvidence:zeroReport.absenceEvidence, expected:zeroReport.expected, expectedPayload:zeroReport.expectedPayload, schema:zeroReport.schema.name + " revision " + zeroReport.schema.version, payload:zeroReport.payload ?? null, capture:zeroReport.capture ?? null, issues:zeroReport.validationIssues.length, timeline:zeroReport.timeline.map(({ id }) => id) }, preview:zeroRepresentations.previewText, jira:zeroRepresentations.jiraText, copied, savedCount },
    warning:{ before:warningBefore, openedEvent, restored, override:{ count:overrideReport.override.matchingCount, evidence:overrideReport.matchingEventEvidence.map(({ id }) => id), eventPayload:overrideReport.matchingEventEvidence[0].payload, preview:overrideRepresentations.previewText, jira:overrideRepresentations.jiraText } },
    scope:{ zero:scopeZero, match:scopeMatch }, expectationCases, matchCounts,
    saved:{ immutable:saved.scope.immutable, count:saved.verification.matchingCount, sourceCount:savedEvents.length, snapshotCount:saved.scope.events.length },
  };
})()`;

const validationPresenceSemanticsRuntime = `(async () => {
  const validation = await import("/data-layer-schema-verification.js");
  const conditional = await import("/data-layer-conditional-validation-rules.js");
  const presentation = await import("/data-layer-live-validation-presentation.js");
  const liveUi = await import("/data-layer-live-observer-ui.js");
  const actionsCore = await import("/data-layer-live-inspector-actions.js");
  const event = (payload) => ({ sourceId:"history", eventName:"pageview", payload, rawInput:[] });
  const schemaWith = (rules, name="Presence") => ({ ...validation.createSchema(name, 2, { type:"object", properties:{ test:{ type:"string" }, page_type:{ type:"string" }, profile:{ type:"object", properties:{ status:{ type:"string" } } }, products:{ type:"array", items:{ type:"object", properties:{ sku:{ type:"string" } } } }, oOrder:{ type:"object", properties:{ aProducts:{ type:"array", items:{ type:"object" } } } } } }), attachedRules:rules });
  const rule = (id, operator, parameters, propertyPath="/test", extra={}) => ({ id, name:id, version:1, propertyPath, operator, ...(parameters === undefined ? {} : { parameters }), ...extra });
  const evaluate = (payload, rules, schemas) => { const schema=schemaWith(rules); return validation.validateWithSchema(event(payload), schema, schemas ?? [schema]); };
  const operators = [["exact-value","test"],["value-type","string"],["non-empty-string"],["text-length","4"],["digits-only"],["allowed-values","test"],["regular-expression","^test$"],["numeric-range","1,10"],["item-count","1"]].map(([operator, parameters]) => { const result=evaluate({}, [rule(operator, operator, parameters)]); return { operator, status:result.evaluations[0].status, issues:result.issues.length, state:result.state }; });
  const requiredRules = [rule("Required","required"),rule("Allowed values","allowed-values","test")];
  const requiredCases = [["missing",{}],["test",{ test:"test" }],["another value",{ test:"another value" }]].map(([observed,payload]) => { const result=evaluate(payload, requiredRules); return { observed, statuses:result.evaluations.map(({ status }) => status), issues:result.issues.map(({ rule }) => rule.replace(/ v\\d+$/, "")) }; });
  const nullResult = evaluate({ test:null }, [rule("Allowed values","allowed-values","test")]);
  const undefinedResult = evaluate({ test:undefined }, [rule("Allowed values","allowed-values","test"),rule("Required","required")]);
  const nestedRules = [rule("Nested value","allowed-values","active","/profile/status"),rule("Nested required","required",undefined,"/profile/status"),rule("Wildcard value","allowed-values","SKU-1","/products/*/sku"),rule("Wildcard required","required",undefined,"/products/*/sku"),rule("Index value","value-type","object","/products/2"),rule("Index required","required",undefined,"/products/2")];
  const nested = evaluate({ products:[{ sku:"SKU-1" },{}] }, nestedRules);
  const condition = { operator:"All", predicates:[{ propertyPath:"/page_type", operator:"Equals", comparison:conditional.typedComparisonValue("product_detail"), detectedType:"string" }] };
  const conditionalCases = [["allowed-values","/test",{ page_type:"product_detail" }],["item-count","/oOrder/aProducts",{ page_type:"product_detail", oOrder:{} }],["item-count","/oOrder/aProducts",{ page_type:"product_detail", oOrder:{ aProducts:[] } }],["required","/oOrder/aProducts/0",{ page_type:"product_detail", oOrder:{ aProducts:[] } }]].map(([operator,path,payload]) => { const result=evaluate(payload,[rule("Conditional",operator,operator === "allowed-values" ? "test" : operator === "item-count" ? "1" : undefined,path,{ conditionGroup:condition })]); return { operator, path, status:result.evaluations[0].status, issues:result.issues.length }; });
  const legacy = evaluate({}, [{ id:"Legacy", name:"Legacy", version:1, operator:"allowed-values", parameters:"test:test" }]);
  const parent=schemaWith([rule("Inherited","allowed-values","test")],"Parent"); const child={ ...schemaWith([],"Child"), parentSchemaId:parent.id }; const inherited=validation.validateWithSchema(event({}),child,[parent,child]);
  const summaries=[...operators.map(({ status }, index) => ({ status, rule:"optional-"+index, propertyPath:"test", message:"Not applicable", expected:"value", actual:"missing", ruleVersion:1, severity:"error", schemaName:"Presence", schemaVersion:2 }))];
  const liveSummary=presentation.propertyValidationSummary(summaries);
  const displayResult=evaluate({}, operators.map(({ operator }) => rule("Displayed "+operator,operator,operator === "exact-value" || operator === "allowed-values" ? "test" : operator === "value-type" ? "string" : operator === "text-length" ? "4" : operator === "regular-expression" ? "^test$" : operator === "numeric-range" ? "1,10" : operator === "item-count" ? "1" : undefined)));
  const elements=liveUi.findLiveObserverElements();
  const actions=actionsCore.createLiveInspectorActions({ currentPageUrl:()=>"https://shop.example/presence", writeClipboard:async()=>{}, storeTemplate:()=>{}, addPropertyValidation:()=>{}, validationState:()=>"Valid", updateValidation:()=>{}, manualSchemaChoices:()=>[], selectManualSchema:()=>{} });
  liveUi.renderLiveInspector(elements,{ id:"presence-event", name:"pageview", sourceId:"history", captureTime:"2026-07-14T12:00:00Z", pageUrl:"https://shop.example/presence", payload:{}, rawInput:[], validation:displayResult.state, validationDetails:{ issues:displayResult.issues, evaluations:displayResult.evaluations } },actions);
  const defaultInspectorText=elements.eventInspector.textContent;
  elements.eventInspector.querySelector("#live-non-applicable-properties").click();
  const revealedInspectorText=elements.eventInspector.textContent;
  const liveInspector={ hiddenByDefault:!defaultInspectorText.includes("9 rules not applicable"), revealed:revealedInspectorText.includes("9 rules not applicable"), issueRows:elements.eventInspector.querySelectorAll("#live-event-validation-issues li").length, invalidMissing:/(?:actual|received) Missing/i.test(revealedInspectorText) };
  return { operators, requiredCases, nullValue:{ status:nullResult.evaluations[0].status, actual:nullResult.evaluations[0].actual, issueActual:nullResult.issues[0].actual }, undefinedValue:{ statuses:undefinedResult.evaluations.map(({ status }) => status), actuals:undefinedResult.evaluations.map(({ actual }) => actual), typeIssueActual:undefinedResult.issues.find(({ message }) => message === "Type mismatch")?.actual }, nested:{ issues:nested.issues.map(({ rule, instancePath }) => [rule.replace(/ v\\d+$/, ""),instancePath]), notApplicable:nested.evaluations.filter(({ status }) => status === "not-applicable").map(({ propertyPath }) => propertyPath), wildcardPasses:nested.evaluations.filter(({ rule,status }) => rule === "Wildcard value" && status === "pass").length }, conditionalCases, equivalent:{ legacy:legacy.evaluations[0].status, inherited:inherited.evaluations[0].status, issues:legacy.issues.length+inherited.issues.length }, liveSummary, liveInspector };
})()`;

const defectLibrarySeedRuntime = `(async () => {
  const defects = await import("/data-layer-defect-library.js");
  const sessions = await import("/data-layer-saved-sessions.js");
  const feed = await import("/data-layer-saved-session-live-feed.js");
  const report = { summary:"purchase has invalid currency", description:"Original details", expectedExplanation:"Use EUR or USD", editable:["summary","description","expectedExplanation"], event:{ id:"purchase:1", name:"purchase", source:"Event history", pageUrl:"https://shop.example/checkout", pathname:"/checkout", captureTime:"2026-07-14T14:00:00Z", payload:{ commerce:{ currency:"GBP" } }, schema:{ name:"Checkout", version:2 }, issues:[] }, issues:[], actual:{ payload:{ commerce:{ currency:"GBP" } }, differences:[{ pointer:"/commerce/currency", marker:"−", treatment:"red", value:"GBP" }] }, expected:{ payload:{ commerce:{ currency:"EUR" } }, corrections:[{ issueId:"currency", pointer:"/commerce/currency", operation:"replace", response:"EUR", marker:"+" }], explanations:["Use EUR or USD"] }, reproductionSteps:[], timeline:[], evidence:{ schema:"Checkout version 2", validation:[{ rule:"Known currencies", ruleVersion:2, severity:"error", pointer:"/commerce/currency", constraint:"EUR,USD", actual:"GBP" }], capture:{ eventName:"purchase", source:"Event history", pageUrl:"https://shop.example/checkout", captureTime:"2026-07-14T14:00:00Z" } } };
  const issue = { sourceId:"event-history", eventName:"purchase", schemaId:"schema:checkout", validationTarget:"payload", concretePath:"/commerce/currency", templatePath:"/commerce/currency", ruleId:"rule:known-currencies", ruleRevision:2, actual:"GBP", expected:"EUR,USD", pageUrl:"https://shop.example/checkout", captureTime:"2026-07-14T14:00:00Z", sourceName:"Event history", schemaName:"Checkout", ruleName:"Known currencies" };
  const validation = defects.createValidationDefect({ id:"defect:currency", now:"2026-07-14T14:01:00Z", report, issues:[issue], notes:"Initial note" });
  const missingReport = { type:"Missing event", actual:"No purchase", expected:"purchase", schema:{ id:"schema:checkout", name:"Checkout", version:2, rules:[] }, expectation:{ sourceId:"event-history", eventName:"purchase", target:"payload", pageUrl:"https://shop.example/checkout", explanation:"Purchase expected" }, scope:{ id:"visit:1", pageUrl:"https://shop.example/checkout", pathname:"/checkout", startedAt:"2026-07-14T14:00:00Z", endedAt:"2026-07-14T14:01:00Z" }, validationIssues:[], matchingEventEvidence:[], reproductionSteps:[], timeline:[] };
  const missing = defects.createMissingEventDefect({ id:"defect:missing", now:"2026-07-14T14:01:00Z", report:missingReport, notes:"Missing checkout" });
  localStorage.setItem(defects.DEFECT_LIBRARY_STORAGE_KEY, defects.serializeDefectLibrary({ defects:[validation,missing] }));
  const savedEvent={ id:"purchase:1",sourceId:"event-history",sourceName:"Event history",name:"purchase",payload:{commerce:{currency:"GBP"}},rawInput:[],pageUrl:"https://shop.example/checkout",captureTime:"2026-07-14T14:00:00Z",validation:"1 issues",validationDetails:{schema:{id:"schema:checkout",name:"Checkout",version:2},assignment:{sourceId:"event-history",eventName:"purchase",target:"payload"},evaluations:[],issues:[{instancePath:"/commerce/currency",templatePath:"/commerce/currency",message:"Known currency",expected:"EUR,USD",actual:"GBP",schemaName:"Checkout",schemaVersion:2,schemaLocation:"#/commerce/currency",rule:"Known currencies v2",severity:"error"}]}};
  const saved=sessions.saveCompletedSession(sessions.createSavedSessionLibrary(),{id:"session:seed",pageScope:"https://shop.example/checkout",startedAt:"2026-07-14T14:00:00Z",endedAt:"2026-07-14T14:01:00Z",events:[savedEvent]},"Defect evidence");
  localStorage.setItem(feed.SAVED_SESSION_LIBRARY_STORAGE_KEY,sessions.serializeSavedSessionLibrary(saved));
  return { report, issue };
})()`;

const defectLibraryRuntime = `(async () => {
  const defects = await import("/data-layer-defect-library.js");
  const observer = await import("/data-layer-live-observer.js");
  const observerUi = await import("/data-layer-live-observer-ui.js");
  const sessions = await import("/data-layer-saved-sessions.js");
  const q = (selector, root=document) => { const value=root.querySelector(selector); if (!value) throw new Error("Missing " + selector); return value; };
  const click = (label, root=document) => { const value=Array.from(root.querySelectorAll("button")).find((candidate) => candidate.textContent === label || candidate.textContent.startsWith(label)); if (!value) throw new Error("Missing action " + label); value.click(); return value; };
  const nav = Array.from(q("#data-layer-views").querySelectorAll("button")).map((button) => button.textContent);
  q("#data-layer-view-sessions").click(); click("Open in Live feed",q("#saved-session-list")); const liveList=q("#live-event-list"); liveList.style.height="1px"; liveList.style.overflow="auto"; const spacer=document.createElement("div"); spacer.style.height="1200px"; liveList.append(spacer); liveList.scrollTop=480; q("#live-event-feed button").click();
  const actualReportedLinks=q("#live-event-inspector").querySelectorAll(".live-reported-defect-link").length; const originScroll=q("#live-event-list").scrollTop; q("#live-event-inspector .live-reported-defect-link").click();
  const openedFromIssue={ view:q('#data-layer-view-defects').getAttribute("aria-selected"), detail:q("#defect-library-detail").hidden };
  click("Back to Defects",q("#defect-library-detail"));
  const returnedToIssue={ view:q('#data-layer-view-live').getAttribute("aria-selected"), event:q("#live-event-inspector h4").textContent, focused:document.activeElement?.classList.contains("live-reported-defect-link"), scrollPreserved:q("#live-event-list").scrollTop===originScroll };
  q("#data-layer-view-defects").click();
  const restoredCount = q("#defect-library-list").children.length;
  const search = q("#defect-library-search"); search.value="Initial note"; search.dispatchEvent(new Event("input", { bubbles:true })); const filteredCount=q("#defect-library-list").children.length; search.value=""; search.dispatchEvent(new Event("input", { bubbles:true }));
  q('[data-defect-id="defect:currency"] button').click();
  const detail=q("#defect-library-detail"); q('[data-defect-field="description"]',detail).value="Edited details"; q('[data-defect-field="notes"]',detail).value="Jira https://jira.example/browse/DL-42"; click("Save defect edits",detail);
  const edited={ description:q('[data-defect-field="description"]',detail).value, notes:q('[data-defect-field="notes"]',detail).value, safeLink:{ href:q('[aria-label="Note links"] a',detail).href, target:q('[aria-label="Note links"] a',detail).target, rel:q('[aria-label="Note links"] a',detail).rel } };
  const writes=[]; Object.defineProperty(navigator,"clipboard",{ configurable:true, value:{ writeText:async (text) => writes.push(text) } }); click("Recopy for Jira Cloud",detail); await new Promise((resolve) => setTimeout(resolve,0));
  click("Resolve",detail); const resolved=q("#defect-library-detail p").textContent; click("Reopen",detail); const reopened=q("#defect-library-detail p").textContent; click("Archive",detail); const archived=q("#defect-library-detail p").textContent; click("Back to Defects",detail);
  q('[data-defect-id="defect:missing"] button').click(); click("Delete",detail); const confirmation=q("#defect-delete-confirmation").textContent; click("Confirm deletion",q("#defect-delete-confirmation")); const afterDelete=q("#defect-library-list").children.length;
  const stored=defects.restoreDefectLibrary(localStorage.getItem(defects.DEFECT_LIBRARY_STORAGE_KEY));
  const issue=(overrides={}) => ({ sourceId:"event-history", eventName:"purchase", schemaId:"schema:checkout", validationTarget:"payload", concretePath:"/commerce/currency", templatePath:"/commerce/currency", ruleId:"rule:known-currencies", ruleRevision:2, actual:"GBP", expected:"EUR,USD", pageUrl:"https://shop.example/checkout", sourceName:"Event history", schemaName:"Checkout", ruleName:"Known currencies", ...overrides });
  const report=stored.defects[0].report;
  const active=defects.createValidationDefect({ id:"active:currency", now:"2026-07-14T14:00:00Z", report, issues:[issue()] });
  const orderIssue=issue({ concretePath:"/order_id", templatePath:"/order_id", ruleId:"rule:required-order", ruleName:"Required order" });
  const activeOrder=defects.createValidationDefect({ id:"active:order", now:"2026-07-14T14:00:00Z", report:{ ...report, summary:"purchase has missing order id" }, issues:[orderIssue] });
  const event={ id:"purchase:1", name:"purchase", sourceId:"event-history", sourceName:"Event history", captureTime:"2026-07-14T14:00:00Z", pageUrl:"https://shop.example/checkout", payload:{ commerce:{ currency:"GBP" } }, rawInput:[], validation:"2 issues", validationDetails:{ schema:{ id:"schema:checkout", name:"Checkout", version:2 }, assignment:{ sourceId:"event-history", eventName:"purchase", target:"payload" }, evaluations:[], issues:[{ instancePath:"/commerce/currency", templatePath:"/commerce/currency", message:"Known currency", expected:"EUR,USD", actual:"GBP", schemaName:"Checkout", schemaVersion:2, schemaLocation:"#/commerce/currency", rule:"Known currencies v2", severity:"error" },{ instancePath:"/order_id", templatePath:"/order_id", message:"Required", expected:"value", actual:"missing", schemaName:"Checkout", schemaVersion:2, schemaLocation:"#/order_id", rule:"Required order v2", severity:"error" }] } };
  const renderCases=[[],[active],[active,activeOrder]].map((reported) => {
    const triage=defects.presentedEventTriage(event,{ defects:reported }); const presented={ ...event, defectTriage:triage };
    const host=document.createElement("section"); host.innerHTML='<section id="data-layer-panel-live"><section id="live-event-list"><ul id="live-event-feed"></ul></section><aside id="live-event-inspector"></aside><button id="back-to-events"></button></section>'; document.body.append(host);
    const elements=observerUi.findLiveObserverElements(host); observerUi.renderLiveObserverState(elements,{ ...observer.createLiveObserverState({ pageUrl:event.pageUrl, sources:[] }), events:[presented] },()=>{});
    observerUi.renderLiveInspector(elements,presented,{ copyPayload:async()=>{},saveToLibrary:()=>{},startDefectReport:()=>{},openReportedDefect:()=>{},validationAvailability:()=>({enabled:true}),validate:()=>{},manualSchemaChoices:()=>[],selectManualSchema:()=>{} });
    const result={ triage:triage.state, feed:q("#live-event-feed",host).textContent, validation:q("#live-inspector-validation-summary",host).textContent, reported:host.querySelectorAll(".live-reported-defect-link").length, fresh:host.querySelectorAll(".live-new-defect-state").length }; host.remove(); return result;
  });
  const differences=[[{actual:"CAD"},"Reported"],[{pageUrl:"https://other.example"},"Reported"],[{sourceId:"other"},"New"],[{eventName:"refund"},"New"],[{schemaId:"schema:other"},"New"],[{validationTarget:"raw input"},"New"],[{concretePath:"/other",templatePath:"/other"},"New"],[{ruleId:"rule:other"},"New"],[{ruleRevision:3},"Review required"]].map(([difference]) => defects.issueTriage(issue(difference),{ defects:[active] }).state);
  const wildcard=defects.createValidationDefect({ id:"active:sku", now:"2026-07-14T14:00:00Z", report, issues:[issue({ concretePath:"/products/0/sku", templatePath:"/products/*/sku", ruleId:"rule:sku" })] });
  const wildcardMatch=defects.matchingDefects(issue({ concretePath:"/products/3/sku", templatePath:"/products/*/sku", ruleId:"rule:sku" }),{ defects:[wildcard] }).map(({id})=>id);
  const actionWrites=[]; const actionResults=[]; for (const action of ["Copy for Jira Cloud","Save as reported defect","Save as reported defect and copy"]) { const result=await defects.completeDefectReportAction(defects.createDefectLibrary(),active,action,{writeText:async(text)=>actionWrites.push(text)},()=>"jira"); actionResults.push([action,result.library.defects.length,result.copied]); }
  const completed={ id:"session:one",pageScope:event.pageUrl,startedAt:event.captureTime,endedAt:event.captureTime,events:[event] }; const linked=defects.attachSavedSessionToDefect({defects:[active]},sessions.createSavedSessionLibrary(),active.id,completed,"Evidence","2026-07-14T14:02:00Z");
  const resolvedLibrary=defects.updateDefectStatus({defects:[active]},active.id,"Resolved","2026-07-14T14:03:00Z"); const archivedLibrary=defects.updateDefectStatus({defects:[active]},active.id,"Archived","2026-07-14T14:03:00Z");
  return { nav,actualReportedLinks,openedFromIssue,returnedToIssue,restoredCount,filteredCount,edited,recopy:writes[0],lifecycle:{resolved,reopened,archived},confirmation,afterDelete,stored:{count:stored.defects.length,status:stored.defects[0].status,description:stored.defects[0].report.description,notes:stored.defects[0].notes},renderCases,differences,wildcardMatch,actionResults,actionWrites,linked:{sessions:linked.savedSessions.sessions.length,id:linked.library.defects[0].savedSession.id,contains:linked.library.defects[0].savedSession.containsMatchingIssue,immutable:Object.isFrozen(linked.savedSessions.sessions[0])},statuses:{resolved:defects.issueTriage(issue(),resolvedLibrary).state,archived:defects.issueTriage(issue(),archivedLibrary).state} };
})()`;

const localRulePromotionSeedRuntime = `(() => {
  localStorage.clear();
  const assignment={id:"assignment:page-view",sourceId:"history",eventName:"page_view",target:"payload",versionPolicy:"follow latest",enabled:true};
  const document={type:"object",properties:{page_type:{type:"string"},site:{type:"string"}}};
  const conditionGroup={operator:"All",predicates:[{propertyPath:"/site",operator:"Equals",comparison:{type:"string",value:"consumer"},detectedType:"string"}]};
  const local40={id:"local-40",name:"Known page types",version:1,propertyPath:"/page_type",operator:"exact-value",parameters:"product"};
  const local41={id:"local-41",name:"Known page types",version:1,propertyPath:"/page_type",operator:"allowed-values",allowedValues:["product","content"],applicableType:"string",severity:"warning",message:"Use a known page type",conditionGroup,enabled:true};
  const local42={id:"local-42",name:"Other page types",version:1,propertyPath:"/page_type",operator:"regular-expression",parameters:"^product"};
  const published={...local41,allowedValues:["product"]};
  const schema={id:"schema:page-view",name:"Page view",version:3,published:true,document,assignments:[assignment],attachedRules:[published],revisionHistory:[],workingDraft:{baseVersion:3,sourceVersion:3,document,assignments:[assignment],attachedRules:[local40,local41,local42],pendingChanges:["Document page ownership"]}};
  const other={id:"schema:other",name:"Other",version:1,published:true,document:{type:"object",properties:{other:{type:"string"}}},assignments:[],attachedRules:[],revisionHistory:[]};
  localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([schema,other]));
  localStorage.setItem("my-chrome-utilities.schema-rule-library.v1","[]");
  return true;
})()`;

const localRulePromotionAvailabilitySeedRuntime = `(() => {
  localStorage.clear();
  const assignment={id:"assignment:page-view",sourceId:"history",eventName:"page_view",target:"payload",versionPolicy:"follow latest",enabled:true};
  const document={type:"object",properties:{"/page_type":{type:"string"},"/page_name":{type:"string"}}};
  const local41={id:"local-41",name:"Known page types",version:1,propertyPath:"/page_type",operator:"allowed-values",allowedValues:["product","content"],applicableType:"string",severity:"warning",message:"Use a known page type",enabled:true};
  const local42={id:"local-42",name:"Required page name",version:1,propertyPath:"/page_name",operator:"required",enabled:true};
  const schema={id:"schema:page-view",name:"Page view",version:3,published:true,document,assignments:[assignment],attachedRules:[local41,local42],revisionHistory:[]};
  localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([schema]));
  localStorage.setItem("my-chrome-utilities.schema-rule-library.v1","[]");
  return true;
})()`;

const localRulePromotionAvailabilityRuntime = `(async () => {
  const pause=()=>new Promise((resolve)=>setTimeout(resolve,0));
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const click=(root,label)=>{const value=Array.from(root.querySelectorAll("button")).find(({textContent})=>textContent===label||textContent.startsWith(label));if(!value)throw new Error("Missing action "+label);value.click();return value;};
  const set=(selector,value,event="input")=>{const input=q(selector);input.value=value;input.dispatchEvent(new Event(event,{bubbles:true}));return input;};
  const schemaKey="my-chrome-utilities.schema-library.v1",ruleKey="my-chrome-utilities.schema-rule-library.v1";
  const stored=()=>JSON.parse(localStorage.getItem(schemaKey)); const page=()=>stored().find(({id})=>id==="schema:page-view");
  const openPage=()=>{q("#data-layer-view-schemas").click();const row=Array.from(q("#schema-list").children).find(({textContent})=>textContent.includes("Page view"));click(row,"Edit working draft");};
  const property=(canonical)=>q('[data-schema-property-canonical-path="'+canonical+'"]');
  const promotion=(id,canonical="/page_type")=>{const host=property(canonical);q("details[data-attached-rules]",host).open=true;return q('.schema-attached-rule[data-rule-id="'+id+'"] .local-rule-promotion-action',host);};
  const initialSchemaBytes=JSON.stringify(page()); const initialStorage=[localStorage.getItem(schemaKey),localStorage.getItem(ruleKey)];
  openPage(); const initialAction=promotion("local-41");
  const initial={controlCount:initialAction.parentElement.querySelectorAll(".local-rule-promotion-action:enabled").length,noWorkingDraft:page().workingDraft===undefined,canonicalRows:document.querySelectorAll('[data-schema-property-canonical-path="/page_type"]').length,identity:initialAction.dataset.ruleId,path:initialAction.dataset.propertyPath};
  initialAction.click(); const firstReview=q("#local-rule-promotion-summary").textContent; click(q("#local-rule-promotion-review"),"Cancel");
  const cancelled={storageUnchanged:initialStorage[0]===localStorage.getItem(schemaKey)&&initialStorage[1]===localStorage.getItem(ruleKey),noWorkingDraft:page().workingDraft===undefined};
  q("#close-schema-editor").click();openPage();cancelled.reopenedCount=promotion("local-41").parentElement.querySelectorAll(".local-rule-promotion-action:enabled").length;
  const failureBefore=[localStorage.getItem(schemaKey),localStorage.getItem(ruleKey)];promotion("local-41").click();set("#local-rule-promotion-name","Approved page types");const original=Storage.prototype.setItem;let failed=false;Storage.prototype.setItem=function(key,value){if(key===schemaKey&&!failed){failed=true;throw new Error("simulated availability failure");}return original.call(this,key,value);};try{click(q("#local-rule-promotion-review"),"Confirm promotion");}finally{Storage.prototype.setItem=original;}const failure={storageUnchanged:failureBefore[0]===localStorage.getItem(schemaKey)&&failureBefore[1]===localStorage.getItem(ruleKey),assistance:q("#local-rule-promotion-assistance").textContent,controlRetained:Boolean(document.querySelector('.schema-attached-rule[data-rule-id="local-41"] .local-rule-promotion-action:enabled')),noDraft:page().workingDraft===undefined};click(q("#local-rule-promotion-review"),"Cancel");
  Object.defineProperty(Crypto.prototype,"randomUUID",{value:()=>"51",configurable:true});promotion("local-41").click();set("#local-rule-promotion-name","Approved page types");click(q("#local-rule-promotion-review"),"Confirm promotion");await pause();
  const after=page();const library=JSON.parse(localStorage.getItem(ruleKey));const promoted={review:firstReview,workingDraft:Boolean(after.workingDraft),draftIds:after.workingDraft.attachedRules.map(({id})=>id),libraryIds:library.map(({id})=>id),sameIdentity:after.workingDraft.attachedRules[0].id===library[0].id,publishedUnchanged:JSON.stringify({...after,workingDraft:undefined})===initialSchemaBytes,canonicalRows:document.querySelectorAll('[data-schema-property-canonical-path="/page_type"]').length,reusableControl:Boolean(document.querySelector('.schema-attached-rule[data-rule-id="reusable-51"] .local-rule-promotion-action'))};
  q("#save-schema").click();q("#confirm-schema-revision").click();await pause();openPage();
  const reopened={version:page().version,local42Count:promotion("local-42","/page_name").parentElement.querySelectorAll(".local-rule-promotion-action:enabled").length,reusableCount:document.querySelectorAll('.schema-attached-rule[data-rule-id="reusable-51"] .local-rule-promotion-action').length,noWorkingDraftBeforeAction:page().workingDraft===undefined};
  q("#close-schema-editor").click();q("#create-schema").click();set("#schema-editor-name","Temporary schema");q("#add-schema-property").click();set("#schema-manual-property-path","page_type");click(q("#schema-manual-property-dialog"),"Add property");click(property("/page_type"),"Add rule");click(q("#schema-property-rule-picker"),"Allowed values");set("#schema-local-rule-allowed-value-1","product");click(q("#schema-property-rule-picker"),"Create rule");const tempLocal=q('.schema-attached-rule[data-rule-id^="local-rule:"]',property("/page_type"));const tempId=tempLocal.dataset.ruleId;const tempPromotion=q(".local-rule-promotion-action",tempLocal);tempPromotion.click();set("#local-rule-promotion-name","Standalone page types");click(q("#local-rule-promotion-review"),"Confirm promotion");await pause();const rulesAfterNew=JSON.parse(localStorage.getItem(ruleKey));q("#close-schema-editor").click();const newSchema={localId:tempId,promotedCount:rulesAfterNew.filter(({name})=>name==="Standalone page types").length,standaloneAttachments:rulesAfterNew.find(({name})=>name==="Standalone page types")?.attachments??[],schemaStorageUnchanged:stored().length===1,provisionalAbsent:!localStorage.getItem(schemaKey).includes("Temporary schema")};
  return {initial,cancelled,failure,promoted,reopened,newSchema};
})()`;

const localRulePromotionOpenRuntime = `(() => {
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  q("#data-layer-view-schemas").click();
  Array.from(q("#schema-list").querySelectorAll("button")).find(({textContent})=>textContent==="Edit working draft").click();
  const property=q('li[data-schema-property-path="page_type"]'); const disclosure=q("details[data-attached-rules]",property); disclosure.open=true;
  const row=q('.schema-attached-rule[data-rule-id="local-41"]',property); const action=q(".local-rule-promotion-action",row);
  const detail=q("#schema-detail"); detail.style.maxBlockSize="180px"; detail.scrollTop=47; action.focus({preventScroll:true});
  return {localCount:row.querySelectorAll(".local-rule-promotion-action:enabled").length,reusableCount:0,inheritedCount:0,scroll:detail.scrollTop,focused:document.activeElement?.dataset.ruleId};
})()`;

const localRulePromotionReusableOriginRuntime = `(() => {
  const schemas=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")); const source=schemas[0].workingDraft.attachedRules.find(({id})=>id==="local-41");
  localStorage.setItem("my-chrome-utilities.schema-rule-library.v1",JSON.stringify([{...source,kind:"Allowed values",version:2,attachments:[schemas[0].id],revisionHistory:[]} ])); return true;
})()`;

const localRulePromotionOriginCountRuntime = `(() => {
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;}; q("#data-layer-view-schemas").click(); Array.from(q("#schema-list").querySelectorAll("button")).find(({textContent})=>textContent==="Edit working draft").click(); const row=q('.schema-attached-rule[data-rule-id="local-41"]'); return row.querySelectorAll(".local-rule-promotion-action:enabled").length;
})()`;

const localRulePromotionInheritedSeedRuntime = `(() => {
  localStorage.clear(); const document={type:"object",properties:{page_type:{type:"string"}}}; const inherited={id:"local-41",name:"Known page types",version:1,propertyPath:"/page_type",operator:"allowed-values",allowedValues:["product","content"]};
  const parent={id:"schema:parent",name:"Parent",version:1,published:true,document,assignments:[],attachedRules:[inherited],revisionHistory:[]}; const child={id:"schema:page-view",name:"Page view",version:3,published:true,document,assignments:[],parentSchemaId:parent.id,attachedRules:[],revisionHistory:[],workingDraft:{baseVersion:3,sourceVersion:3,document,assignments:[],parentSchemaId:parent.id,attachedRules:[],pendingChanges:[]}};
  localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([child,parent])); localStorage.setItem("my-chrome-utilities.schema-rule-library.v1","[]"); return true;
})()`;

const localRulePromotionInheritedCountRuntime = `(() => {
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;}; q("#data-layer-view-schemas").click(); Array.from(q("#schema-list").querySelectorAll("button")).find(({textContent})=>textContent==="Edit working draft").click(); const inherited=q("#schema-inherited-rule-groups"); if(!inherited.textContent.includes("local-41"))throw new Error("Inherited stable identity was not rendered"); return inherited.querySelectorAll(".local-rule-promotion-action:enabled").length;
})()`;

const localRulePromotionReviewRuntime = `(() => {
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const review=q("#local-rule-promotion-review"); const rect=review.getBoundingClientRect();
  const observation={summary:q("#local-rule-promotion-summary",review).textContent,configuration:q("#local-rule-promotion-configuration",review).textContent,name:q("#local-rule-promotion-name",review).value,required:q("#local-rule-promotion-name",review).required,focus:document.activeElement?.id,withinWidth:rect.left>=0&&rect.right<=innerWidth};
  Array.from(review.querySelectorAll("button")).find(({textContent})=>textContent==="Cancel").click();
  const property=q('li[data-schema-property-path="page_type"]'); const action=q('.schema-attached-rule[data-rule-id="local-41"] .local-rule-promotion-action',property); action.focus({preventScroll:true});
  return {observation,cancelled:{focus:document.activeElement?.dataset.ruleId,open:q("details[data-attached-rules]",property).open,scroll:q("#schema-detail").scrollTop}};
})()`;

const localRulePromotionPrepareConfirmRuntime = `(() => {
  const review=document.querySelector("#local-rule-promotion-review");
  Object.defineProperty(Crypto.prototype,"randomUUID",{value:()=>"51",configurable:true});
  const name=review.querySelector("#local-rule-promotion-name"); name.value="Approved page types"; name.dispatchEvent(new Event("input",{bubbles:true}));
  const description=review.querySelector("#local-rule-promotion-description"); description.value="Known storefront page types"; description.dispatchEvent(new Event("input",{bubbles:true}));
  const examples=review.querySelector("#local-rule-promotion-examples"); examples.value="product, content"; examples.dispatchEvent(new Event("input",{bubbles:true}));
  const confirm=Array.from(review.querySelectorAll("button")).find(({textContent})=>textContent==="Confirm promotion"); confirm.focus({preventScroll:true});
  return {disabled:confirm.disabled,focus:document.activeElement===confirm};
})()`;

const localRulePromotionFailureRuntime = (failureKey) => `(() => {
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const action=q('.schema-attached-rule[data-rule-id="local-41"] .local-rule-promotion-action'); action.click();
  const review=q("#local-rule-promotion-review"); const name=q("#local-rule-promotion-name",review); name.value="Approved page types"; name.dispatchEvent(new Event("input",{bubbles:true}));
  const schemaKey="my-chrome-utilities.schema-library.v1",ruleKey="my-chrome-utilities.schema-rule-library.v1"; const before=[localStorage.getItem(schemaKey),localStorage.getItem(ruleKey)];
  const original=Storage.prototype.setItem; let failed=false; Storage.prototype.setItem=function(key,value){if(key===${JSON.stringify(failureKey)}&&!failed){failed=true;throw new Error("simulated persistence failure");}return original.call(this,key,value);};
  try { Array.from(review.querySelectorAll("button")).find(({textContent})=>textContent==="Confirm promotion").click(); } finally { Storage.prototype.setItem=original; }
  const after=[localStorage.getItem(schemaKey),localStorage.getItem(ruleKey)]; const result={unchanged:before[0]===after[0]&&before[1]===after[1],local:q('.schema-attached-rule[data-rule-id="local-41"]')!==null,rules:JSON.parse(after[1]).length,assistance:q("#local-rule-promotion-assistance",review).textContent};
  Array.from(review.querySelectorAll("button")).find(({textContent})=>textContent==="Cancel").click(); action.focus({preventScroll:true}); return result;
})()`;

const localRulePromotionAfterRuntime = `(async () => {
  const pause=()=>new Promise((resolve)=>setTimeout(resolve,0)); await pause();
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const schemas=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")); const rules=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1")); const page=schemas.find(({id})=>id==="schema:page-view");
  const property=q('li[data-schema-property-path="page_type"]'); const replacement=q('.schema-attached-rule[data-rule-id="reusable-51"]',property);
  const beforePublish={rule:rules[0],ids:page.workingDraft.attachedRules.map(({id})=>id),paths:page.workingDraft.attachedRules.map(({propertyPath})=>propertyPath),neighbors:[JSON.stringify(page.workingDraft.attachedRules[0]),JSON.stringify(page.workingDraft.attachedRules[2])],pending:page.workingDraft.pendingChanges,publishedId:page.attachedRules[0].id,focus:document.activeElement?.dataset.ruleId,open:q("details[data-attached-rules]",property).open,scroll:q("#schema-detail").scrollTop,noHorizontal:document.documentElement.scrollWidth<=innerWidth};
  q("#save-schema").click(); q("#confirm-schema-revision").click(); await pause();
  const stored=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")); const published=stored.find(({id})=>id==="schema:page-view"); const historical=published.revisionHistory.find(({version})=>version===3); const verification=await import("/data-layer-schema-verification.js"); const event={sourceId:"history",eventName:"page_view",payload:{page_type:"unknown",site:"consumer"},rawInput:[]};
  const currentEvaluation=verification.validateWithSchema(event,published,stored).evaluations.find(({ruleId})=>ruleId==="reusable-51"); const historicalEvaluation=verification.validateWithSchema(event,historical,[historical]).evaluations.find(({ruleId})=>ruleId==="local-41");
  return {beforePublish,afterPublish:{version:published.version,currentId:currentEvaluation.ruleId,historicalId:historicalEvaluation.ruleId,otherIds:stored.find(({id})=>id==="schema:other").attachedRules.map(({id})=>id)}};
})()`;

const allowedValueExpansionSeedRuntime = `(async () => {
  const defects = await import("/data-layer-defect-library.js");
  localStorage.clear();
  const assignment = { id:"assignment:page-view", sourceId:"history", eventName:"page_view", target:"payload", priority:10, versionPolicy:"follow latest", enabled:true };
  const document = { type:"object", properties:{ page_type:{ type:"string" }, site:{ type:"string" } } };
  const rule = { id:"stable-id-41", name:"Known page types", version:1, propertyPath:"/page_type", operator:"allowed-values", parameters:"product,content", severity:"error", message:"Choose a known page type", conditionGroup:{ operator:"All", predicates:[{ propertyPath:"/site", operator:"Equals", comparison:{ type:"string", value:"consumer" }, detectedType:"string" }] } };
  const schema = { id:"schema:otelo-pageview", name:"Otelo - Generic Pageview", version:2, published:true, document, assignments:[assignment], attachedRules:[rule], revisionHistory:[], workingDraft:{ baseVersion:2, sourceVersion:2, document, assignments:[assignment], attachedRules:[rule], pendingChanges:["Document checkout ownership"] } };
  localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([schema]));
  localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", "[]");
  const payload = { page_type:"product_test", site:"consumer" };
  const rawInput = ["page_view",payload];
  const timeline = [{ type:"observed", url:"https://shop.example/products/test", timestamp:"2026-07-14T13:00:00Z", observerPath:"dataLayer", id:"event:page-view", name:"page_view", sessionId:"session:allowed-value", sourceId:"history", sourceKind:"Data layer", pageUrl:"https://shop.example/products/test", payload, rawInput, rawValue:rawInput, validation:"Not checked" }];
  localStorage.setItem("dataLayerTestingSession", JSON.stringify({ session:{ id:"session:allowed-value", status:"active", freshBoundary:true, tabId:1, historyPath:"dataLayer", startUrl:"https://shop.example/products/test", currentUrl:"https://shop.example/products/test", timeline } }));
  const issue = { sourceId:"history", eventName:"page_view", schemaId:schema.id, validationTarget:"payload", concretePath:"/page_type", templatePath:"/page_type", ruleId:rule.id, ruleRevision:1, actual:"product_test", expected:"product,content", pageUrl:"https://shop.example/products/test", captureTime:"2026-07-14T13:00:00Z", sourceName:"history", schemaName:schema.name, ruleName:rule.name };
  const defect = defects.createValidationDefect({ id:"defect:page-type-v2", now:"2026-07-14T13:01:00Z", report:{ summary:"page_view has unknown page type" }, issues:[issue] });
  localStorage.setItem(defects.DEFECT_LIBRARY_STORAGE_KEY, defects.serializeDefectLibrary({ defects:[defect] }));
  return true;
})()`;

const allowedValueExpansionRuntime = `(async () => {
  const pause = () => new Promise((resolve) => setTimeout(resolve, 0));
  const q = (selector, root=document) => { const value=root.querySelector(selector); if (!value) throw new Error("Missing " + selector); return value; };
  const click = (label, root=document) => { const value=Array.from(root.querySelectorAll("button")).find((candidate) => candidate.textContent === label || candidate.textContent.startsWith(label)); if (!value) throw new Error("Missing action " + label); value.click(); return value; };
  q("#live-event-feed button").click(); click("Validate",q("#live-event-inspector")); await pause(); q("#back-to-events").click(); q("#live-event-feed button").click();
  const inspector=q("#live-event-inspector"); const property=q('[data-property-path="/page_type"]'); q(".live-property-status",property).click();
  const actions=()=>Array.from(property.querySelectorAll(".live-allowed-value-expansion"));
  const action=actions()[0]; inspector.style.height="220px"; inspector.style.overflow="auto"; inspector.scrollTop=37; action.focus({preventScroll:true});
  const initial={ count:actions().length, ruleId:action.dataset.ruleId, ruleVersion:action.dataset.ruleVersion, status:q("#live-inspector-validation-summary").textContent, schema:q('dt[data-field="assigned schema"] + dd').textContent, raw:q("#live-raw-json pre").textContent, expanded:q(".live-property-status",property).getAttribute("aria-expanded") };
  action.click();
  const review=q("#allowed-value-expansion-review"); const rect=review.getBoundingClientRect();
  const reviewState={ summary:q("#allowed-value-expansion-summary",review).textContent, publication:review.textContent.includes("published schema remains unchanged"), focus:document.activeElement?.id, destination:q('input[name="allowed-value-expansion-destination"]:checked',review).value, withinWidth:rect.left>=0 && rect.right<=innerWidth };
  click("Cancel",review);
  const cancelled={ focused:document.activeElement?.dataset.ruleId, expanded:q(".live-property-status",property).getAttribute("aria-expanded"), scroll:inspector.scrollTop };
  action.click(); click("Confirm addition",q("#allowed-value-expansion-review")); await pause();
  const storedAfter=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"))[0];
  const draftRule=storedAfter.workingDraft.attachedRules.find(({id})=>id==="stable-id-41");
  const afterConfirm={ values:draftRule.allowedValues, pending:storedAfter.workingDraft.pendingChanges, publishedParameters:storedAfter.attachedRules[0].parameters, publishedValues:storedAfter.attachedRules[0].allowedValues ?? null, condition:draftRule.conditionGroup.predicates[0].comparison.value, severity:draftRule.severity, message:draftRule.message, focused:document.activeElement?.dataset.ruleId, expanded:q('.live-property-status',q('[data-property-path="/page_type"]')).getAttribute("aria-expanded"), scroll:inspector.scrollTop };
  const storedOnce=localStorage.getItem("my-chrome-utilities.schema-library.v1");
  q('.live-allowed-value-expansion[data-rule-id="stable-id-41"]').click();
  const duplicateReview=q("#allowed-value-expansion-review"); const alreadyPending=q("#allowed-value-expansion-pending",duplicateReview).textContent; click("Keep existing pending value",duplicateReview); await pause();
  const duplicateUnchanged=storedOnce===localStorage.getItem("my-chrome-utilities.schema-library.v1");
  q('.live-allowed-value-expansion[data-rule-id="stable-id-41"]').click(); click("Open working draft",q("#allowed-value-expansion-review"));
  const openedDraft={ schemaView:q("#data-layer-view-schemas").getAttribute("aria-selected"), editor:!q("#schema-editor").hidden, focused:document.activeElement?.id, values:JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"))[0].workingDraft.attachedRules[0].allowedValues };
  q("#data-layer-view-live").click(); const returned={ event:q("#live-event-inspector h4").textContent, expanded:q('.live-property-status',q('[data-property-path="/page_type"]')).getAttribute("aria-expanded"), scroll:inspector.scrollTop };
  q("#data-layer-view-schemas").click(); q("#save-schema").click(); q("#confirm-schema-revision").click(); await pause(); q("#data-layer-view-live").click();
  const published=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"))[0]; const finalProperty=q('[data-property-path="/page_type"]');
  const afterPublish={ version:published.version, values:published.attachedRules[0].allowedValues, actionCount:finalProperty.querySelectorAll(".live-allowed-value-expansion").length, status:q("#live-inspector-validation-summary").textContent, feed:q("#live-event-feed button").textContent, schema:q('dt[data-field="assigned schema"] + dd').textContent, raw:q("#live-raw-json pre").textContent, defectStates:Array.from(inspector.querySelectorAll(".live-new-defect-state,.live-reported-defect-link")).map(({textContent})=>textContent) };
  return { initial,review:reviewState,cancelled,afterConfirm,alreadyPending,duplicateUnchanged,openedDraft,returned,afterPublish };
})()`;

const schemaPublicationRefreshSeedRuntime = `(async () => {
  const defects = await import("/data-layer-defect-library.js");
  const sessions = await import("/data-layer-saved-sessions.js");
  localStorage.clear();
  const assignments = ["page_view", "banner"].map((eventName) => ({ id:"assignment:" + eventName, sourceId:"history", eventName, target:"payload", priority:10, versionPolicy:"follow latest", enabled:true }));
  const document = { type:"object", properties:{ page_type:{ type:"string" }, test:{ type:"string" }, currency:{ type:"string" } } };
  const optionalRule = { id:"optional-test", name:"Optional test", version:3, propertyPath:"/test", operator:"allowed-values", parameters:"known", severity:"error" };
  const currencyRule3 = { id:"known-currency", name:"Known currency", version:3, propertyPath:"/currency", operator:"allowed-values", parameters:"EUR,USD", severity:"error" };
  const schema = { id:"product-listing", name:"Product listing", version:3, published:true, document, assignments, attachedRules:[optionalRule,currencyRule3], revisionHistory:[], workingDraft:{ baseVersion:3, sourceVersion:3, document, assignments, attachedRules:[{ ...optionalRule, version:4 },{ ...currencyRule3, version:4 },{ id:"required-page-type", name:"Required page type", version:4, propertyPath:"/page_type", operator:"required", severity:"error" }], pendingChanges:["Add required page type","Revise validation rules"] } };
  localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([schema]));
  const entry = (id, name, time, payload, rawInput, pageUrl) => ({ type:"observed", url:pageUrl, timestamp:time, observerPath:"dataLayer", id, name, sessionId:"session:publication", sourceId:"history", sourceKind:"Data layer", pageUrl, payload, rawInput, rawValue:rawInput, validation:"Not checked" });
  const timeline = [
    entry("event:page-view","page_view","2026-07-14T12:00:00Z",{ currency:"EUR" },["page_view",{ currency:"EUR" }],"https://shop.example/products"),
    entry("event:banner","banner","2026-07-14T12:00:01Z",{ currency:"GBP" },["banner",{ currency:"GBP" }],"https://shop.example/products/2"),
  ];
  localStorage.setItem("dataLayerTestingSession", JSON.stringify({ session:{ id:"session:publication", status:"active", freshBoundary:true, tabId:1, historyPath:"dataLayer", startUrl:"https://shop.example/products", currentUrl:"https://shop.example/products/2", timeline } }));
  const issue = { sourceId:"history", eventName:"banner", schemaId:"product-listing", validationTarget:"payload", concretePath:"/currency", templatePath:"/currency", ruleId:"rule:known-currency", ruleRevision:3, actual:"GBP", expected:"EUR,USD", pageUrl:"https://shop.example/products/2", captureTime:"2026-07-14T12:00:01Z", sourceName:"history", schemaName:"Product listing", ruleName:"Known currency" };
  const defect = defects.createValidationDefect({ id:"defect:currency-v3", now:"2026-07-14T12:01:00Z", report:{ summary:"banner currency is invalid" }, issues:[issue] });
  localStorage.setItem(defects.DEFECT_LIBRARY_STORAGE_KEY, defects.serializeDefectLibrary({ defects:[defect] }));
  const savedEvent = { id:"saved:page-view", name:"page_view", sourceId:"history", sourceName:"history", captureTime:"2026-07-14T11:00:00Z", pageUrl:"https://shop.example/products", payload:{ currency:"EUR" }, rawInput:[], validation:"Valid", validationDetails:{ schema:{ id:"product-listing", name:"Product listing", version:3 }, issues:[], evaluations:[{ propertyPath:"/test", status:"not-applicable", message:"Optional target absent", expected:"known", actual:"missing", rule:"Optional test", ruleVersion:3, severity:"error", schemaName:"Product listing", schemaVersion:3 }] } };
  const saved = sessions.saveCompletedSession(sessions.createSavedSessionLibrary(), { id:"saved:source", pageScope:savedEvent.pageUrl, startedAt:savedEvent.captureTime, endedAt:savedEvent.captureTime, events:[savedEvent] }, "Revision 3 evidence");
  localStorage.setItem("my-chrome-utilities.saved-session-library.v1", sessions.serializeSavedSessionLibrary(saved));
  return true;
})()`;

const schemaPublicationRefreshRuntime = `(async () => {
  const pause = () => new Promise((resolve) => setTimeout(resolve, 0));
  const q = (selector, root=document) => { const value = root.querySelector(selector); if (!value) throw new Error("Missing " + selector); return value; };
  const click = (label, root=document) => { const value = Array.from(root.querySelectorAll("button")).find((candidate) => candidate.textContent === label || candidate.textContent.startsWith(label)); if (!value) throw new Error("Missing action " + label); value.click(); return value; };
  const savedBefore = localStorage.getItem("my-chrome-utilities.saved-session-library.v1");
  click("Add filter", q("#live-event-query"));
  const field = q("#event-feed-query-field"); field.value = "Event name"; field.dispatchEvent(new Event("change", { bubbles:true }));
  const operator = q("#event-feed-query-operator"); operator.value = "is"; operator.dispatchEvent(new Event("change", { bubbles:true }));
  const value = q("#event-feed-query-value"); value.value = "page_view"; value.dispatchEvent(new Event("input", { bubbles:true })); click("Apply condition", q("#live-event-query"));
  const queryBefore = q("#live-event-query-count").textContent;
  q("#live-event-feed button").click(); click("Validate", q("#live-event-inspector")); await pause();
  q("#back-to-events").click(); q("#live-event-feed button").click();
  const assignedTerm=Array.from(q("#live-event-inspector").querySelectorAll("dt")).find((term)=>term.textContent==="Assigned schema");
  if (!assignedTerm) return { debug:{ inspector:q("#live-event-inspector").textContent, feedback:q("#live-validation-update-status").textContent, schemas:localStorage.getItem("my-chrome-utilities.schema-library.v1") } };
  const before = { summary:q("#live-inspector-validation-summary").textContent, schema:assignedTerm.nextElementSibling.textContent, optionalHidden:!document.querySelector('[data-property-path="/test"]') };
  const toggle = q("#live-non-applicable-properties");
  const order = Boolean(toggle.compareDocumentPosition(q("#live-property-search")) & Node.DOCUMENT_POSITION_FOLLOWING);
  toggle.click();
  const optional = q('[data-property-path="/test"]'); const optionalValue = q('[data-missing="true"]',optional); const optionalStatus = q(".live-property-status",optional);
  const dangerProbe=document.createElement("span"); dangerProbe.style.color="var(--danger)"; document.body.append(dangerProbe); const dangerColor=getComputedStyle(dangerProbe).color; dangerProbe.remove();
  const revealed = { label:toggle.textContent, pressed:toggle.getAttribute("aria-pressed"), value:optionalValue.textContent, treatment:optional.dataset.validationTreatment, status:optionalStatus.textContent, missingColor:getComputedStyle(optionalValue).color, dangerColor };
  optionalStatus.click(); optional.focus({ preventScroll:true }); const inspector=q("#live-event-inspector"); inspector.scrollTop=37;
  q("#data-layer-view-schemas").click(); click("Edit working draft", q("#schema-list")); q("#save-schema").click(); q("#confirm-schema-revision").click(); await pause();
  const publication = { result:q("#schema-result").textContent, savedUnchanged:localStorage.getItem("my-chrome-utilities.saved-session-library.v1") === savedBefore };
  q("#data-layer-view-live").click();
  const afterOptional=q('[data-property-path="/test"]'); const pageType=q('[data-property-path="/page_type"]');
  const after = { query:q("#live-event-query-count").textContent, count:q("#live-captured-event-count").textContent, selected:q("#live-event-inspector h4").textContent, summary:q("#live-inspector-validation-summary").textContent, schema:q('dt[data-field="assigned schema"] + dd').textContent, show:q("#live-non-applicable-properties").getAttribute("aria-pressed"), optionalExpanded:q(".live-property-status",afterOptional).getAttribute("aria-expanded"), pageType:q(".live-property-status",pageType).textContent, scroll:inspector.scrollTop, focused:document.activeElement?.dataset.propertyPath, politeAnnouncements:Array.from(document.querySelectorAll('[aria-live="polite"]')).filter((node)=>node.textContent.includes("Published Product listing revision 4. Revalidated 2 current Live events.")).length, feed:Array.from(q("#live-event-feed").querySelectorAll("button")).map((button)=>button.textContent) };
  click("Clear all", q("#active-event-feed-filters")); const bannerButton=Array.from(q("#live-event-feed").querySelectorAll("button")).find((button)=>button.textContent.includes("banner")); bannerButton.click();
  const defectStates=Array.from(q("#live-event-inspector").querySelectorAll(".live-new-defect-state")).map(({textContent})=>textContent);
  const core=await import("/data-layer-schema-publication-refresh.js"); const verification=await import("/data-layer-schema-verification.js"); const observer=await import("/data-layer-live-observer.js");
  const published=verification.restoreSchemaLibrary(localStorage.getItem("my-chrome-utilities.schema-library.v1"));
  const base={ ...observer.createLiveObserverState({ pageUrl:"https://shop.example/products", sources:[] }), events:[{ id:"pre:1",name:"page_view",sourceId:"history",captureTime:"1",pageUrl:"https://shop.example/products",payload:{currency:"EUR"},rawInput:[] },{ id:"pre:2",name:"banner",sourceId:"history",captureTime:"2",pageUrl:"https://shop.example/products/2",payload:{currency:"EUR",page_type:"listing"},rawInput:[] }] };
  const refreshed=core.revalidateCurrentLiveSession(base,published,{}); const appendedInput={sourceId:"history",eventName:"page_view",payload:{currency:"EUR",page_type:"listing"},rawInput:[]}; const appendedValidation=verification.validateEvent(appendedInput,published,"https://shop.example/products/3"); const final=observer.recordLiveEvent(refreshed.state,{id:"post:1",name:"page_view",sourceId:"history",captureTime:"3",pageUrl:"https://shop.example/products/3",payload:appendedInput.payload,rawInput:[],validation:appendedValidation.state,validationDetails:{issues:appendedValidation.issues,evaluations:appendedValidation.evaluations,schema:appendedValidation.schema,assignment:appendedValidation.assignment}});
  return { before,queryBefore,control:{order,revealed},publication,after,defectStates,boundary:{refreshed:refreshed.revalidatedEventIds,ids:final.events.map(({id})=>id),revisions:final.events.map((event)=>event.validationDetails.schema.version)} };
})()`;

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
    if (process.env.SAVED_EVENT_FEED_FILTERS_BROWSER_ADAPTER === "1") {
      await evaluate(socket,savedEventFeedFiltersSeedRuntime);await reloadPanel(socket);
      savedEventFeedFiltersObservation=await evaluate(socket,savedEventFeedFiltersRuntime);
      await reloadPanel(socket);
      savedEventFeedFiltersObservation.reloaded=await evaluate(socket,`(() => ({identity:document.querySelector("#saved-event-feed-filter-identity")?.textContent,count:document.querySelector("#live-event-query-count")?.textContent,activeId:JSON.parse(localStorage.getItem("my-chrome-utilities.saved-event-feed-filter-working.v1"))?.activeFilterId,libraryCount:JSON.parse(localStorage.getItem("my-chrome-utilities.saved-event-feed-filters.v1"))?.filters.length}))()`);
      assert.deepEqual(savedEventFeedFiltersObservation.initial,{identity:"All events",saveAbsent:true,withinWidth:true});
      assert.equal(savedEventFeedFiltersObservation.created.identity,"Checkout issues");
      assert.equal(savedEventFeedFiltersObservation.created.count,"1 of 3 events");
      assert.deepEqual(savedEventFeedFiltersObservation.created.storageKeys,["conditions","id","match","name","valueMatch","version"]);
      assert.deepEqual(savedEventFeedFiltersObservation.created.eventKeys,[]);
      assert.deepEqual(savedEventFeedFiltersObservation.created.stored.conditions.map(({field,operator,values})=>[field,operator,values]),[["Event name","is",["purchase"]],["Validation state","is",["Issues"]]]);
      assert.equal(savedEventFeedFiltersObservation.checkoutApplied.identity,"Checkout issues");
      assert.equal(savedEventFeedFiltersObservation.checkoutApplied.count,"1 of 3 events");
      assert.equal(savedEventFeedFiltersObservation.switchOpen,true);
      assert.equal(savedEventFeedFiltersObservation.cancelled,"Checkout issues · Modified");
      assert.deepEqual(savedEventFeedFiltersObservation.switched,{identity:"Product events",count:"1 of 3 events",checkoutUnchanged:true});
      assert.deepEqual(savedEventFeedFiltersObservation.savedSwitch,{identity:"Product events",updated:true});
      assert.deepEqual(savedEventFeedFiltersObservation.reverted,{identity:"Checkout issues",conditionCount:3});
      assert.deepEqual(savedEventFeedFiltersObservation.failures.map(({operation,unchanged,feedback})=>[operation,unchanged,feedback]),[
        ["update",true,"Updating saved filter failed"],["rename",true,"Renaming saved filter failed"],["default",true,"Setting default failed"],["delete",true,"Deleting saved filter failed"],["create",true,"Saving saved filter failed"],
      ]);
      assert.equal(savedEventFeedFiltersObservation.renamed.identity,"Purchase defects");
      assert.equal(savedEventFeedFiltersObservation.renamed.sameId&&savedEventFeedFiltersObservation.renamed.originalUnchanged,true);
      assert.equal(savedEventFeedFiltersObservation.deleted.identity,"Custom · Unsaved");
      assert.equal(savedEventFeedFiltersObservation.deleted.queryRetained,4);
      assert.equal(savedEventFeedFiltersObservation.deleted.defaultRemoved&&savedEventFeedFiltersObservation.deleted.filterRemoved,true);
      assert.match(savedEventFeedFiltersObservation.duplicate,/A saved filter with this name exists/);
      assert.deepEqual(savedEventFeedFiltersObservation.isolation,{savedIdentity:"Checkout issues",savedCount:"1 of 3 events",currentIdentity:"Custom · Unsaved",currentWorkingRestored:true,globalUnchanged:true,archiveUnchanged:true});
      assert.equal(savedEventFeedFiltersObservation.fresh.identity,"Product events");
      assert.equal(savedEventFeedFiltersObservation.fresh.count,"0 of 0 events");
      assert.equal(savedEventFeedFiltersObservation.fresh.working.activeFilterId,savedEventFeedFiltersObservation.fresh.defaultId);
      assert.deepEqual(savedEventFeedFiltersObservation.reloaded,{identity:"Product events",count:"0 of 0 events",activeId:savedEventFeedFiltersObservation.fresh.defaultId,libraryCount:2});
      assert.equal(savedEventFeedFiltersObservation.selectorWidth<=savedEventFeedFiltersObservation.rootWidth,true);
      socket.close();continue;
    }
    if (process.env.LIVE_GUIDED_CONDITIONAL_RULE_BROWSER_ADAPTER === "1") {
      await evaluate(socket,liveGuidedConditionalRuleSeedRuntime);await reloadPanel(socket);
      liveGuidedConditionalRuleObservation=await evaluate(socket,liveGuidedConditionalRuleRuntime);
      assert.deepEqual(liveGuidedConditionalRuleObservation.requirement,{heading:"Define requirement",applyOnlyWhen:true,schemaEditorHidden:true,pickerClosed:true});
      assert.equal(liveGuidedConditionalRuleObservation.initial.type,"Detected type: string");
      assert.equal(liveGuidedConditionalRuleObservation.initial.comparison,"product_detail");
      assert.deepEqual(liveGuidedConditionalRuleObservation.initial.operators,["Exists","Does not exist","Equals","Does not equal","Is one of","Matches pattern"]);
      assert.equal(liveGuidedConditionalRuleObservation.initial.customerCount===1&&liveGuidedConditionalRuleObservation.initial.currentPageCount===1&&liveGuidedConditionalRuleObservation.initial.noConsequenceOption&&liveGuidedConditionalRuleObservation.initial.withinWidth,true);
      assert.deepEqual(liveGuidedConditionalRuleObservation.absent,{type:"Detected type: string",operators:["Exists","Does not exist","Equals","Does not equal","Is one of","Matches pattern"],comparison:""});
      assert.equal(liveGuidedConditionalRuleObservation.invalidEmpty.storageUnchanged&&liveGuidedConditionalRuleObservation.invalidPattern.storageUnchanged,true);
      assert.equal(liveGuidedConditionalRuleObservation.invalidNoPredicates.storageUnchanged,true);
      assert.match(liveGuidedConditionalRuleObservation.invalidNoPredicates.assistance,/Add at least one condition/);
      assert.match(liveGuidedConditionalRuleObservation.invalidEmpty.assistance,/Enter a comparison value/);
      assert.match(liveGuidedConditionalRuleObservation.invalidPattern.assistance,/Correct the regular expression/);
      assert.deepEqual(liveGuidedConditionalRuleObservation.preview,{allResult:"Failed for the current event",allFalse:"Not applicable for the current event",anyResult:"Failed for the current event"});
      assert.equal(liveGuidedConditionalRuleObservation.confirmation.open&&liveGuidedConditionalRuleObservation.confirmation.retained&&liveGuidedConditionalRuleObservation.confirmation.discarded,true);
      assert.match(liveGuidedConditionalRuleObservation.review.text,/When page_type equals product_detail, oOrder\.aProducts\.0 must be present/);
      assert.equal(liveGuidedConditionalRuleObservation.review.storageUnchanged,true);
      assert.equal(liveGuidedConditionalRuleObservation.local.path,"/oOrder/aProducts/0");
      assert.equal(liveGuidedConditionalRuleObservation.local.failedIssues,1);
      assert.equal(liveGuidedConditionalRuleObservation.local.notApplicable,"not-applicable");
      assert.equal(liveGuidedConditionalRuleObservation.local.notApplicableIssues,0);
      assert.equal(liveGuidedConditionalRuleObservation.local.severity==="error"&&liveGuidedConditionalRuleObservation.local.message==="Validate product_detail from history"&&liveGuidedConditionalRuleObservation.local.enabled,true);
      assert.equal(liveGuidedConditionalRuleObservation.local.restoredFocus,"Add validation for /oOrder/aProducts");
      assert.deepEqual(liveGuidedConditionalRuleObservation.reusable,{libraryCount:1,attachmentCount:1,sameIdentity:true,sameRevision:true,conditionEqual:true,attachmentTotal:2});
      assert.equal(liveGuidedConditionalRuleObservation.cancelled.storageUnchanged&&liveGuidedConditionalRuleObservation.cancelled.inspectorVisible,true);
      assert.equal(liveGuidedConditionalRuleObservation.cancelled.focus,"Add validation for /oOrder/aProducts");
      assert.equal(liveGuidedConditionalRuleObservation.lifecycle.version,4);
      assert.equal(liveGuidedConditionalRuleObservation.lifecycle.workingDraftAbsent&&liveGuidedConditionalRuleObservation.lifecycle.conditionRetained,true);
      assert.equal(liveGuidedConditionalRuleObservation.lifecycle.pinnedVersion===1&&liveGuidedConditionalRuleObservation.lifecycle.revisedVersion===2&&liveGuidedConditionalRuleObservation.lifecycle.revisedConditionRetained,true);
      socket.close();continue;
    }
    if (process.env.REQUIRED_PROPERTY_DEFECT_SCHEMA_CHOICES_BROWSER_ADAPTER === "1") {
      await evaluate(socket, `(() => { localStorage.clear(); return true; })()`);await reloadPanel(socket);
      requiredPropertyDefectSchemaChoicesObservation=await evaluate(socket,requiredPropertyDefectSchemaChoicesRuntime);
      const observed=requiredPropertyDefectSchemaChoicesObservation;
      assert.deepEqual(observed.initial.issues,["Required value"]);assert.deepEqual(observed.initial.evaluation,{status:"not-applicable",reason:"target-absent"});assert.match(observed.initial.issue,/Required value/);assert.match(observed.initial.actual,/missing/);
      assert.deepEqual(observed.initial.choices.filter(({source})=>source==="Generic pageview revision 7").map(({value,source})=>[value,source]),[["product_detail","Generic pageview revision 7"],["product_listing","Generic pageview revision 7"]]);
      assert.match(observed.selectedPreview,/product_detail/);assert.doesNotMatch(observed.deselected.preview,/product_detail/);assert.match(observed.reselected.preview,/product_detail/);assert.match(observed.changed.preview,/product_listing/);assert.equal(observed.changed.inputs,1);assert.equal(observed.deselected.focus&&observed.reselected.focus&&observed.changed.focus,true);assert.equal(observed.deselected.scroll===43&&observed.reselected.scroll===43&&observed.changed.scroll===43,true);
      assert.deepEqual(observed.saved.expected,{page_type:"product_detail"});assert.equal(observed.saved.corrections.length,1);assert.equal(observed.saved.corrections[0].operation,"add");assert.equal(observed.saved.corrections[0].responseProvenance.schema.version,7);assert.doesNotMatch(observed.clipboard.rich.text,/response source:|value-rule provenance:/);assert.doesNotMatch(observed.clipboard.plain,/response source:|value-rule provenance:/);assert.match(observed.clipboard.plain,/product_detail/);assert.match(observed.reopened,/product_detail/);assert.match(observed.recopied,/product_detail/);
      assert.deepEqual(observed.typed.map(({type,operation})=>[type,operation]),[["string","add"],["number","add"],["boolean","add"]]);assert.deepEqual(observed.typed.map(({expected})=>expected),[{page_type:"content"},{market_id:2},{logged_in:false}]);
      assert.deepEqual(observed.pointers.map(({expected})=>expected),[{commerce:{currency:"EUR"}},{products:[{name:"robot"}]},{"a/b":"enabled"},{"tilde~name":"retained"}]);
      assert.deepEqual(observed.effective.values,["product_detail"]);assert.equal(observed.effective.provenance.rules.length,2);assert.deepEqual(observed.conditional,{retail:["product_detail","product_listing"],trade:[]});assert.deepEqual(observed.conflict.values,[]);assert.match(observed.conflict.conflict,/Products.*Listings/);assert.deepEqual(observed.noRule.values,[]);assert.deepEqual(observed.rendered.effective.schema,["product_detail"]);assert.deepEqual(observed.rendered.retail.schema,["product_detail","product_listing"]);assert.deepEqual(observed.rendered.trade.schema,[]);assert.deepEqual(observed.rendered.noRule.schema,[]);assert.equal(observed.rendered.noRule.generic&&observed.rendered.noRule.custom,true);assert.deepEqual(observed.rendered.conflict.schema,[]);assert.equal(observed.rendered.conflict.custom,true);assert.match(observed.rendered.conflict.conflict,/Products.*Listings/);
      assert.equal(observed.immutable,true);assert.equal(observed.layout.body<=observed.layout.width,true);assert.equal(observed.layout.group<=observed.layout.builder,true);assert.deepEqual(observed.runtimeErrors,[]);
      socket.close();continue;
    }
    if (process.env.DEFECT_REPORT_SEMANTIC_DIFFERENCES_BROWSER_ADAPTER === "1") {
      defectReportSemanticDifferencesObservation=await evaluate(socket,defectReportSemanticDifferencesRuntime);
      const observed=defectReportSemanticDifferencesObservation;
      assert.equal(observed.initial.issues.length,4);assert.equal(observed.initial.lines.filter(({group})=>group==="actual").length,4);assert.equal(observed.initial.lines.filter(({group})=>group==="expected").length,4);
      assert.deepEqual(observed.initial.lines.filter(({group})=>group==="expected").map(({operation})=>operation).sort(),["add","add","remove","remove"]);
      assert.equal(observed.initial.lines.some(({text})=>text.includes("invalid actual value")||text.includes("corrected expected value")),false);
      assert.equal(observed.deselected.lines.some(({issueId})=>issueId==="error_action"),false);assert.equal(observed.reselected.lines.filter(({issueId})=>issueId==="error_action").length,2);assert.equal(observed.deselected.focus&&observed.reselected.focus&&observed.deselected.scroll===47&&observed.reselected.scroll===47,true);
      assert.equal(observed.semantic.rich===observed.semantic.plain&&observed.semantic.plain===observed.semantic.saved&&observed.semantic.saved===observed.semantic.reopened&&observed.semantic.reopened===observed.semantic.recopied,true);
      assert.deepEqual(observed.mappings.actual,["undeclared property is present in the actual payload","required property is missing from the actual payload","actual value is not allowed","actual value has the wrong type","actual value does not equal the required value","validation failed: Value violates partner contract","validation failed"]);assert.deepEqual(observed.mappings.expected,["was added to the expected payload","was replaced in the expected payload","was removed from the expected payload",null]);
      assert.equal(observed.pointerCases.every(({pointer,text,html})=>text.includes(pointer)&&html.includes(pointer)),true);assert.match(observed.duplicate,/same-a[\s\S]*same-b/);assert.match(observed.legacy.line,/validation failed/);assert.doesNotMatch(observed.legacy.line,/undeclared|missing|not allowed|wrong type|does not equal/);
      assert.equal(observed.legacy.unchanged&&observed.immutable&&observed.layout.body<=observed.layout.width&&observed.layout.lines,true);assert.deepEqual(observed.runtimeErrors,[]);
      socket.close();continue;
    }
    if (process.env.DEFECT_REPORT_PROVENANCE_PRESENTATION_BROWSER_ADAPTER === "1") {
      defectReportProvenancePresentationObservation=await evaluate(socket,defectReportProvenancePresentationRuntime);
      const observed=defectReportProvenancePresentationObservation;
      assert.equal(observed.captured.suppressed&&observed.captured.operatorPreserved&&observed.captured.expectedPayloadSame&&observed.captured.structuredRetained,true);
      assert.match(observed.captured.controls.removal,/schema declared-property policy/);assert.equal(observed.captured.controls.schema.some(({value,source})=>value==="error"&&source==="Assigned error schema revision 7"),true);assert.equal(observed.captured.controls.custom.includes("Custom value or response"),true);
      assert.deepEqual(observed.captured.corrections.map(({issueId,operation})=>[issueId,operation]),[["action","remove"],["error_action","add"],["page_type","none"],["error_message","add"]]);assert.equal(observed.captured.corrections.find(({issueId})=>issueId==="error_action").responseProvenance.schema.version,7);assert.equal(observed.captured.corrections.find(({issueId})=>issueId==="error_message").responseSource,"operator custom override");
      assert.equal(observed.captured.evidence.every(({rule,ruleVersion,severity,pointer,constraint})=>rule&&Number.isInteger(ruleVersion)&&severity&&pointer&&constraint),true,JSON.stringify(observed.captured.evidence));assert.equal(observed.captured.focusScroll.before.focus&&observed.captured.focusScroll.after.focus&&observed.captured.focusScroll.before.scroll===53&&observed.captured.focusScroll.after.scroll===53&&observed.captured.focusScroll.scroll===53,true,JSON.stringify(observed.captured.focusScroll));
      assert.equal(observed.missing.suppressed&&observed.missing.operatorPreserved&&observed.missing.reportAvailable,true);assert.deepEqual(observed.missing.payload,{error_action:"error"});assert.equal(observed.missing.sources["/error_action"],"schema-provided value");assert.equal(observed.missing.provenance["/error_action"].version,1);
      assert.equal(observed.legacy.suppressed&&observed.legacy.metadata&&observed.legacy.unchanged&&observed.legacy.assistance,true);assert.equal(observed.immutable,true);assert.equal(observed.layout.body<=observed.layout.width&&observed.layout.builder<=observed.layout.width&&observed.layout.missing<=observed.layout.width,true);assert.deepEqual(observed.runtimeErrors,[]);
      socket.close();continue;
    }
    if (process.env.EVENT_OCCURRENCE_DEFECT_REPORT_BROWSER_ADAPTER === "1") {
      eventOccurrenceDefectReportObservation=await evaluate(socket,eventOccurrenceDefectReportRuntime);
      const observed=eventOccurrenceDefectReportObservation;
      assert.deepEqual(observed.initial,{validation:"Validation passed",actions:["Report unexpected event","Report wrong event name"]});
      assert.equal(observed.unexpected.stage,"captured occurrence and absence expectation");assert.equal(observed.unexpected.type,"Unexpected event");assert.deepEqual(observed.unexpected.corrections,[]);assert.match(observed.unexpected.preview,/no page_view event is fired/);
      assert.equal(observed.wrong.stage,"captured occurrence and replacement event identity");assert.equal(observed.wrong.identity,"assignment:product-view");assert.match(observed.wrong.payloadState,/product_detail/);assert.equal(observed.wrong.type,"Wrong event name");assert.match(observed.wrong.preview,/product_view/);assert.equal(observed.wrong.representationsEquivalent,true);
      assert.deepEqual(observed.common,{expected:true,steps:true,timeline:true,details:3});assert.deepEqual(observed.persisted.map(({type})=>type),["Unexpected event","Wrong event name"]);assert.equal(observed.persisted.every(({occurrenceMatch})=>Boolean(occurrenceMatch)),true);
      assert.equal(observed.clipboard.rich,1);assert.equal(observed.immutable,true);assert.equal(observed.layout.body<=observed.layout.width&&observed.layout.builder<=observed.layout.width,true);assert.deepEqual(observed.runtimeErrors,[]);
      socket.close();continue;
    }
    if (process.env.SCHEMA_ASSIGNMENT_DATA_CONDITIONS_BROWSER_ADAPTER === "1") {
      await evaluate(socket,`(()=>{localStorage.clear();const legacyAssignment={id:"legacy",name:"Legacy assignment",schemaId:"schema:legacy",sourceId:"event-history",eventName:"generic_event",target:"payload",priority:20,versionPolicy:"follow latest",enabled:true};const currentAssignment={id:"current",name:"Current assignment",schemaId:"schema:current",sourceId:"event-history",eventName:"generic_event",target:"payload",priority:10,conditionTarget:"payload",dataConditionGroup:{operator:"Any",predicates:[{propertyPath:"/error_type",operator:"Exists",detectedType:"string"},{propertyPath:"/page_levels",operator:"Exists",detectedType:"array"},{propertyPath:"/site_section",operator:"Exists",detectedType:"string"}]},versionPolicy:"follow latest",enabled:true};const schemas=[{id:"schema:legacy",name:"Legacy generic event",version:4,published:true,document:{type:"object",properties:{errorType:{type:"string"},siteStructure:{type:"string"},siteArea:{type:"string"}}},assignments:[legacyAssignment]},{id:"schema:current",name:"Current generic event",version:7,published:true,document:{type:"object",properties:{error_type:{type:"string"},page_levels:{type:"array"},site_section:{type:"string"}}},assignments:[currentAssignment]}];localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify(schemas));localStorage.setItem("my-chrome-utilities.schema-rule-library.v1","[]");return true;})()`);
      await reloadPanel(socket);schemaAssignmentDataConditionsObservation=await evaluate(socket,schemaAssignmentDataConditionsRuntime);const observed=schemaAssignmentDataConditionsObservation;
      assert.match(observed.absent.summary,/unrestricted/);assert.equal(observed.absent.saveDisabled,false);assert.deepEqual(observed.empty,{assistance:"Add at least one condition",saveDisabled:true});
      assert.equal(observed.editor.target,"payload");assert.equal(observed.editor.operator,"Any");assert.deepEqual(observed.editor.paths,["/errorType","/siteStructure","/siteArea"]);assert.equal(observed.editor.saveDisabled,false);assert.equal(observed.editor.focus,"/siteStructure");assert.equal(observed.editor.scroll,41);
      assert.deepEqual(observed.persisted.paths,["/errorType","/siteStructure","/siteArea"]);assert.equal(observed.persisted.target,"payload");assert.equal(observed.persisted.operator,"Any");assert.equal(observed.persisted.priority,20);assert.match(observed.persisted.summary,/Payload · Any/);
      assert.equal(observed.duplicate.count,2);assert.equal(observed.duplicate.equivalent&&observed.duplicate.independent,true);
      assert.equal(observed.families.every(({expected,selected})=>expected===selected),true,JSON.stringify(observed.families));assert.deepEqual([observed.priority.legacy,observed.priority.current],["Legacy generic event","Current generic event"]);assert.match(observed.priority.tie,/Legacy assignment.*Current assignment/);assert.match(observed.priority.legacyDiagnostic,/priority 20 wins/);assert.match(observed.priority.tieDiagnostic,/equal highest priority/);
      assert.deepEqual(observed.cases,[false,false,false,true,true,true]);assert.equal(observed.paths.every(({matched})=>matched),true);assert.deepEqual(observed.paths[1].observed.map(({concretePath})=>concretePath),["/products/0/type","/products/1/type"]);assert.deepEqual(observed.paths[2].observed,[{concretePath:"/products/*/type",exists:false}]);assert.equal(observed.paths[3].observed[0].concretePath,"/a~1b");assert.equal(observed.paths[4].observed[0].concretePath,"/tilde~0name");
      assert.deepEqual(observed.target,{selected:"raw",validationTarget:"payload",conditionTarget:"raw input"});assert.deepEqual(observed.persistence.restored,["/errorType","/siteStructure","/siteArea"]);assert.equal(observed.persistence.archived,"Legacy generic event");assert.equal(observed.persistence.archivedEvidence,"legacy");assert.equal(observed.persistence.immutable&&observed.persistence.activeUnchanged,true);assert.equal(observed.layout.body<=observed.layout.width&&observed.layout.editor<=observed.layout.width&&observed.layout.conditions<=observed.layout.width,true,JSON.stringify(observed.layout));assert.deepEqual(observed.runtimeErrors,[]);
      await reloadPanel(socket);const reloaded=await evaluate(socket,`(()=>{document.querySelector("#data-layer-view-schemas").click();document.querySelector("#schema-subview-assignments").click();const stored=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"));const legacy=stored.find(({id})=>id==="schema:legacy");return{count:legacy.assignments.length,paths:legacy.assignments[0].dataConditionGroup.predicates.map(({propertyPath})=>propertyPath),summary:Array.from(document.querySelector("#schema-assignment-list").children).find((row)=>row.textContent.includes("Legacy assignment"))?.textContent};})()`);schemaAssignmentDataConditionsObservation.reloaded=reloaded;assert.equal(reloaded.count,2);assert.deepEqual(reloaded.paths,["/errorType","/siteStructure","/siteArea"]);assert.match(reloaded.summary,/Payload · Any/);
      socket.close();continue;
    }
    if (process.env.SCHEMA_PROPERTY_COPY_BROWSER_ADAPTER === "1") {
      await evaluate(socket,`(()=>{localStorage.clear();const message={id:"local:message",name:"Message required",version:2,propertyPath:"/error_message",operator:"required",severity:"error",message:"Message required",conditionGroup:{operator:"All",predicates:[{propertyPath:"/error_action",operator:"Exists",detectedType:"string"}]}};const action={id:"local:action",name:"Known action",version:1,propertyPath:"/error_action",operator:"allowed-values",parameters:"show,hide",allowedValues:["show","hide"],severity:"warning",conditionGroup:{operator:"All",predicates:[{propertyPath:"/error_type",operator:"Equals",comparison:{type:"string",value:"business"},detectedType:"string"}]}};const reusable={id:"reusable:error-type",name:"Error types",version:4,propertyPath:"/error_type",operator:"allowed-values",parameters:"business,technical",allowedValues:["business","technical"],severity:"error"};const source={id:"schema:pageview",name:"Generic pageview",version:7,published:true,document:{type:"object",required:["error_message"],properties:{error_message:{type:"string"},error_action:{type:"string"},error_type:{type:"string"},unrelated:{type:"boolean"}}},assignments:[],attachedRules:[message,action,reusable],documentation:{properties:{"/error_message":{displayName:"Error message",description:"Displayed error"},"/error_action":{displayName:"Error action",description:"Behavior"},"/error_type":{displayName:"Error type",description:"Category"}}}};const destination={id:"schema:in-page",name:"Generic in-page event",version:3,published:true,document:{type:"object",properties:{destination_only:{type:"boolean"}}},assignments:[{sourceId:"history",eventName:"in_page",target:"payload"}],documentation:{description:"Destination schema"}};localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([source,destination]));localStorage.setItem("my-chrome-utilities.schema-rule-library.v1",JSON.stringify([{id:reusable.id,name:reusable.name,kind:"Allowed values",version:4,attachments:[source.id]}]));return true;})()`);await reloadPanel(socket);
      schemaPropertyCopyObservation=await evaluate(socket,schemaPropertyCopyRuntime);const observed=schemaPropertyCopyObservation;
      assert.equal(observed.review.open&&observed.review.unchanged,true);assert.match(observed.review.source,/Generic pageview revision 7/);assert.match(observed.review.text,/\/error_message/);assert.match(observed.review.text,/\/error_action.*required by \/error_message/);assert.match(observed.review.text,/\/error_type.*required by \/error_action/);assert.match(observed.review.text,/local copy/);assert.match(observed.review.text,/reusable attachment/);assert.equal(observed.review.destinations.some((label)=>label.includes("Generic pageview")),false);
      assert.equal(observed.applied.publishedUnchanged&&observed.applied.sourceUnchanged,true);assert.deepEqual(observed.applied.paths,["error_message","error_action","error_type"]);assert.equal(observed.applied.rules.some(({copySourceRuleId})=>copySourceRuleId==="local:message"),true);assert.equal(observed.applied.rules.filter(({id})=>id==="reusable:error-type").length,1);assert.deepEqual(observed.applied.documentation.sort(),["/error_action","/error_message","/error_type"]);assert.equal(observed.applied.assignment,"in_page");assert.match(observed.applied.pending.at(-1),/revision 7.*\/error_message/);assert.equal(observed.applied.focus,"Copy /error_message to another schema");assert.deepEqual(observed.applied.scroll,{editor:51,tree:37});
      assert.equal(observed.undo.equivalent,true);assert.match(observed.undo.feedback,/pre-copy working draft was restored/);assert.deepEqual(observed.persisted,{pending:1,path:"string"});assert.equal(observed.layout.body<=observed.layout.width&&observed.review.width<=observed.layout.width&&observed.review.scrollWidth<=observed.layout.width,true);assert.deepEqual(observed.runtimeErrors,[]);
      await reloadPanel(socket);const restored=await evaluate(socket,`(()=>{document.querySelector("#data-layer-view-schemas").click();const stored=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")).find(({id})=>id==="schema:in-page");const item=Array.from(document.querySelector("#schema-list").children).find((row)=>row.textContent.includes("Generic in-page event"));Array.from(item.querySelectorAll("button")).find(({textContent})=>textContent==="Edit working draft").click();return{path:stored.workingDraft.document.properties.error_message.type,pending:stored.workingDraft.pendingChanges.length,status:document.querySelector("#schema-editor-status").textContent,publish:document.querySelector("#save-schema").textContent};})()`);assert.equal(restored.path,"string");assert.equal(restored.pending,1);assert.match(restored.status,/1 pending change/);assert.equal(restored.publish,"Publish revision");schemaPropertyCopyObservation.reloaded=restored;
      socket.close();continue;
    }
    if (process.env.DEFECT_REPORT_UNDECLARED_REMOVAL_BROWSER_ADAPTER === "1") {
      await evaluate(socket, `(async () => {
        localStorage.clear();
        const schema={id:"schema-generic-pageview",name:"Generic pageview",version:4,published:true,document:{type:"object",additionalProperties:false,properties:{page_type:{type:"string"}}},assignments:[{id:"assignment:pageview",name:"Generic pageviews",schemaId:"schema-generic-pageview",sourceId:"history",eventName:"pageview",target:"payload",versionPolicy:"follow latest",enabled:true}],attachedRules:[]};
        localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([schema]));localStorage.setItem("my-chrome-utilities.schema-rule-library.v1","[]");
        const payload={page_type:"product_detail",debug:true};const verification=await import("/data-layer-schema-verification.js");const result=verification.validateWithSchema({sourceId:"history",eventName:"pageview",payload,rawInput:["pageview",payload]},schema,[schema]);if(result.issues[0]?.message!=="Undeclared property")throw new Error("Production validation fixture failed");const observed={type:"observed",url:"https://shop.example/product",timestamp:"2026-07-15T10:00:00Z",observerPath:"dataLayer",id:"event:undeclared",name:"pageview",sessionId:"session:undeclared",sourceId:"history",sourceName:"Event history",sourceKind:"Data layer",pageUrl:"https://shop.example/product",payload,rawInput:["pageview",payload],rawValue:["pageview",payload],validation:"Not checked"};
        localStorage.setItem("dataLayerTestingSession",JSON.stringify({session:{id:"session:undeclared",status:"active",freshBoundary:true,tabId:1,historyPath:"dataLayer",startUrl:"https://shop.example/product",currentUrl:"https://shop.example/product",timeline:[observed]}}));return true;
      })()`);
      await reloadPanel(socket);defectReportUndeclaredRemovalObservation=await evaluate(socket,defectReportUndeclaredRemovalRuntime);
      assert.match(defectReportUndeclaredRemovalObservation.initial.validationText,/Undeclared property/);assert.equal(defectReportUndeclaredRemovalObservation.initial.selected,true);assert.equal(defectReportUndeclaredRemovalObservation.initial.inputCount,1);assert.doesNotMatch(defectReportUndeclaredRemovalObservation.initial.expected,/debug|null/);assert.match(defectReportUndeclaredRemovalObservation.initial.preview,/\/debug[\s\S]*was removed from the expected payload/);
      assert.match(defectReportUndeclaredRemovalObservation.deselected.expected,/debug/);assert.doesNotMatch(defectReportUndeclaredRemovalObservation.reselected.expected,/debug|null/);assert.equal(defectReportUndeclaredRemovalObservation.reselected.removals,1);
      assert.deepEqual(defectReportUndeclaredRemovalObservation.saved.expected,{page_type:"product_detail"});assert.deepEqual(defectReportUndeclaredRemovalObservation.saved.corrections.map(({pointer,operation})=>[pointer,operation]),[["/debug","remove"]]);assert.match(defectReportUndeclaredRemovalObservation.clipboard.rich.text,/\/debug[\s\S]*was removed/);assert.match(defectReportUndeclaredRemovalObservation.clipboard.plain,/\/debug[\s\S]*was removed/);assert.match(defectReportUndeclaredRemovalObservation.reopened,/page_type/);assert.match(defectReportUndeclaredRemovalObservation.recopied,/\/debug[\s\S]*was removed/);
      assert.deepEqual(defectReportUndeclaredRemovalObservation.refreshed,{issues:[],corrections:[]});assert.deepEqual(defectReportUndeclaredRemovalObservation.historicalExpected,{page_type:"product_detail"});assert.deepEqual(defectReportUndeclaredRemovalObservation.immutable,{payload:true,validation:true});assert.equal(defectReportUndeclaredRemovalObservation.layout.body<=defectReportUndeclaredRemovalObservation.layout.width,true);assert.equal(defectReportUndeclaredRemovalObservation.runtimeErrors.length,0);
      socket.close();continue;
    }
    if (process.env.CANONICAL_DECLARED_PROPERTY_VALIDATION_BROWSER_ADAPTER === "1") {
      await evaluate(socket, `(() => {
        localStorage.clear();
        const parent={id:"schema-generic-event",name:"Generic event",version:2,published:true,document:{type:"object",properties:{"/site_id":{type:"string"}}},assignments:[]};
        const document={type:"object",required:["/page_type"],properties:{"/page_type":{type:"string"},"/login_status":{type:"string"},"/page_levels":{type:"array"},"/page_levels/0":{type:"string"}}};
        const assignment={id:"assignment:pageview",name:"Generic pageviews",schemaId:"schema-generic-pageview",sourceId:"history",eventName:"pageview",target:"payload",versionPolicy:"follow latest",enabled:true};
        const rule={id:"rule:page-types",name:"Approved page types",version:2,propertyPath:"/page_type",operator:"allowed-values",parameters:"product,content",severity:"error"};
        const child={id:"schema-generic-pageview",name:"Generic pageview",version:3,published:true,parentSchemaId:parent.id,document,assignments:[assignment],attachedRules:[rule],workingDraft:{baseVersion:3,sourceVersion:3,parentSchemaId:parent.id,document,assignments:[assignment],attachedRules:[rule],pendingChanges:[]}};
        localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([parent,child]));localStorage.setItem("my-chrome-utilities.schema-rule-library.v1","[]");
        const observed=(id,payload,time)=>({type:"observed",url:"https://shop.example/products",timestamp:time,observerPath:"dataLayer",id,name:"pageview",sessionId:"session:canonical",sourceId:"history",sourceName:"Event history",sourceKind:"Data layer",pageUrl:"https://shop.example/products",payload,rawInput:["pageview",payload],rawValue:["pageview",payload],validation:"Not checked"});
        const timeline=[observed("event:declared",{page_type:"product",login_status:"logged in",page_levels:["product"]},"2026-07-14T21:00:00Z"),observed("event:extra",{site_id:"otelo",page_type:"product",login_status:"logged in",page_levels:["product"],debug:true},"2026-07-14T21:00:01Z")];
        localStorage.setItem("dataLayerTestingSession",JSON.stringify({session:{id:"session:canonical",status:"active",freshBoundary:true,tabId:1,historyPath:"dataLayer",startUrl:"https://shop.example/products",currentUrl:"https://shop.example/products",timeline}}));
        return true;
      })()`);
      await reloadPanel(socket);
      canonicalDeclaredPropertyValidationObservation=await evaluate(socket,canonicalDeclaredPropertyValidationRuntime);
      socket.close();continue;
    }
    if (process.env.SCHEMA_RULE_PROPERTY_IDENTITY_BROWSER_ADAPTER === "1") {
      await evaluate(socket, `(() => {
        localStorage.clear();
        const parentDocument={type:"object",properties:{"/customer/id":{type:"string"}}};
        const parent={id:"schema-customer",name:"Customer",version:2,published:true,document:parentDocument,assignments:[],documentation:{properties:{"/customer/id":{displayName:"Customer id",description:"Inherited customer identifier"}}}};
        const document={type:"object",properties:{"/page_type":{type:"string",propertyOrigin:"manual"},"/page_levels":{type:"array"},"/page_levels/0":{type:"string"},products:{type:"array",items:{type:"object",properties:{name:{type:"string"}}}}}};
        const current={id:"schema-page-view",name:"Page view",version:4,published:true,parentSchemaId:parent.id,document,assignments:[],attachedRules:[],documentation:{properties:{"/page_type":{displayName:"Page classification",description:"Business page type"}}},workingDraft:{baseVersion:4,sourceVersion:4,parentSchemaId:parent.id,document,assignments:[],attachedRules:[],documentation:{properties:{"/page_type":{displayName:"Page classification",description:"Business page type"}}},pendingChanges:[]}};
        const rules=[{id:"rule:approved-page-types",name:"Approved page types",kind:"Allowed values",operator:"allowed-values",parameters:"homepage,checkout",applicableType:"string",version:2,enabled:true},{id:"rule:compatible-strings",name:"Compatible strings",kind:"Allowed values",operator:"allowed-values",parameters:"known",applicableType:"string",version:1,enabled:true}];
        localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([parent,current]));
        localStorage.setItem("my-chrome-utilities.schema-rule-library.v1",JSON.stringify(rules));
        return true;
      })()`);
      await reloadPanel(socket);
      schemaRulePropertyIdentityObservation = await evaluate(socket, schemaRulePropertyIdentityRuntime);
      socket.close(); continue;
    }
    if (process.env.LOCAL_RULE_PROMOTION_AVAILABILITY_BROWSER_ADAPTER === "1") {
      await evaluate(socket, localRulePromotionAvailabilitySeedRuntime); await reloadPanel(socket);
      localRulePromotionAvailabilityObservation=await evaluate(socket,localRulePromotionAvailabilityRuntime);
      assert.deepEqual(localRulePromotionAvailabilityObservation.initial,{controlCount:1,noWorkingDraft:true,canonicalRows:1,identity:"local-41",path:"/page_type"});
      assert.match(localRulePromotionAvailabilityObservation.promoted.review,/Page view revision 3 source for a new working draft.*\/page_type.*local-41/);
      assert.deepEqual(localRulePromotionAvailabilityObservation.cancelled,{storageUnchanged:true,noWorkingDraft:true,reopenedCount:1});
      assert.equal(localRulePromotionAvailabilityObservation.failure.storageUnchanged&&localRulePromotionAvailabilityObservation.failure.controlRetained&&localRulePromotionAvailabilityObservation.failure.noDraft,true);
      assert.match(localRulePromotionAvailabilityObservation.failure.assistance,/simulated availability failure/);
      assert.deepEqual(localRulePromotionAvailabilityObservation.promoted.draftIds,["reusable-51","local-42"]);
      assert.deepEqual(localRulePromotionAvailabilityObservation.promoted.libraryIds,["reusable-51"]);
      assert.equal(localRulePromotionAvailabilityObservation.promoted.workingDraft&&localRulePromotionAvailabilityObservation.promoted.sameIdentity&&localRulePromotionAvailabilityObservation.promoted.publishedUnchanged,true);
      assert.deepEqual([localRulePromotionAvailabilityObservation.promoted.canonicalRows,localRulePromotionAvailabilityObservation.promoted.reusableControl],[1,false]);
      assert.deepEqual(localRulePromotionAvailabilityObservation.reopened,{version:4,local42Count:1,reusableCount:0,noWorkingDraftBeforeAction:true});
      assert.equal(localRulePromotionAvailabilityObservation.newSchema.promotedCount,1);
      assert.deepEqual(localRulePromotionAvailabilityObservation.newSchema.standaloneAttachments,[]);
      assert.equal(localRulePromotionAvailabilityObservation.newSchema.schemaStorageUnchanged&&localRulePromotionAvailabilityObservation.newSchema.provisionalAbsent,true);
      socket.close();continue;
    }
    if (process.env.LOCAL_RULE_PROMOTION_BROWSER_ADAPTER === "1") {
      await evaluate(socket, localRulePromotionSeedRuntime); await reloadPanel(socket);
      const localOrigin = await evaluate(socket, localRulePromotionOpenRuntime);
      await evaluate(socket, localRulePromotionReusableOriginRuntime); await reloadPanel(socket);
      const reusableCount = await evaluate(socket, localRulePromotionOriginCountRuntime);
      await evaluate(socket, localRulePromotionInheritedSeedRuntime); await reloadPanel(socket);
      const inheritedCount = await evaluate(socket, localRulePromotionInheritedCountRuntime);
      await evaluate(socket, localRulePromotionSeedRuntime); await reloadPanel(socket);
      const initial = {...await evaluate(socket, localRulePromotionOpenRuntime),localCount:localOrigin.localCount,reusableCount,inheritedCount};
      await socket.call("Input.dispatchKeyEvent", { type:"keyDown", key:" ", code:"Space", windowsVirtualKeyCode:32 });
      await socket.call("Input.dispatchKeyEvent", { type:"keyUp", key:" ", code:"Space", windowsVirtualKeyCode:32 });
      const review = await evaluate(socket, localRulePromotionReviewRuntime);
      const failures = [
        await evaluate(socket, localRulePromotionFailureRuntime("my-chrome-utilities.schema-rule-library.v1")),
        await evaluate(socket, localRulePromotionFailureRuntime("my-chrome-utilities.schema-library.v1")),
      ];
      await socket.call("Input.dispatchKeyEvent", { type:"keyDown", key:" ", code:"Space", windowsVirtualKeyCode:32 });
      await socket.call("Input.dispatchKeyEvent", { type:"keyUp", key:" ", code:"Space", windowsVirtualKeyCode:32 });
      const prepared = await evaluate(socket, localRulePromotionPrepareConfirmRuntime);
      await socket.call("Input.dispatchKeyEvent", { type:"keyDown", key:" ", code:"Space", windowsVirtualKeyCode:32 });
      await socket.call("Input.dispatchKeyEvent", { type:"keyUp", key:" ", code:"Space", windowsVirtualKeyCode:32 });
      const completed = await evaluate(socket, localRulePromotionAfterRuntime);
      await reloadPanel(socket);
      const reloaded = await evaluate(socket, `(() => { const schemas=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")); const rules=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1")); return {rules:rules.map(({id,version})=>[id,version]),attachments:schemas.find(({id})=>id==="schema:page-view").attachedRules.map(({id,version})=>[id,version])}; })()`);
      localRulePromotionObservation={initial,review,failures,prepared,...completed,reloaded};
      assert.deepEqual({localCount:initial.localCount,reusableCount:initial.reusableCount,inheritedCount:initial.inheritedCount,focused:initial.focused},{localCount:1,reusableCount:0,inheritedCount:0,focused:"local-41"});
      assert.match(review.observation.summary,/Page view revision 3 working draft.*\/page_type.*local-41/);
      assert.match(review.observation.configuration,/allowed-values.*string product.*warning.*Use a known page type.*enabled/);
      assert.deepEqual({name:review.observation.name,required:review.observation.required,focus:review.observation.focus,withinWidth:review.observation.withinWidth},{name:"",required:true,focus:"local-rule-promotion-heading",withinWidth:true});
      assert.deepEqual({focus:review.cancelled.focus,open:review.cancelled.open},{focus:"local-41",open:true});
      assert.equal(failures.every(({unchanged,local,rules,assistance})=>unchanged&&local&&rules===0&&assistance.includes("simulated persistence failure")),true);
      assert.deepEqual(prepared,{disabled:false,focus:true});
      assert.deepEqual(completed.beforePublish.ids,["local-40","reusable-51","local-42"]);
      assert.deepEqual(completed.beforePublish.paths,["/page_type","/page_type","/page_type"]);
      assert.equal(completed.beforePublish.rule.id,"reusable-51"); assert.equal(completed.beforePublish.rule.version,1); assert.deepEqual(completed.beforePublish.rule.allowedValues,["product","content"]); assert.equal(completed.beforePublish.rule.severity,"warning"); assert.equal(completed.beforePublish.rule.message,"Use a known page type");
      assert.deepEqual(completed.beforePublish.pending,["Document page ownership","Promote local rule local-41 to reusable rule reusable-51"]);
      assert.deepEqual({publishedId:completed.beforePublish.publishedId,focus:completed.beforePublish.focus,open:completed.beforePublish.open,noHorizontal:completed.beforePublish.noHorizontal},{publishedId:"local-41",focus:"reusable-51",open:true,noHorizontal:true});
      assert.deepEqual(completed.afterPublish,{version:4,currentId:"reusable-51",historicalId:"local-41",otherIds:[]});
      assert.deepEqual(reloaded,{rules:[["reusable-51",1]],attachments:[["local-40",1],["reusable-51",1],["local-42",1]]});
      socket.close(); continue;
    }
    if (process.env.ALLOWED_VALUE_EXPANSION_BROWSER_ADAPTER === "1") {
      await evaluate(socket, allowedValueExpansionSeedRuntime); await reloadPanel(socket);
      allowedValueExpansionObservation = await evaluate(socket, allowedValueExpansionRuntime);
      assert.deepEqual(allowedValueExpansionObservation.initial, {
        count:1, ruleId:"stable-id-41", ruleVersion:"1", status:"Validation failed, 1 error",
        schema:"Otelo - Generic Pageview version 2",
        raw:'{\n  "page_type": "product_test",\n  "site": "consumer"\n}', expanded:"true",
      });
      assert.match(allowedValueExpansionObservation.review.summary, /Otelo - Generic Pageview revision 2.*\/page_type.*Known page types revision 1.*string product.*string content.*string product_test/);
      assert.deepEqual({ publication:allowedValueExpansionObservation.review.publication,focus:allowedValueExpansionObservation.review.focus,destination:allowedValueExpansionObservation.review.destination,withinWidth:allowedValueExpansionObservation.review.withinWidth }, { publication:true,focus:"allowed-value-expansion-heading",destination:"assigned-schema-draft",withinWidth:true });
      assert.deepEqual(allowedValueExpansionObservation.cancelled, { focused:"stable-id-41",expanded:"true",scroll:37 });
      assert.deepEqual(allowedValueExpansionObservation.afterConfirm.values, ["product","content","product_test"]);
      assert.deepEqual(allowedValueExpansionObservation.afterConfirm.pending, ["Document checkout ownership","Allow string product_test for /page_type in Known page types (stable-id-41)"]);
      assert.deepEqual({ publishedParameters:allowedValueExpansionObservation.afterConfirm.publishedParameters,publishedValues:allowedValueExpansionObservation.afterConfirm.publishedValues,condition:allowedValueExpansionObservation.afterConfirm.condition,severity:allowedValueExpansionObservation.afterConfirm.severity,message:allowedValueExpansionObservation.afterConfirm.message }, { publishedParameters:"product,content",publishedValues:null,condition:"consumer",severity:"error",message:"Choose a known page type" });
      assert.deepEqual({ focused:allowedValueExpansionObservation.afterConfirm.focused,expanded:allowedValueExpansionObservation.afterConfirm.expanded,scroll:allowedValueExpansionObservation.afterConfirm.scroll }, { focused:"stable-id-41",expanded:"true",scroll:37 });
      assert.match(allowedValueExpansionObservation.alreadyPending, /already pending/i); assert.equal(allowedValueExpansionObservation.duplicateUnchanged,true);
      assert.deepEqual(allowedValueExpansionObservation.openedDraft, { schemaView:"true",editor:true,focused:"schema-editor-name",values:["product","content","product_test"] });
      assert.deepEqual(allowedValueExpansionObservation.returned, { event:"page_view",expanded:"true",scroll:37 });
      assert.deepEqual(allowedValueExpansionObservation.afterPublish, {
        version:3, values:["product","content","product_test"], actionCount:0,
        status:"Validation passed", feed:"page_view · 13:00:00 · history · Valid · 0 new issues", schema:"Otelo - Generic Pageview version 3",
        raw:'{\n  "page_type": "product_test",\n  "site": "consumer"\n}', defectStates:[],
      });
      socket.close(); continue;
    }
    if (process.env.SCHEMA_PUBLICATION_REFRESH_BROWSER_ADAPTER === "1") {
      await evaluate(socket, schemaPublicationRefreshSeedRuntime); await reloadPanel(socket);
      schemaPublicationRefreshObservation = await evaluate(socket, schemaPublicationRefreshRuntime);
      if (schemaPublicationRefreshObservation.debug) assert.fail(JSON.stringify(schemaPublicationRefreshObservation.debug));
      assert.deepEqual(schemaPublicationRefreshObservation.before, { summary:"Validation passed", schema:"Product listing version 3", optionalHidden:true });
      assert.equal(schemaPublicationRefreshObservation.queryBefore, "1 of 2 events");
      assert.equal(schemaPublicationRefreshObservation.control.order, true);
      assert.deepEqual({ label:schemaPublicationRefreshObservation.control.revealed.label, pressed:schemaPublicationRefreshObservation.control.revealed.pressed, value:schemaPublicationRefreshObservation.control.revealed.value, treatment:schemaPublicationRefreshObservation.control.revealed.treatment }, { label:"Hide non-applicable properties",pressed:"true",value:"Missing",treatment:"neutral" });
      assert.match(schemaPublicationRefreshObservation.control.revealed.status, /not applicable/i);
      assert.notEqual(schemaPublicationRefreshObservation.control.revealed.missingColor, schemaPublicationRefreshObservation.control.revealed.dangerColor);
      assert.equal(schemaPublicationRefreshObservation.publication.savedUnchanged, true);
      assert.match(schemaPublicationRefreshObservation.publication.result, /Published Product listing revision 4\. Revalidated 2 current Live events\./);
      assert.equal(schemaPublicationRefreshObservation.after.politeAnnouncements, 1);
      assert.deepEqual({ query:schemaPublicationRefreshObservation.after.query,count:schemaPublicationRefreshObservation.after.count,selected:schemaPublicationRefreshObservation.after.selected,summary:schemaPublicationRefreshObservation.after.summary,schema:schemaPublicationRefreshObservation.after.schema,show:schemaPublicationRefreshObservation.after.show,optionalExpanded:schemaPublicationRefreshObservation.after.optionalExpanded,pageType:schemaPublicationRefreshObservation.after.pageType,focused:schemaPublicationRefreshObservation.after.focused }, { query:"1 of 2 events",count:"2",selected:"page_view",summary:"Validation failed, 1 error",schema:"Product listing version 4",show:"true",optionalExpanded:"true",pageType:"! 1 error",focused:"/test" });
      assert.equal(schemaPublicationRefreshObservation.after.feed.length, 1);
      assert.equal(schemaPublicationRefreshObservation.defectStates.includes("Review required"), true);
      assert.deepEqual(schemaPublicationRefreshObservation.boundary, { refreshed:["pre:1","pre:2"],ids:["pre:1","pre:2","post:1"],revisions:[4,4,4] });
      await evaluate(socket, `(() => { const toggle=document.querySelector("#live-non-applicable-properties"); toggle.focus(); return toggle.getAttribute("aria-pressed"); })()`);
      await socket.call("Input.dispatchKeyEvent", { type:"keyDown", key:" ", code:"Space", windowsVirtualKeyCode:32 });
      await socket.call("Input.dispatchKeyEvent", { type:"keyUp", key:" ", code:"Space", windowsVirtualKeyCode:32 });
      assert.equal(await evaluate(socket, `document.querySelector("#live-non-applicable-properties").getAttribute("aria-pressed")`), "true");
      socket.close(); continue;
    }
    if (process.env.DEFECT_LIBRARY_BROWSER_ADAPTER === "1") {
      await evaluate(socket, defectLibrarySeedRuntime); await reloadPanel(socket);
      defectLibraryObservation = await evaluate(socket, defectLibraryRuntime);
      assert.deepEqual(defectLibraryObservation.nav, ["Live","Library","Sessions","Defects","Schemas"]);
      assert.equal(defectLibraryObservation.actualReportedLinks, 1);
      assert.deepEqual(defectLibraryObservation.openedFromIssue, { view:"true",detail:false });
      assert.deepEqual(defectLibraryObservation.returnedToIssue, { view:"true",event:"purchase",focused:true,scrollPreserved:true });
      assert.equal(defectLibraryObservation.restoredCount, 2); assert.equal(defectLibraryObservation.filteredCount, 1);
      assert.deepEqual(defectLibraryObservation.edited.safeLink, { href:"https://jira.example/browse/DL-42", target:"_blank", rel:"noopener noreferrer" });
      assert.match(defectLibraryObservation.recopy, /Edited details/);
      assert.match(defectLibraryObservation.lifecycle.resolved, /Resolved/); assert.match(defectLibraryObservation.lifecycle.reopened, /Reported/); assert.match(defectLibraryObservation.lifecycle.archived, /Archived/);
      assert.match(defectLibraryObservation.confirmation, /Captured evidence and saved sessions remain unchanged/); assert.equal(defectLibraryObservation.afterDelete, 1);
      assert.deepEqual(defectLibraryObservation.stored, { count:1,status:"Archived",description:"Edited details",notes:"Jira https://jira.example/browse/DL-42" });
      assert.deepEqual(defectLibraryObservation.renderCases.map(({triage,reported,fresh}) => [triage,reported,fresh]), [["2 new issues",0,2],["1 new and 1 reported",1,1],["all 2 issues reported",2,0]]);
      assert.equal(defectLibraryObservation.renderCases.every(({feed,validation}) => feed.includes("2 issues") && validation.startsWith("Validation failed")), true);
      assert.deepEqual(defectLibraryObservation.differences, ["Reported","Reported","New","New","New","New","New","New","Review required"]);
      assert.deepEqual(defectLibraryObservation.wildcardMatch, ["active:sku"]);
      assert.deepEqual(defectLibraryObservation.actionResults, [["Copy for Jira Cloud",0,true],["Save as reported defect",1,false],["Save as reported defect and copy",1,true]]);
      assert.deepEqual(defectLibraryObservation.actionWrites, ["jira","jira"]);
      assert.deepEqual(defectLibraryObservation.linked, { sessions:1,id:"saved:session:one",contains:true,immutable:true });
      assert.deepEqual(defectLibraryObservation.statuses, { resolved:"Possible regression treated New",archived:"New" });
      socket.close(); continue;
    }
    if (process.env.VALIDATION_PRESENCE_BROWSER_ADAPTER === "1") {
      validationPresenceSemanticsObservation = await evaluate(socket, validationPresenceSemanticsRuntime);
      assert.equal(validationPresenceSemanticsObservation.operators.every(({ status, issues, state }) => status === "not-applicable" && issues === 0 && state === "Valid"), true);
      assert.deepEqual(validationPresenceSemanticsObservation.requiredCases, [
        { observed:"missing", statuses:["error","not-applicable"], issues:["Required"] },
        { observed:"test", statuses:["pass","pass"], issues:[] },
        { observed:"another value", statuses:["pass","error"], issues:["Allowed values"] },
      ]);
      assert.deepEqual(validationPresenceSemanticsObservation.nullValue, { status:"error", actual:"null", issueActual:"null" });
      assert.deepEqual(validationPresenceSemanticsObservation.undefinedValue, { statuses:["error","pass"], actuals:["undefined","undefined"], typeIssueActual:"undefined" });
      assert.deepEqual(validationPresenceSemanticsObservation.conditionalCases.map(({ status, issues }) => [status,issues]), [["not-applicable",0],["not-applicable",0],["error",1],["error",1]]);
      assert.deepEqual(validationPresenceSemanticsObservation.equivalent, { legacy:"not-applicable", inherited:"not-applicable", issues:0 });
      assert.deepEqual(validationPresenceSemanticsObservation.liveSummary, { status:"9 rules not applicable", symbolName:"neutral", treatment:"neutral", errors:0, warnings:0, passed:0 });
      assert.deepEqual(validationPresenceSemanticsObservation.liveInspector, { hiddenByDefault:true,revealed:true,issueRows:0,invalidMissing:false });
      socket.close(); continue;
    }
    if (process.env.MISSING_EVENT_DEFECT_REPORT_BROWSER_ADAPTER === "1" || process.env.UNIFIED_DEFECT_BUILDER_BROWSER_ADAPTER === "1" || process.env.MISSING_EVENT_REPORT_FIDELITY_BROWSER_ADAPTER === "1") {
      await evaluate(socket, `(() => {
        const assignment = { id:"assignment:checkout-purchase", name:"Checkout purchase", sourceId:"event-history", eventName:"purchase", target:"payload", domainCondition:"shop.example", pathnameCondition:"/checkout", enabled:true };
        const schema = { id:"schema-checkout-purchase", name:"Checkout purchase", version:4, published:true, document:{ type:"object", properties:{ transaction_id:{ type:"string" } } }, assignments:[assignment] };
        localStorage.clear(); localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([schema])); localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", "[]"); return true;
      })()`);
      await reloadPanel(socket);
      missingEventDefectReportObservation = await evaluate(socket, missingEventDefectReportRuntime);
      assert.deepEqual(missingEventDefectReportObservation.entries, { sideEntry:"Report missing event", schemaRowEntries:1 });
      assert.deepEqual(missingEventDefectReportObservation.zero.verification, { count:0, warning:true, noCreate:true });
      assert.deepEqual({ type:missingEventDefectReportObservation.zero.report.type, capturedEventId:missingEventDefectReportObservation.zero.report.capturedEventId, payload:missingEventDefectReportObservation.zero.report.payload, capture:missingEventDefectReportObservation.zero.report.capture, issues:missingEventDefectReportObservation.zero.report.issues }, { type:"Missing event", capturedEventId:null, payload:null, capture:null, issues:0 });
      assert.deepEqual(missingEventDefectReportObservation.warning.before.count, 1);
      assert.deepEqual(missingEventDefectReportObservation.warning.override.evidence, ["purchase-1"]);
      assert.deepEqual(missingEventDefectReportObservation.scope, { zero:{ count:0, warning:true, override:null }, match:{ count:1, visible:true, override:null } });
      assert.deepEqual(missingEventDefectReportObservation.saved, { immutable:true, count:0, sourceCount:2, snapshotCount:1 });
      assert.equal(missingEventDefectReportObservation.zero.replacement.intervalControls, false);
      assert.equal(missingEventDefectReportObservation.unified.initial.noInterval, true);
      assert.equal(missingEventDefectReportObservation.unified.initial.noCreate, true);
      assert.deepEqual(missingEventDefectReportObservation.unified.nested.payload, { page_name:"test", products:[{ id:1, name:"robot" }] });
      assert.deepEqual(missingEventDefectReportObservation.unified.nested.actions, [false,false,false]);
      assert.equal(missingEventDefectReportObservation.unified.nested.duplicatedItems, 2);
      const flat=missingEventDefectReportObservation.unified.flat;
      assert.deepEqual(flat.payload, { page_levels:["d"], page_type:"product_detail", page_section:"product", login_status:"logged in", b_id:"123" });
      assert.equal(flat.pointers.includes("/page_levels/0") && flat.pointers.includes("/page_type") && flat.escapedAbsent, true);
      assert.equal(flat.schemaUnchanged, true); assert.deepEqual(flat.runtimeErrors, []);
      assert.deepEqual(flat.initialItem, { input:"", focused:true });
      assert.equal(flat.typed.every(({value,same,focused,caret})=>same&&focused&&caret===value.length), true);
      assert.equal(flat.typed.at(-1).value, "logged in");
      assert.deepEqual(flat.invalid.actions, [true,true,true]); assert.match(flat.invalid.issue, /allowed/i);
      assert.equal(flat.validation, "Valid"); assert.deepEqual(flat.actions, [false,false,false]);
      assert.deepEqual(flat.provenance["/page_levels/0"], { id:"page-levels", name:"Page level values", version:2, propertyPath:"/page_levels/*" });
      assert.deepEqual(flat.untyped, { disabled:true, assistance:true }); assert.equal(flat.fits, true);
      assert.deepEqual([flat.narrativeCount,flat.preCount,flat.compactAbsent,flat.copiedSame], [1,1,true,true]);
      assert.deepEqual(flat.savedPayload, flat.payload);
      assert.deepEqual(missingEventDefectReportObservation.unified.failures, { copyFailure:"Copy failed", saveFailure:"Save failed", rejectedSaveCalls:1, unchanged:true, reportPayload:{ order_id:"A-123", currency:"EUR" } });
      if (process.env.MISSING_EVENT_REPORT_FIDELITY_BROWSER_ADAPTER === "1") {
        const fidelity=missingEventDefectReportObservation.fidelity;
        assert.deepEqual(fidelity.incomplete, { additional:{ value:"", tag:"TEXTAREA" }, preCount:1, preLines:3, paragraphHasJson:false });
        assert.deepEqual(fidelity.beforeConfirmation.payload, { page_type:"product_detail", products:[{ id:1, name:"robot" }] });
        assert.deepEqual(fidelity.beforeConfirmation.structure, ["P","PRE"]);
        assert.deepEqual(fidelity.beforeConfirmation.steps, ["Visit /products","Click Robot","Visit /checkout","Expect pageview to be pushed"]);
        assert.deepEqual(fidelity.complete.structure, ["P","P","PRE"]);
        assert.deepEqual([fidelity.complete.narrativeCount,fidelity.complete.preCount,fidelity.complete.additionalBeforeNarrative,fidelity.complete.literalText,fidelity.complete.markupAbsent], [1,1,true,true,true]);
        assert.deepEqual(fidelity.complete.sources, { "/page_type":"schema-provided value", "/products/0/id":"operator custom response", "/products/0/name":"operator custom response" });
        assert.deepEqual(fidelity.complete.provenance["/page_type"], { id:"page-type", name:"Page type requirement", version:1, propertyPath:"/page_type" });
        assert.deepEqual([fidelity.edited.preCount,fidelity.edited.narrativeCount,fidelity.edited.staleAbsent], [1,1,true]);
        assert.equal(fidelity.edited.payload.products[0].name, 'robot <&> "quoted"\nline two');
        assert.deepEqual(fidelity.persistence.reopenedSteps, ["Visit /products","Click Robot card","Visit /checkout","Expect pageview to be pushed"]);
        assert.deepEqual([fidelity.persistence.copiedSame,fidelity.persistence.reopenedSame,fidelity.persistence.recopiedSame,fidelity.persistence.reopenedPre,fidelity.persistence.provenanceHidden,fidelity.persistence.plainBreaks], [true,true,true,1,true,true]);
        assert.deepEqual(fidelity.persistence.savedSources, fidelity.complete.sources);
      }
      socket.close(); continue;
    }
    if (process.env.RECURSIVE_PROPERTY_VALIDATION_BROWSER_ADAPTER === "1") {
      recursivePropertyValidationObservation = await evaluate(socket, recursivePropertyValidationRuntime);
      assert.equal(recursivePropertyValidationObservation.entry.stage, "destination");
      assert.equal(recursivePropertyValidationObservation.entry.path, "/oOrder/aProducts/*/sku");
      assert.equal(recursivePropertyValidationObservation.layout.actionsSeparate, true);
      assert.equal(recursivePropertyValidationObservation.target.inspections.valid.matchedValueCount, 6);
      assert.equal(new Set(recursivePropertyValidationObservation.hierarchy.paths).size, recursivePropertyValidationObservation.hierarchy.paths.length);
      assert.equal(recursivePropertyValidationObservation.hierarchy.paths.includes("/oOrder/a/b"), false);
      assert.deepEqual(recursivePropertyValidationObservation.search.open, ["/oOrder", "/oOrder/aProducts", "/oOrder/aProducts/*", "/oOrder/aProducts/*/pricing"]);
      socket.close(); continue;
    }
    if (process.env.SCHEMA_PROPERTY_REMOVAL_BROWSER_ADAPTER === "1") {
      await evaluate(socket, `(() => {
        const base = { id:"base", name:"Base", version:2, published:true, document:{ type:"object", properties:{ inherited_id:{ type:"string" } } }, assignments:[] };
        const document = { type:"object", required:["page_type", "commerce", "debug", "items"], properties:{ page_type:{ type:"string" }, commerce:{ type:"object", required:["order"], properties:{ order:{ type:"object", propertyOrigin:"manual", required:["id", "value"], properties:{ id:{ type:"string", propertyOrigin:"manual" }, value:{ type:"number", propertyOrigin:"manual" } } } } }, debug:{ type:"boolean", propertyOrigin:"manual" }, items:{ type:"string", propertyOrigin:"manual" } } };
        const attachedRules = [{ id:"rule:order-id", name:"Order identifier", version:2, propertyPath:"/commerce/order/id" }, { id:"rule:order-value", name:"Order value", version:1, propertyPath:"/commerce/order/value" }, { id:"rule:commerce", name:"Commerce shape", version:1, propertyPath:"/commerce" }];
        const page = { id:"page-view", name:"Page view", version:3, published:true, parentSchemaId:"base", document, assignments:[], attachedRules, workingDraft:{ baseVersion:3, sourceVersion:3, parentSchemaId:"base", document, assignments:[], attachedRules, pendingChanges:[] } };
        localStorage.clear(); localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([base, page])); localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", JSON.stringify([{ id:"rule:order-id", name:"Order identifier", version:2, enabled:true }])); return true;
      })()`);
      await reloadPanel(socket);
      schemaPropertyRemovalObservation = await evaluate(socket, schemaPropertyRemovalRuntime);
      await reloadPanel(socket);
      schemaPropertyRemovalReloadObservation = await evaluate(socket, schemaPropertyRemovalReloadRuntime);
      assert.equal(schemaPropertyRemovalObservation.immediate.absent, true);
      assert.equal(schemaPropertyRemovalReloadObservation.restored.draftAbsent, true);
      assert.equal(schemaPropertyRemovalReloadObservation.confirmed.reusable, true);
      assert.equal(schemaPropertyRemovalReloadObservation.empty.publishBlocked, true);
      socket.close(); continue;
    }
    if (process.env.FRESH_LIVE_SESSION_BROWSER_ADAPTER === "1") {
      freshLiveSessionObservation = await evaluate(socket, freshLiveSessionRuntime);
      assert.equal(freshLiveSessionObservation.initial.events, 12);
      assert.equal(freshLiveSessionObservation.confirmation.open, true);
      assert.equal(freshLiveSessionObservation.cancelled.id, freshLiveSessionObservation.initial.id);
      assert.equal(freshLiveSessionObservation.afterSave.snapshot.events, 12);
      assert.deepEqual(freshLiveSessionObservation.purchase.names, ["purchase"]);
      assert.equal(freshLiveSessionObservation.archive.unchanged, true);
      await reloadPanel(socket);
      freshLiveSessionReloadObservation = await evaluate(socket, freshLiveSessionReloadRuntime);
      assert.deepEqual(freshLiveSessionReloadObservation.names, ["purchase"]);
      socket.close(); continue;
    }
    if (runWorkspacePanelContainmentRuntime) {
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
    }
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
          const document = { type:"object", properties:{ page_type:{ type:"string" }, product:{ type:"object", properties:{ sku:{ type:"string" } } }, revenue:{ type:"number" }, items:{ type:"array", items:{ type:"object" } } } };
          const current = { id:"schema-page-view", name:"Page view", version:3, published:true, document, assignments:[], workingDraft:{ baseVersion:3, sourceVersion:3, document, assignments:[], attachedRules:[], pendingChanges:[] } };
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
    if (width === 720 && process.env.SCHEMA_DOCUMENTATION_BROWSER_ADAPTER === "1") {
      await evaluate(socket, `(() => {
        const unsafe = "<img src=x onerror=globalThis.documentationExecuted=true><script>globalThis.documentationExecuted=true</script>";
        const document = {
          type:"object",
          required:["page_type", "oOrder"],
          properties:{
            page_type:{ type:"string" },
            currency:{ type:"string" },
            items:{ type:"array", items:{ type:"object", properties:{ product_id:{ type:"string" } } } },
            oOrder:{
              type:"object",
              required:["order_id", "aProducts"],
              properties:{
                order_id:{ type:"string" },
                aProducts:{ type:"array", items:{ type:"object", required:["product_id"], properties:{ product_id:{ type:"string" } } } },
              },
            },
          },
        };
        const assignment = { id:"assignment:product-detail", schemaId:"schema-product-detail", schemaVersion:3, sourceId:"event-history", eventName:"product_detail", target:"payload", versionPolicy:"pinned", enabled:true };
        const rule = { id:"rule:product-id", name:"Product identifier required", version:1, propertyPath:"/oOrder/aProducts/*/product_id", operator:"required", severity:"error" };
        const documentation = { description:"Revision 3 original", properties:{ "/page_type":{ displayName:"Page classification", description:unsafe }, "/items/*/product_id":{ displayName:"Product identifier", description:"Stable product identifier" }, "/oOrder/order_id":{ displayName:"Order identifier", description:"Stable order identifier" } } };
        const historical = { id:"schema-product-detail", name:"Product detail", version:2, published:true, document, assignments:[assignment], attachedRules:[rule], documentation:{ description:"Historical schema", properties:{ "/page_type":{ displayName:"Page classification", description:"Historical description" } } } };
        const product = { id:"schema-product-detail", name:"Product detail", version:3, published:true, document, assignments:[assignment], attachedRules:[rule], documentation, revisionHistory:[historical], workingDraft:{ baseVersion:3, sourceVersion:3, document, assignments:[assignment], attachedRules:[rule], documentation, pendingChanges:[] } };
        const parent = { id:"schema-generic-commerce", name:"Generic commerce", version:2, published:true, document:{ type:"object", properties:{ currency:{ type:"string" } } }, assignments:[], documentation:{ properties:{ "/currency":{ displayName:"Currency", description:"Inherited currency" } } } };
        localStorage.clear();
        localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([product, parent]));
        localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", "[]");
        return true;
      })()`);
      await reloadPanel(socket);
      schemaDocumentationObservation = await evaluate(socket, schemaDocumentationRuntime);
      assert.deepEqual(schemaDocumentationObservation.editor.paths, ["/page_type", "/items/*/product_id", "/oOrder/order_id", "/oOrder/aProducts/*/product_id"], "Schema documentation editor did not persist one canonical entry");
      assert.equal(schemaDocumentationObservation.editor.schemaDescription, "Product detail commerce event");
      assert.equal(schemaDocumentationObservation.editor.currentDescription, "Revision 3 original");
      assert.equal(schemaDocumentationObservation.editor.ruleCount, 1);
      assert.deepEqual({ mapped:schemaDocumentationObservation.presentation.mapped, wildcard:schemaDocumentationObservation.presentation.wildcard, synthetic:schemaDocumentationObservation.presentation.synthetic, unmatchedControl:schemaDocumentationObservation.presentation.unmatchedControl, plainText:schemaDocumentationObservation.presentation.plainText, focusReturned:schemaDocumentationObservation.presentation.focusReturned, searchVisible:schemaDocumentationObservation.presentation.searchVisible }, { mapped:true, wildcard:true, synthetic:true, unmatchedControl:0, plainText:true, focusReturned:true, searchVisible:true }, "Live documentation presentation lost mapped, wildcard, synthetic, safe, or searchable information");
      assert.deepEqual(schemaDocumentationObservation.inheritance, { inherited:["Inherited currency", "Generic commerce", true], local:["Local currency meaning", "Product detail", false], restored:["Inherited currency", "Generic commerce"], parentUnchanged:"Inherited currency" }, "Documentation inheritance and local override resolution diverged");
      assert.deepEqual(schemaDocumentationObservation.removal, { reviewShowsDocumentation:true, removed:{ property:true, rules:0, documentation:false }, restored:{ property:true, rules:1, documentation:"Stable identifier used by fulfilment" } }, "Property removal and undo did not update documentation atomically");
      assert.equal(schemaDocumentationObservation.lifecycle.legacyDocumentation, null);
      socket.close(); continue;
    }
    if (width === 720 && process.env.CONDITIONAL_VALIDATION_RULES_BROWSER_ADAPTER === "1") {
      await evaluate(socket, `(() => {
        const document = { type:"object", properties:{ page_type:{ type:"string" }, currency:{ type:"string" }, oOrder:{ type:"object", properties:{ aProducts:{ type:"array", items:{ type:"object" } } } } } };
        const schema = { id:"schema-product-event", name:"Product event", version:1, published:true, document, assignments:[{ id:"assignment:product-event", name:"Product detail events", sourceId:"event-history", eventName:"product_detail", target:"payload", enabled:true }] };
        localStorage.clear();
        localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([schema]));
        localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", "[]");
        return true;
      })()`);
      await reloadPanel(socket);
      conditionalValidationRulesObservation = await evaluate(socket, conditionalValidationRulesRuntime);
      assert.deepEqual(conditionalValidationRulesObservation.evaluations, [
        { page_type:"product_detail", products:"missing", result:"Not applicable", issues:0 },
        { page_type:"product_detail", products:"empty array", result:"Failed", issues:1 },
        { page_type:"product_detail", products:"1 item", result:"Passed", issues:0 },
        { page_type:"category", products:"empty array", result:"Not applicable", issues:0 },
        { page_type:"category", products:"missing", result:"Not applicable", issues:0 },
      ], "Conditional rule production evaluation did not match its built browser examples");
      assert.deepEqual(conditionalValidationRulesObservation.groups.map(({ result, invocationCount }) => ({ result, invocationCount })), [
        { result:"Passed", invocationCount:1 },
        { result:"Not applicable", invocationCount:0 },
        { result:"Passed", invocationCount:1 },
        { result:"Not applicable", invocationCount:0 },
      ], "Conditional All/Any gating invoked the consequence incorrectly");
      assert.deepEqual(conditionalValidationRulesObservation.editor, {
        applyOnlyWhen:"Apply only when",
        property:"/page_type",
        operators:["Exists", "Does not exist", "Equals", "Does not equal", "Is one of", "Matches pattern"],
        operator:"Equals",
        initializedValue:"product_detail",
        schemaProperties:["/page_type", "/currency", "/oOrder", "/oOrder/aProducts/*"],
        preview:"Current event preview: Failed",
        oneConsequence:1,
      }, "Conditional rule editor lost type-aware trigger configuration");
      assert.deepEqual(conditionalValidationRulesObservation.presentation, {
        issueCount:1, expectedPath:"/oOrder/aProducts", conditionShown:true, consequenceShown:true,
        triggerNotFailing:true, notApplicableHiddenByDefault:true, notApplicableShown:true, notApplicableIssues:0,
      }, "Conditional Live inspector presentation lost failure or not-applicable evidence");
      assert.deepEqual(conditionalValidationRulesObservation.lifecycle, {
        attachmentIds:[conditionalValidationRulesObservation.stored.rule.id, "rule:reusable-products"],
        ruleIds:["rule:reusable-products"], atomic:true,
        typedValue:{ type:"string", value:"product_detail" }, pinnedVersion:1, revisedVersion:2, revisedPreserved:true,
      }, "Conditional rule persistence did not preserve atomic definitions and pinned versions");
      socket.close(); continue;
    }
    if (width === 720 && process.env.GUIDED_ASSIGNMENT_COVERAGE_BROWSER_ADAPTER === "1") {
      guidedAssignmentCoverageObservation = await evaluate(socket, guidedAssignmentCoverageRuntime);
      assert.deepEqual(guidedAssignmentCoverageObservation, {
        event:{ name:"order_complete", sourceId:"event-history", pageUrl:"https://shop.example/orders/confirmed" },
        schemaName:"Order completed",
        first:{
          firstConfigurationDisplayed:true,
          laterVisibility:[
            { configuration:false, selection:false, stages:["Define requirement", "Review validation"] },
            { configuration:false, selection:false, stages:["Define requirement", "Review validation"] },
          ],
          assignmentCount:1,
          assignment:{ id:"assignment:schema:order-completed:1:confirmed-orders", name:"confirmed orders", schemaId:"schema:order-completed:1", sourceId:"event-history", eventName:"order_complete", target:"payload", domainCondition:"shop.example", pathnameCondition:"/orders/confirmed", priority:100, versionPolicy:"pinned", enabled:true },
          assignmentUnchanged:true,
          rulePaths:["order_id", "currency", "value"],
        },
        published:{ configuration:false, selection:false, action:"reuse the covering assignment", assignmentCount:1, assignment:{ id:"assignment:shop-orders", name:"shop order pages", sourceId:"event-history", eventName:"order_complete", target:"payload", domainCondition:"*.example", pathnameCondition:"/orders/*", priority:240, versionPolicy:"follow latest", enabled:true }, identityUnchanged:true, rulePaths:["order_id"] },
        incompatible:{
          before:{ configuration:true, selection:false, assignmentCount:1, defaults:{ source:"event-history", event:"order_complete", target:"payload", domain:"shop.example", pathname:"/orders/confirmed" } },
          afterConfirm:{ count:2, names:["product pages", "confirmed orders"] },
          laterVisibility:{ configuration:false, selection:false },
          finalCount:2,
          laterAction:"reuse the covering pending assignment",
          assignments:[
            { id:"assignment:products", name:"product pages", sourceId:"event-history", eventName:"order_complete", target:"payload", domainCondition:"shop.example", pathnameCondition:"/products/*", priority:90, versionPolicy:"pinned", enabled:true },
            { id:"assignment:schema-order-incompatible:confirmed-orders", name:"confirmed orders", schemaId:"schema-order-incompatible", sourceId:"event-history", eventName:"order_complete", target:"payload", domainCondition:"shop.example", pathnameCondition:"/orders/confirmed", priority:100, versionPolicy:"pinned", enabled:true },
          ],
          rulePaths:["order_id", "currency"],
        },
        multiple:{ configuration:false, selection:false, stages:["Choose schema destination", "Define requirement", "Review validation"], action:"reuse existing schema coverage", beforeCount:2, afterCount:2, identities:["assignment:shop-orders", "assignment:secondary-orders"], rulePaths:["currency"] },
      }, "Guided assignment coverage did not preserve or reuse production assignments");
      socket.close();
      continue;
    }
    if (width === 720) {
      const previousGuidedStorage = await evaluate(socket, `(() => {
        const previous = Object.fromEntries(Array.from({ length:localStorage.length }, (_, index) => localStorage.key(index)).filter(Boolean).map((key) => [key, localStorage.getItem(key)]));
        const schemas = [
          { id:"schema:existing-pageview:1", name:"Existing pageview", version:1, document:{ type:"object" }, assignments:[{ sourceId:"event-history", eventName:"other", target:"payload", enabled:true }] },
          { id:"schema:product-listing:3", name:"Product listing", version:3, document:{ type:"object", properties:{ page_type:{ type:"string" } } }, assignments:[{ id:"assignment:product-listing", sourceId:"event-history", eventName:"pageview", target:"payload", domainCondition:"other.example", enabled:true }] },
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
          { id:"schema:generic-pageview:4", name:"Generic pageview", version:4, document:{ type:"object", properties:{ page_type:{ type:"string" } } }, assignments:[{ id:"assignment:generic-local", name:"Generic local pages", sourceId:"event-history", eventName:"pageview", target:"payload", domainCondition:"127.0.0.1", pathnameCondition:"/", enabled:true }] },
          { id:"schema:product-listing:3", name:"Product listing", version:3, document:{ type:"object", properties:{ page_type:{ type:"string" } } }, assignments:[{ id:"assignment:product-listing", sourceId:"event-history", eventName:"pageview", target:"payload", domainCondition:"other.example", enabled:true }] },
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
          heading:"Choose schema destination",
          focused:true,
          stages:[["Choose schema destination","current"],["Define requirement","upcoming"],["Choose event scope","upcoming"],["Review validation","upcoming"]],
          advancedPrimary:true,
          persistedUnchanged:true,
        },
        invalid:{ focused:false, link:"Property selection skipped" },
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
        reviewBeforeBack:"pageview on 127.0.0.1 requires /page_type to be product_list or homepage. /page_type matches expected String. Rule attachment path: /page_type. New schema draft Signal Shop pageview will be created and remain unavailable until publication.",
        reviewStages:[["Choose schema destination","complete"],["Define requirement","complete"],["Choose event scope","complete"],["Review validation","current"]],
        retainedDestination:{ kind:"new", name:"Signal Shop pageview" },
        retainedScope:"domain-all-paths",
        advanced:{ rule:"pageview requirement", source:"event-history", target:"payload", defaults:"Severity Error; version policy Pinned." },
        saveFailure:{ flowVisible:true, review:"pageview on 127.0.0.1 requires /page_type to be product_list or homepage. /page_type matches expected String. Rule attachment path: /page_type. New schema draft Signal Shop pageview will be created and remain unavailable until publication.", error:"Saving failed. Check storage access and try again.", unchanged:true },
        saved:{ schemas:1, reusableRules:1, published:false, pendingChanges:["Add /page_type validation"], localRules:1, assignment:{ id:"assignment:schema:signal-shop-pageview:1:pageview-on-127-0-0-1", name:"pageview on 127.0.0.1", sourceId:"event-history", eventName:"pageview", target:"payload", priority:100, versionPolicy:"pinned", enabled:true, domainCondition:"127.0.0.1" }, flowClosed:true, inspectorRestored:true, status:"Draft Signal Shop pageview was created.", focusReturned:true, nextActions:["Review draft", "Publish revision", "Use a different schema"], attachedRule:{ id:"rule:pageview-requirement", name:"pageview requirement", version:1, propertyPath:"/page_type", operator:"allowed-values", parameters:"product_list,homepage", severity:"error", enabled:true }, validation:{ state:"Valid", issues:0, evaluations:[{ propertyPath:"/page_type", status:"pass", expected:"product_list,homepage", actual:"product_list" }] }, legacy:{ parameters:"product_list,homepage", state:"Valid", issues:0, evaluations:[{ propertyPath:"/page_type", status:"pass", expected:"product_list,homepage", actual:"product_list" }], exportedParameters:"product_list,homepage" } },
        published:{ label:"Publish this rule for Rule Library reuse", reusableRules:1, attachedRuleId:"rule:pageview-requirement", reusableRuleId:"rule:pageview-requirement", unpublishedChoiceAbsent:true, assignableAfterPublication:true, currentRevision:1, historicalRevisions:0, attachedRule:{ id:"rule:pageview-requirement", name:"pageview requirement", version:1, propertyPath:"/page_type", operator:"allowed-values", parameters:"product_list,homepage", severity:"error", enabled:true }, reusableRule:{ id:"rule:pageview-requirement", name:"pageview requirement", kind:"allowed-values", version:1, enabled:true, operator:"allowed-values", parameters:"product_list,homepage", severity:"error", attachments:["schema:signal-shop-pageview:1"] } },
        existingOptions:[
          { label:"Existing pageview version 1", disabled:false, explanation:"page_type will be added" },
          { label:"Product listing version 3", disabled:false, explanation:"page_type accepts String rules" },
          { label:"Numeric page types version 1", disabled:true, explanation:"page_type expects Number" },
          { label:"Raw pageview version 1", disabled:true, explanation:"schema validates raw input, not payload" },
        ],
        existingReview:"pageview on 127.0.0.1 requires /page_type to be product_list or homepage. /page_type matches expected String. Rule attachment path: /page_type. The rule will be added to the Product listing working draft based on version 3. Product listing version 3 remains current until the working draft is published. Assignment action: add the reviewed assignment as a pending change.",
        existingSaved:{ versions:[3], currentRules:0, draftRules:1, pendingChanges:["Add /page_type validation"], assignments:2, flowClosed:true, inspectorRestored:true, status:"Validation was added to Product listing draft.", focusReturned:true },
        schemaPrefillRequirement:{ expectedType:"String", expectedTypeSource:"String — Generic pageview version 4", target:"payload" },
        schemaPrefillScope:{ configurationAbsent:true, selectionAbsent:true },
        replacementReview:{ items:["domain: operator.example would be replaced by 127.0.0.1"], actions:["Keep current values", "Accept schema-derived values"] },
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
          { name:"Existing pageview", target:"payload", propertyState:"absent", available:true, explanation:"page_type will be added" },
          { name:"Product listing", target:"payload", propertyState:"String", available:true, explanation:"page_type accepts String rules" },
          { name:"Numeric page types", target:"payload", propertyState:"Number", available:false, explanation:"page_type expects Number" },
          { name:"Raw pageview", target:"raw input", propertyState:"absent", available:false, explanation:"schema validates raw input, not payload" },
        ],
        assignmentResolutions:[
          { count:0, selection:"Create a new assignment", domain:"127.0.0.1", pathConditions:[] },
          { count:1, selection:"the compatible assignment", domain:"127.0.0.1", pathConditions:[{ matchType:"Exact path", expression:"/" }] },
          { count:2, selection:"required from readable assignment choices", domain:"127.0.0.1", pathConditions:[] },
        ],
        assignmentCoverage:[
          { state:"no assignments", configuration:"displayed", action:"add a reviewed pending assignment", continuation:"allowed after assignment review" },
          { state:"one enabled assignment covers source, event, target, and URL", configuration:"not displayed", action:"reuse the covering assignment", continuation:"allowed without assignment review" },
          { state:"two enabled assignments cover the captured event", configuration:"not displayed", action:"reuse existing schema coverage", continuation:"allowed without assignment selection" },
          { state:"source, event, and target match but URL conditions do not", configuration:"displayed", action:"add a reviewed pending assignment", continuation:"allowed after assignment review" },
          { state:"only a disabled assignment covers the captured event", configuration:"displayed", action:"add a reviewed pending assignment", continuation:"allowed after assignment review" },
        ],
        destinations:{
          matching:{ review:"pageview on 127.0.0.1 requires page_type to be product_list or homepage. page_type matches expected String. Rule attachment path: page_type. The rule will be added to the Product listing working draft based on version 3. Product listing version 3 remains current until the working draft is published. Assignment action: reuse the covering assignment.", assignmentAction:"reuse the covering assignment" },
          pending:{ review:"pageview on 127.0.0.1 requires page_type to be product_list or homepage. page_type matches expected String. Rule attachment path: page_type. The rule will be added to the Product listing working draft based on version 3. Product listing version 3 remains current until the working draft is published. Assignment action: reuse the covering pending assignment.", assignmentAction:"reuse the covering pending assignment" },
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
      rows:["Checkout schema automatic · event-history/page_view · payload · No data conditions · anyany · priority 120 · pinned · disabled · Checkout schema", "Checkout schema automatic · event-history/page_view · raw input · No data conditions · shop.example/order-confirmation · priority 100 · follow latest · enabled · Checkout schema"],
      assignment:{ sourceId:"event-history", eventName:"page_view", target:"payload", id:"assignment:schema:checkout-schema:1:page_view", name:"Checkout schema automatic", priority:120, versionPolicy:"pinned", enabled:false, pathnameCondition:null },
      propertyRule:{ menuOpen:true, returnFocus:true, stateReturnFocus:true, summary:"View attached rules (1)", actions:["Disable", "Remove"], reenable:"Re-enable", revisionReview:{ open:true, summary:"Known page types v1 will become Known page types v2; parameters product,checkout → product,checkout,confirmation; examples product, checkout → product, checkout." }, ruleExportName:"known-page-types-v2.json" },
      storedPropertyRule:{ attached:true, version:1, enabled:true, propertyPath:"/example" },
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
          { state:"active-inherited", text:"Active inherited (1)Known page types v1 · /example · Checkout schema v2" },
          { state:"disabled-inherited", text:"Disabled inherited (0)No disabled inherited rules." },
          { state:"explicitly-reenabled", text:"Explicitly re-enabled (0)No explicitly re-enabled inherited rules." },
          { state:"local", text:"Local (0)No local rules." },
        ],
        preview:["/example · Known page types v1 · inherited from Checkout schema v2"],
      } : {
        groups:[
          { state:"active-inherited", text:"Active inherited (2)Known page types v1 · /example · Checkout schema v2Known channels v1 · root · Checkout schema v2" },
          { state:"disabled-inherited", text:"Disabled inherited (0)No disabled inherited rules." },
          { state:"explicitly-reenabled", text:"Explicitly re-enabled (0)No explicitly re-enabled inherited rules." },
          { state:"local", text:"Local (0)No local rules." },
        ],
        preview:["/example · Known page types v1 · inherited from Checkout schema v2", "root · Known channels v1 · inherited from Checkout schema v2"],
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
      assert.deepEqual(guidedDraftContinuationInitialObservation, { propertyAvailable:true, genericAbsent:true, continuationAbsent:true }, "Events without a selected draft continuation lost their property creation action");
      await installContinuationFixture("schema-product-listing");
      await reloadPanel(socket);
      guidedDraftContinuationObservation = await evaluate(socket, guidedDraftContinuationRuntime);
      assert.deepEqual(guidedDraftContinuationObservation, {
        initial:{ heading:"Product listing working draft", status:"Current revision 3 · 2 pending changes", actions:["Review draft", "Publish revision", "Use a different schema"], sectionCount:1, genericAbsent:true },
        opened:{ context:"Adding to Product listing draft", stages:["Define requirement", "Review validation"] },
        requirement:{ heading:"Define requirement", destinationAbsent:true, selectedSchema:"schema-product-listing" },
        prefill:{ configurationAbsent:true, selectionAbsent:true },
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
  if (process.env.GUIDED_ASSIGNMENT_COVERAGE_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ guidedAssignmentCoverage:guidedAssignmentCoverageObservation }));
  }
  if (process.env.CONDITIONAL_VALIDATION_RULES_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ conditionalValidationRules:conditionalValidationRulesObservation }));
  }
  if (process.env.SCHEMA_DOCUMENTATION_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaDocumentation:schemaDocumentationObservation }));
  }
  if (process.env.MISSING_EVENT_DEFECT_REPORT_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ missingEventDefectReport:missingEventDefectReportObservation }));
  }
  if (process.env.UNIFIED_DEFECT_BUILDER_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ unifiedDefectBuilder:missingEventDefectReportObservation }));
  }
  if (process.env.MISSING_EVENT_REPORT_FIDELITY_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ missingEventReportFidelity:missingEventDefectReportObservation?.fidelity }));
  }
  if (process.env.VALIDATION_PRESENCE_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ validationPresenceSemantics:validationPresenceSemanticsObservation }));
  }
  if (process.env.DEFECT_LIBRARY_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ defectLibrary:defectLibraryObservation }));
  }
  if (process.env.SCHEMA_PUBLICATION_REFRESH_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaPublicationRefresh:schemaPublicationRefreshObservation }));
  }
  if (process.env.ALLOWED_VALUE_EXPANSION_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ allowedValueExpansion:allowedValueExpansionObservation }));
  }
  if (process.env.LOCAL_RULE_PROMOTION_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ localRulePromotion:localRulePromotionObservation }));
  }
  if (process.env.LOCAL_RULE_PROMOTION_AVAILABILITY_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ localRulePromotionAvailability:localRulePromotionAvailabilityObservation }));
  }
  if (process.env.LIVE_GUIDED_CONDITIONAL_RULE_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ liveGuidedConditionalRule:liveGuidedConditionalRuleObservation }));
  }
  if (process.env.SAVED_EVENT_FEED_FILTERS_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ savedEventFeedFilters:savedEventFeedFiltersObservation }));
  }
  if (process.env.DEFECT_REPORT_UNDECLARED_REMOVAL_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ defectReportUndeclaredRemoval:defectReportUndeclaredRemovalObservation }));
  }
  if (process.env.REQUIRED_PROPERTY_DEFECT_SCHEMA_CHOICES_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ requiredPropertyDefectSchemaChoices:requiredPropertyDefectSchemaChoicesObservation }));
  }
  if (process.env.DEFECT_REPORT_SEMANTIC_DIFFERENCES_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ defectReportSemanticDifferences:defectReportSemanticDifferencesObservation }));
  }
  if (process.env.DEFECT_REPORT_PROVENANCE_PRESENTATION_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ defectReportProvenancePresentation:defectReportProvenancePresentationObservation }));
  }
  if (process.env.EVENT_OCCURRENCE_DEFECT_REPORT_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ eventOccurrenceDefectReport:eventOccurrenceDefectReportObservation }));
  }
  if (process.env.SCHEMA_PROPERTY_COPY_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaPropertyCopy:schemaPropertyCopyObservation }));
  }
  if (process.env.SCHEMA_ASSIGNMENT_DATA_CONDITIONS_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaAssignmentDataConditions:schemaAssignmentDataConditionsObservation }));
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
  if (process.env.SCHEMA_RULE_PROPERTY_IDENTITY_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaRulePropertyIdentity:schemaRulePropertyIdentityObservation }));
  }
  if (process.env.CANONICAL_DECLARED_PROPERTY_VALIDATION_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ canonicalDeclaredPropertyValidation:canonicalDeclaredPropertyValidationObservation }));
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
  if (process.env.FRESH_LIVE_SESSION_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ freshLiveSession:{ initial:freshLiveSessionObservation, reload:freshLiveSessionReloadObservation } }));
  }
  if (process.env.SCHEMA_PROPERTY_REMOVAL_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaPropertyRemoval:{ initial:schemaPropertyRemovalObservation, reload:schemaPropertyRemovalReloadObservation } }));
  }
  if (process.env.WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ workspacePanelContainment:workspacePanelContainmentObservation }));
  }
  if (process.env.RECURSIVE_PROPERTY_VALIDATION_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ recursivePropertyValidation:recursivePropertyValidationObservation }));
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
