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
    userGesture: true,
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

async function waitForProjects(socket, name = "Retail website") {
  for (let attempt = 0; attempt < 240; attempt += 1) {
    const ready = await evaluate(
      socket,
      `document.readyState==="complete" &&
        document.querySelector("#active-project-card")?.textContent.includes(${JSON.stringify(name)}) &&
        document.querySelectorAll("#project-library-list > li").length===3`,
    );
    if (ready) return;
    await wait(25);
  }
  throw new Error(`Projects did not finish rendering ${name}`);
}

async function capture(socket, destination) {
  const screenshot = await socket.call("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  await writeFile(destination, Buffer.from(screenshot.data, "base64"));
}

const profile = await mkdtemp(path.join(os.tmpdir(), "twatility-projects-"));
const extensionRoot = path.resolve("dist");
const chromeArguments = headlessChromeArguments(profile, extensionRoot);
chromeArguments.splice(-1, 0, `--load-extension=${extensionRoot}`);
const chrome = spawn(resolveChromeExecutable(), chromeArguments, {
  stdio: ["ignore", "ignore", "pipe"],
});
const evidenceDirectory = path.resolve(
  process.env.BRAND_EVIDENCE_DIR ??
    "docs/twatility-branding-evidence/slice-3-projects",
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

  const seeded = await evaluate(
    side,
    `(async()=>{
      const {createSpecificationProject}=await import("./data-layer-specification-project.js");
      const {openIndexedDbProjectRepository}=await import("./data-layer-durable-project-repository.js");
      const repository=await openIndexedDbProjectRepository();
      const pause=()=>new Promise((resolve)=>setTimeout(resolve,20));
      const make=(projectId,name,site,owner,publishedRevision)=>{
        let sequence=0;
        const id=(kind)=>kind==="project"?projectId:kind+":"+projectId+":"+(++sequence);
        const state=createSpecificationProject({name,description:name+" purpose",site,id});
        state.project.owner=owner;
        state.project.notes=name+" notes";
        if(publishedRevision){
          const release={id:"release:"+projectId+":"+publishedRevision,name:"Release "+publishedRevision,revision:publishedRevision,createdAt:"2026-07-20T10:00:00.000Z",snapshot:structuredClone(state.project.collections)};
          state.project.releases=[release];
          state.project.currentRelease=release.id;
        }
        state.draft={id:"draft:"+projectId,status:"Saved",updatedAt:"2026-07-26T12:00:00.000Z"};
        return state;
      };
      const retail=make("project-retail","Retail website","retail.example.com","Retail analytics",3);
      const trade=make("project-trade","Trade portal","trade.example.com","Trade delivery",1);
      const agency=make("project-agency","Agency platform","agency.example.com","Delivery team",0);
      await repository.putProjectMetadataOnly(retail,{active:true,draftToken:"draft-retail-14",draftSequence:14,publishedRevision:3});
      await pause();
      await repository.putProjectMetadataOnly(trade,{active:false,draftToken:"draft-trade-7",draftSequence:7,publishedRevision:1});
      await pause();
      await repository.putProjectMetadataOnly(agency,{active:false,draftToken:"draft-agency-2",draftSequence:2,publishedRevision:0});
      return (await repository.listProjectMetadata()).length===3 && await repository.activeProjectId()==="project-retail";
    })()`,
  );
  assert.equal(seeded, true, "three durable projects must seed");
  await side.call("Page.reload", { ignoreCache: true });
  await waitForProjects(side);
  await evaluate(
    side,
    `document.getElementById("data-layer-view-projects").click()`,
  );

  const interactionReport = await evaluate(
    side,
    `(async()=>{
      const pause=()=>new Promise((resolve)=>setTimeout(resolve,45));
      const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
      const buttons=(root=document)=>[...root.querySelectorAll("button")];
      const click=(text,root=document)=>{const control=buttons(root).find(({textContent})=>textContent.trim()===text);if(!control)throw new Error("Missing "+text);control.click();return control;};
      const input=q("#project-library-search"),sort=q("#project-library-sort"),list=q("#project-library-list");
      const names=()=>[...list.children].map((row)=>row.textContent.split(" · ")[0].trim());
      input.value="Trade portal";input.dispatchEvent(new Event("input",{bubbles:true}));await pause();
      const filtered=names();
      input.value="";input.dispatchEvent(new Event("input",{bubbles:true}));await pause();
      sort.value="name";sort.dispatchEvent(new Event("change",{bubbles:true}));await pause();const nameOrder=names();
      sort.value="last-saved";sort.dispatchEvent(new Event("change",{bubbles:true}));await pause();const savedOrder=names();
      sort.value="name";sort.dispatchEvent(new Event("change",{bubbles:true}));await pause();
      const rows=[...list.children],namedActions=rows.every((row)=>{const project=row.textContent.split(" · ")[0].trim();return buttons(row).every((control)=>control.getAttribute("aria-label")?.includes(project));});
      const trade=rows.find(({textContent})=>textContent.includes("Trade portal")),switchButton=buttons(trade).find(({textContent})=>textContent.trim()==="Switch");
      switchButton.focus();switchButton.click();await pause();let dialog=q("dialog[open]"),switchReview={heading:dialog.textContent.includes("Review switch to Trade portal"),impact:dialog.textContent.includes("replace context atomically"),focus:document.activeElement===dialog.querySelector("h4"),confirm:buttons(dialog).some(({textContent})=>textContent.trim()==="Switch to Trade portal"),cancel:buttons(dialog).some(({textContent})=>textContent.trim()==="Cancel switch")};click("Cancel switch",dialog);await pause();const currentTrade=[...list.children].find(({textContent})=>textContent.includes("Trade portal")),currentSwitch=buttons(currentTrade).find(({textContent})=>textContent.trim()==="Switch");switchReview.returnFocus=document.activeElement===currentSwitch&&currentSwitch.isConnected;
      const createTrigger=click("Create project",q("#data-layer-panel-projects"));await pause();dialog=q("dialog[open]");const createFields=["name","purpose","website","owner","notes"].every((name)=>dialog.querySelector('[name="'+name+'"]'));const createReview=buttons(dialog).some(({textContent})=>textContent.trim()==="Review create project")&&buttons(dialog).some(({textContent})=>textContent.trim()==="Confirm create project");click("Close",dialog);await pause();const createReturnFocus=document.activeElement===createTrigger;
      const repository=await (await import("./data-layer-durable-project-repository.js")).openIndexedDbProjectRepository(),bundle=await repository.exportProject("project-retail"),file=new File([JSON.stringify(bundle)],"retail-project.json",{type:"application/json"}),transfer=new DataTransfer();transfer.items.add(file),importTrigger=q("#import-library-project");importTrigger.focus();const fileControl=q("#import-library-project-file");Object.defineProperty(fileControl,"files",{value:transfer.files,configurable:true});fileControl.dispatchEvent(new Event("change",{bubbles:true}));for(let attempt=0;attempt<80&&!document.querySelector("dialog[open]");attempt+=1)await pause();dialog=q("dialog[open]");const importReview=["Format version 2","reference integrity valid","Import as new project"].every((text)=>dialog.textContent.includes(text));click("Close import review",dialog);await pause();const importReturnFocus=document.activeElement===importTrigger;
      const projectPanel=q("#data-layer-panel-projects"),logoFree=projectPanel.querySelectorAll("img,svg").length===0&&[...projectPanel.querySelectorAll("*")].every((element)=>!getComputedStyle(element).backgroundImage.includes("url("));
      return{filtered,nameOrder,savedOrder,namedActions,switchReview,createFields,createReview,createReturnFocus,importReview,importReturnFocus,logoFree};
    })()`,
  );
  assert.deepEqual(interactionReport.filtered, ["Trade portal"]);
  assert.deepEqual(interactionReport.nameOrder, [
    "Agency platform",
    "Retail website",
    "Trade portal",
  ]);
  assert.deepEqual(interactionReport.savedOrder, [
    "Agency platform",
    "Trade portal",
    "Retail website",
  ]);
  assert.equal(interactionReport.namedActions, true);
  assert.deepEqual(interactionReport.switchReview, {
    heading: true,
    impact: true,
    focus: true,
    confirm: true,
    cancel: true,
    returnFocus: true,
  });
  assert.equal(interactionReport.createFields, true);
  assert.equal(interactionReport.createReview, true);
  assert.equal(interactionReport.createReturnFocus, true);
  assert.equal(interactionReport.importReview, true);
  assert.equal(interactionReport.importReturnFocus, true);
  assert.equal(interactionReport.logoFree, true);

  const metadataReport = await evaluate(
    side,
    `(async()=>{
      const pause=()=>new Promise((resolve)=>setTimeout(resolve,45));
      const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
      const click=(text,root=document)=>{const control=[...root.querySelectorAll("button")].find(({textContent})=>textContent.trim()===text);if(!control)throw new Error("Missing "+text);control.click();return control;};
      const repository=await (await import("./data-layer-durable-project-repository.js")).openIndexedDbProjectRepository(),before=await repository.loadProject("project-retail");click("Edit details",q("#active-project-card"));for(let attempt=0;attempt<80&&!document.querySelector("dialog[open]");attempt+=1)await pause();const dialog=q("dialog[open]"),notes=q('[name="notes"]',dialog);notes.value="Updated by Slice 3 evidence";notes.dispatchEvent(new Event("input",{bubbles:true}));click("Save project details",dialog);let edited;for(let attempt=0;attempt<160;attempt+=1){edited=await repository.loadProject("project-retail");if(edited.state.project.notes==="Updated by Slice 3 evidence")break;await pause();}const save=edited.state.project.notes==="Updated by Slice 3 evidence"&&edited.state.project.id===before.state.project.id&&edited.publishedRevision===before.publishedRevision;click("Undo metadata edit",dialog);let restored;for(let attempt=0;attempt<160;attempt+=1){restored=await repository.loadProject("project-retail");if(restored.state.project.notes===before.state.project.notes)break;await pause();}const undo=restored.state.project.notes===before.state.project.notes&&restored.state.project.id===before.state.project.id&&restored.publishedRevision===before.publishedRevision;click("Close",dialog);await pause();return{save,undo,returnFocus:document.activeElement?.isConnected===true&&document.activeElement?.textContent==="Edit details"};
    })()`,
  );
  assert.deepEqual(metadataReport, {
    save: true,
    undo: true,
    returnFocus: true,
  });

  await evaluate(
    side,
    `(async()=>{
      const database=await new Promise((resolve,reject)=>{const request=indexedDB.open("my-chrome-utilities.project-repository");request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
      const transaction=database.transaction("projectMetadata","readwrite"),store=transaction.objectStore("projectMetadata"),request=(method,...input)=>new Promise((resolve,reject)=>{const operation=store[method](...input);operation.onsuccess=()=>resolve(operation.result);operation.onerror=()=>reject(operation.error);});
      for(const [projectId,lastSavedAt] of [["project-retail","2026-07-26T12:00:00.000Z"],["project-trade","2026-07-26T11:00:00.000Z"],["project-agency","2026-07-26T10:00:00.000Z"]]){const metadata=await request("get",projectId);metadata.lastSavedAt=lastSavedAt;await request("put",metadata,projectId);}
      await new Promise((resolve,reject)=>{transaction.oncomplete=()=>resolve();transaction.onerror=()=>reject(transaction.error);transaction.onabort=()=>reject(transaction.error);});
      location.reload();
      return true;
    })()`,
  );
  await waitForProjects(side);
  await evaluate(
    side,
    `document.getElementById("data-layer-view-projects").click()`,
  );

  const viewports = [
    { width: 360, height: 760 },
    { width: 420, height: 900 },
    { width: 512, height: 900 },
  ];
  const reports = [];
  for (const viewport of viewports) {
    await side.call("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await wait(50);
    const report = await evaluate(
      side,
      `(()=>{
        const references=["aria-controls","aria-labelledby","aria-describedby","aria-errormessage"];
        const visible=(element)=>{const style=getComputedStyle(element),box=element.getBoundingClientRect();return !element.hidden&&style.display!=="none"&&style.visibility!=="hidden"&&box.width>0&&box.height>0;};
        const name=(element)=>element.getAttribute("aria-label")||element.getAttribute("aria-labelledby")||element.labels?.[0]?.textContent?.trim()||element.textContent?.trim()||element.getAttribute("title")||element.getAttribute("placeholder")||element.value||"";
        const signature=()=>[...document.querySelectorAll("button,input,select,textarea,a[href],[role=tab],[role=dialog]")].map((element)=>({tag:element.tagName,id:element.id,type:element.getAttribute("type"),role:element.getAttribute("role"),hidden:element.hidden,disabled:Boolean(element.disabled),aria:references.map((attribute)=>[attribute,element.getAttribute(attribute)])}));
        const before=signature(),branded=[...document.styleSheets].filter((sheet)=>/twatility-brand|side-panel-brand/.test(sheet.href||""));branded.forEach((sheet)=>{sheet.disabled=true;});const after=signature();branded.forEach((sheet)=>{sheet.disabled=false;});
        const panel=document.getElementById("data-layer-panel-projects"),workspace=document.getElementById("workspace-panel-data-layer"),rows=[...document.querySelectorAll("#project-library-list > li")];
        workspace.scrollTop=0;
        return{
          width:innerWidth,
          height:innerHeight,
          active:document.getElementById("active-project-card").textContent,
          projects:rows.length,
          named:rows.every((row)=>[...row.querySelectorAll("button")].every((button)=>Boolean(button.getAttribute("aria-label")))),
          unnamed:[...document.querySelectorAll("button,input,select,textarea,a[href],[role=tab]")].filter(visible).filter((element)=>!name(element)).map((element)=>element.id||element.outerHTML.slice(0,80)),
          broken:[...document.querySelectorAll("*")].flatMap((element)=>references.flatMap((attribute)=>{const value=element.getAttribute(attribute);return value?value.split(/\\s+/).filter((id)=>!document.getElementById(id)).map((id)=>({owner:element.id,attribute,id})):[];})),
          equivalent:JSON.stringify(before)===JSON.stringify(after),
          overflow:{document:document.documentElement.scrollWidth-document.documentElement.clientWidth,body:document.body.scrollWidth-document.body.clientWidth,workspace:workspace.scrollWidth-workspace.clientWidth,panel:panel.scrollWidth-panel.clientWidth},
          oneScrollOwner:workspace.scrollHeight>workspace.clientHeight&&panel.scrollHeight<=panel.clientHeight+1,
          logoFree:panel.querySelectorAll("img,svg").length===0
        };
      })()`,
    );
    assert.equal(report.projects, 3);
    assert.equal(report.named, true);
    assert.deepEqual(report.unnamed, []);
    assert.deepEqual(report.broken, []);
    assert.equal(report.equivalent, true);
    assert.deepEqual(report.overflow, {
      document: 0,
      body: 0,
      workspace: 0,
      panel: 0,
    });
    assert.equal(report.oneScrollOwner, true);
    assert.equal(report.logoFree, true);
    await capture(
      side,
      path.join(
        evidenceDirectory,
        `projects-ready-${viewport.width}x${viewport.height}.png`,
      ),
    );
    reports.push({ viewport, report });
  }

  await side.call("Emulation.setDeviceMetricsOverride", {
    width: 360,
    height: 760,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const recovery = await evaluate(
    side,
    `(async()=>{
      const pause=()=>new Promise((resolve)=>setTimeout(resolve,35)),trigger=document.getElementById("open-storage-recovery");trigger.focus();trigger.click();const dialog=document.getElementById("durable-storage-recovery"),scroll=dialog.querySelector(".durable-recovery-scroll"),labels=["Retry save","Reject unsaved command","Export unsaved Draft","Export repository backup","Open storage diagnostics","Review deleting retained migration backup","Close"];for(let attempt=0;attempt<120&&!dialog.open;attempt+=1)await pause();return{open:dialog.open,controls:labels.every((text)=>[...dialog.querySelectorAll("button")].some((button)=>button.textContent.trim()===text)),heading:document.activeElement?.id==="durable-storage-recovery-title",oneScrollOwner:getComputedStyle(scroll).overflowY==="auto"&&getComputedStyle(dialog).overflowY!=="auto",overflow:dialog.scrollWidth<=innerWidth&&scroll.scrollWidth<=scroll.clientWidth+1};})()`,
  );
  assert.deepEqual(recovery, {
    open: true,
    controls: true,
    heading: true,
    oneScrollOwner: true,
    overflow: true,
  });
  await capture(
    side,
    path.join(evidenceDirectory, "projects-recovery-360x760.png"),
  );
  await evaluate(
    side,
    `document.getElementById("close-storage-recovery").click()`,
  );
  await wait(25);
  assert.equal(
    await evaluate(side, `document.activeElement?.id`),
    "open-storage-recovery",
  );

  const badEvents = side.events.filter(
    ({ method, params }) =>
      method === "Runtime.exceptionThrown" ||
      method === "Network.loadingFailed" ||
      (method === "Log.entryAdded" &&
        ["error", "warning"].includes(params.entry?.level)),
  );
  assert.deepEqual(
    badEvents,
    [],
    "installed Projects workflow must have no runtime or load errors",
  );
  await writeFile(
    path.join(evidenceDirectory, "report.json"),
    `${JSON.stringify(
      { interactionReport, metadataReport, viewports: reports, recovery },
      null,
      2,
    )}\n`,
  );
} finally {
  side?.close();
  await stopHeadlessChrome(chrome, 1500);
  await rm(profile, { recursive: true, force: true });
}

console.log("TWAtility Belt packaged Projects browser test passed");
