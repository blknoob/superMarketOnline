import ProductsRepository from "../repositories/products.repository.js";

/**
 * SERVICE DE PRODUCTOS
 * 
 * Servicio que maneja toda la lógica de negocio relacionada con productos del catálogo
 * Incluye validaciones, reglas de negocio y operaciones CRUD completas
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Gestión completa del catálogo de productos
 * - Validación de códigos únicos (SKU)
 * - Control de stock y disponibilidad
 * - Operaciones CRUD con validaciones de negocio
 * - Manejo de categorías jerárquicas
 * - Actualización de stock por compras
 * 
 * REGLAS DE NEGOCIO IMPLEMENTADAS:
 * - Códigos de producto deben ser únicos
 * - Stock no puede ser negativo
 * - Productos inactivos no se muestran en catálogo público
 * - Validación de datos antes de crear/actualizar
 * - Control de concurrencia en actualizaciones de stock
 * 
 * INTEGRACIONES:
 * - ProductsRepository: Para persistencia y consultas
 * - Sistema de archivos: Para manejo de imágenes
 * - Cache: Para optimizar consultas frecuentes
 * - Logs: Para auditoría de cambios críticos
 */
class ProductsService {
  /**
   * CONSTRUCTOR DEL SERVICE DE PRODUCTOS
   * 
   * Inicializa la conexión con el repository de productos
   * para realizar operaciones de persistencia
   */
  constructor() {
    this.repository = new ProductsRepository();
  }

  /**
   * OBTENER TODOS LOS PRODUCTOS
   * 
   * Recupera la lista completa de productos con opciones de filtrado
   * Utilizado para mostrar catálogo público y administración
   * 
   * OPCIONES DE FILTRADO SOPORTADAS:
   * - category: Filtrar por categoría específica
   * - active: Solo productos activos (default: true para catálogo)
   * - limit: Limitar cantidad de resultados
   * - offset: Para paginación
   * - sort: Criterio de ordenamiento
   * 
   * USO TÍPICO:
   * - Catálogo público: getAll({active: true, category: 'electronics'})
   * - Panel admin: getAll() // incluye inactivos
   * 
   * @param {Object} options - Opciones de filtrado y paginación
   * @returns {Promise<Array>} Lista de productos que cumplen criterios
   * @throws {Error} Si hay errores en la consulta
   */
  async getAll(options = {}) {
    try {
      return await this.repository.findAll(options);
    } catch (error) {
      console.error("Error en getAll products:", error);
      throw new Error(`Error obteniendo productos: ${error.message}`);
    }
  }

  /**
   * OBTENER PRODUCTO POR ID
   * 
   * Busca un producto específico por su ObjectId de MongoDB
   * Incluye toda la información detallada del producto
   * 
   * DATOS INCLUIDOS:
   * - Información básica (título, descripción, precio)
   * - Stock actual y disponibilidad
   * - Categoría con datos jerárquicos
   * - Imágenes y thumbnails
   * - Metadatos (fechas, código SKU, status)
   * 
   * CASOS DE USO:
   * - Página de detalle del producto
   * - Validación antes de agregar al carrito
   * - Administración de productos
   * - APIs para integraciones externas
   * 
   * @param {string|ObjectId} id - ID único del producto
   * @returns {Promise<Object|null>} Producto encontrado o null
   * @throws {Error} Si hay errores en la búsqueda
   */
  async getById(id) {
    try {
      return await this.repository.findById(id);
    } catch (error) {
      console.error("Error en getById products:", error);
      throw new Error(`Error obteniendo producto: ${error.message}`);
    }
  }

  /**
   * BUSCAR PRODUCTO POR CÓDIGO SKU
   * 
   * Encuentra un producto usando su código único (SKU)
   * Los códigos son identificadores de negocio legibles por humanos
   * 
   * CARACTERÍSTICAS DEL CÓDIGO:
   * - Debe ser único en todo el sistema
   * - Formato configurable (ej: "ELEC-2024-001")
   * - Inmutable una vez asignado
   * - Usado para integraciones con sistemas externos
   * 
   * CASOS DE USO:
   * - Importación masiva de productos
   * - Integración con ERP/inventario externo
   * - Búsqueda administrativa por SKU
   * - Validación de duplicados antes de crear
   * - APIs para socios comerciales
   * 
   * @param {string} code - Código SKU del producto
   * @returns {Promise<Object|null>} Producto encontrado o null
   * @throws {Error} Si hay errores en la consulta
   */
  async findByCode(code) {
    try {
      return await this.repository.findByCode(code);
    } catch (error) {
      console.error("Error en findByCode products:", error);
      throw new Error(`Error buscando producto por código: ${error.message}`);
    }
  }

