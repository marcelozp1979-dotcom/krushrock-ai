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
import math
from typing import Dict, Optional, Tuple


def _interp_passing_at(curve_dict: Dict, size_mm: float) -> Optional[float]:
    """Interpola % pasante en size_mm desde una curva {mm: pct_pasante}. Log-lineal."""
    if not curve_dict:
        return None
    pairs = sorted((float(k), float(v)) for k, v in curve_dict.items())
    sizes = [p[0] for p in pairs]
    pcts  = [p[1] for p in pairs]
    if size_mm <= sizes[0]:
        return pcts[0]
    if size_mm >= sizes[-1]:
        return pcts[-1]
    for i in range(len(sizes) - 1):
        if sizes[i] <= size_mm <= sizes[i + 1]:
            log0 = math.log(sizes[i])
            log1 = math.log(sizes[i + 1])
            logm = math.log(max(size_mm, 1e-9))
            t = (logm - log0) / (log1 - log0)
            return pcts[i] + t * (pcts[i + 1] - pcts[i])
    return pcts[-1]

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


def check_cone_chamber_fit(
    cone: Dict,
    feed_p80_mm: float,
    feed_curve_dict: Optional[Dict] = None,
) -> Tuple[bool, str]:
    """
    Regla 5 (ADVERTENCIA): calce de alimentación con la cámara del cono.

    Criterio acordado D-05:
      C1. 90–100 % del material pasa por la boca (feed_max_mm).
      C2. 40–60 % del material pasa a mitad de cámara — requiere campo
          `mid_chamber_mm` por modelo (ningún cono del catálogo lo tiene todavía).
      C3. 0–10 % del material está bajo el CSS — requiere CSS del equipo, que no
          llega a esta función; debe verificarse por separado.

    Si feed_curve_dict está disponible se verifica C1 con la curva real.
    Si no, se usa el criterio simplificado anterior: P80 debe estar entre
    40 % y 90 % de la boca (backward-compat con los tests existentes).

    Retorna ok=True siempre — es advertencia, no descarte.
    Fuente: D-05 DECISIONS.md; Pit&Quarry "Tips to maximize crushing efficiency".
    """
    boca = cone.get("feed_max_mm") or 0
    modelo = cone.get("model", "Cono")
    if boca <= 0:
        return True, f"{modelo}: sin datos de boca de cámara — no se verifica calce"

    if feed_curve_dict:
        pct_boca = _interp_passing_at(feed_curve_dict, boca)
        if pct_boca is None:
            return True, f"{modelo}: curva de alimentación vacía — no se verifica calce"

        partes = [
            f"{modelo}: {pct_boca:.1f}% del material pasa la boca de {boca:.0f} mm"
        ]
        if pct_boca < 90.0:
            partes.insert(0, f"ADVERTENCIA {modelo}:")
            partes.append(
                f"(C1: debe ser ≥90%; hay {100-pct_boca:.1f}% de material "
                "que no cabe — revisar granulometría de entrada)"
            )
        else:
            partes.append("(C1 OK)")

        # C2: se necesita mid_chamber_mm por modelo de cono — dato no disponible
        partes.append(
            "C2 no verificable: falta campo 'mid_chamber_mm' en catálogo de conos."
        )
        # C3: se necesita CSS del equipo — no se pasa a esta función
        partes.append("C3 no verificable: CSS no disponible en esta comprobación.")

        return True, " ".join(partes)

    # ── Criterio simplificado (backward-compat, sin curva) ────────────────────
    ratio_boca = feed_p80_mm / boca
    if 0.40 <= ratio_boca <= 0.90:
        return True, (
            f"{modelo}: P80 de alimentación {feed_p80_mm:.0f} mm "
            f"({ratio_boca*100:.0f}% de boca {boca:.0f} mm) — calce aproximado OK "
            "(criterio simplificado; pasar feed_curve_dict para verificación real D-05)"
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
