/**
 * REPOSITORY DE ORDERS - GESTIÓN DE ÓRDENES DE COMPRA
 * 
 * Repository que maneja el proceso completo de órdenes de compra
 * Una order representa una compra en progreso desde checkout hasta pago confirmado
 * 
 * FLUJO DE VIDA DE UNA ORDER:
 * 1. PENDING - Order creada, pago iniciado pero no confirmado
 * 2. PROCESSING - Pago confirmado, procesando inventario
 * 3. COMPLETED - Order completada, se genera ticket
 * 4. CANCELLED - Order cancelada por timeout o error
 * 5. FAILED - Error irrecuperable en el proceso
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Creación de órdenes desde carrito de compras
 * - Seguimiento de estado de pago (PaymentIntent)
 * - Gestión de estados y transiciones
 * - Timeout automático para órdenes pendientes
 * - Validación de stock al momento del checkout
 * - Integración con sistema de pagos (Stripe/MercadoPago)
 * 
 * CARACTERÍSTICAS CRÍTICAS:
 * - Reserva temporal de stock durante checkout
 * - Control de concurrencia para evitar overselling
 * - Rollback automático en caso de fallas
 * - Logging completo para auditoría
 * - Timeouts configurables para pagos pendientes
 * 
 * CASOS DE USO:
 * - Iniciar proceso de checkout
 * - Confirmar pago recibido
 * - Cancelar order por timeout
 * - Generar reportes de ventas incompletas
 * - Administración de órdenes problemáticas
 * 
 * INTEGRACIÓN CON OTROS COMPONENTES:
 * - PaymentIntent: Para tracking de pagos
 * - Products: Para validación y reserva de stock
 * - Tickets: Para generación al completar
 * - Cart: Para datos base de la order
 * - Users: Para información del comprador
 * 
 * PATRÓN ARQUITECTURAL:
 * Controller → Service → Repository → DAO → Model → MongoDB
 */

import OrdersDAO from "./daos/mongo/orders.dao.js";

/**
 * CLASE REPOSITORY PARA ORDERS
 * Proporciona interface de alto nivel para gestión de órdenes
 */
class OrdersRepository {
  /**
   * CONSTRUCTOR
   * Inicializa el repository con instancia del DAO de orders
   */
  constructor() {
    this.dao = new OrdersDAO();
  }

  /**
   * CREAR NUEVA ORDER
   * 
   * Método principal para iniciar proceso de checkout
   * Convierte un carrito en una order pendiente de pago
   * 
   * Proceso típico de creación:
   * 1. Validar stock disponible de todos los productos
   * 2. Calcular totales y aplicar descuentos/impuestos
   * 3. Crear PaymentIntent asociado
   * 4. Reservar stock temporalmente
   * 5. Crear order en estado PENDING
   * 6. Iniciar timeout para cancelación automática
   * 7. Retornar order con datos para pago
   * 
   * Estados relacionados:
   * - PENDING: Order creada, esperando confirmación de pago
   * - PROCESSING: Si el pago se confirma inmediatamente
   * 
   * @param {Object} orderData - Datos completos de la order
   * @param {string} orderData.userId - ID del usuario comprador
   * @param {Array} orderData.products - Productos con cantidades y precios
   * @param {number} orderData.total - Total calculado de la compra
   * @param {Object} orderData.shippingAddress - Dirección de envío
   * @param {string} orderData.paymentMethod - Método de pago seleccionado
   * @returns {Promise<Object>} Order creada con PaymentIntent
   * @throws {Error} Si hay problemas de stock o validación
   */
  async create(orderData) {
    try {
      return await this.dao.create(orderData);
    } catch (error) {
      throw new Error(`Error creando order: ${error.message}`);
    }
  }

  /**
   * BUSCAR ORDER POR ID
   * 
   * Obtiene una order específica con todos sus datos relacionados
   * Incluye populate automático de productos y payment intent
   * 
   * Datos incluidos:
   * - Información básica de la order (estado, totales, fechas)
   * - Productos con detalles completos (para mostrar al usuario)
   * - PaymentIntent asociado (para estado de pago)
   * - Información del usuario comprador
   * - Dirección de envío completa
   * 
   * @param {string|ObjectId} id - ID de la order a buscar
   * @returns {Promise<Object|null>} Order encontrada con datos poblados o null
   * @throws {Error} Si hay errores de consulta
   */
  async getById(id) {
    try {
      return await this.dao.findById(id);
    } catch (error) {
      throw new Error(`Error buscando order: ${error.message}`);
    }
  }

