import { record } from "./contract.js";
export function materializeAgentFlow(input, previous) {
    if (!record(input) || !Array.isArray(input.pageFrames) || !Array.isArray(input.occurrences) || !Array.isArray(input.relationships))
        throw new Error("Flow graph needs pageFrames, occurrences, and relationships.");
    const graph = { ...(record(previous) ? structuredClone(previous) : {}), ...structuredClone(input), sections: input.sections ?? [] };
    for (const key of ["pageFrames", "occurrences", "relationships"]) {
        const ids = new Set(), prior = record(previous) && Array.isArray(previous[key]) ? previous[key] : [];
        graph[key] = input[key].map(item => {
            if (!record(item) || typeof item.id !== "string" || !item.id || ids.has(item.id))
                throw new Error(`Flow ${key} needs distinct stable identities.`);
            ids.add(item.id);
            const old = prior.find((value) => record(value) && value.id === item.id), merged = { ...(record(old) ? old : {}), ...item };
            // Drafting an event must not discard its existing screenshot attachment.
            if (record(old) && old.conceptVisual)
                merged.conceptVisual = structuredClone(old.conceptVisual);
            if (key !== "relationships" && (!record(merged.position) || (merged.position.x !== undefined && !Number.isFinite(merged.position.x)) || !Number.isFinite(merged.position.y)))
                throw new Error("A flow item needs a finite position.");
            if (key === "occurrences") {
                if (!["Required", "Optional", "Conditional", "Informational"].includes(String(merged.obligation)))
                    throw new Error("A flow occurrence has an invalid obligation.");
                if (!Number.isInteger(merged.minimum) || !Number.isInteger(merged.maximum) || Number(merged.minimum) < 0 || Number(merged.maximum) < Number(merged.minimum))
                    throw new Error("A flow occurrence has invalid count bounds.");
            }
            return merged;
        });
    }
    return graph;
}
//# sourceMappingURL=flow.js.map