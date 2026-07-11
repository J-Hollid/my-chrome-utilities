export async function copyLivePageUrl(pageUrl, writeText) {
    if (!pageUrl || !writeText)
        return "unavailable";
    try {
        await writeText(pageUrl);
        return "copied";
    }
    catch {
        return "failed";
    }
}
//# sourceMappingURL=data-layer-live-session-summary-actions.js.map