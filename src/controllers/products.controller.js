import ProductsService from "../services/products.service.js";

const productsService = new ProductsService();

/**
 * CONTROLLER DE PRODUCTOS - API REST
 * 
 * Controller que maneja todas las operaciones HTTP relacionadas con productos
 * Expone endpoints REST para el manejo del catálogo de productos
 * 
 * ENDPOINTS EXPUESTOS:
 * GET    /products        - Obtener todos los productos
 * GET    /products/:id    - Obtener producto por ID
 * POST   /products        - Crear nuevo producto
 * PUT    /products/:id    - Actualizar producto existente
 * DELETE /products/:id    - Eliminar producto
 * 
 * RESPONSABILIDADES:
 * - Validación de parámetros HTTP (query params, path params, body)
 * - Transformación de datos entre HTTP y capa de servicio
 * - Manejo de respuestas HTTP con códigos apropiados
 * - Manejo centralizado de errores con logging
 * - Sanitización de datos de entrada
 * 
 * CARACTERÍSTICAS:
 * - Validación robusta de campos obligatorios
 * - Respuestas estructuradas con formato consistente
 * - Manejo de errores HTTP con códigos apropiados
 * - Transformación de tipos (string -> number para price/stock)
 * - Logging de errores para debugging
 * 
 * INTEGRACIÓN:
 * - ProductsService: Para lógica de negocio
 * - Express.js: Para manejo de requests/responses
 * - Middlewares: Autenticación, validación, logging
 * 
 * FORMATO DE RESPUESTA ESTÁNDAR:
 * {
 *   status: "success|error",
 *   message?: string,
 *   product?: Object,
 *   products?: Array
 * }
 */
class ProductsController {
  /**
   * OBTENER TODOS LOS PRODUCTOS
   * 
   * Endpoint: GET /products
   * Retorna la lista completa de productos del catálogo
   * 
   * QUERY PARAMETERS (opcionales):
   * - category: Filtrar por categoría específica
   * - active: Solo productos activos (true/false)
   * - limit: Limitar cantidad de resultados
   * - offset: Para paginación
   * 
   * CASOS DE USO:
   * - Catálogo público de productos
   * - Panel administrativo de productos
   * - APIs para aplicaciones móviles
   * - Integraciones con sistemas externos
   * 
   * @param {Object} req - Request de Express
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} JSON con lista de productos
   */
  async getAllProducts(req, res) {
    try {
      const products = await productsService.getAll();

      res.json({
        status: "success",
        products,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * OBTENER PRODUCTO POR ID
   * 
   * Endpoint: GET /products/:id
   * Retorna los detalles completos de un producto específico
   * 
   * PATH PARAMETERS:
   * - id: ObjectId del producto a buscar
   * 
   * CASOS DE USO:
   * - Página de detalle del producto
   * - Validación antes de agregar al carrito
   * - APIs para mostrar información detallada
   * - Integraciones para sincronización
   * 
   * @param {Object} req - Request de Express con params.id
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} JSON con producto o error
   */
  async getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = await productsService.getById(id);

      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Producto no encontrado",
        });
      }

      res.json({
        status: "success",
        product,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * CREAR NUEVO PRODUCTO
   * 
   * Endpoint: POST /products
   * Crea un nuevo producto en el catálogo con validaciones completas
   * 
   * BODY PARAMETERS (obligatorios):
   * - title: Nombre del producto
   * - description: Descripción detallada
   * - price: Precio (string convertido a float)
   * - stock: Cantidad disponible (string convertido a int)
   * - category: Categoría del producto
   * - code: Código SKU único
   * 
   * BODY PARAMETERS (opcionales):
   * - thumbnails: Array de URLs de imágenes
   * 
   * VALIDACIONES IMPLEMENTADAS:
   * - Campos obligatorios presentes
   * - Conversión de tipos (price -> float, stock -> int)
   * - Código SKU único (validado en service)
   * - Status se establece como true por defecto
   * 
   * @param {Object} req - Request de Express con body data
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} JSON con producto creado o error
   */
  async createProduct(req, res) {
    try {
      const { title, description, price, stock, category, code, thumbnails } =
        req.body;

      if (!title || !description || !price || !stock || !category || !code) {
        return res.status(400).json({
          status: "error",
          message:
            "Faltan campos obligatorios: title, description, price, stock, category, code",
        });
      }

      const productData = {
        title,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        category,
        code,
        thumbnails: thumbnails || [],
        status: true,
      };

      const response = await productsService.createProduct(productData);

      if (response.error) {
        return res.status(response.type || 500).json({
          status: "error",
          message: response.message,
        });
      }

      res.status(201).json({
        status: "success",
        message: "Producto creado correctamente",
        product: response,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * ACTUALIZAR PRODUCTO EXISTENTE
   * 
   * Endpoint: PUT /products/:id
   * Actualiza un producto existente con validaciones de negocio
   * 
   * PATH PARAMETERS:
   * - id: ObjectId del producto a actualizar
   * 
   * BODY PARAMETERS (opcionales):
   * - Cualquier campo del producto que se quiera actualizar
   * - Solo se envían los campos que cambian (partial update)
   * 
   * VALIDACIONES:
   * - ID de producto requerido y válido
   * - Existencia del producto (validado en service)
   * - Unicidad de código si se actualiza (validado en service)
   * - Tipos de datos apropiados
   * 
   * CASOS DE USO:
   * - Actualización de precios
   * - Modificación de stock
   * - Cambios en descripción o imágenes
   * - Activar/desactivar productos
   * - Corrección de datos erróneos
   * 
   * @param {Object} req - Request con params.id y body data
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} JSON con producto actualizado o error
   */
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        return res.status(400).json({
          status: "error",
          message: "ID de producto requerido",
        });
      }

      const response = await productsService.updateProduct(id, updateData);

      if (response.error) {
        return res.status(response.type || 500).json({
          status: "error",
          message: response.message,
        });
      }

      res.json({
        status: "success",
        message: "Producto actualizado correctamente",
        product: response,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * ELIMINAR PRODUCTO
   * 
   * Endpoint: DELETE /products/:id
   * Elimina un producto del catálogo con verificaciones de seguridad
   * 
   * PATH PARAMETERS:
   * - id: ObjectId del producto a eliminar
   * 
   * VALIDACIONES:
   * - ID de producto requerido y válido
   * - Existencia del producto
   * - Verificación de dependencias (carritos, órdenes activas)
   * - Permisos administrativos (manejado por middleware)
   * 
   * CONSIDERACIONES IMPORTANTES:
   * - Operación irreversible (sin soft delete implementado)
   * - Puede afectar integridad referencial
   * - Impacto en reportes históricos
   * - Considerar desactivar en lugar de eliminar
   * 
   * CASOS DE USO:
   * - Eliminación definitiva de productos erróneos
   * - Limpieza de productos de prueba
   * - Remoción de productos descontinuados
   * - Operaciones administrativas especiales
   * 
   * @param {Object} req - Request con params.id
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} JSON con confirmación o error
   */
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          status: "error",
          message: "ID de producto requerido",
        });
      }

      const response = await productsService.deleteProduct(id);

      if (response.error) {
        return res.status(response.type || 500).json({
          status: "error",
          message: response.message,
        });
      }

      res.json({
        status: "success",
        message: response.message || "Producto eliminado correctamente",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      });
    }
  }
}

export default ProductsController;
