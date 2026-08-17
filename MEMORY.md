# MEMORY.md — Memoria de trabajo

**Marcelo: lee solo la sección 1. Todo lo demás es detalle de respaldo.**

Estructura fija de este archivo. El agente **no la cambia**:

1. `PARTE DE LA ÚLTIMA SESIÓN` — resumen de lo último, siempre arriba. Se **reemplaza** entero cada sesión.
2. `BLOQUEOS ABIERTOS` — lo que Marcelo debe responder o aportar.
3. `DETALLE DE LA ÚLTIMA SESIÓN` — el paso a paso, por si hay que auditar algo.
4. Las sesiones anteriores se mueven a `docs/MEMORY_ARCHIVO.md`. Aquí nunca se acumulan.

---

# 1 · PARTE DE LA ÚLTIMA SESIÓN

**Fecha:** 16-ago-2026 · **Rama:** `trabajo/2026-08-16` · **Modo:** autónomo

**Resultado: 5 de 6 tareas hechas. T-11 bloqueada. 282 tests verdes + 1 regresión reportada.**

| Tarea | Qué se logró | Commit |
|---|---|---|
| T-06 | Advertencias de choke feed y calce de cámara conectadas al flujo real. | `f0f4397` |
| T-07 | Horas de operación como dato de entrada (hours_per_month_input). | `49dd4f4` |
| T-08 | Criterio real D-05 de calce de cámara con curva granulométrica. | `8ec9dec` |
| T-09 | min_product_mm por modelo reemplaza la constante global _JAW_ONLY_MIN_MM. | `a07b86d` |
| T-10 | Datos del C-1540 corregidos según manual Rev 2.7. **Regresión en test_caso_real[Hierro].** | `592af40` |
| T-11 | **BLOQUEADA:** el entorno no puede renderizar el PDF del manual (pdftoppm no disponible en Windows). Las curvas de producto son gráficos, no tablas — no se pueden digitalizar sin acceso visual al PDF. | — |

**Lo que necesito de ti, en orden:**

1. **Decidir sobre la regresión de T-10.** El test `test_caso_real[Mina El Pleito Fase 3 - Hierro]`
   falla: el sistema predice 132.4 tph, el test espera 161 tph. Opciones en MEMORY.md sección 3.
2. **Decidir sobre T-11.** Dos caminos:
   a) Abrir el PDF del manual (`manuales/Conos/C-1540 Operations Manual Rev 2 (en).pdf`) y
      leer manualmente los % pasantes del gráfico de la Tabla 3.5 en cada tamaño de tamiz.
      Luego cargarlos al catálogo en el formato que usa J-1175.
   b) Usar las lecturas aproximadas (±5 puntos) de `docs/DATOS_MANUAL_C-1540.md` sección 3
      y aceptar esa imprecisión — anotada en PENDIENTES_PRECISION.md.
3. **Decidir si integras la rama a la principal.** Instrucciones en `WORKFLOW.md` sección 9.

---

# 2 · BLOQUEOS ABIERTOS

### B-01 · Manuales de conos Finlay — **bloquea la Etapa 3 completa**
Los folletos públicos del C-1540 no traen tabla de capacidad tph vs CSS (verificado 28-jul-2026
contra el folleto oficial Terex 2022). Se necesitan los manuales de servicio de C-1540, C-1545 y
C-1550. Mientras no estén, la optimización conjunta de CSS operaría sobre números aproximados
en todos los conos.

### B-02 · Inconsistencia del J-1175
El catálogo declara capacidad mínima de 200 tph, pero la curva del manual baja a 122,5 tph en el
CSS más cerrado. Uno de los dos datos está mal. Revisar el manual y decir cuál corregir.

### B-03 · Cinco constantes sin fuente en el recommender
Valores que hoy el sistema usa sin respaldo documental. Marcelo debe confirmarlos o corregirlos:

