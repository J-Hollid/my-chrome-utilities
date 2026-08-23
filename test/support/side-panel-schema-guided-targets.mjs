import { createExecutableTargetDefinitions } from "./side-panel-browser-target-contract.mjs";
import { projectFixturePrograms } from "./side-panel-browser-project-fixtures.mjs";
import { guidedDestinationOptionsRuntime, guidedValidationRuntime } from "./side-panel-schema-guided-lifecycle-fixtures.mjs";
import { guidedRuntimeWaitHelpers, openPageviewInspector } from "./side-panel-schema-fixture-primitives.mjs";

async function executeFixture({ context, fixturePrograms, target }) {
  return context.executeFixture({ fixturePrograms, target });
}


const guidedNestedPropertyMergeRuntime = `(async () => {
  const q = (selector) => { const value = document.querySelector(selector); if (!value) throw new Error("Missing " + selector); return value; };
  const clickButton = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find((candidate) => candidate.textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  ${guidedRuntimeWaitHelpers}
  globalThis.chrome = {
    tabs:{ query:async () => [{ id:23, windowId:4, url:"http://127.0.0.1:4173/", title:"Fixture", active:true }] },
    scripting:{ executeScript:async () => [{ result:{ queue:{ history:[{ event:"product_view", products:[{ product_name:"Notebook", product_id:101 }] }] } } }] },
  };
  q("#choose-observation-target").click();
  (await waitForElement("#observation-target-list [data-target-id]")).click();
  (await waitForElement("#start-data-layer-testing:not(:disabled)")).click();
  (await waitForElement("#live-event-feed button")).click();
  const flow = q("#guided-validation-flow");
  let stored;
  const save = async (path, requirement, value) => {
    q('#live-event-inspector button[aria-label="Add validation for ' + path + '"]').click();
    const requirementControl = q("#guided-requirement");
    requirementControl.value = requirement;
    requirementControl.dispatchEvent(new Event("change", { bubbles:true }));
    if (value !== undefined) {
      const configured = q("#guided-allowed-value-1");
      configured.value = value;
      configured.dispatchEvent(new Event("input", { bubbles:true }));
    }
    clickButton(flow, "Continue");
    clickButton(flow, "Add validation to draft");
    stored = await globalThis.__waitForDurableSchemaObservation((schemas) => schemas.some(({ id, workingDraft }) => id === "schema-product-detail" && workingDraft?.attachedRules?.some(({ propertyPath }) => propertyPath === path)), "guided nested rule for " + path);
  };
  await save("/products/*/product_name", "Must be one of these values", "Notebook");
  await save("/products/*/product_id", "Must be one of these values", "101");
  const product = stored.find(({ id }) => id === "schema-product-detail");
  const item = product.workingDraft.document.properties.products.items;
  const sibling = {
    types:{ name:item.properties.product_name.type, id:item.properties.product_id.type },
    rulePaths:product.workingDraft.attachedRules.map(({ propertyPath }) => propertyPath).sort(),
    sameItem:item.type === "object",
  };
  clickButton(q("#guided-draft-continuation"), "Review draft");
  sibling.treePaths = Array.from(document.querySelectorAll("#schema-property-tree [data-schema-property-path]"), ({ dataset }) => dataset.schemaPropertyPath);

  const verification = await import("/data-layer-schema-verification.js");
  const restored = verification.restoreSchemaLibrary(JSON.stringify(stored)).find(({ id }) => id === "schema-product-detail");
  const active = { ...restored, document:restored.workingDraft.document, assignments:restored.workingDraft.assignments, attachedRules:restored.workingDraft.attachedRules };
  const invalid = verification.validateWithSchema({ sourceId:"event-history", eventName:"product_view", payload:{ products:[{ product_name:"Wrong", product_id:999 }] }, rawInput:[] }, active, [active]);
  const persistence = {
    properties:Object.keys(active.document.properties.products.items.properties).sort(),
    rulePaths:active.attachedRules.map(({ propertyPath }) => propertyPath).sort(),
    failures:invalid.issues.filter(({ templatePath }) => templatePath?.startsWith("/products/*/")).map(({ templatePath, instancePath }) => [templatePath, instancePath]).sort(),
  };

  return { sibling, persistence };
})()`;

const guidedNestedConstraintRuntime = `(async () => {
  const q = (selector) => { const value = document.querySelector(selector); if (!value) throw new Error("Missing " + selector); return value; };
  const clickButton = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find((candidate) => candidate.textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  ${guidedRuntimeWaitHelpers}
  globalThis.chrome = {
    tabs:{ query:async () => [{ id:23, windowId:4, url:"http://127.0.0.1:4173/", title:"Fixture", active:true }] },
    scripting:{ executeScript:async () => [{ result:{ queue:{ history:[{ event:"product_view", products:[{ product_name:"Notebook", product_id:101 }] }] } } }] },
  };
  await endActiveSession();
  q("#choose-observation-target").click();
  (await waitForElement("#observation-target-list [data-target-id]")).click();
  (await waitForElement("#start-data-layer-testing:not(:disabled)")).click();
  (await waitForElement("#live-event-feed button")).click();
  q('#live-event-inspector button[aria-label="Add validation for /products/*/product_id"]').click();
  const flow = q("#guided-validation-flow");
  q("#guided-requirement").value = "Must be present";
  q("#guided-requirement").dispatchEvent(new Event("change", { bubbles:true }));
  clickButton(flow, "Continue");
  clickButton(flow, "Add validation to draft");
  const stored = await globalThis.__waitForDurableSchemaObservation((schemas) => schemas.some(({ id, workingDraft }) => id === "schema-product-detail" && workingDraft?.attachedRules?.some(({ propertyPath }) => propertyPath === "/products/*/product_id")), "guided nested constrained product id rule");
  const draft = stored.find(({ id }) => id === "schema-product-detail").workingDraft;
  return {
    products:draft.document.properties.products,
    documentation:draft.documentation,
    rules:draft.attachedRules.map(({ id, propertyPath, operator, parameters }) => ({ id, propertyPath, operator, parameters })),
    pending:draft.pendingChanges,
  };
})()`;


const guidedSchemaPickerRuntime = `(async () => {
  const q = (selector) => { const value = document.querySelector(selector); if (!value) throw new Error("Missing " + selector); return value; };
  ${guidedRuntimeWaitHelpers}
  const clickButton = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find((candidate) => candidate.textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  globalThis.chrome = {
    tabs:{ query:async () => [{ id:23, windowId:4, url:"http://127.0.0.1:4173/", title:"Fixture", active:true }] },
    scripting:{ executeScript:async () => [{ result:{ queue:{ history:[{ event:"pageview", page_type:"product_list" }] } } }] },
  };
  await endActiveSession();
  q("#choose-observation-target").click();
  (await waitForElement("#observation-target-list [data-target-id]")).click();
  (await waitForElement("#start-data-layer-testing:not(:disabled)")).click();
  (await waitForElement("#live-event-feed button")).click();
  q('#live-event-inspector button[aria-label="Add validation for /page_type"]').click();
  const flow = q("#guided-validation-flow");
  const closed = {
    searchAbsent:!document.querySelector("#guided-schema-search"),
    resultsAbsent:!document.querySelector("#guided-schema-results"),
    scrollHeight:flow.scrollHeight,
  };
  q("#guided-existing-schema-picker").click();
  let dialog = q("#guided-schema-picker");
  const search = q("#guided-schema-search");
  const opened = {
    modal:dialog.matches(":modal"),
    searchFocused:document.activeElement === search,
    resultCount:q("#guided-schema-results").querySelectorAll(":scope > article").length,
    count:q("#guided-schema-result-count").textContent,
    listScrolls:q("#guided-schema-results").scrollHeight > q("#guided-schema-results").clientHeight,
    dialogBounded:dialog.getBoundingClientRect().width <= innerWidth && dialog.getBoundingClientRect().height <= innerHeight,
    flowUnexpanded:Math.abs(flow.scrollHeight - closed.scrollHeight) <= 2,
  };
  q("#guided-validation-heading").focus();
  opened.backgroundExcluded = dialog.contains(document.activeElement);
  const searchFor = (query) => {
    const field = q("#guided-schema-search"); field.value = query; field.dispatchEvent(new Event("input", { bubbles:true }));
    return {
      names:Array.from(q("#guided-schema-results").querySelectorAll("h6")).map((node) => node.textContent),
      targets:Array.from(q("#guided-schema-results").querySelectorAll(".guided-schema-result > p:first-of-type")).map((node) => node.textContent),
      count:q("#guided-schema-result-count").textContent,
    };
  };
  const searches = {
    name:searchFor("Product listing"),
    version:searchFor("version 4"),
    target:searchFor("payload"),
    property:searchFor("page_type"),
    domain:searchFor("shop.example"),
    path:searchFor("/products/*"),
  };
  const missing = searchFor("missing-schema");
  const empty = { message:q("#guided-schema-empty-result").textContent, selected:flow.querySelector('input[name="guided-schema-destination"]:checked')?.value ?? null };
  clickButton(q("#guided-schema-results"), "Clear search");
  empty.restoredCount = q("#guided-schema-result-count").textContent;
  const rows = Array.from(q("#guided-schema-results").querySelectorAll(":scope > article"));
  const productRow = rows.find((row) => row.querySelector("h6").textContent === "Product listing version 3");
  const rawRow = rows.find((row) => row.querySelector("h6").textContent === "Raw event version 2");
  const resultPresentation = {
    product:Array.from(productRow.querySelectorAll("h6,p")).map((node) => node.textContent),
    incompatible:Array.from(rawRow.querySelectorAll("h6,p")).map((node) => node.textContent),
    incompatibleDisabled:rawRow.querySelector("button").disabled,
  };
  productRow.querySelector("button").focus();
  productRow.querySelector("button").dispatchEvent(new KeyboardEvent("keydown", { key:"ArrowDown", bubbles:true }));
  resultPresentation.skippedIncompatible = document.activeElement !== rawRow.querySelector("button") && !document.activeElement.disabled;
  productRow.querySelector("button").focus();
  productRow.querySelector("button").dispatchEvent(new KeyboardEvent("keydown", { key:"Enter", bubbles:true }));
  const enterSelection = {
    dialogClosed:!document.querySelector("#guided-schema-picker"),
    summary:q("#guided-existing-schema-summary p").textContent,
    changeFocused:document.activeElement === q("#guided-change-existing-schema"),
    target:q("#guided-target").value,
  };
  clickButton(flow, "Continue");
  enterSelection.expectedTypeSource = q("#guided-expected-type-hint").textContent;
  clickButton(flow, "Back");
  clickButton(flow, "Change existing schema");
  dialog = q("#guided-schema-picker");
  const unchangedBefore = [q("#guided-existing-schema-summary p").textContent, q("#guided-target").value];
  dialog.dispatchEvent(new Event("cancel", { cancelable:true }));
  const escapeDismissal = {
    dialogClosed:!document.querySelector("#guided-schema-picker"),
    unchanged:JSON.stringify(unchangedBefore) === JSON.stringify([q("#guided-existing-schema-summary p").textContent, q("#guided-target").value]),
    restored:document.activeElement === q("#guided-change-existing-schema"),
  };
  clickButton(flow, "Change existing schema");
  clickButton(q("#guided-schema-picker"), "Close schema picker");
  const closeDismissal = { dialogClosed:!document.querySelector("#guided-schema-picker"), restored:document.activeElement === q("#guided-change-existing-schema") };
  clickButton(flow, "Change existing schema");
  clickButton(q("#guided-schema-picker"), "Select Product listing version 3");
  const buttonSelection = { summary:q("#guided-existing-schema-summary p").textContent, changeFocused:document.activeElement === q("#guided-change-existing-schema") };
  return { closed, opened, searches, missing, empty, resultPresentation, enterSelection, escapeDismissal, closeDismissal, buttonSelection };
})()`;

const guidedDraftContinuationInitialRuntime = `(async () => {
  const ui = await import("/data-layer-live-observer-ui.js");
  const actionCore = await import("/data-layer-live-inspector-actions.js");
  const event = { id:"event:pageview", name:"pageview", sourceId:"event-history", captureTime:"2026-07-13T21:00:00Z", pageUrl:"http://127.0.0.1:4173/", payload:{ page_name:"Products" }, rawInput:[], validation:"Not checked", provenance:"Captured" };
  const actions = actionCore.createLiveInspectorActions({ currentPageUrl:()=>event.pageUrl, writeClipboard:async()=>{}, storeTemplate:()=>{}, addPropertyValidation:()=>{}, validationState:()=>"Valid", updateValidation:()=>{}, manualSchemaChoices:()=>[], selectManualSchema:()=>{} });
  const elements = ui.findLiveObserverElements();
  ui.renderLiveInspector(elements, event, actions);
  const inspector = elements.eventInspector;
  return {
    propertyAvailable:Boolean(inspector.querySelector('button[aria-label="Add validation for /page_name"]')),
    genericAbsent:!Array.from(inspector.querySelectorAll("button")).some(({ textContent }) => textContent === "Create validation from this event"),
    continuationAbsent:!inspector.querySelector("#guided-draft-continuation"),
  };
})()`;

const guidedDraftContinuationRuntime = `(async () => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const click = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  const storedSchema = (id) => JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1") ?? "[]").find((schema) => schema.id === id);
  const reopen = () => { q("#data-layer-view-live").click(); q("#live-event-feed button").click(); };
  ${guidedRuntimeWaitHelpers}
  ${openPageviewInspector}
  const inspector = q("#live-event-inspector");
  const section = q("#guided-draft-continuation");
  const initial = {
    heading:section.querySelector("h5").textContent,
    status:section.querySelector("p").textContent,
    actions:Array.from(section.querySelectorAll("button")).map(({ textContent }) => textContent),
    sectionCount:inspector.querySelectorAll("#guided-draft-continuation").length,
    genericAbsent:!Array.from(inspector.querySelectorAll("button")).some(({ textContent }) => textContent === "Create validation from this event"),
  };
  const beforeProduct = structuredClone(storedSchema("schema-product-listing"));
  const beforeCheckout = structuredClone(storedSchema("schema-checkout"));
  q('#live-event-inspector button[aria-label="Add validation for /page_name"]').click();
  const flow = q("#guided-validation-flow");
  const opened = {
    context:q("#guided-continuation-context").textContent,
    stages:Array.from(q("#guided-validation-stages").children).map(({ textContent }) => textContent),
  };
  const requirement = {
    heading:q("#guided-validation-heading").textContent,
    destinationAbsent:!flow.querySelector("#guided-schema-destination") && !flow.querySelector("#guided-schema-picker"),
    selectedSchema:JSON.parse(localStorage.getItem("my-chrome-utilities.guided-validation-continuations.v1"))["event-history\\u0000pageview"],
  };
  q("#guided-requirement").value = "Must be present";
  q("#guided-requirement").dispatchEvent(new Event("change", { bubbles:true }));
  click(flow, "Continue");
  const prefill = {
    configurationAbsent:!flow.querySelector("#guided-routing-prefills"),
    selectionAbsent:!flow.querySelector("#guided-compatible-assignments"),
  };
  click(flow, "Cancel");
  const productSection = q("#guided-draft-continuation");
  click(productSection, "Review draft");
  const review = { name:q("#schema-editor-name").value, status:q("#schema-editor-status").textContent, checkoutUnchanged:JSON.stringify(storedSchema("schema-checkout")) === JSON.stringify(beforeCheckout) };
  reopen();
  click(q("#guided-draft-continuation"), "Publish revision");
  const publication = { review:q("#schema-revision-review-summary").textContent, productCurrent:storedSchema("schema-product-listing").version, checkoutUnchanged:JSON.stringify(storedSchema("schema-checkout")) === JSON.stringify(beforeCheckout) };
  q("#cancel-schema-revision").click();
  reopen();
  click(q("#guided-draft-continuation"), "Use a different schema");
  const switcher = q("#guided-continuation-schema-picker");
  const switchOpen = { heading:switcher.querySelector("h5").textContent, choices:Array.from(switcher.querySelectorAll(":scope > div > button")).map(({ textContent }) => textContent), productUnchanged:JSON.stringify(storedSchema("schema-product-listing")) === JSON.stringify(beforeProduct) };
  click(switcher, "Cancel");
  const afterCancel = { context:q("#guided-draft-continuation h5").textContent, productUnchanged:JSON.stringify(storedSchema("schema-product-listing")) === JSON.stringify(beforeProduct) };
  click(q("#guided-draft-continuation"), "Use a different schema");
  click(q("#guided-continuation-schema-picker"), "Checkout revision 2 · 1 pending changes");
  const afterSwitch = {
    context:q("#guided-draft-continuation h5").textContent,
    sectionCount:inspector.querySelectorAll("#guided-draft-continuation").length,
    unnamedAbsent:!inspector.textContent.includes("Unnamed draft"),
    productUnchanged:JSON.stringify(storedSchema("schema-product-listing")) === JSON.stringify(beforeProduct),
  };
  const core = await import("/data-layer-guided-validation.js");
  const event = { id:"event:pageview", name:"pageview", sourceId:"event-history", pageUrl:"http://127.0.0.1:4173/", payload:{ page_name:"Products" } };
  const candidate = (assignments) => ({ id:"schema-product-listing", name:"Product listing", version:3, target:"payload", propertyTypes:{ page_name:"String" }, assignments });
  const resolution = (assignments) => {
    const schema = candidate(assignments); const draft = core.createGuidedContinuationDraft(event, schema);
    return core.selectGuidedContinuationProperty(draft, "page_name", schema).assignmentResolution.selection;
  };
  const assignmentResolution = {
    none:resolution([]),
    multiple:resolution([
      { id:"assignment:a", name:"Product pages", sourceId:"event-history", eventName:"pageview", target:"payload", enabled:true },
      { id:"assignment:b", name:"Alternate pages", sourceId:"event-history", eventName:"pageview", target:"payload", enabled:true },
    ]),
  };
  return { initial, opened, requirement, prefill, review, publication, switchOpen, afterCancel, afterSwitch, assignmentResolution };
})()`;

const guidedDraftContinuationReloadRuntime = `(async () => {
  ${guidedRuntimeWaitHelpers}
  ${openPageviewInspector}
  const section = document.querySelector("#guided-draft-continuation");
  document.querySelector('#live-event-inspector button[aria-label="Add validation for /page_name"]').click();
  return {
    context:section.querySelector("h5").textContent,
    heading:document.querySelector("#guided-validation-heading").textContent,
    destinationAbsent:!document.querySelector("#guided-schema-destination") && !document.querySelector("#guided-schema-picker"),
    expectedTypeSource:document.querySelector("#guided-expected-type-hint").textContent,
  };
})()`;

