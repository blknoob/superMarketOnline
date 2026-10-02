/**
 * REPOSITORY DE TICKETS - COMPROBANTES DE COMPRA
 * 
 * Repository que gestiona todos los comprobantes de compra del sistema
 * Los tickets son documentos INMUTABLES que registran transacciones completadas
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Generación y gestión de comprobantes de compra
 * - Consulta de historial de compras por usuario
 * - Búsquedas por código único de ticket
 * - Operaciones administrativas y reportes
 * - Validaciones de integridad de datos
 * 
 * CARACTERÍSTICAS IMPORTANTES:
 * - Los tickets SON INMUTABLES una vez creados
 * - Contienen precios históricos para auditoría
 * - Se usan para reportes financieros y fiscales
 * - Cada ticket tiene un código único para tracking
 * - Incluyen populate automático de productos
 * 
 * CASOS DE USO:
 * - Generar ticket al completar compra
 * - Mostrar historial de compras al usuario
 * - Búsqueda de comprobantes por código
 * - Reportes administrativos de ventas
 * - Auditoría y seguimiento de transacciones
 * 
 * VALIDACIONES IMPLEMENTADAS:
 * - Validación de ObjectId para seguridad
 * - Verificación de existencia de tickets
 * - Control de integridad de datos
 * 
 * PATRÓN ARQUITECTURAL:
 * Controller → Service → Repository → DAO → Model → MongoDB
 */

import TicketsDAO from "./daos/mongo/tickets.dao.js";
import mongoose from "mongoose";

/**
 * CLASE REPOSITORY PARA TICKETS
 * Proporciona interface segura y validada para operaciones de comprobantes
 */
class TicketsRepository {
  /**
   * CONSTRUCTOR
   * Inicializa el repository con una instancia del DAO de tickets
   */
  constructor() {
    this.dao = new TicketsDAO();
  }

