import {
  defectLifecycleAction,
  type DefectStatus,
  type ReportedDefect,
} from "./data-layer-defect-library.js";
import { renderJiraReport, type GeneratedDefectReport } from "./data-layer-defect-report.js";
import { renderOccurrenceReport, type OccurrenceReport } from "./data-layer-event-occurrence-defect-report.js";
import { generateMissingEventRepresentations, type MissingEventReport } from "./data-layer-missing-event-defect-report.js";

export interface DefectLibraryElements {
  count: HTMLElement | null;
  list: HTMLElement | null;
  empty: HTMLElement | null;
  detail: HTMLElement | null;
  confirmation: HTMLElement | null;
}

export interface DefectLibraryActions {
  open(defectId: string, trigger: HTMLButtonElement): void;
  close(): void;
  save(defectId: string, report: unknown, notes: string): void;
  recopy(defectId: string): void;
  updateStatus(defectId: string, status: DefectStatus): void;
  attachCurrentSession(defectId: string): void;
  openLinkedSession(defectId: string): void;
  requestDelete(defectId: string): void;
  cancelDelete(): void;
  confirmDelete(): void;
}

export function findDefectLibraryElements(root: ParentNode = document): DefectLibraryElements {
  return {
    count:root.querySelector<HTMLElement>("#defect-library-count"),
    list:root.querySelector<HTMLElement>("#defect-library-list"),
    empty:root.querySelector<HTMLElement>("#defect-library-empty-state"),
    detail:root.querySelector<HTMLElement>("#defect-library-detail"),
    confirmation:root.querySelector<HTMLElement>("#defect-delete-confirmation"),
  };
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const result = document.createElement(tag);
  if (text !== undefined) result.textContent = text;
  return result;
}

function button(label: string, action: () => void): HTMLButtonElement {
  const result = element("button", label); result.type = "button"; result.addEventListener("click", action); return result;
}

function reportField(report: any, field: string): string { return String(report?.[field] ?? ""); }

function noteLinks(notes: string): HTMLElement {
  const links = element("section"); links.setAttribute("aria-label", "Note links");
  for (const value of notes.match(/https?:\/\/[^\s<]+/g) ?? []) {
    try {
      const url = new URL(value);
      if (url.protocol !== "http:" && url.protocol !== "https:") continue;
      const link = element("a", value); link.href = url.href; link.target = "_blank"; link.rel = "noopener noreferrer"; links.append(link);
    } catch { /* Invalid note text remains plain text in the textarea. */ }
  }
  return links;
}

