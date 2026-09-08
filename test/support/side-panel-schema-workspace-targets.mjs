import { createExecutableTargetDefinitions } from "./side-panel-browser-target-contract.mjs";
import { containmentFixturePrograms } from "./side-panel-containment-fixtures.mjs";
import { projectFixturePrograms } from "./side-panel-browser-project-fixtures.mjs";
import {guidedRuntimeWaitHelpers} from './side-panel-schema-fixture-primitives.mjs';
import {
  guidedDestinationOptionsRuntime,
  guidedValidationRuntime,
} from "./side-panel-schema-guided-lifecycle-fixtures.mjs";

async function executeFixture({ context, fixturePrograms, target }) {
  return context.executeFixture({ fixturePrograms, target });
}

const schemaPropertyRemovalRuntime = `(async () => {
  const q = (selector, root=document) => { const element = root.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const click = (root, label) => { const element = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!element) throw new Error("Missing " + label); element.click(); return element; };
  const pause = (milliseconds = 10) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  const waitFor = async (predicate, label) => { for (let attempt = 0; attempt < 400; attempt += 1) { const value = predicate(); if (value) return value; await pause(); } throw new Error("Timed out waiting for " + label); };
  const stored = () => JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")).find(({ id }) => id === "page-view");
  q("#data-layer-view-schemas").click();
  const row = Array.from(q("#schema-list").children).find(({ textContent }) => textContent.includes("Page view")); click(row, "Edit working draft");
  const tree = q("#schema-property-tree");
  const canonicalRow = (path) => q('[data-schema-property-canonical-path="' + path + '"]');
  const select = async (path) => { let current = canonicalRow(path); if (current.getAttribute("aria-current") !== "true") { q(":scope > strong", current).click(); await waitFor(() => { const replacement = document.querySelector('[data-schema-property-canonical-path="' + path + '"]'); return replacement?.getAttribute("aria-current") === "true" && replacement.querySelector("button"); }, "the selected property row " + path); current = canonicalRow(path); } return current; };
  const action = async (path, label) => { const current = await select(path); const button = Array.from(current.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!button) throw new Error("Missing " + label + " for " + path); return button; };
  const settled = async (predicate, label) => { const schemas = await __waitForDurableSchemaObservation((values) => { const page = values.find(({ id }) => id === "page-view"); return Boolean(page && predicate(page)); }, label); await waitFor(() => q("#schema-editor").getAttribute("aria-busy") !== "true", label + " presentation"); return schemas; };
  const actionPaths = Array.from(tree.querySelectorAll("[data-schema-property-canonical-path]"), ({ dataset }) => dataset.schemaPropertyCanonicalPath);
  const actions = []; for (const path of actionPaths) { const current = await select(path); actions.push({ path:current.dataset.schemaPropertyPath, actions:Array.from(current.querySelectorAll("button"), ({ textContent }) => textContent) }); }
  (await action("/inherited_id", "Exclude inherited property")).click();
  const libraryAfterExclude = await settled((page) => page.workingDraft?.inheritedRuleOverrides?.["/inherited_id"] === "disabled", "the inherited property exclusion");
  await waitFor(() => !document.querySelector('[data-schema-property-canonical-path="/inherited_id"]'), "the excluded inherited property to leave the tree");
  const excluded = { absent:!tree.querySelector('[data-schema-property-canonical-path="/inherited_id"]'), parentUnchanged:Boolean(libraryAfterExclude.find(({ id }) => id === "base").document.properties.inherited_id) };
  (await action("/debug", "Remove property")).click(); const immediateFocus=document.activeElement?.closest("[data-schema-property-canonical-path]")?.dataset.schemaPropertyPath;
  await settled((page) => !page.workingDraft?.document?.properties?.debug, "the immediate debug property removal");
  const immediate = { absent:!tree.querySelector('[data-schema-property-canonical-path="/debug"]'), feedback:q("#schema-property-removal-feedback").textContent, undo:!Array.from(document.querySelectorAll("button")).find(({ textContent }) => textContent === "Undo").hidden, currentHasDebug:Boolean(stored().document.properties.debug), draftHasDebug:Boolean(stored().workingDraft.document.properties.debug), focus:immediateFocus };
  click(document, "Undo");
  await settled((page) => Boolean(page.workingDraft?.document?.properties?.debug), "the debug property undo");
  const undone = { restored:Boolean(tree.querySelector('[data-schema-property-canonical-path="/debug"]')), definition:stored().workingDraft.document.properties.debug, order:Array.from(tree.querySelectorAll("[data-schema-property-canonical-path]")).map(({ dataset }) => dataset.schemaPropertyPath) };
  (await action("/items", "Remove property")).click(); const itemsFocus = document.activeElement?.closest("[data-schema-property-canonical-path]")?.dataset.schemaPropertyPath; await settled((page) => !page.workingDraft?.document?.properties?.items, "the items property removal"); click(document, "Undo"); await settled((page) => Boolean(page.workingDraft?.document?.properties?.items), "the items property undo");
  (await action("/debug", "Remove property")).click(); await settled((page) => !page.workingDraft?.document?.properties?.debug, "the persisted debug property removal");
  q("#save-schema").click(); const publication = q("#schema-revision-review-summary").textContent; q("#cancel-schema-revision").click();
  return { actions, excluded, immediate, undone, itemsFocus, publication, currentVersion:stored().version };
})()`;

const schemaPropertyRemovalReloadRuntime = `(async () => {
  const q = (selector, root=document) => { const element = root.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const click = (root, label) => { const element = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!element) throw new Error("Missing " + label); element.click(); return element; };
  const pause = (milliseconds = 10) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  const waitFor = async (predicate, label) => { for (let attempt = 0; attempt < 400; attempt += 1) { const value = predicate(); if (value) return value; await pause(); } throw new Error("Timed out waiting for " + label); };
  const stored = () => JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")).find(({ id }) => id === "page-view");
  q("#data-layer-view-schemas").click(); const row = Array.from(q("#schema-list").children).find(({ textContent }) => textContent.includes("Page view")); click(row, "Edit working draft");
  const tree = q("#schema-property-tree");
  const canonicalRow = (path) => q('[data-schema-property-canonical-path="' + path + '"]');
  const select = async (path) => { let current=canonicalRow(path);if(current.getAttribute("aria-current")!=="true"){q(":scope > strong",current).click();await waitFor(()=>{const replacement=document.querySelector('[data-schema-property-canonical-path="'+path+'"]');return replacement?.getAttribute("aria-current")==="true"&&replacement.querySelector("button");},"the selected property row "+path);current=canonicalRow(path);}return current; };
  const remove = async (path) => { const current=await select(path);const button=Array.from(current.querySelectorAll("button")).find(({textContent})=>textContent==="Remove property");if(!button)throw new Error("Missing Remove property for "+path);return button; };
  const settled = async (predicate,label) => { const schemas=await __waitForDurableSchemaObservation((values)=>{const page=values.find(({id})=>id==="page-view");return Boolean(page&&predicate(page));},label);await waitFor(()=>q("#schema-editor").getAttribute("aria-busy")!=="true",label+" presentation");return schemas.find(({id})=>id==="page-view"); };
  const restored = { draftAbsent:!tree.querySelector('[data-schema-property-canonical-path="/debug"]'), currentHasDebug:Boolean(stored().document.properties.debug), version:stored().version };
  (await remove("/commerce")).click();
  const dialog = q("#schema-property-removal-dialog"); const before = JSON.stringify(stored().workingDraft);
  const confirmation = { open:dialog.open, summary:q("#schema-property-removal-summary").textContent, actions:Array.from(dialog.querySelectorAll("button")).map(({ textContent }) => textContent) };
  click(dialog, "Cancel"); const cancelled = JSON.stringify(stored().workingDraft) === before;
  (await remove("/commerce")).click(); click(dialog, "Remove property");
  const after = await settled((page)=>!page.workingDraft?.document?.properties?.commerce,"the confirmed commerce subtree removal"); const reusable = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1"));
  const confirmed = { commerceAbsent:!after.workingDraft.document.properties.commerce, required:after.workingDraft.document.required, localRules:after.workingDraft.attachedRules.length, reusable:Boolean(reusable.find(({ name }) => name === "Order identifier")), currentCommerce:Boolean(after.document.properties.commerce), currentRequired:after.document.required, version:after.version };
  const model = await import("/data-layer-schema-property-removal.js");
  const origins = { type:"object", properties:{ commerce:{ type:"object", properties:{ order:{ type:"object", propertyOrigin:"manual", properties:{ id:{ type:"string", propertyOrigin:"manual" } } } } } } };
  const pruned = model.removeSchemaProperty(origins, [], "/commerce/order/id").document;
  const ancestorOutcomes = { manualRemoved:!pruned.properties.commerce.properties.order, observedRetained:Boolean(pruned.properties.commerce) };
  (await remove("/items")).click(); await settled((page)=>!page.workingDraft?.document?.properties?.items,"the final items property removal"); (await remove("/page_type")).click(); await settled((page)=>Object.keys(page.workingDraft?.document?.properties??{}).length===0,"the empty schema working draft");
  const empty = { count:Object.keys(stored().workingDraft.document.properties).length, publishBlocked:q("#save-schema").disabled, reason:q("#save-schema-reason").textContent, addAvailable:!q("#add-schema-property").disabled, focus:document.activeElement === q("#add-schema-property"), version:stored().version };
  return { restored, confirmation, cancelled, confirmed, ancestorOutcomes, empty };
})()`;

