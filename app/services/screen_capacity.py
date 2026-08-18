"""
Capacidad de seleccionadoras — Método VSMA (T-15 clásico + T-16 NEA/BED).

Fuente: Olsen & Carnes, "Screen Capacity Calculation", T-JCI-201, Astec/JCI.
  https://www.911metallurgist.com/wp-content/uploads/2016/07/Screen-Capacity.pdf

Fórmula completa por piso:
  tph_piso = área_piso_ft² × A
  A = B × S × D × V × H × T × K × Y × P × O × W × F × NEA × BED

T-15 (implementado): factores B a F.
T-16 (este módulo): factores NEA (material tamaño cercano) y BED (espesor de cama).

Verificación T-15: ejemplo "Comparison of screen sizing" del paper reproduce
  13.16 tph/ft² y 3.97 tph/ft² dentro de ±5 %.
Ver tests/test_t15_screen_capacity.py y tests/test_t16_nea_bed.py.
"""
import math
from typing import TYPE_CHECKING, Dict, List, Optional, Tuple

if TYPE_CHECKING:
    from app.services.granulometry import Stream

M2_TO_FT2: float = 10.7639  # 1 m² = 10.7639 ft²


# ── FACTOR B — Capacidad básica ───────────────────────────────────────────────
# tph/ft² en función de la abertura de malla cuadrada.
# Fórmula derivada de los dos puntos ancla declarados en el texto del paper:
#   12.7 mm  (½") → 3.80 tph/ft²
#   25.4 mm  (1") → 5.50 tph/ft²
# Forma: B = B_MAX × (1 − exp(−k × abertura_mm))
# Parámetros: u = exp(−k × 12.7) y la restricción u = 1 − 3.80/B_MAX
#   → u = 1+u²−5.50/B_MAX   →  resuelve sistema → u = 0.4474, B_MAX = 6.878, k = 0.06329
_B_MAX = 6.878
_B_k = 0.06329  # mm⁻¹

def factor_B(opening_mm: float) -> float:
    """Capacidad básica (tph/ft²) para malla cuadrada según abertura en mm."""
    if opening_mm <= 0:
        raise ValueError(f"abertura debe ser > 0, recibida: {opening_mm}")
    return _B_MAX * (1.0 - math.exp(-_B_k * opening_mm))


# ── FACTOR S — Inclinación del piso ──────────────────────────────────────────
# 1.00 para pisos horizontales (≤10°). Baja ~1 % por cada grado adicional.
def factor_S(incline_deg: float = 0.0) -> float:
    """Factor de inclinación; 0° o 10° → 1.00."""
    if incline_deg <= 10.0:
        return 1.00
    # Interpolación lineal aproximada desde los iso-contornos de la Fig. 3
    if incline_deg <= 25.0:
        return max(0.85, 1.00 - 0.01 * (incline_deg - 10.0))
    return 0.85


# ── FACTOR D — Posición del piso ─────────────────────────────────────────────
# Texto del paper p.8: 1er piso 1.00, 2do 0.90, 3er 0.80, 4to 0.70.
_D_FACTORS: Dict[int, float] = {1: 1.00, 2: 0.90, 3: 0.80, 4: 0.70}

def factor_D(deck_position: int) -> float:
    """Factor de posición de piso (1=tope → 1.00, 2 → 0.90, 3 → 0.80, 4 → 0.70)."""
    return _D_FACTORS.get(deck_position, 0.70)


# ── FACTOR V — Sobresize ─────────────────────────────────────────────────────
# % de alimentación retenida en el piso.
# Ancla del paper: 25 % retenido → 1.00.
# Calibrado con el ejemplo: 15 % → 1.25; 18.8 % → 1.13.
# Ley potencial: V = (25 / pct_oversize)^0.437
def factor_V(pct_oversize: float) -> float:
    """Factor de sobresize; 25 % retenido → 1.00."""
    if pct_oversize <= 0:
        return 4.0
    return (25.0 / pct_oversize) ** 0.437


# ── FACTOR H — Medio tamaño ──────────────────────────────────────────────────
# % de alimentación que pasa la mitad de la abertura.
# Ancla del paper: 40 % → 1.00.
# Calibrado con el ejemplo: 69 % → 1.55; 35.3 % → 0.90.
# Ley potencial: H = (pct_halfsize / 40)^0.804
def factor_H(pct_halfsize: float) -> float:
    """Factor de medio tamaño; 40 % pasante a ½ abertura → 1.00."""
    if pct_halfsize <= 0:
        return 0.1
    return (pct_halfsize / 40.0) ** 0.804


# ── FACTOR T — Forma de la abertura ──────────────────────────────────────────
def factor_T(shape: str = "square") -> float:
    """'square'→ 1.00, 'round' → 0.80."""
    return 0.80 if shape == "round" else 1.00


# ── FACTOR K — Condición del material ────────────────────────────────────────
_K_TABLE: Dict[str, float] = {
    "crushed_dry": 1.00,
    "quarried_dry": 0.90,
    "gravel_clean": 1.10,
    "moist_dirty": 0.75,
    "moist_ore": 0.80,
}

