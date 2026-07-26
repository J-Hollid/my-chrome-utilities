import { focusedConditionLabel } from "./data-layer-focused-schema-property-ui.js";
import { renderSharedConditionTree } from "./data-layer-shared-condition-tree-editor.js";
export function renderCanonicalFocusedCondition(host, context) {
    const { dom } = context;
    const working = context.getWorking();
    if (!working)
        return;
    const summary = dom.createElement("p");
    const tree = dom.createElement("div");
    summary.setAttribute("aria-label", "Condition tree summary");
    summary.textContent = focusedConditionLabel(working.presence.condition);
    renderSharedConditionTree(tree, {
        dom,
        ...(working.presence.condition
            ? { condition: working.presence.condition }
            : {}),
        properties: () => Object.values(context.current().nodes).map(({ id, name, type }) => ({
            id,
            name,
            type,
        })),
        id: context.id,
        onChange: (condition) => {
            if (condition) {
                working.presence = { ...working.presence, condition };
            }
            else {
                const { condition: _condition, ...presence } = working.presence;
                working.presence = presence;
            }
            summary.textContent = focusedConditionLabel(condition);
        },
    });
    host.append(summary, tree);
}
//# sourceMappingURL=data-layer-canonical-schema-focused-conditions.js.map