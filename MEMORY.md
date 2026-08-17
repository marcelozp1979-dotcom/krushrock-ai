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

**Resultado: 5 de 6 tareas hechas. T-11 bloqueada. 284 tests verdes + 1 regresión reportada.**

| Tarea | Qué se logró | Commit |
|---|---|---|
| T-06 | Las advertencias de "cono sub-alimentado" y "cámara mal calzada" ahora llegan al resultado del usuario. Antes eran código muerto. | `f0f4397` |
| T-07 | Las horas de operación por mes ahora son un dato que el usuario puede ingresar. Antes estaba fija en 500 h/mes. Afecta el plazo calculado. | `49dd4f4` |
| T-08 | La revisión de calce de cámara ahora usa la curva granulométrica real cuando está disponible, no solo el P80. | `8ec9dec` |
| T-09 | Cada mandíbula tiene su propio umbral de producto mínimo (antes era 50 mm para todas). J-1480 no se propone sola para producto fino; J-960 sí puede hasta 50 mm. | `a07b86d` |
| T-10 | Los datos del C-1540 en el catálogo estaban inflados. Corregidos según manual oficial: capacidad real 220 tph (antes 300), CSS mínimo real 19 mm (antes 10). **Genera una alerta que Marcelo debe resolver.** | `592af40` |
| T-11 | **BLOQUEADA.** Las curvas de producto del C-1540 son gráficos en el PDF. El entorno no puede leer el PDF automáticamente. Opciones abajo. | — |

**Lo que necesito de ti, en orden:**

1. **Resolver la alerta del test de validación (T-10).** El test `test_caso_real[Mina El Pleito Fase 3 - Hierro]`
   falla: el sistema ahora predice **132 tph**, el test esperaba **161 tph** (basado en el catálogo incorrecto anterior).
   Pregunta: ¿el valor 161 tph viene de una medición real de campo, o era un número calculado con el catálogo viejo?
   - Si es de campo real → el sistema tiene un error de modelo que hay que investigar.
   - Si era del catálogo viejo → el test debe actualizarse al valor correcto (132 tph) y ya.
   No se toca el test hasta que respondas.

2. **Desbloquear T-11 (curvas de producto del C-1540).** Dos opciones:
   - Opción A: abrir el PDF `manuales/Conos/C-1540 Operations Manual Rev 2 (en).pdf`, ir al gráfico
     de la Tabla 3.5 y leer los % pasantes a ojo en cada tamaño de tamiz. Pasarme esos números y yo
     los cargo al catálogo.
   - Opción B: aceptar las lecturas aproximadas (±5 puntos) que ya están en `docs/DATOS_MANUAL_C-1540.md`
     y cargarlas con esa imprecisión declarada. El sistema mejoraría igual; solo sería menos exacto.

3. **Decidir si integras la rama a la principal.** Instrucciones en `WORKFLOW.md` sección 9.
   La rama se llama `trabajo/2026-08-16`.

---

# 2 · BLOQUEOS ABIERTOS

### B-02 · Inconsistencia del J-1175
El catálogo declara capacidad mínima de 200 tph, pero la curva del manual baja a 122,5 tph en el
CSS más cerrado. Uno de los dos datos está mal. Revisar el manual y decir cuál corregir.

### B-03 · Cuatro constantes sin fuente en el recommender
`_JAW_ONLY_MIN_MM` ya fue resuelta con datos por modelo (T-09). Quedan:

| Constante | Valor actual | De dónde salió | Pregunta para Marcelo |
|---|---|---|---|
| `HOURS_PER_MONTH` | 500 h/mes | 6000 h/año ÷ 12 — estándar de industria móvil | ¿Aplica a tus proyectos? En áridos con paros mayores suele ser 400–450. |
| `capR` | 0,80 | Factor 75–85% citado en Metso Crushing Handbook §3.2 | ¿Usas 80% o tienes un valor propio? |
| `_WI_REF` | 13,0 | Work Index promedio de "roca media", tablas de Bond (1952) | ¿Sirve como referencia? ¿Tienes el Wi típico de tus faenas? |
| `_JAW_SCREEN_MIN_MM` | 20,0 mm | Umbral empírico, sin fuente | ¿20 mm es el límite real de mandíbula + seleccionadora en circuito abierto? |

