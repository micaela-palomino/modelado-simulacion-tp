import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

/**
 * Configuración de la simulación para la ciudad de Campana (Buenos Aires).
 *
 * Características que justifican los parámetros:
 *  - Población: ~95.000 hab (censo 2022), ciudad industrial sobre el río Paraná
 *  - Tipo: Industrial — polo petroquímico/siderúrgico del corredor Zárate-Campana
 *  - Fuerte concentración de trabajadores en plantas industriales, con transporte
 *    laboral compartido y turnos rotativos que multiplican el contacto → β moderado-alto
 *  - Espacios industriales cerrados (comedores de fábrica, vestuarios, galpones)
 *    con ventilación limitada → δ moderado-alto
 *  - Sistema de salud: hospital municipal + cercanía al corredor Zárate-Campana y al
 *    AMBA para derivaciones a centros de mayor complejidad → γ medio
 */
public class CampanaCity {

    // --- Parámetros del modelo Lotka-Volterra ---

    // α = 0.025: crecimiento moderado. Población en edad laboral con migración interna
    //            asociada a los polos industriales; renovación estable pero sin el
    //            dinamismo demográfico extremo del AMBA.
    private static final double ALPHA = 0.025;

    // β = 0.0000016: contagio moderado-alto. Fuerte concentración de trabajadores en
    //                plantas industriales (polo petroquímico/siderúrgico sobre el río
    //                Paraná), transporte laboral compartido y turnos rotativos que
    //                multiplican el contacto entre sanos e infectados.
    private static final double BETA = 0.0000016;

    // δ = 0.0000013: propagación viral moderada-alta. Espacios industriales cerrados,
    //                comedores de fábrica, vestuarios y galpones con ventilación
    //                limitada favorecen focos de transmisión.
    private static final double DELTA = 0.0000013;

    // γ = 0.050: recuperación media. Cuenta con hospital municipal y la cercanía al
    //            corredor Zárate-Campana y al AMBA permite derivaciones a centros de
    //            mayor complejidad; mejor cobertura que una ciudad aislada, pero por
    //            debajo de una metrópolis con alta complejidad propia.
    private static final double GAMMA = 0.050;

    // Condiciones iniciales: ~95.000 habitantes, brote inicial con 50 infectados
    private static final double POBLACION_SANA_INICIAL = 94_950;
    private static final double POBLACION_INFECTADA_INICIAL = 50;

    private static final int DIAS_SIMULACION = 365;

    private static final String NOMBRE_CIUDAD = "campana";

    private static final String RUTA_RESOURCES = "resources/campana/results.csv";
    private static final String RUTA_DASHBOARD  = "dashboard/data/campana.csv";

    /**
     * Ejecuta la simulación de Campana, exporta el CSV a resources/
     * y copia el resultado a dashboard/data/ para el dashboard web.
     */
    public void ejecutarYExportar() {
        System.out.println("=== Simulando: Campana ===");
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

        System.out.println("Simulación de Campana completada.\n");
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
