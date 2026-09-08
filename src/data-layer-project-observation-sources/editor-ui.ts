import type {ObservationSourceEditor} from "./editor-state.js";

export function createObservationSourceEditorUi(root: HTMLElement, editor: ObservationSourceEditor) {
  let rendered = "";
  let draftId: string | undefined;
  let readiness = "Selection required";
  function button(label: string, action: () => void): HTMLButtonElement {
    const node = document.createElement("button");
    node.type = "button"; node.textContent = label; node.addEventListener("click", action); return node;
  }
  function render(): void {
    const state = editor.state(), fingerprint = JSON.stringify(state);
    if (rendered === fingerprint) return;
    rendered = fingerprint;
    const focused = root.contains(document.activeElement) ? document.activeElement as HTMLElement : undefined;
    const focusId = focused?.id;
    const selection = focused instanceof HTMLInputElement ? [focused.selectionStart, focused.selectionEnd] : undefined;
    const openedDraft = state.draft && state.draft.id !== draftId;
    const closedDraft = draftId && !state.draft;
    draftId = state.draft?.id;
    const heading = document.createElement("h4"); heading.textContent = "Observation sources";
    const contents: HTMLElement[] = [heading];
    if (!state.configuration) {
      const guidance = document.createElement("p"); guidance.textContent = "Open project"; contents.push(guidance);
      root.replaceChildren(...contents); return;
    }
    for (const source of state.configuration.sources) {
      const row = document.createElement("div"); row.className = "observation-source-row"; row.dataset.sourceId = source.id;
      const name = document.createElement("strong"); name.textContent = source.name;
      const path = document.createElement("code"); path.textContent = source.path;
      const status = document.createElement("output"); status.dataset.sourceStatus = source.id;
      status.textContent = source.enabled ? "Waiting for path" : "Disabled"; status.setAttribute("aria-live", "polite");
      const enabledLabel = document.createElement("label"), enabled = document.createElement("input");
      enabled.type = "checkbox"; enabled.checked = source.enabled; enabled.disabled = state.saving;
      enabled.setAttribute("aria-label", `Enable ${source.name} at ${source.path}`);
      enabled.addEventListener("change", () => { void editor.setEnabled(source.id, enabled.checked); });
      enabledLabel.append(enabled, "Enabled");
      row.append(name, path, status, enabledLabel,
        button("Edit", () => editor.edit(source.id)), button("Remove", () => editor.requestRemove(source.id)));
      contents.push(row);
    }
    const add = button("Add source", () => editor.edit()); add.id = "add-observation-source"; add.disabled = state.saving;
    contents.push(add);
    if (state.draft) {
      const form = document.createElement("form"); form.setAttribute("aria-label", "Observation source");
      for (const [key, label] of [["name", "Name"], ["path", "Path"]] as const) {
        const wrapper = document.createElement("label"), input = document.createElement("input");
        wrapper.textContent = label; input.name = key; input.value = state.draft[key];
        input.id = `observation-source-${key}`; input.disabled = state.saving;
        input.setAttribute("aria-describedby", "observation-source-error");
        const invalid = state.error && (key === "name" ? state.error.includes("name") : /path/iu.test(state.error));
        input.setAttribute("aria-invalid", invalid ? "true" : "false");
        input.addEventListener("input", () => editor.update({[key]:input.value}));
        wrapper.append(input); form.append(wrapper);
      }
      const save = button(state.error ? "Retry" : "Save", () => { void editor.save(); });
      save.id = "save-observation-source"; save.disabled = state.saving;
      form.addEventListener("submit", event => { event.preventDefault(); void editor.save(); });
      form.append(save, button("Cancel", () => editor.cancel())); contents.push(form);
    }
    if (state.removeId) {
      const confirmation = document.createElement("section"); confirmation.setAttribute("role", "alertdialog");
      confirmation.setAttribute("aria-label", "Remove observation source");
      confirmation.append("Remove this source? Captured events will remain available.",
        button(state.error ? "Retry removal" : "Confirm removal", () => { void editor.confirmRemove(); }),
        button("Cancel", () => editor.cancel()));
      contents.push(confirmation);
    }
    const error = document.createElement("output"); error.id = "observation-source-error";
    error.setAttribute("role", "alert"); error.textContent = state.error; contents.push(error);
    const summary = document.createElement("output"); summary.id = "observation-source-readiness";
    summary.setAttribute("aria-live", "polite"); summary.textContent = readiness; contents.push(summary);
    root.replaceChildren(...contents);
    const nextFocus = openedDraft ? "observation-source-name" : closedDraft ? "add-observation-source" : focusId;
    if (nextFocus) {
      const control = Array.from(root.querySelectorAll<HTMLElement>("[id]")).find(node => node.id === nextFocus);
      control?.focus();
      if (control instanceof HTMLInputElement && selection && !openedDraft) {
        control.setSelectionRange(selection[0] ?? null, selection[1] ?? null);
      }
    }
  }
  return {render, readiness(value: string): void {
    readiness = value;
    const output = root.querySelector<HTMLElement>("#observation-source-readiness");
    if (output) output.textContent = value;
  }, status(id: string, value: string): void {
    for (const output of Array.from(root.querySelectorAll<HTMLElement>("[data-source-status]"))) {
      if (output.dataset.sourceStatus === id) output.textContent = value;
    }
  }};
}
