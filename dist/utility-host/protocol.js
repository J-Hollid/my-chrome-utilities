const kinds = new Set(["ready", "action", "state", "dirty", "reset", "stop", "target-closed", "close"]);
export function utilityMessage(identity, kind, payload) {
    return { ...identity, protocol: "twa-utility-page-v1", kind, payload };
}
export function acceptsUtilityMessage(value, identity) {
    if (!value || typeof value !== "object")
        return false;
    const message = value;
    return message.protocol === "twa-utility-page-v1" && kinds.has(message.kind ?? "") &&
        message.utilityId === identity.utilityId && message.sessionId === identity.sessionId &&
        message.targetId === identity.targetId;
}
export function utilityPageUrl(page, identity, surface, base) {
    const url = new URL(page, base);
    url.search = new URLSearchParams({ utility: identity.utilityId, session: identity.sessionId,
        target: identity.targetId === null ? "none" : String(identity.targetId), surface }).toString();
    return url.href;
}
//# sourceMappingURL=protocol.js.map