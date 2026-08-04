import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";

if (process.env.SWARMFORGE_PACK_RUNNER_OWNS_JS === "1") process.exit(0);

const scriptName = process.argv[2];
if (!scriptName) throw new Error("Provide an npm test script name");

const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const names = [`pre${scriptName}`, scriptName].filter((name) => packageJson.scripts[name]);
if (!packageJson.scripts[scriptName]) throw new Error(`Unknown npm script: ${scriptName}`);

function preparedCommand(name) {
  const command = packageJson.scripts[name];
  if (!command.startsWith("npm run build && ")) {
    throw new Error(`Prepared test scripts must start with npm run build: ${name}`);
  }
  return command.slice("npm run build && ".length);
}

function run(command) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, { cwd:new URL("../", import.meta.url), shell:true, stdio:"inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`Prepared test failed (${signal ?? code}): ${command}`));
    });
  });
}

for (const name of names) await run(preparedCommand(name));
