import { assignmentConditionControl, buildGuidedAssignmentCondition, guidedAssignmentConditionKinds } from "./data-layer-assignment-routing.js";
import { assignmentContributorTargets, compileAssignmentContributorTarget } from "./data-layer-layered-schema-project.js";
import { compileSpecificationProject, createCanonicalProjectEnvelope, evaluateSpecificationObservation } from "./data-layer-specification-engine.js";
import { saveProjectAssignment } from "./data-layer-specification-project.js";
const labeled = (text, control) => { const label = document.createElement("label"); label.append(document.createTextNode(text), control); return label; };
const region = (label) => { const fieldset = document.createElement("fieldset"), legend = document.createElement("legend"); fieldset.setAttribute("aria-label", label); legend.textContent = label; fieldset.append(legend); return fieldset; };
const existence = (operator) => operator === "exists" || operator === "does not exist";
export function mountAssignmentRoutingWorkspace({ host, state, assignment, id, loadState, onSave }) {
    const section = document.createElement("section"), heading = document.createElement("h2"), form = document.createElement("form"), name = document.createElement("input"), evidence = document.createElement("section");
    section.className = "contextual-editor assignment-workspace-editor";
    section.dataset.assignmentWorkspace = assignment.id;
    heading.textContent = "Edit Assignment";
    name.name = "name";
    name.required = true;
    name.value = assignment.name;
    evidence.setAttribute("aria-label", "Assignment routing evidence");
    form.append(labeled("Assignment name", name));
    const schemaTarget = region("Schema target"), targetKind = document.createElement("select"), target = document.createElement("select"), targetKinds = ["Shared Profile", "Property Set", "Page", "Event", "Flow Page instance"];
    targetKind.name = "targetKind";
    target.name = "targetId";
    target.required = true;
    for (const kind of targetKinds)
        targetKind.append(new Option(kind, kind));
    targetKind.value = String(assignment.targetKind ?? "Shared Profile");
    const renderTargets = () => { const selected = target.value || String(assignment.targetId ?? ""), targets = assignmentContributorTargets(state).filter(({ kind }) => kind === targetKind.value); target.replaceChildren(new Option("Choose stable contributor target", ""), ...targets.map((candidate) => new Option(candidate.name, candidate.id))); target.value = selected; };
    schemaTarget.append(labeled("Contributor kind", targetKind), labeled("Stable contributor target", target));
    const observed = region("Observed event"), source = document.createElement("select"), eventSelect = document.createElement("select"), validationTarget = document.createElement("select"), sources = [...new Set(["browser", "server", "event-history", ...state.project.collections.events.map((event) => String(event.sourceId ?? "")).filter(Boolean)])];
    source.name = "sourceId";
    eventSelect.name = "eventId";
    validationTarget.name = "target";
    for (const value of sources)
        source.append(new Option(value, value));
    source.value = String(assignment.sourceId ?? "event-history");
    eventSelect.append(new Option("Choose Event", ""), ...state.project.collections.events.map((event) => new Option(event.name, event.id)));
    eventSelect.value = String(assignment.eventId ?? "");
    eventSelect.required = true;
    validationTarget.append(new Option("Payload", "payload"), new Option("Raw input", "raw input"));
    validationTarget.value = String(assignment.target ?? "payload");
    observed.append(labeled("Source", source), labeled("Event", eventSelect), labeled("Payload or raw-input validation target", validationTarget));
    const applicability = region("Applicability"), setSelect = document.createElement("select"), guided = document.createElement("section"), kindSelect = document.createElement("select"), guidedControls = document.createElement("div"), preview = document.createElement("output");
    setSelect.name = "applicabilitySetId";
    setSelect.append(new Option("No applicability condition", ""), ...state.project.collections.applicabilitySets.map((set) => new Option(set.name, set.id)), new Option("Start a new structured condition", "__new__"));
    setSelect.value = String(assignment.applicabilitySetId ?? "");
    for (const descriptor of guidedAssignmentConditionKinds)
        kindSelect.append(new Option(descriptor.kind, descriptor.kind));
    kindSelect.setAttribute("aria-label", "Applicability condition kind");
    guided.setAttribute("aria-label", "Guided applicability condition");
    preview.setAttribute("aria-label", "Condition preview");
    let guidedCondition;
    const targetProperties = () => { try {
        if (!target.value)
            return [];
        const candidate = { ...assignment, targetKind: targetKind.value, targetId: target.value, eventId: eventSelect.value }, result = compileAssignmentContributorTarget(state, candidate, { eventId: eventSelect.value, eventRole: "interaction" });
        return Object.entries(result.compiled.properties).map(([path, property]) => ({ path, type: String(property.type ?? "string") }));
    }
    catch {
        return [];
    } };
    function renderGuidedCondition() {
        guided.hidden = setSelect.value !== "__new__";
        guidedControls.replaceChildren();
        guidedCondition = undefined;
        if (guided.hidden)
            return;
        const descriptor = guidedAssignmentConditionKinds.find(({ kind }) => kind === kindSelect.value) ?? guidedAssignmentConditionKinds[0], comparison = document.createElement("select"), parameter = document.createElement("input"), property = document.createElement("select"), queryType = document.createElement("select"), valueLabel = document.createElement("label"), valueHost = document.createElement("span");
        let valueControl = document.createElement("input");
        comparison.setAttribute("aria-label", `${descriptor.kind} comparison`);
        parameter.setAttribute("aria-label", "Query parameter name");
        property.setAttribute("aria-label", "Schema property");
        property.append(new Option("Choose schema property", ""), ...targetProperties().map(({ path }) => new Option(path, path)));
        for (const option of ["string", "number", "boolean", "null"])
            queryType.append(new Option(option, option));
        queryType.setAttribute("aria-label", "Value type");
        valueLabel.append(document.createTextNode(descriptor.guidedInput), valueHost);
        const selectedProperty = () => targetProperties().find(({ path }) => path === property.value), valueType = () => descriptor.kind === "Context data" && selectedProperty() ? assignmentConditionControl(selectedProperty()).valueType : descriptor.kind === "Query" ? queryType.value : "string";
        const mountValueControl = () => { if (existence(comparison.value)) {
            valueLabel.remove();
            return;
        } if (!valueLabel.isConnected)
            guidedControls.append(valueLabel); const previous = valueControl.value, type = valueType(); valueControl = type === "boolean" ? document.createElement("select") : document.createElement("input"); valueControl.setAttribute("aria-label", descriptor.kind === "Pathname" ? "Path" : descriptor.kind === "Host" ? "Host value" : descriptor.kind === "Hash" ? "Hash value" : "Typed value"); if (valueControl instanceof HTMLSelectElement) {
            valueControl.append(new Option("true", "true"), new Option("false", "false"));
            valueControl.value = previous || "true";
        }
        else {
            valueControl.type = type === "number" ? "number" : "text";
            valueControl.value = previous;
        } valueControl.addEventListener("input", update); valueHost.replaceChildren(valueControl); };
        const refreshComparisons = () => { const selected = comparison.value, options = descriptor.kind === "Context data" && selectedProperty() ? assignmentConditionControl(selectedProperty()).comparisons : descriptor.comparisons; comparison.replaceChildren(...options.map((option) => new Option(option, option))); if (options.includes(selected))
            comparison.value = selected; };
        function update() { try {
            const propertyDefinition = selectedProperty(), condition = buildGuidedAssignmentCondition({ kind: descriptor.kind, comparison: comparison.value, value: valueControl.value, ...(descriptor.kind === "Query" ? { parameter: parameter.value, valueType: queryType.value } : {}), ...(propertyDefinition ? { property: propertyDefinition } : {}) });
            guidedCondition = condition;
            preview.textContent = condition.kind === "predicate" ? `${descriptor.kind} ${condition.field} ${condition.operator}.` : descriptor.kind;
            preview.dataset.valid = "true";
        }
        catch (error) {
            guidedCondition = undefined;
            preview.textContent = error instanceof Error ? error.message : String(error);
            preview.dataset.valid = "false";
        } }
        if (descriptor.kind === "Environment") {
            const environment = document.createElement("select");
            environment.setAttribute("aria-label", "Configured project environment");
            for (const option of state.project.environments)
                environment.append(new Option(option, option));
            valueControl = environment;
            environment.addEventListener("change", update);
            guidedControls.append(labeled("Configured environment", environment));
        }
        else {
            if (descriptor.kind === "Query")
                guidedControls.append(labeled("Parameter name", parameter));
            if (descriptor.kind === "Context data")
                guidedControls.append(labeled("Schema property", property));
            if (descriptor.kind === "Query")
                guidedControls.append(labeled("Value type", queryType));
            guidedControls.append(valueLabel);
        }
        guidedControls.prepend(labeled(`${descriptor.kind} comparison`, comparison));
        property.addEventListener("change", () => { refreshComparisons(); mountValueControl(); update(); });
        comparison.addEventListener("change", () => { mountValueControl(); update(); });
        parameter.addEventListener("input", update);
        queryType.addEventListener("change", () => { mountValueControl(); update(); });
        refreshComparisons();
        if (descriptor.kind !== "Environment")
            mountValueControl();
        update();
        guided.replaceChildren(Object.assign(document.createElement("h3"), { textContent: "Structured condition" }), kindSelect, guidedControls, preview);
    }
    kindSelect.addEventListener("change", renderGuidedCondition);
    setSelect.addEventListener("change", renderGuidedCondition);
    targetKind.addEventListener("change", () => { target.value = ""; renderTargets(); renderGuidedCondition(); });
    target.addEventListener("change", renderGuidedCondition);
    eventSelect.addEventListener("change", renderGuidedCondition);
    renderTargets();
    applicability.append(labeled("Reusable Applicability Set or new condition", setSelect), guided);
    renderGuidedCondition();
    const resolution = region("Resolution"), priority = document.createElement("input"), guidance = document.createElement("p");
    priority.name = "priority";
    priority.type = "number";
    priority.value = String(assignment.priority ?? 10);
    guidance.textContent = "Higher priority wins only after Event, source, and applicability match. Equal highest priorities block routing as ambiguous and name every tied Assignment.";
    resolution.append(labeled("Priority", priority), guidance);
    const assignmentInput = () => { const event = state.project.collections.events.find(({ id }) => id === eventSelect.value); if (setSelect.value === "__new__" && !guidedCondition)
        throw new Error(preview.textContent || "Complete the structured condition."); return { id: assignment.id, name: name.value.trim(), targetKind: targetKind.value, targetId: target.value, eventId: eventSelect.value, eventName: String(event?.eventName ?? event?.name ?? ""), ...(setSelect.value && setSelect.value !== "__new__" ? { applicabilitySetId: setSelect.value } : {}), ...(setSelect.value === "__new__" ? { condition: guidedCondition } : {}), ...(setSelect.value === "" ? { clearApplicability: true } : {}), sourceId: source.value, target: validationTarget.value, priority: Number(priority.value) }; };
    let transientSequence = 0;
    const transientState = (base) => saveProjectAssignment(base, assignmentInput(), (kind) => `${kind}:routing-test:${++transientSequence}`);
    const routing = region("Test assignment routing"), testSource = document.createElement("select"), testEvent = document.createElement("select"), pathname = document.createElement("input"), payload = document.createElement("textarea"), rawInput = document.createElement("textarea"), run = document.createElement("button");
    for (const value of sources)
        testSource.append(new Option(value, value));
    testSource.value = source.value;
    testEvent.append(new Option("Choose observed Event", ""), ...state.project.collections.events.map((event) => new Option(event.name, event.id)));
    testEvent.value = String(assignment.eventId ?? "");
    pathname.placeholder = "/checkout/cart";
    pathname.setAttribute("aria-label", "Observed pathname");
    payload.value = "{}";
    rawInput.value = "{}";
    payload.setAttribute("aria-label", "Observed payload JSON");
    rawInput.setAttribute("aria-label", "Observed raw input JSON");
    run.type = "button";
    run.textContent = "Test assignment routing";
    run.addEventListener("click", () => { void (async () => { try {
        const base = loadState ? await loadState() : state, current = transientState(base), compiled = compileSpecificationProject(createCanonicalProjectEnvelope(current.project, current.draft?.id ?? "routing-test"));
        if (compiled.status === "blocked")
            throw new Error(`Compilation failed: ${compiled.diagnostics.map(({ entityId, field, referenceId }) => `${entityId}.${field}=${referenceId}`).join(", ")}`);
        const event = base.project.collections.events.find(({ id }) => id === testEvent.value), evaluated = evaluateSpecificationObservation(compiled.plan, { sourceId: testSource.value, eventName: String(event?.eventName ?? event?.name ?? ""), pathname: pathname.value, payload: JSON.parse(payload.value), rawInput: JSON.parse(rawInput.value) }), summary = document.createElement("p"), list = document.createElement("ul");
        summary.textContent = evaluated.routingSummary;
        for (const candidate of evaluated.candidates) {
            const item = document.createElement("li");
            item.dataset.assignmentCandidate = candidate.assignmentId;
            item.textContent = `${candidate.assignmentName}: ${candidate.event.evidence}; ${candidate.applicability.evidence}; ${candidate.resolution}`;
            list.append(item);
        }
        const issues = document.createElement("p");
        issues.dataset.assignmentValidationIssues = String(evaluated.issues.length);
        issues.textContent = evaluated.issues.length ? evaluated.issues.join("; ") : "Validation passed";
        evidence.replaceChildren(summary, list, issues);
    }
    catch (error) {
        evidence.replaceChildren(Object.assign(document.createElement("p"), { textContent: error instanceof Error ? error.message : String(error) }));
    } })(); });
    routing.append(labeled("Observed source", testSource), labeled("Observed Event", testEvent), labeled("Observed pathname", pathname), labeled("Payload JSON", payload), labeled("Raw input JSON", rawInput), run, evidence);
    const save = document.createElement("button");
    save.type = "submit";
    save.textContent = "Save Assignment";
    form.append(schemaTarget, observed, applicability, resolution, routing, save);
    form.addEventListener("submit", (submit) => { submit.preventDefault(); try {
        onSave(saveProjectAssignment(state, assignmentInput(), id));
    }
    catch (error) {
        evidence.replaceChildren(Object.assign(document.createElement("p"), { textContent: error instanceof Error ? error.message : String(error) }));
    } });
    section.append(heading, form);
    host.append(section);
}
//# sourceMappingURL=data-layer-assignment-routing-ui.js.map