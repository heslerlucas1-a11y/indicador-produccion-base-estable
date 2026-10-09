/* Local, deterministic PNG reports. No data is sent to a third party. */
(() => {
  'use strict';
  const blue='#1268e8', teal='#10aeb7', navy='#092b50', green='#13833e', red='#cf343d';
  const num=(n,d=0)=>Number.isFinite(n)?n.toLocaleString('es-AR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
  const pct=(n,d=1)=>Number.isFinite(n)?`${num(n,d)}%`:'—';
  function sheet(title,period,height=1560){
    const canvas=document.createElement('canvas');canvas.width=1440;canvas.height=height;
    const c=canvas.getContext('2d');
    function box(x,y,w,h,color='#fff',r=20){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
    function text(s,x,y,size=28,color=navy,width=1300,align='left'){
      c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';
      do{c.font=`700 ${size--}px Arial, sans-serif`;}while(c.measureText(String(s)).width>width&&size>12);
      c.fillText(String(s),x,y);
    }
    const gradient=c.createLinearGradient(0,0,1440,230);gradient.addColorStop(0,'#062443');gradient.addColorStop(1,'#10578b');
    box(0,0,1440,height,'#eaf2f8',0);box(0,0,1440,230,gradient,0);
    text('BERESHIT',48,48,30,'#fff');text('PRODUCCIÓN Y DATOS PARA DECISIONES',1392,48,20,'#b9deef',700,'right');
    text(title,48,120,52,'#fff');text(period,48,186,28,'#d7edff');box(48,224,140,6,teal,3);
    box(0,height-150,1440,150,gradient,0);
    text('Medir para mejorar. Mejorar para crecer.',720,height-94,36,'#fff',1300,'center');
    text('DATOS CARGADOS · REPORTE PARA COMPARTIR',720,height-40,21,'#b9deef',1300,'center');
    return {canvas,box,text};
  }
  function renderDowntime(data){
    if(!data?.rows?.length)throw new Error('Primero cargá los datos de tiempos muertos.');
    const last=data.rows[data.rows.length-1];
    const sectors=[...data.sectorSummary].sort((a,b)=>b.minutes-a.minutes);
    const h=Math.max(1540,800+sectors.length*66);
    const {canvas,box,text}=sheet('REPORTE DE TIEMPOS MUERTOS',`${data.rows[0].date} — ${last.date} · ${data.rows.length} días con datos`,h);
    const over=sectors.filter(s=>s.target>0&&s.percent>s.target).length;
    const kpis=[['TIEMPO MUERTO',pct(data.totalPercent),`Meta general: ${pct(data.targetPercent)}`,data.totalPercent>data.targetPercent?red:green],
      ['MINUTOS ACUMULADOS',num(data.totalMinutes),`${num(data.totalMinutes/60,1)} horas perdidas`,blue],
      ['PROMEDIO DIARIO',`${num(data.totalMinutes/data.rows.length,1)} min`,`Meta: ${num(data.targetMinutes)} min/día`,data.totalMinutes/data.rows.length>data.targetMinutes?red:green],
      ['SECTORES SOBRE META',`${over} de ${sectors.length}`,'Comparación porcentual',over?red:green]];
    kpis.forEach(([label,value,note,color],i)=>{const x=24+i*350;box(x,254,338,156);text(label,x+20,285,19,navy,300);text(value,x+20,335,40,color,300);text(note,x+20,381,20,'#55718c',300);});
    box(24,430,1392,172);text('DÓNDE SE CONCENTRA EL TIEMPO PERDIDO',48,468,28);
    const top=sectors[0];
    text(top&&top.minutes>0?`${top.name} · ${num(top.minutes)} minutos`:'Sin minutos perdidos registrados',48,519,38,blue,900);
    const sectorTotal=sectors.reduce((sum,s)=>sum+s.minutes,0);
    text(top&&sectorTotal>0?`${pct(top.minutes/sectorTotal*100)} de los minutos por sector`:'Sin participación para calcular',48,565,23,'#55718c',900);
    text('ÚLTIMO DÍA',1378,470,20,navy,340,'right');text(last.date,1378,512,28,navy,340,'right');text(`${num(last.totalMinutes)} min · ${pct(last.totalPercent)}`,1378,560,27,blue,340,'right');
    box(24,622,1392,h-800);text('SECTORES · ORDENADOS POR MINUTOS PERDIDOS',48,661,29);
    text('SECTOR / MINUTOS',48,706,18,'#55718c');text('ACUMULADO',950,706,18,'#55718c',170,'right');text('META',1140,706,18,'#55718c',160,'right');text('ESTADO',1375,706,18,'#55718c',200,'right');
    sectors.forEach((s,i)=>{const y=750+i*66;const status=s.target>0?(s.percent>s.target?'SOBRE META':'EN META'):'SIN META';const color=s.target>0?(s.percent>s.target?red:green):'#64748b';
      text(s.name,48,y,25,navy,245);box(310,y-8,290,16,'#e0eaf4',8);if(s.minutes>0)box(310,y-8,290*s.minutes/Math.max(1,top.minutes),16,i===0?teal:blue,8);
      text(`${num(s.minutes)} min`,765,y,24,blue,150,'right');text(pct(s.percent,2),950,y,25,navy,170,'right');text(s.target>0?pct(s.target,2):'—',1140,y,25,navy,170,'right');text(status,1375,y,19,color,210,'right');
    });
    text('Porcentaje acumulado = minutos perdidos / tiempo disponible. Menor es mejor.',48,h-205,21,'#55718c');
    return canvas;
  }
  function shiftSummary(rows){
    return [...new Set(rows.map(r=>r.supervisor))].slice(0,2).map(name=>{
      const own=rows.filter(r=>r.supervisor===name&&r.worked);
      const sum=key=>own.reduce((n,r)=>n+(Number(r[key])||0),0);
      const production=sum('production'),hours=sum('ttd'),dead=sum('tmd'),effective=Math.max(0,hours-dead);
      return {name,production,shifts:own.length,hours,dead,effective,perShift:own.length?production/own.length:null,perHour:effective>0?production/effective:null};
    });
  }
  function renderShifts(rows){
    if(!rows?.length)throw new Error('Primero cargá los datos de comparación de turnos.');
    const items=shiftSummary(rows);
    const dates=[...new Set(rows.map(r=>r.date))].sort((a,b)=>a.split('/').reverse().join('-').localeCompare(b.split('/').reverse().join('-')));
    const last=dates[dates.length-1];
    const {canvas,box,text}=sheet('COMPARACIÓN DE TURNOS',`${dates[0]} — ${last} · ${dates.length} días con datos`,1550);
    items.forEach((s,i)=>{const x=24+i*704,color=i?teal:blue;box(x,254,688,536);box(x+22,276,7,74,color,3);text(s.name,x+48,303,38,navy,605);text(`${num(s.production)} p²`,x+48,363,48,color,605);
      const metrics=[['Turnos trabajados',num(s.shifts)],['Horas de turno (TTD)',`${num(s.hours,1)} h`],['Horas efectivas',`${num(s.effective,1)} h`],['Tiempo muerto',`${num(s.dead,1)} h`],['Promedio por turno',`${num(s.perShift)} p²`],['Por hora efectiva',`${num(s.perHour)} p²/h`]];
      metrics.forEach(([label,value],j)=>{const xx=x+24+(j%2)*326,yy=414+Math.floor(j/2)*117;box(xx,yy,314,105,'#f0f6fc',12);text(label,xx+16,yy+27,21,'#55718c',284);text(value,xx+16,yy+69,32,color,284);});
    });
    function winner(key){if(items.length<2||items.some(s=>s[key]===null))return 'Sin comparación';return items[0][key]===items[1][key]?'Empate':items[0][key]>items[1][key]?items[0].name:items[1].name;}
    box(24,812,1392,190);text('RESULTADOS DEL PERÍODO · PROMEDIOS',48,853,29);
    text('MEJOR PROMEDIO POR TURNO',48,903,20,'#55718c',620);text(winner('perShift'),48,951,34,blue,620);
    text('MEJOR PRODUCCIÓN POR HORA EFECTIVA',752,903,20,'#55718c',620);text(winner('perHour'),752,951,34,teal,620);
    box(24,1024,1392,240);text(`ÚLTIMO DÍA · ${last}`,48,1067,30);
    const daily=items.map(s=>rows.find(r=>r.supervisor===s.name&&r.date===last));
    daily.forEach((r,i)=>{text(items[i].name,48+i*704,1123,26,navy,630);text(r?`${num(r.production)} p²`:'Sin datos',48+i*704,1175,38,i?teal:blue,630);});
    const complete=daily.length===2&&daily.every(r=>r&&Number.isFinite(r.production));
    const best=complete?(daily[0].production===daily[1].production?'Empate':daily[0].production>daily[1].production?daily[0].supervisor:daily[1].supervisor):'Sin comparación: faltan datos';
    text(`Mayor producción del día: ${best}`,48,1234,25,navy,1320);
    text('Horas efectivas = TTD − tiempo muerto. Promedios sobre turnos trabajados.',48,1308,23,'#55718c');
    text('El resultado del último día no equivale al mejor promedio del período.',48,1350,23,'#55718c');
    return canvas;
  }
  async function download(button,render,filename){
    const label=button.textContent;button.disabled=true;button.textContent='Generando imagen…';
    try{const canvas=render();const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('No se pudo generar la imagen.');
      const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename();document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    }catch(error){alert(error.message||'No se pudo generar el reporte.');}finally{button.disabled=false;button.textContent=label;}
  }
  const safeDate=s=>String(s).replace(/[^0-9-]/g,'-');
  document.getElementById('downtimeImageBtn').addEventListener('click',event=>{
    const data=getCascadeData();download(event.currentTarget,()=>renderDowntime(data),()=>`reporte_tiempos_muertos_${safeDate(data.rows[data.rows.length-1].date)}.png`);
  });
  document.getElementById('shiftImageBtn').addEventListener('click',event=>{
    const rows=getShiftComparisonRows();download(event.currentTarget,()=>renderShifts(rows),()=>`reporte_turnos_${safeDate(rows[rows.length-1].date)}.png`);
  });
  window.OperationalReports={renderDowntime,renderShifts,shiftSummary};
})();
