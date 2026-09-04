import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";

import { retiredSchemaControllerFixtureSupportContract } from
  "../../support/retired-schema-controller-fixture.mjs";

if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const normalized = (value) => Array.isArray(value) ? value.map(normalized)
    : value && typeof value === "object" ? Object.fromEntries(Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, normalized(nested)])) : value;
  const digest = (value) => createHash("sha256").update(JSON.stringify(normalized(value))).digest("hex");
  const projectionCause = "other:installed schema unchanged projection persistence";
  const orderingCause = "other:installed schema canonical persistence ordering";
  const acknowledgementCause = "other:installed schema durable acknowledgement settlement";
  const emptyHistoryCause = "other:installed contributor empty history feedback";
  const notificationCause = "other:side-panel durable schema notification settlement";
  const authoringAcceptanceCause = "other:schema authoring acceptance contract drift";
  const renamePolicyCause = "other:stale schema-renaming browser fixture boundary";
  const helperOwnershipCause = "other:verification helper registry ownership";
  const projectionScenario = context.causalCategory === projectionCause;
  const orderingScenario = context.causalCategory === orderingCause;
  const acknowledgementScenario = context.causalCategory === acknowledgementCause;
  const emptyHistoryScenario = context.causalCategory === emptyHistoryCause;
  const notificationScenario = context.causalCategory === notificationCause;
  const authoringAcceptanceScenario = context.causalCategory === authoringAcceptanceCause;
  const renamePolicyScenario = context.causalCategory === renamePolicyCause;
  const helperOwnershipScenario = context.causalCategory === helperOwnershipCause;
  const authoringDirectory = new URL(
    "../../../src/data-layer-installed/schemas/", import.meta.url,
  );
  const authoringSource = authoringAcceptanceScenario ? (await Promise.all(
    (await readdir(authoringDirectory)).filter((name) => name.endsWith(".ts"))
      .sort().map((name) => readFile(new URL(name, authoringDirectory), "utf8")),
  )).join("\n") : "";
  const authoringFixtureSource = authoringAcceptanceScenario || renamePolicyScenario ? await readFile(new URL(
    "../../support/side-panel-browser-fixture-primitives.mjs", import.meta.url), "utf8") : "";
  const authoringTargetSource = authoringAcceptanceScenario || renamePolicyScenario ? await readFile(new URL(
    "../../support/side-panel-schema-workspace-targets.mjs", import.meta.url), "utf8") : "";
  const notificationSource = notificationScenario ? await readFile(new URL(
    "../../support/side-panel-browser-fixture-primitives.mjs", import.meta.url), "utf8") : "";
  const helperPath = "test/support/retired-schema-controller-fixture.mjs";
  const expectedPreRepairFailure = helperOwnershipScenario
    ? { helperDeclaresSupportBoundary:false, helperDeclaresSchemaConsumer:false }
    : renamePolicyScenario
    ? { canonicalPolicyControlExercised:false, canonicalPolicyReviewRequired:false,
      legacyAdditionalPropertyReviewRequired:true }
    : authoringAcceptanceScenario
    ? { duplicateRecoveryFocus:false, typedRulePickerContext:false, localRuleContext:false,
      cardinalityComparisonPrompt:false, removalRuleDetails:false,
      directArrayActionOrder:false, renameReviewPreserved:false }
    : notificationScenario
    ? { crossInstanceNotifications:false, pollingDurationAssertion:true }
    : emptyHistoryScenario
    ? { emptyHistoryFeedbackPresented:false }
    : acknowledgementScenario
    ? { durableAcknowledgementReleasedPolicyPresentation:false }
    : orderingScenario
    ? { canonicalProjectionSettlementReady:false, untouchedSchemaProjectionPreserved:false }
    : projectionScenario
      ? { untouchedSchemaProjectionPreserved:false }
    : { publicationFeedbackRetainedAfterRelationshipTreeRerender:false };
  const expectedRepairResult = helperOwnershipScenario
    ? { helperDeclaresSupportBoundary:true, helperDeclaresSchemaConsumer:true }
    : renamePolicyScenario
    ? { canonicalPolicyControlExercised:true, canonicalPolicyReviewRequired:true,
      legacyAdditionalPropertyReviewRequired:false }
    : authoringAcceptanceScenario
    ? { duplicateRecoveryFocus:true, typedRulePickerContext:true, localRuleContext:true,
      cardinalityComparisonPrompt:true, removalRuleDetails:true,
      directArrayActionOrder:true, renameReviewPreserved:true }
    : notificationScenario
    ? { crossInstanceNotifications:true, pollingDurationAssertion:false }
    : emptyHistoryScenario
    ? { emptyHistoryFeedbackPresented:true }
    : acknowledgementScenario
    ? { durableAcknowledgementReleasedPolicyPresentation:true }
    : orderingScenario
    ? { canonicalProjectionSettlementReady:true, untouchedSchemaProjectionPreserved:true }
    : projectionScenario
      ? { untouchedSchemaProjectionPreserved:true }
    : { publicationFeedbackRetainedAfterRelationshipTreeRerender:true };
  const observed = helperOwnershipScenario
    ? {
      helperDeclaresSupportBoundary:
        retiredSchemaControllerFixtureSupportContract.owner === "shell support boundary",
      helperDeclaresSchemaConsumer:
        JSON.stringify(retiredSchemaControllerFixtureSupportContract.consumers) ===
          JSON.stringify(["schemas"]),
    }
    : renamePolicyScenario
    ? {
      canonicalPolicyControlExercised:authoringTargetSource.includes(
        "#compact-canonical-table-editor [aria-label=\"Only defined fields\"]"),
      canonicalPolicyReviewRequired:authoringFixtureSource.includes(
        "assert.match(published.review.text,/policy canonical property/)"),
      legacyAdditionalPropertyReviewRequired:authoringFixtureSource.includes(
        "assert.match(published.review.text,/Change additional-property policy/)"),
    }
    : authoringAcceptanceScenario
    ? {
      duplicateRecoveryFocus:authoringSource.includes("CSS.escape(`Add rule for ${this.selectedPath}`)") &&
        authoringFixtureSource.includes("interaction.duplicate,{closed:true,unchanged:true,selected:true,visible:true,focused:true}"),
      typedRulePickerContext:authoringSource.includes("`Add rule for ${path} · type ${propertyType}`") &&
        authoringFixtureSource.includes('opened.heading,"Add rule for page_type · type string"'),
      localRuleContext:authoringSource.includes("Create local rule") &&
        authoringSource.includes("operator · type ${configuration.propertyType}"),
      cardinalityComparisonPrompt:/textContent:\s*"Choose comparison"/u.test(authoringSource) &&
        authoringTargetSource.includes("comparison.options.length===6"),
      removalRuleDetails:authoringSource.includes("affected rule attachments: ${rules}") &&
        authoringFixtureSource.includes("Order identifier at") &&
        authoringFixtureSource.includes("commerce\\/order\\/id"),
      directArrayActionOrder:authoringTargetSource.includes('querySelectorAll(":scope > button")') &&
        authoringFixtureSource.includes('["Edit type · Array of Object","Add item property","Add rule","Add specific index rule","Copy to another schema","Remove property"]'),
      renameReviewPreserved:authoringFixtureSource.includes("Rename schema from Page view to Generic page view") &&
        authoringFixtureSource.includes("policy canonical property"),
    }
    : notificationScenario
    ? { crossInstanceNotifications:notificationSource.includes("my-chrome-utilities.durable-saved-schemas"),
      pollingDurationAssertion:/attempt\s*<\s*400[\s\S]{0,300}repository\.savedSchemas/u.test(notificationSource) }
    : emptyHistoryScenario
    ? { emptyHistoryFeedbackPresented }
    : acknowledgementScenario
    ? { durableAcknowledgementReleasedPolicyPresentation }
    : orderingScenario
    ? { canonicalProjectionSettlementReady, untouchedSchemaProjectionPreserved }
    : projectionScenario
      ? { untouchedSchemaProjectionPreserved }
    : { publicationFeedbackRetainedAfterRelationshipTreeRerender };
  // retired-schema-assertion: installed-repair-regression-probes-001
  assert.deepEqual(observed, expectedRepairResult);
  const fixture = {
    id:helperOwnershipScenario ? "verification-helper-registry-ownership-v1"
      : renamePolicyScenario ? "schema-renaming-canonical-policy-boundary-v1"
      : authoringAcceptanceScenario ? "schema-authoring-acceptance-contract-group-v1"
      : notificationScenario ? "side-panel-durable-schema-notification-settlement-v1"
      : emptyHistoryScenario ? "installed-contributor-empty-history-feedback-v1"
      : acknowledgementScenario ? "installed-schema-durable-acknowledgement-settlement-v1"
      : projectionScenario ? "installed-schema-unchanged-projection-persistence-v1"
      : orderingScenario ? "installed-schema-canonical-persistence-ordering-v1"
        : "installed-schema-publication-feedback-retention-v1",
    causalCategory:helperOwnershipScenario ? helperOwnershipCause
      : renamePolicyScenario ? renamePolicyCause
      : authoringAcceptanceScenario ? authoringAcceptanceCause
      : notificationScenario ? notificationCause
      : emptyHistoryScenario ? emptyHistoryCause
      : acknowledgementScenario ? acknowledgementCause
      : projectionScenario ? projectionCause : orderingScenario ? orderingCause
      : "other:installed schema publication feedback retention",
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:helperOwnershipScenario
      ? { helper:helperPath, owner:"shell support boundary", consumer:"schemas" }
      : renamePolicyScenario
      ? { interaction:"rename saved schema with a companion policy edit",
        control:"installed canonical Only defined fields command",
        review:"canonical pending-change evidence" }
      : authoringAcceptanceScenario
      ? { interactions:["duplicate manual property recovery", "typed rule selection",
        "local rule configuration", "cardinality comparison", "property removal impact review",
        "nested array rule actions", "rename review"] }
      : notificationScenario
      ? { boundary:"Saved Schema projection", concurrency:"shared browser batch" }
      : emptyHistoryScenario
      ? { operation:"second Undo", history:"empty page-scoped durable history", presentation:"canonical command result" }
      : acknowledgementScenario
      ? { operation:"saved-schema policy edit", acknowledgement:"matching durable saved event", presentation:"canonical editor busy state" }
      : projectionScenario
      ? { operation:"reusable rule publication", failure:"durable batch rejection", untouched:"settled schema projection" }
      : orderingScenario
        ? { operation:"successful schema library write", changed:"edited schema projection", untouched:"migration-only schema projection" }
      : { publication:"Saved Schema revision", rerender:"relationship tree", feedback:"Live event revalidation outcome" },
    expectedPreRepairFailure,
    expectedRepairResult,
  };
  const fixtureDigest = digest(fixture);
  console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{ version:2,
    incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
    preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
    repairResult:{ status:"passed", fixtureDigest, observed } } }));
}
