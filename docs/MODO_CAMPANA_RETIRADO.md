# Modo Campaña — retirado en T-34 (13-oct-2026)

## Qué era

El modo Campaña aparecía como tercera opción en el selector de modos de la pantalla de
resultados (modo avanzado), junto a "Producción" y "Plazo". Su propósito era optimizar
la secuencia de producción cuando el cliente necesita varios productos distintos en distintos
volúmenes: calcular cuántas horas dedicar a cada producto para minimizar el plazo total.

## Por qué se retiró (D-29)

El motor local de campaña fue eliminado en T-20 porque usaba un factor P80/CSS erróneo
(×1,4–1,9 en vez de ×0,98 del manual Terex Finlay). Desde entonces el selector mostraba
un aviso "próximamente" sin funcionalidad real. Mostrar una opción sin función confunde
al usuario del piloto — se retira el selector hasta que exista la implementación correcta.

## Bloqueo de referencia

**B-campana01** — implementar modo Campaña en backend con motor de curvas normalizadas
(API de Stream). Requiere:
1. Endpoint `POST /simulations/campaign` que reciba lista de productos + volúmenes y
   devuelva la secuencia óptima (horas por producto, CSS recomendado, tph por fase).
2. Motor en `app/services/simulation_engine.py` que itere sobre los productos usando
   la curva de producto del circuito en cada fase.
3. Panel en `Resultados.jsx` (modo avanzado, tab resultados) que muestre el plan de
   campaña como tabla: producto, horas, tph, volumen acumulado.

## Cómo reponerla

1. Implementar el backend (ver bloqueo B-campana01 arriba).
2. Agregar de vuelta la opción al selector en `Resultados.jsx`:
   ```js
   { v: "campana", l: "Campaña", s: "Optimizar por producto" },
   ```
3. Reemplazar el bloque "próximamente" por el panel real del plan de campaña.

## Archivos afectados por T-34

- `krushrock-app/src/components/Resultados.jsx`: eliminadas línea del selector y bloque
  "próximamente" (17 líneas).
- `DECISIONS.md`: D-29 documenta la decisión.
- `TASKS.md`: T-34 marcada HECHA.
