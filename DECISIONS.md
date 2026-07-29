# DECISIONS.md — Decisiones firmes

Decisiones de diseño ya tomadas. **No se vuelven a discutir** salvo que Marcelo las cambie
explícitamente. El agente las lee antes de empezar y no propone alternativas a lo aquí resuelto.

Formato: qué se decidió · por qué · qué se descartó.

---

## D-01 · 28-jul-2026 · Flota propia y catálogo, ambos casos
El cliente puede indicar qué equipos ya posee; el software prioriza usarlos y, si no alcanzan,
recomienda qué agregar.
**Por qué:** un contratista va a licitación con máquinas propias; una propuesta que ignore eso
es inejecutable.
**Descartado:** recomendar siempre desde el catálogo ignorando la flota del cliente.
*Decidió: Marcelo.*

---

## D-02 · 28-jul-2026 · El cliente puede cargar equipos fuera del catálogo
Se aceptan equipos del usuario con sus especificaciones, marcados como **"dato del usuario —
no verificado"** en pantalla y en el PDF. Nunca se mezclan con el catálogo oficial.
**Por qué:** amplía el uso sin ensuciar la base de datos verificada ni comprometer la
credibilidad del reporte.
**Descartado:** aceptar equipos del usuario sin distinción de origen.
*Decidió: Marcelo.*

---

## D-03 · 28-jul-2026 · Multiproducto es esencial
La versión comercial debe resolver varios productos simultáneos en un mismo circuito.
**Por qué:** una licitación de áridos casi siempre pide varios productos a la vez.
**Descartado:** un producto por simulación en la v1.
*Decidió: Marcelo.*

---

## D-04 · 28-jul-2026 · Choke feed del cono: 80%, no 95%
Un cono debe trabajar cerca del 80% de su alimentación máxima con la cámara llena.
**Por qué:** es el valor de la industria. La práctica común de operar al 65% se considera
subóptima, no correcta.
**Descartado:** el 95% que se había supuesto inicialmente.
*Fuentes:* 911Metallurgist, Pit&Quarry, Pilot Crushtec, Terex Cedarapids.

---

## D-05 · 28-jul-2026 · Criterio de calce cámara-alimentación para conos
Alimentación bien graduada: 90–100% pasante de la boca, 40–60% a mitad de cámara,
0–10% del CSS.
**Por qué:** permite descartar modelos de cono cuya cámara no calza con lo que entrega la etapa
anterior, con un criterio real de fabricante en vez de una aproximación.
*Fuente:* Pit&Quarry, "Tips to maximize crushing efficiency".

---

## D-06 · 28-jul-2026 · La optimización es sobre el tren completo, no equipo por equipo
El CSS óptimo se busca como **combinación** de todas las etapas, no cerrando cada chancador
al mínimo.
**Por qué:** cerrar la mandíbula fuerza su razón de reducción al máximo, hunde su producción y
crea el cuello de botella aunque el cono siguiente quede holgado.
**Descartado:** optimizar cada equipo por separado.
*Decidió: Marcelo.*

---

## D-07 · 28-jul-2026 · La segunda alternativa usa un piso relativo, no absoluto
La "Opción B — menor flota" solo se ofrece si produce al menos un porcentaje definido de la
Opción A. Nunca un umbral fijo en tph.
**Por qué:** un valor absoluto queda obsoleto según el tamaño del proyecto.
**Además:** si la Opción B no existe, se dice explícitamente en vez de mostrar una peor.
*Decidió: Marcelo.*

---

## D-08 · 28-jul-2026 · Coherencia del catálogo antes que optimización
La Etapa 1 (verificar que a mayor CSS haya mayor tph, en todo el catálogo) se hace antes de
la Etapa 3 (optimización de CSS).
**Por qué:** optimizar sobre datos incoherentes produce óptimos falsos que se ven convincentes.
*Decidió: Marcelo, sobre recomendación.*

---

## D-09 · 28-jul-2026 · Trabajo nocturno solo en rama, nunca en main
El trabajo autónomo ocurre en `nocturno/AAAA-MM-DD`. Marcelo revisa e integra en la mañana.
**Por qué:** permite avanzar sin supervisión sin arriesgar la rama principal.
*Decidió: Marcelo.*

---

## D-10 · 28-jul-2026 · Los datos de equipos no se completan por búsqueda web automática
Verificado que los folletos públicos de Terex Finlay **no contienen** tablas de capacidad
tph vs CSS. Los datos de curvas solo se cargan desde manuales que Marcelo aporte.
**Por qué:** un agente sin supervisión rellenaría con valores plausibles pero falsos, que es
exactamente lo que CLAUDE.md prohíbe.
**Descartado:** dejar al agente buscando manuales de noche.

---

## D-11 · anterior · No extraer datos desde AggFlow
AggFlow se usa solo como referencia de validación, nunca como fuente del catálogo.
**Por qué:** licencia COMECO.
*Decidió: Marcelo.*
