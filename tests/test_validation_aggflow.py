"""
Tests de validación del motor de simulación contra casos reales AggFlow.

Casos: Finlay C-1540RS, Metso LT120, reportes del proyecto 176849 (AMECO).
Validación: balance de masas, P80, curvas granulométricas.
"""
import json
import pytest
import sys
from pathlib import Path

# Añadir directorio raíz al path para importar app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.granulometry import Stream
from app.services.equipment_models import (
    crusher,
    screen,
    CONE_PRODUCT_NORMALIZED,
    JAW_PRODUCT_NORMALIZED,
)


# ── CARGAR CASOS DE VALIDACIÓN ─────────────────────────────────────────────────
def load_cases():
    """Carga casos de validación desde JSON."""
    case_file = Path(__file__).parent.parent / "casos_validacion_aggflow.json"
    if not case_file.exists():
        pytest.skip(f"Archivo de casos no encontrado: {case_file}")
    
    with open(case_file) as f:
        return json.load(f)["cases"]


CASES = load_cases()


# ── HELPERS DE VALIDACIÓN ─────────────────────────────────────────────────────
def compare_curves(
    model_stream: Stream,
    ref_curve: dict,
    tolerance_points: float = 5.0,
    name: str = ""
) -> dict:
    """
    Compara curva del modelo vs referencia AggFlow.
    
    Retorna: {
        "error_mean": promedio error absoluto,
        "error_max": error máximo,
        "passed": bool
    }
    """
    errors = []
    details = []
    
    for size_str, ref_pct in ref_curve.items():
        size_mm = float(size_str)
        model_pct = model_stream.passing(size_mm)
        error = abs(model_pct - ref_pct)
        errors.append(error)
        details.append({
            "size_mm": size_mm,
            "ref": ref_pct,
            "model": model_pct,
            "error": error
        })
    
    error_mean = sum(errors) / len(errors) if errors else 0
    error_max = max(errors) if errors else 0
    passed = error_max <= tolerance_points
    
    return {
        "error_mean": error_mean,
        "error_max": error_max,
        "passed": passed,
        "tolerance": tolerance_points,
        "details": details,
        "name": name
    }


# ── TEST: CASO 1 ────────────────────────────────────────────────────────────────
def test_case_1_jaw64_cone20():
    """
    Caso 1: Mandíbula CSS 64 → Cono CSS 20 (serie directa).
    
    Expectativa AggFlow:
    - P80 final: 18.11 mm
    - Producto 100% bajo 38 mm
    """
    case = next(c for c in CASES if c["id"] == "case_1_jaw64_cone20")
    
    # Crear corriente de alimentación
    feed_curve = {float(k): v for k, v in case["feed"]["curve"].items()}
    feed = Stream(case["feed"]["tph"], feed_curve)
    
    # Etapa 1: Mandíbula CSS 64
    jaw_out = crusher(feed, css_mm=64, product_curve=JAW_PRODUCT_NORMALIZED)
    
    # Etapa 2: Cono CSS 20
    cone_out = crusher(jaw_out, css_mm=20, product_curve=CONE_PRODUCT_NORMALIZED)
    
    # Validaciones
    expected = case["expected_output"]
    tol = case["tolerances"]
    
    # P80
    p80_model = cone_out.pXX(80)
    p80_error_pct = abs(p80_model - expected["p80_mm"]) / expected["p80_mm"] * 100
    assert p80_error_pct <= tol["p80_error_pct"], \
        f"P80 error: {p80_error_pct:.1f}% (modelo: {p80_model:.2f} mm, esperado: {expected['p80_mm']} mm)"
    
    # TPH (balance de masas)
    assert abs(cone_out.tph - expected["tph"]) <= tol["tph_error_pct"], \
        f"TPH error: {cone_out.tph:.1f} (esperado: {expected['tph']})"
    
    # Curva de producto
    curve_cmp = compare_curves(
        cone_out,
        expected["curve_reference"],
        tolerance_points=tol["curve_error_points"],
        name="Caso 1 - Producto Cono"
    )
    assert curve_cmp["passed"], \
        f"Curva: error_max={curve_cmp['error_max']:.1f} pts (tolerancia: {curve_cmp['tolerance']})"
    
    print(f"\n✓ Caso 1: PASÓ")
    print(f"  P80: {p80_model:.2f} mm (esperado: {expected['p80_mm']}) | error: {p80_error_pct:.1f}%")
    print(f"  Curva: error_medio={curve_cmp['error_mean']:.1f} pts, error_max={curve_cmp['error_max']:.1f} pts")


