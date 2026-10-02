/**
 * SISTEMA DE CACHE EN MEMORIA - OPTIMIZACIÓN DE RENDIMIENTO
 * 
 * Utilidad de caching en memoria para mejorar el rendimiento del sistema
 * Implementa caching inteligente con TTL diferenciado por tipo de datos
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Cache especializado para diferentes tipos de datos
 * - TTL (Time To Live) configurable por categoría
 * - Invalidación granular y masiva
 * - Middleware de cache para endpoints HTTP
 * - Estadísticas y monitoreo de cache
 * 
 * TIPOS DE CACHE SOPORTADOS:
 * - products: Catálogo de productos (10 min)
 * - categories: Categorías de productos (30 min)
 * - user: Datos de usuario (15 min)
 * - general: Cache general (5 min)
 * 
 * CARACTERÍSTICAS DE RENDIMIENTO:
 * - useClones: false para mejor performance
 * - deleteOnExpire: true para limpieza automática
 * - checkperiod: 60s para verificación periódica
 * - Prefijos de clave para organización
 * 
 * CASOS DE USO:
 * - Cache de respuestas de API costosas
 * - Almacenamiento temporal de datos frecuentes
 * - Reducción de consultas a base de datos
 * - Mejora de tiempos de respuesta
 * 
 * INTEGRACIÓN:
 * - Middleware HTTP para cache transparente
 * - Funciones especializadas por tipo de dato
 * - Utilidades de administración y monitoreo
 */
import NodeCache from 'node-cache';

/**
 * CONFIGURACIÓN PRINCIPAL DEL CACHE
 * 
 * Instancia principal de NodeCache con configuración optimizada
 * para el rendimiento del sistema de supermercado online
 */
// Configuración del cache
const cache = new NodeCache({
  stdTTL: 300, // 5 minutos por defecto
  checkperiod: 60, // Verificar expiración cada minuto
  useClones: false, // Mejor performance
  deleteOnExpire: true
});

/**
 * CONFIGURACIONES ESPECIALIZADAS POR TIPO DE DATO
 * 
 * Objeto de configuración que define TTL y prefijos
 * específicos para diferentes categorías de datos
 * 
 * ESTRUCTURA:
 * - ttl: Tiempo de vida en segundos
 * - keyPrefix: Prefijo para organización de claves
 * 
 * TIEMPOS OPTIMIZADOS:
 * - products: 10 min (datos que cambian ocasionalmente)
 * - categories: 30 min (datos casi estáticos)
 * - user: 15 min (datos de sesión)
 * - general: 5 min (datos varios)
 */
// Configuraciones específicas para diferentes tipos de datos
const CACHE_CONFIG = {
  products: {
    ttl: 600, // 10 minutos para productos
    keyPrefix: 'products:'
  },
  categories: {
    ttl: 1800, // 30 minutos para categorías
    keyPrefix: 'categories:'
  },
  user: {
    ttl: 900, // 15 minutos para datos de usuario
    keyPrefix: 'user:'
  },
  general: {
    ttl: 300, // 5 minutos general
    keyPrefix: 'general:'
  }
};

/**
 * GENERADOR DE CLAVES DE CACHE
 * 
 * Función helper que genera claves consistentes para el cache
 * Combina prefijos de tipo con identificadores específicos
 * 
 * @param {string} type - Tipo de cache (products, user, etc.)
 * @param {string} identifier - Identificador único del elemento
 * @returns {string} Clave de cache formateada con prefijo
 * 
 * EJEMPLO:
 * generateKey('products', '123') -> 'products:123'
 * generateKey('user', 'john@example.com') -> 'user:john@example.com'
 */
// Función helper para generar claves de cache
const generateKey = (type, identifier) => {
  const prefix = CACHE_CONFIG[type]?.keyPrefix || CACHE_CONFIG.general.keyPrefix;
  return `${prefix}${identifier}`;
};

/**
 * OBTENEDOR DE TTL POR TIPO
 * 
 * Función helper que retorna el TTL apropiado según el tipo de dato
 * Proporciona fallback a configuración general si el tipo no existe
 * 
 * @param {string} type - Tipo de cache
 * @returns {number} TTL en segundos para el tipo especificado
 * 
 * VALORES:
 * - products: 600s (10 min)
 * - categories: 1800s (30 min)
 * - user: 900s (15 min)
 * - general: 300s (5 min) [fallback]
 */
// Función helper para obtener TTL
const getTTL = (type) => {
  return CACHE_CONFIG[type]?.ttl || CACHE_CONFIG.general.ttl;
};

