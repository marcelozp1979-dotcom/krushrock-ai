"""
KrushRock — Motor de Aprendizaje (Fase 7)
Calcula correcciones de modelo basadas en feedback real de terreno.
Se ejecuta como job periódico o via endpoint API.

Uso:
  python3 learning_engine.py                     # procesa feedback de Supabase
  python3 learning_engine.py --export modelo.json # exporta modelo entrenado
"""

import json, math, sys
from datetime import datetime, timedelta
from collections import defaultdict
from typing import List, Dict, Optional, Any

# ─────────────────────────────────────────────────────────────────────────────
# MOTOR DE APRENDIZAJE
# ─────────────────────────────────────────────────────────────────────────────

def calc_mae(errors: List[float]) -> float:
    return sum(abs(e) for e in errors) / len(errors) if errors else 0.0

def calc_bias(errors: List[float]) -> float:
    return sum(errors) / len(errors) if errors else 0.0

def calc_r2(preds: List[float], reals: List[float]) -> float:
    if len(preds) < 2: return 0.0
    mean = sum(reals) / len(reals)
    ss_tot = sum((r - mean)**2 for r in reals)
    ss_res = sum((r - p)**2 for r, p in zip(reals, preds))
    return max(0.0, 1 - ss_res / ss_tot) if ss_tot > 0 else 0.0

def calc_accuracy(preds: List[float], reals: List[float], threshold_pct: float = 10.0) -> float:
    if not preds: return 0.0
    within = sum(
        1 for p, r in zip(preds, reals)
        if abs(r - p) / max(abs(p), 0.001) * 100 <= threshold_pct
    )
    return (within / len(preds)) * 100


