function clean(value) {
    return value?.trim() ?? "";
}
export function reproductionStepPreview(template) {
    if (template.kind === "click") {
        const component = clean(template.componentName);
        if (!component)
            return undefined;
        const description = clean(template.description);
        return `Click ${component}${description ? ` — ${description}` : ""}`;
    }
    if (template.kind === "login") {
        const persona = clean(template.persona);
        return persona ? `Log in as ${persona}` : undefined;
    }
    if (template.kind === "scroll") {
        if (template.target === "bottom")
            return "Scroll to the bottom of the page";
        if (template.target === "top")
            return "Scroll to the top of the page";
        const detail = clean(template.detail);
        if (!detail)
            return undefined;
        return template.target === "component" ? `Scroll to ${detail}` : `Scroll to the ${detail}`;
    }
    const text = clean(template.text);
    return text || undefined;
}
function withoutNumber(text) {
    return text.replace(/^\d+\.\s*/, "");
}
export function renumberReproductionSteps(steps) {
    return steps.map((step, index) => ({ ...step, text: `${index + 1}. ${withoutNumber(step.text)}` }));
}
export function addManualReproductionStep(steps, visitId, id, template) {
    const text = reproductionStepPreview(template);
    if (!text)
        throw new Error("Complete the step template before adding it.");
    const anchorIndex = steps.findIndex((step) => step.kind === "pathname" && step.visitId === visitId);
    if (anchorIndex < 0)
        throw new Error(`Unknown pathname segment: ${visitId}`);
    const nextAnchorOffset = steps.slice(anchorIndex + 1).findIndex((step) => step.kind === "pathname");
    const insertionIndex = nextAnchorOffset < 0 ? steps.length : anchorIndex + 1 + nextAnchorOffset;
    const anchor = steps[anchorIndex];
    return renumberReproductionSteps([
        ...steps.slice(0, insertionIndex),
        { kind: "manual", id, visitId, pathname: anchor.pathname, text, template: { ...template } },
        ...steps.slice(insertionIndex),
    ]);
}
export function adjustManualReproductionStep(steps, id, template) {
    const text = reproductionStepPreview(template);
    if (!text)
        throw new Error("Complete the step template before saving it.");
    if (!steps.some((step) => step.kind === "manual" && step.id === id))
        throw new Error(`Unknown manual step: ${id}`);
    return renumberReproductionSteps(steps.map((step) => step.kind === "manual" && step.id === id
        ? { ...step, text, template: { ...template } }
        : { ...step }));
}
export function removeManualReproductionStep(steps, id) {
    return renumberReproductionSteps(steps.filter((step) => step.kind !== "manual" || step.id !== id).map((step) => ({ ...step })));
}
export function moveManualReproductionStep(steps, id, direction) {
    const index = steps.findIndex((step) => step.kind === "manual" && step.id === id);
    if (index < 0)
        throw new Error(`Unknown manual step: ${id}`);
    const targetIndex = index + (direction === "earlier" ? -1 : 1);
    const target = steps[targetIndex];
    if (!target || target.kind !== "manual" || target.visitId !== steps[index].visitId) {
        return steps.map((step) => step.kind === "manual"
            ? { ...step, template: { ...step.template } }
            : { ...step });
    }
    const reordered = steps.map((step) => ({ ...step }));
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    return renumberReproductionSteps(reordered);
}
//# sourceMappingURL=data-layer-defect-report-reproduction.js.map