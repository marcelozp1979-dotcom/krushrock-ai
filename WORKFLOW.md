# WORKFLOW.md — Trabajo autónomo de KrushRock

Este archivo define **cómo** trabaja el agente cuando avanza sin supervisión.
`CLAUDE.md` define **quién es y qué reglas nunca rompe**. Ese archivo manda sobre este.

---

## 0. Cómo se activa (importante)

Este documento no se ejecuta solo. Marcelo debe iniciar una sesión de **Claude Code en VS Code**
con bypass de permisos activo y darle la instrucción de arranque (ver sección 8). El agente
entonces avanza solo hasta terminar la cola o quedarse bloqueado.

---

## 1. Objetivo

Avanzar de forma continua por la cola de tareas, sin intervención humana, tomando decisiones
razonadas y dejando todo trazable para que Marcelo lo revise en la mañana y decida si lo
integra a la rama principal.

---

## 2. Antes de empezar — lectura obligatoria

En este orden, en cada arranque y después de cada tarea completada:

1. `CLAUDE.md` — identidad y reglas que nunca se rompen.
2. `REQUISITOS.md` — qué debe hacer el software. Toda decisión se justifica contra este archivo.
3. `PLAN_MAESTRO.md` — en qué etapa vamos y por qué ese orden.
4. `TASKS.md` — la cola de trabajo.
5. `MEMORY.md` — contexto vivo: hipótesis, hallazgos y tareas descubiertas en iteraciones previas.
6. `DECISIONS.md` — decisiones ya tomadas. No se vuelven a discutir.

---

## 3. Rama de trabajo

- **Nunca** trabajar ni hacer push sobre `main`.
- Crear o continuar en una rama con nombre `nocturno/AAAA-MM-DD`.
- Un commit por tarea completada, con el número de tarea en el mensaje.
- `git push` de la rama al terminar cada tarea, no al final de la noche.

```
git checkout -b nocturno/2026-07-29
```

Si la rama ya existe:

```
git checkout nocturno/2026-07-29
```

---

## 4. Ciclo por tarea

Para cada tarea de `TASKS.md`, en orden:

1. **Leer** la tarea y verificar que no esté bloqueada.
2. **Registrar** en `MEMORY.md` que se inicia, con la hipótesis de solución.
3. **Implementar** el cambio mínimo que la resuelve. Nada más.
4. **Escribir o ampliar tests** que demuestren que quedó resuelta.
5. **Correr `python -m pytest -q`.** Debe quedar todo verde.
   - Si falla, corregir. Si tras 3 intentos sigue fallando: revertir el cambio, marcar la
     tarea como BLOQUEADA en `TASKS.md` con el error textual, y pasar a la siguiente.
6. **Commit y push** en la rama nocturna.
7. **Actualizar** `TASKS.md` (tarea cerrada), `MEMORY.md` (qué se aprendió) y `DECISIONS.md`
   si se tomó una decisión de diseño que afecta el futuro.
8. **Continuar automáticamente** con la siguiente tarea. No pedir confirmación.

---

## 5. Cuándo detenerse (única condición)

El agente se detiene y deja constancia solo si falta **información crítica que no puede
obtener por sí mismo**. Ejemplos:

- Un dato de equipo que no está en ningún manual disponible.
- Una decisión de negocio que cambia el alcance (precio, planes, alcance comercial).
- Una tarea que exigiría tocar `granulometry.py` o `equipment_models.py`.

En ese caso: escribir la pregunta exacta en `MEMORY.md` bajo "BLOQUEOS PARA MARCELO",
marcar la tarea como BLOQUEADA y **seguir con la siguiente tarea de la cola.**
Solo si toda la cola queda bloqueada, terminar la sesión.

---

## 6. Prohibiciones absolutas en modo autónomo

Estas no se negocian, ni siquiera con buena justificación:

1. **No inventar ni estimar datos de equipos.** Marca, modelo, capacidad, CSS, curvas y boca
   de entrada solo se cargan desde una fuente citable, con la referencia exacta guardada en
   el campo correspondiente. Sin fuente → no se carga, se anota en `MEMORY.md` y se sigue.
2. **No ajustar los casos de validación** para que calce el código. Nunca.
3. **No tocar** `app/services/granulometry.py` ni `app/services/equipment_models.py`.
4. **No hacer push a `main`.** Nunca. Ni con merge, ni con fast-forward.
5. **No desplegar** a Railway ni a Vercel.
6. **No modificar** `CLAUDE.md`, `REQUISITOS.md` ni `PLAN_MAESTRO.md`. Si algo de ahí parece
   equivocado, se anota en `MEMORY.md` como propuesta y se sigue.
7. **No borrar archivos** del proyecto.
8. **No crear alias ni equivalencias** entre equipos distintos.

---

## 7. Archivos de contexto vivo

### `TASKS.md` — la cola
Tareas ordenadas, con estado: `PENDIENTE`, `EN CURSO`, `HECHA`, `BLOQUEADA`.
El agente actualiza el estado y **no reordena** la cola por su cuenta.

### `MEMORY.md` — memoria de trabajo
Registro cronológico de lo que va pasando dentro de la noche:
- hipótesis probadas y descartadas,
- hallazgos inesperados,
- tareas nuevas descubiertas (se anotan aquí, no se ejecutan sin estar en `TASKS.md`),
- bloqueos para Marcelo.

Es lo primero que Marcelo lee en la mañana. Se escribe para que se entienda sin ser programador.

### `DECISIONS.md` — decisiones firmes
Solo decisiones de diseño que ya no se vuelven a discutir, con fecha y motivo.
Formato: qué se decidió, por qué, qué alternativa se descartó.

---

## 8. Instrucción de arranque

Lo que Marcelo pega en Claude Code antes de irse a dormir:

```
Lee WORKFLOW.md y síguelo al pie de la letra.
Trabaja de forma autónoma en la rama nocturna hasta terminar la cola de TASKS.md
o hasta que todas las tareas queden bloqueadas.
No me preguntes nada: si falta información, anótala en MEMORY.md y sigue con la siguiente tarea.
No hagas push a main bajo ninguna circunstancia.
```

---

## 9. Revisión de la mañana (Marcelo)

1. Abrir `MEMORY.md` y leerlo completo. Ahí está el resumen de la noche y los bloqueos.
2. Ver qué quedó hecho:

```
git log nocturno/2026-07-29 --oneline
```

3. Correr los tests sobre la rama:

```
git checkout nocturno/2026-07-29
```
```
python -m pytest -q
```

4. Si todo está verde y el resultado convence, integrar a la rama principal:

```
git checkout main
```
```
git merge nocturno/2026-07-29
```
```
git push
```

5. Si no convence, no se integra. La rama queda ahí y no afecta nada.
