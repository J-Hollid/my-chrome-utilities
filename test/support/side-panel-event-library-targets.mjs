import { createExecutableTargetDefinitions } from "./side-panel-browser-target-contract.mjs";

async function executeFixture({ context, fixturePrograms, target }) {
  return context.executeFixture({ fixturePrograms, target });
}

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
export const definitions = createExecutableTargetDefinitions("event-library", fixturePrograms, { observe:executeFixture });
