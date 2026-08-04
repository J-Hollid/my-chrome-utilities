import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import {
  access,
  lstat,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const gitTools = ["clj-mutate", "crap4clj", "dry4clj"];
const provisionable = new Set(["node", "babashka", ...gitTools]);
export const usage = `Usage: node scripts/check-swarmforge-toolchain.mjs [OPTION]

Validate the locked, installed SwarmForge toolchain without contacting the network.

Options:
  --strict-runtime          fail when the active Node runtime is not the locked version
  --require TOOL            require and deeply validate one locked tool
  --provision TOOL          explicitly download/prepare one locked provisionable tool
  --print-aps-digest        print the vendored APS tree digest and exit
  --validate-local-babashka validate the project-local bb before launcher use
  --print-babashka-guidance print platform-aware offline installation guidance
  -h, --help                show this help

Provisionable tools: node, babashka, ${gitTools.join(", ")}`;

function exec(command, commandArgs, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, commandArgs, {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
      ...options,
    }, (error, stdout, stderr) => {
      if (error) {
        const detail = stderr.trim() || stdout.trim() || error.message;
        reject(new Error(`${command} failed: ${detail}`));
        return;
      }
      resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function entryExists(target) {
  try {
    await lstat(target);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function processIsAlive(pid) {
  if (!Number.isInteger(pid) || pid < 1) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === "ESRCH") return false;
    if (error.code === "EPERM") return true;
    throw error;
  }
}

function uniqueSibling(target, purpose) {
  return path.join(
    path.dirname(target),
    `.${path.basename(target)}.${purpose}-${process.pid}-${randomUUID()}`,
  );
}

async function removeOwnedTemporary(target) {
  try {
    await rm(target, { recursive: true, force: true });
  } catch (error) {
    throw new Error(`Could not remove owned temporary path ${target}: ${error.message}`);
  }
}

export async function atomicPromoteDirectory(stage, target, validateFinal, label = "Directory") {
  try {
    await rename(stage, target);
    return { promoted: true };
  } catch (promotionError) {
    if (!await entryExists(target)) {
      throw new Error(`${label} promotion to ${target} failed: ${promotionError.message}`);
    }
    try {
      await validateFinal(target);
    } catch (validationError) {
      throw new Error(
        `${label} promotion did not win a concurrent race and the final target did not validate: ${validationError.message}`,
      );
    }
    return { promoted: false };
  }
}

export async function atomicExchangeDirectories(
  stage,
  target,
  validateFinal,
  validateDisplaced,
  label = "Directory",
) {
  try {
    await exec("mv", ["--exchange", "--no-copy", "--no-target-directory", "--", stage, target], { cwd: root });
  } catch (error) {
    if (/unrecognized option|unknown option|illegal option/iu.test(error.message)) {
      throw new Error(`${label} requires atomic directory exchange, but this host mv does not support --exchange; the final target was not changed`);
    }
    throw new Error(`${label} atomic exchange failed without changing the final target: ${error.message}`);
  }
  try {
    await validateFinal(target);
    await validateDisplaced(stage);
  } catch (validationError) {
    try {
      await exec("mv", ["--exchange", "--no-copy", "--no-target-directory", "--", stage, target], { cwd: root });
    } catch (rollbackError) {
      const error = new Error(`${label} atomic exchange validation failed and rollback also failed; preserved displaced checkout at ${stage}: ${validationError.message}; ${rollbackError.message}`);
      error.preserveStage = true;
      throw error;
    }
    throw new Error(`${label} atomic exchange was rolled back: ${validationError.message}`);
  }
}

export function parseArgs(argv) {
  const options = {
    help: false,
    printBabashkaGuidance: false,
    printApsDigest: false,
    strictRuntime: false,
    validateLocalBabashka: false,
    require: undefined,
    provision: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") {
      if (options.help) throw new Error(`Duplicate option: ${argument}`);
      options.help = true;
    } else if (argument === "--print-aps-digest") {
      if (options.printApsDigest) throw new Error(`Duplicate option: ${argument}`);
      options.printApsDigest = true;
    } else if (argument === "--validate-local-babashka") {
      if (options.validateLocalBabashka) throw new Error(`Duplicate option: ${argument}`);
      options.validateLocalBabashka = true;
    } else if (argument === "--print-babashka-guidance") {
      if (options.printBabashkaGuidance) throw new Error(`Duplicate option: ${argument}`);
      options.printBabashkaGuidance = true;
    } else if (argument === "--strict-runtime") {
      if (options.strictRuntime) throw new Error(`Duplicate option: ${argument}`);
      options.strictRuntime = true;
    } else if (argument === "--require" || argument === "--provision") {
      const key = argument === "--require" ? "require" : "provision";
      if (options[key] !== undefined) throw new Error(`Duplicate option: ${argument}`);
      const value = argv[index + 1];
      if (!value || value.startsWith("-")) throw new Error(`${argument} requires a tool name`);
      options[key] = value;
      index += 1;
    } else if (argument.startsWith("-")) {
      throw new Error(`Unknown option: ${argument}`);
    } else {
      throw new Error(`Unexpected argument: ${argument}`);
    }
  }

  const exclusiveCount = [
    options.help,
    options.printApsDigest,
    options.printBabashkaGuidance,
    options.provision !== undefined,
    options.validateLocalBabashka,
  ]
    .filter(Boolean).length;
  if (exclusiveCount > 1 || (exclusiveCount > 0 && (options.require || options.strictRuntime))) {
    throw new Error("help, print, local-Babashka validation, and provision operations must be used alone");
  }
  return options;
}

export async function treeDigest(directory) {
  const hash = createHash("sha256");
  async function visit(current) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      if (entry.name === ".git") continue;
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await visit(absolute);
      } else if (entry.isFile()) {
        hash.update(path.relative(directory, absolute).split(path.sep).join("/"));
        hash.update("\0");
        hash.update(await readFile(absolute));
        hash.update("\0");
      } else {
        throw new Error(`Unsupported entry in locked tree: ${absolute}`);
      }
    }
  }
  await visit(directory);
  return hash.digest("hex");
}

