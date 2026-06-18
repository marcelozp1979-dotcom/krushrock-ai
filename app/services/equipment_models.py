"""
Modelos de equipos — transformaciones de corrientes (Stream) basadas en curvas normalizadas
Arquitectura: cada modelo de equipo trae su curva de producto normalizada (d/CSS → % pasante)
"""
from typing import Dict, Tuple
from app.services.granulometry import Stream, interp_log, SIEVES


# ── CURVAS DE PRODUCTO NORMALIZADAS (d/CSS → % pasante) ──────────────────────
# CONO: calibrada con Finlay C-1540RS @ CSS 20 mm, reporte AggFlow real
# Producto típico de cono secundario para agregados
CONE_PRODUCT_NORMALIZED = {
    0.059: 18,
    0.085: 21,
    0.118: 25,
    0.1675: 31,
    0.25: 38,
    0.315: 44,
    0.50: 58,
    0.70: 71,
    1.00: 84,
    1.40: 95,
    1.90: 100
}

# MANDÍBULA: curva típica doble efecto (literatura Metso/Telsmith)
# Consistente con dato AggFlow: CSS 90 mm → ~36% bajo 38 mm
JAW_PRODUCT_NORMALIZED = {
    0.10: 10,
    0.20: 20,
    0.40: 34,
    0.60: 48,
    0.80: 62,
    1.00: 75,
    1.20: 85,
    1.40: 93,
    1.60: 98,
    1.70: 100
}

# IMPACTOR / VSI: más fino, para productos < 10 mm
IMPACTOR_PRODUCT_NORMALIZED = {
    0.05: 12,
    0.10: 20,
    0.20: 32,
    0.40: 48,
    0.60: 62,
    0.80: 74,
    1.00: 84,
    1.20: 92,
    1.40: 97,
    1.60: 100
}


def crusher(
    stream: Stream,
    css_mm: float,
    product_curve: Dict[float, float]
) -> Stream:
    """
    Chancador (mandíbula, cono, impactor, etc.):
    Transforma una corriente usando curva de producto normalizada.
    
    El producto es la curva normalizada escalada por el CSS:
    - d/CSS → % pasante (% acumulado pasante)
    - Se interpola para cada tamaño de la serie de tamices
    
    Simplificación importante: los finos menores a CSS que ya estaban
    en la alimentación se conservan sin cambio (el chancador no crea finos
    menores a su apertura).
    
    Args:
        stream: corriente de entrada
        css_mm: Closed Side Setting (mm)
        product_curve: curva normalizada {d/CSS: % pasante}
    
    Returns:
        Stream con el producto del chancador (mismo tph, curva transformada)
    """
    if css_mm <= 0:
        raise ValueError(f"CSS debe ser > 0, recibido: {css_mm}")
    if stream.tph <= 0:
        return stream
    
    # Extraer tamaños y % pasante de la curva normalizada
    xs_norm = sorted(product_curve.keys())
    ys_norm = [product_curve[k] for k in xs_norm]
    
    product_dict = {}
    for s in SIEVES:
        # Calcular d/CSS
        d_css = s / css_mm
        
        # Interpolar % pasante de la curva normalizada
        if d_css <= xs_norm[0] * 0.2:
            # Extrapolación lineal para muy finos
            p_crush = (d_css / xs_norm[0]) * ys_norm[0]
        else:
            p_crush = interp_log(d_css, xs_norm, ys_norm)
        
        p_crush = max(0.0, min(100.0, p_crush))
        
        # Conservar finos ya existentes en la alimentación (no pueden crearse)
        # Si el tamaño es menor a ~ CSS/2, el chancador no afecta
        if s < css_mm * 0.5:
            p_crush = max(p_crush, stream.passing(s))
        
        product_dict[s] = p_crush
    
    return Stream(stream.tph, product_dict)


def screen(
    stream: Stream,
    aperture_mm: float,
    efficiency: float = 0.85
) -> Tuple[Stream, Stream]:
    """
    Harnero/Zaranda: separa una corriente en undersize y oversize.
    
    La partición se basa en la curva de alimentación real:
    - Fracción bajo la abertura = % que pasa el aperture en la alimentación
    - Esa fracción se recupera en undersize con eficiencia E
    - El resto va a oversize
    
    Mantiene balance de masas exacto: undersize + oversize = entrada.
    
    Args:
        stream: corriente de entrada
        aperture_mm: abertura de la malla (mm)
        efficiency: eficiencia de clasificación (0-1), default 0.85
    
    Returns:
        (Stream undersize, Stream oversize)
    """
    if aperture_mm <= 0:
        raise ValueError(f"aperture_mm debe ser > 0, recibido: {aperture_mm}")
    if not (0 < efficiency <= 1.0):
        raise ValueError(f"efficiency debe estar en (0, 1], recibido: {efficiency}")
    
    # Fracción de material bajo la abertura en la alimentación
    frac_under_feed = stream.passing(aperture_mm) / 100.0
    
    # Tonelaje que pasa a undersize (con eficiencia)
    tph_under = stream.tph * frac_under_feed * efficiency
    tph_over = stream.tph - tph_under
    
    # Curva del undersize: alimentación "truncada" arriba del aperture
    # Se renormaliza a 100% bajo el aperture
    under_dict = {}
    for s in SIEVES:
        if s >= aperture_mm:
            under_dict[s] = 100.0
        else:
            under_dict[s] = 100.0 * stream.passing(s) / max(stream.passing(aperture_mm), 1e-6)
    
    # Curva del oversize: balance de masas por tamaño
    over_dict = {}
    for s in SIEVES:
        mass_under_s = tph_under * under_dict[s] / 100.0
        mass_feed_s = stream.tph * stream.passing(s) / 100.0
        
        if tph_over > 1e-6:
            over_dict[s] = 100.0 * (mass_feed_s - mass_under_s) / tph_over
        else:
            # Si no hay material en oversize, llenar con la curva del oversize puro
            over_dict[s] = 100.0 if s >= aperture_mm else 0.0
    
    return Stream(tph_under, under_dict), Stream(tph_over, over_dict)


def get_predefined_curves() -> Dict[str, Dict]:
    """Retorna dict con las curvas normalizadas predefinidas por tipo de equipo."""
    return {
        "jaw": JAW_PRODUCT_NORMALIZED,
        "cone": CONE_PRODUCT_NORMALIZED,
        "impactor": IMPACTOR_PRODUCT_NORMALIZED,
    }
