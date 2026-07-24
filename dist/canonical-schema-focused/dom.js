export const labeled = (dom, text, control) => { const label = dom.createElement("label"); label.append(text, control); return label; };
export const input = (dom, name, value = "", type = "text") => { const control = dom.createElement("input"); control.name = name; control.type = type; control.value = value; return control; };
export const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
//# sourceMappingURL=dom.js.map