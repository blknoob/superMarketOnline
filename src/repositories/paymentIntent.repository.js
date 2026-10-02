/**
 * REPOSITORY DE PAYMENT INTENTS - GESTIÓN DE INTENCIONES DE PAGO
 * 
 * Repository que maneja las intenciones de pago del sistema de e-commerce
 * Un PaymentIntent representa una transacción financiera específica entre el
 * momento de checkout y la confirmación final del pago
 * 
 * FUNCIÓN PRINCIPAL:
 * Los PaymentIntents actúan como bridge entre el sistema interno y los
 * payment processors externos (Stripe, MercadoPago, PayPal, etc.)
 * 
 * CICLO DE VIDA DE UN PAYMENT INTENT:
 * 1. CREATED - Se crea al iniciar checkout
 * 2. PENDING - Enviado al payment processor
 * 3. PROCESSING - El usuario está completando el pago
 * 4. SUCCEEDED - Pago confirmado exitosamente
 * 5. CANCELLED - Cancelado por timeout o usuario
 * 6. FAILED - Error en el pago (tarjeta rechazada, fondos insuficientes, etc.)
 * 
 * INTEGRACIÓN CON PAYMENT PROCESSORS:
 * 
 * STRIPE INTEGRATION:
 * - Se crea PaymentIntent en Stripe API
 * - Se guarda Stripe PI ID para tracking
 * - Webhooks actualizan estado automáticamente
 * - Manejo de 3D Secure y SCA compliance
 * 
 * MERCADOPAGO INTEGRATION:
 * - Se crea preferencia de pago
 * - Se almacena preference_id para seguimiento
 * - IPN/Webhooks para notificaciones
 * - Soporte para múltiples métodos de pago
 * 
 * OTROS PROCESSORS:
 * - PayPal: Express Checkout integration
 * - Square: Terminal y online payments
 * - Extensible para nuevos providers
 * 
 * CARACTERÍSTICAS CRÍTICAS:
 * - Idempotencia: Múltiples intentos no crean duplicados
 * - Timeout automático para pagos abandonados
 * - Logs detallados para auditoría financial
 * - Reconciliación automática con webhooks
 * - Retry logic para fallos temporales
 * - Seguridad PCI-compliant
 * 
 * CASOS DE USO:
 * - Inicializar pago en checkout
 * - Confirmar pago via webhook
 * - Cancelar pagos por timeout
 * - Reintento de pagos fallidos
 * - Reportes financieros
 * - Reconciliación contable
 * - Monitoreo de conversion rates
 * 
 * RELACIONES CON OTRAS ENTIDADES:
 * - Order: Un PaymentIntent pertenece a una Order
 * - User: Asociado al usuario que realiza el pago
 * - Ticket: Se genera al confirmar pago exitoso
 * - Cart: Origen de los datos de pago
 * 
 * SEGURIDAD IMPLEMENTADA:
 * - Validación de montos contra Order original
 * - Verificación de signatures en webhooks
 * - Logs seguros (sin datos sensibles de tarjetas)
 * - Rate limiting para prevenir ataques
 * - Encryption de datos sensibles en transit
 * 
 * PATRÓN ARQUITECTURAL:
 * Controller → Service → Repository → DAO → Model → MongoDB
 * Payment Processor ← Webhook → Service → Repository
 */

import PaymentIntentDAO from "./daos/mongo/paymentIntent.dao.js";

/**
 * CLASE REPOSITORY PARA PAYMENT INTENTS
 * Proporciona interface segura para operaciones de payment processing
 */
class PaymentIntentRepository {
  /**
   * CONSTRUCTOR
   * Inicializa repository con instancia del DAO de PaymentIntents
   */
  constructor() {
    this.dao = new PaymentIntentDAO();
  }

