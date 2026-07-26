import { focusedConditionLabel } from "./data-layer-focused-schema-property-ui.js";
import { renderSharedConditionTree } from "./data-layer-shared-condition-tree-editor.js";
/** Assign missing identities once; subsequent structural moves retain them. */
export const ensureComposedConditionIds = (condition, id = () => `condition:${crypto.randomUUID()}`) => {
    const withId = {
        ...condition,
        id: String(condition.id ?? id("condition")),
    };
    if (withId.kind !== "predicate") {
        withId.children = (Array.isArray(withId.children) ? withId.children : []).map((child) => ensureComposedConditionIds(child, id));
    }
    return withId;
};
export function renderComposedFocusedCondition(host, context) {
    const { dom } = context;
    const draft = context.getDraft();
    if (!draft)
        return;
    const summary = dom.createElement("p");
    const tree = dom.createElement("div");
    summary.setAttribute("aria-label", "Condition tree summary");
    summary.textContent = focusedConditionLabel(draft.condition);
    renderSharedConditionTree(tree, {
        dom,
        ...(draft.condition
            ? { condition: draft.condition }
            : {}),
        properties: () => context.model.rows.map(({ path, effective }) => ({
            id: effective.definitionId ?? path,
            name: path.split("/").filter(Boolean).at(-1) ?? path,
            ...(effective.type ? { type: effective.type } : {}),
        })),
        id: (kind) => `${kind}:${crypto.randomUUID()}`,
        onChange: (condition) => {
            if (condition) {
                draft.condition = condition;
            }
            else {
                draft.condition = { kind: "all", children: [] };
            }
            summary.textContent = focusedConditionLabel(condition);
        },
    });
    host.append(summary, tree);
}
//# sourceMappingURL=data-layer-composed-schema-workspace-focused-conditions.js.map