class KrushRockLearningEngine:
    """
    Motor de aprendizaje que:
    1. Analiza errores de predicción vs medición real
    2. Calcula factores de corrección por variable, roca y circuito
    3. Detecta deriva del modelo (concept drift)
    4. Exporta correcciones para aplicar en simulaciones futuras
    """

    def __init__(self, feedback_data: List[Dict]):
        self.feedback = sorted(feedback_data, key=lambda f: f.get("date", ""))
        self.model_version = len(feedback_data)

    def run(self) -> Dict[str, Any]:
        if not self.feedback:
            return {"error": "Sin datos de feedback para entrenar"}

        metrics    = self._calc_metrics()
        rock_adj   = self._calc_rock_adjustments()
        circuit_adj= self._calc_circuit_adjustments()
        drift      = self._detect_drift()
        corrections= self._build_corrections(metrics, rock_adj)
        outliers   = self._detect_outliers()
        trends     = self._calc_trends()

        return {
            "version":        self.model_version,
            "trained_at":     datetime.utcnow().isoformat(),
            "n_observations": len(self.feedback),
            "date_range":     {
                "from": self.feedback[0].get("date"),
                "to":   self.feedback[-1].get("date"),
            },
            "metrics":        metrics,
            "rock_adjustments":    rock_adj,
            "circuit_adjustments": circuit_adj,
            "drift_detected": drift,
            "corrections":    corrections,
            "outliers":       outliers,
            "trends":         trends,
            "quality_score":  self._calc_quality_score(metrics),
        }

    def _calc_metrics(self) -> Dict:
        p80_errors  = [f["real_p80"]  - f["pred_p80"]  for f in self.feedback]
        cc_errors   = [f["real_cc"]   - f["pred_cc"]   for f in self.feedback]
        tph_errors  = [f["real_tph"]  - f["pred_tph"]  for f in self.feedback]
        opex_errors = [f["real_opex"] - f["pred_opex"] for f in self.feedback]

        def metric(errors, preds, reals, label):
            return {
                "mae":      round(calc_mae(errors), 3),
                "bias":     round(calc_bias(errors), 3),
                "rmse":     round(math.sqrt(sum(e**2 for e in errors)/len(errors)), 3),
                "accuracy_10pct": round(calc_accuracy(preds, reals, 10.0), 1),
                "accuracy_5pct":  round(calc_accuracy(preds, reals, 5.0), 1),
                "r2":       round(calc_r2(preds, reals), 4),
                "n":        len(errors),
            }

        return {
            "p80":  metric(p80_errors,
                           [f["pred_p80"]  for f in self.feedback],
                           [f["real_p80"]  for f in self.feedback], "p80"),
            "cc":   metric(cc_errors,
                           [f["pred_cc"]   for f in self.feedback],
                           [f["real_cc"]   for f in self.feedback], "cc"),
            "tph":  metric(tph_errors,
                           [f["pred_tph"]  for f in self.feedback],
                           [f["real_tph"]  for f in self.feedback], "tph"),
            "opex": metric(opex_errors,
                           [f["pred_opex"] for f in self.feedback],
                           [f["real_opex"] for f in self.feedback], "opex"),
        }

    def _calc_rock_adjustments(self) -> Dict:
        by_rock = defaultdict(list)
        for f in self.feedback:
            by_rock[f["rock"]].append(f)

        result = {}
        for rock, data in by_rock.items():
            p80_errs = [d["real_p80"] - d["pred_p80"] for d in data]
            cc_errs  = [d["real_cc"]  - d["pred_cc"]  for d in data]
            result[rock] = {
                "n":                len(data),
                "p80_bias":         round(calc_bias(p80_errs), 3),
                "cc_bias":          round(calc_bias(cc_errs), 3),
                "p80_correction_factor": round(1 + calc_bias(p80_errs) / max(
                    sum(d["pred_p80"] for d in data)/len(data), 1), 4),
                "avg_humidity":     round(sum(d.get("humidity",0) for d in data)/len(data), 1),
                "avg_wi":           round(sum(d.get("wi",14) for d in data)/len(data), 2),
                "recommendation":   _rock_recommendation(rock, calc_bias(p80_errs), calc_bias(cc_errs)),
            }
        return result

    def _calc_circuit_adjustments(self) -> Dict:
        by_circuit = defaultdict(list)
        for f in self.feedback:
            by_circuit[f.get("circuit","closed")].append(f)

        result = {}
        for circuit, data in by_circuit.items():
            cc_errs = [d["real_cc"] - d["pred_cc"] for d in data]
            result[circuit] = {
                "n":         len(data),
                "cc_bias":   round(calc_bias(cc_errs), 3),
                "cc_factor": round(1 + calc_bias(cc_errs)/20, 4),
            }
        return result

    def _detect_drift(self) -> Dict:
        """Detecta si el modelo se está degradando con el tiempo (concept drift)."""
        if len(self.feedback) < 6:
            return {"detected": False, "reason": "Datos insuficientes (mín. 6 obs)"}

        half = len(self.feedback) // 2
        early = self.feedback[:half]
        recent = self.feedback[half:]

        mae_early  = calc_mae([f["real_p80"]-f["pred_p80"] for f in early])
        mae_recent = calc_mae([f["real_p80"]-f["pred_p80"] for f in recent])
        improvement = (mae_early - mae_recent) / mae_early * 100 if mae_early > 0 else 0

        drift_detected = mae_recent > mae_early * 1.2  # 20% degradación

        return {
            "detected":     drift_detected,
            "mae_early":    round(mae_early, 3),
            "mae_recent":   round(mae_recent, 3),
            "improvement_pct": round(improvement, 1),
            "trend":        "mejorando" if improvement > 5 else ("estable" if improvement > -5 else "degradando"),
            "action": "Reentrenar con datos más recientes" if drift_detected else "Modelo estable",
        }

    def _build_corrections(self, metrics: Dict, rock_adj: Dict) -> Dict:
        """Factores de corrección globales para aplicar a simulaciones futuras."""
        p80_bias  = metrics["p80"]["bias"]
        cc_bias   = metrics["cc"]["bias"]
        tph_bias  = metrics["tph"]["bias"]
        opex_bias = metrics["opex"]["bias"]

        avg_pred_p80 = sum(f["pred_p80"] for f in self.feedback) / len(self.feedback)
        avg_pred_cc  = sum(f["pred_cc"]  for f in self.feedback) / len(self.feedback)
        avg_pred_tph = sum(f["pred_tph"] for f in self.feedback) / len(self.feedback)

        return {
            "p80_additive":  round(p80_bias * 0.7, 3),   # 70% del bias para no sobre-corregir
            "cc_additive":   round(cc_bias  * 0.7, 3),
            "tph_additive":  round(tph_bias * 0.7, 1),
            "opex_additive": round(opex_bias* 0.7, 4),
            "p80_factor":    round(1 + (p80_bias  / max(avg_pred_p80, 1)) * 0.7, 5),
            "cc_factor":     round(1 + (cc_bias   / max(avg_pred_cc,  1)) * 0.7, 5),
            "tph_factor":    round(1 + (tph_bias  / max(avg_pred_tph, 1)) * 0.7, 5),
            "opex_factor":   round(1 + opex_bias * 0.5, 5),
            "confidence":    min(100, len(self.feedback) * 8),   # % confianza del modelo
            "per_rock":      {r: {"p80_additive": round(d["p80_bias"]*0.7, 3)}
                              for r, d in rock_adj.items()},
        }

    def _detect_outliers(self) -> List[Dict]:
        """Identifica mediciones atípicas que podrían indicar errores de entrada."""
        p80_errs = [abs(f["real_p80"]-f["pred_p80"]) for f in self.feedback]
        if not p80_errs: return []
        mean_err = sum(p80_errs)/len(p80_errs)
        std_err  = math.sqrt(sum((e-mean_err)**2 for e in p80_errs)/len(p80_errs))

        outliers = []
        for f, err in zip(self.feedback, p80_errs):
            if err > mean_err + 2*std_err:
                outliers.append({
                    "id":      f["id"],
                    "project": f["project"],
                    "date":    f["date"],
                    "p80_error": round(err, 2),
                    "z_score": round((err-mean_err)/std_err, 2) if std_err > 0 else 0,
                    "possible_cause": _guess_cause(f),
                })
        return outliers

    def _calc_trends(self) -> List[Dict]:
        """Tendencia del error a lo largo del tiempo."""
        return [
            {
                "date":    f["date"],
                "p80_abs_err": round(abs(f["real_p80"]-f["pred_p80"]), 2),
                "cc_abs_err":  round(abs(f["real_cc"] -f["pred_cc"]), 2),
                "rating":  f["rating"],
            }
            for f in self.feedback
        ]

    def _calc_quality_score(self, metrics: Dict) -> float:
        """Score global de calidad del modelo 0–100."""
        acc_p80  = metrics["p80"]["accuracy_10pct"]
        acc_cc   = metrics["cc"]["accuracy_10pct"]
        acc_tph  = metrics["tph"]["accuracy_10pct"]
        acc_opex = metrics["opex"]["accuracy_10pct"]
        avg_rating = sum(f["rating"] for f in self.feedback) / len(self.feedback) * 20
        n_bonus = min(20, len(self.feedback) * 2)

        score = (acc_p80 * 0.35 + acc_cc * 0.25 + acc_tph * 0.20 + acc_opex * 0.10
                 + avg_rating * 0.05 + n_bonus * 0.05)
        return round(score, 1)


