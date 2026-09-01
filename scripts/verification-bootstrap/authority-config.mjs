import {fixedBootstrapRegistry} from "./fixed-registry.mjs";

const registry=fixedBootstrapRegistry();

export const bootstrapTask=registry.task;
export const bootstrapBaseCommit=registry.baseCommit;
export const bootstrapPathDeclarations=registry.pathDeclarations;
export const bootstrapTasks=registry.tasks.map(({forecastMs,...task})=>({
  ...task,forecastMs,command:[task.executable,...task.args],
  display:[task.executable,...task.args].join(" "),
}));
