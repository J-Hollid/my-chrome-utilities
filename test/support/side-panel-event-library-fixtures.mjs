const libraryDirectTemplatePushSeedRuntime = `(() => {
  localStorage.clear();
  const base = { sourceId:"history", sourceName:"Event history", tags:[], validation:"Valid", provenance:"template:captured", revisionHistory:[] };
  const templates = [
    { ...base, id:"template:purchase", name:"Purchase confirmation v3", eventName:"purchase", destination:"dataLayer", payload:{ transaction_id:"test-123" }, version:3 },
    { ...base, id:"template:product", name:"Product detail", eventName:"product_detail", destination:"dataLayer", payload:{ product_id:"sku-123" }, version:1 },
  ];
  localStorage.setItem("my-chrome-utilities.event-template-library.v1", JSON.stringify(templates));
  return localStorage.getItem("my-chrome-utilities.event-template-library.v1");
})()`;

const libraryDirectTemplatePushRuntime = `(async () => {
  const pause = () => new Promise((resolve) => setTimeout(resolve, 0));
  const q = (selector, root=document) => { const value=root.querySelector(selector); if (!value) throw new Error("Missing " + selector); return value; };
  const row = (name) => Array.from(document.querySelectorAll(".event-template-row")).find((item) => item.textContent.includes(name));
  const clickIn = (root, label) => { const button=Array.from(root.querySelectorAll("button")).find(({textContent}) => textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  const setInput = (selector, value) => { const input=q(selector); input.value=value; input.dispatchEvent(new Event("input", { bubbles:true })); };
  const executions=[];
  globalThis.chrome = {
    tabs:{ query:async () => [{ id:42, windowId:1, url:"https://signal-shop.example/checkout", title:"Signal Shop", active:true }] },
    scripting:{ executeScript:async (details) => { executions.push(structuredClone(details.args)); return [{ result:{ success:true } }]; } },
  };
  q("#data-layer-view-library").click();
  q("#choose-observation-target").click(); await pause();
  q("#observation-target-list [data-target-id]").click(); await pause();
  setInput("#event-template-search", "Purchase");
  const before={ search:q("#event-template-search").value, rows:q("#event-template-list").textContent, target:q("#observation-target-result").textContent };
  clickIn(row("Purchase confirmation v3"), "Push"); await pause();
  const closed={ execution:executions.at(-1), editorHidden:q("#event-property-editor").hidden, search:q("#event-template-search").value, rows:q("#event-template-list").textContent, target:q("#observation-target-result").textContent, feedback:q("#event-template-result").textContent };

  setInput("#event-template-search", "");
  clickIn(row("Product detail"), "Edit");
  q("#event-template-json-section summary").click();
  setInput("#event-template-json", JSON.stringify({ product_id:"unsaved-sku" }));
  clickIn(row("Purchase confirmation v3"), "Push"); await pause();
  const productDraft={ execution:executions.at(-1), title:q("#event-property-editor h4").textContent, json:q("#event-template-json").value };

  q("#close-template-editor").click(); clickIn(row("Purchase confirmation v3"), "Edit");
  q("#event-template-json-section summary").click();
  setInput("#event-template-json", JSON.stringify({ transaction_id:"test-456" }));
  clickIn(row("Purchase confirmation v3"), "Push"); await pause();
  const purchaseDraft={ execution:executions.at(-1), json:q("#event-template-json").value };
  q("#push-template-draft").click();
  purchaseDraft.review={ open:!q("#push-draft-review").hidden, text:q("#push-draft-review").textContent };

  const core=await import("/data-layer-selected-target-push.js");
  const saved=JSON.parse(localStorage.getItem("my-chrome-utilities.event-template-library.v1"))[0];
  const target={ id:"tab:42:window:1",tabId:42,windowId:1,pageUrl:"https://signal-shop.example/checkout",title:"Signal Shop",origin:"https://signal-shop.example",accessState:"Ready" };
  const noTarget=await core.pushSavedTemplateToSelectedTarget(saved,undefined,async()=>{throw new Error("unexpected");});
  const unavailable=await core.pushSavedTemplateToSelectedTarget(saved,{...target,accessState:"Permission required"},async()=>{throw new Error("unexpected");});
  const failed=await core.pushSavedTemplateToSelectedTarget(saved,target,async()=>{throw new Error("injection failed");});
  const pairs=(root)=>Array.from(root.querySelectorAll("dt"),(term)=>[term.textContent,term.nextElementSibling?.textContent]);
  const [pushUi,revisionUi]=await Promise.all([import("/data-layer-push-draft-review-ui.js"),import("/data-layer-template-change-review-ui.js")]);
  const pushHost=document.createElement("section");
  pushHost.innerHTML='<dl id="push-draft-review-details"></dl><ul id="push-draft-review-change-list"></ul><p id="push-draft-review-no-changes" hidden>No payload changes</p>';
  pushUi.renderPushDraftReview(pushHost,{rows:[["Event","purchase"],["Destination","dataLayer"]],changes:[{path:"transaction_id",previous:"test-123",pushed:"test-456",change:"changed"}]});
  const pushRendered={details:pairs(pushHost.querySelector("#push-draft-review-details")),changes:Array.from(pushHost.querySelectorAll("li dl"),pairs),emptyHidden:pushHost.querySelector("#push-draft-review-no-changes").hidden};
  const revisionHost=document.createElement("section");
  revisionHost.innerHTML='<dl data-change-details></dl><ul data-change-list></ul><p data-no-payload-changes hidden>No payload changes</p>';
  revisionUi.renderTemplateChangeReview(revisionHost,{rows:[["Resulting version","4"]],identity:[["Template name","Purchase confirmation","Completed checkout"]],execution:[["Destination","event.history","queue.history"]],changes:[{path:"transaction_id",previous:"test-123",pushed:"test-456",change:"changed"}],proposedLabel:"Revised"});
  const revisionRendered={details:pairs(revisionHost.querySelector("[data-change-details]")),changes:Array.from(revisionHost.querySelectorAll("li dl"),pairs),emptyHidden:revisionHost.querySelector("[data-no-payload-changes]").hidden};
  revisionUi.renderTemplateChangeReview(revisionHost,{rows:[["Resulting version","4"]],identity:[],execution:[],changes:[],proposedLabel:"Revised"});
  const revisionEmpty={details:pairs(revisionHost.querySelector("[data-change-details]")),changeCount:revisionHost.querySelector("[data-change-list]").children.length,visible:!revisionHost.querySelector("[data-no-payload-changes]").hidden};
  return { before,closed,productDraft,purchaseDraft,failures:[noTarget.result,unavailable.result,failed.result],persistedUnchanged:JSON.stringify(saved)===JSON.stringify(JSON.parse(localStorage.getItem("my-chrome-utilities.event-template-library.v1"))[0]),renderers:{push:pushRendered,revision:revisionRendered,revisionEmpty} };
})()`;

