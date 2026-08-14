export interface FlowWheelZoomInput {
  deltaY: number;
  canvasTarget: boolean;
  browserPinchModifier?: boolean;
}

export function flowWheelZoomFactor(input: FlowWheelZoomInput): number | undefined {
  if (!input.canvasTarget || input.deltaY === 0) return undefined;
  return input.deltaY < 0 ? 1.1 : .9;
}
