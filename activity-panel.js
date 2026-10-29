/* Private activity: fetched on demand, never persisted to local/session storage. */
(() => {
  const panel=document.createElement('section');
  panel.id='activityView'; panel.className='rolls-view'; panel.hidden=true;
  panel.innerHTML=`<div class="rolls-header"><div><h2>Actividad de usuarios</h2><p>CONTROL DE ACCESOS · SOLO ADMINISTRADORES</p></div><button type="button" class="btn" id="activityRefresh">Actualizar resumen</button></div>
    <div class="activity-filters"><label>Desde<input id="activityFrom" type="date"></label><label>Hasta<input id="activityTo" type="date"></label><label>Usuario<select id="activityUser"><option value="">Todos los usuarios</option></select></label></div>
    <p id="activityStatus" role="status" aria-live="polite"></p><div id="activityResults"></div>`;
  document.getElementById('rollsView').before(panel);
  const style=document.createElement('style');
  style.textContent=`#activityView{font-family:Arial,sans-serif;color:#153653}#activityView[hidden]{display:none!important}#activityView p{font-size:13px;line-height:1.6}#activityView .activity-filters{display:flex;gap:16px;flex-wrap:wrap;background:#fff;padding:18px;border:1px solid #d4e2ef;border-radius:12px}.activity-filters label{display:grid;gap:7px;font-size:12px;font-weight:bold;flex:1;min-width:150px}.activity-filters input,.activity-filters select{box-sizing:border-box;width:100%;background:#f4f8fc;color:#153653;border:1px solid #bccfe0;border-radius:6px;padding:11px;font:inherit}.activity-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:18px 0}.activity-card{background:white;border:1px solid #d4e2ef;border-top:3px solid #20a4b7;border-radius:10px;padding:18px}.activity-card span{font-size:12px;display:block}.activity-card strong{display:block;font-size:30px;margin-top:10px;color:#075898}.activity-block{background:white;border:1px solid #d4e2ef;border-radius:12px;padding:18px;margin:16px 0}.activity-block h3{margin:0 0 14px;font-size:16px}.activity-scroll{overflow-x:auto;max-height:520px}.activity-table{width:100%;border-collapse:collapse;font-size:13px;text-align:left}.activity-table th{background:#133d60;color:white;position:sticky;top:0}.activity-table td,.activity-table th{padding:12px;border-bottom:1px solid #e0eaf2;white-space:nowrap}.activity-table tr:nth-child(even){background:#f4f8fc}.activity-warning{padding:14px;background:#fff5d9;border-left:4px solid #eaa229;border-radius:6px}.activity-empty{color:#62788b}.activity-bar{display:inline-block;height:8px;background:#18a8b8;border-radius:5px;margin-right:10px;vertical-align:middle}#activityStatus[data-error="true"]{color:#a32828}@media(max-width:700px){.activity-cards{grid-template-columns:repeat(2,minmax(0,1fr))}.activity-card{padding:12px}.activity-card strong{font-size:26px}.activity-block{padding:12px}#activityView .rolls-header{flex-wrap:wrap;gap:12px}.industrial-toolbar .view-btn:last-child{grid-column:auto}.industrial-toolbar:has(#viewActivityBtn[style*="none"]) #viewFullTableBtn{grid-column:1/-1}}`;
  document.head.append(style);
  const el=id=>document.getElementById(id);
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date=d=>String(d).replace(/^(\d{4})-(\d{2})-(\d{2})/,'$3/$2/$1');
  const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  let data=null, request=0, controller=null;
  function clear(){request++;controller?.abort();controller=null;data=null;panel.hidden=true;el('activityResults').replaceChildren();el('activityStatus').textContent='';el('activityUser').innerHTML='<option value="">Todos los usuarios</option>';el('activityRefresh').disabled=false;}
  const table=(heads,rows)=>`<div class="activity-scroll"><table class="activity-table"><thead><tr>${heads.map(h=>`<th scope="col">${escape(h)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${r.map(c=>`<td>${escape(c)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${heads.length}" class="activity-empty">Sin registros en el período seleccionado.</td></tr>`}</tbody></table></div>`;
  function render(){
    if(!data||currentUser?.role!=='admin')return clear();
    const chosen=el('activityUser').value, users=data.users.filter(u=>!chosen||u.name===chosen);
    const active=users.filter(u=>u.registered&&u.active);
    const total=users.reduce((n,u)=>n+u.logins,0), failed=users.reduce((n,u)=>n+u.failed,0);
    const noLogin=active.filter(u=>!u.logins);
    const events=data.events.filter(e=>!chosen||e.user.toLowerCase()===chosen.toLowerCase());
    const days=[];
    for(let d=new Date(data.from+'T12:00:00Z');d.toISOString().slice(0,10)<=data.to;d.setUTCDate(d.getUTCDate()+1)){
      const key=d.toISOString().slice(0,10), found=data.daily.find(x=>x.day===key);
      days.push([date(key),chosen?(users[0]?.days[key]||0):(found?.logins||0)]);
    }
    const kind={login:'Ingreso confirmado',legacy:'Ingreso histórico*',failed:'Acceso fallido',other:'Otro movimiento'};
    el('activityResults').innerHTML=`${data.legacy?`<p class="activity-warning">${data.legacy} ingresos históricos en este período pueden incluir validaciones internas. No es posible reconstruir con certeza las visitas antiguas. Los nuevos ingresos se registran por separado.</p>`:''}
      ${data.invalidDates?`<p class="activity-warning">Hay ${data.invalidDates} registros con fecha no reconocida en Logs; no se incluyeron.</p>`:''}
      <div class="activity-cards">${[['Ingresos registrados',total],['Usuarios con ingresos',users.filter(u=>u.logins>0).length],['Activos sin ingreso',noLogin.length],['Accesos fallidos',failed]].map(([name,n])=>`<div class="activity-card"><span>${name}</span><strong>${n}</strong></div>`).join('')}</div>
      <div class="activity-block"><h3>Resumen por usuario</h3>${table(['Usuario','Estado actual','Ingresos','Históricos*','Días con ingreso','Último ingreso del período','Fallidos'],users.map(u=>[u.name,u.registered?(u.active?'Activo':'Inactivo'):'Fuera del padrón',u.logins,u.legacy,Object.keys(u.days).length,u.last?date(u.last):'Sin ingreso',u.failed]))}</div>
      <div class="activity-block"><h3>Usuarios activos sin ingreso registrado</h3><p>${noLogin.length?noLogin.map(u=>escape(u.name)).join(' · '):'Ninguno en la selección actual.'}</p><p class="activity-empty">No indica ausencia ni falta de trabajo: un usuario puede seguir usando una sesión abierta. No mide tiempo de permanencia.</p></div>
      <div class="activity-block"><h3>Ingresos por día</h3>${table(['Fecha','Ingresos registrados'],days)}</div>
      <div class="activity-block"><h3>Últimos movimientos</h3><p>Se muestran hasta 300 movimientos recientes del período; los totales incluyen todo el período. ${data.eventCount} movimientos en total. El filtro de usuario aplica sobre esta lista reciente.</p>${table(['Fecha y hora','Usuario','Tipo','Acción'],events.map(e=>[date(e.at),e.user,kind[e.kind]||e.kind,e.action]))}</div>
      <p class="activity-empty">Período: ${date(data.from)} al ${date(data.to)} · Zona horaria: ${escape(data.timezone)}. Usuarios sin ingreso: padrón activo actual. Los accesos fallidos no prueban quién realizó el intento.</p>`;
  }
  async function refresh(){
    if(currentUser?.role!=='admin')return clear();
    const from=el('activityFrom').value,to=el('activityTo').value;
    if(!from||!to||from>to||(Date.parse(to)-Date.parse(from))/86400000>92){el('activityStatus').textContent='Elegí un período válido de hasta 93 días.';el('activityStatus').dataset.error='true';return;}
    const id=++request, user=currentUser; controller?.abort();controller=new AbortController();const signal=controller.signal;
    data=null;el('activityResults').replaceChildren();el('activityRefresh').disabled=true;el('activityStatus').dataset.error='false';el('activityStatus').textContent='Leyendo registros protegidos…';
    const timeout=setTimeout(()=>controller?.abort(),45000);
    try{
      // Simple POST avoids passwords in URLs and preflight; never fall back to a public sheet.
      const res=await fetch(getWebAppUrl(),{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'getActivity',payload:{username:user.username,password:user.password,from,to}}),signal,credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});
      const result=await res.json();
      if(id!==request||currentUser!==user||currentUser?.role!=='admin')return;
      if(result.status!=='ok'||!Array.isArray(result.users))throw new Error(result.message||'El servidor todavía no tiene habilitada la consulta de actividad.');
      data=result;const previous=el('activityUser').value;
      el('activityUser').innerHTML='<option value="">Todos los usuarios</option>'+data.users.map(u=>`<option value="${escape(u.name)}">${escape(u.name)}</option>`).join('');
      if(data.users.some(u=>u.name===previous))el('activityUser').value=previous;
      render();el('activityStatus').textContent=`Resumen actualizado · ${date(from)} al ${date(to)}`;
    }catch(error){if(id===request){el('activityStatus').dataset.error='true';el('activityStatus').textContent=error.name==='AbortError'?'La consulta demoró demasiado. Intentá actualizar nuevamente.':`No se pudo leer la actividad: ${error.message}`;}}
    finally{clearTimeout(timeout);if(id===request)el('activityRefresh').disabled=false;}
  }
  function open(){if(currentUser?.role!=='admin')return clear();panel.hidden=false;if(!el('activityFrom').value){el('activityTo').value=today();el('activityFrom').value=today().slice(0,8)+'01';}if(!data)refresh();}
  el('activityRefresh').onclick=refresh;el('activityUser').onchange=render;
  el('viewActivityBtn').onclick=()=>showAppView('activity');
  window.ActivityPanel={open,clear};
})();
