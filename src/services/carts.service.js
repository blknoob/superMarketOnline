import CartsRepository from "../repositories/carts.repository.js";
import ProductsRepository from "../repositories/products.repository.js";
import UsersRepository from "../repositories/users.repository.js";
import TicketsService from "./tickets.service.js";

/**
 * SERVICE DE CARRITOS DE COMPRA
 * 
 * Servicio que maneja toda la lógica de negocio relacionada con carritos de compra
 * Actúa como capa intermedia entre controllers y repositories
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Gestión de carritos por usuario (relación 1:1)
 * - Agregar/quitar productos del carrito
 * - Actualizar cantidades de productos
 * - Validación de stock y productos activos
 * - Procesamiento de compras (checkout)
 * - Limpieza automática de carritos
 * 
 * INTEGRACIONES:
 * - CartsRepository: Para persistencia de datos
 * - ProductsRepository: Para validación de productos
 * - UsersRepository: Para verificación de usuarios
 * - TicketsService: Para procesar compras y generar tickets
 * 
 * REGLAS DE NEGOCIO:
 * - Cada usuario tiene UN SOLO carrito activo
 * - Se valida stock antes de agregar productos
 * - Los carritos se crean automáticamente si no existen
 * - Los productos inactivos se filtran automáticamente
 * - Las cantidades se validan contra stock disponible
 */
class CartsService {
  /**
   * CONSTRUCTOR DEL SERVICE DE CARRITOS
   * 
   * Inicializa todas las dependencias necesarias:
   * - Repository de carritos para persistencia
   * - Repository de productos para validaciones
   * - Repository de usuarios para verificaciones
   * - Service de tickets para procesamiento de compras
   */
  constructor() {
    this.repository = new CartsRepository();
    this.productsRepository = new ProductsRepository();
    this.usersRepository = new UsersRepository();
    this.ticketsService = new TicketsService();
  }

  /**
   * OBTENER CARRITO DEL USUARIO
   * 
   * Obtiene el carrito activo de un usuario específico
   * Si el usuario no tiene carrito, se crea uno automáticamente
   * 
   * REGLA DE NEGOCIO: Relación 1:1 usuario-carrito
   * Cada usuario siempre debe tener exactamente un carrito activo
   * 
   * @param {string|ObjectId} userId - ID del usuario
   * @returns {Promise<Object>} Carrito del usuario con productos poblados
   * @throws {Error} Si hay errores de acceso a datos
   */
  async getUserCart(userId) {
    try {
      let cart = await this.repository.findByUser(userId);
      if (!cart) {
        cart = await this.createUserCart(userId);
      }
      return cart;
    } catch (error) {
      throw new Error(`Error obteniendo carrito: ${error.message}`);
    }
  }

  /**
   * CREAR CARRITO PARA USUARIO
   * 
   * Crea un nuevo carrito vacío para un usuario
   * Se ejecuta automáticamente cuando un usuario no tiene carrito
   * 
   * ESTADO INICIAL:
   * - Array de productos vacío
   * - Asociado al usuario especificado
   * - Timestamps de creación automáticos
   * 
   * @param {string|ObjectId} userId - ID del usuario propietario
   * @returns {Promise<Object>} Carrito creado
   * @throws {Error} Si hay errores en la creación
   */
  async createUserCart(userId) {
    try {
      const cart = await this.repository.create({
        user: userId,
        products: [],
      });
      return cart;
    } catch (error) {
      throw new Error(`Error creando carrito: ${error.message}`);
    }
  }

  /**
   * AGREGAR PRODUCTO AL CARRITO
   * 
   * Añade un producto específico al carrito con la cantidad indicada
   * Si el producto ya existe, suma las cantidades
   * 
   * VALIDACIONES IMPLEMENTADAS:
   * - Verificar que el producto existe y está activo
   * - Validar stock disponible antes de agregar
   * - Convertir IDs a string para consistencia
   * - Manejar casos de productos duplicados
   * 
   * PROCESO:
   * 1. Buscar y validar el producto
   * 2. Verificar disponibilidad de stock
   * 3. Agregar o actualizar cantidad en carrito
   * 4. Retornar carrito actualizado con populate
   * 
   * @param {string|ObjectId} cartId - ID del carrito
   * @param {string|ObjectId} productId - ID del producto a agregar
   * @param {number} quantity - Cantidad a agregar (default: 1)
   * @returns {Promise<Object>} Carrito actualizado con productos
   * @throws {Error} Si el producto no existe o no hay stock suficiente
   */
  async addProductToCart(cartId, productId, quantity = 1) {
    try {
      console.log("productId recibido:", productId);
      const product = await this.productsRepository.getById(productId);
      console.log("Producto encontrado:", product);
      if (!product || !product._id) {
        throw new Error("Producto no encontrado");
      }
      const prodIdStr = product._id.toString();

      const updatedCart = await this.repository.addProduct(
        cartId,
        prodIdStr,
        quantity
      );
      return updatedCart;
    } catch (error) {
      throw new Error(`Error agregando producto: ${error.message}`);
    }
  }

