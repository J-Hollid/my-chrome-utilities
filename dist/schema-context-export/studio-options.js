export function studioCanonicalExportSource(options, pending) {
    return () => { const canonical = options.load(); return { key: canonical.id, name: canonical.contributorName, role: options.host.dataset.schemaContributorScope ?? "Shared Profile", context: "", version: "Draft", canonical, pending: pending() }; };
}
//# sourceMappingURL=studio-options.js.map