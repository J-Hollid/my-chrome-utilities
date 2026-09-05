export const optionalAuthority = "swarmforge/toolchain/optional-tools.lock.json";
const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
export const toolName = (value) => typeof value === "string" && /^[a-z][a-z0-9-]*$/u.test(value);

function validatePin(name, pin) {
  if (!toolName(name) || !record(pin) || !toolName(pin.provider) ||
      !/^[a-f0-9]{40}$/u.test(pin.revision ?? "") || !/^[a-f0-9]{64}$/u.test(pin.sha256 ?? "") ||
      Object.keys(pin).sort().join() !== "provider,revision,sha256") {
    throw new Error(`invalid-pin: ${name} requires provider, exact revision, and SHA-256`);
  }
}

export function composePins(core, fragment) {
  if (!record(core) || core.version !== 1) throw new Error("core-schema: expected root lock version 1");
  if (!record(fragment) || fragment.version !== 1 || !record(fragment.tools) ||
      Object.keys(fragment).sort().join() !== "tools,version") {
    throw new Error("schema: optional authority requires version 1 and tools");
  }
  const entries = Object.entries(fragment.tools).map(([name, pin]) => {
    if (Object.hasOwn(core, name)) throw new Error(`authority-conflict: ${name} belongs to the core lock`);
    validatePin(name, pin);
    return [name, {name, pin:structuredClone(pin), authority:optionalAuthority}];
  });
  return Object.fromEntries(entries);
}

export function requestedPin(pins, name) {
  if (!toolName(name)) throw new Error("request: one optional tool name is required");
  if (!Object.hasOwn(pins, name)) throw new Error(`missing-pin: ${name}`);
  return structuredClone(pins[name]);
}
