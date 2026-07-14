export function canonicalRulePropertyPath(path) {
    const segments = path.replaceAll(".", "/").split("/").map((segment) => segment.trim()).filter(Boolean);
    return `/${segments.join("/")}`;
}
//# sourceMappingURL=data-layer-schema-property-path.js.map