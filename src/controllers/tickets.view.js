/**
 * CONTROLLER DE VISTAS DE TICKETS - RENDERIZADO DE COMPROBANTES
 * 
 * Controller especializado en renderizado de vistas de tickets y comprobantes
 * Maneja la presentación de tickets de compra para usuarios y administradores
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Renderizar lista de todos los tickets
 * - Mostrar detalle específico de ticket
 * - Preparar datos para templates Handlebars
 * - Manejo de errores de renderizado
 * 
 * CARACTERÍSTICAS:
 * - Conversión de objetos Mongoose a plain objects
 * - Templates especializados para tickets
 * - Validación de existencia de tickets
 * - Manejo de errores con páginas de error
 * 
 * INTEGRACIÓN CON VIEWS:
 * - Templates en views/tickets/
 * - Datos optimizados para Handlebars
 * - Contexto completo de ticket
 * - Layout consistente con el sistema
 * 
 * ENDPOINTS DE VISTA:
 * - /tickets - Lista de todos los tickets
 * - /tickets/:id - Detalle de ticket específico
 * 
 * CASOS DE USO:
 * - Administradores consultando historial de ventas
 * - Usuarios viendo sus comprobantes
 * - Reportes visuales de transacciones
 * - Reimpresiones de tickets
 */
import TicketsService from "../services/tickets.service.js";

const ticketsService = new TicketsService();

/**
 * CONTROLLER DE VISTA DE TICKETS
 * 
 * Clase especializada en renderizado de vistas de tickets
 * Enfocada en presentación de comprobantes de compra
 * 
 * RESPONSABILIDADES:
 * - Renderizar templates de tickets
 * - Convertir datos de servicio para vista
 * - Manejar errores de renderizado
 * - Proporcionar contexto completo a templates
 * 
 * PATRON IMPLEMENTADO:
 * - View Controller Pattern: Separación de lógica de vista
 * - Data Preparation: Conversión para consumo de templates
 * - Error Handling: Manejo robusto de fallos de renderizado
 */
class TicketsViewController {
  /**
   * RENDERIZAR VISTA DE TODOS LOS TICKETS
   * 
   * Endpoint: GET /tickets
   * Renderiza página con lista completa de tickets del sistema
   * 
   * PROCESO DE RENDERIZADO:
   * 1. Obtener todos los tickets del servicio
   * 2. Convertir objetos Mongoose a plain objects
   * 3. Preparar contexto para template
   * 4. Renderizar vista tickets/tickets.hbs
   * 
   * PREPARACIÓN DE DATOS:
   * - Conversión con toObject() si es Mongoose document
   * - Fallback a objeto original si ya es plain
   * - Array completo de tickets disponibles
   * - Datos listos para iteración en Handlebars
   * 
   * TEMPLATE UTILIZADO:
   * - Vista: tickets/tickets.hbs
   * - Contexto: { tickets: plainTickets }
   * - Lista iterable de todos los tickets
   * 
   * CASOS DE USO:
   * - Administradores consultando historial completo
   * - Reportes visuales de todas las ventas
   * - Dashboard de transacciones
   * - Análisis de tendencias de compra
   * 
   * CONSIDERACIONES:
   * - Puede ser gran cantidad de datos
   * - Considerar paginación en futuras versiones
   * - Acceso típicamente administrativo
   * 
   * @param {Object} req - Request de Express
   * @param {Object} res - Response para renderizado
   * @returns {Promise<void>} Renderiza vista o error 500
   */
  async getAllTicketsView(req, res) {
    try {
      const tickets = await ticketsService.getAll();
      const plainTickets = tickets.map((t) => (t.toObject ? t.toObject() : t));
      res.render("tickets/tickets", { tickets: plainTickets });
    } catch (error) {
      res.status(500).send("Error mostrando tickets");
    }
  }

  /**
   * RENDERIZAR DETALLE DE TICKET ESPECÍFICO
   * 
   * Endpoint: GET /tickets/:id
   * Renderiza página con detalle completo de un ticket específico
   * 
   * PARÁMETROS:
   * - id (URL): ObjectId del ticket a mostrar
   * 
   * PROCESO DE RENDERIZADO:
   * 1. Extraer ID del ticket de parámetros
   * 2. Buscar ticket en servicio por ID
   * 3. Validar existencia (404 si no existe)
   * 4. Convertir a plain object
   * 5. Renderizar vista de detalle
   * 
   * VALIDACIONES:
   * - ID debe estar presente en parámetros
   * - Ticket debe existir en base de datos
   * - Error 404 con mensaje descriptivo
   * - Manejo de errores de servicio
   * 
   * TEMPLATE UTILIZADO:
   * - Vista: tickets/ticketDetail.hbs
   * - Contexto: { ticket: ticketData }
   * - Detalle completo del ticket
   * 
   * CASOS DE USO:
   * - Usuario consultando comprobante específico
   * - Administrador verificando detalles de venta
   * - Reimpresiones de comprobantes
   * - Verificación de transacciones
   * 
   * INFORMACIÓN MOSTRADA:
   * - Datos de la compra
   * - Lista de productos
   * - Totales y subtotales
   * - Fecha y hora de compra
   * - Información del comprador
   * 
   * @param {Object} req - Request con params.id
   * @param {Object} res - Response para renderizado
   * @returns {Promise<void>} Renderiza detalle o error 404/500
   */
  async getTicketDetailView(req, res) {
    try {
      const { id } = req.params;
      const ticket = await ticketsService.getById(id);
      if (!ticket) return res.status(404).send("Ticket no encontrado");
      res.render("tickets/ticketDetail", {
        ticket: ticket.toObject ? ticket.toObject() : ticket,
      });
    } catch (error) {
      res.status(500).send("Error mostrando ticket");
    }
  }
}

export default TicketsViewController;
