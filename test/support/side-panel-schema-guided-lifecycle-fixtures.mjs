import { guidedRuntimeWaitHelpers } from "./side-panel-schema-fixture-primitives.mjs";

export const guidedDestinationOptionsRuntime = `(async () => {
  const q = (selector) => { const value = document.querySelector(selector); if (!value) throw new Error("Missing " + selector); return value; };
  ${guidedRuntimeWaitHelpers}
  globalThis.chrome = {
    tabs:{ query:async () => [{ id:23, windowId:4, url:"http://127.0.0.1:4173/", title:"Fixture", active:true }] },
    scripting:{ executeScript:async () => [{ result:{ queue:{ history:[{ event:"pageview", page_type:"product_list", count:2 }] } } }] },
  };
  await endActiveSession();
  q("#choose-observation-target").click();
  (await waitForElement("#observation-target-list [data-target-id]")).click();
  (await waitForElement("#start-data-layer-testing:not(:disabled)")).click();
  (await waitForElement("#live-event-feed button")).click();
  q('#live-event-inspector button[aria-label="Add validation for /page_type"]').click();
  const flow = q("#guided-validation-flow");
  flow.querySelector('input[name="guided-schema-destination"][value="existing"]').click();
  return Array.from(q("#guided-schema-results").querySelectorAll(":scope > article")).map((row) => ({
    label:row.querySelector("h6").textContent,
    disabled:row.querySelector("button").disabled,
    explanation:row.querySelectorAll("p")[1].textContent.replace("Property compatibility: ", ""),
  }));
})()`;