# ── TEST: CASO 2 ────────────────────────────────────────────────────────────────
def test_case_2_jaw90_screen38_cone20():
    """
    Caso 2: Mandíbula CSS 90 → Harnero 38 mm → Cono CSS 20 (circuito cerrado).
    
    Este es el caso más exigente: bifurcación con balance de masas exacto.
    
    Expectativas AggFlow:
    - Finos (undersize harnero): 59 tph, P80 = 28.98 mm
    - Grueso (oversize harnero) → Cono: 115 tph (aprox), P80 = 18.11 mm
    """
    case = next(c for c in CASES if c["id"] == "case_2_jaw90_screen38_cone20")
    
    # Crear corriente de alimentación
    feed_curve = {float(k): v for k, v in case["feed"]["curve"].items()}
    feed = Stream(case["feed"]["tph"], feed_curve)
    
    # Etapa 1: Mandíbula CSS 90
    jaw_out = crusher(feed, css_mm=90, product_curve=JAW_PRODUCT_NORMALIZED)
    
    # Etapa 2: Harnero 38 mm @ 95% eficiencia
    fines, coarse = screen(jaw_out, aperture_mm=38.1, efficiency=0.95)
    
    # Etapa 3: Cono CSS 20 (sobre el grueso del harnero)
    cone_out = crusher(coarse, css_mm=20, product_curve=CONE_PRODUCT_NORMALIZED)
    
    # Validaciones
    exp_fines = case["expected_output"]["fines"]
    exp_product = case["expected_output"]["product_cone"]
    tol = case["tolerances"]
    
    # ── VALIDACIÓN FINOS ──
    fines_tph_error = abs(fines.tph - exp_fines["tph"])
    assert fines_tph_error <= tol["fines_tph_error"], \
        f"Fines TPH error: {fines_tph_error:.1f} tph (modelo: {fines.tph:.1f}, esperado: {exp_fines['tph']})"
    
    fines_p80 = fines.pXX(80)
    fines_p80_error_pct = abs(fines_p80 - exp_fines["p80_mm"]) / exp_fines["p80_mm"] * 100
    assert fines_p80_error_pct <= tol["fines_p80_error_pct"], \
        f"Fines P80 error: {fines_p80_error_pct:.1f}% (modelo: {fines_p80:.2f}, esperado: {exp_fines['p80_mm']})"
    
    fines_curve_cmp = compare_curves(
        fines,
        exp_fines["curve_reference"],
        tolerance_points=tol["fines_curve_error_points"],
        name="Caso 2 - Fines"
    )
    assert fines_curve_cmp["passed"], \
        f"Fines curva: error_max={fines_curve_cmp['error_max']:.1f} pts"
    
    # ── VALIDACIÓN PRODUCTO CONO ──
    product_p80 = cone_out.pXX(80)
    product_p80_error_pct = abs(product_p80 - exp_product["p80_mm"]) / exp_product["p80_mm"] * 100
    assert product_p80_error_pct <= tol["product_p80_error_pct"], \
        f"Producto P80 error: {product_p80_error_pct:.1f}% (modelo: {product_p80:.2f}, esperado: {exp_product['p80_mm']})"
    
    product_curve_cmp = compare_curves(
        cone_out,
        exp_product["curve_reference"],
        tolerance_points=tol["product_curve_error_points"],
        name="Caso 2 - Producto Cono"
    )
    assert product_curve_cmp["passed"], \
        f"Producto curva: error_max={product_curve_cmp['error_max']:.1f} pts"
    
    # ── VALIDACIÓN BALANCE DE MASAS ──
    total_out = fines.tph + cone_out.tph
    mass_balance_error = abs(total_out - feed.tph)
    assert mass_balance_error <= tol["mass_balance_tph"], \
        f"Balance de masas: {total_out:.1f} tph (entrada: {feed.tph}), error: {mass_balance_error:.2f} tph"
    
    print(f"\n✓ Caso 2: PASÓ")
    print(f"  Fines: {fines.tph:.1f} tph (esperado: {exp_fines['tph']}) | P80: {fines_p80:.2f} mm")
    print(f"  Fines curva: error_medio={fines_curve_cmp['error_mean']:.1f} pts, error_max={fines_curve_cmp['error_max']:.1f} pts")
    print(f"  Producto: {cone_out.tph:.1f} tph (esperado: {exp_product['tph']}) | P80: {product_p80:.2f} mm")
    print(f"  Producto curva: error_medio={product_curve_cmp['error_mean']:.1f} pts, error_max={product_curve_cmp['error_max']:.1f} pts")
    print(f"  Balance de masas: {total_out:.1f} tph = {fines.tph:.1f} + {cone_out.tph:.1f} ✓")


