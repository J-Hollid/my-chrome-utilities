import type { LiveObserverState } from "./data-layer-live-observer.js";

export type LiveResponsiveLayout = "feed-only" | "narrow-detail" | "wide-detail";

export function liveResponsiveLayout(
  state: Pick<LiveObserverState, "inspectorEventId">,
  width: number,
): LiveResponsiveLayout {
  if (!state.inspectorEventId) return "feed-only";
  return width >= 700 ? "wide-detail" : "narrow-detail";
}
