import { typedCanonicalValue } from "../data-layer-canonical-schema-facets.js";
const clone = (value) => structuredClone(value);
export function typedComposedValue(type, text, itemSchema) { return typedCanonicalValue(type, text, itemSchema); }
export function addComposedAllowedValue(draft, value) { return { ...draft, allowedValues: [...draft.allowedValues, clone(value)], ...(draft.allowedValueIds ? { allowedValueIds: [...draft.allowedValueIds, `allowed-value:${crypto.randomUUID()}`] } : {}) }; }
export function removeComposedAllowedValue(draft, index) { return { ...draft, allowedValues: draft.allowedValues.filter((_, candidate) => candidate !== index), ...(draft.allowedValueIds ? { allowedValueIds: draft.allowedValueIds.filter((_, candidate) => candidate !== index) } : {}) }; }
export function moveComposedAllowedValue(draft, index, delta) { const target = index + delta; if (target < 0 || target >= draft.allowedValues.length)
    return draft; const allowedValues = clone(draft.allowedValues); [allowedValues[index], allowedValues[target]] = [allowedValues[target], allowedValues[index]]; if (!draft.allowedValueIds)
    return { ...draft, allowedValues }; const allowedValueIds = [...draft.allowedValueIds]; [allowedValueIds[index], allowedValueIds[target]] = [allowedValueIds[target], allowedValueIds[index]]; return { ...draft, allowedValues, allowedValueIds }; }
//# sourceMappingURL=facet-values.js.map