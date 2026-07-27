export const composedSchemaRowOwnershipInput = (row) => ({
    inherited: Boolean(row.inherited),
    local: Object.keys(row.local).some((key) => key !== "path"),
    structureOwned: !row.inherited || Boolean(row.local.definitionId),
    overridden: row.action === "reset",
    invariant: row.effective.enforcement === "invariant",
    conflict: row.validationState === "blocked",
    replaceable: row.effective.enforcement === "overridable",
});
//# sourceMappingURL=data-layer-composed-schema-ownership.js.map