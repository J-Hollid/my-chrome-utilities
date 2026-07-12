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

async function reloadPanel(socket) {
  await socket.call("Page.reload");
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const ready = await evaluate(socket, "document.readyState === 'complete' && document.querySelector('#side-panel-root') !== null");
    if (ready) return;
    await wait(50);
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
  clickButton(flow, "Save validation");
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
  clickButton(flow, "Save validation");
  await new Promise((resolve) => setTimeout(resolve, 0));
  const storedSchemas = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1") ?? "[]");
  const storedRules = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1") ?? "[]");
  const saved = {
    schemas:storedSchemas.length - before.schemas,
    reusableRules:storedRules.length - before.rules,
    localRules:storedSchemas.at(-1).attachedRules.length,
    assignment:storedSchemas.at(-1).assignments[0],
    flowClosed:!visible(flow),
    inspectorRestored:visible(q("#live-event-inspector")),
    status:q("#live-session-message").textContent,
    focusReturned:document.activeElement?.dataset.action === "create-validation",
  };
  const reusableRules = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1") ?? "[]");
  const published = {
    label:publishLabel,
    reusableRules:reusableRules.length - before.rules,
    attachedRuleId:storedSchemas.at(-1).attachedRules[0].id,
    reusableRuleId:reusableRules.at(-1).id,
  };
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
  clickButton(flow, "Save validation");
  await new Promise((resolve) => setTimeout(resolve, 0));
  const afterExistingSchemas = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1") ?? "[]");
  const productVersions = afterExistingSchemas.filter((schema) => schema.name === "Product listing");
  const existingSaved = {
    versions:productVersions.map(({ version }) => version),
    version3Rules:productVersions.find(({ version }) => version === 3).attachedRules?.length ?? 0,
    version4Rules:productVersions.find(({ version }) => version === 4).attachedRules?.length ?? 0,
    assignments:productVersions.find(({ version }) => version === 4).assignments.length,
    flowClosed:!visible(flow),
    inspectorRestored:visible(q("#live-event-inspector")),
    status:q("#live-session-message").textContent,
    focusReturned:document.activeElement?.dataset.action === "create-validation",
  };
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
  clickButton(q("#guided-schema-picker"), "Select Product listing version 3");
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
  q("#add-schema-rule").click();
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
  Array.from(q("#schema-list").querySelectorAll("button")).find((button) => button.textContent === "Edit as new version").click();
  q("#cancel-schema-revision").click();
  const propertyAdd = Array.from(q("#schema-property-tree").querySelectorAll("summary")).find((summary) => summary.textContent === "Add validation rule");
  if (!propertyAdd) throw new Error("Missing expandable property rule menu");
  const propertyMenu = q("#schema-property-tree details[data-rule-menu]");
  propertyAdd.click();
  const propertyMenuOpen = propertyMenu.open;
  const attach = Array.from(q("#schema-property-tree").querySelectorAll("button")).find((button) => button.textContent === "Attach Known page types v1");
  if (!attach) throw new Error("Missing property rule attachment action");
  attach.click();
  const propertyReturnFocus = document.activeElement?.dataset.schemaPropertyPath === "example";
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
  q("#schema-assignment-policy").value = "follow latest";
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
  Array.from(q("#schema-list").querySelectorAll("button")).find((button) => button.textContent === "Edit as new version").click();
  const revisionReview = { open:q("#schema-revision-review").open, summary:q("#schema-revision-review-summary").textContent };
  q("#cancel-schema-revision").click();
  q("#create-schema").click();
  input("#schema-editor-name", "Unsaved schema");
  q("#close-schema-editor").click();
  const closeReview = { open:q("#close-schema-editor-review").open, summary:q("#schema-close-review-summary").textContent };
  q("#discard-schema-draft").click();
  const persistedSchemas = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"));
  const persistedRules = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1"));
  const latestRule = persistedRules.at(-1);
  const storedPropertyRule = persistedSchemas[0].attachedRules?.find((rule) => rule.propertyPath === "example");
  return {
    fields:["#schema-assignment-source", "#schema-assignment-event", "#schema-assignment-target", "#schema-assignment-domain", "#schema-assignment-pathname", "#schema-assignment-priority", "#schema-assignment-schema", "#schema-assignment-policy", "#schema-assignment-enabled"].map((selector) => ({ selector, required:q(selector).required })),
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
  const child = Array.from(q("#schema-list").querySelectorAll("li")).find((item) => item.textContent.startsWith("Order confirmation v1"));
  if (!child) throw new Error("Missing saved child schema");
  q("#schema-subview-assignments").click();
  q("#create-schema-assignment").click();
  q("#schema-assignment-schema").value = Array.from(q("#schema-assignment-schema").options).find((option) => option.textContent.startsWith("Order confirmation v1"))?.value ?? "";
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
  const validate = Array.from(q("#live-event-inspector").querySelectorAll("button")).find((button) => button.textContent === "Validate");
  if (!validate) throw new Error("Missing Validate action");
  validate.click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  const validationTerm = q('#live-event-inspector dt[data-field="validation"]');
  q("#live-validation-filter").value = "Warnings";
  q("#live-validation-filter").dispatchEvent(new Event("change", { bubbles:true }));
  return { event:event.textContent, validation:validationTerm.nextElementSibling?.textContent ?? "", detail:document.querySelector("#live-event-inspector [data-validation-details]")?.textContent ?? "", filtered:Array.from(q("#live-event-feed").querySelectorAll("button")).map((button) => button.textContent), filterOptions:Array.from(q("#live-validation-filter").options).map((option) => option.textContent) };
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

const within = (child, parent) => child.x >= parent.x - 1 && child.right <= parent.right + 1 && child.y >= parent.y - 1 && child.bottom <= parent.bottom + 1;
const withinColumn = (child, parent) => child.x >= parent.x - 1 && child.right <= parent.right + 1;
const overlaps = (left, right) => left.x < right.right && left.right > right.x && left.y < right.bottom && left.bottom > right.y;

try {
  const port = await debuggingPort();
  for (const width of [320, 360, 520, 720]) {
    const socket = await openPanel(port, width);
    const schemaRuleEditorVisibility = await evaluate(socket, schemaRuleEditorVisibilityRuntime);
    assert.deepEqual(schemaRuleEditorVisibility, {
      hiddenByView:{ Live:true, Library:true, Sessions:true, Schemas:true },
      editorVisible:true,
      configurationVisible:true,
      configurationInsideEditor:true,
    }, `Schema rule configuration visibility violated its ${width}px browser contract`);
    await reloadPanel(socket);
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
      await evaluate(socket, `(previous => { localStorage.clear(); for (const [key, value] of Object.entries(previous)) localStorage.setItem(key, value); })(${JSON.stringify(previousPickerStorage)})`);
      await reloadPanel(socket);
      socket.close();
      continue;
    }
    if (width === 720) {
      const previousGuidedStorage = await evaluate(socket, `(() => {
        const previous = Object.fromEntries(Array.from({ length:localStorage.length }, (_, index) => localStorage.key(index)).filter(Boolean).map((key) => [key, localStorage.getItem(key)]));
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
        return previous;
      })()`);
      await reloadPanel(socket);
      guidedValidationObservation = await evaluate(socket, guidedValidationRuntime);
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
        reviewBeforeBack:"pageview on 127.0.0.1 requires page_type to be product_list or homepage. page_type matches expected String. Rule attachment path: page_type. New schema Signal Shop pageview will be created.",
        reviewStages:[["Choose properties","complete"],["Choose schema destination","complete"],["Define requirement","complete"],["Choose event scope","complete"],["Review validation","current"]],
        retainedDestination:{ kind:"new", name:"Signal Shop pageview" },
        retainedScope:"domain-all-paths",
        advanced:{ rule:"pageview requirement", source:"event-history", target:"payload", defaults:"Severity Error; version policy Pinned." },
        saveFailure:{ flowVisible:true, review:"pageview on 127.0.0.1 requires page_type to be product_list or homepage. page_type matches expected String. Rule attachment path: page_type. New schema Signal Shop pageview will be created.", error:"Saving failed. Check storage access and try again.", unchanged:true },
        saved:{ schemas:1, reusableRules:1, localRules:1, assignment:{ id:"assignment:schema:signal-shop-pageview:1:pageview", name:"Signal Shop pageview automatic", sourceId:"event-history", eventName:"pageview", target:"payload", priority:100, versionPolicy:"pinned", enabled:true, domainCondition:"127.0.0.1" }, flowClosed:true, inspectorRestored:true, status:"Saved validation: schema Signal Shop pageview was created.", focusReturned:true },
        published:{ label:"Publish this rule for Rule Library reuse", reusableRules:1, attachedRuleId:"rule:pageview-requirement", reusableRuleId:"rule:pageview-requirement" },
        existingOptions:[
          { label:"Existing pageview version 1", disabled:false, explanation:"page_type will be added" },
          { label:"Generic pageview version 1", disabled:false, explanation:"page_type will be added" },
          { label:"Generic pageview version 4", disabled:false, explanation:"page_type accepts String rules" },
          { label:"Product listing version 3", disabled:false, explanation:"page_type accepts String rules" },
          { label:"Numeric page types version 1", disabled:true, explanation:"page_type expects Number" },
          { label:"Raw pageview version 1", disabled:true, explanation:"schema validates raw input, not payload" },
          { label:"Signal Shop pageview version 1", disabled:false, explanation:"page_type accepts String rules" },
        ],
        existingReview:"pageview on 127.0.0.1 requires page_type to be product_list or homepage. page_type matches expected String. Rule attachment path: page_type. Product listing version 4 will be created while version 3 remains unchanged. Assignment action: reuse the matching enabled assignment.",
        existingSaved:{ versions:[3,4], version3Rules:0, version4Rules:1, assignments:1, flowClosed:true, inspectorRestored:true, status:"Saved validation: validation was added to Product listing version 4.", focusReturned:true },
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
          matching:{ review:"pageview on 127.0.0.1 requires page_type to be product_list or homepage. page_type matches expected String. Rule attachment path: page_type. Product listing version 4 will be created while version 3 remains unchanged. Assignment action: reuse the matching enabled assignment.", assignmentAction:"reuse the matching enabled assignment" },
          absent:{ review:"pageview on 127.0.0.1 requires page_type to be product_list or homepage. page_type matches expected String. Rule attachment path: page_type. Product listing version 4 will be created while version 3 remains unchanged. Assignment action: create the reviewed enabled assignment.", assignmentAction:"create the reviewed enabled assignment" },
        },
      }, "Guided validation production matchers violated their browser-loaded contract");
      await evaluate(socket, `(() => { localStorage.clear(); for (const [key, value] of Object.entries(${JSON.stringify(previousGuidedStorage)})) localStorage.setItem(key, value); return true; })()`);
      await reloadPanel(socket);
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
        { selector:"#schema-assignment-policy", required:false },
        { selector:"#schema-assignment-enabled", required:false },
      ],
      schemaMasterVisible:true,
      actions:["Edit", "Duplicate", "Disable", "Delete"],
      duplicateCount:3,
      revisionReview:{ open:true, summary:"Checkout schema will be saved as version 3; version 2 remains available." },
      closeReview:{ open:true, summary:"Discard unsaved schema Unsaved schema?" },
      rows:["Checkout schema automatic · event-history/page_view · payload · anyany · priority 120 · pinned · disabled · Checkout schema", "Checkout schema automatic · event-history/page_view · raw input · shop.example/order-confirmation · priority 100 · pinned · enabled · Checkout schema"],
      assignment:{ sourceId:"event-history", eventName:"page_view", target:"payload", id:"assignment:schema:checkout-schema:2:page_view", name:"Checkout schema automatic", priority:120, pathnameCondition:null, versionPolicy:"pinned", enabled:false },
      propertyRule:{ menuOpen:true, returnFocus:true, stateReturnFocus:true, summary:"View attached rules (1)", actions:["Disable", "Remove"], reenable:"Re-enable", revisionReview:{ open:true, summary:"Known page types v1 will become Known page types v2; parameters product,checkout → product,checkout,confirmation; examples product, checkout → product, checkout." }, ruleExportName:"known-page-types-v2.json" },
      storedPropertyRule:{ attached:true, version:1, enabled:true, propertyPath:"example" },
      rule:{ initialSeverity:"warning", name:"Known page types", version:2, enabled:true, operator:"allowed-values", parameters:"product,checkout,confirmation", severity:"error", message:"Use a known page type", examples:"product, checkout", attachments:[] },
    }, `Schema rule persistence and assignment editor fields failed their ${width}px browser contract`);
    let schemaSourceCreation;
    let schemaInheritance;
    let schemaLibraryTransfer;
    let schemaReload;
    let schemaLiveValidation;
    if (width === 720) {
      schemaSourceCreation = await evaluate(socket, schemaSourceCreationRuntime);
      assert.deepEqual(schemaSourceCreation, {
        schemaView:true,
        editor:true,
        name:"Order complete schema",
        paths:["page_type", "page_name", "commerce", "commerce.order", "commerce.order.id"],
        assignment:"payload",
        draftRefresh:{ unchanged:true, message:"Library draft validation: Valid · Checkout schema v2." },
        persistedAttachment:"schema:checkout-schema:2",
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
      assert.deepEqual(schemaLiveValidation.filterOptions, ["All states", "Not checked", "Valid", "Warnings", "Issues", "Assignment error"], "Live validation filter did not expose all five states");
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
    socket.close();
  }
  if (process.env.SCHEMA_WORKSPACE_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaWorkspace:schemaWorkspaceAdapterObservations.at(-1) }));
  }
  if (process.env.GUIDED_VALIDATION_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ guidedValidation:guidedValidationObservation, guidedSchemaPicker:guidedSchemaPickerObservation }));
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
