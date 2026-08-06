import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import {
  headlessChromeArguments,
  removeChromeProfile,
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
        title:await alpha("assets/brand/specification-studio-title.png"),
        panelTitle:await alpha("assets/brand/side-panel-title.png"),
        analyst:await alpha("assets/brand/technical-analyst.png"),
        analystSpeakingA:await alpha("assets/brand/technical-analyst-speaking-a.png"),
        analystSpeakingB:await alpha("assets/brand/technical-analyst-speaking-b.png")
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
  assert.deepEqual(report.title, { transparent: true, opaque: true });
  assert.deepEqual(report.panelTitle, { transparent: true, opaque: true });
  assert.deepEqual(report.analyst, { transparent: true, opaque: true });
  assert.deepEqual(report.analystSpeakingA, { transparent: true, opaque: true });
  assert.deepEqual(report.analystSpeakingB, { transparent: true, opaque: true });
  return report;
}

async function waitForShell(socket) {
  for (let attempt = 0; attempt < 240; attempt += 1) {
    const ready = await evaluate(
      socket,
      `document.readyState==="complete" &&
        document.querySelectorAll("#utility-directory li").length===3 &&
        document.getElementById("data-layer-view-live")?.getAttribute("aria-selected")==="true"`,
    );
    if (ready) return;
    await wait(25);
  }
  throw new Error("Side-panel shell did not finish initializing");
}

async function inspectShellInteractions(socket, width, height) {
  await socket.call("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await waitForShell(socket);

  const tabReport = await evaluate(
    socket,
    `(async()=>{
      const waitFrame=()=>new Promise((resolve)=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const visible=(element)=>Boolean(element)&&!element.hidden&&getComputedStyle(element).display!=="none";
      const dataTabs=[...document.querySelectorAll("#data-layer-views [role=tab]")];
      const expected=["Live","Projects","Library","Sessions","Defects","Schemas"];
      const visits=[];
      for(const tab of dataTabs){
        tab.click();
        await waitFrame();
        const panel=document.getElementById(tab.getAttribute("aria-controls"));
        visits.push({
          tab:tab.textContent.trim(),
          selected:tab.getAttribute("aria-selected"),
          panel:panel?.id,
          visible:visible(panel)
        });
      }
      document.getElementById("data-layer-view-live").click();
      await waitFrame();

      const hotkeys=document.getElementById("workspace-tab-hotkeys");
      hotkeys.focus();
      hotkeys.click();
      await waitFrame();
      const hotkeysVisible=visible(document.getElementById("workspace-panel-hotkeys"));
      hotkeys.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowLeft",bubbles:true}));
      await waitFrame();
      const dataLayer=document.getElementById("workspace-tab-data-layer");
      const keyboardReturned=dataLayer.getAttribute("aria-selected")==="true"&&document.activeElement===dataLayer;

      const details=document.getElementById("live-session-details");
      details.open=true;
      const url=document.getElementById("live-page-url");
      url.textContent="https://example.invalid/"+("very-long-identifier-".repeat(28))+"payload.json";
      await waitFrame();
      const root=document.documentElement;
      const panel=document.getElementById("workspace-panel-data-layer");
      const longTextContained=url.scrollWidth<=url.clientWidth+1||getComputedStyle(url).overflowWrap==="anywhere";
      const brand=document.getElementById("app");
      const brandImage=brand?.querySelector(".twatility-wordmark__image");
      const header=document.getElementById("application-header");
      const commands=document.getElementById("open-palette");
      const brandBox=brand?.getBoundingClientRect();
      const imageBox=brandImage?.getBoundingClientRect();
      const headerBox=header?.getBoundingClientRect();
      const commandsBox=commands?.getBoundingClientRect();
      const contains=(outer,inner)=>Boolean(outer&&inner)&&inner.left>=outer.left-.5&&inner.top>=outer.top-.5&&inner.right<=outer.right+.5&&inner.bottom<=outer.bottom+.5;
      const disjoint=(a,b)=>Boolean(a&&b)&&(a.right<=b.left+.5||b.right<=a.left+.5||a.bottom<=b.top+.5||b.bottom<=a.top+.5);
      const brandStyle=brand?getComputedStyle(brand):null;
      const imageStyle=brandImage?getComputedStyle(brandImage):null;
      const overflow={
        document:root.scrollWidth-root.clientWidth,
        body:document.body.scrollWidth-document.body.clientWidth,
        workspace:panel.scrollWidth-panel.clientWidth
      };
      panel.scrollTop=0;
      return {
        width:${width},
        height:${height},
        brandName:document.getElementById("app")?.getAttribute("aria-label"),
        brandArt:{
          count:brand?.querySelectorAll(".twatility-wordmark__image").length??0,
          source:Boolean(brandImage)&&new URL(brandImage.currentSrc||brandImage.src).pathname.endsWith("/assets/brand/side-panel-title.png"),
          decoded:Boolean(brandImage)&&brandImage.complete&&brandImage.naturalWidth===800&&brandImage.naturalHeight===180,
          decorative:Boolean(brandImage)&&brandImage.alt===""&&brandImage.getAttribute("aria-hidden")==="true",
          aspectPreserved:Boolean(imageBox)&&Math.abs(imageBox.width/imageBox.height-800/180)<.02,
          unscaled:Boolean(brandStyle&&imageStyle)&&brandStyle.transform==="none"&&imageStyle.transform==="none",
          contained:contains(headerBox,brandBox)&&contains(brandBox,imageBox),
          separateFromCommands:disjoint(imageBox,commandsBox),
          renderedWidth:imageBox?.width??0
        },
        utilityCount:document.querySelectorAll("#utility-directory li").length,
        dataTabs:dataTabs.map((tab)=>tab.textContent.trim()),
        expected,
        visits,
        hotkeysVisible,
        keyboardReturned,
        longTextContained,
        overflow
      };
    })()`,
  );
  assert.equal(tabReport.brandName, "TWAtility Belt");
  assert.deepEqual(
    {
      count:tabReport.brandArt.count,
      source:tabReport.brandArt.source,
      decoded:tabReport.brandArt.decoded,
      decorative:tabReport.brandArt.decorative,
      aspectPreserved:tabReport.brandArt.aspectPreserved,
      unscaled:tabReport.brandArt.unscaled,
      contained:tabReport.brandArt.contained,
      separateFromCommands:tabReport.brandArt.separateFromCommands,
    },
    {
      count:1,
      source:true,
      decoded:true,
      decorative:true,
      aspectPreserved:true,
      unscaled:true,
      contained:true,
      separateFromCommands:true,
    },
    "the panel must use one contained, proportion-preserved derivative of the corrected Studio wordmark",
  );
  assert.ok(
    tabReport.brandArt.renderedWidth >= 120 && tabReport.brandArt.renderedWidth <= 170,
    `panel wordmark optical width at ${width}px: ${tabReport.brandArt.renderedWidth}`,
  );
  assert.equal(tabReport.utilityCount, 3, "all registered utilities remain visible");
  assert.deepEqual(tabReport.dataTabs, tabReport.expected);
  assert.ok(
    tabReport.visits.every(
      ({ selected, visible }) => selected === "true" && visible,
    ),
    "every Data Layer route must select and reveal its owned panel",
  );
  assert.equal(tabReport.hotkeysVisible, true, "Hotkeys workspace remains accessible");
  assert.equal(
    tabReport.keyboardReturned,
    true,
    "workspace tab keyboard navigation and focus remain intact",
  );
  assert.equal(tabReport.longTextContained, true, "long identifiers must wrap or contain");
  assert.deepEqual(
    tabReport.overflow,
    { document: 0, body: 0, workspace: 0 },
    "shell and workspace must not create page-wide horizontal overflow",
  );

  await evaluate(
    socket,
    `(()=>{const button=document.getElementById("open-palette");button.focus();button.click();return !document.getElementById("palette").hidden;})()`,
  ).then((open) => assert.equal(open, true, "command palette opens"));
  await socket.call("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
  });
  await socket.call("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Escape",
    code: "Escape",
  });
  await wait(25);
  const paletteReport = await evaluate(
    socket,
    `({hidden:document.getElementById("palette").hidden,focus:document.activeElement?.id})`,
  );
  assert.equal(paletteReport.hidden, true, "Escape closes command palette");
  assert.equal(
    paletteReport.focus,
    "open-palette",
    "command palette restores trigger focus",
  );
  return { ...tabReport, palette: paletteReport };
}

