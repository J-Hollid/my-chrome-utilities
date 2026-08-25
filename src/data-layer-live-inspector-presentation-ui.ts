export interface LiveInspectorPresentationSnapshot {
  showNonApplicableProperties: boolean;
  expandedPropertyPaths: readonly string[];
  expandedRulePaths: readonly string[];
  focusedId?: string;
  focusedPropertyPath?: string;
  scrollTop: number;
}

export function captureLiveInspectorPresentation(
  inspector: HTMLElement | null,
  focused: Element | null = document.activeElement,
): LiveInspectorPresentationSnapshot {
  const focusedElement = focused instanceof HTMLElement ? focused : undefined;
  const focusedPropertyPath = focusedElement?.closest<HTMLElement>(".live-validation-property")?.dataset.propertyPath;
  return {
    showNonApplicableProperties:inspector?.querySelector<HTMLElement>('[aria-label="Properties"]')?.dataset.showNonApplicableProperties === "true",
    expandedPropertyPaths:Array.from(inspector?.querySelectorAll<HTMLDetailsElement>("details[open][data-property-path]") ?? [])
      .map(({ dataset }) => dataset.propertyPath).filter((path): path is string => Boolean(path)),
    expandedRulePaths:Array.from(inspector?.querySelectorAll<HTMLButtonElement>('.live-validation-property[data-property-path] .live-property-status[aria-expanded="true"]') ?? [])
      .map((button) => button.closest<HTMLElement>(".live-validation-property")?.dataset.propertyPath).filter((path): path is string => Boolean(path)),
    ...(focusedElement?.id ? { focusedId:focusedElement.id } : {}),
    ...(focusedPropertyPath ? { focusedPropertyPath } : {}),
    scrollTop:inspector?.scrollTop ?? 0,
  };
}

export function restoreLiveInspectorPresentation(
  inspector: HTMLElement | null,
  snapshot: LiveInspectorPresentationSnapshot | undefined,
  root: Document = document,
): void {
  if (!snapshot) return;
  for (const path of snapshot.expandedPropertyPaths) inspector?.querySelector<HTMLDetailsElement>(`details[data-property-path="${CSS.escape(path)}"]`)?.setAttribute("open", "");
  for (const path of snapshot.expandedRulePaths) {
    const disclosure = inspector?.querySelector<HTMLButtonElement>(`.live-validation-property[data-property-path="${CSS.escape(path)}"] .live-property-status`);
    if (disclosure?.getAttribute("aria-expanded") !== "true") disclosure?.click();
  }
  if (inspector) inspector.scrollTop = snapshot.scrollTop;
  const focusTarget = snapshot.focusedId ? root.getElementById(snapshot.focusedId) : undefined;
  (focusTarget ?? (snapshot.focusedPropertyPath ? inspector?.querySelector<HTMLElement>(`.live-validation-property[data-property-path="${CSS.escape(snapshot.focusedPropertyPath)}"]`) : undefined))?.focus({ preventScroll:true });
}
