// Runs in the installed extension. All walks are bounded by the rendered DOM.
export function measureCompanion(focusOnly=false) {
  const visible = element => {
    const style = getComputedStyle(element);
    const fullyClipped = style.position === "absolute" && style.overflow === "hidden" &&
      style.clip.replace(/\s/g, "") === "rect(0px,0px,0px,0px)";
    return !fullyClipped && element.getClientRects().length > 0 && style.visibility === "visible" && element.checkVisibility({checkVisibilityCSS:true});
  };
  const rgba = value => {
    const values = value.match(/[\d.]+/g)?.map(Number) ?? [];
    if (values.length < 3) throw Error(`Unsupported measured colour: ${value}`);
    const scale = value.startsWith("color(srgb ") ? 255 : 1;
    return [...values.slice(0, 3).map(component=>component*scale), values[3] ?? 1];
  };
  const composite = (front, back) => front.slice(0, 3).map((v, i) => v * front[3] + back[i] * (1-front[3]));
  const background = element => {
    const chain = [];
    for (let current = element; current; current = current.parentElement) chain.push(current);
    return chain.reverse().reduce((color, current) => composite(rgba(getComputedStyle(current).backgroundColor), color), [255,255,255]);
  };
  const luminance = rgb => rgb.map(v => v/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4)
    .reduce((sum,v,i) => sum+v*[.2126,.7152,.0722][i],0);
  const contrast = (foreground, back) => {
    const a=luminance(composite(foreground,back)), b=luminance(back);
    return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  };
  const active=document.activeElement,focusStyle=getComputedStyle(active);
  const focus={visible:focusStyle.outlineStyle!=="none",ratio:contrast(rgba(focusStyle.outlineColor),background(active.parentElement ?? active))};
  if(focusOnly)return focus;
  const text=[];
  for (const element of document.querySelectorAll("body *")) {
    if (!visible(element) || element.closest("script,style")) continue;
    const direct=[...element.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).map(node=>node.textContent).join("").trim();
    const value=direct || (element.matches("input,textarea,select") ? element.value || element.placeholder : "");
    if (!value) continue;
    const style=getComputedStyle(element), back=background(element);
    text.push({id:element.id,tag:element.tagName,text:value.slice(0,75),ratio:contrast(rgba(style.color),back),background:back,opacity:Number(style.opacity)});
    if (element.matches("input[placeholder],textarea[placeholder]") && !element.value) {
      text.push({id:element.id,text:element.placeholder,ratio:contrast(rgba(getComputedStyle(element,"::placeholder").color),back),placeholder:true});
    }
  }
  const tabs=[...document.querySelectorAll('#data-layer-views [role="tab"]')].filter(visible);
  const rows=new Set(tabs.map(tab=>Math.round(tab.getBoundingClientRect().top))).size;
  const ordinary=[...document.querySelectorAll("button,input,textarea,select")].filter(visible);
  const workspace=document.querySelector('[id^="workspace-panel-"]:not([hidden])');
  return {
    text, rows, width:innerWidth, focus,
    emptyMessages:[...document.querySelectorAll("output:empty")].filter(visible).filter(element=>{
      const style=getComputedStyle(element);
      return parseFloat(style.paddingBlockStart)>0 || parseFloat(style.borderInlineStartWidth)>0 || rgba(style.backgroundColor)[3]>0;
    }).map(element=>element.id),
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    workspaceOverflow:workspace.scrollWidth-workspace.clientWidth,
    controls:ordinary.map(element=>{
      const bounds=element.getBoundingClientRect();
      const utilityIcon=element.matches('#workspace-tabs.utility-icon-navigation [role=tab]');
      const artwork=utilityIcon?element.querySelector('.utility-artwork'):null;
      const tip=utilityIcon?element.querySelector('.utility-name'):null;
      const art=artwork?.getBoundingClientRect(),label=tip?.getBoundingClientRect();
      const clipped=utilityIcon?(!art||art.left<bounds.left||art.right>bounds.right||
        art.top<bounds.top||art.bottom>bounds.bottom||
        (visible(tip)&&(label.left<0||label.right>innerWidth||label.top<0||label.bottom>innerHeight)))
        :element.tagName==="BUTTON"&&element.scrollWidth>element.clientWidth+1;
      return {id:element.id,utilityIcon,radius:parseFloat(getComputedStyle(element).borderTopLeftRadius),
        height:bounds.height,clipped};
    }),
    context:visible(document.getElementById("active-project-header")) ? document.getElementById("active-project-header").textContent : "",
    badgeCount:[...document.querySelectorAll("#utility-directory li")].filter(visible).length,
    duplicateHeading:[...document.querySelectorAll("#workspace-panel-data-layer > h2")].find(visible)?.textContent ?? "",
  };
}
