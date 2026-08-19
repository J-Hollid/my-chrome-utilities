import { createExecutableTargetDefinitions } from "./side-panel-browser-target-contract.mjs";

async function executeFixture({ context, fixturePrograms, target }) {
  return context.executeFixture({ fixturePrograms, target });
}

const schemaDocumentationRuntime = `(async () => {
  const pause = (milliseconds=0) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  const waitFor = async (predicate, label) => { for (let attempt=0; attempt<400; attempt+=1) { const value=predicate(); if (value) return value; await pause(10); } throw new Error("Timed out waiting for " + label); };
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const click = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  const openProductDetail = () => { const row=Array.from(q("#schema-list").children).find(({textContent})=>textContent.includes("Product detail")); if(!row) throw new Error("Missing Product detail schema row"); click(row,"Edit working draft"); };
  q("#data-layer-view-schemas").click();
  openProductDetail();
  q("#schema-editor-description").value = "Product detail commerce event";
  q("#save-schema-description").click();
  await globalThis.__waitForDurableSchemaObservation((schemas)=>schemas.find(({id})=>id==="schema-product-detail")?.workingDraft?.documentation?.description==="Product detail commerce event","the durable schema documentation description");
  await waitFor(()=>q("#schema-editor").getAttribute("aria-busy")!=="true","the schema documentation description presentation");
  const propertyRow = q('[data-schema-property-canonical-path="/oOrder/aProducts/*/product_id"]');
  propertyRow.querySelector(".schema-property-documentation-control").click();
  propertyRow.querySelector('input[id^="schema-documentation-name-"]').value = "Product identifier";
  propertyRow.querySelector('textarea[id^="schema-documentation-description-"]').value = "Stable identifier used by fulfilment";
  propertyRow.querySelector('input[value="Save documentation"]').click();
  const storedAfterEdit = await globalThis.__waitForDurableSchemaObservation((schemas)=>schemas.find(({id})=>id==="schema-product-detail")?.workingDraft?.documentation?.properties?.["/oOrder/aProducts/*/product_id"]?.description==="Stable identifier used by fulfilment","the durable canonical property documentation");
  await waitFor(()=>q("#schema-editor").getAttribute("aria-busy")!=="true","the canonical property documentation presentation");
  const productAfterEdit = storedAfterEdit.find(({ id }) => id === "schema-product-detail");
  const editor = {
    schemaDescription:productAfterEdit.workingDraft.documentation.description,
    paths:Object.keys(productAfterEdit.workingDraft.documentation.properties),
    property:productAfterEdit.workingDraft.documentation.properties["/oOrder/aProducts/*/product_id"],
    currentDescription:productAfterEdit.documentation.description,
    ruleCount:productAfterEdit.workingDraft.attachedRules.length,
    currentVersion:productAfterEdit.version,
  };

  const core = await import("/data-layer-schema-verification.js");
  const documentationCore = await import("/data-layer-schema-documentation.js");
  const ui = await import("/data-layer-live-observer-ui.js");
  const actionsCore = await import("/data-layer-live-inspector-actions.js");
  const currentProduct = { ...productAfterEdit, documentation:productAfterEdit.workingDraft.documentation };
  const payload = { page_type:"product_detail", currency:"EUR", items:[{ product_id:"SKU-1" }], oOrder:{ aProducts:[{ product_id:"P-1" }] } };
  const result = core.validateWithSchema({ sourceId:"event-history", eventName:"product_detail", payload, rawInput:[] }, currentProduct, storedAfterEdit);
  const elements = ui.findLiveObserverElements();
  const actions = actionsCore.createLiveInspectorActions({ currentPageUrl:()=>"https://shop.example/product", writeClipboard:async()=>{}, storeTemplate:()=>{}, addPropertyValidation:()=>{}, validationState:()=>result.state, updateValidation:()=>{}, manualSchemaChoices:()=>[], selectManualSchema:()=>{} });
  q("#data-layer-view-live").click(); elements.eventInspector.hidden = false;
  ui.renderLiveInspector(elements, { id:"documented", name:"product_detail", sourceId:"event-history", captureTime:"2026-07-14T12:00:00Z", pageUrl:"https://shop.example/product", payload, rawInput:[], validation:result.state, validationDetails:{ issues:result.issues, evaluations:result.evaluations ?? [], schema:result.schema, documentation:result.documentation } }, actions);
  const inspector = elements.eventInspector;
  const pageRow = q('[data-property-path="/page_type"]');
  const wildcardRow = q('[data-property-path="/items/0/product_id"]');
  const syntheticRow = q('[data-property-path="/oOrder/order_id"]');
  const currencyRow = q('[data-property-path="/currency"]');
  const information = pageRow.querySelector(".live-property-documentation-control");
  information.dispatchEvent(new Event("pointerenter", { bubbles:true }));
  const hoverText = pageRow.querySelector(".live-property-documentation-preview").textContent;
  information.focus(); const focusPreview = !pageRow.querySelector(".live-property-documentation-preview").hidden;
  information.click();
  const persistent = pageRow.querySelector(".live-property-documentation-details");
  const persistentText = persistent.querySelector("p").textContent;
  persistent.dispatchEvent(new KeyboardEvent("keydown", { key:"Escape", bubbles:true }));
  const focusAfterEscape = document.activeElement === information;
  const search = q("#live-property-search");
  const searchResults = ["page_type", "Page classification", "documentationExecuted"].map((query) => { search.value = query; search.dispatchEvent(new Event("input", { bubbles:true })); return !pageRow.hidden; });
  const unsafe = "<img src=x onerror=globalThis.documentationExecuted=true><script>globalThis.documentationExecuted=true</script>";
  const presentation = {
    schemaDescription:inspector.textContent.includes("Product detail commerce event"),
    mapped:pageRow.textContent.includes("Page classification"),
    wildcard:wildcardRow.textContent.includes("Stable product identifier"),
    synthetic:syntheticRow.textContent.includes("Stable order identifier"),
    unmatchedControl:currencyRow.querySelectorAll(".live-property-documentation-control").length,
    hoverText, persistentText, plainText:hoverText === unsafe && !pageRow.querySelector("img, script") && globalThis.documentationExecuted !== true,
    focusPreview, closed:persistent.hidden, focusReturned:focusAfterEscape,
    accessible:{ name:information.getAttribute("aria-label"), described:Boolean(information.getAttribute("aria-describedby")), expanded:information.getAttribute("aria-expanded") },
    searchVisible:searchResults.every(Boolean),
    payloadUnchanged:JSON.stringify(payload) === JSON.stringify({ page_type:"product_detail", currency:"EUR", items:[{ product_id:"SKU-1" }], oOrder:{ aProducts:[{ product_id:"P-1" }] } }),
    validationUnchanged:result.state,
  };

  const parent = storedAfterEdit.find(({ id }) => id === "schema-generic-commerce");
  const inheritedProduct = { ...currentProduct, parentSchemaId:parent.id };
  const inherited = documentationCore.resolveEffectiveSchemaDocumentation(inheritedProduct, [parent, inheritedProduct]);
  const locallyOverridden = { ...inheritedProduct, documentation:documentationCore.setPropertyDocumentation(inheritedProduct.documentation, "/currency", { displayName:"Checkout currency", description:"Local currency meaning" }) };
  const local = documentationCore.resolveEffectiveSchemaDocumentation(locallyOverridden, [parent, locallyOverridden]);
  const restoredDocumentation = documentationCore.setPropertyDocumentation(locallyOverridden.documentation, "/currency", { displayName:"", description:"" });
  const restored = documentationCore.resolveEffectiveSchemaDocumentation({ ...locallyOverridden, documentation:restoredDocumentation }, [parent, { ...locallyOverridden, documentation:restoredDocumentation }]);
  const inheritance = {
    inherited:[inherited.properties["/currency"].description, inherited.properties["/currency"].origin.name, inherited.properties["/currency"].inherited],
    local:[local.properties["/currency"].description, local.properties["/currency"].origin.name, local.properties["/currency"].inherited],
    restored:[restored.properties["/currency"].description, restored.properties["/currency"].origin.name],
    parentUnchanged:parent.documentation.properties["/currency"].description,
  };

  const pinnedAssignment = { ...currentProduct.assignments[0], schemaVersion:3, versionPolicy:"pinned" };
  const v3 = { ...currentProduct, assignments:[pinnedAssignment], documentation:documentationCore.setPropertyDocumentation(currentProduct.documentation, "/page_type", { displayName:"Page classification", description:"Revision 3 description" }) };
  const v4 = { ...currentProduct, version:4, assignments:[pinnedAssignment], revisionHistory:[core.schemaRevision(v3, 3)], documentation:documentationCore.setPropertyDocumentation(currentProduct.documentation, "/page_type", { displayName:"Page classification", description:"Revision 4 description" }) };
  const documentedEvent = { sourceId:"event-history", eventName:"product_detail", payload, rawInput:[] };
  const pinnedResult = core.validateEvent(documentedEvent, [v4], "https://shop.example/product");
  const latestV4 = { ...v4, assignments:[{ ...pinnedAssignment, versionPolicy:"follow latest", schemaVersion:undefined }] };
  const latestResult = core.validateEvent(documentedEvent, [latestV4], "https://shop.example/product");
  const manualResult = core.validateWithSchema(documentedEvent, core.schemaRevision(v4, 3), [v4]);
  const savedValidationDetails = structuredClone({ schema:pinnedResult.schema, documentation:pinnedResult.documentation });
  const revisions = {
    pinned:documentationCore.resolvePropertyDocumentation(pinnedResult.documentation, "/page_type").description,
    current:documentationCore.resolvePropertyDocumentation(latestResult.documentation, "/page_type").description,
    pinnedSource:pinnedResult.documentation.properties["/page_type"].origin.name + " revision " + pinnedResult.documentation.properties["/page_type"].origin.version,
    currentSource:latestResult.documentation.properties["/page_type"].origin.name + " revision " + latestResult.documentation.properties["/page_type"].origin.version,
    manual:documentationCore.resolvePropertyDocumentation(manualResult.documentation, "/page_type").description,
    saved:documentationCore.resolvePropertyDocumentation(savedValidationDetails.documentation, "/page_type").description,
  };

  const exported = core.serializeSchemaLibrary(storedAfterEdit);
  const reloaded = core.restoreSchemaLibrary(exported);
  const legacy = core.restoreSchemaLibrary(JSON.stringify([{ id:"legacy", name:"Legacy", version:1, document:{ type:"object" }, assignments:[] }]));
  const lifecycle = {
    current:reloaded.find(({ id }) => id === "schema-product-detail").documentation.properties["/page_type"].description,
    draft:reloaded.find(({ id }) => id === "schema-product-detail").workingDraft.documentation.properties["/oOrder/aProducts/*/product_id"].description,
    historical:reloaded.find(({ id }) => id === "schema-product-detail").revisionHistory[0].documentation.properties["/page_type"].description,
    exactlyOnce:Object.keys(reloaded.find(({ id }) => id === "schema-product-detail").workingDraft.documentation.properties).length,
    legacyDocumentation:legacy[0].documentation ?? null,
  };

  q("#data-layer-view-schemas").click();
  openProductDetail();
  const removalRow = q('[data-schema-property-canonical-path="/oOrder/aProducts/*/product_id"]');
  removalRow.querySelector('button[aria-label^="Remove property"]').click();
  const removalSummary = q("#schema-property-removal-summary").textContent;
  click(q("#schema-property-removal-dialog"), "Remove property");
  const afterRemoval = (await globalThis.__waitForDurableSchemaObservation((schemas)=>{const draft=schemas.find(({id})=>id==="schema-product-detail")?.workingDraft;return draft&&!draft.document.properties?.oOrder?.properties?.aProducts?.items?.properties?.product_id&&!draft.documentation?.properties?.["/oOrder/aProducts/*/product_id"];},"the durable documented-property removal")).find(({ id }) => id === "schema-product-detail").workingDraft;
  await waitFor(()=>q("#schema-editor").getAttribute("aria-busy")!=="true","the documented-property removal presentation");
  click(document, "Undo");
  const afterUndo = (await globalThis.__waitForDurableSchemaObservation((schemas)=>{const draft=schemas.find(({id})=>id==="schema-product-detail")?.workingDraft;return draft?.document.properties?.oOrder?.properties?.aProducts?.items?.properties?.product_id&&draft.documentation?.properties?.["/oOrder/aProducts/*/product_id"]?.description==="Stable identifier used by fulfilment";},"the durable documented-property undo")).find(({ id }) => id === "schema-product-detail").workingDraft;
  const removal = {
    reviewShowsDocumentation:removalSummary.includes("/oOrder/aProducts/*/product_id"),
    removed:{ property:!afterRemoval.document.properties.oOrder.properties.aProducts.items.properties.product_id, rules:afterRemoval.attachedRules.length, documentation:Object.keys(afterRemoval.documentation.properties).includes("/oOrder/aProducts/*/product_id") },
    restored:{ property:Boolean(afterUndo.document.properties.oOrder.properties.aProducts.items.properties.product_id), rules:afterUndo.attachedRules.length, documentation:afterUndo.documentation.properties["/oOrder/aProducts/*/product_id"].description },
  };
  const interactionCases = [
    { interaction:"pointer hover", presentation:"a non-blocking information preview" },
    { interaction:"keyboard focus", presentation:"a non-blocking information preview" },
    { interaction:"click or Enter", presentation:"persistent additional information" },
  ];
  const mappingCases = [
    ["/page_type", "Page classification", "Business classification of page", "/page_type"],
    ["/items/*/product_id", "Product identifier", "Stable product identifier", "/items/0/product_id"],
    ["/oOrder/aProducts/*/product_id", "Product identifier", "Stable product identifier", "/oOrder/aProducts/0/product_id"],
    ["/oOrder/order_id", "Order identifier", "Stable order identifier", "/oOrder/order_id"],
    ["no matching path", "none", "none", "/currency"],
  ].map(([mappingPath, displayName, description, renderedPath]) => {
    const documentation = mappingPath === "no matching path"
      ? {}
      : { properties:{ [mappingPath]:{ displayName, description } } };
    const mappedSchema = { ...currentProduct, parentSchemaId:undefined, documentation };
    const mappedResult = core.validateWithSchema(documentedEvent, mappedSchema, [mappedSchema]);
    ui.renderLiveInspector(elements, { id:"mapping", name:"product_detail", sourceId:"event-history", captureTime:"2026-07-14T12:00:00Z", pageUrl:"https://shop.example/product", payload, rawInput:[], validation:mappedResult.state, validationDetails:{ issues:mappedResult.issues, evaluations:mappedResult.evaluations ?? [], schema:mappedResult.schema, documentation:mappedResult.documentation } }, actions);
    const row = q('[data-property-path="' + renderedPath + '"]');
    const control = row.querySelector(".live-property-documentation-control");
    const missing = Boolean(row.querySelector('[data-missing="true"]'));
    const payloadState = (missing ? "missing expected " : "observed ") + renderedPath;
    const wildcard = mappingPath.includes("*");
    return {
      mappingPath,
      displayName:row.querySelector(".live-property-display-name")?.textContent ?? "none",
      description:control ? row.querySelector(".live-property-documentation-preview").textContent : "none",
      payloadState,
      eventProperty:payloadState,
      renderedPath:row.dataset.propertyPath,
      presentation:!control ? "no documentation control" : wildcard ? "wildcard mapped information" : missing ? "mapped synthetic-row information" : "mapped name and description",
      documentationResult:!control ? "no empty documentation control" : wildcard ? "wildcard information on the concrete item" : missing ? "mapped information on the synthetic row" : "mapped information on " + renderedPath,
    };
  });
  const revisionCases = [
    { eventContext:"automatic assignment pinned to revision 3", description:revisions.pinned, source:revisions.pinnedSource },
    { eventContext:"automatic assignment following current revision 4", description:revisions.current, source:revisions.currentSource },
    { eventContext:"manual schema selection of revision 3", description:revisions.manual, source:revisions.pinnedSource },
    { eventContext:"saved event recorded with revision 3", description:revisions.saved, source:revisions.pinnedSource },
  ];
  return { editor, presentation, inheritance, revisions, lifecycle, removal, interactionCases, mappingCases, revisionCases };
})()`;

