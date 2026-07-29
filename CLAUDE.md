# KrushRock — Simulation & Equipment Advisory Platform

## Qué es KrushRock

KrushRock simula circuitos de chancado y selección para determinar qué equipos usar, qué producción esperar y en cuánto tiempo, dado un material de entrada y un producto deseado. Es comparable a AggFlow pero orientado al cliente final: sin necesidad de conocimientos de ingeniería de procesos. El sistema guía la simulación, recomienda equipos y genera reportes listos para licitaciones mineras. **Modelo de negocio:** Licencia SaaS por empresa o usuario.

**Usuarios objetivo:** contratistas de chancado (licitaciones de áridos), productores de áridos (dimensionamiento de plantas), pequeña/mediana/gran minería (plantas móviles o fijas de chancado y selección).

---

## Stack y estructura

- **Backend:** Python con FastAPI
- **Frontend:** React (JavaScript/JSX)
- **Base de datos:** PostgreSQL — guarda clientes, simulaciones y resultados
- **Generación de reportes:** Python (krushrock_pdf.py)
- **IA:** Integración progresiva para recomendaciones con datos históricos

```
app/
  routers/    — endpoints de la API
  models/     — modelos de datos
  services/   — lógica de negocio y cálculos
  core/       — configuración y utilidades
```

---

## Reglas del motor de simulación (obligatorias, no negociables)

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

## Dominio técnico

Usar siempre **seleccionadora**, nunca "zaranda". Estos términos deben usarse correctamente en el código, comentarios y la interfaz:

- **TPH** — Toneladas por hora de producción
- **CSS** — Closed Side Setting (apertura del chancador en lado cerrado)
- **ROM** — Run of Mine (material directo de tronadura sin procesar)
- **Circuito cerrado** — el oversize de la seleccionadora recircula al chancador
- **Circuito abierto** — el material pasa una sola vez
- **Deck** — piso/nivel de una seleccionadora (1 deck, 2 deck)
- **Oversize / Undersize** — material sobre o bajo la malla de la seleccionadora
- **Work Index (Bond)** — índice de dureza de la roca para cálculos de energía
- **Granulometría** — distribución de tamaños de partículas del material
- **Factor de esponjamiento** — diferencia entre toneladas y metros cúbicos según densidad

---

## Reglas operativas (obligatorias)

1. Antes de dar por terminada una tarea: correr `pytest tests/ -v`. Si algo falla, no está terminada.
2. Al terminar: commit y push sin preguntar, salvo instrucción contraria.
3. Nunca decir "listo" sin haber corrido pytest y push realmente. Si pytest o git fallan, reportar el error real textual.
4. No tocar `app/services/granulometry.py` ni `app/services/equipment_models.py` sin permiso explícito; si una tarea lo requiere, avisar y esperar confirmación.
5. Todo cambio al motor o recommender debe seguir pasando `tests/casos_validacion_reales.json` dentro de ±15% de error. Esos valores son la fuente de verdad; nunca ajustar el caso para que calce con el código.
6. Un cambio por sesión. No aprovechar de "mejorar" cosas no pedidas.
7. Reporte final: máximo 5 líneas (qué cambió, test agregado, resultado pytest, push). Sin relato de proceso.
8. **Marcelo NO es programador.** Toda instrucción operativa (instalar algo, abrir una configuración de Windows, correr un comando, usar VS Code, Vercel, Railway, GitHub) debe darse explícita y paso a paso: dónde hacer clic, qué ventana se abre, qué texto buscar en pantalla, qué escribir exactamente. Nunca asumir que sabe dónde está un menú, qué es una terminal, o cómo llegar a una pantalla. Un paso por línea, numerados.
9. Nunca crear un alias, mapeo o sustituto que haga pasar un equipo por otro. Si un equipo solicitado no existe en el catálogo, decirlo explícitamente y pedir sus especificaciones reales (marca, modelo, tipo, capacidad, css, decks) antes de continuar. Nunca inventar ni aproximar datos de equipos.

---

## Convenciones de código

- Comentarios en **español**; variables y funciones en **inglés**
- Type hints en todas las funciones Python; validación de inputs con Pydantic
- Cálculos de simulación van en `app/services/`, nunca en routers ni en JSX
- Componentes React funcionales con hooks; validación antes de enviar al backend
- No inventar datos de equipos — solo especificaciones reales de fabricantes
- Separar siempre: recepción de datos → validación → cálculo → respuesta

---

## Estado y próximo hito

- **Etapa:** Fase A/B completadas — motor de curvas validado contra AggFlow; recommender con volumen_ton por producto y plazo por producto implementado (45 tests pasando).
- **Entorno:** Windows, VS Code, Claude Code — Marcelo (usuario cmc)
- **Próximo hito:** Fase C — reescribir `simulation_engine.py` con grafos dirigidos y API de Stream; base de datos de clientes y simulaciones; reporte PDF para licitaciones.
