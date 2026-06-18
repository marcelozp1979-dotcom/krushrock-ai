# KrushRock — Simulation & Equipment Advisory Platform

## ¿Qué es KrushRock?

KrushRock es un software de simulación de circuitos de chancado y zarandeo que ayuda a empresas a determinar qué equipos usar, qué producción esperar y en cuánto tiempo, dado un material de entrada y un producto deseado.

Es comparable a AggFlow, pero orientado al cliente final: el usuario no necesita ser ingeniero de procesos para usarlo. El sistema guía la simulación, recomienda equipos y genera reportes profesionales listos para postular a licitaciones mineras o presentar a clientes.

**Modelo de negocio:** Licencia SaaS (pago mensual/anual por empresa o usuario).

---

## Usuarios objetivo

1. **Empresas contratistas de chancado** — necesitan definir equipos y estimar producción para postular a licitaciones mineras de producción de áridos.
2. **Productores de áridos** — quieren saber qué producción esperar con determinados equipos, o qué equipos necesitan para un producto específico.
3. **Pequeña, mediana y gran minería** — evalúan implementación de plantas móviles o fijas de chancado y selección.

**Caso de uso principal:** Un cliente tiene un proyecto que requiere X m³ de material bajo 2" y sobre 1¾", con roca tipo meta andecita. KrushRock simula el circuito, recomienda chancador y zaranda, calcula TPH, tiempo de producción y genera un reporte para la licitación.

---

## Stack tecnológico

- **Backend:** Python con FastAPI
- **Frontend:** React (JavaScript/JSX)
- **Base de datos:** PostgreSQL (objetivo) — debe guardar clientes, simulaciones y resultados para alimentar mejoras futuras del motor de simulación
- **Generación de reportes:** Python (krushrock_pdf.py)
- **IA:** Integración progresiva para mejorar precisión de recomendaciones con datos históricos reales

**Estructura del backend:**
```
app/
  routers/    — endpoints de la API
  models/     — modelos de datos
  services/   — lógica de negocio y cálculos
  core/       — configuración y utilidades
```

---

## Funcionalidades actuales (parcialmente implementadas)

- [x] Ingreso de tipo de roca y dureza
- [x] Definición de granulometría de entrada y producto deseado
- [x] Cálculo de tonelaje por hora (TPH) y tiempo de producción
- [ ] Selección y comparación de equipos (chancadores, zarandas)
- [ ] Generación de reportes PDF profesionales para licitaciones
- [ ] Curvas granulométricas y diagramas de flujo del circuito
- [ ] Sistema de usuarios, login y roles
- [ ] Base de datos de clientes y simulaciones guardadas
- [ ] Cálculo de costos operacionales
- [ ] Integración con IA para recomendaciones mejoradas

---

## Prioridades de desarrollo

### Prioridad 1 — Motor de simulación preciso
Los cálculos deben ser correctos antes que todo lo demás. Un error de simulación puede hacer que un cliente pierda una licitación. Siempre validar fórmulas contra datos reales de equipos fabricantes (Sandvik, Metso, McCloskey, Terex Finlay).

### Prioridad 2 — Base de datos de clientes y simulaciones
Cada simulación debe quedar guardada asociada a un cliente. Esto permite:
- Historial de proyectos por cliente
- Mejora progresiva del motor con datos reales
- Trazabilidad para auditorías o licitaciones

### Prioridad 3 — Interfaz profesional orientada al cliente
El usuario puede no ser técnico. La interfaz debe guiar paso a paso, usar lenguaje claro, mostrar resultados visualmente (gráficos, diagramas de flujo del circuito) y generar reportes listos para presentar.

### Prioridad 4 — Reportes PDF para licitaciones
El reporte debe incluir: resumen del proyecto, material de entrada, producto requerido, equipos recomendados, TPH, tiempo estimado, diagrama del circuito y firma/logo del cliente.

### Prioridad 5 — Completitud funcional
Agregar progresivamente: más equipos en la base de datos, costos operacionales, comparación de alternativas, y módulo de IA para recomendaciones basadas en datos históricos.

---

## Convenciones de código

### General
- Comentarios en **español** (el dominio del negocio es minero/chileno)
- Variables y funciones en **inglés** (convención técnica universal)
- Cada función debe hacer una sola cosa y tener nombre descriptivo
- No dejar código comentado sin explicación de por qué está ahí

