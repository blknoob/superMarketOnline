/**
 * REPOSITORY DE PRODUCTOS - CAPA DE ABSTRACCIÓN
 *
 * Repository que actúa como capa intermedia entre Services y DAOs
 * Implementa el patrón Repository para abstraer el acceso a datos
 * y proporcionar una interface limpia y consistente para el catálogo de productos
 *
 * ARQUITECTURA:
 * Controller → Service → Repository → DAO → Model → MongoDB
 *
 * RESPONSABILIDADES:
 * - Abstracción de la persistencia de datos
 * - Manejo unificado de errores de datos
 * - Interface consistente para operaciones CRUD
 * - Delegación hacia el DAO correspondiente
 * - Validaciones de nivel de negocio (si las hay)
 *
 * BENEFICIOS DEL PATRÓN:
 * - Desacoplamiento entre lógica de negocio y persistencia
 * - Facilidad para testing (se puede mockear fácilmente)
 * - Posibilidad de cambiar DAOs sin afectar Services
 * - Manejo centralizado de errores de datos
 * - Consistencia en mensajes de error
 */

// Repository de productos - Sencillo y directo
import ProductsDAO from "./daos/mongo/products.dao.js";

/**
 * CLASE REPOSITORY PARA PRODUCTOS
 * Proporciona interface limpia para operaciones del catálogo
 */
class ProductsRepository {
  /**
   * CONSTRUCTOR
   * Inicializa el repository con una instancia del DAO
   * El DAO se encarga de las operaciones reales con MongoDB
   */
  constructor() {
    this.dao = new ProductsDAO();
  }

  /**
   * BUSCAR PRODUCTO POR ID
   *
   * Busca un producto específico usando su ObjectId
   * Alias de getById() para compatibilidad con diferentes estilos
   *
   * @param {string|ObjectId} id - ID del producto a buscar
   * @returns {Promise<Object|null>} Producto encontrado o null
   * @throws {Error} Si hay errores de validación o acceso a datos
   */
  async findById(id) {
    try {
      return await this.dao.findById(id);
    } catch (error) {
      throw new Error(`Error buscando producto: ${error.message}`);
    }
  }

  /**
   * OBTENER TODOS LOS PRODUCTOS
   *
   * Lista completa del catálogo con funcionalidades automáticas:
   * - Mapeo de categorías legacy a nuevo sistema
   * - Ordenamiento por fecha de creación
   * - Logging condicional según entorno
   *
   * @param {Object} options - Opciones de consulta (reservado para paginación)
   * @returns {Promise<Array>} Array de productos con categorías mapeadas
   * @throws {Error} Si hay errores de conexión o consulta
   */
  async findAll(options = {}) {
    try {
      return await this.dao.findAll(options);
    } catch (error) {
      throw new Error(`Error buscando productos: ${error.message}`);
    }
  }

  /**
   * CREAR NUEVO PRODUCTO
   *
   * Añade un producto al catálogo del supermercado
   * Valida datos según el schema del modelo
   *
   * @param {Object} productData - Datos completos del producto
   * @param {string} productData.title - Nombre del producto
   * @param {string} productData.description - Descripción detallada
   * @param {string} productData.code - Código único (SKU)
   * @param {number} productData.price - Precio unitario
   * @param {number} productData.stock - Cantidad inicial disponible
   * @param {string} productData.mainCategory - Categoría principal
   * @param {string} productData.subCategory - Subcategoría
   * @param {string} [productData.image] - URL de imagen (opcional)
   * @returns {Promise<Object>} Producto creado con su _id generado
   * @throws {Error} Si hay errores de validación o código duplicado
   */
  async create(productData) {
    try {
      return await this.dao.create(productData);
    } catch (error) {
      throw new Error(`Error creando producto: ${error.message}`);
    }
  }

  /**
   * ACTUALIZAR PRODUCTO EXISTENTE
   *
   * Modifica datos de un producto en el catálogo
   * Ejecuta validaciones del schema antes de guardar
   *
   * @param {string|ObjectId} id - ID del producto a actualizar
   * @param {Object} productData - Campos a actualizar (datos parciales)
   * @returns {Promise<Object|null>} Producto actualizado o null si no existe
   * @throws {Error} Si hay errores de validación o producto no encontrado
   */
  async update(id, productData) {
    try {
      return await this.dao.update(id, productData);
    } catch (error) {
      throw new Error(`Error actualizando producto: ${error.message}`);
    }
  }

  /**
   * ELIMINAR PRODUCTO
   *
   * Elimina completamente un producto del catálogo
   * ⚠️ OPERACIÓN CRÍTICA - Puede afectar carritos y referencias históricas
   *
   * @param {string|ObjectId} id - ID del producto a eliminar
   * @returns {Promise<Object|null>} Producto eliminado o null
   * @throws {Error} Si hay errores de acceso o producto no encontrado
   */
  async delete(id) {
    try {
      return await this.dao.delete(id);
    } catch (error) {
      throw new Error(`Error eliminando producto: ${error.message}`);
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
   * @throws {Error} Si hay errores de consulta
   */
  async findByCode(code) {
    try {
      return await this.dao.findByCode(code);
    } catch (error) {
      throw new Error(`Error buscando producto por código: ${error.message}`);
    }
  }

  /**
   * REDUCIR STOCK DE PRODUCTO
   *
   * Operación crítica para el proceso de ventas
   * Reduce la cantidad disponible cuando se confirma una compra
   * Usa operaciones atómicas para evitar condiciones de carrera
   *
   * Validaciones automáticas:
   * - Producto debe existir
   * - Stock actual debe ser suficiente (>= quantity)
   * - Actualización atómica con $inc
   *
   * @param {string|ObjectId} productId - ID del producto
   * @param {number} quantity - Cantidad a reducir del stock
   * @returns {Promise<Object>} Producto actualizado con nuevo stock
   * @throws {Error} Si producto no existe o stock insuficiente
   */
  async reduceStock(productId, quantity) {
    try {
      return await this.dao.reduceStock(productId, quantity);
    } catch (error) {
      throw new Error(`Error reduciendo stock: ${error.message}`);
    }
  }

  /**
   * BUSCAR PRODUCTO POR ID (MÉTODO PRINCIPAL)
   *
   * Obtiene un producto específico usando su ObjectId
   * Método principal recomendado para búsquedas por ID
   *
   * @param {string|ObjectId} id - ID del producto a buscar
   * @returns {Promise<Object|null>} Producto encontrado o null
   * @throws {Error} Si el ID es inválido o hay errores de acceso
   */
  async getById(id) {
    try {
      return await this.dao.getById(id);
    } catch (error) {
      throw new Error(`Error buscando producto por ID: ${error.message}`);
    }
  }
}

/**
 * EXPORTACIÓN DEL REPOSITORY DE PRODUCTOS
 *
 * Se exporta una clase para que los Services puedan instanciarla
 * Mantiene el patrón de inyección de dependencias en la arquitectura
 *
 * Uso típico en Service:
 * - const repository = new ProductsRepository()
 * - const products = await repository.findAll()
 */
export default ProductsRepository;
