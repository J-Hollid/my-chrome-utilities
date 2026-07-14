export interface ObservationActivationState {
  readonly generation: number;
}

export const initialObservationActivationState: ObservationActivationState = {
  generation: 0,
};

export function nextObservationActivation(
  state: ObservationActivationState,
): { state: ObservationActivationState; generation: number } {
  const generation = state.generation + 1;
  return { state:{ generation }, generation };
}

export function observationActivationIsCurrent(
  state: ObservationActivationState,
  generation: number,
): boolean {
  return state.generation === generation;
}
