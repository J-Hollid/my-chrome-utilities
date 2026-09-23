import assert from 'node:assert/strict';
import {navigationArtwork} from '../../../dist/utility-host/navigation-icons.js';
for(const [id,label,shape]of [['data-layer','Data Layer','m12 3.5'],['hotkeys','Hotkeys','M6.5 9h2'],['tealium','Tealium','<circle']]) {
 const result=navigationArtwork(id,label);
 assert.equal(result.label,label);assert.ok(result.svg.includes(shape));
 assert.match(result.svg,/viewBox="0 0 24 24"/);assert.match(result.svg,/aria-hidden="true"/);
 assert.doesNotMatch(result.svg,/<(?:img|image|script)|https?:/);
}
for(const [label,short]of [['Probe','PR'],['Network Inspector','NI'],['A','A']]) {
 const result=navigationArtwork('future',label);assert.equal(result.label,label);assert.equal(result.short,short);assert.equal(result.svg,null);
}
