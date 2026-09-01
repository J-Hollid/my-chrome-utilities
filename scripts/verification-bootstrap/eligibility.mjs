import {canonicalBootstrapPlan} from "./plan.mjs";

export const maximumBootstrapForecastMs=300_000;

export function validateBootstrapEligibility(value) {
  const plan=canonicalBootstrapPlan(value);
  if (!Number.isFinite(plan.forecastMs)||plan.forecastMs<0||
      plan.forecastMs>maximumBootstrapForecastMs) {
    throw new Error("Bootstrap exceeds the five-minute forecast");
  }
  if (plan.parentFallback) throw new Error("Bootstrap requires parent-pack fallback");
  if (plan.packIds.length!==1||plan.packIds[0]!=="verification_process") {
    throw new Error("Bootstrap is not process-only");
  }
  return {launchEligible:true,forecastMs:plan.forecastMs,taskKeys:[...plan.taskKeys]};
}
