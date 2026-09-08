/** Wait for the same live control across renders before sending a UI action. */
export async function waitForSettledControl(read,label,pause=()=>new Promise(resolve=>setTimeout(resolve,35))) {
  let previous,stable=0;
  for(let attempt=0;attempt<300;attempt++) {
    const control=read();
    const ready=control?.isConnected&&!control.disabled&&!control.closest?.('[aria-busy="true"]');
    stable=ready&&control===previous?stable+1:0;
    if(stable>=5)return control;
    previous=control;await pause();
  }
  throw new Error('Control did not settle: '+label);
}
