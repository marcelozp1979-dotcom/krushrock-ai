# Clases de equipo — borrador para aprobación de Marcelo

Implementa DECISIONS.md D-23: el modo simple recomienda **clases definidas por tamaño físico**,
no marcas ni modelos.

**Estado: BORRADOR.** Nada se implementa hasta que Marcelo apruebe o corrija esta lista.

---

## Cómo se lee esta tabla

Cada clase necesita una **máquina de referencia** cuyos datos de manual le dan la física: curva
de capacidad (tph vs CSS), rango de CSS, boca de entrada o área de criba. Sin ese ancla la clase
no sirve para calcular.

- **Curva ✔** = tiene tabla de capacidad tph vs CSS del manual oficial.
- **Curva ✘** = el modelo está en el catálogo pero sin tabla de capacidad con fuente.

---

## 1 · Mandíbulas — clase por abertura de boca (ancho × alto, mm)

| Clase | Referencia | Abertura | CSS | Capacidad | Curva | Fuente abertura |
|---|---|---|---|---|---|---|
| **Mandíbula 900×600** | Terex Finlay J-960 | **900×600 mm** | 40–125 mm | 65–160 tph | ✔ | Manual Rev 5.2 p.4-4 (PDF p.88) |
| **Mandíbula 1000×600** | Terex Finlay J-1160 | **1000×600 mm** | 40–145 mm | 150–280 tph | ✘ | Manual Rev 4.8 p.3-11 (PDF p.85) |
| **Mandíbula 1100×700** | Terex Finlay J-1170 | **1100×700 mm** | 50–150 mm | 90–290 tph | ✔ | Manual Rev 1.0 p.3-13 (PDF p.61) |
| **Mandíbula 1070×762** | Terex Finlay J-1175 | **1070×762 mm** | 50–175 mm | 113–452 tph | ✔ | Manual Rev 8.8 p.4-4 (PDF p.91) |
| **Mandíbula 1400×760** | Terex Finlay J-1480 | **1397×762 mm** | 100–200 mm | — | ✘ | Manual Rev 291116-10 IT-3 (PDF p.50) |

**Estado T-29 (2026-10-08):**

- **J-960:** abertura confirmada **900×600 mm** — Manual Rev 5.2 p.4-4 (PDF p.88). Cargado al catálogo.
- **J-1160:** abertura confirmada **1000×600 mm** — Manual Rev 4.8 p.3-11 (PDF p.85). Cargado al catálogo. Sin tabla de capacidad tph en Rev 4.8 (B-MJ02).
- **J-1170:** abertura confirmada **1100×700 mm** — Manual Rev 1.0 p.3-13 (PDF p.61). Cargado al catálogo.
- **J-1175:** abertura confirmada **1070×762 mm** — Manual Rev 8.8 p.4-4 (PDF p.91). Ya estaba en catálogo desde T-28.
- **J-1480:** abertura confirmada **1397×762 mm** — Manual Rev 291116-10 IT-3 (PDF p.50). Cargado al catálogo. Sin tabla de capacidad tph en Rev 291116-10 (B-MJ04).
- **J-1280:** sin manual disponible (B-MJ05). La clase J-1280 queda sin abertura física hasta obtener el manual.

---

## 2 · Conos — clase por diámetro de cabeza

| Clase | Referencia | Cabeza | CSS | Capacidad | Curva | Fuente diámetro |
|---|---|---|---|---|---|---|
| **Cono 1000 mm (≈40")** | Terex Finlay C-1540 | **1000 mm (40")** | 19–32 mm | 125–220 tph | ✔ + curva de producto digitalizada | Folleto oficial Terex 2022 |
| **Cono 1150 mm (≈45")** | Terex Finlay C-1545 | **1150 mm (45")** | 18–45 mm | 175–240 tph | ✘ (el manual solo da rangos globales) | Manual Rev 5.1 p.3-17 (PDF p.95) |
| **Cono 1300 mm (≈52")** | Terex Finlay C-1550+ | **1300 mm (52")** | 22–50 mm | 250–589 tph | ✔ (15 puntos, la mejor tabla del catálogo) | Manual Rev 1.4 p.3-12 (PDF p.76) |

