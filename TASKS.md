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

## T-06 · Conectar las dos reglas de conos al recommender (cierra T-03) · HECHA

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

## T-07 · Horas de operación como dato de entrada · HECHA

**Qué hacer:** `HOURS_PER_MONTH = 500` deja de ser constante. Pasa a ser un campo que el usuario
puede ingresar en la simulación, con 500 h/mes como valor por defecto. El valor usado debe
aparecer en el PDF de propuesta como supuesto declarado.

**Cómo se sabe que quedó bien:** test que corra el mismo caso con 500 y con 400 h/mes y verifique
que el plazo calculado cambia en la proporción correcta.

**Referencia:** DECISIONS.md D-12.

---

## T-08 · Revisar el criterio de calce de cámara del cono · HECHA

**Problema:** `check_cone_chamber_fit` implementa un criterio simplificado (P80 de alimentación
entre 40% y 90% de la boca) que **no es** el acordado en D-05: 90–100% pasante de la boca,
40–60% a mitad de cámara, 0–10% del CSS.

**Qué hacer:** implementar el criterio real usando la curva granulométrica completa de la
alimentación, no solo el P80. Si falta el dato de "punto medio de cámara" por modelo, decirlo
y dejarlo anotado en vez de aproximarlo.

**Referencia:** DECISIONS.md D-05 · MEMORY.md B-05.

---

## T-09 · Umbral de mandíbula sola: de constante global a dato por modelo · HECHA

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

## T-10 · Corregir los datos del C-1540 en el catálogo · HECHA · regresión en test_casos_reales reportada en MEMORY.md

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

## T-11 · Digitalizar las curvas de producto del C-1540 · BLOQUEADA

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

## T-12 · Corregir los tres conos Finlay con datos de manual · PENDIENTE · PRIORIDAD ALTA

Reemplaza y amplía T-10, que cubría solo el C-1540.

**Qué hacer:** actualizar en `app/routers/equipment.py` las entradas C-1540, C-1545 y C-1550
con los valores de `docs/DATOS_MANUALES_CONOS.md`, cada uno con su `capacity_source`.

Cargar además la curva de capacidad del C-1550+ (15 puntos de CSS, la tabla más completa que
hay) y la del C-1540 (5 puntos). El **C-1545 no tiene tabla tph vs CSS** en su manual: solo
rangos globales. No inventarle una curva.

Marcar el **C-1554** como sin fuente: no hay manual.

**Cuidado:** los errores van en las dos direcciones. El C-1550+ pasa de 180–370 a 250–589 tph;
eso puede cambiar qué equipo gana en varios casos. Anotar en `MEMORY.md` cuáles cambiaron y
**no ajustar ningún caso de validación** para que calce.

**Referencia:** `docs/DATOS_MANUALES_CONOS.md` · `docs/PROCEDIMIENTO_EXTRACCION_MANUALES.md`.

---

## T-13 · Extraer datos de mandíbulas, seleccionadoras, scalpers, impactores y conveyor · PENDIENTE

**Qué hacer:** aplicar `docs/PROCEDIMIENTO_EXTRACCION_MANUALES.md` a los 20 manuales restantes
de `manuales/`, generando un documento por familia en `docs/`, igual que se hizo con los conos.
**No modificar el catálogo en esta tarea** — solo extraer y documentar, con la tabla
comparativa "catálogo actual vs manual" para cada modelo.

Orden sugerido por impacto:

1. **Seleccionadoras** (595, 683, 684, 694+, 696) — hoy ningún modelo tiene fuente, y es la
   mayor fuente de imprecisión según `PENDIENTES_PRECISION.md`.
2. **Mandíbulas** (J-960, J-1160, J-1170, J-1175, J-1480) — verificar los datos ya cargados y
   resolver la inconsistencia del J-1175 (bloqueo B-02).
3. **Impactores** (I-110RS, I-120, I-130RS, I-140, IC-100) — los 16 del catálogo no declaran CSS.
4. **Scalpers** (863+, 873+, 883+, 893+) — no existen en el catálogo.
5. **Conveyor** (TC-80) — no existe la categoría.

**Regla que no se rompe:** si un dato no está en el manual, no se carga. Se anota qué falta.

**Nota de rendimiento:** son ~2 GB de PDF. Conviene ejecutarlo en el computador de Marcelo
(Claude Code), no en un entorno remoto.

---

