import assert from "node:assert/strict";

import {
  browserDefectReportClipboard,
  createDefectReportNavigation,
  createLiveDefectReportNavigation,
  renderDefectReportBuilder,
} from "../dist/data-layer-defect-report-ui.js";

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.dataset = {};
    this.attributes = new Map();
    this.listeners = new Map();
    this.textContent = "";
    this.value = "";
    this.checked = false;
    this.disabled = false;
    this.hidden = false;
    this.innerHTML = "";
  }

  append(...children) {
    this.children.push(...children);
    if (this.tagName === "SELECT" && !this.value) {
      const firstOption = children.find((child) => child instanceof FakeElement && child.tagName === "OPTION");
      if (firstOption) this.value = firstOption.value;
    }
  }
  replaceChildren(...children) { this.children = children; }
  setAttribute(name, value) { this.attributes.set(name, value); }
  addEventListener(name, listener) {
    const listeners = this.listeners.get(name) ?? [];
    listeners.push(listener);
    this.listeners.set(name, listeners);
  }
  dispatch(name) { for (const listener of this.listeners.get(name) ?? []) listener({ target: this }); }
  focus(options) { this.focusOptions = options; }
  querySelectorAll(selector) {
    const matches = [];
    const visit = (child) => {
      if (!(child instanceof FakeElement)) return;
      if (selector === "[data-report-field]" && child.dataset.reportField !== undefined) matches.push(child);
      for (const nested of child.children) visit(nested);
    };
    for (const child of this.children) visit(child);
    return matches;
  }
}

globalThis.document = { createElement: (tagName) => new FakeElement(tagName) };

function descendants(root) {
  const result = [];
  const visit = (child) => {
    if (!(child instanceof FakeElement)) return;
    result.push(child);
    for (const nested of child.children) visit(nested);
  };
  visit(root);
  return result;
}

function element(root, predicate) {
  const found = descendants(root).find(predicate);
  assert.ok(found, "Expected production defect-report control was not rendered");
  return found;
}

const payload = { page_type: "unknown", commerce: { currency: "GBP" } };
const olderSessionEvents = Array.from({ length: 18 }, (_, index) => ({
  id: `older-${index}`,
  name: `background-${index}`,
  sourceId: "dataLayer",
  sourceName: "Data layer",
  captureTime: `2026-07-13T00:00:${String(index).padStart(2, "0")}Z`,
  pageUrl: "https://shop.test/products",
  payload: { index },
  validation: "Not checked",
}));
const sessionEvents = [
  ...olderSessionEvents,
  { id: "pageview", name: "pageview", sourceId: "dataLayer", sourceName: "Data layer", captureTime: "2026-07-13T00:00:20Z", pageUrl: "https://shop.test/products", payload: { page: "products" }, keyProperties: { page: "products" }, validation: "Valid", summary: "Products opened" },
  { id: "promotion", name: "promotion", sourceId: "tag", sourceName: "Tag", captureTime: "2026-07-13T00:00:21Z", pageUrl: "https://shop.test/products", payload: { promotion: 1 }, validation: "Not checked" },
  { id: "checkout", name: "checkout", sourceId: "dataLayer", sourceName: "Data layer", captureTime: "2026-07-13T00:00:22Z", pageUrl: "https://shop.test/checkout", payload: { step: "payment" }, validation: "Valid" },
  { id: "purchase", name: "purchase", sourceId: "dataLayer", sourceName: "Data layer", captureTime: "2026-07-13T00:00:23Z", pageUrl: "https://shop.test/checkout", payload, validation: "1 error", validationDetails: {
    schema: { name: "Checkout", version: 4 },
    evaluations: [],
    issues: [
      { instancePath: "/page_type", severity: "error", expected: "one of homepage, product listing, product detail, or checkout", actual: "unknown", schemaLocation: "#/page_type", rule: "page type v1" },
      { instancePath: "/commerce/currency", severity: "error", expected: "one of EUR or USD", actual: "GBP", schemaLocation: "#/currency", rule: "currency v2" },
      { instancePath: "/commerce/debug", severity: "error", expected: "forbidden property", actual: true, schemaLocation: "#/debug", rule: "debug v1" },
    ],
  } },
];
const root = new FakeElement("section");
const richWrites = [];
let backToCapturedEvent = 0;
let backToLiveFeed = 0;
let focusCreateDefectReport = 0;
const liveFeedScrollTop = 480;
renderDefectReportBuilder(root, sessionEvents.at(-1), {
  writeRich: async (html, text) => { richWrites.push({ html, text }); },
}, sessionEvents, createDefectReportNavigation({
  showCapturedEvent: () => { backToCapturedEvent += 1; },
  focusCreateDefectReport: () => { focusCreateDefectReport += 1; },
  closeToLiveFeed: () => { backToLiveFeed += 1; },
}));

