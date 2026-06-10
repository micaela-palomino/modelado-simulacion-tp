/**
 * charts.js — Todos los gráficos del dashboard
 *
 * graficoInfectados : infectados + recuperados por ciudad
 * graficoSanos      : sanos por ciudad
 * graficoFase       : diagrama de fase (S vs I) con gradiente temporal
 */

let graficoInfectados = null;
let graficoSanos      = null;
let graficoFase       = null;

const faseAnimacion = {
  diaMin: 0,
  diaMax: 365,
  diaActual: 0,
  velocidad: 1,
  reproduciendo: false,
  rafId: null,
  ultimoFrame: 0,
  diasPorSegundo: 18,
  ciudadesActivas: []
};

// ══════════════════════════════════════════════════════════════
// UTILIDADES DE COLOR
// ══════════════════════════════════════════════════════════════

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  ];
}
function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

/**
 * Interpola entre colorSanos (inicio) → color (pico) → colorRecuperados (final).
 * Para La Matanza eso es azul → rojo → verde — la progresión temporal del sistema.
 */
function interpolarColorFase(t, tPico, ciudad) {
  const c1 = hexToRgb(ciudad.colorSanos);
  const c2 = hexToRgb(ciudad.color);
  const c3 = hexToRgb(ciudad.colorRecuperados);
  let r, g, b;
  if (t <= tPico) {
    const tt = tPico > 0 ? t / tPico : 0;
    r = lerp(c1[0], c2[0], tt);
    g = lerp(c1[1], c2[1], tt);
    b = lerp(c1[2], c2[2], tt);
  } else {
    const tt = tPico < 1 ? (t - tPico) / (1 - tPico) : 1;
    r = lerp(c2[0], c3[0], tt);
    g = lerp(c2[1], c3[1], tt);
    b = lerp(c2[2], c3[2], tt);
  }
  return `rgb(${r},${g},${b})`;
}

// ══════════════════════════════════════════════════════════════
// PLUGIN: línea vertical punteada en el pico (graficoInfectados)
// ══════════════════════════════════════════════════════════════

const pluginLineaPico = {
  id: 'lineaPico',
  afterDatasetsDraw(chart) {
    const opts = chart.options.plugins?.lineaPico;
    if (!opts?.diaPico) return;

    const ctx  = chart.ctx;
    const xEje = chart.scales.x;
    const yEje = chart.scales.y;
    const xPix = xEje.getPixelForValue(opts.diaPico);

    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = 'rgba(180, 40, 40, 0.75)';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(xPix, yEje.top);
    ctx.lineTo(xPix, yEje.bottom);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.font      = 'bold 11px Segoe UI, sans-serif';
    const texto   = `Pico: día ${opts.diaPico}`;
    const tw      = ctx.measureText(texto).width;
    ctx.fillStyle = 'rgba(231, 76, 60, 0.1)';
    ctx.beginPath();
    ctx.roundRect(xPix + 5, yEje.top + 7, tw + 10, 18, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(150, 30, 30, 0.9)';
    ctx.fillText(texto, xPix + 10, yEje.top + 19);
    ctx.restore();
  }
};

// ══════════════════════════════════════════════════════════════
// PLUGIN: diagrama de fase — trayectoria animada + etiquetas
// ══════════════════════════════════════════════════════════════

function getIndicePorDia(data, diaActual) {
  let idx = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i].dia <= diaActual) idx = i;
    else break;
  }
  return idx;
}

function dibujarSegmentosFase(ctx, xScale, yScale, data, ciudad, hastaIndice, estiloBase = false) {
  if (data.length < 2) return;

  let iPico = 0, maxI = 0;
  data.forEach((p, i) => { if (p.y > maxI) { maxI = p.y; iPico = i; } });
  const tPico = iPico / (data.length - 1);
  const limite = Math.min(hastaIndice, data.length - 2);

  for (let i = 0; i <= limite; i++) {
    const t  = i / (data.length - 1);
    const x1 = xScale.getPixelForValue(data[i].x);
    const y1 = yScale.getPixelForValue(data[i].y);
    const x2 = xScale.getPixelForValue(data[i + 1].x);
    const y2 = yScale.getPixelForValue(data[i + 1].y);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = estiloBase ? 'rgba(44, 62, 80, 0.12)' : interpolarColorFase(t, tPico, ciudad);
    ctx.lineWidth   = estiloBase ? 1.4 : 3;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';
    ctx.stroke();
  }
}

