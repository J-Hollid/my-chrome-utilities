import { existsSync } from "node:fs";
import path from "node:path";

import { validateSharedBoundaryDeclarations } from
  "../verification-shared-boundaries.mjs";

const executablePathFields = [
  "unit", "property", "features", "handlers", "browserAdapters", "compatibilityTests",
];
const ownedPathFields = ["source", "process"];

function values(pack, field) {
  const entries = pack[field] ?? [];
  if (!Array.isArray(entries) || entries.some((entry) => typeof entry !== "string" || !entry)) {
    throw new Error(`Verification pack ${pack.id} must declare ${field} as paths`);
  }
  return entries;
}

function validateUniqueOwnership(packs) {
  for (const field of ownedPathFields) {
    const owners = new Map();
    for (const pack of packs) {
      for (const candidatePath of values(pack, field)) {
        const existing = owners.get(candidatePath);
        if (existing && existing !== pack.id) {
          throw new Error(`Duplicate verification source ownership: ${candidatePath}`);
        }
        owners.set(candidatePath, pack.id);
      }
    }
  }
}

function validateExecutableLeaves(packs, repositoryRoot) {
  for (const pack of packs) {
    for (const field of executablePathFields) {
      for (const leaf of values(pack, field)) {
        const absolute = path.resolve(repositoryRoot, leaf);
        if (!absolute.startsWith(`${path.resolve(repositoryRoot)}${path.sep}`) ||
            !existsSync(absolute)) {
          throw new Error(`Missing executable verification leaf: ${leaf}`);
        }
      }
    }
    for (const observation of pack.browserObservations ?? []) {
      if (!observation || typeof observation.path !== "string" ||
          !existsSync(path.resolve(repositoryRoot, observation.path))) {
        throw new Error(`Missing executable verification leaf: ${observation?.path ?? "browser observation"}`);
      }
    }
  }
}

function validateSliceConsumers(packs) {
  const byId = new Map(packs.map((pack) => [pack.id, pack]));
  for (const pack of packs) {
    for (const slice of pack.verificationSlices ?? []) {
      for (const consumer of slice.consumers ?? []) {
        const target = byId.get(consumer?.packId);
        if (!target || consumer.sliceId !== undefined &&
            !(target.verificationSlices ?? []).some(({ id }) => id === consumer.sliceId)) {
          throw new Error(`Unknown verification slice consumer: ${consumer?.packId ?? "declaration"}`);
        }
      }
    }
  }
}

function validateSharedBoundaryAuthority(packs) {
  const prefixes = new Set();
  for (const pack of packs) {
    for (const boundary of pack.sharedBoundaries ?? []) {
      for (const prefix of boundary.prefixes ?? []) {
        if (prefixes.has(prefix)) throw new Error(`Conflicting shared boundary prefix: ${prefix}`);
        prefixes.add(prefix);
      }
    }
  }
  validateSharedBoundaryDeclarations(packs);
}

export function validateCompiledRegistry(packs, { repositoryRoot }) {
  validateUniqueOwnership(packs);
  validateExecutableLeaves(packs, repositoryRoot);
  validateSliceConsumers(packs);
  validateSharedBoundaryAuthority(packs);
  return packs;
}
