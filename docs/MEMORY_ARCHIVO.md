# MEMORY_ARCHIVO.md — Sesiones anteriores

Historial de sesiones ya cerradas. Se consulta solo si hay que auditar algo viejo.
La sesión más reciente vive en `MEMORY.md`; cuando llega una nueva, la anterior se mueve aquí.

Orden: la más reciente primero.

---

## 17-ago-2026 — Sesión autónoma (trabajo/2026-08-18) — T-15

**Resultado: T-15 completada. 299 tests verdes, 2 omitidos. Commit `d41b278`.**

| Tarea | Qué se logró | Commit |
|---|---|---|
| T-15 | `screen_capacity.py` con fórmula VSMA (factores B a F). 14 tests calibrados sobre el paper. | `d41b278` |

**Detalle técnico clave:**
- Factor B: exponencial calibrada en dos anclas (½"→3.80, 1"→5.50)
- El ejemplo del paper reproduce 13.16 y 3.97 tph/ft² con error < 1%
- 683 corregida: 10.1 → 10.95 m², catálogo actualizado con area_m2_per_deck para todas las seleccionadoras Finlay
- recommender.py ahora usa VSMA en vez de 80% fijo para cuellos de botella de pantalla

---

## 16-ago-2026 — Sesión autónoma (trabajo/2026-08-16) — T-06 a T-11

**Resultado: 5 de 6 tareas hechas. T-11 bloqueada. 284 tests verdes + 1 regresión reportada.**

| Tarea | Qué se logró | Commit |
|---|---|---|
| T-06 | Advertencias de cono choke-feed y chamber-fit conectadas al flujo real. Antes eran código muerto. | `f0f4397` |
| T-07 | `hours_per_month_input` como dato de entrada. Antes fijo en 500 h/mes. | `49dd4f4` |
| T-08 | `check_cone_chamber_fit` usa curva granulométrica real cuando está disponible (C1, C2, C3). | `8ec9dec` |
| T-09 | `min_product_mm` por modelo de mandíbula (6 modelos Finlay). Reemplaza constante global. | `a07b86d` |
| T-10 | C-1540: cap_max 300→220, css_min 10→19, css_max 44→32, feed_max 215→160, según manual. | `592af40` |
| T-11 | **BLOQUEADA.** Curvas de producto C-1540 son gráficos; entorno Windows sin pdftoppm no puede leerlas. | — |

**Bloqueos abiertos al cierre de esa sesión:**
- B-07: test `Hierro (circuito cerrado)` falla — tph obtenido 132 vs. 161 esperado. Marcelo decide si actualizar el test.
- B-08: T-11 bloqueada — necesita digitalización manual de curvas C-1540.

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
