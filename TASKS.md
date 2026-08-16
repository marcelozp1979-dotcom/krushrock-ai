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

## T-06 · Conectar las dos reglas de conos al recommender (cierra T-03) · PENDIENTE

**Problema:** `check_cone_choke_feed` y `check_cone_chamber_fit` existen en
`app/services/selection_rules.py` con sus tests, pero `recommender.py` **no las importa ni las
llama**. Son código muerto: nunca producen una advertencia en el flujo real.

**Qué hacer:**

1. Importarlas y llamarlas en `recommender.py` donde se evalúa cada cono candidato.
2. Su resultado **no descarta** el equipo: se acumula el mensaje en una lista de advertencias
   que viaja con el resultado, para que el usuario pueda verla.
3. Anotar en `MEMORY.md` cuántos casos de los tests existentes generarían advertencia si las
   reglas pasaran a descartar. Eso es lo que Marcelo necesita para decidir si las activa.

**Cómo se sabe que quedó bien:** un test que simule un caso con cono sub-alimentado y verifique
que la advertencia aparece en el resultado. Los 262 tests existentes siguen verdes.

**Referencia:** REQUISITOS.md RF-5 · MEMORY.md B-05.

---

## T-07 · Horas de operación como dato de entrada · PENDIENTE

**Qué hacer:** `HOURS_PER_MONTH = 500` deja de ser constante. Pasa a ser un campo que el usuario
puede ingresar en la simulación, con 500 h/mes como valor por defecto. El valor usado debe
aparecer en el PDF de propuesta como supuesto declarado.

**Cómo se sabe que quedó bien:** test que corra el mismo caso con 500 y con 400 h/mes y verifique
que el plazo calculado cambia en la proporción correcta.

**Referencia:** DECISIONS.md D-12.

---

## T-08 · Revisar el criterio de calce de cámara del cono · PENDIENTE

**Problema:** `check_cone_chamber_fit` implementa un criterio simplificado (P80 de alimentación
entre 40% y 90% de la boca) que **no es** el acordado en D-05: 90–100% pasante de la boca,
40–60% a mitad de cámara, 0–10% del CSS.

**Qué hacer:** implementar el criterio real usando la curva granulométrica completa de la
alimentación, no solo el P80. Si falta el dato de "punto medio de cámara" por modelo, decirlo
y dejarlo anotado en vez de aproximarlo.

**Referencia:** DECISIONS.md D-05 · MEMORY.md B-05.

---

## T-09 · Umbral de mandíbula sola: de constante global a dato por modelo · PENDIENTE

**Problema:** `_JAW_ONLY_MIN_MM = 50` es una constante única para todas las mandíbulas. En la
realidad cada modelo tiene un tamaño mínimo de producto útil distinto, según su cámara.

**Qué hacer:**

1. Agregar el campo `min_product_mm` a cada mandíbula del catálogo (`app/routers/equipment.py`),
   con estos valores confirmados por Marcelo:

   | Modelo | `min_product_mm` |
   |---|---|
   | J-960 | 50 |
   | J-1160 | 50 |
   | J-1170 | 75 |
   | J-1175 | 75 |
   | J-1280 | 75 |
   | J-1480 | 100 |

2. En `recommender.py`, reemplazar el uso de `_JAW_ONLY_MIN_MM` por el campo del equipo.
3. Para las mandíbulas del catálogo que **no** tienen este dato (las 14 restantes, sin manual),
   no inventar un valor: dejar el campo en `None` y aplicar el comportamiento actual, anotando
   en `MEMORY.md` cuáles quedaron sin dato.

**Cómo se sabe que quedó bien:** test que verifique que un J-1480 no se propone solo para un
producto de 60 mm, y que un J-960 sí. Los 262 tests existentes siguen verdes.

**Cuidado:** esta tarea toca el catálogo. Los valores de la tabla son de Marcelo y no se
modifican ni se extrapolan a otros modelos.