const schemaAssignmentRuntime = `(async () => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const input = (selector, value) => { const element = q(selector); element.value = value; element.dispatchEvent(new Event("input", { bubbles:true })); };
  const waitFor = async (read, description) => {
    for (let attempt = 0; attempt < 150; attempt += 1) {
      const value = read();
      if (value) return value;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    throw new Error("Timed out waiting for " + description + "; " + JSON.stringify({
      saveDisabled:q("#save-schema").disabled,
      saveReason:q("#save-schema-reason").textContent,
      revisionReviewOpen:q("#schema-revision-review").open,
      confirmDisabled:q("#confirm-schema-revision").disabled,
      schemaResult:q("#schema-result").textContent,
      schemaName:q("#schema-editor-name").value,
      propertyTree:q("#schema-property-tree").textContent,
      schemaList:q("#schema-list").textContent,
      rulePickerOpen:q("#schema-property-rule-picker").open,
      rulePicker:q("#schema-property-rule-picker").textContent,
      durableRecoveryOpen:q("#durable-storage-recovery").open,
      durableStatus:q("#durable-repository-status").textContent,
    }));
  };
  const savedSchemaAction = (label) => {
    let action = Array.from(q("#schema-list").querySelectorAll("button")).find((button) => button.textContent === label);
    if (action) return action;
    const savedBranch = Array.from(q("#schema-list").children).find(({ dataset }) => dataset.schemaGroup === "Saved schemas");
    if (savedBranch?.getAttribute("aria-expanded") === "false") savedBranch.querySelector("button")?.click();
    action = Array.from(q("#schema-list").querySelectorAll("button")).find((button) => button.textContent === label);
    return action;
  };
  const durableSchemaAction = (action, description) => new Promise((resolve, reject) => {
    let timer;
    let settleTimer;
    let pending = 0;
    let observed = false;
    const cleanup = () => {
      clearTimeout(timer);
      clearTimeout(settleTimer);
      globalThis.removeEventListener("durable-project-saving", saving);
      globalThis.removeEventListener("durable-project-saved", saved);
      globalThis.removeEventListener("durable-project-save-failed", failed);
    };
    const saving = () => { observed = true; pending += 1; };
    const saved = () => {
      pending -= 1;
      if (!observed || pending > 0) return;
      settleTimer = setTimeout(() => {
        if (pending > 0) return;
        cleanup();
        resolve();
      }, 100);
    };
    const failed = (event) => {
      cleanup();
      reject(new Error(description + " failed: " + String(event.detail?.error ?? "durable schema save failed")));
    };
    globalThis.addEventListener("durable-project-saving", saving);
    globalThis.addEventListener("durable-project-saved", saved);
    globalThis.addEventListener("durable-project-save-failed", failed);
    timer = setTimeout(() => {
      cleanup();
      reject(new Error("Timed out waiting for " + description));
    }, 5000);
    try { action(); } catch (error) { cleanup(); reject(error); }
  });
  q("#data-layer-view-schemas").click();
  if (!q("#project-transport-context").textContent.includes("No active project")) {
    await waitFor(
      () => q("#schema-result").textContent.startsWith("Loaded schema contributors for "),
      "active project schema hydration",
    );
  }
  q("#schema-subview-schemas").click();
  const schemaMasterVisible = q("#schema-master").getClientRects().length > 0 && !q("#schema-master").hidden;
  input("#schema-search", "");
  for (;;) { const remove = Array.from(q("#schema-list").querySelectorAll("button")).find((button) => button.textContent === "Delete"); if (!remove) break; remove.click(); q("#confirm-schema-delete").click(); }
  q("#create-schema").click();
  input("#schema-editor-name", "Checkout schema");
  q("#add-schema-property").click();
  input("#schema-manual-property-path", "example");
  Array.from(q("#schema-manual-property-dialog").querySelectorAll("button")).find((button) => button.textContent === "Add property").click();
  q("#save-schema").click();
  await durableSchemaAction(() => q("#confirm-schema-revision").click(), "initial schema publication");
  await waitFor(
    () => savedSchemaAction("Edit working draft"),
    "published schema to render",
  );
  q("#schema-subview-rules").click();
  q("#create-schema-rule").click();
  input("#schema-rule-name", "Known page types");
  input("#schema-rule-types", "string");
  q("#schema-rule-operator").value = "allowed-values";
  input("#schema-rule-parameters", "product,checkout");
  q("#schema-rule-severity").value = "warning";
  input("#schema-rule-message", "Use a known page type");
  input("#schema-rule-examples", "product, checkout");
  q("#save-schema-rule").click();
  const initialRuleSeverity = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1")).at(-1).severity;
  q("#schema-subview-schemas").click();
  const editWorkingDraft = await waitFor(
    () => savedSchemaAction("Edit working draft"),
    "schema working-draft action",
  );
  editWorkingDraft.click();
  q("#cancel-schema-revision").click();
  const propertyAdd = q('#schema-property-tree button[aria-label="Edit canonical rules for example"]');
  propertyAdd.click();
  const propertyMenuOpen = q("#schema-property-rule-picker").open;
  const rulePicker = q("#schema-property-rule-picker");
  Array.from(rulePicker.querySelectorAll("button")).find((button) => button.textContent === "Add rule").click();
  const ruleKind = q('[name="ruleKind"]');
  ruleKind.value = "reusable";
  ruleKind.dispatchEvent(new Event("change", { bubbles:true }));
  const reusableRule = q('[name="newRuleReusableRuleId"]');
  const reusableOption = Array.from(reusableRule.options).find((option) => option.textContent === "Known page types");
  if (!reusableOption) throw new Error("Missing Known page types in canonical reusable rule choices; picker: " + rulePicker.textContent);
  reusableRule.value = reusableOption.value;
  reusableRule.dispatchEvent(new Event("change", { bubbles:true }));
  Array.from(rulePicker.querySelectorAll("button")).filter((button) => button.textContent === "Add rule").at(-1).click();
  const canonicalRuleActions = Array.from(rulePicker.querySelectorAll('[data-rule-id] button')).map((button) => button.textContent);
  Array.from(rulePicker.querySelectorAll('[data-rule-id] button')).find((button) => button.textContent === "Remove local").click();
  const canonicalRestore = Array.from(rulePicker.querySelectorAll('[data-rule-id] button')).find((button) => button.textContent === "Restore");
  if (!canonicalRestore) throw new Error("Canonical rule removal did not expose Restore; picker: " + rulePicker.textContent);
  const reenable = canonicalRestore.textContent;
  canonicalRestore.click();
  Array.from(rulePicker.querySelectorAll("button")).find((button) => button.textContent === "Review changes").click();
  const canonicalReviewSummary = rulePicker.querySelector('[aria-label="Review changes"] p')?.textContent ?? rulePicker.textContent;
  const canonicalFocusReturn = (async () => {
    for (let attempt = 0; attempt < 200; attempt += 1) {
      if (!rulePicker.open) return document.activeElement?.getAttribute("aria-label") === "Edit canonical rules for example";
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    return false;
  })();
  await durableSchemaAction(
    () => Array.from(rulePicker.querySelectorAll("button")).find((button) => button.textContent === "Confirm changes").click(),
    "canonical reusable rule commit",
  );
  await waitFor(() => !rulePicker.open, "canonical reusable rule commit");
  const propertyReturnFocus = await canonicalFocusReturn;
  const canonicalRepository = await (await import("./data-layer-durable-project-repository.js")).openIndexedDbProjectRepository();
  const canonicalCommittedSchema = (await canonicalRepository.savedSchemas()).find(({ id }) => id === "schema:checkout-schema:1");
  if (!canonicalCommittedSchema) throw new Error("Missing durable Checkout schema after canonical reusable-rule commit");
  const canonicalCommittedProperty = Object.values(canonicalCommittedSchema.workingDraft?.canonicalSchema?.nodes ?? {}).find(({ name }) => name === "example");
  const canonicalCommittedRule = canonicalCommittedProperty?.rules.find(({ kind }) => kind === "reusable");
  const canonicalPendingChanges = canonicalCommittedSchema.workingDraft?.pendingChanges ?? [];
  const attachedSummary = Array.from(q("#schema-property-tree").querySelectorAll("summary")).find((summary) => summary.textContent === "View attached rules (1)");
  if (!attachedSummary) throw new Error("Missing attached-rules disclosure");
  attachedSummary.click();
  const attachedRules = q("#schema-property-tree details[data-attached-rules]");
  const requiredPropertyRuleActions = ["Edit", "Disable", "Remove"];
  const renderedPropertyRuleActions = Array.from(attachedRules.querySelectorAll("button")).map((button) => button.textContent);
  const propertyRuleActions = requiredPropertyRuleActions.filter((action) => renderedPropertyRuleActions.includes(action));
  const propertyStateReturnFocus = propertyReturnFocus;
  q("#schema-subview-rules").click();
  Array.from(q("#schema-rule-list").querySelectorAll("button")).filter((button) => button.textContent === "Edit").at(-1).click();
  input("#schema-rule-parameters", "product,checkout,confirmation");
  q("#schema-rule-severity").value = "error";
  q("#save-schema-rule").click();
  const ruleRevisionReview = { open:q("#schema-rule-revision-review").open, summary:q("#schema-rule-revision-review-summary").textContent };
  q("#confirm-schema-rule-revision-review").click();
  const originalRuleExportClick = HTMLAnchorElement.prototype.click;
  let ruleExportName = "";
  HTMLAnchorElement.prototype.click = function () { ruleExportName = this.download; };
  Array.from(q("#schema-rule-list").querySelectorAll("button")).find((button) => button.textContent === "Export").click();
  HTMLAnchorElement.prototype.click = originalRuleExportClick;
  q("#schema-subview-schemas").click();
  q("#save-schema").click();
  await durableSchemaAction(() => q("#confirm-schema-revision").click(), "schema revision publication");
  q("#schema-subview-assignments").click();
  q("#create-schema-assignment").click();
  input("#schema-assignment-source", "event-history");
  input("#schema-assignment-event", "page_view");
  q("#schema-assignment-target").value = "raw input";
  input("#schema-assignment-domain", "shop.example");
  input("#schema-assignment-pathname", "/order-confirmation");
  input("#schema-assignment-priority", "100");
  q("#schema-assignment-version-policy").value = "follow latest";
  q("#schema-assignment-enabled").checked = true;
  await durableSchemaAction(() => q("#save-schema-assignment").click(), "initial schema assignment save");
  const assignmentTrace = [];
  const traceAssignments = (stage) => assignmentTrace.push({ stage, rows:Array.from(document.querySelectorAll("#schema-assignment-list li > span"), ({ textContent }) => textContent), fields:{ target:q("#schema-assignment-target").value, domain:q("#schema-assignment-domain").value, pathname:q("#schema-assignment-pathname").value, priority:q("#schema-assignment-priority").value, policy:q("#schema-assignment-version-policy").value, enabled:q("#schema-assignment-enabled").checked } });
  traceAssignments("created");
  const firstRow = () => q("#schema-assignment-list li");
  const action = (label) => { const button = Array.from(firstRow().querySelectorAll("button")).find((candidate) => candidate.textContent === label); if (!button) throw new Error("Missing " + label + "; found " + Array.from(firstRow().querySelectorAll("button")).map((candidate) => candidate.textContent).join(", ")); return button; };
  const actions = Array.from(firstRow().querySelectorAll("button")).map((button) => button.textContent);
  action("Edit").click();
  input("#schema-assignment-priority", "120");
  await durableSchemaAction(() => q("#save-schema-assignment").click(), "schema assignment edit");
  traceAssignments("edited");
  await durableSchemaAction(() => action("Duplicate").click(), "schema assignment duplicate");
  traceAssignments("duplicated");
  await durableSchemaAction(() => action("Disable").click(), "schema assignment disable");
  traceAssignments("disabled");
  const duplicateCount = document.querySelectorAll("#schema-assignment-list li").length;
  const copyRow = Array.from(document.querySelectorAll("#schema-assignment-list li")).find((row) => row.querySelector("span")?.textContent.startsWith("Checkout schema automatic copy"));
  const deleteCopy = copyRow && Array.from(copyRow.querySelectorAll("button")).find((button) => button.textContent === "Delete");
  if (!deleteCopy) throw new Error("Missing duplicate assignment delete action");
  await durableSchemaAction(() => deleteCopy.click(), "schema assignment copy deletion");
  traceAssignments("copy deleted");
  q("#schema-subview-schemas").click();
  Array.from(q("#schema-list").querySelectorAll("button")).find((button) => button.textContent === "Edit working draft").click();
  const revisionReview = { open:q("#schema-revision-review").open, summary:q("#schema-revision-review-summary").textContent, status:q("#schema-editor-status").textContent };
  q("#cancel-schema-revision").click();
  q("#create-schema").click();
  input("#schema-editor-name", "Unsaved schema");
  q("#close-schema-editor").click();
  const closeReview = { open:q("#close-schema-editor-review").open, summary:q("#schema-close-review-summary").textContent, result:q("#schema-result").textContent };
  q("#discard-schema-draft").click();
  const persistedSchemas = (await canonicalRepository.savedSchemaRecords()).map(({ schema }) => schema);
  const persistedRules = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1"));
  const latestRule = persistedRules.at(-1);
  const persistedSchema = persistedSchemas.find(({ id }) => id === "schema:checkout-schema:1");
  if (!persistedSchema) throw new Error("Missing durable Checkout schema after canonical rule and assignment edits");
  const storedPropertyRule = persistedSchema.attachedRules?.find((rule) => rule.propertyPath === "/example");
  return {
    fields:["#schema-assignment-source", "#schema-assignment-event", "#schema-assignment-target", "#schema-assignment-domain", "#schema-assignment-pathname", "#schema-assignment-priority", "#schema-assignment-schema", "#schema-assignment-version-policy", "#schema-assignment-enabled"].map((selector) => ({ selector, required:q(selector).required })),
    schemaMasterVisible,
    actions,
    duplicateCount,
    revisionReview,
    closeReview,
    rows:Array.from(document.querySelectorAll("#schema-assignment-list li > span")).map((row) => row.textContent),
    assignment:{ ...persistedSchema.assignments[0], pathnameCondition:persistedSchema.assignments[0].pathnameCondition ?? null },
    assignmentTrace,
    propertyRule:{
      menuOpen:propertyMenuOpen,
      returnFocus:propertyReturnFocus,
      stateReturnFocus:propertyStateReturnFocus,
      summary:attachedSummary.textContent,
      actions:propertyRuleActions,
      revisionReview:ruleRevisionReview,
      ruleExportName,
      canonical:{
        actions:canonicalRuleActions,
        restore:reenable,
        review:canonicalReviewSummary,
        rule:{ kind:canonicalCommittedRule?.kind, reusableRuleId:canonicalCommittedRule?.reusableRuleId, selectedReusableRuleId:reusableOption.value, selectedReusableRuleName:reusableOption.textContent },
        pendingChanges:canonicalPendingChanges,
      },
    },
    storedPropertyRule:{ attached:Boolean(storedPropertyRule), version:storedPropertyRule?.version, enabled:storedPropertyRule?.enabled, propertyPath:storedPropertyRule?.propertyPath },
    rule:{ initialSeverity:initialRuleSeverity, name:latestRule.name, version:latestRule.version, enabled:latestRule.enabled, operator:latestRule.operator, allowedValues:latestRule.allowedValues, severity:latestRule.severity, message:latestRule.message, examples:latestRule.examples, attachments:latestRule.attachments },
  };
})()`;

