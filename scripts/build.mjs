import {
  access,
  copyFile,
  cp,
  mkdir,
  opendir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

await rm("dist", { recursive: true, force: true });
const require = createRequire(import.meta.url);
const compiler = require.resolve("typescript/bin/tsc");
execFileSync(process.execPath, [compiler, "--project", "tsconfig.json"], {
  stdio: "inherit",
});

async function normalizeInlineSources(directory) {
  for await (const entry of await opendir(directory)) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await normalizeInlineSources(target);
    } else if (entry.isFile() && entry.name.endsWith(".map")) {
      const sourceMap = JSON.parse(await readFile(target, "utf8"));
      if (Array.isArray(sourceMap.sourcesContent)) {
        sourceMap.sourcesContent = sourceMap.sourcesContent.map((source) =>
          typeof source === "string" ? source.replaceAll("\r\n", "\n") : source,
        );
        await writeFile(target, JSON.stringify(sourceMap));
      }
    }
  }
}

await normalizeInlineSources("dist");
await mkdir("dist", { recursive: true });

const staticFiles = [
  "manifest.json",
  "side-panel.html",
  "side-panel.css",
  "specification-builder.html",
  "specification-builder.css",
  "specification-builder-guidance.css",
  "layered-schema.css",
  "twatility-brand.css",
  "schema-authoring-brand.css",
  "side-panel-brand.css",
  "specification-builder-brand.css",
];

for (const source of staticFiles) {
  await copyFile(source, path.join("dist", source));
}
await cp("assets/brand", "dist/assets/brand", { recursive: true });

const localReferencePattern = /\b(?:href|src)=["']([^"']+)["']/giu;
for (const htmlName of ["side-panel.html", "specification-builder.html"]) {
  const html = await readFile(path.join("dist", htmlName), "utf8");
  for (const match of html.matchAll(localReferencePattern)) {
    const reference = match[1];
    if (
      reference.startsWith("#") ||
      /^[a-z][a-z\d+.-]*:/iu.test(reference) ||
      reference.startsWith("//")
    ) {
      continue;
    }
    const cleanReference = reference.split(/[?#]/u, 1)[0];
    const candidate = path.resolve(
      "dist",
      cleanReference.startsWith("/") ? cleanReference.slice(1) : cleanReference,
    );
    const distRoot = `${path.resolve("dist")}${path.sep}`;
    if (!candidate.startsWith(distRoot)) {
      throw new Error(`${htmlName} contains an escaping local reference: ${reference}`);
    }
    try {
      await access(candidate);
    } catch {
      throw new Error(`${htmlName} references a missing packaged file: ${reference}`);
    }
  }
}
