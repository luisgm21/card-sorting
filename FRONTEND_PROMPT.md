# 🎯 Card Sorting App — Frontend Prompt para Agente

---

## 📌 Descripción General

Generar un frontend web completo para una aplicación de **Card Sorting** (Ordenamiento de Tarjetas), una técnica de UX Research donde los participantes clasifican tarjetas en categorías para ayudar a diseñar la arquitectura de información de un sitio web.

**Backend existente:** API REST en Node.js/Express + MongoDB (puerto 3000).  
**Frontend a generar:** SPA moderna, responsive, con autenticación y flujo completo.

---

## 🧱 Stack Tecnológico Recomendado

- **Framework:** React + Vite (o Next.js si se prefiere SSR)
- **Ruteo:** React Router v6
- **HTTP Client:** Fetch API nativa o Axios
- **UI:** TailwindCSS + una librería de componentes (shadcn/ui, Material UI, o DaisyUI)
- **Drag & Drop:** @hello-pangea/dnd (fork de react-beautiful-dnd) o dnd-kit
- **Estado global:** Context API (suficiente para este alcance) o Zustand

---

## 🔗 Datos de Conexión

```
API_BASE_URL = http://localhost:3000/api
```

---

## 🧩 Modelos de Datos

### User
```typescript
interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'researcher' | 'participant';
  organization?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Study
```typescript
interface Card {
  id: string;
  text: string;
  description?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface StudySettings {
  maxCardsPerCategory: number | null;
  minCardsPerCategory: number;
  allowUncategorized: boolean;
  timeLimit: number | null;       // en minutos
  shuffleCards: boolean;
}

interface Study {
  _id: string;
  title: string;
  description: string;
  cards: Card[];
  predefinedCategories?: Category[];
  type: 'open' | 'closed' | 'hybrid';
  settings: StudySettings;
  status: 'draft' | 'published' | 'closed' | 'archived';
  startDate?: string;
  endDate?: string;
  createdBy: { _id: string; name: string; email: string };
  totalParticipants: number;
  shareableLink: string;
  createdAt: string;
  updatedAt: string;
}
```

### Participation
```typescript
interface SortingResult {
  assignments: Record<string, string>;   // { cardId: categoryId }
  customCategories?: Category[];
  timeSpent?: number;                     // segundos
  cardOrder?: string[];
  comments?: string;
  difficulty?: number;                    // 1-5
}

interface Participation {
  _id: string;
  studyId: { _id: string; title: string; type: string; cards?: Card[] };
  userId?: { _id: string; name: string; email: string } | null;
  anonymousId?: string;
  sortingResult?: SortingResult;
  status: 'started' | 'completed' | 'abandoned';
  deviceInfo?: { userAgent: string; ip: string; browser: string; os: string };
  startedAt: string;
  completedAt?: string;
  consentGiven: boolean;
}
```

### Analytics (respuesta de endpoints)
```typescript
interface StudyAnalytics {
  study: {
    id: string;
    title: string;
    type: string;
    status: string;
    totalParticipants: number;
    cardsCount: number;
  };
  participations: {
    total: number;
    completed: number;
    abandoned: number;
    completionRate: number;          // porcentaje 0-100
  };
}

interface StudyResults {
  studyTitle: string;
  totalResponses: number;
  averageTime: number;               // segundos
  coOccurrenceMatrix: Record<string, Record<string, number>>;
  results: Participation[];
}
```

---

## 🔐 Autenticación

El backend usa **JWT** (JSON Web Tokens).

### Flujo:
1. **Login:** `POST /api/auth/login` → devuelve el usuario (pero actualmente NO devuelve token)
2. **Registro:** `POST /api/auth/register`
3. **Todas las rutas protegidas** requieren header:
```
Authorization: Bearer <token>
```

### ⚠️ Importante para el agente frontend:
El backend actualmente **no genera el token JWT en el login**.  
**El agente frontend DEBE modificar el `AuthController.login`** para que devuelva el token generado con `generateToken(user)` del `authMiddleware.mjs`.

El flujo correcto debe ser:
```json
// POST /api/auth/login → Response
{
  "success": true,
  "data": { "user": { ... }, "token": "eyJhbGciOiJIUzI1NiIs..." }
}
```

**El agente frontend debe editar** `src/controllers/AuthController.mjs` para incluir el token en la respuesta del login y register.

---

## 📋 Endpoints de la API (Completos)

### 🔐 Auth (`/api/auth`)
| Método | Endpoint | Auth | Body |
|--------|----------|------|------|
| POST | `/auth/register` | ❌ | `{ name, email, password, role?, organization? }` |
| POST | `/auth/login` | ❌ | `{ email, password }` |
| PUT | `/auth/change-password` | ✅ | `{ currentPassword, newPassword }` |

### 👤 Users (`/api/users`)
| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/users/profile` | ✅ | Perfil propio |
| PUT | `/users/profile` | ✅ | Actualizar `{ name?, organization? }` |
| GET | `/users` | admin | `?role=&isActive=` |
| GET | `/users/:id` | admin | - |
| PATCH | `/users/:id/deactivate` | admin | - |
| DELETE | `/users/:id` | admin | - |

### 📊 Studies (`/api/studies`)
| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/studies` | researcher/admin | Crear |
| GET | `/studies` | ✅ | Listar (`?status=&type=`) |
| GET | `/studies/:id` | ✅ | Detalle |
| PUT | `/studies/:id` | researcher/admin | Actualizar (solo draft) |
| PATCH | `/studies/:id/publish` | researcher/admin | Publicar |
| PATCH | `/studies/:id/close` | researcher/admin | Cerrar |
| PATCH | `/studies/:id/archive` | researcher/admin | Archivar |
| DELETE | `/studies/:id` | researcher/admin | Eliminar |
| GET | `/studies/public/:link` | ✅ | Vista pública para participantes |
| GET | `/studies/:id/analytics` | researcher/admin | Analíticas |

### 🎯 Participations (`/api/participations`)
| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/participations/start` | opcional | `{ studyLink, consentGiven }` |
| GET | `/participations/:id` | ✅ | Detalle |
| PUT | `/participations/:id/complete` | ❌ | Enviar resultados |
| PATCH | `/participations/:id/abandon` | ✅ | Abandonar |
| GET | `/participations/studies/:studyId/participations` | ✅ | Lista por estudio (`?status=`) |
| GET | `/participations/studies/:studyId/results` | ✅ | Resultados con matriz de co-ocurrencia |

### Health
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/health` | `{ success: true, message: "API funcionando" }` |

---

## 🖥️ Pantallas / Vistas Requeridas

### 1. Login / Register
- Formulario de login (email + password)
- Formulario de registro con campos: nombre, email, password, rol (select: researcher/participant), organización (opcional)
- Link para cambiar entre login y registro
- **Importante:** Guardar el token JWT en localStorage y enviarlo en todas las requests

### 2. Dashboard (home)
- Tarjetas resumen: cantidad de estudios, participantes totales, tasa de finalización
- Lista de estudios del usuario logueado con estado (draft, published, closed)
- Botón "Nuevo Estudio"
- Filtros por estado y tipo

### 3. Crear / Editar Estudio (formulario)
- Título, descripción
- Tipo: open / closed / hybrid (radio o select)
- Gestión de tarjetas: agregar, editar, eliminar tarjetas (cada una con id, texto, descripción opcional)
- Categorías predefinidas (solo visible si type es closed o hybrid)
- Configuración: toggle de opciones (shuffle, allowUncategorized), límites (min/max por categoría), límite de tiempo
- Botón Guardar (crea en draft)
- Botón Publicar (cambia a published)

### 4. Detalle del Estudio
- Información completa del estudio
- Link compartible (para copiar al portapapeles)
- Pestañas o secciones:
  - **Participaciones:** tabla con lista de participaciones (usuario/anónimo, estado, fecha)
  - **Analíticas:** cards con total, completados, abandonados, tasa de finalización
  - **Resultados:** matriz de co-ocurrencia visual (tabla o heatmap)

### 5. Vista de Card Sorting (Participante)
**Esta es la pantalla principal para los participantes.**  
Acceden mediante un link compartible.

Flujo:
1. Pantalla de bienvenida con título, descripción y checkbox de consentimiento
2. Al aceptar, se inicia la participación (`POST /participations/start`)
3. Según el tipo de estudio:
   - **Open:** el participante crea sus propias categorías
   - **Closed:** arrastra tarjetas a categorías predefinidas
   - **Hybrid:** arrastra a categorías predefinidas o crea nuevas
4. Área de **Drag & Drop**:
   - Tarjetas apiladas o en columna desde la izquierda
   - Categorías como columnas o contenedores donde soltar las tarjetas
   - Las tarjetas deben poder arrastrarse entre categorías
5. Opcional: slider de dificultad (1-5), campo de comentarios
6. Botón "Finalizar" → `PUT /participations/:id/complete`

### 6. Perfil de Usuario
- Ver datos propios
- Editar nombre y organización
- Cambiar contraseña

### 7. Admin: Gestión de Usuarios
- Tabla de usuarios con roles
- Botón para desactivar/activar
- Eliminar usuario

---

## 🎨 Apariencia y UX

- Diseño **moderno, limpio y profesional**
- Colores: usar una paleta que transmita profesionalismo (azules, verdes, tonos neutros)
- **Responsive** (funcional en desktop y tablet)
- Indicadores de carga (spinners/skeletons)
- Toasts/notificaciones para feedback de acciones
- Modal de confirmación para acciones destructivas (eliminar estudio, etc.)
- La experiencia de drag & drop debe ser fluida y con animaciones suaves

---

## 📁 Estructura de Archivos Sugerida para el Frontend

```
card-sorting-frontend/
├── src/
│   ├── api/                    # Llamadas HTTP (axios/fetch)
│   │   ├── client.js           # Instancia con base URL + interceptor JWT
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── studies.js
│   │   └── participations.js
│   ├── components/
│   │   ├── ui/                 # Componentes genéricos (Button, Modal, Toast, etc.)
│   │   ├── layout/             # Navbar, Sidebar, Footer
│   │   ├── studies/            # StudyForm, StudyCard, StudyList
│   │   └── sorting/            # CardDrag, CategoryDropZone, ResultsMatrix
│   ├── context/
│   │   └── AuthContext.jsx     # Contexto de autenticación
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── StudyCreate.jsx
│   │   ├── StudyDetail.jsx
│   │   ├── StudyEdit.jsx
│   │   ├── StudySort.jsx       # La vista de card sorting para participantes
│   │   ├── Profile.jsx
│   │   └── AdminUsers.jsx
│   ├── hooks/
│   ├── utils/
│   └── App.jsx
├── package.json
├── vite.config.js
├── tailwind.config.js
└── index.html
```

---

## ⚠️ Consideraciones Importantes para el Agente Frontend

1. **El backend existe y funciona.** No crear nuevo backend. El agente puede modificar **solo** el `AuthController.mjs` para agregar el token JWT en login/register.

2. **Formato de respuestas:** Todas las respuestas de la API tienen `{ success: boolean, data?: any, message?: string, errors?: [{ field, message }] }`.

3. **El campo `role` del usuario determina qué rutas puede ver:**
   - `admin` → todo
   - `researcher` → CRUD estudios propios, ver analíticas
   - `participant` → solo completar estudios por link

4. **El `shareableLink`** se genera automáticamente al crear el estudio. Usar ese link para la URL pública de participación.

5. **No hay CORS configurado para desarrollo** — asegurarse de que el frontend corra en un puerto diferente y el backend tenga CORS habilitado (ya está con `cors()` en app.mjs).

6. **Errores HTTP:** El backend devuelve códigos HTTP estándar (400, 401, 403, 404, 409, 500). Manejar todos en el frontend.

---

## 📦 Archivos del Backend que el Agente Frontend Puede Necesitar Leer

```
server.mjs                    → Entry point
src/app.mjs                   → Configuración de Express, CORS, rutas
src/middleware/authMiddleware.mjs → generateToken(), authenticate, authorize
src/controllers/AuthController.mjs  → MODIFICAR para incluir token en login/register
src/controllers/StudyController.mjs
src/controllers/ParticipationController.mjs
src/validators/               → Para ver los campos requeridos de cada endpoint
```

---

## ✅ Criterios de Aceptación

- [ ] Login y registro funcionales con JWT
- [ ] Dashboard con lista de estudios y resumen
- [ ] Crear estudio con formulario completo
- [ ] Editar estudio en estado draft
- [ ] Publicar / cerrar / archivar estudio
- [ ] Vista pública del estudio por link compartible
- [ ] Card Sorting funcional con drag & drop
- [ ] Completar participación y enviar resultados
- [ ] Ver resultados con matriz de co-ocurrencia
- [ ] Perfil de usuario y cambio de contraseña
- [ ] Admin: gestión de usuarios
- [ ] Diseño responsive
- [ ] Manejo de errores y estados de carga