const schemaRevisionLifecycleRuntime = `(async () => {
  const lifecycle = await import("/data-layer-schema-verification.js");
  const base = {
    ...lifecycle.createSchema("Product listing", 3, { type:"object", properties:{ product_id:{ type:"string" } } }),
    id:"schema-product-listing",
    assignments:[{ id:"assignment:product", name:"Product pages", schemaId:"schema-product-listing", schemaVersion:3, sourceId:"history", eventName:"pageview", target:"payload", versionPolicy:"pinned", enabled:true }],
  };
  const pageType = lifecycle.updateSchemaWorkingDraft(base, { document:{ type:"object", properties:{ product_id:{ type:"string" }, page_type:{ type:"string" } } } }, "Add page_type rule");
  const pageName = lifecycle.updateSchemaWorkingDraft(pageType, { document:{ type:"object", properties:{ product_id:{ type:"string" }, page_type:{ type:"string" }, page_name:{ type:"string" } } } }, "Add page_name rule");
  const pendingAssignment = { id:"assignment:checkout", schemaId:base.id, sourceId:"history", eventName:"checkout", target:"payload", versionPolicy:"follow latest", enabled:true };
  const ready = lifecycle.updateSchemaWorkingDraft(pageName, { assignments:[...pageName.workingDraft.assignments, pendingAssignment] }, "Add Checkout assignment");
  const storageKey = "schema-revision-lifecycle-browser-fixture";
  const previous = localStorage.getItem(storageKey);
  localStorage.setItem(storageKey, lifecycle.serializeSchemaLibrary([ready]));
  const reloaded = lifecycle.restoreSchemaLibrary(localStorage.getItem(storageKey))[0];
  const pendingResolution = lifecycle.resolveSchemaAssignment({ sourceId:"history", eventName:"checkout" }, "https://shop.example/checkout", [reloaded]);
  const published = lifecycle.publishSchemaWorkingDraft(reloaded);
  const pinned = lifecycle.resolveSchemaAssignment({ sourceId:"history", eventName:"pageview" }, "https://shop.example/products", [published]);
  const latest = lifecycle.resolveSchemaAssignment({ sourceId:"history", eventName:"pageview" }, "https://shop.example/products", [{ ...published, assignments:[{ ...published.assignments[0], versionPolicy:"follow latest" }] }]);
  const restored = lifecycle.restoreSchemaRevisionDraft(published, 3);
  const duplicate = lifecycle.duplicateSchemaRevision(published, 3);
  const legacy = [1, 2, 3, 4].map((version) => ({
    ...lifecycle.createSchema("Product listing", version, { type:"object", properties:{ ["revision_" + version]:{ type:"string" } } }),
    assignments:version === 3 ? [{ id:"legacy-pinned", schemaId:"schema:product-listing:" + version, sourceId:"history", eventName:"pageview", target:"payload", versionPolicy:"pinned", enabled:true }] : version === 4 ? [{ id:"legacy-latest", schemaId:"schema:product-listing:" + version, sourceId:"history", eventName:"purchase", target:"payload", versionPolicy:"follow latest", enabled:true }] : [],
  }));
  const migrated = lifecycle.migrateSchemaLibrary(legacy);
  if (previous === null) localStorage.removeItem(storageKey); else localStorage.setItem(storageKey, previous);
  return {
    workingDraft:{ identity:reloaded.id, current:reloaded.version, base:reloaded.workingDraft.baseVersion, source:reloaded.workingDraft.sourceVersion, twoPending:pageName.workingDraft.pendingChanges, pending:reloaded.workingDraft.pendingChanges, properties:Object.keys(reloaded.workingDraft.document.properties), durable:true, currentProperties:Object.keys(reloaded.document.properties), activeCheckout:Boolean(pendingResolution.schema), sameIdentity:pageType.id === pageName.id },
    publication:{ identity:published.id, current:published.version, history:lifecycle.schemaRevisionChoices(published), draftCleared:!published.workingDraft, properties:Object.keys(published.document.properties), checkoutRevision:lifecycle.resolveSchemaAssignment({ sourceId:"history", eventName:"checkout" }, "https://shop.example/checkout", [published]).schema.version, choices:lifecycle.assignableSchemas([published]).map(({ name }) => name) },
    policies:{ pinned:pinned.schema.version, latest:latest.schema.version, recorded:[pinned.schema.version, latest.schema.version] },
    history:{ choices:lifecycle.schemaRevisionChoices(published), selected:lifecycle.schemaRevision(published, 3).version, duplicate:{ name:duplicate.name, published:duplicate.published, assignable:lifecycle.assignableSchemas([duplicate]).length }, restored:{ current:restored.version, source:restored.workingDraft.sourceVersion, pending:restored.workingDraft.pendingChanges, discardCurrent:lifecycle.discardSchemaWorkingDraft(restored).version } },
    migration:{ count:migrated.length, identity:migrated[0].id, current:migrated[0].version, history:lifecycle.schemaRevisionChoices(migrated[0]), assignments:migrated[0].assignments.map(({ schemaId, schemaVersion, versionPolicy }) => ({ schemaId, schemaVersion:schemaVersion ?? null, versionPolicy })) },
  };
})()`;