### Python (Backend)
- Usar type hints en todas las funciones
- Validación de inputs con Pydantic
- Manejo explícito de errores con mensajes claros para el usuario
- Los cálculos de simulación van en `app/services/`, nunca en los routers
- Separar claramente: recepción de datos → validación → cálculo → respuesta

### React (Frontend)
- Componentes funcionales con hooks
- Un componente por archivo
- Props tipadas con PropTypes o TypeScript
- Estados de carga y error siempre visibles para el usuario
- Formularios con validación antes de enviar al backend

### Base de datos
- Migraciones versionadas (nunca modificar tablas directamente en producción)
- Toda simulación guardada debe tener: fecha, cliente, inputs completos, outputs completos
- Los datos de equipos (fabricante, modelo, capacidades) son datos de referencia — tabla separada y mantenida

---

## Dominio técnico — Conceptos clave

Estos términos deben usarse correctamente en el código, comentarios y la interfaz:

- **TPH** — Toneladas por hora de producción
- **CSS** — Closed Side Setting (apertura del chancador en lado cerrado)
- **ROM** — Run of Mine (material directo de tronadura sin procesar)
- **Circuito cerrado** — el oversize de la zaranda recircula al chancador
- **Circuito abierto** — el material pasa una sola vez
- **Deck** — piso/nivel de una zaranda (1 deck, 2 deck)
- **Oversize / Undersize** — material sobre o bajo la malla de la zaranda
- **Work Index (Bond)** — índice de dureza de la roca para cálculos de energía
- **Granulometría** — distribución de tamaños de partículas del material
- **Factor de esponjamiento** — diferencia entre toneladas y metros cúbicos según densidad

---

## Lo que Claude NO debe hacer en este proyecto

- No simplificar los cálculos de simulación para que "funcione rápido" — la precisión es crítica
- No mezclar lógica de negocio (cálculos) con lógica de presentación (UI)
- No crear endpoints sin validación de inputs
- No guardar datos sensibles de clientes sin encriptación adecuada
- No inventar datos de equipos — solo usar especificaciones reales de fabricantes
- No hacer cambios visuales grandes sin mantener la experiencia guiada paso a paso

---

## Estado actual del proyecto

- **Nombre anterior del proyecto:** KRUSHROCK (renombrado a KrushRock)
- **Etapa:** MVP funcional parcial — motor de cálculo básico operativo, interfaz en desarrollo
- **Desarrollador principal:** Marcelo (usuario cmc) — nivel técnico en aprendizaje, asistido por Claude Code
- **Entorno:** Windows, VS Code, Claude Code
- **Próximo hito:** Completar base de datos de clientes + simulaciones + reporte PDF básico para licitación

---

## Cómo trabajar en este proyecto

Cuando se pida agregar una funcionalidad nueva:
1. Primero entender bien el requerimiento en términos del negocio minero
2. Diseñar la estructura de datos antes de escribir código
3. Implementar en el backend (FastAPI) con validación completa
4. Conectar con el frontend (React) con estados de carga y error
5. Verificar que los cálculos son correctos con casos de prueba reales
6. Documentar cualquier fórmula o lógica no obvia con comentarios en español

---

## REGLAS DEL MOTOR DE SIMULACIÓN (obligatorias, no negociables)

### FASE A IMPLEMENTADA: Motor basado en curvas granulométricas completas

1. **Arquitectura de corrientes (Streams):**
   - Toda corriente = `Stream(tph, curve_dict)` donde curve_dict es {tamaño_mm: % pasante acumulado}
   - Vive en `app/services/granulometry.py`
   - PROHIBIDO propagar escalares (P80) entre equipos; siempre propagar curvas completas
   - P80, P50, etc. se CALCULAN desde la curva, nunca son entrada
   - Las curvas son monótonas: % pasante crece con tamaño

2. **Equipos transforman corrientes:**
   - Chancadores (`app/services/equipment_models.crusher`): reciben Stream, devuelven Stream con curva de producto
   - Harneros (`app/services/equipment_models.screen`): reciben Stream, devuelven (Stream undersize, Stream oversize)
   - Cada modelo de equipo trae su curva normalizada (d/CSS → % pasante) en `product_curve`

3. **Balance de masas exacto:**
   - `entrada.tph = salida1.tph + salida2.tph` (para bifurcaciones)
   - Para cada tamaño: `entrada.mass_at(size) = Σ salida.mass_at(size)`
   - El test `tests/test_validation_aggflow.py` verifica esto en cada cambio