### B-04 · Segundo punto de retorno vacío en el recommender
En `recommender.py` hay una segunda salida sin mensaje (`if not jaws: return []`), distinta a la
que se arregló en T-02. Ocurre cuando ninguna mandíbula acepta el tamaño de roca de entrada.
Debería explicar el motivo igual que ahora lo hace el caso de volumen imposible.

### B-06 · El cono no tiene `mid_chamber_mm` en el catálogo
Sin ese campo, el criterio C2 de D-05 (40–60% del material pasa a mitad de cámara) no se puede
verificar para ningún cono. Actualmente la función lo documenta como "no verificable".
Marcelo decide: a) agregar el campo a los conos con manual, o b) excluir C2 del criterio.

### B-07 · Regresión en test de validación — Hierro (circuito cerrado) — ver ítem 1 arriba

### B-08 · T-11 bloqueada — curvas de producto del C-1540 — ver ítem 2 arriba

### B-09 · 14 mandíbulas del catálogo sin `min_product_mm`
Los 6 modelos Terex Finlay ya tienen el dato (T-09). Las 14 restantes (Powerscreen, Kleemann,
Sandvik, Metso) usan el criterio teórico (css_min × 2.5 ≥ finest_max). Sin manual verificado
no se puede asignar el dato correcto.

---

# 3 · DETALLE DE LA ÚLTIMA SESIÓN

### T-06 · Conectar advertencias de conos al flujo real — HECHA

Importadas `check_cone_choke_feed` y `check_cone_chamber_fit`. Campo `cone_feeds_p80` en
cada candidato (P80 estimada de alimentación al cono). En el bucle de simulación se acumulan
advertencias y viajan en `"advertencias": [...]` en todos los resultados. 5 tests nuevos.
**267 tests verdes. Commit f0f4397.**

Nota: el choke feed warning aparece en prácticamente TODOS los circuitos con cono cuando el cuello
de botella es la mandíbula (cap_per_unit ≈ jaw_cap × 0.80 < 80% cone_cap_max). Activarlo como
descarte eliminaría casi todos los resultados jaw_cone_screen del catálogo actual. Decisión de Marcelo.

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

### T-09 · Umbral de mandíbula sola: constante → dato por modelo — HECHA

`min_product_mm` agregado a 6 mandíbulas Terex Finlay (D-14): J-960=50, J-1160=50,
J-1170=75, J-1175=75, J-1280=75, J-1480=100. Section A de recommender.py reemplaza
gate global + P100_min por check per-jaw. Sin dato → criterio teórico previo.
Test previo actualizado (40mm < mínimo 50mm del catálogo). 4 tests nuevos.
**283 tests verdes. Commit a07b86d.**

Nota técnica: min_product_mm REEMPLAZA el P100_min check para jaws con dato (dato real del
manual supera al cálculo teórico css_min×2.5). J-960 puede proponer jaw_only para ≥50mm.

### T-10 · Corregir datos del C-1540 en el catálogo — HECHA (regresión reportada)

Datos corregidos según Manual Terex Finlay C-1540 Rev 2.7, Tabla 3.4 p.3-14
(excéntrico largo, cóncavo Medium Coarse, punto medio de rangos):
  css_min_mm: 10→19 · css_max_mm: 44→32
  cap_min_tph: 150→125 · cap_max_tph: 300→220 · feed_max_mm: 215→160
Curva de capacidad real y capacity_source agregados.

**REGRESIÓN:** test_caso_real[Mina El Pleito Fase 3 - Hierro (circuito cerrado)] FALLA:
  tph_util obtenido: 132.4 tph · esperado: 161 tph · diferencia: 28.6 (tolerancia 15%=24.2)
Causa: cap_max_tph 300→220 reduce el tph_util calculado. El 161 esperado fue calculado con
datos incorrectos. No se toca el test sin respuesta de Marcelo (ver B-07). **Commit 592af40.**

### T-11 · Digitalizar curvas de producto del C-1540 — BLOQUEADA

El PDF `manuales/Conos/C-1540 Operations Manual Rev 2 (en).pdf` existe en el repositorio
pero el entorno (Windows, sin pdftoppm) no puede renderizarlo para leer los gráficos.
Las lecturas aproximadas (±5 puntos) en `docs/DATOS_MANUAL_C-1540.md` existen pero
la tarea prohíbe cargarlas sin digitalización cuidadosa. Opciones en B-08 / ítem 2 sección 1.

---

*Sesiones anteriores: `docs/MEMORY_ARCHIVO.md`*
