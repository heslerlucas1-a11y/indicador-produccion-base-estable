(() => {
  const bar=document.querySelector('.industrial-toolbar');
  if(!bar)return;
  const main=bar.querySelector('.industrial-main');
  const account=bar.querySelector('.industrial-account');
  const actions=bar.querySelector('.industrial-actions');
  account.id='mobileAccountTools';actions.id='mobileDataTools';
  const button=document.createElement('button');
  button.type='button';button.className='btn mobile-tools-toggle';
  button.setAttribute('aria-controls',`${account.id} ${actions.id}`);
  function setOpen(open){
    bar.classList.toggle('mobile-tools-open',open);
    button.setAttribute('aria-expanded',String(open));
    button.textContent=open?'Cerrar ✕':'Herramientas ☰';
  }
  button.addEventListener('click',()=>setOpen(!bar.classList.contains('mobile-tools-open')));
  main.querySelector('.industrial-brand').after(button);
  bar.classList.add('mobile-tools-ready');setOpen(false);
  bar.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&bar.classList.contains('mobile-tools-open')){setOpen(false);button.focus();}
  });
  bar.querySelector('.view-switch').addEventListener('click',event=>{
    if(event.target.closest('.view-btn'))setOpen(false);
  });
  window.matchMedia('(max-width:700px)').addEventListener('change',()=>setOpen(false));
})();