export const fixturePrograms = Object.freeze({ libraryDirectTemplatePushSeedRuntime, libraryDirectTemplatePushRuntime });

const renderedSmokeLeaves = Object.freeze([
  "isolation", "editorVisible", "templateNameFocused", "persistedVersionTwo",
  "singleRevisionHistoryEntry", "oneExportedTemplate", "positiveTransferBytes",
  "transferFeedback", "containedAt320", "visibleControlsNamed", "referencesResolve",
]);

export const renderedSmokeTarget = Object.freeze({
  id:"EVENT_LIBRARY_RENDERED_SMOKE_TARGET",
  owningPack:"event-library",
  oldProgram:"test/browser-packs/event-library.mjs",
  newProgram:"test/browser-packs/side-panel-event-library.mjs",
  processGroup:"event-library-side-panel",
  configuration:Object.freeze({ EVENT_LIBRARY_RENDERED_SMOKE_TARGET:"1" }),
  viewport:Object.freeze([320]),
  observationKeys:Object.freeze(["eventLibraryRenderedSmoke"]),
  assertionLeaves:Object.freeze(renderedSmokeLeaves.map((leaf) =>
    Object.freeze(["eventLibraryRenderedSmoke", leaf]))),
  module:"event-library",
});

const renderedSmokeRuntime = `(async()=>{
  const q=(selector)=>{const element=document.querySelector(selector);if(!element)throw new Error("Missing "+selector);return element;};
  const visible=(element)=>element.getClientRects().length>0;
  q("#data-layer-view-library").click();
  q("#add-new-event").click();
  const editorVisible=visible(q("#event-property-editor"));
  const templateNameFocused=document.activeElement===q("#event-template-name");
  q("#save-template-revision").click();
  q("#export-event-library").click();
  const transfer=q("#event-library-transfer-result");
  const stored=JSON.parse(localStorage.getItem("my-chrome-utilities.event-template-library.v1"));
  const controls=[...document.querySelectorAll('button,input:not([type="hidden"]),select,textarea,[role="button"],[role="tab"],[role="combobox"],[role="textbox"]')].filter(visible);
  const named=(element)=>{const ariaLabel=element.getAttribute("aria-label")?.trim();if(ariaLabel)return true;const labelledBy=element.getAttribute("aria-labelledby")?.trim().split(/\\s+/).filter(Boolean)??[];if(labelledBy.length&&labelledBy.every((id)=>document.getElementById(id)?.textContent?.trim()))return true;if("labels" in element&&[...element.labels].some((label)=>label.textContent?.trim()))return true;return Boolean(element.textContent?.trim()||element.getAttribute("title")?.trim());};
  const references=[...document.querySelectorAll("[aria-controls],[aria-labelledby]")].flatMap((element)=>["aria-controls","aria-labelledby"].flatMap((attribute)=>(element.getAttribute(attribute)?.trim().split(/\\s+/).filter(Boolean)??[]).filter((id)=>!document.getElementById(id))));
  return {eventLibraryRenderedSmoke:{
    isolation:document.querySelectorAll('[id^="data-layer-panel-"]').length===1&&document.querySelector("#data-layer-panel-library")!==null&&!document.querySelector("#workspace-panel-hotkeys,#palette,#utility-directory,#observation-target-picker,#sequence-library"),
    editorVisible,
    templateNameFocused,
    persistedVersionTwo:stored.length===1&&stored[0].version===2,
    singleRevisionHistoryEntry:stored.length===1&&stored[0].revisionHistory.length===1,
    oneExportedTemplate:transfer.dataset.transferTemplates==="1",
    positiveTransferBytes:Number(transfer.dataset.transferBytes)>0,
    transferFeedback:transfer.textContent.includes("exported and imported"),
    containedAt320:innerWidth===320&&document.documentElement.scrollWidth<=innerWidth,
    visibleControlsNamed:controls.every(named),
    referencesResolve:references.length===0,
  }};
})()`;

