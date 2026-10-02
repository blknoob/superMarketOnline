/**
 * REPOSITORY DE CARRITOS DE COMPRAS
 * 
 * Repository que gestiona toda la lógica de carritos de compra del supermercado online
 * Actúa como capa de abstracción entre Services y DAOs para operaciones de carrito
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Gestión completa del carrito de cada usuario
 * - Operaciones CRUD básicas del carrito
 * - Manejo de productos dentro del carrito
 * - Validaciones de propiedad y seguridad
 * - Interface limpia para la lógica de negocio
 * 
 * OPERACIONES ESPECIALIZADAS:
 * - Agregar/remover productos del carrito
 * - Actualizar cantidades de productos
 * - Validar propiedad del carrito (seguridad)
 * - Limpiar carrito después de compra
 * - Obtener carrito con productos poblados
 * 
 * SEGURIDAD:
 * - Verificación de propiedad de carritos
 * - Validación de usuarios autorizados
 * - Protección contra accesos no autorizados
 * 
 * PATRÓN ARQUITECTURAL:
 * Controller → Service → Repository → DAO → Model → MongoDB
 */

import CartsDAO from "./daos/mongo/carts.dao.js";

/**
 * CLASE REPOSITORY PARA CARRITOS
 * Proporciona interface unificada para todas las operaciones de carrito
 */
class CartsRepository {
  /**
   * CONSTRUCTOR
   * Inicializa el repository con una instancia del DAO de carritos
   */
  constructor() {
    this.dao = new CartsDAO();
  }

  /**
   * BUSCAR CARRITO POR ID
   * 
   * Obtiene un carrito específico usando su ObjectId
   * Método básico sin populate para operaciones rápidas
   * 
   * @param {string|ObjectId} id - ID del carrito a buscar
   * @returns {Promise<Object|null>} Carrito encontrado o null
   * @throws {Error} Si hay errores de validación o acceso
   */
  async findById(id) {
    try {
      return await this.dao.findById(id);
    } catch (error) {
      throw new Error(`Error buscando carrito: ${error.message}`);
    }
  }

  /**
   * BUSCAR CARRITO POR USUARIO
   * 
   * Obtiene el carrito activo de un usuario específico
   * Incluye populate de productos para mostrar detalles completos
   * Es el método más usado del sistema de carritos
   * 
   * @param {string|ObjectId} userId - ID del usuario propietario
   * @returns {Promise<Object|null>} Carrito con productos poblados o null
   * @throws {Error} Si hay errores de consulta o populate
   */
  async findByUser(userId) {
    try {
      return await this.dao.findByUser(userId);
    } catch (error) {
      throw new Error(`Error buscando carrito por usuario: ${error.message}`);
    }
  }

  /**
   * CREAR NUEVO CARRITO
   * 
   * Crea un carrito vacío para un usuario
   * Se ejecuta típicamente cuando un usuario se registra
   * o realiza su primera acción de compra
   * 
   * @param {Object} cartData - Datos del carrito a crear
   * @param {ObjectId} cartData.user - ID del usuario propietario
   * @param {Array} [cartData.products=[]] - Array de productos (vacío inicialmente)
   * @returns {Promise<Object>} Carrito creado con _id generado
   * @throws {Error} Si hay errores de validación
   */
  async create(cartData) {
    try {
      return await this.dao.create(cartData);
    } catch (error) {
      throw new Error(`Error creando carrito: ${error.message}`);
    }
  }

  /**
   * ACTUALIZAR CARRITO
   * 
   * Actualiza datos generales del carrito
   * No se usa para modificar productos individuales
   * (usar addProduct/removeProduct para eso)
   * 
   * @param {string|ObjectId} id - ID del carrito a actualizar
   * @param {Object} cartData - Nuevos datos del carrito
   * @returns {Promise<Object|null>} Carrito actualizado o null
   * @throws {Error} Si hay errores de validación
   */
  async update(id, cartData) {
    try {
      return await this.dao.update(id, cartData);
    } catch (error) {
      throw new Error(`Error actualizando carrito: ${error.message}`);
    }
  }

  /**
   * ELIMINAR CARRITO
   * 
   * Elimina completamente un carrito del sistema
   * Se usa raramente, típicamente cuando se elimina un usuario
   * 
   * @param {string|ObjectId} id - ID del carrito a eliminar
   * @returns {Promise<Object|null>} Carrito eliminado o null
   * @throws {Error} Si hay errores de acceso
   */
  async delete(id) {
    try {
      return await this.dao.delete(id);
    } catch (error) {
      throw new Error(`Error eliminando carrito: ${error.message}`);
    }
  }

  /**
   * AGREGAR PRODUCTO AL CARRITO
   * 
   * Operación principal del carrito: agregar productos
   * - Si el producto existe: suma las cantidades
   * - Si es nuevo: lo agrega al array de productos
   * - Incluye validación de existencia del carrito
   * 
   * @param {string|ObjectId} cartId - ID del carrito
   * @param {string|ObjectId} productId - ID del producto a agregar
   * @param {number} quantity - Cantidad a agregar (default: 1)
   * @returns {Promise<Object>} Carrito actualizado con el producto
   * @throws {Error} Si el carrito no existe o hay errores
   */
  async addProduct(cartId, productId, quantity = 1) {
    try {
      return await this.dao.addProduct(cartId, productId, quantity);
    } catch (error) {
      throw new Error(`Error añadiendo producto al carrito: ${error.message}`);
    }
  }