const schemaPropertyExampleValuesRuntime = `(async () => {
  const pause=()=>new Promise((resolve)=>setTimeout(resolve,0));
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const click=(root,label)=>{const value=Array.from(root.querySelectorAll("button")).find(({textContent})=>textContent===label||textContent.startsWith(label));if(!value)throw new Error("Missing action "+label);value.click();return value;};
  const canonicalValue=(value)=>Array.isArray(value)?value.map(canonicalValue):value&&typeof value==="object"?Object.fromEntries(Object.keys(value).sort().map((key)=>[key,canonicalValue(value[key])])):value;const same=(left,right)=>JSON.stringify(canonicalValue(left))===JSON.stringify(canonicalValue(right));
  const runtimeErrors=[];addEventListener("error",(event)=>runtimeErrors.push(String(event.error??event.message)));addEventListener("unhandledrejection",(event)=>runtimeErrors.push(String(event.reason)));
  const schemaKey="my-chrome-utilities.schema-library.v1",schemaId="schema:product-detail";const before=JSON.parse(localStorage.getItem(schemaKey));const beforePublished=structuredClone(before.find(({id})=>id===schemaId));delete beforePublished.workingDraft;const durableProduct=async(predicate,label)=>{const values=await globalThis.__waitForDurableSchemaObservation((schemas)=>{const candidate=schemas.find(({id})=>id===schemaId);return Boolean(candidate&&predicate(candidate));},label);return values.find(({id})=>id===schemaId);};
  q("#data-layer-view-schemas").click();click(q("#schema-list"),"Edit working draft");
  const row=(path)=>q('[data-schema-property-path="'+path+'"]');
  const open=(path)=>{const target=row(path);q(".schema-property-documentation-control",target).click();return target;};
  let login=open("login_status");const choices=Array.from(login.querySelectorAll('input[data-example-selection-method="allowed value"]')).map(({value})=>value);const loginCustom=q('input[data-example-selection-method="custom"]',login);const loginInput=q('[data-schema-property-example-input="/login_status"]',login);const initially={choices,custom:Boolean(loginCustom),customHidden:loginInput.hidden};q('input[value="logged in"]',login).click();q('input[value="Save documentation"]',login).click();
  let product=await durableProduct((schema)=>schema.workingDraft?.documentation?.properties?.["/login_status"]?.example?.value==="logged in","the allowed-value documentation example");login=open("login_status");const publishedAfter=structuredClone(product);delete publishedAfter.workingDraft;const currentUnchanged=same(publishedAfter,beforePublished),allowedSaved={example:product.workingDraft.documentation.properties["/login_status"].example,restored:q('input[value="logged in"]',login).checked,currentUnchanged};
  const customCases=[];for(const [path,inputValue,expectedValue] of [["product_name","robot","robot"],["product_id","1",1],["consent","false",false],["category","null",null]]){const target=open(path);q('input[data-example-selection-method="custom"]',target).click();const input=q("[data-schema-property-example-input]",target);input.value=inputValue;input.dispatchEvent(new Event("input",{bubbles:true}));q('input[value="Save documentation"]',target).click();const canonical="/"+path;product=await durableProduct((schema)=>Object.is(schema.workingDraft?.documentation?.properties?.[canonical]?.example?.value,expectedValue),"the custom documentation example for "+canonical);const example=product.workingDraft.documentation.properties[canonical].example;const reopened=open(path);customCases.push({path,value:example.value,type:example.value===null?"null":typeof example.value,selectionMethod:example.selectionMethod,rendered:q("[data-schema-property-example-input]",reopened).value,selected:q('input[data-example-selection-method="custom"]',reopened).checked});}
  const core=await import("/data-layer-schema-verification.js");const documentationCore=await import("/data-layer-schema-documentation.js");const observerUi=await import("/data-layer-live-observer-ui.js");const actionsCore=await import("/data-layer-live-inspector-actions.js");const defectUi=await import("/data-layer-defect-report-ui.js");const missingUi=await import("/data-layer-missing-event-defect-report-ui.js");const missingModel=await import("/data-layer-missing-event-defect-report.js");
  const active={...product,documentation:product.workingDraft.documentation,attachedRules:product.workingDraft.attachedRules,document:product.workingDraft.document,assignments:product.workingDraft.assignments,workingDraft:undefined};const payload={login_status:"guest",product_name:"robot",product_id:1,consent:false,category:null,plain:2,products:[{id:7},{id:8},{id:9}]};const result=core.validateWithSchema({sourceId:"event-history",eventName:"product_detail",payload,rawInput:[]},active,[active]);
  const liveHost=document.createElement("section");liveHost.innerHTML='<section><section id="live-event-list"><ul id="live-event-feed"></ul></section><aside id="live-event-inspector"></aside><button id="back-to-events"></button><div id="live-source-statuses"></div><input id="live-property-search"></section>';document.body.append(liveHost);const elements=observerUi.findLiveObserverElements(liveHost);const actions=actionsCore.createLiveInspectorActions({currentPageUrl:()=>"https://shop.example/products/robot",writeClipboard:async()=>{},storeTemplate:()=>{},validationState:()=>result.state,updateValidation:()=>{},manualSchemaChoices:()=>[],selectManualSchema:()=>{}});observerUi.renderLiveInspector(elements,{id:"event:example",name:"product_detail",sourceId:"event-history",captureTime:"2026-07-15T10:30:00Z",pageUrl:"https://shop.example/products/robot",payload,rawInput:[],validation:result.state,validationDetails:{issues:result.issues,evaluations:result.evaluations??[],schema:result.schema,documentation:result.documentation}},actions);const liveRow=q('[data-property-path="/products/2/id"]',liveHost);const observedBefore=liveRow.textContent;q(".live-property-documentation-control",liveRow).click();const live={information:q(".live-property-documentation-details",liveRow).textContent,observedUnchanged:liveRow.textContent===observedBefore,validation:result.state,payloadUnchanged:JSON.stringify(payload)===JSON.stringify({login_status:"guest",product_name:"robot",product_id:1,consent:false,category:null,plain:2,products:[{id:7},{id:8},{id:9}]})};
  const event={id:"event:defect-example",name:"product_detail",sourceId:"event-history",sourceName:"Event history",captureTime:"2026-07-15T10:31:00Z",pageUrl:"https://shop.example/products/robot",payload,rawInput:[],validation:result.state,validationDetails:{issues:result.issues,evaluations:result.evaluations??[],schema:result.schema,documentation:result.documentation}};const defectHost=document.createElement("section");defectHost.style.height="520px";defectHost.style.overflow="auto";document.body.append(defectHost);let savedDefect;defectUi.renderDefectReportBuilder(defectHost,event,undefined,[event],undefined,{save:async(report)=>{savedDefect=structuredClone(report);return{feedback:"saved"};},openExisting:()=>{},updateExisting:()=>{}});const defectGroup=q('[aria-label="login_status expected-result assistance"]',defectHost);const defectCustom=q('input[data-response-source="Custom value or response"]',defectGroup);const defectInput=q('input[placeholder="Custom value or response"]',defectGroup);const defectInitial={hidden:defectInput.hidden};defectHost.scrollTop=43;defectCustom.click();await pause();const prefilled={value:defectInput.value,hidden:defectInput.hidden,focused:document.activeElement===defectInput,scroll:defectHost.scrollTop};click(defectHost,"Save defect");await pause();const firstCorrection={count:savedDefect.expected.corrections.filter(({pointer})=>pointer==="/login_status").length,value:savedDefect.expected.payload.login_status,type:typeof savedDefect.expected.payload.login_status};defectInput.value="member";defectInput.setSelectionRange(3,3);defectInput.dispatchEvent(new Event("input",{bubbles:true}));q('input[data-response-source="Use generic constraint"]',defectGroup).click();defectCustom.click();const retained={value:defectInput.value,focused:document.activeElement===defectInput,selection:defectInput.selectionStart,scroll:defectHost.scrollTop};const plainGroup=q('[aria-label="plain expected-result assistance"]',defectHost);q('input[data-response-source="Custom value or response"]',plainGroup).click();const withoutExample={value:q('input[placeholder="Custom value or response"]',plainGroup).value};
  const conflictDocumentation=documentationCore.setPropertyDocumentation(active.documentation,"/login_status",{displayName:"",description:"",example:{value:"guest",selectionMethod:"custom"}});const conflictResult=core.validateWithSchema({sourceId:"event-history",eventName:"product_detail",payload,rawInput:[]},{...active,documentation:conflictDocumentation},[{...active,documentation:conflictDocumentation}]);const conflictHost=document.createElement("section");document.body.append(conflictHost);defectUi.renderDefectReportBuilder(conflictHost,{...event,validationDetails:{...event.validationDetails,issues:conflictResult.issues,evaluations:conflictResult.evaluations??[],documentation:conflictResult.documentation}});const conflictGroup=q('[aria-label="login_status expected-result assistance"]',conflictHost);q('input[data-response-source="Custom value or response"]',conflictGroup).click();const defectConflict={value:q('input[placeholder="Custom value or response"]',conflictGroup).value,warning:q('[data-custom-response-warning="login_status"]',conflictGroup).textContent,confirmation:!click(conflictGroup,"Keep custom override").hidden};
  const visit={id:"visit:example",pageUrl:"https://shop.example/products/robot",pathname:"/products/robot",startedAt:"2026-07-15T10:29:00Z",endedAt:"2026-07-15T10:32:00Z",events:[]};const missingHost=document.createElement("section");document.body.append(missingHost);let copied="",savedMissing;const controller=missingUi.renderMissingEventDefectReportBuilder(missingHost,[visit],[active],{entryPoint:"Live session actions",initialSchemaId:active.id,writeClipboard:async(text)=>{copied=text;},saveReportedDefect:async(report)=>{savedMissing=structuredClone(report);}});click(missingHost,"Add products item");const missingChoice=q('[data-expected-payload-custom-choice="/products/0/id"]',missingHost);missingChoice.click();await pause();const missingInput=q('[data-expected-payload-input="/products/0/id"]',missingHost);const missingPrefill={value:missingInput.value,type:q('[data-expected-payload-path="products.0.id"]',missingHost).dataset.expectedPayloadType};click(missingHost,"Confirm at least one matching event was expected");await pause();const missingReport=controller.report();click(missingHost,"Copy for Jira Cloud");click(missingHost,"Save defect");await pause();const representations=missingModel.generateMissingEventRepresentations(savedMissing);const generatedText=[representations.previewText,representations.previewHtml,representations.jiraText].join("\\n");const invalidDocumentation=documentationCore.setPropertyDocumentation(active.documentation,"/products/*/id",{displayName:"Product identifier",description:"Stable product identifier",example:{value:2,selectionMethod:"custom"}});const invalidSchema={...active,documentation:invalidDocumentation,attachedRules:[...active.attachedRules,{id:"allowed-id",name:"Allowed product id",version:1,propertyPath:"/products/*/id",operator:"allowed-values",allowedValues:[1],severity:"error"}]};const invalidHost=document.createElement("section");document.body.append(invalidHost);const invalidController=missingUi.renderMissingEventDefectReportBuilder(invalidHost,[visit],[invalidSchema],{entryPoint:"Live session actions",initialSchemaId:invalidSchema.id});click(invalidHost,"Add products item");q('[data-expected-payload-custom-choice="/products/0/id"]',invalidHost).click();click(invalidHost,"Confirm at least one matching event was expected");await pause();const invalidCopy=Array.from(invalidHost.querySelectorAll("button")).find(({textContent})=>textContent==="Copy for Jira Cloud");const missing={prefill:missingPrefill,payload:missingReport.expectedPayload,copied:copied.includes('"id": 1'),saved:savedMissing.expectedPayload,reopened:representations.previewText.includes('"id": 1'),recopied:representations.jiraText.includes('"id": 1'),invalid:{state:q('[data-expected-payload-validation="state"]',invalidHost).textContent,copyDisabled:invalidCopy.disabled,reportUnavailable:invalidController.report()===undefined},provenanceOmitted:!/(documentation source|example provenance|example value)/i.test(generatedText)};
  const inheritedParent={...active,id:"parent",name:"Generic page",version:2,documentation:{properties:{"/login_status":{displayName:"",description:"",example:{value:"not logged in",selectionMethod:"custom"}}}}};const inheritedChild={...active,parentSchemaId:"parent",documentation:{properties:{}}};const inherited=documentationCore.resolveEffectiveSchemaDocumentation(inheritedChild,[inheritedParent,inheritedChild]);const v3={...active,version:3,documentation:documentationCore.setPropertyDocumentation(active.documentation,"/login_status",{displayName:"",description:"",example:{value:"not logged in",selectionMethod:"custom"}})};const v4={...active,version:4,documentation:documentationCore.setPropertyDocumentation(active.documentation,"/login_status",{displayName:"",description:"",example:{value:"logged in",selectionMethod:"allowed value"}}),revisionHistory:[v3]};const reloaded=core.restoreSchemaLibrary(core.serializeSchemaLibrary([v4]))[0];const legacy=core.restoreSchemaLibrary(JSON.stringify([{id:"legacy",name:"Legacy",version:1,document:{type:"object"},assignments:[]}]))[0];const lifecycle={inherited:inherited.properties["/login_status"].example,current:reloaded.documentation.properties["/login_status"].example,historical:reloaded.revisionHistory[0].documentation.properties["/login_status"].example,legacy:legacy.documentation??null};
  return{initially,allowedSaved,customCases,live,defect:{initial:defectInitial,prefilled,firstCorrection,retained,withoutExample,conflict:defectConflict},missing,lifecycle,layout:{body:document.documentElement.scrollWidth,width:innerWidth},runtimeErrors};
})()`;