const profile = await mkdtemp(path.join(os.tmpdir(), "twatility-side-shell-"));
const extensionRoot = path.resolve("dist");
const chromeArguments = headlessChromeArguments(profile, extensionRoot);
chromeArguments.splice(-1, 0, `--load-extension=${extensionRoot}`);
const chrome = spawn(resolveChromeExecutable(), chromeArguments, {
  stdio: ["ignore", "ignore", "pipe"],
});
const evidenceDirectory = path.resolve(
  process.env.BRAND_EVIDENCE_DIR ??
    "docs/twatility-branding-evidence/slice-2-side-panel-shell",
);
await mkdir(evidenceDirectory, { recursive: true });
let side;
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
  const viewports = [
    { width: 360, height: 760 },
    { width: 420, height: 900 },
    { width: 512, height: 900 },
  ];
  const reports = [];
  for (const viewport of viewports) {
    const foundation = await inspectSurface(
      side,
      viewport.width,
      viewport.height,
      "twatility-side-panel",
      ["twatility-brand.css", "side-panel-brand.css"],
    );
    const shell = await inspectShellInteractions(
      side,
      viewport.width,
      viewport.height,
    );
    await evaluate(
      side,
      `(()=>{
        const details=document.getElementById("live-session-details");
        if(details)details.open=false;
        const url=document.getElementById("live-page-url");
        if(url)url.textContent="";
        const panel=document.getElementById("workspace-panel-data-layer");
        if(panel)panel.scrollTop=0;
        document.getElementById("data-layer-view-live")?.click();
      })()`,
    );
    await wait(100);
    const capture = await side.call("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    await writeFile(
      path.join(
        evidenceDirectory,
        `side-panel-${viewport.width}x${viewport.height}.png`,
      ),
      Buffer.from(capture.data, "base64"),
    );
    reports.push({ viewport, foundation, shell });
  }

  const badEvents = side.events.filter(
    ({ method, params }) =>
      method === "Runtime.exceptionThrown" ||
      method === "Network.loadingFailed" ||
      (method === "Log.entryAdded" &&
        ["error", "warning"].includes(params.entry?.level)),
  );
  assert.deepEqual(badEvents, [], "installed extension must have no runtime/load errors");
  await writeFile(
    path.join(evidenceDirectory, "report.json"),
    `${JSON.stringify({ viewports: reports }, null, 2)}\n`,
  );
} finally {
  side?.close();
  await stopHeadlessChrome(chrome, 1500);
  await removeChromeProfile(profile, { targetId:"twatility-side-panel-shell" });
}

console.log("TWAtility Belt packaged side-panel shell browser test passed");