/**
 * CACHE ESPECIALIZADO PARA PRODUCTOS
 * 
 * Objeto con métodos especializados para caching de productos
 * Optimizado para catálogo de productos con TTL de 10 minutos
 * 
 * FUNCIONALIDADES:
 * - Cache individual por ID de producto
 * - Cache completo de catálogo
 * - Invalidación granular y masiva
 * - Administración de claves relacionadas
 * 
 * USO TÍPICO:
 * - Almacenar productos consultados frecuentemente
 * - Cache de listados completos de productos
 * - Reducción de consultas a MongoDB
 */
// Cache para productos
export const productCache = {
  /**
   * OBTENER PRODUCTO DEL CACHE
   * 
   * Recupera un producto específico del cache por su ID
   * 
   * @param {string} productId - ObjectId del producto
   * @returns {Object|undefined} Datos del producto o undefined si no existe
   * 
   * COMPORTAMIENTO:
   * - Retorna datos si están en cache y no han expirado
   * - Retorna undefined si no existe o expiró
   * - No realiza consultas a base de datos
   */
  get: (productId) => {
    const key = generateKey('products', productId);
    return cache.get(key);
  },

  /**
   * ALMACENAR PRODUCTO EN CACHE
   * 
   * Guarda un producto en cache con TTL de 10 minutos
   * 
   * @param {string} productId - ObjectId del producto
   * @param {Object} data - Datos completos del producto
   * @returns {boolean} true si se almacenó correctamente
   * 
   * CARACTERÍSTICAS:
   * - TTL: 600 segundos (10 minutos)
   * - Sobrescribe datos existentes
   * - Generación automática de clave
   */
  set: (productId, data) => {
    const key = generateKey('products', productId);
    const ttl = getTTL('products');
    return cache.set(key, data, ttl);
  },

  /**
   * OBTENER TODOS LOS PRODUCTOS DEL CACHE
   * 
   * Recupera el listado completo de productos si está en cache
   * Utilizado para endpoints de catálogo completo
   * 
   * @returns {Array|undefined} Array de productos o undefined
   * 
   * USO TÍPICO:
   * - Endpoint GET /products sin filtros
   * - Listados completos de catálogo
   * - Reducción de consultas pesadas
   */
  getAll: () => {
    const key = generateKey('products', 'all');
    return cache.get(key);
  },

  /**
   * ALMACENAR LISTADO COMPLETO DE PRODUCTOS
   * 
   * Guarda el catálogo completo en cache
   * 
   * @param {Array} products - Array completo de productos
   * @returns {boolean} true si se almacenó correctamente
   * 
   * VENTAJAS:
   * - Evita consultas pesadas de catálogo completo
   * - TTL optimizado para listados
   * - Clave especializada 'products:all'
   */
  setAll: (products) => {
    const key = generateKey('products', 'all');
    const ttl = getTTL('products');
    return cache.set(key, products, ttl);
  },

  /**
   * INVALIDAR PRODUCTO ESPECÍFICO
   * 
   * Elimina un producto y el listado completo del cache
   * Se ejecuta cuando un producto es modificado
   * 
   * @param {string} productId - ID del producto a invalidar
   * 
   * COMPORTAMIENTO:
   * - Elimina cache del producto individual
   * - Elimina cache del listado completo
   * - Asegura consistencia de datos
   * 
   * CASOS DE USO:
   * - Actualización de producto
   * - Cambio de precio o stock
   * - Eliminación de producto
   */
  invalidate: (productId) => {
    const key = generateKey('products', productId);
    const allKey = generateKey('products', 'all');
    cache.del([key, allKey]);
  },

  /**
   * INVALIDAR TODOS LOS PRODUCTOS
   * 
   * Limpia completamente el cache de productos
   * Operación masiva para reseteo completo
   * 
   * FUNCIONALIDAD:
   * - Busca todas las claves con prefijo 'products:'
   * - Elimina todas las claves encontradas
   * - Operación segura (verifica existencia)
   * 
   * CASOS DE USO:
   * - Actualizaciones masivas de catálogo
   * - Mantenimiento programado
   * - Reset de cache por inconsistencias
   */
  invalidateAll: () => {
    const keys = cache.keys().filter(key => key.startsWith(CACHE_CONFIG.products.keyPrefix));
    if (keys.length > 0) {
      cache.del(keys);
    }
  }
};

/**
 * CACHE ESPECIALIZADO PARA USUARIOS
 * 
 * Objeto con métodos para caching de datos de usuario
 * TTL optimizado de 15 minutos para datos de sesión
 * 
 * FUNCIONALIDADES:
 * - Cache de perfiles de usuario
 * - Datos de sesión temporal
 * - Invalidación individual
 * - Optimización de consultas de usuario
 * 
 * USO TÍPICO:
 * - Datos de perfil frecuentemente consultados
 * - Información de sesión activa
 * - Reducción de consultas de autenticación
 */
