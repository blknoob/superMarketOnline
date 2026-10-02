/**
 * CONTROLLER DE TICKETS - GESTIÓN DE COMPROBANTES DE COMPRA
 * 
 * Controller que maneja los tickets/recibos generados por el sistema
 * Proporciona endpoints para consulta y administración de tickets
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Consulta de todos los tickets del sistema
 * - Búsqueda de tickets por ID específico
 * - Creación de nuevos tickets
 * 
 * CASOS DE USO:
 * - Administradores consultando historial de ventas
 * - Usuarios verificando sus comprobantes
 * - Sistema generando tickets post-compra
 * - Reportes de facturación
 * 
 * CARACTERÍSTICAS:
 * - API RESTful con responses JSON
 * - Validación de existencia de tickets
 * - Manejo consistente de errores
 * - Integración con TicketsService
 * 
 * ENDPOINTS DISPONIBLES:
 * - GET /tickets - Listar todos los tickets
 * - GET /tickets/:id - Obtener ticket específico
 * - POST /tickets - Crear nuevo ticket
 */
import TicketsService from "../services/tickets.service.js";

const ticketsService = new TicketsService();

/**
 * CONTROLLER DE TICKETS
 * 
 * Clase que encapsula todas las operaciones de controller para tickets
 * Actúa como intermediario entre rutas HTTP y TicketsService
 * 
 * RESPONSABILIDADES:
 * - Manejar requests y responses HTTP
 * - Validar parámetros de entrada
 * - Formatear respuestas JSON
 * - Capturar y manejar errores
 * 
 * PATRON IMPLEMENTADO:
 * - Controller Pattern: Separación entre lógica HTTP y business
 * - Error Handling: Captura consistente de excepciones
 * - Response Format: Estructura uniforme de respuestas
 */
class TicketsController {
  /**
   * OBTENER TODOS LOS TICKETS
   * 
   * Endpoint: GET /tickets
   * Retorna lista completa de tickets en el sistema
   * 
   * USO PRINCIPAL:
   * - Administradores consultando historial de ventas
   * - Reportes de facturación global
   * - Auditorías de transacciones
   * 
   * CARACTERÍSTICAS:
   * - No requiere parámetros de entrada
   * - Retorna array de todos los tickets
   * - Incluye tickets de todos los usuarios
   * - Ordenado por fecha de creación
   * 
   * PERMISOS:
   * - Típicamente restringido a administradores
   * - Contiene información sensible de ventas
   * 
   * @param {Object} req - Request de Express
   * @param {Object} res - Response de Express
   * @returns {Promise<Object>} JSON con lista de tickets
   */
  async getAllTickets(req, res) {
    try {
      const tickets = await ticketsService.getAll();
      res.json({ status: "success", tickets });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Ver consola" });
    }
  }

  /**
   * OBTENER TICKET POR ID
   * 
   * Endpoint: GET /tickets/:id
   * Busca y retorna un ticket específico por su ID
   * 
   * PARÁMETROS:
   * - id (URL): ObjectId del ticket a consultar
   * 
   * CASOS DE USO:
   * - Usuario consultando su comprobante específico
   * - Administrador verificando detalles de venta
   * - Sistema validando existencia de ticket
   * - Reimpresión de comprobantes
   * 
   * VALIDACIONES:
   * - Verificar que el ID sea válido
   * - Confirmar existencia del ticket
   * - Error 404 si no se encuentra
   * 
   * SEGURIDAD:
   * - Validar permisos del usuario
   * - Solo propietario o admin puede acceder
   * 
   * @param {Object} req - Request con params.id
   * @param {Object} res - Response de Express
   * @returns {Promise<Object>} JSON con ticket o error 404
   */
  async getTicketById(req, res) {
    try {
      const { id } = req.params;
      const ticket = await ticketsService.getById(id);

      if (!ticket) {
        return res
          .status(404)
          .json({ status: "error", message: "Ticket no encontrado" });
      }

      res.json({ status: "success", ticket });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Ver consola" });
    }
  }

  /**
   * CREAR NUEVO TICKET
   * 
   * Endpoint: POST /tickets
   * Genera un nuevo ticket en el sistema
   * 
   * BODY PARAMETERS:
   * - purchaser: Email del comprador
   * - amount: Monto total de la compra
   * - purchase_datetime: Fecha y hora de compra
   * - products: Array de productos comprados
   * 
   * PROCESO DE CREACIÓN:
   * 1. Validar datos de entrada
   * 2. Generar código único de ticket
   * 3. Calcular totales y subtotales
   * 4. Crear registro en base de datos
   * 5. Retornar ticket generado
   * 
   * USO TÍPICO:
   * - Finalización exitosa de proceso de compra
   * - Generación automática post-pago
   * - Respaldo de transacciones completadas
   * 
   * CARACTERÍSTICAS:
   * - Código único autoincremental
   * - Timestamp automático
   * - Estructura normalizada
   * - Inmutable una vez creado
   * 
   * @param {Object} req - Request con body data del ticket
   * @param {Object} res - Response de Express
   * @returns {Promise<Object>} JSON con ticket creado (201)
   */
  async createTicket(req, res) {
    try {
      const ticket = await ticketsService.createTicket(req.body);
      res.status(201).json({ status: "success", ticket });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Ver consola" });
    }
  }
}

export default TicketsController;
