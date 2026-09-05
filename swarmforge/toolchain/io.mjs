import {readFile} from "node:fs/promises";
import path from "node:path";
import {composePins, optionalAuthority} from "./pins.mjs";

export async function loadOptionalPins(repositoryRoot) {
  const [core, fragment] = await Promise.all([
    readFile(path.join(repositoryRoot, "swarmforge/toolchain.lock.json"), "utf8"),
    readFile(path.join(repositoryRoot, optionalAuthority), "utf8"),
  ]);
  return composePins(JSON.parse(core), JSON.parse(fragment));
}
