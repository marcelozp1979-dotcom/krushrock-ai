# Datos extraídos — Terex Finlay C-1540 (cono)

**Fuente:** C-1540 Operations Manual, Revisión 2.7, 16-04-2025, sección 3 "Technical Data",
páginas 3-13 a 3-17 (páginas 76 y 77 del PDF).
Archivo: `manuales/Conos/C-1540 Operations Manual Rev 2 (en).pdf`

**Advertencia del propio manual:** las capacidades son aproximadas, medidas con caliza dura
limpia, seca y bien graduada, de 1.600 kg/m³ y densidad específica 2,6–2,8. Alimentación húmeda
o pegajosa reduce la capacidad. Las capacidades indicadas son **para circuito abierto**.
El tamaño máximo de alimentación se reduce al 80% del indicado cuando se chanca grava de río.

---

## 1 · Lo más importante: el catálogo de KrushRock está equivocado

| Dato | Catálogo KrushRock hoy | Manual oficial | Diferencia |
|---|---|---|---|
| CSS mínimo | 10 mm | 19 mm (eje largo) / 16 mm (eje corto) | El catálogo permite cerrar el cono al doble de lo posible |
| CSS máximo | 44 mm | 32 mm (última fila de tabla) | Sobreestimado |
| Capacidad mínima | 150 tph | 125 tph | Sobreestimado |
| Capacidad máxima | 300 tph | 220 tph | **Sobreestimado en 36%** |
| Alimentación máxima | 215 mm | 160 / 175 / 195 mm según cóncavo | Sobreestimado |

Con estos valores, KrushRock viene proponiendo el C-1540 para trabajos que la máquina no puede
hacer, y prometiendo hasta un 36% más de producción de la que el fabricante declara.

---

## 2 · Configuraciones de la máquina

El C-1540 no tiene una sola curva: cambia según el **excéntrico** (largo o corto) y el
**cóncavo** instalado. Son cuatro configuraciones distintas.

### 2.1 Chancador con excéntrico largo (Long Throw)

Tabla 3.3 — Alimentación máxima y CSS mínimo recomendado:

| Tipo de cóncavo | Alimentación máxima | CSS mínimo recomendado |
|---|---|---|
| Medium Coarse (MC) | 160 mm | 19 mm |
| Coarse (C) | 175 mm | 19 mm |
| Extra Coarse (XC) | 195 mm | 22 mm |

Tabla 3.4 — Capacidad estimada:

| CSS (mm) | tph métricas |
|---|---|
| 19 | 125 – 145 |
| 22 | 140 – 180 |
| 25 | 145 – 195 |
| 28 | 155 – 205 |
| 32 | 160 – 220 |

### 2.2 Chancador con excéntrico corto (Short Throw)

Tabla 3.6 — Alimentación máxima y CSS mínimo recomendado:

| Tipo de cóncavo | Alimentación máxima | CSS mínimo recomendado |
|---|---|---|
| Medium Coarse (MC) | 160 mm | 16 mm |
| Coarse (C) | 175 mm | 16 mm |
| Extra Coarse (XC) | 195 mm | 19 mm |

Tabla 3.7 — Capacidad estimada:

| CSS (mm) | tph métricas |
|---|---|
| 16 | 90 – 110 |
| 19 | 105 – 120 |
| 22 | 115 – 150 |
| 25 | 120 – 160 |
| 28 | 130 – 170 |
| 32 | 135 – 180 |

### 2.3 Autosand con excéntrico largo

Cóncavo Sand (AS): alimentación máxima **63 mm**, CSS mínimo **13 mm**.

| CSS (mm) | tph métricas |
|---|---|
| 13 | 85 – 120 |
| 16 | 95 – 130 |
| 19 | 100 – 150 |

### 2.4 Autosand con excéntrico corto

Cóncavo Sand (AS): alimentación máxima **63 mm**, CSS mínimo **13 mm**.

| CSS (mm) | tph métricas |
|---|---|
| 13 | 70 – 100 |
| 16 | 80 – 110 |
| 19 | 85 – 125 |

---

## 3 · Curvas de producto (Tablas 3.5, 3.8, 3.11, 3.14)

En el manual **no son tablas, son gráficos**. Hay que leerlos punto por punto de la imagen.