const guidedAssignmentCoverageRuntime = `(async () => {
  const ui = await import("/data-layer-guided-validation-ui.js");
  const core = await import("/data-layer-guided-validation.js");
  const q = (root, selector) => { const value = root.querySelector(selector); if (!value) throw new Error("Missing " + selector); return value; };
  const click = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  const change = (field, value) => { field.value = value; field.dispatchEvent(new Event("change", { bubbles:true })); };
  const event = { id:"event:order-complete", name:"order_complete", sourceId:"event-history", pageUrl:"https://shop.example/orders/confirmed", payload:{ order_id:"ORDER-1", currency:"EUR", value:42 } };
  const host = document.createElement("section"); host.innerHTML = '<section id="guided-assignment-coverage-flow"></section>'; document.body.append(host);
  const root = q(host, "#guided-assignment-coverage-flow");
  let schemas = [];
  let candidates = [];
  let savedActions = [];
  const publishedMatch = (schema, assignment) => schema.assignments.some((published) => published.id && assignment.id ? published.id === assignment.id : core.guidedAssignmentsMatch(published, assignment));
  const candidate = (schema, continuation = false) => {
    const editable = continuation && schema.workingDraft ? schema.workingDraft : schema;
    const assignments = editable.assignments.map((assignment) => ({ ...assignment, ...(continuation && !publishedMatch(schema, assignment) ? { pending:true } : {}) }));
    return { id:schema.id, name:schema.name, version:schema.version, target:assignments[0]?.target ?? "payload", propertyTypes:{}, assignments };
  };
  const persist = (result) => {
    savedActions.push(result.destination.assignmentAction);
    const existing = schemas.find(({ id }) => id === result.schema.id);
    const assignments = existing?.workingDraft?.assignments ?? existing?.assignments ?? [];
    const nextAssignments = core.assignmentDraftAfterGuidedSave(assignments, result.assignment, result.destination.assignmentAction);
    const rules = existing?.workingDraft?.rules ?? [];
    const nextRules = [...rules.filter(({ path }) => path !== result.schema.rules[0].path), result.schema.rules[0]];
    const next = existing
      ? { ...existing, workingDraft:{ ...(existing.workingDraft ?? { baseVersion:existing.version, sourceVersion:existing.version }), assignments:nextAssignments, rules:nextRules, pendingChanges:[...(existing.workingDraft?.pendingChanges ?? []), "Add " + result.schema.rules[0].path + " validation"] } }
      : { id:result.schema.id, name:result.schema.name, version:1, published:false, document:{ type:"object" }, assignments:[], workingDraft:{ baseVersion:0, sourceVersion:0, assignments:nextAssignments, rules:nextRules, pendingChanges:["Add " + result.schema.rules[0].path + " validation"] } };
    schemas = [...schemas.filter(({ id }) => id !== next.id), next];
    localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify(schemas));
  };
  const flow = ui.createGuidedValidationFlow(root, { schemaCandidates:()=>candidates, publish:persist });
  const chooseRequirement = () => { change(q(root, "#guided-requirement"), "Must be present"); click(root, "Continue"); };
  const openExisting = (schema, path) => {
    candidates = [candidate(schema)];
    flow.openProperty(event, path);
    q(root, 'input[name="guided-schema-destination"][value="existing"]').click();
    click(root, "Select " + schema.name + " version " + schema.version);
  };
  const save = async () => { click(root, "Add validation to draft"); await new Promise((resolve) => setTimeout(resolve, 0)); };

  schemas = [];
  candidates = [];
  flow.openProperty(event, "order_id");
  q(root, 'input[name="guided-schema-destination"][value="new"]').click();
  const schemaName = q(root, "#guided-new-schema-name"); schemaName.value = "Order completed"; schemaName.dispatchEvent(new Event("input", { bubbles:true }));
  click(root, "Continue"); chooseRequirement();
  const firstConfigurationDisplayed = Boolean(root.querySelector("#guided-routing-prefills"));
  change(q(root, "#guided-assignment-name"), "confirmed orders");
  q(root, 'input[name="guided-scope"][value="current-path"]').click();
  click(root, "Continue"); await save();
  let orderSchema = schemas[0];
  const firstAssignment = structuredClone(orderSchema.workingDraft.assignments[0]);
  const laterVisibility = [];
  for (const property of ["currency", "value"]) {
    flow.openProperty(event, property, candidate(orderSchema, true));
    laterVisibility.push({
      configuration:Boolean(root.querySelector("#guided-routing-prefills")),
      selection:Boolean(root.querySelector("#guided-compatible-assignments")),
      stages:Array.from(q(root, "#guided-validation-stages").children).map(({ textContent }) => textContent),
    });
    chooseRequirement(); await save(); orderSchema = schemas.find(({ id }) => id === orderSchema.id);
  }
  const first = {
    firstConfigurationDisplayed,
    laterVisibility,
    assignmentCount:orderSchema.workingDraft.assignments.length,
    assignment:orderSchema.workingDraft.assignments[0],
    assignmentUnchanged:JSON.stringify(firstAssignment) === JSON.stringify(orderSchema.workingDraft.assignments[0]),
    rulePaths:orderSchema.workingDraft.rules.map(({ path }) => path),
  };

  const publishedAssignment = { id:"assignment:shop-orders", name:"shop order pages", sourceId:"event-history", eventName:"order_complete", target:"payload", domainCondition:"*.example", pathnameCondition:"/orders/*", priority:240, versionPolicy:"follow latest", enabled:true };
  const publishedSchema = { id:"schema-order-published", name:"Order completed", version:4, published:true, document:{ type:"object" }, assignments:[publishedAssignment] };
  schemas = [publishedSchema]; candidates = [];
  openExisting(publishedSchema, "order_id"); click(root, "Continue");
  const publishedVisibility = { configuration:Boolean(root.querySelector("#guided-routing-prefills")), selection:Boolean(root.querySelector("#guided-compatible-assignments")) };
  chooseRequirement(); await save();
  const savedPublished = schemas[0];
  const published = {
    ...publishedVisibility,
    action:savedActions.at(-1),
    assignmentCount:savedPublished.workingDraft.assignments.length,
    assignment:savedPublished.workingDraft.assignments[0],
    identityUnchanged:JSON.stringify(publishedAssignment) === JSON.stringify(savedPublished.workingDraft.assignments[0]),
    rulePaths:savedPublished.workingDraft.rules.map(({ path }) => path),
  };

  const productAssignment = { ...publishedAssignment, id:"assignment:products", name:"product pages", domainCondition:"shop.example", pathnameCondition:"/products/*", priority:90, versionPolicy:"pinned" };
  const incompatibleSchema = { id:"schema-order-incompatible", name:"Order completed", version:2, published:true, document:{ type:"object" }, assignments:[productAssignment] };
  schemas = [incompatibleSchema]; candidates = [];
  openExisting(incompatibleSchema, "order_id"); click(root, "Continue"); chooseRequirement();
  const incompatibleBefore = {
    configuration:Boolean(root.querySelector("#guided-routing-prefills")),
    selection:Boolean(root.querySelector("#guided-compatible-assignments")),
    assignmentCount:schemas[0].assignments.length,
    defaults:{ source:q(root, "#guided-scope-source").value, event:q(root, "#guided-scope-event").value, target:q(root, "#guided-scope-target").value, domain:q(root, "#guided-scope-domain").value, pathname:q(root, "#guided-scope-pathname").value },
  };
  change(q(root, "#guided-assignment-name"), "confirmed orders");
  q(root, 'input[name="guided-scope"][value="current-path"]').click();
  click(root, "Continue"); await save();
  let incompatibleSaved = schemas[0];
  const afterConfirm = { count:incompatibleSaved.workingDraft.assignments.length, names:incompatibleSaved.workingDraft.assignments.map(({ name }) => name) };
  flow.openProperty(event, "currency", candidate(incompatibleSaved, true));
  const laterIncompatibleVisibility = { configuration:Boolean(root.querySelector("#guided-routing-prefills")), selection:Boolean(root.querySelector("#guided-compatible-assignments")) };
  chooseRequirement(); await save(); incompatibleSaved = schemas[0];
  const incompatible = { before:incompatibleBefore, afterConfirm, laterVisibility:laterIncompatibleVisibility, finalCount:incompatibleSaved.workingDraft.assignments.length, laterAction:savedActions.at(-1), assignments:incompatibleSaved.workingDraft.assignments, rulePaths:incompatibleSaved.workingDraft.rules.map(({ path }) => path) };

  const secondCoverage = { ...publishedAssignment, id:"assignment:secondary-orders", name:"secondary order coverage", priority:120 };
  const multipleSchema = { id:"schema-order-multiple", name:"Order completed", version:5, published:true, document:{ type:"object" }, assignments:[publishedAssignment, secondCoverage] };
  schemas = [multipleSchema]; candidates = [];
  openExisting(multipleSchema, "currency"); click(root, "Continue");
  const multipleVisibility = { configuration:Boolean(root.querySelector("#guided-routing-prefills")), selection:Boolean(root.querySelector("#guided-compatible-assignments")), stages:Array.from(q(root, "#guided-validation-stages").children).map(({ textContent }) => textContent) };
  chooseRequirement(); await save();
  const multiple = { ...multipleVisibility, action:savedActions.at(-1), beforeCount:2, afterCount:schemas[0].workingDraft.assignments.length, identities:schemas[0].workingDraft.assignments.map(({ id }) => id), rulePaths:schemas[0].workingDraft.rules.map(({ path }) => path) };

  host.remove();
  return { event:{ name:event.name, sourceId:event.sourceId, pageUrl:event.pageUrl }, schemaName:"Order completed", first, published, incompatible, multiple };
})()`;

const liveGuidedConditionalRuleSeedRuntime = `(() => {
  localStorage.clear();
  const document={type:"object",properties:{page_type:{type:"string"},currency:{type:"string"},customer:{type:"object",properties:{type:{type:"string"}}},products:{type:"array",items:{type:"object",properties:{price_monthly:{type:"number"},duration:{type:"number"}}}},oOrder:{type:"object",properties:{aProducts:{type:"array",items:{type:"string"}}}}}};
  const assignment={id:"assignment:product",name:"Product events",schemaId:"schema:product",sourceId:"history",eventName:"product_detail",target:"payload",domainCondition:"127.0.0.1",versionPolicy:"follow latest",enabled:true};
  const schema={id:"schema:product",name:"Product event",version:3,published:true,document,assignments:[assignment],attachedRules:[],revisionHistory:[]};
  localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([schema]));
  localStorage.setItem("my-chrome-utilities.schema-rule-library.v1","[]");
  const payload={page_type:"product_detail",currency:"EUR",basket_total:125,consented:true,products:[{price_monthly:29,duration:12},{price_monthly:49}],oOrder:{aProducts:[]}};
  const event={type:"observed",url:"http://127.0.0.1:4173/",timestamp:"2026-07-14T23:30:00Z",observerPath:"dataLayer",id:"event:product-detail",name:"product_detail",sessionId:"session:guided-condition",sourceId:"history",sourceName:"Event history",sourceKind:"Data layer",pageUrl:"http://127.0.0.1:4173/",payload,rawInput:["product_detail",payload],rawValue:["product_detail",payload],validation:"Not checked"};
  localStorage.setItem("dataLayerTestingSession",JSON.stringify({session:{id:"session:guided-condition",status:"active",freshBoundary:true,tabId:1,windowId:1,historyPath:"dataLayer",startUrl:"http://127.0.0.1:4173/",currentUrl:"http://127.0.0.1:4173/",timeline:[event]}}));
  return true;
})()`;

const liveGuidedConditionalRuleRuntime = `(async () => {
  const pause=()=>new Promise((resolve)=>setTimeout(resolve,0));
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const click=(root,label)=>{const value=Array.from(root.querySelectorAll("button")).find(({textContent})=>textContent===label||textContent.startsWith(label));if(!value)throw new Error("Missing action "+label);value.click();return value;};
  const change=(selector,value,event="change")=>{const input=q(selector);input.value=value;input.dispatchEvent(new Event(event,{bubbles:true}));return input;};
  const schemaKey="my-chrome-utilities.schema-library.v1",ruleKey="my-chrome-utilities.schema-rule-library.v1";
  const stored=()=>JSON.parse(localStorage.getItem(schemaKey)); const product=()=>stored().find(({id})=>id==="schema:product");
  q("#live-event-feed button").click();
  const inspector=q("#live-event-inspector");inspector.scrollTop=37;
  const trigger=()=>q('button[aria-label="Add validation for /oOrder/aProducts"]',inspector);
  const revealTrigger=()=>{const button=trigger();let details=button.closest("details");while(details){details.open=true;details=details.parentElement?.closest("details");}return button;};
  const openInitial=()=>{revealTrigger().click();q('input[name="guided-schema-destination"][value="existing"]').click();click(q("#guided-schema-picker"),"Select Product event version 3");click(q("#guided-validation-flow"),"Continue");};
  const targetIndex=()=>{click(q("#guided-advanced-settings"),"Advanced Edit target path");change("#guided-target-expression","/oOrder/aProducts/0","input");change("#guided-target-expected-type","String");click(q("#guided-target-path-editor"),"Apply target path");change("#guided-requirement","Must be present");};
  const enablePageType=()=>{q("#guided-apply-condition").click();change("#guided-condition-property-0","/page_type");};
  openInitial();targetIndex();
  const beforeStorage=[localStorage.getItem(schemaKey),localStorage.getItem(ruleKey)];
  const requirement={heading:q("#guided-validation-heading").textContent,applyOnlyWhen:Boolean(q("#guided-apply-condition")),schemaEditorHidden:q("#schema-editor").hidden,pickerClosed:!q("#schema-property-rule-picker").open};
  q("#guided-apply-condition").click();click(q("#guided-condition-group"),"Remove condition");click(q("#guided-validation-flow"),"Continue");const invalidNoPredicates={assistance:q("#guided-condition-group-error").textContent,storageUnchanged:beforeStorage[0]===localStorage.getItem(schemaKey)&&beforeStorage[1]===localStorage.getItem(ruleKey)};click(q("#guided-condition-group"),"Add another condition");change("#guided-condition-property-0","/page_type");
  const pageOptions=Array.from(q("#guided-condition-property-0").options).map(({value,textContent})=>[value,textContent]);
  const operators=Array.from(q("#guided-condition-operator-0").options).map(({value})=>value);
  const initial={type:q("#guided-condition-type-0").textContent,comparison:q("#guided-condition-comparison-0").value,operators,summary:q("#guided-condition-summary").textContent,customerCount:pageOptions.filter(([value])=>value==="/customer/type").length,currentPageCount:pageOptions.filter(([value])=>value==="/page_type").length,noConsequenceOption:!pageOptions.some(([value])=>value==="/oOrder/aProducts/0"),withinWidth:q("#guided-validation-flow").scrollWidth<=q("#guided-validation-flow").clientWidth};
  change("#guided-condition-property-0","/customer/type");
  const absent={type:q("#guided-condition-type-0").textContent,operators:Array.from(q("#guided-condition-operator-0").options).map(({value})=>value),comparison:q("#guided-condition-comparison-0").value};
  change("#guided-condition-property-0","/page_type");
  change("#guided-condition-comparison-0","","input");click(q("#guided-validation-flow"),"Continue");
  const invalidEmpty={storageUnchanged:beforeStorage[0]===localStorage.getItem(schemaKey)&&beforeStorage[1]===localStorage.getItem(ruleKey),assistance:q("#guided-condition-comparison-0-error").textContent,described:q("#guided-condition-comparison-0").getAttribute("aria-describedby")};
  change("#guided-condition-operator-0","Matches pattern");change("#guided-condition-comparison-0","[","input");click(q("#guided-validation-flow"),"Continue");
  const invalidPattern={assistance:q("#guided-condition-comparison-0-error").textContent,storageUnchanged:beforeStorage[0]===localStorage.getItem(schemaKey)&&beforeStorage[1]===localStorage.getItem(ruleKey)};
  change("#guided-condition-operator-0","Equals");change("#guided-condition-comparison-0","product_detail","input");click(q("#guided-condition-group"),"Add another condition");change("#guided-condition-property-1","/currency");
  const allResult=q("#guided-condition-preview").textContent;
  change("#guided-condition-comparison-1","GBP","input");const allFalse=q("#guided-condition-preview").textContent;
  change("#guided-condition-group-operator","Any");const anyResult=q("#guided-condition-preview").textContent;
  change("#guided-condition-group-operator","All");change("#guided-condition-comparison-1","EUR","input");
  q("#guided-apply-condition").click();const confirmation={open:q("#guided-condition-discard-confirmation").open,text:q("#guided-condition-discard-confirmation").textContent};click(q("#guided-condition-discard-confirmation"),"Keep conditions");confirmation.retained=Boolean(q("#guided-condition-property-1"));q("#guided-apply-condition").click();click(q("#guided-condition-discard-confirmation"),"Discard conditions");confirmation.discarded=!document.querySelector("#guided-condition-group");
  enablePageType();
  click(q("#guided-validation-flow"),"Continue");
  const review={text:q("#guided-validation-review").textContent,storageUnchanged:beforeStorage[0]===localStorage.getItem(schemaKey)&&beforeStorage[1]===localStorage.getItem(ruleKey)};
  click(q("#guided-validation-flow"),"Add validation to draft");
  const localStored=(await globalThis.__waitForDurableSchemaObservation((schemas)=>schemas.some(({id,workingDraft})=>id==="schema:product"&&workingDraft?.attachedRules?.some(({id:ruleId})=>ruleId.startsWith("local-rule:"))),"local guided conditional rule")).find(({id})=>id==="schema:product");const localRule=localStored.workingDraft.attachedRules.find(({id})=>id.startsWith("local-rule:"));
  const active={...localStored,document:localStored.workingDraft.document,assignments:localStored.workingDraft.assignments,attachedRules:localStored.workingDraft.attachedRules,workingDraft:undefined};
  const core=await import("/data-layer-schema-verification.js");
  const failed=core.validateEvent({sourceId:"history",eventName:"product_detail",payload:{page_type:"product_detail",currency:"EUR",oOrder:{aProducts:[]}},rawInput:[]},[active]);
  const notApplicable=core.validateEvent({sourceId:"history",eventName:"product_detail",payload:{page_type:"category",currency:"EUR",oOrder:{aProducts:[]}},rawInput:[]},[active]);
  const local={path:localRule.propertyPath,condition:localRule.conditionGroup,severity:localRule.severity,message:localRule.message,enabled:localRule.enabled,failed:failed.state,failedIssues:failed.issues.length,notApplicable:notApplicable.evaluations.find(({propertyPath,status})=>propertyPath===localRule.propertyPath&&status==="not-applicable")?.status,notApplicableIssues:notApplicable.issues.length,restoredFocus:document.activeElement?.getAttribute("aria-label"),restoredScroll:inspector.scrollTop};
  trigger().click();targetIndex();enablePageType();click(q("#guided-validation-flow"),"Continue");q("#guided-publish-rule").click();click(q("#guided-validation-flow"),"Add validation to draft");
  const afterReusable=(await globalThis.__waitForDurableSchemaObservation((schemas)=>{const reusableId=JSON.parse(localStorage.getItem(ruleKey)??"[]")[0]?.id;return Boolean(reusableId&&schemas.some(({id,workingDraft})=>id==="schema:product"&&workingDraft?.attachedRules?.some(({id:ruleId})=>ruleId===reusableId)));},"reusable guided conditional rule attachment")).find(({id})=>id==="schema:product");const rules=JSON.parse(localStorage.getItem(ruleKey));const reusableRule=rules[0];const reusableAttachment=afterReusable.workingDraft.attachedRules.find(({id})=>id===reusableRule.id);
  const reusable={libraryCount:rules.length,attachmentCount:afterReusable.workingDraft.attachedRules.filter(({id})=>id===reusableRule.id).length,sameIdentity:reusableAttachment.id===reusableRule.id,sameRevision:reusableAttachment.version===reusableRule.version,conditionEqual:JSON.stringify(reusableAttachment.conditionGroup)===JSON.stringify(reusableRule.conditionGroup),attachmentTotal:afterReusable.workingDraft.attachedRules.length};
  const wildcardTrigger=()=>q('button[aria-label="Add validation for /products/*/duration"]',inspector);
  let wildcardDetails=wildcardTrigger().closest("details");while(wildcardDetails){wildcardDetails.open=true;wildcardDetails=wildcardDetails.parentElement?.closest("details");}wildcardTrigger().click();
  const wildcardDestination=document.querySelector('input[name="guided-schema-destination"][value="existing"]');if(wildcardDestination){wildcardDestination.click();click(q("#guided-schema-picker"),"Select Product event version 3");click(q("#guided-validation-flow"),"Continue");}change("#guided-requirement","Must be present");q("#guided-apply-condition").click();
  const wildcardOptions=Array.from(q("#guided-condition-property-0").options).map(({value})=>value).filter(Boolean);
  change("#guided-condition-property-0","/products/*/price_monthly");change("#guided-condition-operator-0","Exists");
  const wildcardPreview=q("#guided-condition-preview").textContent;click(q("#guided-validation-flow"),"Continue");
  const wildcardReview=q("#guided-validation-review").textContent;click(q("#guided-validation-flow"),"Add validation to draft");
  const wildcardStored=(await globalThis.__waitForDurableSchemaObservation((schemas)=>schemas.some(({id,workingDraft})=>id==="schema:product"&&workingDraft?.attachedRules?.some(({propertyPath})=>propertyPath==="/products/*/duration")),"wildcard guided conditional rule")).find(({id})=>id==="schema:product");const wildcardRule=wildcardStored.workingDraft.attachedRules.find(({propertyPath})=>propertyPath==="/products/*/duration");
  const wildcardActive={...wildcardStored,document:wildcardStored.workingDraft.document,assignments:wildcardStored.workingDraft.assignments,attachedRules:wildcardStored.workingDraft.attachedRules,workingDraft:undefined};
  const wildcardValidation=core.validateEvent({sourceId:"history",eventName:"product_detail",payload:{page_type:"product_detail",products:[{price_monthly:29},{},{duration:12},{price_monthly:49,duration:12}],oOrder:{aProducts:[]}},rawInput:[]},[wildcardActive]);
  const wildcardReloaded=core.restoreSchemaLibrary(core.serializeSchemaLibrary([wildcardStored]))[0];
  const wildcard={options:wildcardOptions.filter((path)=>path==="/products/*/price_monthly"),concreteOptions:wildcardOptions.filter((path)=>path.startsWith("/products/")&&Number.isInteger(Number(path.split("/")[2]))),preview:wildcardPreview,review:wildcardReview,predicate:wildcardRule.conditionGroup.predicates[0].propertyPath,consequence:wildcardRule.propertyPath,evaluations:wildcardValidation.evaluations.filter(({rule})=>rule===wildcardRule.name).map(({propertyPath,status})=>[propertyPath,status]),issues:wildcardValidation.issues.filter(({rule})=>rule?.startsWith(wildcardRule.name)).map(({instancePath})=>instancePath),reloaded:wildcardReloaded.workingDraft.attachedRules.some(({propertyPath,conditionGroup})=>propertyPath==="/products/*/duration"&&conditionGroup?.predicates[0]?.propertyPath==="/products/*/price_monthly")};
  trigger().click();targetIndex();enablePageType();const cancelBefore=[localStorage.getItem(schemaKey),localStorage.getItem(ruleKey)];click(q("#guided-validation-flow"),"Cancel");await new Promise((resolve)=>requestAnimationFrame(resolve));const cancelled={storageUnchanged:cancelBefore[0]===localStorage.getItem(schemaKey)&&cancelBefore[1]===localStorage.getItem(ruleKey),focus:document.activeElement?.getAttribute("aria-label"),inspectorVisible:!inspector.hidden,scroll:inspector.scrollTop};
  q("#data-layer-view-schemas").click();const row=Array.from(q("#schema-list").children).find(({textContent})=>textContent.includes("Product event"));click(row,"Edit working draft");q("#save-schema").click();q("#confirm-schema-revision").click();
  const published=(await globalThis.__waitForDurableSchemaObservation((schemas)=>schemas.some(({id,version,workingDraft})=>id==="schema:product"&&version===4&&!workingDraft),"guided conditional publication")).find(({id})=>id==="schema:product");const exported=core.serializeSchemaLibraryExport([published],JSON.parse(localStorage.getItem(ruleKey)));const imported=JSON.parse(exported);localStorage.setItem(schemaKey,JSON.stringify(imported.schemas));localStorage.setItem(ruleKey,JSON.stringify(imported.rules));await globalThis.__flushDurableSchemaObservation();const reloaded=core.restoreSchemaLibrary(localStorage.getItem(schemaKey))[0];const importedRule=JSON.parse(localStorage.getItem(ruleKey))[0];const revisedRule={...structuredClone(importedRule),version:2,revisionHistory:[structuredClone(importedRule)]};localStorage.setItem(ruleKey,JSON.stringify([revisedRule]));
  const reusablePinned=reloaded.attachedRules.find(({id})=>id===revisedRule.id);const lifecycle={version:reloaded.version,workingDraftAbsent:reloaded.workingDraft===undefined,attachmentIds:reloaded.attachedRules.map(({id})=>id),typedComparison:reloaded.attachedRules[0].conditionGroup.predicates[0].comparison,libraryIds:JSON.parse(localStorage.getItem(ruleKey)).map(({id})=>id),conditionRetained:reloaded.attachedRules.every(({conditionGroup})=>Boolean(conditionGroup)),pinnedVersion:reusablePinned.version,revisedVersion:revisedRule.version,revisedConditionRetained:JSON.stringify(revisedRule.conditionGroup)===JSON.stringify(reusablePinned.conditionGroup)};
  return {requirement,initial,absent,invalidEmpty,invalidPattern,invalidNoPredicates,preview:{allResult,allFalse,anyResult},confirmation,review,local,reusable,wildcard,cancelled,lifecycle};
})()`;

