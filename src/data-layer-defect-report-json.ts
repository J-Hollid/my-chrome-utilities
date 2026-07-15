export function cloneValue<T>(value: T): T {
  return value === undefined ? value : structuredClone(value);
}

export function pointerSegments(pointer: string): string[] {
  if (!pointer.startsWith("/")) throw new Error(`Invalid JSON pointer: ${pointer}`);
  return pointer.slice(1).split("/").filter(Boolean).map((segment) =>
    segment.replaceAll("~1", "/").replaceAll("~0", "~"));
}

export function pointerValue(payload: unknown, pointer: string): unknown {
  let current = payload;
  for (const segment of pointerSegments(pointer)) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

export function updatePointer(
  payload: unknown,
  pointer: string,
  operation: "add" | "replace" | "remove",
  value?: unknown,
): void {
  const segments = pointerSegments(pointer);
  const leaf = segments.pop();
  if (!leaf) throw new Error("The root payload cannot be corrected directly.");
  let parent = payload as Record<string, unknown>;
  for (const segment of segments) {
    const child = parent[segment];
    if (child === null || typeof child !== "object") {
      if (operation === "remove") return;
      parent[segment] = {};
    }
    parent = parent[segment] as Record<string, unknown>;
  }
  if (operation === "remove") delete parent[leaf];
  else parent[leaf] = cloneValue(value);
}
