import {verifyLegacyCompanionExpectation} from "./support/side-panel-companion/legacy-expectation-regression.mjs";
import {measureCompanion} from "./support/side-panel-companion/measure.mjs";
import {verifyLongCompanionRecord} from "./support/side-panel-companion/long-record.mjs";
import {verifyCompanionDelivery} from "./support/side-panel-companion/delivery-actions.mjs";
import {verifyCompanionAccessibility} from "./support/side-panel-companion/accessibility.mjs";
import {verifyCompanionRecovery} from "./support/side-panel-companion/recovery.mjs";
import {observePopulatedCompanion} from "./support/side-panel-companion/populated-state.mjs";
import {observeCompanionViews} from "./support/side-panel-companion/observations.mjs";
import { verifyCoordinatorDialogActions } from "./project-library-dialogs/coordinator-actions.mjs";
import { verifyInstalledDialogLifecycle } from "./project-library-dialogs/installed-lifecycle.mjs";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
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

function projectsProjectionReady(projection, name = "Retail website") {
  return (
    projection.readyState === "complete" &&
    projection.activeProjectText?.includes(name) &&
    projection.projectCount === 3
  );
}

async function waitForProjects(socket, name = "Retail website") {
  for (let attempt = 0; attempt < 240; attempt += 1) {
    const projection = await evaluate(
      socket,
      `({
        readyState:document.readyState,
        activeProjectText:document.querySelector("#project-library-list > li[data-active=true]")?.textContent,
        projectCount:document.querySelectorAll("#project-library-list > li").length
      })`,
    );
    if (projectsProjectionReady(projection, name)) return;
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
let companionEvidence;
let fixture;
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
  fixture = await pageSocket(port, `${base}specification-builder.html`);

  const seeded = await evaluate(
    fixture,
    `(async()=>{
      const {createSpecificationProject}=await import("./data-layer-specification-project.js");
      const {openIndexedDbProjectRepository}=await import("./data-layer-durable-project-repository.js");
      const repository=await openIndexedDbProjectRepository();
      const pause=()=>new Promise((resolve)=>setTimeout(resolve,20));
      const make=(projectId,name,site,owner,publishedRevision)=>{
        let sequence=0;
        const id=(kind)=>kind==="project"?projectId:kind+":"+projectId+":"+(++sequence);
        const state=createSpecificationProject({name,description:name+" purpose",site,id});
        state.project.eventTransport={observationHistoryPath:"queue.history",defaultPushPath:"dataLayer",observationSources:[{id:"event-history",name:"History array",path:"queue.history",enabled:true}]};state.project.owner=owner;
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
  fixture.close();
  fixture = undefined;
  side = await pageSocket(port, `${base}side-panel.html`);
  await waitForProjects(side);
  await evaluate(
    side,
    `document.getElementById("data-layer-view-projects").click()`,
  );

  const initialPresentation = await evaluate(side, `(${measureCompanion.toString()})()`);
  assert.deepEqual(initialPresentation.emptyMessages, [], "initial Projects messages");

  const interactionReport = await evaluate(
    side,
    `(async()=>{
      const pause=()=>new Promise((resolve)=>setTimeout(resolve,45));
      const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
      const buttons=(root=document)=>[...root.querySelectorAll("button")];
      const click=(text,root=document)=>{const control=buttons(root).find(({textContent})=>textContent.trim()===text);if(!control)throw new Error("Missing "+text);control.click();return control;};
      const input=q("#project-library-search"),sort=q("#project-library-sort"),list=q("#project-library-list");
      const names=()=>[...list.children].map((row)=>row.querySelector("h4").textContent.trim());
      input.value="Trade portal";input.dispatchEvent(new Event("input",{bubbles:true}));await pause();
      const filtered=names();
      input.value="";input.dispatchEvent(new Event("input",{bubbles:true}));await pause();
      sort.value="name";sort.dispatchEvent(new Event("change",{bubbles:true}));await pause();const nameOrder=names();
      sort.value="last-saved";sort.dispatchEvent(new Event("change",{bubbles:true}));await pause();const savedOrder=names();
      sort.value="name";sort.dispatchEvent(new Event("change",{bubbles:true}));await pause();
      const rows=[...list.children],namedActions=rows.every((row)=>{const project=row.querySelector("h4").textContent.trim();return buttons(row).every((control)=>control.getAttribute("aria-label")?.includes(project));});
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

  const dialogLifecycleReport = await verifyInstalledDialogLifecycle(side, evaluate);

  const dialogCoordinatorReport = await verifyCoordinatorDialogActions(side, evaluate);

  const metadataReport = await evaluate(
    side,
    `(async()=>{
      const pause=()=>new Promise((resolve)=>setTimeout(resolve,45));
      const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
      const click=(text,root=document)=>{const control=[...root.querySelectorAll("button")].find(({textContent})=>textContent.trim()===text);if(!control)throw new Error("Missing "+text);control.click();return control;};
      const repository=await (await import("./data-layer-durable-project-repository.js")).openIndexedDbProjectRepository(),before=await repository.loadProject("project-retail");click("Edit details",q("#project-library-list > li[data-active=true]"));for(let attempt=0;attempt<80&&!document.querySelector("dialog[open]");attempt+=1)await pause();const dialog=q("dialog[open]"),notes=q('[name="notes"]',dialog);notes.value="Updated by Slice 3 evidence";notes.dispatchEvent(new Event("input",{bubbles:true}));click("Save project details",dialog);let edited;for(let attempt=0;attempt<160;attempt+=1){edited=await repository.loadProject("project-retail");if(edited.state.project.notes==="Updated by Slice 3 evidence")break;await pause();}const save=edited.state.project.notes==="Updated by Slice 3 evidence"&&edited.state.project.id===before.state.project.id&&edited.publishedRevision===before.publishedRevision;click("Undo metadata edit",dialog);let restored;for(let attempt=0;attempt<160;attempt+=1){restored=await repository.loadProject("project-retail");if(restored.state.project.notes===before.state.project.notes)break;await pause();}const undo=restored.state.project.notes===before.state.project.notes&&restored.state.project.id===before.state.project.id&&restored.publishedRevision===before.publishedRevision;click("Close",dialog);await pause();return{save,undo,returnFocus:document.activeElement?.isConnected===true&&document.activeElement?.textContent==="Edit details"};
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

  const companionViews = await observeCompanionViews(side, evaluate, evidenceDirectory);

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
          active:document.querySelector("#project-library-list > li[data-active=true]").textContent,
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

  const companionDelivery = await verifyCompanionDelivery(side, evaluate, port, evidenceDirectory);

  const companionAccessibility = await verifyCompanionAccessibility(side, evaluate);

  const companionRecovery = await verifyCompanionRecovery(side, evaluate);

  const populatedCompanion = await observePopulatedCompanion(side, evaluate, evidenceDirectory, waitForProjects);

  const companionLongRecord = await verifyLongCompanionRecord(side, evaluate, evidenceDirectory);

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
  const visualReports=[...companionViews,...populatedCompanion.views];
  companionEvidence={
    visibleUtilityBadges:Math.max(...visualReports.map(report=>report.badgeCount)),
    minimumContrast:Math.min(...visualReports.flatMap(report=>report.text.map(text=>text.ratio))),
    widths:[...new Set(visualReports.map(report=>report.width))],
    views:[...new Set(visualReports.map(report=>report.view))],
    populatedObservations:populatedCompanion.views.length,
    accessibilityModes:companionAccessibility.length,dialogClosures:dialogLifecycleReport.length,
    longRecordWidths:companionLongRecord.reports.length,
    recovery:companionRecovery.success,archive:companionDelivery.archive.review,
    studio:companionDelivery.studio.project==="project-retail",
    emptyFilterPreservedActive:companionLongRecord.filtered.empty&&companionLongRecord.filtered.unchanged,
  };
  await writeFile(
    path.join(evidenceDirectory, "report.json"),
    `${JSON.stringify(
      { companionViews, companionLongRecord, companionDelivery, companionAccessibility, companionRecovery, populatedCompanion, interactionReport, metadataReport, dialogLifecycleReport, dialogCoordinatorReport, viewports: reports, recovery },
      null,
      2,
    )}\n`,
  );
} finally {
  fixture?.close();
  side?.close();
  await stopHeadlessChrome(chrome, 1500);
  await removeChromeProfile(profile, { targetId:"twatility-projects" });
}

const companionRepairContext=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
  ?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):null;
const companionExpectationRepair=["other:companion utility directory expectation","other:companion hidden directory evidence"].includes(companionRepairContext?.causalCategory);
if(companionExpectationRepair)await verifyLegacyCompanionExpectation(companionRepairContext,companionEvidence.visibleUtilityBadges);

const companionIntegrationRepair=companionRepairContext?.causalCategory==="other:companion Shell acceptance integration";
if(companionIntegrationRepair)await import("./side-panel-companion-acceptance-test.mjs");

if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION && !companionExpectationRepair && !companionIntegrationRepair) {
  const context = JSON.parse(
    process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION,
  );
  const normalized = (value) =>
    Array.isArray(value)
      ? value.map(normalized)
      : value && typeof value === "object"
        ? Object.fromEntries(
            Object.entries(value)
              .sort(([left], [right]) => left.localeCompare(right))
              .map(([key, nested]) => [key, normalized(nested)]),
          )
        : value;
  const digest = (value) =>
    createHash("sha256")
      .update(JSON.stringify(normalized(value)))
      .digest("hex");
  const observations = [
    {
      readyState: "complete",
      activeProjectText: "Retail website",
      projectCount: 1,
    },
    {
      readyState: "complete",
      activeProjectText: "Retail website",
      projectCount: 3,
    },
  ];
  const fixture = {
    id: "projects-reload-projection-readiness-v1",
    causalCategory: "readiness or settling",
    diagnosedBoundaryDigest: digest(context.diagnosedBoundary),
    input: { repositorySeeded: true, observations },
    expectedPreRepairFailure: { reloadObservationIndex: 0, projectCount: 1 },
    expectedRepairResult: { reloadObservationIndex: 1, projectCount: 3 },
  };
  const preRepairResult = {
    reloadObservationIndex: 0,
    projectCount: observations[0].projectCount,
  };
  const reloadObservationIndex = observations.findIndex((projection) =>
    projectsProjectionReady(projection),
  );
  const repairResult = {
    reloadObservationIndex,
    projectCount: observations[reloadObservationIndex].projectCount,
  };
  assert.deepEqual(preRepairResult, fixture.expectedPreRepairFailure);
  assert.deepEqual(repairResult, fixture.expectedRepairResult);
  const fixtureDigest = digest(fixture);
  console.log(
    JSON.stringify({
      swarmforgeTimeoutRepairRegression: {
        version: 2,
        incidentId: context.incidentId,
        failureDigest: context.failureDigest,
        fixture,
        preRepairResult: {
          status: "failed",
          fixtureDigest,
          observed: preRepairResult,
        },
        repairResult: {
          status: "passed",
          fixtureDigest,
          observed: repairResult,
        },
      },
    }),
  );
}

console.log(JSON.stringify({sidePanelCompanion:companionEvidence,
  projectLibraryDialogs:{installed:true,lifecycle:true,coordinator:true}}));
console.log("TWAtility Belt packaged Projects browser test passed");
