# MEMORY.md — Memoria de trabajo

Contexto vivo entre iteraciones. El agente escribe aquí mientras trabaja; Marcelo lo lee
primero en la mañana. **Se escribe para que se entienda sin ser programador.**

Qué va aquí:
- hipótesis probadas y descartadas,
- hallazgos inesperados,
- tareas nuevas descubiertas (se anotan, **no** se ejecutan si no están en `TASKS.md`),
- bloqueos para Marcelo.

Qué NO va aquí: decisiones firmes (van a `DECISIONS.md`) ni el estado de las tareas
(va a `TASKS.md`).

---

## BLOQUEOS PARA MARCELO

*(el agente agrega aquí las preguntas que no puede resolver solo)*

### B-01 · Manuales de conos Finlay
Los folletos públicos del C-1540 no traen tabla de capacidad tph vs CSS (verificado
28-jul-2026, folleto oficial Terex 2022). Se necesitan los manuales de servicio de
C-1540, C-1545 y C-1550. **Bloquea la Etapa 3 completa.**

### B-02 · Inconsistencia J-1175
El catálogo declara `cap_min_tph = 200`, pero la curva del manual baja a 122,5 tph en el CSS
más cerrado. Uno de los dos datos está mal. Revisar el manual y decir cuál corregir.

---

## Registro de sesiones

### 28-jul-2026 — Sesión con Marcelo (no autónoma)

**Hecho:**
- Confirmado el pytest pendiente del commit de topología: 106 tests verdes, push `2219fdd`.
- Escrito `REQUISITOS.md` (Etapa 0) y `PLAN_MAESTRO.md`.
- Escrito `tests/test_catalogo_coherencia.py` (Etapa 1). **235 tests verdes.**
- Creados `WORKFLOW.md`, `TASKS.md`, `DECISIONS.md` y este archivo.

**Hallazgos:**
- Solo 5 de 79 equipos del catálogo tienen datos reales de manual con fuente citada
  (J-960, J-1170, J-1175, J-1280, Premiertrak R400 — todas mandíbulas).
- Ningún cono (17 modelos) tiene curva de capacidad ni fuente.
- 16 impactores (HSI) no declaran rango de CSS.
- El ranking del recommender no tiene criterio de eficiencia de producción: elige la flota
  más chica que cumple el plazo.
- El entorno de Marcelo quedó con Python 3.13 desde python.org; `pytest` se instala aparte
  porque no está en `requirements.txt`.

**Tareas nuevas descubiertas (ya trasladadas a `TASKS.md`):**
- Corregir el conteo de flota en `_rank_key` (T-01).
- Documentar las constantes sin fuente de `recommender.py` (T-05).

**Idea anotada, no ejecutada:** agregar `pytest` a `requirements.txt` o crear un
`requirements-dev.txt`. Evitaría el problema que costó media sesión hoy.

---

*(las sesiones autónomas se agregan debajo, la más reciente primero)*

---

### 29-jul-2026 — Sesión autónoma nocturna

**T-01 · Corregir conteo de flota en _rank_key — EN CURSO**

Hipótesis: cambiar la clave de ranking de `(n_units * len(equipos), cap_sum)` a
`(n_units, len(equipos), cap_sum)`. Esto separa las dos dimensiones: primero se
prefieren circuitos con menos líneas paralelas (n_units), luego los de menos etapas,
y como desempate el de menor capacidad total instalada.

Efecto concreto: "1 mandíbula + 1 cono + 1 seleccionadora" con n_units=1 → rank=(1,3,x)
vence a "2 mandíbulas solas" con n_units=2 → rank=(2,1,x) porque 1 < 2 en el primer campo.

Revisado que los tests existentes (test_un_equipo_grande_vence_a_dos_chicos,
test_andesita_recomienda_equipo_mayor_no_dos_chicos, test_coarse_fewer_stages_than_fine)
siguen siendo correctos con este cambio: todos dependen de que n_units=1 gane sobre
n_units=2, lo cual la nueva clave garantiza.

**RESULTADO: 238 tests verdes. Commit 431ab7b. Push nocturno/2026-07-29. T-01 HECHA.**

---

**T-02 · Mensaje cuando el volumen pedido es imposible — HECHA**

Implementado: tph_requerido, tph_max_alcanzable, meses_extra, unidades_extra en TODOS
los resultados. Si results queda vacío (todas las sims fallaron), devuelve resultado
"sin_datos" en vez de lista vacía. Commit 74ae222. 5 tests nuevos.

Hallazgo T-02: hay un `if not jaws: return []` en línea ~367 de recommender.py que
también devuelve lista vacía sin mensaje. Está fuera del alcance de T-02 (la tarea pedía
específicamente el caso de volumen imposible, no el de feed sin jaws). Anotado para revisión futura.

---

**T-03 · Módulo único de reglas de descarte — HECHA**

Creado `app/services/selection_rules.py` con 5 funciones check_*. Reglas 4-5 como advertencia.
recommender.py importa desde este módulo — ya no tiene `_P100_FACTOR` ni `_MAX_RATIO` propios.
Commit 134994c. 19 tests nuevos.

---

**T-04 · Eliminar catálogo local del frontend — HECHA**

`EQ_LOCAL` eliminado de catalogo.js (renombrado `_EQ_REMOVED`, sin export).
Todos los imports limpiados. App.jsx inicializa con null → muestra pantalla de carga
mientras llega el catálogo del backend. Commit df87b6b.

**REQUIERE PRUEBA VISUAL DE MARCELO:** el frontend no tiene tests automáticos.
Verificar que la app carga correctamente y muestra el catálogo del backend.
Si la API no responde, la app queda en estado de carga (sin fallback local — es intencional).

---

**T-05 · Documentar constantes sin fuente — HECHA**

Todas las constantes documentadas. Las 5 marcadas BLOQUEO B-03 no tienen fuente citable propia.
Commit: ver git log. 262 tests verdes.

---

### B-03 · Constantes sin fuente en recommender.py

Marcelo debe confirmar o corregir estos valores antes de que el sistema quede en producción:

| Constante | Valor actual | Justificación usada | Pregunta |
|---|---|---|---|
| `HOURS_PER_MONTH` | 500 h/mes | 6000 h/año ÷ 12 — estándar industria móvil | ¿Aplica para tus proyectos? (áridos con paros mayores puede ser 400–450) |
| `capR` | 0.80 | Factor 75–85% citado en Metso Crushing Handbook §3.2 | ¿Usas 80% o tienes un valor propio? |
| `_WI_REF` | 13.0 | Wi promedio de "roca media" — tablas de Bond (1952) | ¿Aceptable como referencia? ¿Tienes Wi típico de tus proyectos? |
| `_JAW_ONLY_MIN_MM` | 50.0 | css_min mandíbula × factor P100 | ¿Para los proyectos que haces, una mandíbula sola llega a productos de 50 mm? |
| `_JAW_SCREEN_MIN_MM` | 20.0 | Umbral empírico | ¿20 mm es el límite real que usas para jaw + seleccionadora en circuito abierto? |
