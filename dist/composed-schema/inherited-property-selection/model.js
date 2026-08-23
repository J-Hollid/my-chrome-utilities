export function inheritedPropertySelection(rows) {
    const items = rows.flatMap((row) => {
        const propertyId = row.inherited?.definitionId, assessment = row.exclusion;
        if (!propertyId || !assessment)
            return [];
        return [{
                propertyId,
                path: row.path,
                concept: String(row.inherited?.concept ?? "Ungrouped"),
                type: String(row.inherited?.type ?? "unspecified"),
                presence: String(row.inherited?.presence ?? "unspecified"),
                selected: !row.excluded,
                source: row.source,
                descendantPaths: assessment.allowed ? [...assessment.descendantPaths] : [],
                affectedPaths: assessment.allowed ? [...assessment.affectedPaths] : [row.path],
                blocked: !assessment.allowed,
                ...(!assessment.allowed ? { blocker: assessment.blocker, repairRoute: assessment.repairRoute } : {}),
            }];
    }).filter((item, index, all) => all.findIndex(({ propertyId }) => propertyId === item.propertyId) === index)
        .sort((left, right) => left.path.localeCompare(right.path));
    return { items, selectedCount: items.filter(({ selected }) => selected).length, totalCount: items.length };
}
export function entityWithInheritedPropertySelection(entity, selection, selectedPropertyIds) {
    const source = entity, selected = new Set(selectedPropertyIds), current = new Set(source.excludedPropertyIds ?? []);
    for (const item of selection.items) {
        if (item.blocked && !selected.has(item.propertyId))
            throw new Error(`${item.blocker} ${item.repairRoute}`);
        current.delete(item.propertyId);
    }
    const deselected = selection.items.filter(({ propertyId }) => !selected.has(propertyId));
    for (const item of deselected)
        if (!deselected.some((ancestor) => ancestor.path !== item.path && item.path.startsWith(`${ancestor.path}/`)))
            current.add(item.propertyId);
    const excludedPaths = selection.items.filter(({ propertyId }) => current.has(propertyId))
        .flatMap(({ path, descendantPaths }) => [path, ...descendantPaths]);
    const retain = (values) => Array.isArray(values) ? values.filter((constraint) => {
        const path = constraint?.path;
        return typeof path !== "string" || !excludedPaths.some((excluded) => path === excluded || path.startsWith(`${excluded}/`));
    }) : values;
    const next = { ...source, compiledTargetsStale: true };
    if (Array.isArray(source.localSchemaContributions))
        next.localSchemaContributions = retain(source.localSchemaContributions);
    if (Array.isArray(source.schemaConstraints))
        next.schemaConstraints = retain(source.schemaConstraints);
    if (current.size)
        next.excludedPropertyIds = [...current];
    else
        delete next.excludedPropertyIds;
    return next;
}
//# sourceMappingURL=model.js.map