const schemaSpecificationBuilderSeedRuntime = `(() => {
  localStorage.clear();
  const parent={id:"base-event",name:"Base event",version:3,published:true,document:{type:"object",required:["site_id"],properties:{site_id:{type:"string"},legacy_flag:{type:"boolean"},context:{type:"object",properties:{locale:{type:"string"}}},excluded_context:{type:"object",properties:{secret:{type:"string"}}}}},assignments:[],documentation:{properties:{"/site_id":{displayName:"site_id",description:"Site identifier",comments:"Shared across events",example:{value:"otelo",selectionMethod:"custom"}},"/legacy_flag":{displayName:"legacy_flag",description:"Legacy flag"}}},attachedRules:[{id:"site-values",version:1,propertyPath:"/site_id",operator:"allowed-values",allowedValues:["otelo","hollandsnieuwe","ben"]},{id:"legacy-required",version:1,propertyPath:"/legacy_flag",operator:"required"}]};
  const historical={id:"schema-generic-pageview",name:"Generic pageview",version:2,published:true,parentSchemaId:"base-event",inheritedRuleOverrides:{excluded_context:"disabled"},document:{type:"object",properties:{legacy:{type:"string"}}},assignments:[],documentation:{properties:{"/legacy":{displayName:"legacy",description:"Historical property",example:{value:"old",selectionMethod:"custom"}}}}};
  const document={type:"object",required:["page_type"],properties:{page_type:{type:"string"},commerce:{type:"object",required:["currency"],properties:{currency:{type:"string"}}},products:{type:"array",items:{type:"object",required:["product_name"],properties:{product_name:{type:"string"},price_monthly:{type:"number"},duration:{type:"number"}}}},payment_method:{type:"string"},conflicting_method:{type:"string"},tracking_context:{},unsafe_text:{type:"string"},alpha:{type:"number"}}};
  const documentation={properties:{"/page_type":{displayName:"page_type",description:"Page classification",comments:"Used for page routing",example:{value:"product_detail",selectionMethod:"custom"}},"/commerce/currency":{displayName:"commerce.currency",description:"Transaction currency",comments:"ISO 4217 code",example:{value:"EUR",selectionMethod:"custom"}},"/products":{displayName:"products",description:"Products in the event",comments:"One row per product"},"/products/*/product_name":{displayName:"products[].product_name",description:"Displayed product name",comments:"Customer-facing label",example:{value:"Phone",selectionMethod:"custom"}},"/products/*/duration":{displayName:"products[].duration",description:"Contract duration in months",comments:"Whole months",example:{value:24,selectionMethod:"custom"}},"/payment_method":{displayName:"payment_method",description:"Payment method",example:{value:"card",selectionMethod:"custom"}},"/conflicting_method":{displayName:"conflicting_method",description:"Conflicting method"},"/tracking_context":{displayName:"tracking_context",description:"Tracking integration context"},"/unsafe_text":{displayName:"unsafe_text",description:"Unsafe <tag & \\"quote\\">\\tcontinued\\nline",example:{value:"safe",selectionMethod:"custom"}},"/alpha":{displayName:"alpha",description:"Alphabetical property",example:{value:1,selectionMethod:"custom"}}}};
  const rules=[{id:"page-types",version:1,propertyPath:"/page_type",operator:"allowed-values",allowedValues:["product_detail","product_list"]},{id:"currencies",version:1,propertyPath:"/commerce/currency",operator:"allowed-values",allowedValues:["EUR","GBP"]},{id:"duration-required",version:1,propertyPath:"/products/*/duration",operator:"required",conditionGroup:{operator:"All",predicates:[{propertyPath:"/products/*/price_monthly",operator:"Exists"}]}},{id:"duration-values",version:1,propertyPath:"/products/*/duration",operator:"allowed-values",allowedValues:[12,24],conditionGroup:{operator:"All",predicates:[{propertyPath:"/products/*/price_monthly",operator:"Exists"}]}},{id:"payment-values-one",version:1,propertyPath:"/payment_method",operator:"allowed-values",allowedValues:["card","paypal","bank"]},{id:"payment-values-two",version:1,propertyPath:"/payment_method",operator:"allowed-values",allowedValues:["paypal","card"]},{id:"payment-values-conditional",version:1,propertyPath:"/payment_method",operator:"allowed-values",allowedValues:["cash"],conditionGroup:{operator:"All",predicates:[{propertyPath:"/commerce/currency",operator:"Equals",comparison:{type:"string",value:"EUR"}}]}},{id:"conflict-one",version:1,propertyPath:"/conflicting_method",operator:"allowed-values",allowedValues:["card"]},{id:"conflict-two",version:1,propertyPath:"/conflicting_method",operator:"allowed-values",allowedValues:["cash"]}];
  const schema={id:"schema-generic-pageview",name:"Generic pageview",version:4,published:true,parentSchemaId:"base-event",inheritedRuleOverrides:{legacy_flag:"disabled",excluded_context:"disabled"},document,assignments:[],documentation,attachedRules:rules,revisionHistory:[historical],workingDraft:{baseVersion:4,sourceVersion:4,document:{...document,properties:{...document.properties,draft_only:{type:"boolean"}}},assignments:[],parentSchemaId:"base-event",inheritedRuleOverrides:{legacy_flag:"disabled",excluded_context:"disabled"},documentation:{properties:{...documentation.properties,"/draft_only":{displayName:"draft_only",description:"Draft property"}}},attachedRules:rules,pendingChanges:["Add draft_only"]}};
  localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([parent,schema]));
  localStorage.setItem("my-chrome-utilities.schema-rule-library.v1","[]");
  return true;
})()`;

