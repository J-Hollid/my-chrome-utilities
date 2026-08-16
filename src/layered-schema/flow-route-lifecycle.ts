export type FlowSchemaContributorScope = "Flow Page-instance" | "Event-occurrence";

export interface FlowSchemaRouteLifecycle {
  originFlowId?: string;
  contributorId?: string;
  contributorScope?: FlowSchemaContributorScope;
  returnFocusOwned?: true;
  flowReturnOwned?: true;
}

export function openFlowSchemaRouteLifecycle(
  originFlowId: string,
  contributorId: string,
  contributorScope: FlowSchemaContributorScope,
): FlowSchemaRouteLifecycle {
  return {originFlowId,contributorId,contributorScope,returnFocusOwned:true,flowReturnOwned:true};
}

export function reconcileFlowSchemaRouteLifecycle(
  lifecycle: FlowSchemaRouteLifecycle,
  activeFlowId: string | undefined,
): FlowSchemaRouteLifecycle {
  return lifecycle.originFlowId===activeFlowId?lifecycle:{};
}
