# Autorepuestos MS - Sistema de Gestión de Inventarios (Segundo Parcial)

Este proyecto implementa una plataforma de e-commerce y gestión de inventarios para una cadena de repuestos de automóviles, diseñada bajo una arquitectura de **Microservicios** y cumpliendo con estándares de documentación **ISO 9001**.

## 1. Justificación de Arquitectura (Microservicios)

Se ha seleccionado una arquitectura de Microservicios por las siguientes razones técnicas y de negocio:

*   **Desacoplamiento del Inventario:** El módulo de inventarios (`inventory`) maneja una lógica compleja de stock multi-tienda que debe escalar independientemente del catálogo de productos (`catalog`). Si una tienda tiene un pico de consultas de stock, no afecta la navegación del catálogo general.
*   **Resiliencia:** Un fallo en el servicio de reportes (`reports`) no detiene las ventas ni la operación crítica.
*   **Tecnología Heterogénea:** Permite a futuro implementar servicios en diferentes lenguajes (ej. Python para IA en reportes) sin reescribir todo el sistema.
*   **Escalabilidad Horizontal:** Podemos replicar contenedores de `inventory` sin duplicar `auth`.

### Componentes del Sistema
*   **Gateway (8080):** Punto de entrada único.
*   **Auth:** Gestión de usuarios y JWT (con bcrypt).
*   **Catalog:** Productos, precios y descripciones.
*   **Inventory:** Stock por tienda y transferencias.
*   **Frontend:** Interfaz SPA (Single Page Application) moderna.

## 2. Mapa de Procesos (ISO 9001)

El siguiente diagrama describe el flujo principal de valor del sistema:

```mermaid
graph LR
    A[Inicio de Sesión (Auth)] --> B{Rol?}
    B -- Admin --> C[Carga Masiva Excel]
    B -- Cliente --> D[Navegación Catálogo]
    C --> E[Validación y Transformación]
    E --> F[Actualización Stock (Inventory)]
    E --> G[Actualización Productos (Catalog)]
    F --> H[Disponibilidad en Tienda]
    D --> H
    H --> I[Carrito y Venta]
```

### Procedimiento de Carga Masiva (Crítico)
1.  El Administrador descarga la plantilla `template_importacion.xlsx`.
2.  Llena las hojas "Productos", "Tiendas" y "Stock".
3.  Sube el archivo desde el Panel de Administración.
4.  El Frontend procesa el archivo y distribuye los datos a los microservicios correspondientes.
5.  El sistema confirma la cantidad de registros procesados.

## 3. Despliegue y Ejecución

### Prerrequisitos
*   Docker y Docker Compose instalados.

### Pasos
1.  Clonar el repositorio.
2.  Ejecutar:
    ```bash
    docker-compose up --build
    ```
3.  Acceder a: `http://localhost:3001`

### Credenciales de Prueba
*   **Admin:** `admin@autorepuestos.com` / `admin123`
*   **Manager:** `manager@autorepuestos.com` / `manager123`
*   **Cliente:** `cliente@autorepuestos.com` / `cliente123`

## 4. Funcionalidades Clave
*   **Seguridad:** Contraseñas hasheadas con `bcrypt`.
*   **Multi-tienda:** Visualización de stock específico por sucursal.
*   **Persistencia:** Bases de datos PostgreSQL con volúmenes persistentes (`./data`).
*   **Interoperabilidad:** Importación de datos vía Excel estándar.
