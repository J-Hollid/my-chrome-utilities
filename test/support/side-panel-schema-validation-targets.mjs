import { createExecutableTargetDefinitions } from "./side-panel-browser-target-contract.mjs";
import { projectFixturePrograms } from "./side-panel-browser-project-fixtures.mjs";
import { guidedRuntimeWaitHelpers } from "./side-panel-schema-fixture-primitives.mjs";

async function executeFixture({ context, fixturePrograms, target }) {
  return context.executeFixture({ fixturePrograms, target });
}

const conditionalValidationRulesRuntime = `(async () => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const click = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  const input = (selector, value, eventName = "input") => { const element = q(selector); element.value = value; element.dispatchEvent(new Event(eventName, { bubbles:true })); return element; };
  ${guidedRuntimeWaitHelpers}
  globalThis.chrome = {
    tabs:{ query:async () => [{ id:31, windowId:5, url:"https://shop.example/products/field-notebook", title:"Product detail", active:true }] },
    scripting:{ executeScript:async () => [{ result:{ queue:{ history:[{ event:"product_detail", page_type:"product_detail", currency:"EUR", oOrder:{ aProducts:[] } }] } } }] },
  };
  if (!document.querySelector("#live-event-feed button")) {
    let start = document.querySelector("#start-data-layer-testing:not(:disabled)");
    if (!start) {
      q("#choose-observation-target").click();
      (await waitForElement("#observation-target-list [data-target-id]")).click();
      start = await waitForStartableSelectedTarget();
    }
    start.click();
  }
  (await waitForElement("#live-event-feed button")).click();
  q("#data-layer-view-schemas").click();
  click(q("#schema-list"), "Edit working draft");
  q('#schema-property-tree button[aria-label="Add rule for oOrder.aProducts"]').click();
  click(q("#schema-property-rule-picker"), "Item count");
  input("#schema-local-rule-comparison", ">=", "change");
  input("#schema-local-rule-limit", "1");
  const conditional = q("#schema-local-rule-conditional"); conditional.checked = true; conditional.dispatchEvent(new Event("change", { bubbles:true }));
  const editor = {
    applyOnlyWhen:q("#schema-local-rule-conditions").querySelector("legend").textContent,
    property:q("#schema-local-rule-condition-property-0").value,
    operators:Array.from(q("#schema-local-rule-condition-operator-0").options).map(({ textContent }) => textContent),
    operator:q("#schema-local-rule-condition-operator-0").value,
    initializedValue:q("#schema-local-rule-condition-value-0").value,
    schemaProperties:Array.from(q("#schema-local-rule-condition-property-0").options).map(({ value }) => value).filter(Boolean),
    preview:q("#schema-local-rule-current-preview").textContent,
    oneConsequence:q("#schema-local-rule-configuration").querySelectorAll("#schema-local-rule-parameters").length,
  };
  click(q("#schema-property-rule-picker"), "Create rule");
  const stored = (await globalThis.__waitForDurableSchemaObservation((schemas) => schemas.some(({ id, workingDraft }) => id === "schema-product-event" && Boolean(workingDraft?.attachedRules?.length)), "conditional validation rule"))
    .find(({ id }) => id === "schema-product-event");
  const storedRule = stored.workingDraft.attachedRules[0];
  const core = await import("/data-layer-schema-verification.js");
  const conditionalCore = await import("/data-layer-conditional-validation-rules.js");
  const activeSchema = { ...stored, attachedRules:stored.workingDraft.attachedRules, assignments:stored.workingDraft.assignments };
  const validate = (page_type, products) => {
    const payload = { page_type, currency:"EUR", oOrder:{} };
    if (products !== "missing") payload.oOrder.aProducts = products === "empty array" ? [] : [{ sku:"ABC" }];
    const result = core.validateEvent({ sourceId:"event-history", eventName:"product_detail", payload, rawInput:[] }, [activeSchema]);
    const evaluation = result.evaluations.find(({ rule }) => rule === (storedRule.name ?? storedRule.id));
    if (!evaluation) throw new Error("Missing conditional evaluation " + JSON.stringify({ storedRule, evaluations:result.evaluations, activeRules:activeSchema.attachedRules }));
    return { page_type, products, result:evaluation.status === "not-applicable" ? "Not applicable" : evaluation.status === "pass" ? "Passed" : "Failed", issues:result.issues.filter(({ instancePath }) => instancePath === "/oOrder/aProducts").length };
  };
  const evaluations = [
    validate("product_detail", "missing"),
    validate("product_detail", "empty array"),
    validate("product_detail", "1 item"),
    validate("category", "empty array"),
    validate("category", "missing"),
  ];
  const product = storedRule.conditionGroup.predicates[0];
  const currency = { propertyPath:"/currency", operator:"Equals", comparison:conditionalCore.typedComparisonValue("EUR"), detectedType:"string" };
  const consequence = { propertyPath:"/oOrder/aProducts", operator:"item-count", parameters:"1" };
  const groups = [["All", "product_detail", "EUR"], ["All", "product_detail", "USD"], ["Any", "product_detail", "USD"], ["Any", "category", "USD"]].map(([operator, page_type, currencyValue]) => ({
    operator, page_type, currency:currencyValue,
    ...conditionalCore.evaluateConditionalRule({ page_type, currency:currencyValue }, { conditionGroup:{ operator, predicates:[product, currency] }, consequence }, () => true),
  }));
  const truthGroups = [["All", true, true], ["All", true, false], ["Any", true, false], ["Any", false, false]].map(([operator, first, second]) => {
    let index = 0;
    const applies = conditionalCore.conditionGroupApplies({ operator, predicates:[product, currency] }, () => [first, second][index++]);
    return { operator, first, second, behavior:applies ? "evaluated" : "Not applicable" };
  });
  const predicateCases = [
    ["present with null", "Exists", "none", { value:null, exists:true }, { propertyPath:"/trigger", operator:"Exists" }],
    ["absent", "Does not exist", "none", { value:undefined, exists:false }, { propertyPath:"/trigger", operator:"Does not exist" }],
    ["string product_detail", "Equals", "string product_detail", { value:"product_detail", exists:true }, { propertyPath:"/trigger", operator:"Equals", comparison:conditionalCore.typedComparisonValue("product_detail") }],
    ["number 1", "Equals", "string 1", { value:1, exists:true }, { propertyPath:"/trigger", operator:"Equals", comparison:conditionalCore.typedComparisonValue("1") }],
    ["absent", "Does not equal", "string internal", { value:undefined, exists:false }, { propertyPath:"/trigger", operator:"Does not equal", comparison:conditionalCore.typedComparisonValue("internal") }],
    ["string checkout", "Is one of", "page, checkout", { value:"checkout", exists:true }, { propertyPath:"/trigger", operator:"Is one of", comparisons:[conditionalCore.typedComparisonValue("page"), conditionalCore.typedComparisonValue("checkout")] }],
    ["string product_detail", "Matches pattern", "^product_", { value:"product_detail", exists:true }, { propertyPath:"/trigger", operator:"Matches pattern", comparison:conditionalCore.typedComparisonValue("^product_") }],
    ["number 6", "Is greater than", "number 5", { value:6, exists:true }, { propertyPath:"/trigger", operator:"Is greater than", comparison:conditionalCore.typedComparisonValue(5) }],
    ["number 5", "Is at least", "number 5", { value:5, exists:true }, { propertyPath:"/trigger", operator:"Is at least", comparison:conditionalCore.typedComparisonValue(5) }],
    ["number 4", "Is less than", "number 5", { value:4, exists:true }, { propertyPath:"/trigger", operator:"Is less than", comparison:conditionalCore.typedComparisonValue(5) }],
    ["number 5", "Is at most", "number 5", { value:5, exists:true }, { propertyPath:"/trigger", operator:"Is at most", comparison:conditionalCore.typedComparisonValue(5) }],
    ["string 5", "Is greater than", "number 4", { value:"5", exists:true }, { propertyPath:"/trigger", operator:"Is greater than", comparison:conditionalCore.typedComparisonValue(4) }],
  ].map(([observedState, predicate, configuredValue, observed, definition]) => ({ observedState, predicate, configuredValue, result:conditionalCore.evaluateConditionPredicate(observed, definition) }));
  const invalidBase = { conditionGroup:{ operator:"All", predicates:[product] }, consequence };
  const invalidConfigurations = [
    ["no trigger predicate", { ...invalidBase, conditionGroup:{ operator:"All", predicates:[] } }],
    ["trigger without a property path", { ...invalidBase, conditionGroup:{ operator:"All", predicates:[{ ...product, propertyPath:"" }] } }],
    ["Equals without a comparison value", { ...invalidBase, conditionGroup:{ operator:"All", predicates:[{ propertyPath:"/page_type", operator:"Equals", detectedType:"string" }] } }],
    ["malformed Matches pattern value", { ...invalidBase, conditionGroup:{ operator:"All", predicates:[{ propertyPath:"/page_type", operator:"Matches pattern", comparison:conditionalCore.typedComparisonValue("["), detectedType:"string" }] } }],
    ["Is greater than on a string trigger", { ...invalidBase, conditionGroup:{ operator:"All", predicates:[{ propertyPath:"/page_type", operator:"Is greater than", comparison:conditionalCore.typedComparisonValue(5), detectedType:"string" }] } }],
    ["consequence rule with invalid parameters", { ...invalidBase, consequence:{ ...consequence, parameters:"1.5" } }],
  ].map(([configuration, definition]) => ({ configuration, ...conditionalCore.validateConditionalRule(definition) }));
  const failed = core.validateEvent({ sourceId:"event-history", eventName:"product_detail", payload:{ page_type:"product_detail", currency:"EUR", oOrder:{ aProducts:[] } }, rawInput:[] }, [activeSchema]);
  const notApplicable = core.validateEvent({ sourceId:"event-history", eventName:"product_detail", payload:{ page_type:"category", currency:"EUR", oOrder:{} }, rawInput:[] }, [activeSchema]);
  const ui = await import("/data-layer-live-observer-ui.js");
  const actionsCore = await import("/data-layer-live-inspector-actions.js");
  const elements = ui.findLiveObserverElements();
  const actions = actionsCore.createLiveInspectorActions({ currentPageUrl:()=>"https://shop.example/products/field-notebook", writeClipboard:async()=>{}, storeTemplate:()=>{}, addPropertyValidation:()=>{}, validationState:()=>"Valid", updateValidation:()=>{}, manualSchemaChoices:()=>[], selectManualSchema:()=>{} });
  const renderResult = (result, payload) => {
    ui.renderLiveInspector(elements, { id:"conditional-event", name:"product_detail", sourceId:"event-history", captureTime:"2026-07-14T12:00:00Z", pageUrl:"https://shop.example/products/field-notebook", payload, rawInput:[], validation:result.state, validationDetails:{ issues:result.issues, evaluations:result.evaluations } }, actions);
    return elements.eventInspector.textContent;
  };
  const failedText = renderResult(failed, { page_type:"product_detail", currency:"EUR", oOrder:{ aProducts:[] } });
  const notApplicableDefaultText = renderResult(notApplicable, { page_type:"category", currency:"EUR", oOrder:{} });
  click(elements.eventInspector, "Show non-applicable properties");
  const notApplicableText = elements.eventInspector.textContent;
  const presentation = {
    issueCount:failed.issues.length,
    expectedPath:failed.issues[0].instancePath,
    conditionShown:failedText.includes("page_type equals product_detail"),
    consequenceShown:failedText.includes("item count at least 1"),
    triggerNotFailing:!failed.evaluations.some(({ propertyPath, status }) => propertyPath === "/page_type" && (status === "error" || status === "warning")),
    notApplicableHiddenByDefault:!notApplicableDefaultText.includes("not applicable"),
    notApplicableShown:notApplicableText.includes("not applicable"),
    notApplicableIssues:notApplicable.issues.length,
  };
  const reusable = { ...structuredClone(storedRule), id:"rule:reusable-products", name:"Reusable product detail products", version:1 };
  const lifecycleSchema = { ...activeSchema, attachedRules:[storedRule, reusable] };
  const exported = core.serializeSchemaLibraryExport([lifecycleSchema], [reusable]);
  const imported = JSON.parse(exported);
  localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify(imported.schemas));
  localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", JSON.stringify(imported.rules));
  const reloadedSchemas = core.restoreSchemaLibrary(localStorage.getItem("my-chrome-utilities.schema-library.v1"));
  const reloadedRules = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1"));
  const revisedReusable = { ...structuredClone(reloadedRules[0]), version:2, message:"Revised message", revisionHistory:[structuredClone(reloadedRules[0])] };
  const lifecycle = {
    attachmentIds:reloadedSchemas[0].attachedRules.map(({ id }) => id),
    ruleIds:reloadedRules.map(({ id }) => id),
    atomic:reloadedSchemas[0].attachedRules.every(({ conditionGroup, propertyPath, operator }) => Boolean(conditionGroup && propertyPath && operator)),
    typedValue:reloadedSchemas[0].attachedRules[0].conditionGroup.predicates[0].comparison,
    pinnedVersion:reloadedSchemas[0].attachedRules.find(({ id }) => id === reusable.id).version,
    revisedVersion:revisedReusable.version,
    revisedPreserved:JSON.stringify(revisedReusable.conditionGroup) === JSON.stringify(reusable.conditionGroup),
  };
  const correlatedRule = { id:"local:product-duration", name:"Duration when monthly price exists", version:1, propertyPath:"/products/*/duration", operator:"required", conditionGroup:{ operator:"All", predicates:[{ propertyPath:"/products/*/price_monthly", operator:"Exists", detectedType:"number" }] } };
  const correlatedSchema = { id:"schema:correlated-products", name:"Correlated products", version:1, document:{ type:"object", properties:{ products:{ type:"array", items:{ type:"object", properties:{ price_monthly:{}, duration:{ type:"number" } } } } } }, assignments:[], attachedRules:[correlatedRule] };
  const correlatedResult = (products) => core.validateWithSchema({ sourceId:"history", eventName:"product_view", payload:{ products }, rawInput:[] }, correlatedSchema, []);
  const correlatedCases = [
    ["number 29", "number 12", { price_monthly:29, duration:12 }],
    ["null", "missing", { price_monthly:null }],
    ["missing", "missing", {}],
    ["missing", "number 12", { duration:12 }],
  ].map(([priceMonthlyState, durationState, product]) => {
    const result = correlatedResult([product]); const evaluation = result.evaluations[0];
    return { priceMonthlyState, durationState, result:evaluation.status === "pass" ? "Passed" : evaluation.status === "not-applicable" ? "Not applicable" : "Failed", issues:result.issues.filter(({ instancePath }) => instancePath === "/products/0/duration").length };
  });
  const mixedResult = correlatedResult([{ price_monthly:29 }, {}, { duration:12 }, { price_monthly:49, duration:12 }]);
  const restoredCorrelated = core.restoreSchemaLibrary(core.serializeSchemaLibrary([correlatedSchema]))[0];
  const restoredResult = core.validateWithSchema({ sourceId:"history", eventName:"product_view", payload:{ products:[{ price_monthly:29 }] }, rawInput:[] }, restoredCorrelated, []);
  renderResult(mixedResult, { products:[{ price_monthly:29 }, {}, { duration:12 }, { price_monthly:49, duration:12 }] });
  click(elements.eventInspector, "Show non-applicable properties");
  const correlated = {
    cases:correlatedCases,
    mixed:mixedResult.evaluations.map(({ propertyPath, status }) => [propertyPath, status]),
    issues:mixedResult.issues.filter(({ instancePath }) => instancePath.endsWith("/duration")).map(({ instancePath, templatePath, conditionSummary }) => ({ instancePath, templatePath, conditionSummary })),
    rendered:Array.from(elements.eventInspector.querySelectorAll('[data-property-path^="/products/"][data-property-path$="/duration"]')).map(({ dataset, textContent }) => [dataset.propertyPath, textContent]),
    persisted:{ predicate:restoredCorrelated.attachedRules[0].conditionGroup.predicates[0].propertyPath, consequence:restoredCorrelated.attachedRules[0].propertyPath, issue:restoredResult.issues.find(({ instancePath }) => instancePath === "/products/0/duration")?.instancePath },
  };
  return { editor, stored:{ count:stored.workingDraft.attachedRules.length, rule:storedRule, summary:conditionalCore.conditionalRuleSummary({ conditionGroup:storedRule.conditionGroup, consequence:{ propertyPath:storedRule.propertyPath, operator:storedRule.operator, parameters:storedRule.parameters } }) }, evaluations, groups, truthGroups, predicateCases, invalidConfigurations, presentation, lifecycle, correlated };
})()`;

