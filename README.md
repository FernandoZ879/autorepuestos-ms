# 🔧 AutoParts Pro - Sistema de Gestión de Inventarios y E-commerce

Sistema distribuido de gestión de inventarios para repuestos automotrices basado en arquitectura de **microservicios**, con frontend moderno y panel de administración integrado.

---

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Ejecución](#-instalación-y-ejecución)
- [Endpoints de la API](#-endpoints-de-la-api)
- [Funcionalidades](#-funcionalidades)
- [Credenciales de Prueba](#-credenciales-de-prueba)
- [Desarrollo](#-desarrollo)

---

## 🎯 Descripción General

**AutoParts Pro** es una plataforma completa de e-commerce y gestión de inventarios diseñada específicamente para empresas de repuestos automotrices. El sistema implementa una arquitectura de microservicios que permite escalabilidad, mantenibilidad y resiliencia.

### Características Principales

- ✅ **Arquitectura de Microservicios** - Servicios independientes y desacoplados
- ✅ **Autenticación JWT** - Seguridad con tokens y contraseñas hasheadas (bcrypt)
- ✅ **Panel de Administración** - Gestión completa de productos, inventario y pedidos
- ✅ **E-commerce Moderno** - Interfaz de usuario atractiva y responsiva
- ✅ **Multi-Base de Datos** - PostgreSQL independiente por microservicio
- ✅ **API Gateway** - Punto de entrada unificado con enrutamiento inteligente
- ✅ **Importación Masiva** - Carga de productos mediante archivos Excel
- ✅ **Sistema de Reportes** - Análisis y visualización de datos

---

## 🏗 Arquitectura del Sistema

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     CAPA DE PRESENTACIÓN                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend Cliente (Nginx:8081)    Frontend Admin (Nginx)   │
│        - Catálogo de productos         - Gestión productos │
│        - Carrito de compras            - Gestión inventario │
│        - Autenticación                 - Reportes          │
│                                                              │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY (3010)                      │
│                   - Enrutamiento de peticiones              │
│                   - Rate limiting                           │
│                   - CORS management                         │
└──────────────────────┬───────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Auth (3001)│ │Catalog (3002)│ │Inventory     │ │Orders (3003) │
│              │ │              │ │    (3004)    │ │              │
│ - Register   │ │ - Products   │ │ - Stock      │ │ - Create     │
│ - Login      │ │ - Categories │ │ - Suppliers  │ │ - List       │
│ - Profile    │ │ - Search     │ │ - Transfers  │ │ - Details    │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │                │
       ▼                ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │  PostgreSQL  │ │  PostgreSQL  │ │  PostgreSQL  │
│  auth_db     │ │ catalog_db   │ │inventory_db  │ │  orders_db   │
│  (5435)      │ │  (5434)      │ │  (5436)      │ │  (5437)      │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

       ┌──────────────┐
       │Reports (3005)│
       │              │
       │ - Sales      │
       │ - Analytics  │
       └──────┬───────┘
              │
              ▼
       ┌──────────────┐
       │  PostgreSQL  │
       │  reports_db  │
       │  (5438)      │
       └──────────────┘
```

### Justificación de Microservicios

Se eligió esta arquitectura por:

1. **Desacoplamiento**: Cada servicio puede ser desarrollado, desplegado y escalado independientemente
2. **Escalabilidad Horizontal**: Posibilidad de replicar servicios según demanda
3. **Resiliencia**: El fallo de un servicio no afecta la operación completa del sistema
4. **Tecnología Heterogénea**: Flexibilidad para usar diferentes tecnologías por servicio
5. **Mantenibilidad**: Equipos pueden trabajar en servicios independientes sin conflictos
6. **Base de Datos por Servicio**: Cada microservicio gestiona su propia base de datos

---

## 🛠 Tecnologías Utilizadas

### Backend
- **Node.js** v18+ - Runtime principal
- **Express.js** - Framework web
- **PostgreSQL 15** - Base de datos relacional
- **JWT** (jsonwebtoken) - Autenticación
- **bcrypt.js** - Hashing de contraseñas
- **CORS** - Manejo de peticiones cross-origin

### Frontend
- **HTML5** - Estructura
- **CSS3** (TailwindCSS) - Estilos
- **JavaScript Vanilla** - Lógica cliente
- **Lucide Icons** - Iconografía
- **Nginx Alpine** - Servidor web

### DevOps
- **Docker** - Containerización
- **Docker Compose** - Orquestación de contenedores

---

## 📁 Estructura del Proyecto

```
autorepuestos-ms/
├── gateway/                    # API Gateway (Puerto 3010)
│   ├── src/
│   │   └── server.js          # Configuración del gateway
│   ├── Dockerfile
│   └── package.json
│
├── services/                   # Microservicios
│   ├── auth/                  # Servicio de Autenticación (Puerto 3001)
│   │   ├── src/
│   │   │   ├── server.js      # Servidor Express
│   │   │   ├── db.js          # Conexión PostgreSQL
│   │   │   └── routes.js      # Endpoints de autenticación
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── catalog/               # Servicio de Catálogo (Puerto 3002)
│   │   ├── src/
│   │   │   ├── server.js
│   │   │   ├── db.js
│   │   │   └── routes.js      # CRUD de productos
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── inventory/             # Servicio de Inventario (Puerto 3004)
│   │   ├── src/
│   │   │   ├── server.js
│   │   │   ├── db.js
│   │   │   └── routes.js      # Gestión de stock
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── orders/                # Servicio de Pedidos (Puerto 3003)
│   │   ├── src/
│   │   │   ├── server.js
│   │   │   ├── db.js
│   │   │   └── routes.js      # Gestión de órdenes
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── reports/               # Servicio de Reportes (Puerto 3005)
│       ├── src/
│       │   ├── server.js
│       │   ├── db.js
│       │   └── routes.js      # Reportes y análisis
│       ├── Dockerfile
│       └── package.json
│
├── frontend/                   # Frontend Cliente y Admin
│   ├── src/
│   │   ├── api/               # Funciones de integración API
│   │   │   ├── auth.js
│   │   │   ├── catalog.js
│   │   │   ├── orders.js
│   │   │   └── inventory.js
│   │   └── config.js          # Configuración API URL
│   ├── assets/                # Recursos estáticos
│   ├── index.html             # Tienda E-commerce
│   ├── admin.html             # Panel de Administración
│   └── Dockerfile
│
├── docker-compose.yml         # Orquestación de servicios
├── .env.example               # Variables de entorno de ejemplo
├── .gitignore
└── README.md
```

---

## 📋 Requisitos Previos

Antes de ejecutar el proyecto, asegúrate de tener instalado:

- **Docker** v20.10 o superior → [Descargar Docker](https://www.docker.com/products/docker-desktop)
- **Docker Compose** v2.0 o superior (incluido con Docker Desktop)
- **Git** → [Descargar Git](https://git-scm.com/)
- **8GB de RAM disponible** (recomendado)
- Puertos disponibles: `3010, 8081, 5434-5438`

---

## 🚀 Instalación y Ejecución

### Método 1: Con Docker Compose (Recomendado)

#### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd autorepuestos-ms
```

#### 2. Configurar variables de entorno (opcional)
```bash
cp .env.example .env
# Editar .env si necesitas cambiar configuraciones
```

#### 3. Construir y ejecutar los contenedores
```bash
docker-compose up --build
```

> **Nota**: La primera ejecución puede tardar varios minutos mientras se descargan las imágenes y se construyen los contenedores.

#### 4. Esperar a que los servicios estén disponibles
Verás mensajes como:
```
gateway_1    | Gateway running on port 3010
auth_1       | Auth service running on port 3001
catalog_1    | Catalog service running on port 3002
...
```

#### 5. Acceder a la aplicación

- **🛒 Tienda E-commerce (Clientes)**: http://localhost:8081/index.html
- **⚙️ Panel de Administración**: http://localhost:8081/admin.html
- **🌐 API Gateway**: http://localhost:3010

### Método 2: Modo Desarrollo (Sin Docker)

#### 1. Instalar dependencias en cada servicio
```bash
# Gateway
cd gateway && npm install

# Servicios
cd services/auth && npm install
cd services/catalog && npm install
cd services/inventory && npm install
cd services/orders && npm install
cd services/reports && npm install
```

#### 2. Configurar PostgreSQL
Crea las bases de datos manualmente:
```sql
CREATE DATABASE auth_db;
CREATE DATABASE catalog_db;
CREATE DATABASE inventory_db;
CREATE DATABASE orders_db;
CREATE DATABASE reports_db;
```

#### 3. Ejecutar cada servicio
```bash
# En terminales separadas
cd gateway && npm run dev
cd services/auth && npm run dev
cd services/catalog && npm run dev
cd services/inventory && npm run dev
cd services/orders && npm run dev
cd services/reports && npm run dev
```

#### 4. Servir el frontend
```bash
cd frontend
# Usar cualquier servidor estático, por ejemplo:
npx serve -p 8081
```

---

## 🔌 Endpoints de la API

### API Gateway Base URL
```
http://localhost:3010
```

### 🔐 Auth Service (`/auth`)

| Método | Endpoint | Descripción | Body |
|--------|----------|-------------|------|
| POST | `/auth/register` | Registro de usuario | `{ name, email, password, role }` |
| POST | `/auth/login` | Inicio de sesión | `{ email, password }` |
| GET | `/auth/me` | Obtener perfil | Headers: `Authorization: Bearer <token>` |

### 📦 Catalog Service (`/catalog`)

| Método | Endpoint | Descripción | Parámetros |
|--------|----------|-------------|------------|
| GET | `/catalog/products` | Listar productos | `?category=<categoria>` |
| GET | `/catalog/products/:id` | Obtener producto | - |
| POST | `/catalog/products` | Crear producto | `{ name, description, price, category, image_url }` |
| PUT | `/catalog/products/:id` | Actualizar producto | `{ name, description, price, category, image_url }` |
| DELETE | `/catalog/products/:id` | Eliminar producto | - |

### 📊 Inventory Service (`/inventory`)

| Método | Endpoint | Descripción | Body |
|--------|----------|-------------|------|
| GET | `/inventory/stock` | Obtener stock | - |
| POST | `/inventory/stock` | Crear registro de stock | `{ product_id, quantity, location }` |
| PUT | `/inventory/stock/:id` | Actualizar stock | `{ quantity }` |
| GET | `/inventory/suppliers` | Listar proveedores | - |
| POST | `/inventory/suppliers` | Crear proveedor | `{ name, contact, email }` |

### 🛍 Orders Service (`/orders`)

| Método | Endpoint | Descripción | Body |
|--------|----------|-------------|------|
| GET | `/orders` | Listar órdenes | - |
| GET | `/orders/:id` | Obtener orden | - |
| POST | `/orders` | Crear orden | `{ user_id, items: [{product_id, quantity}] }` |
| PUT | `/orders/:id/status` | Actualizar estado | `{ status }` |

### 📈 Reports Service (`/reports`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/reports/sales` | Reporte de ventas |
| GET | `/reports/inventory` | Reporte de inventario |
| GET | `/reports/analytics` | Análisis general |

---

## ✨ Funcionalidades

### Para Clientes (Tienda E-commerce)

- ✅ Navegación de catálogo de productos
- ✅ Búsqueda y filtrado por categorías (Frenos, Motor, Eléctrico)
- ✅ Carrito de compras persistente
- ✅ Registro e inicio de sesión
- ✅ Proceso de checkout
- ✅ Visualización de productos con imágenes

### Para Administradores (Panel Admin)

- ✅ **Gestión de Productos**
  - Crear, editar y eliminar productos
  - Carga masiva mediante Excel
  - Gestión de categorías y precios
  - Subida de imágenes

- ✅ **Gestión de Inventario**
  - Control de stock en tiempo real
  - Registro de proveedores
  - Transferencias entre ubicaciones

- ✅ **Gestión de Pedidos**
  - Visualización de todas las órdenes
  - Cambio de estados (Pendiente, Procesando, Enviado, Entregado)
  - Detalles de cada pedido

- ✅ **Reportes y Análisis**
  - Reportes de ventas
  - Análisis de inventario
  - Métricas de rendimiento

### Características de Seguridad

- 🔒 Contraseñas hasheadas con **bcrypt**
- 🔒 Autenticación basada en **JWT**
- 🔒 Validación de roles (admin, manager, client)
- 🔒 CORS configurado para seguridad

---

## 🔑 Credenciales de Prueba

### Administrador
```
Email: admin@autorepuestos.com
Password: admin123
Rol: admin
```

### Manager
```
Email: manager@autorepuestos.com
Password: manager123
Rol: manager
```

### Cliente
```
Email: cliente@autorepuestos.com
Password: cliente123
Rol: client
```

> **Nota**: Estos usuarios se crean automáticamente al iniciar los servicios por primera vez.

---

## 💻 Desarrollo

### Ejecutar en Modo Desarrollo

```bash
# Con hot-reload en cada servicio
cd services/auth && npm run dev
cd services/catalog && npm run dev
# ... etc
```

### Ver Logs de un Servicio

```bash
# Ver logs de un servicio específico
docker-compose logs -f auth

# Ver logs de todos los servicios
docker-compose logs -f
```

### Reconstruir un Servicio Específico

```bash
docker-compose up --build --force-recreate auth
```

### Detener los Servicios

```bash
# Detener sin eliminar volúmenes
docker-compose down

# Detener y eliminar volúmenes (⚠️ Se pierden los datos)
docker-compose down -v
```

### Acceder a una Base de Datos

```bash
# Conectar a PostgreSQL de Auth
docker exec -it <container-id> psql -U postgres -d auth_db

# Listar contenedores
docker ps
```

### Variables de Entorno

El archivo `.env.example` contiene las variables configurables:

```env
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# JWT
JWT_SECRET=changeme

# Services URLs (dentro de la red Docker)
AUTH_URL=http://auth:3001
CATALOG_URL=http://catalog:3002
INVENTORY_URL=http://inventory:3004
ORDERS_URL=http://orders:3003
REPORTS_URL=http://reports:3005
```

---

## 🐛 Solución de Problemas

### Los servicios no inician
```bash
# Verificar que los puertos no estén en uso
netstat -ano | findstr "3010"
netstat -ano | findstr "8081"

# Verificar el estado de Docker
docker ps -a
docker-compose ps
```

### Error de conexión a PostgreSQL
```bash
# Verificar healthcheck de las bases de datos
docker-compose ps

# Esperar a que las bases de datos estén "healthy"
# Los servicios dependen de esto para iniciar
```

### El frontend no carga los productos
```bash
# Verificar que el Gateway esté corriendo
curl http://localhost:3010/catalog/products

# Verificar logs del Gateway
docker-compose logs gateway
```

### Resetear todo el sistema
```bash
# Detener y eliminar todo (incluyendo volúmenes)
docker-compose down -v

# Reconstruir desde cero
docker-compose up --build
```

---

## 📝 Licencia

Este proyecto es un sistema educativo desarrollado como proyecto universitario.

---

## 👥 Autor

Desarrollado como parte del proyecto de **Gestión de Inventarios - Arquitectura de Microservicios**

---

## 🔮 Próximas Mejoras

- [ ] Implementación de caché con Redis
- [ ] Agregación de logs con ELK Stack
- [ ] Monitoreo con Prometheus y Grafana
- [ ] Tests unitarios e integración
- [ ] CI/CD con GitHub Actions
- [ ] Despliegue en Kubernetes
- [ ] Notificaciones por email
- [ ] Sistema de descuentos y cupones
- [ ] Pasarela de pagos real

---

**¿Preguntas o problemas?** Abre un issue en el repositorio.
