# Datos extraídos de manuales oficiales — Conveyor Terex Finlay

Datos del manual de operación guardado en `manuales/Conveyor/`.
Los PDF no se suben al repositorio (DECISIONS.md D-16); este documento sí.

---

## Estado del catálogo

El TC-80 **no existe en el catálogo actual** (`app/routers/equipment.py`). Este documento registra las especificaciones del manual para una futura decisión de incorporación.

---

## TC-80

**Fuente:** Manual de funcionamiento Rev 3.6, 08-08-2023.  
**Total páginas:** 547.

### Especificaciones del manual

| Dato | Valor | Página manual |
|---|---|---|
| Tipo | Transportador con orugas (tracked conveyor) | 3-2 (p.62 PDF) |
| Peso (máquina estándar) | **16,750 kg** | 3-2 (p.62 PDF) |
| Longitud del transportador | **23.5 m** | 3-2 (p.62 PDF) |
| Ancho de cinta | **1050 mm** (41") | 3-2 (p.62 PDF) |
| Altura de descarga (@ 25°) | Hasta **10.5 m** (34'6") | 3-2 (p.62 PDF) |
| Altura de tolva (@ 24°-28°) | 1.06–2.0 m | 3-2 (p.62 PDF) |
| Capacidad | Hasta **600 t/h** | 3-2 (p.62 PDF) |
| Tipo de correa | EP400, 3 capas, 4+2 | 3-2 (p.62 PDF) |
| Motor Tier 3 | Deutz D2011, **36.4 kW (49 hp)** | 3-2 (p.62 PDF) |
| Motor Tier 4 / Fase V | Deutz TD 2.9, **45 kW (60 hp)** | 3-2 (p.62 PDF) |
| Depósito combustible | 200 L | 3-2 (p.62 PDF) |
| Orugas | 4m centro a centro, 400mm zapata | 3-3 (p.63 PDF) |
| Velocidad orugas (lento) | 0.9 km/h | 3-3 (p.63 PDF) |
| Velocidad orugas (rápido) | 1.6 km/h | 3-3 (p.63 PDF) |
| Dimensiones transporte | 11.88m largo, 2.26m ancho, 2.54m alto | 3-2 (p.62 PDF) |
| Contenedor | Envío en contenedor High Cube 40' × 9'6" | 3-2 (p.62 PDF) |

### Opciones disponibles (listadas en manual)

- Revestimientos tolva (placa AR400 o goma 20mm)
- Extensión de tolva
- Cinta chevrón
- Raspador de cinta
- Cubiertas antipolvo
- Supresión de polvo por atomización
- Faldones de longitud completa
- Tolva grande con cama de impacto
- Transportador con imán (accionamiento hidráulico o eléctrico)

### Catálogo actual

El TC-80 no existe en el catálogo. Para incorporarlo se requiere decisión de Marcelo sobre categoría (el catálogo no tiene tipo "conveyor" actualmente) y si los datos del manual son suficientes para dimensionamiento.

---

## Bloqueos registrados de esta sesión

- **B-CO01:** El TC-80 no está en el catálogo y el catálogo no tiene tipo "conveyor" definido. Agregar el TC-80 requiere: (1) crear nuevo tipo de equipo, (2) definir campos relevantes para el simulador (¿aporta tph? ¿CSS? ninguno), (3) decidir si el conveyor participa en el circuito de simulación o es solo logística de planta. Requiere decisión de Marcelo antes de cualquier acción.
