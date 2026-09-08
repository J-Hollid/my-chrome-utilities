export interface UtilitySessionIdentity {
  utilityId: string;
  sessionId: string;
  targetId: number | null;
}

export type UtilityMessageKind = "ready" | "action" | "state" | "dirty" | "reset" | "stop" | "target-closed" | "close";
export interface UtilityMessage extends UtilitySessionIdentity {
  protocol: "twa-utility-page-v1";
  kind: UtilityMessageKind;
  payload?: unknown;
}
const kinds = new Set(["ready", "action", "state", "dirty", "reset", "stop", "target-closed", "close"]);

export function utilityMessage(identity: UtilitySessionIdentity, kind: UtilityMessageKind, payload?: unknown): UtilityMessage {
  return { ...identity, protocol: "twa-utility-page-v1", kind, payload };
}

export function acceptsUtilityMessage(value: unknown, identity: UtilitySessionIdentity): value is UtilityMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<UtilityMessage>;
  return message.protocol === "twa-utility-page-v1" && kinds.has(message.kind ?? "") &&
    message.utilityId === identity.utilityId && message.sessionId === identity.sessionId &&
    message.targetId === identity.targetId;
}

export function utilityPageUrl(page: string, identity: UtilitySessionIdentity, surface: "owner" | "workbench", base: string): string {
  const url = new URL(page, base);
  url.search = new URLSearchParams({ utility: identity.utilityId, session: identity.sessionId,
    target: identity.targetId === null ? "none" : String(identity.targetId), surface }).toString();
  return url.href;
}