const backToEvent = element(root, ({ textContent }) => textContent === "Back to captured event");
const backToFeed = element(root, ({ textContent }) => textContent === "Back to Live feed");
assert.ok(descendants(root).indexOf(backToEvent) < descendants(root).indexOf(element(root, ({ tagName }) => tagName === "FIELDSET")));
backToEvent.dispatch("click");
backToFeed.dispatch("click");
assert.equal(backToCapturedEvent, 1);
assert.equal(focusCreateDefectReport, 1);
assert.equal(backToLiveFeed, 1);

let reopenedEvent;
let closeLiveFeed = 0;
let focusOptions;
const liveNavigation = createLiveDefectReportNavigation("purchase", {
  reopenCapturedEvent: (eventId, preserveReturnSnapshot) => {
    reopenedEvent = { eventId, preserveReturnSnapshot };
  },
  createDefectReportAction: () => ({ focus: (options) => { focusOptions = options; } }),
  closeToLiveFeed: () => { closeLiveFeed += 1; },
});
liveNavigation.backToCapturedEvent();
liveNavigation.backToLiveFeed();
assert.deepEqual(reopenedEvent, { eventId: "purchase", preserveReturnSnapshot: true });
assert.deepEqual(focusOptions, { preventScroll: true });
assert.equal(closeLiveFeed, 1);

const headings = descendants(root).filter(({ tagName }) => tagName === "H4" || tagName === "H5").map(({ textContent }) => textContent);
assert.deepEqual(headings, ["Defect report: purchase", "Validation issues", "Expected result", "Steps to reproduce", "Supporting timeline", "Report details"]);
const preview = element(root, ({ attributes }) => attributes.get("aria-label") === "Final report preview");

const pageTypeGeneric = element(root, ({ name, dataset }) => name === "defect-response-page_type" && dataset.responseSource === "Use generic constraint");
assert.equal(pageTypeGeneric.checked, true);
const pageTypeGenericSelected = pageTypeGeneric.checked;
const pageTypeGenericInline = preview.innerHTML;
assert.match(pageTypeGenericInline, /page_type: homepage OR product listing OR product detail OR checkout/);
const pageTypeSchemaValue = element(root, ({ name, value }) => name === "defect-response-page_type" && value === "product detail");
pageTypeSchemaValue.checked = true;
pageTypeSchemaValue.dispatch("change");
const pageTypeSchemaInline = preview.innerHTML;
assert.match(pageTypeSchemaInline, /page_type: product detail/);
assert.doesNotMatch(pageTypeSchemaInline, /page_type: homepage OR product listing/);
const pageTypeComment = element(root, ({ dataset }) => dataset.allowedValuesComment === "page_type");
const pageTypeHomepage = element(root, ({ name, value }) => name === "defect-response-page_type" && value === "homepage");
pageTypeHomepage.checked = true;
pageTypeHomepage.dispatch("change");
pageTypeComment.checked = true;
pageTypeComment.dispatch("change");
const pageTypeCommentedInline = preview.innerHTML;
assert.match(pageTypeCommentedInline, /page_type: &quot;homepage&quot;, \/\/ must be of type homepage, product listing, product detail, or checkout/);
pageTypeComment.checked = false;
pageTypeComment.dispatch("change");
const pageTypeClearedInline = preview.innerHTML;
assert.match(pageTypeClearedInline, /page_type: &quot;homepage&quot;/);
assert.doesNotMatch(pageTypeClearedInline, /must be of type homepage/);
assert.deepEqual(payload, { page_type: "unknown", commerce: { currency: "GBP" } });

