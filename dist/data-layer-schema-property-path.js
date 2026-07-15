import { parseTargetExpression } from "./data-layer-recursive-property-tree.js";
function pointerToken(value) {
    return value.replaceAll("~", "~0").replaceAll("/", "~1");
}
export function canonicalRulePropertyPath(path) {
    const trimmed = path.trim();
    if (trimmed.startsWith("$")) {
        const segments = parseTargetExpression(trimmed).map((segment) => segment.kind === "property"
            ? pointerToken(segment.value)
            : segment.kind === "every" ? "*" : String(segment.value));
        return `/${segments.join("/")}`;
    }
    const segments = path.replaceAll(".", "/").split("/").map((segment) => segment.trim()).filter(Boolean);
    return `/${segments.join("/")}`;
}
//# sourceMappingURL=data-layer-schema-property-path.js.map