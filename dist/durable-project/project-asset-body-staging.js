import { projectAssetBodyStorageKey } from "../project-asset-body-contribution.js";
export function createProjectAssetBodyStaging() {
    const pending = new Map();
    const remove = (items) => { for (const item of items) {
        const key = projectAssetBodyStorageKey(item.identity), current = pending.get(key);
        if (current?.stagingToken === item.stagingToken)
            pending.delete(key);
    } };
    return {
        stage(identity, body) { const key = projectAssetBodyStorageKey(identity); pending.set(key, { identity: structuredClone(identity), body: body.slice(0, body.size, body.type), stagingToken: crypto.randomUUID() }); },
        discard(identity) { pending.delete(projectAssetBodyStorageKey(identity)); },
        attach(projectId, bodies) { const selected = (bodies ?? [...pending.values()].filter(item => item.identity.projectId === projectId)).map(item => ({ ...structuredClone(item), body: item.body.slice(0, item.body.size, item.body.type) })); return { bodies: selected, commit: () => remove(selected), discard: () => remove(selected) }; },
    };
}
//# sourceMappingURL=project-asset-body-staging.js.map