const issueCheckbox = element(root, ({ id }) => id === "defect-issue-currency");
issueCheckbox.checked = false;
issueCheckbox.dispatch("change");
const schemaResponses = descendants(root)
  .filter(({ dataset, name }) => dataset.responseSource === "Checkout schema" && name === "defect-response-currency")
  .map(({ value }) => value);
assert.deepEqual(schemaResponses, ["EUR", "USD"]);
assert.equal(schemaResponses.includes("GBP"), false);
const currencyAssistance = element(root, ({ attributes }) => attributes.get("aria-label") === "currency expected-result assistance");
const correctionMethod = element(currencyAssistance, ({ dataset, type }) => dataset.responseSource === "Custom value or response" && type === "radio");
const correctionResponse = element(currencyAssistance, ({ placeholder }) => placeholder === "Custom value or response");
const customInitiallyHidden = correctionResponse.hidden;
assert.equal(customInitiallyHidden, true);
correctionMethod.checked = true;
correctionMethod.dispatch("change");
const customVisibleAfterSelection = !correctionResponse.hidden;
assert.equal(customVisibleAfterSelection, true);
const genericMethod = element(currencyAssistance, ({ dataset }) => dataset.responseSource === "Use generic constraint");
genericMethod.checked = true;
genericMethod.dispatch("change");
assert.equal(correctionResponse.hidden, true);
const schemaMethod = element(currencyAssistance, ({ dataset, value }) => dataset.responseSource === "Checkout schema" && value === "EUR");
schemaMethod.checked = true;
schemaMethod.dispatch("change");
const debugAssistance = element(root, ({ attributes }) => attributes.get("aria-label") === "debug expected-result assistance");
const ruleMethod = element(debugAssistance, ({ dataset }) => dataset.responseSource === "validation rule");
ruleMethod.checked = true;
ruleMethod.dispatch("change");
correctionMethod.checked = true;
correctionMethod.dispatch("change");
correctionResponse.value = "EUR";
correctionResponse.dispatch("input");

correctionResponse.value = "CAD";
correctionResponse.dispatch("input");
const customWarning = element(currencyAssistance, ({ dataset }) => dataset.customResponseWarning === "currency");
assert.match(customWarning.textContent, /CAD does not satisfy/);
const invalidCustomWarning = customWarning.textContent;
const keepOverride = element(currencyAssistance, ({ textContent }) => textContent === "Keep custom override");
const replaceOverride = element(currencyAssistance, ({ textContent }) => textContent === "Replace custom override");
replaceOverride.dispatch("click");
assert.equal(correctionResponse.value, "");
correctionResponse.value = "CAD";
correctionResponse.dispatch("input");
keepOverride.dispatch("click");

element(root, ({ textContent }) => textContent === "Generate pathname steps").dispatch("click");
const reproduction = element(root, ({ tagName }) => tagName === "OL");
assert.equal(reproduction.children.length, 2);
const firstReproductionInput = element(reproduction.children[0], ({ tagName }) => tagName === "INPUT");
firstReproductionInput.value = "Open a product";
firstReproductionInput.dispatch("input");