export const guidedValidationRuntime = `(async () => {
  const q = (selector) => { const value = document.querySelector(selector); if (!value) throw new Error("Missing " + selector); return value; };
  ${guidedRuntimeWaitHelpers}
  const visible = (element) => element.getClientRects().length > 0 && !element.hidden;
  const clickButton = (root, label) => { const button = Array.from(root.querySelectorAll("button")).find((candidate) => candidate.textContent === label); if (!button) throw new Error("Missing " + label); button.click(); return button; };
  const { openIndexedDbProjectRepository } = await import("./data-layer-durable-project-repository.js");
  const repository = await openIndexedDbProjectRepository();
  const readSchemas = () => repository.savedSchemas();
  const storedState = Object.fromEntries(Array.from({ length:localStorage.length }, (_, index) => localStorage.key(index)).filter(Boolean).map((key) => [key, localStorage.getItem(key)]));
  globalThis.chrome = {
    tabs:{ query:async () => [{ id:23, windowId:4, url:"http://127.0.0.1:4173/", title:"Fixture", active:true }] },
    scripting:{ executeScript:async () => [{ result:{ queue:{ history:[{ event:"pageview", page_type:"product_list", count:2 }] } } }] },
  };
  await endActiveSession();
  q("#choose-observation-target").click();
  (await waitForElement("#observation-target-list [data-target-id]")).click();
  (await waitForElement("#start-data-layer-testing:not(:disabled)")).click();
  (await waitForElement("#live-event-feed button")).click();
  const create = q('#live-event-inspector button[aria-label="Add validation for /page_type"]');
  const beforeSchemas = await readSchemas();
  const beforeSchemaIds = new Set(beforeSchemas.map(({ id }) => id));
  const before = {
    schemas:beforeSchemas.length,
    rules:JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1") ?? "[]").length,
  };
  create.click();
  const flow = await waitForElement("#guided-validation-flow");
  const initial = {
    visible:visible(flow),
    heading:q("#guided-validation-heading").textContent,
    focused:document.activeElement === q("#guided-validation-heading"),
    stages:Array.from(q("#guided-validation-stages").children).map((item) => [item.textContent, item.dataset.state]),
    advancedPrimary:!q("#guided-advanced-settings").open && ["#guided-ruleName", "#guided-message", "#guided-sourceId", "#guided-target", "#guided-priority"].every((selector) => q("#guided-advanced-settings").contains(q(selector))),
    persistedUnchanged:(await readSchemas()).length === before.schemas && JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1") ?? "[]").length === before.rules,
  };
  const invalid = { focused:false, link:"Property selection skipped" };
  const destinationInitial = {
    heading:q("#guided-validation-heading").textContent,
    choices:Array.from(flow.querySelectorAll('input[name="guided-schema-destination"]')).map((input) => input.parentElement.textContent.trim()),
    selected:flow.querySelector('input[name="guided-schema-destination"]:checked')?.value ?? null,
    persistedUnchanged:(await readSchemas()).length === before.schemas,
  };
  flow.querySelector('input[name="guided-schema-destination"][value="new"]').click();
  const blankNameAssistance = q("#guided-new-schema-name-assistance").textContent;
  q("#guided-new-schema-name").value = "Existing pageview";
  q("#guided-new-schema-name").dispatchEvent(new Event("input", { bubbles:true }));
  const duplicateNameAssistance = q("#guided-new-schema-name-assistance").textContent;
  q("#guided-new-schema-name").value = "Signal Shop pageview";
  q("#guided-new-schema-name").dispatchEvent(new Event("input", { bubbles:true }));
  const newNameAssistance = q("#guided-new-schema-name-assistance").textContent;
  clickButton(flow, "Continue");
  const requirement = {
    heading:q("#guided-validation-heading").textContent,
    focused:document.activeElement === q("#guided-validation-heading"),
    detected:q("#guided-expected-type-hint").textContent,
    incompatible:Array.from(q("#guided-requirement").options).some((option) => option.textContent === "Must be within a range"),
    oldControls:["#schema-rule-kind", "#schema-rule-types", "#schema-rule-operator"].some((selector) => flow.contains(document.querySelector(selector))),
  };
  q("#guided-requirement").value = "Must be one of these values";
  q("#guided-requirement").dispatchEvent(new Event("change", { bubbles:true }));
  Array.from(flow.querySelectorAll("button")).find((button) => button.textContent === "Add another value").click();
  q("#guided-allowed-value-2").value = "homepage";
  q("#guided-allowed-value-2").focus();
  q("#guided-allowed-value-2").dispatchEvent(new Event("input", { bubbles:true }));
  const values = {
    labels:Array.from(q("#guided-allowed-values").querySelectorAll("label")).map((label) => label.textContent),
    assistance:q("#guided-validation-status").textContent,
    focusRetained:document.activeElement === q("#guided-allowed-value-2"),
    statusRole:q("#guided-validation-status").getAttribute("role"),
    removeActions:Array.from(q("#guided-allowed-values").querySelectorAll("button")).filter((button) => button.textContent === "Remove value").length,
  };
  Array.from(flow.querySelectorAll("button")).find((button) => button.textContent === "Continue").click();
  const scope = {
    heading:q("#guided-validation-heading").textContent,
    selected:flow.querySelector('input[name="guided-scope"]:checked').parentElement.textContent.trim(),
    choices:Array.from(flow.querySelectorAll('input[name="guided-scope"]')).map((input) => input.parentElement.textContent.trim()),
    prefill:"Domain " + q("#guided-scope-domain").value + "; event " + q("#guided-scope-event").value + "; source " + q("#guided-scope-source").value + "; target " + q("#guided-scope-target").value + ".",
  };
  flow.querySelector('input[name="guided-scope"][value="selected-paths"]').click();
  const pathBuilder = {
    explanation:q("#guided-path-conditions p").textContent,
    conditionLabel:q('#guided-path-conditions [aria-label="Path condition 1"]').getAttribute("aria-label"),
    matchType:q("#guided-path-type-0").value,
    expression:q("#guided-path-expression-0").value,
    result:q('#guided-path-conditions [aria-label="Path condition 1"] output').textContent,
    remove:q('#guided-path-conditions [aria-label="Path condition 1"] button').textContent,
    testButton:Array.from(q("#guided-path-conditions").querySelectorAll("button")).find((button) => button.textContent === "Test another path").textContent,
  };
  q("#guided-path-type-0").value = "Path pattern";
  q("#guided-path-type-0").dispatchEvent(new Event("change", { bubbles:true }));
  q("#guided-path-expression-0").value = "/products/*";
  q("#guided-path-expression-0").dispatchEvent(new Event("change", { bubbles:true }));
  q("#guided-test-path").value = "/products/field-notebook";
  q("#guided-test-path").dispatchEvent(new Event("input", { bubbles:true }));
  Array.from(q("#guided-path-conditions").querySelectorAll("button")).find((button) => button.textContent === "Test another path").click();
  const anotherPath = q("#guided-test-path-result").textContent;
  q("#guided-path-type-0").value = "Regular expression";
  q("#guided-path-type-0").dispatchEvent(new Event("change", { bubbles:true }));
  q("#guided-path-expression-0").value = "[";
  q("#guided-path-expression-0").dispatchEvent(new Event("change", { bubbles:true }));
  Array.from(flow.querySelectorAll("button")).find((button) => button.textContent === "Add another path condition").click();
  q("#guided-path-type-1").value = "Regular expression";
  q("#guided-path-type-1").dispatchEvent(new Event("change", { bubbles:true }));
  q("#guided-path-expression-1").value = "(";
  q("#guided-path-expression-1").dispatchEvent(new Event("change", { bubbles:true }));
  Array.from(flow.querySelectorAll("button")).find((button) => button.textContent === "Continue").click();
  const multipleInvalid = {
    focused:document.activeElement === q("#guided-validation-errors"),
    links:Array.from(q("#guided-validation-errors").querySelectorAll("a")).map((link) => [link.textContent, link.getAttribute("href")]),
    inline:Array.from(flow.querySelectorAll("[data-inline-error]")).map((error) => error.textContent),
    described:Array.from(flow.querySelectorAll('[aria-invalid="true"]')).map((field) => field.getAttribute("aria-describedby")),
  };
  flow.querySelector('input[name="guided-scope"][value="domain-all-paths"]').click();
  Array.from(flow.querySelectorAll("button")).find((button) => button.textContent === "Continue").click();
  const reviewBeforeBack = q("#guided-validation-review").textContent;
  const reviewStages = Array.from(q("#guided-validation-stages").children).map((item) => [item.textContent, item.dataset.state]);
  clickButton(flow, "Back");
  const retainedScope = flow.querySelector('input[name="guided-scope"]:checked').value;
  clickButton(flow, "Back");
  clickButton(flow, "Back");
  const retainedDestination = { kind:flow.querySelector('input[name="guided-schema-destination"]:checked').value, name:q("#guided-new-schema-name").value };
  clickButton(flow, "Continue");
  clickButton(flow, "Continue");
  clickButton(flow, "Continue");
  q("#guided-advanced-settings summary").click();
  const advanced = {
    rule:q("#guided-ruleName").value,
    source:q("#guided-sourceId").value,
    target:q("#guided-target").value,
    defaults:q("#guided-advanced-settings").querySelector(":scope > p").textContent,
  };
  const publishLabel = q("#guided-publish-rule").parentElement.textContent.trim();
  q("#guided-publish-rule").checked = true;
  const reviewBeforeFailure = q("#guided-validation-review").textContent;
  const beforeFailure = { schemas:JSON.stringify(await readSchemas()), rules:localStorage.getItem("my-chrome-utilities.schema-rule-library.v1") };
  const originalTransaction = IDBDatabase.prototype.transaction;
  let failNextSchemaWrite = true;
  const failureNotice = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { globalThis.removeEventListener("durable-project-save-failed", onFailure); reject(new Error("Timed out waiting for the guided durable schema failure")); }, 3000);
    const onFailure = (event) => {
      if (!String(event.detail?.label ?? "").includes("Signal Shop pageview")) return;
      clearTimeout(timeout);
      globalThis.removeEventListener("durable-project-save-failed", onFailure);
      resolve(event.detail);
    };
    globalThis.addEventListener("durable-project-save-failed", onFailure);
  });
  IDBDatabase.prototype.transaction = function (stores, mode, options) {
    const names = typeof stores === "string" ? [stores] : Array.from(stores);
    if (failNextSchemaWrite && mode === "readwrite" && names.includes("savedSchemas")) {
      failNextSchemaWrite = false;
      throw new DOMException("Injected guided schema quota", "QuotaExceededError");
    }
    return originalTransaction.call(this, stores, mode, options);
  };
  try {
    clickButton(flow, "Add validation to draft");
    await failureNotice;
  } finally {
    IDBDatabase.prototype.transaction = originalTransaction;
  }
  const recovery = await waitForElement("#durable-storage-recovery[open]");
  const recoveryStatus = q("#durable-repository-status").textContent;
  const saveFailure = {
    flowVisible:visible(flow),
    review:reviewBeforeFailure,
    schemasUnchanged:beforeFailure.schemas === JSON.stringify(await readSchemas()),
    rulesUnchanged:beforeFailure.rules === localStorage.getItem("my-chrome-utilities.schema-rule-library.v1"),
    recovery:{
      open:recovery.open,
      named:recoveryStatus.includes("Signal Shop pageview"),
      durableTruth:recoveryStatus.includes("durable Saved Schema Library is unchanged"),
      retryEnabled:!q("#retry-durable-save").disabled,
      exportEnabled:!q("#export-unsaved-draft").disabled,
    },
    retryCommitted:false,
  };
  q("#retry-durable-save").click();
  const storedSchemas = await waitForCondition(async () => {
    const values = await readSchemas();
    return values.some(({ name, workingDraft }) => name === "Signal Shop pageview" && workingDraft) ? values : false;
  }, "retried Signal Shop pageview Saved Schema batch");
  await waitForCondition(() => q("#durable-recovery-result").textContent.includes("committed to the Saved Schema Library"), "durable Saved Schema retry result");
  saveFailure.retryCommitted = true;
  q("#close-storage-recovery").click();
  await waitForCondition(() => !visible(flow) && document.activeElement?.dataset.action === "add-property-validation", "guided retry completion and originating property focus");
  const storedRules = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1") ?? "[]");
  const newSchemaDraft = storedSchemas.at(-1);
  const verification = await import("/data-layer-schema-verification.js");
  const activeDraft = {
    ...newSchemaDraft,
    document:newSchemaDraft.workingDraft.document,
    assignments:newSchemaDraft.workingDraft.assignments,
    attachedRules:newSchemaDraft.workingDraft.attachedRules,
  };
  const guidedEvent = { sourceId:"event-history", eventName:"pageview", payload:{ page_type:"product_list" }, rawInput:[] };
  const savedValidationResult = verification.validateWithSchema(guidedEvent, activeDraft, storedSchemas);
  const legacySchema = {
    ...activeDraft,
    attachedRules:activeDraft.attachedRules.map(({ allowedValues, ...rule }) => ({ ...rule, parameters:rule.propertyPath + ":" + allowedValues.join(",") })),
  };
  const restoredLegacy = verification.restoreSchemaLibrary(JSON.stringify([legacySchema]))[0];
  const legacyValidationResult = verification.validateWithSchema(guidedEvent, restoredLegacy, [restoredLegacy]);
  const exportedLegacy = verification.restoreSchemaLibrary(verification.serializeSchemaLibrary([legacySchema]))[0];
  const saved = {
    schemas:Number(storedSchemas.some(({ id }) => id === "schema:signal-shop-pageview:1") && !beforeSchemaIds.has("schema:signal-shop-pageview:1")),
    reusableRules:storedRules.length - before.rules,
    published:newSchemaDraft.published,
    pendingChanges:newSchemaDraft.workingDraft.pendingChanges,
    localRules:newSchemaDraft.workingDraft.attachedRules.length,
    assignment:newSchemaDraft.workingDraft.assignments[0],
    flowClosed:!visible(flow),
    inspectorRestored:visible(q("#live-event-inspector")),
    status:q("#live-session-message").textContent,
    focusReturned:document.activeElement?.dataset.action === "add-property-validation",
    nextActions:Array.from(q("#guided-draft-continuation").querySelectorAll("button")).map(({ textContent }) => textContent),
    attachedRule:newSchemaDraft.workingDraft.attachedRules[0],
    validation:{ state:savedValidationResult.state, issues:savedValidationResult.issues.length, evaluations:savedValidationResult.evaluations.map(({ propertyPath, status, expected, actual }) => ({ propertyPath, status, expected, actual })) },
    legacy:{ allowedValues:restoredLegacy.attachedRules[0].allowedValues, state:legacyValidationResult.state, issues:legacyValidationResult.issues.length, evaluations:legacyValidationResult.evaluations.map(({ propertyPath, status, expected, actual }) => ({ propertyPath, status, expected, actual })), exportedAllowedValues:exportedLegacy.attachedRules[0].allowedValues },
  };
  const reusableRules = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1") ?? "[]");
  const unpublishedChoiceAbsent = !Array.from(q("#schema-assignment-schema").options).some(({ textContent }) => textContent.startsWith("Signal Shop pageview"));
  clickButton(q("#guided-draft-continuation"), "Publish revision");
  q("#confirm-schema-revision").click();
  const schemasAfterPublication = await waitForCondition(async () => {
    const values = await readSchemas();
    return values.some(({ name, published, version }) => name === "Signal Shop pageview" && published && version === 1) ? values : false;
  }, "published Signal Shop pageview schema");
  const rulesAfterPublication = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1") ?? "[]");
  const publishedSchema = schemasAfterPublication.find(({ name }) => name === "Signal Shop pageview");
  const published = {
    label:publishLabel,
    reusableRules:rulesAfterPublication.length - before.rules,
    attachedRuleId:publishedSchema.attachedRules[0].id,
    reusableRuleId:rulesAfterPublication.at(-1).id,
    unpublishedChoiceAbsent,
    assignableAfterPublication:Array.from(q("#schema-assignment-schema").options).some(({ textContent }) => textContent.startsWith("Signal Shop pageview version 1")),
    currentRevision:publishedSchema.version,
    historicalRevisions:publishedSchema.revisionHistory.length,
    attachedRule:publishedSchema.attachedRules[0],
    reusableRule:rulesAfterPublication.at(-1),
  };
  q("#data-layer-view-live").click();
  q("#live-event-feed button").click();
  q('#live-event-inspector button[aria-label="Add validation for /page_type"]').click();
  flow.querySelector('input[name="guided-schema-destination"][value="existing"]').click();
  const existingOptions = Array.from(q("#guided-schema-results").querySelectorAll(":scope > article")).map((row) => ({
    label:row.querySelector("h6").textContent,
    disabled:row.querySelector("button").disabled,
    explanation:row.querySelectorAll("p")[1].textContent.replace("Property compatibility: ", ""),
  }));
  clickButton(q("#guided-schema-picker"), "Select Product listing version 3");
  clickButton(flow, "Continue");
  q("#guided-requirement").value = "Must be one of these values";
  q("#guided-requirement").dispatchEvent(new Event("change", { bubbles:true }));
  clickButton(flow, "Add another value");
  q("#guided-allowed-value-2").value = "homepage";
  q("#guided-allowed-value-2").dispatchEvent(new Event("input", { bubbles:true }));
  clickButton(flow, "Continue");
  clickButton(flow, "Continue");
  const existingReview = q("#guided-validation-review").textContent;
  clickButton(flow, "Add validation to draft");
  const afterExistingSchemas = await waitForCondition(async () => {
    const values = await readSchemas();
    const product = values.find(({ name }) => name === "Product listing");
    return product?.workingDraft?.attachedRules?.length ? values : false;
  }, "Product listing guided working draft");
  const productVersions = afterExistingSchemas.filter((schema) => schema.name === "Product listing");
  const existingSaved = {
    versions:productVersions.map(({ version }) => version),
    currentRules:productVersions[0].attachedRules?.length ?? 0,
    draftRules:productVersions[0].workingDraft?.attachedRules?.length ?? 0,
    pendingChanges:productVersions[0].workingDraft?.pendingChanges,
    assignments:productVersions[0].workingDraft?.assignments.length,
    flowClosed:!visible(flow),
    inspectorRestored:visible(q("#live-event-inspector")),
    status:q("#live-session-message").textContent,
    focusReturned:document.activeElement?.dataset.action === "add-property-validation",
  };
  clickButton(q("#guided-draft-continuation"), "Publish revision");
  q("#confirm-schema-revision").click();
  q("#data-layer-view-live").click();
  q("#live-event-feed button").click();
  q('#live-event-inspector button[aria-label="Add validation for /page_type"]').click();
  flow.querySelector('input[name="guided-schema-destination"][value="existing"]').click();
  clickButton(q("#guided-schema-picker"), "Select Generic pageview version 4");
  clickButton(flow, "Continue");
  const schemaPrefillRequirement = {
    expectedType:q("#guided-expected-type").value,
    expectedTypeSource:q("#guided-expected-type-hint").textContent,
    target:q("#guided-target").value,
  };
  q("#guided-requirement").value = "Must be present";
  q("#guided-requirement").dispatchEvent(new Event("change", { bubbles:true }));
  clickButton(flow, "Continue");
  const schemaPrefillScope = {
    configurationAbsent:!flow.querySelector("#guided-routing-prefills"),
    selectionAbsent:!flow.querySelector("#guided-compatible-assignments"),
  };
  clickButton(flow, "Back");
  clickButton(flow, "Back");
  clickButton(flow, "Change existing schema");
  clickButton(q("#guided-schema-picker"), "Select Existing pageview version 1");
  clickButton(flow, "Continue");
  clickButton(flow, "Continue");
  q("#guided-scope-domain").value = "operator.example";
  q("#guided-scope-domain").dispatchEvent(new Event("change", { bubbles:true }));
  clickButton(flow, "Back");
  clickButton(flow, "Back");
  clickButton(flow, "Change existing schema");
  clickButton(q("#guided-schema-picker"), "Select Generic pageview version 4");
  const replacement = flow.querySelector("#guided-prefill-replacement-review");
  const replacementReview = {
    items:replacement ? Array.from(replacement.querySelectorAll("li")).map((item) => item.textContent) : [],
    actions:replacement ? Array.from(replacement.querySelectorAll("button")).map((button) => button.textContent) : [],
  };
  if (replacement) clickButton(replacement, "Keep current values");
  const keptStatus = replacement ? q("#guided-validation-status").textContent : "No covering assignment values were replaced.";
  clickButton(flow, "Change existing schema");
  clickButton(q("#guided-schema-picker"), "Select Existing pageview version 1");
  clickButton(flow, "Change existing schema");
  clickButton(q("#guided-schema-picker"), "Select Generic pageview version 4");
  const acceptance = flow.querySelector("#guided-prefill-replacement-review");
  if (acceptance) clickButton(acceptance, "Accept schema-derived values");
  const acceptedStatus = acceptance ? q("#guided-validation-status").textContent : "The covering assignment remained selected.";
  const core = await import("/data-layer-guided-validation.js");
  const productionDraft = core.selectGuidedProperty(core.createGuidedValidationDraft({ id:"event:pageview", name:"pageview", sourceId:"event-history", pageUrl:"http://127.0.0.1:4173/", payload:{ page_type:"product_list" } }), "page_type");
  const overridden = core.setExpectedType(core.setGuidedRequirement(productionDraft, "Must match a pattern"), "Number");
  const configuredDestinationDraft = { ...core.setAllowedValue(core.addAllowedValue(core.setGuidedRequirement(productionDraft, "Must be one of these values")), 1, "homepage"), stage:"destination" };
  const matchingDestinationReview = core.advanceGuidedValidation(core.advanceGuidedValidation(core.advanceGuidedValidation(core.setGuidedSchemaDestination(configuredDestinationDraft, { kind:"existing", schemaId:"schema:product-listing:3", schemaName:"Product listing", schemaVersion:3, matchingAssignment:true }))));
  const absentDestinationReview = core.advanceGuidedValidation(core.advanceGuidedValidation(core.advanceGuidedValidation(core.setGuidedSchemaDestination(configuredDestinationDraft, { kind:"existing", schemaId:"schema:product-listing:3", schemaName:"Product listing", schemaVersion:3, matchingAssignment:false }))));
  const productionDestinationOptions = core.schemaDestinationOptions(configuredDestinationDraft, [
    { id:"schema:existing-pageview:1", name:"Existing pageview", version:1, target:"payload", propertyTypes:{} },
    { id:"schema:product-listing:3", name:"Product listing", version:3, target:"payload", propertyTypes:{ page_type:"String" } },
    { id:"schema:numeric-page-types:1", name:"Numeric page types", version:1, target:"payload", propertyTypes:{ page_type:"Number" } },
    { id:"schema:raw-pageview:1", name:"Raw pageview", version:1, target:"raw input", propertyTypes:{} },
  ]).map(({ name, target, propertyTypes, available, explanation }) => ({ name, target, propertyState:propertyTypes.page_type ?? "absent", available, explanation }));
  const assignmentTemplate = { id:"assignment:one", name:"Local pages", sourceId:"event-history", eventName:"pageview", target:"payload", domainCondition:"127.0.0.1", pathConditions:[{ matchType:"Exact path", expression:"/" }], enabled:true };
  const assignmentResolutions = [0, 1, 2].map((count) => {
    const resolved = core.applyGuidedSchemaCandidate({ ...productionDraft, stage:"destination" }, {
      id:"schema:resolution:" + count,
      name:"Resolution schema",
      version:4,
      target:"payload",
      propertyTypes:{ page_type:"String" },
      assignments:Array.from({ length:count }, (_, index) => ({ ...assignmentTemplate, id:"assignment:" + index, name:"Local pages " + (index + 1) })),
    });
    return { count, selection:resolved.assignmentResolution.selection, domain:resolved.scope.domain, pathConditions:resolved.scope.conditions };
  });
  const coverageCandidate = (state) => ({
    id:"schema:coverage:" + state,
    name:"Coverage schema",
    version:4,
    target:"payload",
    propertyTypes:{ page_type:"String" },
    assignments:state === "none" ? []
      : state === "two" ? [assignmentTemplate, { ...assignmentTemplate, id:"assignment:two", name:"Alternate local pages" }]
      : state === "url-mismatch" ? [{ ...assignmentTemplate, domainCondition:"other.example" }]
      : state === "disabled" ? [{ ...assignmentTemplate, enabled:false }]
      : [assignmentTemplate],
  });
  const coverageVocabulary = {
    none:"no assignments",
    one:"one enabled assignment covers source, event, target, and URL",
    two:"two enabled assignments cover the captured event",
    "url-mismatch":"source, event, and target match but URL conditions do not",
    disabled:"only a disabled assignment covers the captured event",
  };
  const assignmentCoverage = ["none", "one", "two", "url-mismatch", "disabled"].map((state) => {
    const resolved = core.applyGuidedSchemaCandidate({ ...productionDraft, stage:"destination" }, coverageCandidate(state));
    const action = core.assignmentGuidedAction(resolved);
    const configuration = core.assignmentConfigurationRequired(resolved);
    return {
      state:coverageVocabulary[state],
      configuration:configuration ? "displayed" : "not displayed",
      action:action === "add the reviewed assignment as a pending change" ? "add a reviewed pending assignment" : action,
      continuation:configuration ? "allowed after assignment review" : action === "reuse existing schema coverage" ? "allowed without assignment selection" : "allowed without assignment review",
    };
  });
  const pendingDestination = core.applyGuidedSchemaCandidate({ ...configuredDestinationDraft, stage:"destination" }, {
    ...coverageCandidate("one"),
    id:"schema:product-listing:3",
    name:"Product listing",
    version:3,
    assignments:[{ ...assignmentTemplate, pending:true }],
  });
  const pendingDestinationReview = core.advanceGuidedValidation(core.advanceGuidedValidation(pendingDestination));
  const production = {
    requirements:Object.fromEntries(["String", "Number", "Array", "Object", "Boolean"].map((type) => [type, core.compatibleRequirements(type)])),
    allowedValues:[[], ["homepage", "homepage"], ["product_list", ""], ["product_list", "homepage"]].map((values) => core.validateAllowedValues(values)),
    paths:[
      ["Exact path", "/products", "/products"],
      ["Exact path", "/products", "/products/field-notebook"],
      ["Path pattern", "/products/*", "/products/field-notebook"],
      ["Regular expression", "^/products/[a-z-]+$", "/products/field-notebook"],
      ["Regular expression", "^/products/[a-z-]+$", "/shop/products/field-notebook"],
      ["Exact path", "/products", "https://127.0.0.1/products?sort=price#details"],
      ["Exact path", "/products", "https://127.0.0.1/products/field-notebook?x=1"],
    ].map(([matchType, expression, pathname]) => core.pathConditionResult({ matchType, expression }, pathname)),
    combined:core.pathConditionsResult([{ matchType:"Exact path", expression:"/" }, { matchType:"Path pattern", expression:"/products/*" }], "/products/field-notebook"),
    malformed:core.pathConditionResult({ matchType:"Regular expression", expression:"[" }, "/"),
    override:{ typeSource:overridden.property.typeSource, currentEventPasses:overridden.preview.currentEventPasses, message:overridden.preview.message, correctionRequired:overridden.requirementCorrectionRequired },
    destinationOptions:productionDestinationOptions,
    assignmentResolutions,
    assignmentCoverage,
    destinations:{
      matching:{ review:matchingDestinationReview.review, assignmentAction:core.publishGuidedValidation(matchingDestinationReview, false).destination.assignmentAction },
      pending:{ review:pendingDestinationReview.review, assignmentAction:core.publishGuidedValidation(pendingDestinationReview, false).destination.assignmentAction },
      absent:{ review:absentDestinationReview.review, assignmentAction:core.publishGuidedValidation(absentDestinationReview, false).destination.assignmentAction },
    },
  };
  localStorage.clear();
  for (const [key, value] of Object.entries(storedState)) localStorage.setItem(key, value);
  return { initial, invalid, requirement, values, scope, pathBuilder, anotherPath, multipleInvalid, destinationInitial, blankNameAssistance, duplicateNameAssistance, newNameAssistance, reviewBeforeBack, reviewStages, retainedDestination, retainedScope, advanced, saveFailure, saved, published, existingOptions, existingReview, existingSaved, schemaPrefillRequirement, schemaPrefillScope, replacementReview, keptStatus, acceptedStatus, production };
})()`;
