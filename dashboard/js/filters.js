/**
 * filters.js — Filtros interactivos del dashboard
 *
 * Filtros:
 *   - Checkboxes por ciudad
 *   - Dual slider de rango de días (un solo control con dos puntos)
 */

const estadoFiltros = {
  ciudadesActivas: new Set(),
  diaMin: 0,
  diaMax: 365
};

// ─────────────────────────────────────────────────────────────
// Checkboxes de ciudades
// ─────────────────────────────────────────────────────────────

function renderizarCheckboxesCiudades() {
  const contenedor = document.getElementById('filtros-ciudades');
  if (!contenedor) return;

  contenedor.innerHTML = '';
  const ciudades = getCiudadesDisponibles();

  if (!ciudades.length) {
    contenedor.innerHTML = '<p class="sin-datos">No hay ciudades cargadas. Corré Main.java primero.</p>';
    return;
  }

  ciudades.forEach(ciudad => {
    estadoFiltros.ciudadesActivas.add(ciudad.id);

    const label = document.createElement('label');
    label.className = 'checkbox-ciudad';
    label.innerHTML = `
      <input type="checkbox" value="${ciudad.id}" checked>
      <span class="ciudad-dot" style="background:${ciudad.color}"></span>
      <span class="ciudad-nombre">${ciudad.nombre}</span>
      <span class="ciudad-tipo">${ciudad.tipo}</span>
    `;
    label.querySelector('input').addEventListener('change', e => {
      if (e.target.checked) estadoFiltros.ciudadesActivas.add(ciudad.id);
      else                  estadoFiltros.ciudadesActivas.delete(ciudad.id);
      aplicarFiltros();
    });
    contenedor.appendChild(label);
  });
}

// ─────────────────────────────────────────────────────────────
// Dual slider de rango de días (puro JS/CSS, sin librerías)
// ─────────────────────────────────────────────────────────────

function inicializarDualSlider() {
  const thumbMin  = document.getElementById('slider-dia-min');
  const thumbMax  = document.getElementById('slider-dia-max');
  const fill      = document.getElementById('dual-fill');
  const labelMin  = document.getElementById('label-dia-min');
  const labelMax  = document.getElementById('label-dia-max');
  if (!thumbMin || !thumbMax) return;

  // Actualiza el fill visual entre los dos puntos
  function actualizarFill() {
    const total = parseInt(thumbMax.max) || 365;
    const vMin  = parseInt(thumbMin.value);
    const vMax  = parseInt(thumbMax.value);
    const pMin  = (vMin / total) * 100;
    const pMax  = (vMax / total) * 100;
    fill.style.left  = pMin + '%';
    fill.style.width = (pMax - pMin) + '%';
    if (labelMin) labelMin.textContent = vMin;
    if (labelMax) labelMax.textContent = vMax;
  }

  thumbMin.addEventListener('input', () => {
    // Evitar que el mínimo supere al máximo
    if (parseInt(thumbMin.value) >= parseInt(thumbMax.value)) {
      thumbMin.value = parseInt(thumbMax.value) - 1;
    }
    estadoFiltros.diaMin = parseInt(thumbMin.value);
    actualizarFill();
    aplicarFiltros();
  });

  thumbMax.addEventListener('input', () => {
    // Evitar que el máximo sea menor al mínimo
    if (parseInt(thumbMax.value) <= parseInt(thumbMin.value)) {
      thumbMax.value = parseInt(thumbMin.value) + 1;
    }
    estadoFiltros.diaMax = parseInt(thumbMax.value);
    actualizarFill();
    aplicarFiltros();
  });

  // Z-index dinámico: el thumb arrastrado queda encima
  thumbMin.addEventListener('mousedown', () => { thumbMin.style.zIndex = 4; thumbMax.style.zIndex = 3; });
  thumbMax.addEventListener('mousedown', () => { thumbMax.style.zIndex = 4; thumbMin.style.zIndex = 3; });

  actualizarFill();

  // Retorna función para ajustar el max cuando se cargan los datos
  return function setMaxDias(maxDias) {
    thumbMin.max = maxDias;
    thumbMax.max = maxDias;
    thumbMax.value = maxDias;
    estadoFiltros.diaMax = maxDias;
    actualizarFill();
  };
}

// ─────────────────────────────────────────────────────────────
// Aplicar filtros
// ─────────────────────────────────────────────────────────────

function aplicarFiltros() {
  const activas = getCiudadesDisponibles().filter(c =>
    estadoFiltros.ciudadesActivas.has(c.id)
  );
  actualizarGraficos(activas, estadoFiltros.diaMin, estadoFiltros.diaMax);
  actualizarGraficoFase(activas, estadoFiltros.diaMin, estadoFiltros.diaMax);
  actualizarTabla(activas);
}

// setMaxDias se llama desde main.js después de cargar los datos
let setMaxDias = null;

function inicializarFiltros() {
  renderizarCheckboxesCiudades();
  setMaxDias = inicializarDualSlider();
}

function ajustarMaxSlider(maxDias) {
  if (setMaxDias) setMaxDias(maxDias);
}
