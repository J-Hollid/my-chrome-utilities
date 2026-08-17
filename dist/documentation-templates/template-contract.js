const commonBindings = [
    "document.title", "document.incomplete", "document.generatedAt",
    "project.name", "project.purpose", "project.website", "set.name",
    "section.name", "section.kind", "theme.name", "theme.clientName",
    "theme.headerText", "theme.footerText", "theme.logo",
    "table.columns", "table.rows", "table.concepts", "table.legend",
];
const kindBindings = {
    overview: ["overview.fields"],
    flow: ["flow.name", "flow.pages", "flow.columns", "flow.rows"],
    matrix: ["matrix.columns", "matrix.rows", "matrix.concepts", "matrix.legend"],
    profile: ["profile.name", "profile.rows", "profile.concepts"],
};
export const templateBindingsFor = (kind) => [...commonBindings, ...kindBindings[kind]];
export function templateValueAt(context, path) {
    return path.split(".").reduce((value, key) => value && typeof value === "object" && !Array.isArray(value) ? value[key] : undefined, context);
}
export function safeWorksheetName(raw) {
    const base = String(raw ?? "").replace(/[\\/*?:[\]]/gu, " ").replace(/\s+/gu, " ").replace(/^'+|'+$/gu, "").trim() || "Documentation";
    return base.slice(0, 31);
}
export function templateDigest(prefix, value) {
    let hash = 2166136261;
    for (const byte of new TextEncoder().encode(JSON.stringify(value))) {
        hash ^= byte;
        hash = Math.imul(hash, 16777619);
    }
    return `${prefix}:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
//# sourceMappingURL=template-contract.js.map