function dibujarCampoVectorial(ctx, chart, ciudad) {
  if (!ciudad?.params) return;

  const xScale = chart.scales.x;
  const yScale = chart.scales.y;
  const { left, top, width, height } = chart.chartArea;
  const p = ciudad.params;
  const columnas = 12;
  const filas = 8;
  const largo = 13;

  ctx.save();
  ctx.strokeStyle = 'rgba(44, 62, 80, 0.18)';
  ctx.fillStyle = 'rgba(44, 62, 80, 0.18)';
  ctx.lineWidth = 1;

  for (let ix = 1; ix < columnas; ix++) {
    for (let iy = 1; iy < filas; iy++) {
      const s = xScale.min + (xScale.max - xScale.min) * (ix / columnas);
      const i = yScale.min + (yScale.max - yScale.min) * (iy / filas);
      const dS = p.alpha.valor * s - p.beta.valor * s * i;
      const dI = p.delta.valor * s * i - p.gamma.valor * i;

      const px = xScale.getPixelForValue(s);
      const py = yScale.getPixelForValue(i);
      const px2 = xScale.getPixelForValue(s + dS);
      const py2 = yScale.getPixelForValue(i + dI);
      const ang = Math.atan2(py2 - py, px2 - px);

      if (!Number.isFinite(ang)) continue;

      const x1 = px - Math.cos(ang) * largo * 0.45;
      const y1 = py - Math.sin(ang) * largo * 0.45;
      const x2 = px + Math.cos(ang) * largo * 0.45;
      const y2 = py + Math.sin(ang) * largo * 0.45;

      if (x2 < left || x2 > left + width || y2 < top || y2 > top + height) continue;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.save();
      ctx.translate(x2, y2);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-4, -2.5);
      ctx.lineTo(-4, 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
}

function dibujarNulclinas(ctx, chart, ciudad) {
  if (!ciudad?.params) return;

  const xScale = chart.scales.x;
  const yScale = chart.scales.y;
  const { left, top, width, height } = chart.chartArea;
  const sEq = ciudad.params.gamma.valor / ciudad.params.delta.valor;
  const iEq = ciudad.params.alpha.valor / ciudad.params.beta.valor;
  const xEq = xScale.getPixelForValue(sEq);
  const yEq = yScale.getPixelForValue(iEq);

  ctx.save();
  ctx.setLineDash([7, 5]);
  ctx.lineWidth = 1.4;
  ctx.font = 'bold 10px Segoe UI, sans-serif';

  if (xEq >= left && xEq <= left + width) {
    ctx.strokeStyle = 'rgba(52, 152, 219, 0.62)';
    ctx.beginPath();
    ctx.moveTo(xEq, top);
    ctx.lineTo(xEq, top + height);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.roundRect(xEq + 7, top + 28, 76, 18, 4);
    ctx.fill();
    ctx.fillStyle = '#2c78a8';
    ctx.fillText('dI/dt = 0', xEq + 12, top + 41);
    ctx.setLineDash([7, 5]);
  }

  if (yEq >= top && yEq <= top + height) {
    ctx.strokeStyle = 'rgba(231, 76, 60, 0.62)';
    ctx.beginPath();
    ctx.moveTo(left, yEq);
    ctx.lineTo(left + width, yEq);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.roundRect(left + 12, yEq - 25, 76, 18, 4);
    ctx.fill();
    ctx.fillStyle = '#b83f33';
    ctx.fillText('dS/dt = 0', left + 17, yEq - 12);
  }

  ctx.restore();
}

function dibujarEjesCartesianas(ctx, chart) {
  const xScale = chart.scales.x;
  const yScale = chart.scales.y;
  const { left, top, width, height } = chart.chartArea;
  const x0 = xScale.getPixelForValue(0);
  const y0 = yScale.getPixelForValue(0);

  ctx.save();
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = 'rgba(44, 62, 80, 0.46)';
  ctx.fillStyle = 'rgba(44, 62, 80, 0.72)';
  ctx.font = 'bold 10px Segoe UI, sans-serif';

  if (x0 >= left && x0 <= left + width) {
    ctx.beginPath();
    ctx.moveTo(x0, top);
    ctx.lineTo(x0, top + height);
    ctx.stroke();
    ctx.fillText('S = 0', x0 + 8, top + height - 10);
  }

  if (y0 >= top && y0 <= top + height) {
    ctx.beginPath();
    ctx.moveTo(left, y0);
    ctx.lineTo(left + width, y0);
    ctx.stroke();
    ctx.fillText('I = 0', left + 10, y0 - 8);
  }

  ctx.restore();
}

const pluginFase = {
  id: 'fase',

  // Se dibuja ANTES que los datasets para que los marcadores queden encima
  beforeDatasetsDraw(chart) {
    if (!chart.options.plugins?.fase?.activo) return;

    const ctx    = chart.ctx;
    const xScale = chart.scales.x;
    const yScale = chart.scales.y;
    const { left, top, width, height } = chart.chartArea;

    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, width, height);
    ctx.clip();

    dibujarEjesCartesianas(ctx, chart);

    const primeraTrayectoria = chart.data.datasets.find(ds => ds._esTrayectoria);
    if (primeraTrayectoria) {
      dibujarCampoVectorial(ctx, chart, primeraTrayectoria._ciudad);
      dibujarNulclinas(ctx, chart, primeraTrayectoria._ciudad);
    }

    const opts = chart.options.plugins?.fase || {};
    const diaActual = opts.diaActual ?? Infinity;

    chart.data.datasets.forEach(ds => {
      if (!ds._esTrayectoria) return;
      const data   = ds.data;
      if (data.length < 2) return;
      const ciudad = ds._ciudad;
      const indiceActual = opts.animado ? getIndicePorDia(data, diaActual) : data.length - 1;

      dibujarSegmentosFase(ctx, xScale, yScale, data, ciudad, data.length - 2, true);
      dibujarSegmentosFase(ctx, xScale, yScale, data, ciudad, indiceActual);
    });

    ctx.restore();
  },

  // Etiquetas sobre puntos especiales, después de dibujar los datasets
  afterDatasetsDraw(chart) {
    if (!chart.options.plugins?.fase?.activo) return;

    const ctx    = chart.ctx;
    const xScale = chart.scales.x;
    const yScale = chart.scales.y;
    const { left, top, width, height } = chart.chartArea;

    // ── Etiquetas de puntos especiales ──
    ctx.save();
    ctx.font = 'bold 10px Segoe UI, sans-serif';

    chart.data.datasets.forEach(ds => {
      if (!ds._esMarker && !ds._esEquilibrio) return;
      ds.data.forEach(p => {
        if (!p.etiqueta) return;
        const px = xScale.getPixelForValue(p.x);
        const py = yScale.getPixelForValue(p.y);
        const tw = ctx.measureText(p.etiqueta).width;

        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        ctx.beginPath();
        ctx.roundRect(px + 9, py - 14, tw + 9, 17, 3);
        ctx.fill();

        ctx.fillStyle = ds._esEquilibrio ? '#2c3e50' : (ds._colorEtiqueta || '#2c3e50');
        ctx.fillText(p.etiqueta, px + 13, py - 2);
      });
    });

    ctx.restore();

    // ── Flechas de dirección temporal ──
    // Posiciones: 20%, 40%, 60%, 80% del total de puntos.
    // Cada flecha apunta del punto i al punto i+lookahead (dirección real de la trayectoria).
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, width, height);
    ctx.clip();

    const opts = chart.options.plugins?.fase || {};
    const diaActual = opts.diaActual ?? Infinity;

    chart.data.datasets.forEach(ds => {
      if (!ds._esTrayectoria) return;
      const data = ds.data;
      if (data.length < 5) return;

      // lookahead: 3% de la longitud del CSV — da dirección clara sin saltar demasiado
      const lookahead = Math.max(2, Math.floor(data.length * 0.03));

      [0.25, 0.50, 0.75].forEach(pct => {
        const i = Math.floor(pct * (data.length - 1));
        const j = Math.min(i + lookahead, data.length - 1);
        if (i === j) return;
        if (opts.animado && data[i].dia > diaActual) return;

        const x1 = xScale.getPixelForValue(data[i].x);
        const y1 = yScale.getPixelForValue(data[i].y);
        const x2 = xScale.getPixelForValue(data[j].x);
        const y2 = yScale.getPixelForValue(data[j].y);

        // Centro del segmento = posición de la flecha
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;

        // No dibujar si el punto está fuera del área visible
        if (mx < left || mx > left + width || my < top || my > top + height) return;

        const ang = Math.atan2(y2 - y1, x2 - x1); // ángulo de la dirección de viaje
        const t   = 9; // tamaño de la punta en px

        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(ang);

        // Cabeza de flecha estilo chevron (punta + dos alas + muesca interior)
        ctx.beginPath();
        ctx.moveTo( t,       0       );  // punta
        ctx.lineTo(-t * 0.65, -t * 0.52);  // ala izquierda
        ctx.lineTo(-t * 0.22,  0       );  // muesca central (da aspecto hueco)
        ctx.lineTo(-t * 0.65,  t * 0.52);  // ala derecha
        ctx.closePath();

        // Borde oscuro para contraste sobre cualquier color del gradiente
        ctx.strokeStyle = 'rgba(20, 20, 20, 0.65)';
        ctx.lineWidth   = 1.5;
        ctx.lineJoin    = 'round';
        ctx.stroke();

        // Relleno blanco semitransparente
        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.fill();

        ctx.restore();
      });
    });

    ctx.restore();

    // Punto móvil del día actual.
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, width, height);
    ctx.clip();

    chart.data.datasets.forEach(ds => {
      if (!ds._esTrayectoria) return;
      const data = ds.data;
      if (!data.length) return;
      const idx = getIndicePorDia(data, diaActual);
      const p = data[idx];
      const ciudad = ds._ciudad;
      const px = xScale.getPixelForValue(p.x);
      const py = yScale.getPixelForValue(p.y);

      if (px < left || px > left + width || py < top || py > top + height) return;

      ctx.beginPath();
      ctx.arc(px, py, 14, 0, Math.PI * 2);
      ctx.fillStyle = ciudad.color + '24';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = ciudad.color;
      ctx.stroke();

      const etiqueta = `Día ${p.dia}`;
      ctx.font = 'bold 11px Segoe UI, sans-serif';
      const tw = ctx.measureText(etiqueta).width;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath();
      ctx.roundRect(px + 11, py + 9, tw + 12, 19, 4);
      ctx.fill();
      ctx.fillStyle = ciudad.color;
      ctx.fillText(etiqueta, px + 17, py + 22);
    });

    ctx.restore();
  }
};

