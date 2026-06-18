# KrushRock — Backend (Fase 5)

API REST completa para el simulador inteligente de chancado y selección.

## Stack

| Componente | Tecnología |
|---|---|
| API | FastAPI (Python 3.11+) |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | JWT propio + bcrypt |
| IA | Anthropic Claude API |
| PDF | ReportLab |
| Despliegue | Railway / Render / VPS |

## Estructura

```
krushrock-backend/
├── app/
│   ├── main.py              # App FastAPI + CORS + routers
│   ├── core/
│   │   ├── config.py        # Settings desde .env
│   │   └── supabase.py      # Cliente Supabase singleton
│   ├── routers/
│   │   ├── auth.py          # Login, registro, JWT
│   │   ├── projects.py      # CRUD proyectos
│   │   ├── simulations.py   # Ejecutar y guardar simulaciones
│   │   ├── equipment.py     # Catálogo de equipos
│   │   ├── reports.py       # Generación PDF
│   │   └── opex.py          # Cálculo OPEX standalone
│   └── services/
│       └── simulation_engine.py  # Motor Bond+Whiten+OPEX
├── scripts/
│   ├── supabase_schema.sql  # SQL para crear tablas
│   └── generate_pdf.py      # Generador ReportLab (copiar krushrock_pdf.py)
├── requirements.txt
├── .env.example
└── README.md
```

## Setup local (5 minutos)

### 1. Clonar e instalar
```bash
git clone <tu-repo>/krushrock-backend
cd krushrock-backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Supabase
1. Crear cuenta gratis en [supabase.com](https://supabase.com)
2. Crear nuevo proyecto
3. Ir a **SQL Editor** y ejecutar `scripts/supabase_schema.sql`
4. Copiar URL y claves de **Settings → API**

### 3. Variables de entorno
```bash
cp .env.example .env
# Editar .env con tus claves
```

### 4. Ejecutar
```bash
uvicorn app.main:app --reload --port 8000
```

API disponible en: `http://localhost:8000`
Documentación: `http://localhost:8000/docs`

---

## Despliegue en Railway (recomendado)

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Crear proyecto
railway new

# 4. Configurar variables de entorno en Railway Dashboard

# 5. Desplegar
railway up
```

Railway detecta automáticamente Python y usa `requirements.txt`.

Alternativas: **Render** (render.com) o **Fly.io** — ambos tienen plan gratuito.

---

## Endpoints principales

### Auth
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/auth/register` | Crear cuenta |
| POST | `/api/v1/auth/login` | Login → tokens JWT |
| POST | `/api/v1/auth/refresh` | Renovar token |
| GET  | `/api/v1/auth/me` | Perfil del usuario |

### Proyectos
| Método | Ruta | Descripción |
|---|---|---|
| GET  | `/api/v1/projects/` | Listar proyectos |
| POST | `/api/v1/projects/` | Crear proyecto |
| GET  | `/api/v1/projects/{id}` | Obtener proyecto |
| PUT  | `/api/v1/projects/{id}` | Actualizar |
| DELETE | `/api/v1/projects/{id}` | Eliminar |

### Simulaciones
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/simulations/run` | Ejecutar simulación |
| POST | `/api/v1/simulations/compare` | Comparar 2 escenarios + IA |
| GET  | `/api/v1/simulations/` | Historial |
| GET  | `/api/v1/simulations/{id}` | Detalle |

### Reportes
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/reports/generate` | Generar PDF |
| GET  | `/api/v1/reports/history` | Historial de PDFs |

### OPEX
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/opex/calculate` | Calcular OPEX standalone |
| GET  | `/api/v1/opex/reference-costs` | Costos referenciales Chile |

---

## Límites por plan

| Plan | Simulaciones/mes | Comparaciones | PDF | Proyectos |
|---|---|---|---|---|
| Free | 5 | 2 | — | 3 |
| Pro | 500 | ilimitadas | ✓ | ilimitados |
| Enterprise | ilimitadas | ilimitadas | ✓ white-label | ilimitados |

---

## Variables de entorno requeridas

```env
SECRET_KEY          # openssl rand -hex 32
SUPABASE_URL        # supabase.com → Settings → API
SUPABASE_KEY        # anon key
SUPABASE_SERVICE_KEY # service_role key
ANTHROPIC_API_KEY   # console.anthropic.com
```

---

## Conectar con el frontend React

En el frontend (krushrock-phase2.jsx / fase4.jsx), reemplaza las llamadas directas a la API de Anthropic por llamadas a tu backend:

```javascript
// ANTES (directo a Anthropic — sin autenticación)
const r = await fetch("https://api.anthropic.com/v1/messages", {...})

// DESPUÉS (a través del backend con JWT)
const r = await fetch("https://tu-api.railway.app/api/v1/simulations/run", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("krushrock_token")}`
  },
  body: JSON.stringify({ tph, f80, p80Target, rockType, humidity, circuit, nodes })
})
```

El backend maneja todo: autenticación, límites de plan, guardado en Supabase, análisis IA, y generación de PDF.
