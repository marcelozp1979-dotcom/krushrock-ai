"""
Módulo de granulometría — Clase Stream y operaciones con curvas de tamices
Arquitectura: cada corriente = (tph, curva % acumulado pasante sobre serie)
"""
import math
from bisect import bisect_left
from typing import Dict, List, Tuple

# Serie de tamices estándar (mm), descendente
SIEVES = [
    406.4, 304.8, 203.2, 152.4, 101.6, 76.2, 50.8, 38.1, 28.0, 25.4,
    20.0, 19.05, 14.0, 12.7, 10.0, 9.53, 6.35, 6.3, 5.0, 4.76,
    3.35, 2.38, 2.36, 2.0, 1.7, 1.18, 0.85, 0.6, 0.425, 0.3
]


def interp_log(x: float, xs: List[float], ys: List[float]) -> float:
    """
    Interpolación lineal en escala logarítmica de tamaño.
    xs: lista ascendente de tamaños (mm)
    ys: lista correspondiente de % pasante (0-100)
    
    Retorna % pasante interpolado al tamaño x.
    """
    if x <= xs[0]:
        # Extrapolación lineal hacia finos
        return ys[0] * (x / xs[0]) if xs[0] > 0 else 0.0
    if x >= xs[-1]:
        return ys[-1]
    
    i = bisect_left(xs, x)
    x0, x1 = xs[i - 1], xs[i]
    y0, y1 = ys[i - 1], ys[i]
    
    # Interpolación logarítmica
    t = (math.log(x) - math.log(x0)) / (math.log(x1) - math.log(x0))
    return y0 + t * (y1 - y0)


class Stream:
    """
    Corriente de material: flujo (tph) + curva granulométrica (% acumulado pasante).
    
    La curva se representa como dict {tamaño_mm: % pasante}, interpolable en log.
    """
    
    def __init__(self, tph: float, curve_dict: Dict[float, float]):
        """
        Inicializar corriente.
        
        Args:
            tph: toneladas por hora
            curve_dict: {tamaño_mm: % acumulado pasante}
        """
        if tph < 0:
            raise ValueError(f"tph debe ser >= 0, se recibió {tph}")
        
        pts = sorted(curve_dict.items())
        self.xs = [p[0] for p in pts]  # tamaños ascendentes
        self.ys = [p[1] for p in pts]  # % pasante correspondientes
        self.tph = tph
    
    def passing(self, size_mm: float) -> float:
        """Retorna el % acumulado pasante al tamaño size_mm."""
        return max(0.0, min(100.0, interp_log(size_mm, self.xs, self.ys)))
    
    def pXX(self, percentile: float) -> float:
        """
        Retorna el tamaño al que pasa el percentile % del material (e.g. P80).
        
        Búsqueda binaria en escala logarítmica.
        """
        if percentile <= 0 or percentile >= 100:
            raise ValueError(f"percentile debe estar entre 0 y 100, recibido: {percentile}")
        
        lo, hi = 0.01, self.xs[-1] * 2
        for _ in range(100):  # iteraciones suficientes para convergencia
            mid = math.sqrt(lo * hi)
            if self.passing(mid) < percentile:
                lo = mid
            else:
                hi = mid
        
        return math.sqrt(lo * hi)
    
    def mass_at(self, size_mm: float) -> float:
        """Retorna la masa (tph) acumulada pasante al tamaño size_mm."""
        return self.tph * self.passing(size_mm) / 100.0
    
    def as_table(self, sizes: List[float]) -> Dict[float, float]:
        """Retorna tabla {tamaño: % pasante} para una lista de tamaños."""
        return {s: round(self.passing(s), 1) for s in sizes}
    
    def to_dict(self) -> Dict[str, any]:
        """Serializar para JSON/API."""
        return {
            "tph": self.tph,
            "curve": {str(s): self.passing(s) for s in self.xs},
        }
    
    def __repr__(self) -> str:
        p80 = self.pXX(80)
        return f"Stream(tph={self.tph:.1f}, P80={p80:.1f}mm)"


def merge_streams(streams: List[Stream]) -> Stream:
    """Fusiona múltiples corrientes en una sola (suma de flujos)."""
    if not streams:
        raise ValueError("Se requiere al menos una corriente para fusionar")
    
    total_tph = sum(s.tph for s in streams)
    if total_tph == 0:
        # Retornar corriente vacía con la curva del primero
        return Stream(0, dict(zip(streams[0].xs, streams[0].ys)))
    
    # Promedio ponderado de las curvas
    merged_curve = {}
    for size in SIEVES:
        weighted_sum = sum(s.tph * s.passing(size) for s in streams)
        merged_curve[size] = weighted_sum / total_tph
    
    return Stream(total_tph, merged_curve)


def split_stream_by_size(stream: Stream, split_size_mm: float) -> Tuple[Stream, Stream]:
    """
    Divide una corriente en two: undersize (bajo split_size) y oversize (sobre split_size).
    
    Mantiene balance de masas exacto.
    """
    # Fracción bajo la malla
    frac_under = stream.passing(split_size_mm) / 100.0
    tph_under = stream.tph * frac_under
    tph_over = stream.tph * (1 - frac_under)
    
    # Curva del undersize (renormalizado a 100% bajo la malla)
    under_dict = {}
    for s in SIEVES:
        if s >= split_size_mm:
            under_dict[s] = 100.0
        else:
            under_dict[s] = 100.0 * stream.passing(s) / max(stream.passing(split_size_mm), 1e-6)
    
    # Curva del oversize (retenido, escalado)
    over_dict = {}
    for s in SIEVES:
        mass_under_s = tph_under * under_dict[s] / 100.0
        mass_feed_s = stream.mass_at(s)
        if tph_over > 0:
            over_dict[s] = 100.0 * (mass_feed_s - mass_under_s) / tph_over
        else:
            over_dict[s] = 0.0
    
    return Stream(tph_under, under_dict), Stream(tph_over, over_dict)
