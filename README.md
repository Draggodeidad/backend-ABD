# 📅 BDA — Backend del Sistema de Generación Automática de Cronogramas

> API REST construida con **Express.js + TypeScript** para la generación automática de horarios académicos, optimizando la asignación de tiempos según disponibilidad docente, prioridad de materias y equidad de carga semanal.

---

## 📋 Tabla de Contenidos

- [Descripción del Proyecto](#-descripción-del-proyecto)
- [Funcionalidades Clave](#-funcionalidades-clave)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Variables de Entorno](#-variables-de-entorno)
- [Scripts Disponibles](#-scripts-disponibles)
- [Documentación de la API](#-documentación-de-la-api)
- [Calidad de Código](#-calidad-de-código)

---

## 📖 Descripción del Proyecto

**BDA** es el servicio backend de una aplicación web orientada a la automatización de cronogramas académicos. El sistema cruza la disponibilidad de múltiples docentes con las necesidades de los grupos, aplicando un algoritmo que respeta restricciones horarias, prioridades curriculares y garantiza la equidad en la distribución de carga lectiva.

---

## ✨ Funcionalidades Clave

### 1. 🤖 Automatización y Priorización
El motor de generación cruza la disponibilidad de los docentes con los requerimientos de cada grupo, asignando bloques horarios en función de la importancia y prioridad de cada asignatura dentro del plan de estudios.

### 2. 🚦 Gestión de Restricciones
Control estricto de:
- **Ventanas de tiempo** permitidas por docente.
- **Límite de horas diarias** por docente.
- **Detección y validación de conflictos** para garantizar que ningún docente o grupo tenga solapamientos.

### 3. ⚖️ Equidad de Carga Semanal
El algoritmo garantiza el cumplimiento del plan de estudios en horas totales semanales. Cuando un grupo tiene días no laborables, el sistema **redistribuye dinámicamente** esa carga entre los días disponibles restantes, asegurando que todos los grupos reciban las mismas horas efectivas por semana.

---

## 🛠️ Stack Tecnológico

| Categoría        | Tecnología                                         |
|------------------|----------------------------------------------------|
| Runtime          | [Node.js](https://nodejs.org/)                     |
| Lenguaje         | [TypeScript 5](https://www.typescriptlang.org/)    |
| Framework        | [Express.js 4](https://expressjs.com/)             |
| Logging          | [Pino](https://getpino.io/) + pino-http            |
| Documentación    | [Swagger UI](https://swagger.io/tools/swagger-ui/) + swagger-jsdoc |
| Seguridad        | [Helmet](https://helmetjs.github.io/) + CORS       |
| Variables de Env | [dotenv](https://github.com/motdotla/dotenv)       |
| Linter           | [ESLint](https://eslint.org/) + typescript-eslint  |
| Formateador      | [Prettier](https://prettier.io/)                   |
| Compilación Dev  | [tsx](https://github.com/privatenumber/tsx) (watch mode) |

---

## 📁 Estructura del Proyecto

```
back-bda/
├── src/
│   ├── app.ts                  # Configuración principal de Express
│   ├── server.ts               # Punto de entrada del servidor
│   ├── config/                 # Variables de entorno y configuración
│   ├── controllers/            # Controladores HTTP (lógica de rutas)
│   ├── services/               # Lógica de negocio y algoritmo de generación
│   ├── repositories/           # Acceso a datos / persistencia
│   ├── models/                 # Definición de modelos de datos
│   ├── routes/                 # Definición de rutas de la API
│   ├── middlewares/            # Middlewares personalizados (auth, errores, etc.)
│   ├── docs/                   # Definición de la especificación Swagger/OpenAPI
│   ├── types/                  # Tipos e interfaces TypeScript compartidos
│   └── utils/                  # Funciones auxiliares y helpers
├── tests/                      # Pruebas unitarias e integración
├── .env                        # Variables de entorno locales (no versionado)
├── .env.example                # Plantilla de variables de entorno
├── .prettierrc                 # Configuración de Prettier
├── eslint.config.mjs           # Configuración de ESLint
├── tsconfig.json               # Configuración de TypeScript
└── package.json
```

---

## ✅ Requisitos Previos

- **Node.js** `>= 18.x`
- **npm** `>= 9.x`

---

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd back-bda
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
# Edita .env con tus valores
```

### 4. Iniciar el servidor en modo desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:<PORT>`.

---

## 🔐 Variables de Entorno

Copia `.env.example` como `.env` y configura las siguientes variables:

```env
PORT=          # Puerto en el que correrá el servidor
NODE_ENV=      # Entorno: development | production
# Agrega aquí las demás variables requeridas según .env.example
```

---

## 📜 Scripts Disponibles

| Comando              | Descripción                                              |
|----------------------|----------------------------------------------------------|
| `npm run dev`        | Inicia el servidor en modo desarrollo con hot-reload     |
| `npm run build`      | Compila TypeScript a JavaScript en `/dist`               |
| `npm start`          | Ejecuta el servidor en producción desde `/dist`          |
| `npm run type-check` | Verifica tipos sin emitir archivos                       |
| `npm run lint`       | Analiza el código con ESLint                             |
| `npm run lint:fix`   | Corrige automáticamente los errores de ESLint            |
| `npm run format`     | Formatea el código con Prettier                          |
| `npm run format:check` | Verifica el formato sin aplicar cambios               |

---

## 📚 Documentación de la API

La documentación interactiva de la API (Swagger UI) está disponible una vez que el servidor está corriendo:

```
http://localhost:<PORT>/api-docs
```

---

## 🧹 Calidad de Código

El proyecto utiliza **ESLint** y **Prettier** integrados para garantizar consistencia y calidad:

- **ESLint** con `@typescript-eslint` para análisis estático.
- **Prettier** con `eslint-plugin-prettier` para formateo automático.
- **`eslint-config-prettier`** para evitar conflictos entre ambas herramientas.

Antes de hacer un commit, se recomienda ejecutar:

```bash
npm run lint:fix && npm run format
```

---

## 📄 Licencia

ISC
