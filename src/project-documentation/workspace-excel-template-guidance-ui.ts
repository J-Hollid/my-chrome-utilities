import type {ProjectDocumentationSectionKind} from "../data-layer-project-documentation-records.js";
import {excelTemplateGuideFor} from "../documentation-templates/excel-template.js";
import type {ExcelWorkbookFinding} from "../documentation-templates/excel-workbook.js";
import {documentationHeading as heading} from "./workspace-ui-elements.js";

const kindName=(kind:ProjectDocumentationSectionKind)=>kind==="profile"?"Site Profile":kind==="matrix"?"Data capture matrix":kind[0]!.toUpperCase()+kind.slice(1);

export function renderExcelTemplateGuide(kind:ProjectDocumentationSectionKind):HTMLElement{
  const details=document.createElement("details"),summary=document.createElement("summary"),search=document.createElement("input"),results=document.createElement("div"),guide=excelTemplateGuideFor(kind);
  summary.textContent="Excel template guide";
  search.type="search";
  search.setAttribute("aria-label",`${kindName(kind)} Excel binding and repeat guide search`);
  search.placeholder="Search values or repeatable data";
  const render=()=>{
    const query=search.value.trim().toLocaleLowerCase(),matches=(value:string)=>!query||value.toLocaleLowerCase().includes(query);
    results.replaceChildren();
    const values=guide.values.filter(entry=>matches(`${entry.path} ${entry.meaning} ${entry.example} ${entry.available}`));
    const collections=guide.collections.filter(entry=>matches(`${entry.path} ${entry.meaning} ${entry.itemPrefix} ${entry.fields.join(" ")} ${entry.nestedCollections.join(" ")}`));
    const valueHeading=heading(4,"Single values"),valueList=document.createElement("ul"),collectionHeading=heading(4,"Repeatable data"),collectionList=document.createElement("ul");
    valueList.append(...values.map(entry=>Object.assign(document.createElement("li"),{textContent:`${entry.placeholder} — ${entry.meaning} — example ${entry.example} — ${entry.available}`})));
    collectionList.append(...collections.map(entry=>Object.assign(document.createElement("li"),{textContent:`${entry.path} — ${entry.meaning}; item prefix ${entry.itemPrefix}; fields ${entry.fields.join(", ")}; nested ${entry.nestedCollections.join(", ")||"none"}; Across or Down; ${entry.emptyResult}; ${entry.copyBehavior}`})));
    results.append(valueHeading,valueList,collectionHeading,collectionList);
  };
  search.addEventListener("input",render);
  render();
  details.append(summary,search,results);
  return details;
}

export function renderExcelTemplateFindings(detail:HTMLElement,findings:readonly ExcelWorkbookFinding[]):void{
  const alert=document.createElement("section"),list=document.createElement("ul");
  alert.role="alert";
  alert.setAttribute("aria-label","Excel template findings");
  alert.append(heading(3,"Excel template needs repair"));
  for(const finding of findings){
    const item=document.createElement("li"),rule=document.createElement("p"),repair=document.createElement("p"),technical=document.createElement("details");
    item.setAttribute("aria-label",`Excel template finding at ${finding.location}`);
    item.append(Object.assign(document.createElement("p"),{textContent:`${finding.location}: ${finding.message}`}));
    rule.textContent=`Authoring rule: ${finding.rule??"Use only the guided workbook structure, supported bindings, and complete named areas."}`;
    repair.textContent=`Suggested action: ${finding.repair??"Correct this item in Excel, then choose the workbook again."}`;
    technical.append(Object.assign(document.createElement("summary"),{textContent:"Technical details"}),Object.assign(document.createElement("pre"),{textContent:finding.technical??JSON.stringify({location:finding.location,message:finding.message},null,2)}));
    item.append(rule,repair,technical);
    list.append(item);
  }
  alert.append(list);
  detail.replaceChildren(alert);
}
