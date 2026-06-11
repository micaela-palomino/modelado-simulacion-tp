# Análisis complementario — Bariloche
**Grupo 2:** Madary Fernandez, Rodrigo Larrart  
**Ciudad:** San Carlos de Bariloche, Río Negro  
**Tipo:** Turística / Patagónica

---

## Qué contiene este análisis

Este directorio complementa la simulación Java con un script Python que realiza:

1. **Reproducción validada del modelo RK4** — misma lógica que `LotkaVolterra.java`, en Python, para verificar resultados
2. **Análisis de sensibilidad de parámetros** — cómo cambia el brote bajo distintos escenarios reales de Bariloche
3. **Generación de gráficos exportables** para el informe

---

## Resultados de la simulación base

| Métrica | Valor |
|---|---|
| R₀ estimado (β × N / γ) | **2.83** |
| Pico de infectados | **29.883 hab.** |
| Día del pico | **Día 158** |
| % de población en el pico | **22.5%** |
| Sanos al día 365 | 64.620 |
| Infectados al día 365 | 16.388 |
| Punto de equilibrio S* | 57.143 hab. |
| Punto de equilibrio I* | 35.294 hab. |

**Interpretación del comportamiento:** el sistema no converge en 365 días — la trayectoria en el diagrama de fase orbita alrededor del punto de equilibrio sin colapsar. Esto indica que el virus se volvería **endémico** en Bariloche bajo las condiciones modeladas: el bajo γ (sistema de salud limitado) no logra extinguir el patógeno en el horizonte simulado.

---

## Escenarios analizados

| Escenario | Justificación real | R₀ | Pico | % Pob. |
|---|---|---|---|---|
| Base (temporada normal) | Parámetros calibrados | 2.83 | 29.883 | 22.5% |
| Pico de ski (β +50%) | Julio: arribo masivo de turistas, cerro Catedral lleno | 4.24 | 21.419 | 16.1% |
| Sin turistas (β −60%) | Pandemia previa que frena el turismo (ej. escenario 2020) | 1.13 | 56.338 | 42.4% |
| Hospital reforzado (γ ×2) | Apertura de un segundo hospital zonal o refuerzo externo | 1.41 | 2.793 | 2.1% |
| Doble impacto (β+50%, γ×2) | Pico de ski + hospital reforzado simultáneamente | 2.12 | 2.276 | 1.7% |

### Hallazgos clave del análisis de sensibilidad

- **Mejorar γ (sistema de salud) es la intervención más eficiente.** Duplicar la capacidad hospitalaria reduce el pico de 29.883 a solo 2.793 infectados (−91%), bajando R₀ por debajo del umbral crítico de 1.5.
- **β alto en temporada de ski genera un pico menor en valor absoluto** pero más rápido. Esto parece contraintuitivo pero tiene sentido matemático: con más contacto, el virus "quema" más rápido la población susceptible y el pico cae antes, aunque el sistema colapsa antes.
- **Sin turistas, el pico es mayor.** Con β bajo, el virus avanza lento pero la población no desarrolla inmunidad rápidamente y el pico termina siendo más alto y más tardío.

---

## Gráficos generados

- `bariloche_base.png` — Simulación base: sanos, infectados y recuperados a lo largo de 365 días
- `bariloche_sensibilidad.png` — Comparación de escenarios: curvas de infectados + diagrama de fase

---

## Cómo ejecutar

```bash
# Requiere: numpy, matplotlib
pip install numpy matplotlib

# Desde la raíz del proyecto:
python src/cities/bariloche/analysis/bariloche_analysis.py
```

Los gráficos se generan en el directorio donde se ejecuta el script.

---

## Conexión con los contenidos de la materia

| Tema (clase Cáceres) | Aplicación en este TP |
|---|---|
| **Clase 6 — Runge-Kutta** | Motor de integración numérica (`LotkaVolterra.java` + `bariloche_analysis.py`) — RK4 con h=1 día |
| **Clase 7 — Sistemas Dinámicos** | El modelo Lotka-Volterra es un sistema dinámico autónomo de 2 ecuaciones acopladas |
| **Clase 8 — Bifurcaciones** | El umbral R₀=1 es una bifurcación: para R₀<1 el punto fijo infectados=0 es estable; para R₀>1 se vuelve inestable y aparece el brote |
| **Clase 9 — Sistemas lineales 2D** | Análisis local del punto de equilibrio (S*, I*): los autovalores de la jacobiana determinan si el sistema orbita o converge |
| **Clase 11 — Sistemas no lineales** | El modelo completo es no lineal (términos S·I); el análisis de sensibilidad explora el espacio de parámetros |
