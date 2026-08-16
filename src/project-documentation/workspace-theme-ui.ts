import {createProjectDocumentationSet,createProjectDocumentationTheme,parseProjectDocumentationTheme,readProjectDocumentationLogoFile,serializeProjectDocumentationTheme,type ProjectDocumentationDraft,type ProjectDocumentationLogoFile,type ProjectDocumentationSet,type ProjectDocumentationTheme} from "../data-layer-project-documentation-records.js";
import type {ProjectDocumentationTable} from "../data-layer-project-documentation-workspace.js";
import type {ProjectDocumentationPorts} from "./workspace-export-ui.js";
import {documentationButton as button,documentationControlInput as controlInput,documentationHeading as heading,documentationLabelled as labelled,documentationLogoArea as logoArea,renderDocumentationTable as renderTable} from "./workspace-ui-elements.js";

const fileDataUrl=(file:ProjectDocumentationLogoFile):Promise<string>=>new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.addEventListener("load",()=>typeof reader.result==="string"?resolve(reader.result):reject(new Error("Unreadable logo")));
  reader.addEventListener("error",()=>reject(reader.error??new Error("Unreadable logo")));
  reader.addEventListener("abort",()=>reject(new Error("Unreadable logo")));
  reader.readAsDataURL(file as File);
});
const decodeLogoDataUrl=(dataUrl:string):Promise<{width:number;height:number}>=>new Promise((resolve,reject)=>{
  const image=new Image();
  image.addEventListener("load",()=>image.naturalWidth>0&&image.naturalHeight>0?resolve({width:image.naturalWidth,height:image.naturalHeight}):reject(new Error("Invalid logo dimensions")));
  image.addEventListener("error",()=>reject(new Error("Invalid logo image")));
  image.src=dataUrl;
});

