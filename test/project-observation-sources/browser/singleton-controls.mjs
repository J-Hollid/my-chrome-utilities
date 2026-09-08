/** Keeps the older transport contract on the installed singleton-source controls. */
export function singletonObservationControls(until) {
  const path=()=>document.querySelector('.observation-source-row code')?.textContent??'';
  const ready=expected=>until(()=>path()===expected,'singleton source '+expected);
  async function edit(value) {
    const row=document.querySelector('.observation-source-row');
    [...row.querySelectorAll('button')].find(button=>button.textContent==='Edit').click();
    const input=document.querySelector('#observation-source-path');input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));
    document.querySelector('#save-observation-source').click();
    await until(()=>!document.querySelector('#observation-source-path')&&path()===value,'saved singleton source path');
  }
  return {path,ready,edit};
}
