/** Owns canonical context controls and table-editor DOM lifecycle. */
export class SchemaCanonicalContextControls {
    ports;
    #disposers = [];
    #propertyMenuId;
    constructor(ports) {
        this.ports = ports;
    }
    renderContext() {
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
        const own = (control, action, type = "click") => {
            this.#disposers.push(() => control.removeEventListener(type, action));
        }, rerender = () => this.renderContext(), runHistory = (action) => {
            void Promise.resolve(action()).then((message) => {
                if (message) {
                    c.setCommandFeedback(message);
                    rerender();
                }
            }, (error) => {
                c.setCommandFeedback(`The page-scoped canonical command failed. ${error instanceof Error ? error.message : String(error)}`);
                rerender();
            });
        };
        if (adapter.onUndo) {
            const control = document.createElement("button"), action = () => runHistory(adapter.onUndo);
            control.type = "button";
            control.textContent = "Undo";
            control.addEventListener("click", action);
            own(control, action);
            host.append(control);
        }
        if (adapter.onRedo) {
            const control = document.createElement("button"), action = () => runHistory(adapter.onRedo);
            control.type = "button";
            control.textContent = "Redo";
            control.addEventListener("click", action);
            own(control, action);
            host.append(control);
        }
        for (const configured of adapter.actions ?? []) {
            const control = document.createElement("button"), action = () => configured.run();
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
        const showView = (view) => () => {
            const current = adapter.load();
            void c.dispatchCommand({
                kind: "view",
                baseRevision: current.revision,
                view,
            });
        }, showTable = showView("table"), showTree = showView("tree");
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
                resolution.append(...conflict.choices.map(({ id, label }) => {
                    const option = document.createElement("option");
                    option.value = id;
                    option.textContent = label;
                    return option;
                }));
                const select = () => {
                    if (resolution.value)
                        migration.resolve(conflict.id, resolution.value);
                };
                resolution.addEventListener("change", select);
                own(resolution, select, "change");
                review.append(resolution);
            }
            cancel.type = confirm.type = "button";
            cancel.textContent = "Cancel migration";
            confirm.textContent = "Confirm canonical migration";
            confirm.disabled = migration.conflicts.length > 0;
            const generation = p.generation(), cancelMigration = () => {
                migration.cancel();
                rerender();
            }, confirmMigration = () => {
                confirm.disabled = true;
                void migration.confirm().then(() => {
                    if (p.isCurrent(generation) && c.editor === adapter)
                        rerender();
                }, () => {
                    if (p.isCurrent(generation) && c.editor === adapter) {
                        confirm.disabled = false;
                        rerender();
                    }
                });
            };
            cancel.addEventListener("click", cancelMigration);
            confirm.addEventListener("click", confirmMigration);
            own(cancel, cancelMigration);
            own(confirm, confirmMigration);
            review.append(summary, cancel, confirm);
            host.append(review);
        }
        if (this.#propertyMenuId && adapter.load().nodes[this.#propertyMenuId]) {
            const propertyId = this.#propertyMenuId;
            for (const [label, action, value] of [
                ["Add child", "add-child"],
                ["Clear example", "no-example"],
                ["Use custom example", "custom-example", "example"],
                ["Save documentation", "documentation", "Documented property"],
                ["Required", "presence", "required"],
                [
                    "Rename",
                    "rename",
                    `${adapter.load().nodes[propertyId].name} renamed`,
                ],
                ["Move to root", "move"],
                ["Duplicate", "duplicate"],
                ["Save expected value", "expected", "expected"],
                ["Reset expected value", "reset-expected"],
                ["View", "view"],
                ["Remove", "remove"],
            ]) {
                const control = document.createElement("button"), run = () => {
                    void c.propertyAction(propertyId, action, value);
                };
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
            const compareLatest = () => {
                c.showPendingComparison();
                rerender();
            }, retryAction = () => c.retryCommand(), rejectAction = () => c.rejectCommand();
            compare.addEventListener("click", compareLatest);
            retry.addEventListener("click", retryAction);
            reject.addEventListener("click", rejectAction);
            own(compare, compareLatest);
            own(retry, retryAction);
            own(reject, rejectAction);
            host.append(compare, retry, reject);
        }
    }
    showProperty(propertyId) {
        this.#propertyMenuId = propertyId;
    }
    clearContext() {
        for (const dispose of this.#disposers.splice(0))
            dispose();
    }
    ownContext(dispose) {
        this.#disposers.push(dispose);
    }
    dispose() {
        this.clearContext();
        this.#propertyMenuId = undefined;
    }
}
//# sourceMappingURL=canonical-context-controls.js.map