
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

/**
 * Configuración de la simulación para La Plata (Capital provincial, PBA).
 *
 * Características que justifican los parámetros:
 *  - Población: ~800.000 (ciudad intermedia, capital administrativa)
 *  - Tipo: capital provincial y ciudad universitaria con flujo
 *    constante de estudiantes y trabajadores
 *  - Estructura urbana: barrios densos, centros comerciales, universidades
 *    y transporte público frecuente, combinados con zonas residenciales
 *    menos saturadas y espacios abiertos (parques, diagonales)
 *  - Sistema de salud: varios hospitales de referencia, clínicas privadas
 *    y facultades de ciencias de la salud → γ relativamente alto
 */
public class LaPlataCity {

    // --- Parámetros del modelo Lotka-Volterra ---

    // α = 0.025: crecimiento moderado. Ciudad universitaria con población
    //            estable y flujo de estudiantes/trabajadores que suaviza
    //            tanto el crecimiento natural como la migración neta.
    private static final double ALPHA = 0.025;

    // β = 0.000000225: contagio moderado. Barrios densos y transporte
    //                  público frecuente generan contactos cercanos, aunque
    //                  zonas residenciales menos saturadas y espacios abiertos
    //                  atenúan el efecto.
    private static final double BETA = 0.000000225;

    // δ = 0.0000001875: propagación viral moderada. Concentración de
    //                   personas en facultades, oficinas públicas y transporte
    //                   interurbano, limitada por parques y diagonales amplias.
    //                   Resulta en R0 ≈ 2.5 (brote moderado vs. La Matanza R0 ≈ 3.9).
    private static final double DELTA = 0.0000001875;

    // γ = 0.06: recuperación relativamente alta. Varios hospitales de
    //           referencia, clínicas privadas y presencia de facultades
    //           de ciencias de la salud mejoran el acceso a tratamiento.
    private static final double GAMMA = 0.06;

    // Condiciones iniciales: 800K de habitantes, brote inicial con 100 infectados
    private static final double POBLACION_SANA_INICIAL = 799_900;
    private static final double POBLACION_INFECTADA_INICIAL = 100;

    private static final int DIAS_SIMULACION = 365;

    private static final String NOMBRE_CIUDAD = "laplata";

    // Rutas de salida de los CSVs
    private static final String RUTA_RESOURCES = "resources/laplata/results.csv";
    private static final String RUTA_DASHBOARD = "dashboard/data/laplata.csv";

    /**
     * Ejecuta la simulación de La Plata, exporta el CSV a resources/
     * y copia el resultado a dashboard/data/ para el dashboard web.
     */
    public void ejecutarYExportar() {
        System.out.println("=== Simulando: La Plata ===");
        System.out.printf("Parámetros: α=%.4f, β=%.10f, δ=%.10f, γ=%.4f%n",
                ALPHA, BETA, DELTA, GAMMA);

        // Crear el motor de simulación con los parámetros de La Plata
        LotkaVolterra simulacion = new LotkaVolterra(
                ALPHA, BETA, DELTA, GAMMA,
                POBLACION_SANA_INICIAL,
                POBLACION_INFECTADA_INICIAL
        );

        // Ejecutar simulación por la cantidad de días configurados
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

        System.out.println("Simulación de La Plata completada.\n");
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
