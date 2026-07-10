import { copyFile, mkdir, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";

await rm("dist", { recursive: true, force: true });
execFileSync("tsc", ["--project", "tsconfig.json"], { stdio: "inherit" });
await mkdir("dist", { recursive: true });
await copyFile("manifest.json", "dist/manifest.json");
await copyFile("side-panel.html", "dist/side-panel.html");
await copyFile("side-panel.css", "dist/side-panel.css");