const schemaSpecificationBuilderRuntime = `(async()=>{
  const pause=()=>new Promise((resolve)=>setTimeout(resolve,0));const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};const click=(root,label)=>{const button=Array.from(root.querySelectorAll("button")).find(({textContent})=>textContent===label);if(!button)throw new Error("Missing "+label);button.click();return button;};
  const copied=[];let failRich=false;globalThis.ClipboardItem=class{constructor(data){this.data=data;this.types=Object.keys(data);}};Object.defineProperty(navigator,"clipboard",{configurable:true,value:{write:async(items)=>{if(failRich)throw new Error("rich unavailable");copied.push({kind:"rich",item:items[0]});},writeText:async(text)=>{copied.push({kind:"plain",plain:text});}}});
  const before=localStorage.getItem("my-chrome-utilities.schema-library.v1");const builder=()=>q("#schema-specification-builder");const visible=()=>!builder().hidden&&!builder().closest("[hidden]")&&builder().getClientRects().length>0;const source=()=>q("#schema-specification-source").selectedOptions[0].textContent;const previewPaths=()=>Array.from(q("#schema-specification-preview").querySelectorAll("tbody tr"),({dataset})=>dataset.propertyPath);const close=()=>click(builder(),"Close specification");const libraryRow=()=>Array.from(q("#schema-list").children).find(({textContent})=>textContent.includes("Generic pageview"));
  q("#data-layer-view-schemas").click();const libraryBuild=click(libraryRow(),"Build documentation table");await pause();const library={visible:visible(),source:source(),paths:previewPaths()};close();await pause();library.focus=document.activeElement===libraryBuild;
  const editorButton=click(libraryRow(),"Edit working draft");q("#build-specification").click();await pause();const editor={visible:visible(),source:source(),paths:previewPaths()};close();await pause();editor.focus=document.activeElement===q("#build-specification");
  q("#schema-revision-history").open=true;const revision=q("#schema-revision-selector");revision.value="2";revision.dispatchEvent(new Event("change",{bubbles:true}));q("#build-historical-specification").click();await pause();const historical={visible:visible(),source:source(),paths:previewPaths()};close();await pause();historical.focus=document.activeElement===q("#build-historical-specification");
  q("#build-specification").click();await pause();const sourceSelect=q("#schema-specification-source");sourceSelect.value="published:4";sourceSelect.dispatchEvent(new Event("change",{bubbles:true}));await pause();
  const list=q("#schema-specification-property-list"),table=q("#schema-specification-preview"),selector=q("#schema-specification-selector");const checkbox=(path)=>q('input[data-path="'+path+'"]',list);const setChecked=(path,checked)=>{const control=checkbox(path);if(control.checked!==checked)control.click();};const clear=()=>click(selector,"Clear selection");const row=(path)=>{const tr=q('tbody tr[data-property-path="'+path+'"]',table);return Array.from(tr.querySelectorAll(":scope > td"),({textContent})=>textContent);};const only=(path)=>{clear();setChecked(path,true);return row(path);};
  const headings=Array.from(table.querySelectorAll("th[data-specification-column] > span:first-child"),({textContent})=>textContent);const defaults={leaves:["/page_type","/products/*/product_name","/site_id"].map((path)=>checkbox(path).checked),containers:["/commerce","/products"].map((path)=>checkbox(path).checked)};const hierarchy={durationParent:checkbox("/products/*/duration").closest("li").parentElement.closest("li")?.dataset.propertyPath,site:checkbox("/site_id").closest("label").textContent,legacyAbsent:!list.querySelector('[data-path="/legacy_flag"]')};
  const search=q('[aria-label="Search properties"]');search.value="duration";search.dispatchEvent(new Event("input",{bubbles:true}));const filtered=Array.from(list.querySelectorAll("input[data-path]"),({dataset})=>dataset.path);search.value="";search.dispatchEvent(new Event("input",{bubbles:true}));
  clear();setChecked("/products",true);const containerOnly=previewPaths();setChecked("/products/*/duration",true);const withDescendant=previewPaths();setChecked("/products",false);const descendantOnly=previewPaths();
  click(selector,"Select all");const schemaOrder=previewPaths();const sort=q('[aria-label="Preview order"]');sort.value="name";sort.dispatchEvent(new Event("change",{bubbles:true}));const nameOrder=previewPaths();
  const cases={pageType:only("/page_type"),currency:only("/commerce/currency"),products:only("/products"),productName:only("/products/*/product_name"),duration:only("/products/*/duration"),site:only("/site_id"),tracking:only("/tracking_context"),payment:only("/payment_method"),conflict:only("/conflicting_method")};
  clear();setChecked("/page_type",true);setChecked("/tracking_context",true);const completeness=q("#schema-specification-completeness").textContent;
  clear();for(const path of ["/commerce/currency","/products/*/product_name","/site_id","/payment_method","/unsafe_text"])setChecked(path,true);sort.value="schema";sort.dispatchEvent(new Event("change",{bubbles:true}));const selectionBefore=previewPaths();q('input[value="rich"]',builder()).click();click(builder(),"Copy specification table");await pause();const rich=copied.find(({kind})=>kind==="rich").item;const clipboard={types:rich.types,html:await rich.data["text/html"].text(),plain:await rich.data["text/plain"].text(),feedback:q("#schema-specification-copy-feedback").textContent};failRich=true;click(builder(),"Copy specification table");await pause();const fallback={plain:copied.at(-1).plain,feedback:q("#schema-specification-copy-feedback").textContent};
  return{entryPoints:{library,editor,historical},source:source(),headings,defaults,hierarchy,filtered,selection:{containerOnly,withDescendant,descendantOnly,schemaOrder,nameOrder},cases,completeness,clipboard,fallback,selectionUnchanged:JSON.stringify(selectionBefore)===JSON.stringify(previewPaths()),unchanged:before===localStorage.getItem("my-chrome-utilities.schema-library.v1"),editorButton:Boolean(editorButton),runtimeErrors:globalThis.__sidePanelRuntimeErrors??[]};
})()`;

const schemaSpecificationBuilderCustomizationRuntime = `(async()=>{
  const pause=()=>new Promise((resolve)=>setTimeout(resolve,0));const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};const click=(root,label)=>{const button=Array.from(root.querySelectorAll("button")).find(({textContent})=>textContent===label);if(!button)throw new Error("Missing "+label);button.click();return button;};
  const copied=[];globalThis.ClipboardItem=class{constructor(data){this.data=data;this.types=Object.keys(data);}};Object.defineProperty(navigator,"clipboard",{configurable:true,value:{write:async(items)=>copied.push({kind:"rich",item:items[0]}),writeText:async(plain)=>copied.push({kind:"plain",plain})}});const before=localStorage.getItem("my-chrome-utilities.schema-library.v1");q("#data-layer-view-schemas").click();const row=Array.from(q("#schema-list").children).find(({textContent})=>textContent.includes("Generic pageview"));click(row,"Build documentation table");const builder=q("#schema-specification-builder"),exportBar=q("#schema-specification-export-bar",builder),table=q("#schema-specification-preview",builder);const headings=()=>Array.from(table.querySelectorAll("th[data-specification-column] > span:first-child"),({textContent})=>textContent),moveColumn=(column,action)=>{const heading=q('th[data-specification-column="'+column+'"]',table),trigger=q('[data-reorder-trigger="true"]',heading);trigger.click();click(trigger.parentElement,action);};const radios=Array.from(exportBar.querySelectorAll('input[type="radio"]'));const defaults={spreadsheet:radios[0].checked,headings:q('input[type="checkbox"]',exportBar).checked,styleHidden:q('[aria-label="Table style"]',exportBar).parentElement.hidden,bars:builder.querySelectorAll("#schema-specification-export-bar").length};moveColumn("type","Move one position earlier");const moved=headings();
  let duration=q('td[data-specification-column="example"]',q('tr[data-property-path="/products/*/duration"]',table));duration.click();const editor=q(".schema-specification-example-editor",duration),choices=Array.from(editor.querySelectorAll("label"),({textContent})=>textContent.trim());const allowed=q('input[value="allowed:12"]',editor);allowed.checked=true;allowed.dispatchEvent(new Event("change",{bubbles:true}));duration=q('td[data-specification-column="example"]',q('tr[data-property-path="/products/*/duration"]',table));const example=duration.textContent;
  click(builder,"Copy specification table");await pause();const spreadsheet=copied.at(-1).plain;q('input[type="checkbox"]',exportBar).click();click(builder,"Copy specification table");await pause();const unheaded=copied.at(-1).plain;radios[1].click();const style=q('[aria-label="Table style"]',exportBar);style.value="highlighted";style.dispatchEvent(new Event("change",{bubbles:true}));q('input[type="checkbox"]',exportBar).click();click(builder,"Copy specification table");await pause();const rich=copied.at(-1).item;const richHtml=await rich.data["text/html"].text(),richPlain=await rich.data["text/plain"].text();return{defaults,moved,choices,example,spreadsheet,unheaded,rich:{types:rich.types,html:richHtml,plain:richPlain,styleVisible:!style.parentElement.hidden},layout:{width:builder.clientWidth,copyVisible:click(builder,"Copy specification table").getBoundingClientRect().right<=builder.getBoundingClientRect().right+1,barWidth:exportBar.scrollWidth},unchanged:before===localStorage.getItem("my-chrome-utilities.schema-library.v1"),runtimeErrors:globalThis.__sidePanelRuntimeErrors??[]};
})()`;