function renderDetail(root: HTMLElement, defect: ReportedDefect, actions: DefectLibraryActions): void {
  const title = element("h4", reportField(defect.report, "summary") || defect.id); title.tabIndex = -1;
  const header = element("header"); header.className = "detail-view-header"; header.append(button("Back to Defects", actions.close), title);
  const identity = element("p", `${defect.type} · ${defect.status} · created ${defect.createdAt} · updated ${defect.updatedAt}`);
  const label = (text: string, control: HTMLInputElement | HTMLTextAreaElement) => { const wrapper=element("label", text); wrapper.append(control); return wrapper; };
  const summary = element("input"); summary.value = reportField(defect.report, "summary"); summary.dataset.defectField = "summary";
  const description = element("textarea"); description.value = reportField(defect.report, "description"); description.dataset.defectField = "description";
  const missingEvent = defect.type === "Missing event";
  const occurrence = defect.type === "Unexpected event" || defect.type === "Wrong event name";
  const expectedField = missingEvent ? "expectedResultAdditionalText" : "expectedExplanation";
  const expected = element("textarea"); expected.value = reportField(defect.report, expectedField); expected.dataset.defectField = expectedField;
  const notes = element("textarea"); notes.value = defect.notes; notes.dataset.defectField = "notes";
  const save = button("Save defect edits", () => {
    const edited = { ...defect.report, summary:summary.value, description:description.value, [expectedField]:expected.value };
    if (missingEvent && !expected.value.trim()) delete edited.expectedResultAdditionalText;
    actions.save(defect.id, edited, notes.value);
  });
  const recopy = button("Recopy for Jira Cloud", () => actions.recopy(defect.id));
  const lifecycle = defectLifecycleAction(defect);
  const controls = element("section"); controls.setAttribute("aria-label", "Defect actions"); controls.append(save, recopy);
  if (lifecycle === "Resolve") controls.append(button("Resolve", () => actions.updateStatus(defect.id, "Resolved")));
  if (lifecycle === "Reopen") controls.append(button("Reopen", () => actions.updateStatus(defect.id, "Reported")));
  if (defect.status !== "Archived") controls.append(button("Archive", () => actions.updateStatus(defect.id, "Archived")));
  if (defect.type !== "Missing event" && !defect.savedSession) controls.append(button("Attach current session", () => actions.attachCurrentSession(defect.id)));
  if (defect.savedSession) controls.append(button("Open linked session", () => actions.openLinkedSession(defect.id)));
  controls.append(button("Delete", () => actions.requestDelete(defect.id)));
  const issues = element("ul"); issues.setAttribute("aria-label", "Stored issue evidence");
  issues.replaceChildren(...defect.issues.map(({ match, evidence }) => element("li", `${match.canonicalPath} · ${evidence.ruleName ?? match.ruleId} revision ${match.ruleRevision} · actual ${String(evidence.actual)} · expected ${evidence.expected ?? ""}`)));
  const session = defect.savedSession ? element("p", `Linked session ${defect.savedSession.id} · ${defect.savedSession.containsMatchingIssue ? "contains a matching issue" : "does not contain a matching issue"}`) : element("p", "No linked saved session.");
  const preview = element("section"); preview.setAttribute("aria-label", "Final report preview");
  preview.innerHTML = missingEvent
    ? generateMissingEventRepresentations(defect.report as MissingEventReport).previewHtml
    : occurrence
      ? renderOccurrenceReport(defect.report as OccurrenceReport).html
      : renderJiraReport(defect.report as GeneratedDefectReport).html;
  root.replaceChildren(
    header,
    identity,
    label("Summary", summary),
    label("Description", description),
    label(missingEvent ? "Expected result additional text (optional)" : "Expected result", expected),
    preview,
    label("Internal notes", notes), noteLinks(defect.notes), issues, session, controls,
  );
  root.hidden = false; title.focus({ preventScroll:true });
}

export function renderDefectLibrary(
  elements: DefectLibraryElements,
  defects: readonly ReportedDefect[],
  selectedId: string | undefined,
  deletionConfirmationId: string | undefined,
  actions: DefectLibraryActions,
): void {
  if (elements.count) elements.count.textContent = `${defects.length} reported defects`;
  if (elements.empty) elements.empty.hidden = defects.length > 0;
  if (elements.list) {
    elements.list.replaceChildren(...defects.map((defect) => {
      const item = element("li"); item.dataset.defectId = defect.id;
      const open = button("Open", () => actions.open(defect.id, open));
      const reportSummary = reportField(defect.report, "summary") || defect.id;
      item.append(element("span", `${reportSummary} · ${defect.type} · ${defect.status} · ${defect.issues.map(({ match }) => match.canonicalPath).join(", ")} `), open);
      return item;
    }));
  }
  const selected = defects.find(({ id }) => id === selectedId);
  if (elements.detail) {
    if (selected) renderDetail(elements.detail, selected, actions);
    else { elements.detail.hidden = true; elements.detail.replaceChildren(); }
  }
  if (elements.confirmation) {
    elements.confirmation.hidden = !deletionConfirmationId;
    elements.confirmation.replaceChildren();
    if (deletionConfirmationId) elements.confirmation.append(
      element("p", `Delete defect ${deletionConfirmationId}? Captured evidence and saved sessions remain unchanged.`),
      button("Cancel deletion", actions.cancelDelete),
      button("Confirm deletion", actions.confirmDelete),
    );
  }
}
