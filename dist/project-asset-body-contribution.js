const safeSegment = (value, label) => {
    if (!/^[a-z0-9][a-z0-9._-]*$/u.test(value)) {
        throw new DOMException(`${label} is not a safe project asset-body segment.`, "DataError");
    }
    return value;
};
const safeDigestSegment = (value) => /^sha256:[0-9a-f]{64}$/u.test(value) ? value.slice("sha256:".length) : safeSegment(value, "Asset-body digest");
export function projectAssetBodyStorageKey(identity) {
    if (identity.namespace === "flow-visual")
        return `${identity.projectId}:${identity.digest}`;
    const namespace = safeSegment(identity.namespace, "Asset-body namespace");
    const digest = safeDigestSegment(identity.digest);
    return `${identity.projectId}:asset-body:${namespace}:${digest}`;
}
export function projectAssetBodyArchiveEntry(input) {
    const digest = safeDigestSegment(input.digest);
    const extension = safeSegment(input.extension, "Asset-body extension");
    if (input.namespace === "flow-visual")
        return `assets/${digest}.${extension}`;
    const namespace = safeSegment(input.namespace, "Asset-body namespace");
    return `assets/${namespace}/${digest}.${extension}`;
}
//# sourceMappingURL=project-asset-body-contribution.js.map