Chart.register(pluginLineaPico, pluginFase);

// ══════════════════════════════════════════════════════════════
// GRÁFICOS INFECTADOS + SANOS
// ══════════════════════════════════════════════════════════════

function construirDatasetsInfectados(ciudadesActivas, diaMin, diaMax) {
  const datasets = [];
  ciudadesActivas.forEach(ciudad => {
    const datos = (datosCiudades[ciudad.id] || []).filter(p => p.dia >= diaMin && p.dia <= diaMax);

    datasets.push({
      label: `Infectados — ${ciudad.nombre}`,
      data: datos.map(p => ({ x: p.dia, y: p.infectados })),
      borderColor: ciudad.color,
      backgroundColor: ciudad.color + '28',
      borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5,
      tension: 0.3, fill: 'origin', order: 2
    });

    datasets.push({
      label: `Recuperados — ${ciudad.nombre}`,
      data: datos.map(p => ({ x: p.dia, y: p.recuperados })),
      borderColor: ciudad.colorRecuperados,
      backgroundColor: 'transparent',
      borderWidth: 2, borderDash: [5, 4],
      pointRadius: 0, pointHoverRadius: 4,
      tension: 0.3, fill: false, order: 1
    });
  });
  return datasets;
}

function construirDatasetsSanos(ciudadesActivas, diaMin, diaMax) {
  return ciudadesActivas.map(ciudad => {
    const datos = (datosCiudades[ciudad.id] || []).filter(p => p.dia >= diaMin && p.dia <= diaMax);
    return {
      label: ciudad.nombre,
      data: datos.map(p => ({ x: p.dia, y: p.sanos })),
      borderColor: ciudad.colorSanos, backgroundColor: 'transparent',
      borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5,
      tension: 0.3, fill: false
    };
  });
}

