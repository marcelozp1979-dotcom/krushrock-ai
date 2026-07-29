# KrushRock — Documento de Requisitos

Versión 1.0 · 28-jul-2026 · Etapa 0 del Plan Maestro

Este documento define qué debe hacer KrushRock y qué no. Es la referencia contra la
que se justifica cualquier decisión futura de diseño. Está escrito en lenguaje de
negocio a propósito: si un requisito no se entiende sin ser programador, está mal escrito.

---

## 1. Propósito

KrushRock responde tres preguntas a alguien que necesita chancar roca y **no es ingeniero de procesos**:

1. ¿Qué equipos necesito para producir el material que me piden?
2. ¿Cuánta producción puedo esperar, y en cuánto tiempo cumplo el volumen?
3. ¿Qué alternativas tengo, y por qué una es mejor que otra?

La primera pregunta es la más importante. Todo lo demás se construye sobre ella.

---

## 2. Usuarios

| Usuario | Qué necesita | Qué NO tiene |
|---|---|---|
| Contratista de chancado | Ganar licitaciones de áridos con una propuesta técnica creíble | Tiempo ni ingeniero de procesos en planta |
| Productor de áridos | Dimensionar o ampliar su planta | Software especializado (AggFlow cuesta y exige experto) |
| Pequeña y mediana minería | Evaluar plantas móviles o fijas antes de invertir | Certeza sobre qué equipos comprar o arrendar |
| Gran minería | Contrastar propuestas de proveedores | Herramienta rápida para verificación independiente |

Supuesto común a todos: **no saben de curvas granulométricas, CSS ni razones de reducción.**
El software debe pedir lo que el usuario sí sabe (qué roca, de qué tamaño sale, qué producto
le piden, cuántas toneladas y en cuánto tiempo) y traducirlo internamente.

---

## 3. Alcance

### 3.1 Lo que KrushRock SÍ hace

- Simula circuitos de chancado y selección propagando curvas granulométricas completas.
- Recomienda combinaciones de equipos capaces de generar los productos pedidos.
- Calcula la producción esperada (tph) y el plazo para alcanzar el volumen requerido.
- Optimiza la configuración de los equipos para maximizar la producción del producto pedido.
- Presenta alternativas comparables y explica en lenguaje simple por qué difieren.
- Genera un reporte PDF presentable en una licitación minera.

### 3.2 Lo que KrushRock NO hace

- **No cotiza.** No entrega precios de equipos, arriendos ni costos de operación.
- **No reemplaza al ingeniero de procesos** ni a una visita a terreno.
- **No garantiza rendimiento real.** Los resultados son estimaciones basadas en datos
  de fabricante y modelos validados; el material real varía.
- **No diseña la obra civil, la alimentación, el transporte ni el manejo de aguas.**
- **No está afiliado a ningún fabricante.** Usa nombres de marca de forma nominativa, sin logos.

---

## 4. Requisitos funcionales

### RF-1 · Entrada de datos en lenguaje del cliente

El usuario debe poder definir un caso indicando únicamente: tipo de roca, tamaño máximo
del material de entrada, productos requeridos (rango de tamaños y toneladas de cada uno),
plazo de la obra y jornada de trabajo. Ningún campo obligatorio debe exigir conocimiento
de ingeniería de procesos.

### RF-2 · Múltiples productos simultáneos

El sistema debe resolver casos con **varios productos al mismo tiempo** (por ejemplo base,
gravilla y arena en un mismo circuito), reportando la producción de cada uno por separado
y el plazo de cumplimiento de cada uno.
*Decisión de Marcelo, 28-jul-2026: esencial para la versión comercial.*

### RF-3 · Flota propia del cliente

El usuario debe poder indicar qué equipos **ya posee**. El sistema prioriza armar circuitos
con esos equipos y, si no alcanzan para cumplir el requerimiento, indica explícitamente
qué equipo adicional hace falta y por qué.
*Decisión de Marcelo, 28-jul-2026: ambos casos, flota propia y recomendación de catálogo.*

### RF-4 · Carga de equipos fuera del catálogo

El usuario debe poder ingresar un equipo que no está en el catálogo oficial, entregando sus
especificaciones reales. El sistema debe:

- marcar ese equipo como **"dato del usuario — no verificado"** en pantalla y en el PDF;
- exigir los datos mínimos para simular (tipo, capacidad, rango de CSS o malla, boca de entrada);
- **nunca** mezclarlo con el catálogo oficial ni presentarlo con el mismo nivel de confianza.

*Decisión de Marcelo, 28-jul-2026.*

### RF-5 · Selección de equipos por criterio físico

El sistema descarta equipos aplicando reglas de ingeniería documentadas, no heurísticas.
Cada descarte debe tener un motivo mostrable al usuario en lenguaje simple. Reglas mínimas:

- La boca de entrada debe aceptar el tamaño máximo real de la roca.
- La razón de reducción por etapa no debe superar el límite del tipo de chancador.
- Un cono debe poder trabajar cerca del **80% de su alimentación máxima** (choke feed).
  Un cono que quedaría alimentado muy por debajo se descarta o se advierte.
- La alimentación al cono debe calzar con su cámara: 90–100% pasante de la boca,
  40–60% a mitad de cámara, 0–10% del CSS.
