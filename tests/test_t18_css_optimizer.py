"""
Tests T-18 — Optimizador de CSS.

Premisa central (D-06): el CSS óptimo para un tren mandíbula+cono+seleccionadora
NO es el mínimo posible. Cerrar la mandíbula al mínimo la convierte en el cuello
de botella aunque el cono siguiente tenga capacidad de sobra.
"""
import pytest
from app.services.granulometry import Stream
from app.services.css_optimizer import optimize_css, _grid_css, _capacity_at_css


# ── Equipos de prueba ─────────────────────────────────────────────────────────
# Mandíbula: capacidad crece claramente con el CSS (120 a 400 tph).
_JAW = {
    "model": "JAW-Test",
    "type": "jaw",
    "css_min_mm": 50.0,
    "css_max_mm": 125.0,
    "cap_min_tph": 120.0,
    "cap_max_tph": 400.0,
    "curves": {
        "css": [50.0, 75.0, 100.0, 125.0],
        "tph": [120.0, 200.0, 300.0, 400.0],
    },
}

# Cono: capacidad siempre superior a la mandíbula → el cuello de botella está en la mandíbula.
_CONE = {
    "model": "CONE-Test",
    "type": "cone",
    "css_min_mm": 20.0,
    "css_max_mm": 50.0,
    "cap_min_tph": 250.0,
    "cap_max_tph": 550.0,
    "curves": {
        "css": [20.0, 30.0, 40.0, 50.0],
        "tph": [250.0, 350.0, 450.0, 550.0],
    },
}

_SCREEN = {
    "model": "SCREEN-Test",
    "type": "screen",
    "decks": 2,
    "area_m2_per_deck": 7.344,
}

# Alimentación ROM gruesa (500 tph): la mayoría del material está sobre 200 mm.
_FEED = Stream(500.0, {
    50: 5, 100: 15, 200: 35, 300: 55, 500: 80, 800: 100
})

_PRODUCTS = [{"min_mm": 0, "max_mm": 50}]
_CRUSHERS = [("jaw", _JAW), ("cone", _CONE)]


def test_optimizado_supera_css_minimo():
    """
    D-06: la combinación óptima produce más tph de producto que cerrar todos al mínimo.

    Al mínimo (jaw=50, cone=20): capacidad = 120 × 0.8 = 96 tph → bajo throughput.
    Al óptimo (CSS más alto en mandíbula): mayor caudal compensa material fuera de rango.
    """
    result = optimize_css(
        crushers_with_types=_CRUSHERS,
        screen_eq=_SCREEN,
        feed_stream=_FEED,
        products=_PRODUCTS,
    )
    assert "error" not in result, f"Optimizador falló: {result.get('error')}"
    assert result["best_tph"] > 0
    assert result["mejora_vs_css_minimo_pct"] > 0, (
        f"El CSS óptimo ({result['best_tph']:.0f} tph) debe superar al mínimo. "
        f"Mejora reportada: {result['mejora_vs_css_minimo_pct']:.1f}%"
    )


def test_css_elegido_dentro_de_rango():
    """El CSS elegido para cada equipo está dentro del rango válido del catálogo."""
    result = optimize_css(
        crushers_with_types=_CRUSHERS,
        screen_eq=_SCREEN,
        feed_stream=_FEED,
        products=_PRODUCTS,
    )
    assert "error" not in result
    for item, (ctype, eq) in zip(result["best_css"], _CRUSHERS):
        css = item["css_mm"]
        assert css >= eq["css_min_mm"] - 0.1, (
            f"{ctype}: CSS {css} está bajo el mínimo {eq['css_min_mm']}"
        )
        assert css <= eq["css_max_mm"] + 0.1, (
            f"{ctype}: CSS {css} supera el máximo {eq['css_max_mm']}"
        )


def test_resultado_tiene_campos_obligatorios():
    """El resultado incluye: alternatives, razon, n_combinaciones, best_css, best_pct."""
    result = optimize_css(
        crushers_with_types=_CRUSHERS,
        screen_eq=_SCREEN,
        feed_stream=_FEED,
        products=_PRODUCTS,
    )
    assert "error" not in result
    for campo in ("best_css", "best_tph", "best_pct", "alternatives", "razon", "n_combinaciones"):
        assert campo in result, f"Falta campo '{campo}' en el resultado"
    assert isinstance(result["alternatives"], list)
    assert isinstance(result["razon"], str) and len(result["razon"]) > 10


def test_grid_css_paso_minimo():
    """_grid_css: paso mínimo 2 mm, máximo max_steps puntos, extremos exactos."""
    grid = _grid_css(50.0, 125.0, max_steps=10)
    assert len(grid) <= 10
    assert grid[0] == pytest.approx(50.0)
    assert grid[-1] == pytest.approx(125.0)
    for i in range(1, len(grid)):
        assert grid[i] - grid[i - 1] >= 2.0 - 1e-6, f"Paso menor a 2 mm: {grid}"


def test_capacity_at_css_interpola():
    """_capacity_at_css: coincide exactamente en los nodos y es monotónica."""
    assert _capacity_at_css(_JAW, 50.0) == pytest.approx(120.0)
    assert _capacity_at_css(_JAW, 75.0) == pytest.approx(200.0)
    assert _capacity_at_css(_JAW, 100.0) == pytest.approx(300.0)
    assert _capacity_at_css(_JAW, 125.0) == pytest.approx(400.0)
    # Punto intermedio dentro del rango
    mid = _capacity_at_css(_JAW, 87.5)
    assert 200.0 < mid < 300.0


def test_sin_chancadores_retorna_error():
    """Sin chancadores en el tren el optimizador retorna error estructurado."""
    result = optimize_css([], None, _FEED, _PRODUCTS)
    assert "error" in result


def test_alimentacion_tph_limita_caudal():
    """alimentacion_tph externo se respeta: best_tph ≤ alimentacion_tph × capR."""
    alim = 80.0
    result = optimize_css(
        crushers_with_types=_CRUSHERS,
        screen_eq=_SCREEN,
        feed_stream=_FEED,
        products=_PRODUCTS,
        alimentacion_tph=alim,
    )
    assert "error" not in result
    # El producto no puede superar el total alimentado × capR × rendimiento máximo
    assert result["best_tph"] <= alim * 1.01