const schemaPropertyRulePickerRuntime = `(async () => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const click = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  q("#data-layer-view-schemas").click();
  click(q("#schema-list"), "Edit working draft");
  const trigger = q('#schema-property-tree button[aria-label="Add rule for page_type"]');
  const editorBefore = q("#schema-editor").getBoundingClientRect();
  const closed = { label:trigger.textContent, pickerAbsent:!q("#schema-property-rule-picker").open, inlineResults:!q("#schema-property-tree").querySelector("#schema-property-rule-results"), expandedMenu:!q("#schema-property-tree").querySelector("details[data-rule-menu]") };
  trigger.click();
  const dialog = q("#schema-property-rule-picker");
  const results = () => q("#schema-property-rule-results");
  const opened = { heading:q("#schema-property-rule-picker-heading").textContent, searchFocused:document.activeElement === q("#schema-property-rule-search"), bounded:dialog.getBoundingClientRect().height <= innerHeight - 8, scrolls:results().scrollHeight >= results().clientHeight, modal:dialog.matches(":modal"), backgroundExcluded:q("#schema-editor").matches(":modal") === false };
  const input = (value) => { const search = q("#schema-property-rule-search"); search.value = value; search.dispatchEvent(new Event("input", { bubbles:true })); return Array.from(document.querySelector('[aria-label="Attach from Rule Library"]')?.querySelectorAll("button") ?? []).map(({ textContent }) => textContent); };
  const searches = Object.fromEntries([["Approved pages","rule name"],["allowed values","operator"],["checkout","parameters"],["public pages","description"],["string","applicable type"],["version 2","version"]].map(([query, metadata]) => [metadata, input(query)]));
  input("");
  const groups = Array.from(results().querySelectorAll(":scope > section > h5")).map(({ textContent }) => textContent);
  const metadata = Array.from(results().querySelectorAll("article p")).map(({ textContent }) => textContent);
  click(results(), "Regular expression");
  const builtInConfiguration = q("#schema-local-rule-configuration").textContent;
  click(dialog, "Cancel");
  trigger.click();
  click(q("#schema-property-rule-picker"), "Approved pages version 2");
  const stored = (await __waitForDurableSchemaObservation(([schema])=>schema?.workingDraft?.attachedRules?.some(({id,propertyPath})=>id==="rule:approved"&&propertyPath==="/page_type"),"the Approved pages working-draft attachment"))[0];
  const attached = { pickerClosed:!q("#schema-property-rule-picker").open, focusReturned:document.activeElement?.getAttribute("aria-label") === "Add rule for page_type", activeCount:q('#schema-property-tree [data-schema-property-path="page_type"] .schema-property-active-rule-count').textContent, draftRules:stored.workingDraft.attachedRules.filter(({ id, propertyPath }) => id === "rule:approved" && propertyPath === "/page_type").length, currentRules:(stored.attachedRules ?? []).length, currentVersion:stored.version };
  const triggerAfter = q('#schema-property-tree button[aria-label="Add rule for page_type"]'); triggerAfter.click();
  const already = Array.from(q("#schema-property-rule-picker").querySelectorAll("button")).find(({ textContent }) => textContent.includes("Approved pages version 2"));
  const beforeEmpty = localStorage.getItem("my-chrome-utilities.schema-library.v1");
  input("missing-rule");
  const empty = { message:q("#schema-property-rule-empty").textContent, clearAvailable:Array.from(dialog.querySelectorAll("button")).some(({ textContent }) => textContent === "Clear search") };
  click(dialog, "Clear search");
  empty.restored = results().querySelectorAll("article").length > 1; empty.unchanged = beforeEmpty === localStorage.getItem("my-chrome-utilities.schema-library.v1");
  const first = results().querySelector("button:not(:disabled)"); q("#schema-property-rule-search").focus(); q("#schema-property-rule-search").dispatchEvent(new KeyboardEvent("keydown", { key:"ArrowDown", bubbles:true })); document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key:"Enter", bubbles:true }));
  const keyboard = { selected:first?.textContent, configured:Boolean(q("#schema-local-rule-configuration")) };
  dialog.dispatchEvent(new Event("cancel", { cancelable:true }));
  const editorAfter = q("#schema-editor").getBoundingClientRect(); keyboard.escapeClosed = !dialog.open; keyboard.layoutUnchanged = editorBefore.width === editorAfter.width && editorBefore.left === editorAfter.left;
  const model = await import("/data-layer-schema-property-rule-picker.js");
  const availability = Object.fromEntries([["string","Required"],["string","Exact value"],["string","Regular expression"],["string","Text length"],["string","Digits only"],["number","Numeric range"],["array","Item count"],["number","Regular expression"],["object","Allowed values"]].map(([type, rule]) => [type + ":" + rule, model.ruleTypeAvailability(type, rule)]));
  const openConfiguration = (path, rule) => { q('#schema-property-tree button[aria-label="Add rule for ' + path + '"]').click(); click(dialog, rule); return q("#schema-local-rule-configuration"); };
  const parameterDescription = (rule) => {
    const parameters = q("#schema-local-rule-parameters");
    if (rule === "Required" || rule === "Digits only") return parameters.textContent.includes("No parameter controls") && parameters.querySelectorAll("input, select").length === 0 ? "no parameter controls" : "unexpected controls";
    if (rule === "Exact value") return parameters.querySelector('label[for="schema-local-rule-exactValue"]')?.textContent === "Exact value" && q("#schema-local-rule-exactValue").type === "text" ? "one type-aware Exact value field" : "missing Exact value";
    if (rule === "Allowed values") return parameters.querySelector("#schema-local-rule-allowed-values") && q("#schema-local-rule-allowed-value-1").type === "text" ? "repeatable type-aware value fields" : "missing allowed values";
    if (rule === "Regular expression") return parameters.querySelector('label[for="schema-local-rule-pattern"]')?.textContent === "Pattern" ? "Pattern" : "missing Pattern";
    if (rule === "Text length") { const comparison=q("#schema-local-rule-comparison"),limit=q("#schema-local-rule-limit");return comparison.options.length===6&&limit.min==="0"&&limit.step==="1"?"Comparison and non-negative Limit":"invalid cardinality controls"; }
    if (rule === "Numeric range") return q("#schema-local-rule-minimum").type === "number" && q("#schema-local-rule-maximum").type === "number" ? "optional Minimum and Maximum" : "missing range";
    const comparison=q("#schema-local-rule-comparison"),limit=q("#schema-local-rule-limit");return comparison.options.length===6&&limit.min==="0"&&limit.step==="1"?"Comparison and non-negative Limit":"invalid cardinality controls";
  };
  const configurationControls = {};
  let configurationCommon;
  for (const [path, type, rule] of [["page_type","string","Required"],["page_type","string","Exact value"],["page_type","string","Allowed values"],["page_type","string","Regular expression"],["page_type","string","Text length"],["page_type","string","Digits only"],["revenue","number","Numeric range"],["items","array","Item count"]]) {
    const form = openConfiguration(path, rule); configurationControls[type + ":" + rule] = parameterDescription(rule);
    if (!configurationCommon) configurationCommon = {
      severity:Boolean(q("#schema-local-rule-severity")), message:q("#schema-local-rule-message").previousElementSibling.textContent,
      reusable:q("#schema-local-rule-reusable").parentElement.textContent.trim(), reusableDefault:q("#schema-local-rule-reusable").checked,
      actions:["Create rule", "Back to rule choices", "Cancel"].every((label) => Array.from(form.querySelectorAll("button")).some(({ textContent }) => textContent === label)),
      readable:form.scrollWidth <= dialog.clientWidth && dialog.getBoundingClientRect().width <= innerWidth,
    };
    click(form, "Back to rule choices"); click(dialog, "Cancel");
  }
  const validationDrafts = [
    ["Exact value:no value", model.createRuleConfiguration("Exact value", "string")],
    ["Regular expression:malformed pattern [", { ...model.createRuleConfiguration("Regular expression", "string"), pattern:"[" }],
    ["Text length:comparison <= and limit -1", { ...model.createRuleConfiguration("Text length", "string"), comparison:"<=", limit:"-1" }],
    ["Numeric range:neither boundary", model.createRuleConfiguration("Numeric range", "number")],
    ["Numeric range:minimum 10 and maximum 5", { ...model.createRuleConfiguration("Numeric range", "number"), minimum:"10", maximum:"5" }],
    ["Item count:comparison >= and limit 1.5", { ...model.createRuleConfiguration("Item count", "array"), comparison:">=", limit:"1.5" }],
  ];
  const validations = Object.fromEntries(validationDrafts.map(([key, draft]) => { const result = model.validateRuleConfiguration(draft); return [key, { creationResult:result.ready ? "available" : "blocked", assistance:result.assistance }]; }));
  const setValue = (selector, value, eventName = "input") => { const element = q(selector); element.value = value; element.dispatchEvent(new Event(eventName, { bubbles:true })); return element; };
  openConfiguration("product.sku", "Allowed values");
  const allowedValues = { initial:{ blocked:q("#schema-local-rule-configuration button[type=submit]").disabled, assistance:q("#schema-local-rule-assistance").textContent } };
  setValue("#schema-local-rule-allowed-value-1", "ABC-1"); click(dialog, "Add another value"); setValue("#schema-local-rule-allowed-value-2", "XYZ-2");
  const allowedInputs = Array.from(dialog.querySelectorAll("#schema-local-rule-allowed-values input"));
  allowedValues.entered = { values:allowedInputs.map(({ value }) => value), editable:allowedInputs.every(({ disabled }) => !disabled), removable:dialog.querySelectorAll("#schema-local-rule-allowed-values button").length === 3, createAvailable:!q("#schema-local-rule-configuration button[type=submit]").disabled };
  setValue("#schema-local-rule-severity", "warning", "change"); setValue("#schema-local-rule-message", "Use an approved SKU");
  q("#schema-local-rule-reusable").checked = true; q("#schema-local-rule-reusable").dispatchEvent(new Event("change", { bubbles:true }));
  const reusableToggle = { checked:{ nameRequired:q("#schema-local-rule-name").required, description:Boolean(q("#schema-local-rule-description")), explanation:q("#schema-local-rule-reusable-explanation").textContent, blankBlocked:q("#schema-local-rule-configuration button[type=submit]").disabled } };
  q("#schema-local-rule-reusable").checked = false; q("#schema-local-rule-reusable").dispatchEvent(new Event("change", { bubbles:true }));
  reusableToggle.unchecked = { fieldsHidden:!dialog.querySelector("#schema-local-rule-name") && !dialog.querySelector("#schema-local-rule-description"), values:Array.from(dialog.querySelectorAll("#schema-local-rule-allowed-values input")).map(({ value }) => value), severity:q("#schema-local-rule-severity").value, message:q("#schema-local-rule-message").value };
  const libraryBeforeLocal = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1")).length;
  click(dialog, "Create rule");
  let storedAfterLocal = (await __waitForDurableSchemaObservation(([schema])=>schema?.workingDraft?.attachedRules?.some(({id,propertyPath})=>id.startsWith("local-rule:")&&propertyPath==="/product/sku"),"the local product.sku rule"))[0];
  const localRules = storedAfterLocal.workingDraft.attachedRules.filter(({ id, propertyPath }) => id.startsWith("local-rule:") && propertyPath === "/product/sku");
  const localCreation = {
    count:localRules.length, operator:localRules[0]?.operator, allowedValues:localRules[0]?.allowedValues, parameters:localRules[0]?.parameters, severity:localRules[0]?.severity, message:localRules[0]?.message,
    activeCount:q('#schema-property-tree [data-schema-property-path="product.sku"] .schema-property-active-rule-count').textContent,
    libraryUnchanged:JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1")).length === libraryBeforeLocal,
    currentRules:(storedAfterLocal.attachedRules ?? []).length, currentVersion:storedAfterLocal.version,
    closed:!dialog.open, focusReturned:document.activeElement?.getAttribute("aria-label") === "Add rule for product.sku",
  };
  openConfiguration("product.sku", "Allowed values"); setValue("#schema-local-rule-allowed-value-1", "ABC-1"); click(dialog, "Add another value"); setValue("#schema-local-rule-allowed-value-2", "XYZ-2");
  setValue("#schema-local-rule-severity", "warning", "change"); setValue("#schema-local-rule-message", "Use an approved SKU");
  q("#schema-local-rule-reusable").checked = true; q("#schema-local-rule-reusable").dispatchEvent(new Event("change", { bubbles:true }));
  setValue("#schema-local-rule-name", "Approved product SKUs"); setValue("#schema-local-rule-description", "SKUs accepted by fulfilment"); click(dialog, "Create rule");
  const libraryAfterReusable = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1"));
  const approved = libraryAfterReusable.filter(({ name }) => name === "Approved product SKUs"); storedAfterLocal = (await __waitForDurableSchemaObservation(([schema])=>schema?.workingDraft?.attachedRules?.some(({id,propertyPath})=>id===approved[0]?.id&&propertyPath==="/product/sku"),"the reusable Approved product SKUs working-draft attachment"))[0];
  const approvedAttachments = storedAfterLocal.workingDraft.attachedRules.filter(({ id, propertyPath }) => id === approved[0]?.id && propertyPath === "/product/sku");
  const reusableCreation = {
    libraryCount:approved.length, version:approved[0]?.version, type:approved[0]?.applicableType, attachmentCount:approvedAttachments.length,
    sameIdentity:approvedAttachments[0]?.id === approved[0]?.id, localCount:storedAfterLocal.workingDraft.attachedRules.filter(({ id, propertyPath }) => id.startsWith("local-rule:") && propertyPath === "/product/sku").length,
    details:{ allowedValues:approved[0]?.allowedValues, parameters:approved[0]?.parameters, severity:approved[0]?.severity, message:approved[0]?.message, description:approved[0]?.description },
    closed:!dialog.open, focusReturned:document.activeElement?.getAttribute("aria-label") === "Add rule for product.sku",
  };
  const beforeNavigation = { schemas:localStorage.getItem("my-chrome-utilities.schema-library.v1"), rules:localStorage.getItem("my-chrome-utilities.schema-rule-library.v1") };
  openConfiguration("product.sku", "Allowed values"); setValue("#schema-local-rule-allowed-value-1", "partial"); click(dialog, "Back to rule choices");
  const navigation = { back:{ choices:Array.from(dialog.querySelectorAll('[aria-label="Create a rule"] button')).map(({ textContent }) => textContent), heading:q("#schema-property-rule-picker-heading").textContent } };
  click(dialog, "Allowed values"); setValue("#schema-local-rule-allowed-value-1", "partial"); click(dialog, "Cancel");
  navigation.cancel = { closed:!dialog.open, focusReturned:document.activeElement?.getAttribute("aria-label") === "Add rule for product.sku" };
  navigation.unchanged = beforeNavigation.schemas === localStorage.getItem("my-chrome-utilities.schema-library.v1") && beforeNavigation.rules === localStorage.getItem("my-chrome-utilities.schema-rule-library.v1");
  return { closed, opened, availability, searches, groups, metadata, builtInConfiguration, attached, already:{ disabled:already?.disabled, label:already?.textContent }, empty, keyboard, configurationControls, configurationCommon, validations, allowedValues, reusableToggle, localCreation, reusableCreation, navigation };
})()`;

const schemaManualPropertyRuntime = `(async () => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const pause = (milliseconds = 10) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  const waitFor = async (predicate, label) => { for (let attempt = 0; attempt < 400; attempt += 1) { const value = predicate(); if (value) return value; await pause(); } throw new Error("Timed out waiting for " + label); };
  const canonicalRow = (path) => q('#schema-property-tree [data-schema-property-canonical-path="' + path + '"]');
  const click = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  const input = (selector, value, eventName = "input") => { const element = q(selector); element.value = value; element.dispatchEvent(new Event(eventName, { bubbles:true })); };
  q("#data-layer-view-schemas").click();
  const pageViewRow = Array.from(q("#schema-list").children).find(({ textContent }) => textContent.includes("Page view"));
  click(pageViewRow, "Edit working draft");
  const addProperty = q("#add-schema-property");
  const tree = q("#schema-property-tree");
  const initial = {
    addProperty:addProperty.textContent,
    aboveTree:Boolean(addProperty.compareDocumentPosition(tree) & Node.DOCUMENT_POSITION_FOLLOWING),
    noGlobalValidationRule:!Array.from(q("#schema-editor").querySelectorAll("button")).some(({ textContent }) => textContent === "Add validation rule"),
    rowRule:Array.from(tree.querySelectorAll("button")).some(({ textContent }) => textContent === "Add rule"),
  };
  addProperty.click();
  const dialog = q("#schema-manual-property-dialog");
  const opened = {
    open:dialog.open,
    pathFocused:document.activeElement === q("#schema-manual-property-path"),
    types:Array.from(q("#schema-manual-property-type").options).map(({ value }) => value),
    arrayTypeHidden:q("#schema-manual-array-item-type").parentElement.hidden,
    actions:Array.from(dialog.querySelectorAll("button")).map(({ textContent }) => textContent),
  };
  const setForm = (path, type = "string", itemType = "") => {
    input("#schema-manual-property-path", path);
    input("#schema-manual-property-type", type, "change");
    if (type === "array") input("#schema-manual-array-item-type", itemType, "change");
    return { preview:q("#schema-manual-property-preview").textContent, assistance:q("#schema-manual-property-assistance").textContent, blocked:q('#schema-manual-property-dialog button[type="submit"]').disabled };
  };
  const pathPreviews = { page_category:setForm("page_category"), "commerce.order.id":setForm("commerce.order.id") };
  const manualModel = await import("/data-layer-schema-manual-property.js");
  const baseDocument = { type:"object", properties:{ page_type:{ type:"string" } } };
  const inheritedDocument = { type:"object", properties:{ page_name:{ type:"string" } } };
  const validationDefinitions = [
    ["empty path", baseDocument, { path:"", type:"string" }],
    ["commerce..id as string", baseDocument, { path:"commerce..id", type:"string" }],
    ["existing page_type as string", baseDocument, { path:"page_type", type:"string" }],
    ["commerce.order under string commerce", { type:"object", properties:{ commerce:{ type:"string" } } }, { path:"commerce.order", type:"string" }],
    ["inherited page_name as string", baseDocument, { path:"page_name", type:"string" }],
    ["items as array without item type", baseDocument, { path:"items", type:"array" }],
  ];
  const validation = Object.fromEntries(validationDefinitions.map(([name, document, definition]) => {
    const inspected = manualModel.inspectManualProperty(document, [inheritedDocument], definition);
    return [name, { result:inspected.result === "ready" ? "added" : "blocked", assistance:inspected.assistance ?? "Ready to add" }];
  }));
  const arrayItems = {};
  for (const itemType of ["string", "number", "boolean", "object"]) {
    const state = setForm("items", "array", itemType); arrayItems[itemType] = { preview:state.preview, canAdd:!state.blocked };
  }
  click(dialog, "Cancel");
  addProperty.click(); setForm("page_type");
  const beforeDuplicate = localStorage.getItem("my-chrome-utilities.schema-library.v1");
  click(dialog, "Go to existing property page_type");
  const pageTypeRow = canonicalRow("/page_type");
  const duplicate = { closed:!dialog.open, unchanged:beforeDuplicate === localStorage.getItem("my-chrome-utilities.schema-library.v1"), selected:pageTypeRow.getAttribute("aria-current") === "true", visible:pageTypeRow.getClientRects().length > 0, focused:document.activeElement?.getAttribute("aria-label") === "Add rule for page_type" };
  addProperty.click(); setForm("unsaved_property");
  const beforeCancel = localStorage.getItem("my-chrome-utilities.schema-library.v1"); click(dialog, "Cancel");
  const cancelled = { closed:!dialog.open, unchanged:beforeCancel === localStorage.getItem("my-chrome-utilities.schema-library.v1"), focusReturned:document.activeElement === addProperty };
  addProperty.click(); setForm("commerce.order.id", "string"); click(dialog, "Add property");
  const stored = await __waitForDurableSchemaObservation((schemas) => schemas.some(({ name, workingDraft }) => name === "Page view" && workingDraft?.document?.properties?.commerce?.properties?.order?.properties?.id?.type === "string"), "the manually added /commerce/order/id property");
  await waitFor(() => {
    const row = document.querySelector('#schema-property-tree [data-schema-property-canonical-path="/commerce/order/id"]');
    return row?.getAttribute("aria-current") === "true" && row.querySelector('button[aria-label="Add rule for commerce.order.id"]');
  }, "the selected canonical /commerce/order/id row");
  await waitFor(() => !dialog.open, "the completed manual-property dialog close");
  const pageView = stored.find(({ name }) => name === "Page view");
  const manualRow = canonicalRow("/commerce/order/id");
  const currentHasCommerce = Boolean(pageView.document.properties?.commerce);
  const workingLeaf = pageView.workingDraft.document.properties.commerce.properties.order.properties.id;
  const added = {
    closed:!dialog.open,
    missingObjects:[pageView.workingDraft.document.properties.commerce.type, pageView.workingDraft.document.properties.commerce.properties.order.type],
    leaf:workingLeaf,
    selected:manualRow.getAttribute("aria-current") === "true",
    metadata:manualRow.querySelector(".schema-property-metadata").textContent,
    activeCount:manualRow.querySelector(".schema-property-active-rule-count").textContent,
    addRule:Boolean(manualRow.querySelector('button[aria-label="Add rule for commerce.order.id"]')),
    currentVersion:pageView.version,
    currentUnchanged:!currentHasCommerce,
  };
  const schemaModel = await import("/data-layer-schema-verification.js");
  const draftSchema = { ...pageView, document:pageView.workingDraft.document, attachedRules:pageView.workingDraft.attachedRules ?? [] };
  const preview = schemaModel.validateWithSchema({ sourceId:"manual", eventName:"page_view", payload:{ page_type:"home", commerce:{ order:{ id:42 } } }, rawInput:[] }, draftSchema, [stored.find(({ name }) => name === "Base schema"), draftSchema]);
  const model = { pathType:workingLeaf.type, attachedRules:(pageView.workingDraft.attachedRules ?? []).length, issueCount:preview.issues.length, expected:preview.issues[0]?.expected, issuePath:preview.issues[0]?.instancePath };
  return { initial, opened, pathPreviews, validation, arrayItems, duplicate, cancelled, added, model };
})()`;