def factor_K(condition: str = "crushed_dry") -> float:
    """Factor de condición de material; roca chancada seca → 1.00."""
    return _K_TABLE.get(condition, 1.00)


# ── FACTOR Y — Riego ─────────────────────────────────────────────────────────
def factor_Y(spray: bool = False) -> float:
    """Factor de riego; sin agua → 1.00."""
    return 1.00


# ── FACTOR P — Forma de partícula ────────────────────────────────────────────
def factor_P(pct_elongated: float = 0.0) -> float:
    """Factor de lajas; sin lajas → 1.00."""
    if pct_elongated <= 5:
        return 1.00
    return max(0.10, 1.00 - (pct_elongated - 5.0) / 95.0 * 0.90)


# ── FACTOR O — Área abierta de la malla ──────────────────────────────────────
# Ancla del paper: 50 % área abierta → 1.00.
# Calibrado con el ejemplo: 75 % → 1.30; 65 % → ~1.185 (vs. 1.20 del paper, error 1.3 %).
# Ley potencial: O = (pct_open / 50)^0.65
def factor_O(pct_open_area: float) -> float:
    """Factor de área abierta; 50 % → 1.00."""
    if pct_open_area <= 0:
        return 0.0
    return (pct_open_area / 50.0) ** 0.65


# ── FACTOR W — Densidad del material ─────────────────────────────────────────
# Ancla: 1 600 kg/m³ (100 lb/ft³) → 1.00.
def factor_W(density_kgm3: float = 1600.0) -> float:
    """Factor de densidad; 1 600 kg/m³ → 1.00."""
    density_lb_ft3 = density_kgm3 / 16.018
    if density_lb_ft3 <= 0:
        return 0.0
    return (density_lb_ft3 / 100.0) ** 0.5


# ── FACTOR F — Eficiencia exigida ─────────────────────────────────────────────
# Ancla del paper: 90 % → 1.00; 95 % → 0.95; 70 % → 1.20.
# Dos tramos de ley potencial calibrados con esos tres puntos:
#   eff ≥ 90 %: (90/eff)^0.948   →  95 % → 0.9497 ≈ 0.95 ✓
#   eff <  90 %: (90/eff)^0.726   →  70 % → 1.200 ✓
def factor_F(efficiency_pct: float = 90.0) -> float:
    """Factor de eficiencia; 90 % → 1.00; mayor exigencia → menor factor (< 1)."""
    if efficiency_pct <= 0:
        return 3.0
    if efficiency_pct <= 90.0:
        return (90.0 / efficiency_pct) ** 0.726
    return (90.0 / efficiency_pct) ** 0.948


# ── FUNCIÓN PRINCIPAL ─────────────────────────────────────────────────────────

def calc_A(
    opening_mm: float,
    deck_position: int = 1,
    pct_oversize: float = 25.0,
    pct_halfsize: float = 40.0,
    pct_open_area: float = 50.0,
    efficiency_pct: float = 90.0,
    incline_deg: float = 0.0,
    shape: str = "square",
    condition: str = "crushed_dry",
    pct_elongated: float = 0.0,
    spray: bool = False,
    density_kgm3: float = 1600.0,
) -> float:
    """
    Capacidad por pie cuadrado de piso (tph/ft²) — fórmula VSMA clásica.

    A = B × S × D × V × H × T × K × Y × P × O × W × F
    """
    return (
        factor_B(opening_mm)
        * factor_S(incline_deg)
        * factor_D(deck_position)
        * factor_V(pct_oversize)
        * factor_H(pct_halfsize)
        * factor_T(shape)
        * factor_K(condition)
        * factor_Y(spray)
        * factor_P(pct_elongated)
        * factor_O(pct_open_area)
        * factor_W(density_kgm3)
        * factor_F(efficiency_pct)
    )


def calc_tph_deck(
    area_m2: float,
    opening_mm: float,
    deck_position: int = 1,
    **kwargs,
) -> float:
    """Capacidad de un piso (tph) dado el área en m²."""
    return area_m2 * M2_TO_FT2 * calc_A(opening_mm, deck_position=deck_position, **kwargs)


def nominal_tph(screen: Dict, aperture_mm: float) -> float:
    """
    Capacidad nominal de la seleccionadora (tph) para la apertura dada.

    Usa factores por defecto (condición roca seca, área 50 %, eficiencia 90 %,
    V=1 a 25 % oversize, H=1 a 40 % halfsize). Sirve para comparar equipos
    en el recommender sin conocer la alimentación exacta. El piso más restrictivo
    (último, factor D menor) determina la capacidad del equipo.
    """
    area_per_deck_m2: Optional[float] = screen.get("area_m2_per_deck")
    decks: int = screen.get("decks") or 1

    if not area_per_deck_m2:
        total_m2 = screen.get("area_m2") or 0.0
        area_per_deck_m2 = total_m2 / max(decks, 1)

    if not area_per_deck_m2 or aperture_mm <= 0:
        return 0.0

    # Cuello de botella: piso inferior (factor D mínimo)
    area_ft2 = area_per_deck_m2 * M2_TO_FT2
    return area_ft2 * factor_B(aperture_mm) * factor_D(decks)


