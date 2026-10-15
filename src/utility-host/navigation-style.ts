export const navigationStyle = `
.twatility-side-panel #workspace-tabs.utility-icon-navigation {
 display:flex;flex-wrap:nowrap;gap:8px;padding:8px 12px;overflow:visible;
}
#workspace-tabs.utility-icon-navigation [role=tab] {
 position:relative;display:grid;place-items:center;flex:1 1 0;box-sizing:border-box;
 width:auto;height:auto;min-width:0;min-height:60px;max-width:none;
 padding:6px;border:2px solid transparent;border-radius:8px;background:transparent;
 color:var(--twa-brand-strong,#173d37);cursor:pointer;
}
#workspace-tabs.utility-icon-navigation .utility-artwork,
#workspace-tabs.utility-icon-navigation svg {display:block;width:24px;height:24px;}
#workspace-tabs.utility-icon-navigation .utility-artwork {font:700 13px/24px system-ui;text-align:center;}
#workspace-tabs.utility-icon-navigation [role=tab]:hover {background:var(--twa-surface-soft,#e1eadc);}
#workspace-tabs.utility-icon-navigation [aria-selected=true],
#workspace-tabs.utility-icon-navigation [aria-selected=true]:hover {
 background:var(--twa-brand-strong,#173d37);color:var(--twa-surface-raised,#fffdf5);
 border-color:var(--twa-brand-strong,#173d37);box-shadow:inset 0 -3px var(--twa-mustard,#dcc06b);
}
#workspace-tabs.utility-icon-navigation [role=tab]:focus-visible {outline:3px solid var(--twa-focus,#7e5200);outline-offset:3px;}
#workspace-tabs.utility-icon-navigation .utility-name {
 display:block;position:static;
 width:auto;max-width:100%;padding:2px 0;border-radius:0;
 font:400 13px/1.4 system-ui;text-transform:none;letter-spacing:normal;white-space:normal;
 background:transparent;color:inherit;pointer-events:none;
}
#workspace-tabs.utility-icon-navigation [role=tab]:hover .utility-name,
#workspace-tabs.utility-icon-navigation [role=tab]:focus .utility-name {display:block;}
@media(forced-colors:active) {
 #workspace-tabs.utility-icon-navigation [role=tab] {border-color:ButtonText;color:ButtonText;background:ButtonFace;}
 #workspace-tabs.utility-icon-navigation [aria-selected=true] {border:4px double Highlight;color:Highlight;background:Canvas;}
 #workspace-tabs.utility-icon-navigation [role=tab]:focus-visible {outline:3px solid Highlight;outline-offset:3px;}
 #workspace-tabs.utility-icon-navigation .utility-name {background:Canvas;color:CanvasText;border:1px solid CanvasText;}
}
`;
