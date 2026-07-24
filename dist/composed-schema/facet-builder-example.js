import { typedComposedValue } from "../data-layer-composed-schema-builders.js";
import { clone, labeled, option } from "./facet-builder-context.js";
export function renderExampleBuilder(context) { const { options, draft, setDraft, setFeedback, render } = context, example = document.createElement("fieldset"), legend = document.createElement("legend"), method = document.createElement("select"), allowed = document.createElement("select"), custom = document.createElement("input"); example.setAttribute("aria-label", "Composed example builder"); legend.textContent = "Example selection"; method.append(option("blank", "Blank"), option("allowed-value", "Allowed value"), option("custom", "Custom typed value")); method.value = draft().exampleMethod; allowed.append(option("", "Choose allowed value"), ...draft().allowedValues.map((value, index) => option(String(index), String(value)))); custom.value = draft().exampleMethod === "custom" ? String(draft().exampleValue ?? "") : ""; method.addEventListener("change", () => { setDraft({ ...draft(), exampleMethod: method.value, ...(method.value === "blank" ? { exampleValue: undefined } : {}) }); render(); }); allowed.addEventListener("change", () => setDraft({ ...draft(), exampleMethod: "allowed-value", exampleValue: clone(draft().allowedValues[Number(allowed.value)]) })); custom.addEventListener("change", () => { try {
    setDraft({ ...draft(), exampleMethod: "custom", exampleValue: typedComposedValue(options.effective.type, custom.value) });
    setFeedback("");
}
catch (error) {
    setFeedback(error instanceof Error ? error.message : String(error));
    render();
} }); example.append(legend, labeled("Example method", method), labeled("Allowed-value example", allowed), labeled("Custom typed example", custom)); return example; }
//# sourceMappingURL=facet-builder-example.js.map