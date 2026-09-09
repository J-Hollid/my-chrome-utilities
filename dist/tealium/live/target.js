export function pageOrigin(url) {
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol) ? `${parsed.origin}/*` : null;
    }
    catch {
        return null;
    }
}
export async function probeTarget(tabId) {
    const [result] = await chrome.scripting.executeScript({ target: { tabId },
        func: () => location.href });
    if (!result?.documentId || typeof result.result !== 'string')
        throw Error('Page access is unavailable');
    return result.result;
}
//# sourceMappingURL=target.js.map