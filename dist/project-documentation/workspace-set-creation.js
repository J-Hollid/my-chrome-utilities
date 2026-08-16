import { createProjectDocumentationSet, createProjectDocumentationTheme } from "../data-layer-project-documentation-records.js";
export function createDefaultProjectDocumentationTheme(id, name) {
    return createProjectDocumentationTheme({ id, name: name.trim() || "Project theme", clientName: "", logo: "", colors: { heading: "#222222", accent: "#336699", stripe: "#f4f4f4" }, typography: { family: "Arial", headingSize: 16, bodySize: 11 }, density: "comfortable", borders: true, striping: true, highlightedHeadings: true, columnWidths: { Property: 28, Description: 48 }, headerText: "", footerText: "" });
}
export function appendProjectDocumentationSet(records, input) {
    const theme = createDefaultProjectDocumentationTheme(input.themeId, input.themeName), set = createProjectDocumentationSet({ id: input.setId, name: input.setName.trim() || "Client specification", themeId: theme.id, sections: [{ id: `${input.setId}:overview`, kind: "overview", name: "Overview", selected: true }, { id: `${input.setId}:matrix`, kind: "matrix", name: "Data capture matrix", selected: true, configuration: { contextIds: [] } }] });
    return { records: { sets: [...records.sets, set], themes: [...records.themes, theme] }, set, theme };
}
//# sourceMappingURL=workspace-set-creation.js.map