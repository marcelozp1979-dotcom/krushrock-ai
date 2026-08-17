# MEMORY.md — Memoria de trabajo

**Marcelo: lee solo la sección 1. Todo lo demás es detalle de respaldo.**

Estructura fija de este archivo. El agente **no la cambia**:

1. `PARTE DE LA ÚLTIMA SESIÓN` — resumen de lo último, siempre arriba. Se **reemplaza** entero cada sesión.
2. `BLOQUEOS ABIERTOS` — lo que Marcelo debe responder o aportar.
3. `DETALLE DE LA ÚLTIMA SESIÓN` — el paso a paso, por si hay que auditar algo.
4. Las sesiones anteriores se mueven a `docs/MEMORY_ARCHIVO.md`. Aquí nunca se acumulan.

---

# 1 · PARTE DE LA ÚLTIMA SESIÓN

**Fecha:** 17-ago-2026 · **Rama:** `trabajo/2026-08-17` · **Modo:** autónomo

**Resultado: T-13 parcialmente completada. 285 tests verdes, 2 omitidos. Sin commit aún.**

| Familia | Archivo creado | Estado |
|---|---|---|
| Seleccionadoras | `docs/DATOS_MANUALES_SELECCIONADORAS.md` | ✓ Completo (5 modelos) |
| Mandíbulas | `docs/DATOS_MANUALES_MANDIBULAS.md` | ✓ Completo (J-1280 sin manual) |
| Impactores | `docs/DATOS_MANUALES_IMPACTORES.md` | ✓ Parcial (IC-100, I-110RS; faltan I-120, I-130RS, I-140) |
| Scalpers | `docs/DATOS_MANUALES_SCALPERS.md` | ✓ Parcial (863+, 873+, 883+; falta 893+) |
| Conveyor | `docs/DATOS_MANUALES_CONVEYOR.md` | ✓ Completo (TC-80) |

**Lo que necesito de ti, en orden:**

1. **Resolver B-07 (regresión test Hierro).** El test `test_caso_real[Mina El Pleito Fase 3 - Hierro]`
   sigue fallando: sistema predice **132 tph**, test espera **161 tph**.
   ¿El 161 era de campo real o fue calculado con el catálogo antiguo (incorrecto)?

2. **Resolver B-08 (curvas C-1540).** Leer los gráficos del manual (Tabla 3.5) y pasarme los números,
   o autorizar las lecturas aproximadas de `docs/DATOS_MANUAL_C-1540.md`.

3. **Resolver B-SC01 (873+ / "Rinser 873").** El catálogo tiene cap_max=200 tph; el manual dice 450 tph.
   ¿Actualizo el catálogo con los datos del manual 873+?

4. **Resolver B-IM01 (I-110RS feed_max).** Catálogo: 750 mm. Manual: 304–500 mm. ¿Cuál es el valor correcto?

5. **Integrar la rama a main.** Ver `WORKFLOW.md` sección 9. Rama: `trabajo/2026-08-17`.

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

### T-13 · Extracción de datos de manuales — PARCIALMENTE COMPLETA

**Herramienta usada:** pypdf (único método que funciona en este entorno Windows; pdftotext/pdftoppm causan segfault).
**Técnica:** script por lote de 2–8 páginas para evitar timeout (cada página tarda 1–2 segundos).
**Páginas objetivo:** índice de la sección 3 "Datos técnicos" para encontrar los números, luego páginas específicas.

#### Seleccionadoras (5 manuales, completo)
- 595 Rev 1.7: rejilla scalper 2 pisos, 21,500 kg, motor 53–56 kW. No en catálogo.
- 683 Rev 15: área 10.95 m² (catálogo 10.1 m²), motor 97 kW Tier3 / 82 kW Tier4, peso 24.8 t.
- 684 Rev (varios): área 14.62 m² (2p) / 21.93 m² (3p), motor 83/82 kW, peso 28.75–30.5 t.
- 694+ Rev (varios): área 27.87 m², motor 90/93 kW, peso 35.9–42.75 t.
- 696 Rev (varios): área 31.1 m² ✓, motor 90/93 kW, peso 36.8 t, feed_max=100 mm.
- Hallazgo clave: ningún manual de seleccionadora publica tph.

#### Mandíbulas (5 manuales disponibles, J-1280 sin manual)
- J-960 Rev 5.2: peso 28,000 kg, mandíbula 900×600 mm, motor CAT C4.4/JD 4045. Tabla de tph no encontrada en esta revisión.
- J-1160 Rev 4.8: css_min=40 ✓, css_max=145 ✓, feed_max=600 ✓, peso=32 t. Sin tabla de tph.
- J-1170 Rev 1.0: tabla completa de tph en p.3-14 (PDF p.62). 6 puntos CSS 50–125 mm, todos coinciden con catálogo ✓.
- J-1175 Rev 8.8: 11 puntos CSS confirmados ✓. feed_max probable en imagen.
- J-1480 Rev 291116-10: mandíbula 1397×762 mm (54"×30"), CSS 100–200 mm ✓, peso 73 t. Sin tabla de tph.

#### Impactores (2 de 5 leídos)
- IC-100 Rev 1.0: apertura 860×610 mm, rotor 860 mm, rampas A 20–55 mm / B 40–170 mm, motor JD 194 kW / Volvo 210–235 kW, peso 23,700 kg. No en catálogo.
- I-110RS Rev 020915-06: apertura 990×1020 mm, rotor 1000 mm, max feed 304–500 mm, motor CAT C9 223 kW, peso 34 t. feed_max catálogo (750 mm) no coincide con manual.
- I-120, I-130RS, I-140: disponibles, no leídos.

#### Scalpers (3 de 4 leídos)
- 863+ Rev 2.1: 18,000 kg, criba 1220×2770 mm (3.38 m²), motor 55 kW Tier4. No en catálogo.
- 873+ Rev 4.1: 26,300 kg, criba 3.66×1.52 m, motor 83/82 kW CAT, feed_max 500 mm, cap_max 450 tph. Catálogo "Rinser 873" dice 200 tph — gran discrepancia.
- 883+ Rev 5.1: 31,000–32,500 kg, criba 4.8×1.53×2 pisos (14.4 m²), motor 83/82 kW CAT. Catálogo "883 HF" cap 80–200 tph sin fuente.
- 893+: disponible, no leído.

#### Conveyor (1 de 1 leído)
- TC-80 Rev 3.6: cinta 1050 mm, longitud 23.5 m, cap hasta 600 t/h, peso 16,750 kg, motor Deutz 36.4/45 kW. No en catálogo; no existe tipo "conveyor".

---

*Sesiones anteriores: `docs/MEMORY_ARCHIVO.md`*
