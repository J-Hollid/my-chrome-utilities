// Local mockup behavior. No extension APIs, network calls, or persistent writes.
const $=selector=>document.querySelector(selector);
function notice(message){const host=$('.prototype-status');if(host)host.textContent=message;}
document.querySelectorAll('[data-demo]').forEach(control=>control.addEventListener('click',event=>{event.preventDefault();notice(control.dataset.demo);}));
$('#choose-page')?.addEventListener('click',()=>{
  $('#choose-page').textContent='shop.example/checkout · Change';
  $('#source-state').textContent='✓ Page access available · dataLayer found';
  $('#start-capture').disabled=false;$('#start-capture').classList.add('primary');
  $('#capture-state').textContent='Ready';
});
$('#start-capture')?.addEventListener('click',()=>{
  $('#capture-setup').hidden=true;$('#captured-events').hidden=false;
  $('#capture-state').textContent='Capturing';notice('Sample events loaded. No website is connected.');
});
$('#pause-capture')?.addEventListener('click',()=>{
  const paused=$('#capture-state').textContent==='Paused';
  $('#capture-state').textContent=paused?'Capturing':'Paused';$('#pause-capture').textContent=paused?'Pause capture':'Resume capture';
});
$('#toggle-library')?.addEventListener('click',()=>{
  const populated=$('#library-populated').hidden;
  $('#library-populated').hidden=!populated;$('#library-empty').hidden=populated;
  $('#toggle-library').textContent=populated?'Show empty example':'Show populated example';
});
$('#library-search')?.addEventListener('input',event=>{
  document.querySelectorAll('[data-record]').forEach(row=>row.hidden=!row.dataset.record.includes(event.target.value.toLowerCase()));
});
function checkPattern(){try{const valid=new RegExp($('#rule-pattern').value).test($('#rule-value').value);$('#rule-result').textContent=valid?'✓ Matches the pattern':'! Does not match the pattern';$('#rule-result').className=valid?'good':'error';}catch{$('#rule-result').textContent='! Check the pattern syntax';$('#rule-result').className='error';}}
$('#rule-value')?.addEventListener('input',checkPattern);$('#rule-pattern')?.addEventListener('input',checkPattern);
document.querySelectorAll('[data-theme-input]').forEach(input=>input.addEventListener('input',()=>{$('#theme-status').textContent='Unsaved changes';$('#preview-status').textContent='Preview is out of date';}));
function refreshTheme(){
  const color=$('#heading-color').value;
  if(!/^#[0-9a-f]{6}$/i.test(color)){notice('Enter a six-digit hex color, for example #0b3155.');return false;}
  $('#document-preview h2').style.color=color;$('#document-preview').style.borderTopColor=color;
  $('#document-preview').style.fontFamily=document.querySelector('select[data-theme-input]').value;
  $('#document-preview').querySelectorAll('tbody tr').forEach((row,index)=>row.style.background=$('#table-stripes').checked&&index%2?'#f1e9d5':'transparent');
  $('#document-preview').querySelectorAll('td').forEach(cell=>cell.style.padding=$('#table-density').value==='Compact'?'8px':'14px 12px');
  $('#preview-status').textContent='Preview is current';return true;
}
$('#refresh-preview')?.addEventListener('click',refreshTheme);
$('#save-theme')?.addEventListener('click',()=>{if(refreshTheme()){$('#theme-status').textContent='Theme saved';notice('Mockup only: settings are kept until this page closes.');}});
$('#shortcut-search')?.addEventListener('input',event=>document.querySelectorAll('[data-shortcut]').forEach(row=>row.hidden=!row.dataset.shortcut.includes(event.target.value.toLowerCase())));
$('#record-shortcut')?.addEventListener('click',()=>{$('#shortcut-recorder').hidden=false;$('#shortcut-input').focus();});
$('#shortcut-input')?.addEventListener('keydown',event=>{
  if(event.key==='Tab')return;
  event.preventDefault();if(['Control','Alt','Shift','Meta'].includes(event.key))return;
  const value=[event.ctrlKey?'Ctrl':'',event.altKey?'Alt':'',event.shiftKey?'Shift':'',event.key.toUpperCase()].filter(Boolean).join(' ');
  $('#shortcut-input').value=value;
  const valid=(event.ctrlKey||event.altKey)&&!['Ctrl L','Ctrl W','Ctrl T'].includes(value);
  $('#shortcut-message').textContent=valid?'✓ Sample check passed. Confirm browser and focus conflicts before product use.':'! Use a modifier and avoid browser-reserved commands.';
  $('#save-shortcut').disabled=!valid;
});
$('#save-shortcut')?.addEventListener('click',()=>{$('[data-shortcut="start capture"] .badge').textContent=$('#shortcut-input').value;$('#shortcut-recorder').hidden=true;notice('Mockup only: shortcut saved for this preview.');});
$('#cancel-shortcut')?.addEventListener('click',()=>{$('#shortcut-recorder').hidden=true;$('#record-shortcut').focus();});
$('#tealium-target')?.addEventListener('click',()=>{$('#tealium-setup').hidden=true;$('#tealium-ready').hidden=false;});
$('#tealium-start')?.addEventListener('click',()=>{const observing=$('#tealium-state').textContent==='Observing';$('#tealium-results').hidden=false;$('#tealium-state').textContent=observing?'Paused':'Observing';$('#tealium-start').textContent=observing?'Resume observation':'Pause observation';notice('Sample inventory only. No website is connected.');});
$('#command-search')?.addEventListener('input',event=>document.querySelectorAll('[data-command]').forEach(row=>row.hidden=!row.dataset.command.includes(event.target.value.toLowerCase())));
