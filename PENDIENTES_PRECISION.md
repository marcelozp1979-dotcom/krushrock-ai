# KrushRock — Pendientes de precisión ingenieril

Lista de mejoras para que el simulador sea más exacto y cubra más
situaciones reales. Orden sugerido de arriba hacia abajo (mayor impacto
primero). Un cambio por sesión, siempre validando contra los casos reales.

---

## 1. Seleccionadora con metodología VSMA (capacidad real)
Hoy la capacidad de la seleccionadora se calcula de forma simplificada
(80% del máximo del fabricante). La metodología VSMA es el estándar de la
industria: calcula la capacidad real según abertura de malla, número de
pisos (decks), humedad, forma del material, etc.
- Bloqueante: falta el dato propietario "Factor A" del VSMA Handbook.
- Solución posible: reverse-engineering desde reportes AggFlow reales
  (Marcelo los tiene).
- Impacto: alto. Es la mayor fuente de imprecisión actual.

## 2. Una curva de producto por modelo real de equipo
Traducción del problema técnico: hoy TODOS los conos comparten la misma
"huella" de cómo queda molido el material, y lo mismo todas las mandíbulas.
En la realidad, un cono Metso y uno Sandvik del mismo CSS entregan
granulometrías distintas. Hoy el simulador no distingue.
- Qué falta: cargar una curva granulométrica propia por cada modelo del
  catálogo, calibrada con datos del fabricante o reportes reales.
- Impacto: alto para productos finos; medio para gruesos.

## 3. Recirculación real (circuito cerrado)
Hoy, cuando el sobre-tamaño de la seleccionadora debería volver al
chancador (circuito cerrado), el motor no lo recircula de verdad; lo trata
como descarte. Esto subestima la producción en circuitos cerrados.
- Qué falta: implementar el lazo de recirculación con balance de masa
  hasta estabilizar (carga circulante real).
- Impacto: alto en plantas que trabajan en circuito cerrado.

## 4. Fórmula de Bond para consumo energético / potencia
Verificar que la fórmula de Bond esté usándose en las unidades correctas
(micrones, no milímetros) y conectada al cálculo, no solo declarada.
Permite estimar potencia requerida y descartar equipos subdimensionados.
- Impacto: medio. Suma seriedad ingenieril y evita recomendar equipos que
  no tienen potencia para la roca.

## 5. Humedad y pegajosidad del material
El material húmedo/arcilloso baja la eficiencia de la seleccionadora y
puede tapar mallas. Hoy no se modela. Afecta directamente la capacidad
VSMA (punto 1).
- Impacto: medio. Relevante para materiales reales de faena.

## 6. Forma de partícula y densidad aparente
La densidad real (esponjamiento) afecta la conversión toneladas → m³ que
el cliente usa para licitar. Verificar que esté bien aplicada en todos los
cálculos de volumen.
- Impacto: medio. Errores aquí distorsionan el "cuánto material" del cliente.

## 7. Ampliar catálogo de casos reales de validación
Hoy hay 1 caso real (ROM Botadero Argentina). Con 5–8 casos que cubran
distintas rocas, circuitos y productos, el ±15% se vuelve una garantía
seria en vez de una coincidencia.
- Impacto: alto como red de seguridad; no cambia el motor pero protege
  cada cambio futuro.

---

## Regla al implementar cualquiera de estos
Cada punto se valida contra los casos reales dentro de ±15%. Si un cambio
aleja un caso ya validado, es un error, no una mejora. Los valores reales
son la fuente de verdad, nunca se ajustan para que calce el código.
