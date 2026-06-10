/**
 * Modelo de datos que representa el estado de la simulación en un día dado.
 * Almacena la cantidad de población sana e infectada para ese día.
 */
public class SimulationResult {

    private int dia;
    private double poblacionSana;
    private double poblacionInfectada;

    public SimulationResult(int dia, double poblacionSana, double poblacionInfectada) {
        this.dia = dia;
        this.poblacionSana = poblacionSana;
        this.poblacionInfectada = poblacionInfectada;
    }

    public int getDia() {
        return dia;
    }

    public double getPoblacionSana() {
        return poblacionSana;
    }

    public double getPoblacionInfectada() {
        return poblacionInfectada;
    }

    @Override
    public String toString() {
        return String.format("Día %d | Sanos: %.2f | Infectados: %.2f", dia, poblacionSana, poblacionInfectada);
    }
}
