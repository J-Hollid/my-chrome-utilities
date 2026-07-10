export const HOTKEY_KEYMAP_SCHEMA_VERSION = 1;
export const HOTKEY_KEYMAP_STORAGE_KEY = "my-chrome-utilities.hotkey-keymap.v1";
function commandIds(commands) {
    return commands.map((command) => command.id);
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function sequenceTokens(sequence) {
    const normalized = normalizeKeySequence(sequence);
    return normalized ? normalized.split(" ") : [];
}
function sequenceStartsWith(sequence, prefix) {
    return prefix.every((token, index) => sequence[index] === token);
}
export function normalizeKeySequence(sequence) {
    return sequence.trim().replace(/\s+/g, " ");
}
export function blankHotkeyKeymap(commands) {
    return {
        schemaVersion: HOTKEY_KEYMAP_SCHEMA_VERSION,
        bindings: Object.fromEntries(commandIds(commands).map((commandId) => [commandId, ""])),
    };
}
export function updateHotkeyKeymap(existing, commands) {
    const ids = commandIds(commands);
    const registeredIds = new Set(ids);
    const existingBindings = isRecord(existing.bindings) ? existing.bindings : {};
    const existingIds = new Set(Object.keys(existingBindings));
    const bindings = {};
    const added = [];
    for (const commandId of ids) {
        const binding = existingBindings[commandId];
        bindings[commandId] =
            typeof binding === "string" ? normalizeKeySequence(binding) : "";
        if (!existingIds.has(commandId)) {
            added.push(commandId);
        }
    }
    return {
        keymap: {
            schemaVersion: HOTKEY_KEYMAP_SCHEMA_VERSION,
            bindings,
        },
        added,
        removed: [...existingIds]
            .filter((commandId) => !registeredIds.has(commandId))
            .sort(),
    };
}
export function changeHotkeyBinding(keymap, commandId, sequence) {
    const normalized = normalizeKeySequence(sequence);
    const next = {
        ...keymap,
        bindings: { ...keymap.bindings, [commandId]: normalized },
    };
    const conflict = duplicateSequences(next).find((duplicate) => duplicate.commandIds.includes(commandId));
    if (conflict) {
        const conflictingCommandId = conflict.commandIds.find((id) => id !== commandId);
        return {
            sequence: normalized,
            ...(conflictingCommandId ? { conflictingCommandId } : {}),
        };
    }
    return { keymap: next, sequence: normalized };
}
export function duplicateSequences(keymap) {
    const sequences = new Map();
    for (const [commandId, binding] of Object.entries(keymap.bindings)) {
        const sequence = normalizeKeySequence(binding);
        if (!sequence) {
            continue;
        }
        sequences.set(sequence, [...(sequences.get(sequence) ?? []), commandId]);
    }
    return [...sequences.entries()]
        .filter(([_sequence, ids]) => ids.length > 1)
        .map(([sequence, ids]) => ({
        sequence,
        commandIds: [...ids].sort(),
    }))
        .sort((left, right) => left.sequence.localeCompare(right.sequence));
}
export function validateHotkeyKeymap(value, commands) {
    if (!isRecord(value)) {
        return {
            valid: false,
            duplicateSequences: [],
            unknownCommandIds: [],
            error: "Keymap file must contain a JSON object.",
        };
    }
    if (value.schemaVersion !== HOTKEY_KEYMAP_SCHEMA_VERSION) {
        return {
            valid: false,
            duplicateSequences: [],
            unknownCommandIds: [],
            error: `Keymap schema version must be ${HOTKEY_KEYMAP_SCHEMA_VERSION}.`,
        };
    }
    if (!isRecord(value.bindings)) {
        return {
            valid: false,
            duplicateSequences: [],
            unknownCommandIds: [],
            error: "Keymap bindings must be an object.",
        };
    }
    const ids = commandIds(commands);
    const registeredIds = new Set(ids);
    const unknownCommandIds = Object.keys(value.bindings)
        .filter((commandId) => !registeredIds.has(commandId))
        .sort();
    const keymap = updateHotkeyKeymap({ bindings: value.bindings }, commands).keymap;
    const duplicates = duplicateSequences(keymap);
    if (duplicates.length > 0) {
        return {
            valid: false,
            keymap,
            duplicateSequences: duplicates,
            unknownCommandIds,
            error: `Duplicate key sequence: ${duplicates[0]?.sequence ?? ""}`,
        };
    }
    if (unknownCommandIds.length > 0) {
        return {
            valid: false,
            keymap,
            duplicateSequences: [],
            unknownCommandIds,
            error: `Unknown command id: ${unknownCommandIds[0] ?? ""}`,
        };
    }
    return {
        valid: true,
        keymap,
        duplicateSequences: [],
        unknownCommandIds: [],
    };
}
export function commandIdForKeySequence(keymap, sequence) {
    const wanted = normalizeKeySequence(sequence);
    if (!wanted) {
        return undefined;
    }
    return Object.entries(keymap.bindings).find(([_commandId, binding]) => normalizeKeySequence(binding) === wanted)?.[0];
}
export function hasKeySequencePrefix(keymap, prefix) {
    const prefixTokens = sequenceTokens(prefix);
    if (prefixTokens.length === 0) {
        return false;
    }
    return Object.values(keymap.bindings).some((binding) => {
        const bindingTokens = sequenceTokens(binding);
        return (bindingTokens.length > prefixTokens.length &&
            sequenceStartsWith(bindingTokens, prefixTokens));
    });
}
export function keyTokenFromKeyboardEvent(event) {
    const key = event.key === " "
        ? "Space"
        : event.key.length === 1
            ? event.key.toLowerCase()
            : event.key;
    const prefixes = [];
    if (event.ctrlKey) {
        prefixes.push("C");
    }
    if (event.altKey) {
        prefixes.push("M");
    }
    if (event.metaKey) {
        prefixes.push("Meta");
    }
    if (event.shiftKey && event.key.length > 1 && event.key !== "Escape") {
        prefixes.push("S");
    }
    return prefixes.length > 0 ? `${prefixes.join("-")}-${key}` : key;
}
export function advanceHotkeySequence(keymap, pending, keyToken) {
    const candidate = [...pending, keyToken];
    const sequence = candidate.join(" ");
    const commandId = commandIdForKeySequence(keymap, sequence);
    if (commandId) {
        return { status: "matched", pending: [], commandId };
    }
    if (hasKeySequencePrefix(keymap, sequence)) {
        return { status: "pending", pending: candidate };
    }
    return {
        status: pending.length > 0 ? "cleared" : "unmatched",
        pending: [],
    };
}
//# sourceMappingURL=hotkey-keymap.js.map