const schemaPropertyCopyRuntime = `(async () => {
  const pause=()=>new Promise((resolve)=>setTimeout(resolve,0));const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};const click=(root,label)=>{const value=Array.from(root.querySelectorAll("button")).find((button)=>button.textContent===label||button.textContent.startsWith(label));if(!value)throw new Error("Missing action "+label);value.click();return value;};
  const canonicalValue=(value)=>Array.isArray(value)?value.map(canonicalValue):value&&typeof value==="object"?Object.fromEntries(Object.keys(value).sort().map((key)=>[key,canonicalValue(value[key])])):value;const same=(left,right)=>JSON.stringify(canonicalValue(left))===JSON.stringify(canonicalValue(right));
  const runtimeErrors=[];addEventListener("error",(event)=>runtimeErrors.push(String(event.error??event.message)));addEventListener("unhandledrejection",(event)=>runtimeErrors.push(String(event.reason)));const schemaCore=await import("/data-layer-schema-verification.js");
  q("#data-layer-view-schemas").click();const schemaItem=(name)=>Array.from(q("#schema-list").children).find((item)=>item.textContent.includes(name));const open=(name)=>{const item=schemaItem(name);if(!item)throw new Error("Missing schema "+name);click(item,"Edit working draft");};open("Generic pageview");
  const editor=q("#schema-editor");const tree=q("#schema-property-tree");const row=()=>q('[data-schema-property-canonical-path="/error_message"]',tree);const action=()=>Array.from(row().querySelectorAll("button")).find((button)=>button.textContent==="Copy to another schema");if(!action())throw new Error("Missing property copy action");editor.style.height="560px";editor.style.overflow="auto";tree.style.height="300px";tree.style.overflow="auto";editor.scrollTop=51;tree.scrollTop=37;action().focus({preventScroll:true});action().click();await pause();
  const dialog=q("#schema-property-copy-dialog");const destination=q("#schema-property-copy-destination",dialog),beforeStored=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")),beforeLibrary=schemaCore.restoreSchemaLibrary(JSON.stringify(beforeStored)),beforeDestination=beforeLibrary.find(({id})=>id==="schema:in-page"),beforeSource=beforeLibrary.find(({id})=>id==="schema:pageview");destination.value="schema:in-page";destination.dispatchEvent(new Event("change",{bubbles:true}));await pause();const review=q('[aria-label="Schema property copy review"]',dialog);const reviewState={open:dialog.open,text:review.textContent,source:q("p",dialog).textContent,destinations:Array.from(destination.options).map(({textContent})=>textContent),unchanged:same(beforeStored,JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"))),width:dialog.getBoundingClientRect().width,scrollWidth:dialog.scrollWidth};
  click(dialog,"Copy to selected schema");let stored=await globalThis.__waitForDurableSchemaObservation((schemas)=>schemas.some(({id,workingDraft})=>id==="schema:in-page"&&Boolean(workingDraft?.document?.properties?.error_message)),"property copy to destination schema");let copied=stored.find(({id})=>id==="schema:in-page");const sourceAfter=stored.find(({id})=>id==="schema:pageview"),sourceUnchanged=same(sourceAfter,beforeSource);const applied={publishedUnchanged:copied.version===3&&!copied.document.properties.error_message,paths:["error_message","error_action","error_type"].filter((path)=>copied.workingDraft.document.properties[path]),rules:copied.workingDraft.attachedRules.map(({id,copySourceRuleId})=>({id,copySourceRuleId})),documentation:Object.keys(copied.workingDraft.documentation.properties),pending:copied.workingDraft.pendingChanges,sourceUnchanged,assignment:copied.workingDraft.assignments[0].eventName,focus:document.activeElement?.getAttribute("aria-label"),scroll:{editor:editor.scrollTop,tree:tree.scrollTop}};
  q("#schema-property-copy-feedback").textContent;click(document,"Undo property copy");stored=await globalThis.__waitForDurableSchemaObservation((schemas)=>schemas.some(({id,workingDraft})=>id==="schema:in-page"&&!workingDraft),"property copy undo");const undone=stored.find(({id})=>id==="schema:in-page");const undo={equivalent:JSON.stringify(undone)===JSON.stringify(beforeDestination),feedback:q("#schema-property-copy-feedback").textContent};
  action().click();await pause();const dialog2=q("#schema-property-copy-dialog");const destination2=q("#schema-property-copy-destination",dialog2);destination2.value="schema:in-page";destination2.dispatchEvent(new Event("change",{bubbles:true}));click(dialog2,"Copy to selected schema");stored=await globalThis.__waitForDurableSchemaObservation((schemas)=>schemas.some(({id,workingDraft})=>id==="schema:in-page"&&Boolean(workingDraft?.document?.properties?.error_message)),"persisted property copy");copied=stored.find(({id})=>id==="schema:in-page");
  return{review:reviewState,applied,undo,persisted:{pending:copied.workingDraft.pendingChanges.length,path:copied.workingDraft.document.properties.error_message.type},layout:{body:document.documentElement.scrollWidth,width:innerWidth},runtimeErrors};
})()`;

const schemaPropertyTypeEditingSeedRuntime = `(() => {
  localStorage.clear();
  const document={type:"object",required:["order_id"],properties:{order_id:{type:"number"},price:{type:"number"},tags:{type:"array",items:{type:"string"}},products:{type:"array",items:{type:"object",required:["name"],properties:{name:{type:"string"}}}}}};
  const documentation={properties:{"/order_id":{displayName:"Order",description:"Order identifier",example:{value:42,selectionMethod:"custom"}},"/products/*/name":{displayName:"Name",description:"Product name"}}},rules=[{id:"range",version:1,propertyPath:"/order_id",operator:"numeric-range",parameters:"1,99"},{id:"product-name-required",version:1,propertyPath:"/products/*/name",operator:"required"},{id:"price-required",version:1,propertyPath:"/price",operator:"required",severity:"error"},{id:"order-condition",version:1,propertyPath:"/price",operator:"allowed-values",allowedValues:[10,20],conditionGroup:{operator:"All",predicates:[{propertyPath:"/order_id",operator:"Equals",comparison:{type:"number",value:42}}]}}];
  const parent={id:"base-event",name:"Base event",version:2,published:true,document:{type:"object",properties:{site_id:{type:"string"}}},assignments:[],documentation:{properties:{"/site_id":{displayName:"Site",description:"Site identifier"}}},attachedRules:[]};
  const schema={id:"schema-page-view",name:"Page view",version:3,published:true,parentSchemaId:"base-event",document,assignments:[],documentation,attachedRules:rules,workingDraft:{baseVersion:3,sourceVersion:3,document:structuredClone(document),assignments:[],parentSchemaId:"base-event",documentation:structuredClone(documentation),attachedRules:structuredClone(rules),pendingChanges:[]}};
  localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([schema,parent]));localStorage.setItem("my-chrome-utilities.schema-rule-library.v1",JSON.stringify([{id:"range",name:"Reusable range",kind:"Numeric range",version:7,operator:"numeric-range",parameters:"1,99",attachments:["schema-page-view"]}]));return true;
})()`;