const schemaRulePropertyIdentityRuntime = `(async () => {
  const pause = (milliseconds = 10) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  const waitFor = async (predicate, label) => { for (let attempt=0; attempt<400; attempt+=1) { const value=predicate(); if(value)return value; await pause(); } throw new Error("Timed out waiting for "+label); };
  const q = (selector, root=document) => { const value=root.querySelector(selector); if (!value) throw new Error("Missing " + selector); return value; };
  const click = (root, label) => { const buttons=Array.from(root.querySelectorAll("button"));const value=buttons.find((button)=>button.textContent === label || button.textContent.startsWith(label)); if (!value) throw new Error("Missing action " + label + ". Available actions: " + JSON.stringify(buttons.map(({textContent,disabled})=>({text:textContent,disabled})))); value.click(); return value; };
  const runtimeErrors=[];
  addEventListener("error",(event)=>runtimeErrors.push(String(event.error ?? event.message)));
  addEventListener("unhandledrejection",(event)=>runtimeErrors.push(String(event.reason)));
  q("#data-layer-view-schemas").click(); const openPageView=()=>{ const item=Array.from(q("#schema-list").children).find((candidate)=>candidate.textContent.includes("Page view")); if(!item) throw new Error("Missing Page view schema"); click(item,"Edit working draft"); }; openPageView();
  const editor=q("#schema-editor"); const tree=q("#schema-property-tree");
  const row=(canonical)=>q('[data-schema-property-canonical-path="'+canonical+'"]',tree);
  const selectRow=async(canonical)=>{let target=row(canonical);if(target.getAttribute("aria-current")!=="true"){q(":scope > strong",target).click();await waitFor(()=>{const current=document.querySelector('[data-schema-property-canonical-path="'+canonical+'"]');return current?.getAttribute("aria-current")==="true"&&current.querySelector(".schema-property-add-rule");},"the selected canonical row "+canonical);target=row(canonical);}return target;};
  const identities=()=>Array.from(tree.querySelectorAll("[data-schema-property-canonical-path]")).map((item)=>item.dataset.schemaPropertyCanonicalPath);
  const stored=()=>JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")).find(({id})=>id==="schema-page-view");
  const settled=async(predicate,label)=>{const schemas=await __waitForDurableSchemaObservation((values)=>{const current=values.find(({id})=>id==="schema-page-view");return Boolean(current&&predicate(current));},label);await waitFor(()=>editor.getAttribute("aria-busy")!=="true",label+" presentation");return schemas.find(({id})=>id==="schema-page-view");};
  const documentBytes=()=>JSON.stringify(stored().workingDraft.document);
  const removeRule=async(id)=>{ const current=await selectRow("/page_type");const details=q("details[data-attached-rules]",current);details.open=true;click(q('[data-rule-id="'+id+'"]',details),"Remove");await settled((schema)=>!(schema.workingDraft?.attachedRules??[]).some(({id:ruleId})=>ruleId===id),"removal of rule "+id); };
  const initialDocument=documentBytes(); const initialIdentities=identities();
  q('button[aria-label="Add rule for page_levels"]',await selectRow("/page_levels")).click();
  const arrayPicker={ heading:q("#schema-property-rule-picker-heading").textContent, itemCount:Array.from(q("#schema-property-rule-picker").querySelectorAll("button")).some(({textContent})=>textContent==="Item count"), regularExpression:Array.from(q("#schema-property-rule-picker").querySelectorAll("button")).some(({textContent})=>textContent==="Regular expression") };
  q("#schema-property-rule-picker").dispatchEvent(new Event("cancel",{cancelable:true}));
  await selectRow("/page_type");
  const initial={ identities:initialIdentities, pageTypeRows:tree.querySelectorAll('[data-schema-property-canonical-path="/page_type"]').length, pageLevelRows:tree.querySelectorAll('[data-schema-property-canonical-path="/page_levels/0"]').length, nestedRows:tree.querySelectorAll('[data-schema-property-canonical-path="/products/*/name"]').length, inheritedRows:tree.querySelectorAll('[data-schema-property-canonical-path="/customer/id"]').length, metadata:row("/page_type").querySelector(".schema-property-metadata").textContent, documentation:row("/page_type").querySelector(".schema-property-documentation").textContent, arrayPicker };
  const page=row("/page_type"); page.querySelector("details[data-attached-rules]").open=true; page.setAttribute("aria-current","true"); editor.style.height="240px"; editor.style.overflow="auto"; tree.style.height="180px"; tree.style.overflow="auto"; editor.scrollTop=31; tree.scrollTop=19;
  q('button[aria-label="Add rule for page_type"]',page).click(); click(q("#schema-property-rule-picker"),"Required"); click(q("#schema-property-rule-picker"),"Create rule");
  const requiredFocus=document.activeElement?.getAttribute("aria-label");
  const afterRequiredStored=await settled((schema)=>(schema.workingDraft?.attachedRules??[]).some(({propertyPath,operator})=>propertyPath==="/page_type"&&operator==="required"),"the required /page_type rule"); const afterRequiredRow=row("/page_type");
  const required={ rules:afterRequiredStored.workingDraft.attachedRules.filter(({propertyPath,operator})=>propertyPath==="/page_type" && operator==="required").length, documentUnchanged:documentBytes()===initialDocument, identitiesUnchanged:JSON.stringify(identities())===JSON.stringify(initialIdentities), count:afterRequiredRow.textContent.includes("1 active rules"), rows:tree.querySelectorAll('[data-schema-property-canonical-path="/page_type"]').length, selected:afterRequiredRow.getAttribute("aria-current"), expanded:afterRequiredRow.querySelector("details[data-attached-rules]").open, editorScroll:editor.scrollTop, treeScroll:tree.scrollTop, focus:requiredFocus };
  await removeRule(afterRequiredStored.workingDraft.attachedRules.find(({operator})=>operator==="required").id);
  q('button[aria-label="Add rule for page_type"]',await selectRow("/page_type")).click();try{click(q("#schema-property-rule-picker"),"Approved page types version 2");}catch(error){throw new Error(error.message+" Identity diagnostics: "+JSON.stringify({schema:stored(),rules:JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1")??"[]"),heading:q("#schema-property-rule-picker-heading").textContent}));}
  const afterReusable=await settled((schema)=>(schema.workingDraft?.attachedRules??[]).some(({id,propertyPath})=>id==="rule:approved-page-types"&&propertyPath==="/page_type"),"the reusable /page_type rule");
  const reusable={ rules:afterReusable.workingDraft.attachedRules.filter(({id,version,propertyPath})=>id==="rule:approved-page-types" && version===2 && propertyPath==="/page_type").length, documentUnchanged:documentBytes()===initialDocument, count:row("/page_type").textContent.includes("1 active rules") };
  q('button[aria-label="Add rule for page_type"]',row("/page_type")).click();
  const retryButton=Array.from(q("#schema-property-rule-picker").querySelectorAll("button")).find((button)=>button.textContent.includes("Approved page types version 2"));
  reusable.retry={ disabled:retryButton?.disabled, label:retryButton?.textContent }; q("#schema-property-rule-picker").dispatchEvent(new Event("cancel",{cancelable:true}));
  await removeRule("rule:approved-page-types");
  q('button[aria-label="Add rule for page_type"]',await selectRow("/page_type")).click(); click(q("#schema-property-rule-picker"),"Required"); click(q("#schema-property-rule-picker"),"Create rule");
  await settled((schema)=>(schema.workingDraft?.attachedRules??[]).some(({propertyPath,operator})=>propertyPath==="/page_type"&&operator==="required"),"the second required /page_type rule");
  q('button[aria-label="Add rule for page_type"]',await selectRow("/page_type")).click(); click(q("#schema-property-rule-picker"),"Allowed values");
  const allowed=q("#schema-local-rule-allowed-value-1"); allowed.value="homepage"; allowed.dispatchEvent(new Event("input",{bubbles:true})); click(q("#schema-property-rule-picker"),"Create rule");
  await settled((schema)=>(schema.workingDraft?.attachedRules??[]).some(({propertyPath,operator})=>propertyPath==="/page_type"&&operator==="allowed-values"),"the distinct allowed-values /page_type rule");
  const distinct={ rules:stored().workingDraft.attachedRules.filter(({propertyPath})=>propertyPath==="/page_type").map(({id,operator})=>({id,operator})), count:row("/page_type").textContent.includes("2 active rules"), documentUnchanged:documentBytes()===initialDocument, oneRow:tree.querySelectorAll('[data-schema-property-canonical-path="/page_type"]').length===1 };
  await removeRule(distinct.rules.find(({operator})=>operator==="allowed-values").id);
  q('button[aria-label="Add rule for page_type"]',await selectRow("/page_type")).click(); click(q("#schema-property-rule-picker"),"Approved page types version 2");
  await settled((schema)=>(schema.workingDraft?.attachedRules??[]).some(({id,propertyPath})=>id==="rule:approved-page-types"&&propertyPath==="/page_type"),"the restored reusable /page_type rule");
  const targets=[];
  for (const [canonical,display] of [["/page_levels/0","page_levels.0"],["/products/*/name","products.*.name"],["/customer/id","customer.id"]]) {
    const before=documentBytes(); const beforeIdentities=identities(); const target=await selectRow(canonical); const metadata=target.querySelector(".schema-property-metadata").textContent; const index=beforeIdentities.indexOf(canonical);
    q('button[aria-label="Add rule for '+display+'"]',target).click(); click(q("#schema-property-rule-picker"),"Compatible strings version 1");
    await settled((schema)=>(schema.workingDraft?.attachedRules??[]).some(({id,propertyPath})=>id==="rule:compatible-strings"&&propertyPath===canonical),"the compatible reusable rule at "+canonical);
    targets.push({ canonical, attached:stored().workingDraft.attachedRules.filter(({id,propertyPath})=>id==="rule:compatible-strings" && propertyPath===canonical).length, documentUnchanged:documentBytes()===before, oneRow:tree.querySelectorAll('[data-schema-property-canonical-path="'+canonical+'"]').length===1, metadata:row(canonical).querySelector(".schema-property-metadata").textContent===metadata, position:identities().indexOf(canonical)===index });
  }
  q("#close-schema-editor").click(); openPageView();
  const reopened={ documentUnchanged:documentBytes()===initialDocument, pageTypeRows:document.querySelectorAll('[data-schema-property-canonical-path="/page_type"]').length, pageTypeRules:stored().workingDraft.attachedRules.filter(({propertyPath})=>propertyPath==="/page_type").length, identities:identities() };
  return { initial,required,reusable,distinct,targets,reopened,runtimeErrors };
})()`;

