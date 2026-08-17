"""
T-06: Advertencias de conos enchufadas al flujo real del recommender.

check_cone_choke_feed y check_cone_chamber_fit ahora viajan en el resultado.
"""
import pytest
from app.services.recommender import recommend


# ── Caso base: producto fino (25 mm), granito, volumen pequeño ───────────────
# J-960 (cap_max=175 tph) es el cuello de botella; los conos tienen cap≥200 tph.
# cap_per_unit ≈ 175 × 0.80 × wi_factor ≈ 125-135 tph < 80% de cualquier cono.
_BASE = {
    "rock_type": "granito",
    "f80_mm": 150.0,
    "products": [{"name": "grava", "min_mm": 0, "max_mm": 25, "volumen_ton": 100_000}],
    "duracion_meses": 12,
    "inchancables": False,
}


def _get_cone_results(results):
    """Filtra resultados que incluyen al menos un cono en el circuito."""
    return [r for r in results if any(
        eq.get("etapa") == "cone" for eq in r.get("equipos", [])
    )]


def test_campo_advertencias_siempre_presente():
    """Todo resultado tiene campo 'advertencias' (lista, puede estar vacía)."""
    results = recommend(**_BASE, _return_all=True)
    assert results, "El recommender no devolvió resultados"
    for r in results:
        assert "advertencias" in r, f"Falta campo 'advertencias' en config={r['config']}"
        assert isinstance(r["advertencias"], list)


def test_cone_subalimentado_genera_advertencia_choke():
    """Un cono con cap_max >> throughput del circuito genera advertencia de choke feed."""
    results = recommend(**_BASE, _return_all=True)
    cone_results = _get_cone_results(results)
    assert cone_results, "No se generaron circuitos con cono para el caso de prueba"

    # Al menos un resultado con cono debe tener advertencia de choke feed
    advertencias_totales = [adv for r in cone_results for adv in r["advertencias"]]
    choke_warnings = [a for a in advertencias_totales if "choke" in a.lower() or "80%" in a]
    assert choke_warnings, (
        "Se esperaba advertencia de choke feed en al menos un resultado con cono. "
        f"Advertencias encontradas: {advertencias_totales}"
    )


def test_advertencias_solo_en_resultados_con_cono():
    """Los circuitos sin cono (jaw_only, jaw_screen) no deben tener advertencias de choke."""
    results = recommend(**_BASE, _return_all=True)
    sin_cono = [r for r in results if not any(
        eq.get("etapa") == "cone" for eq in r.get("equipos", [])
    )]
    for r in sin_cono:
        choke_advs = [a for a in r.get("advertencias", []) if "choke" in a.lower() or "80%" in a]
        assert not choke_advs, (
            f"Config {r['config']} sin cono no debería tener advertencia de choke: {choke_advs}"
        )


def test_advertencias_son_strings_no_vacios():
    """Cada advertencia en la lista es un string no vacío."""
    results = recommend(**_BASE, _return_all=True)
    for r in results:
        for adv in r.get("advertencias", []):
            assert isinstance(adv, str) and adv.strip(), (
                f"Advertencia inválida en config={r['config']}: {adv!r}"
            )


def test_top2_resultados_incluyen_advertencias():
    """El resultado top-2 (no _return_all) también lleva el campo 'advertencias'."""
    results = recommend(**_BASE)
    assert results
    for r in results:
        assert "advertencias" in r
        assert isinstance(r["advertencias"], list)
