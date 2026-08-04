import {spawn} from "node:child_process";
import {createHash, randomUUID} from "node:crypto";
import {
  access,
  chmod,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rm,
} from "node:fs/promises";
import {createRequire} from "node:module";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {withDistArtifactLock} from "./dist-artifact-lock.mjs";

export const DIST_ARTIFACT_MANIFEST = ".dist-artifact.json";

const modulePath = fileURLToPath(import.meta.url);
const defaultRoot = path.resolve(path.dirname(modulePath), "..");
const manifestSchemaVersion = 1;
const require = createRequire(import.meta.url);

export const DIST_ARTIFACT_INPUT_PATHS = Object.freeze([
  "src",
  "architecture",
  "assets/brand",
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
  "tsconfig.json",
  "package.json",
  "package-lock.json",
  "swarmforge/toolchain.lock.json",
  "scripts/check-architecture.mjs",
  "scripts/build.mjs",
  "scripts/dist-artifact-lock.mjs",
  "scripts/dist-artifact.mjs",
]);

const compareText = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const posixPath = (value) => value.split(path.sep).join("/");

async function pathEntries(root, relativePath) {
  const absolutePath = path.resolve(root, relativePath);
  const rootPrefix = `${path.resolve(root)}${path.sep}`;
  if (absolutePath !== path.resolve(root) && !absolutePath.startsWith(rootPrefix)) {
    throw new Error(`Artifact input escapes the repository root: ${relativePath}`);
  }

  const details = await lstat(absolutePath);
  const normalizedPath = posixPath(path.relative(root, absolutePath));
  if (details.isDirectory()) {
    const children = (await readdir(absolutePath)).sort(compareText);
    const nested = [];
    for (const child of children) {
      nested.push(...(await pathEntries(root, path.join(relativePath, child))));
    }
    return nested;
  }
  if (details.isSymbolicLink()) {
    throw new Error(`Artifact inputs must not be symbolic links: ${normalizedPath}`);
  }
  if (!details.isFile()) {
    throw new Error(`Unsupported artifact input type: ${normalizedPath}`);
  }

  const bytes = await readFile(absolutePath);
  return [{path: normalizedPath, kind: "file", bytes: bytes.length, sha256: sha256(bytes)}];
}

async function collectEntries(root, inputPaths) {
  const entries = [];
  for (const inputPath of inputPaths) {
    entries.push(...(await pathEntries(root, inputPath)));
  }
  entries.sort((left, right) => compareText(left.path, right.path));
  for (let index = 1; index < entries.length; index += 1) {
    if (entries[index - 1].path === entries[index].path) {
      throw new Error(`Duplicate artifact input path: ${entries[index].path}`);
    }
  }
  return entries;
}

function installedTypeScriptVersion() {
  const packagePath = require.resolve("typescript/package.json");
  return require(packagePath).version;
}

function digestDocument(document) {
  return sha256(`${JSON.stringify(document)}\n`);
}

function buildIdentity({inputDigest, outputDigest, toolchain}) {
  return digestDocument({
    schemaVersion: manifestSchemaVersion,
    inputDigest,
    outputDigest,
    toolchain,
  });
}

export async function createDistInputFingerprint({
  root = defaultRoot,
  inputPaths = DIST_ARTIFACT_INPUT_PATHS,
  toolchain,
} = {}) {
  const inputs = await collectEntries(root, inputPaths);
  const resolvedToolchain = toolchain ?? {
    node: process.versions.node,
    typescript: installedTypeScriptVersion(),
  };
  const digest = digestDocument({inputs, toolchain: resolvedToolchain});
  return {digest, inputs, toolchain: resolvedToolchain};
}

async function createDistOutputFingerprint(distDirectory) {
  const entries = await collectEntries(distDirectory, ["."]);
  const outputs = entries.filter(({path: outputPath}) => outputPath !== DIST_ARTIFACT_MANIFEST);
  return {digest: digestDocument({outputs}), outputs};
}

export async function writeDistArtifactManifest({
  root = defaultRoot,
  distDirectory = path.join(root, "dist"),
  inputFingerprint,
  inputPaths = DIST_ARTIFACT_INPUT_PATHS,
  toolchain,
} = {}) {
  const inputs =
    inputFingerprint ?? (await createDistInputFingerprint({root, inputPaths, toolchain}));
  const outputs = await createDistOutputFingerprint(distDirectory);
  const manifest = {
    schemaVersion: manifestSchemaVersion,
    inputDigest: inputs.digest,
    outputDigest: outputs.digest,
    buildIdentity: buildIdentity({
      inputDigest: inputs.digest,
      outputDigest: outputs.digest,
      toolchain: inputs.toolchain,
    }),
    toolchain: inputs.toolchain,
    inputs: inputs.inputs,
    outputs: outputs.outputs,
  };
  const manifestPath = path.join(distDirectory, DIST_ARTIFACT_MANIFEST);
  await atomicWriteFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

function artifactError(message) {
  return new Error(`${message} Run \`npm run build\` to publish a fresh dist artifact.`);
}

export async function assertFreshDistArtifact({
  root = defaultRoot,
  distDirectory = path.join(root, "dist"),
  inputPaths = DIST_ARTIFACT_INPUT_PATHS,
  toolchain,
} = {}) {
  const manifestPath = path.join(distDirectory, DIST_ARTIFACT_MANIFEST);
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw artifactError(`The dist artifact has no ${DIST_ARTIFACT_MANIFEST} success manifest.`);
    }
    if (error instanceof SyntaxError) {
      throw artifactError(`The dist artifact has an invalid ${DIST_ARTIFACT_MANIFEST} manifest.`);
    }
    throw error;
  }
  if (manifest?.schemaVersion !== manifestSchemaVersion) {
    throw artifactError("The dist artifact success manifest has an unsupported schema.");
  }

  const inputs = await createDistInputFingerprint({root, inputPaths, toolchain});
  if (
    manifest.inputDigest !== inputs.digest ||
    JSON.stringify(manifest.inputs) !== JSON.stringify(inputs.inputs) ||
    JSON.stringify(manifest.toolchain) !== JSON.stringify(inputs.toolchain)
  ) {
    throw artifactError("The dist artifact is stale for the current source or toolchain inputs.");
  }

  const outputs = await createDistOutputFingerprint(distDirectory);
  if (
    manifest.outputDigest !== outputs.digest ||
    JSON.stringify(manifest.outputs) !== JSON.stringify(outputs.outputs)
  ) {
    throw artifactError("The dist artifact contents do not match their success manifest.");
  }
  const expectedIdentity = buildIdentity({
    inputDigest: inputs.digest,
    outputDigest: outputs.digest,
    toolchain: inputs.toolchain,
  });
  if (manifest.buildIdentity !== expectedIdentity) {
    throw artifactError("The dist artifact has an invalid build identity.");
  }
  return manifest;
}