  /**
   * OBTENER ORDERS POR USUARIO
   * 
   * Lista todas las órdenes de un usuario específico
   * Ordenadas por fecha de creación (más recientes primero)
   * 
   * Casos de uso:
   * - Historial de compras del usuario
   * - Panel de "Mis pedidos" en frontend
   * - Seguimiento de órdenes pendientes
   * - Customer service para consultas
   * 
   * Estados mostrados:
   * - PENDING: Esperando pago
   * - PROCESSING: Pago confirmado, procesando
   * - COMPLETED: Entregado/completado
   * - CANCELLED: Cancelado
   * - FAILED: Error en el proceso
   * 
   * @param {string|ObjectId} userId - ID del usuario
   * @returns {Promise<Array>} Array de orders del usuario
   * @throws {Error} Si hay errores de consulta
   */
  async findByUser(userId) {
    try {
      return await this.dao.findByUser(userId);
    } catch (error) {
      throw new Error(`Error buscando orders del usuario: ${error.message}`);
    }
  }

  /**
   * ACTUALIZAR ESTADO DE ORDER
   * 
   * Método crítico para transiciones de estado durante el flujo de checkout
   * Cada cambio de estado puede disparar acciones automáticas
   * 
   * Transiciones válidas y acciones asociadas:
   * 
   * PENDING → PROCESSING:
   * - Se confirma el pago exitoso
   * - Se consolida la reserva de stock
   * - Se inicia preparación del pedido
   * 
   * PROCESSING → COMPLETED:
   * - Se genera el ticket de compra
   * - Se actualiza stock definitivamente
   * - Se limpia el carrito del usuario
   * - Se envía email de confirmación
   * 
   * PENDING → CANCELLED:
   * - Se libera stock reservado
   * - Se cancela PaymentIntent
   * - Se notifica al usuario
   * 
   * PENDING → FAILED:
   * - Error irrecuperable en el pago
   * - Se libera stock reservado
   * - Se logea error para análisis
   * 
   * @param {string|ObjectId} id - ID de la order a actualizar
   * @param {string} newStatus - Nuevo estado de la order
   * @returns {Promise<Object|null>} Order actualizada o null
   * @throws {Error} Si la transición no es válida o hay errores
   */
  async updateStatus(id, newStatus) {
    try {
      return await this.dao.updateStatus(id, newStatus);
    } catch (error) {
      throw new Error(`Error actualizando estado de order: ${error.message}`);
    }
  }

  /**
   * BUSCAR ORDERS POR ESTADO
   * 
   * Método administrativo para gestión masiva de órdenes
   * Utilizado para procesos batch y monitoreo del sistema
   * 
   * Casos de uso administrativos:
   * 
   * PENDING:
   * - Identificar órdenes que requieren timeout
   * - Reportes de conversion rate (checkout iniciado vs completado)
   * - Análisis de abandono de carrito en checkout
   * 
   * PROCESSING:
   * - Órdenes que requieren preparación/envío
   * - Monitoreo de tiempos de procesamiento
   * - Alertas por demoras en fulfillment
   * 
   * COMPLETED:
   * - Reportes de ventas por período
   * - Análisis de productos más vendidos
   * - Cálculos de revenue
   * 
   * CANCELLED/FAILED:
   * - Análisis de problemas en checkout
   * - Identificación de mejoras necesarias
   * - Reportes de pérdida de ventas
   * 
   * @param {string} status - Estado a filtrar (pending, processing, completed, etc.)
   * @returns {Promise<Array>} Array de orders en el estado especificado
   * @throws {Error} Si hay errores de consulta
   */
  async findByStatus(status) {
    try {
      return await this.dao.findByStatus(status);
    } catch (error) {
      throw new Error(`Error buscando orders por estado: ${error.message}`);
    }
  }

  /**
   * OBTENER TODAS LAS ORDERS (ADMIN)
   * 
   * Lista completa de todas las órdenes del sistema
   * Método para uso administrativo y reportes generales
   * 
   * Información incluida:
   * - Todas las orders sin filtros de estado
   * - Ordenamiento cronológico (más recientes primero)
   * - Datos básicos para dashboard administrativo
   * 
   * Usos típicos:
   * - Dashboard de administración general
   * - Reportes globales de ventas
   * - Análisis de tendencias de compra
   * - Exportación para sistemas contables
   * - Auditoría completa del sistema
   * 
   * NOTA: En producción implementar paginación y filtros de fecha
   * 
   * @returns {Promise<Array>} Array de todas las orders
   * @throws {Error} Si hay errores de consulta
   */
  async findAll() {
    try {
      return await this.dao.findAll();
    } catch (error) {
      throw new Error(`Error obteniendo orders: ${error.message}`);
    }
  }

