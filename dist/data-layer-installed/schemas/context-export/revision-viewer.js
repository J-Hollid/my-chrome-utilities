import { appendContextExportControl } from "../../../schema-context-export/preview.js";
import { createContextExportSnapshot } from "../../../schema-context-export/snapshot.js";
import { schemaRevision } from "../../../data-layer-schema-verification.js";
const controls = new WeakMap();
/** A read-only projection of the selected saved revision, beside its existing controls. */
export function mountRevisionSchemaViewer(ports) {
    const host = ports.root.querySelector("#schema-revision-history");
    if (!host)
        return;
    let control = controls.get(host);
    if (!control) {
        control = host.ownerDocument.createElement("button");
        control.type = "button";
        control.textContent = "View revision schema";
        host.parentElement?.insertBefore(control, host);
        controls.set(host, control);
    }
    control.onclick = () => openRevisionViewer(control, ports);
}
function openRevisionViewer(trigger, ports) {
    const dom = trigger.ownerDocument, selected = ports.current(), version = ports.version(), dialog = dom.createElement("dialog"), header = dom.createElement("header"), heading = dom.createElement("h2"), tree = dom.createElement("pre"), close = dom.createElement("button");
    const source = () => {
        const owner = ports.schemas().find(schema => schema.id === selected.id) ?? selected, revision = schemaRevision(owner, version);
        if (!revision)
            throw new Error(`Revision ${version} is no longer available.`);
        return { key: `saved:${selected.id}:revision:${version}`, name: revision.name, role: "Saved Schema", context: "", version, schema: revision, schemas: ports.schemas() };
    };
    dialog.setAttribute("aria-label", "Saved Schema revision viewer");
    dialog.style.cssText = "box-sizing:border-box;width:min(760px,calc(100vw - 24px));max-height:calc(100dvh - 24px);overflow:auto";
    heading.textContent = `${selected.name} · revision ${version} · Read only`;
    tree.setAttribute("aria-label", "Revision schema");
    tree.tabIndex = 0;
    tree.style.cssText = "white-space:pre;overflow:auto;max-height:55vh";
    try {
        tree.textContent = createContextExportSnapshot(source()).text;
    }
    catch (error) {
        tree.textContent = error instanceof Error ? error.message : String(error);
    }
    header.append(heading);
    appendContextExportControl(header, source);
    close.type = "button";
    close.textContent = "Close revision";
    close.onclick = () => dialog.close();
    dialog.append(header, tree, close);
    dom.body.append(dialog);
    dialog.showModal();
    close.focus();
    dialog.addEventListener("close", () => { dialog.remove(); if (trigger.isConnected)
        trigger.focus({ preventScroll: true }); }, { once: true });
}
//# sourceMappingURL=revision-viewer.js.map