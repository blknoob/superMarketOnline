# Documentación de API - SuperMarket Online

## Resumen
API REST del supermercado online: catálogo con categorías en árbol, carrito, pedidos y pagos manuales (Pago Móvil, transferencia, Zelle). La tienda web (Handlebars) usa los mismos servicios.

## Base URL
```
http://localhost:8080/api
```

## Autenticación
La API utiliza JWT. El token se envía en:
- Header: `Authorization: Bearer <token>`
- Cookie: `access_token` (la crea el login)

## Modelo de datos

| Colección | Contenido |
|---|---|
| `categories` | Árbol de categorías de profundidad libre. Cada una guarda `parent` y `ancestors` (de la raíz al padre). |
| `brands` | Marcas. Se crean solas al cargar un producto con una marca nueva. |
| `products` | Cada presentación es un producto (`sku` único, `barcode` opcional y único). Guarda `priceRef` en EUR, `category` y `categoryPath` (la categoría y sus ancestros). |
| `users` | Usuarios con `addresses` (direcciones de envío). |
| `carts` | Un carrito por usuario: `items: [{ product, quantity }]`. |
| `orders` | Pedidos. Copian nombre, SKU, precios, tasa EUR y dirección del momento de la compra. |
| `payments` | Pagos reportados por el cliente para un pedido, con su revisión. |
| `settings` | Configuración: `eur_rate` (Bs por 1 €) y `shipping_cost_ref` (envío en €). |

**Precios:** el producto guarda solo `priceRef` (EUR). El precio en Bs (`price`) se calcula al leerlo: `priceRef × eur_rate`. Si la tasa no está configurada, `price` es `null` y no se puede comprar.

**Estados del pedido:** `pending_payment` → `payment_review` → `paid` → `preparing` → `shipped` → `delivered`. Antes de `shipped` se puede pasar a `canceled`, que devuelve el stock.

## Endpoints

### Usuarios

#### POST /users/register
```json
{
  "first_name": "string",
  "last_name": "string",
  "email": "string",
  "password": "string (8+, mayúscula, minúscula, número y símbolo)",
  "birth_date": "YYYY-MM-DD (mayor de 18 años)"
}
```

#### POST /users/login
```json
{ "email": "string", "password": "string" }
```
Devuelve la cookie `access_token`.

#### GET /users/current
Usuario autenticado.

### Categorías

#### GET /categories
Árbol de categorías activas.
```json
{
  "status": "success",
  "categories": [
    { "_id": "…", "name": "Alimentación", "slug": "alimentacion", "children": [
      { "_id": "…", "name": "Lácteos", "slug": "lacteos", "children": [] }
    ] }
  ]
}
```

#### POST /categories (admin)
```json
{ "name": "Quesos", "parentId": "<id de Lácteos> (opcional)", "order": 0 }
```

#### PUT /categories/:id (admin)
`{ "name", "parentId", "order", "isActive" }`. Renombrar o mover actualiza los ancestros de toda la rama y el `categoryPath` de sus productos. No permite mover una categoría dentro de sí misma.

#### DELETE /categories/:id (admin)
Solo si no tiene subcategorías ni productos.

### Productos

#### GET /products
**Query:** `category` (slug; incluye todas las subcategorías), `q` (búsqueda de texto), `page` (24 por página).
```json
{
  "status": "success",
  "products": [
    {
      "_id": "…", "name": "Leche Entera", "slug": "leche-entera-1l", "sku": "LEC-ENT-1L",
      "brand": { "name": "La Pastoreña" }, "category": { "name": "Lácteos", "ancestors": [] },
      "unit": "L", "unitSize": 1, "priceRef": 1.2, "price": 54.6, "stock": 10,
      "images": ["/images/…"], "image": "/images/…", "isActive": true
    }
  ],
  "category": { … }, "page": 1, "pages": 1, "total": 1, "exchangeRate": 45.5
}
```

#### GET /products/:id
Detalle de un producto activo.

#### POST /products · PUT /products/:id (admin)
```json
{
  "name": "Leche Entera", "sku": "LEC-ENT-1L", "barcode": "7591234000011",
  "brandName": "La Pastoreña", "category": "<id de categoría>",
  "unit": "und | kg | g | L | ml", "unitSize": 1,
  "priceRef": 1.2, "stock": 10, "description": "…", "isActive": true
}
```

#### DELETE /products/:id (admin)

### Carrito (usuario autenticado)

| Método | Ruta | Body |
|---|---|---|
| GET | /carts | |
| POST | /carts/products/:productId | `{ "quantity": 1 }` |
| PUT | /carts/products/:productId | `{ "quantity": 3 }` (0 lo quita) |
| DELETE | /carts/products/:productId | |
| DELETE | /carts | (vacía el carrito) |

Todas responden el carrito calculado:
```json
{
  "status": "success",
  "cart": {
    "items": [{ "product": { … }, "quantity": 2, "price": 54.6, "subtotal": 109.2, "subtotalRef": 2.4, "available": true }],
    "subtotal": 109.2, "subtotalRef": 2.4, "exchangeRate": 45.5,
    "hasUnavailable": false, "isEmpty": false
  }
}
```
No permite superar el stock ni 100 unidades por producto.

### Pedidos (usuario autenticado)

#### POST /orders
Crea el pedido con el carrito. Usa una dirección guardada o una nueva (se guarda en el perfil):
```json
{ "addressId": "<id>" }
```
```json
{ "address": { "recipient": "Ana Pérez", "phone": "0414…", "line1": "Av. …", "line2": "", "city": "Caracas", "state": "Distrito Capital", "reference": "" } }
```
Corre en una transacción: descuenta stock, crea el pedido y vacía el carrito. Si un producto no tiene stock suficiente, no se aplica ningún cambio.

#### GET /orders
Mis pedidos.

#### GET /orders/:id
Detalle de un pedido propio (404 si es de otro usuario).

### Pagos
Se reportan desde la tienda web (`/orders/:id`, con comprobante opcional) y se revisan en el panel (`/admin/orders/:id`). Al aprobar el pago, el pedido pasa a `paid`; al rechazarlo, vuelve a `pending_payment`.

### Administración (admin)

#### GET /admin/users · GET/PUT/DELETE /admin/users/:id

#### PUT /admin/users/:id/role
```json
{ "role": "user | admin" }
```

La tasa EUR, el costo de envío, los pedidos y los pagos se administran desde el panel web (`/admin/panel`).

## Códigos de Error

### Errores Comunes
- `400` - Bad Request: datos inválidos o regla de negocio (sin stock, SKU repetido…). El motivo viene en `message`.
- `401` - Unauthorized: token requerido o inválido
- `403` - Forbidden: permisos insuficientes
- `404` - Not Found: recurso no encontrado
- `500` - Internal Server Error: error del servidor

### Códigos de Error Específicos
- `TOKEN_REQUIRED`: token de autenticación requerido
- `TOKEN_INVALID`: token inválido o expirado
- `VALIDATION_ERROR`: datos de validación incorrectos

## Rate Limiting
- Autenticación: 5 intentos por hora por IP
- API general: 100 requests por minuto por IP

## Notas de Seguridad
- Todas las contraseñas son hasheadas con bcrypt
- JWT tokens expiran en 24 horas
- Cookies httpOnly para tokens
- Validación de entrada en todos los endpoints
- Logs de seguridad para actividades sospechosas
