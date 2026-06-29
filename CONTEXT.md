# KrushRock — Contexto del Proyecto

## Qué es
Simulador de plantas de chancado móvil con IA.
Autor: experto en chancado, no en programación.
Stack: Python/FastAPI (backend, Railway) + React/JSX (frontend, Vercel) + Supabase.

## Estado al 29/06/2026
### ✓ COMPLETADO
- Fase A: granulometry.py, equipment_models.py (curvas completas, balance de masas exacto)
- Fase B: tests/test_validation_aggflow.py (5 tests contra datos reales AggFlow)
- Fase C: simulation_engine.py reescrito — usa Stream/crusher()/screen() reales,
  sin propagar P80 escalar. Frontend conectado a la API como única fuente de verdad.
- Limpieza de raíz: 9 archivos huérfanos eliminados.
- Decisión de producto: Tier de emisión (3/4) eliminado de todo el software.
  No se usa ni para cálculo ni como criterio de selección — no hay evidencia
  de que AggFlow ni otros simuladores de chancado lo usen como variable de
  cálculo, y reintroducirlo como criterio de selección de equipo queda
  descartado por decisión de Marcelo. NO reintroducir esto sin que él lo pida
  explícitamente de nuevo.
- 22/22 tests pasan (pytest tests/ -v).
- Mapeo de 11 escenarios reales de clientes (docs/escenarios_clientes.docx)
  contra el wizard actual — ver tabla abajo.

### Cobertura real vs. escenarios de clientes (mapeado 29/06/2026)
| Escenario | Estado |
|---|---|
| Selección de equipo por material+producto | Cubierto |
| Tiempo/duración de obra (turnos, merma) | Cubierto |
| CSS por etapa | Cubierto |
| Malla/decks | Cubierto |
| Planta multietapa | Cubierto (parcial: sin backup/redundancia) |
| Inchancables/pebbles | No existe |
| Modalidad comercial (arriendo/venta/llave en mano) | No existe — prioridad alta según el doc de arquitectura |
| Logística (traslado, montaje, permisos) | No existe |
| Mantenimiento/repuestos/GET | No existe |
| Comparación vs. competencia (Sandvik/Metso/Kleemann) | No existe como módulo (esas marcas solo están en catálogo propio) |

## 🎯 OBJETIVO ACTUAL: MVP vendible (decisión de Marcelo, 29/06/2026)
Prioridad: terminar un MVP probable con cliente real ANTES de completar
los 11 escenarios al 100%. Criterios del MVP, en este orden:
1. Resultados confiables (✓ ya cumplido — motor validado, 22 tests)
2. Fácil e intuitivo de operar para alguien que no sabe de chancado
3. Apariencia pulida
4. Útil — que resuelva problemas reales de cliente, no solo que calcule

Backlog explícito para DESPUÉS del MVP (no tocar ahora salvo que Marcelo
lo pida): mantenimiento/repuestos (3.10), logística completa (3.9),
backup/redundancia (3.5), resto de pulido visual fino.

### 🔴 PENDIENTE — Fase D (UX para cliente no-experto)
La app expone jerga técnica (Wi, CSS, P80, carga circulante) sin glosario
ni explicación en lenguaje simple. El motor de alertas (App.jsx ~línea 1420)
ya genera recomendaciones, pero en lenguaje de experto.
Falta: traducir resultados a lenguaje simple + explicar qué hacer ante un
índice bajo, y construir los módulos ausentes de la tabla de arriba
(prioridad: comercial > inchancables/logística/mantenimiento/competencia).

### 📋 FUTURO
- Rediseño visual del wizard para no-experto
- Más equipos y marcas en catálogo
- Conectar learning_engine.py (Fase 7) a un flujo real de feedback —
  hoy existe pero no está conectado a ningún endpoint ni dato real
- **Estimación de granulometría por fotos** (post-MVP, idea de Marcelo
  29/06/2026, validada como viable con ajustes): el cliente sube 2 fotos
  para estimar F80 cuando no tiene datos. Técnica real, usada por
  herramientas comerciales (WipFrag, Split-Online), pero con 2
  correcciones obligatorias antes de construir:
  1. La referencia de escala NO puede ser una piedra sostenida a brazo
     extendido (no se conoce su tamaño real). Debe ser un objeto de
     tamaño conocido (casco, pala, celular, billete) puesto en el suelo
     junto a una piedra representativa, foto desde ángulo fijo.
  2. Segunda foto a distancia fija en metros reales (no "pasos").
  Tratar el resultado SIEMPRE como estimación gruesa (similar o
  levemente mejor que el fallback actual "Usar valores promedio", no
  como dato de curva real) — nunca alimentar el motor como si fuera
  un dato preciso, para no comprometer la confiabilidad ya validada
  (22 tests). Costo de la API de visión: bajo (<2 centavos USD por par
  de fotos a resolución moderada), no es limitante.
  NO empezar a construir esto hasta cerrar el MVP actual.

## Archivos clave
- docs/escenarios_clientes.docx — 11 escenarios reales + arquitectura propuesta de 6 módulos
- DIAGNOSTICO_MOTOR_KRUSHROCK.md — diagnóstico original del motor (histórico, ya resuelto)
- casos_validacion_aggflow.json — datos reales de validación
- app/services/simulation_engine.py — motor activo

## Instrucción para Claude Code al iniciar
Siempre ejecuta primero: pytest tests/ -v
Si todos pasan, el motor sigue íntegro — continuar con la Fase D pendiente
salvo que se indique otra cosa.
