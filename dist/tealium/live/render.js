export const element = (id) => {
    const value = document.getElementById(id);
    if (!value)
        throw Error(`Missing Live control: ${id}`);
    return value;
};
export function renderSource(state) {
    element('source-status').textContent = state.connected
        ? state.resolution?.detail ?? 'Resolving the selected source'
        : state.feedback || 'Open DevTools for the bound website to inspect sources.';
    element('source-url').textContent = state.resolution?.url ?? '';
    element('feedback').textContent = state.feedback;
    element('show-source').disabled = !state.connected || state.resolution?.status !== 'Resolved';
    element('copy-source').disabled = !state.resolution?.url;
}
export function visibleTags(state) {
    const search = state.search.toLocaleLowerCase();
    return state.rows.filter(row => (!search || row.name.toLocaleLowerCase().includes(search) || row.uid.includes(search)) &&
        (!state.codeFilter || row.codeState === state.codeFilter) &&
        (!state.profileFilter || `${row.frameId} / ${row.profile}` === state.profileFilter));
}
function renderRows(state, select) {
    const list = element('rows'), pane = element('list'), scroll = pane.scrollTop;
    const existing = new Map(Array.from(list.children).map(child => [child.dataset.key, child]));
    const rows = visibleTags(state);
    const retained = new Set(rows.map(row => row.key));
    for (const [key, node] of existing)
        if (!retained.has(key ?? ''))
            node.remove();
    rows.forEach((row, index) => {
        let button = existing.get(row.key);
        if (!button) {
            button = document.createElement('button');
            button.className = 'tag';
            button.dataset.key = row.key;
            button.append(document.createElement('span'), document.createElement('small'));
            button.onclick = () => select(row.key);
        }
        button.firstElementChild.textContent = `${row.name} · ${row.uid}`;
        button.lastElementChild.textContent = `${row.codeState} · Frame ${row.frameId} / ${row.profile}`;
        button.setAttribute('aria-pressed', String(row.key === state.selected));
        if (list.children[index] !== button)
            list.insertBefore(button, list.children[index] ?? null);
    });
    pane.scrollTop = scroll;
    element('count').textContent = `${rows.length} / ${state.rows.length} tags`;
}
function renderInspector(row) {
    element('inspector').hidden = !row;
    element('working').classList.toggle('selected', Boolean(row));
    if (!row)
        return;
    element('tag-name').textContent = row.name;
    const metadata = element('metadata');
    const fields = { UID: row.uid, Profile: row.profile, Frame: String(row.frameId),
        Account: row.account, Environment: row.environment, Version: row.version,
        Code: row.codeState, Initialization: row.initialized ? 'Initialized' : 'Unavailable',
        'Loading suppression': row.loadingSuppressed ? 'Explicitly enabled' : 'No explicit evidence' };
    for (const [name, value] of Object.entries(fields)) {
        let cell = metadata.querySelector(`[data-field="${name}"]`);
        if (!cell) {
            const label = document.createElement('dt');
            label.textContent = name;
            cell = document.createElement('dd');
            cell.dataset.field = name;
            metadata.append(label, cell);
        }
        cell.textContent = value ?? 'Unavailable';
    }
    element('raw').textContent = JSON.stringify(row, null, 2);
}
export function renderLive(state, select) {
    element('target').textContent = state.url || `Website tab ${state.tabId}`;
    element('status').textContent = `${state.status}${state.error ? ': ' + state.error : ''}`;
    for (const [id, enabled] of Object.entries({ start: state.accessReady && ['Ready', 'Ended'].includes(state.status),
        pause: state.status === 'Observing', resume: state.status === 'Paused',
        end: ['Observing', 'Paused', 'Permission required'].includes(state.status) })) {
        element(id).disabled = !enabled;
        element(id).hidden = !enabled;
    }
    const frames = state.inventory.frames;
    const states = [...new Set(frames.map(frame => frame.observation.state))];
    element('coverage').textContent = `${states.join(', ') || 'Not detected'} · ${state.rows.length} tags · ` +
        (state.inventory.limits.length ? 'Partial coverage: ' + state.inventory.limits.map(limit => `Frame ${limit.frameId}: ${limit.reason}`).join('; ') : `${frames.length} accessible frames observed`);
    for (const [id, value] of [['search', state.search], ['code', state.codeFilter]]) {
        const control = element(id);
        if (control.value !== value)
            control.value = value;
    }
    const profiles = element('profile');
    const names = [...new Set(state.rows.map(row => `${row.frameId} / ${row.profile}`))];
    const wanted = ['', ...names];
    if (JSON.stringify(Array.from(profiles.options).map(option => option.value)) !== JSON.stringify(wanted)) {
        profiles.replaceChildren(...wanted.map(value => new Option(value || 'All frames and profiles', value)));
    }
    profiles.value = state.profileFilter;
    renderRows(state, select);
    renderInspector(state.rows.find(row => row.key === state.selected));
    document.documentElement.dataset.ready = 'true';
    document.documentElement.dataset.observations = String(state.completed);
}
//# sourceMappingURL=render.js.map