**Estado T-29 (2026-10-08):** diámetros de cabeza confirmados de sus fuentes oficiales.
- C-1540: **1000 mm (40")** — Folleto oficial Terex Finlay C-1540 (2022). Cargado al catálogo.
- C-1545: **1150 mm (45")** — Manual Rev 5.1 p.3-17 (PDF p.95). Ya estaba desde T-28.
- C-1550+: **1300 mm (52")** — Manual Rev 1.4 p.3-12 (PDF p.76), modelo TC 1300X. Ya estaba desde T-28.

---

## 3 · Seleccionadoras — clase por dimensión de criba y número de decks

| Clase | Referencia | Criba | Área por deck | Decks |
|---|---|---|---|---|
| **Seleccionadora 3,65×1,5 m · 2 decks** | Terex Finlay 683 | 3,65 × 1,5 m | 5,48 m² | 2 |
| **Seleccionadora 4,3×1,7 m · 2 decks** | Terex Finlay 684 | 4,3 × 1,7 m | 7,31 m² | 2 |
| **Seleccionadora 4,3×1,7 m · 3 decks** | Terex Finlay 684 | 4,3 × 1,7 m | 7,31 m² | 3 |
| **Seleccionadora 6,1×1,52 m · 3 decks** | Terex Finlay 694+ | 6,1 × 1,524 m | 9,29 m² | 3 |
| **Seleccionadora 6,1×1,70 m · 3 decks** | Terex Finlay 696 | 6,1 × 1,70 m | 10,37 m² | 3 |

Las cinco tienen área verificada contra manual y capacidad calculable por el método VSMA. **Es el
grupo mejor resuelto.**

---

## 4 · Impactores — CSS parcialmente resuelto (T-28)

Procesados 3 manuales en T-28: I-120RS, I-130RS, I-140RS. El "CSS" de un impactor HSI equivale
a la apertura de la **rampa A (inferior)**.

| Clase propuesta | Referencia | Apertura | Rotor | Rampa A (CSS) | Curva |
|---|---|---|---|---|---|
| *Impactor 1000mm* | Terex Finlay I-110RS | 990×1020 mm | 1000 mm | **sin dato** (Tier 3 2015) | ✘ |
| *Impactor 1040mm* | Terex Finlay I-120RS | 1130×800 mm | **1040 mm** | **20–75 mm** | ✘ |
| *Impactor 1270mm* | Terex Finlay I-130RS | 1100×1240 mm | 1270×1220 mm | **sin dato** (Tier 3 2008) | ✘ |
| *Impactor 1270mm* | Terex Finlay I-140RS | 1270×1000 mm | **1270 mm** | **20–75 mm** | ✘ |

**Limitaciones:**
- I-110RS y I-130RS: sus manuales Tier 3 no incluyen rangos de rampa en mm (B-IM04).
- Ningún impactor tiene tabla de tph publicada en los manuales: no hay curva de capacidad.
- Los css_min/css_max del catálogo para I-120RS e I-140RS ya se actualizaron con la rampa A.
- **El modo simple sigue sin poder recomendar impactores:** falta curva de capacidad tph.

---

## 5 · Resumen honesto

| Familia | Clases sólidas hoy | Bloqueadas por falta de dato |
|---|---|---|
| Mandíbulas | 3 | 2 (J-1280 sin abertura; J-1480 y J-1160 tienen abertura pero sin curva de capacidad) |
| Conos | 3 | 0 |
| Seleccionadoras | 5 | 0 |
| Impactores | 0 | todas (falta curva tph) |

**Once clases sólidas** (con física completa: abertura, CSS, curva de capacidad).

**Pendiente tras T-29:**
1. J-1280: sin manual (B-MJ05). Abertura desconocida.
2. J-1480 y J-1160: abertura confirmada y cargada; sin tabla de capacidad tph en los manuales disponibles (B-MJ04, B-MJ02).
3. Impactores: CSS parcialmente cargado (I-120RS, I-140RS) pero sin tabla tph → no recomendables en modo simple.

---

## 6 · Decisiones que Marcelo debe tomar

1. **¿Nomenclatura en milímetros o en pies?** La tabla usa milímetros ("Cono 1000 mm"). En Chile
   suele hablarse de "cono de 3 pies". Se puede mostrar ambas.
2. **¿Se muestra la máquina de referencia al cliente?** D-23 lo permite como dato informativo.
   Decidir si aparece en pantalla, solo en el PDF, o en ninguno.
3. **¿Se lanza el modo simple con nueve clases**, o se espera a completar los cuatro datos
   faltantes?
