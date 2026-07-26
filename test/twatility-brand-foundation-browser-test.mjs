import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import {
  headlessChromeArguments,
  resolveChromeExecutable,
  stopHeadlessChrome,
} from "./support/headless-chrome.mjs";

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

class DevtoolsSocket {
  constructor(url) {
    this.url = new URL(url);
    this.nextId = 1;
    this.pending = new Map();
    this.buffer = Buffer.alloc(0);
    this.events = [];
  }
  async connect() {
    await new Promise((resolve, reject) => {
      this.socket = net.createConnection({
        host: this.url.hostname,
        port: Number(this.url.port),
      });
      this.socket.once("error", reject);
      this.socket.once("connect", () => {
        const key = Buffer.from(String(Math.random())).toString("base64");
        this.socket.write(
          [
            `GET ${this.url.pathname}${this.url.search} HTTP/1.1`,
            `Host: ${this.url.host}`,
            "Upgrade: websocket",
            "Connection: Upgrade",
            `Sec-WebSocket-Key: ${key}`,
            "Sec-WebSocket-Version: 13",
            "\r\n",
          ].join("\r\n"),
        );
      });
      let handshake = "";
      const receive = (chunk) => {
        handshake += chunk.toString("binary");
        const end = handshake.indexOf("\r\n\r\n");
        if (end < 0) return;
        this.socket.off("data", receive);
        if (!handshake.startsWith("HTTP/1.1 101")) {
          reject(new Error("DevTools WebSocket upgrade failed"));
          return;
        }
        const remaining = Buffer.from(handshake.slice(end + 4), "binary");
        this.socket.on("data", (data) => this.receive(data));
        if (remaining.length) this.receive(remaining);
        resolve();
      };
      this.socket.on("data", receive);
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
      if ((first & 15) !== 1) continue;
      const message = JSON.parse(payload.toString("utf8"));
      const pending = this.pending.get(message.id);
      if (!pending) {
        this.events.push(message);
        continue;
      }
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    }
  }
  send(payload) {
    const body = Buffer.from(JSON.stringify(payload));
    const mask = Buffer.from([1, 2, 3, 4]);
    let header;
    if (body.length < 126) {
      header = Buffer.from([0x81, 0x80 | body.length]);
    } else {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 0x80 | 126;
      header.writeUInt16BE(body.length, 2);
    }
    for (let index = 0; index < body.length; index += 1) {
      body[index] ^= mask[index % 4];
    }
    this.socket.write(Buffer.concat([header, mask, body]));
  }
  call(method, params = {}) {
    const id = this.nextId++;
    this.send({ id, method, params });
    return new Promise((resolve, reject) =>
      this.pending.set(id, { resolve, reject }),
    );
  }
  close() {
    this.socket?.destroy();
  }
}

async function evaluate(socket, expression) {
  const result = await socket.call("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.exception?.description ??
        result.exceptionDetails.text,
    );
  }
  return result.result.value;
}

async function extensionId(port) {
  for (let attempt = 0; attempt < 160; attempt += 1) {
    const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(
      (response) => response.json(),
    );
    const worker = targets.find(
      ({ type, url }) =>
        type === "service_worker" &&
        url.startsWith("chrome-extension://") &&
        new URL(url).pathname === "/background.js",
    );
    if (worker) return new URL(worker.url).hostname;
    await wait(25);
  }
  throw new Error("Unpacked extension did not load");
}

async function pageSocket(port, url) {
  const page = await fetch(
    `http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`,
    { method: "PUT" },
  ).then((response) => response.json());
  const socket = new DevtoolsSocket(page.webSocketDebuggerUrl);
  await socket.connect();
  await socket.call("Runtime.enable");
  await socket.call("Page.enable");
  await socket.call("Network.enable");
  await socket.call("Log.enable");
  return socket;
}

