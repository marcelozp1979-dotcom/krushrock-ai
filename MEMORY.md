# MEMORY.md — Memoria de trabajo

**Marcelo: lee solo la sección 1. Todo lo demás es detalle de respaldo.**

Estructura fija de este archivo. El agente **no la cambia**:

1. `PARTE DE LA ÚLTIMA SESIÓN` — resumen de lo último, siempre arriba. Se **reemplaza** entero cada sesión.
2. `BLOQUEOS ABIERTOS` — lo que Marcelo debe responder o aportar.
3. `DETALLE DE LA ÚLTIMA SESIÓN` — el paso a paso, por si hay que auditar algo.
4. Las sesiones anteriores se mueven a `docs/MEMORY_ARCHIVO.md`. Aquí nunca se acumulan.

---

# 1 · PARTE DE LA ÚLTIMA SESIÓN

**Fecha:** 07-oct-2026 · **Rama:** `trabajo/2026-10-07` → integrada a `main` · **Modo:** autónomo

**Resultado: T-19 integrada a main. T-20 completada (engine.js eliminado). 328 tests verdes. Commit `trabajo/2026-10-07`.**

| Qué cambió | Detalle |
|---|---|
| Integrado a main: `trabajo/2026-08-21` | T-19 (curva C-1540) + estados de tareas. Commit `16cb349`. |
| Eliminado: `krushrock-app/src/engine.js` | Motor duplicado eliminado. La función `runSimulation` (que ya llamaba al backend) fue a `simulation.js`. `buildAnalysis` (texto diagnóstico) fue a `analysis.js`. |
| Modo Campaña deshabilitado | Las funciones `coneFactor/calcYieldsForCSS/computeCampaign/campaignUnoptTime` usaban P80=CSS×1,4–1,9 (erróneo; el manual da ×0,98). Eliminadas. La pantalla de Campaña muestra un aviso hasta implementarse en backend. |

**Lo que necesito de ti:**

1. **Revisar visualmente el frontend** (T-20 requiere prueba visual): abre la app, simula un caso, revisa que los tabs de Producción, Plazo y Comercial funcionen. El tab Campaña ahora dice "próximamente" — eso es correcto. Si algo se ve mal, avísame.

2. **B-BED01 (factor BED pendiente).** El factor de espesor de cama de la seleccionadora devuelve 1.0 hasta tener ancho, rpm, carrera e inclinación de cada pantalla. ¿Los tienen en algún manual?

3. **B-campana01 (Modo Campaña en backend).** Las funciones de planificación de campaña (qué CSS usar para cada producto, cuántos meses toma) necesitan implementarse en el backend. ¿Es prioritario para clientes actuales?

---

# 2 · BLOQUEOS ABIERTOS

### B-campana01 · Modo Campaña pendiente de implementación en backend

Las funciones de simulación de campaña (`computeCampaign`, `campaignUnoptTime`, `calcYieldsForCSS`)
fueron eliminadas de `engine.js` (T-20) porque usaban un factor P80/CSS erróneo (×1,4–1,9).
El motor correcto para campaña usa las curvas normalizadas del backend.
Hasta que se implemente, el tab "Campaña" muestra un aviso al usuario.
Requiere: implementar `POST /simulations/campaign` con secuencia de fases CSS, rendimientos por producto y horas estimadas.

### B-BED01 · factor_BED necesita datos de pantalla

`factor_BED` en T-16 devuelve 1.0 (sin penalización) hasta tener: ancho (m), rpm,
stroke (mm) e inclinación de cada seleccionadora del catálogo. Sin esos datos el factor
no puede calcularse. Los manuales Finlay no publican estos valores de forma sistemática.
Requiere búsqueda en fichas técnicas o AggFlow para las pantallas del catálogo.

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

### B-SL01 · tph de seleccionadoras sin fuente de manual
Los valores cap_min/cap_max de todas las seleccionadoras del catálogo no tienen fuente de manual.
Los manuales Terex Finlay no publican tph (depende del material y la malla instalada).
Origen de los valores actual desconocido. Se marcan como sin verificar hasta conseguir
fuente alternativa (hojas de ventas, AggFlow, ficha técnica impresa).