## T-14 · Reactivar los casos de validación que quedaron sin ejecutar · PENDIENTE

**Contexto:** se eliminaron las sustituciones de equipos del archivo de tests (violaban la
regla 9 de CLAUDE.md). Como consecuencia, dos de los tres casos de validación real ya no se
ejecutan: sus equipos no están en el catálogo con especificaciones reales.

| Caso | Equipos que faltan | Cómo reactivarlo |
|---|---|---|
| ROM Botadero Argentina | Terex Finlay **883+** | Marcelo ya aportó el manual: `manuales/Scalpers/883+ Operations Manual Revision 5.1 (Spanish).pdf`. Cargar sus specs reales. |
| Mina El Pleito Fase 3 | **Minyu MS 4230**, **Minyu MSP 300 F**, **Minyu MOP2460D**, **MEKA 90/2000 ROS** | No hay manuales. Marcelo debe conseguirlos o el caso queda archivado. |

**Qué hacer:** cargar el 883+ al catálogo desde su manual, siguiendo
`docs/PROCEDIMIENTO_EXTRACCION_MANUALES.md`. Eso reactiva el primer caso.

**Prohibido:** sustituir el 883+ por una 694+ ni por ninguna otra seleccionadora, y
**prohibido ajustar los valores esperados** de los casos. Los números del JSON son la fuente
de verdad; si un caso falla con equipos reales, el error está en el motor.

**Referencia:** CLAUDE.md regla 9 · `tests/test_casos_reales.py`.

---

## T-15 · Capacidad de seleccionadoras por método VSMA — Etapa 1 · HECHA

**Problema:** los campos `cap_min_tph` y `cap_max_tph` de las cinco seleccionadoras del catálogo
no tienen fuente. Ningún manual publica tph porque la capacidad no es una propiedad del equipo:
depende de la malla, del material y de la eficiencia exigida.

**Qué hacer — solo los factores clásicos B a F en esta tarea:**

1. Crear `app/services/screen_capacity.py` con la fórmula del método
   (`docs/METODO_CAPACIDAD_SELECCIONADORAS.md`), calculando la capacidad **por piso**.
2. Digitalizar del paper los factores B, S, D, V, H, T, K, O, W, F. Verificar la digitalización
   contra los puntos exactos que el paper da en texto: B = 5,50 tph/ft² para malla 1" y 3,80
   para ½"; D = 1,0 / 0,9 / 0,8; V = 1,00 al 25% retenido; H = 1,00 al 40% bajo media abertura;
   F = 1,00 al 90% de eficiencia.
3. En el catálogo de seleccionadoras: **eliminar** `cap_min_tph` y `cap_max_tph`, y dejar área
   por piso, número de pisos y rpm de cribado (ya extraídos de los manuales Finlay).
4. Conectar `screen()` en el motor para que use la capacidad calculada en vez del 80% fijo.

**Fuera de alcance de esta tarea:** los factores NEA, BED, TYP, STR, TIM y RPM. Van en T-16.

**Cómo se sabe que quedó bien:** reproducir el ejemplo trabajado del paper (sección 
"Comparison of screen sizing") y obtener 13,16 tph/ft² en el piso superior y 3,97 en el
inferior, dentro de ±5%. Ese ejemplo es la prueba de que la digitalización quedó bien.
Los 285 tests existentes siguen verdes.

**Cuidado:** este cambio altera la capacidad de todos los circuitos con seleccionadora, que son
casi todos. Anotar en `MEMORY.md` qué casos cambian. **No ajustar ningún caso de validación.**

**Referencia:** `docs/METODO_CAPACIDAD_SELECCIONADORAS.md` · PENDIENTES_PRECISION.md punto 1.

---

## T-16 · Factores NEA y BED — Etapa 2 · PENDIENTE

Los dos factores que más cambian el resultado en circuito cerrado, que es el caso habitual de
KrushRock. En el ejemplo del paper, `NEA` = 0,59 redujo la capacidad del piso inferior de
476 a 215 tph.

- **NEA** (material de tamaño cercano, ±25% de la abertura): se calcula desde la curva de
  alimentación, que el motor ya propaga completa. No requiere datos nuevos.
- **BED** (espesor de cama): requiere ancho de piso y velocidad de transporte.
  El ancho está en los manuales; la velocidad se estima desde rpm, carrera e inclinación.

**Referencia:** `docs/METODO_CAPACIDAD_SELECCIONADORAS.md` sección 2.

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
