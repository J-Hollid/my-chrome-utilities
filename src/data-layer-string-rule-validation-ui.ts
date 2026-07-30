import {regularExpressionTest} from "./data-layer-string-rule-validation.js";

export const regularExpressionTesterCopy={
  patternLabel:"Regular expression",
  sampleLabel:"Test value",
  resultLabel:"Test result",
  guidance:"Enter a sample value to check it against the regular expression. Test values are not saved.",
} as const;
export const regularExpressionTesterGridStyle="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0.5rem;align-items:start;min-width:0;max-width:100%;grid-column:1/-1;";

export function renderRegularExpressionTester(dom:Document,pattern:HTMLInputElement):HTMLElement {
  const host=dom.createElement("div"),patternLabel=pattern.closest("label")??dom.createElement("label"),sampleLabel=dom.createElement("label"),sample=dom.createElement("input"),guidance=dom.createElement("p"),resultRegion=dom.createElement("div"),resultLabel=dom.createElement("strong"),result=dom.createElement("p"),identity=crypto.randomUUID(),guidanceId=`pattern-tester-guidance-${identity}`,resultLabelId=`pattern-tester-result-${identity}`;
  if(!patternLabel.contains(pattern))patternLabel.append(regularExpressionTesterCopy.patternLabel,pattern);
  host.dataset.patternTester="true";host.dataset.patternTesterFieldGrid="true";host.style.cssText=regularExpressionTesterGridStyle;
  patternLabel.dataset.patternTesterField="pattern";patternLabel.style.cssText="display:grid;gap:0.2rem;min-width:0;";pattern.style.cssText+=";box-sizing:border-box;min-width:0;width:100%;";
  sampleLabel.dataset.patternTesterField="sample";sampleLabel.style.cssText="display:grid;gap:0.2rem;min-width:0;";sample.type="text";sample.setAttribute("aria-label",regularExpressionTesterCopy.sampleLabel);sample.style.cssText="box-sizing:border-box;min-width:0;width:100%;";sampleLabel.append(regularExpressionTesterCopy.sampleLabel,sample);
  guidance.id=guidanceId;guidance.dataset.patternTesterGuidance="true";guidance.style.cssText="grid-column:1/-1;min-width:0;margin:0;";guidance.textContent=regularExpressionTesterCopy.guidance;pattern.setAttribute("aria-describedby",guidanceId);sample.setAttribute("aria-describedby",guidanceId);
  resultRegion.dataset.patternTestResultRegion="true";resultRegion.style.cssText="display:grid;grid-column:1/-1;min-width:0;margin:0;";resultLabel.id=resultLabelId;resultLabel.textContent=regularExpressionTesterCopy.resultLabel;result.setAttribute("aria-live","polite");result.setAttribute("aria-labelledby",resultLabelId);result.style.margin="0";result.dataset.patternTestResult="true";resultRegion.append(resultLabel,result);
  const render=():void=>{
    const state=regularExpressionTest(pattern.value,sample.value);result.textContent=state.text;result.dataset.patternTestState=state.state;
    if("treatment" in state){result.dataset.patternTestTreatment=state.treatment;result.style.color=state.treatment==="valid-green"?"var(--valid-color, #187a3d)":"var(--invalid-color, #b42318)";}
    else{delete result.dataset.patternTestTreatment;result.style.removeProperty("color");}
  };
  pattern.addEventListener("input",render);sample.addEventListener("input",render);host.append(patternLabel,sampleLabel,guidance,resultRegion);render();return host;
}
