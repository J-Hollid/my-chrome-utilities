import { resolveRequiredPropertySchemaChoices } from "./data-layer-defect-schema-choices.js";
export function createDefectReportNavigation(effects) {
    return {
        backToCapturedEvent() {
            effects.showCapturedEvent();
            effects.focusCreateDefectReport();
        },
        backToLiveFeed() { effects.closeToLiveFeed(); },
    };
}
export function createLiveDefectReportNavigation(eventId, effects) {
    return createDefectReportNavigation({
        showCapturedEvent: () => effects.reopenCapturedEvent(eventId, true),
        focusCreateDefectReport: () => effects.createDefectReportAction()?.focus({ preventScroll: true }),
        closeToLiveFeed: effects.closeToLiveFeed,
    });
}
function issueId(pointer, index) {
    return pointer.split("/").filter(Boolean).at(-1) ?? `issue-${index + 1}`;
}
function pathname(pageUrl) {
    try {
        return new URL(pageUrl ?? "https://local.invalid/").pathname;
    }
    catch {
        return "/";
    }
}
export function defectReportContext(events, defectEventId) {
    const chronological = [...events].sort((left, right) => left.captureTime.localeCompare(right.captureTime));
    const visits = [];
    for (const event of chronological) {
        const eventPathname = pathname(event.pageUrl);
        const latest = visits.at(-1);
        if (latest?.pathname === eventPathname)
            latest.eventIds = [...latest.eventIds, event.id];
        else
            visits.push({ id: `visit-${visits.length + 1}`, pathname: eventPathname, eventIds: [event.id] });
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
export function defectCapturedEvent(event) {
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
        issues: (event.validationDetails?.issues ?? []).map((issue, index) => {
            const schemaChoices = issue.message === "Required value" && schema
                ? resolveRequiredPropertySchemaChoices({ issuePointer: issue.instancePath, evaluations: event.validationDetails?.evaluations ?? [], assignedSchema: schema })
                : undefined;
            return {
                id: issueId(issue.instancePath, index),
                severity: issue.severity === "warning" ? "warning" : "error",
                pointer: issue.instancePath || "/",
                violation: issue.message,
                constraint: issue.expected,
                actual: issue.actual,
                rule: issue.rule ?? issue.schemaLocation,
                ruleVersion: Number(issue.rule?.match(/ v(\d+)$/)?.[1] ?? 0),
                ...(schemaChoices?.values.length ? { allowedValues: [...schemaChoices.values], schemaChoiceProvenance: schemaChoices.provenance } : issue.allowedValues?.length ? { allowedValues: [...issue.allowedValues] } : {}),
                ...(schemaChoices?.conflict ? { schemaChoiceConflict: schemaChoices.conflict, schemaChoiceProvenance: schemaChoices.provenance } : {}),
            };
        }),
    };
}
export function browserDefectReportClipboard() {
    return {
        ...(typeof navigator.clipboard?.write === "function" && typeof ClipboardItem !== "undefined" ? {
            async writeRich(html, text) {
                await navigator.clipboard.write([new ClipboardItem({
                        "text/html": new Blob([html], { type: "text/html" }),
                        "text/plain": new Blob([text], { type: "text/plain" }),
                    })]);
            },
        } : {}),
        ...(typeof navigator.clipboard?.writeText === "function" ? {
            async writeText(text) { await navigator.clipboard.writeText(text); },
        } : {}),
    };
}
//# sourceMappingURL=data-layer-defect-report-browser.js.map