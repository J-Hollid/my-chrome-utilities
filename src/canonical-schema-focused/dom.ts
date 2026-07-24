export const labeled=(dom:Document,text:string,control:HTMLElement):HTMLLabelElement=>{const label=dom.createElement("label");label.append(text,control);return label;};
export const input=(dom:Document,name:string,value="",type="text"):HTMLInputElement=>{const control=dom.createElement("input");control.name=name;control.type=type;control.value=value;return control;};
export const button=(dom:Document,text:string,run:()=>void):HTMLButtonElement=>{const control=dom.createElement("button");control.type="button";control.textContent=text;control.addEventListener("click",run);return control;};
