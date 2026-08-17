# MEMORY_ARCHIVO.md — Sesiones anteriores

Historial de sesiones ya cerradas. Se consulta solo si hay que auditar algo viejo.
La sesión más reciente vive en `MEMORY.md`; cuando llega una nueva, la anterior se mueve aquí.

Orden: la más reciente primero.

---

## 29-jul-2026 / 03-ago-2026 — Sesión autónoma (nocturno/2026-07-29)

**Resultado: 5 de 5 tareas hechas. 262 tests verdes.**

| Tarea | Qué se logró | Commit |
|---|---|---|
| T-01 | Ranking corregido: circuito de 1 unidad con 3 etapas gana a 2 mandíbulas sueltas. | `431ab7b` |
| T-02 | Caso imposible: mensaje con tph requerido, máximo alcanzable y opciones (meses/horas/unidades). | `74ae222` |
| T-03 | Módulo único de reglas de descarte (`selection_rules.py`). Reglas de conos como advertencia. | `134994c` |
| T-04 | Catálogo eliminado del frontend; única fuente en el backend. Frontend en pantalla de carga hasta recibir API. | `df87b6b` |
| T-05 | Constantes del recommender documentadas; 5 sin fuente marcadas en B-03. | `adb5e84` |

**Bloqueos abiertos en ese momento:**
- B-03: 5 constantes sin fuente — HOURS_PER_MONTH, capR, _WI_REF, _JAW_ONLY_MIN_MM, _JAW_SCREEN_MIN_MM
- B-04: segundo punto de retorno vacío en recommender.py (`if not jaws: return []`)
- B-05: reglas de conos no conectadas al recommender → resuelto en T-06

---

## 28-jul-2026 — Sesión con Marcelo (no autónoma)

**Hecho:**

- Confirmado el pytest pendiente del commit de topología: 106 tests verdes, push `2219fdd`.
- Escrito `REQUISITOS.md` (Etapa 0) y `PLAN_MAESTRO.md`.
- Escrito `tests/test_catalogo_coherencia.py` (Etapa 1). **235 tests verdes.**
- Creados `WORKFLOW.md`, `TASKS.md`, `DECISIONS.md` y `MEMORY.md`.

**Hallazgos:**

- Solo 5 de 79 equipos del catálogo tienen datos reales de manual con fuente citada
  (J-960, J-1170, J-1175, J-1280, Premiertrak R400 — todas mandíbulas).
- Ningún cono (17 modelos) tiene curva de capacidad ni fuente.
- 16 impactores (HSI) no declaran rango de CSS.
- El ranking del recommender no tenía criterio de eficiencia de producción: elegía la flota
  más chica que cumple el plazo.
- El entorno de Marcelo quedó con Python 3.13 desde python.org; `pytest` se instala aparte
  porque no está en `requirements.txt`.

**Tareas nuevas descubiertas (trasladadas a `TASKS.md` como T-01 y T-05):**

- Corregir el conteo de flota en `_rank_key`.
- Documentar las constantes sin fuente de `recommender.py`.

**Idea anotada, no ejecutada:** agregar `pytest` a `requirements.txt` o crear un
`requirements-dev.txt`. Evitaría el problema que costó media sesión ese día.
