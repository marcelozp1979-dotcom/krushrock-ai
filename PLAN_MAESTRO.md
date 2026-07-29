# KrushRock — Plan Maestro

Fecha: 28-jul-2026 · Estado: **propuesta, pendiente de aprobación de Marcelo**

Este documento ordena todo lo que falta. No reemplaza lo ya construido: lo formaliza.
Nada de lo aquí descrito se implementa hasta que Marcelo apruebe el orden.

---

## 1. Dónde estamos, sin adornos

**Lo que está sólido:**

- El motor de curvas granulométricas funciona y está validado contra dos casos reales de AggFlow.
- 106 tests automáticos pasando. Eso es una red de seguridad real.
- Catálogo con datos oficiales de fabricante para 6 mandíbulas Finlay y curvas de capacidad.
- Backend en producción (Railway), frontend en producción (Vercel), PDF de propuesta funcionando.
- Sin claves ni contraseñas expuestas en el repositorio (verificado).

**Lo que está débil:**

- **No existe un documento de requisitos.** Nadie ha escrito qué debe hacer KrushRock. Las decisiones viven en la cabeza de Marcelo y en conversaciones sueltas.
- **La selección de equipos no tiene criterio de ingeniería.** Elige la flota más chica que alcanza el plazo. Nada más.
- **El CSS no se optimiza.** Se deriva del producto pedido y queda fijo.
- **No hay verificación de coherencia física del catálogo.** Nada garantiza hoy que a mayor CSS el equipo entregue más toneladas por hora.
- **El endpoint del PDF es público.** Cualquiera con la dirección puede generar propuestas.
- **No hay política escrita de datos, respaldo ni privacidad**, y el producto va a guardar información comercial de clientes mineros.

---

## 2. Lo que falta como disciplina, no como código

Estos son los documentos que todo software profesional tiene y KrushRock no. Son baratos de hacer y evitan rehacer trabajo:

| Documento | Qué responde | Estado |
|---|---|---|
| Requisitos | Qué debe hacer el software y qué NO | No existe |
| Mapa de reglas de selección | Por qué se descarta un equipo, con fuente | Disperso en el código |
| Arquitectura | Qué hace cada parte y quién habla con quién | Parcial (CLAUDE.md) |
| Casos de validación | Cómo sabemos que el resultado es correcto | Existe y es bueno |
| Política de datos y seguridad | Qué se guarda, quién accede, cómo se respalda | No existe |

---

## 3. Plan por etapas

Cada etapa se cierra antes de abrir la siguiente. Un cambio por sesión.

### Etapa 0 — Escribir los requisitos (sin tocar código)

Documento en lenguaje de negocio, no técnico. Contenido:

- Qué decide el software: qué equipos, qué producción, en cuánto tiempo, con qué alternativas.
- Qué NO hace: no cotiza, no reemplaza al ingeniero, no garantiza rendimiento en terreno.
- Quién lo usa y qué necesita ver cada tipo de usuario.
- Qué se considera un resultado correcto.

**Por qué primero:** todo lo demás se justifica contra este documento. Sin él, cada decisión futura vuelve a discutirse desde cero.

---

### Etapa 1 — Red de seguridad sobre los datos del catálogo

Antes de construir lógica más inteligente, hay que garantizar que los datos base son coherentes. Tests automáticos que revisen **todo el catálogo**:

1. **A mayor CSS, mayor tph.** Si un equipo entrega la misma o menor producción con una abertura mayor, el dato está malo. (Requerimiento explícito de Marcelo.)
2. **A mayor CSS, producto más grueso.** La curva de producto debe correrse hacia tamaños mayores.
3. **Coherencia de rangos:** CSS mínimo < CSS máximo; capacidad mínima < capacidad máxima; boca de entrada mayor que el CSS máximo.
4. **Todo equipo tiene fuente documentada.** Si no tiene manual citado, se marca y no se usa para recomendar.

**Por qué antes que la optimización:** si se optimiza CSS sobre datos incoherentes, el resultado será basura convincente. Este es el paso que más riesgo elimina por menos esfuerzo.

---

### Etapa 2 — Mapa de reglas de descarte (la "Capa 1")

Un único módulo que concentre todas las reglas físicas que eliminan un equipo, cada una con su fuente escrita:

- Boca de entrada vs tamaño máximo de roca.
- Razón de reducción máxima por tipo de chancador.
- **Llenado del cono: debe poder trabajar cerca del 80% de su alimentación máxima** (choke feed). Un cono que quedaría alimentado al 40% se descarta o se advierte.
- **Calce de la cámara del cono con la alimentación:** 90–100% pasante de la boca, 40–60% a mitad de cámara, 0–10% del CSS.
- Compatibilidad de la seleccionadora con el caudal y la malla pedida.

Salida de esta etapa: una lista corta de trenes candidatos viables, con el motivo de cada descarte visible para el usuario.

---

### Etapa 3 — Optimización conjunta de CSS

El corazón de lo que pidió Marcelo. Para cada tren candidato, buscar la **combinación de CSS de todas las etapas** que maximiza las toneladas por hora del producto pedido.

Principio: el óptimo no es cerrar cada chancador al mínimo. Cerrar la mandíbula fuerza su razón de reducción al máximo, hunde su producción y crea el cuello de botella, aunque el cono siguiente quede holgado. Hay que evaluar el tren completo.

Requiere haber cerrado la Etapa 1: sin monotonía CSS↔tph garantizada, la búsqueda encuentra óptimos falsos.

---

### Etapa 4 — Alternativas para el cliente no experto

Presentar al menos dos caminos, para que el cliente vea posibilidades y no una caja negra:

- **Opción A — Máxima producción:** la combinación que entrega más toneladas por hora del producto pedido.
- **Opción B — Menor flota:** menos equipos, siempre que produzca **al menos un porcentaje definido de la Opción A** (piso relativo, no un número fijo de tph). Si esa opción no existe, decirlo explícitamente en vez de mostrar una peor.
- Cada opción con el motivo en lenguaje simple de por qué es una alternativa válida.

---

### Etapa 5 — Cuentas, seguridad y política de datos

- Cerrar el endpoint público del PDF; exigir cuenta.
- Límites por plan de licencia.
- Documento de política de datos: qué información de clientes se guarda, cuánto tiempo, quién accede, cómo se respalda la base de datos, y qué pasa si un cliente pide borrar sus datos.
- Rotación de claves de servicio y revisión de permisos en Railway, Vercel y Supabase.
- Disclaimer legal en cada PDF: no afiliado a fabricantes; el rendimiento real depende del material.

---

### Trabajo continuo (en paralelo, no bloquea)

Ya documentado en `PENDIENTES_PRECISION.md`:

- Metodología VSMA para seleccionadoras.
- Curva de producto propia por modelo real de equipo.
- Carga de manuales de conos Finlay C-1540/C-1545/C-1550 y datos Metso Nordberg C.

---

## 4. Reglas de trabajo que se mantienen

- Un cambio por sesión.
- `pytest` verde antes de dar algo por terminado.
- `git push` después de cada cambio. **Claude debe recordárselo a Marcelo cada vez**, y también antes de dejar trabajo corriendo sin supervisión.
- Nunca inventar datos de equipos. Si falta un dato, se pide.
- Los casos de validación son la fuente de verdad. Nunca se ajusta el caso para que calce con el código.

---

## 5. Decisión que necesita Marcelo

Aprobar o corregir el orden de las etapas 0 a 5. La única que recomiendo no mover de lugar es la **Etapa 1**: es la que impide construir sobre datos malos.
