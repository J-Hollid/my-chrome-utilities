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
const sessionEvents = [
  { id: "pageview", name: "pageview", sourceId: "dataLayer", sourceName: "Data layer", captureTime: "01", pageUrl: "https://shop.test/products", payload: { page: "products" }, keyProperties: { page: "products" }, validation: "Valid" },
  { id: "purchase", name: "purchase", sourceId: "dataLayer", sourceName: "Data layer", captureTime: "02", pageUrl: "https://shop.test/checkout", payload, validation: "1 error", validationDetails: {
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
renderDefectReportBuilder(root, sessionEvents[1], {
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

const timeline = element(root, ({ tagName }) => tagName === "UL");
const initialTimelineEntries = timeline.children.length;
const firstTimelineCheckbox = element(timeline.children[0], ({ tagName, type }) => tagName === "INPUT" && type === "checkbox");
firstTimelineCheckbox.checked = true;
firstTimelineCheckbox.dispatch("change");
const selectedTimelineCheckboxes = descendants(timeline.children[0]).filter(({ tagName, type }) => tagName === "INPUT" && type === "checkbox");
selectedTimelineCheckboxes[1].checked = true;
selectedTimelineCheckboxes[1].dispatch("change");
const nameFilter = element(root, ({ dataset }) => dataset.timelineFilter === "name");
nameFilter.value = "page";
nameFilter.dispatch("input");
assert.equal(timeline.children.length, 1);

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
    timelineEntries: initialTimelineEntries,
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
