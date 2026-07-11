import type { PushDraftReview } from "./data-layer-push-draft-review.js";

export interface PushDraftReviewElements {
  details: HTMLElement | null;
  changeList: HTMLElement | null;
  noChanges: HTMLElement | null;
}

export function findPushDraftReviewElements(
  root: ParentNode = document,
): PushDraftReviewElements {
  return {
    details: root.querySelector<HTMLElement>("#push-draft-review-details"),
    changeList: root.querySelector<HTMLElement>("#push-draft-review-change-list"),
    noChanges: root.querySelector<HTMLElement>("#push-draft-review-no-changes"),
  };
}

function labelledValues(rows: readonly (readonly [string, string])[]): Node[] {
  return rows.flatMap(([label, value]) => {
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    return [term, description];
  });
}

export function renderPushDraftReview(
  elements: PushDraftReviewElements,
  review: Pick<PushDraftReview, "rows" | "changes">,
): void {
  elements.details?.replaceChildren(...labelledValues(review.rows));
  elements.changeList?.replaceChildren(...review.changes.map((change) => {
    const item = document.createElement("li");
    const values = document.createElement("dl");
    values.replaceChildren(...labelledValues([
      ["Path", change.path],
      ["Previous", change.previous],
      ["Pushed", change.pushed],
    ]));
    item.append(values);
    return item;
  }));
  if (elements.noChanges) elements.noChanges.hidden = review.changes.length > 0;
}
