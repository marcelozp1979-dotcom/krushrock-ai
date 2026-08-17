# Procedimiento de extracción de datos desde manuales de fabricante

Cómo sacar datos técnicos de un manual PDF y llevarlos al catálogo sin inventar nada.
Escrito para que lo ejecute Claude Code de forma repetible.

---

## Regla que manda sobre todo

**Si un dato no está en el manual, no se carga.** No se estima, no se interpola desde otro
modelo, no se "ajusta para que calce". Se deja el campo vacío y se anota en `MEMORY.md` qué
falta y de qué modelo.

---

## Paso 1 · Extraer el texto de la sección técnica

Los datos viven en la sección 3, "Datos técnicos" / "Technical Data", típicamente entre las
páginas 30 y 130 del PDF.

```
pdftotext -layout -f 30 -l 130 "manuales/<carpeta>/<archivo>.pdf" /tmp/<modelo>.txt
```

Si no aparece nada útil, extraer el manual completo (más lento) y buscar el índice.

## Paso 2 · Localizar las tablas

Buscar en el texto extraído, en español y en inglés:

```
Tonelaje típico | Producción estimada | Salida típica | Rendimiento previsto
Estimated Machine Output | Metric Ton per Hour
Tamaño máximo de alimentación | Maximum Feed Size
CSS mínima recomendada | Minimum Recommended Setting
```

## Paso 3 · Registrar SIEMPRE la fuente exacta

Cada dato cargado al catálogo lleva su `capacity_source` con esta forma:

```
"Manual Terex Finlay <MODELO> Rev <X.Y> (<fecha>), Tabla <N> p.<página> — <configuración>"
```

Sin este campo el equipo no puede usarse para recomendar (REQUISITOS.md RF-10).

## Paso 4 · Anotar la configuración

Un mismo modelo tiene varias configuraciones (excéntrico largo/corto, cóncavo XC/MC/Finos).
**Producen capacidades distintas.** Hay que declarar cuál representa la entrada del catálogo,
igual que se hizo con el C-1540 en DECISIONS.md D-15.

## Paso 5 · Curvas de producto

Vienen como **gráfico**, no como tabla. Procedimiento:

1. Encontrar la página física del gráfico.
2. Renderizar a alta resolución y recortar el área del gráfico:
   ```
   pdftoppm -f <pag> -l <pag> -r 900 -x <X> -y <Y> -W <ancho> -H <alto> -png "<pdf>" /tmp/graf
   ```
3. Leer el % pasante de cada curva en los tamaños del eje.
4. **Registrar la precisión estimada.** Una lectura visual no es un dato de tabla: si el valor
   tiene ±5 puntos de error, se dice.

## Paso 6 · Comparar contra el catálogo antes de escribir

Antes de modificar nada, generar la tabla comparativa "valor actual vs valor del manual".
Los errores encontrados hasta ahora van en las dos direcciones —el C-1540 estaba sobreestimado,
el C-1550+ subestimado a menos de la mitad—, así que no asumir un sentido del error.

## Paso 7 · Verificar

1. `python -m pytest -q` — los tests de coherencia del catálogo deben seguir verdes.
2. Anotar en `MEMORY.md` qué casos de validación cambiaron de resultado.
3. **Nunca ajustar un caso de validación para que calce con el dato nuevo.** Si un caso se
   rompe, se reporta y se detiene.

---

## Estado de los manuales disponibles

Carpeta `manuales/`, 24 manuales oficiales Finlay aportados por Marcelo.

| Carpeta | Modelos | Estado |
|---|---|---|
| Conos | C-1540, C-1540RS, C-1545, C-1550+ | C-1540, C-1545 y C-1550+ extraídos → `docs/DATOS_MANUALES_CONOS.md` |
| Mandíbulas | J-960, J-1160, J-1170, J-1175, J-1480 | Pendiente. Verificar contra los datos ya cargados. |
| Seleccionadoras | 595, 683, 684, 694+, 696 | Pendiente. Es lo que más falta: hoy no hay ningún dato con fuente. |
| Scalpers | 863+, 873+, 883+, 893+ | Pendiente. No existen en el catálogo. |
| Impactores | I-110RS, I-120/120RS, I-130RS, I-140/140RS, IC-100/100RS | Pendiente. Los 16 impactores del catálogo no declaran CSS. |
| Conveyor | TC-80 | Pendiente. No existe categoría en el catálogo. |

**Sin manual:** C-1554 y todos los modelos de otras marcas (Powerscreen, Metso, Sandvik,
Kleemann). Sus datos actuales no tienen fuente.
