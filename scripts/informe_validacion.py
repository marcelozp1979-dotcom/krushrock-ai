"""
KrushRock — Generador de informe de validacion

Corre todos los casos de tests/casos_validacion_reales.json con run_config()
y genera VALIDACION.md en la raiz del proyecto con una tabla de resultados.

Uso:
    python scripts/informe_validacion.py
"""
import sys
import json
import subprocess
from datetime import date
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from app.services.recommender import run_config
from app.routers.equipment import _FALLBACK

# Mismos aliases que test_casos_reales.py
_FULL_NAME_ALIASES: dict = {
    "Minyu MS 4230":    ("jaw",    "Terex Finlay", "J-1175"),
    "Minyu MSP 300 F":  ("cone",   "Terex Finlay", "C-1540"),
    "Minyu MOP2460D":   ("cone",   "Sandvik",      "QH332"),
    "MEKA 90/2000 ROS": ("screen", "Kleemann",     "MS 703i"),
}
_MODEL_ALIASES: dict = {
    "883+":    ("screen", "Terex Finlay", "694+"),
    "MS 703i": ("screen", "Kleemann",     "MS 703i"),
}


def _resolve_equipo(nombre: str) -> dict:
    if nombre in _FULL_NAME_ALIASES:
        et, ma, mo = _FULL_NAME_ALIASES[nombre]
        return {"etapa": et, "marca": ma, "modelo": mo}
    partes = nombre.rsplit(" ", 1)
    if len(partes) != 2:
        raise ValueError(f"No se puede parsear equipo: {nombre!r}")
    marca, modelo = partes
    for etapa, equipos in _FALLBACK.items():
        for eq in equipos:
            if eq.get("model") == modelo and eq.get("brand") == marca:
                return {"etapa": etapa, "marca": eq["brand"], "modelo": eq["model"]}
    if modelo in _MODEL_ALIASES:
        et, ma, mo = _MODEL_ALIASES[modelo]
        return {"etapa": et, "marca": ma, "modelo": mo}
    raise ValueError(f"Equipo no resuelto: {nombre!r}")


def _git_hash() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=ROOT, text=True, stderr=subprocess.DEVNULL,
        ).strip()
    except Exception:
        return "desconocido"


# Campos numericos a verificar con tolerancia ±15%
_CAMPOS_NUMERICOS = ["tph_util", "meses_requeridos", "product_fit_pct"]


