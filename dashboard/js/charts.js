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
// PLUGIN: diagrama de fase — líneas con gradiente + etiquetas
// ══════════════════════════════════════════════════════════════

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

    chart.data.datasets.forEach(ds => {
      if (!ds._esTrayectoria) return;
      const data   = ds.data;
      if (data.length < 2) return;
      const ciudad = ds._ciudad;

      // Índice relativo del pico
      let iPico = 0, maxI = 0;
      data.forEach((p, i) => { if (p.y > maxI) { maxI = p.y; iPico = i; } });
      const tPico = iPico / (data.length - 1);

      for (let i = 0; i < data.length - 1; i++) {
        const t  = i / (data.length - 1);
        const x1 = xScale.getPixelForValue(data[i].x);
        const y1 = yScale.getPixelForValue(data[i].y);
        const x2 = xScale.getPixelForValue(data[i + 1].x);
        const y2 = yScale.getPixelForValue(data[i + 1].y);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = interpolarColorFase(t, tPico, ciudad);
        ctx.lineWidth   = 2.5;
        ctx.lineJoin    = 'round';
        ctx.stroke();
      }
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

    chart.data.datasets.forEach(ds => {
      if (!ds._esTrayectoria) return;
      const data = ds.data;
      if (data.length < 5) return;

      // lookahead: 3% de la longitud del CSV — da dirección clara sin saltar demasiado
      const lookahead = Math.max(2, Math.floor(data.length * 0.03));

      [0.20, 0.40, 0.60, 0.80].forEach(pct => {
        const i = Math.floor(pct * (data.length - 1));
        const j = Math.min(i + lookahead, data.length - 1);
        if (i === j) return;

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
 * Calcula el rango para los ejes del diagrama de fase a partir de los datos reales.
 * Eje X: de 0 hasta el máximo de sanos registrado (no el valor inicial, sino el real).
 * Eje Y: de 0 hasta el máximo de infectados registrado.
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
  return {
    xMin: 0,
    xMax: maxSanos      * 1.05 || 2000000,
    yMin: 0,
    yMax: maxInfectados * 1.05 || 3500000
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

function opcionesFase(rango) {
  const tickCb = v => v >= 1e6 ? (v/1e6).toFixed(1)+'M' : v >= 1e3 ? (v/1e3).toFixed(0)+'K' : v;
  return {
    responsive: true, maintainAspectRatio: false, parsing: false,
    interaction: { mode: 'nearest', intersect: false, axis: 'xy' },
    plugins: {
      title: {
        display: true,
        text: 'Diagrama de Fase — Espacio de Estados Lotka-Volterra',
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
      fase: { activo: true }
    },
    scales: {
      x: {
        type: 'linear',
        // El eje X SIEMPRE empieza en 0 y llega al máximo de sanos del CSV
        min: rango.xMin,
        max: rango.xMax,
        title: { display: true, text: 'Población sana → (valor decrece durante el brote)', font: { size: 11 }, color: '#95a5a6' },
        grid:  { color: 'rgba(0,0,0,0.04)' },
        ticks: { maxTicksLimit: 8, callback: tickCb }
      },
      y: {
        type: 'linear',
        min: rango.yMin,
        max: rango.yMax,
        title: { display: true, text: 'Población infectada → (valor crece durante el brote)', font: { size: 11 }, color: '#95a5a6' },
        grid:  { color: 'rgba(0,0,0,0.04)' },
        ticks: { maxTicksLimit: 8, callback: tickCb }
      }
    }
  };
}

function inicializarGraficoFase(ciudadesActivas, diaMin, diaMax) {
  const canvas = document.getElementById('grafico-fase');
  if (!canvas) return;

  const rango = calcularRangoFase(ciudadesActivas, diaMin, diaMax);

  graficoFase = new Chart(canvas.getContext('2d'), {
    type: 'scatter',
    data: { datasets: construirDatasetsFase(ciudadesActivas, diaMin, diaMax) },
    options: opcionesFase(rango)
  });
}

function actualizarGraficoFase(ciudadesActivas, diaMin, diaMax) {
  if (!graficoFase) return;
  const rango = calcularRangoFase(ciudadesActivas, diaMin, diaMax);
  graficoFase.data.datasets = construirDatasetsFase(ciudadesActivas, diaMin, diaMax);
  // Actualizar rangos de ejes con los nuevos datos filtrados
  graficoFase.options.scales.x.min = rango.xMin;
  graficoFase.options.scales.x.max = rango.xMax;
  graficoFase.options.scales.y.min = rango.yMin;
  graficoFase.options.scales.y.max = rango.yMax;
  graficoFase.update();
}
