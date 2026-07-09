async function activeTabContext() {
    try {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        const pageUrl = tab?.url ?? globalThis.location.href;
        if (tab?.id === undefined) {
            return { pageUrl };
        }
        return { tabId: tab.id, pageUrl };
    }
    catch {
        return { pageUrl: globalThis.location.href };
    }
}
async function activeTabPageObject(tabId, historyPath) {
    try {
        const [injection] = await chrome.scripting.executeScript({
            target: { tabId },
            world: "MAIN",
            args: [historyPath],
            func: (path) => {
                const parts = path
                    .split(".")
                    .map((part) => part.trim())
                    .filter((part) => part.length > 0);
                if (parts.length === 0) {
                    return {};
                }
                let current = globalThis;
                const root = {};
                let output = root;
                for (let index = 0; index < parts.length; index += 1) {
                    const part = parts[index];
                    if (!part ||
                        current === null ||
                        typeof current !== "object" ||
                        !(part in current)) {
                        return {};
                    }
                    const value = current[part];
                    if (index === parts.length - 1) {
                        output[part] = Array.isArray(value) ? [...value] : value;
                    }
                    else {
                        const child = {};
                        output[part] = child;
                        output = child;
                        current = value;
                    }
                }
                return root;
            },
        });
        return injection?.result ?? {};
    }
    catch {
        return {};
    }
}
function observerAttachOptions(historyPath, pageUrl, pageObject) {
    const options = { historyPath, pageUrl };
    return pageObject === undefined ? options : { ...options, pageObject };
}
export async function activePageObservation(historyPath) {
    const activeTab = await activeTabContext();
    const pageObject = activeTab.tabId === undefined
        ? {}
        : await activeTabPageObject(activeTab.tabId, historyPath);
    return observerAttachOptions(historyPath, activeTab.pageUrl, pageObject);
}
//# sourceMappingURL=active-page-observation.js.map