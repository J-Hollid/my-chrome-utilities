import { focusedPropertySectionLabels } from "../data-layer-focused-schema-property-ui.js";
export const clone = (value) => structuredClone(value);
export const provenanceText = (node) => node.provenance.map(({ source, contributorName, scope, state }) => contributorName ? `${scope ?? "source"} ${contributorName}${state ? ` ${state}` : ""}` : source).join(" → ") || "created";
export const presenceText = (mode) => ({ optional: "Optional", required: "Required", "required-when": "Required when", forbidden: "Forbidden", "forbidden-when": "Forbidden when" })[mode];
export const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
export const sectionLabel = (section) => focusedPropertySectionLabels[section];
//# sourceMappingURL=ui-mount-helpers.js.map