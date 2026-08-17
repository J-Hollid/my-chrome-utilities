import {execFileSync} from "node:child_process";
import {
  access,
  copyFile,
  cp,
  mkdir,
  mkdtemp,
  opendir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import {createRequire} from "node:module";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  createDistInputFingerprint,
  makeDistDirectoryPublishable,
  promoteDistDirectory,
  writeDistArtifactManifest,
} from "./dist-artifact.mjs";
import {withDistArtifactLock} from "./dist-artifact-lock.mjs";
import {checkArchitecture} from "./check-architecture.mjs";
import {stylesheetDeclarations, validateStylesheetRegistry} from "./verification-styles.mjs";
import {validateBuildDeliveredDependencies} from "./build-delivered-dependencies.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDirectory = path.join(projectRoot, "dist");
const require = createRequire(import.meta.url);

process.chdir(projectRoot);

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

async function copyStaticFiles(candidateDirectory) {
  // Canonical stylesheet declarations include side-panel.css and every other
  // packaged style; this marker keeps the operator contract explicit.
  const registry = JSON.parse(await readFile("verification/packs.json", "utf8"));
  const declarations = stylesheetDeclarations(registry);
  await validateStylesheetRegistry(registry, {
    repositoryRoot:projectRoot,
    packIds:registry.map(({ id }) => id),
  });
  const staticFiles = ["manifest.json", "side-panel.html", "specification-builder.html"];
  for (const source of staticFiles) await copyFile(source, path.join(candidateDirectory, source));
  for (const { source, destination } of declarations) {
    const destinationPath = path.join(candidateDirectory, destination);
    await mkdir(path.dirname(destinationPath), {recursive:true});
    await copyFile(source, destinationPath);
  }
  await cp("assets/brand", path.join(candidateDirectory, "assets/brand"), {recursive: true});
  const dependencies=validateBuildDeliveredDependencies(JSON.parse(await readFile("build-delivered-dependencies.json","utf8")));
  for(const {source,destination} of dependencies){const target=path.join(candidateDirectory,destination);await mkdir(path.dirname(target),{recursive:true});await copyFile(source,target);}
  return new Set(declarations.map(({destination}) => destination));
}

async function verifyLocalReferences(candidateDirectory, declaredStylesheets) {
  const localReferencePattern = /\b(?:href|src)=["']([^"']+)["']/giu;
  const candidateRoot = path.resolve(candidateDirectory);
  const candidatePrefix = `${candidateRoot}${path.sep}`;
  for (const htmlName of ["side-panel.html", "specification-builder.html"]) {
    const html = await readFile(path.join(candidateDirectory, htmlName), "utf8");
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
      if (cleanReference.endsWith(".css") && !declaredStylesheets.has(cleanReference)) {
        throw new Error(`${htmlName} references an undeclared stylesheet: ${cleanReference}`);
      }
      const candidate = path.resolve(
        candidateDirectory,
        cleanReference.startsWith("/") ? cleanReference.slice(1) : cleanReference,
      );
      if (candidate !== candidateRoot && !candidate.startsWith(candidatePrefix)) {
        throw new Error(`${htmlName} contains an escaping local reference: ${reference}`);
      }
      try {
        await access(candidate);
      } catch {
        throw new Error(`${htmlName} references a missing packaged file: ${reference}`);
      }
    }
  }
}

await withDistArtifactLock(async () => {
  const candidateDirectory = await mkdtemp(path.join(projectRoot, ".dist-build-"));
  try {
    const inputsBeforeBuild = await createDistInputFingerprint({root: projectRoot});
    await checkArchitecture();
    const compiler = require.resolve("typescript/bin/tsc");
    execFileSync(
      process.execPath,
      [
        compiler,
        "--project",
        path.join(projectRoot, "tsconfig.json"),
        "--outDir",
        candidateDirectory,
      ],
      {cwd: projectRoot, stdio: "inherit"},
    );

    await normalizeInlineSources(candidateDirectory);
    await mkdir(candidateDirectory, {recursive: true});
    const declaredStylesheets = await copyStaticFiles(candidateDirectory);
    await verifyLocalReferences(candidateDirectory, declaredStylesheets);

    const inputsAfterBuild = await createDistInputFingerprint({root: projectRoot});
    if (inputsAfterBuild.digest !== inputsBeforeBuild.digest) {
      throw new Error("Build inputs changed while dist was being assembled; retry the build.");
    }
    await writeDistArtifactManifest({
      root: projectRoot,
      distDirectory: candidateDirectory,
      inputFingerprint: inputsAfterBuild,
    });
    // mkdtemp intentionally creates a private 0700 directory. The published
    // extension artifact is user-loadable and copyable, so normalize only the
    // candidate root before its cooperative, lock-protected promotion.
    await makeDistDirectoryPublishable(candidateDirectory);
    await promoteDistDirectory(candidateDirectory, distDirectory);
  } finally {
    await rm(candidateDirectory, {recursive: true, force: true});
  }
}, {access:"write"});
