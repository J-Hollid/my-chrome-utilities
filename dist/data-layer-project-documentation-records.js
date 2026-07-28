const clone = (value) => structuredClone(value);
const freeze = (value) => { if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value))
        freeze(child);
} return value; };
export const projectDocumentationSafeText = (value) => String(value ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/gu, "").trim();
const safeColor = (value, fallback) => /^#[0-9a-f]{6}$/iu.test(String(value)) ? String(value).toLowerCase() : fallback;
const safeFamily = (value) => { const candidate = projectDocumentationSafeText(value); return /^[\p{L}\p{N}][\p{L}\p{N} .-]{0,63}$/u.test(candidate) ? candidate : "Arial"; };
const safeLogo = (value) => { const candidate = projectDocumentationSafeText(value); return /^data:image\/(?:png|jpeg|gif);base64,[a-z0-9+/]+={0,2}$/iu.test(candidate) && candidate.length <= 250_000 ? candidate : ""; };
const safeId = (value, label) => { const candidate = projectDocumentationSafeText(value); if (!candidate)
    throw new Error(`${label} needs a stable identity.`); return candidate; };
const safeList = (value) => value ? [...new Set(value.map(projectDocumentationSafeText).filter(Boolean))] : undefined;
export function createProjectDocumentationTheme(input) {
    const widths = Object.fromEntries(Object.entries(input.columnWidths ?? {}).flatMap(([key, value]) => Number.isFinite(value) && value > 0 ? [[projectDocumentationSafeText(key), Math.min(120, Math.max(4, Number(value)))]] : []));
    return freeze({
        id: safeId(input.id, "Documentation theme"),
        name: projectDocumentationSafeText(input.name) || "Project theme",
        clientName: projectDocumentationSafeText(input.clientName),
        logo: safeLogo(input.logo),
        colors: { heading: safeColor(input.colors?.heading, "#222222"), accent: safeColor(input.colors?.accent, "#666666"), stripe: safeColor(input.colors?.stripe, "#f4f4f4") },
        typography: { family: safeFamily(input.typography?.family), headingSize: Math.min(32, Math.max(8, Number(input.typography?.headingSize) || 16)), bodySize: Math.min(24, Math.max(7, Number(input.typography?.bodySize) || 11)) },
        density: input.density === "compact" ? "compact" : "comfortable",
        borders: Boolean(input.borders),
        striping: Boolean(input.striping),
        highlightedHeadings: Boolean(input.highlightedHeadings),
        columnWidths: widths,
        headerText: projectDocumentationSafeText(input.headerText),
        footerText: projectDocumentationSafeText(input.footerText),
    });
}
export function createProjectDocumentationSet(input) {
    const seen = new Set(), sections = input.sections.map((raw) => { const section = clone(raw), id = safeId(section.id, "Documentation section"); if (seen.has(id))
        throw new Error(`Duplicate documentation section ${id}.`); seen.add(id); if (section.kind !== "overview" && section.kind !== "matrix" && !section.targetId)
        throw new Error(`${section.kind} section ${id} needs a stable target.`); const paths = safeList(section.configuration?.paths), contextIds = safeList(section.configuration?.contextIds), columns = safeList(section.configuration?.columns), labels = section.configuration?.labels ? Object.fromEntries(Object.entries(section.configuration.labels).map(([key, value]) => [projectDocumentationSafeText(key), projectDocumentationSafeText(value)]).filter(([key]) => Boolean(key))) : undefined, configuration = section.configuration ? { ...(paths ? { paths } : {}), ...(contextIds ? { contextIds } : {}), ...(columns ? { columns } : {}), ...(labels ? { labels } : {}) } : undefined; return { id, kind: section.kind, name: projectDocumentationSafeText(section.name), ...(section.targetId ? { targetId: projectDocumentationSafeText(section.targetId) } : {}), selected: Boolean(section.selected), ...(configuration ? { configuration } : {}) }; });
    if (sections.filter(({ kind }) => kind === "matrix").length !== 1)
        throw new Error("A Documentation Set needs exactly one project capture matrix.");
    const conceptKeys = new Set(), concepts = (input.concepts ?? []).flatMap(({ name, included }) => { const display = projectDocumentationSafeText(name) || "Ungrouped", key = display.toLocaleLowerCase(); if (conceptKeys.has(key))
        return []; conceptKeys.add(key); return [{ name: display, included: Boolean(included) }]; });
    return freeze({ id: safeId(input.id, "Documentation Set"), name: projectDocumentationSafeText(input.name) || "Documentation Set", themeId: safeId(input.themeId, "Documentation theme reference"), sections, ...(concepts.length ? { concepts } : {}), ...(input.includeConceptSubheadings ? { includeConceptSubheadings: true } : {}) });
}
export function serializeProjectDocumentationTheme(theme) {
    const safe = createProjectDocumentationTheme(theme), { id: _id, ...values } = safe;
    return JSON.stringify({ format: "my-chrome-utilities.documentation-theme", version: 1, theme: values }, null, 2);
}
export function parseProjectDocumentationTheme(serialized, input) {
    const parsed = JSON.parse(serialized);
    if (parsed.format !== "my-chrome-utilities.documentation-theme" || parsed.version !== 1 || !parsed.theme)
        throw new Error("Paste a version 1 structured Documentation theme.");
    const source = parsed.theme;
    return createProjectDocumentationTheme({
        id: input.id,
        name: input.name ?? String(source.name ?? "Copied theme"),
        clientName: String(source.clientName ?? ""),
        logo: String(source.logo ?? ""),
        colors: { heading: String(source.colors?.heading ?? ""), accent: String(source.colors?.accent ?? ""), stripe: String(source.colors?.stripe ?? "") },
        typography: { family: String(source.typography?.family ?? ""), headingSize: Number(source.typography?.headingSize), bodySize: Number(source.typography?.bodySize) },
        density: source.density === "compact" ? "compact" : "comfortable",
        borders: Boolean(source.borders),
        striping: Boolean(source.striping),
        highlightedHeadings: Boolean(source.highlightedHeadings),
        columnWidths: typeof source.columnWidths === "object" && source.columnWidths ? source.columnWidths : {},
        headerText: String(source.headerText ?? ""),
        footerText: String(source.footerText ?? ""),
    });
}
//# sourceMappingURL=data-layer-project-documentation-records.js.map