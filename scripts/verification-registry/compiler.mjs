import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const defaultRoot = fileURLToPath(new URL("../../", import.meta.url));

function validPack(pack) {
  return pack && !Array.isArray(pack) &&
    typeof pack.id === "string" && /^[a-z0-9][a-z0-9_-]*$/u.test(pack.id);
}

function validFragment(fragment) {
  return fragment && !Array.isArray(fragment) && fragment.version === 1 &&
    Number.isSafeInteger(fragment.order) && fragment.order >= 0 && validPack(fragment.pack);
}

export function compileVerificationRegistry({ base, fragments }) {
  if (!Array.isArray(base) || base.some((pack) => !validPack(pack))) {
    throw new Error("Verification registry base must contain valid pack declarations");
  }
  if (!Array.isArray(fragments) || fragments.some((fragment) =>
    !validFragment(fragment))) {
    throw new Error("Verification registry fragments must use schema version 1");
  }
  const ordered = [...fragments].sort((left, right) =>
    left.order - right.order || left.pack.id.localeCompare(right.pack.id));
  if (new Set(ordered.map(({ order }) => order)).size !== ordered.length) {
    throw new Error("Verification registry fragment order must be unique");
  }
  const packs = [...structuredClone(base), ...ordered.map(({ pack }) => structuredClone(pack))];
  const seen = new Set();
  for (const pack of packs) {
    if (seen.has(pack.id)) throw new Error(`Duplicate verification pack identity: ${pack.id}`);
    seen.add(pack.id);
  }
  return packs;
}

export function serializeVerificationRegistry(packs) {
  return `${JSON.stringify(packs, null, 2)}\n`;
}

export async function compiledVerificationRegistry({ repositoryRoot = defaultRoot } = {}) {
  const base = JSON.parse(await readFile(path.join(repositoryRoot,
    "verification/packs.base.json"), "utf8"));
  const directory = path.join(repositoryRoot, "verification/manifests");
  const names = (await readdir(directory)).filter((name) => name.endsWith(".json")).sort();
  const fragments = await Promise.all(names.map(async(name) =>
    JSON.parse(await readFile(path.join(directory, name), "utf8"))));
  return compileVerificationRegistry({ base, fragments });
}

export async function writeCompiledVerificationRegistry({ repositoryRoot = defaultRoot } = {}) {
  const packs = await compiledVerificationRegistry({ repositoryRoot });
  await writeFile(path.join(repositoryRoot, "verification/packs.json"),
    serializeVerificationRegistry(packs));
  return packs;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  writeCompiledVerificationRegistry().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
