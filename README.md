# UniSalle Backend

Backend REST API para la gestión de usuarios con autenticación JWT, roles y carga de imágenes. Desarrollado con Node.js, Express y MySQL (Sequelize ORM).

---

## Tecnologías

| Tecnología | Versión | Propósito |
|---|---|---|
| Node.js | ≥ 18 | Runtime |
| Express | 5.x | Framework HTTP |
| Sequelize | 6.x | ORM para MySQL |
| MySQL | 8.x | Base de datos |
| bcryptjs | 3.x | Hash de contraseñas |
| jsonwebtoken | 9.x | Autenticación JWT |
| multer | 2.x | Carga de imágenes |
| express-validator | 7.x | Validación de entradas |
| dotenv | 17.x | Variables de entorno |
| cors | 2.x | Política de CORS |
| morgan | 1.x | Logger HTTP |

---

## Requisitos previos

- [Node.js](https://nodejs.org) ≥ 18
- [MySQL](https://www.mysql.com) 8.x corriendo en localhost
- [Postman](https://www.postman.com) (para pruebas)

---

## Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/contracamilo/unisalle-backend.git
cd unisalle-backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con los datos de tu entorno:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=unisalle_db
DB_USER=root
DB_PASSWORD=tu_password

JWT_SECRET=cambia_este_secreto_por_uno_seguro
JWT_EXPIRES_IN=7d
```

### 4. Crear la base de datos

```sql
CREATE DATABASE unisalle_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Iniciar el servidor

```bash
# Desarrollo (hot reload)
npm run dev

# Producción
npm start
```

Al iniciar, Sequelize crea las tablas automáticamente y semilla los roles por defecto: `admin`, `user`, `moderator`.

---

## Estructura del proyecto

```
unisalle_backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Conexión Sequelize/MySQL
│   │   └── server.js            # Configuración Express (CORS, rutas, middlewares)
│   ├── controllers/
│   │   ├── auth.controller.js   # Lógica de register y login
│   │   └── user.controller.js   # Lógica de gestión de usuarios
│   ├── middlewares/
│   │   ├── auth.middleware.js   # Verificación JWT y control de roles
│   │   └── upload.middleware.js # Configuración de multer para imágenes
│   ├── models/
│   │   ├── User.js              # Modelo de usuario
│   │   ├── Role.js              # Modelo de rol
│   │   └── index.js             # Asociaciones many-to-many + seed
│   ├── routes/
│   │   ├── auth.routes.js       # Rutas públicas de autenticación
│   │   └── user.routes.js       # Rutas protegidas de usuario
│   └── validators/
│       └── auth.validator.js    # Reglas de validación de entrada
├── uploads/                     # Imágenes subidas (ignorado en git)
├── index.js                     # Punto de entrada
├── .env.example                 # Plantilla de variables de entorno
└── package.json
```

---

## Base de datos

### Modelo de datos

```
users
  id          INT PK AUTO_INCREMENT
  name        VARCHAR(100)
  email       VARCHAR(150) UNIQUE
  password    VARCHAR(255)
  image       VARCHAR(255) NULL
  active      BOOLEAN DEFAULT true
  createdAt   DATETIME
  updatedAt   DATETIME

roles
  id          INT PK AUTO_INCREMENT
  name        VARCHAR(50) UNIQUE
  description VARCHAR(255)
  createdAt   DATETIME
  updatedAt   DATETIME

user_roles  (tabla intermedia — relación many-to-many)
  userId      INT FK → users.id
  roleId      INT FK → roles.id
```

### Roles por defecto

| Nombre | Descripción |
|--------|-------------|
| `admin` | Acceso total, puede gestionar roles y listar usuarios |
| `user` | Usuario estándar (asignado por defecto al registrarse) |
| `moderator` | Rol de moderación intermedio |

---

## API Reference

### Base URL

```
http://localhost:3000/api
```

### Autenticación

Las rutas protegidas requieren el header:

```
Authorization: Bearer <token>
```

---

### Auth

#### `POST /auth/register`

Registra un nuevo usuario. Asigna el rol `user` por defecto.

**Body (JSON)**

```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "secret123",
  "roles": ["user"]
}
```

> El campo `roles` es opcional. Si se omite, se asigna `user` automáticamente.

**Respuesta exitosa `201`**

```json
{
  "ok": true,
  "message": "Usuario registrado exitosamente.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "image": null,
    "active": true,
    "roles": ["user"],
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Errores posibles**

| Código | Descripción |
|--------|-------------|
| `400` | Campos inválidos o correo ya registrado |
| `500` | Error interno |

---

#### `POST /auth/login`

Autentica un usuario y retorna un token JWT.

**Body (JSON)**

```json
{
  "email": "juan@example.com",
  "password": "secret123"
}
```

**Respuesta exitosa `200`**

```json
{
  "ok": true,
  "message": "Login exitoso.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "image": null,
    "active": true,
    "roles": ["user"],
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Errores posibles**

| Código | Descripción |
|--------|-------------|
| `400` | Campos inválidos |
| `401` | Credenciales incorrectas |
| `403` | Usuario inactivo |

---

### Usuarios

#### `GET /users/me`

Retorna la información del usuario autenticado.

**Headers:** `Authorization: Bearer <token>`

**Respuesta exitosa `200`**

```json
{
  "ok": true,
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "image": "http://192.168.1.10:3000/uploads/uuid.jpg",
    "active": true,
    "roles": ["user"],
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

> El campo `image` retorna la URL completa accesible desde la red local (útil para clientes móviles).

---

#### `PUT /users/:id`

Actualiza los datos de un usuario. Solo el propio usuario o un `admin` puede modificarlo.

**Headers:** `Authorization: Bearer <token>`

**Body (JSON) — todos los campos son opcionales**

```json
{
  "name": "Juan Alberto Pérez",
  "email": "nuevo@example.com",
  "password": "nuevaPassword123",
  "roles": ["admin", "user"]
}
```

> El campo `roles` solo es procesado si quien hace la petición tiene el rol `admin`.

**Respuesta exitosa `200`**

```json
{
  "ok": true,
  "message": "Usuario actualizado.",
  "user": { ... }
}
```

---

#### `PUT /users/:id/image`

Actualiza la imagen de perfil de un usuario. Elimina la imagen anterior automáticamente.

**Headers:** `Authorization: Bearer <token>`

**Body (multipart/form-data)**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `image` | File | Imagen (jpeg, png, webp, gif — máx. 5 MB) |

**Respuesta exitosa `200`**

```json
{
  "ok": true,
  "message": "Imagen actualizada.",
  "imageUrl": "http://192.168.1.10:3000/uploads/3f8a1b2c.jpg",
  "user": { ... }
}
```

---

#### `GET /users`

Lista todos los usuarios. Requiere rol `admin`.

**Headers:** `Authorization: Bearer <token>`

**Respuesta exitosa `200`**

```json
{
  "ok": true,
  "users": [ ... ]
}
```

---

#### `GET /health`

Health check del servidor.

```json
{
  "ok": true,
  "status": "running",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

---

## Pruebas con Postman

### Configuración rápida

1. Importar la colección (o crear requests manualmente).
2. Crear una variable de entorno `base_url = http://localhost:3000/api`.
3. Crear una variable `token` que se actualice automáticamente con el script de login:

```javascript
// En el tab "Tests" del request de login:
const res = pm.response.json();
if (res.token) {
  pm.environment.set("token", res.token);
}
```

4. En las rutas protegidas, usar `Authorization: Bearer {{token}}`.

### Flujo de prueba sugerido

1. `POST /auth/register` — registrar usuario
2. `POST /auth/login` — obtener token
3. `GET /users/me` — verificar datos del usuario
4. `PUT /users/1` — actualizar nombre
5. `PUT /users/1/image` — subir foto de perfil
6. `GET /users/me` — verificar URL de imagen completa

---

## Configuración para dispositivos móviles

El servidor escucha en `0.0.0.0`, lo que permite conexiones desde la red local.

1. Obtener la IP de la máquina:
   ```bash
   # macOS / Linux
   ipconfig getifaddr en0
   ```
2. Desde la app móvil usar:
   ```
   http://192.168.x.x:3000/api
   ```

Las URLs de imágenes en las respuestas ya incluyen la IP del servidor, por lo que son directamente usables en `<Image>` de Flutter o React Native.

---

## Variables de entorno

| Variable | Requerida | Descripción | Ejemplo |
|---|---|---|---|
| `PORT` | No | Puerto del servidor | `3000` |
| `NODE_ENV` | No | Entorno de ejecución | `development` |
| `DB_HOST` | Sí | Host de MySQL | `localhost` |
| `DB_PORT` | No | Puerto de MySQL | `3306` |
| `DB_NAME` | Sí | Nombre de la base de datos | `unisalle_db` |
| `DB_USER` | Sí | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Sí | Contraseña de MySQL | `secret` |
| `JWT_SECRET` | Sí | Clave secreta para firmar tokens | `min. 32 chars` |
| `JWT_EXPIRES_IN` | No | Tiempo de expiración del token | `7d` |

---

## Licencia

ISC
