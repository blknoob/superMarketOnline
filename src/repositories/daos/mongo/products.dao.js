/**
 * DAO DE PRODUCTOS - CATÁLOGO DEL SUPERMERCADO
 * 
 * Data Access Object para todas las operaciones de productos en MongoDB
 * Maneja el catálogo completo del supermercado con funcionalidades de:
 * 
 * - CRUD completo de productos
 * - Gestión de stock e inventario
 * - Búsquedas por código y ID
 * - Mapeo automático de categorías legacy
 * - Validaciones de datos
 * 
 * Características especiales:
 * - Mapeo automático de categorías antiguas a nuevo sistema
 * - Control de stock con validaciones
 * - Logging detallado para debugging
 * - Soporte para categorías jerárquicas
 */

import Product from "./models/products.model.js";
import { mapCategory } from "../../../utils/categoryMapper.js";

/**
 * CLASE DAO PARA PRODUCTOS
 * Implementa todas las operaciones de persistencia del catálogo
 */
class ProductsDAO {

  /**
   * CREAR NUEVO PRODUCTO
   * 
   * Crea un producto en el catálogo del supermercado
   * Valida datos según el schema del modelo antes de guardar
   * 
   * @param {Object} productData - Datos completos del producto
   * @param {string} productData.title - Nombre del producto
   * @param {string} productData.description - Descripción detallada
   * @param {string} productData.code - Código único (SKU)
   * @param {number} productData.price - Precio unitario
   * @param {number} productData.stock - Cantidad disponible
   * @param {string} productData.mainCategory - Categoría principal
   * @param {string} productData.subCategory - Subcategoría
   * @param {string} [productData.image] - URL de imagen (opcional)
   * @returns {Promise<Object>} Producto creado con su _id generado
   * @throws {Error} Si hay errores de validación o duplicados (código único)
   */
  async create(productData) {
    try {
      const product = new Product(productData);
      return await product.save();
    } catch (error) {
      throw new Error(`Error al crear producto: ${error.message}`);
    }
  }

  /**
   * BUSCAR PRODUCTO POR ID
   * 
   * Obtiene un producto específico usando su ObjectId
   * Método básico sin populate ni transformaciones
   * 
   * @param {string|ObjectId} id - ID del producto a buscar
   * @returns {Promise<Object|null>} Producto encontrado o null
   * @throws {Error} Si el ID es inválido o hay errores de DB
   */
  async getById(id) {
    try {
      return await Product.findById(id);
    } catch (error) {
      throw new Error(`Error buscando producto por ID: ${error.message}`);
    }
  }

  /**
   * BUSCAR PRODUCTO POR CÓDIGO (SKU)
   * 
   * Encuentra un producto usando su código único
   * Útil para integraciones y búsquedas administrativas
   * 
   * @param {string} code - Código único del producto (ej: "LAC001")
   * @returns {Promise<Object|null>} Producto encontrado o null
   * @throws {Error} Si hay errores de DB
   */
  async findByCode(code) {
    try {
      return await Product.findOne({ code });
    } catch (error) {
      throw new Error(`Error al buscar producto por código: ${error.message}`);
    }
  }

