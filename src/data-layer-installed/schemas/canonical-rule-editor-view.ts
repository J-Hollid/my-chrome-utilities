import {
  canonicalPropertyPath,
  canonicalRulePropertyPath,
  renderCanonicalFocusedRules,
} from "../../utilities/data-layer/schemas.js";
import type { CanonicalInstalledViewPorts } from "./canonical-view-contracts.js";

/** Opens the staged canonical rule editor for one property. */
export function openCanonicalRuleEditor(
  ports: CanonicalInstalledViewPorts,
  path: string,
  trigger?: HTMLButtonElement,
): boolean {
  const controller = ports.controller;
  const picker = ports.rulePicker;
  const adapter = controller.editor;
  const base = adapter?.load();
  const node =
    base &&
    Object.values(base.nodes).find(
      (candidate) =>
        canonicalPropertyPath(base, candidate.id) ===
          canonicalRulePropertyPath(path) || candidate.id === path,
    );
  if (!adapter || !base || !node || !picker) return false;

  let working = structuredClone(node);
  let feedbackText = "";
  const removedRuleIds = new Set<string>();
  const properties = () =>
    Object.values(base.nodes).map(({ id, name, type, allowedValues }) => ({
      id,
      name,
      type,
      allowedValues: allowedValues.map(({ value }) => value),
    }));
  const button = (text: string, run: () => void): HTMLButtonElement => {
    const control = picker.ownerDocument.createElement("button");
    control.type = "button";
    control.textContent = text;
    control.addEventListener("click", run);
    return control;
  };
  const render = (): void => {
    const document = picker.ownerDocument;
    const focused = document.createElement("section");
    const heading = document.createElement("h3");
    const identity = document.createElement("p");
    const rules = document.createElement("section");
    const actions = document.createElement("section");
    const feedback = document.createElement("output");
    focused.dataset.focusedPropertyEditor = "true";
    focused.dataset.focusedSection = "rules";
    focused.setAttribute("aria-label", `${path} focused Rules section`);
    heading.textContent = "Rules";
    identity.textContent = `${path} · stable identity ${node.id} · Local value and effective result remain staged until Review changes.`;
    rules.setAttribute("aria-label", "Compact staged rule editor");
    actions.setAttribute("aria-label", "Property actions");
    feedback.setAttribute("role", "status");
    feedback.textContent = feedbackText;
    renderCanonicalFocusedRules(rules, {
      dom: document,
      getWorking: () => working,
      properties,
      removedRuleIds,
      invariant: working.enforcement === "invariant",
      id: (kind) => `${kind}:${crypto.randomUUID()}`,
      render,
      feedback: (message) => {
        feedbackText = message;
      },
    });
    const cancel = button("Cancel", ports.closeRulePicker);
    const review = button("Review changes", () => {
      const panel = document.createElement("section");
      const summary = document.createElement("p");
      const reviewActions = document.createElement("section");
      const stagedRules = working.rules.filter(
        ({ id }) => !removedRuleIds.has(id),
      );
      panel.setAttribute("aria-label", "Review changes");
      summary.textContent = `Review changes · ${path} · ${stagedRules.length} staged rules · one property command and one Undo action.`;
      reviewActions.setAttribute("aria-label", "Property review actions");
      reviewActions.append(
        button("Cancel review", render),
        button("Confirm changes", () => {
          void (async () => {
            const current = adapter.load();
            const result = await controller.dispatchCommand({
              kind: "set",
              baseRevision: current.revision,
              propertyId: node.id,
              patch: { rules: structuredClone(stagedRules) },
            });
            if (result) ports.closeRulePicker();
          })();
        }),
      );
      panel.append(summary, reviewActions);
      picker.replaceChildren(panel);
    });
    actions.append(feedback, cancel, review);
    focused.append(heading, identity, rules, actions);
    picker.replaceChildren(focused);
  };
  ports.setRulePicker(path, trigger);
  render();
  picker.showModal();
  picker
    .querySelector<HTMLButtonElement>(
      '[aria-label="Compact staged rule editor"] > button',
    )
    ?.focus({ preventScroll: true });
  return true;
}