  /**
   * BUSCAR TICKET POR ID
   * 
   * Obtiene un ticket específico usando su ObjectId
   * Incluye validación previa del formato del ID para seguridad
   * 
   * Validaciones implementadas:
   * - Formato válido de ObjectId de MongoDB
   * - Existencia del ticket en la base de datos
   * 
   * @param {string|ObjectId} id - ID del ticket a buscar
   * @returns {Promise<Object|null>} Ticket encontrado o null
   * @throws {Error} Si el ID no es válido o hay errores de acceso
   */
  async getById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("El ID del ticket no es válido.");
    }
    return await this.dao.findById(id);
  }

  /**
   * BUSCAR TICKET POR CÓDIGO ÚNICO
   * 
   * Encuentra un ticket usando su código único generado
   * Método principal para búsqueda de comprobantes por usuarios
   * 
   * Casos de uso:
   * - Usuario busca su comprobante con el código
   * - Verificación de compras para atención al cliente
   * - Validación de transacciones
   * - Auditoría de compras específicas
   * 
   * @param {string} code - Código único del ticket (ej: "TKT-20240102-ABC123")
   * @returns {Promise<Object|null>} Ticket encontrado o null
   * @throws {Error} Si hay errores de consulta
   */
  async findByCode(code) {
    try {
      return await this.dao.findByCode(code);
    } catch (error) {
      throw new Error(`Error buscando ticket por código: ${error.message}`);
    }
  }

  /**
   * OBTENER TODOS LOS TICKETS (ADMIN)
   * 
   * Lista completa de todos los tickets del sistema
   * Ordenados por fecha de creación (más recientes primero)
   * 
   * Usos administrativos:
   * - Reportes de ventas por período
   * - Análisis de transacciones
   * - Auditoría fiscal y contable
   * - Monitoreo de actividad del sistema
   * - Seguimiento de ingresos
   * 
   * NOTA: En producción debería implementar paginación y filtros
   * 
   * @returns {Promise<Array>} Array de todos los tickets ordenados por fecha
   * @throws {Error} Si hay errores de conexión o consulta
   */
  async findAll() {
    try {
      return await this.dao.findAll();
    } catch (error) {
      throw new Error(`Error buscando tickets: ${error.message}`);
    }
  }

  /**
   * CREAR NUEVO TICKET
   * 
   * Genera un comprobante de compra al finalizar una transacción exitosa
   * Función crítica del proceso de checkout
   * 
   * Proceso típico de creación:
   * 1. Se valida el pago exitoso
   * 2. Se genera código único para el ticket
   * 3. Se crean snapshots de productos con precios históricos
   * 4. Se crea el ticket con este método
   * 5. Se actualiza stock de productos
   * 6. Se limpia carrito del usuario
   * 7. Se envía comprobante por email
   * 
   * @param {Object} ticketData - Datos completos del ticket
   * @param {string} ticketData.code - Código único generado
   * @param {number} ticketData.amount - Total de la compra
   * @param {string} ticketData.purchaser - Email del comprador
   * @param {Array} ticketData.products - Array de productos con precios históricos
   * @returns {Promise<Object>} Ticket creado con _id generado
   * @throws {Error} Si hay errores de validación o código duplicado
   */
  async create(ticketData) {
    try {
      return await this.dao.create(ticketData);
    } catch (error) {
      throw new Error(`Error creando ticket: ${error.message}`);
    }
  }

  /**
   * ACTUALIZAR TICKET
   * 
   * ⚠️ OPERACIÓN CRÍTICA - Los tickets deberían ser INMUTABLES ⚠️
   * 
   * Este método existe solo para casos excepcionales:
   * - Corrección de errores administrativos graves
   * - Ajustes por devoluciones autorizadas
   * - Actualizaciones de estado (si se implementa sistema de estados)
   * - Correcciones fiscales requeridas por ley
   * 
   * ADVERTENCIA: Usar con extrema precaución
   * - Puede afectar integridad de auditoría
   * - Puede causar inconsistencias contables
   * - Registrar siempre el motivo del cambio
   * 
   * @param {string|ObjectId} id - ID del ticket a actualizar
   * @param {Object} ticketData - Datos a actualizar (mínimo indispensable)
   * @returns {Promise<Object|null>} Ticket actualizado o null
   * @throws {Error} Si hay errores de validación o ticket no existe
   */
  async update(id, ticketData) {
    try {
      return await this.dao.update(id, ticketData);
    } catch (error) {
      throw new Error(`Error actualizando ticket: ${error.message}`);
    }
  }

  /**
   * ELIMINAR TICKET
   * 
   * ⚠️ OPERACIÓN EXTREMADAMENTE CRÍTICA - USAR SOLO EN EMERGENCIAS ⚠️
   * 
   * Los tickets son documentos fiscales y de auditoría
   * Su eliminación puede tener consecuencias legales y contables graves
   * 
   * Casos válidos EXCEPCIONALES:
   * - Tickets de prueba en entorno de desarrollo
   * - Errores graves de sistema que corrompieron datos
   * - Cumplimiento legal específico (derecho al olvido)
   * - Orden judicial o regulatoria
   * 
   * ALTERNATIVA RECOMENDADA: Implementar "soft delete" o estado "cancelado"
   * 
   * @param {string|ObjectId} id - ID del ticket a eliminar
   * @returns {Promise<Object|null>} Ticket eliminado o null
   * @throws {Error} Si hay errores de acceso
   */
  async delete(id) {
    try {
      return await this.dao.delete(id);
    } catch (error) {
      throw new Error(`Error eliminando ticket: ${error.message}`);
    }
  }

  /**
   * OBTENER HISTORIAL DE COMPRAS POR USUARIO
   * 
   * Función principal para mostrar historial de compras al cliente
   * Incluye populate automático de productos para mostrar detalles
   * 
   * Características del método:
   * - Filtrado por email del comprador (purchaser field)
   * - Ordenamiento cronológico (más recientes primero)
   * - Populate de productos con campos seleccionados
   * - Optimizado para mostrar en UI del usuario
   * 
   * Campos poblados del producto:
   * - title: Nombre para mostrar
   * - description: Descripción detallada
   * - price: Precio ACTUAL (puede diferir del histórico en ticket)
   * - image: Imagen para la UI
   * - code: Código SKU para referencia
   * 
   * @param {string} userId - Email del usuario comprador
   * @returns {Promise<Array>} Array de tickets del usuario con productos poblados
   * @throws {Error} Si hay errores de consulta o populate
   */
  async findByUser(userId) {
    try {
      return await this.dao.findByUser(userId);
    } catch (error) {
      throw new Error(`Error buscando tickets del usuario: ${error.message}`);
    }
  }
}

/**
 * EXPORTACIÓN DEL REPOSITORY DE TICKETS
 * 
 * Se exporta la clase para instanciación en Services
 * Los tickets son fundamentales para el cumplimiento fiscal y la auditoría
 */
export default TicketsRepository;