const schemaManualPropertyReloadRuntime = `(async () => {
  const q = (selector, root=document) => { const element = root.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const pause = () => new Promise((resolve) => setTimeout(resolve, 10));
  const waitFor = async (predicate, label) => { for (let attempt=0;attempt<400;attempt+=1){const value=predicate();if(value)return value;await pause();}throw new Error("Timed out waiting for "+label); };
  q("#data-layer-view-schemas").click();
  const pageViewRow = Array.from(q("#schema-list").children).find(({ textContent }) => textContent.includes("Page view"));
  Array.from(pageViewRow.querySelectorAll("button")).find(({ textContent }) => textContent === "Edit working draft").click();
  const stored = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")).find(({ name }) => name === "Page view");
  let row = q('#schema-property-tree [data-schema-property-canonical-path="/commerce/order/id"]');if(row.getAttribute("aria-current")!=="true"){q(":scope > strong",row).click();await waitFor(()=>document.querySelector('[data-schema-property-canonical-path="/commerce/order/id"]')?.getAttribute("aria-current")==="true","the reloaded manual property selection");row=q('#schema-property-tree [data-schema-property-canonical-path="/commerce/order/id"]');}
  return { present:true, metadata:row.querySelector(".schema-property-metadata").textContent, activeCount:row.querySelector(".schema-property-active-rule-count").textContent, currentVersion:stored.version, currentUnchanged:!stored.document.properties?.commerce };
})()`;

const schemaContainerChildRuntime = `(async () => {
  const q = (selector, root=document) => { const element = root.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const pause = (milliseconds = 10) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  const waitFor = async (predicate, label) => { for (let attempt = 0; attempt < 400; attempt += 1) { const value = predicate(); if (value) return value; await pause(); } throw new Error("Timed out waiting for " + label); };
  const row = (path) => q('#schema-property-tree [data-schema-property-canonical-path="' + path + '"]');
  const select = async (path) => { let current=row(path);if(current.getAttribute("aria-current")!=="true"){q(":scope > strong",current).click();await waitFor(()=>{const replacement=document.querySelector('[data-schema-property-canonical-path="'+path+'"]');return replacement?.getAttribute("aria-current")==="true"&&replacement.querySelector("button");},"the selected property row "+path);current=row(path);}return current; };
  const action = async (path, label) => { const button = (await select(path)).querySelector('button[aria-label="' + label + ' on ' + path + '"]'); if (!button) throw new Error("Missing " + label + " on " + path); return button; };
  const click = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  const set = (selector, value, eventName = "input") => { const element = q(selector); element.value = value; element.dispatchEvent(new Event(eventName, { bubbles:true })); };
  const propertyAt = (schema, path) => path.split("/").filter(Boolean).reduce((property, segment) => segment === "*" ? property?.items : property?.properties?.[segment], schema.workingDraft?.document);
  const settled = async (predicate, label) => { const schemas=await __waitForDurableSchemaObservation((values)=>{const page=values.find(({id})=>id==="schema-page-view");return Boolean(page&&predicate(page));},label);await waitFor(()=>q("#schema-editor").getAttribute("aria-busy")!=="true",label+" presentation");return schemas.find(({id})=>id==="schema-page-view"); };
  const addContextual = async (path, label, name, type, itemType = "") => {
    (await action(path, label)).click(); set("#schema-manual-property-child-name", name); set("#schema-manual-property-type", type, "change");
    if (type === "array") set("#schema-manual-array-item-type", itemType, "change");
    click(q("#schema-manual-property-dialog"), "Add property");
    const target=path+(label==="Add item property"?"/*/":"/")+name;return settled((schema)=>Boolean(propertyAt(schema,target)),"the contextual property "+target);
  };
  const stored = () => JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")).find(({ name }) => name === "Page view");
  q("#data-layer-view-schemas").click();
  const libraryRow = Array.from(q("#schema-list").children).find(({ textContent }) => textContent.includes("Page view")); click(libraryRow, "Edit working draft");
  const initial = {
    commerce:(await action("/commerce", "Add child property")).textContent,
    products:(await action("/products", "Add item property")).textContent,
    item:(await action("/products/*", "Add child property")).textContent,
    leaf:!(await select("/products/*/product_name")).querySelector(".schema-property-add-child"),
    tags:!(await select("/tags")).querySelector(".schema-property-add-child"),
    root:q("#add-schema-property").textContent,
  };
  const productTrigger = await action("/products", "Add item property"); productTrigger.click();
  const dialog = q("#schema-manual-property-dialog");
  const context = {
    open:dialog.open,
    focused:document.activeElement === q("#schema-manual-property-child-name"),
    parent:q("#schema-manual-property-parent-context").textContent,
    noEditablePath:q("#schema-manual-property-path").hidden,
  };
  const duplicateBefore = localStorage.getItem("my-chrome-utilities.schema-library.v1");
  set("#schema-manual-property-child-name", "product_name");
  const duplicate = {
    blocked:dialog.querySelector('button[type="submit"]').disabled,
    assistance:q("#schema-manual-property-assistance").textContent,
    recovery:click(dialog, "Go to existing property /products/*/product_name").textContent,
    unchanged:duplicateBefore === localStorage.getItem("my-chrome-utilities.schema-library.v1"),
  };
  const cancelTrigger = await action("/products", "Add item property"); cancelTrigger.click(); set("#schema-manual-property-child-name", "product_name");
  click(dialog, "Cancel"); duplicate.cancelFocus = document.activeElement === cancelTrigger;
  const publishedBefore = JSON.stringify(stored().document);
  const afterProduct = await addContextual("/products", "Add item property", "product_id", "number");
  const productNameBefore = JSON.stringify(afterProduct.workingDraft.document.properties.products.items.properties.product_name);
  const productConstraintsBefore = JSON.stringify({ array:afterProduct.workingDraft.document.properties.products.minimum, item:afterProduct.workingDraft.document.properties.products.items.additionalProperties, required:afterProduct.workingDraft.document.properties.products.items.required });
  const contextual = {
    stored:afterProduct.workingDraft.document.properties.products.items.properties.product_id,
    selected:row("/products/*/product_id").getAttribute("aria-current") === "true",
    publishedUnchanged:JSON.stringify(afterProduct.document) === publishedBefore,
  };
  await addContextual("/commerce", "Add child property", "order", "object");
  await addContextual("/commerce/order", "Add child property", "line_items", "array", "object");
  const recursiveAction = (await action("/commerce/order/line_items", "Add item property")).textContent;
  await addContextual("/commerce/order/line_items", "Add item property", "sku", "string");
  await addContextual("/products/*", "Add child property", "product_sku", "string");
  const recursive = {
    orderType:stored().workingDraft.document.properties.commerce.properties.order.type,
    array:stored().workingDraft.document.properties.commerce.properties.order.properties.line_items,
    sku:stored().workingDraft.document.properties.commerce.properties.order.properties.line_items.items.properties.sku,
    recursiveAction,
  };
  const removeProductId = async () => { click(await select("/products/*/product_id"), "Remove property"); await settled((schema)=>!propertyAt(schema,"/products/*/product_id"),"the product_id property removal"); };
  await removeProductId();
  const fullPaths = {};
  for (const entered of ["products/*/product_id", "products.*.product_id"]) {
    q("#add-schema-property").click(); set("#schema-manual-property-path", entered); set("#schema-manual-property-type", "number", "change");
    fullPaths[entered] = {
      assistance:q("#schema-manual-property-assistance").textContent,
      preview:q("#schema-manual-property-preview").textContent,
      canAdd:!dialog.querySelector('button[type="submit"]').disabled,
    };
    click(dialog, "Add property");
    await settled((schema)=>Boolean(propertyAt(schema,"/products/*/product_id")),"the full-path product_id property");
    fullPaths[entered].siblings = Boolean(stored().workingDraft.document.properties.products.items.properties.product_name && stored().workingDraft.document.properties.products.items.properties.product_id);
    if (entered.includes("/")) await removeProductId();
  }
  const after = stored();
  const conserved = {
    productName:JSON.stringify(after.workingDraft.document.properties.products.items.properties.product_name) === productNameBefore,
    productConstraints:JSON.stringify({ array:after.workingDraft.document.properties.products.minimum, item:after.workingDraft.document.properties.products.items.additionalProperties, required:after.workingDraft.document.properties.products.items.required }) === productConstraintsBefore,
    rule:(after.workingDraft.attachedRules ?? []).some(({ id, propertyPath }) => id === "product-name-rule" && propertyPath === "/products/*/product_name"),
    documentation:after.workingDraft.documentation?.properties?.["/products/*/product_name"]?.description,
    currentVersion:after.version,
    publishedUnchanged:JSON.stringify(after.document) === publishedBefore,
  };
  return { initial, context, duplicate, contextual, recursive, fullPaths, conserved };
})()`;

const schemaContainerChildReloadRuntime = `(() => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  q("#data-layer-view-schemas").click();
  const libraryRow = Array.from(q("#schema-list").children).find(({ textContent }) => textContent.includes("Page view"));
  Array.from(libraryRow.querySelectorAll("button")).find(({ textContent }) => textContent === "Edit working draft").click();
  const stored = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")).find(({ name }) => name === "Page view");
  const paths = ["/commerce/order", "/commerce/order/line_items/*/sku", "/products/*/product_id", "/products/*/product_name", "/products/*/product_sku"];
  const rows = Object.fromEntries(paths.map((path) => {
    const row = q('[data-schema-property-canonical-path="' + path + '"]');
    return [path, row.querySelector(".schema-property-metadata").textContent];
  }));
  return { rows, version:stored.version, publishedProductId:Boolean(stored.document.properties.products.items.properties.product_id) };
})()`;