const canonicalDeclaredPropertyValidationRuntime = `(async () => {
  const pause=(milliseconds=0)=>new Promise((resolve)=>setTimeout(resolve,milliseconds)),waitFor=async(predicate,label)=>{for(let attempt=0;attempt<400;attempt+=1){const value=predicate();if(value)return value;await pause(10);}throw new Error("Timed out waiting for "+label);};
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const click=(root,label)=>{const value=Array.from(root.querySelectorAll("button")).find((button)=>button.textContent===label||button.textContent.startsWith(label));if(!value)throw new Error("Missing action "+label);value.click();return value;};
  const runtimeErrors=[]; addEventListener("error",(event)=>runtimeErrors.push(String(event.error??event.message))); addEventListener("unhandledrejection",(event)=>runtimeErrors.push(String(event.reason)));
  const verification=await import("/data-layer-schema-verification.js");
  const stored=()=>JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"));
  const child=()=>stored()[1]; const openPageView=()=>{const item=Array.from(q("#schema-list").children).find((candidate)=>candidate.textContent.includes("Generic pageview"));if(!item)throw new Error("Missing Generic pageview");click(item,"Edit working draft");};
  const event=(payload)=>({sourceId:"history",eventName:"pageview",payload,rawInput:[]});
  const draftSchema=()=>{const schemas=stored();const current=schemas[1];return {...current,document:current.workingDraft.document,attachedRules:current.workingDraft.attachedRules,parentSchemaId:current.workingDraft.parentSchemaId??current.parentSchemaId};};
  const validate=(payload,schema=draftSchema(),schemas=[stored()[0],schema])=>verification.validateWithSchema(event(payload),schema,schemas);
  q("#data-layer-view-schemas").click();openPageView();
  const checkbox=()=>q("#schema-only-declared-properties");const propertiesBefore=JSON.stringify(child().workingDraft.document.properties);checkbox().checked=true;checkbox().dispatchEvent(new Event("change",{bubbles:true}));await __waitForDurableSchemaObservation((schemas)=>schemas[1]?.workingDraft?.document?.additionalProperties===false,"the declared-property policy");await waitFor(()=>q("#schema-editor").getAttribute("aria-busy")!=="true","the declared-property policy presentation");
  const declared=validate({page_type:"product",login_status:"logged in",page_levels:["product"]});
  const extra=validate({page_type:"product",login_status:"logged in",page_levels:["product"],debug:true});
  const policy={checked:checkbox().checked,stored:child().workingDraft.document.additionalProperties===false,propertiesUnchanged:JSON.stringify(child().workingDraft.document.properties)===propertiesBefore,declaredIssues:declared.issues.filter(({message})=>message==="Undeclared property").map(({instancePath})=>instancePath),extraIssues:extra.issues.filter(({message})=>message==="Undeclared property").map(({instancePath,expected,actual})=>({instancePath,expected,actual}))};
  const make=(name,document,parentSchemaId)=>({id:"case:"+name,name,version:1,document,assignments:[],...(parentSchemaId?{parentSchemaId}:{})});
  const representationCases=[];
  for(const [name,document,payload,canonical] of [
    ["nested",{type:"object",additionalProperties:false,properties:{page_type:{type:"string"}}},{page_type:"product"},"/page_type"],
    ["path-keyed",{type:"object",additionalProperties:false,properties:{"/page_type":{type:"string"}}},{page_type:"product"},"/page_type"],
    ["flat-array",{type:"object",additionalProperties:false,properties:{"/page_levels":{type:"array"},"/page_levels/0":{type:"string"}}},{page_levels:["product"]},"/page_levels"],
  ]){const schema=make(name,document);const result=validate(payload,schema,[schema]);representationCases.push({name,canonical,undeclared:result.issues.filter(({message})=>message==="Undeclared property").length,documentUnchanged:JSON.stringify(schema.document)===JSON.stringify(document)});}
  const pageCases={};
  for(const [name,payload] of [["missing",{}],["numeric",{page_type:42}],["disallowed",{page_type:"internal"}],["allowed",{page_type:"product"}]]){const result=validate(payload);pageCases[name]={issues:result.issues.filter(({instancePath})=>instancePath==="/page_type").map(({message})=>message),undeclared:result.issues.some(({instancePath,message})=>instancePath==="/page_type"&&message==="Undeclared property"),evaluations:(result.evaluations??[]).filter(({propertyPath})=>propertyPath==="/page_type").map(({propertyPath,rule,ruleVersion})=>({propertyPath,rule,ruleVersion}))};}
  const parentBytes=JSON.stringify(stored()[0].document);const childBytes=JSON.stringify(child().workingDraft.document);const inherited=validate({site_id:"otelo",page_type:"product",debug:true});
  const inheritance={undeclared:inherited.issues.filter(({message})=>message==="Undeclared property").map(({instancePath})=>instancePath),parentUnchanged:JSON.stringify(stored()[0].document)===parentBytes,childUnchanged:JSON.stringify(child().workingDraft.document)===childBytes};
  checkbox().checked=false;checkbox().dispatchEvent(new Event("change",{bubbles:true}));await __waitForDurableSchemaObservation((schemas)=>schemas[1]?.workingDraft?.document?.additionalProperties===undefined,"the open declared-property policy");await waitFor(()=>q("#schema-editor").getAttribute("aria-busy")!=="true","the open declared-property policy presentation");const openResult=validate({page_type:"product",debug:true});const disabled={stored:child().workingDraft.document.additionalProperties===undefined,undeclared:openResult.issues.filter(({message})=>message==="Undeclared property").length,ruleActive:(openResult.evaluations??[]).some(({propertyPath,status})=>propertyPath==="/page_type"&&status==="pass")};
  checkbox().checked=true;checkbox().dispatchEvent(new Event("change",{bubbles:true}));await __waitForDurableSchemaObservation((schemas)=>schemas[1]?.workingDraft?.document?.additionalProperties===false,"the restored declared-property policy");await waitFor(()=>!q("#save-schema").disabled,"the declared-property publish action");q("#save-schema").click();q("#confirm-schema-revision").click();const published=(await __waitForDurableSchemaObservation((schemas)=>schemas[1]?.version===4&&!schemas[1].workingDraft&&schemas[1].document.additionalProperties===false,"the declared-property publication"))[1];const publication={version:published.version,closed:!published.workingDraft,stored:published.document.additionalProperties===false,propertiesUnchanged:JSON.stringify(published.document.properties)===propertiesBefore,result:q("#schema-result").textContent};
  q("#data-layer-view-live").click();const feed=Array.from(q("#live-event-feed").querySelectorAll("button"));const feedRows=feed.map(({textContent,dataset})=>({textContent,eventId:dataset.eventId}));const extraButton=feed.find((button)=>button.dataset.eventId==="event:extra");if(!extraButton)throw new Error("Missing extra event");extraButton.click();
  const debugRow=q('.live-validation-property[data-property-path="/debug"]');const live={feedRows,summary:q("#live-inspector-validation-summary").textContent,debug:q(".live-property-status",debugRow).textContent,debugRows:document.querySelectorAll('.live-validation-property[data-property-path="/debug"]').length};
  q("#data-layer-view-schemas").click();openPageView();const reopened={checked:q("#schema-only-declared-properties").checked,propertiesUnchanged:JSON.stringify(child().document.properties)===propertiesBefore};
  return{policy,representationCases,pageCases,inheritance,disabled,publication,live,reopened,runtimeErrors};
})()`;