**Referencia:** DECISIONS.md D-14.

---

## T-10 · Corregir los datos del C-1540 en el catálogo · PENDIENTE · PRIORIDAD ALTA

**Problema:** el catálogo declara valores que no coinciden con el manual oficial. El software
sobreestima la capacidad de la máquina hasta en un 36% y permite cerrar el cono al doble de lo
que admite.

**Qué hacer:** en `app/routers/equipment.py`, entrada `C-1540`, reemplazar por los valores del
manual (configuración excéntrico largo, cóncavo Medium Coarse — ver DECISIONS.md D-15):

| Campo | Valor actual | Valor correcto |
|---|---|---|
| `css_min_mm` | 10 | **19** |
| `css_max_mm` | 44 | **32** |
| `cap_min_tph` | 150 | **125** |
| `cap_max_tph` | 300 | **220** |
| `feed_max_mm` | 215 | **160** |

Agregar además la curva real de capacidad:

```
"curves": {"css": [19, 22, 25, 28, 32], "tph": [135.0, 160.0, 170.0, 180.0, 190.0]}
```

(punto medio de cada rango de la Tabla 3.4, mismo criterio que se usó con las mandíbulas)

Y la fuente:

```
"capacity_source": "Manual Terex Finlay C-1540 Rev 2.7 (16-04-2025), Tabla 3.4 p.3-14 — excéntrico largo, cóncavo Medium Coarse; punto medio de rangos"
```

**Cuidado:** este cambio va a alterar qué equipos recomienda el sistema en casos que hoy usan
el C-1540. Es lo correcto, pero hay que revisar qué tests de validación cambian de resultado y
**no ajustar los casos de validación para que calcen** — si un caso se rompe, se reporta.

**Cómo se sabe que quedó bien:** los tests de coherencia del catálogo siguen verdes y el C-1540
aparece con `capacity_source`. Anotar en `MEMORY.md` qué casos cambiaron de resultado.

**Referencia:** `docs/DATOS_MANUAL_C-1540.md` · DECISIONS.md D-15 · REQUISITOS.md RF-10.

---

## T-11 · Digitalizar las curvas de producto del C-1540 · PENDIENTE

**Problema:** las curvas de producto del manual (Tablas 3.5, 3.8, 3.11, 3.14) son **gráficos**,
no tablas. Las lecturas que hay en `docs/DATOS_MANUAL_C-1540.md` son aproximadas (±5 puntos) y
**no deben cargarse al catálogo tal cual**.

**Qué hacer:** digitalizar la curva de la Tabla 3.5 (excéntrico largo) leyendo el % pasante de
cada una de las 5 curvas en los tamaños de tamiz del eje: 1,18 · 1,70 · 2,36 · 3,35 · 5,0 · 6,3 ·
10 · 14 · 20 · 28 · 40 · 50 · 63 · 75 mm.

**No estimar ni interpolar valores que no se puedan leer del gráfico.** Si un punto no es
legible, dejarlo fuera y anotarlo.

**Hallazgo a verificar:** la razón P80/CSS crece de ~0,98 (CSS 19) a ~1,46 (CSS 32). Si la
digitalización lo confirma, significa que la curva normalizada única del motor pierde precisión
al abrir el CSS, y hay que anotarlo en `PENDIENTES_PRECISION.md`.

**Referencia:** `docs/DATOS_MANUAL_C-1540.md` sección 3.

---

## Fuera del alcance nocturno — requiere diseño con Marcelo

### Reemplazar el factor 80% por producción calculada
`capR = 0.80` es un multiplicador general que tapa la falta de modelo. Debe calcularse la
producción efectiva desde CSS, granulometría de alimentación, granulometría de los productos,
aberturas de malla y carga circulante. **Es un cambio de motor, necesita su propia etapa en el
Plan Maestro.** Ver DECISIONS.md D-13.

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
