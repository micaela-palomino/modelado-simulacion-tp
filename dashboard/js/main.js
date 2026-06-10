/**
 * main.js — Coordinador del dashboard
 *
 * Orden de inicialización:
 *   1. Cargar CSVs (loader.js)
 *   2. Filtros + sliders (filters.js)
 *   3. Gráficos infectados/sanos (charts.js)
 *   4. Diagrama de fase (charts.js)
 *   5. Métricas con selector de ciudad
 *   6. Tabla comparativa ordenable
 *   7. Panel de parámetros acordeón
 *   8. Conclusión final
 *   9. Interpretación del diagrama de fase
 */

// Estado de ordenamiento de la tabla
const estadoOrden = { columna: 'picoInfectados', ascendente: false };

// Ciudad seleccionada actualmente en el panel de métricas
let ciudadMetricaActual = null;

// ─────────────────────────────────────────────────────────────
// Inicialización
// ─────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  mostrarCargando(true);

  cargarTodasLasCiudades().then(() => {
    const ciudades = getCiudadesDisponibles();

    if (!ciudades.length) {
      mostrarError('No se encontraron datos. Corré Main.java para generar los CSVs y recargá la página.');
      mostrarCargando(false);
      return;
    }

    const diaMax = calcularDiaMaximoGlobal(ciudades);

    inicializarFiltros();
    ajustarMaxSlider(diaMax);

    inicializarGraficos(ciudades, 0, diaMax);
    inicializarGraficoFase(ciudades, 0, diaMax);

    renderizarMetricas(ciudades);
    actualizarTabla(ciudades);
    renderizarParametros(ciudades);
    renderizarConclusion(ciudades);
    renderizarInterpretacionFase(ciudades);

    mostrarCargando(false);
    document.getElementById('dashboard-contenido').style.display = 'block';
  });
});

function calcularDiaMaximoGlobal(ciudades) {
  let max = 0;
  ciudades.forEach(c => {
    const datos = datosCiudades[c.id];
    if (datos?.length) max = Math.max(max, datos[datos.length - 1].dia);
  });
  return max || 365;
}

// ─────────────────────────────────────────────────────────────
// Métricas del modelo con selector de ciudad (tabs)
// ─────────────────────────────────────────────────────────────

function renderizarMetricas(ciudades) {
  if (!ciudades.length) return;
  ciudadMetricaActual = ciudades[0].id;
  renderizarTabsMetricas(ciudades);
  renderizarMetricasCiudad(ciudades[0], ciudades);
}

function renderizarTabsMetricas(ciudades) {
  const contenedor = document.getElementById('metricas-tabs');
  if (!contenedor) return;

  if (ciudades.length <= 1) {
    contenedor.style.display = 'none';
    return;
  }

  contenedor.style.display = 'flex';
  contenedor.innerHTML = ciudades.map((c, i) => `
    <button class="tab-btn${i === 0 ? ' activo' : ''}"
            data-ciudad="${c.id}"
            onclick="seleccionarTabMetrica(this, '${c.id}')">
      <span class="ciudad-dot" style="background:${c.color}"></span>
      ${c.nombre}
    </button>
  `).join('');
}

function seleccionarTabMetrica(btn, idCiudad) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('activo'));
  btn.classList.add('activo');
  ciudadMetricaActual = idCiudad;
  const ciudad = CIUDADES.find(c => c.id === idCiudad);
  if (ciudad) renderizarMetricasCiudad(ciudad, getCiudadesDisponibles());
}