const recursiveDeclaredPropertyValidationRuntime = `(async () => {
  const pause=(milliseconds=0)=>new Promise((resolve)=>setTimeout(resolve,milliseconds));
  const waitFor=async(predicate,label)=>{for(let attempt=0;attempt<400;attempt+=1){const value=predicate();if(value)return value;await pause(10);}throw new Error("Timed out waiting for "+label);};
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const click=(root,label)=>{const value=Array.from(root.querySelectorAll("button")).find((button)=>button.textContent===label||button.textContent.startsWith(label));if(!value)throw new Error("Missing action "+label);value.click();return value;};
  const runtimeErrors=[];addEventListener("error",(event)=>runtimeErrors.push(String(event.error??event.message)));addEventListener("unhandledrejection",(event)=>runtimeErrors.push(String(event.reason)));
  const verification=await import("/data-layer-schema-verification.js");const publicationModule=await import("/data-layer-schema-publication-refresh.js");const observer=await import("/data-layer-live-observer.js");const queries=await import("/data-layer-event-feed-query.js");const defects=await import("/data-layer-defect-library.js");const sessions=await import("/data-layer-saved-sessions.js");
  const stored=()=>JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"));const current=()=>stored()[0];const event=(payload)=>({sourceId:"history",eventName:"pageview",payload,rawInput:["pageview",payload]});
  const draftSchema=()=>{const schema=current();return{...schema,document:schema.workingDraft.document,attachedRules:schema.workingDraft.attachedRules};};const validate=(payload,schema=draftSchema())=>verification.validateWithSchema(event(payload),schema,[schema]);
  const base={page_type:"product",commerce:{currency:"EUR",order:{id:"1"}},products:[{product_name:"phone"},{product_name:"case"}]};
  q("#data-layer-view-schemas").click();const row=Array.from(q("#schema-list").children).find((item)=>item.textContent.includes("Generic pageview"));if(!row)throw new Error("Missing Generic pageview");click(row,"Edit working draft");const checkbox=q("#schema-only-declared-properties");const draftBytes=JSON.stringify(current().workingDraft.document);const valid=validate(base);
  const cases=[
    ["/commerce/debug",{...base,commerce:{...base.commerce,debug:true}}],
    ["/commerce/order/internal_id",{...base,commerce:{...base.commerce,order:{...base.commerce.order,internal_id:"internal"}}}],
    ["/products/0/debug",{...base,products:[{...base.products[0],debug:true},base.products[1]]}],
  ].map(([pointer,payload])=>{const issues=validate(payload).issues.filter(({message})=>message==="Undeclared property");return{pointer,count:issues.length,issue:issues[0]};});
  const repeated=validate({...base,products:[{...base.products[0],debug:true},{...base.products[1],debug:false,metadata:{internal_id:"1",source:"feed"}}]}).issues.filter(({message})=>message==="Undeclared property").map(({instancePath,actual})=>({instancePath,actual}));
  const representations=[];for(const [name,document,payload] of [
    ["nested",current().workingDraft.document,base],
    ["path-keyed",{type:"object",additionalProperties:false,properties:{"/commerce/order/id":{type:"string"},"/products/*/product_name":{type:"string"}}},{commerce:{order:{id:"1"}},products:[{product_name:"phone"},{product_name:"case"}]}],
  ]){const schema={id:"case:"+name,name,version:1,document,assignments:[]};const bytes=JSON.stringify(document);representations.push({name,issues:verification.validateWithSchema(event(payload),schema,[schema]).issues,unchanged:bytes===JSON.stringify(document)});}
  const extras={...base,root_extra:true,commerce:{...base.commerce,currency:"GBP",debug:true},products:[{...base.products[0],debug:true},base.products[1]]};checkbox.checked=false;checkbox.dispatchEvent(new Event("change",{bubbles:true}));await globalThis.__waitForDurableSchemaObservation((schemas)=>schemas.find(({id})=>id==="schema-generic-pageview")?.workingDraft?.document?.additionalProperties===undefined,"the open recursive declared-property policy");await waitFor(()=>q("#schema-editor").getAttribute("aria-busy")!=="true","the open recursive policy presentation");const disabledResult=validate(extras);const disabled={stored:current().workingDraft.document.additionalProperties===undefined,undeclared:disabledResult.issues.filter(({message})=>message==="Undeclared property").length,ruleActive:disabledResult.issues.some(({instancePath,message})=>instancePath==="/commerce/currency"&&message==="Value is not allowed")};
  const archived=sessions.saveCompletedSession(sessions.createSavedSessionLibrary(),{id:"session:old",pageScope:"https://shop.example/products",startedAt:"2026-07-15T15:00:00Z",endedAt:"2026-07-15T15:01:00Z",events:[{id:"saved:event",sourceId:"history",sourceName:"Event history",name:"pageview",payload:base,rawInput:[],validation:"Valid",validationDetails:{issues:[],evaluations:[],schema:{id:current().id,name:current().name,version:4}}}]},"Before recursive policy");const archivedBytes=sessions.serializeSavedSessionLibrary(archived);
  checkbox.checked=true;checkbox.dispatchEvent(new Event("change",{bubbles:true}));await globalThis.__waitForDurableSchemaObservation((schemas)=>schemas.find(({id})=>id==="schema-generic-pageview")?.workingDraft?.document?.additionalProperties===false,"the restored recursive declared-property policy");await waitFor(()=>q("#schema-editor").getAttribute("aria-busy")!=="true","the restored recursive policy presentation");const enabledResult=validate(extras);const enabled={stored:current().workingDraft.document.additionalProperties===false,paths:enabledResult.issues.filter(({message})=>message==="Undeclared property").map(({instancePath})=>instancePath),draftUnchanged:JSON.stringify(current().workingDraft.document)===draftBytes};
  await waitFor(()=>q("#schema-editor").getAttribute("aria-busy")!=="true"&&!q("#save-schema").disabled,"recursive declared-property publication readiness");q("#save-schema").click();await waitFor(()=>q("#schema-revision-review").open&&!q("#confirm-schema-revision").disabled,"recursive declared-property publication review");q("#confirm-schema-revision").click();
  const published=(await globalThis.__waitForDurableSchemaObservation((schemas)=>schemas.some(({id,version,document,workingDraft})=>id==="schema-generic-pageview"&&version===5&&document.additionalProperties===false&&!workingDraft),"recursive declared-property publication"))
    .find(({id})=>id==="schema-generic-pageview");
  q("#data-layer-view-live").click();const feedButtons=Array.from(q("#live-event-feed").querySelectorAll("button"));const extraButton=feedButtons.find(({dataset})=>dataset.eventId==="event:nested-extra");if(!extraButton)throw new Error("Missing nested-extra event");extraButton.click();await pause();const detail=q("#live-event-inspector").textContent;
  const liveEvents=[
    {id:"event:declared",name:"pageview",sourceId:"history",sourceName:"Event history",captureTime:"2026-07-15T15:02:00Z",pageUrl:"https://shop.example/products",payload:base,rawInput:[]},
    {id:"event:nested-extra",name:"pageview",sourceId:"history",sourceName:"Event history",captureTime:"2026-07-15T15:02:01Z",pageUrl:"https://shop.example/products",payload:extras,rawInput:[]},
  ];const state={...observer.createLiveObserverState({pageUrl:"https://shop.example/products",sources:[]}),events:liveEvents};const refreshed=publicationModule.revalidateCurrentLiveSession(state,[published],{}).state.events;const refreshedExtra=refreshed.find(({id})=>id==="event:nested-extra");const queryMatches=queries.filterEventsByQuery(refreshed,{conditions:[{id:"nested",field:"Affected property",operator:"is",values:["commerce.debug"]}]}).map(({id})=>id);const nestedIssue=defects.currentDefectIssues(refreshedExtra).find(({concretePath})=>concretePath==="/commerce/debug");if(!nestedIssue)throw new Error("Recursive declared-property publication omitted the /commerce/debug issue");const defect=defects.createValidationDefect({id:"defect:nested",now:"2026-07-15T15:03:00Z",report:{},issues:[nestedIssue]});
  const publication={version:published.version,result:q("#schema-result").textContent,feed:feedButtons.map(({dataset,textContent})=>({id:dataset.eventId,text:textContent})),detail,refreshed:refreshed.map(({id,validation,validationDetails})=>({id,validation,paths:validationDetails.issues.filter(({message})=>message==="Undeclared property").map(({instancePath})=>instancePath)})),queryMatches,defectMatch:defects.eventContainsDefectIssue(refreshedExtra,defect),archivedUnchanged:archivedBytes===sessions.serializeSavedSessionLibrary(archived),archivedVersion:archived.sessions[0].events[0].validationDetails.schema.version};
  return{checkbox:checkbox.checked,valid:{issues:valid.issues,canonical:["/commerce/order/id","/products/*/product_name"]},cases,repeated,representations,disabled,enabled,publication,runtimeErrors};
})()`;

