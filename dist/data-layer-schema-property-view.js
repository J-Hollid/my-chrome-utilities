function parentRowPath(path, paths) {
    let boundary = path.lastIndexOf("/");
    while (boundary > 0) {
        const candidate = path.slice(0, boundary);
        if (paths.has(candidate))
            return candidate;
        boundary = candidate.lastIndexOf("/");
    }
    return undefined;
}
export function filterAndSortSchemaPropertyRows(sourceRows, query, sortOrder) {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const allPaths = new Set(sourceRows.map(({ canonicalPath }) => canonicalPath));
    const matches = new Set(sourceRows
        .filter(({ canonicalPath, displayPath }) => !normalizedQuery
        || canonicalPath.toLocaleLowerCase().includes(normalizedQuery)
        || displayPath.toLocaleLowerCase().includes(normalizedQuery))
        .map(({ canonicalPath }) => canonicalPath));
    const contexts = new Set();
    if (normalizedQuery)
        for (const path of matches) {
            let parent = parentRowPath(path, allPaths);
            while (parent) {
                if (!matches.has(parent))
                    contexts.add(parent);
                parent = parentRowPath(parent, allPaths);
            }
        }
    const visiblePaths = normalizedQuery ? new Set([...matches, ...contexts]) : allPaths;
    const sourceIndex = new Map(sourceRows.map((row, index) => [row.canonicalPath, index]));
    const rowByPath = new Map(sourceRows.map((row) => [row.canonicalPath, row]));
    const children = new Map();
    for (const row of sourceRows) {
        if (!visiblePaths.has(row.canonicalPath))
            continue;
        const parent = parentRowPath(row.canonicalPath, allPaths);
        children.set(parent, [...(children.get(parent) ?? []), row.canonicalPath]);
    }
    const compare = (left, right) => {
        if (sortOrder === "schema")
            return sourceIndex.get(left) - sourceIndex.get(right);
        const leftName = left.slice(left.lastIndexOf("/") + 1);
        const rightName = right.slice(right.lastIndexOf("/") + 1);
        const order = leftName.localeCompare(rightName, undefined, { sensitivity: "base" });
        return sortOrder === "name-asc" ? order : -order;
    };
    const ordered = [];
    const append = (parent) => {
        for (const path of [...(children.get(parent) ?? [])].sort(compare)) {
            ordered.push({ ...rowByPath.get(path), filterContext: contexts.has(path) });
            append(path);
        }
    };
    append(undefined);
    return {
        rows: ordered,
        matchCount: normalizedQuery ? matches.size : sourceRows.length,
        contextCount: contexts.size,
        totalCount: sourceRows.length,
    };
}
//# sourceMappingURL=data-layer-schema-property-view.js.map