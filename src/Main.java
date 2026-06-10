/**
 * Entry point del TP de Modelado y Simulación.
 *
 * Corre la simulación de cada ciudad configurada y exporta los CSVs
 * tanto a resources/ como a dashboard/data/ para el dashboard web.
 *
 * Para agregar una ciudad nueva:
 *   1. Crear la carpeta src/cities/tuciudad/
 *   2. Crear TuCiudadCity.java siguiendo el patrón de LaMatanzaCity
 *   3. Instanciar y llamar a ejecutarYExportar() en este main
 */
public class Main {

    public static void main(String[] args) {
        System.out.println("╔══════════════════════════════════════════════════════════╗");
        System.out.println("║  TP Modelado y Simulación — Pandemia: Lotka-Volterra    ║");
        System.out.println("║  UADE — Trabajo Práctico Grupal                         ║");
        System.out.println("╚══════════════════════════════════════════════════════════╝");
        System.out.println();

        // --- Simulación: La Matanza ---
        LaMatanzaCity laMatanza = new LaMatanzaCity();
        laMatanza.ejecutarYExportar();

        // --- Simulación: Bariloche ---
        BarilocheCity bariloche = new BarilocheCity();
        bariloche.ejecutarYExportar();

        // --- Agregar más ciudades aquí ---
        // LaPlataCity laPlata = new LaPlataCity();
        // laPlata.ejecutarYExportar();

        System.out.println("╔══════════════════════════════════════════════════════════╗");
        System.out.println("║  Simulaciones completadas. Abrí dashboard/index.html    ║");
        System.out.println("╚══════════════════════════════════════════════════════════╝");
    }
}
