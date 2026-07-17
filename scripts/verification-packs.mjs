import { access, readFile, readdir } from "node:fs/promises";

const registryUrl = new URL("../verification/packs.json", import.meta.url);
const ownedPathKeys = ["unit", "property", "features", "handlers", "browserAdapters"];
const testPathKeys = ["unit", "property", "browserAdapters"];

export async function loadVerificationPacks() {
  return JSON.parse(await readFile(registryUrl, "utf8"));
}

async function repositoryPaths(directory, suffix) {
  const paths = [];
  const entries = await readdir(new URL(`../${directory}/`, import.meta.url), {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) paths.push(...await repositoryPaths(path, suffix));
    else if (path.endsWith(suffix)) paths.push(path);
  }

  return paths.sort();
}

export async function verificationInventory() {
  const testPaths = await repositoryPaths("test", ".mjs");
  return {
    source: await repositoryPaths("src", ".ts"),
    tests: testPaths.filter((path) =>
      path.endsWith("-test.mjs") ||
      (path.startsWith("test/browser-packs/") && !path.endsWith("shared-harness.mjs"))
    ),
    features: await repositoryPaths("features", ".feature"),
    handlers: await repositoryPaths("acceptance/src/acceptance/steps", ".clj"),
  };
}

function sourceMatches(prefix, path) {
  return path === prefix || path.startsWith(prefix);
}

function assignedPaths(packs, keys) {
  const owners = new Map();
  for (const pack of packs) {
    for (const key of keys) {
      for (const path of pack[key]) {
        const pathOwners = owners.get(path) ?? [];
        pathOwners.push(pack.id);
        owners.set(path, pathOwners);
      }
    }
  }
  return owners;
}

async function validateRegisteredPaths(packs) {
  const owners = new Map();
  for (const pack of packs) {
    for (const key of ownedPathKeys) {
      for (const path of pack[key]) {
        if (owners.has(path)) {
          throw new Error(`Assign every ${key} path to exactly one pack: ${path}`);
        }
        owners.set(path, pack.id);
        try {
          await access(new URL(`../${path}`, import.meta.url));
        } catch {
          throw new Error(`Correct the missing ${key} path: ${path}`);
        }
      }
    }
  }
}

function validateDependencies(packs, ids) {
  for (const pack of packs) {
    for (const dependency of pack.dependencies) {
      if (!ids.has(dependency)) {
        throw new Error(`Register every direct dependency: ${dependency}`);
      }
    }
  }
}

function validateSourceOwnership(packs, inventory) {
  for (const pack of packs) {
    for (const prefix of pack.source) {
      if (!inventory.some((path) => sourceMatches(prefix, path))) {
        throw new Error(`Correct the missing source path: ${prefix}`);
      }
    }
  }

  for (const path of inventory) {
    const owners = packs.filter((pack) =>
      pack.source.some((prefix) => sourceMatches(prefix, path))
    );
    if (owners.length !== 1) {
      throw new Error(`Assign every source path to one pack: ${path}`);
    }
  }
}

function validateInventoryPaths(packs, inventory) {
  const tests = assignedPaths(packs, testPathKeys);
  for (const path of inventory.tests) {
    if ((tests.get(path)?.length ?? 0) !== 1) {
      throw new Error(`Assign every test path to exactly one pack: ${path}`);
    }
  }

  for (const key of ["features", "handlers"]) {
    const assigned = new Set(packs.flatMap((pack) => pack[key]));
    for (const path of inventory[key]) {
      if (!assigned.has(path)) throw new Error(`Unassigned ${key} path: ${path}`);
    }
    for (const path of assigned) {
      if (!inventory[key].includes(path)) {
        throw new Error(`Assigned ${key} path is not in the repository: ${path}`);
      }
    }
  }
}

export async function validateVerificationPacks(packs, { inventory } = {}) {
  const ids = new Set();
  for (const pack of packs) {
    if (ids.has(pack.id)) throw new Error(`Verification pack ids must be unique: ${pack.id}`);
    ids.add(pack.id);
  }

  await validateRegisteredPaths(packs);
  validateDependencies(packs, ids);

  const repositoryInventory = { ...await verificationInventory(), ...inventory };
  validateSourceOwnership(packs, repositoryInventory.source);
  validateInventoryPaths(packs, repositoryInventory);
  return packs;
}

function ownerOf(packs, path) {
  return packs.find((pack) =>
    pack.source.some((prefix) => sourceMatches(prefix, path))
  );
}

function expandDependencies(packs, ids) {
  const selected = new Set(ids);
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of [...selected]) {
      const pack = packs.find((item) => item.id === id);
      if (!pack) throw new Error(`Register every direct dependency: ${id}`);
      for (const dependency of pack.dependencies) {
        if (!selected.has(dependency)) {
          selected.add(dependency);
          changed = true;
        }
      }
    }
  }
  return selected;
}

function expandDependants(packs, ids) {
  const selected = new Set(ids);
  let changed = true;
  while (changed) {
    changed = false;
    for (const pack of packs) {
      if (pack.dependencies.some((id) => selected.has(id)) && !selected.has(pack.id)) {
        selected.add(pack.id);
        changed = true;
      }
    }
  }
  return selected;
}

export function planVerification(
  packs,
  { packIds = [], changedPaths = [], terminalFull = false } = {},
) {
  const known = new Set(packs.map(({ id }) => id));
  validateDependencies(packs, known);

  let selected = terminalFull ? new Set(known) : new Set(packIds);
  for (const path of changedPaths) {
    const owner = ownerOf(packs, path);
    if (!owner) throw new Error(`Assign every source path to one pack: ${path}`);
    selected.add(owner.id);
  }

  if (changedPaths.length) selected = expandDependants(packs, selected);
  selected = expandDependencies(packs, selected);

  const ordered = packs.filter(({ id }) => selected.has(id));
  const commands = ["npm run build"];
  for (const pack of ordered) {
    for (const path of pack.unit) commands.push(`node ${path}`);
    for (const path of pack.property) commands.push(`node ${path}`);
    for (const path of pack.browserAdapters) commands.push(`node ${path}`);
  }

  return {
    packIds: ordered.map(({ id }) => id),
    features: ordered.flatMap(({ features }) => features).sort(),
    handlers: ordered.flatMap(({ handlers }) => handlers),
    commands: [...new Set(commands)],
  };
}
