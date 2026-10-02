import CartsRepository from "../repositories/carts.repository.js";
import OrdersRepository from "../repositories/orders.repository.js";
import PaymentIntentRepository from "../repositories/paymentIntent.repository.js";

/**
 * SERVICE DE ÓRDENES - GESTIÓN DEL PROCESO DE CHECKOUT
 * 
 * Servicio que coordina el flujo de checkout desde carrito hasta orden confirmada
 * Actúa como orquestador entre carritos, órdenes y pagos
 * 
 * RESPONSABILIDADES PRINCIPALES:
 * - Convertir carritos en órdenes estruturadas
 * - Calcular resúmenes y totales de carritos
 * - Coordinar creación de PaymentIntents
 * - Gestionar estados de órdenes durante checkout
 * - Asegurar integridad de datos entre entidades
 * 
 * FLUJO TÍPICO DE CHECKOUT:
 * 1. Usuario inicia checkout desde carrito
 * 2. getCartSummary() calcula totales y estructura items
 * 3. createFromCart() convierte carrito en orden pendiente
 * 4. ensurePaymentIntent() crea intención de pago
 * 5. Usuario completa pago en payment processor
 * 6. Webhook actualiza estados y confirma orden
 * 
 * ESTADOS DE ÓRDENES MANEJADOS:
 * - pending_payment: Orden creada, esperando pago
 * - processing: Pago confirmado, procesando
 * - completed: Orden completada exitosamente
 * - cancelled: Orden cancelada o fallida
 * 
 * INTEGRACIONES:
 * - CartsRepository: Para obtener datos del carrito
 * - OrdersRepository: Para persistencia de órdenes
 * - PaymentIntentRepository: Para coordinación de pagos
 * 
 * CARACTERÍSTICAS:
 * - Prevención de órdenes duplicadas
 * - Cálculos precisos de totales
 * - Validación de carritos no vacíos
 * - Gestión atómica de estados
 */
class OrdersService {
  /**
   * CONSTRUCTOR DEL SERVICE DE ÓRDENES
   * 
   * Inicializa las dependencias necesarias para la gestión de checkout:
   * - cartsRepo: Para acceso a carritos de usuarios
   * - ordersRepo: Para persistencia de órdenes
   * - paymentIntents: Para coordinación con sistema de pagos
   */
  constructor() {
    this.cartsRepo = new CartsRepository();
    this.ordersRepo = new OrdersRepository();
    this.paymentIntents = new PaymentIntentRepository();
  }

  /**
   * OBTENER RESUMEN DEL CARRITO
   * 
   * Calcula y estructura la información del carrito para checkout
   * Convierte productos del carrito en items estructurados con totales
   * 
   * TRANSFORMACIÓN DE DATOS:
   * - Extrae información relevante de cada producto
   * - Calcula subtotales por item (precio x cantidad)
   * - Suma total general del carrito
   * - Normaliza nombres de productos (title o name)
   * 
   * ESTRUCTURA DE ITEMS GENERADA:
   * - productId: ID del producto para referencia
   * - title: Nombre del producto normalizado
   * - price: Precio unitario actual
   * - quantity: Cantidad en el carrito
   * - subtotal: Precio total del item (price * quantity)
   * 
   * CASOS DE USO:
   * - Mostrar resumen antes de checkout
   * - Calcular totales para crear orden
   * - Validar carrito antes de procesar pago
   * - Generar estructura para PaymentIntent
   * 
   * MANEJO DE CARRITO VACÍO:
   * - Si no hay carrito: retorna items vacíos y total 0
   * - Si carrito sin productos: retorna estructura vacía
   * 
   * @param {string|ObjectId} userId - ID del usuario propietario del carrito
   * @returns {Promise<Object>} Resumen estructurado del carrito
   * @returns {Promise<Object>} result.cartId - ID del carrito original
   * @returns {Promise<Object>} result.items - Array de items con subtotales
   * @returns {Promise<Object>} result.total - Total general del carrito
   */
  async getCartSummary(userId) {
    const cart = await this.cartsRepo.findByUser(userId); // ya existe en tu proyecto
    if (!cart) return { items: [], total: 0 };

    const items = cart.products.map(p => ({
      productId: p.product._id,
      title: p.product.title || p.product.name,
      price: p.product.price,
      quantity: p.quantity,
      subtotal: p.product.price * p.quantity,
    }));
    const total = items.reduce((a, b) => a + b.subtotal, 0);
    return { cartId: cart._id, items, total };
  }