function renderizarMetricasCiudad(ciudad, todasCiudades) {
  const contenedor = document.getElementById('metricas-contenedor');
  if (!contenedor) return;

  const metricas = calcularMetricas(ciudad.id);
  const stats    = calcularEstadisticas(ciudad.id);
  if (!metricas || !stats) return;

  const subtitulo = document.getElementById('metricas-subtitulo');
  if (subtitulo) subtitulo.textContent = ciudad.nombre;

  // Ranking de riesgo: solo aparece con múltiples ciudades
  let rankingHTML = '';
  if (todasCiudades.length > 1) {
    const ordenadas = todasCiudades
      .map(c => ({ id: c.id, pico: calcularEstadisticas(c.id)?.picoInfectados ?? 0 }))
      .sort((a, b) => b.pico - a.pico);
    const pos   = ordenadas.findIndex(c => c.id === ciudad.id) + 1;
    const total = ordenadas.length;
    const desc  = pos === 1 ? 'La más riesgosa del conjunto'
                : pos === total ? 'La más segura del conjunto'
                : `Posición ${pos} de ${total} (1 = más riesgosa)`;
    const clase = pos === 1 ? 'metrica-riesgo' : pos === total ? 'metrica-ok' : '';
    rankingHTML = `
      <div class="metrica-card ${clase}">
        <div class="metrica-icono">🏆</div>
        <div class="metrica-cuerpo">
          <div class="metrica-titulo">Ranking de riesgo</div>
          <div class="metrica-valor">#${pos} / ${total}</div>
          <div class="metrica-desc">${desc}</div>
        </div>
      </div>`;
  }

  const tarjetas = [
    {
      icono: '🔢', titulo: 'R₀ estimado', valor: metricas.R0,
      desc:  'β × N / γ — Personas que infectaría un caso en población totalmente susceptible',
      clase: parseFloat(metricas.R0) > 2 ? 'metrica-riesgo' : 'metrica-ok'
    },
    {
      icono: '📈', titulo: 'Días hasta el pico', valor: `Día ${metricas.velocidadPropagacion}`,
      desc:  'Velocidad de propagación: días desde inicio hasta alcanzar el máximo de infectados',
      clase: ''
    },
    {
      icono: '💥', titulo: 'Tasa de colapso', valor: `${metricas.tasaColapso}%`,
      desc:  'Porcentaje de la población sana perdida en el momento exacto del pico',
      clase: parseFloat(metricas.tasaColapso) > 50 ? 'metrica-riesgo' : ''
    },
    {
      icono: '🔁', titulo: 'Ciclos del virus',
      valor: metricas.ciclos === 1 ? '1 ciclo' : `${metricas.ciclos} ciclos`,
      desc:  'Rebrotes detectados (máximos locales por encima del 5% del pico)',
      clase: ''
    },
    {
      icono: '⚔️', titulo: 'Día de cruce',
      valor: metricas.diaCruce !== null ? `Día ${metricas.diaCruce}` : 'No ocurrió',
      desc:  'Primer día en que los infectados superan numéricamente a los sanos',
      clase: metricas.diaCruce !== null ? 'metrica-riesgo' : 'metrica-ok'
    }
  ];

  contenedor.innerHTML = tarjetas.map(t => `
    <div class="metrica-card ${t.clase}">
      <div class="metrica-icono">${t.icono}</div>
      <div class="metrica-cuerpo">
        <div class="metrica-titulo">${t.titulo}</div>
        <div class="metrica-valor">${t.valor}</div>
        <div class="metrica-desc">${t.desc}</div>
      </div>
    </div>
  `).join('') + rankingHTML;
}

// ─────────────────────────────────────────────────────────────
// Tabla comparativa con ordenamiento
// ─────────────────────────────────────────────────────────────

const COLUMNAS = [
  { key: 'nombre',             label: 'Ciudad',               sortable: false },
  { key: 'tipo',               label: 'Tipo',                 sortable: false },
  { key: 'picoInfectados',     label: 'Pico infectados',      sortable: true  },
  { key: 'porcentajeAfectado', label: '% Pob. afectada',      sortable: true  },
  { key: 'diaPico',            label: 'Día del pico',         sortable: true  },
  { key: 'duracionBrote',      label: 'Duración del brote',   sortable: true  },
  { key: 'conclusion',         label: 'Conclusión',           sortable: false }
];

