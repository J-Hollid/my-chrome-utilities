/** Computes one reviewed deletion without storage, DOM, or controller access. */
export function applySchemaDeletion(schemas, activeSchemaId, reviewed) {
    return {
        schemas: schemas.filter(({ id }) => id !== reviewed.id),
        clearSelection: activeSchemaId === reviewed.id,
        status: `Deleted ${reviewed.name}.`,
    };
}
//# sourceMappingURL=library-deletion-policy.js.map