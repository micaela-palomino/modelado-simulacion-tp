import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

/**
 * Configuración de la simulación para El Bolsón (Provincia de Río Negro).
 *
 * Características que justifican los parámetros:
 * - Población: ~25.000 habitantes fijos (comunidad rural y turística pequeña).
 * - Densidad: Muy baja, gran parte de la población vive dispersa en chacras 
 * y zonas de montaña → contacto inicial y cotidiano bajo.
 * - Transporte y Movilidad: Movilidad principalmente local y en vehículos 
 * particulares. Tránsito interurbano reducido fuera de temporada → β (tasa de contagio) baja.
 * - Sistema de salud: Hospital de área de complejidad media-baja. Fuerte 
 * dependencia de derivaciones a Bariloche para casos de terapia intensiva → γ (tasa de recuperación) baja.
 * - Vivienda y Entorno: Baja tasa de hacinamiento, viviendas muy distanciadas 
 * entre sí y alta frecuencia de actividades al aire libre → δ (propagación/impacto viral) muy baja y α (resiliencia) moderada.
 */
public class ElBolsonCity {



    // --- Parámetros del modelo Lotka-Volterra ---

    // α = 0.04: resiliencia moderada. Entorno natural y saludable,
    //           pero con recursos limitados para una recuperación acelerada.
    private static final double ALPHA = 0.04;

    // β = 0.02: contagio bajo. Población dispersa en chacras y zonas
    //           rurales, sin transporte público masivo.
    private static final double BETA = 0.02;

    // δ = 0.015: propagación viral muy baja. Espacios abiertos y 
    //            ausencia de hacinamiento dificultan el avance rápido del virus.
    private static final double DELTA = 0.015;

    // γ = 0.025: recuperación baja. Hospital local de complejidad media-baja.
    //            Dependencia de derivaciones a Bariloche para casos graves.
    private static final double GAMMA = 0.025;

    // Condiciones iniciales: ~25.000 habitantes, brote inicial contenido con 10 infectados
    private static final double POBLACION_SANA_INICIAL = 24_990;
    private static final double POBLACION_INFECTADA_INICIAL = 10;

    private static final int DIAS_SIMULACION = 365;

    private static final String NOMBRE_CIUDAD = "elbolson";

    // Rutas de salida de los CSVs
    private static final String RUTA_RESOURCES = "resources/elbolson/results.csv";
    private static final String RUTA_DASHBOARD = "dashboard/data/elbolson.csv";

    /**
     * Ejecuta la simulación de El Bolsón, exporta el CSV a resources/
     * y copia el resultado a dashboard/data/ para el dashboard web.
     */
    public void ejecutarYExportar() {
        System.out.println("=== Simulando: El Bolsón ===");
        System.out.printf("Parámetros: α=%.4f, β=%.10f, δ=%.10f, γ=%.4f%n",
                ALPHA, BETA, DELTA, GAMMA);

        // Crear el motor de simulación con los parámetros de El Bolsón
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

        System.out.println("Simulación de El Bolsón completada.\n");
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