const timeline = element(root, ({ attributes }) => attributes.get("aria-label") === "Supporting timeline entries");
assert.equal(timeline.children.length, 1);
assert.match(timeline.children[0].textContent, /No events added/);
const initialTimelineEmptyState = timeline.children[0].textContent;
let addTimelineEvent = element(root, ({ textContent }) => textContent === "Add event to timeline");
const choicesHiddenInitially = !descendants(root).some(({ dataset }) => dataset.timelineEventId);
const evidenceHiddenInitially = !descendants(root).some(({ dataset }) => dataset.timelineEvidence);
assert.equal(choicesHiddenInitially, true);
assert.equal(evidenceHiddenInitially, true);
addTimelineEvent.dispatch("click");
assert.ok(element(root, ({ attributes }) => attributes.get("aria-label") === "Select one captured event"));
const initialTimelineChoiceIds = descendants(root).filter(({ dataset }) => dataset.timelineEventId).map(({ dataset }) => dataset.timelineEventId);
const initialTimelineChoiceSummaries = descendants(root).filter(({ tagName, textContent }) => tagName === "SPAN" && / · /.test(textContent)).map(({ textContent }) => textContent);
assert.deepEqual(initialTimelineChoiceIds.slice(0, 4), ["purchase", "checkout", "promotion", "pageview"]);
assert.equal(initialTimelineChoiceIds.length, 20);
const evidenceHiddenBeforeSelection = !descendants(root).some(({ dataset }) => dataset.timelineEvidence);
assert.equal(evidenceHiddenBeforeSelection, true);
element(root, ({ textContent }) => textContent === "Load older matches").dispatch("click");
const loadedTimelineChoiceCount = descendants(root).filter(({ dataset }) => dataset.timelineEventId).length;
assert.equal(loadedTimelineChoiceCount, sessionEvents.length);
const timelineFilterFields = ["search", "name", "source", "pathname", "validation"];
for (const field of timelineFilterFields) {
  assert.ok(element(root, ({ dataset }) => dataset.timelineFilter === field));
}
let purchaseChoice = element(root, ({ dataset }) => dataset.timelineEventId === "purchase");
purchaseChoice.checked = true;
purchaseChoice.dispatch("change");
assert.ok(element(root, ({ attributes }) => attributes.get("aria-label") === "Configure evidence for purchase"));
assert.equal(descendants(root).some(({ dataset }) => dataset.timelineEventId), false);
const alwaysIncludedText = element(root, ({ dataset }) => dataset.timelineAlwaysIncluded === "purchase").textContent;
assert.match(alwaysIncludedText, /capture time.*event name.*source.*pathname/i);
const evidenceDescriptions = descendants(root).filter(({ tagName, textContent }) => tagName === "SPAN" && / — /.test(textContent)).map(({ textContent }) => textContent);
assert.deepEqual(evidenceDescriptions, [
  "Summary — compact event summary",
  "Payload — captured event JSON",
  "Validation details — schema, rule, and issue information",
]);
const configurationActions = descendants(root).filter(({ tagName }) => tagName === "BUTTON").map(({ textContent }) => textContent).filter((text) => ["Back to event selection", "Add to timeline", "Cancel"].includes(text));
assert.deepEqual(configurationActions, ["Back to event selection", "Add to timeline", "Cancel"]);
let validationEvidence = element(root, ({ dataset }) => dataset.timelineEvidence === "includeValidation");
assert.equal(validationEvidence.checked, false);
validationEvidence.checked = true;
validationEvidence.dispatch("change");
element(root, ({ textContent }) => textContent === "Cancel").dispatch("click");
assert.equal(timeline.children.length, 1);
const cancelledTimelineEmpty = timeline.children.length === 1 && /No events added/.test(timeline.children[0].textContent);
assert.equal(firstReproductionInput.value, "Open a product");
addTimelineEvent = element(root, ({ textContent }) => textContent === "Add event to timeline");
assert.deepEqual(addTimelineEvent.focusOptions, { preventScroll: true });
const cancelFocusRestored = addTimelineEvent.focusOptions;

