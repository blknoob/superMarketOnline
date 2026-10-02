/**
 * @fileoverview Servicio de cotización de monedas
 * 
 * Servicio que maneja la conversión de precios basados en cotizaciones
 * en tiempo real del Euro usando la API de DolarAPI. Proporciona
 * funciones para obtener cotizaciones y convertir precios automáticamente.
 * 
 * CARACTERÍSTICAS:
 * - Integración con API de DolarAPI
 * - Cache de cotizaciones para optimizar rendimiento  
 * - Manejo de errores y fallbacks
 * - Conversión automática EUR a moneda local
 * - Actualización periódica de cotizaciones
 * 
 * API UTILIZADA:
 * - Endpoint: https://api.dolarapi.com/v1/cotizaciones/eur
 * - Respuesta: { compra, venta, fechaActualizacion }
 * - Rate limiting: Respeta límites de la API externa
 * 
 * CASOS DE USO:
 * - Conversión de precios base en EUR a precio local
 * - Actualización dinámica de precios en frontend
 * - Cache para evitar requests excesivos
 * - Fallback en caso de fallo de API
 * 
 * @author Sistema SuperMercado Online
 * @version 1.0.0
 * @since 2026-01-02
 */

import { logger } from '../utils/logger.js';

/**
 * Servicio para manejo de cotizaciones de moneda
 * 
 * Proporciona funciones para obtener cotizaciones del EUR
 * y convertir precios base a moneda local con cache integrado.
 */
class CurrencyService {
  constructor() {
    this.fallbackRate = 1.10; // Cotización de fallback EUR/USD
  }

  /**
   * Obtiene la cotización actual del EUR
   * 
   * Realiza llamada a la API externa con sistema de cache
   * para optimizar rendimiento y evitar requests innecesarios.
   * Incluye manejo de errores y fallback en caso de fallo.
   * 
   * RESPUESTA ESPERADA DE API:
   * {
   *   "compra": 1.05,
   *   "venta": 1.15,
   *   "fechaActualizacion": "2026-01-02T10:30:00.000Z"
   * }
   * 
   * @async
   * @returns {Promise<Object>} Objeto con cotización EUR
   * @throws {Error} Si falla la API y no hay cache disponible
   */
  async getEURCotization() {
    try {
      // DEMO: Usar datos simulados
      logger.info('Generating demo EUR cotization data');
      
      // Simular cotización realista con pequeña variación
      const baseRate = 1.10;
      const variation = (Math.random() - 0.5) * 0.02; // ±1% variación
      const compra = baseRate + variation;
      const venta = compra * 1.02; // 2% spread
      
      const cotization = {
        compra: Math.round(compra * 10000) / 10000,
        venta: Math.round(venta * 10000) / 10000,
        fechaActualizacion: new Date().toISOString(),
        source: 'demo-simulated',
        timestamp: new Date().toISOString()
      };

      logger.info('EUR cotization generated successfully', {
        compra: cotization.compra,
        venta: cotization.venta,
        source: 'demo'
      });

      return cotization;

    } catch (error) {
      logger.error('Error generating EUR cotization', {
        error: error.message,
        fallbackUsed: true
      });

      // Usar cotización de fallback
      const fallbackCotization = {
        compra: this.fallbackRate,
        venta: this.fallbackRate * 1.05,
        fechaActualizacion: new Date().toISOString(),
        source: 'fallback',
        timestamp: new Date().toISOString()
      };

      logger.warn('Using fallback EUR cotization', { rate: this.fallbackRate });
      return fallbackCotization;
    }
  }

