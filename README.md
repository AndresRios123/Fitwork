# FitWork

Aplicación web para registrar y seguir tu entrenamiento: rutinas, sesiones de fuerza, cardio, récords personales, objetivos y un panel con tu progreso.

Proyecto de la asignatura **Electiva III**, desarrollado con **Angular 22**.

---

## Funcionalidades

| Sección | Qué permite hacer |
|---|---|
| **Autenticación** | Registro e inicio de sesión. Las páginas privadas están protegidas |
| **Panel principal** | Resumen del periodo (entrenamientos, volumen, cardio, récords), progreso de fuerza, entrenamiento sugerido, actividad reciente y objetivos |
| **Entrenamientos** | Crear y editar rutinas, y registrar las series de cada sesión |
| **Ejercicios** | Catálogo de ejercicios con búsqueda y filtros por grupo muscular y equipo |
| **Progreso** | Evolución de cada ejercicio a lo largo del tiempo |
| **Cardio** | Registro de actividades (correr, ciclismo, natación…) con duración y distancia |
| **Récords personales** | Mejores marcas por ejercicio, calculadas automáticamente |
| **Objetivos** | Metas de sesiones, distancia o peso, con su porcentaje de avance |
| **Perfil** | Datos personales, foto de perfil, nivel e IMC |

Cada usuario ve **solo sus propios datos**.

---

## Tecnologías

- **Angular 22**: componentes standalone, sin Zone.js (zoneless) y con Signals
- **TypeScript**
- **SCSS** con variables de diseño (colores, tamaños, sombras)
- **Vitest** para las pruebas unitarias
- **Phosphor Icons** y la fuente **Manrope**

---

## Cómo ejecutar el proyecto

### Requisitos
- [Node.js](https://nodejs.org/) 22 o superior
- npm (viene con Node.js)

### Pasos
1. Clonar el repositorio:
   ```bash
   git clone https://github.com/AndresRios123/Fitwork.git
   cd Fitwork
   ```
2. Instalar las dependencias:
   ```bash
   npm install
   ```
3. Iniciar el servidor de desarrollo:
   ```bash
   npm start
   ```
4. Abrir en el navegador: **http://localhost:4200**
5. Crear una cuenta en **Registrarse** y empezar a usar la app.

### Comandos disponibles
| Comando | Qué hace |
|---|---|
| `npm start` | Inicia la app en modo desarrollo |
| `npm run build` | Genera la versión de producción en `dist/` |
| `npm test` | Ejecuta las pruebas unitarias |

---

## Estructura del proyecto

```
src/app/
├── core/                 # Lógica central de la app
│   ├── guards/           # Protección de rutas (sesión, cambios sin guardar)
│   ├── interceptors/     # Interceptores HTTP (token y errores)
│   ├── models/           # Interfaces de datos
│   └── services/         # Autenticación, panel, almacenamiento por usuario
├── features/             # Una carpeta por página
│   ├── auth/             # Login y registro
│   ├── dashboard/        # Panel principal
│   ├── entrenamientos/   # Rutinas y registro de sesiones
│   ├── ejercicios/       # Catálogo
│   ├── progreso/
│   ├── cardio/
│   ├── records/
│   ├── objetivos/
│   └── perfil/
├── layout/               # Estructura visual: sidebar, topbar y shell
└── shared/               # Piezas reutilizables: componentes UI, pipes, validadores y utilidades
```

---

## Buenas prácticas de Angular aplicadas

- **Componentes standalone** y arranque con `bootstrapApplication`
- **Signals** (`signal`, `computed`, `linkedSignal`, `resource`, `toSignal`) y modo **zoneless**
- **`ChangeDetectionStrategy.OnPush`** en los componentes
- **Nuevo control de flujo**: `@if`, `@for` con `track`, `@empty` y `@let`
- **`@defer`** para cargar el gráfico del panel solo cuando hace falta
- **`input()`, `output()` y `model()`** en lugar de `@Input` y `@Output`
- **Patrón Smart/Dumb**: solo los contenedores inyectan servicios
- **Formularios reactivos** con validaciones y validadores propios
- **Inyección con `inject()`** y servicios `providedIn: 'root'`
- **Lazy loading** con `loadComponent` en todas las páginas
- **Guards funcionales** (`canActivate`, `canDeactivate`)
- **Pipes propios** (por ejemplo, `duracion`: `95` → "1 h 35 min")

---

## Sobre los datos

Por ahora la app **no tiene backend**. Las cuentas y los datos se guardan en el `localStorage` del navegador, separados por usuario.

>  Las contraseñas se guardan cifradas con SHA-256, pero como todo vive en el navegador **no es seguridad real**. Es una simulación mientras se construye la API.

La app está preparada para conectarse a un backend: la autenticación (`AuthApi`) y el panel (`DashboardApi`) funcionan detrás de una interfaz. Para usar una API real solo hay que crear la nueva implementación y cambiarla en `app.config.ts`.

---

## Pruebas

```bash
npm test
```

El proyecto cuenta con pruebas unitarias para servicios, guards, cálculos y componentes.

---

## Flujo de trabajo con Git

- `main`: versión estable
- `develop`: integración de las funcionalidades
- `feature/<nombre>`: una rama por funcionalidad (por ejemplo, `feature/dashboard`)

Cada funcionalidad se integra a `develop` mediante un **Pull Request**.

---

## 👥 Equipo

| Integrante | GitHub |
|---|---|
| Andres Camilo Rios Maya | [@AndresRios123](https://github.com/AndresRios123) |
| Daniel Alejandro Mafla Figueroa | [@DanielMafla320](https://github.com/DanielMafla320) |