function getTooltipInfectados() {
  return {
    mode: 'index', intersect: false,
    callbacks: {
      title: items => `Día ${items[0]?.parsed?.x ?? ''}`,
      label: ctx => ` ${ctx.dataset.label}: ${Math.round(ctx.parsed.y).toLocaleString('es-AR')} hab.`,
      afterBody(items) {
        if (!items.length) return [];
        const dia = items[0].parsed.x;
        return getCiudadesDisponibles().map(c => {
          const p = datosCiudades[c.id]?.find(d => d.dia === dia);
          return p ? ` Sanos — ${c.nombre}: ${Math.round(p.sanos).toLocaleString('es-AR')} hab.` : null;
        }).filter(Boolean);
      }
    }
  };
}

function getTooltipSanos() {
  return {
    mode: 'index', intersect: false,
    callbacks: {
      title: items => `Día ${items[0]?.parsed?.x ?? ''}`,
      label: ctx => ` ${ctx.dataset.label}: ${Math.round(ctx.parsed.y).toLocaleString('es-AR')} hab. sanos`,
      afterBody(items) {
        if (!items.length) return [];
        const dia = items[0].parsed.x;
        return getCiudadesDisponibles().flatMap(c => {
          const p = datosCiudades[c.id]?.find(d => d.dia === dia);
          if (!p) return [];
          return [
            ` Infectados: ${Math.round(p.infectados).toLocaleString('es-AR')} hab.`,
            ` Recuperados: ${Math.round(p.recuperados).toLocaleString('es-AR')} hab.`
          ];
        });
      }
    }
  };
}

