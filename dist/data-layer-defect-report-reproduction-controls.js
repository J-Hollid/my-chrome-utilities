import { addManualReproductionStep, adjustManualReproductionStep, generatePathnameSkeleton, moveManualReproductionStep, removeManualReproductionStep, reproductionStepPreview, } from "./data-layer-defect-report.js";
function copyTemplate(template) {
    return { ...template };
}
export function appendReproductionControls(controls, steps, context, state) {
    let selectedVisitId;
    let stage = "idle";
    let draft;
    let editingId;
    let nextManualId = 1;
    let contextualAdd;
    const adjustActions = new Map();
    const startLabel = document.createElement("label");
    startLabel.textContent = "Reproduction starts at ";
    const startVisit = document.createElement("select");
    startVisit.id = "defect-reproduction-start";
    const defectVisitIndex = context.visits.findIndex(({ id }) => id === context.defectVisitId);
    for (const visit of context.visits.slice(0, defectVisitIndex + 1)) {
        startVisit.append(Object.assign(document.createElement("option"), { value: visit.id, textContent: visit.pathname }));
    }
    const generate = document.createElement("button");
    generate.type = "button";
    generate.textContent = "Generate pathname steps";
    const composer = document.createElement("section");
    composer.className = "defect-reproduction-composer";
    composer.setAttribute("aria-label", "Reproduction step composer");
    const selectedPathname = () => state.report().reproductionSteps
        .find((step) => step.kind === "pathname" && step.visitId === selectedVisitId)?.pathname ?? "";
    let renderComposer;
    let renderSteps;
    const updateSteps = (reproductionSteps) => {
        state.update({ ...state.report(), reproductionSteps });
        renderSteps();
        state.refresh();
    };
    const cancel = () => {
        const restoreId = editingId;
        stage = "idle";
        draft = undefined;
        editingId = undefined;
        renderComposer();
        const action = restoreId ? adjustActions.get(restoreId) : contextualAdd;
        action?.focus({ preventScroll: true });
    };
    renderSteps = () => {
        adjustActions.clear();
        steps.replaceChildren(...state.report().reproductionSteps.map((step, index) => {
            const item = document.createElement("li");
            item.dataset.reproductionStepKind = step.kind;
            item.dataset.visitId = step.visitId;
            if (step.kind === "manual") {
                item.dataset.reproductionStepId = step.id;
                const text = document.createElement("span");
                text.textContent = step.text;
                const adjust = document.createElement("button");
                adjust.type = "button";
                adjust.textContent = "Adjust";
                adjust.dataset.adjustStep = step.id;
                adjustActions.set(step.id, adjust);
                adjust.addEventListener("click", () => {
                    selectedVisitId = step.visitId;
                    editingId = step.id;
                    draft = copyTemplate(step.template);
                    stage = "configure";
                    renderComposer();
                });
                const remove = document.createElement("button");
                remove.type = "button";
                remove.textContent = "Remove";
                remove.addEventListener("click", () => updateSteps(removeManualReproductionStep(state.report().reproductionSteps, step.id)));
                const earlier = document.createElement("button");
                earlier.type = "button";
                earlier.textContent = "Move earlier";
                const previous = state.report().reproductionSteps[index - 1];
                earlier.disabled = previous?.kind !== "manual" || previous.visitId !== step.visitId;
                earlier.addEventListener("click", () => updateSteps(moveManualReproductionStep(state.report().reproductionSteps, step.id, "earlier")));
                const later = document.createElement("button");
                later.type = "button";
                later.textContent = "Move later";
                const following = state.report().reproductionSteps[index + 1];
                later.disabled = following?.kind !== "manual" || following.visitId !== step.visitId;
                later.addEventListener("click", () => updateSteps(moveManualReproductionStep(state.report().reproductionSteps, step.id, "later")));
                const segmentNote = document.createElement("small");
                segmentNote.textContent = `Belongs to ${step.pathname}; choose another pathname segment to move across an anchor.`;
                item.append(text, adjust, remove, earlier, later, segmentNote);
                return item;
            }
            const input = document.createElement("input");
            input.value = step.text;
            input.setAttribute("aria-label", `Reproduction step ${index + 1}`);
            input.addEventListener("input", () => {
                state.update({ ...state.report(), reproductionSteps: state.report().reproductionSteps.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, text: input.value } : candidate) });
                state.refresh();
            });
            const select = document.createElement("button");
            select.type = "button";
            select.textContent = `Select ${step.pathname} segment`;
            select.dataset.selectReproductionSegment = step.visitId;
            select.addEventListener("click", () => { selectedVisitId = step.visitId; stage = "idle"; draft = undefined; editingId = undefined; renderComposer(); });
            item.append(input, select);
            return item;
        }));
    };
    const beginTemplate = (template) => {
        draft = template;
        stage = "configure";
        renderComposer();
    };
    renderComposer = () => {
        composer.replaceChildren();
        if (!selectedVisitId)
            return;
        const pathname = selectedPathname();
        if (stage === "idle") {
            const add = document.createElement("button");
            add.type = "button";
            add.textContent = `Add step to ${pathname}`;
            add.dataset.addReproductionStep = selectedVisitId;
            contextualAdd = add;
            add.addEventListener("click", () => { stage = "templates"; renderComposer(); });
            composer.append(add);
            return;
        }
        if (stage === "templates") {
            const group = document.createElement("section");
            group.setAttribute("aria-label", `Choose step template for ${pathname}`);
            for (const [label, template] of [
                ["Click component", { kind: "click", componentName: "" }],
                ["Log in as user", { kind: "login", persona: "" }],
                ["Scroll", { kind: "scroll", target: "bottom" }],
                ["Custom step", { kind: "custom", text: "" }],
            ]) {
                const button = document.createElement("button");
                button.type = "button";
                button.textContent = label;
                button.addEventListener("click", () => beginTemplate(template));
                group.append(button);
            }
            const cancelButton = document.createElement("button");
            cancelButton.type = "button";
            cancelButton.textContent = "Cancel";
            cancelButton.addEventListener("click", cancel);
            group.append(cancelButton);
            composer.append(group);
            return;
        }
        if (!draft)
            return;
        const form = document.createElement("section");
        form.setAttribute("aria-label", `${editingId ? "Adjust" : "Configure"} step for ${pathname}`);
        const preview = document.createElement("output");
        preview.dataset.reproductionPreview = "true";
        const submit = document.createElement("button");
        submit.type = "button";
        submit.textContent = editingId ? "Save changes" : "Add step";
        const refreshPreview = () => { const text = reproductionStepPreview(draft); preview.textContent = text ?? "Complete the template to preview the step."; submit.disabled = !text; };
        const input = (labelText, field, value, update) => {
            const label = document.createElement("label");
            label.textContent = `${labelText} `;
            const control = document.createElement("input");
            control.value = value;
            control.dataset.reproductionField = field;
            control.addEventListener("input", () => { update(control.value); refreshPreview(); });
            label.append(control);
            form.append(label);
            return control;
        };
        if (draft.kind === "click") {
            input("Component name", "componentName", draft.componentName, (value) => { if (draft?.kind === "click")
                draft = { ...draft, componentName: value }; });
            input("Description (optional)", "description", draft.description ?? "", (value) => {
                if (draft?.kind !== "click")
                    return;
                const { description: _description, ...withoutDescription } = draft;
                draft = value ? { ...withoutDescription, description: value } : withoutDescription;
            });
        }
        else if (draft.kind === "login") {
            input("User or persona", "persona", draft.persona, (value) => { if (draft?.kind === "login")
                draft = { ...draft, persona: value }; });
        }
        else if (draft.kind === "scroll") {
            const label = document.createElement("label");
            label.textContent = "Scroll target ";
            const select = document.createElement("select");
            select.dataset.reproductionField = "scrollTarget";
            select.value = draft.target;
            for (const [value, text] of [["bottom", "bottom of the page"], ["top", "top of the page"], ["component", "component"], ["custom", "custom"]])
                select.append(Object.assign(document.createElement("option"), { value, textContent: text }));
            select.addEventListener("change", () => { if (draft?.kind === "scroll")
                draft = { kind: "scroll", target: select.value }; renderComposer(); });
            label.append(select);
            form.append(label);
            if (draft.target === "component" || draft.target === "custom")
                input(draft.target === "component" ? "Component" : "Custom target", "scrollDetail", draft.detail ?? "", (value) => { if (draft?.kind === "scroll")
                    draft = { ...draft, detail: value }; });
        }
        else {
            input("Custom step text", "customText", draft.text, (value) => { if (draft?.kind === "custom")
                draft = { ...draft, text: value }; });
        }
        submit.addEventListener("click", () => {
            if (!draft || !selectedVisitId)
                return;
            const next = editingId
                ? adjustManualReproductionStep(state.report().reproductionSteps, editingId, draft)
                : addManualReproductionStep(state.report().reproductionSteps, selectedVisitId, `manual-${nextManualId++}`, draft);
            const restoreId = editingId;
            stage = "idle";
            draft = undefined;
            editingId = undefined;
            updateSteps(next);
            renderComposer();
            if (restoreId)
                adjustActions.get(restoreId)?.focus({ preventScroll: true });
        });
        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.textContent = "Cancel";
        cancelButton.addEventListener("click", cancel);
        form.append(preview, submit, cancelButton);
        refreshPreview();
        composer.append(form);
    };
    generate.addEventListener("click", () => {
        const skeleton = generatePathnameSkeleton(context.visits, startVisit.value, context.defectVisitId);
        selectedVisitId = skeleton[0]?.visitId;
        stage = "idle";
        draft = undefined;
        editingId = undefined;
        updateSteps(skeleton);
        renderComposer();
    });
    controls.append(startLabel, generate, composer);
}
//# sourceMappingURL=data-layer-defect-report-reproduction-controls.js.map