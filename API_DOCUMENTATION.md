# Documentación de API - E-commerce Backend

## Resumen
API REST para aplicación de e-commerce con autenticación JWT, gestión de productos, carritos de compras y sistema de pagos.

## Base URL
```
http://localhost:8080/api
```

## Autenticación
La API utiliza JWT (JSON Web Tokens) para autenticación. El token debe enviarse en:
- Header: `Authorization: Bearer <token>`
- Cookie: `access_token`

## Endpoints

### Autenticación

#### POST /users/register
Registra un nuevo usuario.

**Request Body:**
```json
{
  "first_name": "string",
  "last_name": "string",
  "email": "string",
  "password": "string",
  "age": "number"
}
```

**Response (201):**
```json
{
  "status": "created",
  "message": "Usuario creado correctamente",
  "user": {
    "_id": "string",
    "first_name": "string",
    "last_name": "string",
    "email": "string",
    "role": "string"
  }
}
```

#### POST /users/login
Inicia sesión de usuario.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Login exitoso",
  "user": {
    "_id": "string",
    "first_name": "string",
    "last_name": "string",
    "email": "string",
    "role": "string"
  },
  "token": "string"
}
```

#### GET /users/current
Obtiene información del usuario actual.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "success",
  "user": {
    "_id": "string",
    "first_name": "string",
    "last_name": "string",
    "email": "string",
    "role": "string"
  }
}
```

### Productos

#### GET /products
Obtiene lista de productos con paginación.

**Query Parameters:**
- `page` (number): Página actual (default: 1)
- `limit` (number): Productos por página (default: 10)
- `category` (string): Filtrar por categoría
- `sort` (string): Ordenar por campo (price, title, etc.)

**Response (200):**
```json
{
  "status": "success",
  "products": [
    {
      "_id": "string",
      "title": "string",
      "description": "string",
      "price": "number",
      "category": "string",
      "stock": "number",
      "image": "string"
    }
  ],
  "totalPages": "number",
  "currentPage": "number",
  "totalProducts": "number"
}
```

#### GET /products/:id
Obtiene un producto específico.

**Response (200):**
```json
{
  "status": "success",
  "product": {
    "_id": "string",
    "title": "string",
    "description": "string",
    "price": "number",
    "category": "string",
    "stock": "number",
    "image": "string"
  }
}
```

#### POST /products
Crea un nuevo producto (Solo Admin).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (form-data):**
- `title`: string
- `description`: string
- `category`: string
- `code`: string
- `price`: number
- `stock`: number
- `image`: file (opcional)

**Response (201):**
```json
{
  "status": "created",
  "message": "Producto creado correctamente",
  "product": {
    "_id": "string",
    "title": "string",
    "description": "string",
    "price": "number",
    "category": "string",
    "stock": "number",
    "image": "string"
  }
}
```

### Carritos

#### GET /carts
Obtiene el carrito del usuario actual.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "success",
  "cart": {
    "_id": "string",
    "user": "string",
    "products": [
      {
        "product": {
          "_id": "string",
          "title": "string",
          "price": "number"
        },
        "quantity": "number",
        "_id": "string"
      }
    ]
  }
}
```

#### POST /carts/products/:productId
Agrega producto al carrito.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "quantity": "number" // opcional, default: 1
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Producto agregado al carrito",
  "cart": {
    "_id": "string",
    "products": [...]
  }
}
```

#### DELETE /carts/products/:productId
Remueve producto del carrito.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Producto removido del carrito",
  "cart": {
    "_id": "string",
    "products": [...]
  }
}
```

### Órdenes y Pagos

#### POST /checkout
Crea una nueva orden a partir del carrito.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Orden creada correctamente",
  "order": {
    "_id": "string",
    "user": "string",
    "items": [...],
    "total": "number",
    "status": "pending_payment"
  }
}
```

#### POST /payments
Registra un pago para una orden.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (form-data):**
- `orderId`: string
- `method`: string (pago_movil, zelle, transfer)
- `amount`: number
- `reference`: string
- `proof`: file (opcional, para comprobante)

**Response (200):**
```json
{
  "status": "success",
  "message": "Pago registrado correctamente",
  "paymentIntent": {
    "_id": "string",
    "orderId": "string",
    "method": "string",
    "amount": "number",
    "status": "pending"
  }
}
```

### Administración (Solo Admin)

#### GET /admin/users
Obtiene lista de todos los usuarios.

**Headers:**
```
Authorization: Bearer <admin_token>
```

#### PUT /admin/users/:id/role
Actualiza el rol de un usuario.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "role": "string" // "user" | "admin"
}
```

## Códigos de Error

### Errores Comunes
- `400` - Bad Request: Datos inválidos
- `401` - Unauthorized: Token requerido o inválido
- `403` - Forbidden: Permisos insuficientes
- `404` - Not Found: Recurso no encontrado
- `500` - Internal Server Error: Error del servidor

### Códigos de Error Específicos
- `TOKEN_REQUIRED`: Token de autenticación requerido
- `TOKEN_INVALID`: Token inválido o expirado
- `VALIDATION_ERROR`: Datos de validación incorrectos
- `INSUFFICIENT_PERMISSIONS`: Permisos insuficientes
- `INVALID_OBJECT_ID`: ID de MongoDB inválido

## Rate Limiting
- Autenticación: 5 intentos por hora por IP
- API general: 100 requests por minuto por IP

## Versionado
- API Version: v1
- Última actualización: Diciembre 2024

## Notas de Seguridad
- Todas las contraseñas son hasheadas con bcrypt
- JWT tokens expiran en 24 horas
- Cookies httpOnly para tokens
- Validación de entrada en todos los endpoints
- Logs de seguridad para actividades sospechosas