import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

/**
 * Configuración de la simulación para Ushuaia (Tierra del Fuego).
 *
 * Características que justifican los parámetros:
 *  - Población: ~90.000 habitantes (ciudad más austral del mundo)
 *  - Turismo extremo: 300.000+ turistas/año + cruceros antárticos
 *    → oleadas de contagio estacional muy pronunciadas
 *  - Sistema de salud: un solo hospital público regional (Hospital Regional de Ushuaia)
 *    para toda la provincia; sin alta complejidad local
 *  - Aislamiento geográfico extremo: 3.200 km de Buenos Aires → derivaciones
 *    aéreas costosas y lentas; refuerzos sanitarios llegan tarde
 *  - Clima hostil: inviernos fríos obligan a concentrarse en espacios cerrados,
 *    favoreciendo el contagio intramuros
 */
public class UshuaiaCity {

    // α = 0.020: crecimiento bajo-moderado. Ciudad joven por migración laboral
    //            (zona franca, turismo, Estado nacional), pero pequeña y aislada.
    private static final double ALPHA = 0.020;

    // β = 0.0000013: contagio muy alto. Población pequeña con flujo turístico
    //                enorme (cruceros, trekking, Parque Nacional Tierra del Fuego).
    //                Un solo crucero aporta más gente que el 1 % de la ciudad.
    private static final double BETA = 0.0000013;

    // δ = 0.0000010: propagación alta. Espacios cerrados en invierno (hoteles,
    //                refugios, transporte turístico) y viviendas con poca ventilación
    //                potencian la eficiencia del virus.
    private static final double DELTA = 0.0000010;

    // γ = 0.030: recuperación muy baja. Solo el Hospital Regional de Ushuaia
    //            (nivel III). Derivaciones a Buenos Aires toman días y son costosas.
    //            Ante un brote, el sistema colapsa rápidamente.
    private static final double GAMMA = 0.030;

    // Condiciones iniciales: ~90.000 habitantes, brote inicial con 30 infectados
    // (consistente con la escala poblacional, equivalente a ~0.03 %)
    private static final double POBLACION_SANA_INICIAL = 89_970;
    private static final double POBLACION_INFECTADA_INICIAL = 30;

    private static final int DIAS_SIMULACION = 365;

    private static final String NOMBRE_CIUDAD = "ushuaia";

    private static final String RUTA_RESOURCES = "resources/ushuaia/results.csv";
    private static final String RUTA_DASHBOARD  = "dashboard/data/ushuaia.csv";

    public void ejecutarYExportar() {
        System.out.println("=== Simulando: Ushuaia ===");
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

        System.out.println("Simulación de Ushuaia completada.\n");
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
    public double getBeta()  { return BETA; }
    public double getDelta() { return DELTA; }
    public double getGamma() { return GAMMA; }
    public String getNombreCiudad() { return NOMBRE_CIUDAD; }
}
