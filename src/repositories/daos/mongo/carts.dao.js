/**
 * DAO DE CARRITOS DE COMPRAS
 * 
 * Data Access Object que maneja todas las operaciones de base de datos
 * relacionadas con los carritos de compras de usuarios.
 * 
 * Funcionalidades principales:
 * - CRUD básico de carritos
 * - Gestión de productos dentro del carrito
 * - Búsqueda por usuario
 * - Populate automático de referencias
 * 
 * Patrón DAO:
 * - Encapsula la lógica de acceso a datos
 * - Abstrae las operaciones de MongoDB
 * - Proporciona interface limpia para el Repository
 * - Maneja errores de base de datos
 */

import Cart from "./models/carts.model.js";

/**
 * CLASE DAO PARA CARRITOS
 * Implementa todas las operaciones de persistencia para carritos
 */
class CartsDAO {

  /**
   * CREAR NUEVO CARRITO
   * 
   * Crea un nuevo carrito en la base de datos
   * Típicamente se llama cuando un usuario se registra o hace su primera compra
   * 
   * @param {Object} cartData - Datos del carrito a crear
   * @param {ObjectId} cartData.user - ID del usuario propietario
   * @param {Array} cartData.products - Array de productos (opcional, vacío por defecto)
   * @returns {Promise<Object>} El carrito creado con su _id generado
   * @throws {Error} Si hay problemas de validación o conexión DB
   */
  async create(cartData) {
    try {
      const cart = new Cart(cartData);
      return await cart.save();
    } catch (error) {
      throw new Error(`Error al crear carrito: ${error.message}`);
    }
  }

  /**
   * BUSCAR CARRITO POR ID
   * 
   * Encuentra un carrito específico usando su ObjectId
   * No incluye populate, devuelve datos básicos
   * 
   * @param {string|ObjectId} id - ID del carrito a buscar
   * @returns {Promise<Object|null>} El carrito encontrado o null
   * @throws {Error} Si hay problemas de conexión DB o ID inválido
   */
  async findById(id) {
    try {
      return await Cart.findById(id);
    } catch (error) {
      throw new Error(`Error al buscar carrito: ${error.message}`);
    }
  }

  /**
   * BUSCAR CARRITO POR USUARIO
   * 
   * Encuentra el carrito activo de un usuario específico
   * Incluye populate de productos para obtener detalles completos
   * Es la consulta más usada en el sistema
   * 
   * @param {string|ObjectId} userId - ID del usuario propietario
   * @returns {Promise<Object|null>} Carrito con productos poblados o null
   * @throws {Error} Si hay problemas de conexión DB
   */
  async findByUser(userId) {
    try {
      return await Cart.findOne({ user: userId }).populate("products.product");
    } catch (error) {
      throw new Error(`Error al buscar carrito por usuario: ${error.message}`);
    }
  }

  /**
   * ACTUALIZAR CARRITO
   * 
   * Actualiza datos generales del carrito
   * No se usa para modificar productos individuales
   * 
   * @param {string|ObjectId} id - ID del carrito a actualizar
   * @param {Object} cartData - Nuevos datos del carrito
   * @returns {Promise<Object|null>} Carrito actualizado o null si no existe
   * @throws {Error} Si hay problemas de validación o conexión DB
   */
  async update(id, cartData) {
    try {
      return await Cart.findByIdAndUpdate(id, cartData, { new: true });
    } catch (error) {
      throw new Error(`Error al actualizar carrito: ${error.message}`);
    }
  }

  /**
   * ELIMINAR CARRITO
   * 
   * Elimina completamente un carrito de la base de datos
   * Se usa raramente, típicamente cuando se elimina un usuario
   * 
   * @param {string|ObjectId} id - ID del carrito a eliminar
   * @returns {Promise<Object|null>} Carrito eliminado o null
   * @throws {Error} Si hay problemas de conexión DB
   */
  async delete(id) {
    try {
      return await Cart.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Error al eliminar carrito: ${error.message}`);
    }
  }

  /**
   * AGREGAR PRODUCTO AL CARRITO
   * 
   * Operación principal del carrito: agregar productos
   * - Si el producto ya existe: suma las cantidades
   * - Si es nuevo: lo agrega al array
   * - Incluye validación de existencia del carrito
   * 
   * @param {string|ObjectId} cartId - ID del carrito
   * @param {string|ObjectId} productId - ID del producto a agregar
   * @param {number} quantity - Cantidad a agregar (default: 1)
   * @returns {Promise<Object>} Carrito actualizado con el nuevo producto
   * @throws {Error} Si el carrito no existe o hay errores de DB
   */
  async addProduct(cartId, productId, quantity = 1) {
    try {
      const cart = await Cart.findById(cartId).populate("products.product");
      if (!cart) throw new Error("Carrito no encontrado");

      // Buscar si el producto ya existe en el carrito
      const existingProduct = cart.products.find((item) => {
        if (item.product && item.product._id) {
          return item.product._id.toString() === productId;
        }
        if (item.product) {
          return item.product.toString() === productId;
        }
        return false; // Evita error si item.product es null
      });

      if (existingProduct) {
        // Producto existe: incrementar cantidad
        existingProduct.quantity += quantity;
      } else {
        // Producto nuevo: agregar al carrito
        cart.products.push({ product: productId, quantity });
      }

      return await cart.save();
    } catch (error) {
      throw new Error(`Error al agregar producto: ${error.message}`);
    }
  }

  /**
   * REMOVER PRODUCTO DEL CARRITO
   * 
   * Elimina completamente un producto del carrito
   * No modifica cantidades, elimina el item por completo
   * Incluye validación defensiva contra productos null
   * 
   * @param {string|ObjectId} cartId - ID del carrito
   * @param {string|ObjectId} productId - ID del producto a remover
   * @returns {Promise<Object>} Carrito actualizado sin el producto
   * @throws {Error} Si el carrito no existe o hay errores de DB
   */
  async removeProduct(cartId, productId) {
    try {
      const cart = await Cart.findById(cartId).populate("products.product");
      if (!cart) throw new Error("Carrito no encontrado");

      // Filtrar productos excluyendo el que se quiere remover
      cart.products = cart.products.filter((item) => {
        if (item.product && item.product._id) {
          return item.product._id.toString() !== productId;
        }
        if (item.product) {
          return item.product.toString() !== productId;
        }
        return true; // Mantén el item si product es null (datos corruptos)
      });

      return await cart.save();
    } catch (error) {
      throw new Error(`Error al eliminar producto: ${error.message}`);
    }
  }

  /**
   * OBTENER TODOS LOS CARRITOS (ADMIN)
   * 
   * Lista todos los carritos del sistema con información de usuarios
   * Función administrativa para monitoreo y soporte
   * Incluye populate de usuario y productos para vista completa
   * 
   * @returns {Promise<Array>} Array de todos los carritos con datos poblados
   * @throws {Error} Si hay problemas de conexión DB
   */
  async findAll() {
    try {
      return await Cart.find({})
        .populate("user", "email first_name last_name")
        .populate("products.product");
    } catch (error) {
      throw new Error(`Error al obtener carritos: ${error.message}`);
    }
  }
}

/**
 * EXPORTACIÓN DEL DAO
 * 
 * Se exporta una clase (no instancia) para que el Repository
 * pueda crear su propia instancia según necesite
 * 
 * Patrón de uso:
 * - Repository importa esta clase
 * - Repository crea instancia: new CartsDAO()
 * - Repository usa los métodos del DAO
 */
export default CartsDAO;
