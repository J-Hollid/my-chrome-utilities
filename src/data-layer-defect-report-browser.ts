import type {
  DefectCapturedEvent,
  DefectReportClipboard,
  PathnameVisit,
  TimelineEvent,
} from "./data-layer-defect-report.js";
import type { LiveEvent } from "./data-layer-live-observer.js";

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
    issues: (event.validationDetails?.issues ?? []).map((issue, index) => ({
      id: issueId(issue.instancePath, index),
      severity: issue.severity === "warning" ? "warning" : "error",
      pointer: issue.instancePath || "/",
      constraint: issue.expected,
      actual: issue.actual,
      rule: issue.rule ?? issue.schemaLocation,
      ruleVersion: Number(issue.rule?.match(/ v(\d+)$/)?.[1] ?? 0),
    })),
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