function renderizarHeadersTabla() {
  const thead = document.getElementById('tabla-thead');
  if (!thead) return;
  thead.innerHTML = '<tr>' + COLUMNAS.map(col => {
    if (!col.sortable) return `<th>${col.label}</th>`;
    const activa = estadoOrden.columna === col.key;
    const flecha = activa ? (estadoOrden.ascendente ? '↑' : '↓') : '↕';
    return `<th class="col-sortable${activa ? ' col-activa' : ''}" data-col="${col.key}">
      ${col.label} <span class="sort-arrow">${flecha}</span>
    </th>`;
  }).join('') + '</tr>';

  thead.querySelectorAll('[data-col]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      if (estadoOrden.columna === col) estadoOrden.ascendente = !estadoOrden.ascendente;
      else { estadoOrden.columna = col; estadoOrden.ascendente = false; }
      // Re-renderizar con las ciudades actualmente visibles
      const activas = getCiudadesDisponibles().filter(c =>
        document.querySelector(`input[value="${c.id}"]`)?.checked !== false
      );
      actualizarTabla(activas);
    });
  });
}

function actualizarTabla(ciudadesActivas) {
  renderizarHeadersTabla();
  const tbody = document.getElementById('tabla-ciudades-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!ciudadesActivas.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="sin-datos">Seleccioná al menos una ciudad.</td></tr>';
    return;
  }

  const filas = ciudadesActivas
    .map(c => ({ ciudad: c, stats: calcularEstadisticas(c.id) }))
    .filter(f => f.stats != null);

  if (!filas.length) return;

  // Ordenar
  filas.sort((a, b) => {
    const va = a.stats[estadoOrden.columna] ?? 0;
    const vb = b.stats[estadoOrden.columna] ?? 0;
    return estadoOrden.ascendente ? va - vb : vb - va;
  });

  const picos   = filas.map(f => f.stats.picoInfectados);
  const minPico = Math.min(...picos);
  const maxPico = Math.max(...picos);

  filas.forEach(({ ciudad, stats: s }) => {
    const esMasSegura   = s.picoInfectados === minPico && filas.length > 1;
    const esMenosSegura = s.picoInfectados === maxPico && filas.length > 1;
    const claseFila     = esMasSegura ? 'fila-segura' : esMenosSegura ? 'fila-riesgosa' : '';
    const icono         = filas.length === 1 ? '—'
      : esMasSegura   ? '✅ Más segura'
      : esMenosSegura ? '⚠️ Más riesgosa'
      : '—';

    const tr = document.createElement('tr');
    tr.className = claseFila;
    tr.innerHTML = `
      <td><span class="color-dot" style="background:${ciudad.color}"></span>${ciudad.nombre}</td>
      <td>${ciudad.tipo}</td>
      <td class="numero">${s.picoInfectados.toLocaleString('es-AR')}</td>
      <td class="numero">${s.porcentajeAfectado.toFixed(1)}%</td>
      <td class="numero">Día ${s.diaPico}</td>
      <td class="numero">${s.duracionBrote} días</td>
      <td class="conclusion-cell">${icono}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ─────────────────────────────────────────────────────────────
// Panel de parámetros — acordeón por ciudad
// ─────────────────────────────────────────────────────────────

function renderizarParametros(ciudades) {
  const contenedor = document.getElementById('parametros-contenedor');
  if (!contenedor) return;

  contenedor.innerHTML = ciudades.map((ciudad, i) => `
    <div class="param-bloque">
      <button class="param-toggle${i === 0 ? ' abierto' : ''}" onclick="toggleParam(this)">
        <span class="ciudad-dot" style="background:${ciudad.color}"></span>
        ${ciudad.nombre} — ${ciudad.tipo}
        <span class="param-flecha">${i === 0 ? '▲' : '▼'}</span>
      </button>
      <div class="param-contenido" style="${i === 0 ? '' : 'display:none'}">
        <div class="param-grid">
          ${['alpha','beta','delta','gamma'].map(key => {
            const p   = ciudad.params[key];
            const val = p.valor < 0.0001 ? p.valor.toExponential(2) : p.valor;
            return `<div class="param-fila">
              <div class="param-label">${p.label}</div>
              <div class="param-valor">${val}</div>
              <div class="param-desc">${p.desc}</div>
            </div>`;
          }).join('')}
        </div>
        <div class="param-iniciales">
          <strong>Condiciones iniciales:</strong>
          Sanos: <em>${ciudad.params.sanoInicial.toLocaleString('es-AR')}</em> &nbsp;|&nbsp;
          Infectados: <em>${ciudad.params.infectadoInicial}</em>
        </div>
      </div>
    </div>
  `).join('');
}

function toggleParam(btn) {
  const contenido = btn.nextElementSibling;
  const abierto   = btn.classList.toggle('abierto');
  contenido.style.display = abierto ? '' : 'none';
  btn.querySelector('.param-flecha').textContent = abierto ? '▲' : '▼';
}

// ─────────────────────────────────────────────────────────────
// Conclusión final
// ─────────────────────────────────────────────────────────────

function renderizarConclusion(ciudades) {
  const contenedor = document.getElementById('conclusion-final');
  if (!contenedor) return;

  const filas = ciudades
    .map(c => ({ ciudad: c, stats: calcularEstadisticas(c.id), metricas: calcularMetricas(c.id) }))
    .filter(f => f.stats != null);

  if (!filas.length) { contenedor.innerHTML = '<p class="sin-datos">Sin datos.</p>'; return; }

  if (filas.length === 1) {
    const { ciudad, stats, metricas } = filas[0];
    const r0  = parseFloat(metricas?.R0 ?? 0);
    const interpretR0 = r0 > 5 ? 'extremadamente alto — propagación explosiva'
      : r0 > 2 ? 'alto — el virus avanza más rápido de lo que se controla'
      : r0 > 1 ? 'moderado — el virus avanza pero puede ser contenido'
      : 'bajo — el brote se extinguirá naturalmente';

    contenedor.innerHTML = `
      <div class="conclusion-unica">
        <h3>Análisis: ${ciudad.nombre}</h3>
        <p>Con R₀ estimado de <strong>${metricas?.R0}</strong> (${interpretR0}), el brote alcanza
        <strong>${stats.picoInfectados.toLocaleString('es-AR')} infectados</strong> en el día
        <strong>${stats.diaPico}</strong>, afectando al
        <strong>${stats.porcentajeAfectado.toFixed(1)}%</strong> de la población.</p>
        <p>La curva de Lotka-Volterra muestra el comportamiento clásico depredador-presa:
        el virus crece al consumir población sana, alcanza su pico cuando la tasa de contagio
        supera la recuperación, y declina al agotarse el "recurso". La baja γ = ${ciudad.params.gamma.valor}
        (pocos hospitales) y la alta β = ${ciudad.params.beta.valor.toExponential(2)}
        (alta densidad + transporte masivo) son los factores críticos de ${ciudad.nombre}.</p>
        <p>Duración estimada del brote activo: <strong>${stats.duracionBrote} días</strong> desde el pico.</p>
        <p class="conclusion-nota">Cuando otros grupos agreguen sus ciudades, esta sección comparará automáticamente cuál es la más segura.</p>
      </div>`;
    return;
  }

  filas.sort((a, b) => a.stats.picoInfectados - b.stats.picoInfectados);
  const masSegura   = filas[0];
  const menosSegura = filas[filas.length - 1];
  const diff        = ((menosSegura.stats.picoInfectados / masSegura.stats.picoInfectados) - 1) * 100;

  contenedor.innerHTML = `
    <div class="conclusion-cards">
      <div class="conclusion-card segura">
        <div class="conclusion-icono">✅</div>
        <div class="conclusion-texto">
          <h3>Más segura: <span style="color:${masSegura.ciudad.color}">${masSegura.ciudad.nombre}</span></h3>
          <p>Pico: <strong>${masSegura.stats.picoInfectados.toLocaleString('es-AR')} hab.</strong> (día ${masSegura.stats.diaPico})</p>
          <p>Recuperación: día ${masSegura.stats.diaPico + masSegura.stats.duracionBrote} · Tipo: ${masSegura.ciudad.tipo}</p>
        </div>
      </div>
      <div class="conclusion-card riesgosa">
        <div class="conclusion-icono">⚠️</div>
        <div class="conclusion-texto">
          <h3>Más riesgosa: <span style="color:${menosSegura.ciudad.color}">${menosSegura.ciudad.nombre}</span></h3>
          <p>Pico: <strong>${menosSegura.stats.picoInfectados.toLocaleString('es-AR')} hab.</strong> (día ${menosSegura.stats.diaPico})</p>
          <p>Pico <strong>${diff.toFixed(0)}% mayor</strong> que la más segura · Tipo: ${menosSegura.ciudad.tipo}</p>
        </div>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────
// Interpretación del diagrama de fase
// ─────────────────────────────────────────────────────────────

function renderizarInterpretacionFase(ciudades) {
  const contenedor = document.getElementById('fase-interpretacion');
  if (!contenedor || !ciudades.length) return;

  // Se usa la primera ciudad disponible para el análisis descriptivo
  const ciudad = ciudades[0];
  const datos  = datosCiudades[ciudad.id];
  const params = ciudad.params;
  if (!datos) return;

  // Punto de equilibrio teórico: S* = γ/δ, I* = α/β
  const sEq = params.gamma.valor / params.delta.valor;
  const iEq = params.alpha.valor / params.beta.valor;

  // Comparar distancia al equilibrio en la segunda cuarta parte vs la última
  const q2    = Math.floor(datos.length * 0.5);
  const dMed  = Math.hypot(datos[q2].sanos - sEq, datos[q2].infectados - iEq);
  const dFin  = Math.hypot(datos[datos.length-1].sanos - sEq, datos[datos.length-1].infectados - iEq);
  const stats = calcularEstadisticas(ciudad.id);
  const ultimo = datos[datos.length - 1];

  let tipo, texto;

  if (ultimo.infectados < stats.picoInfectados * 0.01) {
    tipo  = 'extincion';
    texto = `El virus se extingue: la pandemia termina. La trayectoria en el diagrama de fase colapsa hacia el eje X (infectados → 0), indicando que el patógeno no logra sostenerse. La tasa de recuperación γ = ${params.gamma.valor} termina superando la presión de contagio sobre los infectados restantes.`;
  } else if (dFin < dMed * 0.75) {
    tipo  = 'convergencia';
    texto = `El sistema tiende al equilibrio: el virus se vuelve endémico. La trayectoria espirala hacia el punto de equilibrio (S* = ${Math.round(sEq).toLocaleString('es-AR')} hab., I* = ${Math.round(iEq).toLocaleString('es-AR')} hab.), donde el virus y la población coexisten de forma estable sin crecer ni colapsar.`;
  } else if (dFin > dMed * 1.3) {
    tipo  = 'divergencia';
    texto = `El sistema diverge: el brote escala. La trayectoria se aleja del punto de equilibrio, indicando un brote creciente potencialmente incontrolable. Los parámetros de ${ciudad.nombre} (β alta, γ baja) generan una dinámica inestable que podría colapsar el sistema de salud.`;
  } else {
    tipo  = 'ciclos';
    texto = `El sistema oscila: se esperan brotes periódicos. La trayectoria describe órbitas alrededor del punto de equilibrio (S* = ${Math.round(sEq).toLocaleString('es-AR')} hab., I* = ${Math.round(iEq).toLocaleString('es-AR')} hab.). Comportamiento clásico de Lotka-Volterra: el virus surge, agota la población sana, decae, y el ciclo se repite.`;
  }

  const iconos = { extincion: '✅', convergencia: '🔄', divergencia: '⚠️', ciclos: '🔁' };

  contenedor.innerHTML = `
    <div class="fase-interp-card fase-${tipo}">
      <div class="fase-interp-icono">${iconos[tipo]}</div>
      <div class="fase-interp-texto">
        <strong>Comportamiento del sistema (${ciudad.nombre}):</strong> ${texto}
      </div>
    </div>
    <div class="fase-interp-nota">
      <strong>Punto de equilibrio teórico:</strong>
      S* = γ/δ = ${params.gamma.valor} / ${params.delta.valor.toExponential(2)} =
      <strong>${Math.round(sEq).toLocaleString('es-AR')} hab. sanos</strong>
      &nbsp;|&nbsp;
      I* = α/β = ${params.alpha.valor} / ${params.beta.valor.toExponential(2)} =
      <strong>${Math.round(iEq).toLocaleString('es-AR')} hab. infectados</strong>
      <br><small>Estado donde el virus y la población coexisten sin crecer ni decrecer.</small>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────────

function mostrarCargando(visible) {
  const el = document.getElementById('cargando');
  if (el) el.style.display = visible ? 'flex' : 'none';
}

function mostrarError(msg) {
  const el = document.getElementById('error-mensaje');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
