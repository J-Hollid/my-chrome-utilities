import { copyFile, mkdir, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";

await rm("dist", { recursive: true, force: true });
execFileSync("tsc", ["--project", "tsconfig.json"], { stdio: "inherit" });
await mkdir("dist", { recursive: true });
await copyFile("manifest.json", "dist/manifest.json");
