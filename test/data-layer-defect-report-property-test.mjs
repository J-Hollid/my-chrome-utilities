import assert from "node:assert/strict";

import {
  addManualReproductionStep,
  adjustManualReproductionStep,
  applyExpectedResult,
  createDefectReport,
  expectedResultAssistance,
  filterTimelineEvents,
  generatePathnameSkeleton,
  generateReportDetails,
  moveManualReproductionStep,
  removeManualReproductionStep,
  removeTimelineSelection,
  renderJiraReport,
  saveTimelineSelection,
  supportingTimeline,
  timelineEventChoices,
  toggleReportIssue,
  validateAssistedResponse,
} from "../dist/data-layer-defect-report.js";
import { defectReportContext } from "../dist/data-layer-defect-report-ui.js";

let state = 0x5eed1234;
function random() {
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return state / 0x100000000;
}

function integer(maximum) {
  return Math.floor(random() * maximum);
}

for (let iteration = 0; iteration < 200; iteration += 1) {
  const issueCount = 1 + integer(12);
  const payload = { nested: {} };
  const issues = Array.from({ length: issueCount }, (_, index) => {
    const key = `field~${index}/value`;
    payload.nested[key] = index;
    return {
      id: `issue-${index}`,
      severity: index % 3 === 0 ? "warning" : "error",
      pointer: `/nested/field~0${index}~1value`,
      constraint: "integer",
      actual: index,
      rule: `rule-${index}`,
      ruleVersion: 1,
    };
  });
  const event = {
    id: `event-${iteration}`,
    name: "purchase",
    source: "dataLayer",
    pageUrl: "https://example.test/checkout",
    pathname: "/checkout",
    captureTime: String(iteration),
    payload,
    schema: { name: "Checkout", version: 1 },
    issues,
  };
  const report = createDefectReport(event);
  const issueId = `issue-${integer(issueCount)}`;

  assert.deepEqual(toggleReportIssue(toggleReportIssue(report, issueId), issueId), report);
  assert.deepEqual(event.payload, payload);

  const allowed = Array.from({ length: 2 + integer(8) }, (_, index) => `value-${iteration}-${index}`);
  const actualAllowed = allowed[integer(allowed.length)];
  const assistedIssue = { ...issues[0], actual: actualAllowed, constraint: `one of ${allowed.join(" or ")}` };
  const assistance = expectedResultAssistance(assistedIssue);
  assert.equal(assistance.genericConstraint, `${assistedIssue.pointer} must be ${assistedIssue.constraint}`);
  assert.deepEqual(assistance.schemaValues, allowed.filter((value) => value !== actualAllowed));
  assert.equal(allowed.every((value) => validateAssistedResponse(assistedIssue, value).valid), true);
  assert.equal(validateAssistedResponse(assistedIssue, `outside-${iteration}`).valid, false);
  const rawAllowedIssue = {
    ...assistedIssue,
    constraint: `one of stale-${iteration}`,
    allowedValues: [...allowed],
  };
  const rawAssistance = expectedResultAssistance(rawAllowedIssue);
  assert.deepEqual(rawAssistance.schemaValues, allowed.filter((value) => value !== actualAllowed));
  assert.match(rawAssistance.genericConstraint, /must be one of/);
  assert.doesNotMatch(rawAssistance.genericConstraint, /stale-/);
  assert.equal(allowed.every((value) => rawAssistance.genericConstraint.includes(value)), true);
  assert.equal(allowed.every((value) => validateAssistedResponse(rawAllowedIssue, value).valid), true);
  assert.equal(validateAssistedResponse(rawAllowedIssue, `outside-${iteration}`).valid, false);
  const inlineEvent = {
    ...event,
    payload: { choice: actualAllowed },
    issues: [{ ...rawAllowedIssue, id: "choice", pointer: "/choice" }],
  };
  const inlineReport = createDefectReport(inlineEvent);
  const genericInline = applyExpectedResult(inlineReport, [{
    issueId: "choice",
    method: "keep the rule generic",
    responseSource: "schema constraint",
  }]);
  const genericPreview = renderJiraReport(generateReportDetails(genericInline));
  assert.match(genericPreview.text, new RegExp(`choice: ${allowed.join(" OR ")}`));
  assert.deepEqual(JSON.parse(genericPreview.expectedJson), inlineEvent.payload);
  const selectedValue = allowed[(allowed.indexOf(actualAllowed) + 1) % allowed.length];
  const commentedInline = applyExpectedResult(inlineReport, [{
    issueId: "choice",
    method: "choose an allowed value",
    response: selectedValue,
    responseSource: "schema-provided value",
    includeAllowedValuesComment: true,
  }]);
  const commentedPreview = renderJiraReport(generateReportDetails(commentedInline));
  assert.match(commentedPreview.text, /\/\/ must be of type/);
  assert.equal(JSON.parse(commentedPreview.expectedJson).choice, selectedValue);
  assert.doesNotMatch(commentedPreview.expectedJson, /must be of type/);
  assert.deepEqual(inlineEvent.payload, { choice: actualAllowed });

  const replacement = `replacement-${iteration}`;
  const corrected = applyExpectedResult(report, [{
    issueId,
    method: "enter a valid response",
    response: replacement,
    responseSource: "Custom value or response",
    operatorProvided: true,
  }]);
  const issueIndex = Number(issueId.slice("issue-".length));
  assert.equal(corrected.expected.payload.nested[`field~${issueIndex}/value`], replacement);
  assert.equal(corrected.expected.corrections[0].responseSource, "Custom value or response");
  assert.equal(corrected.expected.corrections[0].operatorProvided, true);
  assert.deepEqual(event.payload, payload);

  const visitCount = 2 + integer(15);
  const visits = Array.from({ length: visitCount }, (_, index) => ({
    id: `visit-${index}`,
    pathname: `/path-${index % 4}`,
    eventIds: [`event-${index}`],
  }));
  const start = integer(visitCount - 1);
  const end = start + integer(visitCount - start);
  const pathnameSteps = generatePathnameSkeleton(visits, visits[start].id, visits[end].id);
  const pathnameSnapshot = JSON.parse(JSON.stringify(pathnameSteps));
  assert.deepEqual(pathnameSteps.map(({ visitId }) => visitId), visits.slice(start, end + 1).map(({ id }) => id));
  const anchor = pathnameSteps[integer(pathnameSteps.length)];
  const manualCount = 1 + integer(7);
  const manualIds = Array.from({ length: manualCount }, (_, index) => `manual-${iteration}-${index}`);
  const templates = manualIds.map((_, index) => {
    const suffix = `${iteration}-${index}`;
    switch ((iteration + index) % 6) {
      case 0: return { kind: "click", componentName: `component-${suffix}` };
      case 1: return { kind: "login", persona: `persona-${suffix}` };
      case 2: return { kind: "scroll", target: "bottom" };
      case 3: return { kind: "scroll", target: "top" };
      case 4: return { kind: "scroll", target: "component", detail: `target-${suffix}` };
      default: return { kind: "custom", text: `Perform action ${suffix}` };
    }
  });
  let composedSteps = pathnameSteps;
  for (let index = 0; index < manualIds.length; index += 1) {
    composedSteps = addManualReproductionStep(composedSteps, anchor.visitId, manualIds[index], templates[index]);
  }
  assert.deepEqual(pathnameSteps, pathnameSnapshot);
  assert.deepEqual(
    composedSteps.filter(({ kind }) => kind !== "manual").map(({ visitId, pathname }) => ({ visitId, pathname })),
    pathnameSteps.map(({ visitId, pathname }) => ({ visitId, pathname })),
  );
  assert.deepEqual(composedSteps.map(({ text }) => text.match(/^\d+/)?.[0]),
    composedSteps.map((_, index) => String(index + 1)));
  assert.equal(composedSteps.filter(({ kind, visitId }) => kind === "manual" && visitId === anchor.visitId).length, manualCount);
  const composedAnchorIndex = composedSteps.findIndex(({ kind, visitId }) => kind === "pathname" && visitId === anchor.visitId);
  const followingAnchorOffset = composedSteps.slice(composedAnchorIndex + 1).findIndex(({ kind }) => kind === "pathname");
  const composedSectionEnd = followingAnchorOffset < 0 ? composedSteps.length : composedAnchorIndex + 1 + followingAnchorOffset;
  assert.deepEqual(composedSteps.slice(composedAnchorIndex + 1, composedSectionEnd).map(({ id }) => id), manualIds);
  if (manualCount > 1) {
    const movedEarlier = moveManualReproductionStep(composedSteps, manualIds.at(-1), "earlier");
    assert.deepEqual(moveManualReproductionStep(movedEarlier, manualIds.at(-1), "later"), composedSteps);
  }
  const adjustedSteps = adjustManualReproductionStep(composedSteps, manualIds[0], { kind: "custom", text: `Adjusted ${iteration}` });
  assert.equal(adjustedSteps.length, composedSteps.length);
  assert.match(adjustedSteps.find(({ id }) => id === manualIds[0]).text, new RegExp(`Adjusted ${iteration}$`));
  let removedSteps = adjustedSteps;
  for (const id of manualIds) removedSteps = removeManualReproductionStep(removedSteps, id);
  assert.deepEqual(removedSteps, pathnameSteps);

  const timeline = Array.from({ length: visitCount }, (_, index) => ({
    id: `timeline-${index}`,
    captureTime: String(visitCount - index).padStart(3, "0"),
    name: index % 2 === 0 ? "purchase" : "pageview",
    source: index % 3 === 0 ? "dataLayer" : "tag",
    pathname: visits[index].pathname,
    validation: index % 2 === 0 ? "Invalid" : "Valid",
    payload: { index },
    summary: `summary-${index}`,
  }));
  const filtered = filterTimelineEvents(timeline, { name: "PUR", validation: "Invalid" });
  assert.deepEqual(filtered, timeline.filter(({ name, validation }) =>
    name.toLowerCase().includes("pur") && validation === "Invalid"));
  const search = timeline[integer(timeline.length)].pathname.toUpperCase();
  assert.deepEqual(
    filterTimelineEvents(timeline, { search }),
    timeline.filter((entry) => [entry.captureTime, entry.name, entry.source, entry.pathname, entry.validation]
      .join(" ").toLowerCase().includes(search.toLowerCase())),
  );

  const addedEventIds = timeline.filter((_, index) => index % 4 === 0).map(({ id }) => id);
  const choiceLimit = 1 + integer(timeline.length);
  const invalidEventsNewestFirst = timeline.filter(({ validation }) => validation === "Invalid")
    .sort((left, right) => right.captureTime.localeCompare(left.captureTime));
  const choicePage = timelineEventChoices(timeline, { validation: "Invalid" }, addedEventIds, choiceLimit);
  assert.deepEqual(choicePage.choices.map(({ event }) => event.id),
    invalidEventsNewestFirst.slice(0, choiceLimit).map(({ id }) => id));
  assert.deepEqual(choicePage.choices.map(({ event, alreadyAdded }) => alreadyAdded),
    choicePage.choices.map(({ event }) => addedEventIds.includes(event.id)));
  assert.equal(choicePage.hasOlder, invalidEventsNewestFirst.length > choiceLimit);

  const initialSelections = [{ eventId: timeline[0].id, includeSummary: true }];
  const replacementSelection = { eventId: timeline[0].id, includePayload: true };
  const replacedSelections = saveTimelineSelection(initialSelections, replacementSelection);
  assert.deepEqual(replacedSelections, [replacementSelection]);
  assert.deepEqual(initialSelections, [{ eventId: timeline[0].id, includeSummary: true }]);
  assert.deepEqual(saveTimelineSelection(replacedSelections, replacementSelection), replacedSelections);
  const appendedSelection = { eventId: timeline[1].id, includeValidation: true };
  const appendedSelections = saveTimelineSelection(replacedSelections, appendedSelection);
  assert.deepEqual(appendedSelections, [replacementSelection, appendedSelection]);
  assert.equal(new Set(appendedSelections.map(({ eventId }) => eventId)).size, appendedSelections.length);
  const removedSelections = removeTimelineSelection(appendedSelections, replacementSelection.eventId);
  assert.deepEqual(removedSelections, [appendedSelection]);
  assert.deepEqual(removeTimelineSelection(removedSelections, replacementSelection.eventId), removedSelections);
  assert.deepEqual(appendedSelections, [replacementSelection, appendedSelection]);

  const chosen = timeline.filter((_, index) => index % 3 === 0);
  const supporting = supportingTimeline(timeline, chosen.map(({ id }) => ({ eventId: id, includeSummary: true })));
  assert.deepEqual(supporting.map(({ captureTime }) => captureTime),
    chosen.map(({ captureTime }) => captureTime).sort());
  assert.equal(supporting.every((entry) => "summary" in entry && !("payload" in entry)), true);

  const browserEvents = timeline.map((timelineEvent) => ({
    id: timelineEvent.id,
    name: timelineEvent.name,
    sourceId: timelineEvent.source,
    captureTime: timelineEvent.captureTime,
    pageUrl: `https://example.test${timelineEvent.pathname}`,
    payload: timelineEvent.payload,
    validation: timelineEvent.validation,
  }));
  const defectEvent = browserEvents[integer(browserEvents.length)];
  const context = defectReportContext(browserEvents, defectEvent.id);
  const chronological = [...browserEvents].sort((left, right) => left.captureTime.localeCompare(right.captureTime));
  assert.deepEqual(context.timeline.map(({ id }) => id), chronological.map(({ id }) => id));
  assert.deepEqual(context.visits.flatMap(({ eventIds }) => eventIds), chronological.map(({ id }) => id));
  assert.equal(context.visits.every((visit, index) => index === 0 || visit.pathname !== context.visits[index - 1].pathname), true);
  assert.equal(context.visits.find(({ id }) => id === context.defectVisitId).eventIds.includes(defectEvent.id), true);
}

process.stdout.write("defect report properties: 200 generated cases passed\n");
