# KrushRock — Diagnóstico del Motor de Cálculo y Plan de Corrección

Fecha: 09/06/2026 · Validado contra reportes AggFlow Proyecto 176849 (AMECO)

## 1. Causa raíz: el software no calcula curvas granulométricas

El motor actual (tanto `app/services/simulation_engine.py` como la función `simulate()` de `krushrock-ai.jsx`) **nunca transforma una curva granulométrica a través de los equipos**. Solo propaga un número escalar (el P80) de etapa en etapa, y al final genera una curva "decorativa" ajustando una distribución Rosin-Rammler al P80 final. La forma de esa curva es una suposición matemática, no el resultado de simular el chancador ni el harnero. Por eso las curvas nunca se parecen a la realidad: no se están calculando.

Esto no es un bug puntual: es una limitación de arquitectura. AggFlow funciona al revés — cada corriente lleva su curva completa, y cada equipo la transforma.

## 2. Errores concretos encontrados (en orden de impacto)

1. **Factor P80/CSS del cono invertido respecto a la realidad.** El motor usa `P80 = CSS × 1.40–1.90` (función `coneFactor`). Los datos reales de AggFlow para el Finlay C-1540RS muestran `P80 = CSS × 0.91` (CSS 20 → P80 18.11). Con perfil M y granito, el motor actual predice P80 = 33.2 mm donde AggFlow da 18.11 mm: **sobreestimación del 83% en la variable central del software.** (Nota: la relación P80/CSS cercana a 0.9–1.1 es típica de conos de agregados con cámara fina; los factores 1.4–1.9 corresponden a otra definición de abertura o a conos mineros primarios.)
2. **No hay balance de masas.** El tph entra y "sale" igual en todos los nodos; el harnero no divide la corriente en undersize/oversize con sus curvas respectivas. Sin esto es imposible simular un circuito con clasificación (Caso 2 de AggFlow).
3. **El harnero no usa la curva de alimentación.** La fracción que pasa se estima con fórmulas arbitrarias (`oversize = tph × (1-ef) × 0.40` en el backend) en vez de leer cuánto material de la alimentación está realmente bajo la abertura.
4. **Dos motores duplicados y divergentes.** El backend Python y el frontend JSX tienen motores distintos con fórmulas distintas. Ejemplo: el frontend corrige Bond a µm (`toUm`), pero el backend (`simulation_engine.py` línea 97) sigue calculando Bond **en mm, lo que infla la energía ×31.6**. Cualquier corrección hay que hacerla dos veces y se desincronizan.
5. **CSS calculado al revés.** El backend usa `css = p80_target × 0.14` para conos: para un objetivo de 18 mm daría CSS 2.5 mm (imposible, se satura en el mínimo del rango). El CSS debe ser un dato de entrada del usuario (como en AggFlow) o derivarse de la relación real P80/CSS.

## 3. Solución validada (prototipo `motor_curvas.py`)

Se construyó un prototipo de 150 líneas con la arquitectura correcta y se validó contra los dos casos AggFlow:

- **Corriente** = (tph, curva % acumulado pasante sobre serie de tamices). Toda interpolación en escala log-tamaño.
- **Chancador** = curva de producto *normalizada* (% pasante vs d/CSS), escalada por el CSS. Es el mismo enfoque de AggFlow/fabricantes: por eso en sus reportes el cono CSS 20 produce la misma curva con alimentaciones distintas.
- **Harnero** = partición de la corriente usando la curva de alimentación real + eficiencia, con balance de masas por tamaño (genera undersize y oversize, cada uno con su curva).

Resultados de la validación (Caso 2, el más exigente):

| Variable | AggFlow | Prototipo | Error |
|---|---|---|---|
| % bajo 38 mm tras mandíbula CSS 90 | ~35.5% | 36.0% | +0.5 pts |
| Finos del harnero (tph) | 59 | 60 | +1.7% |
| Grueso al cono (tph) | 116 | 115 | -0.9% |
| P80 finos | 28.98 | 27.8 | -4% |
| Curva de finos (14 puntos) | — | — | err. medio 2.5 pts, máx 4.5 |
| P80 producto cono | 18.11 | 17.92 | -1% |
| Balance de masas | cierra | cierra exacto | ✓ |

Importante para ser honestos con la validación: la curva normalizada del **cono** se calibró con el propio dato AggFlow (por eso calza exacto); pero la curva de **mandíbula** salió de literatura genérica y la partición del **harnero** es predicción pura — y ambas calzaron dentro de ±4.5 puntos. Eso confirma que la arquitectura es la correcta.

## 4. Plan de implementación (especificación para Claude Code)

**Fase A — Motor único de curvas (prioridad máxima)**
1. Crear `app/services/granulometry.py`: clase `Stream` (tph + curva), interpolación log, P-XX, suma de corrientes.
2. Crear `app/services/equipment_models.py`: `crusher(stream, css, norm_curve)` y `screen(stream, aperture, efficiency)` según el prototipo. Las curvas normalizadas por modelo de equipo viven en la base de datos de equipos (campo `product_gradation`: lista de pares d/CSS → % pasante), no hardcodeadas.
3. Reescribir `simulation_engine.py` para propagar objetos `Stream` por el grafo de nodos (no una lista ordenada por tipo: el Caso 2 demuestra que el flujo puede bifurcarse). Representar el circuito como grafo dirigido: cada nodo tiene entradas/salidas conectadas.
4. **Eliminar el motor duplicado del frontend**: el JSX solo llama a la API y grafica. Una sola fuente de verdad.
5. Corregir Bond a µm en el backend (o tomar la versión del frontend).

**Fase B — Pruebas automáticas (antes de cualquier otra mejora)**
6. Crear `tests/test_validation_aggflow.py` usando `casos_validacion_aggflow.json`: balance de masas exacto, curvas dentro de ±5 puntos, P80 dentro de ±10%, invariantes (monotonía, producto más fino que alimentación). Correr con `pytest` en cada cambio.

**Fase C — Calibración por equipo**
7. Cargar curvas normalizadas reales por modelo (catálogos Finlay/Metso/Sandvik traen las "product gradation curves" por CSS). Donde no haya catálogo, calibrar con datos de planta del usuario (ahí entra tu `learning_engine.py` con propósito real).
8. Mejorar el harnero a curva de partición con near-size y humedad (el modelo Karra que ya tienes en el JSX es un buen punto de partida, pero aplicado a la curva real).

**Instrucción sugerida para CLAUDE.md del proyecto:** "El motor de simulación vive SOLO en app/services. Toda corriente se representa como Stream (tph + curva granulométrica completa). Prohibido propagar P80 escalares entre equipos. Todo cambio al motor debe pasar tests/test_validation_aggflow.py."

## 5. Qué conservar del código actual

El trabajo de UX, validación de unidades, base de rocas, OPEX, alertas de bottleneck y el ajuste Rosin-Rammler de la alimentación (fitRR) son buenos y se reutilizan. El fitRR pasa a usarse para convertir entradas parciales del usuario (solo F80, o F80+F50) en una curva de alimentación completa — que es justo lo que el nuevo motor necesita como entrada.
