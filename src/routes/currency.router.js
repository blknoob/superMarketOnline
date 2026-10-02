/**
 * @fileoverview Router para endpoints de cotización de monedas
 * 
 * Endpoints API para obtener cotizaciones actuales del EUR
 * y realizar conversiones de precios en tiempo real.
 * Utiliza el servicio de currency para operaciones de conversión.
 * 
 * ENDPOINTS DISPONIBLES:
 * - GET /api/currency/eur - Obtiene cotización actual del EUR
 * - POST /api/currency/convert - Convierte precios de EUR a USD
 * - GET /api/currency/stats - Estadísticas del servicio
 * - DELETE /api/currency/cache - Limpia cache de cotizaciones
 * 
 * CARACTERÍSTICAS:
 * - Respuestas JSON estandarizadas
 * - Manejo de errores HTTP apropiados
 * - Logging de operaciones
 * - Cache integrado para optimización
 * - Rate limiting aplicado
 * 
 * @author Sistema SuperMercado Online
 * @version 1.0.0
 * @since 2026-01-02
 */

import { Router } from 'express';
import currencyService from '../services/currency.service.js';
import { logger } from '../utils/logger.js';
import { rateLimit } from '../middlewares/security.middleware.js';

const router = Router();

/**
 * GET /api/currency/eur
 * Obtiene la cotización actual del EUR
 * 
 * Endpoint público que retorna la cotización actual del EUR
 * con información de cache y fuente de datos.
 * 
 * RESPUESTA:
 * {
 *   "success": true,
 *   "data": {
 *     "compra": 1.05,
 *     "venta": 1.15,
 *     "fechaActualizacion": "2026-01-02T10:30:00.000Z",
 *     "source": "dolarapi",
 *     "timestamp": "2026-01-02T10:30:15.000Z"
 *   }
 * }
 */
router.get('/eur', rateLimit('api'), async (req, res) => {
  try {
    logger.info('EUR cotization requested via API', { 
      ip: req.ip,
      userAgent: req.get('User-Agent') 
    });

    const cotization = await currencyService.getEURCotization();
    
    res.json({
      success: true,
      data: cotization,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting EUR cotization via API', {
      error: error.message,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Error obteniendo cotización del EUR',
      code: 'COTIZATION_ERROR'
    });
  }
});

/**
 * POST /api/currency/convert
 * Convierte precio de EUR a USD
 * 
 * Endpoint para conversión individual de precios.
 * Recibe precio en EUR y retorna precio convertido.
 * 
 * BODY:
 * {
 *   "eurPrice": 10.50,
 *   "markup": 0.15 // opcional
 * }
 * 
 * RESPUESTA:
 * {
 *   "success": true,
 *   "data": {
 *     "originalPrice": 10.50,
 *     "convertedPrice": 12.08,
 *     "rate": 1.05,
 *     "currency": "USD",
 *     "markup": 0.15
 *   }
 * }
 */
router.post('/convert', rateLimit('api'), async (req, res) => {
  try {
    const { eurPrice, markup = 0 } = req.body;

    if (!eurPrice || typeof eurPrice !== 'number' || eurPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Precio en EUR es requerido y debe ser un número positivo',
        code: 'INVALID_EUR_PRICE'
      });
    }

    if (markup && (typeof markup !== 'number' || markup < 0 || markup > 1)) {
      return res.status(400).json({
        success: false,
        message: 'Markup debe ser un número entre 0 y 1',
        code: 'INVALID_MARKUP'
      });
    }

    logger.info('Price conversion requested', { 
      eurPrice, 
      markup,
      ip: req.ip 
    });

    const result = await currencyService.convertFromEUR(eurPrice, { markup });
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error converting price via API', {
      error: error.message,
      body: req.body,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Error convirtiendo precio',
      code: 'CONVERSION_ERROR'
    });
  }
});

/**
 * GET /api/currency/stats
 * Obtiene estadísticas del servicio de cotización
 * 
 * Endpoint administrativo que retorna estadísticas
 * del cache y estado del servicio de cotización.
 */
router.get('/stats', rateLimit('api'), async (req, res) => {
  try {
    logger.info('Currency service stats requested', { ip: req.ip });

    const stats = currencyService.getStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting currency stats', {
      error: error.message,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas',
      code: 'STATS_ERROR'
    });
  }
});

/**
 * DELETE /api/currency/cache
 * Limpia el cache de cotizaciones
 * 
 * Endpoint administrativo para forzar actualización
 * de cotizaciones limpiando el cache actual.
 * 
 * NOTA: En producción, este endpoint debería estar protegido
 * con autenticación de administrador.
 */
router.delete('/cache', rateLimit('strict'), async (req, res) => {
  try {
    logger.info('Currency cache clear requested', { 
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const cleared = currencyService.clearCache();
    
    if (cleared) {
      res.json({
        success: true,
        message: 'Cache de cotizaciones limpiado correctamente',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error limpiando cache de cotizaciones',
        code: 'CACHE_CLEAR_ERROR'
      });
    }

  } catch (error) {
    logger.error('Error clearing currency cache', {
      error: error.message,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;