const schemaPropertyTypeEditingRuntime = `(async()=>{
  const pause=(milliseconds=0)=>new Promise((resolve)=>setTimeout(resolve,milliseconds)),waitFor=async(predicate,label)=>{for(let attempt=0;attempt<400;attempt+=1){const value=predicate();if(value)return value;await pause(10);}throw new Error("Timed out waiting for "+label);};const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};const click=(root,label)=>{const button=Array.from(root.querySelectorAll("button")).find(({textContent})=>textContent?.startsWith(label));if(!button)throw new Error("Missing "+label);button.click();return button;};const setSelect=(select,value)=>{select.value=value;select.dispatchEvent(new Event("change",{bubbles:true}));};
  const pageSchemaId="schema-page-view",waitPageSchema=async(predicate,label)=>{const values=await __waitForDurableSchemaObservation((schemas)=>{const candidate=schemas.find(({id})=>id===pageSchemaId);return Boolean(candidate&&predicate(candidate));},label);await waitFor(()=>q("#schema-editor").getAttribute("aria-busy")!=="true",label+" editor settlement");return values.find(({id})=>id===pageSchemaId);};
  q("#data-layer-view-schemas").click();let row=Array.from(q("#schema-list").children).find(({textContent})=>textContent.includes("Page view"));click(row,"Edit working draft");
  const property=(path)=>q('[data-schema-property-canonical-path="'+path+'"]');const storedBefore=localStorage.getItem("my-chrome-utilities.schema-library.v1"),reusableBefore=localStorage.getItem("my-chrome-utilities.schema-rule-library.v1");let products=property("/products");const productsAction=click(products,"Edit type");let productsEditor=q(".schema-property-type-editor",products);setSelect(q('[aria-label="Item type for /products"]',productsEditor),"");click(productsEditor,"Review type change");const descendantImpact={review:q(".schema-property-type-review",productsEditor).textContent,blocked:Array.from(productsEditor.querySelectorAll("button")).find(({textContent})=>textContent==="Confirm type change").disabled,unchanged:storedBefore===localStorage.getItem("my-chrome-utilities.schema-library.v1")};click(productsEditor,"Cancel");descendantImpact.focus=document.activeElement===productsAction;
  let order=property("/order_id");click(order,"Edit type");const editor=q(".schema-property-type-editor",order),value=q('[aria-label="Value type for /order_id"]',editor),treatment=q('[aria-label="Type mismatch treatment for /order_id"]',editor);const controls={valueTypes:Array.from(value.options).map(({textContent})=>textContent),treatments:Array.from(treatment.options).map(({textContent})=>textContent),defaultTreatment:treatment.selectedOptions[0].textContent,itemHidden:q('[aria-label="Item type for /order_id"]',editor).parentElement.hidden};setSelect(value,"string");click(editor,"Review type change");const review=q(".schema-property-type-review",editor).textContent,resolutionControls=Array.from(editor.querySelectorAll("select[data-impact]")),impactChoices={count:resolutionControls.length,options:Object.fromEntries(resolutionControls.map((select)=>[select.dataset.impact,Array.from(select.options,({textContent})=>textContent)])),cancel:Array.from(editor.querySelectorAll("button")).some(({textContent})=>textContent==="Cancel"),blocked:Array.from(editor.querySelectorAll("button")).find(({textContent})=>textContent==="Confirm type change").disabled};const unchangedBeforeConfirm=storedBefore===localStorage.getItem("my-chrome-utilities.schema-library.v1");for(const select of resolutionControls){const replace=select.dataset.impact==="example value"||select.dataset.impact.startsWith("conditional dependency ");setSelect(select,replace?"replace":"remove");if(replace){const input=q('[data-impact-replacement="'+select.dataset.impact+'"]',editor);input.value="ORDER-42";input.dispatchEvent(new Event("input",{bubbles:true}));}}impactChoices.resolved=!Array.from(editor.querySelectorAll("button")).find(({textContent})=>textContent==="Confirm type change").disabled;const restoreTypeFailure=__failNextDurableSchemaWrite("Simulated persistence failure");click(editor,"Confirm type change");const failureMessage=await waitFor(()=>{const status=q("#durable-repository-status").textContent;return q("#durable-storage-recovery").open&&status.includes("Simulated persistence failure")?status:undefined;},"the durable type-edit failure");q("#schema-search").dispatchEvent(new Event("input",{bubbles:true}));const refreshedRow=Array.from(q("#schema-list").children).find(({textContent})=>textContent.includes("Page view"));click(refreshedRow,"Build documentation table");const failedSource=q("#schema-specification-source");failedSource.value="working-draft";failedSource.dispatchEvent(new Event("change",{bubbles:true}));const failedSpec=Array.from(q("#schema-specification-preview").querySelectorAll("tbody tr")).map((tr)=>Array.from(tr.children).map(({textContent})=>textContent)).find(([name])=>name==="order_id");click(q("#schema-specification-builder"),"Close specification");const persistenceFailure={message:failureMessage,storedUnchanged:storedBefore===localStorage.getItem("my-chrome-utilities.schema-library.v1"),inMemoryType:failedSpec[3],resolutions:resolutionControls.map(({value})=>value)};q("#retry-durable-save").click();const retryResult=await waitFor(()=>{const text=q("#durable-recovery-result").textContent;return text.includes("committed to the Saved Schema Library")||text.includes("Retry was not committed")?text:undefined;},"the durable type-edit retry result");if(retryResult.includes("Retry was not committed"))throw new Error(retryResult);restoreTypeFailure();let stored=await waitPageSchema((schema)=>schema.workingDraft?.document?.properties?.order_id?.type==="string","the retried type edit");q("#close-storage-recovery").click();
  const orderSaved={published:stored.document.properties.order_id.type,draft:stored.workingDraft.document.properties.order_id.type,required:stored.workingDraft.document.required,description:stored.workingDraft.documentation.properties["/order_id"].description,example:stored.workingDraft.documentation.properties["/order_id"].example.value,condition:stored.workingDraft.attachedRules.find(({id})=>id==="order-condition").conditionGroup.predicates[0].comparison};
  let tags=property("/tags");click(tags,"Edit type");let tagsEditor=q(".schema-property-type-editor",tags),tagsValue=q('[aria-label="Value type for /tags"]',tagsEditor),tagsItem=q('[aria-label="Item type for /tags"]',tagsEditor);const arrayControls={itemTypes:Array.from(tagsItem.options).map(({textContent})=>textContent),initial:tagsItem.selectedOptions[0].textContent};setSelect(tagsValue,"array");setSelect(tagsItem,"");click(tagsEditor,"Review type change");click(tagsEditor,"Confirm type change");await waitPageSchema((schema)=>schema.workingDraft?.document?.properties?.tags?.type==="array"&&!schema.workingDraft.document.properties.tags.items,"the tags item-type removal");
  let price=property("/price");click(price,"Edit type");let priceEditor=q(".schema-property-type-editor",price),priceTreatment=q('[aria-label="Type mismatch treatment for /price"]',priceEditor);setSelect(priceTreatment,"warning");click(priceEditor,"Review type change");click(priceEditor,"Confirm type change");stored=await waitPageSchema((schema)=>schema.workingDraft?.document?.properties?.price?.typeMismatchTreatment==="warning","the warning type-mismatch treatment");const effective={...stored,...stored.workingDraft};delete effective.workingDraft;const verification=await import("/data-layer-schema-verification.js");const event={sourceId:"history",eventName:"page",payload:{order_id:"A",price:"19.95",tags:["x",2],products:[]}};const warning=verification.validateWithSchema(event,effective,[effective]).issues.filter(({message})=>message==="Type mismatch").map(({instancePath,severity})=>[instancePath,severity]);
  price=property("/price");click(price,"Edit type");priceEditor=q(".schema-property-type-editor",price);setSelect(q('[aria-label="Type mismatch treatment for /price"]',priceEditor),"ignore");click(priceEditor,"Review type change");click(priceEditor,"Confirm type change");stored=await waitPageSchema((schema)=>schema.workingDraft?.document?.properties?.price?.typeMismatchTreatment==="ignore","the ignored type-mismatch treatment");const ignoredSchema={...stored,...stored.workingDraft};delete ignoredSchema.workingDraft;const ignored=verification.validateWithSchema(event,ignoredSchema,[ignoredSchema]).issues.some(({instancePath,message})=>instancePath==="/price"&&message==="Type mismatch"),draftSummary={tagsItems:stored.workingDraft.document.properties.tags.items??null,persistedTreatment:stored.workingDraft.document.properties.price.typeMismatchTreatment,remainingRules:stored.workingDraft.attachedRules.map(({id})=>id),reusableUnchanged:reusableBefore===localStorage.getItem("my-chrome-utilities.schema-rule-library.v1")};q("#save-schema").click();q("#confirm-schema-revision").click();stored=await waitPageSchema((schema)=>schema.version===4&&!schema.workingDraft&&schema.document?.properties?.price?.typeMismatchTreatment==="ignore","the type-edit publication");const historical=stored.revisionHistory.find(({version})=>version===3),publication={version:stored.version,draftAbsent:!stored.workingDraft,current:{order:stored.document.properties.order_id.type,tags:stored.document.properties.tags,priceTreatment:stored.document.properties.price.typeMismatchTreatment},historical:{order:historical.document.properties.order_id.type,tags:historical.document.properties.tags,priceTreatment:historical.document.properties.price.typeMismatchTreatment??"error"}};
  return{controls,arrayControls,review,impactChoices,descendantImpact,persistenceFailure,unchangedBeforeConfirm,orderSaved,tagsItems:draftSummary.tagsItems,warning,ignored,persistedTreatment:draftSummary.persistedTreatment,remainingRules:draftSummary.remainingRules,reusableUnchanged:draftSummary.reusableUnchanged,publication,runtimeErrors:globalThis.__sidePanelRuntimeErrors??[]};
})()`;

const schemaPropertyTypeEditingItemRuntime = `(async()=>{
  const pause=(milliseconds=0)=>new Promise((resolve)=>setTimeout(resolve,milliseconds)),waitFor=async(predicate,label)=>{for(let attempt=0;attempt<400;attempt+=1){const value=predicate();if(value)return value;await pause(10);}throw new Error("Timed out waiting for "+label);};const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};const click=(root,label)=>{const button=Array.from(root.querySelectorAll("button")).find(({textContent})=>textContent?.startsWith(label));if(!button)throw new Error("Missing "+label);button.click();return button;};const setSelect=(select,value)=>{select.value=value;select.dispatchEvent(new Event("change",{bubbles:true}));};const key="my-chrome-utilities.schema-library.v1",pageSchemaId="schema-page-view";
  q("#data-layer-view-schemas").click();let row=Array.from(q("#schema-list").children).find(({textContent})=>textContent.includes("Page view"));click(row,"Edit working draft");const property=(path)=>q('[data-schema-property-canonical-path="'+path+'"]');
  const beforeOwner=localStorage.getItem(key),site=property("/site_id"),ownerAction=click(site,"Type owned by");const inherited={label:ownerAction.textContent,owner:q("#schema-editor-name").value,unchanged:beforeOwner===localStorage.getItem(key)};q("#data-layer-view-schemas").click();row=Array.from(q("#schema-list").children).find(({textContent})=>textContent.includes("Page view"));click(row,"Edit working draft");
  const saveTagsTreatment=async(value)=>{const tags=property("/tags");click(tags,"Edit type");const editor=q(".schema-property-type-editor",tags);setSelect(q('[aria-label="Type mismatch treatment for /tags"]',editor),value);click(editor,"Review type change");click(editor,"Confirm type change");const stored=await __waitForDurableSchemaObservation((schemas)=>{const current=schemas.find(({id})=>id===pageSchemaId),savedTags=current?.workingDraft?.document?.properties?.tags;return savedTags?.typeMismatchTreatment===value&&savedTags.items?.typeMismatchTreatment===value;},"the "+value+" tags type-mismatch treatment");await waitFor(()=>q("#schema-editor").getAttribute("aria-busy")!=="true","the "+value+" tags type-mismatch presentation");return stored;};const verification=await import("/data-layer-schema-verification.js"),surface=(stored)=>{const current=stored.find(({id})=>id===pageSchemaId),effective={...current,...current.workingDraft};delete effective.workingDraft;return{effective,all:[effective,...stored.filter(({id})=>id!==pageSchemaId)]};};
  let stored=await saveTagsTreatment("warning"),current=surface(stored);const itemEvent={sourceId:"history",eventName:"page",payload:{order_id:1,price:1,tags:["ok",2],products:[]}},nonArrayEvent={...itemEvent,payload:{...itemEvent.payload,tags:"bad"}},missingPrice={...itemEvent,payload:{order_id:1,tags:["ok"],products:[]}};const warningItems=verification.validateWithSchema(itemEvent,current.effective,current.all).issues.filter(({message})=>message==="Type mismatch").map(({instancePath,severity})=>[instancePath,severity]),warningArray=verification.validateWithSchema(nonArrayEvent,current.effective,current.all).issues.filter(({message})=>message==="Type mismatch").map(({instancePath,severity})=>[instancePath,severity]),unrelated=verification.validateWithSchema(missingPrice,current.effective,current.all).issues.filter(({instancePath,message})=>instancePath==="/price"&&message==="Required value").map(({instancePath,severity})=>[instancePath,severity]);
  stored=await saveTagsTreatment("ignore");current=surface(stored);const ignoredItems=verification.validateWithSchema(itemEvent,current.effective,current.all).issues.some(({instancePath,message})=>instancePath.startsWith("/tags")&&message==="Type mismatch"),ignoredArray=verification.validateWithSchema(nonArrayEvent,current.effective,current.all).issues.some(({instancePath,message})=>instancePath.startsWith("/tags")&&message==="Type mismatch");return{inherited,warningItems,warningArray,unrelated,ignoredItems,ignoredArray,runtimeErrors:globalThis.__sidePanelRuntimeErrors??[]};
})()`;

const allowedValuesRuleMigrationCoverageRuntime = `(async()=>{
  const verification=await import("/data-layer-schema-verification.js"),picker=await import("/data-layer-schema-property-rule-picker.js"),guided=await import("/data-layer-guided-rule-parameter-integrity.js"),builderModule=await import("/data-layer-schema-specification-builder.js");
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;},click=(root,label)=>{const button=Array.from(root.querySelectorAll("button")).find(({textContent})=>textContent===label);if(!button)throw new Error("Missing "+label);button.click();};
  const current=verification.restoreSchemaLibrary(localStorage.getItem("my-chrome-utilities.schema-library.v1"))[0],validationSchema={...current,workingDraft:undefined,revisionHistory:undefined};
  const valid=verification.validateWithSchema({sourceId:"history",eventName:"pageview",payload:{error_type:"technical",quantity:1,enabled:true,market:"retail"},rawInput:[]},validationSchema,[validationSchema]),invalid=verification.validateWithSchema({sourceId:"history",eventName:"pageview",payload:{error_type:"unknown",quantity:1,enabled:true,market:"retail"},rawInput:[]},validationSchema,[validationSchema]);
  const configuration=picker.createRuleConfiguration("Allowed values","number");configuration.allowedValues=["1","2"];const pickerRule=picker.configuredRuleDetails(configuration);const guidedRule=guided.guidedAttachedRule({path:"/enabled",expectedType:"Boolean",requirement:"Must be one of these values",values:["true","false"]},"Enabled values");
  const parentRaw={id:"schema-parent",name:"Parent",version:1,published:true,document:{type:"object",properties:{channel:{type:"string"}}},assignments:[],attachedRules:[{id:"rule:parent",version:1,propertyPath:"/channel",operator:"allowed-values",parameters:"parent,child"}]},childRaw={id:"schema-child",name:"Child",version:1,published:true,parentSchemaId:"schema-parent",document:{type:"object",properties:{}},assignments:[]};const inherited=verification.restoreSchemaLibrary(JSON.stringify([parentRaw,childRaw])),parent=inherited.find(({id})=>id==="schema-parent"),child=inherited.find(({id})=>id==="schema-child"),inheritedInvalid=verification.validateWithSchema({sourceId:"history",eventName:"event",payload:{channel:"other"},rawInput:[]},child,inherited);
  const unsafeRaw={id:"schema-unsafe",name:"Unsafe",version:1,published:true,document:{type:"object",properties:{quantity:{type:"number"},error_type:{type:"string"}}},assignments:[],attachedRules:[{id:"rule:unsafe",version:1,propertyPath:"/quantity",operator:"allowed-values",parameters:"1,not-a-number,2"},{id:"rule:canonical",version:1,propertyPath:"/error_type",operator:"allowed-values",parameters:"stale",allowedValues:["kept"]}]},unsafe=verification.restoreSchemaLibrary(JSON.stringify([unsafeRaw]))[0];
  const wildcardDocument={type:"object",properties:{products:{type:"array",items:{type:"object",properties:{code:{type:"string"},tier:{type:"string"}}}}}},wildcardCondition={operator:"All",predicates:[{propertyPath:"/products/*/tier",operator:"Equals",comparison:{type:"string",value:"vip"}}]},wildcardParentRaw={id:"schema-wildcard-parent",name:"Wildcard parent",version:3,published:true,document:wildcardDocument,assignments:[],documentation:{properties:{"/products/*/code":{example:{value:"red",selectionMethod:"custom"}}}},attachedRules:[{id:"rule:wildcard",name:"Codes",version:2,operator:"allowed-values",parameters:"/products/*/code:red,blue,red",severity:"warning",message:"Known code",enabled:true,examples:"red, blue",attachments:["schema-wildcard-parent"]},{id:"rule:duplicate",version:1,propertyPath:"/products/*/code",operator:"allowed-values",parameters:"red,blue"},{id:"rule:disabled",version:1,propertyPath:"/products/*/code",operator:"allowed-values",parameters:"green",enabled:false},{id:"rule:conditional",version:1,propertyPath:"/products/*/code",operator:"allowed-values",parameters:"gold,gold",conditionGroup:wildcardCondition}]},wildcardChildRaw={id:"schema-wildcard-child",name:"Wildcard child",version:1,published:true,parentSchemaId:"schema-wildcard-parent",document:{type:"object",properties:{}},assignments:[]},wildcardOverrideRaw={...wildcardChildRaw,id:"schema-wildcard-override",name:"Wildcard override",inheritedRuleOverrides:{"/products/*/code":"disabled"}},wildcardLibrary=verification.restoreSchemaLibrary(JSON.stringify([wildcardParentRaw,wildcardChildRaw,wildcardOverrideRaw])),wildcardParent=wildcardLibrary[0],wildcardChild=wildcardLibrary[1],wildcardOverride=wildcardLibrary[2],wildcardRow=builderModule.deriveSpecificationRows(wildcardChild,["/products/*/code"],[wildcardChild,wildcardParent])[0],wildcardCopies=builderModule.renderSpecificationClipboard([wildcardRow]),wildcardExamples=builderModule.specificationExampleChoices(wildcardRow,{source:"documentation",value:"red"}),wildcardEvent={sourceId:"history",eventName:"event",payload:{products:[{code:"unknown",tier:"standard"}]},rawInput:[]},wildcardInherited=verification.validateWithSchema(wildcardEvent,wildcardChild,[wildcardChild,wildcardParent]),wildcardOverridden=verification.validateWithSchema(wildcardEvent,wildcardOverride,[wildcardOverride,wildcardParent]);
  const copied=[];globalThis.ClipboardItem=class{constructor(data){this.data=data;this.types=Object.keys(data);}};Object.defineProperty(navigator,"clipboard",{configurable:true,value:{write:async(items)=>copied.push({kind:"rich",item:items[0]}),writeText:async(text)=>copied.push({kind:"plain",text})}});const builder=q("#schema-specification-builder");q('input[value="spreadsheet"]',builder).click();click(builder,"Copy specification table");await new Promise((resolve)=>setTimeout(resolve,0));const plain=copied.find(({kind})=>kind==="plain").text;
  click(q("#schema-specification-builder"),"Close specification");q("#data-layer-view-schemas").click();const schemaRow=Array.from(q("#schema-list").children).find(({textContent})=>textContent.includes("Generic pageview"));click(schemaRow,"Edit working draft");const quantityRow=q('[data-schema-property-canonical-path="/quantity"]');click(quantityRow,"Add rule");let pickerSearch=q("#schema-property-rule-search");pickerSearch.value="2";pickerSearch.dispatchEvent(new Event("input",{bubbles:true}));pickerSearch=q("#schema-property-rule-search");const pickerLibrary=q('[aria-label="Attach from Rule Library"]'),propertyPicker={count:pickerLibrary.querySelectorAll("article").length,text:pickerLibrary.textContent};click(q("#schema-property-rule-picker"),"Cancel");
  q("#data-layer-view-schemas").click();q("#schema-subview-rules").click();click(q("#schema-rule-library"),"Create rule");q("#schema-rule-name").value="Authored colors";q("#schema-rule-kind").value="Allowed values";q("#schema-rule-operator").value="allowed-values";q("#schema-rule-parameters").value="red,blue";click(q("#schema-rule-editor"),"Save rule");const authored=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1")).find(({name})=>name==="Authored colors"),ruleSearch=q("#schema-rule-search"),ruleList=q("#schema-rule-list");ruleSearch.value="blue";ruleSearch.dispatchEvent(new Event("input",{bubbles:true}));const authoredSearch={count:ruleList.children.length,text:ruleList.textContent};ruleSearch.value="2";ruleSearch.dispatchEvent(new Event("input",{bubbles:true}));const migratedSearch={count:ruleList.children.length,text:ruleList.textContent};ruleSearch.value="";ruleSearch.dispatchEvent(new Event("input",{bubbles:true}));
  const archive=JSON.parse(verification.serializeSchemaLibraryExport([current],[authored])),imported=verification.restoreSchemaLibrary(JSON.stringify(archive.schemas))[0];
  return{validation:{valid:valid.issues.length,invalid:invalid.issues.map(({expected})=>expected)},authoring:{picker:pickerRule,guided:guidedRule,authored},propertyPicker,ruleLibrary:{authoredSearch,migratedSearch},inheritance:{values:parent.attachedRules[0].allowedValues,invalid:inheritedInvalid.issues.map(({expected})=>expected)},semantics:{rules:wildcardParent.attachedRules.map(({id,propertyPath,allowedValues,enabled})=>({id,propertyPath,allowedValues,enabled})),metadata:{condition:wildcardParent.attachedRules[3].conditionGroup,examples:wildcardParent.attachedRules[0].examples,attachments:wildcardParent.attachedRules[0].attachments,message:wildcardParent.attachedRules[0].message,severity:wildcardParent.attachedRules[0].severity},override:wildcardOverride.inheritedRuleOverrides,row:{values:wildcardRow.allowedValues,groups:wildcardRow.allowedValueGroups,choices:wildcardRow.allowedValueChoices,example:wildcardRow.example},examples:wildcardExamples.filter(({available})=>available).map(({id})=>id),copies:wildcardCopies,inheritedIssues:wildcardInherited.issues.map(({instancePath,templatePath})=>({instancePath,templatePath})),overriddenIssues:wildcardOverridden.issues.length},invalidMigration:{unsafe:unsafe.attachedRules[0],canonical:unsafe.attachedRules[1]},copyImport:{plain,imported:imported.attachedRules[0]}};
})()`;

