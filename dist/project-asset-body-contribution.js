const safeSegment = (value, label) => { if (!/^[a-z0-9][a-z0-9._-]*$/u.test(value))
    throw new DOMException(`${label} is not a safe project asset-body segment.`, "DataError"); return value; };
export function projectAssetBodyStorageKey(identity) {
    if (identity.namespace === "flow-visual")
        return `${identity.projectId}:${identity.digest}`;
    return `${identity.projectId}:asset-body:${safeSegment(identity.namespace, "Asset-body namespace")}:${safeSegment(identity.digest, "Asset-body digest")}`;
}
export function projectAssetBodyArchiveEntry(input) {
    const digest = safeSegment(input.digest, "Asset-body digest"), extension = safeSegment(input.extension, "Asset-body extension");
    if (input.namespace === "flow-visual")
        return `assets/${digest}.${extension}`;
    return `assets/${safeSegment(input.namespace, "Asset-body namespace")}/${digest}.${extension}`;
}
//# sourceMappingURL=project-asset-body-contribution.js.map