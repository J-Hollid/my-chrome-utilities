import { attachLiveFlowDefect, createLiveFlowTest, liveFlowChoices, liveFlowEventLink, liveFlowEventStepChoices, liveFlowSessionEvidence, linkLiveFlowEvent, selectLiveFlow, } from "./data-layer-live-flow-testing.js";
const button = (text, run) => { const control = document.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
const option = (value, text) => { const item = document.createElement("option"); item.value = value; item.textContent = text; return item; };
export function mountLiveFlowTestingUi(options) {
    const host = options.root.querySelector("#live-flow-test");
    if (!host)
        throw new Error("Live Flow test context is unavailable.");
    const now = options.now ?? (() => new Date().toISOString()), id = options.id ?? (() => `live-flow:${crypto.randomUUID()}`);
    let project, run, restored = options.savedSummary?.(), openGeneration = 0;
    const evidence = () => {
        if (restored)
            return structuredClone(restored);
        if (!project || !run?.history.length)
            return;
        return liveFlowSessionEvidence(run, project, now());
    };
    const render = () => {
        host.replaceChildren();
        host.hidden = false;
        const heading = document.createElement("h4");
        heading.textContent = "Flow test context";
        const guidance = document.createElement("p");
        guidance.textContent = "Select a Flow, then open any event’s existing details to link an eligible graph step. The event feed remains unchanged and no Assignment is selected automatically.";
        host.append(heading, guidance);
        if (restored) {
            const selected = document.createElement("p");
            selected.id = "live-flow-selected-context";
            selected.textContent = `Selected Flow: ${restored.flowName}`;
            const state = document.createElement("p");
            state.textContent = `Saved session evidence · current step ${restored.currentStepId} · ${restored.unchosenAlternatives.length} unchosen alternatives Not tested`;
            host.append(selected, state);
            return;
        }
        if (!project) {
            const message = document.createElement("p");
            message.textContent = "No active project. Open project or Create project to choose a project-bound Flow.";
            host.append(message, button("Open project", () => options.openProject?.()), button("Create project", () => options.createProject?.()));
            return;
        }
        const label = document.createElement("label"), select = document.createElement("select");
        label.textContent = "Flow test context";
        select.id = "live-flow-selector";
        select.append(option("", "No Flow selected"), ...liveFlowChoices(project.project.id, [project]).flows.map(({ id: flowId, name }) => option(flowId, name)));
        select.value = run?.flowId ?? "";
        select.addEventListener("change", () => { run = select.value ? selectLiveFlow(createLiveFlowTest(id(), project.project.id), project, select.value) : createLiveFlowTest(id(), project.project.id); render(); });
        label.append(select);
        host.append(label);
        if (run?.flowName) {
            const selected = document.createElement("p");
            selected.id = "live-flow-selected-context";
            selected.textContent = `Selected Flow: ${run.flowName} · Open an observed event’s details to choose its Flow step.`;
            host.append(selected);
        }
    };
    const renderEventDetails = (inspector, eventId) => {
        inspector.querySelector("#live-flow-event-link")?.remove();
        const selectedRun = run;
        const recorded = selectedRun ? liveFlowEventLink(selectedRun, eventId) : restored?.history.find((entry) => entry.eventId === eventId);
        if (!recorded && !project?.project.id)
            return;
        if (!recorded && !selectedRun?.flowId)
            return;
        const section = document.createElement("section");
        section.id = "live-flow-event-link";
        section.setAttribute("aria-label", "Flow step link");
        const heading = document.createElement("h5");
        heading.textContent = "Flow step";
        section.append(heading);
        if (recorded) {
            const value = document.createElement("p");
            value.textContent = `${recorded.flowName} · ${recorded.stepName} · ${recorded.selectionMode} · ${recorded.status}`;
            const stable = document.createElement("p");
            stable.textContent = `Recorded graph step ${recorded.stepId}. Reviewing this event does not change the current traversal step.`;
            section.append(value, stable);
            inspector.append(section);
            return;
        }
        const selection = liveFlowEventStepChoices(selectedRun, project, eventId);
        const guidance = document.createElement("p");
        guidance.textContent = selection.noRootPage
            ? "This Flow has no root Page frame. Every Page frame remains available in graph order."
            : selection.mode === "initial" ? "Root Page frames are listed first; every Page frame remains available." : "Choose a contained Event or an outgoing related Page from the current Page.";
        const label = document.createElement("label"), select = document.createElement("select");
        select.id = "live-flow-step-selector";
        label.textContent = "Flow step";
        select.append(option("", "Choose Flow step"));
        for (const choice of selection.choices) {
            const status = choice.root ? "Root Page frame" : choice.stepKind === "Event" ? `Contained Event · ${choice.displayName}` : choice.kind ? `${choice.kind} · ${choice.displayName}` : "Page frame";
            select.append(option(choice.id, `${choice.name} · ${status} · ${choice.id}`));
        }
        const link = button("Link event to Flow step", () => {
            if (!select.value)
                return;
            const event = options.events().find(({ id: eventIdentity }) => eventIdentity === eventId);
            if (!event)
                return;
            run = linkLiveFlowEvent(selectedRun, project, event, select.value);
            const entry = run.history.at(-1);
            options.onResult?.(entry, event);
            const summary = evidence();
            if (summary)
                options.saveSummary(summary);
            render();
            renderEventDetails(inspector, eventId);
        });
        label.append(select);
        section.append(guidance, label, link);
        inspector.append(section);
    };
    const refreshProject = async () => {
        const generation = ++openGeneration, next = restored ? undefined : await options.activeProject();
        if (generation !== openGeneration)
            return;
        if (!next) {
            project = undefined;
            run = undefined;
        }
        else if (project?.project.id !== next.project.id) {
            project = next;
            run = createLiveFlowTest(id(), next.project.id);
        }
        else
            project = next;
        render();
    };
    const open = async () => { restored = options.savedSummary?.(); await refreshProject(); };
    return {
        open, refreshProject, render, renderEventDetails,
        reset: () => { openGeneration++; project = undefined; run = undefined; restored = undefined; host.replaceChildren(); host.hidden = true; },
        attachDefect: (stepId, eventId, defectId) => { if (!run)
            return; run = attachLiveFlowDefect(run, stepId, defectId, eventId); const summary = evidence(); if (summary)
            options.saveSummary(summary); },
        run: () => run ? structuredClone(run) : undefined,
        summary: evidence,
    };
}
//# sourceMappingURL=data-layer-live-flow-testing-ui.js.map