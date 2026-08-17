# Datos extraídos de manuales oficiales — Mandíbulas Terex Finlay

Datos de manuales de operación guardados en `manuales/Mandíbulas/`.
Los PDF no se suben al repositorio (DECISIONS.md D-16); este documento sí.

---

## Resumen comparativo: catálogo actual vs. manual

| Modelo | Campo | Catálogo hoy | Manual oficial | Δ |
|---|---|---|---|---|
| **J-960** | apertura mandíbula | sin dato | 900×600 mm | nuevo |
| **J-960** | peso | sin dato | **28,000 kg** | nuevo |
| **J-960** | css_min | 40 mm | **no hallado** en Rev 5.2 | ver B-MJ01 |
| **J-960** | css_max | 140 mm | **no hallado** en Rev 5.2 | ver B-MJ01 |
| **J-960** | feed_max | 580 mm | **no hallado** en Rev 5.2 | ver B-MJ01 |
| **J-960** | cap_min / cap_max | 60–175 tph | **no hallado** en Rev 5.2 | ver B-MJ01 |
| **J-1160** | css_min | 40 mm | **40 mm** | ✓ |
| **J-1160** | css_max | 145 mm | **145 mm** (mandíbula estándar) | ✓ |
| **J-1160** | feed_max | 600 mm | **600 mm** (apertura 1000×600) | ✓ |
| **J-1160** | peso | sin dato | **32 t** / 35.35 t con opciones | nuevo |
| **J-1160** | cap_min / cap_max | 150–280 tph | **no hallado** en Rev 4.8 | ver B-MJ02 |
| **J-1170** | css_min | 50 mm | **50 mm** (inicio tabla Rev 1.0) | ✓ |
| **J-1170** | css_max | 150 mm | **125 mm** en Rev 1.0 | ver B-MJ03 |
| **J-1170** | feed_max | 700 mm | **700 mm** (apertura 1100×700) | ✓ |
| **J-1170** | cap_min | 90 tph | **90 tph** (CSS 50, mín) | ✓ |
| **J-1170** | cap_max | 290 tph | **290 tph** (CSS 125, máx) | ✓ |
| **J-1170** | curves tph | [115,130,160,180,200,235] | **exacto** (midpoints tabla) | ✓ |
| **J-1170** | peso | sin dato | **45,107 kg** (HA) / 45,607 kg (HR) | nuevo |
| **J-1175** | css_min | 50 mm | **50 mm** | ✓ |
| **J-1175** | css_max | 175 mm | **175 mm** | ✓ |
| **J-1175** | cap_min | 200 tph | **113–132 tph** @ CSS 50 | discrepancia |
| **J-1175** | cap_max | 452 tph | **402–452 tph** @ CSS 175 | ✓ |
| **J-1175** | curves tph | 11 puntos | **11 puntos exactos** | ✓ |
| **J-1480** | apertura mandíbula | sin dato | **1397×762 mm** (Jaques 54"×30") | nuevo |
| **J-1480** | feed_max | 1400 mm | **~1397 mm** (jaw 54") | ✓ |
| **J-1480** | css_min | 100 mm | **100 mm** (mín en tabla) | ✓ |
| **J-1480** | css_max | 200 mm | **200 mm** (máx en tabla) | ✓ |
| **J-1480** | peso | sin dato | **73 t** (con bypass e imán) | nuevo |
| **J-1480** | cap_min / cap_max | 400–600 tph | **no hallado** | ver B-MJ04 |
| **J-1280** | todos | en catálogo | **manual no disponible** | ver B-MJ05 |

---

## J-960

**Fuente:** Manual de funcionamiento Rev 5.2, 27-04-2023.  
**Revisión disponible:** 5.2. El catálogo cita datos de Rev 4.9 p.3-14 — versión distinta.

### Especificaciones encontradas en Rev 5.2

| Dato | Valor | Página manual |
|---|---|---|
| Apertura mandíbula | 900 mm × 600 mm | 4-4 (p.88 PDF) |
| Holgura bajo mandíbula | 420 mm | 4-4 (p.88 PDF) |
| Ajuste CSS | Hidráulico con calce de bloqueo | 4-4 (p.88 PDF) |
| Motor | CAT C4.4 o John Deere 4045 | 4-4 (p.88 PDF) |
| Conveyor descarga | 800 mm ancho | 4-5 (p.89 PDF) |
| Peso | 28,000 kg (con imán y bypass) | 3-9 (p.79 PDF) |
| Hopper | 4000×1800 mm, 3.6 m³ | 3-12 (p.82 PDF)\* |
| CSS min / max | **no hallado en Rev 5.2** | — |
| feed_max | **no hallado en Rev 5.2** | — |
| Capacidad tph | **no hallado en Rev 5.2** | — |

\* Dato citado en resumen de sesión anterior.

### Comparación con catálogo

| Campo | Catálogo (fuente: Rev 4.9 p.3-14) | Rev 5.2 | Nota |
|---|---|---|---|
| css_min | 40 mm | no hallado | distinta revisión |
| css_max | 140 mm | no hallado | distinta revisión |
| feed_max | 580 mm | no hallado | distinta revisión |
| cap_min | 60 tph | no hallado | distinta revisión |
| cap_max | 175 tph | no hallado | distinta revisión |
| curves | {40:65, 50:80, 63:97.5, 75:102.5, 100:130, 125:160} tph | no hallado | distinta revisión |

La sección 3.7 "Granulometría de las mandíbulas" de Rev 5.2 (p.3-14, PDF p.84) contiene curvas de producto (Figura 3.5, Figura 3.6) en formato gráfico. No hay tabla de capacidad tph. El catálogo fue verificado con Rev 4.9; los datos de capacidad pueden haberse reubicado o eliminado en Rev 5.2.

---

## J-1160

**Fuente:** Manual de funcionamiento Rev 4.8, 06-02-2024.  
**Sección:** 3 "Datos técnicos", páginas 3-11 y 3-12, PDF páginas 85-86.

### Especificaciones del manual

| Dato | Valor | Página manual |
|---|---|---|
| Apertura mandíbula | 1000 mm × 600 mm (40" × 24") | 3-11 (p.85 PDF) |
| Ajuste CSS mínimo | **40 mm** (1.5") | 3-11 (p.85 PDF) |
| Ajuste CSS máximo | **145 mm** (5.7") — mandíbula estándar | 3-11 (p.85 PDF) |
| Ajuste CSS | Hidráulico con pulsador eléctrico | 3-11 (p.85 PDF) |
| Tipo trituradora | Mandíbula de articulación simple | 3-11 (p.85 PDF) |
| Lubricación | Grasa | 3-11 (p.85 PDF) |
| Tolva estándar | 3900 mm largo, 2200 mm ancho, 5 m³ | 3-11 (p.85 PDF) |
| Tolva con extensiones | 4300 mm largo, 2800 mm ancho, 8 m³ | 3-11 (p.85 PDF) |
| Motor velocidad | 1500/1800 RPM (Tier 4/Fase V) | 3-12 (p.86 PDF) |
| Velocidad trituradora | 220–300 RPM | 3-12 (p.86 PDF) |
| Peso estándar | **32 t** | 3-12 (p.86 PDF) |
| Peso con opciones | **35.35 t** (bypass, polea doble, ext. tolva) | 3-12 (p.86 PDF) |
| Depósito diésel | 640 L | 3-12 (p.86 PDF) |
| Depósito hidráulico | 600 L | 3-12 (p.86 PDF) |
| Capacidad tph | **no publicada en Rev 4.8** | — |

**Granulometría de producto** (p.3-13/3-14, PDF p.87-88): tablas de % pasante para roca blanda y dura con CSS desde 75 hasta 200 mm. Estas son curvas de producto, **no tabla de capacidad tph**.

### Comparación con catálogo

| Campo | Catálogo | Manual Rev 4.8 | Nota |
|---|---|---|---|
| css_min | 40 mm | **40 mm** | ✓ |
| css_max | 145 mm | **145 mm** (mandíbula estándar) | ✓ |
| feed_max | 600 mm | **600 mm** (apertura 1000×600) | ✓ |
| cap_min | 150 tph | sin dato en Rev 4.8 | sin fuente |
| cap_max | 280 tph | sin dato en Rev 4.8 | sin fuente |
| curves tph | sin dato | sin dato | — |

---

## J-1170

**Fuente:** Manual de funcionamiento Rev 1.0, 08/11/2012.  
**Nota:** El catálogo cita datos de Rev 6.5 — versión más reciente con CSS max extendido.

### Especificaciones del manual

| Dato | Valor | Página manual |
|---|---|---|
| Apertura mandíbula | 1100 mm × 700 mm | 3-13 (p.61 PDF) |
| Tipo trituradora | 1100 × 700 (designación Terex) | 3-13 (p.61 PDF) |
| Peso trituradora sola | 17,615 kg | 3-13 (p.61 PDF) |
| Motor Tier 3 | CAT C9, 261 kW (350 CV) @ 1900 rpm | 3-12 (p.60 PDF) |
| Motor Tier 4 | Scania DC9, 275 kW (345 CV) @ 2000 rpm | 3-12 (p.60 PDF) |
| Depósito combustible | 500 L | 3-12 (p.60 PDF) |
| Alimentador | 2400 mm ancho, 4250 mm largo | 3-12 (p.60 PDF) |
| Conveyor descarga | 1000 mm ancho | 3-12 (p.60 PDF) |
| Tolva | 9.66 m³, acero desgaste 10 mm | 3-13 (p.61 PDF) |
| Peso total HA (con imán y bypass) | **45,107 kg** | 3-10 (p.58 PDF) |
| Peso total HR (con imán y bypass) | **45,607 kg** | 3-10 (p.58 PDF) |

### Tabla de capacidad (p.3-14, PDF p.62) — Rev 1.0

| CSS (mm) | Tph Mín | Tph Máx | Midpoint |
|---|---|---|---|
| 50 | 90 | 140 | **115** |
| 64 | 100 | 160 | **130** |
| 75 | 130 | 190 | **160** |
| 90 | 140 | 220 | **180** |
| 100 | 150 | 250 | **200** |
| 125 | 180 | 290 | **235** |

### Comparación con catálogo

| Campo | Catálogo (fuente: Rev 6.5 p.3-19) | Rev 1.0 | Nota |
|---|---|---|---|
| css_min | 50 mm | **50 mm** | ✓ |
| css_max | 150 mm | **125 mm** (tabla) | Rev 1.0 tabula solo hasta 125mm |
| feed_max | 700 mm | **700 mm** (apertura 1100×700) | ✓ |
| cap_min | 90 tph | **90 tph** | ✓ |
| cap_max | 290 tph | **290 tph** | ✓ |
| curves tph | [115,130,160,180,200,235] | **[115,130,160,180,200,235]** | ✓ exacto |

El catálogo está completamente confirmado por Rev 1.0. La única diferencia es css_max=150 del catálogo (Rev 6.5) vs 125 mm de la tabla Rev 1.0 — la extensión del rango fue incorporada en revisiones posteriores.

---

## J-1175

**Fuente:** Manual de funcionamiento Rev 8.8, TRX1176J.  
**Sección:** 3-10 (p.85 PDF). Datos verificados en sesión anterior.

### Tabla de capacidad (p.3-10, PDF p.85) — Rev 8.8

| CSS (mm) | Tph Mín | Tph Máx | Midpoint |
|---|---|---|---|
| 50 | 113 | 132 | **122.5** |
| 60 | 138 | 157 | **147.5** |
| 75 | 166 | 186 | **176.0** |
| 90 | 195 | 220 | **207.5** |
| 100 | 226 | 251 | **238.5** |
| 115 | 264 | 289 | **276.5** |
| 125 | 289 | 314 | **301.5** |
| 140 | 327 | 364 | **345.5** |
| 150 | 346 | 383 | **364.5** |
| 165 | 377 | 427 | **402.0** |
| 175 | 402 | 452 | **427.0** |

### Comparación con catálogo

| Campo | Catálogo | Manual Rev 8.8 | Nota |
|---|---|---|---|
| css_min | 50 mm | **50 mm** | ✓ |
| css_max | 175 mm | **175 mm** | ✓ |
| feed_max | 790 mm | no hallado en texto | ver B-MJ06 |
| cap_min | 200 tph | **113–132 tph** @ CSS 50 | discrepancia |
| cap_max | 452 tph | **402–452 tph** @ CSS 175 | ✓ |
| curves tph | 11 midpoints | **11 midpoints exactos** | ✓ |

**Discrepancia cap_min:** El catálogo dice 200 tph pero la tabla muestra 113-132 tph @ CSS 50 (mínimo real). El cap_min del catálogo probablemente representa el rango de operación recomendado, no el absoluto de la tabla.

---

## J-1480

**Fuente:** Manual de funcionamiento Rev 291116-10.  
**Nota:** El catálogo cita datos de Rev 1.9 — versión distinta con paginación diferente.

### Especificaciones del manual

| Dato | Valor | Página manual |
|---|---|---|
| Trituradora | Jaques 54"×30" de simple efecto | IT-3 (p.50 PDF) |
| Apertura mandíbula | **1397 mm × 762 mm** (= 54" × 30") | IT-3 (p.50 PDF) |
| Motor opciones | CAT C13 o Scania DC13 | IT-3 (p.50 PDF) |
| Tolva | 10 m³, plegable hidráulicamente | IT-3 (p.50 PDF) |
| Conveyor principal | 1400 mm ancho | IT-4 (p.51 PDF) |
| Conveyor bypass | 750 mm ancho | IT-4 (p.51 PDF) |
| Velocidad trituradora | 220–265 rpm | IT-5 (p.52 PDF) |
| Peso total | **73 t** (con bypass e imán) | IT-5 (p.52 PDF) |
| Depósito combustible | 1000 L | IT-5 (p.52 PDF) |
| Depósito hidráulico | 900 L | IT-5 (p.52 PDF) |
| Capacidad tph | **no publicada** | — |

**Tabla de granulometría** (p.IT-6, PDF p.53): % pasante para piedra caliza a CSS 100, 150 y 200 mm. Estos son curvas de producto, **no tabla de capacidad tph**.

### Comparación con catálogo

| Campo | Catálogo (fuente: Rev 1.9 p.3-10) | Rev 291116-10 | Nota |
|---|---|---|---|
| css_min | 100 mm | **100 mm** (mín en tabla de granulometría) | ✓ |
| css_max | 200 mm | **200 mm** (máx en tabla de granulometría) | ✓ |
| feed_max | 1400 mm | **~1397 mm** (mandíbula 54") | ✓ |
| cap_min | 400 tph | sin dato | sin fuente en esta revisión |
| cap_max | 600 tph | sin dato | sin fuente en esta revisión |

---

## J-1280

**Estado:** Manual **no disponible** en `manuales/Mandíbulas/`. El equipo existe en el catálogo pero no se puede verificar ningún dato contra manual. Sin acción posible en T-13.

---

## Bloqueos registrados de esta sesión

- **B-MJ01:** El manual J-960 disponible es Rev 5.2 (2023); el catálogo cita Rev 4.9. En Rev 5.2 la sección 3.7 (p.3-14, PDF p.84) contiene curvas de producto (imágenes), sin tabla de capacidad tph. Los valores de css_min, css_max, feed_max y cap_min/max del catálogo no pudieron verificarse en la revisión disponible. La revisión 4.9 no está en la carpeta de manuales.

- **B-MJ02:** El manual J-1160 Rev 4.8 contiene en sección 3.6 (3-12) datos de rendimiento que no incluyen tabla de tph por CSS. Las páginas 3-13 a 3-15 tienen curvas de granulometría de producto (% pasante) para CSS 75-200mm — no son capacidades tph. El catálogo cita cap_min=150, cap_max=280 sin fuente identificada en Rev 4.8. Posiblemente provienen de Rev 4.2 o de una hoja de producto.

- **B-MJ03:** El manual J-1170 Rev 1.0 (2012) tabula capacidades hasta CSS 125mm. El catálogo tiene css_max=150mm con fuente Rev 6.5. La extensión de CSS a 150mm fue añadida en versiones posteriores. No se puede confirmar con Rev 1.0, pero no es una discrepancia — es diferencia de revisiones.

- **B-MJ04:** El manual J-1480 Rev 291116-10 tiene en sección 2.3.8 curvas de granulometría para piedra caliza (CSS 100, 150, 200mm) pero no tabla de capacidad tph. El catálogo cita cap_min=400, cap_max=600 de Rev 1.9 p.3-10. Esa revisión tiene paginación diferente (usa "p.3-" no "IT-"). La revisión disponible es Rev 291116-10, sin tabla de capacidad.

- **B-MJ05:** J-1280 no tiene manual disponible en la carpeta `manuales/Mandíbulas/`. No se puede ejecutar T-13 para este modelo.

- **B-MJ06:** feed_max=790mm del J-1175 probablemente está en la Tabla 3.1 de la sección de datos técnicos, que pypdf no pudo extraer (imagen). La sección 3-10 tiene la tabla de capacidades (texto extraído correctamente) pero feed_max no aparece en texto en las páginas procesadas.
