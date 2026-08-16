const conceptKey = (value) => value?.trim().toLocaleLowerCase() || "ungrouped";
export function profileConceptPresentation(input) {
    const selected = new Set(input.selectedPaths), query = input.query.trim().toLocaleLowerCase(), byConcept = new Map();
    for (const property of input.properties) {
        const key = conceptKey(property.concept), items = byConcept.get(key) ?? [];
        items.push(property);
        byConcept.set(key, items);
    }
    const visible = (included, override) => input.filter === "all" || (input.filter === "included" ? included : input.filter === "excluded" ? !included : override);
    const concepts = input.concepts.flatMap((concept) => {
        const items = (byConcept.get(conceptKey(concept.name)) ?? []).slice().sort((left, right) => left.path.localeCompare(right.path)), nameMatches = concept.name.toLocaleLowerCase().includes(query), matching = items.filter(({ path }) => {
            const included = selected.has(path), override = included !== concept.included;
            return visible(included, override) && (!query || nameMatches || path.toLocaleLowerCase().includes(query));
        }).length;
        return query && !nameMatches && !matching ? [] : [{ name: concept.name, setIncluded: concept.included, total: items.length, included: items.filter(({ path }) => selected.has(path)).length, matching }];
    });
    const active = input.activeConcept ? input.concepts.find(({ name }) => conceptKey(name) === conceptKey(input.activeConcept)) : undefined, properties = active ? (byConcept.get(conceptKey(active.name)) ?? []).slice().sort((left, right) => left.path.localeCompare(right.path)).flatMap(({ path }) => {
        const included = selected.has(path), override = included !== active.included, nameMatches = active.name.toLocaleLowerCase().includes(query);
        return visible(included, override) && (!query || nameMatches || path.toLocaleLowerCase().includes(query)) ? [{ path, included, override }] : [];
    }) : [];
    return { concepts, properties };
}
export function updateProfileConceptPaths(allPaths, selectedPaths, conceptPaths, action, setIncluded) {
    const selected = new Set(selectedPaths), affected = new Set(conceptPaths), include = action === "include-all" || (action === "reset" && setIncluded);
    for (const path of affected)
        include ? selected.add(path) : selected.delete(path);
    return allPaths.filter((path) => selected.has(path));
}
//# sourceMappingURL=workspace-profile-concepts.js.map