const recursivePropertyValidationRuntime = `(async () => {
  const ui = await import("/data-layer-live-observer-ui.js");
  const actionCore = await import("/data-layer-live-inspector-actions.js");
  const guidedUi = await import("/data-layer-guided-validation-ui.js");
  const targets = await import("/data-layer-recursive-property-tree.js");
  const products = Array.from({ length:6 }, (_, index) => ({ sku:"SKU-" + (index + 1), name:"Product " + (index + 1), price:index < 4 ? index + 1 : String(index + 1), productType:index === 0 ? "unknown" : "standard", pricing:{ amount:index + .5 }, details:[{ code:"A-" + index }, { code:"B-" + index, sku:"DETAIL-" + index }], "1":"number-name", "*":"literal-star", "a/b":"slash-name" }));
  const payload = { oOrder:{ orderId:"ORDER-1", aProducts:products, "a/b":{ "~name":"escaped" } }, orders:[{ items:[{ sku:"nested" }] }], tags:["one","two","three"], matrices:[[1,2],[3]], discounts:[] };
  const host = document.createElement("section"); host.innerHTML = '<section id="recursive-browser-live"><section id="live-event-inspector"></section><button id="back-to-events">Back</button><output id="live-session-message"></output><section id="guided-validation-flow"></section></section>'; document.body.append(host);
  const elements = ui.findLiveObserverElements(host);
  const event = { id:"event:order", name:"order_complete", sourceId:"event-history", sourceName:"Event history", captureTime:"2026-07-14T08:00:00Z", pageUrl:"https://shop.example/checkout", destination:"queue.history", provenance:"captured:event-history", payload, rawInput:[], validation:"2 errors and 1 warning", validationDetails:{ issues:[], evaluations:[
    { propertyPath:"oOrder.orderId", status:"pass", message:"Order id present", expected:"string", actual:"ORDER-1", rule:"Order id", ruleVersion:1, severity:"error", schemaName:"Product detail", schemaVersion:3 },
    { propertyPath:"oOrder.aProducts.*.price", status:"warning", message:"Mixed price type", expected:"Number", actual:"mixed", rule:"Price", ruleVersion:1, severity:"warning", schemaName:"Product detail", schemaVersion:3 },
    { propertyPath:"oOrder.aProducts.*.productType", status:"error", message:"Unknown product type", expected:"standard", actual:"unknown", rule:"Product type", ruleVersion:1, severity:"error", schemaName:"Product detail", schemaVersion:3 },
  ] } };
  let origin;
  const flow = guidedUi.createGuidedValidationFlow(host.querySelector("#guided-validation-flow"), { schemaCandidates:()=>[], publish:()=>{}, close:()=>origin?.focus({ preventScroll:true }) });
  const actions = actionCore.createLiveInspectorActions({ currentPageUrl:()=>event.pageUrl, writeClipboard:async()=>{}, storeTemplate:()=>{}, addPropertyValidation:(selected,path,trigger)=>{ origin=trigger; flow.openProperty({ id:selected.id, name:selected.name, sourceId:selected.sourceId, pageUrl:selected.pageUrl, payload:selected.payload }, path); }, validationState:()=>"Valid", updateValidation:()=>{}, manualSchemaChoices:()=>[], selectManualSchema:()=>{} });
  ui.renderLiveInspector(elements, event, actions);
  const inspector = elements.eventInspector;
  const row = (path) => inspector.querySelector('.live-validation-property[data-property-path="' + path + '"]');
  const paths = Array.from(inspector.querySelectorAll(".live-validation-property")).map((item) => item.dataset.propertyPath);
  const array = row("/oOrder/aProducts"); const every = row("/oOrder/aProducts/*"); const sku = row("/oOrder/aProducts/*/sku"); const price = row("/oOrder/aProducts/*/price"); const concreteSku = row("/oOrder/aProducts/1/sku");
  if (!array || !every || !sku || !price) throw new Error("Missing recursive rows: " + paths.join(", "));
  const oOrderDisclosure = inspector.querySelector('details[data-property-path="/oOrder"]'); oOrderDisclosure.open = true;
  const search = inspector.querySelector("#live-property-search"); search.value = "pricing amount"; search.dispatchEvent(new Event("input", { bubbles:true }));
  const searchOpen = Array.from(inspector.querySelectorAll("details[open]")).map((item) => item.dataset.propertyPath).filter(Boolean);
  search.value = ""; search.dispatchEvent(new Event("input", { bubbles:true }));
  const restoredOpen = Array.from(inspector.querySelectorAll("details[open]")).map((item) => item.dataset.propertyPath).filter(Boolean);
  for (const path of ["/oOrder", "/oOrder/aProducts", "/oOrder/aProducts/*"]) inspector.querySelector('details[data-property-path="' + path + '"]')?.setAttribute("open", "");
  const skuValue = sku.querySelector(":scope > .live-validation-property-row > span"); const skuStatus = sku.querySelector(".live-property-status"); const skuAdd = sku.querySelector(".live-property-add-validation");
  const valueRect = skuValue.getBoundingClientRect(); const statusRect = skuStatus.getBoundingClientRect(); const addRect = skuAdd.getBoundingClientRect();
  skuAdd.click();
  const draft = flow.currentDraft();
  const advanced = host.querySelector("#guided-advanced-settings"); advanced.open = true; Array.from(advanced.querySelectorAll("button")).find((button) => button.textContent === "Advanced Edit target path").click();
  const dialog = host.querySelector("#guided-target-path-editor"); const expression = host.querySelector("#guided-target-expression");
  const initialTarget = { expression:expression.value, segments:Array.from(host.querySelectorAll("#guided-target-segments li")).map((item) => item.textContent), preview:host.querySelector("#guided-target-preview").textContent, actions:Array.from(dialog.querySelectorAll("button")).map((button) => button.textContent) };
  expression.value = '$["oOrder"]["aProducts"][*]["details"][1]["sku"]'; expression.dispatchEvent(new Event("input", { bubbles:true }));
  const changedTarget = host.querySelector("#guided-target-preview").textContent;
  Array.from(dialog.querySelectorAll("button")).find((button) => button.textContent === "Reset to observed path").click();
  const resetTarget = { expression:expression.value, preview:host.querySelector("#guided-target-preview").textContent };
  Array.from(dialog.querySelectorAll("button")).find((button) => button.textContent === "Cancel").click();
  Array.from(host.querySelector("#guided-validation-flow").querySelectorAll("button")).find((button) => button.textContent === "Cancel").click();
  const inspections = {
    valid:targets.inspectValidationTarget(payload, "/oOrder/aProducts/*/sku"),
    mixed:targets.inspectValidationTarget(payload, "/oOrder/aProducts/*/price"),
    negative:targets.inspectValidationTarget(payload, "/oOrder/aProducts/-1"),
    decimal:targets.inspectValidationTarget(payload, "/oOrder/aProducts/1.5"),
    nonArray:targets.inspectValidationTarget(payload, "/oOrder/orderId/*"),
    missingScope:targets.inspectValidationTarget(payload, "/oOrder/aProducts/sku"),
    unobserved:targets.inspectValidationTarget(payload, '$["oOrder"]["aProducts"][*]["details"][1]["missing"]'),
  };
  const missingSkuPayload = structuredClone(payload); delete missingSkuPayload.oOrder.aProducts[0].sku;
  const missingSkuTree = targets.buildRecursivePropertyTree(missingSkuPayload); const flattenTree = (nodes) => nodes.flatMap((node) => [node, ...flattenTree(node.children), ...flattenTree(node.specificItems)]); const missingSku = flattenTree(missingSkuTree).find((node) => node.path === "/oOrder/aProducts/*/sku");
  const observation = {
    width:innerWidth,
    hierarchy:{ paths, arraySummary:array.querySelector(":scope > .live-validation-property-row > span").textContent, everySummary:every.querySelector(":scope > .live-validation-property-row > span").textContent, skuSummary:sku.querySelector(":scope > .live-validation-property-row > span").textContent, missingSkuSummary:missingSku.summary, priceSummary:price.querySelector(":scope > .live-validation-property-row > span").textContent, concrete:Boolean(concreteSku), nestedSku:paths.includes("/orders/*/items/*/sku"), empty:row("/discounts").textContent.includes("No item structure was observed"), specific:Array.from(inspector.querySelectorAll(".live-property-specific-items .live-validation-property")).some((item) => item.dataset.propertyPath === "/oOrder/aProducts/1") },
    search:{ open:searchOpen, restored:restoredOpen },
    layout:{ actionsSeparate:statusRect.top >= valueRect.bottom - 1 && addRect.top >= valueRect.bottom - 1, actionWidths:[statusRect.width,addRect.width], noOverflow:inspector.scrollWidth <= inspector.clientWidth },
    entry:{ stage:draft.stage, path:draft.property.path, detectedType:draft.property.detectedType, propertyStageAbsent:!host.querySelector('input[name="guided-property"]'), eventActions:Array.from(inspector.querySelectorAll(".live-inspector-actions button")).map((button) => button.textContent), statusIsSeparate:skuStatus !== skuAdd, statuses:{ orderId:row("/oOrder/orderId").querySelector(".live-property-status").textContent, sku:skuStatus.textContent, price:price.querySelector(".live-property-status").textContent, productType:row("/oOrder/aProducts/*/productType").querySelector(".live-property-status").textContent }, focusedAfterCancel:document.activeElement === skuAdd },
    target:{ initial:initialTarget, changed:changedTarget, reset:resetTarget, inspections, parsed:targets.parseTargetExpression('$["oOrder"]["aProducts"][0]["1"]').map((segment) => [segment.kind,segment.value]), literalStar:targets.normalizeTargetExpression('$["oOrder"]["aProducts"][0]["*"]', payload), wildcard:targets.normalizeTargetExpression('/oOrder/aProducts/*', payload), slashArray:targets.normalizeTargetExpression('/oOrder/aProducts/*/details/1', payload), slashEscaped:targets.normalizeTargetExpression('/oOrder/a~1b/~0name', payload) },
  };
  host.remove(); return observation;
})()`;