def _rock_recommendation(rock: str, p80_bias: float, cc_bias: float) -> str:
    if abs(p80_bias) < 1.0 and abs(cc_bias) < 2.0:
        return f"Modelo preciso para {rock}. Sin ajuste necesario."
    parts = []
    if p80_bias > 2.0:
        parts.append(f"Subestima P80 en {p80_bias:.1f}mm → considerar Wi real más alto")
    elif p80_bias < -2.0:
        parts.append(f"Sobreestima P80 en {abs(p80_bias):.1f}mm → revisar curvas CSS")
    if cc_bias > 3.0:
        parts.append(f"Subestima CC en {cc_bias:.1f}% → revisar eficiencia zaranda para esta roca")
    return "; ".join(parts) if parts else "Ajuste menor recomendado."


def _guess_cause(f: Dict) -> str:
    if f.get("humidity", 0) >= 2:
        return "Alta humedad puede haber reducido eficiencia de zaranda más de lo modelado"
    if f.get("wi", 14) > 18:
        return "Wi muy alto — material más duro de lo esperado, mayor energía y menor TPH real"
    if f.get("rating", 5) <= 2:
        return "Operador reportó baja calidad — posible variación en alimentación o condición equipo"
    return "Revisar condiciones de operación del día"


# ─────────────────────────────────────────────────────────────────────────────
# ROUTER FastAPI (se registra en main.py)
# ─────────────────────────────────────────────────────────────────────────────
try:
    from fastapi import APIRouter, Depends, HTTPException
    from pydantic import BaseModel
    from typing import List as FList

    from app.core.supabase import get_supabase
    from app.routers.auth import get_current_user

    router = APIRouter()

    class FeedbackEntry(BaseModel):
        simulation_id:    Optional[str] = None
        project:          str
        equip:            str
        rock:             str
        circuit:          str = "closed"
        pred_p80:         float
        real_p80:         float
        pred_cc:          float
        real_cc:          float
        pred_tph:         float
        real_tph:         float
        pred_opex:        float
        real_opex:        float
        rating:           int   # 1–5
        comment:          str = ""
        humidity:         int = 0
        wi:               float = 14.0

    @router.post("/feedback")
    async def submit_feedback(data: FeedbackEntry, user=Depends(get_current_user)):
        """Registra una medición real de terreno para entrenamiento del modelo."""
        sb = get_supabase()
        record = {
            **data.dict(),
            "id":         __import__("uuid").uuid4().__str__(),
            "user_id":    user["id"],
            "date":       datetime.utcnow().date().isoformat(),
            "created_at": datetime.utcnow().isoformat(),
        }
        result = sb.table("sim_feedback").insert(record).execute()
        return result.data[0]

    @router.get("/model")
    async def get_model(days: int = 90, user=Depends(get_current_user)):
        """Retorna el estado actual del modelo de aprendizaje."""
        sb = get_supabase()
        since = (datetime.utcnow() - timedelta(days=days)).date().isoformat()
        result = sb.table("sim_feedback").select("*").gte("date", since).execute()

        if not result.data:
            return {"message": "Sin datos de feedback aún. Comienza ingresando mediciones reales."}

        engine = KrushRockLearningEngine(result.data)
        return engine.run()

    @router.get("/model/corrections")
    async def get_corrections(user=Depends(get_current_user)):
        """Retorna solo los factores de corrección para aplicar en simulaciones."""
        sb = get_supabase()
        result = sb.table("sim_feedback").select("*").limit(200).execute()
        if not result.data:
            return {"corrections": None, "message": "Sin datos suficientes"}
        engine = KrushRockLearningEngine(result.data)
        model = engine.run()
        return {"corrections": model["corrections"], "quality_score": model["quality_score"]}

    @router.get("/feedback")
    async def list_feedback(limit: int = 50, user=Depends(get_current_user)):
        sb = get_supabase()
        result = sb.table("sim_feedback").select("*").eq(
            "user_id", user["id"]).order("date", desc=True).limit(limit).execute()
        return result.data