function getEscalesBase() {
  return {
    x: {
      type: 'linear',
      title: { display: true, text: 'Días desde el inicio del brote', font: { size: 11 }, color: '#95a5a6' },
      grid: { color: 'rgba(0,0,0,0.04)' },
      ticks: { maxTicksLimit: 12 }
    },
    y: {
      title: { display: true, text: 'Población', font: { size: 11 }, color: '#95a5a6' },
      grid: { color: 'rgba(0,0,0,0.06)' },
      ticks: { callback: v => v >= 1e6 ? (v/1e6).toFixed(1)+'M' : v >= 1e3 ? (v/1e3).toFixed(0)+'K' : v }
    }
  };
}

function getDiaPicoMaximo(ciudadesActivas) {
  let mayor = 0, diaPico = 0;
  ciudadesActivas.forEach(c => {
    const s = calcularEstadisticas(c.id);
    if (s && s.picoInfectados > mayor) { mayor = s.picoInfectados; diaPico = s.diaPico; }
  });
  return diaPico;
}

function inicializarGraficos(ciudadesActivas, diaMin, diaMax) {
  const ctxI = document.getElementById('grafico-infectados').getContext('2d');
  const ctxS = document.getElementById('grafico-sanos').getContext('2d');
  const diaPico = getDiaPicoMaximo(ciudadesActivas);

  graficoInfectados = new Chart(ctxI, {
    type: 'line',
    data: { datasets: construirDatasetsInfectados(ciudadesActivas, diaMin, diaMax) },
    options: {
      responsive: true, maintainAspectRatio: false, parsing: false,
      plugins: {
        title:     { display: true, text: 'Evolución de Infectados y Recuperados', font: { size: 15, weight: 'bold' }, color: '#2c3e50', padding: { bottom: 14 } },
        legend:    { position: 'top', labels: { usePointStyle: true, pointStyleWidth: 10, font: { size: 12 } } },
        tooltip:   getTooltipInfectados(),
        lineaPico: { diaPico }
      },
      scales: getEscalesBase()
    }
  });

  graficoSanos = new Chart(ctxS, {
    type: 'line',
    data: { datasets: construirDatasetsSanos(ciudadesActivas, diaMin, diaMax) },
    options: {
      responsive: true, maintainAspectRatio: false, parsing: false,
      plugins: {
        title:   { display: true, text: 'Evolución de Población Sana', font: { size: 15, weight: 'bold' }, color: '#2c3e50', padding: { bottom: 14 } },
        legend:  { position: 'top', labels: { usePointStyle: true, pointStyleWidth: 10, font: { size: 12 } } },
        tooltip: getTooltipSanos()
      },
      scales: getEscalesBase()
    }
  });
}

function actualizarGraficos(ciudadesActivas, diaMin, diaMax) {
  if (!graficoInfectados || !graficoSanos) return;
  const diaPico = getDiaPicoMaximo(ciudadesActivas);
  graficoInfectados.data.datasets                  = construirDatasetsInfectados(ciudadesActivas, diaMin, diaMax);
  graficoInfectados.options.plugins.lineaPico       = { diaPico };
  graficoSanos.data.datasets                        = construirDatasetsSanos(ciudadesActivas, diaMin, diaMax);
  graficoInfectados.update();
  graficoSanos.update();
}

// ══════════════════════════════════════════════════════════════
// DIAGRAMA DE FASE
// ══════════════════════════════════════════════════════════════

/**
 * Calcula el rango para el retrato de fase con cuatro cuadrantes.
 * Los valores negativos son referencia matemática del plano de estados:
 * las poblaciones reales siguen viviendo en el primer cuadrante.
 */
function calcularRangoFase(ciudadesActivas, diaMin, diaMax) {
  let maxSanos = 0, maxInfectados = 0;
  ciudadesActivas.forEach(ciudad => {
    (datosCiudades[ciudad.id] || [])
      .filter(p => p.dia >= diaMin && p.dia <= diaMax)
      .forEach(p => {
        if (p.sanos      > maxSanos)      maxSanos      = p.sanos;
        if (p.infectados > maxInfectados) maxInfectados = p.infectados;
      });
  });
  const xAbs = Math.max(maxSanos, 2000000);
  const yAbs = Math.max(maxInfectados, 3500000);
  return {
    xMin: -xAbs * 1.08,
    xMax:  xAbs * 1.08,
    yMin: -yAbs * 1.08,
    yMax:  yAbs * 1.08
  };
}