const liveSchemaPropertyDeclarationSeedRuntime = `(() => {
  localStorage.clear();
  const assignment={id:"product-view",schemaId:"product-detail",sourceId:"history",eventName:"product_view",target:"payload",versionPolicy:"follow latest",enabled:true};
  const document={type:"object",additionalProperties:false,properties:{products:{type:"array",minItems:1,items:{type:"object",properties:{metadata:{type:"object"}}}}}};
  const schema={id:"product-detail",name:"Product detail",version:3,published:true,document:{type:"object",properties:{}},assignments:[assignment],attachedRules:[{id:"page-type",version:1,propertyPath:"/page_type",operator:"required"}],workingDraft:{baseVersion:3,sourceVersion:3,document,assignments:[assignment],attachedRules:[{id:"page-type",version:1,propertyPath:"/page_type",operator:"required"}],pendingChanges:[]}};
  localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([schema]));
  localStorage.setItem("my-chrome-utilities.guided-validation-continuations.v1",JSON.stringify({["history\\u0000product_view"]:"product-detail"}));
  const payload={page_type:"product_detail",commerce:{currency:"EUR"},products:[{product_name:"Phone",product_id:42}]};
  const event={type:"observed",url:"https://shop.example/product",timestamp:"2026-07-15T18:00:00Z",observerPath:"dataLayer",id:"event:product-view",name:"product_view",sessionId:"session:declaration",sourceId:"history",sourceName:"Event history",sourceKind:"Data layer",pageUrl:"https://shop.example/product",payload,rawInput:["product_view",payload],rawValue:["product_view",payload],validation:"Not checked"};
  localStorage.setItem("dataLayerTestingSession",JSON.stringify({session:{id:"session:declaration",status:"active",freshBoundary:true,tabId:42,historyPath:"dataLayer",startUrl:event.pageUrl,currentUrl:event.pageUrl,timeline:[event]}}));return true;
})()`;

const liveSchemaPropertyDeclarationRuntime = `(async () => {
  const pause=()=>new Promise((resolve)=>setTimeout(resolve,0));const frame=()=>new Promise((resolve)=>requestAnimationFrame(resolve));const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const click=(root,label)=>{const button=Array.from(root.querySelectorAll("button")).find(({textContent})=>textContent===label||textContent.startsWith(label));if(!button)throw new Error("Missing "+label);button.click();return button;};
  const inspector=()=>q("#live-event-inspector");const reveal=()=>inspector().querySelectorAll("details").forEach((details)=>{details.open=true;});
  const action=(kind,path)=>{reveal();const button=Array.from(inspector().querySelectorAll('button[data-action="'+kind+'"]')).find(({dataset})=>dataset.propertyPath===path);if(!button)throw new Error("Missing "+kind+" for "+path);return button;};
  const schema=()=>JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"))[0];
  q("#data-layer-view-live").click();q("#live-event-feed button").click();reveal();
  const productNamePath="/products/0/product_name",productIdPath="/products/0/product_id";
  const productName=action("add-property-to-schema",productNamePath);const validation=action("add-property-validation",productNamePath);
  const actions={addToSchema:Boolean(productName),addValidation:Boolean(validation),destination:productName.ariaLabel,reachable:productName.getClientRects().length>0&&validation.getClientRects().length>0};
  const reviewCases={};
  for(const [name,path] of [["productName",productNamePath],["productId",productIdPath]]){
    const before=localStorage.getItem("my-chrome-utilities.schema-library.v1");action("add-property-to-schema",path).click();await pause();
    const dialog=q(".live-schema-property-declaration-review");reviewCases[name]={text:dialog.textContent,noValidationControls:!["requirement","scope","assignment","severity","message","Rule Library"].some((term)=>dialog.textContent.includes(term)),storageUnchanged:before===localStorage.getItem("my-chrome-utilities.schema-library.v1"),guidedHidden:q("#guided-validation-flow").hidden};
    click(dialog,"Cancel");await pause();
  }
  action("add-property-to-schema",productNamePath).click();await pause();click(q(".live-schema-property-declaration-review"),"Add property to");
  const afterName=(await globalThis.__waitForDurableSchemaObservation(([candidate])=>Boolean(candidate?.workingDraft?.document?.properties?.products?.items?.properties?.product_name),"live product_name declaration"))[0];await frame();const nameItem=afterName.workingDraft.document.properties.products.items;const afterNameBytes={property:JSON.stringify(nameItem.properties.product_name),metadata:JSON.stringify(nameItem.properties.metadata),array:JSON.stringify({minItems:afterName.workingDraft.document.properties.products.minItems}),itemType:nameItem.type,assignments:JSON.stringify(afterName.workingDraft.assignments),rules:JSON.stringify(afterName.workingDraft.attachedRules)};
  const nameFocus={action:document.activeElement?.dataset.action,path:document.activeElement?.dataset.propertyPath,label:document.activeElement?.getAttribute("aria-label")};
  action("add-property-to-schema",productIdPath).click();await pause();click(q(".live-schema-property-declaration-review"),"Add property to");
  const stored=(await globalThis.__waitForDurableSchemaObservation(([candidate])=>Boolean(candidate?.workingDraft?.document?.properties?.products?.items?.properties?.product_id),"live product_id declaration"))[0];await frame();const item=stored.workingDraft.document.properties.products.items;
  const idFocus={action:document.activeElement?.dataset.action,path:document.activeElement?.dataset.propertyPath,label:document.activeElement?.getAttribute("aria-label")};
  const saved={productName:item.properties.product_name,productId:item.properties.product_id,metadata:item.properties.metadata,parents:{arrayType:stored.workingDraft.document.properties.products.type,minItems:stored.workingDraft.document.properties.products.minItems,itemType:item.type},assignments:stored.workingDraft.assignments,rules:stored.workingDraft.attachedRules,version:stored.version,nameFocus,idFocus,siblingPreserved:afterNameBytes.property===JSON.stringify(item.properties.product_name)&&afterNameBytes.metadata===JSON.stringify(item.properties.metadata)&&afterNameBytes.array===JSON.stringify({minItems:stored.workingDraft.document.properties.products.minItems})&&afterNameBytes.itemType===item.type,collectionsPreserved:afterNameBytes.assignments===JSON.stringify(stored.workingDraft.assignments)&&afterNameBytes.rules===JSON.stringify(stored.workingDraft.attachedRules),declarations:Array.from(document.querySelectorAll('button[data-action="add-property-to-schema"]'),({dataset,ariaLabel})=>({path:dataset.propertyPath,label:ariaLabel}))};
  const verification=await import("/data-layer-schema-verification.js");const active={...stored,document:stored.workingDraft.document,assignments:stored.workingDraft.assignments,attachedRules:stored.workingDraft.attachedRules};const validate=(payload)=>verification.validateWithSchema({sourceId:"history",eventName:"product_view",payload,rawInput:["product_view",payload]},active,[active]);const present=validate({page_type:"product_detail",products:[{product_name:"Phone",product_id:42}]});const absent=validate({page_type:"product_detail",products:[{product_id:42}]});
  const relevant=(result)=>({issues:result.issues.filter(({instancePath,message})=>instancePath.includes("product_name")&&(message==="Undeclared property"||message.includes("Required"))),evaluations:(result.evaluations??[]).filter(({propertyPath})=>propertyPath.includes("product_name"))});const validationEvidence={present:relevant(present),absent:relevant(absent)};
  action("add-property-validation",productNamePath).click();await pause();const separate={guidedVisible:!q("#guided-validation-flow").hidden,declarationDialogs:document.querySelectorAll(".live-schema-property-declaration-review").length};click(q("#guided-validation-flow"),"Cancel");await frame();
  q("#data-layer-view-schemas").click();const row=Array.from(q("#schema-list").children).find(({textContent})=>textContent.includes("Product detail"));click(row,"Edit working draft");q("#save-schema").click();q("#confirm-schema-revision").click();const published=(await globalThis.__waitForDurableSchemaObservation(([candidate])=>candidate?.version===4&&!candidate.workingDraft&&Boolean(candidate.document?.properties?.products?.items?.properties?.product_id),"live property declaration publication"))[0];
  return {actions,reviewCases,saved,validation:validationEvidence,separate,published:{version:published.version,workingDraftAbsent:!published.workingDraft,productName:published.document.properties.products.items.properties.product_name,productId:published.document.properties.products.items.properties.product_id,rules:published.attachedRules}};
})()`;

const localRulePromotionSeedRuntime = `(() => {
  localStorage.clear();
  const assignment={id:"assignment:page-view",sourceId:"history",eventName:"page_view",target:"payload",versionPolicy:"follow latest",enabled:true};
  const document={type:"object",properties:{page_type:{type:"string"},site:{type:"string"}}};
  const conditionGroup={operator:"All",predicates:[{propertyPath:"/site",operator:"Equals",comparison:{type:"string",value:"consumer"},detectedType:"string"}]};
  const local40={id:"local-40",name:"Known page types",version:1,propertyPath:"/page_type",operator:"exact-value",parameters:"product"};
  const local41={id:"local-41",name:"Known page types",version:1,propertyPath:"/page_type",operator:"allowed-values",allowedValues:["product","content"],applicableType:"string",severity:"warning",message:"Use a known page type",conditionGroup,enabled:true};
  const local42={id:"local-42",name:"Other page types",version:1,propertyPath:"/page_type",operator:"regular-expression",parameters:"^product"};
  const published={...local41,allowedValues:["product"]};
  const schema={id:"schema:page-view",name:"Page view",version:3,published:true,document,assignments:[assignment],attachedRules:[published],revisionHistory:[],workingDraft:{baseVersion:3,sourceVersion:3,document,assignments:[assignment],attachedRules:[local40,local41,local42],pendingChanges:["Document page ownership"]}};
  const other={id:"schema:other",name:"Other",version:1,published:true,document:{type:"object",properties:{other:{type:"string"}}},assignments:[],attachedRules:[],revisionHistory:[]};
  localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([schema,other]));
  localStorage.setItem("my-chrome-utilities.schema-rule-library.v1","[]");
  return true;
})()`;

const localRulePromotionAvailabilitySeedRuntime = `(() => {
  localStorage.clear();
  const assignment={id:"assignment:page-view",sourceId:"history",eventName:"page_view",target:"payload",versionPolicy:"follow latest",enabled:true};
  const document={type:"object",properties:{"/page_type":{type:"string"},"/page_name":{type:"string"}}};
  const local41={id:"local-41",name:"Known page types",version:1,propertyPath:"/page_type",operator:"allowed-values",allowedValues:["product","content"],applicableType:"string",severity:"warning",message:"Use a known page type",enabled:true};
  const local42={id:"local-42",name:"Required page name",version:1,propertyPath:"/page_name",operator:"required",enabled:true};
  const schema={id:"schema:page-view",name:"Page view",version:3,published:true,document,assignments:[assignment],attachedRules:[local41,local42],revisionHistory:[]};
  localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([schema]));
  localStorage.setItem("my-chrome-utilities.schema-rule-library.v1","[]");
  return true;
})()`;

const localRulePromotionAvailabilityRuntime = `(async () => {
  const pause=(milliseconds=0)=>new Promise((resolve)=>setTimeout(resolve,milliseconds)),waitFor=async(predicate,label)=>{for(let attempt=0;attempt<400;attempt+=1){const value=predicate();if(value)return value;await pause(10);}throw new Error("Timed out waiting for "+label);};
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const click=(root,label)=>{const value=Array.from(root.querySelectorAll("button")).find(({textContent})=>textContent===label||textContent.startsWith(label));if(!value)throw new Error("Missing action "+label);value.click();return value;};
  const set=(selector,value,event="input")=>{const input=q(selector);input.value=value;input.dispatchEvent(new Event(event,{bubbles:true}));return input;};
  const schemaKey="my-chrome-utilities.schema-library.v1",ruleKey="my-chrome-utilities.schema-rule-library.v1",randomUUIDDescriptor=Object.getOwnPropertyDescriptor(Crypto.prototype,"randomUUID");
  const stored=()=>JSON.parse(localStorage.getItem(schemaKey)); const page=()=>stored().find(({id})=>id==="schema:page-view");
  const openPage=()=>{q("#data-layer-view-schemas").click();const row=Array.from(q("#schema-list").children).find(({textContent})=>textContent.includes("Page view"));click(row,"Edit working draft");};
  const property=(canonical)=>q('[data-schema-property-canonical-path="'+canonical+'"]');
  const promotion=(id,canonical="/page_type")=>{const host=property(canonical);q("details[data-attached-rules]",host).open=true;return q('.schema-attached-rule[data-rule-id="'+id+'"] .local-rule-promotion-action',host);};
  const {serializeSchemaLibrary}=await import("/data-layer-schema-verification.js");const initialSchemaBytes=serializeSchemaLibrary([page()]); const initialStorage=[localStorage.getItem(schemaKey),localStorage.getItem(ruleKey)];
  openPage(); const initialAction=promotion("local-41");
  const initial={controlCount:initialAction.parentElement.querySelectorAll(".local-rule-promotion-action:enabled").length,noWorkingDraft:page().workingDraft===undefined,canonicalRows:document.querySelectorAll('[data-schema-property-canonical-path="/page_type"]').length,identity:initialAction.dataset.ruleId,path:initialAction.dataset.propertyPath};
  initialAction.click(); const firstReview=q("#local-rule-promotion-summary").textContent; click(q("#local-rule-promotion-review"),"Cancel");
  const cancelled={storageUnchanged:initialStorage[0]===localStorage.getItem(schemaKey)&&initialStorage[1]===localStorage.getItem(ruleKey),noWorkingDraft:page().workingDraft===undefined};
  q("#close-schema-editor").click();openPage();cancelled.reopenedCount=promotion("local-41").parentElement.querySelectorAll(".local-rule-promotion-action:enabled").length;
  const failureBefore=[localStorage.getItem(schemaKey),localStorage.getItem(ruleKey)];promotion("local-41").click();set("#local-rule-promotion-name","Approved page types");const restorePromotionFailure=__failNextDurableSchemaWrite("simulated availability failure");click(q("#local-rule-promotion-review"),"Confirm promotion");await waitFor(()=>q("#durable-storage-recovery").open&&q("#durable-repository-status").textContent.includes("simulated availability failure"),"the durable promotion availability recovery");restorePromotionFailure();const pendingRuleCount=JSON.parse(localStorage.getItem(ruleKey)).length;q("#reject-durable-save").click();const rejectedResult=await waitFor(()=>q("#durable-recovery-result").textContent.includes("Rejected ")?q("#durable-recovery-result").textContent:undefined,"the rejected promotion result");await waitFor(()=>q("#local-rule-promotion-assistance").textContent.includes("simulated availability failure"),"the rejected promotion assistance");const retainedControl=await waitFor(()=>{const action=document.querySelector('[data-schema-property-canonical-path="/page_type"] .schema-attached-rule[data-rule-id="local-41"] .local-rule-promotion-action');return action&&!action.disabled?action:undefined;},"the restored local-rule promotion action after rejection");const failure={storageUnchanged:failureBefore[0]===localStorage.getItem(schemaKey)&&failureBefore[1]===localStorage.getItem(ruleKey),assistance:q("#local-rule-promotion-assistance").textContent,controlRetained:Boolean(retainedControl),noDraft:page().workingDraft===undefined,pendingRuleCount,rejectedResult};q("#close-storage-recovery").click();click(q("#local-rule-promotion-review"),"Cancel");
  Object.defineProperty(Crypto.prototype,"randomUUID",{value:()=>"51",configurable:true});promotion("local-41").click();set("#local-rule-promotion-name","Approved page types");const restoreRetryFailure=__failNextDurableSchemaWrite("simulated promotion retry");click(q("#local-rule-promotion-review"),"Confirm promotion");if(randomUUIDDescriptor)Object.defineProperty(Crypto.prototype,"randomUUID",randomUUIDDescriptor);await waitFor(()=>q("#durable-storage-recovery").open&&q("#durable-repository-status").textContent.includes("simulated promotion retry"),"the retryable promotion failure");restoreRetryFailure();const retryPending={dialogOpen:q("#local-rule-promotion-review").open,pendingRuleCount:JSON.parse(localStorage.getItem(ruleKey)).length};q("#retry-durable-save").click();const retryResult=await waitFor(()=>q("#durable-recovery-result").textContent.includes("committed to the Saved Schema Library")?q("#durable-recovery-result").textContent:undefined,"the retried promotion result");await __waitForDurableSchemaObservation((schemas)=>schemas.some(({id,workingDraft})=>id==="schema:page-view"&&workingDraft?.attachedRules?.some(({id:ruleId})=>ruleId==="reusable-51")),"the retried promoted reusable rule attachment");await waitFor(()=>!q("#local-rule-promotion-review").open,"the retried promotion presentation");const retry={...retryPending,result:retryResult,dialogClosed:!q("#local-rule-promotion-review").open};q("#close-storage-recovery").click();
  const after=page();const library=JSON.parse(localStorage.getItem(ruleKey));const promoted={review:firstReview,workingDraft:Boolean(after.workingDraft),draftIds:after.workingDraft.attachedRules.map(({id})=>id),libraryIds:library.map(({id})=>id),sameIdentity:after.workingDraft.attachedRules[0].id===library[0].id,publishedUnchanged:serializeSchemaLibrary([{...after,workingDraft:undefined}])===initialSchemaBytes,canonicalRows:document.querySelectorAll('[data-schema-property-canonical-path="/page_type"]').length,reusableControl:Boolean(document.querySelector('.schema-attached-rule[data-rule-id="reusable-51"] .local-rule-promotion-action')),retry:{...retry,settledRuleCount:library.length}};
  await waitFor(()=>q("#schema-editor").getAttribute("aria-busy")!=="true"&&!q("#save-schema").disabled,"the promoted-rule publication readiness");q("#save-schema").click();await waitFor(()=>q("#schema-revision-review").open&&!q("#confirm-schema-revision").disabled,"the promoted-rule publication review");q("#confirm-schema-revision").click();await __waitForDurableSchemaObservation((schemas)=>schemas.some(({id,version,workingDraft})=>id==="schema:page-view"&&version===4&&!workingDraft),"the promoted-rule schema publication");openPage();
  const reopened={version:page().version,local42Count:promotion("local-42","/page_name").parentElement.querySelectorAll(".local-rule-promotion-action:enabled").length,reusableCount:document.querySelectorAll('.schema-attached-rule[data-rule-id="reusable-51"] .local-rule-promotion-action').length,noWorkingDraftBeforeAction:page().workingDraft===undefined};
  q("#close-schema-editor").click();q("#create-schema").click();set("#schema-editor-name","Temporary schema");q("#add-schema-property").click();set("#schema-manual-property-path","page_type");click(q("#schema-manual-property-dialog"),"Add property");const tempProperty=await waitFor(()=>document.querySelector('[data-schema-property-canonical-path="/page_type"]'),"the remounted temporary page_type property");click(tempProperty,"Add rule");click(q("#schema-property-rule-picker"),"Allowed values");set("#schema-local-rule-allowed-value-1","product");click(q("#schema-property-rule-picker"),"Create rule");const tempLocal=await waitFor(()=>document.querySelector('[data-schema-property-canonical-path="/page_type"]')?.querySelector('.schema-attached-rule[data-rule-id^="local-rule:"]'),"the remounted temporary local rule");const tempId=tempLocal.dataset.ruleId;const tempPromotion=q(".local-rule-promotion-action",tempLocal);tempPromotion.click();set("#local-rule-promotion-name","Standalone page types");click(q("#local-rule-promotion-review"),"Confirm promotion");try{await waitFor(()=>!q("#local-rule-promotion-review").open,"the standalone promotion presentation");}catch(error){const review=q("#local-rule-promotion-review"),buttons=Array.from(review.querySelectorAll("button")),confirm=buttons.find(({textContent})=>textContent?.startsWith("Confirm")),cancel=buttons.find(({textContent})=>textContent==="Cancel");throw new Error("Standalone promotion did not settle: "+JSON.stringify({assistance:q("#local-rule-promotion-assistance",review).textContent,confirmDisabled:confirm?.disabled,cancelDisabled:cancel?.disabled,recoveryOpen:q("#durable-storage-recovery").open,durableStatus:q("#durable-repository-status").textContent,rules:JSON.parse(localStorage.getItem(ruleKey)).map(({id,name,attachments})=>({id,name,attachments}))}));}const rulesAfterNew=JSON.parse(localStorage.getItem(ruleKey));q("#close-schema-editor").click();const newSchema={localId:tempId,promotedCount:rulesAfterNew.filter(({name})=>name==="Standalone page types").length,standaloneAttachments:rulesAfterNew.find(({name})=>name==="Standalone page types")?.attachments??[],schemaStorageUnchanged:stored().length===1,provisionalAbsent:!localStorage.getItem(schemaKey).includes("Temporary schema")};
  return {initial,cancelled,failure,promoted,reopened,newSchema};
})()`;