function parseNumericVersion(value, label) {
  const match = value.match(/(\d+)\.(\d+)\.(\d+)/u);
  if (!match) throw new Error(`Could not parse ${label} version from: ${value}`);
  return match.slice(1).map(Number);
}

function versionAtLeast(actual, minimum) {
  const left = parseNumericVersion(actual, "actual");
  const right = parseNumericVersion(minimum, "minimum");
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] > right[index];
  }
  return true;
}

function localNodeTarget(lock) {
  const platformKey = `${process.platform}-${process.arch}`;
  const platform = lock.node.platforms?.[platformKey];
  if (!platform) return { platformKey, platform: undefined, target: undefined };
  const directoryName = platform.archive.replace(/\.tar\.(?:xz|gz)$/u, "");
  return {
    platformKey,
    platform,
    target: path.join(root, "tmp/toolchain", directoryName),
  };
}

function nodeBootstrapMessage(lock) {
  const { platformKey, platform, target } = localNodeTarget(lock);
  if (!platform) {
    return `No project-local Node archive is locked for ${platformKey}; install Node ${lock.node.version} with your runtime manager.`;
  }
  const binary = path.join(target, "bin/node");
  return [
    `Run: node scripts/check-swarmforge-toolchain.mjs --provision node`,
    `Then: export PATH='${path.dirname(binary).replaceAll("'", "'\\''")}':"$PATH"`,
    `Validate: '${binary.replaceAll("'", "'\\''")}' scripts/check-swarmforge-toolchain.mjs --strict-runtime`,
  ].join("\n");
}

async function validateNode(lock, strict) {
  const actual = process.version.replace(/^v/u, "");
  if (actual !== lock.node.version) {
    const message = `Node lock mismatch: expected ${lock.node.version}, found ${actual}.\n${nodeBootstrapMessage(lock)}`;
    if (strict) throw new Error(message);
    console.warn(`WARNING: ${message}`);
  }
  return actual;
}

