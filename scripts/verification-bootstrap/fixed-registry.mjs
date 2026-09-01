import {createRequire} from "node:module";

import {bootstrapDigest} from "./canonical.mjs";

const require=createRequire(import.meta.url);
const registry=require("../../verification/bootstrap-fast-path-registry.v1.json");

function validTask(task) {
  return typeof task?.key==="string"&&typeof task.stage==="string"&&
    typeof task.executable==="string"&&Array.isArray(task.args)&&
    Array.isArray(task.requiredCapabilities)&&Number.isInteger(task.outputLimitBytes)&&
    task.outputLimitBytes>0&&Number.isInteger(task.forecastMs)&&task.forecastMs>0;
}

export function fixedBootstrapRegistry() {
  if (registry.version!==1||!Array.isArray(registry.tasks)||!registry.tasks.every(validTask)||
      new Set(registry.tasks.map(({key})=>key)).size!==registry.tasks.length||
      !Array.isArray(registry.pathDeclarations)||!registry.pathDeclarations.length||
      !Array.isArray(registry.requiredIncidentIds)||!registry.requiredIncidentIds.length) {
    throw new Error("Bootstrap fixed registry is invalid");
  }
  return structuredClone(registry);
}

export function fixedBootstrapRegistryDigest() {
  return bootstrapDigest(fixedBootstrapRegistry());
}