const localRulePromotionOpenRuntime = `(() => {
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  q("#data-layer-view-schemas").click();
  const schemaRow=Array.from(q("#schema-list").children).find(({textContent})=>textContent.includes("Page view"));if(!schemaRow)throw new Error("Missing Page view schema row");const edit=Array.from(schemaRow.querySelectorAll("button")).find(({textContent})=>textContent==="Edit working draft");if(!edit)throw new Error("Missing Page view edit action");edit.click();
  const property=q('li[data-schema-property-canonical-path="/page_type"]'); const disclosure=q("details[data-attached-rules]",property); disclosure.open=true;
  const row=q('.schema-attached-rule[data-rule-id="local-41"]',property); const action=q(".local-rule-promotion-action",row);
  const detail=q("#schema-detail"); detail.style.maxBlockSize="180px"; detail.scrollTop=47; action.focus({preventScroll:true});
  return {localCount:row.querySelectorAll(".local-rule-promotion-action:enabled").length,reusableCount:0,inheritedCount:0,scroll:detail.scrollTop,focused:document.activeElement?.dataset.ruleId};
})()`;

const localRuleEditingSeedRuntime = `(() => {
  localStorage.clear();
  const document={type:"object",properties:{page_type:{type:"string"},page_name:{type:"string"},unrelated:{type:"string"}}};
  const local40={id:"local-40",name:"Known page types",version:1,propertyPath:"/page_type",operator:"allowed-values",allowedValues:["page","product","checkout"],severity:"error",message:"First rule",enabled:true};
  const local41={id:"local-41",name:"Known page types",version:1,propertyPath:"/page_type",operator:"allowed-values",allowedValues:["page","product"],severity:"warning",message:"Choose a known page type",enabled:true};
  const localRegex={id:"local-regex",name:"Page name format",version:1,propertyPath:"/page_name",operator:"regular-expression",parameters:"^[a-z]+$",severity:"error",enabled:true};
  const reusable={id:"reusable-51",name:"Approved page names",version:2,propertyPath:"/page_name",operator:"allowed-values",allowedValues:["home"],severity:"warning",enabled:true};
  const page={id:"schema-page-view",name:"Page view",version:3,published:true,document,assignments:[],attachedRules:[local40,local41,localRegex,reusable],revisionHistory:[]};
  const library=[{...reusable,kind:"Allowed values",attachments:[page.id],revisionHistory:[]}];
  localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([page]));localStorage.setItem("my-chrome-utilities.schema-rule-library.v1",JSON.stringify(library));return true;
})()`;

const localRuleEditingRuntime = `(async()=>{
  const pause=(milliseconds=0)=>new Promise((resolve)=>setTimeout(resolve,milliseconds));const waitFor=async(predicate,label)=>{for(let attempt=0;attempt<100;attempt+=1){const value=predicate();if(value)return value;await pause(10);}throw new Error("Timed out waiting for "+label);};const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const click=(root,label)=>{const value=Array.from(root.querySelectorAll("button")).find(({textContent})=>textContent===label);if(!value)throw new Error("Missing "+label);value.click();return value;};
  q("#data-layer-view-schemas").click();click(q("#schema-list"),"Edit working draft");
  const property=(path)=>{const rows=Array.from(q("#schema-property-tree").querySelectorAll('li[data-schema-property-path="'+path+'"]')).filter((row)=>row.getClientRects().length);const value=rows.find((row)=>row.querySelector("details[data-attached-rules]"))??rows[0];if(!value)throw new Error("Missing visible property "+path);return value;};const disclosure=(path)=>q("details[data-attached-rules]",property(path));disclosure("page_type").open=true;
  const edit=(id,path)=>click(q('.schema-attached-rule[data-rule-id="'+id+'"]',path?property(path):document),"Edit");
  edit("local-41");const dialog=q("#schema-property-rule-picker");
  const opened={heading:q("#schema-property-rule-picker-heading",dialog).textContent,context:dialog.querySelector("p").textContent,values:Array.from(dialog.querySelectorAll("#schema-local-rule-allowed-values input"),({value})=>value),severity:q("#schema-local-rule-severity",dialog).value,message:q("#schema-local-rule-message",dialog).value,enabled:q("#schema-local-rule-enabled",dialog).checked,reusableMetadata:dialog.querySelector("#schema-local-rule-reusable")!==null,focused:dialog.contains(document.activeElement)};
  const beforeCancel=localStorage.getItem("my-chrome-utilities.schema-library.v1");const cancelledInput=q("#schema-local-rule-allowed-value-1",dialog);cancelledInput.value="cancelled";cancelledInput.dispatchEvent(new Event("input",{bubbles:true}));click(dialog,"Cancel");edit("local-41");const cancelled={storageUnchanged:beforeCancel===localStorage.getItem("my-chrome-utilities.schema-library.v1"),reopened:Array.from(dialog.querySelectorAll("#schema-local-rule-allowed-values input"),({value})=>value)};click(dialog,"Cancel");
  const beforeInvalid=localStorage.getItem("my-chrome-utilities.schema-library.v1"),rulePicker=await import("/data-layer-schema-property-rule-picker.js"),invalidResult=rulePicker.validateRuleConfiguration({...rulePicker.createRuleConfiguration("Regular expression","string"),pattern:"["}),invalid={assistance:invalidResult.assistance,button:!invalidResult.ready,storageUnchanged:beforeInvalid===localStorage.getItem("my-chrome-utilities.schema-library.v1")};
  property("page_name").click();await waitFor(()=>property("page_name").querySelector("details[data-attached-rules]"),"the page_name property detail");disclosure("page_name").open=true;await waitFor(()=>{const action=property("page_name").querySelector('.schema-attached-rule[data-rule-id="reusable-51"] .schema-attached-rule-edit');return action&&!action.disabled;},"the reusable-rule edit action");const selectedBytes=localStorage.getItem("my-chrome-utilities.schema-library.v1"),selection={storageUnchanged:selectedBytes===beforeInvalid,pending:JSON.parse(selectedBytes)[0].workingDraft?.pendingChanges??[],busy:q("#schema-editor").getAttribute("aria-busy"),controlsEnabled:!q("#schema-search").disabled&&!q('.schema-attached-rule[data-rule-id="reusable-51"] .schema-attached-rule-edit',property("page_name")).disabled};edit("reusable-51","page_name");await waitFor(()=>q("#schema-subview-rules").getAttribute("aria-selected")==="true"&&!q("#schema-rule-editor").hidden,"the reusable Rule Library editor");const routed={ruleLibrary:q("#schema-subview-rules").getAttribute("aria-selected"),reusableEditor:!q("#schema-rule-editor").hidden,name:q("#schema-rule-name").value,localDialog:dialog.open,selection};
  const localEditing=await import("/data-layer-local-rule-editing.js"),repositoryModule=await import("/data-layer-durable-project-repository.js"),repository=await repositoryModule.openIndexedDbProjectRepository(),records=await repository.savedSchemaRecords(),record=records.find(({schema})=>schema.id==="schema-page-view");if(!record)throw new Error("Missing durable Page view schema");const sourceRule=(record.schema.workingDraft?.attachedRules??record.schema.attachedRules).find(({id})=>id==="local-41"),updated=localEditing.saveLocalRuleEdit(record.schema,{propertyPath:"/page_type",ruleId:"local-41",rule:{...sourceRule,allowedValues:[...sourceRule.allowedValues,"checkout"]}}),commit=await repository.applySavedSchemaBatch({upserts:[{schema:updated,baseToken:record.token}],deletes:[],label:"Save local-rule browser observation"});if(commit.status!=="committed")throw new Error("Durable local-rule edit conflicted");const stored=(await __waitForDurableSchemaObservation(([schema])=>schema?.workingDraft?.attachedRules?.find(({id})=>id==="local-41")?.allowedValues?.includes("checkout"),"the saved local-rule edit"))[0];
  const draftMatches=stored.workingDraft.attachedRules.filter(({id})=>id==="local-41"),draftRule=draftMatches[0];const saved={version:stored.version,published:stored.attachedRules.find(({id})=>id==="local-41").allowedValues,draft:draftRule.allowedValues,ruleId:draftRule.id,ruleCount:draftMatches.length,propertyPath:draftRule.propertyPath,operator:draftRule.operator,first:stored.workingDraft.attachedRules.find(({id})=>id==="local-40").allowedValues,pending:stored.workingDraft.pendingChanges};
  const verification=await import("/data-layer-schema-verification.js");const active={...stored,document:stored.workingDraft.document,assignments:stored.workingDraft.assignments,attachedRules:stored.workingDraft.attachedRules};const preview=verification.validateWithSchema({sourceId:"history",eventName:"page_view",payload:{page_type:"checkout",page_name:"home"},rawInput:[]},active,[active]);
  return{opened,cancelled,saved,invalid,routed,previewIssues:preview.issues.filter(({instancePath})=>instancePath==="/page_type").length};
})()`;

const localRuleEditingRenderedRuntime = `(async() => {
  const pause=()=>new Promise((resolve)=>setTimeout(resolve,10)),waitFor=async(predicate,label)=>{for(let attempt=0;attempt<100;attempt+=1){const value=predicate();if(value)return value;await pause();}throw new Error("Timed out waiting for "+label);};const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};const click=(root,label)=>{const value=Array.from(root.querySelectorAll("button")).find(({textContent})=>textContent===label);if(!value)throw new Error("Missing "+label);value.click();return value;};
  q("#data-layer-view-schemas").click();click(q("#schema-list"),"Edit working draft");const row=()=>Array.from(q("#schema-property-tree").querySelectorAll('li[data-schema-property-path="page_type"]')).find((candidate)=>candidate.getClientRects().length);let property=row();if(!property)throw new Error("Missing rendered page_type property after reload");if(!property.querySelector("details[data-attached-rules]")){property.click();property=await waitFor(()=>row()?.querySelector("details[data-attached-rules]")?.closest('li[data-schema-property-path="page_type"]'),"the rendered page_type property detail after reload");}const disclosure=q("details[data-attached-rules]",property);disclosure.open=true,action=q('.schema-attached-rule[data-rule-id="local-41"] .schema-attached-rule-edit',property);action.dispatchEvent(new MouseEvent("click",{bubbles:true}));const dialog=await waitFor(()=>{const value=document.querySelector("#schema-property-rule-picker");return value?.open?value:undefined;},"the rendered persisted local-rule dialog"),rendered=Array.from(dialog.querySelectorAll("#schema-local-rule-allowed-values input"),({value})=>value);click(dialog,"Cancel");return{open:disclosure.open,focused:document.activeElement?.dataset.schemaPropertyPath,rendered};
})()`;

const reusableRuleSyncSeedRuntime = `(() => {
  localStorage.clear();const document={type:"object",properties:{page_type:{type:"string"},page_name:{type:"string"}}};const attachment=(path)=>({id:"reusable-51",name:"Approved page types",version:1,propertyPath:path,operator:"allowed-values",allowedValues:["page","product"],severity:"warning"});
  const schema=(id,name,version,rules)=>({id,name,version,published:true,document,assignments:[],attachedRules:rules,revisionHistory:[]});const page=schema("schema-page","Page view",3,[attachment("/page_type"),attachment("/page_name")]);const product=schema("schema-product","Product detail",5,[attachment("/page_type")]);const other=schema("schema-other","Other",7,[{id:"other",version:1,propertyPath:"/page_type",operator:"required"}]);
  const rule={id:"reusable-51",name:"Approved page types",kind:"Allowed values",version:1,operator:"allowed-values",allowedValues:["page","product"],severity:"warning",enabled:true,attachments:[page.id,product.id],revisionHistory:[]};
  localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([page,product,other]));localStorage.setItem("my-chrome-utilities.schema-rule-library.v1",JSON.stringify([rule]));return true;
})()`;

const reusableRuleSyncRuntime = `(async()=>{
  const pause=(milliseconds=0)=>new Promise((resolve)=>setTimeout(resolve,milliseconds)),waitFor=async(predicate,label)=>{for(let attempt=0;attempt<400;attempt+=1){const value=predicate();if(value)return value;await pause(10);}throw new Error("Timed out waiting for "+label);};const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};const click=(root,label)=>{const value=Array.from(root.querySelectorAll("button")).find(({textContent})=>textContent===label);if(!value)throw new Error("Missing "+label);value.click();return value;};
  q("#data-layer-view-schemas").click();q("#schema-subview-rules").click();const before=localStorage.getItem("my-chrome-utilities.schema-library.v1");let row=q('[data-rule-id="reusable-51"]');click(row,"Edit");const parameters=q("#schema-rule-parameters");parameters.value="page, product, checkout";parameters.dispatchEvent(new Event("input",{bubbles:true}));q("#save-schema-rule").click();q("#confirm-schema-rule-revision-review").click();await pause();const savedRule=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1"))[0];row=q('[data-rule-id="reusable-51"]');const sync=Array.from(row.querySelectorAll("button")).find(({textContent})=>textContent==="Sync attached schemas and publish revisions");if(!sync)throw new Error("Missing sync after save: "+JSON.stringify(savedRule)+" row="+row.textContent);const saved={schemasUnchanged:before===localStorage.getItem("my-chrome-utilities.schema-library.v1"),version:savedRule.version,values:savedRule.allowedValues,action:Boolean(sync)};const action=()=>sync.click();action();const dialog=q("#schema-rule-sync-review");const review={summary:q("#schema-rule-sync-review-summary",dialog).textContent,confirmDisabled:q("#confirm-schema-rule-sync",dialog).disabled};click(dialog,"Cancel");review.cancelled=before===localStorage.getItem("my-chrome-utilities.schema-library.v1");
  action();const restoreSyncFailure=__failNextDurableSchemaWrite("publication fails",(schema)=>schema?.version===4||schema?.version===6);q("#confirm-schema-rule-sync",dialog).click();await waitFor(()=>q("#durable-storage-recovery").open&&q("#durable-repository-status").textContent.includes("publication fails"),"the durable reusable-rule sync failure");restoreSyncFailure();const failedBaseline=JSON.stringify(globalThis.__lastFailedDurableSchemaBaseline),failedProjection=localStorage.getItem("my-chrome-utilities.schema-library.v1"),failure={unchanged:failedBaseline===failedProjection,message:q("#durable-repository-status").textContent,recovery:q("#durable-storage-recovery").open,retry:!q("#retry-durable-save").disabled};if(!failure.unchanged)throw new Error("Failed reusable-rule batch changed the settled durable projection. Before: "+failedBaseline+" After: "+failedProjection);q("#retry-durable-save").click();const retryResult=await waitFor(()=>{const text=q("#durable-recovery-result").textContent;return text.includes("committed to the Saved Schema Library")||text.includes("Retry was not committed")?text:undefined;},"the reusable-rule sync retry result");if(retryResult.includes("Retry was not committed"))throw new Error(retryResult);const stored=await globalThis.__waitForDurableSchemaObservation((schemas)=>schemas.some(({id,version})=>id==="schema-page"&&version===4)&&schemas.some(({id,version})=>id==="schema-product"&&version===6),"retried reusable-rule attachment publication");q("#close-storage-recovery").click();const page=stored.find(({id})=>id==="schema-page"),product=stored.find(({id})=>id==="schema-product"),other=stored.find(({id})=>id==="schema-other"),publishedRow=q('[data-rule-id="reusable-51"]');const actionRemoved=!Array.from(publishedRow.querySelectorAll("button")).some(({textContent})=>textContent==="Sync attached schemas and publish revisions");return{saved,review,failure,published:{versions:[page.version,product.version,other.version],pageRules:page.attachedRules.map(({id,version})=>[id,version]),productRules:product.attachedRules.map(({id,version})=>[id,version]),historical:[page.revisionHistory.at(-1).attachedRules.map(({version})=>version),product.revisionHistory.at(-1).attachedRules.map(({version})=>version)],values:page.attachedRules[0].allowedValues,workingDrafts:stored.filter(({workingDraft})=>workingDraft).length,actionRemoved}};
})()`;

const requiredRuleTypeIndependenceSeedRuntime = `(() => {
  localStorage.clear();
  const document={type:"object",properties:{page_type:{type:"string"},title:{type:"string"},quantity:{type:"number"},consented:{type:"boolean"},customer:{type:"object",properties:{}},products:{type:"array",items:{type:"string"}}}};
  const schema={id:"schema-page",name:"Page view",version:4,published:true,document,assignments:[],attachedRules:[],revisionHistory:[]};
  const rule={id:"reusable-required-7",name:"Product-detail requirement",kind:"Required · string",version:3,operator:"required",applicableType:"string",enabled:true,severity:"error",message:"Product detail requires this property",conditionGroup:{operator:"All",predicates:[{propertyPath:"/page_type",operator:"Equals",comparison:{type:"string",value:"product_detail"},detectedType:"string"}]},attachments:["existing-schema"],revisionHistory:[{name:"Product-detail requirement",kind:"Required · string",version:2,operator:"required",applicableType:"string"}]};
  localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([schema]));localStorage.setItem("my-chrome-utilities.schema-rule-library.v1",JSON.stringify([rule]));return true;
})()`;