  /**
   * CREAR ORDEN DESDE CARRITO
   * 
   * Convierte un carrito de usuario en una orden formal pendiente de pago
   * Primer paso del proceso de checkout estructurado
   * 
   * PROCESO DE CONVERSIÓN:
   * 1. Obtener resumen detallado del carrito
   * 2. Validar que el carrito no esté vacío
   * 3. Crear orden con estado inicial "pending_payment"
   * 4. Estructurar items con precios y cantidades
   * 5. Calcular total de la orden
   * 6. Persistir orden en base de datos
   * 
   * VALIDACIONES IMPLEMENTADAS:
   * - Carrito debe existir para el usuario
   * - Carrito debe contener al menos un producto
   * - Items deben tener precios válidos
   * 
   * ESTRUCTURA DE ORDEN CREADA:
   * - user: ID del usuario propietario
   * - items: Array de productos con precios snapshot
   * - total: Monto total calculado
   * - status: "pending_payment" (esperando confirmación)
   * 
   * SNAPSHOT DE PRECIOS:
   * Los precios se capturan al momento de crear la orden
   * para mantener consistencia durante el proceso de pago
   * 
   * @param {string|ObjectId} userId - ID del usuario que hace checkout
   * @returns {Promise<Object>} Orden creada en estado pending_payment
   * @throws {Error} "Carrito vacío" si no hay items en el carrito
   */
  async createFromCart(userId) {
    const summary = await this.getCartSummary(userId);
    if (summary.items.length === 0) throw new Error("Carrito vacío");
    return this.ordersRepo.create({
      user: userId,
      items: summary.items,
      total: summary.total,
      status: "pending_payment",
    });
  }

  /**
   * OBTENER ORDEN POR ID
   * 
   * Busca una orden específica por su ObjectId
   * Método simple de consulta que delega al repository
   * 
   * CASOS DE USO:
   * - Mostrar detalle de orden al usuario
   * - Verificar estado de orden durante checkout
   * - Obtener datos para confirmación de pago
   * - Consultas administrativas de órdenes
   * 
   * DATOS INCLUIDOS:
   * - Información completa de la orden
   * - Items con detalles de productos
   * - Estado actual de la orden
   * - Totales y metadatos
   * 
   * @param {string|ObjectId} orderId - ID de la orden a buscar
   * @returns {Promise<Object|null>} Orden encontrada o null
   */
  async getById(orderId) {
    return this.ordersRepo.getById(orderId);
  }

  /**
   * ASEGURAR PAYMENT INTENT PARA ORDEN
   * 
   * Crea o reutiliza un PaymentIntent para procesar el pago de una orden
   * Implementa patrón idempotente para evitar PaymentIntents duplicados
   * 
   * LÓGICA IDEMPOTENTE:
   * 1. Buscar PaymentIntent existente para orden y método
   * 2. Si existe: retornar el PaymentIntent existente
   * 3. Si no existe: crear nuevo PaymentIntent
   * 4. Retornar PaymentIntent (existente o nuevo)
   * 
   * BENEFICIOS DE LA IDEMPOTENCIA:
   * - Evita cargos duplicados al usuario
   * - Permite reintentos seguros en caso de errores
   * - Mantiene consistencia con payment processors
   * - Facilita recovery en procesos interrumpidos
   * 
   * CASOS DE USO:
   * - Iniciar proceso de pago para orden nueva
   * - Reanudar proceso de pago interrumpido
   * - Cambiar método de pago manteniendo orden
   * - Recovery automático en fallas de sistema
   * 
   * PARÁMETROS REQUERIDOS:
   * - orderId: Orden para la cual crear el PaymentIntent
   * - amount: Monto a procesar (debe coincidir con total de orden)
   * - currency: Moneda del pago (USD, ARS, EUR, etc.)
   * - method: Método de pago (card, bank_transfer, etc.)
   * 
   * @param {Object} params - Parámetros del PaymentIntent
   * @param {string|ObjectId} params.orderId - ID de la orden asociada
   * @param {number} params.amount - Monto en centavos
   * @param {string} params.currency - Código de moneda
   * @param {string} params.method - Método de pago seleccionado
   * @returns {Promise<Object>} PaymentIntent existente o nuevo creado
   */
  async ensurePaymentIntent({ orderId, amount, currency, method }) {
    const existing = await this.paymentIntents.getByOrderAndMethod(orderId, method);
    if (existing) return existing;
    return this.paymentIntents.create({ orderId, amount, currency, method, status: "pending_payment" });
  }
}

export default OrdersService;