  /**
   * ELIMINAR ORDER
   * 
   * ⚠️ OPERACIÓN CRÍTICA - USAR CON EXTREMA PRECAUCIÓN ⚠️
   * 
   * La eliminación de orders puede afectar:
   * - Integridad de reportes financieros
   * - Auditoría de transacciones
   * - Datos de analytics y business intelligence
   * - Historial del usuario
   * 
   * Casos válidos para eliminación:
   * - Orders de prueba en desarrollo
   * - Datos corruptos que no se pueden reparar
   * - Cumplimiento legal específico (GDPR, etc.)
   * - Limpieza de orders muy antiguas (con aprobación)
   * 
   * ALTERNATIVA RECOMENDADA:
   * - Implementar "soft delete" o estado "archived"
   * - Mantener datos para auditoría pero ocultarlos en UI
   * 
   * PROCESO ANTES DE ELIMINAR:
   * 1. Verificar que no hay tickets asociados
   * 2. Confirmar que PaymentIntent está cancelado
   * 3. Liberar cualquier stock reservado
   * 4. Registrar motivo de eliminación en logs
   * 
   * @param {string|ObjectId} id - ID de la order a eliminar
   * @returns {Promise<Object|null>} Order eliminada o null
   * @throws {Error} Si hay dependencias activas o errores
   */
  async delete(id) {
    try {
      return await this.dao.delete(id);
    } catch (error) {
      throw new Error(`Error eliminando order: ${error.message}`);
    }
  }

  /**
   * BUSCAR ORDERS POR PAYMENTINTENT
   * 
   * Encuentra la order asociada a un PaymentIntent específico
   * Método crítico para webhooks de payment processors
   * 
   * Casos de uso:
   * - Webhook de Stripe confirma pago → actualizar order
   * - Webhook de MercadoPago notifica pago → cambiar estado
   * - Verificación manual de pagos problemáticos
   * - Reconciliación de pagos vs orders
   * 
   * Flujo típico de webhook:
   * 1. Payment processor envía notificación
   * 2. Se usa este método para encontrar order asociada
   * 3. Se valida el monto y estado del pago
   * 4. Se actualiza estado de order según resultado
   * 5. Se ejecutan acciones post-confirmación de pago
   * 
   * @param {string|ObjectId} paymentIntentId - ID del PaymentIntent
   * @returns {Promise<Object|null>} Order asociada al PaymentIntent o null
   * @throws {Error} Si hay errores de consulta
   */
  async findByPaymentIntent(paymentIntentId) {
    try {
      return await this.dao.findByPaymentIntent(paymentIntentId);
    } catch (error) {
      throw new Error(`Error buscando order por PaymentIntent: ${error.message}`);
    }
  }

  /**
   * OBTENER ORDERS PENDIENTES PARA TIMEOUT
   * 
   * Encuentra orders en estado PENDING que han excedido tiempo límite
   * Utilizado por procesos batch para limpieza automática
   * 
   * Criterios para timeout:
   * - Estado PENDING por más de X minutos (configurable)
   * - PaymentIntent sin confirmar
   * - Stock aún reservado
   * 
   * Proceso de timeout:
   * 1. Identificar orders candidatas con este método
   * 2. Validar que PaymentIntent sigue pending
   * 3. Liberar stock reservado
   * 4. Cambiar estado a CANCELLED
   * 5. Notificar al usuario sobre cancelación
   * 6. Limpiar recursos asociados
   * 
   * Beneficios del timeout:
   * - Libera stock para otros usuarios
   * - Mantiene inventario actualizado
   * - Evita orders zombi en el sistema
   * - Mejora experiencia de usuario (stock real)
   * 
   * @param {number} timeoutMinutes - Minutos después de los cuales hacer timeout
   * @returns {Promise<Array>} Array de orders que requieren timeout
   * @throws {Error} Si hay errores de consulta
   */
  async findPendingForTimeout(timeoutMinutes = 30) {
    try {
      return await this.dao.findPendingForTimeout(timeoutMinutes);
    } catch (error) {
      throw new Error(`Error buscando orders para timeout: ${error.message}`);
    }
  }
}

/**
 * EXPORTACIÓN DEL REPOSITORY DE ORDERS
 * 
 * Se exporta la clase para uso en Services
 * Las orders son críticas para el proceso de checkout y deben manejarse con cuidado
 */
export default OrdersRepository;

