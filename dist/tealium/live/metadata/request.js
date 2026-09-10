export const METADATA_ORIGIN = 'https://my.tealiumiq.com/*';
export const METADATA_ENDPOINT = 'https://my.tealiumiq.com/urest/legacy/tagcompanion/getProfile';
export const METADATA_LIMIT = 1024 * 1024;
export const METADATA_TIMEOUT = 8000;
export const validUtid = (value) => typeof value === 'string' &&
    /^[a-zA-Z0-9_-]{1,80}\/[a-zA-Z0-9_-]{1,80}\/\d{12}$/.test(value);
export function parseMetadata(text) {
    const match = text.trim().match(/^window\.__tealium_wc_getProfile\(([\s\S]*)\);?$/);
    if (!match)
        throw Error('Unsupported metadata response');
    const value = JSON.parse(match[1]);
    if (!value || typeof value !== 'object' || !value.manage || typeof value.manage !== 'object' || Array.isArray(value.manage)) {
        throw Error('Exact profile metadata is unavailable');
    }
    if (value.title != null && (typeof value.title !== 'string' || value.title.length > 2000))
        throw Error('Invalid version title');
    const names = Object.create(null);
    for (const [uid, tag] of Object.entries(value.manage)) {
        if (!/^\d+$/.test(uid))
            continue;
        const title = tag?.title;
        if (title != null && (typeof title !== 'string' || title.length > 1000))
            throw Error('Invalid tag title');
        if (typeof title === 'string' && title.trim())
            names[uid] = title;
    }
    const title = value.title?.trim() ? value.title : null;
    if (!title && !Object.keys(names).length)
        throw Error('Exact profile metadata is unavailable');
    return { title, names };
}
export async function fetchMetadata(utid, signal, fetcher = fetch, timeout = METADATA_TIMEOUT) {
    if (!validUtid(utid))
        throw Error('Runtime profile identity is unavailable');
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted)
        abort();
    const timer = setTimeout(abort, timeout);
    const stopped = new Promise((_, reject) => {
        const fail = () => reject(Error('Metadata request ended or timed out'));
        controller.signal.addEventListener('abort', fail, { once: true });
        if (controller.signal.aborted)
            fail();
    });
    const read = async () => {
        const response = await fetcher(`${METADATA_ENDPOINT}?utid=${encodeURIComponent(utid)}`, {
            credentials: 'omit', referrerPolicy: 'no-referrer', referrer: '', redirect: 'error', cache: 'no-store', signal: controller.signal,
        });
        if (!response.ok || response.redirected || (response.url && new URL(response.url).origin !== 'https://my.tealiumiq.com'))
            throw Error('Metadata request failed');
        if (Number(response.headers.get('content-length')) > METADATA_LIMIT)
            throw Error('Metadata response is too large');
        const reader = response.body?.getReader();
        if (!reader)
            throw Error('Metadata response is empty');
        let size = 0, text = '';
        const decoder = new TextDecoder('utf-8', { fatal: true });
        try {
            for (;;) {
                const part = await reader.read();
                if (part.done)
                    break;
                size += part.value.byteLength;
                if (size > METADATA_LIMIT)
                    throw Error('Metadata response is too large');
                text += decoder.decode(part.value, { stream: true });
            }
            return parseMetadata(text + decoder.decode());
        }
        finally {
            await reader.cancel().catch(() => { });
        }
    };
    try {
        return await Promise.race([read(), stopped]);
    }
    finally {
        clearTimeout(timer);
        signal.removeEventListener('abort', abort);
        controller.abort();
    }
}
//# sourceMappingURL=request.js.map