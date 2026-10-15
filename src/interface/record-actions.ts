/** Keep the main task visible and place less frequent actions in a disclosure. */
export function recordActions(primary: HTMLButtonElement, secondary: readonly HTMLButtonElement[]): HTMLElement {
  const row = document.createElement("div");
  row.className = "record-actions";
  const more = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "More actions";
  more.append(summary, ...secondary);
  row.append(primary, more);
  return row;
}
