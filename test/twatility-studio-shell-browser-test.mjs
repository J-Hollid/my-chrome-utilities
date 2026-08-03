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

async function ready(socket, expression) {
  for (let attempt = 0; attempt < 240; attempt += 1) {
    if (await evaluate(socket, expression)) return;
    await wait(25);
  }
  throw new Error(`Installed Studio did not become ready: ${expression}`);
}

async function viewport(socket, width, height, url) {
  await socket.call("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await socket.call("Page.navigate", { url });
  await ready(
    socket,
    "document.readyState==='complete'&&!document.querySelector('#project-workspace').hidden&&document.querySelector('#project-context').textContent.includes('Retail measurement workspace')",
  );
  await wait(80);
}

async function screenshot(socket, target) {
  const capture = await socket.call("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  await writeFile(target, Buffer.from(capture.data, "base64"));
}

const profile = await mkdtemp(path.join(os.tmpdir(), "twatility-studio-shell-"));
const extensionRoot = path.resolve("dist");
const chromeArguments = headlessChromeArguments(profile, extensionRoot);
chromeArguments.splice(-1, 0, `--load-extension=${extensionRoot}`);
const chrome = spawn(resolveChromeExecutable(), chromeArguments, {
  stdio: ["ignore", "ignore", "pipe"],
});
const evidenceDirectory = path.resolve(
  process.env.BRAND_EVIDENCE_DIR ??
    "docs/twatility-branding-evidence/slice-4-studio-shell",
);
await mkdir(evidenceDirectory, { recursive: true });
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
  studio = await pageSocket(
    port,
    `${base}specification-builder.html?project=project-studio&route=overview`,
  );
  await ready(studio, "document.readyState==='complete'");
  const seeded = await evaluate(
    studio,
    `(async()=>{
      const {createSpecificationProject}=await import("./data-layer-specification-project.js");
      const {createProjectCollectionEntity}=await import("./data-layer-project-entity-lifecycle.js");
      const {openIndexedDbProjectRepository}=await import("./data-layer-durable-project-repository.js");
      let sequence=0;
      const makeId=(kind)=>kind==="project"?"project-studio":kind+":studio:"+sequence++;
      let state=createSpecificationProject({
        name:"Retail measurement workspace",
        description:"Measurement contracts for retail and trade journeys.",
        site:"a-very-long-retail-measurement-domain.example.com",
        id:makeId,
      });
      state.project.owner="Measurement engineering";
      state.project.notes="Production-backed Slice 4 fixture with deliberately long identifiers.";
      for(const [kind,name,fields] of [
        ["profiles","Commerce foundation",{}],
        ["propertySets","Checkout customers",{}],
        ["pages","Checkout confirmation",{eventName:"pageview"}],
        ["pages","Account overview",{eventName:"pageview"}],
        ["events","Purchase completed",{eventName:"purchase"}],
        ["applicabilitySets","Retail customers",{}],
        ["flows","Checkout journey",{}],
        ["fixtures","Valid checkout",{}],
      ]) state=createProjectCollectionEntity(state,kind,name,makeId,fields);
      const flow=state.project.collections.flows[0],page=state.project.collections.pages[0],event=state.project.collections.events[0],propertySet=state.project.collections.propertySets[0],applicabilitySet=state.project.collections.applicabilitySets[0];
      page.propertySetApplications=[{id:makeId("property-set-application"),propertySetId:propertySet.id,applicabilitySetId:applicabilitySet.id}];
      state=createProjectCollectionEntity(state,"assignments","Purchase payload",makeId,{
        targetKind:"Shared Profile",
        targetId:state.project.collections.profiles[0].id,
        eventId:event.id,
        applicabilitySetId:state.project.collections.applicabilitySets[0].id,
      });
      state.project.documentationFlowGraphs={
        [flow.id]:{
          sections:[],
          pageFrames:[{id:"frame:studio:checkout",name:page.name,pageId:page.id,position:{x:140,y:90}}],
          occurrences:[{id:"occurrence:studio:purchase",name:event.name,pageFrameId:"frame:studio:checkout",pageId:page.id,eventId:event.id,role:"interaction",obligation:"Required",minimum:1,maximum:1,optional:false,position:{x:220,y:150}}],
          relationships:[],
        },
      };
      const release={
        id:"release:studio:3",
        name:"Release 3",
        revision:3,
        createdAt:"2026-07-26T12:00:00.000Z",
        snapshot:structuredClone(state.project.collections),
      };
      state.project.releases=[release];
      state.project.currentRelease=release.id;
      state.draft={id:"draft:studio",status:"Saved",updatedAt:"2026-07-26T12:00:00.000Z"};
      const repository=await openIndexedDbProjectRepository();
      await repository.putProjectMetadataOnly(state,{
        active:true,
        draftToken:"draft-studio-12",
        draftSequence:12,
        publishedRevision:3,
        navigation:{kind:"pages"},
      });
      return (await repository.activeProjectId())==="project-studio";
    })()`,
  );
  assert.equal(seeded, true);

  const overviewUrl = `${base}specification-builder.html?project=project-studio&route=overview`;
  await viewport(studio, 1280, 900, overviewUrl);
  const initialProject = await evaluate(
    studio,
    `(async()=>{const record=await (await (await import("./data-layer-durable-project-repository.js")).openIndexedDbProjectRepository()).loadProject("project-studio");return JSON.stringify({state:record.state,draftToken:record.draftToken,draftSequence:record.draftSequence,publishedRevision:record.publishedRevision});})()`,
  );
  const initial = await evaluate(
    studio,
    `(()=>{
      const tree=[...document.querySelectorAll("#project-tree button")];
      const labels=tree.map(({textContent})=>textContent.trim().replace(/ \\(\\d+\\)$/,""));
      const expected=["Documentation","Project overview","Shared Profiles","Pages","Property Sets","Events","Applicability","Flows","Test cases","Assignments","Releases"];
      const toggle=document.querySelector("#toggle-project-inspector"),inspector=document.querySelector("#project-inspector");
      const actions=[...document.querySelectorAll(".sticky-tools .actions button")].map(({textContent})=>textContent.trim());
      return{
        tree:JSON.stringify(labels)===JSON.stringify(expected),
        overview:tree[1]?.getAttribute("aria-current")==="true"&&document.querySelector("#workspace-content h1")?.textContent==="Project overview",
        noSchemas:!tree.some(({dataset})=>dataset.kind==="schemaDrafts"||dataset.kind==="schemas"),
        collapsed:inspector.hidden&&toggle.textContent==="Show Inspector"&&toggle.getAttribute("aria-expanded")==="false"&&document.querySelector("#project-workspace").dataset.inspectorOpen==="false",
        context:document.querySelector("#project-context").textContent.includes("project-studio")&&document.querySelector("#project-state").textContent.includes("Saved Draft")&&document.querySelector("#project-state").textContent.includes("Published revision 3"),
        actions:["Run preflight","Coverage matrix","Publish release","Undo","Redo","Full-fidelity Specification Project","Standard JSON Schema + manifest","Import project"].every((name)=>actions.includes(name)),
        noObsolete:!document.body.textContent.includes("Generate documentation"),
      };
    })()`,
  );
  assert.deepEqual(initial, {
    tree: true,
    overview: true,
    noSchemas: true,
    collapsed: true,
    context: true,
    actions: true,
    noObsolete: true,
  });

  const routes = await evaluate(
    studio,
    `(async()=>{
      const pause=()=>new Promise((resolve)=>setTimeout(resolve,70));
      const clickKind=async(kind)=>{document.querySelector('#project-tree button[data-kind="'+kind+'"]').click();await pause();};
      await clickKind("documentation");
      const documentation=new URLSearchParams(location.search).get("view")==="documentation"&&document.querySelector('#project-tree button[data-kind="documentation"]').getAttribute("aria-current")==="true"&&document.querySelector("#project-breadcrumb").textContent.includes("Documentation");
      await clickKind("pages");
      const pageRoute=new URLSearchParams(location.search),content=document.querySelector("#workspace-content");
      const pages=!pageRoute.has("view")&&pageRoute.get("kind")==="pages"&&content.querySelector("[data-add-kind=pages]")&&[...content.querySelectorAll(".entity-row")].every((row)=>[...row.querySelectorAll("button")].some(({ariaLabel})=>ariaLabel?.startsWith("Open "))&&[...row.querySelectorAll("button")].some(({ariaLabel})=>ariaLabel?.startsWith("Remove ")));
      document.querySelector('#project-tree button[data-kind="overview"]').click();await pause();
      const overview=new URLSearchParams(location.search).get("route")==="overview"&&document.activeElement===document.querySelector("#workspace-content h1")&&document.querySelector("#project-breadcrumb").textContent.includes("Project overview");
      const toggle=document.querySelector("#toggle-project-inspector");toggle.click();await pause();
      const opened=!document.querySelector("#project-inspector").hidden&&toggle.getAttribute("aria-expanded")==="true"&&document.querySelector("#project-workspace").dataset.inspectorOpen==="true";
      await clickKind("pages");
      const choice=!document.querySelector("#project-inspector").hidden&&toggle.getAttribute("aria-expanded")==="true";
      const search=document.querySelector("#project-search");search.value="Checkout";search.dispatchEvent(new Event("input",{bubbles:true}));await pause();
      const searched=content.querySelector("h1")?.textContent==="Global search"&&content.textContent.includes("Checkout confirmation")&&content.textContent.includes("Checkout customers");
      return{documentation,pages:Boolean(pages),overview,opened,choice,searched};
    })()`,
  );
  assert.deepEqual(routes, {
    documentation: true,
    pages: true,
    overview: true,
    opened: true,
    choice: true,
    searched: true,
  });

  await evaluate(
    studio,
    `(()=>{document.querySelector("#project-search").value="";document.querySelector("#project-search").dispatchEvent(new Event("input",{bubbles:true}));document.querySelector('#project-tree button[data-kind="overview"]').click();document.querySelector(".actions details").open=true;return true;})()`,
  );
  await wait(50);
  await screenshot(
    studio,
    path.join(evidenceDirectory, "studio-overview-1280x900.png"),
  );

  const inspect = async (width, height) =>
    evaluate(
      studio,
      `(()=>{
        const visible=(element)=>{const style=getComputedStyle(element),box=element.getBoundingClientRect();return !element.hidden&&style.display!=="none"&&style.visibility!=="hidden"&&box.width>0&&box.height>0;};
        const name=(element)=>element.getAttribute("aria-label")||element.getAttribute("aria-labelledby")||element.labels?.[0]?.textContent?.trim()||element.textContent?.trim()||element.getAttribute("title")||element.getAttribute("placeholder")||element.value||"";
        const references=["aria-controls","aria-labelledby","aria-describedby","aria-errormessage"];
        const panes=["#project-workspace > nav","#workspace-pane","#project-inspector"].map((selector)=>{const element=document.querySelector(selector),box=element.getBoundingClientRect();return{selector,hidden:element.hidden,display:getComputedStyle(element).display,left:box.left,right:box.right,top:box.top,bottom:box.bottom,overflowY:getComputedStyle(element).overflowY};});
        const header=document.querySelector(".project-bar"),headerBox=header.getBoundingClientRect(),brand=document.querySelector(".twatility-studio-brand"),brandBox=brand.getBoundingClientRect(),wordmark=document.querySelector(".twatility-studio-wordmark"),wordmarkBox=wordmark.getBoundingClientRect(),titleImage=wordmark.querySelector("img"),imageBox=titleImage.getBoundingClientRect(),surface=document.querySelector(".twatility-studio-surface-lockup"),surfaceBox=surface.getBoundingClientRect(),surfaceTitle=document.querySelector(".twatility-studio-surface-title"),stars=[...document.querySelectorAll(".twatility-studio-star")],context=document.querySelector("#project-context"),contextBox=context.getBoundingClientRect();
        const contained=(box,parent)=>box.left>=parent.left-.5&&box.right<=parent.right+.5&&box.top>=parent.top-.5&&box.bottom<=parent.bottom+.5;
        const disjoint=(a,b)=>a.right<=b.left+.5||b.right<=a.left+.5||a.bottom<=b.top+.5||b.bottom<=a.top+.5;
        const signature=()=>[...document.querySelectorAll("button,input,select,textarea,a[href],summary")].map((element)=>({tag:element.tagName,id:element.id,type:element.getAttribute("type"),role:element.getAttribute("role"),text:element.textContent.trim(),hidden:element.hidden,disabled:Boolean(element.disabled),aria:references.map((attribute)=>[attribute,element.getAttribute(attribute)])}));
        const before=signature(),branding=[...document.styleSheets].filter((sheet)=>/(?:twatility-brand|specification-builder-brand)\\.css/.test(sheet.href||""));
        branding.forEach((sheet)=>{sheet.disabled=true;});const after=signature();branding.forEach((sheet)=>{sheet.disabled=false;});
        return{
          width:${width},height:${height},
          overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)>innerWidth,
          unnamed:[...document.querySelectorAll("button,input,select,textarea,a[href],summary")].filter(visible).filter((element)=>!name(element)).map((element)=>element.id||element.outerHTML.slice(0,80)),
          broken:[...document.querySelectorAll("*")].flatMap((element)=>references.flatMap((attribute)=>{const value=element.getAttribute(attribute);return value?value.split(/\\s+/).filter((id)=>!document.getElementById(id)).map((id)=>({owner:element.id,attribute,id})):[];})),
          equivalent:JSON.stringify(before)===JSON.stringify(after),
          panes,
          treeVisible:visible(document.querySelector("#project-workspace > nav")),
          inspectorVisible:visible(document.querySelector("#project-inspector")),
          scrollOwner:document.scrollingElement.scrollHeight>document.scrollingElement.clientHeight,
          fictional:[...document.querySelectorAll("img")].filter(({alt})=>/retail|trade|project logo/i.test(alt)).length,
          title:{decoded:titleImage.complete&&titleImage.naturalWidth===1600&&titleImage.naturalHeight===360,broad:titleImage.naturalWidth/titleImage.naturalHeight>=4.3&&titleImage.naturalWidth/titleImage.naturalHeight<=4.6,aspectPreserved:Math.abs(imageBox.width/imageBox.height-titleImage.naturalWidth/titleImage.naturalHeight)<.02,unscaled:getComputedStyle(titleImage).transform==="none"&&getComputedStyle(surfaceTitle).transform==="none",midViewportWidth:${width}!==920||imageBox.width>=250,source:new URL(titleImage.currentSrc||titleImage.src).pathname.endsWith("/assets/brand/specification-studio-title.png"),contained:[brandBox,wordmarkBox,surfaceBox,contextBox].every((box)=>contained(box,headerBox)),accessible:titleImage.alt==="TWAtility Belt"&&surfaceTitle.textContent.trim()==="Specification Studio"&&visible(surfaceTitle)&&surfaceTitle.getAttribute("aria-hidden")===null&&!surface.closest('[aria-hidden="true"]'),ticket:getComputedStyle(surfaceTitle).whiteSpace==="nowrap"&&getComputedStyle(surfaceTitle).textTransform==="uppercase"&&surfaceTitle.scrollWidth<=surfaceTitle.clientWidth+1,stars:stars.length===2&&stars.every((star)=>star.getAttribute("aria-hidden")==="true"),separated:disjoint(wordmarkBox,surfaceBox)&&disjoint(brandBox,contextBox),sideBySide:${width}!==920||(surfaceBox.left>=wordmarkBox.right+4&&surfaceBox.left-wordmarkBox.right<=32&&Math.abs((surfaceBox.top+surfaceBox.bottom-wordmarkBox.top-wordmarkBox.bottom)/2)<=10),context:visible(context)},
        };
      })()`,
    );

  await viewport(
    studio,
    1440,
    900,
    `${base}specification-builder.html?project=project-studio&kind=pages`,
  );
  const report1440 = await inspect(1440, 900);
  assert.equal(
    await evaluate(
      studio,
      `document.querySelector("#project-inspector").hidden&&document.querySelector('#project-tree button[data-kind="pages"]').getAttribute("aria-current")==="true"`,
    ),
    true,
  );
  await screenshot(
    studio,
    path.join(evidenceDirectory, "studio-pages-1440x900.png"),
  );

  await viewport(
    studio,
    920,
    640,
    `${base}specification-builder.html?project=project-studio&kind=pages`,
  );
  const report920 = await inspect(920, 640);
  await screenshot(
    studio,
    path.join(evidenceDirectory, "studio-pages-920x640.png"),
  );

  await viewport(
    studio,
    1720,
    960,
    `${base}specification-builder.html?project=project-studio&kind=flows`,
  );
  await evaluate(
    studio,
    `[...document.querySelectorAll("#workspace-content button")].find(({ariaLabel})=>ariaLabel==="Open Checkout journey").click()`,
  );
  await ready(studio, "Boolean(document.querySelector('#flow-graph-workspace'))");
  const report1720 = await inspect(1720, 960);
  assert.equal(
    await evaluate(
      studio,
      `Boolean(!document.querySelector("#project-inspector").hidden&&document.querySelector("#toggle-project-inspector").getAttribute("aria-expanded")==="true"&&document.querySelector("#flow-graph-workspace"))`,
    ),
    true,
  );
  await screenshot(
    studio,
    path.join(evidenceDirectory, "studio-flow-1720x960.png"),
  );

  await viewport(
    studio,
    360,
    800,
    `${base}specification-builder.html?project=project-studio&kind=pages`,
  );
  await evaluate(studio, "scrollTo(0,0);true");
  await screenshot(
    studio,
    path.join(evidenceDirectory, "studio-masthead-360x800.png"),
  );
  const openedNarrow = await evaluate(
    studio,
    `(()=>{const toggle=document.querySelector("#toggle-project-inspector");toggle.focus();toggle.click();return document.activeElement===toggle&&!document.querySelector("#project-inspector").hidden;})()`,
  );
  assert.equal(openedNarrow, true);
  const report360 = await inspect(360, 800);
  await screenshot(
    studio,
    path.join(evidenceDirectory, "studio-narrow-360x800.png"),
  );

  await viewport(
    studio,
    640,
    450,
    `${base}specification-builder.html?project=project-studio&route=overview`,
  );
  const report200 = await inspect(640, 450);

  for (const report of [report1440, report920, report1720, report360, report200]) {
    assert.equal(report.overflow, false, `${report.width}px page overflow`);
    assert.deepEqual(report.unnamed, [], `${report.width}px accessible names`);
    assert.deepEqual(report.broken, [], `${report.width}px ARIA references`);
    assert.equal(report.equivalent, true, `${report.width}px control equivalence`);
    assert.equal(report.treeVisible, true, `${report.width}px project tree`);
    assert.equal(report.fictional, 0, `${report.width}px fictional project logos`);
    assert.deepEqual(report.title,{decoded:true,broad:true,aspectPreserved:true,unscaled:true,midViewportWidth:true,source:true,contained:true,accessible:true,ticket:true,stars:true,separated:true,sideBySide:true,context:true},`${report.width}px generated Studio masthead`);
    assert.ok(
      report.panes
        .filter(({ hidden, display }) => !hidden && display !== "none")
        .every(({ left, right }) => left >= -0.5 && right <= report.width + 0.5),
      `${report.width}px panes remain in the viewport`,
    );
  }
  assert.equal(report1720.inspectorVisible, true);
  assert.equal(report360.inspectorVisible, true);
  assert.equal(report360.scrollOwner, true);

  const finalProject = await evaluate(
    studio,
    `(async()=>{const record=await (await (await import("./data-layer-durable-project-repository.js")).openIndexedDbProjectRepository()).loadProject("project-studio");return JSON.stringify({state:record.state,draftToken:record.draftToken,draftSequence:record.draftSequence,publishedRevision:record.publishedRevision});})()`,
  );
  assert.equal(
    finalProject,
    initialProject,
    "navigation, viewport changes, and screenshots must not mutate the project",
  );

  const runtimeErrors = studio.events.filter(
    ({ method, params }) =>
      method === "Runtime.exceptionThrown" ||
      (method === "Log.entryAdded" && params.entry.level === "error") ||
      (method === "Network.loadingFailed" && !params.canceled),
  );
  assert.deepEqual(runtimeErrors, [], "packaged Studio runtime/load errors");

  const report = {
    integration: {
      projectId: "project-studio",
      publishedRevision: 3,
      projectBodyStable: finalProject === initialProject,
      treeOrder:
        "Documentation, Project overview, eight collections, Releases",
      initialInspector: "collapsed below 1600 CSS pixels",
    },
    routes,
    viewports: [report1440, report920, report1720, report360, report200],
    runtimeErrors: runtimeErrors.length,
  };
  await writeFile(
    path.join(evidenceDirectory, "report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log("TWAtility Belt packaged Studio shell browser test passed");
} finally {
  studio?.close();
  await stopHeadlessChrome(chrome);
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
