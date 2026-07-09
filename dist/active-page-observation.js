const pageAccessAvailable = "page access available";
const pageAccessUnavailable = "page access unavailable";
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
        if (injection === undefined) {
            return { pageAccessStatus: pageAccessUnavailable };
        }
        return {
            pageAccessStatus: pageAccessAvailable,
            pageObject: injection.result ?? {},
        };
    }
    catch {
        return { pageAccessStatus: pageAccessUnavailable };
    }
}
function observerAttachOptions(historyPath, pageUrl, readResult) {
    const options = {
        historyPath,
        pageUrl,
        pageAccessStatus: readResult.pageAccessStatus,
    };
    return readResult.pageAccessStatus === pageAccessAvailable
        ? { ...options, pageObject: readResult.pageObject }
        : options;
}
export async function activePageObservation(historyPath) {
    const activeTab = await activeTabContext();
    const readResult = activeTab.tabId === undefined
        ? { pageAccessStatus: pageAccessUnavailable }
        : await activeTabPageObject(activeTab.tabId, historyPath);
    return observerAttachOptions(historyPath, activeTab.pageUrl, readResult);
}
//# sourceMappingURL=active-page-observation.js.map