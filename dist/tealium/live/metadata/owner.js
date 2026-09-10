import { fetchMetadata, METADATA_ORIGIN, validUtid } from './request.js';
const context = (row) => JSON.stringify([row.tabId, row.documentId, row.frameId, row.profile]);
export function metadataOwner(current, publish, permission = () => chrome.permissions.contains({ origins: [METADATA_ORIGIN] }), request = fetchMetadata) {
    let session = '', disposed = false;
    let lastState = { status: 'Names unavailable', reason: '', needsAccess: false, retry: false };
    const entries = new Map(), displayed = new Map();
    const apply = () => {
        if (current().status !== 'Observing')
            return;
        displayed.clear();
        for (const row of current().rows) {
            const entry = row.utid ? entries.get(row.utid) : undefined;
            const result = entry?.contexts.has(context(row)) ? entry.result : undefined;
            const name = result?.names[row.uid];
            displayed.set(row.key, result ? { ...row, name: name ?? row.name,
                publishedTitle: result.title, nameSource: name ? 'Tealium profile metadata' : 'Local runtime' } : row);
        }
    };
    const begin = (utid, rows) => {
        const entry = { contexts: new Set(rows.map(context)), controller: new AbortController(),
            status: 'Loading names', reason: '', needsAccess: false };
        entries.set(utid, entry);
        void (async () => {
            try {
                if (!await permission()) {
                    entry.needsAccess = true;
                    throw Error('Access to my.tealiumiq.com is required');
                }
                if (entry.controller.signal.aborted)
                    return;
                const result = await request(utid, entry.controller.signal);
                if (disposed || entry.controller.signal.aborted || entries.get(utid) !== entry)
                    return;
                entry.result = result;
                entry.status = 'Names loaded';
            }
            catch (error) {
                if (entry.controller.signal.aborted)
                    return;
                entry.status = 'Names unavailable';
                entry.reason = error instanceof Error ? error.message : 'Metadata request failed';
            }
            if (disposed || entry.controller.signal.aborted || entries.get(utid) !== entry)
                return;
            apply();
            if (current().status !== 'Paused')
                publish();
        })();
    };
    const update = () => {
        const live = current();
        if (disposed)
            return;
        if (session !== live.sessionId) {
            for (const entry of entries.values())
                entry.controller.abort();
            entries.clear();
            displayed.clear();
            session = live.sessionId;
        }
        if (!['Observing', 'Paused'].includes(live.status)) {
            for (const entry of entries.values())
                entry.controller.abort();
            return;
        }
        const groups = new Map();
        for (const row of live.rows)
            if (validUtid(row.utid))
                groups.set(row.utid, [...(groups.get(row.utid) ?? []), row]);
        for (const [utid, entry] of entries) {
            const contexts = new Set((groups.get(utid) ?? []).map(context));
            if ([...entry.contexts].some(value => !contexts.has(value))) {
                entry.controller.abort();
                delete entry.result;
                entry.status = 'Names unavailable';
                entry.reason = 'The observed document changed';
            }
        }
        if (live.status === 'Paused')
            return;
        for (const [utid, rows] of groups) {
            const entry = entries.get(utid);
            if (!entry)
                begin(utid, rows);
            else if (entry.result && !entry.controller.signal.aborted)
                for (const row of rows)
                    entry.contexts.add(context(row));
        }
        apply();
    };
    return {
        update,
        view: () => ({ ...current(), rows: current().rows.map(row => displayed.get(row.key) ?? row) }),
        state() {
            if (['Paused', 'Ended', 'Target closed'].includes(current().status))
                return { ...lastState, retry: false };
            const active = [...new Set(current().rows.map(row => row.utid))].flatMap(utid => utid && entries.has(utid) ? [entries.get(utid)] : []);
            lastState = { status: active.some(e => e.status === 'Loading names') ? 'Loading names' :
                    active.some(e => e.status === 'Names unavailable') || !active.length ? 'Names unavailable' : 'Names loaded',
                reason: active.find(e => e.reason)?.reason ?? (!active.length ? 'Runtime profile identity is unavailable' : ''),
                needsAccess: active.some(e => e.needsAccess), retry: current().status === 'Observing' && active.length > 0 };
            return lastState;
        },
        retry() {
            if (disposed || current().status !== 'Observing')
                return;
            for (const entry of entries.values())
                entry.controller.abort();
            const previous = new Map([...entries].map(([utid, entry]) => [utid, entry.result]));
            entries.clear();
            update();
            for (const [utid, entry] of entries) {
                const result = previous.get(utid);
                if (result)
                    entry.result = result;
            }
            apply();
            publish();
        },
        dispose() { disposed = true; for (const entry of entries.values())
            entry.controller.abort(); },
    };
}
//# sourceMappingURL=owner.js.map