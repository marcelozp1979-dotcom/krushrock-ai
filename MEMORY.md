# MEMORY.md — Memoria de trabajo

**Marcelo: lee solo la sección 1. Todo lo demás es detalle de respaldo.**

Estructura fija de este archivo. El agente **no la cambia**:

1. `PARTE DE LA ÚLTIMA SESIÓN` — resumen de lo último, siempre arriba. Se **reemplaza** entero cada sesión.
2. `BLOQUEOS ABIERTOS` — lo que Marcelo debe responder o aportar.
3. `DETALLE DE LA ÚLTIMA SESIÓN` — el paso a paso, por si hay que auditar algo.
4. Las sesiones anteriores se mueven a `docs/MEMORY_ARCHIVO.md`. Aquí nunca se acumulan.

---

# 1 · PARTE DE LA ÚLTIMA SESIÓN

**Fecha:** noche del 28 al 29-jul-2026 · **Rama:** `nocturno/2026-07-29` · **Modo:** autónomo

**Resultado: la cola quedó terminada. 5 de 5 tareas hechas, 262 tests verdes.**

| Tarea | Qué se logró | Commit |
|---|---|---|
| T-01 | El ranking ya no castiga a los circuitos de 3 etapas. Ahora un tren completo con 1 unidad gana a 2 máquinas sueltas. | `431ab7b` |
| T-02 | Cuando el volumen pedido es imposible, el usuario ve el tph que necesitaría, el máximo alcanzable y cuántos meses o equipos le faltan. Ya no queda pantalla vacía. | `74ae222` |
| T-03 | Todas las reglas que descartan equipos quedaron en un solo archivo (`selection_rules.py`), incluidas las dos nuevas de conos. **Las nuevas están como advertencia, todavía no descartan.** | `134994c` |
| T-04 | El frontend ya no tiene su propia copia del catálogo. Ahora hay una sola fuente: el backend. | `df87b6b` |
| T-05 | Las 6 constantes del recommender quedaron documentadas. 5 no tienen fuente real y necesitan tu confirmación. | `adb5e84` |

**Lo que necesito de ti, en orden:**

1. **Probar la aplicación a mano.** T-04 tocó el frontend y el frontend no tiene tests automáticos.
   Hay que verificar que la app carga y muestra los equipos. Si el backend no responde, ahora se
   queda en pantalla de carga en vez de mostrar datos viejos — eso es intencional.
2. **Responder el bloqueo B-03** (los 5 valores de la tabla más abajo). Sin eso el sistema calcula
   con supuestos que nadie confirmó.
3. **Decidir si integras la rama a la principal.** Instrucciones en `WORKFLOW.md` sección 9.

**Nada quedó bloqueado ni a medias.** La cola de `TASKS.md` está vacía: hay que cargarla de nuevo
antes de la próxima noche.

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

### T-09 · Umbral de mandíbula sola: constante → dato por modelo — EN CURSO

Hipótesis: agregar `min_product_mm` a los 6 modelos con datos (D-14). En recommender.py,
reemplazar el gate global `if finest_max >= _JAW_ONLY_MIN_MM:` por check per-jaw
`if finest_max < jaw.min_product_mm: rechazar`. Fallback al global para jaws sin dato.





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
