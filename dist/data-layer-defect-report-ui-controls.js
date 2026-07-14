export function appendDetailControls(controls, edits, refresh, expectedResult = { field: "expectedExplanation", label: "Expected result explanation" }) {
    for (const [field, labelText, multiline] of [
        ["summary", "Summary", false],
        ["description", "Description", true],
        [expectedResult.field, expectedResult.label, true],
    ]) {
        const label = document.createElement("label");
        label.textContent = `${labelText} `;
        const input = multiline ? document.createElement("textarea") : document.createElement("input");
        input.dataset.reportField = field;
        input.addEventListener("input", () => { input.dataset.edited = "true"; edits[field] = input.value; refresh(); });
        label.append(input);
        controls.append(label);
    }
}
//# sourceMappingURL=data-layer-defect-report-ui-controls.js.map