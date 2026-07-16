import type { UtilityStorageContract } from "./utility-contract.js";

export interface StorageBacking {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createUtilityStorage(
  backing: StorageBacking,
  contract: UtilityStorageContract,
): Storage {
  const ownedKeys = [...(contract.legacyKeys ?? [])];
  const owned = new Set(ownedKeys);
  const assertOwned = (key: string): void => {
    if (!owned.has(key)) {
      throw new Error(`${contract.namespace} does not own storage key ${key}`);
    }
  };
  const readEnvelope = (): Record<string, string> => {
    try {
      const value = JSON.parse(backing.getItem(contract.namespace) ?? "{}");
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  };
  const writeEnvelope = (value: Record<string, string>): void => {
    if (Object.keys(value).length) backing.setItem(contract.namespace, JSON.stringify(value));
    else backing.removeItem(contract.namespace);
  };
  return {
    get length(): number { return ownedKeys.length; },
    clear(): void {
      for (const key of ownedKeys) backing.removeItem(key);
      backing.removeItem(contract.namespace);
    },
    getItem(key: string): string | null {
      assertOwned(key);
      return backing.getItem(key) ?? readEnvelope()[key] ?? null;
    },
    key(index: number): string | null { return ownedKeys[index] ?? null; },
    removeItem(key: string): void {
      assertOwned(key);
      const envelope = readEnvelope();
      delete envelope[key];
      writeEnvelope(envelope);
      backing.removeItem(key);
    },
    setItem(key: string, value: string): void {
      assertOwned(key);
      const serialized = String(value);
      writeEnvelope({ ...readEnvelope(), [key]: serialized });
      backing.setItem(key, serialized);
    },
  };
}
