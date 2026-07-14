import { removePropertyDocumentation } from "./data-layer-schema-documentation.js";
function segments(path) {
    return path.replaceAll(".", "/").split("/").map((segment) => segment.trim()).filter(Boolean);
}
function canonical(path) {
    return `/${segments(path).join("/")}`;
}
function propertyAt(document, path) {
    return path.reduce((current, segment) => segment === "*" || /^\d+$/.test(segment)
        ? current?.items
        : current?.properties?.[segment], document);
}
function descendantPaths(property, prefix) {
    const propertyDescendants = Object.entries(property?.properties ?? {}).flatMap(([name, child]) => {
        const path = `${prefix}/${name}`;
        return [path, ...descendantPaths(child, path)];
    });
    if (!property?.items)
        return propertyDescendants;
    const itemPath = `${prefix}/*`;
    return [itemPath, ...descendantPaths(property.items, itemPath), ...propertyDescendants];
}
function normalizedRulePath(rule) {
    return canonical(rule.propertyPath ?? "");
}
export function inspectSchemaPropertyRemoval(document, attachedRules, path, documentation) {
    const propertyPath = canonical(path);
    const descendants = descendantPaths(propertyAt(document, segments(path)), propertyPath);
    const affectedRuleAttachments = attachedRules
        .filter((rule) => {
        const rulePath = normalizedRulePath(rule);
        return rulePath === propertyPath || rulePath.startsWith(`${propertyPath}/`);
    })
        .map((rule) => structuredClone(rule))
        .sort((left, right) => normalizedRulePath(left).localeCompare(normalizedRulePath(right)));
    const affectedDocumentationPaths = Object.keys(documentation?.properties ?? {})
        .filter((candidate) => candidate === propertyPath || candidate.startsWith(`${propertyPath}/`));
    return {
        propertyPath,
        descendants,
        affectedRuleAttachments,
        ...(documentation === undefined ? {} : { affectedDocumentationPaths }),
        requiresConfirmation: descendants.length > 0 || affectedRuleAttachments.length > 0 || affectedDocumentationPaths.length > 0,
    };
}
function withoutReference(values, property) {
    return values ? values.filter((value) => value !== property) : undefined;
}
function emptyManualContainer(document) {
    return document.propertyOrigin === "manual"
        && (document.type === "object" || document.type === "array")
        && Object.keys(document.properties ?? {}).length === 0
        && document.items === undefined;
}
function removeAtPath(document, path) {
    const [name, ...rest] = path;
    if (!name)
        return { document: structuredClone(document), removed: false };
    if (name === "*") {
        if (!document.items)
            return { document: structuredClone(document), removed: false };
        if (rest.length === 0) {
            const { items: _removed, ...withoutItems } = structuredClone(document);
            return { document: withoutItems, removed: true };
        }
        const child = removeAtPath(document.items, rest);
        if (!child.removed)
            return { document: structuredClone(document), removed: false };
        if (emptyManualContainer(child.document)) {
            const { items: _removed, ...withoutItems } = structuredClone(document);
            return { document: withoutItems, removed: true };
        }
        return { document: { ...structuredClone(document), items: child.document }, removed: true };
    }
    const properties = structuredClone(document.properties ?? {});
    let changed = false;
    let removedChild = false;
    if (rest.length === 0) {
        removedChild = name in properties;
        changed = removedChild;
        delete properties[name];
    }
    else if (properties[name]) {
        const child = removeAtPath(properties[name], rest);
        if (!child.removed)
            return { document: structuredClone(document), removed: false };
        changed = true;
        if (emptyManualContainer(child.document)) {
            delete properties[name];
            removedChild = true;
        }
        else
            properties[name] = child.document;
    }
    if (!changed)
        return { document: structuredClone(document), removed: false };
    const required = removedChild ? withoutReference(document.required, name) : document.required;
    const forbidden = removedChild ? withoutReference(document.forbidden, name) : document.forbidden;
    return {
        removed: true,
        document: {
            ...structuredClone(document),
            properties,
            ...(required === undefined ? {} : { required }),
            ...(forbidden === undefined ? {} : { forbidden }),
        },
    };
}
export function removeSchemaProperty(document, attachedRules, path, documentation) {
    const propertyPath = canonical(path);
    const inspection = inspectSchemaPropertyRemoval(document, attachedRules, propertyPath, documentation);
    const affected = new Set(inspection.affectedRuleAttachments.map(normalizedRulePath));
    return {
        propertyPath,
        document: removeAtPath(document, segments(propertyPath)).document,
        attachedRules: attachedRules.filter((rule) => !affected.has(normalizedRulePath(rule))).map((rule) => structuredClone(rule)),
        previousDocument: structuredClone(document),
        previousAttachedRules: attachedRules.map((rule) => structuredClone(rule)),
        ...(documentation === undefined ? {} : {
            documentation: removePropertyDocumentation(documentation, propertyPath),
            previousDocumentation: structuredClone(documentation),
        }),
    };
}
export function undoSchemaPropertyRemoval(removal) {
    return {
        document: structuredClone(removal.previousDocument),
        attachedRules: removal.previousAttachedRules.map((rule) => structuredClone(rule)),
        ...(removal.previousDocumentation === undefined ? {} : { documentation: structuredClone(removal.previousDocumentation) }),
    };
}
//# sourceMappingURL=data-layer-schema-property-removal.js.map