  /**
   * QUITAR PRODUCTO DEL CARRITO
   * 
   * Elimina completamente un producto específico del carrito
   * Independientemente de la cantidad, remueve toda la línea del producto
   * 
   * COMPORTAMIENTO:
   * - Elimina la entrada completa del producto del array
   * - No afecta otros productos del carrito
   * - Actualiza automáticamente los totales
   * 
   * DIFERENCIA CON updateProductQuantity(0):
   * - Este método elimina la línea completa
   * - updateProductQuantity(0) también elimina pero via cantidad
   * 
   * @param {string|ObjectId} cartId - ID del carrito
   * @param {string|ObjectId} productId - ID del producto a eliminar
   * @returns {Promise<Object>} Carrito actualizado sin el producto
   * @throws {Error} Si hay errores en la eliminación
   */
  async removeProductToCart(cartId, productId) {
    try {
      const updatedCart = await this.repository.removeProduct(
        cartId,
        productId
      );
      return updatedCart;
    } catch (error) {
      throw new Error(`Error quitando producto: ${error.message}`);
    }
  }

  /**
   * ACTUALIZAR CANTIDAD DE PRODUCTO
   * 
   * Modifica la cantidad de un producto específico en el carrito
   * Incluye lógica especial para cantidad cero (elimina producto)
   * 
   * LÓGICA DE NEGOCIO:
   * - Si quantity = 0: Elimina el producto del carrito
   * - Si quantity > 0: Actualiza a la nueva cantidad
   * - Si producto no existe en carrito: No hace nada
   * 
   * VALIDACIONES RECOMENDADAS (implementar):
   * - Verificar stock disponible para la nueva cantidad
   * - Validar que quantity sea número positivo
   * - Confirmar que el producto sigue activo
   * 
   * PROCESO:
   * 1. Si quantity es 0, eliminar producto
   * 2. Buscar producto en carrito
   * 3. Actualizar cantidad si existe
   * 4. Persistir cambios
   * 
   * @param {string|ObjectId} cartId - ID del carrito
   * @param {string|ObjectId} productId - ID del producto a actualizar
   * @param {number} quantity - Nueva cantidad (0 = eliminar)
   * @returns {Promise<Object>} Carrito actualizado
   * @throws {Error} Si hay errores en la actualización
   */
  async updateProductQuantity(cartId, productId, quantity) {
    try {
      if (quantity === 0) {
        return await this.removeProductToCart(cartId, productId);
      }

      const cart = await this.repository.findById(cartId);
      const productIndex = cart.products.findIndex(
        (item) => item.product.toString() === productId
      );

      if (productIndex !== -1) {
        cart.products[productIndex].quantity = quantity;
        const updatedCart = await this.repository.update(cartId, cart);
        return updatedCart;
      }

      return cart;
    } catch (error) {
      throw new Error(`Error actualizando cantidad: ${error.message}`);
    }
  }

  /**
   * VACIAR CARRITO COMPLETAMENTE
   * 
   * Elimina todos los productos del carrito, dejándolo vacío
   * Mantiene el carrito existente pero sin productos
   * 
   * CASOS DE USO:
   * - Después de completar una compra exitosa
   * - Usuario solicita vaciar carrito manualmente
   * - Limpieza por timeout o inactividad
   * - Reset por cambios de sesión
   * 
   * RESULTADO:
   * - Array de productos queda vacío []
   * - Se mantienen metadatos del carrito (user, fechas)
   * - Totales se resetean a cero
   * 
   * @param {string|ObjectId} cartId - ID del carrito a vaciar
   * @returns {Promise<Object>} Carrito vacío actualizado
   * @throws {Error} Si hay errores en la operación
   */
  async clearCart(cartId) {
    try {
      const clearedCart = await this.repository.update(cartId, {
        products: [],
      });
      return clearedCart;
    } catch (error) {
      throw new Error(`Error vaciando carrito: ${error.message}`);
    }
  }

  /**
   * PROCESAR COMPRA DEL CARRITO
   * 
   * Inicia el proceso de checkout convirtiendo el carrito en una compra
   * Delega la lógica compleja al TicketsService
   * 
   * PROCESO DE CHECKOUT:
   * 1. Validar carrito no vacío
   * 2. Verificar stock de todos los productos
   * 3. Calcular totales e impuestos
   * 4. Crear order pendiente
   * 5. Generar ticket de compra
   * 6. Actualizar stock de productos
   * 7. Vaciar carrito del usuario
   * 8. Enviar confirmación por email
   * 
   * DELEGACIÓN AL TICKETS SERVICE:
   * Este método actúa como proxy hacia TicketsService.processPurchase()
   * que contiene toda la lógica compleja del checkout
   * 
   * RESULTADO:
   * - Ticket generado con productos y totales
   * - Carrito vaciado automáticamente
   * - Stock actualizado en productos
   * - Email de confirmación enviado
   * 
   * @param {string|ObjectId} cartId - ID del carrito a procesar
   * @param {Object} user - Objeto completo del usuario comprador
   * @returns {Promise<Object>} Ticket generado por la compra
   * @throws {Error} Si hay errores en el proceso de checkout
   */
  async processCartPurchase(cartId, user) {
    try {
      return await this.ticketsService.processPurchase(user._id, cartId);
    } catch (error) {
      throw new Error(`Error procesando compra: ${error.message}`);
    }
  }
}

export default CartsService;
