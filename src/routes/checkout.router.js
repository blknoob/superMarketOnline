/**
 * ROUTER DE CHECKOUT - PROCESO DE FINALIZACIÓN DE COMPRA
 * 
 * Router especializado en el flujo de checkout y finalización de compras
 * Maneja el proceso completo desde revisión hasta confirmación de pago
 * 
 * FLUJO COMPLETO DE CHECKOUT:
 * 1. Revisión de carrito y datos (GET /checkout)
 * 2. Confirmación de orden (POST /checkout/confirm)
 * 3. Selección y procesamiento de pago (GET /checkout/payment/:orderId)
 * 4. Confirmación final y agradecimiento (GET /checkout/thanks/:orderId)
 * 
 * CARACTERÍSTICAS DEL PROCESO:
 * - Todas las rutas requieren autenticación
 * - Proceso secuencial con validaciones en cada paso
 * - Manejo de estados de orden
 * - Integración con sistema de pagos
 * - Renderizado de vistas especializadas
 * 
 * SEGURIDAD:
 * - Middleware de autenticación en todas las rutas
 * - Validación de propiedad de orden
 * - Estados de orden para prevenir manipulación
 * - Tokens de seguridad para transacciones
 * 
 * INTEGRACIÓN:
 * - CheckoutController: Lógica de proceso
 * - Views: Templates especializados para cada paso
 * - PaymentsService: Procesamiento de pagos
 * - OrdersService: Gestión de órdenes
 * 
 * BASE PATH: /checkout
 * SECURITY LEVEL: Alto (autenticación requerida)
 */
import { Router } from "express";
import { authenticateToken as ensureAuth } from "../middlewares/auth.middleware.js";
import { showCheckout, confirmOrder, showPayment, showThanks } from "../controllers/checkout.controller.js";

const router = Router();

/**
 * FLUJO SECUENCIAL DE CHECKOUT
 * 
 * Conjunto de endpoints que manejan el proceso completo de finalización
 * Cada endpoint representa un paso específico del proceso
 */

/**
 * MOSTRAR PÁGINA DE CHECKOUT
 * GET /checkout
 * 
 * Primera etapa del proceso de checkout
 * Muestra resumen del carrito y formulario de datos de envío
 * 
 * FUNCIONALIDADES:
 * - Resumen de productos en carrito
 * - Cálculo de totales y envío
 * - Formulario de dirección de entrega
 * - Validación de stock final
 * 
 * MIDDLEWARE: ensureAuth (autenticación requerida)
 * CONTROLLER: checkout.controller.showCheckout
 * RESPONSE: Renderizado de vista checkout/detail.hbs
 * SECURITY: Solo usuario autenticado, validación de carrito no vacío
 */
router.get("/checkout", ensureAuth, showCheckout);

/**
 * CONFIRMAR ORDEN DE COMPRA
 * POST /checkout/confirm
 * 
 * Segunda etapa - procesamiento de confirmación
 * Crea orden oficial y redirige a selección de pago
 * 
 * PROCESO:
 * 1. Validar datos de checkout
 * 2. Crear orden en base de datos
 * 3. Reservar stock de productos
 * 4. Redirigir a selección de pago
 * 
 * BODY: Datos de dirección y envío del formulario
 * MIDDLEWARE: ensureAuth (autenticación requerida)
 * CONTROLLER: checkout.controller.confirmOrder
 * RESPONSE: Redirección a /checkout/payment/:orderId
 * SECURITY: Validaciones de stock, creación atómica de orden
 */
router.post("/checkout/confirm", ensureAuth, confirmOrder);

/**
 * MOSTRAR PÁGINA DE PAGO
 * GET /checkout/payment/:orderId
 * 
 * Tercera etapa - selección de método de pago
 * Presenta opciones de pago disponibles para la orden
 * 
 * PARAMS: orderId - ObjectId de la orden creada
 * 
 * FUNCIONALIDADES:
 * - Resumen final de orden
 * - Métodos de pago disponibles
 * - Formularios de captura de pago
 * - Integración con pasarelas
 * 
 * MIDDLEWARE: ensureAuth (autenticación requerida)
 * CONTROLLER: checkout.controller.showPayment
 * RESPONSE: Renderizado de vista checkout/payment.hbs
 * SECURITY: Validación de propiedad de orden, estado pendiente
 */
router.get("/checkout/payment/:orderId", ensureAuth, showPayment);

/**
 * MOSTRAR PÁGINA DE AGRADECIMIENTO
 * GET /checkout/thanks/:orderId
 * 
 * Última etapa - confirmación final del proceso
 * Página de agradecimiento y resumen de compra completada
 * 
 * PARAMS: orderId - ObjectId de la orden procesada
 * 
 * FUNCIONALIDADES:
 * - Confirmación de compra exitosa
 * - Detalles de orden y entrega
 * - Enlace a ticket de compra
 * - Información de seguimiento
 * 
 * MIDDLEWARE: ensureAuth (autenticación requerida)
 * CONTROLLER: checkout.controller.showThanks
 * RESPONSE: Renderizado de vista checkout/thanks.hbs
 * SECURITY: Validación de orden completada, acceso por propietario
 */
router.get("/checkout/thanks/:orderId", ensureAuth, showThanks);

export default router;