  /**
   * CREAR NUEVO PAYMENT INTENT
   * 
   * Método principal para inicializar proceso de pago
   * Se ejecuta al momento del checkout, antes de redirigir al payment processor
   * 
   * Proceso típico de creación:
   * 1. Se valida la order asociada y sus montos
   * 2. Se crea PaymentIntent en nuestro sistema (estado CREATED)
   * 3. Se crea PaymentIntent en el payment processor externo
   * 4. Se almacena ID externo para tracking bidireccional
   * 5. Se actualiza estado a PENDING
   * 6. Se retornan datos para redirección del usuario
   * 7. Se inicia timeout automático para cancelación
   * 
   * Campos críticos del PaymentIntent:
   * - orderId: Referencia a la order asociada
   * - amount: Monto en centavos (ej: $10.50 = 1050)
   * - currency: Código de moneda (USD, ARS, EUR, etc.)
   * - paymentMethod: Método seleccionado (card, bank_transfer, etc.)
   * - status: Estado actual del payment
   * - externalId: ID en el payment processor
   * - clientSecret: Para autenticación en frontend (Stripe)
   * 
   * @param {Object} paymentData - Datos completos del payment intent
   * @param {string|ObjectId} paymentData.orderId - ID de la order asociada
   * @param {number} paymentData.amount - Monto en centavos
   * @param {string} paymentData.currency - Código de moneda (USD, ARS, etc.)
   * @param {string} paymentData.paymentMethod - Método de pago
   * @param {Object} paymentData.metadata - Metadata adicional del processor
   * @returns {Promise<Object>} PaymentIntent creado con datos del processor
   * @throws {Error} Si hay errores en processor externo o validación
   */
  async create(paymentData) {
    try {
      return await this.dao.create(paymentData);
    } catch (error) {
      throw new Error(`Error creando PaymentIntent: ${error.message}`);
    }
  }

  /**
   * BUSCAR PAYMENT INTENT POR ID
   * 
   * Obtiene un PaymentIntent específico con toda su información
   * Incluye datos tanto internos como del payment processor
   * 
   * Información incluida:
   * - Estado actual y historial de cambios
   * - Datos de la order asociada
   * - Información del payment processor
   * - Timestamps de todas las transiciones
   * - Metadata y detalles de error (si los hay)
   * 
   * Casos de uso:
   * - Verificar estado de pago en tiempo real
   * - Mostrar detalles al usuario en "Mi cuenta"
   * - Debugging de pagos problemáticos
   * - Customer service para consultas
   * - Auditoría de transacciones específicas
   * 
   * @param {string|ObjectId} id - ID del PaymentIntent a buscar
   * @returns {Promise<Object|null>} PaymentIntent encontrado o null
   * @throws {Error} Si hay errores de consulta
   */
  async getById(id) {
    try {
      return await this.dao.findById(id);
    } catch (error) {
      throw new Error(`Error buscando PaymentIntent: ${error.message}`);
    }
  }

  /**
   * BUSCAR PAYMENT INTENT POR ID EXTERNO
   * 
   * Encuentra PaymentIntent usando el ID del payment processor
   * Método crítico para procesar webhooks de confirmación de pago
   * 
   * Flujo típico de webhook:
   * 1. Payment processor envía webhook con su ID interno
   * 2. Se usa este método para encontrar nuestro PaymentIntent
   * 3. Se valida la signature y autenticidad del webhook
   * 4. Se actualiza el estado según la notificación
   * 5. Se ejecutan acciones post-pago (generar ticket, etc.)
   * 
   * Processors soportados:
   * - Stripe: Usa "pi_" prefix (ej: "pi_1234567890abcdef")
   * - MercadoPago: Usa preference_id numérico
   * - PayPal: Usa order_id alfanumérico
   * - Square: Usa location_id + payment_id
   * 
   * @param {string} externalId - ID del PaymentIntent en el processor externo
   * @returns {Promise<Object|null>} PaymentIntent encontrado o null
   * @throws {Error} Si hay errores de consulta
   */
  async findByExternalId(externalId) {
    try {
      return await this.dao.findByExternalId(externalId);
    } catch (error) {
      throw new Error(`Error buscando PaymentIntent por ID externo: ${error.message}`);
    }
  }

