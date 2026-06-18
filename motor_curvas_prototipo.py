"""
PROTOTIPO: Motor de simulación basado en CURVAS GRANULOMÉTRICAS COMPLETAS
(enfoque AggFlow: curvas de producto normalizadas por CSS + balance de masas)

Cada corriente = (tph, curva % acumulado pasante sobre serie de tamices).
Cada equipo transforma corrientes completas, no solo el P80.
"""
import math
from bisect import bisect_left

# Serie de tamices estándar (mm), descendente
SIEVES = [406.4, 304.8, 203.2, 152.4, 101.6, 76.2, 50.8, 38.1, 28.0, 25.4,
          20.0, 19.05, 14.0, 12.7, 10.0, 9.53, 6.35, 6.3, 5.0, 4.76,
          3.35, 2.38, 2.36, 2.0, 1.7, 1.18]

def interp_log(x, xs, ys):
    """Interpolación lineal en log(tamaño). xs ascendente."""
    if x <= xs[0]:
        return ys[0] * (x / xs[0])  # extrapolación lineal hacia finos
    if x >= xs[-1]:
        return ys[-1]
    i = bisect_left(xs, x)
    x0, x1, y0, y1 = xs[i-1], xs[i], ys[i-1], ys[i]
    t = (math.log(x) - math.log(x0)) / (math.log(x1) - math.log(x0))
    return y0 + t * (y1 - y0)

class Stream:
    """Corriente: flujo (tph) + curva granulométrica (% acumulado pasante)."""
    def __init__(self, tph, curve_dict):
        # curve_dict: {tamaño_mm: % pasante}
        pts = sorted(curve_dict.items())
        self.xs = [p[0] for p in pts]
        self.ys = [p[1] for p in pts]
        self.tph = tph

    def passing(self, size_mm):
        return max(0.0, min(100.0, interp_log(size_mm, self.xs, self.ys)))

    def pXX(self, pct):
        """Tamaño al que pasa el pct% (e.g. P80)."""
        lo, hi = 0.05, self.xs[-1]
        for _ in range(80):
            mid = math.sqrt(lo * hi)
            if self.passing(mid) < pct: lo = mid
            else: hi = mid
        return math.sqrt(lo * hi)

    def as_table(self, sizes):
        return {s: round(self.passing(s), 1) for s in sizes}

# ── CURVAS DE PRODUCTO NORMALIZADAS (d/CSS → % pasante) ──────────────────────
# CONO: calibrada con producto real Finlay C-1540RS @ CSS 20 (reporte AggFlow)
CONE_NORM = {0.059: 18, 0.085: 21, 0.118: 25, 0.1675: 31, 0.25: 38, 0.315: 44,
             0.50: 58, 0.70: 71, 1.00: 84, 1.40: 95, 1.90: 100}

# MANDÍBULA: curva típica doble efecto (literatura Metso/Telsmith),
# consistente con restricción AggFlow caso 2 (CSS 90 → ~36% bajo 38 mm)
JAW_NORM = {0.10: 10, 0.20: 20, 0.40: 34, 0.60: 48, 0.80: 62,
            1.00: 75, 1.20: 85, 1.40: 93, 1.60: 98, 1.70: 100}

def crusher(stream: Stream, css_mm, norm_curve):
    """Chancador: producto = curva normalizada escalada por CSS.
    (Enfoque AggFlow/fabricante: la curva de producto depende del CSS,
    el material grueso se reduce; los finos de la alimentación ya bajo
    el producto se conservan — simplificación: max(feed, norm))."""
    xs_n = sorted(norm_curve)
    ys_n = [norm_curve[k] for k in xs_n]
    out = {}
    for s in SIEVES:
        p_crush = interp_log(s / css_mm, xs_n, ys_n) if s / css_mm > xs_n[0] * 0.2 else (s/css_mm)/xs_n[0]*ys_n[0]
        p_crush = max(0.0, min(100.0, p_crush))
        # los finos ya existentes en la alimentación no se "des-chancan"
        out[s] = max(p_crush, stream.passing(s) if s < css_mm * 0.5 else 0.0)
    return Stream(stream.tph, out)  # balance: todo lo que entra sale

def screen_deck(stream: Stream, aperture_mm, efficiency=0.95):
    """Harnero (1 bandeja): separa en undersize y oversize con balance de masas.
    Partición simple: fracción bajo abertura pasa con eficiencia E."""
    frac_under_feed = stream.passing(aperture_mm) / 100.0
    tph_under = stream.tph * frac_under_feed * efficiency
    tph_over = stream.tph - tph_under
    # Curva del undersize: alimentación truncada y renormalizada en la abertura
    under = {}
    for s in SIEVES:
        if s >= aperture_mm:
            under[s] = 100.0
        else:
            under[s] = 100.0 * stream.passing(s) / max(stream.passing(aperture_mm), 1e-6)
    # Curva del oversize: lo que queda (balance por tamaño)
    over = {}
    for s in SIEVES:
        mass_under_s = tph_under * min(100.0, under[s]) / 100.0
        mass_feed_s = stream.tph * stream.passing(s) / 100.0
        over[s] = max(0.0, min(100.0, 100.0 * (mass_feed_s - mass_under_s) / max(tph_over, 1e-6)))
    return Stream(tph_under, under), Stream(tph_over, over)

