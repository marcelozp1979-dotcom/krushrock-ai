# KrushRock — Contexto del Proyecto

## Qué es
Simulador de plantas de chancado móvil con IA.
Autor: experto en chancado, no en programación.
Stack: Python/FastAPI (backend, Railway) + React/JSX (frontend, Vercel) + Supabase.

## Estado al 28/06/2026
### ✓ COMPLETADO
- Fase A: granulometry.py, equipment_models.py (curvas completas, balance de masas exacto)
- Fase B: tests/test_validation_aggflow.py (5 tests contra datos reales AggFlow)
- Fase C: simulation_engine.py reescrito — usa Stream/crusher()/screen() reales,
  sin propagar P80 escalar. krushrock-ai.jsx (motor duplicado del frontend)
  eliminado. Frontend conectado a la API como única fuente de verdad.
- Limpieza de raíz: eliminados 9 archivos huérfanos (prototipos jsx sueltos,
  scripts standalone, zip de backup). motor_curvas_prototipo.py ya no existe
  (cumplió su rol de referencia, está documentado en DIAGNOSTICO_MOTOR_KRUSHROCK.md).
- 22/22 tests pasan (pytest tests/ -v).

### 🔴 PENDIENTE — Fase D (UX para cliente no-experto)
El motor de cálculo está validado, pero la app expone jerga técnica
(Wi, CSS, P80, carga circulante) sin ningún glosario ni explicación en
lenguaje simple. El motor de alertas/recomendaciones (App.jsx, función de
observaciones ~línea 1420) ya genera mensajes útiles, pero en el mismo
lenguaje técnico — sirve a un experto, no al cliente final.
Falta: traducir resultados a lenguaje simple, explicar qué significa un
índice bajo y qué hacer, mapear los 11 escenarios reales de clientes
(correos de Marcelo) contra las features actuales del wizard.

### 📋 FUTURO
- Rediseño visual del wizard pensado para no-experto
- Más equipos y marcas en catálogo
- Conectar learning_engine.py (Fase 7) a un flujo real de feedback —
  hoy existe pero no está conectado a ningún endpoint ni dato real

## Archivos clave
- DIAGNOSTICO_MOTOR_KRUSHROCK.md — diagnóstico original del motor (histórico,
  ya resuelto — ver sección Estado arriba)
- casos_validacion_aggflow.json — datos reales de validación
- app/services/granulometry.py — clase Stream ✓
- app/services/equipment_models.py — crusher() y screen() ✓
- app/services/simulation_engine.py — motor activo, usa Stream/crusher/screen ✓
- tests/test_validation_aggflow.py — 5 tests ✓

## Instrucción para Claude Code al iniciar
Siempre ejecuta primero: pytest tests/ -v
Si todos pasan, el motor sigue íntegro — continuar con la Fase D pendiente
(UX no-experto) salvo que se indique otra cosa.
Si alguno falla, corregirlo antes de seguir.