const schemaSpecificationBuilderExtendedRuntime = `(async()=>{
  const pause=()=>new Promise((resolve)=>setTimeout(resolve,0));const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};const builder=q("#schema-specification-builder"),table=q("#schema-specification-preview",builder),exportBar=q("#schema-specification-export-bar",builder),copyButton=Array.from(builder.querySelectorAll("button")).find(({textContent})=>textContent==="Copy specification table"),before=localStorage.getItem("my-chrome-utilities.schema-library.v1");const headings=()=>Array.from(table.querySelectorAll("th[data-specification-column] > span:first-child"),({textContent})=>textContent),moveColumn=(column,action)=>{const heading=q('th[data-specification-column="'+column+'"]',table),trigger=q('[data-reorder-trigger="true"]',heading);trigger.click();Array.from(trigger.parentElement.querySelectorAll("button")).find(({textContent})=>textContent===action).click();};const exampleCell=(path)=>q('tr[data-property-path="'+path+'"] td[data-specification-column="example"]',table);const copied=[];globalThis.ClipboardItem=class{constructor(data){this.data=data;this.types=Object.keys(data);}};Object.defineProperty(navigator,"clipboard",{configurable:true,value:{write:async(items)=>copied.push({kind:"rich",item:items[0]}),writeText:async(plain)=>copied.push({kind:"plain",plain})}});
  const choose=(path,id,customValue)=>{const cell=exampleCell(path);cell.click();const editor=q(".schema-specification-example-editor",cell),radio=q('input[value="'+id+'"]',editor);radio.click();if(id==="custom"){const input=q('input[placeholder="Custom value"]',editor);input.value=customValue;Array.from(editor.querySelectorAll("button")).find(({textContent})=>textContent==="Apply custom value").click();}return exampleCell(path).textContent;};
  const copy=async(mode,headingsEnabled,styleValue="plain")=>{q('input[value="'+mode+'"]',exportBar).click();const heading=q('input[type="checkbox"]',exportBar);if(heading.checked!==headingsEnabled)heading.click();if(mode==="rich"){const style=q('[aria-label="Table style"]',exportBar);style.value=styleValue;style.dispatchEvent(new Event("change",{bubbles:true}));}copyButton.click();await pause();const entry=copied.at(-1);if(entry.kind==="plain")return{plain:entry.plain};return{html:await entry.item.data["text/html"].text(),plain:await entry.item.data["text/plain"].text(),types:entry.item.types};};
  const provenance={conditional:(()=>{exampleCell("/products/*/duration").click();return Array.from(q(".schema-specification-example-editor",exampleCell("/products/*/duration")).querySelectorAll("label"),({textContent})=>textContent.trim());})(),inherited:(()=>{exampleCell("/site_id").click();return Array.from(q(".schema-specification-example-editor",exampleCell("/site_id")).querySelectorAll("label"),({textContent})=>textContent.trim());})(),localPropertyInheritedRule:(()=>{exampleCell("/page_type").click();return Array.from(q(".schema-specification-example-editor",exampleCell("/page_type")).querySelectorAll("label"),({textContent})=>textContent.trim());})()};const choiceState=(path)=>{const cell=exampleCell(path);cell.click();const editor=q(".schema-specification-example-editor",cell);return{labels:Array.from(editor.querySelectorAll("label"),({textContent})=>textContent.trim()),enabledAllowed:editor.querySelectorAll('input[value^="allowed:"]:not(:disabled)').length};};const choiceIntegrity={duplicate:choiceState("/payment_method"),conflict:choiceState("/conflicting_method")};const provenanceRefresh=q('[aria-label="Preview order"]',builder);provenanceRefresh.value="name";provenanceRefresh.dispatchEvent(new Event("change",{bubbles:true}));provenanceRefresh.value="schema";provenanceRefresh.dispatchEvent(new Event("change",{bubbles:true}));
  const choiceExports={};for(const [name,id,value] of [["documentation","documentation"],["allowed","allowed:12"],["custom","custom","18"],["blank","blank"]]){const preview=choose("/products/*/duration",id,value);const spreadsheet=await copy("spreadsheet",true);const rich=await copy("rich",true,"highlighted");choiceExports[name]={preview,spreadsheet:spreadsheet.plain,richHtml:rich.html,richPlain:rich.plain};}
  const styles={plain:(await copy("rich",true,"plain")).html,bordered:(await copy("rich",true,"bordered")).html,highlighted:(await copy("rich",true,"highlighted")).html,unheaded:(await copy("rich",false,"highlighted")).html};
  const dragBefore=headings();const transfer=new DataTransfer(),mandatory=q('th[data-specification-column="mandatory"]',table),type=q('th[data-specification-column="type"]',table),mandatoryHandle=q('[data-reorder-trigger="true"]',mandatory);mandatoryHandle.dispatchEvent(new DragEvent("dragstart",{bubbles:true,dataTransfer:transfer}));type.dispatchEvent(new DragEvent("drop",{bubbles:true,dataTransfer:transfer,clientY:type.getBoundingClientRect().top}));const dragged=headings();const boundaryDisabled=(heading,action)=>{const trigger=q('[data-reorder-trigger="true"]',heading);trigger.click();const disabled=Array.from(trigger.parentElement.querySelectorAll("button")).find(({textContent})=>textContent===action).disabled;trigger.click();return disabled;},headingCells=Array.from(table.querySelectorAll("th[data-specification-column]")),boundaries={firstLeft:boundaryDisabled(headingCells[0],"Move one position earlier"),lastRight:boundaryDisabled(headingCells.at(-1),"Move one position later")};Array.from(builder.querySelectorAll("button")).find(({textContent})=>textContent==="Reset column order").click();const reset=headings();
  choose("/products/*/duration","allowed:12");q('input[value="rich"]',exportBar).click();const style=q('[aria-label="Table style"]',exportBar);style.value="highlighted";style.dispatchEvent(new Event("change",{bubbles:true}));const heading=q('input[type="checkbox"]',exportBar);if(!heading.checked)heading.click();moveColumn("type","Move one position earlier");const page=q('input[data-path="/page_type"]',builder);page.click();page.click();const sort=q('[aria-label="Preview order"]',builder);sort.value="name";sort.dispatchEvent(new Event("change",{bubbles:true}));const retained={value:exampleCell("/products/*/duration").textContent,rich:q('input[value="rich"]',exportBar).checked,headings:heading.checked,style:style.value,columns:headings()};const source=q("#schema-specification-source",builder);source.value="working-draft";source.dispatchEvent(new Event("change",{bubbles:true}));const resetSource={value:exampleCell("/products/*/duration").textContent,rich:q('input[value="rich"]',exportBar).checked,headings:q('input[type="checkbox"]',exportBar).checked,style:q('[aria-label="Table style"]',exportBar).value,columns:headings()};
  Object.defineProperty(navigator,"clipboard",{configurable:true,value:{write:async()=>{throw new Error("rich unavailable");},writeText:async()=>{throw new Error("plain unavailable");}}});copyButton.click();await pause();return{provenance,choiceIntegrity,choiceExports,styles,drag:{before:dragBefore,after:dragged,boundaries,reset},rerender:{retained,resetSource},failure:q("#schema-specification-copy-feedback").textContent,previewStillVisible:table.getClientRects().length>0,unchanged:before===localStorage.getItem("my-chrome-utilities.schema-library.v1"),runtimeErrors:globalThis.__sidePanelRuntimeErrors??[]};
})()`;

const schemaSpecificationExampleSelectionRuntime = `(async()=>{
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const click=(root,label)=>{const button=Array.from(root.querySelectorAll("button")).find(({textContent})=>textContent===label);if(!button)throw new Error("Missing "+label);button.click();};
  const before=localStorage.getItem("my-chrome-utilities.schema-library.v1");q("#data-layer-view-schemas").click();const row=Array.from(q("#schema-list").children).find(({textContent})=>textContent.includes("Generic pageview"));click(row,"Build documentation table");
  const table=q("#schema-specification-preview"),cell=(path)=>q('td[data-specification-column="example"]',q('tr[data-property-path="'+path+'"]',table)),trigger=(path)=>q(".schema-specification-example-trigger",cell(path));
  let duration=cell("/products/*/duration"),durationTrigger=trigger("/products/*/duration");durationTrigger.focus();const activation=new KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true});durationTrigger.dispatchEvent(activation);let editor=q(".schema-specification-example-editor",duration);const keyboardActivation={open:Boolean(editor),focused:editor.contains(document.activeElement),handled:activation.defaultPrevented};
  const initial={selected:editor.querySelector('input:checked')?.parentElement.textContent.trim(),labels:Array.from(editor.querySelectorAll("label"),({textContent})=>textContent.trim()),standalone:duration.querySelectorAll(':scope > input[type="text"]').length};const allowed=q('input[value="allowed:12"]',editor);const radioSpace=new KeyboardEvent("keydown",{key:" ",bubbles:true,cancelable:true});allowed.dispatchEvent(radioSpace);const radioKeyNotTrapped=!radioSpace.defaultPrevented;allowed.click();duration=cell("/products/*/duration");durationTrigger=trigger("/products/*/duration");const selectedValue=durationTrigger.textContent;durationTrigger.click();editor=q(".schema-specification-example-editor",duration);const reopened=editor.querySelector('input:checked')?.parentElement.textContent.trim();const cancel=Array.from(editor.querySelectorAll("button")).find(({textContent})=>textContent==="Cancel");cancel.click();const cancelled={value:durationTrigger.textContent,focus:document.activeElement===durationTrigger};durationTrigger.click();const pointerEditor=duration.querySelector(".schema-specification-example-editor");const pointerReopened={open:Boolean(pointerEditor),selected:pointerEditor?.querySelector('input:checked')?.value};pointerEditor?.querySelector("button:last-child")?.click();
  let product=cell("/products/*/product_name"),productTrigger=trigger("/products/*/product_name");productTrigger.click();editor=q(".schema-specification-example-editor",product);const unavailable={selected:editor.querySelector('input:checked')?.value,count:document.querySelectorAll(".schema-specification-example-editor").length,focused:editor.contains(document.activeElement),text:editor.textContent};editor.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));const escaped={focus:document.activeElement===productTrigger,value:productTrigger.textContent};return{initial,selectedValue,reopened,cancelled,pointerReopened,keyboardActivation,radioKeyNotTrapped,unavailable,escaped,retained:selectedValue,unchanged:before===localStorage.getItem("my-chrome-utilities.schema-library.v1"),runtimeErrors:globalThis.__sidePanelRuntimeErrors??[]};
})()`;