addTimelineEvent.dispatch("click");
purchaseChoice = element(root, ({ dataset }) => dataset.timelineEventId === "purchase");
purchaseChoice.checked = true;
purchaseChoice.dispatch("change");
validationEvidence = element(root, ({ dataset }) => dataset.timelineEvidence === "includeValidation");
validationEvidence.checked = true;
validationEvidence.dispatch("change");
element(root, ({ textContent }) => textContent === "Add to timeline").dispatch("click");
const addStagesClosed = !descendants(root).some(({ attributes }) => /^(Select one captured event|Configure evidence)/.test(attributes.get("aria-label") ?? ""));
let purchaseEntry = element(timeline, ({ dataset }) => dataset.timelineEntryId === "purchase");
assert.ok(element(purchaseEntry, ({ dataset }) => dataset.timelineEvidenceIncluded === "includeValidation"));
assert.equal(descendants(purchaseEntry).some(({ dataset }) => dataset.timelineEvidenceIncluded === "includeSummary" || dataset.timelineEvidenceIncluded === "includePayload"), false);
const addedPurchaseMetadata = element(purchaseEntry, ({ tagName }) => tagName === "P").textContent;
const addedPurchaseEvidence = descendants(purchaseEntry).filter(({ dataset }) => dataset.timelineEvidenceIncluded).map(({ dataset }) => dataset.timelineEvidenceIncluded);
const addedPurchaseActions = descendants(purchaseEntry).filter(({ tagName }) => tagName === "BUTTON").map(({ textContent }) => textContent);

element(root, ({ textContent }) => textContent === "Add event to timeline").dispatch("click");
const alreadyAddedPurchase = element(root, ({ dataset }) => dataset.timelineEventId === "purchase");
assert.equal(alreadyAddedPurchase.disabled, true);
assert.equal(alreadyAddedPurchase.dataset.alreadyAdded, "true");
const alreadyAddedState = { disabled: alreadyAddedPurchase.disabled, status: alreadyAddedPurchase.dataset.alreadyAdded };
element(root, ({ textContent }) => textContent === "Cancel").dispatch("click");

let adjustPurchase = element(purchaseEntry, ({ textContent }) => textContent === "Adjust");
adjustPurchase.dispatch("click");
validationEvidence = element(root, ({ dataset }) => dataset.timelineEvidence === "includeValidation");
assert.equal(validationEvidence.checked, true);
const adjustPrefilledEvidence = descendants(root).filter(({ dataset, checked }) => dataset.timelineEvidence && checked).map(({ dataset }) => dataset.timelineEvidence);
validationEvidence.checked = false;
validationEvidence.dispatch("change");
const payloadEvidence = element(root, ({ dataset }) => dataset.timelineEvidence === "includePayload");
payloadEvidence.checked = true;
payloadEvidence.dispatch("change");
element(root, ({ textContent }) => textContent === "Save changes").dispatch("click");
assert.equal(descendants(timeline).filter(({ dataset }) => dataset.timelineEntryId === "purchase").length, 1);
purchaseEntry = element(timeline, ({ dataset }) => dataset.timelineEntryId === "purchase");
assert.ok(element(purchaseEntry, ({ dataset }) => dataset.timelineEvidenceIncluded === "includePayload"));
assert.equal(descendants(purchaseEntry).some(({ dataset }) => dataset.timelineEvidenceIncluded === "includeValidation"), false);
adjustPurchase = element(purchaseEntry, ({ textContent }) => textContent === "Adjust");
assert.deepEqual(adjustPurchase.focusOptions, { preventScroll: true });
const adjustedPurchaseEvidence = descendants(purchaseEntry).filter(({ dataset }) => dataset.timelineEvidenceIncluded).map(({ dataset }) => dataset.timelineEvidenceIncluded);
const adjustedPurchaseCount = descendants(timeline).filter(({ dataset }) => dataset.timelineEntryId === "purchase").length;
const adjustFocusRestored = adjustPurchase.focusOptions;

element(root, ({ textContent }) => textContent === "Add event to timeline").dispatch("click");
const pageviewChoice = element(root, ({ dataset }) => dataset.timelineEventId === "pageview");
pageviewChoice.checked = true;
pageviewChoice.dispatch("change");
const summaryEvidence = element(root, ({ dataset }) => dataset.timelineEvidence === "includeSummary");
summaryEvidence.checked = true;
summaryEvidence.dispatch("change");
element(root, ({ textContent }) => textContent === "Add to timeline").dispatch("click");
const chronologicalTimelineEntries = timeline.children.map(({ dataset }) => dataset.timelineEntryId);
assert.deepEqual(chronologicalTimelineEntries, ["pageview", "purchase"]);