export function renderDocumentationTheme(input:{host:HTMLElement;set:ProjectDocumentationSet;theme:ProjectDocumentationTheme;sampleTable?:ProjectDocumentationTable|undefined;ports:ProjectDocumentationPorts;documentation:()=>ProjectDocumentationDraft;persist:(records:ProjectDocumentationDraft,label:string)=>void;saveTheme:(theme:ProjectDocumentationTheme,label:string)=>void}):void {
  const {host,set,theme}=input;
  host.append(heading(2,`Edit theme · ${theme.name}`));
  const name=controlInput("themeName",theme.name),copyOutput=document.createElement("output"),paste=document.createElement("textarea");
  name.setAttribute("aria-label","Project-local theme name");
  paste.setAttribute("aria-label","Structured theme values");
  const groups:Record<string,HTMLDetailsElement>={};
  for(const title of["Brand","Typography","Table","Header and footer"]){const details=document.createElement("details");details.dataset.themeGroup=title;details.append(Object.assign(document.createElement("summary"),{textContent:title}));groups[title]=details;host.append(details);}
  const client=controlInput("clientName",theme.clientName),logoPicker=controlInput("logoFile","","file"),logoName=document.createElement("p"),logoDiagnostic=document.createElement("output"),removeLogo=button("Remove logo",()=>{}),headingColor=controlInput("headingColor",theme.colors.heading,"color"),accent=controlInput("accentColor",theme.colors.accent,"color"),stripe=controlInput("stripeColor",theme.colors.stripe,"color");
  let logoValue=theme.logo,logoFileName=theme.logo?"Saved logo":"";
  client.setAttribute("aria-label","Theme client name");logoPicker.accept="image/png,image/jpeg,image/gif";logoPicker.setAttribute("aria-label","Choose logo file");logoDiagnostic.id=`documentation-logo-diagnostic-${theme.id}`;logoDiagnostic.setAttribute("aria-live","polite");logoPicker.setAttribute("aria-describedby",logoDiagnostic.id);logoName.dataset.logoFileName="true";logoDiagnostic.dataset.logoDiagnostic="true";
  groups.Brand!.append(labelled("Client name",client),labelled("Choose logo file",logoPicker),logoName,logoDiagnostic,removeLogo,labelled("Heading color",headingColor),labelled("Accent color",accent),labelled("Stripe color",stripe));
  const family=controlInput("family",theme.typography.family),headingSize=controlInput("headingSize",String(theme.typography.headingSize),"number"),bodySize=controlInput("bodySize",String(theme.typography.bodySize),"number");
  family.setAttribute("aria-label","Theme font family");groups.Typography!.append(labelled("Font family",family),labelled("Heading size",headingSize),labelled("Body size",bodySize));
  const density=document.createElement("select");density.name="density";density.append(new Option("Comfortable","comfortable"),new Option("Compact","compact"));density.value=theme.density;
  const borders=document.createElement("input"),striping=document.createElement("input"),highlighted=document.createElement("input"),widths=document.createElement("textarea"),tableChoices=document.createElement("fieldset");
  for(const check of[borders,striping,highlighted])check.type="checkbox";
  borders.name="borders";striping.name="striping";highlighted.name="highlightedHeadings";borders.checked=theme.borders;striping.checked=theme.striping;highlighted.checked=theme.highlightedHeadings;widths.value=Object.entries(theme.columnWidths).map(([column,width])=>`${column}=${width}`).join("\n");widths.setAttribute("aria-label","Theme column widths");
  tableChoices.append(Object.assign(document.createElement("legend"),{textContent:"Table presentation choices"}),labelled("Density",density),labelled("Borders",borders),labelled("Striping",striping),labelled("Highlighted headings",highlighted),labelled("Column widths",widths));groups.Table!.append(tableChoices);
  const header=controlInput("headerText",theme.headerText),footer=controlInput("footerText",theme.footerText);header.setAttribute("aria-label","Theme header text");footer.setAttribute("aria-label","Theme footer text");groups["Header and footer"]!.append(labelled("Header text",header),labelled("Footer text",footer));
  const read=()=>createProjectDocumentationTheme({id:theme.id,name:name.value,clientName:client.value,logo:logoValue,colors:{heading:headingColor.value,accent:accent.value,stripe:stripe.value},typography:{family:family.value,headingSize:Number(headingSize.value),bodySize:Number(bodySize.value)},density:density.value==="compact"?"compact":"comfortable",borders:borders.checked,striping:striping.checked,highlightedHeadings:highlighted.checked,columnWidths:Object.fromEntries(widths.value.split(/\r?\n/u).flatMap((line)=>{const [column,raw]=line.split("=");return column&&Number(raw)>0?[[column.trim(),Number(raw)]]:[]})),headerText:header.value,footerText:footer.value});
  const sampleHost=document.createElement("section"),drawSample=(sampleTheme:ProjectDocumentationTheme)=>{sampleHost.replaceChildren();sampleHost.dataset.themeSample="true";const table=input.sampleTable??{id:"theme-sample",title:"Selected section sample",headings:["Property","Description"],rows:[["page_name","Page name"],["event_name","Observed event"]]};if(sampleTheme.logo)sampleHost.append(logoArea(sampleTheme));sampleHost.append(Object.assign(document.createElement("p"),{textContent:[sampleTheme.clientName,sampleTheme.headerText].filter(Boolean).join(" · ")}),heading(3,table.title),renderTable(table,sampleTheme),Object.assign(document.createElement("p"),{textContent:sampleTheme.footerText}));};
  const drawLogoState=()=>{logoName.textContent=logoFileName;removeLogo.hidden=!logoValue;drawSample(read());};
  removeLogo.addEventListener("click",()=>{logoValue="";logoFileName="";logoPicker.value="";logoDiagnostic.textContent="";drawLogoState();});
  logoPicker.addEventListener("change",()=>{const file=logoPicker.files?.[0];if(!file)return;logoDiagnostic.textContent="";void readProjectDocumentationLogoFile(file,fileDataUrl,decodeLogoDataUrl).then((logo)=>{logoValue=logo.dataUrl;logoFileName=logo.fileName;drawLogoState();},(error)=>{logoPicker.value="";logoDiagnostic.textContent=error instanceof Error?error.message:String(error);});});
  drawLogoState();
  const save=button("Save theme",()=>{try{input.saveTheme(read(),"Save project documentation theme");}catch(error){copyOutput.textContent=error instanceof Error?error.message:String(error);}}),preview=button("Preview theme changes",()=>{try{drawSample(read());}catch(error){copyOutput.textContent=error instanceof Error?error.message:String(error);}}),copy=button("Copy structured theme values",()=>{void input.ports.writePlain(serializeProjectDocumentationTheme(read())).then(()=>copyOutput.textContent="Structured theme values copied.");}),pasteButton=button("Paste as new project-local theme",()=>{try{const next=parseProjectDocumentationTheme(paste.value,{id:`documentation-theme:${crypto.randomUUID()}`,name:`${theme.name} copy`}),records=input.documentation(),nextSet=createProjectDocumentationSet({...set,themeId:next.id});input.persist({sets:records.sets.map((candidate)=>candidate.id===set.id?nextSet:candidate),themes:[...records.themes,next]},"Paste project-local documentation theme");}catch(error){copyOutput.textContent=error instanceof Error?error.message:String(error);}});
  host.prepend(name);host.append(save,preview,copy,paste,pasteButton,copyOutput,sampleHost);
}
