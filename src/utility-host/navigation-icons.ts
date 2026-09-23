import {navigationStyle} from './navigation-style.js';
const marks: Record<string,string> = {
 'data-layer':'<path d="m12 3.5 8.5 4.75L12 13 3.5 8.25 12 3.5Zm-8.5 9L12 17.25l8.5-4.75M3.5 16.75 12 21.5l8.5-4.75" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
 hotkeys:'<rect x="2.5" y="4" width="19" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M6.5 9h2m3 0h2m3 0h1M6.5 13h2m3 0h2m3 0h1M7.5 17h9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
 tealium:'<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 8.5h10M12 8.5V17" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/>',
};
export function navigationArtwork(id: string,label: string) {
 const words=label.trim().split(/\s+/);
 const short=(words.length>1?words.map(word=>word[0]).join(''):label).slice(0,2).toUpperCase();
 const mark=Object.hasOwn(marks,id)?marks[id]:null;
 return {label,short,svg:mark?`<svg aria-hidden="true" viewBox="0 0 24 24">${mark}</svg>`:null};
}
export function presentUtilityNavigation(doc: Document,tabList: HTMLElement) {
 if(!doc.getElementById('utility-navigation-style')) {
  const style=doc.createElement('style');style.id='utility-navigation-style';style.textContent=navigationStyle;doc.head.append(style);
 }
 tabList.classList.add('utility-icon-navigation');
 for(const button of Array.from(tabList.querySelectorAll<HTMLButtonElement>('[role=tab]'))) {
  const label=button.getAttribute('aria-label')??button.textContent?.trim()??'';
  const icon=navigationArtwork(button.id.replace('workspace-tab-',''),label);
  const artwork=doc.createElement('span'),name=doc.createElement('span');
  artwork.className='utility-artwork';artwork.setAttribute('aria-hidden','true');
  if(icon.svg)artwork.innerHTML=icon.svg;else artwork.textContent=icon.short;
  name.className='utility-name';name.setAttribute('role','tooltip');name.textContent=label;
  button.setAttribute('aria-label',label);button.replaceChildren(artwork,name);
 }
}