const schemaSpecificationPreviewLayoutRuntime = `(()=>{
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};q("#data-layer-view-schemas").click();const schema=Array.from(q("#schema-list").children).find(({textContent})=>textContent.includes("Generic pageview"));Array.from(schema.querySelectorAll("button")).find(({textContent})=>textContent==="Build documentation table").click();const builder=q("#schema-specification-builder"),region=q("#schema-specification-preview-region",builder),table=q("#schema-specification-preview",region),panel=q("#workspace-panel-data-layer"),bounds=builder.getBoundingClientRect();const contained=Array.from(builder.children).filter((child)=>child!==region).every((child)=>{const box=child.getBoundingClientRect();return box.left>=bounds.left-1&&box.right<=bounds.right+1;});const th=q("th",table),first=q("tbody tr:nth-child(1) td",table),second=q("tbody tr:nth-child(2) td",table),long=q('tr[data-property-path="/products/*/duration"] td[data-specification-column="allowedValues"]',table);const hs=getComputedStyle(th),fs=getComputedStyle(first),ss=getComputedStyle(second),ls=getComputedStyle(long);const geometry={regions:builder.querySelectorAll("#schema-specification-preview-region").length,name:region.getAttribute("aria-label"),role:region.getAttribute("role"),regionClient:region.clientWidth,regionScroll:region.scrollWidth,builderClient:builder.clientWidth,builderScroll:builder.scrollWidth,panelClient:panel.clientWidth,panelScroll:panel.scrollWidth,table:table.getBoundingClientRect().width,contained};first.tabIndex=0;first.focus();const styles={headingBackground:hs.backgroundColor,cellBackground:fs.backgroundColor,border:hs.borderTopWidth,padding:hs.paddingLeft,alternating:fs.backgroundColor!==ss.backgroundColor,wrap:ls.whiteSpace,vertical:ls.verticalAlign,focusShadow:getComputedStyle(first).boxShadow};region.scrollLeft=region.scrollWidth;const scrolled={left:region.scrollLeft,builder:builder.scrollLeft,panel:panel.scrollLeft,laterVisible:q('th[data-specification-column="comments"]',table).getBoundingClientRect().right<=region.getBoundingClientRect().right+1};const retainedBefore=Math.max(1,Math.floor(region.scrollLeft/2));region.scrollLeft=retainedBefore;const sort=q('[aria-label="Preview order"]',builder);sort.value="name";sort.dispatchEvent(new Event("change",{bubbles:true}));const afterSort=region.scrollLeft;const rich=q('input[value="rich"]',builder);rich.click();const afterExport=region.scrollLeft;const move=q('th[data-specification-column="comments"] button',table);move.focus({preventScroll:false});return{geometry,styles,scrolled,retention:{before:retainedBefore,afterSort,afterExport,regions:builder.querySelectorAll("#schema-specification-preview-region").length},focused:{inside:region.contains(document.activeElement),visible:move.getBoundingClientRect().left>=region.getBoundingClientRect().left-1&&move.getBoundingClientRect().right<=region.getBoundingClientRect().right+1},runtimeErrors:globalThis.__sidePanelRuntimeErrors??[]};
})()`;

const schemaSpecificationPreviewThemeRuntime = `(()=>{const region=document.querySelector("#schema-specification-preview-region"),th=document.querySelector("#schema-specification-preview th"),td=document.querySelector("#schema-specification-preview td"),hs=getComputedStyle(th),ds=getComputedStyle(td),rs=getComputedStyle(region);return{heading:hs.backgroundColor,text:hs.color,cell:ds.backgroundColor,border:hs.borderTopColor,outline:rs.outlineStyle,colorScheme:getComputedStyle(document.documentElement).colorScheme};})()`;

const schemaPropertyCommentsRuntime = `(async () => {
  let stage = "setup";
  try {
    const pause = () => new Promise((resolve) => setTimeout(resolve, 0));
    const waitForEditorIdle = async (label) => { for (let attempt=0;attempt<400;attempt+=1) { if (q("#schema-editor").getAttribute("aria-busy")!=="true") return; await new Promise((resolve)=>setTimeout(resolve,10)); } throw new Error("Timed out waiting for " + label); };
    const q = (selector, root = document) => { const value = root.querySelector(selector); if (!value) throw new Error("Missing " + selector); return value; };
    const copied = [];
    const capturedErrors = [];
    const captureError = (event) => { capturedErrors.push(String(event.error?.stack ?? event.message ?? event.reason?.stack ?? event.reason ?? "unknown browser error")); event.preventDefault(); };
    const captureRejection = (event) => { capturedErrors.push(String(event.reason?.stack ?? event.reason ?? "unknown rejected promise")); event.preventDefault(); };
    globalThis.addEventListener("error", captureError);
    globalThis.addEventListener("unhandledrejection", captureRejection);
    globalThis.ClipboardItem = class { constructor(data) { this.data = data; this.types = Object.keys(data); } };
    Object.defineProperty(navigator, "clipboard", { configurable:true, value:{ write:async (items) => copied.push(items[0]), writeText:async (plain) => copied.push({ plain }) } });
    const original = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")).find(({ name }) => name === "Generic pageview");
    const publishedBefore = JSON.stringify(original.documentation);
    stage = "open editor";
    q("#data-layer-view-schemas").click();
    const row = Array.from(q("#schema-list").children).find(({ textContent }) => textContent.includes("Generic pageview"));
    Array.from(row.querySelectorAll("button")).find(({ textContent }) => textContent === "Edit working draft").click();
    let property = q('[data-schema-property-canonical-path="/products/*/product_name"]');
    property.querySelector(".schema-property-documentation-control").click();
    const comments = q('[id^="schema-documentation-comments-"]', property);
    comments.value = "  Sent by checkout" + String.fromCharCode(10) + "Do not derive from position  ";
    stage = "save comments";
    property.querySelector('input[value="Save documentation"]').click();
    const expectedComments = "Sent by checkout" + String.fromCharCode(10) + "Do not derive from position";
    const durableSchemas = await __waitForDurableSchemaObservation((schemas) => schemas.some(({ id, workingDraft }) => id === "schema-generic-pageview" && workingDraft?.documentation?.properties?.["/products/*/product_name"]?.comments === expectedComments), "the Saved Schema property comments");
    const stored = durableSchemas.find(({ id, workingDraft }) => id === "schema-generic-pageview" && workingDraft?.documentation?.properties?.["/products/*/product_name"]?.comments === expectedComments);
    const savedDocumentation = stored?.workingDraft?.documentation?.properties?.["/products/*/product_name"];
    if (!savedDocumentation) throw new Error("Durable comment entry was not returned: " + JSON.stringify(durableSchemas));
    await waitForEditorIdle("the Saved Schema property-comments settlement");
    const saved = savedDocumentation.comments;
    const publishedUnchanged = JSON.stringify(stored.documentation) === publishedBefore;
    stage = "reopen comments";
    property = q('[data-schema-property-canonical-path="/products/*/product_name"]');
    property.querySelector(".schema-property-documentation-control").click();
    const reopened = q('[id^="schema-documentation-comments-"]', property).value;
    stage = "build specification";
    q("#build-specification").click();
    const builder = q("#schema-specification-builder");
    const headings = Array.from(builder.querySelectorAll("th[data-specification-column] > span:first-child"), ({ textContent }) => textContent);
    const specRow = q('tr[data-property-path="/products/*/product_name"]', builder);
    const cells = Array.from(specRow.children, ({ textContent }) => textContent);
    q('input[value="rich"]', builder).click();
    Array.from(builder.querySelectorAll("button")).find(({ textContent }) => textContent === "Copy specification table").click();
    await pause();
    stage = "read clipboard";
    const item = copied[0];
    const html = await item.data["text/html"].text();
    const plain = await item.data["text/plain"].text();
    globalThis.removeEventListener("error", captureError);
    globalThis.removeEventListener("unhandledrejection", captureRejection);
    return { saved, reopened, publishedUnchanged, headings, cells, clipboard:{ html, plain }, runtimeErrors:[...(globalThis.__sidePanelRuntimeErrors ?? []), ...capturedErrors] };
  } catch (error) {
    throw new Error("Schema property comments failed during " + stage + ": " + String(error?.stack ?? error));
  }
})()`;