  /**
   * REMOVER PRODUCTO DEL CARRITO
   * 
   * Elimina completamente un producto del carrito
   * No modifica cantidades, elimina el item por completo
   * 
   * @param {string|ObjectId} cartId - ID del carrito
   * @param {string|ObjectId} productId - ID del producto a remover
   * @returns {Promise<Object>} Carrito actualizado sin el producto
   * @throws {Error} Si el carrito no existe o hay errores
   */
  async removeProduct(cartId, productId) {
    try {
      return await this.dao.removeProduct(cartId, productId);
    } catch (error) {
    try {
      return await this.dao.removeProduct(cartId, productId);
    } catch (error) {
      throw new Error(`Error eliminando producto del carrito: ${error.message}`);
    }
  }}

  /**
   * ACTUALIZAR CANTIDAD DE PRODUCTO
   * 
   * Modifica la cantidad de un producto específico en el carrito
   * Método especializado para cambios de cantidad desde la UI
   * 
   * NOTA: Este método llama a un DAO que puede no existir
   * Si no está implementado en el DAO, se debe usar addProduct/removeProduct
   * 
   * @param {string|ObjectId} cartId - ID del carrito
   * @param {string|ObjectId} productId - ID del producto a actualizar
   * @param {number} quantity - Nueva cantidad del producto
   * @returns {Promise<Object>} Carrito actualizado con nueva cantidad
   * @throws {Error} Si el método no existe en DAO o hay errores
   */
  async updateProductQuantity(cartId, productId, quantity) {
    try {
      return await this.dao.updateProductQuantity(cartId, productId, quantity);
    } catch (error) {
      throw new Error(`Error actualizando cantidad: ${error.message}`);
    }
  }

  /**
   * LIMPIAR CARRITO
   * 
   * Vacía completamente el carrito, eliminando todos los productos
   * Se ejecuta típicamente después de completar una compra exitosa
   * 
   * NOTA: Método puede no estar implementado en el DAO
   * Alternativa: actualizar carrito con array vacío de productos
   * 
   * @param {string|ObjectId} cartId - ID del carrito a limpiar
   * @returns {Promise<Object>} Carrito vacío
   * @throws {Error} Si el método no existe en DAO o hay errores
   */
  async clearCart(cartId) {
    try {
      return await this.dao.clearCart(cartId);
    } catch (error) {
      throw new Error(`Error limpiando carrito: ${error.message}`);
    }
  }

  /**
   * OBTENER CARRITO CON PRODUCTOS POBLADOS
   * 
   * Obtiene carrito completo con detalles de todos los productos
   * Método especializado para mostrar carrito en la UI
   * 
   * NOTA: Método puede no estar implementado en el DAO
   * Alternativa: usar findByUser() que ya incluye populate
   * 
   * @param {string|ObjectId} cartId - ID del carrito
   * @returns {Promise<Object|null>} Carrito con productos poblados o null
   * @throws {Error} Si el método no existe en DAO o hay errores
   */
  async getCartWithProducts(cartId) {
    try {
      return await this.dao.getCartWithProducts(cartId);
    } catch (error) {
      throw new Error(`Error obteniendo carrito con productos: ${error.message}`);
    }
  }

  /**
   * VERIFICAR PROPIEDAD DEL CARRITO
   * 
   * Valida que un usuario sea el propietario de un carrito específico
   * FUNCIÓN DE SEGURIDAD crítica para prevenir accesos no autorizados
   * 
   * Proceso de validación:
   * 1. Busca el carrito por ID
   * 2. Verifica que existe
   * 3. Compara el campo 'user' con el userId proporcionado
   * 4. Retorna true solo si coinciden
   * 
   * @param {string|ObjectId} cartId - ID del carrito a verificar
   * @param {string|ObjectId} userId - ID del usuario que reclama propiedad
   * @returns {Promise<boolean>} true si el usuario es propietario, false en caso contrario
   * @throws {Error} Si hay errores de acceso o validación
   */
  async isOwner(cartId, userId) {
    try {
      const cart = await this.dao.findById(cartId);
      if (!cart) return false;
      return cart.user && cart.user.toString() === userId.toString();
    } catch (error) {
      throw new Error(`Error verificando propiedad del carrito: ${error.message}`);
    }
  }

  /**
   * OBTENER TODOS LOS CARRITOS (ADMIN)
   * 
   * Lista completa de todos los carritos del sistema
   * Función administrativa para monitoreo y soporte
   * Incluye populate de usuario y productos
   * 
   * @returns {Promise<Array>} Array de todos los carritos con datos poblados
   * @throws {Error} Si hay errores de conexión o consulta
   */
  async findAll() {
    try {
      return await this.dao.findAll();
    } catch (error) {
      throw new Error(`Error obteniendo todos los carritos: ${error.message}`);
    }
  }
}

/**
 * EXPORTACIÓN DEL REPOSITORY DE CARRITOS
 * 
 * Se exporta la clase para instanciación en Services
 * El repository de carritos es central para la experiencia de compra
 */
export default CartsRepository;