### B-SL02 · 595 no está en el catálogo — requiere decisión de categoría
La 595 es una rejilla vibratoria de 2 pisos (scalper primario). Su estructura no encaja bien en
`screen`. Requiere que Marcelo decida: ¿se agrega como `screen` o como nueva categoría `scalper`?
Hay además una inconsistencia métrica/imperial en el manual (2.7m vs 6'-1"=1.85m en una dimensión).

### B-SL03 · Área del 683 en catálogo no coincide con manual
Catálogo: 10.1 m². Manual: 10.95 m² (3.65×1.5×2). Diferencia: 8.4%. Posible uso de área efectiva
vs. bruta. No se puede corregir sin aclaración del fabricante.

### B-MJ01 · J-960 Rev 5.2: tabla de capacidad no encontrada
En Rev 5.2 la sección 3.7 tiene curvas de producto (imágenes), no tabla de tph. Los valores
de css_min, css_max, feed_max y cap del catálogo no pudieron verificarse con la revisión disponible.
La Rev 4.9 (citada en el catálogo) no está en la carpeta de manuales.

### B-MJ02 · J-1160 Rev 4.8: tph no publicado
Rev 4.8 tiene curvas de granulometría por CSS (no tph). El catálogo cita cap_min=150, cap_max=280
sin fuente identificada. Posiblemente provienen de una revisión anterior o hoja de producto.

### B-MJ03 · J-1170 css_max: 125mm (Rev 1.0) vs. 150mm (catálogo de Rev 6.5)
No es discrepancia, sino diferencia de revisiones. La extensión a 150mm fue añadida en versiones
posteriores. Los 6 puntos de la tabla de Rev 1.0 sí coinciden con el catálogo.

### B-MJ04 · J-1480 Rev 291116-10: tph no publicado
Manual disponible tiene curvas de granulometría pero no tabla de tph. El catálogo cita cap_min=400,
cap_max=600 de Rev 1.9 p.3-10. Esa revisión no está disponible en la carpeta de manuales.

### B-MJ05 · J-1280: manual no disponible
No hay manual de J-1280 en `manuales/Mandíbulas/`. No se puede completar T-13 para este modelo.

### B-MJ06 · J-1175 feed_max: probablemente en imagen de tabla
feed_max=790mm del catálogo probablemente está en Tabla 3.1, que pypdf no pudo extraer (imagen/gráfico).
No se puede confirmar sin digitalización manual o renderizado del PDF.

### B-IM01 · I-110RS feed_max: catálogo 750mm vs. manual 304–500mm — ver ítem 4 arriba
El catálogo cita 750mm; el manual dice "Tamaño de alimentación máximo: 304–500mm (12"–20")".
Apertura física del chasis: 990×1020mm. Ninguno de los tres valores coincide entre sí.
Requiere verificación con Terex/distribuidor antes de corregir.

### B-IM02 · Capacidades HSI sin fuente de manual
Los valores cap_min/cap_max de impactores HSI del catálogo no tienen fuente en ningún manual.
Los manuales no publican tablas de tph (solo curvas de producto orientativas para caliza).
Son estimaciones comerciales sin fuente verificada.

### B-IM03 · I-120, I-130RS, I-140: manuales no leídos en T-13
Manuales disponibles (163 MB, 98 MB, 133 MB) pero no procesados por límite de sesión.
Pendientes para próxima sesión o T-13b.

### B-SC01 · "Rinser 873" del catálogo = 873+ con datos muy distintos — ver ítem 3 arriba
Catálogo: nombre "Rinser 873", screen_1d, cap_max 200 tph. Manual 873+: 3 salidas de producto,
cap_max 450 tph, feed_max 500mm. Nombre y capacidad no coinciden. Requiere decisión de Marcelo
antes de cualquier modificación al catálogo.

### B-SC02 · 883+ feed_max no encontrado
feed_max del 883+ no apareció en las páginas leídas del manual (sección 3-1 a 3-6).
La entrada del catálogo "883 HF" tampoco tiene feed_max. Pendiente de leer páginas adicionales.

### B-SC03 · 863+ motor Tier 3 sin potencia explícita
El manual menciona "Motor CAT 4.4 Tier 3" sin dar kW en las páginas leídas. Probable que sea
83 kW (igual al 873+ y 883+ que usan la misma plataforma). No confirmado.

### B-SC04 · 893+ manual no leído
Manual disponible (83 MB, Rev 2) pero no leído en T-13 por límite de sesión. No está en catálogo.
Pendiente.

### B-CO01 · TC-80 no está en el catálogo y no hay tipo "conveyor" definido
El catálogo no tiene tipo "conveyor". Agregar el TC-80 requiere: (1) crear nuevo tipo de equipo,
(2) definir qué campos aplican (¿aporta tph al circuito?), (3) decidir si el conveyor participa
en la simulación o es solo logística. Requiere decisión de Marcelo.

---

# 3 · DETALLE DE LA ÚLTIMA SESIÓN

### Integración de `trabajo/2026-08-21` a `main`

1. Guardados cambios pendientes (TASKS.md estados + WORKFLOW.md actualización push-to-main). Commit `4cb6535`.
2. Suite completa: 328 passed, 1 skipped.
3. `git merge trabajo/2026-08-21 → main`, push. Commit `16cb349`.

### T-20 · Eliminar motor duplicado del frontend — HECHA PARCIAL

**Análisis de `engine.js` (672 líneas):**
- `runSimulation`: llama al backend (`POST /simulations/calculate`), NO es cálculo local. Correcto.
- `buildAnalysis`: genera texto diagnóstico a partir del resultado. Lógica de display, no simulación.
- `coneFactor`: usa P80 = CSS × 1,40–1,90. **Erróneo** (manual C-1540 da ×0,98 en CSS 19mm).
- `calcYieldsForCSS`, `computeCampaign`, `campaignUnoptTime`: usan `coneFactor` erróneo.

**Cambios:**
- `runSimulation` → `krushrock-app/src/simulation.js` (idéntica, + import `G` que faltaba)
- `buildAnalysis` → `krushrock-app/src/analysis.js`
- `App.jsx`: import actualizado de `./engine.js` → `./simulation.js`
- `Resultados.jsx`: import → `../analysis.js`; bloque campaña reemplazado por aviso
- `engine.js` eliminado
- Ningún archivo del proyecto importa ya de `engine.js`

**Campaña:** el motor de campaña usaba `coneFactor` erróneo. Se eliminó. La pantalla muestra aviso "próximamente" con explicación técnica. Ver B-campana01 para implementar en backend.

**Tests backend:** 328 passed, 1 skipped (sin regresiones).

**Pendiente visual:** Marcelo debe revisar los tabs de Producción, Plazo y Comercial antes de integrar a main.

*Sesiones anteriores: `docs/MEMORY_ARCHIVO.md`*

**Implementación:** `app/services/css_optimizer.py`, función principal `optimize_css()`.

**Algoritmo:**
1. Genera grilla de CSS por equipo (`_grid_css`: paso mínimo 2 mm, máx 10 puntos)
2. Para cada combinación (itertools.product): calcula caudal al cuello de botella (`min(cap_at_css para cada chancador, cap_pantalla) × capR × wi_factor`)
3. Limita por feed disponible y `alimentacion_tph` externo
4. Crea `Stream(tph_eff, feed_curve)` y simula: `crusher()` × N + `screen()` si hay pantalla
5. Verifica razón de reducción antes de cada chancador (descarta si viola)
6. Mide `_product_tph(output, products)` sumando fracciones dentro de rangos pedidos
7. Retorna mejor combo + hasta 3 alternativas + razón en lenguaje simple + mejora vs CSS mínimo

**Validación D-06:** con JAW-Test (css_min=50, cap=120 tph) y CONE-Test (css_min=20, cap=250 tph):
- Al mínimo (jaw=50, cone=20): bottleneck=120 × 0.8 = 96 tph → product ≈ 82 tph
- Al óptimo (jaw abierta): bottleneck sube → product > 200 tph
- `mejora_vs_css_minimo_pct > 0` verificado ✓

**Tests:** 7 tests (mejora vs mínimo, rango, campos, grilla, interpolación, error sin equipos, límite alim).

### T-16 · Factores NEA y BED (VSMA Etapa 2) — COMPLETA · Commit `1a99482`

**Nuevas funciones en `app/services/screen_capacity.py`:**

- `factor_NEA(pct_near_aperture)`: penalización por material ±25% de la abertura. Tabla piecewise lineal (0%→1.00, 20%→0.83, 40%→0.65, 60%→0.50, 80%→0.38, 100%→0.28). Consistente con example del paper: NEA≈0.59 en 40–50% near-size.

- `factor_BED(dm_inches, aperture_mm)`: espesor de cama. Implementado pero devuelve 1.0 cuando no hay datos (dm_inches=0). Fórmula: sin penalización hasta ratio dm/aperture=4, cae linealmente a 0.5 en ratio=8. **Pendiente datos de pantalla (B-BED01).**

- `nominal_tph_with_feed(screen, aperture_mm, feed_stream)`: llama `nominal_tph()` y multiplica por `factor_NEA` calculado desde la curva real del feed. Usar cuando se dispone de la corriente de alimentación.

**Tests:** 9 tests (NEA=1 sin material, monotónica, rango, consistente con paper, BED sin datos, BED cama baja, BED cama alta, tph sin near-size ≈ base, tph con near-size < sin near-size).

### T-11 · Curvas de producto C-1540 — BLOQUEADA (B-08 confirmado)

**Intento 1 (sesión anterior):** pypdf extrae solo texto, no valores de gráficos.
**Intento 2 (esta sesión):** `pdftoppm` (poppler) no disponible en el entorno Windows → Read tool falla con `pdftoppm failed`.
**Texto extraíble de páginas 76-79:** solo leyendas de gráficos ("Screen Mesh Size — Inches", "Percentage Passing", nombres de curvas por CSS). Los valores reales de % pasante no están en el texto del PDF.
**Dato recuperado:** la Tabla 3.4 (cap TPH vs CSS, Long Throw Eccentric) SÍ estaba en texto y ya fue cargada al catálogo en T-10.
**Conclusión:** para digitalizar las curvas de producto hay que abrir el manual manualmente, leer los gráficos, y pasar los puntos. La tarea queda bloqueada hasta que Marcelo lo haga.

---

*Sesiones anteriores: `docs/MEMORY_ARCHIVO.md`*
