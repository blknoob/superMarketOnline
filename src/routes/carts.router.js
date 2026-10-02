/**
 * ROUTER DE CARRITOS - GESTIÓN DE CARRITO DE COMPRAS
 * 
 * Router dedicado a todas las operaciones del carrito de compras
 * Todas las rutas requieren autenticación para acceso
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Consulta y gestión del carrito personal
 * - Agregado y eliminación de productos
 * - Actualización de cantidades de productos
 * - Limpieza completa del carrito
 * - Procesamiento de compra del carrito
 * 
 * CARACTERÍSTICAS DE SEGURIDAD:
 * - Middleware de autenticación aplicado a todas las rutas
 * - Acceso exclusivo al carrito del usuario autenticado
 * - Validaciones de stock y disponibilidad
 * - Operaciones atómicas para consistencia
 * 
 * FLUJO TÍPICO DE USO:
 * 1. Usuario consulta su carrito (GET /)
 * 2. Agrega productos (POST /products/:id)
 * 3. Modifica cantidades (PUT /products/:id)
 * 4. Elimina productos no deseados (DELETE /products/:id)
 * 5. Procesa compra final (POST /purchase)
 * 
 * MIDDLEWARES APLICADOS:
 * - authenticate: Verificación de sesión en todas las rutas
 * 
 * CONTROLADORES:
 * - Funciones individuales del cart.controller.js
 * 
 * BASE PATH: /carts
 * SECURITY LEVEL: Alto (autenticación requerida)
 */
import { Router } from "express";
import {
  getCart,
  clearUserCart,
  addProductToCart,
  updateProductQuantity,
  removeProductFromCart,
  purchaseCart
} from "../controllers/cart.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Aplicar middleware de autenticación a todas las rutas del carrito
router.use(authenticate);

/**
 * RUTAS DE GESTIÓN DEL CARRITO PRINCIPAL
 */

/**
 * OBTENER CARRITO DEL USUARIO
 * GET /carts
 * 
 * Endpoint para consultar el carrito actual del usuario autenticado
 * Retorna productos, cantidades y totales calculados
 * 
 * MIDDLEWARE: authenticate (aplicado globalmente)
 * CONTROLLER: cart.controller.getCart
 * RESPONSE: Datos completos del carrito con productos y totales
 * SECURITY: Acceso solo al carrito del usuario autenticado
 */
router.get("/", getCart);

/**
 * VACIAR CARRITO COMPLETO
 * DELETE /carts
 * 
 * Endpoint para eliminar todos los productos del carrito
 * Operación de limpieza completa del carrito
 * 
 * MIDDLEWARE: authenticate (aplicado globalmente)
 * CONTROLLER: cart.controller.clearUserCart
 * RESPONSE: Confirmación de vaciado del carrito
 * SECURITY: Solo puede vaciar su propio carrito
 */
router.delete("/", clearUserCart);

/**
 * RUTAS DE GESTIÓN DE PRODUCTOS EN EL CARRITO
 */

/**
 * AGREGAR PRODUCTO AL CARRITO
 * POST /carts/products/:productId
 * 
 * Endpoint para agregar un producto al carrito del usuario
 * Si el producto ya existe, incrementa la cantidad
 * 
 * PARAMS: productId - ObjectId del producto a agregar
 * BODY: { quantity?: number } - Cantidad a agregar (default: 1)
 * 
 * MIDDLEWARE: authenticate (aplicado globalmente)
 * CONTROLLER: cart.controller.addProductToCart
 * RESPONSE: Carrito actualizado con el nuevo producto
 * SECURITY: Validación de stock disponible, producto activo
 */
router.post("/products/:productId", addProductToCart);

/**
 * ACTUALIZAR CANTIDAD DE PRODUCTO
 * PUT /carts/products/:productId
 * 
 * Endpoint para modificar la cantidad de un producto específico
 * Permite incrementar, decrementar o establecer cantidad exacta
 * 
 * PARAMS: productId - ObjectId del producto a actualizar
 * BODY: { quantity: number } - Nueva cantidad deseada
 * 
 * MIDDLEWARE: authenticate (aplicado globalmente)
 * CONTROLLER: cart.controller.updateProductQuantity
 * RESPONSE: Carrito con cantidad actualizada
 * SECURITY: Validación de stock, eliminación si cantidad = 0
 */
router.put("/products/:productId", updateProductQuantity);

/**
 * ELIMINAR PRODUCTO DEL CARRITO
 * DELETE /carts/products/:productId
 * 
 * Endpoint para remover completamente un producto del carrito
 * Elimina el producto independientemente de la cantidad
 * 
 * PARAMS: productId - ObjectId del producto a eliminar
 * 
 * MIDDLEWARE: authenticate (aplicado globalmente)
 * CONTROLLER: cart.controller.removeProductFromCart
 * RESPONSE: Carrito sin el producto eliminado
 * SECURITY: Solo puede eliminar de su propio carrito
 */
router.delete("/products/:productId", removeProductFromCart);

/**
 * RUTA DE FINALIZACIÓN DE COMPRA
 */

/**
 * PROCESAR COMPRA DEL CARRITO
 * POST /carts/purchase
 * 
 * Endpoint para finalizar la compra del carrito actual
 * Convierte el carrito en una orden y procede al checkout
 * 
 * PROCESO DE COMPRA:
 * 1. Validar disponibilidad de todos los productos
 * 2. Calcular totales finales con impuestos
 * 3. Crear orden de compra
 * 4. Reducir stock de productos
 * 5. Vaciar carrito
 * 6. Generar ticket de compra
 * 
 * MIDDLEWARE: authenticate (aplicado globalmente)
 * CONTROLLER: cart.controller.purchaseCart
 * RESPONSE: Orden creada con detalles de compra
 * SECURITY: Validaciones de stock, cálculos seguros, transacciones atómicas
 */
router.post("/purchase", purchaseCart);

export default router;
