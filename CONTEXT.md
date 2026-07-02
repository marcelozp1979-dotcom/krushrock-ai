# KrushRock — Contexto del Proyecto

## Convenciones de terminología
- Usar siempre **"seleccionadora"**, nunca "zaranda", en cualquier texto
  visible al usuario o documentación del proyecto.
- **capR** en el catálogo de equipos = 80% de la capacidad oficial del fabricante
  (factor conservador para condiciones reales de obra). No usar valores nominales directos.

## Qué es
Simulador de plantas de chancado móvil con IA.
Autor: Marcelo — experto en chancado, no en programación. Trabaja solo.
Stack: Python/FastAPI (backend, Railway) + React/JSX (frontend, Vercel) + Supabase.
Repo: github.com/marcelozp1979-dotcom/krushrock-ai (público)
Frontend en producción: krushrock-ai.vercel.app

## Estado al 02/07/2026
### ✓ COMPLETADO
- Fase A: granulometry.py, equipment_models.py (curvas completas, balance de masas exacto)
- Fase B: tests/test_validation_aggflow.py (5 tests contra datos reales AggFlow)
- Fase C: simulation_engine.py reescrito — usa Stream/crusher()/screen() reales,
  sin propagar P80 escalar. Frontend conectado a la API como única fuente de verdad.
- Limpieza de raíz: 9 archivos huérfanos eliminados.
- Decisión de producto: Tier de emisión (3/4) eliminado de todo el software.
  No se usa ni para cálculo ni como criterio de selección. NO reintroducir esto
  sin que Marcelo lo pida explícitamente.
- 22/22 tests pasan (pytest tests/ -v).
- Mapeo de 11 escenarios reales de clientes (docs/escenarios_clientes.docx)
  contra el wizard actual.
- **Módulo comercial**: arriendo / venta / llave en mano con ítems incluidos editables.
- **Inchancables/riesgo metal**: checkbox en paso Tipo de roca, advertencia y módulo
  comercial condicional (separador magnético, detector, bypass).
- **Comparación vs. equipo de referencia del cliente**: bloque en tab Equipos,
  ingresa modelo + tph citada, indica si cumple o no vs tphEfectivo.
- **Fase D — lenguaje simple**: banner en resultados, tooltips (componente Info con
  constantes TT) en tabs Resumen, Diagrama y Detalle.
- **Capacidad excedida**: lógica `buildCapInfo()` con status ok/paralelo/excedido/
  manual_sobre; modo paralelo intenta N=2..4 unidades; modo manual estima % de
  contaminación por exceso de carga cerca del corte de malla.
- **Score 0-100 eliminado**: `eff_score` removido del backend (simulation_engine.py,
  simulations.py, projects.py). Reemplazado por 3 indicadores separados en la UI:
  - **Carga circulante**: verde ≤20% / naranja 20-30% / rojo >30%
  - **Material aprovechado**: `product_fit_pct` del backend (suma yld_pct de productos)
  - **Cumplimiento P80**: solo si hay exactamente 1 producto activo
- **Catálogo seleccionadoras corregido** (App.jsx, equipment.py, seed_equipment.py):
  - `area_m2` agregado a los 15 modelos
  - Kleemann MS 703i: decks 2→3, capR [100,309]
  - Sandvik QA330 → QA331; QA335: decks 3→2 (Doublescreen)
  - Metso ST3.5: decks 3→2 (capacidad por verificar)
  - TF 683 agregado a equipment.py (faltaba)
  - `_to_frontend()` en equipment.py ya pasa `area_m2` al frontend

### Cobertura real vs. escenarios de clientes (mapeado 29/06/2026)
| Escenario | Estado |
|---|---|
| Selección de equipo por material+producto | Cubierto |
| Tiempo/duración de obra (turnos, merma) | Cubierto |
| CSS por etapa | Cubierto |
| Malla/decks | Cubierto |
| Planta multietapa | Cubierto (parcial: sin backup/redundancia) |
| Inchancables/pebbles | Cubierto (módulo básico implementado) |
| Modalidad comercial (arriendo/venta/llave en mano) | Cubierto |
| Logística (traslado, montaje, permisos) | No existe |
| Mantenimiento/repuestos/GET | No existe |
| Comparación vs. competencia (Sandvik/Metso/Kleemann) | Parcial — esas marcas solo en catálogo propio |

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

### 🔴 PENDIENTE — UX para cliente no-experto
- "Perfil de manto del cono" en paso Circuito no tiene tooltip — jerga
  pura para un cliente que no sabe de chancado. Agregar explicación.
- Verificar en producción (krushrock-ai.vercel.app) que el badge
  CRÍTICO/MEJORABLE/ÓPTIMO ya no aparece en resultados tras el último deploy.
- Más tooltips en pasos del wizard donde la jerga técnica no está explicada.

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
  Tratar el resultado SIEMPRE como estimación gruesa — nunca alimentar
  el motor como si fuera un dato preciso. NO empezar hasta cerrar el MVP.

## Reglas de trabajo (obligatorias)
- Siempre correr `pytest tests/ -v` antes de confirmar cualquier fix al motor.
- Verificar en el repo real / producción, no aceptar reporte de Claude Code
  como evidencia de que algo funciona en producción.
- Terminología: siempre "seleccionadora", nunca "zaranda".
- Tier de motor (3/4): eliminado del software por decisión de Marcelo. No reintroducir.
- capR en catálogo = 80% capacidad oficial del fabricante. No cambiar este criterio
  sin que Marcelo lo pida.

## Archivos clave
- docs/escenarios_clientes.docx — 11 escenarios reales + arquitectura propuesta de 6 módulos
- DIAGNOSTICO_MOTOR_KRUSHROCK.md — diagnóstico original del motor (histórico, ya resuelto)
- casos_validacion_aggflow.json — datos reales de validación
- app/services/simulation_engine.py — motor activo

## Instrucción para Claude Code al iniciar
Siempre ejecuta primero: `pytest tests/ -v`
Si todos pasan, el motor sigue íntegro — continuar con la tarea indicada.
