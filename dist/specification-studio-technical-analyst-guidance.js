export const STUDIO_ANALYST_FIRST_HINT_MS = 10_000;
export const STUDIO_ANALYST_HINT_LIFETIME_MS = 10_000;
export const STUDIO_ANALYST_COOLDOWN_MS = 120_000;
const hints = Object.freeze([
    Object.freeze({ id: "project-overview", route: "Project overview", text: "Crikey! Pick a collection on the left to start shaping your specification." }),
    Object.freeze({ id: "shared-profiles", route: "Shared Profiles", text: "Smashing! Put reusable fields here so Pages and Events can inherit them." }),
    Object.freeze({ id: "pages", route: "Pages", text: "Jolly good! Give each Page its observed page event before refining its schema." }),
    Object.freeze({ id: "flows", route: "Flows", text: "Cor! Add Pages to the canvas first, then place interaction Events inside them." }),
    Object.freeze({ id: "documentation", route: "Documentation", text: "Splendid! Refresh the preview after changing a Documentation Set." }),
]);
export function studioAnalystHintForRoute(route, shown) {
    const excluded = new Set(shown);
    const hint = hints.find((candidate) => candidate.route === route && !excluded.has(candidate.id));
    return hint ? { ...hint } : undefined;
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
    let untilNext = STUDIO_ANALYST_FIRST_HINT_MS;
    let current;
    let visibleRemaining = 0;
    let rendered = false;
    const shown = new Set();
    return {
        advance(elapsedMilliseconds, context) {
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
            if (shown.size === hints.length)
                shown.clear();
            const hint = studioAnalystHintForRoute(context.route, [...shown]);
            if (!hint)
                return { kind: "waiting" };
            shown.add(hint.id);
            current = hint;
            rendered = true;
            visibleRemaining = STUDIO_ANALYST_HINT_LIFETIME_MS;
            untilNext = STUDIO_ANALYST_COOLDOWN_MS;
            return { kind: "show", hint: { ...hint } };
        },
    };
}
export function installStudioAnalystGuidance(options) {
    const schedule = createStudioAnalystGuidanceSchedule();
    const now = options.now ?? (() => performance.now());
    const ownerDocument = options.bubble.ownerDocument;
    let previous = now(), intervalWasActive = options.active();
    const evaluate = () => {
        const current = now(), active = options.active();
        const elapsed = active && intervalWasActive ? current - previous : 0;
        const action = schedule.advance(elapsed, { active, route: options.route() });
        previous = current;
        intervalWasActive = active;
        if (action.kind === "show" || action.kind === "visible") {
            options.bubble.textContent = action.hint.text;
            options.bubble.dataset.hintId = action.hint.id;
            options.bubble.hidden = false;
        }
        else if (action.kind === "hide") {
            options.bubble.hidden = true;
            options.bubble.removeAttribute("data-hint-id");
        }
    };
    const timer = setInterval(evaluate, options.intervalMilliseconds ?? 250);
    ownerDocument.addEventListener("visibilitychange", evaluate);
    return {
        evaluate,
        dispose() {
            clearInterval(timer);
            ownerDocument.removeEventListener("visibilitychange", evaluate);
            options.bubble.hidden = true;
        },
    };
}
//# sourceMappingURL=specification-studio-technical-analyst-guidance.js.map