/**
 * loader.js — Carga, parseo y métricas de los datos de cada ciudad.
 *
 * Para agregar una ciudad nueva:
 *   1. Agregar entrada en el array CIUDADES con sus params y colores
 *   2. Colocar su CSV en dashboard/data/<id>.csv
 */

const CIUDADES = [
  {
    id: 'lamatanza',
    nombre: 'La Matanza',
    tipo: 'Satélite / Suburbio AMBA',
    color: '#e74c3c',             // infectados
    colorSanos: '#3498db',        // sanos
    colorRecuperados: '#27ae60',  // recuperados
    poblacionTotal: 1750000,
    params: {
      alpha: { valor: 0.03, label: 'α — Crecimiento sano', desc: 'Ciudad joven con alta natalidad, pero alta exposición y movilidad limitan la recuperación natural de la población.' },
      beta: { valor: 0.00000012, label: 'β — Tasa de contagio', desc: 'Alta densidad (~2.800 hab/km²) + transporte masivo (trenes Roca, Belgrano Sur, cientos de líneas de colectivos) = contacto permanente entre sanos e infectados.' },
      delta: { valor: 0.00000010, label: 'δ — Propagación viral', desc: 'Hacinamiento residencial y mala ventilación en viviendas precarias y transporte público potencian la eficiencia del virus.' },
      gamma: { valor: 0.045, label: 'γ — Recuperación', desc: 'Solo ~3 hospitales públicos principales para 1.75M de habitantes. Sin alta complejidad propia; depende del sistema sanitario del AMBA.' },
      sanoInicial: 1749900,
      infectadoInicial: 100
    }
  },
  {
    id: 'laplata',
    nombre: 'La Plata',
    tipo: 'Capital provincial / Ciudad intermedia',
    color: '#9b59b6',             // infectados
    colorSanos: '#1abc9c',        // sanos
    colorRecuperados: '#2ecc71',  // recuperados
    poblacionTotal: 800000,
    params: {
      alpha: { valor: 0.025, label: 'α — Crecimiento sano', desc: 'Tasa de crecimiento moderada. Ciudad universitaria con población estable y flujo de estudiantes/trabajadores que suaviza el crecimiento natural y la migración neta.' },
      beta: { valor: 0.000000225, label: 'β — Tasa de contagio', desc: 'Contagio moderado. Barrios densos, universidades y transporte público frecuente generan contactos cercanos, atenuados por zonas residenciales menos saturadas y espacios abiertos.' },
      delta: { valor: 0.0000001875, label: 'δ — Propagación viral', desc: 'Propagación moderada. Concentración en facultades, oficinas públicas y transporte interurbano, limitada por parques y diagonales amplias. R0 ≈ 2.5.' },
      gamma: { valor: 0.06, label: 'γ — Recuperación', desc: 'Recuperación relativamente alta. Hospitales de referencia, clínicas privadas y presencia de facultades de ciencias de la salud mejoran el acceso a tratamiento.' },
      sanoInicial: 799900,
      infectadoInicial: 100
    }
  },
  {
    id: 'mendoza',
    nombre: 'Gran Mendoza',
    tipo: 'Universitaria / Turística',
    color: '#8e44ad',
    colorSanos: '#2980b9',
    colorRecuperados: '#1abc9c',
    poblacionTotal: 1100000,
    params: {
      alpha: { valor: 0.025,        label: 'α — Crecimiento sano',  desc: 'Población metropolitana estable con renovación constante por la comunidad universitaria (UNCuyo, UTN, UM), sin el dinamismo demográfico extremo del AMBA.' },
      beta:  { valor: 0.000000090,  label: 'β — Tasa de contagio',  desc: 'Densidad moderada (~600 hab/km²), pero el turismo estacional (ski, vendimia) y la alta movilidad estudiantil generan picos de contacto que elevan el contagio.' },
      delta: { valor: 0.000000075,  label: 'δ — Propagación viral', desc: 'Clima seco andino y menor humedad favorecen la ventilación natural. Los espacios cerrados en invierno compensan parcialmente esta ventaja.' },
      gamma: { valor: 0.075,        label: 'γ — Recuperación',      desc: 'Hospital Central de Mendoza como referencia regional + red provincial (Lagomaggiore, Schestakow) + sector privado desarrollado. Mejor cobertura que ciudades satélite del AMBA.' },
      sanoInicial:      1099900,
      infectadoInicial: 100
    }
  },
  // --- Agregar ciudades nuevas debajo ---
  {
    id: 'ushuaia',
    nombre: 'Ushuaia',
    tipo: 'Turística / Patagónica aislada',
    color: '#16a085',
    colorSanos: '#2980b9',
    colorRecuperados: '#27ae60',
    poblacionTotal: 90000,
    params: {
      alpha: { valor: 0.020,      label: 'α — Crecimiento sano',  desc: 'Tasa baja-moderada. Ushuaia crece principalmente por migración laboral (zona franca, turismo, empleo estatal); base poblacional pequeña y estabilizada en ~90.000 hab.' },
      beta:  { valor: 0.0000013,  label: 'β — Tasa de contagio',  desc: 'Muy alta para su tamaño. Más de 300.000 turistas/año más cruceros antárticos; en temporada alta la ciudad puede casi duplicar su población transitoria. Un crucero aporta más pasajeros que el 1 % del padrón local.' },
      delta: { valor: 0.0000010,  label: 'δ — Propagación viral', desc: 'Alta. Los inviernos fríos concentran a la población en espacios cerrados (hoteles, refugios, teleférico, remises turísticos), donde la escasa ventilación potencia la eficiencia del virus.' },
      gamma: { valor: 0.030,      label: 'γ — Recuperación',      desc: 'Muy baja. El Hospital Regional de Ushuaia es el único hospital público provincial (nivel III). Las derivaciones a Buenos Aires (3.200 km, mínimo 3 h de vuelo) son costosas y dependientes del clima patagónico; un brote masivo colapsa el sistema rápidamente.' },
      sanoInicial:      89970,
      infectadoInicial: 30
    }
  },
  {
    id: 'bariloche',
    nombre: 'Bariloche',
    tipo: 'Turística / Patagónica',
    color: '#9b59b6',
    colorSanos: '#2980b9',
    colorRecuperados: '#1abc9c',
    poblacionTotal: 133000,
    params: {
      alpha: { valor: 0.03,        label: 'α — Crecimiento sano',   desc: 'Población estable con crecimiento moderado por migración. Ciudad joven que atrae residentes del sector turístico y servicios.' },
      beta:  { valor: 0.00000085,  label: 'β — Tasa de contagio',   desc: 'Alta por el flujo turístico estacional: entre 500.000 y 1.000.000 de visitantes anuales concentrados en temporadas de ski y verano generan contacto intenso con la población local.' },
      delta: { valor: 0.00000070,  label: 'δ — Propagación viral',  desc: 'Media-alta por la concentración en espacios cerrados durante temporada alta: hoteles, refugios de montaña, teleféricos y transporte turístico.' },
      gamma: { valor: 0.040,       label: 'γ — Recuperación',       desc: 'Baja: el Hospital Zonal Ramón Carrillo es el único hospital público de referencia para ~150.000 km² de región. Aislamiento geográfico (1.650 km de CABA) retrasa derivaciones y refuerzos.' },
      sanoInicial:      132950,
      infectadoInicial: 50
    }
  },
  {
    id: 'cordoba',
    nombre: 'Gran Córdoba',
    tipo: 'Universitaria / Metropolitana del interior',
    color: '#e67e22',             // infectados
    colorSanos: '#2980b9',        // sanos
    colorRecuperados: '#27ae60',  // recuperados
    poblacionTotal: 1500000,
    params: {
      alpha: { valor: 0.030,       label: 'α — Crecimiento sano',  desc: 'Ciudad joven y universitaria ("La Docta") con fuerte renovación poblacional por la llegada constante de estudiantes del interior del país.' },
      beta:  { valor: 0.00000017,  label: 'β — Tasa de contagio',  desc: 'Alta: gran densidad del casco céntrico, transporte urbano masivo y una enorme población universitaria (UNC, UTN, privadas) que se concentra en facultades, bares y eventos. R0 ≈ 3.6.' },
      delta: { valor: 0.00000014,  label: 'δ — Propagación viral', desc: 'Alta: el hacinamiento en aulas, transporte y vida nocturna estudiantil potencia la eficiencia del contagio, atenuado solo parcialmente por el clima mediterráneo seco.' },
      gamma: { valor: 0.070,       label: 'γ — Recuperación',      desc: 'Moderada-buena: polo sanitario del centro del país (Hospital de Urgencias, Hospital Córdoba, Hospital Privado, Sanatorio Allende) + Facultad de Ciencias Médicas de la UNC. Exigido ante un brote masivo.' },
      sanoInicial:      1499900,
      infectadoInicial: 100
    }
  },
];

