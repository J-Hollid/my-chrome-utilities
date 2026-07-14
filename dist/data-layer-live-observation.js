const runtimeMessageType = "my-chrome-utilities.data-layer-history-entry";
const pageEventPrefix = "my-chrome-utilities:data-layer-history-entry:";
function makeChannelId() {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}
function pageEventType(channelId) {
    return `${pageEventPrefix}${channelId}`;
}
function isLiveHistoryPushMessage(message, channelId) {
    return (message !== null &&
        typeof message === "object" &&
        message.type === runtimeMessageType &&
        message.channelId === channelId &&
        typeof message.timestamp === "string");
}
async function injectMessageBridge(tabId, channelId, eventType) {
    await chrome.scripting.executeScript({
        target: { tabId },
        args: [runtimeMessageType, channelId, eventType],
        func: (messageType, channel, eventName) => {
            const marker = `__myChromeUtilitiesHistoryBridge_${channel}`;
            const bridgeWindow = globalThis;
            if (bridgeWindow[marker]) {
                return;
            }
            bridgeWindow[marker] = true;
            globalThis.addEventListener(eventName, (event) => {
                const detail = event.detail;
                void chrome.runtime.sendMessage({
                    type: messageType,
                    channelId: channel,
                    rawValue: detail?.rawValue,
                    timestamp: detail?.timestamp ?? new Date().toISOString(),
                });
            });
        },
    });
}
async function injectHistoryArrayHook(tabId, historyPath, channelId, eventType) {
    const [injection] = await chrome.scripting.executeScript({
        target: { tabId },
        world: "MAIN",
        args: [historyPath, channelId, eventType],
        func: (path, channel, eventName) => {
            const parts = path
                .split(".")
                .map((part) => part.trim())
                .filter((part) => part.length > 0);
            let current = globalThis;
            for (const part of parts) {
                if (current === null ||
                    typeof current !== "object" ||
                    !(part in current)) {
                    return { installed: false, rawValues: [] };
                }
                current = current[part];
            }
            if (!Array.isArray(current)) {
                return { installed: false, rawValues: [] };
            }
            const historyArray = current;
            const registryWindow = globalThis;
            const registry = registryWindow.__myChromeUtilitiesHistoryPushObservers ?? {};
            registryWindow.__myChromeUtilitiesHistoryPushObservers = registry;
            let entry = registry[path];
            if (!entry || entry.array !== historyArray) {
                const newEntry = {
                    array: historyArray,
                    originalPush: historyArray.push,
                    channels: {},
                };
                registry[path] = newEntry;
                entry = newEntry;
                historyArray.push = function (...items) {
                    const pushResult = newEntry.originalPush.apply(this, items);
                    const eventNames = Object.values(newEntry.channels);
                    for (const rawValue of items) {
                        const timestamp = new Date().toISOString();
                        for (const historyEventName of eventNames) {
                            globalThis.dispatchEvent(new CustomEvent(historyEventName, {
                                detail: { rawValue, timestamp },
                            }));
                        }
                    }
                    return pushResult;
                };
            }
            entry.channels[channel] = eventName;
            return { installed: true, rawValues: [...historyArray] };
        },
    });
    return injection?.result ?? { installed: false, rawValues: [] };
}
export function historySnapshotPageObject(historyPath, rawValues) {
    const parts = historyPath
        .split(".")
        .map((part) => part.trim())
        .filter((part) => part.length > 0);
    const root = {};
    let current = root;
    parts.forEach((part, index) => {
        const value = index === parts.length - 1 ? [...rawValues] : {};
        current[part] = value;
        if (index < parts.length - 1) {
            current = value;
        }
    });
    return root;
}
function cleanupHistoryArrayHook(tabId, historyPath, channelId) {
    void chrome.scripting.executeScript({
        target: { tabId },
        world: "MAIN",
        args: [historyPath, channelId],
        func: (path, channel) => {
            const registry = globalThis
                .__myChromeUtilitiesHistoryPushObservers;
            const entry = registry?.[path];
            if (!entry) {
                return;
            }
            delete entry.channels[channel];
            if (Object.keys(entry.channels).length === 0) {
                entry.array.push = entry.originalPush;
                delete registry?.[path];
            }
        },
    });
}
export async function startLiveHistoryPushCapture(options) {
    const tabId = options.tabId;
    if (tabId === undefined) {
        return () => { };
    }
    const channelId = makeChannelId();
    const eventType = pageEventType(channelId);
    const pendingEntries = [];
    let snapshotDelivered = false;
    let hookInstalled = false;
    const listener = (message, sender) => {
        if (sender.tab?.id === tabId &&
            isLiveHistoryPushMessage(message, channelId)) {
            const entry = {
                rawValue: message.rawValue,
                timestamp: message.timestamp,
            };
            if (snapshotDelivered) {
                options.onEntry(entry);
            }
            else {
                pendingEntries.push(entry);
            }
        }
    };
    chrome.runtime.onMessage.addListener(listener);
    try {
        await injectMessageBridge(tabId, channelId, eventType);
        const snapshot = await injectHistoryArrayHook(tabId, options.historyPath, channelId, eventType);
        hookInstalled = snapshot.installed;
        if (snapshot.installed) {
            options.onSnapshot?.({
                historyPath: options.historyPath,
                rawValues: snapshot.rawValues,
            });
        }
        snapshotDelivered = true;
        pendingEntries.splice(0).forEach(options.onEntry);
    }
    catch (error) {
        chrome.runtime.onMessage.removeListener(listener);
        if (hookInstalled) {
            cleanupHistoryArrayHook(tabId, options.historyPath, channelId);
        }
        throw error;
    }
    return () => {
        chrome.runtime.onMessage.removeListener(listener);
        cleanupHistoryArrayHook(tabId, options.historyPath, channelId);
    };
}
//# sourceMappingURL=data-layer-live-observation.js.map