import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

/**
 * Configuración de la simulación para el Gran Córdoba (Área Metropolitana de Córdoba).
 *
 * Características que justifican los parámetros:
 *  - Población: ~1.5 millones (2ª área metropolitana del país)
 *  - Densidad urbana alta en el casco céntrico, con gran movilidad cotidiana
 *    (colectivos urbanos, Nuevo Centro, microcentro) → β alto
 *  - "La Docta": ciudad universitaria por excelencia (UNC, UTN, varias privadas)
 *    con cientos de miles de estudiantes que generan contacto intenso → β/δ altos
 *  - Sistema de salud: referencia regional del centro del país. Hospital de
 *    Urgencias, Hospital Córdoba, Hospital Privado, Sanatorio Allende y la
 *    Facultad de Ciencias Médicas de la UNC → γ moderado-bueno
 */
public class CordobaCity {

    // --- Parámetros del modelo Lotka-Volterra ---

    // α = 0.030: crecimiento dinámico. Ciudad joven y universitaria, con fuerte
    //            renovación poblacional por la llegada constante de estudiantes
    //            del interior del país.
    private static final double ALPHA = 0.030;

    // β = 0.00000017: contagio alto. Gran densidad en el casco céntrico, transporte
    //                 urbano masivo y enorme población universitaria que se concentra
    //                 en facultades, bares y eventos. Da un R0 ≈ 3.6.
    private static final double BETA = 0.00000017;

    // δ = 0.00000014: propagación viral alta. El hacinamiento en aulas, transporte
    //                 y vida nocturna estudiantil potencia la eficiencia del contagio,
    //                 apenas atenuado por el clima mediterráneo seco.
    private static final double DELTA = 0.00000014;

    // γ = 0.070: recuperación moderada-buena. Polo sanitario de referencia del
    //            centro del país, con hospitales públicos de alta complejidad y
    //            un sector privado fuerte, aunque exigido ante un brote masivo.
    private static final double GAMMA = 0.070;

    // Condiciones iniciales: ~1.5M de habitantes, brote inicial con 100 infectados
    private static final double POBLACION_SANA_INICIAL = 1_499_900;
    private static final double POBLACION_INFECTADA_INICIAL = 100;

    private static final int DIAS_SIMULACION = 365;

    private static final String NOMBRE_CIUDAD = "cordoba";

    private static final String RUTA_RESOURCES = "resources/cordoba/results.csv";
    private static final String RUTA_DASHBOARD  = "dashboard/data/cordoba.csv";

    /**
     * Ejecuta la simulación del Gran Córdoba, exporta el CSV a resources/
     * y copia el resultado a dashboard/data/ para el dashboard web.
     */
    public void ejecutarYExportar() {
        System.out.println("=== Simulando: Gran Córdoba ===");
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

        System.out.println("Simulación del Gran Córdoba completada.\n");
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
