import { filterSchemaRelationshipTree, restoreSchemaRelationshipTreeView, saveSchemaRelationshipTreeView, } from "../../schema-relationship-tree.js";
export function createSchemaRelationshipTreeController(ports) {
    let projectId;
    let expandedKeys = new Set();
    let restoringScroll = false;
    let pendingScroll;
    let rowDisposers = [];
    const allNodes = (nodes) => nodes.flatMap((node) => [node, ...allNodes(node.children)]);
    const persist = () => {
        if (!projectId)
            return;
        saveSchemaRelationshipTreeView(ports.storage, projectId, {
            query: ports.query?.value ?? "",
            category: (ports.category?.value ?? "All"),
            expandedKeys: [...expandedKeys],
            scrollTop: ports.scrollOwner?.scrollTop ?? 0,
        });
    };
    const controller = {
        project(nextProjectId, nodes) {
            const validNodes = allNodes(nodes);
            const validKeys = new Set(validNodes.map(({ key }) => key));
            if (projectId !== nextProjectId) {
                projectId = nextProjectId;
                const restored = restoreSchemaRelationshipTreeView(ports.storage, nextProjectId, validKeys);
                expandedKeys = new Set(restored.expandedKeys.length ? restored.expandedKeys
                    : validNodes.filter(({ children }) => children.length).map(({ key }) => key));
                if (ports.query)
                    ports.query.value = restored.query;
                if (ports.category)
                    ports.category.value = restored.category;
                pendingScroll = restored.scrollTop;
                if (!ports.panel?.hidden)
                    controller.restoreScroll();
            }
            else {
                expandedKeys = new Set([...expandedKeys].filter((key) => validKeys.has(key)));
            }
            return filterSchemaRelationshipTree(nodes, {
                query: ports.query?.value ?? "",
                category: (ports.category?.value ?? "All"),
            });
        },
        invalidateProject() { projectId = undefined; },
        isExpanded(key) { return expandedKeys.has(key); },
        toggle(key) {
            if (expandedKeys.has(key))
                expandedKeys.delete(key);
            else
                expandedKeys.add(key);
            persist();
        },
        update() { persist(); },
        persistScroll() {
            if (projectId && !restoringScroll && pendingScroll === undefined && !ports.panel?.hidden)
                persist();
        },
        restoreScroll() {
            if (pendingScroll === undefined || !ports.scrollOwner)
                return;
            const scrollTop = pendingScroll;
            restoringScroll = true;
            queueMicrotask(() => {
                if (ports.scrollOwner)
                    ports.scrollOwner.scrollTop = scrollTop;
                pendingScroll = undefined;
                ports.scheduleFrame(() => { restoringScroll = false; });
            });
        },
        listen(target, type, listener) {
            const eventListener = listener;
            target.addEventListener(type, eventListener);
            rowDisposers.push(() => target.removeEventListener(type, eventListener));
        },
        clearRows() { for (const dispose of rowDisposers.splice(0))
            dispose(); },
        dispose() {
            controller.clearRows();
            projectId = undefined;
            expandedKeys.clear();
            pendingScroll = undefined;
            restoringScroll = false;
        },
    };
    return controller;
}
//# sourceMappingURL=relationship-tree-controller.js.map