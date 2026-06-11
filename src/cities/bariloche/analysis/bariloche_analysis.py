"""
Análisis complementario de Bariloche — Modelado y Simulación (UADE)
Grupo 2: Madary Fernandez, Rodrigo Larrart

Este script complementa la simulación Java con:
1. Reproducción del modelo RK4 en Python (validación)
2. Análisis de sensibilidad de parámetros (β, γ)
3. Comparación de escenarios: normal vs intervención sanitaria
4. Gráficos exportables para el informe
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.gridspec import GridSpec

# ─────────────────────────────────────────────────────────────
# PARÁMETROS BASE — Bariloche
# ─────────────────────────────────────────────────────────────

ALPHA = 0.03         # tasa de crecimiento sano (logístico)
BETA  = 0.00000085   # tasa de contagio (β alta por turismo)
DELTA = 0.00000070   # eficiencia de propagación viral
GAMMA = 0.040        # tasa de recuperación (γ baja por sistema de salud limitado)

S0 = 132_950         # sanos iniciales
I0 = 50              # infectados iniciales (grupo turístico portador)
N  = S0 + I0         # capacidad de carga = población total
DIAS = 365

# ─────────────────────────────────────────────────────────────
# MOTOR RK4 — Misma lógica que LotkaVolterra.java
# ─────────────────────────────────────────────────────────────

def dS(s, i, alpha, beta, N):
    """dS/dt = α·S·(1 - (S+I)/N) - β·S·I"""
    return alpha * s * (1 - (s + i) / N) - beta * s * i

def dI(s, i, delta, gamma):
    """dI/dt = δ·S·I - γ·I"""
    return delta * s * i - gamma * i

def rk4(alpha, beta, delta, gamma, s0, i0, N, dias):
    """Integración RK4 con paso h=1 (un día)."""
    s, i = s0, i0
    h = 1.0
    historia_s = [s]
    historia_i = [i]

    for _ in range(dias):
        k1s = dS(s, i, alpha, beta, N)
        k1i = dI(s, i, delta, gamma)

        k2s = dS(s + h*k1s/2, i + h*k1i/2, alpha, beta, N)
        k2i = dI(s + h*k1s/2, i + h*k1i/2, delta, gamma)

        k3s = dS(s + h*k2s/2, i + h*k2i/2, alpha, beta, N)
        k3i = dI(s + h*k2s/2, i + h*k2i/2, delta, gamma)

        k4s = dS(s + h*k3s, i + h*k3i, alpha, beta, N)
        k4i = dI(s + h*k3s, i + h*k3i, delta, gamma)

        s = s + (h/6) * (k1s + 2*k2s + 2*k3s + k4s)
        i = i + (h/6) * (k1i + 2*k2i + 2*k3i + k4i)

        s = max(s, 0)
        i = max(i, 0)
        total = s + i
        if total > N:
            s *= N / total
            i *= N / total

        historia_s.append(s)
        historia_i.append(i)

    return np.array(historia_s), np.array(historia_i)

# Simulación base
dias_eje = np.arange(DIAS + 1)
S_base, I_base = rk4(ALPHA, BETA, DELTA, GAMMA, S0, I0, N, DIAS)
R_base = np.maximum(0, N - S_base - I_base)  # recuperados

pico_dia  = int(np.argmax(I_base))
pico_val  = I_base[pico_dia]
R0_base   = BETA * N / GAMMA
S_eq      = GAMMA / DELTA
I_eq      = ALPHA / BETA

print(f"=== Bariloche — Resultados ===")
print(f"R₀ estimado:          {R0_base:.2f}")
print(f"Pico infectados:      {pico_val:.0f} (día {pico_dia})")
print(f"Sanos al día 365:     {S_base[-1]:.0f}")
print(f"Infectados día 365:   {I_base[-1]:.0f}")
print(f"% Pob. en pico:       {pico_val/N*100:.1f}%")
print(f"Punto equilibrio:     S*={S_eq:.0f}, I*={I_eq:.0f}")

# ─────────────────────────────────────────────────────────────
# ESCENARIOS — Análisis de sensibilidad
# ─────────────────────────────────────────────────────────────

escenarios = {
    "Base (temporada normal)":      (ALPHA, BETA,          DELTA, GAMMA),
    "Pico de ski (β +50%)":         (ALPHA, BETA * 1.5,    DELTA, GAMMA),
    "Sin turistas (β -60%)":        (ALPHA, BETA * 0.4,    DELTA, GAMMA),
    "Hospital reforzado (γ ×2)":    (ALPHA, BETA,          DELTA, GAMMA * 2),
    "Doble impacto (β+50%, γ×2)":   (ALPHA, BETA * 1.5,    DELTA, GAMMA * 2),
}

resultados = {}
for nombre, (a, b, d, g) in escenarios.items():
    S_e, I_e = rk4(a, b, d, g, S0, I0, N, DIAS)
    R_e = np.maximum(0, N - S_e - I_e)
    pico_e = np.argmax(I_e)
    R0_e   = b * N / g
    resultados[nombre] = {
        'S': S_e, 'I': I_e, 'R': R_e,
        'pico_dia': pico_e,
        'pico_val': I_e[pico_e],
        'R0': R0_e,
        'alpha': a, 'beta': b, 'delta': d, 'gamma': g
    }

# ─────────────────────────────────────────────────────────────
# FIGURA 1 — Comparación de escenarios
# ─────────────────────────────────────────────────────────────

colores_escenarios = {
    "Base (temporada normal)":    "#2980b9",
    "Pico de ski (β +50%)":       "#e74c3c",
    "Sin turistas (β -60%)":      "#27ae60",
    "Hospital reforzado (γ ×2)":  "#8e44ad",
    "Doble impacto (β+50%, γ×2)": "#e67e22",
}

estilos = {
    "Base (temporada normal)":    "-",
    "Pico de ski (β +50%)":       "--",
    "Sin turistas (β -60%)":      "-.",
    "Hospital reforzado (γ ×2)":  ":",
    "Doble impacto (β+50%, γ×2)": (0, (3, 1, 1, 1)),
}

fig1, axes = plt.subplots(1, 2, figsize=(14, 5))
fig1.suptitle("Bariloche — Análisis de Sensibilidad de Parámetros", fontsize=14, fontweight='bold', y=1.01)

# Panel izquierdo: infectados
ax1 = axes[0]
for nombre, res in resultados.items():
    ax1.plot(dias_eje, res['I'], label=nombre,
             color=colores_escenarios[nombre],
             linestyle=estilos[nombre], linewidth=2)
    ax1.axvline(res['pico_dia'], color=colores_escenarios[nombre],
                alpha=0.2, linewidth=0.8)

ax1.set_title("Evolución de Infectados por Escenario", fontsize=12)
ax1.set_xlabel("Días desde el inicio del brote")
ax1.set_ylabel("Población infectada")
ax1.yaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f'{v/1000:.0f}K' if v >= 1000 else f'{v:.0f}'))
ax1.legend(fontsize=8, loc='upper right')
ax1.grid(alpha=0.3)

# Panel derecho: diagrama de fase
ax2 = axes[1]
for nombre, res in resultados.items():
    ax2.plot(res['S'], res['I'], label=nombre,
             color=colores_escenarios[nombre],
             linestyle=estilos[nombre], linewidth=2)
    ax2.scatter(res['S'][res['pico_dia']], res['I'][res['pico_dia']],
                color=colores_escenarios[nombre], s=60, zorder=5)

ax2.axvline(S_eq, color='gray', linestyle=':', alpha=0.6, label=f'S* = {S_eq:.0f}')
ax2.axhline(I_eq, color='gray', linestyle='--', alpha=0.6, label=f'I* = {I_eq:.0f}')
ax2.scatter([S_eq], [I_eq], color='black', s=120, zorder=6, marker='x', linewidths=2, label='Equilibrio')

ax2.set_title("Diagrama de Fase — Espacio de Estados", fontsize=12)
ax2.set_xlabel("Población sana (S)")
ax2.set_ylabel("Población infectada (I)")
ax2.xaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f'{v/1000:.0f}K'))
ax2.yaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f'{v/1000:.0f}K' if v >= 1000 else f'{v:.0f}'))
ax2.legend(fontsize=7)
ax2.grid(alpha=0.3)

fig1.tight_layout()
fig1.savefig('/home/claude/bariloche_sensibilidad.png', dpi=150, bbox_inches='tight')
print("\nGuardado: bariloche_sensibilidad.png")

# ─────────────────────────────────────────────────────────────
# FIGURA 2 — Simulación base detallada
# ─────────────────────────────────────────────────────────────

fig2, (ax_top, ax_bot) = plt.subplots(2, 1, figsize=(12, 8), sharex=True)
fig2.suptitle("Bariloche — Simulación Pandemia (Lotka-Volterra + RK4)", fontsize=14, fontweight='bold')

# Sanos
ax_top.plot(dias_eje, S_base, color='#2980b9', linewidth=2.5, label='Sanos (S)')
ax_top.fill_between(dias_eje, S_base, alpha=0.15, color='#2980b9')
ax_top.set_ylabel("Población sana")
ax_top.set_title("Evolución de la Población Sana")
ax_top.yaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f'{v/1000:.0f}K'))
ax_top.legend()
ax_top.grid(alpha=0.3)

# Infectados + recuperados
ax_bot.plot(dias_eje, I_base, color='#e74c3c', linewidth=2.5, label='Infectados (I)')
ax_bot.fill_between(dias_eje, I_base, alpha=0.2, color='#e74c3c')
ax_bot.plot(dias_eje, R_base, color='#27ae60', linewidth=2, linestyle='--', label='Recuperados (R = N - S - I)')
ax_bot.axvline(pico_dia, color='#e74c3c', linestyle=':', alpha=0.7)
ax_bot.annotate(f'Pico: {pico_val:.0f}\n(día {pico_dia})',
                xy=(pico_dia, pico_val),
                xytext=(pico_dia + 15, pico_val * 0.9),
                fontsize=9,
                arrowprops=dict(arrowstyle='->', color='#c0392b'),
                color='#c0392b', fontweight='bold')
ax_bot.set_xlabel("Días desde inicio del brote")
ax_bot.set_ylabel("Población")
ax_bot.set_title(f"Evolución de Infectados y Recuperados  |  R₀ = {R0_base:.2f}")
ax_bot.yaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f'{v/1000:.0f}K' if v >= 1000 else f'{v:.0f}'))
ax_bot.legend()
ax_bot.grid(alpha=0.3)

fig2.tight_layout()
fig2.savefig('/home/claude/bariloche_base.png', dpi=150, bbox_inches='tight')
print("Guardado: bariloche_base.png")

# ─────────────────────────────────────────────────────────────
# TABLA RESUMEN
# ─────────────────────────────────────────────────────────────

print("\n=== Comparativa de Escenarios ===")
print(f"{'Escenario':<35} {'R₀':>6} {'Pico':>10} {'% Pob':>8} {'Día pico':>10}")
print("-" * 75)
for nombre, res in resultados.items():
    print(f"{nombre:<35} {res['R0']:>6.2f} {res['pico_val']:>10.0f} {res['pico_val']/N*100:>7.1f}% {res['pico_dia']:>10}")