# ══════════════════════════════════════════════════════════════════════════════
# VALIDACIÓN CONTRA AGGFLOW
# ══════════════════════════════════════════════════════════════════════════════
FEED_CURVE = {406.4: 100, 304.8: 54, 203.2: 41, 152.4: 33, 101.6: 30, 76.2: 28,
              50.8: 18, 38.1: 15, 25.4: 12, 19.05: 10, 12.7: 9, 9.53: 8,
              6.35: 5, 4.76: 3, 2.38: 2, 2.0: 0.5}

AGG_FINAL = {38: 100, 28: 95, 20: 84, 14: 71, 10: 58, 6.3: 44, 5: 38,
             3.35: 31, 2.36: 25, 1.7: 21, 1.18: 18}
AGG_FINES = {38.1: 100, 28: 78, 25.4: 72, 20: 57, 19.05: 55, 14: 47, 12.7: 43,
             10: 34, 9.53: 33, 6.35: 23, 5: 18, 4.76: 17, 2.38: 9.8, 2: 3.3}

def cmp_table(title, model: Stream, ref: dict):
    print(f"\n{title}")
    print(f"{'mm':>7} {'AggFlow':>8} {'Motor':>7} {'dif':>6}")
    errs = []
    for s in sorted(ref, reverse=True):
        m = model.passing(s)
        d = m - ref[s]
        errs.append(abs(d))
        print(f"{s:>7} {ref[s]:>8} {m:>7.1f} {d:>+6.1f}")
    print(f"  Error medio abs: {sum(errs)/len(errs):.1f} pts | máx: {max(errs):.1f} pts")

print("=" * 64)
print("CASO 2 — Mandíbula CSS90 → Harnero 38mm → Cono CSS20")
print("=" * 64)
feed = Stream(175, FEED_CURVE)
jaw_out = crusher(feed, 90, JAW_NORM)
print(f"\nMandíbula CSS 90: P80 = {jaw_out.pXX(80):.0f} mm | pasante 38mm = {jaw_out.passing(38.1):.1f}%")
print(f"  (AggFlow implica ~35.5% bajo 38 mm: 59 tph finos / 95% ef / 175 tph)")

fines, coarse = screen_deck(jaw_out, 38.1, 0.95)
print(f"\nHarnero 38 mm @95%:")
print(f"  Finos:  {fines.tph:.0f} tph (AggFlow: 59)  | P80 = {fines.pXX(80):.1f} mm (AggFlow: 28.98)")
print(f"  Grueso: {coarse.tph:.0f} tph (AggFlow: 116)")
print(f"  Balance: {fines.tph + coarse.tph:.0f} = {feed.tph} tph ✓")
cmp_table("Curva FINOS del harnero vs AggFlow:", fines, AGG_FINES)

cone_out = crusher(coarse, 20, CONE_NORM)
print(f"\nCono CSS 20: {cone_out.tph:.0f} tph (AggFlow: 115) | P80 = {cone_out.pXX(80):.2f} mm (AggFlow: 18.11)")
cmp_table("Curva PRODUCTO CONO vs AggFlow:", cone_out, AGG_FINAL)

print("\n" + "=" * 64)
print("CASO 1 — Mandíbula CSS64 → Cono CSS20 (serie directa)")
print("=" * 64)
feed1 = Stream(125, FEED_CURVE)
jaw1 = crusher(feed1, 64, JAW_NORM)
print(f"Mandíbula CSS 64: P80 = {jaw1.pXX(80):.0f} mm | top size ≈ {64*1.7:.0f} mm (AggFlow: producto -100)")
cone1 = crusher(jaw1, 20, CONE_NORM)
print(f"Cono CSS 20: P80 = {cone1.pXX(80):.2f} mm (AggFlow: 18.11)")
cmp_table("Curva FINAL vs AggFlow:", cone1, AGG_FINAL)

print("\n── Comparación con el motor ACTUAL de KrushRock ──")
# coneFactor perfil M, wi 15.5 (granito), rpm 285 → F ≈ 1.62*1.025 = 1.66
F_cone = 1.62 * (1 + (15.5 - 13) * 0.010)
print(f"Motor actual: P80 cono = CSS × {F_cone:.2f} = {20*F_cone:.1f} mm")
print(f"AggFlow real: P80 = 18.11 mm (= CSS × 0.91)")
print(f"→ El motor actual sobreestima el P80 del cono en {20*F_cone/18.11*100-100:.0f}%")