async function inspectSurface(socket, width, height, expectedClass, expectedSheets) {
  await socket.call("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (await evaluate(socket, "document.readyState === 'complete'")) break;
    await wait(25);
  }
  const report = await evaluate(
    socket,
    `(async()=>{
      const references=["aria-controls","aria-labelledby","aria-describedby","aria-errormessage"];
      const visible=(element)=>{const style=getComputedStyle(element),box=element.getBoundingClientRect();return !element.hidden&&style.display!=="none"&&style.visibility!=="hidden"&&box.width>0&&box.height>0;};
      const name=(element)=>element.getAttribute("aria-label")||element.getAttribute("aria-labelledby")||element.labels?.[0]?.textContent?.trim()||element.textContent?.trim()||element.getAttribute("title")||element.getAttribute("placeholder")||element.value||"";
      const signature=()=>[...document.querySelectorAll("button,input,select,textarea,a[href],[role=tab],[role=dialog]")].map((element)=>({
        tag:element.tagName,id:element.id,type:element.getAttribute("type"),role:element.getAttribute("role"),
        hidden:element.hidden,disabled:Boolean(element.disabled),aria:references.map((attribute)=>[attribute,element.getAttribute(attribute)])
      }));
      const before=signature();
      const branded=[...document.styleSheets].filter((sheet)=>/twatility-brand|(?:side-panel|specification-builder)-brand/.test(sheet.href||""));
      branded.forEach((sheet)=>{sheet.disabled=true;});
      const after=signature();
      branded.forEach((sheet)=>{sheet.disabled=false;});
      const alpha=async(source)=>new Promise((resolve,reject)=>{
        const image=new Image();
        image.onload=()=>{const canvas=document.createElement("canvas");canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const context=canvas.getContext("2d",{willReadFrequently:true});context.drawImage(image,0,0);const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;let transparent=false,opaque=false;for(let index=3;index<pixels.length;index+=4){transparent||=pixels[index]===0;opaque||=pixels[index]>0;if(transparent&&opaque)break;}resolve({transparent,opaque});};
        image.onerror=()=>reject(new Error("Failed to decode "+source));image.src=source;
      });
      return {
        bodyClasses:[...document.body.classList],
        sheets:[...document.styleSheets].map((sheet)=>sheet.href?new URL(sheet.href).pathname.split("/").pop():"(inline)"),
        ink:getComputedStyle(document.body).getPropertyValue("--twa-ink").trim(),
        overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
        unnamed:[...document.querySelectorAll("button,input,select,textarea,a[href],[role=tab]")].filter(visible).filter((element)=>!name(element)).map((element)=>element.id||element.outerHTML.slice(0,80)),
        broken:[...document.querySelectorAll("*")].flatMap((element)=>references.flatMap((attribute)=>{const value=element.getAttribute(attribute);return value?value.split(/\\s+/).filter((id)=>!document.getElementById(id)).map((id)=>({owner:element.id,attribute,id})):[];})),
        equivalent:JSON.stringify(before)===JSON.stringify(after),
        belt:await alpha("assets/brand/twatility-belt.png"),
        analyst:await alpha("assets/brand/technical-analyst.png")
      };
    })()`,
  );
  assert.ok(report.bodyClasses.includes("twatility-theme"));
  assert.ok(report.bodyClasses.includes(expectedClass));
  assert.deepEqual(
    expectedSheets.filter((name) => !report.sheets.includes(name)),
    [],
    "all branded stylesheets must load",
  );
  assert.equal(report.ink, "#17130e");
  assert.equal(report.overflow, false, "page-level horizontal overflow");
  assert.deepEqual(report.unnamed, [], "visible controls must have names");
  assert.deepEqual(report.broken, [], "ARIA references must resolve");
  assert.equal(report.equivalent, true, "branding must not alter control state or identity");
  assert.deepEqual(report.belt, { transparent: true, opaque: true });
  assert.deepEqual(report.analyst, { transparent: true, opaque: true });
  return report;
}

const profile = await mkdtemp(path.join(os.tmpdir(), "twatility-foundation-"));
const extensionRoot = path.resolve("dist");
const chromeArguments = headlessChromeArguments(profile, extensionRoot);
chromeArguments.splice(-1, 0, `--load-extension=${extensionRoot}`);
const chrome = spawn(resolveChromeExecutable(), chromeArguments, {
  stdio: ["ignore", "ignore", "pipe"],
});
const evidenceDirectory = path.resolve(
  process.env.BRAND_EVIDENCE_DIR ??
    "docs/twatility-branding-evidence/slice-1-foundation",
);
await mkdir(evidenceDirectory, { recursive: true });
let side;
let studio;
try {
  const port = await new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(
      () => reject(new Error(`Chrome debugging timeout: ${output}`)),
      15_000,
    );
    chrome.stderr.on("data", (chunk) => {
      output += chunk;
      const match = output.match(/ws:\/\/127\.0\.0\.1:(\d+)\//u);
      if (match) {
        clearTimeout(timeout);
        resolve(Number(match[1]));
      }
    });
    chrome.once("error", reject);
  });
  const id = await extensionId(port);
  const base = `chrome-extension://${id}/`;
  side = await pageSocket(port, `${base}side-panel.html`);
  const sideReport = await inspectSurface(
    side,
    360,
    760,
    "twatility-side-panel",
    ["twatility-brand.css", "side-panel-brand.css"],
  );
  const sideCapture = await side.call("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  await writeFile(
    path.join(evidenceDirectory, "side-panel-360x760.png"),
    Buffer.from(sideCapture.data, "base64"),
  );

  studio = await pageSocket(port, `${base}specification-builder.html`);
  const studioReport = await inspectSurface(
    studio,
    1280,
    900,
    "twatility-studio",
    ["twatility-brand.css", "specification-builder-brand.css"],
  );
  const studioCapture = await studio.call("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  await writeFile(
    path.join(evidenceDirectory, "studio-1280x900.png"),
    Buffer.from(studioCapture.data, "base64"),
  );

  const badEvents = [...side.events, ...studio.events].filter(
    ({ method, params }) =>
      method === "Runtime.exceptionThrown" ||
      method === "Network.loadingFailed" ||
      (method === "Log.entryAdded" &&
        ["error", "warning"].includes(params.entry?.level)),
  );
  assert.deepEqual(badEvents, [], "installed extension must have no runtime/load errors");
  await writeFile(
    path.join(evidenceDirectory, "report.json"),
    `${JSON.stringify({ side: sideReport, studio: studioReport }, null, 2)}\n`,
  );
} finally {
  side?.close();
  studio?.close();
  await stopHeadlessChrome(chrome, 1500);
  await rm(profile, { recursive: true, force: true });
}

console.log("TWAtility Belt packaged foundation browser test passed");
