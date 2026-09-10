import { connectUtilityPage } from '../../utility-host/page-client.js';
import { createLiveOwner } from './owner.js';
import { element, renderLive, renderSource } from './render.js';
import { pageOrigin } from './target.js';
import { validateCurrentTag } from '../detection/browser-target.js';
let owner, state;
let ownerEnded = false;
const action = (value) => {
    if (ownerEnded)
        return;
    if (client.ownsWork)
        owner?.action(value);
    else
        client.send('action', value);
};
const render = (value) => {
    state = value;
    renderLive(value.live, key => action({ name: 'select', key }));
    renderSource(value.source);
    element('access').hidden = value.live.status !== 'Permission required';
    element('access').disabled = !pageOrigin(value.live.url);
    element('setup').hidden = value.live.status !== 'Permission required';
    const limits = value.live.inventory.limits.filter(limit => pageOrigin(limit.url));
    const origins = [...new Set(limits.map(limit => pageOrigin(limit.url)))];
    const frameAccess = element('frame-access');
    if (frameAccess.dataset.origins !== JSON.stringify(origins)) {
        frameAccess.dataset.origins = JSON.stringify(origins);
        frameAccess.replaceChildren(...origins.map(origin => {
            const button = document.createElement('button');
            button.textContent = `Request access to ${new URL(origin).origin}`;
            button.onclick = async () => {
                if (await chrome.permissions.request({ origins: [origin] }))
                    action({ name: 'access' });
                else
                    element('feedback').textContent = 'Frame permission required';
            };
            return button;
        }));
    }
    if (ownerEnded) {
        for (const button of Array.from(document.querySelectorAll('#start, #pause, #resume, #end, #access, #retry, #frame-access button'))) {
            button.disabled = true;
        }
    }
};
const client = connectUtilityPage(window, message => {
    if (!client.ownsWork && message.kind === 'state' && message.payload)
        render(message.payload);
    if (!client.ownsWork && state && ['close', 'target-closed'].includes(message.kind)) {
        ownerEnded = true;
        state.live.status = message.kind === 'close' ? 'Ended' : 'Target closed';
        state.source = { connected: false, resolution: null, feedback: 'The observation owner ended' };
        render(state);
    }
    if (!client.ownsWork)
        return;
    if (message.kind === 'action' && message.payload)
        owner?.action(message.payload);
    if (message.kind === 'stop')
        owner?.action({ name: 'end' });
    if (message.kind === 'reset')
        owner?.action({ name: 'reset' });
    if (message.kind === 'target-closed')
        owner?.session.closeTarget();
    if (message.kind === 'close')
        owner?.dispose();
});
function useTarget(tabId) {
    if (owner || !client.ownsWork)
        return;
    owner = createLiveOwner(tabId, value => { render(value); client.send('state', value); });
}
async function listTargets(all = false) {
    const tabs = await chrome.tabs.query(all ? {} : { active: true, lastFocusedWindow: true });
    const select = element('targets');
    select.replaceChildren(...tabs.filter(tab => tab.id !== undefined &&
        !(tab.url ?? '').startsWith(chrome.runtime.getURL(''))).map(tab => new Option(tab.title ?? tab.url ?? `Website tab ${tab.id}`, String(tab.id))));
}
for (const name of ['start', 'pause', 'resume', 'end'])
    element(name).onclick = () => action({ name });
for (const id of ['search', 'code', 'profile'])
    element(id).addEventListener('input', () => action({ name: 'filters',
        search: element('search').value, code: element('code').value,
        profile: element('profile').value }));
element('clear').onclick = () => action({ name: 'filters' });
element('back').onclick = () => {
    const selected = state?.live.selected;
    action({ name: 'select', key: null });
    requestAnimationFrame(() => {
        const row = Array.from(element('rows').children).find(node => node.dataset.key === selected);
        (row ?? element('list')).focus({ preventScroll: true });
    });
};
element('show-source').onclick = () => action({ name: 'source' });
element('copy-source').onclick = async () => {
    const url = state?.source.resolution?.url;
    const row = state?.live.rows.find(tag => tag.key === state?.live.selected), sessionId = state?.live.sessionId;
    if (!url || !row)
        return;
    try {
        await validateCurrentTag(row);
        if (!state || state.live.sessionId !== sessionId || state.live.selected !== row.key || state.source.resolution?.url !== url) {
            throw Error('The source selection changed');
        }
        await navigator.clipboard.writeText(url);
        action({ name: 'feedback', message: 'Source URL copied' });
    }
    catch {
        action({ name: 'feedback', message: 'The source URL could not be copied' });
    }
};
element('access').onclick = async () => {
    const origin = pageOrigin(state?.live.url ?? '');
    if (!origin) {
        element('status').textContent = 'This page cannot grant website access';
        return;
    }
    const granted = await chrome.permissions.request({ origins: [origin] });
    if (granted)
        action({ name: 'access' });
    else
        element('status').textContent = 'Permission required';
};
element('browse').onclick = async () => {
    if (await chrome.permissions.request({ permissions: ['tabs'] })) {
        await listTargets(true);
        action({ name: 'access' });
    }
};
element('retry').onclick = () => action({ name: 'access' });
element('use-target').onclick = () => {
    const value = element('targets').value;
    if (value)
        useTarget(Number(value));
};
window.addEventListener('pagehide', () => owner?.dispose(), { once: true });
if (client.ownsWork) {
    if (client.identity.targetId !== null)
        useTarget(client.identity.targetId);
    else
        void listTargets();
}
document.documentElement.dataset.ready = 'true';
//# sourceMappingURL=entry.js.map