  /**
   * ACTUALIZAR ESTADO DE PAYMENT INTENT
   * 
   * Método crítico para transiciones de estado durante el payment flow
   * Cada cambio de estado puede disparar acciones automáticas en el sistema
   * 
   * TRANSICIONES VÁLIDAS Y ACCIONES ASOCIADAS:
   * 
   * CREATED → PENDING:
   * - PaymentIntent enviado al processor externo
   * - Usuario redirigido a página de pago
   * - Se inicia timer de timeout automático
   * 
   * PENDING → PROCESSING:
   * - Usuario comenzó proceso de pago
   * - Validaciones de seguridad en progreso
   * - 3D Secure o SCA si es requerido
   * 
   * PROCESSING → SUCCEEDED:
   * - Pago confirmado exitosamente
   * - Se actualiza estado de Order a COMPLETED
   * - Se genera Ticket de compra
   * - Se actualiza stock de productos
   * - Se limpia carrito del usuario
   * - Se envía email de confirmación
   * - Se registra revenue en analytics
   * 
   * PENDING → FAILED:
   * - Error en el pago (tarjeta rechazada, etc.)
   * - Se libera stock reservado en Order
   * - Se logea motivo del error para análisis
   * - Se permite retry si es error recuperable
   * 
   * PENDING → CANCELLED:
   * - Cancelado por timeout o usuario
   * - Se libera stock de Order asociada
   * - Se actualiza Order a CANCELLED
   * - Se limpia recursos asociados
   * 
   * @param {string|ObjectId} id - ID del PaymentIntent a actualizar
   * @param {string} newStatus - Nuevo estado (succeeded, failed, cancelled, etc.)
   * @param {Object} updateData - Datos adicionales del update
   * @returns {Promise<Object|null>} PaymentIntent actualizado o null
   * @throws {Error} Si la transición no es válida o hay errores
   */
  async updateStatus(id, newStatus, updateData = {}) {
    try {
      return await this.dao.updateStatus(id, newStatus, updateData);
    } catch (error) {
      throw new Error(`Error actualizando estado de PaymentIntent: ${error.message}`);
    }
  }

  /**
   * BUSCAR PAYMENT INTENTS POR ORDER
   * 
   * Obtiene todos los PaymentIntents asociados a una Order específica
   * Una Order puede tener múltiples intentos de pago (retries)
   * 
   * Casos comunes de múltiples PaymentIntents:
   * - Primer intento falló por tarjeta rechazada
   * - Usuario cambió método de pago
   * - Error temporal en payment processor
   * - 3D Secure falló y se reintenta
   * - Timeout y nuevo intento
   * 
   * Información útil para análisis:
   * - Conversion rate por método de pago
   * - Principales causas de fallo de pago
   * - Tiempo promedio para pago exitoso
   * - Efectividad de retry logic
   * 
   * @param {string|ObjectId} orderId - ID de la Order
   * @returns {Promise<Array>} Array de PaymentIntents para la Order
   * @throws {Error} Si hay errores de consulta
   */
  async findByOrder(orderId) {
    try {
      return await this.dao.findByOrder(orderId);
    } catch (error) {
      throw new Error(`Error buscando PaymentIntents por Order: ${error.message}`);
    }
  }

  /**
   * BUSCAR PAYMENT INTENTS POR USUARIO
   * 
   * Lista todos los PaymentIntents de un usuario específico
   * Útil para historial de pagos y customer service
   * 
   * Información incluida:
   * - Todos los intentos de pago del usuario
   * - Estados exitosos y fallidos
   * - Métodos de pago utilizados
   * - Montos y fechas de transacciones
   * - Orders asociadas
   * 
   * Casos de uso:
   * - Historial de pagos en "Mi cuenta"
   * - Análisis de comportamiento de pago del usuario
   * - Customer service para resolución de problemas
   * - Detección de patrones fraudulentos
   * - Reportes de customer lifetime value
   * 
   * @param {string|ObjectId} userId - ID del usuario
   * @returns {Promise<Array>} Array de PaymentIntents del usuario
   * @throws {Error} Si hay errores de consulta
   */
  async findByUser(userId) {
    try {
      return await this.dao.findByUser(userId);
    } catch (error) {
      throw new Error(`Error buscando PaymentIntents del usuario: ${error.message}`);
    }
  }