const liveValidationVisualsRuntime = `(async () => {
  const ui = await import("/data-layer-live-observer-ui.js");
  const host = document.createElement("section"); host.innerHTML = '<section id="data-layer-panel-live"><ul id="live-source-statuses"></ul><section id="live-event-list"><ul id="live-event-feed"></ul></section><section id="live-event-inspector"></section><button id="back-to-events">Back to events</button><output id="live-session-message"></output></section>';
  document.body.append(host);
  const elements = ui.findLiveObserverElements(host);
  const evaluation = (propertyPath, status, message, rule, severity="error") => ({ propertyPath, status, message, expected:"expected value", actual:"actual value", rule, ruleVersion:2, severity, schemaName:"Checkout schema", schemaVersion:4 });
  const issue = (instancePath, message, severity="error", rule="Schema rule v1", expected="expected value", actual="actual value") => ({ instancePath, message, expected, actual, schemaName:"Checkout schema", schemaVersion:4, schemaLocation:"#/rules", rule, severity, origin:"Checkout schema v4" });
  const details = {
    schema:{ id:"schema:checkout:4", name:"Checkout schema", version:4 },
    assignment:{ id:"assignment:checkout", name:"Checkout pages", sourceId:"event-history", eventName:"purchase", target:"payload", domainCondition:"shop.example", enabled:true },
    evaluations:[
      evaluation("currency", "pass", "Currency is allowed", "Known currencies"), evaluation("currency", "pass", "Currency is ISO", "ISO currencies"),
      evaluation("page_title", "pass", "Title is present", "Required title"), evaluation("page_title", "warning", "Prefer a concise title", "Title guidance", "warning"),
      evaluation("page_type", "pass", "Page type is present", "Required page type"), evaluation("page_type", "warning", "Prefer checkout", "Page type guidance", "warning"), { ...evaluation("page_type", "error", "Page type is invalid", "Known page types"), expected:"checkout", actual:"legacy" },
      evaluation("commerce.order.id", "error", "Order id is invalid", "Order id"), evaluation("commerce.order.total", "warning", "Total is unusual", "Order total", "warning"), evaluation("commerce.currency", "warning", "Currency is unusual", "Commerce currency", "warning"),
    ],
    issues:[
      issue("/page_type", "Page type is invalid", "error", "Known page types v2", "checkout", "legacy"),
      issue("/page_title", "Prefer a concise title", "warning", "Title guidance v2", "short text", "A very long title"),
      issue("/commerce/order/id", "Order id is invalid", "error", "Order id v2"), issue("/commerce/order/total", "Total is unusual", "warning", "Order total v2"), issue("/commerce/currency", "Currency is unusual", "warning", "Commerce currency v2"),
      issue("/order_id", "Required property", "error", "Required fields v1", "string", "missing"),
      issue("", "Assignment requires consent", "error", "Consent pairing v1"), issue("", "Currency conflicts with country", "warning", "Country currency v1"),
    ],
  };
  const base = { sourceId:"event-history", sourceName:"Event history", captureTime:"2026-07-13T10:00:00Z", pageUrl:"https://shop.example/checkout", destination:"queue.history", provenance:"captured:event-history", rawInput:[] };
  const events = [
    { ...base, id:"valid", name:"pageview", validation:"Valid", payload:{} },
    { ...base, id:"warning", name:"checkout", validation:"2 warnings", payload:{} },
    { ...base, id:"error", name:"purchase", validation:"2 errors and 1 warning", payload:{ page_path:"/checkout", currency:"EUR", page_title:"A very long title", page_type:"legacy", commerce:{ order:{ id:"bad", total:999 }, currency:"ZZZ" }, sibling:"safe" }, validationDetails:details },
    { ...base, id:"neutral", name:"consent", validation:"Not checked", payload:{} },
    { ...base, id:"assignment", name:"refund", validation:"Assignment error", payload:{} },
  ];
  ui.renderLiveObserverState(elements, { view:"Live", status:"Live", pageUrl:base.pageUrl, sources:[], events, inspectorEventId:"error", listVisible:true }, () => {});
  const rows = Object.fromEntries(Array.from(elements.eventFeed.querySelectorAll("button[data-event-id]")).map((button) => [button.dataset.eventId, { text:button.querySelector(".live-validation-badge").textContent.trim(), symbol:button.querySelector(".live-validation-badge").dataset.symbol, treatment:button.dataset.validationTreatment, name:button.getAttribute("aria-label"), border:getComputedStyle(button).borderInlineStartColor, readable:button.scrollWidth <= button.clientWidth || getComputedStyle(button).overflowWrap === "anywhere" }]));
  const selected = elements.eventFeed.querySelector('button[data-event-id="error"]'); selected.focus();
  const rowStates = { selected:selected.getAttribute("aria-pressed"), focused:document.activeElement === selected, eventNameVisible:selected.textContent.includes("purchase"), sourceVisible:selected.textContent.includes("Event history") };
  const handlers = { copyPayload:async()=>{}, saveToLibrary:()=>{}, validationAvailability:()=>({ enabled:true }), validate:()=>{}, manualSchemaChoices:()=>[{ id:"schema:checkout:4", label:"Checkout schema v4" }], selectManualSchema:()=>{} };
  ui.renderLiveInspector(elements, events[2], handlers);
  const inspector = {
    summary:elements.eventInspector.querySelector("#live-inspector-validation-summary").textContent,
    schema:Array.from(elements.eventInspector.querySelectorAll("dt")).find((term) => term.textContent === "Assigned schema")?.nextElementSibling?.textContent,
    actions:Array.from(elements.eventInspector.querySelectorAll("button")).map((button) => button.textContent),
    changeSchema:elements.eventInspector.querySelector("#live-change-schema")?.getAttribute("aria-label"),
    presentation:Array.from(elements.eventInspector.children).map((element) => element.getAttribute("aria-label") || element.id || element.tagName),
    rawJson:elements.eventInspector.querySelector("#live-raw-json summary").textContent,
  };
  const property = (path) => elements.eventInspector.querySelector("#live-property-" + path.replace(/[^a-z0-9]+/gi, "-"));
  const properties = Object.fromEntries(["page_path","currency","page_title","page_type","commerce","commerce.order.id","sibling","order_id"].map((path) => { const row = property(path); return [path, { status:row?.querySelector(":scope > .live-validation-property-row .live-property-status")?.textContent, treatment:row?.dataset.validationTreatment, evaluations:row?.querySelectorAll(":scope > .live-property-rule-details li").length ?? 0, aggregate:row?.querySelector(":scope > .live-validation-property-row .live-property-aggregate")?.textContent ?? null, missing:row?.querySelector('[data-missing="true"]')?.textContent ?? null }]; }));
  const statusButton = property("page_type").querySelector(".live-property-status");
  statusButton.dispatchEvent(new PointerEvent("pointerenter", { bubbles:true }));
  const pointerPreview = property("page_type").querySelector("[role=tooltip]").textContent;
  statusButton.dispatchEvent(new PointerEvent("pointerleave", { bubbles:true })); statusButton.focus();
  const focusPreview = property("page_type").querySelector("[role=tooltip]").textContent;
  statusButton.dispatchEvent(new KeyboardEvent("keydown", { key:"Escape", bubbles:true }));
  const escaped = property("page_type").querySelector("[role=tooltip]").hidden;
  const disclosures = {};
  for (const [name, event] of [["enter",new KeyboardEvent("keydown", { key:"Enter", bubbles:true })],["space",new KeyboardEvent("keydown", { key:" ", bubbles:true })]]) { if (statusButton.getAttribute("aria-expanded") === "true") statusButton.click(); statusButton.dispatchEvent(event); disclosures[name] = statusButton.getAttribute("aria-expanded"); }
  if (statusButton.getAttribute("aria-expanded") === "true") statusButton.click(); statusButton.click(); disclosures.click = statusButton.getAttribute("aria-expanded");
  const evaluationText = property("page_type").querySelector(".live-property-rule-details").textContent;
  const issueRows = Array.from(elements.eventInspector.querySelectorAll("#live-event-validation-issues li")).map((item) => item.textContent);
  const issueLink = elements.eventInspector.querySelector("#live-event-validation-issues button"); issueLink.click();
  const issueFocus = document.activeElement?.id;
  const originalPayload = JSON.stringify(events[2].payload); elements.eventInspector.querySelector("#live-raw-json").open = true;
  const unchanged = JSON.stringify(events[2].payload) === originalPayload;
  const scrollBefore = 37; elements.eventInspector.style.height = "120px"; elements.eventInspector.style.overflow = "auto"; elements.eventInspector.scrollTop = scrollBefore; statusButton.id = "revalidation-focus"; statusButton.focus();
  const validEvent = { ...events[2], validation:"Valid", validationDetails:{ ...details, issues:[], evaluations:details.evaluations.filter(({ status }) => status === "pass") } };
  ui.renderLiveObserverState(elements, { view:"Live", status:"Live", pageUrl:base.pageUrl, sources:[], events:events.map((event) => event.id === "error" ? validEvent : event), inspectorEventId:"error", listVisible:true }, () => {});
  ui.renderLiveInspector(elements, validEvent, handlers); elements.eventInspector.querySelector(".live-property-status")?.focus({ preventScroll:true }); elements.eventInspector.scrollTop = scrollBefore; ui.setEventValidationUpdateStatus(elements, "Validation changed to Valid.");
  const revalidation = { inspector:elements.eventInspector.querySelector("#live-inspector-validation-summary").textContent, feed:elements.eventFeed.querySelector('button[data-event-id="error"] .live-validation-badge').textContent.trim(), status:elements.eventInspector.querySelector("#live-validation-update-status").textContent, live:elements.eventInspector.querySelector("#live-validation-update-status").getAttribute("aria-live"), scroll:elements.eventInspector.scrollTop, focused:Boolean(elements.eventInspector.contains(document.activeElement)) };
  host.remove();
  return { rows, rowStates, inspector, properties, pointerPreview, focusPreview, escaped, disclosures, evaluationText, issueRows, issueFocus, unchanged, revalidation };
})()`;

