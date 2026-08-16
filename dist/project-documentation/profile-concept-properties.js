import { canonicalConstraints, canonicalRequirements } from "../data-layer-canonical-schema.js";
export function projectDocumentationProfileConceptProperties(profile) {
    const requirements = profile.canonicalSchema ? canonicalRequirements(profile.canonicalSchema) : profile.requirements;
    if (!profile.canonicalSchema)
        return requirements.map(({ path }) => ({ path }));
    const concepts = new Map(canonicalConstraints(profile.canonicalSchema).map(({ path, concept }) => [path, concept]));
    return requirements.map(({ path }) => ({ path, concept: concepts.get(path) }));
}
export function projectDocumentationProfilePaths(profile) { return projectDocumentationProfileConceptProperties(profile).map(({ path }) => path); }
//# sourceMappingURL=profile-concept-properties.js.map