# TASKS.md — Cola de trabajo

Estados: `PENDIENTE` · `EN CURSO` · `HECHA` · `BLOQUEADA`

El agente trabaja **en orden**, de arriba hacia abajo. No reordena la cola.
Reglas del ciclo en `WORKFLOW.md`. Prohibiciones en `WORKFLOW.md` sección 6.

Última actualización: 28-jul-2026

---

## T-01 · Corregir el conteo de flota en el ranking · HECHA

**Problema:** en `app/services/recommender.py`, la función `_rank_key` ordena por
`r["n_units"] * len(r["equipos"])`. Eso multiplica unidades por etapas, así que "2 mandíbulas
solas" (=2) le gana a "1 mandíbula + 1 cono + 1 seleccionadora" (=3), aunque la segunda sea
mejor solución.

**Qué hacer:** que el criterio compare el número real de máquinas del circuito, no el producto.

**Cómo se sabe que quedó bien:** test que arme los dos casos anteriores y verifique que gana
el tren de 3 etapas con 1 unidad cada una. Los 235 tests existentes siguen verdes.

**Referencia:** REQUISITOS.md RF-7.

---

## T-02 · Mensaje claro cuando el volumen pedido es imposible · HECHA

**Problema:** cuando ningún circuito alcanza el volumen en el plazo, el usuario recibe un
resultado vacío o confuso.

**Qué hacer:** devolver el tph requerido, el tph máximo alcanzable con la mejor configuración,
y las salidas concretas: cuántos meses más, cuántas horas más de jornada, o cuántos equipos más
harían falta. Texto entendible por alguien sin formación técnica.

**Cómo se sabe que quedó bien:** test con un caso deliberadamente imposible (volumen enorme,
plazo corto) que verifique que la respuesta trae los tres números y no viene vacía.

**Referencia:** REQUISITOS.md RF-8.

---

## T-03 · Módulo único de reglas de descarte (Etapa 2 del Plan Maestro) · HECHA

**Qué hacer:** crear `app/services/selection_rules.py` que concentre, en un solo lugar, todas
las reglas físicas que descartan un equipo. Cada regla debe devolver: si pasa o no, y **un motivo
en lenguaje simple** que se pueda mostrar al usuario.

Reglas mínimas a implementar (las tres primeras ya existen dispersas en `recommender.py`; moverlas
aquí sin cambiar su comportamiento):

1. Boca de entrada ≥ tamaño máximo real de la roca.
2. Razón de reducción por etapa dentro del límite del tipo de chancador.
3. La seleccionadora soporta el caudal y la malla pedida.
4. **Nueva:** un cono debe poder trabajar cerca del **80%** de su alimentación máxima
   (choke feed). Si quedaría muy por debajo, se descarta o se advierte.
5. **Nueva:** calce de cámara del cono con la alimentación: 90–100% pasante de la boca,
   40–60% a mitad de cámara, 0–10% del CSS.

**Importante:** las reglas 4 y 5 son nuevas y pueden cambiar qué equipos se recomiendan.
Implementarlas primero como **advertencia** (no descartan), y dejar anotado en `MEMORY.md`
qué casos cambiarían si pasaran a descartar. La decisión de activarlas la toma Marcelo.

**Cómo se sabe que quedó bien:** tests unitarios de cada regla por separado, con un caso que
pasa y uno que no. Los 235 tests existentes siguen verdes.

**Referencia:** REQUISITOS.md RF-5 · NOTAS_SELECCION_EQUIPOS.md · PLAN_MAESTRO.md Etapa 2.

---

## T-04 · Eliminar el catálogo duplicado del frontend · HECHA

**Problema:** `krushrock-app/src/.../catalogo.js` tiene una copia local de equipos (`EQ_LOCAL`)
que puede desincronizarse del backend.

**Qué hacer:** que el frontend consuma únicamente el catálogo del backend. Eliminar la copia local.

**Cuidado:** si algún componente depende de `EQ_LOCAL` para renderizar antes de que responda la
API, resolverlo con un estado de carga, no reintroduciendo datos locales.

**Cómo se sabe que quedó bien:** no queda ninguna referencia a `EQ_LOCAL` en el código.
Los tests siguen verdes. (El frontend no tiene tests automáticos: dejar anotado en `MEMORY.md`
que requiere prueba visual de Marcelo antes de integrar.)

**Referencia:** REQUISITOS.md RC-4.

---

## T-05 · Documentar las reglas del recommender que hoy no tienen fuente · HECHA

**Problema:** `recommender.py` tiene constantes decididas sin referencia escrita:
`capR = 0.80` (factor de capacidad efectiva), `_MAX_RATIO` (razones de reducción por tipo),
`_P100_FACTOR`, `_JAW_ONLY_MIN_MM = 50`, `_JAW_SCREEN_MIN_MM = 20`, `HOURS_PER_MONTH = 500`.

**Qué hacer:** para cada constante, agregar un comentario con su justificación y su fuente si
existe. Las que **no** tengan fuente identificable se listan en `MEMORY.md` bajo
"BLOQUEOS PARA MARCELO" para que él confirme o corrija el valor.

**No cambiar ningún valor.** Esta tarea es solo de documentación.

**Cómo se sabe que quedó bien:** todas las constantes comentadas; lista de las sin fuente en
`MEMORY.md`. Los tests siguen verdes.

**Referencia:** REQUISITOS.md RF-10.

---

## Tareas fuera del alcance nocturno

Estas **no** se ejecutan sin supervisión. Están aquí para que no se pierdan.

| Tarea | Por qué no de noche |
|---|---|
| Cargar curvas de conos Finlay C-1540/1545/1550 | Los folletos públicos no traen tablas tph vs CSS. Verificado 28-jul-2026. Marcelo debe subir los manuales. |
| Cargar datos Metso Nordberg C | Requiere validar que la fuente sea real y citable, y decidir cómo tratar diferencias de definición de CSS. |
| Optimización conjunta de CSS (Etapa 3) | Depende de datos de conos que hoy no existen. Optimizaría sobre números aproximados. |
| Cuentas y límites por plan (Etapa 5) | Decisión comercial de Marcelo. |
| Conectar Vercel ↔ GitHub | Requiere entrar a la cuenta de Marcelo. |
| Corregir la inconsistencia del J-1175 | Requiere consultar el manual físico que tiene Marcelo. |
