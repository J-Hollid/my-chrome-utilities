import { addFlowStep } from "./data-layer-specification-project.js";
export function installExecutableFlowBuilder(options) {
    const editor = document.querySelector("#flow-step-editor");
    if (!editor)
        throw new Error("Missing #flow-step-editor");
    const summary = editor.querySelector("summary"), copy = editor.querySelector("p");
    if (!summary || !copy)
        throw new Error("Executable Flow editor requires summary and explanatory copy.");
    summary.textContent = "Advanced executable steps";
    copy.textContent = "Executable-step controls define runtime sequence semantics independently of documentary journey expectations.";
    const form = document.createElement("form"), label = document.createElement("label"), name = document.createElement("input"), submit = document.createElement("button"), list = document.createElement("ol");
    label.textContent = "Executable step name";
    name.required = true;
    name.setAttribute("aria-label", "Executable step name");
    submit.type = "submit";
    submit.textContent = "Add executable step";
    label.append(name);
    form.append(label, submit);
    list.setAttribute("aria-label", "Executable runtime sequence");
    editor.append(form, list);
    form.addEventListener("submit", (event) => { event.preventDefault(); const { state, flowId } = options.context(); if (!state || !flowId || !name.value.trim())
        return; options.persist(addFlowStep(state, flowId, { name: name.value.trim(), minimum: 1, maximum: 1, optional: false, transitions: [] }, options.id)); name.value = ""; });
    return { render: () => { const { state, flowId } = options.context(), flow = flowId && state?.project.collections.flows.find(({ id }) => id === flowId), steps = flow ? flow.steps ?? [] : []; editor.hidden = !flow; list.replaceChildren(...steps.map((step, index) => { const item = document.createElement("li"); item.textContent = `${index + 1}. ${step.name}`; return item; })); } };
}
//# sourceMappingURL=data-layer-executable-flow-ui.js.map