function construirDatasetsFase(ciudadesActivas, diaMin, diaMax) {
  const datasets = [];

  ciudadesActivas.forEach(ciudad => {
    // Ordenar explícitamente por día para que el gradiente siga
    // la dirección temporal correcta (día 0 → día N)
    const datos = (datosCiudades[ciudad.id] || [])
      .filter(p => p.dia >= diaMin && p.dia <= diaMax)
      .sort((a, b) => a.dia - b.dia);
    if (datos.length < 2) return;

    const params = ciudad.params;
    const sEq    = params.gamma.valor / params.delta.valor;  // S* = γ/δ
    const iEq    = params.alpha.valor / params.beta.valor;   // I* = α/β

    let iPico = 0, maxI = 0;
    datos.forEach((p, i) => { if (p.infectados > maxI) { maxI = p.infectados; iPico = i; } });

    // Trayectoria (puntos invisibles; el gradiente lo dibuja el plugin)
    datasets.push({
      label:  `Trayectoria — ${ciudad.nombre}`,
      data:   datos.map(p => ({ x: p.sanos, y: p.infectados, dia: p.dia })),
      showLine: false,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: ciudad.color,
      _esTrayectoria: true,
      _ciudad: ciudad
    });

    // Marcadores: inicio, pico, estado final
    const marcadores = [
      { x: datos[0].sanos,              y: datos[0].infectados,              dia: datos[0].dia,         etiqueta: `Inicio (día 0)`,               color: ciudad.colorSanos       },
      { x: datos[iPico].sanos,          y: datos[iPico].infectados,          dia: datos[iPico].dia,     etiqueta: `Pico (día ${datos[iPico].dia})`, color: ciudad.color           },
      { x: datos[datos.length-1].sanos, y: datos[datos.length-1].infectados, dia: datos[datos.length-1].dia, etiqueta: `Final (día ${datos[datos.length-1].dia})`, color: ciudad.colorRecuperados }
    ];

    datasets.push({
      label: `Puntos clave — ${ciudad.nombre}`,
      data:  marcadores.map(m => ({ x: m.x, y: m.y, dia: m.dia, etiqueta: m.etiqueta })),
      showLine: false,
      pointRadius:          7,
      pointHoverRadius:     9,
      pointBackgroundColor: marcadores.map(m => m.color),
      pointBorderColor:     '#fff',
      pointBorderWidth:     2,
      _esMarker:            true,
      _colorEtiqueta:       ciudad.color
    });

    // Punto de equilibrio del sistema (S* = γ/δ, I* = α/β)
    datasets.push({
      label: `Equilibrio — ${ciudad.nombre}`,
      data:  [{ x: sEq, y: iEq, etiqueta: '⚖ Equilibrio' }],
      showLine: false,
      pointRadius:          10,
      pointHoverRadius:     12,
      pointStyle:           'crossRot',
      pointBackgroundColor: 'transparent',
      pointBorderColor:     '#2c3e50',
      pointBorderWidth:     2.5,
      _esEquilibrio:        true
    });
  });

  return datasets;
}

function getDatosFasePrincipal() {
  const ciudad = faseAnimacion.ciudadesActivas[0];
  if (!ciudad) return null;

  const datos = (datosCiudades[ciudad.id] || [])
    .filter(p => p.dia >= faseAnimacion.diaMin && p.dia <= faseAnimacion.diaMax)
    .sort((a, b) => a.dia - b.dia);

  if (!datos.length) return null;
  const idx = getIndicePorDia(datos.map(p => ({ dia: p.dia })), faseAnimacion.diaActual);
  return { ciudad, punto: datos[idx], datos };
}

function formatearHabitantes(valor) {
  return Math.round(valor).toLocaleString('es-AR');
}

function getRegimenFase(datos, punto) {
  let pico = datos[0];
  datos.forEach(p => { if (p.infectados > pico.infectados) pico = p; });

  if (punto.dia < pico.dia * 0.7) return 'Expansión';
  if (punto.dia <= pico.dia) return 'Cerca del pico';
  if (punto.infectados < pico.infectados * 0.05) return 'Extinción';
  return 'Retroceso';
}