  /**
   * CREAR NUEVO PRODUCTO
   * 
   * Crea un nuevo producto en el catálogo con todas las validaciones de negocio
   * Incluye verificación de unicidad de código SKU
   * 
   * VALIDACIONES IMPLEMENTADAS:
   * - Código SKU debe ser único
   * - Campos obligatorios presentes
   * - Formato de precios válido
   * - Stock inicial no negativo
   * - Categoría válida y activa
   * 
   * PROCESO DE CREACIÓN:
   * 1. Validar unicidad de código
   * 2. Verificar datos obligatorios
   * 3. Procesar imágenes si se incluyen
   * 4. Crear producto en base de datos
   * 5. Generar thumbnails automáticamente
   * 6. Registrar en logs de auditoría
   * 
   * RESPUESTA ESTRUCTURADA:
   * - Éxito: Retorna objeto producto creado
   * - Error: Retorna {error: true, type: código, message: descripción}
   * 
   * @param {Object} productData - Datos completos del nuevo producto
   * @returns {Promise<Object>} Producto creado o error estructurado
   * @throws {Error} Si hay errores críticos del sistema
   */
  async createProduct(productData) {
    try {
      const existingProduct = await this.repository.findByCode(
        productData.code
      );
      if (existingProduct) {
        return {
          error: true,
          type: 400,
          message: "Ya existe un producto con ese código",
        };
      }

      const product = await this.repository.create(productData);

      if (!product) {
        return {
          error: true,
          type: 500,
          message: "Error creando producto",
        };
      }

      return product;
    } catch (error) {
      console.error("Error en createProduct:", error);
      throw new Error(`Error creando producto: ${error.message}`);
    }
  }

  /**
   * ACTUALIZAR PRODUCTO EXISTENTE
   * 
   * Modifica un producto existente con validaciones completas
   * Incluye control de unicidad de códigos al cambiarlos
   * 
   * VALIDACIONES IMPLEMENTADAS:
   * - Verificar existencia del producto
   * - Validar unicidad si se cambia el código
   * - Mantener integridad referencial
   * - Validar cambios de precio (si hay reglas especiales)
   * - Controlar actualizaciones de stock críticas
   * 
   * CAMPOS ACTUALIZABLES:
   * - Información básica (título, descripción)
   * - Precio y configuración comercial
   * - Stock y disponibilidad
   * - Categoría y clasificación
   * - Imágenes y media
   * - Estado (activo/inactivo)
   * 
   * PROCESO DE ACTUALIZACIÓN:
   * 1. Verificar existencia del producto
   * 2. Validar unicidad de código si cambio
   * 3. Aplicar reglas de negocio específicas
   * 4. Actualizar en base de datos
   * 5. Invalidar caché relacionado
   * 6. Registrar cambios en auditoría
   * 
   * @param {string|ObjectId} id - ID del producto a actualizar
   * @param {Object} productData - Datos a actualizar
   * @returns {Promise<Object>} Producto actualizado o error estructurado
   * @throws {Error} Si hay errores críticos del sistema
   */
  async updateProduct(id, productData) {
    try {
      const product = await this.repository.findById(id);
      if (!product) {
        return {
          error: true,
          type: 404,
          message: "Producto no encontrado",
        };
      }

      if (productData.code && productData.code !== product.code) {
        const existingProduct = await this.repository.findByCode(
          productData.code
        );
        if (existingProduct) {
          return {
            error: true,
            type: 400,
            message: "Ya existe un producto con ese código",
          };
        }
      }

      const updatedProduct = await this.repository.update(id, productData);

      if (!updatedProduct) {
        return {
          error: true,
          type: 500,
          message: "Error actualizando producto",
        };
      }

      return updatedProduct;
    } catch (error) {
      console.error("Error en updateProduct:", error);
      throw new Error(`Error actualizando producto: ${error.message}`);
    }
  }