const validationPresenceSemanticsRuntime = `(async () => {
  const validation = await import("/data-layer-schema-verification.js");
  const conditional = await import("/data-layer-conditional-validation-rules.js");
  const presentation = await import("/data-layer-live-validation-presentation.js");
  const liveUi = await import("/data-layer-live-observer-ui.js");
  const actionsCore = await import("/data-layer-live-inspector-actions.js");
  const event = (payload) => ({ sourceId:"history", eventName:"pageview", payload, rawInput:[] });
  const schemaWith = (rules, name="Presence") => ({ ...validation.createSchema(name, 2, { type:"object", properties:{ test:{ type:"string" }, page_type:{ type:"string" }, profile:{ type:"object", properties:{ status:{ type:"string" } } }, products:{ type:"array", items:{ type:"object", properties:{ sku:{ type:"string" } } } }, oOrder:{ type:"object", properties:{ aProducts:{ type:"array", items:{ type:"object" } } } } } }), attachedRules:rules });
  const rule = (id, operator, parameters, propertyPath="/test", extra={}) => ({ id, name:id, version:1, propertyPath, operator, ...(parameters === undefined ? {} : { parameters }), ...extra });
  const evaluate = (payload, rules, schemas) => { const schema=schemaWith(rules); return validation.validateWithSchema(event(payload), schema, schemas ?? [schema]); };
  const operators = [["exact-value","test"],["value-type","string"],["non-empty-string"],["text-length","4"],["digits-only"],["allowed-values","test"],["regular-expression","^test$"],["numeric-range","1,10"],["item-count","1"]].map(([operator, parameters]) => { const result=evaluate({}, [rule(operator, operator, parameters)]); return { operator, status:result.evaluations[0].status, issues:result.issues.length, state:result.state }; });
  const requiredRules = [rule("Required","required"),rule("Allowed values","allowed-values","test")];
  const requiredCases = [["missing",{}],["test",{ test:"test" }],["another value",{ test:"another value" }]].map(([observed,payload]) => { const result=evaluate(payload, requiredRules); return { observed, statuses:result.evaluations.map(({ status }) => status), issues:result.issues.map(({ rule }) => rule.replace(/ v\\d+$/, "")) }; });
  const nullResult = evaluate({ test:null }, [rule("Allowed values","allowed-values","test")]);
  const undefinedResult = evaluate({ test:undefined }, [rule("Allowed values","allowed-values","test"),rule("Required","required")]);
  const nestedRules = [rule("Nested value","allowed-values","active","/profile/status"),rule("Nested required","required",undefined,"/profile/status"),rule("Wildcard value","allowed-values","SKU-1","/products/*/sku"),rule("Wildcard required","required",undefined,"/products/*/sku"),rule("Index value","value-type","object","/products/2"),rule("Index required","required",undefined,"/products/2")];
  const nested = evaluate({ products:[{ sku:"SKU-1" },{}] }, nestedRules);
  const condition = { operator:"All", predicates:[{ propertyPath:"/page_type", operator:"Equals", comparison:conditional.typedComparisonValue("product_detail"), detectedType:"string" }] };
  const conditionalCases = [["allowed-values","/test",{ page_type:"product_detail" }],["item-count","/oOrder/aProducts",{ page_type:"product_detail", oOrder:{} }],["item-count","/oOrder/aProducts",{ page_type:"product_detail", oOrder:{ aProducts:[] } }],["required","/oOrder/aProducts/0",{ page_type:"product_detail", oOrder:{ aProducts:[] } }]].map(([operator,path,payload]) => { const result=evaluate(payload,[rule("Conditional",operator,operator === "allowed-values" ? "test" : operator === "item-count" ? "1" : undefined,path,{ conditionGroup:condition })]); return { operator, path, status:result.evaluations[0].status, issues:result.issues.length }; });
  const legacy = evaluate({}, [{ id:"Legacy", name:"Legacy", version:1, operator:"allowed-values", parameters:"test:test" }]);
  const parent=schemaWith([rule("Inherited","allowed-values","test")],"Parent"); const child={ ...schemaWith([],"Child"), parentSchemaId:parent.id }; const inherited=validation.validateWithSchema(event({}),child,[parent,child]);
  const summaries=[...operators.map(({ status }, index) => ({ status, rule:"optional-"+index, propertyPath:"test", message:"Not applicable", expected:"value", actual:"missing", ruleVersion:1, severity:"error", schemaName:"Presence", schemaVersion:2 }))];
  const liveSummary=presentation.propertyValidationSummary(summaries);
  const displayResult=evaluate({}, operators.map(({ operator }) => rule("Displayed "+operator,operator,operator === "exact-value" || operator === "allowed-values" ? "test" : operator === "value-type" ? "string" : operator === "text-length" ? "4" : operator === "regular-expression" ? "^test$" : operator === "numeric-range" ? "1,10" : operator === "item-count" ? "1" : undefined)));
  const elements=liveUi.findLiveObserverElements();
  const actions=actionsCore.createLiveInspectorActions({ currentPageUrl:()=>"https://shop.example/presence", writeClipboard:async()=>{}, storeTemplate:()=>{}, addPropertyValidation:()=>{}, validationState:()=>"Valid", updateValidation:()=>{}, manualSchemaChoices:()=>[], selectManualSchema:()=>{} });
  liveUi.renderLiveInspector(elements,{ id:"presence-event", name:"pageview", sourceId:"history", captureTime:"2026-07-14T12:00:00Z", pageUrl:"https://shop.example/presence", payload:{}, rawInput:[], validation:displayResult.state, validationDetails:{ issues:displayResult.issues, evaluations:displayResult.evaluations } },actions);
  const defaultInspectorText=elements.eventInspector.textContent;
  elements.eventInspector.querySelector("#live-non-applicable-properties").click();
  const revealedInspectorText=elements.eventInspector.textContent;
  const liveInspector={ hiddenByDefault:!defaultInspectorText.includes("9 rules not applicable"), revealed:revealedInspectorText.includes("9 rules not applicable"), issueRows:elements.eventInspector.querySelectorAll("#live-event-validation-issues li").length, invalidMissing:/(?:actual|received) Missing/i.test(revealedInspectorText) };
  return { operators, requiredCases, nullValue:{ status:nullResult.evaluations[0].status, actual:nullResult.evaluations[0].actual, issueActual:nullResult.issues[0].actual }, undefinedValue:{ statuses:undefinedResult.evaluations.map(({ status }) => status), actuals:undefinedResult.evaluations.map(({ actual }) => actual), typeIssueActual:undefinedResult.issues.find(({ message }) => message === "Type mismatch")?.actual }, nested:{ issues:nested.issues.map(({ rule, instancePath }) => [rule.replace(/ v\\d+$/, ""),instancePath]), notApplicable:nested.evaluations.filter(({ status }) => status === "not-applicable").map(({ propertyPath }) => propertyPath), wildcardPasses:nested.evaluations.filter(({ rule,status }) => rule === "Wildcard value" && status === "pass").length }, conditionalCases, equivalent:{ legacy:legacy.evaluations[0].status, inherited:inherited.evaluations[0].status, issues:legacy.issues.length+inherited.issues.length }, liveSummary, liveInspector };
})()`;

export const fixturePrograms = Object.freeze({ ...projectFixturePrograms, conditionalValidationRulesRuntime, schemaRulePropertyIdentityRuntime, canonicalDeclaredPropertyValidationRuntime, recursiveDeclaredPropertyValidationRuntime, recursivePropertyValidationRuntime, liveValidationVisualsRuntime, validationPresenceSemanticsRuntime });
export const definitions = createExecutableTargetDefinitions("schema-validation", fixturePrograms, { observe:executeFixture });
