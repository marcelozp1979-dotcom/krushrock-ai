# Datos extraídos de manuales oficiales — Seleccionadoras Finlay

Datos de manuales de operación Terex Finlay guardados en `manuales/Seleccionadoras/`.
Los PDF no se suben al repositorio (DECISIONS.md D-16); este documento sí.

**Nota crítica:** Ninguno de los cinco manuales publica datos de capacidad en tph.
Las seleccionadoras son equipos cuyo rendimiento depende del material, la granulometría
y la apertura de mallas instaladas. Los fabricantes no publican tablas de tph porque no son
transferibles entre aplicaciones. Los valores actuales del catálogo (cap_min, cap_max)
**no tienen fuente de manual** y deben marcarse como sin verificar.

---

## Resumen comparativo: catálogo actual vs. manual

| Modelo | Campo | Catálogo hoy | Manual oficial | Δ |
|---|---|---|---|---|
| **683** | área criba | 10.1 m² | **10.95 m²** (3.65×1.5×2) | +0.85 m² |
| **683** | motor | sin dato | **97 kW** Tier 3 / 82 kW Tier 4 | nuevo |
| **683** | peso máquina | sin dato | **24.8 t** (con rejilla) | nuevo |
| **683** | tph capacidad | 100–250 tph | **sin dato en manual** | sin fuente |
| **684 2-deck** | área criba | 14.6 m² | **14.62 m²** (4.3×1.7×2) | ≈ correcto |
| **684 3-deck** | área criba | 21.9 m² | **21.93 m²** (4.3×1.7×3) | ≈ correcto |
| **684** | motor | sin dato | **83 kW** Tier 3 / 82 kW Tier 4 | nuevo |
| **684** | peso máquina | sin dato | **30.5 t** (3 pisos) / **28.75 t** (2 pisos) | nuevo |
| **684** | tph capacidad | 120–280 / 150–300 | **sin dato en manual** | sin fuente |
| **694+** | área criba | 28.0 m² | **27.87 m²** (6.1×1.524×3) | ≈ correcto |
| **694+** | motor | sin dato | **90 kW** Tier 3 / **93 kW** Tier 4 | nuevo |
| **694+** | peso máquina | sin dato | **35.9–42.75 t** (según config) | nuevo |
| **694+** | tph capacidad | 150–350 tph | **sin dato en manual** | sin fuente |
| **696** | área criba | 31.1 m² | **31.1 m²** (6.1×1.70×3) | ✓ correcto |
| **696** | motor | sin dato | **90 kW** Tier 3 / **93 kW** Tier 4 | nuevo |
| **696** | peso máquina | sin dato | **36.8 t** (3 pisos) / **33.8 t** (2 pisos) | nuevo |
| **696** | feed_max_mm | None | **100 mm** | nuevo |
| **696** | tph capacidad | 180–400 tph | **sin dato en manual** | sin fuente |
| **595** | todo | **no existe** | modelo a agregar (scalper) | nuevo |

---

## 595

**Fuente:** Manual de funcionamiento Rev 1.7, 30/10/2018.
**Tipo de equipo:** Rejilla vibratoria de dos pisos (scalper primario), no una seleccionadora
convencional con múltiples fracciones de producto.
**Estado en catálogo:** No existe. Agregar requiere decisión sobre si va en `screen` o en
categoría propia (`scalper`).

### Especificaciones del manual

