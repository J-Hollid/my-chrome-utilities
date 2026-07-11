export function liveGuidedWorkflow(input) {
    const targetSelected = input.selectedTarget !== undefined;
    const ready = input.selectedTarget?.accessState === "Ready"
        && input.pathStatus === "ready";
    const current = !targetSelected
        ? "target"
        : ready
            ? "session"
            : "readiness";
    const order = ["target", "readiness", "session"];
    const currentIndex = order.indexOf(current);
    const labels = {
        target: targetSelected
            ? `Choose target — ${input.selectedTarget?.title} selected`
            : "Choose target",
        readiness: ready
            ? "Confirm access and path — Ready"
            : `Confirm access and path — ${input.pathStatus}`,
        session: "Start testing",
    };
    return {
        setupVisible: !input.activeSession,
        steps: order.map((id, index) => ({
            id,
            label: labels[id],
            state: index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming",
        })),
        chooseTargetVisible: !input.activeSession,
        startTestingEnabled: !input.activeSession && ready,
        startTestingLabel: ready && input.selectedTarget
            ? `Start testing ${input.selectedTarget.title}`
            : "Start testing",
        startTestingDescription: ready
            ? "Starts testing with the selected ready target."
            : "Choose a ready target and confirm its observer path before starting",
    };
}
//# sourceMappingURL=data-layer-live-guided-workflow.js.map