import { deriveFlowOccurrenceExample, deriveFlowPageFrameExample, flowOccurrenceExampleEditorRows, setFlowOccurrenceExample } from "../data-layer-flow-graph.js";
import { button } from "./ui-primitives.js";
function renderOccurrenceControls(host, state, flowId, occurrenceId, context) {
    host.setAttribute("aria-label", "Occurrence example controls");
    const rows = flowOccurrenceExampleEditorRows(state.project, flowId, occurrenceId).filter(({ type }) => type !== "object" && type !== "array");
    for (const row of rows) {
        const item = document.createElement("label"), value = document.createElement("input"), save = document.createElement("button");
        item.dataset.exampleEditorPath = row.path;
        item.append(`${row.path} · ${row.type ?? "unknown"} `);
        value.setAttribute("aria-label", `Example value for ${row.path}`);
        value.value = row.value === undefined ? "" : String(row.value);
        save.type = "button";
        save.textContent = "Save example";
        save.setAttribute("aria-label", `Save example for ${row.path}`);
        save.addEventListener("click", () => context.persist(setFlowOccurrenceExample(state, flowId, occurrenceId, row.path, value.value, context.id)));
        item.append(value, save);
        host.append(item);
    }
}
export function createFlowExampleDetailsRenderer(context) {
    const occurrence = (state, flowId, occurrenceId, label) => {
        const example = deriveFlowOccurrenceExample(state.project, flowId, occurrenceId), details = document.createElement("details"), summary = document.createElement("summary"), pre = document.createElement("pre"), provenance = document.createElement("ul"), issues = document.createElement("ul"), controls = document.createElement("section");
        renderOccurrenceControls(controls, state, flowId, occurrenceId, context);
        details.dataset.eventExampleFor = occurrenceId;
        details.dataset.exampleStatus = example.status;
        summary.textContent = `${label} · ${example.status} · Derived JSON example`;
        pre.dataset.readonlyExample = occurrenceId;
        pre.textContent = example.formattedJson;
        for (const [path, source] of Object.entries(example.provenance)) {
            const item = document.createElement("li");
            item.dataset.examplePath = path;
            item.dataset.exampleSource = source;
            item.textContent = `${path} · ${source}`;
            provenance.append(item);
        }
        for (const issue of example.issues) {
            const item = document.createElement("li"), repair = document.createElement("a"), value = document.createElement("input"), save = button("Save example", () => context.persist(setFlowOccurrenceExample(context.currentState(), flowId, occurrenceId, issue.path, value.value, context.id)));
            item.dataset.exampleIssuePath = issue.path;
            item.dataset.exampleIssueCode = issue.code;
            repair.href = issue.editHref;
            repair.textContent = "Edit examples";
            repair.addEventListener("click", (event) => { if (context.openOccurrenceSchema?.(occurrenceId, issue.path)) {
                event.preventDefault();
            } });
            value.setAttribute("aria-label", `Example value for ${issue.path}`);
            save.setAttribute("aria-label", `Save example for ${issue.path}`);
            item.append(`${issue.path} · ${issue.message} `, repair, " ", value, save);
            issues.append(item);
        }
        details.append(summary, pre, provenance, controls, issues);
        return details;
    };
    const page = (state, flowId, frameId, label) => {
        const example = deriveFlowPageFrameExample(state.project, flowId, frameId), details = document.createElement("details"), summary = document.createElement("summary"), pre = document.createElement("pre"), provenance = document.createElement("ul"), issues = document.createElement("ul");
        details.dataset.pageExampleFor = frameId;
        details.dataset.exampleStatus = example.status;
        summary.textContent = `${label} page event · ${example.status} · Derived JSON example`;
        pre.dataset.readonlyPageExample = frameId;
        pre.textContent = example.formattedJson;
        for (const [path, source] of Object.entries(example.provenance)) {
            const item = document.createElement("li");
            item.dataset.examplePath = path;
            item.dataset.exampleSource = source;
            item.textContent = `${path} · ${source}`;
            provenance.append(item);
        }
        for (const issue of example.issues) {
            const item = document.createElement("li"), repair = document.createElement("a");
            item.dataset.exampleIssuePath = issue.path;
            item.dataset.exampleIssueCode = issue.code;
            repair.href = issue.editHref;
            repair.textContent = "Open Page-frame contribution";
            repair.addEventListener("click", (event) => { const originFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined, opened = context.openOccurrenceSchema?.(frameId, issue.path, originFocus); context.selectPageFrame(frameId); if (opened)
                event.preventDefault(); });
            item.append(`${issue.path} · ${issue.message} `, repair);
            issues.append(item);
        }
        details.append(summary, pre, provenance, issues);
        return details;
    };
    return { occurrence, page };
}
//# sourceMappingURL=example-details-ui.js.map