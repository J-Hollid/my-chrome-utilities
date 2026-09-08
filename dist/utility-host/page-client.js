import { acceptsUtilityMessage, utilityMessage } from "./protocol.js";
/** A workbench sends actions to the retained owner; it never starts another job. */
export function connectUtilityPage(page, receive) {
    const params = new URL(page.location.href).searchParams;
    const target = params.get("target");
    const identity = { utilityId: params.get("utility") ?? "",
        sessionId: params.get("session") ?? "", targetId: target === "none" ? null : Number(target) };
    const surface = params.get("surface");
    if (!identity.utilityId || !identity.sessionId || !target ||
        (identity.targetId !== null && (!Number.isSafeInteger(identity.targetId) || identity.targetId < 0)) ||
        (surface !== "owner" && surface !== "workbench" && surface !== "standalone"))
        throw new Error("Invalid utility session address");
    const host = surface === "standalone" ? null : surface === "owner" ? page.parent : page.opener;
    if (surface !== "standalone" && (!host || host === page))
        throw new Error("The utility session host is unavailable");
    const send = (kind, payload) => {
        host?.postMessage(utilityMessage(identity, kind, payload), page.location.origin);
    };
    const onMessage = (event) => {
        if (host && event.source === host && event.origin === page.location.origin && acceptsUtilityMessage(event.data, identity)) {
            receive(event.data);
        }
    };
    const dispose = () => { page.removeEventListener("message", onMessage); page.removeEventListener("pagehide", dispose); };
    page.addEventListener("message", onMessage);
    page.addEventListener("pagehide", dispose, { once: true });
    send("ready");
    return { identity, ownsWork: surface !== "workbench", send, dispose };
}
//# sourceMappingURL=page-client.js.map