  /**
   * BUSCAR PAYMENT INTENTS POR ESTADO
   * 
   * Encuentra todos los PaymentIntents en un estado específico
   * Método crítico para procesos batch y monitoreo del sistema
   * 
   * CASOS DE USO POR ESTADO:
   * 
   * PENDING:
   * - Identificar pagos abandonados para timeout
   * - Calcular conversion rate de checkout
   * - Alertas de pagos pendientes por mucho tiempo
   * - Análisis de dropout en payment flow
   * 
   * PROCESSING:
   * - Monitorear pagos en progreso
   * - Detectar pagos stuck en processors
   * - Alertas de tiempo excesivo en processing
   * - Troubleshooting de payment processors
   * 
   * SUCCEEDED:
   * - Reportes de revenue por período
   * - Cálculos de comisiones y fees
   * - Analytics de métodos de pago exitosos
   * - Reconciliación con processors
   * 
   * FAILED:
   * - Análisis de causas de fallo
   * - Identificar problemas con processors
   * - Métricas de success rate
   * - Optimización de retry logic
   * 
   * CANCELLED:
   * - Análisis de abandono de pago
   * - Optimización de UX en checkout
   * - Identificar friction points
   * 
   * @param {string} status - Estado a filtrar
   * @returns {Promise<Array>} Array de PaymentIntents en el estado
   * @throws {Error} Si hay errores de consulta
   */
  async findByStatus(status) {
    try {
      return await this.dao.findByStatus(status);
    } catch (error) {
      throw new Error(`Error buscando PaymentIntents por estado: ${error.message}`);
    }
  }

  /**
   * OBTENER TODOS LOS PAYMENT INTENTS (ADMIN)
   * 
   * Lista completa de todos los PaymentIntents del sistema
   * Método para administración y reportes financieros globales
   * 
   * Información para reportes:
   * - Volume total de transacciones
   * - Distribution por método de pago
   * - Success rates por processor
   * - Revenue trends por período
   * - Análisis de conversion rates
   * - Identificación de problemas sistémicos
   * 
   * Usos administrativos:
   * - Dashboard financiero general
   * - Exportación para sistemas contables
   * - Auditoría de transacciones
   * - Reportes regulatorios
   * - Business intelligence y analytics
   * 
   * NOTA: En producción implementar paginación y filtros de fecha
   * El volume de PaymentIntents puede ser muy alto
   * 
   * @returns {Promise<Array>} Array de todos los PaymentIntents
   * @throws {Error} Si hay errores de consulta
   */
  async findAll() {
    try {
      return await this.dao.findAll();
    } catch (error) {
      throw new Error(`Error obteniendo PaymentIntents: ${error.message}`);
    }
  }

  /**
   * ELIMINAR PAYMENT INTENT
   * 
   * ⚠️ OPERACIÓN EXTREMADAMENTE CRÍTICA - USO RESTRINGIDO ⚠️
   * 
   * ADVERTENCIAS IMPORTANTES:
   * - Los PaymentIntents son registros financieros críticos
   * - Su eliminación puede afectar auditorías fiscales
   * - Puede romper reconciliación con payment processors
   * - Impacta reportes financieros y analytics
   * - Puede tener implicaciones legales y regulatorias
   * 
   * CASOS VÁLIDOS EXCEPCIONALES:
   * - PaymentIntents de prueba en desarrollo
   * - Datos corruptos que no se pueden reparar
   * - Cumplimiento legal específico (orden judicial)
   * - Limpieza de datos muy antiguos (con aprobación legal)
   * 
   * PROCESO OBLIGATORIO ANTES DE ELIMINAR:
   * 1. Verificar que no hay Order activa asociada
   * 2. Confirmar que está cancelado en payment processor
   * 3. Validar que no hay Ticket generado
   * 4. Registrar motivo legal de eliminación
   * 5. Obtener aprobación de compliance/legal team
   * 6. Crear backup antes de eliminación
   * 7. Logear eliminación con detalles completos
   * 
   * ALTERNATIVA RECOMENDADA:
   * - Implementar "soft delete" con campo "deleted_at"
   * - Mantener datos para auditoría pero ocultarlos
   * - Usar archivado en lugar de eliminación física
   * 
   * @param {string|ObjectId} id - ID del PaymentIntent a eliminar
   * @returns {Promise<Object|null>} PaymentIntent eliminado o null
   * @throws {Error} Si hay dependencias activas o restricciones legales
   */
  async delete(id) {
    try {
      // En un sistema real, aquí habría validaciones adicionales
      // como verificar compliance, crear audit logs, etc.
      return await this.dao.delete(id);
    } catch (error) {
      throw new Error(`Error eliminando PaymentIntent: ${error.message}`);
    }
  }

