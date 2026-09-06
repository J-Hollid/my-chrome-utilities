import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import {wait, evaluate, extensionId, pageSocket} from "./support/side-panel-companion/chrome.mjs";
import os from "node:os";
import path from "node:path";
import {
  headlessChromeArguments,
  removeChromeProfile,
  resolveChromeExecutable,
  stopHeadlessChrome,
} from "./support/headless-chrome.mjs";
import { inspectSidePanelAccessibilityModes } from "./side-panel-brand-accessibility-support.mjs";

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
      document.getElementById("data-layer-view-live")?.click();
      await new Promise((resolve)=>setTimeout(resolve,180));
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
      const sheetName=(sheet)=>sheet.href?new URL(sheet.href).pathname.split("/").pop():"(inline)";
      const sheetNames=(sheet)=>{
        let imported=[];
        try{imported=[...sheet.cssRules].flatMap((rule)=>rule.styleSheet?sheetNames(rule.styleSheet):[]);}catch{}
        return [sheetName(sheet),...imported];
      };
      return {
        bodyClasses:[...document.body.classList],
        sheets:[...document.styleSheets].flatMap(sheetNames),
        ink:getComputedStyle(document.body).getPropertyValue("--twa-ink").trim(),
        overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
        unnamed:[...document.querySelectorAll("button,input,select,textarea,a[href],[role=tab]")].filter(visible).filter((element)=>!name(element)).map((element)=>element.id||element.outerHTML.slice(0,80)),
        broken:[...document.querySelectorAll("*")].flatMap((element)=>references.flatMap((attribute)=>{const value=element.getAttribute(attribute);return value?value.split(/\\s+/).filter((id)=>!document.getElementById(id)).map((id)=>({owner:element.id,attribute,id})):[];})),
        equivalent:JSON.stringify(before)===JSON.stringify(after),
        colorScheme:getComputedStyle(document.documentElement).colorScheme,
        roles:Object.fromEntries(Object.entries({
          masthead:"#application-header",
          page:"body",
          workspace:"#workspace-panel-data-layer",
          panel:"#data-layer-panel-live",
          nested:"#live-session-summary",
          ordinary:"#open-palette",
          primary:"#start-data-layer-testing",
          destructive:"#discard-and-start-fresh-session",
          selected:"#data-layer-view-live",
          projectStatus:"#active-project-header"
        }).map(([name,selector])=>{const style=getComputedStyle(document.querySelector(selector));return[name,{background:style.backgroundColor,foreground:style.color}];})),
        projectLayout:Object.fromEntries(Object.entries({
          activeProject:"#active-project-card",
          durableRepository:"#durable-project-repository"
        }).map(([name,selector])=>{const style=getComputedStyle(document.querySelector(selector));return[name,{paddingBlockStart:style.paddingBlockStart,paddingInlineStart:style.paddingInlineStart}];})),
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
  assert.equal(report.colorScheme,"light","the document root must not force dark native controls");
  assert.deepEqual(report.roles,{
    masthead:{background:"rgb(12, 49, 88)",foreground:"rgb(255, 248, 232)"},
    page:{background:"rgb(248, 239, 216)",foreground:"rgb(23, 19, 14)"},
    workspace:{background:"rgb(248, 239, 216)",foreground:"rgb(23, 19, 14)"},
    panel:{background:"rgb(255, 248, 232)",foreground:"rgb(23, 19, 14)"},
    nested:{background:"rgb(255, 248, 232)",foreground:"rgb(23, 19, 14)"},
    ordinary:{background:"rgb(255, 248, 232)",foreground:"rgb(12, 49, 88)"},
    primary:{background:"rgb(12, 49, 88)",foreground:"rgb(255, 248, 232)"},
    destructive:{background:"rgb(123, 33, 24)",foreground:"rgb(255, 248, 232)"},
    selected:{background:"rgb(255, 248, 232)",foreground:"rgb(12, 49, 88)"},
    projectStatus:{background:"rgb(248, 239, 216)",foreground:"rgb(23, 19, 14)"},
  },"computed side-panel roles must use the approved paper-first map");
  assert.deepEqual(report.projectLayout,{
    activeProject:{paddingBlockStart:"10.92px",paddingInlineStart:"10.92px"},
    durableRepository:{paddingBlockStart:"10.92px",paddingInlineStart:"10.92px"},
  },"project-owned surfaces must retain their 0.78rem workflow padding");
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
        document.getElementById("side-panel-root")?.dataset.chromeApiCapabilities==="installed-runtime" &&
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
        utilityCount:[...document.querySelectorAll("#utility-directory li")].filter(element=>element.getClientRects().length).length,
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
  assert.equal(tabReport.utilityCount, 0, "decorative utility badges must be absent");
  assert.deepEqual(tabReport.dataTabs, tabReport.expected);
  assert.ok(
    tabReport.visits.every(
      ({ selected, visible }) => selected === "true" && visible,
    ),
    `every Data Layer route must select and reveal its owned panel: ${JSON.stringify(tabReport.visits)}`,
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
    { width: 360, height: 760, view: "live", fixture: "live-ready" },
    { width: 420, height: 900, view: "library", fixture: "library-empty" },
    { width: 512, height: 900, view: "schemas", fixture: "schemas-detail" },
  ];
  const reports = [];
  for (const viewport of viewports) {
    const foundation = await inspectSurface(
      side,
      viewport.width,
      viewport.height,
      "twatility-side-panel",
      [
        "twatility-brand.css",
        "side-panel-brand.css",
        "shell.css",
        "live-transport.css",
        "projects-repository.css",
        "library-sessions.css",
        "workflow-structure.css",
        "defects-schemas.css",
        "hotkeys.css",
        "shared.css",
      ],
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
        document.getElementById("data-layer-view-${viewport.view}")?.click();
      })()`,
    );
    await wait(100);
    const fixtureReport = await evaluate(
      side,
      `(()=>{
        const tab=document.getElementById("data-layer-view-${viewport.view}");
        const panel=document.getElementById(tab?.getAttribute("aria-controls"));
        const style=panel?getComputedStyle(panel):null;
        return {
          selected:tab?.getAttribute("aria-selected"),
          visible:Boolean(panel)&&!panel.hidden&&style.display!=="none",
          background:style?.backgroundColor,
          foreground:style?.color,
          overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
        };
      })()`,
    );
    assert.deepEqual(fixtureReport, {
      selected:"true",
      visible:true,
      background:"rgb(255, 248, 232)",
      foreground:"rgb(23, 19, 14)",
      overflow:0,
    }, `${viewport.fixture} must keep the paper-first panel role and responsive boundary`);
    const capture = await side.call("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    await writeFile(
      path.join(
        evidenceDirectory,
        `side-panel-${viewport.fixture}-${viewport.width}x${viewport.height}.png`,
      ),
      Buffer.from(capture.data, "base64"),
    );
    reports.push({ viewport, foundation, shell, fixture:fixtureReport });
  }
  const accessibilityModes = await inspectSidePanelAccessibilityModes(side, evaluate);

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
    `${JSON.stringify({ viewports: reports, accessibilityModes }, null, 2)}\n`,
  );
} finally {
  side?.close();
  await stopHeadlessChrome(chrome, 1500);
  await removeChromeProfile(profile, { targetId:"twatility-side-panel-shell" });
}

console.log(JSON.stringify({sidePanelPaperFirstBrand:{
  computedRoleMap:true,
  responsiveContainment:true,
  stableControlsAndRelationships:true,
  keyboardAndFocus:true,
  accessibilityModes:true,
  runtimeLoadClean:true,
}}));
console.log("TWAtility Belt packaged side-panel shell browser test passed");
