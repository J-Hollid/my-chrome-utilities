export const initialObservationActivationState = {
    generation: 0,
};
export function nextObservationActivation(state) {
    const generation = state.generation + 1;
    return { state: { generation }, generation };
}
export function observationActivationIsCurrent(state, generation) {
    return state.generation === generation;
}
//# sourceMappingURL=data-layer-observation-activation.js.map