// Datos cargados por ciudad: { dia, sanos, infectados, recuperados }
const datosCiudades = {};

/**
 * Parsea el CSV y calcula recuperados = max(0, N - sanos - infectados).
 * En Lotka-Volterra la población no se conserva, por eso se clampea a 0.
 */
function parsearCSV(texto, poblacionTotal) {
  const lineas = texto.trim().split('\n');
  const datos = [];

  for (let i = 1; i < lineas.length; i++) {
    const partes = lineas[i].split(',');
    if (partes.length < 3) continue;

    const sanos = parseFloat(partes[1]);
    const infectados = parseFloat(partes[2]);
    const recuperados = Math.max(0, poblacionTotal - sanos - infectados);

    datos.push({
      dia: parseInt(partes[0], 10),
      sanos,
      infectados,
      recuperados
    });
  }

  return datos;
}

function cargarCSVCiudad(ciudad) {
  return fetch(`data/${ciudad.id}.csv`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then(texto => {
      datosCiudades[ciudad.id] = parsearCSV(texto, ciudad.poblacionTotal);
      console.log(`✓ ${ciudad.nombre}: ${datosCiudades[ciudad.id].length} días`);
    })
    .catch(err => {
      console.warn(`⚠ ${ciudad.nombre} no disponible — ${err.message}`);
    });
}

function cargarTodasLasCiudades() {
  return Promise.all(CIUDADES.map(c => cargarCSVCiudad(c)));
}

function getCiudadesDisponibles() {
  return CIUDADES.filter(c => datosCiudades[c.id] != null);
}

/**
 * Estadísticas de comparación para la tabla:
 * pico, día pico, duración del brote, % de población afectada.
 */
function calcularEstadisticas(idCiudad) {
  const ciudad = CIUDADES.find(c => c.id === idCiudad);
  const datos = datosCiudades[idCiudad];
  if (!datos || datos.length === 0 || !ciudad) return null;

  // Pico de infectados
  let picoInfectados = 0;
  let diaPico = 0;
  for (const p of datos) {
    if (p.infectados > picoInfectados) {
      picoInfectados = p.infectados;
      diaPico = p.dia;
    }
  }

  // Duración del brote: días desde el pico hasta bajar al 1% del pico
  const umbral = picoInfectados * 0.01;
  let duracionBrote = datos[datos.length - 1].dia - diaPico;
  for (const p of datos) {
    if (p.dia > diaPico && p.infectados < umbral) {
      duracionBrote = p.dia - diaPico;
      break;
    }
  }

  const porcentajeAfectado = (picoInfectados / ciudad.poblacionTotal) * 100;

  return {
    picoInfectados: Math.round(picoInfectados),
    diaPico,
    duracionBrote,
    porcentajeAfectado
  };
}

/**
 * Métricas del modelo Lotka-Volterra para el panel de análisis.
 */
function calcularMetricas(idCiudad) {
  const ciudad = CIUDADES.find(c => c.id === idCiudad);
  const datos = datosCiudades[idCiudad];
  if (!datos || !ciudad) return null;

  const p = ciudad.params;
  const stats = calcularEstadisticas(idCiudad);

  // R0 estimado: número reproductivo básico (aproximación para Lotka-Volterra)
  const R0 = (p.beta.valor * p.sanoInicial) / p.gamma.valor;

  // Tasa de colapso: % de sanos perdidos en el momento del pico
  const sanoEnPico = datos.find(d => d.dia === stats.diaPico)?.sanos ?? p.sanoInicial;
  const tasaColapso = ((p.sanoInicial - sanoEnPico) / p.sanoInicial) * 100;

  // Día de cruce: primer día en que infectados superan a sanos
  let diaCruce = null;
  for (const d of datos) {
    if (d.infectados > d.sanos) { diaCruce = d.dia; break; }
  }

  // Ciclos de oscilación: cantidad de máximos locales por encima del 5% del pico
  const umbralCiclo = stats.picoInfectados * 0.05;
  let ciclos = 0;
  for (let i = 1; i < datos.length - 1; i++) {
    if (
      datos[i].infectados > datos[i - 1].infectados &&
      datos[i].infectados > datos[i + 1].infectados &&
      datos[i].infectados > umbralCiclo
    ) ciclos++;
  }

  return {
    R0: R0.toFixed(2),
    velocidadPropagacion: stats.diaPico,
    tasaColapso: tasaColapso.toFixed(1),
    diaCruce,
    ciclos
  };
}
