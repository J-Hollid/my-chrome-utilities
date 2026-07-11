function values(rows) {
    return rows.flatMap(([label, value]) => {
        const term = document.createElement("dt");
        const description = document.createElement("dd");
        term.textContent = label;
        description.textContent = value;
        return [term, description];
    });
}
export function renderTemplateChangeReview(root, review) {
    const details = root.querySelector("[data-change-details]");
    const changes = root.querySelector("[data-change-list]");
    const empty = root.querySelector("[data-no-payload-changes]");
    details?.replaceChildren(...values([
        ...review.rows,
        ...review.identity.flatMap(([field, previous, proposed]) => [[field, `${previous} → ${proposed}`]]),
        ...review.execution.flatMap(([field, previous, proposed]) => [[field, `${previous} → ${proposed}`]]),
    ]));
    changes?.replaceChildren(...review.changes.map((change) => {
        const item = document.createElement("li");
        const row = document.createElement("dl");
        row.replaceChildren(...values([["Path", change.path], ["Previous", change.previous], [review.proposedLabel, change.pushed], ["Change", change.change]]));
        item.append(row);
        return item;
    }));
    if (empty)
        empty.hidden = review.changes.length > 0;
}
//# sourceMappingURL=data-layer-template-change-review-ui.js.map