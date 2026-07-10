import type { ReplaySequence } from "./data-layer-sequence-replay.js";

export interface SequenceReplayElements {
  list: HTMLElement | null;
  result: HTMLElement | null;
}

export function findSequenceReplayElements(
  root: ParentNode = document,
): SequenceReplayElements {
  return {
    list: root.querySelector<HTMLElement>("#sequence-list"),
    result: root.querySelector<HTMLElement>("#sequence-run-result"),
  };
}

export function renderSequenceReplay(
  elements: SequenceReplayElements,
  sequences: readonly ReplaySequence[],
  runAll: (sequence: ReplaySequence) => void,
): void {
  elements.list?.replaceChildren(
    ...sequences.map((sequence) => {
      const item = document.createElement("li");
      const run = document.createElement("button");
      run.type = "button";
      run.textContent = "Run all";
      run.addEventListener("click", () => runAll(sequence));
      item.textContent = `${sequence.name}: ${sequence.steps.length} ordered steps. `;
      item.append(run);
      return item;
    }),
  );
}

export function setSequenceReplayResult(
  elements: SequenceReplayElements,
  message: string,
): void {
  if (elements.result) elements.result.textContent = message;
}