// Cache para usuarios
export const userCache = {
  /**
   * OBTENER USUARIO DEL CACHE
   * 
   * Recupera datos de usuario del cache por ID
   * 
   * @param {string} userId - ObjectId del usuario
   * @returns {Object|undefined} Datos del usuario o undefined
   * 
   * DATOS TÍPICOS:
   * - Perfil de usuario sin contraseña
   * - Preferencias y configuraciones
   * - Datos de sesión temporal
   */
  get: (userId) => {
    const key = generateKey('user', userId);
    return cache.get(key);
  },

  /**
   * ALMACENAR USUARIO EN CACHE
   * 
   * Guarda datos de usuario con TTL de 15 minutos
   * 
   * @param {string} userId - ObjectId del usuario
   * @param {Object} data - Datos del usuario (sin contraseña)
   * @returns {boolean} true si se almacenó correctamente
   * 
   * SEGURIDAD:
   * - No almacenar contraseñas
   * - Filtrar datos sensibles
   * - TTL apropiado para sesión
   */
  set: (userId, data) => {
    const key = generateKey('user', userId);
    const ttl = getTTL('user');
    return cache.set(key, data, ttl);
  },

  /**
   * INVALIDAR USUARIO ESPECÍFICO
   * 
   * Elimina datos de usuario del cache
   * Se ejecuta al actualizar perfil o cerrar sesión
   * 
   * @param {string} userId - ID del usuario a invalidar
   * 
   * CASOS DE USO:
   * - Actualización de perfil
   * - Cambio de rol o permisos
   * - Logout de usuario
   */
  invalidate: (userId) => {
    const key = generateKey('user', userId);
    cache.del(key);
  }
};

/**
 * CACHE GENERAL DE PROPÓSITO MULTIPLE
 * 
 * Sistema de cache flexible para datos diversos del sistema
 * TTL configurable y claves personalizables
 * 
 * FUNCIONALIDADES:
 * - Cache de datos diversos
 * - TTL personalizable por elemento
 * - Claves flexibles definidas por usuario
 * - Fallback a configuración general
 * 
 * CASOS DE USO:
 * - Configuraciones del sistema
 * - Datos temporales de procesamiento
 * - Resultados de cálculos complejos
 * - Cache de APIs externas
 */
// Cache general
export const generalCache = {
  /**
   * OBTENER DATO GENERAL DEL CACHE
   * 
   * Recupera cualquier tipo de dato del cache general
   * 
   * @param {string} key - Clave personalizada del dato
   * @returns {any|undefined} Datos almacenados o undefined
   * 
   * FLEXIBILIDAD:
   * - Acepta cualquier tipo de clave
   * - Retorna cualquier tipo de dato
   * - Prefijo automático 'general:'
   */
  get: (key) => {
    const fullKey = generateKey('general', key);
    return cache.get(fullKey);
  },

  /**
   * ALMACENAR DATO GENERAL
   * 
   * Guarda cualquier dato con TTL personalizable
   * 
   * @param {string} key - Clave personalizada
   * @param {any} data - Datos a almacenar
   * @param {number|null} customTTL - TTL personalizado o null para default
   * @returns {boolean} true si se almacenó correctamente
   * 
   * FLEXIBILIDAD:
   * - TTL personalizable por elemento
   * - Fallback a TTL general (5 min)
   * - Soporte para cualquier tipo de dato
   */
  set: (key, data, customTTL = null) => {
    const fullKey = generateKey('general', key);
    const ttl = customTTL || getTTL('general');
    return cache.set(fullKey, data, ttl);
  },

  /**
   * INVALIDAR DATO GENERAL
   * 
   * Elimina un elemento específico del cache general
   * 
   * @param {string} key - Clave del elemento a eliminar
   * 
   * USO:
   * - Limpieza selectiva de cache
   * - Actualización de datos específicos
   * - Mantenimiento granular
   */
  invalidate: (key) => {
    const fullKey = generateKey('general', key);
    cache.del(fullKey);
  }
};

/**
 * UTILIDADES DE ADMINISTRACIÓN DEL CACHE
 * 
 * Conjunto de herramientas para administración y monitoreo del cache
 * Funciones de utilidad para operaciones avanzadas
 * 
 * FUNCIONALIDADES:
 * - Limpieza completa del sistema
 * - Estadísticas de rendimiento
 * - Verificación de existencia
 * - Inspección de TTL restante
 * 
 * USO ADMINISTRATIVO:
 * - Monitoreo de performance
 * - Debugging de cache
 * - Mantenimiento del sistema
 * - Optimización de configuraciones
 */
