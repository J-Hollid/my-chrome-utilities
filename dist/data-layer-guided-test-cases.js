export function guidedTestCaseTypeOptions() {
    return [
        { value: "page-context", label: "Page context test", purpose: "Page Group applicability and Page validation", scope: "one production Page", evaluation: "production Page effective-schema evaluation" },
        { value: "event-validation", label: "Event validation test", purpose: "Assignment routing and Event validation", scope: "one production Event and optional Page", evaluation: "production Assignment and schema evaluation" },
    ];
}
export function createGuidedTestCase(input) {
    const source = input.source ?? { kind: "manual", id: input.id("manual-source"), revision: "draft" };
    return {
        id: input.id("fixture"),
        name: input.name.trim(),
        testType: input.testType,
        ...(input.eventId ?? source.eventId ? { eventId: input.eventId ?? source.eventId } : {}),
        ...(input.pageId ?? source.pageId ? { pageId: input.pageId ?? source.pageId } : {}),
        input: structuredClone(source.payload ?? {}),
        inputGuidance: { ...(source.schemaId ? { schemaId: String(source.schemaId) } : {}), ...(source.schemaRevision ? { revision: String(source.schemaRevision) } : {}), kind: "authoring-guidance" },
        sourceProvenance: { kind: source.kind, id: source.id, revision: source.revision },
        reviewedExpectations: {},
        status: "Blocked",
        differences: [],
    };
}
const valueAtPath = (value, path) => path.split("/").filter(Boolean).reduce((current, key) => current && typeof current === "object" ? current[key] : undefined, value);
export function guidedInputControls(requirements, input) {
    return requirements.map((requirement) => {
        const jsonTypes = Array.isArray(requirement.type) ? [...requirement.type] : [requirement.type ?? "string"], nullable = jsonTypes.includes("null"), primary = jsonTypes.find((type) => type !== "null") ?? "string";
        const control = nullable ? "nullable" : requirement.allowedValues?.length ? "choice" : primary === "number" || primary === "integer" ? "number" : primary === "boolean" ? "boolean" : primary === "object" ? "object" : primary === "array" ? "array" : "text";
        const constraints = Object.fromEntries(Object.entries({ allowedValues: requirement.allowedValues, minimum: requirement.minimum, maximum: requirement.maximum }).filter(([, value]) => value !== undefined));
        return { path: requirement.path, control, jsonTypes, required: requirement.required === true, constraints, ...(requirement.description ? { description: requirement.description } : {}), ...(requirement.example !== undefined ? { example: requirement.example } : {}), ...(requirement.origin ? { origin: requirement.origin } : {}), ...(valueAtPath(input, requirement.path) !== undefined ? { value: valueAtPath(input, requirement.path) } : {}) };
    });
}
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
export function compareGuidedTestCase(testCase) {
    const expected = testCase.reviewedExpectations ?? {}, actual = testCase.actualResult;
    if (!Object.keys(testCase.input ?? {}).length || !Object.keys(expected).length || !actual)
        return { ...testCase, status: "Blocked", differences: [] };
    if (testCase.evaluatorRevision && testCase.evaluatorRevision !== actual.evaluatorRevision)
        return { ...testCase, status: "Stale", differences: [] };
    const differences = Object.entries(expected).flatMap(([field, value]) => equal(value, actual[field]) ? [] : [{ field, expected: value, actual: actual[field] }]);
    return { ...testCase, status: differences.length ? "Mismatched" : "Matched", differences };
}
export async function saveAndRunGuidedTestCase(options) {
    const saved = await options.save(structuredClone(options.testCase));
    const evaluation = saved.testType === "page-context" ? await options.evaluatePage(saved) : await options.evaluateEvent(saved);
    const actualResult = { ...evaluation, evaluatorRevision: evaluation.evaluatorRevision ?? "current" };
    return compareGuidedTestCase({ ...saved, actualResult, evaluatorRevision: actualResult.evaluatorRevision });
}
export function guidedTestCaseFinding(testCase) {
    if (testCase.status === "Matched")
        return undefined;
    const repair = testCase.status === "Blocked" ? "complete its guided input and reviewed expectations" : testCase.status === "Stale" ? "rerun it against the current Draft" : `Review ${testCase.differences.map(({ field }) => field).join(", ")}.`;
    return { code: `test-case-${testCase.status.toLowerCase()}`, message: `Test case ${testCase.name} is ${testCase.status}. ${repair}`, entityId: testCase.id, field: `collections.fixtures/${testCase.id}/reviewedExpectations`, severity: "warning" };
}
//# sourceMappingURL=data-layer-guided-test-cases.js.map