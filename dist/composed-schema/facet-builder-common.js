import { addComposedAllowedValue, reconcileComposedAllowedValues, removeComposedAllowedValue, typedComposedValue } from "../data-layer-composed-schema-builders.js";
import { button, clone, labeled, option } from "./facet-builder-context.js";
import { renderLocalDraftReorderControl as renderReorderControl, renderReorderableItemRow } from "../reorderable-editor/control.js";
import { reorderValues } from "../reorderable-editor/model.js";
export function renderCommonFacets(context) {
    const { options, draft, setDraft, setFeedback, render } = context, common = document.createElement("fieldset"), legend = document.createElement("legend"), type = document.createElement("select"), presence = document.createElement("select"), expected = document.createElement("input"), documentation = document.createElement("textarea");
    legend.textContent = `Common facets for ${options.path}`;
    type.append(option("", "Inherit type"), ...["string", "number", "integer", "boolean", "object", "array", "null"].map((value) => option(value)));
    presence.append(option("", "Inherit presence"), ...["required", "optional", "forbidden", "permitted"].map((value) => option(value)));
    type.value = draft().type ?? "";
    presence.value = draft().presence ?? "";
    expected.value = draft().expectedValue === undefined ? "" : String(draft().expectedValue);
    documentation.value = draft().documentation;
    type.addEventListener("change", () => setDraft({ ...draft(), type: type.value || undefined }));
    presence.addEventListener("change", () => setDraft({ ...draft(), presence: presence.value || undefined }));
    expected.addEventListener("change", () => { try {
        setDraft({ ...draft(), expectedValue: expected.value === "" ? undefined : typedComposedValue(type.value || options.effective.type, expected.value) });
        setFeedback("");
    }
    catch (error) {
        setFeedback(error instanceof Error ? error.message : String(error));
        render();
    } });
    documentation.addEventListener("input", () => setDraft({ ...draft(), documentation: documentation.value }));
    common.append(legend, labeled("Type", type), labeled("Presence", presence), labeled("Expected value", expected), labeled("Documentation", documentation));
    return common;
}
export function renderAllowedValues(context) {
    const { options, draft, setDraft, setFeedback, render, allowedValueIdentities } = context, allowed = document.createElement("fieldset"), legend = document.createElement("legend"), rows = document.createElement("div");
    const stableIds = allowedValueIdentities.reconcile(draft().allowedValues.length), identity = (_entry, index) => stableIds[index];
    allowed.setAttribute("aria-label", "Composed allowed values builder");
    legend.textContent = "Allowed values";
    draft().allowedValues.forEach((entry, index) => {
        const row = document.createElement("div"), value = document.createElement("input"), itemId = identity(entry, index), reorder = renderReorderControl({ focusScopeId: `composed-allowed-values:${options.path}`, itemId, itemLabel: `Allowed value ${String(entry ?? "") || index + 1}`, completeOrder: draft().allowedValues.map((candidate, candidateIndex) => ({ id: identity(candidate, candidateIndex), label: `Allowed value ${String(candidate ?? "") || candidateIndex + 1}` })), dropTarget: row, orderedContainer: rows, onMove: ({ itemId, toIndex }) => { const current = draft(), currentIds = allowedValueIdentities.values(), currentIdentity = (_entry, candidateIndex) => currentIds[candidateIndex], allowedValues = reorderValues(current.allowedValues, itemId, toIndex, currentIdentity), allowedValueIds = current.allowedValueIds ? reorderValues(current.allowedValueIds, itemId, toIndex, currentIdentity) : undefined, fromIndex = currentIds.indexOf(itemId); allowedValueIdentities.move(fromIndex, toIndex); setDraft({ ...current, allowedValues, ...(allowedValueIds ? { allowedValueIds } : {}) }); render(); return true; } });
        value.value = String(entry ?? "");
        value.setAttribute("aria-label", `Allowed value ${index + 1}`);
        value.addEventListener("change", () => { try {
            const next = clone(draft().allowedValues);
            next[index] = typedComposedValue(options.effective.type, value.value);
            setDraft(reconcileComposedAllowedValues(draft(), next, draft().allowedValueIds));
            setFeedback("");
        }
        catch (error) {
            setFeedback(error instanceof Error ? error.message : String(error));
            render();
        } });
        row.append(renderReorderableItemRow({ control: reorder, primaryContent: labeled(`Value ${index + 1}`, value), trailingContent: button("Remove", () => { allowedValueIdentities.remove(index); const next = removeComposedAllowedValue(draft(), index); setDraft(reconcileComposedAllowedValues(next, next.allowedValues, next.allowedValueIds)); render(); }) }));
        rows.append(row);
    });
    allowed.append(legend, rows, button("Add allowed value", () => { const type = options.effective.type, defaultValue = type === "number" || type === "integer" ? 0 : type === "boolean" ? false : type === "null" ? null : ""; allowedValueIdentities.append(); setDraft(addComposedAllowedValue(draft(), defaultValue)); render(); }));
    return allowed;
}
//# sourceMappingURL=facet-builder-common.js.map