def _run_caso(caso: dict) -> list:
    """Ejecuta run_config() para el caso y devuelve lista de filas para la tabla."""
    nombre = caso["nombre"]
    cert = caso.get("certificacion", "referencia")
    duracion = caso["plazo_meses"]
    esperado = caso["esperado"]

    equipos = [_resolve_equipo(n) for n in caso["equipos"]]
    products = [{
        "name": caso["producto_objetivo"].get("name", "producto"),
        "min_mm": float(caso["producto_objetivo"]["min_mm"]),
        "max_mm": float(caso["producto_objetivo"]["max_mm"]),
        "volumen_ton": float(caso["producto_objetivo"]["volumen_ton"]),
    }]

    feed_curve_dict: Optional[dict] = None
    if "feed_curve" in caso:
        feed_curve_dict = {
            float(p["size_mm"]): float(p["passing_pct"])
            for p in caso["feed_curve"]
        }

    try:
        result = run_config(
            equipos=equipos,
            f80_mm=float(caso["f80_mm"]),
            products=products,
            duracion_meses=int(duracion),
            rock_type=caso.get("rock_type", "granito"),
            n_units=1,
            circuit=caso.get("circuito", "open"),
            horas_dia=float(caso["horas_dia"]),
            dias_mes=float(caso["dias_mes"]),
            feed_curve_dict=feed_curve_dict,
        )
        error = None
    except Exception as exc:
        result = None
        error = str(exc)

    filas = []

    for campo in _CAMPOS_NUMERICOS:
        if campo not in esperado:
            continue
        esp = float(esperado[campo])
        if result is None:
            filas.append({
                "nombre": nombre, "cert": cert, "campo": campo,
                "esp": f"{esp:.2f}", "obt": f"ERROR: {error}",
                "diff_abs": "-", "diff_pct": "-", "estado": "ERROR",
            })
            continue
        obt = result.get(campo)
        if obt is None:
            filas.append({
                "nombre": nombre, "cert": cert, "campo": campo,
                "esp": f"{esp:.2f}", "obt": "None",
                "diff_abs": "-", "diff_pct": "-", "estado": "ERROR",
            })
            continue
        obt_f = float(obt)
        diff_abs = abs(obt_f - esp)
        diff_pct = (diff_abs / abs(esp) * 100.0) if esp != 0 else 0.0
        estado = "PASS" if diff_abs <= abs(esp) * 0.15 else "FAIL"
        filas.append({
            "nombre": nombre, "cert": cert, "campo": campo,
            "esp": f"{esp:.2f}", "obt": f"{obt_f:.2f}",
            "diff_abs": f"{diff_abs:.2f}", "diff_pct": f"{diff_pct:.1f}%",
            "estado": estado,
        })

    # cumple_plazo (booleano)
    if "cumple_plazo" in esperado:
        esp_cp = esperado["cumple_plazo"]
        if result is None:
            filas.append({
                "nombre": nombre, "cert": cert, "campo": "cumple_plazo",
                "esp": str(esp_cp), "obt": f"ERROR: {error}",
                "diff_abs": "-", "diff_pct": "-", "estado": "ERROR",
            })
        else:
            obt_cp = result.get("cumple_plazo")
            estado_cp = "PASS" if obt_cp == esp_cp else "FAIL"
            filas.append({
                "nombre": nombre, "cert": cert, "campo": "cumple_plazo",
                "esp": str(esp_cp), "obt": str(obt_cp),
                "diff_abs": "-", "diff_pct": "-", "estado": estado_cp,
            })

    return filas


def main() -> None:
    casos_path = ROOT / "tests" / "casos_validacion_reales.json"
    casos = json.loads(casos_path.read_text(encoding="utf-8"))["casos"]

    todas_filas = []
    for caso in casos:
        todas_filas.extend(_run_caso(caso))

    git_hash = _git_hash()
    hoy = date.today().isoformat()

    lines = [
        "# KrushRock — Informe de Validacion",
        "",
        f"Commit: `{git_hash}` · Fecha: {hoy}",
        "",
        "| Caso | Cert. | Campo | Esperado | Obtenido | Delta abs | Delta % | Estado |",
        "|------|-------|-------|----------|----------|-----------|---------|--------|",
    ]

    for f in todas_filas:
        icon = "✅" if f["estado"] == "PASS" else ("❌" if f["estado"] == "FAIL" else "⚠️")
        lines.append(
            f"| {f['nombre']} | {f['cert']} | {f['campo']} "
            f"| {f['esp']} | {f['obt']} "
            f"| {f['diff_abs']} | {f['diff_pct']} "
            f"| {icon} {f['estado']} |"
        )

    n_pass  = sum(1 for f in todas_filas if f["estado"] == "PASS")
    n_fail  = sum(1 for f in todas_filas if f["estado"] == "FAIL")
    n_error = sum(1 for f in todas_filas if f["estado"] == "ERROR")

    lines += [
        "",
        f"**Resumen:** {n_pass} PASS · {n_fail} FAIL · {n_error} ERROR "
        f"de {len(todas_filas)} verificaciones",
        "",
        "---",
        "_Generado por `scripts/informe_validacion.py`_",
    ]

    out_path = ROOT / "VALIDACION.md"
    out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Generado: {out_path}")
    print(f"  {n_pass} PASS, {n_fail} FAIL, {n_error} ERROR de {len(todas_filas)} verificaciones")


if __name__ == "__main__":
    main()
