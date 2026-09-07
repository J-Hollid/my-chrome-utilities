import { ContextExportSession } from "./session.js";
import { contextExportBrowserPorts } from "./browser-ports.js";
import { createContextExportSnapshot, contextExportIdentity } from "./snapshot.js";
export const CONTEXT_EXPORT_LABEL = "Export JSON Schema 2020-12";
const errorText = (error) => error instanceof Error ? error.message : String(error);
const controlSources = new WeakMap();
function currentSource(dom) {
    const controls = Array.from(dom.querySelectorAll("[data-schema-context-export-action]")).filter(control => control.getClientRects().length);
    const load = controls.reverse().map(control => controlSources.get(control)).find(Boolean);
    if (!load)
        throw new Error("The schema context changed. Open a schema, then refresh export.");
    return load();
}
export function openContextExportPreview(trigger, load, ports) {
    const dom = trigger.ownerDocument, view = dom.defaultView, session = new ContextExportSession(load, ports ?? contextExportBrowserPorts(dom));
    const dialog = dom.createElement("dialog"), heading = dom.createElement("h2"), identity = dom.createElement("p"), review = dom.createElement("section"), text = dom.createElement("pre"), status = dom.createElement("output"), actions = dom.createElement("div");
    dialog.dataset.schemaContextExport = "true";
    dialog.setAttribute("aria-label", CONTEXT_EXPORT_LABEL);
    dialog.style.cssText = "box-sizing:border-box;width:min(720px,calc(100vw - 24px));max-height:calc(100dvh - 24px);padding:16px;overflow:hidden;";
    const content = dom.createElement("div");
    content.style.cssText = "display:flex;flex-direction:column;max-height:calc(100dvh - 60px);gap:8px;min-width:0";
    heading.textContent = CONTEXT_EXPORT_LABEL;
    heading.style.cssText = "font-size:1.1rem;margin:0;overflow-wrap:anywhere";
    identity.style.cssText = "margin:0;overflow-wrap:anywhere";
    text.tabIndex = 0;
    text.setAttribute("aria-label", "JSON Schema preview");
    text.style.cssText = "flex:1 1 auto;min-height:48px;overflow:auto;white-space:pre;margin:0;padding:8px;border:1px solid currentColor";
    review.style.cssText = "max-height:20vh;overflow:auto;overflow-wrap:anywhere";
    status.setAttribute("role", "status");
    status.style.overflowWrap = "anywhere";
    actions.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;flex:0 0 auto";
    const button = (label, action) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = label; control.addEventListener("click", action); actions.append(control); return control; };
    let busy = false;
    const sync = () => {
        const stale = session.stale;
        let unavailable = false;
        try {
            const source = load();
            unavailable = Boolean(source.pending || source.unconfirmed);
        }
        catch {
            unavailable = true;
        }
        copy.disabled = download.disabled = busy || stale || unavailable || session.needsConfirmation;
        confirm.disabled = busy || stale;
        refresh.hidden = !stale;
        confirm.hidden = !session.needsConfirmation;
        if (stale)
            status.textContent = "The schema changed. Refresh export before Copy or Download.";
    };
    const render = () => {
        try {
            const snapshot = session.refresh();
            identity.textContent = snapshot.label;
            text.textContent = snapshot.text;
            review.replaceChildren();
            for (const item of snapshot.compatibility.omitted) {
                const row = dom.createElement("p");
                row.textContent = `${item.ruleName} · ${item.propertyPath}: ${item.behavior}. This rule will be omitted.`;
                review.append(row);
            }
            for (const item of snapshot.compatibility.conversions) {
                const row = dom.createElement("p");
                row.textContent = `${item.propertyPath}: ${item.conversion}.`;
                review.append(row);
            }
            status.textContent = session.needsConfirmation ? "Review the changes of meaning, then confirm or cancel." : "Ready to copy or download.";
        }
        catch (error) {
            status.textContent = errorText(error);
        }
        sync();
    };
    const perform = async (kind) => {
        busy = true;
        sync();
        try {
            await session[kind]();
            if (session.stale) {
                sync();
                return;
            }
            const omitted = session.snapshot.compatibility.omitted.length;
            status.textContent = `${kind === "copy" ? "JSON copied." : "Download requested."} ${omitted} omitted rules.${omitted ? " The export does not preserve full validation equivalence." : ""}`;
        }
        catch (error) {
            status.textContent = `${errorText(error)} Try again.`;
        }
        finally {
            busy = false;
            sync();
        }
    };
    const copy = button("Copy JSON", () => { void perform("copy"); }), download = button("Download JSON", () => { void perform("download"); });
    const confirm = button("Confirm compatibility review", () => { session.confirm(); status.textContent = "Compatibility review confirmed for this snapshot."; sync(); });
    const refresh = button("Refresh export", render);
    button("Close", () => dialog.close());
    content.append(heading, identity, review, text, status, actions);
    dialog.append(content);
    dom.body.append(dialog);
    const timer = view.setInterval(sync, 150);
    dialog.addEventListener("close", () => { view.clearInterval(timer); session.close(); dialog.remove(); if (trigger.isConnected)
        trigger.focus({ preventScroll: true }); }, { once: true });
    render();
    dialog.showModal();
    copy.disabled ? actions.querySelector("button:not(:disabled):not([hidden])")?.focus() : copy.focus();
}
/** The getter always resolves live source state, even after a host is rendered again. */
export function appendContextExportControl(host, load) {
    const dom = host.ownerDocument, control = dom.createElement("button"), reason = dom.createElement("span");
    control.type = "button";
    control.textContent = CONTEXT_EXPORT_LABEL;
    control.dataset.schemaContextExportAction = "true";
    reason.id = `schema-export-reason-${crypto.randomUUID()}`;
    reason.style.cssText = "display:block;overflow-wrap:anywhere";
    control.setAttribute("aria-describedby", reason.id);
    let checkedIdentity, checkedError = "";
    const update = () => { try {
        const source = load(), identity = contextExportIdentity(source);
        if (identity !== checkedIdentity) {
            checkedIdentity = identity;
            checkedError = "";
            try {
                createContextExportSnapshot({ ...source, pending: false, unconfirmed: false });
            }
            catch (error) {
                checkedError = errorText(error);
            }
        }
        const message = source.unconfirmed ? "Confirm or cancel the property edits before export." : source.pending ? "Wait for the current save to finish." : checkedError;
        control.disabled = Boolean(message);
        reason.textContent = message;
        control.title = message;
    }
    catch (error) {
        control.disabled = true;
        reason.textContent = errorText(error);
    } };
    controlSources.set(control, load);
    control.addEventListener("click", () => { update(); if (!control.disabled)
        openContextExportPreview(control, () => currentSource(dom)); });
    host.append(control, reason);
    update();
    const timer = dom.defaultView?.setInterval(() => { if (!control.isConnected) {
        dom.defaultView?.clearInterval(timer);
        return;
    } update(); }, 150);
    return control;
}
//# sourceMappingURL=preview.js.map