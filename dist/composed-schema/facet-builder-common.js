import { addComposedAllowedValue, moveComposedAllowedValue, removeComposedAllowedValue, typedComposedValue } from "../data-layer-composed-schema-builders.js";
import { button, clone, labeled, option } from "./facet-builder-context.js";
export function renderCommonFacets(context) { const { options, draft, setDraft, setFeedback, render } = context, common = document.createElement("fieldset"), legend = document.createElement("legend"), type = document.createElement("select"), presence = document.createElement("select"), expected = document.createElement("input"), documentation = document.createElement("textarea"); legend.textContent = `Common facets for ${options.path}`; type.append(option("", "Inherit type"), ...["string", "number", "integer", "boolean", "object", "array", "null"].map((value) => option(value))); presence.append(option("", "Inherit presence"), ...["required", "optional", "forbidden", "permitted"].map((value) => option(value))); type.value = draft().type ?? ""; presence.value = draft().presence ?? ""; expected.value = draft().expectedValue === undefined ? "" : String(draft().expectedValue); documentation.value = draft().documentation; type.addEventListener("change", () => setDraft({ ...draft(), type: type.value || undefined })); presence.addEventListener("change", () => setDraft({ ...draft(), presence: presence.value || undefined })); expected.addEventListener("change", () => { try {
    setDraft({ ...draft(), expectedValue: expected.value === "" ? undefined : typedComposedValue(type.value || options.effective.type, expected.value) });
    setFeedback("");
}
catch (error) {
    setFeedback(error instanceof Error ? error.message : String(error));
    render();
} }); documentation.addEventListener("input", () => setDraft({ ...draft(), documentation: documentation.value })); common.append(legend, labeled("Type", type), labeled("Presence", presence), labeled("Expected value", expected), labeled("Documentation", documentation)); return common; }
export function renderAllowedValues(context) { const { options, draft, setDraft, setFeedback, render } = context, allowed = document.createElement("fieldset"), legend = document.createElement("legend"), rows = document.createElement("div"); allowed.setAttribute("aria-label", "Composed allowed values builder"); legend.textContent = "Allowed values"; draft().allowedValues.forEach((entry, index) => { const row = document.createElement("div"), value = document.createElement("input"); value.value = String(entry ?? ""); value.setAttribute("aria-label", `Allowed value ${index + 1}`); value.addEventListener("change", () => { try {
    const next = clone(draft().allowedValues);
    next[index] = typedComposedValue(options.effective.type, value.value);
    setDraft({ ...draft(), allowedValues: next });
    setFeedback("");
}
catch (error) {
    setFeedback(error instanceof Error ? error.message : String(error));
    render();
} }); row.append(labeled(`Value ${index + 1}`, value), button("Remove", () => { setDraft(removeComposedAllowedValue(draft(), index)); render(); }), button("Move up", () => { setDraft(moveComposedAllowedValue(draft(), index, -1)); render(); }), button("Move down", () => { setDraft(moveComposedAllowedValue(draft(), index, 1)); render(); })); rows.append(row); }); allowed.append(legend, rows, button("Add allowed value", () => { const type = options.effective.type, defaultValue = type === "number" || type === "integer" ? 0 : type === "boolean" ? false : type === "null" ? null : ""; setDraft(addComposedAllowedValue(draft(), defaultValue)); render(); })); return allowed; }
//# sourceMappingURL=facet-builder-common.js.map