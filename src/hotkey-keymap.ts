import type { AppCommand } from "./commands.js";

export const HOTKEY_KEYMAP_SCHEMA_VERSION = 1;
export const HOTKEY_KEYMAP_STORAGE_KEY =
  "my-chrome-utilities.hotkey-keymap.v1";

interface CommandIdentity {
  id: string;
}

export interface HotkeyKeymap {
  schemaVersion: number;
  bindings: Record<string, string>;
}

export interface DuplicateSequence {
  sequence: string;
  commandIds: string[];
}

export interface HotkeyKeymapUpdateSummary {
  keymap: HotkeyKeymap;
  added: string[];
  removed: string[];
}

export interface HotkeyKeymapValidation {
  valid: boolean;
  duplicateSequences: DuplicateSequence[];
  unknownCommandIds: string[];
  error?: string;
  keymap?: HotkeyKeymap;
}

export interface KeyboardEventLike {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
}

export interface HotkeySequenceAdvance {
  status: "matched" | "pending" | "cleared" | "unmatched";
  pending: string[];
  commandId?: string;
}

function commandIds(commands: readonly CommandIdentity[]): string[] {
  return commands.map((command) => command.id);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sequenceTokens(sequence: string): string[] {
  const normalized = normalizeKeySequence(sequence);
  return normalized ? normalized.split(" ") : [];
}

function sequenceStartsWith(
  sequence: readonly string[],
  prefix: readonly string[],
): boolean {
  return prefix.every((token, index) => sequence[index] === token);
}

export function normalizeKeySequence(sequence: string): string {
  return sequence.trim().replace(/\s+/g, " ");
}

export function blankHotkeyKeymap(
  commands: readonly AppCommand[],
): HotkeyKeymap {
  return {
    schemaVersion: HOTKEY_KEYMAP_SCHEMA_VERSION,
    bindings: Object.fromEntries(
      commandIds(commands).map((commandId) => [commandId, ""]),
    ),
  };
}

export function updateHotkeyKeymap(
  existing: { bindings?: Record<string, unknown> },
  commands: readonly AppCommand[],
): HotkeyKeymapUpdateSummary {
  const ids = commandIds(commands);
  const registeredIds = new Set(ids);
  const existingBindings = isRecord(existing.bindings) ? existing.bindings : {};
  const existingIds = new Set(Object.keys(existingBindings));
  const bindings: Record<string, string> = {};
  const added: string[] = [];

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

export function duplicateSequences(
  keymap: HotkeyKeymap,
): DuplicateSequence[] {
  const sequences = new Map<string, string[]>();

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

export function validateHotkeyKeymap(
  value: unknown,
  commands: readonly AppCommand[],
): HotkeyKeymapValidation {
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
  const keymap = updateHotkeyKeymap(
    { bindings: value.bindings },
    commands,
  ).keymap;
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

export function commandIdForKeySequence(
  keymap: HotkeyKeymap,
  sequence: string,
): string | undefined {
  const wanted = normalizeKeySequence(sequence);

  if (!wanted) {
    return undefined;
  }

  return Object.entries(keymap.bindings).find(
    ([_commandId, binding]) => normalizeKeySequence(binding) === wanted,
  )?.[0];
}

export function hasKeySequencePrefix(
  keymap: HotkeyKeymap,
  prefix: string,
): boolean {
  const prefixTokens = sequenceTokens(prefix);

  if (prefixTokens.length === 0) {
    return false;
  }

  return Object.values(keymap.bindings).some((binding) => {
    const bindingTokens = sequenceTokens(binding);
    return (
      bindingTokens.length > prefixTokens.length &&
      sequenceStartsWith(bindingTokens, prefixTokens)
    );
  });
}

export function keyTokenFromKeyboardEvent(event: KeyboardEventLike): string {
  const key =
    event.key === " "
      ? "Space"
      : event.key.length === 1
        ? event.key.toLowerCase()
        : event.key;
  const prefixes: string[] = [];

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

export function advanceHotkeySequence(
  keymap: HotkeyKeymap,
  pending: readonly string[],
  keyToken: string,
): HotkeySequenceAdvance {
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

export function shouldIgnoreHotkeyTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}
