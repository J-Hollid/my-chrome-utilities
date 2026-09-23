import { readStoredZip, writeStoredZip } from "../flow-visual-zip.js";
import { importFlowVisualArchive } from "../flow-visual-asset-portability.js";
import { isSharedProjectArchive, rebuildSharedProjectArchive } from "./shared-project-archive.js";
import { assertCompleteDomainInventory, COMPLETE_CONFIGURATION_DOMAINS, } from "./domain-inventory.js";
const encoder = new TextEncoder(), decoder = new TextDecoder();
const FORMAT = "my-chrome-utilities.complete-configuration";
const VERSION = 2;
export const DEFAULT_MAXIMUM_BYTES = 512 * 1024 * 1024;
export const COMPLETE_CONFIGURATION_EXCLUSIONS = [
    { id: "active-browser-context", reason: "Browser permissions and tab or window identities are device-local." },
    { id: "live-runtime-state", reason: "Live debugger, capture, replay, and connection state is not portable." },
    { id: "temporary-and-recovery-data", reason: "Caches, verification data, and raw migration recovery copies are excluded." },
    { id: "undo-redo-history", reason: "Window Undo and Redo history is temporary interface state." },
    { id: "working-view-state", reason: "Selected tabs, current filters, saved-session view position, and guided working drafts are local interface state." },
    { id: "live-validation-history", reason: "Recent live validation records are diagnostic history; saved defects are included separately." },
    { id: "legacy-project-projections", reason: "Legacy Flow and project storage projections are replaced by the durable project archive." },
];
async function sha256(bytes) {
    return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", Uint8Array.from(bytes).buffer)))
        .map((value) => value.toString(16).padStart(2, "0")).join("");
}
function jsonBytes(value) { return encoder.encode(JSON.stringify(value)); }
async function blobBytes(blob) { return new Uint8Array(await blob.arrayBuffer()); }
function bodyEntry(index) { return `bodies/${String(index).padStart(6, "0")}.bin`; }
export async function createCompleteConfigurationArchive(snapshot, input) {
    assertCompleteDomainInventory(snapshot.sections);
    if (!input.buildIdentity)
        throw new DOMException("The producer build identity is required.", "DataError");
    const sectionBodies = new Map();
    const sections = {};
    const counts = {};
    for (const domain of COMPLETE_CONFIGURATION_DOMAINS) {
        const bytes = jsonBytes(snapshot.sections[domain]);
        sectionBodies.set(domain, bytes);
        counts[domain] = snapshot.sections[domain].length;
        sections[domain] = { entry: `sections/${domain}.json`, count: counts[domain], digest: await sha256(bytes) };
    }
    const uniqueBodies = [];
    const identities = new Map();
    for (const body of snapshot.bodies) {
        const contentDigest = await sha256(body.bytes), prior = identities.get(body.digest);
        if (prior) {
            if (prior.contentDigest !== contentDigest || prior.body.mediaType !== body.mediaType) {
                throw new DOMException(`Configuration body ${body.digest} has conflicting content.`, "DataError");
            }
            continue;
        }
        identities.set(body.digest, { contentDigest, body });
        uniqueBodies.push(body);
    }
    const bodies = [], physicalBodies = new Map();
    for (const body of uniqueBodies) {
        const contentDigest = await sha256(body.bytes);
        let physical = physicalBodies.get(contentDigest);
        if (!physical) {
            physical = { entry: bodyEntry(physicalBodies.size), body };
            physicalBodies.set(contentDigest, physical);
        }
        bodies.push({ entry: physical.entry, digest: body.digest, contentDigest,
            mediaType: body.mediaType, byteLength: body.bytes.byteLength });
    }
    const manifest = { format: FORMAT, version: VERSION,
        producer: { buildIdentity: input.buildIdentity, createdAt: input.createdAt ?? new Date().toISOString() },
        requiredFeatures: [...input.requiredFeatures ?? []], activeProjectId: snapshot.activeProjectId,
        counts, domainVersions: Object.fromEntries(COMPLETE_CONFIGURATION_DOMAINS.map((domain) => [domain, 1])), sections, bodies,
        exclusions: COMPLETE_CONFIGURATION_EXCLUSIONS.map((value) => ({ ...value })) };
    const entries = [{ name: "manifest.json", body: new Blob([Uint8Array.from(jsonBytes(manifest)).buffer]) },
        ...COMPLETE_CONFIGURATION_DOMAINS.map((domain) => ({ name: sections[domain].entry,
            body: new Blob([Uint8Array.from(sectionBodies.get(domain)).buffer]) })),
        ...[...physicalBodies.values()].map(({ entry, body }) => ({ name: entry,
            body: new Blob([Uint8Array.from(body.bytes).buffer], { type: body.mediaType }) }))];
    const chunks = [];
    const maximumBytes = input.maximumBytes ?? DEFAULT_MAXIMUM_BYTES;
    let written = 0;
    await writeStoredZip(entries, { write: async (chunk) => {
            written += chunk.byteLength;
            if (written > maximumBytes) {
                throw new DOMException(`The configuration archive exceeds the ${maximumBytes} byte size limit.`, "QuotaExceededError");
            }
            chunks.push(chunk);
            input.onProgress?.(written);
        } }, { ...(input.signal ? { signal: input.signal } : {}) });
    return new Blob(chunks, { type: "application/zip" });
}
function parseManifest(value) {
    const manifest = value;
    if (manifest?.format !== FORMAT || (manifest.version !== 1 && manifest.version !== VERSION) || !manifest.sections || !manifest.counts ||
        !Array.isArray(manifest.bodies) || !manifest.domainVersions || !manifest.producer?.buildIdentity ||
        !Number.isFinite(Date.parse(manifest.producer.createdAt))) {
        throw new DOMException("The complete configuration manifest is invalid or unsupported.", "DataError");
    }
    const allowed = new Set(["format", "version", "producer", "requiredFeatures", "activeProjectId", "counts", "domainVersions", "sections", "bodies", "exclusions"]);
    const unknown = Object.keys(manifest).filter((key) => !allowed.has(key));
    if (unknown.length)
        throw new DOMException(`The configuration manifest has unknown domains: ${unknown.join(", ")}.`, "DataError");
    if (!Array.isArray(manifest.requiredFeatures) || manifest.requiredFeatures.some((feature) => typeof feature !== "string") || !Array.isArray(manifest.exclusions) ||
        (manifest.activeProjectId !== null && typeof manifest.activeProjectId !== "string"))
        throw new DOMException("The configuration manifest has invalid feature, exclusion, or active-project data.", "DataError");
    for (const [label, value] of [["sections", manifest.sections], ["counts", manifest.counts],
        ["domainVersions", manifest.domainVersions]]) {
        const domainKeys = Object.keys(value ?? {}), unknownDomains = domainKeys.filter((key) => !COMPLETE_CONFIGURATION_DOMAINS.includes(key));
        if (unknownDomains.length)
            throw new DOMException(`The configuration manifest ${label} has unknown domains: ${unknownDomains.join(", ")}.`, "DataError");
    }
    for (const domain of COMPLETE_CONFIGURATION_DOMAINS) {
        if (manifest.domainVersions[domain] !== 1)
            throw new DOMException(`The ${domain} section version is unsupported or missing.`, "NotSupportedError");
        const section = manifest.sections[domain];
        if (section?.entry !== `sections/${domain}.json` || !Number.isSafeInteger(section.count) ||
            section.count < 0 || typeof section.digest !== "string" || manifest.counts[domain] !== section.count) {
            throw new DOMException(`The ${domain} section descriptor is invalid.`, "DataError");
        }
    }
    for (const [index, body] of manifest.bodies.entries())
        if (!/^bodies\/\d{6}\.bin$/u.test(body?.entry ?? "") ||
            typeof body.digest !== "string" || !body.digest || typeof body.contentDigest !== "string" ||
            typeof body.mediaType !== "string" || !Number.isSafeInteger(body.byteLength) || body.byteLength < 0) {
            throw new DOMException(`The configuration body descriptor ${index} is invalid.`, "DataError");
        }
    return manifest;
}
function validateReferences(sections, bodies) {
    const records = new Set(Object.entries(sections).flatMap(([domain, items]) => items.map(({ id }) => `${domain}/${id}`)));
    const bodyIds = new Set(bodies.map(({ digest }) => digest));
    const scan = (value, key = "") => {
        if (Array.isArray(value)) {
            for (const item of value)
                scan(item, key);
            return;
        }
        if (!value || typeof value !== "object")
            return;
        for (const [name, item] of Object.entries(value)) {
            if (typeof item === "string" && /(?:bodyDigest|assetDigest|archiveDigest)$/u.test(name) && !bodyIds.has(item)) {
                throw new DOMException(`The configuration references missing body ${item}.`, "DataError");
            }
            scan(item, name);
        }
    };
    for (const [domain, items] of Object.entries(sections)) {
        for (const item of items) {
            for (const dependency of item.dependencies ?? [])
                if (!records.has(`${dependency.domain}/${dependency.id}`)) {
                    throw new DOMException(`The ${domain} record ${item.id} references missing ${dependency.domain}/${dependency.id}.`, "DataError");
                }
            scan(item.value);
        }
    }
}
export async function inspectCompleteConfigurationArchive(source, input = {}) {
    const entries = await readStoredZip(source, undefined, { ...(input.signal ? { signal: input.signal } : {}) });
    const manifestEntry = entries.get("manifest.json");
    if (!manifestEntry)
        throw new DOMException("The archive has no configuration manifest.", "DataError");
    const manifest = parseManifest(JSON.parse(decoder.decode(await blobBytes(manifestEntry))));
    const expectedEntries = new Set(["manifest.json", ...COMPLETE_CONFIGURATION_DOMAINS.map((domain) => manifest.sections[domain].entry), ...manifest.bodies.map(({ entry }) => entry)]);
    const unlisted = [...entries.keys()].filter((entry) => !expectedEntries.has(entry));
    if (unlisted.length || expectedEntries.size !== entries.size)
        throw new DOMException(`The configuration archive has unlisted or missing entries: ${unlisted.join(", ") || "check the manifest"}.`, "DataError");
    const supported = new Set(input.supportedFeatures ?? []), unsupported = manifest.requiredFeatures.filter((feature) => !supported.has(feature));
    if (unsupported.length)
        throw new DOMException(`The archive requires unsupported features: ${unsupported.join(", ")}.`, "NotSupportedError");
    const sections = {};
    for (const domain of COMPLETE_CONFIGURATION_DOMAINS) {
        const descriptor = manifest.sections[domain], entry = descriptor && entries.get(descriptor.entry);
        if (!entry)
            throw new DOMException(`The archive is missing the ${domain} section.`, "DataError");
        const bytes = await blobBytes(entry);
        if (await sha256(bytes) !== descriptor.digest)
            throw new DOMException(`The ${domain} section digest is invalid.`, "DataError");
        const records = JSON.parse(decoder.decode(bytes));
        if (!Array.isArray(records) || records.length !== descriptor.count || manifest.counts[domain] !== records.length) {
            throw new DOMException(`The ${domain} section count is invalid.`, "DataError");
        }
        sections[domain] = records;
    }
    assertCompleteDomainInventory(sections);
    const bodies = [], bodyCache = new Map();
    for (const descriptor of manifest.bodies) {
        const entry = entries.get(descriptor.entry);
        if (!entry)
            throw new DOMException(`The archive is missing body ${descriptor.digest}.`, "DataError");
        let bytes = bodyCache.get(descriptor.entry);
        if (!bytes) {
            bytes = await blobBytes(entry);
            bodyCache.set(descriptor.entry, bytes);
        }
        if (bytes.byteLength !== descriptor.byteLength || await sha256(bytes) !== descriptor.contentDigest) {
            throw new DOMException(`The body digest is invalid for ${descriptor.digest}.`, "DataError");
        }
        bodies.push({ digest: descriptor.digest, mediaType: descriptor.mediaType, bytes });
    }
    if (new Set(bodies.map(({ digest }) => digest)).size !== bodies.length)
        throw new DOMException("The archive has duplicate body identities.", "DataError");
    validateReferences(sections, bodies);
    const bodyByIdentity = new Map(bodies.map((body) => [body.digest, body]));
    for (const record of sections.projects) {
        const value = record.value;
        if (typeof value.archiveDigest !== "string")
            continue;
        const body = bodyByIdentity.get(value.archiveDigest);
        if (!body || typeof value.archiveContentDigest !== "string" || await sha256(body.bytes) !== value.archiveContentDigest) {
            throw new DOMException(`Project ${record.id} archive content digest is invalid.`, "DataError");
        }
        await importFlowVisualArchive(isSharedProjectArchive(body) ?
            await rebuildSharedProjectArchive(body, bodyByIdentity, input.signal) :
            new Blob([Uint8Array.from(body.bytes).buffer]));
    }
    return { manifest, snapshot: { activeProjectId: manifest.activeProjectId, sections, bodies } };
}
//# sourceMappingURL=archive-format.js.map