function actualizarPanelFase() {
  const diaLabel = document.getElementById('fase-dia-label');
  const slider = document.getElementById('fase-day');
  const playLabel = document.getElementById('fase-play-label');
  const playBtn = document.getElementById('fase-play');
  const datosPanel = getDatosFasePrincipal();

  if (diaLabel) diaLabel.textContent = Math.round(faseAnimacion.diaActual);
  if (slider && document.activeElement !== slider) slider.value = Math.round(faseAnimacion.diaActual);
  if (playLabel) playLabel.textContent = faseAnimacion.reproduciendo ? 'Pausar' : 'Reproducir';
  if (playBtn) {
    playBtn.classList.toggle('reproduciendo', faseAnimacion.reproduciendo);
    playBtn.querySelector('.fase-btn-icon').textContent = faseAnimacion.reproduciendo ? '⏸' : '▶';
  }

  const ciudadEl = document.getElementById('fase-ciudad-actual');
  const sanosEl = document.getElementById('fase-sanos-actual');
  const infectadosEl = document.getElementById('fase-infectados-actual');
  const regimenEl = document.getElementById('fase-regimen-actual');

  if (!datosPanel) {
    if (ciudadEl) ciudadEl.textContent = '-';
    if (sanosEl) sanosEl.textContent = '-';
    if (infectadosEl) infectadosEl.textContent = '-';
    if (regimenEl) regimenEl.textContent = 'Sin datos';
    return;
  }

  const { ciudad, punto, datos } = datosPanel;
  if (ciudadEl) ciudadEl.textContent = ciudad.nombre;
  if (sanosEl) sanosEl.textContent = formatearHabitantes(punto.sanos);
  if (infectadosEl) infectadosEl.textContent = formatearHabitantes(punto.infectados);
  if (regimenEl) regimenEl.textContent = getRegimenFase(datos, punto);
}

function setDiaFase(dia, actualizarGrafico = true) {
  faseAnimacion.diaActual = Math.max(
    faseAnimacion.diaMin,
    Math.min(faseAnimacion.diaMax, Number(dia) || faseAnimacion.diaMin)
  );

  if (graficoFase && actualizarGrafico) {
    graficoFase.options.plugins.fase.diaActual = faseAnimacion.diaActual;
    graficoFase.update('none');
  }

  actualizarPanelFase();
}

function detenerAnimacionFase() {
  faseAnimacion.reproduciendo = false;
  if (faseAnimacion.rafId) cancelAnimationFrame(faseAnimacion.rafId);
  faseAnimacion.rafId = null;
  faseAnimacion.ultimoFrame = 0;
  actualizarPanelFase();
}

function avanzarAnimacionFase(timestamp) {
  if (!faseAnimacion.reproduciendo) return;
  if (!faseAnimacion.ultimoFrame) faseAnimacion.ultimoFrame = timestamp;

  const deltaSegundos = (timestamp - faseAnimacion.ultimoFrame) / 1000;
  faseAnimacion.ultimoFrame = timestamp;

  const avance = deltaSegundos * faseAnimacion.diasPorSegundo * faseAnimacion.velocidad;
  const siguienteDia = faseAnimacion.diaActual + avance;

  if (siguienteDia >= faseAnimacion.diaMax) {
    setDiaFase(faseAnimacion.diaMax);
    detenerAnimacionFase();
    return;
  }

  setDiaFase(siguienteDia);
  faseAnimacion.rafId = requestAnimationFrame(avanzarAnimacionFase);
}

function iniciarAnimacionFase() {
  if (faseAnimacion.reproduciendo) return;
  if (faseAnimacion.diaActual >= faseAnimacion.diaMax) setDiaFase(faseAnimacion.diaMin);
  faseAnimacion.reproduciendo = true;
  faseAnimacion.ultimoFrame = 0;
  actualizarPanelFase();
  faseAnimacion.rafId = requestAnimationFrame(avanzarAnimacionFase);
}

function toggleAnimacionFase() {
  if (faseAnimacion.reproduciendo) detenerAnimacionFase();
  else iniciarAnimacionFase();
}

function reiniciarAnimacionFase() {
  detenerAnimacionFase();
  setDiaFase(faseAnimacion.diaMin);
}

function inicializarControlesFase() {
  const play = document.getElementById('fase-play');
  const reset = document.getElementById('fase-reset');
  const slider = document.getElementById('fase-day');
  const velocidad = document.getElementById('fase-speed');

  if (play) play.addEventListener('click', toggleAnimacionFase);
  if (reset) reset.addEventListener('click', reiniciarAnimacionFase);
  if (slider) {
    slider.addEventListener('input', e => {
      detenerAnimacionFase();
      setDiaFase(parseInt(e.target.value, 10));
    });
  }
  if (velocidad) {
    velocidad.addEventListener('change', e => {
      faseAnimacion.velocidad = parseFloat(e.target.value) || 1;
    });
  }
}