except ImportError:
    # No FastAPI disponible — solo se usa como script standalone
    router = None


# ─────────────────────────────────────────────────────────────────────────────
# DEMO STANDALONE
# ─────────────────────────────────────────────────────────────────────────────
DEMO_FEEDBACK = [
    {"id":"f1","date":"2025-05-01","project":"Cantera Norte","equip":"J-1280+C-1545","rock":"granito","circuit":"closed","pred_p80":25,"real_p80":27.2,"pred_cc":22.1,"real_cc":24.8,"pred_tph":300,"real_tph":285,"pred_opex":2.84,"real_opex":3.01,"rating":4,"comment":"CC mayor al esperado","humidity":1,"wi":15.5},
    {"id":"f2","date":"2025-05-03","project":"Línea Basalto","equip":"LT120+LT220D","rock":"basalto","circuit":"closed","pred_p80":32,"real_p80":30.1,"pred_cc":28.4,"real_cc":26.9,"pred_tph":500,"real_tph":512,"pred_opex":3.12,"real_opex":2.98,"rating":5,"comment":"Muy cerca de la simulación","humidity":0,"wi":17.0},
    {"id":"f3","date":"2025-05-05","project":"Retrofit","equip":"J-1175+C-1545","rock":"porfido","circuit":"scalper","pred_p80":22,"real_p80":24.8,"pred_cc":19.5,"real_cc":23.2,"pred_tph":280,"real_tph":261,"pred_opex":2.61,"real_opex":2.89,"rating":3,"comment":"Arcillas afectaron zaranda","humidity":2,"wi":16.0},
    {"id":"f4","date":"2025-05-08","project":"Caliza","equip":"J-1160+C-1540","rock":"caliza","circuit":"mid","pred_p80":20,"real_p80":20.9,"pred_cc":16.2,"real_cc":17.1,"pred_tph":150,"real_tph":147,"pred_opex":3.45,"real_opex":3.38,"rating":5,"comment":"Predicción muy precisa","humidity":0,"wi":11.2},
    {"id":"f5","date":"2025-05-10","project":"Rancagua","equip":"Premiertrak 600+1300 Maxtrak","rock":"granito","circuit":"closed","pred_p80":25,"real_p80":28.5,"pred_cc":23.8,"real_cc":29.1,"pred_tph":420,"real_tph":388,"pred_opex":2.91,"real_opex":3.24,"rating":2,"comment":"Granito muy abrasivo","humidity":1,"wi":15.5},
    {"id":"f6","date":"2025-05-12","project":"Cantera Norte","equip":"J-1280+C-1545","rock":"granito","circuit":"closed","pred_p80":25,"real_p80":26.1,"pred_cc":22.1,"real_cc":22.9,"pred_tph":300,"real_tph":298,"pred_opex":2.84,"real_opex":2.88,"rating":5,"comment":"Modelo ajustado mejoró mucho","humidity":1,"wi":15.5},
    {"id":"f7","date":"2025-05-15","project":"Cuarcita","equip":"J-1480+C-1550","rock":"cuarcita","circuit":"closed","pred_p80":30,"real_p80":34.2,"pred_cc":31.5,"real_cc":38.7,"pred_tph":400,"real_tph":362,"pred_opex":3.45,"real_opex":4.12,"rating":2,"comment":"Wi real fue 21.2","humidity":0,"wi":19.5},
    {"id":"f8","date":"2025-05-17","project":"Arenisca","equip":"J-960+C-1540","rock":"arenisca","circuit":"scalper","pred_p80":18,"real_p80":18.4,"pred_cc":14.2,"real_cc":14.8,"pred_tph":150,"real_tph":153,"pred_opex":2.21,"real_opex":2.19,"rating":5,"comment":"Excelente precisión","humidity":0,"wi":9.5},
    {"id":"f9","date":"2025-05-19","project":"Basalto","equip":"MC120+MCO110","rock":"basalto","circuit":"closed","pred_p80":28,"real_p80":29.8,"pred_cc":26.1,"real_cc":28.4,"pred_tph":350,"real_tph":338,"pred_opex":2.95,"real_opex":3.08,"rating":4,"comment":"Pequeña subestimación CC","humidity":1,"wi":17.0},
    {"id":"f10","date":"2025-05-21","project":"Cobre","equip":"LT120+C-1545","rock":"cobre","circuit":"scalper","pred_p80":22,"real_p80":23.1,"pred_cc":20.8,"real_cc":22.3,"pred_tph":480,"real_tph":471,"pred_opex":3.18,"real_opex":3.27,"rating":4,"comment":"Resultados muy aceptables","humidity":2,"wi":14.0},
]

