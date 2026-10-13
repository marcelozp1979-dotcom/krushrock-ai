# MEMORY.md — Memoria de trabajo

**Marcelo: lee solo la sección 1. Todo lo demás es detalle de respaldo.**

Estructura fija de este archivo. El agente **no la cambia**:

1. `PARTE DE LA ÚLTIMA SESIÓN` — resumen de lo último, siempre arriba. Se **reemplaza** entero cada sesión.
2. `BLOQUEOS ABIERTOS` — lo que Marcelo debe responder o aportar.
3. `DETALLE DE LA ÚLTIMA SESIÓN` — el paso a paso, por si hay que auditar algo.
4. Las sesiones anteriores se mueven a `docs/MEMORY_ARCHIVO.md`. Aquí nunca se acumulan.

---

# 1 · PARTE DE LA ÚLTIMA SESIÓN

**Fecha:** 12-oct-2026 · **Rama:** `trabajo/2026-10-12` → fusionada a `main` · **Modo:** supervisado

**Resultado: T-30 completada — pantalla y PDF del modo simple ya no muestran ninguna marca. 367 tests verdes, 1 omitido.**

| Qué cambió | Detalle en lenguaje de negocio |
|---|---|
| Pantalla modo simple | Las tarjetas ya muestran "Mandíbula 900×600 mm · CSS 80 mm" en lugar de "Terex Finlay J-960 o equipo equivalente". Sin marcas, sin "o equipo equivalente". |
| PDF modo simple | El PDF generado muestra la clase de equipo. Sin marcas, sin "o equipo equivalente". |
| Resolución interna de referencia | Cuando el frontend pide el PDF con una clase, el backend busca la máquina de referencia internamente y la usa para calcular. Marcelo nunca la ve (D-25). |
| Nuevos tests | 8 tests nuevos en `test_t26_equipment_classes.py` (get_ref_model) y `test_proposal_pdf.py` (modo simple). |

**Lo que necesitas revisar (prueba visual necesaria):**

1. **Probar el modo simple en el navegador.** Abrir la app, ir a "Dime qué necesitas", poner roca=caliza, tamaño=150mm, producto Gravilla 0-25mm 5000 ton, 2 meses, y verificar que las tarjetas muestran clases (ej. "Mandíbula 900×600 mm") sin ninguna marca. Descargar el PDF y confirmar lo mismo. Esta verificación visual no la puede hacer el agente.

2. **Bloqueos anteriores siguen abiertos.** B-MJ05 (J-1280 sin manual), B-MJ04/B-MJ02 (J-1480/J-1160 sin tabla tph). Ver sección 2.

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

### B-04 · RESUELTO EN T-23
El bloqueo `if not jaws: return []` fue eliminado. El sistema ahora genera configs
sin mandíbula (`cone_screen`, `screen_only`, `hsi_screen`) cuando no hay mandíbula viable.

### B-T24-M6x20 · Astec M6x20-3D — área de criba sin fuente
M6x20-3D retirada del catálogo en T-24 porque no hay manual disponible con el dato de
`area_m2_per_deck`. Sin ese dato la fórmula VSMA devuelve 0 tph, lo que produce un resultado
incoherente (0 tph + 100% de aprovechamiento). La máquina es real y pertenece al catálogo
de Astec/JCI (la empresa que escribió el paper VSMA). Volver a agregar cuando Marcelo
aporte el manual con las dimensiones de la criba (aproximado: 6 ft × 20 ft = 11,2 m²/deck,
pero NO cargar sin fuente citada del manual).

### B-T24-HF · 883 HF y 884 HF (Terex Finlay) — área sin manual
No hay manuales de 883 HF ni 884 HF en `manuales/Seleccionadoras/`. Retiradas del catálogo
en T-25 (bloqueo B-T25-HF). Volver a agregar cuando Marcelo aporte los manuales.

### B-T25-1D · screen_1d sin área — Warrior 600, MS 402i, ST1.5, QA141
Cuatro seleccionadoras de 1 deck retiradas del catálogo en T-25 por no tener `area_m2_per_deck`
ni manuales disponibles en `manuales/Seleccionadoras/`. Volver a agregar cuando Marcelo
aporte los manuales con dimensiones de criba (largo × ancho en pies o metros).

### B-T25-HF · screen_hf sin área — 883 HF, 884 HF, Warrior 2100, MOBISCREEN HF, SF Series HF
Cinco seleccionadoras de alta frecuencia retiradas del catálogo en T-25 por no tener
`area_m2_per_deck` ni manuales disponibles. Volver a agregar cuando Marcelo aporte manuales.

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

### T-30 · Clases de equipo en pantalla y PDF — COMPLETA · Rama `trabajo/2026-10-12`

**Diagnóstico inicial:**
- T-26 dejó la API lista pero el frontend nunca enviaba `mode: "simple"` → el backend respondía en modo advanced (con marcas).
- Aunque llegara la clase, la pantalla leía `eq.marca` y `eq.modelo` que ya no existen en modo simple.
- El PDF usaba `e.marca` y `e.modelo` → enviaba `undefined` al backend → error silencioso.

**Cambios en `krushrock-app/src/components/ModoSimple.jsx`:**
1. `handleRecommend`: agregado `mode: "simple"` al body de fetch.
2. Tarjeta de equipo: muestra `eq.clase || eq.tipo_legible` en lugar de `eq.marca eq.modelo + " o equipo equivalente"`.
3. `handleProposal`: envía `{ etapa, clase }` cuando existe clase, `{ etapa, marca, modelo }` en avanzado.
4. Cabecera de tabla comparativa: usa `e.clase || e.modelo` (evita `undefined`).

**Cambios en `app/services/equipment_classes.py`:**
- Agregado `_CLASS_TO_MODEL` (diccionario inverso clase → modelo de referencia).
- Agregada función `get_ref_model(class_name) → Optional[str]` (uso interno, D-25).

**Cambios en `app/routers/reports.py`:**
- `_EquipoProposal.marca` y `.modelo` ahora son `Optional[str] = None`.
- Campo `clase: Optional[str] = None` agregado.
- Lógica `_resolve_equipo()`: si viene `clase` sin `modelo`, llama a `get_ref_model()` para obtener el modelo de referencia, luego busca su `brand` en `_FALLBACK`. Corre `run_config` con la máquina real internamente; Marcelo nunca la ve.

**Cambios en `app/services/proposal_pdf.py`:**
- Columna del PDF ahora dice "Equipo" (antes "Equipo (marca y modelo)").
- Si el equipo tiene `clase`, muestra `clase` directamente, sin "o equipo equivalente".

**Tests nuevos:**
- `TestGetRefModel` en `test_t26_equipment_classes.py`: 5 tests (lookup inverso).
- `test_endpoint_proposal_modo_simple_retorna_pdf`: endpoint con clase genera PDF válido.
- `test_build_proposal_pdf_con_clase`: verifica que "o equipo equivalente" no aparece cuando hay clase.
- `test_endpoint_proposal_clase_desconocida_retorna_422`: clase inválida → 422.

**Tests:** 367 passed, 1 skipped.

---

*Sesiones anteriores: `docs/MEMORY_ARCHIVO.md`*
