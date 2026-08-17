# Datos extraídos de manuales oficiales — Conos Finlay

Datos de manuales de operación Terex Finlay guardados en `manuales/Conos/`.
Los PDF no se suben al repositorio (DECISIONS.md D-16); este documento sí.

**Advertencia común a todos los manuales:** las capacidades son aproximadas, medidas con caliza
dura de cantera limpia y seca, 1.600 kg/m³, densidad específica 2,6–2,8. Alimentación húmeda o
pegajosa reduce la capacidad. **Las capacidades son para circuito abierto.** El tamaño máximo de
alimentación baja al 80% cuando se chanca grava de río o material redondeado.

---

## Resumen: el catálogo está mal en los tres conos

| Modelo | Campo | Catálogo hoy | Manual oficial |
|---|---|---|---|
| **C-1540** | capacidad | 150–300 tph | **125–220 tph** |
| | CSS | 10–44 mm | **19–32 mm** |
| | alimentación máx. | 215 mm | **160 mm** (cóncavo MC) |
| **C-1545** | capacidad | 160–320 tph | **175–240 tph** (MC, carrera larga) |
| | CSS | 10–48 mm | **18–45 mm** (MC, carrera larga) |
| | alimentación máx. | 240 mm | **180 mm** (cóncavo MC) |
| **C-1550+** | capacidad | 180–370 tph | **250–589 tph** |
| | CSS | 10–50 mm | **22–50 mm** |
| | alimentación máx. | 280 mm | **220 mm** (cóncavo MC) |

En el C-1540 y el C-1545 el software **sobreestima** la máquina. En el C-1550+ la
**subestima a menos de la mitad**. Los tres errores empujan la recomendación hacia el equipo
equivocado.

---

## C-1540

**Fuente:** Operations Manual Rev 2.7, 16-04-2025, Tablas 3.3 y 3.4, páginas 3-13 y 3-14.

Detalle completo en `docs/DATOS_MANUAL_C-1540.md`. Resumen de la configuración adoptada
(excéntrico largo, cóncavo Medium Coarse — DECISIONS.md D-15):

| CSS (mm) | tph métricas |
|---|---|
| 19 | 125 – 145 |
| 22 | 140 – 180 |
| 25 | 145 – 195 |
| 28 | 155 – 205 |
| 32 | 160 – 220 |

Alimentación máxima según cóncavo: MC 160 mm · C 175 mm · XC 195 mm.

---

## C-1545 (y C-1545P)

**Fuente:** Manual de funcionamiento Rev 5.1, 05/03/2024, Tablas 3.4 y 3.5, páginas 3-22 y 3-23.

**CSS máximo de la máquina: 45 mm.** Potencia: carrera larga 225 kW (300 CV), carrera corta
185 kW (245 CV).

A diferencia del C-1540, el manual **no entrega tabla tph vs CSS**: da un rango global de
tonelaje por combinación de cámara y carrera.

### Carrera corta (Tabla 3.4)

| Cámara | Alimentación máx. | CSS mín. recomendado | CSS máx. | tph típicas |
|---|---|---|---|---|
| Extragrueso (XC) | 210 mm | 20 mm | 45 mm | 150 – 220 * |
| Medio-grueso (MC) | 180 mm | 16 mm | 45 mm | 140 – 210 |
| Finos | 110 mm | 12 mm | 45 mm | 110 – 180 * |

### Carrera larga (Tabla 3.5)

| Cámara | Alimentación máx. | CSS mín. recomendado | CSS máx. | tph típicas |
|---|---|---|---|---|
| Extragrueso (XC) | 210 mm | 25 mm | 45 mm | 180 – 250 * |
| Medio-grueso (MC) | 180 mm | 18 mm | 45 mm | 175 – 240 |
| Finos | 110 mm | 14 mm | 45 mm | 130 – 200 * |

\* El manual marca estos valores como **"Cifras provisionales"**. Usarlos con esa salvedad
declarada; no presentarlos como definitivos en una propuesta.

---

## C-1550+

**Fuente:** Manual de funcionamiento Rev 1.4, 15/12/2023, Tablas 3.4 y 3.5, páginas 3-16 y 3-17.

**CSS máximo: 50 mm.** Potencia: excéntrica larga 300 kW (400 CV), corta 225 kW (300 CV).
Velocidad del eje intermedio: 1.138–1.500 rpm.

Alimentación máxima por cóncavo:

| Tipo de concavidad | Alimentación máxima | CSS mínimo |
|---|---|---|
| Arena | 63 mm | según aplicación * |
| Grosor intermedio (MC) | 220 mm | según aplicación * |
| Extragrueso (XC) | 260 mm | según aplicación * |

\* El manual **no publica el CSS mínimo**: dice que depende del material y hay que consultar al
distribuidor Terex. **No inventar un valor.** Usar como mínimo práctico el CSS más bajo de la
tabla de producción (22 mm).

### Producción estimada — excéntrica larga, cóncavo MC (Tabla 3.5)

| CSS (mm) | tph métricas | | CSS (mm) | tph métricas |
|---|---|---|---|---|
| 22 | 250 – 303 | | 38 | 375 – 469 |
| 24 | 260 – 335 | | 40 | 400 – 489 |
| 26 | 290 – 352 | | 42 | 420 – 509 |
| 28 | 300 – 365 | | 44 | 440 – 529 |
| 30 | 315 – 384 | | 46 | 460 – 549 |
| 32 | 330 – 410 | | 48 | 480 – 569 |
| 34 | 345 – 430 | | 50 | 500 – 589 |
| 36 | 360 – 449 | | | |

Es la tabla más completa de los tres manuales: 15 puntos de CSS.

---

## Curvas de producto

Los tres manuales traen la granulometría del producto como **gráfico**, no como tabla.
Requieren digitalización visual, una curva por cada CSS. Pendiente en T-11.

---

## C-1554

**No hay manual en la carpeta.** La entrada del catálogo (CSS 8–50 mm, 200–400 tph,
alimentación 280 mm) no tiene fuente. Marcar como no verificada hasta conseguir el manual.