if __name__ == "__main__":
    print("=" * 65)
    print("KrushRock — Motor de Aprendizaje (Demo)")
    print("=" * 65)

    engine = KrushRockLearningEngine(DEMO_FEEDBACK)
    model  = engine.run()

    print(f"\n📊 Modelo v{model['version']} · {model['n_observations']} observaciones")
    print(f"   Período: {model['date_range']['from']} → {model['date_range']['to']}")
    print(f"   Score de calidad: {model['quality_score']}/100")

    print("\n── MÉTRICAS DE PRECISIÓN ──────────────────────────────────────")
    for var, m in model["metrics"].items():
        print(f"  {var.upper():6s}  MAE={m['mae']:7.3f}  Bias={m['bias']:+7.3f}"
              f"  Accuracy(10%)={m['accuracy_10pct']:5.1f}%  R²={m['r2']:.4f}")

    print("\n── CORRECCIONES ACTIVAS ───────────────────────────────────────")
    c = model["corrections"]
    print(f"  P80  factor: ×{c['p80_factor']}  (+{c['p80_additive']} mm aditivo)")
    print(f"  CC   factor: ×{c['cc_factor']}   (+{c['cc_additive']} % aditivo)")
    print(f"  TPH  factor: ×{c['tph_factor']}   ({c['tph_additive']} tph aditivo)")
    print(f"  OPEX factor: ×{c['opex_factor']}  (confianza: {c['confidence']}%)")

    print("\n── AJUSTES POR ROCA ────────────────────────────────────────────")
    for rock, d in model["rock_adjustments"].items():
        print(f"  {rock:12s}  ({d['n']} obs)  P80 bias: {d['p80_bias']:+.2f}mm  "
              f"→ {d['recommendation'][:60]}")

    print("\n── DERIVA DEL MODELO ───────────────────────────────────────────")
    dr = model["drift_detected"]
    print(f"  Tendencia: {dr['trend']}  |  Mejora: {dr['improvement_pct']:+.1f}%")
    if dr["detected"]:
        print(f"  ⚠ DERIVA DETECTADA: {dr['action']}")
    else:
        print(f"  ✓ Modelo estable")

    if model["outliers"]:
        print("\n── OUTLIERS DETECTADOS ─────────────────────────────────────────")
        for o in model["outliers"]:
            print(f"  {o['date']} | {o['project']} | Error P80: {o['p80_abs_err']}mm (z={o['z_score']})")
            print(f"    Causa probable: {o['possible_cause']}")

    if "--export" in sys.argv:
        idx = sys.argv.index("--export")
        out_file = sys.argv[idx+1] if idx+1 < len(sys.argv) else "modelo_krushrock.json"
        with open(out_file, "w") as f:
            json.dump(model, f, indent=2, ensure_ascii=False)
        print(f"\n✓ Modelo exportado: {out_file}")

    print("\n" + "=" * 65)
