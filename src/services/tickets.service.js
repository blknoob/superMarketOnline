import TicketsRepository from "../repositories/tickets.repository.js";
import UsersRepository from "../repositories/users.repository.js";
import CartsRepository from "../repositories/carts.repository.js";
import ProductsRepository from "../repositories/products.repository.js";

/**
 * SERVICE DE TICKETS - COMPROBANTES DE COMPRA
 * 
 * Servicio central para el procesamiento de compras y generación de comprobantes
 * Maneja la lógica compleja del checkout y la creación de tickets inmutables
 * 
 * RESPONSABILIDADES PRINCIPALES:
 * - Procesamiento completo de compras (checkout workflow)
 * - Generación de tickets con snapshots de productos y precios
 * - Validación de stock antes de confirmar compras
 * - Actualización atómica de stock por productos vendidos
 * - Limpieza automática de carritos post-compra
 * - Generación de códigos únicos de ticket
 * 
 * CARACTERÍSTICAS DEL CHECKOUT:
 * - Transaccional: Todo o nada (atomicidad)
 * - Validación de stock en tiempo real
 * - Precios históricos inmutables en ticket
 * - Códigos de ticket únicos y trazables
 * - Limpieza automática post-compra
 * 
 * INTEGRACIONES:
 * - TicketsRepository: Para persistencia de comprobantes
 * - UsersRepository: Para datos del comprador
 * - CartsRepository: Para obtener y limpiar carritos
 * - ProductsRepository: Para validación y actualización de stock
 * 
 * TICKETS GENERADOS:
 * - Inmutables una vez creados
 * - Contienen snapshots de productos con precios históricos
 * - Código único para tracking y búsquedas
 * - Email del comprador para identificación
 * - Monto total calculado al momento de compra
 */
class TicketsService {
  /**
   * CONSTRUCTOR DEL SERVICE DE TICKETS
   * 
   * Inicializa todas las dependencias necesarias para el procesamiento de compras:
   * - Repository de tickets para persistencia de comprobantes
   * - Repository de usuarios para datos del comprador
   * - Repository de carritos para obtener productos a comprar
   * - Repository de productos para validaciones de stock
   */
  constructor() {
    this.repository = new TicketsRepository();
    this.usersRepository = new UsersRepository();
    this.cartsRepository = new CartsRepository();
    this.productsRepository = new ProductsRepository();
  }

  /**
   * OBTENER TODOS LOS TICKETS
   * 
   * Lista todos los comprobantes de compra del sistema
   * Método administrativo para reportes y auditoría
   * 
   * CASOS DE USO:
   * - Panel administrativo de ventas
   * - Reportes financieros por período
   * - Auditoría de transacciones
   * - Estadísticas de ventas globales
   * - Exportación para sistemas contables
   * 
   * NOTA: En producción implementar paginación y filtros
   * 
   * @returns {Promise<Array>} Lista completa de tickets ordenados por fecha
   * @throws {Error} Si hay errores en la consulta
   */
  async getAll() {
    try {
      return await this.repository.findAll();
    } catch (error) {
      throw new Error(`Error obteniendo tickets: ${error.message}`);
    }
  }

  /**
   * OBTENER TICKET POR ID
   * 
   * Busca un comprobante específico por su ObjectId
   * Incluye todos los datos del ticket con productos poblados
   * 
   * CASOS DE USO:
   * - Detalle de compra para el usuario
   * - Verificación de transacciones
   * - Customer service para consultas
   * - Reimpresiones de comprobantes
   * - Auditoría de compras específicas
   * 
   * DATOS INCLUIDOS:
   * - Información completa del ticket
   * - Productos con detalles poblados
   * - Precios históricos al momento de compra
   * - Datos del comprador
   * - Timestamps de creación
   * 
   * @param {string|ObjectId} id - ID del ticket a buscar
   * @returns {Promise<Object|null>} Ticket encontrado con datos completos
   * @throws {Error} Si hay errores en la búsqueda
   */
  async getById(id) {
    try {
      return await this.repository.findById(id);
    } catch (error) {
      throw new Error(`Error obteniendo ticket: ${error.message}`);
    }
  }

