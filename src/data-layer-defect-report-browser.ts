import type {
  DefectCapturedEvent,
  DefectReportBuilderNavigation,
  DefectReportClipboard,
  PathnameVisit,
  TimelineEvent,
} from "./data-layer-defect-report.js";
import type { LiveEvent } from "./utilities/data-layer/live-inspection.js";
import { resolveRequiredPropertySchemaChoices } from "./data-layer-defect-schema-choices.js";
import { isRequiredPropertyViolation } from "./data-layer-defect-report.js";
import { resolvePropertyDocumentation } from "./utilities/data-layer/schemas.js";

export interface DefectReportNavigationEffects {
  showCapturedEvent(): void;
  focusCreateDefectReport(): void;
  closeToLiveFeed(): void;
}
export function createDefectReportNavigation(
  effects: DefectReportNavigationEffects,
): DefectReportBuilderNavigation {
  return {
    backToCapturedEvent() {
      effects.showCapturedEvent();
      effects.focusCreateDefectReport();
    },
    backToLiveFeed() { effects.closeToLiveFeed(); },
  };
}

export interface LiveDefectReportNavigationEffects {
  reopenCapturedEvent(eventId: string, preserveReturnSnapshot: boolean): void;
  createDefectReportAction(): Pick<HTMLElement, "focus"> | null;
  closeToLiveFeed(): void;
}

export function createLiveDefectReportNavigation(
  eventId: string,
  effects: LiveDefectReportNavigationEffects,
): DefectReportBuilderNavigation {
  return createDefectReportNavigation({
    showCapturedEvent: () => effects.reopenCapturedEvent(eventId, true),
    focusCreateDefectReport: () => effects.createDefectReportAction()?.focus({ preventScroll: true }),
    closeToLiveFeed: effects.closeToLiveFeed,
  });
}

function issueId(pointer: string, index: number): string {
  return pointer.split("/").filter(Boolean).at(-1) ?? `issue-${index + 1}`;
}

function pathname(pageUrl: string | undefined): string {
  try { return new URL(pageUrl ?? "https://local.invalid/").pathname; }
  catch { return "/"; }
}

export interface DefectReportContext {
  visits: PathnameVisit[];
  defectVisitId: string;
  timeline: TimelineEvent[];
}

export function defectReportContext(
  events: readonly LiveEvent[],
  defectEventId: string,
): DefectReportContext {
  const chronological = [...events].sort((left, right) => left.captureTime.localeCompare(right.captureTime));
  const visits: PathnameVisit[] = [];
  for (const event of chronological) {
    const eventPathname = pathname(event.pageUrl);
    const latest = visits.at(-1);
    if (latest?.pathname === eventPathname) latest.eventIds = [...latest.eventIds, event.id];
    else visits.push({ id: `visit-${visits.length + 1}`, pathname: eventPathname, eventIds: [event.id] });
  }
  const defectVisitId = visits.find(({ eventIds }) => eventIds.includes(defectEventId))?.id ?? visits.at(-1)?.id ?? "";
  return {
    visits,
    defectVisitId,
    timeline: chronological.map((event) => ({
      id: event.id,
      captureTime: event.captureTime,
      name: event.name,
      source: event.sourceName ?? event.sourceId,
      pathname: pathname(event.pageUrl),
      validation: event.validation ?? "Not checked",
      payload: event.payload,
      ...(event.keyProperties ? { summary: Object.entries(event.keyProperties).map(([key, value]) => `${key}: ${String(value)}`).join(", ") } : {}),
      ...(event.validationDetails ? { validationDetails: event.validationDetails } : {}),
    })),
  };
}

export function defectCapturedEvent(event: LiveEvent): DefectCapturedEvent {
  const schema = event.validationDetails?.schema;
  return {
    id: event.id,
    name: event.name,
    source: event.sourceName ?? event.sourceId,
    pageUrl: event.pageUrl ?? "",
    pathname: pathname(event.pageUrl),
    captureTime: event.captureTime,
    payload: event.payload,
    schema: { name: schema?.name ?? "Assigned schema", version: schema?.version ?? 0 },
    ...(event.manualFlowContext?{flowContext:structuredClone(event.manualFlowContext)}:{}),
    issues: (event.validationDetails?.issues ?? []).map((issue, index) => {
      const schemaChoices = isRequiredPropertyViolation(issue.message) && schema
        ? resolveRequiredPropertySchemaChoices({ issuePointer:issue.instancePath, evaluations:event.validationDetails?.evaluations ?? [], assignedSchema:schema })
        : undefined;
      const example = event.validationDetails?.documentation
        ? resolvePropertyDocumentation(event.validationDetails.documentation, issue.instancePath)?.example
        : undefined;
      return {
        id: issueId(issue.instancePath, index),
        severity: issue.severity === "warning" ? "warning" : "error",
        pointer: issue.instancePath || "/",
        violation: issue.message,
        constraint: issue.expected,
        ...(Object.prototype.hasOwnProperty.call(issue, "expectedValue")
          ? { expectedValue:structuredClone(issue.expectedValue) }
          : {}),
        actual: issue.actual,
        rule: issue.rule ?? issue.schemaLocation,
        ruleVersion: Number(issue.rule?.match(/ v(\d+)$/)?.[1] ?? 0),
        ...(schemaChoices?.values.length ? { allowedValues:[...schemaChoices.values], schemaChoiceProvenance:schemaChoices.provenance } : issue.allowedValues?.length ? { allowedValues:[...issue.allowedValues] } : {}),
        ...(schemaChoices?.conflict ? { schemaChoiceConflict:schemaChoices.conflict, schemaChoiceProvenance:schemaChoices.provenance } : {}),
        ...(example ? { example:structuredClone(example) } : {}),
      };
    }),
  };
}

export function browserDefectReportClipboard(): DefectReportClipboard {
  return {
    ...(typeof navigator.clipboard?.write === "function" && typeof ClipboardItem !== "undefined" ? {
      async writeRich(html: string, text: string) {
        await navigator.clipboard.write([new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        })]);
      },
    } : {}),
    ...(typeof navigator.clipboard?.writeText === "function" ? {
      async writeText(text: string) { await navigator.clipboard.writeText(text); },
    } : {}),
  };
}