4. **Curvas normalizadas por equipo:**
   - Viven en `app/services/equipment_models.py` como constantes (ej. `CONE_PRODUCT_NORMALIZED`)
   - Formato: {d/CSS: % pasante} — **d** es tamaño, **CSS** es la apertura
   - Calibradas contra reportes reales (Finlay C-1540RS, Metso LT120, etc.)
   - Nunca hardcodear valores de producto: usar base de datos de modelos

5. **Formula de Bond en µm (no mm):**
   - E = 10 × Wi × (1/√P80_µm - 1/√F80_µm) donde P80, F80 en micrones
   - 1 mm = 1000 µm
   - Vive en `app/services/simulation_engine.py` (durante Fase C)

6. **Validación automática:**
   - TODO cambio al motor debe pasar: `pytest tests/test_validation_aggflow.py -v`
   - Casos validados: Finlay J-1280 → C-1540RS, Metso LT120 (Caso 1 y 2 AggFlow)
   - Tolerancias: P80 ±10%, curvas ±5 puntos, balance ±0.1 tph

7. **Motor único en backend:**
   - El frontend (React) SOLO llama a la API y grafica
   - No duplicar cálculos en JSX — eliminar cualquier motor duplicado
   - API retorna objetos Stream serializados + tabla de tamaños para gráfica

8. **Archivo de referencia:**
   - `motor_curvas_prototipo.py` (raíz) es la versión validada original
   - Ante dudas sobre comportamiento esperado, comparar contra este archivo
   - Fue la prueba de concepto que validó la arquitectura

### Lo que se implementó en Fase A/B:
- ✅ `app/services/granulometry.py`: clase Stream, interpolación log, operaciones de curva
- ✅ `app/services/equipment_models.py`: crusher(), screen() con curvas normalizadas
- ✅ `casos_validacion_aggflow.json`: dos casos AggFlow reales (Caso 1, Caso 2)
- ✅ `tests/test_validation_aggflow.py`: 5 tests automáticos (todos pasando)

### Próxima Fase (C):
- Reescribir `app/services/simulation_engine.py` para usar la API de Stream
- Representar circuitos como grafos dirigidos (no lista lineal)
- Cargar curvas normalizadas de base de datos de equipos
- Eliminar motor duplicado del frontend

---

## INSTRUCCIÓN RESUMIDA PARA FUTUROS CAMBIOS

"El motor vive en `app/services/`. Toda corriente es Stream (tph + curva). Prohibido P80 escalares. Cada cambio pasa `pytest tests/ -v`. Balance de masas exacto. Valores contra AggFlow."

---

## Estado actual del proyecto

- **Nombre anterior del proyecto:** KRUSHROCK (renombrado a KrushRock)
- **Etapa:** Fase A/B completadas — motor de curvas validado contra AggFlow
- **Desarrollador principal:** Marcelo (usuario cmc) — nivel técnico en aprendizaje, asistido por Claude Code
- **Entorno:** Windows, VS Code, Claude Code
- **Próximo hito:** Fase C — Reescribir simulation_engine.py con nueva arquitectura

---

## Cómo trabajar en este proyecto

Cuando se pida agregar una funcionalidad nueva:
1. Primero entender bien el requerimiento en términos del negocio minero
2. Diseñar la estructura de datos antes de escribir código
3. Implementar en el backend (FastAPI) con validación completa
4. Conectar con el frontend (React) con estados de carga y error
5. Verificar que los cálculos son correctos con casos de prueba reales
6. Documentar cualquier fórmula o lógica no obvia con comentarios en español

---

## ANTIGUAS REGLAS (conservadas para referencia, ahora parte de la arquitectura):

1. El motor de simulación vive ÚNICAMENTE en `app/services/`. El frontend
   (archivos .jsx) NO debe contener fórmulas de cálculo: solo llama a la API
   y muestra resultados. Si encuentras cálculos duplicados en el frontend,
   elimínalos y conecta con el backend.

2. Cada equipo (chancador, harnero) recibe Streams y devuelve Streams.
   El balance de masas debe cerrar siempre.

3. Las curvas de producto de los chancadores son curvas normalizadas
   que viven en la base de datos de equipos, no escritas fijas en el código.

4. Todo cambio al motor de cálculo debe pasar las pruebas de
   `tests/test_validation_aggflow.py` antes de darse por terminado.

5. El archivo `motor_curvas_prototipo.py` es la referencia de implementación validada.

6. Idioma: responde y comenta el código en español.