/**
 * CONTROLLER DE VISTAS DE PRODUCTOS - PREPARACIÓN DE DATOS PARA TEMPLATES
 * 
 * Controller especializado en preparar datos para renderizado de vistas
 * Actúa como middleware entre rutas y templates Handlebars
 * 
 * FUNCIONALIDAD PRINCIPAL:
 * - Obtener productos desde ProductsService
 * - Aplicar filtros de categoría y subcategoría
 * - Preparar datos para renderizado en views
 * - Pasar control al siguiente middleware
 * 
 * PATRON MIDDLEWARE:
 * - No renderiza directamente, prepara datos
 * - Usa req object para pasar datos
 * - Llama next() para continuar pipeline
 * - Integra con sistema de views de Express
 * 
 * CARACTERÍSTICAS DE FILTRADO:
 * - Filtrado por categoría principal (mainCategory)
 * - Filtrado por subcategoría (subCategory)
 * - Filtros opcionales vía query parameters
 * - Preservación de contexto de filtros
 * 
 * INTEGRACIÓN CON VIEWS:
 * - Datos disponibles en req.products
 * - Contexto de filtros en req.currentCategory/SubCategory
 * - Compatible con templates Handlebars
 * - Logging detallado para debugging
 */
import ProductsService from "../services/products.service.js";
import currencyService from "../services/currency.service.js";

const productsService = new ProductsService();

/**
 * CONTROLLER DE VISTA DE PRODUCTOS
 * 
 * Clase especializada en preparación de datos para renderizado de vistas
 * Actúa como middleware en el pipeline de renderizado
 * 
 * RESPONSABILIDADES:
 * - Obtener datos de productos
 * - Aplicar filtros dinámicos
 * - Preparar contexto para templates
 * - Manejo de errores para views
 * 
 * PATRON IMPLEMENTADO:
 * - Middleware Pattern: Preparación de datos sin renderizado
 * - Chain of Responsibility: Pasa control al siguiente handler
 * - Data Preparation: Transformación para consumo de views
 */
class ProductsViewController {
  /**
   * PREPARAR VISTA DE PRODUCTOS
   * 
   * Middleware que prepara datos de productos para renderizado de vistas
   * Obtiene productos del servicio y aplica filtros dinámicos
   * 
   * QUERY PARAMETERS:
   * - category: Filtro por categoría principal
   * - subcategory: Filtro por subcategoría
   * 
   * PROCESO DE PREPARACIÓN:
   * 1. Obtener todos los productos del servicio
   * 2. Convertir a objetos planos (toObject)
   * 3. Aplicar filtro de categoría si existe
   * 4. Aplicar filtro de subcategoría si existe
   * 5. Agregar datos filtrados al request
   * 6. Pasar control al siguiente middleware
   * 
   * DATOS PREPARADOS EN REQUEST:
   * - req.products: Array de productos filtrados
   * - req.currentCategory: Categoría activa (si aplica)
   * - req.currentSubCategory: Subcategoría activa (si aplica)
   * 
   * FILTRADO INTELIGENTE:
   * - Filtros opcionales y combinables
   * - Preservación de contexto de navegación
   * - Logging detallado para debugging
   * - Conversión de Mongoose objects
   * 
   * USO EN PIPELINE:
   * - Se ejecuta antes del renderizado final
   * - Prepara datos para templates Handlebars
   * - Maneja errores y pasa al error handler
   * 
   * @param {Object} req - Request con query params opcionales
   * @param {Object} res - Response de Express
   * @param {Function} next - Next middleware en el pipeline
   * @returns {Promise<void>} Continua al siguiente middleware
   */
  async getProductsView(req, res, next) {
    try {
      console.log('🎯 ProductsViewController: Solicitando productos...');
      const products = await productsService.getAll();
      console.log(`📋 ProductsViewController: Recibidos ${products.length} productos del servicio`);
      
      const { category, subcategory } = req.query;
      let filteredProducts = products.map((p) => (p.toObject ? p.toObject() : p));
      
      // Filtrar por categoría principal si se especifica
      if (category) {
        filteredProducts = filteredProducts.filter(product => 
          product.mainCategory === category
        );
      }
      
      // Filtrar por subcategoría si se especifica
      if (subcategory) {
        filteredProducts = filteredProducts.filter(product => 
          product.subCategory === subcategory
        );
      }

      // DESACTIVADO: Conversión automática de precios para permitir control manual
      // Esta funcionalidad estaba interfiriendo con el control de cambio manual
      console.log('💰 ProductsViewController: Conversión automática DESACTIVADA para control manual');
      
      // Usar productos sin conversión automática
      const productsWithConvertedPrices = filteredProducts;
      
      // // CÓDIGO ANTERIOR (comentado):
      // // Convertir precios de EUR a moneda local
      // console.log('💰 ProductsViewController: Convirtiendo precios de EUR...');
      // const productsWithConvertedPrices = await currencyService.convertMultiplePrices(
      //   filteredProducts, 
      //   { markup: 0.15 } // 15% de margen
      // );
      
      req.products = productsWithConvertedPrices;
      req.currentCategory = category;
      req.currentSubCategory = subcategory;
      
      console.log(`✅ ProductsViewController: Productos filtrados: ${req.products.length}`);
      if (category) console.log(`🏷️ Categoría: ${category}`);
      if (subcategory) console.log(`🏷️ Subcategoría: ${subcategory}`);
      
      next();
    } catch (error) {
      console.error('❌ Error en ProductsViewController:', error);
      next(error);
    }
  }
}

export default ProductsViewController;
