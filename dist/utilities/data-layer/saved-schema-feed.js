const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
export function reconcileSavedSchemaFeed(input) {
    const { baseline, draft, incoming } = input;
    if (!draft)
        return incoming ? { mode: "install", baseline: structuredClone(incoming) } : { mode: "unchanged" };
    if (!baseline)
        return { mode: "unknown", draft: structuredClone(draft) };
    const editable = input.editableProjection ?? ((schema) => schema), project = (schema) => editable(input.cleanProjection(schema)), draftProjection = editable(draft), clean = same(draftProjection, project(baseline)), remoteChanged = !same(incoming, baseline);
    if (!remoteChanged)
        return { mode: "unchanged", draft: structuredClone(draft), baseline: structuredClone(baseline) };
    if (incoming && same(draftProjection, project(incoming)))
        return { mode: "install", draft: input.cleanProjection(incoming), baseline: structuredClone(incoming) };
    if (!clean)
        return { mode: "conflict", draft: structuredClone(draft), baseline: structuredClone(baseline), ...(incoming ? { incoming: structuredClone(incoming) } : {}) };
    return incoming ? { mode: "install", draft: input.cleanProjection(incoming), baseline: structuredClone(incoming) } : { mode: "close" };
}
//# sourceMappingURL=saved-schema-feed.js.map