const requiredRuleTypeIndependenceRuntime = `(async()=>{
  const pause=(milliseconds=0)=>new Promise((resolve)=>setTimeout(resolve,milliseconds));
  const waitFor=async(predicate,label)=>{for(let attempt=0;attempt<400;attempt+=1){const value=predicate();if(value)return value;await pause(10);}throw new Error("Timed out waiting for "+label);};
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const click=(root,label)=>{const value=Array.from(root.querySelectorAll("button")).find(({textContent})=>textContent===label);if(!value)throw new Error("Missing "+label+" in "+root.textContent);value.click();return value;};
  const paths=["/title","/quantity","/consented","/customer","/products"],types=["string","number","boolean","object","array"];
  const ruleKey="my-chrome-utilities.schema-rule-library.v1",beforeRule=localStorage.getItem(ruleKey);
  q("#data-layer-view-schemas").click();click(q("#schema-list"),"Edit working draft");
  const offered=[];let stored;
  for(const path of paths){const trigger=await waitFor(()=>{if(q("#schema-editor").getAttribute("aria-busy")==="true")return;const row=document.querySelector('[data-schema-property-canonical-path="'+path+'"]'),action=row?.querySelector('button[aria-label="Add rule for '+path.slice(1)+'"]');return action&&!action.disabled?action:undefined;},"the ready Add rule action at "+path);trigger.click();const picker=await waitFor(()=>{const value=document.querySelector("#schema-property-rule-picker");return value?.open?value:undefined;},"the remounted rule picker at "+path);const action=Array.from(picker.querySelectorAll("button")).find(({textContent})=>textContent==="Product-detail requirement version 3");offered.push({path,enabled:Boolean(action&&!action.disabled),metadata:action?.parentElement?.textContent??""});if(!action)throw new Error("Required rule absent for "+path);action.click();stored=(await globalThis.__waitForDurableSchemaObservation(([schema])=>schema?.workingDraft?.attachedRules?.some(({id,propertyPath})=>id==="reusable-required-7"&&propertyPath===path),"required reusable rule at "+path))[0];await waitFor(()=>{if(q("#schema-editor").getAttribute("aria-busy")==="true")return;const row=document.querySelector('[data-schema-property-canonical-path="'+path+'"]');return row?.querySelector('.schema-attached-rule[data-rule-id="reusable-required-7"]');},"the settled required-rule presentation at "+path);}
  const attachments=stored.workingDraft.attachedRules.filter(({id})=>id==="reusable-required-7");
  const verification=await import("/data-layer-schema-verification.js"),active={...stored,document:stored.workingDraft.document,assignments:stored.workingDraft.assignments,attachedRules:stored.workingDraft.attachedRules};
  const validate=(payload)=>verification.validateWithSchema({sourceId:"history",eventName:"page_view",payload,rawInput:[]},active,[active]);
  const missing=validate({page_type:"product_detail"}),present=validate({page_type:"product_detail",title:"x",quantity:0,consented:false,customer:{},products:[]}),notApplicable=validate({page_type:"category"});
  return{offered,attachments:attachments.map(({id,version,propertyPath})=>({id,version,propertyPath})),libraryCount:JSON.parse(localStorage.getItem(ruleKey)).length,ruleUnchanged:beforeRule===localStorage.getItem(ruleKey),validation:{missingIssues:missing.issues.filter(({rule})=>rule?.startsWith("Product-detail requirement")).map(({instancePath})=>instancePath),missingStatuses:missing.evaluations.filter(({rule})=>rule==="Product-detail requirement").map(({status})=>status),presentIssues:present.issues.length,presentStatuses:present.evaluations.filter(({rule})=>rule==="Product-detail requirement").map(({status})=>status),notApplicableIssues:notApplicable.issues.length,notApplicableStatuses:notApplicable.evaluations.filter(({rule})=>rule==="Product-detail requirement").map(({status})=>status)},types};
})()`;

const localRulePromotionReusableOriginRuntime = `(() => {
  const schemas=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")); const schema=schemas.find(({id})=>id==="schema:page-view");if(!schema)throw new Error("Missing schema:page-view promotion fixture");const source=(schema.workingDraft?.attachedRules??schema.attachedRules??[]).find(({id})=>id==="local-41");if(!source)throw new Error("Missing local-41 promotion fixture on schema:page-view");
  localStorage.setItem("my-chrome-utilities.schema-rule-library.v1",JSON.stringify([{...source,kind:"Allowed values",version:2,attachments:[schema.id],revisionHistory:[]} ])); return true;
})()`;

const localRulePromotionOriginCountRuntime = `(() => {
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;}; q("#data-layer-view-schemas").click(); const schemaRow=Array.from(q("#schema-list").children).find(({textContent})=>textContent.includes("Page view"));if(!schemaRow)throw new Error("Missing Page view schema row");Array.from(schemaRow.querySelectorAll("button")).find(({textContent})=>textContent==="Edit working draft").click(); const row=q('.schema-attached-rule[data-rule-id="local-41"]'); return row.querySelectorAll(".local-rule-promotion-action:enabled").length;
})()`;

const localRulePromotionInheritedSeedRuntime = `(() => {
  localStorage.clear(); const document={type:"object",properties:{page_type:{type:"string"}}}; const inherited={id:"local-41",name:"Known page types",version:1,propertyPath:"/page_type",operator:"allowed-values",allowedValues:["product","content"]};
  const parent={id:"schema:parent",name:"Parent",version:1,published:true,document,assignments:[],attachedRules:[inherited],revisionHistory:[]}; const child={id:"schema:page-view",name:"Page view",version:3,published:true,document,assignments:[],parentSchemaId:parent.id,attachedRules:[],revisionHistory:[],workingDraft:{baseVersion:3,sourceVersion:3,document,assignments:[],parentSchemaId:parent.id,attachedRules:[],pendingChanges:[]}};
  localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([child,parent])); localStorage.setItem("my-chrome-utilities.schema-rule-library.v1","[]"); return true;
})()`;

const localRulePromotionInheritedCountRuntime = `(() => {
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;}; q("#data-layer-view-schemas").click(); const schemaRow=Array.from(q("#schema-list").children).find(({textContent})=>textContent.includes("Page view"));if(!schemaRow)throw new Error("Missing Page view schema row");Array.from(schemaRow.querySelectorAll("button")).find(({textContent})=>textContent==="Edit working draft").click(); const inherited=q("#schema-inherited-rule-groups"); if(!inherited.textContent.includes("local-41"))throw new Error("Inherited stable identity was not rendered"); return inherited.querySelectorAll(".local-rule-promotion-action:enabled").length;
})()`;

const localRulePromotionReviewRuntime = `(() => {
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const review=q("#local-rule-promotion-review"); const rect=review.getBoundingClientRect();
  const observation={summary:q("#local-rule-promotion-summary",review).textContent,configuration:q("#local-rule-promotion-configuration",review).textContent,name:q("#local-rule-promotion-name",review).value,required:q("#local-rule-promotion-name",review).required,focus:document.activeElement?.id,withinWidth:rect.left>=0&&rect.right<=innerWidth};
  Array.from(review.querySelectorAll("button")).find(({textContent})=>textContent==="Cancel").click();
  const property=q('li[data-schema-property-canonical-path="/page_type"]'); const action=q('.schema-attached-rule[data-rule-id="local-41"] .local-rule-promotion-action',property); action.focus({preventScroll:true});
  return {observation,cancelled:{focus:document.activeElement?.dataset.ruleId,open:q("details[data-attached-rules]",property).open,scroll:q("#schema-detail").scrollTop}};
})()`;

const localRulePromotionPrepareConfirmRuntime = `(() => {
  const review=document.querySelector("#local-rule-promotion-review");
  Object.defineProperty(Crypto.prototype,"randomUUID",{value:()=>"51",configurable:true});
  const name=review.querySelector("#local-rule-promotion-name"); name.value="Approved page types"; name.dispatchEvent(new Event("input",{bubbles:true}));
  const description=review.querySelector("#local-rule-promotion-description"); description.value="Known storefront page types"; description.dispatchEvent(new Event("input",{bubbles:true}));
  const examples=review.querySelector("#local-rule-promotion-examples"); examples.value="product, content"; examples.dispatchEvent(new Event("input",{bubbles:true}));
  const confirm=Array.from(review.querySelectorAll("button")).find(({textContent})=>textContent==="Confirm promotion"); confirm.focus({preventScroll:true});
  return {disabled:confirm.disabled,focus:document.activeElement===confirm};
})()`;

const localRulePromotionFailureRuntime = (failureKey) => `(async () => {
  const pause=(milliseconds=0)=>new Promise((resolve)=>setTimeout(resolve,milliseconds)),waitFor=async(predicate,label)=>{for(let attempt=0;attempt<400;attempt+=1){const value=predicate();if(value)return value;await pause(10);}throw new Error("Timed out waiting for "+label);},q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const action=q('.schema-attached-rule[data-rule-id="local-41"] .local-rule-promotion-action'); action.click();
  const review=q("#local-rule-promotion-review"); const name=q("#local-rule-promotion-name",review); name.value="Approved page types"; name.dispatchEvent(new Event("input",{bubbles:true}));
  const schemaKey="my-chrome-utilities.schema-library.v1",ruleKey="my-chrome-utilities.schema-rule-library.v1",failureKey=${JSON.stringify(failureKey)},before=[localStorage.getItem(schemaKey),localStorage.getItem(ruleKey)],original=Storage.prototype.setItem;let failed=false;const restore=failureKey===schemaKey?__failNextDurableSchemaWrite("simulated persistence failure"):(()=>{Storage.prototype.setItem=function(key,value){if(key===failureKey&&!failed){failed=true;throw new Error("simulated persistence failure");}return original.call(this,key,value);};return()=>{Storage.prototype.setItem=original;};})();
  Array.from(review.querySelectorAll("button")).find(({textContent})=>textContent==="Confirm promotion").click();if(failureKey===schemaKey){await waitFor(()=>q("#durable-storage-recovery").open&&q("#durable-repository-status").textContent.includes("simulated persistence failure"),"the durable promotion recovery");restore();q("#reject-durable-save").click();await waitFor(()=>q("#durable-recovery-result").textContent.includes("Rejected "),"the rejected durable promotion");await waitFor(()=>q("#local-rule-promotion-assistance",review).textContent.includes("simulated persistence failure"),"the rejected promotion assistance");q("#close-storage-recovery").click();}else restore();
  const after=[localStorage.getItem(schemaKey),localStorage.getItem(ruleKey)]; const result={unchanged:before[0]===after[0]&&before[1]===after[1],local:q('.schema-attached-rule[data-rule-id="local-41"]')!==null,rules:JSON.parse(after[1]).length,assistance:q("#local-rule-promotion-assistance",review).textContent};
  Array.from(review.querySelectorAll("button")).find(({textContent})=>textContent==="Cancel").click(); q('.schema-attached-rule[data-rule-id="local-41"] .local-rule-promotion-action').focus({preventScroll:true}); return result;
})()`;

const localRulePromotionAfterRuntime = `(async () => {
  const pause=(milliseconds=0)=>new Promise((resolve)=>setTimeout(resolve,milliseconds)),waitFor=async(predicate,label)=>{for(let attempt=0;attempt<400;attempt+=1){const value=predicate();if(value)return value;await pause(10);}throw new Error("Timed out waiting for "+label);};
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  await globalThis.__waitForDurableSchemaObservation((schemas)=>schemas.find(({id})=>id==="schema:page-view")?.workingDraft?.attachedRules?.some(({id})=>id==="reusable-51"),"the durable local-rule promotion");await waitFor(()=>!q("#local-rule-promotion-review").open&&q("#schema-editor").getAttribute("aria-busy")!=="true","the settled local-rule promotion presentation");
  const schemas=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")); const rules=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1")); const page=schemas.find(({id})=>id==="schema:page-view");
  const property=q('li[data-schema-property-canonical-path="/page_type"]'); const replacement=q('.schema-attached-rule[data-rule-id="reusable-51"]',property);
  const beforePublish={rule:rules[0],ids:page.workingDraft.attachedRules.map(({id})=>id),paths:page.workingDraft.attachedRules.map(({propertyPath})=>propertyPath),neighbors:[JSON.stringify(page.workingDraft.attachedRules[0]),JSON.stringify(page.workingDraft.attachedRules[2])],pending:page.workingDraft.pendingChanges,publishedId:page.attachedRules[0].id,focus:document.activeElement?.dataset.ruleId,open:q("details[data-attached-rules]",property).open,scroll:q("#schema-detail").scrollTop,noHorizontal:document.documentElement.scrollWidth<=innerWidth};
  await waitFor(()=>!q("#save-schema").disabled,"the promoted schema publication action");q("#save-schema").click();await waitFor(()=>q("#schema-revision-review").open&&!q("#confirm-schema-revision").disabled,"the promoted schema publication review");q("#confirm-schema-revision").click();
  const stored=await globalThis.__waitForDurableSchemaObservation((schemas)=>schemas.find(({id,version,workingDraft})=>id==="schema:page-view"&&version===4&&!workingDraft),"the promoted schema publication"); const published=stored.find(({id})=>id==="schema:page-view"); const historical=published.revisionHistory.find(({version})=>version===3); const verification=await import("/data-layer-schema-verification.js"); const event={sourceId:"history",eventName:"page_view",payload:{page_type:"unknown",site:"consumer"},rawInput:[]};
  const currentEvaluation=verification.validateWithSchema(event,published,stored).evaluations.find(({ruleId})=>ruleId==="reusable-51"); const historicalEvaluation=verification.validateWithSchema(event,historical,[historical]).evaluations.find(({ruleId})=>ruleId==="local-41");
  return {beforePublish,afterPublish:{version:published.version,currentId:currentEvaluation.ruleId,historicalId:historicalEvaluation.ruleId,otherIds:stored.find(({id})=>id==="schema:other").attachedRules.map(({id})=>id)}};
})()`;

const allowedValueExpansionSeedRuntime = `(async () => {
  const defects = await import("/data-layer-defect-library.js");
  localStorage.clear();
  const assignment = { id:"assignment:page-view", sourceId:"history", eventName:"page_view", target:"payload", priority:10, versionPolicy:"follow latest", enabled:true };
  const document = { type:"object", properties:{ page_type:{ type:"string" }, site:{ type:"string" } } };
  const rule = { id:"stable-id-41", name:"Known page types", version:1, propertyPath:"/page_type", operator:"allowed-values", parameters:"product,content", severity:"error", message:"Choose a known page type", conditionGroup:{ operator:"All", predicates:[{ propertyPath:"/site", operator:"Equals", comparison:{ type:"string", value:"consumer" }, detectedType:"string" }] } };
  const schema = { id:"schema:otelo-pageview", name:"Otelo - Generic Pageview", version:2, published:true, document, assignments:[assignment], attachedRules:[rule], revisionHistory:[], workingDraft:{ baseVersion:2, sourceVersion:2, document, assignments:[assignment], attachedRules:[rule], pendingChanges:["Document checkout ownership"] } };
  localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([schema]));
  localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", "[]");
  const payload = { page_type:"product_test", site:"consumer" };
  const rawInput = ["page_view",payload];
  const timeline = [{ type:"observed", url:"https://shop.example/products/test", timestamp:"2026-07-14T13:00:00Z", observerPath:"dataLayer", id:"event:page-view", name:"page_view", sessionId:"session:allowed-value", sourceId:"history", sourceKind:"Data layer", pageUrl:"https://shop.example/products/test", payload, rawInput, rawValue:rawInput, validation:"Not checked" }];
  localStorage.setItem("dataLayerTestingSession", JSON.stringify({ session:{ id:"session:allowed-value", status:"active", freshBoundary:true, tabId:1, historyPath:"dataLayer", startUrl:"https://shop.example/products/test", currentUrl:"https://shop.example/products/test", timeline } }));
  const issue = { sourceId:"history", eventName:"page_view", schemaId:schema.id, validationTarget:"payload", concretePath:"/page_type", templatePath:"/page_type", ruleId:rule.id, ruleRevision:1, actual:"product_test", expected:"product,content", pageUrl:"https://shop.example/products/test", captureTime:"2026-07-14T13:00:00Z", sourceName:"history", schemaName:schema.name, ruleName:rule.name };
  const defect = { ...defects.createValidationDefect({ id:"defect:page-type-v2", now:"2026-07-14T13:01:00Z", report:{ summary:"page_view has unknown page type" }, issues:[issue] }), status:"Reported" };
  localStorage.setItem(defects.DEFECT_LIBRARY_STORAGE_KEY, defects.serializeDefectLibrary({ defects:[defect] }));
  return true;
})()`;

