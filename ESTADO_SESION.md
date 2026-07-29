# KrushRock — Estado de sesión (28-jul-2026)

## Método de trabajo
Un cambio por sesión → Claude redacta o edita → Marcelo corre en PowerShell (VS Code): `python -m pytest -q`, luego `git add -A`, `git commit -m "..."`, `git push`, **una línea a la vez** → pega el resultado → Claude verifica leyendo la carpeta del proyecto o GitHub (`marcelozp1979-dotcom/krushrock-ai`, main).

**Claude debe recordarle a Marcelo hacer `git push` después de cada cambio.** Marcelo lo olvida y así lo pidió.

Reglas permanentes en CLAUDE.md. Nota nueva (regla 8): Marcelo NO es programador — toda instrucción operativa va explícita, paso a paso, numerada.

## Entorno (resuelto hoy)
- Python de Microsoft Store estaba roto. Se instaló **Python 3.13** desde python.org. Es el que usa `python` ahora.
- `requirements.txt` **no incluye pytest**; se instaló aparte (`python -m pip install pytest`).
- Cowork tiene "Bypass permissions" activado. Se decidió dejarlo así; la protección real es hacer `git push` seguido.

## Infraestructura
- Backend FastAPI en Railway (plan Hobby pagado; `krushrock-ai-production.up.railway.app`).
- Frontend React/Vite en Vercel (`krushrock-ai.vercel.app`). NO conectado a GitHub — desplegar a mano: `cd krushrock-app` → `npm run build` → `npx vercel --prod`.
- CORS solo permite krushrock-ai.vercel.app y krushrock.app.

## Documentos de gobierno (nuevos, leerlos antes de seguir)
- **`PLAN_MAESTRO.md`** — el plan completo en 6 etapas (0 a 5). Aprobado por Marcelo.
- **`REQUISITOS.md`** — qué hace y qué NO hace KrushRock. 10 requisitos funcionales, 5 de calidad, 5 de datos y seguridad.
- **`NOTAS_SELECCION_EQUIPOS.md`** — hallazgos técnicos sobre selección y choke feed.

## Avance del Plan Maestro

- ✅ **Etapa 0 — Requisitos.** `REQUISITOS.md` v1.0. Decisiones de Marcelo: flota propia + catálogo (ambos casos), carga de equipos del usuario marcados como no verificados, multiproducto es esencial.
- ✅ **Etapa 1 — Coherencia del catálogo.** `tests/test_catalogo_coherencia.py`. **235 tests pasando**, commit `2219fdd`.
- ⬜ **Etapa 2 — Mapa de reglas de descarte** (siguiente).
- ⬜ **Etapa 3 — Optimización conjunta de CSS.**
- ⬜ **Etapa 4 — Alternativas para el cliente (Opción A máx. producción / Opción B menor flota).**
- ⬜ **Etapa 5 — Cuentas, seguridad y política de datos.**

## Hallazgos críticos de la Etapa 1 (bloquean la Etapa 3)

1. **Solo 5 de 79 equipos tienen datos reales de manual** (curva tph vs CSS + fuente citada): J-960, J-1170, J-1175, J-1280, Premiertrak R400. Todas mandíbulas.
2. **Ningún cono (17 modelos) tiene curva de capacidad ni fuente documentada.** La optimización de CSS sobre conos operaría con datos aproximados.
3. **16 impactores (HSI) no declaran rango de CSS.** No se puede verificar su producto ni optimizar su abertura.
4. **J-1175 inconsistente:** declara `cap_min_tph` 200, pero su curva de manual baja a 122,5 tph en el CSS mínimo. Documentado en `_DISCREPANCIAS_CONOCIDAS`. Hay que revisar el manual y corregir uno de los dos datos.

Los tests incluyen trinquetes: si alguien agrega un equipo sin fuente o sin CSS, el test falla.

## Cómo funciona hoy la selección (para entender qué cambia en Etapa 3)
- El ranking elige por **menor cantidad de equipos** entre las configuraciones que cumplen el plazo; desempata por menor capacidad instalada. No hay criterio de eficiencia de producción.
- El **CSS no se optimiza**: se deriva del producto pedido y queda fijo.
- Conteo de flota defectuoso: usa `n_units × nº de etapas`, por lo que "2 mandíbulas" (=2) le gana a "1 mandíbula + 1 cono + 1 seleccionadora" (=3).

## Cola pendiente (fuera del Plan Maestro, no bloquea)
1. Probar el PDF de propuesta en producción y revisarlo con ojo de licitación.
2. Conectar Vercel ↔ GitHub (Settings → Git, Root Directory = `krushrock-app`) para deploy automático.
3. Mensaje claro cuando el volumen pedido es imposible (RF-8).
4. Manuales de conos Finlay C-1540/C-1545/C-1550 — Marcelo los va a subir. **Es lo que desbloquea la Etapa 3.**
5. Extracción de datos Metso desde brochure público Nordberg C — lo hace Claude por web.
6. Puente modo simple → modo avanzado.
7. Eliminar catálogo duplicado del frontend (`catalogo.js` EQ_LOCAL) — fuente única: backend.
8. Specs reales Finlay 883+ y 893; caso KR-AF-004 Rocklands multiproducto; VSMA para seleccionadoras.

## Contexto legal/datos (decidido)
Datos de manuales Finlay: OK usarlos (factuales; citar fuente; disclaimer "no afiliado a fabricantes" y "rendimiento real depende del material"). NO extraer datos desde AggFlow para el catálogo — solo validación. Marcas: uso nominativo sin logos.
