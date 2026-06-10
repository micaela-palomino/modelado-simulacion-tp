import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

/**
 * Configuración de la simulación para el Gran Mendoza (Área Metropolitana de Mendoza).
 *
 * Características que justifican los parámetros:
 *  - Población: ~1.1 millones (4ª área metropolitana del país)
 *  - Densidad: ~600 hab/km² (moderada, mucho menor que el AMBA)
 *  - Ciudad universitaria y turística: alta movilidad estudiantil + turismo de ski
 *    y vendimia → β moderado-alto
 *  - Sistema de salud: Hospital Central de Mendoza (referencia regional),
 *    red de hospitales provinciales y sector privado desarrollado → γ moderado-alto
 *  - Clima seco y baja humedad: ventilación natural más efectiva que en
 *    ciudades costeras o del AMBA → δ moderado
 */
public class MendozaCity {

    // --- Parámetros del modelo Lotka-Volterra ---

    // α = 0.025: crecimiento moderado. Población estable, menos dinámica que
    //            La Matanza pero con renovación constante por estudiantes universitarios.
    private static final double ALPHA = 0.025;

    // β = 0.000000090: contagio moderado-alto. Menor densidad que el AMBA pero
    //                  turismo de temporada (ski, vendimia) y movilidad universitaria
    //                  generan picos de contacto estacionales.
    private static final double BETA = 0.000000090;

    // δ = 0.000000075: propagación viral moderada. Clima seco y menor hacinamiento
    //                  respecto al AMBA reducen la eficiencia del virus, aunque
    //                  los espacios cerrados en invierno la compensan.
    private static final double DELTA = 0.000000075;

    // γ = 0.075: recuperación moderada-buena. El Hospital Central y la red provincial
    //            brindan mejor cobertura que La Matanza, aunque la capacidad es
    //            limitada ante un brote masivo en toda el área metropolitana.
    private static final double GAMMA = 0.075;

    // Condiciones iniciales: 1.1M de habitantes, brote inicial con 100 infectados
    private static final double POBLACION_SANA_INICIAL = 1_099_900;
    private static final double POBLACION_INFECTADA_INICIAL = 100;

    private static final int DIAS_SIMULACION = 365;

    private static final String NOMBRE_CIUDAD = "mendoza";

    private static final String RUTA_RESOURCES = "resources/mendoza/results.csv";
    private static final String RUTA_DASHBOARD  = "dashboard/data/mendoza.csv";

    /**
     * Ejecuta la simulación del Gran Mendoza, exporta el CSV a resources/
     * y copia el resultado a dashboard/data/ para el dashboard web.
     */
    public void ejecutarYExportar() {
        System.out.println("=== Simulando: Gran Mendoza ===");
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

        System.out.println("Simulación del Gran Mendoza completada.\n");
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

    public double getAlpha() { return ALPHA; }
    public double getBeta()  { return BETA;  }
    public double getDelta() { return DELTA; }
    public double getGamma() { return GAMMA; }
    public String getNombreCiudad() { return NOMBRE_CIUDAD; }
}
