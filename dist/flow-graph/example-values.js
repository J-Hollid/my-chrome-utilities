export const pointerParts = (path) => path.split("/").filter(Boolean).map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"));
const compatibleContainer = (value, array) => array ? Array.isArray(value) : Boolean(value) && typeof value === "object" && !Array.isArray(value);
export const setAtPath = (payload, path, value) => {
    const parts = pointerParts(path);
    if (!parts.length)
        return;
    let parent = payload;
    for (let index = 0; index < parts.length; index += 1) {
        const part = parts[index], last = index === parts.length - 1, key = part === "*" ? 0 : part;
        if (last) {
            parent[key] = structuredClone(value);
            return;
        }
        const array = parts[index + 1] === "*", current = parent[key];
        if (!compatibleContainer(current, array))
            parent[key] = array ? [] : {};
        parent = parent[key];
    }
};
export const valueAtPath = (payload, path) => pointerParts(path).reduce((value, part) => {
    if (part === "*")
        return Array.isArray(value) ? value[0] : undefined;
    return value && typeof value === "object" && !Array.isArray(value) ? value[part] : undefined;
}, payload);
export const applicableExample = (constraint, occurrence, eventId, role) => !constraint.target || constraint.target === "all" || constraint.target === occurrence.id || constraint.target === eventId || constraint.target === (role === "context-setting" ? "context" : "interaction");
export const exampleEditHref = (flowId, occurrenceId, path) => `?kind=flow-page-instances&flow=${encodeURIComponent(flowId)}&entity=${encodeURIComponent(occurrenceId)}&field=${encodeURIComponent(`canonicalSchema.properties${path}.example`)}`;
//# sourceMappingURL=example-values.js.map