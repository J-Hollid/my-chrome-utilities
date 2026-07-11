export interface PagePushResult {
  success: boolean;
  result?: string;
}

export function pushPayloadInPage(
  destination: string,
  eventName: string,
  payload: unknown,
  root: unknown = globalThis,
): PagePushResult {
  let value = root;
  for (const segment of destination.split(".")) {
    if (value === null || typeof value !== "object" || !(segment in value)) {
      return { success: false, result: `Destination ${destination} is unavailable.` };
    }
    value = (value as Record<string, unknown>)[segment];
  }
  if (!Array.isArray(value)) {
    return { success: false, result: `Destination ${destination} cannot accept payload.` };
  }
  value.push([eventName, payload]);
  return { success: true };
}