const schemaRenamingDraftRuntime = `(async () => {
  const pause=(milliseconds=0)=>new Promise((resolve)=>setTimeout(resolve,milliseconds)),waitFor=async(predicate,label)=>{for(let attempt=0;attempt<400;attempt+=1){const value=predicate();if(value)return value;await pause(10);}throw new Error("Timed out waiting for "+label);},q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const click = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  q("#data-layer-view-schemas").click();
  const row = Array.from(q("#schema-list").children).find(({ textContent }) => textContent.includes("Page view")); click(row, "Edit working draft");
  const name = q("#schema-editor-name");for(const proposed of ["G","Ge","Gene","Generic","Generic page","Generic page view"]){name.value=proposed;name.dispatchEvent(new Event("input",{bubbles:true}));}const publishBlockedImmediately=q("#save-schema").disabled;
  const stored = (await __waitForDurableSchemaObservation((schemas)=>schemas.some(({id,workingDraft})=>id==="schema-page-view"&&workingDraft?.name==="Generic page view"),"the proposed schema rename")).find(({id})=>id==="schema-page-view");
  await waitFor(()=>!q("#save-schema").disabled,"the rename settlement publish readiness");const draft = { proposed:stored.workingDraft.name, canonicalName:stored.workingDraft.canonicalSchema?.contributorName, current:stored.name, pending:stored.workingDraft.pendingChanges, version:stored.version,publishBlockedImmediately,publishReady:true };
  q("#close-schema-editor").click();
  return draft;
})()`;

const schemaRenamingPublishRuntime = `(async () => {
  const pause=(milliseconds=0)=>new Promise((resolve)=>setTimeout(resolve,milliseconds)),waitFor=async(predicate,label)=>{for(let attempt=0;attempt<400;attempt+=1){const value=predicate();if(value)return value;await pause(10);}throw new Error("Timed out waiting for "+label);},q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const click = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  const stored = () => JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"));
  q("#data-layer-view-schemas").click(); const row = Array.from(q("#schema-list").children).find(({ textContent }) => textContent.includes("Page view")); click(row, "Edit working draft");
  const restoredDraft=stored().find(({id})=>id==="schema-page-view").workingDraft;const restored = { name:q("#schema-editor-name").value,canonicalName:restoredDraft.canonicalSchema?.contributorName,pending:restoredDraft.pendingChanges };
  q('#compact-canonical-table-editor [aria-label="Only defined fields"]').click();
  await waitFor(()=>!q("#save-schema").disabled,"the renamed schema publish action");
  const beforeReview = localStorage.getItem("my-chrome-utilities.schema-library.v1"); q("#save-schema").click();
  const review = { text:q("#schema-revision-review-summary").textContent, unchanged:beforeReview === localStorage.getItem("my-chrome-utilities.schema-library.v1") };
  q("#confirm-schema-revision").click();
  let library;try{library=await __waitForDurableSchemaObservation((schemas)=>schemas.some(({id,name,version,workingDraft,document})=>id==="schema-page-view"&&name==="Generic page view"&&version===4&&!workingDraft&&document.additionalProperties===false),"the renamed schema publication");}catch(error){throw new Error(error.message+" Publish diagnostics: "+JSON.stringify({result:document.querySelector("#schema-result")?.textContent,canonical:document.querySelector('[aria-label="Compact canonical command result"]')?.textContent,reviewOpen:q("#schema-revision-review").open,confirmDisabled:q("#confirm-schema-revision").disabled,saveDisabled:q("#save-schema").disabled,runtimeErrors:globalThis.__sidePanelRuntimeErrors??[]}));}const current = library.find(({ id }) => id === "schema-page-view");
  const model = await import("/data-layer-schema-verification.js");
  const event = { sourceId:"history", eventName:"pageview", payload:{ page_type:"home" }, rawInput:[] };
  const latest = model.validateEvent(event, library, "https://example.test/");
  const pinnedSchema = { ...current, assignments:current.assignments.map((assignment) => ({ ...assignment, versionPolicy:"pinned", schemaVersion:3 })) };
  const pinned = model.validateEvent(event, [pinnedSchema, ...library.filter(({ id }) => id !== current.id)], "https://example.test/");
  const refs = {
    assignment:current.assignments[0].schemaId,
    child:library.find(({ id }) => id === "schema-child").parentSchemaId,
    template:JSON.parse(localStorage.getItem("my-chrome-utilities.event-template-library.v1"))[0].schemaId,
    rule:JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1"))[0].attachments[0],
  };
  return {
    restored, review,
    published:{ id:current.id, name:current.name, version:current.version, workingDraftAbsent:!current.workingDraft, history:current.revisionHistory.map(({ name, version }) => ({ name, version })), otherEdit:current.document.additionalProperties === false, count:library.filter(({ id }) => id === "schema-page-view").length, rows:q("#schema-list").textContent },
    refs, latest:{ name:latest.schema?.name, version:latest.schema?.version }, pinned:{ name:pinned.schema?.name, version:pinned.schema?.version },
  };
})()`;

const schemaRenamingRetryReplayRuntime = `(async () => {
  const pause=(milliseconds=0)=>new Promise((resolve)=>setTimeout(resolve,milliseconds)),waitFor=async(predicate,label)=>{for(let attempt=0;attempt<400;attempt+=1){const value=predicate();if(value)return value;await pause(10);}throw new Error("Timed out waiting for "+label);},q=(selector)=>{const element=document.querySelector(selector);if(!element)throw new Error("Missing "+selector);return element;},click=(root,label)=>{const button=Array.from(root.querySelectorAll("button")).find(({textContent})=>textContent===label);if(!button)throw new Error("Missing "+label);button.click();return button;};
  q("#data-layer-view-schemas").click();const row=Array.from(q("#schema-list").children).find(({textContent})=>textContent.includes("Page view"));click(row,"Edit working draft");
  const restoreFailure=__failNextDurableSchemaWrite("rename first batch fails",(schema)=>schema?.workingDraft?.name==="Retry intermediate"),name=q("#schema-editor-name");for(const proposed of ["Retry intermediate","Retry final"]){name.value=proposed;name.dispatchEvent(new Event("input",{bubbles:true}));}
  await waitFor(()=>q("#durable-storage-recovery").open&&q("#durable-repository-status").textContent.includes("rename first batch fails"),"the failed first rename batch recovery");restoreFailure();const failure={rejectEnabled:!q("#reject-durable-save").disabled,retryEnabled:!q("#retry-durable-save").disabled,publishBlocked:q("#save-schema").disabled,visibleName:q("#schema-editor-name").value};
  q("#retry-durable-save").click();const result=await waitFor(()=>{const text=q("#durable-recovery-result").textContent;return text.includes("committed to the Saved Schema Library")||text.includes("Retry was not committed")?text:undefined;},"the rename Retry result");if(result.includes("Retry was not committed"))throw new Error(result);
  const schemas=await __waitForDurableSchemaObservation((values)=>values.some(({id,workingDraft})=>id==="schema-page-view"&&workingDraft?.name==="Retry final"&&workingDraft?.canonicalSchema?.contributorName==="Retry final"),"the queued latest rename replay after Retry"),stored=schemas.find(({id})=>id==="schema-page-view"),replayed={name:stored.workingDraft.name,canonicalName:stored.workingDraft.canonicalSchema.contributorName,pending:stored.workingDraft.pendingChanges,visibleName:q("#schema-editor-name").value,publishReady:!q("#save-schema").disabled};q("#close-storage-recovery").click();return{failure,result,replayed};
})()`;

const schemaRenamingRejectRuntime = `(async () => {
  const pause=(milliseconds=0)=>new Promise((resolve)=>setTimeout(resolve,milliseconds)),waitFor=async(predicate,label)=>{for(let attempt=0;attempt<400;attempt+=1){const value=predicate();if(value)return value;await pause(10);}throw new Error("Timed out waiting for "+label);},q=(selector)=>{const element=document.querySelector(selector);if(!element)throw new Error("Missing "+selector);return element;},click=(root,label)=>{const button=Array.from(root.querySelectorAll("button")).find(({textContent})=>textContent===label);if(!button)throw new Error("Missing "+label);button.click();return button;};
  q("#data-layer-view-schemas").click();const row=Array.from(q("#schema-list").children).find(({textContent})=>textContent.includes("Page view"));click(row,"Edit working draft");
  const restoreFailure=__failNextDurableSchemaWrite("rename rejected batch fails",(schema)=>schema?.workingDraft?.name==="Reject intermediate"),name=q("#schema-editor-name");for(const proposed of ["Reject intermediate","Reject final must be discarded"]){name.value=proposed;name.dispatchEvent(new Event("input",{bubbles:true}));}
  await waitFor(()=>q("#durable-storage-recovery").open&&q("#durable-repository-status").textContent.includes("rename rejected batch fails"),"the rejectable rename batch recovery");restoreFailure();const recovery={rejectEnabled:!q("#reject-durable-save").disabled,publishBlocked:q("#save-schema").disabled,visibleName:q("#schema-editor-name").value};q("#reject-durable-save").click();const result=await waitFor(()=>q("#durable-recovery-result").textContent.includes("Rejected ")?q("#durable-recovery-result").textContent:undefined,"the rename Reject result");
  const schemas=await __waitForDurableSchemaObservation((values)=>values.some(({id,name,workingDraft})=>id==="schema-page-view"&&name==="Page view"&&!workingDraft),"the durable schema restored by Reject"),stored=schemas.find(({id})=>id==="schema-page-view"),rejected={name:stored.name,draftAbsent:!stored.workingDraft,visibleName:q("#schema-editor-name").value,publishReady:!q("#save-schema").disabled,queuedNameAbsent:!JSON.stringify(stored).includes("Reject final must be discarded")};q("#close-storage-recovery").click();return{recovery,result,rejected};
})()`;

const schemaRenamingInvalidAndDiscardRuntime = `(() => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const click = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  q("#data-layer-view-schemas").click(); const row = Array.from(q("#schema-list").children).find(({ textContent }) => textContent.includes("Page view")); click(row, "Edit working draft");
  const name = q("#schema-editor-name"); const invalid = {};
  for (const proposed of ["", "Product detail", "product DETAIL"]) {
    name.value = proposed; name.dispatchEvent(new Event("input", { bubbles:true }));
    invalid[proposed || "empty"] = { disabled:q("#save-schema").disabled, assistance:q("#schema-editor-name-assistance").textContent };
  }
  name.value = "Generic page view"; name.dispatchEvent(new Event("input", { bubbles:true }));
  q("#discard-working-schema-draft").click();
  const library = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"));
  const current = library.find(({ id }) => id === "schema-page-view"); const product = library.find(({ id }) => id === "schema-product-detail");
  const reopenedRow = Array.from(q("#schema-list").children).find(({ textContent }) => textContent.includes("Page view")); click(reopenedRow, "Edit working draft");
  return { invalid, identities:[current.id, product.id], discarded:{ draftAbsent:!current.workingDraft, current:current.name, rendered:q("#schema-editor-name").value } };
})()`;

