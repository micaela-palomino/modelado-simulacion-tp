/**
 * loader.js â€” Carga, parseo y mÃ©tricas de los datos de cada ciudad.
 *
 * Para agregar una ciudad nueva:
 *   1. Agregar entrada en el array CIUDADES con sus params y colores
 *   2. Colocar su CSV en dashboard/data/<id>.csv
 */

const CIUDADES = [
  {
    id: 'lamatanza',
    nombre: 'La Matanza',
    tipo: 'SatÃ©lite / Suburbio AMBA',
    color: '#e74c3c',             // infectados
    colorSanos: '#3498db',        // sanos
    colorRecuperados: '#27ae60',  // recuperados
    poblacionTotal: 1750000,
    params: {
      alpha: { valor: 0.03, label: 'Î± â€” Crecimiento sano', desc: 'Ciudad joven con alta natalidad, pero alta exposiciÃ³n y movilidad limitan la recuperaciÃ³n natural de la poblaciÃ³n.' },
      beta: { valor: 0.00000012, label: 'Î² â€” Tasa de contagio', desc: 'Alta densidad (~2.800 hab/kmÂ²) + transporte masivo (trenes Roca, Belgrano Sur, cientos de lÃ­neas de colectivos) = contacto permanente entre sanos e infectados.' },
      delta: { valor: 0.00000010, label: 'Î´ â€” PropagaciÃ³n viral', desc: 'Hacinamiento residencial y mala ventilaciÃ³n en viviendas precarias y transporte pÃºblico potencian la eficiencia del virus.' },
      gamma: { valor: 0.045, label: 'Î³ â€” RecuperaciÃ³n', desc: 'Solo ~3 hospitales pÃºblicos principales para 1.75M de habitantes. Sin alta complejidad propia; depende del sistema sanitario del AMBA.' },
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
      alpha: { valor: 0.025, label: 'Î± â€” Crecimiento sano', desc: 'Tasa de crecimiento moderada. Ciudad universitaria con poblaciÃ³n estable y flujo de estudiantes/trabajadores que suaviza el crecimiento natural y la migraciÃ³n neta.' },
      beta: { valor: 0.000000225, label: 'Î² â€” Tasa de contagio', desc: 'Contagio moderado. Barrios densos, universidades y transporte pÃºblico frecuente generan contactos cercanos, atenuados por zonas residenciales menos saturadas y espacios abiertos.' },
      delta: { valor: 0.0000001875, label: 'Î´ â€” PropagaciÃ³n viral', desc: 'PropagaciÃ³n moderada. ConcentraciÃ³n en facultades, oficinas pÃºblicas y transporte interurbano, limitada por parques y diagonales amplias. R0 â‰ˆ 2.5.' },
      gamma: { valor: 0.06, label: 'Î³ â€” RecuperaciÃ³n', desc: 'RecuperaciÃ³n relativamente alta. Hospitales de referencia, clÃ­nicas privadas y presencia de facultades de ciencias de la salud mejoran el acceso a tratamiento.' },
      sanoInicial: 799900,
      infectadoInicial: 100
    }
  },
  {
    id: 'mendoza',
    nombre: 'Gran Mendoza',
    tipo: 'Universitaria / TurÃ­stica',
    color: '#8e44ad',
    colorSanos: '#2980b9',
    colorRecuperados: '#1abc9c',
    poblacionTotal: 1100000,
    params: {
      alpha: { valor: 0.025,        label: 'Î± â€” Crecimiento sano',  desc: 'PoblaciÃ³n metropolitana estable con renovaciÃ³n constante por la comunidad universitaria (UNCuyo, UTN, UM), sin el dinamismo demogrÃ¡fico extremo del AMBA.' },
      beta:  { valor: 0.000000090,  label: 'Î² â€” Tasa de contagio',  desc: 'Densidad moderada (~600 hab/kmÂ²), pero el turismo estacional (ski, vendimia) y la alta movilidad estudiantil generan picos de contacto que elevan el contagio.' },
      delta: { valor: 0.000000075,  label: 'Î´ â€” PropagaciÃ³n viral', desc: 'Clima seco andino y menor humedad favorecen la ventilaciÃ³n natural. Los espacios cerrados en invierno compensan parcialmente esta ventaja.' },
      gamma: { valor: 0.075,        label: 'Î³ â€” RecuperaciÃ³n',      desc: 'Hospital Central de Mendoza como referencia regional + red provincial (Lagomaggiore, Schestakow) + sector privado desarrollado. Mejor cobertura que ciudades satÃ©lite del AMBA.' },
      sanoInicial:      1099900,
      infectadoInicial: 100
    }
  },
  // --- Agregar ciudades nuevas debajo ---
  {
    id: 'bariloche',
    nombre: 'Bariloche',
    tipo: 'TurÃ­stica / PatagÃ³nica',
    color: '#9b59b6',
    colorSanos: '#2980b9',
    colorRecuperados: '#1abc9c',
    poblacionTotal: 133000,
    params: {
      alpha: { valor: 0.03,        label: 'Î± â€” Crecimiento sano',   desc: 'PoblaciÃ³n estable con crecimiento moderado por migraciÃ³n. Ciudad joven que atrae residentes del sector turÃ­stico y servicios.' },
      beta:  { valor: 0.00000085,  label: 'Î² â€” Tasa de contagio',   desc: 'Alta por el flujo turÃ­stico estacional: entre 500.000 y 1.000.000 de visitantes anuales concentrados en temporadas de ski y verano generan contacto intenso con la poblaciÃ³n local.' },
      delta: { valor: 0.00000070,  label: 'Î´ â€” PropagaciÃ³n viral',  desc: 'Media-alta por la concentraciÃ³n en espacios cerrados durante temporada alta: hoteles, refugios de montaÃ±a, telefÃ©ricos y transporte turÃ­stico.' },
      gamma: { valor: 0.040,       label: 'Î³ â€” RecuperaciÃ³n',       desc: 'Baja: el Hospital Zonal RamÃ³n Carrillo es el Ãºnico hospital pÃºblico de referencia para ~150.000 kmÂ² de regiÃ³n. Aislamiento geogrÃ¡fico (1.650 km de CABA) retrasa derivaciones y refuerzos.' },
      sanoInicial:      132950,
      infectadoInicial: 50
    }
  },
];

