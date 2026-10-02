/**
 * DAO DE INTENCIONES DE PAGO (PAYMENT INTENTS)
 * 
 * Data Access Object para gestionar todo el proceso de pagos del sistema
 * Maneja las intenciones de pago desde creación hasta confirmación final
 * 
 * Funcionalidad central del sistema de pagos:
 * - Creación de intenciones cuando usuario selecciona método de pago
 * - Seguimiento de estado durante el proceso de verificación
 * - Actualización cuando se verifica o rechaza el pago
 * - Búsqueda para auditoría y administración
 * 
 * Flujo completo de vida:
 * 1. Usuario procede al checkout → Orden creada
 * 2. Usuario selecciona método → PaymentIntent creado (status: "pending")
 * 3. Usuario sube comprobante → PaymentIntent actualizado
 * 4. Admin verifica → status: "verified" 
 * 5. Sistema procesa → status: "paid"
 * 6. Orden marcada como "paid" → Ticket generado
 * 
 * Métodos de pago soportados:
 * - Pago Móvil (VES): Requiere referencia bancaria
 * - Zelle (USD): Puede no requerir referencia
 * - Transferencia bancaria (USD): Requiere referencia
 * 
 * Estados del proceso:
 * - "pending": Esperando acción del usuario
 * - "verified": Comprobante verificado por admin
 * - "paid": Pago procesado exitosamente
 * - "failed": Pago rechazado o con errores
 * 
 * Características técnicas:
 * - Uso extensivo de .lean() para optimización
 * - Búsquedas flexibles con filtros personalizados
 * - Actualizaciones atómicas con { new: true }
 */

import PaymentIntent from "./models/paymentIntent.model.js";

/**
 * CLASE DAO PARA PAYMENT INTENTS
 * Implementa operaciones de persistencia del sistema de pagos
 * Diseñada para máximo rendimiento con métodos concisos
 */
export default class PaymentIntentDAO {

  /**
   * BUSCAR PAYMENT INTENT POR ID
   * 
   * Obtiene una intención de pago específica por su ObjectId
   * Usa .lean() para rendimiento optimizado
   * 
   * @param {string|ObjectId} id - ID del PaymentIntent a buscar
   * @returns {Promise<Object|null>} PaymentIntent encontrado (objeto JS plano) o null
   */
  async findById(id) { 
    return PaymentIntent.findById(id).lean(); 
  }

  /**
   * BUSCAR PAYMENT INTENT CON FILTRO PERSONALIZADO
   * 
   * Búsqueda flexible usando cualquier combinación de campos
   * Muy útil para consultas específicas del negocio
   * 
   * Ejemplos de filtros comunes:
   * - { orderId: orderObjectId } → PaymentIntent de una orden específica
   * - { status: "pending" } → Todos los pagos pendientes
   * - { method: "pago_movil" } → Solo pagos móviles
   * - { status: "verified", method: "zelle" } → Zelles verificados
   * 
   * @param {Object} filter - Filtro MongoDB para la búsqueda
   * @returns {Promise<Object|null>} Primer PaymentIntent que coincida o null
   */
  async findOne(filter) { 
    return PaymentIntent.findOne(filter).lean(); 
  }

  /**
   * CREAR NUEVA INTENCIÓN DE PAGO
   * 
   * Genera un nuevo PaymentIntent al iniciar proceso de pago
   * Se ejecuta cuando usuario selecciona método de pago
   * 
   * @param {Object} data - Datos completos del PaymentIntent
   * @param {ObjectId} data.orderId - ID de la orden asociada
   * @param {number} data.amount - Monto a pagar
   * @param {string} data.currency - Moneda ("VES" o "USD")
   * @param {string} data.method - Método ("pago_movil", "zelle", "transfer")
   * @param {string} [data.status="pending"] - Estado inicial
   * @param {string} [data.reference] - Referencia bancaria (si aplica)
   * @param {string} [data.customerProof] - Ruta del comprobante subido
   * @returns {Promise<Object>} PaymentIntent creado con _id generado
   */
  async create(data) { 
    return PaymentIntent.create(data); 
  }

  /**
   * ACTUALIZAR PAYMENT INTENT POR ID
   * 
   * Actualiza un PaymentIntent específico usando su ObjectId
   * Devuelve el documento actualizado con { new: true }
   * 
   * Usos comunes:
   * - Cambiar estado cuando se verifica pago
   * - Agregar referencia bancaria cuando usuario la proporciona
   * - Actualizar ruta de comprobante cuando se sube archivo
   * - Marcar como failed si se rechaza el pago
   * 
   * @param {string|ObjectId} id - ID del PaymentIntent a actualizar
   * @param {Object} update - Campos a actualizar
   * @returns {Promise<Object|null>} PaymentIntent actualizado o null si no existe
   */
  async updateById(id, update) { 
    return PaymentIntent.findByIdAndUpdate(id, update, { new: true }).lean(); 
  }

  /**
   * ACTUALIZAR PAYMENT INTENT CON FILTRO PERSONALIZADO
   * 
   * Actualiza el primer documento que coincida con el filtro
   * Útil cuando no se tiene el ID pero sí otros identificadores
   * 
   * Casos de uso:
   * - Actualizar por orderId cuando se confirma el pago
   * - Cambiar estado de todos los PaymentIntents de una orden
   * - Actualizar por combinación de filtros complejos
   * 
   * @param {Object} filter - Filtro para encontrar el documento
   * @param {Object} update - Campos a actualizar
   * @returns {Promise<Object|null>} PaymentIntent actualizado o null
   */
  async updateOne(filter, update) { 
    return PaymentIntent.findOneAndUpdate(filter, update, { new: true }).lean(); 
  }
}
