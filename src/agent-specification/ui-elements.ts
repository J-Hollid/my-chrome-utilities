export function element<K extends keyof HTMLElementTagNameMap>(tag:K, text=""):HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);if (text) node.textContent = text;return node;
}
export function button(text:string, action:()=>void | Promise<void>):HTMLButtonElement {
  const node = element("button",text);node.type="button";node.addEventListener("click",()=>void action());return node;
}
export function field<T extends HTMLElement>(label:string, input:T):HTMLLabelElement {
  input.setAttribute("aria-label",label);const node = element("label");node.append(element("span",label),input);return node;
}
export function select(entries:[string,string][]):HTMLSelectElement {
  const node = element("select");for (const [value,label] of entries) node.append(new Option(label,value));return node;
}
export function download(blob:Blob, name:string):void {
  const url = URL.createObjectURL(blob), link = element("a");link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function showJson(value:unknown):HTMLPreElement {return element("pre",JSON.stringify(value,null,2));}
export function installAgentStyles():void {
  if (document.getElementById("agent-workspace-style")) return;
  const style = element("style");style.id="agent-workspace-style";style.textContent=`
.agent-workspace{width:min(1200px,96vw);height:90vh;max-height:94vh;padding:1rem;color:var(--text,#182b40);background:var(--surface,#fff);border:1px solid var(--border,#c3ccd8);border-radius:.7rem;overflow:auto}
.agent-workspace::backdrop{background:#15223677}.agent-workspace header{display:flex;gap:1rem;align-items:center;justify-content:space-between}.agent-workspace nav,.agent-actions{display:flex;gap:.5rem;flex-wrap:wrap;margin:.7rem 0}.agent-workspace label{display:grid;gap:.3rem;margin:.5rem 0}.agent-workspace input,.agent-workspace select,.agent-workspace textarea{max-width:100%;min-width:0}.agent-workspace textarea{width:100%;box-sizing:border-box}.agent-workspace pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:24rem;overflow:auto;font-size:.8rem;background:#eef2f6;color:#182b40;padding:.6rem}.agent-workspace details{border:1px solid var(--border,#c3ccd8);padding:.6rem;border-radius:.4rem;margin:.6rem 0}.agent-workspace [role=status]{display:block;padding:.6rem;background:#edf5ff;color:#17344b;white-space:pre-wrap}.agent-context{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:.6rem}.agent-context label{display:flex;align-items:center}.agent-review-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:1rem}.agent-workspace table{border-collapse:collapse;width:100%}.agent-workspace td,.agent-workspace th{padding:.4rem;text-align:left;border:1px solid #ccd5de;overflow-wrap:anywhere}.agent-workspace [data-decision=accepted]{border-color:#167345}.agent-workspace [data-decision=rejected]{opacity:.7}.agent-workspace summary{cursor:pointer;font-weight:600}.agent-workspace [hidden]{display:none!important}@media(max-width:800px){.agent-review-grid{grid-template-columns:1fr}}
`;document.head.append(style);
}