const schemaNestedPathRuntime = `(async () => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const click = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find(({ textContent }) => textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  const pause = (milliseconds = 10) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  const waitFor = async (predicate, label) => { for (let attempt=0;attempt<400;attempt+=1) { const value=predicate();if(value)return value;await pause(); } throw new Error("Timed out waiting for " + label); };
  q("#data-layer-view-schemas").click();
  const row = Array.from(q("#schema-list").children).find(({ textContent }) => textContent.includes("Product detail")); click(row, "Edit working draft");
  const tree = q("#schema-property-tree");
  const paths = Array.from(tree.querySelectorAll("li[data-schema-property-path]")).map(({ dataset }) => dataset.schemaPropertyPath);
  let products = q('#schema-property-tree [data-schema-property-path="products"]');
  const everyItem = q('#schema-property-tree [data-schema-property-path="products.*"]');
  const overflow=products.querySelector(':scope > button[aria-label="Property actions for /products"]');overflow.click();await waitFor(()=>document.querySelector('[data-schema-row-overlay="true"] [data-property-context-menu="true"]'),"the products property context menu");
  const arrayOverflow={label:overflow.textContent,menu:Array.from(document.querySelectorAll('[data-schema-row-overlay="true"] [role="menuitem"]')).map(({textContent})=>textContent)};click(document.querySelector('[data-schema-row-overlay="true"]'),"Cancel");
  products.querySelector(":scope > strong").click();await waitFor(()=>document.querySelector('[data-schema-property-path="products"]')?.getAttribute("aria-current")==="true","the selected products array target");products=q('#schema-property-tree [data-schema-property-path="products"]');
  const expectedArrayActions=["Edit type · Array of Object","Add item property","Add rule","Add specific index rule","Copy to another schema","Remove property"],arrayActions=Array.from(products.querySelectorAll(":scope > button"),({textContent})=>textContent).filter((label)=>expectedArrayActions.includes(label));
  const advanced = { paths, arrayActions, arrayOverflow, everyItem:everyItem.querySelector(":scope > .schema-property-metadata").textContent };
  click(q('#schema-property-tree [data-schema-property-path="fruits"]'), "Add specific index rule");
  const indexDialog = q("#schema-specific-index-dialog"); const indexInput = q("#schema-specific-index");
  indexInput.value = "-1"; indexInput.dispatchEvent(new Event("input", { bubbles:true }));
  const invalidIndex = { min:indexInput.min, blocked:indexDialog.querySelector('button[type="submit"]').disabled, assistance:indexDialog.querySelector("output").textContent };
  indexInput.value = "1"; indexInput.dispatchEvent(new Event("input", { bubbles:true }));
  const validIndex = { assistance:indexDialog.querySelector("output").textContent, canContinue:!indexDialog.querySelector('button[type="submit"]').disabled };
  click(indexDialog, "Choose rule");
  const stringPicker = q("#schema-property-rule-picker");
  const exactIndex = { heading:q("#schema-property-rule-picker-heading").textContent, choices:Array.from(stringPicker.querySelectorAll('[aria-label="Create a rule"] button')).map(({ textContent }) => textContent) };
  click(stringPicker, "Cancel");
  click(q('#schema-property-tree [data-schema-property-path="products.*.id"]'), "Add rule");
  const numberPicker = q("#schema-property-rule-picker");
  const wildcardPicker = { heading:q("#schema-property-rule-picker-heading").textContent, choices:Array.from(numberPicker.querySelectorAll('[aria-label="Create a rule"] button')).map(({ textContent }) => textContent) };
  click(numberPicker, "Product ids version 1");
  const stored = (await __waitForDurableSchemaObservation((schemas)=>schemas.some(({name,workingDraft})=>name==="Product detail"&&workingDraft?.pendingChanges?.includes("Attach Product ids to products.*.id")&&workingDraft?.attachedRules?.some(({id,propertyPath})=>id==="rule-product-ids"&&propertyPath==="/products/*/id")),"the nested Product ids working-draft attachment")).find(({ name }) => name === "Product detail");
  await waitFor(()=>q("#schema-editor").getAttribute("aria-busy")!=="true","the settled nested-path presentation");
  const persisted = { pendingChanges:stored.workingDraft.pendingChanges, attachmentPaths:stored.workingDraft.attachedRules.map(({ propertyPath }) => propertyPath), currentRules:(stored.attachedRules ?? []).length, currentVersion:stored.version };
  const nested = await import("/data-layer-schema-nested-path.js");
  const schemaModel = await import("/data-layer-schema-verification.js");
  const pickerModel = await import("/data-layer-schema-property-rule-picker.js");
  const payload = { fruits:["apple", "banana", "pear"], products:[{ id:1, name:"product 1" }, { id:2, name:"product 2" }], order:{ id:"12345678" } };
  const schemaDocument = stored.workingDraft.document;
  const targetChoices = nested.nestedTargetChoices(payload, "/products/1/id");
  const nestedChoice = nested.nestedTargetChoices(payload, "/order/id");
  const normalization = Object.fromEntries(["nested order id", "fruits item at zero-based index 1", "id in every products item"].map((intent) => [intent, nested.canonicalPathForTargetIntent(intent)]));
  const pathValidation = Object.fromEntries(["/order/id", "/products/*/id", "/fruits/1", "/order/*", "/fruits/name", "/fruits/-1"].map((path) => [path, nested.validateNestedRuleTarget(schemaDocument, path)]));
  const compatibility = Object.fromEntries(["/order/id", "/products/*/id", "/fruits/1"].map((path) => { const type = nested.validateNestedRuleTarget(schemaDocument, path).targetType; return [path, pickerModel.builtInRulesForProperty(type).map(({ name }) => name)]; }));
  const ensured = nested.ensureNestedSchemaPath({ type:"object" }, "/products/*/id", "number");
  const validate = (rules, value = payload, model = schemaDocument) => {
    const schema = { id:"preview", name:"Product detail", version:3, document:model, assignments:[], attachedRules:rules };
    return schemaModel.validateWithSchema({ sourceId:"event", eventName:"product_view", payload:value, rawInput:[] }, schema, [schema]);
  };
  const fruitRules = [{ id:"banana", version:1, propertyPath:"/fruits/1", operator:"exact-value", parameters:"banana" }];
  const fruits = [payload.fruits, ["apple", "orange", "pear"], ["apple"]].map((values) => { const result = validate(fruitRules, { ...payload, fruits:values }); return { state:result.state, paths:result.issues.map(({ instancePath }) => instancePath) }; });
  const productRules = [{ id:"id", version:1, propertyPath:"/products/*/id", operator:"value-type", parameters:"number" }, { id:"name", version:1, propertyPath:"/products/*/name", operator:"non-empty-string" }];
  const productsResult = validate(productRules, { ...payload, products:[payload.products[0], { name:"" }] });
  const emptyProducts = validate(productRules, { ...payload, products:[] });
  const orders = ["12345678", "1234567", "1234567a"].map((id) => { const result = validate([{ id:"length", version:1, propertyPath:"/order/id", operator:"text-length", parameters:"8" }, { id:"digits", version:1, propertyPath:"/order/id", operator:"digits-only" }], { ...payload, order:{ id } }); return { id, state:result.state, failed:result.issues[0]?.expected ?? "none" }; });
  const combined = validate([{ id:"all-fruits", version:1, propertyPath:"/fruits/*", operator:"value-type", parameters:"string" }, ...fruitRules]);
  const repeatedPayload = { orders:[{ items:[{ sku:"A" }, { sku:"" }] }, { items:[{ sku:"B" }] }] };
  const repeatedDocument = nested.ensureNestedSchemaPath({ type:"object" }, "/orders/*/items/*/sku", "string").document;
  const repeated = validate([{ id:"sku", version:1, propertyPath:"/orders/*/items/*/sku", operator:"non-empty-string" }], repeatedPayload, repeatedDocument);
  const validation = {
    fruits,
    products:productsResult.issues.map(({ instancePath, templatePath }) => ({ instancePath, templatePath })),
    productsNotApplicable:productsResult.evaluations.filter(({ status }) => status === "not-applicable").map(({ propertyPath }) => propertyPath),
    emptyProducts:{ issues:emptyProducts.issues.length, itemCountAvailable:pickerModel.builtInRulesForProperty("array").some(({ name }) => name === "Item count") },
    orders,
    combined:{ wildcardMatches:nested.resolveNestedValues(payload, "/fruits/*").length, exactMatches:nested.resolveNestedValues(payload, "/fruits/1").length, issues:combined.issues.length },
    repeated:repeated.issues.map(({ instancePath, templatePath, expected, actual }) => ({ instancePath, templatePath, expected, actual })),
  };
  return { advanced, invalidIndex, validIndex, exactIndex, wildcardPicker, persisted, targetChoices, nestedChoice, normalization, pathValidation, compatibility, ensured:{ createdNodes:ensured.createdNodes, property:ensured.document.properties.products }, validation };
})()`;

const schemaRevisionLifecycleUiRuntime = `(async () => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const productRow = () => Array.from(q("#schema-list").querySelectorAll("li")).find((row) => row.textContent.includes("Product listing · current revision 4"));
  const productAction = (label) => {
    const button = Array.from(productRow()?.querySelectorAll("button") ?? []).find((candidate) => candidate.textContent === label);
    if (!button) throw new Error("Missing Product listing " + label + " action");
    return button;
  };
  const storedProduct = () => JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1") ?? "[]").find(({ id }) => id === "schema-product-listing");
  const durableProduct = async (predicate, label) => {
    const schemas = await globalThis.__waitForDurableSchemaObservation((values) => {
      const product = values.find(({ id }) => id === "schema-product-listing");
      return Boolean(product && predicate(product, values));
    }, label);
    return schemas.find(({ id }) => id === "schema-product-listing");
  };
  q("#data-layer-view-schemas").click();
  q("#schema-subview-schemas").click();
  const beforeOpen = structuredClone(storedProduct());
  const initialRows = Array.from(q("#schema-list").querySelectorAll('[data-schema-entry-key="saved:schema-product-listing"]')).map((row) => row.childNodes[0]?.textContent?.trim() ?? "");
  const assignmentChoices = Array.from(q("#schema-assignment-schema").options).map((option) => option.textContent);
  productAction("Edit working draft").click();
  const opened = storedProduct();
  q("#schema-revision-history summary").click();
  const historyOptions = Array.from(q("#schema-revision-selector").options).map((option) => option.textContent);
  q("#schema-revision-selector").value = "2";
  q("#schema-revision-selector").dispatchEvent(new Event("change", { bubbles:true }));
  const history = {
    options:historyOptions,
    comparison:q("#schema-revision-comparison").textContent,
    actions:Array.from(q("#schema-revision-history").querySelectorAll("button")).map((button) => button.textContent),
    separateRows:initialRows.filter((text) => /revision [123](?:\\D|$)/i.test(text)).length,
    assignmentChoices,
    openedWithoutMutation:JSON.stringify(opened) === JSON.stringify(beforeOpen),
    status:q("#schema-editor-status").textContent,
  };
  q("#duplicate-schema-revision").click();
  const storedAfterDuplicate = await globalThis.__waitForDurableSchemaObservation((values) => values.some(({ name, published }) => published === false && /revision 2 copy/.test(name)), "the duplicated historical schema revision");
  const duplicate = storedAfterDuplicate.find(({ name, published }) => published === false && /revision 2 copy/.test(name));
  const duplication = {
    name:duplicate?.name,
    published:duplicate?.published,
    version:duplicate?.version,
    assignments:duplicate?.assignments?.length,
    sourceUnchanged:storedAfterDuplicate.find(({ id }) => id === "schema-product-listing")?.version,
    assignableChoices:Array.from(q("#schema-assignment-schema").options).map((option) => option.textContent),
  };
  productAction("Edit working draft").click();
  q("#schema-revision-selector").value = "2";
  q("#restore-schema-revision").click();
  const restorationReview = q("#schema-revision-review-summary").textContent;
  q("#cancel-schema-revision").click();
  const cancel = {
    dialogClosed:!q("#schema-revision-review").open,
    draftUnchanged:JSON.stringify(storedProduct().workingDraft) === JSON.stringify(beforeOpen.workingDraft),
    current:storedProduct().version,
  };
  q("#restore-schema-revision").click();
  q("#confirm-schema-revision").click();
  const restored = await durableProduct(({ version, workingDraft }) => version === 4 && workingDraft?.sourceVersion === 2 && workingDraft.pendingChanges.length === 1 && workingDraft.pendingChanges[0] === "Restore revision 2", "the restored historical schema revision draft");
  const restoration = {
    review:restorationReview,
    cancel,
    confirmed:{ current:restored.version, source:restored.workingDraft?.sourceVersion, pending:restored.workingDraft?.pendingChanges },
  };
  q("#save-schema").click();
  const publicationReview = q("#schema-revision-review-summary").textContent;
  q("#confirm-schema-revision").click();
  const published = await durableProduct(({ version, workingDraft }) => version === 5 && !workingDraft, "the published restored schema revision");
  return {
    history,
    duplication,
    restoration,
    publication:{ review:publicationReview, current:published.version, history:published.revisionHistory.map(({ version }) => version), draftCleared:!published.workingDraft },
  };
})()`;

