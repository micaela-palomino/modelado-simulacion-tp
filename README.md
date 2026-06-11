# Simulación de Pandemia — Modelo Lotka-Volterra Adaptado

**Materia:** Modelado y Simulación  
**Institución:** Universidad Argentina de la Empresa (UADE)  
**Tipo:** Trabajo Práctico Grupal Colaborativo  
**Desastre simulado:** Pandemia  

---

## Descripción

Este TP simula la propagación de una pandemia en distintas ciudades argentinas usando el modelo matemático de **Lotka-Volterra adaptado**. Cada subgrupo modela una ciudad diferente, y al final comparamos los resultados para concluir cuál ciudad es la más segura ante una pandemia.

La simulación corre en **Java** y los resultados se visualizan en un **dashboard web local** con Chart.js.

---

## Modelo Matemático: Lotka-Volterra para Pandemia

El modelo original de Lotka-Volterra describe la dinámica depredador-presa. En este TP lo reinterpretamos así:

| Rol original | Reinterpretación |
|---|---|
| **Presas** | Población sana de la ciudad |
| **Depredadores** | Población infectada / propagación del virus |

Las ecuaciones diferenciales que gobiernan el sistema son:

```
dS/dt = α·S - β·S·I
dI/dt = δ·S·I - γ·I
```

Donde:
- `S(t)` = población sana en el tiempo t  
- `I(t)` = población infectada en el tiempo t

---

## Parámetros del Modelo

| Parámetro | Nombre | Significado en pandemia | Efecto al aumentar |
|---|---|---|---|
| **α** (alpha) | Tasa de crecimiento poblacional | Velocidad de recuperación/reproducción de la población sana | Mayor resiliencia de la población sana |
| **β** (beta) | Tasa de contagio | Probabilidad de que un sano se infecte al contactar un infectado | Mayor velocidad de propagación |
| **δ** (delta) | Tasa de propagación viral | Eficiencia del virus para infectar al consumir población sana | Mayor explosividad del brote |
| **γ** (gamma) | Tasa de recuperación | Velocidad a la que los infectados se recuperan o mueren | Menor duración del brote |

> **Regla general:** ciudades con β y δ altos (alta densidad, poco acceso a salud) tendrán picos más altos de infección. Ciudades con γ alto (buen sistema de salud) se recuperan más rápido.

---

## Estructura del Repositorio

```
modelado-simulacion-tp/
├── src/
│   ├── core/
│   │   ├── LotkaVolterra.java        # Motor de simulación: ecuaciones + Runge-Kutta 4
│   │   └── SimulationResult.java     # Modelo de datos para un resultado diario
│   ├── cities/
│   │   └── lamatanza/
│   │       ├── LaMatanzaCity.java    # Parámetros y configuración de La Matanza
│   │       └── LaMatanzaConfig.json  # Parámetros numéricos externalizados
│   └── Main.java                     # Entry point: corre simulación y exporta CSVs
├── resources/
│   └── lamatanza/
│       └── results.csv               # CSV generado por la simulación
├── dashboard/
│   ├── index.html                    # Dashboard principal
│   ├── css/
│   │   └── styles.css               # Estilos del dashboard
│   ├── js/
│   │   ├── main.js                  # Lógica principal y coordinación
│   │   ├── charts.js                # Gráficos con Chart.js
│   │   ├── filters.js               # Filtros interactivos
│   │   └── loader.js                # Carga y parseo de CSVs
│   └── data/
│       └── lamatanza.csv            # CSV copiado automáticamente por Main.java
├── .vscode/
│   └── launch.json                  # Config para correr Java en VS Code
├── .gitignore
└── README.md
```

---

## Cómo Correr la Simulación (Java en VS Code)

### Requisitos
- Java JDK 11 o superior instalado
- Extensión **"Extension Pack for Java"** instalada en VS Code

### Pasos

1. Abrí el proyecto en VS Code:
   ```
   code modelado-simulacion-tp
   ```

2. Corré la simulación desde VS Code:
   - Presioná `F5` (usa la config de `.vscode/launch.json`)
   - O hacé clic en el botón ▶ que aparece sobre el método `main` en `Main.java`
   - O desde terminal:
     ```bash
     # Desde la raíz del proyecto
     javac -d out src/core/*.java src/cities/lamatanza/*.java src/Main.java
     java -cp out Main
     ```

3. La simulación genera automáticamente:
   - `resources/lamatanza/results.csv`
   - `dashboard/data/lamatanza.csv`

---

## Cómo Abrir el Dashboard

### Opción 1: Live Server (recomendado)
1. Instalá la extensión **"Live Server"** en VS Code
2. Clic derecho en `dashboard/index.html` → **"Open with Live Server"**
3. Se abre automáticamente en el browser en `http://127.0.0.1:5500`

### Opción 2: Directo en el browser
1. Abrí el explorador de archivos
2. Navegá a `dashboard/`
3. Doble clic en `index.html`

> **Nota:** Si abrís directo (sin servidor), el browser puede bloquear la carga de archivos locales (CORS). En ese caso, usá Live Server o ejecutá Chrome con `--allow-file-access-from-files`.

---

## Ciudades

Cada subgrupo modela una ciudad argentina distinta. El objetivo es cubrir distintos **tipos** de ciudad para que la comparación sea representativa.

### Ciudad asignada: La Matanza

