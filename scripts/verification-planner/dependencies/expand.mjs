const values = (pack, key) => pack[key] ?? [];

export function expandVerificationDependencies(packs, ids) {
  const selected = new Set(ids);
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of [...selected]) {
      const pack = packs.find((item) => item.id === id);
      if (!pack) throw new Error(`Register every direct dependency: ${id}`);
      for (const dependency of values(pack, "dependencies")) {
        if (!selected.has(dependency)) {
          selected.add(dependency);
          changed = true;
        }
      }
    }
  }
  return selected;
}

export function expandVerificationDependants(packs, ids) {
  const selected = new Set(ids);
  let changed = true;
  while (changed) {
    changed = false;
    for (const pack of packs) {
      const upstream = [...values(pack, "dependencies"), ...values(pack, "sharedComponents")];
      if (upstream.some((id) => selected.has(id)) && !selected.has(pack.id)) {
        selected.add(pack.id);
        changed = true;
      }
    }
  }
  return selected;
}

export function expandVerificationDependantsAcross(registries, ids) {
  const selected = new Set(ids);
  let changed = true;
  while (changed) {
    changed = false;
    for (const registry of registries) {
      for (const id of expandVerificationDependants(registry, selected)) {
        if (!selected.has(id)) {
          selected.add(id);
          changed = true;
        }
      }
    }
  }
  return selected;
}
