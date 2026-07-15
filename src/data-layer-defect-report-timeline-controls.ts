import {
  removeTimelineSelection,
  saveTimelineSelection,
  supportingTimeline,
  timelineEventChoices,
  type TimelineFilter,
  type TimelineSelection,
} from "./data-layer-defect-report.js";
import type { DefectReportContext } from "./data-layer-defect-report-browser.js";
import type { ComposableDefectReport, DefectReportBuilderState } from "./data-layer-defect-report-ui-controls.js";

const resultWindowSize = 20;
type ComposerStage = "idle" | "select" | "configure";

export interface TimelineControlOptions {
  selections?: readonly TimelineSelection[];
  onSelectionsChange?(selections: readonly TimelineSelection[]): void;
}

export function appendTimelineControls<Report extends ComposableDefectReport>(
  composer: HTMLElement,
  entries: HTMLElement,
  context: DefectReportContext,
  state: DefectReportBuilderState<Report>,
  options: TimelineControlOptions = {},
): void {
  let selections: TimelineSelection[] = (options.selections ?? []).map((selection) => ({ ...selection }));
  let stage: ComposerStage = "idle";
  let filter: TimelineFilter = {};
  let visibleResults = resultWindowSize;
  let draft: TimelineSelection | undefined;
  let editingEventId: string | undefined;
  let addButton: HTMLButtonElement | undefined;
  const adjustButtons = new Map<string, HTMLButtonElement>();

  const updateReport = () => {
    state.update({ ...state.report(), timeline: supportingTimeline(context.timeline, selections) });
    options.onSelectionsChange?.(structuredClone(selections));
    state.refresh();
  };

  const eventById = (eventId: string) => context.timeline.find(({ id }) => id === eventId);

  const renderEntries = () => {
    adjustButtons.clear();
    const selectedIds = new Set(selections.map(({ eventId }) => eventId));
    const chronological = [...context.timeline]
      .sort((left, right) => left.captureTime.localeCompare(right.captureTime))
      .filter(({ id }) => selectedIds.has(id));
    if (!chronological.length) {
      const empty = document.createElement("li");
      empty.textContent = "No events added to Supporting timeline.";
      entries.replaceChildren(empty);
      return;
    }
    entries.replaceChildren(...chronological.map((event) => {
      const selection = selections.find(({ eventId }) => eventId === event.id)!;
      const item = document.createElement("li"); item.dataset.timelineEntryId = event.id;
      const metadata = document.createElement("p");
      metadata.textContent = `${event.captureTime} ${event.name} · ${event.source} · ${event.pathname}`;
      const included = document.createElement("div");
      for (const [field, label] of [["includeSummary", "Summary included"], ["includePayload", "Payload included"], ["includeValidation", "Validation details included"]] as const) {
        if (!selection[field]) continue;
        const tag = document.createElement("span"); tag.dataset.timelineEvidenceIncluded = field; tag.textContent = label; included.append(tag);
      }
      const adjust = document.createElement("button"); adjust.type = "button"; adjust.textContent = "Adjust";
      adjust.addEventListener("click", () => {
        draft = { ...selection }; editingEventId = event.id; stage = "configure"; renderComposer();
      });
      adjustButtons.set(event.id, adjust);
      const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Remove";
      remove.addEventListener("click", () => {
        selections = removeTimelineSelection(selections, event.id); updateReport(); render();
      });
      item.append(metadata, included, adjust, remove); return item;
    }));
  };

  const returnToIdle = (focus: "add" | "adjust" = "add") => {
    const adjustedEventId = editingEventId;
    stage = "idle"; draft = undefined; editingEventId = undefined; render();
    if (focus === "adjust" && adjustedEventId) adjustButtons.get(adjustedEventId)?.focus({ preventScroll: true });
    else addButton?.focus({ preventScroll: true });
  };

  const cancel = () => returnToIdle(editingEventId ? "adjust" : "add");

  const renderIdle = () => {
    const hint = document.createElement("p");
    hint.textContent = selections.length
      ? "Add another captured event or adjust an existing timeline entry."
      : "Build Supporting timeline one captured event at a time.";
    addButton = document.createElement("button"); addButton.type = "button"; addButton.textContent = "Add event to timeline";
    addButton.addEventListener("click", () => {
      filter = {}; visibleResults = resultWindowSize; editingEventId = undefined; draft = undefined; stage = "select"; renderComposer();
    });
    composer.replaceChildren(hint, addButton);
  };

  const renderSelection = () => {
    const stageRoot = document.createElement("section"); stageRoot.className = "defect-timeline-composer-stage"; stageRoot.setAttribute("aria-label", "Select one captured event");
    const explanation = document.createElement("p"); explanation.textContent = "Select one captured event to configure its timeline evidence.";
    stageRoot.append(explanation);
    const choices = document.createElement("div"); choices.className = "defect-timeline-event-choices"; choices.setAttribute("aria-label", "Captured event choices");
    const older = document.createElement("button"); older.type = "button"; older.textContent = "Load older matches";
    const renderChoices = () => {
      const page = timelineEventChoices(context.timeline, filter, selections.map(({ eventId }) => eventId), visibleResults);
      choices.replaceChildren(...page.choices.map(({ event, alreadyAdded }) => {
        const label = document.createElement("label");
        const choice = document.createElement("input"); choice.type = "radio"; choice.name = "defect-timeline-event";
        choice.dataset.timelineEventId = event.id; choice.disabled = alreadyAdded;
        if (alreadyAdded) choice.dataset.alreadyAdded = "true";
        choice.addEventListener("change", () => {
          if (!choice.checked || alreadyAdded) return;
          draft = { eventId: event.id }; stage = "configure"; renderComposer();
        });
        const summary = document.createElement("span");
        summary.textContent = `${event.captureTime} ${event.name} · ${event.source} · ${event.pathname} · ${event.validation}${alreadyAdded ? " · Already added" : ""}`;
        label.append(choice, summary);
        return label;
      }));
      older.hidden = !page.hasOlder;
    };
    for (const [field, labelText] of [["search", "Search"], ["name", "Event name"], ["source", "Source"], ["pathname", "Pathname"], ["validation", "Validation state"]] as const) {
      const label = document.createElement("label"); label.textContent = `${labelText} `;
      const input = document.createElement("input"); input.dataset.timelineFilter = field; input.value = filter[field] ?? "";
      input.addEventListener("input", () => {
        filter = { ...filter, ...(input.value ? { [field]: input.value } : {}) };
        if (!input.value) delete filter[field];
        visibleResults = resultWindowSize; renderChoices();
      });
      label.append(input); stageRoot.append(label);
    }
    older.addEventListener("click", () => { visibleResults += resultWindowSize; renderChoices(); });
    renderChoices();
    stageRoot.append(choices, older);
    const cancelButton = document.createElement("button"); cancelButton.type = "button"; cancelButton.textContent = "Cancel"; cancelButton.addEventListener("click", cancel);
    stageRoot.append(cancelButton); composer.replaceChildren(stageRoot);
  };

  const renderConfiguration = () => {
    if (!draft) { stage = "select"; renderSelection(); return; }
    const event = eventById(draft.eventId);
    if (!event) { cancel(); return; }
    const stageRoot = document.createElement("section"); stageRoot.className = "defect-timeline-composer-stage"; stageRoot.setAttribute("aria-label", `Configure evidence for ${event.name}`);
    const title = document.createElement("p"); title.textContent = `Selected event: ${event.name}`;
    const always = document.createElement("p"); always.dataset.timelineAlwaysIncluded = event.id;
    always.textContent = `Always included: capture time, event name, source, and pathname — ${event.captureTime} · ${event.name} · ${event.source} · ${event.pathname}`;
    stageRoot.append(title, always);
    for (const [field, labelText] of [
      ["includeSummary", "Summary — compact event summary"],
      ["includePayload", "Payload — captured event JSON"],
      ["includeValidation", "Validation details — schema, rule, and issue information"],
    ] as const) {
      const label = document.createElement("label");
      const option = document.createElement("input"); option.type = "checkbox"; option.dataset.timelineEvidence = field; option.checked = Boolean(draft[field]);
      option.addEventListener("change", () => { draft = { ...draft!, [field]: option.checked }; });
      const description = document.createElement("span"); description.textContent = labelText;
      label.append(option, description); stageRoot.append(label);
    }
    if (!editingEventId) {
      const back = document.createElement("button"); back.type = "button"; back.textContent = "Back to event selection";
      back.addEventListener("click", () => { draft = undefined; stage = "select"; renderComposer(); });
      stageRoot.append(back);
    }
    const save = document.createElement("button"); save.type = "button"; save.textContent = editingEventId ? "Save changes" : "Add to timeline";
    save.addEventListener("click", () => {
      selections = saveTimelineSelection(selections, draft!); updateReport(); returnToIdle(editingEventId ? "adjust" : "add");
    });
    const cancelButton = document.createElement("button"); cancelButton.type = "button"; cancelButton.textContent = "Cancel"; cancelButton.addEventListener("click", cancel);
    stageRoot.append(save, cancelButton); composer.replaceChildren(stageRoot);
  };

  function renderComposer(): void {
    if (stage === "select") renderSelection();
    else if (stage === "configure") renderConfiguration();
    else renderIdle();
  }

  function render(): void { renderEntries(); renderComposer(); }
  render();
}
