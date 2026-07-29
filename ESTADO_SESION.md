# KrushRock — Estado de sesión (28-jul-2026)

## Método de trabajo
Un cambio por sesión → Claude (chat) redacta prompt → Marcelo lo pega en Claude Code (VS Code) → Marcelo corre en PowerShell: `git add -A`, `git commit -m "..."`, `git push` (una línea a la vez) y `python -m pytest -q` → pega la última línea → Claude verifica leyendo la carpeta del proyecto (conectada en Cowork) o GitHub (`marcelozp1979-dotcom/krushrock-ai`, main).
Reglas permanentes en CLAUDE.md: pytest antes de "terminado"; nunca inventar specs; casos AggFlow son fuente de verdad (±15%), nunca ajustarlos; "seleccionadora", no "zaranda"; reporte máx 5 líneas.

## Infraestructura
- Backend FastAPI en Railway (plan Hobby PAGADO hoy; URL producción: krushrock-ai-production.up.railway.app).
- Frontend React/Vite en Vercel (proyecto krushrock-ai, dominio krushrock-ai.vercel.app). OJO: NO está conectado a GitHub — desplegar a mano: `cd krushrock-app` → `npm run build` → `npx vercel --prod`.
- CORS del backend solo permite krushrock-ai.vercel.app y krushrock.app (app/core/config.py).

## Completado en estas sesiones
1. Curvas reales de capacidad (tph vs CSS) y producto (d/CSS → %pasante) cargadas en `_FALLBACK` (routers/equipment.py) desde manuales Terex oficiales: J-960, J-1160, J-1170 (nuevo en catálogo), J-1175, J-1280, J-1480.
2. R400 Powerscreen: misma cámara Terex 1100×700 que J-1170 (spec oficial Rev 6 2023) — usa sus curvas con data_quality="equivalencia_camara". Bug ranking R400 vs J-1175 CERRADO.
3. Propagación de curvas: recommender pasa curves/product_curve a simulate(); /calculate enriquece nodos desde catálogo (_enrich_node_from_catalog).
4. Tabla comparativa modo simple: sin tarifa, sin carga circulante, sin fila cumple_plazo; con tiempo_requerido (meses); modelos bajo cada encabezado; un solo color.
5. PDF de propuesta: app/services/proposal_pdf.py + POST /reports/proposal (público) + botón en ModoSimple ("↓ Descargar propuesta (PDF)" en cada tarjeta de recomendación, con campos Cliente/Proyecto opcionales).
6. Topología de circuitos (commit b4a5fa8): jaw_screen SIEMPRE circuito abierto (nunca recircular a mandíbula); configs nuevas jaw_cone_cone_screen y cone_cone_screen (recirculación al cono terciario). Test: tests/test_circuit_topology.py.
7. Intento de "bypass de finos" en crusher(): REVERTIDO — las curvas normalizadas ya incluyen ese efecto (calibradas estilo AggFlow); agregarlo cuenta doble y rompe casos validados. No reintentar sin recalibrar curvas.

## EN CURSO (bloqueado): verificación pendiente
El commit b4a5fa8 (topología) NO tiene pytest corrido aún: el Python de Windows (tienda) se rompió ("no tiene acceso al archivo"); Store dice instalado; Reparar falló por archivo en uso; se indicó REINICIAR el PC y correr `python -m pytest -q` en la carpeta del proyecto. PRIMERA TAREA del próximo chat: confirmar ese pytest (deberían pasar ~100 tests) y luego probar en la app el caso F80 160mm / producto 0–25.4 / 500.000 t → debe ofrecer tren con cono terciario, NO mandíbula sola al 100%.

## Cola pendiente (en orden)
1. Confirmar pytest de topología + prueba visual del caso 0–25.4 (arriba).
2. Probar el PDF de propuesta en producción (Railway ya pagado) y revisarlo con ojo de licitación.
3. Conectar Vercel ↔ GitHub (Settings → Git, Root Directory = krushrock-app) para deploy automático.
4. Mensaje claro cuando el volumen pedido es imposible (mostrar tph requerido vs máximo alcanzable, sugerir más plazo/jornada) en vez de resultado vacío.
5. Cuentas con límites por plan (segunda mitad del MVP; el endpoint del PDF hoy es público).
6. Manuales de conos Finlay C-1540/C-1545/C-1550 (Marcelo los va a subir; mismo proceso que mandíbulas).
7. Extracción de datos Metso desde brochure público Nordberg C (confirmado que existe: tablas tph vs CSS) — lo hace Claude por web.
8. Puente modo simple → modo avanzado (botón que traspasa la config recomendada).
9. Eliminar catálogo duplicado del frontend (catalogo.js EQ_LOCAL) — fuente única: backend.
10. Specs reales Finlay 883+ y 893; caso KR-AF-004 Rocklands multiproducto; VSMA para seleccionadoras cuando haya datos por deck.

## Contexto legal/datos (decidido)
Datos de manuales Finlay: OK usarlos (datos factuales; citar fuente; disclaimer "no afiliado a fabricantes" y "rendimiento real depende del material"). NO extraer datos desde AggFlow (licencia COMECO) para el catálogo — solo validación. Marcas: uso nominativo sin logos.
