import { getHistoryArrayPath } from "./data-layer.js";
export const DATA_LAYER_SESSION_STORAGE_KEY = "dataLayerTestingSession";
export function sessionScope(state) {
    return state.session ? "active-tab journey" : undefined;
}
export function startDataLayerTestingSession(state, options) {
    if (state.session?.status === "active") {
        return {
            ...state,
            warning: "active session already exists",
        };
    }
    return {
        session: {
            id: `tab-${options.tabId}`,
            status: "active",
            tabId: options.tabId,
            historyPath: options.historyPath ?? getHistoryArrayPath(),
            startUrl: options.url,
            currentUrl: options.url,
            timeline: [],
        },
    };
}
export function navigateSession(state, url) {
    if (!state.session || state.session.status !== "active") {
        return state;
    }
    return {
        ...state,
        session: {
            ...state.session,
            currentUrl: url,
        },
    };
}
export function captureEntry(state, entry) {
    if (!state.session || state.session.status !== "active") {
        return state;
    }
    return {
        ...state,
        session: {
            ...state.session,
            timeline: [...state.session.timeline, entry],
        },
    };
}
export function endDataLayerTestingSession(state) {
    if (!state.session) {
        return state;
    }
    return {
        session: {
            ...state.session,
            status: "ended",
        },
    };
}
export function persistSession(state) {
    if (state.session) {
        localStorage.setItem(DATA_LAYER_SESSION_STORAGE_KEY, JSON.stringify(state));
    }
}
export function restoreSession() {
    const raw = localStorage.getItem(DATA_LAYER_SESSION_STORAGE_KEY);
    if (!raw) {
        return {};
    }
    try {
        return JSON.parse(raw);
    }
    catch {
        return {};
    }
}
//# sourceMappingURL=data-layer-session.js.map