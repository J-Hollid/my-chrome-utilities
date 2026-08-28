import nodeAssert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import {
  boundedDiagnostic,
  createBrowserPhaseTimer,
  observeBrowserReadiness,
  transmitDevtoolsProgram,
  waitForChromeDebuggingPort,
  withDevtoolsProtocolDeadline,
} from "./browser-observation-control.mjs";

export async function runSidePanelBrowserFixture({
  definitions = [], fixturePrograms = {}, processResources,
  environment = process.env, manageLifecycle = true,
  targetContext:suppliedTargetContext, emit = console.log,
  recordAssertion, recordViewport,
} = {}) {

const console = Object.freeze({ log:emit });

const deferredAssertions = suppliedTargetContext?.deferredAssertions;
const assertionMethods = [
  "deepEqual", "doesNotMatch", "equal", "fail", "match", "notDeepEqual", "notEqual", "ok",
];
const assertionSite = (method) => {
  const frames = String(new Error().stack).split(/\r?\n/u)
    .filter((line) => line.includes("side-panel-browser-fixture-primitives.mjs:"));
  const location = frames[2]?.match(/:(\d+):(\d+)\)?$/u);
  if (!location) throw new Error(`Cannot identify direct assertion site for ${method}`);
  return `${method}@${location[1]}:${location[2]}`;
};
const assert = Object.freeze(Object.fromEntries(assertionMethods.map((method) => [method, (...args) => {
  if (!deferredAssertions) {
    const result = nodeAssert[method](...args);
    recordAssertion?.(assertionSite(method));
    return result;
  }
  const snapshots = args.map((value) => {
    try { return structuredClone(value); } catch { return value; }
  });
  const site=assertionSite(method);deferredAssertions.push(() => {try{return nodeAssert[method](...snapshots);}catch(error){throw new Error(`${error.message} [${site}; values ${JSON.stringify(snapshots)}]`,{cause:error});}});
}])))

if (!processResources) throw new Error("The installed session must provide browser process resources");
const { assetPort, chrome } = processResources;

const { payloadPathFilterPickerRuntime, singleLiveEventFeedRuntime, savedSessionLiveFeedRuntime, savedSessionLiveFeedReloadRuntime, freshLiveSessionRuntime, freshLiveSessionReloadRuntime, savedEventFeedFiltersSeedRuntime, savedEventFeedFiltersRuntime, libraryDirectTemplatePushSeedRuntime, libraryDirectTemplatePushRuntime, schemaPropertyRemovalRuntime, schemaPropertyRemovalReloadRuntime, schemaAssignmentRuntime, schemaRevisionLifecycleRuntime, schemaPropertyRulePickerRuntime, schemaAssignmentDataConditionsRuntime, schemaManualPropertyRuntime, schemaManualPropertyReloadRuntime, schemaContainerChildRuntime, schemaContainerChildReloadRuntime, schemaRenamingDraftRuntime, schemaRenamingPublishRuntime, schemaRenamingRetryReplayRuntime, schemaRenamingRejectRuntime, schemaRenamingInvalidAndDiscardRuntime, schemaNestedPathRuntime, schemaRevisionLifecycleUiRuntime, schemaSourceCreationRuntime, schemaInheritanceRuntime, schemaLibraryTransferRuntime, schemaLiveValidationRuntime, guidedRuntimeWaitHelpers, guidedTransportProjectSetupRuntime, guidedTransportProjectRestoreRuntime, guidedDestinationOptionsRuntime, guidedNestedPropertyMergeRuntime, guidedNestedConstraintRuntime, guidedValidationRuntime, guidedSchemaPickerRuntime, guidedDraftContinuationInitialRuntime, guidedDraftContinuationRuntime, guidedDraftContinuationReloadRuntime, guidedAssignmentCoverageRuntime, liveGuidedConditionalRuleSeedRuntime, liveGuidedConditionalRuleRuntime, schemaPropertyCopyRuntime, schemaPropertyTypeEditingSeedRuntime, schemaPropertyTypeEditingRuntime, schemaPropertyTypeEditingItemRuntime, allowedValuesRuleMigrationCoverageRuntime, liveSchemaPropertyDeclarationSeedRuntime, liveSchemaPropertyDeclarationRuntime, localRulePromotionSeedRuntime, localRulePromotionAvailabilitySeedRuntime, localRulePromotionAvailabilityRuntime, localRulePromotionOpenRuntime, localRuleEditingSeedRuntime, localRuleEditingRuntime, localRuleEditingRenderedRuntime, reusableRuleSyncSeedRuntime, reusableRuleSyncRuntime, requiredRuleTypeIndependenceSeedRuntime, requiredRuleTypeIndependenceRuntime, localRulePromotionReusableOriginRuntime, localRulePromotionOriginCountRuntime, localRulePromotionInheritedSeedRuntime, localRulePromotionInheritedCountRuntime, localRulePromotionReviewRuntime, localRulePromotionPrepareConfirmRuntime, localRulePromotionFailureRuntime, localRulePromotionAfterRuntime, allowedValueExpansionSeedRuntime, allowedValueExpansionRuntime, conditionalValidationRulesRuntime, schemaRulePropertyIdentityRuntime, canonicalDeclaredPropertyValidationRuntime, recursiveDeclaredPropertyValidationRuntime, recursivePropertyValidationRuntime, liveValidationVisualsRuntime, validationPresenceSemanticsRuntime, schemaDocumentationRuntime, schemaPropertyExampleValuesRuntime, schemaSpecificationBuilderSeedRuntime, schemaSpecificationBuilderRuntime, schemaSpecificationBuilderCustomizationRuntime, schemaSpecificationBuilderExtendedRuntime, schemaSpecificationExampleSelectionRuntime, schemaSpecificationPreviewLayoutRuntime, schemaSpecificationPreviewThemeRuntime, schemaPropertyCommentsRuntime, schemaSpecificationContainerDefaultsRuntime, schemaPropertyCommentsLiveRuntime, schemaPropertyCommentsLifecycleRuntime, schemaPropertyCommentsRemovalRuntime, schemaPropertyCommentsSpecificationSeedRuntime, schemaPropertyCommentsSpecificationContractRuntime, reproductionStepActionRowsRuntime, defectReportUndeclaredRemovalRuntime, requiredPropertyDefectSchemaChoicesRuntime, defectReportSemanticDifferencesRuntime, eventOccurrenceDefectReportRuntime, defectReportProvenancePresentationRuntime, missingEventDefectReportRuntime, defectLibrarySeedRuntime, defectLibraryRuntime, schemaViewContainmentRuntime, workspacePanelContainmentRuntime } = fixturePrograms;
const { liveTargetPermissionRecoveryWiringRuntime } = fixturePrograms;
const fixturePhasePrograms = new Set(Object.entries(fixturePrograms)
  .filter(([name]) => /(?:Seed|Setup|Initial)Runtime$/u.test(name))
  .map(([, program]) => program));

async function runInstalledPhase(phase, work) {
  return suppliedTargetContext?.runPhaseScoped
    ? suppliedTargetContext.runPhaseScoped(phase, work)
    : work();
}

const schemaWorkspaceAdapterObservations = [];
let guidedValidationObservation;
let guidedSchemaPickerObservation;
let liveValidationVisualsObservation;
let singleLiveEventFeedObservation;
let liveTargetPermissionRecoveryWiringObservation;
let schemaViewContainmentObservation;
let payloadPathFilterPickerObservation;
const reproductionStepActionRowsObservations = [];
let schemaRevisionLifecycleObservation;
let schemaRevisionLifecycleUiObservation;
let guidedDraftContinuationObservation;
let guidedDraftContinuationInitialObservation;
let guidedDraftContinuationReloadObservation;
let schemaPropertyRulePickerObservation;
let schemaRulePropertyIdentityObservation;
let canonicalDeclaredPropertyValidationObservation;
let recursiveDeclaredPropertyValidationObservation;
let schemaManualPropertyObservation;
let schemaContainerChildObservation;
let schemaRenamingObservation;
let schemaPropertyFilterSortObservation;
let schemaNestedPathObservation;
let savedSessionLiveFeedObservation;
let savedSessionLiveFeedReloadObservation;
let freshLiveSessionObservation;
let freshLiveSessionReloadObservation;
let schemaPropertyRemovalObservation;
let schemaPropertyRemovalReloadObservation;
let workspacePanelContainmentObservation;
let recursivePropertyValidationObservation;
let guidedAssignmentCoverageObservation;
let conditionalValidationRulesObservation;
let schemaDocumentationObservation;
let missingEventDefectReportObservation;
let validationPresenceSemanticsObservation;
let defectLibraryObservation;
let schemaPublicationRefreshObservation;
let allowedValueExpansionObservation;
let localRulePromotionObservation;
let localRulePromotionAvailabilityObservation;
let localRuleEditingObservation;
let reusableRuleSyncObservation;
let requiredRuleTypeIndependenceObservation;
let specificationProjectObservation;
let liveGuidedConditionalRuleObservation;
let savedEventFeedFiltersObservation;
let defectReportUndeclaredRemovalObservation;
let defectReportComponentOptionsObservation;
let requiredPropertyDefectSchemaChoicesObservation;
let defectReportSemanticDifferencesObservation;
let defectReportProvenancePresentationObservation;
let eventOccurrenceDefectReportObservation;
let schemaPropertyCopyObservation;
let schemaAssignmentDataConditionsObservation;
let schemaPropertyExampleValuesObservation;
let guidedNestedPropertyMergeObservation;
let libraryDirectTemplatePushObservation;
let liveSchemaPropertyDeclarationObservation;
let schemaSpecificationBuilderObservation;
let schemaSpecificationBuilderCustomizationObservation;
let schemaSpecificationExampleSelectionObservation;
let schemaSpecificationPreviewLayoutObservation;
let schemaPropertyTypeEditingObservation;
let schemaSpecificationContainerDefaultsObservation;
let allowedValuesRuleMigrationObservation;
let schemaPropertyCommentsObservation;
let schemaCardinalityComparisonObservation;
let schemaDeclaredPropertyExceptionsObservation;
let jsonSchemaExportObservation;
let arrayValidationRollupObservation;

const plannerEnvironment = Object.freeze({ ...(suppliedTargetContext?.environment ?? environment) });
let activeBrowserTargetEnvironment = plannerEnvironment;
let activeLogicalTargetId = "side-panel-component-layout";
const targetDefinitions = new Map(definitions.map((definition) => [definition.id, definition]));
const browserTargetIds = definitions.length
  ? definitions.map(({ id }) => id)
  : JSON.parse(plannerEnvironment.SWARMFORGE_BROWSER_TARGET_IDS ?? "[]");
const browserTargetConfigurations = definitions.length
  ? Object.fromEntries(definitions.map(({ id, configuration }) => [id, configuration]))
  : JSON.parse(plannerEnvironment.SWARMFORGE_BROWSER_TARGET_CONFIGURATIONS ?? "{}");
if (!Array.isArray(browserTargetIds) || new Set(browserTargetIds).size !== browserTargetIds.length ||
    browserTargetIds.some((id) => typeof id !== "string" || !browserTargetConfigurations[id] ||
      Array.isArray(browserTargetConfigurations[id]))) {
  throw new Error("Browser target batches require unique ids with exact target configurations");
}
const browserTargetEnvironmentNames = new Set(Object.values(browserTargetConfigurations)
  .flatMap((environment) => Object.keys(environment)));
const activateBrowserTarget = (id) => {
  const targetEnvironment = { ...plannerEnvironment };
  for (const name of Object.keys(targetEnvironment)) {
    if (name.endsWith("_BROWSER_ADAPTER") || browserTargetEnvironmentNames.has(name)) {
      delete targetEnvironment[name];
    }
  }
  if (id) Object.assign(targetEnvironment, browserTargetConfigurations[id]);
  activeBrowserTargetEnvironment = Object.freeze(targetEnvironment);
  activeLogicalTargetId = id ?? "side-panel-component-layout";
};
let requestedBrowserAdapter;
let runGuidedDraftContinuationRuntime;
let runSchemaRevisionLifecycleRuntime;
let runExtendedSchemaWorkspaceRuntime;
let runSchemaViewContainmentRuntime;
let runWorkspacePanelContainmentRuntime;
let componentWidths;
let schemaLibraryExportFixture;
function refreshBrowserTargetRuntime() {
  requestedBrowserAdapter = Object.entries(activeBrowserTargetEnvironment)
    .some(([name, value]) => name.endsWith("_BROWSER_ADAPTER") && value === "1");
  runGuidedDraftContinuationRuntime = activeBrowserTargetEnvironment.GUIDED_DRAFT_CONTINUATION_BROWSER_ADAPTER === "1" || !requestedBrowserAdapter;
  runSchemaRevisionLifecycleRuntime = activeBrowserTargetEnvironment.SCHEMA_REVISION_LIFECYCLE_BROWSER_ADAPTER === "1" || !requestedBrowserAdapter;
  runExtendedSchemaWorkspaceRuntime = activeBrowserTargetEnvironment.SCHEMA_WORKSPACE_BROWSER_ADAPTER === "1" || !requestedBrowserAdapter;
  runSchemaViewContainmentRuntime = activeBrowserTargetEnvironment.SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER === "1" || runExtendedSchemaWorkspaceRuntime;
  runWorkspacePanelContainmentRuntime = activeBrowserTargetEnvironment.WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER === "1" || !requestedBrowserAdapter;
  componentWidths = activeBrowserTargetEnvironment.LOCAL_RULE_EDITING_BROWSER_ADAPTER === "1" || activeBrowserTargetEnvironment.REUSABLE_RULE_SYNC_BROWSER_ADAPTER === "1" || activeBrowserTargetEnvironment.REQUIRED_RULE_TYPE_INDEPENDENCE_BROWSER_ADAPTER === "1" || activeBrowserTargetEnvironment.SPECIFICATION_PROJECT_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.LOCAL_RULE_PROMOTION_BROWSER_ADAPTER === "1" ? [320]
  : activeBrowserTargetEnvironment.ARRAY_VALIDATION_ROLLUP_BROWSER_ADAPTER === "1" ? [320]
  : activeBrowserTargetEnvironment.JSON_SCHEMA_EXPORT_BROWSER_ADAPTER === "1" ? [320]
  : activeBrowserTargetEnvironment.SCHEMA_CARDINALITY_COMPARISON_BROWSER_ADAPTER === "1" || activeBrowserTargetEnvironment.SCHEMA_DECLARED_PROPERTY_EXCEPTIONS_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.SCHEMA_SPECIFICATION_BUILDER_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.SCHEMA_SPECIFICATION_BUILDER_CUSTOMIZATION_BROWSER_ADAPTER === "1" ? [320]
  : activeBrowserTargetEnvironment.SCHEMA_SPECIFICATION_EXAMPLE_SELECTION_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.SCHEMA_SPECIFICATION_PREVIEW_LAYOUT_BROWSER_ADAPTER === "1" ? [320]
  : activeBrowserTargetEnvironment.SCHEMA_PROPERTY_TYPE_EDITING_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.SCHEMA_SPECIFICATION_CONTAINER_DEFAULTS_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.ALLOWED_VALUES_RULE_MIGRATION_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.SCHEMA_PROPERTY_COMMENTS_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.LIVE_SCHEMA_PROPERTY_DECLARATION_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.LIBRARY_DIRECT_TEMPLATE_PUSH_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.LOCAL_RULE_PROMOTION_AVAILABILITY_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.LIVE_GUIDED_CONDITIONAL_RULE_BROWSER_ADAPTER === "1" ? [320]
  : activeBrowserTargetEnvironment.SAVED_EVENT_FEED_FILTERS_BROWSER_ADAPTER === "1" ? [320]
  : activeBrowserTargetEnvironment.DEFECT_REPORT_UNDECLARED_REMOVAL_BROWSER_ADAPTER === "1" ? [320]
  : activeBrowserTargetEnvironment.DEFECT_REPORT_COMPONENT_OPTIONS_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.REQUIRED_PROPERTY_DEFECT_SCHEMA_CHOICES_BROWSER_ADAPTER === "1" ? [320]
  : activeBrowserTargetEnvironment.DEFECT_REPORT_SEMANTIC_DIFFERENCES_BROWSER_ADAPTER === "1" ? [320]
  : activeBrowserTargetEnvironment.DEFECT_REPORT_PROVENANCE_PRESENTATION_BROWSER_ADAPTER === "1" ? [320]
  : activeBrowserTargetEnvironment.EVENT_OCCURRENCE_DEFECT_REPORT_BROWSER_ADAPTER === "1" ? [320]
  : activeBrowserTargetEnvironment.SCHEMA_PROPERTY_COPY_BROWSER_ADAPTER === "1" ? [320]
  : activeBrowserTargetEnvironment.SCHEMA_ASSIGNMENT_DATA_CONDITIONS_BROWSER_ADAPTER === "1" ? [320]
  : activeBrowserTargetEnvironment.SCHEMA_PROPERTY_EXAMPLE_VALUES_BROWSER_ADAPTER === "1" ? [320]
  : activeBrowserTargetEnvironment.GUIDED_NESTED_PROPERTY_MERGE_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.RECURSIVE_DECLARED_PROPERTY_VALIDATION_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.CANONICAL_DECLARED_PROPERTY_VALIDATION_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.SCHEMA_RULE_PROPERTY_IDENTITY_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.ALLOWED_VALUE_EXPANSION_BROWSER_ADAPTER === "1" ? [320]
  : activeBrowserTargetEnvironment.SCHEMA_PUBLICATION_REFRESH_BROWSER_ADAPTER === "1" ? [320]
  : activeBrowserTargetEnvironment.RECURSIVE_PROPERTY_VALIDATION_BROWSER_ADAPTER === "1" ? [320]
  : activeBrowserTargetEnvironment.DEFECT_LIBRARY_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.VALIDATION_PRESENCE_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.MISSING_EVENT_DEFECT_REPORT_BROWSER_ADAPTER === "1" || activeBrowserTargetEnvironment.UNIFIED_DEFECT_BUILDER_BROWSER_ADAPTER === "1" || activeBrowserTargetEnvironment.MISSING_EVENT_REPORT_FIDELITY_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.SCHEMA_DOCUMENTATION_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.CONDITIONAL_VALIDATION_RULES_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.GUIDED_ASSIGNMENT_COVERAGE_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.GUIDED_VALIDATION_BROWSER_ADAPTER === "1" ? [320, 720]
  : activeBrowserTargetEnvironment.SCHEMA_WORKSPACE_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.SAVED_SESSION_LIVE_FEED_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.FRESH_LIVE_SESSION_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.SCHEMA_PROPERTY_REMOVAL_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.SCHEMA_NESTED_PATH_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.SCHEMA_MANUAL_PROPERTY_BROWSER_ADAPTER === "1" ? [320]
  : activeBrowserTargetEnvironment.SCHEMA_RENAMING_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.SCHEMA_PROPERTY_FILTER_SORT_BROWSER_ADAPTER === "1" ? [720]
  : activeBrowserTargetEnvironment.SCHEMA_PROPERTY_RULE_PICKER_BROWSER_ADAPTER === "1" ? [320]
  : activeBrowserTargetEnvironment.REPRODUCTION_STEP_ACTION_ROWS_BROWSER_ADAPTER === "1" ? [360, 520, 1280, 320]
    : activeBrowserTargetEnvironment.GUIDED_DRAFT_CONTINUATION_BROWSER_ADAPTER === "1" || activeBrowserTargetEnvironment.SCHEMA_REVISION_LIFECYCLE_BROWSER_ADAPTER === "1" ? [720]
      : [320, 360, 520, 720];
  schemaLibraryExportFixture = activeBrowserTargetEnvironment.SCHEMA_LIBRARY_EXPORT_FIXTURE ?? "2:4";
}
refreshBrowserTargetRuntime();

const removeExampleSelectionFixture = async (socket) => {
  const removed = await evaluate(socket, `(async()=>{
    const path="/products/*/product_name";
    for(let attempt=0;attempt<240;attempt+=1){
      const schemas=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")||"[]");
      const schema=schemas.find(({name})=>name==="Generic pageview");
      if(schema?.documentation?.properties?.[path]&&
          schema?.workingDraft?.documentation?.properties?.[path]){
        delete schema.documentation.properties[path].example;
        delete schema.workingDraft.documentation.properties[path].example;
        localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify(schemas));
        return true;
      }
      await new Promise((resolve)=>setTimeout(resolve,25));
    }
    return false;
  })()`);
  assert.equal(removed, true, "Generic pageview example-selection fixture did not settle");
};

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function debuggingPort() {
  if (processResources.debuggingPort) return processResources.debuggingPort;
  processResources.debuggingPort = await waitForChromeDebuggingPort({
    chrome, targetId:"side-panel-session", limitMs:30_000, maximumStderrCharacters:2_000,
  });
  return processResources.debuggingPort;
}

async function loadedExtensionId(port) {
  if (processResources.extensionId) return processResources.extensionId;
  const state = await observeBrowserReadiness({
    targetId:"side-panel-session",
    phase:"product readiness",
    predicateDescription:"the unpacked extension service worker",
    timeoutMs:6_000,
    pollIntervalMs:20,
    maximumSnapshotCharacters:600,
    observe:async () => {
      const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
      const target = targets.find(({ type, url }) => type === "service_worker" &&
        url.startsWith("chrome-extension://") && new URL(url).pathname === "/background.js");
      return { ready:Boolean(target), target, targetCount:targets.length };
    },
    ready:({ ready }) => ready,
    snapshot:({ targetCount }) => ({ targetCount }),
  });
  return new URL(state.target.url).hostname;
}

class DevtoolsSocket {
  constructor(url, targetId = activeLogicalTargetId) {
    this.url = new URL(url);
    this.targetId = targetId;
    this.nextId = 1;
    this.pending = new Map();
    this.buffer = Buffer.alloc(0);
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.socket = net.createConnection({ host: this.url.hostname, port: Number(this.url.port) });
      this.socket.once("error", reject);
      this.socket.once("connect", () => {
        const key = Buffer.from(String(Math.random())).toString("base64");
        this.socket.write([
          `GET ${this.url.pathname}${this.url.search} HTTP/1.1`,
          `Host: ${this.url.host}`,
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Key: ${key}`,
          "Sec-WebSocket-Version: 13",
          "\r\n",
        ].join("\r\n"));
      });
      let handshake = "";
      const receiveHandshake = (chunk) => {
        handshake += chunk.toString("binary");
        const end = handshake.indexOf("\r\n\r\n");
        if (end < 0) return;
        this.socket.off("data", receiveHandshake);
        if (!handshake.startsWith("HTTP/1.1 101")) {
          reject(new Error(`DevTools WebSocket upgrade failed: ${handshake.slice(0, end)}`));
          return;
        }
        const remaining = Buffer.from(handshake.slice(end + 4), "binary");
        this.socket.on("data", (data) => this.receive(data));
        if (remaining.length) this.receive(remaining);
        resolve();
      };
      this.socket.on("data", receiveHandshake);
    });
  }

  receive(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (this.buffer.length >= 2) {
      const first = this.buffer[0];
      let length = this.buffer[1] & 0x7f;
      let offset = 2;
      if (length === 126) {
        if (this.buffer.length < 4) return;
        length = this.buffer.readUInt16BE(2);
        offset = 4;
      } else if (length === 127) {
        if (this.buffer.length < 10) return;
        length = Number(this.buffer.readBigUInt64BE(2));
        offset = 10;
      }
      if (this.buffer.length < offset + length) return;
      const payload = this.buffer.subarray(offset, offset + length);
      this.buffer = this.buffer.subarray(offset + length);
      if ((first & 0x0f) !== 1) continue;
      const message = JSON.parse(payload.toString("utf8"));
      const pending = this.pending.get(message.id);
      if (!pending) continue;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    }
  }

  send(payload) {
    const text = Buffer.from(JSON.stringify(payload));
    const mask = Buffer.from([1, 2, 3, 4]);
    let header;
    if (text.length < 126) header = Buffer.from([0x81, 0x80 | text.length]);
    else if (text.length <= 0xffff) {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 0x80 | 126;
      header.writeUInt16BE(text.length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x81;
      header[1] = 0x80 | 127;
      header.writeBigUInt64BE(BigInt(text.length), 2);
    }
    const body = Buffer.from(text);
    for (let index = 0; index < body.length; index += 1) body[index] ^= mask[index % mask.length];
    this.socket.write(Buffer.concat([header, mask, body]));
  }

  call(method, params = {}) {
    const id = this.nextId++;
    this.send({ id, method, params });
    return withDevtoolsProtocolDeadline({
      targetId:this.targetId,
      method,
      limitMs:120_000,
      work:() => new Promise((resolve, reject) => this.pending.set(id, { resolve, reject })),
      onTimeout:() => this.pending.delete(id),
    });
  }

  close() { this.socket?.destroy(); }
}

const panelReadyAttempts = 300;

const registerInstalledHandle = (page, socket) => {
  if (!suppliedTargetContext) return;
  suppliedTargetContext.installedPages?.push({ page, socket });
  suppliedTargetContext.cleanup?.push(() => socket.close());
};

async function waitForPageReadiness(socket, predicateDescription, expression) {
  return observeBrowserReadiness({
    targetId:socket.targetId,
    phase:"product readiness",
    predicateDescription,
    timeoutMs:15_000,
    pollIntervalMs:50,
    maximumSnapshotCharacters:800,
    observe:async () => {
      const result = await transmitDevtoolsProgram({
        targetId:socket.targetId,
        phase:"product readiness",
        source:`({ready:Boolean(${expression}),documentReadyState:document.readyState,href:location.href})`,
        shape:"expression",
        call:socket.call.bind(socket),
        parameters:{ returnByValue:true },
      });
      return result.result.value;
    },
    ready:({ ready }) => ready,
    snapshot:(state) => state,
  });
}

async function openPanel(port, width, height = 900, panelUrl = `http://127.0.0.1:${assetPort}/side-panel.html`) {
  const page = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(panelUrl)}`, { method: "PUT" }).then((response) => response.json());
  const socket = new DevtoolsSocket(page.webSocketDebuggerUrl);
  socket.pageId = page.id;
  await socket.connect();
  registerInstalledHandle(page, socket);
  await socket.call("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
  await socket.call("Runtime.enable");
  await waitForPageReadiness(socket, "the side-panel utility shell",
    "document.readyState === 'complete' && document.querySelector('#side-panel-root')?.dataset.utilityShellReady === 'true' && document.querySelector('#save-and-close-schema') !== null");
  if (panelUrl.startsWith("chrome-extension://")) {
    const permissionSeed = await socket.call("Runtime.evaluate", {
      expression:`(async () => {
        const installedPermissions = globalThis.chrome?.permissions;
        Object.defineProperty(globalThis, "__swarmforgeInstalledPermissions", {
          configurable:true,
          value:installedPermissions,
        });
        Object.defineProperty(globalThis, "__swarmforgeInstalledChrome", {
          configurable:true,
          value:globalThis.chrome,
        });
        const request = { origins:[${JSON.stringify(`http://127.0.0.1:${assetPort}/*`)}] };
        const before = installedPermissions?.contains
          ? await installedPermissions.contains(request) : false;
        const removed = false;
        const after = installedPermissions?.contains
          ? await installedPermissions.contains(request) : false;
        globalThis.__swarmforgePermissionSeedEvidence = { before, removed, after };
        return globalThis.__swarmforgePermissionSeedEvidence;
      })()`,
      awaitPromise:true,
      returnByValue:true,
    });
    emit({ swarmforgePermissionRecoverySeed:permissionSeed.result.value });
  }
  return socket;
}

async function openPanelWithInitialization(port,width,source,height=900){
  const page=await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`,{method:"PUT"}).then((response)=>response.json()),socket=new DevtoolsSocket(page.webSocketDebuggerUrl);await socket.connect();registerInstalledHandle(page,socket);await socket.call("Page.enable");await socket.call("Runtime.enable");await socket.call("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:false});await socket.call("Page.addScriptToEvaluateOnNewDocument",{source});await socket.call("Page.navigate",{url:`http://127.0.0.1:${assetPort}/side-panel.html`});
  await waitForPageReadiness(socket,"the initialized side-panel utility shell","document.readyState === 'complete' && document.querySelector('#side-panel-root')?.dataset.utilityShellReady === 'true' && document.querySelector('#save-and-close-schema') !== null");return socket;
}

async function openSpecificationBuilder(port, width, height = 900, pageUrl = `http://127.0.0.1:${assetPort}/specification-builder.html`) {
  const page = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(pageUrl)}`, { method:"PUT" }).then((response)=>response.json());
  const socket = new DevtoolsSocket(page.webSocketDebuggerUrl); await socket.connect();
  registerInstalledHandle(page, socket);
  await socket.call("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:false});await socket.call("Runtime.enable");
  await waitForPageReadiness(socket,"the Specification Builder form","document.readyState === 'complete' && document.querySelector('#create-project-form') !== null");return socket;
}

async function reloadSpecificationBuilder(socket) {
  const reloadPhase = suppliedTargetContext?.nextReloadPhase ?? "persistence";
  if (suppliedTargetContext) suppliedTargetContext.nextReloadPhase = undefined;
  return runInstalledPhase(reloadPhase, async () => {
    await socket.call("Page.enable");
    await socket.call("Page.reload", { ignoreCache:true });
    await waitForPageReadiness(socket, "the reloaded Specification Builder form",
      "document.readyState === 'complete' && document.querySelector('#create-project-form') !== null");
  });
}

async function evaluate(socket, expression) {
  const fixtureProgramName = Object.entries(fixturePrograms)
    .find(([, program]) => program === expression)?.[0] ?? "inline fixture";
  const fixtureProgram = fixturePhasePrograms.has(expression) || expression.includes("localStorage.clear()");
  const operationPhase = suppliedTargetContext?.browserOperationPhase ??
    (fixtureProgram ? "fixture" : "interaction");
  if (fixtureProgram && suppliedTargetContext) {
    suppliedTargetContext.nextReloadPhase = "fixture";
  }
  return runInstalledPhase(operationPhase, async () => {
    const permissionGestureRequired = expression.includes("await waitForStartableSelectedTarget()");
    const retainedExpression = permissionGestureRequired
      ? `(globalThis.__swarmforgeEvaluationSettled = false,
          globalThis.__swarmforgePermissionRecoveryCoordinates = undefined,
          globalThis.__swarmforgeRetainedEvaluation = Promise.resolve(${expression}).finally(() => {
            globalThis.__swarmforgeEvaluationSettled = true;
          }))`
      : `globalThis.__swarmforgeRetainedEvaluation = (${expression})`;
    let result = await transmitDevtoolsProgram({
      targetId:socket.targetId,
      phase:operationPhase,
      source:retainedExpression,
      shape:"expression",
      call:socket.call.bind(socket),
      parameters:{ returnByValue:!permissionGestureRequired,
        awaitPromise:!permissionGestureRequired, userGesture:true },
    }).catch((error) => {
      error.message += `; fixture ${fixtureProgramName}: ${expression.slice(0, 160)}`;
      throw error;
    });
    if (permissionGestureRequired) {
      processResources.nativePermissionUi ? await drivePermissionRecoveryUserGesture(socket) : await socket.call("Runtime.evaluate", { expression:'document.querySelector("#live-setup-readiness [data-live-target-permission-recovery]")?.click()', userGesture:true });
      result = await transmitDevtoolsProgram({
        targetId:socket.targetId,
        phase:operationPhase,
        source:"globalThis.__swarmforgeRetainedEvaluation",
        shape:"expression",
        call:socket.call.bind(socket),
        parameters:{ returnByValue:true, awaitPromise:true },
      }).catch((error) => {
        error.message += `; retained fixture ${fixtureProgramName}: ${expression.slice(0, 160)}`;
        throw error;
      });
    }
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    }
    return result.result.value;
  });
}

async function drivePermissionRecoveryUserGesture(socket) {
  const gestureSocket = new DevtoolsSocket(socket.url, socket.targetId);
  await gestureSocket.connect();
  let coordinates, lastSignal, panelBroughtToFront = false;
  for (let attempt = 0; attempt < 150; attempt += 1) {
    const signal = await gestureSocket.call("Runtime.evaluate", {
      expression:`({
        coordinates:globalThis.__swarmforgePermissionRecoveryCoordinates,
        settled:globalThis.__swarmforgeEvaluationSettled === true,
        startDisabled:document.querySelector("#start-data-layer-testing")?.disabled,
        targetResult:document.querySelector("#observation-target-result")?.textContent,
        targetList:document.querySelector("#observation-target-list")?.textContent,
        readiness:document.querySelector("#live-setup-readiness")?.textContent,
      })`,
      returnByValue:true,
    });
    lastSignal = signal.result.value;
    coordinates = signal.result.value.coordinates;
    if (coordinates) break;
    if (!panelBroughtToFront && signal.result.value.readiness?.includes("Request access")) {
      await gestureSocket.call("Page.bringToFront");
      panelBroughtToFront = true;
    }
    if (signal.result.value.settled) {
      gestureSocket.close();
      return;
    }
    await wait(20);
  }
  if (!coordinates) {
    gestureSocket.close();
    throw new Error(`Permission recovery action did not become visible; ${JSON.stringify(lastSignal)}`);
  }
  const { x, y } = coordinates;
  await gestureSocket.call("Page.bringToFront");
  emit({ swarmforgePermissionRecoveryGesture:{ state:"request-visible",
    targetId:socket.targetId } });
  try {
    await gestureSocket.call("Input.dispatchMouseEvent", { type:"mouseMoved", x, y });
    await gestureSocket.call("Input.dispatchMouseEvent", {
      type:"mousePressed", x, y, button:"left", buttons:1, clickCount:1,
    });
    await gestureSocket.call("Input.dispatchMouseEvent", {
      type:"mouseReleased", x, y, button:"left", buttons:0, clickCount:1,
    });
    await observeBrowserReadiness({
      targetId:"side-panel-permission-recovery", phase:"interaction",
      predicateDescription:"the native exact-origin request to become pending",
      timeoutMs:3_000, pollIntervalMs:20, maximumSnapshotCharacters:600,
      observe:async () => (await gestureSocket.call("Runtime.evaluate", {
        expression:"globalThis.__swarmforgePermissionRequestObservation",
        returnByValue:true,
      })).result.value,
      ready:(value) => value?.requested === true,
      snapshot:(value) => value,
    });
    await processResources.acceptNativePermissionPrompt?.(gestureSocket);
    await observeBrowserReadiness({
      targetId:"side-panel-permission-recovery", phase:"interaction",
      predicateDescription:"the native exact-origin request to settle as granted",
      timeoutMs:3_000, pollIntervalMs:20, maximumSnapshotCharacters:300,
      observe:async () => (await gestureSocket.call("Runtime.evaluate", {
        expression:"globalThis.__swarmforgePermissionRequestObservation",
        returnByValue:true,
      })).result.value,
      ready:(value) => value?.granted === true,
      snapshot:(value) => value,
    });
  } finally {
    gestureSocket.close();
  }
  emit({ swarmforgePermissionRecoveryGesture:{ state:"dispatched",
    targetId:socket.targetId } });
}

async function verifyExactOriginPermissionRecovery(port, extensionId) {
  const targetUrl = `http://127.0.0.1:${assetPort}/observation-target.html`;
  const targetPage = await fetch(
    `http://127.0.0.1:${port}/json/new?${encodeURIComponent(targetUrl)}`,
    { method:"PUT" },
  ).then((response) => response.json());
  const targetSocket = new DevtoolsSocket(targetPage.webSocketDebuggerUrl);
  await targetSocket.connect();
  await targetSocket.call("Runtime.enable");
  await waitForPageReadiness(targetSocket, "the exact-origin observation target",
    "document.readyState === 'complete' && Array.isArray(globalThis.dataLayer)");
  const socket = await openPanel(port, 720, 900,
    `chrome-extension://${extensionId}/side-panel.html`);
  await targetSocket.call("Page.bringToFront");
  try {
    const observation = await evaluate(socket, `(async () => {
      ${guidedRuntimeWaitHelpers}
      const q = (selector) => {
        const value = document.querySelector(selector);
        if (!value) throw new Error("Missing " + selector);
        return value;
      };
      const installedPermissions = globalThis.__swarmforgeInstalledPermissions;
      const installedChrome = globalThis.__swarmforgeInstalledChrome;
      const permissionRequests = [];
      const scriptCalls = [];
      globalThis.__swarmforgePermissionScriptCalls = scriptCalls;
      const nativeTabsQuery = installedChrome.tabs.query.bind(installedChrome.tabs);
      installedChrome.tabs.query = async (request) => (await nativeTabsQuery(request)).map((tab) =>
        tab.active ? { ...tab, url:${JSON.stringify(targetUrl)}, title:"Retail confirmation" } : tab);
      const nativePermissionRequest = installedPermissions.request.bind(installedPermissions);
      installedPermissions.request = async (request) => {
        permissionRequests.push(request);
        globalThis.__swarmforgePermissionRequestObservation = { requested:true };
        const granted = await nativePermissionRequest(request);
        globalThis.__swarmforgePermissionRequestObservation = { requested:true, granted };
        return granted;
      };
      const nativeExecuteScript = installedChrome.scripting.executeScript.bind(installedChrome.scripting);
      installedChrome.scripting.executeScript = async (request) => {
        scriptCalls.push({ tabId:request.target?.tabId, args:request.args });
        return nativeExecuteScript(request);
      };
      const historyPath = q("#history-path");
      historyPath.value = "dataLayer";
      historyPath.dispatchEvent(new Event("input", { bubbles:true }));
      q("#choose-observation-target").click();
      await waitForElement("#observation-target-list [data-target-id]");
      q("#close-observation-target-picker").click();
      const requestAccess = await waitForElement(
        "#live-setup-readiness [data-live-target-permission-recovery]");
      const selectedBefore = q("#live-setup-target").textContent.includes("Retail confirmation selected");
      const start = await waitForStartableSelectedTarget();
      return {
        gesture:globalThis.__swarmforgePermissionRecoveryObservation,
        nativeRequest:globalThis.__swarmforgePermissionRequestObservation,
        permissionRequests,
        requestVisible:requestAccess.textContent === "Request access",
        sameTabRechecked:scriptCalls.length === 2 &&
          scriptCalls.every(({ tabId }) => tabId === scriptCalls[0]?.tabId) &&
          scriptCalls.every(({ args }) => args?.[0] === "dataLayer"),
        selectedBefore,
        startEnabled:!start.disabled,
      };
    })()`);
    assert.deepEqual(observation, {
      gesture:{ trusted:true, userActivation:true },
      nativeRequest:{ requested:true, granted:true },
      permissionRequests:[{ origins:[`${new URL(targetUrl).origin}/*`] }],
      requestVisible:true,
      sameTabRechecked:true,
      selectedBefore:true,
      startEnabled:true,
    }, "Installed exact-origin permission recovery did not cross the native request/recheck boundary");
  } finally {
    socket.close();
    targetSocket.close();
  }
}

async function installDurableSchemaObservationProjection(socket) {
  await evaluate(socket, `(async () => {
    const schemaKey = "my-chrome-utilities.schema-library.v1";
    const repositoryModule = await import("./data-layer-durable-project-repository.js");
    const repository = await repositoryModule.openIndexedDbProjectRepository();
    globalThis.__durableSchemaObservation = await repository.savedSchemas();
    globalThis.__readDurableSchemaObservation = () => structuredClone(globalThis.__durableSchemaObservation);
    globalThis.__waitForDurableSchemaObservation = async (predicate, label = "durable Saved Schema projection") => {
      return new Promise((resolve, reject) => {
        const channel = new BroadcastChannel("my-chrome-utilities.durable-saved-schemas"); let checking = false, settled = false, pending = false;
        const finish = (schemas) => { if (!settled) { settled = true; unsubscribe(); channel.close(); resolve(structuredClone(schemas)); } };
        const check = async () => {
          if (checking) { pending = true; return; }
          checking = true; try { do { pending = false; const schemas = await repository.savedSchemas();
            globalThis.__durableSchemaObservation = structuredClone(schemas);
            if (predicate(schemas)) { finish(schemas); return; }
          } while (pending); } catch (error) { if (!settled) { settled = true; unsubscribe(); channel.close(); reject(new Error("Failed while waiting for " + label, { cause:error })); }
          } finally { checking = false; } };
        const unsubscribe = repository.subscribeSavedSchemas(() => { void check(); }); channel.addEventListener("message", () => { void check(); }); void check(); }); };
    if (globalThis.__durableSchemaObservationProjectionInstalled) return true;
    globalThis.__durableSchemaObservationProjectionInstalled = true;
    const storageGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function(key) {
      if (this === globalThis.localStorage && key === schemaKey) return JSON.stringify(globalThis.__durableSchemaObservation);
      return storageGetItem.call(this, key);
    };
    const transactionSchemas = new WeakMap();
    const publishProjectedSchemas = (schemas) => {
      globalThis.__durableSchemaObservation = [...schemas.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([, schema]) => structuredClone(schema));
    };
    const projectedTransaction = (store) => {
      const transaction = store.transaction;
      let schemas = transactionSchemas.get(transaction);
      if (schemas) return schemas;
      const before = structuredClone(globalThis.__durableSchemaObservation);
      schemas = new Map(globalThis.__durableSchemaObservation.map((schema) => [String(schema.id), structuredClone(schema)]));
      transactionSchemas.set(transaction, schemas);
      transaction.addEventListener("complete", () => publishProjectedSchemas(schemas), { once:true });
      transaction.addEventListener("abort", () => { globalThis.__durableSchemaObservation = before; }, { once:true });
      return schemas;
    };
    const objectStorePut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function(value, key) {
      if (this.name === "savedSchemas" && value?.schema) {
        const schemas = projectedTransaction(this);
        schemas.set(String(key ?? value.schema.id), structuredClone(value.schema));
        publishProjectedSchemas(schemas);
      }
      return objectStorePut.call(this, value, key);
    };
    const objectStoreDelete = IDBObjectStore.prototype.delete;
    IDBObjectStore.prototype.delete = function(key) {
      if (this.name === "savedSchemas") {
        const schemas = projectedTransaction(this);
        schemas.delete(String(key));
        publishProjectedSchemas(schemas);
      }
      return objectStoreDelete.call(this, key);
    };
    globalThis.__failNextDurableSchemaWrite = (message = "Simulated durable Saved Schema persistence failure", matches = () => true) => {
      const activePut = IDBObjectStore.prototype.put;
      let armed = true;
      const restore = () => { if (IDBObjectStore.prototype.put === failingPut) IDBObjectStore.prototype.put = activePut; };
      const failingPut = function(value, key) {
        if (armed && this.name === "savedSchemas" && matches(value?.schema)) {
          armed = false;
          globalThis.__lastFailedDurableSchemaBaseline = structuredClone(globalThis.__durableSchemaObservation);
          restore();
          throw new DOMException(message, "QuotaExceededError");
        }
        return activePut.call(this, value, key);
      };
      IDBObjectStore.prototype.put = failingPut;
      return restore;
    };
    let schemaWriteTail = Promise.resolve();
    const canonicalSchemas = (schemas) => [...new Map(schemas.map((schema) => [String(schema.id), structuredClone(schema)])).entries()]
      .sort(([left], [right]) => left.localeCompare(right)).map(([, schema]) => schema);
    const replaceDurableSchemas = async (targetSchemas) => {
      const current = await repository.savedSchemaRecords();
      const currentById = new Map(current.map((record) => [String(record.schema.id), record]));
      const target = canonicalSchemas(targetSchemas), targetIds = new Set(target.map(({ id }) => String(id)));
      const result = await repository.applySavedSchemaBatch({
        upserts:target.map((schema) => {
          const currentRecord = currentById.get(String(schema.id));
          return { schema, ...(currentRecord ? { baseToken:currentRecord.token } : {}) };
        }),
        deletes:current.filter(({ schema }) => !targetIds.has(String(schema.id))).map(({ schema, token }) => ({ schemaId:String(schema.id), baseToken:token })),
        label:"Replace browser-observation Saved Schema fixture",
      });
      if (result.status !== "committed") throw new DOMException("Saved Schema fixture replacement conflicted for " + result.schemaId + ".", "AbortError");
      globalThis.__durableSchemaObservation = structuredClone(target);
    };
    const queueSchemaReplacement = (schemas) => {
      const target = canonicalSchemas(schemas);
      globalThis.__durableSchemaObservation = structuredClone(target);
      const pending = schemaWriteTail.catch(() => {}).then(() => replaceDurableSchemas(target));
      schemaWriteTail = pending;
      return pending;
    };
    globalThis.__flushDurableSchemaObservation = async () => {
      await schemaWriteTail;
      globalThis.__durableSchemaObservation = await repository.savedSchemas();
      return true;
    };
    const storageSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (this === globalThis.localStorage && key === schemaKey) {
        const schemas = JSON.parse(String(value));
        if (!Array.isArray(schemas)) throw new TypeError("The browser-observation Saved Schema fixture must be an array.");
        void queueSchemaReplacement(schemas).catch(() => {});
        return;
      }
      return storageSetItem.call(this, key, value);
    };
    const storageRemoveItem = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function(key) {
      if (this === globalThis.localStorage && key === schemaKey) {
        void queueSchemaReplacement([]).catch(() => {});
        return;
      }
      return storageRemoveItem.call(this, key);
    };
    const storageClear = Storage.prototype.clear;
    Storage.prototype.clear = function() {
      if (this === globalThis.localStorage) void queueSchemaReplacement([]).catch(() => {});
      return storageClear.call(this);
    };
    const elementQuerySelector = Element.prototype.querySelector;
    const elementQuerySelectorAll = Element.prototype.querySelectorAll;
    const documentQuerySelector = Document.prototype.querySelector;
    const documentQuerySelectorAll = Document.prototype.querySelectorAll;
    const propertySelectorPattern = /\\[data-schema-property-(canonical-)?path\\s*=\\s*["']([^"']+)["']\\]/;
    const propertyActionPattern = /button\\[aria-label\\s*=\\s*["'](?:Add rule for|Copy|Remove property|Exclude inherited property)\\s+([^"']+)["']\\]/;
    const propertyTree = () => document.getElementById("schema-property-tree");
    const propertyRows = () => {
      const tree = propertyTree();
      return tree ? Array.from(elementQuerySelectorAll.call(tree, "li[data-schema-property-path]")) : [];
    };
    const currentPropertyRow = (row) => {
      if (!(row instanceof HTMLElement) || row.tagName !== "LI" || !row.dataset.schemaPropertyPath) return row;
      const canonicalPath = row.dataset.schemaPropertyCanonicalPath, displayPath = row.dataset.schemaPropertyPath;
      const connected = propertyTree()?.contains(row) ? row : propertyRows().find((candidate) => (canonicalPath && candidate.dataset.schemaPropertyCanonicalPath === canonicalPath) || candidate.dataset.schemaPropertyPath === displayPath);
      if (!connected) return row;
      if (elementQuerySelector.call(connected, "details[data-attached-rules]")) return connected;
      connected.dispatchEvent(new MouseEvent("click", { bubbles:true }));
      return propertyRows().find((candidate) => (canonicalPath && candidate.dataset.schemaPropertyCanonicalPath === canonicalPath) || candidate.dataset.schemaPropertyPath === displayPath) ?? connected;
    };
    const propertyRowForSelector = (selector) => {
      const match = String(selector).match(propertySelectorPattern);
      if (match) {
        const canonical = Boolean(match[1]), path = match[2];
        return propertyRows().find((row) => canonical ? row.dataset.schemaPropertyCanonicalPath === path : row.dataset.schemaPropertyPath === path);
      }
      const action = String(selector).match(propertyActionPattern), path = action?.[1];
      if (!path) return undefined;
      return propertyRows().find((row) => row.dataset.schemaPropertyPath === path || row.dataset.schemaPropertyCanonicalPath === path);
    };
    Element.prototype.querySelector = function(selector) {
      const root = currentPropertyRow(this);
      let result = elementQuerySelector.call(root, selector);
      if (result) return result;
      const target = propertyRowForSelector(selector);
      if (target) {
        currentPropertyRow(target);
        result = elementQuerySelector.call(root, selector);
      }
      return result;
    };
    Element.prototype.querySelectorAll = function(selector) {
      const root = currentPropertyRow(this), target = propertyRowForSelector(selector);
      if (target && String(selector).slice(String(selector).indexOf(target.dataset.schemaPropertyPath ?? "") + String(target.dataset.schemaPropertyPath ?? "").length).trim()) currentPropertyRow(target);
      return elementQuerySelectorAll.call(root, selector);
    };
    Document.prototype.querySelector = function(selector) {
      let result = documentQuerySelector.call(this, selector);
      if (result) return result;
      const target = propertyRowForSelector(selector);
      if (target) {
        currentPropertyRow(target);
        result = documentQuerySelector.call(this, selector);
      }
      return result;
    };
    Document.prototype.querySelectorAll = function(selector) {
      const target = propertyRowForSelector(selector);
      if (target && String(selector).trim() !== propertySelectorPattern.exec(String(selector))?.[0]) currentPropertyRow(target);
      return documentQuerySelectorAll.call(this, selector);
    };
    return true;
  })()`);
}

async function reloadPanel(socket) {
  const reloadPhase = suppliedTargetContext?.nextReloadPhase ?? "persistence";
  if (suppliedTargetContext) suppliedTargetContext.nextReloadPhase = undefined;
  return runInstalledPhase(reloadPhase, async () => {
  if (suppliedTargetContext) suppliedTargetContext.browserOperationPhase = reloadPhase;
  try {
  for (let reloadAttempt = 0; reloadAttempt < 3; reloadAttempt += 1) {
    await evaluate(socket, `(async () => { if (typeof globalThis.__flushDurableSchemaObservation === "function") await globalThis.__flushDurableSchemaObservation(); return true; })()`);
    const reloadToken = `reload-${Date.now()}-${Math.random()}`;
    await evaluate(socket, `document.documentElement.dataset.componentReloadToken = ${JSON.stringify(reloadToken)}`);
    await socket.call("Page.reload", { ignoreCache:true });
    for (let attempt = 0; attempt < panelReadyAttempts; attempt += 1) {
      const ready = await evaluate(socket, `(() => {
        if (document.readyState !== "complete" || !document.querySelector("#side-panel-root") || document.documentElement.dataset.componentReloadToken === ${JSON.stringify(reloadToken)}) return false;
        return document.querySelector("#side-panel-root")?.dataset.utilityShellReady === "true" && document.querySelector("#schema-count")?.textContent !== "";
      })()`);
      if (ready) {
        if (String(await evaluate(socket, "location.href")).startsWith("chrome-extension://")) {
          await socket.call("Runtime.evaluate", {
            expression:`Object.defineProperty(globalThis, "__swarmforgeInstalledPermissions", {
              configurable:true,
              value:globalThis.chrome?.permissions,
            })`,
          });
        }
        await installDurableSchemaObservationProjection(socket);
        return;
      }
      await wait(50);
    }
  }
  const reloadState = await evaluate(socket, `({
    href:location.href,
    documentReadyState:document.readyState,
    shellReady:document.querySelector("#side-panel-root")?.dataset.utilityShellReady,
    schemaCount:document.querySelector("#schema-count")?.textContent,
    reloadToken:document.documentElement.dataset.componentReloadToken,
  })`);
  throw new Error(`Side panel did not finish reloading; ${JSON.stringify(reloadState)}`);
  } finally {
    if (suppliedTargetContext) suppliedTargetContext.browserOperationPhase = undefined;
  }
  });
}

const fixture = `(() => {
  const text = "Long metadata and form content that must wrap within the side panel component without creating document overflow. ".repeat(8);
  for (const selector of ["#data-layer-panel-live", "#data-layer-panel-library", "#data-layer-panel-sessions", "#data-layer-panel-schemas", "#event-property-editor", "#live-event-inspector"]) document.querySelector(selector).hidden = false;
  document.querySelector("#data-layer-panel-live").dataset.liveLayout = "wide-detail";
  document.querySelector("#event-template-json").value = text;
  document.querySelector("#push-destination-path").value = "analytics.destination.with.a.deliberately.long.name";
  for (const selector of ["#live-event-feed", "#event-template-list", "#saved-session-list", "#schema-list"]) {
    const list = document.querySelector(selector);
    list.replaceChildren(...Array.from({ length: 60 }, (_, index) => {
      const item = document.createElement("li"); item.textContent = \`Fixture item \${index + 1}: \${text}\`; return item;
    }));
  }
  const code = document.createElement("pre"); code.id = "layout-code-fixture"; code.textContent = text.repeat(6); document.querySelector("#live-event-inspector").append(code);
  document.querySelector("#live-target-page").textContent = text;
  return true;
})()`;

const schemaRuleEditorVisibilityRuntime = `(() => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const visible = (element) => element.getClientRects().length > 0;
  const configuration = q("#schema-rule-fields");
  const hiddenByView = {};
  for (const view of ["Live", "Library", "Sessions", "Schemas"]) {
    q("#data-layer-view-" + view.toLowerCase()).click();
    hiddenByView[view] = !visible(configuration);
  }
  q("#schema-subview-rules").click();
  q("#create-schema-rule").click();
  return {
    hiddenByView,
    editorVisible:visible(q("#schema-rule-editor")),
    configurationVisible:visible(configuration),
    configurationInsideEditor:q("#schema-rule-editor").contains(configuration),
  };
})()`;

const installGuidedSavedSchemasRuntime = (schemasExpression) => `(async () => {
  if (typeof globalThis.__flushDurableSchemaObservation === "function") await globalThis.__flushDurableSchemaObservation();
  const { openIndexedDbProjectRepository } = await import("./data-layer-durable-project-repository.js");
  const repository = await openIndexedDbProjectRepository();
  const current = await repository.savedSchemaRecords();
  const target = ${schemasExpression};
  const currentById = new Map(current.map((record) => [String(record.schema.id), record]));
  const targetIds = new Set(target.map(({ id }) => String(id)));
  const upserts = target.flatMap((schema) => {
    const prior = currentById.get(String(schema.id));
    return prior && JSON.stringify(prior.schema) === JSON.stringify(schema)
      ? []
      : [{ schema, ...(prior ? { baseToken:prior.token } : {}) }];
  });
  const deletes = current.filter(({ schema }) => !targetIds.has(String(schema.id))).map(({ schema, token }) => ({ schemaId:String(schema.id), baseToken:token }));
  if (upserts.length || deletes.length) {
    const result = await repository.applySavedSchemaBatch({ upserts, deletes, label:"Install guided browser runtime schemas" });
    if (result.status !== "committed") throw new Error("Guided schema fixture conflicted for " + result.schemaId);
  }
  return current.map(({ schema }) => schema);
})()`;

const naturalLibraryActionsRuntime = `(() => {
  const editor = document.querySelector("#event-property-editor");
  const actions = ["#add-new-event", "#import-event-library", "#export-event-library", "#clear-event-library"].map((selector) => {
    const button = document.querySelector(selector); return { id:button.id, visible:button.getClientRects().length > 0, disabled:button.disabled };
  });
  return {
    editorHidden:editor.hidden,
    editorDisplay:getComputedStyle(editor).display,
    editorOffsetParent:editor.offsetParent === null,
    actions,
    saveLatestPresent:Boolean(document.querySelector("#save-latest-template")),
  };
})()`;

const openLibraryRuntime = `(() => {
  const tab = document.querySelector("#data-layer-view-library");
  tab.click();
  return {
    selected:tab.getAttribute("aria-selected"),
    panelHidden:document.querySelector("#data-layer-panel-library").hidden,
  };
})()`;

const libraryActionsRecoveryRuntime = `(async () => {
  const q = (selector) => {
    const element = document.querySelector(selector);
    if (!element) throw new Error("Missing " + selector);
    return element;
  };
  const visible = (element) => {
    const rect = element.getBoundingClientRect();
    return !element.hidden && getComputedStyle(element).display !== "none" && rect.width > 0 && rect.height > 0;
  };
  const dialogState = (dialog) => {
    const rect = dialog.getBoundingClientRect();
    return {
      hidden: dialog.hidden,
      display: getComputedStyle(dialog).display,
      positiveGeometry: rect.width > 0 && rect.height > 0,
      hiddenAncestor: Boolean(dialog.parentElement?.closest("[hidden]")),
      focused: dialog.contains(document.activeElement),
    };
  };
  const setValue = (selector, value) => {
    const field = q(selector);
    field.value = value;
    field.dispatchEvent(new Event("input", { bubbles:true }));
  };
  const create = (name, eventName, destination, payload) => {
    q("#add-new-event").click();
    const initial = {
      editor: visible(q("#event-property-editor")),
      fields: ["#event-template-name", "#event-template-event-name", "#event-template-source", "#push-destination-path", "#event-template-json"].map((selector) => ({ selector, value:q(selector).value, visible:visible(q(selector)) })),
      saveDisabled:q("#save-template-revision").disabled,
      focused:document.activeElement === q("#event-template-name"),
    };
    q("#event-template-json-section summary").click();
    q("#event-template-execution-settings summary").click();
    setValue("#event-template-name", name);
    setValue("#event-template-event-name", eventName);
    const source = q("#event-template-source");
    source.value = "event-history";
    source.dispatchEvent(new Event("input", { bubbles:true }));
    setValue("#push-destination-path", destination);
    setValue("#event-template-json", JSON.stringify(payload));
    const saveEnabled = !q("#save-template-revision").disabled;
    q("#save-template-revision").click();
    return { initial, saveEnabled };
  };

  const purchase = create("Purchase confirmation", "purchase", "event.history", { ecommerce:{ value:18 }, items:[{ quantity:1 }], legacy:{ debug:true } });
  const close = q("#close-template-editor");
  close.click();
  const closeResult = {
    hidden:q("#event-property-editor").hidden,
    display:getComputedStyle(q("#event-property-editor")).display,
    offsetParent:q("#event-property-editor").offsetParent === null,
    editFocused:document.activeElement === q('[data-template-id]'),
  };
  q('[data-template-id]').click();
  const inlineIdentity = {
    noRename:Boolean(document.querySelector('[aria-label^="Rename "]')) || Boolean(document.querySelector("#event-template-rename")),
    editor:visible(q("#event-property-editor")),
    fields:[q("#event-template-name").disabled, q("#event-template-event-name").disabled],
    values:[q("#event-template-name").value, q("#event-template-event-name").value],
    disclosuresClosed:["#event-template-revision-history-section", "#event-template-properties-section", "#event-template-json-section", "#event-template-execution-settings"].every((selector) => !q(selector).open),
  };
  setValue("#event-template-name", "Completed checkout");
  setValue("#event-template-event-name", "checkout_completed");
  q("#event-template-execution-settings summary").click();
  setValue("#push-destination-path", "queue.history");
  q("#event-template-json-section summary").click();
  setValue("#event-template-json", JSON.stringify({ ecommerce:{ value:19 }, items:[{ quantity:2 }], experiment:{ variant:"treatment-b" } }));
  globalThis.chrome = {
    tabs:{ query:async () => [{ id:7, windowId:1, url:"https://signal.example.test/checkout", title:"Signal Shop", active:true }] },
    scripting:{ executeScript:async () => [{ result:{} }] },
  };
  q("#choose-observation-target").click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  q('#observation-target-list [data-target-id]').click();
  q("#push-template-draft").click();
  const pairs = (root) => [...root.querySelectorAll("dt")].map((term) => [term.textContent, term.nextElementSibling?.textContent]);
  const pushReview = {
    ...dialogState(q("#push-draft-review")),
    details:pairs(q("#push-draft-review-details")),
    changes:[...q("#push-draft-review-change-list").querySelectorAll("dl")].map(pairs),
    confirm:q("#confirm-push-draft").textContent,
  };
  q("#cancel-push-draft").click();
  const pushCancelled = { focused:document.activeElement === q("#push-template-draft"), result:q("#event-template-result").textContent };
  q("#save-template-revision").click();
  const revisionReview = {
    ...dialogState(q("#revision-change-review")),
    details:pairs(q("#revision-change-review [data-change-details]")),
    changes:[...q("#revision-change-review [data-change-list]").querySelectorAll("dl")].map(pairs),
    confirm:q("#confirm-revision-change").textContent,
  };
  q("#revision-change-review").dispatchEvent(new Event("cancel", { cancelable:true }));
  const revisionCancel = { hidden:q("#revision-change-review").hidden, draft:[q("#event-template-name").value, q("#event-template-event-name").value, q("#push-destination-path").value], focused:document.activeElement === q("#save-template-revision") };
  q("#save-template-revision").click();
  q("#confirm-revision-change").click();
  const revisionSaved = { identity:q(".event-template-identity").textContent, result:q("#event-template-result").textContent };
  q("#close-template-editor").click();

  const scroll = create("Scroll milestone", "scroll", "event.history", { scroll_percentage:25 });
  q("#close-template-editor").click();

  let exported;
  const createObjectUrl = URL.createObjectURL;
  URL.createObjectURL = (blob) => { exported = blob; return createObjectUrl.call(URL, blob); };
  try { q("#export-event-library").click(); }
  finally { URL.createObjectURL = createObjectUrl; }
  const exportData = JSON.parse(await exported.text());
  const exportResult = {
    templateNames:exportData.templates.map((template) => template.name).sort(),
    revisions:exportData.templates.map((template) => template.version).sort(),
    payloads:exportData.templates.map((template) => template.payload),
    settings:exportData.templates.map((template) => template.destination),
  };

  q("#clear-event-library").click();
  const clearReview = { ...dialogState(q("#event-library-delete-review")), summary:q("#event-library-delete-review-summary").textContent };
  q("#confirm-event-library-delete").click();
  const cleared = { count:q("#event-template-list").children.length, addAvailable:visible(q("#add-new-event")), importAvailable:visible(q("#import-event-library")) };

  const file = new File([JSON.stringify(exportData)], "event-library.json", { type:"application/json" });
  const fileInput = q("#event-library-file");
  Object.defineProperty(fileInput, "files", { configurable:true, value:[file] });
  fileInput.dispatchEvent(new Event("change", { bubbles:true }));
  await new Promise((resolve) => setTimeout(resolve, 50));
  const importReview = { ...dialogState(q("#event-library-import-review")), replaceVisible:visible(q("#replace-event-library")), appendVisible:visible(q("#append-event-library")) };
  q("#replace-event-library").click();
  const replaceArmed = q("#replace-event-library").textContent;
  q("#replace-event-library").click();
  const restored = {
    names:[...q("#event-template-list").querySelectorAll(".event-template-identity")].map((element) => element.textContent.split(" · ")[0]).sort(),
    persisted:JSON.parse(localStorage.getItem("my-chrome-utilities.event-template-library.v1") ?? "[]").map((template) => template.name).sort(),
  };

  q('[aria-label="Delete Completed checkout"]').click();
  const deleteReview = { ...dialogState(q("#event-library-delete-review")), summary:q("#event-library-delete-review-summary").textContent };
  q("#confirm-event-library-delete").click();
  const afterDelete = [...q("#event-template-list").querySelectorAll(".event-template-identity")].map((element) => element.textContent);
  q("#clear-event-library").click();
  q("#confirm-event-library-delete").click();
  const final = {
    count:q("#event-template-list").children.length,
    persisted:JSON.parse(localStorage.getItem("my-chrome-utilities.event-template-library.v1") ?? "[]").length,
    addAvailable:visible(q("#add-new-event")),
    importAvailable:visible(q("#import-event-library")),
  };
  return { purchase, closeResult, inlineIdentity, pushReview, pushCancelled, revisionReview, revisionCancel, revisionSaved, scroll, exportResult, clearReview, cleared, importReview, replaceArmed, restored, deleteReview, afterDelete, final };
})()`;

const measurements = `(() => {
  const rect = (selector) => { const value = document.querySelector(selector).getBoundingClientRect(); return { x:value.x, y:value.y, width:value.width, height:value.height, right:value.right, bottom:value.bottom }; };
  const css = (selector) => getComputedStyle(document.querySelector(selector));
  const controls = [...document.querySelectorAll('textarea,input[type="text"]')].filter((element) => element.getClientRects().length).map((element) => {
    const parent = element.parentElement; const style = getComputedStyle(parent); const box = element.getBoundingClientRect();
    return { id: element.id, width: box.width, available: parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight), right: box.right, parentRight: parent.getBoundingClientRect().right, parentDisplay:style.display };
  });
  const visibleText = [...document.querySelectorAll("label,button,output,dt,dd")].filter((element) => element.getClientRects().length && !element.classList.contains("visually-hidden")).map((element) => ({ text: element.textContent.trim(), clipped: element.scrollWidth > element.clientWidth + 1 }));
  return {
    document: { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth },
    root: rect("#workspace-panel-data-layer"),
    live: { header:rect("#live-session-header"), source:rect("#live-source-statuses"), master:rect("#live-event-list"), detail:rect("#live-event-inspector"), actions:rect("#live-context-actions"), areas:css("#data-layer-panel-live").gridTemplateAreas },
    library: { master:rect("#event-template-master"), detail:rect("#event-property-editor"), areas:css("#data-layer-panel-library").gridTemplateAreas },
    sessions: { master:rect("#saved-session-master"), detail:rect("#saved-session-detail"), areas:css("#data-layer-panel-sessions").gridTemplateAreas },
    schemas: { master:rect("#schema-master"), detail:rect("#schema-detail"), areas:css("#data-layer-panel-schemas").gridTemplateAreas },
    controls, visibleText,
    actionChildren: [...document.querySelector("#live-context-actions").querySelectorAll("button")].filter((button) => button.getClientRects().length).map((button) => ({ rect: { x:button.getBoundingClientRect().x, right:button.getBoundingClientRect().right }, parent:rect("#live-context-actions") })),
    overflow: ["#live-event-list", "#event-template-list", "#saved-session-list", "#schema-list", "#layout-code-fixture"].map((selector) => { const element = document.querySelector(selector); const style = getComputedStyle(element); return { selector, scrollHeight:element.scrollHeight, clientHeight:element.clientHeight, overflowY:style.overflowY, maxHeight:style.maxHeight }; }),
  };
})()`;

const inspectorReturnRuntime = `import("./data-layer-live-inspector-return-ui.js").then(({ restoreInspectorReturnUi }) => {
  const eventList = document.createElement("section");
  eventList.style.cssText = "height:40px;overflow:auto";
  const eventFeed = document.createElement("div");
  const spacer = document.createElement("div");
  spacer.style.height = "1000px";
  const eventButton = document.createElement("button");
  eventButton.dataset.eventId = "purchase";
  eventButton.textContent = "purchase";
  eventFeed.append(spacer, eventButton);
  eventList.append(eventFeed);
  document.body.append(eventList);
  restoreInspectorReturnUi({ eventList, eventFeed }, { eventId: "purchase", scrollTop: 480 });
  const result = { scrollTop: eventList.scrollTop, focusedEventId: document.activeElement?.dataset.eventId };
  eventList.remove();
  return result;
})`;

const hiddenStateRuntime = `(() => {
  const component = document.createElement("section");
  component.hidden = true;
  component.style.display = "flex";
  const control = document.createElement("button");
  control.textContent = "Hidden control";
  component.append(control); document.body.append(component);
  control.focus();
  const result = {
    display: getComputedStyle(component).display,
    offsetParent: component.offsetParent === null,
    zeroSpace: component.getBoundingClientRect().width === 0 && component.getBoundingClientRect().height === 0,
    focusExcluded: document.activeElement !== control,
    ariaHidden: component.getAttribute("aria-hidden") !== "false",
  };
  component.remove(); return result;
})()`;

const inspectorNavigationRuntime = `import("./data-layer-live-observer-ui.js").then(({ renderLiveInspector, renderLiveObserverState, updateLiveInspectorValidation }) => {
  const eventList = document.querySelector("#live-event-list");
  const eventFeed = document.querySelector("#live-event-feed");
  const eventInspector = document.querySelector("#live-event-inspector");
  const backToEventsButton = document.querySelector("#back-to-events");
  const event = { id:"purchase", name:"purchase", sourceId:"history", captureTime:"10:03:00", payload:{} };
  const elements = { eventList, eventFeed, eventInspector, backToEventsButton, sourceStatuses:null };
  renderLiveObserverState(elements, { sources:[], events:[event], inspectorEventId:"purchase", listVisible:false }, () => {});
  renderLiveInspector(elements, event, {
    copyPayload: async () => {}, saveToLibrary: () => {}, validate: () => {},
    validationAvailability: () => ({ enabled:true }),
  });
  updateLiveInspectorValidation(elements, "1 issues", [{ instancePath:"/commerce/order/id", message:"Required value", expected:"string", actual:"missing", schemaName:"Order confirmation", schemaVersion:2, schemaLocation:"#/properties/commerce" }], { id:"assignment:checkout", name:"Checkout confirmation", sourceId:"event-history", eventName:"page_view", target:"payload", priority:100, domainCondition:"shop.example", pathnameCondition:"/order-confirmation", versionPolicy:"follow latest", enabled:true });
  const hiddenAncestor = (element) => { for (let current = element; current; current = current.parentElement) if (current.hidden) return true; return false; };
  return {
    listInLayout: eventList.getClientRects().length > 0,
    inspectorInLayout: eventInspector.getClientRects().length > 0,
    backInLayout: backToEventsButton.getClientRects().length > 0,
    backHasHiddenAncestor: hiddenAncestor(backToEventsButton),
    backInsideList: eventList.contains(backToEventsButton),
    backIsFirstHeaderControl: eventInspector.firstElementChild?.firstElementChild === backToEventsButton,
    validationDetail:eventInspector.querySelector("[data-validation-details]")?.textContent,
  };
})`;

const pathnameHeaderRuntime = `import("./data-layer-live-observer-ui.js").then(({ renderLiveObserverState }) => {
  const feed = document.createElement("ul"); const list = document.createElement("section"); list.style.cssText = "width:100%;overflow-x:hidden"; list.append(feed); document.body.append(list);
  const events = [
    { id:"event-1", name:"pageview", sourceId:"event-history", captureTime:"10:00:00", pageUrl:"https://example.test/products", payload:{ page_name:"Products", page_type:"listing", page_category:"catalog" } },
    { id:"event-2", name:"pageview", sourceId:"event-history", captureTime:"10:01:00", pageUrl:"https://example.test/products", payload:{ page_name:"Products", page_type:"detail", page_category:"product" } },
    { id:"event-3", name:"pageview", sourceId:"event-history", captureTime:"10:02:00", pageUrl:"https://example.test/checkout", payload:{ page_name:"Checkout", page_type:"form", page_category:"conversion" } },
    { id:"event-4", name:"pageview", sourceId:"event-history", captureTime:"10:03:00", pageUrl:"https://example.test/checkout", payload:{ page_name:"", page_type:"detail", page_category:"product" } },
    { id:"event-5", name:"pageview", sourceId:"event-history", captureTime:"10:04:00", pageUrl:"https://example.test/products", payload:{} },
  ];
  renderLiveObserverState({ livePanel:null, eventFeed:feed, eventList:list, eventInspector:null, backToEventsButton:null, sourceStatuses:null }, { sources:[], events, listVisible:true }, () => {});
  const headers = [...feed.querySelectorAll(".pathname-visit-heading")].map((header) => ({ text:header.textContent.trim(), name:header.getAttribute("aria-label"), associated:header.parentElement.getAttribute("aria-labelledby") === header.id }));
  const rows = [...feed.querySelectorAll(".pathname-visit button")].map((button) => button.textContent);
  renderLiveObserverState({ livePanel:null, eventFeed:feed, eventList:list, eventInspector:null, backToEventsButton:null, sourceStatuses:null }, { sources:[], events:[{ id:"long", name:"pageview", sourceId:"event-history", captureTime:"10:04:00", pageUrl:"https://example.test/products/field-notebook", payload:{} }], listVisible:true }, () => {});
  const longHeader = feed.querySelector(".pathname-visit-heading"); const headerRect = longHeader.getBoundingClientRect(); const listRect = list.getBoundingClientRect();
  const longResult = {
    bounded:headerRect.left >= listRect.left - 1 && headerRect.right <= listRect.right + 1,
    unclipped:[...longHeader.children].every((field) => field.scrollWidth <= field.clientWidth + 1),
    pathnameCount:(longHeader.textContent.match(/\\/products\\/field-notebook/g) ?? []).length,
    documentFits:document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  };
  list.remove(); return { headers, rows, longResult };
})`;

const pushDecisionRuntime = `Promise.all([
  import("./data-layer-push-draft-review.js"),
  import("./data-layer-push-draft-review-ui.js"),
]).then(([reviewModel, reviewUi]) => {
  const host = document.createElement("section"); host.id = "push-draft-review";
  host.innerHTML = '<dl id="push-draft-review-details"></dl><ul id="push-draft-review-change-list"></ul><p id="push-draft-review-no-changes" hidden>No payload changes</p>';
  document.body.append(host);
  const elements = reviewUi.findPushDraftReviewElements(host);
  const template = { eventName:"purchase", destination:"queue.history", version:3, validation:"Valid", payload:{ ecommerce:{ value:18 }, items:[{ quantity:1 }], legacy:{ debug:true } } };
  const target = { title:"Signal Shop", pageUrl:"https://signal.example.test/checkout" };
  const changed = reviewModel.createPushDraftReview({ template, draft:{ ecommerce:{ value:19 }, items:[{ quantity:2 }], experiment:{ variant:"treatment-b" } } }, target);
  reviewUi.renderPushDraftReview(host, changed);
  const pairs = (root) => [...root.querySelectorAll("dt")].map((term) => [term.textContent, term.nextElementSibling?.textContent]);
  const detailPairs = pairs(elements.details);
  const changePairs = [...elements.changeList.querySelectorAll("dl")].map(pairs);
  const columns = getComputedStyle(elements.details).gridTemplateColumns.trim().split(/\\s+/).length;
  const readable = [...host.querySelectorAll("dt,dd")].every((value) => value.scrollWidth <= value.clientWidth + 1);
  const documentFits = document.documentElement.scrollWidth <= document.documentElement.clientWidth;
  const unchanged = reviewModel.createPushDraftReview({ template, draft:structuredClone(template.payload) }, target);
  reviewUi.renderPushDraftReview(host, unchanged);
  const emptyResult = { text:elements.noChanges.textContent, visible:!elements.noChanges.hidden, changeCount:elements.changeList.children.length };
  host.remove();
  return { detailPairs, changePairs, columns, readable, documentFits, emptyResult };
})`;

const templateChangeReviewRuntime = `Promise.all([
  import("./data-layer-event-library-editor.js"),
  import("./data-layer-event-library-editor-ui.js"),
  import("./data-layer-template-change-review.js"),
]).then(([editorModel, editorUi, reviewModel]) => {
  const list = document.querySelector("#event-template-list");
  const template = { id:"template-7", name:"Purchase confirmation", eventName:"purchase", sourceId:"event-history", sourceName:"Event history", destination:"queue.history", tags:["checkout"], schemaId:"purchase", validation:"Valid", payload:{ transaction_id:"T-1" }, version:3, originatingSessionId:"session-1", originatingEventId:"event-1", provenance:"captured:event-history" };
  const elements = editorUi.findEventLibraryEditorElements();
  let editor = editorModel.openPropertyEditor(template);
  editor = editorModel.setTemplateIdentity(editor, "name", "Completed checkout");
  editor = editorModel.setTemplateIdentity(editor, "eventName", "checkout_completed");
  editorUi.renderEventLibraryEditor(elements, [template], editor, { edit:()=>{}, rename:()=>{}, duplicate:()=>{}, push:()=>{}, delete:()=>{} });
  const review = reviewModel.createTemplateChangeReview(editor, "revision");
  return { renameAction:Boolean(list.querySelector('[aria-label^="Rename "]')), renameDialog:Boolean(document.querySelector("#event-template-rename")), editable:[elements.templateName.disabled, elements.eventName.disabled], review:{ label:review.proposedLabel, version:review.resultingVersion, identity:review.identity, noPayload:review.changes.length === 0 } };
})`;

const jsonValidationRecoveryRuntime = `Promise.all([
  import("./data-layer-event-library-editor.js"),
  import("./data-layer-event-library-editor-ui.js"),
  import("./data-layer-push-draft-review.js"),
  import("./data-layer-push-draft-review-ui.js"),
]).then(([editorModel, editorUi, reviewModel, reviewUi]) => {
  const elements = editorUi.findEventLibraryEditorElements();
  const template = { id:"template-scroll", name:"Scroll depth", eventName:"scroll", sourceId:"history", sourceName:"Event history", destination:"queue.history", tags:[], validation:"Valid", payload:{ tealium_generated:"1", scroll_percentage:0 }, version:3, originatingSessionId:"session-1", originatingEventId:"event-1", provenance:"captured:history" };
  let state = editorModel.openPropertyEditor(template);
  const actions = { edit:()=>{}, rename:()=>{}, duplicate:()=>{}, push:()=>{} };
  const invalidSource = '{\\n  "tealium_generated": "1",\\n  "scroll_percentage": 25,\\n\\n}';
  elements.json.value = invalidSource; elements.json.dispatchEvent(new Event("input", { bubbles:true }));
  state = editorModel.updateDraftJson(state, elements.json.value);
  editorUi.renderEventLibraryEditor(elements, [template], state, actions);
  const invalid = { error:Boolean(state.jsonError), status:elements.validation.textContent, invalid:elements.json.getAttribute("aria-invalid"), saveDisabled:elements.saveRevisionButton.disabled, pushDisabled:elements.pushDraftButton.disabled, saveReason:document.querySelector("#save-template-revision-reason").textContent, pushReason:document.querySelector("#push-template-draft-reason").textContent, draft:state.draft };
  elements.json.value = '{\\n  "tealium_generated": "1",\\n  "scroll_percentage": 25\\n}'; elements.json.dispatchEvent(new Event("input", { bubbles:true }));
  state = editorModel.updateDraftJson(state, elements.json.value);
  editorUi.renderEventLibraryEditor(elements, [template], state, actions);
  const recovered = { error:Boolean(state.jsonError), status:elements.validation.textContent, invalid:elements.json.getAttribute("aria-invalid"), saveDisabled:elements.saveRevisionButton.disabled, pushDisabled:elements.pushDraftButton.disabled, draft:state.draft };
  const transitions = [];
  for (let cycle = 0; cycle < 3; cycle += 1) {
    state = editorModel.updateDraftJson(state, invalidSource); editorUi.renderEventLibraryEditor(elements, [template], state, actions);
    transitions.push(Boolean(state.jsonError) && elements.saveRevisionButton.disabled && elements.pushDraftButton.disabled);
    state = editorModel.updateDraftJson(state, '{"tealium_generated":"1","scroll_percentage":25}'); editorUi.renderEventLibraryEditor(elements, [template], state, actions);
    transitions.push(!state.jsonError && !elements.saveRevisionButton.disabled && !elements.pushDraftButton.disabled && !elements.validation.textContent.includes("Invalid JSON"));
  }
  const saved = editorModel.saveDraftRevision(state);
  const review = reviewModel.createPushDraftReview(state, { title:"Signal Shop", pageUrl:"https://signal.example.test/checkout", accessState:"Ready" });
  const reviewElements = reviewUi.findPushDraftReviewElements(); reviewUi.renderPushDraftReview(document, review);
  const reviewChanges = [...reviewElements.changeList.querySelectorAll("dl")].map((row) => [...row.querySelectorAll("dd")].map((value) => value.textContent));
  return { invalid, recovered, transitions, saved:{ version:saved.template.version, payload:saved.template.payload }, review:{ event:review.rows[0][1], draft:review.editor.draft, changes:reviewChanges } };
})`;

const libraryNewEventRuntime = `Promise.all([
  import("./data-layer-event-library-editor.js"),
  import("./data-layer-event-library-editor-ui.js"),
]).then(([model, ui]) => {
  const elements = ui.findEventLibraryEditorElements();
  let state = model.createNewEventEditor();
  ui.renderEventLibraryEditor(elements, [], state, { edit:()=>{}, rename:()=>{}, duplicate:()=>{}, push:()=>{} });
  const initial = { title:elements.editorTitle.textContent, count:elements.count.textContent, addHidden:elements.addNewButton.hidden, name:elements.templateName.value, event:elements.eventName.value, source:elements.source.value, destination:elements.pushDestination.value, json:elements.json.value, saveDisabled:elements.saveRevisionButton.disabled };
  state = model.setNewEventField(state, "name", "Scroll milestone"); state = model.setNewEventField(state, "eventName", "scroll"); state = model.setNewEventField(state, "source", { id:"event-history", name:"Event history" }); state = model.setNewEventField(state, "destination", "event.history"); state = model.updateDraftJson(state, '{"scroll_percentage":25}');
  const created = model.saveNewEvent(state, () => "template:library:new");
  return { initial, created };
})`;

const eventLibraryDeletionRuntime = `import("./data-layer-event-library-deletion.js").then((deletion) => {
  const template = (id, name) => ({ id, name, eventName:"purchase", sourceId:"history", sourceName:"Event history", destination:"event.history", tags:[], validation:"Valid", payload:{}, version:1, provenance:"library-created" });
  const first = template("template-7", "Purchase confirmation"); const sameNamed = template("template-9", "Purchase confirmation");
  return { afterDelete:deletion.deleteEventTemplate([first, sameNamed], "template-7").map((item) => item.id), afterClear:deletion.clearEventLibrary([first, sameNamed]).length };
})`;

const mountedCompactPendingContractRuntime = `(async()=>{
  const pause=(milliseconds=0)=>new Promise((resolve)=>setTimeout(resolve,milliseconds)),waitFor=async(predicate,label)=>{for(let attempt=0;attempt<400;attempt+=1){const value=predicate();if(value)return value;await pause(10);}throw new Error("Timed out waiting for "+label);};
  const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;},click=(root,label)=>{const value=Array.from(root.querySelectorAll("button")).find(({textContent})=>textContent===label);if(!value)throw new Error("Missing "+label);value.click();return value;};
  const schemaRow=(id)=>q('[data-schema-entry-key="saved:'+id+'"]'),openSchema=(id)=>{click(schemaRow(id),"Edit working draft");return q("#compact-canonical-table-editor");},tableEditor=()=>{let mounted=q("#compact-canonical-table-editor");const table=Array.from(mounted.querySelectorAll("button")).find(({textContent})=>textContent==="Table");if(!table)throw new Error("Missing Table");if(!table.disabled)table.click();return q("#compact-canonical-table-editor");},setConcept=(value)=>{const mounted=tableEditor(),input=q('[data-inline-schema-path="/page_type"][data-inline-schema-facet="concept"]',mounted),before=input.value;input.value=value;input.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));return before;},canonicalConcept=(schema)=>Object.values(schema?.workingDraft?.canonicalSchema?.nodes??schema?.canonicalSchema?.nodes??{}).find(({name})=>name==="page_type")?.concept??"";
  const pageId="schema-page-view";
  q("#data-layer-view-schemas").click();q("#schema-subview-schemas").click();const close=document.querySelector("#close-schema-editor");if(close&&!close.disabled)close.click();click(q("#schema-list"),"Edit working draft");let mounted=q("#compact-canonical-table-editor");click(mounted,"Table");mounted=q("#compact-canonical-table-editor");const restoreMountedFailure=__failNextDurableSchemaWrite("mounted pending contract failure",(schema)=>schema?.id===pageId);let concept=q('[data-inline-schema-path="/page_type"][data-inline-schema-facet="concept"]',mounted);concept.value="Mounted pending navigation";concept.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));await waitFor(()=>q("#durable-storage-recovery").open&&q("#durable-repository-status").textContent.includes("mounted pending contract failure"),"the mounted pending failure");restoreMountedFailure();mounted=tableEditor();const propertyAction=q('[aria-label="Property actions for /page_type"]',mounted),propertyNavigation=!propertyAction.disabled;propertyAction.click();let type=q('[data-inline-schema-path="/page_type"][data-inline-schema-facet="type"]',mounted);type.value="number";type.dispatchEvent(new Event("change",{bubbles:true}));mounted=q("#compact-canonical-table-editor");const rejection=q('[aria-label="Canonical command result"]',mounted).textContent,presentation={table:!Array.from(mounted.querySelectorAll("button")).find(({textContent})=>textContent==="Table").disabled,tree:!Array.from(mounted.querySelectorAll("button")).find(({textContent})=>textContent==="Tree").disabled,search:!q('[aria-label="Canonical property search"]',mounted).disabled,filter:!q('[aria-label="Filter canonical properties"]',mounted).disabled,sort:!q('[aria-label="Sort schema properties"]',mounted).disabled,propertyNavigation};const search=q('[aria-label="Canonical property search"]',mounted);search.value="page";search.dispatchEvent(new Event("input",{bubbles:true}));const filter=q('[aria-label="Filter canonical properties"]',mounted);filter.value="conditions";filter.dispatchEvent(new Event("change",{bubbles:true}));const sort=q('[aria-label="Sort schema properties"]',mounted);sort.value="source";sort.dispatchEvent(new Event("change",{bubbles:true}));click(mounted,"Tree");mounted=q("#compact-canonical-table-editor");click(mounted,"Table");q("#retry-durable-save").click();const mountedRetryResult=await waitFor(()=>{const text=q("#durable-recovery-result").textContent;return text.includes("committed to the Saved Schema Library")||text.includes("Retry was not committed")?text:undefined;},"the mounted pending Retry");if(mountedRetryResult.includes("Retry was not committed"))throw new Error(mountedRetryResult);q("#close-storage-recovery").click();const mountedStored=(await __waitForDurableSchemaObservation(([schema])=>Object.values(schema?.workingDraft?.canonicalSchema?.nodes??{}).some(({name,concept})=>name==="page_type"&&concept==="Mounted pending navigation"),"the mounted semantic save"))[0],mountedNode=Object.values(mountedStored.workingDraft.canonicalSchema.nodes).find(({name})=>name==="page_type"),mountedContract={rejection,presentation,semanticType:mountedNode.type,concept:mountedNode.concept,pendingChanges:mountedStored.workingDraft.pendingChanges};
  const repositoryModule=await import("/data-layer-durable-project-repository.js"),repository=await repositoryModule.openIndexedDbProjectRepository(),cleanupRecord=(await repository.savedSchemaRecords()).find(({schema})=>schema.id===pageId),cleanupSchema=structuredClone(cleanupRecord.schema);cleanupSchema.workingDraft.canonicalSchema.view="tree";const cleanupCommit=await repository.applySavedSchemaBatch({upserts:[{schema:cleanupSchema,baseToken:cleanupRecord.token}],deletes:[],label:"Restore local-rule observation tree view"});if(cleanupCommit.status!=="committed")throw new Error("Tree-view cleanup conflicted");await __waitForDurableSchemaObservation((schemas)=>schemas.find(({id})=>id===pageId)?.workingDraft?.canonicalSchema?.view==="tree","the restored local-rule tree view");
  q("#close-schema-editor").click();click(schemaRow(pageId),"Duplicate");const duplicated=await __waitForDurableSchemaObservation((schemas)=>schemas.length===2&&schemas.find(({id})=>id!==pageId),"the secondary Saved Schema"),secondary=duplicated.find(({id})=>id!==pageId),secondaryId=secondary.id,secondaryName=secondary.name;
  openSchema(pageId);q("#schema-editor-description").value="Cross-editor A committed";q("#save-schema-description").click();q("#close-schema-editor").click();openSchema(secondaryId);const initialBConcept=setConcept("Cross-editor B blocked"),successBlocked={editor:q("#schema-editor-name").value,busy:q("#schema-editor").getAttribute("aria-busy"),saveBlocked:q("#save-schema").disabled};const successSchemas=await __waitForDurableSchemaObservation((schemas)=>schemas.find(({id})=>id===pageId)?.workingDraft?.documentation?.description==="Cross-editor A committed","the cross-editor A projection");await waitFor(()=>q("#schema-editor").getAttribute("aria-busy")!=="true"&&!q("#save-schema").disabled,"the secondary editor after A settled");mounted=tableEditor();const successAfter={editor:q("#schema-editor-name").value,busy:q("#schema-editor").getAttribute("aria-busy"),saveReady:!q("#save-schema").disabled,concept:q('[data-inline-schema-path="/page_type"][data-inline-schema-facet="concept"]',mounted).value,aDescription:successSchemas.find(({id})=>id===pageId).workingDraft.documentation.description};setConcept("Cross-editor B settled");const bSettled=await __waitForDurableSchemaObservation((schemas)=>canonicalConcept(schemas.find(({id})=>id===secondaryId))==="Cross-editor B settled","the secondary semantic edit after A settled");await waitFor(()=>q("#schema-editor").getAttribute("aria-busy")!=="true","the settled secondary semantic presentation");
  q("#close-schema-editor").click();openSchema(pageId);const restoreFailure=__failNextDurableSchemaWrite("cross-editor A failure",(schema)=>schema?.id===pageId);q("#schema-editor-description").value="Cross-editor A rejected";q("#save-schema-description").click();q("#close-schema-editor").click();openSchema(secondaryId);const failureInitialConcept=setConcept("Cross-editor B failure-blocked"),failureBlocked={editor:q("#schema-editor-name").value,busy:q("#schema-editor").getAttribute("aria-busy"),saveBlocked:q("#save-schema").disabled};await waitFor(()=>q("#durable-storage-recovery").open&&q("#durable-repository-status").textContent.includes("cross-editor A failure"),"the cross-editor A failure recovery");restoreFailure();mounted=tableEditor();const recovery={editor:q("#schema-editor-name").value,busy:q("#schema-editor").getAttribute("aria-busy"),saveBlocked:q("#save-schema").disabled,retry:!q("#retry-durable-save").disabled,reject:!q("#reject-durable-save").disabled,concept:q('[data-inline-schema-path="/page_type"][data-inline-schema-facet="concept"]',mounted).value,status:q("#durable-repository-status").textContent};q("#reject-durable-save").click();const rejectResult=await waitFor(()=>q("#durable-recovery-result").textContent.includes("Rejected ")?q("#durable-recovery-result").textContent:undefined,"the rejected cross-editor A projection");await waitFor(()=>q("#schema-editor").getAttribute("aria-busy")!=="true"&&!q("#save-schema").disabled,"the secondary editor after rejecting A");q("#close-storage-recovery").click();const finalSchemas=await __waitForDurableSchemaObservation((schemas)=>schemas.find(({id})=>id===pageId)?.workingDraft?.documentation?.description==="Cross-editor A committed"&&canonicalConcept(schemas.find(({id})=>id===secondaryId))==="Cross-editor B settled","the rejected A and retained B durable state"),failureAfter={editor:q("#schema-editor-name").value,busy:q("#schema-editor").getAttribute("aria-busy"),saveReady:!q("#save-schema").disabled,aDescription:finalSchemas.find(({id})=>id===pageId).workingDraft.documentation.description,bConcept:canonicalConcept(finalSchemas.find(({id})=>id===secondaryId)),rejectResult};
  return{...mountedContract,crossEditor:{secondaryId,secondaryName,success:{blocked:successBlocked,initialBConcept,after:successAfter,bConcept:canonicalConcept(bSettled.find(({id})=>id===secondaryId))},failure:{blocked:failureBlocked,failureInitialConcept,recovery,after:failureAfter}}};
})()`;

const schemaPublicationRefreshSeedRuntime = `(async () => {
  const defects = await import("/data-layer-defect-library.js");
  const sessions = await import("/data-layer-saved-sessions.js");
  localStorage.clear();
  const assignments = ["page_view", "banner"].map((eventName) => ({ id:"assignment:" + eventName, sourceId:"history", eventName, target:"payload", priority:10, versionPolicy:"follow latest", enabled:true }));
  const document = { type:"object", properties:{ page_type:{ type:"string" }, test:{ type:"string" }, currency:{ type:"string" } } };
  const optionalRule = { id:"optional-test", name:"Optional test", version:3, propertyPath:"/test", operator:"allowed-values", parameters:"known", severity:"error" };
  const currencyRule3 = { id:"known-currency", name:"Known currency", version:3, propertyPath:"/currency", operator:"allowed-values", parameters:"EUR,USD", severity:"error" };
  const schema = { id:"product-listing", name:"Product listing", version:3, published:true, document, assignments, attachedRules:[optionalRule,currencyRule3], revisionHistory:[], workingDraft:{ baseVersion:3, sourceVersion:3, document, assignments, attachedRules:[{ ...optionalRule, version:4 },{ ...currencyRule3, version:4 },{ id:"required-page-type", name:"Required page type", version:4, propertyPath:"/page_type", operator:"required", severity:"error" }], pendingChanges:["Add required page type","Revise validation rules"] } };
  localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([schema]));
  const entry = (id, name, time, payload, rawInput, pageUrl) => ({ type:"observed", url:pageUrl, timestamp:time, observerPath:"dataLayer", id, name, sessionId:"session:publication", sourceId:"history", sourceKind:"Data layer", pageUrl, payload, rawInput, rawValue:rawInput, validation:"Not checked" });
  const timeline = [
    entry("event:page-view","page_view","2026-07-14T12:00:00Z",{ currency:"EUR" },["page_view",{ currency:"EUR" }],"https://shop.example/products"),
    entry("event:banner","banner","2026-07-14T12:00:01Z",{ currency:"GBP" },["banner",{ currency:"GBP" }],"https://shop.example/products/2"),
  ];
  localStorage.setItem("dataLayerTestingSession", JSON.stringify({ session:{ id:"session:publication", status:"active", freshBoundary:true, tabId:1, historyPath:"dataLayer", startUrl:"https://shop.example/products", currentUrl:"https://shop.example/products/2", timeline } }));
  const issue = { sourceId:"history", eventName:"banner", schemaId:"product-listing", validationTarget:"payload", concretePath:"/currency", templatePath:"/currency", ruleId:"rule:known-currency", ruleRevision:3, actual:"GBP", expected:"EUR,USD", pageUrl:"https://shop.example/products/2", captureTime:"2026-07-14T12:00:01Z", sourceName:"history", schemaName:"Product listing", ruleName:"Known currency" };
  const defect = { ...defects.createValidationDefect({ id:"defect:currency-v3", now:"2026-07-14T12:01:00Z", report:{ summary:"banner currency is invalid" }, issues:[issue] }), status:"Reported" };
  localStorage.setItem(defects.DEFECT_LIBRARY_STORAGE_KEY, defects.serializeDefectLibrary({ defects:[defect] }));
  const savedEvent = { id:"saved:page-view", name:"page_view", sourceId:"history", sourceName:"history", captureTime:"2026-07-14T11:00:00Z", pageUrl:"https://shop.example/products", payload:{ currency:"EUR" }, rawInput:[], validation:"Valid", validationDetails:{ schema:{ id:"product-listing", name:"Product listing", version:3 }, issues:[], evaluations:[{ propertyPath:"/test", status:"not-applicable", message:"Optional target absent", expected:"known", actual:"missing", rule:"Optional test", ruleVersion:3, severity:"error", schemaName:"Product listing", schemaVersion:3 }] } };
  const saved = sessions.saveCompletedSession(sessions.createSavedSessionLibrary(), { id:"saved:source", pageScope:savedEvent.pageUrl, startedAt:savedEvent.captureTime, endedAt:savedEvent.captureTime, events:[savedEvent] }, "Revision 3 evidence");
  localStorage.setItem("my-chrome-utilities.saved-session-library.v1", sessions.serializeSavedSessionLibrary(saved));
  return true;
})()`;

const schemaPublicationRefreshRuntime = `(async () => {
  const pause = () => new Promise((resolve) => setTimeout(resolve, 0));
  const q = (selector, root=document) => { const value = root.querySelector(selector); if (!value) throw new Error("Missing " + selector); return value; };
  const click = (label, root=document) => { const value = Array.from(root.querySelectorAll("button")).find((candidate) => candidate.textContent === label || candidate.textContent.startsWith(label)); if (!value) throw new Error("Missing action " + label); value.click(); return value; };
  const savedBefore = localStorage.getItem("my-chrome-utilities.saved-session-library.v1");
  click("Add filter", q("#live-event-query"));
  const field = q("#event-feed-query-field"); field.value = "Event name"; field.dispatchEvent(new Event("change", { bubbles:true }));
  const operator = q("#event-feed-query-operator"); operator.value = "is"; operator.dispatchEvent(new Event("change", { bubbles:true }));
  const value = q("#event-feed-query-value"); value.value = "page_view"; value.dispatchEvent(new Event("input", { bubbles:true })); click("Apply condition", q("#live-event-query"));
  const queryBefore = q("#live-event-query-count").textContent;
  q("#live-event-feed button").click(); click("Validate", q("#live-event-inspector")); await pause();
  q("#back-to-events").click(); q("#live-event-feed button").click();
  const assignedTerm=Array.from(q("#live-event-inspector").querySelectorAll("dt")).find((term)=>term.textContent==="Assigned schema");
  if (!assignedTerm) return { debug:{ inspector:q("#live-event-inspector").textContent, feedback:q("#live-validation-update-status").textContent, schemas:localStorage.getItem("my-chrome-utilities.schema-library.v1") } };
  const before = { summary:q("#live-inspector-validation-summary").textContent, schema:assignedTerm.nextElementSibling.textContent, optionalHidden:!document.querySelector('[data-property-path="/test"]') };
  const toggle = q("#live-non-applicable-properties");
  const order = Boolean(toggle.compareDocumentPosition(q("#live-property-search")) & Node.DOCUMENT_POSITION_FOLLOWING);
  toggle.click();
  const optional = q('[data-property-path="/test"]'); const optionalValue = q('[data-missing="true"]',optional); const optionalStatus = q(".live-property-status",optional);
  const dangerProbe=document.createElement("span"); dangerProbe.style.color="var(--danger)"; document.body.append(dangerProbe); const dangerColor=getComputedStyle(dangerProbe).color; dangerProbe.remove();
  const revealed = { label:toggle.textContent, pressed:toggle.getAttribute("aria-pressed"), value:optionalValue.textContent, treatment:optional.dataset.validationTreatment, status:optionalStatus.textContent, missingColor:getComputedStyle(optionalValue).color, dangerColor };
  optionalStatus.click(); optional.focus({ preventScroll:true }); const inspector=q("#live-event-inspector"); inspector.scrollTop=37;
  q("#data-layer-view-schemas").click(); click("Edit working draft", q("#schema-list")); q("#save-schema").click(); q("#confirm-schema-revision").click(); await __waitForDurableSchemaObservation(([schema])=>schema?.version===4&&!schema.workingDraft&&schema.attachedRules?.some(({id,version})=>id==="required-page-type"&&version===4),"the live-refresh schema publication");
  const publication = { result:q("#schema-result").textContent, savedUnchanged:localStorage.getItem("my-chrome-utilities.saved-session-library.v1") === savedBefore };
  q("#data-layer-view-live").click();
  const afterOptional=q('[data-property-path="/test"]'); const pageType=q('[data-property-path="/page_type"]');
  const after = { query:q("#live-event-query-count").textContent, count:q("#live-captured-event-count").textContent, selected:q("#live-event-inspector h4").textContent, summary:q("#live-inspector-validation-summary").textContent, schema:q('dt[data-field="assigned schema"] + dd').textContent, show:q("#live-non-applicable-properties").getAttribute("aria-pressed"), optionalExpanded:q(".live-property-status",afterOptional).getAttribute("aria-expanded"), pageType:q(".live-property-status",pageType).textContent, scroll:inspector.scrollTop, focused:document.activeElement?.dataset.propertyPath, politeAnnouncements:Array.from(document.querySelectorAll('[aria-live="polite"]')).filter((node)=>node.textContent.includes("Published Product listing revision 4. Revalidated 2 current Live events.")).length, feed:Array.from(q("#live-event-feed").querySelectorAll("button")).map((button)=>button.textContent) };
  click("Clear all", q("#active-event-feed-filters")); const bannerButton=Array.from(q("#live-event-feed").querySelectorAll("button")).find((button)=>button.textContent.includes("banner")); bannerButton.click();
  const defectStates=Array.from(q("#live-event-inspector").querySelectorAll(".live-new-defect-state")).map(({textContent})=>textContent);
  const core=await import("/data-layer-schema-publication-refresh.js"); const verification=await import("/data-layer-schema-verification.js"); const observer=await import("/data-layer-live-observer.js");
  const published=verification.restoreSchemaLibrary(localStorage.getItem("my-chrome-utilities.schema-library.v1"));
  const base={ ...observer.createLiveObserverState({ pageUrl:"https://shop.example/products", sources:[] }), events:[{ id:"pre:1",name:"page_view",sourceId:"history",captureTime:"1",pageUrl:"https://shop.example/products",payload:{currency:"EUR"},rawInput:[] },{ id:"pre:2",name:"banner",sourceId:"history",captureTime:"2",pageUrl:"https://shop.example/products/2",payload:{currency:"EUR",page_type:"listing"},rawInput:[] }] };
  const refreshed=core.revalidateCurrentLiveSession(base,published,{}); const appendedInput={sourceId:"history",eventName:"page_view",payload:{currency:"EUR",page_type:"listing"},rawInput:[]}; const appendedValidation=verification.validateEvent(appendedInput,published,"https://shop.example/products/3"); const final=observer.recordLiveEvent(refreshed.state,{id:"post:1",name:"page_view",sourceId:"history",captureTime:"3",pageUrl:"https://shop.example/products/3",payload:appendedInput.payload,rawInput:[],validation:appendedValidation.state,validationDetails:{issues:appendedValidation.issues,evaluations:appendedValidation.evaluations,schema:appendedValidation.schema,assignment:appendedValidation.assignment}});
  return { before,queryBefore,control:{order,revealed},publication,after,defectStates,boundary:{refreshed:refreshed.revalidatedEventIds,ids:final.events.map(({id})=>id),revisions:final.events.map((event)=>event.validationDetails.schema.version)} };
})()`;

const workflowFocusRuntime = `Promise.all([
  import("./data-layer-event-library-editor-ui.js"),
  import("./data-layer-workflow-focus-ui.js"),
  import("./data-layer-observation-targets-ui.js"),
]).then(([editorUi, pushUi, targetUi]) => {
  const workspaceData = document.querySelector("#workspace-tab-data-layer");
  const workspaceHotkeys = document.querySelector("#workspace-tab-hotkeys");
  workspaceData.focus(); workspaceData.dispatchEvent(new KeyboardEvent("keydown", { key:"ArrowRight", bubbles:true }));
  const tabResult = { workspaceRight:document.activeElement === workspaceHotkeys && workspaceHotkeys.getAttribute("aria-selected") === "true" };
  workspaceHotkeys.dispatchEvent(new KeyboardEvent("keydown", { key:"ArrowLeft", bubbles:true }));
  tabResult.workspaceLeft = document.activeElement === workspaceData && workspaceData.getAttribute("aria-selected") === "true";
  const liveTab = document.querySelector("#data-layer-view-live"); const schemasTab = document.querySelector("#data-layer-view-schemas");
  liveTab.focus(); liveTab.dispatchEvent(new KeyboardEvent("keydown", { key:"End", bubbles:true }));
  tabResult.dataLayerEnd = document.activeElement === schemasTab && schemasTab.tabIndex === 0 && !document.querySelector("#data-layer-panel-schemas").hidden;
  schemasTab.dispatchEvent(new KeyboardEvent("keydown", { key:"Home", bubbles:true }));
  tabResult.dataLayerHome = document.activeElement === liveTab && liveTab.tabIndex === 0 && !document.querySelector("#data-layer-panel-live").hidden;
  tabResult.singleDataLayerTabStop = [...document.querySelectorAll("#data-layer-views [role=tab]")].filter((tab) => tab.tabIndex === 0).length === 1;

  const host = document.createElement("section");
  host.innerHTML = '<ul data-list></ul><section data-editor><h4 data-title tabindex="-1"></h4><dl data-summary></dl><ul data-properties></ul><textarea data-json></textarea><input data-destination><output data-validation></output></section>';
  document.body.append(host);
  const template = { id:"template:purchase", name:"Purchase confirmation", eventName:"purchase", sourceName:"history", destination:"dataLayer", version:3, validation:"Valid", tags:[], provenance:"captured", originatingEventId:"purchase", originatingSessionId:"session-1", payload:{ transaction_id:"T-1", revenue:12 } };
  const editor = { template, revisions:[], draft:template.payload, jsonDraft:JSON.stringify(template.payload), dirty:false };
  const elements = { list:host.querySelector("[data-list]"), propertyEditor:host.querySelector("[data-editor]"), editorTitle:host.querySelector("[data-title]"), editorSummary:host.querySelector("[data-summary]"), properties:host.querySelector("[data-properties]"), json:host.querySelector("[data-json]"), pushDestination:host.querySelector("[data-destination]"), validation:host.querySelector("[data-validation]") };
  editorUi.renderEventLibraryEditor(elements, [template], editor, { edit:()=>{}, duplicate:()=>{}, push:()=>{} });
  elements.editorTitle.focus({ preventScroll:true });
  const editorResult = { title:elements.editorTitle.textContent, headingFocused:document.activeElement === elements.editorTitle, disclosuresClosed:!document.querySelector("#event-template-json-section").open && !document.querySelector("#event-template-execution-settings").open };
  editorUi.renderEventLibraryEditor(elements, [template], undefined, { edit:()=>{}, duplicate:()=>{}, push:()=>{} });
  editorUi.focusTemplateEditAction(elements, template.id);
  editorResult.returnedToTemplate = document.activeElement?.dataset.templateId;

  const background = document.createElement("button"); background.textContent = "Background";
  const trigger = document.createElement("button"); trigger.textContent = "Push draft";
  const dialog = document.createElement("dialog");
  dialog.innerHTML = '<h5 tabindex="-1">Review push</h5><button data-first>Confirm</button><button data-last>Cancel</button>';
  document.body.append(background, trigger, dialog);
  const pushElements = { dialog, heading:dialog.querySelector("h5"), trigger };
  dialog.addEventListener("keydown", (event) => pushUi.handlePushReviewKeydown(pushElements, event));
  trigger.focus(); pushUi.openPushReview(pushElements);
  const pushResult = { headingFocused:document.activeElement === pushElements.heading, modal:dialog.matches(":modal") };
  dialog.querySelector("[data-last]").focus(); dialog.dispatchEvent(new KeyboardEvent("keydown", { key:"Tab", bubbles:true }));
  pushResult.forwardWrapped = document.activeElement === dialog.querySelector("[data-first]");
  dialog.dispatchEvent(new KeyboardEvent("keydown", { key:"Tab", shiftKey:true, bubbles:true }));
  pushResult.backwardWrapped = document.activeElement === dialog.querySelector("[data-last]");
  background.focus(); pushResult.backgroundExcluded = document.activeElement !== background;
  dialog.dispatchEvent(new KeyboardEvent("keydown", { key:"Escape", bubbles:true }));
  pushResult.returnedToTrigger = document.activeElement === trigger;

  const sideContent = document.createElement("section"); const choose = document.createElement("button"); const picker = document.createElement("section");
  const close = document.createElement("button"); const search = document.createElement("input"); const list = document.createElement("ul");
  picker.append(close, search, list); document.body.append(sideContent, choose, picker); choose.focus();
  const targetElements = { sidePanelContent:sideContent, picker, closePickerButton:close, search, list, browseButton:null };
  picker.addEventListener("keydown", (event) => targetUi.handleObservationTargetDialogKeydown(targetElements, event));
  targetUi.showObservationTargetPicker(targetElements);
  const targetResult = { inert:sideContent.hasAttribute("inert"), searchFocused:document.activeElement === search };
  close.focus(); picker.dispatchEvent(new KeyboardEvent("keydown", { key:"Tab", shiftKey:true, bubbles:true }));
  targetResult.backwardWrapped = document.activeElement === search;
  picker.dispatchEvent(new KeyboardEvent("keydown", { key:"Escape", bubbles:true }));
  targetResult.returnedToChoose = document.activeElement === choose;
  host.remove(); background.remove(); trigger.remove(); dialog.remove(); sideContent.remove(); choose.remove(); picker.remove();
  return { tabResult, editorResult, pushResult, targetResult };
})`;

const within = (child, parent) => child.x >= parent.x - 1 && child.right <= parent.right + 1 && child.y >= parent.y - 1 && child.bottom <= parent.bottom + 1;
const withinColumn = (child, parent) => child.x >= parent.x - 1 && child.right <= parent.right + 1;
const overlaps = (left, right) => left.x < right.right && left.right > right.x && left.y < right.bottom && left.bottom > right.y;

async function captureSchemaWorkspace(socket, width, schemaRuleEditorVisibility) {
  const schemaWorkspaceRuntime = await evaluate(socket, schemaAssignmentRuntime);
  assert.deepEqual(schemaWorkspaceRuntime.fields, [
    { selector:"#schema-assignment-source", required:false },
    { selector:"#schema-assignment-event", required:false },
    { selector:"#schema-assignment-target", required:false },
    { selector:"#schema-assignment-domain", required:false },
    { selector:"#schema-assignment-pathname", required:false },
    { selector:"#schema-assignment-priority", required:false },
    { selector:"#schema-assignment-schema", required:false },
    { selector:"#schema-assignment-version-policy", required:false },
    { selector:"#schema-assignment-enabled", required:false },
  ], "Schema assignment editor fields changed at " + width + "px");
  assert.equal(schemaWorkspaceRuntime.schemaMasterVisible, true, "Schema workspace did not mount at " + width + "px");
  assert.deepEqual(schemaWorkspaceRuntime.actions, ["Edit", "Duplicate", "Disable", "Delete"], "Schema assignment actions changed");
  assert.equal(schemaWorkspaceRuntime.duplicateCount, 2, "Schema assignment duplication or cleanup did not settle durably: " + JSON.stringify({ rows:schemaWorkspaceRuntime.rows, assignment:schemaWorkspaceRuntime.assignment }));
  assert.deepEqual(schemaWorkspaceRuntime.rows, [
    "Checkout schema automatic · event-history/page_view · raw input · No data conditions · shop.example/order-confirmation · priority 120 · follow latest · disabled · Checkout schema",
  ], "Schema assignment row did not render the edited durable assignment: " + JSON.stringify(schemaWorkspaceRuntime.assignmentTrace));
  assert.deepEqual(schemaWorkspaceRuntime.assignment, {
    sourceId:"event-history",
    eventName:"page_view",
    target:"raw input",
    id:"assignment:schema:checkout-schema:1:page_view",
    name:"Checkout schema automatic",
    priority:120,
    domainCondition:"shop.example",
    pathnameCondition:"/order-confirmation",
    versionPolicy:"follow latest",
    enabled:false,
  }, "Schema assignment edits did not round-trip through the durable repository");
  assert.equal(schemaWorkspaceRuntime.revisionReview.open, false, "Schema revision review remained open after publication");
  assert.match(schemaWorkspaceRuntime.revisionReview.summary, /Pending changes: set canonical property\.$/u, "Schema revision review omitted the canonical property transaction");
  assert.match(schemaWorkspaceRuntime.revisionReview.status, /Saved schema working draft/u, "Schema editor did not retain the saved canonical working draft");
  assert.equal(schemaWorkspaceRuntime.closeReview.open, false, "Schema close review remained open");
  assert.deepEqual(schemaWorkspaceRuntime.propertyRule.actions, ["Edit", "Disable", "Remove"], "Projected attached-rule actions changed");
  assert.equal(schemaWorkspaceRuntime.propertyRule.menuOpen, true, "Canonical property-rule editor did not open");
  assert.equal(schemaWorkspaceRuntime.propertyRule.returnFocus, true, "The durable canonical projection did not return focus to its replacement Add-rule trigger");
  assert.equal(schemaWorkspaceRuntime.propertyRule.stateReturnFocus, true, "Property-rule focus was not retained after the durable canonical state change");
  assert.equal(schemaWorkspaceRuntime.propertyRule.summary, "View attached rules (1)");
  assert.deepEqual(schemaWorkspaceRuntime.propertyRule.revisionReview, {
    open:true,
    summary:"Known page types v1 will become Known page types v2; parameters product,checkout → product,checkout,confirmation; examples product, checkout → product, checkout.",
  }, "Reusable-rule revision review changed");
  assert.equal(schemaWorkspaceRuntime.propertyRule.ruleExportName, "known-page-types-v2.json");
  assert.deepEqual(schemaWorkspaceRuntime.propertyRule.canonical.actions, ["View", "Edit", "Remove local"]);
  assert.equal(schemaWorkspaceRuntime.propertyRule.canonical.restore, "Restore");
  assert.equal(schemaWorkspaceRuntime.propertyRule.canonical.review, "Review changes · example · 1 staged rules · one property command and one Undo action.");
  assert.equal(schemaWorkspaceRuntime.propertyRule.canonical.rule.kind, "reusable");
  assert.equal(schemaWorkspaceRuntime.propertyRule.canonical.rule.reusableRuleId, schemaWorkspaceRuntime.propertyRule.canonical.rule.selectedReusableRuleId, "Canonical reusable-rule identity did not round-trip");
  assert.equal(schemaWorkspaceRuntime.propertyRule.canonical.rule.selectedReusableRuleName, "Known page types");
  assert.deepEqual(schemaWorkspaceRuntime.propertyRule.canonical.pendingChanges, ["set canonical property"]);
  assert.deepEqual(schemaWorkspaceRuntime.storedPropertyRule, { attached:true, version:1, propertyPath:"/example" }, "Canonical projection did not retain its attached-rule compatibility record");
  assert.equal(schemaWorkspaceRuntime.rule.initialSeverity, "warning");
  assert.equal(schemaWorkspaceRuntime.rule.severity, "error");
  assert.match(schemaWorkspaceRuntime.rule.name, /^rule:/u);
  assert.ok(schemaWorkspaceRuntime.rule.attachments.includes("schema:checkout-schema:1"));
  let schemaSourceCreation;
  let schemaInheritance;
  let schemaLibraryTransfer;
  let schemaReload;
  let schemaLiveValidation;
  if (width === 720 && runExtendedSchemaWorkspaceRuntime) {
    schemaSourceCreation = await evaluate(socket, schemaSourceCreationRuntime);
    assert.deepEqual(schemaSourceCreation, {
      schemaView:true,
      editor:true,
      name:"Order complete schema",
      paths:["page_type · /page_type", "page_name · /page_name", "commerce · /commerce", "commerce.order · /commerce/order", "commerce.order.id · /commerce/order/id"],
      assignment:"payload",
      draftRefresh:{ unchanged:true, message:"Library draft validation: 1 issues · Checkout schema v2." },
      persistedAttachment:"schema:checkout-schema:1",
    }, "Library Create schema did not invoke the production source callback");
    schemaInheritance = await evaluate(socket, schemaInheritanceRuntime(schemaLibraryExportFixture));
    assert.deepEqual(schemaInheritance.groups.map(({ state }) => state), [
      "active-inherited", "disabled-inherited", "explicitly-reenabled", "local",
    ], "Schema inheritance state groups did not render");
    const emptyInheritanceGroups = [
      { state:"disabled-inherited", text:"Disabled inherited (0)No disabled inherited rules." },
      { state:"explicitly-reenabled", text:"Explicitly re-enabled (0)No explicitly re-enabled inherited rules." },
      { state:"local", text:"Local (0)No local rules." },
    ];
    assert.match(schemaInheritance.groups[0].text, /^Active inherited \(1\)rule:[^ ]+ v1 · \/example · Checkout schema v2$/u);
    assert.deepEqual(schemaInheritance.groups.slice(1), emptyInheritanceGroups);
    assert.match(schemaInheritance.preview[0], /^\/example · rule:[^ ]+ v1 · inherited from Checkout schema v2$/u);
    assert.equal(schemaInheritance.preview.length, 1, "The canonical reusable rule was not inherited exactly once");
    schemaLibraryTransfer = await evaluate(socket, schemaLibraryTransferRuntime);
    assert.equal(schemaLibraryTransfer.downloadName, "schema-library-v1.json", "Schema Library export did not create the download");
    assert.equal(schemaLibraryTransfer.content.version, 1, "Schema Library export used an unsupported format");
    assert.deepEqual(schemaLibraryTransfer.content.schemas, schemaLibraryTransfer.before.schemas, "Schema Library export omitted a schema identity");
    assert.deepEqual(schemaLibraryTransfer.content.rules, schemaLibraryTransfer.before.rules, "Schema Library export omitted a reusable-rule identity");
    assert.equal(schemaLibraryTransfer.result, "Schema Library replaced.", "Schema Library replacement did not complete");
    assert.equal(schemaLibraryTransfer.review, false, "Schema Library replacement review remained open");
    assert.deepEqual(schemaLibraryTransfer.actions, ["Replace Schema Library", "Append to Schema Library", "Cancel"], "Schema Library replacement actions changed");
    assert.deepEqual(schemaLibraryTransfer.reloaded, schemaLibraryTransfer.before, "Schema Library replacement did not retain exported identities");
    await reloadPanel(socket);
    schemaReload = await evaluate(socket, `(async () => {
      const repository = await (await import("./data-layer-durable-project-repository.js")).openIndexedDbProjectRepository();
      const savedSchemas = await repository.savedSchemas();
      document.querySelector("#data-layer-view-schemas").click();
      for (let attempt = 0; attempt < 150 && document.querySelectorAll('#schema-list [data-schema-entry-key^="saved:"]').length < savedSchemas.length; attempt += 1) await new Promise((resolve) => setTimeout(resolve, 20));
      return { stored:savedSchemas.length, rendered:document.querySelectorAll('#schema-list [data-schema-entry-key^="saved:"]').length, storedRules:JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1") ?? "[]").length };
    })()`);
    assert.deepEqual(schemaReload, { stored:schemaLibraryTransfer.before.schemas.length, rendered:schemaLibraryTransfer.before.schemas.length, storedRules:schemaLibraryTransfer.before.rules.length }, "Schema Library did not survive a browser reload");
    schemaLiveValidation = await evaluate(socket, schemaLiveValidationRuntime);
    if (schemaLibraryExportFixture === "1:3") {
      assert.match(schemaLiveValidation.validation, /Not checked|Valid|warnings|issues/, "Live Validate did not render a state for the smaller export fixture");
    } else {
      assert.equal(schemaLiveValidation.validation, "Valid", "Live Validate did not render the canonical no-issue state");
      assert.equal(schemaLiveValidation.filtered.length, 0, "Warnings filter retained an event without warnings");
    }
    assert.ok(schemaLiveValidation.queryFields.includes("Validation state"), "Live query builder did not expose validation state");
  }
  return {
    fixture:schemaLibraryExportFixture,
    mounted:schemaWorkspaceRuntime.schemaMasterVisible,
    rules:schemaWorkspaceRuntime.propertyRule,
    assignment:schemaWorkspaceRuntime.assignment,
    sourceCreation:schemaSourceCreation,
    inheritance:schemaInheritance,
    transfer:schemaLibraryTransfer,
    reload:schemaReload,
    validation:schemaLiveValidation,
    ruleEditorVisibility:schemaRuleEditorVisibility,
  };
}

{
  const port = await debuggingPort();
  const extensionId=await loadedExtensionId(port);
  if (!suppliedTargetContext && browserTargetIds.length === 0) {
    await verifyExactOriginPermissionRecovery(port, extensionId);
  }
  const browserTargetFailures=[];
  for (const browserTargetId of browserTargetIds.length ? browserTargetIds : [null]) {
    if (browserTargetId) activateBrowserTarget(browserTargetId);
    refreshBrowserTargetRuntime();
    const targetTimer = browserTargetId && manageLifecycle ? createBrowserPhaseTimer({
      targetId:browserTargetId,
      phaseNames:["target setup", "navigation", "fixture", "interaction", "persistence", "assertion", "target cleanup"],
    }) : null;
    targetTimer?.transition("interaction");
    let browserTargetStoragePrepared=false;
    let failedAtPhase;
    const targetDefinition = targetDefinitions.get(browserTargetId);
    if (targetDefinition) componentWidths = plannerEnvironment.SWARMFORGE_ROW_COMPOSITION_VIEWPORT_WIDTH
      ? [Number(plannerEnvironment.SWARMFORGE_ROW_COMPOSITION_VIEWPORT_WIDTH)]
      : [...targetDefinition.viewport];
    const targetContext = suppliedTargetContext ?? { id:browserTargetId,
      configuration:targetDefinition?.configuration ?? activeBrowserTargetEnvironment,
      fixturePrograms, activeFixtureModule:null };
    try {
    const executeFixture=async()=>{
    for (const width of componentWidths) {
    recordViewport?.(width);
    const specificationScenarioId=activeBrowserTargetEnvironment.SPECIFICATION_PROJECT_SCENARIO_ID??"",capturedContinuationScenario=activeBrowserTargetEnvironment.SPECIFICATION_PROJECT_BROWSER_ADAPTER==="1"&&specificationScenarioId.includes("canonical project schema drafts runtime 021");
    const socket = activeBrowserTargetEnvironment.SPECIFICATION_PROJECT_BROWSER_ADAPTER === "1" ? await openSpecificationBuilder(port,width,900,capturedContinuationScenario?`chrome-extension://${extensionId}/specification-builder.html`:undefined) : suppliedTargetContext?.acquireInstalledSocket ? await suppliedTargetContext.acquireInstalledSocket(width) : await openPanel(port, width);
    if (browserTargetId&&!browserTargetStoragePrepared&&!suppliedTargetContext?.resetEvidence) {
      for(const origin of [`chrome-extension://${extensionId}`,`http://127.0.0.1:${assetPort}`]){
        await socket.call("Storage.clearDataForOrigin", {origin,storageTypes:"all"});
      }
      await socket.call("Runtime.evaluate", {
        expression:"delete globalThis.__flushDurableSchemaObservation",
      });
      await reloadPanel(socket);
      browserTargetStoragePrepared=true;
    }
    if (activeBrowserTargetEnvironment.SPECIFICATION_PROJECT_BROWSER_ADAPTER === "1") {
      if(capturedContinuationScenario){
        const observedPage=await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(`http://127.0.0.1:${assetPort}/observation-target.html`)}`,{method:"PUT"}).then((response)=>response.json()),observedSocket=new DevtoolsSocket(observedPage.webSocketDebuggerUrl);await observedSocket.connect();await observedSocket.call("Runtime.enable");
        await evaluate(socket,`(async()=>{const q=(selector)=>{const value=document.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;},set=(selector,value)=>{const input=q(selector);input.value=value;input.dispatchEvent(new Event("input",{bubbles:true}));},pause=()=>new Promise((resolve)=>setTimeout(resolve,0)),add=async(kind,name)=>{q("#entity-kind").value=kind;set("#entity-name",name);q("#add-entity-form").requestSubmit();await pause();};set("#project-name","Retail and Trade");set("#project-site","shop.example");q("#create-project-form").requestSubmit();await pause();await add("profiles","Retail");q('[aria-label="Bulk input format"]').value="json";set("#bulk-properties",JSON.stringify([{path:"/currency",type:"string",allowedValues:["EUR"]},{path:"/order_id",type:"string",required:true}]));q("#commit-bulk-properties").click();q("#confirm-bulk-properties").click();await pause();await add("pages","Checkout confirmation");await add("events","Purchase");await add("applicabilitySets","Retail purchase context");q('#project-tree button[data-kind="schemaDrafts"]').click();set("#project-schema-name","Purchase");set("#project-schema-revision",4);q("#create-project-schema-draft").requestSubmit();await pause();q("#workspace-content .entity-row button").click();const profileIds=q('.contextual-editor select[name="profileIds"]');profileIds.options[0].selected=true;q(".contextual-editor form").requestSubmit();await pause();q('#project-tree button[data-kind="assignments"]').click();const project=JSON.parse(localStorage.getItem("my-chrome-utilities.specification-project.v1")).project;set("#project-assignment-name","Retail purchase");q("#project-assignment-schema").value=project.collections.schemaDrafts[0].id;q("#project-assignment-event").value=project.collections.events[0].id;q("#project-assignment-applicability").value=project.collections.applicabilitySets[0].id;set("#project-assignment-source","event-history");set("#project-assignment-priority",10);set("#project-assignment-revision",4);q("#save-project-assignment").requestSubmit();await pause();return true;})()`);
        await socket.call("Page.enable");
        await socket.call("Page.navigate",{url:`chrome-extension://${extensionId}/side-panel.html`});
        for(let attempt=0;attempt<panelReadyAttempts;attempt+=1){const ready=await socket.call("Runtime.evaluate",{expression:"document.readyState === 'complete' && document.querySelector('#side-panel-root')?.dataset.utilityShellReady === 'true'",returnByValue:true});if(ready.result.value===true)break;await wait(50);}
        await socket.call("Target.activateTarget",{targetId:observedPage.id});
        await observedSocket.call("Input.dispatchKeyEvent",{type:"rawKeyDown",modifiers:10,key:"!",code:"Digit1",windowsVirtualKeyCode:49,nativeVirtualKeyCode:49});
        await observedSocket.call("Input.dispatchKeyEvent",{type:"keyUp",modifiers:10,key:"!",code:"Digit1",windowsVirtualKeyCode:49,nativeVirtualKeyCode:49});
        const targetAction=await evaluate(socket,`(async()=>{const q=(selector)=>{const value=document.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;},wait=(ms)=>new Promise((resolve)=>setTimeout(resolve,ms));q("#choose-observation-target").click();await wait(100);const row=Array.from(q("#observation-target-list").children).find(({textContent})=>textContent.includes("Retail confirmation"));if(!row)throw new Error("Loaded extension did not discover the real Retail tab: "+q("#observation-target-list").textContent);return row.querySelector("button")?.textContent;})()`);
        assert.equal(targetAction,"Select","Keyboard invocation must grant activeTab");
        await evaluate(socket,`(()=>{const row=Array.from(document.querySelector("#observation-target-list").children).find(({textContent})=>textContent.includes("Retail confirmation"));row.querySelector("button").click();return true;})()`);
        const activeExtensionTarget=(await fetch(`http://127.0.0.1:${port}/json/list`).then((response)=>response.json())).find(({url})=>url===`chrome-extension://${extensionId}/side-panel.html`);
        await socket.call("Target.activateTarget",{targetId:activeExtensionTarget.id});
        await evaluate(socket,`(()=>{const input=document.querySelector("#history-path");input.value="dataLayer";input.dispatchEvent(new Event("input",{bubbles:true}));return true;})()`);
        await wait(100);
        for(let attempt=0;attempt<100&&await evaluate(socket,`document.querySelector("#start-data-layer-testing").disabled`);attempt+=1)await wait(20);
        const chromeApiProof=await evaluate(socket,`(()=>{const start=document.querySelector("#start-data-layer-testing");if(start.disabled)throw new Error("Production target did not become startable: "+document.querySelector("#observation-target-result").textContent+"; "+document.querySelector("#history-path-status").textContent);start.click();return{runtimeId:chrome.runtime.id,tabsQuery:String(chrome.tabs.query).includes("[native code]"),executeScript:String(chrome.scripting.executeScript).includes("[native code]"),runtimeListener:String(chrome.runtime.onMessage.addListener).includes("[native code]")};})()`);
        for(let attempt=0;attempt<100&&!await evaluate(observedSocket,`Boolean(globalThis.__myChromeUtilitiesHistoryPushObservers?.dataLayer)`);attempt+=1)await wait(20);
        await evaluate(observedSocket,`dataLayer.push({event:"purchase",currency:"EUR",order_id:"o-1"})`);
        await evaluate(socket,`(async()=>{const q=(selector)=>{const value=document.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;},wait=(ms=0)=>new Promise((resolve)=>setTimeout(resolve,ms));for(let attempt=0;attempt<100&&!q("#live-event-feed button");attempt+=1)await wait(20);q("#data-layer-view-schemas").click();q("#recheck-schema-validation").click();await wait();return true;})()`);
        specificationProjectObservation=await evaluate(socket,`(async()=>{const q=(selector)=>{const value=document.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;},pause=()=>new Promise((resolve)=>setTimeout(resolve,0));q("#data-layer-view-schemas").click();await pause();const continueButton=Array.from(q("#schema-validation-record-list").querySelectorAll("button")).find(({textContent})=>textContent==="Continue in project");if(!continueButton)throw new Error("Missing Continue in project action: "+q("#schema-validation-record-list").textContent);continueButton.click();await pause();const dialog=Array.from(document.querySelectorAll("dialog[open]")).find(({textContent})=>textContent.includes("Continue captured validation in project"));if(!dialog)throw new Error("Missing captured continuation review");const labels=Array.from(dialog.querySelectorAll("label"),({textContent})=>textContent),eventNames=Array.from(dialog.querySelectorAll("label select")).find((select)=>select.parentElement.textContent.includes("Event"))?[...Array.from(dialog.querySelectorAll("label select")).find((select)=>select.parentElement.textContent.includes("Event")).options].map(({textContent})=>textContent):[];Array.from(dialog.querySelectorAll("button")).find(({textContent})=>textContent.includes("Save Fixture"))?.click();await pause();const stored=JSON.parse(localStorage.getItem("my-chrome-utilities.specification-project.v1")),fixture=stored.project.collections.fixtures[0],navigation=JSON.parse(localStorage.getItem("my-chrome-utilities.specification-project-navigation.v1"));return{corrections:{capturedContinuation:{reviewOpen:true,labels,eventNames,provenance:fixture.provenance.kind,assertionCount:fixture.assertions.length,evaluationResultIdentity:fixture.evaluationResultIdentity,evaluatedRecords:JSON.parse(localStorage.getItem("my-chrome-utilities.schema-validation-records.v1")),reviewText:dialog.textContent,observationName:fixture.observations[0].eventName,fixtureId:fixture.id,navigationId:navigation.id,openedBuilder:false}}};})()`);
        const profileContinuation=await evaluate(socket,`(async()=>{const wait=()=>new Promise((resolve)=>setTimeout(resolve,0)),button=Array.from(document.querySelectorAll("#schema-validation-record-list button")).find(({textContent})=>textContent==="Continue in project");button.click();await wait();const dialog=Array.from(document.querySelectorAll("dialog[open]")).find(({textContent})=>textContent.includes("Continue captured validation in project")),selects=Array.from(dialog.querySelectorAll("label select")),destination=selects.find((select)=>select.parentElement.firstChild.textContent==="Destination"),profile=selects.find((select)=>select.parentElement.firstChild.textContent==="Profile");destination.value="profile";destination.dispatchEvent(new Event("change",{bubbles:true}));profile.value=profile.options[1].value;Array.from(dialog.querySelectorAll("button")).find(({textContent})=>textContent.includes("Add requirements"))?.click();await wait();const stored=JSON.parse(localStorage.getItem("my-chrome-utilities.specification-project.v1")),retail=stored.project.collections.profiles.find(({name})=>name==="Retail"),navigation=JSON.parse(localStorage.getItem("my-chrome-utilities.specification-project-navigation.v1"));return{paths:retail.requirements.map(({path})=>path),evidence:retail.requirements.map(({evaluationResultIdentity})=>evaluationResultIdentity),navigation};})()`);
        const continuation=specificationProjectObservation.corrections.capturedContinuation;assert.deepEqual(chromeApiProof,{runtimeId:extensionId,tabsQuery:true,executeScript:true,runtimeListener:true});assert.deepEqual(profileContinuation.paths,["/currency","/order_id"]);assert.ok(profileContinuation.evidence.every((identity)=>identity===continuation.evaluationResultIdentity));assert.equal(profileContinuation.navigation.kind,"profiles");await wait(500);const browserTargets=await fetch(`http://127.0.0.1:${port}/json/list`).then((response)=>response.json());const fixtureTarget=browserTargets.find(({url})=>url.includes("specification-builder.html?kind=fixtures")),fixtureSocket=new DevtoolsSocket(fixtureTarget.webSocketDebuggerUrl);await fixtureSocket.connect();await fixtureSocket.call("Runtime.enable");let fixtureRunnerReady=false;for(let attempt=0;attempt<panelReadyAttempts;attempt+=1){const ready=await fixtureSocket.call("Runtime.evaluate",{expression:"document.readyState === 'complete' && document.querySelector('#fixture-run-result') !== null",returnByValue:true});if(ready.result.value===true){fixtureRunnerReady=true;break;}await wait(20);}if(!fixtureRunnerReady)throw new Error("Opened Fixture did not render its production runner");const runner=await evaluate(fixtureSocket,'(()=>{Array.from(document.querySelectorAll("#workspace-content button")).find(({textContent})=>textContent==="Run Fixture").click();const result=document.querySelector("#fixture-run-result");return{result:result.textContent,panel:result.closest("section").textContent};})()');fixtureSocket.close();observedSocket.close();continuation.openedBuilder=Boolean(fixtureTarget);assert.deepEqual(continuation.eventNames,["Purchase"]);assert.equal(continuation.provenance,"captured-validation");assert.equal(continuation.assertionCount,2);assert.match(continuation.evaluationResultIdentity,/^result:/);assert.match(continuation.reviewText,/Evaluated result result:/);assert.match(continuation.reviewText,/Profile requirements: \/currency/);assert.match(continuation.reviewText,/\/order_id \(string, required\)/);assert.equal(continuation.fixtureId,continuation.navigationId);assert.match(runner.result,/^PASS/);assert.ok(runner.result.includes(`captured evaluator result ${continuation.evaluationResultIdentity}`));assert.ok(runner.result.includes(`replay result ${continuation.evaluationResultIdentity}`));assert.match(runner.result,/status and issueCodes assertions matched/);assert.match(runner.panel,/Captured observation: purchase/);assert.match(runner.panel,/Proposed assertions: status pass; issueCodes \[\]/);assert.equal(continuation.openedBuilder,true,JSON.stringify(browserTargets.map(({url})=>url)));socket.close();continue;
      }
      if ((activeBrowserTargetEnvironment.SPECIFICATION_PROJECT_SCENARIO_ID??"").includes("canonical project schema drafts runtime 004")) {
        specificationProjectObservation=await evaluate(socket,`(async()=>{const q=(selector)=>{const value=document.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;},set=(selector,value)=>{const input=q(selector);input.value=value;input.dispatchEvent(new Event("input",{bubbles:true}));},pause=()=>new Promise((resolve)=>setTimeout(resolve,0));set("#project-name","Retry project");set("#project-site","shop.example");q("#create-project-form").requestSubmit();await pause();const projectKey="my-chrome-utilities.specification-project.v1",schemaKey="my-chrome-utilities.schema-library.v1",projectBefore=localStorage.getItem(projectKey),schemaBefore=localStorage.getItem(schemaKey),originalSet=Storage.prototype.setItem;let failOnce=true;Storage.prototype.setItem=function(key,value){if(failOnce&&key===projectKey){failOnce=false;throw new DOMException("quota","QuotaExceededError");}return originalSet.call(this,key,value);};q("#entity-kind").value="propertySets";set("#entity-name","Recovered Property Set");q("#add-entity-form").requestSubmit();await pause();const failed={status:q("#project-state").textContent,retryVisible:!q("#retry-save").hidden,valuePresent:q("#project-tree").textContent.includes("Property Sets (1)")},atomicRollback={projectBytesUnchanged:localStorage.getItem(projectKey)===projectBefore,schemaBytesUnchanged:localStorage.getItem(schemaKey)===schemaBefore,status:q("#project-state").textContent};Storage.prototype.setItem=originalSet;q("#retry-save").click();await pause();failed.retried=q("#project-state").textContent;failed.count=JSON.parse(localStorage.getItem(projectKey)).project.collections.propertySets.length;return{corrections:{failed,atomicRollback}};})()`);
        assert.match(specificationProjectObservation.corrections.failed.status,/^Save failed/);assert.equal(specificationProjectObservation.corrections.failed.retryVisible,true);assert.equal(specificationProjectObservation.corrections.failed.valuePresent,true);assert.match(specificationProjectObservation.corrections.failed.retried,/^Saved/);assert.equal(specificationProjectObservation.corrections.failed.count,1);socket.close();continue;
      }
      if ((activeBrowserTargetEnvironment.SPECIFICATION_PROJECT_SCENARIO_ID??"").includes("canonical project schema drafts runtime 014")) {
        specificationProjectObservation=await evaluate(socket,`(async()=>{const q=(selector)=>{const value=document.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;},set=(selector,value)=>{const input=q(selector);input.value=value;input.dispatchEvent(new Event("input",{bubbles:true}));},pause=()=>new Promise((resolve)=>setTimeout(resolve,0)),projectKey="my-chrome-utilities.specification-project.v1",libraryKey="my-chrome-utilities.schema-library.v1";set("#project-name","Assignment lifecycle");set("#project-site","shop.example");q("#create-project-form").requestSubmit();await pause();localStorage.setItem(libraryKey,JSON.stringify([{id:"schema:legacy",name:"Legacy",version:1,published:true,document:{type:"object"},assignments:[]} ]));const add=async(kind,name)=>{q("#entity-kind").value=kind;set("#entity-name",name);q("#add-entity-form").requestSubmit();await pause();};await add("events","Purchase");await add("applicabilitySets","Retail checkout");await add("applicabilitySets","Trade checkout");q('#project-tree button[data-kind="schemaDrafts"]').click();set("#project-schema-name","Purchase schema");set("#project-schema-id","schema:purchase");set("#project-schema-revision",3);set("#project-schema-description","Shared purchase schema");q("#create-project-schema-draft").requestSubmit();await pause();q('#project-tree button[data-kind="assignments"]').click();let stored=JSON.parse(localStorage.getItem(projectKey)),event=stored.project.collections.events[0],sets=stored.project.collections.applicabilitySets,releasesBefore=JSON.stringify(stored.project.releases);const save=async(name,setId,priority)=>{set("#project-assignment-name",name);set("#project-assignment-schema","schema:purchase");set("#project-assignment-event",event.id);set("#project-assignment-applicability",setId);set("#project-assignment-source","event-history");q("#project-assignment-target").value="payload";set("#project-assignment-priority",priority);q("#project-assignment-version-policy").value="pinned";set("#project-assignment-revision",3);q("#save-project-assignment").requestSubmit();await pause();};await save("Retail purchase",sets[0].id,10);await save("Trade purchase",sets[1].id,20);set("#project-assignment-search","retail");const search={count:q("#project-assignment-count").textContent,empty:!q("#project-assignment-empty").hidden};q("#project-assignment-list button").click();const stableId=q("#project-assignment-id").value,applicabilityBefore=q("#project-assignment-applicability").value;set("#project-assignment-priority",30);q("#save-project-assignment").requestSubmit();await pause();stored=JSON.parse(localStorage.getItem(projectKey));const assignments=stored.project.collections.assignments,edited=assignments.find(({id})=>id===stableId),library=JSON.parse(localStorage.getItem(libraryKey));q("#project-assignment-id").value="";set("#project-assignment-name","Blank placeholder");set("#project-assignment-schema","");set("#project-assignment-source","");set("#project-assignment-event","");q("#save-project-assignment").noValidate=true;q("#save-project-assignment").requestSubmit();q("#save-project-assignment").noValidate=false;await pause();const afterBlank=JSON.parse(localStorage.getItem(projectKey));return{corrections:{assignmentLifecycle:{search,ids:assignments.map(({id})=>id),stableId:edited.id===stableId,conditionPreserved:edited.applicabilitySetId===applicabilityBefore,pinnedRevision:edited.schemaRevision,publishedUnchanged:JSON.stringify(stored.project.releases)===releasesBefore,sidePanelSynced:stored.project.collections.schemaDrafts.every(({workingDraft})=>Boolean(workingDraft)),legacyAfterSave:library.some(({id,version})=>id==="schema:legacy"&&version===1),projectAuthoritativeAfterSave:stored.project.collections.schemaDrafts.some(({id})=>id==="schema:purchase"),blankExcluded:afterBlank.project.collections.assignments.length===2,blankMessage:q("#project-assignment-conflicts").textContent}}};})()`);
        const lifecycle=specificationProjectObservation.corrections.assignmentLifecycle;assert.equal(lifecycle.ids.length,2);assert.equal(new Set(lifecycle.ids).size,2);assert.equal(lifecycle.stableId,true);assert.equal(lifecycle.conditionPreserved,true);assert.equal(lifecycle.pinnedRevision,3);assert.equal(lifecycle.publishedUnchanged,true);socket.close();continue;
      }
      specificationProjectObservation=await evaluate(socket,`(async()=>{
        const q=(selector)=>{const value=document.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;},set=(selector,value)=>{const input=q(selector);input.value=value;input.dispatchEvent(new Event("input",{bubbles:true}));};
        localStorage.clear();
        set("#project-name","Shop data specification");set("#project-description","Retail and Trade");set("#project-site","shop.example");q("#create-project-form").requestSubmit();
        const created={empty:q("#project-empty").hidden,workspace:!q("#project-workspace").hidden,context:q("#project-context").textContent,status:q("#project-state").textContent,tree:Array.from(q("#project-tree").querySelectorAll("button"),({textContent})=>textContent)};
        const add=async(kind,name)=>{q("#entity-kind").value=kind;set("#entity-name",name);q("#add-entity-form").requestSubmit();await new Promise((resolve)=>setTimeout(resolve,0));};
        await add("profiles","Sitewide");await add("pages","Checkout confirmation");await add("events","Purchase");await add("applicabilitySets","Retail confirmation");await add("flows","Retail checkout");await add("fixtures","Retail passes");
        set("#project-search","Purchase");const search={rows:Array.from(q("#workspace-content").querySelectorAll(".entity-row button"),({textContent})=>textContent),query:q("#project-search").value};set("#project-search","");
        q('#project-tree button[data-kind="profiles"]').click();q("#workspace-content .entity-row button").click();set("#bulk-properties",Array.from({length:100},(_,index)=>"/property_"+(index+1)+",string").join("\\n"));q("#commit-bulk-properties").click();const stagedMessage=q("#bulk-stage-review").textContent;q("#confirm-bulk-properties").click();const bulk={stagedMessage,message:q("#bulk-assistance").textContent,undoEnabled:!q("#undo-project").disabled,rowCount:JSON.parse(localStorage.getItem("my-chrome-utilities.specification-project.v1")).project.collections.profiles[0].requirements.length};q("#undo-project").click();const afterUndo=JSON.parse(localStorage.getItem("my-chrome-utilities.specification-project.v1")).project.collections.profiles[0].requirements.length;q("#redo-project").click();
        q("#run-preflight").click();const preflight=q("#workspace-content").textContent;q("#publish-project").click();const release={open:q("#release-review").open,summary:q("#release-summary").textContent,confirmDisabled:q("#confirm-release").disabled};if(!release.confirmDisabled)q("#confirm-release").click();else q("#cancel-release").click();
        const stored=JSON.parse(localStorage.getItem("my-chrome-utilities.specification-project.v1"));const layout={width:innerWidth,columns:getComputedStyle(q("#project-workspace")).gridTemplateColumns,workspaceOverflow:getComputedStyle(q("#workspace-pane")).overflowY,renderedRows:q("#workspace-content").querySelectorAll(".entity-row").length,focusable:Boolean(q("#workspace-pane").tabIndex===-1)};
        return{created,search,bulk,afterUndo,preflight,release,stored:{name:stored.project.name,collections:Object.fromEntries(Object.entries(stored.project.collections).map(([kind,items])=>[kind,items.length])),releases:stored.project.releases.length,draft:Boolean(stored.draft)},layout};
	      })()`);
	      specificationProjectObservation.corrections=await evaluate(socket,`(async()=>{
	        const q=(selector)=>{const value=document.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;},set=(selector,value)=>{const input=q(selector);input.value=value;input.dispatchEvent(new Event("input",{bubbles:true}));},pause=()=>new Promise((resolve)=>setTimeout(resolve,0));
	        const clipboard=[];class TestClipboardItem{constructor(data){this.data=data;this.types=Object.keys(data);}async getType(type){return this.data[type];}}Object.defineProperty(globalThis,"ClipboardItem",{configurable:true,value:TestClipboardItem});Object.defineProperty(navigator,"clipboard",{configurable:true,value:{write:async(items)=>clipboard.push(items[0]),writeText:async(text)=>clipboard.push(text)}});
	        const schemaLibraryKey="my-chrome-utilities.schema-library.v1",unrelatedLegacySchema={id:"schema-legacy",name:"Legacy checkout",version:1,published:true,document:{type:"object"},assignments:[]},staleProjectSchema={id:"schema-retail",name:"Stale Retail copy",version:99,published:true,document:{type:"object"},assignments:[]};localStorage.setItem(schemaLibraryKey,JSON.stringify([unrelatedLegacySchema,staleProjectSchema]));
	        q("#generate-documentation").click();q("#documentation-flows").click();q("#copy-documentation").click();await pause();const copied=clipboard[0],documentation={open:q("#documentation-export").open,preview:q("#documentation-preview").textContent,plain:await (await copied.getType("text/plain")).text(),html:await (await copied.getType("text/html")).text(),announcement:q("#documentation-result").textContent};q("#close-documentation").click();documentation.focusRestored=document.activeElement===q("#generate-documentation");
	        q("#publish-project").click();const restoreAvailable=!q("#restore-release").disabled;if(restoreAvailable)q("#restore-release").click();else q("#cancel-release").click();
	        const add=async(kind,name)=>{q("#entity-kind").value=kind;set("#entity-name",name);q("#add-entity-form").requestSubmit();await pause();};
	        await add("events","Retail entry");await add("events","Trade entry");const setEventSource=async(eventName)=>{q('#project-tree button[data-kind="events"]').click();Array.from(q("#workspace-content").querySelectorAll(".entity-row button")).find(({textContent})=>textContent===eventName).click();set('.contextual-editor [name="sourceId"]',"queue.history");q(".contextual-editor form").requestSubmit();await pause();};await setEventSource("Purchase");await setEventSource("Retail entry");await setEventSource("Trade entry");let stored=JSON.parse(localStorage.getItem("my-chrome-utilities.specification-project.v1")),event=stored.project.collections.events[0],retailEntry=stored.project.collections.events[1],tradeEntry=stored.project.collections.events[2];q('#project-tree button[data-kind="flows"]').click();q("#workspace-content .entity-row button").click();const addStep=async({name,pageId="",eventId="",minimum=1,maximum=1,optional=false,branch="",from="",to=""})=>{set("#flow-step-name",name);set("#flow-step-page",pageId);set("#flow-step-event",eventId);set("#flow-step-minimum",minimum);set("#flow-step-maximum",maximum);q("#flow-step-optional").checked=optional;set("#flow-step-branch",branch);set("#flow-step-from",from);set("#flow-step-to",to);q("#add-flow-step-form").requestSubmit();await pause();};await addStep({name:"Product",eventId:retailEntry.id,maximum:5,branch:"retail-checkout"});await addStep({name:"Upsell",optional:true,branch:"upsell-or-checkout",from:"product",to:"confirmation"});await addStep({name:"Retail confirmation",eventId:event.id,from:"upsell",to:"confirmation"});
	        await add("flows","Trade checkout");await addStep({name:"Trade account",eventId:tradeEntry.id,branch:"trade-checkout"});await addStep({name:"Trade confirmation",eventId:event.id,from:"account",to:"confirmation"});for(let index=3;index<=50;index+=1)await add("flows","Benchmark flow "+index);
	        await add("profiles","Retail confirmation requirements");await add("profiles","Trade account requirements");stored=JSON.parse(localStorage.getItem("my-chrome-utilities.specification-project.v1"));const tradeFlow=stored.project.collections.flows[1],retailProfile=stored.project.collections.profiles[0],tradeProfile=stored.project.collections.profiles.at(-1);const createSchema=async(id,name,revision)=>{set("#project-schema-name",name);set("#project-schema-id",id);set("#project-schema-revision",revision);set("#project-schema-description",name+" schema");q("#create-project-schema-draft").requestSubmit();await pause();};await createSchema("schema-retail","Retail confirmation requirements",3);await createSchema("schema-trade","Trade account requirements",4);const bindSchemaProfile=async(schemaName,profileId)=>{q('#project-tree button[data-kind="schemaDrafts"]').click();Array.from(q("#workspace-content").querySelectorAll(".entity-row button")).find(({textContent})=>textContent===schemaName).click();const profiles=q('.contextual-editor [name="profileIds"]');for(const option of profiles.options)option.selected=option.value===profileId;q(".contextual-editor form").requestSubmit();await pause();};await bindSchemaProfile("Retail confirmation requirements",retailProfile.id);await bindSchemaProfile("Trade account requirements",tradeProfile.id);stored=JSON.parse(localStorage.getItem("my-chrome-utilities.specification-project.v1"));const publishedSchemaBytes=JSON.stringify(stored.project.collections.schemaDrafts.map(({assignments,version})=>({assignments,version}))),saveAssignment=async({name,schemaId,selector,revision})=>{set("#project-assignment-name",name);set("#project-assignment-schema",schemaId);set("#project-assignment-source","event-history");set("#project-assignment-event","purchase");set("#project-assignment-priority",10);q("#project-assignment-version-policy").value="pinned";set("#project-assignment-revision",revision);set("#project-assignment-path","flowId");set("#project-assignment-value",selector);set("#project-assignment-not-path","");set("#project-assignment-not-value","");q("#save-project-assignment").requestSubmit();await pause();};await saveAssignment({name:"Retail",schemaId:"schema-retail",selector:"retail checkout",revision:3});await saveAssignment({name:"Trade",schemaId:"schema-trade",selector:"trade checkout",revision:4});
	        set("#project-assignment-search","retail");const assignmentSearch={count:q("#project-assignment-count").textContent,rows:Array.from(q("#project-assignment-list").querySelectorAll("button"),({textContent})=>textContent),empty:!q("#project-assignment-empty").hidden};q("#project-assignment-list button").click();const allAssignments=(value)=>value.project.collections.assignments,retailId=q("#project-assignment-id").value,beforeAssignment=allAssignments(JSON.parse(localStorage.getItem("my-chrome-utilities.specification-project.v1"))).find(({id})=>id===retailId),conditionFor=(value,assignment)=>value.project.collections.applicabilitySets.find(({id})=>id===assignment.applicabilitySetId)?.condition,conditionBefore=conditionFor(JSON.parse(localStorage.getItem("my-chrome-utilities.specification-project.v1")),beforeAssignment);set("#project-assignment-priority",20);q("#save-project-assignment").requestSubmit();await pause();stored=JSON.parse(localStorage.getItem("my-chrome-utilities.specification-project.v1"));const assignments=allAssignments(stored),editedRetail=assignments.find(({id})=>id===retailId),libraryAfterSave=JSON.parse(localStorage.getItem(schemaLibraryKey)),assignmentLifecycle={search:assignmentSearch,ids:assignments.map(({id})=>id),stableId:editedRetail.id===retailId,conditionPreserved:JSON.stringify(conditionFor(stored,editedRetail))===JSON.stringify(conditionBefore),pinnedRevision:editedRetail.schemaRevision,publishedUnchanged:JSON.stringify(stored.project.collections.schemaDrafts.map(({assignments,version})=>({assignments,version})))===publishedSchemaBytes,sidePanelSynced:stored.project.collections.schemaDrafts.every(({workingDraft})=>Boolean(workingDraft)),legacyAfterSave:libraryAfterSave.some(({id,version})=>id==="schema-legacy"&&version===1),projectAuthoritativeAfterSave:stored.project.collections.schemaDrafts.some(({id,name,version})=>id==="schema-retail"&&name==="Retail confirmation requirements"&&version===3)&&libraryAfterSave.some(({id,name,version})=>id==="schema-retail"&&name==="Stale Retail copy"&&version===99)};q("#project-assignment-id").value="";set("#project-assignment-name","Blank placeholder");set("#project-assignment-schema","");set("#project-assignment-source","");set("#project-assignment-event","");q("#save-project-assignment").noValidate=true;q("#save-project-assignment").requestSubmit();q("#save-project-assignment").noValidate=false;await pause();assignmentLifecycle.blankExcluded=allAssignments(JSON.parse(localStorage.getItem("my-chrome-utilities.specification-project.v1"))).length===2;assignmentLifecycle.blankMessage=q("#project-assignment-conflicts").textContent;
	        q('#project-tree button[data-kind="profiles"]').click();q("#workspace-content .entity-row button").click();set("#bulk-properties",Array.from({length:400},(_,index)=>"/benchmark_"+(index+1)+",string").join("\\n"));q("#commit-bulk-properties").click();q("#confirm-bulk-properties").click();
	        stored=JSON.parse(localStorage.getItem("my-chrome-utilities.specification-project.v1"));const projectModule=await import("./data-layer-specification-project.js");
	        const benchmarkStart=performance.now();q("#show-coverage").click();const benchmarkDuration=performance.now()-benchmarkStart,coverage={rendered:q("#workspace-content").querySelectorAll(".coverage-row").length,summary:q("#workspace-content .status-text")?.textContent??q("#workspace-content").textContent,duration:benchmarkDuration},coverageButton=q("#workspace-content").querySelector(".coverage-row button");if(!coverageButton)throw new Error("Coverage row missing: "+coverage.summary+"; schemas="+JSON.stringify(stored.project.collections.schemaDrafts.map(({id,profileIds})=>({id,profileIds}))));coverageButton.click();await pause();coverage.deepLink=location.search;coverage.focusTarget=document.activeElement?.id||document.activeElement?.tagName;coverage.focused=coverage.focusTarget==="workspace-pane";
	        const originalSet=Storage.prototype.setItem;let failOnce=true;Storage.prototype.setItem=function(key,value){if(failOnce&&key==="my-chrome-utilities.specification-project.v1"){failOnce=false;throw new DOMException("quota","QuotaExceededError");}return originalSet.call(this,key,value);};await add("propertySets","Recovered Property Set");const failed={status:q("#project-state").textContent,retryVisible:!q("#retry-save").hidden,valuePresent:q("#project-tree").textContent.includes("Property Sets (1)")};Storage.prototype.setItem=originalSet;q("#retry-save").click();failed.retried=q("#project-state").textContent;failed.count=JSON.parse(localStorage.getItem("my-chrome-utilities.specification-project.v1")).project.collections.propertySets.length;
	        const projectBytesBeforeSecondWrite=localStorage.getItem("my-chrome-utilities.specification-project.v1"),schemaBytesBeforeSecondWrite=localStorage.getItem(schemaLibraryKey);let failCanonicalWriteOnce=true;Storage.prototype.setItem=function(key,value){if(failCanonicalWriteOnce&&key==="my-chrome-utilities.specification-project.v1"){failCanonicalWriteOnce=false;throw new DOMException("project quota","QuotaExceededError");}return originalSet.call(this,key,value);};await add("propertySets","Atomic rollback candidate");Storage.prototype.setItem=originalSet;const atomicRollback={projectBytesUnchanged:localStorage.getItem("my-chrome-utilities.specification-project.v1")===projectBytesBeforeSecondWrite,schemaBytesUnchanged:localStorage.getItem(schemaLibraryKey)===schemaBytesBeforeSecondWrite,status:q("#project-state").textContent};q("#retry-save").click();
	        const repositoryModule=await import("./data-layer-specification-repository.js"),conflictBase=repositoryModule.restoreCanonicalProjectState(localStorage.getItem("my-chrome-utilities.specification-project.v1")),conflictEnvelope=repositoryModule.restoreCanonicalProjectEnvelope(localStorage.getItem("my-chrome-utilities.specification-project.v1")),overlapId="propertySet:overlap",externalState={...conflictBase,project:{...conflictBase.project,description:"Externally saved description",collections:{...conflictBase.project.collections,propertySets:[...conflictBase.project.collections.propertySets,{id:overlapId,name:"Externally added Property Set"}]}}};repositoryModule.commitCanonicalProjectState(localStorage,externalState,{expectedRevision:conflictEnvelope.revision,base:conflictBase,pendingLabel:"External description and Property Set"});const originalRandomUUID=crypto.randomUUID.bind(crypto);Object.defineProperty(crypto,"randomUUID",{configurable:true,value:()=>"overlap"});await add("propertySets","Pending concurrent Property Set");Object.defineProperty(crypto,"randomUUID",{configurable:true,value:originalRandomUUID});const conflictResolution={open:q("#project-conflict-review").open,summary:q("#project-conflict-summary").textContent,actions:[q("#reload-project-conflict").textContent,q("#reapply-project-conflict").textContent,q("#merge-project-conflict").textContent]};q("#reapply-project-conflict").click();await pause();const conflictPersisted=repositoryModule.restoreCanonicalProjectState(localStorage.getItem("my-chrome-utilities.specification-project.v1"));conflictResolution.externalPreserved=conflictPersisted.project.description==="Externally saved description";conflictResolution.pendingPreserved=conflictPersisted.project.collections.propertySets.some(({name})=>name==="Pending concurrent Property Set");conflictResolution.closed=!q("#project-conflict-review").open;
	        q("#publish-project").click();const releaseReview={summary:q("#release-summary").textContent,diff:q("#release-diff").textContent,publishedBefore:JSON.parse(localStorage.getItem("my-chrome-utilities.specification-project.v1")).project.releases.length};q("#cancel-release").click();releaseReview.focusRestored=document.activeElement===q("#publish-project");q("#publish-project").click();q("#confirm-release").click();await pause();const publishedState=JSON.parse(localStorage.getItem("my-chrome-utilities.specification-project.v1")),publishedLibrary=JSON.parse(localStorage.getItem(schemaLibraryKey));releaseReview.legacyPreserved=publishedLibrary.some(({id,version})=>id==="schema-legacy"&&version===1);releaseReview.projectAuthoritative=publishedState.project.collections.schemaDrafts.some(({id,name})=>id==="schema-retail"&&name==="Retail confirmation requirements")&&publishedLibrary.some(({id,name,version})=>id==="schema-retail"&&name==="Stale Retail copy"&&version===99);
	        const source=projectModule.exportSpecificationProjectState(JSON.parse(localStorage.getItem("my-chrome-utilities.specification-project.v1"))),input=q("#import-project-file"),transfer=new DataTransfer();transfer.items.add(new File([source],"shop-project.json",{type:"application/json"}));Object.defineProperty(input,"files",{configurable:true,value:transfer.files});input.dispatchEvent(new Event("change",{bubbles:true}));await new Promise((resolve)=>setTimeout(resolve,50));const importReview={open:q("#import-review").open,summary:q("#import-summary").textContent,blocked:q("#commit-import").disabled};q("#remap-import").click();importReview.remapped=q("#import-summary").textContent;q("#commit-import").click();importReview.committed=!q("#import-review").open;importReview.projectId=JSON.parse(localStorage.getItem("my-chrome-utilities.specification-project.v1")).project.id;
	        return{documentation,restoreAvailable,assignmentLifecycle,structuredEditor:{retailSteps:stored.project.collections.flows[0].steps,tradeSteps:stored.project.collections.flows[1].steps,formLabels:Array.from(q("#add-flow-step-form").querySelectorAll("label"),({textContent})=>textContent.trim())},coverage,failed,atomicRollback,conflictResolution,releaseReview,importReview,graph:{properties:stored.project.collections.profiles[0].requirements.length,flows:stored.project.collections.flows.length,flowSteps:stored.project.collections.flows[0].steps.length}};
	      })()`);
	      specificationProjectObservation.corrections.layouts=[];
	      await evaluate(socket,`(()=>{document.querySelector('#project-tree button[data-kind="flows"]').click();document.querySelector('#workspace-content .entity-row button').click();document.querySelector('#project-assignment-list button').click();document.querySelector('#flow-step-editor').open=true;document.querySelector('#assignment-editor').open=false;})()`);
	      await socket.call("Page.enable");
	      for(const evidenceWidth of [360,520,720,1280]){
	        await socket.call("Emulation.setDeviceMetricsOverride",{width:evidenceWidth,height:900,deviceScaleFactor:1,mobile:false});
	        const observed=await evaluate(socket,`(()=>{const controls=Array.from(document.querySelectorAll("button,input:not([type=checkbox]),select,textarea")),workspace=document.querySelector("#project-workspace");return{width:innerWidth,pageOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,workspaceDisplay:getComputedStyle(workspace).display,rendered:document.querySelectorAll(".entity-row,.coverage-row").length,minTarget:Math.min(...controls.filter((control)=>control.getClientRects().length>0).map((control)=>control.getBoundingClientRect().height))};})()`);
	        specificationProjectObservation.corrections.layouts.push(observed);
	        if(activeBrowserTargetEnvironment.SPECIFICATION_PROJECT_CAPTURE_R03==="1"){
	          const directory=path.resolve("artifacts/schema-editor-walkthrough/R03");
	          await mkdir(directory,{recursive:true});
	          await evaluate(socket,`document.querySelector('#flow-step-editor').scrollIntoView({block:'start'});`);
	          const flowShot=await socket.call("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
	          await writeFile(path.join(directory,`structured-flow-editor-${evidenceWidth}.png`),Buffer.from(flowShot.data,"base64"));
	          await evaluate(socket,`(()=>{document.querySelector('#flow-step-editor').open=false;document.querySelector('#assignment-editor').open=true;document.querySelector('#assignment-editor').scrollIntoView({block:'start'});})()`);
	          const assignmentShot=await socket.call("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
	          await writeFile(path.join(directory,`assignment-lifecycle-${evidenceWidth}.png`),Buffer.from(assignmentShot.data,"base64"));
	          await evaluate(socket,`(()=>{document.querySelector('#assignment-editor').open=false;document.querySelector('#flow-step-editor').open=true;})()`);
	        }
	      }
	      await socket.call("Emulation.setDeviceMetricsOverride",{width:720,height:900,deviceScaleFactor:1,mobile:false});
	      const scenarioId=activeBrowserTargetEnvironment.SPECIFICATION_PROJECT_SCENARIO_ID??"";
	      const assignmentLifecycleWithoutLiveCapture=Array.from({length:6},(_,index)=>`truthful assignment lifecycle runtime ${String(index+1).padStart(3,"0")}`);
	      if (["greenfield Retail Trade production release runtime 007","greenfield Retail Trade production release runtime 009","greenfield Retail Trade production release runtime 010",...assignmentLifecycleWithoutLiveCapture].some((name)=>scenarioId.includes(name))) {
	        socket.close();continue;
	      }
	      const runtimeSocket=await openPanelWithInitialization(port,720,`(()=>{const messages=[],updates=[],removed=[],permissionRemoved=[],channels=new Map(),generations=new Map(),executions=[];const listenerApi=(items)=>({addListener:(listener)=>items.push(listener),removeListener:(listener)=>{const index=items.indexOf(listener);if(index>=0)items.splice(index,1);}}),api={__tab:{id:101,windowId:1,url:"https://shop.example/products/1",title:"Retail tab",active:true},__executions:executions,__channelGeneration(tabId){return generations.get(tabId)??0;},__setTab(tab){api.__tab=tab;},__emitCapture(tabId,rawValue){const channelId=channels.get(tabId);if(!channelId)throw new Error("No live capture channel for tab "+tabId+"; executions "+JSON.stringify(executions)+"; result "+document.querySelector("#observation-target-result")?.textContent+"; session "+localStorage.getItem("dataLayerTestingSession"));for(const listener of [...messages])listener({type:"my-chrome-utilities.data-layer-history-entry",channelId,rawValue,timestamp:new Date().toISOString()},{tab:{id:tabId}});},__emitUpdated(tabId,changeInfo,tab){for(const listener of [...updates])listener(tabId,changeInfo,tab);},runtime:{onMessage:listenerApi(messages)},tabs:{query:async()=>[api.__tab],onUpdated:listenerApi(updates),onRemoved:listenerApi(removed)},permissions:{onRemoved:listenerApi(permissionRemoved)},scripting:{executeScript:async(details)=>{executions.push({tabId:details.target?.tabId,world:details.world,args:details.args?.length});if(details.world==="MAIN"&&details.args?.length===3){channels.set(details.target.tabId,details.args[1]);generations.set(details.target.tabId,(generations.get(details.target.tabId)??0)+1);return[{result:{installed:true,rawValues:[]}}];}if(details.args?.length===1){const root={},parts=String(details.args[0]).split(".").filter(Boolean);let current=root;parts.forEach((part,index)=>{current[part]=index===parts.length-1?[]:{};current=current[part];});return[{result:root}];}return[{result:undefined}];}}};if(globalThis.chrome)Object.assign(globalThis.chrome,api);else Object.defineProperty(globalThis,"chrome",{configurable:true,writable:true,value:api});})()`);
	      const runtimeBoundary=await evaluate(runtimeSocket,`(async()=>{const wait=(ms=0)=>new Promise((resolve)=>setTimeout(resolve,ms)),waitFor=async(predicate,diagnosis=()=>"")=>{for(let attempt=0;attempt<100;attempt+=1){if(predicate())return;await wait(10);}throw new Error("Timed out waiting for live capture generation; "+diagnosis());},q=(selector)=>{const value=document.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;},routing=()=>{try{return JSON.parse(localStorage.getItem("my-chrome-utilities.flow-routing.v1")??"[]");}catch{return[];}},capture=async(tabId,rawValue)=>{const before=routing().length;chrome.__emitCapture(tabId,rawValue);await waitFor(()=>routing().length>before,()=>"live capture did not persist; tab "+tabId+"; before "+before+"; routing "+JSON.stringify(routing())+"; executions "+JSON.stringify(chrome.__executions));},session=()=>{try{return JSON.parse(localStorage.getItem("dataLayerTestingSession"))?.session;}catch{return undefined;}},liveMessage=()=>document.querySelector("#live-session-message")?.textContent??"",started=(tabId)=>session()?.status==="active"&&session()?.tabId===tabId&&liveMessage()==="Testing started"&&chrome.__channelGeneration(tabId)>0,start=async(label,tabId)=>{q("#choose-observation-target").dispatchEvent(new MouseEvent("click",{bubbles:true}));await wait(30);const rows=Array.from(q("#observation-target-list").children),row=rows.find((item)=>item.textContent.includes(label)),target=row?.querySelector("button");if(!target)throw new Error("Missing target "+label+"; found "+rows.map(({textContent})=>textContent).join(" | ")+"; result "+q("#observation-target-result").textContent);target.click();const startButton=q("#start-data-layer-testing");await waitFor(()=>started(tabId)||!startButton.disabled,()=>"target did not become active or startable for tab "+tabId+"; status "+document.querySelector("#history-path-status")?.textContent+"; session "+JSON.stringify(session())+"; live message "+liveMessage()+"; executions "+JSON.stringify(chrome.__executions));if(!started(tabId))startButton.click();await waitFor(()=>started(tabId),()=>"start incomplete for tab "+tabId+"; generation "+chrome.__channelGeneration(tabId)+"; session "+JSON.stringify(session())+"; live message "+liveMessage()+"; executions "+JSON.stringify(chrome.__executions));return chrome.__channelGeneration(tabId);},end=async()=>{let endCalls=0;q("#end-data-layer-testing").dispatchEvent(new MouseEvent("click",{bubbles:true}));endCalls+=1;await waitFor(()=>session()?.status==="ended"&&liveMessage().startsWith("Testing ended")&&!q("#start-data-layer-testing").hidden,()=>"retail session did not end after one callback; "+JSON.stringify(session())+"; "+liveMessage());for(let tick=0;tick<5;tick+=1){await wait(10);if(session()?.status!=="ended")throw new Error("late observer callback overwrote ended session after one End callback; "+JSON.stringify(session())+"; "+liveMessage());}return{endCalls,endStayedEnded:true};},navigate=async(tabId,title)=>{const generation=chrome.__channelGeneration(tabId),url="https://shop.example/checkout/confirmation";chrome.__emitUpdated(tabId,{status:"loading",url},{id:tabId,url,title});chrome.__emitUpdated(tabId,{status:"complete"},{id:tabId,url,title});await waitFor(()=>chrome.__channelGeneration(tabId)>generation,()=>{const current=session();return"tabId "+tabId+"; previous generation "+generation+"; current generation "+chrome.__channelGeneration(tabId)+"; executions "+JSON.stringify(chrome.__executions)+"; session currentUrl "+current?.currentUrl+"; session status "+current?.status+"; live status "+document.querySelector("#live-status")?.textContent+"; live message "+liveMessage();});};await start("Retail tab",101);for(let occurrence=0;occurrence<5;occurrence+=1)await capture(101,{event:"retail_entry"});await navigate(101,"Retail confirmation");await capture(101,{event:"purchase"});const{endCalls,endStayedEnded}=await end();chrome.__setTab({id:101,windowId:1,url:"https://shop.example/checkout/confirmation",title:"Retail confirmation",active:true});await start("Retail",101);chrome.__setTab({id:202,windowId:1,url:"https://shop.example/account",title:"Trade tab",active:true});q("#choose-observation-target").dispatchEvent(new MouseEvent("click",{bubbles:true}));await wait(30);const tradeRows=Array.from(q("#observation-target-list").children),tradeRow=tradeRows.find((item)=>item.textContent.includes("Trade tab")),tradeTarget=tradeRow?.querySelector("button");if(!tradeTarget||tradeTarget.textContent!=="Select"||!tradeRow.textContent.includes("Ready"))throw new Error("Trade target was not Ready/Select before switch; "+tradeRows.map(({textContent})=>textContent).join(" | "));tradeTarget.click();q("#start-data-layer-testing").dispatchEvent(new MouseEvent("click",{bubbles:true}));await waitFor(()=>!q("#detach-observation-target-confirmation").hidden&&q("#confirm-detach-observation-target").textContent==="End and attach",()=>"normal target-switch confirmation did not open; "+q("#observation-target-result").textContent+"; "+JSON.stringify(session()));q("#confirm-detach-observation-target").click();await waitFor(()=>started(202),()=>"confirmed Trade switch did not start; generation "+chrome.__channelGeneration(202)+"; session "+JSON.stringify(session())+"; live message "+liveMessage()+"; executions "+JSON.stringify(chrome.__executions));const switchConfirmed=true;await capture(202,{event:"trade_entry"});await navigate(202,"Trade confirmation");await capture(202,{event:"purchase"});const instances=JSON.parse(localStorage.getItem("my-chrome-utilities.flow-instances.v1")),allRouting=routing(),project=JSON.parse(localStorage.getItem("my-chrome-utilities.specification-project.v1"));const finals=allRouting.filter(({eventName,pageUrl})=>eventName==="purchase"&&new URL(pageUrl).pathname==="/checkout/confirmation"),route=(sessionId)=>finals.find((entry)=>entry.sessionId===sessionId);return{instances,allRouting,routing:finals,retail:route("tab:101"),trade:route("tab:202"),flows:project.project.collections.flows.slice(0,2),events:project.project.collections.events,flowNames:Object.fromEntries(project.project.collections.flows.map(({id,name})=>[id,name.toLowerCase()])),manualMarker:finals.some(({eventName})=>eventName==="funnel_complete"),endCalls,endStayedEnded,switchConfirmed};})()`);runtimeSocket.close();
	      if(!runtimeBoundary.retail||!runtimeBoundary.trade)throw new Error(`Missing persisted decisive routes: ${JSON.stringify(runtimeBoundary)}`);assert.equal(runtimeBoundary.endCalls,1);assert.equal(runtimeBoundary.endStayedEnded,true);assert.equal(runtimeBoundary.switchConfirmed,true);assert.deepEqual(runtimeBoundary.routing.map(({pageUrl})=>new URL(pageUrl).pathname),["/checkout/confirmation","/checkout/confirmation"]);const retailInstance=runtimeBoundary.instances.find(({flowId})=>flowId===runtimeBoundary.retail.flowId);if(!retailInstance)throw new Error(`Missing Retail flow instance: ${JSON.stringify({instances:runtimeBoundary.instances,retail:runtimeBoundary.retail,allRouting:runtimeBoundary.allRouting,flows:runtimeBoundary.flows,events:runtimeBoundary.events})}`);specificationProjectObservation.corrections.flow={occurrences:retailInstance.occurrences,persisted:runtimeBoundary.instances.length===2};specificationProjectObservation.corrections.decisive={retail:{selector:runtimeBoundary.flowNames[runtimeBoundary.retail.flowId],winner:runtimeBoundary.retail.winner?.assignmentId,schemaId:runtimeBoundary.retail.winner?.schemaId},trade:{selector:runtimeBoundary.flowNames[runtimeBoundary.trade.flowId],winner:runtimeBoundary.trade.winner?.assignmentId,schemaId:runtimeBoundary.trade.winner?.schemaId},markerPresent:runtimeBoundary.manualMarker,ambiguous:runtimeBoundary.retail.ties.length!==1||runtimeBoundary.trade.ties.length!==1};
	      assert.equal(specificationProjectObservation.created.empty,true);assert.equal(specificationProjectObservation.created.workspace,true);assert.match(specificationProjectObservation.created.context,/Shop data specification.*Production.*Preview draft/);assert.match(specificationProjectObservation.created.status,/^Saved(?: · revision \d+)?$/);assert.equal(specificationProjectObservation.created.tree.length,10);
	      assert.deepEqual(specificationProjectObservation.search,{rows:["Purchase"],query:"Purchase"});assert.match(specificationProjectObservation.bulk.stagedMessage,/100 staged rows.*project unchanged/);assert.equal(specificationProjectObservation.bulk.message,"Committed 100 requirements in one revision and one Undo transaction.");assert.equal(specificationProjectObservation.bulk.undoEnabled,true);assert.equal(specificationProjectObservation.bulk.rowCount,100);assert.equal(specificationProjectObservation.afterUndo,0);assert.match(specificationProjectObservation.preflight,/Ready to publish/);assert.equal(specificationProjectObservation.release.open,true);assert.equal(specificationProjectObservation.release.confirmDisabled,false);assert.deepEqual(specificationProjectObservation.stored.collections,{profiles:1,pages:1,propertySets:0,events:1,applicabilitySets:1,flows:1,fixtures:1,schemaDrafts:0,assignments:0});assert.equal(specificationProjectObservation.stored.releases,1);assert.equal(specificationProjectObservation.stored.draft,false);assert.ok(specificationProjectObservation.layout.renderedRows<=40);
	      const corrections=specificationProjectObservation.corrections;assert.equal(corrections.documentation.preview,corrections.documentation.plain);assert.match(corrections.documentation.preview,/omitted flows.*Full-fidelity Specification Project/);assert.match(corrections.documentation.html,/omitted flows/);assert.equal(corrections.documentation.focusRestored,true);assert.equal(corrections.restoreAvailable,true);assert.deepEqual(corrections.graph,{properties:500,flows:50,flowSteps:3});assert.equal(Object.values(corrections.flow.occurrences)[0],5);assert.equal(corrections.flow.persisted,true);assert.equal(corrections.assignmentLifecycle.search.count,"1 assignment");assert.equal(corrections.assignmentLifecycle.search.empty,false);assert.equal(new Set(corrections.assignmentLifecycle.ids).size,2);assert.equal(corrections.assignmentLifecycle.stableId,true);assert.equal(corrections.assignmentLifecycle.conditionPreserved,true);assert.equal(corrections.assignmentLifecycle.pinnedRevision,3);assert.equal(corrections.assignmentLifecycle.publishedUnchanged,true);assert.equal(corrections.assignmentLifecycle.sidePanelSynced,true);assert.equal(corrections.assignmentLifecycle.legacyAfterSave,true);assert.equal(corrections.assignmentLifecycle.projectAuthoritativeAfterSave,true);assert.equal(corrections.assignmentLifecycle.blankExcluded,true);assert.match(corrections.assignmentLifecycle.blankMessage,/routing fields/);assert.deepEqual([corrections.decisive.retail.selector,corrections.decisive.trade.selector],["retail checkout","trade checkout"]);assert.notEqual(corrections.decisive.retail.winner,corrections.decisive.trade.winner);assert.notEqual(corrections.decisive.retail.schemaId,corrections.decisive.trade.schemaId);assert.equal(corrections.decisive.markerPresent,false);assert.equal(corrections.decisive.ambiguous,false);assert.deepEqual(corrections.structuredEditor.retailSteps.map(({name})=>name),["Product","Upsell","Retail confirmation"]);assert.equal(corrections.structuredEditor.retailSteps[0].maximum,5);assert.equal(corrections.structuredEditor.retailSteps[1].optional,true);assert.deepEqual(corrections.structuredEditor.tradeSteps.map(({name})=>name),["Trade account","Trade confirmation"]);assert.ok(corrections.structuredEditor.formLabels.some((label)=>label.includes("Maximum occurrences")));assert.ok(corrections.coverage.rendered<=40);assert.ok(corrections.coverage.duration<100);assert.match(corrections.coverage.deepLink,/kind=/);assert.equal(corrections.coverage.focused,true);assert.match(corrections.failed.status,/^Save failed/);assert.equal(corrections.failed.retryVisible,true);assert.equal(corrections.failed.valuePresent,true);assert.match(corrections.failed.retried,/^Saved/);assert.equal(corrections.failed.count,1);assert.equal(corrections.atomicRollback.projectBytesUnchanged,true);assert.equal(corrections.atomicRollback.schemaBytesUnchanged,true);assert.match(corrections.atomicRollback.status,/^Save failed/);assert.equal(corrections.conflictResolution.open,true);assert.match(corrections.conflictResolution.summary,/pending fields.*newer fields/);assert.deepEqual(corrections.conflictResolution.actions,["Reload current revision","Reapply pending edit","Merge selected fields"]);assert.equal(corrections.conflictResolution.externalPreserved,true);assert.equal(corrections.conflictResolution.pendingPreserved,true);assert.equal(corrections.conflictResolution.closed,true);assert.match(corrections.releaseReview.summary,/structured changes.*coverage, ambiguity, affected consumers, and breaking changes/);assert.equal(corrections.releaseReview.publishedBefore,1);assert.equal(corrections.releaseReview.focusRestored,true);assert.equal(corrections.releaseReview.legacyPreserved,true);assert.equal(corrections.releaseReview.projectAuthoritative,true);assert.equal(corrections.importReview.blocked,true);assert.match(corrections.importReview.remapped,/Collision remapped/);assert.equal(corrections.importReview.committed,true);assert.deepEqual(corrections.layouts.map(({width})=>width),[360,520,720,1280]);assert.equal(corrections.layouts.every(({pageOverflow,rendered,minTarget})=>pageOverflow===0&&rendered<=40&&minTarget>=44),true);
      const before=await evaluate(socket,`localStorage.getItem("my-chrome-utilities.specification-project.v1")`);await reloadSpecificationBuilder(socket);const after=await evaluate(socket,`localStorage.getItem("my-chrome-utilities.specification-project.v1")`);specificationProjectObservation.reloadPreserved=before===after;assert.equal(specificationProjectObservation.reloadPreserved,true);socket.close();continue;
    }
    if (activeBrowserTargetEnvironment.LOCAL_RULE_EDITING_BROWSER_ADAPTER === "1") {
      await evaluate(socket,localRuleEditingSeedRuntime);await reloadPanel(socket);localRuleEditingObservation=await evaluate(socket,localRuleEditingRuntime);
      await reloadPanel(socket);localRuleEditingObservation.saved={...localRuleEditingObservation.saved,...await evaluate(socket,localRuleEditingRenderedRuntime)};
      localRuleEditingObservation.mountedContract=await evaluate(socket,mountedCompactPendingContractRuntime);
      assert.deepEqual(localRuleEditingObservation.opened.values,["page","product"]);assert.equal(localRuleEditingObservation.opened.severity,"warning");assert.equal(localRuleEditingObservation.opened.enabled,true);assert.equal(localRuleEditingObservation.opened.reusableMetadata,false);assert.match(localRuleEditingObservation.opened.context,/Local rule origin.*\/page_type/);assert.equal(localRuleEditingObservation.opened.focused,true);
      assert.deepEqual(localRuleEditingObservation.cancelled,{storageUnchanged:true,reopened:["page","product"]});
      assert.deepEqual(localRuleEditingObservation.saved.published,["page","product"]);assert.deepEqual(localRuleEditingObservation.saved.draft,["page","product","checkout"]);assert.deepEqual(localRuleEditingObservation.saved.rendered,["page","product","checkout"]);assert.deepEqual(localRuleEditingObservation.saved.first,["page","product","checkout"]);assert.deepEqual({ruleId:localRuleEditingObservation.saved.ruleId,ruleCount:localRuleEditingObservation.saved.ruleCount,propertyPath:localRuleEditingObservation.saved.propertyPath,operator:localRuleEditingObservation.saved.operator},{ruleId:"local-41",ruleCount:1,propertyPath:"/page_type",operator:"allowed-values"});assert.equal(localRuleEditingObservation.saved.version,3);assert.deepEqual(localRuleEditingObservation.saved.pending,["Edit Known page types at /page_type"]);assert.equal(localRuleEditingObservation.saved.open,true);assert.equal(localRuleEditingObservation.previewIssues,0);
      assert.match(localRuleEditingObservation.invalid.assistance,/Correct the regular expression/);assert.equal(localRuleEditingObservation.invalid.button,true);assert.equal(localRuleEditingObservation.invalid.storageUnchanged,true);assert.deepEqual(localRuleEditingObservation.routed,{ruleLibrary:"true",reusableEditor:true,name:"Approved page names",localDialog:false,selection:{storageUnchanged:true,pending:[],busy:"false",controlsEnabled:true}});
      assert.match(localRuleEditingObservation.mountedContract.rejection,/Resolve the current durable schema save/);assert.deepEqual(localRuleEditingObservation.mountedContract.presentation,{table:true,tree:true,search:true,filter:true,sort:true,propertyNavigation:true});assert.equal(localRuleEditingObservation.mountedContract.semanticType,"string");assert.equal(localRuleEditingObservation.mountedContract.concept,"Mounted pending navigation");assert.equal(localRuleEditingObservation.mountedContract.pendingChanges.filter((change)=>change.includes("canonical property")).length,1);
      const crossEditor=localRuleEditingObservation.mountedContract.crossEditor;assert.deepEqual(crossEditor.success.blocked,{editor:crossEditor.secondaryName,busy:"true",saveBlocked:true});assert.deepEqual(crossEditor.success.after,{editor:crossEditor.secondaryName,busy:"false",saveReady:true,concept:crossEditor.success.initialBConcept,aDescription:"Cross-editor A committed"});assert.equal(crossEditor.success.bConcept,"Cross-editor B settled");assert.deepEqual(crossEditor.failure.blocked,{editor:crossEditor.secondaryName,busy:"true",saveBlocked:true});assert.equal(crossEditor.failure.failureInitialConcept,"Cross-editor B settled");assert.deepEqual({editor:crossEditor.failure.recovery.editor,busy:crossEditor.failure.recovery.busy,saveBlocked:crossEditor.failure.recovery.saveBlocked,retry:crossEditor.failure.recovery.retry,reject:crossEditor.failure.recovery.reject,concept:crossEditor.failure.recovery.concept},{editor:crossEditor.secondaryName,busy:"true",saveBlocked:true,retry:true,reject:true,concept:"Cross-editor B settled"});assert.match(crossEditor.failure.recovery.status,/cross-editor A failure/);assert.deepEqual({editor:crossEditor.failure.after.editor,busy:crossEditor.failure.after.busy,saveReady:crossEditor.failure.after.saveReady,aDescription:crossEditor.failure.after.aDescription,bConcept:crossEditor.failure.after.bConcept},{editor:crossEditor.secondaryName,busy:"false",saveReady:true,aDescription:"Cross-editor A committed",bConcept:"Cross-editor B settled"});assert.match(crossEditor.failure.after.rejectResult,/Rejected .*Saved Schema Library/);
      socket.close();continue;
    }
    if (activeBrowserTargetEnvironment.REUSABLE_RULE_SYNC_BROWSER_ADAPTER === "1") {
      await evaluate(socket,reusableRuleSyncSeedRuntime);await reloadPanel(socket);reusableRuleSyncObservation=await evaluate(socket,reusableRuleSyncRuntime);
      assert.deepEqual(reusableRuleSyncObservation.saved,{schemasUnchanged:true,version:2,values:["page","product","checkout"],action:true});
      assert.match(reusableRuleSyncObservation.review.summary,/2 schemas and 3 attachments.*Page view revision 3 to 4.*Product detail revision 5 to 6/);assert.deepEqual({disabled:reusableRuleSyncObservation.review.confirmDisabled,cancelled:reusableRuleSyncObservation.review.cancelled},{disabled:false,cancelled:true});assert.deepEqual({unchanged:reusableRuleSyncObservation.failure.unchanged,recovery:reusableRuleSyncObservation.failure.recovery,retry:reusableRuleSyncObservation.failure.retry},{unchanged:true,recovery:true,retry:true});assert.match(reusableRuleSyncObservation.failure.message,/durable Saved Schema Library is unchanged.*publication fails/);
      assert.deepEqual(reusableRuleSyncObservation.published.versions,[4,6,7]);assert.deepEqual(reusableRuleSyncObservation.published.pageRules,[["reusable-51",2],["reusable-51",2]]);assert.deepEqual(reusableRuleSyncObservation.published.productRules,[["reusable-51",2]]);assert.deepEqual(reusableRuleSyncObservation.published.historical,[[1,1],[1]]);assert.deepEqual(reusableRuleSyncObservation.published.values,["page","product","checkout"]);assert.equal(reusableRuleSyncObservation.published.workingDrafts,0);assert.equal(reusableRuleSyncObservation.published.actionRemoved,true);
      await evaluate(socket,reusableRuleSyncSeedRuntime);await evaluate(socket,`(()=>{const key="my-chrome-utilities.schema-library.v1",schemas=JSON.parse(localStorage.getItem(key)),product=schemas.find(({id})=>id==="schema-product");product.workingDraft={baseVersion:5,sourceVersion:5,document:product.document,assignments:[],attachedRules:product.attachedRules,pendingChanges:["Unrelated"]};localStorage.setItem(key,JSON.stringify(schemas));const ruleKey="my-chrome-utilities.schema-rule-library.v1",rules=JSON.parse(localStorage.getItem(ruleKey));rules[0]={...rules[0],version:2,allowedValues:["page","product","checkout"]};localStorage.setItem(ruleKey,JSON.stringify(rules));return true;})()`);await reloadPanel(socket);
      reusableRuleSyncObservation.blocked=await evaluate(socket,`(()=>{document.querySelector("#data-layer-view-schemas").click();document.querySelector("#schema-subview-rules").click();const row=document.querySelector('[data-rule-id="reusable-51"]');Array.from(row.querySelectorAll("button")).find(({textContent})=>textContent==="Sync attached schemas and publish revisions").click();return{summary:document.querySelector("#schema-rule-sync-review-summary").textContent,disabled:document.querySelector("#confirm-schema-rule-sync").disabled,draft:JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")).find(({id})=>id==="schema-product").workingDraft.pendingChanges};})()`);
      assert.match(reusableRuleSyncObservation.blocked.summary,/Publish or discard the Product detail draft first/);assert.equal(reusableRuleSyncObservation.blocked.disabled,true);assert.deepEqual(reusableRuleSyncObservation.blocked.draft,["Unrelated"]);socket.close();continue;
    }
    if (activeBrowserTargetEnvironment.REQUIRED_RULE_TYPE_INDEPENDENCE_BROWSER_ADAPTER === "1") {
      await evaluate(socket,requiredRuleTypeIndependenceSeedRuntime);await reloadPanel(socket);requiredRuleTypeIndependenceObservation=await evaluate(socket,requiredRuleTypeIndependenceRuntime);
      assert.deepEqual(requiredRuleTypeIndependenceObservation.offered.map(({path,enabled})=>({path,enabled})),["/title","/quantity","/consented","/customer","/products"].map((path)=>({path,enabled:true})));
      assert.equal(requiredRuleTypeIndependenceObservation.offered.every(({metadata})=>metadata.includes("type any")),true);
      assert.deepEqual(requiredRuleTypeIndependenceObservation.attachments,["/title","/quantity","/consented","/customer","/products"].map((propertyPath)=>({id:"reusable-required-7",version:3,propertyPath})));
      assert.equal(requiredRuleTypeIndependenceObservation.libraryCount,1);assert.equal(requiredRuleTypeIndependenceObservation.ruleUnchanged,true);
      assert.deepEqual(requiredRuleTypeIndependenceObservation.validation.missingIssues,["/title","/quantity","/consented","/customer","/products"]);assert.deepEqual(requiredRuleTypeIndependenceObservation.validation.missingStatuses,["error","error","error","error","error"]);
      assert.equal(requiredRuleTypeIndependenceObservation.validation.presentIssues,0);assert.deepEqual(requiredRuleTypeIndependenceObservation.validation.presentStatuses,["pass","pass","pass","pass","pass"]);assert.equal(requiredRuleTypeIndependenceObservation.validation.notApplicableIssues,0);assert.deepEqual(requiredRuleTypeIndependenceObservation.validation.notApplicableStatuses,["not-applicable","not-applicable","not-applicable","not-applicable","not-applicable"]);
      const beforeReload=await evaluate(socket,`[localStorage.getItem("my-chrome-utilities.schema-library.v1"),localStorage.getItem("my-chrome-utilities.schema-rule-library.v1")]`);await reloadPanel(socket);const afterReload=await evaluate(socket,`[localStorage.getItem("my-chrome-utilities.schema-library.v1"),localStorage.getItem("my-chrome-utilities.schema-rule-library.v1")]`);requiredRuleTypeIndependenceObservation.reloadPreserved=JSON.stringify(beforeReload)===JSON.stringify(afterReload);assert.equal(requiredRuleTypeIndependenceObservation.reloadPreserved,true);socket.close();continue;
    }
    if (activeBrowserTargetEnvironment.ARRAY_VALIDATION_ROLLUP_BROWSER_ADAPTER === "1") {
      arrayValidationRollupObservation=await evaluate(socket,`(async()=>{
        const verification=await import("/data-layer-schema-verification.js"),ui=await import("/data-layer-live-observer-ui.js");
        const products=Array.from({length:10},(_,index)=>({id:String(index+1),type:index===7?"service":"physical"}));
        const rule={id:"rule:product-type",name:"Allowed product type",version:1,propertyPath:"/products/*/type",operator:"allowed-values",allowedValues:["physical","digital"],severity:"error"};
        const schema={id:"schema-products",name:"Products",version:1,assignments:[],document:{type:"object",properties:{products:{type:"array",items:{type:"object",properties:{id:{type:"string"},type:{type:"string"}}}}}},attachedRules:[rule]};
        const result=verification.validateWithSchema({sourceId:"history",eventName:"products",payload:{products},rawInput:[]},schema,[schema]);
        const host=document.createElement("section");host.style.width="320px";const inspector=document.createElement("section"),back=document.createElement("button");host.append(inspector);document.body.append(host);
        const liveEvent={id:"event-products",sessionId:"session",sourceId:"history",sourceKind:"Data layer",name:"products",captureTime:"2026-07-16T20:00:00Z",pageUrl:"https://shop.example/products",destination:"dataLayer",payload:{products},rawInput:[],validation:result.state,provenance:"captured",validationDetails:{issues:result.issues,evaluations:result.evaluations,schema:result.schema}};
        const actions={copyPayload:async()=>{},saveToLibrary:()=>{},validationAvailability:()=>({enabled:true}),validate:()=>{},manualSchemaChoices:()=>[],selectManualSchema:()=>{}};
        const elements={livePanel:null,viewList:null,sessionMessage:null,sourceStatuses:null,eventFeed:null,eventList:null,eventInspector:inspector,backToEventsButton:back,pauseCaptureButton:null,resumeCaptureButton:null};
        ui.renderLiveInspector(elements,liveEvent,actions);
        const row=(path)=>inspector.querySelector('.live-validation-property[data-property-path="'+path+'"]');const product=row("/products"),every=row("/products/*"),type=row("/products/*/type");
        const affected=product.querySelector(".live-property-affected-items");const itemRows=Array.from(affected.querySelectorAll(":scope > ul > .live-validation-property"));
        const ancestorsOpen=(target)=>{let ancestor=target?.parentElement?.closest("details");while(ancestor){if(!ancestor.open)return false;ancestor=ancestor.parentElement?.closest("details");}return true;};
        const activate=(control)=>{inspector.querySelectorAll("details").forEach((detail)=>{detail.open=false;});control.click();const focused=document.activeElement;return{focusedPath:focused?.dataset?.propertyPath,ancestorsOpen:ancestorsOpen(focused),expandedPaths:Array.from(inspector.querySelectorAll("#live-validation-properties details[open][data-property-path]")).map(({dataset})=>dataset.propertyPath)};};
        const controls={"products aggregate status":activate(product.querySelector(".live-property-aggregate")),"Every item aggregate status":activate(every.querySelector(".live-property-aggregate")),"Event-level /products/7/type issue":activate(inspector.querySelector("#live-event-validation-issues button"))};
        const initial={products:product.querySelector(".live-property-aggregate").textContent,every:every.querySelector(".live-property-aggregate").textContent,type:type.querySelector(".live-property-status").textContent,affectedSummary:affected.querySelector("summary").textContent,affectedItems:itemRows.map((item)=>item.querySelector("code").textContent),concretePaths:Array.from(affected.querySelectorAll("[data-property-path]")).map((item)=>item.dataset.propertyPath),details:itemRows[0]?.textContent,symbol:type.querySelector(".live-property-status").textContent.trim()[0]};
        activate(product.querySelector(".live-property-aggregate"));inspector.scrollTop=37;
        const allowedProducts=products.map((candidate,index)=>index===7?{...candidate,type:"physical"}:candidate),allowedResult=verification.validateWithSchema({sourceId:"history",eventName:"products",payload:{products:allowedProducts},rawInput:[]},schema,[schema]);
        ui.renderLiveInspector(elements,{...liveEvent,payload:{products:allowedProducts},validation:allowedResult.state,validationDetails:{issues:allowedResult.issues,evaluations:allowedResult.evaluations,schema:allowedResult.schema}},actions);
        const revalidation={aggregates:inspector.querySelectorAll(".live-property-aggregate").length,affectedItems:inspector.querySelectorAll(".live-property-affected-items").length,type:row("/products/*/type").querySelector(".live-property-status").textContent,focusedPath:document.activeElement?.dataset?.propertyPath,expandedPaths:Array.from(inspector.querySelectorAll("#live-validation-properties details[open][data-property-path]")).map(({dataset})=>dataset.propertyPath),scrollTop:inspector.scrollTop};
        const observation={width:innerWidth,issues:result.issues.length,evaluations:result.evaluations.length,...initial,controls,focusedPath:controls["products aggregate status"].focusedPath,ancestorsOpen:controls["products aggregate status"].ancestorsOpen,revalidation,fits:host.scrollWidth<=320};host.remove();return observation;
      })()`);
      const requiredExpanded=["/products","/products/*","/products#affected","/products/7"];assert.equal(arrayValidationRollupObservation.issues,1);assert.match(arrayValidationRollupObservation.products,/1 error in 1 of 10 items/);assert.match(arrayValidationRollupObservation.every,/1 error in 1 of 10 items/);assert.match(arrayValidationRollupObservation.type,/9 passed and 1 error/);assert.deepEqual(arrayValidationRollupObservation.affectedItems,["Item 8"]);assert.ok(arrayValidationRollupObservation.concretePaths.includes("/products/7/type"));assert.match(arrayValidationRollupObservation.details,/Allowed product type.*service/);assert.equal(Object.values(arrayValidationRollupObservation.controls).every(({focusedPath,ancestorsOpen,expandedPaths})=>focusedPath==="/products/7/type"&&ancestorsOpen&&requiredExpanded.every((path)=>expandedPaths.includes(path))),true);assert.deepEqual({aggregates:arrayValidationRollupObservation.revalidation.aggregates,affectedItems:arrayValidationRollupObservation.revalidation.affectedItems,type:arrayValidationRollupObservation.revalidation.type,focusedPath:arrayValidationRollupObservation.revalidation.focusedPath},{aggregates:0,affectedItems:0,type:"✓ 10 passed",focusedPath:"/products/7/type"});assert.equal(arrayValidationRollupObservation.revalidation.expandedPaths.includes("/products/*"),true);assert.equal(arrayValidationRollupObservation.fits,true);socket.close();continue;
    }
    if (activeBrowserTargetEnvironment.JSON_SCHEMA_EXPORT_BROWSER_ADAPTER === "1") {
      await evaluate(socket, `(() => {
        localStorage.clear();
        const parent={id:"schema-generic",name:"Generic page view",version:3,published:true,assignments:[],document:{type:"object",additionalProperties:false,properties:{page_type:{type:"string"},debug:{type:"boolean"}}},attachedRules:[{id:"exact-page",name:"Exact page",version:1,propertyPath:"/page_type",operator:"exact-value",parameters:"product_detail"},{id:"forbid-debug",name:"No debug",version:1,propertyPath:"/debug",operator:"forbidden-property"}]};
        const product={id:"schema-product-detail",name:"Product detail",version:4,published:true,parentSchemaId:parent.id,assignments:[{id:"product-events",sourceId:"history",eventName:"product_detail",target:"payload",enabled:true}],document:{type:"object",properties:{currency:{type:"string"},title:{type:"string"},metadata:{type:"object",properties:{}}}},attachedRules:[{id:"forbid-local-debug",name:"No root debug",version:1,propertyPath:"/debug",operator:"forbidden-property"},{id:"allowed-currency",name:"Currencies",version:1,propertyPath:"/currency",operator:"allowed-values",allowedValues:["EUR","USD"]},{id:"title-count",name:"Title length",version:1,propertyPath:"/title",operator:"text-length",comparison:"<=",limit:50,parameters:"50"},{id:"metadata-open",name:"Allow metadata",version:1,propertyPath:"/metadata",operator:"allow-undeclared-properties"},{id:"conditional-currency",name:"Conditional currency",version:1,propertyPath:"/currency",operator:"required",conditionGroup:{operator:"All",predicates:[{propertyPath:"/page_type",operator:"Equals",comparison:{type:"string",value:"product_detail"}}]}},{id:"partner-contract",name:"Partner contract",version:1,propertyPath:"/metadata",operator:"partner-contract"}],revisionHistory:[{id:"schema-product-detail",name:"Product detail",version:3,document:{type:"object",properties:{}},assignments:[]}],workingDraft:{baseVersion:4,sourceVersion:4,document:{type:"object",properties:{pending:{type:"string"}}},assignments:[],attachedRules:[],pendingChanges:["pending"]}};
        product.document.forbidden=["debug"];
        const checkout={id:"schema-checkout",name:"Checkout",version:2,published:true,assignments:[],document:{type:"object",properties:{}}};
        const draft={id:"schema-draft",name:"Checkout draft",version:0,published:false,assignments:[],document:{type:"object"},workingDraft:{baseVersion:0,sourceVersion:0,document:{type:"object"},assignments:[],pendingChanges:[]}};
        localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([parent,product,checkout,draft]));
        localStorage.setItem("my-chrome-utilities.schema-rule-library.v1",JSON.stringify([{id:"allowed-currency",name:"Currencies",kind:"Allowed values",version:1,attachments:[product.id]},{id:"unrelated",name:"Unrelated",kind:"Required",version:1}]));
        return true;
      })()`);
      await reloadPanel(socket);
      jsonSchemaExportObservation = await evaluate(socket, `(async () => {
        const q=(selector)=>{const element=document.querySelector(selector);if(!element)throw new Error("Missing "+selector);return element;};
        const clickText=(root,text)=>{const button=Array.from(root.querySelectorAll("button")).find((candidate)=>candidate.textContent===text);if(!button)throw new Error("Missing action "+text);button.click();return button;};
        const row=(name)=>Array.from(q("#schema-list").querySelectorAll("li")).find((item)=>item.textContent.startsWith(name));
        const verification=await import("/data-layer-schema-verification.js");
        q("#data-layer-view-schemas").click();
        const storedBefore={schemas:localStorage.getItem("my-chrome-utilities.schema-library.v1"),rules:localStorage.getItem("my-chrome-utilities.schema-rule-library.v1")};
        const originalClick=HTMLAnchorElement.prototype.click,originalCreate=URL.createObjectURL;
        const downloads=[];let pendingBlob;
        URL.createObjectURL=(blob)=>{pendingBlob=blob;return originalCreate.call(URL,blob);};
        HTMLAnchorElement.prototype.click=function(){downloads.push({name:this.download,blob:pendingBlob});};
        q("#export-schema").click();
        const libraryChoices={open:q("#schema-export-choices").open,labels:Array.from(q("#schema-export-choices").querySelectorAll("button,p")).map((item)=>item.textContent),downloadCount:downloads.length};
        clickText(q("#schema-export-choices"),"JSON Schema Draft 2020-12 bundle");
        const libraryReview=q("#schema-export-compatibility-review").textContent;
        clickText(q("#schema-export-compatibility-review"),"Export without unsupported rules");
        const bundleDownload=downloads.at(-1);const bundle=JSON.parse(await bundleDownload.blob.text());
        const productRow=row("Product detail");const productExport=Array.from(productRow.querySelectorAll("button")).find((button)=>button.textContent==="Export");
        productExport.click();const productChoices=q("#schema-export-choices").textContent;clickText(q("#schema-export-choices"),"Extension schema package");
        const packageDownload=downloads.at(-1);const extensionPackage=JSON.parse(await packageDownload.blob.text());
        productExport.click();clickText(q("#schema-export-choices"),"JSON Schema Draft 2020-12");
        const productReview=q("#schema-export-compatibility-review").textContent;const lossyActions=Array.from(q("#schema-export-compatibility-review").querySelectorAll("button")).map((button)=>button.textContent);
        clickText(q("#schema-export-compatibility-review"),"Export without unsupported rules");
        const standaloneDownload=downloads.at(-1);const standalone=JSON.parse(await standaloneDownload.blob.text());
        const status=q("#schema-result").textContent;const focusReturned=document.activeElement===productExport;
        const draftRow=row("Checkout draft");const draftExport=Array.from(draftRow.querySelectorAll("button")).find((button)=>button.textContent==="Export");draftExport.click();
        const draftStandard=Array.from(q("#schema-export-choices").querySelectorAll("button")).find((button)=>button.textContent==="JSON Schema Draft 2020-12");
        const unpublished={extensionAvailable:!!Array.from(q("#schema-export-choices").querySelectorAll("button")).find((button)=>button.textContent==="Extension schema package"),standardDisabled:draftStandard.disabled,reason:draftStandard.title||q("#schema-export-choices").textContent};
        clickText(q("#schema-export-choices"),"Cancel");
        q("#export-schema").click();clickText(q("#schema-export-choices"),"Extension backup");const backupDownload=downloads.at(-1);const backup=JSON.parse(await backupDownload.blob.text());
        const standardFile=new File([JSON.stringify(standalone)],standaloneDownload.name,{type:"application/schema+json"});const input=q("#schema-library-import-file");Object.defineProperty(input,"files",{configurable:true,value:[standardFile]});input.dispatchEvent(new Event("change",{bubbles:true}));await new Promise((resolve)=>setTimeout(resolve,20));const standardImport={review:q("#schema-import-review").open,status:q("#schema-result").textContent};
        const schemas=JSON.parse(storedBefore.schemas);const product=schemas.find(({id})=>id==="schema-product-detail");
        const payloads={valid:{page_type:"product_detail",currency:"EUR",title:"x".repeat(50),metadata:{source:"feed"}},debug:{page_type:"product_detail",currency:"EUR",title:"x",metadata:{},debug:true},long:{page_type:"product_detail",currency:"EUR",title:"x".repeat(51),metadata:{}},metadata:{page_type:"product_detail",currency:"EUR",title:"x",metadata:{dynamic:true}},missing:{page_type:"product_detail",title:"x",metadata:{}}};
        const extensionOutcomes=Object.fromEntries(Object.entries(payloads).map(([key,payload])=>[key,verification.validateWithSchema({sourceId:"history",eventName:"product_detail",rawInput:[],payload},product,schemas).issues.length===0]));
        URL.createObjectURL=originalCreate;HTMLAnchorElement.prototype.click=originalClick;
        return {width:innerWidth,libraryChoices,libraryReview,bundle:{name:bundleDownload.name,document:bundle},productChoices,productReview,lossyActions,standalone:{name:standaloneDownload.name,document:standalone},extensionPackage,backup:{name:backupDownload.name,document:backup},unpublished,status,focusReturned,standardImport,extensionOutcomes,storedUnchanged:storedBefore.schemas===localStorage.getItem("my-chrome-utilities.schema-library.v1")&&storedBefore.rules===localStorage.getItem("my-chrome-utilities.schema-rule-library.v1")};
      })()`);
      const ajv=new Ajv2020({strict:false});
      assert.equal(ajv.validateSchema(jsonSchemaExportObservation.bundle.document),true,JSON.stringify(ajv.errors));
      for(const resource of Object.values(jsonSchemaExportObservation.bundle.document.$defs)){assert.equal(ajv.validateSchema(resource),true,JSON.stringify(ajv.errors));assert.equal(typeof resource.$id,"string");}
      assert.equal(ajv.validateSchema(jsonSchemaExportObservation.standalone.document),true,JSON.stringify(ajv.errors));
      const validate=ajv.compile(jsonSchemaExportObservation.standalone.document);
      const payloads={valid:{page_type:"product_detail",currency:"EUR",title:"x".repeat(50),metadata:{source:"feed"}},debug:{page_type:"product_detail",currency:"EUR",title:"x",metadata:{},debug:true},long:{page_type:"product_detail",currency:"EUR",title:"x".repeat(51),metadata:{}},metadata:{page_type:"product_detail",currency:"EUR",title:"x",metadata:{dynamic:true}},missing:{page_type:"product_detail",title:"x",metadata:{}}};
      const independent=Object.fromEntries(Object.entries(payloads).map(([key,payload])=>[key,validate(payload)]));
      assert.deepEqual(independent,jsonSchemaExportObservation.extensionOutcomes);
      assert.deepEqual(independent,{valid:true,debug:false,long:false,metadata:true,missing:false});
      assert.equal(jsonSchemaExportObservation.libraryChoices.downloadCount,0);assert.equal(jsonSchemaExportObservation.width,targetDefinition.viewport[0]);assert.equal(jsonSchemaExportObservation.storedUnchanged,true);assert.equal(jsonSchemaExportObservation.focusReturned,true);
      assert.deepEqual(jsonSchemaExportObservation.extensionPackage.schemas.map(({id})=>id),["schema-generic","schema-product-detail"]);assert.deepEqual(jsonSchemaExportObservation.extensionPackage.rules.map(({id})=>id),["allowed-currency"]);
      assert.equal(jsonSchemaExportObservation.unpublished.standardDisabled,true);assert.match(jsonSchemaExportObservation.unpublished.reason,/Publish the schema before exporting a standard revision/);
      assert.match(jsonSchemaExportObservation.status,/1 omitted rule/);assert.equal(jsonSchemaExportObservation.standardImport.review,false);
      assert.equal(JSON.stringify(jsonSchemaExportObservation.standalone.document).includes("partner-contract"),false);
      socket.close();continue;
    }
    if (activeBrowserTargetEnvironment.SCHEMA_CARDINALITY_COMPARISON_BROWSER_ADAPTER === "1" || activeBrowserTargetEnvironment.SCHEMA_DECLARED_PROPERTY_EXCEPTIONS_BROWSER_ADAPTER === "1") {
      const observations = await evaluate(socket, `(async () => {
        const picker=await import("/data-layer-schema-property-rule-picker.js");
        const verification=await import("/data-layer-schema-verification.js");
        const cardinalityCore=await import("/data-layer-cardinality.js");
        const comparisons=[">",">=","==","<","<="];
        const event=(titleLength,itemCount)=>({sourceId:"history",eventName:"payload",rawInput:[],payload:{title:"x".repeat(titleLength),items:Array.from({length:itemCount},()=>({}))}});
        const cardinalityDocument={type:"object",properties:{title:{type:"string"},items:{type:"array",items:{type:"object"}}}};
        const cardinality={properties:{},controls:{}};
        for(const [propertyName,propertySchema] of Object.entries(cardinalityDocument.properties)){const propertyPath="/"+propertyName;const ruleType=propertySchema.type==="string"?"Text length":"Item count";cardinality.properties[propertyPath]={propertyType:propertySchema.type,measuredValue:cardinalityCore.cardinalityMeasuredValue(propertySchema.type),availability:picker.ruleTypeAvailability(propertySchema.type,ruleType)};cardinality.controls[ruleType]=picker.ruleConfigurationControls(ruleType,propertySchema.type).map(({label,choices,minimum,step})=>({label,choices,minimum,step}));}
        cardinality.invalid={};for(const [name,draft] of [["no comparison",picker.createRuleConfiguration("Text length","string")],["no limit",{...picker.createRuleConfiguration("Text length","string"),comparison:"<="}],["limit -1",{...picker.createRuleConfiguration("Text length","string"),comparison:"<=",limit:"-1"}],["limit 1.5",{...picker.createRuleConfiguration("Text length","string"),comparison:"<=",limit:"1.5"}]])cardinality.invalid[name]=picker.validateRuleConfiguration(draft);
        cardinality.outcomes={};for(const ruleType of ["Text length","Item count"])for(const comparison of comparisons){const schema={id:"schema:cardinality",name:"Cardinality",version:1,assignments:[],document:cardinalityDocument,attachedRules:[{id:"cardinality",version:1,propertyPath:ruleType==="Text length"?"/title":"/items",operator:ruleType==="Text length"?"text-length":"item-count",comparison,limit:50,parameters:"50"}]};for(const cardinalityValue of [49,50,51]){const result=verification.validateWithSchema(event(ruleType==="Text length"?cardinalityValue:1,ruleType==="Item count"?cardinalityValue:1),schema,[schema]);cardinality.outcomes[ruleType+":"+comparison+":"+cardinalityValue]=result.issues.length?{outcome:"issue",expected:result.issues[0].expected,actual:result.issues[0].actual}:{outcome:"pass"};}}
        const saved={id:"schema:saved",name:"Saved",version:1,assignments:[],document:cardinalityDocument,attachedRules:[{id:"text",version:1,propertyPath:"/title",operator:"text-length",comparison:"<=",limit:50,parameters:"50"},{id:"items",version:1,propertyPath:"/items",operator:"item-count",comparison:">",limit:2,parameters:"2"}]};const reopenedCardinality=verification.importSchema(verification.exportSchema(saved));cardinality.reopened=reopenedCardinality.attachedRules.map(({operator,comparison,limit})=>({operator,comparison,limit}));cardinality.reopenedIssues=Object.fromEntries(verification.validateWithSchema(event(51,2),reopenedCardinality,[reopenedCardinality]).issues.map(({instancePath,expected,actual})=>[instancePath,{expected,actual}]));
        const legacyConfiguration={text:picker.createRuleConfigurationFromAttachedRule("Text length","string",{id:"legacy-text",version:1,parameters:"8"}),items:picker.createRuleConfigurationFromAttachedRule("Item count","array",{id:"legacy-items",version:1,parameters:"1"})};const legacyOutcomes=(operator,path,values)=>values.map((value)=>{const schema={id:"schema:legacy",name:"Legacy",version:1,assignments:[],document:cardinalityDocument,attachedRules:[{id:"legacy",version:1,propertyPath:path,operator,parameters:operator==="text-length"?"8":"1"}]};const result=verification.validateWithSchema(event(operator==="text-length"?value:1,operator==="item-count"?value:1),schema,[schema]);return result.issues.length===0;});cardinality.legacy={text:{...legacyConfiguration.text,outcomes:legacyOutcomes("text-length","/title",[7,8,9])},items:{...legacyConfiguration.items,outcomes:legacyOutcomes("item-count","/items",[0,1,2])}};

        const document={type:"object",additionalProperties:false,properties:{metadata:{type:"object",properties:{category:{type:"string"},settings:{type:"object",properties:{}}}},title:{type:"string"},items:{type:"array",items:{type:"object"}},commerce:{type:"object",properties:{}},products:{type:"array",items:{type:"object",properties:{attributes:{type:"object",properties:{}}}}}}};
        const exception=(propertyPath,enabled=true)=>({id:"exception:"+propertyPath,name:"Allow undeclared properties",version:1,propertyPath,operator:"allow-undeclared-properties",applicableType:"object",enabled});
        const schema={id:"schema:exceptions",name:"Payload",version:1,assignments:[],document,attachedRules:[exception("/metadata"),exception("/products/*/attributes")]};const payload={metadata:{source:"feed",category:42,settings:{debug:true}},commerce:{internal:true},debug:true,products:[{attributes:{color:"black"},itemDebug:true},{attributes:{material:"steel"}}]};const validation=(candidate)=>verification.validateWithSchema({sourceId:"history",eventName:"payload",payload,rawInput:[]},candidate,[candidate]);const reopened=verification.importSchema(verification.exportSchema(schema));const compatibilityPaths=["/metadata","/title","/items"];const properties=Object.fromEntries(compatibilityPaths.map((propertyPath)=>{const propertyType=document.properties[propertyPath.slice(1)].type;return[propertyPath,{propertyType,availability:picker.ruleTypeAvailability(propertyType,"Allow undeclared properties")}];}));const exceptions={properties,paths:validation(schema).issues.map(({instancePath,message})=>[instancePath,message]),reopened:{rules:reopened.attachedRules.map(({propertyPath,enabled})=>({propertyPath,enabled})),paths:validation(reopened).issues.map(({instancePath})=>instancePath)},disabledPaths:validation({...schema,attachedRules:[exception("/metadata",false),exception("/products/*/attributes")]}).issues.map(({instancePath})=>instancePath),policy:document.additionalProperties===false};
        return {cardinality,exceptions};
      })()`);
      schemaCardinalityComparisonObservation = observations.cardinality;
      schemaDeclaredPropertyExceptionsObservation = observations.exceptions;
      socket.close();
      continue;
    }
    if (activeBrowserTargetEnvironment.DEFECT_REPORT_COMPONENT_OPTIONS_BROWSER_ADAPTER === "1") {
      defectReportComponentOptionsObservation = await evaluate(socket, `(async () => {
        const ui=await import("/data-layer-defect-report-ui.js");const reports=await import("/data-layer-defect-report.js");const library=await import("/data-layer-defect-library.js");const libraryUi=await import("/data-layer-defect-library-ui.js");const copies=await import("/data-layer-defect-library-copy.js");
        const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
        const click=(root,label)=>{const value=Array.from(root.querySelectorAll("button")).find(({textContent})=>textContent===label||textContent.startsWith(label));if(!value)throw new Error("Missing "+label);value.click();return value;};
        const headings=(value)=>Array.from(value.querySelectorAll("h2"),({textContent})=>textContent);
        const sectionInputs=(root)=>Array.from(q('[aria-label="Report sections"]',root).querySelectorAll('input[type="checkbox"]'));
        const structuredData=({event,issues,actual,expected,reproductionSteps,timeline,evidence})=>JSON.stringify({event,issues,actual,expected,reproductionSteps,timeline,evidence});
        const occurrences=(text,value)=>text.split(value).length-1;
        const event={id:"purchase",name:"purchase",sourceId:"event-history",sourceName:"Event history",captureTime:"2026-07-15T12:00:00Z",pageUrl:"https://shop.example/checkout",payload:{commerce:{currency:"GBP"}},validation:"2 issues",validationDetails:{schema:{id:"schema:checkout",name:"Checkout",version:4},assignment:{target:"payload"},evaluations:[],issues:[{instancePath:"/commerce/currency",templatePath:"/commerce/currency",message:"Value is not allowed",expected:"one of EUR or USD",actual:"GBP",schemaName:"Checkout",schemaVersion:4,schemaLocation:"#/commerce/currency",rule:"Allowed currency v2",severity:"error",allowedValues:["EUR","USD"]},{instancePath:"/order_id",templatePath:"/order_id",message:"Required value",expected:"required string",actual:undefined,schemaName:"Checkout",schemaVersion:4,schemaLocation:"#/order_id",rule:"Required order v1",severity:"error"}]}};
        const root=document.createElement("section");root.id="defect-component-options-runtime";root.style.height="520px";root.style.overflow="auto";document.body.append(root);
        const rich=[],plain=[];let saved;
        const pageview={id:"pageview",name:"pageview",sourceId:"event-history",sourceName:"Event history",captureTime:"2026-07-15T11:59:00Z",pageUrl:"https://shop.example/products",payload:{page_type:"products"},validation:"Valid"};
        ui.renderDefectReportBuilder(root,event,{writeRich:async(html,text)=>rich.push({html,text}),writeText:async(text)=>plain.push(text)},[pageview,event],undefined,{save:async(report)=>{saved=structuredClone(report);return{feedback:"Saved"};},openExisting:()=>{},updateExisting:()=>{}});
        const currencyResponse=q('input[name="defect-response-currency"][value="EUR"]',root);currencyResponse.focus({preventScroll:true});root.scrollTop=43;currencyResponse.checked=true;currencyResponse.dispatchEvent(new Event("change",{bubbles:true}));const expectedResponseRefresh={focus:document.activeElement===currencyResponse,scroll:root.scrollTop};
        const preview=q('[aria-label="Final report preview"]',root);const controls=sectionInputs(root);
        const initial={states:controls.map(({checked})=>checked),headings:headings(preview),required:["Summary","Description","Steps to reproduce","Actual result","Expected result"].every((heading)=>headings(preview).includes(heading))};
        click(root,"Save defect");await new Promise((resolve)=>setTimeout(resolve,0));const structuredBefore=structuredData(saved);
        const combinations=[];for(const rulesState of [false,true])for(const captureState of [false,true]){controls[1].checked=rulesState;controls[1].dispatchEvent(new Event("change",{bubbles:true}));controls[2].checked=captureState;controls[2].dispatchEvent(new Event("change",{bubbles:true}));const generated=headings(preview);const current=reports.renderJiraReport(reports.generateReportDetails(reports.updateReportComponents(reports.createDefectReport(ui.defectCapturedEvent(event)),{validationRules:rulesState,captureMetadata:captureState})));combinations.push({rulesState,captureState,preview:generated,rich:headings(Object.assign(document.createElement("section"),{innerHTML:current.html})),plain:["Validation evidence","Validation rules covered","Capture metadata"].filter((heading)=>current.text.includes(heading))});}
        controls[1].checked=true;controls[1].dispatchEvent(new Event("change",{bubbles:true}));controls[2].checked=true;controls[2].dispatchEvent(new Event("change",{bubbles:true}));const componentText=(heading)=>Array.from(preview.querySelectorAll("h2")).find(({textContent})=>textContent===heading)?.nextElementSibling?.textContent??"";const rulesText=componentText("Validation rules covered"),captureText=componentText("Capture metadata");
        controls[0].checked=false;controls[0].dispatchEvent(new Event("change",{bubbles:true}));const withoutDifferences={headings:headings(preview),red:Boolean(preview.querySelector('[style*="#ffd7d7"]')),green:Boolean(preview.querySelector('[style*="#d9f7d9"]'))};controls[0].checked=true;controls[0].dispatchEvent(new Event("change",{bubbles:true}));const restoredDifferences=Array.from(preview.querySelectorAll('[data-difference-group]'),({textContent})=>textContent);
        controls[0].checked=false;controls[0].dispatchEvent(new Event("change",{bubbles:true}));controls[1].checked=false;controls[1].dispatchEvent(new Event("change",{bubbles:true}));controls[2].checked=true;controls[2].focus({preventScroll:true});root.scrollTop=43;controls[2].dispatchEvent(new Event("change",{bubbles:true}));const componentControlRefresh={focus:document.activeElement===controls[2],scroll:root.scrollTop};
        click(root,"Save defect");await new Promise((resolve)=>setTimeout(resolve,0));const structuredControlsUnchanged=structuredBefore===structuredData(saved);
        const order=q("#defect-issue-order_id",root);order.focus({preventScroll:true});root.scrollTop=43;order.checked=false;order.dispatchEvent(new Event("change",{bubbles:true}));order.checked=true;order.dispatchEvent(new Event("change",{bubbles:true}));const issueRefresh={focus:document.activeElement===order,scroll:root.scrollTop};
        click(root,"Generate pathname steps");const pathnameStep=q('[aria-label="Reproduction step 1"]',root);pathnameStep.focus({preventScroll:true});root.scrollTop=43;pathnameStep.value="1. Open the products page";pathnameStep.dispatchEvent(new Event("input",{bubbles:true}));const reproductionRefresh={focus:document.activeElement===pathnameStep,scroll:root.scrollTop};const add=q('button[aria-label^="Add step to "]',root);add.click();click(root,"Custom step");const custom=q('[data-reproduction-field="customText"]',root);custom.value="Confirm order summary";custom.dispatchEvent(new Event("input",{bubbles:true}));click(root,"Add step");
        click(root,"Add event to timeline");const timelineChoice=q('[data-timeline-event-id="pageview"]',root);timelineChoice.checked=true;timelineChoice.dispatchEvent(new Event("change",{bubbles:true}));const timelineSummary=q('[data-timeline-evidence="includeSummary"]',root);timelineSummary.checked=true;timelineSummary.dispatchEvent(new Event("change",{bubbles:true}));root.scrollTop=43;click(root,"Add to timeline");const timelineRefresh={focus:document.activeElement?.textContent==="Add event to timeline",scroll:root.scrollTop};
        const afterRefresh={states:controls.map(({checked})=>checked),headings:headings(preview)};
        click(root,"Copy for Jira Cloud");await new Promise((resolve)=>setTimeout(resolve,0));click(root,"Save defect");await new Promise((resolve)=>setTimeout(resolve,0));
        let defect=library.createValidationDefect({id:"defect:components",now:"2026-07-15T12:01:00Z",report:saved,issues:library.currentDefectIssues(event)});const detail=document.createElement("section");document.body.append(detail);let recopyRich=[];
        const renderLibrary=()=>libraryUi.renderDefectLibrary({count:null,list:null,empty:null,detail,confirmation:null},[defect],defect.id,undefined,{open:()=>{},close:()=>{},save:(id,report,notes)=>{defect=library.editDefect({defects:[defect]},id,{report,notes},"2026-07-15T12:02:00Z").defects[0];renderLibrary();},recopy:async()=>{await copies.copyStoredDefectForJira(defect,{writeRich:async(html,text)=>recopyRich.push({html,text})});return"Copied";},updateStatus:()=>{},attachCurrentSession:()=>{},openLinkedSession:()=>{},requestDelete:()=>{},cancelDelete:()=>{},confirmDelete:()=>{}});
        renderLibrary();const reopenedBefore=headings(q('[aria-label="Final report preview"]',detail));q('[data-defect-field="summary"]',detail).value="Edited component report";q('[data-defect-field="notes"]',detail).value="Internal note";click(detail,"Save defect edits");const reopenedAfter=headings(q('[aria-label="Final report preview"]',detail));click(detail,"Recopy for Jira Cloud");await new Promise((resolve)=>setTimeout(resolve,0));
        const legacy={...defect,id:"defect:legacy",report:{...defect.report}};delete legacy.report.components;const legacyBefore=JSON.stringify(legacy);let legacyCopy=[];libraryUi.renderDefectLibrary({count:null,list:null,empty:null,detail,confirmation:null},[legacy],legacy.id,undefined,{open:()=>{},close:()=>{},save:()=>{},recopy:async()=>{await copies.copyStoredDefectForJira(legacy,{writeRich:async(html,text)=>legacyCopy.push({html,text})});return"Copied";},updateStatus:()=>{},attachCurrentSession:()=>{},openLinkedSession:()=>{},requestDelete:()=>{},cancelDelete:()=>{},confirmDelete:()=>{}});const legacyHeadings=headings(q('[aria-label="Final report preview"]',detail));click(detail,"Recopy for Jira Cloud");await new Promise((resolve)=>setTimeout(resolve,0));
        const newRoot=document.createElement("section");ui.renderDefectReportBuilder(newRoot,event);const newDefaults=sectionInputs(newRoot).map(({checked})=>checked);
        return {initial,combinations,evidence:{rules:occurrences(rulesText,"Allowed currency v2"),schema:rulesText.includes("Checkout version 4"),severity:rulesText.includes("error"),pointer:rulesText.includes("/commerce/currency"),violation:rulesText.includes("Value is not allowed"),constraint:rulesText.includes("one of EUR or USD"),actual:rulesText.includes("GBP"),capture:["purchase","Event history","https://shop.example/checkout","2026-07-15T12:00:00Z"].every((value)=>occurrences(captureText,value)===1),noProvenance:!rulesText.includes("response source")&&!captureText.includes("response source")},withoutDifferences,restoredDifferences,structuredControlsUnchanged,refreshes:{component:componentControlRefresh,expected:expectedResponseRefresh,issue:issueRefresh,reproduction:reproductionRefresh,timeline:timelineRefresh},afterRefresh,stored:{components:defect.report.components,preview:reopenedBefore,afterEdit:reopenedAfter,rich:headings(Object.assign(document.createElement("section"),{innerHTML:rich[0].html})),recopy:headings(Object.assign(document.createElement("section"),{innerHTML:recopyRich[0].html})),structured:Boolean(defect.report.actual.differences.length&&defect.report.evidence.validation.length),notes:defect.notes},legacy:{headings:legacyHeadings,copy:headings(Object.assign(document.createElement("section"),{innerHTML:legacyCopy[0].html})),unchanged:legacyBefore===JSON.stringify(legacy),newDefaults}};
      })()`);
      assert.deepEqual(defectReportComponentOptionsObservation.initial.states,[true,false,false]);
      assert.equal(defectReportComponentOptionsObservation.combinations.length,4);
      assert.equal(defectReportComponentOptionsObservation.evidence.rules,1);
      assert.equal(defectReportComponentOptionsObservation.structuredControlsUnchanged,true);
      assert.equal(Object.values(defectReportComponentOptionsObservation.refreshes).every(({focus,scroll})=>focus&&scroll===43),true);
      assert.deepEqual(defectReportComponentOptionsObservation.afterRefresh.states,[false,false,true]);
      assert.deepEqual(defectReportComponentOptionsObservation.stored.components,{differences:false,validationRules:false,captureMetadata:true});
      assert.deepEqual(defectReportComponentOptionsObservation.legacy.newDefaults,[true,false,false]);
      socket.close();continue;
    }
    if (activeBrowserTargetEnvironment.SCHEMA_PROPERTY_FILTER_SORT_BROWSER_ADAPTER === "1") {
      await evaluate(socket, `(() => {
        localStorage.clear();
        const document={type:"object",properties:{page_type:{type:"string"},commerce:{type:"object",properties:{order:{type:"object",properties:{id:{type:"string"}}}}},products:{type:"array",items:{type:"object",properties:{product_name:{type:"string"},product_id:{type:"string"},price_monthly:{type:"number"}}}}}};
        const schema={id:"schema-page-view",name:"Page view",version:3,published:true,document,assignments:[],attachedRules:[],workingDraft:{baseVersion:3,sourceVersion:3,document,assignments:[],attachedRules:[],documentation:{description:"Owner documentation"},pendingChanges:["Document schema owner"]}};
        localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([schema]));
        localStorage.setItem("my-chrome-utilities.schema-rule-library.v1",JSON.stringify([{id:"rule:product-id",name:"Required product id",kind:"Required",version:1,operator:"required",applicableType:"string",enabled:true,attachments:[]} ]));
        return true;
      })()`);
      await reloadPanel(socket);
      schemaPropertyFilterSortObservation = await evaluate(socket, `(async () => {
        const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};
        const click=(root,label)=>{const value=Array.from(root.querySelectorAll("button")).find(({textContent})=>textContent===label||textContent.startsWith(label));if(!value)throw new Error("Missing "+label);value.click();return value;};
        const pause=(milliseconds=10)=>new Promise((resolve)=>setTimeout(resolve,milliseconds));const waitFor=async(predicate,label)=>{for(let attempt=0;attempt<400;attempt+=1){const value=predicate();if(value)return value;await pause();}throw new Error("Timed out waiting for "+label);};
        const set=(element,value,event)=>{element.value=value;element.dispatchEvent(new Event(event,{bubbles:true}));};
        const paths=()=>Array.from(q("#schema-property-tree").querySelectorAll("li[data-schema-property-canonical-path]"),({dataset})=>dataset.schemaPropertyCanonicalPath);
        const contexts=()=>Array.from(q("#schema-property-tree").querySelectorAll("li[data-schema-property-canonical-path]"))
          .filter((row)=>Array.from(row.children).find((child)=>child.classList.contains("schema-property-metadata"))?.textContent.includes("Filter context"))
          .map(({dataset})=>dataset.schemaPropertyCanonicalPath);
        const roots=()=>Array.from(q("#schema-property-tree").children,({dataset})=>dataset.schemaPropertyCanonicalPath);
        const itemChildren=()=>Array.from(q('[data-schema-property-canonical-path="/products/*"] > ul').children,({dataset})=>dataset.schemaPropertyCanonicalPath);
        q("#data-layer-view-schemas").click();const row=Array.from(q("#schema-list").children).find(({textContent})=>textContent.includes("Page view"));click(row,"Edit working draft");
        const filter=q("#schema-property-filter"),sort=q("#schema-property-sort"),tree=q("#schema-property-tree"),status=q("#schema-property-result-status");
        const initial={filter:filter.value,sort:sort.selectedOptions[0].textContent,status:status.textContent,count:paths().length,add:!q("#add-schema-property").disabled,controlsAbove:filter.getBoundingClientRect().top<tree.getBoundingClientRect().top};
        const before=localStorage.getItem("my-chrome-utilities.schema-library.v1");
        const filtered={};
        for(const query of ["product_id","products","/commerce/order","PRODUCT_NAME"]){set(filter,query,"input");filtered[query]={paths:paths(),contexts:contexts(),status:status.textContent,hiddenActions:document.querySelectorAll('#schema-property-tree [data-schema-property-canonical-path="/page_type"] button').length};}
        set(filter,"","input");const sorted={};for(const [value,label] of [["schema","Schema order"],["name-asc","Name A-Z"],["name-desc","Name Z-A"]]){set(sort,value,"change");sorted[label]={roots:roots(),items:itemChildren(),paths:paths()};}
        set(filter,"missing_property","input");const empty={status:status.textContent,message:q("#schema-property-empty p").textContent,clearReachable:!q("#schema-property-empty button").disabled};q("#schema-property-empty button").click();empty.restored=paths().length;empty.focus=document.activeElement===filter;
        set(filter,"product_","input");set(sort,"name-asc","change");tree.style.height="140px";tree.style.overflow="auto";tree.scrollTop=37;
        const storageAfterControls=localStorage.getItem("my-chrome-utilities.schema-library.v1");const trigger=q('[data-schema-property-canonical-path="/products/*/product_id"] .schema-property-add-rule');trigger.focus({preventScroll:true});trigger.click();click(q("#schema-property-rule-picker"),"Required product id version 1");const returnedFocus=document.activeElement?.getAttribute("aria-label");
        const stored=(await __waitForDurableSchemaObservation(([schema])=>schema?.workingDraft?.attachedRules?.some(({id,propertyPath})=>id==="rule:product-id"&&propertyPath==="/products/*/product_id"),"the filtered product-id rule attachment"))[0];await waitFor(()=>q("#schema-editor").getAttribute("aria-busy")!=="true","the settled filtered property presentation");
        const refreshed={filter:filter.value,sort:sort.selectedOptions[0].textContent,paths:paths(),contexts:contexts(),selected:q('[data-schema-property-canonical-path="/products/*/product_id"]').getAttribute("aria-current"),focus:returnedFocus,settledFocus:document.activeElement?.getAttribute("aria-label")??null,scroll:tree.scrollTop,documentUnchanged:JSON.stringify(stored.workingDraft.document)===JSON.stringify(JSON.parse(before)[0].workingDraft.document),pending:stored.workingDraft.pendingChanges,rules:stored.workingDraft.attachedRules.map(({id,propertyPath})=>[id,propertyPath])};
        return {initial,filtered,sorted,empty,storageUnchanged:before===storageAfterControls,refreshed,noOverflow:document.documentElement.scrollWidth<=innerWidth};
      })()`);
      assert.equal(schemaPropertyFilterSortObservation.initial.status, "9 of 9 properties");
      assert.deepEqual(schemaPropertyFilterSortObservation.filtered.product_id.contexts, ["/products", "/products/*"]);
      assert.deepEqual(schemaPropertyFilterSortObservation.sorted["Name A-Z"].roots, ["/commerce", "/page_type", "/products"]);
      assert.equal(schemaPropertyFilterSortObservation.storageUnchanged, true);
      assert.equal(schemaPropertyFilterSortObservation.refreshed.filter, "product_");
      assert.equal(schemaPropertyFilterSortObservation.refreshed.focus, "Add rule for products.*.product_id");
      assert.equal(schemaPropertyFilterSortObservation.refreshed.selected, "true");
      assert.equal(schemaPropertyFilterSortObservation.refreshed.settledFocus, "Add rule for products.*.product_id");
      assert.equal(schemaPropertyFilterSortObservation.refreshed.scroll, 37);
      assert.equal(schemaPropertyFilterSortObservation.noOverflow, true);
      socket.close(); continue;
    }
    if (activeBrowserTargetEnvironment.SCHEMA_RENAMING_BROWSER_ADAPTER === "1") {
      const seed = `(async () => {
        const assignment = { id:"assignment-page", name:"Page views", schemaId:"schema-page-view", sourceId:"history", eventName:"pageview", target:"payload", versionPolicy:"follow latest", enabled:true };
        const page = { id:"schema-page-view", name:"Page view", version:3, published:true, document:{ type:"object", properties:{ page_type:{ type:"string" } } }, assignments:[assignment], attachedRules:[{ id:"rule-page", name:"Page rule", version:1, propertyPath:"/page_type" }] };
        const {savedSchemaCanonicalDocument}=await import("/data-layer-saved-schema-canonical.js");let canonicalSequence=0;page.canonicalSchema=savedSchemaCanonicalDocument(page,(kind)=>kind+":rename-seed:"+(++canonicalSequence));
        const product = { id:"schema-product-detail", name:"Product detail", version:2, published:true, document:{ type:"object", properties:{ product_id:{ type:"string" } } }, assignments:[] };
        const child = { id:"schema-child", name:"Child page", version:1, published:true, parentSchemaId:"schema-page-view", document:{ type:"object" }, assignments:[] };
        const template = { id:"template-page", name:"Page template", eventName:"pageview", sourceId:"history", sourceName:"Event history", destination:"dataLayer", tags:[], schemaId:"schema-page-view", validation:"Valid", payload:{ page_type:"home" }, version:1, provenance:"saved" };
        localStorage.clear();
        localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([page, product, child]));
        localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", JSON.stringify([{ id:"rule-reusable", name:"Reusable", kind:"Required", version:1, enabled:true, attachments:["schema-page-view"] }]));
        localStorage.setItem("my-chrome-utilities.event-template-library.v1", JSON.stringify([template]));
        return true;
      })()`;
      await evaluate(socket, seed); await reloadPanel(socket);
      const draft = await evaluate(socket, schemaRenamingDraftRuntime); await reloadPanel(socket);
      const published = await evaluate(socket, schemaRenamingPublishRuntime);
      await evaluate(socket, seed); await reloadPanel(socket);
      const invalidAndDiscard = await evaluate(socket, schemaRenamingInvalidAndDiscardRuntime);
      await evaluate(socket, seed); await reloadPanel(socket);
      const retryReplay = await evaluate(socket, schemaRenamingRetryReplayRuntime);
      await evaluate(socket, seed); await reloadPanel(socket);
      const reject = await evaluate(socket, schemaRenamingRejectRuntime);
      schemaRenamingObservation = { draft, published, invalidAndDiscard, retryReplay, reject };
      assert.deepEqual(draft.pending, ["Rename schema from Page view to Generic page view"]);
      assert.equal(draft.canonicalName, "Generic page view");
      assert.equal(draft.publishBlockedImmediately, true);
      assert.equal(draft.publishReady, true);
      assert.equal(published.restored.name, "Generic page view");
      assert.equal(published.restored.canonicalName, "Generic page view");
      assert.match(published.review.text,/Rename schema from Page view to Generic page view/);
      assert.match(published.review.text,/policy canonical property/);
      assert.equal(published.review.unchanged,true);
      assert.equal(published.published.id, "schema-page-view");
      assert.equal(published.published.history[0].name, "Page view");
      assert.equal(invalidAndDiscard.discarded.current, "Page view");
      assert.equal(retryReplay.failure.rejectEnabled, true);
      assert.equal(retryReplay.failure.publishBlocked, true);
      assert.equal(retryReplay.replayed.name, "Retry final");
      assert.equal(retryReplay.replayed.canonicalName, "Retry final");
      assert.deepEqual(retryReplay.replayed.pending, ["Rename schema from Page view to Retry final"]);
      assert.equal(retryReplay.replayed.publishReady, true);
      assert.equal(reject.recovery.rejectEnabled, true);
      assert.equal(reject.recovery.publishBlocked, true);
      assert.equal(reject.rejected.name, "Page view");
      assert.equal(reject.rejected.draftAbsent, true);
      assert.equal(reject.rejected.visibleName, "Page view");
      assert.equal(reject.rejected.queuedNameAbsent, true);
      socket.close(); continue;
    }
    if (activeBrowserTargetEnvironment.GUIDED_NESTED_PROPERTY_MERGE_BROWSER_ADAPTER === "1") {
      await evaluate(socket, `(() => {
        const assignment = { id:"assignment:product-detail", name:"Product detail", schemaId:"schema-product-detail", sourceId:"event-history", eventName:"product_view", target:"payload", domainCondition:"127.0.0.1", pathnameCondition:"/", enabled:true };
        const schema = { id:"schema-product-detail", name:"Product detail", version:2, published:true, document:{ type:"object" }, assignments:[assignment], workingDraft:{ baseVersion:2, sourceVersion:2, document:{ type:"object" }, assignments:[assignment], attachedRules:[], pendingChanges:[] } };
        localStorage.clear();
        localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([schema]));
        localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", "[]");
        localStorage.setItem("my-chrome-utilities.guided-validation-continuations.v1", JSON.stringify({ ["event-history" + String.fromCharCode(0) + "product_view"]:"schema-product-detail" }));
        return true;
      })()`);
      const guidedNestedProject = await evaluate(socket, guidedTransportProjectSetupRuntime);
      await reloadPanel(socket);
      guidedNestedPropertyMergeObservation = await evaluate(socket, guidedNestedPropertyMergeRuntime);
      await evaluate(socket, `(() => {
        const schemas = JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"));
        const draft = schemas.find(({ id }) => id === "schema-product-detail").workingDraft;
        draft.document = { type:"object", properties:{ products:{ type:"array", minItems:1, maxItems:20, items:{ type:"object", required:["product_name"], additionalProperties:false, minProperties:1, properties:{ product_name:{ type:"string", minimum:2 } } } } } };
        draft.documentation = { description:"Product schema", properties:{ "/products/*/product_name":{ displayName:"Product name", description:"Human-readable name" } } };
        draft.attachedRules = [{ id:"local:product-name", name:"Product name pattern", version:4, propertyPath:"/products/*/product_name", operator:"regular-expression", parameters:"^Notebook$", severity:"warning", message:"Use the stored product name" }, { id:"local:unrelated", name:"Unrelated", version:2, propertyPath:"/other", operator:"required" }];
        draft.pendingChanges = ["Existing constrained product name"];
        localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify(schemas));
        return true;
      })()`);
      await reloadPanel(socket);
      guidedNestedPropertyMergeObservation.constraints = await evaluate(socket, guidedNestedConstraintRuntime);
      assert.deepEqual(guidedNestedPropertyMergeObservation.sibling.types, { name:"string", id:"number" });
      assert.deepEqual(guidedNestedPropertyMergeObservation.sibling.rulePaths, ["/products/*/product_id", "/products/*/product_name"]);
      assert.equal(guidedNestedPropertyMergeObservation.sibling.sameItem, true);
      assert.equal(guidedNestedPropertyMergeObservation.sibling.treePaths.includes("products.*.product_name"), true);
      assert.equal(guidedNestedPropertyMergeObservation.sibling.treePaths.includes("products.*.product_id"), true);
      assert.deepEqual(guidedNestedPropertyMergeObservation.persistence.properties, ["product_id", "product_name"]);
      assert.deepEqual(guidedNestedPropertyMergeObservation.persistence.rulePaths, ["/products/*/product_id", "/products/*/product_name"]);
      assert.deepEqual(guidedNestedPropertyMergeObservation.persistence.failures, [["/products/*/product_id", "/products/0/product_id"], ["/products/*/product_name", "/products/0/product_name"]]);
      assert.deepEqual(guidedNestedPropertyMergeObservation.constraints.products, { type:"array", minItems:1, maxItems:20, items:{ type:"object", required:["product_name"], additionalProperties:false, minProperties:1, properties:{ product_name:{ type:"string", minimum:2 }, product_id:{ type:"number" } } } });
      assert.deepEqual(guidedNestedPropertyMergeObservation.constraints.documentation, { description:"Product schema", properties:{ "/products/*/product_name":{ displayName:"Product name", description:"Human-readable name" } } });
      assert.deepEqual(guidedNestedPropertyMergeObservation.constraints.rules.slice(0, 2), [{ id:"local:product-name", propertyPath:"/products/*/product_name", operator:"regular-expression", parameters:"^Notebook$" }, { id:"local:unrelated", propertyPath:"/other", operator:"required" }]);
      assert.equal(guidedNestedPropertyMergeObservation.constraints.rules.filter(({ propertyPath }) => propertyPath === "/products/*/product_id").length, 1);
      await evaluate(socket, guidedTransportProjectRestoreRuntime(guidedNestedProject));
      socket.close();
      continue;
    }
    if (activeBrowserTargetEnvironment.SAVED_EVENT_FEED_FILTERS_BROWSER_ADAPTER === "1") {
      await evaluate(socket,savedEventFeedFiltersSeedRuntime);await reloadPanel(socket);
      savedEventFeedFiltersObservation=await evaluate(socket,savedEventFeedFiltersRuntime);
      await reloadPanel(socket);
      savedEventFeedFiltersObservation.reloaded=await evaluate(socket,`(() => ({identity:document.querySelector("#saved-event-feed-filter-identity")?.textContent,count:document.querySelector("#live-event-query-count")?.textContent,activeId:JSON.parse(localStorage.getItem("my-chrome-utilities.saved-event-feed-filter-working.v1"))?.activeFilterId,libraryCount:JSON.parse(localStorage.getItem("my-chrome-utilities.saved-event-feed-filters.v1"))?.filters.length}))()`);
      assert.deepEqual(savedEventFeedFiltersObservation.initial,{identity:"All events",saveAbsent:true,withinWidth:true});
      assert.equal(savedEventFeedFiltersObservation.created.identity,"Checkout issues");
      assert.equal(savedEventFeedFiltersObservation.created.count,"1 of 3 events");
      assert.deepEqual(savedEventFeedFiltersObservation.created.storageKeys,["conditions","id","match","name","valueMatch","version"]);
      assert.deepEqual(savedEventFeedFiltersObservation.created.eventKeys,[]);
      assert.deepEqual(savedEventFeedFiltersObservation.created.stored.conditions.map(({field,operator,values})=>[field,operator,values]),[["Event name","is",["purchase"]],["Validation state","is",["Issues"]]]);
      assert.equal(savedEventFeedFiltersObservation.checkoutApplied.identity,"Checkout issues");
      assert.equal(savedEventFeedFiltersObservation.checkoutApplied.count,"1 of 3 events");
      assert.equal(savedEventFeedFiltersObservation.switchOpen,true);
      assert.equal(savedEventFeedFiltersObservation.cancelled,"Checkout issues · Modified");
      assert.deepEqual(savedEventFeedFiltersObservation.switched,{identity:"Product events",count:"1 of 3 events",checkoutUnchanged:true});
      assert.deepEqual(savedEventFeedFiltersObservation.savedSwitch,{identity:"Product events",updated:true});
      assert.deepEqual(savedEventFeedFiltersObservation.reverted,{identity:"Checkout issues",conditionCount:3});
      assert.deepEqual(savedEventFeedFiltersObservation.failures.map(({operation,unchanged,feedback})=>[operation,unchanged,feedback]),[
        ["update",true,"Updating saved filter failed"],["rename",true,"Renaming saved filter failed"],["default",true,"Setting default failed"],["delete",true,"Deleting saved filter failed"],["create",true,"Saving saved filter failed"],
      ]);
      assert.equal(savedEventFeedFiltersObservation.renamed.identity,"Purchase defects");
      assert.equal(savedEventFeedFiltersObservation.renamed.sameId&&savedEventFeedFiltersObservation.renamed.originalUnchanged,true);
      assert.equal(savedEventFeedFiltersObservation.deleted.identity,"Custom · Unsaved");
      assert.equal(savedEventFeedFiltersObservation.deleted.queryRetained,4);
      assert.equal(savedEventFeedFiltersObservation.deleted.defaultRemoved&&savedEventFeedFiltersObservation.deleted.filterRemoved,true);
      assert.match(savedEventFeedFiltersObservation.duplicate,/A saved filter with this name exists/);
      assert.deepEqual(savedEventFeedFiltersObservation.isolation,{savedIdentity:"Checkout issues",savedCount:"1 of 3 events",currentIdentity:"Custom · Unsaved",currentWorkingRestored:true,globalUnchanged:true,archiveUnchanged:true});
      assert.equal(savedEventFeedFiltersObservation.fresh.identity,"Product events");
      assert.equal(savedEventFeedFiltersObservation.fresh.count,"0 of 0 events");
      assert.equal(savedEventFeedFiltersObservation.fresh.working.activeFilterId,savedEventFeedFiltersObservation.fresh.defaultId);
      assert.deepEqual(savedEventFeedFiltersObservation.reloaded,{identity:"Product events",count:"0 of 0 events",activeId:savedEventFeedFiltersObservation.fresh.defaultId,libraryCount:2});
      assert.equal(savedEventFeedFiltersObservation.selectorWidth<=savedEventFeedFiltersObservation.rootWidth,true);
      socket.close();continue;
    }
    if (activeBrowserTargetEnvironment.LIVE_GUIDED_CONDITIONAL_RULE_BROWSER_ADAPTER === "1") {
      await evaluate(socket,liveGuidedConditionalRuleSeedRuntime);await reloadPanel(socket);
      liveGuidedConditionalRuleObservation=await evaluate(socket,liveGuidedConditionalRuleRuntime);
      assert.deepEqual(liveGuidedConditionalRuleObservation.requirement,{heading:"Define requirement",applyOnlyWhen:true,schemaEditorHidden:true,pickerClosed:true});
      assert.equal(liveGuidedConditionalRuleObservation.initial.type,"Detected type: string");
      assert.equal(liveGuidedConditionalRuleObservation.initial.comparison,"product_detail");
      assert.deepEqual(liveGuidedConditionalRuleObservation.initial.operators,["Exists","Does not exist","Equals","Does not equal","Is one of","Starts with","Contains","Matches pattern"]);
      assert.equal(liveGuidedConditionalRuleObservation.initial.customerCount===1&&liveGuidedConditionalRuleObservation.initial.currentPageCount===1&&liveGuidedConditionalRuleObservation.initial.noConsequenceOption&&liveGuidedConditionalRuleObservation.initial.withinWidth,true);
      assert.deepEqual(liveGuidedConditionalRuleObservation.absent,{type:"Detected type: string",operators:["Exists","Does not exist","Equals","Does not equal","Is one of","Starts with","Contains","Matches pattern"],comparison:""});
      assert.equal(liveGuidedConditionalRuleObservation.invalidEmpty.storageUnchanged&&liveGuidedConditionalRuleObservation.invalidPattern.storageUnchanged,true);
      assert.equal(liveGuidedConditionalRuleObservation.invalidNoPredicates.storageUnchanged,true);
      assert.match(liveGuidedConditionalRuleObservation.invalidNoPredicates.assistance,/Add at least one condition/);
      assert.match(liveGuidedConditionalRuleObservation.invalidEmpty.assistance,/Enter a comparison value/);
      assert.match(liveGuidedConditionalRuleObservation.invalidPattern.assistance,/Correct the regular expression/);
      assert.deepEqual(liveGuidedConditionalRuleObservation.preview,{allResult:"Failed for the current event",allFalse:"Not applicable for the current event",anyResult:"Failed for the current event"});
      assert.equal(liveGuidedConditionalRuleObservation.confirmation.open&&liveGuidedConditionalRuleObservation.confirmation.retained&&liveGuidedConditionalRuleObservation.confirmation.discarded,true);
      assert.match(liveGuidedConditionalRuleObservation.review.text,/When page_type equals product_detail, oOrder\.aProducts\.0 must be present/);
      assert.equal(liveGuidedConditionalRuleObservation.review.storageUnchanged,true);
      assert.equal(liveGuidedConditionalRuleObservation.local.path,"/oOrder/aProducts/0");
      assert.equal(liveGuidedConditionalRuleObservation.local.failedIssues,1);
      assert.equal(liveGuidedConditionalRuleObservation.local.notApplicable,"not-applicable");
      assert.equal(liveGuidedConditionalRuleObservation.local.notApplicableIssues,0);
      assert.equal(liveGuidedConditionalRuleObservation.local.severity==="error"&&liveGuidedConditionalRuleObservation.local.message==="Validate product_detail from history"&&liveGuidedConditionalRuleObservation.local.enabled,true);
      assert.equal(liveGuidedConditionalRuleObservation.local.restoredFocus,"Add validation for /oOrder/aProducts");
      assert.deepEqual(liveGuidedConditionalRuleObservation.reusable,{libraryCount:1,attachmentCount:1,sameIdentity:true,sameRevision:true,conditionEqual:true,attachmentTotal:2});
      assert.equal(liveGuidedConditionalRuleObservation.cancelled.storageUnchanged&&liveGuidedConditionalRuleObservation.cancelled.inspectorVisible,true);
      assert.equal(liveGuidedConditionalRuleObservation.cancelled.focus,"Add validation for /oOrder/aProducts");
      assert.equal(liveGuidedConditionalRuleObservation.lifecycle.version,4);
      assert.equal(liveGuidedConditionalRuleObservation.lifecycle.workingDraftAbsent&&liveGuidedConditionalRuleObservation.lifecycle.conditionRetained,true);
      assert.equal(liveGuidedConditionalRuleObservation.lifecycle.pinnedVersion===1&&liveGuidedConditionalRuleObservation.lifecycle.revisedVersion===2&&liveGuidedConditionalRuleObservation.lifecycle.revisedConditionRetained,true);
      assert.deepEqual(liveGuidedConditionalRuleObservation.wildcard.options,["/products/*/price_monthly"]);
      assert.deepEqual(liveGuidedConditionalRuleObservation.wildcard.concreteOptions,[]);
      assert.equal(liveGuidedConditionalRuleObservation.wildcard.preview,"Failed for the current event");
      assert.match(liveGuidedConditionalRuleObservation.wildcard.review,/For each products item, when price_monthly exists, duration must be present/);
      assert.deepEqual([liveGuidedConditionalRuleObservation.wildcard.predicate,liveGuidedConditionalRuleObservation.wildcard.consequence],["/products/*/price_monthly","/products/*/duration"]);
      assert.deepEqual(liveGuidedConditionalRuleObservation.wildcard.evaluations,[["/products/0/duration","error"],["/products/1/duration","not-applicable"],["/products/2/duration","not-applicable"],["/products/3/duration","pass"]]);
      assert.deepEqual(liveGuidedConditionalRuleObservation.wildcard.issues,["/products/0/duration"]);
      assert.equal(liveGuidedConditionalRuleObservation.wildcard.reloaded,true);
      socket.close();continue;
    }
    if (activeBrowserTargetEnvironment.REQUIRED_PROPERTY_DEFECT_SCHEMA_CHOICES_BROWSER_ADAPTER === "1") {
      await evaluate(socket, `(() => { localStorage.clear(); return true; })()`);await reloadPanel(socket);
      requiredPropertyDefectSchemaChoicesObservation=await evaluate(socket,requiredPropertyDefectSchemaChoicesRuntime);
      const observed=requiredPropertyDefectSchemaChoicesObservation;
      assert.deepEqual(observed.initial.issues,["Required value"]);assert.deepEqual(observed.initial.evaluation,{status:"not-applicable",reason:"target-absent"});assert.match(observed.initial.issue,/Required value/);assert.match(observed.initial.actual,/missing/);
      assert.deepEqual(observed.initial.choices.filter(({source})=>source==="Generic pageview revision 7").map(({value,source})=>[value,source]),[["product_detail","Generic pageview revision 7"],["product_listing","Generic pageview revision 7"]]);
      assert.match(observed.selectedPreview,/product_detail/);assert.doesNotMatch(observed.deselected.preview,/product_detail/);assert.match(observed.reselected.preview,/product_detail/);assert.match(observed.changed.preview,/product_listing/);assert.equal(observed.changed.inputs,1);assert.equal(observed.deselected.focus&&observed.reselected.focus&&observed.changed.focus,true);assert.equal(observed.deselected.scroll===43&&observed.reselected.scroll===43&&observed.changed.scroll===43,true);
      assert.deepEqual(observed.saved.expected,{page_type:"product_detail"});assert.equal(observed.saved.corrections.length,1);assert.equal(observed.saved.corrections[0].operation,"add");assert.equal(observed.saved.corrections[0].responseProvenance.schema.version,7);assert.doesNotMatch(observed.clipboard.rich.text,/response source:|value-rule provenance:/);assert.doesNotMatch(observed.clipboard.plain,/response source:|value-rule provenance:/);assert.match(observed.clipboard.plain,/product_detail/);assert.match(observed.reopened,/product_detail/);assert.match(observed.recopied,/product_detail/);
      assert.deepEqual(observed.typed.map(({type,operation})=>[type,operation]),[["string","add"],["number","add"],["boolean","add"]]);assert.deepEqual(observed.typed.map(({expected})=>expected),[{page_type:"content"},{market_id:2},{logged_in:false}]);
      assert.deepEqual(observed.pointers.map(({expected})=>expected),[{commerce:{currency:"EUR"}},{products:[{name:"robot"}]},{"a/b":"enabled"},{"tilde~name":"retained"}]);
      assert.deepEqual(observed.effective.values,["product_detail"]);assert.equal(observed.effective.provenance.rules.length,2);assert.deepEqual(observed.conditional,{retail:["product_detail","product_listing"],trade:[]});assert.deepEqual(observed.conflict.values,[]);assert.match(observed.conflict.conflict,/Products.*Listings/);assert.deepEqual(observed.noRule.values,[]);assert.deepEqual(observed.rendered.effective.schema,["product_detail"]);assert.deepEqual(observed.rendered.retail.schema,["product_detail","product_listing"]);assert.deepEqual(observed.rendered.trade.schema,[]);assert.deepEqual(observed.rendered.noRule.schema,[]);assert.equal(observed.rendered.noRule.generic&&observed.rendered.noRule.custom,true);assert.deepEqual(observed.rendered.conflict.schema,[]);assert.equal(observed.rendered.conflict.custom,true);assert.match(observed.rendered.conflict.conflict,/Products.*Listings/);
      assert.equal(observed.immutable,true);assert.equal(observed.layout.body<=observed.layout.width,true);assert.equal(observed.layout.group<=observed.layout.builder,true);assert.deepEqual(observed.runtimeErrors,[]);
      socket.close();continue;
    }
    if (activeBrowserTargetEnvironment.DEFECT_REPORT_SEMANTIC_DIFFERENCES_BROWSER_ADAPTER === "1") {
      defectReportSemanticDifferencesObservation=await evaluate(socket,defectReportSemanticDifferencesRuntime);
      const observed=defectReportSemanticDifferencesObservation;
      assert.equal(observed.initial.issues.length,4);assert.equal(observed.initial.lines.filter(({group})=>group==="actual").length,4);assert.equal(observed.initial.lines.filter(({group})=>group==="expected").length,4);
      assert.deepEqual(observed.initial.lines.filter(({group})=>group==="expected").map(({operation})=>operation).sort(),["add","add","remove","remove"]);
      assert.equal(observed.initial.lines.some(({text})=>text.includes("invalid actual value")||text.includes("corrected expected value")),false);
      assert.equal(observed.deselected.lines.some(({issueId})=>issueId==="error_action"),false);assert.equal(observed.reselected.lines.filter(({issueId})=>issueId==="error_action").length,2);assert.equal(observed.deselected.focus&&observed.reselected.focus&&observed.deselected.scroll===47&&observed.reselected.scroll===47,true);
      assert.equal(observed.semantic.rich===observed.semantic.plain&&observed.semantic.plain===observed.semantic.saved&&observed.semantic.saved===observed.semantic.reopened&&observed.semantic.reopened===observed.semantic.recopied,true);
      assert.deepEqual(observed.mappings.actual,["undeclared property is present in the actual payload","required property is missing from the actual payload","actual value is not allowed","actual value has the wrong type","actual value does not equal the required value","validation failed: Value violates partner contract","validation failed"]);assert.deepEqual(observed.mappings.expected,["was added to the expected payload","was replaced in the expected payload","was removed from the expected payload",null]);
      assert.equal(observed.pointerCases.every(({pointer,text,html})=>text.includes(pointer)&&html.includes(pointer)),true);assert.match(observed.duplicate,/same-a[\s\S]*same-b/);assert.match(observed.legacy.line,/validation failed/);assert.doesNotMatch(observed.legacy.line,/undeclared|missing|not allowed|wrong type|does not equal/);
      assert.equal(observed.legacy.unchanged&&observed.immutable&&observed.layout.body<=observed.layout.width&&observed.layout.lines,true);assert.deepEqual(observed.runtimeErrors,[]);
      socket.close();continue;
    }
    if (activeBrowserTargetEnvironment.DEFECT_REPORT_PROVENANCE_PRESENTATION_BROWSER_ADAPTER === "1") {
      defectReportProvenancePresentationObservation=await evaluate(socket,defectReportProvenancePresentationRuntime);
      const observed=defectReportProvenancePresentationObservation;
      assert.equal(observed.captured.suppressed&&observed.captured.operatorPreserved&&observed.captured.expectedPayloadSame&&observed.captured.structuredRetained,true);
      assert.match(observed.captured.controls.removal,/schema declared-property policy/);assert.equal(observed.captured.controls.schema.some(({value,source})=>value==="error"&&source==="Assigned error schema revision 7"),true);assert.equal(observed.captured.controls.custom.includes("Custom value or response"),true);
      assert.deepEqual(observed.captured.corrections.map(({issueId,operation})=>[issueId,operation]),[["action","remove"],["error_action","add"],["page_type","none"],["error_message","add"]]);assert.equal(observed.captured.corrections.find(({issueId})=>issueId==="error_action").responseProvenance.schema.version,7);assert.equal(observed.captured.corrections.find(({issueId})=>issueId==="error_message").responseSource,"operator custom override");
      assert.equal(observed.captured.evidence.every(({rule,ruleVersion,severity,pointer,constraint})=>rule&&Number.isInteger(ruleVersion)&&severity&&pointer&&constraint),true,JSON.stringify(observed.captured.evidence));assert.equal(observed.captured.focusScroll.before.focus&&observed.captured.focusScroll.after.focus&&observed.captured.focusScroll.before.scroll===53&&observed.captured.focusScroll.after.scroll===53&&observed.captured.focusScroll.scroll===53,true,JSON.stringify(observed.captured.focusScroll));
      assert.equal(observed.missing.suppressed&&observed.missing.operatorPreserved&&observed.missing.reportAvailable,true);assert.deepEqual(observed.missing.payload,{error_action:"error"});assert.equal(observed.missing.sources["/error_action"],"schema-provided value");assert.equal(observed.missing.provenance["/error_action"].version,1);
      assert.equal(observed.legacy.suppressed&&observed.legacy.metadata&&observed.legacy.unchanged&&observed.legacy.assistance,true);assert.equal(observed.immutable,true);assert.equal(observed.layout.body<=observed.layout.width&&observed.layout.builder<=observed.layout.width&&observed.layout.missing<=observed.layout.width,true);assert.deepEqual(observed.runtimeErrors,[]);
      socket.close();continue;
    }
    if (activeBrowserTargetEnvironment.EVENT_OCCURRENCE_DEFECT_REPORT_BROWSER_ADAPTER === "1") {
      eventOccurrenceDefectReportObservation=await evaluate(socket,eventOccurrenceDefectReportRuntime);
      const observed=eventOccurrenceDefectReportObservation;
      assert.deepEqual(observed.initial,{validation:"Validation passed",actions:["Report unexpected event","Report wrong event name"]});
      assert.equal(observed.unexpected.stage,"captured occurrence and absence expectation");assert.equal(observed.unexpected.type,"Unexpected event");assert.deepEqual(observed.unexpected.corrections,[]);assert.match(observed.unexpected.preview,/no page_view event is fired/);
      assert.equal(observed.wrong.stage,"captured occurrence and replacement event identity");assert.equal(observed.wrong.identity,"assignment:product-view");assert.match(observed.wrong.payloadState,/product_detail/);assert.equal(observed.wrong.type,"Wrong event name");assert.match(observed.wrong.preview,/product_view/);assert.equal(observed.wrong.representationsEquivalent,true);
      assert.deepEqual(observed.common,{expected:true,steps:true,timeline:true,details:3});assert.deepEqual(observed.persisted.map(({type})=>type),["Unexpected event","Wrong event name"]);assert.equal(observed.persisted.every(({occurrenceMatch})=>Boolean(occurrenceMatch)),true);
      assert.equal(observed.clipboard.rich,1);assert.equal(observed.immutable,true);assert.equal(observed.layout.body<=observed.layout.width&&observed.layout.builder<=observed.layout.width,true);assert.deepEqual(observed.runtimeErrors,[]);
      socket.close();continue;
    }
    if (activeBrowserTargetEnvironment.SCHEMA_PROPERTY_EXAMPLE_VALUES_BROWSER_ADAPTER === "1") {
      await evaluate(socket,`(()=>{localStorage.clear();const document={type:"object",required:["products"],properties:{login_status:{type:"string"},product_name:{type:"string"},product_id:{type:"number"},consent:{type:"boolean"},category:{},plain:{type:"string"},products:{type:"array",items:{type:"object",required:["id"],properties:{id:{type:"number"}}}}}};const assignment={id:"assignment:product-detail",name:"Product detail events",schemaId:"schema:product-detail",sourceId:"event-history",eventName:"product_detail",target:"payload",versionPolicy:"follow latest",enabled:true};const rules=[{id:"allowed-login",name:"Allowed login status",version:1,propertyPath:"/login_status",operator:"allowed-values",allowedValues:["not logged in","logged in"],severity:"error"},{id:"nullable-category",name:"Nullable category",version:1,propertyPath:"/category",operator:"allowed-values",allowedValues:[null],severity:"error"}];const documentation={description:"Product event payload",properties:{"/login_status":{displayName:"Login status",description:"Customer login state",example:{value:"not logged in",selectionMethod:"allowed value"}},"/products/*/id":{displayName:"Product identifier",description:"Stable product identifier",example:{value:1,selectionMethod:"custom"}}}};const schema={id:"schema:product-detail",name:"Product detail",version:3,published:true,document,assignments:[assignment],attachedRules:rules,documentation,revisionHistory:[],workingDraft:{baseVersion:3,sourceVersion:3,document,assignments:[assignment],attachedRules:rules,documentation,pendingChanges:[]}};localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([schema]));localStorage.setItem("my-chrome-utilities.schema-rule-library.v1","[]");return true;})()`);
      await reloadPanel(socket);schemaPropertyExampleValuesObservation=await evaluate(socket,schemaPropertyExampleValuesRuntime);const observed=schemaPropertyExampleValuesObservation;
      assert.deepEqual(observed.initially.choices,["not logged in","logged in"]);assert.equal(observed.initially.custom&&observed.initially.customHidden,true);
      assert.deepEqual(observed.allowedSaved.example,{value:"logged in",selectionMethod:"allowed value"});assert.equal(observed.allowedSaved.restored&&observed.allowedSaved.currentUnchanged,true,JSON.stringify(observed.allowedSaved));
      assert.deepEqual(observed.customCases.map(({path,value,type,selectionMethod,rendered,selected})=>[path,value,type,selectionMethod,rendered,selected]),[["product_name","robot","string","custom","robot",true],["product_id",1,"number","custom","1",true],["consent",false,"boolean","custom","false",true],["category",null,"null","custom","null",true]]);
      assert.match(observed.live.information,/Example value: 1/);assert.equal(observed.live.observedUnchanged&&observed.live.payloadUnchanged,true);
      assert.deepEqual(observed.defect.initial,{hidden:true});assert.deepEqual(observed.defect.prefilled,{value:"logged in",hidden:false,focused:true,scroll:43});assert.deepEqual(observed.defect.firstCorrection,{count:1,value:"logged in",type:"string"});assert.deepEqual(observed.defect.retained,{value:"member",focused:true,selection:3,scroll:43});assert.deepEqual(observed.defect.withoutExample,{value:""});assert.equal(observed.defect.conflict.value,"guest");assert.match(observed.defect.conflict.warning,/does not satisfy|not allowed|conflict/i);assert.equal(observed.defect.conflict.confirmation,true);
      assert.deepEqual(observed.missing.prefill,{value:"1",type:"number"});assert.deepEqual(observed.missing.payload,{products:[{id:1}]});assert.deepEqual(observed.missing.saved,{products:[{id:1}]});assert.equal(observed.missing.copied&&observed.missing.reopened&&observed.missing.recopied&&observed.missing.provenanceOmitted,true);assert.deepEqual(observed.missing.invalid,{state:"1 issues",copyDisabled:true,reportUnavailable:true});
      assert.deepEqual(observed.lifecycle.inherited,{value:"not logged in",selectionMethod:"custom"});assert.deepEqual(observed.lifecycle.current,{value:"logged in",selectionMethod:"allowed value"});assert.deepEqual(observed.lifecycle.historical,{value:"not logged in",selectionMethod:"custom"});assert.equal(observed.lifecycle.legacy,null);
      assert.equal(observed.layout.body<=observed.layout.width,true);assert.deepEqual(observed.runtimeErrors,[]);
      socket.close();continue;
    }
    if (activeBrowserTargetEnvironment.SCHEMA_ASSIGNMENT_DATA_CONDITIONS_BROWSER_ADAPTER === "1") {
      await evaluate(socket,`(()=>{localStorage.clear();const legacyAssignment={id:"legacy",name:"Legacy assignment",schemaId:"schema:legacy",sourceId:"event-history",eventName:"generic_event",target:"payload",priority:20,versionPolicy:"follow latest",enabled:true};const currentAssignment={id:"current",name:"Current assignment",schemaId:"schema:current",sourceId:"event-history",eventName:"generic_event",target:"payload",priority:10,conditionTarget:"payload",dataConditionGroup:{operator:"Any",predicates:[{propertyPath:"/error_type",operator:"Exists",detectedType:"string"},{propertyPath:"/page_levels",operator:"Exists",detectedType:"array"},{propertyPath:"/site_section",operator:"Exists",detectedType:"string"}]},versionPolicy:"follow latest",enabled:true};const schemas=[{id:"schema:legacy",name:"Legacy generic event",version:4,published:true,document:{type:"object",properties:{errorType:{type:"string"},siteStructure:{type:"string"},siteArea:{type:"string"}}},assignments:[legacyAssignment]},{id:"schema:current",name:"Current generic event",version:7,published:true,document:{type:"object",properties:{error_type:{type:"string"},page_levels:{type:"array"},site_section:{type:"string"}}},assignments:[currentAssignment]}];localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify(schemas));localStorage.setItem("my-chrome-utilities.schema-rule-library.v1","[]");return true;})()`);
      await reloadPanel(socket);const serializedAssignmentConditions=await evaluate(socket,`(async()=>JSON.stringify(await (${schemaAssignmentDataConditionsRuntime})))()`);schemaAssignmentDataConditionsObservation=JSON.parse(serializedAssignmentConditions);const observed=schemaAssignmentDataConditionsObservation;
      assert.match(observed.absent.summary,/unrestricted/);assert.equal(observed.absent.saveDisabled,false);assert.deepEqual(observed.empty,{assistance:"Add at least one condition",saveDisabled:true});
      assert.equal(observed.editor.target,"payload");assert.equal(observed.editor.operator,"Any");assert.deepEqual(observed.editor.paths,["/errorType","/siteStructure","/siteArea"]);assert.equal(observed.editor.saveDisabled,false);assert.equal(observed.editor.focus,"/siteStructure");assert.equal(observed.editor.scroll,41);
      assert.deepEqual(observed.persisted.paths,["/errorType","/siteStructure","/siteArea"]);assert.equal(observed.persisted.target,"payload");assert.equal(observed.persisted.operator,"Any");assert.equal(observed.persisted.priority,20);assert.match(observed.persisted.summary,/Payload · Any/);
      assert.equal(observed.duplicate.count,2);assert.equal(observed.duplicate.equivalent&&observed.duplicate.independent,true);
      assert.equal(observed.families.every(({expected,selected})=>expected===selected),true,JSON.stringify(observed.families));assert.deepEqual([observed.priority.legacy,observed.priority.current],["Legacy generic event","Current generic event"]);assert.match(observed.priority.tie,/Legacy assignment.*Current assignment/);assert.match(observed.priority.legacyDiagnostic,/priority 20 wins/);assert.match(observed.priority.tieDiagnostic,/equal highest priority/);
      assert.deepEqual(observed.cases,[false,false,false,true,true,true]);assert.equal(observed.paths.every(({matched})=>matched),true);assert.deepEqual(observed.paths[1].observed.map(({concretePath})=>concretePath),["/products/0/type","/products/1/type"]);assert.deepEqual(observed.paths[2].observed,[{concretePath:"/products/*/type",exists:false}]);assert.equal(observed.paths[3].observed[0].concretePath,"/a~1b");assert.equal(observed.paths[4].observed[0].concretePath,"/tilde~0name");
      assert.deepEqual(observed.target,{selected:"raw",validationTarget:"payload",conditionTarget:"raw input"});assert.deepEqual(observed.persistence.restored,["/errorType","/siteStructure","/siteArea"]);assert.equal(observed.persistence.archived,"Legacy generic event");assert.equal(observed.persistence.archivedEvidence,"legacy");assert.equal(observed.persistence.immutable&&observed.persistence.activeUnchanged,true);assert.equal(observed.layout.body<=observed.layout.width&&observed.layout.editor<=observed.layout.width&&observed.layout.conditions<=observed.layout.width,true,JSON.stringify(observed.layout));assert.deepEqual(observed.runtimeErrors,[]);
      await reloadPanel(socket);const reloaded=await evaluate(socket,`(()=>{document.querySelector("#data-layer-view-schemas").click();document.querySelector("#schema-subview-assignments").click();const stored=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"));const legacy=stored.find(({id})=>id==="schema:legacy");return{count:legacy.assignments.length,paths:legacy.assignments[0].dataConditionGroup.predicates.map(({propertyPath})=>propertyPath),summary:Array.from(document.querySelector("#schema-assignment-list").children).find((row)=>row.textContent.includes("Legacy assignment"))?.textContent};})()`);schemaAssignmentDataConditionsObservation.reloaded=reloaded;assert.equal(reloaded.count,2);assert.deepEqual(reloaded.paths,["/errorType","/siteStructure","/siteArea"]);assert.match(reloaded.summary,/Payload · Any/);
      socket.close();continue;
    }
    if (activeBrowserTargetEnvironment.SCHEMA_PROPERTY_COPY_BROWSER_ADAPTER === "1") {
      await evaluate(socket,`(()=>{localStorage.clear();const message={id:"local:message",name:"Message required",version:2,propertyPath:"/error_message",operator:"required",severity:"error",message:"Message required",conditionGroup:{operator:"All",predicates:[{propertyPath:"/error_action",operator:"Exists",detectedType:"string"}]}};const action={id:"local:action",name:"Known action",version:1,propertyPath:"/error_action",operator:"allowed-values",parameters:"show,hide",allowedValues:["show","hide"],severity:"warning",conditionGroup:{operator:"All",predicates:[{propertyPath:"/error_type",operator:"Equals",comparison:{type:"string",value:"business"},detectedType:"string"}]}};const reusable={id:"reusable:error-type",name:"Error types",version:4,propertyPath:"/error_type",operator:"allowed-values",parameters:"business,technical",allowedValues:["business","technical"],severity:"error"};const source={id:"schema:pageview",name:"Generic pageview",version:7,published:true,document:{type:"object",required:["error_message"],properties:{error_message:{type:"string"},error_action:{type:"string"},error_type:{type:"string"},unrelated:{type:"boolean"}}},assignments:[],attachedRules:[message,action,reusable],documentation:{properties:{"/error_message":{displayName:"Error message",description:"Displayed error"},"/error_action":{displayName:"Error action",description:"Behavior"},"/error_type":{displayName:"Error type",description:"Category"}}}};const destination={id:"schema:in-page",name:"Generic in-page event",version:3,published:true,document:{type:"object",properties:{destination_only:{type:"boolean"}}},assignments:[{sourceId:"history",eventName:"in_page",target:"payload"}],documentation:{description:"Destination schema"}};localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([source,destination]));localStorage.setItem("my-chrome-utilities.schema-rule-library.v1",JSON.stringify([{id:reusable.id,name:reusable.name,kind:"Allowed values",version:4,attachments:[source.id]}]));return true;})()`);await reloadPanel(socket);
      schemaPropertyCopyObservation=await evaluate(socket,schemaPropertyCopyRuntime);const observed=schemaPropertyCopyObservation;
      assert.equal(observed.review.open&&observed.review.unchanged,true,JSON.stringify(observed.review));assert.match(observed.review.source,/Generic pageview revision 7/);assert.match(observed.review.text,/\/error_message/);assert.match(observed.review.text,/\/error_action.*required by \/error_message/);assert.match(observed.review.text,/\/error_type.*required by \/error_action/);assert.match(observed.review.text,/local copy/);assert.match(observed.review.text,/reusable attachment/);assert.equal(observed.review.destinations.some((label)=>label.includes("Generic pageview")),false);
      assert.equal(observed.applied.publishedUnchanged&&observed.applied.sourceUnchanged,true,JSON.stringify(observed.applied));assert.deepEqual(observed.applied.paths,["error_message","error_action","error_type"]);assert.equal(observed.applied.rules.some(({copySourceRuleId})=>copySourceRuleId==="local:message"),true);assert.equal(observed.applied.rules.filter(({id})=>id==="reusable:error-type").length,1);assert.deepEqual(observed.applied.documentation.sort(),["/error_action","/error_message","/error_type"]);assert.equal(observed.applied.assignment,"in_page");assert.match(observed.applied.pending.at(-1),/revision 7.*\/error_message/);assert.equal(observed.applied.focus,"Copy /error_message to another schema");assert.deepEqual(observed.applied.scroll,{editor:51,tree:37});
      assert.equal(observed.undo.equivalent,true);assert.match(observed.undo.feedback,/pre-copy working draft was restored/);assert.deepEqual(observed.persisted,{pending:1,path:"string"});assert.equal(observed.layout.body<=observed.layout.width&&observed.review.width<=observed.layout.width&&observed.review.scrollWidth<=observed.layout.width,true);assert.deepEqual(observed.runtimeErrors,[]);
      await reloadPanel(socket);const restored=await evaluate(socket,`(()=>{document.querySelector("#data-layer-view-schemas").click();const stored=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")).find(({id})=>id==="schema:in-page");const item=Array.from(document.querySelector("#schema-list").children).find((row)=>row.textContent.includes("Generic in-page event"));Array.from(item.querySelectorAll("button")).find(({textContent})=>textContent==="Edit working draft").click();return{path:stored.workingDraft.document.properties.error_message.type,pending:stored.workingDraft.pendingChanges.length,status:document.querySelector("#schema-editor-status").textContent,publish:document.querySelector("#save-schema").textContent};})()`);assert.equal(restored.path,"string");assert.equal(restored.pending,1);assert.match(restored.status,/1 pending change/);assert.equal(restored.publish,"Publish revision");schemaPropertyCopyObservation.reloaded=restored;
      socket.close();continue;
    }
    if (activeBrowserTargetEnvironment.DEFECT_REPORT_UNDECLARED_REMOVAL_BROWSER_ADAPTER === "1") {
      await evaluate(socket, `(async () => {
        localStorage.clear();
        const schema={id:"schema-generic-pageview",name:"Generic pageview",version:4,published:true,document:{type:"object",additionalProperties:false,properties:{page_type:{type:"string"}}},assignments:[{id:"assignment:pageview",name:"Generic pageviews",schemaId:"schema-generic-pageview",sourceId:"history",eventName:"pageview",target:"payload",versionPolicy:"follow latest",enabled:true}],attachedRules:[]};
        localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([schema]));localStorage.setItem("my-chrome-utilities.schema-rule-library.v1","[]");
        const payload={page_type:"product_detail",debug:true};const verification=await import("/data-layer-schema-verification.js");const result=verification.validateWithSchema({sourceId:"history",eventName:"pageview",payload,rawInput:["pageview",payload]},schema,[schema]);if(result.issues[0]?.message!=="Undeclared property")throw new Error("Production validation fixture failed");const observed={type:"observed",url:"https://shop.example/product",timestamp:"2026-07-15T10:00:00Z",observerPath:"dataLayer",id:"event:undeclared",name:"pageview",sessionId:"session:undeclared",sourceId:"history",sourceName:"Event history",sourceKind:"Data layer",pageUrl:"https://shop.example/product",payload,rawInput:["pageview",payload],rawValue:["pageview",payload],validation:"Not checked"};
        localStorage.setItem("dataLayerTestingSession",JSON.stringify({session:{id:"session:undeclared",status:"active",freshBoundary:true,tabId:1,historyPath:"dataLayer",startUrl:"https://shop.example/product",currentUrl:"https://shop.example/product",timeline:[observed]}}));return true;
      })()`);
      await reloadPanel(socket);defectReportUndeclaredRemovalObservation=await evaluate(socket,defectReportUndeclaredRemovalRuntime);
      assert.match(defectReportUndeclaredRemovalObservation.initial.validationText,/Undeclared property/);assert.equal(defectReportUndeclaredRemovalObservation.initial.selected,true);assert.equal(defectReportUndeclaredRemovalObservation.initial.inputCount,1);assert.doesNotMatch(defectReportUndeclaredRemovalObservation.initial.expected,/debug|null/);assert.match(defectReportUndeclaredRemovalObservation.initial.preview,/\/debug[\s\S]*was removed from the expected payload/);
      assert.match(defectReportUndeclaredRemovalObservation.deselected.expected,/debug/);assert.doesNotMatch(defectReportUndeclaredRemovalObservation.reselected.expected,/debug|null/);assert.equal(defectReportUndeclaredRemovalObservation.reselected.removals,1);
      assert.deepEqual(defectReportUndeclaredRemovalObservation.saved.expected,{page_type:"product_detail"});assert.deepEqual(defectReportUndeclaredRemovalObservation.saved.corrections.map(({pointer,operation})=>[pointer,operation]),[["/debug","remove"]]);assert.match(defectReportUndeclaredRemovalObservation.clipboard.rich.text,/\/debug[\s\S]*was removed/);assert.match(defectReportUndeclaredRemovalObservation.clipboard.plain,/\/debug[\s\S]*was removed/);assert.match(defectReportUndeclaredRemovalObservation.reopened,/page_type/);assert.match(defectReportUndeclaredRemovalObservation.recopied,/\/debug[\s\S]*was removed/);
      assert.deepEqual(defectReportUndeclaredRemovalObservation.refreshed,{issues:[],corrections:[]});assert.deepEqual(defectReportUndeclaredRemovalObservation.historicalExpected,{page_type:"product_detail"});assert.deepEqual(defectReportUndeclaredRemovalObservation.immutable,{payload:true,validation:true});assert.equal(defectReportUndeclaredRemovalObservation.layout.body<=defectReportUndeclaredRemovalObservation.layout.width,true);assert.equal(defectReportUndeclaredRemovalObservation.runtimeErrors.length,0);
      socket.close();continue;
    }
    if (activeBrowserTargetEnvironment.LIVE_SCHEMA_PROPERTY_DECLARATION_BROWSER_ADAPTER === "1") {
      await evaluate(socket,liveSchemaPropertyDeclarationSeedRuntime);await reloadPanel(socket);
      liveSchemaPropertyDeclarationObservation=await evaluate(socket,liveSchemaPropertyDeclarationRuntime);const observed=liveSchemaPropertyDeclarationObservation;
      assert.equal(observed.actions.addToSchema&&observed.actions.addValidation&&observed.actions.reachable,true);assert.match(observed.actions.destination,/Product detail/);
      for(const [key,path,type] of [["productName","/products/*/product_name","String"],["productId","/products/*/product_id","Number"]]){const review=observed.reviewCases[key];assert.match(review.text,new RegExp(path.replaceAll("*","\\*")));assert.match(review.text,new RegExp(type));assert.match(review.text,/Product detail revision 3/);assert.equal(review.noValidationControls&&review.storageUnchanged&&review.guidedHidden,true);}
      assert.deepEqual(observed.saved.productName,{type:"string"});assert.deepEqual(observed.saved.productId,{type:"number"});assert.deepEqual(observed.saved.metadata,{type:"object"});assert.deepEqual(observed.saved.parents,{arrayType:"array",minItems:1,itemType:"object"});assert.equal(observed.saved.rules.length,1);assert.equal(observed.saved.assignments.length,1);assert.equal(observed.saved.version,3);assert.equal(observed.saved.siblingPreserved&&observed.saved.collectionsPreserved,true);
      assert.deepEqual(observed.saved.nameFocus,{action:"add-property-to-schema",path:"/products/0/product_name",label:"/products/0/product_name is already declared in Product detail"});assert.deepEqual(observed.saved.idFocus,{action:"add-property-to-schema",path:"/products/0/product_id",label:"/products/0/product_id is already declared in Product detail"});
      assert.deepEqual(observed.validation,{present:{issues:[],evaluations:[]},absent:{issues:[],evaluations:[]}});assert.equal(observed.separate.guidedVisible,true);assert.equal(observed.separate.declarationDialogs,0);assert.equal(observed.published.version,4);assert.equal(observed.published.workingDraftAbsent,true);assert.deepEqual(observed.published.productName,{type:"string"});assert.deepEqual(observed.published.productId,{type:"number"});assert.equal(observed.published.rules.length,1);
      await reloadPanel(socket);const reloaded=await evaluate(socket,`(()=>{const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};const click=(root,label)=>{const button=Array.from(root.querySelectorAll("button")).find(({textContent})=>textContent===label);if(!button)throw new Error("Missing "+label);button.click();};const stored=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"))[0];q("#data-layer-view-schemas").click();const row=Array.from(q("#schema-list").children).find(({textContent})=>textContent.includes("Product detail"));click(row,"Edit working draft");let property=q('[data-schema-property-canonical-path="/products/*/product_name"]');q(":scope > strong",property).click();property=q('[data-schema-property-canonical-path="/products/*/product_name"]');return{version:stored.version,type:stored.document.properties.products.items.properties.product_name.type,activeRules:property.textContent,treeRows:q("#schema-property-tree").querySelectorAll('[data-schema-property-canonical-path="/products/*/product_name"]').length};})()`);assert.deepEqual(reloaded,{version:4,type:"string",activeRules:reloaded.activeRules,treeRows:1});assert.match(reloaded.activeRules,/0 active rules/);liveSchemaPropertyDeclarationObservation.reloaded=reloaded;socket.close();continue;
    }
    if(activeBrowserTargetEnvironment.SCHEMA_SPECIFICATION_BUILDER_CUSTOMIZATION_BROWSER_ADAPTER==="1"){
      await evaluate(socket,schemaSpecificationBuilderSeedRuntime);await evaluate(socket,`(()=>{const schemas=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1"));schemas.find(({id})=>id==="base-event").attachedRules.push({id:"parent-page-types",version:1,propertyPath:"/page_type",operator:"allowed-values",allowedValues:["product_detail","product_list"]});localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify(schemas));return true;})()`);await reloadPanel(socket);const base=await evaluate(socket,schemaSpecificationBuilderCustomizationRuntime),extended=await evaluate(socket,schemaSpecificationBuilderExtendedRuntime);schemaSpecificationBuilderCustomizationObservation={...base,extended};const observed=schemaSpecificationBuilderCustomizationObservation;assert.deepEqual(observed.defaults,{spreadsheet:true,headings:true,styleHidden:true,bars:1});assert.deepEqual(observed.moved,["Property name","Description","Type","Mandatory","Example value","Allowed values","Comments"]);assert.match(observed.choices.join(" "),/Documentation 24.*Allowed value 12.*Allowed value 24.*Custom value.*Blank/);assert.equal(observed.example,"12");assert.match(observed.spreadsheet,/^Property name\tDescription\tType\tMandatory/);assert.doesNotMatch(observed.unheaded,/^Property name/);assert.deepEqual(observed.rich.types,["text/html","text/plain"]);assert.match(observed.rich.html,/border:1px solid.*background:#eee/);assert.match(extended.provenance.conditional.join(" "),/Allowed value 12.*when price_monthly exists/);assert.match(extended.provenance.inherited.join(" "),/Allowed value otelo.*inherited/);assert.match(extended.provenance.localPropertyInheritedRule.join(" "),/Allowed value product_detail.*inherited.*Allowed value product_list.*inherited/);const duplicateChoices=extended.choiceIntegrity.duplicate.labels.filter((label)=>label.startsWith("Allowed value"));assert.equal(new Set(duplicateChoices).size,duplicateChoices.length);assert.match(duplicateChoices.join(" "),/Allowed value card.*Allowed value paypal.*Allowed value cash.*when commerce.currency equals EUR/);assert.doesNotMatch(duplicateChoices.join(" "),/bank/);assert.equal(extended.choiceIntegrity.conflict.enabledAllowed,0);assert.match(extended.choiceIntegrity.conflict.labels.join(" "),/Allowed value.*No effective allowed values exist/);assert.deepEqual(Object.fromEntries(Object.entries(extended.choiceExports).map(([key,value])=>[key,value.preview])),{documentation:"24",allowed:"12",custom:"18",blank:""});for(const value of Object.values(extended.choiceExports)){assert.match(value.spreadsheet,/products\[\]\.duration/);assert.match(value.richPlain,/products\[\]\.duration/);assert.match(value.richHtml,/<table/);}assert.doesNotMatch(extended.styles.plain,/border:1px solid/);assert.match(extended.styles.bordered,/border:1px solid.*padding:4px/);assert.match(extended.styles.highlighted,/font-weight:bold;background:#eee/);assert.doesNotMatch(extended.styles.unheaded,/<thead>/);assert.notDeepEqual(extended.drag.before,extended.drag.after);assert.deepEqual(extended.drag.boundaries,{firstLeft:true,lastRight:true});assert.deepEqual(extended.drag.reset,["Property name","Description","Mandatory","Type","Example value","Allowed values","Comments"]);assert.equal(extended.rerender.retained.value,"12");assert.deepEqual({rich:extended.rerender.retained.rich,headings:extended.rerender.retained.headings,style:extended.rerender.retained.style},{rich:true,headings:true,style:"highlighted"});assert.equal(extended.rerender.resetSource.value,"24");assert.deepEqual(extended.rerender.resetSource.columns,extended.rerender.retained.columns);assert.match(extended.failure,/Copy failed.*manual/i);assert.equal(extended.previewStillVisible&&extended.unchanged,true);assert.deepEqual([...observed.runtimeErrors,...extended.runtimeErrors],[]);assert.equal(observed.rich.styleVisible&&observed.unchanged,true);socket.close();continue;
    }
    if(activeBrowserTargetEnvironment.SCHEMA_SPECIFICATION_EXAMPLE_SELECTION_BROWSER_ADAPTER==="1"){
      await evaluate(socket,schemaSpecificationBuilderSeedRuntime);await removeExampleSelectionFixture(socket);await reloadPanel(socket);schemaSpecificationExampleSelectionObservation=await evaluate(socket,schemaSpecificationExampleSelectionRuntime);const observed=schemaSpecificationExampleSelectionObservation;assert.equal(observed.initial.selected,"Documentation 24");assert.equal(observed.initial.standalone,0);assert.match(observed.initial.labels.join(" "),/Allowed value 12.*Allowed value 24.*Custom value.*Blank/);assert.deepEqual(observed.keyboardActivation,{open:true,focused:true,handled:true});assert.equal(observed.radioKeyNotTrapped,true);assert.equal(observed.selectedValue,"12");assert.match(observed.reopened,/Allowed value 12/);assert.deepEqual(observed.cancelled,{value:"12",focus:true});assert.deepEqual(observed.pointerReopened,{open:true,selected:"allowed:12"});assert.equal(observed.unavailable.selected,"blank");assert.equal(observed.unavailable.count,1);assert.equal(observed.unavailable.focused,true);assert.match(observed.unavailable.text,/No documented example exists.*No effective allowed values exist/);assert.deepEqual(observed.escaped,{focus:true,value:""});assert.equal(observed.unchanged,true);assert.deepEqual(observed.runtimeErrors,[]);socket.close();continue;
    }
    if(activeBrowserTargetEnvironment.SCHEMA_SPECIFICATION_PREVIEW_LAYOUT_BROWSER_ADAPTER==="1"){
      await evaluate(socket,schemaSpecificationBuilderSeedRuntime);await reloadPanel(socket);schemaSpecificationPreviewLayoutObservation=await evaluate(socket,schemaSpecificationPreviewLayoutRuntime);const observed=schemaSpecificationPreviewLayoutObservation;await socket.call("Emulation.setEmulatedMedia",{features:[{name:"prefers-color-scheme",value:"light"}]});observed.light=await evaluate(socket,schemaSpecificationPreviewThemeRuntime);await socket.call("Emulation.setEmulatedMedia",{features:[{name:"prefers-color-scheme",value:"dark"}]});observed.dark=await evaluate(socket,schemaSpecificationPreviewThemeRuntime);await socket.call("Emulation.setEmulatedMedia",{features:[{name:"prefers-contrast",value:"more"}]});observed.contrast=await evaluate(socket,schemaSpecificationPreviewThemeRuntime);await socket.call("Emulation.setEmulatedMedia",{features:[]});assert.deepEqual([observed.geometry.regions,observed.geometry.name,observed.geometry.role],[1,"Specification preview","region"]);assert.ok(observed.geometry.regionClient<=observed.geometry.builderClient);assert.ok(observed.geometry.regionScroll>observed.geometry.regionClient);assert.ok(observed.geometry.table>observed.geometry.regionClient);assert.ok(observed.geometry.builderScroll<=observed.geometry.builderClient+1);assert.ok(observed.geometry.panelScroll<=observed.geometry.panelClient+1);assert.equal(observed.geometry.contained,true);assert.notEqual(observed.styles.headingBackground,observed.styles.cellBackground);assert.notEqual(observed.styles.border,"0px");assert.notEqual(observed.styles.padding,"0px");assert.equal(observed.styles.alternating,true);assert.equal(observed.styles.wrap,"normal");assert.equal(observed.styles.vertical,"top");assert.notEqual(observed.styles.focusShadow,"none");assert.ok(observed.scrolled.left>0);assert.equal(observed.scrolled.builder,0);assert.equal(observed.scrolled.panel,0);assert.equal(observed.scrolled.laterVisible,true);assert.ok(observed.retention.afterSort>0&&observed.retention.afterExport>0);assert.equal(observed.focused.inside&&observed.focused.visible,true);assert.equal(observed.light.colorScheme,"dark");assert.equal(observed.dark.colorScheme,"dark");assert.equal(observed.light.heading,observed.dark.heading);assert.notEqual(observed.light.text,observed.light.heading);assert.notEqual(observed.dark.text,observed.dark.heading);assert.notEqual(observed.contrast.border,"rgba(0, 0, 0, 0)");assert.deepEqual(observed.runtimeErrors,[]);socket.close();continue;
    }
    if (activeBrowserTargetEnvironment.SCHEMA_PROPERTY_TYPE_EDITING_BROWSER_ADAPTER === "1") {
      await evaluate(socket,schemaPropertyTypeEditingSeedRuntime);await reloadPanel(socket);schemaPropertyTypeEditingObservation=await evaluate(socket,schemaPropertyTypeEditingRuntime);const observed=schemaPropertyTypeEditingObservation;
      assert.deepEqual(observed.controls,{valueTypes:["String","Number","Boolean","Object","Array"],treatments:["Error","Warning","Ignore"],defaultTreatment:"Error",itemHidden:true});assert.deepEqual(observed.arrayControls,{itemTypes:["Any item type","String","Number","Boolean","Object"],initial:"String"});assert.match(observed.review,/Number changing to String/);assert.match(observed.review,/type mismatch treatment/);assert.match(observed.review,/example value.*rule range.*conditional dependency order-condition/);assert.equal(observed.impactChoices.count,3);assert.deepEqual(observed.impactChoices.options["example value"],["Choose resolution","Remove artifact","Replace artifact"]);assert.deepEqual(observed.impactChoices.options["rule range"],["Choose resolution","Remove artifact"]);assert.deepEqual(observed.impactChoices.options["conditional dependency order-condition"],["Choose resolution","Remove artifact","Replace artifact"]);assert.deepEqual({cancel:observed.impactChoices.cancel,blocked:observed.impactChoices.blocked,resolved:observed.impactChoices.resolved},{cancel:true,blocked:true,resolved:true});assert.match(observed.descendantImpact.review,/descendant definitions.*descendant required relationships.*descendant documentation.*descendant rules/);assert.deepEqual({blocked:observed.descendantImpact.blocked,unchanged:observed.descendantImpact.unchanged,focus:observed.descendantImpact.focus},{blocked:true,unchanged:true,focus:true});assert.match(observed.persistenceFailure.message,/Simulated persistence failure/);assert.deepEqual({storedUnchanged:observed.persistenceFailure.storedUnchanged,inMemoryType:observed.persistenceFailure.inMemoryType,resolutions:observed.persistenceFailure.resolutions},{storedUnchanged:true,inMemoryType:"Number",resolutions:["replace","remove","replace"]});assert.equal(observed.unchangedBeforeConfirm,true);assert.deepEqual(observed.orderSaved,{published:"number",draft:"string",required:["order_id"],description:"Order identifier",example:"ORDER-42",condition:{type:"string",value:"ORDER-42"}});assert.equal(observed.tagsItems,null);assert.deepEqual(observed.warning,[["/price","warning"]]);assert.equal(observed.ignored,false);assert.equal(observed.persistedTreatment,"ignore");assert.deepEqual(observed.remainingRules,["product-name-required","price-required","order-condition"]);assert.equal(observed.reusableUnchanged,true);assert.deepEqual(observed.publication,{version:4,draftAbsent:true,current:{order:"string",tags:{type:"array",typeMismatchTreatment:"error"},priceTreatment:"ignore"},historical:{order:"number",tags:{type:"array",items:{type:"string"}},priceTreatment:"error"}});assert.deepEqual(observed.runtimeErrors,[]);
      await reloadPanel(socket);const reloaded=await evaluate(socket,`(async()=>{const pause=(milliseconds=0)=>new Promise((resolve)=>setTimeout(resolve,milliseconds)),waitFor=async(predicate,label)=>{for(let attempt=0;attempt<400;attempt+=1){const value=predicate();if(value)return value;await pause(10);}throw new Error("Timed out waiting for "+label);};const q=(selector,root=document)=>{const value=root.querySelector(selector);if(!value)throw new Error("Missing "+selector);return value;};q("#data-layer-view-schemas").click();const row=await waitFor(()=>Array.from(q("#schema-list").children).find(({textContent})=>textContent.includes("Page view")),"the Page view schema row");const build=await waitFor(()=>Array.from(row.querySelectorAll("button")).find(({textContent})=>textContent==="Build documentation table"),"the Page view specification action");build.click();const spec=await waitFor(()=>Array.from(q("#schema-specification-preview").querySelectorAll("tbody tr")).map((tr)=>Array.from(tr.children).map(({textContent})=>textContent)).find(([name])=>name==="order_id"),"the order_id specification row");const stored=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")).find(({id})=>id==="schema-page-view");if(!stored)throw new Error("Missing schema-page-view after durable reload");return{version:stored.version,draftAbsent:!stored.workingDraft,order:stored.document.properties.order_id.type,priceTreatment:stored.document.properties.price.typeMismatchTreatment,spec};})()`);assert.deepEqual({version:reloaded.version,draftAbsent:reloaded.draftAbsent,order:reloaded.order,priceTreatment:reloaded.priceTreatment,specType:reloaded.spec[3]},{version:4,draftAbsent:true,order:"string",priceTreatment:"ignore",specType:"String"});schemaPropertyTypeEditingObservation.reloaded=reloaded;await evaluate(socket,schemaPropertyTypeEditingSeedRuntime);await reloadPanel(socket);const itemTreatment=await evaluate(socket,schemaPropertyTypeEditingItemRuntime);assert.deepEqual(itemTreatment.inherited,{label:"Type owned by Base event",owner:"Base event",unchanged:true});assert.deepEqual(itemTreatment.warningItems,[["/tags/1","warning"]]);assert.deepEqual(itemTreatment.warningArray,[["/tags","warning"]]);assert.deepEqual(itemTreatment.unrelated,[["/price","error"]]);assert.equal(itemTreatment.ignoredItems||itemTreatment.ignoredArray,false);assert.deepEqual(itemTreatment.runtimeErrors,[]);schemaPropertyTypeEditingObservation.itemTreatment=itemTreatment;
      socket.close();continue;
    }
    if (activeBrowserTargetEnvironment.SCHEMA_SPECIFICATION_BUILDER_BROWSER_ADAPTER === "1") {
      await evaluate(socket,schemaSpecificationBuilderSeedRuntime);await reloadPanel(socket);
      schemaSpecificationBuilderObservation=await evaluate(socket,schemaSpecificationBuilderRuntime);const observed=schemaSpecificationBuilderObservation;
      assert.deepEqual(Object.fromEntries(Object.entries(observed.entryPoints).map(([key,value])=>[key,{visible:value.visible,source:value.source,focus:value.focus}])),{library:{visible:true,source:"published revision 4",focus:true},editor:{visible:true,source:"working draft based on revision 4",focus:true},historical:{visible:true,source:"historical revision 2",focus:true}});assert.equal(observed.entryPoints.library.paths.includes("/draft_only"),false);assert.equal(observed.entryPoints.editor.paths.includes("/draft_only"),true);assert.equal(observed.entryPoints.historical.paths.includes("/legacy"),true);
      assert.equal(observed.source,"published revision 4");assert.deepEqual(observed.headings,["Property name","Description","Mandatory","Type","Example value","Allowed values","Comments"]);assert.deepEqual(observed.defaults,{leaves:[true,true,true],containers:[true,true]});assert.deepEqual(observed.hierarchy,{durationParent:"/products",site:" site_id · inherited",legacyAbsent:true});assert.deepEqual(observed.filtered,["/products","/products/*/duration"]);
      assert.deepEqual(observed.selection.containerOnly,["/products"]);assert.deepEqual(observed.selection.withDescendant,["/products","/products/*/duration"]);assert.deepEqual(observed.selection.descendantOnly,["/products/*/duration"]);assert.equal(observed.selection.schemaOrder.length>=12,true);assert.deepEqual(observed.selection.nameOrder,[...observed.selection.nameOrder].sort());
      assert.deepEqual(observed.cases.pageType,["page_type","Page classification","Yes","String","product_detail","product_detail | product_list","Used for page routing"]);assert.deepEqual(observed.cases.currency,["commerce.currency","Transaction currency","Yes when commerce exists","String","EUR","EUR | GBP","ISO 4217 code"]);assert.deepEqual(observed.cases.products,["products","Products in the event","No","Array of Object","","","One row per product"]);assert.deepEqual(observed.cases.productName,["products[].product_name","Displayed product name","Yes when a products item exists","String","Phone","","Customer-facing label"]);assert.deepEqual(observed.cases.duration,["products[].duration","Contract duration in months","Yes when price_monthly exists for the same products item","Number","24","12 | 24 when price_monthly exists for the same products item","Whole months"]);assert.deepEqual(observed.cases.site,["site_id","Site identifier","Yes","String","otelo","otelo | hollandsnieuwe | ben","Shared across events"]);assert.deepEqual(observed.cases.tracking,["tracking_context","Tracking integration context","No","Unspecified","","",""]);assert.deepEqual(observed.cases.payment,["payment_method","Payment method","No","String","card","card | paypalcash when commerce.currency equals EUR",""]);assert.match(observed.cases.conflict.at(-2),/Conflict: no values satisfy all effective rules/);assert.match(observed.completeness,/2 selected properties · 0 missing descriptions · 1 missing examples/);
      assert.deepEqual(observed.clipboard.types,["text/html","text/plain"]);assert.match(observed.clipboard.html,/<table>[\s\S]*<th>Property name<\/th>/);assert.match(observed.clipboard.html,/card \| paypal<br>cash when commerce\.currency equals EUR/);assert.match(observed.clipboard.html,/Unsafe &lt;tag &amp; &quot;quote&quot;&gt;/);assert.equal(observed.clipboard.plain.split("\n").every((line)=>line.split("\t").length===7),true);assert.match(observed.clipboard.feedback,/Copied rich table and plain text/);assert.equal(observed.fallback.plain,observed.clipboard.plain);assert.match(observed.fallback.feedback,/copied plain text/);assert.equal(observed.selectionUnchanged&&observed.unchanged,true);assert.deepEqual(observed.runtimeErrors,[]);
      socket.close();continue;
    }
    if (activeBrowserTargetEnvironment.ALLOWED_VALUES_RULE_MIGRATION_BROWSER_ADAPTER === "1") {
      await evaluate(socket,`(()=>{localStorage.clear();const document={type:"object",properties:{error_type:{type:"string"},quantity:{type:"number"},enabled:{type:"boolean"}}};const identity={id:"rule:error-type",name:"Allowed values for error_type",version:1,propertyPath:"/error_type",operator:"allowed-values",parameters:"technical,validation,authentication,login,notification",severity:"warning",message:"Choose a known error type",enabled:true,conditionGroup:{operator:"All",predicates:[{propertyPath:"/market",operator:"Equals",comparison:{type:"string",value:"retail"}}]}};const schema={id:"schema-generic-pageview",name:"Generic pageview",version:4,published:true,document,assignments:[],attachedRules:[identity],revisionHistory:[{id:"schema-generic-pageview",name:"Generic pageview",version:2,document,assignments:[],attachedRules:[{id:"rule:history",version:1,propertyPath:"/quantity",operator:"allowed-values",parameters:"1,2"}]}],workingDraft:{baseVersion:4,sourceVersion:4,document,assignments:[],attachedRules:[{id:"rule:draft",version:1,propertyPath:"/enabled",operator:"allowed-values",parameters:"true,false"}],pendingChanges:["Existing edit"]}};localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([schema]));localStorage.setItem("my-chrome-utilities.schema-rule-library.v1",JSON.stringify([{id:"rule:reusable",name:"Reusable quantities",kind:"Allowed values",version:3,operator:"allowed-values",parameters:"1,2",applicableType:"number",enabled:true}]));return true;})()`);await reloadPanel(socket);
      const first=await evaluate(socket,`(async()=>{const verification=await import("/data-layer-schema-verification.js"),rawSchemas=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")),schemas=verification.restoreSchemaLibrary(JSON.stringify(rawSchemas)),schema=schemas[0],reusable=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1"))[0];document.querySelector("#data-layer-view-schemas").click();const row=Array.from(document.querySelector("#schema-list").children).find(({textContent})=>textContent.includes("Generic pageview"));Array.from(row.querySelectorAll("button")).find(({textContent})=>textContent==="Build documentation table").click();const spec=Array.from(document.querySelectorAll('#schema-specification-preview tbody tr')).find((item)=>item.dataset.propertyPath==="/error_type");return{stored:schemas,rawStored:rawSchemas,current:schema.attachedRules[0],historical:schema.revisionHistory[0].attachedRules[0],draft:schema.workingDraft.attachedRules[0],reusable,allowedCell:Array.from(spec.children).map(({textContent})=>textContent)[5],runtimeErrors:globalThis.__sidePanelRuntimeErrors??[]};})()`);
      assert.deepEqual(first.current.allowedValues,["technical","validation","authentication","login","notification"]);assert.equal(first.current.parameters,undefined);assert.deepEqual(first.historical.allowedValues,[1,2]);assert.deepEqual(first.draft.allowedValues,[true,false]);assert.deepEqual(first.reusable.allowedValues,[1,2]);assert.match(first.allowedCell,/technical \| validation \| authentication \| login \| notification/);assert.deepEqual(first.runtimeErrors,[]);const coverage=await evaluate(socket,allowedValuesRuleMigrationCoverageRuntime);assert.deepEqual(coverage.validation.valid,0);assert.equal(coverage.validation.invalid.length>0,true);assert.deepEqual(coverage.authoring.picker.allowedValues,[1,2]);assert.deepEqual(coverage.authoring.guided.allowedValues,[true,false]);assert.deepEqual(coverage.authoring.authored.allowedValues,["red","blue"]);assert.deepEqual(coverage.propertyPicker.count,1);assert.match(coverage.propertyPicker.text,/Reusable quantities version 3.*Allowed values: 1, 2/);assert.deepEqual(coverage.ruleLibrary.authoredSearch.count,1);assert.match(coverage.ruleLibrary.authoredSearch.text,/Authored colors.*Allowed values: red, blue/);assert.deepEqual(coverage.ruleLibrary.migratedSearch.count,1);assert.match(coverage.ruleLibrary.migratedSearch.text,/Reusable quantities.*Allowed values: 1, 2/);assert.deepEqual(coverage.inheritance.values,["parent","child"]);assert.equal(coverage.inheritance.invalid.length>0,true);
      assert.deepEqual(coverage.semantics.rules.map(({id,propertyPath,allowedValues,enabled})=>[id,propertyPath,allowedValues,enabled]),[["rule:wildcard","/products/*/code",["red","blue","red"],true],["rule:duplicate","/products/*/code",["red","blue"],undefined],["rule:disabled","/products/*/code",["green"],false],["rule:conditional","/products/*/code",["gold","gold"],undefined]]);assert.deepEqual(coverage.semantics.metadata,{condition:{operator:"All",predicates:[{propertyPath:"/products/*/tier",operator:"Equals",comparison:{type:"string",value:"vip"}}]},examples:"red, blue",attachments:["schema-wildcard-parent"],message:"Known code",severity:"warning"});assert.deepEqual(coverage.semantics.override,{"/products/*/code":"disabled"});assert.deepEqual(coverage.semantics.row.values,["red","blue","gold"]);assert.deepEqual(coverage.semantics.row.groups,["red | blue","gold when tier equals vip for the same products item"]);assert.deepEqual(coverage.semantics.examples,["documentation","allowed:red","allowed:blue","allowed:gold","custom","blank"]);assert.equal(new Set(coverage.semantics.row.choices.map(({value})=>value)).size,3);assert.match(coverage.semantics.copies.plain,/red \| blue; gold when tier equals vip/);assert.match(coverage.semantics.copies.html,/red \| blue<br>gold when tier equals vip/);assert.deepEqual(coverage.semantics.inheritedIssues,[{instancePath:"/products/0/code",templatePath:"/products/*/code"},{instancePath:"/products/0/code",templatePath:"/products/*/code"}]);assert.equal(coverage.semantics.overriddenIssues,0);
      assert.match(coverage.invalidMigration.unsafe.migrationIssue,/not-a-number/);assert.deepEqual(coverage.invalidMigration.canonical.allowedValues,["kept"]);assert.match(coverage.copyImport.plain,/technical \| validation \| authentication \| login \| notification/);assert.deepEqual(coverage.copyImport.imported.allowedValues,first.current.allowedValues);await reloadPanel(socket);const second=await evaluate(socket,`(()=>JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")))()`);assert.deepEqual(second,first.stored);allowedValuesRuleMigrationObservation={...first,coverage,idempotent:true};socket.close();continue;
    }
    if(activeBrowserTargetEnvironment.SCHEMA_SPECIFICATION_CONTAINER_DEFAULTS_BROWSER_ADAPTER==="1"){
      await evaluate(socket,schemaSpecificationBuilderSeedRuntime);await reloadPanel(socket);schemaSpecificationContainerDefaultsObservation=await evaluate(socket,schemaSpecificationContainerDefaultsRuntime);const observed=schemaSpecificationContainerDefaultsObservation;
      assert.equal(observed.initial.all,true);assert.equal(observed.initial.unique,true);assert.equal(observed.initial.available.some((path)=>path.endsWith("/*")),false);assert.deepEqual(observed.initial.paths,observed.initial.available);assert.equal(observed.initial.available.includes("/products")&&observed.initial.available.includes("/products/*/duration")&&observed.initial.available.includes("/site_id")&&observed.initial.available.includes("/context"),true);assert.equal(observed.inheritedContainer.checked&&observed.inheritedContainer.descendant,true);assert.match(observed.inheritedContainer.label,/inherited.*container/);assert.deepEqual(observed.excluded,{initial:true,workingDraft:true,historical:true});assert.equal(observed.afterContainer.container,false);assert.equal(observed.afterContainer.descendant,true);assert.equal(observed.afterContainer.paths.includes("/products"),false);assert.equal(observed.afterContainer.paths.includes("/products/*/duration"),true);assert.deepEqual(observed.afterDescendant,{container:false,descendant:false});assert.deepEqual(observed.retained,{products:false,duration:false});assert.equal(observed.workingDraft.all,true);assert.equal(observed.workingDraft.available.includes("/draft_only")&&observed.workingDraft.available.includes("/context"),true);assert.deepEqual([...observed.workingDraft.paths].sort(),[...observed.workingDraft.available].sort());assert.equal(observed.reset.all,true);assert.equal(observed.reset.available.includes("/context"),true);assert.deepEqual([...observed.reset.paths].sort(),[...observed.reset.available].sort());assert.deepEqual(observed.cleared,{checked:0,rows:0});assert.equal(observed.selected.all,true);assert.equal(observed.selected.rows,observed.selected.controls);assert.equal(observed.unchanged,true);assert.deepEqual(observed.runtimeErrors,[]);socket.close();continue;
    }
    if(activeBrowserTargetEnvironment.SCHEMA_PROPERTY_COMMENTS_BROWSER_ADAPTER==="1"){
      await evaluate(socket,schemaSpecificationBuilderSeedRuntime);await reloadPanel(socket);
      schemaPropertyCommentsObservation=await evaluate(socket,schemaPropertyCommentsRuntime);const observed=schemaPropertyCommentsObservation;
      assert.equal(observed.saved,"Sent by checkout\nDo not derive from position");assert.equal(observed.reopened,observed.saved);assert.equal(observed.publishedUnchanged,true);assert.deepEqual(observed.headings,["Property name","Description","Mandatory","Type","Example value","Allowed values","Comments"]);assert.equal(observed.cells[6],observed.saved);assert.match(observed.clipboard.html,/Comments[\s\S]*Sent by checkout<br>Do not derive from position/);assert.match(observed.clipboard.plain,/Allowed values\tComments/);assert.deepEqual(observed.runtimeErrors,[]);
      await reloadPanel(socket);const removalWorkflow=await evaluate(socket,schemaPropertyCommentsRemovalRuntime);
      assert.equal(removalWorkflow.queuedWhileBusy,true);assert.equal(removalWorkflow.requested,true);assert.match(removalWorkflow.summary,/documentation will be removed.*property and validation rules remain unchanged/);assert.deepEqual(removalWorkflow.cancelled,{closed:true,retained:"Only local comment"});assert.deepEqual(removalWorkflow.confirmed,{removed:null,canonicalComment:"",settledComment:null,settledCanonicalComment:"",propertyType:"number",rulesUnchanged:true});
      const lifecycle=await evaluate(socket,schemaPropertyCommentsLifecycleRuntime);
      assert.deepEqual(lifecycle.inheritance,{local:"Checkout currency exception",localOwner:"Product detail",restored:"Shared currency convention",restoredOwner:"Generic commerce",restoredInherited:true,parentUnchanged:true,pathCount:1});
      assert.deepEqual(lifecycle.revisions,{working:"Current routing input",workingOwner:"Product detail",current:"Current routing input",currentOwner:"Product detail",currentVersion:4,historical:"Legacy routing input",historicalOwner:"Product detail",historicalVersion:3});
      assert.deepEqual(lifecycle.duplicate,{local:"Sent by checkout\nDo not derive from position",inherited:"Shared currency convention",effectiveOwner:"Product detail revision 3 copy",pathCount:1});
      assert.deepEqual(lifecycle.copy,{planned:"Sent by checkout\nDo not derive from position",origin:"Product detail",stored:"Sent by checkout\nDo not derive from position",pathCount:1});
      assert.deepEqual(lifecycle.persistence,{reloaded:"Current routing input",reloadedHistorical:"Legacy routing input",imported:"Current routing input",legacyBlank:""});
      assert.deepEqual(lifecycle.removal,{removed:null,restored:"Sent by checkout\nDo not derive from position",propertyRemoved:true,propertyRestored:"string"});
      const live=await evaluate(socket,schemaPropertyCommentsLiveRuntime);assert.match(live.comments,/Comments: <img src=x/);assert.equal(live.searchMatched,true);assert.equal(live.wildcardPath,"/products/2/product_name");assert.equal(live.collapsedUnchanged,true);assert.equal(live.inert,true);assert.equal(live.payloadUnchanged&&live.validationUnchanged,true);assert.match(live.validation,/issues/);assert.deepEqual(live.missing,{path:"/products/2/product_id",comments:"Comments: Missing identifier comment",searchMatched:true,collapsedUnchanged:true,inert:true});
      await evaluate(socket,schemaPropertyCommentsSpecificationSeedRuntime);await reloadPanel(socket);const specification=await evaluate(socket,schemaPropertyCommentsSpecificationContractRuntime);
      assert.deepEqual(specification.working,{page:"Working page comment",nested:"First line\nSecond\tcell | <script>globalThis.specificationCommentExecuted=true</script>",blank:"",draft:"Working draft comment",inherited:"Inherited site comment"});
      assert.deepEqual(specification.published,{page:"Published page comment",nested:"Customer-facing label",inherited:"Inherited site comment"});assert.deepEqual(specification.historical,{legacy:"Historical legacy comment",inherited:"Inherited site comment"});
      assert.deepEqual(specification.reordered,["Property name","Description","Mandatory","Type","Comments","Example value","Allowed values"]);assert.deepEqual(specification.reset,["Property name","Description","Mandatory","Type","Example value","Allowed values","Comments"]);
      assert.deepEqual(specification.afterMode,specification.reordered);assert.deepEqual(specification.afterExample,specification.reordered);assert.equal(specification.completeness,"16 selected properties · 4 missing descriptions · 8 missing examples");assert.doesNotMatch(specification.completeness,/comment/i);assert.match(specification.spreadsheet,/Type\tComments\tExample value/);assert.match(specification.spreadsheet,/Override phone/);
      assert.match(specification.headed.html,/border:1px solid/);assert.match(specification.headed.html,/font-weight:bold;background:#eee/);assert.match(specification.headed.html,/<th[^>]*>Comments<\/th><th[^>]*>Example value<\/th>/);assert.match(specification.headed.html,/First line<br>Second\tcell \| &lt;script&gt;globalThis\.specificationCommentExecuted=true&lt;\/script&gt;/);assert.match(specification.headed.html,/Override phone/);assert.doesNotMatch(specification.headed.html,/<script>/);assert.match(specification.headed.plain,/Type\tComments\tExample value/);assert.equal(specification.headed.plain.split("\n").every((line)=>line.split("\t").length===7),true);
      assert.doesNotMatch(specification.unheaded.html,/<thead>/);assert.doesNotMatch(specification.unheaded.plain,/Property name\tDescription/);assert.equal(specification.unheaded.plain.split("\n").every((line)=>line.split("\t").length===7),true);assert.match(specification.fallback,/Type\tComments\tExample value/);assert.equal(specification.inert,true);assert.deepEqual(specification.runtimeErrors,[]);
      schemaPropertyCommentsObservation.removalWorkflow=removalWorkflow;schemaPropertyCommentsObservation.lifecycle=lifecycle;schemaPropertyCommentsObservation.live=live;schemaPropertyCommentsObservation.specification=specification;socket.close();continue;
    }
    if (activeBrowserTargetEnvironment.LIBRARY_DIRECT_TEMPLATE_PUSH_BROWSER_ADAPTER === "1") {
      await evaluate(socket, libraryDirectTemplatePushSeedRuntime); await reloadPanel(socket);
      libraryDirectTemplatePushObservation=await evaluate(socket,libraryDirectTemplatePushRuntime);const observed=libraryDirectTemplatePushObservation;
      assert.deepEqual(observed.closed.execution,["dataLayer","purchase",{transaction_id:"test-123"}]);
      assert.equal(observed.closed.editorHidden,true);assert.equal(observed.closed.search,observed.before.search);assert.equal(observed.closed.rows,observed.before.rows);assert.equal(observed.closed.target,observed.before.target);assert.match(observed.closed.feedback,/Purchase confirmation v3.*Signal Shop/);assert.match(observed.closed.feedback,/dataLayer/);
      assert.deepEqual(observed.productDraft.execution,["dataLayer","purchase",{transaction_id:"test-123"}]);assert.match(observed.productDraft.title,/Product detail/);assert.match(observed.productDraft.json,/unsaved-sku/);
      assert.deepEqual(observed.purchaseDraft.execution,["dataLayer","purchase",{transaction_id:"test-123"}]);assert.match(observed.purchaseDraft.json,/test-456/);assert.equal(observed.purchaseDraft.review.open,true);assert.match(observed.purchaseDraft.review.text,/test-456/);
      assert.deepEqual(observed.reconstituted.readiness,{success:true});assert.deepEqual(observed.reconstituted.firstPush,{result:{success:true},events:[["purchase",{transaction_id:"test-123"}]]});assert.equal(observed.reconstituted.missingBindingError,false);
      assert.deepEqual(observed.failures,["Select a target before pushing","Request access for Signal Shop","Push to Signal Shop failed"]);assert.equal(observed.persistedUnchanged,true);
      assert.deepEqual(observed.renderers,{push:{details:[["Event","purchase"],["Destination","dataLayer"]],changes:[[["Path","transaction_id"],["Previous","test-123"],["Pushed","test-456"]]],emptyHidden:true},revision:{details:[["Resulting version","4"],["Template name","Purchase confirmation → Completed checkout"],["Destination","event.history → queue.history"]],changes:[[["Path","transaction_id"],["Previous","test-123"],["Revised","test-456"],["Change","changed"]]],emptyHidden:true},revisionEmpty:{details:[["Resulting version","4"]],changeCount:0,visible:true}});
      socket.close();continue;
    }
    if (activeBrowserTargetEnvironment.RECURSIVE_DECLARED_PROPERTY_VALIDATION_BROWSER_ADAPTER === "1") {
      await evaluate(socket, `(() => {
        localStorage.clear();
        const publishedDocument={type:"object",properties:{page_type:{type:"string"},commerce:{type:"object",properties:{currency:{type:"string"},order:{type:"object",properties:{id:{type:"string"}}}}},products:{type:"array",items:{type:"object",properties:{product_name:{type:"string"}}}}}};
        const draftDocument={...publishedDocument,additionalProperties:false};const assignment={id:"assignment:pageview",name:"Generic pageviews",schemaId:"schema-generic-pageview",sourceId:"history",eventName:"pageview",target:"payload",versionPolicy:"follow latest",enabled:true};const rule={id:"rule:currency",name:"Allowed currency",version:1,propertyPath:"/commerce/currency",operator:"allowed-values",allowedValues:["EUR"],severity:"error"};
        const schema={id:"schema-generic-pageview",name:"Generic pageview",version:4,published:true,document:publishedDocument,assignments:[assignment],attachedRules:[rule],workingDraft:{baseVersion:4,sourceVersion:4,document:draftDocument,assignments:[assignment],attachedRules:[rule],pendingChanges:["Change additional-property policy"]}};
        localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([schema]));localStorage.setItem("my-chrome-utilities.schema-rule-library.v1","[]");
        const observed=(id,payload,time)=>({type:"observed",url:"https://shop.example/products",timestamp:time,observerPath:"dataLayer",id,name:"pageview",sessionId:"session:recursive-declared",sourceId:"history",sourceName:"Event history",sourceKind:"Data layer",pageUrl:"https://shop.example/products",payload,rawInput:["pageview",payload],rawValue:["pageview",payload],validation:"Not checked"});
        const base={page_type:"product",commerce:{currency:"EUR",order:{id:"1"}},products:[{product_name:"phone"},{product_name:"case"}]};const extras={...base,root_extra:true,commerce:{...base.commerce,debug:true},products:[{...base.products[0],debug:true},base.products[1]]};const timeline=[observed("event:declared",base,"2026-07-15T15:02:00Z"),observed("event:nested-extra",extras,"2026-07-15T15:02:01Z")];
        localStorage.setItem("dataLayerTestingSession",JSON.stringify({session:{id:"session:recursive-declared",status:"active",freshBoundary:true,tabId:1,historyPath:"dataLayer",startUrl:"https://shop.example/products",currentUrl:"https://shop.example/products",timeline}}));return true;
      })()`);
      await reloadPanel(socket);recursiveDeclaredPropertyValidationObservation=await evaluate(socket,recursiveDeclaredPropertyValidationRuntime);const observed=recursiveDeclaredPropertyValidationObservation;
      assert.equal(observed.checkbox,true);assert.deepEqual(observed.valid.issues,[]);assert.equal(observed.cases.every(({count,issue})=>count===1&&issue.expected==="declared property"),true);assert.deepEqual(observed.repeated,[{instancePath:"/products/0/debug",actual:"boolean"},{instancePath:"/products/1/debug",actual:"boolean"},{instancePath:"/products/1/metadata",actual:"object"}]);
      assert.equal(observed.representations.every(({issues,unchanged})=>issues.length===0&&unchanged),true);assert.deepEqual(observed.disabled,{stored:true,undeclared:0,ruleActive:true});assert.equal(observed.enabled.stored&&observed.enabled.draftUnchanged,true);assert.deepEqual(observed.enabled.paths,["/root_extra","/commerce/debug","/products/0/debug"]);
      assert.equal(observed.publication.version,5);assert.match(observed.publication.result,/Revalidated 2 current Live events/);assert.equal(observed.publication.detail.includes("commerce.debug")||observed.publication.detail.includes("/commerce/debug"),true);assert.deepEqual(observed.publication.queryMatches,["event:nested-extra"]);assert.equal(observed.publication.defectMatch&&observed.publication.archivedUnchanged&&observed.publication.archivedVersion===4,true);assert.deepEqual(observed.runtimeErrors,[]);
      socket.close();continue;
    }
    if (activeBrowserTargetEnvironment.CANONICAL_DECLARED_PROPERTY_VALIDATION_BROWSER_ADAPTER === "1") {
      await evaluate(socket, `(() => {
        localStorage.clear();
        const parent={id:"schema-generic-event",name:"Generic event",version:2,published:true,document:{type:"object",properties:{"/site_id":{type:"string"}}},assignments:[]};
        const document={type:"object",required:["/page_type"],properties:{"/page_type":{type:"string"},"/login_status":{type:"string"},"/page_levels":{type:"array"},"/page_levels/0":{type:"string"}}};
        const assignment={id:"assignment:pageview",name:"Generic pageviews",schemaId:"schema-generic-pageview",sourceId:"history",eventName:"pageview",target:"payload",versionPolicy:"follow latest",enabled:true};
        const rule={id:"rule:page-types",name:"Approved page types",version:2,propertyPath:"/page_type",operator:"allowed-values",parameters:"product,content",severity:"error"};
        const child={id:"schema-generic-pageview",name:"Generic pageview",version:3,published:true,parentSchemaId:parent.id,document,assignments:[assignment],attachedRules:[rule],workingDraft:{baseVersion:3,sourceVersion:3,parentSchemaId:parent.id,document,assignments:[assignment],attachedRules:[rule],pendingChanges:[]}};
        localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([parent,child]));localStorage.setItem("my-chrome-utilities.schema-rule-library.v1","[]");
        const observed=(id,payload,time)=>({type:"observed",url:"https://shop.example/products",timestamp:time,observerPath:"dataLayer",id,name:"pageview",sessionId:"session:canonical",sourceId:"history",sourceName:"Event history",sourceKind:"Data layer",pageUrl:"https://shop.example/products",payload,rawInput:["pageview",payload],rawValue:["pageview",payload],validation:"Not checked"});
        const timeline=[observed("event:declared",{page_type:"product",login_status:"logged in",page_levels:["product"]},"2026-07-14T21:00:00Z"),observed("event:extra",{site_id:"otelo",page_type:"product",login_status:"logged in",page_levels:["product"],debug:true},"2026-07-14T21:00:01Z")];
        localStorage.setItem("dataLayerTestingSession",JSON.stringify({session:{id:"session:canonical",status:"active",freshBoundary:true,tabId:1,historyPath:"dataLayer",startUrl:"https://shop.example/products",currentUrl:"https://shop.example/products",timeline}}));
        return true;
      })()`);
      await reloadPanel(socket);
      canonicalDeclaredPropertyValidationObservation=await evaluate(socket,canonicalDeclaredPropertyValidationRuntime);
      socket.close();continue;
    }
    if (activeBrowserTargetEnvironment.SCHEMA_RULE_PROPERTY_IDENTITY_BROWSER_ADAPTER === "1") {
      await evaluate(socket, `(() => {
        localStorage.clear();
        const parentDocument={type:"object",properties:{"/customer/id":{type:"string"}}};
        const parent={id:"schema-customer",name:"Customer",version:2,published:true,document:parentDocument,assignments:[],documentation:{properties:{"/customer/id":{displayName:"Customer id",description:"Inherited customer identifier"}}}};
        const document={type:"object",properties:{"/page_type":{type:"string",propertyOrigin:"manual"},"/page_levels":{type:"array"},"/page_levels/0":{type:"string"},products:{type:"array",items:{type:"object",properties:{name:{type:"string"}}}}}};
        const current={id:"schema-page-view",name:"Page view",version:4,published:true,parentSchemaId:parent.id,document,assignments:[],attachedRules:[],documentation:{properties:{"/page_type":{displayName:"Page classification",description:"Business page type"}}},workingDraft:{baseVersion:4,sourceVersion:4,parentSchemaId:parent.id,document,assignments:[],attachedRules:[],documentation:{properties:{"/page_type":{displayName:"Page classification",description:"Business page type"}}},pendingChanges:[]}};
        const rules=[{id:"rule:approved-page-types",name:"Approved page types",kind:"Allowed values",operator:"allowed-values",parameters:"homepage,checkout",applicableType:"string",version:2,enabled:true},{id:"rule:compatible-strings",name:"Compatible strings",kind:"Allowed values",operator:"allowed-values",parameters:"known",applicableType:"string",version:1,enabled:true}];
        localStorage.setItem("my-chrome-utilities.schema-library.v1",JSON.stringify([parent,current]));
        localStorage.setItem("my-chrome-utilities.schema-rule-library.v1",JSON.stringify(rules));
        return true;
      })()`);
      await reloadPanel(socket);
      schemaRulePropertyIdentityObservation = await evaluate(socket, schemaRulePropertyIdentityRuntime);
      assert.deepEqual(schemaRulePropertyIdentityObservation.initial.identities,["/page_type","/page_levels","/page_levels/0","/products","/products/*","/products/*/name","/customer/id"]);
      assert.equal(schemaRulePropertyIdentityObservation.initial.metadata,"Manual · type string");
      assert.match(schemaRulePropertyIdentityObservation.initial.documentation,/Business page type/);
      assert.equal(schemaRulePropertyIdentityObservation.initial.arrayPicker.heading,"Add rule for page_levels · type array");
      assert.equal(schemaRulePropertyIdentityObservation.required.documentUnchanged,true);
      assert.deepEqual([schemaRulePropertyIdentityObservation.required.selected,schemaRulePropertyIdentityObservation.required.expanded,schemaRulePropertyIdentityObservation.required.editorScroll,schemaRulePropertyIdentityObservation.required.treeScroll,schemaRulePropertyIdentityObservation.required.focus],["true",true,31,19,"Add rule for page_type"]);
      assert.equal(schemaRulePropertyIdentityObservation.reusable.documentUnchanged,true);
      assert.equal(schemaRulePropertyIdentityObservation.distinct.documentUnchanged,true);
      assert.equal(schemaRulePropertyIdentityObservation.targets.every(({documentUnchanged})=>documentUnchanged),true);
      assert.equal(schemaRulePropertyIdentityObservation.reopened.documentUnchanged,true);
      socket.close(); continue;
    }
    if (activeBrowserTargetEnvironment.LOCAL_RULE_PROMOTION_AVAILABILITY_BROWSER_ADAPTER === "1") {
      await evaluate(socket, localRulePromotionAvailabilitySeedRuntime); await reloadPanel(socket);
      localRulePromotionAvailabilityObservation=await evaluate(socket,localRulePromotionAvailabilityRuntime);
      assert.deepEqual(localRulePromotionAvailabilityObservation.initial,{controlCount:1,noWorkingDraft:true,canonicalRows:1,identity:"local-41",path:"/page_type"});
      assert.equal(localRulePromotionAvailabilityObservation.initial.identity,"local-41");assert.equal(localRulePromotionAvailabilityObservation.initial.path,"/page_type");
      assert.match(localRulePromotionAvailabilityObservation.promoted.review,/Page view revision 3 source for a new working draft.*\/page_type.*local-41/);
      assert.deepEqual(localRulePromotionAvailabilityObservation.cancelled,{storageUnchanged:true,noWorkingDraft:true,reopenedCount:1});
      assert.equal(localRulePromotionAvailabilityObservation.failure.storageUnchanged&&localRulePromotionAvailabilityObservation.failure.controlRetained&&localRulePromotionAvailabilityObservation.failure.noDraft,true,JSON.stringify(localRulePromotionAvailabilityObservation.failure));
      assert.match(localRulePromotionAvailabilityObservation.failure.assistance,/simulated availability failure/);
      assert.equal(localRulePromotionAvailabilityObservation.failure.pendingRuleCount,1);
      assert.match(localRulePromotionAvailabilityObservation.failure.rejectedResult,/Rejected .*Saved Schema Library/);
      assert.deepEqual(localRulePromotionAvailabilityObservation.promoted.draftIds,["reusable-51","local-42"]);
      assert.deepEqual(localRulePromotionAvailabilityObservation.promoted.libraryIds,["reusable-51"]);
      assert.equal(localRulePromotionAvailabilityObservation.promoted.workingDraft&&localRulePromotionAvailabilityObservation.promoted.sameIdentity&&localRulePromotionAvailabilityObservation.promoted.publishedUnchanged,true,JSON.stringify(localRulePromotionAvailabilityObservation.promoted));
      assert.deepEqual([localRulePromotionAvailabilityObservation.promoted.canonicalRows,localRulePromotionAvailabilityObservation.promoted.reusableControl],[1,false]);
      assert.deepEqual({dialogOpen:localRulePromotionAvailabilityObservation.promoted.retry.dialogOpen,pendingRuleCount:localRulePromotionAvailabilityObservation.promoted.retry.pendingRuleCount,dialogClosed:localRulePromotionAvailabilityObservation.promoted.retry.dialogClosed,settledRuleCount:localRulePromotionAvailabilityObservation.promoted.retry.settledRuleCount},{dialogOpen:true,pendingRuleCount:1,dialogClosed:true,settledRuleCount:1});
      assert.match(localRulePromotionAvailabilityObservation.promoted.retry.result,/committed to the Saved Schema Library/);
      assert.deepEqual(localRulePromotionAvailabilityObservation.reopened,{version:4,local42Count:1,reusableCount:0,noWorkingDraftBeforeAction:true});
      assert.equal(localRulePromotionAvailabilityObservation.newSchema.promotedCount,1);
      assert.deepEqual(localRulePromotionAvailabilityObservation.newSchema.standaloneAttachments,[]);
      assert.equal(localRulePromotionAvailabilityObservation.newSchema.schemaStorageUnchanged&&localRulePromotionAvailabilityObservation.newSchema.provisionalAbsent,true);
      socket.close();continue;
    }
    if (activeBrowserTargetEnvironment.LOCAL_RULE_PROMOTION_BROWSER_ADAPTER === "1") {
      await evaluate(socket, localRulePromotionSeedRuntime); await reloadPanel(socket);
      const localOrigin = await evaluate(socket, localRulePromotionOpenRuntime);
      await evaluate(socket, localRulePromotionReusableOriginRuntime); await reloadPanel(socket);
      const reusableCount = await evaluate(socket, localRulePromotionOriginCountRuntime);
      await evaluate(socket, localRulePromotionInheritedSeedRuntime); await reloadPanel(socket);
      const inheritedCount = await evaluate(socket, localRulePromotionInheritedCountRuntime);
      await evaluate(socket, localRulePromotionSeedRuntime); await reloadPanel(socket);
      const initial = {...await evaluate(socket, localRulePromotionOpenRuntime),localCount:localOrigin.localCount,reusableCount,inheritedCount};
      await socket.call("Input.dispatchKeyEvent", { type:"keyDown", key:" ", code:"Space", windowsVirtualKeyCode:32 });
      await socket.call("Input.dispatchKeyEvent", { type:"keyUp", key:" ", code:"Space", windowsVirtualKeyCode:32 });
      const review = await evaluate(socket, localRulePromotionReviewRuntime);
      const failures = [
        await evaluate(socket, localRulePromotionFailureRuntime("my-chrome-utilities.schema-rule-library.v1")),
        await evaluate(socket, localRulePromotionFailureRuntime("my-chrome-utilities.schema-library.v1")),
      ];
      await evaluate(socket, `document.querySelector('.schema-attached-rule[data-rule-id="local-41"] .local-rule-promotion-action').click()`);
      const prepared = await evaluate(socket, localRulePromotionPrepareConfirmRuntime);
      await socket.call("Input.dispatchKeyEvent", { type:"keyDown", key:" ", code:"Space", windowsVirtualKeyCode:32 });
      await socket.call("Input.dispatchKeyEvent", { type:"keyUp", key:" ", code:"Space", windowsVirtualKeyCode:32 });
      const completed = await evaluate(socket, localRulePromotionAfterRuntime);
      await reloadPanel(socket);
      const reloaded = await evaluate(socket, `(() => { const schemas=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1")); const rules=JSON.parse(localStorage.getItem("my-chrome-utilities.schema-rule-library.v1")); return {rules:rules.map(({id,version})=>[id,version]),attachments:schemas.find(({id})=>id==="schema:page-view").attachedRules.map(({id,version})=>[id,version])}; })()`);
      localRulePromotionObservation={initial,review,failures,prepared,...completed,reloaded};
      assert.deepEqual(localRulePromotionObservation.initial,{localCount:1,reusableCount:0,inheritedCount:0,scroll:47,focused:"local-41"});
      assert.equal(localRulePromotionObservation.initial.localCount,1);assert.equal(localRulePromotionObservation.initial.reusableCount,0);assert.equal(localRulePromotionObservation.initial.inheritedCount,0);assert.equal(localRulePromotionObservation.initial.scroll,47);assert.equal(localRulePromotionObservation.initial.focused,"local-41");
      assert.match(localRulePromotionObservation.review.observation.summary,/Page view revision 3 working draft.*\/page_type.*local-41/);
      assert.match(localRulePromotionObservation.review.observation.configuration,/allowed-values.*string product.*warning.*Use a known page type.*enabled/);
      assert.deepEqual({name:localRulePromotionObservation.review.observation.name,required:localRulePromotionObservation.review.observation.required,focus:localRulePromotionObservation.review.observation.focus,withinWidth:localRulePromotionObservation.review.observation.withinWidth},{name:"",required:true,focus:"local-rule-promotion-heading",withinWidth:true});
      assert.equal(localRulePromotionObservation.review.observation.name,"");assert.equal(localRulePromotionObservation.review.observation.required,true);assert.equal(localRulePromotionObservation.review.observation.focus,"local-rule-promotion-heading");assert.equal(localRulePromotionObservation.review.observation.withinWidth,true);
      assert.deepEqual(localRulePromotionObservation.review.cancelled,{focus:"local-41",open:true,scroll:47});
      assert.equal(localRulePromotionObservation.review.cancelled.focus,"local-41");assert.equal(localRulePromotionObservation.review.cancelled.open,true);assert.equal(localRulePromotionObservation.review.cancelled.scroll,47);
      assert.equal(localRulePromotionObservation.failures[0].unchanged,true);assert.equal(localRulePromotionObservation.failures[0].local,true);assert.equal(localRulePromotionObservation.failures[0].rules,0);assert.match(localRulePromotionObservation.failures[0].assistance,/simulated persistence failure/);
      assert.equal(localRulePromotionObservation.failures[1].unchanged,true);assert.equal(localRulePromotionObservation.failures[1].local,true);assert.equal(localRulePromotionObservation.failures[1].rules,0);assert.match(localRulePromotionObservation.failures[1].assistance,/simulated persistence failure/);
      assert.deepEqual(localRulePromotionObservation.prepared,{disabled:false,focus:true});
      assert.equal(localRulePromotionObservation.prepared.disabled,false);assert.equal(localRulePromotionObservation.prepared.focus,true);
      assert.deepEqual(localRulePromotionObservation.beforePublish.rule,{id:"reusable-51",name:"Approved page types",kind:"Allowed values",version:1,operator:"allowed-values",allowedValues:["product","content"],applicableType:"string",severity:"warning",message:"Use a known page type",conditionGroup:{operator:"All",predicates:[{propertyPath:"/site",operator:"Equals",comparison:{type:"string",value:"consumer"},detectedType:"string"}]},enabled:true,description:"Known storefront page types",examples:"product, content",attachments:["schema:page-view"],revisionHistory:[]});
      assert.deepEqual(localRulePromotionObservation.beforePublish.ids,["local-40","reusable-51","local-42"]);
      assert.deepEqual(localRulePromotionObservation.beforePublish.paths,["/page_type","/page_type","/page_type"]);
      assert.match(localRulePromotionObservation.beforePublish.neighbors[0],/"id":"local-40"/);assert.match(localRulePromotionObservation.beforePublish.neighbors[1],/"id":"local-42"/);
      assert.deepEqual(localRulePromotionObservation.beforePublish.pending,["Document page ownership","Promote local rule local-41 to reusable rule reusable-51"]);
      assert.deepEqual({publishedId:localRulePromotionObservation.beforePublish.publishedId,focus:localRulePromotionObservation.beforePublish.focus,open:localRulePromotionObservation.beforePublish.open,scroll:localRulePromotionObservation.beforePublish.scroll,noHorizontal:localRulePromotionObservation.beforePublish.noHorizontal},{publishedId:"local-41",focus:"reusable-51",open:true,scroll:47,noHorizontal:true});
      assert.equal(localRulePromotionObservation.beforePublish.publishedId,"local-41");
      assert.equal(localRulePromotionObservation.beforePublish.focus,"reusable-51");
      assert.equal(localRulePromotionObservation.beforePublish.open,true);
      assert.equal(localRulePromotionObservation.beforePublish.scroll,47);
      assert.equal(localRulePromotionObservation.beforePublish.noHorizontal,true);
      assert.deepEqual(localRulePromotionObservation.afterPublish,{version:4,currentId:"reusable-51",historicalId:"local-41",otherIds:[]});
      assert.equal(localRulePromotionObservation.afterPublish.version,4);
      assert.equal(localRulePromotionObservation.afterPublish.currentId,"reusable-51");
      assert.equal(localRulePromotionObservation.afterPublish.historicalId,"local-41");
      assert.deepEqual(localRulePromotionObservation.reloaded,{rules:[["reusable-51",1]],attachments:[["local-40",1],["reusable-51",1],["local-42",1]]});
      assert.equal(localRulePromotionObservation.reloaded.rules[0][0],"reusable-51");
      assert.equal(localRulePromotionObservation.reloaded.rules[0][1],1);
      assert.equal(localRulePromotionObservation.reloaded.attachments[0][0],"local-40");
      assert.equal(localRulePromotionObservation.reloaded.attachments[0][1],1);
      assert.equal(localRulePromotionObservation.reloaded.attachments[1][0],"reusable-51");
      assert.equal(localRulePromotionObservation.reloaded.attachments[1][1],1);
      assert.equal(localRulePromotionObservation.reloaded.attachments[2][0],"local-42");
      assert.equal(localRulePromotionObservation.reloaded.attachments[2][1],1);
      socket.close(); continue;
    }
    if (activeBrowserTargetEnvironment.ALLOWED_VALUE_EXPANSION_BROWSER_ADAPTER === "1") {
      await evaluate(socket, allowedValueExpansionSeedRuntime); await reloadPanel(socket);
      allowedValueExpansionObservation = await evaluate(socket, allowedValueExpansionRuntime);
      assert.deepEqual(allowedValueExpansionObservation.initial, {
        count:1, ruleId:"stable-id-41", ruleVersion:"1", status:"Validation failed, 1 error",
        schema:"Otelo - Generic Pageview version 2",
        raw:'{\n  "page_type": "product_test",\n  "site": "consumer"\n}', expanded:"true",
      });
      assert.match(allowedValueExpansionObservation.review.summary, /Otelo - Generic Pageview revision 2.*\/page_type.*Known page types revision 1.*string product.*string content.*string product_test/);
      assert.deepEqual({ publication:allowedValueExpansionObservation.review.publication,focus:allowedValueExpansionObservation.review.focus,destination:allowedValueExpansionObservation.review.destination,withinWidth:allowedValueExpansionObservation.review.withinWidth }, { publication:true,focus:"allowed-value-expansion-heading",destination:"assigned-schema-draft",withinWidth:true });
      assert.deepEqual(allowedValueExpansionObservation.cancelled, { focused:"stable-id-41",expanded:"true",scroll:37 });
      assert.deepEqual(allowedValueExpansionObservation.afterConfirm.values, ["product","content","product_test"]);
      assert.deepEqual(allowedValueExpansionObservation.afterConfirm.pending, ["Document checkout ownership","Allow string product_test for /page_type in Known page types (stable-id-41)"]);
      assert.deepEqual({ publishedParameters:allowedValueExpansionObservation.afterConfirm.publishedParameters,publishedValues:allowedValueExpansionObservation.afterConfirm.publishedValues,condition:allowedValueExpansionObservation.afterConfirm.condition,severity:allowedValueExpansionObservation.afterConfirm.severity,message:allowedValueExpansionObservation.afterConfirm.message }, { publishedParameters:undefined,publishedValues:["product","content"],condition:"consumer",severity:"error",message:"Choose a known page type" });
      assert.deepEqual({ focused:allowedValueExpansionObservation.afterConfirm.focused,expanded:allowedValueExpansionObservation.afterConfirm.expanded,scroll:allowedValueExpansionObservation.afterConfirm.scroll }, { focused:"stable-id-41",expanded:"true",scroll:37 });
      assert.match(allowedValueExpansionObservation.alreadyPending, /already pending/i); assert.equal(allowedValueExpansionObservation.duplicateUnchanged,true);
      assert.deepEqual(allowedValueExpansionObservation.openedDraft, { schemaView:"true",editor:true,focused:"schema-editor-name",values:["product","content","product_test"] });
      assert.deepEqual(allowedValueExpansionObservation.returned, { event:"page_view",expanded:"true",scroll:37 });
      assert.deepEqual(allowedValueExpansionObservation.afterPublish, {
        version:3, values:["product","content","product_test"], actionCount:0,
        status:"Validation passed", feed:"page_view · 13:00:00 · history · Valid · 0 new issues", schema:"Otelo - Generic Pageview version 3",
        raw:'{\n  "page_type": "product_test",\n  "site": "consumer"\n}', defectStates:[],
      });
      socket.close(); continue;
    }
    if (activeBrowserTargetEnvironment.SCHEMA_PUBLICATION_REFRESH_BROWSER_ADAPTER === "1") {
      await evaluate(socket, schemaPublicationRefreshSeedRuntime); await reloadPanel(socket);
      schemaPublicationRefreshObservation = await evaluate(socket, schemaPublicationRefreshRuntime);
      if (schemaPublicationRefreshObservation.debug) assert.fail(JSON.stringify(schemaPublicationRefreshObservation.debug));
      assert.deepEqual(schemaPublicationRefreshObservation.before, { summary:"Validation passed", schema:"Product listing version 3", optionalHidden:true });
      assert.equal(schemaPublicationRefreshObservation.queryBefore, "1 of 2 events");
      assert.equal(schemaPublicationRefreshObservation.control.order, true);
      assert.deepEqual({ label:schemaPublicationRefreshObservation.control.revealed.label, pressed:schemaPublicationRefreshObservation.control.revealed.pressed, value:schemaPublicationRefreshObservation.control.revealed.value, treatment:schemaPublicationRefreshObservation.control.revealed.treatment }, { label:"Hide non-applicable properties",pressed:"true",value:"Missing",treatment:"neutral" });
      assert.match(schemaPublicationRefreshObservation.control.revealed.status, /not applicable/i);
      assert.notEqual(schemaPublicationRefreshObservation.control.revealed.missingColor, schemaPublicationRefreshObservation.control.revealed.dangerColor);
      assert.equal(schemaPublicationRefreshObservation.publication.savedUnchanged, true);
      assert.match(schemaPublicationRefreshObservation.publication.result, /Published Product listing revision 4\. Revalidated 2 current Live events\./);
      assert.equal(schemaPublicationRefreshObservation.after.politeAnnouncements, 1);
      assert.deepEqual({ query:schemaPublicationRefreshObservation.after.query,count:schemaPublicationRefreshObservation.after.count,selected:schemaPublicationRefreshObservation.after.selected,summary:schemaPublicationRefreshObservation.after.summary,schema:schemaPublicationRefreshObservation.after.schema,show:schemaPublicationRefreshObservation.after.show,optionalExpanded:schemaPublicationRefreshObservation.after.optionalExpanded,pageType:schemaPublicationRefreshObservation.after.pageType,focused:schemaPublicationRefreshObservation.after.focused }, { query:"1 of 2 events",count:"2",selected:"page_view",summary:"Validation failed, 1 error",schema:"Product listing version 4",show:"true",optionalExpanded:"true",pageType:"! 1 error",focused:"/test" });
      assert.equal(schemaPublicationRefreshObservation.after.feed.length, 1);
      assert.equal(schemaPublicationRefreshObservation.defectStates.includes("Review required"), true);
      assert.deepEqual(schemaPublicationRefreshObservation.boundary, { refreshed:["pre:1","pre:2"],ids:["pre:1","pre:2","post:1"],revisions:[4,4,4] });
      await evaluate(socket, `(() => { const toggle=document.querySelector("#live-non-applicable-properties"); toggle.focus(); return toggle.getAttribute("aria-pressed"); })()`);
      await socket.call("Input.dispatchKeyEvent", { type:"keyDown", key:" ", code:"Space", windowsVirtualKeyCode:32 });
      await socket.call("Input.dispatchKeyEvent", { type:"keyUp", key:" ", code:"Space", windowsVirtualKeyCode:32 });
      assert.equal(await evaluate(socket, `document.querySelector("#live-non-applicable-properties").getAttribute("aria-pressed")`), "true");
      socket.close(); continue;
    }
    if (activeBrowserTargetEnvironment.DEFECT_LIBRARY_BROWSER_ADAPTER === "1") {
      await evaluate(socket, defectLibrarySeedRuntime); await reloadPanel(socket);
      defectLibraryObservation = await evaluate(socket, defectLibraryRuntime);
      assert.deepEqual(defectLibraryObservation.nav, ["Live","Projects","Library","Sessions","Defects","Schemas"]);
      assert.equal(defectLibraryObservation.actualReportedLinks, 1);
      assert.deepEqual(defectLibraryObservation.openedFromIssue, { view:"true",detail:false });
      assert.deepEqual(defectLibraryObservation.returnedToIssue, { view:"true",event:"purchase",focused:true,scrollPreserved:true });
      assert.equal(defectLibraryObservation.restoredCount, 2); assert.equal(defectLibraryObservation.filteredCount, 1);
      assert.deepEqual(defectLibraryObservation.edited.safeLink, { href:"https://jira.example/browse/DL-42", target:"_blank", rel:"noopener noreferrer" });
      assert.deepEqual(defectLibraryObservation.stateControl, { options:["Saved","Reported","Resolved","Archived"],selected:"Reported",updateButtons:1,legacyButtons:0 });
      assert.deepEqual(defectLibraryObservation.recopy.types.sort(), ["text/html","text/plain"]); assert.match(defectLibraryObservation.recopy.html, /Edited details/); assert.match(defectLibraryObservation.recopy.text, /Edited details/); assert.match(defectLibraryObservation.recopy.feedback, /rich formatting/);
      assert.match(defectLibraryObservation.states.saved, /Saved/); assert.match(defectLibraryObservation.states.reported, /Reported/); assert.match(defectLibraryObservation.states.resolved, /Resolved/); assert.match(defectLibraryObservation.states.archived, /Archived/);
      assert.match(defectLibraryObservation.confirmation, /Captured evidence and saved sessions remain unchanged/); assert.equal(defectLibraryObservation.afterDelete, 1);
      assert.deepEqual(defectLibraryObservation.stored, { count:1,status:"Reported",description:"Edited details",notes:"Jira https://jira.example/browse/DL-42" });
      assert.deepEqual(defectLibraryObservation.renderCases.map(({triage,reported,fresh}) => [triage,reported,fresh]), [["2 new issues",0,2],["1 new and 1 reported",1,1],["all 2 issues reported",2,0]]);
      assert.equal(defectLibraryObservation.renderCases.every(({feed,validation}) => feed.includes("2 issues") && validation.startsWith("Validation failed")), true);
      assert.deepEqual(defectLibraryObservation.differences, ["Reported","Reported","New","New","New","New","New","New","Review required"]);
      assert.deepEqual(defectLibraryObservation.wildcardMatch, ["active:sku"]);
      assert.deepEqual(defectLibraryObservation.actionResults, [["Copy for Jira Cloud",0,true],["Save defect",1,false],["Save defect and copy",1,true]]);
      assert.deepEqual(defectLibraryObservation.actionStatuses, [[],["Saved"],["Saved"]]);
      assert.deepEqual(defectLibraryObservation.actionWrites, ["jira","jira"]);
      assert.deepEqual(defectLibraryObservation.linked, { sessions:1,id:"saved:session:one",contains:true,immutable:true });
      assert.deepEqual(defectLibraryObservation.statuses, { resolved:"Possible regression treated New",archived:"New" });
      socket.close(); continue;
    }
    if (activeBrowserTargetEnvironment.VALIDATION_PRESENCE_BROWSER_ADAPTER === "1") {
      validationPresenceSemanticsObservation = await evaluate(socket, validationPresenceSemanticsRuntime);
      assert.equal(validationPresenceSemanticsObservation.operators.every(({ status, issues, state }) => status === "not-applicable" && issues === 0 && state === "Valid"), true);
      assert.deepEqual(validationPresenceSemanticsObservation.requiredCases, [
        { observed:"missing", statuses:["error","not-applicable"], issues:["Required"] },
        { observed:"test", statuses:["pass","pass"], issues:[] },
        { observed:"another value", statuses:["pass","error"], issues:["Allowed values"] },
      ]);
      assert.deepEqual(validationPresenceSemanticsObservation.nullValue, { status:"error", actual:"null", issueActual:"null" });
      assert.deepEqual(validationPresenceSemanticsObservation.undefinedValue, { statuses:["error","pass"], actuals:["undefined","undefined"], typeIssueActual:"undefined" });
      assert.deepEqual(validationPresenceSemanticsObservation.conditionalCases.map(({ status, issues }) => [status,issues]), [["not-applicable",0],["not-applicable",0],["error",1],["error",1]]);
      assert.deepEqual(validationPresenceSemanticsObservation.equivalent, { legacy:"not-applicable", inherited:"not-applicable", issues:0 });
      assert.deepEqual(validationPresenceSemanticsObservation.liveSummary, { status:"9 rules not applicable", symbolName:"neutral", treatment:"neutral", errors:0, warnings:0, passed:0 });
      assert.deepEqual(validationPresenceSemanticsObservation.liveInspector, { hiddenByDefault:true,revealed:true,issueRows:0,invalidMissing:false });
      socket.close(); continue;
    }
    if (activeBrowserTargetEnvironment.MISSING_EVENT_DEFECT_REPORT_BROWSER_ADAPTER === "1" || activeBrowserTargetEnvironment.UNIFIED_DEFECT_BUILDER_BROWSER_ADAPTER === "1" || activeBrowserTargetEnvironment.MISSING_EVENT_REPORT_FIDELITY_BROWSER_ADAPTER === "1") {
      await evaluate(socket, `(() => {
        const assignment = { id:"assignment:checkout-purchase", name:"Checkout purchase", sourceId:"event-history", eventName:"purchase", target:"payload", domainCondition:"shop.example", pathnameCondition:"/checkout", enabled:true };
        const schema = { id:"schema-checkout-purchase", name:"Checkout purchase", version:4, published:true, document:{ type:"object", properties:{ transaction_id:{ type:"string" } } }, assignments:[assignment] };
        localStorage.clear(); localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([schema])); localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", "[]"); return true;
      })()`);
      await reloadPanel(socket);
      missingEventDefectReportObservation = await evaluate(socket, missingEventDefectReportRuntime);
      assert.deepEqual(missingEventDefectReportObservation.entries, { sideEntry:"Report missing event", schemaRowEntries:1 });
      assert.deepEqual(missingEventDefectReportObservation.zero.verification, { count:0, warning:true, noCreate:true });
      assert.deepEqual({ type:missingEventDefectReportObservation.zero.report.type, capturedEventId:missingEventDefectReportObservation.zero.report.capturedEventId, payload:missingEventDefectReportObservation.zero.report.payload, capture:missingEventDefectReportObservation.zero.report.capture, issues:missingEventDefectReportObservation.zero.report.issues }, { type:"Missing event", capturedEventId:null, payload:null, capture:null, issues:0 });
      assert.deepEqual(missingEventDefectReportObservation.warning.before.count, 1);
      assert.deepEqual(missingEventDefectReportObservation.warning.override.evidence, ["purchase-1"]);
      assert.deepEqual(missingEventDefectReportObservation.scope, { zero:{ count:0, warning:true, override:null }, match:{ count:1, visible:true, override:null } });
      assert.deepEqual(missingEventDefectReportObservation.saved, { immutable:true, count:0, sourceCount:2, snapshotCount:1 });
      assert.equal(missingEventDefectReportObservation.zero.replacement.intervalControls, false);
      assert.equal(missingEventDefectReportObservation.unified.initial.noInterval, true);
      assert.equal(missingEventDefectReportObservation.unified.initial.noCreate, true);
      assert.deepEqual(missingEventDefectReportObservation.unified.nested.payload, { page_name:"test", products:[{ id:1, name:"robot" }] });
      assert.deepEqual(missingEventDefectReportObservation.unified.nested.actions, [false,false,false]);
      assert.equal(missingEventDefectReportObservation.unified.nested.duplicatedItems, 2);
      const flat=missingEventDefectReportObservation.unified.flat;
      assert.deepEqual(flat.payload, { page_levels:["d"], page_type:"product_detail", page_section:"product", login_status:"logged in", b_id:"123" });
      assert.equal(flat.pointers.includes("/page_levels/0") && flat.pointers.includes("/page_type") && flat.escapedAbsent, true);
      assert.equal(flat.schemaUnchanged, true); assert.deepEqual(flat.runtimeErrors, []);
      assert.deepEqual(flat.initialItem, { input:"", focused:true });
      assert.equal(flat.typed.every(({value,same,focused,caret})=>same&&focused&&caret===value.length), true);
      assert.equal(flat.typed.at(-1).value, "logged in");
      assert.deepEqual(flat.invalid.actions, [true,true,true]); assert.match(flat.invalid.issue, /allowed/i);
      assert.equal(flat.validation, "Valid"); assert.deepEqual(flat.actions, [false,false,false]);
      assert.deepEqual(flat.provenance["/page_levels/0"], { id:"page-levels", name:"Page level values", version:2, propertyPath:"/page_levels/*" });
      assert.deepEqual(flat.untyped, { disabled:true, assistance:true }); assert.equal(flat.fits, true);
      assert.deepEqual([flat.narrativeCount,flat.preCount,flat.compactAbsent,flat.copiedSame], [1,1,true,true]);
      assert.deepEqual(flat.savedPayload, flat.payload);
      assert.deepEqual(missingEventDefectReportObservation.unified.failures, { copyFailure:"Copy failed", saveFailure:"Save failed", rejectedSaveCalls:1, unchanged:true, reportPayload:{ order_id:"A-123", currency:"EUR" } });
      if (activeBrowserTargetEnvironment.MISSING_EVENT_REPORT_FIDELITY_BROWSER_ADAPTER === "1") {
        const fidelity=missingEventDefectReportObservation.fidelity;
        assert.deepEqual(fidelity.incomplete, { additional:{ value:"", tag:"TEXTAREA" }, preCount:1, preLines:3, paragraphHasJson:false });
        assert.deepEqual(fidelity.beforeConfirmation.payload, { page_type:"product_detail", products:[{ id:1, name:"robot" }] });
        assert.deepEqual(fidelity.beforeConfirmation.structure, ["P","PRE"]);
        assert.deepEqual(fidelity.beforeConfirmation.steps, ["Visit /products","Click Robot","Visit /checkout","Expect pageview to be pushed"]);
        assert.deepEqual(fidelity.complete.structure, ["P","P","PRE"]);
        assert.deepEqual([fidelity.complete.narrativeCount,fidelity.complete.preCount,fidelity.complete.additionalBeforeNarrative,fidelity.complete.literalText,fidelity.complete.markupAbsent], [1,1,true,true,true]);
        assert.deepEqual(fidelity.complete.sources, { "/page_type":"schema-provided value", "/products/0/id":"operator custom response", "/products/0/name":"operator custom response" });
        assert.deepEqual(fidelity.complete.provenance["/page_type"], { id:"page-type", name:"Page type requirement", version:1, propertyPath:"/page_type" });
        assert.deepEqual([fidelity.edited.preCount,fidelity.edited.narrativeCount,fidelity.edited.staleAbsent], [1,1,true]);
        assert.equal(fidelity.edited.payload.products[0].name, 'robot <&> "quoted"\nline two');
        assert.deepEqual(fidelity.persistence.reopenedSteps, ["Visit /products","Click Robot card","Visit /checkout","Expect pageview to be pushed"]);
        assert.deepEqual([fidelity.persistence.copiedSame,fidelity.persistence.reopenedSame,fidelity.persistence.recopiedSame,fidelity.persistence.reopenedPre,fidelity.persistence.provenanceHidden,fidelity.persistence.plainBreaks], [true,true,true,1,true,true]);
        assert.deepEqual(fidelity.persistence.savedSources, fidelity.complete.sources);
      }
      socket.close(); continue;
    }
    if (activeBrowserTargetEnvironment.RECURSIVE_PROPERTY_VALIDATION_BROWSER_ADAPTER === "1") {
      recursivePropertyValidationObservation = await evaluate(socket, recursivePropertyValidationRuntime);
      assert.equal(recursivePropertyValidationObservation.entry.stage, "destination");
      assert.equal(recursivePropertyValidationObservation.entry.path, "/oOrder/aProducts/*/sku");
      assert.equal(recursivePropertyValidationObservation.layout.actionsSeparate, true);
      assert.equal(recursivePropertyValidationObservation.target.inspections.valid.matchedValueCount, 6);
      assert.equal(new Set(recursivePropertyValidationObservation.hierarchy.paths).size, recursivePropertyValidationObservation.hierarchy.paths.length);
      assert.equal(recursivePropertyValidationObservation.hierarchy.paths.includes("/oOrder/a/b"), false);
      assert.deepEqual(recursivePropertyValidationObservation.search.open, ["/oOrder", "/oOrder/aProducts", "/oOrder/aProducts/*", "/oOrder/aProducts/*/pricing"]);
      socket.close(); continue;
    }
    if (activeBrowserTargetEnvironment.SCHEMA_PROPERTY_REMOVAL_BROWSER_ADAPTER === "1") {
      await evaluate(socket, `(() => {
        const base = { id:"base", name:"Base", version:2, published:true, document:{ type:"object", properties:{ inherited_id:{ type:"string" } } }, assignments:[] };
        const document = { type:"object", required:["page_type", "commerce", "debug", "items"], properties:{ page_type:{ type:"string" }, commerce:{ type:"object", required:["order"], properties:{ order:{ type:"object", propertyOrigin:"manual", required:["id", "value"], properties:{ id:{ type:"string", propertyOrigin:"manual" }, value:{ type:"number", propertyOrigin:"manual" } } } } }, debug:{ type:"boolean", propertyOrigin:"manual" }, items:{ type:"string", propertyOrigin:"manual" } } };
        const attachedRules = [{ id:"rule:order-id", name:"Order identifier", version:2, propertyPath:"/commerce/order/id" }, { id:"rule:order-value", name:"Order value", version:1, propertyPath:"/commerce/order/value" }, { id:"rule:commerce", name:"Commerce shape", version:1, propertyPath:"/commerce" }];
        const page = { id:"page-view", name:"Page view", version:3, published:true, parentSchemaId:"base", document, assignments:[], attachedRules, workingDraft:{ baseVersion:3, sourceVersion:3, parentSchemaId:"base", document, assignments:[], attachedRules, pendingChanges:[] } };
        localStorage.clear(); localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([base, page])); localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", JSON.stringify([{ id:"rule:order-id", name:"Order identifier", version:2, enabled:true }])); return true;
      })()`);
      await reloadPanel(socket);
      schemaPropertyRemovalObservation = await evaluate(socket, schemaPropertyRemovalRuntime);
      await reloadPanel(socket);
      schemaPropertyRemovalReloadObservation = await evaluate(socket, schemaPropertyRemovalReloadRuntime);
      assert.equal(schemaPropertyRemovalObservation.immediate.absent, true);
      assert.equal(schemaPropertyRemovalReloadObservation.restored.draftAbsent, true);
      assert.match(schemaPropertyRemovalReloadObservation.confirmation.summary,/Order identifier at \/commerce\/order\/id/);
      assert.match(schemaPropertyRemovalReloadObservation.confirmation.summary,/Order value at \/commerce\/order\/value/);
      assert.match(schemaPropertyRemovalReloadObservation.confirmation.summary,/Commerce shape at \/commerce/);
      assert.equal(schemaPropertyRemovalReloadObservation.confirmed.reusable, true);
      assert.deepEqual(
        {
          count:schemaPropertyRemovalReloadObservation.empty.count,
          publishBlocked:schemaPropertyRemovalReloadObservation.empty.publishBlocked,
          reason:schemaPropertyRemovalReloadObservation.empty.reason,
          addAvailable:schemaPropertyRemovalReloadObservation.empty.addAvailable,
        },
        { count:0, publishBlocked:true, reason:"Add at least one property", addAvailable:true },
      );
      socket.close(); continue;
    }
    if (activeBrowserTargetEnvironment.FRESH_LIVE_SESSION_BROWSER_ADAPTER === "1") {
      const freshSessionProject = await evaluate(socket, guidedTransportProjectSetupRuntime);
      await reloadPanel(socket);
      freshLiveSessionObservation = await evaluate(socket, freshLiveSessionRuntime);
      assert.equal(freshLiveSessionObservation.initial.events, 12);
      assert.equal(freshLiveSessionObservation.confirmation.open, true);
      assert.equal(freshLiveSessionObservation.cancelled.id, freshLiveSessionObservation.initial.id);
      assert.equal(freshLiveSessionObservation.afterSave.snapshot.events, 12);
      assert.deepEqual(freshLiveSessionObservation.purchase.names, ["purchase"]);
      assert.equal(freshLiveSessionObservation.archive.unchanged, true);
      await reloadPanel(socket);
      freshLiveSessionReloadObservation = await evaluate(socket, freshLiveSessionReloadRuntime);
      assert.deepEqual(freshLiveSessionReloadObservation.names, ["purchase"]);
      await evaluate(socket, guidedTransportProjectRestoreRuntime(freshSessionProject));
      socket.close(); continue;
    }
    if (runWorkspacePanelContainmentRuntime) {
      workspacePanelContainmentObservation = await evaluate(socket, workspacePanelContainmentRuntime);
      assert.deepEqual(workspacePanelContainmentObservation, {
        peers:true,
        nested:false,
        storageOwnership:{dataLayer:true,shell:true,legacyWorkspace:"hotkeys"},
        utilityDirectory:{
          ids:["command-palette","hotkeys","data-layer"],
          labels:["Command palette","Hotkeys","Data layer"],
          visible:true,
        },
        panelOwnership:{count:9,commandPalette:"command-palette",hotkeys:"hotkeys",dataLayer:"data-layer"},
        afterActivation:{
          dataLayerHidden:true,
          hotkeysHidden:false,
          hotkeysVisible:true,
          headingVisible:true,
          searchVisible:true,
          registeredGroupCount:3,
          registeredGroupsVisible:true,
        },
      }, `Workspace panel containment violated its ${width}px browser contract`);
    }
    if (activeBrowserTargetEnvironment.WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER === "1") {
      socket.close(); continue;
    }
    if (runSchemaViewContainmentRuntime) {
      schemaViewContainmentObservation = await evaluate(socket, schemaViewContainmentRuntime);
      assert.deepEqual(schemaViewContainmentObservation, {
        containedControls:true,
        editorContainsActions:true,
        closeReviewContainsActions:true,
        assignmentContainsPolicy:true,
        standaloneAssignmentPolicy:0,
        presentationByView:{
          Live:{ panelDisplay:"none", painted:false, focusable:false, closeReviewOpen:false },
          Library:{ panelDisplay:"none", painted:false, focusable:false, closeReviewOpen:false },
          Sessions:{ panelDisplay:"none", painted:false, focusable:false, closeReviewOpen:false },
        },
        editorStates:{ assignmentWasOpen:true, assignmentHiddenWhileAway:true, ruleWasOpen:true, ruleHiddenWhileAway:true },
        restored:{ editorVisible:true, name:"Unsaved checkout schema", closeReviewOpen:false },
      }, `Schema view containment violated its ${width}px browser contract`);
    }
    if (activeBrowserTargetEnvironment.SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER === "1") {
      socket.close(); continue;
    }
    if (activeBrowserTargetEnvironment.SCHEMA_WORKSPACE_BROWSER_ADAPTER === "1") {
      const previousActiveProjectId = await evaluate(socket, guidedTransportProjectSetupRuntime);
      await reloadPanel(socket);
      const schemaRuleEditorVisibility = await evaluate(socket, schemaRuleEditorVisibilityRuntime);
      assert.deepEqual(schemaRuleEditorVisibility, {
        hiddenByView:{ Live:true, Library:true, Sessions:true, Schemas:true },
        editorVisible:true,
        configurationVisible:true,
        configurationInsideEditor:true,
      }, "Schema rule configuration visibility violated its " + width + "px browser contract");
      await reloadPanel(socket);
      const schemaWorkspaceObservation =
        await captureSchemaWorkspace(socket, width, schemaRuleEditorVisibility);
      schemaWorkspaceAdapterObservations.push(schemaWorkspaceObservation);
      if (browserTargetId) console.log(JSON.stringify({ schemaWorkspace:schemaWorkspaceObservation }));
      await evaluate(socket, guidedTransportProjectRestoreRuntime(previousActiveProjectId));
      socket.close();
      continue;
    }
    if (activeBrowserTargetEnvironment.PAYLOAD_PATH_FILTER_BROWSER_ADAPTER === "1" || !requestedBrowserAdapter) {
      payloadPathFilterPickerObservation = await evaluate(socket, payloadPathFilterPickerRuntime);
      assert.deepEqual(payloadPathFilterPickerObservation, {
      initialFieldOptions:["Choose field", "Event name", "Source", "Adapter kind", "Pathname", "Payload property", "Validation state", "Schema", "Validation rule", "Rule severity", "Affected property"],
      presentation:{ visible:true, searchAvailable:true, customAvailable:true, pathCount:44, completeAccessibleNames:true, bounded:true, overflowY:"auto", topFieldsAbsent:true, searchFocused:true },
      back:{ stageHidden:true, fieldFocused:true, conditionCount:0 },
      reopenedSearchFocused:true,
      filteredPaths:["commerce.order.id", "commerce.total"],
      observedSelection:{ selected:"Selected field Payload · commerce.total", operatorVisible:true, valueVisible:true, suggestions:["12"] },
      blankCustomDisabled:true,
      customSelection:{ selected:"Selected field Payload · commerce.coupon.code", conditionCount:0 },
      beforeLaterEvent:"0 of 2 events",
      afterLaterEvent:"1 of 3 events",
      }, `Payload path filter picker violated its ${width}px browser contract`);
    }
    if ([320, 360, 520, 1280].includes(width) &&
        (activeBrowserTargetEnvironment.REPRODUCTION_STEP_ACTION_ROWS_BROWSER_ADAPTER === "1" ||
         !requestedBrowserAdapter)) {
      await socket.call("Input.dispatchKeyEvent",{type:"keyDown",key:"Tab",code:"Tab",windowsVirtualKeyCode:9,nativeVirtualKeyCode:9});await socket.call("Input.dispatchKeyEvent",{type:"keyUp",key:"Tab",code:"Tab",windowsVirtualKeyCode:9,nativeVirtualKeyCode:9});const reproductionStepActionRows = await evaluate(socket, reproductionStepActionRowsRuntime);
      reproductionStepActionRowsObservations.push(reproductionStepActionRows);
      assert.equal(reproductionStepActionRows.width, width);
      assert.equal(reproductionStepActionRows.text, "3. Click Bravo");
      assert.equal(reproductionStepActionRows.actionOrder.length, 4, JSON.stringify(reproductionStepActionRows.actionOrder));
      assert.deepEqual(reproductionStepActionRows.actionOrder, ["", "+", "Adjust", "Remove"]);
      assert.equal(reproductionStepActionRows.actionOrder[3], "Remove");
      assert.deepEqual(reproductionStepActionRows.tabOrder, reproductionStepActionRows.actionOrder);
      assert.equal(reproductionStepActionRows.tabOrder[3], "Remove");
      assert.equal(reproductionStepActionRows.textBeforeActions, true,JSON.stringify(reproductionStepActionRows));
      assert.equal(reproductionStepActionRows.guidanceAfterActions, true,JSON.stringify(reproductionStepActionRows));
      assert.equal(reproductionStepActionRows.completeControls, true,JSON.stringify(reproductionStepActionRows));
      assert.equal(reproductionStepActionRows.noHorizontalOverflow, true,JSON.stringify(reproductionStepActionRows));
      assert.equal(reproductionStepActionRows.rows.every(({ textBeforeActions, addName }) => textBeforeActions && /^Add step to \//.test(addName)), true,JSON.stringify(reproductionStepActionRows));
      assert.deepEqual(reproductionStepActionRows.reorderEvidence.closedSemantics,{
        type:"button",accessibleName:"Reorder Click Bravo, position 2 of 3",hasPopup:"menu",expanded:"false",
        controls:reproductionStepActionRows.reorderEvidence.closedSemantics.controls,menuRole:"menu",itemRole:"listitem",itemLabel:"Click Bravo",position:"2",setSize:"3",
        ariaGrabbed:false,triggerDraggable:true,rowDraggable:false,target:reproductionStepActionRows.reorderEvidence.closedSemantics.target,
      });
      assert.match(reproductionStepActionRows.reorderEvidence.closedSemantics.controls,/^reorder-menu-/);
      assert.equal(reproductionStepActionRows.reorderEvidence.closedSemantics.target.width>=44,true,JSON.stringify(reproductionStepActionRows.reorderEvidence));
      assert.equal(reproductionStepActionRows.reorderEvidence.closedSemantics.target.height>=44,true,JSON.stringify(reproductionStepActionRows.reorderEvidence));
      assert.deepEqual(reproductionStepActionRows.reorderEvidence.presentation.grip,{width:16,height:16});
      assert.deepEqual(reproductionStepActionRows.reorderEvidence.presentation.target,{width:44,height:44});
      assert.equal(reproductionStepActionRows.reorderEvidence.presentation.inlineSvg,true);
      assert.equal(reproductionStepActionRows.reorderEvidence.presentation.dots,6);
      assert.equal(reproductionStepActionRows.reorderEvidence.presentation.ariaHidden,"true");
      assert.equal(reproductionStepActionRows.reorderEvidence.presentation.fill,"currentColor");
      assert.equal(reproductionStepActionRows.reorderEvidence.presentation.visibleText,"");
      assert.equal(reproductionStepActionRows.reorderEvidence.presentation.gripCenter.x<=1&&reproductionStepActionRows.reorderEvidence.presentation.gripCenter.y<=1,true);
      assert.equal(reproductionStepActionRows.reorderEvidence.presentation.hostCenter<=1,true,JSON.stringify(reproductionStepActionRows.reorderEvidence.presentation));
      assert.deepEqual(reproductionStepActionRows.reorderEvidence.presentation.rest.border,["0px","0px","0px","0px"]);
      assert.equal(reproductionStepActionRows.reorderEvidence.presentation.rest.shadow,"none");
      assert.equal(reproductionStepActionRows.reorderEvidence.presentation.rest.whiteSpace,"nowrap");
      assert.doesNotMatch(reproductionStepActionRows.reorderEvidence.presentation.rest.color,/(?:transparent|\/\s*0\s*\)|rgba\([^)]*,\s*0\s*\))/u,"the installed grip color must remain visible");
      assert.equal(reproductionStepActionRows.reorderEvidence.presentation.states.hoverActive,true);
      assert.match(reproductionStepActionRows.reorderEvidence.presentation.states.hoverInline,/color-mix/u);
      assert.notEqual(reproductionStepActionRows.reorderEvidence.presentation.states.hoverBackground,reproductionStepActionRows.reorderEvidence.presentation.rest.background,JSON.stringify(reproductionStepActionRows.reorderEvidence.presentation.states));
      assert.doesNotMatch(reproductionStepActionRows.reorderEvidence.presentation.states.hoverBackground,/(?:transparent|\/\s*0\s*\)|rgba\([^)]*,\s*0\s*\))/u,"the installed hover surface must remain visible");
      assert.notEqual(reproductionStepActionRows.reorderEvidence.presentation.states.focusOutline.style,"none");
      assert.equal(reproductionStepActionRows.reorderEvidence.presentation.states.restCursor,"grab");
      assert.equal(reproductionStepActionRows.reorderEvidence.presentation.states.dragCursor,"grabbing");
      assert.equal(reproductionStepActionRows.reorderEvidence.presentation.themeReady,true);
      assert.equal(reproductionStepActionRows.reorderEvidence.presentation.forcedColorReady,true);
      assert.deepEqual(reproductionStepActionRows.reorderEvidence.keyboard,{firstFocused:"Move to first",endFocused:"Move…",escapeRestored:true});
      assert.deepEqual(reproductionStepActionRows.reorderEvidence.menuLabels.map(({label})=>label),["Move to first","Move one position earlier","Move one position later","Move to last","Move…"]);
      assert.deepEqual(reproductionStepActionRows.reorderEvidence.movedRows,["Click Alpha","Click Charlie","Click Delta","Click Bravo"]);
      assert.equal(reproductionStepActionRows.reorderEvidence.focusedAfterMove,"manual:manual-2");
      assert.equal(reproductionStepActionRows.reorderEvidence.status,"Click Bravo moved from position 2 to position 4");
      assert.equal(reproductionStepActionRows.reorderEvidence.geometry.documentOverflow,false,JSON.stringify(reproductionStepActionRows.reorderEvidence.geometry));
      assert.equal(reproductionStepActionRows.reorderEvidence.geometry.menuInside,true,JSON.stringify(reproductionStepActionRows.reorderEvidence.geometry));
      assert.equal(reproductionStepActionRows.reorderEvidence.geometry.dialogInside,true,JSON.stringify(reproductionStepActionRows.reorderEvidence.geometry));
      assert.equal(reproductionStepActionRows.reorderEvidence.geometry.noActionOverlap,true,JSON.stringify(reproductionStepActionRows.reorderEvidence.geometry));
      if(width===320)assert.equal(reproductionStepActionRows.reorderEvidence.geometry.rootFontSize,"64px");
      assert.deepEqual(reproductionStepActionRows.checkoutBoundary, {
        text:"2. Click Checkout",
        reorderSuppressed:true,
        guidance:"Reordering stays within /checkout.",
        chooseAnotherAbsent:true,
      });
    }
    if (activeBrowserTargetEnvironment.LIVE_TARGET_PERMISSION_RECOVERY_WIRING_BROWSER_ADAPTER === "1") {
      const recoveryProject = await evaluate(
        socket,
        guidedTransportProjectSetupRuntime.replaceAll("queue.history", "event.history"),
      );
      await reloadPanel(socket);
      try {
        liveTargetPermissionRecoveryWiringObservation = await evaluate(socket, liveTargetPermissionRecoveryWiringRuntime);
      } finally {
        await evaluate(socket, guidedTransportProjectRestoreRuntime(recoveryProject));
        await reloadPanel(socket);
      }
    }
    if (activeBrowserTargetEnvironment.SINGLE_LIVE_EVENT_FEED_BROWSER_ADAPTER === "1" || !requestedBrowserAdapter) {
      await reloadPanel(socket);
      singleLiveEventFeedObservation = await evaluate(socket, singleLiveEventFeedRuntime);
      assert.deepEqual(singleLiveEventFeedObservation, {
      liveFeedCount:1,
      liveFeedInsideLivePanel:true,
      duplicateTimelineCount:0,
      secondaryCurrentSessionLists:[0, 0, 0],
      journey:{ visits:["/checkout", "/products"], eventCount:3 },
      archiveEventIds:["pageview", "promotion", "purchase"],
      defectEventIds:["pageview", "promotion", "purchase"],
      inspectorPresentation:{
        captured:{showNonApplicableProperties:true,expandedPropertyPaths:["/checkout/id"],
          expandedRulePaths:["/checkout/id"],focusedId:"capture-inspector-focus",
          focusedPropertyPath:"/checkout/id",scrollTop:37},
        restored:{propertyOpen:true,ruleExpanded:"true",scrollTop:37,
          focusedId:"capture-inspector-focus"},
      },
      }, `current-session journey was duplicated outside the Live feed at ${width}px`);
    }
    if (!requestedBrowserAdapter) {
      const schemaRuleEditorVisibility = await evaluate(socket, schemaRuleEditorVisibilityRuntime);
      assert.deepEqual(schemaRuleEditorVisibility, {
        hiddenByView:{ Live:true, Library:true, Sessions:true, Schemas:true },
        editorVisible:true,
        configurationVisible:true,
        configurationInsideEditor:true,
      }, `Schema rule configuration visibility violated its ${width}px browser contract`);
      await reloadPanel(socket);
    }
    if (activeBrowserTargetEnvironment.SAVED_SESSION_LIVE_FEED_BROWSER_ADAPTER === "1") {
      await evaluate(socket, `(() => {
        const events = Array.from({ length:18 }, (_, index) => ({ id:"saved-" + (index + 1), name:"purchase", sourceId:"history", sourceName:"Event history", sourceKind:"Data layer", captureTime:"2026-07-12T10:" + String(index).padStart(2, "0") + ":00Z", pageUrl:"https://example.test/checkout", captureOrder:index + 1, payload:{ index:index + 1 }, rawInput:["purchase", index + 1], provenance:{ adapter:"history", imported:true }, validation:index === 17 ? "1 issues" : "Valid", validationDetails:{ schema:{ id:"checkout", name:"Checkout", version:3 }, issues:index === 17 ? [{ instancePath:"/index", message:"Recorded issue", expected:"17", actual:"18", schemaName:"Checkout", schemaVersion:3, schemaLocation:"#/index" }] : [], evaluations:[] } }));
        const session = { id:"saved:checkout", name:"Checkout journey", immutable:true, pageScope:"https://example.test/checkout", startedAt:"2026-07-12T10:00:00Z", endedAt:"2026-07-12T10:18:00Z", events, provenance:{ imported:true } };
        localStorage.clear();
        localStorage.setItem("my-chrome-utilities.saved-session-library.v1", JSON.stringify({ sessions:[session] }));
        localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([{ id:"checkout", name:"Checkout", version:4, published:true, document:{ type:"object" }, assignments:[{ id:"checkout-purchases", sourceId:"history", eventName:"purchase", target:"payload", enabled:true }] }]));
        return true;
      })()`);
      const savedSessionProject = await evaluate(socket, guidedTransportProjectSetupRuntime);
      await reloadPanel(socket);
      savedSessionLiveFeedObservation = await evaluate(socket, savedSessionLiveFeedRuntime);
      await reloadPanel(socket);
      savedSessionLiveFeedReloadObservation = await evaluate(socket, savedSessionLiveFeedReloadRuntime);
      await evaluate(socket, guidedTransportProjectRestoreRuntime(savedSessionProject));
      socket.close(); continue;
    }
    if (activeBrowserTargetEnvironment.SCHEMA_NESTED_PATH_BROWSER_ADAPTER === "1") {
      await evaluate(socket, `(() => {
        const document = { type:"object", properties:{ fruits:{ type:"array", items:{ type:"string" } }, products:{ type:"array", items:{ type:"object", properties:{ id:{ type:"number" }, name:{ type:"string" } } } }, order:{ type:"object", properties:{ id:{ type:"string" } } } } };
        const current = { id:"schema-product-detail", name:"Product detail", version:3, published:true, document, assignments:[], workingDraft:{ baseVersion:3, sourceVersion:3, document, assignments:[], attachedRules:[], pendingChanges:[] } };
        const rules = [{ id:"rule-product-ids", name:"Product ids", kind:"Numeric range · number", operator:"numeric range", parameters:"0-999", applicableType:"number", version:1, enabled:true }];
        localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([current]));
        localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", JSON.stringify(rules));
        return true;
      })()`);
      await reloadPanel(socket);
      schemaNestedPathObservation = await evaluate(socket, schemaNestedPathRuntime);
      assert.deepEqual(schemaNestedPathObservation.advanced.arrayOverflow,{label:"⋯",menu:["Definition","Rules","Structure"]});
      assert.deepEqual(schemaNestedPathObservation.advanced.arrayActions,["Edit type · Array of Object","Add item property","Add rule","Add specific index rule","Copy to another schema","Remove property"]);
      assert.equal(schemaNestedPathObservation.exactIndex.heading,"Add rule for fruits.1 · type string");
      assert.equal(schemaNestedPathObservation.wildcardPicker.heading,"Add rule for products.*.id · type number");
      assert.deepEqual(schemaNestedPathObservation.persisted,{pendingChanges:["Attach Product ids to products.*.id"],attachmentPaths:["/products/*/id"],currentRules:0,currentVersion:3});
      socket.close(); continue;
    }
    if (width === 320 &&
        (activeBrowserTargetEnvironment.GUIDED_VALIDATION_BROWSER_ADAPTER === "1" ||
         activeBrowserTargetEnvironment.SCHEMA_MANUAL_PROPERTY_BROWSER_ADAPTER === "1" ||
         activeBrowserTargetEnvironment.SCHEMA_PROPERTY_RULE_PICKER_BROWSER_ADAPTER === "1" ||
         !requestedBrowserAdapter)) {
      const previousPickerStorage = await evaluate(socket, `(() => {
        const previous = Object.fromEntries(Array.from({ length:localStorage.length }, (_, index) => localStorage.key(index)).filter(Boolean).map((key) => [key, localStorage.getItem(key)]));
        const schemas = [
          { id:"schema:product-listing:3", name:"Product listing", version:3, document:{ type:"object", properties:{ page_type:{ type:"string" } } }, assignments:[{ id:"assignment:product", name:"Product pages", sourceId:"event-history", eventName:"pageview", target:"payload", domainCondition:"shop.example", pathConditions:[{ matchType:"Path pattern", expression:"/products/*" }], enabled:true }] },
          { id:"schema:raw-event:2", name:"Raw event", version:2, document:{ type:"object" }, assignments:[{ id:"assignment:raw", name:"Raw pages", sourceId:"event-history", eventName:"pageview", target:"raw input", enabled:true }] },
          { id:"schema:product-archive:4", name:"Product archive", version:4, document:{ type:"object", properties:{ archived:{ type:"boolean" } } }, assignments:[{ id:"assignment:archive", name:"Archive pages", sourceId:"event-history", eventName:"archive", target:"payload", domainCondition:"archive.example", enabled:true }] },
          { id:"schema:numeric:1", name:"Numeric page types", version:1, document:{ type:"object", properties:{ page_type:{ type:"number" } } }, assignments:[{ id:"assignment:numeric", name:"Numeric pages", sourceId:"event-history", eventName:"other", target:"payload", enabled:true }] },
          ...Array.from({ length:46 }, (_, index) => ({ id:"schema:filler:" + index, name:"Reference schema " + String(index + 1).padStart(2, "0"), version:1, document:{ type:"object", properties:{ reference:{ type:"string" } } }, assignments:[{ id:"assignment:filler:" + index, name:"Reference assignment " + index, sourceId:"event-history", eventName:"reference_" + index, target:"payload", domainCondition:"reference-" + index + ".example", enabled:true }] })),
        ];
        localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify(schemas));
        localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", "[]");
        return previous;
      })()`);
      const previousPickerSchemas = await evaluate(socket, installGuidedSavedSchemasRuntime(`JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1") ?? "[]")`));
      const previousPickerActiveProjectId = await evaluate(socket, guidedTransportProjectSetupRuntime);
      await reloadPanel(socket);
      if (activeBrowserTargetEnvironment.GUIDED_VALIDATION_BROWSER_ADAPTER === "1" ||
          !requestedBrowserAdapter) {
      guidedSchemaPickerObservation = await evaluate(socket, guidedSchemaPickerRuntime);
      assert.deepEqual({
        closed:[guidedSchemaPickerObservation.closed.searchAbsent, guidedSchemaPickerObservation.closed.resultsAbsent],
        opened:{ ...guidedSchemaPickerObservation.opened, resultCount:guidedSchemaPickerObservation.opened.resultCount },
        searchNames:{
          name:guidedSchemaPickerObservation.searches.name.names,
          version:guidedSchemaPickerObservation.searches.version.names,
          property:guidedSchemaPickerObservation.searches.property.names.toSorted(),
          domain:guidedSchemaPickerObservation.searches.domain.names,
          path:guidedSchemaPickerObservation.searches.path.names,
        },
        targetOnly:guidedSchemaPickerObservation.searches.target.targets.every((value) => value === "Target: payload"),
        empty:[guidedSchemaPickerObservation.empty.message, guidedSchemaPickerObservation.empty.selected, guidedSchemaPickerObservation.empty.restoredCount],
        presentation:[guidedSchemaPickerObservation.resultPresentation.incompatibleDisabled, guidedSchemaPickerObservation.resultPresentation.skippedIncompatible],
        enter:guidedSchemaPickerObservation.enterSelection,
        escape:guidedSchemaPickerObservation.escapeDismissal,
        close:guidedSchemaPickerObservation.closeDismissal,
        button:guidedSchemaPickerObservation.buttonSelection,
      }, {
        closed:[true,true],
        opened:{ modal:true, searchFocused:true, resultCount:50, count:"50 of 50 schemas", listScrolls:true, dialogBounded:true, flowUnexpanded:true, backgroundExcluded:true },
        searchNames:{ name:["Product listing version 3"], version:["Product archive version 4"], property:["Numeric page types version 1", "Product listing version 3"], domain:["Product listing version 3"], path:["Product listing version 3"] },
        targetOnly:true,
        empty:["No schemas match the current search.", null, "50 of 50 schemas"],
        presentation:[true,true],
        enter:{ dialogClosed:true, summary:"Product listing version 3", changeFocused:true, target:"payload", expectedTypeSource:"String — Product listing version 3" },
        escape:{ dialogClosed:true, unchanged:true, restored:true },
        close:{ dialogClosed:true, restored:true },
        button:{ summary:"Product listing version 3", changeFocused:true },
      }, "Guided schema picker violated its 320px browser contract");
      }
      await evaluate(socket, guidedTransportProjectRestoreRuntime(previousPickerActiveProjectId));
      if (activeBrowserTargetEnvironment.SCHEMA_MANUAL_PROPERTY_BROWSER_ADAPTER === "1") {
        await evaluate(socket, `(() => {
          const base = { id:"schema-base", name:"Base schema", version:1, published:true, document:{ type:"object", properties:{ page_name:{ type:"string" } } }, assignments:[] };
          const current = { id:"schema-page-view", name:"Page view", version:3, published:true, parentSchemaId:"schema-base", document:{ type:"object", properties:{ page_type:{ type:"string" } } }, assignments:[], workingDraft:{ baseVersion:3, sourceVersion:3, parentSchemaId:"schema-base", document:{ type:"object", properties:{ page_type:{ type:"string" } } }, assignments:[], attachedRules:[], pendingChanges:[] } };
          localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([base, current]));
          localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", "[]");
          return true;
        })()`);
        await reloadPanel(socket);
        const interaction = await evaluate(socket, schemaManualPropertyRuntime);
        await reloadPanel(socket);
        const reload = await evaluate(socket, schemaManualPropertyReloadRuntime);
        schemaManualPropertyObservation = { interaction, reload };
        assert.deepEqual(interaction.duplicate,{closed:true,unchanged:true,selected:true,visible:true,focused:true});
        await evaluate(socket, `(() => {
          const document = { type:"object", required:["products", "tags"], properties:{
            commerce:{ type:"object", minimum:1, properties:{} },
            products:{ type:"array", minimum:1, items:{ type:"object", additionalProperties:false, required:["product_name"], properties:{ product_name:{ type:"string", propertyOrigin:"manual", minimum:2 } } } },
            tags:{ type:"array", items:{ type:"string" } }
          } };
          const documentation = { properties:{ "/products/*/product_name":{ displayName:"Product name", description:"Existing product documentation" } } };
          const attachedRules = [{ id:"product-name-rule", version:2, propertyPath:"/products/*/product_name", operator:"non-empty-string", enabled:true }];
          const current = { id:"schema-page-view", name:"Page view", version:3, published:true, document, documentation, assignments:[], attachedRules, workingDraft:{ baseVersion:3, sourceVersion:3, document, documentation, assignments:[], attachedRules, pendingChanges:[] } };
          localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([current]));
          localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", "[]");
          return true;
        })()`);
        await reloadPanel(socket);
        const containerInteraction = await evaluate(socket, schemaContainerChildRuntime);
        await reloadPanel(socket);
        const containerReload = await evaluate(socket, schemaContainerChildReloadRuntime);
        schemaContainerChildObservation = { interaction:containerInteraction, reload:containerReload };
      }
      if (activeBrowserTargetEnvironment.SCHEMA_PROPERTY_RULE_PICKER_BROWSER_ADAPTER === "1") {
        await evaluate(socket, `(() => {
          const document = { type:"object", properties:{ page_type:{ type:"string" }, product:{ type:"object", properties:{ sku:{ type:"string" } } }, revenue:{ type:"number" }, items:{ type:"array", items:{ type:"object" } } } };
          const current = { id:"schema-page-view", name:"Page view", version:3, published:true, document, assignments:[], workingDraft:{ baseVersion:3, sourceVersion:3, document, assignments:[], attachedRules:[], pendingChanges:[] } };
          const rules = [
            { id:"rule:approved", name:"Approved pages", kind:"Allowed values · string", operator:"allowed values", parameters:"homepage, checkout", description:"Public pages", applicableType:"string", version:2, enabled:true },
            { id:"rule:number", name:"Revenue range", kind:"Numeric range · number", operator:"numeric range", parameters:"0-100", applicableType:"number", version:3, enabled:true },
            { id:"rule:array", name:"Item count", kind:"Item count · array", operator:"item count", parameters:"1-10", applicableType:"array", version:1, enabled:true },
          ];
          localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([current]));
          localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", JSON.stringify(rules));
          return true;
        })()`);
        await reloadPanel(socket);
        schemaPropertyRulePickerObservation = await evaluate(socket, schemaPropertyRulePickerRuntime);
        assert.equal(schemaPropertyRulePickerObservation.opened.heading,"Add rule for page_type · type string");
        assert.equal(schemaPropertyRulePickerObservation.attached.draftRules,1);
        assert.equal(schemaPropertyRulePickerObservation.localCreation.count,1);
        assert.deepEqual([schemaPropertyRulePickerObservation.reusableCreation.attachmentCount,schemaPropertyRulePickerObservation.reusableCreation.sameIdentity],[1,true]);
      }
      await evaluate(socket, installGuidedSavedSchemasRuntime(JSON.stringify(previousPickerSchemas)));
      await evaluate(socket, `(previous => { localStorage.clear(); for (const [key, value] of Object.entries(previous)) localStorage.setItem(key, value); })(${JSON.stringify(previousPickerStorage)})`);
      await reloadPanel(socket);
      socket.close();
      continue;
    }
    if (width === 720 && activeBrowserTargetEnvironment.SCHEMA_DOCUMENTATION_BROWSER_ADAPTER === "1") {
      await evaluate(socket, `(() => {
        const unsafe = "<img src=x onerror=globalThis.documentationExecuted=true><script>globalThis.documentationExecuted=true</script>";
        const document = {
          type:"object",
          required:["page_type", "oOrder"],
          properties:{
            page_type:{ type:"string" },
            currency:{ type:"string" },
            items:{ type:"array", items:{ type:"object", properties:{ product_id:{ type:"string" } } } },
            oOrder:{
              type:"object",
              required:["order_id", "aProducts"],
              properties:{
                order_id:{ type:"string" },
                aProducts:{ type:"array", items:{ type:"object", required:["product_id"], properties:{ product_id:{ type:"string" } } } },
              },
            },
          },
        };
        const assignment = { id:"assignment:product-detail", schemaId:"schema-product-detail", schemaVersion:3, sourceId:"event-history", eventName:"product_detail", target:"payload", versionPolicy:"pinned", enabled:true };
        const rule = { id:"rule:product-id", name:"Product identifier required", version:1, propertyPath:"/oOrder/aProducts/*/product_id", operator:"required", severity:"error" };
        const documentation = { description:"Revision 3 original", properties:{ "/page_type":{ displayName:"Page classification", description:unsafe }, "/items/*/product_id":{ displayName:"Product identifier", description:"Stable product identifier" }, "/oOrder/order_id":{ displayName:"Order identifier", description:"Stable order identifier" } } };
        const historical = { id:"schema-product-detail", name:"Product detail", version:2, published:true, document, assignments:[assignment], attachedRules:[rule], documentation:{ description:"Historical schema", properties:{ "/page_type":{ displayName:"Page classification", description:"Historical description" } } } };
        const product = { id:"schema-product-detail", name:"Product detail", version:3, published:true, document, assignments:[assignment], attachedRules:[rule], documentation, revisionHistory:[historical], workingDraft:{ baseVersion:3, sourceVersion:3, document, assignments:[assignment], attachedRules:[rule], documentation, pendingChanges:[] } };
        const parent = { id:"schema-generic-commerce", name:"Generic commerce", version:2, published:true, document:{ type:"object", properties:{ currency:{ type:"string" } } }, assignments:[], documentation:{ properties:{ "/currency":{ displayName:"Currency", description:"Inherited currency" } } } };
        localStorage.clear();
        localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([product, parent]));
        localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", "[]");
        return true;
      })()`);
      await reloadPanel(socket);
      schemaDocumentationObservation = await evaluate(socket, schemaDocumentationRuntime);
      assert.deepEqual(schemaDocumentationObservation.editor.paths, ["/page_type", "/items/*/product_id", "/oOrder/order_id", "/oOrder/aProducts/*/product_id"], "Schema documentation editor did not persist one canonical entry");
      assert.equal(schemaDocumentationObservation.editor.schemaDescription, "Product detail commerce event");
      assert.equal(schemaDocumentationObservation.editor.currentDescription, "Revision 3 original");
      assert.equal(schemaDocumentationObservation.editor.ruleCount, 1);
      assert.deepEqual({ mapped:schemaDocumentationObservation.presentation.mapped, wildcard:schemaDocumentationObservation.presentation.wildcard, synthetic:schemaDocumentationObservation.presentation.synthetic, unmatchedControl:schemaDocumentationObservation.presentation.unmatchedControl, plainText:schemaDocumentationObservation.presentation.plainText, focusReturned:schemaDocumentationObservation.presentation.focusReturned, searchVisible:schemaDocumentationObservation.presentation.searchVisible }, { mapped:true, wildcard:true, synthetic:true, unmatchedControl:0, plainText:true, focusReturned:true, searchVisible:true }, "Live documentation presentation lost mapped, wildcard, synthetic, safe, or searchable information");
      assert.deepEqual(schemaDocumentationObservation.inheritance, { inherited:["Inherited currency", "Generic commerce", true], local:["Local currency meaning", "Product detail", false], restored:["Inherited currency", "Generic commerce"], parentUnchanged:"Inherited currency" }, "Documentation inheritance and local override resolution diverged");
      assert.deepEqual(schemaDocumentationObservation.removal, { reviewShowsDocumentation:true, removed:{ property:true, rules:0, documentation:false }, restored:{ property:true, rules:1, documentation:"Stable identifier used by fulfilment" } }, "Property removal and undo did not update documentation atomically");
      assert.equal(schemaDocumentationObservation.lifecycle.legacyDocumentation, null);
      socket.close(); continue;
    }
    if (width === 720 && activeBrowserTargetEnvironment.CONDITIONAL_VALIDATION_RULES_BROWSER_ADAPTER === "1") {
      await evaluate(socket, `(() => {
        const document = { type:"object", properties:{ page_type:{ type:"string" }, currency:{ type:"string" }, oOrder:{ type:"object", properties:{ aProducts:{ type:"array", items:{ type:"object" } } } } } };
        const schema = { id:"schema-product-event", name:"Product event", version:1, published:true, document, assignments:[{ id:"assignment:product-event", name:"Product detail events", sourceId:"event-history", eventName:"product_detail", target:"payload", enabled:true }] };
        localStorage.clear();
        localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([schema]));
        localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", "[]");
        return true;
      })()`);
      const conditionalRulesProject = await evaluate(socket, guidedTransportProjectSetupRuntime);
      await reloadPanel(socket);
      await evaluate(socket, `(async () => {
        for (const key of ["my-chrome-utilities.specification-project.v1", "my-chrome-utilities.specification-project-library.v1"]) {
          window.dispatchEvent(new StorageEvent("storage", { key, newValue:localStorage.getItem(key) }));
        }
        for (let attempt = 0; attempt < 200; attempt += 1) {
          const path = document.querySelector("#history-path");
          if (path && !path.disabled && path.value === "queue.history") return true;
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
        throw new Error("Conditional validation project transport did not hydrate " + JSON.stringify({
          project:localStorage.getItem("my-chrome-utilities.specification-project.v1")?.slice(0, 120),
          library:localStorage.getItem("my-chrome-utilities.specification-project-library.v1")?.slice(0, 180),
          path:document.querySelector("#history-path")?.value,
          disabled:document.querySelector("#history-path")?.disabled,
          context:document.querySelector("#project-transport-context")?.textContent,
        }));
      })()`);
      conditionalValidationRulesObservation = await evaluate(socket, conditionalValidationRulesRuntime);
      assert.deepEqual(conditionalValidationRulesObservation.evaluations, [
        { page_type:"product_detail", products:"missing", result:"Not applicable", issues:0 },
        { page_type:"product_detail", products:"empty array", result:"Failed", issues:1 },
        { page_type:"product_detail", products:"1 item", result:"Passed", issues:0 },
        { page_type:"category", products:"empty array", result:"Not applicable", issues:0 },
        { page_type:"category", products:"missing", result:"Not applicable", issues:0 },
      ], "Conditional rule production evaluation did not match its built browser examples");
      assert.deepEqual(conditionalValidationRulesObservation.groups.map(({ result, invocationCount }) => ({ result, invocationCount })), [
        { result:"Passed", invocationCount:1 },
        { result:"Not applicable", invocationCount:0 },
        { result:"Passed", invocationCount:1 },
        { result:"Not applicable", invocationCount:0 },
      ], "Conditional All/Any gating invoked the consequence incorrectly");
      assert.deepEqual(conditionalValidationRulesObservation.editor, {
        applyOnlyWhen:"Apply only when",
        property:"/page_type",
        operators:["Exists", "Does not exist", "Equals", "Does not equal", "Is one of", "Starts with", "Contains", "Matches pattern"],
        operator:"Equals",
        initializedValue:"product_detail",
        schemaProperties:["/page_type", "/currency", "/oOrder", "/oOrder/aProducts/*"],
        preview:"Current event preview: Failed",
        oneConsequence:1,
      }, "Conditional rule editor lost type-aware trigger configuration");
      assert.deepEqual(conditionalValidationRulesObservation.presentation, {
        issueCount:1, expectedPath:"/oOrder/aProducts", conditionShown:true, consequenceShown:true,
        triggerNotFailing:true, notApplicableHiddenByDefault:true, notApplicableShown:true, notApplicableIssues:0,
      }, "Conditional Live inspector presentation lost failure or not-applicable evidence");
      assert.deepEqual(conditionalValidationRulesObservation.lifecycle, {
        attachmentIds:[conditionalValidationRulesObservation.stored.rule.id, "rule:reusable-products"],
        ruleIds:["rule:reusable-products"], atomic:true,
        typedValue:{ type:"string", value:"product_detail" }, pinnedVersion:1, revisedVersion:2, revisedPreserved:true,
      }, "Conditional rule persistence did not preserve atomic definitions and pinned versions");
      assert.deepEqual(conditionalValidationRulesObservation.correlated.cases, [
        { priceMonthlyState:"number 29", durationState:"number 12", result:"Passed", issues:0 },
        { priceMonthlyState:"null", durationState:"missing", result:"Failed", issues:1 },
        { priceMonthlyState:"missing", durationState:"missing", result:"Not applicable", issues:0 },
        { priceMonthlyState:"missing", durationState:"number 12", result:"Not applicable", issues:0 },
      ], "Correlated wildcard examples did not bind trigger and consequence to the same item");
      assert.deepEqual(conditionalValidationRulesObservation.correlated.mixed, [["/products/0/duration","error"],["/products/1/duration","not-applicable"],["/products/2/duration","not-applicable"],["/products/3/duration","pass"]]);
      assert.deepEqual(conditionalValidationRulesObservation.correlated.issues.map(({ instancePath, templatePath }) => [instancePath, templatePath]), [["/products/0/duration","/products/*/duration"]]);
      assert.equal(conditionalValidationRulesObservation.correlated.issues[0].conditionSummary, "For each products item, when price_monthly exists, duration must be present");
      assert.deepEqual(conditionalValidationRulesObservation.correlated.persisted, { predicate:"/products/*/price_monthly", consequence:"/products/*/duration", issue:"/products/0/duration" });
      assert.equal(conditionalValidationRulesObservation.correlated.rendered.some(([path,text]) => path === "/products/1/duration" && text.includes("not applicable")), true);
      assert.equal(conditionalValidationRulesObservation.correlated.rendered.some(([path,text]) => path === "/products/3/duration" && text.includes("passed")), true);
      await evaluate(socket, guidedTransportProjectRestoreRuntime(conditionalRulesProject));
      socket.close(); continue;
    }
    if (width === 720 && activeBrowserTargetEnvironment.GUIDED_ASSIGNMENT_COVERAGE_BROWSER_ADAPTER === "1") {
      guidedAssignmentCoverageObservation = await evaluate(socket, guidedAssignmentCoverageRuntime);
      assert.deepEqual(guidedAssignmentCoverageObservation, {
        event:{ name:"order_complete", sourceId:"event-history", pageUrl:"https://shop.example/orders/confirmed" },
        schemaName:"Order completed",
        first:{
          firstConfigurationDisplayed:true,
          laterVisibility:[
            { configuration:false, selection:false, stages:["Define requirement", "Review validation"] },
            { configuration:false, selection:false, stages:["Define requirement", "Review validation"] },
          ],
          assignmentCount:1,
          assignment:{ id:"assignment:schema:order-completed:1:confirmed-orders", name:"confirmed orders", schemaId:"schema:order-completed:1", sourceId:"event-history", eventName:"order_complete", target:"payload", domainCondition:"shop.example", pathnameCondition:"/orders/confirmed", priority:100, versionPolicy:"pinned", enabled:true },
          assignmentUnchanged:true,
          rulePaths:["order_id", "currency", "value"],
        },
        published:{ configuration:false, selection:false, action:"reuse the covering assignment", assignmentCount:1, assignment:{ id:"assignment:shop-orders", name:"shop order pages", sourceId:"event-history", eventName:"order_complete", target:"payload", domainCondition:"*.example", pathnameCondition:"/orders/*", priority:240, versionPolicy:"follow latest", enabled:true }, identityUnchanged:true, rulePaths:["order_id"] },
        incompatible:{
          before:{ configuration:true, selection:false, assignmentCount:1, defaults:{ source:"event-history", event:"order_complete", target:"payload", domain:"shop.example", pathname:"/orders/confirmed" } },
          afterConfirm:{ count:2, names:["product pages", "confirmed orders"] },
          laterVisibility:{ configuration:false, selection:false },
          finalCount:2,
          laterAction:"reuse the covering pending assignment",
          assignments:[
            { id:"assignment:products", name:"product pages", sourceId:"event-history", eventName:"order_complete", target:"payload", domainCondition:"shop.example", pathnameCondition:"/products/*", priority:90, versionPolicy:"pinned", enabled:true },
            { id:"assignment:schema-order-incompatible:confirmed-orders", name:"confirmed orders", schemaId:"schema-order-incompatible", sourceId:"event-history", eventName:"order_complete", target:"payload", domainCondition:"shop.example", pathnameCondition:"/orders/confirmed", priority:100, versionPolicy:"pinned", enabled:true },
          ],
          rulePaths:["order_id", "currency"],
        },
        multiple:{ configuration:false, selection:false, stages:["Choose schema destination", "Define requirement", "Review validation"], action:"reuse existing schema coverage", beforeCount:2, afterCount:2, identities:["assignment:shop-orders", "assignment:secondary-orders"], rulePaths:["currency"] },
      }, "Guided assignment coverage did not preserve or reuse production assignments");
      socket.close();
      continue;
    }
    if (width === 720 &&
        (activeBrowserTargetEnvironment.GUIDED_VALIDATION_BROWSER_ADAPTER === "1" ||
         activeBrowserTargetEnvironment.SCHEMA_REVISION_LIFECYCLE_BROWSER_ADAPTER === "1" ||
         !requestedBrowserAdapter)) {
      const previousGuidedStorage = await evaluate(socket, `(() => {
        const previous = Object.fromEntries(Array.from({ length:localStorage.length }, (_, index) => localStorage.key(index)).filter(Boolean).map((key) => [key, localStorage.getItem(key)]));
        const schemas = [
          { id:"schema:existing-pageview:1", name:"Existing pageview", version:1, document:{ type:"object" }, assignments:[{ sourceId:"event-history", eventName:"other", target:"payload", enabled:true }] },
          { id:"schema:product-listing:3", name:"Product listing", version:3, document:{ type:"object", properties:{ page_type:{ type:"string" } } }, assignments:[{ id:"assignment:product-listing", sourceId:"event-history", eventName:"pageview", target:"payload", domainCondition:"other.example", enabled:true }] },
          { id:"schema:numeric-page-types:1", name:"Numeric page types", version:1, document:{ type:"object", properties:{ page_type:{ type:"number" } } }, assignments:[{ sourceId:"event-history", eventName:"other", target:"payload", enabled:true }] },
          { id:"schema:raw-pageview:1", name:"Raw pageview", version:1, document:{ type:"object" }, assignments:[{ sourceId:"event-history", eventName:"other", target:"raw input", enabled:true }] },
        ];
        localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify(schemas));
        localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", "[]");
        return previous;
      })()`);
      const previousGuidedSchemas = await evaluate(socket, installGuidedSavedSchemasRuntime(`JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1") ?? "[]")`));
      const previousGuidedActiveProjectId = await evaluate(socket, guidedTransportProjectSetupRuntime);
      await reloadPanel(socket);
      const guidedDestinationOptionsObservation = await evaluate(socket, guidedDestinationOptionsRuntime);
      await evaluate(socket, `(() => {
        localStorage.clear();
        for (const [key, value] of Object.entries(${JSON.stringify(previousGuidedStorage)})) localStorage.setItem(key, value);
        const schemas = [
          { id:"schema:existing-pageview:1", name:"Existing pageview", version:1, document:{ type:"object" }, assignments:[{ sourceId:"event-history", eventName:"other", target:"payload", enabled:true }] },
          { id:"schema:generic-pageview:1", name:"Generic pageview", version:1, document:{ type:"object" }, assignments:[{ sourceId:"event-history", eventName:"other", target:"payload", enabled:true }] },
          { id:"schema:generic-pageview:4", name:"Generic pageview", version:4, document:{ type:"object", properties:{ page_type:{ type:"string" } } }, assignments:[{ id:"assignment:generic-local", name:"Generic local pages", sourceId:"event-history", eventName:"pageview", target:"payload", domainCondition:"127.0.0.1", pathnameCondition:"/", enabled:true }] },
          { id:"schema:product-listing:3", name:"Product listing", version:3, document:{ type:"object", properties:{ page_type:{ type:"string" } } }, assignments:[{ id:"assignment:product-listing", sourceId:"event-history", eventName:"pageview", target:"payload", domainCondition:"other.example", enabled:true }] },
          { id:"schema:numeric-page-types:1", name:"Numeric page types", version:1, document:{ type:"object", properties:{ page_type:{ type:"number" } } }, assignments:[{ sourceId:"event-history", eventName:"other", target:"payload", enabled:true }] },
          { id:"schema:raw-pageview:1", name:"Raw pageview", version:1, document:{ type:"object" }, assignments:[{ sourceId:"event-history", eventName:"other", target:"raw input", enabled:true }] },
        ];
        localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify(schemas));
        localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", "[]");
        return true;
      })()`);
      await evaluate(socket, installGuidedSavedSchemasRuntime(`JSON.parse(localStorage.getItem("my-chrome-utilities.schema-library.v1") ?? "[]")`));
      await reloadPanel(socket);
      assert.equal(await evaluate(socket, `(async () => {
        const repository = await (await import("./data-layer-durable-project-repository.js")).openIndexedDbProjectRepository();
        return (await repository.savedSchemas()).some(({ id }) => id === "schema:signal-shop-pageview:1");
      })()`), false, "Guided validation fixture retained a schema created by an earlier browser observation");
      guidedValidationObservation = await evaluate(socket, guidedValidationRuntime);
      guidedValidationObservation.existingOptions = guidedDestinationOptionsObservation;
      const { production, ...renderedGuidedValidation } = guidedValidationObservation;
      assert.deepEqual(renderedGuidedValidation, {
        initial:{
          visible:true,
          heading:"Choose schema destination",
          focused:true,
          stages:[["Choose schema destination","current"],["Define requirement","upcoming"],["Choose event scope","upcoming"],["Review validation","upcoming"]],
          advancedPrimary:true,
          persistedUnchanged:true,
        },
        invalid:{ focused:false, link:"Property selection skipped" },
        requirement:{ heading:"Define requirement", focused:true, detected:"String — detected from this event", incompatible:false, oldControls:false },
        values:{ labels:["Allowed value 1","Allowed value 2"], assistance:"2 allowed values", focusRetained:true, statusRole:"status", removeActions:2 },
        scope:{ heading:"Choose event scope", selected:"This domain on all paths", choices:["This domain on all paths", "Only the current path", "Selected paths or patterns", "Every domain and path"], prefill:"Domain 127.0.0.1; event pageview; source event-history; target payload." },
        pathBuilder:{ explanation:"This assignment matches when any condition matches.", conditionLabel:"Path condition 1", matchType:"Exact path", expression:"/", result:"/ is a match", remove:"Remove condition", testButton:"Test another path" },
        anotherPath:"/products/field-notebook is a match",
        multipleInvalid:{ focused:true, links:[["Path condition 1: correct the regular expression: Invalid regular expression: /[/: Unterminated character class","#guided-path-expression-0"],["Path condition 2: correct the regular expression: Invalid regular expression: /(/: Unterminated group","#guided-path-expression-1"]], inline:["Path condition 1: correct the regular expression: Invalid regular expression: /[/: Unterminated character class","Path condition 2: correct the regular expression: Invalid regular expression: /(/: Unterminated group"], described:["guided-path-expression-0-hint guided-path-expression-0-error","guided-path-expression-1-hint guided-path-expression-1-error"] },
        destinationInitial:{ heading:"Choose schema destination", choices:["Create a new schema","Add to an existing schema"], selected:null, persistedUnchanged:true },
        blankNameAssistance:"Enter a name for the new schema",
        duplicateNameAssistance:"Choose the existing schema or enter another name",
        newNameAssistance:"New schema Signal Shop pageview will be created",
        reviewBeforeBack:"pageview on 127.0.0.1 requires /page_type to be product_list or homepage. /page_type matches expected String. Rule attachment path: /page_type. New schema draft Signal Shop pageview will be created and remain unavailable until publication.",
        reviewStages:[["Choose schema destination","complete"],["Define requirement","complete"],["Choose event scope","complete"],["Review validation","current"]],
        retainedDestination:{ kind:"new", name:"Signal Shop pageview" },
        retainedScope:"domain-all-paths",
        advanced:{ rule:"pageview requirement", source:"event-history", target:"payload", defaults:"Severity Error; version policy Pinned." },
        saveFailure:{ flowVisible:true, review:"pageview on 127.0.0.1 requires /page_type to be product_list or homepage. /page_type matches expected String. Rule attachment path: /page_type. New schema draft Signal Shop pageview will be created and remain unavailable until publication.", schemasUnchanged:true, rulesUnchanged:true, recovery:{ open:true, named:true, durableTruth:true, retryEnabled:true, exportEnabled:true }, retryCommitted:true },
        saved:{ schemas:1, reusableRules:1, published:false, pendingChanges:["Add /page_type validation"], localRules:1, assignment:{ id:"assignment:schema:signal-shop-pageview:1:pageview-on-127-0-0-1", name:"pageview on 127.0.0.1", sourceId:"event-history", eventName:"pageview", target:"payload", priority:100, versionPolicy:"pinned", enabled:true, domainCondition:"127.0.0.1" }, flowClosed:true, inspectorRestored:true, status:"Draft Signal Shop pageview was created.", focusReturned:true, nextActions:["Review draft", "Publish revision", "Use a different schema"], attachedRule:{ id:"rule:pageview-requirement", name:"pageview requirement", version:1, propertyPath:"/page_type", operator:"allowed-values", allowedValues:["product_list","homepage"], severity:"error", enabled:true }, validation:{ state:"Valid", issues:0, evaluations:[{ propertyPath:"/page_type", status:"pass", expected:"product_list,homepage", actual:"product_list" }] }, legacy:{ allowedValues:["product_list","homepage"], state:"Valid", issues:0, evaluations:[{ propertyPath:"/page_type", status:"pass", expected:"product_list,homepage", actual:"product_list" }], exportedAllowedValues:["product_list","homepage"] } },
        published:{ label:"Publish this rule for Rule Library reuse", reusableRules:1, attachedRuleId:"rule:pageview-requirement", reusableRuleId:"rule:pageview-requirement", unpublishedChoiceAbsent:true, assignableAfterPublication:true, currentRevision:1, historicalRevisions:0, attachedRule:{ id:"rule:pageview-requirement", name:"pageview requirement", version:1, propertyPath:"/page_type", operator:"allowed-values", allowedValues:["product_list","homepage"], severity:"error", enabled:true }, reusableRule:{ id:"rule:pageview-requirement", name:"pageview requirement", kind:"allowed-values", version:1, enabled:true, operator:"allowed-values", allowedValues:["product_list","homepage"], severity:"error", attachments:["schema:signal-shop-pageview:1"] } },
        existingOptions:[
          { label:"Existing pageview version 1", disabled:false, explanation:"page_type will be added" },
          { label:"Numeric page types version 1", disabled:true, explanation:"page_type expects Number" },
          { label:"Product listing version 3", disabled:false, explanation:"page_type accepts String rules" },
          { label:"Raw pageview version 1", disabled:true, explanation:"schema validates raw input, not payload" },
        ],
        existingReview:"pageview on 127.0.0.1 requires /page_type to be product_list or homepage. /page_type matches expected String. Rule attachment path: /page_type. The rule will be added to the Product listing working draft based on version 3. Product listing version 3 remains current until the working draft is published. Assignment action: add the reviewed assignment as a pending change.",
        existingSaved:{ versions:[3], currentRules:0, draftRules:1, pendingChanges:["Add /page_type validation"], assignments:2, flowClosed:true, inspectorRestored:true, status:"Validation was added to Product listing draft.", focusReturned:true },
        schemaPrefillRequirement:{ expectedType:"String", expectedTypeSource:"String — Generic pageview version 4", target:"payload" },
        schemaPrefillScope:{ configurationAbsent:true, selectionAbsent:true },
        replacementReview:{ items:["domain: operator.example would be replaced by 127.0.0.1"], actions:["Keep current values", "Accept schema-derived values"] },
        keptStatus:"Current values kept.",
        acceptedStatus:"Schema-derived values accepted.",
      }, "Guided validation browser flow violated its rendered production contract");
      assert.deepEqual(production, {
        requirements:{
          String:["Must be present", "Must be one of these values", "Must match a pattern", "Must have this length"],
          Number:["Must be present", "Must be one of these values", "Must be within a range"],
          Array:["Must be present", "Must contain this many items"],
          Object:["Must be present", "Allow only these properties"],
          Boolean:["Must be present", "Must equal this value"],
        },
        allowedValues:[
          { valid:false, assistance:"Add at least one allowed value" },
          { valid:false, assistance:"Remove or change the duplicate homepage" },
          { valid:false, assistance:"Enter a value or remove the blank item" },
          { valid:true, assistance:"2 allowed values" },
        ],
        paths:[
          { valid:true, matches:true },
          { valid:true, matches:false },
          { valid:true, matches:true },
          { valid:true, matches:true },
          { valid:true, matches:false },
          { valid:true, matches:true },
          { valid:true, matches:false },
        ],
        combined:{ valid:true, matches:true, matchingCondition:{ matchType:"Path pattern", expression:"/products/*" } },
        malformed:{ valid:false, matches:false, error:production.malformed.error },
        override:{ typeSource:"explicit override", currentEventPasses:false, message:"page_type was observed as String but Number is expected.", correctionRequired:true },
        destinationOptions:[
          { name:"Existing pageview", target:"payload", propertyState:"absent", available:true, explanation:"page_type will be added" },
          { name:"Product listing", target:"payload", propertyState:"String", available:true, explanation:"page_type accepts String rules" },
          { name:"Numeric page types", target:"payload", propertyState:"Number", available:false, explanation:"page_type expects Number" },
          { name:"Raw pageview", target:"raw input", propertyState:"absent", available:false, explanation:"schema validates raw input, not payload" },
        ],
        assignmentResolutions:[
          { count:0, selection:"Create a new assignment", domain:"127.0.0.1", pathConditions:[] },
          { count:1, selection:"the compatible assignment", domain:"127.0.0.1", pathConditions:[{ matchType:"Exact path", expression:"/" }] },
          { count:2, selection:"required from readable assignment choices", domain:"127.0.0.1", pathConditions:[] },
        ],
        assignmentCoverage:[
          { state:"no assignments", configuration:"displayed", action:"add a reviewed pending assignment", continuation:"allowed after assignment review" },
          { state:"one enabled assignment covers source, event, target, and URL", configuration:"not displayed", action:"reuse the covering assignment", continuation:"allowed without assignment review" },
          { state:"two enabled assignments cover the captured event", configuration:"not displayed", action:"reuse existing schema coverage", continuation:"allowed without assignment selection" },
          { state:"source, event, and target match but URL conditions do not", configuration:"displayed", action:"add a reviewed pending assignment", continuation:"allowed after assignment review" },
          { state:"only a disabled assignment covers the captured event", configuration:"displayed", action:"add a reviewed pending assignment", continuation:"allowed after assignment review" },
        ],
        destinations:{
          matching:{ review:"pageview on 127.0.0.1 requires page_type to be product_list or homepage. page_type matches expected String. Rule attachment path: page_type. The rule will be added to the Product listing working draft based on version 3. Product listing version 3 remains current until the working draft is published. Assignment action: reuse the covering assignment.", assignmentAction:"reuse the covering assignment" },
          pending:{ review:"pageview on 127.0.0.1 requires page_type to be product_list or homepage. page_type matches expected String. Rule attachment path: page_type. The rule will be added to the Product listing working draft based on version 3. Product listing version 3 remains current until the working draft is published. Assignment action: reuse the covering pending assignment.", assignmentAction:"reuse the covering pending assignment" },
          absent:{ review:"pageview on 127.0.0.1 requires page_type to be product_list or homepage. page_type matches expected String. Rule attachment path: page_type. The rule will be added to the Product listing working draft based on version 3. Product listing version 3 remains current until the working draft is published. Assignment action: add the reviewed assignment as a pending change.", assignmentAction:"add the reviewed assignment as a pending change" },
        },
      }, "Guided validation production matchers violated their browser-loaded contract");
      await evaluate(socket, guidedTransportProjectRestoreRuntime(previousGuidedActiveProjectId));
      await evaluate(socket, installGuidedSavedSchemasRuntime(JSON.stringify(previousGuidedSchemas)));
      await evaluate(socket, `(() => { localStorage.clear(); for (const [key, value] of Object.entries(${JSON.stringify(previousGuidedStorage)})) localStorage.setItem(key, value); return true; })()`);
      await reloadPanel(socket);
      if (activeBrowserTargetEnvironment.GUIDED_VALIDATION_BROWSER_ADAPTER === "1") {
        socket.close(); continue;
      }
    }
      if (activeBrowserTargetEnvironment.LIVE_VALIDATION_VISUALS_BROWSER_ADAPTER === "1" ||
          !requestedBrowserAdapter) {
      liveValidationVisualsObservation = await evaluate(socket, liveValidationVisualsRuntime);
      assert.deepEqual(Object.fromEntries(Object.entries(liveValidationVisualsObservation.rows).map(([id, row]) => [id, [row.text, row.symbol, row.treatment, row.name.includes(row.text.replace(/^·\s*/, "")), row.border !== "rgb(217, 222, 229)"]])), {
        valid:["· Valid","check","pass",true,true], warning:["· 2 warnings","warning","warning",true,true], error:["· 2 errors and 1 warning","error","error",true,true], neutral:["· Not checked","neutral","neutral",true,true], assignment:["· Assignment error","error","assignment-error",true,true],
      }, "Live validation feed badges did not expose text, symbols, treatments, and accessible state");
      assert.equal(liveValidationVisualsObservation.inspector.summary, "Validation failed, 2 errors, and 1 warning", "Live inspector omitted error and warning counts");
      assert.equal(liveValidationVisualsObservation.inspector.schema, "Checkout schema version 4", "Live inspector omitted exact schema version");
      assert.equal(liveValidationVisualsObservation.inspector.rawJson, "Raw JSON", "Live inspector omitted Raw JSON disclosure");
      assert.ok(["Show validation issues","Revalidate"].every((label) => liveValidationVisualsObservation.inspector.actions.includes(label)), "Live inspector omitted validation actions");
      assert.equal(liveValidationVisualsObservation.inspector.changeSchema, "Change schema", "Live inspector omitted Change schema");
      assert.ok(liveValidationVisualsObservation.inspector.presentation.indexOf("live-event-validation-issues") < liveValidationVisualsObservation.inspector.presentation.indexOf("Properties"), "Event-level issues were not displayed above Properties");
      assert.deepEqual({
        pagePath:liveValidationVisualsObservation.properties.page_path,
        currency:liveValidationVisualsObservation.properties.currency,
        pageTitle:liveValidationVisualsObservation.properties.page_title,
        pageType:liveValidationVisualsObservation.properties.page_type,
        commerce:liveValidationVisualsObservation.properties.commerce,
        sibling:liveValidationVisualsObservation.properties.sibling,
        missing:liveValidationVisualsObservation.properties.order_id,
        escaped:liveValidationVisualsObservation.escaped,
        disclosures:liveValidationVisualsObservation.disclosures,
        unchanged:liveValidationVisualsObservation.unchanged,
        revalidation:liveValidationVisualsObservation.revalidation,
      }, {
        pagePath:{ status:"○ No rules", treatment:"neutral", evaluations:0, aggregate:null, missing:null },
        currency:{ status:"✓ 2 rules passed", treatment:"pass", evaluations:2, aggregate:null, missing:null },
        pageTitle:{ status:"⚠ 1 warning", treatment:"warning", evaluations:2, aggregate:null, missing:null },
        pageType:{ status:"! 1 error and 1 warning", treatment:"error", evaluations:3, aggregate:null, missing:null },
        commerce:{ status:"○ No rules", treatment:"neutral", evaluations:0, aggregate:"1 error and 2 warnings", missing:null },
        sibling:{ status:"○ No rules", treatment:"neutral", evaluations:0, aggregate:null, missing:null },
        missing:{ status:"! 1 error", treatment:"error", evaluations:1, aggregate:null, missing:"Missing" },
        escaped:true, disclosures:{ enter:"true", space:"true", click:"true" }, unchanged:true,
        revalidation:{ inspector:"Validation passed", feed:"· Valid", status:"Validation changed to Valid.", live:"polite", scroll:37, focused:true },
      }, "Live validation property hierarchy, interaction, or revalidation contract failed");
      }
    if (!requestedBrowserAdapter) {
    assert.deepEqual(await evaluate(socket, openLibraryRuntime), {
      selected:"true",
      panelHidden:false,
    }, `Library tab did not open through its ${width}px rendered control`);
    assert.deepEqual(await evaluate(socket, naturalLibraryActionsRuntime), {
      editorHidden:true,
      editorDisplay:"none",
      editorOffsetParent:true,
      actions:[
        { id:"add-new-event", visible:true, disabled:false },
        { id:"import-event-library", visible:true, disabled:false },
        { id:"export-event-library", visible:true, disabled:true },
        { id:"clear-event-library", visible:true, disabled:true },
      ],
      saveLatestPresent:false,
    }, `natural Library action surface violated its ${width}px browser contract`);
    assert.deepEqual(await evaluate(socket, libraryActionsRecoveryRuntime), {
      purchase:{
        initial:{
          editor:true,
          fields:[
            { selector:"#event-template-name", value:"", visible:true },
            { selector:"#event-template-event-name", value:"", visible:true },
            { selector:"#event-template-source", value:"", visible:true },
            { selector:"#push-destination-path", value:"", visible:true },
            { selector:"#event-template-json", value:"{}", visible:true },
          ],
          saveDisabled:true,
          focused:true,
        },
        saveEnabled:true,
      },
      closeResult:{ hidden:true, display:"none", offsetParent:true, editFocused:true },
      inlineIdentity:{ noRename:false, editor:true, fields:[false, false], values:["Purchase confirmation", "purchase"], disclosuresClosed:true },
      pushReview:{
        hidden:false, display:"block", positiveGeometry:true, hiddenAncestor:false, focused:true,
        details:[["Event","checkout_completed"],["Target title","Signal Shop"],["Target URL","https://signal.example.test/checkout"],["Destination","queue.history"],["Version","1"],["Validation","Not checked"],["Template name","Purchase confirmation → Completed checkout"],["Event name","purchase → checkout_completed"],["Destination","event.history → queue.history"]],
        changes:[[["Path","ecommerce.value"],["Previous","18"],["Pushed","19"]],[["Path","items[0].quantity"],["Previous","1"],["Pushed","2"]],[["Path","legacy.debug"],["Previous","true"],["Pushed","Not present"]],[["Path","experiment.variant"],["Previous","Not present"],["Pushed","treatment-b"]]],
        confirm:"Push checkout_completed to the active target",
      },
      pushCancelled:{ focused:true, result:"" },
      revisionReview:{
        hidden:false, display:"block", positiveGeometry:true, hiddenAncestor:false, focused:true,
        details:[["Operation","Save revision"],["Current version","1"],["Resulting version","2"],["Validation","Not checked"],["Template name","Purchase confirmation → Completed checkout"],["Event name","purchase → checkout_completed"],["Destination","event.history → queue.history"]],
        changes:[[["Path","ecommerce.value"],["Previous","18"],["Revised","19"],["Change","changed"]],[["Path","items[0].quantity"],["Previous","1"],["Revised","2"],["Change","changed"]],[["Path","legacy.debug"],["Previous","true"],["Revised","Not present"],["Change","removed"]],[["Path","experiment.variant"],["Previous","Not present"],["Revised","treatment-b"],["Change","added"]]],
        confirm:"Save revision 2",
      },
      revisionCancel:{ hidden:true, draft:["Completed checkout", "checkout_completed", "queue.history"], focused:true },
      revisionSaved:{ identity:"Completed checkout · checkout_completed", result:"Saved version 2; identity, execution, and payload changes applied." },
      scroll:{
        initial:{
          editor:true,
          fields:[
            { selector:"#event-template-name", value:"", visible:true },
            { selector:"#event-template-event-name", value:"", visible:true },
            { selector:"#event-template-source", value:"", visible:true },
            { selector:"#push-destination-path", value:"", visible:true },
            { selector:"#event-template-json", value:"{}", visible:true },
          ],
          saveDisabled:true,
          focused:true,
        },
        saveEnabled:true,
      },
      exportResult:{
        templateNames:["Completed checkout", "Scroll milestone"],
        revisions:[1, 2],
        payloads:[{ ecommerce:{ value:19 }, items:[{ quantity:2 }], experiment:{ variant:"treatment-b" } }, { scroll_percentage:25 }],
        settings:["queue.history", "event.history"],
      },
      clearReview:{ hidden:false, display:"block", positiveGeometry:true, hiddenAncestor:false, focused:true, summary:"All 2 templates and their saved revisions will be removed." },
      cleared:{ count:0, addAvailable:true, importAvailable:true },
      importReview:{ hidden:false, display:"block", positiveGeometry:true, hiddenAncestor:false, focused:true, replaceVisible:true, appendVisible:true },
      replaceArmed:"Confirm replace 0 with 2",
      restored:{ names:["Completed checkout", "Scroll milestone"], persisted:["Completed checkout", "Scroll milestone"] },
      deleteReview:{ hidden:false, display:"block", positiveGeometry:true, hiddenAncestor:false, focused:true, summary:"Completed checkout; event checkout_completed; 2 saved versions will be deleted. Captured events, saved sessions, and execution records remain unchanged." },
      afterDelete:["Scroll milestone · scroll"],
      final:{ count:0, persisted:0, addAvailable:true, importAvailable:true },
    }, `natural Library actions failed their ${width}px browser recovery contract`);
    await evaluate(socket, fixture);
    const measured = await evaluate(socket, measurements);
    assert.ok(measured.document.scrollWidth <= measured.document.clientWidth, `document overflowed at ${width}px`);
    assert.deepEqual(measured.visibleText.filter(({ clipped }) => clipped), [], `component text was clipped at ${width}px`);
    assert.deepEqual(measured.controls.filter(({ width: controlWidth, available, right, parentRight, parentDisplay }) => right > parentRight + 1 || (!["grid", "inline-grid"].includes(parentDisplay) && controlWidth + 1 < available)), [], `form control width contract failed at ${width}px`);
    const internallyBoundedSelectors = new Set(["#live-event-list", "#event-template-list", "#saved-session-list", "#layout-code-fixture"]);
    assert.deepEqual(measured.overflow.filter(({ selector }) => internallyBoundedSelectors.has(selector)).filter(({ scrollHeight, clientHeight, overflowY }) => scrollHeight <= clientHeight || !/auto|scroll/.test(overflowY)), [], `bounded overflow contract failed at ${width}px`);
    const schemaTreeOverflow = measured.overflow.find(({ selector }) => selector === "#schema-list");
    assert.deepEqual({ delegated:schemaTreeOverflow.scrollHeight === schemaTreeOverflow.clientHeight, maxHeight:schemaTreeOverflow.maxHeight }, { delegated:true, maxHeight:"none" }, `Schema relationship-tree scrolling was not delegated to the workspace at ${width}px`);
    assert.deepEqual(await evaluate(socket, pushDecisionRuntime), {
      detailPairs:[["Event","purchase"],["Target title","Signal Shop"],["Target URL","https://signal.example.test/checkout"],["Destination","queue.history"],["Version","3"],["Validation","Valid"]],
      changePairs:[[["Path","ecommerce.value"],["Previous","18"],["Pushed","19"]],[["Path","items[0].quantity"],["Previous","1"],["Pushed","2"]],[["Path","legacy.debug"],["Previous","true"],["Pushed","Not present"]],[["Path","experiment.variant"],["Previous","Not present"],["Pushed","treatment-b"]]],
      columns:width === 360 ? 1 : 2,
      readable:true,
      documentFits:true,
      emptyResult:{ text:"No payload changes", visible:true, changeCount:0 },
    }, `rendered push decision data violated its ${width}px browser contract`);
    assert.deepEqual(await evaluate(socket, templateChangeReviewRuntime), {
      renameAction:false,
      renameDialog:false,
      editable:[false, false],
      review:{ label:"Revised", version:4, identity:[["Template name", "Purchase confirmation", "Completed checkout"], ["Event name", "purchase", "checkout_completed"]], noPayload:true },
    }, `inline template change review violated its ${width}px browser contract`);
    assert.deepEqual(await evaluate(socket, jsonValidationRecoveryRuntime), {
      invalid:{ error:true, status:"Invalid JSON at position 58.", invalid:"true", saveDisabled:true, pushDisabled:true, saveReason:"Correct the JSON draft.", pushReason:"Correct the JSON draft.", draft:{ tealium_generated:"1", scroll_percentage:0 } },
      recovered:{ error:false, status:"Properties, JSON, and Validation edit the same draft.", invalid:"false", saveDisabled:false, pushDisabled:false, draft:{ tealium_generated:"1", scroll_percentage:25 } },
      transitions:[true,true,true,true,true,true],
      saved:{ version:4, payload:{ tealium_generated:"1", scroll_percentage:25 } },
      review:{ event:"scroll", draft:{ tealium_generated:"1", scroll_percentage:25 }, changes:[["scroll_percentage","0","25"]] },
    }, `Library JSON validation recovery violated its ${width}px browser contract`);
    assert.deepEqual(await evaluate(socket, libraryNewEventRuntime), {
      initial:{ title:"New event", count:"0 templates", addHidden:true, name:"", event:"", source:"", destination:"", json:"{}", saveDisabled:true },
      created:{ id:"template:library:new", name:"Scroll milestone", eventName:"scroll", sourceId:"event-history", sourceName:"Event history", destination:"event.history", tags:[], validation:"Not checked", payload:{ scroll_percentage:25 }, version:1, provenance:"library-created" },
    }, `Library new event creation violated its ${width}px browser contract`);
    assert.deepEqual(await evaluate(socket, eventLibraryDeletionRuntime), {
      afterDelete:["template-9"], afterClear:0,
    }, `Library deletion violated its ${width}px browser contract`);
    if (width === 360) {
      assert.deepEqual(await evaluate(socket, hiddenStateRuntime), {
        display: "none", offsetParent: true, zeroSpace: true, focusExcluded: true, ariaHidden: true,
      }, "hidden components violated the authoritative browser contract");
      assert.deepEqual([measured.live.header, measured.live.master, measured.live.detail].filter((component) => !withinColumn(component, measured.root)), [], "compact components escaped their content column");
      assert.ok(measured.actionChildren.every(({ rect, parent }) => rect.x >= parent.x - 1 && rect.right <= parent.right + 1), "an action button escaped its wrapping action group");
      assert.deepEqual(await evaluate(socket, inspectorReturnRuntime), {
        scrollTop: 480,
        focusedEventId: "purchase",
      }, "inspector return did not restore browser scroll and focus");
      assert.deepEqual(await evaluate(socket, inspectorNavigationRuntime), {
        listInLayout: false,
        inspectorInLayout: true,
        backInLayout: true,
        backHasHiddenAncestor: false,
        backInsideList: false,
        backIsFirstHeaderControl: true,
        validationDetail:"Validation details/commerce/order/id · Required value · expected string, received missing · rule schema · severity error · Order confirmation v2 · #/properties/commerce · assignment id assignment:checkout · name Checkout confirmation · source event-history · event page_view · target payload · priority 100 · domain shop.example · pathname /order-confirmation · policy follow latest · enabled",
      }, "stacked inspector navigation layout violated its browser contract");
      assert.deepEqual(await evaluate(socket, pathnameHeaderRuntime), {
        headers: [
          { text:"/productsLatest 10:04:00Events 1", name:"/products, Latest 10:04:00, Events 1", associated:true },
          { text:"/checkoutLatest 10:03:00Events 2", name:"/checkout, Latest 10:03:00, Events 2", associated:true },
          { text:"/productsLatest 10:01:00Events 2", name:"/products, Latest 10:01:00, Events 2", associated:true },
        ],
        rows:[
          "pageview · 10:04:00 · event-history · Not checked",
          "pageview · 10:03:00 · event-history · Not checked · Page Type detail, Page Category product",
          "pageview · 10:02:00 · event-history · Not checked · Page Name Checkout, Page Type form",
          "pageview · 10:01:00 · event-history · Not checked · Page Name Products, Page Type detail",
          "pageview · 10:00:00 · event-history · Not checked · Page Name Products, Page Type listing",
        ],
        longResult:{ bounded:true, unclipped:true, pathnameCount:1, documentFits:true },
      }, "rendered pathname headers omitted required visit metadata");
      assert.deepEqual(await evaluate(socket, workflowFocusRuntime), {
        tabResult: { workspaceRight:true, workspaceLeft:true, dataLayerEnd:true, dataLayerHome:true, singleDataLayerTabStop:true },
        editorResult: { title:"Purchase confirmation editor", headingFocused:true, disclosuresClosed:true, returnedToTemplate:"template:purchase" },
        pushResult: { headingFocused:true, modal:true, forwardWrapped:true, backwardWrapped:true, backgroundExcluded:true, returnedToTrigger:true },
        targetResult: { inert:true, searchFocused:true, backwardWrapped:true, returnedToChoose:true },
      }, "workflow focus callbacks violated their browser contract");
    }
    if (width === 720) {
      for (const [name, pane, masterRange, detailRange] of [["live", measured.live, [280, 320], [344, 400]], ["library", measured.library, [240, 288], [384, 448]], ["sessions", measured.sessions, [240, 300], [360, 432]], ["schemas", measured.schemas, [240, 300], [360, 432]]]) {
        assert.match(pane.areas, new RegExp(`${name}-master`), `${name} grid has no named master area`);
        assert.match(pane.areas, new RegExp(`${name}-detail`), `${name} grid has no named detail area`);
        assert.ok(pane.master.width >= masterRange[0] && pane.master.width <= masterRange[1], `${name} master width ${pane.master.width} is outside its contract`);
        assert.ok(pane.detail.width >= detailRange[0] && pane.detail.width <= detailRange[1], `${name} detail width ${pane.detail.width} is outside its contract`);
        assert.ok(!overlaps(pane.master, pane.detail), `${name} panes overlap`);
      }
    }
    }
    if (!requestedBrowserAdapter) {
      const previousSchemaWorkspaceSchemas = await evaluate(socket, installGuidedSavedSchemasRuntime("[]"));
      const previousSchemaWorkspaceActiveProjectId = await evaluate(socket, guidedTransportProjectSetupRuntime);
      await reloadPanel(socket);
      const isolatedSchemaRuleEditorVisibility = await evaluate(socket, schemaRuleEditorVisibilityRuntime);
      assert.deepEqual(isolatedSchemaRuleEditorVisibility, {
        hiddenByView:{ Live:true, Library:true, Sessions:true, Schemas:true },
        editorVisible:true,
        configurationVisible:true,
        configurationInsideEditor:true,
      }, `Isolated Schema rule configuration visibility violated its ${width}px browser contract`);
      await reloadPanel(socket);
      try {
        await captureSchemaWorkspace(socket, width, isolatedSchemaRuleEditorVisibility);
      } finally {
        await evaluate(socket, guidedTransportProjectRestoreRuntime(previousSchemaWorkspaceActiveProjectId));
        await evaluate(socket, installGuidedSavedSchemasRuntime(JSON.stringify(previousSchemaWorkspaceSchemas)));
        await reloadPanel(socket);
      }
    }
    const guidedLifecycleProject = width === 720 && (runGuidedDraftContinuationRuntime || runSchemaRevisionLifecycleRuntime)
      ? await evaluate(socket, guidedTransportProjectSetupRuntime)
      : undefined;
    if (width === 720 && runGuidedDraftContinuationRuntime) {
      const installContinuationFixture = (selectedSchemaId) => evaluate(socket, `(() => {
        const assignment = { id:"assignment:product", name:"Product pages", schemaId:"schema-product-listing", sourceId:"event-history", eventName:"pageview", target:"payload", domainCondition:"127.0.0.1", pathConditions:[{ matchType:"Exact path", expression:"/" }], enabled:true };
        const product = { id:"schema-product-listing", name:"Product listing", version:3, published:true, document:{ type:"object", properties:{ page_type:{ type:"string" } } }, assignments:[assignment], workingDraft:{ baseVersion:3, sourceVersion:3, document:{ type:"object", properties:{ page_type:{ type:"string" }, page_name:{ type:"string" } } }, assignments:[assignment], pendingChanges:["Add page_type", "Add page_name"] } };
        const checkout = { id:"schema-checkout", name:"Checkout", version:2, published:false, document:{ type:"object", properties:{ checkout_id:{ type:"string" } } }, assignments:[], workingDraft:{ baseVersion:2, sourceVersion:2, document:{ type:"object", properties:{ checkout_id:{ type:"string" }, page_name:{ type:"string" } } }, assignments:[], pendingChanges:["Add page_name"] } };
        localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([product, checkout]));
        localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", "[]");
        localStorage.removeItem("my-chrome-utilities.guided-validation-continuations.v1");
        if (${JSON.stringify(selectedSchemaId)}) {
          const selections = { ["event-history" + String.fromCharCode(0) + "pageview"]:${JSON.stringify(selectedSchemaId)} };
          localStorage.setItem("my-chrome-utilities.guided-validation-continuations.v1", JSON.stringify(selections));
        }
        return true;
      })()`);
      await installContinuationFixture(undefined);
      await reloadPanel(socket);
      guidedDraftContinuationInitialObservation = await evaluate(socket, guidedDraftContinuationInitialRuntime);
      assert.deepEqual(guidedDraftContinuationInitialObservation, { propertyAvailable:true, genericAbsent:true, continuationAbsent:true }, "Events without a selected draft continuation lost their property creation action");
      await installContinuationFixture("schema-product-listing");
      await reloadPanel(socket);
      guidedDraftContinuationObservation = await evaluate(socket, guidedDraftContinuationRuntime);
      assert.deepEqual(guidedDraftContinuationObservation, {
        initial:{ heading:"Product listing working draft", status:"Current revision 3 · 2 pending changes", actions:["Review draft", "Publish revision", "Use a different schema"], sectionCount:1, genericAbsent:true },
        opened:{ context:"Adding to Product listing draft", stages:["Define requirement", "Review validation"] },
        requirement:{ heading:"Define requirement", destinationAbsent:true, selectedSchema:"schema-product-listing" },
        prefill:{ configurationAbsent:true, selectionAbsent:true },
        review:{ name:"Product listing", status:"Working draft based on revision 3 · 2 pending changes", checkoutUnchanged:true },
        publication:{ review:"Product listing working draft will be compared with current revision 3; confirmation publishes revision 4. Pending changes: Add page_type; Add page_name.", productCurrent:3, checkoutUnchanged:true },
        switchOpen:{ heading:"Choose schema destination", choices:["Checkout revision 2 · 1 pending changes", "Product listing revision 3 · 2 pending changes"], productUnchanged:true },
        afterCancel:{ context:"Product listing working draft", productUnchanged:true },
        afterSwitch:{ context:"Checkout working draft", sectionCount:1, unnamedAbsent:true, productUnchanged:true },
        assignmentResolution:{ none:"Create a new assignment", multiple:"required from readable assignment choices" },
      }, "Guided draft continuation violated its browser interaction contract");
      const continuationSchemas = await evaluate(socket, `localStorage.getItem("my-chrome-utilities.schema-library.v1")`);
      const continuationSelection = await evaluate(socket, `localStorage.getItem("my-chrome-utilities.guided-validation-continuations.v1")`);
      await evaluate(socket, `(() => { localStorage.setItem("my-chrome-utilities.schema-library.v1", ${JSON.stringify(continuationSchemas)}); localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", "[]"); localStorage.setItem("my-chrome-utilities.guided-validation-continuations.v1", ${JSON.stringify(continuationSelection)}); return true; })()`);
      await reloadPanel(socket);
      guidedDraftContinuationReloadObservation = await evaluate(socket, guidedDraftContinuationReloadRuntime);
      assert.deepEqual(guidedDraftContinuationReloadObservation, { context:"Checkout working draft", heading:"Define requirement", destinationAbsent:true, expectedTypeSource:"String — Checkout version 2" }, "Guided draft continuation did not survive reload");
    }
    if (width === 720 && runSchemaRevisionLifecycleRuntime) {
      await evaluate(socket, `(() => {
        const assignment = { id:"assignment:product", name:"Product pages", schemaId:"schema-product-listing", schemaVersion:3, sourceId:"history", eventName:"pageview", target:"payload", versionPolicy:"pinned", enabled:true };
        const revision = (version) => ({ id:"schema-product-listing", name:"Product listing", version, published:true, document:{ type:"object", properties:{ ["revision_" + version]:{ type:"string" } } }, assignments:[assignment] });
        const current = {
          ...revision(4),
          revisionHistory:[revision(1), revision(2), revision(3)],
          workingDraft:{ baseVersion:4, sourceVersion:4, document:{ type:"object", properties:{ draft_field:{ type:"string" } } }, assignments:[assignment], pendingChanges:["Add draft_a", "Add draft_b", "Add draft_c"] },
        };
        const checkout = { id:"schema:checkout:1", name:"Checkout", version:1, published:false, document:{ type:"object" }, assignments:[], workingDraft:{ baseVersion:0, sourceVersion:0, document:{ type:"object", properties:{ checkout_id:{ type:"string" } } }, assignments:[], pendingChanges:["Add checkout_id"] } };
        localStorage.setItem("my-chrome-utilities.schema-library.v1", JSON.stringify([current, checkout]));
        localStorage.setItem("my-chrome-utilities.schema-rule-library.v1", "[]");
        return true;
      })()`);
      await reloadPanel(socket);
      schemaRevisionLifecycleUiObservation = await evaluate(socket, schemaRevisionLifecycleUiRuntime);
      assert.deepEqual(schemaRevisionLifecycleUiObservation, {
        history:{
          options:["Revision 3", "Revision 2", "Revision 1"],
          comparison:"Revision 2 compared with current revision 4. 1 historical properties; 1 current properties.",
          actions:["Duplicate from revision", "Restore this revision", "Build specification"],
          separateRows:0,
          assignmentChoices:["Product listing version 4"],
          openedWithoutMutation:true,
          status:"Working draft based on revision 4 · 3 pending changes · Product listing · Saved schema working draft · Schema revision 0",
        },
        duplication:{ name:"Product listing revision 2 copy", published:false, version:1, assignments:0, sourceUnchanged:4, assignableChoices:["Product listing version 4"] },
        restoration:{
          review:"Product listing revision 2 will replace 3 pending draft changes and create a working draft. Current revision 4 remains active; publication will create revision 5.",
          cancel:{ dialogClosed:true, draftUnchanged:true, current:4 },
          confirmed:{ current:4, source:2, pending:["Restore revision 2"] },
        },
        publication:{ review:"Product listing working draft will be compared with current revision 4; confirmation publishes revision 5. Pending changes: Restore revision 2.", current:5, history:[1,2,3,4], draftCleared:true },
      }, "Schema revision lifecycle UI callbacks violated their browser contract");
      schemaRevisionLifecycleObservation = await evaluate(socket, schemaRevisionLifecycleRuntime);
      assert.deepEqual(schemaRevisionLifecycleObservation, {
        workingDraft:{ identity:"schema-product-listing", current:3, base:3, source:3, twoPending:["Add page_type rule", "Add page_name rule"], pending:["Add page_type rule", "Add page_name rule", "Add Checkout assignment"], properties:["product_id", "page_type", "page_name"], durable:true, currentProperties:["product_id"], activeCheckout:false, sameIdentity:true },
        publication:{ identity:"schema-product-listing", current:4, history:[3], draftCleared:true, properties:["product_id", "page_type", "page_name"], checkoutRevision:4, choices:["Product listing"] },
        policies:{ pinned:3, latest:4, recorded:[3,4] },
        history:{ choices:[3], selected:3, duplicate:{ name:"Product listing revision 3 copy", published:false, assignable:0 }, restored:{ current:4, source:3, pending:["Restore revision 3"], discardCurrent:4 } },
        migration:{ count:1, identity:"schema-product-listing", current:4, history:[3,2,1], assignments:[{ schemaId:"schema-product-listing", schemaVersion:3, versionPolicy:"pinned" }, { schemaId:"schema-product-listing", schemaVersion:null, versionPolicy:"follow latest" }] },
      }, "Schema revision lifecycle violated its browser storage and resolution contract");
    }
    if (guidedLifecycleProject) await evaluate(socket, guidedTransportProjectRestoreRuntime(guidedLifecycleProject));
    socket.close();
    }
    };
    targetContext.executeFixture=executeFixture;
    if (targetDefinition && manageLifecycle) {
      await targetDefinition.setup({ context:targetContext });
      await targetDefinition.observe({ context:targetContext });
    } else {
      await executeFixture();
    }
    }catch(error){
      if(!browserTargetId || !manageLifecycle)throw error;
      failedAtPhase=targetTimer.activePhase;
      browserTargetFailures.push({id:browserTargetId,error});
    }
    finally {
      if (targetDefinition && manageLifecycle) {
        try { await targetDefinition.cleanup({ context:targetContext }); }
        catch (error) {
          failedAtPhase=targetTimer.activePhase;
          browserTargetFailures.push({id:browserTargetId,error});
        }
      }
    }
    if (browserTargetId && manageLifecycle) {
      const failure=browserTargetFailures.find(({id})=>id===browserTargetId);
      targetTimer.transition("target cleanup");
      const timing=targetTimer.finish({status:failure?"failed":"passed",failedAtPhase});
      console.log(JSON.stringify({
        swarmforgeBrowserTargetResult:failure
          ?{id:browserTargetId,status:"failed",phase:failedAtPhase,
            cause:failure.error?.deadlineOwner?"infrastructure":"readiness-or-product",
            durationMs:timing.durationMs,
            finalState:boundedDiagnostic({message:String(failure.error?.message??failure.error)},600),
            error:String(failure.error?.message??failure.error)}
          :{id:browserTargetId,status:"passed",durationMs:timing.durationMs},
      }));
      console.log(JSON.stringify({
        swarmforgeBrowserTargetTiming:{ id:browserTargetId, ...timing },
      }));
    }
  }
  if (browserTargetIds.length) {
    activateBrowserTarget(null);
    activeBrowserTargetEnvironment = Object.freeze(Object.assign(
      {}, activeBrowserTargetEnvironment, ...Object.values(browserTargetConfigurations),
    ));
  }
  if (activeBrowserTargetEnvironment.SCHEMA_WORKSPACE_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaWorkspace:schemaWorkspaceAdapterObservations.at(-1) }));
  }
  if (activeBrowserTargetEnvironment.GUIDED_VALIDATION_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ guidedValidation:guidedValidationObservation, guidedSchemaPicker:guidedSchemaPickerObservation }));
  }
  if (activeBrowserTargetEnvironment.GUIDED_ASSIGNMENT_COVERAGE_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ guidedAssignmentCoverage:guidedAssignmentCoverageObservation }));
  }
  if (activeBrowserTargetEnvironment.CONDITIONAL_VALIDATION_RULES_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ conditionalValidationRules:conditionalValidationRulesObservation }));
  }
  if (activeBrowserTargetEnvironment.SCHEMA_DOCUMENTATION_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaDocumentation:schemaDocumentationObservation }));
  }
  if (activeBrowserTargetEnvironment.MISSING_EVENT_DEFECT_REPORT_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ missingEventDefectReport:missingEventDefectReportObservation }));
  }
  if (activeBrowserTargetEnvironment.UNIFIED_DEFECT_BUILDER_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ unifiedDefectBuilder:missingEventDefectReportObservation }));
  }
  if (activeBrowserTargetEnvironment.MISSING_EVENT_REPORT_FIDELITY_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ missingEventReportFidelity:missingEventDefectReportObservation?.fidelity }));
  }
  if (activeBrowserTargetEnvironment.VALIDATION_PRESENCE_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ validationPresenceSemantics:validationPresenceSemanticsObservation }));
  }
  if (activeBrowserTargetEnvironment.DEFECT_LIBRARY_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ defectLibrary:defectLibraryObservation }));
  }
  if (activeBrowserTargetEnvironment.SCHEMA_PUBLICATION_REFRESH_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaPublicationRefresh:schemaPublicationRefreshObservation }));
  }
  if (activeBrowserTargetEnvironment.RECURSIVE_DECLARED_PROPERTY_VALIDATION_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ recursiveDeclaredPropertyValidation:recursiveDeclaredPropertyValidationObservation }));
  }
  if (activeBrowserTargetEnvironment.LIBRARY_DIRECT_TEMPLATE_PUSH_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ libraryDirectTemplatePush:libraryDirectTemplatePushObservation }));
  }
  if (activeBrowserTargetEnvironment.SCHEMA_SPECIFICATION_BUILDER_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaSpecificationBuilder:schemaSpecificationBuilderObservation }));
  }
  if(activeBrowserTargetEnvironment.SCHEMA_SPECIFICATION_BUILDER_CUSTOMIZATION_BROWSER_ADAPTER==="1")console.log(JSON.stringify({schemaSpecificationBuilderCustomization:schemaSpecificationBuilderCustomizationObservation}));
  if(activeBrowserTargetEnvironment.SCHEMA_SPECIFICATION_EXAMPLE_SELECTION_BROWSER_ADAPTER==="1")console.log(JSON.stringify({schemaSpecificationExampleSelection:schemaSpecificationExampleSelectionObservation}));
  if(activeBrowserTargetEnvironment.SCHEMA_SPECIFICATION_PREVIEW_LAYOUT_BROWSER_ADAPTER==="1")console.log(JSON.stringify({schemaSpecificationPreviewLayout:schemaSpecificationPreviewLayoutObservation}));
  if (activeBrowserTargetEnvironment.SCHEMA_PROPERTY_TYPE_EDITING_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaPropertyTypeEditing:schemaPropertyTypeEditingObservation }));
  }
  if(activeBrowserTargetEnvironment.ALLOWED_VALUES_RULE_MIGRATION_BROWSER_ADAPTER==="1")console.log(JSON.stringify({allowedValuesRuleMigration:allowedValuesRuleMigrationObservation}));
  if(activeBrowserTargetEnvironment.SCHEMA_SPECIFICATION_CONTAINER_DEFAULTS_BROWSER_ADAPTER==="1")console.log(JSON.stringify({schemaSpecificationContainerDefaults:schemaSpecificationContainerDefaultsObservation}));
  if(activeBrowserTargetEnvironment.SCHEMA_PROPERTY_COMMENTS_BROWSER_ADAPTER==="1")console.log(JSON.stringify({schemaPropertyComments:schemaPropertyCommentsObservation}));
  if(activeBrowserTargetEnvironment.SCHEMA_CARDINALITY_COMPARISON_BROWSER_ADAPTER==="1")console.log(JSON.stringify({schemaCardinalityComparison:schemaCardinalityComparisonObservation}));
  if(activeBrowserTargetEnvironment.SCHEMA_DECLARED_PROPERTY_EXCEPTIONS_BROWSER_ADAPTER==="1")console.log(JSON.stringify({schemaDeclaredPropertyExceptions:schemaDeclaredPropertyExceptionsObservation}));
  if(activeBrowserTargetEnvironment.JSON_SCHEMA_EXPORT_BROWSER_ADAPTER==="1")console.log(JSON.stringify({jsonSchemaExport:jsonSchemaExportObservation}));
  if(activeBrowserTargetEnvironment.ARRAY_VALIDATION_ROLLUP_BROWSER_ADAPTER==="1")console.log(JSON.stringify({arrayValidationRollup:arrayValidationRollupObservation}));
  if (activeBrowserTargetEnvironment.LIVE_SCHEMA_PROPERTY_DECLARATION_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ liveSchemaPropertyDeclaration:liveSchemaPropertyDeclarationObservation }));
  }
  if (activeBrowserTargetEnvironment.ALLOWED_VALUE_EXPANSION_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ allowedValueExpansion:allowedValueExpansionObservation }));
  }
  if (activeBrowserTargetEnvironment.LOCAL_RULE_PROMOTION_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ localRulePromotion:localRulePromotionObservation }));
  }
  if (activeBrowserTargetEnvironment.LOCAL_RULE_PROMOTION_AVAILABILITY_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ localRulePromotionAvailability:localRulePromotionAvailabilityObservation }));
  }
  if (activeBrowserTargetEnvironment.LOCAL_RULE_EDITING_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ localRuleEditing:localRuleEditingObservation }));
  }
  if (activeBrowserTargetEnvironment.REUSABLE_RULE_SYNC_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ reusableRuleSync:reusableRuleSyncObservation }));
  }
  if (activeBrowserTargetEnvironment.REQUIRED_RULE_TYPE_INDEPENDENCE_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ requiredRuleTypeIndependence:requiredRuleTypeIndependenceObservation }));
  }
  if (activeBrowserTargetEnvironment.SPECIFICATION_PROJECT_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ specificationProject:specificationProjectObservation }));
  }
  if (activeBrowserTargetEnvironment.LIVE_GUIDED_CONDITIONAL_RULE_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ liveGuidedConditionalRule:liveGuidedConditionalRuleObservation }));
  }
  if (activeBrowserTargetEnvironment.SAVED_EVENT_FEED_FILTERS_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ savedEventFeedFilters:savedEventFeedFiltersObservation }));
  }
  if (activeBrowserTargetEnvironment.DEFECT_REPORT_UNDECLARED_REMOVAL_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ defectReportUndeclaredRemoval:defectReportUndeclaredRemovalObservation }));
  }
  if (activeBrowserTargetEnvironment.DEFECT_REPORT_COMPONENT_OPTIONS_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ defectReportComponentOptions:defectReportComponentOptionsObservation }));
  }
  if (activeBrowserTargetEnvironment.REQUIRED_PROPERTY_DEFECT_SCHEMA_CHOICES_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ requiredPropertyDefectSchemaChoices:requiredPropertyDefectSchemaChoicesObservation }));
  }
  if (activeBrowserTargetEnvironment.DEFECT_REPORT_SEMANTIC_DIFFERENCES_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ defectReportSemanticDifferences:defectReportSemanticDifferencesObservation }));
  }
  if (activeBrowserTargetEnvironment.DEFECT_REPORT_PROVENANCE_PRESENTATION_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ defectReportProvenancePresentation:defectReportProvenancePresentationObservation }));
  }
  if (activeBrowserTargetEnvironment.EVENT_OCCURRENCE_DEFECT_REPORT_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ eventOccurrenceDefectReport:eventOccurrenceDefectReportObservation }));
  }
  if (activeBrowserTargetEnvironment.SCHEMA_PROPERTY_COPY_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaPropertyCopy:schemaPropertyCopyObservation }));
  }
  if (activeBrowserTargetEnvironment.SCHEMA_ASSIGNMENT_DATA_CONDITIONS_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaAssignmentDataConditions:schemaAssignmentDataConditionsObservation }));
  }
  if (activeBrowserTargetEnvironment.SCHEMA_PROPERTY_EXAMPLE_VALUES_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaPropertyExampleValues:schemaPropertyExampleValuesObservation }));
  }
  if (activeBrowserTargetEnvironment.GUIDED_NESTED_PROPERTY_MERGE_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ guidedNestedPropertyMerge:guidedNestedPropertyMergeObservation }));
  }
  if (activeBrowserTargetEnvironment.LIVE_VALIDATION_VISUALS_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ liveValidationVisuals:liveValidationVisualsObservation }));
  }
  if (activeBrowserTargetEnvironment.SINGLE_LIVE_EVENT_FEED_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ singleLiveEventFeed:singleLiveEventFeedObservation }));
  }
  if (activeBrowserTargetEnvironment.LIVE_TARGET_PERMISSION_RECOVERY_WIRING_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ liveTargetPermissionRecoveryWiring:liveTargetPermissionRecoveryWiringObservation }));
  }
  if (activeBrowserTargetEnvironment.SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaViewContainment:schemaViewContainmentObservation }));
  }
  if (activeBrowserTargetEnvironment.PAYLOAD_PATH_FILTER_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ payloadPathFilterPicker:payloadPathFilterPickerObservation }));
  }
  if (activeBrowserTargetEnvironment.REPRODUCTION_STEP_ACTION_ROWS_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ reproductionStepActionRows:reproductionStepActionRowsObservations }));
  }
  if (activeBrowserTargetEnvironment.SCHEMA_REVISION_LIFECYCLE_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaRevisionLifecycle:{ ...schemaRevisionLifecycleObservation, ui:schemaRevisionLifecycleUiObservation, completionActions:(guidedValidationObservation?.saved?.nextActions ?? []).filter((label) => label !== "Use a different schema") } }));
  }
  if (activeBrowserTargetEnvironment.GUIDED_DRAFT_CONTINUATION_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ guidedDraftContinuation:{ initial:guidedDraftContinuationInitialObservation, interaction:guidedDraftContinuationObservation, reload:guidedDraftContinuationReloadObservation } }));
  }
  if (activeBrowserTargetEnvironment.SCHEMA_PROPERTY_RULE_PICKER_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaPropertyRulePicker:schemaPropertyRulePickerObservation }));
  }
  if (activeBrowserTargetEnvironment.SCHEMA_RULE_PROPERTY_IDENTITY_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaRulePropertyIdentity:schemaRulePropertyIdentityObservation }));
  }
  if (activeBrowserTargetEnvironment.CANONICAL_DECLARED_PROPERTY_VALIDATION_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ canonicalDeclaredPropertyValidation:canonicalDeclaredPropertyValidationObservation }));
  }
  if (activeBrowserTargetEnvironment.SCHEMA_MANUAL_PROPERTY_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaManualProperty:schemaManualPropertyObservation, schemaContainerChild:schemaContainerChildObservation }));
  }
  if (activeBrowserTargetEnvironment.SCHEMA_RENAMING_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaRenaming:schemaRenamingObservation }));
  }
  if (activeBrowserTargetEnvironment.SCHEMA_PROPERTY_FILTER_SORT_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaPropertyFilterSort:schemaPropertyFilterSortObservation }));
  }
  if (activeBrowserTargetEnvironment.SCHEMA_NESTED_PATH_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaNestedPath:schemaNestedPathObservation }));
  }
  if (activeBrowserTargetEnvironment.SAVED_SESSION_LIVE_FEED_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ savedSessionLiveFeed:{ initial:savedSessionLiveFeedObservation, reload:savedSessionLiveFeedReloadObservation } }));
  }
  if (activeBrowserTargetEnvironment.FRESH_LIVE_SESSION_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ freshLiveSession:{ initial:freshLiveSessionObservation, reload:freshLiveSessionReloadObservation } }));
  }
  if (activeBrowserTargetEnvironment.SCHEMA_PROPERTY_REMOVAL_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ schemaPropertyRemoval:{ initial:schemaPropertyRemovalObservation, reload:schemaPropertyRemovalReloadObservation } }));
  }
  if (activeBrowserTargetEnvironment.WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ workspacePanelContainment:workspacePanelContainmentObservation }));
  }
  if (activeBrowserTargetEnvironment.RECURSIVE_PROPERTY_VALIDATION_BROWSER_ADAPTER === "1") {
    console.log(JSON.stringify({ recursivePropertyValidation:recursivePropertyValidationObservation }));
  }
  if(browserTargetFailures.length){
    throw new AggregateError(browserTargetFailures.map(({id,error})=>
      new Error(`${id}: ${String(error?.message??error)}`)),"Side-panel browser target batch failed");
  }
}
}
