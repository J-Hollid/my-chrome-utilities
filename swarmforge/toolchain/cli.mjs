import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {toolName} from "./pins.mjs";
import {loadOptionalPins} from "./io.mjs";
import {optionalOperation} from "./dispatch.mjs";
import {providers} from "./providers.mjs";

export function parseRequest(args) {
  if (args.length !== 2 || !["inspect", "provision"].includes(args[0]) || !toolName(args[1])) {
    throw new Error("request: use node swarmforge/toolchain/cli.mjs inspect|provision <tool>");
  }
  return {operation:args[0], name:args[1]};
}

export async function main(args, options = {}) {
  const request = parseRequest(args);
  const repositoryRoot = options.repositoryRoot ?? fileURLToPath(new URL("../../", import.meta.url));
  const pins = await loadOptionalPins(repositoryRoot);
  return optionalOperation({...request, pins, repositoryRoot, providers:options.providers ?? providers});
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).then((answer) => console.log(JSON.stringify(answer, null, 2)))
    .catch((error) => {console.error(error.message); process.exitCode = 1;});
}
