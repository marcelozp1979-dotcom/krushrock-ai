"""
app/services/selection_rules.py — Reglas físicas de selección de equipos.

Cada función devuelve (ok: bool, motivo: str):
  ok=True  → el equipo pasa la regla
  ok=False → el equipo se descarta por esta regla
  motivo   → texto legible por alguien sin formación técnica

Reglas 4 y 5 (choke feed y calce de cámara) son ADVERTENCIAS:
siempre retornan ok=True pero motivo describe la situación.
La decisión de activarlas como descarte la toma Marcelo.
"""
from typing import Dict, Tuple

# Multiplicador P100_producto / CSS por tipo de chancador
# Fuente: curvas normalizadas de fabricante (jaw≈2.5, cone≈1.6 según spec de Terex Finlay)
_P100_FACTOR: Dict[str, float] = {
    "jaw": 2.5, "scalper": 2.5,
    "cone": 1.6,
    "hsi": 2.0, "vsi": 2.0, "impactor": 2.0,
}

# Límite de razón de reducción por tipo de chancador (feed_max / P100_producto)
# Fuente: norma de ingeniería de procesos de chancado; jaw≤6, cono≤5, impactor≤8
_MAX_RATIO: Dict[str, float] = {
    "jaw": 6.0, "scalper": 6.0,
    "cone": 5.0,
    "hsi": 8.0, "vsi": 8.0, "impactor": 8.0,
}


def check_crusher_feed(equipment: Dict, feed_max_mm: float) -> Tuple[bool, str]:
    """
    Regla 1: la boca de entrada del equipo debe aceptar el tamaño máximo real de la roca.
    Se aplica a mandíbulas y conos.
    """
    boca = equipment.get("feed_max_mm") or 0
    modelo = equipment.get("model", "Equipo")
    if boca >= feed_max_mm:
        return True, (
            f"{modelo}: boca de {boca:.0f} mm acepta el material "
            f"de hasta {feed_max_mm:.0f} mm"
        )
    return False, (
        f"{modelo}: boca de {boca:.0f} mm es menor que el tamaño máximo del material "
        f"({feed_max_mm:.0f} mm) — se descarta"
    )


def check_reduction_ratio(
    crusher_type: str, feed_max_mm: float, css_mm: float
) -> Tuple[bool, str]:
    """
    Regla 2: la razón de reducción por etapa no debe superar el límite del tipo de chancador.
    razón = feed_max / (CSS × factor_P100)
    """
    factor = _P100_FACTOR.get(crusher_type, 2.5)
    limit  = _MAX_RATIO.get(crusher_type, 6.0)
    if css_mm <= 0:
        return False, f"CSS {css_mm} mm es inválido (debe ser > 0)"
    ratio = feed_max_mm / (css_mm * factor)
    if ratio <= limit:
        return True, (
            f"Razón de reducción {ratio:.1f}:1 está dentro del límite "
            f"de {limit:.0f}:1 para {crusher_type}"
        )
    return False, (
        f"Razón de reducción requerida {ratio:.1f}:1 supera el límite "
        f"de {limit:.0f}:1 para {crusher_type} — se necesita una etapa adicional"
    )


def check_screen_decks(screen: Dict, n_products: int) -> Tuple[bool, str]:
    """
    Regla 3: la seleccionadora debe tener decks suficientes para el número de fracciones de producto.
    3 o más productos → mínimo triple deck. Hasta 2 productos → doble deck basta.
    """
    min_decks = 3 if n_products >= 3 else 2
    decks = screen.get("decks") or 2
    modelo = screen.get("model", "Seleccionadora")
    if decks >= min_decks:
        return True, (
            f"{modelo}: {decks} decks — apta para clasificar {n_products} fracción(es)"
        )
    return False, (
        f"{modelo}: {decks} decks insuficientes para {n_products} fracción(es) "
        f"de producto (se necesitan al menos {min_decks} decks)"
    )


def check_cone_choke_feed(cone: Dict, feed_tph: float) -> Tuple[bool, str]:
    """
    Regla 4 (ADVERTENCIA): un cono debe trabajar cerca del 80% de su alimentación máxima
    para operar en condición de cámara llena (choke feed).
    Un cono con cámara llena produce más fino y desgasta más uniformemente.
    Retorna ok=True siempre — es advertencia, no descarte.
    Fuente: D-04 DECISIONS.md; 911Metallurgist, Pit&Quarry, Pilot Crushtec, Terex Cedarapids.
    """
    cap_max = cone.get("cap_max_tph") or 0
    modelo = cone.get("model", "Cono")
    if cap_max <= 0:
        return True, f"{modelo}: sin datos de capacidad máxima — no se verifica choke feed"
    ratio = feed_tph / cap_max
    if ratio >= 0.80:
        return True, (
            f"{modelo}: alimentación de {feed_tph:.0f} tph es el "
            f"{ratio*100:.0f}% de la capacidad — cámara bien cargada"
        )
    return True, (
        f"ADVERTENCIA {modelo}: alimentación de {feed_tph:.0f} tph "
        f"({ratio*100:.0f}% de la capacidad). Lo recomendado es ≥ 80% "
        "para trabajar en condición choke feed. El cono puede producir más grueso de lo esperado"
    )


def check_cone_chamber_fit(cone: Dict, feed_p80_mm: float) -> Tuple[bool, str]:
    """
    Regla 5 (ADVERTENCIA): la alimentación al cono debe calzar con su cámara.
    Criterio simplificado: el P80 de alimentación debe estar entre el 40% y el 90%
    del diámetro de boca del cono.
    Si el P80 es muy pequeño relativo a la boca, la cámara está sobredimensionada.
    Si el P80 es mayor al 90% de la boca, hay riesgo de atasco.
    Retorna ok=True siempre — es advertencia, no descarte.
    Fuente: D-05 DECISIONS.md; Pit&Quarry "Tips to maximize crushing efficiency".
    """
    boca = cone.get("feed_max_mm") or 0
    modelo = cone.get("model", "Cono")
    if boca <= 0:
        return True, f"{modelo}: sin datos de boca de cámara — no se verifica calce"
    ratio_boca = feed_p80_mm / boca
    if 0.40 <= ratio_boca <= 0.90:
        return True, (
            f"{modelo}: P80 de alimentación {feed_p80_mm:.0f} mm "
            f"({ratio_boca*100:.0f}% de boca {boca:.0f} mm) — calce de cámara adecuado"
        )
    if ratio_boca > 0.90:
        return True, (
            f"ADVERTENCIA {modelo}: P80 {feed_p80_mm:.0f} mm es {ratio_boca*100:.0f}% "
            f"de boca {boca:.0f} mm — alimentación cercana al límite superior. "
            "Revisar distribución granulométrica antes de operar"
        )
    return True, (
        f"ADVERTENCIA {modelo}: P80 {feed_p80_mm:.0f} mm es solo "
        f"{ratio_boca*100:.0f}% de boca {boca:.0f} mm — la cámara está "
        "sobredimensionada para esta alimentación"
    )
