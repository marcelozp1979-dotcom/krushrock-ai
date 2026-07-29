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
