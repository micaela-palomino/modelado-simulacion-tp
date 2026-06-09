import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

/**
 * Configuración de la simulación para La Matanza (Partido de La Matanza, PBA).
 *
 * Características que justifican los parámetros:
 *  - Población: ~1.75 millones (uno de los partidos más poblados del país)
 *  - Densidad: ~2.800 hab/km² → contagio muy alto
 *  - Transporte: miles de trabajadores se movilizan diariamente al AMBA
 *    (trenes Roca/Belgrano Sur, líneas de colectivos) → β elevado
 *  - Sistema de salud: 3 hospitales públicos principales para 1.75M de hab.
 *    Sin hospitales de alta complejidad propios → γ bajo
 *  - Hacinamiento: muchas zonas con viviendas precarias y poca ventilación → δ alto
 */
public class LaMatanzaCity {

    // --- Parámetros del modelo Lotka-Volterra ---

    // α = 0.03: crecimiento moderado. Ciudad joven con alta natalidad,
    //           pero la alta exposición limita la recuperación natural.
    private static final double ALPHA = 0.03;

    // β = 0.00000012: contagio alto. Alta densidad + transporte masivo
    //                 = mucho contacto entre sanos e infectados por día.
    private static final double BETA = 0.00000012;

    // δ = 0.00000010: propagación viral alta. Entornos congestionados
    //                 y hacinamiento potencian la eficiencia del virus.
    private static final double DELTA = 0.00000010;

    // γ = 0.045: recuperación baja. Pocos hospitales propios.
    //            Colapso rápido del sistema ante un brote masivo.
    private static final double GAMMA = 0.045;

    // Condiciones iniciales: 1.75M de habitantes, brote inicial con 100 infectados
    private static final double POBLACION_SANA_INICIAL = 1_749_900;
    private static final double POBLACION_INFECTADA_INICIAL = 100;

    private static final int DIAS_SIMULACION = 365;

    private static final String NOMBRE_CIUDAD = "lamatanza";

    // Rutas de salida de los CSVs
    private static final String RUTA_RESOURCES = "resources/lamatanza/results.csv";
    private static final String RUTA_DASHBOARD = "dashboard/data/lamatanza.csv";

    /**
     * Ejecuta la simulación de La Matanza, exporta el CSV a resources/
     * y copia el resultado a dashboard/data/ para el dashboard web.
     */
    public void ejecutarYExportar() {
        System.out.println("=== Simulando: La Matanza ===");
        System.out.printf("Parámetros: α=%.4f, β=%.10f, δ=%.10f, γ=%.4f%n",
                ALPHA, BETA, DELTA, GAMMA);

        // Crear el motor de simulación con los parámetros de La Matanza
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

        System.out.println("Simulación de La Matanza completada.\n");
    }

    /**
     * Copia el CSV generado a la carpeta del dashboard.
     * Así el dashboard web siempre tiene datos actualizados sin pasos manuales.
     */
    private void copiarCSVAlDashboard() {
        try {
            Path origen = Paths.get(RUTA_RESOURCES);
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
    public double getAlpha() { return ALPHA; }
    public double getBeta() { return BETA; }
    public double getDelta() { return DELTA; }
    public double getGamma() { return GAMMA; }
    public String getNombreCiudad() { return NOMBRE_CIUDAD; }
}
