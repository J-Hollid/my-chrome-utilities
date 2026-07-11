export function findPushDraftReviewElements(root = document) {
    return {
        details: root.querySelector("#push-draft-review-details"),
        changeList: root.querySelector("#push-draft-review-change-list"),
        noChanges: root.querySelector("#push-draft-review-no-changes"),
    };
}
function labelledValues(rows) {
    return rows.flatMap(([label, value]) => {
        const term = document.createElement("dt");
        const description = document.createElement("dd");
        term.textContent = label;
        description.textContent = value;
        return [term, description];
    });
}
export function renderPushDraftReview(elements, review) {
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
    if (elements.noChanges)
        elements.noChanges.hidden = review.changes.length > 0;
}
//# sourceMappingURL=data-layer-push-draft-review-ui.js.map