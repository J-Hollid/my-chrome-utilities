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
      const titleLettering=async(source)=>new Promise((resolve,reject)=>{
        const image=new Image();
        image.onload=()=>{const canvas=document.createElement("canvas");canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const context=canvas.getContext("2d",{willReadFrequently:true});context.drawImage(image,0,0);const pixels=context.getImageData(0,0,canvas.width,canvas.height).data,mask=new Uint8Array(canvas.width*canvas.height),seen=new Uint8Array(mask.length),startX=Math.floor(canvas.width*.33);for(let y=0;y<canvas.height;y+=1){for(let x=startX;x<canvas.width;x+=1){const pixelIndex=(y*canvas.width+x)*4,red=pixels[pixelIndex],green=pixels[pixelIndex+1],blue=pixels[pixelIndex+2],alpha=pixels[pixelIndex+3];if(alpha>=128&&red>=175&&green>=150&&blue>=95&&red>=green-15&&green>=blue-15&&red-blue<=150)mask[y*canvas.width+x]=1;}}const components=[];for(let index=0;index<mask.length;index+=1){if(!mask[index]||seen[index])continue;const stack=[index];seen[index]=1;let area=0,minX=canvas.width,minY=canvas.height,maxX=-1,maxY=-1;while(stack.length){const current=stack.pop(),y=Math.floor(current/canvas.width),x=current-y*canvas.width;area+=1;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);const visit=(next)=>{if(mask[next]&&!seen[next]){seen[next]=1;stack.push(next);}};if(x>startX)visit(current-1);if(x+1<canvas.width)visit(current+1);if(y>0)visit(current-canvas.width);if(y+1<canvas.height)visit(current+canvas.width);}if(area>=20){const width=maxX-minX+1,height=maxY-minY+1;components.push({areaRatio:area/(canvas.width*canvas.height),widthRatio:width/canvas.width,heightRatio:height/canvas.height,centerX:(minX+maxX+1)/(2*canvas.width),centerY:(minY+maxY+1)/(2*canvas.height),bounds:[minX,minY,maxX+1,maxY+1]});}}const bodies=components.filter(({areaRatio,widthRatio,heightRatio,centerX,centerY})=>areaRatio>=.007&&areaRatio<=.035&&widthRatio>=.04&&widthRatio<=.14&&heightRatio>=.30&&heightRatio<=.56&&centerX>=.33&&centerX<=.97&&centerY>=.30&&centerY<=.65).sort((a,b)=>a.centerX-b.centerX),dots=components.filter(({areaRatio,widthRatio,heightRatio,centerX,centerY})=>areaRatio>=.0015&&areaRatio<=.0045&&widthRatio>=.018&&widthRatio<=.045&&heightRatio>=.075&&heightRatio<=.17&&centerX>=.33&&centerX<=.70&&centerY>=.15&&centerY<=.32).sort((a,b)=>a.centerX-b.centerX);resolve({bodyCount:bodies.length,tilityBodyCount:bodies.filter(({centerX})=>centerX<.70).length,beltBodyCount:bodies.filter(({centerX})=>centerX>=.70).length,iDotCount:dots.length,bodyBounds:bodies.map(({bounds})=>bounds),dotBounds:dots.map(({bounds})=>bounds)});};
        image.onerror=()=>reject(new Error("Failed to decode "+source));image.src=source;
      });
      const iconGeometry=async(sources)=>Promise.all(sources.map((source)=>new Promise((resolve,reject)=>{
        const image=new Image();
        image.onload=()=>{const canvas=document.createElement("canvas");canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const context=canvas.getContext("2d",{willReadFrequently:true});context.drawImage(image,0,0);const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;let minX=canvas.width,minY=canvas.height,maxX=-1,maxY=-1,coreMinX=canvas.width,coreMinY=canvas.height,coreMaxX=-1,coreMaxY=-1,transparentPixels=0,greenFringePixels=0,navyPixels=0,redPixels=0,mustardPixels=0;for(let y=0;y<canvas.height;y+=1){for(let x=0;x<canvas.width;x+=1){const index=(y*canvas.width+x)*4,red=pixels[index],green=pixels[index+1],blue=pixels[index+2],alpha=pixels[index+3];if(alpha===0)transparentPixels+=1;if(alpha>0){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}if(alpha>=192){coreMinX=Math.min(coreMinX,x);coreMinY=Math.min(coreMinY,y);coreMaxX=Math.max(coreMaxX,x);coreMaxY=Math.max(coreMaxY,y);}if(alpha>0&&alpha<255&&green>red+12&&green>blue+12)greenFringePixels+=1;if(alpha>128&&blue>red*1.2&&blue>green*1.08)navyPixels+=1;if(alpha>128&&red>green*1.3&&red>blue*1.8)redPixels+=1;if(alpha>128&&red>170&&green>95&&green<red*.9&&blue<110)mustardPixels+=1;}}const pixel=(x,y)=>pixels[(y*canvas.width+x)*4+3];resolve({source,width:canvas.width,height:canvas.height,bounds:[minX,minY,maxX+1,maxY+1],coreBounds:[coreMinX,coreMinY,coreMaxX+1,coreMaxY+1],corners:[pixel(0,0),pixel(canvas.width-1,0),pixel(0,canvas.height-1),pixel(canvas.width-1,canvas.height-1)],transparentPixels,greenFringePixels,navyPixels,redPixels,mustardPixels});};
        image.onerror=()=>reject(new Error("Failed to decode "+source));image.src=source;
      })));
      const analystRegistration=async(sources)=>{
        const images=await Promise.all(sources.map((source)=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve({image,source});image.onerror=()=>reject(new Error("Failed to decode "+source));image.src=source;})));
        const frames=images.map(({image,source})=>{const canvas=document.createElement("canvas");canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const context=canvas.getContext("2d",{willReadFrequently:true});context.drawImage(image,0,0);return{source,width:canvas.width,height:canvas.height,pixels:context.getImageData(0,0,canvas.width,canvas.height).data};});
        const idlePixels=frames[0].pixels,speechRegion={left:240,top:175,right:382,bottom:320};
        return{speechRegion,poses:frames.map(({source,width,height,pixels})=>{let minX=width,minY=height,maxX=-1,maxY=-1,blueToolPixels=0,hairChromaPixels=0,insideDeltaPixels=0,outsideDeltaPixels=0,alphaDeltaPixels=0;const pouchLeft=Math.floor(width*.66),pouchRight=Math.ceil(width*.84),pouchTop=Math.floor(height*.72),pouchBottom=Math.ceil(height*.95),hairBottom=Math.ceil(height*.34);for(let y=0;y<height;y+=1){for(let x=0;x<width;x+=1){const index=(y*width+x)*4,red=pixels[index],green=pixels[index+1],blue=pixels[index+2],alpha=pixels[index+3],idleAlpha=idlePixels[index+3];if(alpha>0){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}if(x>=pouchLeft&&x<pouchRight&&y>=pouchTop&&y<pouchBottom&&alpha>128&&blue>70&&blue>red*1.15&&green>red*1.05)blueToolPixels+=1;if(y<hairBottom&&alpha>8&&green>red+8&&blue>red+8)hairChromaPixels+=1;const alphaDiffers=alpha!==idleAlpha,visible=alpha>0||idleAlpha>0,differs=alphaDiffers||(visible&&(pixels[index]!==idlePixels[index]||pixels[index+1]!==idlePixels[index+1]||pixels[index+2]!==idlePixels[index+2]));if(alphaDiffers)alphaDeltaPixels+=1;if(differs){if(x>=speechRegion.left&&x<speechRegion.right&&y>=speechRegion.top&&y<speechRegion.bottom)insideDeltaPixels+=1;else outsideDeltaPixels+=1;}}}return{source,width,height,bounds:[minX,minY,maxX+1,maxY+1],blueToolPixels,hairChromaPixels,insideDeltaPixels,outsideDeltaPixels,alphaDeltaPixels};})};
      };
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
        titleLettering:await titleLettering("assets/brand/specification-studio-title.png"),
        panelTitle:await alpha("assets/brand/side-panel-title.png"),
        panelTitleLettering:await titleLettering("assets/brand/side-panel-title.png"),
        analyst:await alpha("assets/brand/technical-analyst.png"),
        analystSpeakingA:await alpha("assets/brand/technical-analyst-speaking-a.png"),
        analystSpeakingB:await alpha("assets/brand/technical-analyst-speaking-b.png"),
        icons:await iconGeometry(["assets/brand/icons/icon-16.png","assets/brand/icons/icon-32.png","assets/brand/icons/icon-48.png","assets/brand/icons/icon-128.png"]),
        analystRegistration:await analystRegistration(["assets/brand/technical-analyst.png","assets/brand/technical-analyst-speaking-a.png","assets/brand/technical-analyst-speaking-b.png"])
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
  assert.deepEqual(
    {
      bodyCount: report.titleLettering.bodyCount,
      tilityBodyCount: report.titleLettering.tilityBodyCount,
      beltBodyCount: report.titleLettering.beltBodyCount,
      iDotCount: report.titleLettering.iDotCount,
    },
    { bodyCount: 10, tilityBodyCount: 6, beltBodyCount: 4, iDotCount: 2 },
    `the raster must visibly spell TWA + t-i-l-i-t-y + Belt: ${JSON.stringify(report.titleLettering)}`,
  );
  assert.deepEqual(report.panelTitle, { transparent: true, opaque: true });
  assert.deepEqual(
    {
      bodyCount: report.panelTitleLettering.bodyCount,
      tilityBodyCount: report.panelTitleLettering.tilityBodyCount,
      beltBodyCount: report.panelTitleLettering.beltBodyCount,
      iDotCount: report.panelTitleLettering.iDotCount,
    },
    { bodyCount: 10, tilityBodyCount: 6, beltBodyCount: 4, iDotCount: 2 },
    `the panel derivative must preserve the corrected TWA + t-i-l-i-t-y + Belt pixels: ${JSON.stringify(report.panelTitleLettering)}`,
  );
  for (const [label, masterBounds, panelBounds] of [
    ["cream glyph bodies", report.titleLettering.bodyBounds, report.panelTitleLettering.bodyBounds],
    ["detached i dots", report.titleLettering.dotBounds, report.panelTitleLettering.dotBounds],
  ]) {
    assert.equal(panelBounds.length, masterBounds.length, `${label} must survive the 50% reduction`);
    panelBounds.forEach((bounds, index) => {
      bounds.forEach((coordinate, edge) => {
        assert.ok(
          Math.abs(masterBounds[index][edge] - coordinate * 2) <= 2,
          `${label} ${index} edge ${edge} must remain a half-scale copy: ${JSON.stringify({ master: masterBounds[index], panel: bounds })}`,
        );
      });
    });
  }
  assert.deepEqual(report.analyst, { transparent: true, opaque: true });
  assert.deepEqual(report.analystSpeakingA, { transparent: true, opaque: true });
  assert.deepEqual(report.analystSpeakingB, { transparent: true, opaque: true });
  assert.deepEqual(report.icons.map(({ width: iconWidth, height: iconHeight }) => [iconWidth, iconHeight]), [
    [16, 16],
    [32, 32],
    [48, 48],
    [128, 128],
  ]);
  for (const icon of report.icons) {
    const minimumCoreRatio = icon.width === 16 ? 0.85 : 0.91;
    const coreWidth = icon.coreBounds[2] - icon.coreBounds[0];
    const coreHeight = icon.coreBounds[3] - icon.coreBounds[1];
    const edgeAllowance = Math.ceil(icon.width * 0.02);
    assert.deepEqual(icon.corners, [0, 0, 0, 0], `${icon.source} must have true transparent corners`);
    assert.ok(icon.transparentPixels > 0, `${icon.source} must not restore the opaque cream canvas`);
    assert.ok(icon.bounds[0] <= edgeAllowance && icon.bounds[1] <= edgeAllowance);
    assert.ok(icon.width - icon.bounds[2] <= edgeAllowance && icon.height - icon.bounds[3] <= edgeAllowance);
    assert.ok(coreWidth / icon.width >= minimumCoreRatio, `${icon.source} core is too narrow`);
    assert.ok(coreHeight / icon.height >= minimumCoreRatio, `${icon.source} core is too short`);
    assert.ok(coreWidth / icon.width < 0.98 && coreHeight / icon.height < 0.98, `${icon.source} rounded tile is clipped`);
    assert.equal(icon.greenFringePixels, 0, `${icon.source} must remain free of chroma-key fringe`);
    assert.ok(icon.navyPixels > 0 && icon.redPixels > 0 && icon.mustardPixels > 0, `${icon.source} must retain the comic palette`);
  }
  const [idlePose, openMouthPose, closedMouthPose] = report.analystRegistration.poses;
  assert.deepEqual(
    report.analystRegistration.poses.map(({ width: poseWidth, height: poseHeight }) => [
      poseWidth,
      poseHeight,
    ]),
    [
      [587, 822],
      [587, 822],
      [587, 822],
    ],
  );
  assert.deepEqual(idlePose.bounds, [50, 13, 536, 810]);
  assert.equal(
    report.analystRegistration.poses.every(({ bounds }) =>
      bounds.every((value, index) => value === idlePose.bounds[index]),
    ),
    true,
    "all analyst states must keep the same crop and baseline",
  );
  assert.equal(
    report.analystRegistration.poses.every(({ outsideDeltaPixels }) => outsideDeltaPixels === 0),
    true,
    `analyst states may differ only inside ${JSON.stringify(report.analystRegistration.speechRegion)}`,
  );
  assert.equal(
    report.analystRegistration.poses.every(({ alphaDeltaPixels }) => alphaDeltaPixels === 0),
    true,
    "all analyst states must reuse the locked base alpha silhouette exactly",
  );
  assert.ok(openMouthPose.insideDeltaPixels >= 1_000, "the open-mouth state must remain visibly distinct");
  assert.equal(closedMouthPose.insideDeltaPixels, 0, "the closed-mouth state must use the locked base");
  assert.equal(
    report.analystRegistration.poses.every(({ blueToolPixels }) => blueToolPixels >= 32),
    true,
    "every analyst state must retain the pocket-side blue technical tools",
  );
  assert.equal(
    report.analystRegistration.poses.every(
      ({ hairChromaPixels }) => hairChromaPixels <= idlePose.hairChromaPixels,
    ),
    true,
    "speaking states must not introduce cyan/green hair-edge pixels beyond the locked base",
  );
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
