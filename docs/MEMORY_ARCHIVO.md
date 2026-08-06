# MEMORY_ARCHIVO.md — Sesiones anteriores

Historial de sesiones ya cerradas. Se consulta solo si hay que auditar algo viejo.
La sesión más reciente vive en `MEMORY.md`; cuando llega una nueva, la anterior se mueve aquí.

Orden: la más reciente primero.

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
