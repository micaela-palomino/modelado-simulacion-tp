import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

/**
 * Configuración de la simulación para Bariloche (San Carlos de Bariloche, Río Negro).
 *
 * Características que justifican los parámetros:
 *  - Población: ~133.000 habitantes permanentes
 *  - Turismo: recibe entre 500.000 y 1.000.000 de turistas por año, con picos en
 *    temporada de nieve (julio) y verano patagónico (enero/febrero)
 *  - Alta movilidad estacional: el ingreso/egreso masivo de visitantes amplifica
 *    el vector de contagio durante temporadas altas → β elevado
 *  - Sistema de salud: Hospital Zonal Ramón Carrillo es el único hospital público
 *    de referencia para una región de ~150.000 km². Capacidad limitada para
 *    atender picos de demanda → γ bajo
 *  - Aislamiento geográfico: a 1.650 km de Buenos Aires. Dificulta derivaciones
 *    de casos graves y retrasa el arribo de recursos sanitarios → γ se mantiene bajo
 *  - Densidad poblacional baja (~500 hab/km²) pero concentrada en el ejido urbano
 *    y centros de ski (Cerro Catedral) → δ medio
 */
public class BarilocheCity {

    // --- Parámetros del modelo Lotka-Volterra ---

    // α = 0.03: crecimiento moderado. Población relativamente estable,
    //           con crecimiento por migración interna (turismo que se asienta).
    private static final double ALPHA = 0.03;

    // β = 0.00000085: contagio alto en temporada turística. La mezcla de
    //                 población local con turistas de todo el mundo durante los
    //                 picos de ski y verano dispara el contacto entre sanos e infectados.
    private static final double BETA = 0.00000085;

    // δ = 0.00000070: propagación viral media-alta. Concentración en refugios,
    //                 hoteles, remontadores y transporte turístico genera focos
    //                 cerrados de alta transmisión durante temporada.
    private static final double DELTA = 0.00000070;

    // γ = 0.040: recuperación baja. Un único hospital zonal para toda la región
    //            patagónica norte. Ante un brote masivo en temporada alta, el sistema
    //            colapsa rápidamente y las derivaciones a Neuquén o Buenos Aires
    //            demoran la atención.
    private static final double GAMMA = 0.040;

    // Condiciones iniciales: 133.000 habitantes, brote inicial con 50 infectados
    // (consistente con el ingreso de un grupo turístico portador del virus)
    private static final double POBLACION_SANA_INICIAL = 132_950;
    private static final double POBLACION_INFECTADA_INICIAL = 50;

    private static final int DIAS_SIMULACION = 365;

    private static final String NOMBRE_CIUDAD = "bariloche";

    // Rutas de salida de los CSVs
    private static final String RUTA_RESOURCES = "resources/bariloche/results.csv";
    private static final String RUTA_DASHBOARD  = "dashboard/data/bariloche.csv";

    /**
     * Ejecuta la simulación de Bariloche, exporta el CSV a resources/
     * y copia el resultado a dashboard/data/ para el dashboard web.
     */
    public void ejecutarYExportar() {
        System.out.println("=== Simulando: Bariloche ===");
        System.out.printf("Parámetros: α=%.4f, β=%.10f, δ=%.10f, γ=%.4f%n",
                ALPHA, BETA, DELTA, GAMMA);

        // Crear el motor de simulación con los parámetros de Bariloche
        LotkaVolterra simulacion = new LotkaVolterra(
                ALPHA, BETA, DELTA, GAMMA,
                POBLACION_SANA_INICIAL,
                POBLACION_INFECTADA_INICIAL
        );

        // Ejecutar simulación por 365 días
        List<SimulationResult> resultados = simulacion.ejecutarSimulacion(DIAS_SIMULACION);

        // Mostrar estadísticas en consola
        SimulationResult pico = simulacion.getPicoMaximoInfectados();
        if (pico != null) {
            System.out.printf("Pico máximo de infectados: %.0f el día %d%n",
                    pico.getPoblacionInfectada(), pico.getDia());
        }

        // Exportar CSV principal en resources/
        simulacion.exportarCSV(RUTA_RESOURCES);

        // Copiar el mismo CSV a dashboard/data/ para que el dashboard lo pueda leer
        copiarCSVAlDashboard();

        System.out.println("Simulación de Bariloche completada.\n");
    }

    /**
     * Copia el CSV generado a la carpeta del dashboard.
     * Así el dashboard web siempre tiene datos actualizados sin pasos manuales.
     */
    private void copiarCSVAlDashboard() {
        try {
            Path origen  = Paths.get(RUTA_RESOURCES);
            Path destino = Paths.get(RUTA_DASHBOARD);

            // Asegurar que el directorio de destino existe
            destino.getParent().toFile().mkdirs();

            Files.copy(origen, destino, StandardCopyOption.REPLACE_EXISTING);
            System.out.println("CSV copiado al dashboard: " + RUTA_DASHBOARD);

        } catch (IOException e) {
            System.err.println("Error al copiar CSV al dashboard: " + e.getMessage());
        }
    }

    // Getters para acceder a los parámetros si fuera necesario
    public double getAlpha()        { return ALPHA; }
    public double getBeta()         { return BETA; }
    public double getDelta()        { return DELTA; }
    public double getGamma()        { return GAMMA; }
    public String getNombreCiudad() { return NOMBRE_CIUDAD; }
}
