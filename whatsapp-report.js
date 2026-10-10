/* Deterministic report: all numbers come from the same data as the dashboard. */
(() => {
  'use strict';
  const button = document.getElementById('whatsappImageBtn');
  function renderReport(data) {
    const canvas = document.createElement('canvas');
    canvas.width = 1440; canvas.height = 1480;
    const ctx = canvas.getContext('2d');
    const navy = '#092b50', blue = '#1268e8', teal = '#13b4bc';
    const number = (v, digits = 0) => Number.isFinite(v)
      ? v.toLocaleString('es-AR', {minimumFractionDigits: digits, maximumFractionDigits: digits}) : '—';
    const pct = (v, digits = 0) => `${number(v, digits)}%`;
    function box(x, y, w, h, fill = '#fff', radius = 22) {
      ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill();
    }
    function text(value, x, y, size = 26, color = navy, align = 'left', width = 1300, weight = 700) {
      ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
      ctx.font = `${weight} ${size}px Arial, sans-serif`;
      while (ctx.measureText(String(value)).width > width && size > 14) {
        size--; ctx.font = `${weight} ${size}px Arial, sans-serif`;
      }
      ctx.fillText(String(value), x, y);
    }
    function donut(x, y, r, fraction, primary, secondary) {
      const start = -Math.PI / 2, part = Math.max(0, Math.min(1, fraction || 0));
      ctx.lineWidth = 42; ctx.strokeStyle = secondary;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
      if (part > 0) {
        ctx.strokeStyle = primary; ctx.beginPath(); ctx.arc(x, y, r, start, start + part * Math.PI * 2); ctx.stroke();
      }
    }
    const row = data.row;
    box(0, 0, 1440, 1480, '#eaf2f8', 0);
    const gradient = ctx.createLinearGradient(0, 0, 1440, 250);
    gradient.addColorStop(0, '#062443'); gradient.addColorStop(1, '#10578b');
    box(0, 0, 1440, 240, gradient, 0);
    text('BERESHIT', 48, 48, 30, '#fff');
    text('PRODUCCIÓN Y DATOS PARA DECISIONES', 1392, 48, 19, '#b9deef', 'right');
    text('REPORTE DE PRODUCCIÓN', 48, 123, 57, '#fff');
    text(`Último día cargado · ${row.date}`, 48, 191, 30, '#dbf2ff');
    box(48, 229, 130, 6, teal, 3);

    box(24, 266, 688, 468); box(728, 266, 688, 468);
    text('CUMPLIMIENTO MENSUAL', 48, 308, 29);
    donut(195, 498, 119, data.production / data.goal, blue, '#e0eaf4');
    text(pct(data.production / data.goal * 100), 195, 497, 57, navy, 'center', 190);
    text('de la meta', 195, 545, 21, '#57728d', 'center', 190, 400);
    const remaining = Math.max(0, data.goal - data.production);
    const stats = [
      ['Meta mensual', `${number(data.goal)} p²`, '#edf5fc', blue],
      ['Producción total', `${number(data.production)} p²`, '#edf5fc', blue],
      ['Días hábiles restantes', number(data.days), '#fff3cd', '#a05c00'],
      ['Necesario por día', data.days > 0 ? `${number(remaining / data.days)} p²` : remaining === 0 ? 'Meta cumplida' : 'Sin días disponibles', '#def5ec', '#087447']
    ];
    stats.forEach(([label, value, bg, color], i) => {
      box(354, 351 + i * 87, 334, 77, bg, 14);
      text(label, 370, 373 + i * 87, 21, '#42617d');
      text(value, 370, 405 + i * 87, 30, color, 'left', 302);
    });
    text('PRODUCCIÓN POR TURNO', 752, 308, 29);
    const shifts = row.shift1 + row.shift2;
    donut(914, 503, 119, shifts > 0 ? row.shift1 / shifts : 0, blue, shifts > 0 ? teal : '#e0eaf4');
    text(`${number(row.production)} p²`, 914, 497, 32, navy, 'center', 189);
    text('TOTAL', 914, 537, 21, '#57728d', 'center');
    [[row.shift1, 'Turno 1', blue], [row.shift2, 'Turno 2', teal]].forEach(([value, label, color], i) => {
      box(1080, 409 + i * 137, 12, 84, color, 6);
      text(label, 1110, 430 + i * 137, 25, navy);
      text(`${number(value)} p²`, 1110, 477 + i * 137, 34, color, 'left', 280);
    });
    text('Total oficial de producción del día', 1072, 682, 20, '#57728d', 'center', 600, 400);

    box(24, 754, 1392, 478);
    text('EFICIENCIA Y DESEMPEÑO DEL DÍA', 48, 799, 30);
    text(row.date, 1390, 799, 25, '#57728d', 'right');
    const metrics = [
      ['FU', pct(row.fu), '#13833e'], ['FO', pct(row.fo), '#13833e'],
      ['GAP', `${number(row.gap, 2)} m`, blue], ['Ritmo', pct(row.rhythm), blue],
      ['P²/h real', number(row.p2h), blue], ['P²/Tn', number(row.p2tn), blue],
      ['Δ P²/Tn', pct(row.deltaP2tn, 1), row.deltaP2tn < 0 ? '#d52732' : '#13833e'],
      ['Real m³/m³', pct(row.realM3), blue], ['Total de tablas', number(data.tables), blue],
      ['Tablas negras', number(data.black), '#a65305', data.tables > 0 ? `${pct(data.black / data.tables * 100, 1)} del total` : 'Sin total disponible'],
      ['Cierre parcial', number(data.partial), blue]
    ];
    metrics.forEach(([label, value, color, note], i) => {
      const line = i < 6 ? 0 : 1, col = i < 6 ? i : i - 6;
      const width = line === 0 ? 220 : 266;
      const x = 48 + col * (width + 5), y = 847 + line * 182;
      box(x, y, width, 162, '#f1f6fb', 12);
      text(label, x + width / 2, y + 35, 24, '#42617d', 'center', width - 18);
      text(value, x + width / 2, y + 88, 39, color, 'center', width - 18);
      if (note) text(note, x + width / 2, y + 132, 20, color, 'center', width - 16);
    });
    box(0, 1256, 1440, 224, gradient, 0);
    text('Disciplina hoy, mejores resultados mañana.', 720, 1327, 39, '#fff', 'center');
    box(615, 1364, 210, 5, teal, 2);
    text('TRABAJO EN EQUIPO  ·  DATOS PARA DECIDIR  ·  PRODUCCIÓN SUSTENTABLE', 720, 1416, 22, '#b9deef', 'center');
    return canvas;
  }
  // Kept separate from acquisition so the graphic can be tested with fixture data.
  window.renderWhatsAppProductionReport = renderReport;
  button.addEventListener('click', async () => {
    const original = button.textContent;
    button.disabled = true; button.textContent = 'Generando imagen…';
    try {
      const rows = getRollProductionRows();
      if (!rows.length) throw new Error('Primero cargá los datos de producción.');
      const row = rows[rows.length - 1];
      const data = {
        row, goal: getMonthlyProductionGoal(row.date),
        production: getRollProductionSummary()?.totalProduction || sumRollMetric(rows, 'production'),
        days: Math.max(0, Math.trunc(normalizeNumber(readSheetCell('AA2')))),
        tables: normalizeRollThousands(readMetric('totalTablas')),
        black: normalizeRollThousands(readMetric('tablasNegras')),
        partial: normalizeNumber(readSheetCell('AB2'))
      };
      const canvas = renderReport(data);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('No se pudo generar la imagen. Intentá nuevamente.');
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = `reporte_produccion_${String(row.date).replace(/[^0-9-]/g, '-')}.png`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error('Reporte para WhatsApp:', error);
      alert(error.message || 'No se pudo generar el reporte.');
    } finally {
      button.disabled = false; button.textContent = original;
    }
  });
})();
