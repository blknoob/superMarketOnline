/**
 * DAO DE TICKETS - COMPROBANTES DE COMPRA
 * 
 * Data Access Object para gestionar todos los comprobantes de compra del sistema
 * Los tickets son documentos INMUTABLES que registran transacciones completadas
 * 
 * Funcionalidades principales:
 * - Generación de comprobantes de compra
 * - Consulta de historial de compras por usuario
 * - Búsquedas por código único de ticket
 * - Operaciones administrativas (listado, actualización)
 * - Populate automático de detalles de productos
 * 
 * Importante:
 * - Los tickets SON INMUTABLES una vez creados
 * - Contienen precios históricos al momento de la compra
 * - Se usan para reportes financieros y auditoría
 * - Requeridos para cumplimiento fiscal
 * 
 * Relaciones:
 * - Referencia productos del catálogo (populate disponible)
 * - Asociado a usuario por email (purchaser field)
 */

import Ticket from "./models/tickets.model.js";

/**
 * CLASE DAO PARA TICKETS
 * Implementa todas las operaciones de persistencia de comprobantes
 */
class TicketsDAO {

  /**
   * BUSCAR TICKET POR ID
   * 
   * Obtiene un ticket específico usando su ObjectId
   * Método básico sin populate para operaciones rápidas
   * 
   * @param {string|ObjectId} id - ID del ticket a buscar
   * @returns {Promise<Object|null>} Ticket encontrado o null
   * @throws {Error} Si el ID es inválido
   */
  async findById(id) {
    return await Ticket.findById(id);
  }

  /**
   * BUSCAR TICKET POR CÓDIGO ÚNICO
   * 
   * Encuentra un ticket usando su código único generado
   * Se usa para:
   * - Mostrar comprobante al cliente
   * - Verificación de compras
   * - Atención al cliente
   * - Búsquedas administrativas
   * 
   * @param {string} code - Código único del ticket (ej: "TKT-20240102-ABC123")
   * @returns {Promise<Object|null>} Ticket encontrado o null
   * @throws {Error} Si hay errores de DB
   */
  async findByCode(code) {
    try {
      return await Ticket.findOne({ code });
    } catch (error) {
      throw new Error(`Error al buscar ticket por código: ${error.message}`);
    }
  }

  /**
   * OBTENER TODOS LOS TICKETS (ADMIN)
   * 
   * Lista completa de todos los tickets del sistema
   * Ordenados por fecha de creación (más recientes primero)
   * 
   * Uso administrativo para:
   * - Reportes de ventas
   * - Auditoría de transacciones
   * - Análisis financiero
   * - Monitoreo del sistema
   * 
   * NOTA: En producción debería implementar paginación
   * 
   * @returns {Promise<Array>} Array de todos los tickets ordenados por fecha
   * @throws {Error} Si hay errores de conexión DB
   */
  async findAll() {
    try {
      return await Ticket.find({}).sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Error al obtener tickets: ${error.message}`);
    }
  }

  /**
   * ACTUALIZAR TICKET
   * 
   * ⚠️ ADVERTENCIA: Los tickets deberían ser INMUTABLES
   * Este método existe para casos excepcionales:
   * - Corrección de errores administrativos
   * - Ajustes por devoluciones
   * - Actualizaciones de estado (si se implementa)
   * 
   * USAR CON EXTREMA PRECAUCIÓN - puede afectar auditoría
   * 
   * @param {string|ObjectId} id - ID del ticket a actualizar
   * @param {Object} updateData - Datos a actualizar (usar mínimo indispensable)
   * @returns {Promise<Object|null>} Ticket actualizado o null
   * @throws {Error} Si hay errores de validación o ticket no existe
   */
  async update(id, updateData) {
    try {
      return await Ticket.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });
    } catch (error) {
      throw new Error(`Error al actualizar ticket: ${error.message}`);
    }
  }

  /**
   * ELIMINAR TICKET
   * 
   * ⚠️ OPERACIÓN CRÍTICA - USAR SOLO EN EMERGENCIAS
   * Los tickets son documentos fiscales y de auditoría
   * 
   * Casos válidos para eliminación:
   * - Tickets de prueba en desarrollo
   * - Errores graves de sistema
   * - Cumplimiento legal (derecho al olvido)
   * 
   * ALTERNATIVA RECOMENDADA: Marcar como "cancelado" en lugar de eliminar
   * 
   * @param {string|ObjectId} id - ID del ticket a eliminar
   * @returns {Promise<Object|null>} Ticket eliminado o null
   * @throws {Error} Si hay errores de DB
   */
  async delete(id) {
    try {
      return await Ticket.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Error al eliminar ticket: ${error.message}`);
    }
  }

  /**
   * OBTENER HISTORIAL DE COMPRAS POR USUARIO
   * 
   * Función principal para mostrar historial de compras al cliente
   * Incluye populate de productos para mostrar detalles completos
   * 
   * Características:
   * - Filtrado por email del comprador (purchaser)
   * - Populate de productos con campos seleccionados
   * - Ordenamiento cronológico (más recientes primero)
   * - Optimizado para mostrar al usuario final
   * 
   * Campos poblados del producto:
   * - title: Nombre del producto
   * - description: Descripción detallada  
   * - price: Precio ACTUAL (puede diferir del histórico)
   * - image: Imagen para mostrar
   * - code: Código SKU
   * 
   * @param {string} userEmail - Email del usuario comprador
   * @returns {Promise<Array>} Array de tickets con productos poblados
   * @throws {Error} Si hay errores de DB o populate
   */
  async findByUser(userEmail) {
    try {
      return await Ticket.find({ purchaser: userEmail })
        .populate('products.product', 'title description price image code')
        .sort({
          createdAt: -1,
        });
    } catch (error) {
      throw new Error(`Error al buscar tickets del usuario: ${error.message}`);
    }
  }

  /**
   * CREAR NUEVO TICKET
   * 
   * Función crítica que genera un comprobante de compra
   * Se ejecuta al finalizar exitosamente una transacción
   * 
   * Proceso típico:
   * 1. Se valida el pago
   * 2. Se genera código único
   * 3. Se crea el ticket con esta función
   * 4. Se actualiza stock de productos
   * 5. Se limpia el carrito
   * 6. Se envía comprobante por email
   * 
   * @param {Object} ticketData - Datos completos del ticket
   * @param {string} ticketData.code - Código único generado
   * @param {number} ticketData.amount - Total de la compra
   * @param {string} ticketData.purchaser - Email del comprador
   * @param {Array} ticketData.products - Array de productos con precio/cantidad histórica
   * @returns {Promise<Object>} Ticket creado con _id generado
   * @throws {Error} Si hay errores de validación o duplicados (código único)
   */
  async create(ticketData) {
    try {
      return await Ticket.create(ticketData);
    } catch (error) {
      throw new Error(`Error creando ticket: ${error.message}`);
    }
  }
}

/**
 * EXPORTACIÓN DEL DAO DE TICKETS
 * 
 * Se exporta la clase para instanciación en el Repository
 * Los tickets son centrales para el proceso de compra y auditoría
 */
export default TicketsDAO;
