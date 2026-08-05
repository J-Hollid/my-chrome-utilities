interface OutlineIdentity { id: string }
interface OutlineFrame extends OutlineIdentity { sectionId?: string }
interface OutlineOccurrence extends OutlineIdentity { pageFrameId?: string }

export interface FlowOutlineProjectionInput {
  sections: readonly OutlineIdentity[];
  frames: readonly OutlineFrame[];
  occurrences: readonly OutlineOccurrence[];
  relationships: readonly OutlineIdentity[];
}

export interface FlowOutlineFrameProjection {
  id: string;
  occurrenceIds: string[];
}

export interface FlowOutlineSectionProjection {
  id: string;
  frames: FlowOutlineFrameProjection[];
}

export interface FlowOutlineProjection {
  sections: FlowOutlineSectionProjection[];
  outsideFrameIds: string[];
  relationshipIds: string[];
}

export function flowOutlineProjection(input: FlowOutlineProjectionInput): FlowOutlineProjection {
  const frameProjection = ({ id }: OutlineFrame): FlowOutlineFrameProjection => ({
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
