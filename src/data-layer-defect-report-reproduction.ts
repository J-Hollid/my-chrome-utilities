import type {
  ReproductionStep,
  ReproductionStepTemplate,
} from "./data-layer-defect-report-model.js";

function clean(value: string | undefined): string {
  return value?.trim() ?? "";
}

export function reproductionStepPreview(template: ReproductionStepTemplate): string | undefined {
  if (template.kind === "click") {
    const component = clean(template.componentName);
    if (!component) return undefined;
    const description = clean(template.description);
    return `Click ${component}${description ? ` — ${description}` : ""}`;
  }
  if (template.kind === "login") {
    const persona = clean(template.persona);
    return persona ? `Log in as ${persona}` : undefined;
  }
  if (template.kind === "scroll") {
    if (template.target === "bottom") return "Scroll to the bottom of the page";
    if (template.target === "top") return "Scroll to the top of the page";
    const detail = clean(template.detail);
    if (!detail) return undefined;
    return template.target === "component" ? `Scroll to ${detail}` : `Scroll to the ${detail}`;
  }
  const text = clean(template.text);
  return text || undefined;
}

function withoutNumber(text: string): string {
  return text.replace(/^\d+\.\s*/, "");
}

export function renumberReproductionSteps(steps: readonly ReproductionStep[]): ReproductionStep[] {
  return steps.map((step, index) => ({ ...step, text: `${index + 1}. ${withoutNumber(step.text)}` }));
}

export function addManualReproductionStep(
  steps: readonly ReproductionStep[],
  visitId: string,
  id: string,
  template: ReproductionStepTemplate,
): ReproductionStep[] {
  const text = reproductionStepPreview(template);
  if (!text) throw new Error("Complete the step template before adding it.");
  const anchorIndex = steps.findIndex((step) => step.kind !== "manual" && step.visitId === visitId);
  if (anchorIndex < 0) throw new Error(`Unknown pathname segment: ${visitId}`);
  const nextAnchorOffset = steps.slice(anchorIndex + 1).findIndex((step) => step.kind !== "manual");
  const insertionIndex = nextAnchorOffset < 0 ? steps.length : anchorIndex + 1 + nextAnchorOffset;
  const anchor = steps[anchorIndex]!;
  return renumberReproductionSteps([
    ...steps.slice(0, insertionIndex),
    { kind: "manual", id, visitId, pathname: anchor.pathname, text, template: { ...template } } as ReproductionStep,
    ...steps.slice(insertionIndex),
  ]);
}

export function adjustManualReproductionStep(
  steps: readonly ReproductionStep[],
  id: string,
  template: ReproductionStepTemplate,
): ReproductionStep[] {
  const text = reproductionStepPreview(template);
  if (!text) throw new Error("Complete the step template before saving it.");
  if (!steps.some((step) => step.kind === "manual" && step.id === id)) throw new Error(`Unknown manual step: ${id}`);
  return renumberReproductionSteps(steps.map((step) => step.id === id
    ? { ...step, text, template: { ...template } }
    : { ...step }));
}

export function removeManualReproductionStep(steps: readonly ReproductionStep[], id: string): ReproductionStep[] {
  return renumberReproductionSteps(steps.filter((step) => step.id !== id).map((step) => ({ ...step })));
}

export function moveManualReproductionStep(
  steps: readonly ReproductionStep[],
  id: string,
  direction: "earlier" | "later",
): ReproductionStep[] {
  const index = steps.findIndex((step) => step.kind === "manual" && step.id === id);
  if (index < 0) throw new Error(`Unknown manual step: ${id}`);
  const targetIndex = index + (direction === "earlier" ? -1 : 1);
  const target = steps[targetIndex];
  if (!target || target.kind !== "manual" || target.visitId !== steps[index]!.visitId) {
    return steps.map((step) => ({ ...step, ...(step.template ? { template: { ...step.template } } : {}) }));
  }
  const reordered = steps.map((step) => ({ ...step }));
  [reordered[index], reordered[targetIndex]] = [reordered[targetIndex]!, reordered[index]!];
  return renumberReproductionSteps(reordered);
}
