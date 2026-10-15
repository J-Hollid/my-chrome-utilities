import { flowControl } from "./workspace-dom.js";
export function composeFlowToolbar(input) {
    const { toolbar, canvas, camera } = input;
    const more = document.createElement("details"), summary = document.createElement("summary");
    summary.textContent = "View options";
    more.append(summary, ...input.secondary, ...camera.filter((_, index) => index === 3 || index === 5));
    const connect = flowControl("Connect", () => {
        const port = canvas.querySelector('[data-flow-port-for][tabindex="0"], [data-flow-port-for]');
        port?.focus();
        guidance.textContent = port ? "Press Enter on a port to start a connection. Select the destination port to finish." : "Add a Page or Event before you connect items.";
    });
    const guidance = document.createElement("p");
    guidance.className = "flow-workspace-guidance";
    guidance.setAttribute("role", "status");
    guidance.textContent = "Add Pages and Events. Connect their ports to show the order. Select an item to edit its details. Outline provides a list view.";
    toolbar.append(flowControl("Add Page", () => input.add("page")), flowControl("Add Event", () => input.add("event")), connect, ...camera.filter((_, index) => [0, 1, 2, 4].includes(index)), input.outline, input.details, more);
    toolbar.append(guidance);
}
//# sourceMappingURL=workspace-toolbar.js.map