function configurarAnimacionFase(ciudadesActivas, diaMin, diaMax) {
  faseAnimacion.ciudadesActivas = ciudadesActivas;
  faseAnimacion.diaMin = diaMin;
  faseAnimacion.diaMax = diaMax;

  const slider = document.getElementById('fase-day');
  if (slider) {
    slider.min = diaMin;
    slider.max = diaMax;
  }

  if (faseAnimacion.diaActual < diaMin || faseAnimacion.diaActual > diaMax) {
    faseAnimacion.diaActual = diaMin;
  }

  if (!ciudadesActivas.length) detenerAnimacionFase();
  setDiaFase(faseAnimacion.diaActual, false);
}

function opcionesFase(rango) {
  const tickCb = v => {
    const abs = Math.abs(v);
    const sign = v < 0 ? '-' : '';
    if (abs >= 1e6) return sign + (abs/1e6).toFixed(1)+'M';
    if (abs >= 1e3) return sign + (abs/1e3).toFixed(0)+'K';
    return v;
  };
  return {
    responsive: true, maintainAspectRatio: false, parsing: false,
    interaction: { mode: 'nearest', intersect: false, axis: 'xy' },
    plugins: {
      title: {
        display: true,
        text: 'Retrato de fase S(t) vs I(t)',
        font: { size: 15, weight: 'bold' }, color: '#2c3e50', padding: { bottom: 14 }
      },
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          filter: item => !item.text.includes('Trayectoria'),
          font: { size: 12 }
        }
      },
      tooltip: {
        callbacks: {
          title: ctx => ctx[0]?.raw?.dia != null ? `Día ${ctx[0].raw.dia}` : '',
          label: ctx => {
            const r = ctx.raw;
            if (r.etiqueta) return ` ${r.etiqueta}`;
            return [
              ` Sanos: ${Math.round(r.x).toLocaleString('es-AR')} hab.`,
              ` Infectados: ${Math.round(r.y).toLocaleString('es-AR')} hab.`
            ];
          }
        }
      },
      fase: { activo: true, animado: true, diaActual: faseAnimacion.diaActual }
    },
    scales: {
      x: {
        type: 'linear',
        min: rango.xMin,
        max: rango.xMax,
        title: { display: true, text: 'S(t): población sana / presa — plano extendido', font: { size: 11 }, color: '#95a5a6' },
        grid:  { color: ctx => ctx.tick.value === 0 ? 'rgba(44,62,80,0.22)' : 'rgba(0,0,0,0.045)' },
        ticks: { maxTicksLimit: 9, callback: tickCb }
      },
      y: {
        type: 'linear',
        min: rango.yMin,
        max: rango.yMax,
        title: { display: true, text: 'I(t): infectados / depredador zombi — plano extendido', font: { size: 11 }, color: '#95a5a6' },
        grid:  { color: ctx => ctx.tick.value === 0 ? 'rgba(44,62,80,0.22)' : 'rgba(0,0,0,0.045)' },
        ticks: { maxTicksLimit: 9, callback: tickCb }
      }
    }
  };
}

function inicializarGraficoFase(ciudadesActivas, diaMin, diaMax) {
  const canvas = document.getElementById('grafico-fase');
  if (!canvas) return;

  const rango = calcularRangoFase(ciudadesActivas, diaMin, diaMax);
  configurarAnimacionFase(ciudadesActivas, diaMin, diaMax);
  inicializarControlesFase();

  graficoFase = new Chart(canvas.getContext('2d'), {
    type: 'scatter',
    data: { datasets: construirDatasetsFase(ciudadesActivas, diaMin, diaMax) },
    options: opcionesFase(rango)
  });
}

function actualizarGraficoFase(ciudadesActivas, diaMin, diaMax) {
  if (!graficoFase) return;
  const rango = calcularRangoFase(ciudadesActivas, diaMin, diaMax);
  configurarAnimacionFase(ciudadesActivas, diaMin, diaMax);
  graficoFase.data.datasets = construirDatasetsFase(ciudadesActivas, diaMin, diaMax);
  // Actualizar rangos de ejes con los nuevos datos filtrados
  graficoFase.options.scales.x.min = rango.xMin;
  graficoFase.options.scales.x.max = rango.xMax;
  graficoFase.options.scales.y.min = rango.yMin;
  graficoFase.options.scales.y.max = rango.yMax;
  graficoFase.options.plugins.fase.diaActual = faseAnimacion.diaActual;
  graficoFase.update();
}