  /**
   * BUSCAR PAYMENT INTENTS PENDIENTES PARA TIMEOUT
   * 
   * Encuentra PaymentIntents en estado PENDING que excedieron tiempo límite
   * Utilizado por jobs batch para limpieza automática de pagos abandonados
   * 
   * Criterios para timeout:
   * - Estado PENDING por más de X minutos (configurable)
   * - Sin confirmación del payment processor
   * - Order asociada aún en estado PENDING
   * - No hay actividad reciente del usuario
   * 
   * Proceso de timeout automático:
   * 1. Identificar PaymentIntents candidatos
   * 2. Verificar estado actual en payment processor
   * 3. Si sigue pending, cancelar en processor
   * 4. Actualizar estado local a CANCELLED
   * 5. Liberar stock reservado en Order
   * 6. Actualizar Order a CANCELLED
   * 7. Logear timeout para analytics
   * 8. Opcional: notificar usuario sobre cancelación
   * 
   * Beneficios del timeout automático:
   * - Libera stock para otros usuarios
   * - Mantiene datos limpios y actualizados
   * - Previene PaymentIntents zombi
   * - Mejora métricas de conversion
   * - Reduce load en payment processors
   * 
   * @param {number} timeoutMinutes - Minutos después de timeout
   * @returns {Promise<Array>} PaymentIntents que requieren timeout
   * @throws {Error} Si hay errores de consulta
   */
  async findPendingForTimeout(timeoutMinutes = 30) {
    try {
      return await this.dao.findPendingForTimeout(timeoutMinutes);
    } catch (error) {
      throw new Error(`Error buscando PaymentIntents para timeout: ${error.message}`);
    }
  }

  /**
   * ACTUALIZAR METADATA DEL PAYMENT PROCESSOR
   * 
   * Actualiza información específica recibida del payment processor
   * Usado principalmente por webhooks para sincronizar datos
   * 
   * Información típica actualizada:
   * - Fee charges del processor
   * - Decline codes específicos
   * - Risk assessment scores
   * - 3D Secure authentication results
   * - Fraud detection results
   * - Network transaction IDs
   * - Bank response codes
   * 
   * Casos de uso:
   * - Webhook de Stripe con fee information
   * - MercadoPago con detalles de declined payments
   * - PayPal con fraud prevention data
   * - Reconciliación de fees y charges
   * - Analytics de performance por processor
   * 
   * @param {string|ObjectId} id - ID del PaymentIntent
   * @param {Object} metadata - Metadata del processor
   * @returns {Promise<Object|null>} PaymentIntent actualizado
   * @throws {Error} Si hay errores de actualización
   */
  async updateMetadata(id, metadata) {
    try {
      return await this.dao.updateMetadata(id, metadata);
    } catch (error) {
      throw new Error(`Error actualizando metadata: ${error.message}`);
    }
  }
}

/**
 * EXPORTACIÓN DEL REPOSITORY DE PAYMENT INTENTS
 * 
 * Se exporta la clase para uso en Services
 * Los PaymentIntents son críticos para el revenue del sistema
 * Deben manejarse con extrema seguridad y logging completo
 */
export default PaymentIntentRepository;

