import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Motor de simulación basado en el modelo Lotka-Volterra adaptado para pandemia.
 *
 * Ecuaciones:
 *   dS/dt = α·S - β·S·I   (cambio en población sana)
 *   dI/dt = δ·S·I - γ·I   (cambio en población infectada)
 *
 * Integración numérica con método Runge-Kutta de orden 4 (RK4).
 */
public class LotkaVolterra {

    // Parámetros del modelo Lotka-Volterra
    private double alpha;   // tasa de crecimiento de la población sana
    private double beta;    // tasa de contagio (sano → infectado por contacto)
    private double delta;   // tasa de propagación viral (eficiencia del virus)
    private double gamma;   // tasa de recuperación / extinción del virus

    // Condiciones iniciales
    private double poblacionSana;
    private double poblacionInfectada;

    // Resultados acumulados de la simulación
    private List<SimulationResult> resultados;

    public LotkaVolterra(double alpha, double beta, double delta, double gamma,
                         double poblacionSana, double poblacionInfectada) {
        this.alpha = alpha;
        this.beta = beta;
        this.delta = delta;
        this.gamma = gamma;
        this.poblacionSana = poblacionSana;
        this.poblacionInfectada = poblacionInfectada;
        this.resultados = new ArrayList<>();
    }

    /**
     * Derivada de la población sana: dS/dt = α·S - β·S·I
     * La población sana crece naturalmente (α) pero decrece por contagio (β·I).
     */
    private double dS(double s, double i) {
        return alpha * s - beta * s * i;
    }

    /**
     * Derivada de la población infectada: dI/dt = δ·S·I - γ·I
     * Los infectados aumentan por contagio (δ·S) pero disminuyen por recuperación (γ).
     */
    private double dI(double s, double i) {
        return delta * s * i - gamma * i;
    }

    /**
     * Ejecuta la simulación durante la cantidad de días indicada.
     * Usa Runge-Kutta de orden 4 con paso h=1 (un día).
     *
     * @param dias cantidad de días a simular
     * @return lista de resultados diarios
     */
    public List<SimulationResult> ejecutarSimulacion(int dias) {
        resultados.clear();

        double s = poblacionSana;
        double i = poblacionInfectada;
        double h = 1.0; // paso de integración: 1 día

        // Guardamos el estado inicial (día 0)
        resultados.add(new SimulationResult(0, s, i));

        for (int dia = 1; dia <= dias; dia++) {

            // --- Runge-Kutta 4 ---

            // Pendientes para S e I en el punto actual
            double k1s = dS(s, i);
            double k1i = dI(s, i);

            // Pendientes a mitad del paso usando k1
            double k2s = dS(s + h * k1s / 2, i + h * k1i / 2);
            double k2i = dI(s + h * k1s / 2, i + h * k1i / 2);

            // Pendientes a mitad del paso usando k2
            double k3s = dS(s + h * k2s / 2, i + h * k2i / 2);
            double k3i = dI(s + h * k2s / 2, i + h * k2i / 2);

            // Pendientes al final del paso usando k3
            double k4s = dS(s + h * k3s, i + h * k3i);
            double k4i = dI(s + h * k3s, i + h * k3i);

            // Actualización: promedio ponderado de las cuatro pendientes
            s = s + (h / 6.0) * (k1s + 2 * k2s + 2 * k3s + k4s);
            i = i + (h / 6.0) * (k1i + 2 * k2i + 2 * k3i + k4i);

            // Evitar valores negativos por errores numéricos
            if (s < 0) s = 0;
            if (i < 0) i = 0;

            resultados.add(new SimulationResult(dia, s, i));
        }

        return resultados;
    }

    /**
     * Exporta los resultados de la simulación a un archivo CSV.
     * Formato: dia,poblacion_sana,poblacion_infectada
     *
     * @param rutaArchivo ruta completa del archivo CSV a generar
     */
    public void exportarCSV(String rutaArchivo) {
        // Crear directorios intermedios si no existen
        java.io.File archivo = new java.io.File(rutaArchivo);
        archivo.getParentFile().mkdirs();

        try (PrintWriter writer = new PrintWriter(new FileWriter(rutaArchivo))) {
            // Encabezado del CSV
            writer.println("dia,poblacion_sana,poblacion_infectada");

            for (SimulationResult resultado : resultados) {
                writer.printf(Locale.US, "%d,%.4f,%.4f%n",
                        resultado.getDia(),
                        resultado.getPoblacionSana(),
                        resultado.getPoblacionInfectada());
            }

            System.out.println("CSV exportado a: " + rutaArchivo);

        } catch (IOException e) {
            System.err.println("Error al exportar CSV: " + e.getMessage());
        }
    }

    /**
     * Retorna el resultado con el pico máximo de infectados.
     */
    public SimulationResult getPicoMaximoInfectados() {
        return resultados.stream()
                .max((a, b) -> Double.compare(a.getPoblacionInfectada(), b.getPoblacionInfectada()))
                .orElse(null);
    }

    public List<SimulationResult> getResultados() {
        return resultados;
    }
}