const schemaSpecificationContainerDefaultsRuntime = `(()=>{
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const click=(root,label)=>{const button=Array.from(root.querySelectorAll("button")).find(({textContent})=>textContent===label);if(!button)throw new Error("Missing "+label);button.click();};
  const before=localStorage.getItem("my-chrome-utilities.schema-library.v1");q("#data-layer-view-schemas").click();const schema=Array.from(q("#schema-list").children).find(({textContent})=>textContent.includes("Generic pageview"));click(schema,"Build documentation table");const builder=q("#schema-specification-builder"),list=q("#schema-specification-property-list",builder),table=q("#schema-specification-preview",builder);
  const controls=()=>Array.from(list.querySelectorAll('input[data-path]')),paths=()=>Array.from(table.querySelectorAll("tbody tr"),({dataset})=>dataset.propertyPath),control=(path)=>q('input[data-path="'+path+'"]',list);const initialControls=controls(),initialAll=initialControls.every(({checked})=>checked),initialPaths=paths(),inheritedContainer={checked:control("/context").checked,label:control("/context").closest("label").textContent,descendant:control("/context/locale").checked},excludedInitial=!initialControls.some(({dataset})=>dataset.path==="/excluded_context"||dataset.path.startsWith("/excluded_context/"));
  control("/products").click();const afterContainer={container:control("/products").checked,descendant:control("/products/*/duration").checked,paths:paths()};control("/products/*/duration").click();const afterDescendant={container:control("/products").checked,descendant:control("/products/*/duration").checked};
  const search=q('[aria-label="Search properties"]',builder);search.value="duration";search.dispatchEvent(new Event("input",{bubbles:true}));search.value="";search.dispatchEvent(new Event("input",{bubbles:true}));const sort=q('[aria-label="Preview order"]',builder);sort.value="name";sort.dispatchEvent(new Event("change",{bubbles:true}));const propertyNameHeading=q('th[data-specification-column="propertyName"]',table),propertyNameReorder=q('[data-reorder-trigger="true"]',propertyNameHeading);propertyNameReorder.click();click(propertyNameReorder.parentElement,"Move one position later");const example=q('[data-specification-example-path="/products/*/product_name"]',builder);example.click();const exampleEditor=q(".schema-specification-example-editor",example);q('input[value="custom"]',exampleEditor).click();const custom=q('input[placeholder="Custom value"]',exampleEditor);custom.value="Retained example";Array.from(exampleEditor.querySelectorAll("button")).find(({textContent})=>textContent==="Apply custom value").click();q('input[value="spreadsheet"]',builder).click();Array.from(builder.querySelectorAll('input[type="checkbox"]')).find(({parentElement})=>parentElement?.textContent?.includes("Include headings")).click();const retained={products:control("/products").checked,duration:control("/products/*/duration").checked};
  const source=q("#schema-specification-source",builder);source.value="working-draft";source.dispatchEvent(new Event("change",{bubbles:true}));const workingDraft={all:controls().every(({checked})=>checked),paths:paths(),available:controls().map(({dataset})=>dataset.path)};control("/draft_only").click();source.value="historical:2";source.dispatchEvent(new Event("change",{bubbles:true}));const reset={all:controls().every(({checked})=>checked),paths:paths(),available:controls().map(({dataset})=>dataset.path)};click(builder,"Clear selection");const cleared={checked:controls().filter(({checked})=>checked).length,rows:paths().length};click(builder,"Select all");const selected={all:controls().every(({checked})=>checked),rows:paths().length,controls:controls().length};
  return{initial:{all:initialAll,available:initialControls.map(({dataset})=>dataset.path),paths:initialPaths,unique:new Set(initialPaths).size===initialPaths.length},inheritedContainer,excluded:{initial:excludedInitial,workingDraft:!workingDraft.available.some((path)=>path.startsWith("/excluded_context")),historical:!reset.available.some((path)=>path.startsWith("/excluded_context"))},afterContainer,afterDescendant,retained,workingDraft,reset,cleared,selected,unchanged:before===localStorage.getItem("my-chrome-utilities.schema-library.v1"),runtimeErrors:globalThis.__sidePanelRuntimeErrors??[]};
})()`;

const schemaPropertyCommentsLiveRuntime = `(async () => {
  const verification = await import("/data-layer-schema-verification.js");
  const observerUi = await import("/data-layer-live-observer-ui.js");
  const inspectorActions = await import("/data-layer-live-inspector-actions.js");
  const comment = "<img src=x onerror=globalThis.commentExecuted=true>\\nSent by checkout";
  const missingComment = "Missing identifier comment";
  const schema = {
    id:"schema:comments-live", name:"Comments live", version:3,
    document:{ type:"object", properties:{ products:{ type:"array", items:{ type:"object", required:["product_id"], properties:{ product_name:{ type:"string" }, product_id:{ type:"string" } } } } } },
    assignments:[], documentation:{ properties:{ "/products/*/product_name":{ displayName:"Product name", description:"Displayed product", comments:comment }, "/products/*/product_id":{ displayName:"Product identifier", description:"Required identifier", comments:missingComment } } },
  };
  const payload = { products:[{ product_name:"one" }, { product_name:"two" }, { product_name:"three" }] };
  const payloadBefore = JSON.stringify(payload);
  const result = verification.validateWithSchema({ sourceId:"history", eventName:"product_detail", payload, rawInput:[] }, schema, [schema]);
  const host = document.createElement("section");
  host.innerHTML = '<section id="live-event-list"><ul id="live-event-feed"></ul></section><aside id="live-event-inspector"></aside><button id="back-to-events"></button><div id="live-source-statuses"></div>';
  document.body.append(host);
  const elements = observerUi.findLiveObserverElements(host);
  const actions = inspectorActions.createLiveInspectorActions({ currentPageUrl:()=>"https://shop.example/products", writeClipboard:async()=>{}, storeTemplate:()=>{}, validationState:()=>result.state, updateValidation:()=>{}, manualSchemaChoices:()=>[], selectManualSchema:()=>{} });
  observerUi.renderLiveInspector(elements, { id:"comments-event", name:"product_detail", sourceId:"history", captureTime:"2026-07-16T10:00:00Z", pageUrl:"https://shop.example/products", payload, rawInput:[], validation:result.state, validationDetails:{ issues:result.issues, evaluations:result.evaluations??[], schema:result.schema, documentation:result.documentation } }, actions);
  const row = host.querySelector('[data-property-path="/products/2/product_name"]');
  if (!row) throw new Error("Missing concrete wildcard property row");
  const collapsedText = row.querySelector(".live-validation-property-row").textContent;
  const searchText = row.querySelector(".live-validation-property-row").dataset.documentationSearch ?? "";
  row.querySelector(".live-property-documentation-control").click();
  const details = row.querySelector(".live-property-documentation-details");
  const missingRow = host.querySelector('[data-property-path="/products/2/product_id"]');
  if (!missingRow) throw new Error("Missing documented absent property row");
  const missingCollapsed = missingRow.querySelector(".live-validation-property-row").textContent;
  const missingSearch = missingRow.querySelector(".live-validation-property-row").dataset.documentationSearch ?? "";
  missingRow.querySelector(".live-property-documentation-control").click();
  const missingDetails = missingRow.querySelector(".live-property-documentation-details");
  const repeated = verification.validateWithSchema({ sourceId:"history", eventName:"product_detail", payload, rawInput:[] }, schema, [schema]);
  return {
    comments:details.querySelector(".live-property-documentation-comments").textContent,
    searchMatched:searchText.includes("sent by checkout"),
    wildcardPath:row.dataset.propertyPath,
    collapsedUnchanged:!collapsedText.includes("Sent by checkout"),
    inert:!details.querySelector("img,script") && globalThis.commentExecuted !== true,
    payloadUnchanged:payloadBefore===JSON.stringify(payload),
    validation:result.state,
    validationUnchanged:result.state===repeated.state && JSON.stringify(result.issues)===JSON.stringify(repeated.issues),
    missing:{ path:missingRow.dataset.propertyPath, comments:missingDetails.querySelector(".live-property-documentation-comments").textContent, searchMatched:missingSearch.includes("missing identifier comment"), collapsedUnchanged:!missingCollapsed.includes(missingComment), inert:!missingDetails.querySelector("img,script") },
  };
})()`;

const schemaPropertyCommentsLifecycleRuntime = `(async () => {
  const documentation = await import("/data-layer-schema-documentation.js");
  const verification = await import("/data-layer-schema-verification.js");
  const propertyCopy = await import("/data-layer-schema-property-copy.js");
  const propertyRemoval = await import("/data-layer-schema-property-removal.js");
  const document = { type:"object", properties:{ currency:{type:"string"}, page_type:{type:"string"}, products:{type:"array",items:{type:"object",properties:{product_id:{type:"string"}}}} } };
  const parent = { id:"schema:generic-commerce", name:"Generic commerce", version:2, document, assignments:[], documentation:{properties:{"/currency":{displayName:"Currency",description:"ISO currency",comments:"Shared currency convention"}}} };
  const revision3 = { id:"schema:product-detail", name:"Product detail", version:3, document, assignments:[], parentSchemaId:parent.id, documentation:{properties:{
    "/currency":{displayName:"Currency",description:"ISO currency",comments:"Checkout currency exception"},
    "/page_type":{displayName:"Page type",description:"Routing input",comments:"Legacy routing input"},
    "/products/*/product_id":{displayName:"Product identifier",description:"Stable identifier",comments:"Sent by checkout\\nDo not derive from position"},
  }} };
  const parentBefore = JSON.stringify(parent);
  const local = documentation.resolveEffectiveSchemaDocumentation(revision3,[parent,revision3]);
  const restoredDocumentation = documentation.setPropertyDocumentation(revision3.documentation,"/currency",{displayName:"",description:"",comments:""});
  const restoredSchema = {...revision3,documentation:restoredDocumentation};
  const restoredInherited = documentation.resolveEffectiveSchemaDocumentation(restoredSchema,[parent,restoredSchema]);
  const withDraft = verification.updateSchemaWorkingDraft(verification.createSchemaWorkingDraft(restoredSchema),{documentation:{properties:{...restoredSchema.documentation.properties,"/page_type":{displayName:"Page type",description:"Routing input",comments:"Current routing input"}}}},"Update comments");
  const workingSurface = {...revision3,document:withDraft.workingDraft.document,assignments:withDraft.workingDraft.assignments,documentation:withDraft.workingDraft.documentation};
  const working = documentation.resolveEffectiveSchemaDocumentation(workingSurface,[parent,workingSurface]);
  const revision4 = verification.publishSchemaWorkingDraft(withDraft);
  const current = documentation.resolveEffectiveSchemaDocumentation(revision4,[parent,revision4]);
  const historicalSchema = verification.schemaRevision(revision4,3);
  const historical = documentation.resolveEffectiveSchemaDocumentation(historicalSchema,[parent,historicalSchema]);
  const duplicate = verification.duplicateSchemaRevision(revision4,3,[parent,revision4]);
  const duplicateEffective = documentation.resolveEffectiveSchemaDocumentation(duplicate,[parent,duplicate]);
  const destination = {id:"schema:destination",name:"Destination",version:1,document:{type:"object"},assignments:[]};
  const source = propertyCopy.schemaPropertyCopySource(revision4,{surface:"current"});
  const plan = propertyCopy.planSchemaPropertyCopy({source,destination,selectedPath:"/products/*/product_id",schemas:[parent,revision4,destination],reusableRuleIds:[]});
  const copied = propertyCopy.applySchemaPropertyCopy(plan).schema;
  const serialized = verification.serializeSchemaLibrary([parent,revision4]);
  localStorage.setItem("comments-lifecycle-runtime",serialized);
  const reloaded = verification.restoreSchemaLibrary(localStorage.getItem("comments-lifecycle-runtime"));
  const imported = verification.importSchema(verification.exportSchema(revision4));
  const removal = propertyRemoval.removeSchemaProperty(revision4.document,[],"/products",revision4.documentation);
  const undone = propertyRemoval.undoSchemaPropertyRemoval(removal);
  const legacy = verification.restoreSchemaLibrary(JSON.stringify([{id:"legacy",name:"Legacy",version:1,document:{type:"object",properties:{page_type:{type:"string"}}},assignments:[],documentation:{properties:{"/page_type":{displayName:"Page type",description:"Legacy entry"}}}}]))[0];
  return {
    inheritance:{local:local.properties["/currency"].comments,localOwner:local.properties["/currency"].origin.name,restored:restoredInherited.properties["/currency"].comments,restoredOwner:restoredInherited.properties["/currency"].origin.name,restoredInherited:restoredInherited.properties["/currency"].inherited,parentUnchanged:parentBefore===JSON.stringify(parent),pathCount:Object.keys(restoredInherited.properties).filter((path)=>path==="/currency").length},
    revisions:{working:working.properties["/page_type"].comments,workingOwner:working.properties["/page_type"].origin.name,current:current.properties["/page_type"].comments,currentOwner:current.properties["/page_type"].origin.name,currentVersion:revision4.version,historical:historical.properties["/page_type"].comments,historicalOwner:historical.properties["/page_type"].origin.name,historicalVersion:historicalSchema.version},
    duplicate:{local:duplicate.documentation.properties["/products/*/product_id"].comments,inherited:duplicate.documentation.properties["/currency"].comments,effectiveOwner:duplicateEffective.properties["/currency"].origin.name,pathCount:Object.keys(duplicate.documentation.properties).filter((path)=>path==="/currency").length},
    copy:{planned:plan.documentation.find(({path})=>path==="/products/*/product_id").entry.comments,origin:plan.documentation.find(({path})=>path==="/products/*/product_id").origin.name,stored:copied.workingDraft.documentation.properties["/products/*/product_id"].comments,pathCount:Object.keys(copied.workingDraft.documentation.properties).filter((path)=>path==="/products/*/product_id").length},
    persistence:{reloaded:reloaded[1].documentation.properties["/page_type"].comments,reloadedHistorical:reloaded[1].revisionHistory[0].documentation.properties["/page_type"].comments,imported:imported.documentation.properties["/page_type"].comments,legacyBlank:legacy.documentation.properties["/page_type"].comments??""},
    removal:{removed:removal.documentation.properties?.["/products/*/product_id"]??null,restored:undone.documentation.properties["/products/*/product_id"].comments,propertyRemoved:removal.document.properties.products===undefined,propertyRestored:undone.document.properties.products.items.properties.product_id.type},
  };
})()`;

