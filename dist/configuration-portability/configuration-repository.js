const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const sameRecord = (left, right) => same(left.value, right.value) && same(left.dependencies ?? [], right.dependencies ?? []);
const clone = (value) => structuredClone(value);
const key = (domain, id) => `${domain}/${id}`;
const sameBody = (left, right) => left.mediaType === right.mediaType &&
    left.bytes.byteLength === right.bytes.byteLength && left.bytes.every((byte, index) => byte === right.bytes[index]);
const bodyReferences = (value) => {
    const digests = new Set();
    const visit = (item) => {
        if (Array.isArray(item)) {
            item.forEach(visit);
            return;
        }
        if (!item || typeof item !== "object")
            return;
        for (const [name, nested] of Object.entries(item)) {
            if (typeof nested === "string" && /(?:bodyDigest|assetDigest|archiveDigest)$/u.test(name))
                digests.add(nested);
            else
                visit(nested);
        }
    };
    visit(value);
    return digests;
};
const assertBodyIdentities = (source, target, protectedRecords) => {
    const local = new Map(target.bodies.map((body) => [body.digest, body]));
    for (const body of source.bodies) {
        const prior = local.get(body.digest);
        if (prior && !sameBody(prior, body) && protectedRecords.some((record) => bodyReferences(record.value).has(body.digest))) {
            throw new DOMException(`Configuration body ${body.digest} has different content in the recipient.`, "DataError");
        }
    }
};
const recordName = (record) => {
    const value = record.value;
    return value && typeof value === "object" && !Array.isArray(value) && typeof value.name === "string"
        ? value.name.trim().toLocaleLowerCase() : undefined;
};
function conflictInventory(source, target) {
    const conflicts = [];
    for (const [domain, records] of Object.entries(source.sections)) {
        const local = new Map(target.sections[domain].map((record) => [record.id, record]));
        for (const record of records) {
            const current = local.get(record.id);
            if (current) {
                if (!sameRecord(current, record))
                    conflicts.push({ ...clone(record), domain,
                        recipientId: current.id, reason: "identity" });
                continue;
            }
            if (!["projects", "savedSchemas", "eventLibraries", "documentationTemplates"].includes(domain))
                continue;
            const name = recordName(record);
            const named = name && target.sections[domain].find((candidate) => recordName(candidate) === name);
            if (named)
                conflicts.push({ ...clone(record), domain, recipientId: named.id, reason: "name" });
        }
    }
    return conflicts;
}
function skippedIncoming(source, conflicts) {
    const skipped = new Set(conflicts.map(({ domain, id }) => key(domain, id)));
    let changed = true;
    while (changed) {
        changed = false;
        for (const [domain, records] of Object.entries(source.sections)) {
            for (const record of records) {
                const own = key(domain, record.id);
                if (skipped.has(own))
                    continue;
                if ((record.dependencies ?? []).some((dependency) => skipped.has(key(dependency.domain, dependency.id)))) {
                    skipped.add(own);
                    changed = true;
                }
            }
        }
    }
    return skipped;
}
function mergeNonConflicting(source, target, conflicts) {
    const skipped = skippedIncoming(source, conflicts), next = clone(target);
    assertBodyIdentities(source, target, Object.entries(source.sections).flatMap(([domain, records]) => records.filter((record) => !skipped.has(key(domain, record.id)))));
    for (const [domain, records] of Object.entries(source.sections)) {
        const local = new Map(next.sections[domain].map((record) => [record.id, record]));
        for (const record of records)
            if (!skipped.has(key(domain, record.id)) && !local.has(record.id)) {
                next.sections[domain].push(clone(record));
            }
    }
    const digests = new Set(next.bodies.map(({ digest }) => digest));
    for (const body of source.bodies)
        if (!digests.has(body.digest)) {
            next.bodies.push(clone(body));
            digests.add(body.digest);
        }
    if (!next.activeProjectId && source.activeProjectId && next.sections.projects.some(({ id }) => id === source.activeProjectId)) {
        next.activeProjectId = source.activeProjectId;
    }
    return next;
}
function replaceAll(source, target, conflicts) {
    const replaced = new Set(conflicts.map(({ domain, recipientId }) => key(domain, recipientId)));
    const incoming = new Set(Object.entries(source.sections).flatMap(([domain, records]) => records.map(({ id }) => key(domain, id))));
    assertBodyIdentities(source, target, Object.entries(target.sections).flatMap(([domain, records]) => records.filter((record) => !replaced.has(key(domain, record.id)) &&
        !incoming.has(key(domain, record.id)))));
    for (const [domain, records] of Object.entries(target.sections)) {
        for (const record of records) {
            if (replaced.has(key(domain, record.id)))
                continue;
            const dependency = (record.dependencies ?? []).find((item) => replaced.has(key(item.domain, item.id)));
            if (dependency)
                throw new DOMException(`Replace all conflicts would rebind retained recipient content to ${dependency.id}.`, "InvalidStateError");
        }
    }
    const next = clone(target);
    for (const [domain, records] of Object.entries(source.sections)) {
        const incoming = new Map(records.map((record) => [record.id, record]));
        next.sections[domain] = next.sections[domain].filter(({ id }) => !incoming.has(id) && !replaced.has(key(domain, id)));
        next.sections[domain].push(...clone(records));
    }
    const incomingBodies = new Map(source.bodies.map((body) => [body.digest, body]));
    next.bodies = next.bodies.filter(({ digest }) => !incomingBodies.has(digest));
    next.bodies.push(...clone(source.bodies));
    const recipientActiveIsValid = Boolean(target.activeProjectId && next.sections.projects.some(({ id }) => id === target.activeProjectId));
    if (!recipientActiveIsValid && source.activeProjectId && next.sections.projects.some(({ id }) => id === source.activeProjectId)) {
        next.activeProjectId = source.activeProjectId;
    }
    return next;
}
export async function stageCompleteConfigurationSetup(inspected, repository) {
    const target = await repository.read(), source = clone(inspected.snapshot);
    const conflicts = conflictInventory(source, target);
    let finished = false;
    return {
        conflicts: clone(conflicts),
        skippedRecords: [...skippedIncoming(source, conflicts)],
        async commit(policy, options = {}) {
            if (finished)
                throw new Error("Configuration setup already finished.");
            if (!["cancel", "non-conflicting", "replace-all"].includes(policy))
                throw new DOMException("Choose a supported configuration conflict action.", "DataError");
            if (policy === "cancel") {
                finished = true;
                return "cancelled";
            }
            const next = policy === "non-conflicting" ? mergeNonConflicting(source, target, conflicts)
                : replaceAll(source, target, conflicts);
            if (same(next, target)) {
                finished = true;
                return "no-change";
            }
            options.signal?.throwIfAborted();
            await repository.commit(next, { ...options, expectedTarget: target });
            finished = true;
            return "committed";
        },
    };
}
//# sourceMappingURL=configuration-repository.js.map