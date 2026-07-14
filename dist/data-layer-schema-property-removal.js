function segments(path) {
    return path.trim().replaceAll(".", "/").split("/").filter(Boolean);
}
function canonical(path) {
    return `/${segments(path).join("/")}`;
}
function propertyAt(document, path) {
    return path.reduce((current, segment) => current?.properties?.[segment], document);
}
function descendantPaths(property, prefix) {
    return Object.entries(property?.properties ?? {}).flatMap(([name, child]) => {
        const path = `${prefix}/${name}`;
        return [path, ...descendantPaths(child, path)];
    });
}
function normalizedRulePath(rule) {
    return canonical(rule.propertyPath ?? "");
}
export function inspectSchemaPropertyRemoval(document, attachedRules, path) {
    const propertyPath = canonical(path);
    const descendants = descendantPaths(propertyAt(document, segments(path)), propertyPath);
    const affectedRuleAttachments = attachedRules
        .filter((rule) => {
        const rulePath = normalizedRulePath(rule);
        return rulePath === propertyPath || rulePath.startsWith(`${propertyPath}/`);
    })
        .map((rule) => structuredClone(rule))
        .sort((left, right) => normalizedRulePath(left).localeCompare(normalizedRulePath(right)));
    return {
        propertyPath,
        descendants,
        affectedRuleAttachments,
        requiresConfirmation: descendants.length > 0 || affectedRuleAttachments.length > 0,
    };
}
function withoutReference(values, property) {
    return values ? values.filter((value) => value !== property) : undefined;
}
function removeAtPath(document, path) {
    const [name, ...rest] = path;
    if (!name)
        return structuredClone(document);
    const properties = structuredClone(document.properties ?? {});
    if (rest.length === 0) {
        delete properties[name];
    }
    else if (properties[name]) {
        const child = removeAtPath(properties[name], rest);
        if (child.propertyOrigin === "manual" && Object.keys(child.properties ?? {}).length === 0)
            delete properties[name];
        else
            properties[name] = child;
    }
    const required = withoutReference(document.required, name);
    const forbidden = withoutReference(document.forbidden, name);
    return {
        ...structuredClone(document),
        properties,
        ...(required === undefined ? {} : { required }),
        ...(forbidden === undefined ? {} : { forbidden }),
    };
}
export function removeSchemaProperty(document, attachedRules, path) {
    const propertyPath = canonical(path);
    const inspection = inspectSchemaPropertyRemoval(document, attachedRules, propertyPath);
    const affected = new Set(inspection.affectedRuleAttachments.map(normalizedRulePath));
    return {
        propertyPath,
        document: removeAtPath(document, segments(propertyPath)),
        attachedRules: attachedRules.filter((rule) => !affected.has(normalizedRulePath(rule))).map((rule) => structuredClone(rule)),
        previousDocument: structuredClone(document),
        previousAttachedRules: attachedRules.map((rule) => structuredClone(rule)),
    };
}
export function undoSchemaPropertyRemoval(removal) {
    return {
        document: structuredClone(removal.previousDocument),
        attachedRules: removal.previousAttachedRules.map((rule) => structuredClone(rule)),
    };
}
//# sourceMappingURL=data-layer-schema-property-removal.js.map