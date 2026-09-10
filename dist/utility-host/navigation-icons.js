import { navigationStyle } from './navigation-style.js';
const marks = {
    'data-layer': '<path d="M3 5h4a5 7 0 0 1 0 14H3V5Zm1 2v10h3a3 5 0 0 0 0-10H4Z" fill="currentColor"/><path d="M15 5v14h7v-3h-4V5Z" fill="currentColor"/>',
    hotkeys: '<rect x="1" y="3" width="22" height="18" rx="4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 8v8m5-8v8M5 12h5m4-4v8m5-8-5 4 5 4" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    tealium: '<path d="M3 4h18v4h-7v13h-4V8H3Z" fill="currentColor"/><path d="M2 12h4m12 0h4M4 17h2m12 0h2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
};
export function navigationArtwork(id, label) {
    const words = label.trim().split(/\s+/);
    const short = (words.length > 1 ? words.map(word => word[0]).join('') : label).slice(0, 2).toUpperCase();
    const mark = Object.hasOwn(marks, id) ? marks[id] : null;
    return { label, short, svg: mark ? `<svg aria-hidden="true" viewBox="0 0 24 24">${mark}</svg>` : null };
}
export function presentUtilityNavigation(doc, tabList) {
    if (!doc.getElementById('utility-navigation-style')) {
        const style = doc.createElement('style');
        style.id = 'utility-navigation-style';
        style.textContent = navigationStyle;
        doc.head.append(style);
    }
    tabList.classList.add('utility-icon-navigation');
    for (const button of Array.from(tabList.querySelectorAll('[role=tab]'))) {
        const label = button.getAttribute('aria-label') ?? button.textContent?.trim() ?? '';
        const icon = navigationArtwork(button.id.replace('workspace-tab-', ''), label);
        const artwork = doc.createElement('span'), name = doc.createElement('span');
        artwork.className = 'utility-artwork';
        artwork.setAttribute('aria-hidden', 'true');
        if (icon.svg)
            artwork.innerHTML = icon.svg;
        else
            artwork.textContent = icon.short;
        name.className = 'utility-name';
        name.setAttribute('role', 'tooltip');
        name.textContent = label;
        button.setAttribute('aria-label', label);
        button.replaceChildren(artwork, name);
    }
}
//# sourceMappingURL=navigation-icons.js.map