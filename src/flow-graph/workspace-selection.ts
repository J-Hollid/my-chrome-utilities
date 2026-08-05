export type FlowSelectionKind = "section" | "page-frame" | "occurrence" | "relationship";

export interface FlowSelection {
  kind: FlowSelectionKind;
  id: string;
}

export interface StoredFlowSelectionView {
  selectedItem?: FlowSelection;
  selectedItems?: FlowSelection[];
}

export function flowSelectionContains(selection: readonly FlowSelection[], item: FlowSelection): boolean {
  return selection.some(({ kind, id }) => kind === item.kind && id === item.id);
}

export function primaryFlowSelection(selection: readonly FlowSelection[]): FlowSelection | undefined {
  return selection.at(-1);
}

export function selectionAfterActivation(
  selection: readonly FlowSelection[],
  item: FlowSelection,
  extend: boolean,
): FlowSelection[] {
  if (!extend) return [item];
  if (flowSelectionContains(selection, item)) {
    return selection.filter(({ kind, id }) => kind !== item.kind || id !== item.id);
  }
  return [...selection, item];
}

export function selectionAfterRemoval(selection: readonly FlowSelection[], id: string): FlowSelection[] {
  return selection.filter((item) => item.id !== id);
}

export function normalizedFlowSelection(value: unknown): FlowSelection[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is FlowSelection => Boolean(
    item && typeof item === "object" &&
    ["section", "page-frame", "occurrence", "relationship"].includes(String((item as FlowSelection).kind)) &&
    typeof (item as FlowSelection).id === "string" && (item as FlowSelection).id,
  ));
}

export function selectionFromStoredView(view: StoredFlowSelectionView | undefined): FlowSelection[] {
  const multiple = normalizedFlowSelection(view?.selectedItems);
  if (multiple.length) return multiple;
  return view?.selectedItem ? normalizedFlowSelection([view.selectedItem]) : [];
}

export function storedViewWithSelection<T extends StoredFlowSelectionView>(view: T, selection: readonly FlowSelection[]): T {
  const next = { ...view, selectedItems: [...selection] };
  const primary = primaryFlowSelection(selection);
  if (primary) next.selectedItem = primary;
  else delete next.selectedItem;
  return next;
}
