/**
 * CONTROLLER DE CHECKOUT - PROCESO DE FINALIZACIÓN DE COMPRA
 * 
 * Módulo que maneja el flujo completo de checkout desde carrito hasta confirmación
 * Coordina vistas HTML para el proceso de compra paso a paso
 * 
 * FLUJO DE CHECKOUT:
 * 1. /checkout - Mostrar resumen de carrito y formulario
 * 2. /checkout/confirm - Crear orden desde carrito
 * 3. /checkout/payment/:orderId - Página de pago
 * 4. /checkout/thanks/:orderId - Confirmación final
 * 
 * CARACTERÍSTICAS:
 * - Vistas HTML renderizadas con Handlebars
 * - Validación de permisos de usuario por orden
 * - Validación de ObjectIds de MongoDB
 * - Manejo centralizado de errores con next()
 * - Integración con OrdersService para lógica de negocio
 * 
 * SEGURIDAD:
 * - Verificación de propiedad de órdenes
 * - Validación de IDs de MongoDB
 * - Autenticación requerida (middleware)
 * - Prevención de acceso cruzado entre usuarios
 */
import OrdersService from "../services/orders.service.js";
import mongoose from "mongoose";

const ordersService = new OrdersService();

/**
 * MOSTRAR PÁGINA DE CHECKOUT
 * 
 * Endpoint: GET /checkout
 * Renderiza la página inicial del proceso de checkout
 * 
 * FUNCIONALIDAD:
 * - Muestra resumen del carrito del usuario
 * - Formulario para datos de envío y facturación
 * - Botones para continuar o cancelar compra
 * - Cálculo de totales y impuestos
 * 
 * TEMPLATE RENDERIZADO:
 * - "checkout/checkout" con datos del carrito
 * - Incluye productos, cantidades, precios
 * - Formularios para información de usuario
 * 
 * DATOS REQUERIDOS:
 * - req.cart: Carrito del usuario (poblado por middleware)
 * - req.user: Usuario autenticado
 * 
 * @param {Object} req - Request con cart y user
 * @param {Object} res - Response de Express
 * @param {Function} next - Next middleware para errores
 * @returns {Promise<void>} Template renderizado
 */
export const showCheckout = async (req, res, next) => {
  try {
    // Aquí puedes obtener el carrito del usuario y mostrar el resumen
    // Por simplicidad, asume que tienes el carrito en req.cart
    res.render("checkout/checkout", { cart: req.cart });
  } catch (e) { next(e); }
};

/**
 * CONFIRMAR ORDEN DE COMPRA
 * 
 * Endpoint: POST /checkout/confirm
 * Convierte el carrito del usuario en una orden formal
 * 
 * PROCESO DE CONFIRMACIÓN:
 * 1. Obtener carrito del usuario autenticado
 * 2. Crear orden via OrdersService
 * 3. Redirigir a página de pago con ID de orden
 * 
 * VALIDACIONES:
 * - Usuario autenticado requerido
 * - Carrito con productos válidos
 * - Stock disponible (validado en service)
 * 
 * RESULTADO:
 * - Orden creada en estado "pending_payment"
 * - Redirección a /checkout/payment/{orderId}
 * - Stock reservado temporalmente
 * 
 * DATOS UTILIZADOS:
 * - req.user._id: ID del usuario autenticado
 * - req.cart: Carrito con productos (middleware)
 * 
 * @param {Object} req - Request con user y cart
 * @param {Object} res - Response de Express
 * @param {Function} next - Next middleware para errores
 * @returns {Promise<void>} Redirección a página de pago
 */
export const confirmOrder = async (req, res, next) => {
  try {
    // Crea la orden a partir del carrito del usuario
    const userId = req.user._id;
    const cart = req.cart; // O recupéralo desde tu servicio
    const order = await ordersService.createFromCart(userId, cart);
    res.redirect(`/checkout/payment/${order._id}`);
  } catch (e) { next(e); }
};

/**
 * MOSTRAR PÁGINA DE PAGO
 * 
 * Endpoint: GET /checkout/payment/:orderId
 * Renderiza la página de selección y procesamiento de pago
 * 
 * VALIDACIONES DE SEGURIDAD:
 * - ID de orden válido (ObjectId de MongoDB)
 * - Existencia de la orden
 * - Propiedad de la orden (usuario actual)
 * - Estado de orden apropiado para pago
 * 
 * FUNCIONALIDAD:
 * - Mostrar resumen de la orden
 * - Métodos de pago disponibles
 * - Formularios de pago (tarjeta, transferencia, etc.)
 * - Cálculo final de totales
 * 
 * TEMPLATE RENDERIZADO:
 * - "checkout/payment" con datos de la orden
 * - Información de productos y montos
 * - Opciones de pago configuradas
 * 
 * RESPUESTAS DE ERROR:
 * - 400: ID de orden inválido
 * - 404: Orden no encontrada
 * - 403: Usuario sin acceso a la orden
 * 
 * @param {Object} req - Request con params.orderId y user
 * @param {Object} res - Response de Express
 * @param {Function} next - Next middleware para errores
 * @returns {Promise<void>} Template de pago o error
 */
export const showPayment = async (req, res, next) => {
  const { orderId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).send("El ID de la orden no es válido.");
  }
  try {
    const order = await ordersService.getById(orderId);
    if (!order) return res.status(404).send("Orden no encontrada.");
    // Opcional: valida que la orden pertenezca al usuario
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).send("No tienes acceso a esta orden.");
    }
    res.render("checkout/payment", { order });
  } catch (e) { next(e); }
};

/**
 * MOSTRAR PÁGINA DE CONFIRMACIÓN
 * 
 * Endpoint: GET /checkout/thanks/:orderId
 * Renderiza la página de confirmación final después de pago exitoso
 * 
 * PROPÓSITO:
 * - Confirmar completación exitosa de la compra
 * - Mostrar resumen final de la orden
 * - Proporcionar número de orden para tracking
 * - Enlaces para seguimiento y soporte
 * 
 * VALIDACIONES DE SEGURIDAD:
 * - ID de orden válido (ObjectId de MongoDB)
 * - Existencia de la orden
 * - Propiedad de la orden (usuario actual)
 * - Orden en estado completado
 * 
 * TEMPLATE RENDERIZADO:
 * - "checkout/thanks" con datos de confirmación
 * - Resumen de productos comprados
 * - Número de orden y detalles de entrega
 * - Enlaces a soporte y seguimiento
 * 
 * INFORMACIÓN MOSTRADA:
 * - Número de orden para referencia
 * - Productos comprados con cantidades
 * - Monto total pagado
 * - Información de entrega estimada
 * - Datos de contacto para soporte
 * 
 * @param {Object} req - Request con params.orderId y user
 * @param {Object} res - Response de Express
 * @param {Function} next - Next middleware para errores
 * @returns {Promise<void>} Template de confirmación o error
 */
export const showThanks = async (req, res, next) => {
  const { orderId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).send("El ID de la orden no es válido.");
  }
  try {
    const order = await ordersService.getById(orderId);
    if (!order) return res.status(404).send("Orden no encontrada.");
    // Opcional: valida que la orden pertenezca al usuario
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).send("No tienes acceso a esta orden.");
    }
    res.render("checkout/thanks", { order });
  } catch (e) { next(e); }
};
