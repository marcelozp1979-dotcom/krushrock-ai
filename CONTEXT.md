# KrushRock — Contexto del Proyecto

## Qué es
Simulador de plantas de chancado móvil con IA.
Autor: experto en chancado, no en programación (2 semanas programando).
Stack: Python/FastAPI (backend) + React/JSX (frontend).

## Estado al 10/06/2026
### ✓ COMPLETADO
- Fase A: granulometry.py, equipment_models.py (curvas completas, balance de masas exacto)
- Fase B: tests/test_validation_aggflow.py (5 tests contra datos reales AggFlow)
- casos_validacion_aggflow.json (2 casos reales: Finlay J-1160 + C-1540RS)

### 🔴 PENDIENTE — Fase C
1. Reescribir simulation_engine.py usando Stream, crusher(), screen()
2. Eliminar motor duplicado en krushrock-ai.jsx
3. Conectar frontend a API (una sola fuente de verdad)

### 📋 FUTURO (después de Fase C)
- Rediseño visual completo (más moderno, intuitivo)
- Nueva arquitectura de navegación (menos pasos)
- Más equipos y marcas en catálogo
- Módulos nuevos por definir
- Calibración con más casos reales

## Archivos clave
- DIAGNOSTICO_MOTOR_KRUSHROCK.md — diagnóstico completo y plan
- motor_curvas_prototipo.py — motor validado de referencia
- casos_validacion_aggflow.json — datos reales de validación
- app/services/granulometry.py — clase Stream ✓
- app/services/equipment_models.py — crusher() y screen() ✓
- tests/test_validation_aggflow.py — 5 tests ✓

## Problema central (ya diagnosticado)
Motor actual propaga P80 escalar entre equipos, no curvas completas.
Factor cono incorrecto: software usa ×1.62, real es ×0.91 (error 83%).
Bond calculado en mm no µm (infla energía ×31.6).
Dos motores duplicados: backend Python + frontend JSX.

## Instrucción para Claude Code al iniciar
Siempre ejecuta primero: pytest tests/ -v
Si todos pasan, continúa con Fase C.
Si alguno falla, corrígelo antes de seguir.

## Instrucción para chat Claude.ai al iniciar
Leer este archivo + preguntar en qué sesión estamos.