// Datos cargados por ciudad: { dia, sanos, infectados, recuperados }
const datosCiudades = {};

/**
 * Parsea el CSV y calcula recuperados = max(0, N - sanos - infectados).
 * En Lotka-Volterra la poblaciÃ³n no se conserva, por eso se clampea a 0.
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
      console.log(`âœ“ ${ciudad.nombre}: ${datosCiudades[ciudad.id].length} dÃ­as`);
    })
    .catch(err => {
      console.warn(`âš  ${ciudad.nombre} no disponible â€” ${err.message}`);
    });
}

function cargarTodasLasCiudades() {
  return Promise.all(CIUDADES.map(c => cargarCSVCiudad(c)));
}

function getCiudadesDisponibles() {
  return CIUDADES.filter(c => datosCiudades[c.id] != null);
}

/**
 * EstadÃ­sticas de comparaciÃ³n para la tabla:
 * pico, dÃ­a pico, duraciÃ³n del brote, % de poblaciÃ³n afectada.
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

  // DuraciÃ³n del brote: dÃ­as desde el pico hasta bajar al 1% del pico
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
 * MÃ©tricas del modelo Lotka-Volterra para el panel de anÃ¡lisis.
 */
function calcularMetricas(idCiudad) {
  const ciudad = CIUDADES.find(c => c.id === idCiudad);
  const datos = datosCiudades[idCiudad];
  if (!datos || !ciudad) return null;

  const p = ciudad.params;
  const stats = calcularEstadisticas(idCiudad);

  // R0 estimado: nÃºmero reproductivo bÃ¡sico (aproximaciÃ³n para Lotka-Volterra)
  const R0 = (p.beta.valor * p.sanoInicial) / p.gamma.valor;

  // Tasa de colapso: % de sanos perdidos en el momento del pico
  const sanoEnPico = datos.find(d => d.dia === stats.diaPico)?.sanos ?? p.sanoInicial;
  const tasaColapso = ((p.sanoInicial - sanoEnPico) / p.sanoInicial) * 100;

  // DÃ­a de cruce: primer dÃ­a en que infectados superan a sanos
  let diaCruce = null;
  for (const d of datos) {
    if (d.infectados > d.sanos) { diaCruce = d.dia; break; }
  }

  // Ciclos de oscilaciÃ³n: cantidad de mÃ¡ximos locales por encima del 5% del pico
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
