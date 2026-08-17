# Método de cálculo de capacidad de seleccionadoras

**Fuente:** Larry Olsen y Bob Carnes, *Technical Paper T-JCI-201 — Screen Capacity Calculation*,
Astec / JCI. Versión pública de la metodología VSMA con seis factores adicionales.
https://www.911metallurgist.com/wp-content/uploads/2016/07/Screen-Capacity.pdf

Bibliografía citada en ese paper: *Facts and Figures* 2ª ed. (Kolberg-Pioneer, 2000),
*Pocket Reference Book* 13ª ed. (Cedarapids, 1993), *Vibrating Screen Theory and Selection*
(Allis-Chalmers).

---

## 1 · El problema de fondo

**La capacidad de una seleccionadora no es un dato del equipo.** No existe "el tph de la 684":
depende de la malla instalada, de la curva granulométrica de la alimentación y de la eficiencia
exigida. Por eso ningún manual Terex publica tph.

Los campos `cap_min_tph` y `cap_max_tph` de las seleccionadoras del catálogo no tienen fuente y
**deben eliminarse**, no completarse. La capacidad se calcula por piso, en cada simulación.

---

## 2 · La fórmula

Capacidad de un piso, en toneladas por hora:

```
tph_piso = área_piso_ft² × A
A = B × S × D × V × H × T × K × Y × P × O × W × F
```

Donde `A` es la capacidad por pie cuadrado y cada letra es un factor corrector.

### Factores clásicos

| Factor | Qué representa | De dónde sale |
|---|---|---|
| **B** | Capacidad básica por pie² según abertura de malla | Tabla del fabricante. Anclas del paper: malla 1" → **5,50** tph/ft²; malla ½" → **3,80** tph/ft². Rango del gráfico: 0 a 6,5 tph/ft² para aberturas de 1" a 15". |
| **S** | Inclinación del piso | 1,00 para pisos horizontales. Baja al aumentar la pendiente. |
| **D** | Posición del piso | 1,0 primer piso · 0,9 segundo · 0,8 tercero |
| **V** | Sobre-tamaño: % de alimentación mayor que la malla | 25% retenido → 1,00. Más retenido, menor factor. |
| **H** | Medio-tamaño: % menor a la mitad de la abertura | 40% → 1,00. Más finos, mayor factor. |
| **T** | Forma de la abertura | Cuadrada 1,00 · redonda 0,80 · ranurada según razón largo/ancho |
| **K** | Condición del material | Roca chancada seca 1,00 · húmeda o sucia, menor |
| **Y** | Riego con agua | 1,00 sin riego |
| **P** | Forma de la partícula (lajas) | 1,00 sin lajas; baja con % de partículas alargadas |
| **O** | Área abierta de la malla | 50% de área abierta → 1,00 |
| **W** | Densidad del material | 1.600 kg/m³ (100 lb/ft³) → 1,00 |
| **F** | Eficiencia exigida | 90% → 1,00 · 95% → 0,95 · 70% → 1,20 |

### Factores adicionales (los que marcan la diferencia)

```
A = B × S × D × V × H × T × K × Y × P × O × W × F × TYP × STR × TIM × RPM × NEA × BED
```

| Factor | Qué representa |
|---|---|
| **TYP** | Tipo de movimiento: circular, lineal u oval |
| **STR** | Longitud de carrera respecto a la abertura |
| **TIM** | Ángulo de sincronización (solo pisos horizontales; 1,0 en inclinados) |
| **RPM** | Velocidad de vibración respecto a la óptima para esa abertura |
| **NEA** | **Material de tamaño cercano** (±25% de la abertura). El más importante y el más ignorado. |
| **BED** | Espesor de la cama de material sobre el piso |

**Por qué importan:** en el ejemplo trabajado del paper, un piso inferior daba 476 tph con la
fórmula clásica y **215 tph** con los factores adicionales. Menos de la mitad. El causante fue
`NEA` = 0,59: exceso de material de tamaño cercano a la malla, situación habitual en circuito
cerrado — que es justamente el caso de KrushRock.

Espesor de cama:

```
DM_pulgadas = (TP × KD) / (5,0 × SP × WD)
```

TP = tph que salen por el extremo del piso · KD = densidad en ft³/ton (≈20 para roca)
SP = velocidad de transporte en ft/min · WD = ancho del piso en pies

---

## 3 · Qué se guarda por máquina y qué se calcula

**En el catálogo (dato de manual, fijo por modelo):**

- área de cribado por piso
- número de pisos
- velocidad de cribado (rpm) — ya extraída de los manuales Finlay
- longitud de carrera y ángulo de inclinación — **falta extraerlos de los manuales**
- tipo de movimiento (circular, lineal, oval)

**Calculado en cada simulación (no se guarda):**

- todos los factores B a BED, desde la curva de alimentación, la malla elegida y la eficiencia pedida
- la capacidad resultante por piso

---

## 4 · Cómo se valida

Contra los reportes AggFlow reales que tiene Marcelo: para un caso conocido, el tph por piso
calculado debe caer dentro de ±15% del reportado. AggFlow usa esta misma metodología, así que
es la comparación correcta.

Si no calza, el error está en los factores, no en el caso.

---

## 5 · Alcance recomendado por etapas

1. **Etapa 1 — factores clásicos.** Implementar B a F. Requiere solo datos que ya existen:
   área, pisos, malla y curva de alimentación. Ya mejora sobre el 80% fijo actual.
2. **Etapa 2 — NEA y BED.** Los dos que más cambian el resultado en circuito cerrado.
   NEA se calcula desde la curva; BED necesita ancho de piso y velocidad de transporte.
3. **Etapa 3 — TYP, STR, TIM, RPM.** Requiere extraer carrera, inclinación y tipo de movimiento
   de los manuales. Son ajustes finos comparados con los anteriores.

**Regla:** las curvas de los factores en el paper son gráficos. Cada valor que se digitalice se
carga con su precisión declarada. Los puntos anclados en texto —B = 5,50 para 1" y 3,80 para
½", D = 1,0/0,9/0,8, V = 1,00 al 25%, H = 1,00 al 40%, F = 1,00 al 90%— son exactos y sirven
para verificar la digitalización del resto.
