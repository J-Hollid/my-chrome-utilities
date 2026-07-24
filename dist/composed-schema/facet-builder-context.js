export const clone = (value) => structuredClone(value);
export const labeled = (text, control) => { const label = document.createElement("label"); label.append(text, control); return label; };
export const button = (text, run) => { const control = document.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
export const option = (value, label = value) => new Option(label, value);
//# sourceMappingURL=facet-builder-context.js.map