const schemaSourceCreationRuntime = `(() => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const input = (selector, value) => { const element = q(selector); element.value = value; element.dispatchEvent(new Event("input", { bubbles:true })); };
  q("#data-layer-view-library").click();
  q("#add-new-event").click();
  input("#event-template-name", "Order complete");
  input("#event-template-event-name", "order_complete");
  q("#event-template-source").value = "event-history"; q("#event-template-source").dispatchEvent(new Event("input", { bubbles:true }));
  input("#push-destination-path", "dataLayer");
  input("#event-template-json", JSON.stringify({ page_type:"confirmation", page_name:"Thank you", commerce:{ order:{ id:"O-1" } } }));
  q("#save-template-revision").click();
  const schemaSelector = q("#library-draft-schema-selector");
  schemaSelector.value = Array.from(schemaSelector.options).find((option) => option.value)?.value ?? "";
  schemaSelector.dispatchEvent(new Event("change", { bubbles:true }));
  const draftBeforeRefresh = q("#event-template-json").value;
  q("#refresh-library-draft-validation").click();
  const draftRefresh = { unchanged:draftBeforeRefresh === q("#event-template-json").value, message:q("#event-template-validation").textContent };
  q("#save-template-revision").click();
  q("#confirm-revision-change").click();
  const persistedAttachment = JSON.parse(localStorage.getItem("my-chrome-utilities.event-template-library.v1") ?? "[]").find((template) => template.name === "Order complete")?.schemaId;
  const create = Array.from(q("#event-template-list").querySelectorAll("button")).find((button) => button.textContent === "Create schema");
  if (!create) throw new Error("Missing Library Create schema action");
  create.click();
  return {
    schemaView:!q("#data-layer-panel-schemas").hidden,
    editor:!q("#schema-editor").hidden,
    name:q("#schema-editor-name").value,
    paths:Array.from(q("#schema-property-tree").querySelectorAll("[data-schema-property-canonical-path]"), (row) => row.querySelector(":scope > strong")?.textContent + " · " + row.dataset.schemaPropertyCanonicalPath),
    assignment:q("#schema-editor-target").value,
    draftRefresh,
    persistedAttachment,
  };
})()`;

const schemaInheritanceRuntime = (fixture) => `(async () => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const input = (selector, value) => { const element = q(selector); element.value = value; element.dispatchEvent(new Event("input", { bubbles:true })); };
  const repository = await (await import("./data-layer-durable-project-repository.js")).openIndexedDbProjectRepository();
  const durableEvents = [];
  for (const type of ["durable-project-saving", "durable-project-saved", "durable-project-save-failed"]) globalThis.addEventListener(type, (event) => durableEvents.push({ type, label:event.detail?.label, error:String(event.detail?.error ?? "") }));
  const waitForDurableSchema = async (read, description) => {
    for (let attempt = 0; attempt < 150; attempt += 1) {
      const schema = (await repository.savedSchemas()).find(({ name }) => name === "Order confirmation");
      if (schema && read(schema)) return schema;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    throw new Error("Timed out waiting for durable Order confirmation " + description + "; " + JSON.stringify({
      schemas:(await repository.savedSchemas()).map(({ id, name }) => ({ id, name })),
      result:q("#schema-result").textContent,
      recovery:q("#durable-storage-recovery").open,
      durableStatus:q("#durable-repository-status").textContent,
      events:durableEvents,
    }));
  };
  const addUnattachedReusableRule = async (name, parameters, message) => {
    const eventOffset = durableEvents.length;
    q("#schema-subview-rules").click();
    q("#create-schema-rule").click();
    input("#schema-rule-name", name);
    q("#schema-rule-operator").value = "allowed-values";
    input("#schema-rule-parameters", parameters);
    q("#schema-rule-severity").value = "warning";
    input("#schema-rule-message", message);
    q("#save-schema-rule").click();
    await new Promise((resolve) => setTimeout(resolve, 100));
    const failed = durableEvents.slice(eventOffset).find(({ type }) => type === "durable-project-save-failed");
    if (failed) throw new Error("Unattached reusable-rule fixture caused a durable schema failure: " + JSON.stringify(failed));
  };
  q("#data-layer-view-schemas").click();
  q("#schema-subview-schemas").click();
  if (${JSON.stringify(fixture)} === "1:3") {
    q("#create-schema").click();
    input("#schema-editor-name", "Order confirmation");
    const parent = Array.from(q("#schema-editor-parent").options).find((option) => option.textContent.startsWith("Checkout schema v2"));
    if (!parent) throw new Error("Missing saved parent schema option");
    q("#schema-editor-parent").value = parent.value;
    q("#schema-editor-parent").dispatchEvent(new Event("change", { bubbles:true }));
    const observation = {
      groups:Array.from(q("#schema-inherited-rule-groups").querySelectorAll("[data-inherited-rule-group]")).map((group) => ({ state:group.dataset.inheritedRuleGroup, text:group.textContent })),
      preview:Array.from(q("#schema-effective-rule-preview").querySelectorAll("li")).map((item) => item.textContent),
    };
    await addUnattachedReusableRule("Known channels", "channel:web,app", "Choose a known channel");
    return observation;
  }
  q("#create-schema").click();
  input("#schema-editor-name", "Order confirmation");
  const parent = Array.from(q("#schema-editor-parent").options).find((option) => option.textContent.startsWith("Checkout schema v2"));
  if (!parent) throw new Error("Missing saved parent schema option");
  q("#schema-editor-parent").value = parent.value;
  q("#schema-editor-parent").dispatchEvent(new Event("change", { bubbles:true }));
  q("#schema-editor-target").value = "raw input";
  q("#schema-editor-target").dispatchEvent(new Event("input", { bubbles:true }));
  q("#save-schema").click();
  q("#confirm-schema-revision").click();
  await waitForDurableSchema(() => true, "publication");
  const child = Array.from(q("#schema-list").querySelectorAll("li")).find((item) => item.textContent.startsWith("Order confirmation · current revision 1"));
  if (!child) throw new Error("Missing saved child schema");
  q("#schema-subview-assignments").click();
  q("#create-schema-assignment").click();
  q("#schema-assignment-schema").value = Array.from(q("#schema-assignment-schema").options).find((option) => option.textContent.startsWith("Order confirmation version 1"))?.value ?? "";
  input("#schema-assignment-source", "event-history");
  input("#schema-assignment-event", "page_view");
  q("#schema-assignment-target").value = "raw input";
  input("#schema-assignment-priority", "200");
  q("#save-schema-assignment").click();
  await waitForDurableSchema((schema) => schema.assignments.some(({ eventName, priority, target }) => eventName === "page_view" && priority === 200 && target === "raw input"), "assignment");
  const observation = {
    groups:Array.from(q("#schema-inherited-rule-groups").querySelectorAll("[data-inherited-rule-group]")).map((group) => ({ state:group.dataset.inheritedRuleGroup, text:group.textContent })),
    preview:Array.from(q("#schema-effective-rule-preview").querySelectorAll("li")).map((item) => item.textContent),
  };
  await addUnattachedReusableRule("Known channels", "channel:web,app", "Choose a known channel");
  await addUnattachedReusableRule("Known markets", "market:retail,trade", "Choose a known market");
  return observation;
})()`;

const schemaLibraryTransferRuntime = `(async () => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const repository = await (await import("./data-layer-durable-project-repository.js")).openIndexedDbProjectRepository();
  q("#data-layer-view-schemas").click();
  const originalClick = HTMLAnchorElement.prototype.click;
  const originalCreateObjectURL = URL.createObjectURL;
  let downloadName = "";
  let exportedBlob;
  URL.createObjectURL = function (blob) { exportedBlob = blob; return originalCreateObjectURL.call(this, blob); };
  HTMLAnchorElement.prototype.click = function () { downloadName = this.download; };
  q("#export-schema").click();
  Array.from(q("#schema-export-choices").querySelectorAll("button")).find((button) => button.textContent === "Extension backup").click();
  HTMLAnchorElement.prototype.click = originalClick;
  URL.createObjectURL = originalCreateObjectURL;
  const exported = JSON.parse(await exportedBlob.text());
  const identities = (items) => items.map((item) => item.id);
  const before = { schemas:identities(await repository.savedSchemas()), rules:identities(JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1") ?? "[]")) };
  const file = new File([JSON.stringify(exported)], "schema-library-v1.json", { type:"application/json" });
  const input = q("#schema-library-import-file");
  const importResults = [q("#schema-result").textContent];
  const importResultObserver = new MutationObserver(() => importResults.push(q("#schema-result").textContent));
  importResultObserver.observe(q("#schema-result"), { childList:true, subtree:true, characterData:true });
  Object.defineProperty(input, "files", { configurable:true, value:[file] });
  input.dispatchEvent(new Event("change", { bubbles:true }));
  for (let attempt = 0; attempt < 150 && !q("#schema-import-review").open; attempt += 1) await new Promise((resolve) => setTimeout(resolve, 20));
  importResultObserver.disconnect();
  if (!q("#schema-import-review").open) throw new Error("Timed out waiting for Schema Library import review; " + JSON.stringify(importResults));
  q("#replace-schema-library").click();
  const replaceResult = q("#schema-result").textContent;
  await new Promise((resolve) => setTimeout(resolve, 100));
  const reloaded = { schemas:identities(await repository.savedSchemas()), rules:identities(JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1") ?? "[]")) };
  return {
    downloadName,
    content:{ version:exported.version, schemas:identities(exported.schemas), rules:identities(exported.rules) },
    before,
    result:replaceResult,
    review:q("#schema-import-review").open,
    actions:Array.from(q("#schema-import-review").querySelectorAll("button")).map((button) => button.textContent),
    reloaded,
  };
})()`;

const schemaLiveValidationRuntime = `(async () => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  ${guidedRuntimeWaitHelpers}
  globalThis.chrome = {
    tabs:{ query:async () => [{ id:17, windowId:3, url:"https://shop.example/order-confirmation", title:"Checkout", active:true }] },
    scripting:{ executeScript:async () => [{ result:{ queue:{ history:[{ event:"page_view", page_type:"checkout", channel:"email" }] } } }] },
  };
  q("#choose-observation-target").click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  q("#observation-target-list [data-target-id]").click();
  (await waitForStartableSelectedTarget()).click();
  const event = await waitForElement("#live-event-feed button"); event.click();
  const validate = Array.from(q("#live-event-inspector").querySelectorAll("button")).find((button) => button.textContent === "Validate" || button.textContent === "Revalidate");
  if (!validate) throw new Error("Missing Validate action");
  validate.click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  const validationTerm = q('#live-event-inspector dt[data-field="validation"]');
  q("#add-event-feed-filter").click();
  const field = q("#event-feed-query-field");
  field.value = "Validation state"; field.dispatchEvent(new Event("change", { bubbles:true }));
  q("#event-feed-query-operator").value = "is";
  const value = q("#event-feed-query-value"); value.value = "Warnings"; value.dispatchEvent(new Event("input", { bubbles:true }));
  Array.from(q("#live-event-query").querySelectorAll("button")).find((button) => button.textContent === "Apply condition").click();
  return { event:event.textContent, validation:validationTerm.nextElementSibling?.textContent ?? "", detail:document.querySelector("#live-event-inspector [data-validation-details]")?.textContent ?? document.querySelector("#live-event-validation-issues")?.textContent ?? "", filtered:Array.from(q("#live-event-feed").querySelectorAll("button")).map((button) => button.textContent), queryFields:Array.from(field.options).map((option) => option.textContent) };
})()`;

export const fixturePrograms = Object.freeze({ ...containmentFixturePrograms, ...projectFixturePrograms, guidedDestinationOptionsRuntime, guidedValidationRuntime, schemaPropertyRemovalRuntime, schemaPropertyRemovalReloadRuntime, schemaAssignmentRuntime, schemaRevisionLifecycleRuntime, schemaPropertyRulePickerRuntime, schemaManualPropertyRuntime, schemaManualPropertyReloadRuntime, schemaContainerChildRuntime, schemaContainerChildReloadRuntime, schemaRenamingDraftRuntime, schemaRenamingPublishRuntime, schemaRenamingRetryReplayRuntime, schemaRenamingRejectRuntime, schemaRenamingInvalidAndDiscardRuntime, schemaNestedPathRuntime, schemaRevisionLifecycleUiRuntime, schemaSourceCreationRuntime, schemaInheritanceRuntime, schemaLibraryTransferRuntime, schemaLiveValidationRuntime });
export const definitions = createExecutableTargetDefinitions("schema-workspace", fixturePrograms, { observe:executeFixture });