- La seleccionadora debe soportar el caudal y la malla requerida.

### RF-6 · Optimización de la configuración

Para cada circuito candidato, el sistema debe determinar la **combinación de CSS de todas
las etapas** que maximiza las toneladas por hora de los productos pedidos.

No basta con optimizar cada equipo por separado: cerrar la mandíbula al mínimo fuerza su
razón de reducción al máximo y hunde su producción, creando un cuello de botella aunque el
cono siguiente quede holgado. La optimización es sobre el **tren completo**.

### RF-7 · Alternativas para el cliente

El sistema presenta al menos dos caminos, cuando existan:

- **Opción A — Máxima producción:** la combinación que entrega más toneladas por hora del producto pedido.
- **Opción B — Menor flota:** menos equipos, siempre que produzca al menos un porcentaje
  definido de la Opción A (piso **relativo**, nunca un valor fijo de tph).

Si la Opción B no existe —porque A ya usa el mínimo de equipos posible— el sistema debe
**decirlo explícitamente** y no ofrecer una alternativa peor solo para llenar el espacio.

### RF-8 · Caso imposible

Cuando el volumen pedido no es alcanzable con ningún circuito en el plazo dado, el sistema
debe mostrar el tph requerido, el tph máximo alcanzable, y sugerir las salidas concretas
(más plazo, más jornada, más equipos). Nunca devolver un resultado vacío.

### RF-9 · Reporte de propuesta

El sistema genera un PDF con los equipos recomendados, la producción esperada por producto,
el plazo, los supuestos usados y los disclaimers legales. Debe ser presentable ante una
comisión evaluadora de licitación minera.

### RF-10 · Trazabilidad de los datos

Cada equipo del catálogo debe indicar la fuente de sus datos (manual, revisión, página).
Un equipo sin fuente documentada no puede usarse para recomendar.

---

## 5. Requisitos de calidad

### RC-1 · Precisión

Los resultados deben mantenerse dentro de **±15%** respecto de los casos de validación reales
(`tests/casos_validacion_reales.json` y los casos AggFlow). Estos casos son la fuente de verdad:
**nunca se ajusta un caso para que calce con el código.**

### RC-2 · Coherencia física del catálogo

Verificación automática sobre todo el catálogo:

- A mayor CSS, mayor producción (tph). Dos CSS distintos **no pueden** dar la misma producción.
- A mayor CSS, curva de producto más gruesa.
- CSS mínimo menor que máximo; capacidad mínima menor que máxima; boca de entrada mayor que el CSS máximo.

### RC-3 · Balance de masas

En todo circuito, lo que entra es igual a lo que sale, tamaño por tamaño, con tolerancia ±0,1 tph.

### RC-4 · Motor único

Todo cálculo vive en el backend. El frontend solo consulta y grafica. No existe lógica de
simulación duplicada en la interfaz.

### RC-5 · Comprensibilidad

Todo resultado, advertencia y motivo de descarte debe entenderse sin formación en ingeniería
de procesos. Los términos técnicos se usan correctamente, pero siempre acompañados de su
explicación en la interfaz.

---

## 6. Requisitos de datos y seguridad

### RS-1 · Datos de clientes

Las simulaciones contienen información comercial sensible (volúmenes, plazos, estrategia de
licitación). Deben quedar aisladas por cuenta: ningún usuario puede ver simulaciones de otro.

### RS-2 · Acceso

Toda función que genere reportes o guarde datos debe exigir cuenta. *(Pendiente: hoy el
endpoint del PDF es público.)*

### RS-3 · Respaldo

La base de datos debe tener respaldo automático y un procedimiento escrito de restauración
que Marcelo pueda ejecutar sin ayuda.

### RS-4 · Claves

Ninguna clave o credencial en el código. Verificado al 28-jul-2026: el repositorio está limpio.

### RS-5 · Origen de los datos de fabricante

Los datos provienen de manuales y fichas técnicas públicas. Se cita la fuente. **No se extraen
datos desde AggFlow** para el catálogo — AggFlow se usa solo como referencia de validación.

---

## 7. Criterios de aceptación

KrushRock se considera listo para vender cuando:

1. Los casos de validación reales pasan dentro de ±15%.
2. Todo el catálogo cumple la coherencia física (RC-2), verificado automáticamente.
3. Un caso multiproducto real se resuelve de extremo a extremo y genera su PDF.
4. La optimización de CSS entrega una configuración mejor que la selección actual en al
   menos un caso documentado, y se puede explicar por qué.
5. Existe política de datos escrita y el acceso está cerrado por cuenta.

---

## 8. Historial de decisiones

| Fecha | Decisión | Quién |
|---|---|---|
| 28-jul-2026 | Flota propia + recomendación de catálogo (ambos casos) | Marcelo |
| 28-jul-2026 | Carga de equipos del usuario, marcados como no verificados | Marcelo |
| 28-jul-2026 | Multiproducto es esencial para la versión comercial | Marcelo |
| 28-jul-2026 | Choke feed del cono: 80%, no 95% | Verificado con fuentes de industria |
| anterior | No extraer datos desde AggFlow; solo validación | Marcelo |