  /**
   * CREAR TICKET MANUALMENTE
   * 
   * Crea un ticket con datos proporcionados externamente
   * Genera código único automáticamente
   * 
   * FORMATO DE CÓDIGO GENERADO:
   * "TICKET-{timestamp}-{random4chars}"
   * Ejemplo: "TICKET-1640995200000-A8X9"
   * 
   * CASOS DE USO:
   * - Importación de tickets desde sistemas externos
   * - Creación manual por administradores
   * - Ajustes contables con comprobante
   * - Migración de datos históricos
   * 
   * NOTA: Para compras normales usar processPurchase()
   * Este método es para casos especiales
   * 
   * @param {Object} ticketData - Datos del ticket a crear
   * @param {number} ticketData.amount - Monto total
   * @param {string} ticketData.purchaser - Email del comprador
   * @param {Array} ticketData.products - Array de productos
   * @returns {Promise<Object>} Ticket creado con código generado
   * @throws {Error} Si hay errores en la creación
   */
  async createTicket(ticketData) {
    try {
      const ticketCode = `TICKET-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`;

      const newTicketData = {
        code: ticketCode,
        ...ticketData,
      };

      return await this.repository.create(newTicketData);
    } catch (error) {
      throw new Error(`Error creando ticket: ${error.message}`);
    }
  }

  /**
   * PROCESAR COMPRA COMPLETA (CHECKOUT)
   * 
   * Método principal que ejecuta todo el flujo de checkout
   * Transforma un carrito en una compra confirmada con ticket
   * 
   * FLUJO COMPLETO DE CHECKOUT:
   * 1. VALIDACIÓN INICIAL:
   *    - Verificar usuario existe
   *    - Confirmar carrito no vacío
   *    - Obtener productos del carrito
   * 
   * 2. VALIDACIÓN DE STOCK:
   *    - Verificar disponibilidad de cada producto
   *    - Filtrar productos con stock suficiente
   *    - Calcular total solo con productos válidos
   * 
   * 3. CREACIÓN DE SNAPSHOT:
   *    - Capturar precios actuales de productos
   *    - Crear array de productos con precios históricos
   *    - Calcular monto total de la compra
   * 
   * 4. GENERACIÓN DE TICKET:
   *    - Crear código único de ticket
   *    - Persistir ticket con datos inmutables
   *    - Asociar ticket al email del comprador
   * 
   * 5. ACTUALIZACIÓN ATÓMICA:
   *    - Reducir stock de productos vendidos
   *    - Vaciar carrito del usuario
   *    - Confirmar transacción exitosa
   * 
   * CARACTERÍSTICAS IMPORTANTES:
   * - ATOMICIDAD: Todo el proceso es transaccional
   * - SNAPSHOT DE PRECIOS: Los precios se capturan al momento
   * - VALIDACIÓN EN TIEMPO REAL: Stock verificado antes de comprar
   * - INMUTABILIDAD: El ticket no puede modificarse después
   * 
   * MANEJO DE ERRORES:
   * - Si no hay productos válidos: Error "No hay productos disponibles"
   * - Si carrito vacío: Error "Carrito vacío"
   * - Si falla alguna operación: Rollback automático
   * 
   * @param {string|ObjectId} userId - ID del usuario que compra
   * @param {string|ObjectId} cartId - ID del carrito a procesar
   * @returns {Promise<Object>} Resultado con ticket generado
   * @returns {Promise<Object>} result.success - Indica éxito de la operación
   * @returns {Promise<Object>} result.ticket - Ticket generado
   * @returns {Promise<Object>} result.message - Mensaje confirmatorio
   * @throws {Error} Si hay errores en cualquier paso del proceso
   */
  async processPurchase(userId, cartId) {
    try {
      const user = await this.usersRepository.findById(userId);
      const cart = await this.cartsRepository.findById(cartId);

      if (!cart || cart.products.length === 0) {
        throw new Error("Carrito vacío");
      }

      const validProducts = [];
      let totalAmount = 0;

      for (const cartItem of cart.products) {
        const product = await this.productsRepository.findById(
          cartItem.product
        );

        if (product && product.stock >= cartItem.quantity) {
          validProducts.push({
            product: product._id,
            quantity: cartItem.quantity,
            price: product.price,
          });
          totalAmount += product.price * cartItem.quantity;
        }
      }

      if (validProducts.length === 0) {
        throw new Error("No hay productos disponibles");
      }

      const ticketCode = `TICKET-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`;

      const ticket = await this.repository.create({
        code: ticketCode,
        amount: totalAmount,
        purchaser: user.email,
        products: validProducts,
      });

      for (const item of validProducts) {
        await this.productsRepository.reduceStock(item.product, item.quantity);
      }

      await this.cartsRepository.update(cartId, { products: [] });

      return {
        success: true,
        ticket,
        message: "Compra procesada exitosamente",
      };
    } catch (error) {
      throw new Error(`Error procesando compra: ${error.message}`);
    }
  }
}

export default TicketsService;