// Funciones de utilidad
export const cacheUtils = {
  /**
   * LIMPIAR TODO EL CACHE
   * 
   * Elimina completamente todos los datos del cache
   * Operación de reseteo total del sistema
   * 
   * CASOS DE USO:
   * - Mantenimiento programado
   * - Reset por inconsistencias
   * - Liberación de memoria
   * - Desarrollo y testing
   * 
   * WARNING: Operación irreversible
   */
  // Limpiar todo el cache
  clearAll: () => {
    cache.flushAll();
  },

  /**
   * OBTENER ESTADÍSTICAS DEL CACHE
   * 
   * Retorna métricas de rendimiento y uso del cache
   * 
   * @returns {Object} Estadísticas completas del cache
   * 
   * METRICAS INCLUIDAS:
   * - hits: Número de aciertos
   * - misses: Número de fallos
   * - keys: Número de claves activas
   * - ksize: Tamaño de claves
   * - vsize: Tamaño de valores
   * 
   * USO:
   * - Monitoreo de performance
   * - Optimización de configuraciones
   * - Análisis de eficiencia
   */
  // Obtener estadísticas del cache
  getStats: () => {
    return cache.getStats();
  },

  /**
   * VERIFICAR EXISTENCIA DE CLAVE
   * 
   * Verifica si una clave específica existe en el cache
   * 
   * @param {string} type - Tipo de cache
   * @param {string} identifier - Identificador del elemento
   * @returns {boolean} true si la clave existe
   * 
   * UTILIDAD:
   * - Verificación previa a operaciones
   * - Lógica condicional de cache
   * - Debugging y monitoreo
   */
  // Verificar si una clave existe
  has: (type, identifier) => {
    const key = generateKey(type, identifier);
    return cache.has(key);
  },

  /**
   * OBTENER TTL RESTANTE
   * 
   * Retorna el tiempo de vida restante de una clave
   * 
   * @param {string} type - Tipo de cache
   * @param {string} identifier - Identificador del elemento
   * @returns {number} TTL restante en milisegundos
   * 
   * VALORES DE RETORNO:
   * - > 0: TTL restante en ms
   * - 0: Clave no tiene TTL (permanente)
   * - undefined: Clave no existe
   * 
   * USO:
   * - Monitoreo de expiración
   * - Lógica de renovación
   * - Debugging temporal
   */
  // Obtener TTL restante de una clave
  getTTL: (type, identifier) => {
    const key = generateKey(type, identifier);
    return cache.getTtl(key);
  }
};

/**
 * MIDDLEWARE DE CACHE PARA ENDPOINTS HTTP
 * 
 * Middleware que proporciona caching transparente para rutas Express
 * Intercepita requests/responses para implementar cache automático
 * 
 * FUNCIONALIDADES:
 * - Cache automático de responses exitosas
 * - Generación dinámica de claves de cache
 * - TTL configurable por endpoint
 * - Indicador de datos en cache
 * - Bypass opcional de cache
 * 
 * PROCESO:
 * 1. Verificar si existe cache para la request
 * 2. Retornar datos en cache si existen
 * 3. Interceptar response para cachear resultado
 * 4. Almacenar solo responses exitosas
 * 5. Continuar con el pipeline normal
 * 
 * @param {string} type - Tipo de cache a utilizar
 * @param {function|string} identifierFn - Función o string para generar identificador
 * @param {Object} options - Opciones de configuración
 * @param {number} options.ttl - TTL personalizado
 * @param {boolean} options.skipCache - Saltar cache completamente
 * @returns {Function} Middleware de Express configurado
 * 
 * RESPONSE CACHEADA:
 * {
 *   success: true,
 *   data: [...],
 *   cached: true,
 *   timestamp: '2026-01-02T...
 * }
 */
// Middleware para cache de respuestas HTTP
export const cacheMiddleware = (type, identifierFn, options = {}) => {
  return (req, res, next) => {
    const identifier = typeof identifierFn === 'function' ? identifierFn(req) : identifierFn;
    const cacheKey = generateKey(type, identifier);

    // Intentar obtener del cache
    const cachedData = cache.get(cacheKey);
    if (cachedData && !options.skipCache) {
      return res.json({
        success: true,
        data: cachedData,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Guardar la función original send
    const originalSend = res.json;

    // Sobrescribir res.json para cachear la respuesta
    res.json = function(data) {
      // Cachear solo respuestas exitosas
      if (data.success !== false && !options.skipCache) {
        const ttl = options.ttl || getTTL(type);
        cache.set(cacheKey, data.data || data, ttl);
      }

      // Restaurar y ejecutar la función original
      res.json = originalSend;
      return res.json(data);
    };

    next();
  };
};

export default cache;