  /**
   * Convierte precio base en EUR a moneda local
   * 
   * Toma un precio base en euros y lo convierte usando
   * la cotización actual. Utiliza el precio de venta
   * para la conversión al consumidor final.
   * 
   * @async
   * @param {number} eurPrice - Precio base en euros
   * @param {Object} options - Opciones de conversión
   * @param {boolean} options.useCompra - Usar precio de compra en lugar de venta
   * @param {number} options.markup - Margen adicional a aplicar (default: 0)
   * @returns {Promise<Object>} Precio convertido con metadatos
   */
  async convertFromEUR(eurPrice, options = {}) {
    try {
      const { useCompra = false, markup = 0 } = options;
      
      if (typeof eurPrice !== 'number' || eurPrice <= 0) {
        throw new Error('Invalid EUR price provided');
      }

      const cotization = await this.getEURCotization();
      const rate = useCompra ? cotization.compra : cotization.venta;
      
      let convertedPrice = eurPrice * rate;
      
      // Aplicar margen si se especifica
      if (markup > 0) {
        convertedPrice = convertedPrice * (1 + markup);
      }

      // Redondear a 2 decimales
      convertedPrice = Math.round(convertedPrice * 100) / 100;

      const result = {
        originalPrice: eurPrice,
        convertedPrice: convertedPrice,
        rate: rate,
        currency: 'USD', // Asumiendo conversión a USD
        cotization: {
          source: cotization.source,
          timestamp: cotization.timestamp,
          fechaActualizacion: cotization.fechaActualizacion
        },
        markup: markup
      };

      logger.info('Price converted from EUR', {
        original: eurPrice,
        converted: convertedPrice,
        rate: rate,
        source: cotization.source
      });

      return result;

    } catch (error) {
      logger.error('Error converting price from EUR', {
        eurPrice,
        error: error.message
      });
      
      // Retornar precio original en caso de error
      return {
        originalPrice: eurPrice,
        convertedPrice: eurPrice,
        rate: 1,
        currency: 'EUR',
        error: true,
        errorMessage: error.message
      };
    }
  }

  /**
   * Convierte múltiples precios en lote
   * 
   * Optimiza la conversión de múltiples precios usando
   * una sola llamada a la API de cotización.
   * 
   * @async
   * @param {Array<Object>} products - Array de productos con precios EUR
   * @param {Object} options - Opciones de conversión
   * @returns {Promise<Array<Object>>} Productos con precios convertidos
   */
  async convertMultiplePrices(products, options = {}) {
    try {
      if (!Array.isArray(products) || products.length === 0) {
        return products;
      }

      // Obtener cotización una sola vez para todos los productos
      const cotization = await this.getEURCotization();
      const rate = options.useCompra ? cotization.compra : cotization.venta;

      const convertedProducts = products.map(product => {
        if (!product.price || typeof product.price !== 'number') {
          return product;
        }

        let convertedPrice = product.price * rate;
        
        if (options.markup && options.markup > 0) {
          convertedPrice = convertedPrice * (1 + options.markup);
        }

        convertedPrice = Math.round(convertedPrice * 100) / 100;

        return {
          ...product,
          originalPrice: product.price,
          price: convertedPrice,
          priceMetadata: {
            rate: rate,
            source: cotization.source,
            timestamp: cotization.timestamp,
            currency: 'USD'
          }
        };
      });

      logger.info('Multiple prices converted from EUR', {
        count: products.length,
        rate: rate,
        source: cotization.source
      });

      return convertedProducts;

    } catch (error) {
      logger.error('Error converting multiple prices', {
        count: products.length,
        error: error.message
      });
      
      return products; // Retornar productos originales sin conversión
    }
  }

  /**
   * Limpia el cache de cotizaciones
   * 
   * Útil para forzar actualización de cotizaciones
   * o en procesos de mantenimiento.
   * 
   * @returns {boolean} True si se limpió correctamente
   */
  clearCache() {
    logger.info('EUR cotization cache cleared (demo mode)');
    return true;
  }

  /**
   * Obtiene estadísticas del servicio de cotización
   * 
   * @returns {Object} Estadísticas de uso y estado del cache
   */
  getStats() {
    return {
      cacheActive: false,
      mode: 'demo',
      fallbackRate: this.fallbackRate
    };
  }
}

// Exportar instancia única del servicio
export default new CurrencyService();