| Dato | Valor |
|---|---|
| Tipo | Máquina de cribado móvil |
| Rejilla vibratoria (2 pisos) | 4.2 m (13'-8") × 2.7 m (6'-1")\* |
| Pisos de rejilla | 2 |
| Alimentador principal | 1.2 m (48") de ancho |
| Tolva | 83 m³ |
| Altura descarga | 3.4 m |
| Motor Tier 3 | Deutz D914 L04, **53 kW (74 hp)** |
| Motor Tier 4 | CAT C3.4, **56 kW (75 hp)** |
| Peso total | **21,500 kg (23.7 t EE.UU.)** |
| Capacidad tph | sin dato en manual |

\* El manual indica 4,2 m (13'-8") × 2,7 m (6'-1") — la conversión 6'-1" = 1.85 m no cuadra
con 2.7 m. Se reporta literalmente el texto del manual; la dimensión métrica puede tener un error
tipográfico. Se anota en bloqueos para aclaración.

---

## 683

**Fuente:** Manual de funcionamiento Rev 15, 29/07/2012. Sección 2 "Información Técnica",
páginas IT-7 (Datos Técnicos) e IT-3 (descripción de criba), PDF páginas 61 y 58.

### Especificaciones del manual

| Dato | Valor |
|---|---|
| Tipo | Criba móvil (2 decks) |
| Dimensiones criba | 3.65 m (12'-0") × 1.5 m (5'-0") por piso |
| Área de cribado (2 decks) | **10.95 m²** (3.65 × 1.5 × 2) |
| Velocidad cribado | 1200 rpm |
| Alimentador | 1.050 m (42") de ancho, 0–16 m/min |
| Tolva | 6.8 m³ |
| Motor Tier 3 | CAT 4.4, **97 kW (130 CV)** |
| Motor Tier 4 | CAT 4.4 Tier 4i, **82 kW (110 CV)**, 2200 rpm |
| Peso con rejilla vibratoria | **24.8 t** |
| Depósito diésel | 324 L |
| Depósito hidráulico (Tier 3) | 500 L |
| Depósito hidráulico (Tier 4) | 450 L |
| Capacidad tph | **sin dato en manual** |

### Comparación con catálogo

| Campo | Catálogo | Manual | Nota |
|---|---|---|---|
| area_m2 | 10.1 | **10.95** | +0.85 m² (~8.4%) |
| decks | 2 | 2 | ✓ |
| cap_min_tph | 100 | sin dato | sin fuente |
| cap_max_tph | 250 | sin dato | sin fuente |

El área del catálogo (10.1 m²) es un 8.4% menor que la calculada desde dimensiones del manual
(10.95 m²). El catálogo podría estar usando área efectiva neta vs. área bruta, o una fuente
distinta. No se puede confirmar cuál es correcta.

---

## 684

**Fuente:** Manual de funcionamiento Rev 3.3, 04/01/2017. Sección 3 "Datos Técnicos",
páginas 3-2 a 3-4, PDF páginas 46–48.

### Especificaciones del manual

| Dato | Valor |
|---|---|
| Tipo | Criba móvil (2 o 3 pisos) |
| Dimensiones criba | 4.3 m (14') × 1.7 m (5'-7") por piso |
| Área de cribado (2 decks) | **14.62 m²** (4.3 × 1.7 × 2) |
| Área de cribado (3 decks) | **21.93 m²** (4.3 × 1.7 × 3) |
| Velocidad cribado | 950 rpm |
| Alimentador | 1.200 mm (47") de ancho, 0–16 m/min |
| Tolva | 8 m³ |
| Motor Tier 3 | CAT 4.4, **83 kW (110 CV)**, 1800 rpm |
| Motor Tier 4 | CAT 4.4 Tier 4F, **82 kW (110 CV)**, 1800 rpm |
| Peso total (2 pisos) | **28,750 kg (63,380 lb)** |
| Peso total (3 pisos) | **30,500 kg (67,240 lb)** |
| Depósito diésel | 324 L |
| Depósito hidráulico (Tier 3) | 500 L |
| Depósito hidráulico (Tier 4) | 450 L |
| Capacidad tph | **sin dato en manual** |

### Comparación con catálogo

| Campo | Catálogo (2-deck) | Catálogo (3-deck) | Manual | Nota |
|---|---|---|---|---|
| area_m2 | 14.6 | 21.9 | **14.62 / 21.93** | ✓ correcto |
| decks | 2 | 3 | 2 o 3 | ✓ |
| cap_min_tph | 120 | 150 | sin dato | sin fuente |
| cap_max_tph | 280 | 300 | sin dato | sin fuente |

Las áreas del catálogo están correctas. Los datos de tph no tienen fuente de manual.

---

## 694+

**Fuente:** Manual de funcionamiento Rev 5.5, 03/12/2024. Sección 3 "Datos Técnicos",
páginas 3-2 a 3-3, PDF páginas 68–69. Dimensiones de criba: Sección 4.3, página 4-6,
PDF página 86.

### Especificaciones del manual

| Dato | Valor |
|---|---|
| Tipo | Máquina de cribado móvil (3 pisos) |
| Dimensiones criba | 6.1 m (20'-0") × 1.52 m (5'-0") por piso |
| Área de cribado (3 decks) | **27.87 m²** (6.1 × 1.524 × 3) |
| Velocidad cribado | 1100 rpm |
| Alimentador | 0–19 m/min |
| Motor Tier 3 | CAT 4.4, **90 kW (121 hp)**, 1800 rpm |
| Motor Tier 4 | CAT 4.4 Tier 4i, **93 kW (125 hp)**, 1800 rpm |
| Motores Fase V | CAT C4.4: 102 o 129 kW; CAT C3.6: 82 kW; JCB 4.8: 97 kW |
| Motor bimodo eléctrico | 2 × 37 kW |
| Peso (con rejilla de volteo) | **35.90 t** |
| Peso (con rejilla vibratoria) | **42.75 t** |
| Depósito diésel | 336 L |
| Depósito hidráulico | 450 L |
| Capacidad tph | **sin dato en manual** |

### Comparación con catálogo

| Campo | Catálogo | Manual | Nota |
|---|---|---|---|
| area_m2 | 28.0 | **27.87** | ≈ correcto (−0.5%) |
| decks | 3 | 3 | ✓ |
| cap_min_tph | 150 | sin dato | sin fuente |
| cap_max_tph | 350 | sin dato | sin fuente |

El área del catálogo está esencialmente correcta.

---

## 696

**Fuente:** Manual de funcionamiento Rev 3.5, 01/07/2025. Sección 3 "Datos Técnicos",
páginas 3-2 a 3-4, PDF páginas 68–70. Dimensiones de criba: Sección 4.3 (1), página 4-6,
PDF página 88.

### Especificaciones del manual

| Dato | Valor |
|---|---|
| Tipo | Máquina de cribado móvil (2 o 3 pisos) |
| Dimensiones criba | 6.1 m (20'-0") × 1.70 m (5'-7") por piso\* |
| Área de cribado (2 decks) | **20.74 m²** (6.1 × 1.70 × 2) |
| Área de cribado (3 decks) | **31.11 m²** (6.1 × 1.70 × 3) |
| Velocidad cribado | 1050 rpm |
| Alimentador | 1.200 mm (47") de ancho, 0–19 m/min |
| Tolva | 8 m³ |
| Tamaño máximo de pieza | **100 mm** |
| Motor Tier 3 | CAT 4.4, **90 kW (121 hp)**, 1800 rpm |
| Motor Tier 4 | CAT 4.4, **93 kW (125 hp)**, 1800 rpm |
| Motores Fase V | CAT C4.4: 102 o 129 kW; CAT C3.6: 82 kW; JCB 4.8: 97 kW |
| Motor bimodo eléctrico | 2 × 37 kW |
| Peso (2 pisos) | **33.80 t** |
| Peso (3 pisos) | **36.80 t** |
| Peso (3 pisos + rejilla vibratoria) | **40.60 t** |
| Depósito diésel | 336 L |
| Depósito hidráulico | 450 L |
| Capacidad tph | **sin dato en manual** |

\* El manual dice literalmente "1,5 metros (5'-7")" — inconsistencia interna. La conversión correcta
de 5'-7" es 1.70 m, que cuadra exactamente con el área del catálogo (31.1 m²). Se usa 1.70 m.

### Comparación con catálogo

| Campo | Catálogo | Manual | Nota |
|---|---|---|---|
| area_m2 | 31.1 | **31.11** | ✓ correcto |
| decks | 3 | 2 o 3 | ✓ (3 es la config estándar) |
| feed_max_mm | None | **100 mm** | nuevo dato confirmado |
| cap_min_tph | 180 | sin dato | sin fuente |
| cap_max_tph | 400 | sin dato | sin fuente |

---

## Bloqueos registrados de esta sesión

- **B-SL01:** Los valores de tph (cap_min/cap_max) de todas las seleccionadoras del catálogo
  no tienen fuente de manual. Los manuales no publican tph. Origen de los valores desconocido.
  Se marca como sin verificar hasta conseguir fuente alternativa (hojas de ventas, AggFlow, etc).

- **B-SL02:** La 595 no está en el catálogo. Su estructura (rejilla de barras 2 pisos, un solo
  transportador de finos) es más propia de un scalper que de una seleccionadora. Requiere
  decisión de Marcelo: ¿se agrega como `screen` o como nueva categoría `scalper`? La
  dimensión de rejilla tiene inconsistencia métrica/imperial en el manual (ver nota de la tabla).

- **B-SL03:** El área del 683 en el catálogo (10.1 m²) es un 8.4% menor que el valor calculado
  desde las dimensiones del manual (10.95 m²). Posible uso de área efectiva neta vs. bruta.
  No se puede corregir sin aclaración.

- **B-SL04:** El motor de la 683 Tier 4 (82 kW / 2200 rpm) tiene potencia similar a Tier 3 del 684
  (83 kW). No es un error, sino la evolución de la plataforma de motor. Queda registrado para
  no confundirlo con una errata.
