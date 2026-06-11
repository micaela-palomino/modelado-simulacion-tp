import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

/**
 * Configuración de la simulación para Rosario (Santa Fe).
 *
 * Características que justifican los parámetros:
 *  - Población: ~1.3 millones (tercera ciudad más poblada del país)
 *  - Densidad: ~6.800 hab/km² en el macrocentro → contagio moderado-alto
 *  - Transporte: uso intensivo del TUP (Transporte Urbano de Pasajeros)
 *    y alta conectividad regional (Puerto, Ruta 9, acceso al AMBA) → β elevado
 *  - Sistema de salud: HECA, Hospital Alberdi y red de CAPS → γ moderado
 *  - Contexto: ciudad universitaria (UNR) y portuaria con alta movilidad → δ moderado
 */
public class RosarioCity {

    // --- Parámetros del modelo Lotka-Volterra ---

    // α = 0.030: resiliencia poblacional moderada. Ciudad con crecimiento
    //            estable, fuerte presencia universitaria (UNR) y actividad
    //            portuaria que mantiene renovación poblacional constante.
    private static final double ALPHA = 0.030;

    // β = 0.00000028: contagio moderado-alto. Alta densidad urbana en el
    //                 macrocentro y uso intensivo del transporte público (TUP)
    //                 generan contacto frecuente entre sanos e infectados.
    private static final double BETA = 0.00000028;

    // δ = 0.00000022: propagación viral moderada. Conectividad regional
    //                 (Puerto, Ruta 9) potencia la dispersión, atenuada por
    //                 conciencia sanitaria post-COVID en la región.
    private static final double DELTA = 0.00000022;

    // γ = 0.075: recuperación moderada. Sistema de salud de nivel medio
    //            (HECA, Hospital Alberdi, red de CAPS). Aproximadamente
    //            14 días de infección promedio. Se exige ante picos de brote.
    private static final double GAMMA = 0.075;

    // Condiciones iniciales: 1.3M de habitantes, brote inicial con 100 infectados
    private static final double POBLACION_SANA_INICIAL = 1_299_900;
    private static final double POBLACION_INFECTADA_INICIAL = 100;

    private static final int DIAS_SIMULACION = 365;

    private static final String NOMBRE_CIUDAD = "rosario";

    // Rutas de salida de los CSVs
    private static final String RUTA_RESOURCES = "resources/rosario/results.csv";
    private static final String RUTA_DASHBOARD  = "dashboard/data/rosario.csv";

    /**
     * Ejecuta la simulación de Rosario, exporta el CSV a resources/
     * y copia el resultado a dashboard/data/ para el dashboard web.
     */
    public void ejecutarYExportar() {
        System.out.println("=== Simulando: Rosario ===");
        System.out.printf("Parámetros: α=%.4f, β=%.10f, δ=%.10f, γ=%.4f%n",
                ALPHA, BETA, DELTA, GAMMA);

        // Crear el motor de simulación con los parámetros de Rosario
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

        System.out.println("Simulación de Rosario completada.\n");
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
    public double getAlpha()        { return ALPHA;        }
    public double getBeta()         { return BETA;         }
    public double getDelta()        { return DELTA;        }
    public double getGamma()        { return GAMMA;        }
    public String getNombreCiudad() { return NOMBRE_CIUDAD; }
}