Lecturas preliminares del gráfico de excéntrico largo (Tabla 3.5), tomadas a ojo sobre la
imagen ampliada. **Precisión estimada ±5 puntos porcentuales. NO cargar al catálogo sin una
digitalización cuidadosa.**

| CSS | Tamaño al 80% pasante (P80) | P80 / CSS | Tamaño al 100% pasante | 100% / CSS |
|---|---|---|---|---|
| 19 mm | ~18,6 mm | 0,98 | ~28 mm | 1,48 |
| 22 mm | ~22,3 mm | 1,01 | ~34 mm | 1,55 |
| 25 mm | ~27,2 mm | 1,09 | ~40 mm | 1,61 |
| 28 mm | ~34,3 mm | 1,22 | ~47 mm | 1,68 |
| 32 mm | ~46,7 mm | 1,46 | ~57 mm | 1,80 |

### Curvas digitalizadas (Tabla 3.5 — excéntrico largo)

Digitalización del 17-ago-2026: el gráfico se renderizó a 600 dpi, se detectaron por píxel las
líneas de grilla y las curvas, y se verificó visualmente cada lectura.
**Precisión estimada ±3 puntos porcentuales.**

Porcentaje pasante acumulado, por tamaño de malla y por CSS:

| Malla (mm) | CSS 19 | CSS 22 | CSS 25 | CSS 28 | CSS 32 | Alimentación típica |
|---|---|---|---|---|---|---|
| 1,70 | 17 | 15 | 11 | 9 | 7 | — |
| 2,36 | 21 | 18 | 14 | 12 | 9 | — |
| 3,35 | 26 | 23 | 18 | 15 | 12 | — |
| 5,0 | 34 | 29 | 25 | 20 | 15 | — |
| 6,3 | 39 | 35 | 30 | 24 | 18 | — |
| 10 | 54 | 48 | 41 | 33 | 25 | 5 |
| 14 | 68 | 61 | 53 | 42 | 32 | 8 |
| 20 | 86 | 78 | 68 | 57 | 43 | 13 |
| 28 | 100 | 94 | 86 | 77 | 61 | 20 |
| 40 | — | 100 | 100 | 94 | 85 | 32 |
| 50 | — | — | — | 100 | 95 | 45 |
| 63 | — | — | — | — | 100 | 63 |
| 75 | — | — | — | — | — | 78 |
| 150 | — | — | — | — | — | 100 |

Las celdas con "—" son tamaños donde la curva ya alcanzó el 100% o donde aún no existe
(la curva de alimentación parte en ~6 mm).

**Verificación de coherencia:** las cinco curvas son monótonas crecientes, y para cada tamaño
el porcentaje baja al abrir el CSS. Ambas condiciones se cumplen sin excepción.

### Dos hallazgos que importan

**a) La relación P80/CSS del motor se confirma en el CSS cerrado.** El diagnóstico original
(`DIAGNOSTICO_MOTOR_KRUSHROCK.md`) fijó P80 ≈ CSS × 0,91 a partir de un reporte AggFlow del
C-1540RS. El manual da 0,98 en CSS 19 mm. Es consistente, y confirma que el factor 1,4–1,9 que
usaba el motor antiguo era erróneo.

**b) La curva normalizada única no se sostiene en todo el rango.** KrushRock asume que un cono
tiene **una sola** curva de producto en función de d/CSS, igual para cualquier abertura. Los
datos del manual muestran que la razón P80/CSS crece de 0,98 a 1,46 al abrir de 19 a 32 mm: el
producto se hace proporcionalmente más grueso de lo que predice el escalado simple.

Esto no invalida el motor —la aproximación es razonable cerca del CSS mínimo, que es donde
más se opera— pero es una fuente de error conocida que hay que documentar y, eventualmente,
corregir con una curva por rango de CSS.

---

## 4 · Qué hacer con esto

1. **Corregir el catálogo** con los valores reales de la sección 2. Es lo más urgente:
   hoy el software sobreestima la máquina.
2. **Decidir qué configuración representa el C-1540 del catálogo.** Hoy es una sola entrada,
   pero el manual describe cuatro máquinas distintas según excéntrico y cóncavo. Lo más
   probable es que corresponda a "excéntrico largo, cóncavo Medium Coarse", pero es una
   decisión de Marcelo.
3. **Digitalizar las curvas de producto** con cuidado antes de cargarlas.
4. **Anotar la limitación** de la curva normalizada única en `PENDIENTES_PRECISION.md`.