export const assertFreshDist = assertFreshDistArtifact;

export async function makeDistDirectoryPublishable(directory) {
  await chmod(directory, 0o755);
}

async function pathExists(target) {
  try {
    await access(target);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function recoverStrandedDistBackup(destinationDirectory) {
  const parent = path.dirname(destinationDirectory);
  const prefix = `${path.basename(destinationDirectory)}.previous-`;
  const backups = (await readdir(parent, {withFileTypes: true}))
    .filter((entry) => entry.name.startsWith(prefix))
    .map((entry) => path.join(parent, entry.name))
    .sort();
  if (backups.length > 1) {
    throw new Error(`Multiple stranded dist backups require inspection: ${backups.join(", ")}`);
  }
  if (backups.length === 0) return;
  const [backup] = backups;
  const backupStat = await lstat(backup);
  if (!backupStat.isDirectory() || backupStat.isSymbolicLink()) {
    throw new Error(`Stranded dist backup is not a directory: ${backup}`);
  }
  if (await pathExists(destinationDirectory)) {
    // The candidate was promoted before an interrupted cleanup. The published
    // directory is authoritative for cooperative consumers.
    await rm(backup, {recursive: true, force: true});
  } else {
    // The previous directory was moved aside before an interrupted promotion.
    await rename(backup, destinationDirectory);
  }
}

export async function promoteDistDirectory(candidateDirectory, destinationDirectory) {
  if (path.dirname(candidateDirectory) !== path.dirname(destinationDirectory)) {
    throw new Error("Locked dist promotion requires sibling candidate and destination directories.");
  }
  // POSIX cannot replace a populated directory in one rename. All supported
  // readers hold the artifact lock; recover either crash point before the two
  // same-filesystem renames so they see only complete, fingerprinted trees.
  await recoverStrandedDistBackup(destinationDirectory);
  const backupDirectory = `${destinationDirectory}.previous-${process.pid}-${randomUUID()}`;
  let movedPrevious = false;
  let promoted = false;
  try {
    try {
      await access(destinationDirectory);
      await rename(destinationDirectory, backupDirectory);
      movedPrevious = true;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    try {
      await rename(candidateDirectory, destinationDirectory);
      promoted = true;
    } catch (error) {
      if (movedPrevious) await rename(backupDirectory, destinationDirectory);
      throw error;
    }
  } finally {
    if (promoted && movedPrevious) {
      await rm(backupDirectory, {recursive: true, force: true});
    }
  }
}

export async function atomicWriteFile(targetPath, bytes) {
  const directory = path.dirname(targetPath);
  await mkdir(directory, {recursive: true});
  const temporaryPath = path.join(
    directory,
    `.${path.basename(targetPath)}.${process.pid}.${randomUUID()}.tmp`,
  );
  const handle = await open(temporaryPath, "wx", 0o644);
  let closed = false;
  try {
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close();
    closed = true;
    await rename(temporaryPath, targetPath);
  } finally {
    if (!closed) await handle.close();
    await rm(temporaryPath, {force: true});
  }
}

async function runLockedCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {stdio: "inherit", env: process.env});
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`Artifact consumer ${command} exited after signal ${signal}.`));
      } else if (code !== 0) {
        reject(new Error(`Artifact consumer ${command} exited with status ${code}.`));
      } else {
        resolve();
      }
    });
  });
}

async function main(argv) {
  const [subcommand, ...rest] = argv;
  if (subcommand === "validate" && rest.length === 0) {
    await withDistArtifactLock(async () => assertFreshDistArtifact());
    console.log("dist artifact is fresh");
    return;
  }
  if (subcommand === "run") {
    const commandArguments = rest[0] === "--" ? rest.slice(1) : rest;
    if (commandArguments.length === 0) {
      throw new Error("usage: node scripts/dist-artifact.mjs run -- <command> [arguments...]");
    }
    const [command, ...args] = commandArguments;
    await withDistArtifactLock(async () => {
      await assertFreshDistArtifact();
      await runLockedCommand(command, args);
    });
    return;
  }
  throw new Error("usage: node scripts/dist-artifact.mjs <validate|run -- command...>");
}

if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error?.message ?? error);
    process.exitCode = 1;
  });
}