const schemaPropertyCommentsRemovalRuntime = `(async () => {
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const waitForEditorIdle=async(label)=>{for(let attempt=0;attempt<400;attempt+=1){if(q("#schema-editor").getAttribute("aria-busy")!=="true")return;await new Promise((resolve)=>setTimeout(resolve,10));}throw new Error("Timed out waiting for "+label);};
  const schemaKey="my-chrome-utilities.schema-library.v1";
  const original=JSON.parse(localStorage.getItem(schemaKey)).find(({id})=>id==="schema-generic-pageview");
  const rulesBefore=JSON.stringify(original.workingDraft.attachedRules);
  q("#data-layer-view-schemas").click();
  const schemaRow=Array.from(q("#schema-list").children).find(({textContent})=>textContent.includes("Generic pageview"));
  Array.from(schemaRow.querySelectorAll("button")).find(({textContent})=>textContent==="Edit working draft").click();
  let property=q('[data-schema-property-canonical-path="/products/*/price_monthly"]');
  property.querySelector(".schema-property-documentation-control").click();
  property.querySelector('[id^="schema-documentation-comments-"]').value="Only local comment";
  property.querySelector('input[value="Save documentation"]').click();
  const queuedWhileBusy=q("#schema-editor").getAttribute("aria-busy")==="true";
  property=q('[data-schema-property-canonical-path="/products/*/price_monthly"]');property.querySelector(".schema-property-documentation-control").click();
  const retainedBeforeRemoval=property.querySelector('[id^="schema-documentation-comments-"]').value;
  property.querySelector('[id^="schema-documentation-comments-"]').value="";property.querySelector('input[value="Save documentation"]').click();
  const dialog=q("#schema-documentation-removal-dialog");const requested=dialog.open;const summary=dialog.textContent;
  Array.from(dialog.querySelectorAll("button")).find(({textContent})=>textContent==="Cancel").click();
  const cancelled={closed:!dialog.open,retained:retainedBeforeRemoval};
  property.querySelector('input[value="Save documentation"]').click();
  Array.from(dialog.querySelectorAll("button")).find(({textContent})=>textContent==="Remove documentation").click();
  const stored=(await __waitForDurableSchemaObservation((schemas)=>schemas.some(({id,workingDraft})=>id==="schema-generic-pageview"&&workingDraft&&!workingDraft.documentation?.properties?.["/products/*/price_monthly"]),"the removed price documentation")).find(({id,workingDraft})=>id==="schema-generic-pageview"&&workingDraft&&!workingDraft.documentation?.properties?.["/products/*/price_monthly"]);
  await waitForEditorIdle("the removed price documentation settlement");
  return {queuedWhileBusy,requested,summary,cancelled,confirmed:{removed:stored.workingDraft.documentation.properties?.["/products/*/price_monthly"]??null,propertyType:stored.workingDraft.document.properties.products.items.properties.price_monthly.type,rulesUnchanged:rulesBefore===JSON.stringify(stored.workingDraft.attachedRules)}};
})()`;

const schemaPropertyCommentsSpecificationSeedRuntime = `(() => {
  const key="my-chrome-utilities.schema-library.v1";
  const schemas=JSON.parse(localStorage.getItem(key));
  const parent=schemas.find(({name})=>name==="Base event");
  const schema=schemas.find(({name})=>name==="Generic pageview");
  parent.documentation.properties["/site_id"].comments="Inherited site comment";
  schema.documentation.properties["/page_type"].comments="Published page comment";
  schema.revisionHistory[0].documentation.properties["/legacy"].comments="Historical legacy comment";
  schema.workingDraft.documentation.properties["/products/*/product_name"].comments="First line\\nSecond\\tcell | <script>globalThis.specificationCommentExecuted=true</script>";
  schema.workingDraft.documentation.properties["/page_type"].comments="Working page comment";
  schema.workingDraft.documentation.properties["/draft_only"].comments="Working draft comment";
  localStorage.setItem(key,JSON.stringify(schemas));
  return true;
})()`;

const schemaPropertyCommentsSpecificationContractRuntime = `(async () => {
  const pause=()=>new Promise((resolve)=>setTimeout(resolve,0));
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const copied=[];let failRich=false;
  globalThis.ClipboardItem=class{constructor(data){this.data=data;this.types=Object.keys(data);}};
  Object.defineProperty(navigator,"clipboard",{configurable:true,value:{write:async(items)=>{if(failRich)throw new Error("rich unavailable");copied.push(items[0]);},writeText:async(plain)=>copied.push({plain})}});
  q("#data-layer-view-schemas").click();const schemaRow=Array.from(q("#schema-list").children).find(({textContent})=>textContent.includes("Generic pageview"));
  Array.from(schemaRow.querySelectorAll("button")).find(({textContent})=>textContent==="Edit working draft").click();q("#build-specification").click();
  const builder=q("#schema-specification-builder");const source=q("#schema-specification-source",builder);
  const headings=()=>Array.from(builder.querySelectorAll("th[data-specification-column] > span:first-child"),({textContent})=>textContent);
  const row=(path)=>q('tr[data-property-path="'+path+'"]',builder);
  const comments=(path)=>{const index=headings().indexOf("Comments");return row(path).querySelectorAll(":scope > td")[index].textContent;};
  const working={page:comments("/page_type"),nested:comments("/products/*/product_name"),blank:comments("/products/*/price_monthly"),draft:comments("/draft_only"),inherited:comments("/site_id")};
  source.value="published:4";source.dispatchEvent(new Event("change",{bubbles:true}));
  const published={page:comments("/page_type"),nested:comments("/products/*/product_name"),inherited:comments("/site_id")};
  source.value="historical:2";source.dispatchEvent(new Event("change",{bubbles:true}));
  const historical={legacy:comments("/legacy"),inherited:comments("/site_id")};
  source.value="working-draft";source.dispatchEvent(new Event("change",{bubbles:true}));
  const moveCommentsEarlier=()=>{const heading=q('th[data-specification-column="comments"]',builder),trigger=q('[data-reorder-trigger="true"]',heading);trigger.click();Array.from(trigger.parentElement.querySelectorAll("button")).find(({textContent})=>textContent==="Move one position earlier").click();};moveCommentsEarlier();moveCommentsEarlier();
  const reordered=headings();const completeness=q("#schema-specification-completeness",builder).textContent;
  const copy=Array.from(builder.querySelectorAll("button")).find(({textContent})=>textContent==="Copy specification table");
  const spreadsheetMode=q('input[value="spreadsheet"]',builder);spreadsheetMode.click();const afterMode=headings();
  const exampleCell=q('[data-specification-example-path="/products/*/product_name"]',builder);exampleCell.click();const exampleEditor=q(".schema-specification-example-editor",exampleCell),customChoice=q('input[value="custom"]',exampleEditor);customChoice.click();const exampleOverride=q('input[placeholder="Custom value"]',exampleEditor);exampleOverride.value="Override phone";Array.from(exampleEditor.querySelectorAll("button")).find(({textContent})=>textContent==="Apply custom value").click();const afterExample=headings();
  copy.click();await pause();const spreadsheet=copied[0].plain;
  q('input[value="rich"]',builder).click();const style=q('[aria-label="Table style"]',builder);style.value="highlighted";style.dispatchEvent(new Event("change",{bubbles:true}));copy.click();await pause();const headedItem=copied[1];const headed={html:await headedItem.data["text/html"].text(),plain:await headedItem.data["text/plain"].text()};
  const includeHeadings=Array.from(builder.querySelectorAll("label")).find(({textContent})=>textContent.includes("Include headings")).querySelector("input");
  includeHeadings.checked=false;includeHeadings.dispatchEvent(new Event("change",{bubbles:true}));copy.click();await pause();const unheadedItem=copied[2];const unheaded={html:await unheadedItem.data["text/html"].text(),plain:await unheadedItem.data["text/plain"].text()};
  includeHeadings.checked=true;includeHeadings.dispatchEvent(new Event("change",{bubbles:true}));failRich=true;copy.click();await pause();const fallback=copied[3].plain;
  Array.from(builder.querySelectorAll("button")).find(({textContent})=>textContent==="Reset column order").click();const reset=headings();
  return{working,published,historical,reordered,afterMode,afterExample,completeness,spreadsheet,headed,unheaded,fallback,reset,inert:globalThis.specificationCommentExecuted!==true&&!builder.querySelector("script"),runtimeErrors:globalThis.__sidePanelRuntimeErrors??[]};
})()`;

export const fixturePrograms = Object.freeze({ schemaDocumentationRuntime, schemaPropertyExampleValuesRuntime, schemaSpecificationBuilderSeedRuntime, schemaSpecificationBuilderRuntime, schemaSpecificationBuilderCustomizationRuntime, schemaSpecificationBuilderExtendedRuntime, schemaSpecificationExampleSelectionRuntime, schemaSpecificationPreviewLayoutRuntime, schemaSpecificationPreviewThemeRuntime, schemaPropertyCommentsRuntime, schemaSpecificationContainerDefaultsRuntime, schemaPropertyCommentsLiveRuntime, schemaPropertyCommentsLifecycleRuntime, schemaPropertyCommentsRemovalRuntime, schemaPropertyCommentsSpecificationSeedRuntime, schemaPropertyCommentsSpecificationContractRuntime });
export const definitions = createExecutableTargetDefinitions("schema-documentation", fixturePrograms, { observe:executeFixture });