# ── TESTS DE INVARIANTES ──────────────────────────────────────────────────────
def test_granulometry_monotonicity():
    """Las curvas granulométricas deben ser monótonas (% pasante crece con tamaño)."""
    feed_curve = {
        406.4: 100, 304.8: 54, 203.2: 41, 152.4: 33, 101.6: 30, 76.2: 28,
        50.8: 18, 38.1: 15, 25.4: 12, 19.05: 10, 12.7: 9, 9.53: 8,
        6.35: 5, 4.76: 3, 2.38: 2, 2.0: 0.5
    }
    stream = Stream(100, feed_curve)
    
    # Verificar que % pasante es monótonamente creciente
    sizes_sorted = sorted(feed_curve.keys())
    for i in range(len(sizes_sorted) - 1):
        p1 = stream.passing(sizes_sorted[i])
        p2 = stream.passing(sizes_sorted[i + 1])
        assert p2 >= p1, f"Monotonía violada: {sizes_sorted[i]}mm={p1:.1f}% > {sizes_sorted[i+1]}mm={p2:.1f}%"


def test_product_finer_than_feed():
    """Después del chancador, P80 debe ser menor que la alimentación."""
    feed_curve = {
        406.4: 100, 304.8: 54, 203.2: 41, 152.4: 33, 101.6: 30, 76.2: 28,
        50.8: 18, 38.1: 15, 25.4: 12, 19.05: 10, 12.7: 9, 9.53: 8,
        6.35: 5, 4.76: 3, 2.38: 2, 2.0: 0.5
    }
    feed = Stream(100, feed_curve)
    feed_p80 = feed.pXX(80)
    
    # Chancador: debe producir más fino
    jaw_out = crusher(feed, css_mm=64, product_curve=JAW_PRODUCT_NORMALIZED)
    jaw_p80 = jaw_out.pXX(80)
    
    assert jaw_p80 <= feed_p80 * 1.1, \
        f"Chancador no reduce P80: feed={feed_p80:.1f}, output={jaw_p80:.1f}"


def test_screen_mass_balance():
    """El harnero debe conservar masa exacta: undersize + oversize = entrada."""
    feed_curve = {
        406.4: 100, 304.8: 54, 203.2: 41, 152.4: 33, 101.6: 30, 76.2: 28,
        50.8: 18, 38.1: 15, 25.4: 12, 19.05: 10, 12.7: 9, 9.53: 8,
        6.35: 5, 4.76: 3, 2.38: 2, 2.0: 0.5
    }
    feed = Stream(175, feed_curve)
    
    under, over = screen(feed, aperture_mm=38.1, efficiency=0.95)
    
    total_out = under.tph + over.tph
    assert abs(total_out - feed.tph) < 0.01, \
        f"Balance: entrada={feed.tph}, salida={total_out:.2f}"


if __name__ == "__main__":
    # Ejecutar tests
    pytest.main([__file__, "-v", "-s"])