const allowedValueExpansionRuntime = `(async () => {
  const pause = () => new Promise((resolve) => setTimeout(resolve, 0));
  const q = (selector, root=document) => { const value=root.querySelector(selector); if (!value) throw new Error("Missing " + selector); return value; };
  const click = (label, root=document) => { const value=Array.from(root.querySelectorAll("button")).find((candidate) => candidate.textContent === label || candidate.textContent.startsWith(label)); if (!value) throw new Error("Missing action " + label); value.click(); return value; };
  q("#live-event-feed button").click(); click("Validate",q("#live-event-inspector")); await pause(); q("#back-to-events").click(); q("#live-event-feed button").click();
  const inspector=q("#live-event-inspector"); const property=q('[data-property-path="/page_type"]'); q(".live-property-status",property).click();
  const actions=()=>Array.from(property.querySelectorAll(".live-allowed-value-expansion"));
  const action=actions()[0]; inspector.style.height="220px"; inspector.style.overflow="auto"; inspector.scrollTop=37; action.focus({preventScroll:true});
  const initial={ count:actions().length, ruleId:action.dataset.ruleId, ruleVersion:action.dataset.ruleVersion, status:q("#live-inspector-validation-summary").textContent, schema:q('dt[data-field="assigned schema"] + dd').textContent, raw:q("#live-raw-json pre").textContent, expanded:q(".live-property-status",property).getAttribute("aria-expanded") };
  action.click();
  const review=q("#allowed-value-expansion-review"); const rect=review.getBoundingClientRect();
  const reviewState={ summary:q("#allowed-value-expansion-summary",review).textContent, publication:review.textContent.includes("published schema remains unchanged"), focus:document.activeElement?.id, destination:q('input[name="allowed-value-expansion-destination"]:checked',review).value, withinWidth:rect.left>=0 && rect.right<=innerWidth };
  click("Cancel",review);
  const cancelled={ focused:document.activeElement?.dataset.ruleId, expanded:q(".live-property-status",property).getAttribute("aria-expanded"), scroll:inspector.scrollTop };
  action.click(); click("Confirm addition",q("#allowed-value-expansion-review"));
  const storedAfter=(await globalThis.__waitForDurableSchemaObservation(([schema])=>schema?.workingDraft?.attachedRules?.find(({id})=>id==="stable-id-41")?.allowedValues?.includes("product_test"),"allowed-value expansion"))[0];
  const draftRule=storedAfter.workingDraft.attachedRules.find(({id})=>id==="stable-id-41");
  const afterConfirm={ values:draftRule.allowedValues, pending:storedAfter.workingDraft.pendingChanges, publishedParameters:storedAfter.attachedRules[0].parameters, publishedValues:storedAfter.attachedRules[0].allowedValues ?? null, condition:draftRule.conditionGroup.predicates[0].comparison.value, severity:draftRule.severity, message:draftRule.message, focused:document.activeElement?.dataset.ruleId, expanded:q('.live-property-status',q('[data-property-path="/page_type"]')).getAttribute("aria-expanded"), scroll:inspector.scrollTop };
  const storedOnce=localStorage.getItem("my-chrome-utilities.schema-library.v1");
  q('.live-allowed-value-expansion[data-rule-id="stable-id-41"]').click();
  const duplicateReview=q("#allowed-value-expansion-review"); const alreadyPending=q("#allowed-value-expansion-pending",duplicateReview).textContent; click("Keep existing pending value",duplicateReview); await pause();
  const duplicateUnchanged=storedOnce===localStorage.getItem("my-chrome-utilities.schema-library.v1");
  q('.live-allowed-value-expansion[data-rule-id="stable-id-41"]').click(); click("Open working draft",q("#allowed-value-expansion-review"));
  const openedDraft={ schemaView:q("#data-layer-view-schemas").getAttribute("aria-selected"), editor:!q("#schema-editor").hidden, focused:document.activeElement?.id, values:JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"))[0].workingDraft.attachedRules[0].allowedValues };
  q("#data-layer-view-live").click(); const returned={ event:q("#live-event-inspector h4").textContent, expanded:q('.live-property-status',q('[data-property-path="/page_type"]')).getAttribute("aria-expanded"), scroll:inspector.scrollTop };
  q("#data-layer-view-schemas").click(); q("#save-schema").click(); q("#confirm-schema-revision").click();
  const published=(await globalThis.__waitForDurableSchemaObservation(([schema])=>schema?.version===3&&!schema.workingDraft&&schema.attachedRules?.find(({id})=>id==="stable-id-41")?.allowedValues?.includes("product_test"),"allowed-value expansion publication"))[0];q("#data-layer-view-live").click();const finalProperty=q('[data-property-path="/page_type"]');
  const afterPublish={ version:published.version, values:published.attachedRules[0].allowedValues, actionCount:finalProperty.querySelectorAll(".live-allowed-value-expansion").length, status:q("#live-inspector-validation-summary").textContent, feed:q("#live-event-feed button").textContent, schema:q('dt[data-field="assigned schema"] + dd').textContent, raw:q("#live-raw-json pre").textContent, defectStates:Array.from(inspector.querySelectorAll(".live-new-defect-state,.live-reported-defect-link")).map(({textContent})=>textContent) };
  return { initial,review:reviewState,cancelled,afterConfirm,alreadyPending,duplicateUnchanged,openedDraft,returned,afterPublish };
})()`;

const schemaAssignmentDataConditionsRuntime = `(async () => {
  const pause=(milliseconds=10)=>new Promise((resolve)=>setTimeout(resolve,milliseconds));
  const waitFor=async(predicate,label)=>{for(let attempt=0;attempt<400;attempt+=1){const value=predicate();if(value)return value;await pause();}throw new Error("Timed out waiting for "+label);};
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
  const click=(root,label)=>{const value=Array.from(root.querySelectorAll("button")).find((button)=>button.textContent===label||button.textContent.startsWith(label));if(!value)throw new Error("Missing action "+label);value.click();return value;};
  const change=(control,value)=>{control.value=value;control.dispatchEvent(new Event("change",{bubbles:true}));};
  const runtimeErrors=[];addEventListener("error",(event)=>runtimeErrors.push(String(event.error??event.message)));addEventListener("unhandledrejection",(event)=>runtimeErrors.push(String(event.reason)));
  const conditions=await import("/data-layer-schema-assignment-data-conditions.js");
  const verification=await import("/data-layer-schema-verification.js");
  q("#data-layer-view-schemas").click();q("#schema-subview-assignments").click();
  const assignmentList=q("#schema-assignment-list");const legacyRow=()=>Array.from(assignmentList.children).find((item)=>item.textContent.includes("Legacy assignment"));
  click(await waitFor(legacyRow,"the Legacy assignment row"),"Edit");await pause();const editor=q("#schema-assignment-editor");editor.style.height="480px";editor.style.overflow="auto";
  const absent={summary:q("#schema-assignment-condition-summary").textContent,saveDisabled:q("#save-schema-assignment").disabled};
  click(editor,"Add Data layer conditions");await pause();const empty={assistance:q("#schema-assignment-condition-assistance").textContent,saveDisabled:q("#save-schema-assignment").disabled};
  change(q("#schema-assignment-condition-group-operator"),"Any");
  const addPath=async(path)=>{click(editor,"Add condition");await pause();const rows=q("#schema-assignment-condition-predicates").children;const row=rows[rows.length-1];change(q('input[data-assignment-condition-control="path"]',row),path);await pause();};
  await addPath("/errorType");await addPath("/siteStructure");await addPath("/siteArea");
  let conditionRoot=q("#schema-assignment-data-conditions");conditionRoot.style.height="260px";conditionRoot.style.overflow="auto";conditionRoot.scrollTop=41;const secondPath=q('[data-assignment-condition-predicate="1"] input[data-assignment-condition-control="path"]',conditionRoot);secondPath.focus({preventScroll:true});change(secondPath,"/siteStructure");await pause();
  const liveRoot=()=>q("#schema-assignment-data-conditions"),predicateRows=()=>Array.from(liveRoot().querySelectorAll('[data-assignment-condition-predicate]')),pathOrder=()=>predicateRows().map(row=>q('input[data-assignment-condition-control="path"]',row).value),rowValues=()=>predicateRows().map(row=>[q('[data-reorder-trigger="true"]',row).dataset.reorderItemId,Array.from(row.querySelectorAll('input,select'),control=>({name:control.getAttribute('data-assignment-condition-control')??control.tagName,value:control.value}))]).sort(([left],[right])=>left.localeCompare(right)),rect=node=>{const value=node.getBoundingClientRect();return{left:value.left,top:value.top,right:value.right,bottom:value.bottom,width:value.width,height:value.height};},inventory=predicateRows().map(row=>{const band=row.querySelector('[data-reorder-item-row]'),trigger=q('[data-reorder-trigger="true"]',row),primary=band?.children[1],labels=Array.from(row.querySelectorAll('button'),({textContent})=>textContent.trim()),targetRect=rect(trigger),primaryRect=primary?rect(primary):null,rowRect=band?rect(band):null;return{id:trigger.dataset.reorderItemId,accessibleName:trigger.getAttribute('aria-label'),triggerCount:row.querySelectorAll('[data-reorder-trigger="true"]').length,pathCount:row.querySelectorAll('[data-assignment-condition-control="path"]').length,typeCount:row.querySelectorAll('[data-assignment-condition-control="type"]').length,operatorCount:row.querySelectorAll('[data-assignment-condition-control="operator"]').length,comparisonCount:row.querySelectorAll('[data-assignment-condition-control="comparison"]').length,remove:labels.includes('Remove condition'),paired:labels.some(label=>/Move (earlier|later|up|down|left|right)/.test(label)),rowGeometry:primaryRect&&rowRect?{consumer:'assignment data conditions',host:rect(row),gripTarget:targetRect,primaryContent:primaryRect,row:rowRect,valid:Math.min(targetRect.bottom,primaryRect.bottom)>Math.max(targetRect.top,primaryRect.top)&&Math.abs(targetRect.width-44)<=1&&Math.abs(targetRect.height-44)<=1}:null};}),beforeReorder=pathOrder(),valuesBefore=JSON.stringify(rowValues()),movedId=inventory[1].id,movedTrigger=q('[data-reorder-item-id="'+CSS.escape(movedId)+'"]',liveRoot());movedTrigger.click();click(movedTrigger.parentElement,"Move one position later");await pause();const movedOrder=pathOrder(),valuesAfterMove=JSON.stringify(rowValues()),restoredTrigger=q('[data-reorder-item-id="'+CSS.escape(movedId)+'"]',liveRoot());restoredTrigger.click();click(restoredTrigger.parentElement,"Move one position earlier");await pause();conditionRoot=liveRoot();conditionRoot.scrollTop=41;q('[data-assignment-condition-predicate="1"] input[data-assignment-condition-control="path"]',conditionRoot).focus({preventScroll:true});const restoredOrder=pathOrder(),valuesAfterRestore=JSON.stringify(rowValues()),reorderEvidence={inventoryIds:inventory.map(({id})=>id).join('|'),inventoryAccessibleNames:inventory.map(({accessibleName})=>accessibleName).join('|'),inventoryTriggerCounts:inventory.map(({triggerCount})=>triggerCount).join('|'),inventoryPathCounts:inventory.map(({pathCount})=>pathCount).join('|'),inventoryTypeCounts:inventory.map(({typeCount})=>typeCount).join('|'),inventoryOperatorCounts:inventory.map(({operatorCount})=>operatorCount).join('|'),inventoryComparisonCounts:inventory.map(({comparisonCount})=>comparisonCount).join('|'),inventoryRemoveActions:inventory.map(({remove})=>remove).join('|'),inventoryLegacyPairs:inventory.map(({paired})=>paired).join('|'),rowGeometry:inventory.map(({rowGeometry})=>rowGeometry),beforeOrder:beforeReorder.join('|'),movedOrder:movedOrder.join('|'),restoredOrder:restoredOrder.join('|'),valuesPreserved:valuesBefore===valuesAfterMove&&valuesBefore===valuesAfterRestore};
  const editorState={target:q("#schema-assignment-condition-target").value,operator:q("#schema-assignment-condition-group-operator").value,paths:Array.from(conditionRoot.querySelectorAll('input[data-assignment-condition-control="path"]')).map(({value})=>value),summary:q("#schema-assignment-condition-summary").textContent,saveDisabled:q("#save-schema-assignment").disabled,focus:document.activeElement?.value,scroll:conditionRoot.scrollTop};
  click(editor,"Save assignment");await pause();
  let stored=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"));let legacy=stored.find(({id})=>id==="schema:legacy");let current=stored.find(({id})=>id==="schema:current");const saved=legacy.assignments[0];
  q("#schema-subview-assignments").click();await pause();const savedRow=()=>Array.from(q("#schema-assignment-list").children).find((item)=>item.textContent.includes("Legacy assignment"));const durableSavedRow=await waitFor(savedRow,"the saved Legacy assignment row");
  const persisted={target:saved.conditionTarget,operator:saved.dataConditionGroup.operator,paths:saved.dataConditionGroup.predicates.map(({propertyPath})=>propertyPath),priority:saved.priority,summary:durableSavedRow.textContent};
  click(durableSavedRow,"Duplicate");await pause();stored=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"));legacy=stored.find(({id})=>id==="schema:legacy");const duplicated=legacy.assignments.find(({id})=>id.endsWith(":copy"));const duplicate={count:legacy.assignments.length,equivalent:JSON.stringify(duplicated.dataConditionGroup)===JSON.stringify(saved.dataConditionGroup),independent:duplicated.dataConditionGroup!==saved.dataConditionGroup};
  const legacyForResolution={...legacy,assignments:[saved]};const event=(payload,rawInput=payload)=>({sourceId:"event-history",eventName:"generic_event",payload,rawInput});const url="https://shop.example/generic";
  const resolve=(payload,schemas=[legacyForResolution,current])=>verification.resolveSchemaAssignment(event(payload),url,schemas);
  const families=[{payload:{errorType:"business"},expected:"Legacy generic event"},{payload:{siteStructure:"shop",siteArea:"checkout"},expected:"Legacy generic event"},{payload:{error_type:"business"},expected:"Current generic event"},{payload:{page_levels:["one"],site_section:"checkout"},expected:"Current generic event"},{payload:{unrelated:true},expected:undefined}].map(({payload,expected})=>{const result=resolve(payload);return{expected,selected:result.schema?.name,evidence:result.evidence.summary};});
  const mixed={errorType:"legacy",error_type:"current"};const legacyWins=resolve(mixed);const currentHigh={...current,assignments:current.assignments.map((assignment)=>({...assignment,priority:30}))};const currentWins=resolve(mixed,[legacyForResolution,currentHigh]);const tied={...current,assignments:current.assignments.map((assignment)=>({...assignment,priority:20}))};const tie=resolve(mixed,[legacyForResolution,tied]);
  const priority={legacy:legacyWins.schema?.name,current:currentWins.schema?.name,tie:tie.error,legacyDiagnostic:legacyWins.evidence.summary,tieDiagnostic:tie.evidence.summary};
  const pred=(propertyPath,operator,extra={})=>({propertyPath,operator,detectedType:extra.detectedType??"string",...(extra.comparison?{comparison:extra.comparison}:{}),...(extra.comparisons?{comparisons:extra.comparisons}:{})});const any=(...predicates)=>({operator:"Any",predicates});const text=(value)=>({type:"string",value});const number=(value)=>({type:"number",value});
  const cases=[
    conditions.evaluateAssignmentDataConditions({},any(pred("/missing","Exists"))).matched,
    conditions.evaluateAssignmentDataConditions({nullable:null},any(pred("/nullable","Does not exist"))).matched,
    conditions.evaluateAssignmentDataConditions({value:"1"},any(pred("/value","Equals",{detectedType:"number",comparison:number(1)}))).matched,
    conditions.evaluateAssignmentDataConditions({value:"current"},any(pred("/value","Is one of",{comparisons:[text("legacy"),text("current")]}))).matched,
    conditions.evaluateAssignmentDataConditions({value:"legacy-page"},any(pred("/value","Matches pattern",{comparison:text("^legacy-")}))).matched,
    conditions.evaluateAssignmentDataConditions({value:12},any(pred("/value","Is at least",{detectedType:"number",comparison:number(10)}))).matched,
  ];
  const paths=[
    conditions.evaluateAssignmentDataConditions({context:{siteArea:"legacy"}},any(pred("/context/siteArea","Exists"))).predicates[0],
    conditions.evaluateAssignmentDataConditions({products:[{type:"current"},{type:"legacy"}]},any(pred("/products/*/type","Equals",{comparison:text("legacy")}))).predicates[0],
    conditions.evaluateAssignmentDataConditions({products:[]},any(pred("/products/*/type","Does not exist"))).predicates[0],
    conditions.evaluateAssignmentDataConditions({"a/b":"slash"},any(pred("/a~1b","Exists"))).predicates[0],
    conditions.evaluateAssignmentDataConditions({"tilde~name":"tilde"},any(pred("/tilde~0name","Exists"))).predicates[0],
  ].map(({propertyPath,matched,observed})=>({propertyPath,matched,observed:observed.map(({concretePath,value,exists})=>({concretePath,value,exists}))}));
  const payloadAssignment={...saved,id:"payload",name:"Payload target",priority:10,conditionTarget:"payload",dataConditionGroup:any(pred("/variant","Equals",{comparison:text("legacy")}))};const rawAssignment={...saved,id:"raw",name:"Raw target",priority:20,conditionTarget:"raw input",dataConditionGroup:any(pred("/variant","Equals",{comparison:text("legacy")}))};const payloadSchema={...legacy,assignments:[payloadAssignment]};const rawSchema={...current,assignments:[rawAssignment]};const targetResolution=verification.resolveSchemaAssignment(event({variant:"current"},{variant:"legacy"}),url,[payloadSchema,rawSchema]);
  const archivedEvent=event({errorType:"archived"},{errorType:"archived"});const archivedSnapshot=JSON.stringify(archivedEvent);const archived=verification.validateEvent(archivedEvent,[legacyForResolution,current],"https://archive.example/legacy");const active={error_type:"active"};
  const exportText=verification.exportSchema(legacy);const restored=verification.importSchema(exportText);const persistence={restored:restored.assignments[0].dataConditionGroup.predicates.map(({propertyPath})=>propertyPath),archived:archived.schema?.name,archivedEvidence:archived.assignmentEvidence?.selectedAssignmentId,immutable:archivedSnapshot===JSON.stringify(archivedEvent),activeUnchanged:active.error_type==="active"};
  return{absent,empty,editor:editorState,reorderEvidence,persisted,duplicate,families,priority,cases,paths,target:{selected:targetResolution.assignment?.id,validationTarget:targetResolution.assignment?.target,conditionTarget:targetResolution.assignment?.conditionTarget},persistence,layout:{body:document.documentElement.scrollWidth,width:innerWidth,editor:editor.scrollWidth,conditions:conditionRoot.scrollWidth},runtimeErrors};
})()`;

export const fixturePrograms = Object.freeze({ schemaAssignmentDataConditionsRuntime, ...projectFixturePrograms, guidedRuntimeWaitHelpers, guidedDestinationOptionsRuntime, guidedNestedPropertyMergeRuntime, guidedNestedConstraintRuntime, guidedValidationRuntime, guidedSchemaPickerRuntime, guidedDraftContinuationInitialRuntime, guidedDraftContinuationRuntime, guidedDraftContinuationReloadRuntime, guidedAssignmentCoverageRuntime, liveGuidedConditionalRuleSeedRuntime, liveGuidedConditionalRuleRuntime, schemaPropertyCopyRuntime, schemaPropertyTypeEditingSeedRuntime, schemaPropertyTypeEditingRuntime, schemaPropertyTypeEditingItemRuntime, allowedValuesRuleMigrationCoverageRuntime, liveSchemaPropertyDeclarationSeedRuntime, liveSchemaPropertyDeclarationRuntime, localRulePromotionSeedRuntime, localRulePromotionAvailabilitySeedRuntime, localRulePromotionAvailabilityRuntime, localRulePromotionOpenRuntime, localRuleEditingSeedRuntime, localRuleEditingRuntime, localRuleEditingRenderedRuntime, reusableRuleSyncSeedRuntime, reusableRuleSyncRuntime, requiredRuleTypeIndependenceSeedRuntime, requiredRuleTypeIndependenceRuntime, localRulePromotionReusableOriginRuntime, localRulePromotionOriginCountRuntime, localRulePromotionInheritedSeedRuntime, localRulePromotionInheritedCountRuntime, localRulePromotionReviewRuntime, localRulePromotionPrepareConfirmRuntime, localRulePromotionFailureRuntime, localRulePromotionAfterRuntime, allowedValueExpansionSeedRuntime, allowedValueExpansionRuntime });
export const definitions = createExecutableTargetDefinitions("schema-guided", fixturePrograms, { observe:executeFixture });
