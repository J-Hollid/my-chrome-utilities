export interface PagePushResult {
  success: boolean;
  result?: string;
}

function valueAtPushPath(
  destination: string,
  root: unknown = globalThis,
): { result: PagePushResult; value?: unknown[] } {
  let value = root;
  for (const segment of destination.split(".")) {
    if (value === null || typeof value !== "object" || !(segment in value)) {
      return {
        result: { success: false, result: `Destination ${destination} is unavailable.` },
      };
    }
    value = (value as Record<string, unknown>)[segment];
  }
  if (!Array.isArray(value)) {
    return {
      result: { success: false, result: "Push path is not push-capable" },
    };
  }
  return { result: { success: true }, value };
}

export function pushPathCapabilityInPage(
  destination: string,
  root: unknown = globalThis,
): PagePushResult {
  return valueAtPushPath(destination, root).result;
}

export function pushPayloadInPage(
  destination: string,
  eventName: string,
  payload: unknown,
  root: unknown = globalThis,
): PagePushResult {
  const resolved = valueAtPushPath(destination, root);
  if (!resolved.result.success || !resolved.value) return resolved.result;
  resolved.value.push([eventName, payload]);
  return { success: true };
}