# ── FACTOR NEA — Material de tamaño cercano (T-16) ───────────────────────────
# Porcentaje del feed entre 0.75× y 1.25× la abertura = "near aperture material".
# A mayor %, menor capacidad (el material cercano es el más difícil de clasificar).
#
# Fuente: Olsen & Carnes T-JCI-201, Figura 7.
# Tabla aproximada derivada de la curva del paper (interpolación piecewise lineal):
#   0% → 1.00, 20% → 0.83, 40% → 0.65, 60% → 0.50, 80% → 0.38, 100% → 0.28.
# Consistente con el ejemplo del paper: NEA ≈ 0.59 cuando el near-size es significativo.
_NEA_TABLE: List[Tuple[float, float]] = [
    (0.0,   1.00),
    (20.0,  0.83),
    (40.0,  0.65),
    (60.0,  0.50),
    (80.0,  0.38),
    (100.0, 0.28),
]

def factor_NEA(pct_near_aperture: float) -> float:
    """
    Factor de material de tamaño cercano (±25% de la abertura).

    pct_near_aperture: % del feed entre 0.75× y 1.25× la abertura de malla.
    Retorna: factor entre 0.28 y 1.00 (penaliza capacidad cuando hay near-size).
    """
    pct = max(0.0, min(100.0, pct_near_aperture))
    xs = [p[0] for p in _NEA_TABLE]
    ys = [p[1] for p in _NEA_TABLE]
    if pct <= xs[0]:
        return float(ys[0])
    if pct >= xs[-1]:
        return float(ys[-1])
    for i in range(len(xs) - 1):
        if xs[i] <= pct <= xs[i + 1]:
            t = (pct - xs[i]) / (xs[i + 1] - xs[i])
            return float(ys[i]) + t * (float(ys[i + 1]) - float(ys[i]))
    return float(ys[-1])


# ── FACTOR BED — Espesor de cama (T-16, stub) ────────────────────────────────
# El factor BED penaliza la capacidad cuando la cama de material en el piso es
# demasiado profunda respecto a la abertura.
#
# Fórmula (METODO_CAPACIDAD_SELECCIONADORAS.md §2):
#   DM_inches = (TP × KD) / (5.0 × SP × WD)
#   donde: TP = tph en el piso, KD ≈ 20 ft³/ton (factor de esponjamiento),
#          SP = velocidad de transporte (ft/min) = f(rpm, stroke, inclinación),
#          WD = ancho del piso (ft).
#
# Pendiente: requiere ancho (m), rpm, stroke (mm) e inclinación por equipo.
# Hasta que esos datos estén en el catálogo, BED = 1.0 (sin penalización).
def factor_BED(dm_inches: float, aperture_mm: float) -> float:
    """
    Factor de espesor de cama.

    dm_inches:   profundidad de cama (inches). 0.0 = no calculado (stub).
    aperture_mm: abertura de la malla (mm).

    Retorna 1.0 hasta que se dispongan datos de ancho/velocidad de pantalla
    (B-BED01 en MEMORY.md). La función es funcional para llamadas futuras.
    """
    if dm_inches <= 0 or aperture_mm <= 0:
        return 1.0
    aperture_in = aperture_mm / 25.4
    ratio = dm_inches / aperture_in
    # Penalización lineal: sin penalización hasta ratio=4, cae linealmente hasta 0.5 en ratio=8
    if ratio <= 4.0:
        return 1.0
    if ratio >= 8.0:
        return 0.5
    return 1.0 - 0.5 * (ratio - 4.0) / 4.0


# ── FUNCIÓN AUXILIAR PARA NEA DESDE CORRIENTE ─────────────────────────────────

def _pct_near_aperture(feed_stream: "Stream", aperture_mm: float) -> float:
    """% del feed entre 0.75× y 1.25× la abertura (near aperture material)."""
    lo = aperture_mm * 0.75
    hi = aperture_mm * 1.25
    return max(0.0, feed_stream.passing(hi) - feed_stream.passing(lo))


def nominal_tph_with_feed(screen: Dict, aperture_mm: float, feed_stream: "Stream") -> float:
    """
    Capacidad nominal (tph) aplicando el factor NEA calculado desde la curva real del feed.

    Equivalent to: nominal_tph(screen, aperture_mm) × factor_NEA(% near-size from feed).
    Usar cuando se dispone de la curva granulométrica de alimentación.
    """
    base = nominal_tph(screen, aperture_mm)
    if base <= 0 or aperture_mm <= 0:
        return base
    pct_near = _pct_near_aperture(feed_stream, aperture_mm)
    return base * factor_NEA(pct_near)


