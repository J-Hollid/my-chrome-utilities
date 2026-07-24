import { labeled } from "./dom.js";
const presenceText = (mode) => ({ optional: "Optional", required: "Required", "required-when": "Required when", forbidden: "Forbidden", "forbidden-when": "Forbidden when" })[mode];
export function renderPresenceFacet(host, context, working) {
    const { dom } = context, presence = dom.createElement("select");
    presence.name = "presenceMode";
    presence.append(...["optional", "required", "required-when", "forbidden", "forbidden-when"].map((entry) => new Option(presenceText(entry), entry)));
    presence.value = working.presence.mode;
    presence.addEventListener("change", () => { const next = context.getWorking(); if (next)
        next.presence = { ...next.presence, mode: presence.value }; });
    host.append(labeled(dom, "Presence", presence));
}
//# sourceMappingURL=presence.js.map