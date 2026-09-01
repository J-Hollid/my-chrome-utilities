import {validateBootstrapEligibility} from "./eligibility.mjs";
import {canonicalBootstrapPlan} from "./plan.mjs";

export async function executeBootstrapPlan(value,{runTask,afterTask}={}) {
  const plan=canonicalBootstrapPlan(value);
  validateBootstrapEligibility(plan);
  if (typeof runTask!=="function") throw new Error("Bootstrap requires a task runner");
  const results=[];
  for (const task of plan.tasks) {
    const result=await runTask(structuredClone(task));
    if (!result||result.key!==task.key||result.status!=="passed") {
      throw new Error(`Bootstrap task failed: ${task.key}`);
    }
    results.push(structuredClone(result));
    await afterTask?.(structuredClone(task),structuredClone(result),structuredClone(results));
  }
  return results;
}
