package cities.rosario;

import core.LotkaVolterra;
import core.SimulationResult;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

/**
 * Configuración y parámetros del modelo para Rosario, Santa Fe.
 *
 * ── Justificación de parámetros ──────────────────────────────────────────
 *  α = 0.030  Resiliencia poblacional moderada.
 *  β = 2.80e-7 Alta densidad urbana + transporte público (TUP) intensivo.
 *  δ = 2.20e-7 Propagación viral moderada (conciencia sanitaria post-COVID).
 *  γ = 0.075  Sistema de salud medio (HECA, Alberdi, red CAPS). ~14 días inf.
 *  R₀ ≈ 3.81  δ·S₀/γ → epidemia crece y oscila.
 */
public class RosarioCity {

    // ── Identificación ────────────────────────────────────────────────────
    public static final String CITY_NAME  = "Rosario";
    public static final String PROVINCE   = "Santa Fe";
    public static final int    POPULATION = 1_300_000;

    // ── Parámetros del modelo ─────────────────────────────────────────────
    public static final double ALPHA = 0.030;
    public static final double BETA  = 2.80e-7;
    public static final double DELTA = 2.20e-7;
    public static final double GAMMA = 0.075;

    // ── Condiciones iniciales ─────────────────────────────────────────────
    public static final double S0   = 1_299_900;
    public static final double I0   = 100;

    // ── Configuración de simulación ───────────────────────────────────────
    public static final int    SIM_DAYS = 730;
    public static final double DT       = 0.1;

    // ── Rutas de salida ───────────────────────────────────────────────────
    private static final String CSV_RESOURCES = "resources/rosario/results.csv";
    private static final String CSV_DASHBOARD = "dashboard/data/rosario.csv";

    /**
     * Ejecuta la simulación y exporta los CSVs.
     * Sigue el mismo patrón que LaMatanzaCity.ejecutarYExportar().
     */
    public void ejecutarYExportar() {
        System.out.println("\n── Simulando: " + CITY_NAME + ", " + PROVINCE + " ──");

        LotkaVolterra model = new LotkaVolterra(ALPHA, BETA, DELTA, GAMMA);

        System.out.printf("   α=%.3f  β=%.2e  δ=%.2e  γ=%.3f  R₀≈%.2f%n",
                ALPHA, BETA, DELTA, GAMMA, model.getR0(S0));

        List<SimulationResult> results = model.simulate(S0, I0, SIM_DAYS, DT);

        exportCsv(results, CSV_RESOURCES);
        exportCsv(results, CSV_DASHBOARD);

        // Estadísticas rápidas
        double maxI = results.stream().mapToDouble(r -> r.infected).max().orElse(0);
        int peakDay = results.stream()
                .filter(r -> r.infected == maxI).mapToInt(r -> r.day).findFirst().orElse(0);
        System.out.printf("   Pico: %,.0f infectados (día %d)  |  %d filas exportadas%n",
                maxI, peakDay, results.size());
    }

    private void exportCsv(List<SimulationResult> results, String path) {
        File file = new File(path);
        file.getParentFile().mkdirs();
        try (PrintWriter pw = new PrintWriter(new FileWriter(file))) {
            pw.println(SimulationResult.csvHeader());
            for (SimulationResult r : results) pw.println(r.toCsvRow());
        } catch (IOException e) {
            System.err.println("   ERROR exportando " + path + ": " + e.getMessage());
        }
    }
}
