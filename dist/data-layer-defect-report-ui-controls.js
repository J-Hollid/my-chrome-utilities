import { generatePathnameSkeleton, } from "./data-layer-defect-report.js";
export function appendReproductionControls(controls, steps, context, state) {
    const startLabel = document.createElement("label");
    startLabel.textContent = "Reproduction starts at ";
    const startVisit = document.createElement("select");
    startVisit.id = "defect-reproduction-start";
    const defectVisitIndex = context.visits.findIndex(({ id }) => id === context.defectVisitId);
    for (const visit of context.visits.slice(0, defectVisitIndex + 1)) {
        startVisit.append(Object.assign(document.createElement("option"), { value: visit.id, textContent: visit.pathname }));
    }
    const renderSteps = () => {
        steps.replaceChildren(...state.report().reproductionSteps.map((step, index) => {
            const item = document.createElement("li");
            const input = document.createElement("input");
            input.value = step.text;
            input.setAttribute("aria-label", `Reproduction step ${index + 1}`);
            input.addEventListener("input", () => {
                state.update({ ...state.report(), reproductionSteps: state.report().reproductionSteps.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, text: input.value } : candidate) });
                state.refresh();
            });
            item.append(input);
            return item;
        }));
    };
    const generate = document.createElement("button");
    generate.type = "button";
    generate.textContent = "Generate pathname steps";
    generate.addEventListener("click", () => {
        state.update({ ...state.report(), reproductionSteps: generatePathnameSkeleton(context.visits, startVisit.value, context.defectVisitId) });
        renderSteps();
        state.refresh();
    });
    startLabel.append(startVisit);
    controls.append(startLabel, generate);
}
export function appendDetailControls(controls, edits, refresh) {
    for (const [field, labelText, multiline] of [
        ["summary", "Summary", false],
        ["description", "Description", true],
        ["expectedExplanation", "Expected result explanation", true],
    ]) {
        const label = document.createElement("label");
        label.textContent = `${labelText} `;
        const input = multiline ? document.createElement("textarea") : document.createElement("input");
        input.dataset.reportField = field;
        input.addEventListener("input", () => { input.dataset.edited = "true"; edits[field] = input.value; refresh(); });
        label.append(input);
        controls.append(label);
    }
}
//# sourceMappingURL=data-layer-defect-report-ui-controls.js.map