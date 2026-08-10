import assert from "node:assert/strict";

import { createExecutableTargetDefinitions } from "./side-panel-browser-target-contract.mjs";
import { observeBrowserReadiness, transmitDevtoolsProgram } from "./browser-observation-control.mjs";
import { sharedHarnessReadinessState } from "../browser-packs/shared-harness.mjs";
import { fixturePrograms } from "./side-panel-event-library-fixtures.mjs";

const renderedSmokeLeaves = Object.freeze([
  "isolation", "editorVisible", "templateNameFocused", "persistedVersionTwo",
  "singleRevisionHistoryEntry", "oneExportedTemplate", "positiveTransferBytes",
  "transferFeedback", "containedAt320", "visibleControlsNamed", "referencesResolve",
]);

const renderedSmokeTarget = Object.freeze({
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

async function observeRenderedSmoke(context) {
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

const [directPushTarget] = createExecutableTargetDefinitions("event-library", fixturePrograms).map(({ setup, observe, cleanup, ...contract }) => contract);
export const eventLibraryTargetContract = Object.freeze([
  renderedSmokeTarget, Object.freeze({ ...directPushTarget, processGroup:"event-library-side-panel" }),
]);
async function executeFixture({ context, fixturePrograms:programs, target }) {
  return context.executeFixture({ fixturePrograms:programs, target });
}

export { fixturePrograms };
export const definitions = Object.freeze([
  Object.freeze({
    ...renderedSmokeTarget,
    fixturePrograms,
    setup:async ({ context }) => { context.activeFixtureModule = "event-library"; },
    observe:async ({ context }) => observeRenderedSmoke(context),
    cleanup:async ({ context }) => { context.activeFixtureModule = null; },
  }),
  ...createExecutableTargetDefinitions("event-library", fixturePrograms, { observe:executeFixture })
    .map((definition) => Object.freeze({ ...definition, processGroup:"event-library-side-panel" })),
]);
