/** Serialized into MAIN world. Keep every executable dependency inside this function. */
export function readTealiumPage() {
    const object = (value) => value !== null && typeof value === 'object';
    const own = (value, key) => {
        if (!object(value))
            return undefined;
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (descriptor && !('value' in descriptor))
            throw Error(`Unreadable property: ${key}`);
        return descriptor?.value;
    };
    const text = (value) => typeof value === 'string' || typeof value === 'number' ? String(value) : null;
    const result = {
        state: 'Not detected', url: location.href, tags: [], resources: [], limits: [], childFrames: [],
    };
    try {
        result.childFrames = Array.from(document.querySelectorAll('iframe,frame'))
            .map((frame, index) => ({ url: frame.src || 'about:blank', index }));
        const scripts = Array.from(document.scripts).filter(script => script.src)
            .map(script => ({ url: script.src, id: script.id }));
        result.resources = [...new Set([...scripts.map(script => script.url),
                ...performance.getEntriesByType('resource').map(resource => resource.name)])];
        const root = own(window, 'utag');
        if (!object(root))
            return result;
        const profiles = own(root, 'o');
        const entries = object(profiles)
            ? Object.keys(profiles).map(key => [key, own(profiles, key)]) : [];
        if (!entries.some(([, value]) => value === root))
            entries.push(['default', root]);
        const seen = new Set();
        for (const [profile, runtime] of entries) {
            if (!object(runtime) || seen.has(runtime))
                continue;
            seen.add(runtime);
            try {
                const view = own(runtime, 'view'), link = own(runtime, 'link');
                if (typeof view === 'function' && Array.isArray(own(runtime, 'e')) &&
                    !own(runtime, 'loader')) {
                    if (result.state === 'Not detected')
                        result.state = 'Initializing';
                    continue;
                }
                const loader = own(runtime, 'loader'), sender = own(runtime, 'sender');
                const config = own(runtime, 'cfg');
                if (typeof view !== 'function' || typeof link !== 'function')
                    continue;
                if (!object(loader) || !object(sender) || !object(config)) {
                    throw Error('Recognized runtime has unsupported loader, sender, or configuration');
                }
                const tags = own(loader, 'cfg') ?? {};
                if (!object(tags))
                    throw Error('Tag configuration is unavailable');
                result.state = 'Detected';
                const ids = [...new Set([...Object.keys(tags), ...Object.keys(sender)])]
                    .filter(uid => /^\d+$/.test(uid));
                for (const uid of ids) {
                    const tag = own(tags, uid), registered = own(sender, uid);
                    const send = own(registered, 'send');
                    const row = {
                        profile, uid, name: text(own(tag, 'title')) || `Tag ${uid}`,
                        codeState: typeof send === 'function' ? 'Code registered' : 'Configured',
                        account: text(own(config, 'account')), environment: text(own(config, 'env')),
                        version: text(own(config, 'v')) ?? text(own(config, 'template')),
                        initialized: own(own(runtime, 'handler'), 'iflag') === 1,
                        loadingSuppressed: own(config, 'noload') === true || own(config, 'noload') === 1,
                        requestUrls: scripts.filter(script => script.id === `utag_${profile}_${uid}`)
                            .map(script => script.url),
                        senderSource: typeof send === 'function' ? Function.prototype.toString.call(send) : null,
                    };
                    result.tags.push(row);
                }
            }
            catch (error) {
                result.limits.push(`${profile}: ${error instanceof Error ? error.message : 'Read failed'}`);
            }
        }
        if (result.limits.length)
            result.state = 'Unsupported runtime';
    }
    catch (error) {
        result.state = 'Unsupported runtime';
        result.limits.push(error instanceof Error ? error.message : 'Runtime could not be read');
    }
    return result;
}
//# sourceMappingURL=page-reader.js.map