element(element(timeline, ({ dataset }) => dataset.timelineEntryId === "pageview"), ({ textContent }) => textContent === "Remove").dispatch("click");
element(element(timeline, ({ dataset }) => dataset.timelineEntryId === "purchase"), ({ textContent }) => textContent === "Remove").dispatch("click");
assert.equal(timeline.children.length, 1);
assert.match(timeline.children[0].textContent, /No events added/);
element(root, ({ textContent }) => textContent === "Add event to timeline").dispatch("click");
assert.equal(element(root, ({ dataset }) => dataset.timelineEventId === "purchase").disabled, false);
element(root, ({ textContent }) => textContent === "Cancel").dispatch("click");

const summary = element(root, ({ dataset }) => dataset.reportField === "summary");
summary.value = "Checkout purchase has invalid currency";
summary.dispatch("input");
assert.match(preview.innerHTML, /Checkout purchase has invalid currency/);

const copy = element(root, ({ textContent }) => textContent === "Copy for Jira Cloud");
copy.onclick();
await new Promise((resolve) => setImmediate(resolve));
assert.equal(richWrites.length, 1);

const browserWrites = [];
const browserTextWrites = [];
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: { clipboard: {
    write: async (items) => { browserWrites.push(items); },
    writeText: async (text) => { browserTextWrites.push(text); },
  } },
});
globalThis.ClipboardItem = class ClipboardItem {
  constructor(items) { this.items = items; }
};
const browserClipboard = browserDefectReportClipboard();
await browserClipboard.writeRich("<p>rich</p>", "plain");
await browserClipboard.writeText("fallback");
assert.equal(browserWrites.length, 1);
assert.deepEqual(Object.keys(browserWrites[0][0].items).sort(), ["text/html", "text/plain"]);
assert.deepEqual(browserTextWrites, ["fallback"]);

process.stdout.write(`${JSON.stringify({
  defectReportUi: {
    headings,
    reproductionSteps: reproduction.children.length,
    timelineEntries: 0,
    timelineComposer: {
      initialEmptyState: initialTimelineEmptyState,
      choicesHiddenInitially,
      evidenceHiddenInitially,
      initialChoiceIds: initialTimelineChoiceIds,
      initialChoiceSummaries: initialTimelineChoiceSummaries,
      loadedChoiceCount: loadedTimelineChoiceCount,
      filterFields: timelineFilterFields,
      evidenceHiddenBeforeSelection,
      alwaysIncludedText,
      evidenceDescriptions,
      configurationActions,
      cancelFocusRestored,
      cancelledTimelineEmpty,
      addStagesClosed,
      addedPurchaseMetadata,
      addedPurchaseEvidence,
      addedPurchaseActions,
      alreadyAddedState,
      adjustPrefilledEvidence,
      adjustedPurchaseEvidence,
      adjustedPurchaseCount,
      adjustFocusRestored,
      chronologicalEntries: chronologicalTimelineEntries,
      pathnameEdit: firstReproductionInput.value,
      capturedEventsRetained: sessionEvents.length,
      emptyAfterRemove: timeline.children.length === 1,
    },
    editedSummaryVisible: preview.innerHTML.includes("Checkout purchase has invalid currency"),
    copied: richWrites.length,
    browserClipboardWrites: browserWrites.length + browserTextWrites.length,
    navigation: { backToCapturedEvent, focusCreateDefectReport, backToLiveFeed },
    navigationActions: [backToEvent.textContent, backToFeed.textContent],
    liveFeedScrollTop,
    pageType: {
      genericSelected: pageTypeGenericSelected,
      schemaResponses: descendants(root).filter(({ name, value }) => name === "defect-response-page_type" && value).map(({ value }) => value),
      commentAvailable: Boolean(pageTypeComment),
      genericInline: pageTypeGenericInline,
      schemaInline: pageTypeSchemaInline,
      commentedInline: pageTypeCommentedInline,
      clearedInline: pageTypeClearedInline,
    },
    schemaResponses,
    customWarning: customWarning.textContent,
    invalidCustomWarning,
    customInitiallyHidden,
    customVisibleAfterSelection,
    customOverrideVisible: preview.innerHTML.includes("operator-provided"),
  },
})}\n`);