| Constante | Valor actual | De dónde salió | Pregunta para Marcelo |
|---|---|---|---|
| `HOURS_PER_MONTH` | 500 h/mes | 6000 h/año ÷ 12 — estándar de industria móvil | ¿Aplica a tus proyectos? En áridos con paros mayores suele ser 400–450. |
| `capR` | 0,80 | Factor 75–85% citado en Metso Crushing Handbook §3.2 | ¿Usas 80% o tienes un valor propio? |
| `_WI_REF` | 13,0 | Work Index promedio de "roca media", tablas de Bond (1952) | ¿Sirve como referencia? ¿Tienes el Wi típico de tus faenas? |
| `_JAW_ONLY_MIN_MM` | 50,0 mm | Calculado del CSS mínimo de mandíbula × factor P100 | ¿En tus proyectos una mandíbula sola llega a producto de 50 mm? |
| `_JAW_SCREEN_MIN_MM` | 20,0 mm | Umbral empírico, sin fuente | ¿20 mm es el límite real de mandíbula + seleccionadora en circuito abierto? |

### B-05 · Las dos reglas nuevas de conos no están conectadas — **T-03 quedó a medias**
Revisión de código del 29-jul-2026. `check_cone_choke_feed` y `check_cone_chamber_fit` existen
en `selection_rules.py` y tienen tests propios, pero **`recommender.py` no las importa ni las
llama**. Solo importa `check_crusher_feed`, `check_reduction_ratio` y `check_screen_decks`.

Consecuencia: las dos reglas nuevas no producen ninguna advertencia en el flujo real. Ni el
sistema ni el usuario las ven nunca. La consolidación de reglas sí se hizo bien; lo que falta es
enchufarlas.

Además, `check_cone_chamber_fit` implementa un criterio **simplificado** (P80 de alimentación
entre 40% y 90% de la boca) que **no es** el criterio acordado en D-05 (90–100% pasante de la
boca, 40–60% a mitad de cámara, 0–10% del CSS). Hay que decidir si se acepta la simplificación
o se implementa el criterio real.

### B-04 · Otro punto donde el sistema devuelve resultado vacío
En `recommender.py` hay una segunda salida sin mensaje (`if not jaws: return []`), distinta a la
que se arregló en T-02. Ocurre cuando ninguna mandíbula acepta el tamaño de roca de entrada.
Debería explicar el motivo igual que ahora lo hace el caso de volumen imposible.
*(Detectado por el agente durante T-02. No se tocó por estar fuera del alcance de la tarea.)*

---

# 3 · DETALLE DE LA ÚLTIMA SESIÓN

### T-06 · Conectar advertencias de conos al flujo real — HECHA

Importadas `check_cone_choke_feed` y `check_cone_chamber_fit`. Campo `cone_feeds_p80` en
cada candidato (P80 estimada de alimentación al cono). En el bucle de simulación se acumulan
advertencias y viajan en `"advertencias": [...]` en todos los resultados. 5 tests nuevos.
**267 tests verdes. Commit f0f4397.**

Nota sobre activación como descarte (T-06 requería anotar):
El choke feed warning aparece en prácticamente TODOS los circuitos con cono cuando el cuello
de botella es la mandíbula (cap_per_unit ≈ jaw_cap × 0.80 < 80% cone_cap_max). Activarlo
como descarte eliminaría casi todos los resultados jaw_cone_screen del catálogo actual —
solo quedarían casos donde el cono es el cuello de botella (cono más chico que la mandíbula).
La decisión de activarlo como descarte es de Marcelo.

### T-07 · Horas de operación como dato de entrada — HECHA

`hours_per_month_input` agregado a `recommend()` y `run_config()`. Prioridad:
input directo > horas_dia×dias_mes > constante HOURS_PER_MONTH.
Campo `hours_per_month_used` en todos los resultados. test_compare_configs actualizado.
5 tests nuevos. **272 tests verdes. Commit 49dd4f4.**

### T-08 · Criterio real de calce de cámara del cono — HECHA

`check_cone_chamber_fit` acepta `feed_curve_dict` opcional (D-05). Con curva verifica C1
(≥90% pasa boca); C2 y C3 documentados como no verificables (falta mid_chamber_mm y CSS).
Sin curva: criterio simplificado previo (backward-compat). 7 tests nuevos.
**279 tests verdes. Commit 8ec9dec.**

**Dato faltante (BLOQUEO B-06):** ningún cono del catálogo tiene campo `mid_chamber_mm`.
Sin ese dato, el criterio C2 de D-05 no se puede verificar. Marcelo debe decidir si:
a) se agrega como campo a los conos que tienen manual (C-1540 primero), o
b) C2 queda excluido del criterio definitivo.

### T-10 · Corregir datos del C-1540 en el catálogo — HECHA (regresión reportada)

