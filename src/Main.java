/**
 * Entry point del TP de Modelado y SimulaciÃ³n.
 *
 * Corre la simulaciÃ³n de cada ciudad configurada y exporta los CSVs
 * tanto a resources/ como a dashboard/data/ para el dashboard web.
 *
 * Para agregar una ciudad nueva:
 *   1. Crear la carpeta src/cities/tuciudad/
 *   2. Crear TuCiudadCity.java siguiendo el patrÃ³n de LaMatanzaCity
 *   3. Instanciar y llamar a ejecutarYExportar() en este main
 */
public class Main {

    public static void main(String[] args) {
        System.out.println("â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—");
        System.out.println("â•‘  TP Modelado y SimulaciÃ³n â€” Pandemia: Lotka-Volterra    â•‘");
        System.out.println("â•‘  UADE â€” Trabajo PrÃ¡ctico Grupal                         â•‘");
        System.out.println("â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
        System.out.println();

        // --- SimulaciÃ³n: La Matanza ---
        LaMatanzaCity laMatanza = new LaMatanzaCity();
        laMatanza.ejecutarYExportar();

        // --- Simulación: Gran Mendoza ---
        MendozaCity mendoza = new MendozaCity();
        mendoza.ejecutarYExportar();

        // --- Simulación: La Plata ---
        LaPlataCity laPlata = new LaPlataCity();
        laPlata.ejecutarYExportar();

        // --- Simulación: Bariloche ---
        BarilocheCity bariloche = new BarilocheCity();
        bariloche.ejecutarYExportar();

        // --- Agregar más ciudades aquí ---
        // Ejemplo para cuando otro grupo agregue su ciudad:
        //
        // OtraCiudadCity otraCiudad = new OtraCiudadCity();
        // otraCiudad.ejecutarYExportar();

        System.out.println("â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—");
        System.out.println("â•‘  Simulaciones completadas. AbrÃ­ dashboard/index.html    â•‘");
        System.out.println("â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
    }
}
