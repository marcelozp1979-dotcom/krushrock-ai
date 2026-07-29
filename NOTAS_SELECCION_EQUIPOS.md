# Notas de diseño — Selección de equipos y maximización de producción

Recopilación en curso (28-jul-2026). NO implementar todavía; primero cerrar la lista completa con Marcelo.

## Contexto: qué NO hace hoy el sistema

- El ranking elige por **menor cantidad de equipos** entre las configuraciones que cumplen el plazo; desempata por menor capacidad instalada. No hay ningún criterio de eficiencia de producción.
- El CSS **no se optimiza**: se deriva del tamaño de producto pedido y queda fijo. No existe búsqueda de la combinación de CSS que maximiza tph.
- Conteo de flota defectuoso: usa `n_units × nº de etapas`, por lo que "2 mandíbulas solas" (=2) le gana a "1 mandíbula + 1 cono + 1 seleccionadora" (=3).

## Requerimiento 1 — Decisión primaria del software

La decisión más importante, y la primera: **qué equipos se necesitan para generar uno o varios productos**, qué nivel de producción esperar, y poder **evaluar alternativas** de otros equipos que también generen el producto pedido. La eficiencia relevante aquí es de producción (m³ / tph), no de costo de combustible.

## Requerimiento 2 — Optimización conjunta de CSS

El software debe determinar la **combinación óptima de CSS de todos los chancadores del tren** para maximizar los tph de los productos pedidos.

Razonamiento del caso: si se cierra el CSS de la mandíbula a su mínimo, se fuerza la razón de reducción al máximo y la producción de la mandíbula cae a su mínimo. El cono siguiente trabaja con una razón de reducción menor (holgado), pero la mandíbula ya creó el cuello de botella. El óptimo no es CSS mínimo por etapa, sino el **conjunto** que maximiza el tph del sistema completo.

Implica: búsqueda sobre el espacio de CSS (no un valor derivado), evaluando el tren completo, no cada equipo por separado.

## Requerimiento 3 — Nivel de llenado del cono (dato verificado)

Marcelo planteó ~95%. **El valor correcto de la industria es ~80%**, no 95%:

- **Choke feed = el cono debe recibir alrededor del 80% de su alimentación máxima**, con la cámara de trituración llena.
- En la práctica, muchos operadores trabajan al **65%**, que es su zona de comodidad; se considera subóptimo.
- Definición física de choke feed: material 360° alrededor de la cabeza de trituración y aproximadamente 6" (≈150 mm) sobre la tuerca del manto; el material debe quedar justo por sobre el spider frame.
- Beneficio: cámara llena maximiza el throughput y promueve trituración interpartícula (mejor reducción y mejor cubicidad del producto).

### Criterio adicional encontrado (relevante para elegir modelo de cono)

Alimentación **bien graduada** para un cono:

- 90–100% pasante de la **apertura de alimentación en lado cerrado**
- 40–60% pasante del **punto medio de la cámara** en lado cerrado
- 0–10% pasante del **CSS**

Este último criterio permite descartar modelos de cono cuya cámara no calza con la curva que entrega la etapa anterior — es un filtro de selección real, no una aproximación.

Fuentes:
- https://www.911metallurgist.com/blog/choke-feed-a-cone-crusher-level-sensor/
- https://www.pitandquarry.com/tips-to-maximize-crushing-efficiency/
- https://pilotcrushtec.com/the-importance-of-choke-feeding-a-cone-crusher/
- https://www.terex.com/cedarapids/about/news---features/news/news-details/better-product-cubicity

## Requerimiento 4 — (pendiente, Marcelo continúa)