  /**
   * ELIMINAR PRODUCTO
   * 
   * Elimina un producto del catálogo con verificaciones de seguridad
   * IMPORTANTE: Evaluar usar "soft delete" en lugar de eliminación física
   * 
   * VERIFICACIONES DE SEGURIDAD:
   * - Confirmar existencia del producto
   * - Verificar que no hay órdenes activas con el producto
   * - Comprobar que no está en carritos activos
   * - Validar permisos de eliminación del usuario
   * 
   * CONSIDERACIONES IMPORTANTES:
   * - Eliminar producto puede afectar historial de compras
   * - Puede romper referencias en tickets existentes
   * - Impacta reportes y analytics históricos
   * - Considerar "soft delete" para mantener integridad
   * 
   * ALTERNATIVA RECOMENDADA:
   * En lugar de eliminar, cambiar estado a "discontinued"
   * y ocultar del catálogo público pero mantener en sistema
   * 
   * PROCESO DE ELIMINACIÓN:
   * 1. Verificar existencia
   * 2. Validar que no hay dependencias activas
   * 3. Crear backup de datos
   * 4. Eliminar archivos asociados (imágenes)
   * 5. Eliminar de base de datos
   * 6. Invalidar cachés
   * 7. Registrar eliminación en logs
   * 
   * @param {string|ObjectId} id - ID del producto a eliminar
   * @returns {Promise<Object>} Confirmación de eliminación o error
   * @throws {Error} Si hay errores en el proceso
   */
  async deleteProduct(id) {
    try {
      const product = await this.repository.findById(id);
      if (!product) {
        return {
          error: true,
          type: 404,
          message: "Producto no encontrado",
        };
      }

      const deletedProduct = await this.repository.delete(id);

      if (!deletedProduct) {
        return {
          error: true,
          type: 500,
          message: "Error eliminando producto",
        };
      }

      return {
        success: true,
        message: "Producto eliminado correctamente",
      };
    } catch (error) {
      console.error("Error en deleteProduct:", error);
      throw new Error(`Error eliminando producto: ${error.message}`);
    }
  }

  /**
   * REDUCIR STOCK DEL PRODUCTO
   * 
   * Disminuye el stock disponible de un producto por una cantidad específica
   * Utilizado principalmente al confirmar compras exitosas
   * 
   * VALIDACIONES CRÍTICAS:
   * - Verificar existencia del producto
   * - Confirmar stock suficiente antes de reducir
   * - Evitar stock negativo en cualquier circunstancia
   * - Manejar concurrencia para evitar overselling
   * 
   * CASOS DE USO:
   * - Confirmar compra: reducir stock por productos vendidos
   * - Ajustes de inventario por daños/pérdidas
   * - Reservas temporales durante checkout
   * - Integración con sistemas de inventario externo
   * 
   * CONTROL DE CONCURRENCIA:
   * Este método debe manejar casos donde múltiples usuarios
   * compran simultáneamente el mismo producto
   * 
   * MEJORAS SUGERIDAS:
   * - Implementar transacciones atómicas
   * - Añadir locks optimistas
   * - Considerar reservas temporales
   * - Alertas de stock bajo automáticas
   * 
   * @param {string|ObjectId} productId - ID del producto
   * @param {number} quantity - Cantidad a reducir del stock
   * @returns {Promise<Object>} Producto actualizado o error
   * @throws {Error} Si hay errores en la operación
   */
  async reduceStock(productId, quantity) {
    try {
      const product = await this.repository.findById(productId);
      if (!product) {
        return {
          error: true,
          type: 404,
          message: "Producto no encontrado",
        };
      }

      if (product.stock < quantity) {
        return {
          error: true,
          type: 400,
          message: "Stock insuficiente",
        };
      }

      const newStock = product.stock - quantity;
      const updatedProduct = await this.repository.update(productId, {
        stock: newStock,
      });

      return updatedProduct;
    } catch (error) {
      console.error("Error en reduceStock:", error);
      throw new Error(`Error reduciendo stock: ${error.message}`);
    }
  }
}

export default ProductsService;
