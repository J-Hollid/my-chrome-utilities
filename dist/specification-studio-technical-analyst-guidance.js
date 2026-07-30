export const STUDIO_ANALYST_FIRST_HINT_MS = 10_000;
export const STUDIO_ANALYST_HINT_LIFETIME_MS = 10_000;
export const STUDIO_ANALYST_COOLDOWN_MS = 120_000;
export const STUDIO_ANALYST_CONTROL_DWELL_MS = 3_000;
export const STUDIO_ANALYST_PRINT_INTERVAL_MS = 20;
const tip = (id, route, text) => Object.freeze({ id, route, text });
const tipPools = Object.freeze({
    "Project overview": Object.freeze([
        tip("project-overview", "Project overview", "Crikey! Pick a collection on the left to start shaping your specification."),
        tip("project-overview-context", "Project overview", "Stone the crows! Set the project context so every collection shares the same measurement purpose."),
        tip("project-overview-search", "Project overview", "Crumbs! Global search finds any collection or entity without changing your saved Draft."),
        tip("project-overview-validate", "Project overview", "Gadzooks! Run preflight for a project-wide view of blockers and advisory warnings."),
        tip("project-overview-inspector", "Project overview", "By gum! Keep the Inspector open when you need context for the selected project part."),
    ]),
    "Shared Profiles": Object.freeze([
        tip("shared-profiles", "Shared Profiles", "Smashing! Put reusable fields here so Pages and Events can inherit them."),
        tip("shared-profiles-canonical", "Shared Profiles", "Crikey! Author each reusable property once in the canonical Shared Profile schema."),
        tip("shared-profiles-library", "Shared Profiles", "Blimey! Adopt a published Saved Schema when its source lineage should remain visible."),
        tip("shared-profiles-concepts", "Shared Profiles", "By gum! Concepts group Profile properties in documentation without changing validation."),
        tip("shared-profiles-policy", "Shared Profiles", "Cor! Only defined fields closes a Profile schema while preserving its inherited policy."),
    ]),
    "Pages": Object.freeze([
        tip("pages", "Pages", "Jolly good! Give each Page its observed page event before refining its schema."),
        tip("pages-location", "Pages", "Gadzooks! Path conditions decide which observed locations resolve to this Page."),
        tip("pages-groups", "Pages", "Crikey! Order Page Group memberships to make their effective schema contribution predictable."),
        tip("pages-profiles", "Pages", "By gum! Attach Shared Profiles when the Page should inherit reusable canonical fields."),
        tip("pages-schema", "Pages", "Cor! Review the effective Page schema before adding a sparse local override."),
    ]),
    "Page Groups": Object.freeze([
        tip("page-groups-membership", "Page Groups", "Crikey! Group Pages that share applicability or schema contributions, then review their effective order."),
        tip("page-groups-conditions", "Page Groups", "By gum! Use Page Group conditions to describe where a shared contribution applies."),
        tip("page-groups-schema", "Page Groups", "Smashing! Keep group-level fields canonical so member Pages inherit them consistently."),
        tip("page-groups-order", "Page Groups", "Gadzooks! Reorder memberships only after checking affected Page instances and compiled targets."),
        tip("page-groups-repair", "Page Groups", "Whoops-a-daisy! Open a conflicting Page Group from effective-schema evidence to repair its contribution."),
    ]),
    "Events": Object.freeze([
        tip("events-name", "Events", "Crikey! Give each Event the exact observed event name used by its production source."),
        tip("events-source", "Events", "By gum! Choose the observation source that actually carries this Event in the active project."),
        tip("events-target", "Events", "Gadzooks! Set the payload target before connecting Assignments to the Event."),
        tip("events-pages", "Events", "Jolly good! Associate interaction Events with the Pages and Flows where they are expected."),
        tip("events-schema", "Events", "Smashing! Refine Event data through canonical contributors instead of duplicating properties."),
    ]),
    "Applicability": Object.freeze([
        tip("applicability-priority", "Applicability", "Crikey! Order Applicability Sets deliberately because higher-priority matches resolve first."),
        tip("applicability-conditions", "Applicability", "By gum! Build conditions from observable data and keep every comparison type-compatible."),
        tip("applicability-fallback", "Applicability", "Jolly good! Retain one truthful fallback for observations matching no more specific set."),
        tip("applicability-overlap", "Applicability", "Gadzooks! Run preflight to find ambiguous Applicability Sets before publishing."),
        tip("applicability-assignments", "Applicability", "Smashing! Use Applicability Sets so Assignments select the right observation contributor."),
    ]),
    "Flows": Object.freeze([
        tip("flows", "Flows", "Cor! Add Pages to the canvas first, then place interaction Events inside them."),
        tip("flows-frames", "Flows", "Crikey! Use Page frames to show where each journey step occurs."),
        tip("flows-occurrences", "Flows", "By gum! Place Event occurrences inside their owning Page frame and state their obligation."),
        tip("flows-relationships", "Flows", "Gadzooks! Connect Page frames with Page-to-Page relationships; Event availability comes from containment, never relationship endpoints."),
        tip("flows-documentation", "Flows", "Smashing! Refresh project Documentation after changing a selected Flow's value map."),
    ]),
    "Fixtures": Object.freeze([
        tip("fixtures-observations", "Fixtures", "Crikey! Capture representative observations so guided testing can exercise the intended event path."),
        tip("fixtures-expected", "Fixtures", "By gum! Record expected outcomes that distinguish a useful Fixture from raw sample data."),
        tip("fixtures-context", "Fixtures", "Gadzooks! Link each Fixture to the Page, Event, and Flow context it demonstrates."),
        tip("fixtures-guided", "Fixtures", "Smashing! Use guided validation to compare a Fixture with the compiled specification."),
        tip("fixtures-warning", "Fixtures", "Jolly good! Treat incomplete Fixture coverage as advisory while canonical validation remains authoritative."),
    ]),
    "Assignments": Object.freeze([
        tip("assignments-event", "Assignments", "Crikey! Choose the observed Event before mapping an Assignment to a canonical contributor."),
        tip("assignments-applicability", "Assignments", "By gum! Select an Applicability Set that makes the winning context unambiguous."),
        tip("assignments-target", "Assignments", "Smashing! Point the Assignment at the contributor that owns its schema."),
        tip("assignments-priority", "Assignments", "Gadzooks! Use priority only to resolve otherwise valid competing Assignment candidates."),
        tip("assignments-preflight", "Assignments", "Cor! Run preflight before testing to catch missing targets or tied Assignment candidates."),
    ]),
    "Documentation": Object.freeze([
        tip("documentation", "Documentation", "Splendid! Refresh the preview after changing a Documentation Set."),
        tip("documentation-sections", "Documentation", "Crikey! Select only the Flow, matrix, and Profile sections required by this audience."),
        tip("documentation-concepts", "Documentation", "By gum! Order and include Concepts to control grouped property tables consistently."),
        tip("documentation-theme", "Documentation", "Smashing! Save project-local theme choices before refreshing the immutable preview."),
        tip("documentation-export", "Documentation", "Ker-pow! Generate rich copy or Excel only after refreshing the preview snapshot."),
    ]),
});
export function studioAnalystHintsForRoute(route) {
    return (tipPools[route] ?? []).map((hint) => ({ ...hint }));
}
export function studioAnalystHintForRoute(route, shown) {
    const excluded = new Set(shown);
    const hint = (tipPools[route] ?? []).find((candidate) => !excluded.has(candidate.id));
    return hint ? { ...hint } : undefined;
}
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
export function studioAnalystControlHint(route, target) {
    const targetKey = slug(target.id || target.name), targetName = target.name.trim();
    const text = route === "Pages" && (targetKey === "add-page" || /^Add Page(?:\b| to )/u.test(targetName))
        ? "Crikey! Add Page creates a Page draft for a real location; use it before placing that Page in a Flow."
        : route === "Project overview" && (targetKey === "run-preflight" || targetName === "Run preflight")
            ? "Gadzooks! Run preflight checks the whole Draft for blocking schema faults and advisory assurance warnings without publishing."
            : route === "Project overview" && (targetKey === "show-coverage" || targetName === "Coverage matrix")
                ? "Cor! Coverage matrix shows which project contexts exercise each canonical property; use it to spot evidence gaps."
                : route === "Pages" && (targetKey === "undo-project" || targetName === "Undo")
                    ? "Whoops-a-daisy! Undo rolls back the latest command on this Studio page while the published revision stays put."
                    : route === "Project overview" && (targetKey === "publish-project" || targetName === "Publish release")
                        ? "Blimey! Publish release opens a review before creating an immutable project revision."
                        : undefined;
    return text ? {
        id: `control:${slug(route)}:${slug(target.id || target.name)}`,
        route,
        text,
    } : undefined;
}
export function studioAnalystVisibleText(text, elapsedMilliseconds, reducedMotion) {
    if (reducedMotion)
        return text;
    const characters = Math.floor(Math.max(0, elapsedMilliseconds) / STUDIO_ANALYST_PRINT_INTERVAL_MS);
    return text.slice(0, characters);
}
export function createStudioAnalystControlDwell() {
    let target;
    let pointer = false, focus = false, elapsed = 0, triggered = false;
    const reset = () => { target = undefined; pointer = false; focus = false; elapsed = 0; triggered = false; };
    return {
        enter(next, modality) {
            if (!target || target.id !== next.id)
                reset();
            target = { ...next };
            if (modality === "pointer")
                pointer = true;
            else
                focus = true;
        },
        leave(modality) {
            if (modality === "pointer")
                pointer = false;
            else
                focus = false;
            if (!pointer && !focus)
                reset();
        },
        advance(elapsedMilliseconds, active) {
            if (!active || !target || (!pointer && !focus) || triggered)
                return undefined;
            elapsed += Math.max(0, elapsedMilliseconds);
            if (elapsed < STUDIO_ANALYST_CONTROL_DWELL_MS)
                return undefined;
            triggered = true;
            return { ...target };
        },
        reset,
    };
}
export function studioAnalystGuidanceIsActive(options) {
    const view = options.document.defaultView;
    return options.populated
        && !options.document.hidden
        && !options.workspace.hidden
        && view?.getComputedStyle(options.navigation).display !== "none"
        && view?.getComputedStyle(options.region).display !== "none"
        && !options.document.querySelector('dialog[open], .actions details[open], [aria-modal="true"], [data-schema-row-overlay="true"]');
}
export function createStudioAnalystGuidanceSchedule() {
    let route;
    let untilNext = STUDIO_ANALYST_FIRST_HINT_MS;
    let current;
    let visibleRemaining = 0;
    let rendered = false;
    const shownByRoute = new Map();
    const synchronizeRoute = (nextRoute) => {
        if (route === undefined) {
            route = nextRoute;
            return "same";
        }
        if (route === nextRoute)
            return "same";
        const result = current && rendered ? "hide" : "changed";
        route = nextRoute;
        current = undefined;
        visibleRemaining = 0;
        rendered = false;
        untilNext = STUDIO_ANALYST_FIRST_HINT_MS;
        return result;
    };
    const nextGeneralHint = (nextRoute) => {
        const pool = tipPools[nextRoute] ?? [];
        if (!pool.length)
            return undefined;
        const shown = shownByRoute.get(nextRoute) ?? new Set();
        if (shown.size >= pool.length)
            shown.clear();
        shownByRoute.set(nextRoute, shown);
        const hint = studioAnalystHintForRoute(nextRoute, [...shown]);
        if (hint)
            shown.add(hint.id);
        return hint;
    };
    const show = (hint) => {
        current = { ...hint };
        rendered = true;
        visibleRemaining = STUDIO_ANALYST_HINT_LIFETIME_MS;
        untilNext = STUDIO_ANALYST_COOLDOWN_MS;
        return { kind: "show", hint: { ...hint } };
    };
    return {
        advance(elapsedMilliseconds, context) {
            const routeState = synchronizeRoute(context.route);
            if (routeState === "hide")
                return { kind: "hide" };
            if (routeState === "changed")
                return { kind: "waiting" };
            const elapsed = Math.max(0, elapsedMilliseconds);
            if (!context.active) {
                if (current && rendered) {
                    rendered = false;
                    return { kind: "hide" };
                }
                return { kind: "waiting" };
            }
            if (current) {
                visibleRemaining = Math.max(0, visibleRemaining - elapsed);
                untilNext = Math.max(0, untilNext - elapsed);
                if (visibleRemaining === 0) {
                    current = undefined;
                    rendered = false;
                    return { kind: "hide" };
                }
                rendered = true;
                return { kind: "visible", hint: { ...current } };
            }
            untilNext = Math.max(0, untilNext - elapsed);
            if (untilNext > 0)
                return { kind: "waiting" };
            const hint = nextGeneralHint(context.route);
            return hint ? show(hint) : { kind: "waiting" };
        },
        request(context) {
            synchronizeRoute(context.route);
            if (!context.active)
                return { kind: "waiting" };
            const hint = nextGeneralHint(context.route);
            return hint ? show(hint) : { kind: "waiting" };
        },
        present(hint, context) {
            synchronizeRoute(context.route);
            return context.active ? show(hint) : { kind: "waiting" };
        },
    };
}
const namedControl = (root, analyst, eventTarget) => {
    if (!(eventTarget instanceof Element))
        return undefined;
    const element = eventTarget.closest("button,input,select,textarea,summary,a[href]");
    if (!element || element === analyst || !root.contains(element) || !element.getClientRects().length)
        return undefined;
    const labeled = element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement
        ? element.labels?.[0]?.textContent
        : undefined;
    const name = (element.getAttribute("aria-label") ?? labeled ?? element.textContent ?? "").replace(/\s+/gu, " ").trim();
    if (!name)
        return undefined;
    return { element, target: { id: element.id || name, name } };
};
export function installStudioAnalystGuidance(options) {
    const schedule = createStudioAnalystGuidanceSchedule();
    const dwell = createStudioAnalystControlDwell();
    const now = options.now ?? (() => performance.now());
    const ownerDocument = options.bubble.ownerDocument;
    const reserve = options.bubble.querySelector?.("[data-analyst-tip-reserve]");
    const visual = options.bubble.querySelector?.("[data-analyst-tip-visual]");
    const announcement = options.bubble.querySelector?.("[data-analyst-tip-announcement]");
    const reducedMotion = options.reducedMotion ?? (() => ownerDocument.defaultView?.matchMedia("(prefers-reduced-motion: reduce)").matches ?? false);
    let previous = now(), dwellPrevious = previous, intervalWasActive = options.active(), printTimer, printSequence = 0;
    const cancelPrint = () => {
        printSequence += 1;
        if (printTimer !== undefined) {
            clearInterval(printTimer);
            printTimer = undefined;
        }
    };
    const hideBubble = () => {
        cancelPrint();
        options.bubble.hidden = true;
        options.bubble.removeAttribute("data-hint-id");
        options.bubble.removeAttribute("data-complete-text");
    };
    const showHint = (hint) => {
        cancelPrint();
        const sequence = printSequence;
        options.bubble.dataset.hintId = hint.id;
        options.bubble.dataset.completeText = hint.text;
        options.bubble.hidden = false;
        if (!reserve || !visual || !announcement) {
            options.bubble.textContent = hint.text;
            return;
        }
        reserve.textContent = hint.text;
        visual.textContent = reducedMotion() ? hint.text : "";
        announcement.textContent = "";
        queueMicrotask(() => { if (sequence === printSequence)
            announcement.textContent = hint.text; });
        if (reducedMotion())
            return;
        let elapsed = 0;
        printTimer = setInterval(() => {
            elapsed += STUDIO_ANALYST_PRINT_INTERVAL_MS;
            visual.textContent = studioAnalystVisibleText(hint.text, elapsed, false);
            if (visual.textContent === hint.text && printTimer !== undefined) {
                clearInterval(printTimer);
                printTimer = undefined;
            }
        }, STUDIO_ANALYST_PRINT_INTERVAL_MS);
    };
    const restoreHint = (hint) => {
        cancelPrint();
        options.bubble.dataset.hintId = hint.id;
        options.bubble.dataset.completeText = hint.text;
        options.bubble.hidden = false;
        if (!reserve || !visual || !announcement) {
            options.bubble.textContent = hint.text;
            return;
        }
        reserve.textContent = hint.text;
        visual.textContent = hint.text;
    };
    const apply = (action) => {
        if (action.kind === "show")
            showHint(action.hint);
        else if (action.kind === "visible" && options.bubble.hidden)
            restoreHint(action.hint);
        else if (action.kind === "hide")
            hideBubble();
    };
    const evaluate = () => {
        const currentTime = now(), active = options.active(), route = options.route();
        const elapsed = active && intervalWasActive ? currentTime - previous : 0;
        apply(schedule.advance(elapsed, { active, route }));
        const dwellTarget = dwell.advance(active ? Math.max(0, currentTime - dwellPrevious) : 0, active);
        const controlHint = dwellTarget ? studioAnalystControlHint(route, dwellTarget) : undefined;
        if (controlHint)
            apply(schedule.present(controlHint, { active, route }));
        previous = currentTime;
        dwellPrevious = currentTime;
        intervalWasActive = active;
    };
    const requestNext = () => {
        const active = options.active();
        apply(schedule.request({ active, route: options.route() }));
        previous = now();
        intervalWasActive = active;
    };
    const beginDwell = (event, modality) => {
        if (!options.controlRoot)
            return;
        const control = namedControl(options.controlRoot, options.analystControl, event.target);
        if (!control)
            return;
        dwell.enter(control.target, modality);
        dwellPrevious = now();
    };
    const endDwell = (event, modality) => {
        if (!options.controlRoot)
            return;
        const control = namedControl(options.controlRoot, options.analystControl, event.target);
        const related = "relatedTarget" in event ? event.relatedTarget : null;
        if (!control || related instanceof Node && control.element.contains(related))
            return;
        dwell.leave(modality);
        dwellPrevious = now();
    };
    const pointerOver = (event) => beginDwell(event, "pointer");
    const pointerOut = (event) => endDwell(event, "pointer");
    const focusIn = (event) => beginDwell(event, "focus");
    const focusOut = (event) => endDwell(event, "focus");
    const routeClick = () => queueMicrotask(evaluate);
    const analystKeyDown = (event) => {
        if (event.key !== "Enter" && event.key !== " ")
            return;
        event.preventDefault();
        requestNext();
    };
    const timer = setInterval(evaluate, options.intervalMilliseconds ?? 250);
    ownerDocument.addEventListener("visibilitychange", evaluate);
    ownerDocument.addEventListener("click", routeClick);
    options.analystControl?.addEventListener("click", requestNext);
    options.analystControl?.addEventListener("keydown", analystKeyDown);
    options.controlRoot?.addEventListener("pointerover", pointerOver);
    options.controlRoot?.addEventListener("pointerout", pointerOut);
    options.controlRoot?.addEventListener("focusin", focusIn);
    options.controlRoot?.addEventListener("focusout", focusOut);
    return {
        evaluate,
        requestNext,
        dispose() {
            clearInterval(timer);
            hideBubble();
            ownerDocument.removeEventListener("visibilitychange", evaluate);
            ownerDocument.removeEventListener("click", routeClick);
            options.analystControl?.removeEventListener("click", requestNext);
            options.analystControl?.removeEventListener("keydown", analystKeyDown);
            options.controlRoot?.removeEventListener("pointerover", pointerOver);
            options.controlRoot?.removeEventListener("pointerout", pointerOut);
            options.controlRoot?.removeEventListener("focusin", focusIn);
            options.controlRoot?.removeEventListener("focusout", focusOut);
        },
    };
}
//# sourceMappingURL=specification-studio-technical-analyst-guidance.js.map