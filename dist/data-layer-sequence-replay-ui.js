export function findSequenceReplayElements(root = document) {
    return {
        list: root.querySelector("#sequence-list"),
        result: root.querySelector("#sequence-run-result"),
    };
}
export function renderSequenceReplay(elements, sequences, runAll) {
    elements.list?.replaceChildren(...sequences.map((sequence) => {
        const item = document.createElement("li");
        const run = document.createElement("button");
        run.type = "button";
        run.textContent = "Run all";
        run.addEventListener("click", () => runAll(sequence));
        item.textContent = `${sequence.name}: ${sequence.steps.length} ordered steps. `;
        item.append(run);
        return item;
    }));
}
export function setSequenceReplayResult(elements, message) {
    if (elements.result)
        elements.result.textContent = message;
}
//# sourceMappingURL=data-layer-sequence-replay-ui.js.map