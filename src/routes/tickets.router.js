/**
 * ROUTER DE TICKETS - GESTIÓN ADMINISTRATIVA DE COMPROBANTES
 * 
 * Router especializado en administración de tickets/comprobantes de compra
 * Acceso exclusivo para administradores del sistema
 * 
 * PROPÓSITO ADMINISTRATIVO:
 * - Consulta de todos los tickets del sistema
 * - Revisión de comprobantes específicos
 * - Creación manual de tickets (casos especiales)
 * - Auditoría de transacciones completadas
 * 
 * DIFERENCIACIÓN DE ACCESO:
 * - ADMINISTRADORES: Acceso completo vía este router
 * - USUARIOS: Generación automática vía /carts/purchase
 * - SEPARACIÓN: Admin consulta, usuarios generan
 * 
 * CARACTERÍSTICAS DE SEGURIDAD:
 * - Doble middleware de autenticación
 * - Verificación de JWT válido
 * - Confirmación de rol administrativo
 * - Acceso restringido a datos sensibles
 * 
 * CASOS DE USO ADMINISTRATIVOS:
 * - Reportes de ventas y facturación
 * - Auditorías de transacciones
 * - Resolución de disputas de pago
 * - Análisis de patrones de compra
 * - Creación de tickets de ajuste
 * 
 * CONTROLADOR:
 * - TicketsController: Lógica administrativa de tickets
 * 
 * BASE PATH: /tickets
 * SECURITY LEVEL: Máximo (Solo Administradores)
 */
import { Router } from "express";
import TicketsController from "../controllers/tickets.controller.js";
import { authenticateToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = Router();
const ticketsController = new TicketsController();

// Aplicar doble capa de autenticación: JWT + rol admin
router.use(authenticateToken, isAdmin);

/**
 * RUTAS ADMINISTRATIVAS DE TICKETS
 * 
 * Endpoints exclusivos para administradores
 * Todas las rutas requieren autenticación y rol administrativo
 */

/**
 * LISTAR TODOS LOS TICKETS
 * GET /tickets
 * 
 * Endpoint administrativo para consultar historial completo de tickets
 * Retorna todos los comprobantes generados en el sistema
 * 
 * USO ADMINISTRATIVO:
 * - Reportes de ventas globales
 * - Auditorías de facturación
 * - Análisis de tendencias de compra
 * - Verificación de ingresos totales
 * 
 * MIDDLEWARE: authenticateToken + isAdmin
 * CONTROLLER: TicketsController.getAllTickets
 * RESPONSE: Array completo de tickets del sistema
 * SECURITY: Solo administradores, datos sensibles incluidos
 */
router.get("/", ticketsController.getAllTickets);

/**
 * CONSULTAR TICKET ESPECÍFICO
 * GET /tickets/:id
 * 
 * Endpoint administrativo para revisar ticket individual
 * Acceso completo a detalles de cualquier comprobante
 * 
 * PARAMS: id - ObjectId del ticket a consultar
 * 
 * USO ADMINISTRATIVO:
 * - Verificación de transacciones específicas
 * - Resolución de disputas de clientes
 * - Auditoría de compras individuales
 * - Validación de reportes de usuarios
 * 
 * MIDDLEWARE: authenticateToken + isAdmin
 * CONTROLLER: TicketsController.getTicketById
 * RESPONSE: Datos completos del ticket o error 404
 * SECURITY: Solo administradores, sin restricciones de propiedad
 */
router.get("/:id", ticketsController.getTicketById);

/**
 * CREAR TICKET MANUALMENTE
 * POST /tickets
 * 
 * Endpoint administrativo para creación manual de tickets
 * Usado en casos especiales que requieren intervención administrativa
 * 
 * BODY: Datos completos del ticket a crear
 * - purchaser: Email del comprador
 * - amount: Monto total
 * - purchase_datetime: Fecha de compra
 * - products: Array de productos
 * 
 * CASOS DE USO:
 * - Ajustes por errores del sistema
 * - Ventas fuera de línea
 * - Compensaciones a clientes
 * - Migración de datos históricos
 * - Tickets de prueba para testing
 * 
 * MIDDLEWARE: authenticateToken + isAdmin
 * CONTROLLER: TicketsController.createTicket
 * RESPONSE: Ticket creado (201) o error de validación
 * SECURITY: Solo administradores, validación de datos requerida
 */
router.post("/", ticketsController.createTicket);

export default router;