  /**
   * OBTENER TODOS LOS PRODUCTOS
   * 
   * Lista completa del catálogo con funcionalidades especiales:
   * - Ordenamiento por fecha de creación (más recientes primero)
   * - Mapeo automático de categorías legacy
   * - Logging detallado para debugging
   * - Transformación de objetos Mongoose a POJOs
   * 
   * Proceso de mapeo de categorías:
   * 1. Si producto tiene mainCategory/subCategory: los mantiene
   * 2. Si solo tiene 'category' legacy: lo mapea automáticamente
   * 3. Actualiza la respuesta con categorías correctas
   * 
   * @param {Object} options - Opciones de consulta (reservado para paginación futura)
   * @returns {Promise<Array>} Array de productos con categorías mapeadas
   * @throws {Error} Si hay errores de conexión DB
   */
  async findAll(options = {}) {
    try {
      // Logging condicional - solo en desarrollo
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔍 ProductsDAO: Consultando productos en la base de datos...');
      }
      
      const products = await Product.find({}).sort({ createdAt: -1 });
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`📊 ProductsDAO: Encontrados ${products.length} productos en BD`);
      }
      
      // Mapear categorías automáticamente para productos legacy
      // que no tienen mainCategory/subCategory definidos
      const mappedProducts = products.map(product => {
        const productObj = product.toObject();
        
        // Si faltan las nuevas categorías, mapear desde la antigua
        if (!productObj.mainCategory || !productObj.subCategory) {
          const mapped = mapCategory(productObj.category);
          productObj.mainCategory = mapped.mainCategory;
          productObj.subCategory = mapped.subCategory;
        }
        
        return productObj;
      });
      
      // Logging detallado solo en modo debug
      if (process.env.NODE_ENV === 'development' && process.env.DEBUG_PRODUCTS) {
        mappedProducts.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.title} - ${product.mainCategory} > ${product.subCategory}`);
        });
      }
      
      return mappedProducts;
    } catch (error) {
      console.error('❌ Error en ProductsDAO.findAll:', error);
      throw new Error(`Error al obtener productos: ${error.message}`);
    }
  }

  /**
   * ACTUALIZAR PRODUCTO EXISTENTE
   * 
   * Actualiza datos de un producto con validaciones completas
   * - Ejecuta validadores del schema (runValidators: true)
   * - Devuelve documento actualizado (new: true)
   * 
   * @param {string|ObjectId} id - ID del producto a actualizar
   * @param {Object} updateData - Campos a actualizar (parcial)
   * @returns {Promise<Object|null>} Producto actualizado o null
   * @throws {Error} Si hay errores de validación o producto no existe
   */
  
  async update(id, updateData) {
    try {
      return await Product.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });
    } catch (error) {
      throw new Error(`Error al actualizar producto: ${error.message}`);
    }
  }

  /**
   * ELIMINAR PRODUCTO
   * 
   * Elimina un producto completamente del catálogo
   * ADVERTENCIA: Esta operación es irreversible
   * 
   * Consideraciones:
   * - Verificar que no esté en carritos activos antes de eliminar
   * - Los tickets históricos mantendrán la referencia (ObjectId)
   * - Puede causar errores en populate si no se maneja correctamente
   * 
   * @param {string|ObjectId} id - ID del producto a eliminar
   * @returns {Promise<Object|null>} Producto eliminado o null
   * @throws {Error} Si hay errores de DB
   */
  async delete(id) {
    try {
      return await Product.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Error al eliminar producto: ${error.message}`);
    }
  }

  /**
   * REDUCIR STOCK DE PRODUCTO
   * 
   * Operación crítica para el proceso de ventas
   * Reduce la cantidad en stock cuando se confirma una compra
   * 
   * Validaciones implementadas:
   * - Producto debe existir
   * - Stock actual debe ser suficiente (>= quantity)
   * - Usa operación atómica $inc para evitar race conditions
   * - No ejecuta validadores completos (optimización)
   * 
   * @param {string|ObjectId} productId - ID del producto
   * @param {number} quantity - Cantidad a reducir del stock
   * @returns {Promise<Object>} Producto actualizado con nuevo stock
   * @throws {Error} Si producto no existe o stock insuficiente
   */
  async reduceStock(productId, quantity) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Producto no encontrado");
      }

      if (product.stock < quantity) {
        throw new Error("Stock insuficiente");
      }

      // Usar $inc para operación atómica (thread-safe)
      // runValidators: false para optimizar rendimiento
      return await Product.findByIdAndUpdate(
        productId,
        { $inc: { stock: -quantity } },
        { new: true, runValidators: false }
      );
    } catch (error) {
      throw new Error(`Error al reducir stock: ${error.message}`);
    }
  }

  /**
   * BUSCAR PRODUCTO POR ID (ALIAS)
   * 
   * Método alias de getById() para mantener consistencia con otros DAOs
   * Algunos repositorios/servicios pueden usar findById en lugar de getById
   * 
   * @param {string|ObjectId} id - ID del producto a buscar
   * @returns {Promise<Object|null>} Producto encontrado o null
   * @throws {Error} Si el ID es inválido o hay errores de DB
   */
  async findById(id) {
    // Delegar al método principal para evitar duplicación de código
    return this.getById(id);
  }
}

/**
 * EXPORTACIÓN DEL DAO DE PRODUCTOS
 * 
 * Se exporta la clase para que el Repository pueda instanciarla
 * Mantiene el patrón arquitectural: Controller → Service → Repository → DAO
 */
export default ProductsDAO;