| Dato | Valor |
|---|---|
| **Tipo** | Ciudad satélite / suburbio del AMBA |
| **Población** | ~1.75 millones de habitantes |
| **Densidad** | Muy alta (~2.800 hab/km²) |
| **Sistema de salud** | Bajo: depende de hospitales del AMBA, pocos centros propios |
| **Movilidad** | Altísima: miles de trabajadores viajan diariamente al AMBA |

**Justificación de parámetros:**
- `β` alto → alta densidad + transporte masivo = mucho contagio
- `δ` alto → el virus se propaga eficientemente en entornos congestionados
- `γ` bajo → pocos hospitales = recuperación lenta
- `α` medio → ciudad joven pero con alta movilidad hacia zonas de riesgo

---

### Ciudad asignada: Mar del Plata (Grupo 11)

| Dato | Valor |
|---|---|
| **Tipo** | Ciudad turística / balnearia |
| **Población** | ~650.000 habitantes |
| **Densidad** | Moderada-alta (~1.200 hab/km²) |
| **Sistema de salud** | Medio: Hospital Interzonal San Carlos de Borromée, red municipal y clínicas privadas |
| **Movilidad** | Alta estacional: millones de turistas en verano, trenes y micros desde Buenos Aires |

**Justificación de parámetros:**
- `β` alto → turismo veraniego masivo + playas, hoteles y boliches = mucho contagio
- `δ` medio-alto → aglomeración en costanera y espacios cerrados en temporada alta
- `γ` medio → mejor cobertura que ciudades aisladas, pero colapsa en enero-febrero
- `α` moderado → población estable con crecimiento por servicios turísticos

---

### Guía para elegir tu ciudad

Cada grupo debe elegir una ciudad de un **tipo diferente** para maximizar la diversidad de resultados:

| Tipo | Características clave | Ejemplos |
|---|---|---|
| **Metrópolis** | Altísima densidad, sistema de salud fuerte | Buenos Aires, Córdoba capital |
| **Turística** | Alta movilidad estacional, infraestructura variable | Bariloche, Ushuaia, Mar del Plata *(tomada)* |
| **Rural** | Baja densidad, sistema de salud limitado | Chascomús, Mercedes, General Pico |
| **Universitaria** | Alta densidad juvenil, movilidad estudiantil | La Plata, Rosario, Mendoza |
| **Industrial** | Alta densidad laboral, acceso a salud variable | Zárate, Campana, San Nicolás |
| **Fronteriza** | Alta movilidad internacional, acceso a salud limitado | Posadas, Puerto Iguazú, La Quiaca |
| **Aislada** | Muy baja densidad, difícil acceso a salud | Perito Moreno, Gobernador Gregores |
| **Satélite/Suburbio** | Alta densidad, dependiente de la metrópolis | La Matanza *(tomada)*, Quilmes, Lanús |

---

## Cómo Agregar una Ciudad Nueva

1. **Creá la carpeta de tu ciudad** en `src/cities/`:
   ```
   src/cities/nombredetuciudad/
   ├── NombreCiudadCity.java
   └── NombreCiudadConfig.json
   ```

2. **Copiá como base** `LaMatanzaCity.java` y ajustá los parámetros con justificación.

3. **Registrá tu ciudad en `Main.java`** siguiendo el patrón existente:
   ```java
   // Agregar después de La Matanza:
   NombreCiudadCity miCiudad = new NombreCiudadCity();
   miCiudad.ejecutarYExportar();
   ```

4. **Tu CSV se copia automáticamente** a `dashboard/data/nombredtuciudad.csv`.

5. **Registrá tu ciudad en el dashboard** agregando una entrada en `dashboard/js/loader.js`:
   ```javascript
   // En el array CIUDADES:
   { id: 'nombretuciudad', nombre: 'Nombre Ciudad', tipo: 'Tipo', color: '#HEX' }
   ```

6. **Hacé commit** de tu carpeta. No pisés archivos de otras ciudades.

---

## Conclusiones Esperadas al Final del TP

Al comparar todas las ciudades, esperamos poder responder:

- **¿Cuál ciudad tiene el pico de infectados más alto?** → Ciudades con alta densidad y bajo acceso a salud.
- **¿Cuál se recupera más rápido?** → Ciudades con buen sistema sanitario (γ alto).
- **¿Cuál es la más segura para vivir ante una pandemia?** → La que combina baja densidad, buen acceso a salud y baja movilidad foránea.
- **¿Qué tipo de ciudad es más vulnerable?** → Ciudades satélite y fronterizas con bajo sistema de salud.
- **¿El aislamiento geográfico protege o perjudica?** → Ciudades aisladas tienen menos contagio inicial pero peor recuperación.

> El dashboard compara automáticamente todas las ciudades y destaca la más segura según los datos simulados.

---

## Integrantes

| Subgrupo | Ciudad | Integrantes |
|---|---|---|
| Grupo 1 | La Matanza | *(completar)* |
| Grupo 2 | Bariloche | Madary Fernandez, Rodrigo Larrart |
| Grupo 3 | *(elegir ciudad)* | *(completar)* |
| Grupo 4 | *(elegir ciudad)* | *(completar)* |
| Grupo 5 | La Plata | Federico Pelech, Fernando Ale, Tatiana Tornillo |
| Grupo 6 | *(elegir ciudad)* | *(completar)* |
| Grupo 11 | Mar del Plata | Grupo 11 |