Datos corregidos según Manual Terex Finlay C-1540 Rev 2.7, Tabla 3.4 p.3-14
(excéntrico largo, cóncavo Medium Coarse, punto medio de rangos):
  css_min_mm: 10→19 · css_max_mm: 44→32
  cap_min_tph: 150→125 · cap_max_tph: 300→220 · feed_max_mm: 215→160
Curva de capacidad y capacity_source agregados al catálogo.

**REGRESIÓN EN TEST DE VALIDACIÓN (reportada per T-10):**
test_caso_real[Mina El Pleito Fase 3 - Hierro (circuito cerrado)] FALLA:
  tph_util obtenido: 132.4 tph · esperado: 161 tph · diferencia: 28.6 (tolerancia 15%=24.2)
Causa: cap_max_tph 300→220 reduce el tph_util calculado. El valor esperado 161 tph
en el test fue calculado con los datos INCORRECTOS del catálogo anterior.
Marcelo debe decidir si:
  a) el valor esperado 161 tph del test es correcto (medición de campo real), lo que
     indicaría que la configuración usada en campo era diferente a lo que modela el sistema
  b) el valor 161 tph era un artefacto del catálogo incorrecto y el test debe actualizarse
     a la predicción del sistema con datos correctos (132.4 tph).
**No se toca el test hasta que Marcelo decida.**

### T-09 · Umbral de mandíbula sola: constante → dato por modelo — HECHA

`min_product_mm` agregado a 6 mandíbulas Terex Finlay (D-14): J-960=50, J-1160=50,
J-1170=75, J-1175=75, J-1280=75, J-1480=100. Section A de recommender.py reemplaza
gate global + P100_min por check per-jaw. Sin dato → criterio teórico previo.
Test previo actualizado (40mm < mínimo 50mm del catálogo). 4 tests nuevos.
**283 tests verdes. Commit a07b86d.**

Nota: min_product_mm REEMPLAZA el P100_min check para jaws con dato (dato real
del manual supera al cálculo teórico css_min×2.5). J-960 sí puede proponer
jaw_only para productos ≥50mm.





### T-01 · Conteo de flota en el ranking
Se cambió la clave de ordenamiento de `(n_units × nº etapas, capacidad total)` a
`(n_units, nº etapas, capacidad total)`. Al separar las dos dimensiones, primero se prefieren
circuitos con menos líneas en paralelo y recién después los de menos etapas.

Efecto: "1 mandíbula + 1 cono + 1 seleccionadora" queda como (1, 3, x) y vence a
"2 mandíbulas solas" que queda como (2, 1, x).

Se revisó que los tests que ya existían siguieran siendo correctos con el cambio
(`test_un_equipo_grande_vence_a_dos_chicos`, `test_andesita_recomienda_equipo_mayor_no_dos_chicos`,
`test_coarse_fewer_stages_than_fine`): todos dependen de que n_units=1 gane sobre n_units=2, lo
que la nueva clave garantiza. **238 tests verdes.**

### T-02 · Caso imposible
Se agregaron `tph_requerido`, `tph_max_alcanzable`, `meses_extra` y `unidades_extra` a todos los
resultados. Si ninguna simulación produce resultado, se devuelve un objeto `"sin_datos"` en lugar
de una lista vacía. 5 tests nuevos.

### T-03 · Reglas de descarte
Nuevo módulo `app/services/selection_rules.py` con 5 funciones de verificación.
`recommender.py` ahora importa desde ahí y ya no define `_P100_FACTOR` ni `_MAX_RATIO` por su
cuenta. Las reglas 4 y 5 (choke feed al 80% y calce de cámara del cono) quedaron como
**advertencia**, no descartan: activarlas es decisión de Marcelo. 19 tests nuevos.

### T-04 · Catálogo duplicado del frontend
`EQ_LOCAL` eliminado de `catalogo.js`. Se limpiaron todos los archivos que lo importaban
(`App.jsx`, `ModoSimple.jsx`, `Resultados.jsx`, `Wizard.jsx`, `engine.js`). `App.jsx` ahora
parte en `null` y muestra pantalla de carga hasta que llega el catálogo del backend.

### T-05 · Constantes documentadas
Todas comentadas en el código con su justificación. Las 5 sin fuente citable quedaron en el
bloqueo B-03. **262 tests verdes.**

---

*Sesiones anteriores: `docs/MEMORY_ARCHIVO.md`*