async function evaluate(context, { source, phase, awaitPromise = false }) {
  const response = await transmitDevtoolsProgram({
    targetId:context.id, phase, source, shape:"expression", call:context.socket.call,
    parameters:{ returnByValue:true, awaitPromise },
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
  }
  return response.result.value;
}

export async function observeRenderedSmoke(context) {
  await context.runPhaseScoped("navigation", async () => {
    const query = new URLSearchParams([
      ["utility", "data-layer"], ["panel", "workspace-panel-data-layer"],
      ["panel", "data-layer-panel-library"], ["remove", "#utility-directory"],
      ["remove", "#observation-target-picker"], ["remove", "#sequence-library"],
    ]);
    await context.socket.call("Page.navigate", {
      url:`http://127.0.0.1:${context.process.assetPort}/side-panel.html?${query}`,
    });
    await observeBrowserReadiness({
      targetId:context.id,
      phase:"navigation",
      predicateDescription:"the isolated Event Library panel is ready",
      timeoutMs:15_000,
      pollIntervalMs:50,
      maximumSnapshotCharacters:600,
      observe:() => evaluate(context, {
        phase:"navigation",
        source:"({documentReadyState:document.readyState,shellReady:document.querySelector('#side-panel-root')?.dataset.utilityShellReady??null,isolation:document.documentElement.dataset.utilityIsolation??'',libraryPanel:Boolean(document.querySelector('#data-layer-panel-library')),href:location.href})",
      }),
      ready:(state) => sharedHarnessReadinessState(state, "data-layer") && state.libraryPanel,
      snapshot:(state) => state,
    });
  });
  const observation = await evaluate(context, {
    phase:"interaction", source:renderedSmokeRuntime, awaitPromise:true,
  });
  context.deferredAssertions.push(() => {
    for (const leaf of renderedSmokeLeaves) {
      assert.equal(observation.eventLibraryRenderedSmoke[leaf], true,
        `EVENT_LIBRARY_RENDERED_SMOKE_TARGET failed ${leaf}`);
    }
  });
  return observation;
}
import assert from "node:assert/strict";

import { observeBrowserReadiness, transmitDevtoolsProgram } from "./browser-observation-control.mjs";
import { sharedHarnessReadinessState } from "../browser-packs/shared-harness.mjs";