async function sha256File(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

async function unlinkIfPresent(file) {
  try {
    await unlink(file);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function download(url, destination, redirectsLeft = 5) {
  await new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        if (redirectsLeft === 0) {
          reject(new Error(`Too many redirects while downloading ${url}`));
          return;
        }
        const redirected = new URL(response.headers.location, url).toString();
        download(redirected, destination, redirectsLeft - 1).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Download failed with HTTP ${response.statusCode}: ${url}`));
        return;
      }
      pipeline(response, createWriteStream(destination, { flags: "wx" })).then(resolve, reject);
    });
    request.on("error", reject);
  });
}

async function ensureVerifiedArchive(platform, label) {
  const downloads = path.join(root, "tmp/toolchain/downloads");
  const archive = path.join(downloads, platform.archive);
  await mkdir(downloads, { recursive: true });

  if (await exists(archive)) {
    const cachedDigest = await sha256File(archive);
    if (cachedDigest === platform.sha256) return archive;
  }

  const partial = uniqueSibling(archive, "download");
  try {
    await download(platform.url, partial);
    const digest = await sha256File(partial);
    if (digest !== platform.sha256) {
      throw new Error(`${label} archive checksum mismatch: expected ${platform.sha256}, found ${digest}`);
    }
    try {
      await rename(partial, archive);
    } catch (promotionError) {
      if (!await exists(archive) || await sha256File(archive) !== platform.sha256) {
        throw new Error(`Could not atomically promote verified ${label} archive: ${promotionError.message}`);
      }
    }
  } finally {
    await unlinkIfPresent(partial);
  }

  const digest = await sha256File(archive);
  if (digest !== platform.sha256) throw new Error(`Cached ${label} archive checksum mismatch: ${digest}`);
  return archive;
}

async function archiveRelativeEntries(archive, archiveRoot) {
  const { stdout } = await exec("tar", ["-tJf", archive], { cwd: root });
  const entries = new Set();
  let sawRoot = false;
  for (const line of stdout.split(/\r?\n/u)) {
    if (!line) continue;
    const member = line.endsWith("/") ? line.slice(0, -1) : line;
    if (member === archiveRoot) {
      sawRoot = true;
      continue;
    }
    const prefix = `${archiveRoot}/`;
    if (!member.startsWith(prefix)) {
      throw new Error(`Node archive member escapes its locked root ${archiveRoot}: ${line}`);
    }
    const relative = member.slice(prefix.length);
    if (!relative
      || relative.includes("\0")
      || relative.includes("\n")
      || path.posix.isAbsolute(relative)
      || path.posix.normalize(relative) !== relative
      || relative.split("/").includes("..")) {
      throw new Error(`Unsafe Node archive member: ${line}`);
    }
    entries.add(relative);
  }
  if (!sawRoot || entries.size === 0) {
    throw new Error(`Node archive does not contain a complete ${archiveRoot} tree`);
  }
  return entries;
}

async function extractedRelativeEntries(target) {
  const targetStat = await lstat(target);
  if (!targetStat.isDirectory() || targetStat.isSymbolicLink()) {
    throw new Error(`Node target is not a real directory: ${target}`);
  }
  const entries = new Set();
  async function visit(directory, prefix = "") {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      entries.add(relative);
      if (entry.isDirectory()) await visit(path.join(directory, entry.name), relative);
    }
  }
  await visit(target);
  return entries;
}

function compareEntrySets(expected, actual, target) {
  const missing = [...expected].filter((entry) => !actual.has(entry)).sort();
  const unexpected = [...actual].filter((entry) => !expected.has(entry)).sort();
  if (missing.length > 0 || unexpected.length > 0) {
    const details = [
      missing.length > 0 ? `missing: ${missing.slice(0, 5).join(", ")}` : undefined,
      unexpected.length > 0 ? `unexpected: ${unexpected.slice(0, 5).join(", ")}` : undefined,
    ].filter(Boolean).join("; ");
    throw new Error(`Node target entries differ from the verified archive at ${target} (${details})`);
  }
}

export async function validateNodeArchiveTarget(archive, target, expectedVersion) {
  const archiveRoot = path.basename(target);
  const expectedEntries = await archiveRelativeEntries(archive, archiveRoot);
  const actualEntries = await extractedRelativeEntries(target);
  compareEntrySets(expectedEntries, actualEntries, target);
  try {
    await exec("tar", ["--compare", "-Jf", archive, "-C", path.dirname(target)], { cwd: root });
  } catch (error) {
    throw new Error(`Node target content differs from the verified archive at ${target}: ${error.message}`);
  }
  const binary = path.join(target, "bin/node");
  const { stdout } = await exec(binary, ["--version"], { cwd: root });
  if (stdout.replace(/^v/u, "") !== expectedVersion) {
    throw new Error(`Project-local Node reported ${stdout}, expected v${expectedVersion}`);
  }
}

async function provisionNode(lock) {
  const { platformKey, platform, target } = localNodeTarget(lock);
  if (!platform) {
    throw new Error(`Node ${lock.node.version} has no locked archive for ${platformKey}`);
  }
  const archive = await ensureVerifiedArchive(platform, "Node");
  const binary = path.join(target, "bin/node");
  if (await entryExists(target)) {
    try {
      await validateNodeArchiveTarget(archive, target, lock.node.version);
    } catch (error) {
      throw new Error(`Existing project-local Node target failed verified-archive validation; move it aside before provisioning (${error.message})`);
    }
    console.log(`node: ${lock.node.version} already provisioned at ${binary}`);
    console.log(nodeBootstrapMessage(lock));
    return;
  }

  await mkdir(path.dirname(target), { recursive: true });
  const extractionStage = uniqueSibling(target, "extract");
  const stagedTarget = path.join(extractionStage, path.basename(target));
  let promoted;
  await mkdir(extractionStage);
  try {
    await archiveRelativeEntries(archive, path.basename(target));
    await exec("tar", ["-xJf", archive, "-C", extractionStage], { cwd: root });
    await validateNodeArchiveTarget(archive, stagedTarget, lock.node.version);
    ({ promoted } = await atomicPromoteDirectory(
      stagedTarget,
      target,
      (finalTarget) => validateNodeArchiveTarget(archive, finalTarget, lock.node.version),
      "Node toolchain",
    ));
  } finally {
    await removeOwnedTemporary(extractionStage);
  }
  await validateNodeArchiveTarget(archive, target, lock.node.version);
  console.log(`node: ${lock.node.version} ${promoted ? "provisioned" : "concurrently provisioned"} at ${binary}`);
  console.log(nodeBootstrapMessage(lock));
}

function localBabashkaTarget(lock, platformKey = `${process.platform}-${process.arch}`) {
  const platform = lock.babashka.platforms?.[platformKey];
  return {
    binary: path.join(root, "tmp/toolchain/babashka/bin/bb"),
    platform,
    platformKey,
    target: path.join(root, "tmp/toolchain/babashka"),
  };
}

export function babashkaBootstrapMessage(lock, platformKey = `${process.platform}-${process.arch}`) {
  const { binary, platform } = localBabashkaTarget(lock, platformKey);
  if (!platform) {
    return `Install Babashka ${lock.babashka.version} on PATH; no project-local archive is locked for ${platformKey}.`;
  }
  const checker = path.join(root, "scripts/check-swarmforge-toolchain.mjs");
  return [
    `Run: node "${checker.replaceAll('"', '\\"')}" --provision babashka`,
    `Then rerun ./swarm; it will prefer the locked project-local binary at ${binary}.`,
  ].join("\n");
}

async function validateBabashkaArchiveLayout(archive) {
  const { stdout } = await exec("tar", ["-tzf", archive], { cwd: root });
  if (stdout !== "bb") {
    throw new Error(`Babashka archive must contain exactly one bb binary; found: ${stdout || "nothing"}`);
  }
}

async function validateBabashkaArchive(archive, platform) {
  const archiveDigest = await sha256File(archive);
  if (archiveDigest !== platform.sha256) {
    throw new Error(`Babashka archive checksum mismatch: expected ${platform.sha256}, found ${archiveDigest}`);
  }
  await validateBabashkaArchiveLayout(archive);
}

export async function validateBabashkaArchiveTarget(archive, target, platform, expectedVersion) {
  await validateBabashkaArchive(archive, platform);
  await validateBabashkaTarget(target, platform, expectedVersion);
}

export async function validateBabashkaTarget(target, platform, expectedVersion) {
  const rootEntries = (await readdir(target)).sort();
  const binEntries = (await readdir(path.join(target, "bin"))).sort();
  if (rootEntries.length !== 1 || rootEntries[0] !== "bin"
    || binEntries.length !== 1 || binEntries[0] !== "bb") {
    throw new Error(`Babashka target contains unexpected or incomplete entries at ${target}`);
  }
  const binary = path.join(target, "bin/bb");
  const binaryStat = await lstat(binary);
  if (!binaryStat.isFile() || binaryStat.isSymbolicLink() || (binaryStat.mode & 0o111) === 0) {
    throw new Error(`Babashka target is not a real executable file: ${binary}`);
  }
  const binaryDigest = await sha256File(binary);
  if (binaryDigest !== platform.binarySha256) {
    throw new Error(`Babashka binary checksum mismatch: expected ${platform.binarySha256}, found ${binaryDigest}`);
  }
  const { stdout } = await exec(binary, ["--version"], { cwd: root });
  const actual = stdout.replace(/^babashka v/u, "");
  if (actual !== expectedVersion) {
    throw new Error(`Project-local Babashka reported ${stdout}, expected babashka v${expectedVersion}`);
  }
}

export async function validateLocalBabashka(lock) {
  const { binary, platform, platformKey, target } = localBabashkaTarget(lock);
  if (!platform) {
    throw new Error(`Cannot validate a project-local Babashka binary: no archive is locked for ${platformKey}`);
  }
  if (!await entryExists(target)) {
    throw new Error(`Project-local Babashka is not installed at ${binary}.\n${babashkaBootstrapMessage(lock)}`);
  }
  await validateBabashkaTarget(target, platform, lock.babashka.version);
  return binary;
}

export async function installBabashkaArchive(archive, target, platform, expectedVersion) {
  await validateBabashkaArchive(archive, platform);
  if (await entryExists(target)) {
    await validateBabashkaArchiveTarget(archive, target, platform, expectedVersion);
    return { promoted: false };
  }
  await mkdir(path.dirname(target), { recursive: true });
  const stage = uniqueSibling(target, "extract");
  try {
    await mkdir(path.join(stage, "bin"), { recursive: true });
    await exec("tar", ["-xzf", archive, "-C", path.join(stage, "bin"), "--no-same-owner"], { cwd: root });
    await validateBabashkaArchiveTarget(archive, stage, platform, expectedVersion);
    const result = await atomicPromoteDirectory(
      stage,
      target,
      (finalTarget) => validateBabashkaArchiveTarget(archive, finalTarget, platform, expectedVersion),
      "Babashka toolchain",
    );
    await validateBabashkaArchiveTarget(archive, target, platform, expectedVersion);
    return result;
  } finally {
    await removeOwnedTemporary(stage);
  }
}

async function provisionBabashka(lock) {
  const { binary, platform, platformKey, target } = localBabashkaTarget(lock);
  if (!platform) {
    throw new Error(`Babashka ${lock.babashka.version} has no locked archive for ${platformKey}`);
  }
  const archive = await ensureVerifiedArchive(platform, "Babashka");
  let result;
  try {
    result = await installBabashkaArchive(archive, target, platform, lock.babashka.version);
  } catch (error) {
    if (await entryExists(target)) {
      throw new Error(`Existing project-local Babashka target failed verified-archive validation; move it aside before provisioning (${error.message})`);
    }
    throw error;
  }
  console.log(`babashka: ${lock.babashka.version} ${result.promoted ? "provisioned" : "already or concurrently provisioned"} at ${binary}`);
  console.log(babashkaBootstrapMessage(lock));
}

async function validateAps(lock) {
  const aps = lock["acceptance-pipeline-specification"];
  const digest = await treeDigest(path.join(root, aps.vendorPath));
  if (digest !== aps.contentSha256) {
    throw new Error("Vendored APS content differs from swarmforge/toolchain.lock.json");
  }
  return { aps, digest };
}

async function validateTypeScript(lock) {
  const packageLock = JSON.parse(await readFile(path.join(root, lock.typescript.lockfile), "utf8"));
  const locked = packageLock.packages?.["node_modules/typescript"]?.version;
  if (locked !== lock.typescript.version) {
    throw new Error(`TypeScript lock mismatch: expected ${lock.typescript.version}, found ${locked || "missing"}`);
  }
  const manifestPath = path.join(root, "node_modules/typescript/package.json");
  let installed;
  try {
    installed = JSON.parse(await readFile(manifestPath, "utf8")).version;
    await access(path.join(root, "node_modules/typescript/lib/tsc.js"));
  } catch (error) {
    throw new Error(`TypeScript ${lock.typescript.version} is not installed; run npm ci (${error.message})`);
  }
  if (installed !== lock.typescript.version) {
    throw new Error(`Installed TypeScript mismatch: expected ${lock.typescript.version}, found ${installed}`);
  }
  return installed;
}

export async function validateDirectNpmDependencies({
  repositoryRoot = root,
  lockfile = "package-lock.json",
} = {}) {
  let manifest;
  let packageLock;
  try {
    [manifest, packageLock] = await Promise.all([
      readFile(path.join(repositoryRoot, "package.json"), "utf8").then(JSON.parse),
      readFile(path.join(repositoryRoot, lockfile), "utf8").then(JSON.parse),
    ]);
  } catch (error) {
    throw new Error(`Direct npm dependency preflight could not read package.json and ${lockfile}: ${error.message}`);
  }

  const lockRoot = packageLock?.packages?.[""];
  if (!lockRoot || typeof lockRoot !== "object" || Array.isArray(lockRoot)) {
    throw new Error(`Direct npm dependency preflight requires ${lockfile} packages[\"\"] metadata`);
  }

  const declarations = [];
  const issues = [];
  for (const section of ["dependencies", "devDependencies"]) {
    const declared = manifest?.[section] ?? {};
    if (!declared || typeof declared !== "object" || Array.isArray(declared)) {
      issues.push(`package.json ${section} must be an object`);
      continue;
    }
    for (const [name, requested] of Object.entries(declared).sort(([left], [right]) => left.localeCompare(right))) {
      if (typeof requested !== "string" || requested.length === 0) {
        issues.push(`${name}: package.json ${section} has an invalid requested version`);
        continue;
      }
      const lockedRequest = lockRoot[section]?.[name];
      if (lockedRequest !== requested) {
        issues.push(
          `${name}: package-lock root ${section} declares ${lockedRequest ?? "missing"}; package.json declares ${requested}`,
        );
      }
      declarations.push({ name, requested, section });
    }
  }

  const versions = {};
  const nodeModules = path.resolve(repositoryRoot, "node_modules");
  for (const { name } of declarations) {
    const lockEntry = packageLock.packages?.[`node_modules/${name}`];
    const lockedVersion = lockEntry?.version;
    if (typeof lockedVersion !== "string" || lockedVersion.length === 0) {
      issues.push(`${name}: ${lockfile} has no exact root installation version`);
      continue;
    }
    versions[name] = lockedVersion;

    const installedManifest = path.resolve(nodeModules, name, "package.json");
    if (installedManifest !== path.join(nodeModules, name, "package.json")
        || !installedManifest.startsWith(`${nodeModules}${path.sep}`)) {
      issues.push(`${name}: invalid direct dependency package name`);
      continue;
    }
    let installedVersion;
    try {
      installedVersion = JSON.parse(await readFile(installedManifest, "utf8")).version;
    } catch (error) {
      issues.push(
        `${name}: missing or unreadable at ${path.relative(repositoryRoot, installedManifest)}; expected package-lock version ${lockedVersion} (${error.message})`,
      );
      continue;
    }
    if (installedVersion !== lockedVersion) {
      issues.push(`${name}: installed version mismatch; expected ${lockedVersion}, found ${installedVersion ?? "missing"}`);
    }
  }

  if (issues.length > 0) {
    throw new Error([
      `Direct npm dependency preflight failed (${issues.length} issue${issues.length === 1 ? "" : "s"}):`,
      ...issues.map((issue) => `- ${issue}`),
      "Restore package.json/package-lock.json consistency, run `npm ci` with the locked Node runtime, then rerun the strict toolchain check.",
    ].join("\n"));
  }
  return { count: declarations.length, versions };
}

async function validateBabashka(lock) {
  const { target } = localBabashkaTarget(lock);
  if (await entryExists(target)) await validateLocalBabashka(lock);
  let stdout;
  try {
    ({ stdout } = await exec("bb", ["--version"], { cwd: root }));
  } catch (error) {
    throw new Error(`Babashka ${lock.babashka.version} is not available.\n${babashkaBootstrapMessage(lock)} (${error.message})`);
  }
  const actual = stdout.replace(/^babashka v/u, "");
  if (actual !== lock.babashka.version) {
    throw new Error(`Babashka lock mismatch: expected ${lock.babashka.version}, found ${actual}.\n${babashkaBootstrapMessage(lock)}`);
  }
  return actual;
}

function normalizedRepository(value) {
  return value.replace(/\/$/u, "").replace(/\.git$/u, "");
}

async function validateToolMappings(lock) {
  const deps = await readFile(path.join(root, "deps.edn"), "utf8");
  for (const name of gitTools) {
    const entry = lock[name];
    const aliasMarker = `\n  :${entry.alias} `;
    const aliasStart = deps.indexOf(aliasMarker);
    if (aliasStart < 0) {
      throw new Error(`deps.edn has no :${entry.alias} alias for ${name}`);
    }
    const nextAlias = deps.indexOf("\n  :", aliasStart + aliasMarker.length);
    const aliasBlock = deps.slice(aliasStart, nextAlias < 0 ? undefined : nextAlias);
    if (!aliasBlock.includes(`:local/root \"${entry.localRoot}\"`)) {
      throw new Error(`deps.edn does not use locked local root ${entry.localRoot} for ${name}`);
    }
    if (deps.includes(entry.revision)) {
      throw new Error(`deps.edn duplicates the ${name} revision; swarmforge/toolchain.lock.json must be authoritative`);
    }
  }
}

async function depsDigest() {
  return createHash("sha256")
    .update(await readFile(path.join(root, "deps.edn")))
    .digest("hex");
}

function preparedMarkerPath(name) {
  return path.join(root, "tmp/toolchain/prepared", `${name}.json`);
}

async function validatePreparedTool(lock, name, target) {
  let marker;
  try {
    marker = JSON.parse(await readFile(preparedMarkerPath(name), "utf8"));
  } catch (error) {
    throw new Error(`${name} dependency cache is not prepared; run node scripts/check-swarmforge-toolchain.mjs --provision ${name} (${error.message})`);
  }
  const entry = lock[name];
  if (marker.revision !== entry.revision || marker.alias !== entry.alias) {
    throw new Error(`${name} prepared-cache marker does not match the toolchain lock; provision it again`);
  }
  if (marker.depsSha256 !== await depsDigest()) {
    throw new Error(`${name} was prepared for a different deps.edn; provision it again`);
  }
  if (!Array.isArray(marker.classpath) || marker.classpath.length === 0) {
    throw new Error(`${name} prepared-cache marker has no classpath`);
  }
  const resolvedClasspath = marker.classpath.map((entryPath) => path.resolve(root, entryPath));
  if (!resolvedClasspath.some((entryPath) => entryPath === target || entryPath.startsWith(`${target}${path.sep}`))) {
    throw new Error(`${name} prepared classpath does not use locked checkout ${target}`);
  }
  try {
    await Promise.all(resolvedClasspath.map((entryPath) => access(entryPath)));
  } catch (error) {
    throw new Error(`${name} prepared dependency cache is incomplete; provision it again (${error.message})`);
  }
}

async function gitCheckoutState(target) {
  const [{ stdout: revision }, { stdout: origin }, { stdout: dirty }] = await Promise.all([
    exec("git", ["rev-parse", "HEAD"], { cwd: target }),
    exec("git", ["remote", "get-url", "origin"], { cwd: target }),
    exec("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: target }),
  ]);
  return { dirty, origin, revision };
}

function assertReplaceableGitCheckout(entry, name, state) {
  if (state.dirty) {
    throw new Error(`${name} cache has local changes; refusing to use or replace a dirty tool checkout`);
  }
  if (normalizedRepository(state.origin) !== normalizedRepository(entry.repository)) {
    throw new Error(`${name} origin mismatch: expected ${entry.repository}, found ${state.origin}`);
  }
}

async function validateGitCheckout(lock, name, target, { verifyPrepared = false, log = false } = {}) {
  const entry = lock[name];
  const { dirty, origin, revision } = await gitCheckoutState(target);
  if (dirty) throw new Error(`${name} cache has local changes; refusing to use or replace a dirty tool checkout`);
  if (normalizedRepository(origin) !== normalizedRepository(entry.repository)) {
    throw new Error(`${name} origin mismatch: expected ${entry.repository}, found ${origin}`);
  }
  if (revision !== entry.revision) {
    throw new Error(`${name} revision mismatch: expected ${entry.revision}, found ${revision}`);
  }
  if (verifyPrepared) await validatePreparedTool(lock, name, target);
  if (log) console.log(`${name}: ${revision}`);
  return revision;
}

async function cloneLockedGitCheckout(lock, name, stage) {
  const entry = lock[name];
  await exec("git", ["clone", "--filter=blob:none", "--no-checkout", entry.repository, stage], { cwd: root });
  await exec("git", ["fetch", "--depth=1", "origin", entry.revision], { cwd: stage });
  await exec("git", ["checkout", "--detach", entry.revision], { cwd: stage });
  await validateGitCheckout(lock, name, stage);
}

export async function recoverStrandedGitCheckout(lock, name, target) {
  const entry = lock[name];
  const parent = path.dirname(target);
  const prefix = `.${path.basename(target)}.displaced-`;
  const candidates = (await readdir(parent))
    .filter((candidate) => candidate.startsWith(prefix))
    .map((candidate) => path.join(parent, candidate))
    .sort();
  const live = candidates.filter((candidate) => {
    const suffix = path.basename(candidate).slice(prefix.length);
    const owner = /^(\d+)-/u.exec(suffix);
    return owner && processIsAlive(Number(owner[1]));
  });
  // Another provisioner can still be between its target recheck and atomic
  // exchange. Do not reinterpret any sibling as crash residue while that owner
  // is alive; normal staged provisioning can safely converge instead.
  if (live.length > 0) return { recovered:false, deferred:true };
  const stranded = candidates;
  if (stranded.length === 0) return { recovered: false };
  if (stranded.length > 1) {
    throw new Error(`${name} has multiple stranded displaced checkouts; refusing automatic recovery: ${stranded.join(", ")}`);
  }
  const [displaced] = stranded;
  const displacedState = await gitCheckoutState(displaced);
  assertReplaceableGitCheckout(entry, name, displacedState);
  if (await entryExists(target)) {
    if (!await exists(path.join(target, ".git"))) {
      throw new Error(`${name} has a non-Git final target and a stranded displaced checkout; refusing automatic recovery: ${displaced}`);
    }
    const finalState = await gitCheckoutState(target);
    assertReplaceableGitCheckout(entry, name, finalState);
    if (finalState.revision === entry.revision) {
      await removeOwnedTemporary(displaced);
      return { recovered: true, cleaned: true, revision:finalState.revision };
    }
    if (displacedState.revision !== entry.revision) {
      throw new Error(`${name} recovery is ambiguous: neither the final nor displaced checkout is at the locked revision`);
    }
    await atomicExchangeDirectories(
      displaced,
      target,
      (finalTarget) => validateGitCheckout(lock, name, finalTarget),
      async (displacedTarget) => {
        const state = await gitCheckoutState(displacedTarget);
        assertReplaceableGitCheckout(entry, name, state);
      },
      `${name} checkout recovery`,
    );
    await validateGitCheckout(lock, name, target);
    await removeOwnedTemporary(displaced);
    return { recovered: true, replaced: true, revision:entry.revision };
  }
  try {
    await rename(displaced, target);
  } catch (error) {
    throw new Error(`${name} could not atomically recover stranded checkout ${displaced}: ${error.message}`);
  }
  const recoveredState = await gitCheckoutState(target);
  assertReplaceableGitCheckout(entry, name, recoveredState);
  return { recovered: true, revision: recoveredState.revision };
}

export async function ensureLockedGitCheckout(lock, name, target) {
  const entry = lock[name];
  await mkdir(path.dirname(target), { recursive: true });
  await recoverStrandedGitCheckout(lock, name, target);
  if (!await entryExists(target)) {
    const stage = uniqueSibling(target, "clone");
    try {
      await cloneLockedGitCheckout(lock, name, stage);
      const result = await atomicPromoteDirectory(
        stage,
        target,
        (finalTarget) => validateGitCheckout(lock, name, finalTarget),
        `${name} checkout`,
      );
      await validateGitCheckout(lock, name, target);
      return result;
    } finally {
      await removeOwnedTemporary(stage);
    }
  }

  if (!await exists(path.join(target, ".git"))) {
    throw new Error(`Non-Git path blocks ${name} provisioning: ${target}`);
  }
  const initialState = await gitCheckoutState(target);
  assertReplaceableGitCheckout(entry, name, initialState);
  if (initialState.revision === entry.revision) {
    await validateGitCheckout(lock, name, target);
    return { promoted: false, replaced: false };
  }

  const stage = uniqueSibling(target, "displaced");
  let exchangeCompleted = false;
  let preserveStage = false;
  try {
    await cloneLockedGitCheckout(lock, name, stage);
    const currentState = await gitCheckoutState(target);
    assertReplaceableGitCheckout(entry, name, currentState);
    if (currentState.revision === entry.revision) {
      await validateGitCheckout(lock, name, target);
      return { promoted: false, replaced: false };
    }
    await atomicExchangeDirectories(
      stage,
      target,
      (finalTarget) => validateGitCheckout(lock, name, finalTarget),
      async (displacedTarget) => {
        const displacedState = await gitCheckoutState(displacedTarget);
        assertReplaceableGitCheckout(entry, name, displacedState);
      },
      `${name} checkout`,
    );
    exchangeCompleted = true;
    await validateGitCheckout(lock, name, target);
    return { promoted: false, replaced: true };
  } catch (error) {
    preserveStage = error.preserveStage === true || exchangeCompleted;
    throw error;
  } finally {
    if (!preserveStage) await removeOwnedTemporary(stage);
  }
}

async function validateGitTool(lock, name, { required = false, verifyPrepared = false } = {}) {
  const target = path.join(root, lock[name].localRoot);
  if (!await exists(path.join(target, ".git"))) {
    if (required) throw new Error(`${name} is not provisioned; run node scripts/check-swarmforge-toolchain.mjs --provision ${name}`);
    console.log(`${name}: not provisioned (provision only when the role needs it)`);
    return undefined;
  }
  return validateGitCheckout(lock, name, target, { verifyPrepared, log: true });
}

async function writePreparedMarker(name, marker) {
  const target = preparedMarkerPath(name);
  const contents = `${JSON.stringify(marker, null, 2)}\n`;
  await mkdir(path.dirname(target), { recursive: true });
  const stage = uniqueSibling(target, "prepare");
  try {
    await writeFile(stage, contents, { encoding: "utf8", flag: "wx" });
    try {
      await rename(stage, target);
    } catch (promotionError) {
      let finalContents;
      try {
        finalContents = await readFile(target, "utf8");
      } catch {
        // Report the original atomic-promotion error below.
      }
      if (finalContents !== contents) {
        throw new Error(`Could not atomically promote ${name} prepared-cache marker: ${promotionError.message}`);
      }
    }
  } finally {
    await unlinkIfPresent(stage);
  }
}

async function provisionGitTool(lock, name) {
  await validateToolMappings(lock);
  const entry = lock[name];
  const target = path.join(root, entry.localRoot);
  await ensureLockedGitCheckout(lock, name, target);
  await validateGitTool(lock, name, { required: true });
  const wrapper = path.join(root, "swarmforge/scripts/clj");
  await exec(wrapper, ["-P", `-M:${entry.alias}`], { cwd: root });
  const { stdout: classpath } = await exec(wrapper, ["-Sforce", "-Spath", `-M:${entry.alias}`], { cwd: root });
  const classpathEntries = classpath.split(path.delimiter).filter(Boolean);
  if (!classpathEntries.some((entryPath) => {
    const resolved = path.resolve(root, entryPath);
    return resolved === target || resolved.startsWith(`${target}${path.sep}`);
  })) {
    throw new Error(`${name} alias :${entry.alias} did not resolve through locked checkout ${target}`);
  }
  const marker = {
    alias: entry.alias,
    classpath: classpathEntries,
    depsSha256: await depsDigest(),
    revision: entry.revision,
  };
  await writePreparedMarker(name, marker);
  await validateGitTool(lock, name, { required: true, verifyPrepared: true });
}

async function validateCodex(lock) {
  const [{ stdout: versionOutput }, { stdout: help }, { stdout: features }] = await Promise.all([
    exec("codex", ["--version"], { cwd: root }),
    exec("codex", ["--help"], { cwd: root }),
    exec("codex", ["features", "list"], { cwd: root }),
  ]);
  const versionMatch = versionOutput.match(/(\d+\.\d+\.\d+)/u);
  if (!versionMatch || !versionAtLeast(versionMatch[1], lock.codex.minimumVersion)) {
    throw new Error(`Codex ${lock.codex.minimumVersion} or newer is required; found ${versionOutput}`);
  }
  for (const option of lock.codex.requiredOptions) {
    if (!help.includes(option)) throw new Error(`Codex ${versionMatch[1]} does not support required option ${option}`);
  }
  const featureLine = features.split(/\r?\n/u).find((line) => line.trimStart().startsWith(`${lock.codex.requiredFeature} `));
  if (!featureLine || /\bremoved\b/u.test(featureLine)) {
    throw new Error(`Codex ${versionMatch[1]} does not support required feature ${lock.codex.requiredFeature}`);
  }
  return versionMatch[1];
}

async function readLock() {
  return JSON.parse(await readFile(path.join(root, "swarmforge/toolchain.lock.json"), "utf8"));
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    console.log(usage);
    return;
  }
  const lock = await readLock();
  if (options.printBabashkaGuidance) {
    console.log(babashkaBootstrapMessage(lock));
    return;
  }
  if (options.validateLocalBabashka) {
    console.log(await validateLocalBabashka(lock));
    return;
  }
  const lockedNames = new Set(Object.keys(lock).filter((name) => name !== "version"));
  if (options.require && !lockedNames.has(options.require)) {
    throw new Error(`Unknown locked tool: ${options.require}`);
  }
  if (options.provision && !provisionable.has(options.provision)) {
    throw new Error(`Tool cannot be provisioned by this checker: ${options.provision}`);
  }
  if (options.provision === "node") {
    await provisionNode(lock);
    return;
  }
  if (options.provision === "babashka") {
    await validateNode(lock, false);
    await provisionBabashka(lock);
    return;
  }
  if (options.provision) {
    await validateNode(lock, false);
    await provisionGitTool(lock, options.provision);
    return;
  }

  const { aps, digest } = await validateAps(lock);
  if (options.printApsDigest) {
    console.log(digest);
    return;
  }
  const node = await validateNode(lock, options.strictRuntime || options.require === "node");
  const [babashka, typescript, directDependencies] = await Promise.all([
    validateBabashka(lock),
    validateTypeScript(lock),
    validateDirectNpmDependencies({ lockfile: lock.typescript.lockfile }),
    validateToolMappings(lock),
  ]);

  let codex;
  if (options.require === "codex") codex = await validateCodex(lock);
  const requestedGitTool = gitTools.includes(options.require) ? options.require : undefined;
  if (requestedGitTool) {
    await validateGitTool(lock, requestedGitTool, { required: true, verifyPrepared: true });
  } else {
    for (const name of gitTools) await validateGitTool(lock, name);
  }

  console.log(`node: ${node}${node === lock.node.version ? "" : ` (expected ${lock.node.version})`}`);
  console.log(`babashka: ${babashka}`);
  console.log(`typescript: ${typescript}`);
  console.log(`npm-direct-dependencies: ${directDependencies.count} exact`);
  if (codex) console.log(`codex: ${codex}`);
  console.log(`acceptance-pipeline-specification: ${aps.revision} (${digest})`);
}

const invokedDirectly = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  main().catch((error) => {
    console.error(`Toolchain check failed: ${error.message}`);
    process.exitCode = 1;
  });
}
