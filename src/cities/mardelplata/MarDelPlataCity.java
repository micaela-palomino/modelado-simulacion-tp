import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

/**
 * Configuración de la simulación para Mar del Plata (General Pueyrredón, PBA).
 *
 * Características que justifican los parámetros:
 *  - Población: ~650.000 habitantes permanentes
 *  - Turismo: recibe más de 7 millones de visitantes por año, con pico masivo
 *    en verano (enero-febrero) que puede triplicar la población efectiva
 *  - Alta movilidad estacional: trenes desde Constitución, micros interurbanos
 *    y concentración en playas, bares y hoteles → β elevado
 *  - Sistema de salud: Hospital Interzonal San Carlos de Borromée como referencia,
 *    red municipal y clínicas privadas. Mejor que ciudades aisladas, pero colapsa
 *    ante la demanda estacional → γ medio
 *  - Densidad urbana moderada-alta (~1.200 hab/km²) con focos de aglomeración
 *    en la costanera y centro nocturno → δ media-alta
 */
public class MarDelPlataCity {

    // --- Parámetros del modelo Lotka-Volterra ---

    // α = 0.027: crecimiento moderado. Población estable con leve crecimiento
    //            por servicios turísticos, sin el dinamismo demográfico del AMBA.
    private static final double ALPHA = 0.027;

    // β = 0.00000042: contagio alto en temporada veraniega. La mezcla de
    //                 residentes con millones de turistas en playas, hoteles
    //                 y transporte público dispara el contacto entre sanos e infectados.
    private static final double BETA = 0.00000042;

    // δ = 0.00000035: propagación viral media-alta. Concentración en la costanera,
    //                 boliches, hoteles y colectivos saturados en enero genera
    //                 focos cerrados de alta transmisión durante temporada alta.
    private static final double DELTA = 0.00000035;

    // γ = 0.055: recuperación media. Hospital Interzonal y red provincial
    //            ofrecen mejor cobertura que ciudades satélite o patagónicas,
    //            pero la demanda estacional supera la capacidad instalada.
    private static final double GAMMA = 0.055;

    // Condiciones iniciales: 650.000 habitantes, brote inicial con 100 infectados
    // (ingreso del virus al inicio de la temporada turística)
    private static final double POBLACION_SANA_INICIAL = 649_900;
    private static final double POBLACION_INFECTADA_INICIAL = 100;

    private static final int DIAS_SIMULACION = 365;

    private static final String NOMBRE_CIUDAD = "mardelplata";

    private static final String RUTA_RESOURCES = "resources/mardelplata/results.csv";
    private static final String RUTA_DASHBOARD  = "dashboard/data/mardelplata.csv";

    /**
     * Ejecuta la simulación de Mar del Plata, exporta el CSV a resources/
     * y copia el resultado a dashboard/data/ para el dashboard web.
     */
    public void ejecutarYExportar() {
        System.out.println("=== Simulando: Mar del Plata ===");
        System.out.printf("Parámetros: α=%.4f, β=%.10f, δ=%.10f, γ=%.4f%n",
                ALPHA, BETA, DELTA, GAMMA);

        LotkaVolterra simulacion = new LotkaVolterra(
                ALPHA, BETA, DELTA, GAMMA,
                POBLACION_SANA_INICIAL,
                POBLACION_INFECTADA_INICIAL
        );

        List<SimulationResult> resultados = simulacion.ejecutarSimulacion(DIAS_SIMULACION);

        SimulationResult pico = simulacion.getPicoMaximoInfectados();
        if (pico != null) {
            System.out.printf("Pico máximo de infectados: %.0f el día %d%n",
                    pico.getPoblacionInfectada(), pico.getDia());
        }

        simulacion.exportarCSV(RUTA_RESOURCES);
        copiarCSVAlDashboard();

        System.out.println("Simulación de Mar del Plata completada.\n");
    }

    private void copiarCSVAlDashboard() {
        try {
            Path origen  = Paths.get(RUTA_RESOURCES);
            Path destino = Paths.get(RUTA_DASHBOARD);

            destino.getParent().toFile().mkdirs();

            Files.copy(origen, destino, StandardCopyOption.REPLACE_EXISTING);
            System.out.println("CSV copiado al dashboard: " + RUTA_DASHBOARD);

        } catch (IOException e) {
            System.err.println("Error al copiar CSV al dashboard: " + e.getMessage());
        }
    }

    public double getAlpha()        { return ALPHA; }
    public double getBeta()         { return BETA; }
    public double getDelta()        { return DELTA; }
    public double getGamma()        { return GAMMA; }
    public String getNombreCiudad() { return NOMBRE_CIUDAD; }
}
