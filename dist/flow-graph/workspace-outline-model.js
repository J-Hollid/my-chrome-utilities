export function flowOutlineProjection(input) {
    const frameProjection = ({ id }) => ({
        id,
        occurrenceIds: input.occurrences.filter(({ pageFrameId }) => pageFrameId === id).map(({ id: occurrenceId }) => occurrenceId),
    });
    return {
        sections: input.sections.map(({ id }) => ({
            id,
            frames: input.frames.filter(({ sectionId }) => sectionId === id).map(frameProjection),
        })),
        outsideFrameIds: input.frames.filter(({ sectionId }) => !sectionId).map(({ id }) => id),
        relationshipIds: input.relationships.map(({ id }) => id),
    };
}
//# sourceMappingURL=workspace-outline-model.js.map