import { canonicalPropertyPath } from "./data-layer-canonical-schema.js";
import { applyCanonicalAtCurrent } from "./canonical-schema/commands-apply.js";
const clone = (value) => structuredClone(value);
const affectedPropertyIds = (command) => "propertyId" in command ? [command.propertyId] : command.kind === "add" && command.parentId ? [command.parentId] : [];
export function canonicalCommandOutcome(command, result, prior) {
    const label = (() => { if (command.kind !== "set")
        return { add: "property addition", rename: "name", move: "position", duplicate: "property duplication", delete: "property removal", type: "type", policy: "defined-fields policy", select: "selection", view: "view" }[command.kind]; const facets = Object.keys(command.patch), names = { allowedValues: "allowed values", expectedValue: "expected value", overrideReferences: "override references" }; return facets.length === 1 ? (names[facets[0]] ?? facets[0]) : "property facets"; })();
    const propertyId = "propertyId" in command ? command.propertyId : command.kind === "add" ? result.document.selectedPropertyId : undefined, path = propertyId ? (() => { const source = result.document.nodes[propertyId] ? result.document : prior; try {
        return canonicalPropertyPath(source, propertyId);
    }
    catch {
        return undefined;
    } })() : undefined, scope = path ? ` for ${path}` : command.kind === "add" ? ` for ${command.name}` : "";
    return `${result.status === "rebased" ? `Rebased ${label}${scope} from Schema revision ${command.baseRevision}` : `Saved ${label}${scope}`} at Schema revision ${result.document.revision}.`;
}
export function applyCanonicalCommand(document, command) {
    if (command.baseRevision === document.revision)
        return applyCanonicalAtCurrent(document, command);
    if (command.baseRevision > document.revision)
        return { status: "conflict", document, message: `Base revision ${command.baseRevision} is newer than ${document.revision}.` };
    const touched = new Set((document.changes ?? []).filter(({ revision }) => revision > command.baseRevision).flatMap(({ propertyIds }) => propertyIds)), affected = affectedPropertyIds(command), conflicting = affected.find((id) => touched.has(id));
    if (conflicting)
        return { status: "conflict", document, propertyId: conflicting, message: `Property ${canonicalPropertyPath(document, conflicting)} changed after revision ${command.baseRevision}; review only this command.` };
    if (!document.changes)
        return { status: "conflict", document, message: "This command uses an older Schema revision; reload the current Draft and retry through its opaque repository token." };
    const result = applyCanonicalAtCurrent(document, { ...command, baseRevision: document.revision });
    return result.status === "applied" ? { ...result, status: "rebased" } : result;
}
export function addCanonicalProperty(document, command) { return applyCanonicalCommand(document, { kind: "add", ...command }); }
export function renameCanonicalProperty(document, command) { return applyCanonicalCommand(document, { kind: "rename", ...command }); }
export function setCanonicalProperty(document, command) { return applyCanonicalCommand(document, { kind: "set", ...command }); }
export function changeCanonicalPropertyType(document, command) { return applyCanonicalCommand(document, { kind: "type", ...command }); }
export function createCanonicalRepository(initial) { let current = clone(initial); const listeners = new Set(); return { current: () => clone(current), subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }, dispatch(command) { const result = applyCanonicalCommand(current, command); if (result.status === "applied" || result.status === "rebased") {
        current = result.document;
        for (const listener of listeners)
            listener(clone(current));
    } return result; } }; }
//# sourceMappingURL=data-layer-canonical-schema-commands.js.map