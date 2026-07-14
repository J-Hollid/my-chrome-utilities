import {
  validateLocalRulePromotion,
  type LocalRulePromotionReview,
  type LocalRulePromotionSelection,
} from "./data-layer-local-rule-promotion.js";

export interface LocalRulePromotionDialogInput {
  review: LocalRulePromotionReview;
  confirm(selection: LocalRulePromotionSelection): void | (() => void);
  cancel(): void;
}

export interface LocalRulePromotionDialogController {
  open(input: LocalRulePromotionDialogInput): void;
  close(): void;
}

function typedValue(value: string | number | boolean | null): string {
  return value === null ? "null" : `${typeof value} ${String(value)}`;
}

export function createLocalRulePromotionDialog(): LocalRulePromotionDialogController {
  const dialog = document.createElement("dialog");
  dialog.id = "local-rule-promotion-review";
  dialog.setAttribute("aria-labelledby", "local-rule-promotion-heading");
  document.body.append(dialog);
  let current: LocalRulePromotionDialogInput | undefined;

  const close = () => {
    if (!current) return;
    if (dialog.open) dialog.close();
    const cancelled = current.cancel;
    current = undefined;
    cancelled();
  };
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });

  return {
    close,
    open(input) {
      current = input;
      let duplicateArmed = false;
      const { review } = input;
      const heading = document.createElement("h4");
      heading.id = "local-rule-promotion-heading";
      heading.tabIndex = -1;
      heading.textContent = "Promote to reusable rule";
      const summary = document.createElement("p");
      summary.id = "local-rule-promotion-summary";
      const sourceContext = review.source.createsWorkingDraft
        ? "source for a new working draft"
        : "working draft";
      summary.textContent = `${review.source.schema.name} revision ${review.source.schema.version} ${sourceContext} · ${review.source.propertyPath} · ${review.source.rule.name ?? review.source.rule.id} (${review.source.rule.id}) revision ${review.source.rule.version}`;
      const configuration = document.createElement("p");
      configuration.id = "local-rule-promotion-configuration";
      const values = review.source.rule.allowedValues?.map(typedValue).join(", ") ?? review.source.rule.parameters ?? "no parameters";
      configuration.textContent = `Operator ${review.source.rule.operator ?? "rule"} · typed parameters ${values} · applicable type ${review.source.rule.applicableType ?? "any"} · severity ${review.source.rule.severity ?? "error"} · message ${review.source.rule.message ?? "default"} · condition ${review.source.rule.conditionGroup ? JSON.stringify(review.source.rule.conditionGroup) : "always"} · ${review.source.rule.enabled === false ? "disabled" : "enabled"}`;
      const actionGroup = document.createElement("fieldset");
      const actionLegend = document.createElement("legend");
      actionLegend.textContent = "Promotion action";
      actionGroup.append(actionLegend);
      const createAction = document.createElement("input");
      createAction.type = "radio";
      createAction.name = "local-rule-promotion-action";
      createAction.value = "create";
      createAction.id = "local-rule-promotion-create";
      createAction.checked = review.equivalentRules.length === 0;
      const createActionLabel = document.createElement("label");
      createActionLabel.htmlFor = createAction.id;
      createActionLabel.textContent = review.equivalentRules.length ? "Create a separate reusable rule" : "Create reusable rule";
      actionGroup.append(createAction, createActionLabel);
      for (const equivalent of review.equivalentRules) {
        const use = document.createElement("input");
        use.type = "radio";
        use.name = createAction.name;
        use.value = equivalent.id;
        use.id = `local-rule-promotion-use-${equivalent.id.replace(/[^a-z0-9]+/gi, "-")}`;
        use.checked = equivalent === review.equivalentRules[0];
        const label = document.createElement("label");
        label.htmlFor = use.id;
        label.textContent = `Use existing reusable rule ${equivalent.name} revision ${equivalent.version} (recommended)`;
        actionGroup.append(use, label);
      }
      const name = document.createElement("input");
      name.id = "local-rule-promotion-name";
      name.required = true;
      const nameLabel = document.createElement("label");
      nameLabel.htmlFor = name.id;
      nameLabel.textContent = "Rule name (required)";
      const description = document.createElement("textarea");
      description.id = "local-rule-promotion-description";
      const descriptionLabel = document.createElement("label");
      descriptionLabel.htmlFor = description.id;
      descriptionLabel.textContent = "Description (optional)";
      const examples = document.createElement("textarea");
      examples.id = "local-rule-promotion-examples";
      const examplesLabel = document.createElement("label");
      examplesLabel.htmlFor = examples.id;
      examplesLabel.textContent = "Examples (optional)";
      const assistance = document.createElement("output");
      assistance.id = "local-rule-promotion-assistance";
      assistance.setAttribute("aria-live", "polite");
      const warning = document.createElement("p");
      warning.id = "local-rule-promotion-warning";
      warning.hidden = true;
      const confirm = document.createElement("button");
      confirm.type = "button";
      confirm.textContent = "Confirm promotion";
      confirm.setAttribute("data-action-variant", "primary");
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.textContent = "Cancel";
      cancel.setAttribute("data-action-variant", "quiet");
      const selectedAction = () => dialog.querySelector<HTMLInputElement>(
        'input[name="local-rule-promotion-action"]:checked',
      );
      const selection = (): LocalRulePromotionSelection => {
        const selected = selectedAction();
        return selected?.value === "create"
          ? { action:"create", name:name.value, description:description.value, examples:examples.value }
          : { action:"use-existing", reusableRuleId:selected?.value ?? "" };
      };
      const refresh = () => {
        duplicateArmed = false;
        const validation = validateLocalRulePromotion(review, selection());
        assistance.textContent = validation.assistance;
        confirm.disabled = !validation.ready;
        warning.hidden = !validation.duplicateDefinitionWarning;
        warning.textContent = validation.duplicateDefinitionWarning
          ? "An equivalent reusable definition already exists. Confirm to create a separate duplicate definition."
          : "";
        const creating = selectedAction()?.value === "create";
        name.disabled = !creating;
        description.disabled = !creating;
        examples.disabled = !creating;
        confirm.textContent = "Confirm promotion";
      };
      actionGroup.addEventListener("change", refresh);
      name.addEventListener("input", refresh);
      description.addEventListener("input", refresh);
      examples.addEventListener("input", refresh);
      cancel.addEventListener("click", close);
      confirm.addEventListener("click", () => {
        const validation = validateLocalRulePromotion(review, selection());
        if (!validation.ready) {
          refresh();
          return;
        }
        if (validation.duplicateDefinitionWarning && !duplicateArmed) {
          duplicateArmed = true;
          warning.hidden = false;
          warning.textContent = "Equivalent definition confirmed as a deliberate duplicate. Confirm once more to persist it.";
          confirm.textContent = "Confirm duplicate definition";
          return;
        }
        try {
          const afterClose = input.confirm(selection());
          if (dialog.open) dialog.close();
          current = undefined;
          afterClose?.();
        } catch (error) {
          assistance.textContent = error instanceof Error ? `Promotion was not saved: ${error.message}` : "Promotion was not saved.";
        }
      });
      dialog.replaceChildren(heading, summary, configuration, actionGroup, nameLabel, name, descriptionLabel, description, examplesLabel, examples, assistance, warning, confirm, cancel);
      refresh();
      dialog.showModal();
      heading.focus({ preventScroll:true });
    },
  };
}
