import type { SchemaDefinition } from "../../utilities/data-layer/schemas.js";
import type { CompactCanonicalEditorAdapter } from "./contracts.js";
import type { CanonicalInstalledViewPorts } from "./canonical-view-contracts.js";
import { SchemaCanonicalTableView } from "./canonical-table-view.js";
/** Owns canonical context controls and table-editor DOM lifecycle. */
export class SchemaCanonicalContextTableView {
    readonly #disposers: Array<() => void> = [];
    #propertyMenuId: string | undefined;
    readonly #table: SchemaCanonicalTableView;
    constructor(private readonly ports: CanonicalInstalledViewPorts, projection: (adapter: CompactCanonicalEditorAdapter) => SchemaDefinition) {
        this.#table = new SchemaCanonicalTableView(ports, projection);
    }
    renderContext(): void {
        const p = this.ports, c = p.controller, host = p.elements.context, document = p.elements.document;
        if (!host)
            return;
        this.clearContext();
        const adapter = c.editor;
        host.hidden = !adapter;
        host.replaceChildren();
        if (!adapter || !document)
            return;
        const identity = document.createElement("p"), feedback = document.createElement("output");
        identity.textContent = `${adapter.label} · revision ${adapter.load().revision}`;
        feedback.setAttribute("aria-label", "Compact canonical command result");
        feedback.textContent = c.commandFeedback ?? "Canonical editor ready.";
        host.append(identity, feedback);
        const own = (control: HTMLElement, action: EventListener, type = "click"): void => { this.#disposers.push(() => control.removeEventListener(type, action)); }, rerender = (): void => this.renderContext(), runHistory = (action: () => void | string | Promise<void | string>): void => { void Promise.resolve(action()).then((message) => { if (message) {
            c.commandFeedback = message;
            rerender();
        } }, (error) => { c.commandFeedback = `The page-scoped canonical command failed. ${error instanceof Error ? error.message : String(error)}`; rerender(); }); };
        if (adapter.onUndo) {
            const control = document.createElement("button"), action = (): void => runHistory(adapter.onUndo!);
            control.type = "button";
            control.textContent = "Undo";
            control.addEventListener("click", action);
            own(control, action);
            host.append(control);
        }
        if (adapter.onRedo) {
            const control = document.createElement("button"), action = (): void => runHistory(adapter.onRedo!);
            control.type = "button";
            control.textContent = "Redo";
            control.addEventListener("click", action);
            own(control, action);
            host.append(control);
        }
        for (const configured of adapter.actions ?? []) {
            const control = document.createElement("button"), action = (): void => configured.run();
            control.type = "button";
            control.textContent = configured.label;
            control.addEventListener("click", action);
            own(control, action);
            host.append(control);
        }
        const table = document.createElement("button"), tree = document.createElement("button");
        table.type = tree.type = "button";
        table.textContent = "Table";
        tree.textContent = "Tree";
        const showView = (view: "table" | "tree") => (): void => { const current = adapter.load(); void c.dispatchCommand({ kind: "view", baseRevision: current.revision, view }); }, showTable = showView("table"), showTree = showView("tree");
        table.addEventListener("click", showTable);
        tree.addEventListener("click", showTree);
        own(table, showTable);
        own(tree, showTree);
        host.append(table, tree);
        adapter.renderContext?.(host);
        if (adapter.migration) {
            const migration = adapter.migration, review = document.createElement("section"), summary = document.createElement("p"), cancel = document.createElement("button"), confirm = document.createElement("button");
            review.setAttribute("aria-label", "Canonical schema migration review");
            summary.textContent = migration.summary;
            for (const conflict of migration.conflicts) {
                const resolution = document.createElement("select");
                resolution.setAttribute("aria-label", conflict.label);
                resolution.append(...conflict.choices.map(({ id, label }) => { const option = document.createElement("option"); option.value = id; option.textContent = label; return option; }));
                const select = (): void => { if (resolution.value)
                    migration.resolve(conflict.id, resolution.value); };
                resolution.addEventListener("change", select);
                own(resolution, select, "change");
                review.append(resolution);
            }
            cancel.type = confirm.type = "button";
            cancel.textContent = "Cancel migration";
            confirm.textContent = "Confirm canonical migration";
            confirm.disabled = migration.conflicts.length > 0;
            const generation = p.generation(), cancelMigration = (): void => { migration.cancel(); rerender(); }, confirmMigration = (): void => { confirm.disabled = true; void migration.confirm().then(() => { if (p.isCurrent(generation) && c.editor === adapter)
                rerender(); }, () => { if (p.isCurrent(generation) && c.editor === adapter) {
                confirm.disabled = false;
                rerender();
            } }); };
            cancel.addEventListener("click", cancelMigration);
            confirm.addEventListener("click", confirmMigration);
            own(cancel, cancelMigration);
            own(confirm, confirmMigration);
            review.append(summary, cancel, confirm);
            host.append(review);
        }
        if (this.#propertyMenuId && adapter.load().nodes[this.#propertyMenuId]) {
            const propertyId = this.#propertyMenuId;
            for (const [label, action, value] of [["Add child", "add-child"], ["Clear example", "no-example"], ["Use custom example", "custom-example", "example"], ["Save documentation", "documentation", "Documented property"], ["Required", "presence", "required"], ["Rename", "rename", `${adapter.load().nodes[propertyId]!.name} renamed`], ["Move to root", "move"], ["Duplicate", "duplicate"], ["Save expected value", "expected", "expected"], ["Reset expected value", "reset-expected"], ["View", "view"], ["Remove", "remove"]] as const) {
                const control = document.createElement("button"), run = (): void => { void c.propertyAction(propertyId, action, value); };
                control.type = "button";
                control.textContent = label;
                control.addEventListener("click", run);
                own(control, run);
                host.append(control);
            }
        }
        if (c.pendingCommand) {
            const compare = document.createElement("button"), retry = document.createElement("button"), reject = document.createElement("button");
            compare.type = retry.type = reject.type = "button";
            compare.textContent = "Compare latest property";
            retry.textContent = "Retry local edit";
            reject.textContent = "Reject local edit";
            const compareLatest = (): void => { c.reviewVisible = true; const base = c.pendingBase, latest = adapter.load(); c.commandFeedback = `Comparing command base revision ${base?.revision ?? "unknown"} with latest revision ${latest.revision}.`; rerender(); }, retryAction = (): void => c.retryCommand(), rejectAction = (): void => c.rejectCommand();
            compare.addEventListener("click", compareLatest);
            retry.addEventListener("click", retryAction);
            reject.addEventListener("click", rejectAction);
            own(compare, compareLatest);
            own(retry, retryAction);
            own(reject, rejectAction);
            host.append(compare, retry, reject);
        }
    }
    showProperty(propertyId: string): void { this.#propertyMenuId = propertyId; }
    clearContext(): void { for (const dispose of this.#disposers.splice(0))
        dispose(); }
    ownContext(dispose: () => void): void { this.#disposers.push(dispose); }
    removeTable(): void { this.#table.remove(); }
    render(): void { this.renderContext(); this.#table.render(); }
    dispose(): void { this.clearContext(); this.#table.remove(); this.#propertyMenuId = undefined; }
}
