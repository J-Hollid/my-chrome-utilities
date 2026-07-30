import {regularExpressionTest} from "./data-layer-string-rule-validation.js";

export function renderRegularExpressionTester(dom:Document,pattern:HTMLInputElement):HTMLElement {
  const host=dom.createElement("div"),sample=dom.createElement("input"),result=dom.createElement("p");
  host.dataset.patternTester="true";sample.type="text";sample.setAttribute("aria-label","Test value");result.setAttribute("aria-live","polite");result.dataset.patternTestResult="true";
  const render=():void=>{
    const state=regularExpressionTest(pattern.value,sample.value);result.textContent=state.text;result.dataset.patternTestState=state.state;
    if("treatment" in state){result.dataset.patternTestTreatment=state.treatment;result.style.color=state.treatment==="valid-green"?"var(--valid-color, #187a3d)":"var(--invalid-color, #b42318)";}
    else{delete result.dataset.patternTestTreatment;result.style.removeProperty("color");}
  };
  pattern.addEventListener("input",render);sample.addEventListener("input",render);host.append(sample,result);render();return host;
}
